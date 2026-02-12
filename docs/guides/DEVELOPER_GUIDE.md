# Developer Guide (Core App)

This guide explains how to work on the CardSpoke core app, run tests, and align with the project's lightweight, mod-first philosophy.

**Current Version:** 0.16.0 | **Schema Version:** 4 | **Release Date:** 2025-11-30

## Architecture Overview
- **Ultra-light core:** Keep the main bundle lean. `www/app.js` is a self-contained bundle built by concatenating the numbered source slices in `www/src/*.js` (via `npm run build`) with inline helpers for DOM creation (`h()`), markdown rendering (`simpleMarkdown()`), accessibility utilities (focus trap, debounce, ID generation), and fuzzy search (Levenshtein distance).
- **Card model:** UI presents hierarchical, tiered cards for navigating knowledge. The default store shape (`createDefaultStore`) tracks `rootOrder`, per-card records (`cards`), `bookmarks`, `recentCards`, `mods`, `viewMode`, `activeTheme`, and `richTextEnabled`.
- **Mod boundary:** Core exposes `window.CardSpoke_MODS` for hook dispatch plus dev tools (hook stats, error log). Mods should register hooks instead of directly mutating global state where possible.
- **Local-first:** Default storage is LocalStorage/IndexedDB; avoid adding network dependencies without opt-in controls. Preferences persist under `cardspoke_*` keys:
  - `cardspoke_richtext` - Rich text/markdown mode
  - `cardspoke_gridView` - Grid vs list layout
  - `cardspoke_highcontrast` - High contrast mode
  - `cardspoke_typography` - Typography preset (default/comfortable/compact/dyslexia)
  - `cardspoke_devmode` - Developer mode
  - `cardspoke_theme` - Light/dark theme
  - `cardspoke_activeThemeMod` - Active theme mod ID
- **Self-contained for file:// protocol:** The app can be opened directly from the filesystem without CORS issues. All utilities are inlined in `app.js`.

## Repository Layout
- `www/` - Prebuilt client bundle consumed by Capacitor:
  - `src/` - Numbered source slices that concatenate into the browser bundle
  - `app.js` - Main application (self-contained output of `npm run build`)
  - `styles.css` - Default styling with light/dark themes and typography presets
  - `index.html` - Entry point with modal structures and script loading
  - `capacitor.js` - Capacitor runtime bridge
  - `modules/` - Reference ES module versions (not used at runtime)
- `tests/` - uvu test suites (~227 tests across 18 files)
- `docs/` - Project documentation organized by category
- `capacitor.config.json` - Platform configuration for Capacitor

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
- Add hooks/events instead of baking in narrow features; mods should be able to compose behavior. Use the existing event bus and hook runner exposed via `CardSpoke_MODS` instead of ad-hoc globals.
- Avoid try/catch around imports; let module resolution fail loudly.
- Maintain clear separation between core logic and angled content (mods).

## Testing
- Use `uvu` (`npm test`) for fast unit/behavioral coverage.
- Co-locate tests under `tests/` with descriptive filenames.
- For mod-specific tests, include metadata samples and compatibility toggles.
- When adding schema changes, cover migration and fallback behavior.

## Accessibility & UX
- Keep UI fast and uncluttered; avoid over-nesting of controls.
- Ensure keyboard navigation and readable contrast in default themes; document any deviations in theme mods.

## Performance
- Keep bundles small; prune dead code and unused dependencies.
- Prefer lazy loading for heavy assets injected by mods.

## Release Hygiene
- Update changelogs and metadata for any core update.
- Document schema version changes and migrations in [Schema & Migration Docs](../api/SCHEMA.md).
- Clearly mark whether a change is **official** (core) or **angled** (mod).

## Open Items
- [PLACEHOLDER] Source directory mapping for the prebuilt `www/` assets.
- [PLACEHOLDER] Preferred linter/formatter settings if/when adopted.
