# Sample Extensions

Use these ready-made examples as starting points. They align with the runtime APIs described in the API Reference. All samples live in the `sample-extensions/` directory, organized by type.

## Themes

### Nocturne
- **Purpose:** Purely cosmetic dark theme with deep navy background and accent blues.
- **Hooks:** Registers metadata only (no JS hooks); styling is entirely in CSS.
- **Notes:** Demonstrates how a theme can ship CSS without behavioral hooks while still declaring metadata.
- **File:** `sample-extensions/themes/nocturne.json`

### Sunrise
- **Purpose:** Warm sunrise gradient theme with theme-change awareness.
- **Hooks:** `onThemeChange` to adjust gradient colors for light/dark contexts.
- **Notes:** Shows how a theme can include minimal JS to respond to theme toggles.
- **File:** `sample-extensions/themes/sunrise.json`

## Plugins

### Word Counter
- **Purpose:** Counts words in card body and displays count on each card.
- **Hooks:** `onAppInit` for setup, `onCardRender` to inject word count badges, `onDisable` for cleanup.
- **Capabilities:** `ui`
- **File:** `sample-extensions/plugins/word-counter.json`

### Pomodoro Timer
- **Purpose:** Full pomodoro timer with floating UI, configurable intervals, and session tracking.
- **Hooks:** `onAppInit`, `onEnable`, `onDisable`, `onUninstall`.
- **Capabilities:** `ui`, `storage`
- **Notes:** Uses namespaced localStorage key (`cardspoke_pomodoro_state`). Demonstrates complex UI injection and persistent state.
- **File:** `sample-extensions/plugins/pomodoro-timer.json`

## Mods

### Auto Tagger
- **Purpose:** Automatically suggests tags based on card content keywords.
- **Hooks:** `onAppInit`, `onCardSave`, `onDisable`.
- **Capabilities:** `cards`, `tags`
- **Notes:** Maps keywords (bug, error, feature, urgent, etc.) to tag names on card save.
- **File:** `sample-extensions/mods/auto-tagger.json`

### Card Templates
- **Purpose:** Allows creating card templates with variable placeholders and instantiating them.
- **Hooks:** `onAppInit`, `onCardRender`, `onDisable`, `onUninstall`.
- **Capabilities:** `cards`, `ui`, `storage`
- **Notes:** Uses namespaced localStorage key (`cardspoke_card_templates`). Demonstrates complex mod behavior with template categories, variable filling, and per-card UI.
- **File:** `sample-extensions/mods/card-templates.json`

## Kits

### Minimal Kit
- **Purpose:** Minimalist styling kit with clean variable definitions.
- **Hooks:** None (CSS-only).
- **Notes:** Demonstrates how a Kit can ship purely cosmetic changes via CSS variables.
- **File:** `sample-extensions/kits/minimal-kit.json`

### Productivity Kit
- **Purpose:** Combines clean styling with keyboard shortcut enhancements.
- **Hooks:** `onAppInit`, `onDisable`.
- **Notes:** Adds global keyboard shortcuts (Ctrl+N, Ctrl+K, Ctrl+S, etc.) with a togglable help overlay.
- **File:** `sample-extensions/kits/productivity-kit.json`

## Expansions

### Analytics Dashboard
- **Purpose:** Shows basic card statistics with a floating analytics panel.
- **Hooks:** `onAppInit`, `onCardSave`, `onDisable`.
- **Capabilities:** `cards`, `ui`
- **Notes:** Tracks card count, word totals, tag distribution, and daily activity with bar chart visualizations.
- **File:** `sample-extensions/expansions/analytics-expansion.json`

### Export Plus
- **Purpose:** Adds additional export formats (Markdown, CSV, HTML) with enhanced export UI.
- **Hooks:** `onAppInit`, `onExport`, `onDisable`, `onUninstall`.
- **Capabilities:** `export`, `ui`, `storage`
- **Notes:** Uses namespaced localStorage key (`cardspoke_export_plus_config`). Supports configurable field inclusion and export history tracking.
- **File:** `sample-extensions/expansions/export-plus-expansion.json`

## How to reuse
1. Copy the JSON from the appropriate `sample-extensions/` subdirectory.
2. Replace creator and adjust description/version as needed.
3. Keep hook names within the allowed set and ensure `onDisable` is present for any DOM/listener work.
4. If you add storage, pick a namespaced key and clear it in `onUninstall`.
