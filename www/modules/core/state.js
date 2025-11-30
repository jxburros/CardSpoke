/**
 * CardSpoke State Management
 * Version: 0.15.0
 * 
 * Core application state and metadata
 */

// --- APP METADATA & SIGNATURES ---
export const APP_CREATOR = 'jxburros';
export const APP_VERSION = '0.15.0';
export const APP_RELEASE_DATE = '2025-11-30';
export const APP_UPDATER = 'Claude Code (Sonnet 4.5)';
export const SCHEMA_VERSION = 4;

/**
 * Create a fresh store object with default values
 * @returns {Object} Default store structure
 */
export function createDefaultStore() {
  return {
    rootOrder: [],
    cards: {},
    mods: {},
    bookmarks: [],
    recentCards: [],
    viewMode: 'normal',
    activeTheme: 'light',
    richTextEnabled: false
  };
}

/**
 * Core application state
 */
export const state = {
  // Main data store
  store: createDefaultStore(),
  
  // Active instance key
  instanceKey: localStorage.getItem('activeInstance') || 'nested_cards_store',
  
  // Navigation state
  navState: {
    page: 'list',
    cardId: null,
    parentId: null,
    searchQuery: ''
  },
  
  // Navigation history for back button
  navHistory: [],
  
  // Search results state
  searchResultsState: {
    items: [],
    elements: [],
    selectedIndex: 0
  },
  
  // Undo/Redo system state
  undoStack: [],
  redoStack: [],
  trashBin: [],
  MAX_UNDO_STACK: 50,
  MAX_TRASH_SIZE: 100,
  
  // Drag and drop state
  draggedCardId: null,
  dragOverCardId: null,
  
  // Save state tracking
  saveTimeout: null,
  savePending: false,
  lastSaveTime: 0,
  SAVE_DEBOUNCE_MS: 500,
  MIN_SAVE_INTERVAL_MS: 100,
  
  // Preview observer
  previewObserver: null,
  
  // Dataset manager
  datasetManager: null,
  
  // Dirty flag
  dirty: false,
  
  // Safe mode flag
  safeMode: false
};

/**
 * Get the current store
 * @returns {Object} Current store
 */
export function getStore() {
  return state.store;
}

/**
 * Set the store
 * @param {Object} newStore - New store object
 */
export function setStore(newStore) {
  state.store = newStore;
}

/**
 * Get navigation state
 * @returns {Object} Navigation state
 */
export function getNavState() {
  return state.navState;
}

/**
 * Set navigation state
 * @param {Object} newState - New navigation state
 */
export function setNavState(newState) {
  state.navState = newState;
}

/**
 * Check if developer mode is enabled
 * @returns {boolean} True if developer mode is active
 */
export function isDeveloperMode() {
  return localStorage.getItem('cardspoke_devmode') === 'true';
}

/**
 * Check if rich text mode is enabled globally
 * @returns {boolean} True if rich text is enabled
 */
export function isRichTextEnabled() {
  return localStorage.getItem('cardspoke_richtext') === 'true';
}

/**
 * Set rich text mode
 * @param {boolean} enabled - Whether to enable rich text
 */
export function setRichTextEnabled(enabled) {
  localStorage.setItem('cardspoke_richtext', enabled ? 'true' : 'false');
}

/**
 * Get the active theme extension ID (if any)
 * @returns {string|null} Active theme extension ID or null
 */
export function getActiveThemeExtension() {
  return localStorage.getItem('cardspoke_activeThemeExtension') || null;
}

/**
 * Set the active theme extension
 * @param {string|null} extensionId - Extension ID or null for built-in themes
 */
export function setActiveThemeExtension(extensionId) {
  if (extensionId) {
    localStorage.setItem('cardspoke_activeThemeExtension', extensionId);
  } else {
    localStorage.removeItem('cardspoke_activeThemeExtension');
  }
}
