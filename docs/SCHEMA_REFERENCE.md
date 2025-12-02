# Schema Reference

This file summarizes the persisted data model and schema versioning rules used by CardSpoke.

## Versioning
- **Current schema version:** 4.
- Runtime constant `SCHEMA_VERSION` is exported from `www/modules/core/state.js` and surfaced to mods via both `CardSpoke.utils.getDatasetMeta()` and the hook context.
- Bump the schema version on any backward-incompatible change and ship an accompanying migration plan.

## Core domains
- **Cards:** `cards` map keyed by id, with `rootOrder` tracking top-level ordering and `children` arrays on each card for hierarchy.
- **Extensions:** `mods` registry stores extension metadata, `enabled` flag, and bundled JS/CSS for replay at startup.
- **User preferences:** `viewMode`, `activeTheme`, typography preset (`cardspoke_typography`), high contrast (`cardspoke_highcontrast`), and rich text flags (`cardspoke_richtext`).
- **Navigation & history:** `navState` plus `recentCards` and `bookmarks` collections for quick recall.
- **Trash/undo:** Undo/redo stacks and `trashBin` entries keep recovery history.

## Default store shape
A new dataset starts with:
```
rootOrder: []
cards: {}
mods: {}
bookmarks: []
recentCards: []
viewMode: 'normal'
activeTheme: 'light'
richTextEnabled: false
```

## Storage layers
- **LocalStorage**: lightweight config (preferences, dev mode, active dataset id, typography/high-contrast flags).
- **IndexedDB**: structured datasets via the `datasets` object store.
- **Optional cloud/file drivers**: Google Drive, OneDrive, WebDAV (see Storage Driver Interface) used only when explicitly configured by the user.

## Migration expectations
- Keep migrations idempotent and provide fallbacks if a migration fails (e.g., block extensions, fall back to read-only view).
- Document every migration with from→to versions, change summary, steps, fallback behavior, and extension impact.
