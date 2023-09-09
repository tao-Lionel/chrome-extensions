
window.addEventListener('load', () => {
  let arr = document.querySelectorAll('code')


  arr.forEach(element => {
    element.setAttribute('style', 'font-family: none !important;font-size: 14px !important;line-height: 22px !important');
  });
})