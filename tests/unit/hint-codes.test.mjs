import assert from "node:assert/strict";
import { test } from "node:test";
import generateHintCodes from "../../extension/shared/generate-hint-codes.mjs";

test("hint codes are unique and equal width across alphabet boundaries", () => {
  for (const count of [
    0,
    1,
    2,
    3,
    4,
    5,
    9,
    81,
    82,
  ]) {
    const codes = generateHintCodes(count, "as");

    assert.equal(codes.length, count);
    assert.equal(new Set(codes).size, count);
    assert.ok(
      codes.every(
        (code) => /^[as]+$/.test(code) && code.length === codes[0].length,
      ),
    );
  }

  assert.deepEqual(generateHintCodes(4, "as"), [
    "aa",
    "as",
    "sa",
    "ss",
  ]);
});

test("invalid hint alphabets fail instead of hanging", () => {
  for (const alphabet of [
    "",
    "a",
    "aa",
  ]) {
    assert.throws(() => generateHintCodes(2, alphabet));
  }
});
