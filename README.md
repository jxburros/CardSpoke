# CardSpoke

**Version:** 0.15.0 | **Schema:** v4 | **Release Date:** 2025-11-30

CardSpoke is a lightweight, card-based knowledge system built for extensibility. The core intentionally stays minimal while an extension framework enables themes, plugins, patches, and full-scale mods. Users keep control of their data with a local-first storage model and optional off-device integrations.

## Why CardSpoke
- **Ultra-lightweight core:** The shipped bundle (`www/app.js`) is self-contained for `file://` usage and keeps helpers inlined to minimize dependencies.
- **Extension-first architecture:** Themes, Patches, Plugins, Mods, Kits, and Expansions let the community expand the product without bloating the core. The runtime exposes `window.CardSpoke_MODS` for hook dispatch and dev tooling.
- **User ownership:** Data stays local by default; no hosted data or silent syncs. LocalStorage is used for preferences and datasets, while IndexedDB stores the graph of cards.
- **Transparent ecosystem:** Clear metadata, authorship, and changelog expectations for all angled (community) content.

## Getting Started
1. Install dependencies (Node 18+ recommended):
   ```bash
   npm install
   ```
2. Run the web build (files are pre-generated in `www`):
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
- `www/` – Prebuilt web assets for the Capacitor shell. `app.js` embeds utilities, renderer logic, and the Extension runtime; `styles.css` holds the default light/dark styling and typography presets.
- `types/` – Type declarations and shared interfaces (extension system types, card shapes, and dev tools contracts).
- `tests/` – Automated tests (uvu).
- `docs/` – Project documentation organized by category (see [Documentation](#documentation) below).
- `test-extension-improvements.js` – Scripted checks for extension-related scenarios.

## Documentation

All documentation is organized in the `docs/` folder:

### Guides
- [Developer Guide](./docs/guides/DEVELOPER_GUIDE.md) – Core app development workflow and conventions
- [Test Guide](./docs/guides/TEST_GUIDE.md) – Testing practices and commands
- [Capacitor Guide](./docs/guides/README.CAPACITOR.md) – Mobile platform workflows
- [Deviation Guide](./docs/guides/DEVIATION_GUIDE.md) – Rules for forks and derivatives
- [Feature Catalog](./docs/guides/FEATURES.md) – Complete feature reference

### API & Schema
- [API Reference](./docs/api/API_REFERENCE.md) – Extension runtime APIs and utilities
- [Schema & Migration Docs](./docs/api/SCHEMA.md) – Data model and versioning
- [Schema Reference](./docs/api/SCHEMA_REFERENCE.md) – Persisted data model summary
- [Storage Driver Interface](./docs/api/STORAGE_DRIVER_INTERFACE.md) – Storage abstraction contracts

### Extensions
- [Extensions Developer Guide](./docs/extensions/DEVELOPER_GUIDE.md) – Building extensions
- [Extension Cookbook](./docs/extensions/EXTENSION_COOKBOOK.md) – Practical recipes
- [Sample Extensions](./docs/extensions/SAMPLE_EXTENSIONS.md) – Ready-made examples
- [Mod Capability & Taxonomy](./docs/extensions/MOD_CAPABILITY_AND_TAXONOMY.md) – Extension types and capabilities
- [Ecosystem Guidelines](./docs/extensions/ECOSYSTEM_GUIDELINES.md) – Community standards
- [AI Developer Docs](./docs/extensions/AI_DEVELOPER_DOCS.md) – AI-assisted extension building
- [AI Extension Prompt Kit](./docs/extensions/AI_EXTENSION_PROMPT_KIT.md) – Prompt patterns for AI
- [AI Extension Recipes](./docs/extensions/AI_EXTENSION_RECIPES.md) – Copy-paste ready templates
- [AI Extension Validation](./docs/extensions/AI_EXTENSION_VALIDATION.md) – Validation checklist

### Policies
- [Code of Conduct](./docs/policies/CODE_OF_CONDUCT.md) – Community standards
- [Security & Safety](./docs/policies/SECURITY_AND_SAFETY.md) – Security expectations
- [Storage & Privacy](./docs/policies/STORAGE_AND_PRIVACY.md) – Privacy notes
- [Release & Versioning](./docs/policies/RELEASE_AND_VERSIONING.md) – Release guidelines

### Specifications
- [CardSpoke Specification v1](./docs/specifications/cardspoke_spec_v1.md) – Canonical specification

## Extension Framework Overview
- **Themes:** Cosmetic only; cannot change logic or data.
- **Patches:** Packaged updates that may alter behavior; official or angled.
- **Plugins:** Add features without rewriting the core.
- **Mods:** Change fundamental logic; intentionally high impact.
- **Kits:** Bundles of Themes/Patches.
- **Expansions:** Bundles that include Plugins or Mods.

Each Extension must ship mandatory metadata (type, name, version, author, AI assistants, description, date, dependencies, schema compatibility, official/angled flags). See [Extensions Developer Guide](./docs/extensions/DEVELOPER_GUIDE.md).

## Deviation (Fork) Rules
Deviations are forks/derivatives that must not use the "CardSpoke" name or branding. They must include mandatory metadata, clear credit to CardSpoke and JX Holdings, and avoid implying official endorsement.

## Storage Model
CardSpoke is local-first (LocalStorage/IndexedDB). Preferences (rich text, grid view, typography, high-contrast, dev mode) live under `cardspoke_*` keys in LocalStorage. Datasets are namespaced to allow multiple vaults with their own metadata, and backups are exported as JSON/CSV/Markdown/TXT directly from the UI. Optional off-device storage may be wired through integrations chosen by the user; no automatic sync or hosted data.

## Contributing
- Follow community and extension guidelines in [Extension Ecosystem Guidelines](./docs/extensions/ECOSYSTEM_GUIDELINES.md).
- Adhere to safety expectations in [Security & Safety Considerations](./docs/policies/SECURITY_AND_SAFETY.md).
- Submit issues/PRs with clear metadata and changelog entries.
- Respect branding restrictions (CardSpoke name/branding cannot be used in forks).

## Support & Questions
Please open an issue with details about your environment, extensions in use, and schema version. For licensing or branding questions, include your planned distribution channel and whether the work is official or angled.

## Open Items
- [PLACEHOLDER] Preferred channels for user support and security disclosures.
- [PLACEHOLDER] Any official branding assets and usage guidelines for community themes.
