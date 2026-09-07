/**
 * Port Cleaner MCP Server
 * Operates strictly over standard input/output (stdio) using JSON-RPC 2.0.
 * Exposes deterministic system tools for checking and cleaning ports.
 */

const readline = require('readline');
const { execSync } = require('child_process');

const TOOLS = [
  {
    name: 'check_ports',
    description: 'Audits target ports for listening processes and returns occupancy status without opening network connections.',
    inputSchema: {
      type: 'object',
      properties: {
        ports: {
          type: 'array',
          items: { type: 'number' },
          description: 'Array of port numbers to check (e.g. [3000, 8080])'
        }
      }
    }
  },
  {
    name: 'kill_orphans',
    description: 'Terminates lingering orphan processes bound to target ports to satisfy Golden Rule 2.',
    inputSchema: {
      type: 'object',
      properties: {
        ports: {
          type: 'array',
          items: { type: 'number' },
          description: 'Array of port numbers to clean (e.g. [3000, 8080])'
        }
      }
    }
  }
];

function handleToolCall(name, args) {
  const targetPorts = (args && Array.isArray(args.ports) && args.ports.length > 0)
    ? args.ports
    : [3000, 8080];

  switch (name) {
    case 'check_ports': {
      const occupants = [];
      for (const port of targetPorts) {
        try {
          const output = execSync(`lsof -ti :${port}`, { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim();
          if (output) {
            const pids = output.split('\n').map(Number).filter(Boolean);
            occupants.push({ port, pids });
          }
        } catch (e) {
          // Port is clean
        }
      }
      return {
        clean: occupants.length === 0,
        targetPorts: targetPorts,
        occupants: occupants
      };
    }

    case 'kill_orphans': {
      const killed = [];
      for (const port of targetPorts) {
        try {
          const output = execSync(`lsof -ti :${port}`, { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim();
          if (output) {
            const pids = output.split('\n').map(Number).filter(Boolean);
            for (const pid of pids) {
              try {
                process.kill(pid, 'SIGTERM');
                killed.push({ port, pid, signal: 'SIGTERM' });
              } catch (termErr) {
                try {
                  process.kill(pid, 'SIGKILL');
                  killed.push({ port, pid, signal: 'SIGKILL' });
                } catch (killErr) {
                  // Ignore
                }
              }
            }
          }
        } catch (e) {
          // Port is clean
        }
      }
      return {
        success: true,
        targetPorts: targetPorts,
        killedCount: killed.length,
        killed: killed
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  let request;
  try {
    request = JSON.parse(trimmed);
  } catch (err) {
    const errorResponse = {
      jsonrpc: '2.0',
      id: null,
      error: { code: -32700, message: 'Parse error' }
    };
    process.stdout.write(JSON.stringify(errorResponse) + '\n');
    return;
  }

  const { id, method, params } = request;

  if (method === 'tools/list') {
    const response = {
      jsonrpc: '2.0',
      id: id,
      result: { tools: TOOLS }
    };
    process.stdout.write(JSON.stringify(response) + '\n');
    return;
  }

  if (method === 'tools/call') {
    try {
      const toolName = params && params.name;
      const toolArgs = (params && params.arguments) || {};
      const result = handleToolCall(toolName, toolArgs);
      const response = {
        jsonrpc: '2.0',
        id: id,
        result: result
      };
      process.stdout.write(JSON.stringify(response) + '\n');
    } catch (toolErr) {
      const errorResponse = {
        jsonrpc: '2.0',
        id: id,
        error: { code: -32603, message: toolErr.message }
      };
      process.stdout.write(JSON.stringify(errorResponse) + '\n');
    }
    return;
  }

  const fallbackResponse = {
    jsonrpc: '2.0',
    id: id,
    result: { status: 'acknowledged' }
  };
  process.stdout.write(JSON.stringify(fallbackResponse) + '\n');
});
