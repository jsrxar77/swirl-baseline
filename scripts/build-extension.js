/**
 * Build Script: Extension Host Backend
 * Prepares backend files in dist/extension/ for Antigravity IDE / VS Code execution.
 */

const fs = require('fs');
const path = require('path');

const srcExt = path.join(__dirname, '..', 'src', 'extension');
const distExt = path.join(__dirname, '..', 'dist', 'extension');

console.log('[BUILD:EXTENSION] Packaging extension host files...');

if (!fs.existsSync(distExt)) {
  fs.mkdirSync(distExt, { recursive: true });
}

const files = ['extension.js'];
for (const file of files) {
  const src = path.join(srcExt, file);
  const dest = path.join(distExt, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`[BUILD:EXTENSION] Copied ${file} -> dist/extension/${file}`);
  }
}

console.log('[BUILD:EXTENSION] Extension host bundle created in dist/extension.');
process.exit(0);
