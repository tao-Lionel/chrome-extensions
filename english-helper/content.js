// 监听来自 Background 的 "captureSelection" 消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "captureSelection") {
    captureAndProcess();
  }
});

async function captureAndProcess() {
  const selection = window.getSelection();
  const text = selection.toString().trim();

  if (!text) {
    showToast("请先选择一个单词");
    return;
  }

  // 1. 上下文捕获 (获取完整句子)
  let contextSentence = text;
  if (selection.anchorNode && selection.anchorNode.parentElement) {
    const fullText = selection.anchorNode.parentElement.innerText;
    // 简单的句子切分逻辑：查找包含该词的句子
    // 实际项目中可能需要更复杂的正则
    const sentences = fullText.split(/[.!?。！？]/);
    const found = sentences.find((s) => s.includes(text));
    if (found) contextSentence = found.trim();
  }

  // 高亮选中内容，用于定位 UI
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  // 显示 Loading UI
  showFloatingCard(
    rect.left,
    rect.bottom + window.scrollY,
    "Thinking...",
    true
  );

  // 2. 发送给后台处理
  const response = await chrome.runtime.sendMessage({
    action: "processWord",
    text: text,
    contextSentence: contextSentence,
    url: window.location.href,
  });

  // 3. 渲染结果
  if (response.error) {
    showFloatingCard(
      rect.left,
      rect.bottom + window.scrollY,
      `错误: ${response.error}`
    );
  } else {
    renderResult(
      response.data,
      rect.left,
      rect.bottom + window.scrollY,
      text,
      contextSentence
    );
  }
}

// ---------------- UI Helpers ----------------

let currentCard = null;

function showFloatingCard(x, y, content, isLoading = false) {
  if (currentCard) {
    if (currentCard.parentNode) document.body.removeChild(currentCard);
    currentCard = null;
  }

  const card = document.createElement("div");
  card.id = "eah-floating-card";
  card.style.left = `${x}px`;
  card.style.top = `${y + 10}px`; // Add some margin

  if (isLoading) {
    card.innerHTML = `<span class="eah-loading">正在分析语境...</span>`;
  } else {
    card.innerHTML = content;
  }

  document.body.appendChild(card);
  currentCard = card;

  // 点击外部关闭
  const closeHandler = (e) => {
    if (!card.contains(e.target)) {
      if (card.parentNode) document.body.removeChild(card);
      currentCard = null;
      document.removeEventListener("click", closeHandler);
    }
  };

  // 延迟绑定，防止立即触发
  setTimeout(() => {
    document.addEventListener("click", closeHandler);
  }, 100);

  return card;
}

function renderResult(data, x, y, originalText = null, contextSentence = null) {
  const isMastered = data.status === "mastered";

  // Format translation: replace | with <br> and maybe bullet points
  const formattedTranslation = data.translation
    .split("|")
    .map((t) => `<div>• ${t.trim()}</div>`)
    .join("");

  const html = `
    <div class="eah-card-header">
      <div class="eah-word-group">
        <span class="eah-word">${data.lemma}</span>
        <span class="eah-phonetic">${data.phonetic || ""}</span>
        <button class="eah-icon-btn eah-tts-btn" title="朗读">🔊</button>
      </div>
      <button class="eah-master-btn ${isMastered ? "mastered" : ""}" title="${
    isMastered ? "标记为未掌握" : "标记为已掌握"
  }">
         ${isMastered ? "✅ 已掌握" : "⭕ 标记掌握"}
      </button>
    </div>
    <div class="eah-translation">${formattedTranslation}</div>
    <div class="eah-context-note">
      已记录: ${data.count} 次 | 上下文已保存
      <span class="eah-reanalyze-btn" title="语境不符？强制AI重新分析" style="cursor: pointer; color: #2196F3; margin-left: 10px; font-size: 0.9em; text-decoration: underline;">
        语境不符?
      </span>
    </div>
  `;

  const card = showFloatingCard(x, y, html);

  // Bind Events
  if (card) {
    // TTS
    const ttsBtn = card.querySelector(".eah-tts-btn");
    if (ttsBtn) {
      ttsBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        playTTS(data.lemma);
      });
    }

    // Mastered
    const masterBtn = card.querySelector(".eah-master-btn");
    if (masterBtn) {
      masterBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        await toggleMastered(data.lemma, masterBtn);
      });
    }

    // Re-analyze
    const reanalyzeBtn = card.querySelector(".eah-reanalyze-btn");
    if (reanalyzeBtn) {
      reanalyzeBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        showFloatingCard(x, y, "AI 正在重新分析...", true);

        const response = await chrome.runtime.sendMessage({
          action: "processWord",
          text: originalText || data.lemma,
          contextSentence: contextSentence || "",
          url: window.location.href,
          forceRefresh: true,
        });

        if (response.error) {
          showFloatingCard(x, y, `错误: ${response.error}`);
        } else {
          renderResult(
            response.data,
            x,
            y,
            originalText || data.lemma,
            contextSentence
          );
        }
      });
    }
  }
}

function playTTS(text) {
  if ("speechSynthesis" in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  } else {
    showToast("浏览器不支持 TTS");
  }
}

async function toggleMastered(lemma, btnElement) {
  const result = await chrome.storage.local.get(["vocabulary"]);
  const vocab = result.vocabulary || {};

  if (vocab[lemma]) {
    const currentStatus = vocab[lemma].status || "learning";
    const newStatus = currentStatus === "learning" ? "mastered" : "learning";

    vocab[lemma].status = newStatus;
    await chrome.storage.local.set({ vocabulary: vocab });

    // Update UI immediately
    const isMastered = newStatus === "mastered";
    btnElement.classList.toggle("mastered", isMastered);
    btnElement.innerHTML = isMastered ? "✅ 已掌握" : "⭕ 标记掌握";
    btnElement.title = isMastered ? "标记为未掌握" : "标记为已掌握";
  }
}

function showToast(msg) {
  // 简单的提示框
  const toast = document.createElement("div");
  toast.innerText = msg;
  toast.style.cssText = `
    position: fixed; top: 20px; right: 20px; 
    background: #333; color: #fff; padding: 10px 20px; 
    border-radius: 4px; z-index: 999999;
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}

// ---------------- Highlighting Logic (Refactored) ----------------

class Highlighter {
  constructor() {
    this.vocabulary = null;
    this.variantToLemma = {};
    this.regex = null;
    this.processingQueue = [];
    this.isProcessing = false;
    this.debounceTimer = null;
    this.CHUNK_SIZE = 50; // 每次处理的节点数

    // 绑定方法以保持 this 上下文
    this.init = this.init.bind(this);
    this.onStorageChange = this.onStorageChange.bind(this);
    this.processChunk = this.processChunk.bind(this);
  }

  async init() {
    // 初始加载
    const result = await chrome.storage.local.get([
      "userSettings",
      "vocabulary",
    ]);

    // Check whitelist
    const settings = result.userSettings || {};
    const whitelist = settings.whitelistedDomains || [];

    if (whitelist.length > 0) {
      const hostname = window.location.hostname;
      const isAllowed = whitelist.some(
        (domain) => hostname === domain || hostname.endsWith("." + domain)
      );

      if (!isAllowed) {
        console.log(
          "English Helper: Domain not whitelisted, skipping initialization."
        );
        return;
      }
    }

    if (settings.autoHighlight) {
      this.updateVocabulary(result.vocabulary);
      this.scanAndHighlight();
    }

    // 监听变化
    chrome.storage.onChanged.addListener(this.onStorageChange);
  }

  onStorageChange(changes, namespace) {
    if (namespace !== "local") return;
    if (!changes.vocabulary && !changes.userSettings) return;

    // 防抖处理 (1000ms)
    if (this.debounceTimer) clearTimeout(this.debounceTimer);

    this.debounceTimer = setTimeout(() => {
      chrome.storage.local.get(["userSettings", "vocabulary"], (result) => {
        // 如果用户关闭了自动高亮，则不进行操作 (或者可以考虑清除高亮，这里暂且保留不操作)
        if (result.userSettings?.autoHighlight) {
          this.updateVocabulary(result.vocabulary);
          this.scanAndHighlight();
        }
      });
    }, 1000);
  }

  updateVocabulary(vocabulary) {
    if (!vocabulary) return;
    this.vocabulary = vocabulary;
    this.variantToLemma = {};
    const words = new Set();

    // 1. 提取所有变体并建立索引
    Object.values(vocabulary).forEach((entry) => {
      // 过滤已掌握的单词
      if (entry.status === "mastered") return;

      const list = entry.variants || [entry.lemma];
      list.forEach((v) => {
        const lower = v.toLowerCase();
        if (lower.length > 1) {
          // 忽略单字母单词，避免误伤
          words.add(lower);
          this.variantToLemma[lower] = entry;
        }
      });
    });

    if (words.size === 0) {
      this.regex = null;
      return;
    }

    // 2. 构建全局正则 (按长度降序排列)
    // Single Pass Regex 核心
    const sortedWords = Array.from(words).sort((a, b) => b.length - a.length);
    const escapedWords = sortedWords.map((w) =>
      w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    );
    this.regex = new RegExp(`\\b(${escapedWords.join("|")})\\b`, "gi");
  }

  scanAndHighlight() {
    // 0. 清理无效高亮 (例如已掌握的单词)
    this.cleanupHighlights();

    if (!this.regex) return;

    // 取消之前的处理任务
    this.processingQueue = [];
    this.isProcessing = false;

    // 3. 高效遍历 (TreeWalker)
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // 黑名单过滤
          if (!node.parentElement) return NodeFilter.FILTER_REJECT;

          const tag = node.parentElement.tagName;
          const forbiddenTags = [
            "SCRIPT",
            "STYLE",
            "NOSCRIPT",
            "TEXTAREA",
            "INPUT",
            "CODE",
            "PRE",
            "SVG",
            "IMG",
            "BUTTON",
            "SELECT",
            "OPTION",
            "OPTGROUP",
            "KBD",
            "VAR",
            "SAMP",
            "IFRAME",
            "FRAME",
            "OBJECT",
            "EMBED",
            "VIDEO",
            "AUDIO",
            "CANVAS",
            "MAP",
            "AREA",
            "METER",
            "PROGRESS",
            "HEAD",
            "TITLE",
            "META",
          ];

          if (forbiddenTags.includes(tag)) return NodeFilter.FILTER_REJECT;
          if (node.parentElement.isContentEditable)
            return NodeFilter.FILTER_REJECT;

          // 跳过已高亮节点和插件UI
          if (node.parentElement.classList.contains("eah-highlight"))
            return NodeFilter.FILTER_REJECT;
          if (node.parentElement.closest("#eah-floating-card"))
            return NodeFilter.FILTER_REJECT;

          return NodeFilter.FILTER_ACCEPT;
        },
      }
    );

    // 收集需要处理的节点
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.nodeValue.trim()) {
        // 重置 lastIndex
        this.regex.lastIndex = 0;
        if (this.regex.test(node.nodeValue)) {
          this.processingQueue.push(node);
        }
      }
    }

    // 启动分片处理
    if (this.processingQueue.length > 0 && !this.isProcessing) {
      this.isProcessing = true;
      // 优先使用 requestIdleCallback
      if (window.requestIdleCallback) {
        window.requestIdleCallback(this.processChunk);
      } else {
        setTimeout(this.processChunk, 0);
      }
    }
  }

  cleanupHighlights() {
    const highlights = document.querySelectorAll(".eah-highlight");
    highlights.forEach((span) => {
      const word = span.textContent.toLowerCase();
      // 检查该单词是否仍在当前的 variantToLemma 中
      // updateVocabulary 已被调用，variantToLemma 中只包含 learning 状态的单词
      if (!this.variantToLemma[word]) {
        const parent = span.parentNode;
        if (parent) {
          const text = document.createTextNode(span.textContent);
          parent.replaceChild(text, span);
          parent.normalize(); // 合并相邻文本节点
        }
      }
    });
  }

  // 4. 时间分片 (Time Slicing)
  processChunk(deadline) {
    if (!this.isProcessing) return;

    // 如果是 setTimeout 回退，deadline 可能不存在，模拟一个
    const deadlineTime = deadline ? deadline.timeRemaining() : 10;

    // 只要有剩余时间且队列不为空，就继续处理
    while ((deadlineTime > 0 || !deadline) && this.processingQueue.length > 0) {
      // 检查是否 deadline 已过期 (保留 1ms 缓冲)
      if (deadline && deadline.timeRemaining() <= 1) break;

      const nodesToProcess = this.processingQueue.splice(0, this.CHUNK_SIZE);
      nodesToProcess.forEach((node) => this.highlightNode(node));
    }

    if (this.processingQueue.length > 0) {
      // 继续下一帧
      if (window.requestIdleCallback) {
        window.requestIdleCallback(this.processChunk);
      } else {
        setTimeout(this.processChunk, 0);
      }
    } else {
      this.isProcessing = false;
    }
  }

  highlightNode(node) {
    // 再次检查节点是否仍在文档中 (可能在异步过程中被移除)
    if (!node.parentNode) return;

    const text = node.nodeValue;
    this.regex.lastIndex = 0; // 确保正则从头匹配

    // 如果不匹配直接返回 (虽然 scan 阶段查过，但双重保险)
    if (!this.regex.test(text)) return;

    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    let match;

    // 重置正则状态进行捕获
    this.regex.lastIndex = 0;

    // 使用 exec 循环匹配
    while ((match = this.regex.exec(text)) !== null) {
      // 添加匹配前的文本
      if (match.index > lastIndex) {
        fragment.appendChild(
          document.createTextNode(text.substring(lastIndex, match.index))
        );
      }

      // 创建高亮节点
      const word = match[0];
      const span = document.createElement("span");
      span.className = "eah-highlight";
      span.textContent = word;

      // 绑定事件
      span.addEventListener("click", (e) => {
        e.stopPropagation();
        const lemmaData = this.variantToLemma[word.toLowerCase()];
        if (lemmaData) {
          const rect = span.getBoundingClientRect();

          // Get context
          let contextSentence = word;
          if (span.parentElement) {
            const fullText = span.parentElement.innerText;
            const sentences = fullText.split(/[.!?。！？]/);
            const found = sentences.find((s) =>
              s.toLowerCase().includes(word.toLowerCase())
            );
            if (found) contextSentence = found.trim();
          }

          renderResult(
            lemmaData,
            rect.left,
            rect.bottom + window.scrollY,
            word,
            contextSentence
          );
        }
      });

      fragment.appendChild(span);
      lastIndex = this.regex.lastIndex;
    }

    // 添加剩余文本
    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
    }

    // 替换原节点
    node.parentNode.replaceChild(fragment, node);
  }
}

// 实例化并启动
const highlighter = new Highlighter();
highlighter.init();
