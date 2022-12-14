// 获取当前tab标签
const getCurrentTab = async () => {
    let queryOptions = { active: true, currentWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions)
    return tab
}

$('.button1').click(async (e) => {
    console.log(e.target.value);
    const tab = await getCurrentTab();
    console.log(tab);
    await chrome.tabs.sendMessage(tab.id, { phone: e.target.value });
})
