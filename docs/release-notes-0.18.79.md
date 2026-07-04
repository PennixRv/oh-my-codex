# oh-my-codex-pennix v0.18.79

Drafted: 2026-07-04

Patch release for the Pennix fork plugin-mode setup guidance line.

## Summary

`0.18.79` narrows plugin-mode setup to the contract the fork has already been describing:

- `AGENTS.md` remains the main persistent orchestration contract.
- Root `developer_instructions` becomes an optional OMX bootstrap instead of an always-appended managed payload.
- Existing custom user guidance is preserved by default, while historical managed OMX wording can still be refreshed explicitly.

## Included changes

### Optional plugin bootstrap instead of forced append

- Plugin-mode setup now distinguishes three root `developer_instructions` states: missing, recognized historical OMX-managed guidance, and custom user-authored content.
- When `developer_instructions` is missing, non-interactive plugin setup now preserves that state by default instead of auto-injecting the OMX fragment.
- Setup can still add the OMX plugin bootstrap when explicitly instructed to do so.

### Historical managed guidance refresh stays available

- Historical OMX-managed `developer_instructions` is no longer auto-migrated during non-interactive plugin setup.
- Setup now treats that historical block as preserved by default and refreshes it only when explicitly told to update the plugin bootstrap wording.
- The log output now differentiates between adding a bootstrap and refreshing an existing historical bootstrap.

### Custom user instructions remain user-owned

- Custom root `developer_instructions` is no longer appended with the OMX plugin fragment.
- This makes the implementation match the user-facing model: `AGENTS.md` is the durable OMX contract, while root `developer_instructions` is optional and user-owned unless the user explicitly opts into the bootstrap.
- Focused regression coverage also locks preservation of a user-owned root `model_reasoning_effort` alongside the narrowed plugin bootstrap behavior.

## Recommended release message

> `v0.18.79` makes plugin-mode setup treat root `developer_instructions` as optional OMX bootstrap text instead of a forced append: custom guidance now stays untouched by default, historical managed wording can still be refreshed explicitly, and `AGENTS.md` remains the primary orchestration contract.
