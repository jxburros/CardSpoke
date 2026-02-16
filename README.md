# CardSpoke

**Version:** 0.16.0 | **Schema:** v4 | **Release Date:** 2025-11-30

CardSpoke is a lightweight, card-based knowledge system built for extensibility. The core intentionally stays minimal while a mod framework enables themes, features, and app-layer transformations. Users keep control of their data with a local-first storage model and optional off-device integrations.

## Why CardSpoke
- **Ultra-lightweight core:** The shipped bundle (`www/app.js`) is self-contained for `file://` usage and keeps helpers inlined to minimize dependencies.
- **Plugin-first architecture:** A three-layer plugin system (theme, feature, app) lets the community expand the product without bloating the core. The runtime exposes modern Plugin API and Middleware Pipeline for extensions.
- **User ownership:** Data stays local by default; no hosted data or silent syncs. LocalStorage is used for preferences and datasets, while IndexedDB stores the graph of cards.
- **Transparent ecosystem:** Clear metadata, authorship, and changelog expectations for all angled (community) content.

## Getting Started
1. Install dependencies (Node 18+ recommended):
   ```bash
   npm install
   ```
2. Run the web build (concatenates the source slices in `www/src` into `www/app.js`):
   ```bash
   npm run build
   ```
3. Start a Capacitor workflow (see [Capacitor Guide](./docs/guides/README.CAPACITOR.md)):
   ```bash
   npm run sync
   ```
4. Run the tests:
   ```bash
   npm test
   ```

## Project Layout
- `www/` – Prebuilt web assets for the Capacitor shell. `app.js` embeds utilities, renderer logic, and the mod runtime; `styles.css` holds the default light/dark styling and typography presets.
- `www/src/` – Source slices for `app.js`. Run `npm run build` to concatenate the numbered files into the single bundle for `file://` usage.
- `www/modules/` – Reference ES module versions kept for documentation (not used at runtime).
- `tests/` – Automated tests (uvu).
- `docs/` – Project documentation organized by category (see [Documentation](#documentation) below).
- `sample-mods/` – Example mod implementations across all three layers.
- `sample_extensions/` – Legacy sample extensions for reference.

## Documentation

All documentation is organized in the `docs/` folder:

### Guides
- [Developer Guide](./docs/guides/DEVELOPER_GUIDE.md) – Core app development workflow and conventions
- [Code & Mod System Handbook](./docs/guides/CODE_AND_MOD_SYSTEM_HANDBOOK.md) – End-to-end architecture and mod development deep dive
- [Test Guide](./docs/guides/TEST_GUIDE.md) – Testing practices and commands
- [Capacitor Guide](./docs/guides/README.CAPACITOR.md) – Mobile platform workflows
- [Deviation Guide](./docs/guides/DEVIATION_GUIDE.md) – Rules for forks and derivatives
- [Feature Catalog](./docs/guides/FEATURES.md) – Complete feature reference

### API & Schema
- [API Reference](./docs/api/API_REFERENCE.md) – Mod runtime APIs and utilities
- [Schema & Migration Docs](./docs/api/SCHEMA.md) – Data model and versioning
- [Schema Reference](./docs/api/SCHEMA_REFERENCE.md) – Persisted data model summary
- [Storage Driver Interface](./docs/api/STORAGE_DRIVER_INTERFACE.md) – Storage abstraction contracts

### Mod System
- [Mod System Overview](./docs/MOD_SYSTEM.md) – Complete mod system documentation

### Policies
- [Code of Conduct](./docs/policies/CODE_OF_CONDUCT.md) – Community standards
- [Security & Safety](./docs/policies/SECURITY_AND_SAFETY.md) – Security expectations
- [Storage & Privacy](./docs/policies/STORAGE_AND_PRIVACY.md) – Privacy notes
- [Release & Versioning](./docs/policies/RELEASE_AND_VERSIONING.md) – Release guidelines

### Specifications
- [CardSpoke Specification v1](./docs/specifications/cardspoke_spec_v1.md) – Canonical specification

## Mod Framework Overview

CardSpoke features a modern, extensible mod system with three architectural layers:

- **Theme Layer:** CSS only; cosmetic changes without logic modifications. Low risk.
- **Feature Layer:** CSS and JavaScript; adds new features using the Plugin API. Medium risk.
- **App Layer:** Full capabilities including core overrides, custom storage drivers, and app rebranding. High risk.

### Modern Architecture (v0.16.0+)

The mod system includes:

- **Middleware Pipeline**: Priority-weighted interceptors for core operations (card save, delete, render, etc.)
- **Plugin API**: Sandboxed contexts with `api.ui`, `api.data`, `api.storage`, and `api.events`
- **Component Registry**: Type-safe UI component overrides with priority-based resolution
- **Storage Driver Registry**: Pluggable storage backends (IndexedDB, cloud, git, etc.)
- **Permission System**: User consent for sensitive operations with explicit permission requests
- **TypeScript Support**: Full type definitions via `@cardspoke/core` package

### Quick Example

```javascript
// Modern Plugin API
window.CardSpoke.Plugin.register('my-mod', {
  manifest: {
    name: "My Mod",
    version: "1.0.0",
    author: "Author",
    layer: "feature",
    permissions: ["ui-override"]
  },
  setup: async (ctx) => {
    // Use sandboxed APIs
    const cards = ctx.api.data.listCards();
    ctx.api.ui.showToast(`Loaded ${cards.length} cards`, 'info');
  }
});
```

See [Plugin System Documentation](./docs/MOD_SYSTEM.md) for complete details.

## Deviation (Fork) Rules
Deviations are forks/derivatives that must not use the "CardSpoke" name or branding. They must include mandatory metadata, clear credit to CardSpoke and JX Holdings, and avoid implying official endorsement.

## Storage Model
CardSpoke is local-first (LocalStorage/IndexedDB). Preferences (rich text, grid view, typography, high-contrast, dev mode) live under `cardspoke_*` keys in LocalStorage. Datasets are namespaced to allow multiple vaults with their own metadata, and backups are exported as JSON/CSV/Markdown/TXT directly from the UI. Optional off-device storage may be wired through integrations chosen by the user; no automatic sync or hosted data.

## Contributing
- Follow plugin development practices in [Plugin System Overview](./docs/MOD_SYSTEM.md).
- Adhere to safety expectations in [Security & Safety Considerations](./docs/policies/SECURITY_AND_SAFETY.md).
- Submit issues/PRs with clear metadata and changelog entries.
- Respect branding restrictions (CardSpoke name/branding cannot be used in forks).

## Support & Questions
Please open an issue with details about your environment, mods in use, and schema version. For licensing or branding questions, include your planned distribution channel and whether the work is official or angled.

## Support & Disclosure Channels
- General support, bug reports, and feature requests: GitHub Issues at <https://github.com/jxburros/CardSpoke/issues>.
- Security disclosures: open a GitHub Issue and label it `Security`; include impact, repro steps, and affected versions.
- Branding usage for community themes and forks follows the restrictions in the [Deviation Guide](./docs/guides/DEVIATION_GUIDE.md) and [LICENSE](./LICENSE).
