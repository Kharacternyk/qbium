export default class Completion {
  #revision = 0;
  #timer;
  #disposed = false;

  constructor({ search, onPending, onResults, onError, delay = 100 }) {
    this.search = search;
    this.onPending = onPending;
    this.onResults = onResults;
    this.onError = onError;
    this.delay = delay;
  }

  update(query, delay = this.delay) {
    if (this.#disposed) {
      return;
    }

    clearTimeout(this.#timer);

    const revision = ++this.#revision;
    const searchable =
      query.length <= 256 && !query.trimStart().startsWith("!");

    this.onPending(query, searchable);

    if (!searchable) {
      return;
    }

    this.#timer = setTimeout(async () => {
      try {
        const results = await this.search(query);

        if (this.#revision === revision) {
          this.onResults(query, results);
        }
      } catch (error) {
        if (this.#revision === revision) {
          this.onError(error);
        }
      }
    }, delay);
  }

  dispose() {
    this.#disposed = true;
    this.#revision++;

    clearTimeout(this.#timer);
  }
}
