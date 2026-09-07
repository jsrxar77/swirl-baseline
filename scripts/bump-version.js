/**
 * Swirl - Automated Stable Release Bump Script
 * Usage: node scripts/bump-version.js [patch|minor|major|<specific-version>] [optional release notes]
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const rootDir = path.join(__dirname, "..");
const pkgPath = path.join(rootDir, "package.json");
const versionsPath = path.join(rootDir, "release", "versions.json");
const releasesDocPath = path.join(rootDir, "docs", "RELEASES.md");

const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
const currentVersion = pkg.version || "0.1.0";
const bumpType = process.argv[2] || "patch";
const releaseNotes = process.argv[3] || "Actualización de versión estable de Swirl";

// 1. Calculate new version
let parts = currentVersion.split(".").map(n => parseInt(n, 10));
if (parts.length !== 3) parts = [0, 1, 0];

let newVersion = currentVersion;
if (bumpType === "major") {
  newVersion = `${parts[0] + 1}.0.0`;
} else if (bumpType === "minor") {
  newVersion = `${parts[0]}.${parts[1] + 1}.0`;
} else if (bumpType === "patch") {
  newVersion = `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
} else if (/^\d+\.\d+\.\d+$/.test(bumpType)) {
  newVersion = bumpType;
} else if (/^\d+\.\d+$/.test(bumpType)) {
  newVersion = `${bumpType}.0`;
} else {
  console.error("[RELEASE:ERROR] Modo de bump invalido. Usa patch, minor, major o x.y.z");
  process.exit(1);
}

const displayVersion = newVersion.split(".").slice(0, 2).join(".");

console.log(`[RELEASE] Promoviendo Swirl: ${currentVersion} -> ${newVersion} (display: v${displayVersion})...`);

// 2. Update package.json
pkg.version = newVersion;
pkg.scripts["install:ide"] = `"/Applications/Antigravity IDE.app/Contents/Resources/app/bin/antigravity-ide" --install-extension release/swirl-${newVersion}.vsix --force`;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
console.log("[RELEASE] package.json actualizado.");

// 3. Rebuild bundles with new version
console.log("[RELEASE] Compilando bundles y sincronizando cabecera visual...");
execSync("npm run build", { cwd: rootDir, stdio: "inherit" });

// 4. Run tests
console.log("[RELEASE] Ejecutando pruebas de estabilidad...");
execSync("npm run test:repl && npm run test:offline", { cwd: rootDir, stdio: "inherit" });

// 5. Package new VSIX
console.log("[RELEASE] Empaquetando nuevo VSIX en release/...");
execSync("npm run package:vsix", { cwd: rootDir, stdio: "inherit" });

const vsixFile = `release/swirl-${newVersion}.vsix`;
const today = new Date().toISOString().split("T")[0];

// 6. Update release/versions.json
let versions = [];
if (fs.existsSync(versionsPath)) {
  try {
    versions = JSON.parse(fs.readFileSync(versionsPath, "utf8"));
  } catch (e) {}
}
versions.unshift({
  version: newVersion,
  displayVersion: displayVersion,
  date: today,
  vsix: vsixFile,
  notes: releaseNotes
});
fs.writeFileSync(versionsPath, JSON.stringify(versions, null, 2) + "\n", "utf8");
console.log("[RELEASE] release/versions.json actualizado.");

// 7. Append to docs/RELEASES.md
let docContent = "";
if (fs.existsSync(releasesDocPath)) {
  docContent = fs.readFileSync(releasesDocPath, "utf8");
}
const releaseEntry = `\n## [${newVersion}] - ${today}\n- **Versión Display:** \`v${displayVersion}\`\n- **Paquete VSIX:** [\`${vsixFile}\`](file://${path.join(rootDir, vsixFile)})\n- **Notas:** ${releaseNotes}\n`;
docContent = docContent.replace("---", "---" + releaseEntry);
fs.writeFileSync(releasesDocPath, docContent, "utf8");
console.log("[RELEASE] docs/RELEASES.md actualizado.");

// 8. Auto-install in VS Code if available
try {
  execSync(`code --install-extension "${path.join(rootDir, vsixFile)}" --force`, { stdio: "inherit" });
  console.log(`[RELEASE] Extensión swirl-${newVersion}.vsix instalada exitosamente en VS Code.`);
} catch (e) {
  console.log("[RELEASE:NOTE] No se pudo instalar automaticamente en VS Code (verifique que code este cerrado o disponible).");
}

console.log(`\n[RELEASE:SUCCESS] Version estable Swirl ${newVersion} (v${displayVersion}) lista y archivada.`);
