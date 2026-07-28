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
  - **Shipped:** datasets can be PIN-protected at rest — AES-GCM with a PBKDF2
    (250,000 iterations) key derived from the PIN, persisted as a JSON envelope
    that never contains the PIN. See `www/src/core/dataset-crypto.js` and
    [Storage & Privacy](./STORAGE_AND_PRIVACY.md#dataset-encryption-at-rest)
  - **Not covered:** user-initiated exports are still written as unencrypted
    JSON/CSV/Markdown/TXT, including exports of a PIN-protected dataset. For
    sensitive data, users should encrypt exports manually
  - Future consideration: a password-protected export option reusing the same
    envelope format
- Minimize retention of logs; avoid logging user content unless necessary for explicit debug flows.

## Reporting & Response

- **Preferred (private):** report vulnerabilities through GitHub's private
  vulnerability reporting on the repository's Security tab, so a fix can ship
  before the issue is public. This must be enabled in repository settings before
  the public release.
- **Public issues** (<https://github.com/jxburros/CardSpoke/issues>) are
  appropriate for hardening suggestions and already-public weaknesses — not for
  an unpatched exploitable defect, since filing one discloses it to everyone.
- No response-time commitment is offered: CardSpoke is maintained by a single
  author, and reporters should assume best-effort handling.
- Version advisories and clearly mark impacted versions/plugins.
- Provide remediation steps, including how to disable plugins causing risk.

## Testing & Verification

- Add tests for permission boundaries, schema compatibility checks, and error handling.
- For plugins introducing network access, include mockable clients and offline fallbacks.
- Audit dependencies for known CVEs before releases.

## Plugin Trust Model (v0.21.0 — CS-002 resolved)

**JavaScript plugins run inside a real sandbox.** Every JS-bearing plugin
executes inside its own dedicated Web Worker (`www/src/core/plugin-worker-bootstrap.js`),
compiled there — not on the main thread. That worker has no `window`, no
`document`, no `localStorage`, and no raw `fetch`/`XMLHttpRequest`/`WebSocket`/
`indexedDB`/`caches`/`BroadcastChannel` (all deliberately stripped before the
plugin's own code ever runs). The only way out is `ctx.api.*`, which round-trips
through the host over a `postMessage`-based RPC protocol (`www/src/core/plugin-rpc.js`)
and is checked against the plugin's declared, user-granted `permissions` on
every call. A denied permission is **unreachable**, not merely discouraged.

This replaces the previous "full-trust consent" model entirely — there is no
blanket "trust this code" prompt anymore, because there is no longer a
blanket capability grant to warn about. The remaining controls:

- **Per-permission consent (the real boundary now)**: the first time a plugin
  needs a gated capability (`ui-override`, `data-modify`, `storage`,
  `network`, `filesystem`), the user is asked to grant it — and that grant is
  enforced by the sandbox construction itself, not just checked by a
  cooperating wrapper.
- **No silent JS enable for HIGH-risk plugins**: `app`-layer plugins (or any
  plugin declaring `overrides`) always install suspended until the user
  enables them manually. `SAFE`/`LOW` risk plugins (CSS-only themes, and
  feature-layer plugins without overrides) auto-enable — the sandbox is what
  makes that safe to do by default now, not a corner cut.
- **Risk labeling**: `SAFE` = CSS-only theme; `LOW` = feature layer without
  overrides; `HIGH` = app layer or overrides; visual badges shown in the
  Plugin Manager.
- **Safe Mode**: booting with `?safemode` registers plugins but never enables
  them (no worker is ever spun up).
- **Validation**: manifests, size limits, and obvious footguns (`eval`,
  arbitrary `new Function`) are still screened before registration — a
  defense-in-depth static check, not the primary boundary anymore.
- **Hang/abuse containment**: a plugin whose setup never resolves (or spins
  in an infinite loop) is time-boxed and its worker is forcibly terminated —
  a capability the previous main-thread execution model could never offer,
  since a genuine infinite loop there would have frozen the whole app with
  no way to interrupt it.

Users should still only install plugins from authors they trust — sandboxing
contains what a plugin's *code* can reach, not what it's allowed to do with a
capability once granted (a plugin with `data-modify` can still delete every
card; a plugin with `network` can still send your data somewhere you didn't
expect). See `docs/architecture/PLUGIN_SYSTEM.md` for the full execution
model and the complete `ctx.api` reference.

## Security Improvements Implemented (v0.15.1+)

- **JSON Import Validation**: Schema validation for imported data to prevent corruption
- **Content Security Policy**: CSP headers added to limit attack surface
- **Dependency Updates**: Regular `npm audit` to fix known vulnerabilities

## Content Security Policy (v0.20.0)

The app ships a hardened CSP in `www/index.html`:

- `default-src 'self'` — the app is self-contained; no third-party scripts, styles, or fonts load at startup.
- `style-src 'self' 'unsafe-inline'` — inline styles are permitted because the app
  builds elements with inline `style` attributes and theme plugins inject CSS
  text. Plugin CSS is validated/sanitized (`www/src/core/plugin-validator.js`)
  before injection; it is bounded by `img-src` and by the app never reflecting
  user content into CSS-selectable attributes (see `img-src` below).
- `font-src 'self'` and `worker-src 'self'` — fonts load only from the app's
  own origin, and `worker-src 'self'` is what permits each plugin's dedicated
  sandbox Worker (a same-origin static file, `www/plugin-worker-bootstrap.js`
  — never a Blob URL, so this directive needs no further loosening).
- `connect-src 'self' https://raw.githubusercontent.com` — the only permitted `fetch`/XHR destination beyond the app's own origin is the curated plugin gallery, and "Install from URL" only resolves gallery-hosted packages. A plugin's own `ctx.api.network.fetch` calls are proxied through this same main-thread chokepoint — the plugin's worker never performs a real network request itself, even once the `network` permission is granted.
- `img-src 'self' data: blob:` — images are limited to the app's own origin plus inline `data:`/`blob:` data; arbitrary remote (`https:`) image loads are blocked. This closes the CSS `url()` / image-beacon channel a malicious or user-accepted plugin could otherwise use to signal data out of the page. It is paired with the app never reflecting user content (card titles, tags) into CSS-selectable DOM `value` attributes, so plugin CSS attribute selectors cannot read card content either.
- `script-src 'self' 'unsafe-eval'` — `'unsafe-eval'` is required for `new Function`-based compilation of plugin `js`/`teardownJs` strings, which now happens exclusively **inside each plugin's own sandboxed Worker** (`www/src/core/plugin-worker-bootstrap.js`), not on the main thread. The directive is scoped to the app's own origin either way; what changed is that the compiled code it permits no longer has DOM/window/storage/network access by default (CS-002, resolved).
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
