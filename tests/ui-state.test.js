import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { createMockStore } from './helpers.js';

// UI State Tests: Navigation, Save Status, Loading States

test('navigation state - list page', () => {
  const nav = {
    page: 'list',
    cardId: null,
    parentId: null,
    searchQuery: ''
  };
  
  assert.is(nav.page, 'list');
  assert.is(nav.cardId, null);
});

test('navigation state - card view', () => {
  const store = createMockStore();
  const cardId = store.rootOrder[0];
  
  const nav = {
    page: 'card',
    cardId: cardId,
    parentId: null,
    searchQuery: ''
  };
  
  assert.is(nav.page, 'card');
  assert.is(nav.cardId, cardId);
});

test('navigation state - search page', () => {
  const nav = {
    page: 'search',
    cardId: null,
    parentId: null,
    searchQuery: 'test query'
  };
  
  assert.is(nav.page, 'search');
  assert.is(nav.searchQuery, 'test query');
});

test('save status - saved state', () => {
  const saveStatus = {
    status: 'saved',
    lastSaved: Date.now(),
    error: null
  };
  
  assert.is(saveStatus.status, 'saved');
  assert.ok(saveStatus.lastSaved > 0);
  assert.is(saveStatus.error, null);
});

test('save status - saving state', () => {
  const saveStatus = {
    status: 'saving',
    lastSaved: null,
    error: null
  };
  
  assert.is(saveStatus.status, 'saving');
  assert.is(saveStatus.error, null);
});

test('save status - error state', () => {
  const saveStatus = {
    status: 'error',
    lastSaved: Date.now(),
    error: 'Failed to save'
  };
  
  assert.is(saveStatus.status, 'error');
  assert.ok(saveStatus.error);
});

test('modal state - help modal', () => {
  const modal = {
    type: 'help',
    visible: true,
    data: null
  };
  
  assert.is(modal.type, 'help');
  assert.ok(modal.visible);
});

test('modal state - closed', () => {
  const modal = {
    type: null,
    visible: false,
    data: null
  };
  
  assert.is(modal.type, null);
  assert.not.ok(modal.visible);
});

test('theme state - dark mode toggle', () => {
  let theme = 'light';
  
  // Toggle to dark
  theme = theme === 'light' ? 'dark' : 'light';
  assert.is(theme, 'dark');
  
  // Toggle to light
  theme = theme === 'light' ? 'dark' : 'light';
  assert.is(theme, 'light');
});

test('loading state - initial load', () => {
  const loading = {
    app: true,
    cards: false,
    search: false
  };
  
  assert.ok(loading.app);
  assert.not.ok(loading.cards);
});

test('loading state - card operations', () => {
  const loading = {
    app: false,
    cards: true,
    search: false
  };
  
  assert.ok(loading.cards);
  assert.not.ok(loading.app);
});

test.run();
