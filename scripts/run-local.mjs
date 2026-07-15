import net from 'node:net';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const host = '127.0.0.1';
const preferredPorts = [5173, 5174, 4173, 0];

async function findAvailablePort() {
  for (const port of preferredPorts) {
    const availablePort = await tryPort(port);
    if (availablePort !== null) return availablePort;
  }
  throw new Error('No local port could be reserved.');
}

function tryPort(port) {
  return new Promise((resolvePort) => {
    const server = net.createServer();
    server.once('error', () => resolvePort(null));
    server.listen(port, host, () => {
      const address = server.address();
      const availablePort = typeof address === 'object' && address ? address.port : null;
      server.close(() => resolvePort(availablePort));
    });
  });
}

function openBrowser(url) {
  if (process.platform === 'win32') {
    spawn('cmd.exe', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' }).unref();
  }
}

const port = await findAvailablePort();
const url = `http://${host}:${port}/`;
const vite = resolve('node_modules', 'vite', 'bin', 'vite.js');
console.log(`Starting Greedy Sweeper at ${url}`);

const server = spawn(process.execPath, [vite, '--host', host, '--port', String(port)], {
  stdio: 'inherit',
});

server.once('spawn', () => {
  setTimeout(() => openBrowser(url), 750).unref();
});

server.once('exit', (code) => process.exit(code ?? 0));
