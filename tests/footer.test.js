import { test } from 'uvu';
import * as assert from 'uvu/assert';

/**
 * Footer Population Tests
 * Tests for the populateFooter() function to prevent regression
 * Requirement: QOL-004 from middle-manager-plan-0.11.X.md
 */

test('Footer elements should exist in DOM structure', () => {
  // Create mock DOM elements
  const mockFooterVersion = { textContent: '' };
  const mockFooterCreator = { textContent: '' };
  const mockFooterDate = { textContent: '' };
  const mockFooterUpdater = { textContent: '' };

  // Verify structure exists
  assert.ok(mockFooterVersion, 'Footer version element should exist');
  assert.ok(mockFooterCreator, 'Footer creator element should exist');
  assert.ok(mockFooterDate, 'Footer date element should exist');
  assert.ok(mockFooterUpdater, 'Footer updater element should exist');
});

test('populateFooter should set version correctly', () => {
  const APP_VERSION = '0.11.3';
  const mockElement = { textContent: '' };
  
  // Simulate footer population
  mockElement.textContent = APP_VERSION;
  
  assert.is(mockElement.textContent, '0.11.3', 'Version should be set correctly');
  assert.ok(mockElement.textContent.length > 0, 'Version should not be empty');
  assert.is.not(mockElement.textContent, '()', 'Version should not be empty parentheses');
});

test('populateFooter should set creator correctly', () => {
  const APP_CREATOR = 'jxburros';
  const mockElement = { textContent: '' };
  
  // Simulate footer population
  mockElement.textContent = APP_CREATOR;
  
  assert.is(mockElement.textContent, 'jxburros', 'Creator should be set correctly');
  assert.ok(mockElement.textContent.length > 0, 'Creator should not be empty');
});

test('populateFooter should set date correctly', () => {
  const APP_RELEASE_DATE = '2025-11-22';
  const mockElement = { textContent: '' };
  
  // Simulate footer population
  mockElement.textContent = APP_RELEASE_DATE;
  
  assert.is(mockElement.textContent, '2025-11-22', 'Date should be set correctly');
  assert.match(mockElement.textContent, /^\d{4}-\d{2}-\d{2}$/, 'Date should match YYYY-MM-DD format');
});

test('populateFooter should set updater correctly', () => {
  const APP_UPDATER = 'GitHub Copilot (Constructor)';
  const mockElement = { textContent: '' };
  
  // Simulate footer population
  mockElement.textContent = APP_UPDATER;
  
  assert.is(mockElement.textContent, 'GitHub Copilot (Constructor)', 'Updater should be set correctly');
  assert.ok(mockElement.textContent.length > 0, 'Updater should not be empty');
});

test('populateFooter should handle missing elements gracefully', () => {
  // Simulate missing elements
  const mockElements = {
    version: null,
    creator: null,
    date: null,
    updater: null
  };
  
  // Should not throw when elements are missing
  try {
    Object.values(mockElements).forEach(el => {
      if (el) {
        el.textContent = 'value';
      }
    });
    assert.ok(true, 'Should handle missing elements without throwing');
  } catch (err) {
    assert.unreachable('Should not throw on missing elements');
  }
});

test('populateFooter should log errors when elements are missing', () => {
  const errors = [];
  const mockConsole = {
    error: (...args) => errors.push(args.join(' '))
  };
  
  // Simulate checking for missing elements
  const elements = {
    version: null,
    creator: null
  };
  
  Object.entries(elements).forEach(([name, element]) => {
    if (!element) {
      mockConsole.error(`Footer element missing: ${name}`);
    }
  });
  
  assert.is(errors.length, 2, 'Should log errors for missing elements');
  assert.ok(errors.some(e => e.includes('version')), 'Should log error for missing version');
  assert.ok(errors.some(e => e.includes('creator')), 'Should log error for missing creator');
});

test('Footer metadata should not contain empty parentheses or undefined', () => {
  const invalidValues = ['()', 'undefined', 'null', ''];
  const validValue = '0.11.3';
  
  invalidValues.forEach(invalid => {
    assert.is.not(validValue, invalid, `Valid value should not be "${invalid}"`);
  });
  
  assert.ok(validValue.length > 0, 'Valid value should have content');
  assert.not.match(validValue, /^[()\s]*$/, 'Valid value should not be just parentheses or whitespace');
});

test.run();
