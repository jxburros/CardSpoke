# CardSpoke

![CardSpoke logo](./CardSpoke.svg)

**Version:** 0.17.0 | **Schema:** v4 | **Release Date:** 2026-02-17

CardSpoke is a lightweight, card-based knowledge system built for extensibility. The core intentionally stays minimal while a plugin framework enables themes, features, and app-layer transformations. Users keep control of their data with a local-first storage model and optional off-device integrations.

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
2. Run the web build (bundles the source in `www/src/` into `www/app.js` via Vite):
2. Run the web build (uses Vite to bundle the source slices in `www/src` into `www/app.js`):
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
- `www/` – Prebuilt web assets for the Capacitor shell. `app.js` embeds utilities, renderer logic, and the plugin runtime; `styles.css` holds the default light/dark styling and typography presets.
- `www/src/` – Source files for `app.js`. Run `npm run build` to produce the Vite IIFE bundle at `www/app.js`.
- `www/src/` – Source slices for `app.js`. Run `npm run build` to produce the single Vite bundle for `file://` usage. The legacy concatenation helper remains available as `npm run build:cat`.
- `www/modules/` – Reference ES module versions kept for documentation (not used at runtime).
- `tests/` – Automated tests (uvu).
- `docs/` – Project documentation organized by category (see [Documentation](#documentation) below).
- `sample-plugins/` – Example plugin implementations across all three layers.

## Documentation

All documentation is organized in the `docs/` folder:

### Guides
- [Developer Guide](./docs/guides/DEVELOPER_GUIDE.md) – Core app development workflow and conventions
- [Code & Plugin System Handbook](./docs/guides/CODE_AND_PLUGIN_SYSTEM_HANDBOOK.md) – End-to-end architecture and plugin development deep dive
- [Test Guide](./docs/guides/TEST_GUIDE.md) – Testing practices and commands
- [Capacitor Guide](./docs/guides/README.CAPACITOR.md) – Mobile platform workflows
- [Deviation Guide](./docs/guides/DEVIATION_GUIDE.md) – Rules for forks and derivatives
- [Feature Catalog](./docs/guides/FEATURES.md) – Complete feature reference

### API & Schema
- [API Reference](./docs/api/API_REFERENCE.md) – Plugin runtime APIs and utilities
- [Schema & Migration Docs](./docs/api/SCHEMA.md) – Data model and versioning
- [Schema Reference](./docs/api/SCHEMA_REFERENCE.md) – Persisted data model summary
- [Storage Driver Interface](./docs/api/STORAGE_DRIVER_INTERFACE.md) – Storage abstraction contracts

### Plugin System
- [Plugin System Overview](./docs/PLUGIN_SYSTEM.md) – Complete plugin system documentation

### Policies
- [Code of Conduct](./docs/policies/CODE_OF_CONDUCT.md) – Community standards
- [Security & Safety](./docs/policies/SECURITY_AND_SAFETY.md) – Security expectations
- [Storage & Privacy](./docs/policies/STORAGE_AND_PRIVACY.md) – Privacy notes
- [Release & Versioning](./docs/policies/RELEASE_AND_VERSIONING.md) – Release guidelines

### Specifications
- [CardSpoke Specification v1](./docs/specifications/cardspoke_spec_v1.md) – Canonical specification

## Plugin Framework Overview

CardSpoke features a modern, extensible plugin system with three architectural layers:

- **Theme Layer:** CSS only; cosmetic changes without logic modifications. Low risk.
- **Feature Layer:** CSS and JavaScript; adds new features using the Plugin API. Medium risk.
- **App Layer:** Full capabilities including core overrides, custom storage drivers, and app rebranding. High risk.

### Modern Architecture (current v0.17.0 runtime)

The plugin system includes:

- **Middleware Pipeline**: Priority-weighted interceptors for core operations (card save, delete, render, etc.)
- **Plugin API**: Sandboxed contexts with `api.ui`, `api.data`, `api.storage`, and `api.events`
- **Component Registry**: Type-safe UI component overrides with priority-based resolution
- **Storage Driver Registry**: Pluggable storage backends (IndexedDB, cloud, git, etc.)
- **Permission System**: User consent for sensitive operations with explicit permission requests
- **TypeScript Support**: Type definitions available in `types/` directory for local development

### Quick Example

```javascript
// Modern Plugin API
window.CardSpoke.registerPlugin('my-plugin', {
  manifest: {
    name: "My Plugin",
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

See [Plugin System Documentation](./docs/PLUGIN_SYSTEM.md) for complete details.

## Deviation (Fork) Rules
Deviations are forks/derivatives that must not use the "CardSpoke" name or branding. They must include mandatory metadata, clear credit to CardSpoke and JX Holdings, and avoid implying official endorsement.

## Storage Model
CardSpoke is local-first (LocalStorage/IndexedDB). Preferences (rich text, grid view, typography, high-contrast, dev mode) live under `cardspoke_*` keys in LocalStorage. Datasets are namespaced to allow multiple vaults with their own metadata, and backups are exported as JSON/CSV/Markdown/TXT directly from the UI. Optional off-device storage may be wired through integrations chosen by the user; no automatic sync or hosted data.

## Contributing
- Follow plugin development practices in [Plugin System Overview](./docs/PLUGIN_SYSTEM.md).
- Adhere to safety expectations in [Security & Safety Considerations](./docs/policies/SECURITY_AND_SAFETY.md).
- Submit issues/PRs with clear metadata and changelog entries.
- Respect branding restrictions (CardSpoke name/branding cannot be used in forks).

## Support & Disclosure Channels
- General support, bug reports, and feature requests: GitHub Issues at <https://github.com/jxburros/CardSpoke/issues>.
- Security disclosures: open a GitHub Issue and label it `Security`; include impact, repro steps, and affected versions.
- Branding usage for community themes and forks follows the restrictions in the [Deviation Guide](./docs/guides/DEVIATION_GUIDE.md) and [LICENSE](./LICENSE).
