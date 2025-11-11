# CardSpoke Schema Documentation
**Version 4 (Schema v4)**

This document details all data schemas used in CardSpoke and expected from external developers when creating mods, extensions, or working with CardSpoke data.

---

## Table of Contents
1. [Overview](#overview)
2. [Core Data Structures](#core-data-structures)
3. [Mod/Extension Schema](#modextension-schema)
4. [Storage Schema](#storage-schema)
5. [Export/Import Formats](#exportimport-formats)
6. [API Data Types](#api-data-types)
7. [Version History](#version-history)

---

## Overview

CardSpoke uses **Schema v4** as of version 0.7+. This schema is designed to be:
- **Human-readable**: Easy to understand and edit manually
- **Extensible**: Fields can be added without breaking compatibility
- **Portable**: Data exports work across platforms and versions
- **Mod-friendly**: Includes dedicated spaces for mod-specific data

### Schema Principles
1. All IDs are strings (timestamp-based or custom)
2. Timestamps are Unix milliseconds (number)
3. Optional fields may be undefined or null
4. Arrays are always defined (empty array `[]` if no items)
5. Mod data is isolated in dedicated fields
6. Metadata is always an object (never null)

---

## Core Data Structures

### 1. Card

The fundamental unit of information in CardSpoke.

```typescript
interface Card {
  // Required fields
  id: string;                    // Unique identifier (timestamp-based or custom)
  title: string;                 // Card title/heading
  body: string;                  // Card content/details
  parentId: string | null;       // Parent card ID (null if root card)
  children: string[];            // Array of child card IDs
  createdAt: number;            // Unix timestamp (milliseconds)
  updatedAt: number;            // Unix timestamp (milliseconds)
  
  // Optional fields
  tags?: string[];              // Array of tag strings
  meta?: Record<string, any>;   // Custom metadata for future use
  attributes?: Record<string, any>; // User-defined attributes
  modsData?: Record<string, any>;   // Mod-specific data storage
}
```

#### Field Details:

**`id`** (string, required)
- Unique identifier for the card
- Generated using `Date.now().toString(36) + Math.random().toString(36).substring(2)`
- Must be unique within a dataset
- Example: `"lc1a2b3c4d5e6f"`

**`title`** (string, required)
- Human-readable card title
- Displayed in card lists and breadcrumbs
- Can be empty string but must exist
- Recommended max length: 200 characters

**`body`** (string, required)
- Main content of the card
- Plain text (may support markdown in future versions)
- Can be empty string
- No hard length limit (practical limit: ~1MB for performance)

**`parentId`** (string | null, required)
- ID of parent card
- `null` for root-level cards
- Must reference an existing card ID if not null

**`children`** (string[], required)
- Array of child card IDs
- Order determines display order
- Empty array `[]` if no children
- IDs should reference existing cards

**`createdAt`** (number, required)
- Unix timestamp in milliseconds
- Set when card is created
- Should not be modified after creation

**`updatedAt`** (number, required)
- Unix timestamp in milliseconds
- Updated whenever card is modified
- Should be updated on any field change

**`tags`** (string[], optional)
- Array of tag strings for categorization
- Tags are case-sensitive
- Recommended format: lowercase, hyphen-separated
- Example: `["project-a", "urgent", "work"]`

**`meta`** (Record<string, any>, optional)
- Reserved for future core features
- Should not be used by mods (use `modsData` instead)
- May include fields like `color`, `icon`, `priority` in future

**`attributes`** (Record<string, any>, optional)
- User-defined custom fields
- Flexible key-value storage
- Example: `{ "status": "done", "priority": 5 }`

**`modsData`** (Record<string, any>, optional)
- Storage for mod-specific data
- Keyed by mod ID
- Example: `{ "my-mod": { "customField": "value" } }`

#### Example Card:

```json
{
  "id": "lc1a2b3c4d5e6f",
  "title": "Project Alpha",
  "body": "This is the main project card with all the details about Project Alpha.",
  "parentId": null,
  "children": ["lc7g8h9i0j1k2l", "lc3m4n5o6p7q8r"],
  "createdAt": 1731355200000,
  "updatedAt": 1731441600000,
  "tags": ["project", "active", "high-priority"],
  "meta": {},
  "attributes": {
    "status": "in-progress",
    "owner": "jxburros"
  },
  "modsData": {
    "card-statistics-mod": {
      "lastViewed": 1731441600000
    }
  }
}
```

---

### 2. Store

The main application state container stored in localStorage.

```typescript
interface Store {
  rootOrder: string[];           // Ordered array of root card IDs
  cards: Record<string, Card>;   // Map of card ID to Card object
  mods: Record<string, ModData>; // Map of mod ID to ModData object
}
```

#### Field Details:

**`rootOrder`** (string[], required)
- Array of card IDs that appear at root level
- Order determines display order
- Each ID should exist in `cards` object
- Can be empty array `[]`

**`cards`** (Record<string, Card>, required)
- Object map of all cards
- Key is card ID, value is Card object
- Should always be defined (empty object `{}` if no cards)

**`mods`** (Record<string, ModData>, required)
- Object map of all installed mods
- Key is mod ID, value is ModData object
- Should always be defined (empty object `{}` if no mods)

#### Example Store:

```json
{
  "rootOrder": ["card1", "card2"],
  "cards": {
    "card1": { /* Card object */ },
    "card2": { /* Card object */ }
  },
  "mods": {
    "my-mod": { /* ModData object */ }
  }
}
```

---

### 3. ModData

Represents an installed mod/extension.

```typescript
interface ModData {
  enabled: boolean;              // Whether mod is currently active
  js: string;                    // JavaScript code (CIB_MODS.register call)
  css: string;                   // CSS styles (optional)
  meta: ModMetadata;             // Mod metadata
}
```

#### Field Details:

**`enabled`** (boolean, required)
- `true` if mod is active and running
- `false` if mod is installed but disabled
- Toggled via Extensions page

**`js`** (string, required)
- JavaScript code for the mod
- Must include `CIB_MODS.register()` call
- Executed when mod is enabled
- Can be empty string (style-only mods)

**`css`** (string, required)
- CSS styles for the mod
- Injected as `<style>` tag when enabled
- Can be empty string
- Should use CSS variables for theming

**`meta`** (ModMetadata, required)
- Metadata about the mod
- Used for display and identification
- See ModMetadata schema below

---

### 4. ModMetadata

Metadata describing a mod/extension.

```typescript
interface ModMetadata {
  name: string;                  // Display name
  creator?: string;              // Creator name
  version?: string;              // Version string (semver recommended)
  releaseDate?: string;          // Release date (ISO 8601 or custom)
  description?: string;          // Short description
  type?: ModType;                // Mod type classification
  capabilities?: string[];       // Required permissions (future)
  dependencies?: string[];       // Required mod IDs (future)
}

type ModType = 
  | 'Theme'      // Visual/aesthetic changes only
  | 'Patch'      // Code fixes without changing source
  | 'Plugin'     // New tools or functionality
  | 'Mod'        // Fundamental behavior changes
  | 'Kit'        // Collection of themes/plugins
  | 'Expansion'; // Large-scale bundle with multiple types
```

#### Field Details:

**`name`** (string, required)
- Human-readable display name
- Shown in Extensions list
- Example: `"Card Statistics Mod"`

**`creator`** (string, optional)
- Author/creator name or organization
- Example: `"jxburros"`

**`version`** (string, optional)
- Version identifier
- Semantic versioning recommended (e.g., `"1.0.0"`)
- Can be any string format

**`releaseDate`** (string, optional)
- Date of release or last update
- ISO 8601 format recommended (e.g., `"2025-11-11"`)
- Can be any date format

**`description`** (string, optional)
- Brief description of mod functionality
- Shown in Extensions list
- Recommended max length: 200 characters

**`type`** (ModType, optional)
- Classification of mod type
- Used for filtering and organization
- See ModType enum above

**`capabilities`** (string[], optional)
- Future: Required permissions
- Example: `["ui", "data", "network"]`
- Not yet enforced

**`dependencies`** (string[], optional)
- Future: Required mod IDs
- Example: `["base-utility-mod"]`
- Not yet enforced

---

## Mod/Extension Schema

### Mod File Format (.json)

Mods are distributed as JSON files with this structure:

```typescript
interface ModFile {
  id: string;                    // Unique mod identifier
  meta: ModMetadata;             // Mod metadata
  js: string;                    // JavaScript code
  css: string;                   // CSS styles
}
```

#### Example Mod File:

```json
{
  "id": "my-custom-mod",
  "meta": {
    "name": "My Custom Mod",
    "creator": "Developer Name",
    "version": "1.0.0",
    "releaseDate": "2025-11-11",
    "description": "Does something awesome",
    "type": "Plugin"
  },
  "js": "CIB_MODS.register('my-custom-mod', { ... });",
  "css": ".my-class { color: red; }"
}
```

### Mod Registration

Mods register themselves using the `CIB_MODS.register()` API:

```typescript
CIB_MODS.register(modId: string, definition: ModDefinition): void

interface ModDefinition {
  meta?: ModMetadata;
  onAppInit?: (ctx: ModContext) => void;
  onCardRender?: (ctx: ModContext, cardId: string, element: HTMLElement) => void;
  onCardSave?: (ctx: ModContext, card: Card, changes: CardChanges) => void;
  onCardDelete?: (ctx: ModContext, cardId: string) => void;
}

interface ModContext {
  modId: string;
  appVersion: string;
  schemaVersion: number;
  api: StoreAPI;
}
```

---

## Storage Schema

### LocalStorage Key Format

CardSpoke stores data in localStorage using this key format:

**Default instance:** `nested_cards_store`  
**Named instances:** `nested_cards_store_${instanceName}`

### Stored Value

The stored value is a stringified JSON object matching the Store schema:

```json
{
  "rootOrder": [...],
  "cards": {...},
  "mods": {...}
}
```

---

## Export/Import Formats

### 1. Full Instance Export (.json)

Exports entire dataset with all cards and mods:

```typescript
interface InstanceExport {
  version: string;               // App version
  schemaVersion: number;         // Schema version (4)
  exportDate: string;            // ISO 8601 timestamp
  exportType: 'instance';        // Export type identifier
  instanceName?: string;         // Optional instance name
  data: Store;                   // Complete store data
}
```

#### Example:

```json
{
  "version": "0.7.4",
  "schemaVersion": 4,
  "exportDate": "2025-11-11T19:00:00.000Z",
  "exportType": "instance",
  "instanceName": "My Project",
  "data": {
    "rootOrder": ["card1"],
    "cards": { "card1": {...} },
    "mods": { "mod1": {...} }
  }
}
```

### 2. Card Export (.json)

Exports single card without children:

```typescript
interface CardExport {
  version: string;
  schemaVersion: number;
  exportDate: string;
  exportType: 'card';
  card: Card;
}
```

### 3. Subtree Export (.json)

Exports card with all descendants:

```typescript
interface SubtreeExport {
  version: string;
  schemaVersion: number;
  exportDate: string;
  exportType: 'subtree';
  rootCard: Card;
  cards: Record<string, Card>;   // All cards in subtree
}
```

### 4. Text Export (.txt)

Exports cards as plain text with indentation showing hierarchy:

```
Card Title 1
  Card body text here
  
  Child Card Title
    Child card body text
    
    Grandchild Card Title
      Grandchild body text

Card Title 2
  Another card body
```

### 5. Mods Export (.json)

Exports all installed mods:

```typescript
interface ModsExport {
  version: string;
  schemaVersion: number;
  exportDate: string;
  exportType: 'mods';
  mods: Record<string, ModData>;
}
```

---

## API Data Types

### StoreAPI

The API provided to mods via the context object:

```typescript
interface StoreAPI {
  getAppInfo(): AppInfo;
  getCard(id: string): Card | null;
  listCards(): Card[];
  listRootIds(): string[];
  getNavState(): NavState;
  navigate(page: string, opts?: any): void;
  showToast(message: string, type?: 'success' | 'error' | 'info'): void;
  markDirty(): void;
}

interface AppInfo {
  appVersion: string;            // e.g., "0.7.4"
  schemaVersion: number;         // e.g., 4
}

interface NavState {
  page: string;                  // Current page ('home', 'card', 'form')
  cardId?: string;               // Current card ID (if on card page)
  parentId?: string;             // Parent ID (if in form)
  editId?: string;               // Edit card ID (if editing)
}
```

---

## Version History

### Schema v4 (Current)
**Introduced in:** v0.7.0  
**Changes from v3:**
- Added `modsData` field to Card
- Standardized `meta` as reserved field
- Added `attributes` for user-defined fields
- Introduced formal ModData and ModMetadata schemas
- Defined mod type taxonomy

### Schema v3
**Introduced in:** v0.6.0  
**Changes from v2:**
- Added multi-instance support
- Improved export/import formats
- Added mod system basics

### Schema v2
**Introduced in:** v0.5.0  
**Changes from v1:**
- Added tags support
- Added timestamps (createdAt, updatedAt)

### Schema v1
**Introduced in:** v0.1.0 - v0.4.x  
**Initial schema:**
- Basic card structure (id, title, body, parentId, children)
- Simple store with rootOrder and cards

---

## Migration Guidelines

### For Mod Developers

When creating mods:
1. Always check card fields exist before accessing
2. Use `modsData[yourModId]` for mod-specific storage
3. Never modify core fields unless that's your mod's purpose
4. Use the StoreAPI instead of direct store access when possible
5. Handle missing/null values gracefully

### For Users Importing Data

- Schema v4 is backward compatible with v2 and v3
- Schema v1 exports may need manual conversion
- Missing fields are auto-populated with defaults
- Extra fields are preserved but ignored

### For Future Versions

- New optional fields can be added without breaking changes
- Required fields need migration plan
- Deprecated fields should remain for 2+ major versions
- Schema version must increment for breaking changes

---

## Developer Guidelines

### Best Practices

1. **Always validate data:** Check that cards exist before accessing
2. **Use TypeScript types:** Copy these interfaces for type safety
3. **Preserve data integrity:** Never modify IDs or timestamps incorrectly
4. **Follow conventions:** Use lowercase-hyphenated naming for tags and IDs
5. **Test edge cases:** Empty arrays, null values, missing fields

### Common Patterns

#### Creating a Card

```javascript
const newCard = {
  id: uid(), // Generate unique ID
  title: "My Card",
  body: "Card content",
  parentId: null,
  children: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
  tags: [],
  modsData: {}
};
```

#### Accessing Mod Data

```javascript
// Get mod-specific data
const modData = card.modsData?.[yourModId] || {};

// Set mod-specific data
if (!card.modsData) card.modsData = {};
card.modsData[yourModId] = { customField: "value" };
```

#### Safe Card Access

```javascript
const card = ctx.api.getCard(cardId);
if (!card) {
  console.error("Card not found:", cardId);
  return;
}
// Use card safely
```

---

## Conclusion

This schema documentation provides a complete reference for working with CardSpoke data. Whether you're developing mods, importing data, or contributing to core development, these schemas ensure consistency and compatibility across the platform.

For questions or clarifications, refer to the CardSpoke repository or community forums.

---

**Document Version:** 1.0  
**Schema Version:** 4  
**Created:** November 11, 2025  
**Creator:** jxburros with GitHub Copilot  
**Last Updated:** November 11, 2025  
**Compatible with:** CardSpoke v0.7.0+
