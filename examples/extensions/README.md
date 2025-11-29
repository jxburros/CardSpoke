# CardSpoke Sample Extensions

This directory contains example extensions to help you learn how to create your own CardSpoke extensions.

## Extension Types

| Type | Description | Example |
|------|-------------|---------|
| **Theme** | CSS-only cosmetic changes | `sample-theme.json` |
| **Patch** | Small fixes or enhancements | `sample-patch.json` |
| **Plugin** | Adds features without modifying core | `sample-plugin.json` |
| **Mod** | Comprehensive modifications (CSS + JS) | See Atlas Expansion |
| **Kit** | Bundle of related extensions | N/A |
| **Expansion** | Major feature additions | `sample-expansion-atlas.json` |

## Getting Started

### Method 1: Extension Wizard (Recommended)
1. Open CardSpoke
2. Menu → Extension Wizard
3. Follow the step-by-step guide
4. Download or install directly

### Method 2: Manual Installation
1. Copy the JSON content of an extension
2. Menu → Upload → Mods tab
3. Paste the JSON and click Install

### Method 3: Use the Playground
1. Menu → Playground
2. Write and test your code
3. Export as extension when ready

## Sample Extensions

### 1. sample-theme.json
A simple dark purple theme demonstrating CSS customization.

### 2. sample-theme-contrast.json
An accessibility-oriented, high-contrast theme to test CSS-only customizations with a larger style payload.

### 3. sample-patch.json
A patch that adds creation timestamps to card headers.

### 4. sample-patch-keyboard.json
A lightweight patch that introduces keyboard shortcuts for search, quick note creation, and board navigation.

### 5. sample-plugin.json
A word count plugin that shows word counts for cards.

### 6. sample-plugin-mini.json
A tiny plugin that adds emoji markers to status tags. Useful for verifying that lightweight plugins install correctly.

### 7. sample-plugin-timer.json
A medium-size plugin that embeds a focus timer widget with presets, persistence, and toasts for feedback.

### 8. sample-expansion-atlas.json
A comprehensive expansion pack demonstrating bundled extensions including a command center, navigation ribbon, theme, and data seeds.

### 9. example-theme-harbor.json
An ocean-inspired CSS-only theme that uses gradient headers and nautical accents to verify theme installs.

### 10. example-mod-focus.json
A mixed CSS/JS mod that adds a focus toggle (Shift+Z), floating ribbon, and live list counts for testing full-mod behavior.

### 11. example-plugin-progress.json
A checklist-aware plugin that shows progress chips based on markdown checkboxes on cards to validate plugin installs.

## Creating Your Own Extension

### Basic Structure
```json
{
  "meta": {
    "name": "My Extension",
    "type": "Plugin",
    "version": "1.0.0",
    "creator": "Your Name",
    "description": "What it does",
    "source": "community",
    "ai_assistants": ""
  },
  "js": "// Your JavaScript code here",
  "css": "/* Your CSS styles here */"
}
```

### Extension Metadata Fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Display name of the extension |
| `type` | Yes | One of: Theme, Patch, Plugin, Mod, Kit, Expansion |
| `version` | Yes | Semantic version (e.g., "1.0.0") |
| `creator` | No | Author name |
| `description` | No | Brief description |
| `source` | No | "official" or "community" (v0.12.2+) |
| `ai_assistants` | No | AI tools used in creation (v0.12.2+) |

### Using the CardSpoke API
```javascript
// Access the API
const api = window.CardSpoke.utils;

// Create cards
await api.createCard({ title: 'My Card', body: 'Content', tags: ['tag1'] });

// Update cards
await api.updateCard(cardId, { title: 'New Title' });

// Add/remove tags
await api.addTag(cardId, 'my-tag');
await api.removeTag(cardId, 'old-tag');

// Show notifications
await api.showToast('Hello!', 'success');

// Search cards
const results = await api.searchCards('query');
```

### Registering Hooks
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
  },
  onCardDelete(ctx, card) {
    console.log('Card deleted:', card.id);
  },
  onCardRender(ctx, card, element) {
    // Modify card appearance
  }
});
```

## Best Practices

1. **Test in Playground first** - Use the Playground to test code before creating an extension
2. **Use meaningful names** - Make your extension easy to identify
3. **Handle errors** - Wrap code in try/catch to prevent crashes
4. **Document your extension** - Include a description of what it does
5. **Version your extensions** - Use semantic versioning (1.0.0)

## Resources

- [API Reference](../../docs/api-reference.md)
- [AI Developer Guide](../../AI_DEVELOPER_GUIDE.md)
- [CardSpoke GitHub](https://github.com/jxburros/CardSpoke)

---

*Happy extending!*
