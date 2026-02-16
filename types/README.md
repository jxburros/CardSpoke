# @cardspoke/core

TypeScript type definitions for CardSpoke plugin development.

## Installation

```bash
npm install @cardspoke/core
```

## Usage

### TypeScript

```typescript
import type { 
  PluginDefinition, 
  PluginContext,
  Card,
  ModManifest 
} from '@cardspoke/core';

const plugin: PluginDefinition = {
  manifest: {
    name: "My Plugin",
    version: "1.0.0",
    author: "Author",
    layer: "feature",
    permissions: ["ui-override"]
  },
  
  setup: async (ctx: PluginContext) => {
    // TypeScript provides full type checking
    const cards = ctx.api.data.listCards();
    ctx.api.ui.showToast('Loaded!', 'success');
  }
};

export default plugin;
```

### JavaScript (with JSDoc)

```javascript
/**
 * @type {import('@cardspoke/core').PluginDefinition}
 */
const plugin = {
  manifest: {
    name: "My Plugin",
    version: "1.0.0",
    author: "Author",
    layer: "feature"
  },
  
  setup: async (ctx) => {
    // ctx has type hints in VS Code
    const cards = ctx.api.data.listCards();
  }
};

export default plugin;
```

## Available Types

### Core Types
- `Card` - Card data structure
- `Store` - Application store
- `ModManifest` - Plugin manifest
- `ModPackage` - Legacy mod package
- `PermissionType` - Available permissions

### Plugin Types
- `PluginDefinition` - Plugin definition
- `PluginContext` - Plugin execution context
- `PluginAPI` - Sandboxed API object
- `PluginInstance` - Running plugin instance

### API Types
- `UIApi` - UI manipulation API
- `DataApi` - Data access API
- `StorageApi` - Persistent storage API
- `EventApi` - Event system API

### Middleware Types
- `Middleware` - Middleware definition
- `MiddlewareContext` - Middleware execution context
- `MiddlewareFunction` - Middleware handler function

### Component Types
- `Component` - UI component definition
- `ComponentRegistryClass` - Component registry manager

### Storage Types
- `StorageDriver` - Storage driver interface
- `StorageDriverRegistryClass` - Driver registry manager

### Utility Types
- `Logger` - Scoped logger
- `PluginUtils` - Utility functions
- `NavigationState` - Navigation state

## Documentation

See the [CardSpoke documentation](https://github.com/jxburros/CardSpoke/blob/main/docs/) for:

- [Plugin API Guide](https://github.com/jxburros/CardSpoke/blob/main/docs/api/PLUGIN_API.md)
- [Middleware Pipeline](https://github.com/jxburros/CardSpoke/blob/main/docs/api/MIDDLEWARE_PIPELINE.md)
- [Component Registry](https://github.com/jxburros/CardSpoke/blob/main/docs/api/COMPONENT_REGISTRY.md)
- [Migration Guide](https://github.com/jxburros/CardSpoke/blob/main/docs/guides/MIGRATION_GUIDE.md)

## License

ISC
