export default function registerMessageListener(browser, handle) {
  browser.runtime.onMessage.addListener((message, sender, respond) => {
    handle(message, sender).then(respond, (error) =>
      respond({
        error: error.message,
      }),
    );

    return true;
  });
}
