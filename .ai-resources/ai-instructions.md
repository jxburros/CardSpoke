# AI Assistant Instructions for Card Info Base

## Project Overview

Card Info Base (CIB) is a single-file, client-side knowledge base application built with vanilla JavaScript. It uses localStorage for persistence and has no external dependencies.

**Current Version:** 0.7.0  
**Schema Version:** 4

## Key Concepts

### Single-File Architecture
- The entire application is contained in one HTML file
- No build process or bundler required
- Can be opened directly in a browser
- All assets are inline (CSS in `<style>`, JS in `<script>`)

### Data Model (Schema v4)
- **Cards**: Hierarchical notes with title, body, tags, metadata
- **Mods**: Extensible plugins with hooks into app lifecycle
- **Store**: Central data structure containing all cards and mods

### Storage
- Uses browser localStorage
- Supports multiple named "instances" (separate datasets)
- Each instance stored under key: `nested_cards_store__<instanceName>`

## When Making Changes

### DO:
1. **Maintain single-file structure** - Keep everything in the HTML file
2. **Preserve backward compatibility** - Always support Schema v3 data
3. **Update schema version** only when adding new required fields
4. **Add migration logic** when introducing new fields
5. **Use existing design tokens** for styling (CSS variables)
6. **Follow the mod hook pattern** for extensibility
7. **Test with localStorage** to ensure persistence works
8. **Keep code readable** - this is meant to be a learning resource

### DON'T:
1. **Don't add external dependencies** - keep it dependency-free
2. **Don't break existing mods** - maintain the mod API
3. **Don't remove features** without strong justification
4. **Don't split into multiple files** without user request
5. **Don't use frameworks** - stick with vanilla JS
6. **Don't assume data structure** - always validate and migrate

## Common Tasks

### Adding a New Card Field
1. Add field to `createCard()` function with default value
2. Add migration logic in `load()` to add field to existing cards
3. Update schema documentation in comments
4. Update DEVELOPER.md
5. Update schema-v4.json
6. Test with both new and legacy data

### Creating a New Mod Hook
1. Add hook to `CIB_MODS.register()` signature
2. Add hook execution in `runModHook()` or create new caller
3. Document in code comments and DEVELOPER.md
4. Create example mod using the new hook

### Updating UI
1. Use existing CSS variables (design tokens)
2. Follow the minimal/light mode patterns
3. Test in both dark and light themes
4. Test in both regular and minimal modes
5. Ensure responsive behavior

## File Locations

- Main app: `Card Info Base Version 0.7.html`
- Roadmap: `Road Map V1.md`
- Developer docs: `DEVELOPER.md`
- AI resources: `.ai-resources/`
  - `schema-v4.json` - JSON Schema definitions
  - `ai-instructions.md` - This file

## Mod Development Guide

Mods register hooks using `CIB_MODS.register(modId, definition)`.

Available hooks:
- `onAppInit(ctx)` - App start or mod enable
- `onCardRender(ctx, card)` - Before card display
- `onCardSave(ctx, card, info)` - After card save
- `onCardDelete(ctx, cardId)` - After card delete

Context provides `ctx.api` with methods:
- `getAppInfo()`, `getCard()`, `listCards()`, `listRootIds()`
- `getNavState()`, `navigate()`, `showToast()`, `markDirty()`

## Version History

- **v0.7.0 (Current)**: Schema v4, tags, meta, attributes, mod taxonomy
- **v0.6.x**: Mod system, export/import, instance management
- **v0.5.x**: Basic card hierarchy
- **v0.4.x and earlier**: Initial development

## Philosophy

Card Info Base follows these principles:

1. **Lightweight** - No bloat, fast load times
2. **Portable** - Single file, works offline
3. **Extendable** - Mod system for customization
4. **Readable** - Clean, understandable code
5. **Educational** - Designed for learning and experimentation

## Getting Help

When uncertain:
1. Check DEVELOPER.md for API documentation
2. Review Road Map V1.md for planned features
3. Examine existing code patterns
4. Consult schema-v4.json for data structures
5. Test changes in a browser before committing

## Testing Checklist

Before finalizing changes:
- [ ] Test in browser (open HTML file directly)
- [ ] Test with empty localStorage (new user)
- [ ] Test with existing v3 data (migration)
- [ ] Test with existing v4 data (no regression)
- [ ] Test in both light and dark themes
- [ ] Test in both regular and minimal modes
- [ ] Verify localStorage persistence
- [ ] Check console for errors
- [ ] Test mod system if applicable

## Future Plans

See Road Map V1.md for upcoming features. Next major versions:
- v0.8: Capacitor migration for native apps
- v0.9: Multi-dataset architecture
- v0.10: Extensions framework
- v1.0: Stable release

Remember: The goal is a simple, extensible, educational knowledge base. Keep it focused and maintainable.
