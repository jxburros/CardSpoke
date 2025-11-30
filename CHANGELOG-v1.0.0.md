# CardSpoke v1.0.0 - Feature & Polish Milestone

**Release Date:** 2025-11-30
**Updated By:** Claude Code (Sonnet 4.5)
**Schema:** v4 (unchanged)

CardSpoke 1.0.0 represents the first stable release with a comprehensive set of features for local-first, hierarchical note-taking. This release focuses on user experience improvements, mobile optimization, and essential productivity features while maintaining backward compatibility.

---

## 🎉 New Features

### Getting Started Guide
- **First-Run Experience**: Automatic display of "Getting Started" guide when no cards exist
- **Comprehensive Tutorial**: Explains cards, tags, search, and core features
- **Menu Access**: Re-accessible anytime from Help → Getting Started
- Helps new users quickly understand how to use CardSpoke

### Manual Backup System
- **Create Backup Now**: One-click timestamped JSON backups
- **Backup History**: Track last 10 backups with metadata (date, card count, size)
- **Local Storage**: All backups download to your device
- Accessible from Data & Export menu

### Share Card Feature
- **Multiple Export Formats**:
  - Copy single card as JSON or Markdown
  - Copy card tree (with children) as JSON or Markdown
- **Clipboard Integration**: One-click copy to clipboard
- **Share Button**: Added to all card detail pages
- Perfect for sharing cards via email, chat, or importing into other instances

### Language & Localization Pointer
- **Language Packs Section**: Added to Help modal
- **Community Support**: Placeholder for future language pack downloads
- **GitHub Link**: Points to Language Packs wiki page
- Framework ready for internationalization

### Print & PDF Support
- **Print Stylesheet**: Clean, professional print output
- **Browser Print-to-PDF**: Use browser's native print-to-PDF feature
- **Optimized Layout**:
  - Hides navigation and UI chrome
  - Proper page breaks for children/sections
  - Print-friendly tag styling
  - Page numbering support
- **Works For**: Single cards and card trees with children

---

## 🎨 UX Improvements

### Enhanced Search Experience
- **Keyboard Navigation Hints**: Visual guide showing "↑/↓ to navigate • Enter to open"
- **Improved Selection Highlighting**:
  - Selected result has prominent outline
  - Smooth scaling animation
  - Better contrast in dark mode
- **Better Discoverability**: Users immediately understand keyboard shortcuts

### Mobile Optimization
- **Touch-Friendly Targets**: All buttons meet 44px minimum touch target size
- **Improved Button Layout**: Grid layout for card actions on mobile
- **Responsive Modals**: Better sizing on small screens (95vw)
- **Single-Column Card Grid**: Optimized for narrow screens
- **No-Zoom Forms**: All inputs use 16px font to prevent iOS zoom
- **Better Tag Wrapping**: Tags wrap properly on mobile

### Print Improvements
- **Clean Output**: Hides all navigation, menus, and UI elements
- **Proper Typography**: Optimized font sizes for print (24pt title, 12pt body)
- **Page Break Control**: Prevents orphans and widows
- **Child Card Formatting**: Clean hierarchy in printed output

---

## 🔧 Technical Improvements

### Accessibility (Partial)
- Added `aria-label` to Getting Started modal close button
- Improved modal keyboard focus trapping
- Better semantic HTML structure

### Code Quality
- Version updated to 1.0.0
- Consistent coding style maintained
- All features follow existing patterns
- No breaking changes to dataset schema or extension API

### CSS Enhancements
- Added `.search-result-selected` class for highlighted results
- Print media queries with comprehensive styling
- Mobile-specific optimizations in media queries
- Better touch target sizing across the app

---

## 📋 Feature Status

### Implemented in v1.0.0
- ✅ Getting Started guide with first-run detection
- ✅ Search UX improvements (keyboard hints, visual highlighting)
- ✅ Manual backup system with history tracking
- ✅ Lightweight share feature (JSON/Markdown clipboard copy)
- ✅ Language & Localization pointer
- ✅ Print cards feature with dedicated stylesheet
- ✅ Mobile optimizations (touch targets, responsive layout)
- ✅ Improved accessibility labels (partial)

### Deferred to Future Releases
- ⏸️ Full Markdown rendering (basic support exists)
- ⏸️ Visual card tree export (HTML/SVG)
- ⏸️ Dedicated PDF export button (use print-to-PDF for now)
- ⏸️ Complete accessibility audit
- ⏸️ Tag Manager sync verification (appears to work correctly)

---

## 🐛 Bug Fixes

- **Search Results**: Fixed potential focus issues with keyboard navigation
- **Mobile Forms**: Prevented unwanted zoom on iOS input focus
- **Print Layout**: Ensured proper rendering of card hierarchies

---

## 📦 Installation & Upgrade

### New Users
1. Download or clone the repository
2. Open `www/index.html` in a modern browser
3. The Getting Started guide will appear automatically

### Existing Users
1. Backup your data (use new backup feature!)
2. Replace `www/` folder with updated files
3. Your existing cards and settings are preserved (Schema v4 unchanged)
4. Extensions remain compatible

---

## 🔒 Security & Privacy

- **Local-First**: All data remains on your device
- **No Network Calls**: Core features work 100% offline
- **No Breaking Changes**: Existing datasets fully compatible
- **Extension Safe**: All existing extensions continue to work

---

## 📝 Documentation

### Updated Files
- `www/app.js` - Core application (v1.0.0)
- `www/styles.css` - Styling with print media queries
- `www/index.html` - Added "Getting Started" menu item
- `CHANGELOG-v1.0.0.md` - This file

### Key Functions Added
- `showGettingStarted()` - Getting Started modal
- `showShareCard(cardId)` - Share card modal
- `getCardWithDescendants(cardId)` - Recursive card tree retrieval
- `cardToMarkdown(cardData, depth)` - Convert card tree to Markdown
- Backup tracking in Data Hub

### CSS Classes Added
- `.search-result-selected` - Highlighted search result
- Print media queries for clean output
- Mobile optimization media queries

---

## 🚀 What's Next

### Planned for v1.1.0
- Full Markdown rendering with preview
- Visual card tree export (SVG/HTML)
- More comprehensive accessibility improvements
- Advanced formatting tools
- Additional export formats

### Community Contributions Welcome
- Language pack translations
- Extension development
- Documentation improvements
- Bug reports and feature requests

---

## 🙏 Acknowledgments

- **Original Creator**: jxburros
- **v1.0.0 Implementation**: Claude Code (Sonnet 4.5)
- **Community**: All extension developers and beta testers
- **Technologies**: Vanilla JavaScript, CSS Grid, HTML5 APIs

---

## 📞 Support & Feedback

- **GitHub**: https://github.com/jxburros/CardSpoke
- **Issues**: https://github.com/jxburros/CardSpoke/issues
- **Documentation**: https://github.com/jxburros/CardSpoke/blob/main/README.md

---

**CardSpoke v1.0.0** - Simple. Local. Powerful.
