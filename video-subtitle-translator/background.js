// background.js
// Service Worker for Video Subtitle Translator

// 导入 DeepSeek API 库
importScripts("lib/deepSeek.js");

// 初始化默认设置
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["settings", "translationCache"], (result) => {
    if (!result.settings) {
      chrome.storage.local.set({
        settings: {
          apiKey: "",
          autoTranslate: true,
          showOriginal: true,
          targetLang: "zh-CN",
          fontSize: 18,
          platforms: {
            youtube: true,
            twitter: true,
          },
        },
      });
    }
    if (!result.translationCache) {
      chrome.storage.local.set({ translationCache: {} });
    }
  });
});

// 监听来自 Content Script 的翻译请求
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "translateSubtitle") {
    handleTranslation(request)
      .then(sendResponse)
      .catch((error) => sendResponse({ error: error.message }));
    return true; // 保持消息通道开启以进行异步响应
  }

  if (request.action === "batchTranslate") {
    handleBatchTranslation(request)
      .then(sendResponse)
      .catch((error) => sendResponse({ error: error.message }));
    return true;
  }
});

/**
 * 处理单个字幕翻译请求
 */
async function handleTranslation({ text, targetLang }) {
  const data = await chrome.storage.local.get("settings");
  const settings = data.settings;

  if (!settings?.apiKey) {
    throw new Error("API Key 未配置，请在设置中配置 DeepSeek API Key");
  }

  if (!settings?.autoTranslate) {
    throw new Error("自动翻译已关闭");
  }

  const lang = targetLang || settings?.targetLang || "zh-CN";

  try {
    const translation = await translateWithRetry(
      text,
      lang,
      settings.apiKey
    );
    return { success: true, translation };
  } catch (error) {
    console.error("Translation error:", error);
    throw error;
  }
}

/**
 * 处理批量翻译请求
 */
async function handleBatchTranslation({ subtitles, targetLang }) {
  const data = await chrome.storage.local.get("settings");
  const settings = data.settings;

  if (!settings?.apiKey) {
    throw new Error("API Key 未配置");
  }

  const lang = targetLang || settings?.targetLang || "zh-CN";

  try {
    const translations = await self.DeepSeekAPI.translateBatch(
      subtitles,
      lang,
      settings.apiKey
    );
    return { success: true, translations };
  } catch (error) {
    console.error("Batch translation error:", error);
    throw error;
  }
}

/**
 * 带重试的翻译逻辑（指数退避）
 */
async function translateWithRetry(
  text,
  targetLang,
  apiKey,
  maxRetries = 3
) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await self.DeepSeekAPI.translateSubtitle(
        text,
        targetLang,
        apiKey
      );
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;

      // 指数退避
      const delay = Math.pow(2, attempt) * 500;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
