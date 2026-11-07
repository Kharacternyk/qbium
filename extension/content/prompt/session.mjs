import createSurface from "../ui/create-surface.mjs";
import Completion from "./completion.mjs";
import Selection from "./selection.mjs";
import selectionDirection from "./selection-direction.mjs";
import PromptView from "./view.mjs";

export default class PromptSession {
  kind = "prompt";
  #surface;
  #selection = new Selection();
  #events = new AbortController();
  #view;
  #completion;
  #onSubmit;
  #onClose;
  #target;

  constructor({
    runtime,
    searchHistory,
    onSubmit,
    onClose,
    initialText = "",
    target = "currentWindow",
    selectText = true,
  }) {
    this.#onSubmit = onSubmit;
    this.#onClose = onClose;
    this.#target = target;
    this.#surface = createSurface(runtime, [
      "content/prompt/styles.css",
    ]);
    this.#view = new PromptView(this.#surface.root, {
      target,
      initialText,
      onChoose: (index) => this.#choose(index),
    });
    this.#completion = new Completion({
      search: searchHistory,
      onPending: (query, searchable) => this.#showPending(query, searchable),
      onResults: (query, items) => this.#showResults(query, items),
      onError: (error) =>
        this.#view.setStatus(`History unavailable: ${error.message}`),
    });

    this.#view.input.addEventListener(
      "input",
      () => this.#completion.update(this.#view.input.value),
      {
        signal: this.#events.signal,
      },
    );
    this.#view.input.focus();
    this.#completion.update(initialText, 0);

    if (selectText) {
      this.#view.input.select();
    } else {
      this.#view.input.setSelectionRange(
        initialText.length,
        initialText.length,
      );
    }
  }

  #choose(index) {
    this.#selection.choose(index);
    this.#onSubmit(this.#selection.value, this.#target);
  }

  #showPending(query, searchable) {
    this.#selection.reset(query);
    this.#view.renderResults([]);
    this.#view.setStatus(searchable ? "Searching history…" : "");
  }

  #showResults(query, items) {
    this.#selection.reset(query, items);
    this.#view.renderResults(items);
    this.#view.setStatus(
      items.length
        ? "History · Tab/↓ next · Shift-Tab/↑ previous · Enter open · Esc cancel"
        : "No matching history",
    );
  }

  handleKey(event) {
    if (this.#surface.root.activeElement !== this.#view.input) {
      return;
    }

    event.stopPropagation();

    if (event.isComposing) {
      return;
    }

    const direction = selectionDirection(event);

    if (event.key === "Escape") {
      event.preventDefault();
      this.#onClose();
    } else if (event.key === "Enter") {
      event.preventDefault();
      this.#onSubmit(this.#view.input.value, this.#target);
    } else if (direction) {
      event.preventDefault();
      this.#selection.move(direction);
      this.#view.renderSelection(this.#selection);
    }
  }

  dispose() {
    this.#events.abort();
    this.#completion.dispose();
    this.#surface.dispose();
  }
}
