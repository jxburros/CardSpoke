/**
 * Store Structure Tests
 * Tests for data store integrity and structure
 */

const { test } = require('uvu');
const assert = require('uvu/assert');
const {
  createTestStore,
  createTestCard,
  addCardToStore,
  deleteCardFromStore,
  MockLocalStorage
} = require('./helpers');

test('createTestStore creates valid store structure', () => {
  const store = createTestStore();
  
  assert.ok(Array.isArray(store.rootOrder), 'rootOrder should be an array');
  assert.type(store.cards, 'object', 'cards should be an object');
  assert.type(store.mods, 'object', 'mods should be an object');
  assert.ok(Array.isArray(store.bookmarks), 'bookmarks should be an array');
  assert.ok(Array.isArray(store.recentCards), 'recentCards should be an array');
  assert.is(store.viewMode, 'normal', 'viewMode should default to normal');
});

test('store maintains card count correctly', () => {
  const store = createTestStore();
  
  assert.is(Object.keys(store.cards).length, 0, 'Should start with 0 cards');
  
  const card1 = createTestCard('Card 1', 'Content 1');
  addCardToStore(store, card1);
  assert.is(Object.keys(store.cards).length, 1, 'Should have 1 card');
  
  const card2 = createTestCard('Card 2', 'Content 2');
  addCardToStore(store, card2);
  assert.is(Object.keys(store.cards).length, 2, 'Should have 2 cards');
  
  deleteCardFromStore(store, card1.id);
  assert.is(Object.keys(store.cards).length, 1, 'Should have 1 card after deletion');
});

test('store maintains rootOrder integrity', () => {
  const store = createTestStore();
  const card1 = createTestCard('Root 1', 'Content 1');
  const card2 = createTestCard('Root 2', 'Content 2');
  const child = createTestCard('Child', 'Child content', card1.id);
  
  addCardToStore(store, card1);
  addCardToStore(store, card2);
  addCardToStore(store, child);
  
  assert.is(store.rootOrder.length, 2, 'Should have 2 root cards');
  assert.ok(store.rootOrder.includes(card1.id), 'Should include card1');
  assert.ok(store.rootOrder.includes(card2.id), 'Should include card2');
  assert.not.ok(store.rootOrder.includes(child.id), 'Should not include child');
});

test('store cleanup removes card from all collections', () => {
  const store = createTestStore();
  const card = createTestCard('Test Card', 'Content');
  
  addCardToStore(store, card);
  store.bookmarks.push(card.id);
  store.recentCards.push(card.id);
  
  deleteCardFromStore(store, card.id);
  
  assert.not.ok(store.cards[card.id], 'Card should be removed from cards');
  assert.not.ok(store.rootOrder.includes(card.id), 'Card should be removed from rootOrder');
  assert.not.ok(store.bookmarks.includes(card.id), 'Card should be removed from bookmarks');
  assert.not.ok(store.recentCards.includes(card.id), 'Card should be removed from recentCards');
});

test('viewMode can be toggled', () => {
  const store = createTestStore();
  
  assert.is(store.viewMode, 'normal', 'Should start as normal');
  
  store.viewMode = 'compact';
  assert.is(store.viewMode, 'compact', 'Should change to compact');
  
  store.viewMode = 'normal';
  assert.is(store.viewMode, 'normal', 'Should change back to normal');
});

// MockLocalStorage Tests
test('MockLocalStorage can store and retrieve items', () => {
  const storage = new MockLocalStorage();
  
  storage.setItem('key1', 'value1');
  assert.is(storage.getItem('key1'), 'value1', 'Should retrieve stored value');
});

test('MockLocalStorage returns null for non-existent keys', () => {
  const storage = new MockLocalStorage();
  
  assert.is(storage.getItem('non_existent'), null, 'Should return null for non-existent key');
});

test('MockLocalStorage can remove items', () => {
  const storage = new MockLocalStorage();
  
  storage.setItem('key1', 'value1');
  storage.removeItem('key1');
  
  assert.is(storage.getItem('key1'), null, 'Should return null after removal');
});

test('MockLocalStorage can be cleared', () => {
  const storage = new MockLocalStorage();
  
  storage.setItem('key1', 'value1');
  storage.setItem('key2', 'value2');
  storage.clear();
  
  assert.is(storage.length, 0, 'Should have no items after clear');
  assert.is(storage.getItem('key1'), null, 'key1 should be null');
  assert.is(storage.getItem('key2'), null, 'key2 should be null');
});

test('MockLocalStorage tracks length correctly', () => {
  const storage = new MockLocalStorage();
  
  assert.is(storage.length, 0, 'Should start with length 0');
  
  storage.setItem('key1', 'value1');
  assert.is(storage.length, 1, 'Should have length 1');
  
  storage.setItem('key2', 'value2');
  assert.is(storage.length, 2, 'Should have length 2');
  
  storage.removeItem('key1');
  assert.is(storage.length, 1, 'Should have length 1 after removal');
});

test('MockLocalStorage converts values to strings', () => {
  const storage = new MockLocalStorage();
  
  storage.setItem('number', 123);
  storage.setItem('object', { key: 'value' });
  
  assert.is(storage.getItem('number'), '123', 'Number should be converted to string');
  assert.is(storage.getItem('object'), '[object Object]', 'Object should be converted to string');
});

test('store can handle complex hierarchies', () => {
  const store = createTestStore();
  
  // Create a tree structure:
  // Root1
  //   - Child1
  //     - Grandchild1
  //     - Grandchild2
  //   - Child2
  // Root2
  
  const root1 = createTestCard('Root 1', 'Root 1 content');
  const root2 = createTestCard('Root 2', 'Root 2 content');
  const child1 = createTestCard('Child 1', 'Child 1 content', root1.id);
  const child2 = createTestCard('Child 2', 'Child 2 content', root1.id);
  const grandchild1 = createTestCard('Grandchild 1', 'GC1 content', child1.id);
  const grandchild2 = createTestCard('Grandchild 2', 'GC2 content', child1.id);
  
  addCardToStore(store, root1);
  addCardToStore(store, root2);
  addCardToStore(store, child1);
  addCardToStore(store, child2);
  addCardToStore(store, grandchild1);
  addCardToStore(store, grandchild2);
  
  // Verify structure
  assert.is(store.rootOrder.length, 2, 'Should have 2 root cards');
  assert.is(root1.children.length, 2, 'Root1 should have 2 children');
  assert.is(child1.children.length, 2, 'Child1 should have 2 children');
  assert.is(Object.keys(store.cards).length, 6, 'Should have 6 total cards');
});

test.run();
