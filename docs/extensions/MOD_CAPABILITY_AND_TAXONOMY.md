# Mod Capability and Taxonomy

This document enumerates the officially recognized extension types in CardSpoke and the common capability areas mods may declare.

## Extension types

CardSpoke recognizes the following `meta.type` values:
- **Theme**: Cosmetic only; may override CSS variables and typography, but should not mutate data or logic.
- **Patch**: Targeted behavioral changes or fixes; may intercept hooks such as `onCardDelete` to block actions.
- **Plugin**: Adds user-facing features without rewriting the core (e.g., inline UI on card render).
- **Mod**: High-impact changes that can alter core logic and flows.
- **Kit**: Bundle of themes/patches shipped together.
- **Expansion**: Bundle that can include plugins or mods alongside themes.

## Capability hints

Extensions can publish a `capabilities` array in `meta` to advertise what they touch. Suggested values:
- `cards`: Creates/updates/deletes cards.
- `tags`: Reads or mutates tags.
- `ui`: Injects DOM or styles.
- `a11y`: Responds to accessibility hooks (theme/typography/high contrast).
- `export` / `import`: Hooks into data flows.
- `navigation`: Responds to `onNavigate`/`onSearch` (planned) to mirror router state.
- `storage`: Persists extra data; should document keys and cleanup on uninstall.

## Lifecycle expectations
- **Initialization**: Use `onAppInit` to set up, but keep it idempotent because mods can be hot-reloaded.
- **Enable/disable**: Always clean up DOM, timers, and listeners in `onDisable` before the runtime removes styles.
- **Uninstall**: Remove stored keys and release any remote handles inside `onUninstall`.
- **Errors**: Hook failures are counted and surfaced in the global extension error log; avoid throwing by catching and logging locally.

## Compatibility & schema
- Declare `schema_compatibility` in metadata when you depend on specific fields or preferences. The current runtime reports `schemaVersion` in the hook context so you can enforce guards.
- Respect the local-first model: avoid automatically syncing data off-device, and prefer the provided storage drivers or dataset metadata to gauge available space.
