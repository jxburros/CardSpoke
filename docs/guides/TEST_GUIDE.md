# Test Guide

CardSpoke uses `uvu` for automated tests. This guide covers how to run and write tests for core features and Extensions.

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
- `test-extension-improvements.js` – Extension-focused checks.

## Writing Tests
- Prefer small, deterministic tests with clear assertions.
- Include fixture data for schema migrations and Extension compatibility.
- When testing Extensions, validate metadata correctness, toggle behavior, and fallback paths. Exercise hook registration via `CardSpoke_MODS`, event emissions, and dev tools (hook stats/error log) to ensure compatibility surfaces stay stable.
- For UI-affecting Extensions, capture DOM/state expectations and accessibility behaviors where possible.
- Cover dataset import/export formats (JSON/CSV/Markdown/TXT) and backup restoration to ensure regression-safe portability.

## Coverage Expectations
- Core logic: happy path + error handling.
- Schema changes: migration success and failure handling.
- Extensions: enable/disable flows, dependency validation, and schema guardrails.

## Reporting
- Document failing tests with repro steps and environment info (Node version, active Extensions, schemaVersion).
- Include logs from Capacitor platforms when failures are platform-specific.

## Open Items
- [PLACEHOLDER] Coverage targets and thresholds.
- [PLACEHOLDER] Guidance for snapshot/DOM testing setup (if adopted).

