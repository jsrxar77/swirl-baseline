/**
 * Build Script: Standalone Local Module
 * Prepares offline standalone distribution in dist/standalone/.
 */

const fs = require('fs');
const path = require('path');

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
const fullVersion = 'v' + (pkg.version || '0.1.1');

const srcStandalone = path.join(__dirname, '..', 'src', 'standalone');
const distWebview = path.join(__dirname, '..', 'dist', 'webview');
const distStandalone = path.join(__dirname, '..', 'dist', 'standalone');

console.log('[BUILD:STANDALONE] Building standalone distribution...');

if (!fs.existsSync(distStandalone)) {
  fs.mkdirSync(distStandalone, { recursive: true });
}

// 1. Copy server launcher
const serverSrc = path.join(srcStandalone, 'server.js');
if (fs.existsSync(serverSrc)) {
  fs.copyFileSync(serverSrc, path.join(distStandalone, 'server.js'));
  console.log('[BUILD:STANDALONE] Copied server.js -> dist/standalone/');
}

// 2. Copy all files and assets from dist/webview to dist/standalone
if (fs.existsSync(distWebview)) {
  const entries = fs.readdirSync(distWebview, { withFileTypes: true });
  for (const entry of entries) {
    const src = path.join(distWebview, entry.name);
    const dest = path.join(distStandalone, entry.name);
    if (entry.isFile()) {
      fs.copyFileSync(src, dest);
    } else if (entry.isDirectory()) {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      const subEntries = fs.readdirSync(src);
      for (const sub of subEntries) {
        fs.copyFileSync(path.join(src, sub), path.join(dest, sub));
      }
    }
  }
}

// 3. Override index.html with standalone version, injecting full version
const standaloneHtml = path.join(srcStandalone, 'index.html');
if (fs.existsSync(standaloneHtml)) {
  let html = fs.readFileSync(standaloneHtml, 'utf8');
  html = html.replace(
    /<span id="app-version"[^>]*>[^<]*<\/span>/i,
    `<span id="app-version" class="brand-version">${fullVersion}</span>`
  );
  fs.writeFileSync(path.join(distStandalone, 'index.html'), html, 'utf8');
  console.log(`[BUILD:STANDALONE] Installed standalone index.html with version ${fullVersion}`);
}

console.log('[BUILD:STANDALONE] Standalone distribution created successfully in dist/standalone.');
process.exit(0);
