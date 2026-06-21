import { spawn } from 'child_process';
import net from 'net';
import path from 'path';

const command = process.argv[2]; // 'dev' or 'start'
const startPort = parseInt(process.env.PORT || '3000', 10);

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}

async function findAvailablePort(port) {
  let currentPort = port;
  while (!(await isPortAvailable(currentPort))) {
    currentPort++;
  }
  return currentPort;
}

async function run() {
  const port = await findAvailablePort(startPort);
  console.log(`Starting Next.js ${command} on port ${port}...`);
  
  // Secure, cross-platform execution:
  // Bypass `npx`, `.cmd` wrappers, and the system shell entirely by executing Next.js via Node directly.
  // This guarantees `shell: false` works on Windows without throwing ENOENT/spawn errors.
  const nextBin = path.join('node_modules', 'next', 'dist', 'bin', 'next');
  
  const child = spawn(process.execPath, [nextBin, command, '-p', port.toString()], {
    stdio: 'inherit',
    shell: false
  });

  child.on('exit', (code) => {
    process.exit(code || 0);
  });
  
  child.on('error', (err) => {
    console.error('Failed to start process:', err);
    process.exit(1);
  });
}

run();
