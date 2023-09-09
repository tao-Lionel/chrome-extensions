

let arr = document.querySelectorAll('code')


arr.forEach(element => {
  element.setAttribute('style', 'font-family: none !important');
  element.setAttribute('style', 'font-size: 14px !important');
  element.setAttribute('style', 'line-height: 22px !important');
});
