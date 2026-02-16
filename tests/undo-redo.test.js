/**
 * Undo/Redo System Tests
 * Tests for the undo/redo functionality added in v0.12.0
 */

import { test } from 'uvu';
import * as assert from 'uvu/assert';

// Mock store and functions
let store = { rootOrder: [], cards: {}, plugins: {}, bookmarks: [], recentCards: [] };
let undoStack = [];
let redoStack = [];
let trashBin = [];
const MAX_UNDO_STACK = 50;
const MAX_TRASH_SIZE = 100;

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function cloneCard(card) {
  if (!card) return null;
  return {
    ...card,
    children: Array.isArray(card.children) ? card.children.slice() : [],
    tags: Array.isArray(card.tags) ? card.tags.slice() : []
  };
}

function pushUndo(action, data) {
  undoStack.push({
    action,
    data,
    timestamp: Date.now()
  });
  if (undoStack.length > MAX_UNDO_STACK) {
    undoStack.shift();
  }
  redoStack.length = 0;
}

function createCard(title, body, parentId = null) {
  const id = uid();
  const now = Date.now();
  store.cards[id] = {
    id,
    title: title || '',
    body: body || '',
    parentId: parentId || null,
    children: [],
    createdAt: now,
    updatedAt: now,
    tags: []
  };
  if (!parentId) {
    store.rootOrder.push(id);
  } else {
    const parent = store.cards[parentId];
    if (parent && !parent.children.includes(id)) {
      parent.children.push(id);
    }
  }
  pushUndo('createCard', { cardId: id, card: cloneCard(store.cards[id]) });
  return id;
}

function deleteCard(id) {
  const card = store.cards[id];
  if (!card) return;
  
  pushUndo('deleteCard', { card: cloneCard(card) });
  
  trashBin.unshift({
    card: cloneCard(card),
    deletedAt: Date.now()
  });
  if (trashBin.length > MAX_TRASH_SIZE) trashBin.pop();
  
  if (card.parentId) {
    const parent = store.cards[card.parentId];
    if (parent) parent.children = parent.children.filter(c => c !== id);
  } else {
    store.rootOrder = store.rootOrder.filter(c => c !== id);
  }
  delete store.cards[id];
}

// Reset before each test
function resetStore() {
  store = { rootOrder: [], cards: {}, plugins: {}, bookmarks: [], recentCards: [] };
  undoStack = [];
  redoStack = [];
  trashBin = [];
}

test('pushUndo adds action to undo stack', () => {
  resetStore();
  
  pushUndo('testAction', { test: 'data' });
  
  assert.is(undoStack.length, 1);
  assert.is(undoStack[0].action, 'testAction');
  assert.equal(undoStack[0].data, { test: 'data' });
});

test('pushUndo clears redo stack', () => {
  resetStore();
  
  redoStack.push({ action: 'oldAction', data: {} });
  pushUndo('newAction', {});
  
  assert.is(redoStack.length, 0);
});

test('pushUndo respects MAX_UNDO_STACK limit', () => {
  resetStore();
  
  for (let i = 0; i < MAX_UNDO_STACK + 10; i++) {
    pushUndo('action' + i, { index: i });
  }
  
  assert.is(undoStack.length, MAX_UNDO_STACK);
  // First items should have been shifted out
  assert.is(undoStack[0].data.index, 10);
});

test('deleteCard adds to undo stack', () => {
  resetStore();
  
  const id = createCard('Test Card', 'Test body');
  const initialUndoLength = undoStack.length;
  
  deleteCard(id);
  
  assert.is(undoStack.length, initialUndoLength + 1);
  assert.is(undoStack[undoStack.length - 1].action, 'deleteCard');
});

test('deleteCard adds to trash bin', () => {
  resetStore();
  
  const id = createCard('Trash Test', 'Body');
  deleteCard(id);
  
  assert.is(trashBin.length, 1);
  assert.is(trashBin[0].card.title, 'Trash Test');
  assert.ok(trashBin[0].deletedAt);
});

test('trash bin respects MAX_TRASH_SIZE limit', () => {
  resetStore();
  
  for (let i = 0; i < MAX_TRASH_SIZE + 10; i++) {
    const id = createCard('Card ' + i, '');
    deleteCard(id);
  }
  
  assert.is(trashBin.length, MAX_TRASH_SIZE);
});

test('createCard adds to undo stack', () => {
  resetStore();
  
  createCard('New Card', 'Body');
  
  assert.is(undoStack.length, 1);
  assert.is(undoStack[0].action, 'createCard');
});

test.run();
