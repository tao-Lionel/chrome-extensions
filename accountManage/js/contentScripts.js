


// import Cookies from './js.cookie.js'

$(async function () {
  let sendTargets = ''
  chrome.storage.sync.get(['info'], (obj) => {
    sendTargets = JSON.parse(obj.info)
  })
  console.log(sendTargets);
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
    // try {
    //   let res = await fetch(url, options)
    //   let data = await res.json()
    //   const cookieParams = { domain: window.location.hostname, secure: false }
    //   Cookies.set('xhs_token', data.data.tokenData.token, cookieParams)
    //   Cookies.set('xhs_refresh_token', data.data.tokenData.refreshToken, cookieParams)

    //   if (Cookies.get('xhs_token') && Cookies.get('xhs_refresh_token')) {
    //     // 根据端口号跳页面
    //     let url = '/my/first/index'
    //     let { host, port } = window.location
    //     console.log(host);
    //     if (port === "3004" || host.includes('.crm.youliao.com') || host.includes('test-yun.youliao.com')) {
    //       url = '/work/index'
    //     } else if (port === "3006") {
    //       url = '/news/list'
    //     }

    //     window.open(url, '_self')
    //   }
    // } catch (error) {
    //   console.log('Request Failed', error);
    // }
  }

  if (window.location.pathname === '/login') {
    await sendSms()
    login()
  }
});
