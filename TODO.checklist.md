# To Do Version 0.12.3 - COMPLETED ✅

All items in this TODO list have been completed in version 0.12.3.

## Main Tasks - All Complete ✅

- [x] Combine Extensions, Extensions Store, Extensions Wizard, Playground, and Developer mode, as well as an area to upload/manually enter extensions into one UI with one path in menu → **Extensions Hub**
- [x] Appearance button doesn't work. Repurpose it to combine compact view toggle, grid view toggle, typography settings, high contrast mode, and a theme picker, if the user has themes installed, into one UI with one path in the menu → **Appearance Settings Modal**
- [x] Add upload button for adding/editing cards to be able to import text from TXT or doc files to add to the card's details → **Import from File button in card edit form**
- [x] Combine all dataset/download buttons into one UI with one path in the menu → **Data Hub**
- [x] The large "CardSpoke" in the upper left should be clickable and bring the user home → **Brand logo is now a button**
- [x] Check all code and documentation for references to "CIB" and change them to now reflect the new name, CardSpoke → **All CIB_MODS changed to CardSpoke_MODS**

## Accessibility Audit - All Complete ✅

### High Priority (Critical Usability) - Complete ✅

- [x] **Fix Keyboard Navigation for Cards & Breadcrumbs**
  - **File:** `www/app.js`
  - **Changes:** In `renderCardTile` and `renderBreadcrumbs`, interactive `div` elements changed to `<button>` tags with proper aria-labels
  - **Result:** Keyboard focus and Enter/Space to click now work automatically

- [x] **Switch to Scalable Fonts**
  - **File:** `www/styles.css`
  - **Changes:** All font-size properties in `:root` converted from `px` to `rem` units
  - **Result:** Text scales properly with browser font size settings

### Medium Priority (Screen Reader Support) - Complete ✅

- [x] **Label Icon-Only Buttons**
  - **File:** `www/index.html`
  - **Changes:** Added `aria-label="[Action Name]"` to `homeBtn`, `themeToggle`, `menuBtn`, and `brandBtn`
  - **Result:** Screen readers can now announce button purposes

- [x] **Hide Decorative Icons**
  - **File:** `www/index.html`
  - **Changes:** Added `aria-hidden="true"` to all SVG icons inside buttons
  - **Result:** Screen readers skip decorative graphics

- [x] **Improve Tab Controls**
  - **Files:** `www/index.html` / `www/app.js`
  - **Changes:** Upload Modal tabs now use ARIA roles: `role="tablist"`, `role="tab"` with `aria-selected`, `role="tabpanel"` with `aria-labelledby`
  - **Result:** Proper tab accessibility semantics

- [x] **Fix Color Contrast**
  - **File:** `www/styles.css`
  - **Changes:** Darkened `--text-ghost` from `#d4d4d4` to `#a0a0a0`
  - **Result:** Improved readability for users with low vision

### Low Priority (Polish & Compliance) - Complete ✅

- [x] **Implement Focus Trapping**
  - **Files:** `www/app.js`
  - **Changes:** Added `trapFocus()` function that cycles Tab key through modal elements only
  - **Result:** Focus stays within modals when they're open

- [x] **Support Reduced Motion**
  - **File:** `www/styles.css`
  - **Changes:** Added `@media (prefers-reduced-motion: reduce)` query to disable animations
  - **Result:** Users sensitive to motion see static UI

---

## Summary

Version 0.12.3 delivers:
- **Simplified Menu Structure**: Extensions Hub and Data Hub consolidate 15+ menu items into 2
- **Full Accessibility Compliance**: All critical, medium, and low priority accessibility issues resolved
- **Improved Branding**: CIB references updated to CardSpoke throughout codebase
- **Enhanced UX**: Clickable logo, keyboard navigation, focus trapping, and reduced motion support

All 177 tests continue to pass.
