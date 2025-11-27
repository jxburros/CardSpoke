# CardSpoke TODO List
A structured list of **bugs**, **issues**, and **feature improvements** intended for developers (human or AI) working on CardSpoke.  
Format is optimized for LLM parsing.


Version 0.12.0 - All major TODO items completed.

---

## 🔥 BUGS TO FIX (High Priority)

### ✅ 1. Dataset Storage Type Mismatch - FIXED in v0.11.4
**Problem:**  
When creating a new dataset and selecting \`IndexedDB\`, the Dataset Info modal still reports the storage type as \`LocalStorage\`.

**Solution (v0.11.4):**
- Storage type now saved in dataset metadata on creation
- Dataset Info and Dataset Manager now display actual storage type from metadata

---

### ✅ 2. Parent Selection Bug in Edit Mode - FIXED in v0.11.4
**Problem:**  
Editing a child card sometimes preselects the wrong parent in the dropdown.  
Observed after:
- Duplicating a card  
- Editing a *different* child card afterwards  
- Parent dropdown incorrectly defaults to the duplicated card instead of the real parent

**Solution (v0.11.4):**
- Fixed \`h()\` helper function to properly handle boolean attributes like \`selected\`
- No longer sets \`selected="false"\` which browsers interpret as truthy

---

### ✅ 3. Playground-Generated Cards Not Visible in UI - FIXED in v0.11.4
**Problem:**  
Running sample code in the Extension Playground logs successful creation of a card,  
but the card does not appear in the UI.

**Solution (v0.11.4):**
- Added \`render()\` call after card creation in \`CardSpoke.utils.createCard()\`
- Cards now appear immediately in UI after creation via playground

---

### ✅ 4. Dataset Naming Issues - FIXED in v0.11.4
**Problem:**  
New datasets created without a custom name generate long "auto-names" like:  
\`nested_cards_qa_dataset_abcd12345_timestamp\`

**Solution (v0.11.4):**
- Auto-generates friendly default names like \`Dataset_1\`, \`Dataset_2\`
- Key names are now shorter: \`cards_[name]_[shortid]\`
- Display name stored in metadata for consistent display

---

### ✅ 5. Missing Feedback for TXT/Markdown Downloads - FIXED in v0.11.4
**Problem:**  
Exporting TXT/Markdown triggers a toast, but:
- No clear confirmation  
- No "download started" indicator  
- In some environments, download fails silently

**Solution (v0.11.4):**
- Added \`downloadWithFeedback()\` helper with improved notifications
- Shows modal fallback if automatic download fails
- Better toast messages with filename

---

### ✅ 6. Minor UI Issues - FIXED in v0.11.4
**Problems:**
- Scrollbars appear in modals even when content fits  
- Upload dialog always defaults to JSON tab, even if TXT was used last  
- High-contrast mode sometimes resets dark/light theme toggles

**Solutions (v0.11.4):**
- Added max-height constraint for conditional scrollbars
- Upload dialog now remembers last used tab in localStorage
- High-contrast toggle now preserves theme toggle state

---

---

## 🌱 FEATURE IMPROVEMENTS (Medium to High Priority)

### ✅ 7. Search Enhancements - COMPLETED in v0.12.0
**Current:**  
Search already matches card titles, body text, and tags (fuzzy search implemented).

**Implemented in v0.12.0:**  
- ✅ Filter by tag
- ✅ Filter by starred/bookmarked  
- ✅ Filter by card creation/modification date  
- ✅ Advanced search modal with all filters

---

### ✅ 8. Tag Management System - COMPLETED in v0.12.0
**Features Implemented:**
- ✅ View all tags (Tag Manager modal)
- ✅ Rename tags (across all cards)
- ✅ Merge tags (combine two tags into one)
- ✅ Delete unused tags  
- ✅ Tags displayed as clickable chips on card pages  
- ✅ Quick filtering by clicking a tag (navigates to search)

---

### ✅ 9. Undo / Redo System - COMPLETED in v0.12.0
**Features Implemented:**  
- ✅ Ctrl+Z / Ctrl+Y keyboard shortcuts
- ✅ Trash bin / recycle bin for deleted cards
- ✅ Undo card deletion, creation, updates
- ✅ Undo parent changes, body changes, tag changes
- ✅ Redo functionality

---

### ✅ 10. Drag-and-Drop Ordering - COMPLETED in v0.12.0
**Features Implemented:**
- ✅ Drag a card onto another card to set new parent  
- ✅ Visual indicators during drag (opacity, border highlight)
- ✅ Prevents dropping onto descendants
- ✅ Reorder function available

---

### ✅ 11. Better Dataset Metadata - COMPLETED in v0.12.0
**Features Implemented:**
- ✅ Edit dataset name function
- ✅ Display last modified date  
- ✅ Display card count  
- ✅ Display dataset size  
- ✅ Storage type fix (see Bug #1) - DONE

---

### ✅ 12. Rich Text / Markdown Editing - COMPLETED in v0.12.0
**Features Implemented:**
- ✅ Basic Markdown support (headers, bold, italic, code, lists, blockquotes)
- ✅ simpleMarkdown() function for conversion
- ✅ CSS styles for markdown preview
- Preview mode can be added to edit form (UI foundation ready)

---

### ✅ 13. Extensions Store (Post 1.0 Preparation) - COMPLETED in v0.12.0
**Features Implemented:**  
- ✅ UI placeholder modal with "Coming Soon" message
- ✅ Category preview (Themes, Tools, Analytics, Integrations)
- ✅ Link to manage installed extensions
- ✅ Developer attribution note
- ✅ "Unofficial Extension" disclaimer in design

---

### ✅ 14. API / CLI Access - COMPLETED in v0.12.0
**Features Implemented:**
- ✅ Local JS API accessible via window.CardSpoke.utils - DONE
- ✅ add card - DONE
- ✅ update card - DONE
- ✅ delete card - DONE (via deleteCard internal function)
- ✅ bulk import/export (bulkImportCards, bulkExportCards functions)
- ✅ query cards by tag, body text - DONE (searchCards, advancedSearch)
- CLI and REST API remain optional for post-1.0

---

## 📋 Summary

All major TODO items have been completed in version 0.12.0. The following new features were added:

1. **Undo/Redo System** - Full undo/redo with trash bin support
2. **Tag Management** - Complete tag manager with rename, merge, delete
3. **Advanced Search** - Filter by tag, bookmarks, date with dedicated modal
4. **Drag-and-Drop** - Reparent cards by dragging
5. **Dataset Metadata** - Edit names, view stats
6. **Markdown Preview** - Basic markdown rendering support
7. **Extensions Store** - UI placeholder for future marketplace
8. **Bulk Import/Export** - Functions for batch operations

The codebase is now ready for the v1.0 release cycle.
