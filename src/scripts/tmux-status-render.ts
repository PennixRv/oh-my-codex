import { renderTmuxStatusSide } from '../tmux-status/render.js';

async function main(): Promise<void> {
  const [side, paneId] = process.argv.slice(2);
  if ((side !== 'left' && side !== 'right') || !paneId) {
    process.exitCode = 1;
    return;
  }

  try {
    const output = await renderTmuxStatusSide(side, paneId);
    process.stdout.write(output);
  } catch {
    process.exitCode = 0;
  }
}

void main();
