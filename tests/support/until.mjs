import { setTimeout as delay } from "node:timers/promises";

export default async function until(
  check,
  message = "Condition did not become true",
) {
  for (let attempt = 0; attempt < 150; attempt++) {
    if (await check()) {
      return;
    }

    await delay(40);
  }

  throw new Error(message);
}
