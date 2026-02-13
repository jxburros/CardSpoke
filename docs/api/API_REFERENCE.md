# CardSpoke API Reference

This reference documents the surfaces mod developers can rely on: the `CardSpoke.utils` helper bundle and the `CardSpoke_MODS` mod runtime (also exposed as `window.CardSpoke.mods`). It consolidates the runtime contracts that ship in `www/app.js`.

**Current Version:** 0.16.0 | **Schema Version:** 4 | **Release Date:** 2025-11-30

## Global objects
- **`window.CardSpoke.utils`**: async helpers for card CRUD, tagging, search, accessibility, dataset metadata, and toast UI helpers.
- **`window.CardSpoke_MODS` / `window.CardSpoke.mods`**: the mod system that registers hooks, dispatches lifecycle events, offers an event bus, and exposes developer tooling.

## Mod runtime (`CardSpoke_MODS`)

### Supported hook names
Implemented hooks are enforced by runtime validation. Unknown hook names log warnings but still register. Hooks may be async.

| Hook | When it fires | Common uses |
| --- | --- | --- |
| `onLoad(ctx)` | First enable or after sync on load | Allocate resources, register listeners, seed state. |
| `onEnable(ctx)` | After a mod is enabled | Re-attach DOM, rebind hotkeys, reopen sockets. |
| `onDisable(ctx)` | Before disabling a mod | Tear down DOM/listeners, flush timers. |
| `onUninstall(ctx)` | Before removal from registry | Purge storage, remove injected styles. |
| `onCardSave(ctx, card, saveInfo)` | After create/update/duplicate | Derive fields, enforce validation, emit events. |
| `onCardDelete(ctx, card)` | Before a card is fully removed | Guard deletes, cascade clean-up. |
| `onCardRender(ctx, card, element)` | After a card's DOM renders | Inject UI, annotate content, attach buttons. |
| `onThemeChange(ctx, theme)` | When the app theme toggles | Sync theme variables, re-compute contrast. |
| `onTypographyChange(ctx, preset)` | When typography preset changes | Recalculate sizes/spacing your mod introduced. |
| `onHighContrastChange(ctx, enabled)` | When high-contrast mode flips | Adjust palette for accessibility. |
| `onNavigate(ctx, navState)` | When navigation state changes | Mirror router state, lazy-load resources. |
| `onSearch(ctx, query, results)` | After search completes | Rank boosters, log queries, filter results. |
| `onExport(ctx, data)` | Before data export | Append metadata, transform payloads. |
| `onImport(ctx, info)` | After data import | Normalize incoming data, map legacy fields. |
| `onRender(ctx)` | After app UI re-renders | Update custom UI components, refresh visualizations. |
| `onPageChange(ctx, page)` | When the active page/view changes | Load page-specific data, initialize page components. |
| `onAppInit(ctx)` | Once at app initialization after boot | Initialize global state, register app-wide services. |

### Registration and lifecycle
- **`register(modId, definition)`**: Validates hook names, stores metadata, and resets error counters on success. Called once inside your IIFE.
- **`enable(modId)` / `disable(modId)`**: Toggle mods persisted in the store; enabling reapplies CSS, runs `onEnable`, then `onLoad`. Disabling calls `onDisable` before removing styles.
- **`unregister(modId)`**: Runs `onUninstall`, clears registry entry, removes styles, and evicts persisted mod state.
- **`syncFromStore()`**: Loads enabled mods from the persisted store, applies CSS, and prunes stale registry entries.
- **`reload(modId)`**: Executes `onDisable`, clears styles/hooks/error counts, re-runs registration from persisted code+CSS, and then replays `onEnable`/`onLoad`.
- **Hook dispatch**: `runHook(hookName, ...args)` fans out to enabled mods, honoring one-time semantics for `onLoad`. Use `runHookForMod` to target a single mod.

### Context passed to hooks
The runtime builds a context object per invocation:
- `modId`: current mod id.
- `appVersion` / `schemaVersion`: release + schema numbers (currently 0.16.0 / 4).
- `api`: see "Store API" below.
- `utils`: reference to `CardSpoke.utils`.
- `logger`: mod-scoped logger with `log/info/warn/error` prefixes.

### Store API
`createStoreAPI(modId)` exposes safe, synchronous helpers for hooks:
- **Read & navigation**: `getAppInfo()`, `getCard(id)`, `listCards()`, `listRootIds()`, `getNavState()`, `navigate(page, opts)`, `goBack()`.
- **UI feedback**: `showToast(message, type?)`, `markDirty()`.
- **Card CRUD**: `createCard({ title, body, parentId?, tags? })`, `updateCard(id, updates)`, `deleteCard(id)`.
- **Tagging**: `getTags(cardId)`, `addTag(cardId, tag)`, `removeTag(cardId, tag)`, `setTags(cardId, tags)`, `getAllTags()`.
- **Dataset metadata**: `getDatasetMeta()` returns counts, schema/app versions, and dataset name.
- **Logging**: `logger` plus `log/warn/error/info` wrappers.

### Event bus
Use `CardSpoke_MODS.events` to coordinate between mods:
- `on(event, cb)`: subscribe.
- `off(event, cb)`: unsubscribe.
- `emit(event, data)`: broadcast.
- `clear(event?)`: remove listeners for one or all events.

### Developer tools
`CardSpoke_MODS.devTools` exposes debugging aids:
- `inspectMod(id)` and `listAllMods()` for visibility into hooks, metadata, load state, and enablement.
- `getHookStats(modId?)`: timing and failure counters per hook call.
- `getErrorLog()` / `clearErrorLog()`: global mod error buffer.
- `testHook(modId, hookName, ...args)`: invoke a hook manually.
- `getEventListeners()`: per-event subscription counts.

## Utilities API (`CardSpoke.utils`)

### Card & tag helpers
- `createCard({ title, body?, parentId?, tags? })`: creates, tags, saves, and re-renders UI.
- `updateCard(cardId, changes)`: updates fields and optionally tags.
- `getCard(cardId)`: cloned card or `null`.
- `searchCards(query)`: case-insensitive match against title/body/tags.
- Tag helpers: `getTags`, `addTag`, `removeTag`, `setTags`, `getAllTags`.

### Dataset metadata
`getDatasetMeta()` returns dataset name, counts (cards, roots, bookmarks, recent, mods), and schema/app versions.

### UI feedback
`showToast(message, type = 'info', duration = 3000)` surfaces notifications.

### Accessibility & appearance
- `getAccessibilitySettings()` returns theme, typography preset, high-contrast flag, and reduced-motion preference.
- Theme controls: `setTheme(theme)`, `getTheme()`, `onThemeChange(cb)`, `getThemeVariables()` (categorised CSS variables to theme).
- Typography controls: `setTypography(preset)`, `getTypography()`.
- High contrast: `setHighContrast(enabled)`, `isHighContrast()`.
- Motion: `prefersReducedMotion()`.

### Notes
All helpers are async (Promise-returning) unless noted. Errors are caught and logged to the console; most functions return fallback values instead of throwing.
