# Storage & Privacy Notes

CardSpoke is local-first. Users own their data, and the app does not silently sync or host information. Offline use is a first-class experience, not a fallback mode.

## Storage Model

- **LocalStorage:** Lightweight configuration, session data, and feature toggles. Also the default driver for structured card content, relationships, histories, and plugin registries — datasets are namespaced and tracked with metadata (name, card counts, recent/bookmark counts, schema/app version) so multiple vaults can coexist.
- **IndexedDB:** An optional, per-dataset storage driver users can select instead of LocalStorage for card content and relationships. Also used internally for Local File System handle persistence, unrelated to card storage.
- **Filesystem (via Capacitor Filesystem):** Optional for attachments or exports; only used when explicitly enabled.
- **Off-device storage:** Not part of the public app. Google Drive, OneDrive, WebDAV, and other cloud targets are deferred to a possible future version; the shipped app contains no cloud storage drivers and makes no cloud connections. If cloud storage returns in the future, it must never be required for normal card creation, editing, reading, navigation, import, export, or local dataset switching.

## Default Behavior

- No automatic cloud sync or telemetry.
- No analytics or tracking beacons are built into the core.
- Plugins must not transmit data off-device without explicit, informed consent.
- Preferences stored under `cardspoke_*` keys (rich text, grid view, typography, high contrast, dev mode, active theme) stay on-device and are restored at startup.
- Local saves are authoritative while the user edits. Remote sync may fail, be unavailable, or be pending without invalidating the local save. (The current public app has no remote sync at all; this rule binds any future off-device integration.)

## Offline-First UX Rules

- The app shell should load offline after it has been installed or visited in a service-worker-capable browser.
- Offline status should only affect explicitly online features such as off-site storage, remote sync, remote plugin galleries, hosted sharing, or external API features.
- Save messaging must distinguish local save failure from remote sync failure. If a local save succeeds and remote sync fails, the user should see that their local copy is safe.
- Remote sync conflicts must be surfaced for review instead of silently overwriting local data.
- Plugins that require network access should declare that need and degrade gracefully when offline.

## User Controls

- Provide clear settings to opt into any off-device storage/integration.
- Offer data export/import paths (JSON or other agreed formats) to preserve portability. The UI exports datasets as JSON, CSV, Markdown, or TXT (named `cardspoke-export-*`), and maintains timestamped backups for rollback.
- Surface active plugins and their data-touching permissions.

## Security Considerations

- Validate file types and sizes before writing to disk.
- Avoid storing secrets in LocalStorage; prefer secure platform stores where available (Capacitor Preferences for non-sensitive app prefs, and OS-level secure stores/Keychain/Keystore for credentials when added).
- Document any encryption used for local caches or exports.
- Do not cache user datasets in service-worker Cache Storage. Cache Storage should only hold app-shell assets such as HTML, CSS, JS, icons, and the manifest.

## Incident Response

- If a plugin or Deviation corrupts data, guide users to restore from backups or exports.
- Provide steps for clearing caches (LocalStorage/IndexedDB) without losing user backups.

## Backup & Export Guidance

- Recommended backup cadence: before major edits/imports/plugin installs, and at regular intervals for active datasets.
- Supported backup/export formats in current app flows: JSON, CSV, Markdown, TXT.
- Encryption-at-export is not built in yet; users handling sensitive data should encrypt exported files using trusted external tools before sharing or cloud sync.
