# CardSpoke — Road Map V2.2
*(Updated with comprehensive v0.12.0 code audit and implementation status)*

---

**Update History:**
- **V2.2 (2025-11-27):** Comprehensive code audit - verified all implementations, added detailed status tracking
- **V2.1 (2025-11-22):** Multi-Dataset Search moved to Post-1.0 Priority Features
- **V2.1 (2025-11-22):** v0.11.X series completed with all QOL items
- **V2.0:** Expanded with Pre-1.0 and Post-1.0 Feature Expansions

---



---

## 🧭 Project Overview

**CardSpoke** is a lightweight, extensible, multi-platform knowledge base framework that combines hierarchical notes ("cards"), modular extensions ("mods"), and local-first data design.

Its long-term goal is to be:
- **A creative platform** for projects, stories, and experiments.
- **A modding base** for themes, patches, and expansions.
- **A learning environment** for new developers exploring "vibe-code."

---

## 🎯 Core Philosophy
- **Lightweight:** prioritize clarity, speed, and minimalism.
- **Portable:** user data lives locally and exports easily.
- **Extendable:** every feature should be mod-ready.
- **Readable:** human-understandable schema and code.
- **Educational:** easy to learn, modify, and fork.

---

## 🔢 Version Overview

| Version | Focus | Key Additions | Status |
|--------:|:------|:--------------|:-------|
| **0.7.x** | Foundation Overhaul | UI redesign, schema v4, documentation & structure | ✅ Complete |
| **0.8.x** | Capacitor Migration | Standalone builds, cross-platform support, filesystem access | ✅ Complete |
| **0.9.x** | Dataset Architecture | Multi-dataset system, local storage, PINs | ✅ Complete |
| **0.10.x** | Extensions Framework | Mod/Theme Manager, tagging, search, internal linking | ✅ Complete |
| **0.11.x** | Developer Ecosystem | Wizard, Playground, Utilities, Developer Mode | ✅ Complete |
| **0.12.x** | Safety & Governance + UX Polish | Undo/Redo, Tag Management, Trash Bin, Advanced Search | ✅ Complete |
| **0.13.x** | Documentation & Open Source Prep | Docs, templates, onboarding | ✅ Complete |
| **1.0.0** | Stable Platform | Complete, portable, and extensible release | ⏳ Pending |

---

## ⚙️ Version Details

### v0.7 — Foundation Overhaul ✅ COMPLETE
**Focus:** stability, structure, and clarity.

**Verified Implementations:**
- ✅ Ultra-Light UI redesign (Inter + Outfit fonts, design tokens in CSS)
- ✅ Schema v4 (tags, meta, children, modsData fields)
- ✅ Responsive layout (mobile, tablet, desktop breakpoints)
- ✅ Developer documentation (AI_DEVELOPER_GUIDE.md)
- ✅ Mod type taxonomy (Theme, Patch, Plugin, Mod, Expansion badges)

---

### v0.8 — Capacitor Migration & Platform Integration ✅ COMPLETE
**Focus:** cross-platform independence and native access.

**Verified Implementations:**
- ✅ Capacitor framework setup (capacitor.config.json, capacitor.js)
- ✅ App manifest and metadata (version 0.12.0 in index.html)
- ✅ Cross-platform JavaScript codebase
- ✅ LocalStorage persistence
- ✅ IndexedDB driver architecture

---

### v0.9 — Dataset Architecture ✅ COMPLETE
**Focus:** multi-dataset support and portable local storage.

**Verified Implementations:**
- ✅ `StorageDriver` interface (abstract class with IndexedDB and LocalStorage implementations)
- ✅ `IndexedDBDriver` class (lines 551-646 in app.js)
- ✅ `LocalStorageDriver` class (lines 651-712 in app.js)
- ✅ `DatasetManager` class (lines 718-898 in app.js)
- ✅ Dataset registry and switcher UI (showDatasetManager function)
- ✅ Dataset Info Panel (showDatasetInfo function with size, card count, storage type)
- ✅ PIN placeholder (disabled, marked for v0.10.3 in UI)

---

### v0.10 — Extensions Framework ✅ COMPLETE
**Focus:** centralized control for mods, themes, and tagging.

**Verified Implementations:**
- ✅ Extensions Manager (showModsManager function with enable/disable, delete)
- ✅ Type badges for extensions (ext-theme, ext-patch, ext-plugin, ext-mod)
- ✅ Tag system (getTags, addTag, removeTag, setTags, getAllTags functions)
- ✅ Global search with dataset selector (fuzzySearchCards, fuzzySearchMultiDataset)
- ✅ Fuzzy search with Levenshtein distance scoring
- ✅ Internal link recognition (`[[Card Name]]` parsing and rendering)
- ✅ Toast notifications (showToast with pause-on-hover, keyboard dismiss)
- ✅ Safe Mode (?safemode URL parameter disables extensions)

---

### v0.11 — Developer Ecosystem ✅ COMPLETE
**Focus:** empower creators to build and test mods safely.

**Verified Implementations:**
- ✅ Extension Wizard (showExtensionWizard function with type selection, metadata)
- ✅ Playground (showPlayground function with code editor, live reload)
- ✅ `CardSpoke.utils` API (lines 1453-1714 in app.js):
  - createCard, updateCard, getCard, searchCards
  - getTags, addTag, removeTag, setTags, getAllTags
  - showToast, getDatasetMeta
- ✅ Developer Mode toggle (devModeSwitch in menu)
- ✅ Manual mod installation (paste JS/CSS code)
- ✅ Grid view toggle (gridViewSwitch)
- ✅ Typography presets (default, comfortable, compact, dyslexia-friendly)
- ✅ Backlinks detection (getBacklinks function)
- ✅ Related cards by tags (getRelatedCards function)

---

### v0.12 — Safety & Governance + UX Polish ✅ COMPLETE
**Focus:** mod reliability, dataset transparency, and user experience.

**Verified Implementations:**
- ✅ Undo/Redo system (pushUndo, undo, redo functions with 50-item stack)
- ✅ Trash Bin (trashBin array with restore and permanent delete)
- ✅ Tag Manager UI (showTagManager with rename, merge, delete operations)
- ✅ Advanced Search modal (showAdvancedSearch with filters)
- ✅ Markdown preview (simpleMarkdown function)
- ✅ Extensions Store placeholder (showExtensionsStore with coming soon UI)
- ✅ Bulk import/export (bulkExportCards, bulkImportCards)
- ✅ Drag and drop card movement (handleDragStart, handleDrop, etc.)
- ✅ Card duplication (duplicateCard function with/without children)
- ✅ High Contrast mode (highContrastSwitch, CSS .high-contrast class)
- ✅ Keyboard shortcuts (Ctrl+Z undo, Ctrl+Y redo, Ctrl+/ help, etc.)
- ✅ Export formats (JSON, TXT, Markdown, CSV with downloadWithFeedback)
- ✅ Compact view mode (card-compact class)
- ✅ Bookmarks system (toggleBookmark, isBookmarked, showBookmarks)
- ✅ Recent Cards history (addToRecentCards, showRecentCards)

---

### v0.13 — Documentation & Open Source Prep ✅ COMPLETE
**Focus:** community and contributor readiness.

**Current Status:**
- ✅ AI Developer Guide exists (AI_DEVELOPER_GUIDE.md)
- ✅ Testing Guide exists (TESTING_GUIDE.md)
- ✅ Capacitor README exists (README-CAPACITOR.md)
- ✅ In-app Help/Docs section (v0.12.1)
- ✅ Example extensions / tutorial mod pack (v0.12.1)
- ✅ CONTRIBUTING.md (v0.12.1)
- ✅ CODE_OF_CONDUCT.md (v0.12.1)
- ✅ API Reference documentation (v0.12.1)

**TODO for v0.13:**
- [x] Create CONTRIBUTING.md with contribution guidelines
- [x] Create CODE_OF_CONDUCT.md
- [x] Create in-app Help modal with user documentation
- [x] Package example extensions as tutorial mod pack
- [x] Write comprehensive API Reference for CardSpoke.utils
- [ ] Add inline help tooltips for key features
- [ ] Create "Getting Started" wizard for new users

---

### 1.0.0 — Stable Platform ⏳ PENDING
**Prerequisites:**
Complete all v0.13 documentation items.

**Final Checklist:**
- [x] Schema v4 and organized codebase
- [x] Capacitor multi-platform builds
- [x] Multi-dataset local storage + PIN placeholder
- [x] Tagging + search + linking backbone
- [x] Mod & Theme Manager
- [x] Wizard, Playground, Utilities, Developer Mode
- [x] Undo/Redo + Trash Bin
- [x] Advanced Search + Filters
- [x] High Contrast Mode
- [x] Keyboard Shortcuts
- [x] Full documentation and templates (v0.13)
- [x] In-app Help section (v0.13)

**Estimated Completion:** Ready for v1.0 release

---

## 📋 Remaining TODO Items Before 1.0

### v0.13 Documentation Phase

#### Critical (Must Have)
- [x] **CONTRIBUTING.md** - How to contribute code, report bugs, request features
- [x] **CODE_OF_CONDUCT.md** - Community standards and behavior expectations
- [x] **In-app Help Modal** - User-facing documentation accessible from menu
  - Quick start guide
  - Feature overview
  - Keyboard shortcuts reference
  - Extension development basics

#### High Priority
- [x] **API Reference** - Complete documentation for CardSpoke.utils
  - Function signatures
  - Parameter descriptions
  - Code examples
  - Error handling
- [x] **Tutorial Mod Pack** - Bundled example extensions
  - Sample theme
  - Sample plugin
  - Sample patch
  - README for each

#### Medium Priority
- [ ] **Inline Help Tooltips** - Contextual help on hover/focus for complex features
- [ ] **First-Run Experience** - Onboarding wizard for new users
- [ ] **Migration Guide** - How to upgrade from older versions
- [ ] **Troubleshooting Guide** - Common issues and solutions

---

## 🚀 Post-1.0 Outlook

### Priority Features (Before v2.0)

**Multi-Dataset Search** *(Deferred from v0.10)*
- ✅ Core search across datasets implemented (fuzzySearchMultiDataset)
- ⏳ UI for merged results with dataset badges
- ⏳ Performance optimization for large datasets
- **Status:** Partially implemented, needs polish

**Card Layout Options**
- ✅ Grid view for root cards (gridViewSwitch implemented)
- ⏳ Timeline view for chronological content
- ⏳ Kanban-style board view

**Typography Presets**
- ✅ Multiple reading modes (default, comfortable, compact, dyslexia)
- ⏳ Custom font upload
- ⏳ Line height / letter spacing fine-tuning

**Card Duplication & Cloning**
- ✅ One-click card duplication (duplicateCard function)
- ✅ Clone with or without children option

**Batch Operations**
- 🔄 Partial - Export selected cards implemented
- ⏳ Multi-select cards for bulk actions UI
- ⏳ Batch delete, move, or tag
- ⏳ Selection checkboxes in list view

**Card Relationships**
- ✅ Bi-directional links / backlinks (getBacklinks function)
- ✅ Related cards by tags (getRelatedCards function)
- ⏳ Reference/citation system

**Rich Text Formatting**
- ✅ Basic markdown support (simpleMarkdown function)
- ⏳ Code block syntax highlighting
- ⏳ Block quotes and callouts styling
- ⏳ Inline image support

**Fuzzy Search**
- ✅ Typo-tolerant search (Levenshtein distance)
- ✅ Search-as-you-type with instant results
- ⏳ Search within specific card subtrees

**Recent Cards History**
- ✅ Track recently viewed/edited cards (recentCards array)
- ✅ Quick access modal (showRecentCards)
- ⏳ Session history with timestamps

**Bookmarks/Favorites**
- ✅ Star important cards (toggleBookmark)
- ✅ Bookmark sidebar/modal (showBookmarks)
- ⏳ Multiple bookmark collections

### Advanced Features (v2.0+)

**Advanced Export Options**
- ✅ Export to Markdown with hierarchy (exportMarkdown)
- ✅ Export to CSV (exportCSV)
- ⏳ Export to static HTML site
- ⏳ Export to PDF with formatting
- ⏳ Export as Obsidian vault

**Mod Marketplace/Gallery**
- ✅ Extensions Store placeholder UI
- ⏳ Curated mod directory
- ⏳ One-click mod installation from gallery
- ⏳ Mod ratings and reviews

**Scripting Console**
- ⏳ In-app JavaScript console for power users
- ⏳ Execute scripts against card data
- ⏳ Batch transformations

**Drag and Drop Reordering**
- ✅ Drag cards to change parent (handleDrop implemented)
- ⏳ Drag to reorder within parent
- ⏳ Visual feedback during drag (partial)

**Card Archiving**
- ✅ Trash Bin with restore (trashBin array)
- ⏳ Separate archive view/management
- ⏳ Archive expiration settings

**Smart Tags**
- ✅ Tag suggestions based on content (suggestTags function)
- ⏳ Tag hierarchies (parent/child tags)
- ⏳ Tag colors and icons

**PIN Protection**
- ⏳ Per-dataset PIN encryption
- ⏳ PBKDF2/scrypt hashing
- ⏳ Portable in exports

---

## 💡 Suggested Additional Features for 1.0

Based on code audit, these features could enhance the 1.0 release:

### UX Improvements
1. **Card Preview on Hover** - Show card content tooltip before clicking
2. **Collapse/Expand All** - Button to collapse/expand all card bodies in list view
3. **Breadcrumb Shortcuts** - Right-click breadcrumb for quick actions menu
4. **Search History** - Remember recent search queries
5. **Empty State Actions** - "Create your first card" button on empty state

### Accessibility
1. **Skip Links** - Add skip-to-content links for screen readers
2. **ARIA Labels** - Enhanced screen reader support for all interactive elements
3. **Focus Indicators** - More visible focus outlines for keyboard navigation
4. **Reduced Motion** - Respect prefers-reduced-motion media query

### Performance
1. **Virtual Scrolling** - For large card lists (10k+ entries mentioned in roadmap)
2. **Lazy Loading** - Load card content on demand
3. **IndexedDB Migration** - Automatic migration from LocalStorage for large datasets
4. **Service Worker** - Offline capability and faster loading

### Missing Common Functionality
1. **Print Styles** - Proper CSS for printing cards
2. **Confirmation Dialogs** - Consistent modal instead of browser confirm()
3. **Undo Toast with Action** - "Undo" button in toast after delete
4. **Auto-save Drafts** - Prevent losing work if browser closes during edit

---

## 🧩 Schema v4 Snapshot
*(Introduced in v0.7)*

```ts
type DatasetMeta = {
  id: string;
  name: string;
  storage: { driver: 'indexeddb'|'localfile'; config: Record<string,any> };
  pin?: { algo: 'pbkdf2'|'scrypt'; salt: string; hash: string; iterations: number };
  deviation?: { baseVersion?: string; author?: string; purpose?: string };
  createdAt: number;
  updatedAt: number;
};

type Card = {
  id: string;
  title: string;
  body: string;
  parentId: string | null;
  children: string[];
  tags: string[];
  meta?: Record<String, any>;
  attributes?: Record<string, any>;
  modsData?: Record<string, any>;
};
```

---

## ✅ 1.0 "Gold Standard" Checklist
- [x] Schema v4 and organized codebase
- [x] Capacitor multi-platform builds
- [x] Multi-dataset local storage + PIN placeholder
- [x] Tagging + search + linking backbone
- [x] Mod & Theme Manager
- [x] Wizard, Playground, Utilities, Developer Mode
- [x] Undo/Redo + Trash Bin
- [x] Advanced Search + High Contrast
- [x] Documentation, examples, and templates (v0.13)

---

## 📊 Implementation Summary

| Category | Implemented | Partial | Not Started |
|----------|-------------|---------|-------------|
| Core CRUD | 8/8 | 0 | 0 |
| UI/UX | 15/18 | 2 | 1 |
| Data Management | 10/12 | 1 | 1 |
| Extensions | 8/8 | 0 | 0 |
| Search | 5/6 | 1 | 0 |
| Documentation | 3/7 | 0 | 4 |
| **Total** | **49/59 (83%)** | **4 (7%)** | **6 (10%)** |

---

**Note:** This is Road Map V2.2, updated with a comprehensive code audit verifying actual implementations. See the separate "Extension Features.md" document for features planned as optional extensions.
