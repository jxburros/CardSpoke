To Do Version 0.12.3

- Combine Extensions, Extensions Store, Extensions Wizard, Playground, and Developer mode, as well as an area to upload/manually enter extensions into one UI with one path in menu
- Appearance button doesn't work.  Repurose it to combine compact view toggle, grid view toggle, typography settings, high contrast mode, and a theme picker, if the user has themes installed, into one UI with one path in the menu
- Add upload button for adding/editing cards to be able to import text from TXT or doc files to add to the card's details
- Combine all dataset/download buttons into one UI with one path in the menu
- The large "CardSpoke" in the upper left should be clickable and bring the user home.
- Check all code and documentation for references to "CIB" and change them to now reflect the new name, CardSpoke.
- Based on the accessibility audit, here is a prioritized to-do list to make CardSpoke more accessible:

### High Priority (Critical Usability)

- [ ] **Fix Keyboard Navigation for Cards & Breadcrumbs**
  - **File:** `www/app.js`
  - **Task:** In `renderCardTile` and `renderBreadcrumbs`, change the interactive `div` elements to `<button>` tags (or `<a>` tags).
  - **Why:** This automatically gives them keyboard focus and "Enter/Space to click" functionality without writing extra code.

- [ ] **Switch to Scalable Fonts**
  - **File:** `www/styles.css`
  - **Task:** Find all `font-size` properties (especially in `:root` and typography presets) and change `px` units to `rem`.
  - **Why:** Ensures text scales up when users adjust their browser's default font size for readability.

### Medium Priority (Screen Reader Support)

- [ ] **Label Icon-Only Buttons**
  - **File:** `www/index.html`
  - **Task:** Add `aria-label="[Action Name]"` to buttons like `homeBtn`, `themeToggle`, and `menuBtn`.
  - **Why:** Screen readers cannot read the icon; they need a text label to explain what the button does.

- [ ] **Hide Decorative Icons**
  - **File:** `www/index.html`
  - **Task:** Add `aria-hidden="true"` to the `<svg>` tags inside buttons.
  - **Why:** Prevents screen readers from trying to describe the vector graphic data, which is noise to the user.

- [ ] **Improve Tab Controls**
  - **File:** `www/index.html` / `www/app.js`
  - **Task:** Update the Upload Modal to use standard ARIA roles:
    - Container: `role="tablist"`
    - Buttons: `role="tab"` (and manage `aria-selected`)
    - Content: `role="tabpanel"`

- [ ] **Fix Color Contrast**
  - **File:** `www/styles.css`
  - **Task:** Darken the `--text-ghost` color slightly.
  - **Why:** Ensure text is readable against the background for users with low vision.

### Low Priority (Polish & Compliance)

- [ ] **Implement Focus Trapping**
  - **Task:** When a modal opens, ensure the "Tab" key cycles *only* through elements inside that modal, not the page behind it.

- [ ] **Support Reduced Motion**
  - **File:** `www/styles.css`
  - **Task:** Wrap animation styles in a `@media (prefers-reduced-motion: reduce)` query to disable them for users sensitive to motion.
