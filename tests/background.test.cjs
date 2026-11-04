const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const extension = path.resolve(__dirname, "../extension");
const calls = [];
const context = vm.createContext({
  URL,
  console,
  chrome: {
    runtime: {
      id: "local",
      onMessage: {
        addListener() {},
      },
    },
    commands: {
      onCommand: {
        addListener() {},
      },
    },
    windows: {
      create: async (options) => calls.push(options),
    },
    tabs: {
      update: async (id, options) =>
        calls.push({
          id,
          ...options,
        }),
    },
  },
});
context.importScripts = (name) =>
  vm.runInContext(fs.readFileSync(path.join(extension, name), "utf8"), context);
vm.runInContext(
  fs.readFileSync(path.join(extension, "background.js"), "utf8"),
  context,
);

test("addresses and searches cannot execute privileged URL schemes", () => {
  const address = vm.runInContext("address", context);
  assert.equal(address(""), "https://wortschatz.link");
  assert.equal(address("example.org/a?q=b"), "https://example.org/a?q=b");
  assert.equal(address("http://localhost:8080/a"), "http://localhost:8080/a");
  assert.equal(address("!w browser"), "https://unduck.link/?q=!w%20browser");
  assert.equal(address("two words"), "https://unduck.link/?q=two%20words");
  for (const url of [
    "javascript:alert(1)",
    "data:text/html,x",
    "file:///etc/passwd",
    "chrome://settings",
    "https://",
  ]) {
    assert.throws(() => address(url), undefined, url);
  }
});

test("messages require our extension and an HTTP(S) tab sender", async () => {
  const handle = vm.runInContext("handle", context);
  const message = {
    action: "open",
    text: "https://example.org",
  };
  for (const sender of [
    {},
    {
      id: "other",
      tab: {
        id: 1,
      },
      url: "https://example.org",
    },
    {
      id: "local",
      tab: {
        id: 1,
      },
      url: "file:///tmp/test",
    },
  ]) {
    await assert.rejects(handle(message, sender), /Unsupported sender/);
  }
  const sender = {
    id: "local",
    tab: {
      id: 7,
    },
    url: "https://example.org",
  };
  await assert.rejects(
    handle(
      {
        action: "arbitrary",
      },
      sender,
    ),
    /Unknown action/,
  );
  await assert.rejects(
    handle(
      {
        action: "open",
        text: {},
      },
      sender,
    ),
    /Invalid address/,
  );
  assert.equal(calls.length, 0);
  await handle(message, sender);
  assert.equal(calls[0].id, 7);
  assert.equal(calls[0].url, "https://example.org/");
  await handle(
    {
      ...message,
      newWindow: true,
    },
    sender,
  );
  assert.equal(calls[1].type, "normal");
});
