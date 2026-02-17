# CardSpoke API Reference

This reference documents the surfaces plugin developers can rely on: the `CardSpoke.utils` helper bundle and the `CardSpoke.Plugin` plugin runtime. It consolidates the runtime contracts that ship in `www/app.js`.

**Current Version:** 0.17.0 | **Schema Version:** 4 | **Release Date:** 2026-02-17

## Global objects
- **`window.CardSpoke.utils`**: helpers for card CRUD, tagging, search, accessibility, dataset metadata, and toast UI helpers.
- **`window.CardSpoke.Plugin`**: the plugin system that manages plugin registration, lifecycle, permissions, and resource management.

## Plugin Runtime (`CardSpoke.Plugin`)

### Plugin Definition Format

Plugins are registered with the following structure:

```javascript
window.CardSpoke.Plugin.register('plugin-id', {
  manifest: {
    name: "Plugin Name",
    version: "1.0.0",
    author: "Author Name",
    description: "Plugin description",
    layer: "theme | feature | app",
    permissions: ["ui-override", "storage", "network", "filesystem", "core-override"]
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

- **`register(id, definition)`**: Registers a plugin with the given ID and definition. Creates a plugin context and stores the plugin instance. Does not enable the plugin automatically.
- **`unregister(id)`**: Unregisters a plugin, running teardown if enabled, cleaning up resources, and removing from persistent storage.
- **`get(id)`**: Returns the plugin instance for the given ID, or undefined if not found.
- **`list()`**: Returns an array of all registered plugin instances.
- **`enable(id)`**: Enables a plugin by checking permissions, applying CSS, and running the setup function. Throws an error if permissions are not granted or if setup fails.
- **`disable(id)`**: Disables a plugin by running teardown, removing CSS, and cleaning up resources.
- **`install(pkg)`**: Installs a plugin package, registers it with a unique ID, and auto-enables based on risk assessment (SAFE and LOW risk plugins are enabled automatically). Persists to store. Returns the generated plugin ID.
- **`assessModRisk(pkg)`**: Assesses the risk level of a plugin package based on layer, capabilities, and permissions. Returns one of: `'SAFE'`, `'LOW'`, `'MEDIUM'`, `'HIGH'`.
  - `SAFE`: Theme layer with CSS only, no JavaScript
  - `LOW`: Feature layer with JavaScript, no core overrides
  - `MEDIUM`: Default for unclear cases
  - `HIGH`: App layer or plugins with core overrides
- **`syncFromStore(safeMode)`**: Loads enabled plugins from persistent storage during app boot. If `safeMode` is true, plugins are registered but not enabled.
- **`notifyDataUpdate()`**: Notifies all registered data update listeners that data has changed. Used internally when cards are modified.

### Plugin Context (ctx)

The context object passed to setup and teardown functions contains:

- **`ctx.pluginId`**: The ID of the current plugin
- **`ctx.appVersion`**: Current app version (0.17.0)
- **`ctx.schemaVersion`**: Current schema version (4)
- **`ctx.api`**: API object with `ui`, `data`, `storage`, and `events` namespaces
- **`ctx.logger`**: Plugin-scoped logger with methods: `log()`, `info()`, `warn()`, `error()`

### Plugin API (ctx.api)

#### UI API (ctx.api.ui)

- **`inject(selector, element, position)`**: Injects a DOM element at the specified selector. Position can be `'before'`, `'after'`, `'prepend'`, or `'append'` (default). Returns a cleanup function that removes the element.
- **`replace(selector, element)`**: Replaces the element at the selector with a new element. Returns a cleanup function that restores the original element.
- **`registerComponent(name, component)`**: Registers a UI component with the Component Registry. Component object should include a `priority` field.
- **`unregisterComponent(name)`**: Unregisters a previously registered component.
- **`showToast(message, type, duration)`**: Displays a toast notification. Type can be `'info'`, `'success'`, `'warning'`, or `'error'`. Duration is in milliseconds (default handled by implementation).

#### Data API (ctx.api.data)

- **`onUpdate(callback)`**: Registers a callback to be notified when data changes. Returns a cleanup function that unregisters the callback.
- **`getCard(id)`**: Returns a cloned card object for the given ID, or undefined if not found.
- **`listCards()`**: Returns an array of all card objects (cloned).
- **`createCard(data)`**: Creates a new card with the specified data object. Data should contain `title`, `body`, `parentId`, and `tags` fields. Returns the new card ID.
- **`updateCard(id, updates)`**: Updates the card with the given ID with the provided updates object. Returns the updated card.
- **`deleteCard(id)`**: Deletes the card with the given ID. Returns true if successful.
- **`getTags(cardId)`**: Returns an array of tags for the specified card.
- **`addTag(cardId, tag)`**: Adds a tag to the specified card. Returns true if successful.
- **`removeTag(cardId, tag)`**: Removes a tag from the specified card. Returns true if successful.
- **`setTags(cardId, tags)`**: Sets the tags for the specified card to the provided array. Returns true if successful.
- **`getAllTags()`**: Returns an array of all unique tags across all cards.

#### Storage API (ctx.api.storage)

The storage API provides plugin-namespaced storage using localStorage:

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
- **`clear(eventName)`**: Clears all listeners for the specified event (or all events if no name provided).

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
- **`network`**: Permission to make network requests (not enforced by core, but declared for transparency)
- **`filesystem`**: Permission to access filesystem APIs (mobile only)
- **`core-override`**: Permission to override core functionality (high risk)

Permissions are checked when a plugin is enabled, and users are prompted to grant access.

## Utilities API (`CardSpoke.utils`)

The utilities API provides global helper functions available to all plugins and the core app.

### Card Operations

**Note:** The internal `createCard()` function has the signature `createCard(title, body, parentId, skipSave, skipHooks)` and returns a card ID. When using `ctx.api.data.createCard()`, pass an object with `title`, `body`, `parentId`, and `tags` fields.

Direct window functions (available but not recommended for plugin use):
- `window.createCard(title, body, parentId, skipSave, skipHooks)`: Creates a card and returns its ID
- `window.updateCard(id, updates, skipSave, skipHooks)`: Updates a card's fields
- `window.deleteCard(id, opts)`: Deletes a card and its children recursively
- `window.getCard(id)`: Retrieves a card by ID
- `window.cloneCard(card)`: Creates a deep clone of a card object

### Tag Operations

Direct window functions for tag management:
- `window.getTags(cardId)`: Returns array of tags for a card
- `window.addTag(cardId, tag)`: Adds a tag to a card
- `window.removeTag(cardId, tag)`: Removes a tag from a card  
- `window.setTags(cardId, tags)`: Sets all tags for a card
- `window.getAllTags()`: Returns all unique tags across all cards

### Search

- `window.searchCards(query)`: Case-insensitive search across card titles, bodies, and tags. Returns array of matching cards.

### Dataset Metadata

- `window.getDatasetMeta()`: Returns metadata about the current dataset including:
  - `name`: Dataset name
  - `cardCount`: Total number of cards
  - `rootCount`: Number of root-level cards
  - `tagCount`: Number of unique tags
  - `appVersion`: Current app version
  - `schemaVersion`: Current schema version

### UI Feedback

- `window.showToast(message, type, duration)`: Displays a toast notification
  - `message`: Text to display
  - `type`: One of `'info'`, `'success'`, `'warning'`, `'error'`
  - `duration`: Display duration in milliseconds (default: 3000)

### Theme and Accessibility

Direct window functions for appearance:
- `window.setTheme(theme)`: Sets the theme (`'light'` or `'dark'`)
- `window.getTheme()`: Returns the current theme
- `window.setTypography(preset)`: Sets the typography preset
- `window.getTypography()`: Returns the current typography preset
- `window.setHighContrast(enabled)`: Enables or disables high contrast mode
- `window.isHighContrast()`: Returns whether high contrast mode is enabled
- `window.prefersReducedMotion()`: Returns whether the user prefers reduced motion

### Storage and Persistence

- `window.save()`: Saves the current state to localStorage
- `window.load()`: Loads state from localStorage

### Notes

- Most utility functions work with the global `window.store` object
- Plugins should prefer using `ctx.api.data` methods over direct window functions for better compatibility
- Functions may return `undefined`, `null`, or empty arrays when data is not available
- The app uses localStorage for preferences and datasets, IndexedDB is planned for future versions
