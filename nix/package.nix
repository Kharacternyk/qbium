{
  config,
  esbuild,
  lib,
  stdenvNoCC,
  writeText,
}:
let
  configuredScript = writeText "qbium-config.mjs" ''
    export default Object.freeze(${builtins.toJSON config});
  '';
in
stdenvNoCC.mkDerivation {
  buildPhase = ''
    runHook preBuild
    esbuild extension/content/main.mjs \
      --bundle \
      --format=iife \
      --loader:.css=text \
      --outfile=extension/content/main.js
    runHook postBuild
  '';
  installPhase = ''
    runHook preInstall
    mkdir -p "$out"
    cp -r extension/. "$out/"
    runHook postInstall
  '';
  meta = {
    description = "A Chromium extension for qutebrowser-style keyboard navigation";
    homepage = "https://github.com/Kharacternyk/qbium";
    platforms = lib.platforms.all;
  };
  nativeBuildInputs = [
    esbuild
  ];
  pname = "qbium";
  postPatch = ''
    cp ${configuredScript} extension/config.mjs
  '';
  src = ../.;
  version = (lib.importJSON ../extension/manifest.json).version;
}
