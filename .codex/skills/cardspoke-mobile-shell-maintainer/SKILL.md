---
name: cardspoke-mobile-shell-maintainer
description: "Use when working on CardSpoke Vite builds, Capacitor sync, Android/iOS shell behavior, `www/app.js`, `www/src`, mobile filesystem/preferences, or mobile release docs."
---

# CardSpoke Mobile Shell Maintainer

## Best-Fit Repositories

- `CardSpoke`

## Workflow

- Treat Vite build output as authoritative; keep legacy concatenation fallback clearly secondary.
- Run the relevant Capacitor sync command after web build changes that affect native shells.
- Check local-first data ownership and mobile filesystem/preferences behavior before changing storage.
- Keep Capacitor guide and release/version docs aligned with scripts.

## Guardrails

- Do not hand-edit generated bundle output without updating source.
- Do not assume IndexedDB and Capacitor storage have identical persistence semantics.
- Do not claim Android/iOS verification if sync/open was not run.

## Validation

- Run `npm run build`.
- Run `npm test`.
- Run `npm run sync:android` or document why native sync was skipped.
