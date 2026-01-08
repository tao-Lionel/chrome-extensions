document.addEventListener("DOMContentLoaded", () => {
  loadVocabulary();
  loadSentences();
  setupEvents();
});

let allWords = [];
let allSentences = [];
let currentView = "card";
let currentTab = "words";

function setupEvents() {
  document.getElementById("refreshBtn").addEventListener("click", async () => {
    // 触发后台强制同步
    await chrome.runtime.sendMessage({ action: "forceSync" });
    loadVocabulary();
    loadSentences();
  });

  document.getElementById("viewCardBtn").addEventListener("click", () => {
    currentView = "card";
    renderWords();
  });

  document.getElementById("viewTableBtn").addEventListener("click", () => {
    currentView = "table";
    renderWords();
  });

  document.getElementById("exportBtn").addEventListener("click", exportData);

  const importInput = document.getElementById("importFile");
  document
    .getElementById("importBtn")
    .addEventListener("click", () => importInput.click());
  importInput.addEventListener("change", importData);

  // Tab 切换
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;
      switchTab(tab);
    });
  });
}

function switchTab(tab) {
  currentTab = tab;

  // 更新标签按钮状态
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tab);
  });

  // 切换内容显示
  document.getElementById("wordsTab").style.display = tab === "words" ? "block" : "none";
  document.getElementById("sentencesTab").style.display = tab === "sentences" ? "block" : "none";
}

async function loadVocabulary() {
  const { vocabulary } = await chrome.storage.local.get("vocabulary");
  const totalCountEl = document.getElementById("totalCount");
  const wordCountEl = document.getElementById("wordCount");

  if (!vocabulary) return;

  allWords = Object.values(vocabulary);
  totalCountEl.innerText = allWords.length;
  wordCountEl.innerText = allWords.length;

  // 排序: 默认按 count 降序
  allWords.sort((a, b) => b.count - a.count);

  renderWords();
}

async function loadSentences() {
  const { sentences } = await chrome.storage.local.get("sentences");
  const totalSentencesEl = document.getElementById("totalSentences");
  const sentenceCountEl = document.getElementById("sentenceCount");

  if (!sentences) {
    allSentences = [];
    totalSentencesEl.innerText = 0;
    sentenceCountEl.innerText = 0;
    return;
  }

  allSentences = Object.values(sentences);
  totalSentencesEl.innerText = allSentences.length;
  sentenceCountEl.innerText = allSentences.length;

  // 排序: 按时间戳降序
  allSentences.sort((a, b) => (b.lastReview || b.timestamp) - (a.lastReview || a.timestamp));

  renderSentences();
}

function render() {
  renderWords();
}

function renderWords() {
  const grid = document.getElementById("wordGrid");
  const table = document.getElementById("wordTable");
  const btnCard = document.getElementById("viewCardBtn");
  const btnTable = document.getElementById("viewTableBtn");

  if (currentView === "card") {
    grid.style.display = "grid";
    table.style.display = "none";
    btnCard.classList.remove("secondary");
    btnTable.classList.add("secondary");
    renderCards();
  } else {
    grid.style.display = "none";
    table.style.display = "block";
    btnCard.classList.add("secondary");
    btnTable.classList.remove("secondary");
    renderTable();
  }
}

function renderSentences() {
  const container = document.getElementById("sentenceList");
  container.innerHTML = "";

  if (allSentences.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: #94a3b8; padding: 40px;">
        <p>还没有记录任何句子</p>
        <p style="font-size: 0.9em;">划选句子时会自动翻译并保存</p>
      </div>
    `;
    return;
  }

  allSentences.forEach((sentence) => {
    const card = document.createElement("div");
    card.className = "sentence-card";

    // 渲染关键词
    const keywordsHtml = (sentence.keyWords || []).map(kw =>
      `<span class="keyword-tag" title="${kw.translation || ''}">${kw.word}</span>`
    ).join('');

    // 解析来源URL
    let sourceUrl = sentence.sourceUrl || "";
    let sourceDisplay = "未知来源";
    try {
      const urlObj = new URL(sourceUrl);
      sourceDisplay = urlObj.hostname;
    } catch (e) {
      sourceDisplay = sourceUrl ? "本地来源" : "未知来源";
    }

    const reviewCount = sentence.reviewCount || 0;
    const date = new Date(sentence.lastReview || sentence.timestamp).toLocaleString();

    card.innerHTML = `
      <div class="sentence-original">${escapeHtml(sentence.original)}</div>
      <div class="sentence-translation">${escapeHtml(sentence.translation)}</div>
      ${keywordsHtml ? `<div class="sentence-keywords">${keywordsHtml}</div>` : ''}
      <div class="sentence-meta">
        <span>复习 ${reviewCount} 次 • ${date}</span>
        ${sourceUrl ? `<a href="${escapeHtml(sourceUrl)}" target="_blank" class="sentence-source" title="${escapeHtml(sourceUrl)}">${sourceDisplay}</a>` : ''}
      </div>
    `;

    // 点击复制功能
    card.addEventListener("click", () => {
      const textToCopy = `${sentence.original}\n${sentence.translation}`;
      navigator.clipboard.writeText(textToCopy).then(() => {
        showToast("已复制到剪贴板");
      }).catch(() => {
        showToast("复制失败");
      });
    });

    container.appendChild(card);
  });
}

// HTML 转义函数防止 XSS
function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function renderCards() {
  const grid = document.getElementById("wordGrid");
  grid.innerHTML = "";

  allWords.forEach((word) => {
    const card = document.createElement("div");
    card.className = `word-card ${getHeatmapClass(word.count)}`;

    // 构建卡片 HTML
    card.innerHTML = `
      <div class="card-header">
        <span class="card-lemma">${word.lemma}</span>
        <span class="card-count">${word.count}</span>
      </div>
      <div style="font-size: 0.9em; margin-bottom: 8px;">${
        word.phonetic || ""
      } ${word.translation}</div>
      <div style="font-size: 0.8em; color: #94a3b8;">
        上次复习: ${new Date(word.lastReview).toLocaleDateString()}
      </div>
      <div class="contexts-list">
        ${renderContexts(word)}
      </div>
    `;

    // 交互：点击展开
    card.addEventListener("click", () => {
      card.classList.toggle("expanded");
    });

    grid.appendChild(card);
  });
}

function renderTable() {
  const tbody = document.getElementById("wordTableBody");
  tbody.innerHTML = "";

  allWords.forEach((word) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="font-weight: bold; color: #2563eb;">${word.lemma}</td>
      <td>${word.phonetic || ""}</td>
      <td>${word.translation}</td>
      <td>
        <span class="card-count" style="display:inline-block">${
          word.count
        }</span>
      </td>
      <td style="color: #64748b; font-size: 0.9em;">${new Date(
        word.lastReview
      ).toLocaleDateString()}</td>
      <td>
        <button class="action-btn toggle-context">查看语境</button>
      </td>
    `;

    // 语境行
    const contextRow = document.createElement("tr");
    contextRow.className = "context-row";
    contextRow.innerHTML = `
      <td colspan="6" class="context-content">
        ${renderContexts(word)}
      </td>
    `;

    // 绑定事件
    tr.querySelector(".toggle-context").addEventListener("click", (e) => {
      e.stopPropagation();
      contextRow.classList.toggle("expanded");
      const btn = e.target;
      btn.innerText = contextRow.classList.contains("expanded")
        ? "收起语境"
        : "查看语境";
    });

    tbody.appendChild(tr);
    tbody.appendChild(contextRow);
  });
}

function renderContexts(word) {
  return word.contexts
    .map(
      (c) => `
    <div class="context-item" style="margin-bottom: 4px;">
      "${c.sentence.replace(
        new RegExp(word.variants.join("|"), "gi"),
        (match) => `<b>${match}</b>`
      )}"
    </div>
  `
    )
    .join("");
}

function getHeatmapClass(count) {
  if (count >= 6) return "level-3";
  if (count >= 3) return "level-2";
  return "level-1";
}

async function exportData() {
  const { vocabulary } = await chrome.storage.local.get("vocabulary");
  const blob = new Blob([JSON.stringify(vocabulary, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `english_helper_backup_${new Date()
    .toISOString()
    .slice(0, 10)}.json`;
  a.click();
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target.result);
      // 简单覆盖或合并逻辑，这里采用覆盖并提示
      if (confirm("导入将覆盖/合并现有数据，确定吗？")) {
        // 这里可以复用 background 中的 merge 逻辑，但为了简单，直接从 local 读取后合并再存回
        const { vocabulary: current } = await chrome.storage.local.get(
          "vocabulary"
        );
        // 简单的合并策略：保留 count 更高的
        // 注意：生产环境应使用 shared library 进行合并
        const merged = { ...current, ...data };
        await chrome.storage.local.set({ vocabulary: merged });
        showToast("导入成功");
        loadVocabulary();
      }
    } catch (err) {
      showToast("JSON 文件格式错误");
    }
  };
  reader.readAsText(file);
}

function showToast(msg) {
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
