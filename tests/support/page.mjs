import until from "./until.mjs";

export default class Page {
  constructor(protocol, targetId, sessionId) {
    this.protocol = protocol;
    this.targetId = targetId;
    this.sessionId = sessionId;
  }

  call(method, params = {}) {
    return this.protocol.call(method, params, this.sessionId);
  }

  async evaluate(expression) {
    const result = await this.call("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });

    if (result.exceptionDetails) {
      throw new Error(JSON.stringify(result.exceptionDetails));
    }

    return result.result.value;
  }

  async ready() {
    await until(() => this.evaluate("document.readyState === 'complete'"));
    await this.call("Page.bringToFront");
  }

  async navigate(url) {
    await this.call("Page.navigate", {
      url,
    });
    await until(() =>
      this.evaluate(`location.href === ${JSON.stringify(url)}`),
    );
    await this.ready();
  }

  async waitPath(path) {
    await until(() =>
      this.evaluate(`location.pathname === ${JSON.stringify(path)}`),
    );
    await this.ready();
  }

  async key(key, modifiers = 0) {
    const virtual = {
      Enter: 13,
      Escape: 27,
      Backspace: 8,
      Tab: 9,
      ArrowDown: 40,
      ArrowUp: 38,
    }[key];
    const event = {
      key,
      modifiers,
      windowsVirtualKeyCode: virtual,
    };

    await this.call("Input.dispatchKeyEvent", {
      ...event,
      type: "keyDown",
      text: key.length === 1 && !modifiers ? key : undefined,
    });
    await this.call("Input.dispatchKeyEvent", {
      ...event,
      type: "keyUp",
    });
  }

  type(text) {
    return this.call("Input.insertText", {
      text,
    });
  }

  async accessibility() {
    return (await this.call("Accessibility.getFullAXTree")).nodes;
  }

  async options() {
    return (await this.accessibility()).filter(
      (node) => node.role?.value === "option",
    );
  }

  async inputValue() {
    return (await this.accessibility()).find(
      (node) => node.role?.value === "combobox",
    )?.value?.value;
  }

  close() {
    return this.protocol.call("Target.closeTarget", {
      targetId: this.targetId,
    });
  }
}
