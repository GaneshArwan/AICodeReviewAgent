import net from 'net';

const startPort = parseInt(process.argv[2] || '3000', 10);

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(false);
      }
    });
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
    console.warn(`Port ${currentPort} is in use, trying ${currentPort + 1}...`);
    currentPort++;
  }
  return currentPort;
}

findAvailablePort(startPort).then((port) => {
  process.stdout.write(port.toString());
});
