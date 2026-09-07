/**
 * Build Script: Standalone Local Module
 * Prepares offline standalone distribution in dist/standalone/.
 */

const fs = require('fs');
const path = require('path');

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

// 3. Override index.html with standalone version if specific
const standaloneHtml = path.join(srcStandalone, 'index.html');
if (fs.existsSync(standaloneHtml)) {
  fs.copyFileSync(standaloneHtml, path.join(distStandalone, 'index.html'));
  console.log('[BUILD:STANDALONE] Installed standalone index.html');
}

console.log('[BUILD:STANDALONE] Standalone distribution created successfully in dist/standalone.');
process.exit(0);
