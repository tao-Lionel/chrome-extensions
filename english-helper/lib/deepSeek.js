// lib/deepSeek.js
// 注意: 在 Service Worker 中通过 importScripts 加载，因此附加到全局 self

const SYSTEM_PROMPT = `
You are a dictionary API. Analyze the target word in the provided context sentence.
Return a STRICT JSON object (no markdown, no backticks):
{
  "lemma": "root form of the word (e.g. running -> run, better -> good)",
  "translation": "Concise Chinese translation suitable for this specific context (max 10 chars)",
  "phonetic": "IPA phonetic symbol",
  "variants": ["list", "of", "common", "forms", "including", "tense", "plural"]
}
`;

self.DeepSeekAPI = {
  async analyzeWord(word, contextSentence, apiKey) {
    if (!apiKey) throw new Error("API Key 未配置");

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Target Word: "${word}"\nContext Sentence: "${contextSentence}"`,
          },
        ],
        temperature: 0.1, // 低温度以保证输出格式稳定
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || "DeepSeek API 调用失败");
    }

    const data = await response.json();
    try {
      const content = data.choices[0].message.content;
      return JSON.parse(content);
    } catch (e) {
      console.error("JSON Parse Error:", data);
      throw new Error("AI 返回格式错误");
    }
  },
};
