import Cookies from "js-cookie";

(async function () {
  async function sendSms(val = null) {
    var url = "/gateway/main/sys/sms/sendSms";
    var options = {
      method: "POST",
      headers: {
        "Content-type": "application/json"
      },
      body: JSON.stringify({
        mobile: val,
        smsType: 3
      })
    };
    try {
      let res = await fetch(url, options);
      console.log(res);
    } catch (error) {
      console.log("Request Failed", error);
    }
  }

  async function login(val = null) {
    var url = "/gateway/main/uc/sso/loginFirstStep";
    var options = {
      method: "POST",
      headers: {
        "Content-type": "application/json"
      },
      body: JSON.stringify({
        app: 2,
        domain: "",
        platform: 1,
        username: val,
        verifyCode: "1234"
      })
    };
    try {
      let res = await fetch(url, options);
      let data = await res.json();
      const shareTokenHost = ".youliao.com";
      const DOMAIN = window.location.hostname.includes(shareTokenHost) ? shareTokenHost : window.location.hostname;
      const cookieParams = { domain: DOMAIN, secure: false };
      Cookies.set("xhs_token", data.data.tokenData.token, cookieParams);
      Cookies.set("xhs_refresh_token", data.data.tokenData.refreshToken, cookieParams);

      if (Cookies.get("xhs_token") && Cookies.get("xhs_refresh_token")) {
        // 根据端口号跳页面
        let url = "/my/first/index";
        let { host, port } = window.location;
        if (
          port === "3004" ||
          host.includes("test-demo.yun.youliao.com") ||
          host.includes("test2-demo.yun.youliao.com")
        ) {
          url = "/work/index";
        } else if (host.includes("test-yun.youliao.com")) {
          url = "https://test-demo.yun.youliao.com/work/index";
        } else if (port === "3006") {
          url = "/flow/list";
        } else if (host.includes("test-demo.crm.youliao.com") || host.includes("test2-demo.crm.youliao.com")) {
          url = "/my/first/index";
        }

        window.open(url, "_self");
      }
    } catch (error) {
      console.log("Request Failed", error);
    }
  }

  chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    console.log(request);
    await sendSms(request.phone);
    login(request.phone);
  });
})();
