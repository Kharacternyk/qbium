importScripts("config.js");

function address(input) {
  const text = input.trim();
  if (!text) return browserConfig.startPage;
  if (/^https?:\/\//i.test(text)) {
    return new URL(text).href;
  }
  // Never turn javascript:, data:, file:, or browser URLs into navigations.
  if (/^[a-z][a-z\d+.-]*:/i.test(text) && !/^[\w.-]+:\d+(?:\/|$)/.test(text)) {
    throw new Error("Only HTTP and HTTPS addresses are supported");
  }
  if (
    !/\s/.test(text) &&
    /^(localhost|[\w-]+(?:\.[\w-]+)+)(?::\d+)?(?:[/?#]|$)/.test(text)
  ) {
    return new URL(`https://${text}`).href;
  }
  return browserConfig.searchUrl + encodeURIComponent(text);
}

async function openWindow(url) {
  return chrome.windows.create({
    url,
    type: "normal",
  });
}

async function handle(message, sender) {
  if (
    sender.id !== chrome.runtime.id ||
    !sender.tab ||
    !/^https?:\/\//.test(sender.url || "")
  ) {
    throw new Error("Unsupported sender");
  }
  switch (message.action) {
    case "open": {
      if (typeof message.text !== "string" || message.text.length > 16384) {
        throw new Error("Invalid address");
      }
      const url = address(message.text);
      if (message.newWindow) await openWindow(url);
      else
        await chrome.tabs.update(sender.tab.id, {
          url,
        });
      break;
    }
    case "back":
      await chrome.tabs.goBack(sender.tab.id);
      break;
    case "forward":
      await chrome.tabs.goForward(sender.tab.id);
      break;
    case "reload":
      await chrome.tabs.reload(sender.tab.id, {
        bypassCache: Boolean(message.hard),
      });
      break;
    default:
      throw new Error("Unknown action");
  }
}

chrome.runtime.onMessage.addListener((message, sender, respond) => {
  handle(message, sender).then(
    () =>
      respond({
        ok: true,
      }),
    (error) =>
      respond({
        error: error.message,
      }),
  );
  return true;
});

chrome.commands.onCommand.addListener((command) => {
  if (command === "open")
    openWindow(browserConfig.startPage).catch(console.error);
});
