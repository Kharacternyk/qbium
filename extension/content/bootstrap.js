import(chrome.runtime.getURL("content/main.mjs"))
  .then(({ default: start }) => start(chrome.runtime))
  .catch(console.error);
