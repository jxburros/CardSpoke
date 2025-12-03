# CardSpoke AI Developer Docs

These instructions are written for an AI assistant that must build a working CardSpoke Extension without inspecting the app UI. Follow them exactly to produce an Extension JSON artifact that passes automated checks and runs inside CardSpoke.

**Current App Version:** 0.16.0 | **Schema Version:** 4

## 1) Deliverable Format (JSON Artifact)
Create a single JSON file that includes everything the app needs:

```jsonc
{
  "enabled": true,                // default enablement
  "id": "my-extension",           // optional: auto-extracted from CardSpoke_MODS.register() call if omitted
  "meta": {
    "name": "My Extension",      // human-readable title
    "type": "Plugin",            // one of: Theme | Patch | Plugin | Mod | Kit | Expansion
    "version": "1.0.0",
    "creator": "Your Name or Org",
    "description": "What it does",
    "date_created": "2024-01-15", // ISO date
    "official": false,
    "ai_assistants": ["Model names used"],
    "dependencies": ["OtherExt@1.0.0"],
    "schema_compatibility": "schemaVersion >= 4",
    "angled": true                 // mark true for community builds
  },
  "js": "// JavaScript string (see Section 3)",
  "css": "/* CSS string (see Section 4) */"
}
```

Constraints the JSON must satisfy (mirrors automated tests):
- Top-level fields: `enabled` (boolean), `js` (string), `css` (string), `meta` (object).
- Optional top-level field: `id` (string) - if omitted, will be auto-extracted from the `CardSpoke_MODS.register('id', ...)` call in your JS code.
- **IMPORTANT:** The `id` field (if provided) or the ID in your `CardSpoke_MODS.register()` call MUST match. The loader uses the registration ID to track your extension.
- `meta.type` must match the folder/category name if sorted (e.g., `plugins/` -> `Plugin`).
- Use an IIFE for JS and call `CardSpoke_MODS.register('id', { ...hooks })` inside it.
- Hook names must be from the allowed list: `onAppInit`, `onEnable`, `onDisable`, `onUninstall`, `onCardSave`, `onCardDelete`, `onCardRender`, `onNavigate`, `onSearch`, `onThemeChange`, `onTypographyChange`, `onHighContrastChange`, `onExport`, `onImport`.
- If you use `localStorage`, define a `const STORAGE_KEY = 'your-key';` and namespace all stored data under it.
- If JS length exceeds ~5000 characters, implement `onDisable` to clean up listeners/DOM.
- For CSS >100 characters, use CSS variables via `var(--token)`.

## 2) Lifecycle & Hook Semantics
Each registered extension receives a `ModContext` as the first parameter for hooks. It provides:
- `ctx.modId` — the id you register with.
- `ctx.appVersion`, `ctx.schemaVersion` — current versions.
- `ctx.api` — synchronous store API with CRUD, tagging, navigation, toast, and logging helpers (`getCard`, `listCards`, `createCard`, `updateCard`, `deleteCard`, `getTags`, `setTags`, `addTag`, `removeTag`, `getAllTags`, `navigate`, `goBack`, `showToast`, `markDirty`, `getDatasetMeta`, `getAppInfo`).
- `ctx.utils` — promise-based helpers for the same operations plus accessibility (`getTheme`, `setTheme`, `setHighContrast`, `getAccessibilitySettings`, `getThemeVariables`) and dataset metadata.
- `ctx.logger` — scoped logger with `log/info/warn/error`.

Hook expectations:
- **onAppInit** — fire once on load; set up state, add UI, register events.
- **onEnable / onDisable** — toggle logic; remove DOM listeners, intervals, and event-bus subscriptions in `onDisable`.
- **onUninstall** — final cleanup (storage keys, DOM nodes).
- **onCardSave/Delete** — respond to CRUD; `SaveInfo.isNew` indicates create vs update.
- **onCardRender** — receives `(ctx, card, element)`; you may append DOM nodes inside `element`.
- **onNavigate / onSearch** — react to navigation or search result lists.
- **onThemeChange / onTypographyChange / onHighContrastChange** — adjust styling when accessibility settings change.
- **onExport / onImport** — wrap persistence logic; keep data portable.

Use `CardSpoke_MODS.events` for cross-extension communication: `on(event, cb)`, `emit(event, data)`, `off(event, cb)`, `clear(event?)`. For debugging, `CardSpoke_MODS.devTools.inspectMod(id)`, `getHookStats()`, `getErrorLog()`, `clearErrorLog()`, and `testHook(id, hookName, ...)` are available.

## 3) JavaScript Template (drop into `js` string)
Wrap code in an IIFE and register once. Example plugin id `ai-word-count`:

```js
(() => {
  const STORAGE_KEY = 'ai-word-count';

  CardSpoke_MODS.register('ai-word-count', {
    meta: {
      name: 'AI Word Count',
      type: 'Plugin',
      version: '1.0.0',
      creator: 'AI Builder',
      description: 'Shows live word counts on cards',
      releaseDate: '2024-01-15',
      source: 'community',
      ai_assistants: 'GPT-5.1-Codex-Max',
      angled: true
    },

    onAppInit(ctx) {
      const saved = localStorage.getItem(STORAGE_KEY);
      ctx.logger.info('Loaded settings', saved);
    },

    onCardRender(ctx, card, el) {
      const badge = document.createElement('div');
      badge.className = 'aiwc-badge';
      badge.textContent = `${card.body.split(/\s+/).filter(Boolean).length} words`;
      el.appendChild(badge);
    },

    onDisable(ctx) {
      // remove injected elements and listeners if any
      document.querySelectorAll('.aiwc-badge').forEach(node => node.remove());
    }
  });
})();
```

Key rules:
- Never assume global variables beyond `window`, `document`, `CardSpoke_MODS`, `storeAPI` (provided internally), and `console`.
- Avoid long-running synchronous work in hooks; prefer async/await inside hooks when needed.
- Use `ctx.api.showToast('msg', 'info')` for user notices.
- Mark dirty after mutating cards via `ctx.api.markDirty()` if you bypass helpers.
- Always guard DOM queries to avoid `null` errors.

## 4) CSS Template (drop into `css` string)
Use CSS variables for theming; scope styles to a unique class prefix.

```css
:root {
  --aiwc-bg: var(--bg-surface, #0b1021);
  --aiwc-text: var(--text-primary, #e8ecf2);
  --aiwc-accent: var(--accent, #7ab7ff);
}

.aiwc-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.4rem;
  margin-left: 0.5rem;
  border-radius: 6px;
  background: var(--aiwc-bg);
  color: var(--aiwc-text);
  border: 1px solid color-mix(in srgb, var(--aiwc-accent) 60%, transparent);
  font-size: 0.8rem;
}
```

For Themes, override CSS variables instead of DOM styles (e.g., `--bg-surface`, `--text-primary`, `--accent`). For high-contrast compatibility, ensure sufficient color contrast and respect `prefers-reduced-motion` by avoiding animations or gating them.

## 5) Extension Type Playbook
- **Theme**: only CSS; keep `js` minimal (optionally empty string). Use CSS variables and avoid logic.
- **Plugin**: add UI/utility without rewriting core flows. Use `onCardRender`, `onSearch`, `onNavigate` for non-invasive overlays.
- **Patch**: targeted behavior tweaks; guard with feature flags and implement `onDisable`.
- **Mod**: deep changes; provide clear logging, cleanup, and feature flags. Expect higher risk of schema drift.
- **Kit**: bundle of Themes/Patches; describe contents in `meta.description` and expose toggles in JS if present.
- **Expansion**: bundle with at least one Plugin or Mod; include setup order and dependency checks.

## 6) Data, Storage, and Safety
- Data model: cards have `{ id, title, body, parentId|null, tags[], createdAt, updatedAt, modsData? }`.
- Tag helpers exist (`getTags`, `addTag`, `removeTag`, `setTags`, `getAllTags`).
- Dataset metadata tracks counts, schemaVersion (currently 4), and appVersion (currently 0.16.0); keep exports (`onExport`) compatible with the core formats (JSON/CSV/Markdown/TXT) so users can restore or merge datasets.
- Respect user ownership: no network calls or off-device storage unless the user explicitly opts in (ask via UI prompt and document the behavior).
- Persist custom state with namespaced `localStorage` keys and reversible defaults. Provide `onUninstall` cleanup that removes stored data and DOM. Avoid colliding with built-in preference keys (`cardspoke_richtext`, `cardspoke_gridView`, `cardspoke_highContrast`, `cardspoke_typography`, `cardspoke_activeThemeExtension`, `cardspoke_devmode`, `cardspoke_theme`).
- Avoid obfuscation; log recoverable errors and fail safely.

## 7) Build Steps for an AI
1. Choose an id and type; craft `meta` accordingly.
2. Write CSS first (scoped class prefix + variables).
3. Write JS using the IIFE + `CardSpoke_MODS.register` template; add only allowed hooks.
4. If storing data, add `const STORAGE_KEY = '<id>-v1';` and cleanup paths.
5. Insert JS and CSS strings into the JSON artifact (escape quotes/newlines as needed).
6. Validate: ensure `enabled` boolean, `meta` object present, hook names valid, JS contains `CardSpoke_MODS.register`, CSS uses `var(--...)` if long, and `onDisable` exists for complex JS.
7. Save under the matching category folder name (`themes/`, `plugins/`, `mods/`, `kits/`, `expansions/`) so `meta.type` matches.

## 8) Testing & Self-Checks
- Lint mentally: no undeclared globals, guard DOM selectors, cleanup listeners.
- Complexity variation: when supplying pairs (e.g., two plugins), make one lightweight and one feature-rich to satisfy coverage tests.
- Use `CardSpoke_MODS.devTools.inspectMod('<id>')` and `getHookStats()` inside the console to verify load/enable/disable.

## 9) Reference Hook Map (copy/paste)
```
VALID_HOOKS = [
  'onAppInit',
  'onEnable',
  'onDisable',
  'onUninstall',
  'onCardSave',
  'onCardDelete',
  'onCardRender',
  'onNavigate',
  'onSearch',
  'onThemeChange',
  'onTypographyChange',
  'onHighContrastChange',
  'onExport',
  'onImport'
]
```

Follow these steps verbatim and the resulting Extension should load, toggle cleanly, and satisfy automated validation without needing to open the CardSpoke app.
