// content/youtube.js
// YouTube 平台特定的字幕提取逻辑

/**
 * YouTube 字幕提取器类
 */
class YouTubeSubtitleExtractor {
  constructor() {
    this.captionObserver = null;
    this.lastCaptionText = "";
    this.videoElement = null;
    this.playerElement = null;
    this.urlObserver = null;
    this.isActive = false;
  }

  /**
   * 初始化提取器
   */
  init() {
    // 检查是否启用 YouTube 支持
    chrome.storage.local.get("settings", (data) => {
      if (!data.settings?.platforms?.youtube) {
        console.log("Video Subtitle Translator: YouTube 支持已禁用");
        return;
      }

      this.waitForPlayer().then(() => {
        this.setupCaptionObserver();
        this.setupUrlObserver();
        this.isActive = true;
        console.log("Video Subtitle Translator: YouTube 字幕提取器已启动");
      });
    });
  }

  /**
   * 等待视频播放器加载
   */
  waitForPlayer() {
    return new Promise((resolve) => {
      const checkPlayer = setInterval(() => {
        const player = document.querySelector(".html5-video-player");
        const video = document.querySelector("video.html5-main-video");
        if (player && video) {
          clearInterval(checkPlayer);
          this.playerElement = player;
          this.videoElement = video;
          resolve(player);
        }
      }, 500);

      // 超时保护
      setTimeout(() => clearInterval(checkPlayer), 10000);
    });
  }

  /**
   * 设置字幕观察器
   */
  setupCaptionObserver() {
    // 首先尝试查找字幕容器
    let captionContainer = document.querySelector(
      ".ytp-caption-window-container"
    );

    if (captionContainer) {
      this.attachCaptionObserver(captionContainer);
    } else {
      // 如果字幕容器不存在，等待其出现（用户可能稍后开启字幕）
      this.waitForCaptionContainer();
    }
  }

  /**
   * 等待字幕容器出现
   */
  waitForCaptionContainer() {
    const observer = new MutationObserver(() => {
      const captionContainer = document.querySelector(
        ".ytp-caption-window-container"
      );
      if (captionContainer) {
        observer.disconnect();
        this.attachCaptionObserver(captionContainer);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * 附加字幕观察器
   */
  attachCaptionObserver(captionContainer) {
    if (this.captionObserver) {
      this.captionObserver.disconnect();
    }

    this.captionObserver = new MutationObserver(() => {
      this.handleCaptionChange();
    });

    this.captionObserver.observe(captionContainer, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    console.log("Video Subtitle Translator: 字幕观察器已附加");
  }

  /**
   * 处理字幕变化
   */
  handleCaptionChange() {
    // 提取当前字幕文本
    const segments = document.querySelectorAll(".ytp-caption-segment");
    const captionText = Array.from(segments)
      .map((seg) => seg.textContent)
      .join(" ")
      .trim();

    if (captionText && captionText !== this.lastCaptionText) {
      this.lastCaptionText = captionText;
      this.onNewCaption(captionText);
    }
  }

  /**
   * 新字幕回调
   */
  onNewCaption(text) {
    // 查找视频容器
    const videoContainer = this.videoElement?.closest(".html5-video-player");
    if (videoContainer) {
      SubtitleTranslator.translate(text, videoContainer);
    }
  }

  /**
   * 设置 URL 观察器（处理 YouTube SPA 导航）
   */
  setupUrlObserver() {
    let lastUrl = location.href;

    this.urlObserver = new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        // URL 变化说明导航到新视频，重新初始化
        this.reinit();
      }
    });

    // YouTube 使用 title 变化作为导航标志
    const titleElement = document.querySelector("title");
    if (titleElement) {
      this.urlObserver.observe(titleElement, {
        subtree: true,
        characterData: true,
        childList: true,
      });
    }
  }

  /**
   * 重新初始化（用于 SPA 导航后）
   */
  reinit() {
    console.log("Video Subtitle Translator: 检测到页面导航，重新初始化...");
    this.cleanup();
    SubtitleTranslator.reset();
    setTimeout(() => this.init(), 1000);
  }

  /**
   * 清理资源
   */
  cleanup() {
    if (this.captionObserver) {
      this.captionObserver.disconnect();
      this.captionObserver = null;
    }
    if (this.urlObserver) {
      this.urlObserver.disconnect();
      this.urlObserver = null;
    }
    this.isActive = false;
  }
}

// 创建全局实例
let youtubeExtractor = null;

// 页面加载完成后初始化
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    youtubeExtractor = new YouTubeSubtitleExtractor();
    youtubeExtractor.init();
  });
} else {
  youtubeExtractor = new YouTubeSubtitleExtractor();
  youtubeExtractor.init();
}

// 页面卸载时清理
window.addEventListener("beforeunload", () => {
  if (youtubeExtractor) {
    youtubeExtractor.cleanup();
  }
});
