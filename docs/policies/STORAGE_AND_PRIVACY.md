# Storage & Privacy Notes

CardSpoke is local-first. Users own their data, and the app does not silently sync or host information.

## Storage Model

- **LocalStorage:** Lightweight configuration, session data, and feature toggles.
- **IndexedDB:** Structured card content, relationships, histories, and plugin registries. Datasets are namespaced and tracked with metadata (name, card counts, recent/bookmark counts, schema/app version) so multiple vaults can coexist.
- **Filesystem (via Capacitor Filesystem):** Optional for attachments or exports; only used when explicitly enabled.

## Default Behavior

- No automatic cloud sync or telemetry.
- No analytics or tracking beacons are built into the core.
- Plugins must not transmit data off-device without explicit, informed consent.
- Preferences stored under `cardspoke_*` keys (rich text, grid view, typography, high contrast, dev mode, active theme) stay on-device and are restored at startup.

## User Controls

- Provide clear settings to opt into any off-device storage/integration.
- Offer data export/import paths (JSON or other agreed formats) to preserve portability. The UI exports datasets as JSON, CSV, Markdown, or TXT (named `cardspoke-export-*`), and maintains timestamped backups for rollback.
- Surface active plugins and their data-touching permissions.

## Security Considerations

- Validate file types and sizes before writing to disk.
- Avoid storing secrets in LocalStorage; prefer secure platform stores where available (Capacitor Preferences for non-sensitive app prefs, and OS-level secure stores/Keychain/Keystore for credentials when added).
- Document any encryption used for local caches or exports.

## Incident Response

- If a plugin or Deviation corrupts data, guide users to restore from backups or exports.
- Provide steps for clearing caches (LocalStorage/IndexedDB) without losing user backups.

## Backup & Export Guidance

- Recommended backup cadence: before major edits/imports/plugin installs, and at regular intervals for active datasets.
- Supported backup/export formats in current app flows: JSON, CSV, Markdown, TXT.
- Encryption-at-export is not built in yet; users handling sensitive data should encrypt exported files using trusted external tools before sharing or cloud sync.
