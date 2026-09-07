/**
 * MCP Build and Syntax Validation Script
 * Verifies that MCP server scripts in src/mcp/ and configuration in .agent/mcp.json are valid.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('[MCP:BUILD] Validating MCP infrastructure...');

// 1. Verify .agent/mcp.json
const mcpConfigPath = path.join(__dirname, '..', '.agent', 'mcp.json');
if (!fs.existsSync(mcpConfigPath)) {
  console.error('[ERROR] .agent/mcp.json does not exist.');
  process.exit(1);
}

try {
  const config = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
  if (!config.mcpServers) {
    throw new Error('Missing "mcpServers" key.');
  }
  for (const [name, srv] of Object.entries(config.mcpServers)) {
    if (srv.transport !== 'stdio') {
      throw new Error(`Server ${name} must use transport "stdio", found "${srv.transport}".`);
    }
  }
  console.log('[PASS] .agent/mcp.json is valid and strictly enforces stdio transport.');
} catch (err) {
  console.error(`[ERROR] Invalid MCP configuration: ${err.message}`);
  process.exit(1);
}

// 2. Verify server scripts syntax
const mcpDir = path.join(__dirname, '..', 'src', 'mcp');
const servers = ['strudel-engine-mcp.js', 'port-cleaner-mcp.js'];

for (const server of servers) {
  const scriptPath = path.join(mcpDir, server);
  if (!fs.existsSync(scriptPath)) {
    console.error(`[ERROR] MCP server script missing: ${scriptPath}`);
    process.exit(1);
  }
  try {
    execSync(`node -c "${scriptPath}"`);
    console.log(`[PASS] Syntax check passed for src/mcp/${server}`);
  } catch (err) {
    console.error(`[ERROR] Syntax error in ${server}: ${err.message}`);
    process.exit(1);
  }
}

console.log('[MCP:BUILD] All MCP servers validated successfully.');
process.exit(0);
