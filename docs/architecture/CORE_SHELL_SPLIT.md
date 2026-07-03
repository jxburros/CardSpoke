# Core / Shell Split

## Purpose

CardSpoke is being prepared to become the foundation for a lightweight
OS-native information suite. To get there without turning the app into a
monolith, the codebase separates a reusable **core** (pure data/object
engine) from **shells** (UIs over that engine):

```txt
CardSpoke Core      = reusable data/object engine (DOM-free)
CardSpoke Shell     = current full CardSpoke app
OS Light Shell      = future lightweight OS-native app suite
```

## Product Boundaries

| Name | What it is |
|------|------------|
| **CardSpoke** | The product family / brand for the card-based knowledge system. |
| **CardSpoke Core** | The reusable, DOM-free object engine: kernel, typed cards, queries, migrations, actions, conversions, app modes, profiles, import/export transforms. Importable in Node, tests, and any shell. |
| **CardSpoke Full Shell** | The current complete app (plugin manager, developer tools, full menus, current branding). Runs under the `full` profile. |
| **CardSpoke Lite Shell** | A simplified CardSpoke: cards, search, tags, links, bookmarks, basic import/export — no plugin manager or developer tooling. Runs under the `lite` profile. |
| **Future OS Light Shell** | The planned OS-native suite: several simple app-mode interfaces (Notes, Projects, Decks, Contacts, Plant Pal, Repository) over the same CardSpoke Core. Runs under the `os` profile. May carry its own naming/branding — the core avoids hardcoded CardSpoke branding for this reason. |

The future OS version should not be five unrelated apps; it should be
several simple interfaces over the same CardSpoke-powered information layer,
sharing storage, search, tags, links, actions, and conversions.

## Layout

```txt
www/src/
  kernel.js              Layer 0: pure card CRUD/hierarchy/tags/links engine
  core/                  CardSpoke Core (reusable, DOM-free ESM modules)
    index.js             core-only import path (re-exports everything below + kernel)
    typed-cards.js       typed-card convention on modsData
    queries.js           typed query helpers + collection evaluation
    migrations.js        idempotent store/card migration layer
    actions.js           shared action registry
    conversions.js       kind conversion helpers
    app-modes.js         app mode registry + built-in stub modes
    profiles.js          full/lite/os profiles + feature flags
    import-export.js     filterable, pure import/export transforms
    middleware.js …      plugin platform modules (pre-existing)
  state.js, metadata.js, storage.js, data.js, rendering.js, systems.js
                         the current full shell ("app layer", fused at build
                         time by vite.config.js into one shared scope)
  main.js                build entry: wires core + shell, exposes window.CardSpoke
```

> **Note:** `www/src/core.js` (a top-level file, not the `core/` folder above)
> is a legacy pre-split file kept only for the old `npm run build:cat`
> concatenation script. It is not imported by `main.js`, not part of the
> `npm run build` (Vite) pipeline, and not part of this architecture — don't
> confuse it with the `core/` folder.

## The Architectural Boundary

```txt
Core must not depend on DOM.
Core must not depend on the current CardSpoke UI.
Shells and modes may depend on DOM.
```

Concretely, core modules:

- own card CRUD, hierarchy, tags, links/backlinks, search helpers,
  typed-card helpers, queries, validation, migrations, the action registry,
  and conversion helpers;
- never touch `document`, modals, menus, toasts (except through callbacks
  the shell passes in, e.g. conversion `ops` or action `ctx`);
- avoid hardcoded CardSpoke branding and shell navigation assumptions.

Shell wiring points (the only places the shell touches the new core):

- `storage.js` runs `migrateStore()` during load.
- `data.js` registers existing card behaviors in the action registry and
  exposes `runCardAction()` / `exportCardsFiltered()`.
- `rendering.js` initializes the runtime profile and gates menu items by
  feature flags.
- `main.js` registers the built-in app modes.

## Build Targets

| Command | Output | Contents |
|---------|--------|----------|
| `npm run build` | `dist/app.js` → `www/app.js` | full app (IIFE) |
| `npm run build:core` | `dist/cardspoke-core.js` (ESM), `dist/cardspoke-core.umd.cjs` (UMD) | CardSpoke Core only |

Future shells can either import `www/src/core/index.js` directly (internal
folder split, Option B) or consume the standalone `dist/cardspoke-core.js`
artifact (Option A). Planned future outputs include `cardspoke-lite.js` and
`cardspoke-os-shell.js`.

## Testing

The core is importable and testable without launching any UI:
`tests/core-entry.test.js` exercises an end-to-end headless flow (create →
type → query → convert → migrate → export → import) through
`www/src/core/index.js`.

## Backward Compatibility Rules

- The current full app build and behavior stay unchanged (`full` profile is
  the default).
- The fused app-layer build (see `vite.config.js`) continues to work; core
  modules are imported into layer files via the `@core` alias so both the
  fused build and plain ESM (tests, dev) resolve them.
- Legacy card data needs no migration to keep working; the typed-card
  migration layer only fills defaults for cards that declare a kind.
