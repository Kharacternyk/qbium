import surfaceStylesheet from "./surface-stylesheet.mjs";

export default function createSurface(styles = []) {
  const host = document.createElement("div");
  const root = host.attachShadow({
    mode: "closed",
  });

  root.adoptedStyleSheets = [
    surfaceStylesheet,
    ...styles,
  ];

  document.documentElement.append(host);

  return {
    root,
    dispose: () => host.remove(),
  };
}
