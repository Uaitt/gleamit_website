import { createServer } from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { resolveStaticFile } from './static-paths.mjs';

const root = resolve(process.argv[2] ?? 'dist');
const port = Number(process.env.PORT ?? 4321);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

function send(res, file, status) {
  res.writeHead(status, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(res);
}

createServer((req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  const file = resolveStaticFile(root, decodeURIComponent(pathname));
  if (file) return send(res, file, 200);
  const notFound = join(root, '404.html');
  if (existsSync(notFound)) return send(res, notFound, 404);
  res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
  res.end('Not found');
}).listen(port, '127.0.0.1', () => {
  console.log(`serving ${root} at http://127.0.0.1:${port}`);
});
