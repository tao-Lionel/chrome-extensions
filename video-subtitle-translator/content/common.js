// content/common.js
// 通用字幕翻译和覆盖层管理模块

/**
 * 字幕翻译器类
 * 负责防抖、缓存检查、翻译请求
 */
class SubtitleTranslator {
  static debounceTimer = null;
  static lastText = "";
  static DEBOUNCE_MS = 300;
  static currentOverlay = null;

  /**
   * 翻译字幕文本
   * @param {string} text - 字幕文本
   * @param {HTMLElement} container - 视频容器元素
   */
  static async translate(text, container) {
    // 避免重复翻译相同文本
    if (text === this.lastText) return;
    this.lastText = text;

    // 防抖处理
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(async () => {
      await this.performTranslation(text, container);
    }, this.DEBOUNCE_MS);
  }

  /**
   * 执行翻译
   */
  static async performTranslation(text, container) {
    const data = await chrome.storage.local.get("settings");
    const settings = data.settings;

    if (!settings?.autoTranslate) return;
    if (!settings?.apiKey) {
      console.warn("Video Subtitle Translator: API Key 未配置");
      return;
    }

    // 检查缓存
    const cacheKey = this.hashText(text);
    const cache = await chrome.storage.local.get("translationCache");
    const cached = cache.translationCache?.[cacheKey];

    if (cached) {
      this.displayTranslation(text, cached.translation, container, settings);
      return;
    }

    // 请求翻译
    try {
      const response = await chrome.runtime.sendMessage({
        action: "translateSubtitle",
        text: text,
        targetLang: settings?.targetLang || "zh-CN",
      });

      if (response.translation) {
        // 更新缓存
        await this.updateCache(cacheKey, text, response.translation);
        this.displayTranslation(text, response.translation, container, settings);
      }
    } catch (error) {
      console.error("Video Subtitle Translator:", error.message);
    }
  }

  /**
   * 显示翻译结果
   */
  static displayTranslation(original, translation, container, settings) {
    // 获取或创建覆盖层
    if (!this.currentOverlay || !document.contains(this.currentOverlay.container)) {
      this.currentOverlay = new SubtitleOverlay();
      this.currentOverlay.create(container);
    }

    this.currentOverlay.update(
      original,
      translation,
      settings?.showOriginal !== false
    );
  }

  /**
   * 更新翻译缓存
   */
  static async updateCache(cacheKey, original, translation) {
    const cache = await chrome.storage.local.get("translationCache");
    const newCache = cache.translationCache || {};

    newCache[cacheKey] = {
      original,
      translation,
      timestamp: Date.now(),
    };

    // 限制缓存大小（LRU）
    const keys = Object.keys(newCache);
    if (keys.length > 500) {
      keys.sort((a, b) => newCache[a].timestamp - newCache[b].timestamp);
      keys.slice(0, 100).forEach((k) => delete newCache[k]);
    }

    await chrome.storage.local.set({ translationCache: newCache });
  }

  /**
   * 生成文本哈希（用于缓存键）
   */
  static hashText(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i);
      hash = hash & hash;
    }
    return "vst_" + Math.abs(hash).toString(36);
  }

  /**
   * 重置状态
   */
  static reset() {
    this.lastText = "";
    clearTimeout(this.debounceTimer);
  }
}

/**
 * 字幕覆盖层类
 * 负责创建和管理悬浮翻译显示
 */
class SubtitleOverlay {
  constructor() {
    this.container = null;
    this.originalLine = null;
    this.translatedLine = null;
  }

  /**
   * 创建覆盖层
   * @param {HTMLElement} videoContainer - 视频容器元素
   */
  create(videoContainer) {
    // 创建容器
    this.container = document.createElement("div");
    this.container.className = "vst-subtitle-overlay";

    // 原文字幕行
    this.originalLine = document.createElement("div");
    this.originalLine.className = "vst-original";

    // 翻译字幕行
    this.translatedLine = document.createElement("div");
    this.translatedLine.className = "vst-translated";

    this.container.appendChild(this.originalLine);
    this.container.appendChild(this.translatedLine);

    // 定位覆盖层
    this.positionOverlay(videoContainer);
    videoContainer.appendChild(this.container);

    return this;
  }

  /**
   * 定位覆盖层
   */
  positionOverlay(videoContainer) {
    // 根据不同平台调整位置
    const isYouTube =
      videoContainer.querySelector(".html5-video-player") !== null ||
      document.querySelector(".html5-video-player") !== null;

    this.container.style.position = "absolute";
    this.container.style.bottom = isYouTube ? "80px" : "60px";
    this.container.style.left = "50%";
    this.container.style.transform = "translateX(-50%)";
    this.container.style.zIndex = "9999";
  }

  /**
   * 更新字幕内容
   * @param {string} original - 原文字幕
   * @param {string} translated - 翻译字幕
   * @param {boolean} showOriginal - 是否显示原文
   */
  update(original, translated, showOriginal = true) {
    if (showOriginal) {
      this.originalLine.textContent = original;
      this.originalLine.style.display = "block";
    } else {
      this.originalLine.style.display = "none";
    }
    this.translatedLine.textContent = translated;

    // 确保覆盖层可见
    this.container.style.display = "block";
  }

  /**
   * 隐藏覆盖层
   */
  hide() {
    if (this.container) {
      this.container.style.display = "none";
    }
  }

  /**
   * 显示覆盖层
   */
  show() {
    if (this.container) {
      this.container.style.display = "block";
    }
  }
}

// 导出供平台特定模块使用
if (typeof window !== "undefined") {
  window.SubtitleTranslator = SubtitleTranslator;
  window.SubtitleOverlay = SubtitleOverlay;
}
