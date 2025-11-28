# CardSpoke Sample Extensions

This directory contains example extensions to help you learn how to create your own CardSpoke extensions.

## Extension Types

| Type | Description | Example |
|------|-------------|---------|
| **Theme** | CSS-only cosmetic changes | `sample-theme.json` |
| **Plugin** | Adds features without modifying core | `sample-plugin.json` |
| **Patch** | Small fixes or enhancements | `sample-patch.json` |

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

### 2. sample-plugin.json
A word count plugin that shows word counts for cards.

### 3. sample-patch.json
A patch that adds creation timestamps to card headers.

### 4. sample-plugin-mini.json
A tiny plugin that adds emoji markers to status tags. Useful for verifying that lightweight plugins install correctly.

### 5. sample-plugin-timer.json
A medium-size plugin that embeds a focus timer widget with presets, persistence, and toasts for feedback.

### 6. sample-theme-contrast.json
An accessibility-oriented, high-contrast theme to test CSS-only customizations with a larger style payload.

### 7. sample-patch-keyboard.json
A lightweight patch that introduces keyboard shortcuts for search, quick note creation, and board navigation.

## Creating Your Own Extension

### Basic Structure
```json
{
  "meta": {
    "name": "My Extension",
    "type": "Plugin",
    "version": "1.0.0",
    "creator": "Your Name",
    "description": "What it does"
  },
  "js": "// Your JavaScript code here",
  "css": "/* Your CSS styles here */"
}
```

### Using the CardSpoke API
```javascript
// Access the API
const api = window.CardSpoke.utils;

// Create cards
api.createCard('Title', 'Body');

// Add tags
api.addTag(cardId, 'my-tag');

// Show notifications
api.showToast('Hello!', 'success');

// Search cards
const results = api.searchCards('query');
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
