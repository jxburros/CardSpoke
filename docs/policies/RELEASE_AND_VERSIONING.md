# Release & Versioning Notes

CardSpoke differentiates between core updates and Extension-driven changes. Use these guidelines to communicate updates and maintain compatibility.

## Versioning Model
- Core uses semantic versioning (`MAJOR.MINOR.PATCH`).
- Schema changes increment `schemaVersion` (see [Schema & Migration Docs](../api/SCHEMA.md)).
- Extensions should also use semantic versioning and declare `schema_compatibility`. The current bundle reports `APP_VERSION = 0.15.0` and `SCHEMA_VERSION = 4` in `www/app.js`—mirror those values in docs and Extension metadata for alignment.

## Update Types
- **Update (Core):** Changes to the canonical app; may bundle Extensions when operating in Bake Mode.
- **Patch (Extension):** Modular update that can be toggled; may adjust behaviors without full forks.

## Release Checklist (Core)
- Update changelog with user-facing summary and breaking changes.
- Record schema changes and migration notes.
- Verify Extension compatibility; note any known incompatibilities.
- Regenerate/validate `www/` assets if source changed. Confirm the self-contained entry (`www/index.html` + `app.js` + `styles.css`) still opens from `file://` before wrapping it in native shells.
- Tag release with version and schemaVersion.

## Release Checklist (Extension)
- Update metadata (version, dependencies, schema compatibility, changelog).
- Document toggles and uninstall steps.
- Provide compatibility notes with popular Extensions and Deviations.

## Communication
- Announce whether a release is **official** or **angled**.
- Surface risk notes (e.g., Mods that may break compatibility).
- Include instructions for rollback or disabling problematic Extensions.

## Bake Mode Guidance
- When merging Extensions into a baked build, document exactly which versions are included.
- Provide a reproducible manifest so users can rebuild or unbake if needed.

## Open Items
- [PLACEHOLDER] Preferred changelog format (e.g., Keep a Changelog).
- [PLACEHOLDER] Distribution channels for official releases and how to submit release candidates.

