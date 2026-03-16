# Implementation Plan: CardSpoke Global Namespace Mitigation

## Objective
Refactor the CardSpoke codebase to eliminate global namespace pollution. Transition from lexically concatenated vanilla JavaScript files to ES Modules (ESM), bundle the core application into an Immediately Invoked Function Expression (IIFE) using Vite, and expose a strictly controlled, read-only API for the plugin system.

## Context & Constraints
* **Architecture Philosophy:** CardSpoke is a zero-dependency, framework-agnostic vanilla JS application. **DO NOT** introduce external dependencies (like React, Vue, or Webpack). 
* **UI Rendering:** Continue using the custom hyperscript `h(tag, props, ...children)` function.
* **Offline First:** The final build must be capable of running offline via the `file://` protocol. This requires bundling everything into a single `www/app.js` file to avoid browser CORS restrictions on local ES modules.
* **Testing:** All existing tests in the `tests/` directory must pass after the refactor.

---

## Phase 1: Transition to ES Modules (ESM)
Currently, files in `www/src/` (e.g., `00-core-systems.js`, `01-metadata-and-utilities.js`) attach state and classes to the global `window` object. 

- [ ] **Rename Source Files:** Remove the numbered prefixes from files in `www/src/` to reflect their domains (e.g., `core.js`, `storage.js`, `rendering.js`).
- [ ] **Implement Exports:** Remove global assignments. Export classes, functions, and state objects explicitly.
  * *Example Before:* `window.store = new StorageDriver();`
  * *Example After:* `export const store = new StorageDriver();`
- [ ] **Implement Imports:** Update all files to import their required dependencies from sibling modules.
- [ ] **Create Entry Point:** Create `www/src/main.js` to serve as the application root. It should import the core state, initialize the storage drivers, and mount the UI.

## Phase 2: Vite Build Configuration (The IIFE Closure)
We will use Vite to bundle the ESM code into a single, enclosed script.

- [ ] **Update `vite.config.js`:** Modify the build configuration to output an IIFE. This ensures all previously global variables (like `store`, `navState`) are trapped inside a local closure.
  ```javascript
  import { defineConfig } from 'vite';

  export default defineConfig({
    build: {
      outDir: 'www',
      emptyOutDir: false, // Don't delete index.html or styles.css
      rollupOptions: {
        input: 'www/src/main.js',
        output: {
          format: 'iife',
          name: 'CardSpokeCore', // The isolated namespace
          entryFileNames: 'app.js',
        }
      }
    }
  });
  ```
- [ ] **Update HTML:** Verify `www/index.html` simply loads `<script src="app.js"></script>` without `type="module"`, ensuring `file://` compatibility.

## Phase 3: Secure the Plugin Environment
Since plugins loaded via `new Function()` can no longer access `window.store` or `window.navState`, the Plugin API must explicitly inject capabilities.

- [ ] **Create a Public Namespace:** In `main.js`, expose *only* the registration mechanism to the window. Freeze the object to prevent tampering.
  ```javascript
  import { PluginAPI } from './plugin-api.js';

  window.CardSpoke = Object.freeze({
      registerPlugin: PluginAPI.register,
      requestPermissions: PluginAPI.request
  });
  ```
- [ ] **Refactor Plugin Loader:** Update `www/src/core/plugin-validator.js` (or the module handling plugin execution). When evaluating plugin code via `new Function()`, inject the specific context (UI functions, data access) as function arguments rather than relying on the plugin to find them globally.
  ```javascript
  // Provide specific, safe references to the plugin
  const executePlugin = new Function('api', 'context', pluginCode);
  executePlugin(grantedAPI, executionContext);
  ```
- [ ] **Update Sample Plugins:** Ensure the JSON files in `sample-plugins/` (like `kanban-board.json` or `pomodoro-desk.json`) are updated to interact with the new `CardSpoke` global namespace and injected API, rather than attempting to access raw global state.

## Phase 4: Verification & Testing
- [ ] **Run Bundler:** Execute `npm run build` (or the equivalent Vite build command) to generate the new `www/app.js`.
- [ ] **Run Test Suite:** Execute the test suite (e.g., `tests/undo-redo.test.js`, `tests/ui-state.test.js`). 
  * *Fix Action:* If tests fail because they try to mock global variables that no longer exist, update the test setup scripts to import the modules directly from `www/src/`.
- [ ] **Manual QA:** Open `www/index.html` directly in the browser using the `file://` protocol. Verify that:
  1. The app renders correctly.
  2. Data can be saved and retrieved from LocalStorage.
  3. Opening the developer console and typing `window.store` returns `undefined`.
