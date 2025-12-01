# Storage & Privacy Notes

CardSpoke is local-first. Users own their data, and the app does not silently sync or host information.

## Storage Model
- **LocalStorage:** Lightweight configuration, session data, and feature toggles.
- **IndexedDB:** Structured card content, relationships, histories, and Extension registries.
- **Filesystem (via Capacitor Filesystem):** Optional for attachments or exports; only used when explicitly enabled.

## Default Behavior
- No automatic cloud sync or telemetry.
- No analytics or tracking beacons are built into the core.
- Extensions must not transmit data off-device without explicit, informed consent.

## User Controls
- Provide clear settings to opt into any off-device storage/integration.
- Offer data export/import paths (JSON or other agreed formats) to preserve portability.
- Surface active Extensions and their data-touching permissions.

## Security Considerations
- Validate file types and sizes before writing to disk.
- Avoid storing secrets in LocalStorage; prefer secure platform stores where available ([PLACEHOLDER] platform secret-store guidance).
- Document any encryption used for local caches or exports.

## Incident Response
- If an Extension or Deviation corrupts data, guide users to restore from backups or exports.
- Provide steps for clearing caches (LocalStorage/IndexedDB) without losing user backups.

## Open Items
- [PLACEHOLDER] Recommended backup cadence and storage formats.
- [PLACEHOLDER] Preferred encrypted export format if adopted.

