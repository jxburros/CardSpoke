// Tests for Semantic Selectors (data-plugin-anchor attributes)
import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { readFileSync } from 'fs';

const html = readFileSync('./www/index.html', 'utf8');

// Expected semantic anchors that must be present in index.html
const EXPECTED_ANCHORS = [
  'header',
  'header-inner',
  'brand',
  'save-status',
  'btn-undo',
  'btn-home',
  'btn-theme-toggle',
  'btn-menu',
  'menu-overlay',
  'menu-panel',
  'menu-new-card',
  'menu-plugin-manager',
  'breadcrumbs',
  'main-content',
  'search-container',
  'search-input',
  'toast-container',
  'footer'
];

test('All semantic anchors are present in index.html', () => {
  EXPECTED_ANCHORS.forEach(anchor => {
    const pattern = `data-plugin-anchor="${anchor}"`;
    assert.ok(html.includes(pattern), `Missing anchor: ${anchor}`);
  });
});

test('Anchors are unique in index.html', () => {
  EXPECTED_ANCHORS.forEach(anchor => {
    const pattern = `data-plugin-anchor="${anchor}"`;
    const count = html.split(pattern).length - 1;
    assert.equal(count, 1, `Anchor "${anchor}" should appear exactly once, found ${count}`);
  });
});

test('Header has anchor', () => {
  assert.ok(html.includes('<header class="header" data-plugin-anchor="header">'), 'Header element has anchor');
});

test('Main content has anchor', () => {
  assert.ok(html.includes('data-plugin-anchor="main-content"'), 'Main content has anchor');
});

test('Search input has anchor', () => {
  assert.ok(html.includes('data-plugin-anchor="search-input"'), 'Search input has anchor');
});

test.run();
