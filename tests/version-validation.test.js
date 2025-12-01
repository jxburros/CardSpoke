/**
 * Version Validation Tests
 * Comprehensive tests to ensure version consistency across ALL application files
 */

import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Helper to get the canonical version from package.json
 * This is the single source of truth for the app version
 */
function getCanonicalVersion() {
  const packageJsonPath = join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  return packageJson.version;
}

/**
 * Helper to extract version from a file using a regex pattern
 */
function extractVersion(filePath, pattern) {
  if (!existsSync(filePath)) {
    return { found: false, version: null, error: 'File not found' };
  }
  const content = readFileSync(filePath, 'utf-8');
  const match = content.match(pattern);
  if (match) {
    return { found: true, version: match[1].trim() };
  }
  return { found: false, version: null, error: 'Pattern not matched' };
}

// =====================================================================
// Individual version location tests
// =====================================================================

test('package.json version exists and is valid semver', () => {
  const version = getCanonicalVersion();
  assert.ok(version, 'package.json should have a version');
  assert.ok(/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(version), 
    `Version "${version}" should be valid semver format`);
});

test('APP_VERSION constant in app.js matches package.json', () => {
  const canonicalVersion = getCanonicalVersion();
  const appJsPath = join(__dirname, '..', 'www', 'app.js');
  
  const result = extractVersion(appJsPath, /const APP_VERSION = '([^']+)';/);
  assert.ok(result.found, 'APP_VERSION constant should be found in app.js');
  assert.is(result.version, canonicalVersion, 
    `app.js APP_VERSION (${result.version}) should match package.json (${canonicalVersion})`);
});

test('Version comment in app.js header matches package.json', () => {
  const canonicalVersion = getCanonicalVersion();
  const appJsPath = join(__dirname, '..', 'www', 'app.js');
  
  const result = extractVersion(appJsPath, /\/\/ Version: ([^\n]+)/);
  assert.ok(result.found, 'Version comment should be found in app.js header');
  assert.is(result.version, canonicalVersion, 
    `app.js version comment (${result.version}) should match package.json (${canonicalVersion})`);
});

test('index.html meta tag version matches package.json', () => {
  const canonicalVersion = getCanonicalVersion();
  const indexPath = join(__dirname, '..', 'www', 'index.html');
  
  const result = extractVersion(indexPath, /<meta name="app:version" content="([^"]+)">/);
  assert.ok(result.found, 'app:version meta tag should be found in index.html');
  assert.is(result.version, canonicalVersion, 
    `index.html meta version (${result.version}) should match package.json (${canonicalVersion})`);
});

test('state.js module APP_VERSION matches package.json', () => {
  const canonicalVersion = getCanonicalVersion();
  const stateModulePath = join(__dirname, '..', 'www', 'modules', 'core', 'state.js');
  
  if (!existsSync(stateModulePath)) {
    // Skip if state module doesn't exist (app might be using self-contained version)
    return;
  }
  
  const result = extractVersion(stateModulePath, /export const APP_VERSION = '([^']+)';/);
  assert.ok(result.found, 'APP_VERSION should be found in state.js module');
  assert.is(result.version, canonicalVersion, 
    `state.js APP_VERSION (${result.version}) should match package.json (${canonicalVersion})`);
});

test('state.js module version comment matches package.json', () => {
  const canonicalVersion = getCanonicalVersion();
  const stateModulePath = join(__dirname, '..', 'www', 'modules', 'core', 'state.js');
  
  if (!existsSync(stateModulePath)) {
    // Skip if state module doesn't exist
    return;
  }
  
  const result = extractVersion(stateModulePath, /\* Version: ([^\n*]+)/);
  assert.ok(result.found, 'Version comment should be found in state.js');
  assert.is(result.version, canonicalVersion, 
    `state.js version comment (${result.version}) should match package.json (${canonicalVersion})`);
});

// =====================================================================
// Comprehensive all-versions-match test
// =====================================================================

test('ALL version instances across codebase are consistent', () => {
  const canonicalVersion = getCanonicalVersion();
  const versionLocations = [];
  const mismatches = [];
  
  // Define all version locations to check
  const checks = [
    {
      name: 'package.json version',
      path: join(__dirname, '..', 'package.json'),
      pattern: /"version":\s*"([^"]+)"/,
      required: true
    },
    {
      name: 'app.js APP_VERSION constant',
      path: join(__dirname, '..', 'www', 'app.js'),
      pattern: /const APP_VERSION = '([^']+)';/,
      required: true
    },
    {
      name: 'app.js version comment',
      path: join(__dirname, '..', 'www', 'app.js'),
      pattern: /\/\/ Version: ([^\n]+)/,
      required: true
    },
    {
      name: 'index.html meta tag',
      path: join(__dirname, '..', 'www', 'index.html'),
      pattern: /<meta name="app:version" content="([^"]+)">/,
      required: true
    },
    {
      name: 'state.js APP_VERSION export',
      path: join(__dirname, '..', 'www', 'modules', 'core', 'state.js'),
      pattern: /export const APP_VERSION = '([^']+)';/,
      required: false
    },
    {
      name: 'state.js version comment',
      path: join(__dirname, '..', 'www', 'modules', 'core', 'state.js'),
      pattern: /\* Version: ([^\n*]+)/,
      required: false
    }
  ];
  
  // Check each location
  for (const check of checks) {
    const result = extractVersion(check.path, check.pattern);
    
    if (result.found) {
      versionLocations.push({
        name: check.name,
        version: result.version
      });
      
      if (result.version !== canonicalVersion) {
        mismatches.push({
          name: check.name,
          found: result.version,
          expected: canonicalVersion
        });
      }
    } else if (check.required) {
      mismatches.push({
        name: check.name,
        found: 'NOT FOUND',
        expected: canonicalVersion
      });
    }
  }
  
  // Generate detailed error message if there are mismatches
  if (mismatches.length > 0) {
    const errorDetails = mismatches.map(m => 
      `  - ${m.name}: found "${m.found}", expected "${m.expected}"`
    ).join('\n');
    
    assert.unreachable(
      `Version inconsistencies detected!\n` +
      `Canonical version (from package.json): ${canonicalVersion}\n` +
      `Mismatches:\n${errorDetails}\n\n` +
      `All versions found:\n` +
      versionLocations.map(v => `  - ${v.name}: "${v.version}"`).join('\n')
    );
  }
  
  // Verify we checked at least the required locations
  assert.ok(versionLocations.length >= 4, 
    `Should have found at least 4 version locations, found ${versionLocations.length}`);
});

test.run();
