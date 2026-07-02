# App Modes

## Purpose

App modes let CardSpoke present multiple lightweight "apps" (Notes,
Projects, Decks, Contacts, Plant Pal, Repository) over the same card data.
A mode is a view definition: which cards it accepts, and (eventually) how
to render its list/detail/editor. The registry is part of CardSpoke Core
and is DOM-free; renderers are supplied by shells.

Module: `www/src/core/app-modes.js`.

## Data Shapes

A mode definition:

```js
{
  id: "notes",              // unique mode id
  title: "Notes",
  icon: "note",
  accepts(card) {           // which cards belong to this mode
    return getCardKind(card) === "note";
  },
  renderList(ctx) {},       // optional; stubs until a shell implements them
  renderDetail(ctx, cardId) {},
  renderEditor(ctx, cardId) {},
  getActions(card) { return []; }
}
```

Mode-aware navigation state (see `www/src/state.js`):

```js
navState = {
  mode: "cardspoke",   // missing mode defaults to "cardspoke"
  page: "list",
  cardId: null,
  parentId: null,
  searchQuery: ""
};
```

## APIs

```js
registerAppMode(mode)        // -> boolean
unregisterAppMode(modeId)    // default mode cannot be removed
getAppMode(modeId)           // -> mode | null
listAppModes()               // -> mode[]
getModesForCard(card)        // modes whose accepts(card) is true
setActiveMode(modeId)        // unknown ids fall back to "cardspoke"
getActiveMode()              // -> mode
getActiveModeId()            // -> string
filterCardsForMode(store, modeId)  // cards the mode accepts
registerBuiltInModes()       // registers the stub modes below
```

## Built-in Modes (initial stubs)

| Mode | Accepts kinds | Behavior today |
|------|---------------|----------------|
| `cardspoke` | all cards | current full CardSpoke behavior (default) |
| `repository` | `repository_page` | filter only; renders via current views |
| `notes` | `note` | filter only |
| `projects` | `project`, `task` | filter only |
| `decks` | `deck`, `slide` | filter only |
| `contacts` | `contact` | filter only |
| `plants` | `plant`, `care_log` | filter only |

`main.js` calls `registerBuiltInModes()` at startup. Modes without custom
renderers fall back to the current card list/detail views.

## Examples

```js
import { setActiveMode, filterCardsForMode } from './core/app-modes.js';

setActiveMode('plants');
const plantCards = filterCardsForMode(store, 'plants');
```

## Migration Expectations

- Existing `navState` objects without a `mode` field are treated as
  `mode: "cardspoke"` (applied in `goTo()` and the state default).
- Persisted navigation state from older versions loads unchanged.

## Backward Compatibility Rules

1. Existing pages (`read`, `list`, `search`, `edit`) and routes keep
   working; the mode field is additive.
2. The `cardspoke` mode accepts every card and cannot be unregistered.
3. Unregistering the active mode falls back to `cardspoke`.
4. A mode whose `accepts()` throws is treated as not accepting — it can
   never break rendering of other modes.
