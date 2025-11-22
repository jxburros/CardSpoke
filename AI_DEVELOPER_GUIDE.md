# CardSpoke AI Developer Guide

**Version:** 1.0  
**Created for:** AI Programming Assistants  
**Last Updated:** 2025-11-14  
**Application Version:** 0.11.3

---

## Purpose

This document provides AI developers with a comprehensive understanding of CardSpoke's architecture, patterns, and conventions to enable effective code modifications, bug fixes, and feature development without full repository access.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Concepts](#core-concepts)
3. [File Structure](#file-structure)
4. [Data Model & Schema](#data-model--schema)
5. [Key Patterns & Conventions](#key-patterns--conventions)
6. [Common Operations](#common-operations)
7. [Styling Guidelines](#styling-guidelines)
8. [Development Guidelines](#development-guidelines)
9. [Version Management](#version-management)
10. [Testing & Validation](#testing--validation)

---

## Architecture Overview

### Technology Stack

- **Framework**: Vanilla JavaScript (no heavy frameworks)
- **UI**: Custom CSS with design tokens
- **Storage**: Capacitor Preferences, IndexedDB
- **Cross-Platform**: Capacitor
- **Build System**: Node.js, npm

### Application Structure

CardSpoke is a single-page application (SPA) with:
- **Zero external runtime dependencies** in the browser
- **Capacitor plugins** for native functionality
- **Local-first data storage** (no server required)
- **Modular architecture** ready for extensions

### Core Philosophy

1. **Lightweight**: Minimal code, maximum clarity
2. **Portable**: All data user-controlled
3. **Extendable**: Features added through mods
4. **Readable**: Human-understandable code
5. **Educational**: Easy to learn and modify

---

## Core Concepts

### Cards

The fundamental unit of data in CardSpoke. Each card represents a piece of information with:
- Hierarchical relationships (parent-child)
- Free-form text content (title + body)
- Metadata (tags, custom attributes)
- Extension data (mod-specific)

### Navigation State

The app maintains a navigation state that determines what the user sees:
- `page`: Current view ('list', 'card', 'search', 'extensions')
- `cardId`: Currently viewed card ID
- `parentId`: Parent context for operations
- `searchQuery`: Active search term

### Data Store

A single in-memory object that represents the entire dataset:
```javascript
{
  rootOrder: [],         // Array of root-level card IDs
  cards: {},            // Map of cardId -> Card object
  mods: {},             // Installed modifications
  bookmarks: [],        // Bookmarked card IDs
  recentCards: [],      // Recently accessed card IDs
  viewMode: 'normal'    // 'normal' or 'compact'
}
```

---

## File Structure

```
CardSpoke/
├── www/                        # Web assets
│   ├── index.html             # Main HTML structure
│   ├── styles.css             # All application styles
│   ├── app.js                 # Application JavaScript
│   └── capacitor.js           # Capacitor initialization
├── android/                   # Android native (generated)
├── ios/                       # iOS native (generated)
├── capacitor.config.json      # Capacitor configuration
├── package.json               # Dependencies
├── README.md                  # User documentation
├── README-CAPACITOR.md        # Build instructions
├── BRANCH_INFO.md            # Branch information
├── AI_DEVELOPER_GUIDE.md     # This file
├── Road Map V2.md            # Development roadmap
├── cardspoke_objectives_v_1 (1).md  # Project objectives
└── TO DO.md                  # Current tasks
```

---

## Data Model & Schema

### Schema Version 4

CardSpoke uses Schema v4, introduced in version 0.7.

### Card Object

```javascript
{
  id: string,              // Unique identifier (UUID-like)
  title: string,           // Card title
  body: string,            // Card content
  parentId: string | null, // Parent card ID (null for root)
  children: string[],      // Array of child card IDs
  tags: string[],          // Array of tag strings
  meta: object,            // Optional metadata
  attributes: object,      // Optional custom attributes
  modsData: object         // Mod-specific data
}
```

### Dataset Metadata

```javascript
{
  id: string,
  name: string,
  storage: {
    driver: 'indexeddb' | 'localfile',
    config: object
  },
  pin: {                   // Optional
    algo: 'pbkdf2' | 'scrypt',
    salt: string,
    hash: string,
    iterations: number
  },
  deviation: {             // Optional
    baseVersion: string,
    author: string,
    purpose: string
  },
  createdAt: number,
  updatedAt: number
}
```

---

## Key Patterns & Conventions

### 1. Naming Conventions

**Functions:**
- Use camelCase: `createCard()`, `deleteCard()`, `renderCardList()`
- Action verbs first: `show`, `hide`, `toggle`, `render`, `create`, `delete`
- Specific names: `renderCardDetail()` not `showCard()`

**Variables:**
- camelCase for local: `cardId`, `parentCard`, `searchQuery`
- UPPER_SNAKE for constants: `APP_VERSION`, `SCHEMA_VERSION`
- Descriptive names: `activeCardId` not `id`

**CSS Classes:**
- Kebab-case: `card-header`, `menu-item`, `btn-primary`
- BEM-like structure: `card`, `card-title`, `card-actions`
- State modifiers: `.active`, `.hidden`, `.disabled`

### 2. State Management

All state changes should:
1. Update the in-memory `store` object
2. Mark data as dirty: `dirty = true`
3. Trigger a debounced save: `save()` is already debounced
4. Update UI if needed: call render functions

Example:
```javascript
function updateCardTitle(cardId, newTitle) {
  const card = store.cards[cardId];
  if (!card) return;
  
  card.title = newTitle;
  dirty = true;
  save(); // Debounced automatically
  
  // Update UI if currently viewing this card
  if (navState.cardId === cardId) {
    renderCardDetail(cardId);
  }
}
```

### 3. Navigation Pattern

Navigation uses a state-based approach:

```javascript
function navigate(page, options = {}) {
  // Save current state to history
  navHistory.push({ ...navState });
  
  // Update navigation state
  navState.page = page;
  navState.cardId = options.cardId || null;
  navState.parentId = options.parentId || null;
  
  // Render appropriate view
  renderView();
  
  // Update breadcrumbs if needed
  renderBreadcrumbs();
}
```

### 4. UI Rendering

CardSpoke uses direct DOM manipulation:

```javascript
function renderCardList(cards, container) {
  // Clear container
  container.innerHTML = '';
  
  // Create and append elements
  cards.forEach(card => {
    const cardEl = createCardElement(card);
    container.appendChild(cardEl);
  });
}
```

### 5. Event Handling

Use event delegation for dynamic content:

```javascript
// At initialization
main.addEventListener('click', (e) => {
  const cardBtn = e.target.closest('.card-btn');
  if (cardBtn) {
    const action = cardBtn.dataset.action;
    const cardId = cardBtn.dataset.id;
    handleCardAction(action, cardId);
  }
});
```

### 6. Data Persistence

All saves are automatic and debounced:

```javascript
const save = debounce(() => {
  if (!dirty) return;
  
  try {
    localStorage.setItem(instanceKey, JSON.stringify(store));
    dirty = false;
    updateSaveStatus('saved');
  } catch (err) {
    console.error('Save failed:', err);
    updateSaveStatus('error');
  }
}, 1000);
```

---

## Common Operations

### Creating a Card

```javascript
function createCard(title = '', body = '', parentId = null) {
  const id = generateId();
  const card = {
    id,
    title,
    body,
    parentId,
    children: [],
    tags: [],
    meta: {},
    attributes: {},
    modsData: {}
  };
  
  store.cards[id] = card;
  
  // Add to parent's children or root order
  if (parentId) {
    const parent = store.cards[parentId];
    if (parent) parent.children.push(id);
  } else {
    store.rootOrder.unshift(id);
  }
  
  dirty = true;
  save();
  
  runModHook('onCardSave', card, { isNew: true });
  
  return card;
}
```

### Deleting a Card

```javascript
function deleteCard(id) {
  const card = store.cards[id];
  if (!card) return false;
  
  // Recursively delete children
  [...card.children].forEach(childId => deleteCard(childId));
  
  // Remove from parent's children or root order
  if (card.parentId) {
    const parent = store.cards[card.parentId];
    if (parent) {
      const idx = parent.children.indexOf(id);
      if (idx !== -1) parent.children.splice(idx, 1);
    }
  } else {
    const idx = store.rootOrder.indexOf(id);
    if (idx !== -1) store.rootOrder.splice(idx, 1);
  }
  
  // Remove from bookmarks and recent
  if (store.bookmarks) {
    const bmIdx = store.bookmarks.indexOf(id);
    if (bmIdx !== -1) store.bookmarks.splice(bmIdx, 1);
  }
  if (store.recentCards) {
    const rcIdx = store.recentCards.indexOf(id);
    if (rcIdx !== -1) store.recentCards.splice(rcIdx, 1);
  }
  
  delete store.cards[id];
  dirty = true;
  save();
  
  runModHook('onCardDelete', id);
  
  return true;
}
```

### Searching Cards

```javascript
function searchCards(query) {
  if (!query) return [];
  
  const lowerQuery = query.toLowerCase();
  const results = [];
  
  for (const id in store.cards) {
    const card = store.cards[id];
    if (card.title.toLowerCase().includes(lowerQuery) ||
        card.body.toLowerCase().includes(lowerQuery) ||
        card.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) {
      results.push(card);
    }
  }
  
  return results;
}
```

### Managing Tags

```javascript
// Get all tags for a card
function getTags(cardId) {
  const card = store.cards[cardId];
  if (!card) return [];
  return card.tags || [];
}

// Add a tag to a card
function addTag(cardId, tag, skipSave = false) {
  const card = store.cards[cardId];
  if (!card) return false;
  
  // Normalize tag: remove # prefix, lowercase, trim
  const normalizedTag = tag.replace(/^#/, '').toLowerCase().trim();
  if (!normalizedTag) return false;
  
  // Initialize tags array if needed
  if (!card.tags) card.tags = [];
  
  // Prevent duplicates (case-insensitive)
  if (card.tags.some(t => t.toLowerCase() === normalizedTag)) {
    return false;
  }
  
  card.tags.push(normalizedTag);
  card.updatedAt = Date.now();
  
  if (!skipSave) {
    dirty = true;
    save();
  }
  
  return true;
}

// Remove a tag from a card
function removeTag(cardId, tag, skipSave = false) {
  const card = store.cards[cardId];
  if (!card || !card.tags) return false;
  
  const normalizedTag = tag.replace(/^#/, '').toLowerCase().trim();
  
  const initialLength = card.tags.length;
  card.tags = card.tags.filter(t => t.toLowerCase() !== normalizedTag);
  
  if (card.tags.length === initialLength) {
    return false; // Tag wasn't found
  }
  
  card.updatedAt = Date.now();
  
  if (!skipSave) {
    dirty = true;
    save();
  }
  
  return true;
}

// Set all tags for a card at once
function setTags(cardId, tags, skipSave = false) {
  const card = store.cards[cardId];
  if (!card) return false;
  
  // Normalize and deduplicate tags
  const normalizedTags = tags
    .map(tag => tag.replace(/^#/, '').toLowerCase().trim())
    .filter(tag => tag.length > 0);
  
  const uniqueTags = [...new Set(normalizedTags)];
  
  card.tags = uniqueTags;
  card.updatedAt = Date.now();
  
  if (!skipSave) {
    dirty = true;
    save();
  }
  
  return true;
}

// Get all unique tags across all cards
function getAllTags() {
  const allTags = new Set();
  
  for (const id in store.cards) {
    const card = store.cards[id];
    if (card.tags && Array.isArray(card.tags)) {
      card.tags.forEach(tag => allTags.add(tag.toLowerCase()));
    }
  }
  
  return Array.from(allTags).sort();
}
```

**Tags API Features:**
- Tags are automatically normalized (lowercase, no # prefix required)
- Duplicate prevention is built-in
- All functions return boolean success status (except getTags and getAllTags)
- Tags are stored as simple strings in the card.tags array
- Case-insensitive matching for tag comparison
- Optional `skipSave` parameter for batch operations


---

## Styling Guidelines

### Design System

CardSpoke uses CSS custom properties (design tokens):

```css
:root {
  /* Colors */
  --bg: #ffffff;
  --surface: #ffffff;
  --border: #f0f0f0;
  --text: #000000;
  --text-medium: #404040;
  --text-muted: #666666;
  
  /* Typography */
  --font-brand: "Inter", sans-serif;
  --font: "Outfit", sans-serif;
  --text-xs: 12px;
  --text-sm: 14px;
  --text-base: 15px;
  --text-lg: 18px;
  --text-xl: 22px;
  
  /* Spacing */
  --space-xs: 2px;
  --space-sm: 4px;
  --space-md: 8px;
  --space-lg: 12px;
  --space-xl: 16px;
  --space-2xl: 24px;
}
```

### Dark Mode

Dark mode uses a `.dark` class on `:root`:

```css
:root.dark {
  --bg: #000000;
  --surface: #0a0a0a;
  --border: #1a1a1a;
  --text: #ffffff;
  --text-medium: #cccccc;
  --text-muted: #999999;
}
```

### Responsive Design

Three breakpoints for responsive design:
- **1024px**: Tablet and below
- **768px**: Mobile devices
- **480px**: Small mobile devices

```css
@media (max-width: 768px) {
  .brand {
    font-size: 32px;
  }
  
  .card {
    padding: var(--space-xl);
  }
}
```

### Design Principles

1. **High Contrast**: Black and white by default
2. **Bold Typography**: Large, clear text
3. **Generous Spacing**: Ample white space
4. **Minimal Icons**: Simple, clear symbols
5. **Content First**: Design frames content

---

## Development Guidelines

### When Making Changes

1. **Update Version Metadata**: Always update `APP_VERSION`, `APP_RELEASE_DATE`, and `APP_UPDATER` in `app.js`
2. **Maintain Compatibility**: Don't break existing data or features
3. **Follow Patterns**: Use existing code patterns
4. **Test Thoroughly**: Test all affected functionality
5. **Document Changes**: Update comments and documentation

### Version Numbering

- **Major.Minor.Patch** format (e.g., 0.8.2)
- Increment patch for small fixes/features
- Increment minor for new features
- Increment major for breaking changes

### Code Comments

Add comments for:
- Complex algorithms
- Non-obvious logic
- Public APIs
- Important assumptions

Don't comment:
- Obvious code
- Temporary debugging
- Redundant descriptions

### Error Handling

Always handle errors gracefully:

```javascript
try {
  // Operation
} catch (err) {
  console.error('Operation failed:', err);
  showToast('Operation failed', 'error');
  // Recover if possible
}
```

### Mod Execution Error Handling

Mod hooks are wrapped in try-catch blocks to prevent one failing mod from breaking the entire application. When a mod error occurs:

1. The error is logged to console with mod ID and hook name context
2. A user-facing toast notification is displayed
3. Other mods continue to execute normally

```javascript
try {
  entry.hooks[hookName](buildContext(modId), ...args);
  if (hookName === 'onAppInit') initializedMods.add(modId);
} catch (err) {
  console.error(`[Mods] Error in ${modId}.${hookName}:`, err);
  showToast(`Extension error: ${modId} (${hookName})`, 'error');
}
```

This pattern ensures that:
- Users are informed when extensions malfunction
- The core application remains stable
- Developers can debug issues using console logs

---

## Version Management

### App Metadata Constants

Located at the top of `app.js`:

```javascript
const APP_CREATOR = 'jxburros';
const APP_VERSION = '0.8.2';
const APP_RELEASE_DATE = '2025-11-12';
const APP_UPDATER = 'Github Copilot';
```

### Update Protocol

When modifying code:

1. Update `APP_VERSION` (increment appropriately)
2. Update `APP_RELEASE_DATE` (today's date)
3. Update `APP_UPDATER` (your AI name)
4. Add version comment describing changes
5. Update HTML meta tag if needed

### HTML Version Tag

In `index.html`:

```html
<meta name="app:version" content="0.8.2">
<meta name="app:author" content="jxburros">
```

---

## Testing & Validation

### Manual Testing Checklist

When making changes, test:

1. **Card Operations**
   - Create new card
   - Edit card title and body
   - Delete card
   - Move card (change parent)
   - Duplicate card

2. **Navigation**
   - Navigate between cards
   - Use breadcrumbs
   - Use back button
   - Search functionality

3. **Data Persistence**
   - Changes save automatically
   - Page reload preserves data
   - Export/import works

4. **UI/UX**
   - Dark mode toggle
   - Responsive layout on different sizes
   - Menu interactions
   - Toast notifications

5. **Edge Cases**
   - Empty dataset
   - Large dataset (100+ cards)
   - Deep nesting (10+ levels)
   - Special characters in content
   - Long titles/content

### Browser Testing

Test in:
- Chrome/Edge (Chromium)
- Firefox
- Safari (if possible)

### Mobile Testing

Test responsive design:
- Phone portrait (375px)
- Phone landscape (667px)
- Tablet portrait (768px)
- Tablet landscape (1024px)

---



---

## Developer Tools & Extensions (v0.11+)

### CardSpoke.utils API

CardSpoke exposes a comprehensive developer API at `window.CardSpoke.utils` for extension development. This API provides safe, documented access to CardSpoke functionality.

**Available Methods:**

```javascript
// Card Management
await CardSpoke.utils.createCard({ title, body, parentId, tags })
await CardSpoke.utils.updateCard(cardId, { title, body, tags })
await CardSpoke.utils.getCard(cardId)
await CardSpoke.utils.searchCards(query)

// Tag Management
await CardSpoke.utils.getTags(cardId)
await CardSpoke.utils.addTag(cardId, tag)
await CardSpoke.utils.removeTag(cardId, tag)
await CardSpoke.utils.setTags(cardId, tags)
await CardSpoke.utils.getAllTags()

// Utilities
await CardSpoke.utils.showToast(message, type, duration)
await CardSpoke.utils.getDatasetMeta()
```

**Example Usage:**

```javascript
// Create a card with tags
const result = await CardSpoke.utils.createCard({
  title: 'My Card',
  body: 'Content here',
  tags: ['important', 'work']
});
console.log('Created:', result.id);

// Search and update
const cards = await CardSpoke.utils.searchCards('meeting');
for (const card of cards) {
  await CardSpoke.utils.addTag(card.id, 'reviewed');
}

// Show notification
await CardSpoke.utils.showToast('Operation complete!', 'success');
```

### Extension Wizard

The Extension Wizard (🧙 in menu) helps developers create new extensions:

**Features:**
- Interactive step-by-step interface
- Five extension types: Theme, Patch, Plugin, Mod, Expansion
- Auto-generates manifest and skeleton code
- Download as JSON or install directly
- Includes working code examples

**Extension Types:**

1. **Theme**: Pure CSS styling modifications
2. **Patch**: Small enhancements with minimal code
3. **Plugin**: Functionality additions using hooks
4. **Mod**: Comprehensive modifications (CSS + JS)
5. **Expansion**: Major feature additions

**Generated Structure:**

```javascript
{
  id: 'my-extension',
  meta: {
    name: 'My Extension',
    type: 'Plugin',
    creator: 'Your Name',
    version: '1.0.0',
    releaseDate: '2025-11-14',
    description: 'Description here'
  },
  js: '// JavaScript code',
  css: '/* CSS styles */',
  enabled: false
}
```

### Playground

The Playground (🛝 in menu) provides a sandboxed testing environment:

**Features:**
- Split-view: code editor + console output
- Live code execution
- Error boundary and safe execution
- Pre-loaded examples using CardSpoke.utils
- Template loader for quick start

**Usage:**

1. Open Playground from menu
2. Write or edit code in left panel
3. Click "▶️ Run Code" to execute
4. View output in right panel (console)
5. Use "📝 Load Template" for examples

**Safety:**

- Code runs in isolated context
- Errors are caught and displayed
- Original data remains safe
- Can test without affecting main app

### Extension Development Best Practices

1. **Use CardSpoke.utils API**: Don't access store directly
2. **Handle Errors**: Wrap code in try-catch blocks
3. **Test in Playground**: Validate before installing
4. **Document Your Code**: Add comments and descriptions
5. **Version Control**: Track changes in metadata
6. **Minimize Side Effects**: Keep modifications focused
7. **Respect User Data**: Don't modify without permission


## Extension System (Future)

### Mod Hooks

CardSpoke will support extension hooks:

```javascript
function runModHook(hookName, ...args) {
  for (const modId in store.mods) {
    const mod = store.mods[modId];
    if (mod.enabled && mod.hooks && mod.hooks[hookName]) {
      try {
        mod.hooks[hookName](...args);
      } catch (err) {
        console.error(`Mod ${modId} hook ${hookName} failed:`, err);
      }
    }
  }
}
```

Available hooks:
- `onCardSave(card, context)`
- `onCardDelete(cardId)`
- `onCardView(card)`
- `onNavigate(page, options)`
- `onSearch(query, results)`

### Mod Structure

```javascript
{
  id: string,
  name: string,
  creator: string,
  version: string,
  releaseDate: string,
  type: 'theme' | 'patch' | 'plugin' | 'mod',
  enabled: boolean,
  js: string,      // JavaScript code
  css: string,     // CSS code
  hooks: object    // Hook functions
}
```

---

## Common Pitfalls & Solutions

### Pitfall 1: Forgetting to Set Dirty Flag

**Problem**: Changes don't persist after reload.

**Solution**: Always set `dirty = true` after modifying `store`.

### Pitfall 2: Not Cloning Objects

**Problem**: Reference issues when duplicating cards.

**Solution**: Use `cloneCard()` helper or `JSON.parse(JSON.stringify())`.

### Pitfall 3: Hardcoded IDs

**Problem**: Conflicts and poor scalability.

**Solution**: Always use `generateId()` for new items.

### Pitfall 4: Direct DOM Access in Loops

**Problem**: Slow rendering for large lists.

**Solution**: Build HTML strings or use DocumentFragments.

### Pitfall 5: Not Handling Edge Cases

**Problem**: Crashes on empty or unusual data.

**Solution**: Validate inputs and handle null/undefined.

---

## Quick Reference

### Key Functions

| Function | Purpose |
|----------|---------|
| `createCard(title, body, parentId)` | Create new card |
| `deleteCard(id)` | Delete card and children |
| `updateCard(id, updates)` | Update card properties |
| `duplicateCard(id, withChildren)` | Clone a card |
| `searchCards(query)` | Search for cards |
| `getTags(cardId)` | Get all tags for a card |
| `addTag(cardId, tag)` | Add a tag to a card |
| `removeTag(cardId, tag)` | Remove a tag from a card |
| `setTags(cardId, tags)` | Set all tags for a card |
| `getAllTags()` | Get all unique tags across all cards |
| `navigate(page, options)` | Change navigation state |
| `save()` | Persist data (debounced) |
| `load()` | Load data from storage |
| `exportJSON()` | Export dataset as JSON |
| `importJSON(data)` | Import dataset from JSON |

### Key Variables

| Variable | Purpose |
|----------|---------|
| `store` | Main data store |
| `navState` | Current navigation state |
| `navHistory` | Navigation history |
| `dirty` | Unsaved changes flag |
| `instanceKey` | Storage key for active dataset |

### Key DOM Elements

| Element | Purpose |
|---------|---------|
| `main` | Main content area |
| `breadcrumbs` | Breadcrumb navigation |
| `searchInput` | Search text input |
| `menu.overlay` | Side menu overlay |
| `toastContainer` | Toast notifications |

---

## Resources

- **Repository**: https://github.com/jxburros/CardSpoke
- **Capacitor Docs**: https://capacitorjs.com/
- **Schema**: See Data Model section above
- **Roadmap**: See Road Map V2.md
- **Objectives**: See cardspoke_objectives_v_1 (1).md

---

## Conclusion

This guide provides the essential knowledge needed to work with CardSpoke effectively. The codebase is designed to be readable and self-documenting, so don't hesitate to explore the source files directly.

For questions or clarifications, refer to the inline comments in `www/app.js` or the other documentation files.

**Remember**: CardSpoke prioritizes simplicity, clarity, and user control. All changes should reflect these values.

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-14  
**Maintained By:** jxburros  
**Contributors:** Github Copilot
