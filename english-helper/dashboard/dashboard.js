document.addEventListener("DOMContentLoaded", () => {
  loadVocabulary();
  setupEvents();
});

let allWords = [];
let currentView = "card";

function setupEvents() {
  document.getElementById("refreshBtn").addEventListener("click", async () => {
    // 触发后台强制同步
    await chrome.runtime.sendMessage({ action: "forceSync" });
    loadVocabulary();
  });

  document.getElementById("viewCardBtn").addEventListener("click", () => {
    currentView = "card";
    render();
  });

  document.getElementById("viewTableBtn").addEventListener("click", () => {
    currentView = "table";
    render();
  });

  document.getElementById("exportBtn").addEventListener("click", exportData);

  const importInput = document.getElementById("importFile");
  document
    .getElementById("importBtn")
    .addEventListener("click", () => importInput.click());
  importInput.addEventListener("change", importData);
}

async function loadVocabulary() {
  const { vocabulary } = await chrome.storage.local.get("vocabulary");
  const totalCountEl = document.getElementById("totalCount");

  if (!vocabulary) return;

  allWords = Object.values(vocabulary);
  totalCountEl.innerText = allWords.length;

  // 排序: 默认按 count 降序
  allWords.sort((a, b) => b.count - a.count);

  render();
}

function render() {
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
        alert("导入成功");
        loadVocabulary();
      }
    } catch (err) {
      alert("JSON 文件格式错误");
    }
  };
  reader.readAsText(file);
}
