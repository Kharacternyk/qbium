import assert from "node:assert/strict";
import { test } from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import createCommands from "../../extension/content/create-commands.mjs";
import bindings from "../../extension/content/keyboard/bindings.mjs";
import KeySequence from "../../extension/content/keyboard/key-sequence.mjs";
import config from "../support/config.mjs";

test("key sequences derive prefixes from bindings and expire", async (t) => {
  const keys = new KeySequence(
    {
      ...bindings,
      zz: "extra",
    },
    10,
  );

  t.after(() => keys.reset());
  assert.equal(keys.match("g"), "prefix");
  assert.equal(keys.match("g"), "scrollToTop");
  assert.equal(keys.match("z"), "prefix");
  assert.equal(keys.match("z"), "extra");
  keys.match("y");
  await delay(20);
  assert.equal(keys.prefix, "");
  assert.equal(keys.match("j"), "scrollDown");
  assert.equal(keys.match("Ctrl+d"), "halfPageDown");
  keys.match("g");
  assert.equal(keys.match("j"), undefined);
});

test("every binding resolves to a named command", () => {
  const commands = createCommands({
    config,
    enterInsert() {},
  });

  for (const name of Object.values(bindings)) {
    assert.equal(typeof commands[name], "function");
  }
});
