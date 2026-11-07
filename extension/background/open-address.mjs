import resolveAddress from "../shared/resolve-address.mjs";

export default async function openAddress(
  browser,
  config,
  tabId,
  { text, newWindow },
) {
  if (typeof text !== "string" || text.length > 16384) {
    throw new Error("Invalid address");
  }

  const url = resolveAddress(text, config);

  if (newWindow) {
    await browser.windows.create({
      url,
      type: "normal",
    });
  } else {
    await browser.tabs.update(tabId, {
      url,
    });
  }
}
