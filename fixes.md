# CardSpoke Production Readiness Checklist

Based on current source code and internal architectural reviews, the following critical issues must be resolved before CardSpoke is ready for a production release.

## 1. Plugin Persistence & Lifecycle
* **Fix Function Serialization**: Currently, JavaScript `setup` and `teardown` functions are lost on page reload because they cannot be serialized to JSON.
* **Reconstruct on Boot**: The `syncFromStore` process must be updated to reconstruct executable functions from saved JS strings using the `PluginSandbox` factory.
* **Dependency Management**: Implement the "Phase 3.3" dependency checking to halt installation if a declared dependency is missing.

## 2. Security & Sandboxing
* **Enforce Iframe Isolation**: Fully migrate plugin execution to the `sandbox:execute` iframe runtime to prevent plugins from accessing the global `window` object directly.
* **Harden Permissions**:
    * Remove "auto-grant" fallbacks in `_checkPermissions` that bypass user consent.
    * Implement active enforcement for `network` and `filesystem` permissions, which are currently defined but not checked during API calls.
* **Internal API Protection**: Ensure `captureInternalReferences` is called consistently before any plugin execution to prevent core function overriding.

## 3. Performance & Stability
* **Renderer Cleanup Registry**: Implement a lifecycle cleanup stack for route renderers to prevent the accumulation of scroll and resize listeners during long sessions.
* **Transaction Boundaries**:
    * **Batched Saves**: Collapse recursive `save()` calls (e.g., during large branch deletions) into a single commit boundary to improve performance.
    * **Undo Groups**: Implement transaction-aware undo groups so that bulk operations like imports or recursive duplicates can be reverted as a single action.

## 4. Storage & Data Integrity
* **Address Quota Limits**: LocalStorage is limited to ~5MB; provide a one-click migration workflow to move datasets to `IndexedDB` or `LocalFile` (via the Storage Driver Interface).
* **Enhanced Integrity Checks**: Expand `validateStoreConsistency` to proactively identify and fix orphan links, parent/child cycles, and duplicate IDs beyond basic structural repairs.
* **Configuration Wiring**: Wire up the currently unused `overrides` and `config` fields in the plugin schema to allow for proper app rebranding and per-plugin settings.

## 5. Development Workflow
* **Source Synchronization**: Resolve the divergence between the concatenated `www/src/core.js` and the ESM modules in `www/src/core/` to ensure consistent behavior across all build targets.
* **Error Boundaries**: Implement visible in-app error reporting for plugin failures, rather than only logging errors to the developer console.
