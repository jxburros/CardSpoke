# Storage Model

CardSpoke's first public version is local-first and focused on the main web app.

The public app should not present cloud storage as a current supported feature. Google Drive, OneDrive, WebDAV, and other off-device storage drivers are deferred to a future version.

## Current Public Scope

CardSpoke currently focuses on:

- Browser/device-local persistence
- Local user preferences
- User-controlled import/export
- JSON backups
- TXT, Markdown, and CSV exports

Users should be able to keep and move their data without needing an account, hosted service, or automatic sync.

## Storage Principles

- **Local first:** Data stays on the user's device by default.
- **No silent sync:** CardSpoke must not transmit user data without explicit user action and future-version design review.
- **No required accounts:** The public preview should work without OAuth, hosted storage, or external services.
- **Portable backups:** Export/import should remain the main portability path for the first public version.
- **No secrets in LocalStorage:** Do not store credentials, API keys, OAuth tokens, or passwords in LocalStorage.

## LocalStorage Keys

CardSpoke stores preferences and lightweight configuration under `cardspoke_*` keys.

Examples include:

- `cardspoke_richtext`
- `cardspoke_gridView`
- `cardspoke_highcontrast`
- `cardspoke_typography`
- `cardspoke_devmode`
- `cardspoke_theme`
- `cardspoke_activeThemeMod`
- `cardspoke_datasets`
- `cardspoke_dataset_metadata`
- `cardspoke_lastUploadTab`
- `cardspoke_hasSeenGettingStarted`

## Import/Export

The first public version should prioritize reliable local import/export:

- JSON backup/export for full data portability
- TXT import/export for simple outlines and text movement
- Markdown export for readable archives
- CSV export for spreadsheet-style review

## Deferred Future Work

The following may return later, but they are not current public app scope:

- Google Drive storage
- OneDrive storage
- WebDAV storage
- Custom plugin-registered storage backends replacing app persistence
- Hosted sync
- Real-time collaboration
- Encrypted cloud vault integrations

Future cloud/off-device storage work should include a separate product decision, security review, permission model, user-facing recovery plan, and tests before being reintroduced.
