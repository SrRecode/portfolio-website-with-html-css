import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

/** A minimal, dependency-free static file server for local preview. */

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

export function contentType(filePath) {
  return MIME[extname(filePath).toLowerCase()] ?? 'application/octet-stream';
}

/**
 * Resolve a request path within `root`, refusing to escape it.
 * Returns the absolute file path, or null when the path is unsafe.
 */
export function safeJoin(root, requestPath) {
  const base = resolve(root);
  let decoded;
  try {
    decoded = decodeURIComponent(requestPath.split('?')[0]);
  } catch {
    return null;
  }
  const relative = decoded.startsWith('/') ? decoded : `/${decoded}`;
  const target = resolve(base, `.${relative}`);
  if (target !== base && !target.startsWith(base + sep)) return null;
  return target === base ? join(base, 'index.html') : target;
}

export function createStaticServer(root = process.cwd()) {
  const base = resolve(root);
  return createServer(async (req, res) => {
    const urlPath = req.url && req.url !== '/' ? req.url : '/index.html';
    const filePath = safeJoin(base, urlPath);

    if (!filePath) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Forbidden');
      return;
    }

    try {
      const data = await readFile(filePath);
      res.writeHead(200, { 'Content-Type': contentType(filePath) });
      res.end(data);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
    }
  });
}

// Start when run directly (not when imported by tests).
const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  const port = Number(process.env.PORT ?? 4173);
  createStaticServer().listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Portfolio preview at http://localhost:${port}`);
  });
}
