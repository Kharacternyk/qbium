import assert from "node:assert/strict";

export default async function hints(page, { browser, origin, t }) {
  // Fourteen targets require two-character codes: input aa, button as.
  await page.key("f");
  await page.key("a");
  assert.equal(await page.evaluate("document.body.dataset.clicked"), undefined);
  await page.key("s");
  assert.equal(await page.evaluate("document.body.dataset.clicked"), "yes");
  await page.key("F");
  await page.key("a");
  await page.key("a");

  const opened = await browser.findPage(`${origin}/link0`);

  t.after(() => opened.close());
  assert.notEqual(opened.targetId, page.targetId);
}
