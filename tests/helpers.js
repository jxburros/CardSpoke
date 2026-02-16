/**
 * Test Helpers for CardSpoke
 * Provides utilities for testing the application logic
 */

// Mock localStorage for testing
class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  
  getItem(key) {
    return this.store[key] || null;
  }
  
  setItem(key, value) {
    this.store[key] = String(value);
  }
  
  removeItem(key) {
    delete this.store[key];
  }
  
  clear() {
    this.store = {};
  }
  
  key(index) {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }
  
  get length() {
    return Object.keys(this.store).length;
  }
}

// Core card functions extracted for testing
function uid() {
  return `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function createTestCard(title, body, parentId = null) {
  const id = uid();
  return {
    id,
    title: title || '',
    body: body || '',
    parentId: parentId || null,
    children: [],
    tags: [],
    meta: {},
    attributes: {},
    modsData: {}
  };
}

function createTestStore() {
  return {
    rootOrder: [],
    cards: {},
    plugins: {},
    bookmarks: [],
    recentCards: [],
    viewMode: 'normal'
  };
}

// Card operations for testing
function addCardToStore(store, card) {
  store.cards[card.id] = card;
  
  if (card.parentId) {
    const parent = store.cards[card.parentId];
    if (parent && !parent.children.includes(card.id)) {
      parent.children.push(card.id);
    }
  } else {
    if (!store.rootOrder.includes(card.id)) {
      store.rootOrder.push(card.id);
    }
  }
  
  return card;
}

function deleteCardFromStore(store, cardId) {
  const card = store.cards[cardId];
  if (!card) return false;
  
  // Delete all children recursively
  if (card.children && card.children.length > 0) {
    card.children.forEach(childId => {
      deleteCardFromStore(store, childId);
    });
  }
  
  // Remove from parent's children array
  if (card.parentId) {
    const parent = store.cards[card.parentId];
    if (parent) {
      parent.children = parent.children.filter(id => id !== cardId);
    }
  } else {
    // Remove from root order
    store.rootOrder = store.rootOrder.filter(id => id !== cardId);
  }
  
  // Remove from bookmarks
  store.bookmarks = store.bookmarks.filter(id => id !== cardId);
  
  // Remove from recent cards
  store.recentCards = store.recentCards.filter(id => id !== cardId);
  
  // Delete the card
  delete store.cards[cardId];
  
  return true;
}

function searchCards(store, query) {
  if (!query || query.trim() === '') {
    return [];
  }
  
  const q = query.toLowerCase();
  const results = [];
  
  Object.values(store.cards).forEach(card => {
    const titleMatch = card.title.toLowerCase().includes(q);
    const bodyMatch = card.body.toLowerCase().includes(q);
    const tagMatch = card.tags && card.tags.some(tag => tag.toLowerCase().includes(q));
    
    if (titleMatch || bodyMatch || tagMatch) {
      results.push(card);
    }
  });
  
  return results;
}

function toggleBookmark(store, cardId) {
  if (!store.cards[cardId]) {
    return false;
  }
  
  const index = store.bookmarks.indexOf(cardId);
  if (index > -1) {
    store.bookmarks.splice(index, 1);
    return false; // Removed
  } else {
    store.bookmarks.push(cardId);
    return true; // Added
  }
}

function isBookmarked(store, cardId) {
  return store.bookmarks.includes(cardId);
}

function addToRecentCards(store, cardId) {
  if (!store.cards[cardId]) {
    return;
  }
  
  // Remove if already exists
  store.recentCards = store.recentCards.filter(id => id !== cardId);
  
  // Add to beginning
  store.recentCards.unshift(cardId);
  
  // Keep only last 10
  if (store.recentCards.length > 10) {
    store.recentCards = store.recentCards.slice(0, 10);
  }
}

function cloneCard(card) {
  if (!card) return null;
  let modsData = {};
  if (card.modsData) {
    try {
      modsData = JSON.parse(JSON.stringify(card.modsData));
    } catch (err) {
      modsData = { ...card.modsData };
    }
  }
  return {
    ...card,
    children: Array.isArray(card.children) ? card.children.slice() : [],
    tags: Array.isArray(card.tags) ? card.tags.slice() : [],
    modsData
  };
}

export {
  MockLocalStorage,
  uid,
  createTestCard,
  createTestStore,
  addCardToStore,
  deleteCardFromStore,
  searchCards,
  toggleBookmark,
  isBookmarked,
  addToRecentCards,
  cloneCard
};

// Aliases for compatibility
export const createMockStore = createTestStore;
export const generateId = uid;
