var sendTargets = [
  {
    projectName: "",
    // 正式使用
    webhook: ""
    // 测试用
    // webhook: "", 
  },
  // {
  //   projectName: "有料云",
  //   webhook: ""
  // },
  // {
  //   projectName: "西红市",
  //   webhook: "",
  // },
  // {
  //   projectName: "有料网",
  //   webhook: "",
  // },
  // {
  //   projectName: "线上问题汇总",
  //   webhook: "",
  // },
];

// 产品验收群机器人
let checkWebhook = ''

// chrome.storage.sync.get(['info'], (obj) => {
//   sendTargets = JSON.parse(obj.info)
// })

$(function () {
  isSend();

  //提交缺陷
  $("#_view").click(function () {
    localStorage.setItem("preUrl", window.location.href);
  });

  // bug状态流转
  $("#update_status_btn").click(function () {
    localStorage.setItem("preUrl", window.location.href);
  });

  // 监听点击状态时
  $("a[workflow-status-change=entityViewStatusChange]").click(() => {
    // 获取iframe中的元素
    var iframe = document.getElementById("tdialog-simple-iframe");
    if (iframe.attachEvent) {
      iframe.attachEvent("onload", function () {
        // IE
      });
    } else {
      iframe.onload = function () {
        // 非IE
        // 监听改变状态的确认
        $("#tdialog-simple-iframe")
          .contents()
          .find("#do-status")
          .click(() => {
            localStorage.setItem("preUrl", window.location.href);
          });
      };
    }
  });

  // 在需求详情中创建缺陷
  // $("#submit_quick_add_bug").click(function () {
  //   localStorage.setItem("preUrl", window.location.href);
  // });

  //从缓存拿上个页面地址进行对比，并进行发送
  async function isSend() {
    var _preUrl = localStorage.getItem("preUrl");
    var _referrer = document.referrer; // 前一页面地址
    if (_preUrl == _referrer) {
      var _bugPriority = $("#ContentPriority").attr("data-editable-value"); // 优先级
      var _bugSeverity = $("#ContentSeverity").attr("data-editable-value"); // 严重程度
      var _bugStatus = $("a[workflow-status-change=entityViewStatusChange]").attr("title"); // 状态
      var _projectName = $(".current-project").attr("title"); // 项目名称

      //根据bug严重程度、状态、优先级决定是否进行发送钉钉
      if (_bugSeverity == "致命" || _bugSeverity == "严重" || _bugSeverity == "一般" || _bugPriority == "紧急" || _bugPriority == "高" || _bugPriority == "中" || _bugPriority == "低") {
        if (_bugStatus === "新" || _bugStatus === "重新打开") {
          for (let item of sendTargets) {
            // if (_projectName == item.projectName) {
            sendingMsg(await setBugParams(), item.webhook);
            // }
          }
        }
        console.log('bug优先级为:紧急、高、中、低，或者bug严重程度为：致命、严重、一般，并且bug状态为：新、重新打开的bug才会发到钉钉')
        // 发到产品验收群
        if (_bugStatus === '产品验收') {
          sendingMsg(await setBugParams(), checkWebhook);
        }
      }
      localStorage.removeItem("preUrl");
    }
  }

  //设置bug参数
  async function setBugParams() {
    var _bugUrl = getBugUrl(location.href);
    var _bugTitle = $("#bug_title_view .editable-value").attr("title"); // bug标题
    var _bugPriority = $("#ContentPriority").attr("data-editable-value");
    var _bugSeverity = $("#ContentSeverity").attr("data-editable-value");
    var _bugModule = $("#ContentModule").attr("data-editable-value"); // 模块
    var _bugStatus = $("a[workflow-status-change=entityViewStatusChange]").attr("title");
    var _bugOwners = $("#ContentCurrentOwner").text(); // 处理人
    var _bugReporter = $("#ContentReporter").text(); // 创建人
    var _proCreateTime = $("#ContentCreated").text(); // 创建时间

    // 艾特对应的处理人
    let url = "/js/contacts.json";
    let atMobiles = [];
    let _atName = [];

    $.ajaxSettings.async = false;
    $.getJSON(chrome.runtime.getURL(url), data => {
      $.each(_bugOwners.split(";"), (nameIndex, nameValue) => {
        $.each(data, (index, value) => {
          if (value.name === nameValue) {
            atMobiles.push(value.phone);
            let arr = nameValue.match(/[\u4e00-\u9fa5]/gm);
            _atName.push(`@${arr.join("")}`);
          }
        });
      });
    });
    $.ajaxSettings.async = true;

    let params = {
      msgtype: "text",
      text: {
        content:
          "TAPD-BUG:" +
          "\n 标题:  " +
          _bugTitle +
          "\n 状态:  " +
          _bugStatus +
          "\n 优先级:  " +
          _bugPriority +
          "\n 严重程度:  " +
          _bugSeverity +
          "\n 所属模块:  " +
          _bugModule +
          "\n 创建人:  " +
          _bugReporter +
          "\n 处理人:  " +
          _bugOwners +
          "\n 创建时间:  " +
          _proCreateTime +
          "\n 链接:  " +
          _bugUrl +
          "\n " +
          _atName.join(" "),
      },

      at: {
        atMobiles: atMobiles,
        isAtAll: false,
      },
    };

    console.log(params);
    return params;
  }

  //发送消息
  function sendingMsg(params, url) {
    if (params == 0) {
      return;
    }
    chrome.runtime.sendMessage(
      {
        type: 1,
        name: "推送钉钉消息",
        msg: { url: url, params: JSON.stringify(params) },
      },
      function (response) {
        console.log("response", response);
      }
    );
  }

  //拼接bug URL
  function getBugUrl(url) {
    var tmpList1 = splitStr(url, "?");
    var tmpList2 = splitStr(tmpList1[1], "&");
    var bugUrl = tmpList1[0] + "?";
    for (var i = 0; i < tmpList2.length; i++) {
      if (tmpList2[i].match("bug_id=")) {
        bugUrl = bugUrl + tmpList2[i];
        break;
      }
    }
    return bugUrl;
  }

  //字符串解析分割
  function splitStr(str, regx) {
    var result = str.split(regx);
    return result;
  }
});
