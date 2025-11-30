# CardSpoke AI Developer Guide

**For AI Programming Assistants Working with CardSpoke**

This guide provides comprehensive instructions for AI developers to effectively work with the CardSpoke codebase. It covers architecture, patterns, conventions, and critical development workflows based solely on the existing code.

---

## Table of Contents

1. [Quick Overview](#quick-overview)
2. [Architecture & Design](#architecture--design)
3. [Critical Development Rules](#critical-development-rules)
4. [Codebase Organization](#codebase-organization)
5. [Data Model & Storage](#data-model--storage)
6. [Core Patterns](#core-patterns)
7. [Common Operations](#common-operations)
8. [Extension System](#extension-system)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)

---

## Quick Overview

### What is CardSpoke?

CardSpoke is a **lightweight, local-first knowledge management application** that:
- Runs entirely in the browser (no server required)
- Uses vanilla JavaScript (no heavy frameworks)
- Stores data locally using IndexedDB or LocalStorage
- Supports cross-platform deployment via Capacitor (Android, iOS)
- Provides a robust extension system for customization

### Key Stats

- **Main Application**: Single file (`www/app.js`) ~356 KB
- **Styling**: Single file (`www/styles.css`) ~54 KB
- **Lines of Code**: ~8,698 lines in app.js
- **Tests**: 188+ tests across 18 test files
- **Version**: 0.15.0 (app.js) / Schema v4
- **Build Process**: None required for web version

---

## Architecture & Design

### Technology Stack

```
Core: Vanilla JavaScript (ES6+)
UI: Custom HTML/CSS (no frameworks)
Storage: IndexedDB (primary) + LocalStorage (fallback)
Cross-Platform: Capacitor 7.4.4
Testing: uvu (lightweight test runner)
Build: npm scripts (only for native builds)
```

### Design Philosophy

1. **Local-First**: All data stored on device
2. **Zero Dependencies**: No external runtime libraries
3. **Privacy-Focused**: No tracking, analytics, or data transmission
4. **Extensible**: Rich API for community-driven features
5. **Lightweight**: Single-file architecture
6. **Well-Tested**: Comprehensive test coverage

### Application Flow

```
1. Load index.html
   ↓
2. Load capacitor.js (platform detection)
   ↓
3. Execute app.js (IIFE wraps entire application)
   ↓
4. Initialize storage drivers (IndexedDB/LocalStorage)
   ↓
5. Load data from storage
   ↓
6. Initialize DatasetManager
   ↓
7. Load and initialize extensions
   ↓
8. Run extension hooks (onAppInit)
   ↓
9. Render initial UI
   ↓
10. Set up event listeners
```

---

## Critical Development Rules

### Version Management (MANDATORY)

**EVERY TIME you modify `app.js`, you MUST update these constants:**

```javascript
// Location: www/app.js, lines 27-30
const APP_CREATOR = 'jxburros';
const APP_VERSION = '0.15.0';           // <-- UPDATE THIS
const APP_RELEASE_DATE = '2025-11-30'; // <-- UPDATE THIS (YYYY-MM-DD)
const APP_UPDATER = 'Claude Code (Sonnet 4.5)'; // <-- UPDATE THIS
```

**Version Increment Rules:**
- If user doesn't specify, append ".1" (e.g., "0.15.0" → "0.15.0.1")
- Minor changes: Increment patch (0.15.0 → 0.15.1)
- New features: Increment minor (0.15.0 → 0.16.0)
- Breaking changes: Increment major (0.15.0 → 1.0.0)

### Schema Version

**Current Schema**: v4 (set at line 52)

```javascript
const SCHEMA_VERSION = 4;
```

**DO NOT change this** unless you're implementing schema migrations.

### Code Preservation

- **NEVER remove existing features** unless explicitly requested
- **NEVER break backwards compatibility** without migration plan
- **ALWAYS maintain functionality** during refactoring
- **ALWAYS test thoroughly** after changes

---

## Codebase Organization

### File Structure

```
www/
├── index.html          # HTML shell (12 KB)
├── app.js              # Main application entry point
├── styles.css          # All styling (54 KB)
├── capacitor.js        # Capacitor bridge
├── test.html           # Test runner UI
├── diagnostic.html     # Debug utilities
└── modules/            # ES Modules (v0.15.0+)
    ├── core/           # Core functionality modules
    │   ├── utils.js    # Utility functions (h, uid, debounce, etc.)
    │   ├── state.js    # Application state management
    │   └── storage.js  # Storage driver implementations
    ├── ui/             # UI component modules
    │   ├── toast.js    # Toast notifications
    │   └── appearance.js # Theme and appearance settings
    └── index.js        # Central module exports

tests/
├── helpers.js          # Test utilities
└── *.test.js           # 18 test files (188+ tests)

types/
└── extensions.d.ts     # TypeScript definitions

docs/
├── api-reference.md
├── extension-cookbook.md
└── [other docs]
```

### Modular Architecture (v0.15.0+)

As of v0.15.0, CardSpoke uses ES modules for better maintainability. The module structure:

**Core Modules (`www/modules/core/`):**
- `utils.js` - Utility functions like `h()`, `uid()`, `debounce()`, `normalizeTagInput()`, `escapeHtml()`, `highlightText()`, `cloneCard()`, `trapFocus()`, `formatBytes()`
- `state.js` - Application state management including version constants (`APP_VERSION`, `APP_RELEASE_DATE`), store getters/setters, navigation state
- `storage.js` - Storage driver implementations (IndexedDB, LocalStorage, DatasetManager)

**UI Modules (`www/modules/ui/`):**
- `toast.js` - Toast notification system with `showToast()` and `initToast()`
- `appearance.js` - Theme management and appearance settings

**Importing in app.js:**
```javascript
import { 
  h, uid, debounce, normalizeTagInput, escapeHtml, highlightText, 
  cloneCard, trapFocus, formatBytes 
} from './modules/core/utils.js';

import { 
  APP_CREATOR, APP_VERSION, APP_RELEASE_DATE, APP_UPDATER, SCHEMA_VERSION,
  state as moduleState, getStore, setStore, getNavState, setNavState, 
  createDefaultStore, isRichTextEnabled, setRichTextEnabled,
  getActiveThemeExtension, setActiveThemeExtension
} from './modules/core/state.js';

import { showToast, initToast } from './modules/ui/toast.js';
```

**Backward Compatibility:**
The modules are designed for backward compatibility. Many functions are still defined locally in app.js, with the modules serving as the canonical source. This allows gradual migration.

### app.js Structure (Line Ranges)

```javascript
// Lines 1-100: IIFE wrapper, metadata, constants
// Lines 100-400: Utility functions (h(), uid(), debounce, etc.)
// Lines 400-600: Fuzzy search (Levenshtein distance)
// Lines 587-1000: Storage drivers (IndexedDBDriver, LocalStorageDriver)
// Lines 793-1000: DatasetManager class
// Lines 985-1200: Save/load functions
// Lines 1200-1400: Navigation (goTo, goBack)
// Lines 1288-2300: Extension system (CardSpoke_MODS)
// Lines 2300-2600: Card CRUD operations
// Lines 2600-2900: Card utilities (tags, bookmarks)
// Lines 2900-3300: UI panels (Dataset Manager, Extensions Hub)
// Lines 3300-4600: Extension wizards and playground
// Lines 4600-5100: Settings and appearance
// Lines 5100-5400: Import/export functions
// Lines 5400-5600: Tag management
// Lines 5600-6000: Rendering functions
// Lines 6000-6400: Search results rendering
// Lines 6400-6700: Main render dispatch
// Lines 6700-7100: Theme management
// Lines 7100-7400: Undo/redo system
// Lines 7400-7700: Trash bin, tag management
// Lines 7700-8100: Drag and drop
// Lines 8100-8400: Help modals
// Lines 8400-8600: Keyboard shortcuts
// Lines 8600-8700: App initialization
```

---

## Data Model & Storage

### Store Structure

The entire application state lives in the `store` object:

```javascript
const store = {
  rootOrder: [],        // Array of root card IDs in display order
  cards: {},            // Map of cardId → card object
  mods: {},             // Map of modId → extension object
  bookmarks: [],        // Array of bookmarked card IDs
  recentCards: [],      // Array of recently viewed IDs (max 10)
  viewMode: 'normal',   // 'normal' or 'compact'
  activeTheme: 'light'  // 'light' or 'dark'
};
```

### Card Object

```javascript
{
  id: string,           // UUID-like identifier
  title: string,        // Card title
  body: string,         // Card content
  parentId: string | null,  // Parent card ID (null = root)
  children: string[],   // Array of child card IDs
  tags: string[],       // Array of lowercase tags
  createdAt: number,    // Unix timestamp (ms)
  updatedAt: number,    // Unix timestamp (ms)
  modsData: object      // Extension-specific data storage
}
```

### Navigation State

```javascript
const navState = {
  page: 'list',         // 'list' | 'card' | 'search' | 'extensions'
  cardId: null,         // Currently viewed card ID
  parentId: null,       // Parent context for operations
  searchQuery: ''       // Active search term
};
```

### Storage Architecture

**Three Layers:**

1. **In-Memory**: `store` object (runtime)
2. **Storage Driver**: Abstract interface (IndexedDBDriver or LocalStorageDriver)
3. **Physical Storage**: IndexedDB or LocalStorage

**Storage Keys:**
- Data: `data_${instanceKey}`
- Mods: `mods_${instanceKey}`
- Active instance: `activeInstance`

**Auto-Save:**
- Debounced: 500ms after last change
- Minimum interval: 100ms between saves
- Triggered by: `dirty = true; save();`

---

## Core Patterns

### 1. State Mutation Pattern

**ALWAYS follow this pattern when modifying data:**

```javascript
function updateSomething() {
  // 1. Modify the store
  store.cards[cardId].title = newTitle;

  // 2. Mark as dirty
  dirty = true;

  // 3. Trigger save (debounced automatically)
  save();

  // 4. Update UI if needed
  render();
}
```

### 2. Navigation Pattern

```javascript
function goTo(page, cardId = null) {
  // Save current state to history
  navHistory.push({ ...navState });

  // Update navigation state
  navState.page = page;
  navState.cardId = cardId;

  // Render
  render();
}

function goBack() {
  if (navHistory.length === 0) return;

  navState = navHistory.pop();
  render();
}
```

### 3. Rendering Pattern

```javascript
function render() {
  // Dispatch based on page
  if (navState.page === 'list') {
    renderCardList();
  } else if (navState.page === 'card') {
    renderCardDetail();
  } else if (navState.page === 'search') {
    renderSearchResults();
  }

  // Update header/footer
  updateHeader();
  updateFooter();
}
```

### 4. Event Delegation Pattern

```javascript
// Set up once at initialization
main.addEventListener('click', (e) => {
  const cardBtn = e.target.closest('.card-item');
  if (cardBtn) {
    const cardId = cardBtn.dataset.id;
    goTo('card', cardId);
  }
});
```

### 5. HTML Builder Pattern

```javascript
function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);

  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'className') el.className = value;
    else if (key === 'dataset') {
      for (const [dk, dv] of Object.entries(value)) {
        el.dataset[dk] = dv;
      }
    } else if (key.startsWith('on')) {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else {
      el.setAttribute(key, value);
    }
  }

  children.flat(Infinity).forEach(child => {
    if (child != null) {
      el.append(typeof child === 'string' ? child : child);
    }
  });

  return el;
}
```

---

## Common Operations

### Create Card

```javascript
function createCard(title = '', body = '', parentId = null) {
  const id = uid();
  const now = Date.now();

  const card = {
    id,
    title,
    body,
    parentId,
    children: [],
    tags: [],
    createdAt: now,
    updatedAt: now,
    modsData: {}
  };

  store.cards[id] = card;

  if (parentId && store.cards[parentId]) {
    store.cards[parentId].children.push(id);
  } else {
    store.rootOrder.unshift(id);
  }

  dirty = true;
  save();

  CardSpoke_MODS.runHook('onCardSave', card, { isNew: true });

  return card;
}
```

### Update Card

```javascript
function updateCard(cardId, updates) {
  const card = store.cards[cardId];
  if (!card) return false;

  Object.assign(card, updates);
  card.updatedAt = Date.now();

  dirty = true;
  save();

  CardSpoke_MODS.runHook('onCardSave', card, { isNew: false });

  return true;
}
```

### Delete Card

```javascript
function deleteCard(cardId) {
  const card = store.cards[cardId];
  if (!card) return false;

  // Recursively delete children
  [...card.children].forEach(childId => deleteCard(childId));

  // Remove from parent
  if (card.parentId && store.cards[card.parentId]) {
    const parent = store.cards[card.parentId];
    parent.children = parent.children.filter(id => id !== cardId);
  } else {
    store.rootOrder = store.rootOrder.filter(id => id !== cardId);
  }

  // Remove from bookmarks/recent
  store.bookmarks = store.bookmarks.filter(id => id !== cardId);
  store.recentCards = store.recentCards.filter(id => id !== cardId);

  delete store.cards[cardId];

  dirty = true;
  save();

  CardSpoke_MODS.runHook('onCardDelete', card);

  return true;
}
```

### Tag Management

```javascript
// Add tag (normalized)
function addTag(cardId, tag) {
  const card = store.cards[cardId];
  if (!card) return false;

  const normalizedTag = tag.replace(/^#/, '').toLowerCase().trim();
  if (!normalizedTag || card.tags.includes(normalizedTag)) return false;

  card.tags.push(normalizedTag);
  card.updatedAt = Date.now();

  dirty = true;
  save();

  return true;
}

// Remove tag
function removeTag(cardId, tag) {
  const card = store.cards[cardId];
  if (!card) return false;

  const normalizedTag = tag.toLowerCase().trim();
  const initialLength = card.tags.length;

  card.tags = card.tags.filter(t => t !== normalizedTag);

  if (card.tags.length === initialLength) return false;

  card.updatedAt = Date.now();
  dirty = true;
  save();

  return true;
}

// Get all unique tags
function getAllTags() {
  const allTags = new Set();
  Object.values(store.cards).forEach(card => {
    if (card.tags) card.tags.forEach(tag => allTags.add(tag));
  });
  return Array.from(allTags).sort();
}
```

### Search Cards

```javascript
function searchCards(query) {
  if (!query) return [];

  const lowerQuery = query.toLowerCase();
  const results = [];

  for (const id in store.cards) {
    const card = store.cards[id];
    const titleMatch = card.title.toLowerCase().includes(lowerQuery);
    const bodyMatch = card.body.toLowerCase().includes(lowerQuery);
    const tagMatch = card.tags.some(t => t.includes(lowerQuery));

    if (titleMatch || bodyMatch || tagMatch) {
      results.push(card);
    }
  }

  return results;
}
```

---

## Extension System

### CardSpoke.utils API (Public API)

Exposed at `window.CardSpoke.utils`:

```javascript
// Card Management
CardSpoke.utils.createCard(title, body?, parentId?)
CardSpoke.utils.updateCard(cardId, updates)
CardSpoke.utils.getCard(cardId)
CardSpoke.utils.searchCards(query)

// Tag Management
CardSpoke.utils.getTags(cardId)
CardSpoke.utils.addTag(cardId, tag)
CardSpoke.utils.removeTag(cardId, tag)
CardSpoke.utils.setTags(cardId, tags)
CardSpoke.utils.getAllTags()

// Accessibility
CardSpoke.utils.getAccessibilitySettings()
CardSpoke.utils.setTheme('light' | 'dark')
CardSpoke.utils.getTheme()
CardSpoke.utils.setTypography('default' | 'comfortable' | 'compact' | 'dyslexia')
CardSpoke.utils.getTypography()
CardSpoke.utils.setHighContrast(boolean)
CardSpoke.utils.isHighContrast()
CardSpoke.utils.onThemeChange(callback)
CardSpoke.utils.getThemeVariables()

// UI
CardSpoke.utils.showToast(message, type?, duration?)
CardSpoke.utils.getDatasetMeta()
```

### Extension Hooks

Extensions register hooks via `CardSpoke_MODS.register()`:

**Available Hooks (14 total):**

```javascript
onAppInit(ctx)                      // App initialized
onEnable(ctx)                       // Extension enabled
onDisable(ctx)                      // Extension disabled
onUninstall(ctx)                    // Before uninstall
onCardSave(ctx, card, saveInfo)     // Card saved
onCardDelete(ctx, card)             // Card deleted
onCardRender(ctx, card, element)    // Card rendered
onNavigate(ctx, navState)           // Navigation changed
onSearch(ctx, query, results)       // Search performed
onThemeChange(ctx, theme)           // Theme changed
onTypographyChange(ctx, preset)     // Typography changed
onHighContrastChange(ctx, enabled)  // High contrast toggled
onExport(ctx, data)                 // Before export
onImport(ctx, info)                 // After import
```

### Extension Structure

```javascript
{
  id: 'my-extension',
  enabled: boolean,
  js: 'string of JavaScript code',
  css: 'string of CSS code',
  meta: {
    name: 'My Extension',
    type: 'Theme' | 'Patch' | 'Plugin' | 'Mod' | 'Kit' | 'Expansion',
    creator: 'Author Name',
    version: '0.15.0',
    releaseDate: 'YYYY-MM-DD',
    description: 'What it does',
    source: 'official' | 'community',
    ai_assistants: 'AI tools used'
  }
}
```

### Safe Execution

Extensions are wrapped in try-catch blocks:

```javascript
try {
  entry.hooks[hookName](buildContext(modId), ...args);
} catch (err) {
  console.error(`[Mods] Error in ${modId}.${hookName}:`, err);
  showToast(`Extension error: ${modId} (${hookName})`, 'error');

  // Auto-disable after 3 consecutive errors
  errorCounts[modId] = (errorCounts[modId] || 0) + 1;
  if (errorCounts[modId] >= 3) {
    CardSpoke_MODS.disable(modId);
    showToast(`Extension ${modId} disabled due to errors`, 'error');
  }
}
```

---

## Testing

### Running Tests

```bash
# Run all tests once
npm test

# Watch mode
npm run test:watch
```

### Test Framework

**uvu** - Ultra-fast test runner

```javascript
import { test } from 'uvu';
import * as assert from 'uvu/assert';

test('card creation', () => {
  const card = createCard('Test', 'Body');
  assert.ok(card.id);
  assert.is(card.title, 'Test');
  assert.is(card.body, 'Body');
});

test.run();
```

### Test Coverage

**188+ tests across 18 files:**

- accessibility-api.test.js (accessibility features)
- backlinks-related.test.js (relationship discovery)
- card-links.test.js (linking functionality)
- card-lookup.test.js (retrieval operations)
- card-operations.test.js (CRUD operations)
- footer.test.js (footer component)
- menu-handlers.test.js (menu interactions)
- multi-dataset-search.test.js (cross-dataset search)
- navigator-suite.test.js (bookmarks, recent, navigation)
- search-navigation.test.js (search UI)
- store-structure.test.js (data validation)
- tag-management.test.js (tag operations)
- tags-api.test.js (tags API)
- ui-state.test.js (UI state management)
- undo-redo.test.js (undo/redo system)
- version-validation.test.js (version checking)

### Test Execution

- **Total tests**: 188+
- **Execution time**: <15ms
- **Pass rate**: 100%

---

## Troubleshooting

### Common Issues

**1. Changes Don't Persist**
- **Cause**: Forgot to set `dirty = true`
- **Fix**: Always set `dirty = true` after modifying `store`

**2. Circular References**
- **Cause**: Card's children array includes the card itself
- **Fix**: Validate parent-child relationships before adding

**3. Missing Cards in UI**
- **Cause**: Card not in `rootOrder` or parent's `children`
- **Fix**: Ensure card is properly linked during creation

**4. Extension Errors**
- **Cause**: Extension code throws errors
- **Fix**: Check console for error messages, use safe mode (`?safemode`)

**5. Storage Quota Exceeded**
- **Cause**: Too much data for LocalStorage
- **Fix**: Use IndexedDB driver instead

### Safe Mode

Launch with extensions disabled:

```
file:///path/to/www/index.html?safemode
```

Detected via:

```javascript
const isSafeMode = new URLSearchParams(window.location.search).has('safemode');
```

### Debug Tools

**Console Commands:**

```javascript
// View entire store
console.log(store);

// View specific card
console.log(store.cards['card-id']);

// View all tags
console.log(getAllTags());

// View navigation state
console.log(navState);

// View extension info
console.log(CardSpoke_MODS.inspectMod('mod-id'));
```

---

## Best Practices

### DO:
- ✅ Update version metadata on every change
- ✅ Set `dirty = true` after modifying store
- ✅ Use helper functions (`h()`, `uid()`, etc.)
- ✅ Follow existing code patterns
- ✅ Write tests for new features
- ✅ Handle errors gracefully
- ✅ Validate user input
- ✅ Use event delegation
- ✅ Document complex logic

### DON'T:
- ❌ Remove existing features without permission
- ❌ Break backwards compatibility
- ❌ Modify SCHEMA_VERSION without migration
- ❌ Hardcode IDs or keys
- ❌ Access DOM directly in loops
- ❌ Skip error handling
- ❌ Forget to debounce expensive operations
- ❌ Use heavy dependencies
- ❌ Ignore test failures

---

## Quick Reference

### Key Functions by Purpose

**Cards:**
- `createCard(title, body, parentId)` - Create new card
- `updateCard(cardId, updates)` - Update card
- `deleteCard(cardId)` - Delete card and descendants
- `duplicateCard(cardId, withChildren)` - Clone card

**Tags:**
- `getTags(cardId)` - Get card's tags
- `addTag(cardId, tag)` - Add tag
- `removeTag(cardId, tag)` - Remove tag
- `setTags(cardId, tags)` - Set all tags
- `getAllTags()` - Get all unique tags

**Navigation:**
- `goTo(page, cardId)` - Navigate to page/card
- `goBack()` - Go back in history

**Search:**
- `searchCards(query)` - Search by title/body/tags
- `fuzzySearch(query, results)` - Fuzzy search with Levenshtein

**Storage:**
- `save()` - Save store (debounced)
- `load()` - Load store from storage
- `exportJSON()` - Export as JSON
- `importJSON(data)` - Import from JSON

**UI:**
- `render()` - Main render dispatch
- `showToast(msg, type, duration)` - Show notification
- `h(tag, attrs, ...children)` - Create DOM element

---

## Version History (Recent)

```
0.15.0 (2025-11-30)
- Production release
- Schema v4 stable

0.14.0 (2025-11-30)
- Accessibility API enhancements
- Theme customization for extensions

0.13.0 (2025-11-XX)
- Documentation refresh
- Extension wizard improvements

0.12.0 (2025-11-XX)
- Undo/redo system
- Tag management
- Advanced search
- Drag-and-drop

0.11.0 (2025-11-XX)
- Backlinks & related cards
- Grid view
- Typography presets
```

---

## Resources

- **Repository**: https://github.com/jxburros/CardSpoke
- **API Reference**: `docs/api-reference.md`
- **Extension Cookbook**: `docs/extension-cookbook.md`
- **Schema Reference**: `docs/schema-reference-v0.13.md`
- **Test Guide**: `tests/README.md`

---

## Final Notes

**Remember:**
1. **Update version metadata** on every change to `app.js`
2. **Set `dirty = true`** after modifying `store`
3. **Follow existing patterns** for consistency
4. **Test thoroughly** before considering work complete
5. **Document complex logic** for future maintainers

CardSpoke prioritizes **simplicity**, **clarity**, and **user control**. All changes should reflect these values.

---

**Guide Version**: 2.0
**Last Updated**: 2025-11-30
**For**: AI Programming Assistants
**Compatibility**: CardSpoke 0.15.0+
