# CardSpoke API Reference

This reference documents the surfaces plugin developers can rely on. It consolidates the runtime contracts that ship in `www/src/main.js`.

**Current Version:** 0.17.0 | **Schema Version:** 4 | **Release Date:** 2026-02-17

## Global objects

The public `window.CardSpoke` object is frozen and exposes exactly two entry points:

- **`window.CardSpoke.registerPlugin(id, definition)`**: Registers a plugin with the given ID and definition (equivalent to what earlier drafts of this doc called `CardSpoke.Plugin.register`).
- **`window.CardSpoke.requestPermissions(pluginId, pluginName, permissions)`**: Prompts the user to grant the listed permissions to a plugin.

Nothing else is reachable from `window.CardSpoke` in the current build — `window.CardSpoke.utils`, `window.CardSpoke.Plugin`, `window.CardSpoke.Middleware`, `window.CardSpoke.ComponentRegistry`, and `window.CardSpoke.StorageDriverRegistry` do **not** exist as public globals. The internal plugin manager, middleware pipeline, component registry, and storage driver registry are used internally by the core app but are not exposed on `window.CardSpoke`.

## Plugin Runtime

### Plugin Definition Format

Plugins are registered with the following structure:

```javascript
window.CardSpoke.registerPlugin('plugin-id', {
  manifest: {
    name: "Plugin Name",
    version: "1.0.0",
    author: "Author Name",
    description: "Plugin description",
    layer: "theme | feature | app",
    permissions: ["ui-override", "storage", "network", "filesystem", "core-override", "data-modify"]
  },
  setup: async (ctx) => {
    // Initialization logic - called when plugin is enabled
    // Use ctx.api to interact with the app
  },
  teardown: async (ctx) => {
    // Cleanup logic - called when plugin is disabled
    // Resources are automatically cleaned up
  },
  css: "/* Optional CSS styles */"
});
```

### Registration and Lifecycle Methods

`window.CardSpoke.registerPlugin(id, definition)` is the only registration entry point exposed to plugin code. The remaining lifecycle operations below (`unregister`, `get`, `list`, `enable`, `disable`, `install`, `assessModRisk`, `syncFromStore`, `notifyDataUpdate`) are implemented internally by the plugin manager and used by the core app (e.g. the Plugin Manager UI) — they are not reachable from `window.CardSpoke` in the current build:

- **`unregister(id)`**: Unregisters a plugin, running teardown if enabled, cleaning up resources, and removing from persistent storage.
- **`get(id)`**: Returns the plugin instance for the given ID, or undefined if not found.
- **`list()`**: Returns an array of all registered plugin instances.
- **`enable(id)`**: Enables a plugin by checking permissions, applying CSS, and running the setup function. Throws an error if permissions are not granted or if setup fails.
- **`disable(id)`**: Disables a plugin by running teardown, removing CSS, and cleaning up resources.
- **`install(pkg)`**: Installs a plugin package, registers it by manifest/base ID, and auto-enables based on risk assessment (SAFE and LOW risk plugins are enabled automatically). If an ID already exists, the prior plugin is disabled/unregistered and replaced. Persists to store and returns the installed plugin ID.
- **`assessModRisk(pkg)`**: Assesses the risk level of a plugin package based on layer, capabilities, and permissions. Returns one of: `'SAFE'`, `'LOW'`, `'MEDIUM'`, `'HIGH'`.
  - `SAFE`: Theme layer with CSS only, no JavaScript
  - `LOW`: Feature layer with JavaScript, no core overrides
  - `MEDIUM`: Default for unclear cases
  - `HIGH`: App layer or plugins with core overrides
- **`syncFromStore(safeMode)`**: Loads enabled plugins from persistent storage during app boot. If `safeMode` is true, plugins are registered but not enabled.
- **`notifyDataUpdate()`**: Notifies all registered data update listeners that data has changed. Used internally when cards are modified.

### Plugin Context (ctx)

The context object passed to setup and teardown functions contains:

- **`ctx.modId`**: The ID of the current plugin
- **`ctx.appVersion`**: Current app version (0.17.0)
- **`ctx.schemaVersion`**: Current schema version (4)
- **`ctx.api`**: API object with `ui`, `data`, `storage`, `events`, `network`, and `filesystem` namespaces
- **`ctx.config`**: Optional manifest config object (present when `manifest.config` is provided).
- **`ctx.utils`**: Reserved for a shared utility helper surface. In the current build this is always an empty object `{}` — see the note under "Utils" below.
- **`ctx.logger`**: Plugin-scoped logger with methods: `log()`, `info()`, `warn()`, `error()`

### Plugin API (ctx.api)

#### UI API (ctx.api.ui)

- **`inject(selector, element, position)`**: Injects a DOM element at the specified selector. Position can be `'before'`, `'after'`, `'prepend'`, or `'append'` (default). Returns a cleanup function that removes the element.
- **`replace(selector, element)`**: Replaces the element at the selector with a new element. Returns a cleanup function that restores the original element.
- **`registerComponent(name, component)`**: Registers a UI component with the Component Registry. Component object should include a `priority` field.
- **`unregisterComponent(name)`**: Unregisters a previously registered component.
- **`showToast(message, type, duration)`**: Displays a toast notification. Type can be `'info'`, `'success'`, `'warning'`, or `'error'`. Duration is in milliseconds (default handled by implementation).

#### Data API (ctx.api.data)

**Known limitation:** `getCard`, `listCards`, `createCard`, `updateCard`, `deleteCard`, `getTags`, `addTag`, `removeTag`, `setTags`, and `getAllTags` are implemented internally by reading/writing `window.store`, `window.createCard`, `window.updateCard`, `window.deleteCard`, `window.getTags`, `window.addTag`, `window.removeTag`, `window.setTags`, and `window.getAllTags`. None of these window globals are populated in the current build (they exist only as module-local functions), so these calls currently throw (e.g. `"createCard not available"`) or return `undefined`/empty results. Treat this API as not yet functional rather than relying on the examples below.

- **`onUpdate(callback)`**: Registers a callback to be notified when data changes. Returns a cleanup function that unregisters the callback. (This one does work — it doesn't depend on the missing globals.)
- **`getCard(id)`**: Returns a cloned card object for the given ID, or undefined if not found.
- **`listCards()`**: Returns an array of all card objects (cloned).
- **`createCard(data)`**: Creates a new card with the specified data object. Data should contain `title`, `body`, `parentId`, and `tags` fields. Returns the new card ID. Requires the `data-modify` permission.
- **`updateCard(id, updates)`**: Updates the card with the given ID with the provided updates object. Returns the updated card. Requires the `data-modify` permission.
- **`deleteCard(id)`**: Deletes the card with the given ID. Returns true if successful. Requires the `data-modify` permission.
- **`getTags(cardId)`**: Returns an array of tags for the specified card.
- **`addTag(cardId, tag)`**: Adds a tag to the specified card. Returns true if successful. Requires the `data-modify` permission.
- **`removeTag(cardId, tag)`**: Removes a tag from the specified card. Returns true if successful. Requires the `data-modify` permission.
- **`setTags(cardId, tags)`**: Sets the tags for the specified card to the provided array. Returns true if successful. Requires the `data-modify` permission.
- **`getAllTags()`**: Returns an array of all unique tags across all cards.

#### Storage API (ctx.api.storage)

The storage API provides plugin-namespaced storage using the active storage driver when available, with localStorage fallback:

- **`get(key)`**: Retrieves a value from storage. The key is automatically namespaced to the plugin. Returns the stored value or null.
- **`set(key, value)`**: Stores a value. The key is automatically namespaced to the plugin. Value is JSON serialized.
- **`remove(key)`**: Removes a value from storage.
- **`list(prefix)`**: Lists all keys in the plugin's namespace, optionally filtered by prefix. Returns an array of key names.
- **`getNamespace()`**: Returns the plugin's storage namespace string (e.g., "plugin_my-plugin_").

#### Events API (ctx.api.events)

The events API provides an event bus for inter-plugin communication. Note: This is a shared event bus, not plugin-specific.

- **`on(eventName, callback)`**: Subscribes to an event. Returns a cleanup function.
- **`off(eventName, callback)`**: Unsubscribes from an event.
- **`emit(eventName, ...args)`**: Emits an event with optional arguments (variadic).
- **`once(eventName, callback)`**: Subscribes to an event that fires only once.

#### Network API (ctx.api.network)

- **`fetch(url, options)`**: Wraps `window.fetch` and enforces the `network` permission.
- **`xhr()`**: Returns an `XMLHttpRequest` instance and enforces the `network` permission.

#### Filesystem API (ctx.api.filesystem)

- **`readFile(path, options)`**: Reads files via Capacitor Filesystem when available; requires `filesystem` permission.
- **`writeFile(path, data, options)`**: Writes files via Capacitor Filesystem when available; requires `filesystem` permission.

### Resource Management

The Plugin API automatically manages resources:

- DOM elements injected via `ctx.api.ui.inject()` or `ctx.api.ui.replace()` are tracked and cleaned up when the plugin is disabled
- Event listeners registered via `ctx.api.data.onUpdate()` are automatically unsubscribed on disable
- Components registered via `ctx.api.ui.registerComponent()` are tracked
- CSS styles are automatically applied on enable and removed on disable

### Permissions System

Plugins must declare required permissions in their manifest:

- **`ui-override`**: Permission to inject or replace DOM elements
- **`storage`**: Permission to access localStorage (plugin-namespaced)
- **`network`**: Permission to make network requests (`ctx.api.network.fetch` / `ctx.api.network.xhr`)
- **`filesystem`**: Permission to access filesystem APIs (mobile only)
- **`core-override`**: Permission to override core functionality (high risk)
- **`data-modify`**: Permission to perform mutating calls through `ctx.api.data` (`createCard`, `updateCard`, `deleteCard`, `addTag`, `removeTag`, `setTags`). Read-only data calls (`getCard`, `listCards`, `getTags`, `getAllTags`) do not require it.

Permissions are checked when a plugin is enabled, and users are prompted to grant access.

## Utilities and internal helpers

Earlier drafts of this document described a `CardSpoke.utils` global and a set of direct `window.*` functions (`window.createCard`, `window.updateCard`, `window.getDatasetMeta`, `window.setTheme`, `window.showToast`, etc.) as part of the public plugin API. **This was inaccurate.** None of these exist as `window` globals in the current build — grepping `www/src/*.js` finds no code that attaches them to `window`. Equivalent logic exists only as internal, module-local functions (e.g. card CRUD helpers, `getDatasetMeta()`, theme/typography setters live inside the app's own modules), not as a reachable plugin API surface.

If a future build exposes dataset metadata to plugins, the real internal shape (from the module-local implementation) returns:

- `name`: Dataset name
- `cardCount`: Total number of cards
- `rootCardCount`: Number of root-level cards
- `bookmarkCount`: Number of bookmarked cards
- `recentCount`: Number of recent cards tracked
- `modCount`: Number of installed plugins
- `schemaVersion`: Current schema version
- `appVersion`: Current app version

(Not `rootCount`/`tagCount` as earlier drafts of this document claimed.)

Plugin authors should use `ctx.api.*` exclusively; there is no supported direct-`window` fallback.
