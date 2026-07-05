---
name: portfolio-qa-profile-author
description: "Use when creating or updating repo-specific `.ai/qa.md`, `.ai/qa.yaml`, smoke tests, QAI-ality profiles, or AI-readable validation instructions for this portfolio."
---

# Portfolio QA Profile Author

## Best-Fit Repositories

- `QAI-ality`
- `Pal-Plant`
- `Era-Manifesto`
- `Factory-Town`
- `AuraNotes`
- `NL-Consultation-Form`
- `CardSpoke`
- `Astra-log`

## Repo Classification Map

- No-build static (direct open must work; never require a dev server): `Factory-Town`, `Cozyland`, `NL-Consultation-Form`.
- Canvas games needing screenshot QA: `Factory-Town`, `Cozyland`.
- npm-built web apps (build/test commands live in `package.json`): `Pal-Plant`, `Era-Manifesto`, `AuraNotes`, `CardSpoke`, `Blobsmith`, `Secret-Census`, `Taskalatte`.
- Backend + frontend split: `AI-Server-Studio` — root `npm test` covers the boundary.
- Native/desktop wrappers to note as skip conditions: `Taskalatte` (Electron/Capacitor), `CardSpoke` (Capacitor), `Astra-log` (Tauri), `Pal-Plant` (Capacitor).
- Automation repos: `QAI-ality` (self-test plus config validator), `Issues-Handler` (Jest plus ncc build).

## Workflow

- Classify the repo using the map above before writing any profile.
- Prefer repo-local `.ai/qa.yaml` for machine-runnable levels and `.ai/qa.md` for human-readable overrides.
- Include build/test/lint commands, browser smoke URL expectations, accessibility checks, storage/export checks, and known skip conditions.
- Align issue labels and dedupe markers with QAI-ality and Issues-Handler conventions.

## Guardrails

- Do not require a dev server for no-build static apps unless the repo already needs one.
- Do not mark QA complete when browser, Android, or AI-provider checks were skipped; state the skip condition.
- Do not make AI review the only failure path; deterministic FAIL/WARN checks should still work without an AI key.

## Validation

- Validate YAML syntax.
- Run the lightest configured QA level.
- Confirm QAI-ality can skip gracefully when optional tools or keys are absent.
