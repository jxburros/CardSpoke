# Pre-ship checklist for a CardSpoke plugin

Package

- [ ] Single valid JSON file; top-level `id` == `manifest.id`; id is
      lowercase alphanumeric + hyphens.
- [ ] `manifest.name`, `manifest.version` (semver), `manifest.layer` present.
- [ ] Correct layer: theme = CSS only (no `js`); any `overrides` ⇒ `app`.
- [ ] Every gated API the code calls has its permission declared
      (ui-override / data-modify / storage / network / filesystem).

Code

- [ ] `js` is a setup body — no `registerPlugin`/`Plugin.register` call.
- [ ] `js`/`teardownJs` are strings (so they persist + re-run on reload).
- [ ] setup is idempotent (safe to run again on every enable / boot).
- [ ] Everything uses `ctx.api.*`; DOM built with `ctx.api.ui.inject/replace`
      so it's tracked and reversible.
- [ ] Timers/observers stashed on `ctx` and cleared in `teardownJs`.
- [ ] `js`/`teardownJs` compile: `node -e 'new Function("ctx", pkg.js)'`.

Lifecycle (verify in-app or via a lifecycle test)

- [ ] Installs without error; lands enabled (theme/feature) or suspended (app).
- [ ] Enable applies effect; Suspend removes it completely (no ghost DOM/CSS).
- [ ] Survives a page reload with its enabled/suspended state.
- [ ] Reinstalling the same id updates in place (no `id-1` duplicate).
- [ ] Remove deletes it and revokes its permissions.
- [ ] `index.html?safemode` boots with it disabled.

Tests / distribution

- [ ] If under `sample-plugins/`, `npm test` passes (sample-extensions +
      plugin-lifecycle suites).
- [ ] If it should appear in the Gallery, added to `sample-plugins/manifest.json`.

Contract

- [ ] No change to anything in `docs/PLUGIN_INVARIANTS.md`. If a runtime
      change was truly required, its change checklist was followed (docs,
      samples, tests, version bump).
