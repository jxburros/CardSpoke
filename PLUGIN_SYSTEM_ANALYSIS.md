# CardSpoke Plugin/Mod Loader System — Complete Code Analysis

> Analysis based solely on reading the source code, no documentation referenced.

## Architecture Overview

The system is composed of 6 interconnected subsystems, all initialized as IIFEs attached to `window.CardSpoke`:

| Subsystem | Namespace | Primary File |
|---|---|---|
| Plugin Manager | `CardSpoke.Plugin` | `00-core-systems.js` (lines 290–941) |
| Middleware Pipeline | `CardSpoke.Middleware` | `00-core-systems.js` (lines 36–192) |
| Component Registry | `CardSpoke.ComponentRegistry` | `00-core-systems.js` (lines 197–289) |
| Permissions | `CardSpoke.Permissions` | `00-core-systems.js` (lines 1062–1306) |
| Storage Driver Registry | `CardSpoke.StorageDriverRegistry` | `00-core-systems.js` (lines 946–1057) |
| Plugin Validator | `CardSpoke.PluginValidator` | `00-core-systems.js` (embedded) |

All 6 are also duplicated as standalone modules under `www/src/core/` — these standalone files are never loaded at runtime (the app loads only `00-core-systems.js` through `05-advanced-systems-and-boot.js` concatenated into `app.js`).

---

## Capabilities (What Works)

### 1. Three-Layer Plugin Model
Plugins declare a `layer` in their manifest: `theme`, `feature`, or `app`. This drives the risk assessment system:
- **theme** — CSS-only, auto-assessed as `SAFE`, auto-enabled on install
- **feature** — CSS + JS, assessed as `LOW` (auto-enabled) unless it has overrides
- **app** — Full access, assessed as `HIGH`, must be manually enabled

### 2. Full Lifecycle Management
- `register(id, definition)` → `enable(id)` → `disable(id)` → `unregister(id)`
- `setup(ctx)` called on enable, `teardown(ctx)` called on disable, both support `async`
- Failed `setup()` triggers rollback: CSS is removed, resources are cleaned up, error is thrown
- Failed `teardown()` logs a warning but continues cleanup (app stability prioritized)

### 3. Sandboxed Plugin Context
Each plugin receives an isolated `ctx` object with:
- `ctx.api.ui` — inject/replace DOM elements, register components, show toasts
- `ctx.api.data` — CRUD on cards, tag operations, data update listeners
- `ctx.api.storage` — namespaced key-value storage (`plugin_{id}_` prefix)
- `ctx.api.events` — `on`/`off`/`emit`/`once` event bus (per-plugin, not cross-plugin)
- `ctx.logger` — prefixed console logging
- `ctx.modId`, `ctx.appVersion`, `ctx.schemaVersion` — metadata

### 4. Automatic Resource Tracking & Cleanup
Every DOM injection, component registration, event listener, and data listener is tracked in a per-plugin `Set`. On `disable()`, all resources are cleaned up automatically with statistics logging. Replaced DOM elements are restored to their originals.

### 5. InternalAPI Protection
At enable-time, `captureInternalReferences()` snapshots core functions (`createCard`, `updateCard`, `deleteCard`, `showToast`, etc.) to prevent plugins from breaking the app by overwriting `window` globals. The Data and UI APIs always try the captured reference first.

### 6. Plugin Validation
Before registration, the `PluginValidator` checks:
- Manifest structure (required fields: `name`, `version`, `layer`)
- CSS size (max 100KB), dangerous patterns stripped (`@import`, `javascript:`, `expression()`, `-moz-binding`, `behavior:`)
- JS size (max 500KB), dangerous patterns blocked (`eval()`, `new Function()`)
- Plugin ID format (lowercase alphanumeric + hyphens)

### 7. Permissions System
Six permission types: `ui-override`, `storage`, `network`, `filesystem`, `core-override`, `data-modify`. Each API call checks permission before executing. Permissions are persisted to `localStorage` and a consent dialog is rendered dynamically when requesting new permissions.

### 8. Component Registry with Priority
Plugins can register UI components by name (e.g., `'Card'`) with a numeric priority. Higher priority wins. The rendering code in `04-rendering-and-init.js:124-138` checks for a custom `'Card'` component and uses it if available, falling back to the default renderer on failure.

### 9. Middleware Pipeline
A priority-weighted interceptor system where handlers receive `(ctx, next)` and can `preventDefault()` or `stopPropagation()`. Supports operation filtering (e.g., `['card.save']`) and wildcard `['*']`. Includes an operation-based cache for performance.

### 10. Plugin Manager UI
A full 3-tab modal accessible from the hamburger menu:
- **Installed** — lists active plugins with risk badges, enable/disable toggles, remove button, legacy plugin export
- **Install** — upload `.json` file or install from URL
- **Create** — inline editor with manifest JSON, JavaScript, and CSS textareas

### 11. Persistence & Boot
- Installed plugins are persisted to `window.store.plugins` and saved via the app's storage driver
- On boot, `syncFromStore(safeMode)` re-registers and re-enables all plugins
- Safe mode (`?safemode` URL parameter) loads plugins but does not enable them
- Plugin state survives page reloads

### 12. Storage Driver Registry
Plugins can register custom storage backends implementing a 7-method interface (`init`, `get`, `set`, `remove`, `list`, `getSize`, `getKind`). Drivers can be hot-swapped at runtime.

### 13. Dynamic Plugin Loader (Example)
`www/src/examples/dynamic-plugin-loader.js` provides ES module loading via `import()` — `loadPluginFromURL()`, `loadPluginFromFile()`, `loadPluginsFromManifest()`. This is an example/reference, not integrated into the main app.

---

## Shortcomings & Bugs

### Critical Issues

#### 1. Middleware Pipeline is Dead Code
`Middleware.run()` is never called anywhere in the core app. The pipeline is fully implemented, tested, and documented — but no core operation (`card.save`, `card.delete`, `card.create`, etc.) is instrumented to run through it. Plugins can register middleware, but it will never fire from app operations. The only place middleware gets invoked is from within plugins themselves (e.g., the kanban-board plugin registers middleware for `card.save` / `card.delete`, but since the core app never calls `Middleware.run('card.save')`, it never triggers).

#### 2. `new Function()` Used Despite Being Blocked by Validator
The validator blocks `new Function()` in JS strings (`plugin-validator.js:43`). However, the Plugin Manager UI (`03-data-and-modals.js:1391, 1436, 1509`) uses `new Function('ctx', jsCode)` to convert user-entered JavaScript into setup functions. This means:
- The Create tab and Install tab both use the very pattern the validator forbids
- If a plugin JSON file contains JS as a string in the `js` field, that string is never executed — it's validated but there's no code path that converts it into a callable function
- The sample plugin JSON files (kanban-board, card-search-highlight, etc.) embed their JS as self-executing IIFEs that call `window.CardSpoke.Plugin.register()` directly — but this `js` field string is never `eval()`'d or executed by the system

#### 3. Sample Plugin JSON Files Can't Be Loaded
The sample plugins (e.g., `kanban-board.json`) contain a `js` field with an IIFE string that calls `Plugin.register()`. But when uploaded through the Install tab, the code path does:
1. Parse JSON -> get `pkg`
2. Check for `pkg.javascript` (not `pkg.js`) -> if present, create `new Function('ctx', pkg.javascript)`
3. Call `Plugin.install(pkg)`

The sample files use `pkg.js`, not `pkg.javascript`. The system never looks at `pkg.js` to create a setup function. The sample plugins' JS would only work if someone manually executed the string via `eval()` or a `<script>` tag — which the system explicitly blocks.

#### 4. Permissions System Disconnected from Enable Flow
In `PluginManager.enable()` (`00-core-systems.js:680-698`), `_checkPermissions()` is called, which:
- Checks if `window.showPermissionDialog` exists -> calls it -> auto-grants
- Falls back to auto-granting if dialog not available

But the actual permission checks in the API methods (`hasPermission()` at `permissions.js:68`) check `grantedPermissions`, which is populated only when `PermissionsManager.grantPermissions()` is called. The `_checkPermissions` flow calls `showPermissionDialog` which calls `requestPermissions` which calls `grantPermissions` — but only if the user clicks "Allow". The issue is that `_checkPermissions` **auto-grants and returns `true`** as a fallback (`plugin-api.js:705`), bypassing the actual permissions system entirely.

#### 5. Event Bus is Plugin-Scoped, Not Global
The `ctx.api.events` bus creates a new `eventHandlers` Map per plugin. Plugin A cannot emit events that Plugin B hears. There is no cross-plugin communication mechanism.

### Moderate Issues

#### 6. Duplicate Code in `00-core-systems.js` vs `core/` files
The `00-core-systems.js` file is a concatenation of the individual `core/*.js` module files, but the `00-core-systems.js` version has diverged — it contains `install()`, `syncFromStore()`, `assessModRisk()`, `listAll()`, and enhanced `unregister()` (with store cleanup) that the standalone `core/plugin-api.js` lacks. The standalone files are stale/incomplete copies.

#### 7. `cloneCard` Fallback Returns Direct Reference
In `createDataApi` (`plugin-api.js:186-188`), if `cloneCard` is not available, `getCard()` returns a direct reference to `window.store.cards[id]`. This means a plugin could mutate the store directly, bypassing all validation, middleware, and permission checks.

#### 8. No Teardown Function Persistence
When a plugin is installed via `Plugin.install()`, the `definition` (including `setup` and `teardown` function references) is persisted to `window.store.plugins`. Functions cannot be serialized to JSON. After a page reload, `syncFromStore()` will re-register the plugin with `pluginData.definition`, but `definition.setup` and `definition.teardown` will be `undefined` (lost during serialization). The plugin will be "enabled" with no functionality.

#### 9. CSS-Only Themes Work, JS Plugins Don't Survive Reload
Because of issue #8, only CSS-only theme plugins actually survive a page reload correctly. Their CSS is stored as a string and reapplied. Any plugin with JavaScript behavior is silently broken after reload.

#### 10. No Plugin Update Mechanism
There is no way to update an installed plugin. Re-installing generates a new unique ID (`id-1`, `id-2`, etc.) instead of replacing the existing version. Users must manually remove and reinstall.

#### 11. `overrides` Field Unused
The plugin JSON schema includes an `overrides` field (and sample plugins like kanban-board use it with `appName` and `customMenuItems`), but no code reads or processes this field.

#### 12. `config` Field Unused
Every sample plugin JSON includes a `config: {}` field, but no code reads, processes, or exposes plugin configuration to the setup function.

#### 13. Component Registry Only Checks `'Card'`
The rendering code only looks up the `'Card'` component from the registry. There is no mechanism for plugins to override other UI components (Sidebar, SearchBar, Header, etc.) — the registry supports it, but the app doesn't query for any other component name.

#### 14. Storage API Inconsistency
`storage.get()` uses `localStorage.getItem()` as fallback (returns raw string), but `storage.set()` uses `localStorage.setItem(key, JSON.stringify(value))`. A `get()` after `set()` via localStorage returns a JSON string, not the parsed value. The plugin would need to `JSON.parse()` manually.

#### 15. No `network` or `filesystem` Permission Enforcement
Permissions `network` and `filesystem` are defined in the descriptions but never checked anywhere in the code. A plugin can `fetch()` any URL without needing `network` permission.

---

## Quality-of-Life Improvements That Could Be Added

1. **Plugin dependency declaration** — Plugins have no way to declare dependencies on other plugins or minimum app version enforcement (the `compatibility` field exists in manifests but is never checked).

2. **Cross-plugin event bus** — A global event system so plugins can communicate (e.g., a kanban plugin reacting to a search-highlight plugin's events).

3. **Plugin settings UI** — Each plugin could expose configurable options (leveraging the unused `config` field) with an auto-generated settings panel.

4. **Plugin marketplace/gallery** — A curated tab listing sample plugins from a remote manifest, with one-click install.

5. **Plugin hot-reload for development** — File-watching during dev that auto-reloads plugin code on change, without a full page refresh.

6. **Plugin import/export** — Individual plugin export (already partially there for legacy plugins) and re-import with version checking.

7. **Undo/rollback** — Snapshot the app state before enabling a plugin, allowing one-click rollback if something breaks.

8. **Plugin conflict detection** — Warn when two plugins register the same component name or middleware for the same operation at the same priority.

9. **Plugin sandboxing via iframe/Web Worker** — Currently plugins run in the main thread with full DOM access. A stricter sandbox would prevent rogue plugins from accessing the global scope.

10. **Error boundary per plugin** — If a plugin throws during `setup()`, the error is caught but the user only sees a console error. A visible in-app error with "disable this plugin" button would be more user-friendly.

---

## Potential

The architecture is well-designed for extensibility. The layered security model (theme -> feature -> app), middleware pipeline, component registry, and storage driver abstraction are all solid patterns. If the following were addressed, the system would be production-grade:

1. **Instrument core operations with middleware** — This is the single highest-impact change. Once `Middleware.run()` is called in `createCard()`, `updateCard()`, `deleteCard()`, and `save()`, the middleware pipeline becomes immediately useful for validation, logging, undo/redo, sync, and more.

2. **Fix function serialization for persistence** — Store plugin JS as source strings alongside the compiled functions, so `syncFromStore()` can reconstruct the setup/teardown functions after reload (or use the same `new Function()` pattern the Create tab already uses).

3. **Bridge the `js` field from JSON to execution** — The sample plugins already have well-written JS in their `js` field. Adding a code path that executes this string (after validation) on install would make the JSON plugin format actually work end-to-end.

4. **Wire up the `overrides` and `config` fields** — These are already part of the schema and sample data. Processing them would unlock app customization (custom menu items, app name changes) and per-plugin settings.

5. **Make the event bus global** — With minimal changes, the event API could support both scoped and global events, enabling inter-plugin communication.

The system has clearly been designed with growth in mind — the building blocks are there, several are just not wired together yet.
