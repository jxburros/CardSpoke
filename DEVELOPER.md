# Card Info Base - Developer Documentation

**Version:** 0.7.4.0  
**Schema Version:** 4  
**Last Updated:** November 11, 2025

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Schema v4 Reference](#schema-v4-reference)
4. [Core APIs](#core-apis)
5. [Mod System](#mod-system)
6. [Migration Guide](#migration-guide)
7. [Development Workflow](#development-workflow)

---

## Overview

Card Info Base (CIB) is a lightweight, extensible, multi-platform knowledge base framework that combines hierarchical notes ("cards"), modular extensions ("mods"), and local-first data design.

### Key Features
- **Hierarchical card system** with parent-child relationships
- **Tag and metadata support** (Schema v4)
- **Extensible mod system** for themes, plugins, and expansions
- **Multi-instance support** for separate datasets
- **Import/Export** (JSON, TXT, DOCX formats)
- **Theme system** (light/dark modes, style variants)
- **Local-first** design with localStorage

### Technology Stack
- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **Storage:** localStorage (browser-based)
- **Architecture:** Single-file application (SPA)

---

## Architecture

### Core Components

```
┌─────────────────────────────────────────┐
│         User Interface Layer            │
│  (Navigation, Forms, Modals, Views)     │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│          State Management               │
│  (store, navState, currentInstanceName) │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│           Core Functions                │
│  (CRUD operations, search, navigation)  │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         Storage Layer                   │
│     (localStorage + instanceKey)        │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         Mod System (CIB_MODS)           │
│  (Hooks, Registry, Dynamic Loading)     │
└─────────────────────────────────────────┘
```

### Data Flow

1. **User Action** → UI Event Handler
2. **Event Handler** → Core Function (createCard, updateCard, etc.)
3. **Core Function** → Update `store` object
4. **Store Update** → Call `save()` to persist
5. **After Save** → Trigger mod hooks (`onCardSave`, etc.)
6. **Hook Complete** → Call `render()` to update UI

---

## Schema v4 Reference

### Card Structure

```typescript
interface Card {
  // Core identification
  id: string;              // Unique identifier (format: 'card-{timestamp}-{random}')
  title: string;           // Card title
  body: string;            // Card content/details
  
  // Hierarchy
  parentId: string | null; // Parent card ID or null for root-level
  children: string[];      // Array of child card IDs
  
  // Schema v4 Fields (NEW)
  tags: string[];          // Array of tag strings for categorization
  meta: Record<string, any>; // Custom metadata key-value pairs
  attributes: Record<string, any>; // Extensible attributes
  
  // Timestamps
  createdAt: number;       // Unix timestamp (milliseconds)
  updatedAt: number;       // Unix timestamp (milliseconds)
  
  // Mod system
  modsData: Record<string, any>; // Mod-specific data storage
}
```

### Store Structure

```typescript
interface Store {
  rootOrder: string[];     // Array of root-level card IDs (display order)
  cards: Record<string, Card>; // Map of card ID to Card object
  mods: Record<string, ModData>; // Map of mod ID to mod data
}
```

### Mod Data Structure

```typescript
interface ModData {
  id: string;              // Mod identifier
  meta: ModMeta;           // Mod metadata
  js?: string;             // JavaScript code
  css?: string;            // CSS styles
  enabled: boolean;        // Whether mod is active
}

interface ModMeta {
  name: string;            // Display name
  version: string;         // Semantic version (e.g., "1.0.0")
  author: string;          // Author name
  description?: string;    // Optional description
  type?: ModType;          // Mod taxonomy type
}

type ModType = 'Theme' | 'Patch' | 'Plugin' | 'Mod' | 'Expansion';
```

---

## Core APIs

### Card Management

#### `createCard(title, body, parentId)`
Creates a new card with Schema v4 fields initialized.

```javascript
/**
 * @param {string} title - Card title
 * @param {string} body - Card content
 * @param {string|null} parentId - Parent card ID or null for root
 * @returns {Card} The created card object
 */
const newCard = createCard('My Card', 'Details here', null);
```

**Schema v4 Initialization:**
- `tags: []` - Empty array
- `meta: {}` - Empty object
- `attributes: {}` - Empty object

#### `updateCard(id, updates)`
Updates an existing card with partial changes.

```javascript
/**
 * @param {string} id - Card ID to update
 * @param {Partial<Card>} updates - Fields to update
 */
updateCard('card-123', {
  title: 'New Title',
  tags: ['important', 'work'],
  meta: { priority: 'high' }
});
```

**Auto-updated:** `updatedAt` timestamp

#### `deleteCard(id)`
Deletes a card and all its descendants recursively.

```javascript
/**
 * @param {string} id - Card ID to delete
 */
deleteCard('card-123');
```

**Side effects:**
- Removes from parent's `children` array
- Removes from `store.rootOrder` if root-level
- Recursively deletes all children
- Triggers `onCardDelete` mod hook

#### `getCard(id)`
Retrieves a card by ID (returns a clone).

```javascript
/**
 * @param {string} id - Card ID
 * @returns {Card|undefined} Card object or undefined
 */
const card = getCard('card-123');
```

### Search & Query

#### `searchCards(query)`
Full-text search across card titles and bodies.

```javascript
/**
 * @param {string} query - Search query string
 * @returns {Card[]} Array of matching cards
 */
const results = searchCards('meeting notes');
```

**Search behavior:**
- Case-insensitive
- Searches both `title` and `body` fields
- Returns exact object references (not clones)

### Data Persistence

#### `save()`
Persists the current store to localStorage.

```javascript
/**
 * Saves store to localStorage under current instance key
 */
save();
```

**Storage key:** `instanceKey` or `'nested_cards_store'`

#### `load()`
Loads store from localStorage and runs migrations.

```javascript
/**
 * Loads data and automatically migrates to Schema v4
 */
load();
```

**Migration:** Automatically calls `migrateToSchemaV4()` after loading

### Instance Management

#### `chooseInstance(initial)`
Prompts user to select or create a data instance.

```javascript
/**
 * @param {boolean} initial - If true, doesn't reload store
 */
chooseInstance(false); // Prompts and reloads
```

**Instances:** Stored in `localStorage.cib_instances` array

---

## Mod System

### Overview

The mod system (`CIB_MODS`) allows runtime extension of functionality through hooks, custom CSS, and JavaScript injection.

### Creating a Mod

```javascript
// Basic mod structure
const myMod = {
  id: 'my-custom-mod',
  meta: {
    name: 'My Custom Mod',
    version: '1.0.0',
    author: 'Developer Name',
    type: 'Plugin'
  },
  js: `
    // Your JavaScript code
    CIB_MODS.registerHook('my-custom-mod', 'onCardSave', (card, context) => {
      console.log('Card saved:', card.title);
    });
  `,
  css: `
    /* Your custom styles */
    .card { border: 2px solid blue; }
  `
};
```

### Available Hooks

#### `onAppInit`
Called when the application initializes.

```javascript
CIB_MODS.registerHook(modId, 'onAppInit', () => {
  console.log('App initialized');
});
```

#### `onCardSave`
Called after a card is created or updated.

```javascript
CIB_MODS.registerHook(modId, 'onCardSave', (card, context) => {
  // card: The saved card object (clone)
  // context: { isNew: boolean, source: string }
  console.log('Saved:', card.title, 'New?', context.isNew);
});
```

#### `onCardDelete`
Called after a card is deleted.

```javascript
CIB_MODS.registerHook(modId, 'onCardDelete', (cardId) => {
  console.log('Deleted card:', cardId);
});
```

#### `onRender`
Called after the UI re-renders.

```javascript
CIB_MODS.registerHook(modId, 'onRender', () => {
  // Good place for DOM manipulation
  console.log('UI rendered');
});
```

### Mod API Access

Mods can access a safe API through their context:

```javascript
// Available in mod execution context
const api = context.api;

api.getAppVersion();      // Returns { appVersion, schemaVersion }
api.getCard(id);          // Returns card clone
api.listCards();          // Returns array of all cards
api.listRootIds();        // Returns array of root card IDs
api.getData();            // Returns full store clone
api.saveData();           // Triggers save()
```

---

## Migration Guide

### Schema v3 → v4 Migration

The migration happens automatically when data is loaded. The `migrateToSchemaV4()` function:

1. Checks each card for missing v4 fields
2. Adds `tags: []` if missing
3. Adds `meta: {}` if missing
4. Adds `attributes: {}` if missing
5. Saves only if changes were made

**Manual migration:**
```javascript
function migrateToSchemaV4() {
  let migrationCount = 0;
  for (const id in store.cards) {
    const card = store.cards[id];
    if (!card.tags) card.tags = [];
    if (!card.meta) card.meta = {};
    if (!card.attributes) card.attributes = {};
    if (!card.modsData) card.modsData = {};
    migrationCount++;
  }
  if (migrationCount > 0) {
    console.log(`Upgraded ${migrationCount} cards to Schema v4`);
    save();
  }
}
```

### Backward Compatibility

- **v3 cards** are automatically upgraded to v4 on load
- **v4 cards** work seamlessly with v3-aware code (extra fields ignored)
- **No data loss** occurs during migration
- **Idempotent** - safe to run migration multiple times

---

## Development Workflow

### Setup

1. Clone the repository
2. Open `Card Info Base Version 0.7.html` in a browser
3. Use browser DevTools for debugging

### Testing Changes

```bash
# Start a local server
python3 -m http.server 8080

# Navigate to
http://localhost:8080/Card%20Info%20Base%20Version%200.7.html
```

### Debugging

```javascript
// Access global objects in console
console.log(window.store);        // Current data store
console.log(window.CIB_MODS);     // Mod system
console.log(navState);            // Navigation state

// Test functions
createCard('Test', 'Body', null);
console.log(searchCards('test'));
```

### Code Style

- **Functions:** camelCase
- **Constants:** UPPER_SNAKE_CASE
- **Indentation:** 2 spaces
- **Comments:** JSDoc style for public APIs

### Adding Features

1. **Update schema** if needed (increment SCHEMA_VERSION)
2. **Write migration** for data changes
3. **Add core function** with JSDoc comments
4. **Update UI** if needed
5. **Test thoroughly** (create, edit, delete, reload)
6. **Document** in this file

---

## Roadmap

See [Road Map V1.md](Road%20Map%20V1.md) for planned features and versioning strategy.

### v0.7 Goals (Current)
- ✅ Schema v4 implementation
- ✅ Ultra-Light UI
- 🔄 Developer documentation (in progress)
- 📅 AI resource files
- 📅 Mod taxonomy

### Future Versions
- **v0.8:** Capacitor migration for cross-platform
- **v0.9:** Multi-dataset architecture
- **v0.10:** Extensions framework with search and tagging UI

---

## Contributing

1. Follow the existing code style
2. Add JSDoc comments for new functions
3. Test all changes thoroughly
4. Update this documentation for API changes
5. Increment version numbers appropriately

---

## License

GNU General Public License v3.0

---

**Questions?** Check the [Road Map V1.md](Road%20Map%20V1.md) or review the inline code comments in the HTML file.
