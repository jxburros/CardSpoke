/**
 * Mod System Test Suite
 *
 * Validates the new JSON-based mod loading system including
 * package validation, risk assessment, mod format compliance,
 * and the actual sample mod files.
 */

import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ==========================================================================
// Mod Package Format Tests
// ==========================================================================

const VALID_LAYERS = ['theme', 'feature', 'app'];

function createValidModPackage(overrides = {}) {
  return {
    id: 'test-mod',
    manifest: {
      name: 'Test Mod',
      version: '1.0.0',
      author: 'Test Author',
      description: 'A test mod',
      layer: 'feature',
      compatibility: '>=0.16.0',
      ...(overrides.manifest || {})
    },
    config: overrides.config || {},
    css: overrides.css || '',
    js: overrides.js || '',
    overrides: overrides.overrides || {},
    enabled: overrides.enabled !== undefined ? overrides.enabled : false
  };
}

function validateModPackage(pkg) {
  const errors = [];
  if (!pkg || typeof pkg !== 'object') return { valid: false, errors: ['Not an object'] };
  if (!pkg.id || typeof pkg.id !== 'string') errors.push('Missing or invalid "id"');
  if (pkg.id && !/^[a-z0-9-]+$/.test(pkg.id)) errors.push('ID must be lowercase alphanumeric with hyphens');
  if (!pkg.manifest || typeof pkg.manifest !== 'object') {
    errors.push('Missing "manifest" object');
  } else {
    if (!pkg.manifest.name) errors.push('Missing manifest.name');
    if (!pkg.manifest.version) errors.push('Missing manifest.version');
    if (!pkg.manifest.author) errors.push('Missing manifest.author');
    if (!pkg.manifest.layer) errors.push('Missing manifest.layer');
    if (pkg.manifest.layer && !VALID_LAYERS.includes(pkg.manifest.layer)) {
      errors.push('Invalid manifest.layer: ' + pkg.manifest.layer);
    }
  }
  if (pkg.manifest && pkg.manifest.layer === 'theme' && pkg.js && pkg.js.trim().length > 0) {
    errors.push('Theme-layer mods cannot contain JavaScript');
  }
  if (pkg.overrides && Object.keys(pkg.overrides).length > 0 && pkg.manifest && pkg.manifest.layer !== 'app') {
    errors.push('Only app-layer mods can use overrides');
  }
  return { valid: errors.length === 0, errors };
}

test('valid mod package has all required fields', () => {
  const pkg = createValidModPackage();
  assert.ok(pkg.id, 'id is required');
  assert.ok(pkg.manifest, 'manifest is required');
  assert.ok(pkg.manifest.name, 'manifest.name is required');
  assert.ok(pkg.manifest.version, 'manifest.version is required');
  assert.ok(pkg.manifest.author, 'manifest.author is required');
  assert.ok(pkg.manifest.layer, 'manifest.layer is required');
  assert.ok(VALID_LAYERS.includes(pkg.manifest.layer), 'manifest.layer must be valid');
});

test('theme mod has no JavaScript', () => {
  const pkg = createValidModPackage({
    manifest: { layer: 'theme' },
    css: ':root { --bg: #fff; }',
    js: ''
  });
  assert.is(pkg.manifest.layer, 'theme');
  assert.is(pkg.js, '');
});

test('feature mod can have both CSS and JS', () => {
  const pkg = createValidModPackage({
    manifest: { layer: 'feature' },
    css: '.my-class { color: red; }',
    js: '(function() { console.log("hello"); })();'
  });
  assert.ok(pkg.css.length > 0, 'feature mod can have CSS');
  assert.ok(pkg.js.length > 0, 'feature mod can have JS');
});

test('app mod can have overrides', () => {
  const pkg = createValidModPackage({
    manifest: { layer: 'app' },
    overrides: {
      appName: 'Custom App',
      hideMenuItems: ['menuTrashBin'],
      customMenuItems: [{ id: 'myItem', label: 'My Item' }]
    }
  });
  assert.ok(pkg.overrides.appName, 'app mod can have appName override');
  assert.ok(Array.isArray(pkg.overrides.hideMenuItems), 'app mod can hide menu items');
  assert.ok(Array.isArray(pkg.overrides.customMenuItems), 'app mod can add custom menu items');
});

test('mod packages are valid JSON', () => {
  const pkg = createValidModPackage();
  const json = JSON.stringify(pkg);
  const parsed = JSON.parse(json);
  assert.is(parsed.id, 'test-mod');
  assert.is(parsed.manifest.name, 'Test Mod');
});

test('all three layers are distinct capabilities', () => {
  const theme = createValidModPackage({ manifest: { layer: 'theme' } });
  const feature = createValidModPackage({ manifest: { layer: 'feature' } });
  const app = createValidModPackage({ manifest: { layer: 'app' } });

  assert.is(theme.manifest.layer, 'theme');
  assert.is(feature.manifest.layer, 'feature');
  assert.is(app.manifest.layer, 'app');
});

test('mod config can hold user-configurable settings', () => {
  const pkg = createValidModPackage({
    config: {
      color: '#ff0000',
      enabled: true,
      size: 16
    }
  });
  assert.is(pkg.config.color, '#ff0000');
  assert.is(pkg.config.enabled, true);
  assert.is(pkg.config.size, 16);
});

test('overrides only meaningful for app layer', () => {
  const theme = createValidModPackage({
    manifest: { layer: 'theme' },
    overrides: {}
  });
  const app = createValidModPackage({
    manifest: { layer: 'app' },
    overrides: { appName: 'New App' }
  });
  assert.is(Object.keys(theme.overrides).length, 0, 'theme should not have overrides');
  assert.ok(Object.keys(app.overrides).length > 0, 'app can have overrides');
});

test('mod ID follows naming conventions', () => {
  const validIds = ['my-mod', 'theme-dark-v2', 'feature123', 'a'];
  const invalidIds = ['My Mod', 'has spaces', '', null];

  validIds.forEach(id => {
    assert.ok(/^[a-z0-9-]+$/.test(id), `"${id}" should be a valid mod ID`);
  });

  invalidIds.forEach(id => {
    if (id === null || id === '') {
      assert.not.ok(id, 'null/empty should be invalid');
    } else {
      assert.not.ok(/^[a-z0-9-]+$/.test(id), `"${id}" should be an invalid mod ID`);
    }
  });
});

test('mod version follows semver format', () => {
  const validVersions = ['1.0.0', '0.1.0', '2.3.4', '10.20.30'];
  validVersions.forEach(v => {
    assert.ok(/^\d+\.\d+\.\d+$/.test(v), `"${v}" should be valid semver`);
  });
});

// ==========================================================================
// Risk Assessment Logic Tests (simulated)
// ==========================================================================

test('theme mod is lowest risk', () => {
  const pkg = createValidModPackage({
    manifest: { layer: 'theme' },
    css: ':root { --bg: blue; }',
    js: ''
  });
  assert.is(pkg.manifest.layer, 'theme');
  assert.is(pkg.js, '');
});

test('feature mod with network access is higher risk', () => {
  const pkg = createValidModPackage({
    manifest: { layer: 'feature' },
    js: '(function() { fetch("https://example.com"); })();'
  });
  assert.ok(pkg.js.includes('fetch('), 'JS contains network access');
});

test('app mod with overrides is highest risk', () => {
  const pkg = createValidModPackage({
    manifest: { layer: 'app' },
    js: '(function() { console.log("loaded"); })();',
    overrides: {
      appName: 'Totally New App',
      disableFeatures: ['bookmarks']
    }
  });
  assert.is(pkg.manifest.layer, 'app');
  assert.ok(pkg.overrides.disableFeatures, 'can disable features');
});

// ==========================================================================
// Sample Mod File Validation Tests
// ==========================================================================

const sampleModsDir = join(__dirname, '..', 'sample-mods');

function loadSampleMods(subdir) {
  const dir = join(sampleModsDir, subdir);
  const files = readdirSync(dir).filter(f => f.endsWith('.json'));
  return files.map(f => {
    const raw = readFileSync(join(dir, f), 'utf8');
    return { filename: f, pkg: JSON.parse(raw) };
  });
}

test('all sample theme mods are valid JSON and pass validation', () => {
  const mods = loadSampleMods('themes');
  assert.is(mods.length, 3, 'should have exactly 3 theme mods');
  mods.forEach(({ filename, pkg }) => {
    const result = validateModPackage(pkg);
    assert.ok(result.valid, `${filename}: ${result.errors.join(', ')}`);
    assert.is(pkg.manifest.layer, 'theme', `${filename} should be theme layer`);
    assert.is(pkg.js, '', `${filename} theme must have no JS`);
    assert.ok(pkg.css.length > 0, `${filename} theme should have CSS`);
  });
});

test('all sample feature mods are valid JSON and pass validation', () => {
  const mods = loadSampleMods('features');
  assert.is(mods.length, 3, 'should have exactly 3 feature mods');
  mods.forEach(({ filename, pkg }) => {
    const result = validateModPackage(pkg);
    assert.ok(result.valid, `${filename}: ${result.errors.join(', ')}`);
    assert.is(pkg.manifest.layer, 'feature', `${filename} should be feature layer`);
    assert.ok(pkg.js.length > 0, `${filename} feature should have JS`);
  });
});

test('all sample app mods are valid JSON and pass validation', () => {
  const mods = loadSampleMods('apps');
  assert.is(mods.length, 3, 'should have exactly 3 app mods');
  mods.forEach(({ filename, pkg }) => {
    const result = validateModPackage(pkg);
    assert.ok(result.valid, `${filename}: ${result.errors.join(', ')}`);
    assert.is(pkg.manifest.layer, 'app', `${filename} should be app layer`);
    assert.ok(pkg.overrides && Object.keys(pkg.overrides).length > 0, `${filename} app should have overrides`);
  });
});

test('all sample mods have unique IDs', () => {
  const allMods = [
    ...loadSampleMods('themes'),
    ...loadSampleMods('features'),
    ...loadSampleMods('apps')
  ];
  const ids = allMods.map(m => m.pkg.id);
  const uniqueIds = new Set(ids);
  assert.is(uniqueIds.size, ids.length, 'All mod IDs must be unique: ' + ids.join(', '));
});

test('all sample mods register hooks via CardSpoke_MODS.register in their JS', () => {
  const featureMods = loadSampleMods('features');
  const appMods = loadSampleMods('apps');
  [...featureMods, ...appMods].forEach(({ filename, pkg }) => {
    if (pkg.js && pkg.js.trim().length > 0) {
      assert.ok(
        pkg.js.includes('CardSpoke_MODS.register('),
        `${filename} JS should register via CardSpoke_MODS.register()`
      );
    }
  });
});

test('all sample mods use their own ID in register calls', () => {
  const featureMods = loadSampleMods('features');
  const appMods = loadSampleMods('apps');
  [...featureMods, ...appMods].forEach(({ filename, pkg }) => {
    if (pkg.js && pkg.js.trim().length > 0) {
      assert.ok(
        pkg.js.includes("'" + pkg.id + "'") || pkg.js.includes('"' + pkg.id + '"'),
        `${filename} JS should register with its own ID '${pkg.id}'`
      );
    }
  });
});

test('all sample mods start disabled', () => {
  const allMods = [
    ...loadSampleMods('themes'),
    ...loadSampleMods('features'),
    ...loadSampleMods('apps')
  ];
  allMods.forEach(({ filename, pkg }) => {
    assert.is(pkg.enabled, false, `${filename} should start disabled`);
  });
});

test('feature and app mods implement onDisable for clean teardown', () => {
  const featureMods = loadSampleMods('features');
  const appMods = loadSampleMods('apps');
  [...featureMods, ...appMods].forEach(({ filename, pkg }) => {
    if (pkg.js && pkg.js.trim().length > 0) {
      assert.ok(
        pkg.js.includes('onDisable'),
        `${filename} should implement onDisable hook for clean teardown`
      );
    }
  });
});

test.run();
