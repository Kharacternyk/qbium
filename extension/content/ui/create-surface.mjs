import surfaceStylesheet from "./surface-stylesheet.mjs";

export default function createSurface(runtime, styles = []) {
  const host = document.createElement("div");
  const root = host.attachShadow({
    mode: "closed",
  });

  root.adoptedStyleSheets = [
    surfaceStylesheet,
  ];

  for (const path of styles) {
    const link = document.createElement("link");

    link.rel = "stylesheet";
    link.href = runtime.getURL(path);

    root.append(link);
  }

  document.documentElement.append(host);

  return {
    root,
    dispose: () => host.remove(),
  };
}
