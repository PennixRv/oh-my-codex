import { resolveOmxDisplayVersionSync } from '../utils/version.js';
import { OMX_DISPLAY_NAME } from '../utils/package.js';

export function version(): void {
  const displayVersion = resolveOmxDisplayVersionSync();
  if (displayVersion) {
    console.log(`${OMX_DISPLAY_NAME} ${displayVersion}`);
    console.log(`Node.js ${process.version}`);
    console.log(`Platform: ${process.platform} ${process.arch}`);
  } else {
    console.log(`${OMX_DISPLAY_NAME} (version unknown)`);
  }
}
