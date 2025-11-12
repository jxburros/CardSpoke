/**
 * Search and Navigation Tests
 * Tests for searching cards, bookmarks, and recent cards tracking
 */

const { test } = require('uvu');
const assert = require('uvu/assert');
const {
  createTestStore,
  createTestCard,
  addCardToStore,
  searchCards,
  toggleBookmark,
  isBookmarked,
  addToRecentCards
} = require('./helpers');

// Search Tests
test('searchCards finds cards by title', () => {
  const store = createTestStore();
  const card1 = createTestCard('JavaScript Basics', 'Learn JS');
  const card2 = createTestCard('Python Tutorial', 'Learn Python');
  const card3 = createTestCard('JavaScript Advanced', 'Advanced JS topics');
  
  addCardToStore(store, card1);
  addCardToStore(store, card2);
  addCardToStore(store, card3);
  
  const results = searchCards(store, 'JavaScript');
  
  assert.is(results.length, 2, 'Should find 2 cards with JavaScript in title');
  assert.ok(results.some(c => c.id === card1.id), 'Should include card1');
  assert.ok(results.some(c => c.id === card3.id), 'Should include card3');
});

test('searchCards finds cards by body', () => {
  const store = createTestStore();
  const card1 = createTestCard('Tutorial 1', 'This explains TypeScript basics');
  const card2 = createTestCard('Tutorial 2', 'This explains Python basics');
  
  addCardToStore(store, card1);
  addCardToStore(store, card2);
  
  const results = searchCards(store, 'TypeScript');
  
  assert.is(results.length, 1, 'Should find 1 card with TypeScript in body');
  assert.is(results[0].id, card1.id, 'Should find card1');
});

test('searchCards is case-insensitive', () => {
  const store = createTestStore();
  const card = createTestCard('React HOOKS Tutorial', 'Learn about HOOKS');
  
  addCardToStore(store, card);
  
  const results1 = searchCards(store, 'hooks');
  const results2 = searchCards(store, 'HOOKS');
  const results3 = searchCards(store, 'Hooks');
  
  assert.is(results1.length, 1, 'Should find with lowercase');
  assert.is(results2.length, 1, 'Should find with uppercase');
  assert.is(results3.length, 1, 'Should find with mixed case');
});

test('searchCards returns empty array for no matches', () => {
  const store = createTestStore();
  const card = createTestCard('JavaScript', 'JS content');
  
  addCardToStore(store, card);
  
  const results = searchCards(store, 'Python');
  
  assert.is(results.length, 0, 'Should return empty array when no matches');
});

test('searchCards returns empty array for empty query', () => {
  const store = createTestStore();
  const card = createTestCard('Test', 'Content');
  
  addCardToStore(store, card);
  
  const results1 = searchCards(store, '');
  const results2 = searchCards(store, '   ');
  
  assert.is(results1.length, 0, 'Should return empty array for empty string');
  assert.is(results2.length, 0, 'Should return empty array for whitespace');
});

test('searchCards finds cards by tags', () => {
  const store = createTestStore();
  const card1 = createTestCard('Card 1', 'Content 1');
  const card2 = createTestCard('Card 2', 'Content 2');
  
  card1.tags = ['javascript', 'tutorial'];
  card2.tags = ['python', 'guide'];
  
  addCardToStore(store, card1);
  addCardToStore(store, card2);
  
  const results = searchCards(store, 'javascript');
  
  assert.is(results.length, 1, 'Should find card by tag');
  assert.is(results[0].id, card1.id, 'Should find card1');
});

// Bookmark Tests
test('toggleBookmark adds bookmark for unbookmarked card', () => {
  const store = createTestStore();
  const card = createTestCard('Test Card', 'Content');
  
  addCardToStore(store, card);
  const result = toggleBookmark(store, card.id);
  
  assert.is(result, true, 'Should return true when adding bookmark');
  assert.ok(store.bookmarks.includes(card.id), 'Card should be in bookmarks');
});

test('toggleBookmark removes bookmark for bookmarked card', () => {
  const store = createTestStore();
  const card = createTestCard('Test Card', 'Content');
  
  addCardToStore(store, card);
  store.bookmarks.push(card.id);
  
  const result = toggleBookmark(store, card.id);
  
  assert.is(result, false, 'Should return false when removing bookmark');
  assert.not.ok(store.bookmarks.includes(card.id), 'Card should not be in bookmarks');
});

test('toggleBookmark returns false for non-existent card', () => {
  const store = createTestStore();
  const result = toggleBookmark(store, 'non_existent_id');
  
  assert.is(result, false, 'Should return false for non-existent card');
});

test('isBookmarked returns true for bookmarked card', () => {
  const store = createTestStore();
  const card = createTestCard('Test Card', 'Content');
  
  addCardToStore(store, card);
  store.bookmarks.push(card.id);
  
  assert.is(isBookmarked(store, card.id), true, 'Should return true for bookmarked card');
});

test('isBookmarked returns false for non-bookmarked card', () => {
  const store = createTestStore();
  const card = createTestCard('Test Card', 'Content');
  
  addCardToStore(store, card);
  
  assert.is(isBookmarked(store, card.id), false, 'Should return false for non-bookmarked card');
});

// Recent Cards Tests
test('addToRecentCards adds card to beginning', () => {
  const store = createTestStore();
  const card = createTestCard('Test Card', 'Content');
  
  addCardToStore(store, card);
  addToRecentCards(store, card.id);
  
  assert.is(store.recentCards.length, 1, 'Should have 1 recent card');
  assert.is(store.recentCards[0], card.id, 'Card should be first in recent cards');
});

test('addToRecentCards moves existing card to front', () => {
  const store = createTestStore();
  const card1 = createTestCard('Card 1', 'Content 1');
  const card2 = createTestCard('Card 2', 'Content 2');
  const card3 = createTestCard('Card 3', 'Content 3');
  
  addCardToStore(store, card1);
  addCardToStore(store, card2);
  addCardToStore(store, card3);
  
  addToRecentCards(store, card1.id);
  addToRecentCards(store, card2.id);
  addToRecentCards(store, card3.id);
  addToRecentCards(store, card1.id); // Add card1 again
  
  assert.is(store.recentCards.length, 3, 'Should have 3 recent cards');
  assert.is(store.recentCards[0], card1.id, 'Card1 should be first');
  assert.is(store.recentCards[1], card3.id, 'Card3 should be second');
  assert.is(store.recentCards[2], card2.id, 'Card2 should be third');
});

test('addToRecentCards limits to 10 cards', () => {
  const store = createTestStore();
  const cards = [];
  
  // Create and add 15 cards
  for (let i = 0; i < 15; i++) {
    const card = createTestCard(`Card ${i}`, `Content ${i}`);
    addCardToStore(store, card);
    cards.push(card);
    addToRecentCards(store, card.id);
  }
  
  assert.is(store.recentCards.length, 10, 'Should limit to 10 recent cards');
  assert.is(store.recentCards[0], cards[14].id, 'Most recent should be last added');
  assert.is(store.recentCards[9], cards[5].id, 'Oldest should be 10th from last');
});

test('addToRecentCards ignores non-existent card', () => {
  const store = createTestStore();
  
  addToRecentCards(store, 'non_existent_id');
  
  assert.is(store.recentCards.length, 0, 'Should not add non-existent card');
});

test.run();
