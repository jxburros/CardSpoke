/**
 * Version Validation Tests
 * Tests to ensure version consistency across the application
 */

import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

test('APP_VERSION constant matches package.json version', () => {
  // Read package.json
  const packageJsonPath = join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  const packageVersion = packageJson.version;
  
  // Read app.js and extract APP_VERSION
  const appJsPath = join(__dirname, '..', 'www', 'app.js');
  const appJsContent = readFileSync(appJsPath, 'utf-8');
  
  // Extract APP_VERSION using regex
  const versionMatch = appJsContent.match(/const APP_VERSION = '([^']+)';/);
  assert.ok(versionMatch, 'APP_VERSION constant should be found in app.js');
  
  const appVersion = versionMatch[1];
  
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
