# Extension Development Documentation Notes

**Version:** 0.15.0
**Date:** 2025-11-30
**Purpose:** Document observations and improvement suggestions for the CardSpoke extension system documentation

---

## Overview

This document captures observations made while creating and testing the 10 sample extensions. It identifies documentation strengths and areas that could be improved to help extension developers.

---

## Documentation Strengths ✅

### 1. AI Developer Guide (AI_DEVELOPER_GUIDE.md)
- Excellent overview of the codebase structure
- Clear version management rules
- Comprehensive listing of hooks and their purposes
- Good code examples for common operations

### 2. Extension Cookbook (docs/extension-cookbook.md)
- Practical, recipe-based approach
- Well-organized by task type
- Good examples of error handling patterns
- Covers advanced patterns like state machines and retry logic

### 3. Schema Reference (docs/schema-reference-v0.13.md)
- Complete mod schema documentation
- Clear field descriptions with types
- Good examples of valid structures

### 4. Sample Extensions README (sample-extensions/README.md)
- Excellent learning path suggestions
- Clear complexity ratings
- Comprehensive feature descriptions
- Troubleshooting section

---

## Areas for Improvement 📝

### 1. Hook Behavior Documentation

**Issue:** The documentation lists hooks but doesn't fully explain:
- When exactly each hook fires (timing relative to other operations)
- The complete signature of each hook's context parameter
- Whether hooks can be async and what happens if they are

**Suggestion:** Add a "Hooks Deep Dive" section with:
```javascript
/**
 * onCardSave(ctx, card, saveInfo)
 * 
 * Fires: After card data is validated, before storage write
 * Context: { modId, utils, logger }
 * Parameters:
 *   - card: The card being saved (full object)
 *   - saveInfo: { isNew: boolean, previousData: object|null }
 * Async: Supported - awaited before storage write
 * Return: void (return value ignored)
 */
```

### 2. CSS Variable Reference

**Issue:** Extensions should use CSS variables for theming, but the complete list of available variables isn't documented.

**Suggestion:** Create `docs/css-variables.md` with:
```css
/* Layout Variables */
--bg-primary: Background color
--bg-alt: Alternative background (cards, panels)
--bg-hover: Hover state background

/* Text Variables */
--text-primary: Main text color
--text-secondary: Muted/secondary text

/* Interactive Variables */
--border: Border color
--accent: Primary accent color (buttons, links)
--accent-hover: Accent hover state

/* Current values in light theme: */
:root { ... }

/* Current values in dark theme: */
[data-theme="dark"] { ... }
```

### 3. Widget Positioning Best Practices

**Issue:** Several extensions create floating widgets, but there's no guidance on:
- Z-index conventions
- Avoiding overlap with other extensions
- Mobile responsiveness considerations

**Suggestion:** Add to cookbook:
```javascript
// Widget z-index conventions:
// 9000-9499: Regular widgets
// 9500-9899: Modal-like overlays  
// 9900-9999: Critical notifications
// 10000+: Reserved for system modals
```

### 4. Extension ID Naming Conventions

**Issue:** While noted briefly, there's no formal guide for extension IDs.

**Suggestion:** Document that extension IDs should:
- Be kebab-case (e.g., `my-extension-name`)
- Be unique and descriptive
- Match the filename (e.g., `my-extension.json` → `my-extension`)
- Not start with `cardspoke-` (reserved for official)

### 5. Error Handling Contract

**Issue:** The automatic disabling after 3 errors is mentioned, but developers need to know:
- What counts as an "error" (thrown exception vs. returned error)
- How to reset the error count
- How to gracefully handle expected errors without triggering the counter

**Suggestion:** Add "Error Handling Best Practices" section:
```javascript
// Errors that count toward auto-disable:
// - Uncaught exceptions in hooks
// - Timeout (hooks taking > 5 seconds)

// Errors that DON'T count:
// - Caught exceptions
// - Explicit error returns
// - User-triggered errors (e.g., validation failures)

// Best practice: Always wrap risky code in try-catch
async onCardSave(ctx, card) {
  try {
    await this.riskyOperation(card);
  } catch (err) {
    ctx.logger.error('Operation failed:', err);
    // Handle gracefully - this won't count toward auto-disable
    return; // or throw for critical errors
  }
}
```

### 6. Mod-specific Data (modsData) Usage

**Issue:** While `modsData` is mentioned, best practices for using it aren't clear.

**Suggestion:** Add examples:
```javascript
// Correct: Namespace under your mod ID
card.modsData[ctx.modId] = { myData: 'value' };

// Incorrect: Using flat structure (could conflict)
card.modsData.myData = 'value'; // Don't do this!

// Reading safely:
const myData = card.modsData?.[ctx.modId] ?? {};

// Cleaning up on uninstall:
async onUninstall(ctx) {
  // Offer to clean up modsData
  const allCards = Object.values(window.store?.cards || {});
  for (const card of allCards) {
    if (card.modsData?.[ctx.modId]) {
      delete card.modsData[ctx.modId];
    }
  }
}
```

### 7. Testing Extensions

**Issue:** No guidance on how to test extensions before distribution.

**Suggestion:** Add "Testing Your Extension" section:
```markdown
## Testing Your Extension

### Manual Testing
1. Load CardSpoke with `?safemode` to disable all extensions
2. Install your extension via Upload
3. Enable it and test all features
4. Check browser console for errors

### Console Commands for Testing
- `CardSpoke_MODS.inspectMod('your-mod-id')` - View registered hooks
- `CardSpoke_MODS.devTools.getHookStats()` - Performance metrics
- `CardSpoke_MODS.devTools.getErrorLog()` - View errors

### Testing Checklist
- [ ] Extension loads without errors
- [ ] All hooks execute properly
- [ ] CSS doesn't break existing UI
- [ ] Works in both light and dark mode
- [ ] Handles edge cases (empty data, etc.)
- [ ] Cleanup works on disable/uninstall
```

### 8. Type Definitions

**Issue:** While `types/extensions.d.ts` exists, it's not referenced prominently.

**Suggestion:** Add a note in the cookbook:
```markdown
## TypeScript Support

CardSpoke provides TypeScript definitions in `types/extensions.d.ts`.
If using an IDE with TypeScript support, reference it for autocompletion:

```javascript
/// <reference path="../types/extensions.d.ts" />
```
```

### 9. Complex Extension Dependencies

**Issue:** No guidance on what to do when an extension depends on another.

**Suggestion:** Add section on extension dependencies:
```javascript
// Check if a dependency is available
onAppInit(ctx) {
  const requiredMod = CardSpoke_MODS.registry['required-mod-id'];
  if (!requiredMod?.enabled) {
    ctx.utils.showToast('This extension requires "Required Mod" to work', 'error');
    return false; // Signal initialization failure
  }
}
```

### 10. Versioning Guidelines

**Issue:** No guidance on when to bump extension version numbers.

**Suggestion:** Add versioning guidelines:
```markdown
## Extension Versioning

Follow semantic versioning (SemVer):
- **MAJOR** (1.x.x → 2.0.0): Breaking changes, new required permissions
- **MINOR** (1.0.x → 1.1.0): New features, backward compatible
- **PATCH** (1.0.0 → 1.0.1): Bug fixes, performance improvements

Example: `"version": "1.2.3"`
```

---

## Summary

The CardSpoke extension documentation is comprehensive and well-organized. The main areas for improvement are:

1. **Deeper technical details** on hooks, lifecycle, and error handling
2. **CSS variable reference** for theme-compatible extensions
3. **Testing guidelines** for extension developers
4. **Best practices** for common patterns (widgets, data storage, dependencies)

These improvements would reduce trial-and-error for new extension developers and ensure higher quality community extensions.

---

**Document Author:** Claude Code (Sonnet 4)
**Related Files:**
- `docs/extension-cookbook.md`
- `docs/api-reference.md`
- `docs/schema-reference-v0.13.md`
- `sample-extensions/README.md`
