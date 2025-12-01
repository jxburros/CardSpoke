# Developer Guide (Core App)

This guide explains how to work on the CardSpoke core app, run tests, and align with the project’s lightweight, extension-first philosophy.

## Architecture Overview
- **Ultra-light core:** Keep the main bundle lean. Prefer Extensions for new features to avoid permanent bloat.
- **Card model:** UI presents hierarchical, tiered cards for navigating knowledge. Keep data structures minimal and schema-forward.
- **Extension boundary:** Core should expose hooks and configuration points; invasive changes belong to Mods or Expansions.
- **Local-first:** Default storage is LocalStorage/IndexedDB; avoid adding network dependencies without opt-in controls.

## Repository Layout
- `www/` – Prebuilt client bundle consumed by Capacitor. Update via the build pipeline before syncing.
- `tests/` – uvu test suites.
- `types/` – Shared types.
- `test-extension-improvements.js` – Extension behavior checks.
- `capacitor.config.json` – Platform configuration for Capacitor.

## Development Workflow
1. Install dependencies: `npm install` (Node 18+ recommended).
2. Make changes in the source that feeds `www/` (if editing the web bundle) and rebuild:
   ```bash
   npm run build
   ```
3. Run tests:
   ```bash
   npm test
   ```
4. For mobile validation, sync and open the native shells (see [Capacitor Guide](./README.CAPACITOR.md)).

## Coding Conventions
- Keep the code ultra-light; avoid unnecessary dependencies and heavy abstractions.
- Do not silently collect or transmit user data; any remote integration must be explicit and opt-in.
- Prefer pure, deterministic functions; make side effects explicit.
- Add hooks/events instead of baking in narrow features; Extensions should be able to compose behavior.
- Avoid try/catch around imports; let module resolution fail loudly.
- Maintain clear separation between core logic and angled content (Extensions).

## Testing
- Use `uvu` (`npm test`) for fast unit/behavioral coverage.
- Co-locate tests under `tests/` with descriptive filenames.
- For Extension-specific tests, include metadata samples and compatibility toggles.
- When adding schema changes, cover migration and fallback behavior.

## Accessibility & UX
- Keep UI fast and uncluttered; avoid over-nesting of controls.
- Ensure keyboard navigation and readable contrast in default themes; document any deviations in Theme Extensions.

## Performance
- Keep bundles small; prune dead code and unused dependencies.
- Prefer lazy loading for heavy assets injected by Extensions.
- Use the “Bake Mode” concept (merging Extensions) cautiously to avoid shipping incompatible combinations.

## Release Hygiene
- Update changelogs and metadata for any core update.
- Document schema version changes and migrations in [Schema & Migration Docs](./SCHEMA.md).
- Clearly mark whether a change is **official** (core) or **angled** (Extension).

## Open Items
- [PLACEHOLDER] Source directory mapping for the prebuilt `www/` assets.
- [PLACEHOLDER] Preferred linter/formatter settings if/when adopted.

