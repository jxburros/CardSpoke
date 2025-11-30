# CardSpoke API Reference

**Version:** 1.0.0
**Schema Version:** 4
**Last Updated:** 2025-11-30

This document provides comprehensive documentation for the `CardSpoke.utils` API and the `CardSpoke_MODS` extension system, which allow extension developers to interact with CardSpoke programmatically.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Card Management](#card-management)
3. [Tag Management](#tag-management)
4. [Accessibility & Theme API](#accessibility--theme-api)
5. [UI & Notifications](#ui--notifications)
6. [Dataset Information](#dataset-information)
7. [Extension System](#extension-system)
8. [Extension Hooks](#extension-hooks)
9. [Store API](#store-api)
10. [Event Bus](#event-bus)
11. [Developer Tools](#developer-tools)
12. [Error Handling](#error-handling)
13. [Examples](#examples)

---

## Getting Started

The CardSpoke API is available globally via `window.CardSpoke.utils`. All functions are designed to be safe, validated, and non-destructive to the core application.

```javascript
// Access the API
const api = window.CardSpoke.utils;

// Create a new card
const result = await api.createCard({
  title: 'My Card Title',
  body: 'Card content goes here'
});
```

### Backward Compatibility

For legacy support, the following aliases are available:
- `window.CIB.utils` → `window.CardSpoke.utils`
- `window.CIB_MODS` → `window.CardSpoke_MODS`

---

## Card Management

### createCard(data)

Creates a new card in the current dataset.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `data` | object | Yes | Card creation data |
| `data.title` | string | No | The card title (default: '') |
| `data.body` | string | No | The card body content (default: '') |
| `data.parentId` | string\|null | No | Parent card ID, or null for root card (default: null) |
| `data.tags` | string[] | No | Array of tags (default: []) |

**Returns:** `Promise<{id: string, card: Object}>`

**Example:**
```javascript
// Create a root card
const result = await CardSpoke.utils.createCard({
  title: 'Project Ideas',
  body: 'List of project ideas',
  tags: ['planning', 'ideas']
});

console.log('Created card:', result.id);

// Create a child card
const child = await CardSpoke.utils.createCard({
  title: 'Idea 1',
  body: 'Build a todo app',
  parentId: result.id
});
```

---

### updateCard(cardId, changes)

Updates an existing card's properties.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cardId` | string | Yes | The ID of the card to update |
| `changes` | object | Yes | Object containing properties to update |

**Valid Update Properties:**
- `title` (string) - Card title
- `body` (string) - Card body content
- `tags` (string[]) - Array of tag strings
- `parentId` (string\|null) - New parent card ID

**Returns:** `Promise<boolean>` - `true` if successful

**Example:**
```javascript
const success = await CardSpoke.utils.updateCard('card-123', {
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

**Returns:** `Promise<Object|null>` - The card object (cloned), or `null` if not found

**Example:**
```javascript
const card = await CardSpoke.utils.getCard('card-123');
if (card) {
  console.log('Card title:', card.title);
  console.log('Card body:', card.body);
  console.log('Tags:', card.tags);
}
```

---

### searchCards(query)

Searches cards by title, body content, or tags.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | Search query string (case-insensitive) |

**Search Behavior:**
- Searches card titles
- Searches card bodies
- Searches card tags
- Case-insensitive matching

**Returns:** `Promise<Array>` - Array of matching card objects (cloned)

**Example:**
```javascript
const results = await CardSpoke.utils.searchCards('project');
results.forEach(card => {
  console.log(card.title, '-', card.tags.join(', '));
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

**Returns:** `Promise<string[]>` - Array of tags, empty array if not found

**Example:**
```javascript
const tags = await CardSpoke.utils.getTags('card-123');
console.log('Tags:', tags);
```

---

### addTag(cardId, tag)

Adds a tag to a card.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cardId` | string | Yes | The card ID |
| `tag` | string | Yes | Tag to add |

**Tag Normalization:**
- Removes `#` prefix if present
- Converts to lowercase
- Trims whitespace
- Prevents duplicates (case-insensitive)

**Returns:** `Promise<boolean>` - `true` if tag added, `false` if already exists

**Example:**
```javascript
await CardSpoke.utils.addTag('card-123', 'important');
await CardSpoke.utils.addTag('card-123', '#urgent'); // # is removed
```

---

### removeTag(cardId, tag)

Removes a tag from a card.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cardId` | string | Yes | The card ID |
| `tag` | string | Yes | Tag to remove (case-insensitive) |

**Returns:** `Promise<boolean>` - `true` if removed, `false` if not found

**Example:**
```javascript
await CardSpoke.utils.removeTag('card-123', 'urgent');
```

---

### setTags(cardId, tags)

Replaces all tags for a card.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cardId` | string | Yes | The card ID |
| `tags` | string[] | Yes | Array of tags (replaces existing) |

**Behavior:**
- Replaces all existing tags
- Normalizes all tags (lowercase, trimmed)
- Removes duplicates automatically
- Filters out empty tags

**Returns:** `Promise<boolean>` - `true` if successful

**Example:**
```javascript
await CardSpoke.utils.setTags('card-123', ['work', 'urgent', 'review']);
```

---

### getAllTags()

Gets all unique tags across all cards.

**Parameters:** None

**Returns:** `Promise<string[]>` - Sorted array of all unique tags

**Example:**
```javascript
const allTags = await CardSpoke.utils.getAllTags();
console.log('Available tags:', allTags.join(', '));
```

---

## Accessibility & Theme API

### getAccessibilitySettings()

Gets current accessibility settings.

**Parameters:** None

**Returns:**
```javascript
Promise<{
  theme: 'light'|'dark',
  typography: string,      // 'default', 'comfortable', 'compact', 'dyslexia'
  highContrast: boolean,
  reducedMotion: boolean   // System preference
}>
```

**Example:**
```javascript
const settings = await CardSpoke.utils.getAccessibilitySettings();
console.log('Current theme:', settings.theme);
console.log('Typography:', settings.typography);
```

---

### setTheme(theme)

Sets the application theme.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `theme` | string | Yes | Theme to apply: 'light' or 'dark' |

**Returns:** `Promise<boolean>` - `true` if successful

**Triggers:** `onThemeChange` hook

**Example:**
```javascript
await CardSpoke.utils.setTheme('dark');
```

---

### getTheme()

Gets the current theme.

**Parameters:** None

**Returns:** `Promise<'light'|'dark'>` - Current theme (defaults to 'light')

**Example:**
```javascript
const theme = await CardSpoke.utils.getTheme();
console.log('Current theme:', theme);
```

---

### setTypography(preset)

Sets the typography preset.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `preset` | string | Yes | Typography preset to apply |

**Valid Presets:**
- `'default'` - Standard typography
- `'comfortable'` - Increased spacing and font size
- `'compact'` - Reduced spacing and font size
- `'dyslexia'` - Dyslexia-friendly font with increased letter/word spacing

**Returns:** `Promise<boolean>` - `true` if successful

**Triggers:** `onTypographyChange` hook

**Example:**
```javascript
await CardSpoke.utils.setTypography('comfortable');
```

---

### getTypography()

Gets the current typography preset.

**Parameters:** None

**Returns:** `Promise<string>` - Current typography preset (defaults to 'default')

---

### setHighContrast(enabled)

Enables or disables high contrast mode.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `enabled` | boolean | Yes | Enable or disable high contrast |

**Returns:** `Promise<boolean>` - `true` if successful

**Triggers:** `onHighContrastChange` hook

**Example:**
```javascript
await CardSpoke.utils.setHighContrast(true);
```

---

### isHighContrast()

Checks if high contrast mode is enabled.

**Parameters:** None

**Returns:** `Promise<boolean>` - `true` if enabled

---

### prefersReducedMotion()

Checks system reduced motion preference.

**Parameters:** None

**Returns:** `Promise<boolean>` - `true` if system prefers reduced motion

**Example:**
```javascript
const reducedMotion = await CardSpoke.utils.prefersReducedMotion();
if (reducedMotion) {
  // Disable animations
}
```

---

### onThemeChange(callback)

Listens for theme changes.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `callback` | function | Yes | Called when theme changes: `(theme) => void` |

**Returns:** `Function` - Unsubscribe function

**Example:**
```javascript
const unsub = CardSpoke.utils.onThemeChange((theme) => {
  console.log('Theme changed to:', theme);
  // Update extension UI
});

// Later: stop listening
unsub();
```

---

### getThemeVariables()

Gets available CSS custom properties for theming.

**Parameters:** None

**Returns:**
```javascript
Promise<{
  colors: string[],       // CSS variable names for colors
  typography: string[],   // CSS variable names for typography
  spacing: string[],      // CSS variable names for spacing
  accessibility: {
    typography: string[],
    highContrast: string[],
    focus: string[]
  }
}>
```

**Available CSS Variables:**

**Colors:**
- `--bg`, `--surface`, `--border`
- `--text`, `--text-medium`, `--text-muted`, `--text-ghost`

**Typography:**
- `--font`, `--font-brand`
- `--text-xs`, `--text-sm`, `--text-base`, `--text-lg`, `--text-xl`, `--text-2xl`, `--text-3xl`
- `--line-height`

**Spacing:**
- `--space-xs`, `--space-sm`, `--space-md`, `--space-lg`, `--space-xl`, `--space-2xl`, `--space-3xl`, `--space-4xl`
- `--radius`

**Accessibility - Typography:**
- `--typography-font-size-{preset}`
- `--typography-line-height-{preset}`
- `--typography-letter-spacing-dyslexia`
- `--typography-word-spacing-dyslexia`
- `--typography-font-dyslexia`

**Accessibility - High Contrast:**
- `--hc-bg`, `--hc-bg-secondary`, `--hc-bg-tertiary`
- `--hc-text`, `--hc-text-secondary`
- `--hc-border`, `--hc-accent`, `--hc-accent-hover`
- `--hc-border-width`, `--hc-button-border-width`, `--hc-card-border-width`

**Accessibility - Focus:**
- `--focus-outline-color`, `--focus-outline-width`, `--focus-outline-offset`, `--focus-outline-style`

**Example:**
```javascript
const vars = await CardSpoke.utils.getThemeVariables();
console.log('Color variables:', vars.colors);
console.log('Typography variables:', vars.typography);
```

---

## UI & Notifications

### showToast(message, type, duration)

Displays a toast notification.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `message` | string | Yes | Message to display |
| `type` | string | No | Toast type: 'success', 'info', 'warning', 'error' (default: 'info') |
| `duration` | number | No | Duration in milliseconds (default: 3000) |

**Returns:** `Promise<void>`

**Example:**
```javascript
await CardSpoke.utils.showToast('Operation successful!', 'success');
await CardSpoke.utils.showToast('Warning!', 'warning', 5000);
await CardSpoke.utils.showToast('Error occurred', 'error');
```

---

## Dataset Information

### getDatasetMeta()

Gets metadata about the current dataset.

**Parameters:** None

**Returns:**
```javascript
Promise<{
  name: string,           // Dataset/instance name
  cardCount: number,      // Total number of cards
  rootCardCount: number,  // Number of root-level cards
  bookmarkCount: number,  // Number of bookmarked cards
  recentCount: number,    // Number of recent cards
  modCount: number,       // Number of installed extensions
  schemaVersion: string,  // Data schema version
  appVersion: string      // Application version
}>
```

**Example:**
```javascript
const meta = await CardSpoke.utils.getDatasetMeta();
console.log(`Dataset: ${meta.name}`);
console.log(`Cards: ${meta.cardCount}, Mods: ${meta.modCount}`);
```

---

## Extension System

### CardSpoke_MODS.register(modId, definition)

Registers a new extension.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `modId` | string | Yes | Unique extension identifier |
| `definition` | object | Yes | Extension definition with hooks and metadata |

**Definition Structure:**
```javascript
{
  // Hook functions (all optional)
  onAppInit: (ctx) => {},
  onCardSave: (ctx, card, saveInfo) => {},
  onCardDelete: (ctx, card) => {},
  onCardRender: (ctx, card, element) => {},
  onNavigate: (ctx, navState) => {},
  onSearch: (ctx, query, results) => {},
  onThemeChange: (ctx, theme) => {},
  onTypographyChange: (ctx, preset) => {},
  onHighContrastChange: (ctx, enabled) => {},
  onExport: (ctx, exportData) => {},
  onImport: (ctx, importData) => {},
  onEnable: (ctx) => {},
  onDisable: (ctx) => {},
  onUninstall: (ctx) => {},

  // Metadata (optional)
  meta: {
    name: string,
    version: string,
    description: string,
    type: string,  // 'theme', 'patch', 'plugin', 'mod', 'kit', 'expansion'
    creator: string,
    source: string,  // 'official' or 'community'
    ai_assistants: string
  }
}
```

**Returns:** Object - Registered extension entry

**Example:**
```javascript
CardSpoke_MODS.register('my-extension', {
  meta: {
    name: 'My Extension',
    version: '1.0.0',
    type: 'plugin',
    creator: 'Your Name'
  },

  onAppInit(ctx) {
    ctx.logger.log('Extension initialized!');
  },

  onCardSave(ctx, card, saveInfo) {
    if (saveInfo.isNew) {
      ctx.logger.log('New card created:', card.title);
    }
  }
});
```

---

### CardSpoke_MODS.unregister(modId)

Unregisters and removes an extension.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `modId` | string | Yes | Extension ID to unregister |

**Lifecycle:**
1. Runs `onUninstall` hook
2. Removes from registry
3. Removes CSS styles
4. Removes from persistent storage
5. Saves data

**Example:**
```javascript
CardSpoke_MODS.unregister('my-extension');
```

---

### CardSpoke_MODS.enable(modId)

Enables a registered extension.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `modId` | string | Yes | Extension ID to enable |

**Returns:** `boolean` - `true` if successful

**Lifecycle:**
1. Sets enabled flag
2. Applies CSS styles
3. Ensures registration
4. Runs `onEnable` hook
5. Runs `onAppInit` hook

**Example:**
```javascript
CardSpoke_MODS.enable('my-extension');
```

---

### CardSpoke_MODS.disable(modId)

Disables a registered extension.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `modId` | string | Yes | Extension ID to disable |

**Returns:** `boolean` - `true` if successful

**Lifecycle:**
1. Runs `onDisable` hook
2. Sets disabled flag
3. Removes CSS styles
4. Clears initialized flag

**Example:**
```javascript
CardSpoke_MODS.disable('my-extension');
```

---

### CardSpoke_MODS.reload(modId)

Reloads an extension (disable then re-enable).

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `modId` | string | Yes | Extension ID to reload |

**Returns:** `boolean` - `true` if successful

---

### CardSpoke_MODS.runHook(hookName, ...args)

Runs a hook on all enabled extensions.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `hookName` | string | Yes | Hook name to run |
| `...args` | any[] | No | Arguments to pass to hook handlers |

**Returns:** `Promise<void>`

**Behavior:**
- Runs on all enabled extensions that have registered the hook
- Waits for all async hooks to complete
- Records execution statistics
- Handles errors gracefully

---

## Extension Hooks

### Available Hooks (14 Total)

All hooks receive a `context` object as the first parameter.

---

#### onAppInit(context)

Called when app initializes or extension is first loaded/enabled.

**Parameters:**
- `context` - Extension context object

**Use Cases:**
- One-time setup
- Register global handlers
- Initialize extension state

**Example:**
```javascript
onAppInit(ctx) {
  ctx.logger.log('Extension initialized');
  // Setup code here
}
```

---

#### onCardSave(context, card, saveInfo)

Called when a card is created or updated.

**Parameters:**
- `context` - Extension context
- `card` - Card data (cloned, read-only)
- `saveInfo` - Object with:
  - `isNew` (boolean) - true if newly created
  - `source` (string) - Source of save ('create', 'update', 'addTag', etc.)

**Example:**
```javascript
onCardSave(ctx, card, saveInfo) {
  if (saveInfo.isNew) {
    ctx.logger.log('New card:', card.title);
  } else {
    ctx.logger.log('Updated card:', card.title);
  }
}
```

---

#### onCardDelete(context, card)

Called when a card is deleted.

**Parameters:**
- `context` - Extension context
- `card` - Card data before deletion (cloned)

**Example:**
```javascript
onCardDelete(ctx, card) {
  ctx.logger.log('Deleted card:', card.title);
}
```

---

#### onCardRender(context, card, element)

Called after a card is rendered to the DOM.

**Parameters:**
- `context` - Extension context
- `card` - Card data (cloned)
- `element` - Card DOM element (can be modified)

**Use Cases:**
- Inject custom HTML
- Modify card appearance
- Add event listeners

**Example:**
```javascript
onCardRender(ctx, card, element) {
  if (card.tags.includes('urgent')) {
    const badge = document.createElement('span');
    badge.textContent = '🔥';
    element.querySelector('.card-title').appendChild(badge);
  }
}
```

---

#### onNavigate(context, navState)

Called when navigation state changes.

**Parameters:**
- `context` - Extension context
- `navState` - Object with:
  - `page` (string) - Current page/view
  - `cardId` (string|null) - Current card ID
  - `parentId` (string|null) - Parent card ID
  - `searchQuery` (string|null) - Search query if applicable

---

#### onSearch(context, query, results)

Called when search is performed.

**Parameters:**
- `context` - Extension context
- `query` (string) - Search query
- `results` (Array) - Array of matching cards

---

#### onThemeChange(context, theme)

Called when theme changes.

**Parameters:**
- `context` - Extension context
- `theme` (string) - New theme: 'light' or 'dark'

**Example:**
```javascript
onThemeChange(ctx, theme) {
  ctx.logger.log('Theme changed to:', theme);
  // Update extension UI for new theme
}
```

---

#### onTypographyChange(context, preset)

Called when typography preset changes.

**Parameters:**
- `context` - Extension context
- `preset` (string) - New preset: 'default', 'comfortable', 'compact', or 'dyslexia'

---

#### onHighContrastChange(context, enabled)

Called when high contrast mode is toggled.

**Parameters:**
- `context` - Extension context
- `enabled` (boolean) - Whether high contrast is now enabled

---

#### onExport(context, exportData)

Called before data export.

**Parameters:**
- `context` - Extension context
- `exportData` - Object with:
  - `type` (string) - Export type ('json', 'txt', 'markdown', 'csv', 'mods')
  - `payload` (any) - Data being exported
  - `payloadLength` (number) - Size of payload

---

#### onImport(context, importData)

Called after data import.

**Parameters:**
- `context` - Extension context
- `importData` - Object with:
  - `type` (string) - Import type
  - `cards` (string[]) - Array of imported card IDs
  - `mods` (string[]) - Array of imported mod IDs
  - `mode` (string) - Import mode
  - `location` (string) - Where imported

---

#### onEnable(context)

Called when extension is enabled.

**Parameters:**
- `context` - Extension context

---

#### onDisable(context)

Called when extension is disabled.

**Parameters:**
- `context` - Extension context

**Use Cases:**
- Cleanup
- Remove event listeners
- Save state

---

#### onUninstall(context)

Called before extension is uninstalled.

**Parameters:**
- `context` - Extension context

---

## Store API

The Store API is available via `context.api` in extension hooks.

### Methods

#### getAppInfo()
Returns app version and schema version.

#### getCard(id)
Returns cloned card object or undefined.

#### listCards()
Returns array of all cards (cloned).

#### listRootIds()
Returns array of root card IDs.

#### getNavState()
Returns current navigation state.

#### navigate(page, opts)
Navigate to a page.

#### goBack()
Navigate back in history.

#### showToast(message, type)
Show toast notification.

#### markDirty()
Mark data as needing save.

#### createCard(data)
Create new card, returns card ID.

#### updateCard(id, updates)
Update card, returns cloned card.

#### deleteCard(id)
Delete card, returns true.

#### Tag methods:
- `getTags(cardId)` - Get card's tags
- `addTag(cardId, tag)` - Add tag
- `removeTag(cardId, tag)` - Remove tag
- `setTags(cardId, tags)` - Set all tags
- `getAllTags()` - Get all unique tags

#### getDatasetMeta()
Returns dataset metadata.

---

## Event Bus

The event bus allows inter-extension communication.

### CardSpoke_MODS.events.on(eventName, callback)

Listen for custom events.

**Parameters:**
- `eventName` (string) - Event name
- `callback` (function) - Handler function

**Example:**
```javascript
CardSpoke_MODS.events.on('custom-event', (data) => {
  console.log('Event received:', data);
});
```

---

### CardSpoke_MODS.events.off(eventName, callback)

Stop listening for events.

---

### CardSpoke_MODS.events.emit(eventName, data)

Emit a custom event.

**Example:**
```javascript
CardSpoke_MODS.events.emit('custom-event', { foo: 'bar' });
```

---

### CardSpoke_MODS.events.clear(eventName)

Clear all listeners for an event (or all events if no name provided).

---

## Developer Tools

### CardSpoke_MODS.devTools.inspectMod(modId)

Get detailed information about an extension.

**Returns:** Object with extension details, hooks, and status

---

### CardSpoke_MODS.devTools.listAllMods()

Get information about all extensions.

**Returns:** Array of extension info objects

---

### CardSpoke_MODS.devTools.getHookStats(modId)

Get hook execution statistics.

**Parameters:**
- `modId` (string, optional) - Specific mod or all mods

**Returns:** Object with execution stats (executions, failures, duration, etc.)

---

### CardSpoke_MODS.devTools.getErrorLog()

Get error log entries.

**Returns:** Array of error objects

---

### CardSpoke_MODS.devTools.clearErrorLog()

Clear the error log.

---

### CardSpoke_MODS.devTools.testHook(modId, hookName, ...args)

Test a specific hook.

---

### CardSpoke_MODS.devTools.getEventListeners()

Get count of event listeners per event.

---

## Error Handling

### Auto-Disable on Errors

Extensions are automatically disabled after 3 consecutive errors:

1. Error occurs in hook execution
2. Error count incremented for extension
3. User shown error toast notification
4. Error logged to error log
5. If error count reaches 3, extension is disabled
6. User notified of auto-disable

### Error Recovery

Error counts are reset when:
- Hook executes successfully
- Extension is manually reloaded
- Extension is re-enabled after fixing

---

## Examples

### Complete Extension Example

```javascript
(function() {
  'use strict';

  const api = window.CardSpoke.utils;

  CardSpoke_MODS.register('word-counter', {
    meta: {
      name: 'Word Counter',
      version: '1.0.0',
      type: 'plugin',
      creator: 'Your Name',
      description: 'Adds word count to cards'
    },

    async onAppInit(ctx) {
      ctx.logger.log('Word Counter initialized');
    },

    async onCardRender(ctx, card, element) {
      const wordCount = card.body.split(/\s+/).filter(w => w).length;

      const badge = document.createElement('span');
      badge.className = 'word-count-badge';
      badge.textContent = `${wordCount} words`;
      badge.style.cssText = 'color: var(--text-muted); font-size: 12px;';

      const title = element.querySelector('.card-title');
      if (title) {
        title.appendChild(badge);
      }
    },

    async onThemeChange(ctx, theme) {
      ctx.logger.log('Theme changed to:', theme);
      // Update extension styles if needed
    }
  });
})();
```

---

## Context Object Structure

Every hook receives a `context` object with:

```javascript
{
  modId: string,          // Extension ID
  appVersion: string,     // App version
  schemaVersion: string,  // Schema version
  api: Object,            // Store API (direct data access)
  utils: Object,          // CardSpoke.utils reference
  logger: {               // Logging utilities
    log: Function,
    info: Function,
    warn: Function,
    error: Function
  }
}
```

---

**Document Version:** 2.0
**For:** CardSpoke 1.0.0+
**Schema:** v4
**Last Updated:** 2025-11-30
