import assert from "node:assert/strict";
import { test } from "node:test";
import ModeController from "../../extension/content/keyboard/controller.mjs";

const key = (value) => ({
  key: value,
  isTrusted: true,
  composedPath: () => [],
  preventDefault() {},
  stopImmediatePropagation() {},
});

test("changing sessions disposes the previous one and clears partial key sequences", () => {
  const commands = [];
  const controller = new ModeController({
    bindings: {
      gg: "top",
    },
    onCommand: (name) => commands.push(name),
  });
  let disposed = 0;

  controller.handleKey(key("g"));
  controller.activate(() => ({
    kind: "hints",
    dispose() {
      disposed++;
    },
  }));
  controller.activate(() => ({
    kind: "notice",
    dispose() {
      disposed++;
    },
  }));
  assert.equal(disposed, 1);
  controller.reset();
  controller.reset();
  assert.equal(disposed, 2);
  controller.handleKey(key("g"));
  assert.deepEqual(commands, []);
  controller.handleKey(key("g"));
  assert.deepEqual(commands, [
    "top",
  ]);
});

test("focus loss preserves prompts but closes hints", () => {
  const controller = new ModeController({
    bindings: {},
    onCommand() {},
  });
  let disposed = 0;

  controller.activate(() => ({
    kind: "prompt",
    dispose() {
      disposed++;
    },
  }));
  controller.blur();
  assert.equal(controller.kind, "prompt");
  controller.viewportChanged();
  assert.equal(controller.kind, "prompt");
  controller.activate(() => ({
    kind: "hints",
    dispose() {
      disposed++;
    },
  }));
  controller.viewportChanged();
  assert.equal(controller.kind, "normal");
  assert.equal(disposed, 2);
});

test("insert mode and synthetic input do not run commands", () => {
  const commands = [];
  const controller = new ModeController({
    bindings: {
      j: "down",
    },
    onCommand: (name) => commands.push(name),
  });

  controller.handleKey({
    ...key("j"),
    isTrusted: false,
  });
  controller.activate(() => ({
    kind: "insert",
    dispose() {},
  }));
  controller.handleKey(key("j"));
  assert.deepEqual(commands, []);
  controller.handleKey(key("Escape"));
  controller.handleKey(key("j"));
  assert.deepEqual(commands, [
    "down",
  ]);
});
