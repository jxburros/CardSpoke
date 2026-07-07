# Changelog

All notable changes to CardSpoke are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

- **Plugin system stability overhaul**: the plugin runtime is now reliable
  end-to-end across install, enable, suspend, delete, and page reload.
  - New `www/src/core/global-api.js` assembles and freezes the public
    `window.CardSpoke` surface (`registerPlugin`, `installPlugin`,
    `requestPermissions`, plus `Plugin`, `Middleware`, `ComponentRegistry`,
    `StorageDriverRegistry`, `PluginValidator`, `Permissions`,
    `PluginSandbox`, `utils`) **before** any app-layer code runs.
  - Plugins persist as source strings and are restored with their
    enabled/suspended state on reload via an idempotent `syncFromStore`
    (re-run after async IndexedDB/local-file loads).
  - New `ctx.api.middleware` lets plugins register tracked, auto-cleaned
    core-operation interceptors; `ctx.api.data.onUpdate` now fires on every
    card change; `ctx.api.data.createCard` applies `tags` in one call.
  - Suspend/enable and delete persist correctly; delete revokes the plugin's
    granted permissions; reinstalling an id updates it in place (no
    duplicates); a failing setup leaves the plugin installed-but-suspended.
  - The `overrides.appName` app rename now snapshots and fully restores the
    brand button on suspend/remove (no destroyed logo or ghost header).
  - `?safemode` reliably boots with all plugins disabled, and a dataset load
    failure (e.g. a PIN-decrypt error) no longer blanks the app — boot
    continues with a usable store so the user can recover.
- **Plugin documentation**: rewritten `docs/PLUGIN_SYSTEM.md` (full guide +
  `ctx` API reference), rewritten `docs/api/API_REFERENCE.md`, and a new
  `docs/PLUGIN_INVARIANTS.md` specifying the stability contract (what cannot
  change).
- **Working sample plugins**: nine packages (three per layer) plus
  `TEMPLATE.json`, each installing, enabling, suspending, deleting, and
  surviving reload; covered by `tests/plugin-lifecycle.test.js` and
  `tests/sample-extensions.test.js`.
- **Plugin-development Skills**: `.claude/skills/cardspoke-plugin-dev`
  (author/scaffold, with layer templates and quick references) and
  `.claude/skills/cardspoke-plugin-review` (validate/debug against the
  contract).
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
- Plugin Manager: the plugin toggle now reads **Suspend/Enable** with live
  Active/Suspended badges; the "Legacy Plugins" list only shows genuinely
  legacy (definition-less) entries; the theme picker in Appearance drives
  theme-layer plugins through the real plugin lifecycle.
- `types/index.d.ts` updated to the current runtime (full `window.CardSpoke`
  surface, `ctx.api.middleware`/`network`/`filesystem`, persisted-plugin
  shape, corrected `Permissions` methods and data-update event names).

### Removed

- Legacy duplicate plugin runtime `www/src/core.js` and the
  `npm run build:cat` concatenation script — the diverging second runtime was
  the root cause of plugin instability. `npm run build` (Vite) is now the
  single canonical build.
- Stale `www/app-orig.js` and the superseded root `PLUGIN_SYSTEM_ANALYSIS.md`
  snapshot.

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
