---
name: cardspoke-plugin-runtime-author
description: "Use when changing CardSpoke plugin APIs, middleware, sample plugins, theme/feature/app-layer plugins, schema metadata, local-first storage, or extension documentation."
---

# CardSpoke Plugin Runtime Author

## Best-Fit Repositories

- `CardSpoke`

## Workflow

- Read CardSpoke README, plugin system docs, developer guide, versioning policy, and sample plugin implementations.
- Keep the core minimal and preserve the three-layer plugin model: theme, feature, and app transformations.
- Update sample plugins and metadata/changelog expectations when the plugin contract changes.
- Preserve `www/src` as the source of truth for the Vite-built runtime bundle.

## Guardrails

- Do not bloat the core to solve a plugin-layer concern.
- Do not break `file://` local-first operation.
- Do not change schema/version behavior without updating tests and release docs.

## Validation

- Run `npm test`.
- Run `npm run build`.
- Validate sample plugin loading or affected middleware path.
