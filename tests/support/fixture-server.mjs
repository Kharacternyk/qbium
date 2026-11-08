import http from "node:http";

export default async function createFixtureServer(t) {
  const titles = {
    "/history-one": "Fuzzy History Helper",
    "/history-two": "Fuzzy History Handbook",
  };
  const server = http.createServer((request, response) => {
    if (request.url === "/pending.js") {
      return;
    }

    response.setHeader("Content-Type", "text/html");

    if (request.url === "/slow-page") {
      response.end(`<!doctype html><title>Startup fixture</title>
        <body><script src="/pending.js"></script>`);

      return;
    }

    response.end(`<!doctype html><title>${titles[request.url] || "Keyboard fixture"}</title>
      <style>body{height:4000px}a{display:inline-block;margin:8px}</style>
      <input id="input"><button onclick="document.body.dataset.clicked='yes'">Click</button>
      ${Array.from(
        {
          length: 12,
        },
        (_, i) => `<a href="/link${i}">Link ${i}</a>`,
      ).join("")}
      <script>document.addEventListener('keydown', event => {
        document.body.dataset.lastKey = event.key;
      });</script>`);
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  t.after(
    () =>
      new Promise((resolve) => {
        server.closeAllConnections();
        server.close(resolve);
      }),
  );

  return `http://127.0.0.1:${server.address().port}`;
}
