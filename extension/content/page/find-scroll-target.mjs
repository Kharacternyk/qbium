export default function findScrollTarget() {
  let element = document.activeElement;

  while (element && element !== document.body) {
    if (
      element.scrollHeight > element.clientHeight &&
      /auto|scroll/.test(getComputedStyle(element).overflowY)
    ) {
      return element;
    }

    element = element.parentElement;
  }

  return document.scrollingElement;
}
