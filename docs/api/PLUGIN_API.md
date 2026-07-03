# Plugin API Documentation

**Version:** 0.17.0

The Plugin API provides a sandboxed, resource-managed environment for plugin development with isolated contexts and automatic cleanup support.

## Overview

Key features:

- **Isolated Contexts**: Each plugin gets its own API sandbox
- **Resource Tracking**: Automatic tracking of DOM elements, listeners, and components
- **Hot Unloading**: Clean removal without page refresh or ghost elements
- **Namespaced Storage**: Plugin-specific storage namespace
- **Permission System**: User consent for sensitive operations

## Plugin Structure

```javascript
const plugin = {
  manifest: {
    name: 'My Plugin',
    version: '1.0.0',
    author: 'Author Name',
    layer: 'feature',
    permissions: ['ui-override', 'storage']
  },
  setup: async (ctx) => {
    // Plugin initialization
  },
  teardown: async (ctx) => {
    // Plugin cleanup
  },
  css: '/* Optional CSS */'
};

window.CardSpoke.registerPlugin('my-plugin', plugin);
```

## Plugin Context

Every plugin receives a context object:

```javascript
{
  modId: string,              // Plugin ID
  appVersion: string,         // App version (0.17.0)
  schemaVersion: number,      // Schema version (4)
  api: {
    ui: UIApi,                // UI manipulation
    data: DataApi,            // Data access
    storage: StorageApi,      // Persistent storage
    events: EventApi,         // Shared cross-plugin event bus
    network: NetworkApi,       // Permission-gated network access
    filesystem: FilesystemApi  // Permission-gated Capacitor filesystem access
  },
  utils: object,              // Reserved; always {} in the current build (see Utils section below)
  config?: object,            // Plugin manifest config (when provided)
  logger: Logger              // Scoped logger
}
```

## API Reference

### UI API

#### `ctx.api.ui.inject(selector, element, position)`

Inject an element into the DOM.

```javascript
const cleanup = ctx.api.ui.inject('#main', myElement, 'append');
// cleanup() removes the element
```

**Positions**: `'before'`, `'after'`, `'append'`, `'prepend'`

#### `ctx.api.ui.replace(selector, element)`

Replace an existing element.

```javascript
const restore = ctx.api.ui.replace('#card-title', newElement);
// restore() reverts to original
```

#### `ctx.api.ui.registerComponent(name, component)`

Register a UI component.

```javascript
ctx.api.ui.registerComponent('Card', {
  render: (props) => {
    const el = document.createElement('div');
    el.textContent = props.title;
    return el;
  },
  priority: 10
});
```

#### `ctx.api.ui.showToast(message, type, duration)`

Show a toast notification.

```javascript
ctx.api.ui.showToast('Saved!', 'success', 3000);
```

**Types**: `'success'`, `'error'`, `'info'`, `'warning'`

### Data API

**Known limitation:** `getCard`, `listCards`, `createCard`, `updateCard`, `deleteCard`, `getTags`, `addTag`, `removeTag`, `setTags`, and `getAllTags` are all implemented by reading/writing internal `window.store`/`window.createCard`/etc. globals that are never attached to `window` in the current build (verified across `www/src/*.js`). Only `onUpdate` works reliably today; the rest should be treated as not yet functional. See the per-method notes below.

#### `ctx.api.data.onUpdate(callback)`

Listen for data changes.

```javascript
const unlisten = ctx.api.data.onUpdate((event) => {
  console.log(event.type, event.cardId, event.card);
});
```

**Event Types**: `'create'`, `'update'`, `'delete'`

#### `ctx.api.data.getCard(id)`

Get a card by ID. Depends on `window.store`, which is not populated in the current build, so this currently returns `undefined`.

```javascript
const card = ctx.api.data.getCard('card-123');
```

#### `ctx.api.data.listCards()`

List all cards. Depends on `window.store`, which is not populated in the current build, so this currently returns `[]`.

```javascript
const cards = ctx.api.data.listCards();
```

#### `ctx.api.data.createCard(data)`

Create a new card. Requires the `data-modify` permission.

**Known limitation:** This method delegates to an internal `window.createCard` global that is not populated in the current build, so calling it currently throws `"createCard not available"` rather than returning a new card ID as shown below.

```javascript
const id = ctx.api.data.createCard({
  title: 'New Card',
  body: 'Content',
  tags: ['tag1', 'tag2']
});
```

#### `ctx.api.data.updateCard(id, updates)`

Update a card. Requires the `data-modify` permission.

**Known limitation:** Depends on an internal `window.updateCard` global that is not populated in the current build; calling it currently throws `"updateCard not available"`.

```javascript
const updated = ctx.api.data.updateCard('card-123', {
  title: 'Updated Title'
});
```

#### `ctx.api.data.deleteCard(id)`

Delete a card. Requires the `data-modify` permission.

**Known limitation:** Depends on an internal `window.deleteCard` global that is not populated in the current build; calling it currently returns `false` instead of deleting the card.

```javascript
ctx.api.data.deleteCard('card-123');
```

#### Tag Management

`addTag`, `removeTag`, and `setTags` require the `data-modify` permission. Like the card CRUD methods above, all of the tag methods depend on internal `window.getTags`/`window.addTag`/`window.removeTag`/`window.setTags`/`window.getAllTags` globals that are not populated in the current build, so these calls currently return empty/`false` results rather than working as shown.

```javascript
// Get tags
const tags = ctx.api.data.getTags('card-123');

// Add tag
ctx.api.data.addTag('card-123', 'new-tag');

// Remove tag
ctx.api.data.removeTag('card-123', 'old-tag');

// Set all tags
ctx.api.data.setTags('card-123', ['tag1', 'tag2']);

// Get all unique tags
const allTags = ctx.api.data.getAllTags();
```

### Storage API

Plugin-specific namespaced storage.

#### `ctx.api.storage.get(key)`

Get a value from storage.

```javascript
const value = await ctx.api.storage.get('myKey');
```

#### `ctx.api.storage.set(key, value)`

Set a value in storage.

```javascript
await ctx.api.storage.set('myKey', { foo: 'bar' });
```

#### `ctx.api.storage.remove(key)`

Remove a value from storage.

```javascript
await ctx.api.storage.remove('myKey');
```

#### `ctx.api.storage.list(prefix)`

List keys with optional prefix.

```javascript
const keys = await ctx.api.storage.list('settings_');
```

#### `ctx.api.storage.getNamespace()`

Get the plugin's storage namespace.

```javascript
const ns = ctx.api.storage.getNamespace();
// Returns: 'plugin_my-plugin_'
```

### Events API

Plugin-specific event system.

#### `ctx.api.events.on(event, callback)`

Listen for an event.

```javascript
const unlisten = ctx.api.events.on('custom-event', (data) => {
  console.log('Event:', data);
});
```

#### `ctx.api.events.emit(event, ...args)`

Emit an event.

```javascript
ctx.api.events.emit('custom-event', { data: 'value' });
```

#### `ctx.api.events.once(event, callback)`

Listen for an event once.

```javascript
ctx.api.events.once('init-complete', () => {
  console.log('Initialized');
});
```

### Logger

Scoped logging with plugin prefix.

```javascript
ctx.logger.log('Info message');
ctx.logger.info('Info message');
ctx.logger.warn('Warning message');
ctx.logger.error('Error message');
```

Output: `[Plugin:my-plugin] Info message`

### Utils

**Known limitation:** `ctx.utils` is currently always an empty object `{}` in the shipped build. It is defined as `window.CardSpoke && window.CardSpoke.utils ? window.CardSpoke.utils : {}`, but `window.CardSpoke.utils` does not survive the `Object.freeze()` applied to the public `window.CardSpoke` object (which exposes only `registerPlugin` and `requestPermissions`). As a result, none of the helper methods below are currently reachable through `ctx.utils`, even though equivalent internal functions (`uid`, `debounce`, `escapeHtml`, `normalizeTagInput`, `cloneCard`, `highlightText`) exist in `www/src/metadata.js`. The examples below describe the intended shape of this API, not working code:

```javascript
// NOT CURRENTLY FUNCTIONAL — ctx.utils is always {} today.

// Generate unique ID
const id = ctx.utils.uid();

// Debounce function
const debounced = ctx.utils.debounce(() => {
  console.log('Debounced');
}, 500);

// Escape HTML
const safe = ctx.utils.escapeHtml('<script>');

// Normalize tags
const tags = ctx.utils.normalizeTagInput('#tag1, tag2');

// Clone card
const copy = ctx.utils.cloneCard(card);

// Highlight text
const highlighted = ctx.utils.highlightText('text', 'query');
```

## Permission System

Plugins must declare required permissions in their manifest:

```javascript
manifest: {
  permissions: [
    'ui-override',     // Modify UI and inject elements
    'storage',         // Access local storage
    'network',         // Make network requests
    'filesystem',      // Access filesystem (mobile)
    'core-override',   // Override core functions (high risk)
    'data-modify'      // Perform mutating ctx.api.data calls (createCard, updateCard, deleteCard, addTag, removeTag, setTags)
  ]
}
```

Users are prompted to approve permissions on first install.

## Complete Example

```javascript
window.CardSpoke.registerPlugin('note-counter', {
  manifest: {
    name: 'Note Counter',
    version: '1.0.0',
    author: 'Example',
    layer: 'feature',
    permissions: ['ui-override', 'storage']
  },
  
  setup: async (ctx) => {
    ctx.logger.info('Initializing');
    
    // Load saved count
    const count = await ctx.api.storage.get('count') || 0;
    
    // Create counter UI
    const counter = document.createElement('div');
    counter.id = 'note-counter';
    counter.textContent = `Total notes: ${count}`;
    
    // Inject into sidebar
    ctx.api.ui.inject('#sidebar', counter, 'prepend');
    
    // Listen for data changes
    ctx.api.data.onUpdate(async (event) => {
      if (event.type === 'create') {
        const newCount = count + 1;
        await ctx.api.storage.set('count', newCount);
        counter.textContent = `Total notes: ${newCount}`;
      }
    });
    
    ctx.logger.info('Initialized');
  },
  
  teardown: async (ctx) => {
    ctx.logger.info('Cleaning up');
    // Resources automatically cleaned up
  },
  
  css: `
    #note-counter {
      padding: 1rem;
      font-weight: bold;
      color: var(--accent);
    }
  `
});
```

## Plugin Lifecycle

1. **Register**: Plugin definition registered with system
2. **Enable**:
   - Permissions checked
   - CSS applied
   - `setup()` called
   - Resources tracked
3. **Active**: Plugin responds to events, modifies UI
4. **Disable**:
   - `teardown()` called
   - CSS removed
   - Resources cleaned up
   - Storage persists

## Resource Management

All resources created via the Plugin API are automatically tracked:

- DOM elements (from `inject()`, `replace()`)
- Event listeners (from `events.on()`)
- Data listeners (from `data.onUpdate()`)
- Registered components

When a plugin is disabled, all resources are automatically cleaned up.

## Best Practices

1. **Use namespaced storage**: Don't pollute global storage
2. **Clean up in teardown**: Even though automatic cleanup exists
3. **Handle errors**: Wrap async operations in try/catch
4. **Request minimal permissions**: Only what you need
5. **Test hot-unload**: Ensure your plugin unloads cleanly
6. **Use logger**: For debugging and user feedback

## See Also

- [Middleware Pipeline](./MIDDLEWARE_PIPELINE.md) - Intercept operations
- [Component Registry](./COMPONENT_REGISTRY.md) - UI components
- [Plugin System Documentation](../PLUGIN_SYSTEM.md) - Complete plugin system guide including permissions

### Network API

- `ctx.api.network.fetch(url, options)` wraps `window.fetch` and requires the `network` permission.
- `ctx.api.network.xhr()` creates an `XMLHttpRequest` and requires the `network` permission.

### Filesystem API

- `ctx.api.filesystem.readFile(path, options)` reads files through Capacitor Filesystem when available.
- `ctx.api.filesystem.writeFile(path, data, options)` writes files through Capacitor Filesystem when available.
- Both filesystem calls require the `filesystem` permission and throw if Filesystem is unavailable on the current platform.
