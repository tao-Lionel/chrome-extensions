
// // let sendTargets = ''
// // chrome.storage.sync.get(['info'], (obj) => {
// //   sendTargets = JSON.parse(obj.info)
// // })

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  console.log(request);
});




