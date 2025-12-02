# CardSpoke AI Prompt Kit for Extension Generation

Use these prompt patterns to steer an AI toward fully-formed CardSpoke Extensions without inspecting the app. Slot in the requested feature and metadata; keep the structural guardrails intact.

## 1) Single-Extension Prompt
```
You are generating a CardSpoke Extension JSON artifact. Follow these rules:
- Top-level keys: enabled<boolean>, meta<object>, js<string>, css<string>.
- meta must include name, type (Theme|Patch|Plugin|Mod|Kit|Expansion), version, creator, description, releaseDate (ISO), source (community), ai_assistants, dependencies array, schema_compatibility (use "schemaVersion >= 4"), angled<boolean>.
- JS must be an IIFE calling CardSpoke_MODS.register('<id>', { ...hooks }). Use only allowed hooks and implement onDisable for any listeners/DOM.
- If you add storage, declare const STORAGE_KEY='<id>-v1' and remove in onUninstall.
- CSS must use CSS variables when over 100 chars; scope classes with a unique prefix.
- Assume cards shaped as { id, title, body, parentId|null, tags[], createdAt, updatedAt, modsData? }.
- Respect local-first: no network calls unless explicitly allowed by the user.
- Output a single JSON object ready to save under the matching folder (e.g., plugins/<id>.json).
Generate an extension that <describe feature>.
```

## 2) Bundle Prompt (Kit/Expansion)
```
Goal: produce a Kit/Expansion bundling multiple CardSpoke Extensions.
- Return an array of JSON objects, each following the single-extension rules.
- Provide unique ids and STORAGE_KEY namespaces per item.
- Include complementary types: e.g., Theme + Plugin, or Plugin + Patch.
- Add a short changelog line in each meta description (e.g., "v1.0.0 initial bundle").
- Keep schema_compatibility at "schemaVersion >= 4".
- Default enablement: true for low-risk Themes/Plugins, false for high-impact Mods.
Bundle should deliver <describe bundle goal>.
```

## 3) Repair Prompt (fix failing artifact)
```
You are fixing a CardSpoke Extension JSON artifact that failed validation. Apply these repairs:
- Ensure JSON parses and contains enabled, meta, js, css.
- Add missing allowed hooks and cleanup in onDisable for DOM/listeners.
- Insert STORAGE_KEY with onUninstall cleanup if storage is used.
- Conform meta fields to the spec; set schema_compatibility to "schemaVersion >= 4".
- Add CSS variables and scoped class names.
Return the corrected JSON artifact only.
```

## 4) Self-Evaluation Prompt
```
Before returning the artifact, check:
- Does js contain CardSpoke_MODS.register and only allowed hooks?
- Does css use var(-- tokens when long)?
- Is onDisable present if DOM or listeners are created?
- Is schema_compatibility set to schemaVersion >= 4?
- Are storage keys namespaced and removed in onUninstall?
If any answer is no, fix it before responding. Output the final JSON only.
```

## 5) Ready-to-use clause for assistants
Add this sentence to prompts when integrating with a constrained agent: “Do not request the CardSpoke app; everything you need is specified above.”

These prompt blocks keep AI outputs structured, schema-aligned, and safe-by-default for CardSpoke.
