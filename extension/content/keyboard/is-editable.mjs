export default function isEditable(event) {
  return event
    .composedPath()
    .some(
      (node) =>
        node instanceof Element &&
        (node.matches("input,textarea,select,[role=textbox]") ||
          node.isContentEditable),
    );
}
