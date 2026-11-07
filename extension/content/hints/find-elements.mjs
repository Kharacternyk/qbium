export default function findElements(root = document) {
  const result = [
    ...root.querySelectorAll(
      "a[href],button,input:not([type=hidden]),textarea,select,[role=button],[role=link],[tabindex]",
    ),
  ];

  for (const element of root.querySelectorAll("*")) {
    if (element.shadowRoot) {
      result.push(...findElements(element.shadowRoot));
    }
  }

  return result;
}
