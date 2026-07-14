# oh-my-codex-pennix v0.18.86

> Release notes template for the Pennix fork. The tag workflow regenerates this file into the final GitHub release body.

## Summary

`v0.18.86` makes Codex's native footer the single source of truth for model and reasoning display, while keeping OMX's tmux status renderer focused on operational state. It also updates the general OMX model contract to `gpt-5.6-terra` and restores packaging validation on npm 12.

## Highlights

- Fresh and OMX-managed Codex configurations now use `tui.status_line = ["model-with-reasoning"]` instead of suppressing the native footer.
- Setup and launch repair migrate known OMX-owned legacy footer presets without overwriting user-owned `status_line` values.
- The tmux renderer no longer repeats model or reasoning effort; cost, exact context, token/cache, team, session, path, git, and time remain available there.
- General/default model routes and generated native-agent TOMLs now default to `gpt-5.6-terra`; explicit mini and spark routes are retained.

## Fixes / compatibility

- `npm pack --json` parsing accepts both legacy result arrays and npm 12 package-name mappings, covering packed-install smoke validation and package contracts.
- Regression coverage now locks the model-only native footer, Terra defaults, user status-line preservation, and the two npm JSON output shapes.

## Validation

- `npm test`
- `npm run lint`
- `npm pack --dry-run`
- `git diff --check`
- `node dist/scripts/check-version-sync.js --tag v0.18.86`

## Contributors

Thanks to the contributors who made this release possible.

**Full Changelog**: [`v0.18.85...v0.18.86`](https://github.com/PennixRv/oh-my-codex/compare/v0.18.85...v0.18.86)
