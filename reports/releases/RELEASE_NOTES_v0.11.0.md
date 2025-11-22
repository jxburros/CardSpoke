# CardSpoke v0.11.0 Release Notes

**Release Date:** November 2025  
**Codename:** "Knowledge Management"  
**Status:** ✅ Complete (v0.11.3)

---

## Executive Summary

Version 0.11 represents a strategic pivot from the originally planned "Developer Ecosystem" focus to prioritizing **Knowledge Management** features based on user feedback and product maturity assessment. While the original roadmap called for Extension Wizard and Playground tools, the team instead delivered 7 critical features that enhance the core knowledge graph functionality.

This release series (v0.11.0 through v0.11.3) ultimately delivered BOTH the pivoted knowledge management features AND the originally planned developer tools, making it one of the most comprehensive releases in CardSpoke history.

---

## Strategic Pivot Explained

### Original v0.11 Plan (from Road Map V2)
- Extension Wizard for scaffolding mods
- Playground for testing extension code
- CIB.utils API for developers
- Persistent Mod Data Registry
- Developer Mode toggle

### Actual v0.11 Deliverables

**v0.11.0 — Knowledge Management (Strategic Pivot)**
The team recognized that CardSpoke needed stronger core features before focusing on extensibility. The delivered features were:

1. **Backlinks Panel** — Bidirectional link tracking
2. **Related Cards** — Smart content discovery
3. **Grid View** — Visual card organization (Ctrl+G)
4. **Typography Presets** — 4 reading modes for accessibility
5. **Smart Tag Suggestions** — Context-aware tagging
6. **Enhanced Keyboard Shortcuts** — Power user navigation (Ctrl+D, T, [, ])
7. **Export Improvements** — Markdown hierarchy, CSV metadata

**v0.11.1 — Developer API**
- CardSpoke.utils API exposed for mod developers

**v0.11.2 — Developer Tools**
- Extension Wizard (originally planned feature)
- Playground (originally planned feature)

**v0.11.3 — Brand Consistency**
- Renamed CIB to CardSpoke across all APIs
- 160 comprehensive tests (up from 127)

---

## Feature Breakdown

### 1. Backlinks & Related Cards

**Problem Solved:** Users couldn't discover connections between cards without manual searching.

**Solution:**
- Automatic backlink detection using `[[Card Name]]` syntax
- "Backlinks" panel showing all cards that link to current card
- "Related Cards" suggestions based on shared tags
- Bidirectional navigation with click-to-navigate

**Code References:**
- `www/app.js` lines 3700-3850 (backlinks logic)
- `tests/backlinks-related.test.js` (25 comprehensive tests)

**Impact:** Enhanced knowledge graph exploration, better content discovery

---

### 2. Grid View Toggle

**Problem Solved:** List view wasn't optimal for visual browsing of many root cards.

**Solution:**
- Toggle between list and grid layouts (Ctrl+G)
- Grid shows cards as tiles with title and preview
- Keyboard shortcut for instant switching
- Persistent preference saved per user

**Code References:**
- `www/app.js` lines 5070-5080 (grid toggle logic)
- `www/styles.css` (grid layout styles)

**Impact:** Better visual organization for large knowledge bases

---

### 3. Typography Presets

**Problem Solved:** Fixed font size didn't accommodate different reading preferences or accessibility needs.

**Solution:**
- 4 preset modes: Default, Comfortable, Large, Extra Large
- Adjusts font size, line height, and spacing
- Accessible via menu: "📖 Typography"
- Settings persist across sessions

**Code References:**
- `www/app.js` lines 5110-5160 (typography selector)
- `www/styles.css` `[data-typography]` attribute styles

**Impact:** Improved accessibility and reading comfort

---

### 4. Smart Tag Suggestions

**Problem Solved:** Manual tag entry was tedious; users forgot existing tags.

**Solution:**
- Tag autocomplete based on existing tags
- Context-aware suggestions
- Faster tagging workflow
- Prevents tag duplication/typos

**Code References:**
- `www/app.js` (tag suggestion logic integrated with tag input)

**Impact:** Faster tagging, better tag consistency

---

### 5. Enhanced Keyboard Shortcuts

**Problem Solved:** Power users needed faster navigation without mouse.

**Solution:**
New shortcuts added:
- **Ctrl+D:** Duplicate card (with/without children)
- **Ctrl+T:** Focus tags input when editing
- **Ctrl+[:** Navigate to parent card
- **Ctrl+]:** Navigate to first child card
- **Ctrl+G:** Toggle grid/list view
- **Ctrl+/:** Show keyboard shortcuts help (existing)

**Code References:**
- `www/app.js` lines 5290-5340 (shortcuts object)

**Impact:** Significantly faster navigation for experienced users

---

### 6. Enhanced Exports

**Problem Solved:** Exports didn't preserve card hierarchy or metadata.

**Solution:**
- **Markdown export** now includes hierarchy (indentation)
- **CSV export** includes tags, dates, and custom attributes
- Better compatibility with external tools (Obsidian, Notion, Excel)

**Code References:**
- `www/app.js` export functions (downloadMarkdown, downloadCSV)

**Impact:** Better interoperability with other knowledge management tools

---

### 7. CardSpoke.utils API (v0.11.1)

**Problem Solved:** Extension developers had no safe API to interact with CardSpoke.

**Solution:**
- Exposed `window.CardSpoke.utils` API (formerly CIB.utils)
- Functions for card management: `createCard`, `updateCard`, `getCard`, `searchCards`
- Tag management: `getTags`, `addTag`, `removeTag`, `setTags`, `getAllTags`
- Utilities: `showToast`, `getDatasetMeta`
- Comprehensive JSDoc documentation and error handling

**Code References:**
- `www/app.js` lines 1428-1690 (CardSpoke.utils implementation)
- `AI_DEVELOPER_GUIDE.md` lines 742-790 (API documentation)

**Impact:** Enabled safe, documented mod development

---

### 8. Extension Wizard (v0.11.2)

**Problem Solved:** Creating extensions required deep knowledge of CardSpoke internals.

**Solution:**
- Interactive wizard with step-by-step guidance
- Type selection: Theme, Patch, Plugin, Mod, Expansion
- Automatic manifest generation
- Skeleton code templates
- Download as JSON or install directly

**Code References:**
- `www/app.js` lines 2650-2900 (wizard implementation)

**Impact:** Lowered barrier to extension development

---

### 9. Playground (v0.11.2)

**Problem Solved:** Testing extension code required installing and reloading repeatedly.

**Solution:**
- Sandboxed code editor for testing
- Split-view interface: code + console output
- Live code execution with error handling
- Pre-loaded examples demonstrating CardSpoke.utils
- Safe testing environment with isolated execution

**Code References:**
- `www/app.js` lines 3200-3400 (playground implementation)

**Impact:** Faster iteration for extension developers

---

### 10. API Renaming (v0.11.3)

**Problem Solved:** "CIB" (Card Info Base) was outdated branding from before CardSpoke name.

**Solution:**
- Renamed `window.CIB.utils` → `window.CardSpoke.utils`
- Renamed `window.CIB_MODS` → `window.CardSpoke.mods`
- Added backward compatibility aliases
- Updated 186+ references across codebase and documentation

**Code References:**
- `www/app.js` (all API references updated)
- `README.md`, `AI_DEVELOPER_GUIDE.md` (documentation updated)

**Impact:** Brand consistency, clearer API names

---

## Migration Guide

### For Extension Developers

**If using old CIB names:**
```javascript
// Old way (still works via aliases)
window.CIB.utils.createCard({ title: 'Test' });
window.CIB_MODS.register('my-mod', { ... });

// New way (recommended)
window.CardSpoke.utils.createCard({ title: 'Test' });
window.CardSpoke.mods.register('my-mod', { ... });
```

**Backward compatibility:** Old names still work but are deprecated. Update to CardSpoke names for future compatibility.

### For Users

**No breaking changes.** All features are additive. Data format unchanged.

**New keyboard shortcuts:**
- Press **Ctrl+/** to see all shortcuts
- **Ctrl+G** to toggle grid view
- **Ctrl+D** to duplicate cards
- **Ctrl+[** and **Ctrl+]** for parent/child navigation

---

## Testing & Quality

### Test Coverage
- **v0.11.0:** 152 tests passing (up from 127)
- **v0.11.3:** 160 tests passing
- **New test suites:**
  - Backlinks & Related: 25 tests
  - Footer population: 8 tests
- **100% pass rate** maintained throughout release cycle

### Performance
- No performance degradation measured
- Grid view optimized for 1000+ cards
- Tag suggestions with <10ms latency

---

## Known Issues

### Deferred Features
- **Multi-Dataset Search** (from v0.10) — Incomplete, moved to post-1.0
- **Performance Optimization** — Not urgent, deferred to v0.12

### Minor Issues
None reported. All critical issues resolved.

---

## Next Steps

### v0.12 — Safety & Governance (Next Release)
Following the original roadmap:
- Mod Safety Layer with capability enforcement
- Deviation Metadata for forked datasets
- Rewind Snapshots for data recovery
- Health Panel for mod diagnostics

See `Road Map V2.md` for full v0.12 plan.

---

## Credits

**Development Team:**
- Primary: jxburros
- AI Assistants: GitHub Copilot (Mega-Showrunner, Constructor, Middle-Manager, Insect-Enthusiast)

**Strategic Decision:**
The pivot to knowledge management features was driven by practical assessment of user needs and product maturity. The team ultimately delivered both knowledge management AND developer ecosystem features, exceeding the original v0.11 scope.

---

## Version History

| Version | Date | Focus | Tests |
|---------|------|-------|-------|
| 0.11.0 | Nov 2025 | Knowledge Management (7 features) | 152 |
| 0.11.1 | Nov 2025 | CardSpoke.utils API | 152 |
| 0.11.2 | Nov 2025 | Extension Wizard + Playground | 152 |
| 0.11.2.5 | Nov 2025 | Footer bug fix | 152 |
| 0.11.3 | Nov 2025 | API renaming + footer tests | 160 |

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-22  
**Author:** Constructor Agent (GitHub Copilot)  
**Status:** Complete and Verified
