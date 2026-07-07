# Plugin System Invariants — What Cannot Change

This document is the **stability contract** for CardSpoke's plugin system.
Every item below is load-bearing: plugins in the wild, the Plugin Manager
UI, the boot sequence, and the persisted data of every user depend on them.

> Breaking any invariant here breaks installed plugins, silently or loudly.
> If you must change one, treat it like a schema migration: bump the app
> version, migrate persisted data, update `docs/PLUGIN_SYSTEM.md`, the
> samples, the tests, and this file — in the same change.

The regression suite that enforces most of these is
`tests/plugin-lifecycle.test.js` and `tests/sample-extensions.test.js`.
If a change makes those tests fail, the change is wrong (or it is a
deliberate contract change and everything listed above must move together).

## 1. The `window.CardSpoke` surface

`www/src/core/global-api.js` is the **only** place that assigns
`window.CardSpoke`, and the root object is frozen. These members must exist
with these semantics:

| Member | Contract |
|---|---|
| `registerPlugin(id, definition)` | Async; registers **and enables**; session-only (no persistence). |
| `installPlugin(pkg)` | Persistent install; equals `Plugin.install`. |
| `requestPermissions(pluginId, pluginName, permissions)` | Returns `Promise<boolean>`. |
| `Plugin` | The PluginManager with: `register`, `unregister`, `get`, `list`, `listAll`, `enable`, `disable`, `install`, `assessModRisk`, `syncFromStore`, `notifyDataUpdate`, `buildSettingsPanel`. |
| `PluginSandbox` | Object with `createFunction(code)` — the shape `{ createFunction }` is relied on by the Plugin Manager UI. |
| `Middleware` | `register`, `unregister`, `run`, `list`, `clear`. |
| `ComponentRegistry` | `register`, `unregister`, `get`, `list`. |
| `StorageDriverRegistry` | Present (experimental). |
| `PluginValidator` | `validate`, `validateCSS`, `validateJS`. |
| `Permissions` | `hasPermission`, `hasAllPermissions`, `grantPermissions`, `revokePermissions`, `getPermissions`, `requestPermissions`, `clearAll`. |
| `utils` | A **stable mutable object** populated in place by `storage.js` (`Object.assign`). Never reassign `window.CardSpoke` or `window.CardSpoke.utils` after global-api runs. |

Renaming, removing, or changing the call signature of any of these is a
breaking change for every published plugin.

## 2. Boot and module ordering

The order is: **core runtime → app layer → boot IIFE**. Concretely:

1. `www/src/main.js` imports `./core/global-api.js` **first**, and
   `flattenAppScope` in `vite.config.js` **prepends**
   `import '@core/global-api.js';` to the fused app-layer module. Both are
   required (Rollup hoists imports; the prepend guarantees the runtime
   initializes before any app-layer statement executes). Do not remove
   either.
2. The boot IIFE at the end of `www/src/systems.js` must:
   - run **after** the HOST BRIDGE block (same file, directly above it),
   - `await load()` **before** calling `Plugin.syncFromStore(safeMode)`,
   - call `syncFromStore` **before** the first `render()` and before
     `applyRegistryComponents()`.
3. `www/src/core/*` modules must **never import from the app layer**
   (`state.js`, `kernel.js`, `metadata.js`, `storage.js`, `data.js`,
   `rendering.js`, `systems.js`). The core is also built standalone
   (`npm run build:core`); an app-layer import breaks that build and
   creates circular init. Core reaches the app **only** via the host-bridge
   window globals below, read lazily at call time.
4. The app-layer files execute in one flat scope, fused in this order:
   `state, kernel, metadata, storage, data, rendering, systems`
   (`LAYER_RELATIVE` in `vite.config.js`). They may not use ESM imports of
   each other beyond `./state.js` / `./kernel.js` (which the build strips)
   and `@core/*` modules.
5. There is exactly **one** build of the app: `npm run build` (Vite →
   `www/app.js`, loaded by `www/app-loader.js`). Do not reintroduce a
   second build path with its own copy of the runtime — a diverging
   duplicate runtime (the old `www/src/core.js`) is what originally broke
   the plugin system.

## 3. Host-bridge window globals

The plugin runtime is deliberately decoupled from the app layer and reaches
it exclusively through these globals. All of them must exist before
`syncFromStore` runs:

| Global | Assigned by | Consumed for |
|---|---|---|
| `window.store` | `state.js` (initial + inside `setStore`) | Card reads, `store.plugins` persistence. Must always point at the **live** store object — every dataset switch/reload goes through `setStore`. |
| `window.save` | HOST BRIDGE block in `systems.js` | Persisting plugin installs/state changes. |
| `window.createCard(title, body, parentId, skipSave, skipHooks)` | HOST BRIDGE | `ctx.api.data.createCard` |
| `window.updateCard(id, updates, skipSave, skipHooks)` | HOST BRIDGE | `ctx.api.data.updateCard` |
| `window.deleteCard(id)` | HOST BRIDGE | `ctx.api.data.deleteCard` |
| `window.cloneCard(card)` | HOST BRIDGE | Safe card cloning for plugin reads |
| `window.getTags` / `addTag` / `removeTag` / `setTags` / `getAllTags` | HOST BRIDGE | `ctx.api.data` tag methods |
| `window.showToast(message, type, duration)` | HOST BRIDGE | `ctx.api.ui.showToast` |
| `window.APP_VERSION`, `window.SCHEMA_VERSION` | optional | `ctx.appVersion` / `ctx.schemaVersion` (fallback defaults exist) |

`plugin-api.js` snapshots these on first enable (`captureInternalReferences`)
so a plugin overwriting a window global cannot break other plugins.
Renaming a bridge global or changing its signature silently kills the
corresponding `ctx.api` methods.

## 4. Persistence schema

`store.plugins` (inside the dataset payload, serialized by
`JSON.stringify(store)`) has exactly this shape:

```json
{
  "<plugin-id>": {
    "definition": {
      "manifest": { },
      "css": "…",
      "js": "…",
      "teardownJs": "…"
    },
    "enabled": true
  }
}
```

- Entries must stay **pure JSON** — never store functions or class
  instances. `syncFromStore` builds fresh runtime definitions and must not
  mutate the stored entry.
- The persisted `js` / `teardownJs` **source strings are the canonical
  executable form**; compiled functions are session artifacts.
- `enabled` is the suspend/resume state and is kept in sync by
  `enable()` / `disable()` (`_persistEnabledState`). It must survive reload.
- Entries **without** a `definition` are legacy (pre-v2) plugins: they are
  never executed, and the Plugin Manager UI lists them read-only under
  "Legacy Plugins" for export/removal. Keep tolerating them.
- Other persisted keys: user permission grants live in localStorage under
  `cardspoke_plugin_permissions`; plugin key-value storage uses the
  `plugin_<id>_` prefix. Both key formats are frozen.

## 5. Plugin package format and execution model

- The package fields `id`, `manifest` (`name`, `version`, `layer` required),
  `css`, `js`, `teardownJs`, `config`, `overrides` mean what
  `docs/PLUGIN_SYSTEM.md` says. `javascript` is accepted as a legacy alias
  of `js`. Top-level `id`/`config`/`overrides` are normalized into the
  manifest at install.
- **`js` is a setup-function BODY receiving `ctx`.** It is compiled by the
  single factory `_createSandboxedFunction` in `plugin-api.js` as
  `new Function('ctx', '"use strict";\n' + code)` and executed on the main
  thread. All plugin-code compilation must keep going through that one
  factory. Packages must never self-register.
- The three layer names `theme` / `feature` / `app` and the risk mapping
  are frozen: theme+CSS-only → `SAFE`; feature without overrides → `LOW`;
  app layer or any overrides → `HIGH`; anything else → `MEDIUM`. Only
  `SAFE`/`LOW` auto-enable on install; `HIGH` requires an explicit user
  enable. This is the safety boundary users rely on.
- `register()` throws on a duplicate id; `install()` on an existing id is
  an in-place update (full unregister first, same id, no suffixes).
- Validator limits and blocked patterns (100 KB CSS / 500 KB JS; `eval(`,
  `new Function(` in plugin JS; CSS `@import`, `javascript:`,
  `expression()`, `behavior:`, `-moz-binding`) may get stricter, never
  looser, without a major version bump.

## 6. Permission names

`ui-override`, `storage`, `network`, `filesystem`, `core-override`,
`data-modify` — these six strings are persisted in user grants and written
in plugin manifests. Add new permissions if needed; never rename or reuse
the existing ones. Deleting a plugin (`unregister`) must keep revoking its
grants.

## 7. Middleware operations

Operation names and argument tuples fired by the host:

| Operation | Args | Fired from |
|---|---|---|
| `card.create` | `[cardId, card]` | `data.js createCard` |
| `card.update` | `[cardId, card]` | `data.js updateCard` |
| `card.delete` | `[cardId]` | `data.js deleteCard` |
| `card.save` | `[store]` | `storage.js saveNow` — `preventDefault()` aborts the save |
| `card.render` | `[card, cardTileElement]` | `rendering.js renderCardTile` |

`data.js` must also keep calling `Plugin.notifyDataUpdate({type, cardId,
card?})` for create/update/delete — that is what feeds
`ctx.api.data.onUpdate`. Plugin middleware names are namespaced
`<pluginId>:<name>` by `ctx.api.middleware`; cleanup on disable depends on
that prefix.

## 8. Component registry names

The host queries exactly these component names: `Card` (per card-tile
render, live), and `Header`, `Sidebar`, `SearchBar` (once at boot via
`applyRegistryComponents()`). A custom component's `render(props)` must
return an `HTMLElement`; on any exception the host falls back to the
default renderer. Removing one of these lookups breaks published plugins
that register the corresponding component.

## 9. DOM and CSS contract

- Plugin CSS is injected as `<style data-plugin-id="<id>">` in `<head>`;
  suspend/delete removes it. Nothing else may use that attribute.
- Selectors plugins are told to target (documented in samples and docs):
  `.header`, `.card-tile`, `.card-tag`, `.card-tags`, `.card-content`,
  `.menu-panel`, `.search-input-wrapper`, and the `#brandBtn` element used
  by `overrides.appName`. Renaming these breaks themes and feature plugins
  — treat them like public API.
- The CSS custom properties in `www/styles.css` (`--bg`, `--surface`,
  `--border`, `--text`, `--text-medium`, `--text-muted`, `--text-ghost`,
  spacing/typography/accessibility variables listed by
  `utils.getThemeVariables()`) are the supported theming surface, along
  with the `:root.dark` dark-mode class.

## 10. URL parameters and UI entry points

- `?safemode` must keep booting with all plugins registered but disabled —
  it is the documented recovery path from a broken plugin.
- The Plugin Manager (Installed / Install / Gallery / Create) must keep
  offering: enable, suspend (disable), remove (unregister), install from
  file, install from URL, and create-in-app. The Gallery reads
  `sample-plugins/manifest.json` from the `main` branch of this repo.

## 11. Event bus semantics

`ctx.api.events` is a **global** bus: events emitted by one plugin are
received by all plugins subscribed to that event name. Handlers are removed
automatically when their plugin is disabled. Do not scope it per plugin —
cross-plugin communication is a documented feature.

## Change checklist

Changing anything above? Then in the same PR:

1. Migrate persisted data if the schema moved (a `syncFromStore`-level
   migration for `store.plugins`).
2. Update `docs/PLUGIN_SYSTEM.md`, this file, `sample-plugins/` (all nine
   packages + TEMPLATE), and `types/index.d.ts`.
3. Update `tests/plugin-lifecycle.test.js` / `tests/sample-extensions.test.js`
   and make `npm test` pass.
4. Add a CHANGELOG entry and consider the version bump (contract changes
   are at least a minor bump; persisted-schema changes are major).
