# CardSpoke API Reference

**Version:** 0.14.0
**Last Updated:** 2025-11-30

This document provides comprehensive documentation for the `CardSpoke.utils` API and the `CardSpoke_MODS` extension system, which allow extension developers to interact with CardSpoke programmatically.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Card Management](#card-management)
3. [Tag Management](#tag-management)
4. [Search & Query](#search--query)
5. [UI & Notifications](#ui--notifications)
6. [Dataset Information](#dataset-information)
7. [Extension System](#extension-system)
8. [Extension Hooks](#extension-hooks)
9. [Event Bus](#event-bus)
10. [Developer Tools](#developer-tools)
11. [Error Handling](#error-handling)
12. [Examples](#examples)

---

## Getting Started

The CardSpoke API is available globally via `window.CardSpoke.utils`. All functions are designed to be safe, validated, and non-destructive to the core application.

```javascript
// Access the API
const api = window.CardSpoke.utils;

// Create a new card
const card = api.createCard('My Card Title', 'Card content goes here');
```

### Backward Compatibility

For legacy support, `window.CardSpoke.utils` is also available as an alias.

---

## Card Management

### createCard(title, body, parentId)

Creates a new card in the current dataset.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `title` | string | Yes | The card title |
| `body` | string | No | The card body content (default: empty string) |
| `parentId` | string\|null | No | Parent card ID, or null for root card |

**Returns:** `Object` - The created card object

**Example:**
```javascript
// Create a root card
const rootCard = CardSpoke.utils.createCard('Project Ideas', 'List of project ideas');

// Create a child card
const childCard = CardSpoke.utils.createCard('Idea 1', 'Build a todo app', rootCard.id);
```

---

### updateCard(cardId, updates)

Updates an existing card's properties.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cardId` | string | Yes | The ID of the card to update |
| `updates` | object | Yes | Object containing properties to update |

**Valid Update Properties:**
- `title` (string) - Card title
- `body` (string) - Card body content
- `tags` (array) - Array of tag strings
- `parentId` (string\|null) - New parent card ID

**Returns:** `Object` - The updated card object, or `null` if card not found

**Example:**
```javascript
const updated = CardSpoke.utils.updateCard('card-123', {
  title: 'Updated Title',
  body: 'New content',
  tags: ['important', 'review']
});
```

---

### getCard(cardId)

Retrieves a card by its ID.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cardId` | string | Yes | The ID of the card to retrieve |

**Returns:** `Object|null` - The card object, or `null` if not found

**Example:**
```javascript
const card = CardSpoke.utils.getCard('card-123');
if (card) {
  console.log('Card title:', card.title);
}
```

---

### searchCards(query)

Searches cards by title, body content, or tags.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | Search query string |

**Returns:** `Array` - Array of matching card objects

**Example:**
```javascript
const results = CardSpoke.utils.searchCards('project');
results.forEach(card => {
  console.log(card.title);
});
```

---

## Tag Management

### getTags(cardId)

Gets all tags for a specific card.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cardId` | string | Yes | The card ID |

**Returns:** `Array` - Array of tag strings

**Example:**
```javascript
const tags = CardSpoke.utils.getTags('card-123');
console.log('Tags:', tags.join(', '));
```

---

### addTag(cardId, tag)

Adds a tag to a card. Tags are automatically normalized (lowercase, trimmed).

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cardId` | string | Yes | The card ID |
| `tag` | string | Yes | Tag to add (# prefix optional) |

**Returns:** `boolean` - `true` if added, `false` if already exists or invalid

**Example:**
```javascript
CardSpoke.utils.addTag('card-123', 'important');
CardSpoke.utils.addTag('card-123', '#urgent'); // # is stripped
```

---

### removeTag(cardId, tag)

Removes a tag from a card.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cardId` | string | Yes | The card ID |
| `tag` | string | Yes | Tag to remove |

**Returns:** `boolean` - `true` if removed, `false` if not found

**Example:**
```javascript
CardSpoke.utils.removeTag('card-123', 'important');
```

---

### setTags(cardId, tags)

Replaces all tags on a card with a new set.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cardId` | string | Yes | The card ID |
| `tags` | array | Yes | Array of tag strings |

**Returns:** `boolean` - `true` if successful

**Example:**
```javascript
CardSpoke.utils.setTags('card-123', ['project', 'active', 'priority']);
```

---

### getAllTags()

Gets all unique tags used across all cards in the current dataset.

**Returns:** `Array` - Array of unique tag strings, sorted alphabetically

**Example:**
```javascript
const allTags = CardSpoke.utils.getAllTags();
console.log('Available tags:', allTags);
```

---

## Search & Query

### searchCards(query)

Performs fuzzy search across card titles, bodies, and tags.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | Search query |

**Returns:** `Array` - Matching cards sorted by relevance

**Example:**
```javascript
const results = CardSpoke.utils.searchCards('project plan');
```

---

## UI & Notifications

### showToast(message, type)

Displays a toast notification to the user.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `message` | string | Yes | Message to display |
| `type` | string | No | Type: 'info' (default), 'success', 'warning', 'error' |

**Example:**
```javascript
CardSpoke.utils.showToast('Card created successfully!', 'success');
CardSpoke.utils.showToast('Something went wrong', 'error');
```

---

## Accessibility API (v0.13.1+)

### getAccessibilitySettings()

Gets current accessibility settings.

**Returns:** `Object` - Settings object with theme, typography, highContrast, reducedMotion

**Example:**
```javascript
const settings = await CardSpoke.utils.getAccessibilitySettings();
console.log('Current theme:', settings.theme);
```

---

### setTheme(theme)

Changes the color theme.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `theme` | string | Yes | 'light' or 'dark' |

**Example:**
```javascript
await CardSpoke.utils.setTheme('dark');
```

---

### setTypography(preset)

Changes the typography preset.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `preset` | string | Yes | 'default', 'comfortable', 'compact', or 'dyslexia' |

**Example:**
```javascript
await CardSpoke.utils.setTypography('comfortable');
```

---

### setHighContrast(enabled)

Toggles high contrast mode.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `enabled` | boolean | Yes | true to enable, false to disable |

**Example:**
```javascript
await CardSpoke.utils.setHighContrast(true);
```

---

## Dataset Information

### getDatasetMeta()

Gets metadata about the current dataset.

**Returns:** `Object` - Dataset metadata including name, card count, storage type

**Example:**
```javascript
const meta = CardSpoke.utils.getDatasetMeta();
console.log('Dataset:', meta.name);
console.log('Cards:', meta.cardCount);
```

---

## Extension System

The `CardSpoke_MODS` object provides the core extension system API.

### register(modId, definition)

Registers an extension with hooks and metadata.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `modId` | string | Yes | Unique extension identifier |
| `definition` | object | Yes | Extension definition with hooks and meta |

**Example:**
```javascript
CardSpoke_MODS.register('my-extension', {
  meta: {
    name: 'My Extension',
    type: 'Plugin',
    version: '1.0.0'
  },
  onAppInit(ctx) {
    console.log('Extension loaded!');
  },
  onCardSave(ctx, card, saveInfo) {
    console.log('Card saved:', card.id);
  }
});
```

**Hook Validation (v0.14.0):** Unknown hook names will trigger a console warning listing valid hooks.

---

### enable(modId)

Enables a previously disabled extension.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `modId` | string | Yes | Extension identifier |

**Returns:** `boolean` - true if successful

**Hooks Called:** `onEnable`, `onAppInit`

---

### disable(modId)

Disables an extension without uninstalling it.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `modId` | string | Yes | Extension identifier |

**Returns:** `boolean` - true if successful

**Hooks Called:** `onDisable`

---

### unregister(modId)

Completely removes an extension.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `modId` | string | Yes | Extension identifier |

**Hooks Called:** `onUninstall`

---

### reload(modId)

**NEW in v0.14.0** - Hot reloads an extension without page refresh.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `modId` | string | Yes | Extension identifier |

**Returns:** `boolean` - true if successful

**Example:**
```javascript
// Reload extension after code changes
CardSpoke_MODS.reload('my-extension');
```

---

### listMods()

Returns list of all installed extensions.

**Returns:** `Array<Object>` - Array of extension info objects

**Example:**
```javascript
const mods = CardSpoke_MODS.listMods();
mods.forEach(mod => {
  console.log(`${mod.id}: ${mod.enabled ? 'enabled' : 'disabled'}`);
});
```

---

## Extension Hooks

All hooks receive a context object as the first parameter and support both sync and async implementations.

### Context Object

```javascript
{
  modId: string,           // Extension ID
  appVersion: string,      // App version
  schemaVersion: number,   // Schema version
  api: Object,            // Store API
  utils: Object,          // CardSpoke.utils
  logger: Object          // Extension logger
}
```

### Available Hooks

| Hook | Parameters | When Called | Async Support |
|------|------------|-------------|---------------|
| `onAppInit` | `(ctx)` | Extension initialization | ✓ |
| `onEnable` | `(ctx)` | Extension enabled | ✓ |
| `onDisable` | `(ctx)` | Extension disabled (cleanup) | ✓ |
| `onUninstall` | `(ctx)` | Before uninstall (final cleanup) | ✓ |
| `onCardSave` | `(ctx, card, saveInfo)` | Card created/updated | ✓ |
| `onCardDelete` | `(ctx, card)` | Card deleted | ✓ |
| `onCardRender` | `(ctx, card, element)` | Card rendered to DOM | ✓ |
| `onThemeChange` | `(ctx, theme)` | Theme toggled | ✓ |
| `onTypographyChange` | `(ctx, preset)` | Typography changed | ✓ |
| `onHighContrastChange` | `(ctx, enabled)` | High contrast toggled | ✓ |
| `onExport` | `(ctx, data)` | Before export | ✓ |
| `onImport` | `(ctx, info)` | After import | ✓ |

### Lifecycle Hooks (NEW in v0.14.0)

```javascript
CardSpoke_MODS.register('timer-plugin', {
  interval: null,

  onEnable(ctx) {
    // Called when extension is enabled
    this.interval = setInterval(() => {
      console.log('tick');
    }, 1000);
  },

  onDisable(ctx) {
    // Called when extension is disabled - cleanup resources
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  },

  onUninstall(ctx) {
    // Called before uninstall - final cleanup
    localStorage.removeItem('my-extension-data');
  }
});
```

### Async Hook Example

```javascript
CardSpoke_MODS.register('api-sync', {
  async onCardSave(ctx, card, saveInfo) {
    // Async operations are fully supported
    const response = await fetch('https://api.example.com/sync', {
      method: 'POST',
      body: JSON.stringify(card)
    });
    const data = await response.json();
    console.log('Synced:', data);
  }
});
```

---

## Event Bus

**NEW in v0.14.0** - Extensions can communicate with each other via the event bus.

### CardSpoke_MODS.events.on(eventName, callback)

Subscribe to an event.

**Example:**
```javascript
CardSpoke_MODS.events.on('theme:changed', (data) => {
  console.log('Theme changed to:', data.theme);
});
```

### CardSpoke_MODS.events.emit(eventName, data)

Emit an event to all subscribers.

**Example:**
```javascript
CardSpoke_MODS.events.emit('export:complete', {
  format: 'json',
  itemCount: 42
});
```

### CardSpoke_MODS.events.off(eventName, callback)

Unsubscribe from an event.

### CardSpoke_MODS.events.clear(eventName)

Clear all listeners for an event (or all events if no name provided).

---

## Developer Tools

**NEW in v0.14.0** - Debugging and inspection tools for extension development.

### CardSpoke_MODS.devTools.inspectMod(modId)

Get detailed information about an extension.

**Returns:**
```javascript
{
  id: string,
  hooks: string[],        // List of registered hooks
  meta: Object,           // Extension metadata
  loaded: boolean,        // Successfully loaded
  initialized: boolean,   // onAppInit has run
  error: any,            // Load error if any
  errorCount: number,     // Consecutive error count
  enabled: boolean        // Currently enabled
}
```

**Example:**
```javascript
const info = CardSpoke_MODS.devTools.inspectMod('my-extension');
console.log('Registered hooks:', info.hooks);
console.log('Error count:', info.errorCount);
```

---

### CardSpoke_MODS.devTools.getHookStats(modId)

Get performance statistics for hooks.

**Returns:**
```javascript
{
  "extension-id.hookName": {
    modId: string,
    hookName: string,
    executions: number,    // Total executions
    failures: number,      // Failed executions
    totalDuration: number, // Total time (ms)
    avgDuration: number,   // Average time (ms)
    maxDuration: number,   // Slowest execution (ms)
    minDuration: number    // Fastest execution (ms)
  }
}
```

**Example:**
```javascript
// Get stats for specific extension
const stats = CardSpoke_MODS.devTools.getHookStats('my-extension');

// Get stats for all extensions
const allStats = CardSpoke_MODS.devTools.getHookStats();
console.log('Slowest hook:', Object.entries(allStats)
  .sort((a, b) => b[1].maxDuration - a[1].maxDuration)[0]);
```

---

### CardSpoke_MODS.devTools.getErrorLog()

Get log of all extension errors.

**Returns:** `Array<Object>` - Error log entries

```javascript
const errors = CardSpoke_MODS.devTools.getErrorLog();
errors.forEach(err => {
  console.log(`${err.modId}.${err.hookName}: ${err.error}`);
  console.log('Stack:', err.stack);
});
```

---

### CardSpoke_MODS.devTools.testHook(modId, hookName, ...args)

Manually trigger a hook for testing.

**Example:**
```javascript
// Test the onCardSave hook
CardSpoke_MODS.devTools.testHook('my-extension', 'onCardSave',
  mockCard, { isNew: true });
```

---

## Error Handling

All API functions include input validation and error handling. Invalid inputs will:
- Return appropriate default values (`null`, `false`, empty arrays)
- Log errors to the console
- Never throw exceptions that could crash extensions

### Automatic Error Handling (v0.14.0)

Extensions that encounter errors are handled automatically:

1. **Error Logging**: Full stack traces logged to console
2. **Error Tracking**: `window._extErrors` array maintains error history
3. **Auto-Disable**: After 3 consecutive errors, extension is automatically disabled
4. **User Notification**: Toast notifications show error details

**Example:**
```javascript
CardSpoke_MODS.register('buggy-extension', {
  onCardSave(ctx, card) {
    // This will trigger error handling
    throw new Error('Oops!');
    // After 3 errors, extension will be auto-disabled
  }
});

// View error log
console.log(CardSpoke_MODS.devTools.getErrorLog());
```

**Best Practices:**
```javascript
// Always check return values
const card = CardSpoke.utils.getCard(cardId);
if (!card) {
  CardSpoke.utils.showToast('Card not found', 'error');
  return;
}

// Validate before operations
if (cardId && typeof cardId === 'string') {
  CardSpoke.utils.updateCard(cardId, updates);
}

// Cleanup in onDisable hook
CardSpoke_MODS.register('my-extension', {
  timers: [],

  onEnable(ctx) {
    this.timers.push(setInterval(() => {}, 1000));
  },

  onDisable(ctx) {
    // Clean up resources
    this.timers.forEach(t => clearInterval(t));
    this.timers = [];
  }
});
```

---

## Examples

### Complete Extension Example

```javascript
// Simple extension that adds a word count to card titles
(function() {
  'use strict';
  const api = window.CardSpoke.utils;
  
  // Register extension with CardSpoke
  CardSpoke_MODS.register('word-count-example', {
    meta: {
      name: 'Word Count Example',
      type: 'Plugin',
      version: '1.0.0',
      description: 'Shows word count in console when cards render'
    },
    onAppInit(ctx) {
      console.log('Word Count Extension loaded!');
      api.showToast('Word Count Extension loaded!', 'success');
    },
    onCardRender(ctx, card, element) {
      // Count words when a card is rendered
      if (card && card.body) {
        const wordCount = card.body.split(/\s+/).filter(w => w).length;
        console.log(`Card "${card.title}" has ${wordCount} words`);
      }
    }
  });
})();
```

### Batch Tag Operations

```javascript
// Add a tag to all cards matching a search
function tagSearchResults(query, tag) {
  const api = window.CardSpoke.utils;
  const results = api.searchCards(query);
  
  let count = 0;
  results.forEach(card => {
    if (api.addTag(card.id, tag)) {
      count++;
    }
  });
  
  api.showToast(`Tagged ${count} cards with #${tag}`, 'success');
}

// Usage
tagSearchResults('project', 'reviewed');
```

### Creating a Card Hierarchy

```javascript
// Create a project structure
function createProjectStructure(projectName) {
  const api = window.CardSpoke.utils;
  
  // Create root project card
  const project = api.createCard(projectName, 'Project overview');
  
  // Create standard sections
  const sections = ['Goals', 'Tasks', 'Notes', 'Resources'];
  sections.forEach(section => {
    api.createCard(section, '', project.id);
  });
  
  api.showToast(`Project "${projectName}" created!`, 'success');
  return project;
}
```

---

## Version History

| Version | Changes |
|---------|---------|
| 0.14.0 | Added lifecycle hooks (onEnable, onDisable, onUninstall), async hook support, event bus, developer tools, hot reload, enhanced error handling, hook validation, TypeScript definitions |
| 0.13.0 | Version sync and documentation refresh |
| 0.12.1 | API documentation created |
| 0.11.3 | Renamed from CardSpoke.utils to CardSpoke.utils |
| 0.11.1 | Initial API release |

---

*For more information, see the [AI Developer Guide](../AI_DEVELOPER_GUIDE.md) or [GitHub repository](https://github.com/jxburros/CardSpoke).*
