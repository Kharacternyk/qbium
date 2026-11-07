import assert from "node:assert/strict";
import { test } from "node:test";
import createHandler from "../../extension/background/create-handler.mjs";
import registerMessageListener from "../../extension/background/register-message-listener.mjs";
import config from "../support/config.mjs";
import fakeBrowser from "../support/fake-browser.mjs";

const sender = {
  id: "local",
  tab: {
    id: 7,
  },
  url: "https://example.org",
};

test("messages reject foreign extensions and unsupported frames before making browser calls", async () => {
  const browser = fakeBrowser();
  const handle = createHandler(browser, config);

  for (const invalid of [
    {},
    {
      ...sender,
      id: "other",
    },
    {
      ...sender,
      url: "file:///tmp/test",
    },
    {
      ...sender,
      tab: {},
    },
  ]) {
    await assert.rejects(
      handle(
        {
          action: "open",
          text: "https://example.org",
        },
        invalid,
      ),
      /Unsupported sender/,
    );
    await assert.rejects(
      handle(
        {
          action: "history",
          query: "",
        },
        invalid,
      ),
      /Unsupported sender/,
    );
  }

  assert.deepEqual(browser.calls, []);
});

test("navigation targets the sender tab or an explicitly requested window", async () => {
  const browser = fakeBrowser();
  const handle = createHandler(browser, config);

  await handle(
    {
      action: "open",
      text: "https://example.org",
    },
    sender,
  );
  await handle(
    {
      action: "open",
      text: "https://example.org",
      newWindow: true,
    },
    sender,
  );
  await handle(
    {
      action: "back",
    },
    sender,
  );
  await handle(
    {
      action: "forward",
    },
    sender,
  );
  await handle(
    {
      action: "reload",
      hard: true,
    },
    sender,
  );
  assert.deepEqual(browser.calls, [
    {
      action: "update",
      id: 7,
      url: "https://example.org/",
    },
    {
      action: "window",
      type: "normal",
      url: "https://example.org/",
    },
    {
      action: "back",
      id: 7,
    },
    {
      action: "forward",
      id: 7,
    },
    {
      action: "reload",
      id: 7,
      bypassCache: true,
    },
  ]);
});

test("malformed actions and parameters fail without browser calls", async () => {
  const browser = fakeBrowser();
  const handle = createHandler(browser, config);

  for (const message of [
    null,
    {},
    {
      action: "arbitrary",
    },
  ]) {
    await assert.rejects(handle(message, sender), /Unknown action/);
  }

  for (const text of [
    {},
    null,
    "x".repeat(16385),
  ]) {
    await assert.rejects(
      handle(
        {
          action: "open",
          text,
        },
        sender,
      ),
      /Invalid address/,
    );
  }

  for (const query of [
    null,
    {},
    "x".repeat(257),
  ]) {
    await assert.rejects(
      handle(
        {
          action: "history",
          query,
        },
        sender,
      ),
      /Invalid history query/,
    );
  }

  assert.deepEqual(browser.calls, []);
});

test("the message listener returns history results and readable errors", async () => {
  const history = [
    {
      url: "https://example.org",
      title: "<img src=x onerror=alert(1)>",
    },
  ];
  const browser = fakeBrowser(history);

  registerMessageListener(browser, createHandler(browser, config));

  const request = (message) =>
    new Promise((resolve) => {
      assert.equal(browser.listeners.message(message, sender, resolve), true);
    });
  const response = await request({
    action: "history",
    query: "",
  });

  assert.deepEqual(response.results, history);
  assert.deepEqual(browser.calls[0], {
    action: "history",
    text: "",
    startTime: 0,
    maxResults: 10000,
  });
  assert.deepEqual(
    await request({
      action: "unknown",
    }),
    {
      error: "Unknown action",
    },
  );
});
