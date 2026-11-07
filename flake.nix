{
  description = "A Chromium extension for qutebrowser-style keyboard navigation";
  outputs = _: {
    lib.mkQbium = import ./nix/mk-qbium.nix;
  };
}
