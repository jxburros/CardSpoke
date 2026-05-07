# Changelog

All notable changes to CardSpoke are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.17.0] – 2026-02-17

### Added

- **Backlinks panel** (`getBacklinks`): the Read view now shows all cards that link to the current card via `[[Title]]` references, rendered as clickable tiles.
- **Related-cards panel** (`getRelatedCards`): the Read view shows cards sharing tags with the current card, ranked by `matchScore` and capped by a configurable `limit`.
- `CHANGELOG.md` (this file) created.

### Fixed

- Vite build no longer emits an `outDir`-overlaps-`root` warning; the bundle now writes to `dist/app.js` and is copied to `www/app.js` by a post-build plugin.
- `npm run build` produces an unminified, readable IIFE bundle (function names and single-quote formatting preserved) so the automated test suite can verify code structure.
- Removed duplicate `build:vite` script from `package.json` (it was an alias for `build`).

### Changed

- README build-step description updated to reflect the Vite bundler (replaces the outdated "concatenates source slices" phrasing).
- README `www/src/` layout entry updated to describe the Vite build workflow.
- README quick-example updated to use the correct public API (`window.CardSpoke.registerPlugin`) instead of the internal `window.CardSpoke.Plugin.register`.
- README duplicate "Support & Questions" section removed; a single "Support & Disclosure Channels" section remains.

---

## [0.16.x and earlier]

Earlier releases predated this changelog file. See the Git log for historical changes.
