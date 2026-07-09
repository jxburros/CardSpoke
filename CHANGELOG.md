# Changelog

All notable changes to CardSpoke are documented in this file.

The format follows Keep a Changelog and the project uses semantic versioning where practical.

---

## [0.18.0] – 2026-07-09

First public release of the main CardSpoke web app.

### Public Scope

- Main CardSpoke web app.
- Local-first card knowledge workflow.
- Desktop packaging as the next packaging target.
- Mobile packaging after desktop, with mobile security hardening tracked separately.

### Added

- Public app scope document: `docs/specifications/FIRST_PUBLIC_SCOPE.md`.
- Clear first-public-version positioning for the main CardSpoke web app.
- Regression tests for new-card tag persistence, search keyboard navigation, form labels, dialog semantics, focus-trap cleanup, tab contrast tokens, CSP hardening, and balanced HTML.

### Fixed

- Tags entered while creating a new card are now persisted on the first save (previously they were silently dropped; QA FUNC-1).
- Search-results keyboard navigation now works as the on-screen hint promises: the search bar stays visible on the results page and Arrow/Enter are handled even after focus leaves the input (QA UX-1).
- Card edit form controls (`Title`, `Parent Card`, child title inputs) now have programmatic labels for screen readers (QA A11Y-2).
- The menu overlay and Plugin Manager are exposed as modal dialogs (`role="dialog"`, `aria-modal`, labelled titles) and all glyph-only close buttons have accessible names (QA A11Y-3).
- Closing the menu with Escape (or any other path) now always releases the focus-trap listener, so repeated open/close cycles no longer accumulate keydown handlers (QA A11Y-4).
- Header, search, and density controls meet the 44px touch-target goal on mobile widths (QA A11Y-1).
- Active Plugin Manager tab text uses a theme-aware accent token with WCAG AA (≥ 4.5:1) contrast in light and dark themes (QA A11Y-5).
- Removed a stray closing `</div>` from `index.html` (QA HTML-1).

### Security

- Content Security Policy hardened (QA SEC-1/SEC-2): `connect-src` no longer contains a wildcard and is limited to same-origin plus the curated plugin gallery (`raw.githubusercontent.com`); Google/Microsoft script, connect, and frame sources are gone; `frame-src` is now `'none'`. `'unsafe-eval'` remains only for the plugin runtime and is documented in `docs/policies/SECURITY_AND_SAFETY.md`.
- Third-party auth libraries (Google Identity Services, MSAL) no longer load at startup — the app makes no third-party contact by default (QA PRIV/PERF-1).
- Resolved all `npm audit` advisories in the build toolchain (Vite, esbuild, tar, brace-expansion) — 0 known vulnerabilities (QA DEP-1).

### Changed

- Refocused README, feature catalog, developer guide, test guide, and storage docs around the main CardSpoke app.
- Package description now describes CardSpoke as a local-first card-based knowledge app.
- Removed `build:core` from public package scripts.
- Public product priority is now web app first, desktop packaging second, mobile packaging third.
- Cloud/off-device storage is deferred to a future version instead of presented as a current public feature.
- The save-status indicator reports plain local-save state; there is no remote sync state in the public app.
- Schema/docs updated: `www/src/core/migrations.js` now provides baseline structural repair (`migrateCard`/`migrateStore`) only.

### Removed

- Cloud storage drivers (Google Drive, OneDrive, WebDAV) and the cloud sync scheduler — out of scope for the public app. Legacy dataset metadata referencing cloud drivers falls back safely to LocalStorage. No schema change: `schemaVersion` remains 4.
- Committed OAuth client IDs for Google/Microsoft integrations.
- Typed-card platform layer, conversions, action registry, runtime profiles, kind-filterable export, and the core-only entry point (`www/src/core/index.js`) — all "OS preparation" code outside the public scope.
- Stale core-only build artifacts (`dist/cardspoke-core.*`) and the unused legacy ES module mirror (`www/modules/`).
- OS-light roadmap and OS preparation directive from the public app repo.
- Runtime profile, app-mode, typed-card, conversion, action-registry, and core/shell split architecture docs from current public scope.
- App-mode boot wiring from the main app entry point.
- Core-only build config.
- Tests for extracted/deferred platform systems: app modes, runtime profiles, typed cards, typed queries, typed migrations, conversions, action registry, and core-only entry behavior.

### Explicitly Deferred

- OS-specific shells.
- Spin-off apps or app suites built on CardSpoke.
- Typed-card domain systems.
- Runtime profiles.
- Core-only builds.
- Google Drive, OneDrive, WebDAV, and other cloud storage drivers.
- Hosted sync or real-time collaboration.

---

## [0.17.0] – 2026-02-17

### Added

- Backlinks panel: the Read view shows all cards that link to the current card via `[[Title]]` references.
- Related-cards panel: the Read view shows cards sharing tags with the current card, ranked by match score.
- `CHANGELOG.md` created.

### Fixed

- Vite build no longer emits an `outDir`-overlaps-`root` warning.
- `npm run build` produces an unminified, readable IIFE bundle.
- Removed duplicate `build:vite` script from `package.json`.

### Changed

- README build-step description updated to reflect the Vite bundler.
- README quick example updated to use the correct public API.
- README duplicate support section removed.

---

## [0.16.x and earlier]

Earlier releases predated this changelog file. See the Git log for historical changes.
