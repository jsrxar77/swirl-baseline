/**
 * Swirl - Standalone Offline HTTP Server
 * Serves precompiled Swirl REPL SPA strictly on localhost with immediate clean shutdown support.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'package.json'), 'utf8'));

const PORT = parseInt(process.env.SWIRL_PORT || process.env.STRUDEL_PORT || '3000', 10);
const HOST = '127.0.0.1';

// Base directory for static files
let publicDir = path.join(__dirname, '..', '..', 'dist', 'standalone');
if (!fs.existsSync(publicDir)) {
  publicDir = path.join(__dirname);
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.sf2': 'application/octet-stream',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg'
};

const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];

  // Immediate shutdown endpoint for automated workflows
  if (urlPath === '/api/shutdown' && req.method === 'POST') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'terminating' }));
    console.log('[STANDALONE] Shutdown signal received via API. Terminating server...');
    setTimeout(() => {
      server.close(() => process.exit(0));
    }, 100);
    return;
  }

  let filePath = path.join(publicDir, urlPath === '/' ? 'index.html' : urlPath);

  // Security: prevent directory traversal
  const webviewDir = path.join(__dirname, '..', 'webview');
  const dataDir = path.join(__dirname, '..', 'data');
  if (!filePath.startsWith(publicDir) && !filePath.startsWith(webviewDir) && !filePath.startsWith(dataDir)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  // Fallback to webview or data directory if file not in standalone dist dir
  if (!fs.existsSync(filePath)) {
    const webviewPath = path.join(webviewDir, urlPath);
    const dataPath = path.join(dataDir, path.basename(urlPath));
    if (fs.existsSync(webviewPath)) {
      filePath = webviewPath;
    } else if (urlPath.startsWith('/data/') && fs.existsSync(dataPath)) {
      filePath = dataPath;
    }
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Inject version from package.json dynamically for index.html
    if (ext === '.html') {
      const html = fs.readFileSync(filePath, 'utf8');
      const shortVersion = 'v' + (pkg.version ? pkg.version.split('.').slice(0, 2).join('.') : '0.1');
      const injected = html.replace(
        /<span id="app-version"[^>]*>[^<]*<\/span>/i,
        `<span id="app-version" class="brand-version">${shortVersion}</span>`
      );
      const buf = Buffer.from(injected, 'utf8');
      res.writeHead(200, { 'Content-Type': contentType, 'Content-Length': buf.length, 'Cache-Control': 'no-cache' });
      res.end(buf);
      return;
    }

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': 'no-cache'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

function handleShutdown(signal) {
  console.log(`[STANDALONE] Received ${signal}. Closing server on ${HOST}:${PORT}...`);
  server.close(() => {
    console.log('[STANDALONE] Server stopped cleanly. Port released.');
    process.exit(0);
  });
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

server.listen(PORT, HOST, () => {
  console.log(`[STANDALONE] Swirl REPL listening on http://${HOST}:${PORT}`);
});

module.exports = server;
