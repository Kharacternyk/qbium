import findElements from "./find-elements.mjs";
import isVisible from "./is-visible.mjs";
import HintSession from "./session.mjs";

export default function createHintSession(options) {
  const candidates = findElements().filter(
    (element) =>
      isVisible(element) &&
      (options.target !== "newWindow" || element.matches("a[href]")),
  );

  if (!candidates.length) {
    return null;
  }

  return new HintSession(candidates, options);
}
