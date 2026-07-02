# Typed Cards

## Purpose

Typed cards give CardSpoke a formal way to store application-specific
metadata on ordinary cards, so multiple lightweight app modes (notes,
projects, decks, contacts, plants, reminders, …) can share one object
system. The convention lives entirely inside the existing `card.modsData`
field — no new storage engine, no breaking change to the card shape.

Module: `www/src/core/typed-cards.js` (DOM-free, importable in Node/tests).

## Data Shape

A card may optionally declare an application kind:

```js
{
  id: "abc123",
  title: "Example",
  body: "Example body",
  parentId: null,
  children: [],
  tags: [],
  createdAt: 1760000000000,
  updatedAt: 1760000000000,
  isRichText: false,
  modsData: {
    kind: "note",          // the application kind
    schemaVersion: 1,      // kind payload schema version
    note: { pinned: false } // payload, keyed by the kind's payload key
  }
}
```

### Supported kinds

| Kind              | Payload key      | Default payload fields |
|-------------------|------------------|------------------------|
| `note`            | `note`           | `pinned` |
| `repository_page` | `repositoryPage` | `section`, `source`, `status` |
| `project`         | `project`        | `status`, `priority`, `dueDate` |
| `task`            | `task`           | `status`, `priority`, `dueDate`, `completed` |
| `deck`            | `deck`           | `theme`, `aspectRatio` |
| `slide`           | `slide`          | `layout`, `speakerNotes`, `order` |
| `contact`         | `contact`        | `displayName`, `email`, `phone`, `organization`, `relationship`, `trackingEnabled` |
| `plant`           | `plant`          | `species`, `location`, `trackingEnabled`, `wateringIntervalDays`, `lastWatered`, `lastFertilized` |
| `care_log`        | `careLog`        | `targetCardId`, `careType`, `performedAt`, `notes` |
| `reminder`        | `reminder`       | `targetCardId`, `type`, `dueAt`, `repeat`, `status` |
| `collection`      | `collection`     | `filter`, `sort` |

These kinds have schema definitions, validation, and query support; full
UI support arrives per app mode later.

## APIs

```js
import {
  getCardKind, isCardKind, setCardKind,
  getKindData, updateKindData,
  validateTypedCard, migrateTypedCard,
  listCardsByKind, listChildrenByKind,
  createTypedModsData, CARD_KINDS, KIND_DEFINITIONS
} from './core/typed-cards.js';

getCardKind(card)                 // "note" | ... | "generic" for legacy cards
isCardKind(card, 'task')          // boolean
setCardKind(card, 'task', { priority: 'high' })  // assigns kind + defaults
getKindData(card, 'task')         // the payload object or null
updateKindData(card, 'task', { completed: true })
validateTypedCard(card)           // { valid, kind, known, warnings }
listCardsByKind(store, 'task')    // all task cards
listChildrenByKind(store, deckId, 'slide')  // direct children only
```

## Examples

```js
// Create a typed reminder block for a new card
card.modsData = createTypedModsData('reminder', {
  targetCardId: 'plant_card_id',
  type: 'plant.water',
  dueAt: '2026-07-09T09:00:00',
  repeat: { every: 7, unit: 'days' }
});

// Legacy card — still fully valid
const legacy = { id: 'x', title: 'Old', body: '', modsData: {} };
getCardKind(legacy); // "generic"
```

## Migration Expectations

- `migrateTypedCard(card)` (via `www/src/core/migrations.js`) fills missing
  default payload fields and bumps `schemaVersion` — it never overwrites
  existing values or deletes unknown fields.
- Malformed payloads (e.g. `note: "oops"`) are replaced with defaults, but
  the original value is preserved under `modsData.<key>__invalid`.
- Failed migrations leave the card readable and log warnings.
- Schema changes must be documented here and given a
  `registerKindMigration(kind, fromVersion, fn)` step.

## Backward Compatibility Rules

1. Cards without `modsData.kind` remain valid legacy CardSpoke cards and
   report the `generic` kind.
2. Unknown/future kinds are preserved untouched (validation warns, never
   strips).
3. Validation never mutates a card; it reports warnings and lets callers
   decide.
4. `modsData` must survive save/load/import/export in full (see
   `tests/typed-import-export.test.js`).
5. Plugin data already stored in `modsData` is preserved when a kind is
   assigned.
