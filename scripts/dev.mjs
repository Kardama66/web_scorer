import { spawn } from 'node:child_process';

const npmCmd = process.platform === 'win32' ? 'npm' : 'npm';
const shell = process.platform === 'win32';

const backend = spawn(`${npmCmd} run dev --workspace backend`, {
  stdio: 'inherit',
  shell
});

const frontend = spawn(`${npmCmd} run dev --workspace frontend`, {
  stdio: 'inherit',
  shell
});

const cleanup = () => {
  backend.kill('SIGINT');
  frontend.kill('SIGINT');
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

backend.on('exit', (code) => {
  if (code && code !== 0) {
    process.exit(code);
  }
});

frontend.on('exit', (code) => {
  if (code && code !== 0) {
    process.exit(code);
  }
});
