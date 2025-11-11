# Capacitor Conversion Guide for Card Info Base

## Overview

This document describes the conversion of Card Info Base from a single HTML file application to a Capacitor-based cross-platform application.

## What Changed

### File Structure

**Before:**
```
card-based-info-base/
└── Card Info Base Version 0.7.html  (single 158KB HTML file)
```

**After:**
```
card-based-info-base/
├── www/                          # Web application root
│   ├── index.html               # Main HTML (modularized)
│   ├── manifest.json            # PWA manifest
│   ├── css/
│   │   └── style.css           # Extracted styles (17KB)
│   ├── js/
│   │   ├── app.js              # Main app logic (122KB)
│   │   ├── storage-manager.js  # Storage mode selection
│   │   └── comment-block-export.js  # Export utilities
│   └── assets/
│       └── icons/               # App icons (SVG)
├── android/                      # Android platform (auto-generated)
├── ios/                         # iOS platform (auto-generated)
├── capacitor.config.json        # Capacitor configuration
├── package.json                 # npm dependencies
└── .gitignore                  # Git exclusions
```

### Key Changes

1. **Modularization**
   - Extracted inline CSS to `www/css/style.css`
   - Extracted inline JavaScript to `www/js/app.js`
   - Created missing referenced files (`storage-manager.js`, `comment-block-export.js`)

2. **Capacitor Integration**
   - Added Capacitor core and CLI dependencies
   - Configured `capacitor.config.json` with app metadata
   - Added Android platform support
   - Installed native plugins for storage and filesystem access

3. **PWA Support**
   - Created `manifest.json` for Progressive Web App functionality
   - Generated SVG app icons in multiple sizes
   - Added theme color and display mode configuration

4. **Build System**
   - Added npm scripts for development and platform management
   - Created `.gitignore` to exclude build artifacts
   - Configured proper version numbers (v0.7.0)

## Capacitor Plugins Installed

| Plugin | Purpose |
|--------|---------|
| `@capacitor/core` | Core Capacitor functionality |
| `@capacitor/app` | App lifecycle events and info |
| `@capacitor/filesystem` | Native filesystem access |
| `@capacitor/preferences` | Key-value storage (native) |
| `@capacitor/splash-screen` | Splash screen control |
| `@capacitor/android` | Android platform support |

## Development Workflow

### Starting Development Server
```bash
npm run dev
```

This command starts a local development server using the `serve` package (since Capacitor 7.x removed the `cap serve` command). The app will be available at `http://localhost:3000`.

### Building for Platforms

#### Web
The web version is already built in the `www/` directory. No additional build step needed.

#### Android
```bash
npm run sync           # Copy web assets to Android
npm run open:android   # Open in Android Studio
```

Then build and run from Android Studio.

#### iOS (macOS only)
```bash
npm run sync           # Copy web assets to iOS
npm run open:ios       # Open in Xcode
```

Then build and run from Xcode.

## Configuration Files

### capacitor.config.json
```json
{
  "appId": "com.cardinfo.base",
  "appName": "Card Info Base",
  "webDir": "www",
  "bundledWebRuntime": false,
  "server": {
    "cleartext": true
  },
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2000,
      "backgroundColor": "#0b0f18",
      "showSpinner": false
    }
  }
}
```

### package.json Scripts
- `npm run dev` - Start development server (using `serve` package on port 3000)
- `npm run sync` - Sync web assets to platforms
- `npm run add:android` - Add Android platform
- `npm run add:ios` - Add iOS platform
- `npm run open:android` - Open Android Studio
- `npm run open:ios` - Open Xcode

## Storage System

The app maintains the original storage manager system that allows users to choose between:
- **localStorage** - Persistent storage across sessions
- **sessionStorage** - Clears when browser/app closes
- **memory** - Temporary, clears on reload

This is implemented in `www/js/storage-manager.js` and provides a consistent API across all platforms.

## Backwards Compatibility

The application maintains full backwards compatibility with the original HTML version:
- All features from v0.6.9.13 are preserved
- Data format remains unchanged
- Export functionality works identically
- Extension (mod) system fully functional

## Future Enhancements

As outlined in the Road Map V1, future versions will add:
- Native file picker integration (v0.8.x)
- Multi-dataset support with native storage (v0.9.x)
- Enhanced theme and extension management (v0.10.x)
- Developer tools and playground (v0.11.x)
- Safety and governance features (v0.12.x)

## Testing

### Web Testing
1. Run `npm run dev`
2. Open browser to http://localhost:3000
3. Test all features including:
   - Card creation and editing
   - Search functionality
   - Theme switching
   - Data export/import
   - Extension loading

### Android Testing
1. Ensure Android Studio is installed
2. Run `npm run sync && npm run open:android`
3. Build and run on emulator or device
4. Test native features like storage permissions

### iOS Testing (macOS only)
1. Ensure Xcode is installed
2. Run `npm run sync && npm run open:ios`
3. Build and run on simulator or device
4. Test native features like storage permissions

## Troubleshooting

### "The serve command has been removed" error
This occurs when using `npx cap serve` directly. In Capacitor 7.x, the `cap serve` command was removed.
Solution: Use the npm script instead
```bash
npm run dev
```
The dev script now uses the `serve` package to host the development server.

### "Could not find the android platform" error
Solution: Install the platform package
```bash
npm install @capacitor/android --save
npm run add:android
```

### Changes not reflected in app
Solution: Sync assets
```bash
npm run sync
```

### Build errors in Android Studio
Solution: Clean and rebuild
```bash
cd android
./gradlew clean
./gradlew build
```

## Version History

- **v0.7.0** - Capacitor migration complete
  - Converted single HTML file to modular structure
  - Added Capacitor framework support
  - Implemented Android platform
  - Created PWA manifest and icons
  - Added comprehensive documentation

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Developer Guide](https://developer.android.com/)
- [iOS Developer Guide](https://developer.apple.com/ios/)
- [PWA Best Practices](https://web.dev/progressive-web-apps/)

## License

ISC License - See LICENSE file for details

## Author

jxburros
