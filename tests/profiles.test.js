/**
 * Profile & Feature Flag Tests
 * Covers full/lite/os profiles, safe fallbacks, and environment detection.
 */

import { test } from 'uvu';
import * as assert from 'uvu/assert';
import {
  PROFILES,
  DEFAULT_PROFILE,
  resolveProfile,
  getFeatureFlags,
  setActiveProfile,
  getActiveProfile,
  isFeatureEnabled,
  detectProfile,
  initProfile
} from '../www/src/core/profiles.js';

test.after.each(() => setActiveProfile(DEFAULT_PROFILE));

test('full, lite, and os profiles exist', () => {
  assert.equal([...PROFILES], ['full', 'lite', 'os']);
});

test('full profile enables the plugin manager', () => {
  const flags = getFeatureFlags('full');
  assert.is(flags.pluginManager, true);
  assert.is(flags.developerConsole, true);
  assert.is(flags.typedCards, true);
});

test('lite profile hides the plugin manager and developer console', () => {
  const flags = getFeatureFlags('lite');
  assert.is(flags.pluginManager, false);
  assert.is(flags.developerConsole, false);
  assert.is(flags.advancedSearch, true, 'search stays available in lite');
  assert.is(flags.typedCards, true);
});

test('os profile enables app modes', () => {
  const flags = getFeatureFlags('os');
  assert.is(flags.appModes, true);
  assert.is(flags.pluginManager, false);
});

test('missing or invalid profile falls back safely', () => {
  assert.is(resolveProfile(undefined), DEFAULT_PROFILE);
  assert.is(resolveProfile('bogus'), DEFAULT_PROFILE);
  assert.is(resolveProfile(42), DEFAULT_PROFILE);
  const flags = getFeatureFlags('bogus');
  assert.is(flags.pluginManager, true, 'fallback behaves like full');
});

test('setActiveProfile drives isFeatureEnabled', () => {
  setActiveProfile('lite');
  assert.is(getActiveProfile(), 'lite');
  assert.not.ok(isFeatureEnabled('pluginManager'));
  assert.ok(isFeatureEnabled('advancedSearch'));

  setActiveProfile('os');
  assert.ok(isFeatureEnabled('appModes'));

  setActiveProfile('nonsense');
  assert.is(getActiveProfile(), DEFAULT_PROFILE, 'invalid profile falls back');
  assert.ok(isFeatureEnabled('pluginManager'));
});

test('unknown feature names are disabled', () => {
  setActiveProfile('full');
  assert.not.ok(isFeatureEnabled('notARealFeature'));
});

test('detectProfile reads the ?profile= URL override first', () => {
  assert.is(detectProfile({ search: '?profile=lite' }), 'lite');
  assert.is(detectProfile({ search: '?foo=1&profile=os' }), 'os');
  assert.is(detectProfile({ search: '?profile=bogus', globalProfile: 'lite' }), 'lite',
    'invalid URL value falls through to the runtime setting');
});

test('detectProfile falls back to the runtime global, then default', () => {
  assert.is(detectProfile({ search: '', globalProfile: 'os' }), 'os');
  assert.is(detectProfile({ search: '', globalProfile: undefined }), DEFAULT_PROFILE);
});

test('initProfile activates the detected profile', () => {
  const activated = initProfile({ search: '?profile=os' });
  assert.is(activated, 'os');
  assert.is(getActiveProfile(), 'os');
  assert.ok(isFeatureEnabled('appModes'));
});

test.run();
