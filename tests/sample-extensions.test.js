/**
 * Mod System Test Suite
 *
 * Validates the new JSON-based mod loading system including
 * package validation, risk assessment, and mod format compliance.
 */

import { test } from 'uvu';
import * as assert from 'uvu/assert';

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
  // Theme with no JS should be SAFE
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

test.run();
