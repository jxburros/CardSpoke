# Card-Based Information Repository

This repository hosts multiple iterations of the CardSpoke / Card-Based Information Repository app. Legacy HTML exports for each historical release are kept at the repo root for archival purposes.

The actively developed implementation lives under [`figma/`](figma/). It is a Vite + React rewrite that preserves the full feature set of the 0.7 release while adopting the refined CardSpoke visual design from Figma.

## Project structure

- `figma/` – Source for the new React client, including the runtime that powers extensions ("mods"), card storage helpers, and redesigned UI components.
- `*.html` – Archived self-contained builds for previous versions of the app.
- `Card-Based Information Repository.zip` – Original asset bundle exported from Figma (kept for reference).

See [`figma/README.md`](figma/README.md) for setup and development instructions for the React client.
