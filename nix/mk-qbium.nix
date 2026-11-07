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
  package = pkgs.callPackage ./package.nix {
    inherit config;
  };
in
builtins.deepSeq config package
