# Schema & Migration Docs

CardSpoke uses a schema version (`schemaVersion`) to track data model changes across the local-first storage stack (LocalStorage/IndexedDB). Use this document to plan migrations and communicate compatibility.

## Current Schema Overview
- **Schema version:** [PLACEHOLDER] (set current integer once defined)
- **Data domains:**
  - Cards and hierarchical relationships
  - User preferences (theme, layout, toggles)
  - Extension registry/manifest cache
  - Local file references (if enabled via Filesystem)
- **Storage layers:**
  - LocalStorage for lightweight config
  - IndexedDB for structured card data and histories
  - Optional filesystem assets via Capacitor Filesystem (documented per Extension)

## Versioning Rules
- Increment `schemaVersion` on any backward-incompatible change.
- Provide migration steps and fallback behavior for every version bump.
- Keep migrations idempotent and safe to re-run.
- Log or surface errors when migrations fail; never silently drop user data.

## Migration Template
For each schema change, record:
- **From → To:** schemaVersion numbers
- **Change summary:** What changed and why
- **Migration steps:** Ordered operations, including data transformations
- **Fallback behavior:** How the app handles migration failure
- **Extension impact:** Which Extensions depend on the change

Example:
```md
### schemaVersion 3 → 4
- **Change:** Added per-card tags collection; normalized card links.
- **Migration:**
  1. Create `tags` store in IndexedDB.
  2. Migrate legacy tag arrays on cards to references.
  3. Validate referential integrity; log any skipped records.
- **Fallback:** If migration fails, keep database at v3, disable tag-dependent features, prompt user to retry.
- **Extensions:** Tagging Plugin v2.0+ requires schemaVersion >= 4.
```

## Fallback & Compatibility
- On incompatible schema, block Extensions and prompt users with remediation steps.
- Provide read-only access if feasible when migrations cannot complete.
- Extensions must declare `schema_compatibility` and refuse to run on older schemas.

## Testing Migrations
- Add uvu tests for each migration path (happy path + failure cases).
- Include sample data fixtures for old versions.
- Exercise downgrade/remove scenarios when possible.

## Documentation Updates
- Update this file for every schemaVersion change.
- Reference schema changes in release notes and relevant Extension READMEs.

