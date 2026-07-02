# OS Light Roadmap

## Purpose

This document records where the OS-native information suite is headed and
what the current preparation phase delivered, so future work builds on the
platform instead of around it.

## Vision

One reusable local-first CardSpoke object core powering several lightweight
app modes, presented by separate shells:

```txt
CardSpoke Core      = reusable data/object engine
CardSpoke Shell     = current full CardSpoke app
OS Light Shell      = future lightweight OS-native app suite
```

The future OS version should feel like several separate lightweight apps —
launch targets in the OS — but internally share the same storage, card
engine, search, tags, import/export, object relationships, and
reminder/tracking infrastructure:

```txt
Repository app       -> repository_page cards
Notes app            -> note cards
Projects app         -> project and task cards
Presentations app    -> deck and slide cards
Contacts app         -> contact cards
Plant Pal app        -> plant and care_log cards
Reminders            -> reminder cards
```

## What the Preparation Phase Delivered

| Capability | Where |
|------------|-------|
| Typed-card convention (11 kinds) | `www/src/core/typed-cards.js` |
| Typed query helpers + collections | `www/src/core/queries.js` |
| Idempotent migration layer | `www/src/core/migrations.js` |
| Shared action registry | `www/src/core/actions.js` |
| Conversion utilities | `www/src/core/conversions.js` |
| App mode registry + stub modes | `www/src/core/app-modes.js` |
| full/lite/os profiles + flags | `www/src/core/profiles.js` |
| Kind-filterable import/export | `www/src/core/import-export.js` |
| Core-only import path & build | `www/src/core/index.js`, `npm run build:core` |
| Mode-aware navState | `www/src/state.js`, `goTo()` in `storage.js` |
| Tests for the platform layer | `tests/typed-*.test.js`, `tests/action-registry.test.js`, `tests/conversions.test.js`, `tests/profiles.test.js`, `tests/app-modes.test.js`, `tests/core-entry.test.js` |

## Explicit Non-Goals of the Preparation Phase

Not built now (and intentionally so): full PowerPoint clone, PPTX import,
complex WYSIWYG editor, real-time collaboration, heavy calendar
integration, full contacts sync, cloud-first architecture, full
notification/reminder engine, Plant Pal tracking UI, complete project
manager UI, complete deck editor UI.

## Next Phases (future work, in rough order)

1. **Lite shell**: a real `lite` UI entry (`dist/cardspoke-lite.js`) using
   the profile system — the current app already hides nonessential menus
   under `?profile=lite`.
2. **Mode renderers**: implement `renderList`/`renderDetail` for the stub
   modes, starting with `notes` and `projects`, reusing current views.
3. **Reminder engine**: a scheduler over `findDueReminders()` with
   OS-notification hooks (the query and data model already exist).
4. **OS shell**: launch-target-specific views per app mode
   (`dist/cardspoke-os-shell.js`), with its own naming/branding — the core
   deliberately avoids hardcoded CardSpoke branding.
5. **Deck presentation**: wire `deck.present` (contract already registered)
   to a minimal slide renderer.

## Compatibility Commitments

- Legacy card data keeps working forever; typed cards are additive.
- Unknown/future kinds always survive validation, migration, and
  import/export.
- The `full` profile always behaves like the pre-preparation app.
