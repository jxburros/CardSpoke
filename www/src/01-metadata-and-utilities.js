// =============================================================
// CardSpoke JavaScript Application (Source)
// Version: 0.16.0
// Creator: jxburros
// Schema: v4
// Note: Sources are split across www/src/* and concatenated with
//       `npm run build` for the file://-friendly bundle in www/app.js.
// =============================================================

'use strict';

// =============================================================
// --- SELF-CONTAINED UTILITIES ---
// All utilities are defined locally to support opening directly
// from the filesystem (file:// protocol) without CORS issues.
// The ES module versions in ./modules/ are kept for reference.
// =============================================================

// --- APP METADATA & SIGNATURES ---
const APP_CREATOR = 'Jeffrey from GX Generations Software';
const APP_VERSION = '0.16.0';
const APP_RELEASE_DATE = '2025-11-30';
const APP_UPDATER = 'Claude Code (Sonnet 4.5)';
const SCHEMA_VERSION = 4;

/**
 * Helper function to create DOM elements
 */
function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  Object.entries(props).forEach(([k, v]) => {
    if (k === 'className') el.className = v;
    else if (k === 'onclick') el.onclick = v;
    else if (k === 'onsubmit') el.onsubmit = v;
    else if (k === 'style') el.style.cssText = v;
    else if (k === 'oninput') el.oninput = v;
    else if (k === 'onchange') el.onchange = v;
    else if (k === 'selected' || k === 'disabled' || k === 'checked' || k === 'readonly') {
      if (v) el.setAttribute(k, '');
    }
    else if (v !== false && v !== null && v !== undefined) el.setAttribute(k, v);
  });
  children.flat().forEach(ch => {
    if (typeof ch === 'string') el.appendChild(document.createTextNode(ch));
    else if (ch) el.appendChild(ch);
  });
  return el;
}

/**
 * Generate unique ID
 */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Debounce function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Normalize and split tag input
 */
function normalizeTagInput(raw) {
  if (!raw) return [];
  return raw
    .split(/[\s,]+/)
    .map(tag => tag.replace(/^#/, '').toLowerCase().trim())
    .filter(Boolean);
}

/**
 * Escape HTML special characters
 */
function escapeHtml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Highlight matched query terms within text
 */
function highlightText(text, query) {
  if (!query || !text) return document.createTextNode(text || '');
  const terms = query.split(/\s+/).filter(Boolean).map(t => t.toLowerCase());
  if (!terms.length) return document.createTextNode(text);
  let html = escapeHtml(text);
  terms.forEach(term => {
    const safeTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    html = html.replace(new RegExp(safeTerm, 'gi'), match => `<mark>${match}</mark>`);
  });
  const span = document.createElement('span');
  span.innerHTML = html;
  return span;
}

/**
 * Clone a card object deeply
 */
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

/**
 * Focus trapping for accessibility
 */
function trapFocus(modal) {
  const focusableElements = modal.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];
  
  const handleKeyDown = (e) => {
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
  };
  
  modal.addEventListener('keydown', handleKeyDown);
  
  if (firstFocusable) {
    firstFocusable.focus();
  }
  
  return () => {
    modal.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Format bytes into human readable string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Create a fresh store object with default values
 */
function createDefaultStore() {
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
 * Check if rich text mode is enabled globally
 */
function isRichTextEnabled() {
  return localStorage.getItem('cardspoke_richtext') === 'true';
}

/**
 * Set rich text mode
 */
function setRichTextEnabled(enabled) {
  localStorage.setItem('cardspoke_richtext', enabled ? 'true' : 'false');
}

/**
 * Get the active theme mod ID (if any)
 */
function getActiveThemeMod() {
  return localStorage.getItem('cardspoke_activeThemeMod') || localStorage.getItem('cardspoke_activeThemeExtension') || null;
}

/**
 * Set the active theme mod
 */
function setActiveThemeMod(modId) {
  if (modId) {
    localStorage.setItem('cardspoke_activeThemeMod', modId);
  } else {
    localStorage.removeItem('cardspoke_activeThemeMod');
  }
  // Clean up legacy key
  localStorage.removeItem('cardspoke_activeThemeExtension');
}

/**
 * Check if developer mode is enabled
 * @returns {boolean} True if developer mode is active
 */
function isDeveloperMode() {
  return localStorage.getItem('cardspoke_devmode') === 'true';
}

// --- TOAST NOTIFICATION SYSTEM ---
let toastContainer = null;

/**
 * Initialize toast container
 */
function initToast() {
  toastContainer = document.getElementById('toastContainer');
}

/**
 * Show a toast notification
 */
function showToast(message, type = 'success', duration = 3000) {
  if (!toastContainer) {
    toastContainer = document.getElementById('toastContainer');
  }
  if (!toastContainer) {
    console.warn('[Toast] Container not found');
    return;
  }

  const toast = h('div', { 
    className: `toast ${type}`,
    role: 'alert',
    'aria-live': type === 'error' ? 'assertive' : 'polite',
    'aria-atomic': 'true',
    tabindex: '0'
  }, message);
  toastContainer.appendChild(toast);
  
  let timeoutId = null;
  let isPaused = false;
  let remainingTime = duration;
  let startTime = Date.now();
  
  const scheduleRemoval = () => {
    startTime = Date.now();
    timeoutId = setTimeout(() => {
      if (!isPaused) {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
      }
    }, remainingTime);
  };
  
  const pauseTimer = () => {
    if (!isPaused && timeoutId) {
      clearTimeout(timeoutId);
      remainingTime -= (Date.now() - startTime);
      isPaused = true;
    }
  };
  
  const resumeTimer = () => {
    if (isPaused) {
      isPaused = false;
      scheduleRemoval();
    }
  };
  
  toast.addEventListener('mouseenter', pauseTimer);
  toast.addEventListener('mouseleave', resumeTimer);
  
  // Add click to dismiss
  toast.style.cursor = 'pointer';
  const dismissToast = () => {
    clearTimeout(timeoutId);
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  };
  
  toast.addEventListener('click', dismissToast);
  
  // Add keyboard support
  toast.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Enter') {
      e.preventDefault();
      dismissToast();
    }
  });
  
  scheduleRemoval();
}

// =============================================================
// --- AI DEVELOPER INSTRUCTIONS ---
//
// 1. UPDATE VERSION & METADATA:
//    Update APP_VERSION, APP_RELEASE_DATE, APP_UPDATER above.
//
// 2. MAINTAIN FUNCTIONALITY:
//    Do not remove or break existing features unless explicitly requested.
//    All changes should be additive or improvements.
//
// 3. FILE PROTOCOL COMPATIBILITY:
//    This file is self-contained to work with file:// URLs.
//    ES module versions in ./modules/ are kept for reference.
//
// =============================================================

// Version History
// Version 0.16.0: Split source into buildable chunks (see www/src/*, `npm run build`)
// Version 1.0.0: Major refactor - ES Modules for maintainability, Rich Text toggle, Theme mod handler
// Version 0.13.1: Accessibility & Theme Customization for Mods
// (see previous versions in git history)

// --- CORE APP STATE ---
let store = createDefaultStore();
let navState = {
  page: 'list',
  cardId: null,
  parentId: null,
  searchQuery: ''
};
let navHistory = [];
let instanceKey = localStorage.getItem('activeInstance') || 'nested_cards_store';
let dirty = false;
let searchResultsState = {
  items: [],
  elements: [],
  selectedIndex: 0
};
let renderCleanupCallbacks = [];

function registerRenderCleanup(fn) {
  if (typeof fn === 'function') renderCleanupCallbacks.push(fn);
}

function runRenderCleanup() {
  if (!renderCleanupCallbacks.length) return;
  renderCleanupCallbacks.forEach(fn => {
    try {
      fn();
    } catch (err) {
      console.error('[Render Cleanup] Failed:', err);
    }
  });
  renderCleanupCallbacks = [];
}

// --- UNDO/REDO SYSTEM STATE (v0.12.0) ---
const undoStack = [];
const redoStack = [];
const trashBin = [];
const MAX_UNDO_STACK = 50;
const MAX_TRASH_SIZE = 100;
let draggedCardId = null;
let dragOverCardId = null;

// Note: save, saveNow, load, clearAllData, showAppearanceSettings, applyTheme 
// are defined later in this file with local implementations

// --- DOM ELEMENTS ---
const header = {
        homeBtn: document.getElementById('homeBtn'),
        themeToggle: document.getElementById('themeToggle'),
        menuBtn: document.getElementById('menuBtn'),
        brandBtn: document.getElementById('brandBtn'),
        undoBtn: document.getElementById('undoBtn')
      };
      
      const menu = {
        overlay: document.getElementById('menuOverlay'),
        closeBtn: document.getElementById('menuClose'),
        newCard: document.getElementById('menuNewCard'),
        upload: document.getElementById('menuUpload'),
        modManager: document.getElementById('menuModManager'),
        appearance: document.getElementById('menuAppearance'),
        tagManager: document.getElementById('menuTagManager'),
        advancedSearch: document.getElementById('menuAdvancedSearch'),
        trashBin: document.getElementById('menuTrashBin'),
        bookmarks: document.getElementById('menuBookmarks'),
        typography: document.getElementById('menuTypography'),
        recentCards: document.getElementById('menuRecentCards'),
        dataHub: document.getElementById('menuDataHub'),
        clearAll: document.getElementById('menuClearAll'),
        gettingStarted: document.getElementById('menuGettingStarted'),
        help: document.getElementById('menuHelp'),
        keyboardShortcuts: document.getElementById('menuKeyboardShortcuts')
      };
      
      const searchContainer = document.getElementById('searchContainer');
      const searchInput = document.getElementById('searchInput');
      const searchClear = document.getElementById('searchClear');
      const datasetSelector = document.getElementById('datasetSelector');
      
      const breadcrumbs = document.getElementById('breadcrumbs');
      const main = document.getElementById('main');
      // Note: toastContainer is initialized via initToast() called during app boot
      let previewObserver = null;

      const uploadModal = {
        overlay: document.getElementById('uploadModal'),
        closeBtn: document.getElementById('closeUploadModal'),
        tabs: document.querySelectorAll('.modal-tab'),
        tabContents: document.querySelectorAll('.tab-content'),
        fileUploadAreaJSON: document.getElementById('fileUploadAreaJSON'),
        fileInputJSON: document.getElementById('fileInputJSON'),
        importLocationSelectJSON: document.getElementById('importLocationSelectJSON'),
        fileUploadAreaTXT: document.getElementById('fileUploadAreaTXT'),
        fileInputTXT: document.getElementById('fileInputTXT'),
        importLocationSelectTXT: document.getElementById('importLocationSelectTXT'),
        fileUploadAreaMods: document.getElementById('fileUploadAreaMods'),
        fileInputMods: document.getElementById('fileInputMods'),
        // Mod install fields
        manualModName: document.getElementById('manualModName'),
        manualModCreator: document.getElementById('manualModCreator'),
        manualModVersion: document.getElementById('manualModVersion'),
        manualModReleaseDate: document.getElementById('manualModReleaseDate'),
        manualModJS: document.getElementById('manualModJS'),
        manualModCSS: document.getElementById('manualModCSS'),
        installManualMod: document.getElementById('installManualMod')
      };

      // --- UTILITIES ---
      // Imported from modules: h, uid, debounce, normalizeTagInput, escapeHtml, 
      // highlightText, cloneCard, trapFocus, formatBytes, showToast
      // Locally defined: simpleMarkdown (~line 7379), isDeveloperMode (~line 359)

      function bootError(msg) {
        main.innerHTML = '';
        main.appendChild(h('div', { className: 'empty' }, 'Error: ' + msg));
      }


      // =============================================================
      // --- FUZZY SEARCH ---
      // Typo-tolerant search using Levenshtein distance
      // =============================================================

      /**
       * Calculate Levenshtein distance between two strings
       * @param {string} a - First string
       * @param {string} b - Second string
       * @returns {number} - Edit distance
       */
      function levenshteinDistance(a, b) {
        const matrix = [];
        
        for (let i = 0; i <= b.length; i++) {
          matrix[i] = [i];
        }
        
        for (let j = 0; j <= a.length; j++) {
          matrix[0][j] = j;
        }
        
        for (let i = 1; i <= b.length; i++) {
          for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
              matrix[i][j] = matrix[i - 1][j - 1];
            } else {
              matrix[i][j] = Math.min(
                matrix[i - 1][j - 1] + 1, // substitution
                matrix[i][j - 1] + 1,     // insertion
                matrix[i - 1][j] + 1      // deletion
              );
            }
          }
        }
        
        return matrix[b.length][a.length];
      }

      /**
       * Calculate fuzzy match score (0-100, higher is better)
       * @param {string} query - Search query
       * @param {string} text - Text to match against
       * @returns {number} - Match score
       */
      function fuzzyMatchScore(query, text) {
        const queryLower = query.toLowerCase();
        const textLower = text.toLowerCase();
        
        // Exact match gets highest score
        if (textLower.includes(queryLower)) {
          const position = textLower.indexOf(queryLower);
          // Bonus for matches at start of text
          return 100 - (position * 0.5);
        }
        
        // Calculate fuzzy score based on edit distance
        const distance = levenshteinDistance(queryLower, textLower.substring(0, query.length + 5));
        const maxLen = Math.max(queryLower.length, textLower.length);
        const similarity = 1 - (distance / maxLen);
        
        return Math.max(0, similarity * 70); // Fuzzy matches get up to 70 points
      }

      /**
       * Fuzzy search cards
       * @param {Object} store - Card store
       * @param {string} query - Search query
       * @returns {Array} - Sorted results with scores
       */
      function fuzzySearchCards(store, query) {
        if (!query || query.trim() === '') {
          return [];
        }
        
        const results = [];
        const queryLower = query.toLowerCase().trim();
        
        Object.values(store.cards).forEach(card => {
          const titleScore = fuzzyMatchScore(queryLower, card.title || '');
          const bodyScore = fuzzyMatchScore(queryLower, card.body || '') * 0.7; // Body matches worth less
          const tagScore = card.tags ? card.tags.some(tag => 
            fuzzyMatchScore(queryLower, tag) > 50
          ) ? 30 : 0 : 0;
          
          const totalScore = Math.max(titleScore, bodyScore) + tagScore;
          
          // Only include results with score > 30 (reasonable match threshold)
          if (totalScore > 30) {
            results.push({
              card,
              score: totalScore,
              titleMatch: titleScore > 50,
              bodyMatch: bodyScore > 35
            });
          }
        });
        
        // Sort by score (highest first)
        results.sort((a, b) => b.score - a.score);
        
        return results;
      }

      /**
       * Multi-dataset fuzzy search
       * Search across multiple datasets with optional scope
       * @param {string} query - Search query
       * @param {string} scope - Dataset scope: 'current', 'all', or specific dataset ID
       * @returns {Promise<Array>} - Sorted results with scores and dataset info
       */
      async function fuzzySearchMultiDataset(query, scope = 'current') {
        if (!query || query.trim() === '') {
          return [];
        }
        
        if (!datasetManager) {
          // Fallback to single dataset search if manager not initialized
          return fuzzySearchCards(store, query);
        }
        
        const allResults = [];
        
        if (scope === 'current') {
          // Search only current dataset
          const results = fuzzySearchCards(store, query);
          const currentDataset = datasetManager.getActiveDataset();
          results.forEach(result => {
            allResults.push({
              ...result,
              datasetId: currentDataset.id,
              datasetName: currentDataset.name
            });
          });
        } else if (scope === 'all') {
          // Search all datasets
          const datasets = datasetManager.listDatasets();
          const currentDatasetId = datasetManager.activeDatasetId;
          
          for (const dataset of datasets) {
            try {
              // Load dataset if not current
              let datasetStore;
              if (dataset.id === currentDatasetId) {
                datasetStore = store;
              } else {
                // Load dataset store from storage
                const driver = datasetManager.datasets.get(dataset.id).driver;
                const storeData = await driver.get('store');
                datasetStore = storeData || { cards: {} };
              }
              
              // Search this dataset
              const results = fuzzySearchCards(datasetStore, query);
              results.forEach(result => {
                allResults.push({
                  ...result,
                  datasetId: dataset.id,
                  datasetName: dataset.name
                });
              });
            } catch (err) {
              console.warn(`Failed to search dataset ${dataset.name}:`, err);
            }
          }
        } else {
          // Search specific dataset
          const dataset = datasetManager.datasets.get(scope);
          if (dataset) {
            try {
              let datasetStore;
              if (scope === datasetManager.activeDatasetId) {
                datasetStore = store;
              } else {
                const storeData = await dataset.driver.get('store');
                datasetStore = storeData || { cards: {} };
              }
              
              const results = fuzzySearchCards(datasetStore, query);
              results.forEach(result => {
                allResults.push({
                  ...result,
                  datasetId: dataset.id,
                  datasetName: dataset.name
                });
              });
            } catch (err) {
              console.warn(`Failed to search dataset ${dataset.name}:`, err);
            }
          }
        }
        
        // Sort combined results by score
        allResults.sort((a, b) => b.score - a.score);
        
        // Limit results to prevent performance issues
        const MAX_RESULTS = 100;
        return allResults.slice(0, MAX_RESULTS);
      }
