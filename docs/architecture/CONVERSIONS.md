# Conversion Utilities

## Purpose

Conversion helpers transform cards between kinds (note → task, outline →
deck, …) so future app modes share one implementation instead of each
duplicating the logic. They are part of CardSpoke Core and DOM-free.

Module: `www/src/core/conversions.js`.

## APIs

All helpers take the store (`{ cards, rootOrder }`) as their first
argument and return `{ ok, ...ids, error? }`:

```js
convertCardKind(store, cardId, targetKind, options = {})
convertNoteToTask(store, cardId, { projectId, dueDate, priority, ops })
convertNoteToSlide(store, cardId, deckId, { layout, ops })
createDeckFromOutline(store, cardId, { theme, aspectRatio, ops })
createSlidesFromChildren(store, parentId, { layout, ops })
createProjectFromOutline(store, cardId, { priority, ops })
createReminderForCard(store, cardId, { type, dueAt, repeat, title, ops })
revertCardKind(store, cardId, { ops })   // undo a conversion by kind
```

### The `ops` option

Side effects (undo entries, save, render, middleware) belong to the shell.
Pass `options.ops = { updateCard, createCard, reparent }` to route changes
through shell mechanisms; the full shell does this in `data.js`
(`shellConversionOps()`), so conversions triggered through the action
registry create undo entries and trigger save/render via the existing
`updateCard`/`createCard`. Without `ops`, the store is mutated directly
(headless/test mode).

## Data Shapes

`convertNoteToTask(noteId, { priority: "medium" })` produces:

```js
modsData: {
  kind: "task",
  schemaVersion: 1,
  task: { status: "todo", priority: "medium", dueDate: null, completed: false },
  previousKind: "note",     // recorded for reversibility
  note: { pinned: false }   // the original payload is kept
}
```

## Examples

```js
// Outline card + children  ->  deck + ordered slides
const { deckId, slideIds } = createDeckFromOutline(store, outlineId, { theme: 'dark' });

// Reminder for a plant card (created as a child card)
createReminderForCard(store, plantId, {
  type: 'plant.water',
  dueAt: '2026-07-09T09:00:00',
  repeat: { every: 7, unit: 'days' }
});
```

## Principles

- Preserve original title/body and tags; preserve parent/child
  relationships unless the conversion explicitly changes them (e.g.
  `projectId`/`deckId` moves the card).
- Behavior changes come from `modsData.kind` — never from destructive
  rewrites of card content.
- Never delete original metadata: the previous kind payload stays in
  `modsData` and `previousKind` records what the card was, making
  `revertCardKind()` possible.
- Undo entries, save, and render happen through the shell's existing
  mechanisms via `ops`.

## Migration Expectations

Converted cards always validate as typed cards
(`validateTypedCard(card).valid === true` with no warnings) and pass the
migration layer unchanged, because conversions build payloads from the
same `KIND_DEFINITIONS` defaults.

## Backward Compatibility Rules

1. Converting a legacy (generic) card simply adds typed metadata; nothing
   else about the card changes.
2. Conversions are additive to `modsData` — plugin data and unknown fields
   survive.
3. A conversion on a missing card returns `{ ok: false, error }` and
   touches nothing.
