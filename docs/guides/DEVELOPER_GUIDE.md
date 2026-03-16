# Developer Guide (Core App)

This guide explains how to work on the CardSpoke core app, run tests, and align with the project's lightweight, plugins-first philosophy.

**Current Version:** 0.17.0 | **Schema Version:** 4 | **Release Date:** 2026-02-17

## Architecture Overview
- **Ultra-light core:** Keep the main bundle lean. `www/app.js` is a self-contained bundle built by concatenating the numbered source slices in `www/src/*.js` (via `npm run build`) with inline helpers for DOM creation (`h()`), markdown rendering (`simpleMarkdown()`), accessibility utilities (focus trap, debounce, ID generation), and fuzzy search (Levenshtein distance).
- **Card model:** UI presents hierarchical, tiered cards for navigating knowledge. The default store shape (`createDefaultStore`) tracks `rootOrder`, per-card records (`cards`), `bookmarks`, `recentCards`, `plugins`, `viewMode`, `activeTheme`, and `richTextEnabled`.
- **Plugin system:** Core exposes `window.CardSpoke.Plugin`, `window.CardSpoke.Middleware`, and `window.CardSpoke.ComponentRegistry` for extensibility. Plugins should use these modern APIs instead of directly mutating global state where possible.
- **Local-first:** Default storage is LocalStorage/IndexedDB; avoid adding network dependencies without opt-in controls. Preferences persist under `cardspoke_*` keys:
  - `cardspoke_richtext` - Rich text/markdown mode
  - `cardspoke_gridView` - Grid vs list layout
  - `cardspoke_highcontrast` - High contrast mode
  - `cardspoke_typography` - Typography preset (default/comfortable/compact/dyslexia)
  - `cardspoke_devmode` - Developer mode
  - `cardspoke_theme` - Light/dark theme
  - `cardspoke_activeThemeMod` - Active theme plugin ID
- **Self-contained for file:// protocol:** The app can be opened directly from the filesystem without CORS issues. All utilities are inlined in `app.js`.

## Repository Layout
- `www/` - Prebuilt client bundle consumed by Capacitor:
  - `src/` - Numbered source slices that concatenate into the browser bundle
  - `app.js` - Main application (self-contained output of `npm run build`)
  - `styles.css` - Default styling with light/dark themes and typography presets
  - `index.html` - Entry point with modal structures and script loading
  - `capacitor.js` - Capacitor runtime bridge
  - `modules/` - Reference ES module versions (not used at runtime)
- `tests/` - uvu test suites (26 files; currently 336 passing tests via `npm test`)
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
- Use middleware pipeline and event bus for extensibility; plugins should be able to compose behavior. Use the existing event bus and middleware system exposed via `CardSpoke.Plugin` and `CardSpoke.Middleware` instead of ad-hoc globals.
- Avoid try/catch around imports; let module resolution fail loudly.
- Maintain clear separation between core logic and plugin content.

## Testing
- Use `uvu` (`npm test`) for fast unit/behavioral coverage.
- Co-locate tests under `tests/` with descriptive filenames.
- For plugin-specific tests, include metadata samples and compatibility toggles.

## Accessibility & UX
- Keep UI fast and uncluttered; avoid over-nesting of controls.
- Ensure keyboard navigation and readable contrast in default themes; document any deviations in theme plugins.

## Performance
- Keep bundles small; prune dead code and unused dependencies.
- Prefer lazy loading for heavy assets injected by plugins.

## Release Hygiene
- Update changelogs and metadata for any core update.
- Clearly mark whether a change is **official** (core) or **angled** (plugin).

## Source Mapping & Tooling Status
- Runtime source slices are ordered and concatenated into `www/app.js` as follows:
  1. `www/src/00-core-systems.js` - Middleware Pipeline, Component Registry, Plugin API, Storage Driver Registry, Permissions System
  2. `www/src/01-metadata-and-utilities.js` - App metadata, utilities (DOM helpers, markdown rendering, accessibility, fuzzy search)
  3. `www/src/02-storage-and-plugins.js` - Storage drivers (IndexedDB, LocalStorage, Cloud), Plugin system
  4. `www/src/03-data-and-modals.js` - CRUD operations (createCard, updateCard, deleteCard), modals
  5. `www/src/04-rendering-and-init.js` - Rendering functions (breadcrumbs, lists, cards, search)
  6. `www/src/05-advanced-systems-and-boot.js` - Undo/redo, tags, search, boot sequence
- Build command: `npm run build` (concatenates `www/src/*.js` into `www/app.js` in lexical order).
- There is currently no repository-enforced linter/formatter configuration. Keep style consistent with surrounding code and validate changes with `npm test`.
