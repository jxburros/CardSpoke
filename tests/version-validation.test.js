/**
 * Version Validation Tests
 * Tests to ensure version consistency across the application
 */

import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

test('APP_VERSION constant matches package.json version', () => {
  // Read package.json
  const packageJsonPath = join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  const packageVersion = packageJson.version;
  
  // Check for APP_VERSION in either app.js or the state module
  const appJsPath = join(__dirname, '..', 'www', 'app.js');
  const stateModulePath = join(__dirname, '..', 'www', 'modules', 'core', 'state.js');
  
  let appVersion = null;
  
  // First try the state module (ES modules refactored version)
  if (existsSync(stateModulePath)) {
    const stateModuleContent = readFileSync(stateModulePath, 'utf-8');
    const stateVersionMatch = stateModuleContent.match(/export const APP_VERSION = '([^']+)';/);
    if (stateVersionMatch) {
      appVersion = stateVersionMatch[1];
    }
  }
  
  // Fall back to app.js if not found in module
  if (!appVersion) {
    const appJsContent = readFileSync(appJsPath, 'utf-8');
    const versionMatch = appJsContent.match(/const APP_VERSION = '([^']+)';/);
    assert.ok(versionMatch, 'APP_VERSION constant should be found in app.js or modules/core/state.js');
    appVersion = versionMatch[1];
  }
  
  assert.ok(appVersion, 'APP_VERSION should be found');
  
  // Compare versions
  assert.is(appVersion, packageVersion, 
    `APP_VERSION (${appVersion}) should match package.json version (${packageVersion})`
  );
});

test('Version comment in app.js matches package.json version', () => {
  // Read package.json
  const packageJsonPath = join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  const packageVersion = packageJson.version;
  
  // Read app.js and extract version comment
  const appJsPath = join(__dirname, '..', 'www', 'app.js');
  const appJsContent = readFileSync(appJsPath, 'utf-8');
  
  // Extract version comment using regex
  const versionCommentMatch = appJsContent.match(/\/\/ Version: ([^\n]+)/);
  assert.ok(versionCommentMatch, 'Version comment should be found in app.js');
  
  const commentVersion = versionCommentMatch[1].trim();
  
  // Compare versions
  assert.is(commentVersion, packageVersion, 
    `Version comment (${commentVersion}) should match package.json version (${packageVersion})`
  );
});

test.run();
