import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import createExtension from "./create-extension.mjs";
import Page from "./page.mjs";
import Protocol from "./protocol.mjs";
import until from "./until.mjs";

export default async function launchBrowser(t) {
  const extension = createExtension(t);
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "qbium-browser-test-"));
  const process = spawn(
    globalThis.process.env.CHROMIUM || "chromium",
    [
      "--headless=new",
      "--no-default-browser-check",
      `--user-data-dir=${profile}`,
      `--load-extension=${extension}`,
      "--remote-debugging-pipe",
      "about:blank",
    ],
    {
      stdio: [
        "ignore",
        "ignore",
        "pipe",
        "pipe",
        "pipe",
      ],
    },
  );
  const protocol = new Protocol(process);

  t.after(async () => {
    protocol.close();

    if (process.exitCode === null && process.signalCode === null) {
      const exited = new Promise((resolve) => process.once("exit", resolve));

      process.kill("SIGTERM");
      await exited;
    }

    fs.rmSync(profile, {
      recursive: true,
      force: true,
    });
  });
  await until(async () =>
    (await protocol.call("Target.getTargets")).targetInfos.some(
      (target) =>
        target.type === "service_worker" &&
        target.url.startsWith("chrome-extension://"),
    ),
  );

  return {
    protocol,
    async attach(targetId) {
      const { sessionId } = await protocol.call("Target.attachToTarget", {
        targetId,
        flatten: true,
      });
      const page = new Page(protocol, targetId, sessionId);

      await page.call("Runtime.enable");
      await page.call("Page.enable");
      await page.ready();

      return page;
    },
    async newPage(url) {
      const { targetId } = await protocol.call("Target.createTarget", {
        url,
      });

      return this.attach(targetId);
    },
    async findPage(url) {
      let target;

      await until(async () => {
        target = (await protocol.call("Target.getTargets")).targetInfos.find(
          (item) => item.type === "page" && item.url === url,
        );

        return target;
      });

      return this.attach(target.targetId);
    },
  };
}
