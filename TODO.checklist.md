# CardSpoke TODO List
A structured list of **bugs**, **issues**, and **feature improvements** intended for developers (human or AI) working on CardSpoke.  
Format is optimized for LLM parsing.


New Version will be 0.11.4, please make sure to update everywhere.

---

## 🔥 BUGS TO FIX (High Priority)

### ✅ 1. Dataset Storage Type Mismatch - FIXED in v0.11.4
**Problem:**  
When creating a new dataset and selecting `IndexedDB`, the Dataset Info modal still reports the storage type as `LocalStorage`.

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
- Fixed `h()` helper function to properly handle boolean attributes like `selected`
- No longer sets `selected="false"` which browsers interpret as truthy

---

### ✅ 3. Playground-Generated Cards Not Visible in UI - FIXED in v0.11.4
**Problem:**  
Running sample code in the Extension Playground logs successful creation of a card,  
but the card does not appear in the UI.

**Solution (v0.11.4):**
- Added `render()` call after card creation in `CardSpoke.utils.createCard()`
- Cards now appear immediately in UI after creation via playground

---

### ✅ 4. Dataset Naming Issues - FIXED in v0.11.4
**Problem:**  
New datasets created without a custom name generate long "auto-names" like:  
`nested_cards_qa_dataset_abcd12345_timestamp`

**Solution (v0.11.4):**
- Auto-generates friendly default names like `Dataset_1`, `Dataset_2`
- Key names are now shorter: `cards_[name]_[shortid]`
- Display name stored in metadata for consistent display

---

### ✅ 5. Missing Feedback for TXT/Markdown Downloads - FIXED in v0.11.4
**Problem:**  
Exporting TXT/Markdown triggers a toast, but:
- No clear confirmation  
- No "download started" indicator  
- In some environments, download fails silently

**Solution (v0.11.4):**
- Added `downloadWithFeedback()` helper with improved notifications
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

### 7. Search Enhancements
**Current:**  
Search already matches card titles, body text, and tags (fuzzy search implemented).

**Additional Improvements Needed:**  
- Filters:  
  - by tag  
  - by starred/bookmarked  
  - by card creation/modification date  
- Optional advanced search modal

---

### 8. Tag Management System
**Features Needed:**
- View all tags  
- Rename tags  
- Merge tags  
- Delete unused tags  
- Tags displayed as clickable chips on card pages  
- Quick filtering by clicking a tag

---

### 9. Undo / Redo System
**Reasons:**  
- Easy to accidentally delete or mis-parent cards  
- Hard to fix mistakes without undo functionality

**Desired Behaviors:**  
- Ctrl+Z / Ctrl+Y  
- Trash bin / recycle bin for deleted cards  
- Undo parent changes, body changes, tag changes

---

### 10. Drag-and-Drop Ordering
**Features Needed:**
- Reorder children within a card  
- Drag a card onto another card to set new parent  
- Visual indicators during drag  
- Optional: reordering top-level cards

---

### 11. Better Dataset Metadata
**Fixes/Improvements Needed:**
- Allow editing dataset name  
- Store and display:  
  - last modified date  
  - card count  
  - dataset size  
  - ✅ storage type fix (see Bug #1) - DONE

---

### 12. Rich Text / Markdown Editing
**Desired Features:**
- Markdown support OR WYSIWYG editor  
- Preview mode  
- Markdown import/export that preserves formatting  
- Optional toolbar for bold, italics, headers, lists, code blocks

---

### 13. Extensions Store (Post 1.0 Preparation)
**Notes:**  
- UI placeholders okay for now  
- Needs infrastructure design later  
- Should allow:  
  - listing extensions  
  - browsing categories (themes, mods, scripts)  
  - install/uninstall toggles  
  - developer attribution  
  - "Unofficial Extension" disclaimer rules

---

### 14. API / CLI Access
**Features Needed:**
- ✅ Local JS API accessible via window.CardSpoke.utils - DONE
- Operations:  
  - ✅ add card - DONE
  - ✅ update card - DONE
  - ✅ delete card - DONE (via deleteCard internal function)
  - bulk import/export  
  - ✅ query cards by tag, body text - DONE (searchCards)
- Optional: CLI for scripting
- Optional: REST API for external tools
