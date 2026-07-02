# Changelog

All notable changes to CardSpoke are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

- **CardSpoke Core platform layer** (OS preparation): new reusable, DOM-free modules under `www/src/core/` — `typed-cards.js`, `queries.js`, `migrations.js`, `actions.js`, `conversions.js`, `app-modes.js`, `profiles.js`, `import-export.js` — re-exported by the core-only entry `www/src/core/index.js`.
- **Typed cards**: cards may declare an application kind via `modsData.kind` (`note`, `repository_page`, `project`, `task`, `deck`, `slide`, `contact`, `plant`, `care_log`, `reminder`, `collection`) with validation, safe migration, and query support. Legacy cards remain fully valid; unknown/future kinds are preserved.
- **Typed query helpers**: `listCardsByKind`, `listRootCardsByKind`, `listChildrenByKind`, `findCardsByKindAndTag`, `findDueReminders`, `findTasksDueToday`, `findPlantsWithTrackingEnabled`, plus collection-card filter evaluation.
- **Shared action registry**: existing card actions (edit, bookmark, duplicate, share, add child, delete, import TXT) registered as shared actions; typed-card actions added (task done/todo and plant watering/tracking functional; note/deck/project/contact workflows as contracts).
- **Conversion utilities**: note→task, note→slide, outline→deck, children→slides, outline→project, reminder creation, and reversible kind conversion — routed through the shell's undo/save mechanisms when invoked from the app.
- **Runtime profiles**: `full` (default), `lite`, and stub `os` profiles resolved from `?profile=` or `window.CardSpokeProfile`, with a central feature-flag map; nonessential menu entries hide under `lite`/`os`.
- **App mode registry**: built-in stub modes (`cardspoke`, `repository`, `notes`, `projects`, `decks`, `contacts`, `plants`) filtering cards by kind; `navState` is now mode-aware (defaults to `cardspoke`).
- **Kind-filterable import/export**: pure export transforms (JSON/Markdown/TXT/CSV/HTML) filterable by kind(s), tag, or subtree; import validation preserves and migrates typed metadata without stripping unknown data.
- **Core-only build target**: `npm run build:core` emits `dist/cardspoke-core.js` (ESM) and `dist/cardspoke-core.umd.cjs` (UMD).
- **Architecture docs**: `docs/architecture/` — `CORE_SHELL_SPLIT.md`, `TYPED_CARDS.md`, `APP_MODES.md`, `ACTION_REGISTRY.md`, `CONVERSIONS.md`, `PROFILES.md`, `OS_LIGHT_ROADMAP.md`.
- 82 new tests covering typed cards, queries, migrations, actions, conversions, profiles, app modes, import/export, and the headless core entry.

### Changed

- Store load and JSON import now run the typed-card migration layer (idempotent; fills missing kind defaults, never deletes data).

---

## [0.17.0] – 2026-02-17

### Added

- **Backlinks panel** (`getBacklinks`): the Read view now shows all cards that link to the current card via `[[Title]]` references, rendered as clickable tiles.
- **Related-cards panel** (`getRelatedCards`): the Read view shows cards sharing tags with the current card, ranked by `matchScore` and capped by a configurable `limit`.
- `CHANGELOG.md` (this file) created.

### Fixed

- Vite build no longer emits an `outDir`-overlaps-`root` warning; the bundle now writes to `dist/app.js` and is copied to `www/app.js` by a post-build plugin.
- `npm run build` produces an unminified, readable IIFE bundle (function names and single-quote formatting preserved) so the automated test suite can verify code structure.
- Removed duplicate `build:vite` script from `package.json` (it was an alias for `build`).

### Changed

- README build-step description updated to reflect the Vite bundler (replaces the outdated "concatenates source slices" phrasing).
- README `www/src/` layout entry updated to describe the Vite build workflow.
- README quick-example updated to use the correct public API (`window.CardSpoke.registerPlugin`) instead of the internal `window.CardSpoke.Plugin.register`.
- README duplicate "Support & Questions" section removed; a single "Support & Disclosure Channels" section remains.

---

## [0.16.x and earlier]

Earlier releases predated this changelog file. See the Git log for historical changes.
