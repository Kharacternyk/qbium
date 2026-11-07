import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import config from "./config.mjs";

export default function createExtension(t) {
  if (process.env.QBIUM_EXTENSION) {
    return process.env.QBIUM_EXTENSION;
  }

  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), "qbium-test-extension-"),
  );

  t.after(() =>
    fs.rmSync(directory, {
      recursive: true,
      force: true,
    }),
  );
  fs.cpSync(path.resolve(import.meta.dirname, "../../extension"), directory, {
    recursive: true,
  });
  fs.writeFileSync(
    path.join(directory, "config.mjs"),
    `export default Object.freeze(${JSON.stringify(config)});\n`,
  );

  return directory;
}
