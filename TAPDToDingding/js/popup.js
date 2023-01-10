// var sendTargets = [

// ];

// for (var i = 0; i < sendTargets.length; i++) {
//     var text = "<span>项目名称(该项目名称务必和TAPD项目名称保持一致)：</span> ";
//     var text1 = `<input id='projectName${i}' type = 'text' disabled value='${sendTargets[i].projectName}'/>`;
//     var text2 = "<span>webHook地址：</span>";
//     var text3 = `<input id='webHook${i}' type='text' disabled/>`;
//     $(`#sendTarget${i}`).append(text, text1, text2, text3);
// }

// //编辑
// $("#btnEdit").click(e => {
//     $("input").removeAttr("disabled");
//     $("#btnSave").removeClass("none");
//     $(e.target).attr("class", "none");
// });

// // 获取当前tab标签
// // async function getCurrentTab() {
// //     let queryOptions = { active: true, currentWindow: true };
// //     let [tab] = await chrome.tabs.query(queryOptions);
// //     return tab;
// // }

// // 保存
// $("#btnSave").click(async e => {
//     $("input").attr("disabled", "true");
//     $(e.target).attr("class", "none");
//     $("#btnEdit").removeClass("none");
//     // 保存数据
//     let info = [];
//     for (var i = 0; i < sendTargets.length; i++) {
//         info.push({
//             projectName: $(`#projectName${i}`).val(),
//             webhook: $(`#webHook${i}`).val(),
//         });

//         // info[`projectName${i}`] = $(`#projectName${i}`).val();
//         // info[`webHook${i}`] = $(`#webHook${i}`).val();
//     }
//     chrome.storage.sync.set({ info: JSON.stringify(info) });

//     // const tab = await getCurrentTab();
//     // console.log(tab);
//     // await chrome.tabs.sendMessage(tab.id, { msg: "msg" });
// });
