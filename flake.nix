{
  description = "A Chromium extension for qutebrowser-style keyboard navigation";
  outputs =
    { flake-utils, nixpkgs, ... }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        qbium = pkgs.stdenvNoCC.mkDerivation {
          checkPhase = ''
            runHook preCheck
            node --test tests/background.test.cjs
            runHook postCheck
          '';
          doCheck = true;
          installPhase = ''
            runHook preInstall
            mkdir -p "$out"
            cp -r extension/. "$out/"
            runHook postInstall
          '';
          meta = {
            description = "A Chromium extension for qutebrowser-style keyboard navigation";
            homepage = "https://github.com/Kharacternyk/qbium";
            platforms = pkgs.lib.platforms.all;
          };
          nativeCheckInputs = [ pkgs.nodejs ];
          pname = "qbium";
          src = ./.;
          version = (builtins.fromJSON (builtins.readFile ./extension/manifest.json)).version;
        };
      in
      {
        checks.default = qbium;
        devShells.default = pkgs.mkShell {
          packages = [
            pkgs.nodejs
          ]
          ++ pkgs.lib.optionals pkgs.stdenv.hostPlatform.isLinux [ pkgs.chromium ];
        };
        formatter = pkgs.nixfmt;
        packages = {
          inherit qbium;
          default = qbium;
        };
      }
    );
  inputs = {
    flake-utils.url = "github:numtide/flake-utils";
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };
}
