# CardSpoke 0.15.0 - Capacitor Edition

CardSpoke is a lightweight, extensible, multi-platform knowledge base framework. Version 0.15.0 introduces ES modules architecture for better maintainability, featuring comprehensive testing (188 tests), and builds on the Dataset Architecture introduced in v0.9.

## Branch Information

This documentation covers CardSpoke with Capacitor support for cross-platform deployment. The application has evolved from the original single-file version through multiple iterations to the current v0.15.0 with comprehensive features and modular architecture.

## What's New in 0.15.0

**ES Modules Refactoring** (v0.15.0)
- Modular codebase with core/utils, core/state, core/storage, ui/toast, ui/appearance modules
- Better code organization and maintainability
- Full backward compatibility maintained
- Preparation for future 1.0.0 stable release

**Accessibility & Extensions** (v0.14.0)
- Accessibility API enhancements
- Theme customization for extensions
- Lifecycle hooks (onEnable, onDisable, onUninstall)
- Async hook support
- Event bus for inter-extension communication

**Backlinks & Related Cards** (v0.11.0)
- Automatic backlink detection shows which cards link to the current card
- Related cards suggestions based on shared tags and connections
- Bidirectional navigation between connected cards
- Enhanced content discovery through relationship mapping
- 25 dedicated tests for Backlinks and Related Cards

**Tags API** (v0.10.5)
- Comprehensive tag management with `getTags`, `addTag`, `removeTag`, `setTags`, and `getAllTags`
- Automatic tag normalization and duplicate prevention
- 19 dedicated tests for Tags API coverage

**Dataset Architecture** (v0.9.4)
- StorageDriver interface with IndexedDB and LocalStorage implementations
- DatasetManager class for managing multiple datasets
- Infrastructure for PIN-protected datasets
- Dataset info panel with storage statistics

**Testing** (v0.15.0)
- 188 comprehensive tests across 18 test files
- Fast execution (<25ms) with uvu test framework
- 100% test pass rate

**Core Features**
- Fuzzy search with typo tolerance
- Export options: JSON, TXT, Markdown, CSV
- High contrast mode for accessibility
- Keyboard shortcuts system
- Navigator Suite: bookmarks, recent cards, card duplication, compact view
- Responsive design for mobile, tablet, and desktop
- Cross-platform support via Capacitor

## Project Structure

```
CardSpoke/
├── www/                    # Web assets
│   ├── index.html         # Main HTML file
│   ├── styles.css         # Application styles
│   ├── app.js             # Application JavaScript (main entry)
│   ├── capacitor.js       # Capacitor initialization
│   └── modules/           # ES Modules (v0.15.0+)
│       ├── core/          # Core functionality
│       │   ├── utils.js   # Utility functions
│       │   ├── state.js   # Application state
│       │   └── storage.js # Storage drivers
│       ├── ui/            # UI components
│       │   ├── toast.js   # Toast notifications
│       │   └── appearance.js # Theme/appearance
│       └── index.js       # Module exports
├── android/               # Android native project (generated)
├── ios/                   # iOS native project (generated)
├── capacitor.config.json  # Capacitor configuration
├── package.json           # Node.js dependencies
└── README-CAPACITOR.md    # This file
```

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Development

### Web Development
Simply open `www/index.html` in a web browser or serve it with any web server.

### Syncing Changes to Native Platforms
After making changes to web assets, sync them to native platforms:

```bash
npm run sync           # Sync to all platforms
npm run sync:android   # Sync to Android only
npm run sync:ios       # Sync to iOS only
```

### Opening Native IDEs

To open the native projects in their respective IDEs:

```bash
npm run open:android   # Open Android Studio
npm run open:ios       # Open Xcode
```

## Building for Production

### Android
1. Sync your changes: `npm run sync:android`
2. Open Android Studio: `npm run open:android`
3. Build APK or App Bundle through Android Studio

### iOS
1. Sync your changes: `npm run sync:ios`
2. Open Xcode: `npm run open:ios`
3. Build and archive through Xcode

### Web
The files in the `www/` directory are ready to deploy to any web server.

## Capacitor Plugins Used

- **@capacitor/core**: Core Capacitor functionality
- **@capacitor/app**: App lifecycle and information
- **@capacitor/filesystem**: File system access
- **@capacitor/preferences**: Key-value storage (replaces localStorage)

## Migration from Earlier Versions

### From 0.14.x to 0.15.0
- No breaking changes - direct upgrade supported
- New ES modules structure is optional (backward compatible)
- All existing data and extensions remain compatible

### From 0.8.x to 0.15.0
Version 0.8 was a single HTML file application. The current version restructures the application into:
- Separate HTML, CSS, and JavaScript files
- ES modules for core functionality
- Capacitor configuration for multi-platform support
- Native project structures for Android and iOS

The core functionality remains the same, but the app can now be built and deployed as a native application.

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Developer Guide](https://developer.android.com/)
- [iOS Developer Guide](https://developer.apple.com/documentation/)

## License

See LICENSE file for details.
