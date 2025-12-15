document.addEventListener("DOMContentLoaded", async () => {
  // 加载设置
  const data = await chrome.storage.local.get("userSettings");
  if (data.userSettings) {
    document.getElementById("apiKey").value = data.userSettings.apiKey || "";
    document.getElementById("githubToken").value =
      data.userSettings.githubToken || "";
    document.getElementById("gistId").value =
      data.userSettings.githubGistId || "";

    // Load whitelist
    const whitelist = data.userSettings.whitelistedDomains || [];
    document.getElementById("whitelist").value = whitelist.join("\n");
  }

  // 保存设置
  document.getElementById("saveBtn").addEventListener("click", async () => {
    const apiKey = document.getElementById("apiKey").value.trim();
    const githubToken = document.getElementById("githubToken").value.trim();
    const gistId = document.getElementById("gistId").value.trim();
    const whitelistRaw = document.getElementById("whitelist").value.trim();

    // Parse whitelist
    const whitelistedDomains = whitelistRaw
      .split("\n")
      .map((d) => d.trim())
      .filter((d) => d.length > 0);

    // Get existing settings to preserve other fields
    const currentData = await chrome.storage.local.get("userSettings");
    const currentSettings = currentData.userSettings || {};

    await chrome.storage.local.set({
      userSettings: {
        ...currentSettings, // Preserve minWordLength, autoHighlight, etc.
        apiKey,
        githubToken,
        githubGistId: gistId,
        whitelistedDomains,
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
