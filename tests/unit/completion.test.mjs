import assert from "node:assert/strict";
import { test } from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import Completion from "../../extension/content/prompt/completion.mjs";
import deferred from "../support/deferred.mjs";

test("late history responses cannot replace a newer query", async (t) => {
  const requests = new Map();
  const results = [];
  const completion = new Completion({
    delay: 0,
    search(query) {
      const request = deferred();

      requests.set(query, request);

      return request.promise;
    },
    onPending() {},
    onResults: (query, items) =>
      results.push({
        query,
        items,
      }),
    onError: (error) => {
      throw error;
    },
  });

  t.after(() => completion.dispose());
  completion.update("old");
  await delay(10);
  completion.update("new");
  await delay(10);
  requests.get("new").resolve([
    "new result",
  ]);
  await delay(0);
  requests.get("old").resolve([
    "old result",
  ]);
  await delay(0);
  assert.deepEqual(results, [
    {
      query: "new",
      items: [
        "new result",
      ],
    },
  ]);
});

test("closing a prompt suppresses pending errors and cancels scheduled searches", async () => {
  const request = deferred();
  let calls = 0;
  const updates = [];
  const completion = new Completion({
    delay: 0,
    search() {
      calls++;

      return request.promise;
    },
    onPending() {},
    onResults: (value) => updates.push(value),
    onError: (error) => updates.push(error),
  });

  completion.update("first");
  await delay(10);
  completion.update("second", 100);
  completion.dispose();
  request.reject(new Error("late failure"));
  completion.update("after closing");
  await delay(10);
  assert.equal(calls, 1);
  assert.deepEqual(updates, []);
});

test("bang searches and long inputs never query browsing history", async () => {
  let calls = 0;
  const completion = new Completion({
    delay: 0,
    search: async () => {
      calls++;

      return [];
    },
    onPending() {},
    onResults() {},
    onError() {},
  });

  completion.update("!w example");
  await delay(10);
  completion.update("x".repeat(257));
  await delay(10);
  completion.dispose();
  assert.equal(calls, 0);
});
