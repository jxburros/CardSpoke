# CardSpoke AI Extension Recipes (Copy-Paste Ready)

Use these recipes when an AI must emit a complete Extension JSON artifact without inspecting the CardSpoke UI. Each recipe is valid as-is; replace marked fields only. All scripts assume the runtime provides `CardSpoke_MODS`, `window`, and `document`.

## Plugin: "Card Tagger" (adds quick-tag chips on card render)
```jsonc
{
  "enabled": true,
  "meta": {
    "name": "Card Tagger",
    "type": "Plugin",
    "version": "1.0.0",
    "creator": "<replace: creator>",
    "description": "Adds inline chips to apply tags on each card",
    "releaseDate": "2024-06-01",
    "source": "community",
    "ai_assistants": "GPT-5.1-Codex-Max",
    "dependencies": [],
    "schema_compatibility": "schemaVersion >= 4",
    "angled": true
  },
  "js": "(() => { const STORAGE_KEY = 'card-tagger-v1'; const TAGS = ['research','todo','idea']; CardSpoke_MODS.register('card-tagger', { meta: { name: 'Card Tagger', type: 'Plugin', version: '1.0.0', creator: '<replace: creator>', description: 'Adds inline chips to apply tags on each card', releaseDate: '2024-06-01', source: 'community', ai_assistants: 'GPT-5.1-Codex-Max', angled: true }, onAppInit(ctx){ ctx.logger.info('Card Tagger ready', ctx.schemaVersion); }, onCardRender(ctx, card, el){ if(!el || !el.appendChild) return; const tray = document.createElement('div'); tray.className = 'ct-chip-tray'; TAGS.forEach(tag => { const btn = document.createElement('button'); btn.className = 'ct-chip'; btn.textContent = '#' + tag; btn.type = 'button'; btn.onclick = () => { ctx.api.addTag(card.id, tag); ctx.api.showToast(`Tag ${tag} applied`, 'info'); }; tray.appendChild(btn); }); el.appendChild(tray); }, onDisable(){ document.querySelectorAll('.ct-chip-tray').forEach(n => n.remove()); }, onUninstall(){ localStorage.removeItem(STORAGE_KEY); } }); })();",
  "css": ":root { --ct-bg: var(--bg-surface, #0f172a); --ct-accent: var(--accent, #38bdf8); --ct-text: var(--text-primary, #e2e8f0); } .ct-chip-tray { display: flex; gap: 0.35rem; margin-top: 0.5rem; flex-wrap: wrap; } .ct-chip { border: 1px solid color-mix(in srgb, var(--ct-accent) 65%, transparent); background: color-mix(in srgb, var(--ct-bg) 85%, var(--ct-accent) 15%); color: var(--ct-text); border-radius: 999px; padding: 0.2rem 0.65rem; font-size: 0.85rem; cursor: pointer; } .ct-chip:hover { filter: brightness(1.05); } .ct-chip:focus-visible { outline: 2px solid var(--ct-accent); outline-offset: 2px; }"
}
```

## Theme: "Nocturne" (dark, high-contrast friendly)
```jsonc
{
  "enabled": true,
  "meta": {
    "name": "Nocturne",
    "type": "Theme",
    "version": "1.0.0",
    "creator": "<replace: creator>",
    "description": "Deep navy theme with calm contrast",
    "releaseDate": "2024-06-01",
    "source": "community",
    "ai_assistants": "GPT-5.1-Codex-Max",
    "dependencies": [],
    "schema_compatibility": "schemaVersion >= 4",
    "angled": true
  },
  "js": "(() => { CardSpoke_MODS.register('theme-nocturne', { meta: { name: 'Nocturne', type: 'Theme', version: '1.0.0', creator: '<replace: creator>', description: 'Deep navy theme with calm contrast', releaseDate: '2024-06-01', source: 'community', ai_assistants: 'GPT-5.1-Codex-Max', angled: true } }); })();",
  "css": ":root { --bg-surface: #0b1224; --bg-surface-2: #111a2f; --text-primary: #e7edf9; --text-secondary: #c7d2e9; --accent: #7cc5ff; --accent-strong: #4ea8ff; --border-subtle: #1c2740; --shadow-soft: 0 6px 18px rgba(0,0,0,0.35); --radius-md: 10px; --radius-lg: 14px; } body { background: var(--bg-surface); color: var(--text-primary); } a { color: var(--accent); } [role='button'], button { border-radius: var(--radius-md); } .card { box-shadow: var(--shadow-soft); }"
}
```

## Patch: "Readonly Parents" (prevents deletion of parent cards)
```jsonc
{
  "enabled": true,
  "meta": {
    "name": "Readonly Parents",
    "type": "Patch",
    "version": "1.0.0",
    "creator": "<replace: creator>",
    "description": "Blocks deleting cards that have children; shows toast instead",
    "releaseDate": "2024-06-01",
    "source": "community",
    "ai_assistants": "GPT-5.1-Codex-Max",
    "dependencies": [],
    "schema_compatibility": "schemaVersion >= 4",
    "angled": true
  },
  "js": "(() => { CardSpoke_MODS.register('readonly-parents', { meta: { name: 'Readonly Parents', type: 'Patch', version: '1.0.0', creator: '<replace: creator>', description: 'Blocks deleting cards that have children; shows toast instead', releaseDate: '2024-06-01', source: 'community', ai_assistants: 'GPT-5.1-Codex-Max', angled: true }, onCardDelete(ctx, card){ if(card && Array.isArray(card.children) && card.children.length){ ctx.api.showToast('Cannot delete: card has child cards', 'error'); return false; } }, onDisable(){ /* no DOM to clean */ } }); })();",
  "css": ""
}
```

## How to customize safely
- Replace `<replace: creator>` and optional description/metadata fields; keep `type` aligned to folder name (themes/plugins/patches).
- If you add storage, set a namespaced `STORAGE_KEY` and remove it in `onUninstall`.
- Keep hook names inside the allowed list and include `onDisable` when you create DOM or listeners.
- Ensure `schema_compatibility` matches the current version (4 at time of writing).
- For bundles (Kit/Expansion), nest multiple recipes, ensuring each sub-extension keeps unique ids and cleanups.
