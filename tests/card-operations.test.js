/**
 * Card Operations Tests
 * Tests for creating, reading, updating, and deleting cards
 */

import { test } from 'uvu';
import * as assert from 'uvu/assert';
import {
  createTestStore,
  createTestCard,
  addCardToStore,
  deleteCardFromStore
} from './helpers.js';

test('createTestCard creates a valid card', () => {
  const card = createTestCard('Test Title', 'Test Body');
  
  assert.ok(card.id, 'Card should have an ID');
  assert.is(card.title, 'Test Title', 'Card should have correct title');
  assert.is(card.body, 'Test Body', 'Card should have correct body');
  assert.is(card.parentId, null, 'Card should have null parentId by default');
  assert.ok(Array.isArray(card.children), 'Card should have children array');
  assert.ok(Array.isArray(card.tags), 'Card should have tags array');
  assert.type(card.meta, 'object', 'Card should have meta object');
  assert.type(card.attributes, 'object', 'Card should have attributes object');
  assert.type(card.modsData, 'object', 'Card should have modsData object');
});

test('createTestCard can create a child card', () => {
  const parent = createTestCard('Parent', 'Parent body');
  const child = createTestCard('Child', 'Child body', parent.id);
  
  assert.is(child.parentId, parent.id, 'Child should have correct parentId');
});

test('addCardToStore adds card to root level', () => {
  const store = createTestStore();
  const card = createTestCard('Root Card', 'Content');
  
  addCardToStore(store, card);
  
  assert.is(store.cards[card.id], card, 'Card should be in cards object');
  assert.ok(store.rootOrder.includes(card.id), 'Card ID should be in rootOrder');
});

test('addCardToStore adds card as child', () => {
  const store = createTestStore();
  const parent = createTestCard('Parent', 'Parent body');
  const child = createTestCard('Child', 'Child body', parent.id);
  
  addCardToStore(store, parent);
  addCardToStore(store, child);
  
  assert.is(store.cards[child.id], child, 'Child should be in cards object');
  assert.ok(parent.children.includes(child.id), 'Parent should have child ID in children array');
  assert.not.ok(store.rootOrder.includes(child.id), 'Child should not be in rootOrder');
});

test('deleteCardFromStore removes root card', () => {
  const store = createTestStore();
  const card = createTestCard('Root Card', 'Content');
  
  addCardToStore(store, card);
  const result = deleteCardFromStore(store, card.id);
  
  assert.is(result, true, 'Delete should return true');
  assert.not.ok(store.cards[card.id], 'Card should be removed from cards object');
  assert.not.ok(store.rootOrder.includes(card.id), 'Card ID should be removed from rootOrder');
});

test('deleteCardFromStore removes child card', () => {
  const store = createTestStore();
  const parent = createTestCard('Parent', 'Parent body');
  const child = createTestCard('Child', 'Child body', parent.id);
  
  addCardToStore(store, parent);
  addCardToStore(store, child);
  deleteCardFromStore(store, child.id);
  
  assert.not.ok(store.cards[child.id], 'Child should be removed from cards object');
  assert.not.ok(parent.children.includes(child.id), 'Child ID should be removed from parent children');
});

test('deleteCardFromStore recursively deletes children', () => {
  const store = createTestStore();
  const parent = createTestCard('Parent', 'Parent body');
  const child1 = createTestCard('Child 1', 'Child 1 body', parent.id);
  const child2 = createTestCard('Child 2', 'Child 2 body', parent.id);
  const grandchild = createTestCard('Grandchild', 'Grandchild body', child1.id);
  
  addCardToStore(store, parent);
  addCardToStore(store, child1);
  addCardToStore(store, child2);
  addCardToStore(store, grandchild);
  
  deleteCardFromStore(store, parent.id);
  
  assert.not.ok(store.cards[parent.id], 'Parent should be removed');
  assert.not.ok(store.cards[child1.id], 'Child 1 should be removed');
  assert.not.ok(store.cards[child2.id], 'Child 2 should be removed');
  assert.not.ok(store.cards[grandchild.id], 'Grandchild should be removed');
});

test('deleteCardFromStore returns false for non-existent card', () => {
  const store = createTestStore();
  const result = deleteCardFromStore(store, 'non_existent_id');
  
  assert.is(result, false, 'Delete should return false for non-existent card');
});

test('multiple root cards can be added', () => {
  const store = createTestStore();
  const card1 = createTestCard('Card 1', 'Content 1');
  const card2 = createTestCard('Card 2', 'Content 2');
  const card3 = createTestCard('Card 3', 'Content 3');
  
  addCardToStore(store, card1);
  addCardToStore(store, card2);
  addCardToStore(store, card3);
  
  assert.is(store.rootOrder.length, 3, 'Should have 3 root cards');
  assert.is(Object.keys(store.cards).length, 3, 'Should have 3 cards in store');
});

test('card hierarchy maintains integrity', () => {
  const store = createTestStore();
  const parent = createTestCard('Parent', 'Parent body');
  const child1 = createTestCard('Child 1', 'Child 1 body', parent.id);
  const child2 = createTestCard('Child 2', 'Child 2 body', parent.id);
  
  addCardToStore(store, parent);
  addCardToStore(store, child1);
  addCardToStore(store, child2);
  
  assert.is(parent.children.length, 2, 'Parent should have 2 children');
  assert.ok(parent.children.includes(child1.id), 'Parent should include child1');
  assert.ok(parent.children.includes(child2.id), 'Parent should include child2');
  assert.is(store.rootOrder.length, 1, 'Should have 1 root card');
});

test.run();
