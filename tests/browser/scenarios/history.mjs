import assert from "node:assert/strict";
import until from "../../support/until.mjs";

export default async function history(page, { browser, origin, t }) {
  for (const route of [
    "/history-one",
    "/history-two",
    "/history-start",
  ]) {
    await page.navigate(origin + route);
  }

  await page.key("o");
  await page.type("fzy hlpr");
  await until(async () => (await page.options()).length === 1);
  assert.match((await page.options())[0].name.value, /Fuzzy History Helper/);
  await page.key("Tab");
  await until(
    async () => (await page.inputValue()) === `${origin}/history-one`,
  );
  await page.key("Tab", 8);
  assert.equal(await page.inputValue(), "fzy hlpr");
  await page.key("ArrowDown");
  await page.key("Enter");
  await page.waitPath("/history-one");
  await page.key("o");
  await page.type("zzzz-no-history-match");
  await until(async () =>
    (await page.accessibility()).some(
      (node) =>
        node.role?.value === "StaticText" &&
        node.name?.value === "No matching history",
    ),
  );
  await page.key("Escape");
  assert.equal(await page.evaluate("location.pathname"), "/history-one");
  await page.key("j");
  await until(() => page.evaluate("scrollY > 0"));
  await page.key("O");
  await page.type("hstry-tw");
  await until(async () => (await page.options()).length === 1);
  await page.key("ArrowUp");
  await page.key("Enter");

  const opened = await browser.findPage(`${origin}/history-two`);

  t.after(() => opened.close());
  assert.notEqual(opened.targetId, page.targetId);
  assert.equal(await page.evaluate("location.pathname"), "/history-one");
}
