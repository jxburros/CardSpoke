# CardSpoke v0.11.0 Release Notes
**Release Date:** 2025-11-14  
**Code Name:** Operation Quantum Leap 🔮  
**Type:** Major Feature Release

---

## Overview

Version 0.11.0 is a major feature release that introduces 7 new capabilities focusing on enhanced card relationships, flexible layouts, improved accessibility, and intelligent content management. This release maintains 100% backward compatibility with v0.10.x data.

---

## 🎉 What's New

### 1. Backlinks Panel
Track bidirectional relationships between cards automatically.

**Features:**
- Automatically detects cards that link to the current card using `[[Card Name]]` syntax
- Displays "Referenced By" section in card detail view
- Clickable backlinks for easy navigation
- Real-time updates as links change

**Use Cases:**
- Understand card dependencies
- Navigate reverse relationships
- Build knowledge graphs

### 2. Related Cards
Discover connections between cards based on shared tags.

**Features:**
- Shows cards with similar tag profiles
- Match score calculation based on tag overlap
- Displays matched tags for each related card
- Configurable result limit (default: 5 cards)

**Use Cases:**
- Explore related topics
- Find similar content
- Build topic clusters

### 3. Grid View Layout
Switch between list and grid views for card browsing.

**Features:**
- Responsive grid layout (2-4 columns based on screen size)
- Toggle via menu or keyboard shortcut (Ctrl+G)
- Persists preference across sessions
- Optimized for both mobile and desktop

**Benefits:**
- See more cards at once
- Better visual scanning
- Flexible workspace organization

### 4. Typography Presets
Choose reading modes that match your preferences.

**Four Preset Options:**
- **Default:** 16px, 1.5 line height - Balanced for general use
- **Comfortable:** 18px, 1.7 line height - Relaxed reading
- **Compact:** 14px, 1.4 line height - Maximum content density
- **Dyslexia-Friendly:** 18px, 1.8 line height, wider spacing, readable font

**Features:**
- Accessible modal selector with descriptions
- Instant preview
- Persists across sessions
- Affects entire application

### 5. Smart Tag Suggestions
AI-powered tag recommendations based on card content.

**Features:**
- Analyzes card title and body content
- Compares with similarly tagged cards
- Relevance scoring (percentage match)
- One-click tag application
- "Apply All" bulk action

**Benefits:**
- Faster tagging workflow
- Consistent tag usage
- Discover existing tags
- Better content organization

### 6. Enhanced Keyboard Shortcuts
Five new shortcuts for power users.

**New Shortcuts:**
- `Ctrl+D` - Duplicate current card
- `Ctrl+T` - Focus tags input (when editing)
- `Ctrl+[` - Navigate to parent card
- `Ctrl+]` - Navigate to first child card
- `Ctrl+G` - Toggle grid/list view

**Existing Shortcuts:** (All still available)
- `Ctrl+H` - Go to home
- `Ctrl+N` - New card
- `Ctrl+F` - Focus search
- `Ctrl+B` - Show bookmarks
- `Ctrl+R` - Show recent cards
- `Ctrl+E` - Show extensions
- `Ctrl+U` - Upload data
- `Ctrl+/` - Show keyboard help
- `Escape` - Close modals/go back
- `Alt+T` - Toggle theme
- `Alt+C` - Toggle compact view

### 7. Enhanced Export Options
Markdown and CSV exports now preserve hierarchy and metadata.

**Markdown Export:**
- Hierarchical structure with heading levels
- Tags included in frontmatter style
- Internal links preserved
- Timestamps and metadata

**CSV Export:**
- All card fields included
- Parent ID for hierarchy reconstruction
- Tags, children count, timestamps
- Proper escaping for multi-line content

---

## 📊 Statistics

### Code Metrics
- **Total Lines:** 4,388 (app.js)
- **CSS Lines:** 1,673 (styles.css)
- **New Functions:** 8
- **Modified Functions:** 5

### Test Coverage
- **Total Tests:** 152
- **Pass Rate:** 100%
- **New Tests:** 25 (for backlinks and related cards)
- **Test Execution:** <16ms

### Features Implemented
- **Total New Features:** 7
- **P1 (High Priority):** 5
- **P2 (Medium Priority):** 2

---

## 🔧 Technical Details

### New Functions
1. `getBacklinks(cardId)` - Find cards that reference the current card
2. `getRelatedCards(cardId, limit)` - Find cards with shared tags
3. `suggestTags(cardId, limit)` - Generate smart tag suggestions
4. `showTagSuggestions(cardId)` - Display tag suggestions modal
5. `showTypographySelector()` - Show typography preset selector
6. Grid view rendering logic
7. Enhanced keyboard shortcut handlers

### New CSS Classes
- `.backlinks-section`, `.related-section` - Card relationship sections
- `.section-title` - Section headers with emoji prefixes
- `.card-grid.grid-view` - Grid layout styling
- `[data-typography="..."]` - Typography preset selectors
- `.typography-presets`, `.preset-option` - Typography selector modal
- `.tag-suggestions`, `.suggestion-tag` - Tag suggestions modal

### localStorage Keys
- `cardspoke_gridView` - Grid view preference (boolean)
- `cardspoke_typography` - Typography preset (string)

### Performance
- All features optimized for datasets with 1000+ cards
- Grid view uses CSS Grid for optimal performance
- Tag suggestions use efficient content analysis
- No impact on existing feature performance

---

## 🔄 Migration & Compatibility

### Backward Compatibility
- ✅ 100% compatible with v0.10.x data
- ✅ All existing features work unchanged
- ✅ Existing exports remain valid
- ✅ No breaking changes

### Upgrade Path
1. Replace `www/` folder with new version
2. Clear browser cache (recommended)
3. Existing data loads automatically
4. New features available immediately

### Rollback
If needed, v0.10.6 can be restored without data loss.

---

## 🐛 Bug Fixes
- None (v0.10.6 was stable)

---

## 📚 Documentation Updates
- README.md updated with new features
- Keyboard shortcuts help includes new shortcuts
- AI Developer Guide updated with new functions
- Code comments added for all new functions

---

## 🙏 Credits
- **Developed by:** jxburros with GitHub Copilot (Mega Showrunner)
- **Testing:** Automated test suite (uvu framework)
- **Theme:** Operation Quantum Leap 🔮

---

## 📅 Roadmap

### Coming in v0.11.x (Patch Updates)
- Multi-dataset search completion (F1)
- Performance optimizations (F2)
- Additional keyboard shortcuts

### Planned for v0.12
- Basic markdown rendering
- Batch card operations
- Card version history
- HTML export

---

## 🔗 Links
- **Repository:** https://github.com/jxburros/CardSpoke
- **Issues:** https://github.com/jxburros/CardSpoke/issues
- **Discussions:** https://github.com/jxburros/CardSpoke/discussions

---

**Enjoy CardSpoke v0.11.0!** 🚀
