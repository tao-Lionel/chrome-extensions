// popup/popup.js

document.addEventListener("DOMContentLoaded", async () => {
  // 加载设置
  const data = await chrome.storage.local.get("settings");
  if (data.settings) {
    const settings = data.settings;

    document.getElementById("apiKey").value = settings.apiKey || "";
    document.getElementById("autoTranslate").checked =
      settings.autoTranslate !== false;
    document.getElementById("showOriginal").checked =
      settings.showOriginal !== false;
    document.getElementById("targetLang").value = settings.targetLang || "zh-CN";
    document.getElementById("fontSize").value = settings.fontSize || 18;
    document.getElementById("enableYouTube").checked =
      settings.platforms?.youtube !== false;
    document.getElementById("enableTwitter").checked =
      settings.platforms?.twitter !== false;
  }

  // 保存设置
  document.getElementById("saveBtn").addEventListener("click", async () => {
    const apiKey = document.getElementById("apiKey").value.trim();
    const autoTranslate = document.getElementById("autoTranslate").checked;
    const showOriginal = document.getElementById("showOriginal").checked;
    const targetLang = document.getElementById("targetLang").value;
    const fontSize = parseInt(document.getElementById("fontSize").value) || 18;
    const enableYouTube = document.getElementById("enableYouTube").checked;
    const enableTwitter = document.getElementById("enableTwitter").checked;

    // 获取现有设置以保留其他字段
    const currentData = await chrome.storage.local.get("settings");
    const currentSettings = currentData.settings || {};

    await chrome.storage.local.set({
      settings: {
        ...currentSettings,
        apiKey,
        autoTranslate,
        showOriginal,
        targetLang,
        fontSize,
        platforms: {
          youtube: enableYouTube,
          twitter: enableTwitter,
        },
      },
    });

    showStatus("设置已保存！", "success");
  });

  // 清空缓存
  document
    .getElementById("clearCacheBtn")
    .addEventListener("click", async () => {
      await chrome.storage.local.set({ translationCache: {} });
      showStatus("缓存已清空", "success");
    });
});

/**
 * 显示状态消息
 */
function showStatus(message, type = "") {
  const status = document.getElementById("status");
  status.textContent = message;
  status.className = "status " + type;

  setTimeout(() => {
    status.textContent = "";
    status.className = "status";
  }, 2000);
}
