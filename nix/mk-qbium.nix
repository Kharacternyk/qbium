{
  hintKeys,
  pkgs,
  scrollStep,
  searchUrl,
  startPage,
}:
let
  config = import ./validate-config.nix pkgs.lib {
    inherit
      hintKeys
      scrollStep
      searchUrl
      startPage
      ;
  };
in
pkgs.callPackage ./package.nix {
  inherit config;
}
