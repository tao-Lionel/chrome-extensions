
window.addEventListener('load', () => {
  let arr = document.querySelectorAll('code')


  arr.forEach(element => {
    element.setAttribute('style', 'font-family: Menlo,Consolas,Monaco,Liberation Mono,Lucida Console,monospace !important;font-size: 14px !important;line-height: 24px !important');
  });
})