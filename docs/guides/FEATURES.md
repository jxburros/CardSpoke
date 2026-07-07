# CardSpoke Feature Catalog

This catalog enumerates CardSpoke's capabilities so product, QA, and plugin authors can reference everything in one place.

**Current Version:** 0.17.0 | **Schema Version:** 4 | **Release Date:** 2026-02-17

## Core Product Shape

- **Card-based knowledge system:** Presents information as hierarchical, tiered cards for lightweight knowledge organization.
- **Intentionally minimal core:** Keeps the built-in experience ultra-light while delegating optional complexity to plugins.
- **Self-contained bundle:** The `www/app.js` file is self-contained for `file://` protocol compatibility, with all utilities inlined to avoid CORS issues when opening directly from the filesystem.
- **Plugin-ready foundation:** Built with a three-layer plugin system so new behaviors can be added without bloating the core. The runtime exposes the Plugin API with middleware pipeline, event system, and dev tools.
- **Plugin layers:** Theme (CSS only), Feature (CSS+JS), and App (CSS+JS+overrides) cover cosmetic tweaks through full app transformations.
- **Schema-aware:** Uses an explicit `schemaVersion` (currently 4) to gate features and plugins.

## User Interface Features

- **Dark/Light theme toggle:** Switch between dark and light modes via the header button or `Alt+T` keyboard shortcut.
- **Rich Text mode:** Enable markdown-style formatting in card bodies via Appearance settings (`cardspoke_richtext`).
- **Grid View:** Toggle between list and grid layouts for card display (`cardspoke_gridView`).
- **Compact View:** Reduce visual density with compact mode (`store.viewMode`).
- **High Contrast mode:** Accessibility option for improved readability (`cardspoke_highcontrast`).
- **Typography presets:** Choose from Default, Comfortable, Compact, or Dyslexia-Friendly reading modes (`cardspoke_typography`).
- **Developer Mode:** Enable debug logging and developer features (`cardspoke_devmode`).
- **Save status indicator:** Visual feedback showing save state (pending, saved, error) in the header.
- **Toast notifications:** Non-blocking feedback with hover-to-pause, click-to-dismiss, and keyboard accessibility.
- **Breadcrumb navigation:** Track and navigate the card hierarchy.
- **Getting Started guide:** First-run onboarding for new users.

## Card Management

- **Hierarchical cards:** Create parent-child relationships between cards with unlimited nesting depth.
- **Card CRUD:** Create, read, update, and delete cards with full undo/redo support.
- **Card duplication:** Duplicate cards with or without children.
- **Card sharing:** Copy cards as JSON or Markdown (single card or entire tree).
- **Drag and drop:** Reorder and reparent cards via drag-and-drop.
- **Bookmarks:** Star cards for quick access via the Bookmarks panel.
- **Recent cards:** Track recently viewed/edited cards for quick recall.
- **Card links:** Reference other cards using `[[Card Title]]` syntax with backlink detection.

## Tag System

- **Tag creation:** Add multiple tags per card using comma or space separation.
- **Tag Manager:** Rename, merge, or delete tags across all cards.
- **Smart tag suggestions:** AI-like suggestions based on content similarity with other tagged cards.
- **Tag filtering:** Click tags to filter and search by tag.

## Search Features

- **Fuzzy search:** Typo-tolerant search using Levenshtein distance scoring.
- **Multi-dataset search:** Search across current dataset or all datasets simultaneously.
- **Advanced search:** Filter by text, tag, bookmark status, or date range.
- **Keyboard navigation:** Arrow keys to navigate results, Enter to select.
- **Search highlighting:** Matched terms highlighted in results.

## User Data & Storage

- **Local-first ownership:** User data stays on-device by default; no hosted data or silent syncs.
- **Storage layers:** Uses LocalStorage for configuration and IndexedDB for structured card data/history. Optional Capacitor Filesystem for exports when running in native shells. Preferences persist under `cardspoke_*` keys.
- **No default telemetry:** The core avoids analytics/tracking beacons and requires explicit consent before any off-device transmission.
- **Dataset operations:** Supports multiple datasets with per-dataset metadata, quick switching via the Dataset Manager, and PIN protection for sensitive datasets.
- **Cloud storage drivers:** Optional integration with Google Drive, OneDrive, or WebDAV (requires OAuth configuration).

## Import & Export

- **Export formats:** JSON (instance/subtree/single card), CSV, Markdown, and TXT.
- **Import formats:** JSON (CardSpoke format), TXT (outline or append mode).
- **Bulk operations:** Bulk export/import of multiple cards with hierarchy preservation.
- **Timestamped exports:** JSON/TXT/Markdown/CSV exports are named `cardspoke-{type}-{timestamp}.{ext}` (e.g. `cardspoke-instance-1719936000000.json`); re-importing a JSON export restores that data into the active or a new dataset.

## Undo/Redo & Recovery

- **Undo/Redo stack:** Up to 50 actions with Ctrl+Z/Ctrl+Y shortcuts.
- **Trash Bin:** Recover deleted cards from the trash with restore or permanent delete options (up to 100 items).

## Keyboard Shortcuts

- `Ctrl+N` — New card
- `Ctrl+F` — Focus search
- `Ctrl+H` — Go to home
- `Ctrl+B` — Show bookmarks
- `Ctrl+R` — Show recent cards
- `Ctrl+Z` / `Ctrl+Y` — Undo / Redo
- `Ctrl+D` — Duplicate current card
- `Ctrl+E` — Show plugin manager
- `Ctrl+U` — Upload data
- `Ctrl+T` — Focus tags input (when editing a card)
- `Ctrl+G` — Toggle grid/list view
- `Ctrl+[` / `Ctrl+]` — Navigate to parent/first child
- `Ctrl+/` — Show keyboard shortcuts help
- `Alt+T` — Toggle theme
- `Alt+C` — Toggle compact view
- `Escape` — Close modals/go back

## Plugin Ecosystem

- **Plugin Manager:** Central UI for viewing installed plugins (with risk and Active/Suspended badges), installing from file/URL, browsing the Gallery, and creating plugins directly in-app; plugins can be enabled, suspended, and removed, and their state persists across reloads.
- **Three-layer system:** Theme (CSS only, SAFE, auto-enabled), Feature (CSS+JS, LOW, auto-enabled), and App (CSS+JS+overrides, HIGH, enabled manually) layers cover the full spectrum from visual tweaks to full app transformations.
- **Plugin API:** Isolated, permission-gated `ctx` contexts with `api.ui`, `api.data`, `api.storage`, `api.events`, and `api.middleware`; every resource a plugin creates is tracked and cleaned up automatically on suspend/delete.
- **Middleware Pipeline:** Priority-weighted interceptors that wrap core operations (`card.create`, `card.update`, `card.delete`, `card.save`, `card.render`) with `preventDefault()` and `stopPropagation()` control (registered via `ctx.api.middleware`).
- **Component Registry:** Register and override UI components (`Card`, `Header`, `Sidebar`, `SearchBar`) with priority-based resolution instead of fragile DOM manipulation.
- **Storage Driver Registry:** Registry for pluggable storage backends (experimental; the app's built-in drivers cover IndexedDB, LocalStorage, LocalFile, and cloud).
- **Permission System:** Deny-by-default user consent dialogs for sensitive operations (ui-override, storage, network, filesystem, core-override, data-modify), persisted per plugin and revoked on delete.
- **Resource Management:** Automatic tracking and cleanup of DOM elements, event/data listeners, middleware, and components when plugins are suspended or removed.
- **Override system:** App-layer plugins can rename the app (`overrides.appName`); deeper transformations are built with the `ctx` API (component overrides, middleware, injected UI).
- **Hot reload:** Enable/disable plugins without page refresh with full resource cleanup.
- **Safe Mode:** Launch with `?safemode` URL parameter to disable all plugins for troubleshooting.
- **Risk assessment:** Automatic risk scoring based on layer and code analysis (network access, DOM manipulation, storage usage).
- **Metadata transparency:** Every plugin declares name, version, author, description, layer, compatibility, and permissions in its manifest.
- **TypeScript support:** Type definitions available in `types/` directory for type-safe plugin development.
- **Dev tools:** Inspect plugins, view hook stats, access error logs, and manually test hooks.

## Core Platform Layer

A separate, larger platform layer lives under `www/src/core/` alongside the plugin-architecture modules, providing building blocks for richer app variants and integrations. It has its own dedicated build target, `npm run build:core` (Vite build via `vite.core.config.js`, producing `dist/cardspoke-core.js` and `dist/cardspoke-core.umd.cjs`), and is documented in detail under `docs/architecture/`:

- **Typed cards:** Cards can carry a `kind` (e.g. note, task) with kind-specific fields and validation. See [TYPED_CARDS.md](../architecture/TYPED_CARDS.md).
- **Shared action registry:** A registry for declaring and dispatching named actions across core and plugin code, with override semantics. See [ACTION_REGISTRY.md](../architecture/ACTION_REGISTRY.md).
- **Conversion utilities:** Convert between typed cards (e.g. note→task, outline→deck). See [CONVERSIONS.md](../architecture/CONVERSIONS.md).
- **Runtime profiles:** Named profiles (`full`, `lite`, `os`) that gate available features/surfaces for different deployment targets. See [PROFILES.md](../architecture/PROFILES.md).
- **App-mode registry:** Registration and switching between distinct application modes. See [APP_MODES.md](../architecture/APP_MODES.md).
- **Kind-filterable import/export:** Import/export utilities that can filter or target specific card kinds.

## Accessibility Features

- **Focus trapping:** Modal dialogs trap keyboard focus for screen reader compatibility.
- **ARIA attributes:** Proper labeling for interactive elements.
- **Reduced motion support:** Respects `prefers-reduced-motion` preference.
- **Keyboard navigation:** Full keyboard accessibility throughout the app.
- **High contrast mode:** Enhanced visibility for users with visual impairments.
- **Dyslexia-friendly typography:** Specialized font sizing and spacing preset.

## Deviations (Forks)

- **Fork allowance with boundaries:** Community members can ship Deviations but must not use the "CardSpoke" name/branding and must provide mandatory metadata and credit.
- **Monetization permitted:** Deviations and plugins may be monetized while remaining transparent about authorship and endorsement status.

## Platform & Build Footprint

- **Prebuilt web bundle:** Ships bundled web assets in `www/` that feed the Capacitor shells. The bundle is self-contained and works via `file://` protocol.
- **Cross-platform shells:** Capacitor workflows support Android and iOS, with CLI-driven sync/open commands for each platform.
- **Native integrations:** Uses Capacitor plugins for app lifecycle (`@capacitor/app`), preferences (`@capacitor/preferences`), and filesystem persistence (`@capacitor/filesystem`).

## Schema, Versioning, and Compatibility

- **Current schema version:** 4 (as of v0.17.0).
- **Data domains:** Schema covers cards/relationships, user preferences, plugin registry, and optional local file references.
- **Default store shape:** `rootOrder`, `cards`, `plugins`, `bookmarks`, `recentCards`, `viewMode`, `activeTheme`, `richTextEnabled`.
- **Migration rules:** Schema bumps require documented migrations, idempotent steps, explicit fallbacks, and plugin impact notes.
- **Compatibility safeguards:** Plugins must declare compatibility and refuse to run on unsupported versions.

## LocalStorage Keys

CardSpoke uses LocalStorage for preferences and lightweight configuration. All keys are prefixed with `cardspoke_`:

### User Preferences

- `cardspoke_richtext` – Boolean: Enable markdown-style rich text formatting in card bodies
- `cardspoke_gridView` – Boolean: Toggle between grid and list card layouts
- `cardspoke_highcontrast` – Boolean: Enable high-contrast mode for accessibility
- `cardspoke_typography` – String: Typography preset (default/comfortable/compact/dyslexia)
- `cardspoke_devmode` – Boolean: Enable developer mode and debug logging
- `cardspoke_theme` – String: Active theme (light/dark)
- `cardspoke_activeThemeMod` – String: ID of active theme plugin (if any)

### Application State

- `cardspoke_datasets` – JSON: Array of dataset metadata objects
- `cardspoke_dataset_metadata` – JSON: Current dataset manager metadata
- `cardspoke_lastUploadTab` – String: Last active upload tab (JSON/TXT/CSV/MD)
- `cardspoke_hasSeenGettingStarted` – Boolean: Tracks onboarding guide completion

### File System Integration

- `cardspoke_file_handle_*` – Various: File handle references for local file storage (Capacitor)

## Developer & Testing Experience

- **Node/uvu toolchain:** Uses Node (18+) with `npm run build` for web assets and `npm test` (uvu) for automated checks.
- **Plugin-focused testing:** `sample-extensions.test.js` and related tests target plugin package format and layer system to keep compatibility tight.
- **Capacitor workflows:** `npm run sync` plus platform-specific `open` scripts accelerate native iteration without manual setup.

## Community & Governance Features

- **Accountability for angled content:** Community-made plugins must publish versioning, creator identity, AI assistants used, and changelogs to stay transparent.
- **Credit & ownership rules:** CardSpoke stays free-to-use under JX Holdings, LLC ownership; creators must credit CardSpoke/JX Holdings and avoid implying official endorsement without approval.
- **Quality expectations:** Plugins should fail safely, avoid data corruption or obfuscation, and document install/removal steps for user trust.
