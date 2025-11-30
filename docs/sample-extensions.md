# Sample Extension Concepts

The examples below provide two concepts per extension type, showing a simple starter idea and a more advanced option that stretches the category. Align each concept with the extension rules in `cardspoke_spec_v1.md` (e.g., Themes stay cosmetic, Mods can alter core logic, Kits bundle Themes/Patches only, Expansions include at least one Plugin or Mod).

## Themes
- **Minimalist Monochrome (simple):** A grayscale palette with high-contrast text, slim borders, and subtle elevation; swaps only CSS variables and typography scales to stay cosmetic.
- **Aurora Workspace (complex):** Dynamic accent gradients that shift based on time-of-day, per-lane background treatments, card density toggles, and contextual iconography for tags—all implemented through themable tokens without touching logic.

## Plugins
- **Quick Capture Dock (simple):** Adds a collapsible bottom dock for rapid card entry with preset templates and keyboard shortcuts; no changes to existing logic.
- **Insight Overlay (complex):** Injects a side panel that surfaces card analytics (cycle time, tag frequency, sentiment snippets) with drill-down filters and export-to-CSV, powered by read-only data queries.

## Mods
- **Strict WIP Guard (simple):** Enforces per-lane work-in-progress limits by blocking moves that would exceed thresholds and showing inline rationale.
- **Adaptive Flow Orchestrator (complex):** Rewrites routing rules so cards auto-advance based on rulesets (e.g., SLA, priority, dependency status), injects required checkpoints, and rewires keyboard shortcuts to match the new flow.

## Kits
- **Focus Kit (simple):** Bundle that combines the Minimalist Monochrome Theme with a Patch that disables non-critical notifications for distraction-free sessions.
- **Product Discovery Kit (complex):** Bundles the Aurora Workspace Theme with a Patch that adds discovery-specific card fields, custom filters, and curated dashboards; excludes any Plugins or Mods to remain a Kit.

## Expansions
- **Customer Success Expansion (simple):** Includes a Success Desk Plugin (SLA timers, renewal watchlist) plus a WIP Guard Mod variant tuned for account managers.
- **AI Research Expansion (complex):** Ships an Insight Overlay Plugin enhanced with AI summarization, a Mod that adds experiment workflow states, domain-specific Themes for readability, and optional integrations to external vector stores.

## Downloadable Samples
Concrete sample files that match the concepts above live in `extensions/samples/`:

- **Themes:** `extensions/samples/themes/minimalist-monochrome.theme.json`, `extensions/samples/themes/aurora-workspace.theme.json`
- **Plugins:** `extensions/samples/plugins/quick-capture-dock.plugin.js`, `extensions/samples/plugins/insight-overlay.plugin.js`
- **Mods:** `extensions/samples/mods/strict-wip-guard.mod.js`, `extensions/samples/mods/adaptive-flow-orchestrator.mod.js`
- **Kits:** `extensions/samples/kits/focus-kit.kit.json`, `extensions/samples/kits/product-discovery.kit.json`
- **Expansions:** `extensions/samples/expansions/customer-success.expansion.json`, `extensions/samples/expansions/ai-research.expansion.json`

### Why the earlier samples failed

- The live extension runtime only exposes the hooks listed in `CardSpoke_MODS.VALID_HOOKS` inside `www/app.js` (`onAppInit`, `onCardSave`, `onCardDelete`, `onCardRender`, `onNavigate`, `onSearch`, `onThemeChange`, `onTypographyChange`, `onHighContrastChange`, `onExport`, `onImport`, `onEnable`, `onDisable`, `onUninstall`).
- The public APIs available to mods come from `window.CardSpoke.utils` and the `ctx.api` object created in `CardSpoke_MODS.buildContext`—there is **no** `ctx.events`, `ctx.analytics`, `ctx.board`, or `ctx.utils.registerShortcut` helper today.
- Earlier sample files called unsupported hooks and APIs, so they never registered cleanly. The updated samples now stick to the available hooks and the documented `CardSpoke.utils`/`ctx.api` methods (e.g., `createCard`, `searchCards`, `listCards`, `updateCard`, `getNavState`, `showToast`).

If you add new capabilities to the runtime, update this doc and the sample files so they remain runnable with the shipped APIs.
