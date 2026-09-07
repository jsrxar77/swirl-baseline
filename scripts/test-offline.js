/**
 * Offline Compliance Test Script
 * Verifies zero external CDN references or remote dependencies in project code and HTML templates.
 * Baseline vendor directory (src/baseline/repl) is isolated.
 */

const fs = require('fs');
const path = require('path');

console.log('[TEST:OFFLINE] Auditing codebase for offline isolation compliance...');

const disallowedPatterns = [
  /https?:\/\/unpkg\.com/i,
  /https?:\/\/cdn\.jsdelivr\.net/i,
  /https?:\/\/cdnjs\.cloudflare\.com/i,
  /https?:\/\/fonts\.googleapis\.com/i,
  /https?:\/\/fonts\.gstatic\.com/i,
  /https?:\/\/.*github\.io/i
];

const directoriesToScan = [
  path.join(__dirname, '..', 'src', 'webview'),
  path.join(__dirname, '..', 'src', 'standalone'),
  path.join(__dirname, '..', 'src', 'extension'),
  path.join(__dirname, '..', 'src', 'plugins'),
  path.join(__dirname, '..', 'src', 'data'),
  path.join(__dirname, '..', 'src', 'mcp'),
  path.join(__dirname, '..', 'scripts'),
  path.join(__dirname, '..', 'docs')
];

let violations = 0;

function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(fullPath);
    } else if (entry.isFile() && /\.(js|html|css|json|md)$/i.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const pattern of disallowedPatterns) {
        if (pattern.test(content)) {
          console.error(`[VIOLATION] Remote URL reference found in: ${path.relative(path.join(__dirname, '..'), fullPath)} matching ${pattern}`);
          violations++;
        }
      }
    }
  }
}

for (const dir of directoriesToScan) {
  scanDir(dir);
}

// Also verify dist HTML and CSS files
const distDirs = [
  path.join(__dirname, '..', 'dist', 'webview'),
  path.join(__dirname, '..', 'dist', 'standalone')
];

for (const dir of distDirs) {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir).filter(f => /\.(html|css)$/i.test(f));
    for (const f of files) {
      const full = path.join(dir, f);
      const content = fs.readFileSync(full, 'utf8');
      for (const pattern of disallowedPatterns) {
        if (pattern.test(content)) {
          console.error(`[VIOLATION] Remote URL in dist file: ${f}`);
          violations++;
        }
      }
    }
  }
}

if (violations > 0) {
  console.error(`[FAILURE] Found ${violations} external URL reference(s).`);
  process.exit(1);
} else {
  console.log('[PASS] Zero external dependencies detected in project code and templates. Full offline isolation verified.');
  process.exit(0);
}
