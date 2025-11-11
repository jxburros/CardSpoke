# Card Info Base v0.7.0 - Release Notes

## 🎉 Major Update: Capacitor Framework Integration

Card Info Base has been successfully converted from a single HTML file application to a full Capacitor-based cross-platform application framework.

### What's New

#### Cross-Platform Support
- ✅ **Web** - Progressive Web App with manifest and service worker support
- ✅ **Android** - Native Android application via Capacitor
- ⏳ **iOS** - Ready for iOS deployment (requires macOS for building)
- ⏳ **Desktop** - Electron support planned for future releases

#### Modular Architecture
The application has been refactored from a single 158KB HTML file into a clean, modular structure:

```
www/
├── index.html              # 3KB entry point
├── css/style.css          # 17KB styles
├── js/
│   ├── app.js             # 122KB main application
│   ├── storage-manager.js # Storage mode selection
│   └── comment-block-export.js
└── assets/icons/          # SVG app icons
```

#### Native Capabilities
New Capacitor plugins provide native functionality:
- **@capacitor/preferences** - Native key-value storage
- **@capacitor/filesystem** - Native file system access
- **@capacitor/app** - App lifecycle and metadata
- **@capacitor/splash-screen** - Native splash screen control

#### Developer Experience
- **npm scripts** for common tasks (dev, build, sync, validate)
- **Validation script** to check project integrity
- **Comprehensive documentation** for developers and users
- **PWA support** with manifest and icons

### Version History

**v0.7.0** (2025-11-11)
- ✅ Converted to Capacitor framework
- ✅ Modularized single HTML file into separate CSS, JS files
- ✅ Added Android platform support
- ✅ Created PWA manifest and app icons
- ✅ Added comprehensive documentation
- ✅ Maintained full backwards compatibility with v0.6.9.13

**v0.6.9.13** (2025-11-07)
- Critical fix for mod exports in baked apps
- Exposed CIB_MODS._registry for export functionality
- Improved mod data extraction

### Backwards Compatibility

✅ **100% Compatible** - All features from v0.6.9.13 are preserved:
- Card creation and editing
- Hierarchical organization
- Search functionality
- Theme switching (dark/light/minimal)
- Import/export (JSON, TXT, DOCX)
- Extension (mod) system
- Bake/export functionality
- Storage mode selection

### Installation

#### For Users
1. **Web Version**: Visit the hosted URL or open `www/index.html` in a browser
2. **Android**: Download the APK from releases (when available)
3. **iOS**: Download from App Store (when available)

#### For Developers
```bash
# Clone and setup
git clone https://github.com/jxburros/card-based-info-base.git
cd card-based-info-base
npm install

# Development
npm run dev

# Android development
npm run sync
npm run open:android

# Validation
npm run validate
```

### File Structure

```
card-based-info-base/
├── www/                          # Web application (Capacitor webDir)
│   ├── index.html               # Main entry point
│   ├── manifest.json            # PWA manifest
│   ├── css/style.css            # Application styles
│   ├── js/
│   │   ├── app.js               # Main application logic
│   │   ├── storage-manager.js   # Storage mode selection
│   │   └── comment-block-export.js
│   └── assets/icons/            # App icons (SVG)
├── android/                      # Android platform (auto-generated)
├── scripts/
│   └── validate.js              # Project validation script
├── capacitor.config.json         # Capacitor configuration
├── package.json                  # npm dependencies and scripts
├── .gitignore                   # Git exclusions
├── README.md                    # Main readme
├── CAPACITOR_README.md          # Capacitor getting started
├── CAPACITOR_CONVERSION.md      # Technical conversion details
├── RELEASE_NOTES.md             # This file
└── Road Map V1.md               # Future development plans
```

### npm Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build (not needed - static files) |
| `npm run sync` | Sync web assets to platforms |
| `npm run validate` | Run project validation checks |
| `npm run add:android` | Add Android platform |
| `npm run add:ios` | Add iOS platform |
| `npm run open:android` | Open project in Android Studio |
| `npm run open:ios` | Open project in Xcode |
| `npm run copy` | Copy web assets to platforms |

### Testing

All 29 validation checks pass:
- ✅ Core files (package.json, capacitor.config.json, .gitignore)
- ✅ Web directory structure (HTML, CSS, JS, manifest)
- ✅ App icons (SVG in multiple sizes)
- ✅ Documentation (README, conversion guide, release notes)
- ✅ Version consistency (0.7.0 across all files)
- ✅ Capacitor configuration (appId, appName, webDir)
- ✅ Platform support (Android added, iOS ready)
- ✅ Dependencies (all Capacitor plugins installed)

### Known Issues

None at this time. Please report any issues on GitHub.

### Roadmap

See [Road Map V1.md](Road%20Map%20V1.md) for future plans:
- **v0.8.x** - Enhanced Capacitor integration, iOS platform
- **v0.9.x** - Multi-dataset architecture
- **v0.10.x** - Extensions framework improvements
- **v0.11.x** - Developer ecosystem tools
- **v0.12.x** - Safety and governance features
- **v1.0.0** - Stable platform release

### Contributing

Contributions are welcome! Please see the Road Map for planned features and development priorities.

### License

ISC License - See LICENSE file for details

### Author

jxburros

### Acknowledgments

- Capacitor team for the excellent cross-platform framework
- All contributors and users of Card Info Base

---

**Happy organizing! 📇✨**
