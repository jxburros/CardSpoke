# CardSpoke Mod System

This document describes the modern plugin-based mod system that powers CardSpoke's extensibility. Mods can range from simple visual themes to full app-layer transformations.

**Current Version:** 0.16.0 | **Schema Version:** 4 | **Release Date:** 2025-11-30

## Overview

The mod system has been modernized with a new architecture featuring:

- **Middleware Pipeline**: Priority-weighted interceptors for core operations
- **Plugin API**: Sandboxed contexts with resource management and hot-unloading
- **Component Registry**: Type-safe UI component overrides
- **Storage Driver Registry**: Pluggable storage backends
- **Permissions System**: User consent for sensitive operations

### Legacy Support

**Existing mods continue to work!** A compatibility bridge ensures backward compatibility with the legacy `CardSpoke_MODS` system. See the [Migration Guide](./guides/MIGRATION_GUIDE.md) to adopt the new API.

### Architecture Components

1. **Middleware Pipeline**: Replace hooks with interceptors that can modify or cancel operations
2. **Plugin API**: Isolated contexts with `api.ui`, `api.data`, `api.storage`, and `api.events`
3. **Component Registry**: Register UI components with priority-based resolution
4. **Storage Drivers**: Pluggable storage backends (IndexedDB, cloud, git, etc.)
5. **Permissions**: Explicit permission requests with user consent dialogs

## Mod Package Format

### Modern Plugin Format (Recommended)

**Choose your format based on your use case:**
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
    compatibility: ">=0.16.0",
    permissions: ["ui-override", "storage"]  // NEW
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
    compatibility: ">=0.16.0",
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

### Legacy JSON Format (Still Supported)

```json
{
  "id": "my-mod",
  "manifest": {
    "name": "My Mod",
    "version": "1.0.0",
    "author": "Author Name",
    "description": "What this mod does",
    "layer": "theme | feature | app",
    "compatibility": ">=0.16.0"
  },
  "config": {},
  "css": "",
  "js": "",
  "overrides": {},
  "enabled": false
}
```

### Required Fields
- **id**: Lowercase alphanumeric with hyphens (`/^[a-z0-9-]+$/`).
- **manifest.name**: Human-readable display name.
- **manifest.version**: Semver string (`X.Y.Z`).
- **manifest.author**: Creator name.
- **manifest.layer**: One of `theme`, `feature`, or `app`.

### Optional Fields
- **manifest.description**: Short description of the mod.
- **manifest.compatibility**: Semver range for app version compatibility.
- **config**: Object of user-configurable settings (arbitrary key/value pairs).
- **css**: CSS string injected into the page when the mod is enabled.
- **js**: JavaScript string executed when the mod is enabled (not allowed for `theme` layer).
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

## Lifecycle Hooks

Mods register hooks via `CardSpoke_MODS.register()`. The runtime dispatches hooks to enabled mods.

| Hook | When it fires | Common uses |
|------|---------------|-------------|
| `onLoad(ctx)` | On enable or after sync at startup | Allocate resources, register listeners, seed state. |
| `onEnable(ctx)` | After a mod is enabled | Re-attach DOM, rebind hotkeys. |
| `onDisable(ctx)` | Before disabling a mod | Tear down DOM/listeners, flush timers. |
| `onUninstall(ctx)` | Before removal from registry | Purge storage, remove injected styles. |
| `onCardSave(ctx, card, saveInfo)` | After create/update/duplicate | Derive fields, enforce validation. |
| `onCardDelete(ctx, card)` | Before a card is removed | Guard deletes, cascade clean-up. |
| `onCardRender(ctx, card, element)` | After a card's DOM renders | Inject UI, annotate content. |
| `onThemeChange(ctx, theme)` | When the app theme toggles | Sync theme variables. |
| `onTypographyChange(ctx, preset)` | When typography preset changes | Recalculate sizes/spacing. |
| `onHighContrastChange(ctx, enabled)` | When high-contrast flips | Adjust palette for accessibility. |
| `onNavigate(ctx, navState)` | When navigation state changes | Mirror router state, lazy-load. |
| `onSearch(ctx, query, results)` | After search completes | Rank boosters, filter results. |
| `onExport(ctx, data)` | Before data export | Append metadata, transform payloads. |
| `onImport(ctx, info)` | After data import | Normalize incoming data. |
| `onRender(ctx)` | After app UI re-renders | Update custom UI components, refresh visualizations. |
| `onPageChange(ctx, page)` | When the active page/view changes | Load page-specific data, initialize page components. |
| `onAppInit(ctx)` | Once at app initialization after boot | Initialize global state, register app-wide services. |

### Hook Context Object
Each hook receives a context with:
- `modId`: The current mod's ID.
- `appVersion` / `schemaVersion`: App release and schema numbers.
- `api`: Store API for card CRUD, navigation, UI feedback.
- `utils`: Reference to `CardSpoke.utils`.
- `logger`: Mod-scoped logger (`log`, `info`, `warn`, `error`).

## Registration Example

```javascript
CardSpoke_MODS.register('my-feature', {
  onLoad(ctx) {
    ctx.logger.info('My feature loaded');
  },
  onCardRender(ctx, card, element) {
    const badge = document.createElement('span');
    badge.textContent = card.tags.length + ' tags';
    element.appendChild(badge);
  },
  onDisable(ctx) {
    ctx.logger.info('My feature disabled');
  }
});
```

## Mod Manager UI

The Mod Manager is accessible from the main menu and has three tabs:

1. **Installed**: Lists all installed mods with enable/disable toggles, risk badges, and uninstall buttons.
2. **Install**: Upload a mod JSON file or load from URL.
3. **Create**: Build a mod directly in the app by providing metadata, JavaScript, and CSS.

## Installation Methods

### File Upload
Upload a `.json` file through the Upload modal (Mods tab) or the Mod Manager's Install tab.

### Manual Creation
Use the Create tab in the Mod Manager or the Upload modal's Mods tab to enter mod metadata, JavaScript code, and CSS directly.

### Programmatic
```javascript
CardSpoke_MODS.install(modPackage);
```

## Safe Mode

Launch with `?safemode` in the URL to disable all mods. This is useful for troubleshooting when a mod causes issues. In safe mode, the app displays a "Mods Disabled" banner and no mod code executes.

## Legacy Migration

Mods using the old `meta.type` format (Theme, Patch, Plugin, Mod, Kit, Expansion) are automatically migrated to the new `manifest.layer` format on load:
- `Theme` → `theme`
- `Patch`, `Plugin` → `feature`
- `Mod`, `Kit`, `Expansion` → `app`

## Validation Rules

`validateModPackage()` enforces:
1. `id` must be a non-empty string matching `/^[a-z0-9-]+$/`.
2. `manifest` must exist with `name`, `version`, `author`, and `layer`.
3. `manifest.layer` must be one of `theme`, `feature`, or `app`.
4. Theme-layer mods must have empty or no `js` field.
5. `overrides` are only meaningful for `app`-layer mods.

## Event Bus

Mods can communicate via `CardSpoke_MODS.events`:
- `on(event, callback)`: Subscribe to an event.
- `off(event, callback)`: Unsubscribe.
- `emit(event, data)`: Broadcast an event.
- `clear(event?)`: Remove listeners.

## Developer Tools

`CardSpoke_MODS.devTools` provides:
- `inspectMod(id)` / `listAllMods()`: View hooks, metadata, and state.
- `getHookStats(modId?)`: Timing and failure counters.
- `getErrorLog()` / `clearErrorLog()`: Global mod error buffer.
- `testHook(modId, hookName, ...args)`: Invoke a hook manually.
- `getEventListeners()`: Per-event subscription counts.

## LocalStorage Keys
- `cardspoke_activeThemeMod`: ID of the active theme mod.
- Mod data is persisted in the `mods` field of the IndexedDB store.

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

## Migration from Legacy System

See the [Migration Guide](./guides/MIGRATION_GUIDE.md) for step-by-step instructions on converting legacy mods to the new API.

**Key changes:**
- `CardSpoke_MODS.register()` → `CardSpoke.Plugin.register()`
- Hooks → Middleware or Plugin API
- Direct DOM access → Component Registry
- Global storage → Namespaced plugin storage

## Examples

Complete examples are available in `sample-mods/new-api/`:

- **example-feature-mod.js**: Middleware, component registry, and data updates
- **example-app-mod.js**: App-level customization with storage drivers

## API Reference

Detailed documentation:

- [Plugin API](./api/PLUGIN_API.md)
- [Middleware Pipeline](./api/MIDDLEWARE_PIPELINE.md)
- [Component Registry](./api/COMPONENT_REGISTRY.md)
- [Migration Guide](./guides/MIGRATION_GUIDE.md)
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
- Read [Migration Guide](./guides/MIGRATION_GUIDE.md)

---

**Note:** The legacy hook-based system remains supported for backward compatibility but new mods should use the modern Plugin API for better resource management and security.
