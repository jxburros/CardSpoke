# CardSpoke 0.10.5 - Capacitor Edition

CardSpoke is a lightweight, extensible, multi-platform knowledge base framework. Version 0.10.5 includes the Tags API, comprehensive testing (117 tests), and builds on the Dataset Architecture introduced in v0.9.

## Branch Information

This documentation covers CardSpoke with Capacitor support for cross-platform deployment. The application has evolved from the original single-file version through multiple iterations to the current v0.10.5 with comprehensive features.

## What's New in 0.10.5

**Tags API** (v0.10.5)
- Comprehensive tag management with `getTags`, `addTag`, `removeTag`, `setTags`, and `getAllTags`
- Automatic tag normalization and duplicate prevention
- 19 dedicated tests for Tags API coverage

**Dataset Architecture** (v0.9.4)
- StorageDriver interface with IndexedDB and LocalStorage implementations
- DatasetManager class for managing multiple datasets
- Infrastructure for PIN-protected datasets
- Dataset info panel with storage statistics

**Enhanced Testing** (v0.9.3+)
- 117 comprehensive tests covering all core functionality
- Fast execution (<11ms) with uvu test framework
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
│   ├── app.js             # Application JavaScript
│   └── capacitor.js       # Capacitor initialization
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

## Migration from 0.8

Version 0.8 was a single HTML file application. Version 0.8.1 restructures the application into:
- Separate HTML, CSS, and JavaScript files
- Capacitor configuration for multi-platform support
- Native project structures for Android and iOS

The core functionality remains the same, but the app can now be built and deployed as a native application.

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Developer Guide](https://developer.android.com/)
- [iOS Developer Guide](https://developer.apple.com/documentation/)

## License

See LICENSE file for details.
