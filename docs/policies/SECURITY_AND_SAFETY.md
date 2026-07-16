# Security & Safety Considerations

This guide outlines expectations for secure, transparent, and user-respecting behavior in the core app, plugins, and Deviations.

## Principles

- **User ownership:** Do not collect or transmit data without explicit consent.
- **Transparency:** Declare official vs. angled content and list AI assistants involved.
- **Safety-first:** Prefer safe defaults; fail loudly and recoverably.

## Core App Expectations

- Keep dependencies minimal and vetted; avoid unnecessary network services.
- Validate inputs for card content, plugin manifests, and file imports. Import flows accept JSON/CSV/Markdown/TXT backups from the UI—validate schema version and card IDs before merging into the active dataset.
- Treat migrations as critical operations; validate results and avoid silent drops.
- Surface errors with actionable guidance.

## Plugin/Deviation Expectations

- Do not obfuscate code or hide network calls.
- Provide uninstall/rollback instructions and cleanup routines.
- Avoid privileged operations unless required; document all side effects. If you toggle preferences stored in `cardspoke_*` keys (rich text, grid view, high contrast, typography, active theme), note the defaults and how to revert.
- Provide schema compatibility info and block execution on incompatible schemas.

## Data Handling

- Avoid storing secrets in LocalStorage; prefer secure platform stores.
  - **Mobile (Capacitor)**: Use `@capacitor/preferences` with encryption enabled for sensitive data
  - **Web**: The public app holds no credentials — there are no cloud storage drivers, no OAuth flows, and no hosted sync
  - **Desktop**: Consider using OS-level credential managers when available
- Encrypt sensitive exports when feasible; document algorithms and key handling.
  - Current exports are unencrypted JSON. For sensitive data, users should encrypt exports manually
  - Future consideration: Add password-protected export option using Web Crypto API (AES-GCM)
- Minimize retention of logs; avoid logging user content unless necessary for explicit debug flows.

## Reporting & Response

- Security disclosures should be reported via GitHub Issues: <https://github.com/jxburros/CardSpoke/issues>
  - Mark issues as "Security" and they will be prioritized
  - For critical vulnerabilities, contact the repository owner directly via GitHub
- Version advisories and clearly mark impacted versions/plugins.
- Provide remediation steps, including how to disable plugins causing risk.

## Testing & Verification

- Add tests for permission boundaries, schema compatibility checks, and error handling.
- For plugins introducing network access, include mockable clients and offline fallbacks.
- Audit dependencies for known CVEs before releases.

## Plugin Trust Model (v0.19.0)

**JavaScript plugins are fully trusted code.** There is no sandbox: plugin
JavaScript is compiled with `new Function` and runs on the main thread in the
page realm, where it can reach `window`, `document`, LocalStorage, IndexedDB,
`fetch`, and the host bridge directly. The declared `permissions` array scopes
what the *supported* `ctx` API offers a well-behaved plugin — it is a
compatibility and UX contract, **not a security boundary**, and cannot contain
malicious code.

The controls that follow from that honesty:

- **Full-trust consent (required)**: any plugin that ships JavaScript must be
  explicitly accepted by the user in a consent dialog that states the above
  before it is enabled — at install, at re-import, and (once per plugin) at
  first enable. Consent is revoked when the plugin is deleted.
- **No silent JS enable**: only CSS-only themes (risk `SAFE`) auto-enable.
  Everything carrying JavaScript stays suspended until consent is given.
- **Risk labeling** (sets expectations, not guarantees): `SAFE` = CSS-only
  theme; `LOW` = feature layer without overrides; `HIGH` = app layer or
  overrides; visual badges shown in the Plugin Manager.
- **Safe Mode**: booting with `?safemode` registers plugins but never runs them.
- **Validation**: manifests, size limits, and obvious footguns (`eval`,
  arbitrary `new Function`) are screened before registration.

Users should only install plugins from authors they trust — the same rule as
installing any software. Real isolation (Worker/iframe with a message
protocol) is tracked as future hardening work.

## Security Improvements Implemented (v0.15.1+)

- **JSON Import Validation**: Schema validation for imported data to prevent corruption
- **Content Security Policy**: CSP headers added to limit attack surface
- **Dependency Updates**: Regular `npm audit` to fix known vulnerabilities

## Content Security Policy (v0.19.0)

The app ships a hardened CSP in `www/index.html`:

- `default-src 'self'` — the app is self-contained; no third-party scripts, styles, or fonts load at startup.
- `connect-src 'self' https://raw.githubusercontent.com` — the only permitted `fetch`/XHR destination beyond the app's own origin is the curated plugin gallery, and "Install from URL" only resolves gallery-hosted packages.
- `img-src 'self' data: blob:` — images are limited to the app's own origin plus inline `data:`/`blob:` data; arbitrary remote (`https:`) image loads are blocked. This closes the CSS `url()` / image-beacon channel a malicious or user-accepted plugin could otherwise use to signal data out of the page. It is paired with the app never reflecting user content (card titles, tags) into CSS-selectable DOM `value` attributes, so plugin CSS attribute selectors cannot read card content either.
- `script-src 'self' 'unsafe-eval'` — `'unsafe-eval'` is required by the plugin runtime, which compiles the `setup`/`teardown` functions of JSON plugin packages at install/enable time (see `www/src/core/plugin-api.js`). This is a deliberate, documented trade-off under the full-trust plugin model: consent dialogs, risk labels, and Safe Mode set expectations, and moving plugin execution into sandboxed workers/iframes is tracked as future hardening work.
- `frame-src 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'` — frames, plugin objects, and external form posts are not used and are blocked outright.

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

- Testing: `npm test` runs the full uvu suite under `tests/` (the run prints the current test count; CI blocks deployment on any failure)
- Linting: Consider adding ESLint for code quality
- Security scanning: Run `npm audit` before each release
- Code review: All plugins should be reviewed before publication
