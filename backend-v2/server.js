/**
 * Production & Deployment Entry Point Fallback
 * 
 * Ensures compatibility with cloud hosting environments (such as Render, Railway, Heroku)
 * that execute 'node server.js' by default.
 * Directs execution to the compiled TypeScript bundle in dist/server.js.
 */

const fs = require('fs');
const path = require('path');

const distServer = path.join(__dirname, 'dist', 'server.js');

if (!fs.existsSync(distServer)) {
  console.log('[Render/Deploy] dist/server.js not found. Triggering build via tsc...');
  try {
    const { execSync } = require('child_process');
    execSync('npx tsc', { stdio: 'inherit', cwd: __dirname });
  } catch (err) {
    console.error('[Render/Deploy] Automatic TypeScript compilation failed:', err);
  }
}

require('./dist/server.js');
