# CardSpoke

> A lightweight, extensible, multi-platform knowledge base framework

CardSpoke is an open-source knowledge management system that combines hierarchical notes ("cards"), modular extensions ("mods"), and local-first data design. Built with simplicity and extensibility at its core, CardSpoke helps you organize your thoughts, projects, and ideas in a way that makes sense to you.

## 🌟 Current Version: 0.11.2

The v0.11 release series introduces the **Developer Ecosystem** with comprehensive tools for extension development, building upon the knowledge graph features from v0.11.0.

### What's New in 0.11.2

**Developer Ecosystem**
- **Extension Wizard**: Interactive wizard for creating new extensions with templates
  - Step-by-step guidance for choosing extension type
  - Automatic generation of manifest and skeleton code
  - Support for Theme, Patch, Plugin, Mod, and Expansion types
  - Download as JSON or install directly
- **Playground**: Sandboxed environment for testing extension code
  - Split-view interface with code editor and console output
  - Live code execution with error handling
  - Pre-loaded examples demonstrating CIB.utils API
  - Safe testing environment with isolated execution
- **CIB.utils API**: Exposed developer utility functions
  - Complete API for card management (create, update, search)
  - Tag management functions (get, add, remove, set)
  - Toast notifications and dataset metadata access
  - Comprehensive JSDoc documentation and error handling

**Enhanced Testing**
- All 152 tests passing with full backward compatibility
- New developer features fully integrated with existing systems

### What's New in 0.11.1

**CIB.utils API**
- Exposed window.CIB.utils for extension developers
- Safe, documented API for mods to interact with CardSpoke
- Functions for card management, tags, search, and notifications


**Backlinks & Related Cards**
- Automatic backlink detection shows which cards link to the current card
- Related cards suggestions based on shared tags and connections
- Bidirectional navigation between connected cards
- Enhanced content discovery through relationship mapping
- Dedicated section in card detail view showing all connections

**Enhanced Testing**
- 152 comprehensive tests (up from 127 in v0.10.6)
- 25 dedicated tests for Backlinks and Related Cards
- Tests cover link detection, relationship mapping, and edge cases
- Fast execution (<15ms) with uvu test framework
- 100% test pass rate across all features

**Testing Suite Breakdown**
- Backlinks & Related: 25 tests
- Card Links: 20 tests
- Tags API: 19 tests
- Search & Navigation: 15 tests
- Card Lookup: 14 tests
- Navigator Suite: 14 tests
- Store Structure: 12 tests
- UI State: 11 tests
- Multi-Dataset Search: 10 tests
- Card Operations: 10 tests
- Version Validation: 2 tests

### What's New in 0.10.5

**Tags API**
- Comprehensive tag management system with five core functions
- `getTags(cardId)` - Retrieve all tags for a specific card
- `addTag(cardId, tag)` - Add a tag to a card with automatic normalization
- `removeTag(cardId, tag)` - Remove a tag from a card
- `setTags(cardId, tags)` - Set all tags for a card at once
- `getAllTags()` - Get all unique tags across all cards
- Tags are automatically normalized (lowercase, no # prefix required)
- Duplicate tag prevention built-in

**Enhanced Testing**
- 117 comprehensive tests (up from 62 in v0.9.3)
- 19 dedicated tests for Tags API coverage
- Tests cover card operations, links, lookup, search, navigation, and UI state
- Fast execution (<11ms) with uvu test framework
- 100% test pass rate across all features

**Testing Suite Breakdown**
- Card Links: 20 tests
- Tags API: 19 tests
- Search & Navigation: 15 tests
- Card Lookup: 14 tests
- Navigator Suite: 14 tests
- Store Structure: 12 tests
- UI State: 11 tests
- Card Operations: 10 tests
- Version Validation: 2 tests

### What's New in 0.9.4

**Dataset Architecture**
- StorageDriver interface with IndexedDB and LocalStorage implementations
- DatasetManager class for managing multiple datasets
- Infrastructure for PIN-protected datasets (ready for implementation)
- Support for on-device storage choice between storage backends

**Dataset Info Panel**
- View detailed storage statistics and metadata
- See card counts, extensions, bookmarks, and recent cards
- Monitor storage usage and quota consumption
- Quick access to export and dataset switching actions

**Storage Analytics**
- Real-time storage size calculations
- Storage quota monitoring with percentage usage
- Item counting across all localStorage data
- Formatted byte display (Bytes, KB, MB, GB)

### What's New in 0.9.3

**Fuzzy Search**
- Typo-tolerant search using Levenshtein distance algorithm
- Find cards even with misspellings or variations
- Results ranked by relevance with fuzzy match indicators
- Improved search accuracy and user experience

**Export Options**
- Export to Markdown (.md) with hierarchical structure
- Export to CSV (.csv) for spreadsheet analysis
- Maintain existing JSON and TXT export options
- Preserve metadata and tags in exports

**High Contrast Mode**
- WCAG AAA compliant accessibility theme
- Pure black background with white text and borders
- Toggle in menu for vision accessibility
- Improved readability for users with visual impairments

**Enhanced Testing**
- 62 comprehensive tests (up from 37)
- Navigator Suite and UI State test coverage
- ES Module support throughout
- 100% test pass rate in <7ms

### What's New in 0.9.2

**Keyboard Shortcuts**
- Comprehensive keyboard navigation system
- Press `Ctrl+/` (or `Cmd+/` on Mac) to see all available shortcuts
- Quick access to common actions (new card, search, bookmarks, etc.)
- Improved accessibility and productivity

**Testing Infrastructure**
- 37 automated tests covering core functionality
- Test suite for card operations, search, and navigation  
- Fast execution (<5ms) with uvu test framework
- Foundation for future test-driven development

### What's New in 0.9.1

Version 0.8.2 introduces **responsive layout design** for optimal viewing on all devices (mobile, tablet, desktop) and integrates the **Navigator Suite** features for enhanced navigation and organization.

### What's New in 0.8.2

### What's New in 0.9.1

**Extension Error Handling**
- User-facing error notifications when extensions malfunction
- Toast notifications display mod ID and hook name for easy debugging
- Improved stability with better error isolation for extensions
- Enhanced developer experience with clear error context


**Responsive Design**
- Mobile-first responsive layout with breakpoints for phones, tablets, and desktops
- Touch-friendly UI elements optimized for mobile interaction
- Adaptive font sizes and spacing for different screen sizes

**Navigator Suite Features**
- **Card Duplication**: Clone cards with or without children for quick content reuse
- **Bookmarks**: Star important cards for quick access
- **Recent Cards**: Track recently viewed/edited cards
- **Compact View**: Switch between normal and compact card display modes
- **Enhanced Save Status**: Improved save status indicators and feedback

## ✨ Key Features

- **📝 Card-Based Organization**: Hierarchical note system with parent-child relationships
- **🎨 Extensible Architecture**: Modular design with support for themes, plugins, and extensions
- **💾 Local-First Storage**: Your data stays on your device with multiple storage options
- **🔒 Privacy-Focused**: Optional PIN protection for sensitive datasets
- **🌐 Cross-Platform**: Single codebase runs on Web, Desktop, Android, and iOS
- **🎯 Lightweight & Fast**: Minimal dependencies, quick load times, responsive UI
- **🔍 Search & Tags**: Multi-dataset search with fuzzy matching and flexible tagging system
- **🌙 Dark Mode**: Built-in theme support with customizable appearance
- **⭐ Navigator Suite**: Bookmarks, recent cards, card duplication, and compact view
- **📱 Responsive Design**: Optimized for mobile, tablet, and desktop devices

## 🚀 Quick Start

### Web Version
Simply open `www/index.html` in any modern web browser.

### Installation for Development

1. Clone the repository:
   ```bash
   git clone https://github.com/jxburros/CardSpoke.git
   cd CardSpoke
   ```

2. Install dependencies:
   ```bash
   npm install
   ```
3. Install the @capacitor/android package.
   ```bash
   npm install @capacitor/android
   ```
4. Add the Android platform.
   ```bash
   npx cap add android
   ```
5. Sync to native platforms (optional):
   ```bash
   npm run sync           # All platforms
   npm run sync:android   # Android only
   npm run sync:ios       # iOS only
   ```
To run this file in Android Studio:
   ```bash
   npx cap open android
   ```

For detailed build instructions and platform-specific guides, see [README-CAPACITOR.md](README-CAPACITOR.md).


## 📦 Required Files

To run CardSpoke, you need the following files from the repository:

### Core Application Files (Required)
These files are essential for the app to function:

```
www/
├── index.html          # Main HTML structure (required)
├── app.js              # Application logic (required)
├── styles.css          # Application styles (required)
└── capacitor.js        # Capacitor initialization (optional, for native builds)
```

### Configuration Files

**For Web-Only Usage:**
- `www/index.html`
- `www/app.js`
- `www/styles.css`

**For Native Builds (Android/iOS):**
- All files from "Core Application Files" above
- `capacitor.config.json` - Capacitor configuration
- `package.json` - Dependencies and build scripts
- `package-lock.json` - Locked dependency versions

### Optional Files
- `LICENSE` - ISC license information
- `README.md` - This documentation
- `AI_DEVELOPER_GUIDE.md` - Guide for AI-assisted development
- `Road Map V2.md` - Development roadmap
- Documentation files (`*.md`)

### Files NOT Needed for Running
These files are auto-generated or platform-specific:
- `node_modules/` - Auto-generated by npm install
- `android/` - Auto-generated by Capacitor sync
- `ios/` - Auto-generated by Capacitor sync
- `reports/` - Development reports and planning docs
- `tests/` - Test suite (for development only)

### Minimum Setup for Web

To run CardSpoke as a web app, you only need 3 files:
1. Copy `www/index.html`
2. Copy `www/app.js`
3. Copy `www/styles.css`

Open `index.html` in any modern web browser - no build step required!

### Setup for Development

For full development environment:
```bash
# Clone repository
git clone https://github.com/jxburros/CardSpoke.git
cd CardSpoke

# Install dependencies (only needed for native builds or testing)
npm install

# Run tests (optional)
npm test

# For native builds
npm run sync           # Sync to all platforms
npm run sync:android   # Android only
npm run sync:ios       # iOS only
```

### Build Requirements

**No build required** for web version - CardSpoke uses vanilla JavaScript and runs directly in the browser.

**For native builds:**
- Node.js (v16 or higher)
- npm (comes with Node.js)
- For Android: Android Studio
- For iOS: Xcode (Mac only)



## ⭐ Navigator Suite

The Navigator Suite provides powerful features for navigating and organizing your cards efficiently.

### 📌 Bookmarks

Star your most important cards for quick access:

- **Add Bookmark**: Click the star icon (★) in the card header when viewing any card
- **View Bookmarks**: Open the menu (☰) and select "★ Bookmarks"
- **Remove Bookmark**: Click the "Remove" button next to any bookmarked card, or click the filled star (★) in the card header

Bookmarks persist across sessions and sync with your instance data.

### ⏱ Recent Cards

Automatically track your recently viewed or edited cards:

- **View Recent Cards**: Open the menu (☰) and select "⏱ Recent Cards"
- **Access History**: Up to 10 most recent cards are kept in chronological order
- **Quick Navigation**: Click any card in the recent list to jump directly to it

Recent cards update automatically as you navigate and are stored with your instance.

### 📋 Card Duplication

Clone cards to reuse content and structure:

- **Duplicate a Card**: When viewing a card, click the "Duplicate Card" button
- **Choose Clone Depth**: 
  - Select "Card Only" to copy just the card content
  - Select "With Children" to recursively copy all descendant cards
- **Result**: A new card is created with "[COPY]" appended to the title

Perfect for templates, repetitive structures, or branching ideas.

### 🎨 Compact View Mode

Switch between display modes to suit your workflow:

- **Toggle View Mode**: Open the menu (☰) and use the "Compact View" toggle switch
- **Normal Mode**: Full card display with complete content preview
- **Compact Mode**: Condensed layout showing more cards at once
- **Persistence**: View mode preference is saved to your instance

Ideal for browsing large collections or focusing on card titles.

### 💾 Save Status Indicator

Real-time feedback on data persistence:

- **Saving (●)**: Orange indicator appears when changes are being saved
- **Saved (✓)**: Green checkmark confirms successful save
- **Error (✕)**: Red X indicates save failure with error details

Located in the header next to the home button, hover over the indicator to see the last save time.


## 📱 Platform Support

- ✅ **Web**: Modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ **Android**: Via Capacitor native builds
- ✅ **iOS**: Via Capacitor native builds
- ✅ **Desktop**: Electron support (planned)

## 🎯 Core Philosophy

CardSpoke is built on these principles:

- **Lightweight**: Prioritize clarity, speed, and minimalism
- **Portable**: User data lives locally and exports easily
- **Extendable**: Every feature should be mod-ready
- **Readable**: Human-understandable schema and code
- **Educational**: Easy to learn, modify, and fork

## 📚 Documentation

- [README-CAPACITOR.md](README-CAPACITOR.md) - Detailed setup and build instructions
- [Road Map V2.md](Road%20Map%20V2.md) - Development roadmap and feature planning
- [Extension Features.md](Extension%20Features%20(1).md) - Planned extensions and mods
- [BRANCH_INFO.md](BRANCH_INFO.md) - Current branch information

## 🗺️ Roadmap

CardSpoke is actively developed with a clear path to version 1.0. Current focus areas:

- ✅ **v0.7**: Foundation Overhaul - UI redesign, Schema v4
- ✅ **v0.8**: Capacitor Migration & Navigator Suite - Cross-platform support, responsive design
- 🚧 **v0.9**: Dataset Architecture - Multi-dataset support, local storage (Current)
- 📅 **v0.10**: Extensions Framework - Mod/Theme Manager, tagging, search
- 📅 **v0.11**: Developer Ecosystem - Wizard, Playground, utilities
- 📅 **v0.12**: Safety & Governance - Mod safety, Rewind, Deviations
- 📅 **v0.13**: UX Polish & Undo - Optimization, visual polish
- 📅 **v0.14**: Documentation & Open Source Prep
- 🎯 **v1.0**: Stable Platform Release

See the [Road Map V2.md](Road%20Map%20V2.md) for complete version details and feature planning.

## 🧩 Project Structure

```
CardSpoke/
├── www/                    # Web assets
│   ├── index.html         # Main HTML file
│   ├── styles.css         # Application styles
│   ├── app.js             # Application JavaScript
│   └── capacitor.js       # Capacitor initialization
├── android/               # Android native project (generated)
├── ios/                   # iOS native project (generated)
├── capacitor.config.json  # Capacitor configuration
├── package.json           # Node.js dependencies
└── README.md              # This file
```

## 🛠️ Technology Stack

- **Core**: Vanilla JavaScript (no heavy frameworks)
- **UI**: Custom CSS with design tokens
- **Storage**: Capacitor Preferences, IndexedDB
- **Cross-Platform**: Capacitor
- **Build System**: Node.js, npm

## 🤝 Contributing

CardSpoke is designed to be a learning environment for developers exploring "vibe-code" and modding. Contributions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with ❤️ by [jxburros](https://github.com/jxburros)
- Powered by [Capacitor](https://capacitorjs.com/) for cross-platform support
- Font: [Inter](https://fonts.google.com/specimen/Inter) & [Outfit](https://fonts.google.com/specimen/Outfit)

## 📞 Support & Contact

- 🐛 **Issues**: [GitHub Issues](https://github.com/jxburros/CardSpoke/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/jxburros/CardSpoke/discussions)

---

**CardSpoke** - Making information management make sense.

## ⌨️ Keyboard Shortcuts

CardSpoke includes comprehensive keyboard shortcuts for efficient navigation and actions. Press `Ctrl+/` (or `Cmd+/` on Mac) in the app to see the full list.

### Navigation
- `Ctrl+H` - Go to Home (card list)
- `Ctrl+B` - Show bookmarks
- `Ctrl+R` - Show recent cards
- `Escape` - Close modals or go back

### Actions
- `Ctrl+N` - Create new card
- `Ctrl+F` - Focus search bar
- `Ctrl+U` - Upload data
- `Ctrl+E` - Show extensions

### View
- `Alt+T` - Toggle dark/light theme
- `Alt+C` - Toggle compact view mode

### Help
- `Ctrl+/` - Show keyboard shortcuts help

**Note:** On Mac, use `Cmd` instead of `Ctrl` for most shortcuts.

