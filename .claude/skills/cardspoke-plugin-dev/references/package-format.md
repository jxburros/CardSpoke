# Plugin package format quick reference

A plugin is one JSON file. Canonical field docs: `docs/PLUGIN_SYSTEM.md`.

```json
{
  "id": "my-plugin",
  "manifest": {
    "id": "my-plugin",
    "name": "My Plugin",
    "version": "1.0.0",
    "author": "Your Name",
    "description": "What it does",
    "layer": "feature",
    "permissions": ["ui-override"],
    "compatibility": ">=0.17.0",
    "config": { "someSetting": 25 },
    "overrides": { "appName": "My App" },
    "dependencies": ["other-plugin-id"]
  },
  "css": "/* injected while enabled, removed when suspended */",
  "js": "ctx.api.ui.showToast('hello', 'info');",
  "teardownJs": "if (ctx._timer) clearInterval(ctx._timer);"
}
```

Required: `manifest.name`, `manifest.version` (semver), `manifest.layer`
(`theme`|`feature`|`app`). Keep top-level `id` == `manifest.id`.

Key rules:

- `js` is the **setup body** (receives `ctx`). Never call
  `registerPlugin`/`Plugin.register` from it.
- `js`/`teardownJs` are **strings** — that is what persists and re-runs after
  reload. Registering a definition with `setup`/`teardown` *functions* is
  session-only (dev).
- `theme` layer: `css` only, **no `js`**.
- Declaring any `manifest.overrides` forces `app` layer / HIGH risk.
  Implemented override keys: `appName` (renames `#brandBtn`). Others are not
  yet wired — don't rely on them.
- `manifest.config` values become `ctx.config` and an auto-generated settings
  panel; value type (boolean/number/string) picks the input type; edits
  persist.
- Top-level `id`/`config`/`overrides` are normalized into the manifest on
  install (explicit manifest values win).
- Validator limits: CSS ≤ 100 KB (strips `@import`, `javascript:`,
  `expression()`, `behavior:`, `-moz-binding`); JS ≤ 500 KB and must not
  contain `eval(` or `new Function(`.

Risk / auto-enable:

| Layer | Has JS? | Overrides? | Risk | Auto-enabled on install |
|---|---|---|---|---|
| theme | no | no | SAFE | yes |
| feature | yes | no | LOW | yes |
| app | any | any / yes | HIGH | no (user enables) |
