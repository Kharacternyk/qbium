import assert from "node:assert/strict";
import { test } from "node:test";
import createFixtureServer from "../support/fixture-server.mjs";
import launchBrowser from "../support/launch-browser.mjs";
import hints from "./scenarios/hints.mjs";
import history from "./scenarios/history.mjs";
import keyboard from "./scenarios/keyboard.mjs";
import lifecycle from "./scenarios/lifecycle.mjs";
import navigation from "./scenarios/navigation.mjs";
import startup from "./scenarios/startup.mjs";

test("Chromium integration", {
  timeout: 60000,
}, async (t) => {
  const origin = await createFixtureServer(t);
  const browser = await launchBrowser(t);

  for (const scenario of [
    startup,
    keyboard,
    navigation,
    hints,
    history,
    lifecycle,
  ]) {
    await t.test(scenario.name, async (t) => {
      const page = await browser.newPage(origin);

      t.after(() => page.close());
      await scenario(page, {
        browser,
        origin,
        t,
      });
    });
  }

  const errors = browser.protocol.events.filter(
    (event) => event.method === "Runtime.exceptionThrown",
  );

  assert.deepEqual(errors, []);
});
