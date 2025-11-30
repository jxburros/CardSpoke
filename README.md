# CardSpoke

**A lightweight, extensible, multi-platform knowledge base framework**

CardSpoke is a powerful yet minimalist note-taking and knowledge management application that runs entirely in your browser. Build hierarchical card-based notes, organize with tags, search across datasets, and customize with a robust extension system—all without requiring a server or cloud connection.

---

## Key Features

### 🗂️ **Hierarchical Card System**
- Create unlimited nested cards with parent-child relationships
- Rich text editing with Markdown preview
- Automatic timestamps and metadata tracking
- Drag-and-drop to reorganize card hierarchy

### 🏷️ **Smart Tagging**
- Add multiple tags to any card for flexible organization
- Tag Manager for bulk operations (rename, merge, delete)
- Tag-based filtering and suggestions
- All tags indexed for instant searching

### 🔍 **Powerful Search**
- **Fuzzy Search**: Typo-tolerant search using Levenshtein distance algorithm
- **Multi-Dataset Search**: Search across all your datasets simultaneously
- **Advanced Filtering**: Filter by tags, bookmarks, and date ranges
- **Backlinks**: Discover which cards link to the current card
- **Related Cards**: Intelligent suggestions based on tags and connections

### 🧭 **Navigation Suite**
- **Bookmarks**: Star important cards for quick access
- **Recent Cards**: Track your last 10 viewed cards
- **Breadcrumb Navigation**: Visual path through card hierarchy
- **Card Duplication**: Clone cards with or without children
- **Compact View**: Toggle between normal and condensed layouts

### ⏱️ **Undo/Redo System**
- Full undo/redo with 50-item stack
- Tracks all card operations (create, update, delete, tag changes)
- Trash Bin for recovering deleted cards
- Keyboard shortcuts: `Ctrl+Z` (undo), `Ctrl+Y` (redo)

### 💾 **Data Management**
- **Multiple Datasets**: Switch between isolated data collections
- **Import Formats**: JSON, TXT, DOCX, Mod files
- **Export Formats**: JSON, Markdown, CSV, Plain text
- **Bulk Operations**: Import/export multiple cards
- **Manual Backups**: Export to external storage anytime
- **IndexedDB Storage**: 50MB+ capacity per app
- **LocalStorage Fallback**: Compatible with older browsers

### ♿ **Accessibility Features**
- **Dark/Light Theme**: System-aware with manual toggle
- **Typography Presets**: Default, Comfortable, Compact, Dyslexia-friendly
- **High Contrast Mode**: WCAG AAA compliant
- **Keyboard Navigation**: Full keyboard support with shortcuts
- **ARIA Labels**: Semantic HTML for screen readers
- **Focus Management**: Proper focus trapping in modals

### 🎨 **Extension System**
- **6 Extension Types**: Theme, Patch, Plugin, Mod, Kit, Expansion
- **14 Lifecycle Hooks**: Hook into app initialization, card operations, navigation, and more
- **Extension Wizard**: Interactive UI to create new extensions
- **Playground**: Sandboxed environment to test extension code
- **Safe Execution**: Auto-disable extensions after 3 consecutive errors
- **Hot Reload**: Apply changes without restart

### ⌨️ **Keyboard Shortcuts**
| Action | Shortcut |
|--------|----------|
| Home | `Ctrl+H` |
| Search | `Ctrl+F` |
| New Card | `Ctrl+N` |
| Bookmarks | `Ctrl+B` |
| Recent Cards | `Ctrl+R` |
| Undo | `Ctrl+Z` |
| Redo | `Ctrl+Y` |
| Duplicate Card | `Ctrl+D` |
| Extensions | `Ctrl+E` |
| Tag Input Focus | `Ctrl+T` |
| Go to Parent | `Ctrl+[` |
| Go to First Child | `Ctrl+]` |
| Toggle Theme | `Alt+T` |
| Compact View | `Alt+C` |
| Grid View | `Ctrl+G` |
| Keyboard Shortcuts | `Ctrl+/` |
| Back | `Escape` |

---

## Technology Stack

### Core
- **Language**: Vanilla JavaScript (ES6+)
- **UI**: Custom HTML/CSS (no heavy frameworks)
- **Storage**: IndexedDB (primary) + LocalStorage (fallback)
- **Build**: No build step required for web version

### Cross-Platform
- **Capacitor**: v7.4.4 (Android, iOS support)
- **Plugins**: Filesystem, Preferences, App

### Testing
- **Framework**: uvu (lightweight test runner)
- **Coverage**: 188+ tests across 18 test files
- **Execution**: <15ms total

---

## Quick Start

### Web Version (Instant)

1. **Clone the repository**
   ```bash
   git clone https://github.com/jxburros/CardSpoke.git
   cd CardSpoke
   ```

2. **Open in browser**
   ```bash
   # Simply open www/index.html in any modern browser
   open www/index.html
   # or
   firefox www/index.html
   # or serve with any static file server
   python3 -m http.server 8000 --directory www
   ```

3. **Start creating cards**
   - No installation, no build process, no dependencies!

### Development Setup

```bash
# Install dependencies (for native builds and testing)
npm install

# Run tests
npm test                    # Run tests once
npm run test:watch         # Watch mode for development
```

### Native Builds

#### Android

```bash
# Prerequisites: Android Studio installed

# Add Android platform (first time only)
npx cap add android

# Sync web assets to Android project
npm run sync:android

# Open in Android Studio
npm run open:android

# Build APK using Android Studio's build system
```

#### iOS

```bash
# Prerequisites: macOS with Xcode installed

# Add iOS platform (first time only)
npx cap add ios

# Sync web assets to iOS project
npm run sync:ios

# Open in Xcode
npm run open:ios

# Build and deploy using Xcode
```

---

## Project Structure

```
CardSpoke/
├── www/                           # Web application files
│   ├── index.html                 # App entry point
│   ├── app.js                     # Core application logic
│   ├── styles.css                 # All styling (54 KB)
│   ├── capacitor.js               # Capacitor bridge
│   ├── test.html                  # Test runner
│   ├── diagnostic.html            # Debug utilities
│   └── modules/                   # ES Modules (v0.15.0+)
│       ├── core/                  # Core functionality
│       │   ├── utils.js           # Utility functions (h, uid, debounce, etc.)
│       │   ├── state.js           # Application state management
│       │   └── storage.js         # Storage driver implementations
│       ├── ui/                    # UI components
│       │   ├── toast.js           # Toast notifications
│       │   └── appearance.js      # Theme and appearance settings
│       └── index.js               # Module exports
│
├── tests/                         # Test suite (18 files, 188+ tests)
│   ├── helpers.js                 # Shared test utilities
│   ├── accessibility-api.test.js
│   ├── backlinks-related.test.js
│   ├── card-links.test.js
│   ├── card-lookup.test.js
│   ├── card-operations.test.js
│   ├── footer.test.js
│   ├── menu-handlers.test.js
│   ├── multi-dataset-search.test.js
│   ├── navigator-suite.test.js
│   ├── search-navigation.test.js
│   ├── store-structure.test.js
│   ├── tag-management.test.js
│   ├── tags-api.test.js
│   ├── ui-state.test.js
│   ├── undo-redo.test.js
│   └── version-validation.test.js
│
├── types/                         # TypeScript definitions
│   └── extensions.d.ts            # Extension API types
│
├── docs/                          # Developer documentation
│   ├── api-reference.md           # Complete API docs
│   ├── extension-cookbook.md      # Extension patterns
│   ├── mod-capability-taxonomy.md # Extension type definitions
│   ├── schema-reference-v0.13.md  # Data schema
│   └── storage-driver-interface.md
│
├── android/                       # Android native project
├── ios/                           # iOS native project
│
├── package.json                   # Project metadata
├── capacitor.config.json          # Capacitor configuration
│
└── README.md                      # This file
```

---

## Data Storage

### Storage Architecture

CardSpoke uses a **local-first** architecture with multiple storage layers:

1. **In-Memory Store**: Runtime data structure for fast access
2. **Storage Driver Layer**: Abstract interface supporting multiple backends
3. **Physical Storage**: IndexedDB (default) or LocalStorage (fallback)

### Store Structure

```javascript
{
  rootOrder: [],          // Root card IDs in display order
  cards: {                // All cards indexed by ID
    "card-id": {
      id: string,
      title: string,
      body: string,
      parentId: string | null,
      children: string[],
      tags: string[],
      createdAt: number,    // Unix timestamp (ms)
      updatedAt: number,    // Unix timestamp (ms)
      modsData: object      // Extension-specific data
    }
  },
  mods: {                 // Installed extensions
    "mod-id": { ... }
  },
  bookmarks: [],          // Bookmarked card IDs
  recentCards: [],        // Recently viewed (max 10)
  viewMode: 'normal',     // 'normal' or 'compact'
  activeTheme: 'light'    // 'light' or 'dark'
}
```

### Storage Drivers

- **IndexedDBDriver** (default): 50MB+ capacity, better performance
- **LocalStorageDriver** (fallback): ~5-10MB capacity, broader compatibility

### Dataset Management

Create multiple isolated datasets for different projects, topics, or contexts. Each dataset is stored independently with its own cards, tags, and settings.

---

## Extension Development

### Extension API

CardSpoke exposes `window.CardSpoke.utils` for extension developers:

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
CardSpoke.utils.setTheme('light' | 'dark')
CardSpoke.utils.getTheme()
CardSpoke.utils.setTypography('default' | 'comfortable' | 'compact' | 'dyslexia')
CardSpoke.utils.getTypography()
CardSpoke.utils.setHighContrast(enabled)
CardSpoke.utils.isHighContrast()
CardSpoke.utils.onThemeChange(callback)
CardSpoke.utils.getThemeVariables()

// UI
CardSpoke.utils.showToast(message, type?, duration?)
```

### Extension Hooks

Extensions can hook into 14 lifecycle events:

- `onAppInit` - App started
- `onEnable` - Extension enabled
- `onDisable` - Extension disabled
- `onUninstall` - Before removal
- `onCardSave` - Card saved
- `onCardDelete` - Card deleted
- `onCardRender` - Card rendered to DOM
- `onNavigate` - Navigation changed
- `onSearch` - Search completed
- `onThemeChange` - Theme toggled
- `onTypographyChange` - Typography changed
- `onHighContrastChange` - High contrast toggled
- `onExport` - Before export
- `onImport` - After import

### Extension Types

1. **Theme**: Visual styling and appearance
2. **Patch**: Bug fixes or minor tweaks
3. **Plugin**: Add new features
4. **Mod**: Modify existing behavior
5. **Kit**: Collection of related extensions
6. **Expansion**: Major feature additions

### Creating Extensions

Use the built-in **Extension Wizard** (Menu → Extensions Hub → Create New) to generate extension scaffolding, or manually create extensions using the provided API.

See `docs/extension-cookbook.md` for detailed examples and patterns.

---

## Testing

### Run Tests

```bash
# Run all tests once
npm test

# Watch mode for development
npm run test:watch
```

### Test Coverage

- **188+ tests** across 18 test files
- **Core functionality**: Card operations, tags, search, navigation
- **API coverage**: Extension API, accessibility API, tags API
- **Edge cases**: Error handling, boundary conditions
- **Execution time**: <15ms total

### Test Files

- `accessibility-api.test.js` - Theme, typography, high contrast
- `backlinks-related.test.js` - Card relationship discovery
- `card-links.test.js` - Card linking functionality
- `card-lookup.test.js` - Card retrieval operations
- `card-operations.test.js` - CRUD operations
- `footer.test.js` - Footer component
- `menu-handlers.test.js` - Menu interactions
- `multi-dataset-search.test.js` - Cross-dataset search
- `navigator-suite.test.js` - Bookmarks, recent, navigation
- `search-navigation.test.js` - Search UI behavior
- `store-structure.test.js` - Data store validation
- `tag-management.test.js` - Tag operations
- `tags-api.test.js` - Tags API
- `ui-state.test.js` - UI state management
- `undo-redo.test.js` - Undo/redo system
- `version-validation.test.js` - Version checking

---

## Deployment

### Web Hosting

CardSpoke requires **zero build process** for web deployment. Simply serve the `www/` directory:

```bash
# Any static file server works:
python3 -m http.server 8000 --directory www
# or
npx serve www
# or upload to:
# - GitHub Pages
# - Netlify
# - Vercel
# - Any static hosting
```

### Native Apps

Build native Android and iOS apps using Capacitor:

```bash
# Sync web assets to native projects
npm run sync

# Open in IDE
npm run open:android    # Android Studio
npm run open:ios        # Xcode

# Build using native IDE tools
```

---

## Browser Compatibility

### Minimum Requirements

- Modern browser with ES6+ support
- IndexedDB support (or LocalStorage as fallback)
- CSS Grid and Flexbox support

### Tested Browsers

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers on iOS 14+ and Android 8+

---

## Safe Mode

Launch CardSpoke with extensions disabled for debugging:

```
file:///path/to/www/index.html?safemode
```

This is useful when an extension causes issues or you need to troubleshoot.

---

## Contributing

We welcome contributions! CardSpoke is designed to be:

- **Lightweight**: Minimal dependencies, fast loading
- **Extensible**: Rich extension API for community additions
- **Accessible**: WCAG AAA compliant, keyboard-friendly
- **Well-tested**: Comprehensive test coverage
- **Well-documented**: Clear API reference and examples

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`npm test`)
6. Submit a pull request

### Code Style

- Use vanilla JavaScript (ES6+)
- Follow existing code patterns
- Add JSDoc comments for public APIs
- Keep functions small and focused
- Write tests for new features

---

## Architecture Principles

CardSpoke is built on these core principles:

- **Local-First**: All data stored on device, no cloud required
- **Privacy-Focused**: No tracking, no analytics, no data transmission
- **Zero Dependencies**: Runs without external libraries (for web version)
- **Extensible**: Rich API for community-driven features
- **Accessible**: WCAG compliant, keyboard navigation
- **Cross-Platform**: Web, Android, iOS from single codebase
- **Lightweight**: Single-file application (~356 KB)
- **Well-Tested**: Comprehensive automated test suite

---

## Version Information

- **Version**: 0.15.0 (from app.js)
- **Schema**: v4
- **Release Date**: 2025-11-30
- **Creator**: jxburros
- **License**: ISC

---

## License

ISC License - See LICENSE file for details

---

## Support

- **Documentation**: See `docs/` directory
- **Issues**: Report bugs via GitHub Issues
- **API Reference**: `docs/api-reference.md`
- **Extension Cookbook**: `docs/extension-cookbook.md`
- **Testing Guide**: `tests/README.md`

---

## Acknowledgments

CardSpoke is built with:
- **Capacitor** - Cross-platform native runtime
- **uvu** - Lightweight test framework
- **Inter & Outfit** - Google Fonts

---

**Built with ❤️ by jxburros**

A lightweight, extensible knowledge base for the modern web.
