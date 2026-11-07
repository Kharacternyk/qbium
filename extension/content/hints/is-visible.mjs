export default function isVisible(element) {
  if (element.disabled || element.closest("[inert]")) {
    return false;
  }

  const rect = element.getBoundingClientRect();
  const style = getComputedStyle(element);

  return (
    rect.width > 0 &&
    rect.height > 0 &&
    rect.bottom > 0 &&
    rect.right > 0 &&
    rect.top < innerHeight &&
    rect.left < innerWidth &&
    style.visibility === "visible" &&
    style.display !== "none"
  );
}
