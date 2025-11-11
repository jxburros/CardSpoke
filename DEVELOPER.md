# Card Info Base - Developer Documentation

## Version 0.7.0 - Schema v4

This document provides technical information for developers working with Card Info Base.

## Architecture

Card Info Base is a **single-file, client-side application** with no external dependencies. All data is stored in browser localStorage.

### Core Components

- **Store**: Central data structure containing cards, mods, and root order
- **Navigation**: Page-based navigation system with history
- **Mod System**: Extensible hook-based plugin system
- **UI**: Component-based rendering with design tokens

## Schema v4 Data Structures

### Card Object

```typescript
interface Card {
  id: string;              // Unique identifier (e.g., 'card-1234567890-abc123')
  title: string;           // Card title
  body: string;            // Card content (plain text)
  parentId: string | null; // Parent card ID (null for root cards)
  children: string[];      // Array of child card IDs
  tags: string[];          // Array of tag strings (NEW in v4)
  meta: Record<string, any>;      // Custom metadata object (NEW in v4)
  attributes: Record<string, any>; // Additional attributes (NEW in v4)
  createdAt: number;       // Unix timestamp
  updatedAt: number;       // Unix timestamp
  modsData: Record<string, any>;  // Per-mod custom data storage
}
```

### Mod Object

```typescript
interface Mod {
  enabled: boolean;        // Whether the mod is active
  js: string;              // JavaScript code to execute
  css: string;             // CSS styles to inject
  meta: {
    name: string;          // Human-readable name
    version: string;       // Semantic version (e.g., '1.0.0')
    author: string;        // Author name
    type: ModType;         // 'Theme' | 'Patch' | 'Plugin' | 'Mod' | 'Expansion' (NEW in v4)
    description?: string;  // Optional description
  }
}
```

### Store Object

```typescript
interface Store {
  rootOrder: string[];               // Array of root card IDs in display order
  cards: Record<string, Card>;       // Map of card ID to Card object
  mods: Record<string, Mod>;         // Map of mod ID to Mod object
}
```

## Mod Type Taxonomy (Schema v4)

Mods are categorized into five types:

- **Theme**: Visual styling and appearance modifications
- **Patch**: Bug fixes or minor behavioral adjustments
- **Plugin**: New functionality or features
- **Mod**: General-purpose modifications
- **Expansion**: Major feature additions or content packs

## Mod Development

### Basic Mod Structure

Mods are JavaScript code that registers lifecycle hooks using the global `CIB_MODS` API:

```javascript
// Define your mod ID
const MOD_ID = 'my-awesome-mod';

// Register with CIB_MODS
CIB_MODS.register(MOD_ID, {
  // Called when app starts or mod is enabled
  onAppInit(ctx) {
    console.log('Mod initialized!');
    ctx.api.showToast('My Awesome Mod loaded!', 'success');
  },
  
  // Called before a card is rendered
  onCardRender(ctx, card) {
    // Modify card display
    return card;
  },
  
  // Called after a card is saved
  onCardSave(ctx, card, info) {
    console.log('Card saved:', card.title);
  },
  
  // Called after a card is deleted
  onCardDelete(ctx, cardId) {
    console.log('Card deleted:', cardId);
  },
  
  // Optional: define metadata
  meta: {
    name: 'My Awesome Mod',
    version: '1.0.0',
    author: 'Your Name',
    type: 'Plugin',
    description: 'Adds awesome features'
  }
});
```

### Available Hooks

#### `onAppInit(ctx)`
Called when the application initializes or when the mod is enabled.

**Parameters:**
- `ctx`: Context object with `modId`, `appVersion`, `schemaVersion`, and `api`

#### `onCardRender(ctx, card)`
Called before a card is rendered. Can be used to modify how cards appear.

**Parameters:**
- `ctx`: Context object
- `card`: Card object (clone, modifications won't affect store)

**Returns:** Modified card object or undefined

#### `onCardSave(ctx, card, info)`
Called after a card is created or updated.

**Parameters:**
- `ctx`: Context object
- `card`: Card object (clone)
- `info`: Object with `isNew` (boolean) and `source` (string)

#### `onCardDelete(ctx, cardId)`
Called after a card is deleted.

**Parameters:**
- `ctx`: Context object
- `cardId`: ID of the deleted card

### Store API

The `ctx.api` object provides methods to interact with the application:

```typescript
interface StoreAPI {
  getAppInfo(): { appVersion: string, schemaVersion: number };
  getCard(id: string): Card | undefined;
  listCards(): Card[];
  listRootIds(): string[];
  getNavState(): NavState;
  navigate(page: string, opts?: object): void;
  showToast(message: string, type?: 'success' | 'error' | 'info'): void;
  markDirty(): void;
}
```

### Adding Custom Styles

Mods can inject CSS by including it in the `css` field:

```css
/* Make all card titles bold and blue */
.card-title {
  font-weight: 700 !important;
  color: #2b59ff !important;
}
```

## Migration from Schema v3 to v4

Schema v4 is **fully backward compatible** with v3. On load, the application automatically:

1. Adds `tags: []` to cards without tags
2. Adds `meta: {}` to cards without meta
3. Adds `attributes: {}` to cards without attributes
4. Adds `type: 'Mod'` to mods without a type
5. Saves the updated store

No manual migration is required.

## Design Tokens

The UI uses CSS custom properties for theming:

### Colors
- `--bg`, `--panel`, `--card`, `--elev`: Surface colors
- `--border`, `--ring`: Borders and focus rings
- `--text`, `--muted`: Text colors
- `--accent`, `--success`, `--danger`: Semantic colors

### Typography
- `--ff`: Font family
- `--fs-0` through `--fs-4`: Font sizes
- `--lh`: Line height

### Geometry
- `--radius`, `--radius-pill`: Border radius
- `--space-1` through `--space-4`: Spacing scale

### Modes
- Default: Regular UI
- `.light`: Light theme
- `.minimal`: Compact, tighter spacing

## Storage

Data is stored in localStorage under keys:
- `nested_cards_store__<instanceName>`: Instance data
- `cib_instances`: List of available instances

## Contributing

When adding features:
1. Maintain backward compatibility
2. Document new schema changes
3. Add migration logic if needed
4. Follow existing code style
5. Test with both new and legacy data

## Future Roadmap

See [Road Map V1.md](Road%20Map%20V1.md) for planned features in upcoming versions.
