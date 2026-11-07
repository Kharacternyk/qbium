import element from "../ui/element.mjs";
import createHistoryOption from "./create-history-option.mjs";

export default class PromptView {
  #input;
  #list;
  #status;
  #onChoose;

  constructor(root, { target, initialText, onChoose }) {
    const label =
      target === "newWindow" ? "Open in new window" : "Open address or search";
    const bar = element("div", {
      className: "bar",
    });

    this.#onChoose = onChoose;
    this.#input = element("input", {
      attributes: {
        "aria-label": label,
        placeholder: `${label}…`,
        role: "combobox",
        "aria-autocomplete": "list",
        "aria-controls": "history-results",
        "aria-expanded": "false",
      },
    });
    this.#input.value = initialText;
    this.#list = element("div", {
      className: "history",
      attributes: {
        id: "history-results",
        role: "listbox",
        "aria-label": "Browsing history",
      },
    });
    this.#status = element("div", {
      className: "history-status",
      attributes: {
        role: "status",
      },
    });

    bar.append(this.#list, this.#status, this.#input);
    root.append(bar);
  }

  get input() {
    return this.#input;
  }

  setStatus(text) {
    this.#status.textContent = text;
  }

  renderResults(items) {
    this.#list.replaceChildren(
      ...items.map((item, index) =>
        createHistoryOption(item, index, this.#onChoose),
      ),
    );
    this.#input.setAttribute("aria-expanded", String(items.length > 0));
    this.#input.removeAttribute("aria-activedescendant");
  }

  renderSelection(selection) {
    this.#input.value = selection.value;

    for (const [index, option] of [
      ...this.#list.children,
    ].entries()) {
      option.setAttribute("aria-selected", String(index === selection.index));
    }

    if (selection.index < 0) {
      this.#input.removeAttribute("aria-activedescendant");
    } else {
      const option = this.#list.children[selection.index];

      this.#input.setAttribute("aria-activedescendant", option.id);
      option.scrollIntoView({
        block: "nearest",
      });
    }

    this.#input.setSelectionRange(
      this.#input.value.length,
      this.#input.value.length,
    );
  }
}
