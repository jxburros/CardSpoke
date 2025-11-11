# Card Info Base - Capacitor App

Version 0.7 - Now with Capacitor support for cross-platform deployment!

## Overview

Card Info Base is a lightweight, extensible, multi-platform knowledge base framework that combines hierarchical notes ("cards"), modular extensions ("mods"), and local-first data design.

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/jxburros/card-based-info-base.git
cd card-based-info-base
```

2. Install dependencies
```bash
npm install
```

### Development

Run the app in development mode:
```bash
npm run dev
```

This will start a local server and open the app in your browser.

### Building for Production

#### Web
The web version is already built and ready in the `www/` directory. Simply deploy the contents to any static web host.

#### Android
1. Add Android platform (first time only):
```bash
npm run add:android
```

2. Sync files and open in Android Studio:
```bash
npm run sync
npm run open:android
```

3. Build and run from Android Studio

#### iOS
1. Add iOS platform (first time only, requires macOS):
```bash
npm run add:ios
```

2. Sync files and open in Xcode:
```bash
npm run sync
npm run open:ios
```

3. Build and run from Xcode

## Project Structure

```
card-based-info-base/
├── www/                    # Web application root
│   ├── index.html         # Main HTML entry point
│   ├── css/
│   │   └── style.css      # Application styles
│   ├── js/
│   │   ├── app.js         # Main application logic
│   │   ├── storage-manager.js    # Storage mode selection
│   │   └── comment-block-export.js  # Export utilities
│   └── assets/            # Images and other assets
├── android/               # Android platform (generated)
├── ios/                   # iOS platform (generated)
├── capacitor.config.json  # Capacitor configuration
└── package.json           # Project dependencies
```

## Features

- **Cross-Platform**: Runs on Web, Android, and iOS
- **Local-First**: All data stored locally
- **Extensible**: Mod system for customization
- **Lightweight**: Minimal dependencies
- **Offline-First**: Works without internet connection

## Storage Options

On first launch, you'll be prompted to choose a storage mode:
- **Local Storage**: Persists across browser sessions
- **Session Storage**: Clears when browser is closed
- **Memory Only**: Temporary storage, clears on page reload

## Capacitor Plugins

The app uses the following Capacitor plugins:
- `@capacitor/core` - Core Capacitor functionality
- `@capacitor/preferences` - Key-value storage
- `@capacitor/filesystem` - File system access
- `@capacitor/app` - App lifecycle events
- `@capacitor/splash-screen` - Splash screen control

## Version History

- **0.7.0** - Capacitor migration complete
  - Converted to Capacitor framework
  - Added support for Android and iOS
  - Modularized code structure
  - Added native storage plugins

## License

ISC License - See LICENSE file for details

## Author

jxburros

## Contributing

This project follows the roadmap outlined in `Road Map V1.md`. See that document for planned features and development phases.
