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
 * Runtime Profiles & Feature Flags (CardSpoke Core)
 *
 * Lets CardSpoke run at different levels of UI complexity:
 *   full — the current complete CardSpoke app
 *   lite — simplified CardSpoke (no plugin manager / developer tooling)
 *   os   — future OS-native shell (app modes over the shared object core)
 *
 * Profiles resolve to feature-flag sets; shells consult isFeatureEnabled()
 * instead of hardcoding what to show. DOM-free: environment detection reads
 * globalThis guards only when asked. See docs/architecture/PROFILES.md.
 */

/** Valid profile identifiers. */
export const PROFILES = Object.freeze(['full', 'lite', 'os']);

/** Default profile when none is configured or the value is invalid. */
export const DEFAULT_PROFILE = 'full';

/**
 * Baseline feature flags (the `full` experience). Profiles override these.
 */
export const FEATURE_FLAGS = Object.freeze({
  pluginManager: true,
  developerConsole: true,
  advancedSearch: true,
  dataHub: true,
  typedCards: true,
  appModes: false,
  actionRegistry: true,
  conversionHelpers: true
});

/** Per-profile feature flag overrides. */
export const PROFILE_FEATURES = Object.freeze({
  full: Object.freeze({
    pluginManager: true,
    developerConsole: true,
    advancedSearch: true,
    dataHub: true,
    appModes: false
  }),
  lite: Object.freeze({
    pluginManager: false,
    developerConsole: false,
    advancedSearch: true,
    dataHub: false,
    appModes: false
  }),
  os: Object.freeze({
    pluginManager: false,
    developerConsole: false,
    advancedSearch: true,
    dataHub: false,
    appModes: true
  })
});

/**
 * Normalize a profile name; invalid or missing values fall back safely.
 * @param {*} name
 * @returns {string} A valid profile id.
 */
export function resolveProfile(name) {
  return PROFILES.includes(name) ? name : DEFAULT_PROFILE;
}

/**
 * Resolve the full feature-flag set for a profile.
 * @param {string} [profile]
 * @returns {Object} Flag map (defaults merged with profile overrides).
 */
export function getFeatureFlags(profile) {
  const resolved = resolveProfile(profile);
  return { ...FEATURE_FLAGS, ...(PROFILE_FEATURES[resolved] || {}) };
}

// ── Active profile state ─────────────────────────────────────────────────────

let activeProfile = DEFAULT_PROFILE;

/**
 * Set the active runtime profile. Invalid values fall back to the default.
 * @param {string} profile
 * @returns {string} The profile actually activated.
 */
export function setActiveProfile(profile) {
  activeProfile = resolveProfile(profile);
  return activeProfile;
}

/** @returns {string} The active profile id. */
export function getActiveProfile() {
  return activeProfile;
}

/**
 * Whether a feature is enabled under the active profile.
 * Unknown feature names return false.
 * @param {string} feature
 * @returns {boolean}
 */
export function isFeatureEnabled(feature) {
  const flags = getFeatureFlags(activeProfile);
  return !!flags[feature];
}

/**
 * Detect the configured profile from the runtime environment, in priority:
 *   1. ?profile= URL parameter
 *   2. globalThis.CardSpokeProfile runtime setting
 *   3. the provided fallback (default profile)
 * Safe to call in non-browser contexts.
 * @param {Object} [env] - Optional overrides for testing: { search, globalProfile }
 * @returns {string} A valid profile id.
 */
export function detectProfile(env = {}) {
  let search = env.search;
  if (search === undefined && typeof globalThis !== 'undefined' && globalThis.location) {
    search = globalThis.location.search;
  }
  if (typeof search === 'string' && search) {
    const match = /[?&]profile=([^&]+)/.exec(search);
    if (match && PROFILES.includes(decodeURIComponent(match[1]))) {
      return decodeURIComponent(match[1]);
    }
  }
  const globalProfile = env.globalProfile !== undefined
    ? env.globalProfile
    : (typeof globalThis !== 'undefined' ? globalThis.CardSpokeProfile : undefined);
  if (PROFILES.includes(globalProfile)) return globalProfile;
  return resolveProfile(env.fallback);
}

/**
 * Detect and activate the environment's profile in one step.
 * @param {Object} [env] - See detectProfile().
 * @returns {string} The activated profile.
 */
export function initProfile(env = {}) {
  return setActiveProfile(detectProfile(env));
}
