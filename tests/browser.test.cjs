const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const { test } = require("node:test");

test("Chromium loads the extension and handles real keyboard input", {
  timeout: 45000,
}, async (t) => {
  const profile = fs.mkdtempSync(
    path.join(os.tmpdir(), "chromium-keyboard-test-"),
  );
  const server = http.createServer((request, response) => {
    response.setHeader("Content-Type", "text/html");
    response.end(`<!doctype html><title>Keyboard fixture</title>
      <style>body{height:4000px}a{display:inline-block;margin:8px}</style>
      <input id="input"><button onclick="document.body.dataset.clicked='yes'">Click</button>
      ${Array.from(
        {
          length: 12,
        },
        (_, i) => `<a href="/link${i}">Link ${i}</a>`,
      ).join("")}
      <script>document.addEventListener('keydown', e => {
        document.body.dataset.lastKey = e.key;
      });</script>`);
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = spawn(
    process.env.CHROMIUM || "chromium",
    [
      "--headless=new",
      "--no-default-browser-check",
      `--user-data-dir=${profile}`,
      `--load-extension=${path.resolve(__dirname, "../extension")}`,
      "--remote-debugging-pipe",
      "about:blank",
    ],
    {
      stdio: [
        "ignore",
        "ignore",
        "pipe",
        "pipe",
        "pipe",
      ],
    },
  );
  let stderr = "";
  browser.stderr.on("data", (chunk) => {
    stderr += chunk;
  });
  let sequence = 0;
  let buffer = "";
  const pending = new Map();
  const events = [];
  browser.stdio[4].on("data", (chunk) => {
    buffer += chunk.toString();
    let boundary;
    while ((boundary = buffer.indexOf("\0")) !== -1) {
      const message = JSON.parse(buffer.slice(0, boundary));
      buffer = buffer.slice(boundary + 1);
      if (message.id) {
        const request = pending.get(message.id);
        if (!request) continue;
        pending.delete(message.id);
        clearTimeout(request.timeout);
        if (message.error)
          request.reject(new Error(JSON.stringify(message.error)));
        else request.resolve(message.result);
      } else {
        events.push(message);
        if (message.method === "Target.detachedFromTarget") {
          for (const [id, request] of pending) {
            if (request.sessionId !== message.params.sessionId) continue;
            clearTimeout(request.timeout);
            pending.delete(id);
            request.reject(new Error("Target detached"));
          }
        }
      }
    }
  });
  function call(method, params = {}, sessionId) {
    return new Promise((resolve, reject) => {
      const id = ++sequence;
      const timeout = setTimeout(() => {
        pending.delete(id);
        reject(
          new Error(`${method} ${JSON.stringify(params)} timed out\n${stderr}`),
        );
      }, 10000);
      pending.set(id, {
        resolve,
        reject,
        timeout,
        sessionId,
      });
      browser.stdio[3].write(
        JSON.stringify({
          id,
          method,
          params,
          sessionId,
        }) + "\0",
      );
    });
  }
  t.after(async () => {
    for (const { timeout } of pending.values()) clearTimeout(timeout);
    if (browser.exitCode === null) {
      const exited = new Promise((resolve) => browser.once("exit", resolve));
      browser.kill("SIGTERM");
      await exited;
    }
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(profile, {
      recursive: true,
      force: true,
    });
  });
  await until(async () =>
    (await call("Target.getTargets")).targetInfos.some(
      (target) =>
        target.type === "service_worker" &&
        target.url.startsWith("chrome-extension://"),
    ),
  );
  const { targetId } = await call("Target.createTarget", {
    url: origin,
  });
  const { sessionId } = await call("Target.attachToTarget", {
    targetId,
    flatten: true,
  });
  await call("Runtime.enable", {}, sessionId);
  await call("Page.enable", {}, sessionId);
  async function evaluate(expression, session = sessionId) {
    const result = await call(
      "Runtime.evaluate",
      {
        expression,
        returnByValue: true,
        awaitPromise: true,
      },
      session,
    );
    if (result.exceptionDetails)
      throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  }
  async function until(check) {
    for (let i = 0; i < 100; i++) {
      if (await check()) return;
      await new Promise((resolve) => setTimeout(resolve, 40));
    }
    throw new Error("Condition did not become true");
  }
  async function key(key, session = sessionId, modifiers = 0) {
    const text = key.length === 1 && !modifiers ? key : undefined;
    const virtual = {
      Enter: 13,
      Escape: 27,
      Backspace: 8,
    }[key];
    await call(
      "Input.dispatchKeyEvent",
      {
        type: "keyDown",
        key,
        text,
        modifiers,
        windowsVirtualKeyCode: virtual,
      },
      session,
    );
    await call(
      "Input.dispatchKeyEvent",
      {
        type: "keyUp",
        key,
        modifiers,
      },
      session,
    );
  }
  await until(() => evaluate("document.readyState === 'complete'"));
  await key("j");
  await until(() => evaluate("scrollY > 0"));
  await key("g");
  await key("g");
  await until(() => evaluate("scrollY === 0"));

  // Synthetic page events must never trigger extension shortcuts.
  await evaluate(
    "document.dispatchEvent(new KeyboardEvent('keydown', {key:'j', bubbles:true}))",
  );
  assert.equal(await evaluate("scrollY"), 0);
  await evaluate("document.querySelector('input').focus()");
  await key("j");
  assert.equal(await evaluate("document.querySelector('input').value"), "j");
  assert.equal(await evaluate("scrollY"), 0);
  await key("Escape");
  await key("i");
  await key("j");
  assert.equal(await evaluate("document.body.dataset.lastKey"), "j");
  assert.equal(await evaluate("scrollY"), 0);
  await key("Escape");

  // Fourteen targets require equal-width two-character hints: input aa, button as.
  await key("f");
  await key("a");
  assert.equal(await evaluate("document.body.dataset.clicked"), undefined);
  await key("s");
  assert.equal(await evaluate("document.body.dataset.clicked"), "yes");

  // Prompts are in a closed shadow root; interact using browser input, not DOM access.
  await key("o");
  await call(
    "Input.insertText",
    {
      text: `${origin}/prompt`,
    },
    sessionId,
  );
  await key("Enter");
  await until(() =>
    evaluate(
      "location.pathname === '/prompt' && document.readyState === 'complete'",
    ),
  );
  await key("d");
  await call(
    "Input.insertText",
    {
      text: `${origin}/edited`,
    },
    sessionId,
  );
  await key("Enter");
  await until(() =>
    evaluate(
      "location.pathname === '/edited' && document.readyState === 'complete'",
    ),
  );
  await key("H");
  await until(() =>
    evaluate(
      "location.pathname === '/prompt' && document.readyState === 'complete'",
    ),
  );
  await key("L");
  await until(() =>
    evaluate(
      "location.pathname === '/edited' && document.readyState === 'complete'",
    ),
  );

  await key("F");
  await key("a");
  await key("a");
  let newWindow;
  await until(async () => {
    const { targetInfos } = await call("Target.getTargets");
    newWindow = targetInfos.find(
      (target) => target.type === "page" && target.url === `${origin}/link0`,
    );
    return newWindow;
  });
  const { sessionId: newSession } = await call("Target.attachToTarget", {
    targetId: newWindow.targetId,
    flatten: true,
  });
  await until(() => evaluate("document.readyState === 'complete'", newSession));
  const errors = events.filter(
    (event) => event.method === "Runtime.exceptionThrown",
  );
  assert.deepEqual(errors, []);
});
