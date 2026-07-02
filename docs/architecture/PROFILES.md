# Runtime Profiles & Feature Flags

## Purpose

Profiles let the same CardSpoke codebase run at different levels of UI
complexity — the full app today, a lighter shell, and the future OS-native
suite — by resolving a profile name to a feature-flag set that shells
consult instead of hardcoding what to show.

Module: `www/src/core/profiles.js`. Shell wiring: `www/src/rendering.js`
(profile init + menu gating).

## Profiles

### `full` (default)

The current complete CardSpoke app: plugin manager, developer tools, full
menu, advanced features, full import/export, current branding.

### `lite`

Simplified CardSpoke. Keeps cards, search, tags, links, bookmarks, recent
cards, basic import/export, theme/accessibility, local-first storage.
Hides the plugin manager, developer console, data hub, and heavy debug UI.

### `os`

Future OS-native shell (stub today). Enables app modes over the shared
object database; hides plugin/developer tooling. Selecting it must never
break the app.

## Data Shapes

```js
// Baseline flags (the `full` experience)
FEATURE_FLAGS = {
  pluginManager: true,
  developerConsole: true,
  advancedSearch: true,
  dataHub: true,
  typedCards: true,
  appModes: false,
  actionRegistry: true,
  conversionHelpers: true
};

// Per-profile overrides
PROFILE_FEATURES = {
  full: { pluginManager: true,  developerConsole: true,  appModes: false, ... },
  lite: { pluginManager: false, developerConsole: false, appModes: false, ... },
  os:   { pluginManager: false, developerConsole: false, appModes: true,  ... }
};
```

## APIs

```js
resolveProfile(name)        // invalid/missing -> "full"
getFeatureFlags(profile)    // defaults merged with profile overrides
setActiveProfile(profile)   // -> the profile actually activated
getActiveProfile()
isFeatureEnabled('pluginManager')  // under the active profile
detectProfile(env?)         // ?profile= URL > window.CardSpokeProfile > fallback
initProfile(env?)           // detect + activate
```

## Selecting a Profile

Priority order, resolved at startup by `initProfile()` in `rendering.js`:

1. URL override: `?profile=lite` or `?profile=os`
2. Runtime setting: `window.CardSpokeProfile = "lite";` (set before the
   app bundle loads)
3. Default: `full`

## Examples

```js
// A shell deciding whether to show a menu entry:
if (isFeatureEnabled('pluginManager')) showPluginManagerEntry();

// Testing lite behavior locally:
//   http://localhost:3000/?profile=lite
```

The full shell currently gates these menu entries by flag: Plugin Manager
(`pluginManager`), Developer Console + developer section
(`developerConsole`), Advanced Search (`advancedSearch`), Data Hub
(`dataHub`).

## Migration Expectations

Profiles are a runtime concern only — no stored data changes with the
profile, and switching profiles never migrates or hides data. A dataset
created under `lite` opens identically under `full`.

## Backward Compatibility Rules

1. Missing or invalid profile values fall back to `full`; the app never
   fails to start over a bad profile.
2. Unknown feature names return `false` from `isFeatureEnabled`.
3. The `full` profile must always behave exactly like the app before
   profiles existed.
