# Sample Extensions

Use these ready-made examples as starting points. They align with the runtime APIs described in the API Reference.

## Card Tagger (Plugin)
- **Purpose:** Adds inline chips on every card render so users can apply predefined tags.
- **Hooks:** `onAppInit` for logging, `onCardRender` to inject buttons, `onDisable` to remove injected DOM, `onUninstall` to clear storage.
- **Notes:** Namespaces its storage key (`card-tagger-v1`) and applies CSS via rounded chips with focus states.

## Nocturne (Theme)
- **Purpose:** Purely cosmetic theme with deep navy background and accent blues.
- **Hooks:** Registers metadata only (no JS hooks); styling is entirely in CSS.
- **Notes:** Demonstrates how a theme can ship CSS without behavioral hooks while still declaring metadata.

## Readonly Parents (Patch)
- **Purpose:** Prevents deleting cards that have children.
- **Hooks:** `onCardDelete` to guard the delete flow; `onDisable` is present even though no DOM is added.
- **Notes:** Shows how to abort a destructive action by returning `false` inside a hook.

## How to reuse
1. Copy the JSON from the recipes file in `extensions/AI_EXTENSION_RECIPES.md`.
2. Replace `<replace: creator>` and adjust description/version as needed.
3. Keep hook names within the allowed set and ensure `onDisable` is present for any DOM/listener work.
4. If you add storage, pick a namespaced key and clear it in `onUninstall`.
