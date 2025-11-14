/**
 * Tags API Tests
 * Tests for tag management functions
 */

import { test } from 'uvu';
import * as assert from 'uvu/assert';
import {
  createTestStore,
  createTestCard,
  addCardToStore
} from './helpers.js';

// Mock functions to simulate the actual app.js behavior
function getTags(store, cardId) {
  const card = store.cards[cardId];
  if (!card) return [];
  return card.tags || [];
}

function addTag(store, cardId, tag) {
  const card = store.cards[cardId];
  if (!card) return false;
  
  const normalizedTag = tag.replace(/^#/, '').toLowerCase().trim();
  if (!normalizedTag) return false;
  
  if (!card.tags) card.tags = [];
  
  if (card.tags.some(t => t.toLowerCase() === normalizedTag)) {
    return false;
  }
  
  card.tags.push(normalizedTag);
  card.updatedAt = Date.now();
  
  return true;
}

function removeTag(store, cardId, tag) {
  const card = store.cards[cardId];
  if (!card || !card.tags) return false;
  
  const normalizedTag = tag.replace(/^#/, '').toLowerCase().trim();
  
  const initialLength = card.tags.length;
  card.tags = card.tags.filter(t => t.toLowerCase() !== normalizedTag);
  
  if (card.tags.length === initialLength) {
    return false;
  }
  
  card.updatedAt = Date.now();
  
  return true;
}

function setTags(store, cardId, tags) {
  const card = store.cards[cardId];
  if (!card) return false;
  
  const normalizedTags = tags
    .map(tag => tag.replace(/^#/, '').toLowerCase().trim())
    .filter(tag => tag.length > 0);
  
  card.tags = [...new Set(normalizedTags)];
  card.updatedAt = Date.now();
  
  return true;
}

function getAllTags(store) {
  const allTags = new Set();
  Object.values(store.cards).forEach(card => {
    if (card.tags) {
      card.tags.forEach(tag => allTags.add(tag));
    }
  });
  return Array.from(allTags).sort();
}

test('getTags returns empty array for card with no tags', () => {
  const store = createTestStore();
  const card = createTestCard('Test', 'Body');
  addCardToStore(store, card);
  
  const tags = getTags(store, card.id);
  assert.ok(Array.isArray(tags), 'Should return an array');
  assert.is(tags.length, 0, 'Should return empty array');
});

test('getTags returns card tags', () => {
  const store = createTestStore();
  const card = createTestCard('Test', 'Body');
  card.tags = ['javascript', 'testing'];
  addCardToStore(store, card);
  
  const tags = getTags(store, card.id);
  assert.is(tags.length, 2, 'Should return 2 tags');
  assert.ok(tags.includes('javascript'), 'Should include javascript tag');
  assert.ok(tags.includes('testing'), 'Should include testing tag');
});

test('getTags returns empty array for non-existent card', () => {
  const store = createTestStore();
  
  const tags = getTags(store, 'non_existent_id');
  assert.ok(Array.isArray(tags), 'Should return an array');
  assert.is(tags.length, 0, 'Should return empty array');
});

test('addTag adds a tag to a card', () => {
  const store = createTestStore();
  const card = createTestCard('Test', 'Body');
  addCardToStore(store, card);
  
  const result = addTag(store, card.id, 'newtag');
  assert.is(result, true, 'Should return true on success');
  
  const tags = getTags(store, card.id);
  assert.is(tags.length, 1, 'Should have 1 tag');
  assert.is(tags[0], 'newtag', 'Tag should be normalized to lowercase');
});

test('addTag normalizes tags (removes # and converts to lowercase)', () => {
  const store = createTestStore();
  const card = createTestCard('Test', 'Body');
  addCardToStore(store, card);
  
  addTag(store, card.id, '#JavaScript');
  const tags = getTags(store, card.id);
  
  assert.is(tags[0], 'javascript', 'Tag should be lowercase without #');
});

test('addTag prevents duplicate tags (case-insensitive)', () => {
  const store = createTestStore();
  const card = createTestCard('Test', 'Body');
  addCardToStore(store, card);
  
  const result1 = addTag(store, card.id, 'testing');
  const result2 = addTag(store, card.id, 'Testing');
  const result3 = addTag(store, card.id, '#TESTING');
  
  assert.is(result1, true, 'First add should succeed');
  assert.is(result2, false, 'Duplicate should fail');
  assert.is(result3, false, 'Case-insensitive duplicate should fail');
  
  const tags = getTags(store, card.id);
  assert.is(tags.length, 1, 'Should only have 1 tag');
});

test('addTag returns false for non-existent card', () => {
  const store = createTestStore();
  
  const result = addTag(store, 'non_existent_id', 'tag');
  assert.is(result, false, 'Should return false for non-existent card');
});

test('addTag returns false for empty tag', () => {
  const store = createTestStore();
  const card = createTestCard('Test', 'Body');
  addCardToStore(store, card);
  
  const result1 = addTag(store, card.id, '');
  const result2 = addTag(store, card.id, '   ');
  const result3 = addTag(store, card.id, '#');
  
  assert.is(result1, false, 'Empty tag should fail');
  assert.is(result2, false, 'Whitespace-only tag should fail');
  assert.is(result3, false, 'Only # should fail');
});

test('removeTag removes a tag from a card', () => {
  const store = createTestStore();
  const card = createTestCard('Test', 'Body');
  card.tags = ['javascript', 'testing'];
  addCardToStore(store, card);
  
  const result = removeTag(store, card.id, 'javascript');
  assert.is(result, true, 'Should return true on success');
  
  const tags = getTags(store, card.id);
  assert.is(tags.length, 1, 'Should have 1 tag left');
  assert.is(tags[0], 'testing', 'Should keep the other tag');
});

test('removeTag is case-insensitive', () => {
  const store = createTestStore();
  const card = createTestCard('Test', 'Body');
  card.tags = ['javascript'];
  addCardToStore(store, card);
  
  const result = removeTag(store, card.id, 'JavaScript');
  assert.is(result, true, 'Should remove tag case-insensitively');
  
  const tags = getTags(store, card.id);
  assert.is(tags.length, 0, 'Tag should be removed');
});

test('removeTag returns false if tag not found', () => {
  const store = createTestStore();
  const card = createTestCard('Test', 'Body');
  card.tags = ['javascript'];
  addCardToStore(store, card);
  
  const result = removeTag(store, card.id, 'python');
  assert.is(result, false, 'Should return false if tag not found');
});

test('removeTag returns false for non-existent card', () => {
  const store = createTestStore();
  
  const result = removeTag(store, 'non_existent_id', 'tag');
  assert.is(result, false, 'Should return false for non-existent card');
});

test('setTags replaces all tags', () => {
  const store = createTestStore();
  const card = createTestCard('Test', 'Body');
  card.tags = ['old1', 'old2'];
  addCardToStore(store, card);
  
  const result = setTags(store, card.id, ['new1', 'new2', 'new3']);
  assert.is(result, true, 'Should return true on success');
  
  const tags = getTags(store, card.id);
  assert.is(tags.length, 3, 'Should have 3 tags');
  assert.ok(tags.includes('new1'), 'Should include new1');
  assert.ok(tags.includes('new2'), 'Should include new2');
  assert.ok(tags.includes('new3'), 'Should include new3');
  assert.not.ok(tags.includes('old1'), 'Should not include old1');
});

test('setTags normalizes all tags', () => {
  const store = createTestStore();
  const card = createTestCard('Test', 'Body');
  addCardToStore(store, card);
  
  setTags(store, card.id, ['#JavaScript', 'PYTHON', '  Ruby  ']);
  const tags = getTags(store, card.id);
  
  assert.is(tags.length, 3, 'Should have 3 tags');
  assert.ok(tags.includes('javascript'), 'Should normalize JavaScript');
  assert.ok(tags.includes('python'), 'Should normalize PYTHON');
  assert.ok(tags.includes('ruby'), 'Should normalize Ruby');
});

test('setTags removes duplicates', () => {
  const store = createTestStore();
  const card = createTestCard('Test', 'Body');
  addCardToStore(store, card);
  
  setTags(store, card.id, ['tag1', 'TAG1', 'tag2', '#tag1']);
  const tags = getTags(store, card.id);
  
  assert.is(tags.length, 2, 'Should have 2 unique tags');
});

test('setTags can clear all tags', () => {
  const store = createTestStore();
  const card = createTestCard('Test', 'Body');
  card.tags = ['tag1', 'tag2'];
  addCardToStore(store, card);
  
  setTags(store, card.id, []);
  const tags = getTags(store, card.id);
  
  assert.is(tags.length, 0, 'Should have no tags');
});

test('getAllTags returns all unique tags', () => {
  const store = createTestStore();
  
  const card1 = createTestCard('Card 1', 'Body 1');
  card1.tags = ['javascript', 'testing'];
  addCardToStore(store, card1);
  
  const card2 = createTestCard('Card 2', 'Body 2');
  card2.tags = ['python', 'testing'];
  addCardToStore(store, card2);
  
  const card3 = createTestCard('Card 3', 'Body 3');
  card3.tags = ['javascript'];
  addCardToStore(store, card3);
  
  const allTags = getAllTags(store);
  
  assert.is(allTags.length, 3, 'Should have 3 unique tags');
  assert.ok(allTags.includes('javascript'), 'Should include javascript');
  assert.ok(allTags.includes('python'), 'Should include python');
  assert.ok(allTags.includes('testing'), 'Should include testing');
});

test('getAllTags returns empty array when no cards have tags', () => {
  const store = createTestStore();
  
  const card1 = createTestCard('Card 1', 'Body 1');
  addCardToStore(store, card1);
  
  const allTags = getAllTags(store);
  
  assert.ok(Array.isArray(allTags), 'Should return an array');
  assert.is(allTags.length, 0, 'Should return empty array');
});

test('getAllTags returns sorted tags', () => {
  const store = createTestStore();
  
  const card1 = createTestCard('Card 1', 'Body 1');
  card1.tags = ['zebra', 'apple', 'mango'];
  addCardToStore(store, card1);
  
  const allTags = getAllTags(store);
  
  assert.equal(allTags, ['apple', 'mango', 'zebra'], 'Should return sorted tags');
});

test.run();
