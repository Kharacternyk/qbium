export default class BrowserClient {
  constructor(runtime) {
    this.runtime = runtime;
  }

  async request(message) {
    let response;

    try {
      response = await this.runtime.sendMessage(message);
    } catch (error) {
      throw new Error(
        `Reload this page to reconnect the extension: ${error.message}`,
      );
    }

    if (response?.error) {
      throw new Error(response.error);
    }

    return response;
  }

  open(text, target) {
    return this.request({
      action: "open",
      text,
      newWindow: target === "newWindow",
    });
  }

  async searchHistory(query) {
    const response = await this.request({
      action: "history",
      query,
    });

    return response?.results || [];
  }
}
