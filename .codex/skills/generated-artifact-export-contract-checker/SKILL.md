---
name: generated-artifact-export-contract-checker
description: "Use when changing JSON exports, ZIP exports, markdown/PDF/HTML reports, generated bundles, schema versions, compatibility contracts, or import/export round trips."
---

# Generated Artifact and Export Contract Checker

## Best-Fit Repositories

- `RPGBite`
- `Secret-Census`
- `Era-Manifesto`
- `album-tracker`
- `Taskalatte`
- `Blobsmith`
- `AI-Server-Studio`
- `CardSpoke`

## Portfolio Artifact Map

- `RPGBite`: game ZIPs and the generated runtime bundle; `npm run verify:runtime-bundle` is the authoritative check.
- `Secret-Census`: `.census.json` with locked `format: secret-census-world`, `formatVersion: 1`, and locked fields, consumed by the Godot importer.
- `Era-Manifesto`: jsPDF reports plus JSON import/export.
- `album-tracker`: JSON export/import for release content.
- `Blobsmith`: exported packages of generated apps.
- `CardSpoke`: schema metadata tied to the plugin versioning policy.
- `Taskalatte`: import/export plus cross-device sync payloads.
- `AI-model-test`: eval reports and CSVs - never key material.

## Workflow

- Find the producer, consumer, schema/version marker, and backward compatibility rules before editing.
- Treat generated files as products: validate structure, render when visual, and round-trip when import exists.
- Record intentionally excluded fields, especially secrets, tokens, local paths, and provider config.
- Keep generated bundle verification scripts authoritative when present.

## Guardrails

- Do not change locked field names or ID semantics casually.
- Do not include secrets or sync tokens in exports.
- Do not regenerate large artifacts without checking whether they are canonical source or derived output.

## Validation

- Run export/import round trips.
- Validate schema/version fields.
- Render PDF/HTML artifacts when layout matters.
