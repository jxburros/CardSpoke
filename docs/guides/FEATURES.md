# CardSpoke Feature Catalog

This catalog enumerates CardSpoke's capabilities so product, QA, and extension authors can reference everything in one place.

**Current Version:** 0.16.0 | **Schema Version:** 4 | **Release Date:** 2025-11-30

## Core Product Shape
- **Card-based knowledge system:** Presents information as hierarchical, tiered cards for lightweight knowledge organization.
- **Intentionally minimal core:** Keeps the built-in experience ultra-light while delegating optional complexity to Extensions.
- **Self-contained bundle:** The `www/app.js` file is self-contained for `file://` protocol compatibility, with all utilities inlined to avoid CORS issues when opening directly from the filesystem.
- **Extension-ready foundation:** Built with a dedicated Extension Framework so new behaviors can be added without bloating the core. The runtime exposes `CardSpoke_MODS` with hook dispatch, an event bus, and dev tools for inspecting hook stats and errors.
- **Extension types:** Themes, Patches, Plugins, Mods, Kits, and Expansions cover cosmetic tweaks through deep logic swaps.
- **Schema-aware:** Uses an explicit `schemaVersion` (currently 4) to gate features and Extensions.

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
- **Import formats:** JSON (CardSpoke format), TXT (outline or append mode), DOCX (text extraction).
- **Bulk operations:** Bulk export/import of multiple cards with hierarchy preservation.
- **Backup system:** Create timestamped backups (`cardspoke-backup-*.json`) with one-click restore.

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
- `Ctrl+G` — Toggle grid/list view
- `Ctrl+[` / `Ctrl+]` — Navigate to parent/first child
- `Ctrl+/` — Show keyboard shortcuts help
- `Alt+T` — Toggle theme
- `Alt+C` — Toggle compact view
- `Escape` — Close modals/go back

## Extension Ecosystem
- **Extension Hub:** Central UI for managing installed extensions, browsing the store (coming soon), using the Extension Wizard, and testing in the Playground.
- **Extension types:** Supports Themes (visual only), Patches (packaged updates), Plugins (feature additions), Mods (fundamental changes), Kits (Theme/Patch bundles), and Expansions (bundles with Plugins or Mods).
- **Extension Wizard:** Step-by-step UI for creating new extensions with metadata, JS, and CSS.
- **Playground:** Live code testing environment for extension development.
- **Hot reload:** Reload extensions without restarting the app via `CardSpoke_MODS.reload()`.
- **Safe Mode:** Launch with `?safemode` URL parameter to disable all extensions for troubleshooting.
- **Metadata transparency:** Every Extension declares type, version, author, AI assistants, description, date, dependencies, schema compatibility, and official/angled flags.
- **Toggleable experimentation:** Patches and Mods are switchable for compatibility testing and safe rollback.
- **Dev tools:** Inspect mods, view hook stats, access error logs, and manually test hooks.

## Accessibility Features
- **Focus trapping:** Modal dialogs trap keyboard focus for screen reader compatibility.
- **ARIA attributes:** Proper labeling for interactive elements.
- **Reduced motion support:** Respects `prefers-reduced-motion` preference.
- **Keyboard navigation:** Full keyboard accessibility throughout the app.
- **High contrast mode:** Enhanced visibility for users with visual impairments.
- **Dyslexia-friendly typography:** Specialized font sizing and spacing preset.

## Deviations (Forks)
- **Fork allowance with boundaries:** Community members can ship Deviations but must not use the "CardSpoke" name/branding and must provide mandatory metadata and credit.
- **Monetization permitted:** Deviations and Extensions may be monetized while remaining transparent about authorship and endorsement status.

## Platform & Build Footprint
- **Prebuilt web bundle:** Ships bundled web assets in `www/` that feed the Capacitor shells. The bundle is self-contained and works via `file://` protocol.
- **Cross-platform shells:** Capacitor workflows support Android and iOS, with CLI-driven sync/open commands for each platform.
- **Native integrations:** Uses Capacitor plugins for app lifecycle (`@capacitor/app`), preferences (`@capacitor/preferences`), and filesystem persistence (`@capacitor/filesystem`).

## Schema, Versioning, and Compatibility
- **Current schema version:** 4 (as of v0.16.0).
- **Data domains:** Schema covers cards/relationships, user preferences, extension registry caches, and optional local file references.
- **Default store shape:** `rootOrder`, `cards`, `mods`, `bookmarks`, `recentCards`, `viewMode`, `activeTheme`, `richTextEnabled`.
- **Migration rules:** Schema bumps require documented migrations, idempotent steps, explicit fallbacks, and extension impact notes.
- **Compatibility safeguards:** Extensions must declare schema compatibility and refuse to run on unsupported versions.

## Developer & Testing Experience
- **Node/uvu toolchain:** Uses Node (18+) with `npm run build` for web assets and `npm test` (uvu) for automated checks.
- **Extension-focused testing:** `test-extension-improvements.js` and related tests target extension scenarios to keep compatibility tight.
- **Capacitor workflows:** `npm run sync` plus platform-specific `open` scripts accelerate native iteration without manual setup.

## Community & Governance Features
- **Accountability for angled content:** Community-made Extensions must publish versioning, creator identity, AI assistants used, and changelogs to stay transparent.
- **Credit & ownership rules:** CardSpoke stays free-to-use under JX Holdings, LLC ownership; creators must credit CardSpoke/JX Holdings and avoid implying official endorsement without approval.
- **Quality expectations:** Extensions should fail safely, avoid data corruption or obfuscation, and document install/removal steps for user trust.
