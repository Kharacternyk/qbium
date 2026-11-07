export default function registerListeners(browser, handle, startPage) {
  browser.runtime.onMessage.addListener((message, sender, respond) => {
    handle(message, sender).then(respond, (error) =>
      respond({
        error: error.message,
      }),
    );

    return true;
  });
  browser.commands.onCommand.addListener((command) => {
    if (command === "open") {
      browser.windows
        .create({
          url: startPage,
          type: "normal",
        })
        .catch(console.error);
    }
  });
}
