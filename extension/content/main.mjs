import config from "../config.mjs";
import createApplication from "./create-application.mjs";

export default function start(runtime) {
  const application = createApplication(runtime, config);

  document.addEventListener(
    "keydown",
    (event) => application.handleKey(event),
    true,
  );
  addEventListener("blur", () => application.blur());
  addEventListener("resize", () => application.viewportChanged());
  addEventListener("scroll", () => application.viewportChanged(), true);
}
