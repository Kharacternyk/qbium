lib: config:
let
  isWebUrl =
    (lib.types.strMatching "[hH][tT][tT][pP][sS]?://[^/?#[:space:]]+[^[:space:]]*").check;
  inherit (config) hintKeys scrollStep;
in
assert lib.assertMsg (isWebUrl config.startPage) "qbium: startPage must be an HTTP(S) URL";
assert lib.assertMsg (isWebUrl config.searchUrl)
  "qbium: searchUrl must be an HTTP(S) URL prefix";
assert lib.assertMsg
  (
    (lib.types.strMatching "[!-~]{2,}").check hintKeys
    && lib.allUnique (lib.stringToCharacters hintKeys)
  )
  "qbium: hintKeys must contain at least two distinct printable ASCII characters, without spaces";
assert lib.assertMsg (lib.types.numbers.positive.check scrollStep)
  "qbium: scrollStep must be a positive number";
config
