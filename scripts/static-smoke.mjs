/*
 * Copyright 2026 Jeffrey Guntly (JX Holdings, LLC)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Static release smoke checks (CS-009).
 *
 * Fast, dependency-free assertions about the built site that gate the
 * GitHub Pages deployment. These catch the class of defects that unit
 * tests missed in the past: calls to functions that do not exist in the
 * bundle, an incomplete dist/ preview site, and version drift between
 * package.json, the source constants, and index.html.
 *
 * Usage: node scripts/static-smoke.mjs   (exit code 0 = pass)
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];

function check(label, ok, detail = '') {
  if (ok) {
    console.log(`  ok  ${label}`);
  } else {
    failures.push(label + (detail ? ` — ${detail}` : ''));
    console.error(`FAIL  ${label}${detail ? ' — ' + detail : ''}`);
  }
}

function read(rel) {
  return readFileSync(resolve(ROOT, rel), 'utf8');
}

// ── Site completeness ────────────────────────────────────────────────────
const SITE_FILES = [
  'www/index.html', 'www/styles.css', 'www/app.js', 'www/app-loader.js',
  'www/service-worker.js', 'www/manifest.webmanifest', 'www/offline-status.js'
];
for (const file of SITE_FILES) {
  check(`${file} exists`, existsSync(resolve(ROOT, file)));
}

// dist/ must be a complete previewable site after `npm run build` (CS-006)
if (existsSync(resolve(ROOT, 'dist/app.js'))) {
  check('dist/index.html exists (preview serves the app, not a 404)',
    existsSync(resolve(ROOT, 'dist/index.html')));
  check('dist/styles.css exists', existsSync(resolve(ROOT, 'dist/styles.css')));
}

// ── Bundle sanity ────────────────────────────────────────────────────────
const bundle = read('www/app.js');

// Calls to functions that must exist: every `name(` call with no definition
// would throw at runtime. Explicitly assert the regressions found in audits.
check('bundle does not call removed scheduleCloudSync()', !/\bscheduleCloudSync\s*\(/.test(bundle));

// The dialog primitives must be top-level (not nested in a closure): a call
// site before any definition means every confirm/prompt flow breaks.
for (const fn of ['showConfirmDialog', 'showPromptDialog', 'showModalDialog', 'showChoiceDialog']) {
  const def = bundle.match(new RegExp('^\\s*(async\\s+)?function ' + fn + '\\b', 'm'));
  check(`bundle defines ${fn}`, !!def);
}

// PIN handling invariants (CS-001): no plaintext PIN persisted in metadata.
check('bundle never persists metadata.pin on dataset creation', !/pin:\s*pin\s*\|\|\s*null/.test(bundle));
check('bundle has encrypted-envelope detection', bundle.includes('isEncryptedEnvelope'));
check('bundle quarantines corrupt payloads instead of overwriting (CS-004)', bundle.includes('.corrupt.'));

// ── Version consistency (CS-010) ─────────────────────────────────────────
const pkg = JSON.parse(read('package.json'));
const stateSrc = read('www/src/state.js');
const versionInState = (stateSrc.match(/APP_VERSION = '([^']+)'/) || [])[1];
const indexHtml = read('www/index.html');
const versionInHtml = (indexHtml.match(/name="app:version" content="([^"]+)"/) || [])[1];
const versionInBundle = (bundle.match(/const APP_VERSION = '([^']+)'/) || [])[1];

check(`package.json (${pkg.version}) matches state.js (${versionInState})`, pkg.version === versionInState);
check(`package.json (${pkg.version}) matches index.html meta (${versionInHtml})`, pkg.version === versionInHtml);
check(`package.json (${pkg.version}) matches built bundle (${versionInBundle})`, pkg.version === versionInBundle);

const lock = JSON.parse(read('package-lock.json'));
check(`package-lock.json root version (${lock.version}) matches package.json`, lock.version === pkg.version);

// ── CSP still present and plugin-honest ──────────────────────────────────
check('index.html ships a CSP', indexHtml.includes('Content-Security-Policy'));
check('CSP restricts connect-src', /connect-src [^;]*raw\.githubusercontent\.com/.test(indexHtml));

if (failures.length) {
  console.error(`\n${failures.length} smoke check(s) failed.`);
  process.exit(1);
}
console.log('\nAll static smoke checks passed.');
