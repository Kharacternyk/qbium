import element from "../ui/element.mjs";

export default function createHistoryOption(item, index, onChoose) {
  const option = element("div", {
    className: "history-option",
    attributes: {
      id: `history-${index}`,
      role: "option",
      "aria-selected": "false",
    },
  });

  option.append(
    element("div", {
      className: "history-title",
      text: item.title,
    }),
    element("div", {
      className: "history-url",
      text: item.url,
    }),
  );
  option.addEventListener("mousedown", (event) => {
    if (!event.isTrusted || event.button !== 0) {
      return;
    }

    event.preventDefault();
    onChoose(index);
  });

  return option;
}
