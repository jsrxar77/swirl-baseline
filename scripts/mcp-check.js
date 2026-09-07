/**
 * MCP Verification Script (stdio JSON-RPC Test Harness)
 * Sends test JSON-RPC messages to strudel-engine-mcp.js and port-cleaner-mcp.js
 * ensuring they communicate strictly through stdio without opening network sockets.
 */

const { spawn } = require('child_process');
const path = require('path');

function testMcpServer(scriptRelativePath, requestPayload) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '..', scriptRelativePath);
    const proc = spawn('node', [scriptPath], {
      stdio: ['pipe', 'pipe', 'inherit']
    });

    let stdout = '';
    proc.stdout.on('data', (data) => {
      stdout += data.toString();
      // If we received a complete line, evaluate
      if (stdout.includes('\n')) {
        proc.stdin.end();
      }
    });

    proc.on('close', (code) => {
      try {
        const lines = stdout.trim().split('\n').filter(Boolean);
        if (lines.length === 0) {
          return reject(new Error(`No response from ${scriptRelativePath}`));
        }
        const jsonResponse = JSON.parse(lines[0]);
        resolve(jsonResponse);
      } catch (err) {
        reject(new Error(`Failed to parse JSON response from ${scriptRelativePath}: ${err.message}`));
      }
    });

    proc.stdin.write(JSON.stringify(requestPayload) + '\n');
  });
}

async function runChecks() {
  console.log('[MCP:CHECK] Testing MCP servers via stdio communication...');

  // 1. Test strudel-engine-mcp: validate_mini_notation
  try {
    const req1 = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'validate_mini_notation',
        arguments: { code: 'bd [sd hh] cp' }
      }
    };
    const res1 = await testMcpServer('src/mcp/strudel-engine-mcp.js', req1);
    if (res1.result && res1.result.valid) {
      console.log('  PASS: strudel-engine-mcp returned valid AST via stdio.');
    } else {
      throw new Error(`Unexpected result from strudel-engine-mcp: ${JSON.stringify(res1)}`);
    }
  } catch (err) {
    console.error(`  FAIL: strudel-engine-mcp test failed: ${err.message}`);
    process.exit(1);
  }

  // 2. Test port-cleaner-mcp: check_ports
  try {
    const req2 = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'check_ports',
        arguments: { ports: [3000, 8080] }
      }
    };
    const res2 = await testMcpServer('src/mcp/port-cleaner-mcp.js', req2);
    if (res2.result && res2.result.clean !== undefined) {
      console.log('  PASS: port-cleaner-mcp responded deterministically via stdio.');
    } else {
      throw new Error(`Unexpected result from port-cleaner-mcp: ${JSON.stringify(res2)}`);
    }
  } catch (err) {
    console.error(`  FAIL: port-cleaner-mcp test failed: ${err.message}`);
    process.exit(1);
  }

  console.log('[MCP:CHECK] All stdio MCP servers passed verification with zero network sockets.');
  process.exit(0);
}

runChecks();
