# Security & Safety Considerations

This guide outlines expectations for secure, transparent, and user-respecting behavior in the core app, Extensions, and Deviations.

## Principles
- **User ownership:** Do not collect or transmit data without explicit consent.
- **Transparency:** Declare official vs. angled content and list AI assistants involved.
- **Safety-first:** Prefer safe defaults; fail loudly and recoverably.

## Core App Expectations
- Keep dependencies minimal and vetted; avoid unnecessary network services.
- Validate inputs for card content, Extension manifests, and file imports. Import flows accept JSON/CSV/Markdown/TXT backups from the UI—validate schema version and card IDs before merging into the active dataset.
- Treat migrations as critical operations; validate results and avoid silent drops.
- Surface errors with actionable guidance.

## Extension/Deviation Expectations
- Do not obfuscate code or hide network calls.
- Provide uninstall/rollback instructions and cleanup routines.
- Avoid privileged operations unless required; document all side effects. If you toggle preferences stored in `cardspoke_*` keys (rich text, grid view, high contrast, typography, active theme), note the defaults and how to revert.
- Provide schema compatibility info and block execution on incompatible schemas.

## Data Handling
- Avoid storing secrets in LocalStorage; prefer secure platform stores ([PLACEHOLDER] platform-specific secret guidance).
- Encrypt sensitive exports when feasible; document algorithms and key handling.
- Minimize retention of logs; avoid logging user content unless necessary for explicit debug flows.

## Reporting & Response
- Offer a channel for security disclosures ([PLACEHOLDER] security contact email or form).
- Version advisories and clearly mark impacted versions/Extensions.
- Provide remediation steps, including how to disable Extensions causing risk.

## Testing & Verification
- Add tests for permission boundaries, schema compatibility checks, and error handling.
- For Extensions introducing network access, include mockable clients and offline fallbacks.
- Audit dependencies for known CVEs before releases.

## Open Items
- [PLACEHOLDER] Security hardening checklist for Capacitor builds (Android/iOS).
- [PLACEHOLDER] Static analysis/linting tools if adopted.

