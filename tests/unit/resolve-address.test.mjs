import assert from "node:assert/strict";
import { test } from "node:test";
import resolveAddress from "../../extension/shared/resolve-address.mjs";
import config from "../support/config.mjs";

test("addresses and searches use the supplied configuration", () => {
  assert.equal(resolveAddress("", config), config.startPage);
  assert.equal(
    resolveAddress("example.org/a?q=b", config),
    "https://example.org/a?q=b",
  );
  assert.equal(
    resolveAddress("http://localhost:8080/a", config),
    "http://localhost:8080/a",
  );
  assert.equal(
    resolveAddress("!w browser", config),
    config.searchUrl + "!w%20browser",
  );
  assert.equal(
    resolveAddress("two words", config),
    config.searchUrl + "two%20words",
  );
});

test("addresses cannot execute privileged URL schemes", () => {
  for (const url of [
    "javascript:alert(1)",
    "data:text/html,x",
    "file:///etc/passwd",
    "chrome://settings",
    "https://",
  ]) {
    assert.throws(() => resolveAddress(url, config), undefined, url);
  }
});
