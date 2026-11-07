export default class Protocol {
  #sequence = 0;
  #buffer = "";
  #pending = new Map();
  #closed = false;
  events = [];
  stderr = "";

  constructor(browser) {
    this.browser = browser;

    browser.stderr.on("data", (chunk) => {
      this.stderr += chunk;
    });
    browser.stdio[4].on("data", (chunk) => this.#receive(chunk));
    browser.once("error", (error) => this.close(error));
    browser.once("exit", (code, signal) => {
      this.close(
        new Error(`Chromium exited (${code ?? signal}): ${this.stderr}`),
      );
    });
  }

  #receive(chunk) {
    this.#buffer += chunk.toString();

    let boundary;

    while ((boundary = this.#buffer.indexOf("\0")) !== -1) {
      const message = JSON.parse(this.#buffer.slice(0, boundary));

      this.#buffer = this.#buffer.slice(boundary + 1);

      if (message.id) {
        const request = this.#pending.get(message.id);

        if (!request) {
          continue;
        }

        this.#pending.delete(message.id);
        clearTimeout(request.timeout);

        if (message.error) {
          request.reject(new Error(JSON.stringify(message.error)));
        } else {
          request.resolve(message.result);
        }
      } else {
        this.events.push(message);

        if (message.method === "Target.detachedFromTarget") {
          for (const [id, request] of this.#pending) {
            if (request.sessionId !== message.params.sessionId) {
              continue;
            }

            clearTimeout(request.timeout);
            this.#pending.delete(id);
            request.reject(new Error("Target detached"));
          }
        }
      }
    }
  }

  call(method, params = {}, sessionId) {
    if (this.#closed) {
      return Promise.reject(new Error(`Chromium is closed: ${this.stderr}`));
    }

    return new Promise((resolve, reject) => {
      const id = ++this.#sequence;
      const timeout = setTimeout(() => {
        this.#pending.delete(id);
        reject(
          new Error(
            `${method} ${JSON.stringify(params)} timed out\n${this.stderr}`,
          ),
        );
      }, 10000);

      this.#pending.set(id, {
        resolve,
        reject,
        timeout,
        sessionId,
      });
      this.browser.stdio[3].write(
        JSON.stringify({
          id,
          method,
          params,
          sessionId,
        }) + "\0",
      );
    });
  }

  close(error = new Error("Browser connection closed")) {
    this.#closed = true;

    for (const request of this.#pending.values()) {
      clearTimeout(request.timeout);
      request.reject(error);
    }

    this.#pending.clear();
  }
}
