# Developer Guide (Core App)

This guide explains how to work on the CardSpoke core app, run tests, and align with the project's lightweight, plugins-first philosophy.

**Current Version:** 0.17.0 | **Schema Version:** 4 | **Release Date:** 2026-02-17

## Architecture Overview

- **Ultra-light core:** Keep the main bundle lean. `www/app.js` is a self-contained bundle built by concatenating the domain-named source slices in `www/src/` (via `npm run build`) with inline helpers for DOM creation (`h()`), markdown rendering (`simpleMarkdown()`), accessibility utilities (focus trap, debounce, ID generation), and fuzzy search (Levenshtein distance).
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
  - `src/` - Domain-named source slices that concatenate into the browser bundle
  - `app.js` - Main application (self-contained output of `npm run build`)
  - `styles.css` - Default styling with light/dark themes and typography presets
  - `index.html` - Entry point with modal structures and script loading
  - `capacitor.js` - Capacitor runtime bridge
  - `modules/` - Reference ES module versions (not used at runtime)
- `tests/` - uvu test suites (26 files; currently 347 passing tests via `npm test`)
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

- Runtime source slices are concatenated into `www/app.js` in the following order:
  1. `www/src/state.js` - Shared application state (store, navState, instanceKey, undo/trash stacks, constants)
  2. `www/src/core.js` - Core plugin architecture: Middleware Pipeline, Component Registry, Plugin API, Storage Driver Registry, Permissions System
  3. `www/src/metadata.js` - App metadata, DOM helper (`h()`), utilities (debounce, uid, escapeHtml, fuzzy search), accessibility helpers, store factory, preference accessors, toast system
  4. `www/src/storage.js` - Storage drivers (IndexedDB, LocalStorage, LocalFile, Cloud), dataset manager, plugin system wiring
  5. `www/src/data.js` - CRUD operations (createCard, updateCard, deleteCard), data/modals UI
  6. `www/src/rendering.js` - Rendering functions (breadcrumbs, lists, cards, search)
  7. `www/src/systems.js` - Undo/redo, tags, search, advanced UX, boot sequence
- Build command: `npm run build` (concatenates `www/src/state.js`, `core.js`, `metadata.js`, `storage.js`, `data.js`, `rendering.js`, `systems.js` into `www/app.js`).
- A Vite IIFE build is also available via `npm run build:vite`, using `www/src/main.js` as entry point with the ESM source under `www/src/core/`.
- There is currently no repository-enforced linter/formatter configuration. Keep style consistent with surrounding code and validate changes with `npm test`.
