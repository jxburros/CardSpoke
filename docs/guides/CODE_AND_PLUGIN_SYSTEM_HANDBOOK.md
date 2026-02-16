# CardSpoke Code & Plugin System Handbook

This handbook is the implementation-level guide to how CardSpoke works and how to build plugins for it safely.

It is intentionally specific: you’ll find concrete field names, hook signatures, storage keys, runtime APIs, and practical examples tied to the current architecture.

---

## 1) What Runs in Production

CardSpoke’s runtime is a **single browser bundle** (`www/app.js`) produced by concatenating source slices in lexical order:

1. `www/src/00-core-systems.js` **(NEW in v0.16.0)**
2. `www/src/01-metadata-and-utilities.js`
3. `www/src/02-storage-and-plugins.js`
4. `www/src/03-data-and-modals.js`
5. `www/src/04-rendering-and-init.js`
6. `www/src/05-advanced-systems-and-boot.js`

Build command:

```bash
npm run build
```

The bundle is designed to work in `file://` contexts, so many helpers are intentionally inlined and globalized rather than split into runtime imports.

---

## 2) Source Slice Responsibilities (Concrete)

## `00-core-systems.js` **(NEW in v0.16.0)**

Initializes the modern plugin architecture before any other code runs:

- **Middleware Pipeline** (`window.CardSpoke.Middleware`):
  - `register(middleware)` - Register priority-weighted interceptors
  - `unregister(name)` - Remove middleware by name
  - `run(operation, args)` - Execute middleware pipeline for operation
  - `list()` - List all registered middlewares
  - Operations: `card.save`, `card.delete`, `card.render`, `navigation.change`, `search.execute`, `data.export`, `data.import`, `theme.change`, `typography.change`, `contrast.change`, `page.change`

- **Component Registry** (`window.CardSpoke.ComponentRegistry`):
  - `register(name, component, priority)` - Register UI components
  - `unregister(name)` - Remove component by name
  - `get(name)` - Retrieve registered component
  - `resolve(name)` - Alias for get()
  - `has(name)` - Check if component exists
  - `list()` - List all components
  - Standard components: `Card`, `CardEditor`, `Sidebar`, `SearchBar`, `SearchResults`, `TagList`, `Modal`, `Toast`, `Menu`

- **Plugin API** (`window.CardSpoke.Plugin`):
  - `register(id, plugin)` - Register plugin with manifest and setup/teardown
  - `enable(id)` - Enable plugin and run setup
  - `disable(id)` - Disable plugin and run teardown
  - `get(id)` - Get plugin instance
  - `list()` - List all plugins
  - `isEnabled(id)` - Check plugin status
  - Context APIs: `ctx.api.ui`, `ctx.api.data`, `ctx.api.storage`, `ctx.api.events`
  - Resource tracking and automatic cleanup

- **Storage Driver Registry** (`window.CardSpoke.StorageDriverRegistry`):
  - `register(name, driver)` - Register storage backend
  - `unregister(name)` - Remove storage driver
  - `get(name)` - Get driver by name
  - `setActive(name)` - Switch active storage driver
  - `getActive()` - Get current active driver
  - `list()` - List all registered drivers

This file loads first to ensure the new architecture is available to all subsequent slices and provides the foundation for the modern plugin-based plugin system.

## `01-metadata-and-utilities.js`

Defines metadata constants and shared primitives used by all later slices:

- Metadata: `APP_VERSION`, `APP_RELEASE_DATE`, `SCHEMA_VERSION`
- DOM helper: `h(tag, props, ...children)`
- Utility helpers:
  - `uid()`
  - `debounce(func, wait)`
  - `normalizeTagInput(raw)`
  - `escapeHtml(str)`
  - `highlightText(text, query)`
  - `cloneCard(card)`
  - `formatBytes(bytes)`
- Accessibility helper: `trapFocus(modal)`
- Store initializer: `createDefaultStore()`
- Preference accessors:
  - `isRichTextEnabled()` / `setRichTextEnabled(enabled)`
  - `getActiveThemeMod()` / `setActiveThemeMod(modId)`
  - `isDeveloperMode()`
- Toast system: `initToast()` / `showToast(message, type, duration)`

## `02-storage-and-plugins.js`

Defines persistence architecture and extension runtime:

- Storage abstraction class: `StorageDriver`
- Drivers:
  - `IndexedDBDriver`
  - `LocalStorageDriver`
  - Optional integration drivers (e.g. cloud/local-file paths)
- Data I/O:
  - `load()`
  - `save()`
- Navigation:
  - `goTo(page, opts)`
  - `goBack()`
- plugin validation/risking:
  - `validateModPackage(pkg)`
  - `assessModRisk(pkg)`
- plugin runtime singleton:
  - `window.CardSpoke.Plugin`
  - `window.CardSpoke.Plugin` (alias)
- plugin developer API:
  - `window.CardSpoke.utils`

## `03-data-and-modals.js`

Owns app workflows and plugin manager UI actions:

- Data-centric UI flows: import/export, settings, bookmarks/recent dialogs
- plugin Manager UI tabs:
  - Installed
  - Install
  - Create
- Utility flows frequently used by plugin users (install, export, toggle, etc.)

## `04-rendering-and-init.js`

Owns render pipeline and primary interaction views:

- Core renderers:
  - `renderCardList()`
  - `renderReadOnlyCard()`
  - `renderEditCard()`
  - `renderSearchResults()`
  - `render()`
- Hook dispatch touchpoints:
  - `runModHook('onCardRender', ...)`
  - `runModHook('onCardSave', ...)`
  - `runModHook('onSearch', ...)`
  - theme/typography/accessibility hook dispatch from user actions

## `05-advanced-systems-and-boot.js`

Owns advanced behavior and startup:

- Undo/redo engine: `pushUndo()`, `undo()`, `redo()`
- Advanced UX: shortcuts, trash bin, dataset utilities
- Boot sequence (actual order):
  1. `initToast()`
  2. `load()`
  3. `populateFooter()`
  4. `updateDatasetSelector()`
  5. Apply saved typography
  6. Parse URL safe mode (`?safemode`)
  7. If not safe mode: `CardSpoke.Plugin.syncFromStore()` - loads and enables plugins
  8. `render()`

---

## 3) Store Shape, Card Shape, and Persistence Keys

## Default store shape

The app initializes/persists a store with these key top-level fields:

- `rootOrder: string[]`
- `cards: Record<string, Card>`
- `plugins: Record<string, ModPackage>`
- `bookmarks: string[]`
- `recentCards: string[]`
- `viewMode: 'normal' | ...`
- `activeTheme: 'light' | 'dark'`
- `richTextEnabled: boolean`
- `metadata` (when present)

## Card object (practical shape)

A card commonly includes:

- `id: string`
- `title: string`
- `body: string`
- `parentId: string | null`
- `children: string[]`
- `tags: string[]`
- `modsData: Record<string, any>` (optional, plugin-owned payloads)

## Preference/storage keys used in LocalStorage

Common keys you will interact with:

- `cardspoke_richtext`
- `cardspoke_gridView`
- `cardspoke_highcontrast`
- `cardspoke_typography`
- `cardspoke_devmode`
- `cardspoke_theme`
- `cardspoke_activeThemeMod`
- `cardspoke_dataset_metadata` (dataset registry metadata)


---

## 4) Data Flow: Mutation → Save → Render → Hooks

The dominant flow is:

1. A user or plugin action mutates the store (card create/update/delete/tag ops)
2. `save()` persists the current dataset
3. `render()` updates the visible UI
4. Hook dispatch notifies enabled plugins (`runModHook(...)`)

Examples:

- Edit/create card in UI triggers `onCardSave`
- Rendering cards in list/read/search triggers `onCardRender`
- Navigation change triggers `onNavigate`
- Search results trigger `onSearch`

Practical takeaway: if your plugin mutates card data, prefer `window.CardSpoke.utils` methods so persistence and rendering stay coherent.

---

## 5) plugin Package Contract (Exact Fields)

Canonical plugin package structure:

```json
{
  "id": "my-plugin",
  "manifest": {
    "name": "My plugin",
    "version": "1.2.3",
    "author": "Your Name",
    "description": "Optional summary",
    "layer": "theme",
    "compatibility": ">=0.16.0"
  },
  "config": {},
  "css": "",
  "js": "",
  "overrides": {},
  "enabled": false
}
```

## Required validation requirements

`validateModPackage(pkg)` enforces:

1. `pkg` must be an object
2. `id` is required
3. `manifest` is required
4. `manifest.name`, `manifest.version`, `manifest.author`, `manifest.layer` are required
5. `manifest.layer` must be one of: `theme`, `feature`, `app`
6. Theme-layer plugins **cannot** include non-empty `js`
7. Non-app layers cannot use `overrides`

Recommended (not hard-enforced) for quality:

- ID format: lowercase letters/numbers/hyphens (`my-plugin-1`)
- Semantic versioning in `manifest.version`
- Clear `compatibility` range

---

## 6) Layer Model with Real Capability Boundaries

## Theme layer

- Allowed: CSS
- Not allowed: JS, overrides
- Best for: colors, spacing, typography, layout tweaks
- Expected risk: SAFE/LOW

## Feature layer

- Allowed: CSS + JS + hooks
- Not allowed: overrides
- Best for: additive features (badges, utilities, side-panels, keyboard helpers)
- Expected risk: MEDIUM baseline

## App layer

- Allowed: CSS + JS + overrides
- Best for: application-level transformations
- Expected risk: HIGH

---

## 7) Plugin Lifecycle System (Setup and Teardown)

The modern plugin system uses `setup` and `teardown` functions instead of individual hooks:

### Lifecycle Functions

- **`setup(ctx)`**: Called when the plugin is enabled. Use this for initialization, resource allocation, and registering middleware/components.
- **`teardown(ctx)`**: Called when the plugin is disabled or uninstalled. Resources are automatically cleaned up, but custom cleanup can be performed here.

### Plugin Context (`ctx`) includes

- `pluginId` - The plugin's unique identifier
- `appVersion` - Current app version (0.16.0)
- `schemaVersion` - Current schema version (4)
- `api` - API object with `ui`, `data`, `storage`, and `events` namespaces
- `logger` - Plugin-scoped logger (`log`, `info`, `warn`, `error`)

### Registration Pattern

```js
window.CardSpoke.Plugin.register('word-counter', {
  manifest: {
    name: "Word Counter",
    version: "1.0.0",
    author: "Author Name",
    layer: "feature",
    permissions: ["ui-override"]
  },
  
  setup: async (ctx) => {
    ctx.logger.info('Plugin enabled');
    
    // Register middleware to inject word count on card render
    if (window.CardSpoke.Middleware) {
      window.CardSpoke.Middleware.register({
        name: 'word-counter-render',
        priority: 5,
        operations: ['card.render'],
        handler: async (mctx, next) => {
          const { card, element } = mctx.args;
          if (card && element) {
            const words = (card.body || '').trim().split(/\s+/).filter(Boolean).length;
            const badge = document.createElement('span');
            badge.className = 'word-counter-badge';
            badge.textContent = `${words} words`;
            element.appendChild(badge);
          }
          await next();
        }
      });
    }
  },
  
  teardown: async (ctx) => {
    ctx.logger.info('Plugin disabled');
    // Middleware is automatically unregistered
  }
});
```

**Note:** Resource management (DOM cleanup, listener removal) is automatic. The middleware pipeline should be used for intercepting core operations like card render, save, delete, etc.

---

## 8) Runtime APIs: `CardSpoke.Plugin` and Window Functions

## `CardSpoke.Plugin` (Plugin Manager)

Common operations:

- `register(id, definition)` - Register a plugin with ID and definition
- `unregister(id)` - Unregister a plugin
- `install(pkg)` - Install a plugin package, returns generated ID
- `enable(id)` - Enable a registered plugin
- `disable(id)` - Disable an enabled plugin
- `get(id)` - Get plugin instance by ID
- `list()` - List all registered plugins
- `assessModRisk(pkg)` - Assess risk level (SAFE, LOW, MEDIUM, HIGH)
- `syncFromStore(safeMode)` - Load plugins from storage at boot
- `notifyDataUpdate()` - Notify data listeners of changes

**Deprecated methods** (no longer exist):
- ~~`runHook(hookName, ...args)`~~ - Use middleware pipeline instead
- ~~`runHookForMod(modId, hookName, ...args)`~~ - Use middleware pipeline instead
- ~~`reload(modId)`~~ - Not implemented

Diagnostics:

- `get(id)` - Get plugin instance details
- `devTools.listAllMods()`
- `devTools.getHookStats(modId?)`
- `devTools.getErrorLog()` / `devTools.clearErrorLog()`
- `devTools.getEventListeners()`

Event bus:

- `CardSpoke.Plugin.events.on(event, cb)`
- `CardSpoke.Plugin.events.off(event, cb)`
- `CardSpoke.Plugin.events.emit(event, data)`
- `CardSpoke.Plugin.events.clear(event?)`

## `window.CardSpoke.utils` (plugin-facing helper API)

Commonly used methods include:

- Card APIs:
  - `createCard({ title, body, parentId, tags })`
  - `updateCard(cardId, changes)`
  - `getCard(cardId)`
  - `searchCards(query)`
- Tag APIs:
  - `getTags(cardId)`
  - `addTag(cardId, tag)`
  - `removeTag(cardId, tag)`
  - `setTags(cardId, tags)`
  - `getAllTags()`
- Theme/accessibility APIs:
  - `setTheme(theme)` / `getTheme()`
  - `setTypography(preset)` / `getTypography()`
  - `setHighContrast(enabled)` / `isHighContrast()`
  - `getAccessibilitySettings()`
- Misc:
  - `showToast(message, type, duration)`
  - `getDatasetMeta()`

Use these APIs instead of directly mutating `store` unless you are contributing to core itself.

---

## 9) Override System (App Layer Only)

App-layer plugins can set `overrides` to alter high-level behavior.

Supported practical fields:

- `appName: string`
- `hideMenuItems: string[]`
- `customMenuItems: Array<{ id: string, label: string, section?: string }>`

Example:

```json
{
  "overrides": {
    "appName": "Research Console",
    "hideMenuItems": ["menuTrashBin"],
    "customMenuItems": [{ "id": "openLabs", "label": "Labs", "section": "actions" }]
  }
}
```

Operational advice:

- Keep override scope as narrow as possible
- Document each override in your plugin description/changelog
- Test for interactions with other app-layer plugins

---

## 10) Risk Assessment (How Runtime Scores Plugins)

The runtime computes a risk score based on layer and detected capability patterns.

Inputs include:

- Layer baseline (theme < feature < app)
- JS content checks (e.g. `fetch(`, `XMLHttpRequest`, `eval(`, `new Function(`, `document.cookie`)
- Override presence and power (`disableFeatures`, custom pages, app rename)

Risk levels reported: `SAFE`, `LOW`, `MEDIUM`, `HIGH`.

Interpretation guidance:

- `SAFE/LOW`: generally acceptable with basic review
- `MEDIUM`: inspect JS behavior and data handling
- `HIGH`: require trust, code review, and provenance checks

---

## 11) Safe Mode and Recovery

Launching with `?safemode` disables plugin loading and execution.

Practical use:

1. Open app with `?safemode`
2. Disable/uninstall problematic plugin(s)
3. Reload normally

In safe mode:
- Runtime warns in console
- A warning toast indicates plugins are disabled
- `CardSpoke.Plugin.syncFromStore()` is skipped (no plugins are loaded)

---

## 12) Concrete Plugin Development Workflow

## Step 1: Pick minimal layer

- Visual-only change → `theme` (CSS only, SAFE risk)
- Add behavior/UI that composes with core → `feature` (CSS+JS, LOW risk)
- Need global/app-level transformation → `app` (CSS+JS+overrides, HIGH risk)

## Step 2: Start from examples

Use `sample-plugins/` closest to your target behavior:

- themes: `sample-plugins/themes/*.json`
- feature-style plugins: `sample-plugins/features/*.json`
- app-layer patterns: `sample-plugins/apps/*.json`

## Step 3: Build iteratively

1. Implement basic `setup()` with logging
2. Add one functional behavior (often injecting UI or registering middleware)
3. Add cleanup in `teardown()` if needed (most cleanup is automatic)
4. Validate install/enable/disable cycle

Example progression:

```js
// Iteration 1: Basic logging
setup: async (ctx) => {
  ctx.logger.info('Plugin enabled');
}

// Iteration 2: Add functionality
setup: async (ctx) => {
  ctx.logger.info('Plugin enabled');
  const cards = ctx.api.data.listCards();
  ctx.logger.info(`Found ${cards.length} cards`);
}

// Iteration 3: Add UI injection
setup: async (ctx) => {
  ctx.logger.info('Plugin enabled');
  const element = document.createElement('div');
  element.textContent = 'Plugin UI';
  ctx.api.ui.inject('#sidebar', element, 'append');
}
```

## Step 4: Validate with dev tools

In console:

```js
// Get plugin instance
window.CardSpoke.Plugin.get('my-plugin');

// List all plugins
window.CardSpoke.Plugin.list();

// Check plugin details
const plugin = window.CardSpoke.Plugin.get('my-plugin');
console.log(plugin.enabled, plugin.definition);
```

## Step 5: Test safe mode fallback

Ensure app remains functional with your plugin fully bypassed by loading with `?safemode`.

---

## 13) Core Contributor Workflow (for `www/src` changes)

1. Edit the relevant source slice(s)
2. Rebuild bundle:
   ```bash
   npm run build
   ```
3. Run tests:
   ```bash
   npm test
   ```
4. Verify plugin compatibility assumptions:
   - hooks still fire
   - `window.CardSpoke.utils` contract remains intact
   - override behavior unchanged unless intentionally modified
5. Update docs when runtime behavior/contracts change

---

## 14) Testing Matrix You Should Actually Run

For core updates:

- Full automated tests (`npm test`)
- Manual smoke checks:
  - create/update/delete card
  - tag add/remove
  - search and keyboard navigation
  - undo/redo

For plugin updates:

- Install plugin from JSON
- Enable/disable repeatedly
- Reload plugin and verify no duplicate listeners/dom nodes
- Uninstall and verify cleanup
- Validate with/without safe mode
- Run with mixed layers enabled (theme + feature + app)

---

## 15) Security & Safety Rules for plugin Authors

Non-negotiable best practices:

- Do not transmit card data without explicit user intent/consent
- Avoid dynamic code execution patterns unless absolutely required
- Avoid broad DOM rewrites when a narrow target is enough
- Keep network usage transparent and documented
- Prefer feature layer over app layer where possible

If distributing to a team/community:

- Publish source alongside packaged JSON
- Include checksum/version notes
- Require review before enabling app-layer plugins

---

## 16) Common Failure Patterns and Fixes

- **Duplicate UI injection on rerender**
  - Cause: `onCardRender` appends every time
  - Fix: check for existing marker node/class before append

- **Broken state after direct mutation**
  - Cause: plugin edits internals without save/render flow
  - Fix: use `window.CardSpoke.utils` methods

- **Theme plugin rejected**
  - Cause: non-empty `js` present in theme layer
  - Fix: move logic to feature/app layer

- **Unclear install risk**
  - Cause: package metadata too thin
  - Fix: add clear description, compatibility, and changelog notes

- **Hard-to-debug lifecycle errors**
  - Cause: missing diagnostics
  - Fix: rely on `ctx.logger` and `CardSpoke.Plugin.devTools.getErrorLog()`

---

## 17) Quick Reference

## Commands

```bash
npm install
npm run build
npm test
```

## Runtime globals

- `window.CardSpoke.Plugin`
- `window.CardSpoke.Plugin`
- `window.CardSpoke.utils`

## Troubleshooting

- Launch with `?safemode` when a plugin breaks startup
- Inspect hook stats/errors in `CardSpoke.Plugin.devTools`

---

## 18) Companion Documents

- `README.md` — top-level orientation and doc index
- `docs/guides/DEVELOPER_GUIDE.md` — core development workflow
- `docs/PLUGIN_SYSTEM.md` — formal plugin system reference
- `docs/api/API_REFERENCE.md` — API contract details
- `docs/guides/TEST_GUIDE.md` — testing guidance
