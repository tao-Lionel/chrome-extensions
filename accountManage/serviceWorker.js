
// chrome.runtime.onMessage.addListener(
//   (message, sender, sendResponse) => {
//     sendResponse({ msg: '接收到消息' })
//     console.log('message', message);
//     console.log(sender)
//     console.log(sendResponse)
//     console.log(JSON.parse(message.msg.params));
//     _fetch(message)
//     sendResponse(JSON.stringify(message))
//     return true;
//   });


// async function _fetch(data) {
//   var url = data.msg.url
//   var options = {
//     method: 'POST',
//     headers: {
//       'Content-type': 'application/json'
//     },
//     body: data.msg.params
//   }
//   try {
//     let res = await fetch(url, options)
//     console.log(res);
//   } catch (error) {
//     console.log('Request Failed', error);
//   }
// }