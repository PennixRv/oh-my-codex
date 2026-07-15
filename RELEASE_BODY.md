# oh-my-codex-pennix v0.18.87

> Release notes template for the Pennix fork. The tag workflow regenerates this file into the final GitHub release body.

## Summary

`v0.18.87` corrects a provider-agnostic `omx doctor` recommendation that could misclassify validated custom-provider context settings as oversized.

## Fix

- Model-context guidance now keys off both the model route and provider selection. The generic no-provider setup recommendation remains available, while an explicit provider such as `cch` is treated as provider-specific and does not receive an unsupported numeric warning.
- Regression coverage preserves the existing default-route warning and verifies that `cch` with `275000 / 240000` remains warning-free and unmodified.

## Validation

- `npm test`
- `npm run lint`
- `npm pack --dry-run`
- `git diff --check`
- `node dist/scripts/check-version-sync.js --tag v0.18.87`

## Contributors

Thanks to the contributors who made this release possible.

**Full Changelog**: [`v0.18.86...v0.18.87`](https://github.com/PennixRv/oh-my-codex/compare/v0.18.86...v0.18.87)
