// content/twitter.js
// X (Twitter) 平台特定的字幕提取逻辑

/**
 * X/Twitter 字幕提取器类
 */
class TwitterSubtitleExtractor {
  constructor() {
    this.timelineObserver = null;
    this.activeVideos = new Map(); // video -> { observer, container, lastCaption }
    this.isActive = false;
  }

  /**
   * 初始化提取器
   */
  init() {
    // 检查是否启用 Twitter 支持
    chrome.storage.local.get("settings", (data) => {
      if (!data.settings?.platforms?.twitter) {
        console.log("Video Subtitle Translator: X/Twitter 支持已禁用");
        return;
      }

      this.observeTimeline();
      this.isActive = true;
      console.log("Video Subtitle Translator: X/Twitter 字幕提取器已启动");
    });
  }

  /**
   * 观察 timeline 中的视频元素
   */
  observeTimeline() {
    // 首先处理已有的视频
    this.processExistingVideos();

    // 然后设置观察器监听新视频
    this.timelineObserver = new MutationObserver((mutations) => {
      this.processExistingVideos();
    });

    this.timelineObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * 处理现有视频元素
   */
  processExistingVideos() {
    const videos = document.querySelectorAll("video");

    videos.forEach((video) => {
      if (!this.activeVideos.has(video) && this.isValidVideo(video)) {
        this.setupVideoObserver(video);
      }
    });

    // 清理已移除的视频
    this.cleanupRemovedVideos();
  }

  /**
   * 检查视频是否有效（在容器内且有源）
   */
  isValidVideo(video) {
    return (
      video.src ||
      video.querySelector("source") ||
      video.closest('[data-testid="videoComponent"]')
    );
  }

  /**
   * 为单个视频设置观察器
   */
  setupVideoObserver(video) {
    // 查找视频容器
    const videoContainer =
      video.closest('[data-testid="videoComponent"]') ||
      video.closest('[data-testid="videoPlayer"]') ||
      video.closest("div[data-testid]");

    if (!videoContainer) {
      // 尝试从父元素查找
      const parent = video.parentElement;
      if (parent) {
        this.activeVideos.set(video, {
          observer: null,
          container: parent,
          lastCaption: "",
        });
        this.setupTextTrackMonitor(video);
      }
      return;
    }

    // 创建字幕观察器
    const captionObserver = new MutationObserver(() => {
      this.checkForCaptions(video, videoContainer);
    });

    captionObserver.observe(videoContainer, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    this.activeVideos.set(video, {
      observer: captionObserver,
      container: videoContainer,
      lastCaption: "",
    });

    // 同时设置 TextTrack 监听（作为备选方案）
    this.setupTextTrackMonitor(video);

    console.log("Video Subtitle Translator: 为视频设置观察器", video);
  }

  /**
   * 检查容器中的字幕
   */
  checkForCaptions(video, container) {
    const videoData = this.activeVideos.get(video);
    if (!videoData) return;

    // X/Twitter 的字幕选择器（多种可能）
    const captionSelectors = [
      '[data-testid="videoCaption"]',
      '[data-testid="tweetTextCaption"]',
      ".css-caption-text",
      'span[dir="auto"][class*="caption"]',
      'span[aria-label*="caption"]',
      // 通用字幕容器
      ".ytp-caption-segment",
    ];

    let captionText = "";

    for (const selector of captionSelectors) {
      const captionElement = container.querySelector(selector);
      if (captionElement) {
        captionText = captionElement.textContent.trim();
        if (captionText) break;
      }
    }

    // 如果没找到，尝试从 video 元素的 TextTrack 获取
    if (!captionText && video.textTracks) {
      for (const track of video.textTracks) {
        if (
          (track.kind === "subtitles" || track.kind === "captions") &&
          track.mode === "showing"
        ) {
          const activeCues = track.activeCues;
          if (activeCues && activeCues.length > 0) {
            captionText = Array.from(activeCues)
              .map((cue) => cue.text)
              .join(" ")
              .trim();
            break;
          }
        }
      }
    }

    if (captionText && captionText !== videoData.lastCaption) {
      videoData.lastCaption = captionText;
      this.onNewCaption(captionText, container);
    }
  }

  /**
   * 设置 TextTrack 监听（备选方案）
   */
  setupTextTrackMonitor(video) {
    if (!video.textTracks) return;

    // 监听 track 列表变化
    video.textTracks.addEventListener("addtrack", (e) => {
      const track = e.track;
      if (track.kind === "subtitles" || track.kind === "captions") {
        track.addEventListener("cuechange", () => {
          const activeCues = track.activeCues;
          if (activeCues && activeCues.length > 0) {
            const captionText = Array.from(activeCues)
              .map((cue) => cue.text)
              .join(" ")
              .trim();

            if (captionText) {
              const container = video.closest('[data-testid="videoComponent"]') ||
                               video.closest('[data-testid="videoPlayer"]') ||
                               video.parentElement;
              this.onNewCaption(captionText, container);
            }
          }
        });
      }
    });

    // 为已有的 track 设置监听
    for (const track of video.textTracks) {
      if (track.kind === "subtitles" || track.kind === "captions") {
        track.addEventListener("cuechange", () => {
          const activeCues = track.activeCues;
          if (activeCues && activeCues.length > 0) {
            const captionText = Array.from(activeCues)
              .map((cue) => cue.text)
              .join(" ")
              .trim();

            if (captionText) {
              const container = video.closest('[data-testid="videoComponent"]') ||
                               video.closest('[data-testid="videoPlayer"]') ||
                               video.parentElement;
              this.onNewCaption(captionText, container);
            }
          }
        });
      }
    }
  }

  /**
   * 新字幕回调
   */
  onNewCaption(text, container) {
    SubtitleTranslator.translate(text, container);
  }

  /**
   * 清理已移除的视频
   */
  cleanupRemovedVideos() {
    for (const [video, data] of this.activeVideos.entries()) {
      if (!document.contains(video)) {
        if (data.observer) {
          data.observer.disconnect();
        }
        this.activeVideos.delete(video);
      }
    }
  }

  /**
   * 清理资源
   */
  cleanup() {
    if (this.timelineObserver) {
      this.timelineObserver.disconnect();
      this.timelineObserver = null;
    }

    for (const [video, data] of this.activeVideos.entries()) {
      if (data.observer) {
        data.observer.disconnect();
      }
    }
    this.activeVideos.clear();
    this.isActive = false;
  }
}

// 创建全局实例
let twitterExtractor = null;

// 页面加载完成后初始化
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    twitterExtractor = new TwitterSubtitleExtractor();
    twitterExtractor.init();
  });
} else {
  twitterExtractor = new TwitterSubtitleExtractor();
  twitterExtractor.init();
}

// X/Twitter 使用大量动态加载，延迟初始化
setTimeout(() => {
  if (!twitterExtractor) {
    twitterExtractor = new TwitterSubtitleExtractor();
    twitterExtractor.init();
  } else if (twitterExtractor.activeVideos.size === 0) {
    // 如果还没有找到视频，重新处理
    twitterExtractor.processExistingVideos();
  }
}, 2000);

// 页面卸载时清理
window.addEventListener("beforeunload", () => {
  if (twitterExtractor) {
    twitterExtractor.cleanup();
  }
});
