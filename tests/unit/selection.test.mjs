import assert from "node:assert/strict";
import { test } from "node:test";
import Selection from "../../extension/content/prompt/selection.mjs";

test("completion selection cycles through the draft in both directions", () => {
  const selection = new Selection();

  selection.reset("original query", [
    {
      url: "one",
    },
    {
      url: "two",
    },
  ]);
  assert.equal(selection.value, "original query");

  for (const expected of [
    "one",
    "two",
    "original query",
  ]) {
    selection.move(1);
    assert.equal(selection.value, expected);
  }

  selection.move(-1);
  assert.equal(selection.value, "two");
  selection.reset("new query");
  selection.move(-1);
  assert.equal(selection.value, "new query");
  assert.equal(selection.index, -1);
});
