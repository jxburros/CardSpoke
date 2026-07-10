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
 * Browser-level release QA for CardSpoke.
 *
 * Drives the real built app (www/) in headless Chromium and verifies the
 * release-blocking flows end to end:
 *
 *   1. create/save/reload with an honest "Saved" status        (CS-003)
 *   2. encrypted dataset unlock — wrong PIN, right PIN, save   (CS-001)
 *   3. locked dataset: writes blocked, envelope untouched       (CS-001)
 *   4. corrupt storage: quarantine + recovery, no overwrite     (CS-004)
 *   5. instance import: cards/plugins/bookmarks/theme restore   (CS-005)
 *   6. plugin full-trust consent + enable/remove                (CS-002)
 *   7. dataset create (PIN) / list / switch / search-all        (NEW-2/3/4)
 *   8. dialog accessibility contract + Escape behavior          (CS-008/NEW-1)
 *   9. rich-text XSS payload stays inert
 *  10. 360px mobile layout has no horizontal overflow
 *
 * Requirements (CS-102 — reproducible from a clean checkout):
 *   npm ci                                   (playwright is a pinned devDependency)
 *   npx playwright install --with-deps chromium   (or reuse an existing binary
 *   via CHROMIUM_PATH / PLAYWRIGHT_BROWSERS_PATH)
 *
 * Usage: node scripts/browser-qa.mjs
 */

import { createServer } from 'http';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { resolve, dirname, extname, join, normalize } from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright-core';
import { encryptStorePayload, isEncryptedEnvelope, decryptStorePayload } from '../www/src/core/dataset-crypto.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const WWW = resolve(ROOT, 'www');
const ART_DIR = process.env.QA_ARTIFACT_DIR || resolve(ROOT, 'qa-artifacts');
// Explicit binary overrides first; otherwise leave undefined so playwright
// resolves the chromium it installed via `npx playwright install chromium`.
const EXECUTABLE = (() => {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  if (process.env.PLAYWRIGHT_BROWSERS_PATH) {
    const candidate = join(process.env.PLAYWRIGHT_BROWSERS_PATH, 'chromium');
    if (existsSync(candidate)) return candidate;
  }
  if (existsSync('/opt/pw-browsers/chromium')) return '/opt/pw-browsers/chromium';
  return undefined;
})();

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.map': 'application/json',
  '.webmanifest': 'application/manifest+json', '.png': 'image/png'
};

function startServer() {
  return new Promise(res => {
    const server = createServer((req, resp) => {
      const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      let file = normalize(join(WWW, urlPath === '/' ? 'index.html' : urlPath));
      if (!file.startsWith(WWW) || !existsSync(file)) {
        resp.writeHead(404); resp.end('not found'); return;
      }
      resp.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
      resp.end(readFileSync(file));
    });
    server.listen(0, '127.0.0.1', () => res(server));
  });
}

// ── tiny assertion/reporting harness ──────────────────────────────────────
const results = [];
let currentScenario = '';
let scenarioFailed = false;

function check(label, ok, detail = '') {
  const line = `${ok ? '  ok ' : ' FAIL'}  [${currentScenario}] ${label}${!ok && detail ? ' — ' + detail : ''}`;
  console.log(line);
  if (!ok) scenarioFailed = true;
  results.push({ scenario: currentScenario, label, ok, detail });
}

async function scenario(name, fn) {
  currentScenario = name;
  scenarioFailed = false;
  try {
    await fn();
  } catch (err) {
    check('scenario completed without exception', false, err.message + '\n' + (err.stack || ''));
  }
  console.log(scenarioFailed ? `>> ${name}: FAILED\n` : `>> ${name}: passed\n`);
}

// Console noise that is not an app defect (blocked externals in the QA env)
// plus the intentional diagnostic the recovery path logs by design.
const IGNORED_CONSOLE = [
  /favicon/i,
  /raw\.githubusercontent\.com/,
  /Failed to load resource.*(404|net::)/,
  /ERR_(TUNNEL|PROXY|NAME|INTERNET|CONNECTION)/,
  /Failed to parse stored data — entering recovery mode/
];

function watchConsole(page, sink) {
  page.on('console', msg => {
    if (msg.type() === 'error' && !IGNORED_CONSOLE.some(re => re.test(msg.text()))) {
      sink.push('console.error: ' + msg.text());
    }
  });
  page.on('pageerror', err => sink.push('pageerror: ' + err.message));
}

// offline-status.js rewrites the indicator to "Saved locally" — accept both.
const waitSaved = page => page.waitForFunction(
  () => /^Saved( locally)?$/.test(document.getElementById('saveStatus')?.textContent || ''),
  null, { timeout: 8000 });

// The save-status text next to the header buttons reflows as it cycles
// Saving→Saved→'', which can keep #menuBtn just-barely-in-motion and trip
// Playwright's stability gate. The button itself is fine, so open the menu
// with force after clearing the status.
async function openMenu(page) {
  await page.evaluate(() => { const s = document.getElementById('saveStatus'); if (s) s.textContent = ''; });
  await page.click('#menuBtn', { force: true });
  await page.waitForSelector('#menuOverlay.show', { timeout: 8000 });
}

async function createCardViaUI(page, title, body = '') {
  // Reset the save indicator first so waitSaved() observes THIS save, not a
  // stale "Saved locally" left over from a previous write (the offline
  // helper leaves the text set for ~1s).
  await openMenu(page);
  await page.click('#menuNewCard');
  await page.waitForSelector('#cardTitle');
  await page.fill('#cardTitle', title);
  if (body) await page.fill('#cardBody', body);
  await page.click('form button[type=submit]');
  // The card exists in the store synchronously; then wait for it to persist.
  await page.waitForFunction(
    t => Object.values(window.store.cards).some(c => c.title === t),
    title, { timeout: 8000 });
  await waitSaved(page);
}

// Card creation navigates to the read view; the list page (where the search
// bar and card tiles live) is reached via the Home button. The save-status
// text next to the header buttons resizes as it cycles Saving→Saved→'',
// nudging #homeBtn enough to fail Playwright's stability gate — so clear it
// and use force to skip the stability wait.
async function goHome(page) {
  await page.evaluate(() => { const s = document.getElementById('saveStatus'); if (s) s.textContent = ''; });
  await page.click('#homeBtn', { force: true });
  await page.waitForSelector('#searchInput', { state: 'visible', timeout: 8000 });
  await page.waitForSelector('#main .card-tile, #main .empty', { timeout: 8000 }).catch(() => {});
}

// ── main ──────────────────────────────────────────────────────────────────
const server = await startServer();
const BASE = `http://127.0.0.1:${server.address().port}/index.html`;
mkdirSync(ART_DIR, { recursive: true });

const browser = await chromium.launch({ executablePath: EXECUTABLE });

async function freshPage(errors, opts = {}) {
  const context = await browser.newContext({ viewport: opts.viewport || { width: 1280, height: 900 } });
  // Suppress the first-run "Welcome to CardSpoke!" onboarding modal, which
  // otherwise pops 500ms after boot and intercepts clicks mid-scenario. It is
  // covered by its own scenario; every other flow starts past onboarding.
  // addInitScript runs before page scripts on every load/reload.
  if (!opts.keepOnboarding) {
    await context.addInitScript(() => {
      try { localStorage.setItem('cardspoke_hasSeenGettingStarted', 'true'); } catch (e) {}
    });
  }
  const page = await context.newPage();
  watchConsole(page, errors);
  return { context, page };
}

// 1 ─ Core save/reload with honest status (CS-003) ─────────────────────────
await scenario('core-save-reload (CS-003)', async () => {
  const errors = [];
  const { context, page } = await freshPage(errors);
  await page.goto(BASE);
  await page.waitForSelector('#main');

  await createCardViaUI(page, 'QA Card One', 'first body');
  check('save status reads "Saved" (not "Save failed")', true);
  const errToast = await page.$('.toast.error');
  check('no error toast after save', !errToast);

  await page.reload();
  await page.waitForSelector('#main');
  const persisted = await page.evaluate(() =>
    Object.values(window.store.cards).some(c => c.title === 'QA Card One'));
  check('card persists across reload', persisted);
  check('no console/page errors', errors.length === 0, errors.join(' | '));
  await context.close();
});

// 2 ─ Encrypted dataset unlock (CS-001) ────────────────────────────────────
const PIN = '2468';
const pinKey = 'cards_qa_pin_1';
const encryptedFixture = await encryptStorePayload(JSON.stringify({
  rootOrder: ['enc1'],
  cards: { enc1: { id: 'enc1', title: 'Encrypted Card', body: 'secret body', parentId: null, children: [], tags: [], kind: 'note', modsData: {} } },
  plugins: {}, bookmarks: [], recentCards: [], viewMode: 'normal', activeTheme: 'light',
  metadata: { name: 'QA PIN Vault', storageType: 'localstorage', storageConfig: {}, createdAt: 1 }
}), PIN);

await scenario('encrypted-dataset-unlock (CS-001)', async () => {
  const errors = [];
  const { context, page } = await freshPage(errors);
  await page.goto(BASE);
  await page.waitForSelector('#main');
  await page.evaluate(([key, envelope]) => {
    localStorage.setItem('activeInstance', key);
    localStorage.setItem(key, envelope);
  }, [pinKey, encryptedFixture]);

  await page.reload();
  const pinInput = await page.waitForSelector('.modal input[type=password]', { timeout: 8000 });
  check('unlock dialog appears before any store parse', !!pinInput);

  // Wrong PIN: dialog persists, envelope untouched
  await pinInput.fill('9999');
  await page.click('.modal-actions button.btn-primary');
  const retryInput = await page.waitForSelector('.modal input[type=password]', { timeout: 8000 });
  check('wrong PIN re-prompts instead of proceeding', !!retryInput);
  let stored = await page.evaluate(k => localStorage.getItem(k), pinKey);
  check('envelope unchanged after wrong PIN', stored === encryptedFixture);

  // Correct PIN: data restored
  await retryInput.fill(PIN);
  await page.click('.modal-actions button.btn-primary');
  await page.waitForFunction(() =>
    window.store && Object.values(window.store.cards).some(c => c.title === 'Encrypted Card'),
    null, { timeout: 8000 });
  check('correct PIN restores the encrypted cards', true);

  // A save through the session PIN must stay encrypted and keep the data.
  await createCardViaUI(page, 'Added After Unlock');
  // Poll the persisted envelope until it reflects the new card (the encrypted
  // write goes through requestIdleCallback, so give it a beat to land).
  let titles = [];
  let parsedStored = null;
  for (let i = 0; i < 20; i++) {
    stored = await page.evaluate(k => localStorage.getItem(k), pinKey);
    parsedStored = JSON.parse(stored);
    if (isEncryptedEnvelope(parsedStored)) {
      titles = Object.values(JSON.parse(await decryptStorePayload(stored, PIN)).cards).map(c => c.title);
      if (titles.includes('Added After Unlock')) break;
    }
    await page.waitForTimeout(150);
  }
  check('dataset stays encrypted after new save', isEncryptedEnvelope(parsedStored));
  check('re-encrypted payload contains old + new cards',
    titles.includes('Encrypted Card') && titles.includes('Added After Unlock'), titles.join(','));
  check('PIN never appears in persisted payload', !stored.includes(PIN));
  check('no console/page errors', errors.length === 0, errors.join(' | '));
  await context.close();
});

// 3 ─ Declining unlock locks writes (CS-001) ───────────────────────────────
await scenario('locked-dataset-blocks-writes (CS-001)', async () => {
  const errors = [];
  const { context, page } = await freshPage(errors);
  await page.goto(BASE);
  await page.waitForSelector('#main');
  await page.evaluate(([key, envelope]) => {
    localStorage.setItem('activeInstance', key);
    localStorage.setItem(key, envelope);
  }, [pinKey, encryptedFixture]);

  await page.reload();
  await page.waitForSelector('.modal input[type=password]');
  // "Not now" is the non-primary action in the prompt dialog
  await page.click('.modal-actions button.btn:not(.btn-primary)');
  await page.waitForSelector('#datasetLockScreen', { timeout: 8000 });
  check('lock screen shown after declining unlock', true);

  // Attempt a write through the public API — must not touch the envelope
  await page.evaluate(() => window.CardSpoke.utils.createCard({ title: 'should-not-persist' }));
  await page.waitForTimeout(1200); // longer than the save debounce
  const stored = await page.evaluate(k => localStorage.getItem(k), pinKey);
  check('envelope byte-identical while locked', stored === encryptedFixture);
  const status = await page.evaluate(() => document.getElementById('saveStatus').textContent);
  check('save status reports the locked state', /locked/i.test(status), status);

  // Escape must NOT dismiss the lock screen
  await page.keyboard.press('Escape');
  check('lock screen not dismissable via Escape', !!(await page.$('#datasetLockScreen')));

  // Unlock from the lock screen works
  await page.click('#datasetLockScreen button.btn-primary');
  const pinInput = await page.waitForSelector('.modal input[type=password]');
  await pinInput.fill(PIN);
  await page.click('.modal-actions button.btn-primary');
  await page.waitForFunction(() =>
    Object.values(window.store.cards).some(c => c.title === 'Encrypted Card'), null, { timeout: 8000 });
  check('unlock from lock screen restores data', true);
  check('no console/page errors', errors.length === 0, errors.join(' | '));
  await context.close();
});

// 4 ─ Corrupt storage quarantine + recovery (CS-004) ───────────────────────
await scenario('corrupt-storage-recovery (CS-004)', async () => {
  const errors = [];
  const { context, page } = await freshPage(errors);
  const corruptKey = 'cards_qa_corrupt';
  const corruptPayload = '{"cards": {"a": TRUNCATED';
  await page.goto(BASE);
  await page.waitForSelector('#main');
  await page.evaluate(([key, payload]) => {
    localStorage.setItem('activeInstance', key);
    localStorage.setItem(key, payload);
  }, [corruptKey, corruptPayload]);

  await page.reload();
  await page.waitForSelector('#corruptRecoveryScreen', { timeout: 8000 });
  check('recovery screen shown for unreadable data', true);

  const state = await page.evaluate(k => ({
    original: localStorage.getItem(k),
    quarantine: Object.keys(localStorage).filter(x => x.startsWith(k + '.corrupt.'))
  }), corruptKey);
  check('original payload untouched', state.original === corruptPayload);
  check('quarantine copy created', state.quarantine.length === 1, state.quarantine.join(','));

  // Explicit "Start fresh" is the only way to overwrite
  await page.click('#corruptRecoveryScreen button.btn-danger');
  await page.waitForSelector('.modal-actions');
  await page.click('.modal-actions button.btn-danger');
  await page.waitForFunction(() => !document.getElementById('corruptRecoveryScreen'), null, { timeout: 8000 });
  await waitSaved(page);
  const after = await page.evaluate(([k]) => ({
    active: localStorage.getItem(k),
    quarantine: Object.keys(localStorage).filter(x => x.startsWith(k + '.corrupt.'))
  }), [corruptKey]);
  check('start-fresh writes a valid store', (() => { try { return !!JSON.parse(after.active).cards; } catch { return false; } })());
  check('quarantine copy survives the reset', after.quarantine.length === 1);
  check('no console/page errors', errors.length === 0, errors.join(' | '));
  await context.close();
});

// 5 ─ Instance import restores everything (CS-005) ─────────────────────────
await scenario('instance-import-round-trip (CS-005)', async () => {
  const errors = [];
  const { context, page } = await freshPage(errors);
  await page.goto(BASE);
  await page.waitForSelector('#main');

  const fixture = {
    exportType: 'instance', formatVersion: 2, appVersion: '0.18.0', schemaVersion: 4, timestamp: 1,
    cards: {
      p1: { id: 'p1', title: 'Imported Parent', body: 'see [[Imported Child]]', parentId: null, children: ['c1'], tags: ['imported'], kind: 'note', modsData: {} },
      c1: { id: 'c1', title: 'Imported Child', body: 'child body', parentId: 'p1', children: [], tags: [], kind: 'note', modsData: {} }
    },
    rootIds: ['p1'],
    plugins: {
      'qa-badge': {
        definition: {
          manifest: { id: 'qa-badge', name: 'QA Badge', version: '1.0.0', author: 'QA', layer: 'feature', permissions: [] },
          css: null, js: "ctx.logger.info('qa badge ready');", teardownJs: null
        },
        enabled: false
      }
    },
    bookmarks: ['c1'], recentCards: ['p1'], viewMode: 'compact', activeTheme: 'dark',
    metadata: { name: 'QA Import Fixture' }
  };

  await openMenu(page);
  await page.click('#menuUpload');
  await page.waitForSelector('#uploadModal.show, .modal-overlay.show #fileInputJSON, #fileInputJSON', { timeout: 8000 });
  await page.setInputFiles('#fileInputJSON', {
    name: 'qa-instance.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(fixture))
  });

  // Plugin security confirm (real dialog — NEW-1 in action)
  const importBtn = await page.waitForSelector('.modal-actions button.btn-danger', { timeout: 8000 });
  check('plugin import warning dialog appears', !!importBtn);
  await importBtn.click();
  await waitSaved(page);

  const snap = await page.evaluate(() => {
    const cards = Object.values(window.store.cards);
    const byTitle = t => cards.find(c => c.title === t);
    const parent = byTitle('Imported Parent');
    const child = byTitle('Imported Child');
    return {
      parentOk: !!parent, childOk: !!child,
      hierarchyOk: !!(parent && child && child.parentId === parent.id && parent.children.includes(child.id)),
      bookmarkOk: !!(child && window.store.bookmarks.includes(child.id)),
      recentOk: !!(parent && window.store.recentCards.includes(parent.id)),
      pluginShapeOk: !!(window.store.plugins['qa-badge'] && window.store.plugins['qa-badge'].definition &&
        typeof window.store.plugins['qa-badge'].definition.js === 'string'),
      pluginRegistered: !!(window.CardSpoke.Plugin.get('qa-badge')),
      viewMode: window.store.viewMode,
      theme: window.store.activeTheme,
      darkApplied: document.documentElement.classList.contains('dark')
    };
  });
  check('cards + hierarchy imported', snap.parentOk && snap.childOk && snap.hierarchyOk);
  check('bookmarks remapped to new IDs', snap.bookmarkOk);
  check('recent cards remapped', snap.recentOk);
  check('plugin restored in runnable {definition} shape', snap.pluginShapeOk);
  check('plugin registered with runtime after import', snap.pluginRegistered);
  check('view mode restored', snap.viewMode === 'compact', snap.viewMode);
  check('theme restored and applied', snap.theme === 'dark' && snap.darkApplied);
  check('no console/page errors', errors.length === 0, errors.join(' | '));
  await context.close();
});

// 6 ─ Full-trust consent on enable (CS-002) ────────────────────────────────
await scenario('plugin-full-trust (CS-002)', async () => {
  const errors = [];
  const { context, page } = await freshPage(errors);
  await page.goto(BASE);
  await page.waitForSelector('#main');

  // Seed a JS feature plugin (suspended) directly in the store and register it.
  await page.evaluate(async () => {
    window.store.plugins['qa-badge'] = {
      definition: {
        manifest: { id: 'qa-badge', name: 'QA Badge', version: '1.0.0', author: 'QA', layer: 'feature', permissions: [] },
        css: null, js: "globalThis.__qaBadgeRan = (globalThis.__qaBadgeRan || 0) + 1;", teardownJs: null
      },
      enabled: false
    };
    window.save(true);
    await window.CardSpoke.Plugin.syncFromStore();
  });

  await openMenu(page);
  await page.click('#menuPluginManager');
  await page.waitForSelector('.tab-btn');

  const enableBtn = await page.waitForSelector('.modal-overlay.show .btn:has-text("Enable")');
  await enableBtn.click();
  const trustDialog = await page.waitForSelector('.permission-modal [role=dialog]', { timeout: 8000 });
  check('full-trust dialog shown before plugin JS runs', !!trustDialog);
  const trustText = await trustDialog.textContent();
  check('dialog states plugins are NOT sandboxed', /not sandboxed/i.test(trustText));

  // Decline first: plugin must stay suspended and JS must not have run
  await page.click('.permission-modal button.btn-secondary');
  await page.waitForTimeout(300);
  let state = await page.evaluate(() => ({
    enabled: window.CardSpoke.Plugin.get('qa-badge').enabled,
    ran: globalThis.__qaBadgeRan || 0,
    trusted: localStorage.getItem('cardspoke_plugin_trust') || '[]'
  }));
  check('declining consent keeps plugin suspended', state.enabled === false);
  check('declining consent means plugin JS never ran', state.ran === 0);
  check('no trust recorded on decline', !state.trusted.includes('qa-badge'));

  // Accept: plugin runs and consent persists
  const enableBtn2 = await page.waitForSelector('.modal-overlay.show .btn:has-text("Enable")');
  await enableBtn2.click();
  await page.waitForSelector('.permission-modal [role=dialog]');
  await page.click('.permission-modal button.btn-primary');
  await page.waitForFunction(() => window.CardSpoke.Plugin.get('qa-badge').enabled === true, null, { timeout: 8000 });
  state = await page.evaluate(() => ({
    ran: globalThis.__qaBadgeRan || 0,
    trusted: localStorage.getItem('cardspoke_plugin_trust') || '[]'
  }));
  check('accepting consent enables the plugin and runs its JS', state.ran === 1);
  check('trust grant persisted', state.trusted.includes('qa-badge'));

  // The enabled flag persists through the debounced save(); wait for it to
  // actually land in localStorage before reloading, or the reload would read
  // a store that still says enabled=false.
  await page.waitForFunction(() => {
    try {
      const raw = localStorage.getItem(localStorage.getItem('activeInstance') || 'nested_cards_store');
      return JSON.parse(raw).plugins['qa-badge'].enabled === true;
    } catch { return false; }
  }, null, { timeout: 8000 });

  // Reload: trusted plugin re-enables without a new dialog
  await page.reload();
  await page.waitForSelector('#main');
  await page.waitForFunction(() => {
    const p = window.CardSpoke.Plugin.get('qa-badge');
    return p && p.enabled === true;
  }, null, { timeout: 8000 });
  const dialogAfterReload = await page.$('.permission-modal');
  check('trusted plugin re-enables on reload without re-prompt', !dialogAfterReload);
  check('no console/page errors', errors.length === 0, errors.join(' | '));
  await context.close();
});

// 6b ─ Plugin survives a dataset round-trip (reconcile teardown) ────────────
await scenario('plugin-dataset-round-trip (NEW-4/reconcile)', async () => {
  const errors = [];
  const { context, page } = await freshPage(errors);
  await page.goto(BASE);
  await page.waitForSelector('#main');

  // Seed: default dataset has a trusted, enabled JS plugin that appends a
  // header marker; a second empty dataset has no plugins. Trust is pre-granted
  // so enabling never prompts.
  await page.evaluate(() => {
    localStorage.setItem('cardspoke_plugin_trust', JSON.stringify(['ds-marker']));
    const pluginEntry = {
      definition: {
        manifest: { id: 'ds-marker', name: 'DS Marker', version: '1.0.0', author: 'QA', layer: 'feature', permissions: [] },
        css: null,
        js: "var d=document.createElement('div'); d.id='__ds_marker'; document.body.appendChild(d); ctx._el=d;",
        teardownJs: "if (ctx._el && ctx._el.parentNode) ctx._el.parentNode.removeChild(ctx._el);"
      },
      enabled: true
    };
    // Default dataset store + a sibling empty dataset.
    const def = JSON.parse(localStorage.getItem('nested_cards_store') || '{}');
    def.cards = def.cards || {}; def.rootOrder = def.rootOrder || [];
    def.plugins = { 'ds-marker': pluginEntry };
    localStorage.setItem('nested_cards_store', JSON.stringify(def));
    localStorage.setItem('cards_empty_vault_1', JSON.stringify({
      rootOrder: [], cards: {}, plugins: {}, bookmarks: [], recentCards: [],
      viewMode: 'normal', activeTheme: 'light', metadata: { name: 'Empty Vault' }
    }));
    localStorage.setItem('activeInstance', 'nested_cards_store');
  });

  await page.reload();
  await page.waitForSelector('#main');
  await page.waitForFunction(() => {
    const p = window.CardSpoke.Plugin.get('ds-marker');
    return p && p.enabled === true && !!document.getElementById('__ds_marker');
  }, null, { timeout: 8000 });
  check('plugin enabled and its effect present in default dataset', true);

  // Switch to the empty dataset via the Dataset Manager (invokes reconcile).
  await openMenu(page);
  await page.click('#menuDataHub');
  await page.waitForSelector('.modal-overlay.show .btn:has-text("Switch Dataset")');
  await page.click('.modal-overlay.show .btn:has-text("Switch Dataset")');
  await page.waitForSelector('#newDatasetName');
  await page.click('.modal-overlay.show .btn-primary:has-text("Open")'); // Open the empty vault
  await page.waitForFunction(() =>
    localStorage.getItem('activeInstance') === 'cards_empty_vault_1', null, { timeout: 8000 });
  const afterSwitch = await page.evaluate(() => ({
    inRuntime: !!window.CardSpoke.Plugin.get('ds-marker'),
    markerPresent: !!document.getElementById('__ds_marker')
  }));
  check('plugin torn down from runtime on switch to a dataset without it', !afterSwitch.inRuntime);
  check('plugin DOM effect cleaned up on switch', !afterSwitch.markerPresent);

  // Switch back to default — the plugin must re-register AND re-enable (this is
  // the exact case the disable()-only reconcile got stuck on), no re-prompt.
  await openMenu(page);
  await page.click('#menuDataHub');
  await page.waitForSelector('.modal-overlay.show .btn:has-text("Switch Dataset")');
  await page.click('.modal-overlay.show .btn:has-text("Switch Dataset")');
  await page.waitForSelector('#newDatasetName');
  await page.click('.modal-overlay.show .btn-primary:has-text("Open")'); // Open default again
  await page.waitForFunction(() =>
    localStorage.getItem('activeInstance') === 'nested_cards_store', null, { timeout: 8000 });
  await page.waitForFunction(() => {
    const p = window.CardSpoke.Plugin.get('ds-marker');
    return p && p.enabled === true && !!document.getElementById('__ds_marker');
  }, null, { timeout: 8000 }).catch(() => {});
  const afterReturn = await page.evaluate(() => ({
    enabled: !!(window.CardSpoke.Plugin.get('ds-marker') && window.CardSpoke.Plugin.get('ds-marker').enabled),
    markerPresent: !!document.getElementById('__ds_marker'),
    markerCount: document.querySelectorAll('#__ds_marker').length,
    dialog: !!document.querySelector('.permission-modal')
  }));
  check('plugin re-enabled after switching back (reconcile fix)', afterReturn.enabled);
  check('plugin effect restored exactly once (no leak/dup)', afterReturn.markerPresent && afterReturn.markerCount === 1);
  check('no re-prompt for the already-trusted plugin', !afterReturn.dialog);
  check('no console/page errors', errors.length === 0, errors.join(' | '));
  await context.close();
});

// 7 ─ Dataset create/list/switch/search-all (NEW-2/3/4) ────────────────────
await scenario('dataset-manager-and-multisearch (NEW-2/3/4)', async () => {
  const errors = [];
  const { context, page } = await freshPage(errors);
  await page.goto(BASE);
  await page.waitForSelector('#main');
  await createCardViaUI(page, 'Alpha Base Card', 'lives in default dataset');

  // Open Dataset Manager: menu → Data & Export → Switch Dataset
  await openMenu(page);
  await page.click('#menuDataHub');
  await page.waitForSelector('.modal-overlay.show .btn:has-text("Switch Dataset")');
  await page.click('.modal-overlay.show .btn:has-text("Switch Dataset")');
  await page.waitForSelector('#newDatasetName');

  // CS-105: form labels are programmatically associated with their controls
  const labelWiring = await page.evaluate(() => {
    const wired = id => {
      const label = document.querySelector(`label[for="${id}"]`);
      return !!(label && label.control && label.control.id === id);
    };
    return {
      name: wired('newDatasetName'),
      storage: wired('newDatasetStorage'),
      pin: wired('newDatasetPin'),
      pinConfirm: wired('newDatasetPinConfirm'),
      pinDescribed: (document.getElementById('newDatasetPin') || {})
        .getAttribute?.('aria-describedby') === 'newDatasetPinHelp'
    };
  });
  check('dataset name label wired to its input (CS-105)', labelWiring.name);
  check('storage label wired to its select (CS-105)', labelWiring.storage);
  check('PIN label wired to its input (CS-105)', labelWiring.pin);
  check('PIN confirm label wired to its input (CS-105)', labelWiring.pinConfirm);
  check('PIN input described by its help text (CS-105)', labelWiring.pinDescribed);

  // CS-106: a mismatched PIN confirmation must block creation
  await page.fill('#newDatasetName', 'Mismatch Vault');
  await page.fill('#newDatasetPin', '1234');
  await page.fill('#newDatasetPinConfirm', '4321');
  await page.click('.modal-overlay.show .btn:has-text("+ Create Dataset")');
  await page.waitForTimeout(500);
  const afterMismatch = await page.evaluate(() => ({
    active: localStorage.getItem('activeInstance') || '',
    formStillOpen: !!document.getElementById('newDatasetName')
  }));
  check('mismatched PIN confirmation blocks dataset creation (CS-106)',
    !afterMismatch.active.startsWith('cards_mismatch_vault'));
  check('creation form stays open after PIN mismatch (CS-106)', afterMismatch.formStillOpen);
  await page.fill('#newDatasetPin', '');
  await page.fill('#newDatasetPinConfirm', '');

  // Create an unencrypted second dataset
  await page.fill('#newDatasetName', 'Plain Vault');
  await page.click('.modal-overlay.show .btn:has-text("+ Create Dataset")');
  await page.waitForFunction(() =>
    (localStorage.getItem('activeInstance') || '').startsWith('cards_plain_vault'), null, { timeout: 8000 });
  check('created dataset became active', true);
  // The switch renders the old card's read view (now missing); return to a
  // known list page before the next UI interaction.
  await goHome(page);
  await createCardViaUI(page, 'Beta Vault Card', 'lives in plain vault');

  // NEW-2: both datasets listed in the manager
  await openMenu(page);
  await page.click('#menuDataHub');
  await page.waitForSelector('.modal-overlay.show .btn:has-text("Switch Dataset")');
  await page.click('.modal-overlay.show .btn:has-text("Switch Dataset")');
  await page.waitForSelector('#newDatasetName');
  const listed = await page.evaluate(() => {
    const overlays = document.querySelectorAll('.modal-overlay.show');
    return overlays[overlays.length - 1].textContent;
  });
  check('manager lists the default dataset', listed.includes('nested_cards_store'));
  check('manager lists the created cards_* dataset (NEW-2)', listed.includes('cards_plain_vault'));

  // NEW-4: switch back via Open — must not throw and must reconcile
  await page.click('.modal-overlay.show .btn-primary:has-text("Open")');
  await page.waitForFunction(() =>
    localStorage.getItem('activeInstance') === 'nested_cards_store' &&
    Object.values(window.store.cards).some(c => c.title === 'Alpha Base Card'), null, { timeout: 8000 });
  check('Open switches back to the default dataset (NEW-4)', true);

  // NEW-3: search across all datasets from the default one. The dataset
  // selector lives in the search bar, which is only visible on the list page.
  await goHome(page);
  const options = await page.evaluate(() =>
    Array.from(document.getElementById('datasetSelector').options).map(o => o.value));
  check('dataset selector offers "all" scope', options.includes('all'), options.join(','));
  await page.selectOption('#datasetSelector', 'all');
  await page.fill('#searchInput', 'Vault Card');
  await page.press('#searchInput', 'Enter');
  await page.waitForSelector('.search-result', { timeout: 8000 });
  const resultsText = await page.evaluate(() => document.getElementById('main').textContent);
  check('search-all finds the other dataset\'s card (NEW-3)', resultsText.includes('Beta Vault Card'));

  // Clicking a cross-dataset result switches and opens it
  await page.click('.search-result');
  await page.waitForFunction(() =>
    (localStorage.getItem('activeInstance') || '').startsWith('cards_plain_vault'), null, { timeout: 8000 });
  check('cross-dataset result click switches dataset and opens the card', true);
  check('no console/page errors', errors.length === 0, errors.join(' | '));
  await context.close();
});

// 8 ─ Dialog accessibility + Escape stack (CS-008 / NEW-1) ─────────────────
await scenario('dialog-a11y-contract (CS-008/NEW-1)', async () => {
  const errors = [];
  const { context, page } = await freshPage(errors);
  await page.goto(BASE);
  await page.waitForSelector('#main');
  await createCardViaUI(page, 'Delete Me Card');

  // Plugin Manager gets the full dialog contract via the observer
  await openMenu(page);
  await page.click('#menuPluginManager');
  await page.waitForSelector('.modal-overlay.show .modal');
  const a11y = await page.evaluate(() => {
    const modal = document.querySelector('.modal-overlay.show .modal');
    const labelId = modal.getAttribute('aria-labelledby');
    return {
      role: modal.getAttribute('role'),
      ariaModal: modal.getAttribute('aria-modal'),
      labelResolves: !!(labelId && document.getElementById(labelId)?.textContent)
    };
  });
  check('generated modal has role=dialog', a11y.role === 'dialog');
  check('generated modal has aria-modal', a11y.ariaModal === 'true');
  check('aria-labelledby resolves to the visible title', a11y.labelResolves);

  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('.modal-overlay.show'), null, { timeout: 4000 });
  check('Escape closes the generated modal', true);

  // Card delete uses the shared confirm dialog (NEW-1 end-to-end).
  // Card tiles are on the list page — navigate home first.
  await goHome(page);
  await page.click('.card-tile');
  await page.waitForSelector('.btn:has-text("Delete")');
  await page.click('.btn:has-text("Delete")');
  const confirmDialog = await page.waitForSelector('.modal-overlay.show [role=dialog]', { timeout: 8000 });
  check('delete confirm dialog opens (NEW-1: no ReferenceError)', !!confirmDialog);

  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('.modal-overlay.show'), null, { timeout: 4000 });
  const stillThere = await page.evaluate(() =>
    Object.values(window.store.cards).some(c => c.title === 'Delete Me Card'));
  check('Escape cancels the delete', stillThere);

  await page.click('.btn:has-text("Delete")');
  await page.waitForSelector('.modal-overlay.show [role=dialog]');
  await page.click('.modal-actions .btn-danger');
  await page.waitForFunction(() =>
    !Object.values(window.store.cards).some(c => c.title === 'Delete Me Card'), null, { timeout: 8000 });
  check('confirming actually deletes the card', true);
  check('no console/page errors', errors.length === 0, errors.join(' | '));
  await context.close();
});

// 9 ─ XSS payload stays inert ──────────────────────────────────────────────
await scenario('xss-inert', async () => {
  const errors = [];
  const { context, page } = await freshPage(errors);
  await page.goto(BASE);
  await page.waitForSelector('#main');
  await createCardViaUI(page, 'XSS Probe',
    '<img src=x onerror="window.__xss1=1"><script>window.__xss2=1<' + '/script>[[link]]');
  const flags = await page.evaluate(() => [window.__xss1, window.__xss2]);
  check('inline handlers/scripts in card body do not execute', !flags[0] && !flags[1]);
  await page.reload();
  await page.waitForSelector('#main');
  const flagsAfter = await page.evaluate(() => [window.__xss1, window.__xss2]);
  check('payload still inert after reload', !flagsAfter[0] && !flagsAfter[1]);
  check('no console/page errors', errors.length === 0, errors.join(' | '));
  await context.close();
});

// 9b ─ First-run onboarding modal actually appears ─────────────────────────
await scenario('first-run-onboarding', async () => {
  const errors = [];
  const { context, page } = await freshPage(errors, { keepOnboarding: true });
  await page.goto(BASE);
  await page.waitForSelector('#main');
  // The onboarding modal is shown 500ms after boot on a first run with no cards.
  const modal = await page.waitForSelector('#gettingStartedModal.show', { timeout: 8000 }).catch(() => null);
  check('getting-started modal appears on first run', !!modal);
  if (modal) {
    const a11y = await page.evaluate(() => {
      const m = document.querySelector('#gettingStartedModal .menu-panel, #gettingStartedModal .modal');
      return m ? { role: m.getAttribute('role'), ariaModal: m.getAttribute('aria-modal') } : null;
    });
    check('onboarding modal carries dialog semantics', !!a11y && a11y.role === 'dialog' && a11y.ariaModal === 'true');
    // The primary "seen" path is the CTA, which marks it seen and opens the editor.
    await page.click('#gettingStartedModal .btn-primary:has-text("Create Your First Card")');
    await page.waitForSelector('#cardTitle', { timeout: 8000 });
    const seen = await page.evaluate(() => localStorage.getItem('cardspoke_hasSeenGettingStarted'));
    check('CTA marks onboarding seen and opens the editor', seen === 'true');
  }
  check('no console/page errors', errors.length === 0, errors.join(' | '));
  await context.close();
});

// 10 ─ Mobile viewport overflow + screenshots ──────────────────────────────
await scenario('responsive-360', async () => {
  const errors = [];
  const { context, page } = await freshPage(errors, { viewport: { width: 360, height: 740 } });
  await page.goto(BASE);
  await page.waitForSelector('#main');
  await createCardViaUI(page, 'Mobile Layout Card', 'body text for the mobile smoke');
  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check('no horizontal overflow at 360px', overflow <= 1, `overflow=${overflow}px`);
  await page.screenshot({ path: join(ART_DIR, 'mobile-360.png'), fullPage: false });
  check('no console/page errors', errors.length === 0, errors.join(' | '));
  await context.close();
});

await browser.close();
server.close();

// ── summary ───────────────────────────────────────────────────────────────
const failed = results.filter(r => !r.ok);
writeFileSync(join(ART_DIR, 'browser-qa-results.json'), JSON.stringify(results, null, 2));
console.log(`\n${results.length - failed.length}/${results.length} browser checks passed.`);
if (failed.length) {
  console.error(`${failed.length} FAILED:`);
  failed.forEach(f => console.error(`  - [${f.scenario}] ${f.label}${f.detail ? ' — ' + f.detail.split('\n')[0] : ''}`));
  process.exit(1);
}
