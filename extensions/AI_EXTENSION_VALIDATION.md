# CardSpoke AI Extension Validation Checklist

A strict checklist for AI-generated Extensions. Run through every section before returning an artifact.

## 1) Structure & Metadata
- File is valid JSON: parse once after inserting JS/CSS strings.
- Top-level keys: `enabled` (boolean), `meta` (object), `js` (string), `css` (string).
- `meta` includes: `name`, `type`, `version`, `creator`, `description`, `releaseDate` (ISO date), `source` (`official`|`community`), `ai_assistants`, `dependencies` (array), `schema_compatibility`, and `angled` (boolean for community builds).
- `meta.type` matches the folder/category name where the file will be stored.
- `schema_compatibility` references the current schemaVersion (4 at time of writing).

## 2) Hook Hygiene
- JS contains exactly one `CardSpoke_MODS.register('<id>', { ... })` call inside an IIFE.
- Hooks used are in the allowed list: `onAppInit`, `onEnable`, `onDisable`, `onUninstall`, `onCardSave`, `onCardDelete`, `onCardRender`, `onNavigate`, `onSearch`, `onThemeChange`, `onTypographyChange`, `onHighContrastChange`, `onExport`, `onImport`.
- Any DOM mutation or event listener creation has a matching cleanup in `onDisable` (and `onUninstall` if storage is touched).
- No async code without `await`/Promise handling; guard DOM lookups to avoid null access.

## 3) Storage & Safety
- If using localStorage: declare `const STORAGE_KEY = '<id>-v1';`, read safely, and remove in `onUninstall`.
- No network calls unless explicitly requested by the user; default to local-first behavior.
- Avoid obfuscation; log errors with `ctx.logger.error` and fail gracefully.
- Respect accessibility: use CSS variables, avoid forced animations, and allow for high-contrast overrides.

## 4) Data Shape Assumptions
- Cards: `{ id, title, body, parentId|null, tags[], createdAt, updatedAt, modsData? }`.
- Tag helpers: `addTag(id, tag)`, `removeTag(id, tag)`, `getTags(id)`, `getAllTags()`.
- App info: `ctx.getAppInfo()` yields `{ appVersion, schemaVersion }` (schemaVersion currently 4).

## 5) Self-Tests an AI can perform
- **Parse test:** Run JSON.parse on the final artifact string.
- **Hook presence:** Assert `js` contains `CardSpoke_MODS.register` and one of the allowed hook names.
- **Cleanup test:** If `js` includes `addEventListener`, `setInterval`, or DOM appends, assert `onDisable` exists.
- **CSS scan:** If `css` length > 100 chars, assert `var(--` tokens exist to ensure theming compliance.
- **Length sanity:** Keep JS under ~5k characters; if larger, implement thorough cleanup.

## 6) Output contract for the AI
- Return a single JSON object per Extension unless producing a Kit/Expansion bundle (then return an array with multiple objects, each valid and self-contained).
- Provide the intended folder (e.g., `plugins/ai-card-tagger.json`) so humans can place it correctly.
- Include a short changelog entry when iterating versions (e.g., `v1.0.1: fix cleanup`), but keep previous metadata intact.
- Confirm enablement default (`enabled: true` or `false`) based on risk level; high-impact Mods should default to `false`.

Following this checklist ensures an AI-produced Extension loads cleanly, respects CardSpoke conventions, and can be safely toggled without manual fixes.
