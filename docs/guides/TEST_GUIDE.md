# Test Guide

CardSpoke uses `uvu` for automated tests. This guide covers how to run and write tests for core features and mods.

## Commands
- Run all tests:
  ```bash
  npm test
  ```
- Watch mode:
  ```bash
  npm run test:watch
  ```

## Test Locations
- `tests/` – Primary uvu suites.
- `sample-extensions.test.js` – Mod package format and layer system checks.

## Writing Tests
- Prefer small, deterministic tests with clear assertions.
- Include fixture data for schema migrations and mod compatibility.
- When testing plugins, validate manifest correctness, permission handling, and resource cleanup. Exercise Plugin API registration, event emissions, and middleware pipeline to ensure API stability.
- For UI-affecting plugins, capture DOM/state expectations and accessibility behaviors where possible.
- Cover dataset import/export formats (JSON/CSV/Markdown/TXT) and backup restoration to ensure regression-safe portability.

## Coverage Expectations
- Core logic: happy path + error handling.
- Schema changes: migration success and failure handling.
- Mods: enable/disable flows, layer validation, and schema guardrails.

## Reporting
- Document failing tests with repro steps and environment info (Node version, active mods, schemaVersion).
- Include logs from Capacitor platforms when failures are platform-specific.

## Coverage & Scope
- Current baseline is the `npm test` uvu suite in `tests/`, which covers core data model behavior, navigation/search flows, storage drivers, tags, links/backlinks, and mod samples.
- Add regression tests for every bug fix that changes card state, schema behavior, storage behavior, or mod/runtime APIs.
- Snapshot/DOM test tooling is not currently configured; prefer deterministic unit/behavior tests unless a future test runner is introduced.

