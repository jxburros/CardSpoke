# CardSpoke Mod System

This document describes the modern plugin-based mod system that powers CardSpoke's extensibility. Mods can range from simple visual themes to full app-layer transformations.

**Current Version:** 0.16.0 | **Schema Version:** 4 | **Release Date:** 2025-11-30

## Overview

The mod system is built on a modern, powerful architecture featuring:

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

## Mod Package Format

### Plugin Definition Format

**All mods use one of two formats:**
- **ES6 Module Format**: For development with bundlers (Vite/ESBuild) and modern JavaScript workflows
- **Runtime Registration Format**: For direct browser usage without a build step

#### ES6 Module Format (for development with Vite/ESBuild)

This format is ideal for TypeScript projects and modern JavaScript development. It requires a build step to bundle into the runtime registration format.

```javascript
export default {
  manifest: {
    name: "My Mod",
    version: "1.0.0",
    author: "Author Name",
    description: "What this mod does",
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

Used in: `sample-mods/new-api/` examples

#### Runtime Registration Format (for direct browser usage)

This format works directly in the browser without any build step. Use this for quick prototyping or when bundlers are not available.

```javascript
window.CardSpoke.Plugin.register('my-mod', {
  manifest: {
    name: "My Mod",
    version: "1.0.0",
    author: "Author Name",
    description: "What this mod does",
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
- **manifest.description**: Short description of the mod.
- **manifest.permissions**: Array of requested permissions.
- **config**: Object of user-configurable settings (arbitrary key/value pairs).
- **css**: CSS string injected into the page when the mod is enabled.
- **setup**: Async function called when mod is enabled.
- **teardown**: Async function called when mod is disabled or uninstalled.
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

App-layer mods can declare overrides that modify core app behavior:

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

## Mod Manager UI

The Mod Manager is accessible from the main menu and has three tabs:

1. **Installed**: Lists all installed mods with enable/disable toggles, risk badges, and uninstall buttons.
2. **Install**: Upload a mod JSON file or load from URL.
3. **Create**: Build a mod directly in the app by providing metadata, JavaScript, and CSS.

## Installation Methods

### File Upload
Upload a plugin definition file through the Upload modal (Mods tab) or the Mod Manager's Install tab.

### Manual Creation
Use the Create tab in the Mod Manager to define a plugin directly in the app by providing metadata, JavaScript code, and CSS.

### Programmatic
```javascript
window.CardSpoke.Plugin.register('my-mod', pluginDefinition);
```

## Safe Mode

Launch with `?safemode` in the URL to disable all plugins. This is useful for troubleshooting when a plugin causes issues. In safe mode, the app displays a "Mods Disabled" banner and no plugin code executes.

## Validation Rules

`validateModPackage()` enforces:
1. `manifest` must exist with `name`, `version`, `author`, and `layer`.
2. `manifest.layer` must be one of `theme`, `feature`, or `app`.
3. Theme-layer plugins must have no `setup`/`teardown` functions (CSS only).
4. `overrides` are only meaningful for `app`-layer plugins.
5. `permissions` must be from the allowed set.

## Event Bus

Plugins can communicate via the Plugin API event system:
- `ctx.api.events.on(event, callback)`: Subscribe to an event.
- `ctx.api.events.off(event, callback)`: Unsubscribe.
- `ctx.api.events.emit(event, data)`: Broadcast an event.

This is scoped to your plugin and automatically cleaned up on disable.

## Developer Tools

Use the browser console to debug plugins:

```javascript
// List all registered plugins
window.CardSpoke.Plugin.listAll();

// Get plugin info
window.CardSpoke.Plugin.inspect('plugin-id');

// Manually trigger enable/disable
await window.CardSpoke.Plugin.enable('plugin-id');
await window.CardSpoke.Plugin.disable('plugin-id');

// Monitor middleware performance
window.CardSpoke.Middleware.getStats();

// Check component registry
window.CardSpoke.ComponentRegistry.list();
```

## LocalStorage Keys

Plugin data is persisted in IndexedDB under the `plugins` namespace. Each plugin has its own isolated storage accessed via `ctx.api.storage`.

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

- **`ctx.api.ui`**: DOM manipulation (`inject`, `replace`, `registerComponent`, `showToast`)
- **`ctx.api.data`**: Data access (`getCard`, `listCards`, `createCard`, `updateCard`, `deleteCard`, `onUpdate`)
- **`ctx.api.storage`**: Namespaced storage (`get`, `set`, `remove`, `list`)
- **`ctx.api.events`**: Event system (`on`, `emit`, `once`)
- **`ctx.utils`**: Utility functions (`uid`, `debounce`, `escapeHtml`, etc.)
- **`ctx.logger`**: Scoped logger (`log`, `info`, `warn`, `error`)

See [Plugin API Documentation](./api/PLUGIN_API.md) for complete reference.

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

Use in your mod:

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

Complete examples are available in `sample-mods/new-api/`:

- **example-feature-mod.js**: Middleware, component registry, and data updates
- **example-app-mod.js**: App-level customization with storage drivers

## API Reference

Detailed documentation:

- [Plugin API](./api/PLUGIN_API.md)
- [Middleware Pipeline](./api/MIDDLEWARE_PIPELINE.md)
- [Component Registry](./api/COMPONENT_REGISTRY.md)
- [TypeScript Definitions](../types/index.d.ts)

## Security Considerations

1. **Permissions**: Always request minimal permissions
2. **Validation**: Validate user input in middleware
3. **Sandboxing**: Use Plugin API instead of global access
4. **Review**: Review third-party mods before installation
5. **Testing**: Test hot-reload and cleanup thoroughly

## Best Practices

1. **Use Plugin API**: Prefer `ctx.api` over direct access
2. **Register components**: Use Component Registry instead of DOM manipulation
3. **Add metadata**: Use `card.metadata` for plugin data
4. **Handle errors**: Wrap async operations in try/catch
5. **Document permissions**: Explain why permissions are needed
6. **Test cleanup**: Ensure resources are freed on disable
7. **Version appropriately**: Follow semver for updates

## Support

- Check [API documentation](./api/)
- See [examples](../sample-mods/new-api/)
- Ask in [GitHub Issues](https://github.com/jxburros/CardSpoke/issues)

---

**Current Plugin System:** This is the only supported plugin API. The modern Plugin API, Middleware Pipeline, and Component Registry provide powerful extensibility with better resource management and security.
