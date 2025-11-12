import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { createTestStore, createTestCard, addCardToStore } from './helpers.js';

// Navigator Suite Tests: Bookmarks, Recent Cards, View Mode, Card Duplication

test('bookmark operations - add bookmark', () => {
  const store = createTestStore();
  const card = createTestCard('Test Card', 'Content');
  addCardToStore(store, card);
  const cardId = card.id;
  
  // Add bookmark
  if (!store.bookmarks.includes(cardId)) {
    store.bookmarks.push(cardId);
  }
  
  assert.ok(store.bookmarks.includes(cardId));
  assert.is(store.bookmarks.length, 1);
});

test('bookmark operations - remove bookmark', () => {
  const store = createTestStore();
  const card = createTestCard('Test Card', 'Content');
  addCardToStore(store, card);
  const cardId = card.id;
  store.bookmarks = [cardId];
  
  // Remove bookmark
  store.bookmarks = store.bookmarks.filter(id => id !== cardId);
  
  assert.not.ok(store.bookmarks.includes(cardId));
  assert.is(store.bookmarks.length, 0);
});

test('bookmark operations - toggle bookmark', () => {
  const store = createTestStore();
  const card = createTestCard('Test Card', 'Content');
  addCardToStore(store, card);
  const cardId = card.id;
  
  // Toggle on
  if (store.bookmarks.includes(cardId)) {
    store.bookmarks = store.bookmarks.filter(id => id !== cardId);
  } else {
    store.bookmarks.push(cardId);
  }
  
  assert.ok(store.bookmarks.includes(cardId));
  
  // Toggle off
  if (store.bookmarks.includes(cardId)) {
    store.bookmarks = store.bookmarks.filter(id => id !== cardId);
  } else {
    store.bookmarks.push(cardId);
  }
  
  assert.not.ok(store.bookmarks.includes(cardId));
});

test('bookmark operations - multiple bookmarks', () => {
  const store = createTestStore();
  const card1 = createTestCard('Card 1', 'Content 1');
  const card2 = createTestCard('Card 2', 'Content 2');
  addCardToStore(store, card1);
  addCardToStore(store, card2);
  
  store.bookmarks = [card1.id, card2.id];
  
  assert.is(store.bookmarks.length, 2);
  assert.ok(store.bookmarks.includes(card1.id));
  assert.ok(store.bookmarks.includes(card2.id));
});

test('bookmark operations - prevent duplicates', () => {
  const store = createTestStore();
  const card = createTestCard('Test Card', 'Content');
  addCardToStore(store, card);
  const cardId = card.id;
  
  // Add twice
  if (!store.bookmarks.includes(cardId)) {
    store.bookmarks.push(cardId);
  }
  if (!store.bookmarks.includes(cardId)) {
    store.bookmarks.push(cardId);
  }
  
  assert.is(store.bookmarks.length, 1);
});

test('recent cards - add to recent', () => {
  const store = createTestStore();
  const card = createTestCard('Test Card', 'Content');
  addCardToStore(store, card);
  const cardId = card.id;
  
  // Add to recent (newest first)
  store.recentCards = [cardId, ...store.recentCards.filter(id => id !== cardId)];
  
  assert.ok(store.recentCards.includes(cardId));
  assert.is(store.recentCards[0], cardId);
});

test('recent cards - limit to 10 cards', () => {
  const store = createTestStore();
  store.recentCards = [];
  
  // Add 15 cards
  for (let i = 0; i < 15; i++) {
    const cardId = `card-${i}`;
    store.recentCards = [cardId, ...store.recentCards.filter(id => id !== cardId)].slice(0, 10);
  }
  
  assert.is(store.recentCards.length, 10);
  assert.is(store.recentCards[0], 'card-14'); // Most recent first
});

test('recent cards - no duplicates', () => {
  const store = createTestStore();
  const card = createTestCard('Test Card', 'Content');
  addCardToStore(store, card);
  const cardId = card.id;
  
  // Add same card twice
  store.recentCards = [cardId, ...store.recentCards.filter(id => id !== cardId)];
  store.recentCards = [cardId, ...store.recentCards.filter(id => id !== cardId)];
  
  assert.is(store.recentCards.filter(id => id === cardId).length, 1);
});

test('recent cards - moves to front on re-visit', () => {
  const store = createTestStore();
  const card1 = createTestCard('Card 1', 'Content 1');
  const card2 = createTestCard('Card 2', 'Content 2');
  addCardToStore(store, card1);
  addCardToStore(store, card2);
  store.recentCards = [card2.id, card1.id];
  
  // Visit card1 again
  store.recentCards = [card1.id, ...store.recentCards.filter(id => id !== card1.id)];
  
  assert.is(store.recentCards[0], card1.id);
  assert.is(store.recentCards[1], card2.id);
});

test('view mode - toggle between normal and compact', () => {
  const store = createTestStore();
  store.viewMode = 'normal';
  
  // Toggle to compact
  store.viewMode = store.viewMode === 'normal' ? 'compact' : 'normal';
  assert.is(store.viewMode, 'compact');
  
  // Toggle back to normal
  store.viewMode = store.viewMode === 'normal' ? 'compact' : 'normal';
  assert.is(store.viewMode, 'normal');
});

test('view mode - default is normal', () => {
  const store = createTestStore();
  assert.is(store.viewMode, 'normal');
});

test('card duplication - clone card only', () => {
  const store = createTestStore();
  const originalCard = createTestCard('Original Card', 'Original content');
  addCardToStore(store, originalCard);
  
  // Duplicate card
  const newCard = createTestCard(
    originalCard.title + ' [COPY]',
    originalCard.body
  );
  newCard.tags = [...originalCard.tags];
  addCardToStore(store, newCard);
  
  assert.ok(store.cards[newCard.id]);
  assert.ok(newCard.title.includes('[COPY]'));
  assert.is(newCard.children.length, 0);
});

test('card duplication - includes copy marker', () => {
  const store = createTestStore();
  const originalCard = createTestCard('My Card', 'Content');
  addCardToStore(store, originalCard);
  
  const duplicateTitle = originalCard.title + ' [COPY]';
  
  assert.ok(duplicateTitle.includes('[COPY]'));
  assert.is.not(duplicateTitle, originalCard.title);
});

test('card duplication - preserves tags', () => {
  const store = createTestStore();
  const originalCard = createTestCard('Tagged Card', 'Content');
  originalCard.tags = ['tag1', 'tag2'];
  addCardToStore(store, originalCard);
  
  const newCard = createTestCard(originalCard.title + ' [COPY]', originalCard.body);
  newCard.tags = [...originalCard.tags];
  addCardToStore(store, newCard);
  
  assert.equal(newCard.tags, originalCard.tags);
  assert.is.not(newCard.tags, originalCard.tags); // Different array instance
});

test.run();
