// 获取当前tab标签
const getCurrentTab = async () => {
    let queryOptions = { active: true, currentWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions)
    return tab
}

$('.button1').click(async (e) => {
    console.log('111111111111111111111111111111111111111111111111111');
    const tab = await getCurrentTab();
    console.log(tab);
    await chrome.tabs.sendMessage(tab.id, { test: '1234567890' });
})
