# CardSpoke Test Mods

This directory contains test mods for CardSpoke version 0.7.4. These mods demonstrate the extension system capabilities and can be used to test mod installation and functionality.

## Available Test Mods

### 1. Simple Timestamp Mod
**File:** `simple-timestamp-mod.json`  
**Type:** Plugin  
**Complexity:** Simple

**Description:**
A simple mod that adds a timestamp display to each card showing when it was last updated. This is a basic example demonstrating the `onCardRender` hook.

**Features:**
- Displays "Last updated" timestamp on each card
- Uses card's `updatedAt` or `createdAt` timestamp
- Formatted in local date/time format
- Minimal styling that matches the app's design system

**How to Install:**
1. Open CardSpoke 0.7.4
2. Click the Menu (☰) button
3. Select "Upload Content"
4. Go to the "Mods" tab
5. Click to upload and select `simple-timestamp-mod.json`
6. Go to "Extensions" from the menu
7. Enable the "Simple Timestamp Mod"

---

### 2. Card Statistics Mod
**File:** `card-statistics-mod.json`  
**Type:** Plugin  
**Complexity:** Moderately Complex

**Description:**
A comprehensive statistics mod that displays detailed analytics about your card collection. It adds a statistics panel to each card and provides a global statistics view accessible from the header.

**Features:**
- **Per-Card Statistics:**
  - Word count
  - Character count
  - Direct children count
  - Total descendants count
  - Maximum hierarchy depth
  - Total words in subtree
  
- **Global Statistics:**
  - Total cards in collection
  - Total words across all cards
  - Total characters
  - Average words per card
  - Maximum hierarchy depth
  - Number of root cards
  - Top 5 most used tags

- **UI Enhancements:**
  - Adds a statistics button (📊) to the header
  - Statistics panel appears below each card's content
  - Modal overlay for global statistics
  - Fully styled to match CardSpoke's design system

**How to Install:**
1. Open CardSpoke 0.7.4
2. Click the Menu (☰) button
3. Select "Upload Content"
4. Go to the "Mods" tab
5. Click to upload and select `card-statistics-mod.json`
6. Go to "Extensions" from the menu
7. Enable the "Card Statistics Mod"
8. Click the new 📊 button in the header to view global statistics

---

## Technical Details

### Mod Structure
Both mods follow the CardSpoke mod schema:
```json
{
  "id": "mod-identifier",
  "meta": {
    "name": "Display Name",
    "creator": "jxburros",
    "version": "1.0.0",
    "releaseDate": "YYYY-MM-DD",
    "description": "Mod description",
    "type": "Plugin"
  },
  "js": "JavaScript code using CIB_MODS.register(...)",
  "css": "Optional CSS styles"
}
```

### Hooks Used

**Simple Timestamp Mod:**
- `onAppInit`: Logs initialization and shows toast notification
- `onCardRender`: Adds timestamp display to each rendered card

**Card Statistics Mod:**
- `onAppInit`: Initializes mod, adds header button, shows toast notification
- `onCardRender`: Calculates and displays per-card statistics

### API Usage

Both mods demonstrate proper usage of the CardSpoke API:
- `ctx.api.getCard(id)` - Retrieve card data
- `ctx.api.listCards()` - Get all cards
- `ctx.api.listRootIds()` - Get root card IDs
- `ctx.api.showToast(message, type)` - Display notifications

---

## Testing Guidelines

### Simple Timestamp Mod Testing:
1. Create a few test cards
2. Enable the mod
3. Navigate to different cards and verify timestamps appear
4. Edit a card and check if the timestamp updates on next view
5. Disable the mod and verify timestamps disappear

### Card Statistics Mod Testing:
1. Create a hierarchy of cards with various depths
2. Add content to cards (different word counts)
3. Add tags to some cards
4. Enable the mod
5. Verify statistics panel appears on each card
6. Check that statistics are accurate
7. Click the 📊 button to view global statistics
8. Verify global statistics are correct
9. Test with edge cases (empty cards, cards with no children)

---

## Troubleshooting

If a mod doesn't load:
1. Check browser console (F12) for errors
2. Verify JSON file is valid
3. Ensure mod ID is unique
4. Check that the mod is enabled in Extensions

If a mod behaves unexpectedly:
1. Disable the mod
2. Check console for error messages
3. Reload the page
4. Re-enable the mod

---

## Credits

**Creator:** jxburros  
**Version:** 1.0.0  
**Release Date:** November 11, 2025  
**Framework:** CardSpoke 0.7.4

These mods are provided as examples and testing tools. Feel free to modify and extend them for your own use.
