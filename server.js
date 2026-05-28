import {createReadStream, existsSync} from "node:fs";
import {stat} from "node:fs/promises";
import {createServer} from "node:http";
import {extname, join, normalize} from "node:path";
import {fileURLToPath} from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const port = Number(process.env.PORT ?? 8000);

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".br": "application/octet-stream",
};

function sendText(res, status, text) {
  res.writeHead(status, {"Content-Type": "text/plain; charset=utf-8"});
  res.end(text);
}

function safePath(pathname) {
  const decoded = decodeURIComponent(pathname);
  const normalized = normalize(decoded).replace(/^\.\.(?:[/\\]|$)/, "");
  return join(root, normalized);
}

async function sendFile(req, res, filePath, extraHeaders = {}) {
  try {
    const fileStat = await stat(filePath);
    const ext = extname(filePath);
    const cacheControl = ext === ".html" ? "no-cache" : "public, max-age=31536000, immutable";
    res.writeHead(200, {
      "Content-Type": contentTypes[ext] ?? "application/octet-stream",
      "Content-Length": fileStat.size,
      "Cache-Control": cacheControl,
      ...extraHeaders,
    });
    createReadStream(filePath).pipe(res);
  } catch (error) {
    sendText(res, 404, "Not found");
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let pathname = url.pathname;

  if (pathname === "/clearHtml")
    return sendText(res, 200, "cleared");

  if (pathname === "/")
    pathname = "/index.html";

  if (pathname === "/smoldata.json") {
    const acceptsBrotli = req.headers["accept-encoding"]?.includes("br");
    if (!acceptsBrotli)
      return sendText(res, 406, "This endpoint requires Brotli support.");
    return sendFile(req, res, join(root, "smoldata.json.br"), {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Encoding": "br",
      "Vary": "Accept-Encoding",
    });
  }

  const filePath = safePath(pathname);
  if (!filePath.startsWith(root) || !existsSync(filePath))
    return sendText(res, 404, "Not found");

  return sendFile(req, res, filePath);
});

server.listen(port, "0.0.0.0", () => {
  console.log(`my-xikipedia listening on port ${port}`);
});
