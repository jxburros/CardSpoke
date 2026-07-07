/**
 * Plugin Lifecycle Test Suite
 *
 * End-to-end tests of the plugin runtime against the REAL sample packages:
 * install → enable → suspend → re-enable → delete, persistence of the
 * enabled flag, reload survival (serialize store → fresh runtime →
 * syncFromStore), reinstall-as-update, safe mode, and permission revocation
 * on delete. This is the regression suite for the stability guarantees in
 * docs/PLUGIN_INVARIANTS.md.
 */

import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Plugin, resetForTesting } from '../www/src/core/plugin-api.js';
import { Permissions } from '../www/src/core/permissions.js';
import { Middleware } from '../www/src/core/middleware.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const samplesDir = join(__dirname, '..', 'sample-plugins');

function loadSample(relPath) {
  return JSON.parse(readFileSync(join(samplesDir, relPath), 'utf8'));
}

// ── Minimal fake DOM good enough for CSS injection, ui.inject and the
//    sample plugins' setup code ────────────────────────────────────────────
function makeFakeElement(tag) {
  const el = {
    tag,
    attrs: {},
    style: {},
    children: [],
    _textContent: '',
    _innerHTML: '',
    className: '',
    parentNode: null,
    dataset: {},
    // Mimic real DOM coupling: setting textContent replaces content (clears
    // children/innerHTML); setting innerHTML replaces the text. Enough for the
    // appName-override save/restore round-trip.
    get textContent() { return this._textContent; },
    set textContent(v) { this._textContent = String(v); this._innerHTML = String(v); this.children = []; this.childNodes = []; },
    get innerHTML() { return this._innerHTML; },
    set innerHTML(v) { this._innerHTML = String(v); },
    setAttribute(name, value) { this.attrs[name] = value; },
    getAttribute(name) { return this.attrs[name]; },
    appendChild(child) {
      child.parentNode = this;
      this.children.push(child);
      return child;
    },
    removeChild(child) {
      const i = this.children.indexOf(child);
      if (i !== -1) this.children.splice(i, 1);
      child.parentNode = null;
      return child;
    },
    insertBefore(child, ref) {
      child.parentNode = this;
      const i = ref ? this.children.indexOf(ref) : -1;
      if (i === -1) this.children.push(child); else this.children.splice(i, 0, child);
      return child;
    },
    replaceChild(newChild, oldChild) {
      const i = this.children.indexOf(oldChild);
      if (i !== -1) {
        this.children[i] = newChild;
        newChild.parentNode = this;
        oldChild.parentNode = null;
      }
      return oldChild;
    },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    classList: {
      add() {}, remove() {}, contains() { return false; }
    }
  };
  return el;
}

function makeFakeDom() {
  const head = makeFakeElement('head');
  const body = makeFakeElement('body');
  const header = makeFakeElement('header');
  header.className = 'header';
  // Brand button holds a logo <img> (as in www/index.html) so tests can prove
  // the appName override is applied AND fully restored.
  const brandBtn = makeFakeElement('button');
  brandBtn.id = 'brandBtn';
  brandBtn.innerHTML = '<img src="CardSpoke.svg" class="brand-logo"/>';

  const document = {
    head,
    body,
    createElement: (tag) => makeFakeElement(tag),
    createTextNode: (text) => ({ text }),
    getElementById(id) { return id === 'brandBtn' ? brandBtn : null; },
    querySelector(selector) {
      const styleMatch = /^style\[data-plugin-id="(.+)"\]$/.exec(selector);
      if (styleMatch) {
        return head.children.find(
          el => el.tag === 'style' && el.attrs['data-plugin-id'] === styleMatch[1]
        ) || null;
      }
      if (selector === '.header') return header;
      if (selector === 'body') return body;
      return null;
    },
    querySelectorAll() { return []; }
  };
  return { document, head, body, header, brandBtn };
}

function makeMockLocalStorage() {
  return {
    _data: {},
    getItem(key) { return Object.prototype.hasOwnProperty.call(this._data, key) ? this._data[key] : null; },
    setItem(key, value) { this._data[key] = String(value); },
    removeItem(key) { delete this._data[key]; },
    get length() { return Object.keys(this._data).length; },
    key(i) { return Object.keys(this._data)[i] || null; }
  };
}

let saveCount = 0;

function freshHarness() {
  resetForTesting();
  Middleware.clear();
  saveCount = 0;

  const dom = makeFakeDom();
  global.document = dom.document;
  global.localStorage = makeMockLocalStorage();

  global.window = {
    store: { rootOrder: [], cards: {}, plugins: {}, bookmarks: [], recentCards: [] },
    save: () => { saveCount++; },
    createCard: (title, body, parentId) => {
      const id = 'card_' + Math.random().toString(36).slice(2);
      global.window.store.cards[id] = { id, title, body, parentId, tags: [], children: [] };
      return id;
    },
    updateCard: (id, updates) => { Object.assign(global.window.store.cards[id] || {}, updates); },
    deleteCard: (id) => { delete global.window.store.cards[id]; },
    cloneCard: (card) => JSON.parse(JSON.stringify(card)),
    getTags: (cardId) => (global.window.store.cards[cardId] || {}).tags || [],
    addTag: (cardId, tag) => { (global.window.store.cards[cardId].tags = global.window.store.cards[cardId].tags || []).push(tag); return true; },
    removeTag: () => true,
    setTags: (cardId, tags) => { if (global.window.store.cards[cardId]) global.window.store.cards[cardId].tags = tags; return true; },
    getAllTags: () => [],
    showToast: () => {},
    APP_VERSION: '0.17.0',
    SCHEMA_VERSION: 4,
    localStorage: global.localStorage
  };
  Permissions.clearAll();
  return dom;
}

function grantAll(id, manifest) {
  if (manifest.permissions && manifest.permissions.length) {
    Permissions.grantPermissions(id, manifest.permissions);
  }
}

function appliedCss(dom, id) {
  return dom.head.children.find(
    el => el.tag === 'style' && el.attrs['data-plugin-id'] === id
  );
}

// ── Theme layer: install → auto-enable → suspend → reload → delete ────────
test('theme sample installs, auto-enables and applies CSS', async () => {
  const dom = freshHarness();
  const pkg = loadSample('themes/forest.json');
  const id = await Plugin.install(pkg);

  assert.is(id, 'forest-theme');
  assert.ok(Plugin.get(id).enabled, 'SAFE theme auto-enables');
  assert.ok(appliedCss(dom, id), 'CSS style tag injected');
  assert.ok(window.store.plugins[id], 'persisted to store.plugins');
  assert.is(window.store.plugins[id].enabled, true, 'persisted enabled flag is true');
  assert.ok(saveCount > 0, 'store was saved');
});

test('suspend persists enabled=false and removes CSS; re-enable restores both', async () => {
  const dom = freshHarness();
  const pkg = loadSample('themes/forest.json');
  const id = await Plugin.install(pkg);

  await Plugin.disable(id);
  assert.is(Plugin.get(id).enabled, false);
  assert.is(window.store.plugins[id].enabled, false, 'suspension persisted');
  assert.not.ok(appliedCss(dom, id), 'CSS removed on suspend');

  await Plugin.enable(id);
  assert.is(window.store.plugins[id].enabled, true, 're-enable persisted');
  assert.ok(appliedCss(dom, id), 'CSS re-applied');
});

test('plugins survive a simulated reload with their enabled state', async () => {
  let dom = freshHarness();
  await Plugin.install(loadSample('themes/forest.json'));
  const featurePkg = loadSample('features/auto-save-indicator.json');
  grantAll(featurePkg.id, featurePkg.manifest); // grant BEFORE install: enable() awaits consent otherwise
  await Plugin.install(featurePkg);
  await Plugin.disable('forest-theme'); // suspended before "reload"

  // JSON round-trip exactly like storage.js saveNow()/load()
  const persisted = JSON.parse(JSON.stringify(window.store));

  // Fresh runtime, same permission grants (they live in localStorage)
  const grantedLS = global.localStorage;
  resetForTesting();
  Middleware.clear();
  dom = makeFakeDom();
  global.document = dom.document;
  const prevWindow = global.window;
  global.window = { ...prevWindow, store: persisted };
  global.localStorage = grantedLS;
  global.window.localStorage = grantedLS;

  await Plugin.syncFromStore(false);

  assert.ok(Plugin.get('forest-theme'), 'suspended plugin re-registered');
  assert.is(Plugin.get('forest-theme').enabled, false, 'stays suspended after reload');
  assert.not.ok(appliedCss(dom, 'forest-theme'), 'suspended theme CSS not applied');

  assert.ok(Plugin.get('auto-save-indicator'), 'feature re-registered');
  assert.is(Plugin.get('auto-save-indicator').enabled, true, 'enabled feature re-enabled');
  assert.ok(appliedCss(dom, 'auto-save-indicator'), 'feature CSS re-applied');
  assert.ok(dom.header.children.length > 0, 'feature setup re-ran and re-injected its badge');
});

test('syncFromStore is idempotent (re-sync after async storage mirror load)', async () => {
  freshHarness();
  await Plugin.install(loadSample('themes/forest.json'));
  const persisted = JSON.parse(JSON.stringify(window.store));

  resetForTesting();
  Middleware.clear();
  const dom = makeFakeDom();
  global.document = dom.document;
  global.window.store = persisted;

  await Plugin.syncFromStore(false);
  await Plugin.syncFromStore(false); // second sync must be a no-op

  assert.is(Plugin.listAll().length, 1, 'no duplicate registration');
  const styles = dom.head.children.filter(el => el.tag === 'style');
  assert.is(styles.length, 1, 'CSS applied exactly once');
});

test('safe mode registers but does not enable plugins', async () => {
  freshHarness();
  await Plugin.install(loadSample('themes/forest.json'));
  const persisted = JSON.parse(JSON.stringify(window.store));

  resetForTesting();
  Middleware.clear();
  const dom = makeFakeDom();
  global.document = dom.document;
  global.window.store = persisted;

  await Plugin.syncFromStore(true);
  assert.ok(Plugin.get('forest-theme'), 'registered in safe mode');
  assert.is(Plugin.get('forest-theme').enabled, false, 'not enabled in safe mode');
  assert.not.ok(appliedCss(dom, 'forest-theme'), 'no CSS in safe mode');
});

// ── Feature layer: middleware + host bridge ───────────────────────────────
test('feature sample wires live middleware through ctx.api.middleware', async () => {
  freshHarness();
  const pkg = loadSample('features/auto-save-indicator.json');
  grantAll(pkg.id, pkg.manifest);
  const id = await Plugin.install(pkg);

  assert.is(Plugin.get(id).enabled, true, 'LOW-risk feature auto-enables');
  const registered = Middleware.list().find(m => m.name === id + ':save-indicator');
  assert.ok(registered, 'middleware registered under namespaced name');

  // Pipeline actually runs the handler
  const result = await Middleware.run('card.save', [window.store]);
  assert.not.ok(result.prevented, 'save not prevented');

  await Plugin.disable(id);
  assert.not.ok(
    Middleware.list().find(m => m.name === id + ':save-indicator'),
    'middleware auto-unregistered on suspend'
  );
});

test('createCard with tags emits a card.create event carrying the tagged card', async () => {
  freshHarness();
  Permissions.grantPermissions('tag-watcher', ['data-modify']);
  const id = await Plugin.install({
    manifest: { id: 'tag-watcher', name: 'Tag Watcher', version: '1.0.0', author: 't', layer: 'feature', permissions: ['data-modify'] },
    js: "ctx.logger.info('ready');"
  });

  const seen = [];
  const ctx = Plugin.get(id).context;
  ctx.api.data.onUpdate(e => { if (e.type === 'card.create') seen.push(e); });
  ctx.api.data.createCard({ title: 'Tagged', body: '', tags: ['todo'] });

  assert.is(seen.length, 1, 'exactly one card.create event');
  assert.ok(seen[0].card, 'event carries the card');
  assert.equal(seen[0].card.tags, ['todo'], 'event card already has its tags');
});

// ── App layer: manual enable, storage, teardown ───────────────────────────
test('app sample installs suspended (HIGH risk) and enables manually', async () => {
  const dom = freshHarness();
  const pkg = loadSample('apps/kanban-board.json');
  const id = await Plugin.install(pkg);

  assert.is(Plugin.get(id).enabled, false, 'app layer must not auto-enable');
  assert.is(window.store.plugins[id].enabled, false, 'persisted as suspended');

  grantAll(id, pkg.manifest);
  await Plugin.enable(id);
  assert.is(Plugin.get(id).enabled, true);
  assert.is(window.store.plugins[id].enabled, true, 'manual enable persisted');
  assert.ok(dom.header.children.some(el => el.className.includes('plugin-kanban-btn')), 'Board button injected');
  assert.ok(dom.body.children.some(el => el.className.includes('plugin-kanban-overlay')), 'overlay injected');

  await Plugin.disable(id);
  assert.is(dom.header.children.length, 0, 'injected DOM cleaned up on suspend');
  assert.is(dom.body.children.length, 0, 'overlay cleaned up on suspend');
});

test('app appName override renames the brand button and restores it on suspend', async () => {
  const dom = freshHarness();
  const originalBrand = dom.brandBtn.innerHTML;
  assert.ok(originalBrand.includes('brand-logo'), 'brand starts as the logo');

  const pkg = loadSample('apps/daily-journal.json');
  grantAll(pkg.id, pkg.manifest);
  const id = await Plugin.install(pkg); // HIGH → installed suspended
  await Plugin.enable(id);
  assert.is(dom.brandBtn.textContent, 'Daily Journal', 'appName override applied');
  assert.not.ok(dom.brandBtn.innerHTML.includes('brand-logo'), 'logo replaced while active');

  await Plugin.disable(id);
  assert.is(dom.brandBtn.innerHTML, originalBrand, 'brand (logo) fully restored on suspend');
});

test('pomodoro app runs teardownJs on suspend (interval cleared)', async () => {
  freshHarness();
  const pkg = loadSample('apps/pomodoro-desk.json');
  grantAll(pkg.id, pkg.manifest);
  const id = await Plugin.install(pkg);
  await Plugin.enable(id);

  const ctx = Plugin.get(id).context;
  assert.ok(ctx._pomodoro, 'setup stashed timer state on ctx');

  // Start the timer, then suspend — teardownJs must clear the interval
  ctx._pomodoro.intervalId = setInterval(() => {}, 60000);
  await Plugin.disable(id);
  assert.is(ctx._pomodoro.intervalId, null, 'teardownJs cleared the interval');
});

// ── Delete / update / duplicate handling ──────────────────────────────────
test('delete removes plugin from runtime, store, and revokes permissions', async () => {
  const dom = freshHarness();
  const pkg = loadSample('features/auto-save-indicator.json'); // declares ui-override
  grantAll(pkg.id, pkg.manifest);
  const id = await Plugin.install(pkg);
  assert.ok(Permissions.getPermissions(id).length > 0, 'permissions granted before delete');

  await Plugin.unregister(id);
  assert.not.ok(Plugin.get(id), 'gone from runtime');
  assert.not.ok(window.store.plugins[id], 'gone from store');
  assert.is(Permissions.getPermissions(id).length, 0, 'permissions revoked');
  assert.not.ok(appliedCss(dom, id), 'CSS removed');
});

test('reinstalling the same id updates in place (no id-1 duplicates)', async () => {
  freshHarness();
  const pkg1 = loadSample('themes/forest.json');
  await Plugin.install(pkg1);

  const pkg2 = loadSample('themes/forest.json');
  pkg2.manifest = { ...pkg2.manifest, version: '9.9.9' };
  const id = await Plugin.install(pkg2);

  assert.is(id, 'forest-theme', 'same id reused');
  assert.is(Plugin.listAll().length, 1, 'single instance');
  assert.is(Object.keys(window.store.plugins).length, 1, 'single store entry');
  assert.is(window.store.plugins[id].definition.manifest.version, '9.9.9', 'definition updated');
});

test('register() throws on duplicate id instead of silently overwriting', () => {
  freshHarness();
  const def = { manifest: { name: 'Dup', version: '1.0.0', layer: 'feature', author: 'T' } };
  Plugin.register('dup-plugin', def);
  assert.throws(
    () => Plugin.register('dup-plugin', def),
    /already registered/
  );
});

// ── Create-tab style packages (manifest + raw js string) ──────────────────
test('a created plugin (manifest + js string) survives reload and re-runs setup', async () => {
  freshHarness();
  grantAll('hello-header', { permissions: ['ui-override'] });
  const id = await Plugin.install({
    manifest: { id: 'hello-header', name: 'Hello Header', version: '1.0.0', author: 'T', layer: 'feature', permissions: ['ui-override'] },
    js: "var el = document.createElement('span'); el.className = 'hello-header'; ctx.api.ui.inject('.header', el, 'append');"
  });
  assert.is(Plugin.get(id).enabled, true, 'auto-enabled at install');

  const storedJs = window.store.plugins[id].definition.js;
  assert.type(storedJs, 'string');
  assert.ok(storedJs.includes('hello-header'), 'raw source persisted, not a wrapper dump');

  const persisted = JSON.parse(JSON.stringify(window.store));
  resetForTesting();
  Middleware.clear();
  const dom = makeFakeDom();
  global.document = dom.document;
  global.window.store = persisted;

  await Plugin.syncFromStore(false);
  assert.is(Plugin.get(id).enabled, true, 're-enabled after reload');
  assert.ok(dom.header.children.some(el => el.className === 'hello-header'), 'setup re-ran from persisted source');
});

test('a syntax error in plugin js fails install cleanly (nothing registered)', async () => {
  freshHarness();
  try {
    await Plugin.install({
      manifest: { name: 'Broken', version: '1.0.0', author: 'T', layer: 'feature' },
      js: 'this is not javascript {{{'
    });
    assert.unreachable('install should have thrown');
  } catch (err) {
    assert.ok(err instanceof SyntaxError || /Unexpected/.test(err.message), 'syntax error surfaced');
  }
  assert.is(Plugin.listAll().length, 0, 'nothing registered');
  assert.is(Object.keys(window.store.plugins).length, 0, 'nothing persisted');
});

test('a failing setup leaves the plugin installed but suspended', async () => {
  freshHarness();
  const id = await Plugin.install({
    manifest: { name: 'Crasher', version: '1.0.0', author: 'T', layer: 'feature' },
    js: "throw new Error('boom');"
  });
  assert.ok(Plugin.get(id), 'still registered');
  assert.is(Plugin.get(id).enabled, false, 'not enabled');
  assert.is(window.store.plugins[id].enabled, false, 'persisted as suspended');
});

// ── All nine samples install through the real runtime ─────────────────────
test('every sample package installs without error and lands in the right state', async () => {
  freshHarness();
  const paths = [
    'themes/forest.json', 'themes/cyberpunk.json', 'themes/monochrome.json',
    'features/auto-save-indicator.json', 'features/card-color-tags.json', 'features/card-reading-time.json',
    'apps/kanban-board.json', 'apps/daily-journal.json', 'apps/pomodoro-desk.json'
  ];
  for (const p of paths) {
    const pkg = loadSample(p);
    grantAll(pkg.id, pkg.manifest);
    const id = await Plugin.install(pkg);
    const layer = pkg.manifest.layer;
    const expectEnabled = layer !== 'app';
    assert.is(Plugin.get(id).enabled, expectEnabled, `${p}: ${layer} should ${expectEnabled ? '' : 'not '}auto-enable`);
    assert.ok(window.store.plugins[id], `${p}: persisted`);
  }
  assert.is(Plugin.listAll().length, 9, 'all nine samples installed');
});

test.run();
