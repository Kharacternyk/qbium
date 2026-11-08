import assert from "node:assert/strict";
import until from "../../support/until.mjs";

export default async function startup(page, { origin }) {
  // Block the old asynchronous startup path before entering a new document.
  await page.call("Network.enable");
  await page.call("Network.setCacheDisabled", {
    cacheDisabled: true,
  });
  await page.call("Network.setBlockedURLs", {
    urls: [
      "chrome-extension://*/content/*.mjs",
      "chrome-extension://*/content/*.css",
    ],
  });
  await page.call("Page.navigate", {
    url: origin + "/slow-page",
  });
  await until(() => page.evaluate('document.title === "Startup fixture"'));
  assert.equal(await page.evaluate("document.readyState"), "loading");
  await page.key("o");
  await until(
    async () =>
      (await page.accessibility()).some(
        (node) => node.role?.value === "combobox",
      ),
    "The first keypress did not open the prompt while the page was loading",
  );
  await page.type("early input");
  assert.equal(await page.inputValue(), "early input");
  await page.key("Escape");
  assert.equal(await page.inputValue(), undefined);
}
