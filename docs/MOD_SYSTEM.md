# CardSpoke Mod System

This document describes the JSON-based mod loading system that powers CardSpoke's extensibility. Mods can range from simple visual themes to full app-layer transformations.

**Current Version:** 0.16.0 | **Schema Version:** 4

## Overview

The mod system replaces the previous extension framework with a streamlined three-layer architecture. Every mod is a self-contained JSON package that declares its capabilities through a `manifest.layer` field. The runtime validates, risk-assesses, and sandboxes mods according to their layer.

## Mod Package Format

```json
{
  "id": "my-mod",
  "manifest": {
    "name": "My Mod",
    "version": "1.0.0",
    "author": "Author Name",
    "description": "What this mod does",
    "layer": "theme | feature | app",
    "compatibility": ">=0.16.0"
  },
  "config": {},
  "css": "",
  "js": "",
  "overrides": {},
  "enabled": false
}
```

### Required Fields
- **id**: Lowercase alphanumeric with hyphens (`/^[a-z0-9-]+$/`).
- **manifest.name**: Human-readable display name.
- **manifest.version**: Semver string (`X.Y.Z`).
- **manifest.author**: Creator name.
- **manifest.layer**: One of `theme`, `feature`, or `app`.

### Optional Fields
- **manifest.description**: Short description of the mod.
- **manifest.compatibility**: Semver range for app version compatibility.
- **config**: Object of user-configurable settings (arbitrary key/value pairs).
- **css**: CSS string injected into the page when the mod is enabled.
- **js**: JavaScript string executed when the mod is enabled (not allowed for `theme` layer).
- **overrides**: Object of app-level overrides (only meaningful for `app` layer).

## Three-Layer Architecture

### 1. Theme Layer
- **Capabilities**: CSS only.
- **Restrictions**: No JavaScript allowed. No overrides.
- **Risk Level**: Low (safe).
- **Use Cases**: Color schemes, typography changes, layout tweaks, dark/light variants.

### 2. Feature Layer
- **Capabilities**: CSS and JavaScript.
- **Restrictions**: No overrides.
- **Risk Level**: Medium.
- **Use Cases**: New UI panels, keyboard shortcuts, card enhancements, import/export tools, integrations.

### 3. App Layer
- **Capabilities**: CSS, JavaScript, and overrides.
- **Restrictions**: None (highest privilege).
- **Risk Level**: High.
- **Use Cases**: Rename the app, hide/add menu items, add custom pages, disable built-in features, fundamentally transform the app experience.

## Override System (App Layer Only)

App-layer mods can declare overrides that modify core app behavior:

```json
{
  "overrides": {
    "appName": "Custom App Name",
    "hideMenuItems": ["menuTrashBin", "menuBookmarks"],
    "customMenuItems": [
      { "id": "myItem", "label": "My Feature", "section": "actions" }
    ],
    "customPages": [
      { "id": "myPage", "title": "My Page", "render": "renderMyPage" }
    ],
    "disableFeatures": ["bookmarks", "recentCards"]
  }
}
```

### Available Overrides
- **appName**: Replace the brand/title displayed in the header.
- **hideMenuItems**: Array of menu item element IDs to hide.
- **customMenuItems**: Array of menu items to inject, each with `id`, `label`, and optional `section`.
- **customPages**: Array of custom pages with render function names.
- **disableFeatures**: Array of built-in feature names to disable.

## Risk Assessment

The system automatically assesses risk based on layer and content:

| Layer | Base Risk | JS with Network | JS with DOM | With Overrides |
|-------|-----------|-----------------|-------------|----------------|
| theme | LOW | N/A | N/A | N/A |
| feature | MEDIUM | HIGH | MEDIUM | N/A |
| app | HIGH | HIGH | HIGH | HIGH |

Risk indicators checked in JavaScript:
- Network access: `fetch(`, `XMLHttpRequest`, `WebSocket`
- DOM manipulation: `document.write`, `innerHTML`, `eval(`
- Storage access: `localStorage`, `indexedDB`

## Lifecycle Hooks

Mods register hooks via `CardSpoke_MODS.register()`. The runtime dispatches hooks to enabled mods.

| Hook | When it fires | Common uses |
|------|---------------|-------------|
| `onLoad(ctx)` | On enable or after sync at startup | Allocate resources, register listeners, seed state. |
| `onEnable(ctx)` | After a mod is enabled | Re-attach DOM, rebind hotkeys. |
| `onDisable(ctx)` | Before disabling a mod | Tear down DOM/listeners, flush timers. |
| `onUninstall(ctx)` | Before removal from registry | Purge storage, remove injected styles. |
| `onCardSave(ctx, card, saveInfo)` | After create/update/duplicate | Derive fields, enforce validation. |
| `onCardDelete(ctx, card)` | Before a card is removed | Guard deletes, cascade clean-up. |
| `onCardRender(ctx, card, element)` | After a card's DOM renders | Inject UI, annotate content. |
| `onThemeChange(ctx, theme)` | When the app theme toggles | Sync theme variables. |
| `onTypographyChange(ctx, preset)` | When typography preset changes | Recalculate sizes/spacing. |
| `onHighContrastChange(ctx, enabled)` | When high-contrast flips | Adjust palette for accessibility. |
| `onNavigate(ctx, navState)` | When navigation state changes | Mirror router state, lazy-load. |
| `onSearch(ctx, query, results)` | After search completes | Rank boosters, filter results. |
| `onExport(ctx, data)` | Before data export | Append metadata, transform payloads. |
| `onImport(ctx, info)` | After data import | Normalize incoming data. |

### Hook Context Object
Each hook receives a context with:
- `modId`: The current mod's ID.
- `appVersion` / `schemaVersion`: App release and schema numbers.
- `api`: Store API for card CRUD, navigation, UI feedback.
- `utils`: Reference to `CardSpoke.utils`.
- `logger`: Mod-scoped logger (`log`, `info`, `warn`, `error`).

## Registration Example

```javascript
CardSpoke_MODS.register('my-feature', {
  onLoad(ctx) {
    ctx.logger.info('My feature loaded');
  },
  onCardRender(ctx, card, element) {
    const badge = document.createElement('span');
    badge.textContent = card.tags.length + ' tags';
    element.appendChild(badge);
  },
  onDisable(ctx) {
    ctx.logger.info('My feature disabled');
  }
});
```

## Mod Manager UI

The Mod Manager is accessible from the main menu and has three tabs:

1. **Installed**: Lists all installed mods with enable/disable toggles, risk badges, and uninstall buttons.
2. **Install**: Upload a mod JSON file or load from URL.
3. **Create**: Build a mod directly in the app by providing metadata, JavaScript, and CSS.

## Installation Methods

### File Upload
Upload a `.json` file through the Upload modal (Mods tab) or the Mod Manager's Install tab.

### Manual Creation
Use the Create tab in the Mod Manager or the Upload modal's Mods tab to enter mod metadata, JavaScript code, and CSS directly.

### Programmatic
```javascript
CardSpoke_MODS.install(modPackage);
```

## Safe Mode

Launch with `?safemode` in the URL to disable all mods. This is useful for troubleshooting when a mod causes issues. In safe mode, the app displays a "Mods Disabled" banner and no mod code executes.

## Legacy Migration

Mods using the old `meta.type` format (Theme, Patch, Plugin, Mod, Kit, Expansion) are automatically migrated to the new `manifest.layer` format on load:
- `Theme` → `theme`
- `Patch`, `Plugin` → `feature`
- `Mod`, `Kit`, `Expansion` → `app`

## Validation Rules

`validateModPackage()` enforces:
1. `id` must be a non-empty string matching `/^[a-z0-9-]+$/`.
2. `manifest` must exist with `name`, `version`, `author`, and `layer`.
3. `manifest.layer` must be one of `theme`, `feature`, or `app`.
4. Theme-layer mods must have empty or no `js` field.
5. `overrides` are only meaningful for `app`-layer mods.

## Event Bus

Mods can communicate via `CardSpoke_MODS.events`:
- `on(event, callback)`: Subscribe to an event.
- `off(event, callback)`: Unsubscribe.
- `emit(event, data)`: Broadcast an event.
- `clear(event?)`: Remove listeners.

## Developer Tools

`CardSpoke_MODS.devTools` provides:
- `inspectMod(id)` / `listAllMods()`: View hooks, metadata, and state.
- `getHookStats(modId?)`: Timing and failure counters.
- `getErrorLog()` / `clearErrorLog()`: Global mod error buffer.
- `testHook(modId, hookName, ...args)`: Invoke a hook manually.
- `getEventListeners()`: Per-event subscription counts.

## LocalStorage Keys
- `cardspoke_activeThemeMod`: ID of the active theme mod.
- Mod data is persisted in the `mods` field of the IndexedDB store.
