import isEditable from "./is-editable.mjs";
import KeySequence from "./key-sequence.mjs";

export default class ModeController {
  #session = null;

  constructor({ bindings, onCommand }) {
    this.sequence = new KeySequence(bindings);
    this.onCommand = onCommand;
  }

  get kind() {
    return this.#session?.kind || "normal";
  }

  activate(createSession) {
    this.reset();

    this.#session = createSession();

    return this.#session;
  }

  reset() {
    this.#session?.dispose();

    this.#session = null;

    this.sequence.reset();
  }

  handleKey(event) {
    if (!event.isTrusted || event.isComposing) {
      return;
    }

    if (this.kind === "prompt") {
      this.#session.handleKey(event);

      return;
    }

    if (event.key === "Escape") {
      const handled = this.kind !== "normal" || this.sequence.prefix;

      this.reset();

      if (isEditable(event)) {
        document.activeElement?.blur();
      }

      if (handled) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }

      return;
    }

    if (
      this.kind === "insert" ||
      isEditable(event) ||
      event.altKey ||
      event.metaKey
    ) {
      return;
    }

    if (this.kind === "hints") {
      if (event.ctrlKey) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
      this.#session.handleKey(event);

      return;
    }

    const key = event.ctrlKey ? `Ctrl+${event.key}` : event.key;
    const command = this.sequence.match(key);

    if (!command) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();

    if (command !== "prefix") {
      this.onCommand(command);
    }
  }

  blur() {
    if (this.kind !== "prompt") {
      this.reset();
    }
  }

  viewportChanged() {
    if (this.kind === "hints") {
      this.reset();
    }
  }
}
