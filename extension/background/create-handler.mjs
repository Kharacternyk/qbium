import openAddress from "./open-address.mjs";
import searchHistory from "./search-history.mjs";
import validateSender from "./validate-sender.mjs";

export default function createHandler(browser, config) {
  return async (message, sender) => {
    validateSender(sender, browser.runtime.id);

    switch (message?.action) {
      case "history":
        return {
          results: await searchHistory(browser.history, message.query),
        };
      case "open":
        await openAddress(browser, config, sender.tab.id, message);

        break;
      case "back":
        await browser.tabs.goBack(sender.tab.id);

        break;
      case "forward":
        await browser.tabs.goForward(sender.tab.id);

        break;
      case "reload":
        await browser.tabs.reload(sender.tab.id, {
          bypassCache: Boolean(message.hard),
        });

        break;
      default:
        throw new Error("Unknown action");
    }

    return {
      ok: true,
    };
  };
}
