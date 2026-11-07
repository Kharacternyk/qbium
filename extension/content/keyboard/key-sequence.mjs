export default class KeySequence {
  prefix = "";
  #timer;

  constructor(bindings, timeout = 1000) {
    this.bindings = bindings;
    this.timeout = timeout;
  }

  match(key) {
    if (key.startsWith("Ctrl+")) {
      return this.bindings[key];
    }

    const sequence = this.prefix + key;

    this.reset();

    if (Object.hasOwn(this.bindings, sequence)) {
      return this.bindings[sequence];
    }

    if (
      Object.keys(this.bindings).some((binding) => binding.startsWith(sequence))
    ) {
      this.prefix = sequence;
      this.#timer = setTimeout(() => this.reset(), this.timeout);

      return "prefix";
    }

    return undefined;
  }

  reset() {
    this.prefix = "";

    clearTimeout(this.#timer);
  }
}
