# Action Registry

## Purpose

The action registry generalizes CardSpoke's hardcoded card actions (edit,
bookmark, duplicate, share, add child, import TXT, delete) into shared,
discoverable definitions that any shell or app mode can list and run. Typed
cards get kind-specific actions (mark task done, log plant watering, …)
that appear only for matching cards.

Module: `www/src/core/actions.js` (DOM-free). Shell wiring:
`www/src/data.js` (`runCardAction`, `listCardActions`).

## Data Shapes

```js
{
  id: "task.markDone",          // unique id, namespaced by domain
  label: "Mark Done",
  icon: "check",
  appliesTo(card, ctx) {        // optional; defaults to always
    return getCardKind(card) === "task" && !card.modsData.task.completed;
  },
  run(card, ctx) { /* perform the action */ }
}
```

The `ctx` object is supplied by the caller (shell) and carries whatever
capabilities it grants: `store`, `updateCard`, `createCard`, conversion
workflows, `now`, etc. Core actions never reach for globals.

## APIs

```js
registerAction(action)             // -> boolean
unregisterAction(actionId)         // -> boolean
getAction(actionId)                // -> action | null
listActions()                      // -> action[]
getActionsForCard(card, ctx)       // actions whose appliesTo() passes
runAction(actionId, card, ctx)     // -> { ok, result?, error? }

registerCoreCardActions(handlers)  // maps existing card behaviors
registerTypedCardActions()         // registers typed-card actions
```

## Registered Actions

### Core card actions (mapped from existing behaviors)

`card.edit`, `card.bookmark`, `card.duplicate`, `card.share`,
`card.addChild`, `card.delete`, `card.importText`

The full shell registers these in `data.js` with handlers that call the
existing functions (`goTo('edit')`, `toggleBookmark`, `duplicateCard`,
`showShareCard`, `deleteCard`, `openUploadModalForCard`), so undo, save,
and middleware hooks keep working.

### Typed-card actions

| Action | Applies to | Status |
|--------|-----------|--------|
| `task.markDone` / `task.markTodo` | tasks | functional (updates task data) |
| `plant.logWatering` | plants | functional (stamps `lastWatered`) |
| `plant.toggleTracking` | plants | functional |
| `note.convertToTask` | notes | delegates to `ctx.convertNoteToTask` (wired to conversions) |
| `note.convertToSlide` | notes | delegates to `ctx.convertNoteToSlide` |
| `project.addTask` | projects | delegates to `ctx.addTask` |
| `deck.addSlide` | decks | delegates to `ctx.addSlide` |
| `deck.present` | decks | contract stub (returns `{ stub: true }` until a shell wires `ctx.present`) |
| `contact.addNote` | contacts | delegates to `ctx.addNote` |

## Examples

```js
// From the full shell (data.js provides the context):
runCardAction('task.markDone', cardId);      // undo/save flow included
listCardActions(cardId);                     // actions for a card's menu

// Headless / custom shell:
import { runAction } from './core/actions.js';
runAction('plant.logWatering', card, { store, now: Date.now() });
```

## Migration Expectations

Data-changing typed actions route through `ctx.updateCard` when provided
(the full shell passes its own `updateCard`, which records undo entries and
saves). Without `ctx.updateCard` they mutate `ctx.store` directly — useful
for tests and headless use.

## Backward Compatibility Rules

1. Registering actions does not change existing UI; current buttons/menus
   still call their original functions. The registry is an additional,
   shared surface over the same behaviors.
2. An `appliesTo()` that throws means "does not apply" — a broken action
   cannot break action listing.
3. `runAction` on a non-applicable or unknown action returns
   `{ ok: false, error }` instead of throwing.
4. Missing shell handlers make core card actions safe no-ops, so partial
   shells (lite/OS) can register only what they support.
