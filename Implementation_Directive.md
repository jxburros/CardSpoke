# Implementation Plan: CardSpoke Global Namespace Mitigation

## Objective
Refactor the CardSpoke codebase to eliminate global namespace pollution. Transition from lexically concatenated vanilla JavaScript files to ES Modules (ESM), bundle the core application into an Immediately Invoked Function Expression (IIFE) using Vite, and expose a strictly controlled, read-only API for the plugin system.

## Context & Constraints
* **Architecture Philosophy:** CardSpoke is a zero-dependency, framework-agnostic vanilla JS application. **DO NOT** introduce external dependencies (like React, Vue, or Webpack). 
* **UI Rendering:** Continue using the custom hyperscript `h(tag, props, ...children)` function.
* **Offline First:** The final build must be capable of running offline via the `file://` protocol. This requires bundling everything into a single `www/app.js` file to avoid browser CORS restrictions on local ES modules.
* **Testing:** All existing tests in the `tests/` directory must pass after the refactor (347 tests currently passing).

---

## Phase 1: Transition to ES Modules (ESM)
Previously, files in `www/src/` (e.g., `00-core-systems.js`, `01-metadata-and-utilities.js`) attached state and classes to the global `window` object. 

- [x] **Rename Source Files:** Numbered prefixes removed; source files now use domain names: `state.js`, `core.js`, `metadata.js`, `storage.js`, `data.js`, `rendering.js`, `systems.js`.
- [x] **Implement Exports:** `www/src/state.js` exports all shared state using named ESM exports with setter functions.
- [x] **Implement Imports:** Domain-named source files import their dependencies from sibling modules (e.g., `state.js`).
- [x] **Create Entry Point:** `www/src/main.js` created as the Vite IIFE entry point; imports core sub-systems and exposes the public `window.CardSpoke` surface.

## Phase 2: Vite Build Configuration (The IIFE Closure)
Vite is used to bundle the ESM code into a single, enclosed script.

- [x] **Update `vite.config.js`:** Configured to output an IIFE bundle at `www/app.js` using `www/src/main.js` as the entry point (`format: 'iife'`, `name: 'CardSpokeCore'`).
- [x] **Update HTML:** `www/index.html` loads `<script src="app.js"></script>` without `type="module"`, ensuring `file://` compatibility.

## Phase 3: Secure the Plugin Environment
The Vite IIFE build uses `www/src/main.js` to expose a strictly controlled public namespace.

- [x] **Create a Public Namespace:** `www/src/main.js` exposes `window.CardSpoke = Object.freeze({ registerPlugin, requestPermissions })`, limiting the Vite build's public surface to only these two entry-points.
- [x] **Refactor Plugin Loader:** `www/src/core/plugin-validator.js` handles plugin validation. The sandboxed `new Function('ctx', jsCode)` pattern is used to create setup functions from JS strings.
- [ ] **Update Sample Plugins:** JSON files in `sample-plugins/` may still use patterns targeting the concatenation build API (`window.CardSpoke.Plugin.register()`) rather than the new Vite build namespace (`window.CardSpoke.registerPlugin()`). Verify and update as needed.

## Phase 4: Verification & Testing
- [x] **Run Bundler:** Both build paths are functional: `npm run build` (concatenation) and `npm run build:vite` (Vite IIFE).
- [x] **Run Test Suite:** All 347 tests pass via `npm test`.
- [ ] **Manual QA (Vite build):** When using `npm run build:vite`, verify that `window.store` is `undefined` in the browser console (internal state trapped inside the IIFE closure). The concatenation build (`npm run build`) does not provide this isolation.
