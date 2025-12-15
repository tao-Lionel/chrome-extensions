// 导入库文件 (MV3 Service Worker 方式)
importScripts("lib/deepSeek.js", "lib/github.js");

// Configure Side Panel behavior
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

// 初始化默认设置
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["userSettings", "vocabulary"], (result) => {
    if (!result.userSettings) {
      chrome.storage.local.set({
        userSettings: {
          apiKey: "",
          githubToken: "",
          githubGistId: "",
          minWordLength: 3,
          autoHighlight: true,
          whitelistedDomains: [], // Empty means active on all domains (or inactive? User said "Only in whitelist... plugin effective". Usually empty whitelist = all allowed OR nothing allowed. Given the phrasing "Only in this whitelist", it implies if list exists, strict mode. If list is empty, default to all? 
          // Re-reading user: "I need a whitelist setting, ONLY in this whitelist, the plugin is effective."
          // This implies if the feature is enabled, it defaults to restricted mode.
          // However, for backward compatibility, if the list is empty/undefined, it should probably work everywhere or nowhere?
          // Let's assume: If the list is empty, it works everywhere (default behavior). If list has items, it restricts.
          // Wait, user said "Only in this whitelist". If I set it to empty array, and logic is "if whitelist not empty, check it", then empty whitelist = works everywhere.
          // This is the most user-friendly approach.
          // But if user WANTS to restrict to 0 domains (disable), they can just disable the extension.
          // So: Empty list = Active everywhere (default). Populated list = Active only on those domains.
          // Actually, let's look at the code structure.
        },
      });
    }
    if (!result.vocabulary) {
      chrome.storage.local.set({ vocabulary: {} });
    }
  });
});

// ---------------- 核心业务逻辑: 查词与保存 ----------------

// 监听来自 Content Script 或 Command 的请求
chrome.commands.onCommand.addListener((command) => {
  if (command === "save-word") {
    // 获取当前标签页并发送消息触发 content script 抓取文本
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "captureSelection" });
      }
    });
  }
});

// 处理消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "processWord") {
    handleWordProcessing(request).then(sendResponse);
    return true; // 保持消息通道开启以进行异步响应
  }

  if (request.action === "forceSync") {
    performSync(true).then(() => sendResponse({ status: "ok" }));
    return true;
  }
});

async function handleWordProcessing({ text, contextSentence, url }) {
  const data = await chrome.storage.local.get(["vocabulary", "userSettings"]);
  const vocab = data.vocabulary || {};
  const settings = data.userSettings;
  const rawWord = text.trim();

  // 1. 验证
  if (rawWord.length < (settings.minWordLength || 3) || !isNaN(rawWord)) {
    return { error: "单词过短或无效" };
  }

  // 2. 本地模糊搜索 (解决痛点 A & C)
  let foundKey = null;

  // 直接匹配 Lemma
  if (vocab[rawWord.toLowerCase()]) {
    foundKey = rawWord.toLowerCase();
  } else {
    // 遍历搜索变体 (Variants)
    const keys = Object.keys(vocab);
    for (const k of keys) {
      if (
        vocab[k].variants &&
        vocab[k].variants.includes(rawWord.toLowerCase())
      ) {
        foundKey = k;
        break;
      }
    }
  }

  // 3. 构建上下文对象
  const newContext = {
    sentence: contextSentence,
    url: url,
    timestamp: Date.now(),
  };

  let resultData = null;

  if (foundKey) {
    // Case A: 命中缓存 (Token Efficient)
    const entry = vocab[foundKey];
    entry.count += 1;
    entry.lastReview = Date.now();

    // 避免存储完全重复的句子
    const contextExists = entry.contexts.some(
      (c) => c.sentence === contextSentence
    );
    if (!contextExists) {
      entry.contexts.push(newContext);
    }

    // 如果发现新的变体，加入列表
    if (!entry.variants.includes(rawWord.toLowerCase())) {
      entry.variants.push(rawWord.toLowerCase());
    }

    vocab[foundKey] = entry;
    resultData = entry;
    await chrome.storage.local.set({ vocabulary: vocab });
    console.log(`[Cache Hit] Updated entry for ${foundKey}`);
  } else {
    // Case B: 未命中，调用 DeepSeek (Morphology-Aware)
    try {
      const aiResult = await self.DeepSeekAPI.analyzeWord(
        rawWord,
        contextSentence,
        settings.apiKey
      );

      const lemma = aiResult.lemma.toLowerCase();

      // 再次检查 AI 返回的 Lemma 是否已存在 (防止 "running" -> "run", 但 "run" 已存在的情况)
      if (vocab[lemma]) {
        // 合并到现有 Lemma
        const entry = vocab[lemma];
        entry.count += 1;
        entry.lastReview = Date.now();
        entry.contexts.push(newContext);
        if (!entry.variants.includes(rawWord.toLowerCase()))
          entry.variants.push(rawWord.toLowerCase());
        vocab[lemma] = entry;
        resultData = entry;
      } else {
        // 创建新条目
        resultData = {
          lemma: lemma,
          translation: aiResult.translation,
          phonetic: aiResult.phonetic,
          count: 1,
          firstAdded: Date.now(),
          lastReview: Date.now(),
          contexts: [newContext],
          variants: aiResult.variants || [lemma, rawWord.toLowerCase()],
        };
        // 确保当前形态在变体中
        if (!resultData.variants.includes(rawWord.toLowerCase())) {
          resultData.variants.push(rawWord.toLowerCase());
        }

        vocab[lemma] = resultData;
      }

      await chrome.storage.local.set({ vocabulary: vocab });
      console.log(`[API Call] Created/Updated entry for ${lemma}`);
    } catch (error) {
      return { error: error.message };
    }
  }

  return { success: true, data: resultData };
}

// ---------------- 同步逻辑 (Gist) ----------------

let syncDebounceTimer = null;

// 监听存储变化进行自动同步 (防抖 30s)
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "local" && changes.vocabulary) {
    clearTimeout(syncDebounceTimer);
    syncDebounceTimer = setTimeout(() => {
      performSync(false); // Push
    }, 30000);
  }
});

// 浏览器启动时拉取
chrome.runtime.onStartup.addListener(() => {
  performSync(true); // Pull & Merge
});

async function performSync(isPull = false) {
  const { userSettings, vocabulary } = await chrome.storage.local.get([
    "userSettings",
    "vocabulary",
  ]);
  const token = userSettings?.githubToken;

  if (!token) return; // 未配置 Token

  try {
    let gistId = userSettings.githubGistId;
    let remoteData = {};

    // 1. 获取或创建 Gist
    if (!gistId) {
      // 首次创建
      const newGist = await self.GithubSync.createGist(token, vocabulary || {});
      gistId = newGist.id;
      // 更新本地设置中的 ID
      await chrome.storage.local.set({
        userSettings: { ...userSettings, githubGistId: gistId },
      });
    } else {
      // 获取远程数据
      const gist = await self.GithubSync.getGist(token, gistId);
      if (gist && gist.files["english_helper_vocab.json"]) {
        const content = gist.files["english_helper_vocab.json"].content;
        remoteData = JSON.parse(content);
      }
    }

    let finalData = vocabulary || {};

    // 2. 合并逻辑 (简单版: 如果是拉取操作，或者远程有数据)
    if (isPull && Object.keys(remoteData).length > 0) {
      finalData = mergeVocabulary(vocabulary || {}, remoteData);
      // 更新本地
      await chrome.storage.local.set({ vocabulary: finalData });
      console.log("Synced: Pulled & Merged from Gist");
    } else {
      // 3. 推送逻辑 (覆盖远程，因为我们已经合并了或者这是最新的本地更改)
      // 注意：在多设备高频并发下需要更复杂的锁机制，这里采用简单的 "Last Write Wins" 但因为有 Pull merge 缓解了冲突
      await self.GithubSync.updateGist(token, gistId, finalData);
      console.log("Synced: Pushed to Gist");
    }
  } catch (e) {
    console.error("Sync failed:", e);
  }
}

function mergeVocabulary(local, remote) {
  const merged = { ...local };

  Object.keys(remote).forEach((key) => {
    if (!merged[key]) {
      merged[key] = remote[key];
    } else {
      // 冲突合并
      const localEntry = merged[key];
      const remoteEntry = remote[key];

      // 取较大的计数
      localEntry.count = Math.max(localEntry.count, remoteEntry.count);

      // 合并上下文 (通过句子内容去重)
      const existingSentences = new Set(
        localEntry.contexts.map((c) => c.sentence)
      );
      remoteEntry.contexts.forEach((c) => {
        if (!existingSentences.has(c.sentence)) {
          localEntry.contexts.push(c);
        }
      });

      // 合并变体
      const existingVariants = new Set(localEntry.variants);
      remoteEntry.variants.forEach((v) => {
        if (!existingVariants.has(v)) {
          localEntry.variants.push(v);
        }
      });
    }
  });
  return merged;
}
