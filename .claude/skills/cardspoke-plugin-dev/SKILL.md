---
name: cardspoke-plugin-dev
description: >-
  Author, scaffold, test, and validate a CardSpoke plugin (theme, feature, or
  app layer). Use whenever the task is to build/create/write a CardSpoke
  plugin, mod, theme, or extension; add a card behavior, middleware hook, UI
  injection, component override, or app transformation to CardSpoke; work with
  a plugin package JSON (manifest/js/css/permissions), the ctx API
  (ctx.api.ui/data/storage/events/middleware), or files under sample-plugins/.
  Produces a working package that installs, enables, suspends, deletes, and
  survives reload.
---

# Building a CardSpoke Plugin

CardSpoke is extended by plugins in three layers. A plugin is a single JSON
package; its `js` field is the **body of a setup function** that receives
`ctx`. This skill walks you from "what do I want to change" to a validated,
tested, reload-safe package.

Authoritative references (read before/while working — they are the contract):

- `docs/PLUGIN_SYSTEM.md` — full guide + complete `ctx` API reference.
- `docs/PLUGIN_INVARIANTS.md` — what must not change; also the exact list of
  hook names, permissions, selectors, and store schema you build against.
- `sample-plugins/` — nine working packages (3 per layer) + `TEMPLATE.json`.
- Bundled quick refs in this skill: [`references/ctx-api.md`](references/ctx-api.md),
  [`references/package-format.md`](references/package-format.md),
  [`references/checklist.md`](references/checklist.md).
- Templates to copy: [`templates/theme.json`](templates/theme.json),
  [`templates/feature.json`](templates/feature.json),
  [`templates/app.json`](templates/app.json).

## Step 1 — Pick the layer

| Want to… | Layer | Risk / enable |
|---|---|---|
| Recolor / restyle only (CSS) | `theme` | SAFE, auto-enabled |
| Add behavior, hooks, DOM, card logic | `feature` | LOW, auto-enabled |
| Rename the app, replace components, deep transform | `app` | HIGH, user enables manually |

Rules that decide the layer for you: a theme has **no JS**; declaring any
`manifest.overrides` (e.g. `appName`) forces the `app` layer / HIGH risk.

## Step 2 — Scaffold the package

Copy the matching `templates/*.json` (or `sample-plugins/TEMPLATE.json`) and
fill in the manifest. Minimum manifest: `name`, `version` (semver), `layer`.
Add `author`, `description`, and — critically — every `permission` your code
uses (see Step 4). Keep the top-level `id` and `manifest.id` equal.

The `js` field is **statements that run with `ctx` in scope** — not a wrapper
and not a registration call:

```javascript
// CORRECT — this is the setup body
var el = document.createElement('span');
el.textContent = 'Hi';
ctx.api.ui.inject('.header', el, 'append');
```

```javascript
// WRONG — never self-register; the package IS the plugin
(function () {
  window.CardSpoke.registerPlugin('my-plugin', { /* ... */ }); // throws duplicate-id
})();
```

## Step 3 — Write setup (and teardown)

- Use `ctx.api.*` for everything ([`references/ctx-api.md`](references/ctx-api.md)).
  Anything you create through it (DOM via `ui.inject`/`replace`, components,
  middleware, event/data listeners, CSS) is **tracked and auto-removed** when
  the plugin is suspended or deleted.
- setup **re-runs on every enable**, including at boot after a reload. Make it
  idempotent (guard against duplicate DOM you created outside the tracked
  APIs).
- For things the tracker can't see (`setInterval`, `MutationObserver`), stash
  state on `ctx` (e.g. `ctx._timer = setInterval(...)`) and clear it in
  `teardownJs` — teardown receives the **same `ctx`** object. See
  `sample-plugins/apps/pomodoro-desk.json`.
- Prefer live, reversible changes (`ctx.api.ui.inject`/`replace`,
  `ctx.api.ui.registerComponent('Card', …)`) over one-shot DOM edits.

## Step 4 — Declare permissions

Match declared `manifest.permissions` to the gated APIs you call, or the call
throws `Plugin does not have <permission> permission`:

| API you call | Permission |
|---|---|
| `ctx.api.ui.inject/replace/registerComponent` | `ui-override` |
| `ctx.api.data.createCard/updateCard/deleteCard/addTag/removeTag/setTags` | `data-modify` |
| `ctx.api.storage.*` | `storage` |
| `ctx.api.network.*` | `network` |
| `ctx.api.filesystem.*` | `filesystem` |

Read-only data calls (`getCard`, `listCards`, `getTags`, `getAllTags`,
`onUpdate`), `ctx.api.ui.showToast`, `ctx.api.events.*`, and
`ctx.api.middleware.*` need no permission.

## Step 5 — Validate and test

1. **Compile check** the js/teardownJs strings (they must parse as a setup
   body):

   ```bash
   node -e 'const p=require("./sample-plugins/features/YOURFILE.json"); new Function("ctx", p.js); if(p.teardownJs) new Function("ctx", p.teardownJs); console.log("ok")'
   ```

2. **Validator + lifecycle:** if you added the package under `sample-plugins/`,
   `npm test` runs `tests/sample-extensions.test.js` (validator, permission
   declaration, gallery consistency) and `tests/plugin-lifecycle.test.js`
   (install → enable → suspend → reload → delete against the real runtime).
   Model new tests on `tests/plugin-lifecycle.test.js`.

3. **Manually in the app:** `npm run dev`, open Plugin Manager → Install, load
   your `.json`, then verify Enable / Suspend / Remove and that state survives
   a reload. `index.html?safemode` boots with all plugins disabled if you
   break something.

Full pre-ship checklist: [`references/checklist.md`](references/checklist.md).

## Step 6 — Add to the gallery (optional)

To surface a `sample-plugins/` package in the in-app Gallery, add an entry to
`sample-plugins/manifest.json` (`id`, `name`, `description`, `layer`, `url`
pointing at the raw file on the `main` branch). The sample-extensions test
enforces that every gallery entry points at a real package.

## Guardrails

- **Never** call `registerPlugin`/`Plugin.register` from a plugin's `js`.
- **Never** persist a plugin as a `setup` **function** and expect reload
  survival — only string `js`/`teardownJs` are persisted. Module-form
  definitions with real functions are session-only dev tools.
- Don't reach past `ctx.api.*` into app internals from a feature plugin; that
  couples you to non-contract code (`docs/PLUGIN_INVARIANTS.md` lists what is
  actually stable).
- Don't widen the plugin runtime to solve a single plugin's need — fix the
  plugin. Runtime changes must honor `docs/PLUGIN_INVARIANTS.md` and update
  its change checklist.
- Keep themes CSS-only and use the documented CSS variables / `:root.dark`
  rather than hard-coding colors on core selectors.
