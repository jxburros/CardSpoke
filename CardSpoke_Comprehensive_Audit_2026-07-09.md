# CardSpoke Comprehensive Review and Audit

**Repository:** [jxburros/CardSpoke](https://github.com/jxburros/CardSpoke)  
**Branch / commit audited:** `main` / `0cbea413b70715518a16391da27bd248cedda48f`  
**App version:** `0.18.0` public preview; schema v4  
**Audit date:** 2026-07-09  
**Overall result:** **Fail — release blocked**  

## Executive summary

CardSpoke has a thoughtful local-first product direction, unusually extensive documentation, a working standalone `file://` build, broad unit coverage, a clean npm advisory scan, and solid basic behavior. The production build succeeds, all 373 discovered tests pass, normal card data survives reload, the app reloads offline, a tested rich-text XSS payload remains inert, and the initial desktop/mobile layouts avoid horizontal overflow.

The current public preview is nevertheless not safe to promote as a release candidate. Two critical defects and two high-severity defects affect core promises:

1. A PIN-protected dataset is replaced with an empty dataset on its first reload. The browser test demonstrated a card count change from 1 to 0 and the encrypted payload shrinking from 1,279 to 236 bytes, with no PIN prompt or recovery path.
2. Plugin permissions do not contain plugin code. A feature plugin declaring no permissions read a protected LocalStorage marker and accessed `window.store`, `document`, and `fetch` in the browser proof-of-concept.
3. Every successful save is reported as failed because `saveNow()` calls the removed, undefined `scheduleCloudSync()` function.
4. Malformed stored JSON is proactively overwritten with a new empty store, destroying the original recovery evidence.

The recommendation is to freeze the public release, fix findings CS-001 through CS-004, add browser-level regression tests for each, then rerun the release QA profile before addressing the remaining medium-priority quality and packaging work.

## Scope and method

The review covered:

- product scope, architecture, README, changelog, security/privacy, storage, plugin, release, Capacitor, API, schema, and QA documentation;
- source and generated bundle structure;
- local-first storage, corruption handling, schema/migration behavior, import/export, and offline operation;
- plugin validation, risk levels, permissions, execution, lifecycle, and Safe Mode;
- CSP and common client-side injection surfaces;
- accessibility semantics, focus behavior, responsive layout, and reduced-motion claims;
- npm dependencies, lockfile, scripts, lifecycle hooks, advisory results, CI, GitHub Pages, Vite, and Capacitor packaging;
- automated tests, production build, preview behavior, `file://`, desktop Chromium, and 360-pixel mobile Chromium.

Environment: Windows, Node `v24.14.1`, npm `11.11.0`, headless Chromium. The repository CI targets Node 20 and the README permits Node 18+.

## Findings summary

| ID | Severity | Finding | Confidence |
|---|---|---|---|
| CS-001 | Critical | PIN-protected datasets are destroyed on reload | Confirmed dynamically |
| CS-002 | Critical | Plugin permissions are bypassable by design | Confirmed dynamically |
| CS-003 | High | Every save is falsely reported as failed | Confirmed dynamically |
| CS-004 | High | Corrupt storage is overwritten with an empty store | Confirmed by code path |
| CS-005 | Medium | “Instance backup” is incomplete and plugin restore is broken | Confirmed by code path |
| CS-006 | Medium | `npm run preview` serves a 404 instead of the app | Confirmed dynamically |
| CS-007 | Medium | Android sync workflow is unusable from a fresh checkout | Confirmed dynamically |
| CS-008 | Medium | Permission and generated dialogs do not meet the documented modal accessibility contract | Confirmed by code review |
| CS-009 | Medium | CI deploys without tests, audit, or browser smoke checks | Confirmed by workflow review |
| CS-010 | Low | Version, test-count, and storage documentation has drifted | Confirmed |
| CS-011 | Low | Build pipeline rewrites source-shaped output to satisfy textual tests | Confirmed |

## Detailed findings

### CS-001 — PIN-protected datasets are destroyed on reload

**Severity:** Critical  
**Category:** Data loss / encryption / recovery  
**Evidence:** Browser reproduction and source review

The dataset creation UI stores the PIN inside `store.metadata` and then encrypts the entire store. On reload, `load()` can decrypt only when it already has an active PIN from `datasetManager` or the current in-memory store. `datasetManager` is declared but never initialized, while the fresh in-memory store has no PIN. The encrypted envelope is therefore parsed as if it were a normal CardSpoke store. Subsequent startup saving replaces it with an empty store.

Reproduction result:

- Before reload: encrypted envelope present, 1 card, payload length 1,279 bytes.
- After reload: 0 cards, payload length 236 bytes, no password/PIN prompt.
- The original encrypted bytes were overwritten, so entering the correct PIN later cannot recover the data.

Relevant code:

- [PIN dataset creation](https://github.com/jxburros/CardSpoke/blob/0cbea413b70715518a16391da27bd248cedda48f/www/src/data.js#L925-L1005)
- [Encryption and save path](https://github.com/jxburros/CardSpoke/blob/0cbea413b70715518a16391da27bd248cedda48f/www/src/storage.js#L818-L863)
- [Load/decrypt and destructive fallback](https://github.com/jxburros/CardSpoke/blob/0cbea413b70715518a16391da27bd248cedda48f/www/src/storage.js#L1127-L1250)

**Recommendation:** Disable PIN dataset creation immediately until the format has a non-secret encryption header and an explicit unlock flow. Persist only salt/KDF/cipher metadata, never the PIN. On reload, detect the encrypted envelope before parsing a store, prompt for the PIN, decrypt into memory, and never overwrite the envelope following a failed or absent unlock. Add wrong-PIN, cancel, reload, and recovery regression tests.

### CS-002 — Plugin permissions are bypassable by design

**Severity:** Critical  
**Category:** Unauthorized data access / plugin security  
**Evidence:** Browser proof-of-concept and source review

Plugin JavaScript is compiled using `new Function('ctx', ...)` and runs in the main page realm. The `ctx` APIs are permission-gated, but plugin code can directly reference `window`, `document`, `localStorage`, `indexedDB`, `fetch`, `XMLHttpRequest`, and the public `window.store` host bridge.

A feature-layer plugin with an empty permissions array auto-enabled and successfully:

- read a LocalStorage value it was never granted permission to access;
- read the active card store;
- access the DOM;
- access `fetch`.

This violates the repository QA rule that unauthorized plugin access to private user data is Critical. The CSP does not create containment: it deliberately allows `unsafe-eval`, permits connections to raw GitHub, and permits images from every HTTPS origin. A malicious plugin can bypass the nominal `network` permission and exfiltrate data through direct browser APIs or image requests.

Relevant code:

- [Main-realm plugin compilation](https://github.com/jxburros/CardSpoke/blob/0cbea413b70715518a16391da27bd248cedda48f/www/src/core/plugin-api.js#L594-L615)
- [LOW feature plugins auto-enable](https://github.com/jxburros/CardSpoke/blob/0cbea413b70715518a16391da27bd248cedda48f/www/src/core/plugin-api.js#L1108-L1130)
- [Validator blocks only eval and some `new Function` forms](https://github.com/jxburros/CardSpoke/blob/0cbea413b70715518a16391da27bd248cedda48f/www/src/core/plugin-validator.js#L37-L43)
- [CSP](https://github.com/jxburros/CardSpoke/blob/0cbea413b70715518a16391da27bd248cedda48f/www/index.html#L12-L28)

**Recommendation:** Treat all JavaScript plugins as fully trusted until real isolation exists. Stop describing the current APIs as sandboxed or permissions as a security boundary. Do not auto-enable JavaScript plugins. Require an explicit full-trust warning for every JavaScript plugin. For actual capability enforcement, move execution into a sandboxed iframe or Worker with a narrow, validated message protocol and keep card data out of the plugin realm.

### CS-003 — Every save is falsely reported as failed

**Severity:** High  
**Category:** Core reliability / data-integrity signaling  
**Evidence:** Browser reproduction

`saveNow()` writes LocalStorage successfully and then calls `scheduleCloudSync()`, which no longer exists in the public repository. The resulting `ReferenceError` is caught by the save error handler, producing “Failed to save: scheduleCloudSync is not defined” and a “Local save failed” state.

Normal card persistence still worked in the tested flow, but the app tells users it failed. This makes the central local-first safety signal untrustworthy and obscures real write failures.

Relevant code: [undefined call after local write](https://github.com/jxburros/CardSpoke/blob/0cbea413b70715518a16391da27bd248cedda48f/www/src/storage.js#L945-L1015)

**Recommendation:** Remove the obsolete cloud-sync call from the public build. Separate local-write success from optional post-save integrations so a downstream failure cannot relabel a successful local commit. Add a browser test asserting that a card save ends in “Saved locally,” persists after reload, and emits no error toast.

### CS-004 — Corrupt storage is overwritten with an empty store

**Severity:** High  
**Category:** Recovery / permanent data loss  
**Evidence:** Source review

On any parse or load exception, `load()` replaces the in-memory store with defaults and immediately schedules `save()`. This overwrites the corrupt original key. The user sees a warning only after the destructive recovery has started and receives no option to download the raw payload, restore a backup, retry a PIN, or reset intentionally.

Relevant code: [destructive catch block](https://github.com/jxburros/CardSpoke/blob/0cbea413b70715518a16391da27bd248cedda48f/www/src/storage.js#L1242-L1250)

**Recommendation:** Quarantine the raw payload under a timestamped recovery key, keep the active key untouched, boot into a read-only recovery screen, and offer download/retry/restore/reset actions. Only overwrite after explicit confirmation.

### CS-005 — “Instance backup” is incomplete and plugin restore is broken

**Severity:** Medium  
**Category:** Backup/export contract

The JSON instance export includes cards, root IDs, and plugins, but omits bookmarks, recent cards, view state, theme, dataset metadata, schema version, and migration metadata. More seriously, exported plugins use the current `{definition, enabled}` persistence shape, while import reconstructs legacy `{js, css, meta, enabled}` entries. The runtime explicitly refuses to execute entries without `definition`, so a JSON export/import cannot restore current plugins.

Relevant code:

- [Instance export](https://github.com/jxburros/CardSpoke/blob/0cbea413b70715518a16391da27bd248cedda48f/www/src/data.js#L355-L376)
- [Plugin import conversion](https://github.com/jxburros/CardSpoke/blob/0cbea413b70715518a16391da27bd248cedda48f/www/src/data.js#L643-L653)
- [Legacy entries are not executed](https://github.com/jxburros/CardSpoke/blob/0cbea413b70715518a16391da27bd248cedda48f/www/src/core/plugin-api.js#L1165-L1169)

**Recommendation:** Define one versioned backup schema containing every user-owned field, include `schemaVersion`, validate compatibility before merge, preserve the canonical plugin `definition`, and add an exact export → clear → import → compare test.

### CS-006 — `npm run preview` serves a 404

**Severity:** Medium  
**Category:** Developer experience / release verification

The build emits only `dist/app.js` and its map, then copies the bundle into `www`. Vite preview serves `dist`, where no `index.html` exists. The preview process starts, but `/` and `/index.html` return 404. This contradicts README setup instructions and the repository quick-QA contract.

**Recommendation:** Either build the complete site into `dist` and publish that directory, or replace the preview script with a static server rooted at `www`.

### CS-007 — Android sync is unusable from a fresh checkout

**Severity:** Medium  
**Category:** Mobile packaging / documentation

`npm run sync:android` fails with “android platform has not been added yet.” No `android/` project is committed, and the Capacitor guide does not instruct contributors to run `npx cap add android` before sync. iOS has the same structural issue and could not be executed on Windows.

**Recommendation:** Decide whether native projects are committed artifacts or generated setup. Document the chosen workflow, add safe setup scripts if generated, and ensure release validation does not claim sync readiness before a native project exists.

### CS-008 — Modal accessibility contract is incomplete

**Severity:** Medium  
**Category:** Accessibility

The primary menu correctly moves focus to its close button, and the initial static controls inspected had accessible names. However, the plugin permission dialog is a generic `div` without `role="dialog"`, `aria-modal`, an accessible relationship to its title, Escape handling, focus trapping, initial focus management, or focus restoration. Several other dynamically generated overlays follow similar ad hoc patterns despite documentation claiming modal focus trapping.

Relevant code: [permission dialog construction](https://github.com/jxburros/CardSpoke/blob/0cbea413b70715518a16391da27bd248cedda48f/www/src/core/permissions.js#L162-L223)

**Recommendation:** Create one shared dialog primitive with semantics, focus trap, Escape behavior, background inertness, and focus restoration. Migrate permission, dataset, export, confirmation, and onboarding overlays to it.

### CS-009 — Deployment is not gated by QA

**Severity:** Medium  
**Category:** CI/CD

The Pages workflow runs `npm ci` and `npm run build`, then deploys `www`. It does not run `npm test`, `npm audit`, file-protocol smoke tests, browser smoke tests, or backup round trips. A green deployment can therefore publish the confirmed save and PIN data-loss regressions.

Relevant code: [Pages workflow](https://github.com/jxburros/CardSpoke/blob/0cbea413b70715518a16391da27bd248cedda48f/.github/workflows/pages.yml)

**Recommendation:** Add a required QA job with install, test, build, npm audit threshold, preview/file smoke, save/reload, encrypted dataset, plugin boundary, import/export round trip, and accessibility checks. Deploy only from its success.

### CS-010 — Documentation and metadata drift

**Severity:** Low

- README and security documentation claim 434 tests; the current runner discovers and passes 373.
- `package.json` is `0.18.0`, while the committed lockfile root version is `0.18.0-public-preview`; a normal `npm install` rewrites it.
- The QA profile describes IndexedDB as primary persistence in places, while the current user-facing default and storage policy say LocalStorage.
- README exposes native sync commands without the required platform-add setup.

**Recommendation:** Generate counts/version references where possible and include a documentation consistency check in CI.

### CS-011 — Build output is coupled to textual test expectations

**Severity:** Low  
**Category:** Maintainability

The Vite configuration fuses application files using regex-based import/export stripping, removes duplicate functions with brace counting, then post-processes emitted JavaScript to restore quote style, arrow formatting, comments, and entire function bodies so textual tests can match source formatting. This is fragile across syntax changes and makes tests constrain generated formatting rather than runtime behavior.

**Recommendation:** Replace formatting assertions with imported unit tests or browser behavior tests, remove post-build function replacement, and migrate shared app state behind explicit module APIs over several small releases.

## Verification results

| Check | Result |
|---|---|
| `npm install` | Pass; 131 packages installed |
| `npm audit --json` | Pass; 0 known vulnerabilities |
| `npm test` | Pass; 373/373 |
| `npm run build` | Pass; Vite 7.3.6, 366.48 kB bundle, 72.54 kB gzip |
| `npm run preview` page load | Fail; 404 |
| `file://.../www/index.html` | Pass; app initialized |
| Normal card create/save/reload | Pass for persistence; fail for save status |
| Rich-text XSS payload | Pass; payload rendered inert and remained inert after reload |
| Offline reload | Pass; app and test card available offline |
| Plugin permission boundary | Fail; no-permission plugin accessed secret/storage/DOM/network APIs |
| PIN dataset reload | Critical fail; encrypted data overwritten and card lost |
| Desktop responsive smoke | Pass for tested initial state |
| 360×740 mobile smoke | Pass for tested initial state; no horizontal overflow |
| Menu initial focus | Pass; focus moved to close button |
| Android Capacitor sync | Fail; Android platform absent |
| iOS native build/open | Blocked by Windows and absent native project |

## Positive observations

- Scope is unusually clear: the public preview explicitly defers cloud sync and production mobile hardening.
- Local-first behavior is real for the ordinary unencrypted path; no telemetry or hosted sync was found.
- Service-worker caching is limited to application assets rather than user datasets.
- The core bundle works directly from `file://`.
- Basic CRUD persistence, offline reload, and XSS escaping performed correctly in live Chromium tests.
- The plugin lifecycle, middleware, registries, Safe Mode, sample plugins, and cleanup paths have broad unit coverage.
- Dependency sources are registry-hosted and no project lifecycle hooks or non-registry package specs were found.
- The tested initial desktop/mobile layouts were usable, and visible static controls had accessible names.

## Prioritized remediation plan

### Release blockers

1. Remove `scheduleCloudSync()` and add a real save-status browser regression test.
2. Disable PIN creation, preserve any existing encrypted blobs, and implement a safe unlock/recovery design.
3. Reclassify all JavaScript plugins as fully trusted; remove auto-enable and misleading sandbox language.
4. Stop overwriting corrupt storage; add quarantine and recovery UI.

### Next hardening pass

5. Version and round-trip the complete backup format.
6. Add required CI tests before Pages deployment.
7. Fix preview and native platform setup workflows.
8. Consolidate modal accessibility and run automated plus manual keyboard/screen-reader checks.

### Maintainability

9. Add lint, type-check, coverage, and browser test scripts.
10. Decouple build output from textual source-format tests and gradually modularize the flat runtime.

## Explicit limitations

The audit did not claim checks that the environment could not complete. It did not run a real screen reader, physical touch device, Android emulator/Gradle build, iOS/Xcode build, 10,000-card stress test, or every manual UI permutation. The installed in-app browser controller was unavailable due a missing local runtime file, so browser verification used a temporary standalone headless Chromium runtime. GitHub Actions logs were not inspected because the request concerned the repository/app as a whole rather than a specific failing workflow run.

