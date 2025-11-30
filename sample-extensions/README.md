# CardSpoke Sample Extensions

This directory contains 10 official sample extensions demonstrating the full capabilities of the CardSpoke extension system. Each extension type (Theme, Plugin, Mod, Kit, Expansion) has both a simple and complex example to showcase different development approaches.

## Quick Start

### Installing Extensions

1. Open CardSpoke in your browser
2. Go to **Menu → Extensions Hub** (or press `Ctrl+E`)
3. Click **Upload Extension**
4. Select any `.json` file from these directories
5. Enable the extension from the Extensions list

### Alternative: Import via Upload Modal

1. Click **Upload** button in CardSpoke
2. Go to **Mods** tab
3. Click **Choose File** and select an extension
4. The extension will be imported (disabled by default)

---

## Extension Types Overview

Based on the [Mod Capability Taxonomy](../docs/mod-capability-taxonomy.md):

- **Theme**: Visual styling and appearance modifications
- **Plugin**: Add new features to the application
- **Mod**: Modify existing behavior
- **Kit**: Collection of related extensions bundled together
- **Expansion**: Major feature additions

---

## 📦 Included Extensions

### 🎨 Themes

#### 1. Ocean Blue Theme (Simple)
**File**: `themes/ocean-blue-theme.json`

A calming ocean-inspired color palette with blue tones and subtle gradients.

**Features**:
- Light and dark mode support
- Soothing blue color scheme
- Subtle gradient backgrounds
- Gentle hover effects

**Complexity**: ⭐ Simple
**Lines of Code**: ~50 (CSS only)

---

#### 2. Neon Cyberpunk Theme (Complex)
**File**: `themes/neon-cyberpunk-theme.json`

Futuristic cyberpunk theme with neon accents, glitch effects, and animated scanlines.

**Features**:
- Neon glow effects with cyan/magenta accents
- Animated scanline overlay
- Random glitch effects on titles
- Special styling for urgent cards
- Custom scrollbar styling
- Hover animations with light sweeps

**Complexity**: ⭐⭐⭐⭐ Complex
**Lines of Code**: ~300 (JS + CSS)
**Hooks Used**: `onAppInit`, `onCardRender`, `onDisable`

---

### 🔌 Plugins

#### 3. Word Counter Plugin (Simple)
**File**: `plugins/word-counter-plugin.json`

Displays word count for each card in a small badge.

**Features**:
- Real-time word counting
- Visual badge next to card title
- Stores count in card metadata
- Updates on card save

**Complexity**: ⭐⭐ Simple
**Lines of Code**: ~80
**Hooks Used**: `onCardRender`, `onCardSave`

---

#### 4. Pomodoro Timer Plugin (Complex)
**File**: `plugins/pomodoro-timer-plugin.json`

Full-featured Pomodoro timer with work/break sessions and statistics.

**Features**:
- 25-minute work sessions / 5-minute short breaks / 15-minute long breaks
- Floating widget with start/pause/reset controls
- Card association (tracks which card you're working on)
- Session statistics (total sessions, daily count)
- Auto-start breaks option
- Audio notification on session completion
- Keyboard shortcut: `Ctrl+Shift+P` to toggle
- Persistent statistics in localStorage

**Complexity**: ⭐⭐⭐⭐⭐ Complex
**Lines of Code**: ~400+
**Hooks Used**: `onAppInit`, `onNavigate`, `onDisable`, `onUninstall`

---

### 🔧 Mods

#### 5. Auto-Tag Mod (Simple)
**File**: `mods/auto-tag-mod.json`

Automatically tags cards based on content keywords.

**Features**:
- 8 built-in tagging rules (bug, todo, question, idea, meeting, urgent, project, research)
- Pattern matching with regex
- Shows toast notification when tags are added
- Only processes when content changes

**Complexity**: ⭐⭐ Simple
**Lines of Code**: ~70
**Hooks Used**: `onCardSave`, `onAppInit`

**Example**: A card containing "This is urgent and needs to be fixed ASAP" would automatically get tagged with `#urgent`.

---

#### 6. Smart Links Mod (Complex)
**File**: `mods/smart-links-mod.json`

Enhanced linking system with bidirectional references and link visualization.

**Features**:
- Wiki-style `[[Card Title]]` linking syntax
- Clickable internal links to navigate between cards
- Automatic URL enhancement with icons
- Backlinks section showing which cards link to current card
- Link suggestions panel
- Link statistics (total links, orphan cards)
- Missing link detection (shows broken references)
- Link cache for performance

**Complexity**: ⭐⭐⭐⭐⭐ Complex
**Lines of Code**: ~400+
**Hooks Used**: `onAppInit`, `onCardRender`, `onCardSave`, `onCardDelete`, `onDisable`

---

### 📦 Kits

#### 7. Productivity Kit (Simple)
**File**: `kits/productivity-kit.json`

Essential productivity tools bundled together.

**Features**:
- **Priority Badges**: Visual badges for urgent/high/medium/low priority (based on tags)
- **Due Dates**: Display due dates with overdue warnings
- **Task Completion**: Strike-through completed tasks (cards tagged `completed`)
- Auto-priority detection based on keywords

**Complexity**: ⭐⭐⭐ Moderate
**Lines of Code**: ~200
**Hooks Used**: `onAppInit`, `onCardRender`, `onCardSave`

---

#### 8. Developer Kit (Complex)
**File**: `kits/developer-kit.json`

Comprehensive developer toolkit for code-related cards.

**Features**:
- **Syntax Highlighting**: Automatic highlighting for code blocks
- **Code Templates**: Quick insertion of code snippets (JavaScript, Python, CSS, HTML, SQL, Bash)
- **Copy to Clipboard**: One-click code copying
- **TODO Extraction**: Find all TODO comments across cards
- **Line Counter**: Count lines of code in all cards
- **Code Statistics**: Track code cards, total LOC, languages used
- **Auto-tagging**: Automatically tag cards containing code
- Keyboard shortcuts: `Ctrl+Shift+D` (toggle panel), `Ctrl+Shift+F` (format code)

**Complexity**: ⭐⭐⭐⭐⭐ Complex
**Lines of Code**: ~500+
**Hooks Used**: `onAppInit`, `onCardRender`, `onCardSave`, `onDisable`, `onUninstall`

---

### 🚀 Expansions

#### 9. Advanced Export Expansion (Simple)
**File**: `expansions/advanced-export-expansion.json`

Comprehensive export system with multiple formats.

**Features**:
- **Formats**: Markdown, HTML, PDF (via print), Plain Text, CSV, JSON
- **Scope Options**: Current card, card + children, tagged cards, all cards
- **Customization**: Include/exclude metadata, hierarchy, table of contents, backlinks
- **Preview**: See card count and estimated file size before export
- Modal UI with format selection and options
- One-click download

**Complexity**: ⭐⭐⭐⭐ Complex
**Lines of Code**: ~450+
**Hooks Used**: `onAppInit`, `onDisable`

---

#### 10. Collaboration Hub Expansion (Complex)
**File**: `expansions/collaboration-hub-expansion.json`

Full collaboration suite for team-based workflows.

**Features**:
- **User Profiles**: Username-based identity system
- **Activity Feed**: Real-time activity tracking (card created/updated/deleted, comments, tags)
- **Comments**: Per-card commenting system with timestamps
- **@Mentions**: Mention other users in comments
- **Card Sharing**:
  - Copy shareable link
  - Share via email
  - Export as JSON with comments
  - QR code generation (placeholder)
- **Statistics**: Track total comments, active collaborators, activity events
- **Persistent Storage**: All data saved to localStorage
- Keyboard shortcut: `Ctrl+Shift+C` to toggle hub
- Comment count badges on cards

**Complexity**: ⭐⭐⭐⭐⭐ Very Complex
**Lines of Code**: ~600+
**Hooks Used**: `onAppInit`, `onCardSave`, `onCardDelete`, `onCardRender`, `onNavigate`, `onDisable`, `onUninstall`

---

## 📊 Extension Comparison

| Extension | Type | Complexity | LOC | Hooks | Features |
|-----------|------|------------|-----|-------|----------|
| Ocean Blue Theme | Theme | ⭐ | ~50 | 0 | CSS-only theme |
| Neon Cyberpunk | Theme | ⭐⭐⭐⭐ | ~300 | 3 | Animated theme with effects |
| Word Counter | Plugin | ⭐⭐ | ~80 | 2 | Simple feature addition |
| Pomodoro Timer | Plugin | ⭐⭐⭐⭐⭐ | ~400 | 4 | Complete time management |
| Auto-Tag | Mod | ⭐⭐ | ~70 | 2 | Behavior modification |
| Smart Links | Mod | ⭐⭐⭐⭐⭐ | ~400 | 5 | Advanced linking system |
| Productivity Kit | Kit | ⭐⭐⭐ | ~200 | 3 | Bundled productivity tools |
| Developer Kit | Kit | ⭐⭐⭐⭐⭐ | ~500 | 5 | Comprehensive dev tools |
| Advanced Export | Expansion | ⭐⭐⭐⭐ | ~450 | 2 | Multi-format export |
| Collaboration Hub | Expansion | ⭐⭐⭐⭐⭐ | ~600 | 7 | Full collaboration suite |

---

## 🎓 Learning Path

### For Beginners
Start with these extensions to learn the basics:

1. **Ocean Blue Theme** - Learn CSS-only extensions
2. **Word Counter Plugin** - Learn basic hooks and data storage
3. **Auto-Tag Mod** - Learn content analysis and tagging

### For Intermediate Developers
Progress to these:

4. **Productivity Kit** - Learn to combine multiple features
5. **Advanced Export Expansion** - Learn modal UIs and file generation

### For Advanced Developers
Challenge yourself with:

6. **Neon Cyberpunk Theme** - Learn animations and effects
7. **Smart Links Mod** - Learn complex data structures and caching
8. **Pomodoro Timer Plugin** - Learn state management and timers
9. **Developer Kit** - Learn syntax highlighting and tooling
10. **Collaboration Hub Expansion** - Learn multi-user features and persistence

---

## 🛠️ Development Tips

### Creating Your Own Extensions

1. **Start Simple**: Begin with a CSS-only theme or simple plugin
2. **Use Templates**: Copy and modify these samples
3. **Read the Docs**: Check `docs/extension-cookbook.md` for patterns
4. **Test Thoroughly**: Use Safe Mode (`?safemode`) for debugging
5. **Handle Errors**: Always clean up in `onDisable` and `onUninstall`

### Best Practices

- ✅ Always namespace your extension IDs
- ✅ Clean up event listeners in `onDisable`
- ✅ Use `modsData` for per-card storage
- ✅ Use localStorage for global extension settings
- ✅ Provide clear user feedback with toasts
- ✅ Document your code with comments
- ❌ Don't modify the global `store` directly
- ❌ Don't use infinite loops or blocking operations
- ❌ Don't store sensitive data in plain text

---

## 🐛 Troubleshooting

### Extension Won't Enable
- Check browser console for errors
- Verify JSON syntax is valid
- Ensure all required hooks are defined

### Extension Causes Issues
- Disable via Extensions Hub
- Use Safe Mode: `?safemode` in URL
- Check for conflicts with other extensions

### Data Not Persisting
- Check localStorage quotas (usually 5-10MB)
- Verify `saveCollaborationData()` is being called
- Check browser privacy settings

---

## 📚 Additional Resources

- [Extension Cookbook](../docs/extension-cookbook.md) - Detailed development guide
- [API Reference](../docs/api-reference.md) - Complete API documentation
- [Mod Capability Taxonomy](../docs/mod-capability-taxonomy.md) - Extension type definitions
- [Schema Reference](../docs/schema-reference-v0.13.md) - Data structure documentation

---

## 🤝 Contributing

Found a bug in these samples? Have an improvement?

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📄 License

These sample extensions are part of CardSpoke and are released under the same ISC license.

---

**Happy Extending! 🚀**

Build amazing features on top of CardSpoke and share them with the community!
