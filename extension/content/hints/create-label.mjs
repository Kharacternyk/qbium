import element from "../ui/element.mjs";

export default function createLabel(root, target, code) {
  const label = element("span", {
    className: "label",
  });
  const matched = element("span", {
    className: "matched",
  });
  const remaining = document.createTextNode(code);

  label.append(matched, remaining);

  const rect = target.getBoundingClientRect();

  label.style.left = `${Math.max(0, rect.left)}px`;
  label.style.top = `${Math.max(0, rect.top)}px`;

  root.append(label);

  return {
    target,
    code,
    update(prefix) {
      const visible = code.startsWith(prefix);

      label.hidden = !visible;

      if (visible) {
        matched.textContent = code.slice(0, prefix.length);
        remaining.data = code.slice(prefix.length);
      }

      return visible;
    },
  };
}
