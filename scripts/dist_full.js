const { execSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');

try {
  console.log('Running electron-builder (npm run dist)...');
  execSync('npm run dist', { stdio: 'inherit', cwd: root });

  const ps = path.join(root, 'scripts', 'make_installer.ps1');
  console.log('Running installer creation script:', ps);
  execSync(`powershell -ExecutionPolicy Bypass -File "${ps}"`, { stdio: 'inherit', cwd: root });
} catch (err) {
  console.error('dist:full failed:', err && err.message ? err.message : err);
  process.exit(err.status || 1);
}
