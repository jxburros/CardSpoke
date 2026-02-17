// Tests for Plugin Validator System
import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { readFileSync } from 'fs';

// Mock window
global.window = { CardSpoke: {} };

// Load the plugin validator
eval(readFileSync('./www/src/core/plugin-validator.js', 'utf8'));

test('Plugin validator initializes', () => {
  assert.ok(window.CardSpoke.PluginValidator, 'Validator exists');
  assert.type(window.CardSpoke.PluginValidator.validate, 'function');
  assert.type(window.CardSpoke.PluginValidator.validateManifest, 'function');
  assert.type(window.CardSpoke.PluginValidator.validateCSS, 'function');
  assert.type(window.CardSpoke.PluginValidator.validateJS, 'function');
});

test('Valid plugin passes validation', () => {
  const result = window.CardSpoke.PluginValidator.validate({
    id: 'test-plugin',
    manifest: {
      name: 'Test Plugin',
      version: '1.0.0',
      layer: 'feature',
      author: 'Test Author',
      permissions: ['ui-override']
    },
    css: '.test { color: red; }',
    js: 'console.log("hello");'
  });

  assert.ok(result.valid, 'Valid plugin passes');
  assert.equal(result.errors.length, 0, 'No errors');
});

test('Missing manifest fails validation', () => {
  const result = window.CardSpoke.PluginValidator.validate({
    id: 'bad-plugin'
  });

  assert.not.ok(result.valid, 'Invalid plugin fails');
  assert.ok(result.errors.length > 0, 'Has errors');
});

test('Missing manifest.name fails validation', () => {
  const result = window.CardSpoke.PluginValidator.validateManifest({
    version: '1.0.0',
    layer: 'feature'
  });

  assert.ok(result.errors.some(e => e.includes('manifest.name')), 'Name error reported');
});

test('Invalid manifest.layer fails validation', () => {
  const result = window.CardSpoke.PluginValidator.validateManifest({
    name: 'Test',
    version: '1.0.0',
    layer: 'invalid'
  });

  assert.ok(result.errors.some(e => e.includes('manifest.layer')), 'Layer error reported');
});

test('Valid layers are accepted', () => {
  ['theme', 'feature', 'app'].forEach(layer => {
    const result = window.CardSpoke.PluginValidator.validateManifest({
      name: 'Test',
      version: '1.0.0',
      layer: layer
    });
    assert.not.ok(result.errors.some(e => e.includes('manifest.layer')), layer + ' accepted');
  });
});

test('Invalid permissions produce warning', () => {
  const result = window.CardSpoke.PluginValidator.validateManifest({
    name: 'Test',
    version: '1.0.0',
    layer: 'feature',
    permissions: ['unknown-perm']
  });

  assert.ok(result.warnings.some(w => w.includes('Unknown permission')), 'Unknown permission warned');
});

test('CSS sanitization removes @import', () => {
  const result = window.CardSpoke.PluginValidator.validateCSS('@import url("evil.css"); .test { color: red; }');

  assert.ok(result.warnings.some(w => w.includes('@import')), 'Import warned');
  assert.not.ok(result.sanitized.includes('@import'), 'Import removed');
  assert.ok(result.sanitized.includes('.test'), 'Safe CSS preserved');
});

test('CSS sanitization removes javascript: protocol', () => {
  const result = window.CardSpoke.PluginValidator.validateCSS('.test { background: url(javascript:alert(1)); }');

  assert.ok(result.warnings.some(w => w.includes('javascript:')), 'JS protocol warned');
  assert.not.ok(result.sanitized.includes('javascript:'), 'JS protocol removed');
});

test('CSS sanitization removes expression()', () => {
  const result = window.CardSpoke.PluginValidator.validateCSS('.test { width: expression(document.body.clientWidth); }');

  assert.ok(result.warnings.some(w => w.includes('expression()')), 'Expression warned');
  assert.not.ok(/expression\s*\(/i.test(result.sanitized), 'Expression removed');
});

test('Safe CSS passes without changes', () => {
  const safeCSS = '.my-plugin { color: blue; font-size: 14px; }';
  const result = window.CardSpoke.PluginValidator.validateCSS(safeCSS);

  assert.equal(result.errors.length, 0, 'No errors');
  assert.equal(result.warnings.length, 0, 'No warnings');
  assert.equal(result.sanitized, safeCSS, 'CSS unchanged');
});

test('JS with eval() fails validation', () => {
  const result = window.CardSpoke.PluginValidator.validateJS('var x = eval("1+1");');

  assert.ok(result.errors.some(e => e.includes('eval()')), 'eval() detected');
});

test('JS with new Function() fails validation', () => {
  const result = window.CardSpoke.PluginValidator.validateJS('var fn = new Function("return 1");');

  assert.ok(result.errors.some(e => e.includes('new Function()')), 'new Function() detected');
});

test('Safe JS passes validation', () => {
  const safeJS = 'console.log("hello world"); var x = 42;';
  const result = window.CardSpoke.PluginValidator.validateJS(safeJS);

  assert.equal(result.errors.length, 0, 'No errors');
});

test('CSS exceeding max length fails', () => {
  const longCSS = 'x'.repeat(100001);
  const result = window.CardSpoke.PluginValidator.validateCSS(longCSS);

  assert.ok(result.errors.some(e => e.includes('maximum size')), 'Size limit error');
});

test('JS exceeding max length fails', () => {
  const longJS = 'x'.repeat(500001);
  const result = window.CardSpoke.PluginValidator.validateJS(longJS);

  assert.ok(result.errors.some(e => e.includes('maximum size')), 'Size limit error');
});

test('Null plugin fails gracefully', () => {
  const result = window.CardSpoke.PluginValidator.validate(null);

  assert.not.ok(result.valid, 'Null plugin invalid');
  assert.ok(result.errors.length > 0, 'Has errors');
});

test('Plugin without js/css is valid', () => {
  const result = window.CardSpoke.PluginValidator.validate({
    id: 'minimal',
    manifest: {
      name: 'Minimal',
      version: '1.0.0',
      layer: 'theme'
    }
  });

  assert.ok(result.valid, 'Plugin without JS/CSS is valid');
});

test('Non-semver version produces warning', () => {
  const result = window.CardSpoke.PluginValidator.validateManifest({
    name: 'Test',
    version: 'beta',
    layer: 'feature'
  });

  assert.ok(result.warnings.some(w => w.includes('semver')), 'Non-semver warned');
});

test.run();
