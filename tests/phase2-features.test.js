// Tests for Phase 2 Features
// Covers: Task 2.1 (persist setup/teardown), 2.2 (secure cloneCard), 2.3 (storage JSON),
//         2.4 (plugin updating), 2.6 (config/overrides), 2.7 (network/filesystem perms)
import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { Plugin, PluginSandbox, resetForTesting } from '../www/src/core/plugin-api.js';
import { Permissions } from '../www/src/core/permissions.js';

let PluginManager = null;

test.before(() => {
  resetForTesting();

  global.window = {
    CardSpoke: {
      Plugin,
      Permissions,
      PluginSandbox: { createFunction: PluginSandbox }
    },
    store: {
      cards: {
        'card-1': { id: 'card-1', title: 'Test Card', body: 'Test body', tags: [], children: [], parentId: null, modsData: {} }
      },
      plugins: {}
    },
    createCard: (title, body, parentId) => 'new-card-id',
    updateCard: (id, updates) => {},
    deleteCard: (id) => {},
    cloneCard: null, // Intentionally null to test fallback
    getTags: (cardId) => [],
    addTag: (cardId, tag) => true,
    removeTag: (cardId, tag) => true,
    setTags: (cardId, tags) => true,
    getAllTags: () => [],
    showToast: (msg, type) => {},
    APP_VERSION: '0.17.0',
    SCHEMA_VERSION: 4,
    save: () => {},
    fetch: async (url) => ({ ok: true, json: async () => ({}) }),
    localStorage: {
      _data: {},
      getItem: function(key) { return this._data[key] !== undefined ? this._data[key] : null; },
      setItem: function(key, value) { this._data[key] = value; },
      removeItem: function(key) { delete this._data[key]; },
      get length() { return Object.keys(this._data).length; },
      key: function(i) { return Object.keys(this._data)[i]; }
    }
  };
  global.localStorage = global.window.localStorage;

  global.document = {
    querySelector: (sel) => null,
    getElementById: (id) => null,
    createElement: (tag) => ({
      tag,
      style: {},
      textContent: '',
      innerHTML: '',
      setAttribute: () => {},
      appendChild: () => {},
      parentNode: null,
      dataset: {}
    }),
    head: { appendChild: () => {} },
    body: { appendChild: () => {}, removeChild: () => {} }
  };

  PluginManager = Plugin;
});

// Task 2.2: Secure cloneCard Fallback
test('getCard returns deep copy when cloneCard unavailable', () => {
  // cloneCard is null, so fallback should be used
  window.cloneCard = null;
  const card = PluginManager.get('context-test') 
    ? PluginManager.get('context-test').context.api.data.getCard('card-1')
    : null;

  // Register a fresh plugin to get a data API
  PluginManager.register('clone-test', {
    manifest: { name: 'Clone Test', version: '1.0.0', layer: 'feature' }
  });

  const instance = PluginManager.get('clone-test');
  const dataApi = instance.context.api.data;

  const retrieved = dataApi.getCard('card-1');
  assert.ok(retrieved, 'Card retrieved even without cloneCard');
  assert.equal(retrieved.id, 'card-1', 'Correct card returned');

  // Verify it is a copy, not the original reference
  const original = window.store.cards['card-1'];
  assert.is.not(retrieved, original, 'getCard returns a copy, not original reference');
});

test('listCards returns deep copies when cloneCard unavailable', () => {
  window.cloneCard = null;

  PluginManager.register('list-clone-test', {
    manifest: { name: 'List Clone Test', version: '1.0.0', layer: 'feature' }
  });

  const instance = PluginManager.get('list-clone-test');
  const cards = instance.context.api.data.listCards();

  assert.ok(Array.isArray(cards), 'Returns array');
  assert.ok(cards.length > 0, 'Cards returned');

  // Verify copies, not original references
  const original = window.store.cards['card-1'];
  const retrieved = cards.find(c => c.id === 'card-1');
  assert.ok(retrieved, 'Card found in list');
  assert.is.not(retrieved, original, 'listCards returns copies');
});

// Task 2.3: Storage API JSON Formatting
test('storage.set/get round-trips objects correctly', async () => {
  // Grant storage permission
  window.CardSpoke.Permissions.grantPermissions('storage-test', ['storage']);

  PluginManager.register('storage-test', {
    manifest: { name: 'Storage Test', version: '1.0.0', layer: 'feature', permissions: ['storage'] }
  });

  const instance = PluginManager.get('storage-test');
  const storageApi = instance.context.api.storage;

  const testObj = { key: 'value', num: 42, arr: [1, 2, 3] };
  await storageApi.set('myKey', testObj);

  // Verify it was stored as JSON string in localStorage
  const stored = window.localStorage.getItem('plugin_storage-test_myKey');
  assert.ok(stored, 'Value stored in localStorage');
  assert.equal(typeof stored, 'string', 'Stored as string');

  // Now retrieve via API - should get back the parsed object
  const retrieved = await storageApi.get('myKey');
  assert.ok(retrieved, 'Value retrieved');
  assert.equal(typeof retrieved, 'object', 'Retrieved as object (JSON parsed)');
  assert.equal(retrieved.key, 'value', 'Object property preserved');
  assert.equal(retrieved.num, 42, 'Number preserved');
  assert.equal(retrieved.arr.length, 3, 'Array preserved');
});

// Task 2.4: Enable Plugin Updating
test('install() updates existing plugin instead of creating duplicate', async () => {
  const pkg = {
    manifest: {
      id: 'update-test',
      name: 'Update Test',
      version: '1.0.0',
      layer: 'feature'
    },
    js: 'ctx.logger.log("v1 running");'
  };

  // Install first version
  const id1 = await PluginManager.install(pkg);
  assert.equal(id1, 'update-test', 'First install gets base ID');

  // Install second version with same ID
  const pkg2 = {
    manifest: {
      id: 'update-test',
      name: 'Update Test',
      version: '2.0.0',
      layer: 'feature'
    },
    js: 'ctx.logger.log("v2 running");'
  };

  const id2 = await PluginManager.install(pkg2);
  assert.equal(id2, 'update-test', 'Second install reuses same ID (no -1 duplicate)');

  // Only one plugin with this ID should exist
  const all = PluginManager.list().filter(p => p.id === 'update-test' || p.id === 'update-test-1');
  assert.equal(all.length, 1, 'Only one plugin instance exists after update');
});

// Task 2.1: Persist Setup/Teardown
test('syncFromStore reconstructs setup function from JS string', async () => {
  let setupCalled = false;

  // Simulate what gets stored in window.store.plugins after install
  window.store.plugins['persist-test'] = {
    definition: {
      manifest: { name: 'Persist Test', version: '1.0.0', layer: 'feature' },
      setup: null,       // Functions are lost after JSON serialization
      teardown: null,
      css: null,
      js: 'setupCalled = true;'   // Raw JS string is preserved
    },
    enabled: true
  };

  // Make setupCalled accessible in new Function scope
  global.setupCalled = false;

  // Reset plugins in-memory map (simulate fresh page load)
  PluginManager.unregister('persist-test');

  await PluginManager.syncFromStore(false);

  const instance = PluginManager.get('persist-test');
  assert.ok(instance, 'Plugin re-registered from store');
  assert.ok(instance.definition.setup, 'Setup function reconstructed from JS string');
});

// Task 2.6: Config and Overrides
test('enable() passes config to plugin context', async () => {
  let receivedConfig = null;

  window.CardSpoke.Permissions.grantPermissions('config-test', []);

  PluginManager.register('config-test', {
    manifest: {
      name: 'Config Test',
      version: '1.0.0',
      layer: 'feature',
      config: { theme: 'dark', maxItems: 10 }
    },
    setup: async function(ctx) {
      receivedConfig = ctx.config;
    }
  });

  await PluginManager.enable('config-test');

  const instance = PluginManager.get('config-test');
  assert.ok(instance.context.config, 'Config available on context');
  assert.equal(instance.context.config.theme, 'dark', 'Config theme correct');
  assert.equal(instance.context.config.maxItems, 10, 'Config maxItems correct');

  await PluginManager.disable('config-test');
});

// Task 2.7: Network permission enforcement
test('network API denies fetch without network permission', async () => {
  window.CardSpoke.Permissions.revokePermissions('network-denied', null);

  PluginManager.register('network-denied', {
    manifest: { name: 'Network Denied', version: '1.0.0', layer: 'feature', permissions: [] }
  });

  const instance = PluginManager.get('network-denied');
  assert.ok(instance.context.api.network, 'Network API exists on context');
  assert.type(instance.context.api.network.fetch, 'function', 'network.fetch is a function');

  try {
    await instance.context.api.network.fetch('https://example.com');
    assert.unreachable('Should have thrown permission error');
  } catch (err) {
    assert.ok(err.message.includes('network'), 'Permission error for network');
  }
});

test('network API allows fetch with network permission', async () => {
  window.CardSpoke.Permissions.grantPermissions('network-allowed', ['network']);

  PluginManager.register('network-allowed', {
    manifest: { name: 'Network Allowed', version: '1.0.0', layer: 'feature', permissions: ['network'] }
  });

  const instance = PluginManager.get('network-allowed');
  let fetchCalled = false;
  window.fetch = async (url) => { fetchCalled = true; return { ok: true }; };

  try {
    await instance.context.api.network.fetch('https://example.com');
    assert.ok(fetchCalled, 'fetch was called with permission');
  } catch (err) {
    assert.unreachable('Should not throw with permission: ' + err.message);
  }
});

// Task 2.7: Filesystem permission enforcement
test('filesystem API exists on context', () => {
  PluginManager.register('fs-test', {
    manifest: { name: 'FS Test', version: '1.0.0', layer: 'feature' }
  });

  const instance = PluginManager.get('fs-test');
  assert.ok(instance.context.api.filesystem, 'Filesystem API exists on context');
  assert.type(instance.context.api.filesystem.readFile, 'function', 'filesystem.readFile is a function');
  assert.type(instance.context.api.filesystem.writeFile, 'function', 'filesystem.writeFile is a function');
});

test('filesystem API denies access without filesystem permission', async () => {
  window.CardSpoke.Permissions.revokePermissions('fs-denied', null);

  PluginManager.register('fs-denied', {
    manifest: { name: 'FS Denied', version: '1.0.0', layer: 'feature', permissions: [] }
  });

  const instance = PluginManager.get('fs-denied');

  try {
    await instance.context.api.filesystem.readFile('/some/path');
    assert.unreachable('Should have thrown permission error');
  } catch (err) {
    assert.ok(err.message.includes('filesystem'), 'Permission error for filesystem');
  }
});

// Task 2.4: install() with pkg.js field
test('install() creates callable setup from pkg.js string', async () => {
  let jsExecuted = false;
  global.jsExecuted = false;

  const pkg = {
    manifest: {
      id: 'js-install-test',
      name: 'JS Install Test',
      version: '1.0.0',
      layer: 'feature'
    },
    js: 'jsExecuted = true;'
  };

  const id = await PluginManager.install(pkg);
  const instance = PluginManager.get(id);

  assert.ok(instance.definition.setup, 'setup function created from js string');
  assert.type(instance.definition.setup, 'function', 'setup is a function');
});

// listAll() is an alias for list()
test('listAll() returns same result as list()', () => {
  const list = PluginManager.list();
  const listAll = PluginManager.listAll();
  assert.equal(list.length, listAll.length, 'listAll and list return same count');
});

test.run();
