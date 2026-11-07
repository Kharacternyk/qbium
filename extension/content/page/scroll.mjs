import findScrollTarget from "./find-scroll-target.mjs";

export default function scroll({ x = 0, y = 0, pages = false, edge } = {}) {
  const target = findScrollTarget();

  if (!target) {
    return;
  }

  if (edge) {
    target.scrollTo({
      top: edge === "top" ? 0 : target.scrollHeight,
      behavior: "instant",
    });
  } else {
    target.scrollBy({
      left: x,
      top: y * (pages ? target.clientHeight : 1),
      behavior: "instant",
    });
  }
}
