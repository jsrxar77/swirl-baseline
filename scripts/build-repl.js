/**
 * Build Script: Strudel REPL Webview Bundle
 * Compiles and copies webview assets, baseline repl engine, and chunks to dist/webview/.
 */

const fs = require('fs');
const path = require('path');

const srcWebview = path.join(__dirname, '..', 'src', 'webview');
const srcBaselineRepl = path.join(__dirname, '..', 'src', 'baseline', 'repl');
const distWebview = path.join(__dirname, '..', 'dist', 'webview');
const distAssets = path.join(distWebview, 'assets');

console.log('[BUILD:REPL] Compiling Strudel REPL Webview bundle...');

if (!fs.existsSync(distWebview)) {
  fs.mkdirSync(distWebview, { recursive: true });
}
if (!fs.existsSync(distAssets)) {
  fs.mkdirSync(distAssets, { recursive: true });
}

// 1. Copy and sync webview frontend files with package version
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8"));
const shortVersion = "v" + (pkg.version ? pkg.version.split(".").slice(0, 2).join(".") : "0.1");

const files = ['index.html', 'main.js', 'repl-adapter.js', 'style.css'];
for (const file of files) {
  const src = path.join(srcWebview, file);
  const dest = path.join(distWebview, file);
  if (fs.existsSync(src)) {
    if (file === "index.html") {
      let html = fs.readFileSync(src, "utf8");
      html = html.replace(/<span id="app-version"[^>]*>[^<]*<\/span>/i, `<span id="app-version" class="brand-version">${shortVersion}</span>`);
      fs.writeFileSync(dest, html, "utf8");
    } else {
      fs.copyFileSync(src, dest);
    }
    console.log(`[BUILD:REPL] Copied ${file} -> dist/webview/${file}`);
  }
}

// 2. Copy official Strudel REPL bundle and chunks from src/baseline/repl
if (fs.existsSync(srcBaselineRepl)) {
  const replEntries = fs.readdirSync(srcBaselineRepl, { withFileTypes: true });
  for (const entry of replEntries) {
    const srcPath = path.join(srcBaselineRepl, entry.name);
    if (entry.isFile()) {
      if (entry.name === 'index.js') {
        fs.copyFileSync(srcPath, path.join(distWebview, 'strudel-repl.js'));
        fs.copyFileSync(srcPath, path.join(distWebview, 'index.js'));
        console.log('[BUILD:REPL] Copied baseline REPL index.js -> dist/webview/strudel-repl.js');
      } else {
        fs.copyFileSync(srcPath, path.join(distWebview, entry.name));
        console.log(`[BUILD:REPL] Copied chunk -> dist/webview/${entry.name}`);
      }
    } else if (entry.isDirectory()) {
      const targetSubdir = path.join(distWebview, entry.name);
      if (!fs.existsSync(targetSubdir)) {
        fs.mkdirSync(targetSubdir, { recursive: true });
      }
      const subEntries = fs.readdirSync(srcPath);
      for (const sub of subEntries) {
        fs.copyFileSync(path.join(srcPath, sub), path.join(targetSubdir, sub));
      }
      console.log(`[BUILD:REPL] Copied directory ${entry.name}/ -> dist/webview/${entry.name}/`);
    }
  }
}

// 3. Copy offline data catalogs from src/data to dist/webview/data
const srcData = path.join(__dirname, '..', 'src', 'data');
const distData = path.join(distWebview, 'data');
if (fs.existsSync(srcData)) {
  if (!fs.existsSync(distData)) {
    fs.mkdirSync(distData, { recursive: true });
  }
  const dataEntries = fs.readdirSync(srcData);
  for (const entry of dataEntries) {
    if (entry.endsWith('.json')) {
      fs.copyFileSync(path.join(srcData, entry), path.join(distData, entry));
      console.log(`[BUILD:REPL] Copied data catalog -> dist/webview/data/${entry}`);
    }
  }
}

// 4. Copy modular frontend extensions from src/webview/modules to dist/webview/modules
const srcModules = path.join(srcWebview, 'modules');
const distModules = path.join(distWebview, 'modules');
if (fs.existsSync(srcModules)) {
  if (!fs.existsSync(distModules)) {
    fs.mkdirSync(distModules, { recursive: true });
  }
  const moduleEntries = fs.readdirSync(srcModules);
  for (const entry of moduleEntries) {
    if (entry.endsWith('.js')) {
      fs.copyFileSync(path.join(srcModules, entry), path.join(distModules, entry));
      console.log(`[BUILD:REPL] Copied module -> dist/webview/modules/${entry}`);
    }
  }
}

console.log('[BUILD:REPL] Webview bundle created successfully in dist/webview.');
process.exit(0);
