# Security & Safety Considerations

This guide outlines expectations for secure, transparent, and user-respecting behavior in the core app, mods, and Deviations.

## Principles
- **User ownership:** Do not collect or transmit data without explicit consent.
- **Transparency:** Declare official vs. angled content and list AI assistants involved.
- **Safety-first:** Prefer safe defaults; fail loudly and recoverably.

## Core App Expectations
- Keep dependencies minimal and vetted; avoid unnecessary network services.
- Validate inputs for card content, mod manifests, and file imports. Import flows accept JSON/CSV/Markdown/TXT backups from the UI—validate schema version and card IDs before merging into the active dataset.
- Treat migrations as critical operations; validate results and avoid silent drops.
- Surface errors with actionable guidance.

## Mod/Deviation Expectations
- Do not obfuscate code or hide network calls.
- Provide uninstall/rollback instructions and cleanup routines.
- Avoid privileged operations unless required; document all side effects. If you toggle preferences stored in `cardspoke_*` keys (rich text, grid view, high contrast, typography, active theme), note the defaults and how to revert.
- Provide schema compatibility info and block execution on incompatible schemas.

## Data Handling
- Avoid storing secrets in LocalStorage; prefer secure platform stores.
  - **Mobile (Capacitor)**: Use `@capacitor/preferences` with encryption enabled for sensitive data
  - **Web**: OAuth tokens are session-only (not persisted). WebDAV credentials are in-memory only
  - **Desktop**: Consider using OS-level credential managers when available
- Encrypt sensitive exports when feasible; document algorithms and key handling.
  - Current exports are unencrypted JSON. For sensitive data, users should encrypt exports manually
  - Future consideration: Add password-protected export option using Web Crypto API (AES-GCM)
- Minimize retention of logs; avoid logging user content unless necessary for explicit debug flows.

## Reporting & Response
- Security disclosures should be reported via GitHub Issues: https://github.com/jxburros/CardSpoke/issues
  - Mark issues as "Security" and they will be prioritized
  - For critical vulnerabilities, contact the repository owner directly via GitHub
- Version advisories and clearly mark impacted versions/mods.
- Provide remediation steps, including how to disable mods causing risk.

## Testing & Verification
- Add tests for permission boundaries, schema compatibility checks, and error handling.
- For mods introducing network access, include mockable clients and offline fallbacks.
- Audit dependencies for known CVEs before releases.

## Security Improvements Implemented (v0.15.1+)
- **Mod Risk Assessment**: Mods are automatically analyzed and categorized by risk level (LOW/MEDIUM/HIGH)
  - Theme-layer mods with CSS-only are marked as LOW RISK
  - Feature-layer mods with JavaScript are marked MEDIUM RISK
  - App-layer mods with overrides are marked HIGH RISK
  - Security warnings shown during installation based on risk level
  - Visual risk badges displayed in the Mod Manager
- **HTTPS Enforcement**: WebDAV connections require HTTPS (warnings for HTTP)
- **JSON Import Validation**: Schema validation for imported data to prevent corruption
- **Content Security Policy**: CSP headers added to limit attack surface
- **Dependency Updates**: Regular `npm audit` to fix known vulnerabilities

## Security Hardening Checklist for Capacitor Builds
### Android
- [ ] Enable ProGuard/R8 code obfuscation in release builds
- [ ] Use Android Keystore for sensitive credential storage
- [ ] Enable certificate pinning for API endpoints
- [ ] Set `android:allowBackup="false"` to prevent data backup leakage
- [ ] Implement biometric authentication for sensitive operations
- [ ] Review AndroidManifest.xml for minimal permissions

### iOS
- [ ] Enable App Transport Security (ATS) with minimal exceptions
- [ ] Use iOS Keychain for credential storage
- [ ] Implement Face ID/Touch ID for sensitive operations
- [ ] Review Info.plist for privacy declarations
- [ ] Enable app sandboxing
- [ ] Use certificate pinning for API endpoints

## Static Analysis & Code Quality
- Testing: `npm test` runs 227+ tests using uvu framework
- Linting: Consider adding ESLint for code quality
- Security scanning: Run `npm audit` before each release
- Code review: All mods should be reviewed before publication
