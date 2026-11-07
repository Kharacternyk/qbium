export default async function loadStylesheet(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Could not load stylesheet ${url}: ${response.status}`);
  }

  const stylesheet = new CSSStyleSheet();

  await stylesheet.replace(await response.text());

  return stylesheet;
}
