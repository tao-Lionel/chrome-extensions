// lib/deepSeek.js
// DeepSeek API 封装，用于视频字幕翻译
// 在 Service Worker 中通过 importScripts 加载

const SUBTITLE_SYSTEM_PROMPT = (targetLang) => `You are a professional subtitle translator.
Translate the following subtitle text to ${targetLang}.
Rules:
1. Keep translation concise and natural for video subtitles
2. Preserve meaning but adapt for readability
3. Return ONLY the translated text, no explanations
4. Keep proper nouns and technical terms when appropriate`;

self.DeepSeekAPI = {
  /**
   * 翻译单个字幕文本
   * @param {string} text - 要翻译的字幕文本
   * @param {string} targetLang - 目标语言代码 (如 'zh-CN', 'ja')
   * @param {string} apiKey - DeepSeek API Key
   * @returns {Promise<string>} 翻译后的文本
   */
  async translateSubtitle(text, targetLang, apiKey) {
    if (!apiKey) throw new Error("API Key 未配置");
    if (!text || !text.trim()) return "";

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: SUBTITLE_SYSTEM_PROMPT(targetLang),
          },
          { role: "user", content: text },
        ],
        temperature: 0.1,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || "Translation failed");
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  },

  /**
   * 批量翻译字幕（用于预加载整个字幕轨道）
   * @param {Array<{text: string, start: number, end: number}>} subtitles - 字幕数组
   * @param {string} targetLang - 目标语言代码
   * @param {string} apiKey - DeepSeek API Key
   * @returns {Promise<Array<string>>} 翻译后的文本数组
   */
  async translateBatch(subtitles, targetLang, apiKey) {
    if (!apiKey) throw new Error("API Key 未配置");

    const BATCH_SIZE = 10;
    const batches = [];

    for (let i = 0; i < subtitles.length; i += BATCH_SIZE) {
      batches.push(subtitles.slice(i, i + BATCH_SIZE));
    }

    const translations = new Array(subtitles.length);

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      const batchText = batch
        .map((s, i) => `[${batchIndex * BATCH_SIZE + i}] ${s.text}`)
        .join("\n");

      const response = await fetch(
        "https://api.deepseek.com/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
              {
                role: "system",
                content: `Translate these numbered subtitles to ${targetLang}.
                     Keep the same numbering format [0], [1], etc.
                     Return ONLY translations, one per line with numbers.`,
              },
              { role: "user", content: batchText },
            ],
            temperature: 0.1,
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || "Batch translation failed");
      }

      const data = await response.json();
      const translatedLines = data.choices[0].message.content.split("\n");

      // 解析带编号的翻译结果
      translatedLines.forEach((line) => {
        const match = line.match(/\[(\d+)\]\s*(.+)/);
        if (match) {
          translations[parseInt(match[1])] = match[2];
        }
      });

      // 批次之间限流
      if (batchIndex < batches.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    return translations;
  },
};
