import generateHintCodes from "../../shared/generate-hint-codes.mjs";
import createSurface from "../ui/create-surface.mjs";
import createLabel from "./create-label.mjs";
import stylesheet from "./stylesheet.mjs";

export default class HintSession {
  kind = "hints";
  #surface;
  #hints;
  #prefix = "";
  #alphabet;
  #target;
  #onClose;
  #onOpen;

  constructor(candidates, { alphabet, target, onClose, onOpen }) {
    const codes = generateHintCodes(candidates.length, alphabet);

    this.#alphabet = alphabet;
    this.#target = target;
    this.#onClose = onClose;
    this.#onOpen = onOpen;
    this.#surface = createSurface([
      stylesheet,
    ]);
    this.#hints = candidates.map((element, index) =>
      createLabel(this.#surface.root, element, codes[index]),
    );
  }

  handleKey(event) {
    if (event.key === "Backspace") {
      this.#prefix = this.#prefix.slice(0, -1);
    } else if (event.key.length === 1 && this.#alphabet.includes(event.key)) {
      this.#prefix += event.key;
    } else {
      return;
    }

    const matches = this.#hints.filter((hint) => hint.update(this.#prefix));

    if (!matches.length) {
      return this.#onClose();
    }

    const match = matches.find((hint) => hint.code === this.#prefix);

    if (!match) {
      return;
    }

    this.#onClose();

    if (this.#target === "newWindow") {
      this.#onOpen(match.target.href, this.#target);
    } else {
      match.target.focus();
      match.target.click();
    }
  }

  dispose() {
    this.#surface.dispose();
  }
}
