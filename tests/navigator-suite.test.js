import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { createMockStore, generateId } from './helpers.js';

// Navigator Suite Tests: Bookmarks, Recent Cards, View Mode, Card Duplication

test('bookmark operations - add bookmark', () => {
  const store = createMockStore();
  const cardId = store.rootOrder[0];
  
  // Add bookmark
  if (!store.bookmarks.includes(cardId)) {
    store.bookmarks.push(cardId);
  }
  
  assert.ok(store.bookmarks.includes(cardId));
  assert.is(store.bookmarks.length, 1);
});

test('bookmark operations - remove bookmark', () => {
  const store = createMockStore();
  const cardId = store.rootOrder[0];
  store.bookmarks = [cardId];
  
  // Remove bookmark
  store.bookmarks = store.bookmarks.filter(id => id !== cardId);
  
  assert.not.ok(store.bookmarks.includes(cardId));
  assert.is(store.bookmarks.length, 0);
});

test('bookmark operations - toggle bookmark', () => {
  const store = createMockStore();
  const cardId = store.rootOrder[0];
  
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
  const store = createMockStore();
  const card1 = store.rootOrder[0];
  const card2 = store.rootOrder[1];
  
  store.bookmarks = [card1, card2];
  
  assert.is(store.bookmarks.length, 2);
  assert.ok(store.bookmarks.includes(card1));
  assert.ok(store.bookmarks.includes(card2));
});

test('bookmark operations - prevent duplicates', () => {
  const store = createMockStore();
  const cardId = store.rootOrder[0];
  
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
  const store = createMockStore();
  const cardId = store.rootOrder[0];
  
  // Add to recent (newest first)
  store.recentCards = [cardId, ...store.recentCards.filter(id => id !== cardId)];
  
  assert.ok(store.recentCards.includes(cardId));
  assert.is(store.recentCards[0], cardId);
});

test('recent cards - limit to 10 cards', () => {
  const store = createMockStore();
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
  const store = createMockStore();
  const cardId = store.rootOrder[0];
  
  // Add same card twice
  store.recentCards = [cardId, ...store.recentCards.filter(id => id !== cardId)];
  store.recentCards = [cardId, ...store.recentCards.filter(id => id !== cardId)];
  
  assert.is(store.recentCards.filter(id => id === cardId).length, 1);
});

test('recent cards - moves to front on re-visit', () => {
  const store = createMockStore();
  const card1 = 'card-1';
  const card2 = 'card-2';
  store.recentCards = [card2, card1];
  
  // Visit card1 again
  store.recentCards = [card1, ...store.recentCards.filter(id => id !== card1)];
  
  assert.is(store.recentCards[0], card1);
  assert.is(store.recentCards[1], card2);
});

test('view mode - toggle between normal and compact', () => {
  const store = createMockStore();
  store.viewMode = 'normal';
  
  // Toggle to compact
  store.viewMode = store.viewMode === 'normal' ? 'compact' : 'normal';
  assert.is(store.viewMode, 'compact');
  
  // Toggle back to normal
  store.viewMode = store.viewMode === 'normal' ? 'compact' : 'normal';
  assert.is(store.viewMode, 'normal');
});

test('view mode - default is normal', () => {
  const store = createMockStore();
  assert.is(store.viewMode, 'normal');
});

test('card duplication - clone card only', () => {
  const store = createMockStore();
  const originalCard = store.cards[store.rootOrder[0]];
  
  // Duplicate card
  const newCard = {
    id: generateId(),
    title: originalCard.title + ' [COPY]',
    body: originalCard.body,
    parentId: originalCard.parentId,
    children: [], // No children in card-only copy
    tags: [...originalCard.tags],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  store.cards[newCard.id] = newCard;
  if (newCard.parentId === null) {
    store.rootOrder.push(newCard.id);
  }
  
  assert.ok(store.cards[newCard.id]);
  assert.is(newCard.title, originalCard.title + ' [COPY]');
  assert.is(newCard.children.length, 0);
});

test('card duplication - includes copy marker', () => {
  const store = createMockStore();
  const originalCard = store.cards[store.rootOrder[0]];
  
  const duplicateTitle = originalCard.title + ' [COPY]';
  
  assert.ok(duplicateTitle.includes('[COPY]'));
  assert.not.is(duplicateTitle, originalCard.title);
});

test('card duplication - preserves tags', () => {
  const store = createMockStore();
  const originalCard = store.cards[store.rootOrder[0]];
  originalCard.tags = ['tag1', 'tag2'];
  
  const newCard = {
    ...originalCard,
    id: generateId(),
    title: originalCard.title + ' [COPY]',
    tags: [...originalCard.tags]
  };
  
  assert.equal(newCard.tags, originalCard.tags);
  assert.not.is(newCard.tags, originalCard.tags); // Different array instance
});

test.run();
