import assert from "node:assert/strict";
import until from "../../support/until.mjs";

export default async function keyboard(page) {
  await page.key("j");
  await until(() => page.evaluate("scrollY > 0"));
  await page.key("g");
  await page.key("g");
  await until(() => page.evaluate("scrollY === 0"));
  await page.evaluate(
    "document.dispatchEvent(new KeyboardEvent('keydown', {key:'j', bubbles:true}))",
  );
  assert.equal(await page.evaluate("scrollY"), 0);
  await page.evaluate("document.querySelector('input').focus()");
  await page.key("j");
  assert.equal(
    await page.evaluate("document.querySelector('input').value"),
    "j",
  );
  assert.equal(await page.evaluate("scrollY"), 0);
  await page.key("Escape");
  await page.key("i");
  await page.key("j");
  assert.equal(await page.evaluate("document.body.dataset.lastKey"), "j");
  assert.equal(await page.evaluate("scrollY"), 0);
  await page.key("Escape");
  await page.key("j");
  await until(() => page.evaluate("scrollY > 0"));
}
