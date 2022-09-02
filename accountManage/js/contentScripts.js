var sendTargets = []

// chrome.storage.sync.get(['info'], (obj) => {
//   sendTargets = JSON.parse(obj.info)
// })


$(function () {

  console.log('window.location.href', window.location.port);
  $('input[placeholder="请输入手机号"]').val('13821952053')
  $('input[placeholder="请输入验证码"]').val('1234')
  setTimeout(() => {
    $('button[class="ant-btn ant-btn-link x-button x-button__link"]').click()
  }, 500)

  // isSend();

  // //提交缺陷
  // $("#_view").click(function () {
  //   localStorage.setItem("preUrl", window.location.href);
  // });

  // // 在需求详情中创建缺陷
  // $("#submit_quick_add_bug").click(function () {
  //   localStorage.setItem("preUrl", window.location.href);
  // });

  // // bug状态流转
  // $("#update_status_btn").click(function () {
  //   localStorage.setItem("preUrl", window.location.href);
  // });

  // //从缓存拿上个页面地址进行对比，并进行发送
  // async function isSend() {
  //   var _preUrl = localStorage.getItem("preUrl");
  //   var _referrer = document.referrer; // 前一页面地址
  //   if (_preUrl == _referrer) {
  //     var _bugPriority = $("#ContentPriority").attr("data-editable-value"); // 优先级
  //     var _bugSeverity = $("#ContentSeverity").attr("data-editable-value"); // 严重程度
  //     var _bugStatus = $("a[workflow-status-change=entityViewStatusChange]").attr("title"); // 状态
  //     var _projectName = $(".current-project").attr("title"); // 项目名称

  //     //根据bug严重程度、状态、优先级决定是否进行发送钉钉
  //     if (_bugSeverity == "致命" || _bugSeverity == "严重" || _bugSeverity == "一般" || _bugPriority == "紧急" || _bugPriority == "高" || _bugPriority == "中" || _bugPriority == "低") {
  //       if (_bugStatus != "已关闭" && _bugStatus != "接受/处理") {
  //         for (let item of sendTargets) {
  //           if (_projectName == item.projectName) {
  //             sendingMsg(await setBugParams(), item.webHook);
  //           }
  //         }
  //       }
  //     }
  //     localStorage.removeItem("preUrl");
  //   }
  // }


  // //设置bug参数
  // async function setBugParams() {
  //   var _bugUrl = getBugUrl(location.href);
  //   var _bugTitle = $("#bug_title_view .editable-value").attr("title"); // bug标题
  //   var _bugPriority = $("#ContentPriority").attr("data-editable-value");
  //   var _bugSeverity = $("#ContentSeverity").attr("data-editable-value");
  //   var _bugModule = $("#ContentModule").attr("data-editable-value"); // 模块
  //   var _bugStatus = $("a[workflow-status-change=entityViewStatusChange]").attr("title");
  //   var _bugOwners = $("#ContentCurrentOwner").text(); // 处理人
  //   var _bugReporter = $("#ContentReporter").text(); // 创建人
  //   var _proCreateTime = $("#ContentCreated").text(); // 创建时间

  //   // 艾特对应的处理人
  //   let url = "/js/contacts.json"
  //   let atMobiles = []
  //   // let params = {}
  //   $.ajaxSettings.async = false;
  //   $.getJSON(chrome.runtime.getURL(url), (data) => {
  //     $.each(data, (index, value) => {
  //       if (value.name === _bugOwners) {
  //         atMobiles.push(value.phone)
  //       }
  //     })

  //   })
  //   $.ajaxSettings.async = true;

  //   let params = {
  //     msgtype: "text",
  //     text: {
  //       content:
  //         "TAPD-BUG:" +
  //         "\n 标题:  " +
  //         _bugTitle +
  //         "\n 状态:  " +
  //         _bugStatus +
  //         "\n 优先级:  " +
  //         _bugPriority +
  //         "\n 严重程度:  " +
  //         _bugSeverity +
  //         "\n 所属模块:  " +
  //         _bugModule +
  //         "\n 创建人:  " +
  //         _bugReporter +
  //         "\n 处理人:  " +
  //         _bugOwners +
  //         "\n 创建时间:  " +
  //         _proCreateTime +
  //         "\n 链接:  " +
  //         _bugUrl,
  //     },

  //     at: {
  //       atMobiles: atMobiles,
  //       isAtAll: false,
  //     },
  //   };
  //   return params;
  // }



  // //发送消息
  // function sendingMsg(params, url) {
  //   if (params == 0) {
  //     return;
  //   }
  //   chrome.runtime.sendMessage(
  //     {
  //       type: 1,
  //       name: "推送钉钉消息",
  //       msg: { url: url, params: JSON.stringify(params) },
  //     },
  //     function (response) {
  //       console.log("response", response);
  //     }
  //   );
  // }

  // //拼接bug URL
  // function getBugUrl(url) {
  //   var tmpList1 = splitStr(url, "?");
  //   var tmpList2 = splitStr(tmpList1[1], "&");
  //   var bugUrl = tmpList1[0] + "?";
  //   for (var i = 0; i < tmpList2.length; i++) {
  //     if (tmpList2[i].match("bug_id=")) {
  //       bugUrl = bugUrl + tmpList2[i];
  //       break;
  //     }
  //   }
  //   return bugUrl;
  // }

  // //字符串解析分割
  // function splitStr(str, regx) {
  //   var result = str.split(regx);
  //   return result;
  // }
});
