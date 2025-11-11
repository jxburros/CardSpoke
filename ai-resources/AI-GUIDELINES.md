# AI Assistant Guidelines for Card Info Base

## Project Context

Card Info Base (CIB) is a lightweight, extensible knowledge base framework with hierarchical note-taking capabilities. It's designed to be portable, local-first, and mod-ready.

## Current Status (v0.7.4.0)

- **Schema Version:** 4
- **Architecture:** Single-file HTML/JS/CSS application
- **Storage:** localStorage (browser-based)
- **Key Features:** Hierarchical cards, tagging, metadata, mod system, multi-instance support

## When Assisting with CIB

### Understanding the Codebase

1. **File Structure:** The application is currently a monolithic HTML file containing all code
2. **Key Sections:**
   - Design tokens (CSS variables)
   - State management (`store`, `navState`)
   - Core CRUD functions
   - UI rendering
   - Mod system (`CIB_MODS`)
   - Import/Export functionality

3. **Entry Point:** `initApp()` function initializes the application

### Code Modification Guidelines

#### When Adding Features

1. **Check schema version** - Does this require a schema change?
2. **Consider migration** - Will existing data need updating?
3. **Update SCHEMA_VERSION** if data structure changes
4. **Write migration function** for backward compatibility
5. **Add JSDoc comments** for new functions
6. **Test thoroughly** - create, edit, delete, reload scenarios

#### When Fixing Bugs

1. **Preserve backward compatibility** unless explicitly breaking
2. **Don't remove fields** from the schema without migration
3. **Test with existing data** to ensure no data loss
4. **Check mod hooks** - are they still firing correctly?

#### When Refactoring

1. **Maintain API surface** - don't break mod compatibility
2. **Keep localStorage format** consistent or migrate
3. **Test all user flows** after refactoring
4. **Update documentation** in DEVELOPER.md

### Schema v4 Important Notes

#### Required Fields in Cards

```javascript
{
  id, title, body, parentId, children,
  tags: [],           // NEW in v4 - must be array
  meta: {},           // NEW in v4 - must be object
  attributes: {},     // NEW in v4 - must be object
  createdAt, updatedAt, modsData
}
```

#### Migration Pattern

Always check and add missing fields:
```javascript
if (!card.tags) card.tags = [];
if (!card.meta) card.meta = {};
if (!card.attributes) card.attributes = {};
```

### Common Patterns

#### Creating Cards

```javascript
function createCard(title, body, parentId) {
  // Generate unique ID
  const id = 'card-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
  
  // Initialize with ALL required fields including v4
  const card = {
    id, title: title || '(Untitled)', body: body || '',
    parentId: parentId || null, children: [],
    tags: [], meta: {}, attributes: {},  // v4 fields
    createdAt: Date.now(), updatedAt: Date.now(),
    modsData: {}
  };
  
  // Add to store
  store.cards[id] = card;
  
  // Update parent/root
  if (parentId) {
    if (store.cards[parentId]) store.cards[parentId].children.push(id);
  } else {
    store.rootOrder.push(id);
  }
  
  // Trigger hooks
  runModHook('onCardSave', cloneCard(card), { isNew: true, source: 'createCard' });
  
  return card;
}
```

#### Updating Cards

```javascript
function updateCard(id, updates) {
  const card = store.cards[id];
  if (!card) return;
  
  // Merge updates
  Object.assign(card, updates, { updatedAt: Date.now() });
  
  // Handle parent changes
  // ... parent/root reordering logic ...
  
  // Save and trigger hooks
  save();
  runModHook('onCardSave', cloneCard(card), { isNew: false, source: 'updateCard' });
}
```

### Mod System Considerations

#### Hook Timing

- `onAppInit`: After data load, before first render
- `onCardSave`: After card is saved to store
- `onCardDelete`: After card is removed from store
- `onRender`: After UI is re-rendered

#### Mod Safety

- Always clone data passed to mods (`cloneCard()`)
- Mods should not have direct `store` access
- Provide safe API through context
- Catch and log mod errors without crashing app

### Testing Checklist

When making changes, test:

- [ ] Card creation with various inputs
- [ ] Card editing and updates
- [ ] Card deletion (including with children)
- [ ] Parent-child relationships
- [ ] Search functionality
- [ ] Import/Export (JSON, TXT)
- [ ] Theme toggle (dark/light)
- [ ] Instance switching
- [ ] Browser reload (data persistence)
- [ ] Console for errors
- [ ] Existing data migration

### Documentation Requirements

When adding features:

1. **Update DEVELOPER.md** with new APIs
2. **Add JSDoc comments** in code
3. **Update this file** if guidelines change
4. **Update Road Map** if implementing planned features
5. **Update version notes** in HTML header

### Versioning Guidelines

- **Patch (0.7.x.Y):** Bug fixes, minor improvements
- **Minor (0.X.y.z):** New features, backward compatible
- **Major (X.y.z.w):** Breaking changes, schema updates (rare)

**Schema Version:** Increment when data structure changes require migration

### Common Pitfalls to Avoid

1. ❌ Don't modify `store` without calling `save()`
2. ❌ Don't pass live objects to mods (always clone)
3. ❌ Don't forget to update `updatedAt` timestamps
4. ❌ Don't remove schema fields without migration
5. ❌ Don't break mod hooks (check CIB_MODS calls)
6. ❌ Don't skip testing with existing data
7. ❌ Don't forget parent/root cleanup on deletion
8. ❌ Don't hardcode instance keys (use `instanceKey` variable)

### Road Map Awareness

Current focus (v0.7): Foundation Overhaul
- ✅ Schema v4
- ✅ Ultra-Light UI  
- ✅ Developer documentation
- 🔄 AI resources (in progress)
- 📅 Mod taxonomy

Next version (v0.8): Capacitor migration for cross-platform

See [Road Map V1.md](../Road%20Map%20V1.md) for full roadmap.

### File Organization (Future)

Current: Monolithic HTML  
Future (v0.8+): Consider modular structure:
```
src/
  core/        # Core functions
  ui/          # UI components
  mods/        # Mod system
  storage/     # Storage abstraction
```

### Performance Considerations

- **Search:** Linear scan of all cards (O(n))
- **Render:** Full UI rebuild on state change
- **Storage:** JSON serialization on every save

For large datasets (1000+ cards), consider:
- Indexed search
- Virtual rendering
- Debounced saves

### Security Notes

- **XSS Risk:** Mod system executes arbitrary code
- **Safe Mode:** Disable all mods for troubleshooting
- **User Trust:** Only install mods from trusted sources
- **Data Loss:** Always backup before testing major changes

### Helpful Commands for Testing

```javascript
// In browser console:

// Inspect current state
console.table(Object.values(store.cards).map(c => ({ id: c.id, title: c.title, parent: c.parentId })));

// Check schema version
console.log('Schema:', SCHEMA_VERSION, 'App:', APP_VERSION);

// List all cards
Object.values(store.cards).forEach(c => console.log(c.title));

// Test search
console.log(searchCards('test'));

// Check mod system
console.log(window.CIB_MODS._registry);

// Force migration
migrateToSchemaV4();
```

---

## Example Prompts for AI Assistance

### Good Prompts ✅

- "Add a `priority` field to card metadata and create a UI to edit it"
- "Implement a tag filtering feature in the card list"
- "Create a mod that adds a word count to each card"
- "Fix the bug where deleting a parent doesn't clean up children properly"
- "Add JSDoc comments to all navigation functions"

### Unclear Prompts ❌

- "Make it better" (too vague)
- "Add blockchain" (out of scope for local-first design)
- "Rewrite everything in React" (violates single-file architecture)
- "Remove the modsData field" (breaks backward compatibility)

---

**Last Updated:** November 11, 2025  
**For Questions:** See DEVELOPER.md or inline code comments
