/**
 * Card Lookup Tests
 * Tests for finding cards by name
 */

import { test } from 'uvu';
import * as assert from 'uvu/assert';
import {
  createTestStore,
  createTestCard,
  addCardToStore
} from './helpers.js';

// Mock functions matching app.js implementation
function normalizeCardName(name) {
  if (!name) return '';
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

function findCardByName(store, cardName) {
  if (!cardName) return null;
  
  const normalizedSearch = normalizeCardName(cardName);
  
  for (const [id, card] of Object.entries(store.cards)) {
    if (normalizeCardName(card.title) === normalizedSearch) {
      return id;
    }
  }
  
  return null;
}

function findCardsByName(store, cardName, exactMatch = true) {
  if (!cardName) return [];
  
  const normalizedSearch = normalizeCardName(cardName);
  const results = [];
  
  for (const [id, card] of Object.entries(store.cards)) {
    const normalizedTitle = normalizeCardName(card.title);
    
    if (exactMatch) {
      if (normalizedTitle === normalizedSearch) {
        results.push({
          id,
          title: card.title,
          similarity: 1.0
        });
      }
    } else {
      if (normalizedTitle.includes(normalizedSearch)) {
        const similarity = normalizedSearch.length / normalizedTitle.length;
        results.push({
          id,
          title: card.title,
          similarity
        });
      }
    }
  }
  
  results.sort((a, b) => b.similarity - a.similarity);
  
  return results;
}

test('findCardByName returns null for empty name', () => {
  const store = createTestStore();
  
  assert.is(findCardByName(store, ''), null);
  assert.is(findCardByName(store, null), null);
  assert.is(findCardByName(store, undefined), null);
});

test('findCardByName finds card by exact title', () => {
  const store = createTestStore();
  const card = createTestCard('My Test Card', 'Content');
  addCardToStore(store, card);
  
  const foundId = findCardByName(store, 'My Test Card');
  assert.is(foundId, card.id);
});

test('findCardByName is case-insensitive', () => {
  const store = createTestStore();
  const card = createTestCard('My Test Card', 'Content');
  addCardToStore(store, card);
  
  assert.is(findCardByName(store, 'my test card'), card.id);
  assert.is(findCardByName(store, 'MY TEST CARD'), card.id);
  assert.is(findCardByName(store, 'My TeSt CaRd'), card.id);
});

test('findCardByName handles whitespace variations', () => {
  const store = createTestStore();
  const card = createTestCard('My  Card', 'Content');
  addCardToStore(store, card);
  
  assert.is(findCardByName(store, 'My Card'), card.id);
  assert.is(findCardByName(store, '  My Card  '), card.id);
});

test('findCardByName returns null if card not found', () => {
  const store = createTestStore();
  const card = createTestCard('Existing Card', 'Content');
  addCardToStore(store, card);
  
  assert.is(findCardByName(store, 'Nonexistent Card'), null);
});

test('findCardByName finds correct card among multiple', () => {
  const store = createTestStore();
  const card1 = createTestCard('First Card', 'Content 1');
  const card2 = createTestCard('Second Card', 'Content 2');
  const card3 = createTestCard('Third Card', 'Content 3');
  addCardToStore(store, card1);
  addCardToStore(store, card2);
  addCardToStore(store, card3);
  
  assert.is(findCardByName(store, 'Second Card'), card2.id);
});

test('findCardsByName returns empty array for empty name', () => {
  const store = createTestStore();
  
  assert.equal(findCardsByName(store, ''), []);
  assert.equal(findCardsByName(store, null), []);
});

test('findCardsByName finds exact matches', () => {
  const store = createTestStore();
  const card = createTestCard('My Card', 'Content');
  addCardToStore(store, card);
  
  const results = findCardsByName(store, 'My Card', true);
  
  assert.is(results.length, 1);
  assert.is(results[0].id, card.id);
  assert.is(results[0].title, 'My Card');
  assert.is(results[0].similarity, 1.0);
});

test('findCardsByName finds partial matches when exactMatch is false', () => {
  const store = createTestStore();
  const card1 = createTestCard('JavaScript Tutorial', 'Content 1');
  const card2 = createTestCard('JavaScript Advanced', 'Content 2');
  const card3 = createTestCard('Python Tutorial', 'Content 3');
  addCardToStore(store, card1);
  addCardToStore(store, card2);
  addCardToStore(store, card3);
  
  const results = findCardsByName(store, 'JavaScript', false);
  
  assert.is(results.length, 2);
  assert.ok(results.some(r => r.id === card1.id));
  assert.ok(results.some(r => r.id === card2.id));
  assert.not.ok(results.some(r => r.id === card3.id));
});

test('findCardsByName returns no matches when exactMatch is true for partial', () => {
  const store = createTestStore();
  const card = createTestCard('JavaScript Tutorial', 'Content');
  addCardToStore(store, card);
  
  const results = findCardsByName(store, 'JavaScript', true);
  
  assert.is(results.length, 0);
});

test('findCardsByName sorts by similarity', () => {
  const store = createTestStore();
  const card1 = createTestCard('JavaScript', 'Content 1');
  const card2 = createTestCard('JavaScript Tutorial Advanced', 'Content 2');
  const card3 = createTestCard('JavaScript Guide', 'Content 3');
  addCardToStore(store, card1);
  addCardToStore(store, card2);
  addCardToStore(store, card3);
  
  const results = findCardsByName(store, 'JavaScript', false);
  
  // First result should be exact match (JavaScript) with similarity 1.0
  assert.is(results[0].id, card1.id);
  assert.is(results[0].similarity, 1.0);
  
  // Others should have lower similarity
  assert.ok(results[1].similarity < 1.0);
  assert.ok(results[2].similarity < 1.0);
});

test('findCardsByName handles case-insensitive partial matches', () => {
  const store = createTestStore();
  const card = createTestCard('JavaScript Tutorial', 'Content');
  addCardToStore(store, card);
  
  const results = findCardsByName(store, 'javascript', false);
  
  assert.is(results.length, 1);
  assert.is(results[0].id, card.id);
});

test('findCardsByName returns empty array when no matches', () => {
  const store = createTestStore();
  const card = createTestCard('JavaScript', 'Content');
  addCardToStore(store, card);
  
  const results = findCardsByName(store, 'Python', false);
  
  assert.is(results.length, 0);
});

test('findCardsByName handles multiple exact matches', () => {
  const store = createTestStore();
  const card1 = createTestCard('My Card', 'Content 1');
  const card2 = createTestCard('My Card', 'Content 2');
  addCardToStore(store, card1);
  addCardToStore(store, card2);
  
  const results = findCardsByName(store, 'My Card', true);
  
  assert.is(results.length, 2);
  assert.ok(results.every(r => r.similarity === 1.0));
});

test.run();
