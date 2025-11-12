# CardSpoke Test Suite

This directory contains automated tests for CardSpoke's core functionality.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Test Framework

We use [uvu](https://github.com/lukeed/uvu) - a minimal, fast test runner for Node.js.

## Test Files

### `helpers.js`
Test utilities and mock implementations:
- `MockLocalStorage` - localStorage mock for testing
- `createTestCard()` - Create test card objects
- `createTestStore()` - Create test store objects
- Core functions extracted for testing (search, bookmarks, etc.)

### `card-operations.test.js`
Tests for card CRUD operations:
- Creating cards
- Adding cards to store
- Deleting cards
- Card hierarchy management
- Recursive deletion

**Tests:** 10

### `search-navigation.test.js`
Tests for search and navigation features:
- Searching by title, body, and tags
- Case-insensitive search
- Bookmark management
- Recent cards tracking

**Tests:** 15

### `store-structure.test.js`
Tests for data store integrity:
- Store structure validation
- Card count management
- RootOrder integrity
- View mode toggling
- Complex hierarchy handling
- MockLocalStorage functionality

**Tests:** 12

## Coverage

Current test coverage focuses on:
- ✅ Card creation and deletion
- ✅ Hierarchical relationships
- ✅ Search functionality
- ✅ Bookmarks
- ✅ Recent cards
- ✅ Store integrity
- ✅ MockLocalStorage

Not yet covered:
- ❌ Import/Export operations
- ❌ Mod system hooks
- ❌ UI rendering
- ❌ Capacitor integrations

## Adding New Tests

1. Create a new test file in this directory (e.g., `feature-name.test.js`)
2. Import test utilities from `helpers.js`
3. Write tests using the uvu API:

```javascript
const { test } = require('uvu');
const assert = require('uvu/assert');

test('my feature works', () => {
  assert.is(1 + 1, 2);
});

test.run();
```

## Best Practices

- **Keep tests focused**: Each test should verify one specific behavior
- **Use descriptive names**: Test names should clearly state what they verify
- **Clean up after tests**: Ensure tests don't leave state behind
- **Test edge cases**: Include tests for empty inputs, invalid data, etc.
- **Keep tests fast**: Mock external dependencies (localStorage, DOM, etc.)

## Continuous Integration

Tests run automatically on every commit via GitHub Actions (when configured).

---

**Last Updated:** 2025-11-12  
**Test Count:** 37 tests

## Required Files for Testing

To run the test suite, you need:

### Essential Files
- `tests/helpers.js` - Test utilities and mock implementations
- `tests/*.test.js` - Test files (all files ending in .test.js)
- `package.json` - Contains test script configuration
- `node_modules/` - Dependencies (uvu test framework)

### Installation
```bash
# From repository root
npm install    # Installs uvu and other dev dependencies
```

### Files NOT Required
The test suite does NOT require:
- `www/` directory (tests use extracted logic from helpers.js)
- Browser environment (tests run in Node.js)
- Capacitor dependencies
- Native build tools

### Test-Only Dependencies
- `uvu` - Test framework (installed via `npm install`)

The test suite is designed to be lightweight and run without the full application stack, focusing on pure data logic testing.
