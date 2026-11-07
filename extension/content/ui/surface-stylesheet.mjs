const response = await fetch(new URL("./surface.css", import.meta.url));

if (!response.ok) {
  throw new Error(`Could not load surface stylesheet: ${response.status}`);
}

const stylesheet = new CSSStyleSheet();

await stylesheet.replace(await response.text());

export default stylesheet;
