export default function selectionDirection(event) {
  if (event.key === "Tab") {
    return event.shiftKey ? -1 : 1;
  }

  if (event.key === "ArrowDown" || (event.ctrlKey && event.key === "n")) {
    return 1;
  }

  if (event.key === "ArrowUp" || (event.ctrlKey && event.key === "p")) {
    return -1;
  }

  return 0;
}
