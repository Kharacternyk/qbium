import loadStylesheet from "../ui/load-stylesheet.mjs";

export default await loadStylesheet(new URL("./styles.css", import.meta.url));
