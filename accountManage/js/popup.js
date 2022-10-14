

$('.button1').click(function (e) {
    console.log(e.target.value);
    // info[`projectName${i}`] = $(`#projectName${i}`).val();
    // info[`webHook${i}`] = $(`#webHook${i}`).val();
    let info = []
    info.push({ 'phone': `${e.target.value}` })
    console.log(JSON.stringify(info));
    chrome.storage.sync.set({ info: JSON.stringify(info) });
})
