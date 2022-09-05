
// chrome.storage.sync.get(['info'], (obj) => {
//   sendTargets = JSON.parse(obj.info)
// })
// import Cookies from './js.cookie.js'

$(function () {
  console.log('我自己登陆')
  async function sendSms() {
    var url = '/gateway/main/sys/sms/sendSms'
    var options = {
      method: 'POST',
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify({
        mobile: "",
        smsType: 3
      })
    }
    try {
      let res = await fetch(url, options)
      console.log(res);
    } catch (error) {
      console.log('Request Failed', error);
    }
  }
  async function login() {
    var url = '/gateway/main/uc/sso/loginFirstStep'
    var options = {
      method: 'POST',
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify({
        app: 2,
        domain: "",
        platform: 1,
        username: "",
        verifyCode: "1234",
      })
    }
    try {
      let res = await fetch(url, options)
      let data = await res.json()
      const cookieParams = { domain: window.location.hostname, secure: false }
      Cookies.set('xhs_token', data.data.tokenData.token, cookieParams)
      Cookies.set('xhs_refresh_token', data.data.tokenData.refreshToken, cookieParams)

      if (Cookies.get('xhs_token') && Cookies.get('xhs_refresh_token')) {
        // 根据端口号跳页面
        let url = '/my/first/index'
        if (window.location.port === "3004") {
          url = '/work/index'
        }
        window.open(url, '_self')
      }
    } catch (error) {
      console.log('Request Failed', error);
    }
  }

  if (window.location.pathname === '/login') {
    sendSms()
    login()
  }
});
