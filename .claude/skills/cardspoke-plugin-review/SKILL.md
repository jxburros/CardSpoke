---
name: cardspoke-plugin-review
description: >-
  Review, validate, or debug a CardSpoke plugin package before shipping, or
  diagnose a plugin that won't install / enable / persist / clean up. Use when
  checking a CardSpoke plugin (mod/theme/feature/app) for correctness against
  the runtime contract, when a plugin "installs but does nothing", disappears
  after reload, throws a permission or duplicate-id error, or leaves ghost
  DOM/CSS after suspend. Complements cardspoke-plugin-dev (which authors them).
---

# Reviewing / Debugging a CardSpoke Plugin

Validate a package against the runtime contract and diagnose lifecycle
failures. Ground truth: `docs/PLUGIN_INVARIANTS.md` and the runtime in
`www/src/core/plugin-api.js`. Full behavior: `docs/PLUGIN_SYSTEM.md`.

## Review pass (run top to bottom)

1. **Static validity**
   - Valid JSON; top-level `id` == `manifest.id`; id matches
     `^[a-z0-9-]+$`.
   - Required manifest fields: `name`, `version` (semver `X.Y.Z`), `layer`
     (`theme`|`feature`|`app`).
   - Layer sanity: theme has **no `js`**; any `manifest.overrides` ⇒ must be
     `app` layer.
   - `js`/`teardownJs` compile as a setup body:

     ```bash
     node -e 'const p=require("./PATH.json"); new Function("ctx", p.js||""); if(p.teardownJs) new Function("ctx", p.teardownJs); console.log("compiles")'
     ```

   - Run the validator directly:

     ```bash
     node --input-type=module -e 'import("./www/src/core/plugin-validator.js").then(({PluginValidator:V})=>{const p=require("./PATH.json");console.log(V.validate({id:p.id,manifest:p.manifest,css:p.css,js:p.js}))})'
     ```

2. **Anti-patterns (reject these)**
   - `js` calls `registerPlugin(` or `Plugin.register(` → self-registration,
     throws duplicate-id. The package self-registers via `install()`; the
     `js` must be a plain setup body.
   - Plugin persisted/shipped with a `setup`/`teardown` **function** instead
     of a `js`/`teardownJs` **string** → won't survive reload (functions
     aren't serializable). Only string form persists.
   - `eval(` or `new Function(` in `js` → validator rejects.
   - A gated API call whose permission is **not** declared in
     `manifest.permissions` (see table below) → throws at runtime.
   - DOM/timer created outside `ctx.api.*` with no matching cleanup in
     `teardownJs` → leaks after suspend.
   - setup that is not idempotent (duplicates DOM it created directly) →
     doubles up on re-enable / reload.

3. **Permission ↔ API cross-check**

   | Gated call | Required permission |
   |---|---|
   | `ctx.api.ui.inject/replace/registerComponent` | `ui-override` |
   | `ctx.api.data.createCard/updateCard/deleteCard/addTag/removeTag/setTags` | `data-modify` |
   | `ctx.api.storage.*` | `storage` |
   | `ctx.api.network.*` | `network` |
   | `ctx.api.filesystem.*` | `filesystem` |

   Free: read-only data (`getCard`/`listCards`/`getTags`/`getAllTags`/`onUpdate`),
   `ui.showToast`, `events.*`, `middleware.*`.

4. **Lifecycle proof** — install → enable → suspend → reload → delete.
   Cheapest path: add/adapt a case in `tests/plugin-lifecycle.test.js` (it
   drives the real runtime with a fake DOM and simulates reload via
   `JSON.stringify(store)` → fresh runtime → `syncFromStore`). Then
   `npm test`.

## Diagnosing common failures

| Symptom | Likely cause | Fix |
|---|---|---|
| "Plugin … is already registered" | `js` self-registers | Remove the `registerPlugin` call; make `js` a setup body |
| "Plugin validation failed: …" | missing manifest field, blocked pattern, size limit | Read the message; fix the manifest/js/css |
| "Plugin does not have X permission" | undeclared permission | Add X to `manifest.permissions`; re-enable to re-consent |
| Installs but does nothing | shipped as `setup` function, or setup throws | Ship string `js`; check console — a throwing setup leaves it installed-but-suspended |
| Gone / inert after reload | function-form definition (session only) | Use string `js`/`teardownJs`; confirm it appears in `store.plugins[id].definition.js` |
| Ghost DOM/CSS after suspend | created outside `ctx.api`, no teardown | Use `ctx.api.ui.inject/replace`, or clean up in `teardownJs` |
| Duplicate elements on reload | non-idempotent setup | Guard/rebuild instead of appending unconditionally |
| Whole app broken | bad app-layer plugin | Boot `index.html?safemode`, then suspend/remove it |

## Invariant guardrails

If a proposed fix changes runtime behavior rather than the plugin, check it
against `docs/PLUGIN_INVARIANTS.md` first: the `window.CardSpoke` surface,
boot order, host-bridge globals, `store.plugins` schema, permission names,
middleware operation names, component names, and CSS selectors are contracts.
Changing one means following that document's change checklist (docs + samples
+ tests + version bump), not a quiet edit.

## Validation commands

```bash
npm test          # includes sample-extensions + plugin-lifecycle suites
npm run build     # the one canonical Vite build (www/app.js)
```
