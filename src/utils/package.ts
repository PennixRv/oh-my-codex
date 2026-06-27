/**
 * Package root resolution utility
 */

import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

export const OMX_PACKAGE_NAME = 'oh-my-codex-pennix';
export const OMX_LEGACY_PACKAGE_NAME = 'oh-my-codex';
export const OMX_DISPLAY_NAME = OMX_PACKAGE_NAME;
export const OMX_LEGACY_DISPLAY_NAME = OMX_LEGACY_PACKAGE_NAME;
export const OMX_FORK_PRODUCT_NAME = 'oh-my-codex-pennix';
export const OMX_FORK_BRAND_NAME = 'OMX';
export const OMX_FORK_USER_FACING_NAME = 'Pennix OMX';
export const OMX_FORK_AGENTS_HEADING = 'Pennix OMX';
export const OMX_FORK_REPO_SLUG = 'PennixRv/oh-my-codex';
export const OMX_FORK_REPO_URL = `https://github.com/${OMX_FORK_REPO_SLUG}.git`;
export const OMX_UPSTREAM_REPO_SLUG = 'Yeachan-Heo/oh-my-codex';
export const OMX_UPSTREAM_REPO_URL = `https://github.com/${OMX_UPSTREAM_REPO_SLUG}.git`;

export function isOmxPackageName(value: unknown): boolean {
  return value === OMX_PACKAGE_NAME || value === OMX_LEGACY_PACKAGE_NAME;
}

/**
 * Get the package root directory (where agents/, skills/, prompts/ live).
 * Works from dist/utils/, src/utils/, and bin/.
 */
export function getPackageRoot(): string {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    // Try going up from dist/utils/ or src/utils/
    const candidate = join(__dirname, '..', '..');
    if (existsSync(join(candidate, 'package.json'))) {
      return candidate;
    }
    // Try going up one more (from bin/)
    const candidate2 = join(__dirname, '..');
    if (existsSync(join(candidate2, 'package.json'))) {
      return candidate2;
    }
  } catch {
    // Fallback
  }
  return process.cwd();
}
