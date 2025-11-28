# CardSpoke API Reference

**Version:** 0.13.0  
**Last Updated:** 2025-11-28

This document provides comprehensive documentation for the `CardSpoke.utils` API, which allows extension developers to interact with CardSpoke programmatically.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Card Management](#card-management)
3. [Tag Management](#tag-management)
4. [Search & Query](#search--query)
5. [UI & Notifications](#ui--notifications)
6. [Dataset Information](#dataset-information)
7. [Error Handling](#error-handling)
8. [Examples](#examples)

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

For legacy support, `window.CIB.utils` is also available as an alias.

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

## Error Handling

All API functions include input validation and error handling. Invalid inputs will:
- Return appropriate default values (`null`, `false`, empty arrays)
- Log errors to the console in Developer Mode
- Never throw exceptions that could crash extensions

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
| 0.13.0 | Version sync and documentation refresh |
| 0.12.1 | API documentation created |
| 0.11.3 | Renamed from CIB.utils to CardSpoke.utils |
| 0.11.1 | Initial API release |

---

*For more information, see the [AI Developer Guide](../AI_DEVELOPER_GUIDE.md) or [GitHub repository](https://github.com/jxburros/CardSpoke).*
