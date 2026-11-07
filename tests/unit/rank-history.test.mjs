import assert from "node:assert/strict";
import { test } from "node:test";
import rankHistory from "../../extension/shared/rank-history.mjs";

const items = [
  {
    url: "https://example.org/one",
    title: "Fuzzy History Helper",
    lastVisitTime: 1,
  },
  {
    url: "https://example.org/two",
    title: "Fzy Hpr",
    lastVisitTime: 2,
  },
  {
    url: "https://example.org/three",
    title: "Unrelated",
    lastVisitTime: 3,
  },
  {
    url: "javascript:alert(1)",
    title: "Fzy Hpr",
    lastVisitTime: 4,
  },
];

test("fuzzy history matches titles and URLs and prefers contiguous matches", () => {
  assert.deepEqual(
    rankHistory(items, "FZY HPR").map((item) => item.url),
    [
      "https://example.org/two",
      "https://example.org/one",
    ],
  );
  assert.deepEqual(
    rankHistory(items, "exmpl /thre").map((item) => item.url),
    [
      "https://example.org/three",
    ],
  );
  assert.deepEqual(rankHistory(items, "zzzzzz"), []);
});

test("empty queries show recent HTTP(S) pages, limited to ten", () => {
  const history = Array.from(
    {
      length: 15,
    },
    (_, i) => ({
      url: `https://example.org/${i}`,
      lastVisitTime: i,
    }),
  );

  history.push({
    url: "chrome://settings",
    lastVisitTime: 100,
  });

  const results = rankHistory(history, " ");

  assert.equal(results.length, 10);
  assert.equal(results[0].url, "https://example.org/14");
  assert.equal(results[9].url, "https://example.org/5");
  assert.equal(results[0].title, results[0].url);
});
