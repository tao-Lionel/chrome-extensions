document.addEventListener("DOMContentLoaded", async () => {
  // 加载设置
  const data = await chrome.storage.local.get("userSettings");
  if (data.userSettings) {
    document.getElementById("apiKey").value = data.userSettings.apiKey || "";
    document.getElementById("githubToken").value =
      data.userSettings.githubToken || "";
    document.getElementById("gistId").value =
      data.userSettings.githubGistId || "";
  }

  // 保存设置
  document.getElementById("saveBtn").addEventListener("click", async () => {
    const apiKey = document.getElementById("apiKey").value.trim();
    const githubToken = document.getElementById("githubToken").value.trim();
    const gistId = document.getElementById("gistId").value.trim();

    await chrome.storage.local.set({
      userSettings: {
        apiKey,
        githubToken,
        githubGistId: gistId, // 用户通常不应修改此项，除非手动连接现有 Gist
        minWordLength: 3,
        autoHighlight: true,
      },
    });

    const status = document.getElementById("status");
    status.innerText = "设置已保存！";
    setTimeout(() => (status.innerText = ""), 2000);
  });

  // 打开仪表盘
  document.getElementById("openDashboard").addEventListener("click", () => {
    chrome.tabs.create({ url: "dashboard/dashboard.html" });
  });
});
