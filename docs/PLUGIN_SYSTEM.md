# CardSpoke Plugin System

This document describes the modern plugin-based plugin system that powers CardSpoke's extensibility. Plugins can range from simple visual themes to full app-layer transformations.

**Current Version:** 0.17.0 | **Schema Version:** 4 | **Release Date:** 2026-02-17

## Overview

The plugin system is built on a modern, powerful architecture featuring:

- **Middleware Pipeline**: Priority-weighted interceptors for core operations
- **Plugin API**: Sandboxed contexts with resource management and hot-unloading
- **Component Registry**: Type-safe UI component overrides
- **Storage Driver Registry**: Pluggable storage backends
- **Permissions System**: User consent for sensitive operations

### Architecture Components

1. **Middleware Pipeline**: Interceptors that can modify or cancel operations
2. **Plugin API**: Isolated contexts with `api.ui`, `api.data`, `api.storage`, and `api.events`
3. **Component Registry**: Register UI components with priority-based resolution
4. **Storage Drivers**: Pluggable storage backends (IndexedDB, cloud, git, etc.)
5. **Permissions**: Explicit permission requests with user consent dialogs

## Plugin Package Format

### Plugin Definition Format

**All plugins use one of two formats:**
- **ES6 Module Format**: For development with bundlers (Vite/ESBuild) and modern JavaScript workflows
- **Runtime Registration Format**: For direct browser usage without a build step

#### ES6 Module Format (for development with Vite/ESBuild)

This format is ideal for TypeScript projects and modern JavaScript development. It requires a build step to bundle into the runtime registration format.

```javascript
export default {
  manifest: {
    name: "My Plugin",
    version: "1.0.0",
    author: "Author Name",
    description: "What this plugin does",
    layer: "theme | feature | app",
    permissions: ["ui-override", "storage"]
  },
  setup: async (ctx) => {
    // Plugin initialization with ctx.api
  },
  teardown: async (ctx) => {
    // Cleanup (resources auto-managed)
  },
  css: "/* Optional CSS */"
};
```

**Note:** See `sample-plugins/` for working examples

#### Runtime Registration Format (for direct browser usage)

This format works directly in the browser without any build step. Use this for quick prototyping or when bundlers are not available.

```javascript
window.CardSpoke.Plugin.register('my-plugin', {
  manifest: {
    name: "My Plugin",
    version: "1.0.0",
    author: "Author Name",
    description: "What this plugin does",
    layer: "theme | feature | app",
    permissions: ["ui-override", "storage"]
  },
  setup: async (ctx) => {
    // Plugin initialization with ctx.api
  },
  teardown: async (ctx) => {
    // Cleanup (resources auto-managed)
  },
  css: "/* Optional CSS */"
});
```

Used in: Direct browser `<script>` tags or inline code

### Required Fields
- **id**: Lowercase alphanumeric with hyphens (`/^[a-z0-9-]+$/`). Must be unique within your plugin context.
- **manifest.name**: Human-readable display name.
- **manifest.version**: Semver string (`X.Y.Z`).
- **manifest.author**: Creator name.
- **manifest.layer**: One of `theme`, `feature`, or `app`.

### Optional Fields
- **manifest.description**: Short description of the plugin.
- **manifest.permissions**: Array of requested permissions.
- **config**: Object of user-configurable settings (arbitrary key/value pairs).
- **css**: CSS string injected into the page when the plugin is enabled.
- **setup**: Async function called when plugin is enabled.
- **teardown**: Async function called when plugin is disabled or uninstalled.
- **overrides**: Object of app-level overrides (only meaningful for `app` layer).

## Three-Layer Architecture

### 1. Theme Layer
- **Capabilities**: CSS only.
- **Restrictions**: No JavaScript allowed. No overrides.
- **Risk Level**: Low (safe).
- **Use Cases**: Color schemes, typography changes, layout tweaks, dark/light variants.

### 2. Feature Layer
- **Capabilities**: CSS and JavaScript.
- **Restrictions**: No overrides.
- **Risk Level**: Medium.
- **Use Cases**: New UI panels, keyboard shortcuts, card enhancements, import/export tools, integrations.

### 3. App Layer
- **Capabilities**: CSS, JavaScript, and overrides.
- **Restrictions**: None (highest privilege).
- **Risk Level**: High.
- **Use Cases**: Rename the app, hide/add menu items, add custom pages, disable built-in features, fundamentally transform the app experience.

## Override System (App Layer Only)

App-layer plugins can declare overrides that modify core app behavior:

```json
{
  "overrides": {
    "appName": "Custom App Name",
    "hideMenuItems": ["menuTrashBin", "menuBookmarks"],
    "customMenuItems": [
      { "id": "myItem", "label": "My Feature", "section": "actions" }
    ],
    "customPages": [
      { "id": "myPage", "title": "My Page", "render": "renderMyPage" }
    ],
    "disableFeatures": ["bookmarks", "recentCards"]
  }
}
```

### Available Overrides
- **appName**: Replace the brand/title displayed in the header.
- **hideMenuItems**: Array of menu item element IDs to hide.
- **customMenuItems**: Array of menu items to inject, each with `id`, `label`, and optional `section`.
- **customPages**: Array of custom pages with render function names.
- **disableFeatures**: Array of built-in feature names to disable.

## Risk Assessment

The system automatically assesses risk based on layer and content:

| Layer | Base Risk | JS with Network | JS with DOM | With Overrides |
|-------|-----------|-----------------|-------------|----------------|
| theme | LOW | N/A | N/A | N/A |
| feature | MEDIUM | HIGH | MEDIUM | N/A |
| app | HIGH | HIGH | HIGH | HIGH |

Risk indicators checked in JavaScript:
- Network access: `fetch(`, `XMLHttpRequest`, `WebSocket`
- DOM manipulation: `document.write`, `innerHTML`, `eval(`
- Storage access: `localStorage`, `indexedDB`

## Lifecycle and Hooks

The modern plugin system uses setup/teardown functions for initialization and cleanup. For fine-grained control over app operations, use the Middleware Pipeline (see below).

### Setup and Teardown

Every plugin defines these lifecycle functions:

- **`setup(ctx)`**: Called when the plugin is enabled. Use this to initialize resources, register middleware, or inject UI.
- **`teardown(ctx)`**: Called when the plugin is disabled or uninstalled. Use this to clean up resources (automatic for most cases).

### Resource Management

The Plugin API automatically manages resources:
- Injected DOM elements are tracked
- Event listeners are scoped to the plugin
- Middleware handlers are automatically unregistered on disable
- Component registry overrides are reverted on disable

## Plugin Manager UI

The Plugin Manager is accessible from the main menu and has three tabs:

1. **Installed**: Lists all installed plugins with enable/disable toggles, risk badges, and uninstall buttons.
2. **Install**: Upload a plugin JSON file or load from URL.
3. **Create**: Build a plugin directly in the app by providing metadata, JavaScript, and CSS.

## Installation Methods

### File Upload
Upload a plugin definition file through the Upload modal (Plugins tab) or the Plugin Manager's Install tab.

### Manual Creation
Use the Create tab in the Plugin Manager to define a plugin directly in the app by providing metadata, JavaScript code, and CSS.

### Programmatic
```javascript
window.CardSpoke.Plugin.register('my-plugin', pluginDefinition);
```

## Safe Mode

Launch with `?safemode` in the URL to disable all plugins. This is useful for troubleshooting when a plugin causes issues. In safe mode, the app displays a "Plugins Disabled" banner and no plugin code executes.

## Validation Rules

`validateModPackage()` enforces:
1. `manifest` must exist with `name`, `version`, `author`, and `layer`.
2. `manifest.layer` must be one of `theme`, `feature`, or `app`.
3. Theme-layer plugins must have no `setup`/`teardown` functions (CSS only).
4. `overrides` are only meaningful for `app`-layer plugins.
5. `permissions` must be from the allowed set.

## Event Bus

Plugins can communicate via the Plugin API event system:
- `ctx.api.events.on(event, callback)`: Subscribe to an event. Returns a cleanup function.
- `ctx.api.events.off(event, callback)`: Unsubscribe from an event.
- `ctx.api.events.emit(event, ...args)`: Broadcast an event with optional arguments.
- `ctx.api.events.once(event, callback)`: Subscribe to an event that fires only once.

**Note:** Events are plugin-scoped and automatically cleaned up when the plugin is disabled. Event handlers are isolated to each plugin's context.

## Developer Tools

Use the browser console to debug plugins:

```javascript
// List all registered plugins
window.CardSpoke.Plugin.list();

// Get plugin info
window.CardSpoke.Plugin.get('plugin-id');

// Manually trigger enable/disable
await window.CardSpoke.Plugin.enable('plugin-id');
await window.CardSpoke.Plugin.disable('plugin-id');

// Install a plugin package
const pluginId = await window.CardSpoke.Plugin.install(pluginPackage);

// Assess plugin risk
const risk = window.CardSpoke.Plugin.assessModRisk(pluginPackage);

// Monitor middleware performance (if available)
window.CardSpoke.Middleware.getStats();

// Check component registry (if available)
window.CardSpoke.ComponentRegistry.list();
```

## LocalStorage Keys

Plugin data is persisted in localStorage under plugin-namespaced keys. Each plugin has its own isolated storage accessed via `ctx.api.storage`:

- `ctx.api.storage.get(key)`: Retrieves a value (automatically namespaced)
- `ctx.api.storage.set(key, value)`: Stores a value (automatically namespaced)
- `ctx.api.storage.remove(key)`: Removes a value
- `ctx.api.storage.list(prefix)`: Lists all keys matching the prefix
- `ctx.api.storage.getNamespace()`: Returns the plugin's storage namespace string

Plugin metadata and enabled state are stored in `window.store.plugins` and persisted via localStorage.

**Core app keys:**
- `cardspoke_dataset`: Current dataset name
- `cardspoke_theme`: Theme preference (light/dark)
- `cardspoke_typography`: Typography preset
- `cardspoke_highContrast`: High contrast mode setting
- `cardspoke_devMode`: Developer mode flag
- `cardspoke_richText`: Rich text mode setting
- `cardspoke_gridView`: Grid view preference

## Modern Plugin API

The new Plugin API provides a sandboxed environment with automatic resource management.

### Basic Usage

```javascript
window.CardSpoke.Plugin.register('my-plugin', {
  manifest: {
    name: "My Plugin",
    version: "1.0.0",
    author: "Author",
    layer: "feature",
    permissions: ["ui-override"]
  },
  
  setup: async (ctx) => {
    // Access APIs
    const cards = ctx.api.data.listCards();
    
    // Inject UI
    const element = document.createElement('div');
    element.textContent = `Total cards: ${cards.length}`;
    ctx.api.ui.inject('#sidebar', element, 'append');
    
    // Listen for changes
    ctx.api.data.onUpdate((event) => {
      console.log('Data updated:', event);
    });
  },
  
  teardown: async (ctx) => {
    // Automatic cleanup of resources
  }
});

// Enable the plugin
await window.CardSpoke.Plugin.enable('my-plugin');
```

### Plugin Context APIs

Every plugin receives a context object with:

- **`ctx.pluginId`**: The plugin's unique identifier
- **`ctx.appVersion`**: Current app version (0.17.0)
- **`ctx.schemaVersion`**: Current schema version (4)
- **`ctx.api.ui`**: DOM manipulation (`inject`, `replace`, `registerComponent`, `unregisterComponent`, `showToast`)
- **`ctx.api.data`**: Data access (`getCard`, `listCards`, `createCard`, `updateCard`, `deleteCard`, `getTags`, `addTag`, `removeTag`, `setTags`, `getAllTags`, `onUpdate`)
- **`ctx.api.storage`**: Namespaced storage (`get`, `set`, `remove`, `list`, `getNamespace`)
- **`ctx.api.events`**: Event system (`on`, `off`, `emit`, `once`)
- **`ctx.logger`**: Scoped logger (`log`, `info`, `warn`, `error`)

See [Plugin API Documentation](./api/PLUGIN_API.md) and [API Reference](./api/API_REFERENCE.md) for complete details.

## Middleware Pipeline

The Middleware Pipeline replaces hooks with a more powerful interceptor pattern.

### Basic Usage

```javascript
window.CardSpoke.Middleware.register({
  name: 'my-interceptor',
  priority: 10,  // Higher runs first
  operations: ['card.save', 'card.delete'],
  handler: async (ctx, next) => {
    console.log('Before:', ctx.operation);
    
    // Modify arguments
    if (ctx.operation === 'card.save') {
      const card = ctx.args[0];
      card.metadata = card.metadata || {};
      card.metadata.intercepted = true;
    }
    
    // Call next middleware
    await next();
    
    console.log('After:', ctx.operation);
  }
});
```

### Standard Operations

- `card.save` - Card create/update
- `card.delete` - Card deletion
- `card.render` - Card rendering
- `navigation.change` - Navigation change
- `search.execute` - Search execution
- `data.export` / `data.import` - Data export/import
- `theme.change` - Theme change
- `typography.change` - Typography change

See [Middleware Pipeline Documentation](./api/MIDDLEWARE_PIPELINE.md) for details.

## Component Registry

Override UI components with priority-based resolution.

### Basic Usage

```javascript
// Get original component
const OriginalCard = window.CardSpoke.ComponentRegistry.get('Card');

// Register enhanced version
window.CardSpoke.ComponentRegistry.register('Card', {
  render: (props) => {
    const cardEl = OriginalCard ? OriginalCard.render(props) : document.createElement('div');
    
    // Add enhancements
    const badge = document.createElement('span');
    badge.textContent = '✨ Enhanced';
    cardEl.appendChild(badge);
    
    return cardEl;
  },
  priority: 50
}, 50);
```

### Standard Components

- `Card` - Card display
- `CardEditor` - Card editing form
- `Sidebar` - Left sidebar
- `SearchBar` - Search input
- `SearchResults` - Search results list
- `TagList` - Tag display
- `Modal` - Modal dialog
- `Toast` - Notification

See [Component Registry Documentation](./api/COMPONENT_REGISTRY.md) for details.

## Storage Driver Registry

Register custom storage backends.

### Basic Usage

```javascript
class CustomStorageDriver {
  async init(config) { /* ... */ }
  async get(key) { /* ... */ }
  async set(key, value) { /* ... */ }
  async remove(key) { /* ... */ }
  async list(prefix) { /* ... */ }
  async getSize() { /* ... */ }
  getKind() { return 'custom'; }
}

window.CardSpoke.StorageDriverRegistry.register('custom', new CustomStorageDriver());
await window.CardSpoke.StorageDriverRegistry.setActive('custom');
```

## Permission System

Plugins must request permissions for sensitive operations.

### Available Permissions

- **`ui-override`**: Modify UI and inject elements
- **`storage`**: Access local storage
- **`network`**: Make network requests
- **`filesystem`**: Access filesystem (mobile)
- **`core-override`**: Override core functions (high risk)

### Requesting Permissions

```javascript
manifest: {
  permissions: ["ui-override", "storage"]
}
```

Users are prompted to approve permissions on first install.

## Schema and Metadata

Cards now support a `metadata` field for plugin-specific data:

```javascript
card.metadata = {
  pluginData: {
    'my-plugin': {
      customField: 'value',
      timestamp: Date.now()
    }
  }
};
```

The `metadata` field is preserved during:
- Card save/load
- Export/import
- Duplication
- Search indexing

## TypeScript Support

Install type definitions:

```bash
npm install @cardspoke/core
```

Use in your plugin:

```typescript
import type { PluginDefinition, PluginContext } from '@cardspoke/core';

const plugin: PluginDefinition = {
  manifest: { /* ... */ },
  setup: async (ctx: PluginContext) => {
    // TypeScript knows the API shape
  }
};

export default plugin;
```

## Examples and Resources

Complete examples are available in the `sample-plugins/` directory:

- **`sample-plugins/themes/`**: Theme-layer plugins (CSS only)
- **`sample-plugins/features/`**: Feature-layer plugins (JavaScript + CSS)
- **`sample-plugins/apps/`**: App-layer plugins (full customization)

Each directory contains working examples demonstrating the Plugin API, middleware, and component registry.

## API Reference

Detailed documentation:

- [Plugin API](./api/PLUGIN_API.md)
- [Middleware Pipeline](./api/MIDDLEWARE_PIPELINE.md)
- [Component Registry](./api/COMPONENT_REGISTRY.md)
- [API Reference](./api/API_REFERENCE.md)
- [TypeScript Definitions](../types/index.d.ts)

## Security Considerations

1. **Permissions**: Always request minimal permissions needed for functionality
2. **Validation**: Validate user input in middleware handlers
3. **Sandboxing**: Use Plugin API instead of direct global access
4. **Review**: Review third-party plugins before installation
5. **Testing**: Test hot-reload and cleanup thoroughly
6. **Risk Assessment**: Understand the risk level of each plugin layer

## Best Practices

1. **Use Plugin API**: Prefer `ctx.api` over direct window/global access
2. **Register components**: Use Component Registry instead of direct DOM manipulation
3. **Add metadata**: Use `card.metadata` or `card.modsData` for plugin-specific data
4. **Handle errors**: Wrap async operations in try/catch blocks
5. **Document permissions**: Clearly explain why each permission is needed
6. **Test cleanup**: Ensure all resources are freed when plugin is disabled
7. **Version appropriately**: Follow semantic versioning for updates
8. **Minimize scope**: Only request permissions you actually need

## Support

- Check [API documentation](./api/)
- See [examples](../sample-plugins/)
- Ask in [GitHub Issues](https://github.com/jxburros/CardSpoke/issues)

---

**Current Plugin System:** This is the only supported plugin API. The modern Plugin API, Middleware Pipeline, and Component Registry provide powerful extensibility with better resource management and security.
