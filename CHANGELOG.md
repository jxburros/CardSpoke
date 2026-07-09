# Changelog

All notable changes to CardSpoke are documented in this file.

The format follows Keep a Changelog and the project uses semantic versioning where practical.

---

## [Unreleased]

### Added

- Public app scope document: `docs/specifications/FIRST_PUBLIC_SCOPE.md`.
- Clear first-public-version positioning for the main CardSpoke web app.

### Changed

- Refocused README, feature catalog, developer guide, test guide, and storage docs around the main CardSpoke app.
- Package description now describes CardSpoke as a local-first card-based knowledge app.
- Removed `build:core` from public package scripts.
- Public product priority is now web app first, desktop packaging second, mobile packaging third.
- Cloud/off-device storage is deferred to a future version instead of presented as a current public feature.

### Removed

- OS-light roadmap and OS preparation directive from the public app repo.
- Runtime profile, app-mode, typed-card, conversion, action-registry, and core/shell split architecture docs from current public scope.
- App-mode boot wiring from the main app entry point.
- Core-only build config.
- Tests for extracted/deferred platform systems: app modes, runtime profiles, typed cards, typed queries, typed migrations, conversions, action registry, and core-only entry behavior.

---

## [0.18.0-public-preview] – planned

### Public Scope

- Main CardSpoke web app.
- Local-first card knowledge workflow.
- Desktop packaging as the next packaging target.
- Mobile packaging after desktop, with mobile security hardening tracked separately.

### Included

- Hierarchical cards.
- Card CRUD, duplication, bookmarks, recent cards, links, backlinks, related cards, tags, search, undo/redo, trash recovery, and local import/export.
- Plugin Manager and plugin runtime with Theme, Feature, and App plugin layers.
- Sample plugins and plugin development documentation.

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
