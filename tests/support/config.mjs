import fs from "node:fs";

export default JSON.parse(
  fs.readFileSync(new URL("../fixtures/config.json", import.meta.url), "utf8"),
);
