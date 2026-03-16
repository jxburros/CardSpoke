# AI Agent Implementation Directive: CardSpoke Plugin System

## [METADATA]
* **Project:** CardSpoke Plugin/Mod Loader System
* **Objective:** Execute bug fixes, architectural corrections, and feature enhancements based on static analysis.
* **Primary Target File:** `www/src/00-core-systems.js`

---

## [SYSTEM_PROMPT_INSTRUCTIONS]
**Read the following rules before modifying any code:**
1. **Target Identification:** The active plugin system code is initialized via IIFEs inside `www/src/00-core-systems.js`. 
2. **Code Duplication Protocol:** Files located in `www/src/core/*.js` are stale duplicates of the IIFEs in `00-core-systems.js`. When implementing fixes, you MUST update both the active `00-core-systems.js` and the corresponding standalone file in `www/src/core/` to maintain parity.
3. **Error Handling Protocol:** The system relies on strict `setup()` and `teardown()` fallbacks. Do NOT remove or bypass the core error handling (`try/catch` blocks) that protect the main application from crashing during plugin failure.
4. **Execution Order:** Execute `[PHASE_1]` strictly before `[PHASE_2]`.

---

## [PHASE_1] Critical Bug Fixes (Priority: HIGH)

### TASK 1.1: Activate Middleware Pipeline
* **Context:** `CardSpoke.Middleware.run()` is implemented but never called by core app operations.
* **Target Area:** Core application API/Data handlers (e.g., `createCard`, `updateCard`, `deleteCard`, `save`).
* **Action Required:** Locate core data operations and wrap them using `await CardSpoke.Middleware.run('operation.name', payload)`.
* **Success Criteria:** Plugins registering middleware for `card.save` successfully intercept the app's native save operations.

### TASK 1.2: Unify Manifest `js` Processing
* **Context:** Sample JSON manifests use `pkg.js`, but the install flow looks for `pkg.javascript`. The JS string is never executed.
* **Target Area:** `PluginManager.install()` flow.
* **Action Required:** 1. Modify parsing to read the `pkg.js` field.
  2. Implement a secure conversion of the `pkg.js` string into a callable setup function (utilize `new Function('ctx', pkg.js)` to mirror the existing Create tab behavior).
* **Success Criteria:** Sample JSON files (e.g., `kanban-board.json`) install and execute their embedded JavaScript automatically.

### TASK 1.3: Resolve Validator Conflicts
* **Context:** `PluginValidator` explicitly blocks `new Function()`, but the Plugin Manager requires it to instantiate stringified JavaScript from manifests.
* **Target Area:** `PluginValidator` ruleset.
* **Action Required:** Adjust the regex/validation rules to allow the specific instantiation pattern used by the installer, or sandbox the evaluation process so string-based scripts pass validation safely.
* **Success Criteria:** Valid plugin JSON files containing JavaScript pass validation without throwing errors.

### TASK 1.4: Enforce Permissions on Enable Flow
* **Context:** `PluginManager._checkPermissions()` auto-grants permissions (returning `true`) when the dialog fallback triggers, bypassing the `PermissionsManager`.
* **Target Area:** `PluginManager.enable()` -> `_checkPermissions()`.
* **Action Required:** Refactor to await actual user consent via `PermissionsManager.grantPermissions()`. Do not default to `true`.
* **Success Criteria:** High-permission plugins trigger the dialog and fail to enable if the user clicks "Deny".

### TASK 1.5: Implement Global Event Bus
* **Context:** Current `ctx.api.events` is strictly plugin-scoped.
* **Target Area:** Event Bus Initialization inside the Plugin API definition.
* **Action Required:** Refactor the event bus to use a central `CardSpoke`-level `Map`/`Set` for handlers, while preserving the per-plugin `ctx` interface. Add support for cross-plugin event emission.
* **Success Criteria:** Plugin A successfully emits an event that Plugin B listens to and processes.

---

## [PHASE_2] Architectural Corrections (Priority: MEDIUM)

### TASK 2.1: Persist Setup/Teardown Functions
* **Context:** JS functions are lost during `window.store.plugins` JSON serialization, breaking plugins on page reload.
* **Target Area:** `PluginManager.register()` and `syncFromStore()`.
* **Action Required:** Store the raw JS string in the plugin manifest. On `syncFromStore()`, dynamically reconstruct the `setup` and `teardown` functions from the saved string.
* **Success Criteria:** JS-based plugins survive a browser refresh and continue functioning.

### TASK 2.2: Secure `cloneCard` Fallback
* **Context:** If `cloneCard` fails, `getCard()` returns a mutable reference to `window.store.cards`.
* **Target Area:** `createDataApi()` -> `getCard()`.
* **Action Required:** Implement a strict deep copy fallback (e.g., `structuredClone` or `JSON.parse(JSON.stringify())`).
* **Success Criteria:** Plugins cannot mutate `window.store.cards` directly in memory.

### TASK 2.3: Fix Storage API Formatting
* **Context:** `storage.set()` saves as a JSON string, but `storage.get()` returns the raw string.
* **Target Area:** `createStorageApi()` / `StorageDriverRegistry`.
* **Action Required:** Implement automatic `JSON.parse()` on retrieval for the `localStorage` fallback.
* **Success Criteria:** `storage.get(key)` returns the exact JavaScript object type originally passed to `storage.set()`.

### TASK 2.4: Enable Plugin Updating
* **Context:** Re-installing an existing plugin creates duplicates (e.g., `id-1`, `id-2`).
* **Target Area:** `PluginManager.install()` and `PluginManager.register()`.
* **Action Required:** Detect existing plugin IDs. If found, run `disable()`, run `unregister()`, and overwrite the existing entry with the new version payload.
* **Success Criteria:** Uploading a newer version of a plugin cleanly overwrites the old version.

### TASK 2.5: Expand Component Registry
* **Context:** UI rendering currently only queries the Component Registry for the `'Card'` component.
* **Target Area:** Main UI rendering functions (DOM injection).
* **Action Required:** Add registry lookups for other core UI components (e.g., `'Sidebar'`, `'Header'`, `'SearchBar'`).
* **Success Criteria:** Plugins can successfully override the Sidebar component via the registry.

### TASK 2.6: Wire `config` and `overrides`
* **Context:** `config` and `overrides` manifest fields are unused.
* **Target Area:** `PluginManager.enable()` and `setup()` caller.
* **Action Required:** 1. Pass the parsed `config` object into the plugin's `ctx`.
  2. Parse the `overrides` object to apply basic app alterations (e.g., `appName`).
* **Success Criteria:** Plugins can programmatically read their own `config` object at runtime.

### TASK 2.7: Enforce `network` and `filesystem` Permissions
* **Context:** These permissions exist in the schema but are unmonitored.
* **Target Area:** Plugin `ctx` sandbox / API definitions.
* **Action Required:** Wrap native `fetch` and `XMLHttpRequest` inside the `ctx` with explicit permission checks.
* **Success Criteria:** Plugins without `network` permission throw an error when attempting HTTP requests.

---

## [PHASE_3] Quality of Life Enhancements (Priority: LOW / FUTURE)

**Execute only after Phase 1 and Phase 2 pass all success criteria.**

1. **Auto-Generated Settings UI:** Dynamically build a settings panel using the `config` schema in the Plugin Manager.
2. **Conflict Warning System:** Emit console warnings or UI alerts if two plugins register the same component or middleware at the exact same priority level.
3. **Dependency Checking:** Parse the `dependencies` array in the manifest during `install()`; halt installation if prerequisites are missing.
4. **Sandbox Hardening:** Evaluate moving plugin execution to an `iframe` or Web Worker to isolate them from `window` globals.
