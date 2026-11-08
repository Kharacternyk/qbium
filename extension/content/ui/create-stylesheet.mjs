export default function createStylesheet(css) {
  const stylesheet = new CSSStyleSheet();

  stylesheet.replaceSync(css);

  return stylesheet;
}
