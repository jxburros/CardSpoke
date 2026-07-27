# Test Guide

CardSpoke uses `uvu` for automated tests. This guide covers the public app test scope.

## Commands

Run all tests:

```bash
npm test
```

Watch mode:

```bash
npm run test:watch
```

Release gates (also enforced by CI before any deploy):

```bash
npm run smoke        # static release checks (scripts/static-smoke.mjs)
npm run qa:browser   # Playwright end-to-end release QA (scripts/browser-qa.mjs)
```

## Test Scope

Tests should cover the main CardSpoke app and the plugin runtime.

Keep tests for:

- Card CRUD
- Hierarchy integrity
- Search and navigation
- Tags and tag management
- Card links, backlinks, and related cards
- Bookmarks and recent cards
- Undo/redo
- Trash recovery
- Import/export
- Local storage behavior
- UI state and regressions
- Plugin validation
- Plugin lifecycle
- Plugin permissions
- Sample plugins

Do not keep tests whose only purpose is to validate extracted or deferred systems, including:

- OS-specific shells
- App modes
- Runtime profiles
- Typed-card domain systems
- Core-only build entry points
- Kind-filterable platform import/export
- Cloud storage drivers

## Writing Tests

- Prefer small, deterministic tests with clear assertions.
- Add regression tests for every bug fix that changes card state, schema behavior, storage behavior, or plugin/runtime APIs.
- For plugin-specific tests, include metadata samples and compatibility toggles.
- When testing plugins, validate manifest correctness, permission handling, and resource cleanup.
- Cover dataset import/export formats and backup restoration to ensure regression-safe portability.

## Coverage Expectations

- Core app logic: happy path + error handling.
- Schema changes: migration success and failure handling.
- Plugins: enable/disable flows, layer validation, permission behavior, and schema guardrails.
- Storage: local-first behavior and import/export reliability.

## Reporting

Document failing tests with repro steps and environment info, including Node version, active plugins, schemaVersion, and platform when relevant.

## Deferred Areas

Desktop and mobile packaging tests may be added as those targets mature, but the first public version should not imply production-ready mobile hardening until that work is complete.
