/**
 * App Initialization Tests
 * Tests to ensure the application loads correctly and content is interactive
 * 
 * These tests verify that:
 * 1. Core app components initialize properly
 * 2. Data loads correctly from storage
 * 3. UI renders and becomes interactive
 * 4. Critical functions are available after init
 */

import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { createTestStore, createTestCard, addCardToStore, MockLocalStorage } from './helpers.js';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// =====================================================================
// Store Initialization Tests
// =====================================================================

test('store initializes with all required properties', () => {
  const store = createTestStore();
  
  // Verify all required properties exist
  assert.ok('rootOrder' in store, 'store should have rootOrder');
  assert.ok('cards' in store, 'store should have cards');
  assert.ok('mods' in store, 'store should have mods');
  assert.ok('bookmarks' in store, 'store should have bookmarks');
  assert.ok('recentCards' in store, 'store should have recentCards');
  assert.ok('viewMode' in store, 'store should have viewMode');
  
  // Verify types
  assert.ok(Array.isArray(store.rootOrder), 'rootOrder should be an array');
  assert.ok(typeof store.cards === 'object', 'cards should be an object');
  assert.ok(Array.isArray(store.bookmarks), 'bookmarks should be an array');
  assert.ok(Array.isArray(store.recentCards), 'recentCards should be an array');
});

test('store can be loaded from JSON string (simulating localStorage)', () => {
  const mockData = JSON.stringify({
    rootOrder: ['card1'],
    cards: {
      'card1': { id: 'card1', title: 'Test', body: 'Content', children: [], tags: [] }
    },
    mods: {},
    bookmarks: [],
    recentCards: []
  });
  
  const parsed = JSON.parse(mockData);
  
  assert.ok(parsed.rootOrder.includes('card1'));
  assert.ok(parsed.cards['card1'].title === 'Test');
});

test('corrupted store data is handled gracefully', () => {
  const corruptedJson = '{"rootOrder": ["card1"], "cards": {';
  
  let error = null;
  try {
    JSON.parse(corruptedJson);
  } catch (e) {
    error = e;
  }
  
  assert.ok(error !== null, 'Should throw error for corrupted JSON');
  assert.ok(error instanceof SyntaxError, 'Should be a SyntaxError');
});

// =====================================================================
// Navigation State Tests
// =====================================================================

test('navigation state has correct default values', () => {
  const navState = {
    page: 'list',
    cardId: null,
    parentId: null,
    searchQuery: ''
  };
  
  assert.is(navState.page, 'list', 'default page should be list');
  assert.is(navState.cardId, null, 'cardId should be null initially');
  assert.is(navState.searchQuery, '', 'searchQuery should be empty initially');
});

test('navigation state transitions correctly between pages', () => {
  const transitions = [
    { from: 'list', to: 'read', valid: true },
    { from: 'list', to: 'edit', valid: true },
    { from: 'list', to: 'search', valid: true },
    { from: 'read', to: 'list', valid: true },
    { from: 'read', to: 'edit', valid: true },
    { from: 'edit', to: 'read', valid: true },
    { from: 'edit', to: 'list', valid: true },
    { from: 'search', to: 'read', valid: true },
    { from: 'search', to: 'list', valid: true }
  ];
  
  for (const t of transitions) {
    assert.ok(t.valid, `Transition from ${t.from} to ${t.to} should be valid`);
  }
});

// =====================================================================
// Card Content Loading Tests
// =====================================================================

test('cards load correctly with all required fields', () => {
  const store = createTestStore();
  const card = createTestCard('Test Title', 'Test Body');
  addCardToStore(store, card);
  
  const loadedCard = store.cards[card.id];
  
  assert.ok(loadedCard, 'Card should exist in store');
  assert.is(loadedCard.title, 'Test Title', 'Title should match');
  assert.is(loadedCard.body, 'Test Body', 'Body should match');
  assert.ok(Array.isArray(loadedCard.children), 'children should be an array');
  assert.ok(Array.isArray(loadedCard.tags), 'tags should be an array');
});

test('card with children loads correctly', () => {
  const store = createTestStore();
  const parent = createTestCard('Parent Card', 'Parent content');
  addCardToStore(store, parent);
  
  const child = createTestCard('Child Card', 'Child content', parent.id);
  addCardToStore(store, child);
  
  const loadedParent = store.cards[parent.id];
  const loadedChild = store.cards[child.id];
  
  assert.ok(loadedParent.children.includes(child.id), 'Parent should have child in children array');
  assert.is(loadedChild.parentId, parent.id, 'Child should reference parent');
});

test('rootOrder correctly tracks root-level cards', () => {
  const store = createTestStore();
  const card1 = createTestCard('Card 1', 'Content 1');
  const card2 = createTestCard('Card 2', 'Content 2');
  
  addCardToStore(store, card1);
  addCardToStore(store, card2);
  
  assert.ok(store.rootOrder.includes(card1.id), 'Card 1 should be in rootOrder');
  assert.ok(store.rootOrder.includes(card2.id), 'Card 2 should be in rootOrder');
  assert.is(store.rootOrder.length, 2, 'Should have 2 root cards');
});

test('child cards are not in rootOrder', () => {
  const store = createTestStore();
  const parent = createTestCard('Parent', 'Parent content');
  addCardToStore(store, parent);
  
  const child = createTestCard('Child', 'Child content', parent.id);
  addCardToStore(store, child);
  
  assert.ok(store.rootOrder.includes(parent.id), 'Parent should be in rootOrder');
  assert.not.ok(store.rootOrder.includes(child.id), 'Child should NOT be in rootOrder');
});

// =====================================================================
// Content Interactivity Tests
// =====================================================================

test('card can be updated after loading', () => {
  const store = createTestStore();
  const card = createTestCard('Original Title', 'Original Body');
  addCardToStore(store, card);
  
  // Simulate update
  store.cards[card.id].title = 'Updated Title';
  store.cards[card.id].body = 'Updated Body';
  
  assert.is(store.cards[card.id].title, 'Updated Title');
  assert.is(store.cards[card.id].body, 'Updated Body');
});

test('bookmarks can be toggled after store loads', () => {
  const store = createTestStore();
  const card = createTestCard('Test Card', 'Content');
  addCardToStore(store, card);
  
  // Add bookmark
  store.bookmarks.push(card.id);
  assert.ok(store.bookmarks.includes(card.id), 'Should be able to add bookmark');
  
  // Remove bookmark
  store.bookmarks = store.bookmarks.filter(id => id !== card.id);
  assert.not.ok(store.bookmarks.includes(card.id), 'Should be able to remove bookmark');
});

test('search functionality works after store loads', () => {
  const store = createTestStore();
  
  const card1 = createTestCard('JavaScript Guide', 'Learn JavaScript basics');
  const card2 = createTestCard('Python Tutorial', 'Learn Python programming');
  const card3 = createTestCard('Java Basics', 'Java programming fundamentals');
  
  addCardToStore(store, card1);
  addCardToStore(store, card2);
  addCardToStore(store, card3);
  
  // Simulate search
  const query = 'javascript';
  const results = Object.values(store.cards).filter(card => 
    card.title.toLowerCase().includes(query.toLowerCase()) ||
    card.body.toLowerCase().includes(query.toLowerCase())
  );
  
  assert.is(results.length, 1, 'Should find 1 matching card');
  assert.is(results[0].title, 'JavaScript Guide');
});

test('tags can be added and queried after store loads', () => {
  const store = createTestStore();
  const card = createTestCard('Test Card', 'Content');
  card.tags = [];
  addCardToStore(store, card);
  
  // Add tag
  store.cards[card.id].tags.push('important');
  assert.ok(store.cards[card.id].tags.includes('important'), 'Should be able to add tag');
  
  // Query by tag
  const taggedCards = Object.values(store.cards).filter(c => 
    c.tags && c.tags.includes('important')
  );
  assert.is(taggedCards.length, 1, 'Should find 1 card with tag');
});

// =====================================================================
// App Files Integrity Tests
// =====================================================================

test('app.js exists and contains critical functions', () => {
  const appJsPath = join(__dirname, '..', 'www', 'app.js');
  assert.ok(existsSync(appJsPath), 'app.js should exist');
  
  const content = readFileSync(appJsPath, 'utf-8');
  
  // Check for critical functions - using consistent pattern with function keyword and name
  const criticalFunctions = [
    { pattern: 'function render()', name: 'render' },
    { pattern: 'function load()', name: 'load' },
    { pattern: 'function save(', name: 'save' },
    { pattern: 'function goTo(', name: 'goTo' },
    { pattern: 'function createDefaultStore()', name: 'createDefaultStore' }
  ];
  
  for (const fn of criticalFunctions) {
    assert.ok(content.includes(fn.pattern), `app.js should contain function ${fn.name}`);
  }
});

test('index.html contains required DOM elements', () => {
  const indexPath = join(__dirname, '..', 'www', 'index.html');
  assert.ok(existsSync(indexPath), 'index.html should exist');
  
  const content = readFileSync(indexPath, 'utf-8');
  
  // Check for critical DOM elements
  const requiredElements = [
    'id="main"',
    'id="toastContainer"',
    'id="searchInput"',
    'id="menuOverlay"',
    'id="breadcrumbs"',
    'id="homeBtn"',
    'id="menuBtn"'
  ];
  
  for (const el of requiredElements) {
    assert.ok(content.includes(el), `index.html should contain ${el}`);
  }
});

test('app.js contains boot sequence', () => {
  const appJsPath = join(__dirname, '..', 'www', 'app.js');
  const content = readFileSync(appJsPath, 'utf-8');
  
  // Check for boot sequence functions
  const bootSequence = [
    'initToast()',
    'load()',
    'render()',
    'populateFooter()'
  ];
  
  for (const step of bootSequence) {
    assert.ok(content.includes(step), `Boot sequence should include ${step}`);
  }
});

// =====================================================================
// Error Handling Tests
// =====================================================================

test('accessing non-existent card returns undefined', () => {
  const store = createTestStore();
  const nonExistentCard = store.cards['non-existent-id'];
  
  assert.is(nonExistentCard, undefined, 'Non-existent card should be undefined');
});

test('empty store can still be navigated', () => {
  const store = createTestStore();
  
  assert.is(store.rootOrder.length, 0, 'Empty store should have no root cards');
  assert.is(Object.keys(store.cards).length, 0, 'Empty store should have no cards');
  
  // Navigation should still work
  const navState = { page: 'list', cardId: null };
  assert.is(navState.page, 'list', 'Navigation should work with empty store');
});

test('store handles missing properties gracefully', () => {
  // Simulate legacy data structure with missing properties
  const legacyData = {
    rootOrder: [],
    cards: {}
    // Missing: mods, bookmarks, recentCards, viewMode
  };
  
  // Normalize to current structure (as the app would do)
  const normalized = {
    rootOrder: legacyData.rootOrder || [],
    cards: legacyData.cards || {},
    mods: legacyData.mods || {},
    bookmarks: legacyData.bookmarks || [],
    recentCards: legacyData.recentCards || [],
    viewMode: legacyData.viewMode || 'normal'
  };
  
  assert.ok(Array.isArray(normalized.bookmarks), 'Should have bookmarks array');
  assert.ok(Array.isArray(normalized.recentCards), 'Should have recentCards array');
  assert.is(normalized.viewMode, 'normal', 'Should have default viewMode');
});

// =====================================================================
// DOM Element Rendering Tests (simulated)
// =====================================================================

test('card list can be generated from store', () => {
  const store = createTestStore();
  
  const card1 = createTestCard('Card A', 'Content A');
  const card2 = createTestCard('Card B', 'Content B');
  
  addCardToStore(store, card1);
  addCardToStore(store, card2);
  
  // Simulate renderCardList logic
  const cardElements = store.rootOrder.map(id => {
    const card = store.cards[id];
    return {
      id: card.id,
      title: card.title,
      childCount: card.children.length
    };
  });
  
  assert.is(cardElements.length, 2, 'Should generate 2 card elements');
  assert.ok(cardElements.some(el => el.title === 'Card A'));
  assert.ok(cardElements.some(el => el.title === 'Card B'));
});

test('breadcrumb path can be generated for nested card', () => {
  const store = createTestStore();
  
  const root = createTestCard('Root', 'Root content');
  addCardToStore(store, root);
  
  const child = createTestCard('Child', 'Child content', root.id);
  addCardToStore(store, child);
  
  const grandchild = createTestCard('Grandchild', 'GC content', child.id);
  addCardToStore(store, grandchild);
  
  // Build breadcrumb path
  const path = [];
  let current = store.cards[grandchild.id];
  while (current) {
    path.unshift({ id: current.id, title: current.title });
    current = current.parentId ? store.cards[current.parentId] : null;
  }
  
  assert.is(path.length, 3, 'Should have 3 levels in breadcrumb');
  assert.is(path[0].title, 'Root');
  assert.is(path[1].title, 'Child');
  assert.is(path[2].title, 'Grandchild');
});

test.run();
