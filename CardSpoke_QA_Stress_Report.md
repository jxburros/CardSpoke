# CardSpoke QA and Stress Test Report

Date: 2026-07-08  
Target: https://jxburros.github.io/CardSpoke/  
Repository: `jxburros/CardSpoke`, `main` at `1d5dc4e`  
App version observed: `0.17.0`, release date `2026-02-17`

## Executive Summary

CardSpoke is in good shape overall. The deployed app loads cleanly, the app shell works offline after first load, the local-first model is visible to users, and the core card creation/search/bookmark/plugin-gallery flows are usable. The automated unit suite is also strong: `npm test` passed all 446 tests, and `npm run build` completed successfully.

The most important product bug found is that tags entered while creating a new card are not persisted on the initial save. The highest-priority hardening items are accessibility semantics for custom modals/forms, tightening the CSP/network posture, and resolving current npm audit advisories in the Vite/Capacitor toolchain.

No catastrophic runtime failures were found under the tested stress levels. Synthetic 3,000-card local datasets remained responsive: load was about 1.1s and search completed in about 0.6s in headless Chromium.

## Scope And Method

Tested:

- Live GitHub Pages deployment.
- Local cloned repo, build scripts, test suite, package audit, source review.
- Browser automation with bundled Playwright/Chromium.
- Desktop, tablet, mobile, and small-mobile viewport probes.
- Functional flows: create card, child card, body link rendering, bookmark, search, Plugin Manager gallery.
- Stress flows: seeded 1,000-card and 3,000-card datasets, full scroll batch rendering, fuzzy search, 200-card public API creation burst.
- Basic accessibility probes: form labels, modal semantics, touch target sizes, contrast sampling, focus-trap listener behavior.

Limitations:

- I attempted to use the requested Chrome/Computer plugin path, but the shared local JavaScript automation kernel crashed before plugin code could load (`kernel.js` missing from a temp path). I used headless Chromium/Playwright instead, which still gives browser-grade evidence but not the user's live Chrome profile.
- Native Capacitor Android/iOS sync was not run because this was a deployed web QA pass with no code changes; no claim is made about Android/iOS shell behavior.
- General GitHub issue listing was unavailable through the exposed connector tools; `gh` was unauthenticated in shell. The GitHub connector did confirm repo metadata and no recent open PRs for the authenticated user.

Evidence:

- Raw JSON: `outputs/cardspoke-qa-evidence/qa-results.json`
- Screenshots: `outputs/cardspoke-qa-evidence/screenshots/`

## Verification Results

| Check | Result |
|---|---:|
| Live smoke load | Pass, HTTP 200, app ready in ~1.0s |
| Runtime API present | Pass |
| Console/page errors in automated flows | Pass, none captured |
| Service worker/offline app shell | Pass after first load |
| `npm install` | Pass, but audit findings present |
| `npm run build` | Pass, Vite build in 367ms |
| `npm test` | Pass, 446/446 |
| `npm audit --json` | Fail by audit policy: 1 high, 6 moderate, 1 low |

Build output observed:

- `dist/app.js`: 424.39 kB, gzip 83.46 kB.
- Deployed `app.js` transfer in browser: about 85 kB encoded.
- Total observed startup transfer across 8 resources: about 106 kB, excluding cached/zero-size third-party script entries.

## Exceptionally Good Findings

1. Clean deployed boot: no console errors, no page exceptions, HTTP 200, runtime API present.
2. Offline-first shell works: after first load, the service worker served the app while the browser context was offline.
3. Strong automated test baseline: 446 passing uvu tests across app, storage, plugin, query, tags, import/export, accessibility API, and typed-card areas.
4. Large local datasets remained usable: 3,000-card load was ~1.1s; fuzzy search for 273 matches took ~0.57s.
5. Rendering is batched: initial list render showed 60 cards, then loaded more on scroll. This is the right direction for local-first scaling.
6. Responsive layout did not produce horizontal page overflow at 320, 360, 768, or 1366 px widths.
7. Plugin Manager gallery loaded live curated plugins from the repo without errors.
8. Local-first status messaging is clear: save status normalized to "Saved locally" in the browser.

## Findings

### FUNC-1 - Medium - Tags entered on new-card creation are not persisted

Evidence: In the live UI, I entered `qa, stress` into the new-card tag editor. Chips appeared before save, but the saved card had `tags: []`. Editing an existing card has a tag update path; the new-card branch does not.

Likely source: `www/src/rendering.js:544` reads `tagsVal`; `www/src/rendering.js:562` applies it in edit mode; `www/src/rendering.js:575-582` creates a new card but never writes `tagsVal`.

Impact: Users lose tags silently when creating a card, which undermines tag search, related cards, and trust in data entry.

Fix: In the non-editing branch, apply tags to `store.cards[newId]` or call the same tag setter/update path before `save()`. Add a regression test for tags on first create.

### UX-1 - Medium - Search keyboard hint does not reliably work

Evidence: Search results display a keyboard hint saying Arrow/Enter opens results, but after submitting a search, pressing Enter did not open the selected result in the live QA run. Clicking the result worked.

Likely source: `www/src/rendering.js:860` hides `searchContainer`; result open handling is bound to `searchInput` keydown at `www/src/rendering.js:1531-1544`; the hint is rendered at `www/src/rendering.js:986-1001`.

Impact: Keyboard users receive an affordance that does not reliably work after results render.

Fix: Keep the search input visible/focused on the results page, or make results a focusable list with `aria-activedescendant` and a document/list-level Arrow/Enter handler.

### A11Y-2 - Medium - Edit form controls lack programmatic labels

Evidence: Automated label scan found missing labels for:

- `#cardTitle`
- `#cardParent`
- `input.form-input.form-child-input`

Likely source: labels are adjacent text labels but not connected with `for`/`id` in `www/src/rendering.js:588`, `www/src/rendering.js:732`, and child inputs near `www/src/rendering.js:799` and `www/src/rendering.js:816`.

Impact: Screen readers may announce these as unlabeled controls.

Fix: Add `for` attributes to labels and matching control IDs, wrap controls in labels, or add concise `aria-label` values.

### A11Y-3 - Medium - Custom overlays are not exposed as modal dialogs

Evidence: The menu and Plugin Manager overlays had no `role="dialog"` and no `aria-modal="true"`. Plugin Manager close button accessible name was only the close glyph.

Likely source: menu overlay starts in `www/index.html:48`; Plugin Manager overlay is created in `www/src/data.js:1232-1240`.

Impact: Assistive tech users may not get correct modal context, title, or focus expectations.

Fix: Add `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` to overlays. Give close buttons `aria-label="Close"`. Restore focus to opener on close.

### SEC-1 - Medium - CSP allows connections to any origin

Evidence: Deployed CSP includes `connect-src ... *` at `www/index.html:18`.

Impact: This weakens the boundary for plugins and optional integrations. It makes it harder to reason about data exfiltration risk in a local-first app.

Fix: Restrict `connect-src` to known storage/gallery endpoints. If arbitrary plugin URL fetch is a feature, gate it behind explicit consent and consider a separate trusted/untrusted plugin network policy.

### SEC-2 - Medium - CSP permits `unsafe-eval`

Evidence: Deployed CSP includes `script-src 'self' 'unsafe-eval' ...` at `www/index.html:15`.

Impact: This is likely tied to the JSON plugin setup function model, but it expands XSS/plugin abuse blast radius.

Fix: Keep it only if required. Longer term, move plugin execution toward sandboxed workers/iframes, signed/precompiled packages, or a stricter limited DSL for common plugin cases.

### DEP-1 - Medium/High - Current npm audit findings in dev/tooling chain

Evidence: `npm audit --json` reported 8 vulnerabilities: 1 high, 6 moderate, 1 low. The high item is on `vite` via Windows dev-server path handling advisories; moderate items include `tar`, `brace-expansion`, `glob/minimatch/rimraf`, and `@capacitor/cli` transitive exposure.

Impact: The deployed static app is not necessarily directly vulnerable, but the development and release chain is carrying known advisories.

Fix: Track patched Vite/Capacitor versions, run `npm audit` in CI, and update/pin when fixes are available. Treat Windows dev-server advisories as relevant because this project is actively built/tested on Windows.

### A11Y-4 - Low - Escape-close path accumulates menu focus-trap listeners

Evidence: After repeated menu open/Escape cycles, instrumentation showed `.menu-panel:keydown` count at 10.

Likely source: close button and overlay-click paths call `menuFocusTrapCleanup()` in `www/src/rendering.js:1347-1361`; the global Escape path uses `closeMenu()` in `www/src/systems.js:1130-1157`, which removes the overlay class but does not call the cleanup.

Impact: Long keyboard-heavy sessions can accumulate redundant listeners and make focus behavior harder to reason about.

Fix: Centralize menu close behavior so every close path invokes focus-trap cleanup and nulls the cleanup handle.

### A11Y-1 - Low - Some mobile touch targets are narrow/short

Evidence: Mobile probes found header icon buttons at 36x44 px, search input height at 39 px, and dataset selector as small as 60x24 px.

Impact: Usable, but below the common 44x44 px touch target goal, especially for repeated mobile use.

Fix: Add mobile min-width/min-height for header icon buttons, search controls, density buttons, and selects.

### A11Y-5 - Low - Plugin Manager tab contrast sample below 4.5:1

Evidence: Computed contrast scan found `button.tab-btn` text at ratio 3.68 in the Plugin Manager sample.

Impact: Low-vision users may struggle with inactive tab text.

Fix: Darken inactive tab text or adjust background/token pairing. Verify light, dark, and high-contrast modes.

### HTML-1 - Low - `index.html` has an extra closing `</div>`

Evidence: Static count found 45 opening divs and 46 closing divs. The extra close appears around `www/index.html:121`.

Impact: Browsers recover, and smoke testing passed, but malformed HTML can cause surprising layout/focus issues later.

Fix: Remove the extra close tag and add an HTML validation step to CI.

### PRIV/PERF-1 - Low - Optional auth scripts load on startup

Evidence: Initial page loaded Google Identity Services and MSAL script resources even though the tested path was local-only. The slowest resource entry was `https://accounts.google.com/gsi/client` at ~217ms.

Impact: This adds third-party contact and startup work before the user opts into remote storage. For a local-first app, lazy loading would better match the privacy story.

Fix: Lazy-load Google/MS auth libraries when a user chooses the corresponding off-device storage integration.

## Stress Results

| Scenario | Result |
|---|---:|
| 1,000-card seeded dataset load | 1,027 ms |
| 1,000-card full scroll render | 1,000 cards rendered in 1,834 ms |
| 1,000-card fuzzy search | 91 results in 563 ms |
| 3,000-card seeded dataset load | 1,122 ms |
| 3,000-card full scroll render | 3,000 cards rendered in 5,148 ms |
| 3,000-card fuzzy search | 273 results in 573 ms |
| Public API burst creation | 200 cards in 1,418 ms |

Interpretation:

- The current batching strategy is effective for the tested dataset sizes.
- Search remained quick at 3,000 cards.
- Full-page scrolling eventually renders every card into the DOM; that is acceptable at 3,000, but true virtualization/windowing will matter if users reach 10,000+ visible root cards.
- LocalStorage payloads stayed small in this test: about 308 KB for 1,000 cards and 798 KB for 3,000 cards.

## Screenshots

- `screenshots/01-smoke-desktop-empty.png`
- `screenshots/02-functional-plugin-manager.png`
- `screenshots/03-responsive-mobile-360.png`
- `screenshots/03-responsive-small-mobile-320.png`
- `screenshots/03-responsive-tablet-768.png`
- `screenshots/03-responsive-desktop-1366.png`
- `screenshots/04-stress-1000.png`
- `screenshots/04-stress-3000.png`

## Final Review

CardSpoke feels thoughtfully built for its goal: lightweight, local-first knowledge cards with a real plugin architecture. The product has several strong fundamentals: fast static delivery, offline app-shell support, a clear local-save message, good repo documentation, broad unit coverage, and a surprisingly capable plugin manager for a small app.

The next quality tier is mostly hardening rather than reinvention. Fix the new-card tag loss first because it directly affects user data. Then make keyboard search honest and reliable, bring modals/forms up to accessibility expectations, and tighten the security posture around plugins and network access. After that, CardSpoke would benefit from formal performance budgets and a larger-dataset benchmark so the current good scaling behavior stays protected.

Overall rating: solid beta-quality local-first app with strong architecture and test discipline, ready for targeted accessibility/security polish before calling it broadly production-hardened.
