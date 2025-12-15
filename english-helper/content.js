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
    renderResult(response.data, rect.left, rect.bottom + window.scrollY);
  }
}

// ---------------- UI Helpers ----------------

let currentCard = null;

function showFloatingCard(x, y, content, isLoading = false) {
  if (currentCard) document.body.removeChild(currentCard);

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
      document.body.removeChild(card);
      currentCard = null;
      document.removeEventListener("click", closeHandler);
    }
  };

  // 延迟绑定，防止立即触发
  setTimeout(() => {
    document.addEventListener("click", closeHandler);
  }, 100);
}

function renderResult(data, x, y) {
  const html = `
    <div>
      <span class="eah-word">${data.lemma}</span>
      <span class="eah-phonetic">${data.phonetic || ""}</span>
    </div>
    <div class="eah-translation">${data.translation}</div>
    <div class="eah-context-note">
      已记录: ${data.count} 次 | 上下文已保存
    </div>
  `;
  showFloatingCard(x, y, html);
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

// ---------------- Highlighting Logic ----------------

// 初始化
chrome.storage.local.get(["userSettings", "vocabulary"], (result) => {
  if (result.userSettings?.autoHighlight) {
    highlightStoredWords(result.vocabulary);
  }
});

// 监听存储变化
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "local" && (changes.vocabulary || changes.userSettings)) {
    chrome.storage.local.get(["userSettings", "vocabulary"], (result) => {
      if (result.userSettings?.autoHighlight) {
        highlightStoredWords(result.vocabulary);
      }
    });
  }
});

function highlightStoredWords(vocabulary) {
  if (!vocabulary) return;

  const words = new Set();
  // Map variant -> lemma to easily look up data later if needed
  const variantToLemma = {};

  Object.values(vocabulary).forEach((entry) => {
    if (entry.variants) {
      entry.variants.forEach((v) => {
        const lower = v.toLowerCase();
        words.add(lower);
        variantToLemma[lower] = entry;
      });
    } else {
      const lower = entry.lemma.toLowerCase();
      words.add(lower);
      variantToLemma[lower] = entry;
    }
  });

  if (words.size === 0) return;

  // Sort by length descending to match longest words first
  const sortedWords = Array.from(words).sort((a, b) => b.length - a.length);
  // Escape regex special characters
  const escapedWords = sortedWords.map((w) =>
    w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );

  // Use a simpler approach to avoid massive regex if too many words,
  // but for < 1000 words, a single regex is usually fine.
  // We'll use word boundaries.
  const pattern = new RegExp(`\\b(${escapedWords.join("|")})\\b`, "gi");

  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function (node) {
        // Skip script, style, etc.
        if (
          node.parentElement &&
          [
            "SCRIPT",
            "STYLE",
            "NOSCRIPT",
            "TEXTAREA",
            "INPUT",
            "CODE",
            "PRE",
          ].includes(node.parentElement.tagName)
        ) {
          return NodeFilter.FILTER_REJECT;
        }
        // Skip already highlighted
        if (
          node.parentElement &&
          node.parentElement.classList.contains("eah-highlight")
        ) {
          return NodeFilter.FILTER_REJECT;
        }
        // Skip our own UI
        if (
          node.parentElement &&
          (node.parentElement.id === "eah-floating-card" ||
            node.parentElement.closest("#eah-floating-card"))
        ) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );

  const nodesToReplace = [];

  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.nodeValue.trim() && pattern.test(node.nodeValue)) {
      nodesToReplace.push(node);
    }
    // Reset lastIndex because test() advances it if global
    pattern.lastIndex = 0;
  }

  nodesToReplace.forEach((node) => {
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;

    // We need to re-run the match to get all occurrences
    node.nodeValue.replace(pattern, (match, p1, offset) => {
      // Text before match
      if (offset > lastIndex) {
        fragment.appendChild(
          document.createTextNode(node.nodeValue.substring(lastIndex, offset))
        );
      }

      // The match
      const span = document.createElement("span");
      span.className = "eah-highlight";
      span.textContent = match;

      // Add click listener
      span.addEventListener("click", (e) => {
        e.stopPropagation();
        const lemmaData = variantToLemma[match.toLowerCase()];
        if (lemmaData) {
          const rect = span.getBoundingClientRect();
          renderResult(lemmaData, rect.left, rect.bottom + window.scrollY);
        }
      });

      fragment.appendChild(span);
      lastIndex = offset + match.length;
      return match;
    });

    // Remaining text
    if (lastIndex < node.nodeValue.length) {
      fragment.appendChild(
        document.createTextNode(node.nodeValue.substring(lastIndex))
      );
    }
    node.parentNode.replaceChild(fragment, node);
  });
}
