# Migration Guide: Legacy Mods to New Architecture

**Version:** 0.16.0

This guide helps you migrate existing mods from the legacy `CardSpoke_MODS` system to the new Plugin API, Middleware Pipeline, and Component Registry.

## Overview of Changes

| Old System | New System | Benefits |
|------------|------------|----------|
| `CardSpoke_MODS.register()` | `CardSpoke.Plugin.register()` | Sandboxed contexts, resource tracking |
| `runModHook()` | Middleware Pipeline | Interceptors, operation control |
| CSS/JS injection | Component Registry | Type-safe, priority-based resolution |
| Global access | Plugin API | Isolated storage, permission system |

## Compatibility

**Good News:** Existing mods continue to work! A compatibility bridge translates legacy hooks to the new middleware system.

However, migrating to the new API provides:
- Better resource management
- Cleaner unloading
- Type safety with TypeScript
- Permission-based security
- More powerful interception

## Migration Steps

### 1. Update Manifest

**Before:**
```javascript
{
  "id": "my-mod",
  "manifest": {
    "name": "My Mod",
    "version": "1.0.0",
    "author": "Author",
    "layer": "feature"
  }
}
```

**After:**
```javascript
export default {
  manifest: {
    name: "My Mod",
    version: "1.0.0",
    author: "Author",
    layer: "feature",
    permissions: ["ui-override", "storage"]  // NEW
  }
}
```

### 2. Convert Hook Registration

**Before:**
```javascript
CardSpoke_MODS.register('my-mod', {
  onLoad(ctx) {
    ctx.logger.log('Loaded');
  },
  
  onCardSave(ctx, card, saveInfo) {
    ctx.logger.log('Card saved:', card.id);
  }
});
```

**After (Option 1: Plugin API):**
```javascript
window.CardSpoke.Plugin.register('my-mod', {
  manifest: { /* ... */ },
  
  setup: async (ctx) => {
    ctx.logger.log('Loaded');
    
    // Listen for card updates
    ctx.api.data.onUpdate((event) => {
      if (event.type === 'update' || event.type === 'create') {
        ctx.logger.log('Card saved:', event.cardId);
      }
    });
  }
});
```

**After (Option 2: Middleware):**
```javascript
window.CardSpoke.Middleware.register({
  name: 'my-mod-card-save',
  priority: 0,
  operations: ['card.save'],
  handler: async (ctx, next) => {
    const card = ctx.args[0];
    console.log('Card saved:', card.id);
    await next();
  }
});
```

### 3. Convert DOM Manipulation

**Before:**
```javascript
onCardRender(ctx, card, element) {
  const badge = document.createElement('span');
  badge.textContent = 'Custom';
  element.appendChild(badge);
}
```

**After (Plugin API):**
```javascript
setup: async (ctx) => {
  ctx.api.data.onUpdate((event) => {
    if (event.type === 'update') {
      const cardEl = document.querySelector(`[data-card-id="${event.cardId}"]`);
      if (cardEl) {
        const badge = document.createElement('span');
        badge.textContent = 'Custom';
        ctx.api.ui.inject(`[data-card-id="${event.cardId}"]`, badge, 'append');
      }
    }
  });
}
```

**After (Component Registry):**
```javascript
setup: async (ctx) => {
  const OriginalCard = window.CardSpoke.ComponentRegistry.get('Card');
  
  ctx.api.ui.registerComponent('Card', {
    render: (props) => {
      const cardEl = OriginalCard.render(props);
      
      const badge = document.createElement('span');
      badge.textContent = 'Custom';
      cardEl.appendChild(badge);
      
      return cardEl;
    },
    priority: 10
  });
}
```

### 4. Convert Data Access

**Before:**
```javascript
const card = storeAPI.getCard('card-123');
storeAPI.updateCard('card-123', { title: 'New Title' });
```

**After:**
```javascript
const card = ctx.api.data.getCard('card-123');
ctx.api.data.updateCard('card-123', { title: 'New Title' });
```

### 5. Convert Storage

**Before:**
```javascript
const value = storeAPI.getModConfig();
storeAPI.setModConfig('key', 'value');
```

**After:**
```javascript
const value = await ctx.api.storage.get('key');
await ctx.api.storage.set('key', 'value');
```

Note: New storage is namespaced automatically (`plugin_my-mod_key`).

### 6. Add Teardown

**Before:**
```javascript
CardSpoke_MODS.register('my-mod', {
  onUninstall(ctx) {
    // Manual cleanup
  }
});
```

**After:**
```javascript
window.CardSpoke.Plugin.register('my-mod', {
  setup: async (ctx) => { /* ... */ },
  
  teardown: async (ctx) => {
    // Automatic resource cleanup
    // Only needed for custom cleanup
    ctx.logger.log('Cleaning up');
  }
});
```

## Complete Example

### Legacy Mod

```javascript
{
  "id": "card-counter",
  "manifest": {
    "name": "Card Counter",
    "version": "1.0.0",
    "author": "Example",
    "layer": "feature"
  },
  "js": `
    CardSpoke_MODS.register('card-counter', {
      onLoad(ctx) {
        const cards = storeAPI.listCards();
        const counter = document.createElement('div');
        counter.textContent = 'Cards: ' + cards.length;
        document.querySelector('#sidebar').appendChild(counter);
      },
      
      onCardSave(ctx, card) {
        const counter = document.querySelector('#card-counter');
        if (counter) {
          const cards = storeAPI.listCards();
          counter.textContent = 'Cards: ' + cards.length;
        }
      }
    });
  `,
  "css": "#card-counter { padding: 1rem; }"
}
```

### Migrated Mod

```javascript
export default {
  manifest: {
    name: "Card Counter",
    version: "1.0.0",
    author: "Example",
    layer: "feature",
    permissions: ["ui-override"]
  },
  
  setup: async (ctx) => {
    // Create counter element
    const counter = document.createElement('div');
    counter.id = 'card-counter';
    
    const updateCount = () => {
      const cards = ctx.api.data.listCards();
      counter.textContent = `Cards: ${cards.length}`;
    };
    
    updateCount();
    
    // Inject into sidebar
    ctx.api.ui.inject('#sidebar', counter, 'append');
    
    // Listen for updates
    ctx.api.data.onUpdate(updateCount);
  },
  
  teardown: async (ctx) => {
    // Automatic cleanup
  },
  
  css: `
    #card-counter {
      padding: 1rem;
      font-weight: bold;
      color: var(--accent);
    }
  `
};
```

## Hook to Middleware Mapping

| Legacy Hook | Middleware Operation | Notes |
|------------|---------------------|-------|
| `onLoad` | Use `setup()` | Lifecycle change |
| `onEnable` | Use `setup()` | Lifecycle change |
| `onDisable` | Use `teardown()` | Lifecycle change |
| `onUninstall` | Use `teardown()` | Lifecycle change |
| `onCardSave` | `card.save` | Middleware or data.onUpdate |
| `onCardDelete` | `card.delete` | Middleware or data.onUpdate |
| `onCardRender` | `card.render` | Use Component Registry |
| `onNavigate` | `navigation.change` | Middleware |
| `onSearch` | `search.execute` | Middleware |
| `onExport` | `data.export` | Middleware |
| `onImport` | `data.import` | Middleware |
| `onThemeChange` | `theme.change` | Middleware |
| `onTypographyChange` | `typography.change` | Middleware |
| `onHighContrastChange` | `contrast.change` | Middleware |

## ES Module Format

New mods can be loaded as ES modules:

```javascript
// my-mod.js
export default {
  manifest: { /* ... */ },
  setup: async (ctx) => { /* ... */ }
};

// Or named export
export const manifest = { /* ... */ };
export async function setup(ctx) { /* ... */ }
```

Load with:

```javascript
// Dynamic import
const mod = await import('./my-mod.js');
window.CardSpoke.Plugin.register('my-mod', mod.default || mod);
await window.CardSpoke.Plugin.enable('my-mod');

// Or use ModLoader
await window.CardSpoke.ModLoader.loadFromURL('https://example.com/my-mod.js');
```

## TypeScript Support

```typescript
import type { PluginDefinition, PluginContext } from '@cardspoke/core';

const plugin: PluginDefinition = {
  manifest: {
    name: "My Mod",
    version: "1.0.0",
    author: "Example",
    layer: "feature",
    permissions: ["ui-override"]
  },
  
  setup: async (ctx: PluginContext) => {
    // TypeScript knows the API shape
    const cards = ctx.api.data.listCards();
    ctx.api.ui.showToast('Loaded!', 'success');
  }
};

export default plugin;
```

## Testing Your Migration

1. **Install alongside legacy mod**: Test in parallel
2. **Check resource cleanup**: Disable and verify no ghosts
3. **Test permissions**: Ensure prompts work
4. **Verify storage**: Check namespaced keys
5. **Test hot reload**: Enable/disable multiple times

## Common Pitfalls

### 1. Forgetting async/await

```javascript
// Wrong
setup: (ctx) => {
  ctx.api.storage.get('key'); // Missing await!
}

// Right
setup: async (ctx) => {
  const value = await ctx.api.storage.get('key');
}
```

### 2. Not using ctx.api for DOM

```javascript
// Wrong (no tracking)
document.querySelector('#sidebar').appendChild(el);

// Right (tracked)
ctx.api.ui.inject('#sidebar', el, 'append');
```

### 3. Missing permissions

```javascript
// Will fail silently
manifest: {
  // Missing: permissions: ["ui-override"]
}
```

### 4. Not calling next() in middleware

```javascript
// Wrong - breaks pipeline
handler: async (ctx, next) => {
  console.log('Before');
  // Missing: await next();
}

// Right
handler: async (ctx, next) => {
  console.log('Before');
  await next();
  console.log('After');
}
```

## Getting Help

- Check [Plugin API docs](../api/PLUGIN_API.md)
- See [example mods](../../sample-mods/new-api/)
- Review [Middleware guide](../api/MIDDLEWARE_PIPELINE.md)
- Ask in GitHub Issues

## Backward Compatibility

The compatibility bridge ensures:
- Legacy `CardSpoke_MODS.register()` still works
- Existing hooks are translated to middleware
- Old mods load alongside new plugins
- No breaking changes for users

You can migrate gradually - no rush!
