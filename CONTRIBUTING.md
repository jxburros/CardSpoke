# Contributing to CardSpoke

Thank you for your interest in contributing to CardSpoke! This document provides guidelines and instructions for contributing to the project.

## 📋 Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [How to Contribute](#how-to-contribute)
4. [Development Setup](#development-setup)
5. [Coding Standards](#coding-standards)
6. [Testing](#testing)
7. [Pull Request Process](#pull-request-process)
8. [Extension Development](#extension-development)

---

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

---

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm (comes with Node.js)
- Git
- A modern web browser (Chrome, Firefox, Safari, or Edge)

### Understanding the Project

CardSpoke is a lightweight, extensible knowledge base framework built with:
- **Vanilla JavaScript** (no heavy frameworks)
- **Custom CSS** with design tokens
- **Capacitor** for cross-platform native builds
- **Local-first data storage** (LocalStorage, IndexedDB)

Read the [AI_DEVELOPER_GUIDE.md](AI_DEVELOPER_GUIDE.md) for a deep dive into the architecture.

---

## How to Contribute

### Reporting Bugs

1. Check the [GitHub Issues](https://github.com/jxburros/CardSpoke/issues) to see if it's already reported
2. If not, open a new issue with:
   - A clear, descriptive title
   - Steps to reproduce the bug
   - Expected behavior vs actual behavior
   - Browser/platform information
   - Screenshots if applicable

### Suggesting Features

1. Check existing issues and the [Road Map](Road%20Map%20V2.md)
2. Open a new issue with the "Feature Request" label
3. Describe the feature and its use case
4. Explain how it fits CardSpoke's core philosophy

### Submitting Code

1. Fork the repository
2. Create a feature branch from `main`
3. Make your changes
4. Run tests
5. Submit a pull request

---

## Development Setup

### Clone and Install

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/CardSpoke.git
cd CardSpoke

# Install dependencies
npm install

# Run tests
npm test
```

### Running Locally

For web development, simply open `www/index.html` in a browser. No build step required!

### Building for Mobile

```bash
# Sync to all platforms
npm run sync

# Open in Android Studio
npm run open:android

# Open in Xcode (Mac only)
npm run open:ios
```

---

## Coding Standards

### JavaScript

- Use vanilla JavaScript (no external frameworks)
- Follow existing code patterns and naming conventions
- Use JSDoc comments for functions
- Keep functions small and focused
- Maintain backward compatibility

### Example Function

```javascript
/**
 * Creates a new card with the given properties.
 * @param {string} title - The card title
 * @param {string} body - The card body content
 * @param {string|null} parentId - Parent card ID or null for root
 * @returns {Object} The created card object
 */
function createCard(title, body, parentId = null) {
  // Implementation
}
```

### CSS

- Use the existing design token system
- Follow the BEM-like naming convention
- Support both light and dark themes
- Ensure responsive design (mobile-first)

### HTML

- Keep `index.html` minimal
- Use semantic HTML elements
- Maintain accessibility (ARIA labels, keyboard navigation)

---

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Watch mode (re-runs on changes)
npm run test:watch
```

### Writing Tests

- Tests are located in the `tests/` directory
- Use the `uvu` testing framework
- Follow existing test patterns
- Cover edge cases and error handling

### Test Example

```javascript
import { test } from 'uvu';
import * as assert from 'uvu/assert';

test('function should do something', () => {
  const result = someFunction();
  assert.is(result, expectedValue);
});

test.run();
```

---

## Pull Request Process

### Before Submitting

1. **Test your changes** - Run `npm test` and ensure all tests pass
2. **Update documentation** - If you changed behavior, update relevant docs
3. **Follow version guidelines** - Update version numbers if needed (see AI_DEVELOPER_GUIDE.md)
4. **Keep changes focused** - One feature or fix per PR

### PR Requirements

- Clear, descriptive title
- Description of what changed and why
- Reference any related issues
- Screenshots for UI changes
- Passing tests

### Review Process

1. A maintainer will review your PR
2. Address any feedback or requested changes
3. Once approved, the PR will be merged

---

## Extension Development

CardSpoke supports a rich extension ecosystem. To create extensions:

### Extension Types

| Type | Description |
|------|-------------|
| **Theme** | CSS-only cosmetic changes |
| **Patch** | Small fixes or adjustments |
| **Plugin** | New features without modifying core |
| **Mod** | Features that modify core behavior |
| **Expansion** | Large feature bundles |

### Getting Started with Extensions

1. Use the in-app **Extension Wizard** (Menu → Extensions → Create New)
2. Or use the **Playground** to test code
3. Access the `CardSpoke.utils` API for card operations

### CardSpoke.utils API

```javascript
// Available in window.CardSpoke.utils
CardSpoke.utils.createCard(title, body, parentId);
CardSpoke.utils.updateCard(cardId, updates);
CardSpoke.utils.searchCards(query);
CardSpoke.utils.getTags(cardId);
CardSpoke.utils.addTag(cardId, tag);
CardSpoke.utils.showToast(message, type);
```

See the [AI_DEVELOPER_GUIDE.md](AI_DEVELOPER_GUIDE.md) for complete API documentation.

---

## Questions?

- Open an issue with the "Question" label
- Check [GitHub Discussions](https://github.com/jxburros/CardSpoke/discussions)

---

**Thank you for contributing to CardSpoke!** 🎉

Your contributions help make knowledge management better for everyone.
