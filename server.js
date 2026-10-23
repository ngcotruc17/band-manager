/**
 * Root Deployment Entry Point Fallback
 * 
 * In case cloud environments run 'node server.js' from the repository root instead of backend-v2/
 */

const fs = require('fs');
const path = require('path');

const backendServer = path.join(__dirname, 'backend-v2', 'server.js');
const backendDist = path.join(__dirname, 'backend-v2', 'dist', 'server.js');

if (fs.existsSync(backendServer)) {
  require(backendServer);
} else if (fs.existsSync(backendDist)) {
  require(backendDist);
} else {
  console.log('[Root Deploy] Compiling backend-v2 TypeScript...');
  try {
    const { execSync } = require('child_process');
    execSync('npm --prefix backend-v2 run build', { stdio: 'inherit', cwd: __dirname });
    require(backendDist);
  } catch (err) {
    console.error('[Root Deploy] Failed to start backend-v2:', err);
    process.exit(1);
  }
}
