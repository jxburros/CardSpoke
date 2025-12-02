# Extension Ecosystem & Community Guidelines

These guidelines define expectations for Extensions, community behavior, and transparency.

## Transparency Requirements
- Declare whether content is **official** or **angled**.
- Include mandatory metadata (type, name, version, author, AI assistants, description, date, dependencies, schema compatibility, official/angled flags).
- Provide a changelog and installation/removal steps.

## Quality Expectations
- Fail safely; avoid data corruption or silent errors.
- Keep logic auditable; no obfuscation.
- Provide meaningful error messages and recoverable states.
- Test with compatible schema versions and document any limitations.

## Behavioral Expectations
- Respect user ownership and privacy; no unauthorized telemetry.
- Be explicit about side effects and data created/modified.
- Avoid implying official endorsement without permission.
- Credit CardSpoke, JX Holdings, contributors, and AI assistants.

## Classification & Labeling
- Use canonical types: Theme, Patch, Plugin, Mod, Kit, Expansion.
- For bundles (Kits/Expansions), list included components and versions.
- Mark angled content clearly in UIs and marketing.

## Submission & Review (for curated catalogs)
- Include metadata JSON and README.
- Supply screenshots or short clips for UI-changing Extensions ([PLACEHOLDER] define screenshot requirements).
- Provide test notes (uvu or custom) showing core compatibility.
- Document uninstall steps and data cleanup.

## Safety Checklist
- Input validation in all user-facing forms.
- No credential harvesting or disguised network calls.
- Clear downgrade/removal instructions.
- Mention any schema changes or migrations and link to [Schema & Migration Docs](../api/SCHEMA.md).

## Community Conduct
- Follow the project’s code of conduct.
- Communicate breaking changes early; version responsibly (semantic versioning recommended).
- Provide support channels and SLAs if monetizing your Extension ([PLACEHOLDER] SLA template).

