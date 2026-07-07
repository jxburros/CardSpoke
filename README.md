# CardSpoke

![CardSpoke logo](./CardSpoke.svg)

**Version:** 0.17.0 | **Schema:** v4 | **Release Date:** 2026-02-17

CardSpoke is a lightweight, card-based knowledge system built for extensibility.
The core intentionally stays minimal while a plugin framework enables themes,
features, and app-layer transformations. Users keep control of their data with a
local-first storage model and optional off-device integrations.

## Why CardSpoke

- **Ultra-lightweight core:** The shipped bundle (`www/app.js`) is
  self-contained for `file://` usage and keeps helpers inlined to minimize
  dependencies.
- **Plugin-first architecture:** A three-layer plugin system (theme, feature,
  app) lets the community expand the product without bloating the core. The
  runtime exposes modern Plugin API and Middleware Pipeline for extensions.
- **User ownership:** Data stays local by default; no hosted data or silent
  syncs. Preferences and datasets default to LocalStorage; IndexedDB is an
  optional, per-dataset storage driver users can select instead (it is also
  used internally for Local File System handle persistence, unrelated to card
  storage).
- **Open ecosystem:** Clear metadata, authorship, and changelog expectations
  for all community-contributed plugins and themes.

## Getting Started

1. Install dependencies (Node 18+ recommended):

   ```bash
   npm install
   ```

2. Build the web bundle (Vite compiles `www/src/` into `www/app.js`):

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

- `www/` – Prebuilt web assets for the Capacitor shell. `app.js` embeds
  utilities, renderer logic, and the plugin runtime; `styles.css` holds the
  default light/dark styling and typography presets.
- `www/src/` – Source slices that compile into `www/app.js`. `npm run build`
  (Vite) is the single canonical build path. Runtime lives in
  `www/src/core/` (ES modules); the app layer is fused into one scope at
  build time (see [Core/Shell Split](./docs/architecture/CORE_SHELL_SPLIT.md)).
- `www/modules/` – Reference ES module versions kept for documentation (not
  used at runtime).
- `tests/` – Automated tests (uvu).
- `docs/` – Project documentation organized by category (see
  [Documentation](#documentation) below).
- `sample-plugins/` – Example plugin implementations across all three layers.

## Documentation

All documentation is organized in the `docs/` folder:

### Guides

- [Developer Guide](./docs/guides/DEVELOPER_GUIDE.md) – Core app development
  workflow and conventions
- [Code & Plugin System Handbook](./docs/guides/CODE_AND_PLUGIN_SYSTEM_HANDBOOK.md)
  – End-to-end architecture and plugin development deep dive
- [Test Guide](./docs/guides/TEST_GUIDE.md) – Testing practices and commands
- [Capacitor Guide](./docs/guides/README.CAPACITOR.md) – Mobile platform
  workflows
- [Deviation Guide](./docs/guides/DEVIATION_GUIDE.md) – Rules for forks and
  derivatives
- [Feature Catalog](./docs/guides/FEATURES.md) – Complete feature reference

### API & Schema

- [API Reference](./docs/api/API_REFERENCE.md) – Plugin runtime APIs and
  utilities
- [Schema & Migration Docs](./docs/api/SCHEMA.md) – Data model and versioning
- [Schema Reference](./docs/api/SCHEMA_REFERENCE.md) – Persisted data model
  summary
- [Storage Driver Interface](./docs/api/STORAGE_DRIVER_INTERFACE.md) – Storage
  abstraction contracts

### Plugin System

- [Plugin System Overview](./docs/PLUGIN_SYSTEM.md) – Complete plugin system
  documentation

### Policies

- [Code of Conduct](./docs/policies/CODE_OF_CONDUCT.md) – Community standards
- [Security & Safety](./docs/policies/SECURITY_AND_SAFETY.md) – Security
  expectations
- [Storage & Privacy](./docs/policies/STORAGE_AND_PRIVACY.md) – Privacy notes
- [Release & Versioning](./docs/policies/RELEASE_AND_VERSIONING.md) – Release
  guidelines

### Specifications

- [CardSpoke Specification v1](./docs/specifications/cardspoke_spec_v1.md) –
  Canonical specification

## Plugin Framework Overview

CardSpoke features a modern, extensible plugin system with three architectural
layers:

- **Theme Layer:** CSS only; cosmetic changes without logic modifications. Low
  risk.
- **Feature Layer:** CSS and JavaScript; adds new features using the Plugin
  API. Medium risk.
- **App Layer:** Full capabilities including core overrides, custom storage
  drivers, and app rebranding. High risk.

### Modern Architecture (current v0.17.0 runtime)

The plugin system includes:

- **Plugin API**: Isolated per-plugin contexts with `api.ui`, `api.data`,
  `api.storage`, `api.events`, and `api.middleware`; every resource a plugin
  creates is tracked and cleaned up automatically on suspend/delete
- **Middleware Pipeline**: Priority-weighted interceptors for core operations
  (`card.create`, `card.update`, `card.delete`, `card.save`, `card.render`)
- **Component Registry**: UI component overrides (`Card`, `Header`,
  `Sidebar`, `SearchBar`) with priority-based resolution
- **Permission System**: Deny-by-default user consent for sensitive
  operations, persisted per plugin and revoked on delete
- **Persistence**: Installed plugins live in the active dataset and are
  restored (with their enabled/suspended state) on every reload;
  `?safemode` boots with all plugins disabled
- **TypeScript Support**: Type definitions available in `types/` directory for
  local development

The public surface is `window.CardSpoke`, assembled and frozen by
`www/src/core/global-api.js`: convenience entry points
(`registerPlugin`, `installPlugin`, `requestPermissions`) plus the runtime
subsystems (`Plugin`, `Middleware`, `ComponentRegistry`, `PluginValidator`,
`Permissions`, `PluginSandbox`, `StorageDriverRegistry`, `utils`). Its shape
is a stability contract — see
[Plugin Invariants](./docs/PLUGIN_INVARIANTS.md).

### Quick Example

A plugin is a JSON package whose `js` string is the body of its setup
function (it receives `ctx`):

```json
{
  "id": "my-plugin",
  "manifest": {
    "id": "my-plugin",
    "name": "My Plugin",
    "version": "1.0.0",
    "author": "Author",
    "layer": "feature",
    "permissions": ["ui-override"]
  },
  "js": "var cards = ctx.api.data.listCards(); ctx.api.ui.showToast('Loaded ' + cards.length + ' cards', 'info');"
}
```

Install it from the Plugin Manager (menu → Plugin Manager → Install), or
programmatically with `await window.CardSpoke.Plugin.install(pkg)`. Working
examples of all three layers live in [`sample-plugins/`](./sample-plugins/).

See [Plugin System Documentation](./docs/PLUGIN_SYSTEM.md) for complete details.

## Deviation (Fork) Rules

Deviations are forks/derivatives that must not use the "CardSpoke" name or
branding. They must include mandatory metadata, clear credit to CardSpoke and
JX Holdings, and avoid implying official endorsement.

## Storage Model

CardSpoke is local-first (LocalStorage/IndexedDB). Preferences (rich text, grid
view, typography, high-contrast, dev mode) live under `cardspoke_*` keys in
LocalStorage. Datasets default to the LocalStorage driver but are namespaced
to allow multiple vaults with their own metadata; IndexedDB is available as an
optional, per-dataset storage driver a user can select instead. Backups are
exported as JSON/CSV/Markdown/TXT directly from the UI. Optional off-device
storage may be wired through integrations chosen by the user; no automatic
sync or hosted data.

## Environment & Configuration

CardSpoke has no required environment variables for basic use. The following
optional settings are relevant for development:

| Key | Context | Notes |
|-----|---------|-------|
| `NODE_ENV` | Vite build | Set to `production` for release builds (default when running `npm run build`). |
| `VITE_*` prefix | Vite | Any `VITE_`-prefixed variables are exposed to the client bundle at build time. |

Runtime preferences (rich text, grid view, high-contrast, dev mode) are stored
in LocalStorage under `cardspoke_*` keys and are not environment variables.

## Troubleshooting

### `npm run build` fails with a module resolution error

Run `npm install` first, then retry. If the error persists, delete
`node_modules/` and `package-lock.json` and reinstall.

### `file://` page is blank

Open the browser console. A missing `www/app.js` means the build has not been
run yet (`npm run build`). A CORS error means the browser is blocking local
file access — serve the `www/` folder with `npm run preview` instead.

### Tests fail with "Cannot find module"

Ensure you are on Node 18 or later (`node --version`) and that `npm install`
completed without errors.

### Capacitor sync fails

Confirm that Android SDK / Xcode is installed and that `npx cap doctor` reports
no errors. See the [Capacitor Guide](./docs/guides/README.CAPACITOR.md) for
platform-specific setup steps.

## Contributing

- Follow plugin development practices in
  [Plugin System Overview](./docs/PLUGIN_SYSTEM.md).
- Adhere to safety expectations in
  [Security & Safety Considerations](./docs/policies/SECURITY_AND_SAFETY.md).
- Submit issues/PRs with clear metadata and changelog entries.
- Respect branding restrictions (CardSpoke name/branding cannot be used in
  forks).

## Support & Disclosure Channels

- General support, bug reports, and feature requests: GitHub Issues at
  <https://github.com/jxburros/CardSpoke/issues>.
- Security disclosures: open a GitHub Issue and label it `Security`; include
  impact, repro steps, and affected versions.
- Branding usage for community themes and forks follows the restrictions in the
  [Deviation Guide](./docs/guides/DEVIATION_GUIDE.md) and [LICENSE](./LICENSE).
