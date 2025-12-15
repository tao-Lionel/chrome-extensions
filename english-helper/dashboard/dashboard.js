document.addEventListener("DOMContentLoaded", () => {
  loadVocabulary();
  setupEvents();
});

function setupEvents() {
  document.getElementById("refreshBtn").addEventListener("click", async () => {
    // 触发后台强制同步
    await chrome.runtime.sendMessage({ action: "forceSync" });
    loadVocabulary();
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
  const grid = document.getElementById("wordGrid");
  const totalCountEl = document.getElementById("totalCount");

  grid.innerHTML = "";
  if (!vocabulary) return;

  const words = Object.values(vocabulary);
  totalCountEl.innerText = words.length;

  // 排序: 默认按 count 降序
  words.sort((a, b) => b.count - a.count);

  words.forEach((word) => {
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
        ${word.contexts
          .map(
            (c) => `
          <div class="context-item">
            "${c.sentence.replace(
              new RegExp(word.variants.join("|"), "gi"),
              (match) => `<b>${match}</b>`
            )}"
          </div>
        `
          )
          .join("")}
      </div>
    `;

    // 交互：点击展开
    card.addEventListener("click", () => {
      card.classList.toggle("expanded");
    });

    grid.appendChild(card);
  });
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
