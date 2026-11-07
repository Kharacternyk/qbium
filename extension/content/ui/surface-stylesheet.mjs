import loadStylesheet from "./load-stylesheet.mjs";

export default await loadStylesheet(new URL("./surface.css", import.meta.url));
