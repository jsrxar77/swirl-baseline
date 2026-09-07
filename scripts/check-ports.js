/**
 * Port Audit Script (Zero-Network Policy)
 * Inspects default ports (3000, 8080) or provided arguments for listening sockets.
 * Returns code 0 if all clean, code 1 if ports are occupied.
 */

const { execSync } = require('child_process');

const targetPorts = process.argv.slice(2).map(Number).filter(Boolean);
const ports = targetPorts.length > 0 ? targetPorts : [3000, 8080];

let occupied = false;

for (const port of ports) {
  try {
    const output = execSync(`lsof -ti :${port}`, { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim();
    if (output) {
      const pids = output.split('\n').join(', ');
      console.log(`[OCCUPIED] Port ${port} is occupied by PID(s): ${pids}`);
      occupied = true;
    }
  } catch (err) {
    // Exit code non-zero from lsof means port is not in use
  }
}

if (occupied) {
  console.log('[ALERT] Target ports are in use. Run "npm run ports:clean" to release them.');
  process.exit(1);
} else {
  console.log(`[CLEAN] All target ports (${ports.join(', ')}) are free.`);
  process.exit(0);
}
