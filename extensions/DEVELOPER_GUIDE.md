# Extensions Developer Guide

Build Extensions that fit CardSpoke’s extension-first philosophy. Every Extension must be transparent, metadata-rich, and respectful of user ownership.

## Extension Types
- **Theme** – Visual changes only; no logic or data modifications.
- **Patch** – Packaged update; may alter behavior. Official or angled.
- **Plugin** – Adds features without rewriting the core.
- **Mod** – Reworks fundamental logic; may break compatibility.
- **Kit** – Bundle of Themes and/or Patches (no Mods/Plugins).
- **Expansion** – Bundle that includes at least one Plugin or Mod.

## Mandatory Metadata
Every Extension or Deviation must include a machine-readable metadata block (JSON or JSONC):
```json
{
  "type": "Theme | Patch | Plugin | Mod | Kit | Expansion | Deviation",
  "name": "string",
  "version": "X.Y.Z",
  "author": "string",
  "ai_assistants": ["string"],
  "description": "string",
  "date_created": "YYYY-MM-DD",
  "dependencies": ["ExtensionName@Version"],
  "schema_compatibility": "schemaVersion >= X",
  "official": false,
  "angled": true
}
```
- Keep metadata versioned alongside code.
- Declare schema compatibility based on the current `schemaVersion` (see [Schema & Migration Docs](../SCHEMA.md)).
- List all AI assistants involved for transparency.

## Packaging & Structure
- Provide a clear entrypoint (e.g., `main.js` or `index.json`) and README summarizing behavior and toggles.
- Avoid obfuscated code. Keep logic auditable and failure modes explicit.
- Include uninstall instructions and state-cleanup steps.

## Compatibility & Toggling
- Design for toggleability. Extensions—especially Patches and Mods—should fail safely when disabled.
- Prefer feature flags and guards when modifying core behaviors.
- For Kits/Expansions, list included Extensions and their versions.

## Data & Storage
- Respect user ownership. Do not transmit data off-device without explicit opt-in.
- Use local storage APIs (LocalStorage/IndexedDB) by default; document any filesystem use.
- Provide migrations for any data you create; version your schemas separately if needed.

## UI & UX Expectations
- Avoid clutter; keep UI changes minimal unless the Extension is a deliberate overhaul (Mod/Expansion).
- Ensure readability and keyboard navigation remain intact.
- Note any accessibility trade-offs in the README.

## Security & Safety
- Avoid privileged or obfuscated behavior.
- Validate inputs; fail with clear errors instead of silent corruption.
- Document removal steps and side effects.
- See [Security & Safety Considerations](../SECURITY_AND_SAFETY.md) for required practices.

## Distribution & Credit
- Clarify whether the Extension is **official** or **angled**.
- Credit CardSpoke, JX Holdings, yourself, and any AI assistants.
- Include a changelog noting user-impacting changes and schema touches.

## Open Items
- [PLACEHOLDER] Distribution channel templates (e.g., sample marketplace listing).
- [PLACEHOLDER] Minimum review checklist for accepting Extensions into an official catalog.

