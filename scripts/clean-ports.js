/**
 * Port Cleaner Script (Zero Residual Processes Policy)
 * Forcefully terminates any process listening on target ports (3000, 8080).
 */

const { execSync } = require('child_process');

const targetPorts = process.argv.slice(2).map(Number).filter(Boolean);
const ports = targetPorts.length > 0 ? targetPorts : [3000, 8080];

let killedCount = 0;

for (const port of ports) {
  try {
    const output = execSync(`lsof -ti :${port}`, { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim();
    if (output) {
      const pids = output.split('\n').filter(Boolean);
      for (const pid of pids) {
        try {
          process.kill(Number(pid), 'SIGTERM');
          console.log(`[KILL] Terminated PID ${pid} listening on port ${port} (SIGTERM).`);
          killedCount++;
        } catch (killErr) {
          try {
            process.kill(Number(pid), 'SIGKILL');
            console.log(`[KILL] Force-killed PID ${pid} listening on port ${port} (SIGKILL).`);
            killedCount++;
          } catch (forceErr) {
            console.error(`[ERROR] Failed to kill PID ${pid}: ${forceErr.message}`);
          }
        }
      }
    }
  } catch (err) {
    // Port is free
  }
}

if (killedCount > 0) {
  console.log(`[SUMMARY] Released ${killedCount} process(es). Ports are now clean.`);
} else {
  console.log(`[CLEAN] No active processes found on target ports (${ports.join(', ')}).`);
}

process.exit(0);
