
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
});
