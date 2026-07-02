# Implementation Directive: Prepare CardSpoke for a Lightweight OS-Native Information Suite

> **Status note:** The goals described in this directive have been
> substantially implemented. See
> [`docs/architecture/OS_LIGHT_ROADMAP.md`](./docs/architecture/OS_LIGHT_ROADMAP.md)
> for the up-to-date "what was delivered" counterpart to this directive.

## 1. Purpose

This directive explains how to prepare the existing **CardSpoke** application so it can become the foundation for a future lightweight OS-native information suite.

The future OS version may include multiple lightweight app modes powered by the same underlying CardSpoke data model:

- Information repository
- Notes app
- Project manager / to-do list
- PowerPoint-lite presentation mode
- Contacts app
- Plant Pal / plant tracking app
- Reminder and tracking system

The immediate goal is **not** to build all of those apps now.

The immediate goal is to refactor and extend CardSpoke so it becomes a clean, reusable platform with:

- A stable object/card schema
- A reusable core engine
- A lighter shell option
- Typed cards
- App modes
- Shared actions
- Shared conversion utilities
- Test coverage for future app modes

CardSpoke should move toward this structure:

```txt
CardSpoke Core      = reusable data/object engine
CardSpoke Shell     = current full CardSpoke app
OS Light Shell      = future lightweight OS-native app suite
```

---

## 2. Existing CardSpoke Context

Assume CardSpoke is currently a lightweight, local-first, card-based knowledge system with an extensible plugin architecture.

Known existing capabilities include:

- Hierarchical cards
- Card create/read/update/delete workflows
- Card duplication
- Drag and drop organization
- Bookmarks
- Recent cards
- Card links / backlinks
- Tags
- Search
- Rich-text or markdown-style formatting
- Undo / redo
- Trash recovery
- Import/export
- Local-first storage using browser storage layers
- Plugin architecture with theme, feature, and app layers

The current persisted card shape is approximately:

```js
{
  id: string,
  title: string,
  body: string,
  parentId: string | null,
  children: string[],
  tags: string[],
  createdAt: number,
  updatedAt: number,
  isRichText?: boolean,
  modsData?: object
}
```

The most important field for future app-specific behavior is:

```js
modsData
```

This field should become the formal home for typed-card metadata.

---

## 3. Strategic Direction

Do not turn CardSpoke into a bloated monolithic app.

Instead, prepare CardSpoke to become a reusable **local-first object system** where the same underlying card data can power multiple lightweight app modes.

The future OS version should feel like several separate lightweight apps, but internally they should share the same CardSpoke object system.

Example future mapping:

```txt
Repository app       -> repository_page cards
Notes app            -> note cards
Projects app         -> project and task cards
Presentations app    -> deck and slide cards
Contacts app         -> contact cards
Plant Pal app        -> plant and care_log cards
Reminders            -> reminder cards
```

The user-facing apps may appear as separate launch targets in the OS, but internally they should share:

- The same storage
- The same card engine
- The same search
- The same tags
- The same import/export system
- The same object relationships
- The same reminder/tracking infrastructure

---

## 4. Primary Implementation Goals

Prepare CardSpoke for the OS version by implementing the following foundational changes:

1. Formalize typed cards.
2. Separate reusable core logic from the current UI shell.
3. Add a mode registry.
4. Add a profile system for `full`, `lite`, and future `os` shells.
5. Add typed-card query helpers.
6. Add a shared action registry.
7. Add conversion utilities.
8. Make import/export filterable by object kind.
9. Add schema and migration safeguards.
10. Add or prepare a core-only build target.
11. Expand tests around the reusable core.

---

## 5. Non-Goals

Do **not** build the full OS app suite yet.

Do **not** build these features during this preparation phase unless explicitly requested later:

- Full PowerPoint clone
- PPTX import
- Complex WYSIWYG editor
- Real-time collaboration
- Heavy calendar integration
- Full contacts sync
- Cloud-first architecture
- Full notification/reminder engine
- Plant Pal tracking UI
- Complete project manager UI
- Complete deck editor UI

This phase is about preparing CardSpoke to support those features later.

---

# Part I: Data Model Preparation

## 6. Typed Card Convention

Add a formal typed-card convention using `card.modsData`.

Current CardSpoke cards must remain backward compatible.

A card may optionally declare an application kind:

```js
card.modsData = {
  kind: "note",
  schemaVersion: 1,
  data: {}
};
```

Preferred shape:

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
    kind: "note",
    schemaVersion: 1,
    note: {}
  }
}
```

Supported initial card kinds should include:

```txt
note
repository_page
project
task
deck
slide
contact
plant
care_log
reminder
collection
```

These kinds do not all need full UI support immediately. They only need schema definitions, validation, and query support.

---

## 7. Typed Card Examples

### 7.1 Note Card

```js
{
  title: "Meeting notes",
  body: "Discussed OS app modes.",
  tags: ["notes", "planning"],
  modsData: {
    kind: "note",
    schemaVersion: 1,
    note: {
      pinned: false
    }
  }
}
```

### 7.2 Repository Page Card

```js
{
  title: "Display Settings",
  body: "Explains display-related OS settings.",
  tags: ["repository", "settings"],
  modsData: {
    kind: "repository_page",
    schemaVersion: 1,
    repositoryPage: {
      section: "Settings",
      source: "system",
      status: "published"
    }
  }
}
```

### 7.3 Project Card

```js
{
  title: "Build OS Knowledge Suite",
  body: "Parent project for the OS information suite.",
  tags: ["project"],
  modsData: {
    kind: "project",
    schemaVersion: 1,
    project: {
      status: "active",
      priority: "high",
      dueDate: null
    }
  }
}
```

### 7.4 Task Card

```js
{
  title: "Create typed-card schema",
  body: "Define metadata conventions for future app modes.",
  parentId: "project_card_id",
  tags: ["task"],
  modsData: {
    kind: "task",
    schemaVersion: 1,
    task: {
      status: "todo",
      priority: "medium",
      dueDate: null,
      completed: false
    }
  }
}
```

### 7.5 Deck Card

```js
{
  title: "Intro to the OS",
  body: "Presentation overview.",
  tags: ["deck"],
  modsData: {
    kind: "deck",
    schemaVersion: 1,
    deck: {
      theme: "default",
      aspectRatio: "16:9"
    }
  }
}
```

### 7.6 Slide Card

```js
{
  title: "Welcome",
  body: "- Lightweight\n- Local-first\n- Extensible",
  parentId: "deck_card_id",
  tags: ["slide"],
  modsData: {
    kind: "slide",
    schemaVersion: 1,
    slide: {
      layout: "title-bullets",
      speakerNotes: "",
      order: 1
    }
  }
}
```

### 7.7 Plant Card

```js
{
  title: "Monstera Deliciosa",
  body: "Living room plant. Bright indirect light.",
  tags: ["plant", "indoor"],
  modsData: {
    kind: "plant",
    schemaVersion: 1,
    plant: {
      species: "Monstera deliciosa",
      location: "Living room",
      trackingEnabled: false,
      wateringIntervalDays: null,
      lastWatered: null,
      lastFertilized: null
    }
  }
}
```

### 7.8 Contact Card

```js
{
  title: "Jane Smith",
  body: "Met through plant swap group.",
  tags: ["contact"],
  modsData: {
    kind: "contact",
    schemaVersion: 1,
    contact: {
      displayName: "Jane Smith",
      email: "",
      phone: "",
      organization: "",
      relationship: "plant-swap",
      trackingEnabled: false
    }
  }
}
```

### 7.9 Reminder Card

```js
{
  title: "Water Monstera",
  body: "",
  parentId: "plant_card_id",
  tags: ["reminder"],
  modsData: {
    kind: "reminder",
    schemaVersion: 1,
    reminder: {
      targetCardId: "plant_card_id",
      type: "plant.water",
      dueAt: "2026-07-09T09:00:00",
      repeat: {
        every: 7,
        unit: "days"
      },
      status: "scheduled"
    }
  }
}
```

---

## 8. Typed Card Helper API

Create a typed-card utility module.

Suggested file:

```txt
www/src/core/typed-cards.js
```

If the project is not ready for that folder structure yet, use:

```txt
www/src/typed-cards.js
```

Required helpers:

```js
function getCardKind(card) {}
function isCardKind(card, kind) {}
function setCardKind(card, kind, payload = {}) {}
function getKindData(card, kind) {}
function updateKindData(card, kind, updates) {}
function validateTypedCard(card) {}
function migrateTypedCard(card) {}
function listCardsByKind(store, kind) {}
function listChildrenByKind(store, parentId, kind) {}
```

Expected behavior:

- Cards without `modsData.kind` remain valid legacy CardSpoke cards.
- `getCardKind(card)` should return `"card"` or `"generic"` for legacy cards.
- Validation should never destroy unknown metadata.
- Unknown future kinds should be preserved.
- Invalid typed metadata should produce warnings and safe fallbacks, not data loss.

---

# Part II: Core / Shell Separation

## 9. Architectural Target

Move CardSpoke toward this structure:

```txt
cardspoke/
  www/
    src/
      core/
        kernel.js
        schema.js
        typed-cards.js
        actions.js
        conversions.js
        queries.js
        search.js
        import-export.js
        storage-contract.js

      shell/
        full/
          renderers
          menus
          current CardSpoke UI

        lite/
          lightweight CardSpoke UI

      modes/
        repository/
        notes/
        projects/
        decks/
        contacts/
        plants/

      state.js
      storage.js
      rendering.js
      systems.js
```

Do not force this exact structure if it conflicts with the current build. However, move the codebase toward this separation.

The important architectural boundary is:

```txt
Core should not depend on DOM.
Core should not depend on the current CardSpoke UI.
Shells and modes may depend on DOM.
```

---

## 10. Reusable Core Responsibilities

The reusable core should own:

- Card CRUD
- Parent/child hierarchy
- Tags
- Links and backlinks
- Search helpers
- Typed-card helpers
- Query helpers
- Storage contracts
- Import/export transforms
- Validation
- Migrations
- Action registry
- Conversion helpers

The reusable core should avoid:

- Direct DOM rendering
- Modal UI
- Menu UI
- Toast UI, except through abstracted callbacks
- Hardcoded CardSpoke branding
- Current shell navigation assumptions

---

## 11. Existing Kernel Direction

CardSpoke should preserve and expand its pure data/kernel direction.

The future OS version should reuse browser-independent card logic instead of depending on the full current CardSpoke UI.

The kernel should remain suitable for use in tests, future shells, and non-DOM contexts.

---

# Part III: App Modes

## 12. Add an App Mode Registry

Introduce an internal app mode registry.

Purpose:

Allow CardSpoke to support multiple views over the same card data.

Initial mode IDs:

```txt
cardspoke
repository
notes
projects
decks
contacts
plants
```

Suggested API:

```js
registerAppMode({
  id: "notes",
  title: "Notes",
  icon: "note",
  accepts(card) {
    return getCardKind(card) === "note";
  },
  renderList(ctx) {},
  renderDetail(ctx, cardId) {},
  renderEditor(ctx, cardId) {},
  getActions(card) {
    return [];
  }
});
```

Required registry helpers:

```js
registerAppMode(mode)
unregisterAppMode(modeId)
getAppMode(modeId)
listAppModes()
getModesForCard(card)
setActiveMode(modeId)
getActiveMode()
```

---

## 13. Mode/Page Navigation Shape

The current renderer is page-based around pages such as `read`, `list`, `search`, and `edit`.

Keep existing behavior working, but prepare navigation to support mode-aware routes.

Suggested navigation state:

```js
navState = {
  mode: "cardspoke",
  page: "list",
  cardId: null,
  parentId: null,
  searchQuery: ""
};
```

Backward compatibility:

- If `navState.mode` is missing, default to `"cardspoke"`.
- Existing pages should continue to work.

---

## 14. Initial Mode Behavior

Do not build all full modes yet.

Implement only basic mode definitions and stub renderers.

### `cardspoke`

Current full CardSpoke behavior.

### `repository`

Future mode for information repository pages.

Initial behavior:

- Filter cards where `kind === "repository_page"`.
- Render using current card list/detail views if no custom renderer exists.

### `notes`

Future mode for notes.

Initial behavior:

- Filter cards where `kind === "note"`.
- Render using simplified card list/detail.

### `projects`

Future mode for projects and tasks.

Initial behavior:

- Filter cards where `kind === "project"` or `kind === "task"`.

### `decks`

Future mode for decks and slides.

Initial behavior:

- Filter cards where `kind === "deck"` or `kind === "slide"`.

### `contacts`

Future mode for contacts.

Initial behavior:

- Filter cards where `kind === "contact"`.

### `plants`

Future mode for Plant Pal.

Initial behavior:

- Filter cards where `kind === "plant"` or `kind === "care_log"`.

---

# Part IV: Profiles

## 15. Add Runtime Profiles

Add a profile system so CardSpoke can run in different levels of UI complexity.

Initial profiles:

```txt
full
lite
os
```

Suggested config:

```js
const CARD_SPOKE_PROFILE = "full";
```

Or runtime setting:

```js
window.CardSpokeProfile = "lite";
```

Or URL/debug override:

```txt
?profile=lite
?profile=os
```

---

## 16. Profile Meanings

### `full`

Current complete CardSpoke app.

Includes:

- Plugin Manager
- Developer tools
- Full menu
- Advanced features
- Full import/export
- Current branding

### `lite`

Simplified CardSpoke.

Includes:

- Cards
- Search
- Tags
- Links
- Bookmarks
- Recent cards
- Basic import/export
- Theme/accessibility
- Local-first storage

Hides or minimizes:

- Plugin Manager
- Developer console
- Advanced plugin features
- Heavy debug UI
- Nonessential menus

### `os`

Future OS-native shell.

Includes:

- App modes
- Shared object database
- Lightweight OS-native UI
- Launch-target-specific views

This profile can be stubbed now.

---

## 17. Feature Flags

Add a central feature flag map.

Example:

```js
const FEATURE_FLAGS = {
  pluginManager: true,
  developerConsole: true,
  advancedSearch: true,
  dataHub: true,
  typedCards: true,
  appModes: true,
  actionRegistry: true,
  conversionHelpers: true
};
```

Profiles should resolve to feature flag sets.

Example:

```js
const PROFILE_FEATURES = {
  full: {
    pluginManager: true,
    developerConsole: true,
    advancedSearch: true
  },
  lite: {
    pluginManager: false,
    developerConsole: false,
    advancedSearch: true
  },
  os: {
    pluginManager: false,
    developerConsole: false,
    advancedSearch: true,
    appModes: true
  }
};
```

---

# Part V: Actions

## 18. Add a Shared Action Registry

The current CardSpoke UI has hardcoded card actions such as edit, bookmark, duplicate, share, add child, import TXT, and delete.

Generalize this into an action registry.

Suggested API:

```js
registerAction({
  id: "task.markDone",
  label: "Mark Done",
  icon: "check",
  appliesTo(card, ctx) {
    return getCardKind(card) === "task" && !card.modsData.task.completed;
  },
  run(card, ctx) {
    // update task
  }
});
```

Required helpers:

```js
registerAction(action)
unregisterAction(actionId)
getAction(actionId)
listActions()
getActionsForCard(card, ctx)
runAction(actionId, card, ctx)
```

---

## 19. Initial Core Actions

Implement or map these existing behaviors into the action registry:

```txt
card.edit
card.bookmark
card.duplicate
card.share
card.addChild
card.delete
card.importText
```

Then add typed-card actions:

```txt
note.convertToTask
note.convertToSlide
task.markDone
task.markTodo
project.addTask
deck.addSlide
deck.present
plant.logWatering
plant.toggleTracking
contact.addNote
```

The typed-card actions can be stubs at first, but their contracts should exist.

---

# Part VI: Conversion Helpers

## 20. Add Conversion Utilities

Create conversion helpers so future app modes can transform objects without duplicating logic.

Suggested file:

```txt
www/src/core/conversions.js
```

Required conversions:

```js
convertCardKind(cardId, targetKind, options = {})
convertNoteToTask(cardId, options = {})
convertNoteToSlide(cardId, deckId, options = {})
createDeckFromOutline(cardId, options = {})
createSlidesFromChildren(parentId, options = {})
createProjectFromOutline(cardId, options = {})
createReminderForCard(cardId, reminderData)
```

---

## 21. Conversion Principles

Conversions should:

- Preserve original title/body where possible.
- Preserve tags where appropriate.
- Preserve parent/child relationships unless the conversion explicitly changes them.
- Use `modsData.kind` to change behavior.
- Avoid deleting original metadata unless requested.
- Be reversible when practical.
- Create undo entries.
- Trigger save/render through existing app mechanisms.

Example:

```js
convertNoteToTask(noteId, {
  projectId: "project_card_id",
  dueDate: null,
  priority: "medium"
});
```

Should produce:

```js
modsData: {
  kind: "task",
  schemaVersion: 1,
  task: {
    status: "todo",
    priority: "medium",
    dueDate: null,
    completed: false
  }
}
```

---

# Part VII: Query and Collection Helpers

## 22. Add Typed Query Helpers

Create reusable query helpers for object kinds.

Suggested API:

```js
listCardsByKind(store, "task")
listRootCardsByKind(store, "project")
listChildrenByKind(store, parentId, "slide")
findCardsByKindAndTag(store, "plant", "indoor")
findDueReminders(store, now)
findTasksDueToday(store, now)
findPlantsWithTrackingEnabled(store)
```

These helpers should work with the existing in-memory `store.cards`.

No new database engine is required yet.

---

## 23. Add Collection Cards

Add a `collection` card kind.

A collection is a saved filter over cards.

Example:

```js
{
  title: "Plants Needing Water",
  modsData: {
    kind: "collection",
    schemaVersion: 1,
    collection: {
      filter: {
        kind: "plant",
        trackingEnabled: true,
        dueCareType: "water"
      },
      sort: "nextDueDate"
    }
  }
}
```

Initial collection support can be limited to:

- Store collection metadata.
- Validate collection cards.
- Evaluate simple filters by kind, tag, and status.

---

# Part VIII: Import / Export Preparation

## 24. Make Export Filterable by Kind

Extend export helpers so they can export subsets of cards by kind.

Suggested API:

```js
exportCards({
  format: "json",
  kind: "task"
});

exportCards({
  format: "markdown",
  rootId: "project_card_id",
  includeChildren: true
});

exportCards({
  format: "json",
  kinds: ["plant", "care_log", "reminder"]
});
```

Initial supported formats:

```txt
json
markdown
txt
csv
html
```

PPTX export should not be implemented in this preparation phase.

---

## 25. Import Typed Cards

Extend import validation to recognize typed cards.

Requirements:

- Preserve `modsData`.
- Validate known kinds.
- Preserve unknown kinds safely.
- Warn on invalid typed-card metadata.
- Do not silently strip future app data.
- Include migration hooks for old typed-card schema versions.

---

# Part IX: Storage and Migration

## 26. Storage Requirements

For this preparation phase:

- Do not replace the storage system.
- Add typed-card validation during load.
- Add migration hooks for typed cards.
- Add query helpers over the existing store.
- Ensure `modsData` survives save/load/import/export.

---

## 27. Migration Rules

Add a typed-card migration layer.

Suggested API:

```js
migrateStore(store)
migrateCard(card)
migrateTypedCard(card)
migrateKindData(kind, data, fromVersion, toVersion)
```

Rules:

- Migrations must be idempotent.
- Unknown card kinds must be preserved.
- Unknown metadata fields must be preserved.
- Failed migrations should not delete data.
- Failed migrations should leave cards readable.
- Schema changes must be documented.

---

# Part X: Build Preparation

## 28. Add or Prepare a Core-Only Build Target

The current full app build can remain in place, but the future OS shell needs a cleaner path to reuse the core.

Add or prepare one of these:

```txt
Option A: cardspoke-core.js build output
Option B: internal core folder imported by both shells
Option C: package-style split between core and shell
```

Ideal future outputs:

```txt
dist/cardspoke-core.js
dist/cardspoke-full-app.js
dist/cardspoke-lite.js
dist/cardspoke-os-shell.js
```

Immediate requirement:

- The core logic should become importable/testable without launching the full UI.

---

# Part XI: Testing

## 29. Expand Test Coverage

Add tests for the reusable platform layer.

Required test areas:

```txt
Card CRUD
Parent/child integrity
Typed-card validation
Typed-card migration
Search/query by kind
Search/query by tag
Import/export round trip
modsData preservation
Action registry
Conversion helpers
Profile feature flags
Mode registry
Core-only functions without DOM dependency
```

---

## 30. Minimum Test Cases

### Typed Card Validation

- Legacy card without `modsData.kind` remains valid.
- Known typed card validates.
- Unknown kind is preserved.
- Invalid kind payload produces warning, not data loss.

### Query Helpers

- `listCardsByKind(store, "task")` returns only task cards.
- `listChildrenByKind(store, deckId, "slide")` returns only slide children.
- Unknown kind returns empty list.

### Conversion Helpers

- Note converts to task.
- Note converts to slide.
- Outline converts to deck.
- Conversion preserves title/body/tags.
- Conversion creates valid `modsData`.

### Action Registry

- Registers action.
- Lists action.
- Filters action by card kind.
- Runs action.
- Unregisters action.

### Profiles

- `full` enables plugin manager.
- `lite` hides plugin manager.
- `os` enables app modes.
- Missing profile falls back safely.

### Import/Export

- Export by kind includes correct cards.
- JSON round trip preserves `modsData`.
- Unknown future `modsData` survives import/export.

---

# Part XII: Documentation

## 31. Add Developer Documentation

Create documentation for:

```txt
docs/architecture/CORE_SHELL_SPLIT.md
docs/architecture/TYPED_CARDS.md
docs/architecture/APP_MODES.md
docs/architecture/ACTION_REGISTRY.md
docs/architecture/CONVERSIONS.md
docs/architecture/PROFILES.md
docs/architecture/OS_LIGHT_ROADMAP.md
```

Each document should explain:

- Purpose
- Data shapes
- APIs
- Examples
- Migration expectations
- Backward compatibility rules

---

## 32. Clarify Product Boundaries

Document the difference between:

```txt
CardSpoke
CardSpoke Core
CardSpoke Full Shell
CardSpoke Lite Shell
Future OS Light Shell
```

Make sure the future OS version has a clear naming and branding boundary.

---

# Part XIII: Suggested Implementation Order

## 33. Phase 1 - Typed Card Foundation

Implement:

```txt
typed-cards.js
getCardKind()
setCardKind()
validateTypedCard()
listCardsByKind()
listChildrenByKind()
basic typed-card tests
docs/architecture/TYPED_CARDS.md
```

Acceptance criteria:

- Legacy cards still work.
- New typed cards can be created.
- `modsData` survives save/load/export/import.
- Tests pass.

---

## 34. Phase 2 - Query and Migration Layer

Implement:

```txt
queries.js
migrations.js
migrateStore()
migrateTypedCard()
findCardsByKindAndTag()
collection card validation
tests for migration/query behavior
```

Acceptance criteria:

- Store migration is idempotent.
- Unknown kinds are preserved.
- Query helpers work on current store.
- Collection cards can store and evaluate simple filters.

---

## 35. Phase 3 - Profile System

Implement:

```txt
profiles.js
feature flag map
profile resolution
full/lite/os profiles
menu hiding based on profile
tests for profile behavior
```

Acceptance criteria:

- Full profile behaves like current app.
- Lite profile hides nonessential full-app features.
- OS profile can be selected without breaking the app.
- Missing/invalid profile falls back safely.

---

## 36. Phase 4 - App Mode Registry

Implement:

```txt
app-modes.js
registerAppMode()
listAppModes()
setActiveMode()
mode-aware navState
stub modes
tests for registry
```

Acceptance criteria:

- Existing CardSpoke rendering still works.
- Mode registry can register modes.
- Active mode can change.
- Stub modes can filter cards by kind.
- Existing routes remain backward compatible.

---

## 37. Phase 5 - Action Registry

Implement:

```txt
actions.js
registerAction()
getActionsForCard()
runAction()
map existing card actions
add typed-card action stubs
tests for actions
```

Acceptance criteria:

- Existing hardcoded card actions can be represented as registered actions.
- Typed-card actions appear only for matching card kinds.
- Running an action can update cards safely.
- Tests pass.

---

## 38. Phase 6 - Conversion Helpers

Implement:

```txt
conversions.js
convertCardKind()
convertNoteToTask()
convertNoteToSlide()
createDeckFromOutline()
createSlidesFromChildren()
createReminderForCard()
tests for conversions
```

Acceptance criteria:

- Conversions preserve title/body/tags where appropriate.
- Converted cards validate as typed cards.
- Undo/save/render behavior remains coherent.
- Tests pass.

---

## 39. Phase 7 - Import/Export Improvements

Implement:

```txt
filterable export helpers
typed-card import validation
kind-specific export options
JSON round-trip tests
Markdown export by root/kind
CSV export by kind
```

Acceptance criteria:

- Export by kind works.
- Import preserves typed metadata.
- Unknown future metadata is not stripped.
- Tests pass.

---

## 40. Phase 8 - Core-Only Build Preparation

Implement or prepare:

```txt
core-only import path
core-only test entry
optional dist/cardspoke-core.js
documentation for future shell reuse
```

Acceptance criteria:

- Core can be tested without DOM-heavy UI.
- Future OS shell can reuse typed-card/query/action/conversion logic.
- Existing full app build still works.

---

# Part XIV: Acceptance Criteria for the Entire Preparation Project

The preparation project is complete when:

1. CardSpoke still works as the current full app.
2. Legacy card data remains compatible.
3. Typed cards are formally supported.
4. `modsData.kind` can identify notes, tasks, projects, decks, slides, contacts, plants, reminders, and collections.
5. Query helpers can list/filter cards by kind.
6. Profiles can switch between `full`, `lite`, and stub `os`.
7. An app mode registry exists.
8. A shared action registry exists.
9. Conversion helpers exist for note/task/slide/deck/reminder workflows.
10. Import/export preserves typed metadata.
11. Store migration is idempotent and safe.
12. Tests cover typed cards, queries, actions, conversions, profiles, and migrations.
13. Developer documentation explains the new architecture.
14. The reusable core is easier to import/test independently of the current full UI.

---

# Part XV: Final Guidance

Do not turn CardSpoke into the entire OS suite yet.

Prepare CardSpoke so that the OS suite can be built cleanly later.

The desired direction is:

```txt
One reusable local-first CardSpoke object core.
Multiple lightweight app modes.
Separate full and lightweight shells.
Shared search, storage, tags, links, actions, and conversions.
```

The future OS version should not be five unrelated apps.

It should be several simple interfaces over the same CardSpoke-powered information layer.
