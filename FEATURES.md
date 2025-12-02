# CardSpoke Feature Catalog

This catalog enumerates CardSpoke's capabilities so product, QA, and extension authors can reference everything in one place.

## Core Product Shape
- **Card-based knowledge system:** Presents information as hierarchical, tiered cards for lightweight knowledge organization.
- **Intentionally minimal core:** Keeps the built-in experience ultra-light while delegating optional complexity to Extensions.
- **Extension-ready foundation:** Built with a dedicated Extension Framework so new behaviors can be added without bloating the core. The runtime exposes `CardSpoke_MODS` with hook dispatch, an event bus, and dev tools for inspecting hook stats and errors.
- **Extension types:** Themes, Patches, Plugins, Mods, Kits, and Expansions cover cosmetic tweaks through deep logic swaps.
- **Schema-aware:** Uses an explicit `schemaVersion` to gate features and Extensions.

## User Data & Storage
- **Local-first ownership:** User data stays on-device by default; no hosted data or silent syncs.
- **Storage layers:** Uses LocalStorage for configuration, IndexedDB for structured card data/history, and optional Capacitor Filesystem for attachments or exports when explicitly enabled. Preferences (rich text, grid mode, typography, high contrast, dev mode, active theme extension) persist under `cardspoke_*` keys.
- **No default telemetry:** The core avoids analytics/tracking beacons and requires explicit consent before any off-device transmission.
- **Dataset operations:** Supports multiple datasets with per-dataset metadata, quick switching, and export/import flows (JSON, CSV, Markdown, TXT). Backups are versioned and timestamped (`cardspoke-backup-*.json`) to simplify rollback.

## Extension Ecosystem
- **Extension types:** Supports Themes (visual only), Patches (packaged updates), Plugins (feature additions), Mods (fundamental changes), Kits (Theme/Patch bundles), and Expansions (bundles with Plugins or Mods).
- **Metadata transparency:** Every Extension declares type, version, author, AI assistants, description, date, dependencies, schema compatibility, and official/angled flags.
- **Toggleable experimentation:** Patches and Mods are expected to be switchable for compatibility testing and safe rollback.
- **Bundles & packs:** Kits and Expansions enable curated combinations of Extensions for layered functionality. Dev tooling surfaces hook usage counts and errors per Extension to speed regression hunting.

## Deviations (Forks)
- **Fork allowance with boundaries:** Community members can ship Deviations but must not use the "CardSpoke" name/branding and must provide mandatory metadata and credit.
- **Monetization permitted:** Deviations and Extensions may be monetized while remaining transparent about authorship and endorsement status.

## Platform & Build Footprint
- **Prebuilt web bundle:** Ships bundled web assets in `www/` that feed the Capacitor shells.
- **Cross-platform shells:** Capacitor workflows support Android and iOS, with CLI-driven sync/open commands for each platform. The HTML entrypoint is `file://` friendly, so the app can open directly from the filesystem before native wrapping.
- **Native integrations:** Uses Capacitor plugins for app lifecycle, preferences (key/value storage), and filesystem persistence.

## Schema, Versioning, and Compatibility
- **Current schema version:** Tracks data compatibility with `schemaVersion = 4`.
- **Data domains:** Schema covers cards/relationships, user preferences, extension registry caches, and optional local file references.
- **Migration rules:** Schema bumps require documented migrations, idempotent steps, explicit fallbacks, and extension impact notes.
- **Compatibility safeguards:** Extensions must declare schema compatibility and refuse to run on unsupported versions; read-only access or prompts are expected when migrations fail.

## Developer & Testing Experience
- **Node/uvu toolchain:** Uses Node (18+) with `npm run build` for web assets and `npm test` (uvu) for automated checks.
- **Extension-focused testing:** `test-extension-improvements.js` and related tests target extension scenarios to keep compatibility tight.
- **Capacitor workflows:** `npm run sync` plus platform-specific `open` scripts accelerate native iteration without manual setup.

## Community & Governance Features
- **Accountability for angled content:** Community-made Extensions must publish versioning, creator identity, AI assistants used, and changelogs to stay transparent.
- **Credit & ownership rules:** CardSpoke stays free-to-use under JX Holdings, LLC ownership; creators must credit CardSpoke/JX Holdings and avoid implying official endorsement without approval.
- **Quality expectations:** Extensions should fail safely, avoid data corruption or obfuscation, and document install/removal steps for user trust.
