// lib/github.js
// 同样附加到 self 以便在 background 中使用

const GIST_FILENAME = "english_helper_vocab.json";

self.GithubSync = {
  async getGist(token, gistId) {
    const response = await fetch(`https://api.github.com/gists/${gistId}`, {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });
    if (!response.ok) return null;
    return response.json();
  },

  async createGist(token, data) {
    const response = await fetch("https://api.github.com/gists", {
      method: "POST",
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        description: "English AI Helper Vocabulary Data",
        public: false,
        files: {
          [GIST_FILENAME]: {
            content: JSON.stringify(data, null, 2),
          },
        },
      }),
    });
    return response.json();
  },

  async updateGist(token, gistId, data) {
    await fetch(`https://api.github.com/gists/${gistId}`, {
      method: "PATCH",
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        files: {
          [GIST_FILENAME]: {
            content: JSON.stringify(data, null, 2),
          },
        },
      }),
    });
  },
};
