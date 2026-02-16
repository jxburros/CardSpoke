/**
 * Accessibility API Tests
 * Tests for the accessibility customization API (v0.13.1)
 */

import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read app.js content for testing
const appJsPath = join(__dirname, '..', 'www', 'app.js');
const appJsContent = readFileSync(appJsPath, 'utf-8');

// Read styles.css for testing
const stylesCssPath = join(__dirname, '..', 'www', 'styles.css');
const stylesCssContent = readFileSync(stylesCssPath, 'utf-8');

// Test: Accessibility API methods exist in app.js
test('Accessibility API methods exist in app.js', () => {
  const requiredMethods = [
    'getAccessibilitySettings',
    'setTheme',
    'getTheme',
    'setTypography',
    'getTypography',
    'setHighContrast',
    'isHighContrast',
    'prefersReducedMotion',
    'getThemeVariables'
  ];
  
  requiredMethods.forEach(method => {
    assert.ok(
      appJsContent.includes(`${method}:`),
      `CardSpoke.utils.${method} should be defined`
    );
  });
});

// Test: Typography CSS variables exist in styles.css
test('Typography preset CSS variables exist', () => {
  const typographyVars = [
    '--typography-font-size-default',
    '--typography-line-height-default',
    '--typography-font-size-comfortable',
    '--typography-line-height-comfortable',
    '--typography-font-size-compact',
    '--typography-line-height-compact',
    '--typography-font-size-dyslexia',
    '--typography-line-height-dyslexia',
    '--typography-letter-spacing-dyslexia',
    '--typography-word-spacing-dyslexia',
    '--typography-font-dyslexia'
  ];
  
  typographyVars.forEach(varName => {
    assert.ok(
      stylesCssContent.includes(varName),
      `CSS variable ${varName} should be defined`
    );
  });
});

// Test: High contrast CSS variables exist in styles.css
test('High contrast mode CSS variables exist', () => {
  const hcVars = [
    '--hc-bg',
    '--hc-bg-secondary',
    '--hc-bg-tertiary',
    '--hc-text',
    '--hc-text-secondary',
    '--hc-border',
    '--hc-accent',
    '--hc-accent-hover',
    '--hc-border-width',
    '--hc-button-border-width',
    '--hc-card-border-width'
  ];
  
  hcVars.forEach(varName => {
    assert.ok(
      stylesCssContent.includes(varName),
      `CSS variable ${varName} should be defined`
    );
  });
});

// Test: Focus state CSS variables exist in styles.css
test('Focus state CSS variables exist', () => {
  const focusVars = [
    '--focus-outline-color',
    '--focus-outline-width',
    '--focus-outline-offset',
    '--focus-outline-style'
  ];
  
  focusVars.forEach(varName => {
    assert.ok(
      stylesCssContent.includes(varName),
      `CSS variable ${varName} should be defined`
    );
  });
});

// Test: Typography presets use customizable variables
test('Typography presets use customizable variables', () => {
  assert.ok(
    stylesCssContent.includes('var(--typography-font-size-default'),
    'Default typography preset should use customizable font-size variable'
  );
  assert.ok(
    stylesCssContent.includes('var(--typography-font-size-dyslexia'),
    'Dyslexia typography preset should use customizable font-size variable'
  );
});

// Test: High contrast mode uses customizable variables
test('High contrast mode uses customizable variables', () => {
  assert.ok(
    stylesCssContent.includes('var(--hc-bg'),
    'High contrast mode should use customizable background variable'
  );
  assert.ok(
    stylesCssContent.includes('var(--hc-text'),
    'High contrast mode should use customizable text variable'
  );
  assert.ok(
    stylesCssContent.includes('var(--hc-accent'),
    'High contrast mode should use customizable accent variable'
  );
});

// Test: Focus styles use customizable variables
test('Focus styles use customizable variables', () => {
  assert.ok(
    stylesCssContent.includes('var(--focus-outline-width'),
    'Focus styles should use customizable outline width variable'
  );
  assert.ok(
    stylesCssContent.includes('var(--focus-outline-color'),
    'Focus styles should use customizable outline color variable'
  );
});

// Test: Dark mode overrides accessibility variables
test('Dark mode has accessibility variable overrides', () => {
  // Check that dark mode section exists with focus outline override
  assert.ok(
    stylesCssContent.includes(':root.dark') && stylesCssContent.includes('--focus-outline-color'),
    'Dark mode should be able to override focus outline color'
  );
});

test.run();
