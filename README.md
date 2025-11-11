# 🃏 CardSpoke

**A lightweight, extensible, card-based knowledge base for creative minds.**

[![Version](https://img.shields.io/badge/version-0.7.4-blue.svg)](https://github.com/jxburros/card-based-info-base)
[![License](https://img.shields.io/badge/license-ISC-green.svg)](LICENSE)
[![Schema](https://img.shields.io/badge/schema-v4-purple.svg)](SCHEMA.md)

---

## 🎯 What is CardSpoke?

CardSpoke is a **local-first, modular information system** that helps you organize thoughts, projects, stories, and knowledge using hierarchical "cards." It's designed to be:

- **🪶 Lightweight** - Clean, minimal design focused on content
- **🔒 Private** - All data stored locally, no cloud dependency
- **🧩 Extensible** - Powerful mod system for customization
- **📱 Portable** - Single-file HTML or multi-platform app
- **🎨 Beautiful** - Bold typography, high contrast, elegant UI

Think of it as a personal wiki meets note-taking app meets creative workspace.

---

## ✨ Key Features

### 📇 Hierarchical Cards
- Organize information in nested card structures
- Parent-child relationships with unlimited depth
- Drag-and-drop reordering (coming soon)
- Breadcrumb navigation

### 🎨 Clean Design
- Ultra-minimal black & white interface
- Dark mode support
- Typography-first design (Inter & Outfit fonts)
- Generous spacing and high contrast

### 🔧 Extension System
- Install custom mods for new features
- Theme system for visual customization
- Hook-based architecture (`onAppInit`, `onCardRender`, etc.)
- Safe sandboxed execution

### 💾 Local-First Data
- Everything stored in browser localStorage
- No server required, fully offline
- Multiple instances for different projects
- Export to JSON, TXT, or DOCX

### 🔍 Search & Organization
- Full-text search across all cards
- Tag-based categorization
- Alphabetical and custom sorting
- Quick card creation and navigation

### 📤 Import/Export
- **Import:** JSON (cards, subtrees, instances), TXT (plain text or outlines), DOCX
- **Export:** JSON (full instance, single card, subtree), TXT (hierarchical), Mods package
- Preserve structure and metadata

---

## 🚀 Quick Start

### Option 1: Single-File Version (Easiest)

1. Download `CardSpoke 0.7.4.html` from this repository
2. Open it in any modern web browser
3. Start creating cards!

No installation, no build process, no dependencies. Just double-click and go.

### Option 2: Multi-Platform Build (Advanced)

CardSpoke can be built for multiple platforms using [Capacitor](https://capacitorjs.com/):

```bash
# Clone the repository
git clone https://github.com/jxburros/card-based-info-base.git
cd card-based-info-base

# Install dependencies
npm install

# Development server
npm run dev

# Build for specific platforms
npm run sync              # Sync web assets
npm run open:android      # Open Android Studio
npm run open:ios          # Open Xcode (macOS only)
```

**Platforms:**
- ✅ Web (Progressive Web App)
- 🔨 Android (in progress)
- 🔨 iOS (in progress)
- 🔨 Desktop/Electron (planned)

---

## 📚 Documentation

### Essential Reading
- **[SCHEMA.md](SCHEMA.md)** - Complete data schema reference for developers
- **[Road Map V1](Road%20Map%20V1.md)** - Development roadmap through v1.0
- **[CardSpoke Objectives V1](cardspoke_objectives_v_1.md)** - Project vision and philosophy
- **[ROADMAP_STATUS.md](ROADMAP_STATUS.md)** - Current implementation status

### Additional Resources
- **[POTENTIAL_FEATURES.md](POTENTIAL_FEATURES.md)** - 50+ ideas for future enhancements
- **[RELEASE_NOTES.md](RELEASE_NOTES.md)** - Version history and changes
- **[test-mods/README.md](test-mods/README.md)** - Example mods for testing

### Capacitor-Specific
- **[CAPACITOR_README.md](CAPACITOR_README.md)** - Capacitor setup guide
- **[CAPACITOR_CONVERSION.md](CAPACITOR_CONVERSION.md)** - Technical conversion details

---

## 🎮 Usage Guide

### Creating Your First Card

1. Open CardSpoke
2. Click **"+ New Card"** or press `N`
3. Enter a title and body text
4. Click **"Create Card"**

### Organizing Cards

- **Add Child Card:** Click a card, then "Add Child"
- **Edit Card:** Click card title or body to edit
- **Delete Card:** Select card options menu → Delete
- **Search:** Use search bar (top right) or press `/`

### Using Instances

Instances let you maintain separate card collections:

1. Menu → **"Instances"**
2. Create new instance or switch between existing ones
3. Each instance has independent data and mods

### Installing Mods

1. Menu → **"Upload Content"** → **"Mods"** tab
2. Upload a `.json` mod file or paste code manually
3. Menu → **"Extensions"**
4. Enable your installed mod

**Try the test mods** in `/test-mods/` to see the mod system in action!

---

## 🧩 Extension System

CardSpoke's power comes from its extension architecture. Mods can:

- Add UI elements and features
- React to card events (create, edit, delete, render)
- Store custom data per card
- Inject CSS for styling
- Access a safe API for card manipulation

### Mod Types

| Type | Purpose | Example |
|------|---------|---------|
| **Theme** | Visual changes only | Color schemes, typography tweaks |
| **Patch** | Fixes without source edits | Bug fixes, QOL improvements |
| **Plugin** | New features | Statistics, export formats, tools |
| **Mod** | Core behavior changes | New navigation, data structures |
| **Kit** | Bundled themes/plugins | Themed plugin collections |
| **Expansion** | Large feature packs | Major content/system overhauls |

### Example: Simple Mod

```json
{
  "id": "my-first-mod",
  "meta": {
    "name": "My First Mod",
    "creator": "YourName",
    "version": "1.0.0",
    "type": "Plugin"
  },
  "js": "CIB_MODS.register('my-first-mod', {\n  onAppInit(ctx) {\n    ctx.api.showToast('Hello from my mod!');\n  }\n});",
  "css": ""
}
```

See [SCHEMA.md](SCHEMA.md) for complete mod API documentation.

---

## 🎨 Design Philosophy

CardSpoke follows these principles:

1. **Content over chrome** - UI should frame, not compete with information
2. **Local-first** - User data belongs to the user
3. **Extensibility over bloat** - Core stays lean, mods add features
4. **Black & white only** - Maximum contrast, timeless aesthetic
5. **Typography matters** - Scale, weight, and spacing convey hierarchy
6. **No external dependencies** - Self-contained, future-proof

---

## 🛠️ Development

### Project Structure

```
card-based-info-base/
├── CardSpoke 0.7.4.html       # Single-file application
├── www/                        # Web assets (Capacitor)
├── android/                    # Android project (Capacitor)
├── ios/                        # iOS project (Capacitor)
├── scripts/                    # Build and utility scripts
├── test-mods/                  # Example mods for testing
│   ├── simple-timestamp-mod.json
│   └── card-statistics-mod.json
└── [Documentation files]
```

### Tech Stack

- **Frontend:** Vanilla JavaScript (no frameworks)
- **Storage:** Browser localStorage / IndexedDB
- **Styling:** CSS Custom Properties (CSS Variables)
- **Build:** Capacitor for multi-platform
- **Design:** Inter + Outfit fonts, minimal UI

### Contributing

Contributions are welcome! Areas to explore:

- 🐛 **Bug Fixes:** Report issues or submit fixes
- 🎨 **Mods:** Create and share extensions
- 📖 **Documentation:** Improve guides and examples
- 💡 **Ideas:** Suggest features (see [POTENTIAL_FEATURES.md](POTENTIAL_FEATURES.md))

Before contributing:
1. Read [CardSpoke Objectives V1](cardspoke_objectives_v_1.md)
2. Check [Road Map V1](Road%20Map%20V1.md) for planned features
3. Review [SCHEMA.md](SCHEMA.md) for technical details

---

## 🗺️ Roadmap

CardSpoke is currently at **v0.7.4** (Foundation complete).

### What's Next?

- **v0.8** - Capacitor multi-platform builds
- **v0.9** - Multi-dataset architecture with PINs
- **v0.10** - Enhanced extensions framework, tagging, search
- **v0.11** - Developer tools (wizard, playground, utilities)
- **v0.12** - Mod safety layer and governance
- **v0.13** - UX polish and undo system
- **v0.14** - Complete documentation
- **v1.0** - Stable, feature-complete release

See [Road Map V1.md](Road%20Map%20V1.md) for detailed plans.

---

## 📦 Version Information

**Current Version:** 0.7.4  
**Schema Version:** 4  
**Release Date:** November 2025  
**Status:** Active Development

### Recent Changes (0.7.x)
- ✅ Complete UI redesign (Ultra-Light aesthetic)
- ✅ Schema v4 with mod support
- ✅ Improved mod system with metadata
- ✅ Better save/load performance
- ✅ Enhanced documentation
- ✅ Test mods for validation

See [RELEASE_NOTES.md](RELEASE_NOTES.md) for full changelog.

---

## 🤝 Community & Support

- **Repository:** [github.com/jxburros/card-based-info-base](https://github.com/jxburros/card-based-info-base)
- **Issues:** Report bugs and request features via GitHub Issues
- **Discussions:** Share ideas and get help in GitHub Discussions

---

## 📄 License

CardSpoke is released under the **ISC License**.

Copyright (c) 2025 jxburros

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

See [LICENSE](LICENSE) file for full text.

---

## 👏 Credits

**Created by:** jxburros  
**AI Collaborators:** ChatGPT (GPT-5), GitHub Copilot  
**Fonts:** [Inter](https://rsms.me/inter/) by Rasmus Andersson, [Outfit](https://fonts.google.com/specimen/Outfit) by Rodrigo Fuenzalida  
**Inspiration:** Obsidian, Notion, Apple Notes, Figma, Swiss Design

---

## 🌟 Why CardSpoke?

In a world of bloated apps and cloud lock-in, CardSpoke is a return to simplicity:

- **Your data, your device** - No accounts, no tracking, no uploads
- **Fast and light** - Loads instantly, runs smoothly
- **Future-proof** - Plain HTML/JS/CSS, no build requirements
- **Infinitely flexible** - Mod system lets you shape it your way
- **Beautiful by default** - Designed with care, refined for clarity

Whether you're managing projects, writing stories, organizing research, or building a personal knowledge base—CardSpoke gives you the structure without the constraints.

**Start building your knowledge graph today.** 🃏

---

*CardSpoke: where information finds structure, and structure finds beauty.*
