# Release & Versioning Notes

CardSpoke differentiates between core updates and mod-driven changes. Use these guidelines to communicate updates and maintain compatibility.

## Versioning Model
- Core uses semantic versioning (`MAJOR.MINOR.PATCH`).
- Schema changes increment `schemaVersion` (see [Schema & Migration Docs](../api/SCHEMA.md)).
- Mods should also use semantic versioning and declare `manifest.compatibility`. The current bundle reports `APP_VERSION = 0.16.0` and `SCHEMA_VERSION = 4` in `www/app.js`—mirror those values in docs and mod metadata for alignment.

## Update Types
- **Update (Core):** Changes to the canonical app; may bundle mods when operating in Bake Mode.
- **Mod Update:** Modular update that can be toggled; may adjust behaviors without full forks.

## Release Checklist (Core)
- Update changelog with user-facing summary and breaking changes.
- Record schema changes and migration notes.
- Verify mod compatibility; note any known incompatibilities.
- Regenerate/validate `www/` assets if source changed. Run `npm run build` (concatenates `www/src/*.js` into `www/app.js`) and confirm the self-contained entry (`www/index.html` + `app.js` + `styles.css`) still opens from `file://` before wrapping it in native shells.
- Tag release with version and schemaVersion.

## Release Checklist (Mod)
- Update metadata (version, dependencies, manifest.compatibility, changelog).
- Document toggles and uninstall steps.
- Provide compatibility notes with popular mods and Deviations.

## Communication
- Announce whether a release is **official** or **angled**.
- Surface risk notes (e.g., app-layer mods that may break compatibility).
- Include instructions for rollback or disabling problematic mods.

## Bake Mode Guidance
- When merging mods into a baked build, document exactly which versions are included.
- Provide a reproducible manifest so users can rebuild or unbake if needed.

## Changelog & Distribution
- Changelog format: keep entries grouped by Added / Changed / Fixed / Removed, and explicitly call out schema-impacting changes.
- Official release/distribution channel for source and issues: the main GitHub repository.
- Release candidates should be shared as tagged pre-releases (or clearly marked branch builds) with test notes and rollback guidance.

