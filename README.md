# CardSpoke

> A lightweight, extensible, multi-platform knowledge base framework

CardSpoke is an open-source knowledge management system that combines hierarchical notes ("cards"), modular extensions ("mods"), and local-first data design. Built with simplicity and extensibility at its core, CardSpoke helps you organize your thoughts, projects, and ideas in a way that makes sense to you.

## 🌟 Current Version: 0.9.1

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
- **🔍 Search & Tags**: Global search and flexible tagging system
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

3. Sync to native platforms (optional):
   ```bash
   npm run sync           # All platforms
   npm run sync:android   # Android only
   npm run sync:ios       # iOS only
   ```

For detailed build instructions and platform-specific guides, see [README-CAPACITOR.md](README-CAPACITOR.md).

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
