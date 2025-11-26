# CardSpoke TODO List
A structured list of **bugs**, **issues**, and **feature improvements** intended for developers (human or AI) working on CardSpoke.  
Format is optimized for LLM parsing.


New Version will be 0.11.4, please make sure to update everywhere.

---

## 🔥 BUGS TO FIX (High Priority)

### 1. Dataset Storage Type Mismatch
**Problem:**  
When creating a new dataset and selecting `IndexedDB`, the Dataset Info modal still reports the storage type as `LocalStorage`.

**Likely Causes:**  
- Storage type not saved in dataset metadata  
- Wrong property referenced in Dataset Info  
- Dataset creation function not passing type correctly

**Expected Behavior:**  
- Dataset Info should display the actual chosen storage type.  
- Storage type should be stored persistently.

---

### 2. Parent Selection Bug in Edit Mode
**Problem:**  
Editing a child card sometimes preselects the wrong parent in the dropdown.  
Observed after:
- Duplicating a card  
- Editing a *different* child card afterwards  
- Parent dropdown incorrectly defaults to the duplicated card instead of the real parent

**Impact:**  
- Accidental hierarchy changes  
- Data integrity risks

**Expected Behavior:**  
- Parent dropdown should always default to the card’s TRUE current parent.

---

### 3. Playground-Generated Cards Not Visible in UI
**Problem:**  
Running sample code in the Extension Playground logs successful creation of a card,  
but the card does not appear in the UI.

**Possible Causes:**  
- Cards created in a sandboxed dataset context  
- Cards not saved to active dataset  
- Missing call to `render()` or dataset refresh function  
- Wrong store reference inside playground context

**Expected Behavior:**  
- Cards created via playground APIs should appear immediately in the UI.

---

### 4. Dataset Naming Issues
**Problem:**  
New datasets created without a custom name generate long “auto-names” like:  
`nested_cards_qa_dataset_abcd12345_timestamp`

**Impact:**  
- Clutters Dataset Manager  
- Hard to visually parse  
- Unfriendly defaults

**Expected Behavior:**  
- Auto-name formats should be short, readable, or date-based  
(e.g., `Dataset_1`, `Cards_2025_01_14`)

---

### 5. Missing Feedback for TXT/Markdown Downloads
**Problem:**  
Exporting TXT/Markdown triggers a toast, but:
- No clear confirmation  
- No “download started” indicator  
- In some environments, download fails silently

**Expected Behavior:**  
- Show a modal or bottom-sheet confirming:  
  “Export ready — click to download”  
- Clear fallback if browser blocks downloads

---

### 6. Minor UI Issues
**Problems:**
- Scrollbars appear in modals even when content fits  
- Upload dialog always defaults to JSON tab, even if TXT was used last  
- High-contrast mode sometimes resets dark/light theme toggles

**Expected Behavior:**  
- Conditional scrollbars only when needed  
- Modal tabs should remember last used tab  
- Theme toggles should not conflict

---

---

## 🌱 FEATURE IMPROVEMENTS (Medium to High Priority)

### 7. Search Enhancements
**Current:**  
Search only matches card titles.

**Improvements Needed:**  
- Search card body text  
- Search tags  
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
  - storage type fix (see Bug #1)

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
  - “Unofficial Extension” disclaimer rules

---

### 14. API / CLI Access
**Features Needed:**
- Local REST API OR JS API accessible via external tools  
- Operations:  
  - add card  
  - update card  
  - delete card  
  - bulk import/export  
  - query cards by tag, parent, body text, etc.  
- Optional: CLI for scripting
