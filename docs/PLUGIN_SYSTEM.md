# CardSpoke Plugin System

This is the canonical guide to CardSpoke's plugin system: what plugins are,
how to build one for each of the three layers, how the lifecycle works
(install, enable, suspend, delete, reload), and the complete `ctx` API
reference.

**App Version:** 0.19.0 | **Schema Version:** 4

Companion documents:

- [`PLUGIN_INVARIANTS.md`](./PLUGIN_INVARIANTS.md) — the stability contract:
  everything that must **not** change or the plugin system breaks. Read it
  before touching runtime code.
- [`../sample-plugins/`](../sample-plugins/) — nine working packages (three
  per layer) plus `TEMPLATE.json`. Every sample installs, enables, suspends,
  deletes, and survives reload; `tests/plugin-lifecycle.test.js` proves it on
  every test run.

## Overview

CardSpoke stays intentionally small; plugins are the supported way to change
it — from a coat of paint to a different product. The system has three
architectural layers, preserved from the original design:

| Layer | Contents | Risk | Enable behavior |
|---|---|---|---|
| `theme` | CSS only | SAFE | Auto-enabled on install (no JavaScript runs) |
| `feature` | CSS + JS | LOW (unless it declares overrides) | Enabled at install **after** the user accepts the full-trust consent dialog |
| `app` | CSS + JS + overrides | HIGH | Installed **suspended**; the user must enable it manually (which also requires full-trust consent) |

The runtime lives in `www/src/core/` (ES modules) and is exposed to both the
app and to plugins as `window.CardSpoke`. There is exactly one plugin runtime
and one build (`npm run build`, Vite). The safety model is consent-based:

1. **Full-trust consent (the real boundary)**: plugin JavaScript runs on the
   main thread in the page realm — there is **no sandbox**, and a plugin can
   reach `window`, `document`, storage, and the network directly regardless
   of what it declares. Because of that, any plugin that ships JavaScript
   requires an explicit "Trust & Run" consent from the user before it is
   ever enabled. Deleting the plugin revokes the consent.
2. The **validator** screens every package before registration (manifest
   shape, CSS/JS size limits, dangerous patterns).
3. Every sensitive `ctx` API call is additionally gated by a **permission**
   the user grants in a consent dialog. Permissions scope the supported API
   surface for well-behaved plugins — they are a compatibility/UX contract,
   **not** a security boundary.
4. **Risk labels** by layer set expectations; `app`-layer plugins never run
   until the user enables them.
5. **`?safemode`** in the URL boots the app with every plugin registered but
   disabled.
6. Everything a plugin creates through `ctx.api.*` is **tracked and
   automatically removed** when the plugin is suspended or deleted.

Treat installing **any** plugin that contains JavaScript like installing
software: only accept the consent dialog for authors you trust.

## Quick Start: your first plugin in five minutes

1. Run the app (`npm run dev` or open the built `www/index.html`).
2. Open the hamburger menu → **Plugin Manager** → **Create** tab.
3. Manifest:

   ```json
   {
     "name": "Hello CardSpoke",
     "version": "1.0.0",
     "author": "You",
     "layer": "feature",
     "permissions": ["ui-override"]
   }
   ```

4. JavaScript — this is the **body of your setup function**; it receives the
   plugin context as `ctx`:

   ```javascript
   var el = document.createElement('span');
   el.textContent = 'Hello!';
   ctx.api.ui.inject('.header', el, 'append');
   ctx.api.ui.showToast('Hello plugin enabled', 'success');
   ```

5. Click **Save & Register**, accept the full-trust dialog (your plugin
   contains JavaScript), grant the `ui-override` permission, and the badge
   appears in the header. Reload the page — it's still there. Suspend or
   remove it from the **Installed** tab; the badge disappears immediately.

## Plugin Package Format

A plugin is a single JSON file:

```json
{
  "id": "my-plugin",
  "manifest": {
    "id": "my-plugin",
    "name": "My Plugin",
    "version": "1.0.0",
    "author": "Your Name",
    "description": "What it does",
    "layer": "feature",
    "permissions": ["ui-override"],
    "compatibility": ">=0.17.0",
    "config": { "workMinutes": 25 },
    "overrides": { "appName": "My App" },
    "dependencies": ["other-plugin-id"]
  },
  "css": "/* injected while enabled, removed when suspended */",
  "js": "/* SETUP BODY — runs as function(ctx) { ...this string... } on every enable */",
  "teardownJs": "/* optional extra cleanup — same ctx object as setup */"
}
```

Field reference:

| Field | Required | Notes |
|---|---|---|
| `id` (top level) | recommended | Lowercase alphanumeric + hyphens. Normalized into `manifest.id` at install; if both are absent the id is derived by slugging `manifest.name`. |
| `manifest.name` | **yes** | Human-readable name (string). |
| `manifest.version` | **yes** | Semver string. |
| `manifest.layer` | **yes** | `theme`, `feature`, or `app`. |
| `manifest.author` | recommended | Shown in the Plugin Manager. |
| `manifest.description` | recommended | Shown in the Plugin Manager and gallery. |
| `manifest.permissions` | if JS uses gated APIs | See [Permissions](#permissions). |
| `manifest.config` | no | Key/value defaults; surfaced to code as `ctx.config` and to users as an auto-generated settings panel. Value types (boolean/number/string) drive the input type. Changes persist. |
| `manifest.overrides` | no | App-layer host overrides. Currently implemented: `appName` (renames the app brand button). Declaring any override forces HIGH risk. |
| `manifest.dependencies` | no | Array of plugin ids that must already be installed. |
| `manifest.compatibility` | no | Informational version range. |
| `css` | themes: yes | Max 100 KB. Sanitized: `@import`, `javascript:`, `expression()`, `behavior:`, `-moz-binding` are stripped. |
| `js` | features/apps: yes | Max 500 KB. **The body of your setup function** — see below. `eval(` and `new Function(` are rejected by the validator. |
| `teardownJs` | no | Extra cleanup code (timers, observers). Tracked resources are cleaned automatically without it. |

`config` and `overrides` may also appear at the package top level (the
installer normalizes them into the manifest; explicit manifest values win).

### How `js` executes — the setup-body model

The `js` string is compiled once per enable as:

```text
new Function('ctx', '"use strict";\n' + js)
```

and invoked as `setup(ctx)`. That means:

- Write **statements**, not a wrapper: `ctx.api.ui.showToast('hi')`, not
  `(function() { ... })()` around a registration call.
- **Never call `window.CardSpoke.registerPlugin(...)` from `js`** — the
  package IS the plugin; installing it registers it. Self-registration
  throws a duplicate-id error.
- The code re-runs on every enable (including at boot after a reload), and
  everything it created via `ctx.api.*` is removed on every disable. Design
  setup/teardown to be repeatable.
- You may `return` a Promise (or use `async` inner functions); enable awaits
  it.
- State that `teardownJs` needs (interval ids, observers) should be stashed
  on `ctx` (e.g. `ctx._myTimer = ...`) — teardown receives the same `ctx`
  object.

Plugins written as real modules (with `setup`/`teardown` **functions**) can
be registered programmatically — see
[Loading plugins](#loading-plugins-all-the-ways) — but only string-form
packages survive a reload, because functions cannot be persisted.

## Lifecycle

```text
install(pkg) ──► validate ──► register ──► persist to store.plugins
                                   │
                     SAFE / LOW risk│ HIGH risk
                          auto─enable│ stays suspended
                                   ▼
        ┌───────────── enable(id) ◄────────── user clicks Enable
        │   permissions consent → apply CSS → run setup(ctx)
        │   (failure: CSS + resources rolled back, error surfaced)
        ▼
     ENABLED ── disable(id) ──► teardown(ctx) → remove CSS → cleanup
        ▲                        resources → persist enabled=false
        └── enable(id) ◄──┘     ("suspend"; survives reload)

     unregister(id) = delete: disable + cleanup + revoke permissions
                      + remove from store.plugins (persisted)
```

Key guarantees (enforced by `tests/plugin-lifecycle.test.js`):

- **Add**: `install()` persists the package (source strings, not compiled
  functions) into the active dataset's `store.plugins` and saves.
  Reinstalling the same id **updates in place** — no `id-1` duplicates; the
  old instance is fully unregistered first.
- **Suspend**: `disable()` (the UI's *Suspend* button) tears down, cleans up
  every tracked resource, and persists `enabled: false`. A suspended plugin
  stays suspended across reloads.
- **Delete**: `unregister()` also revokes the plugin's granted permissions
  and deletes the store entry.
- **Reload**: at boot (`systems.js`), after `load()` completes,
  `Plugin.syncFromStore()` re-registers every stored plugin from its
  persisted `js`/`teardownJs` strings and re-enables the ones marked
  enabled. The sync is idempotent and re-runs automatically when an
  IndexedDB or local-file dataset finishes its async load.
- **Safe mode**: `index.html?safemode` registers everything but enables
  nothing.
- **Failure containment**: a package whose `js` fails to compile does not
  install; a package whose setup throws stays installed but suspended, with
  the error surfaced as a toast and in the console.

## The `ctx` API

Every plugin gets an isolated context:

```text
ctx
├─ modId            plugin id (string)
├─ appVersion       e.g. '0.19.0'
├─ schemaVersion    e.g. 4
├─ config           manifest.config (live; settings panel writes here)
├─ logger           log / info / warn / error (prefixed console)
├─ utils            async host helpers (same as window.CardSpoke.utils)
└─ api
   ├─ ui            DOM + components + toasts        [ui-override]
   ├─ data          cards + tags + change events     [data-modify for writes]
   ├─ storage       namespaced key-value storage     [storage]
   ├─ events        global cross-plugin event bus
   ├─ middleware    core-operation interceptors
   ├─ network       fetch / XHR                      [network]
   └─ filesystem    Capacitor file access            [filesystem]
```

Everything registered through `ctx.api.*` is tracked per plugin and removed
automatically on disable/unregister.

### `ctx.api.ui` — permission: `ui-override`

| Method | Description |
|---|---|
| `inject(selector, element, position?)` | Insert `element` relative to the first match of `selector`. `position`: `'append'` (default), `'prepend'`, `'before'`, `'after'`. Returns an undo function. Tracked. |
| `replace(selector, element)` | Replace the matched element; the original is restored on cleanup. Returns an undo function. Tracked. |
| `registerComponent(name, component)` | Register a UI component override (see [Component overrides](#component-overrides)). Tracked. |
| `unregisterComponent(name)` | Remove a component registration. |
| `showToast(message, type?, duration?)` | Toast notification (`'info'`, `'success'`, `'error'`, `'warning'`). No permission required. |

### `ctx.api.data` — permission: `data-modify` for writes

| Method | Description |
|---|---|
| `getCard(id)` | Deep clone of one card, or `undefined`. No permission. |
| `listCards()` | Deep clones of all cards. No permission. |
| `createCard({ title, body, parentId, tags })` | Create a card (tags applied in the same call). Returns the new card id. |
| `updateCard(id, updates)` | Update fields; returns the updated clone. |
| `deleteCard(id)` | Delete a card (and its children). |
| `getTags(cardId)` / `getAllTags()` | Read tags. No permission. |
| `addTag(cardId, tag)` / `removeTag(cardId, tag)` / `setTags(cardId, tags)` | Mutate tags. |
| `onUpdate(callback)` | Called with `{ type: 'card.create' \| 'card.update' \| 'card.delete', cardId, card? }` after each data change. Returns an unsubscribe function. Tracked. |

### `ctx.api.storage` — permission: `storage`

Async key-value storage namespaced to `plugin_<id>_` (localStorage-backed).

| Method | Description |
|---|---|
| `get(key)` | Returns the stored JSON value (parsed), or `null`. |
| `set(key, value)` | Stores `JSON.stringify(value)`. |
| `remove(key)` | Deletes the key. |
| `list(prefix?)` | Keys in the plugin's namespace (namespace stripped). |
| `getNamespace()` | The `plugin_<id>_` prefix. |

### `ctx.api.events` — no permission

A **global** bus shared by all plugins (cross-plugin communication works).
`on(event, cb)` (tracked, returns unsubscriber), `off(event, cb)`,
`once(event, cb)`, `emit(event, ...args)`. Handler errors are caught and
logged, never propagated to the emitter.

### `ctx.api.middleware` — no permission

Intercept core operations. Registrations are namespaced
(`<pluginId>:<name>`) and tracked.

```javascript
ctx.api.middleware.register({
  name: 'my-interceptor',        // required
  priority: 10,                  // higher runs first (default 0)
  operations: ['card.save'],     // default ['*']
  handler: async function(mw, next) {
    // mw.operation, mw.args, mw.preventDefault(), mw.stopPropagation()
    await next();                // ALWAYS call next() unless intercepting
  }
});
```

Operations fired by the host app:

| Operation | `mw.args` | `preventDefault()` effect |
|---|---|---|
| `card.create` | `[cardId, card]` | none (fired after creation) |
| `card.update` | `[cardId, card]` | none (fired after update) |
| `card.delete` | `[cardId]` | none (fired after delete) |
| `card.save` | `[store]` | **aborts the save** |
| `card.render` | `[card, cardTileElement]` | none (post-processing hook) |

### `ctx.api.network` — permission: `network`

`fetch(url, options)` and `xhr()` — permission-gated wrappers around the
browser APIs.

### `ctx.api.filesystem` — permission: `filesystem`

`readFile(path, options)` / `writeFile(path, data, options)` via Capacitor
(mobile builds); throws on platforms without a filesystem.

### `ctx.utils`

Async convenience helpers provided by the host app (also at
`window.CardSpoke.utils`): `createCard`, `updateCard`, `getCard`,
`searchCards`, tag helpers, `showToast`, `getDatasetMeta`, theme and
typography getters/setters, and accessibility queries. See
`www/src/storage.js` (the `CardSpoke.utils API` block) for the full list.

## Permissions

| Permission | Grants |
|---|---|
| `ui-override` | DOM injection/replacement, component registration |
| `data-modify` | Creating, updating, deleting cards and tags |
| `storage` | The plugin's namespaced key-value storage |
| `network` | `ctx.api.network.fetch` / `xhr` |
| `filesystem` | Capacitor file access (mobile) |
| `core-override` | Reserved for future core-function overrides |

Declare what you use in `manifest.permissions`. On first enable the user
sees a consent dialog listing each permission with its description; denial
fails the enable. Grants persist (localStorage key
`cardspoke_plugin_permissions`) until the plugin is deleted — deleting a
plugin revokes its grants, so a reinstall must ask again.

Calling a gated API without the permission throws
`Plugin does not have <permission> permission`.

## Component overrides

Register with priority; the highest-priority registration wins:

```javascript
ctx.api.ui.registerComponent('Card', {
  priority: 10,
  render: function(props) {
    // props: { card, isSelected, opts, onSelect }
    var el = document.createElement('button');
    el.textContent = '🃏 ' + (props.card.title || 'Untitled');
    el.onclick = props.onSelect;
    return el; // must return an HTMLElement
  }
});
```

Component names the app queries:

| Name | Render props | When applied |
|---|---|---|
| `Card` | `{ card, isSelected, opts, onSelect }` | Every card-tile render — takes effect live |
| `Header` | `{ header }` | Once at boot (`applyRegistryComponents`) — takes effect on next reload |
| `Sidebar` | `{ panel }` | Once at boot — next reload |
| `SearchBar` | `{ wrapper }` | Once at boot — next reload |

If a custom component throws, the app falls back to the default renderer.
For live header/sidebar changes use `ctx.api.ui.inject`/`replace` instead —
those are tracked and reversible without a reload.

## Loading plugins (all the ways)

1. **Plugin Manager UI** (hamburger menu → Plugin Manager):
   - *Install* tab — upload a `.json` package or install from a URL.
   - *Gallery* tab — curated list from
     `sample-plugins/manifest.json` on GitHub, one-click install.
   - *Create* tab — write manifest/JS/CSS in the app; saved persistently.
   - *Installed* tab — Enable / Suspend / Remove, with risk and state badges.
2. **Programmatic install** (persistent):

   ```javascript
   await window.CardSpoke.Plugin.install(pkg);   // or
   await window.CardSpoke.installPlugin(pkg);
   ```

3. **Session-only registration** (for development; not persisted, gone after
   reload):

   ```javascript
   await window.CardSpoke.registerPlugin('dev-plugin', {
     manifest: { name: 'Dev Plugin', version: '1.0.0', layer: 'feature' },
     setup: async (ctx) => { /* real function — session only */ },
     teardown: async (ctx) => { /* optional */ },
     css: ''
   }); // registers AND enables
   ```

4. **ES-module dev loader** — `www/src/examples/dynamic-plugin-loader.js`
   shows `import()`-based loading of module plugins from URLs/files.

## The `window.CardSpoke` surface

Assembled and frozen by `www/src/core/global-api.js` before any app code
runs. Members (shape is a stability contract — see
[`PLUGIN_INVARIANTS.md`](./PLUGIN_INVARIANTS.md)):

| Member | Purpose |
|---|---|
| `registerPlugin(id, definition)` | Register + enable (session-only). |
| `installPlugin(pkg)` | Persistent install (alias of `Plugin.install`). |
| `requestPermissions(id, name, perms)` | Ask the user for permissions. |
| `Plugin` | Full manager: `install`, `register`, `enable`, `disable`, `unregister`, `get`, `list`/`listAll`, `assessModRisk`, `syncFromStore`, `notifyDataUpdate`, `buildSettingsPanel`. |
| `PluginSandbox.createFunction(js)` | Compile a setup-body string (the runtime's single compilation point). |
| `Middleware` | The pipeline (host-fired operations; prefer `ctx.api.middleware`). |
| `ComponentRegistry` | Component registry (prefer `ctx.api.ui.registerComponent`). |
| `StorageDriverRegistry` | Registry for custom storage drivers (experimental; the host app does not yet consume it). |
| `PluginValidator` | `validate(pkg)`, `validateCSS(css)`, `validateJS(js)`. |
| `Permissions` | `hasPermission`, `grantPermissions`, `revokePermissions`, … |
| `utils` | Async host helpers (see `ctx.utils`). |

Prefer `ctx.api.*` inside plugin code — it is permission-checked and
resource-tracked. The globals exist for the host app, for development, and
for advanced app-layer plugins.

## Distributing plugins

- Publish the `.json` package anywhere; users install via URL.
- To appear in the in-app Gallery, add an entry to
  `sample-plugins/manifest.json` (`id`, `name`, `description`, `layer`,
  `url`) in a PR. `tests/sample-extensions.test.js` verifies gallery
  entries point at real packages.
- Start from [`sample-plugins/TEMPLATE.json`](../sample-plugins/TEMPLATE.json).

## Testing your plugin

`tests/plugin-lifecycle.test.js` shows the harness pattern: a fake
`window`/`document`, the real runtime imported from
`www/src/core/plugin-api.js`, permissions pre-granted with
`Permissions.grantPermissions(id, perms)`, then:

```javascript
const id = await Plugin.install(myPkg);
await Plugin.disable(id);
// simulate reload:
const persisted = JSON.parse(JSON.stringify(window.store));
resetForTesting(); window.store = persisted;
await Plugin.syncFromStore(false);
```

Run everything with `npm test`. If you add a sample package, the
sample-extensions suite validates it automatically.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| "Plugin validation failed …" | Manifest missing `name`/`version`/`layer`, or JS contains `eval(`/`new Function(`, or size limits exceeded. |
| "Plugin … is already registered" | Your `js` calls `registerPlugin` — remove it; packages self-register via `install()`. |
| "Plugin does not have X permission" | Add the permission to `manifest.permissions` and re-enable (consent dialog appears). |
| Plugin installed but did nothing after reload | It was registered with `setup` as a function (session-only). Ship `js` as a string so it persists. |
| App broken by a plugin | Boot with `index.html?safemode`, then suspend or remove the plugin in the Plugin Manager. |
| Header/Sidebar/SearchBar override not applying | Those apply at boot — reload. Use `ctx.api.ui.replace` for live changes. |

## Architecture (for contributors)

```text
www/src/main.js                 Vite entry: global-api first, then app layer
www/src/core/global-api.js      window.CardSpoke assembly (frozen surface)
www/src/core/plugin-api.js      PluginManager + ctx factories + compilation
www/src/core/plugin-validator.js  Package validation and CSS/JS sanitizing
www/src/core/permissions.js     Consent dialogs + persisted grants
www/src/core/middleware.js      Priority pipeline for core operations
www/src/core/component-registry.js  Component overrides
www/src/core/storage-driver-registry.js  Custom storage drivers (experimental)
www/src/systems.js              HOST BRIDGE globals + boot (syncFromStore)
www/src/data.js                 Plugin Manager UI + middleware/data hooks
```

The invariants that keep all of this working — boot order, the host-bridge
globals, the persistence schema, validator limits, middleware operation
names — are specified in [`PLUGIN_INVARIANTS.md`](./PLUGIN_INVARIANTS.md).
Change those only with a migration plan.
