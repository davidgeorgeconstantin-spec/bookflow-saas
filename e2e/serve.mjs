// Tiny static server for out/ under /bookflow-saas/ (like GitHub Pages). No dependencies.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join } from 'node:path';

const ROOT = new URL('../out/', import.meta.url).pathname;
const BASE = '/bookflow-saas';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.txt': 'text/plain' };

createServer(async (req, res) => {
  const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
  if (!url.startsWith(BASE)) return res.writeHead(404).end();
  let file = join(ROOT, url.slice(BASE.length));
  try {
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' }).end(await readFile(file));
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/html' }).end(await readFile(join(ROOT, '404.html')).catch(() => 'Not found'));
  }
}).listen(4321);
