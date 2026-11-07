import copyPageUrl from "./page/copy-url.mjs";
import scroll from "./page/scroll.mjs";

export default function createCommands({
  config,
  browser,
  showNotice,
  enterInsert,
  openPrompt,
  startHints,
}) {
  return {
    scrollDown: () =>
      scroll({
        y: config.scrollStep,
      }),
    scrollUp: () =>
      scroll({
        y: -config.scrollStep,
      }),
    scrollLeft: () =>
      scroll({
        x: -config.scrollStep,
      }),
    scrollRight: () =>
      scroll({
        x: config.scrollStep,
      }),
    pageDown: () =>
      scroll({
        y: 1,
        pages: true,
      }),
    pageUp: () =>
      scroll({
        y: -1,
        pages: true,
      }),
    halfPageDown: () =>
      scroll({
        y: 0.5,
        pages: true,
      }),
    halfPageUp: () =>
      scroll({
        y: -0.5,
        pages: true,
      }),
    scrollToTop: () =>
      scroll({
        edge: "top",
      }),
    scrollToBottom: () =>
      scroll({
        edge: "bottom",
      }),
    back: () =>
      browser.request({
        action: "back",
      }),
    forward: () =>
      browser.request({
        action: "forward",
      }),
    reload: () =>
      browser.request({
        action: "reload",
      }),
    hardReload: () =>
      browser.request({
        action: "reload",
        hard: true,
      }),
    hint: () => startHints("currentWindow"),
    hintNewWindow: () => startHints("newWindow"),
    open: () => openPrompt({}),
    openNewWindow: () =>
      openPrompt({
        target: "newWindow",
      }),
    editUrl: () =>
      openPrompt({
        initialText: location.href,
      }),
    bangSearch: () =>
      openPrompt({
        initialText: "!",
        selectText: false,
      }),
    copyUrl: () =>
      showNotice(copyPageUrl() ? "URL copied" : "Could not copy URL"),
    insert: () => enterInsert(),
  };
}
