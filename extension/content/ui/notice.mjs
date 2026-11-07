import createSurface from "./create-surface.mjs";
import element from "./element.mjs";

export default function createNotice({ runtime, text, onClose }) {
  const surface = createSurface(runtime);

  surface.root.append(
    element("div", {
      className: "bar",
      text,
    }),
  );

  const timer = setTimeout(onClose, 4000);

  return {
    kind: "notice",
    dispose() {
      clearTimeout(timer);
      surface.dispose();
    },
  };
}
