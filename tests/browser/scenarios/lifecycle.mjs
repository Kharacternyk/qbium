import assert from "node:assert/strict";
import until from "../../support/until.mjs";

export default async function lifecycle(page, { browser, origin, t }) {
  await page.evaluate(`document.head.append(Object.assign(document.createElement("style"), {
    textContent: "html > div { pointer-events: auto !important; position: static !important; z-index: -1 !important; }",
  }))`);
  await page.key("o");
  assert.deepEqual(
    await page.evaluate(`Object.fromEntries(
    ["pointer-events", "position", "z-index"].map(property => [
      property,
      getComputedStyle(document.documentElement.lastElementChild).getPropertyValue(property),
    ]),
  )`),
    {
      "pointer-events": "none",
      position: "fixed",
      "z-index": "2147483647",
    },
  );
  await page.key("x");
  await page.key("y");
  assert.equal(await page.inputValue(), "xy");

  const input = (await page.accessibility()).find(
    (node) => node.role?.value === "combobox",
  );
  const { object } = await page.call("DOM.resolveNode", {
    backendNodeId: input.backendDOMNodeId,
  });

  await until(async () => {
    const { result } = await page.call("Runtime.callFunctionOn", {
      objectId: object.objectId,
      functionDeclaration:
        "function() { return getComputedStyle(this).backgroundColor; }",
      returnByValue: true,
    });

    return result.value === "rgb(34, 34, 34)";
  }, "Prompt stylesheet did not load");

  // A prompt survives focus loss with its draft intact.
  const other = await browser.newPage(origin + "/other");

  t.after(() => other.close());
  await page.call("Page.bringToFront");
  assert.equal(await page.inputValue(), "xy");
  await page.key("Escape");
  await page.key("f");
  await page.evaluate(`new Promise(resolve => {
    addEventListener("scroll", () => resolve(), { once: true });
    scrollTo(0, 200);
  })`);
  assert.equal(await page.evaluate("scrollY"), 200);
  // Scrolling closes hint mode, so normal keyboard scrolling works again.
  await page.key("j");
  await until(() => page.evaluate("scrollY > 200"));
}
