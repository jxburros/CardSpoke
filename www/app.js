    (function() {
      'use strict';
      
      // =============================================================
      // CardSpoke JavaScript Application
      // Version: 0.13.1
      // Creator: jxburros
      // Schema: v4
      // =============================================================
      
      // =============================================================
      // --- AI DEVELOPER INSTRUCTIONS ---
      //
      // 1. UPDATE VERSION & METADATA:
      //    Before saving, you MUST update the constants below.
      //    - APP_VERSION: If user does not specify, append ".1" (e.g., "0.7.4" -> "0.7.4.1").
      //    - APP_RELEASE_DATE: Set to today's date (YYYY-MM-DD).
      //    - APP_UPDATER: Add your AI name.
      //
      // 2. MAINTAIN FUNCTIONALITY:
      //    Do not remove or break existing features unless explicitly requested.
      //    All changes should be additive or improvements.
      //
      // =============================================================
      
      // --- APP METADATA & SIGNATURES ---
      const APP_CREATOR = 'jxburros';
      const APP_VERSION = '0.13.1.1'; // <-- AI: UPDATE THIS when making changes
      const APP_RELEASE_DATE = '2025-12-01'; // <-- AI: UPDATE THIS
      const APP_UPDATER = 'GPT-5.1-Codex-Max'; // <-- AI: UPDATE THIS
      // Version 0.8.2: Responsive layout, fully migrated to Capacitor, Navigator Suite integrated
      // Version 0.9.1: Added user-facing error notifications for mod execution failures
      // Version 0.9.2: Added comprehensive keyboard shortcuts system (Ctrl+/ for help)
      // Version 0.9.3: Previous updates
      // Version 0.9.4: Added StorageDriver architecture, Dataset Info Panel, storage analytics
      // Version 0.10.5: Implemented Tags API (getTags, addTag, removeTag, setTags, getAllTags) with comprehensive tests
      // Version 0.10.6: Multi-Dataset Search - search across multiple datasets simultaneously
      // Version 0.11.0: Mega Showrunner - Backlinks, Related Cards, Enhanced Exports, and many more features
      // Version 0.11.1: Exposed CardSpoke.utils API for mod developers with comprehensive utility functions
      // Version 0.11.2: Added Extension Wizard and Playground for mod developers
      // Version 0.11.2.5: Enhanced footer population with error handling and debugging
      // Version 0.11.3: Brand alignment and v0.11.X TODO items
      // Version 0.11.4: Bug fixes - storage type display, parent selection, playground cards, dataset naming, export feedback, UI issues
      // Version 0.12.0: Complete TODO list - Undo/Redo, Tag Management, Advanced Search, Markdown Preview, Extensions Store, Bulk Import/Export, Drag-and-Drop
      // Version 0.12.1: Documentation update, CONTRIBUTING.md, CODE_OF_CONDUCT.md, README sync for 1.0 release prep
      // Version 0.12.2: Pre-1.0 TODO items - Extension Wizard ai_assistants field, official/community badges, nested menu UX
      // Version 0.12.3: TODO list - Clickable brand logo, accessibility improvements, CardSpoke naming, scalable fonts
      // Version 0.13.0: Documentation & Open Source Prep - Updated all documentation to reflect current state, version sync across all files
      // Version 0.13.1: Accessibility & Theme Customization for Extensions - Exposed CSS variables and API for theme customization of accessibility features
      
      // --- CORE APP STATE ---
      const SCHEMA_VERSION = 4; // Schema version (updated for v0.7+)
      let instanceKey = localStorage.getItem('activeInstance') || 'nested_cards_store';
      let store = { rootOrder: [], cards: {}, mods: {}, bookmarks: [], recentCards: [], viewMode: 'normal', activeTheme: 'light' }; // Main data store
      let navState = { page: 'list', cardId: null, parentId: null, searchQuery: '' }; // Navigation state
      let navHistory = []; // Navigation history for back button
      let dirty = false; // Tracks unsaved changes

      // --- UNDO/REDO SYSTEM STATE (v0.12.0) ---
      const undoStack = [];
      const redoStack = [];
      const trashBin = [];
      const MAX_UNDO_STACK = 50;
      const MAX_TRASH_SIZE = 100;
      let draggedCardId = null;
      let dragOverCardId = null;

      // --- DOM ELEMENTS ---
      const header = {
        homeBtn: document.getElementById('homeBtn'),
        themeToggle: document.getElementById('themeToggle'),
        menuBtn: document.getElementById('menuBtn'),
        brandBtn: document.getElementById('brandBtn')
      };
      
      const menu = {
        overlay: document.getElementById('menuOverlay'),
        closeBtn: document.getElementById('menuClose'),
        newCard: document.getElementById('menuNewCard'),
        upload: document.getElementById('menuUpload'),
        extensionsHub: document.getElementById('menuExtensionsHub'),
        appearance: document.getElementById('menuAppearance'),
        tagManager: document.getElementById('menuTagManager'),
        advancedSearch: document.getElementById('menuAdvancedSearch'),
        trashBin: document.getElementById('menuTrashBin'),
        bookmarks: document.getElementById('menuBookmarks'),
        typography: document.getElementById('menuTypography'),
        recentCards: document.getElementById('menuRecentCards'),
        dataHub: document.getElementById('menuDataHub'),
        clearAll: document.getElementById('menuClearAll'),
        help: document.getElementById('menuHelp'),
        keyboardShortcuts: document.getElementById('menuKeyboardShortcuts')
      };
      
      const searchContainer = document.getElementById('searchContainer');
      const searchInput = document.getElementById('searchInput');
      const searchClear = document.getElementById('searchClear');
      const datasetSelector = document.getElementById('datasetSelector');
      
      const breadcrumbs = document.getElementById('breadcrumbs');
      const main = document.getElementById('main');
      const toastContainer = document.getElementById('toastContainer');

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
        fileUploadAreaDOCX: document.getElementById('fileUploadAreaDOCX'),
        fileInputDOCX: document.getElementById('fileInputDOCX'),
        importLocationSelectDOCX: document.getElementById('importLocationSelectDOCX'),
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
      
      /**
       * Helper function to create DOM elements
       * @param {string} tag - HTML tag name
       * @param {Object} props - Element properties and attributes
       * @param {...(string|HTMLElement)} children - Child elements or text
       * @returns {HTMLElement} Created DOM element
       */
      function h(tag, props = {}, ...children) {
        const el = document.createElement(tag);
        Object.entries(props).forEach(([k, v]) => {
          if (k === 'className') el.className = v;
          else if (k === 'onclick') el.onclick = v;
          else if (k === 'onsubmit') el.onsubmit = v;
          else if (k === 'style') el.style.cssText = v;
          else if (k === 'oninput') el.oninput = v;
          else if (k === 'selected' || k === 'disabled' || k === 'checked' || k === 'readonly') {
            // Boolean attributes: only set if truthy
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
       * Generate unique ID based on timestamp and random string
       * @returns {string} Unique identifier
       */
      function uid() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
      }

      /**
       * Debounce function - delays execution until after wait time has elapsed
       * @param {Function} func - Function to debounce
       * @param {number} wait - Wait time in milliseconds
       * @returns {Function} Debounced function
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
       * Show toast notification
       * @param {string} message - Message to display
       * @param {'success'|'error'|'info'} type - Type of notification
       */
      /**
       * Show a toast notification with auto-dismiss and pause on hover
       * @param {string} message - Message to display
       * @param {string} type - Toast type: 'success', 'error', 'warning', 'info'
       * @param {number} duration - Duration in milliseconds (default: 3000)
       */
      function showToast(message, type = 'success', duration = 3000) {
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
        
        // Add keyboard support (Escape or Enter to dismiss)
        toast.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' || e.key === 'Enter') {
            e.preventDefault();
            dismissToast();
          }
        });
        
        scheduleRemoval();
      }

      /**
       * Focus trapping for accessibility (v0.12.3)
       * Traps focus within a modal element
       * @param {HTMLElement} modal - Modal element to trap focus in
       * @returns {Function} Cleanup function to remove trap
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
            // Shift + Tab
            if (document.activeElement === firstFocusable) {
              e.preventDefault();
              lastFocusable.focus();
            }
          } else {
            // Tab
            if (document.activeElement === lastFocusable) {
              e.preventDefault();
              firstFocusable.focus();
            }
          }
        };
        
        modal.addEventListener('keydown', handleKeyDown);
        
        // Focus first element
        if (firstFocusable) {
          firstFocusable.focus();
        }
        
        // Return cleanup function
        return () => {
          modal.removeEventListener('keydown', handleKeyDown);
        };
      }


      /**
       * Check if developer mode is enabled
       * @returns {boolean} True if developer mode is active
       */
      function isDeveloperMode() {
        return localStorage.getItem('cardspoke_devmode') === 'true';
      }


      function bootError(msg) {
        main.innerHTML = '';
        main.appendChild(h('div', { className: 'empty' }, 'Error: ' + msg));
      }

      /**
       * Clone a card object deeply to avoid reference issues
       * @param {Object} card - Card object to clone
       * @returns {Object|null} Cloned card object or null
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
          modsData
        };
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

      // =============================================================
      // --- STORAGE DRIVER ARCHITECTURE (v0.9.4) ---
      // =============================================================
      
      /**
       * StorageDriver Interface
       * Provides abstraction for different storage backends
       */
      class StorageDriver {
        constructor() {
          if (new.target === StorageDriver) {
            throw new Error('StorageDriver is an abstract class');
          }
        }
      
        async init(config) {
          throw new Error('init() must be implemented');
        }
      
        async get(key) {
          throw new Error('get() must be implemented');
        }
      
        async set(key, value) {
          throw new Error('set() must be implemented');
        }
      
        async remove(key) {
          throw new Error('remove() must be implemented');
        }
      
        async list(prefix) {
          throw new Error('list() must be implemented');
        }
      
        async getSize() {
          throw new Error('getSize() must be implemented');
        }
      
        getKind() {
          throw new Error('getKind() must be implemented');
        }
      }
      
      /**
       * IndexedDB Storage Driver
       */
      class IndexedDBDriver extends StorageDriver {
        constructor() {
          super();
          this.dbName = 'CardSpokeDB';
          this.storeName = 'datasets';
          this.db = null;
        }
      
        async init(config = {}) {
          this.dbName = config.dbName || 'CardSpokeDB';
          this.storeName = config.storeName || 'datasets';
      
          return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);
      
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
              this.db = request.result;
              resolve();
            };
      
            request.onupgradeneeded = (event) => {
              const db = event.target.result;
              if (!db.objectStoreNames.contains(this.storeName)) {
                db.createObjectStore(this.storeName);
              }
            };
          });
        }
      
        async get(key) {
          return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(key);
      
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
          });
        }
      
        async set(key, value) {
          return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.put(value, key);
      
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
          });
        }
      
        async remove(key) {
          return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(key);
      
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
          });
        }
      
        async list(prefix = '') {
          return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAllKeys();
      
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
              const keys = request.result;
              const filtered = prefix ? keys.filter(k => k.startsWith(prefix)) : keys;
              resolve(filtered);
            };
          });
        }
      
        async getSize() {
          const keys = await this.list();
          let totalSize = 0;
      
          for (const key of keys) {
            const value = await this.get(key);
            if (value) {
              totalSize += JSON.stringify(value).length;
            }
          }
      
          return totalSize;
        }
      
        getKind() {
          return 'indexeddb';
        }
      }
      
      /**
       * LocalStorage Driver (fallback/compatibility)
       */
      class LocalStorageDriver extends StorageDriver {
        constructor() {
          super();
          this.prefix = 'cardspoke_';
        }
      
        async init(config = {}) {
          this.prefix = config.prefix || 'cardspoke_';
          return Promise.resolve();
        }
      
        async get(key) {
          const fullKey = this.prefix + key;
          const value = localStorage.getItem(fullKey);
          return value ? JSON.parse(value) : null;
        }
      
        async set(key, value) {
          const fullKey = this.prefix + key;
          localStorage.setItem(fullKey, JSON.stringify(value));
          return Promise.resolve();
        }
      
        async remove(key) {
          const fullKey = this.prefix + key;
          localStorage.removeItem(fullKey);
          return Promise.resolve();
        }
      
        async list(prefix = '') {
          const keys = [];
          const searchPrefix = this.prefix + prefix;
      
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(searchPrefix)) {
              keys.push(key.substring(this.prefix.length));
            }
          }
      
          return keys;
        }
      
        async getSize() {
          const keys = await this.list();
          let totalSize = 0;
      
          for (const key of keys) {
            const fullKey = this.prefix + key;
            const value = localStorage.getItem(fullKey);
            if (value) {
              totalSize += value.length;
            }
          }
      
          return totalSize;
        }
      
        getKind() {
          return 'localstorage';
        }
      }
      
      /**
       * Dataset Manager
       * Manages multiple datasets with different storage drivers
       */
      class DatasetManager {
        constructor() {
          this.datasets = new Map();
          this.activeDatasetId = null;
          this.metadataKey = 'cardspoke_dataset_metadata';
        }
      
        async init() {
          // Load dataset metadata from localStorage
          const metadataJson = localStorage.getItem(this.metadataKey);
          if (metadataJson) {
            const metadata = JSON.parse(metadataJson);
            this.activeDatasetId = metadata.activeDatasetId;
      
            // Initialize datasets
            for (const [id, meta] of Object.entries(metadata.datasets || {})) {
              const driver = await this.createDriver(meta.storage.driver, meta.storage.config);
              this.datasets.set(id, {
                id,
                name: meta.name,
                driver,
                pin: meta.pin || null,
                createdAt: meta.createdAt,
                updatedAt: meta.updatedAt
              });
            }
          }
      
          // Create default dataset if none exist
          if (this.datasets.size === 0) {
            await this.createDataset('Default', 'localstorage');
          }
        }
      
        async createDriver(kind, config = {}) {
          let driver;
      
          if (kind === 'indexeddb') {
            driver = new IndexedDBDriver();
          } else {
            driver = new LocalStorageDriver();
          }
      
          await driver.init(config);
          return driver;
        }
      
        async createDataset(name, storageKind = 'localstorage', pin = null) {
          const id = 'dataset_' + Date.now();
          const driver = await this.createDriver(storageKind, {
            dbName: `CardSpokeDB_${id}`,
            prefix: `cardspoke_${id}_`
          });
      
          const dataset = {
            id,
            name,
            driver,
            pin,
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
      
          this.datasets.set(id, dataset);
      
          if (!this.activeDatasetId) {
            this.activeDatasetId = id;
          }
      
          await this.saveMetadata();
          return dataset;
        }
      
        async saveMetadata() {
          const metadata = {
            activeDatasetId: this.activeDatasetId,
            datasets: {}
          };
      
          for (const [id, dataset] of this.datasets) {
            metadata.datasets[id] = {
              name: dataset.name,
              storage: {
                driver: dataset.driver.getKind(),
                config: {}
              },
              pin: dataset.pin,
              createdAt: dataset.createdAt,
              updatedAt: dataset.updatedAt
            };
          }
      
          localStorage.setItem(this.metadataKey, JSON.stringify(metadata));
        }
      
        getActiveDataset() {
          return this.datasets.get(this.activeDatasetId);
        }
      
        async switchDataset(datasetId, pin = null) {
          const dataset = this.datasets.get(datasetId);
          if (!dataset) {
            throw new Error('Dataset not found');
          }
      
          // Check PIN if required
          if (dataset.pin && dataset.pin !== pin) {
            throw new Error('Invalid PIN');
          }
      
          this.activeDatasetId = datasetId;
          await this.saveMetadata();
          return dataset;
        }
      
        async deleteDataset(datasetId) {
          if (this.datasets.size <= 1) {
            throw new Error('Cannot delete the last dataset');
          }
      
          const dataset = this.datasets.get(datasetId);
          if (!dataset) {
            throw new Error('Dataset not found');
          }
      
          // Remove all data from storage
          const keys = await dataset.driver.list();
          for (const key of keys) {
            await dataset.driver.remove(key);
          }
      
          this.datasets.delete(datasetId);
      
          // Switch to another dataset if this was active
          if (this.activeDatasetId === datasetId) {
            this.activeDatasetId = this.datasets.keys().next().value;
          }
      
          await this.saveMetadata();
        }
      
        async getDatasetInfo(datasetId) {
          const dataset = this.datasets.get(datasetId || this.activeDatasetId);
          if (!dataset) {
            throw new Error('Dataset not found');
          }
      
          const size = await dataset.driver.getSize();
          const keys = await dataset.driver.list();
      
          return {
            id: dataset.id,
            name: dataset.name,
            storageKind: dataset.driver.getKind(),
            hasPIN: !!dataset.pin,
            size: size,
            sizeFormatted: this.formatBytes(size),
            itemCount: keys.length,
            createdAt: new Date(dataset.createdAt).toLocaleString(),
            updatedAt: new Date(dataset.updatedAt).toLocaleString()
          };
        }
      
        formatBytes(bytes) {
          if (bytes === 0) return '0 Bytes';
          const k = 1024;
          const sizes = ['Bytes', 'KB', 'MB', 'GB'];
          const i = Math.floor(Math.log(bytes) / Math.log(k));
          return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
        }
      
        listDatasets() {
          return Array.from(this.datasets.values()).map(d => ({
            id: d.id,
            name: d.name,
            storageKind: d.driver.getKind(),
            hasPIN: !!d.pin,
            isActive: d.id === this.activeDatasetId
          }));
        }
      }
      
      // Global dataset manager instance
      let datasetManager = null;
      

      // --- LOCAL STORAGE ---

      // Save state tracking
      let saveTimeout = null;
      let savePending = false;
      let lastSaveTime = 0;
      const SAVE_DEBOUNCE_MS = 500; // Wait 500ms after last change before saving
      const MIN_SAVE_INTERVAL_MS = 100; // Minimum time between actual saves

      function saveNow() {
        try {
          const key = instanceKey || 'nested_cards_store';
          const startTime = performance.now();

          // Use requestIdleCallback if available to avoid blocking UI
          const doSave = () => {
            try {
              localStorage.setItem(key, JSON.stringify(store));
              const duration = performance.now() - startTime;
              lastSaveTime = Date.now();
              savePending = false;

              // Show success indicator briefly
              updateSaveStatus('saved');
              setTimeout(() => updateSaveStatus('idle'), 1000);

              console.log(`Saved in ${duration.toFixed(2)}ms`);
            } catch (e) {
              savePending = false;
              if (e.name === 'QuotaExceededError') {
                showToast('Storage quota exceeded! Please clear old data or export your cards.', 'error');
              } else {
                showToast('Failed to save: ' + e.message, 'error');
              }
              updateSaveStatus('error');
            }
          };

          if (window.requestIdleCallback) {
            requestIdleCallback(doSave, { timeout: 2000 });
          } else {
            doSave();
          }
        } catch (e) {
          showToast('Failed to save: ' + e.message, 'error');
          savePending = false;
          updateSaveStatus('error');
        }
      }

      function save(immediate = false) {
        // Clear any pending save
        if (saveTimeout) {
          clearTimeout(saveTimeout);
          saveTimeout = null;
        }

        // If immediate save requested, save now
        if (immediate) {
          saveNow();
          return;
        }

        // Check if we're saving too frequently
        const timeSinceLastSave = Date.now() - lastSaveTime;
        if (timeSinceLastSave < MIN_SAVE_INTERVAL_MS) {
          // Schedule save after minimum interval
          savePending = true;
          updateSaveStatus('pending');
          saveTimeout = setTimeout(saveNow, Math.max(SAVE_DEBOUNCE_MS, MIN_SAVE_INTERVAL_MS - timeSinceLastSave));
          return;
        }

        // Debounce: wait for user to stop making changes
        savePending = true;
        updateSaveStatus('pending');
        saveTimeout = setTimeout(saveNow, SAVE_DEBOUNCE_MS);
      }

      function updateSaveStatus(status) {
        const indicator = document.getElementById('saveStatus');
        if (!indicator) return;

        indicator.className = 'save-status ' + status;
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        switch (status) {
          case 'pending':
            indicator.textContent = '●';
            indicator.title = `Saving... (${timeStr})`;
            break;
          case 'saved':
            indicator.textContent = '✓';
            indicator.title = `Last saved at ${timeStr}`;
            break;
          case 'error':
            indicator.textContent = '✕';
            indicator.title = `Save failed at ${timeStr}`;
            break;
          default:
            indicator.textContent = '';
            indicator.title = '';
        }
      }

      function clearAllData() {
        if (!confirm('WARNING: This will DELETE ALL instances and data from localStorage.\n\nThis action CANNOT be undone!\n\nAre you absolutely sure?')) {
          return;
        }

        if (!confirm('This is your FINAL warning.\n\nAll card data, all instances, and all settings will be permanently deleted.\n\nContinue?')) {
          return;
        }

        try {
          // Get all keys to clear
          const allKeys = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            allKeys.push(key);
          }

          // Clear everything
          localStorage.clear();

          showToast(`Cleared ${allKeys.length} items from localStorage`, 'success');

          // Reset the app
          setTimeout(() => {
            location.reload();
          }, 1000);
        } catch (e) {
          showToast('Failed to clear data: ' + e.message, 'error');
        }
      }

      function load() {
        const key = instanceKey || 'nested_cards_store';
        const raw = localStorage.getItem(key);
        if (!raw) {
          store = { rootOrder: [], cards: {}, mods: {}, bookmarks: [], recentCards: [], viewMode: 'normal', activeTheme: 'light' };
          save();
          return;
        }
        try {
          const parsed = JSON.parse(raw);
          store = {
            rootOrder: parsed.rootOrder || [],
            cards: parsed.cards || {},
            mods: parsed.mods || {},
            bookmarks: parsed.bookmarks || [],
            recentCards: parsed.recentCards || [],
            viewMode: parsed.viewMode || 'normal',
            activeTheme: parsed.activeTheme || 'light'
          };

          // Data migration: rebuild rootOrder if needed
          let needsMigration = false;
          
          // Case 1: rootOrder is empty but cards exist
          if (store.rootOrder.length === 0 && Object.keys(store.cards).length > 0) {
            const rootCards = Object.values(store.cards).filter(card => !card.parentId);
            store.rootOrder = rootCards.map(card => card.id);
            needsMigration = store.rootOrder.length > 0;
          }
          
          // Case 2: Clean up rootOrder - remove invalid IDs and ensure all root cards are included
          if (Object.keys(store.cards).length > 0) {
            // Remove IDs from rootOrder that don't exist in cards
            const validRootOrder = store.rootOrder.filter(id => store.cards[id]);
            
            // Find all root-level cards (no parentId or parentId doesn't exist)
            const actualRootCards = Object.values(store.cards).filter(card => {
              return !card.parentId || !store.cards[card.parentId];
            });
            
            // Add any missing root cards to rootOrder
            actualRootCards.forEach(card => {
              if (!validRootOrder.includes(card.id)) {
                validRootOrder.push(card.id);
                needsMigration = true;
              }
            });
            
            // Update rootOrder if it changed
            if (validRootOrder.length !== store.rootOrder.length || 
                !validRootOrder.every((id, i) => id === store.rootOrder[i])) {
              store.rootOrder = validRootOrder;
              needsMigration = true;
            }
          }
          
          if (needsMigration) {
            save();
            showToast('Data migrated: synchronized root cards');
          }
        } catch (e) {
          bootError('Corrupted data.');
        }
      }

      // --- NAVIGATION ---

      function goTo(page, opts = {}) {
        navHistory.push({ ...navState });
        navState = {
          page,
          cardId: opts.cardId ?? null,
          parentId: opts.parentId ?? null,
          searchQuery: opts.searchQuery ?? ''
        };

        // Add to recent cards when viewing a card
        if (page === 'read' && opts.cardId) {
          addToRecentCards(opts.cardId);
        }

        runModHook('onNavigate', { ...navState });
        render();
      }

      function goBack() {
        if (navHistory.length) {
          navState = navHistory.pop();
          runModHook('onNavigate', { ...navState });
          render();
        }
      }
      
      // --- MODS API ---
      
      // =============================================================
      // --- MOD SYSTEM ---
      // CardSpoke's extension/mod system allows users to add custom
      // functionality through JavaScript hooks and CSS styles.
      // =============================================================
      
       /**
        * =============================================================
        * EXTENSION HOOKS (Planned & Implemented)
        * =============================================================
        * 
        * Extensions can register hooks to execute custom code at key points
        * in the application lifecycle. Use CardSpoke_MODS.register() to add hooks.
        * 
        * IMPLEMENTED HOOKS:
        * ------------------
        * @hook onAppInit(context)
        *   Called once when app initializes or when a mod is first loaded.
        *   Use for setup, initialization, or registering global handlers.
        *   @param {Object} context - Mod execution context
        * 
        * @hook onCardSave(context, card, saveInfo)
        *   Called whenever a card is created or updated.
        *   @param {Object} context - Mod execution context
        *   @param {Object} card - Card data (cloned, read-only)
        *   @param {Object} saveInfo - { isNew: boolean, source: string }
        * 
        * @hook onCardDelete(context, card)
        *   Called when a card is deleted.
        *   @param {Object} context - Mod execution context
        *   @param {Object} card - Card data before deletion (cloned)
        * 
        * @hook onCardRender(context, card, element)
        *   Called after a card is rendered to the DOM.
        *   @param {Object} context - Mod execution context
        *   @param {Object} card - Card data (cloned)
        *   @param {HTMLElement} element - Card DOM element
        * 
        * @hook onThemeChange(context, theme)
        *   Called when the theme (light/dark) is changed. (v0.13.1)
        *   @param {Object} context - Mod execution context
        *   @param {'light'|'dark'} theme - The new theme
        * 
        * @hook onTypographyChange(context, preset)
        *   Called when typography preset is changed. (v0.13.1)
        *   @param {Object} context - Mod execution context
        *   @param {string} preset - The new typography preset ('default', 'comfortable', 'compact', 'dyslexia')
        * 
        * @hook onHighContrastChange(context, enabled)
        *   Called when high contrast mode is toggled. (v0.13.1)
        *   @param {Object} context - Mod execution context
        *   @param {boolean} enabled - Whether high contrast is now enabled
        * 
        * PLANNED HOOKS:
        * -----------------------
        * @hook onNavigate(context, navState)
        *   Called when navigation state changes
        *   @param {Object} context - Mod execution context
        *   @param {Object} navState - { page, cardId, parentId, searchQuery }
        * 
        * @hook onSearch(context, query, results)
        *   Called when search is performed
        *   @param {Object} context - Mod execution context
        *   @param {string} query - Search query
        *   @param {Array} results - Array of matching cards
        * 
        * @hook onExport(context, exportData)
        *   Called before data export
        *   @param {Object} context - Mod execution context
        *   @param {Object} exportData - Data being exported
        * 
        * @hook onImport(context, importData)
        *   Called after data import
        *   @param {Object} context - Mod execution context
        *   @param {Object} importData - Imported data structure
        */

      const CardSpoke_MODS = (() => {
        // Registry of loaded mods
        const registry = {};
        // Map of mod IDs to their <style> tags
        const styleTags = {};
        // Set of mods that have run onAppInit
        const initializedMods = new Set();
        // Valid hook names for validation
        const VALID_HOOKS = new Set([
          'onAppInit', 'onCardSave', 'onCardDelete', 'onCardRender',
          'onNavigate', 'onSearch', 'onThemeChange', 'onTypographyChange',
          'onHighContrastChange', 'onExport', 'onImport', 'onEnable',
          'onDisable', 'onUninstall'
        ]);
        // Extension error tracking
        const errorCounts = {};
        // Hook execution statistics
        const hookStats = {};
        // Event bus for extension communication
        const eventListeners = {};

        /**
         * Ensure a mod is registered and executed
         * @param {string} modId - Unique mod identifier
         * @param {Object} modData - Mod data (js, css, meta)
         * @returns {Object|null} Registry entry or null on failure
         */
        function ensureRegistered(modId, modData) {
          const existing = registry[modId];
          if (existing && existing.__loaded) return existing;
          if (!modData || !modData.js) {
            if (!registry[modId]) {
              registry[modId] = { id: modId, hooks: {}, meta: modData?.meta || {}, __loaded: true };
            }
            return registry[modId];
          }
          try {
            registry[modId] = registry[modId] || { id: modId, hooks: {}, meta: {} };
            const sourceURL = `\n//# sourceURL=${modId}.mod.js`;
            const storeAPI = createStoreAPI(modId);
            const runner = new Function('window', 'document', 'CardSpoke_MODS', 'storeAPI', 'console', modData.js + sourceURL);
            runner(window, document, CardSpoke_MODS, storeAPI, console);
            if (modData.meta) registry[modId].meta = { ...modData.meta };
            registry[modId].__loaded = true;
            console.log(`[Extensions] Loaded: ${modId}`, modData.meta || {});
            return registry[modId];
          } catch (err) {
            console.error(`[Extensions] Failed to load ${modId}:`, err);
            registry[modId] = registry[modId] || { id: modId, hooks: {}, meta: modData?.meta || {} };
            registry[modId].__loaded = false;
            registry[modId].__error = err;
            return null;
          }
        }

        /**
         * Inject mod CSS into the document
         * @param {string} modId - Mod identifier
         * @param {string} css - CSS code to inject
         */
        function ensureStyle(modId, css) {
          if (!css || styleTags[modId]) return;
          const tag = document.createElement('style');
          tag.setAttribute('data-mod-style', modId);
          tag.textContent = css;
          document.head.appendChild(tag);
          styleTags[modId] = tag;
          console.log(`[Extensions] Applied CSS for: ${modId}`);
        }

        /**
         * Remove mod CSS from the document
         * @param {string} modId - Mod identifier
         */
        function removeStyle(modId) {
          const tag = styleTags[modId];
          if (tag && tag.parentNode) {
            tag.parentNode.removeChild(tag);
            console.log(`[Extensions] Removed CSS for: ${modId}`);
          }
          delete styleTags[modId];
        }

        /**
         * Create API object for mod to interact with app
         * @param {string} modId - Mod identifier
         * @returns {Object} API object with safe methods
         */
        function createStoreAPI(modId) {
          const modLogger = createModLogger(modId);
          const createCardInternal = createCard;
          const updateCardInternal = updateCard;
          const deleteCardInternal = deleteCard;

          return {
            getAppInfo() {
              return { appVersion: APP_VERSION, schemaVersion: SCHEMA_VERSION };
            },
            getCard(id) {
              return cloneCard(store.cards[id]);
            },
            listCards() {
              return Object.values(store.cards).map(cloneCard);
            },
            listRootIds() {
              return store.rootOrder.slice();
            },
            getNavState() {
              return { ...navState };
            },
            navigate(page, opts = {}) {
              goTo(page, opts);
            },
            goBack() {
              goBack();
            },
            showToast(message, type = 'success') {
              showToast(message, type);
            },
            markDirty() {
              dirty = true;
            },
            // Card mutations
            createCard(data = {}) {
              const { title = '', body = '', parentId = null, tags = [] } = data;
              const id = createCardInternal(title, body, parentId, false, false);
              if (Array.isArray(tags) && tags.length) setTags(id, tags, false);
              return id;
            },
            updateCard(id, updates = {}) {
              updateCardInternal(id, updates, false, false);
              return cloneCard(store.cards[id]);
            },
            deleteCard(id) {
              deleteCardInternal(id);
              return true;
            },
            // Tags API
            getTags(cardId) {
              return getTags(cardId);
            },
            addTag(cardId, tag) {
              return addTag(cardId, tag);
            },
            removeTag(cardId, tag) {
              return removeTag(cardId, tag);
            },
            setTags(cardId, tags) {
              return setTags(cardId, tags);
            },
            getAllTags() {
              return getAllTags();
            },
            // Dataset awareness
            getDatasetMeta() {
              return {
                name: instanceKey,
                cardCount: Object.keys(store.cards).length,
                rootCardCount: store.rootOrder.length,
                bookmarkCount: (store.bookmarks || []).length,
                recentCount: (store.recentCards || []).length,
                modCount: Object.keys(store.mods || {}).length,
                schemaVersion: SCHEMA_VERSION,
                appVersion: APP_VERSION
              };
            },
            logger: modLogger,
            utils: () => window.CardSpoke?.utils || window.CIB?.utils || {},
            log: modLogger.log,
            warn: modLogger.warn,
            error: modLogger.error,
            info: modLogger.info
          };
        }

        /**
         * Build context object passed to mod hooks
         * @param {string} modId - Mod identifier
         * @returns {Object} Context with modId, versions, and API
         */
        function buildContext(modId) {
          const logger = createModLogger(modId);
          return {
            modId,
            appVersion: APP_VERSION,
            schemaVersion: SCHEMA_VERSION,
            api: createStoreAPI(modId),
            utils: window.CardSpoke?.utils || window.CIB?.utils || {},
            logger
          };
        }

        function createModLogger(modId) {
          const prefix = `[Extension:${modId}]`;
          return {
            log: (...args) => console.log(prefix, ...args),
            info: (...args) => console.info(prefix, ...args),
            warn: (...args) => console.warn(prefix, ...args),
            error: (...args) => console.error(prefix, ...args)
          };
        }

        // --- PUBLIC MOD API ---
        // The following methods are exposed for mod management
        
        return {
          registry,
          _registry: registry,
          
          /**
           * Register a mod with hooks
           * Available hooks:
           * - onAppInit(ctx): Called when app initializes
           * - onCardRender(ctx, cardId, element): Called when card is rendered
           * - onCardSave(ctx, card, changes): Called when card is saved
           * - onCardDelete(ctx, cardId): Called when card is deleted
           * - onNavigate(ctx, navState): Called when navigation changes
           * - onSearch(ctx, query, results): Called when search completes
           * - onThemeChange(ctx, theme): Called when the theme toggles
           * - onTypographyChange(ctx, preset): Called when typography preset changes
           * - onHighContrastChange(ctx, enabled): Called when high contrast toggles
           * - onExport(ctx, data): Called before export downloads are triggered
           * - onImport(ctx, info): Called after import completes
           *
           * @param {string} modId - Unique mod identifier
           * @param {Object} definition - Mod definition with hooks and meta
           * @returns {Object} Registry entry
           */
          register(modId, definition = {}) {
            if (!modId) throw new Error('CardSpoke.mods.register requires a mod id');
            const entry = registry[modId] || { id: modId, hooks: {}, meta: {} };

            Object.entries(definition).forEach(([hook, fn]) => {
              if (hook.startsWith('on') && typeof fn === 'function') {
                // Validate hook name
                if (!VALID_HOOKS.has(hook)) {
                  console.warn(`[Extensions] Unknown hook "${hook}" in ${modId}. Valid hooks:`, [...VALID_HOOKS].sort());
                }
                entry.hooks[hook] = fn;
              }
            });

            if (definition.meta) entry.meta = { ...definition.meta };
            registry[modId] = entry;
            entry.__loaded = true;

            // Reset error count on successful registration
            errorCounts[modId] = 0;

            return entry;
          },
          unregister(modId) {
            // Run onUninstall hook before removing
            this.runHookForMod(modId, 'onUninstall');

            delete registry[modId];
            initializedMods.delete(modId);
            delete errorCounts[modId];
            removeStyle(modId);
            if (store.mods[modId]) {
              delete store.mods[modId];
              save();
            }
          },
          enable(modId) {
            const modData = store.mods[modId];
            if (!modData) return false;
            modData.enabled = true;
            ensureStyle(modId, modData.css);
            const entry = ensureRegistered(modId, modData);
            if (!entry) return false;
            initializedMods.delete(modId);
            save();

            // Run lifecycle hooks
            this.runHookForMod(modId, 'onEnable');
            this.runHookForMod(modId, 'onAppInit');
            return true;
          },
          disable(modId) {
            const modData = store.mods[modId];
            if (!modData) return false;

            // Run onDisable hook BEFORE disabling
            this.runHookForMod(modId, 'onDisable');

            modData.enabled = false;
            removeStyle(modId);
            initializedMods.delete(modId);
            save();
            return true;
          },
          syncFromStore() {
            Object.keys(registry).forEach(modId => {
              if (!store.mods[modId]) {
                removeStyle(modId);
                initializedMods.delete(modId);
                delete registry[modId];
              }
            });
            Object.entries(store.mods).forEach(([modId, modData]) => {
              if (!modData.enabled) return;
              ensureStyle(modId, modData.css);
              ensureRegistered(modId, modData);
            });
          },
          async runHook(hookName, ...args) {
            const promises = [];

            Object.keys(store.mods).forEach(modId => {
              const modData = store.mods[modId];
              if (!modData.enabled) return;
              const entry = registry[modId];
              if (!entry || !entry.__loaded || !entry.hooks[hookName]) return;
              if (hookName === 'onAppInit' && initializedMods.has(modId)) return;

              try {
                // Track hook execution start time
                const startTime = performance.now();

                const result = entry.hooks[hookName](buildContext(modId), ...args);

                if (result instanceof Promise) {
                  // Handle async hooks
                  promises.push(
                    result
                      .then(() => {
                        const duration = performance.now() - startTime;
                        this._recordHookExecution(modId, hookName, duration, true);
                        if (hookName === 'onAppInit') initializedMods.add(modId);
                        // Clear error count on success
                        errorCounts[modId] = 0;
                      })
                      .catch(err => {
                        const duration = performance.now() - startTime;
                        this._recordHookExecution(modId, hookName, duration, false);
                        this._handleHookError(modId, hookName, err);
                      })
                  );
                } else {
                  // Sync hook completed successfully
                  const duration = performance.now() - startTime;
                  this._recordHookExecution(modId, hookName, duration, true);
                  if (hookName === 'onAppInit') initializedMods.add(modId);
                  // Clear error count on success
                  errorCounts[modId] = 0;
                }
              } catch (err) {
                this._handleHookError(modId, hookName, err);
              }
            });

            // Wait for all async hooks to complete
            if (promises.length > 0) {
              await Promise.allSettled(promises);
            }
          },
          runHookForMod(modId, hookName, ...args) {
            const modData = store.mods[modId];
            if (!modData) return;
            const entry = registry[modId];
            if (!entry || !entry.__loaded || !entry.hooks[hookName]) return;

            try {
              const startTime = performance.now();
              const result = entry.hooks[hookName](buildContext(modId), ...args);

              if (result instanceof Promise) {
                result
                  .then(() => {
                    const duration = performance.now() - startTime;
                    this._recordHookExecution(modId, hookName, duration, true);
                    errorCounts[modId] = 0;
                  })
                  .catch(err => {
                    const duration = performance.now() - startTime;
                    this._recordHookExecution(modId, hookName, duration, false);
                    this._handleHookError(modId, hookName, err);
                  });
              } else {
                const duration = performance.now() - startTime;
                this._recordHookExecution(modId, hookName, duration, true);
                errorCounts[modId] = 0;
              }
            } catch (err) {
              this._handleHookError(modId, hookName, err);
            }
          },
          _handleHookError(modId, hookName, err) {
            console.error(`[Extensions] Error in ${modId}.${hookName}:`, err);
            console.error('Stack trace:', err.stack);

            // Track error count
            errorCounts[modId] = (errorCounts[modId] || 0) + 1;

            // Auto-disable after 3 consecutive errors
            if (errorCounts[modId] >= 3) {
              console.error(`[Extensions] Auto-disabling ${modId} due to repeated errors`);
              showToast(`Extension "${modId}" disabled due to repeated errors`, 'error', 5000);
              this.disable(modId);
              return;
            }

            // Show error notification
            const message = `Extension error: ${modId} (${hookName})\n${err.message}`;
            showToast(message, 'error', 4000);

            // Log to global error log
            if (!window._extErrors) window._extErrors = [];
            window._extErrors.push({
              modId,
              hookName,
              error: err.message,
              stack: err.stack,
              timestamp: Date.now(),
              errorCount: errorCounts[modId]
            });
          },
          _recordHookExecution(modId, hookName, duration, success) {
            const key = `${modId}.${hookName}`;
            if (!hookStats[key]) {
              hookStats[key] = {
                modId,
                hookName,
                executions: 0,
                failures: 0,
                totalDuration: 0,
                avgDuration: 0,
                maxDuration: 0,
                minDuration: Infinity
              };
            }
            const stats = hookStats[key];
            stats.executions++;
            if (!success) stats.failures++;
            stats.totalDuration += duration;
            stats.avgDuration = stats.totalDuration / stats.executions;
            stats.maxDuration = Math.max(stats.maxDuration, duration);
            stats.minDuration = Math.min(stats.minDuration, duration);
          },
          listMods() {
            return Object.keys(store.mods).map(id => ({
              id,
              enabled: !!store.mods[id]?.enabled,
              meta: store.mods[id]?.meta || {}
            }));
          },
          reload(modId) {
            const modData = store.mods[modId];
            if (!modData) {
              console.warn(`[Extensions] Cannot reload ${modId}: not found`);
              return false;
            }

            console.log(`[Extensions] Reloading ${modId}...`);

            // Clean up old version
            this.runHookForMod(modId, 'onDisable');
            removeStyle(modId);
            delete registry[modId];
            initializedMods.delete(modId);
            delete errorCounts[modId];

            // Load new version
            ensureStyle(modId, modData.css);
            const entry = ensureRegistered(modId, modData);
            if (entry) {
              this.runHookForMod(modId, 'onEnable');
              this.runHookForMod(modId, 'onAppInit');
              showToast(`Reloaded: ${modId}`, 'success');
              return true;
            }
            return false;
          },
          // Event bus for extension communication
          events: {
            on(eventName, callback) {
              if (!eventListeners[eventName]) {
                eventListeners[eventName] = [];
              }
              eventListeners[eventName].push(callback);
            },
            off(eventName, callback) {
              if (!eventListeners[eventName]) return;
              eventListeners[eventName] = eventListeners[eventName].filter(cb => cb !== callback);
            },
            emit(eventName, data) {
              if (!eventListeners[eventName]) return;
              eventListeners[eventName].forEach(callback => {
                try {
                  callback(data);
                } catch (err) {
                  console.error(`[Extensions] Event listener error for "${eventName}":`, err);
                }
              });
            },
            clear(eventName) {
              if (eventName) {
                delete eventListeners[eventName];
              } else {
                Object.keys(eventListeners).forEach(key => delete eventListeners[key]);
              }
            }
          },
          // Developer tools
          devTools: {
            inspectMod(modId) {
              const entry = registry[modId];
              if (!entry) return null;
              return {
                id: modId,
                hooks: Object.keys(entry.hooks),
                meta: entry.meta,
                loaded: entry.__loaded,
                initialized: initializedMods.has(modId),
                error: entry.__error,
                errorCount: errorCounts[modId] || 0,
                enabled: store.mods[modId]?.enabled || false
              };
            },
            listAllMods() {
              return Object.keys(registry).map(modId => this.inspectMod(modId));
            },
            getHookStats(modId) {
              if (modId) {
                return Object.entries(hookStats)
                  .filter(([key]) => key.startsWith(`${modId}.`))
                  .reduce((acc, [key, value]) => {
                    acc[key] = value;
                    return acc;
                  }, {});
              }
              return { ...hookStats };
            },
            getErrorLog() {
              return window._extErrors || [];
            },
            clearErrorLog() {
              window._extErrors = [];
            },
            testHook(modId, hookName, ...args) {
              console.log(`[Extensions DevTools] Testing ${modId}.${hookName}`, args);
              return CardSpoke_MODS.runHookForMod(modId, hookName, ...args);
            },
            getEventListeners() {
              return Object.keys(eventListeners).reduce((acc, eventName) => {
                acc[eventName] = eventListeners[eventName].length;
                return acc;
              }, {});
            }
          }
        };
      })();

      window.CardSpoke = window.CardSpoke || {};
      window.CardSpoke.mods = CardSpoke_MODS;
      window.CardSpoke_MODS = CardSpoke_MODS;
      // Backwards compatibility for legacy CIB-based extensions and tooling
      window.CIB = window.CIB || window.CardSpoke;
      window.CIB_MODS = CardSpoke_MODS;

      // =============================================================
      // --- CardSpoke.utils API ---
      // Public utility API for mod developers
      // Exposed as window.CardSpoke.utils
      // =============================================================
      
      /**
       * CardSpoke.utils - Public utility API for extension developers
       * 
       * Provides a safe, documented API for mods to interact with CardSpoke data and UI.
       * All functions handle errors gracefully and maintain data integrity.
       * 
       * @namespace CardSpoke.utils
       * @version 0.11.1
       * @since 0.11.1
       */
      window.CardSpoke = window.CardSpoke || {};
      window.CardSpoke.utils = {
        /**
         * Create a new card
         * @param {Object} data - Card data
         * @param {string} data.title - Card title
         * @param {string} data.body - Card content
         * @param {string|null} data.parentId - Parent card ID or null for root
         * @param {string[]} data.tags - Array of tags (optional)
         * @returns {Promise<{id: string, card: Object}>} Created card info
         * @example
         * const result = await CardSpoke.utils.createCard({
         *   title: 'My Card',
         *   body: 'Content here',
         *   parentId: null,
         *   tags: ['tag1', 'tag2']
         * });
         * console.log('Created card:', result.id);
         */
        createCard: async function(data = {}) {
          try {
            const { title = '', body = '', parentId = null, tags = [] } = data;
            const cardId = createCard(title, body, parentId, false, false);
            
            // Add tags if provided
            if (tags && tags.length > 0) {
              tags.forEach(tag => addTag(cardId, tag, true));
              save();
            }
            
            // Refresh UI to show new card
            render();
            
            const card = store.cards[cardId];
            return { id: cardId, card: cloneCard(card) };
          } catch (err) {
            console.error('[CardSpoke.utils] createCard failed:', err);
            throw new Error(`Failed to create card: ${err.message}`);
          }
        },

        /**
         * Update an existing card
         * @param {string} cardId - Card ID to update
         * @param {Object} changes - Fields to update
         * @param {string} changes.title - New title (optional)
         * @param {string} changes.body - New body (optional)
         * @param {string[]} changes.tags - New tags array (optional)
         * @returns {Promise<boolean>} True if successful
         * @example
         * await CardSpoke.utils.updateCard('card-123', {
         *   title: 'Updated Title',
         *   body: 'Updated content'
         * });
         */
        updateCard: async function(cardId, changes = {}) {
          try {
            if (!cardId) throw new Error('cardId is required');
            const card = store.cards[cardId];
            if (!card) throw new Error(`Card ${cardId} not found`);
            
            const { tags, ...otherChanges } = changes;
            
            // Update non-tag fields
            if (Object.keys(otherChanges).length > 0) {
              updateCard(cardId, otherChanges, false, false);
            }
            
            // Handle tags separately if provided
            if (tags !== undefined) {
              setTags(cardId, tags, false);
            }
            
            return true;
          } catch (err) {
            console.error('[CardSpoke.utils] updateCard failed:', err);
            throw new Error(`Failed to update card: ${err.message}`);
          }
        },

        /**
         * Get all tags for a card
         * @param {string} cardId - Card ID
         * @returns {Promise<string[]>} Array of tags (returns empty array on error)
         * @example
         * const tags = await CardSpoke.utils.getTags('card-123');
         * console.log('Tags:', tags);
         */
        getTags: async function(cardId) {
          try {
            if (!cardId) throw new Error('cardId is required');
            return getTags(cardId);
          } catch (err) {
            console.error('[CardSpoke.utils] getTags failed:', err);
            return [];
          }
        },

        /**
         * Add a tag to a card
         * @param {string} cardId - Card ID
         * @param {string} tag - Tag to add
         * @returns {Promise<boolean>} True if tag was added successfully, false on error
         * @example
         * const success = await CardSpoke.utils.addTag('card-123', 'important');
         */
        addTag: async function(cardId, tag) {
          try {
            if (!cardId) throw new Error('cardId is required');
            if (!tag) throw new Error('tag is required');
            return addTag(cardId, tag, false);
          } catch (err) {
            console.error('[CardSpoke.utils] addTag failed:', err);
            return false;
          }
        },

        /**
         * Remove a tag from a card
         * @param {string} cardId - Card ID
         * @param {string} tag - Tag to remove
         * @returns {Promise<boolean>} True if tag was removed successfully, false on error
         * @example
         * await CardSpoke.utils.removeTag('card-123', 'old-tag');
         */
        removeTag: async function(cardId, tag) {
          try {
            if (!cardId) throw new Error('cardId is required');
            if (!tag) throw new Error('tag is required');
            return removeTag(cardId, tag, false);
          } catch (err) {
            console.error('[CardSpoke.utils] removeTag failed:', err);
            return false;
          }
        },

        /**
         * Set all tags for a card (replaces existing tags)
         * @param {string} cardId - Card ID
         * @param {string[]} tags - Array of tags
         * @returns {Promise<boolean>} True if successful, false on error
         * @example
         * await CardSpoke.utils.setTags('card-123', ['tag1', 'tag2', 'tag3']);
         */
        setTags: async function(cardId, tags) {
          try {
            if (!cardId) throw new Error('cardId is required');
            if (!Array.isArray(tags)) throw new Error('tags must be an array');
            return setTags(cardId, tags, false);
          } catch (err) {
            console.error('[CardSpoke.utils] setTags failed:', err);
            return false;
          }
        },

        /**
         * Get all unique tags across all cards
         * @returns {Promise<string[]>} Sorted array of all tags (returns empty array on error)
         * @example
         * const allTags = await CardSpoke.utils.getAllTags();
         * console.log('All tags:', allTags);
         */
        getAllTags: async function() {
          try {
            return getAllTags();
          } catch (err) {
            console.error('[CardSpoke.utils] getAllTags failed:', err);
            return [];
          }
        },

        /**
         * Display a toast notification
         * @param {string} message - Message to display
         * @param {'success'|'info'|'warning'|'error'} type - Toast type
         * @param {number} duration - Duration in ms (default: 3000)
         * @returns {Promise<void>}
         * @example
         * await CardSpoke.utils.showToast('Operation successful!', 'success');
         * await CardSpoke.utils.showToast('Warning!', 'warning', 5000);
         */
        showToast: async function(message, type = 'info', duration = 3000) {
          try {
            showToast(message, type, duration);
          } catch (err) {
            console.error('[CardSpoke.utils] showToast failed:', err);
          }
        },

        /**
         * Get dataset metadata
         * @returns {Promise<Object>} Dataset metadata
         * @example
         * const meta = await CardSpoke.utils.getDatasetMeta();
         * console.log('Dataset:', meta.name, 'Cards:', meta.cardCount);
         */
        getDatasetMeta: async function() {
          try {
            return {
              name: instanceKey,
              cardCount: Object.keys(store.cards).length,
              rootCardCount: store.rootOrder.length,
              bookmarkCount: (store.bookmarks || []).length,
              recentCount: (store.recentCards || []).length,
              modCount: Object.keys(store.mods || {}).length,
              schemaVersion: SCHEMA_VERSION,
              appVersion: APP_VERSION
            };
          } catch (err) {
            console.error('[CardSpoke.utils] getDatasetMeta failed:', err);
            return {};
          }
        },

        /**
         * Get a card by ID
         * @param {string} cardId - Card ID
         * @returns {Promise<Object|null>} Card object (cloned) or null if not found or on error
         * @example
         * const card = await CardSpoke.utils.getCard('card-123');
         * if (card) console.log('Found:', card.title);
         */
        getCard: async function(cardId) {
          try {
            if (!cardId) throw new Error('cardId is required');
            const card = store.cards[cardId];
            return card ? cloneCard(card) : null;
          } catch (err) {
            console.error('[CardSpoke.utils] getCard failed:', err);
            return null;
          }
        },

        /**
         * Search for cards
         * @param {string} query - Search query
         * @returns {Promise<Array>} Array of matching cards (returns empty array on error)
         * @example
         * const results = await CardSpoke.utils.searchCards('meeting notes');
         * console.log('Found', results.length, 'cards');
         */
        searchCards: async function(query) {
          try {
            if (!query) return [];
            const lowerQuery = query.toLowerCase();
            const results = [];
            
            for (const id in store.cards) {
              const card = store.cards[id];
              if (card.title.toLowerCase().includes(lowerQuery) ||
                  card.body.toLowerCase().includes(lowerQuery) ||
                  (card.tags && card.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))) {
                results.push(cloneCard(card));
              }
            }
            
            return results;
          } catch (err) {
            console.error('[CardSpoke.utils] searchCards failed:', err);
            return [];
          }
        },

        // =============================================================
        // ACCESSIBILITY & THEME API (v0.13.1)
        // Methods for extensions to access and customize accessibility features
        // =============================================================

        /**
         * Get current accessibility settings
         * @returns {Promise<Object>} Current accessibility settings
         * @example
         * const settings = await CardSpoke.utils.getAccessibilitySettings();
         * console.log(settings.theme, settings.typography, settings.highContrast);
         */
        getAccessibilitySettings: async function() {
          try {
            return {
              theme: store.activeTheme || 'light',
              typography: localStorage.getItem('cardspoke_typography') || 'default',
              highContrast: document.documentElement.classList.contains('high-contrast'),
              reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
            };
          } catch (err) {
            console.error('[CardSpoke.utils] getAccessibilitySettings failed:', err);
            return { theme: 'light', typography: 'default', highContrast: false, reducedMotion: false };
          }
        },

        /**
         * Set the theme (light or dark mode)
         * @param {'light'|'dark'} theme - Theme to apply
         * @returns {Promise<boolean>} Success status
         * @example
         * await CardSpoke.utils.setTheme('dark');
         */
        setTheme: async function(theme) {
          try {
            if (theme !== 'light' && theme !== 'dark') {
              throw new Error('Theme must be "light" or "dark"');
            }
            applyTheme(theme);
            return true;
          } catch (err) {
            console.error('[CardSpoke.utils] setTheme failed:', err);
            return false;
          }
        },

        /**
         * Get current theme
         * @returns {Promise<'light'|'dark'>} Current theme
         * @example
         * const theme = await CardSpoke.utils.getTheme();
         */
        getTheme: async function() {
          try {
            return store.activeTheme || 'light';
          } catch (err) {
            console.error('[CardSpoke.utils] getTheme failed:', err);
            return 'light';
          }
        },

        /**
         * Set typography preset
         * @param {'default'|'comfortable'|'compact'|'dyslexia'} preset - Typography preset
         * @returns {Promise<boolean>} Success status
         * @example
         * await CardSpoke.utils.setTypography('comfortable');
         */
        setTypography: async function(preset) {
          try {
            const validPresets = ['default', 'comfortable', 'compact', 'dyslexia'];
            if (!validPresets.includes(preset)) {
              throw new Error('Preset must be one of: ' + validPresets.join(', '));
            }
            localStorage.setItem('cardspoke_typography', preset);
            document.documentElement.setAttribute('data-typography', preset);
            runModHook('onTypographyChange', preset);
            return true;
          } catch (err) {
            console.error('[CardSpoke.utils] setTypography failed:', err);
            return false;
          }
        },

        /**
         * Get current typography preset
         * @returns {Promise<string>} Current typography preset
         * @example
         * const typography = await CardSpoke.utils.getTypography();
         */
        getTypography: async function() {
          try {
            return localStorage.getItem('cardspoke_typography') || 'default';
          } catch (err) {
            console.error('[CardSpoke.utils] getTypography failed:', err);
            return 'default';
          }
        },

        /**
         * Set high contrast mode
         * @param {boolean} enabled - Enable or disable high contrast
         * @returns {Promise<boolean>} Success status
         * @example
         * await CardSpoke.utils.setHighContrast(true);
         */
        setHighContrast: async function(enabled) {
          try {
            if (enabled) {
              document.documentElement.classList.add('high-contrast');
            } else {
              document.documentElement.classList.remove('high-contrast');
            }
            localStorage.setItem('cardspoke_highcontrast', enabled.toString());
            runModHook('onHighContrastChange', enabled);
            return true;
          } catch (err) {
            console.error('[CardSpoke.utils] setHighContrast failed:', err);
            return false;
          }
        },

        /**
         * Check if high contrast mode is enabled
         * @returns {Promise<boolean>} High contrast status
         * @example
         * const isHighContrast = await CardSpoke.utils.isHighContrast();
         */
        isHighContrast: async function() {
          try {
            return document.documentElement.classList.contains('high-contrast');
          } catch (err) {
            console.error('[CardSpoke.utils] isHighContrast failed:', err);
            return false;
          }
        },

        /**
         * Check if reduced motion is preferred
         * @returns {Promise<boolean>} Reduced motion preference
         * @example
         * const prefersReducedMotion = await CardSpoke.utils.prefersReducedMotion();
         */
        prefersReducedMotion: async function() {
          try {
            return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          } catch (err) {
            console.error('[CardSpoke.utils] prefersReducedMotion failed:', err);
            return false;
          }
        },

        /**
         * Listen for theme changes
         * @param {Function} callback - Callback function called with new theme
         * @returns {Function} Unsubscribe function
         * @example
         * const unsub = CardSpoke.utils.onThemeChange((theme) => {
         *   console.log('Theme changed to:', theme);
         * });
         * // Later: unsub() to stop listening
         */
        onThemeChange: function(callback) {
          const id = 'theme-listener-' + Date.now();
          CardSpoke_MODS.register(id, {
            meta: { name: 'Theme Listener', type: 'internal' },
            onThemeChange: function(ctx, theme) {
              callback(theme);
            }
          });
          return function() {
            CardSpoke_MODS.unregister(id);
          };
        },

        /**
         * Get list of available CSS variables that can be customized by themes
         * @returns {Promise<Object>} Object with variable categories
         * @example
         * const vars = await CardSpoke.utils.getThemeVariables();
         * console.log(vars.colors, vars.accessibility);
         */
        getThemeVariables: async function() {
          return {
            colors: [
              '--bg', '--surface', '--border', '--text', '--text-medium', 
              '--text-muted', '--text-ghost'
            ],
            typography: [
              '--font', '--font-brand', '--text-xs', '--text-sm', '--text-base',
              '--text-lg', '--text-xl', '--text-2xl', '--text-3xl', '--text-brand',
              '--text-number', '--line-height'
            ],
            spacing: [
              '--space-xs', '--space-sm', '--space-md', '--space-lg',
              '--space-xl', '--space-2xl', '--space-3xl', '--space-4xl', '--radius'
            ],
            accessibility: {
              typography: [
                '--typography-font-size-default', '--typography-line-height-default',
                '--typography-font-size-comfortable', '--typography-line-height-comfortable',
                '--typography-font-size-compact', '--typography-line-height-compact',
                '--typography-font-size-dyslexia', '--typography-line-height-dyslexia',
                '--typography-letter-spacing-dyslexia', '--typography-word-spacing-dyslexia',
                '--typography-font-dyslexia'
              ],
              highContrast: [
                '--hc-bg', '--hc-bg-secondary', '--hc-bg-tertiary',
                '--hc-text', '--hc-text-secondary', '--hc-border',
                '--hc-accent', '--hc-accent-hover',
                '--hc-border-width', '--hc-button-border-width', '--hc-card-border-width'
              ],
              focus: [
                '--focus-outline-color', '--focus-outline-width',
                '--focus-outline-offset', '--focus-outline-style'
              ]
            }
          };
        }
      };

      // Log API availability in developer mode
      if (isDeveloperMode()) {
        console.log('[CardSpoke.utils] API initialized and available at window.CardSpoke.utils');
        console.log('[CardSpoke.utils] Available methods:', Object.keys(window.CardSpoke.utils));
      }

      // Legacy compatibility for extensions targeting the former CIB namespace
      window.CIB = window.CIB || {};
      window.CIB.utils = window.CardSpoke.utils;
      window.CIB.mods = window.CardSpoke.mods;


      function runModHook(hookName, ...args) {
        CardSpoke_MODS.runHook(hookName, ...args);
      }

      // --- DATA (CRUD) ---

      /**
       * Create a new card
       * @param {string} title - Card title
       * @param {string} body - Card content/body
       * @param {string|null} parentId - Parent card ID or null for root
       * @param {boolean} skipSave - Skip saving to localStorage
       * @param {boolean} skipHooks - Skip running mod hooks
       * @returns {string} New card ID
       */
      function createCard(title, body, parentId = null, skipSave = false, skipHooks = false) {
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
          modsData: {},
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
        // Add to undo stack for undo support (v0.12.0 fix)
        // Always track undo regardless of skipHooks - skipHooks only controls mod hooks
        pushUndo('createCard', { cardId: id, card: cloneCard(store.cards[id]) });
        if (!skipSave) save();
        if (!skipHooks) runModHook('onCardSave', cloneCard(store.cards[id]), { isNew: true, source: 'create' });
        return id;
      }

      /**
       * Update an existing card
       * @param {string} id - Card ID to update
       * @param {Object} updates - Fields to update
       * @param {boolean} skipSave - Skip saving to localStorage
       * @param {boolean} skipHooks - Skip running mod hooks
       */
      function updateCard(id, updates, skipSave = false, skipHooks = false) {
        const card = store.cards[id];
        if (!card) return;
        // Store previous state for undo support (v0.12.0 fix)
        // Always track undo regardless of skipHooks - skipHooks only controls mod hooks
        const previousState = cloneCard(card);
        const updateTimestamp = Date.now();
        pushUndo('updateCard', { 
          cardId: id, 
          previousState: previousState,
          newState: { ...updates, updatedAt: updateTimestamp }
        });
        Object.assign(card, updates, { updatedAt: updateTimestamp });
        if (!skipSave) save();
        if (!skipHooks) runModHook('onCardSave', cloneCard(card), { isNew: false, source: 'update' });
      }

      /**
       * Delete a card and all its children recursively
       * @param {string} id - Card ID to delete
       */
      function deleteCard(id) {
        const card = store.cards[id];
        if (!card) return;
        
        // Add to undo stack before deletion
        pushUndo('deleteCard', { card: cloneCard(card) });
        
        // Add to trash bin
        trashBin.unshift({
          card: cloneCard(card),
          deletedAt: Date.now()
        });
        if (trashBin.length > MAX_TRASH_SIZE) trashBin.pop();
        
        runModHook('onCardDelete', cloneCard(card));
        (card.children || []).forEach(cid => deleteCard(cid));
        if (card.parentId) {
          const parent = store.cards[card.parentId];
          if (parent) parent.children = parent.children.filter(c => c !== id);
        } else {
          store.rootOrder = store.rootOrder.filter(c => c !== id);
        }
        delete store.cards[id];
        save();
      }

      /**
       * Duplicate a card with option to clone children
       * @param {string} id - Card ID to duplicate
       * @param {boolean} withChildren - Whether to clone children recursively
       * @returns {string} New card ID
       */
      function duplicateCard(id, withChildren = false) {
        const original = store.cards[id];
        if (!original) return null;
        
        const newId = uid();
        const now = Date.now();
        
        // Create duplicate with new ID and title suffix
        store.cards[newId] = {
          ...cloneCard(original),
          id: newId,
          title: (original.title || 'Untitled') + ' (Copy)',
          children: [],
          createdAt: now,
          updatedAt: now
        };
        
        // Add to parent or root
        if (original.parentId) {
          const parent = store.cards[original.parentId];
          if (parent && !parent.children.includes(newId)) {
            parent.children.push(newId);
          }
        } else {
          store.rootOrder.push(newId);
        }
        
        // Recursively duplicate children if requested
        if (withChildren && original.children.length > 0) {
          original.children.forEach(childId => {
            const newChildId = duplicateCardAsChild(childId, newId, true);
          });
        }
        
        save();
        runModHook('onCardSave', cloneCard(store.cards[newId]), { isNew: true, source: 'duplicate' });
        return newId;
      }

      /**
       * Helper to duplicate a card as child of another card
       * @param {string} id - Card ID to duplicate
       * @param {string} newParentId - New parent card ID
       * @param {boolean} withChildren - Whether to clone children recursively
       * @returns {string} New card ID
       */
      function duplicateCardAsChild(id, newParentId, withChildren = false) {
        const original = store.cards[id];
        if (!original) return null;
        
        const newId = uid();
        const now = Date.now();
        
        store.cards[newId] = {
          ...cloneCard(original),
          id: newId,
          parentId: newParentId,
          children: [],
          createdAt: now,
          updatedAt: now
        };
        
        const parent = store.cards[newParentId];
        if (parent && !parent.children.includes(newId)) {
          parent.children.push(newId);
        }
        
        if (withChildren && original.children.length > 0) {
          original.children.forEach(childId => {
            duplicateCardAsChild(childId, newId, true);
          });
        }
        
        return newId;
      }

      /**
       * Toggle bookmark status for a card
       * @param {string} cardId - Card ID to bookmark/unbookmark
       */
      function toggleBookmark(cardId) {
        if (!store.bookmarks) store.bookmarks = [];
        const idx = store.bookmarks.indexOf(cardId);
        if (idx >= 0) {
          store.bookmarks.splice(idx, 1);
          showToast('Bookmark removed', 'info');
        } else {
          store.bookmarks.push(cardId);
          showToast('Card bookmarked', 'success');
        }
        save();
        render();
      }

      /**
       * Check if a card is bookmarked
       * @param {string} cardId - Card ID to check
       * @returns {boolean} True if bookmarked
       */
      function isBookmarked(cardId) {
        if (!store.bookmarks) store.bookmarks = [];
        return store.bookmarks.includes(cardId);
      }

      /**
       * Add card to recent history
       * @param {string} cardId - Card ID to add to recent history
       */
      function addToRecentCards(cardId) {
        if (!store.recentCards) store.recentCards = [];
        // Remove if already in list
        store.recentCards = store.recentCards.filter(id => id !== cardId);
        // Add to front
        store.recentCards.unshift(cardId);
        // Keep only last 10
        if (store.recentCards.length > 10) {
          store.recentCards = store.recentCards.slice(0, 10);
        }
        save(true); // Save immediately but don't show toast
      }

      /**
       * Toggle view mode between normal and compact
       */
      function toggleViewMode() {
        if (!store.viewMode) store.viewMode = 'normal';
        store.viewMode = store.viewMode === 'normal' ? 'compact' : 'normal';
        save();
        render();
        showToast(`View mode: ${store.viewMode}`, 'info');
      }

      // --- DATA (IMPORT/EXPORT) ---

      function exportJSON(type = 'instance') {
        let data;
        if (type === 'instance') {
          data = {
            exportType: 'instance',
            appVersion: APP_VERSION,
            timestamp: Date.now(),
            cards: store.cards,
            rootIds: store.rootOrder,
            mods: store.mods
          };
        } else if (type === 'mods') {
          data = {
            exportType: 'mods',
            appVersion: APP_VERSION,
            timestamp: Date.now(),
            mods: store.mods
          };
        }
        runModHook('onExport', { type, payload: data });
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cardspoke-${type}-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast(`Exported ${type} successfully`);
      }

      /**
       * Download file with feedback and fallback handling
       * @param {Blob} blob - File blob to download
       * @param {string} filename - Suggested filename
       * @param {string} format - File format for display (e.g., 'TXT', 'Markdown')
       */
      function downloadWithFeedback(blob, filename, format) {
        const url = URL.createObjectURL(blob);
        
        try {
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          
          // Add to document for Firefox compatibility
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          
          // Show success feedback
          showToast(`✓ ${format} export downloaded: ${filename}`, 'success');
          
        } catch (err) {
          // Fallback: show modal with download link
          console.warn('[Export] Automatic download failed:', err);
          
          const overlay = h('div', { className: 'modal-overlay show' });
          const modal = h('div', { className: 'modal' });
          const modalHeader = h('div', { className: 'modal-header' });
          modalHeader.appendChild(h('div', { className: 'modal-title' }, 'Export Ready'));
          const closeBtn = h('button', { className: 'modal-close', onclick: () => overlay.remove() }, '✕');
          modalHeader.appendChild(closeBtn);
          modal.appendChild(modalHeader);
          
          const modalBody = h('div', { className: 'modal-body' });
          modalBody.appendChild(h('p', { style: 'margin-bottom: var(--space-lg);' }, 
            `Your ${format} export is ready. Click the button below to download.`));
          
          const downloadBtn = h('a', {
            className: 'btn btn-primary',
            href: url,
            download: filename,
            style: 'display: inline-block; text-decoration: none;'
          }, `Download ${filename}`);
          
          downloadBtn.onclick = () => {
            showToast(`✓ ${format} export downloaded`, 'success');
            setTimeout(() => overlay.remove(), 500);
          };
          
          modalBody.appendChild(downloadBtn);
          modal.appendChild(modalBody);
          overlay.appendChild(modal);
          document.body.appendChild(overlay);
          
          showToast(`${format} export ready - click to download`, 'info');
        }
        
        // Clean up blob URL after a delay
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      }

      function exportTXT() {
        let text = '# CardSpoke Export\n\n';
        function writeCard(cardId, depth = 0) {
          const card = store.cards[cardId];
          if (!card) return;
          const indent = '  '.repeat(depth);
          text += `${indent}${card.title || '(Untitled)'}\n`;
          if (card.body) {
            text += `${indent}  ${card.body.replace(/\n/g, '\n' + indent + '  ')}\n`;
          }
          text += '\n';
          (card.children || []).forEach(cid => writeCard(cid, depth + 1));
        }
        store.rootOrder.forEach(id => writeCard(id));
        runModHook('onExport', { type: 'txt', payloadLength: text.length });
        const blob = new Blob([text], { type: 'text/plain' });
        const filename = `cardspoke-${new Date().toISOString().slice(0,10)}.txt`;
        downloadWithFeedback(blob, filename, 'TXT');
      }


      /**
       * Export cards to Markdown format with hierarchy
       */
      function exportMarkdown() {
        let markdown = '# CardSpoke Export\n\n';
        markdown += `*Exported: ${new Date().toLocaleString()}*\n\n`;
        markdown += '---\n\n';
        
        function writeCardMD(cardId, depth = 0) {
          const card = store.cards[cardId];
          if (!card) return;
          
          const heading = '#'.repeat(Math.min(depth + 1, 6));
          markdown += `${heading} ${card.title || '(Untitled)'}\n\n`;
          
          if (card.tags && card.tags.length > 0) {
            markdown += `*Tags: ${card.tags.map(t => `\`${t}\``).join(', ')}*\n\n`;
          }
          
          if (card.body) {
            markdown += `${card.body}\n\n`;
          }
          
          (card.children || []).forEach(cid => writeCardMD(cid, depth + 1));
        }
        
        store.rootOrder.forEach(id => writeCardMD(id));

        runModHook('onExport', { type: 'markdown', payloadLength: markdown.length });
        const blob = new Blob([markdown], { type: 'text/markdown' });
        const filename = `cardspoke-${new Date().toISOString().slice(0,10)}.md`;
        downloadWithFeedback(blob, filename, 'Markdown');
      }

      /**
       * Export cards to CSV format (flat structure)
       */
      function exportCSV() {
        let csv = 'ID,Title,Body,Parent ID,Tags,Children Count,Created,Updated\n';
        
        Object.values(store.cards).forEach(card => {
          const id = card.id || '';
          const title = (card.title || '').replace(/"/g, '""');
          const body = (card.body || '').replace(/"/g, '""').replace(/\n/g, ' ');
          const parentId = card.parentId || '';
          const tags = (card.tags || []).join(';');
          const childrenCount = (card.children || []).length;
          const created = card.createdAt || '';
          const updated = card.updatedAt || '';

          csv += `"${id}","${title}","${body}","${parentId}","${tags}",${childrenCount},"${created}","${updated}"\n`;
        });

        runModHook('onExport', { type: 'csv', payloadLength: csv.length });
        const blob = new Blob([csv], { type: 'text/csv' });
        const filename = `cardspoke-${new Date().toISOString().slice(0,10)}.csv`;
        downloadWithFeedback(blob, filename, 'CSV');
      }
      function handleExport(type) {
        if (type === 'instance-json') exportJSON('instance');
        else if (type === 'instance-txt') exportTXT();
        else if (type === 'mods-json') exportJSON('mods');
      }

      function importJSON(data, mode = 'root') {
        const pkg = typeof data === 'string' ? JSON.parse(data) : data;
        const importedIds = [];
        const idMap = {};
        const remappedCards = {};
        
        Object.entries(pkg.cards || {}).forEach(([oldId, card]) => {
          const newId = uid();
          idMap[oldId] = newId;
          remappedCards[newId] = { ...card, id: newId };
          importedIds.push(newId);
        });
        
        Object.values(remappedCards).forEach(card => {
          card.children = (card.children || []).map(cid => idMap[cid] || cid);
          if (card.parentId && idMap[card.parentId]) {
            card.parentId = idMap[card.parentId];
          }
        });
        
        const remappedRootIds = (pkg.rootIds || []).map(id => idMap[id] || id);
        
        Object.values(remappedCards).forEach(card => {
          store.cards[card.id] = card;
        });
        
        if (mode === 'root') {
          remappedRootIds.forEach(id => {
            if (store.cards[id]) {
              store.cards[id].parentId = null;
              if (!store.rootOrder.includes(id)) {
                store.rootOrder.push(id);
              }
            }
          });
        } else {
          const parentCard = store.cards[mode];
          if (parentCard) {
            remappedRootIds.forEach(cardId => {
              if (store.cards[cardId]) {
                store.cards[cardId].parentId = mode;
                if (!parentCard.children.includes(cardId)) {
                  parentCard.children.push(cardId);
                }
              }
            });
          }
        }
        
        if (pkg.exportType === 'instance' && pkg.mods) {
          Object.entries(pkg.mods).forEach(([modId, mod]) => {
            if (!store.mods[modId]) {
              store.mods[modId] = {
                enabled: !!mod.enabled,
                js: mod.js || '',
                css: mod.css || '',
                meta: mod.meta ? { ...mod.meta } : {}
              };
            }
          });
        }
        
        save();
        if (window.CardSpoke.mods && !safeMode) {
          window.CardSpoke.mods.syncFromStore();
          window.CardSpoke.mods.runHook('onAppInit');
        }

        runModHook('onImport', { type: pkg.exportType || 'unknown', cards: importedIds.slice(), mods: Object.keys(pkg.mods || {}) });
        importedIds.forEach(cardId => {
          const storedCard = store.cards[cardId];
          if (storedCard) {
            runModHook('onCardSave', cloneCard(storedCard), { isNew: true, source: 'importJSON', exportType: pkg.exportType });
          }
        });
        
        showToast(`Imported ${Object.keys(remappedCards).length} cards`);
        render();
      }

      function importTXT(text, mode = 'outline', location = 'root') {
        const createdIds = [];
        if (mode === 'outline') {
          const lines = text.split('\n').filter(l => l.trim());
          const stack = [];
          lines.forEach(line => {
            const indent = line.search(/\S/);
            const title = line.trim();
            const depth = Math.floor(indent / 2);
            const parentId = depth > 0 && stack[depth - 1] ? stack[depth - 1] :
                           (location === 'root' ? null : location);
            const id = createCard(title, '', parentId);
            stack[depth] = id;
            stack.length = depth + 1;
            createdIds.push(id);
          });
          showToast('Imported outline successfully');
          render();
        } else if (mode === 'append') {
          if (location && location !== 'root') {
            const card = store.cards[location];
            if (card) {
              card.body = (card.body ? card.body + '\n\n' : '') + text;
              card.updatedAt = Date.now();
              save();
              showToast('Text appended successfully');
              render();
            }
          }
        }

        runModHook('onImport', { type: 'text', mode, location, cards: createdIds });
      }

      function importDOCX(text, mode = 'append', targetCardId) {
        if (!targetCardId || !store.cards[targetCardId]) {
          showToast('Please select a target card', 'error');
          return;
        }
        const card = store.cards[targetCardId];
        if (mode === 'append') {
          card.body = (card.body ? card.body + '\n\n' : '') + text;
        } else if (mode === 'replace') {
          card.body = text;
        }
        card.updatedAt = Date.now();
        save();
        showToast('DOCX imported successfully');
        render();
        runModHook('onImport', { type: 'docx', mode, targetCardId });
      }

      // --- INSTANCE & MODALS ---

      function showDatasetManager() {
        const overlay = h('div', { className: 'modal-overlay show' });
        const modal = h('div', { className: 'modal', style: 'max-width: 700px;' });
        const modalHeader = h('div', { className: 'modal-header' });
        modalHeader.appendChild(h('div', { className: 'modal-title' }, 'Dataset Manager'));
        const closeBtn = h('button', { className: 'modal-close', onclick: () => overlay.remove() }, '✕');
        modalHeader.appendChild(closeBtn);
        modal.appendChild(modalHeader);
        const modalBody = h('div', { className: 'modal-body' });

        // Get all existing datasets (instances)
        const allKeys = Object.keys(localStorage).filter(k => k.startsWith('nested_cards_') || k === 'nested_cards_store');
        const current = instanceKey || 'nested_cards_store';

        // Title and description
        const description = h('p', { style: 'margin-bottom: var(--space-lg); color: var(--text-secondary);' }, 
          'Manage your datasets. Each dataset is an independent collection of cards with its own storage.');
        modalBody.appendChild(description);

        // Existing datasets section
        const datasetsTitle = h('h3', { style: 'margin-bottom: var(--space-md);' }, 'Your Datasets');
        modalBody.appendChild(datasetsTitle);

        if (allKeys.length === 0) {
          const empty = h('div', { className: 'empty', style: 'margin-bottom: var(--space-xl);' }, 
            'No datasets found. Create your first dataset below.');
          modalBody.appendChild(empty);
        } else {
          // List existing datasets
          const datasetList = h('div', { style: 'margin-bottom: var(--space-xl);' });
          
          allKeys.forEach(key => {
            const isCurrent = key === current;
            const datasetItem = h('div', { 
              style: `
                background: ${isCurrent ? 'var(--primary-light, #e3f2fd)' : 'var(--bg-secondary)'};
                padding: var(--space-lg);
                border-radius: var(--radius);
                border: 2px solid ${isCurrent ? 'var(--primary)' : 'var(--border)'};
                margin-bottom: var(--space-md);
                display: flex;
                justify-content: space-between;
                align-items: center;
              `
            });

            // Dataset info
            const datasetInfo = h('div', { style: 'flex: 1;' });
            const datasetName = h('div', { style: 'font-weight: 700; margin-bottom: var(--space-xs);' }, 
              key + (isCurrent ? ' (Active)' : ''));
            const datasetMeta = h('div', { style: 'font-size: 0.875rem; color: var(--text-secondary);' });
            
            // Get size info
            try {
              const data = localStorage.getItem(key);
              const size = data ? new Blob([data]).size : 0;
              const formatBytes = (bytes) => {
                if (bytes === 0) return '0 Bytes';
                const k = 1024;
                const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
              };
              
              const parsed = data ? JSON.parse(data) : null;
              const cardCount = parsed ? Object.keys(parsed.cards || {}).length : 0;
              const datasetName = (parsed && parsed.metadata && parsed.metadata.name) || key;
              const storageType = (parsed && parsed.metadata && parsed.metadata.storageType) || 'localstorage';
              const storageTypeDisplay = storageType === 'indexeddb' ? 'IndexedDB' : 'LocalStorage';
              
              datasetMeta.textContent = `Storage: ${storageTypeDisplay} • Size: ${formatBytes(size)} • Cards: ${cardCount}`;
            } catch (e) {
              datasetMeta.textContent = 'Storage: Unknown • Unable to read dataset info';
            }

            datasetInfo.appendChild(datasetName);
            datasetInfo.appendChild(datasetMeta);
            datasetItem.appendChild(datasetInfo);

            // Actions
            const actions = h('div', { style: 'display: flex; gap: var(--space-sm);' });
            
            if (!isCurrent) {
              const openBtn = h('button', { 
                className: 'btn btn-primary',
                onclick: () => {
                  localStorage.setItem('activeInstance', key);
                  instanceKey = key;
                  load();
                  if (!safeMode) {
                    CardSpoke_MODS.syncFromStore();
                    CardSpoke_MODS.runHook('onAppInit');
                  }
                  render();
                  overlay.remove();
                  showToast('Switched to: ' + key);
                }
              }, 'Open');
              actions.appendChild(openBtn);
            }

            const deleteBtn = h('button', { 
              className: 'btn btn-danger',
              onclick: () => {
                if (allKeys.length === 1) {
                  showToast('Cannot delete the only dataset', 'error');
                  return;
                }
                if (confirm(`Delete dataset "${key}"?\n\nThis will permanently delete all cards and data in this dataset.\n\nThis action cannot be undone!`)) {
                  localStorage.removeItem(key);
                  if (isCurrent && allKeys.length > 1) {
                    // Switch to another dataset
                    const otherKey = allKeys.find(k => k !== key);
                    localStorage.setItem('activeInstance', otherKey);
                    instanceKey = otherKey;
                    load();
                    CardSpoke_MODS.syncFromStore();
                    CardSpoke_MODS.runHook('onAppInit');
                    render();
                  }
                  overlay.remove();
                  showToast('Dataset deleted: ' + key);
                  // Reopen manager to refresh list
                  setTimeout(() => showDatasetManager(), 100);
                }
              }
            }, 'Delete');
            actions.appendChild(deleteBtn);

            datasetItem.appendChild(actions);
            datasetList.appendChild(datasetItem);
          });

          modalBody.appendChild(datasetList);
        }

        // Create new dataset section
        const createTitle = h('h3', { style: 'margin-bottom: var(--space-md);' }, 'Create New Dataset');
        modalBody.appendChild(createTitle);

        const createForm = h('div', { 
          style: `
            background: var(--bg-secondary);
            padding: var(--space-lg);
            border-radius: var(--radius);
            border: 1px solid var(--border);
          `
        });

        // Dataset name input
        const nameLabel = h('label', { 
          style: 'display: block; margin-bottom: var(--space-xs); font-weight: 600;' 
        }, 'Dataset Name');
        const nameInput = h('input', {
          type: 'text',
          id: 'newDatasetName',
          placeholder: 'My Dataset',
          style: `
            width: 100%;
            padding: var(--space-md);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            background: var(--bg-primary);
            color: var(--text-primary);
            margin-bottom: var(--space-lg);
            font-size: 1rem;
          `
        });

        // Storage type selection
        const storageLabel = h('label', { 
          style: 'display: block; margin-bottom: var(--space-xs); font-weight: 600;' 
        }, 'Storage Type');
        const storageSelect = h('select', {
          id: 'newDatasetStorage',
          style: `
            width: 100%;
            padding: var(--space-md);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            background: var(--bg-primary);
            color: var(--text-primary);
            margin-bottom: var(--space-xs);
            font-size: 1rem;
          `
        });

        const optionLocal = h('option', { value: 'localstorage' }, 'LocalStorage (Browser storage, fast access)');
        const optionIndexed = h('option', { value: 'indexeddb' }, 'IndexedDB (Browser database, larger capacity)');
        storageSelect.appendChild(optionLocal);
        storageSelect.appendChild(optionIndexed);

        const storageHelp = h('div', { 
          style: 'font-size: 0.875rem; color: var(--text-secondary); margin-bottom: var(--space-lg);' 
        }, 'LocalStorage: ~5MB limit, faster. IndexedDB: ~50MB+ limit, better for large datasets.');

        // PIN protection (future feature)
        const pinLabel = h('label', { 
          style: 'display: block; margin-bottom: var(--space-xs); font-weight: 600;' 
        }, 'PIN Protection (Optional)');
        const pinInput = h('input', {
          type: 'password',
          id: 'newDatasetPin',
          placeholder: 'Leave empty for no PIN',
          title: 'PIN encryption will be available in v0.10.3',
          style: `
            width: 100%;
            padding: var(--space-md);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            background: var(--bg-primary);
            color: var(--text-primary);
            margin-bottom: var(--space-xs);
            font-size: 1rem;
            cursor: not-allowed;
          `,
          disabled: true
        });

        const pinHelp = h('div', { 
          style: 'font-size: 0.875rem; color: var(--text-secondary); margin-bottom: var(--space-lg);' 
        }, 'PIN encryption coming in v0.10.3 - feature currently disabled for security hardening.');

        // Create button
        const createBtn = h('button', {
          className: 'btn btn-primary',
          style: 'width: 100%;',
          onclick: () => {
            let name = document.getElementById('newDatasetName').value.trim();
            const storageType = document.getElementById('newDatasetStorage').value;

            // Generate a readable default name if none provided
            if (!name) {
              const now = new Date();
              const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '_');
              const count = Object.keys(localStorage).filter(k => k.startsWith('cards_')).length + 1;
              name = 'Dataset_' + count;
            }

            // Generate a clean, short key using the name and a short timestamp
            const shortId = Date.now().toString(36).slice(-4);
            const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20);
            const newKey = 'cards_' + cleanName + '_' + shortId;

            // Store the display name and storage type in the store metadata
            const newStore = { 
              rootOrder: [], 
              cards: {}, 
              mods: {}, 
              bookmarks: [], 
              recentCards: [], 
              viewMode: 'normal', 
              activeTheme: 'light',
              metadata: {
                name: name,
                storageType: storageType,
                createdAt: Date.now()
              }
            };

            // Note: For now, we still use localStorage backend regardless of choice
            // The DatasetManager classes are in place for future enhancement
            localStorage.setItem('activeInstance', newKey);
            instanceKey = newKey;
            store = newStore;
            save();
            render();
            overlay.remove();
            showToast(`Created new dataset: ${name} (${storageType})`);
          }
        }, '+ Create Dataset');

        createForm.appendChild(nameLabel);
        createForm.appendChild(nameInput);
        createForm.appendChild(storageLabel);
        createForm.appendChild(storageSelect);
        createForm.appendChild(storageHelp);
        createForm.appendChild(pinLabel);
        createForm.appendChild(pinInput);
        createForm.appendChild(pinHelp);
        createForm.appendChild(createBtn);

        modalBody.appendChild(createForm);

        modal.appendChild(modalBody);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        overlay.onclick = (e) => {
          if (e.target === overlay) overlay.remove();
        };

        // Focus on name input
        setTimeout(() => nameInput.focus(), 100);
      }



      function showDatasetInfo() {
        const overlay = h('div', { className: 'modal-overlay show' });
        const modal = h('div', { className: 'modal' });
        const modalHeader = h('div', { className: 'modal-header' });
        modalHeader.appendChild(h('div', { className: 'modal-title' }, 'Dataset Information'));
        const closeBtn = h('button', { className: 'modal-close', onclick: () => overlay.remove() }, '✕');
        modalHeader.appendChild(closeBtn);
        modal.appendChild(modalHeader);
        const modalBody = h('div', { className: 'modal-body' });

        // Current instance/dataset info
        const currentKey = instanceKey || 'nested_cards_store';
        const currentData = localStorage.getItem(currentKey);
        
        // Calculate size
        let dataSize = 0;
        let totalSize = 0;
        let itemCount = 0;
        
        if (currentData) {
          dataSize = new Blob([currentData]).size;
        }
        
        // Count all localStorage items
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += new Blob([value]).size;
            itemCount++;
          }
        }

        // Parse store info
        let cardCount = 0;
        let modCount = 0;
        let bookmarkCount = 0;
        let recentCount = 0;
        
        if (store) {
          cardCount = Object.keys(store.cards || {}).length;
          modCount = Object.keys(store.mods || {}).length;
          bookmarkCount = (store.bookmarks || []).length;
          recentCount = (store.recentCards || []).length;
        }

        // Format bytes
        const formatBytes = (bytes) => {
          if (bytes === 0) return '0 Bytes';
          const k = 1024;
          const sizes = ['Bytes', 'KB', 'MB', 'GB'];
          const i = Math.floor(Math.log(bytes) / Math.log(k));
          return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
        };

        // Get storage type and display name from store metadata
        const displayName = (store && store.metadata && store.metadata.name) || currentKey;
        const storageType = (store && store.metadata && store.metadata.storageType) || 'localstorage';
        const storageTypeDisplay = storageType === 'indexeddb' ? 'IndexedDB' : 'LocalStorage';

        // Create info sections
        const infoHtml = `
          <div style="margin-bottom: var(--space-xl);">
            <h3 style="margin-bottom: var(--space-md); color: var(--text-primary);">Current Dataset</h3>
            <div style="background: var(--bg-secondary); padding: var(--space-lg); border-radius: var(--radius); border: 1px solid var(--border);">
              <div style="margin-bottom: var(--space-sm);"><strong>Name:</strong> ${displayName}</div>
              <div style="margin-bottom: var(--space-sm);"><strong>Storage Type:</strong> ${storageTypeDisplay}</div>
              <div style="margin-bottom: var(--space-sm);"><strong>Size:</strong> ${formatBytes(dataSize)}</div>
              <div style="margin-bottom: var(--space-sm);"><strong>PIN Protected:</strong> No</div>
            </div>
          </div>

          <div style="margin-bottom: var(--space-xl);">
            <h3 style="margin-bottom: var(--space-md); color: var(--text-primary);">Dataset Contents</h3>
            <div style="background: var(--bg-secondary); padding: var(--space-lg); border-radius: var(--radius); border: 1px solid var(--border);">
              <div style="margin-bottom: var(--space-sm);"><strong>Cards:</strong> ${cardCount}</div>
              <div style="margin-bottom: var(--space-sm);"><strong>Extensions:</strong> ${modCount}</div>
              <div style="margin-bottom: var(--space-sm);"><strong>Bookmarks:</strong> ${bookmarkCount}</div>
              <div style="margin-bottom: var(--space-sm);"><strong>Recent Cards:</strong> ${recentCount}</div>
            </div>
          </div>

          <div style="margin-bottom: var(--space-xl);">
            <h3 style="margin-bottom: var(--space-md); color: var(--text-primary);">Storage Overview</h3>
            <div style="background: var(--bg-secondary); padding: var(--space-lg); border-radius: var(--radius); border: 1px solid var(--border);">
              <div style="margin-bottom: var(--space-sm);"><strong>Total LocalStorage:</strong> ${formatBytes(totalSize)}</div>
              <div style="margin-bottom: var(--space-sm);"><strong>Total Items:</strong> ${itemCount}</div>
              <div style="margin-bottom: var(--space-sm);"><strong>Quota Used:</strong> ~${Math.round((totalSize / (5 * 1024 * 1024)) * 100)}% (typical 5MB limit)</div>
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: var(--space-md); color: var(--text-primary);">Quick Actions</h3>
            <div style="display: flex; gap: var(--space-md); flex-wrap: wrap;">
              <button id="exportDataBtn" class="btn btn-primary">Export Dataset</button>
              <button id="switchInstanceBtn" class="btn btn-secondary">Switch Dataset</button>
            </div>
          </div>
        `;

        modalBody.innerHTML = infoHtml;
        modal.appendChild(modalBody);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Add event listeners for quick actions
        document.getElementById('exportDataBtn').onclick = () => {
          overlay.remove();
          handleExport('instance-json');
        };

        document.getElementById('switchInstanceBtn').onclick = () => {
          overlay.remove();
          showDatasetManager();
        };

        overlay.onclick = (e) => {
          if (e.target === overlay) overlay.remove();
        };
      }


      /**
       * Show Extensions Hub - unified interface for extensions management (v0.12.3)
       * Combines Extensions, Extensions Store, Extension Wizard, and Playground
       */
      function showExtensionsHub(initialTab = 'installed') {
        const overlay = h('div', { className: 'modal-overlay show' });
        const modal = h('div', { className: 'modal', style: 'max-width: 900px; max-height: 90vh;' });
        const modalHeader = h('div', { className: 'modal-header' });
        modalHeader.appendChild(h('div', { className: 'modal-title' }, 'Extensions Hub'));
        const closeBtn = h('button', { className: 'modal-close', onclick: () => overlay.remove(), 'aria-label': 'Close' }, '✕');
        modalHeader.appendChild(closeBtn);
        modal.appendChild(modalHeader);
        
        // Tabs for different sections
        const tabContainer = h('div', { className: 'modal-tabs', role: 'tablist' });
        const tabs = [
          { id: 'installed', label: 'Installed', ariaLabel: 'View installed extensions' },
          { id: 'store', label: 'Store', ariaLabel: 'Browse extensions store' },
          { id: 'wizard', label: 'Wizard', ariaLabel: 'Create new extension' },
          { id: 'playground', label: 'Playground', ariaLabel: 'Test extension code' }
        ];
        
        let activeTab = initialTab;
        
        function renderTabContent() {
          const existingBody = modal.querySelector('.modal-body');
          if (existingBody) existingBody.remove();
          
          const modalBody = h('div', { className: 'modal-body', style: 'max-height: calc(90vh - 150px); overflow-y: auto;' });
          
          switch (activeTab) {
            case 'installed':
              renderInstalledTab(modalBody);
              break;
            case 'store':
              renderStoreTab(modalBody);
              break;
            case 'wizard':
              renderWizardTab(modalBody, overlay);
              break;
            case 'playground':
              renderPlaygroundTab(modalBody);
              break;
          }
          
          modal.appendChild(modalBody);
        }
        
        function renderInstalledTab(container) {
          const mods = Object.entries(store.mods || {});
          
          if (mods.length === 0) {
            container.appendChild(h('div', { className: 'empty', style: 'padding: var(--space-2xl);' }, 
              'No extensions installed. Browse the Store or create one with the Wizard!'));
            return;
          }
          
          const devMode = isDeveloperMode();
          
          mods.forEach(function([modId, modData]) {
            const modItem = h('div', {
              style: 'background: var(--bg-secondary); padding: var(--space-lg); border-radius: var(--radius); border: 1px solid var(--border); margin-bottom: var(--space-md);'
            });
            
            const modHeader = h('div', { style: 'display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-sm);' });
            const modInfo = h('div', {});
            modInfo.appendChild(h('div', { style: 'font-weight: 700; font-size: var(--text-lg);' }, modData.meta?.name || modId));
            modInfo.appendChild(h('div', { style: 'color: var(--text-muted); font-size: var(--text-sm);' }, 
              'v' + (modData.meta?.version || '1.0.0') + ' by ' + (modData.meta?.creator || 'Unknown')));
            modHeader.appendChild(modInfo);
            
            const toggleBtn = h('button', {
              className: modData.enabled ? 'btn btn-primary' : 'btn',
              onclick: function() {
                if (modData.enabled) CardSpoke_MODS.disable(modId);
                else CardSpoke_MODS.enable(modId);
                overlay.remove();
                showExtensionsHub('installed');
              }
            }, modData.enabled ? 'Enabled ✓' : 'Disabled');
            modHeader.appendChild(toggleBtn);
            
            modItem.appendChild(modHeader);
            
            if (modData.meta?.description) {
              modItem.appendChild(h('div', { style: 'margin-bottom: var(--space-sm);' }, modData.meta.description));
            }
            
            // Actions row
            const actionsRow = h('div', { style: 'display: flex; gap: var(--space-sm);' });
            
            if (devMode) {
              const exportBtn = h('button', {
                className: 'btn',
                style: 'font-size: var(--text-sm);',
                onclick: function() {
                  const blob = new Blob([JSON.stringify(modData, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = h('a', { href: url, download: modId + '.json' });
                  a.click();
                  URL.revokeObjectURL(url);
                  showToast('Extension exported');
                }
              }, 'Export');
              actionsRow.appendChild(exportBtn);
            }
            
            const deleteBtn = h('button', {
              className: 'btn btn-danger',
              style: 'font-size: var(--text-sm);',
              onclick: function() {
                if (confirm('Delete extension "' + (modData.meta?.name || modId) + '"?')) {
                  CardSpoke_MODS.disable(modId);
                  delete store.mods[modId];
                  save();
                  showToast('Extension deleted');
                  overlay.remove();
                  showExtensionsHub('installed');
                }
              }
            }, 'Delete');
            actionsRow.appendChild(deleteBtn);
            
            modItem.appendChild(actionsRow);
            container.appendChild(modItem);
          });
          
          // Upload Extension button
          const uploadSection = h('div', { style: 'margin-top: var(--space-xl); padding-top: var(--space-xl); border-top: 1px solid var(--border);' });
          uploadSection.appendChild(h('div', { style: 'font-weight: 700; margin-bottom: var(--space-md);' }, 'Install Extension'));
          
          const uploadArea = h('div', { 
            className: 'file-upload-area',
            style: 'padding: var(--space-xl);',
            onclick: function() {
              const input = h('input', { type: 'file', accept: '.json', style: 'display:none' });
              input.onchange = function(e) {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = function(ev) {
                    try {
                      const modData = JSON.parse(ev.target.result);
                      const modId = modData.id || file.name.replace('.json', '');
                      store.mods[modId] = modData;
                      save();
                      CardSpoke_MODS.syncFromStore();
                      showToast('Extension installed: ' + (modData.meta?.name || modId));
                      overlay.remove();
                      showExtensionsHub('installed');
                    } catch (err) {
                      showToast('Invalid extension file', 'error');
                    }
                  };
                  reader.readAsText(file);
                }
              };
              input.click();
            }
          });
          uploadArea.appendChild(h('div', { className: 'upload-text' }, 'Click to install extension (.json)'));
          uploadSection.appendChild(uploadArea);
          container.appendChild(uploadSection);
        }
        
        function renderStoreTab(container) {
          const banner = h('div', {
            style: 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: var(--space-2xl); border-radius: var(--radius); margin-bottom: var(--space-xl); text-align: center;'
          });
          banner.appendChild(h('div', { style: 'font-size: 48px; margin-bottom: var(--space-md);' }, ''));
          banner.appendChild(h('div', { style: 'font-size: var(--text-xl); font-weight: 700; margin-bottom: var(--space-sm);' }, 'Extensions Store'));
          banner.appendChild(h('div', { style: 'opacity: 0.9;' }, 'Coming Soon! Browse and install community extensions.'));
          container.appendChild(banner);
          
          const categories = [
            { icon: '', name: 'Themes', desc: 'Visual styles and color schemes' },
            { icon: '', name: 'Tools', desc: 'Productivity enhancements' },
            { icon: '', name: 'Analytics', desc: 'Data visualization' },
            { icon: '', name: 'Integrations', desc: 'External services' }
          ];
          
          const grid = h('div', { style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-lg);' });
          categories.forEach(function(cat) {
            const card = h('div', {
              style: 'padding: var(--space-lg); border: 1px solid var(--border); border-radius: var(--radius); text-align: center;'
            });
            card.appendChild(h('div', { style: 'font-size: 32px; margin-bottom: var(--space-sm);' }, cat.icon));
            card.appendChild(h('div', { style: 'font-weight: 700;' }, cat.name));
            card.appendChild(h('div', { style: 'font-size: var(--text-sm); color: var(--text-muted);' }, cat.desc));
            grid.appendChild(card);
          });
          container.appendChild(grid);
        }
        
        function renderWizardTab(container, overlayRef) {
          container.appendChild(h('div', { style: 'font-weight: 700; font-size: var(--text-lg); margin-bottom: var(--space-lg);' }, 
            'Create New Extension'));
          
          const form = h('form', { 
            style: 'display: flex; flex-direction: column; gap: var(--space-lg);',
            onsubmit: function(e) {
              e.preventDefault();
              const formData = new FormData(e.target);
              const modId = formData.get('name').toLowerCase().replace(/[^a-z0-9-]/g, '-');
              const newMod = {
                id: modId,
                meta: {
                  name: formData.get('name'),
                  type: formData.get('type'),
                  creator: formData.get('creator'),
                  version: '1.0.0',
                  releaseDate: new Date().toISOString().split('T')[0],
                  description: formData.get('description')
                },
                js: formData.get('js') || '',
                css: formData.get('css') || '',
                enabled: false
              };
              store.mods[modId] = newMod;
              save();
              showToast('Extension created: ' + newMod.meta.name);
              overlayRef.remove();
              showExtensionsHub('installed');
            }
          });
          
          form.appendChild(createFormGroup('Name', 'text', 'name', 'My Extension', true));
          form.appendChild(createFormGroup('Creator', 'text', 'creator', 'Your Name', true));
          form.appendChild(createFormGroup('Description', 'text', 'description', 'A brief description'));
          
          const typeGroup = h('div', { className: 'form-group' });
          typeGroup.appendChild(h('label', { className: 'form-label' }, 'Type'));
          const typeSelect = h('select', { className: 'form-select', name: 'type' });
          ['Theme', 'Patch', 'Plugin', 'Mod'].forEach(function(t) {
            typeSelect.appendChild(h('option', { value: t }, t));
          });
          typeGroup.appendChild(typeSelect);
          form.appendChild(typeGroup);
          
          const jsGroup = h('div', { className: 'form-group' });
          jsGroup.appendChild(h('label', { className: 'form-label' }, 'JavaScript (optional)'));
          jsGroup.appendChild(h('textarea', { 
            className: 'form-textarea', 
            name: 'js', 
            placeholder: "CardSpoke_MODS.register('my-mod', { onAppInit(ctx) { console.log('Hello!'); } });",
            style: 'min-height: 100px; font-family: monospace;'
          }));
          form.appendChild(jsGroup);
          
          const cssGroup = h('div', { className: 'form-group' });
          cssGroup.appendChild(h('label', { className: 'form-label' }, 'CSS (optional)'));
          cssGroup.appendChild(h('textarea', { 
            className: 'form-textarea', 
            name: 'css', 
            placeholder: '/* Custom styles */',
            style: 'min-height: 80px; font-family: monospace;'
          }));
          form.appendChild(cssGroup);
          
          form.appendChild(h('button', { type: 'submit', className: 'btn btn-primary' }, 'Create Extension'));
          container.appendChild(form);
        }
        
        function createFormGroup(label, type, name, placeholder, required) {
          const group = h('div', { className: 'form-group' });
          group.appendChild(h('label', { className: 'form-label' }, label));
          group.appendChild(h('input', { 
            type: type, 
            className: 'form-input', 
            name: name, 
            placeholder: placeholder,
            required: required || false
          }));
          return group;
        }
        
        function renderPlaygroundTab(container) {
          container.appendChild(h('div', { style: 'font-weight: 700; font-size: var(--text-lg); margin-bottom: var(--space-md);' }, 
            'Code Playground'));
          container.appendChild(h('div', { style: 'color: var(--text-muted); margin-bottom: var(--space-lg);' }, 
            'Test CardSpoke API code in a sandboxed environment.'));
          
          const codeArea = h('textarea', {
            className: 'form-textarea',
            style: 'min-height: 200px; font-family: monospace; font-size: var(--text-sm);',
            placeholder: "// Example: Use CardSpoke.utils API\nconst meta = await CardSpoke.utils.getDatasetMeta();\nconsole.log('Dataset:', meta.name);\n\n// Search cards\nconst results = await CardSpoke.utils.searchCards('test');\nconsole.log('Found:', results.length, 'cards');",
            id: 'playgroundCode'
          });
          container.appendChild(codeArea);
          
          const outputArea = h('pre', {
            style: 'background: #1e1e1e; color: #d4d4d4; padding: var(--space-lg); border-radius: var(--radius); min-height: 100px; margin-top: var(--space-lg); overflow: auto; font-family: monospace; font-size: var(--text-sm);',
            id: 'playgroundOutput'
          }, '// Output will appear here');
          container.appendChild(outputArea);
          
          const btnRow = h('div', { style: 'display: flex; gap: var(--space-md); margin-top: var(--space-lg);' });
          
          const runBtn = h('button', {
            className: 'btn btn-primary',
            onclick: function() {
              const code = document.getElementById('playgroundCode').value;
              const output = document.getElementById('playgroundOutput');
              output.textContent = '';
              
              const sandboxConsole = {
                log: function() { output.textContent += Array.from(arguments).join(' ') + '\n'; },
                error: function() { output.textContent += '[ERROR] ' + Array.from(arguments).join(' ') + '\n'; },
                warn: function() { output.textContent += '[WARN] ' + Array.from(arguments).join(' ') + '\n'; }
              };
              
              try {
                const fn = new Function('console', 'CardSpoke', 'return (async () => {' + code + '})();');
                fn(sandboxConsole, window.CardSpoke).then(function() {
                  output.textContent += '\n[OK] Code executed successfully';
                }).catch(function(err) {
                  output.textContent += '\n[ERROR] Error: ' + err.message;
                });
              } catch (err) {
                output.textContent = '[ERROR] Syntax Error: ' + err.message;
              }
            }
          }, 'Run Code');
          btnRow.appendChild(runBtn);
          
          const clearBtn = h('button', {
            className: 'btn',
            onclick: function() {
              document.getElementById('playgroundCode').value = '';
              document.getElementById('playgroundOutput').textContent = '// Output will appear here';
            }
          }, 'Clear');
          btnRow.appendChild(clearBtn);
          
          container.appendChild(btnRow);
        }
        
        // Create tabs
        tabs.forEach(function(tab) {
          const tabBtn = h('button', {
            className: 'modal-tab' + (activeTab === tab.id ? ' active' : ''),
            'data-tab': tab.id,
            role: 'tab',
            'aria-selected': (activeTab === tab.id).toString(),
            'aria-label': tab.ariaLabel,
            onclick: function() {
              activeTab = tab.id;
              // Update tab styles
              tabContainer.querySelectorAll('.modal-tab').forEach(function(t) {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
              });
              this.classList.add('active');
              this.setAttribute('aria-selected', 'true');
              renderTabContent();
            }
          }, tab.label);
          tabContainer.appendChild(tabBtn);
        });
        
        modal.appendChild(tabContainer);
        renderTabContent();
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        trapFocus(modal);
        
        overlay.onclick = function(e) {
          if (e.target === overlay) overlay.remove();
        };
      }



      /**
       * Show Data Hub - unified interface for dataset and export management (v0.12.3)
       * Combines Dataset Manager, Dataset Info, and all export options
       */
      function showDataHub() {
        const overlay = h('div', { className: 'modal-overlay show' });
        const modal = h('div', { className: 'modal', style: 'max-width: 700px; max-height: 90vh;' });
        const modalHeader = h('div', { className: 'modal-header' });
        modalHeader.appendChild(h('div', { className: 'modal-title' }, 'Data & Export'));
        const closeBtn = h('button', { className: 'modal-close', onclick: () => overlay.remove(), 'aria-label': 'Close' }, '✕');
        modalHeader.appendChild(closeBtn);
        modal.appendChild(modalHeader);
        
        const modalBody = h('div', { className: 'modal-body', style: 'max-height: calc(90vh - 100px); overflow-y: auto;' });
        
        // Dataset Info Section
        const infoSection = h('div', { style: 'margin-bottom: var(--space-2xl); padding-bottom: var(--space-xl); border-bottom: 1px solid var(--border);' });
        infoSection.appendChild(h('div', { 
          style: 'font-weight: 700; margin-bottom: var(--space-lg); font-size: var(--text-lg);'
        }, 'Dataset Info'));
        
        // Dataset name with rename capability (v0.12.3 fix)
        const currentDatasetName = ((store.metadata && store.metadata.name) || instanceKey || 'Default').trim();
        const nameRow = h('div', { 
          style: 'display: flex; align-items: center; gap: var(--space-md); margin-bottom: var(--space-lg); background: var(--bg-secondary); padding: var(--space-md); border-radius: var(--radius); border: 1px solid var(--border);'
        });
        nameRow.appendChild(h('label', { 
          style: 'font-weight: 600; min-width: 80px;'
        }, 'Name:'));
        const nameInput = h('input', {
          type: 'text',
          value: currentDatasetName,
          id: 'datasetNameInput',
          style: 'flex: 1; padding: var(--space-sm); border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg-primary); color: var(--text-primary);'
        });
        nameRow.appendChild(nameInput);
        const saveNameBtn = h('button', {
          className: 'btn btn-primary',
          onclick: function() {
            const newName = nameInput.value.trim();
            if (newName && newName !== currentDatasetName.trim()) {
              if (!store.metadata) store.metadata = {};
              store.metadata.name = newName;
              store.metadata.updatedAt = Date.now();
              save();
              showToast('Dataset renamed to: ' + newName);
            }
          }
        }, 'Save');
        nameRow.appendChild(saveNameBtn);
        infoSection.appendChild(nameRow);
        
        const cardCount = Object.keys(store.cards || {}).length;
        const tagCount = getAllTags().length;
        const modCount = Object.keys(store.mods || {}).length;
        const bookmarkCount = (store.bookmarks || []).length;
        
        const statsGrid = h('div', { style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: var(--space-md); margin-bottom: var(--space-lg);' });
        
        const stats = [
          { label: 'Cards', value: cardCount, icon: '' },
          { label: 'Tags', value: tagCount, icon: '' },
          { label: 'Extensions', value: modCount, icon: '' },
          { label: 'Bookmarks', value: bookmarkCount, icon: '' }
        ];
        
        stats.forEach(function(stat) {
          const statCard = h('div', {
            style: 'background: var(--bg-secondary); padding: var(--space-lg); border-radius: var(--radius); text-align: center; border: 1px solid var(--border);'
          });
          statCard.appendChild(h('div', { style: 'font-size: 24px; margin-bottom: var(--space-xs);' }, stat.icon));
          statCard.appendChild(h('div', { style: 'font-size: var(--text-2xl); font-weight: 700;' }, String(stat.value)));
          statCard.appendChild(h('div', { style: 'color: var(--text-muted); font-size: var(--text-sm);' }, stat.label));
          statsGrid.appendChild(statCard);
        });
        
        infoSection.appendChild(statsGrid);
        
        // Storage info
        const storageInfo = h('div', { style: 'font-size: var(--text-sm); color: var(--text-muted);' });
        try {
          const key = instanceKey || 'nested_cards_store';
          const storeSize = JSON.stringify(store).length;
          storageInfo.textContent = 'Storage: ~' + Math.round(storeSize / 1024) + ' KB used';
        } catch(e) {
          storageInfo.textContent = 'Storage: Unable to calculate';
        }
        infoSection.appendChild(storageInfo);
        
        modalBody.appendChild(infoSection);
        
        // Export Section
        const exportSection = h('div', { style: 'margin-bottom: var(--space-2xl); padding-bottom: var(--space-xl); border-bottom: 1px solid var(--border);' });
        exportSection.appendChild(h('div', { 
          style: 'font-weight: 700; margin-bottom: var(--space-lg); font-size: var(--text-lg);'
        }, 'Export Data'));
        
        const exportOptions = [
          { id: 'json', label: 'Full Backup (JSON)', desc: 'Complete dataset with all cards and settings', icon: '' },
          { id: 'txt', label: 'Cards as Text', desc: 'Plain text format for reading', icon: '' },
          { id: 'markdown', label: 'Cards as Markdown', desc: 'Formatted markdown with headers and tags', icon: '' },
          { id: 'csv', label: 'Cards as CSV', desc: 'Spreadsheet format for analysis', icon: '' },
          { id: 'mods', label: 'Extensions Only', desc: 'Export all installed extensions', icon: '' }
        ];
        
        exportOptions.forEach(function(opt) {
          const exportBtn = h('button', {
            className: 'btn',
            style: 'width: 100%; text-align: left; padding: var(--space-lg); margin-bottom: var(--space-sm); border: 1px solid var(--border); border-radius: var(--radius); display: flex; align-items: center; gap: var(--space-md);',
            onclick: function() {
              switch (opt.id) {
                case 'json':
                  downloadWithFeedback(JSON.stringify(store, null, 2), 'cardspoke-backup-' + Date.now() + '.json', 'application/json');
                  break;
                case 'txt':
                  const txtContent = Object.values(store.cards || {}).map(function(c) {
                    return '=== ' + (c.title || '(Untitled)') + ' ===\n' + (c.body || '');
                  }).join('\n\n');
                  downloadWithFeedback(txtContent, 'cardspoke-cards-' + Date.now() + '.txt', 'text/plain');
                  break;
                case 'markdown':
                  const mdContent = Object.values(store.cards || {}).map(function(c) {
                    var md = '# ' + (c.title || '(Untitled)') + '\n';
                    if (c.tags && c.tags.length) md += 'Tags: ' + c.tags.map(function(t) { return '#' + t; }).join(' ') + '\n';
                    md += '\n' + (c.body || '');
                    return md;
                  }).join('\n\n---\n\n');
                  downloadWithFeedback(mdContent, 'cardspoke-cards-' + Date.now() + '.md', 'text/markdown');
                  break;
                case 'csv':
                  var csvContent = 'ID,Title,Body,Tags,Parent\n';
                  Object.values(store.cards || {}).forEach(function(c) {
                    csvContent += '"' + c.id + '","' + (c.title || '').replace(/"/g, '""') + '","' + (c.body || '').replace(/"/g, '""') + '","' + (c.tags || []).join(';') + '","' + (c.parentId || '') + '"\n';
                  });
                  downloadWithFeedback(csvContent, 'cardspoke-cards-' + Date.now() + '.csv', 'text/csv');
                  break;
                case 'mods':
                  downloadWithFeedback(JSON.stringify(store.mods || {}, null, 2), 'cardspoke-extensions-' + Date.now() + '.json', 'application/json');
                  break;
              }
              showToast('Export complete: ' + opt.label);
            }
          });
          exportBtn.appendChild(h('span', { style: 'font-size: 20px;' }, opt.icon));
          const textDiv = h('div', {});
          textDiv.appendChild(h('div', { style: 'font-weight: 600;' }, opt.label));
          textDiv.appendChild(h('div', { style: 'font-size: var(--text-sm); color: var(--text-muted);' }, opt.desc));
          exportBtn.appendChild(textDiv);
          exportSection.appendChild(exportBtn);
        });
        
        modalBody.appendChild(exportSection);
        
        // Dataset Management Section
        const manageSection = h('div', {});
        manageSection.appendChild(h('div', { 
          style: 'font-weight: 700; margin-bottom: var(--space-lg); font-size: var(--text-lg);'
        }, 'Dataset Management'));
        
        const renameBtn = h('button', {
          className: 'btn',
          style: 'margin-right: var(--space-md);',
          onclick: function() {
            editDatasetName();
            overlay.remove();
          }
        }, 'Rename Dataset');
        manageSection.appendChild(renameBtn);
        
        modalBody.appendChild(manageSection);
        
        modal.appendChild(modalBody);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        trapFocus(modal);
        
        overlay.onclick = function(e) {
          if (e.target === overlay) overlay.remove();
        };
      }

      function showModsManager() {
        const overlay = h('div', { className: 'modal-overlay show' });
        const modal = h('div', { className: 'modal' });
        const modalHeader = h('div', { className: 'modal-header' });
        modalHeader.appendChild(h('div', { className: 'modal-title' }, 'Extension Manager'));
        const closeBtn = h('button', { className: 'modal-close', onclick: () => overlay.remove() }, '✕');
        modalHeader.appendChild(closeBtn);
        modal.appendChild(modalHeader);
        const modalBody = h('div', { className: 'modal-body' });
        
        const modList = Object.entries(store.mods).map(([modId, modData]) => {
          const meta = modData.meta || {};
          const modItem = h('div', { style: 'padding: var(--space-lg); border: 1px solid var(--border); margin-bottom: var(--space-md);' });
          const modHeader = h('div', { style: 'display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-sm);' });
          const headerLeft = h('div', { style: 'display: flex; align-items: center; gap: var(--space-sm);' });
          headerLeft.appendChild(h('div', { style: 'font-weight: 700;' }, meta.name || modId));
          // Add type badge if type is specified
          if (meta.type) {
            const badgeClass = 'ext-badge ext-' + (meta.type.toLowerCase());
            const badge = h('span', { className: badgeClass }, meta.type);
            headerLeft.appendChild(badge);
          }
          // Add official/community source badge (v0.12.2)
          if (meta.source) {
            const sourceBadge = h('span', { 
              className: 'ext-badge ext-badge-' + (meta.source === 'official' ? 'official' : 'community')
            }, meta.source === 'official' ? '✓ Official' : 'Community');
            headerLeft.appendChild(sourceBadge);
          }
          modHeader.appendChild(headerLeft);
          const toggleBtn = h('button', {
            className: modData.enabled ? 'btn btn-danger' : 'btn btn-primary',
            onclick: () => {
              if (modData.enabled) CardSpoke_MODS.disable(modId);
              else CardSpoke_MODS.enable(modId);
              overlay.remove();
              showModsManager();
            }
          }, modData.enabled ? 'Disable' : 'Enable');
          modHeader.appendChild(toggleBtn);
          modItem.appendChild(modHeader);
          
          // *** ADDED: Display new mod metadata ***
          if (meta.version) {
            modItem.appendChild(h('div', { style: 'color: var(--text-muted); font-size: var(--text-sm);' }, `Version: ${meta.version}`));
          }
          if (meta.creator) {
            modItem.appendChild(h('div', { style: 'color: var(--text-muted); font-size: var(--text-sm);' }, `By: ${meta.creator}`));
          }
           if (meta.releaseDate) {
            modItem.appendChild(h('div', { style: 'color: var(--text-muted); font-size: var(--text-sm);' }, `Date: ${meta.releaseDate}`));
          }
          if (meta.description) {
            modItem.appendChild(h('div', { style: 'color: var(--text-muted); font-size: var(--text-sm); margin-top: var(--space-sm);' }, meta.description));
          }
          // Show AI assistants if specified (v0.12.2)
          if (meta.ai_assistants) {
            modItem.appendChild(h('div', { style: 'color: var(--text-muted); font-size: var(--text-sm); font-style: italic;' }, 
              'AI: ' + meta.ai_assistants));
          }
          
          const deleteBtn = h('button', {
            className: 'btn btn-danger',
            style: 'font-size: var(--text-sm); margin-top: var(--space-md);',
            onclick: () => {
              if (confirm(`Delete extension "${meta.name || modId}"?`)) {
                CardSpoke_MODS.disable(modId);
                delete store.mods[modId];
                save();
                overlay.remove();
                showModsManager();
              }
            }
          }, 'Delete');
          modItem.appendChild(deleteBtn);
          return modItem;
        });
        
        if (modList.length === 0) {
          modalBody.appendChild(h('div', { className: 'empty' }, 'No extensions installed'));
        } else {
          modList.forEach(item => modalBody.appendChild(item));
        }
        modal.appendChild(modalBody);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
      }


      /**
       * Show Extension Wizard
       * Interactive wizard for creating new extensions
       */
      function showExtensionWizard() {
        const overlay = h('div', { className: 'modal-overlay show' });
        const modal = h('div', { className: 'modal', style: 'max-width: 700px;' });
        const modalHeader = h('div', { className: 'modal-header' });
        modalHeader.appendChild(h('div', { className: 'modal-title' }, 'Extension Wizard'));
        const closeBtn = h('button', { className: 'modal-close', onclick: () => overlay.remove() }, '✕');
        modalHeader.appendChild(closeBtn);
        modal.appendChild(modalHeader);
        
        const modalBody = h('div', { className: 'modal-body' });
        
        // Introduction
        modalBody.appendChild(h('div', { style: 'margin-bottom: var(--space-xl); font-size: var(--text-base);' }, 
          'Create a new extension using our guided wizard. Choose a type, configure metadata, and get started with a working template.'));
        
        // Step 1: Extension Type Selection
        const typeSection = h('div', { style: 'margin-bottom: var(--space-xl);' });
        typeSection.appendChild(h('div', { 
          style: 'font-weight: 700; margin-bottom: var(--space-md); font-size: var(--text-lg);'
        }, 'Step 1: Choose Extension Type'));
        
        const types = [
          { value: 'theme', label: 'Theme', desc: 'Custom CSS styling for CardSpoke UI', icon: '' },
          { value: 'patch', label: 'Patch', desc: 'Small modifications or enhancements', icon: '' },
          { value: 'plugin', label: 'Plugin', desc: 'Add new functionality with JavaScript hooks', icon: '' },
          { value: 'mod', label: 'Mod', desc: 'Comprehensive modifications (CSS + JS)', icon: '' },
          { value: 'kit', label: 'Kit', desc: 'Bundle of related extensions (themes + plugins)', icon: '' },
          { value: 'expansion', label: 'Expansion', desc: 'Major feature additions and overhauls', icon: '' }
        ];
        
        let selectedType = 'plugin';
        const typeButtons = [];
        
        types.forEach(type => {
          const btn = h('button', {
            className: 'wizard-type-btn',
            style: `
              display: block;
              width: 100%;
              padding: var(--space-lg);
              margin-bottom: var(--space-sm);
              border: 2px solid var(--border);
              background: var(--bg-primary);
              text-align: left;
              cursor: pointer;
              border-radius: 4px;
              transition: all 0.2s;
            `,
            onclick: () => {
              selectedType = type.value;
              typeButtons.forEach(b => b.style.borderColor = 'var(--border)');
              btn.style.borderColor = 'var(--primary)';
            }
          });
          
          const header = h('div', { style: 'display: flex; align-items: center; gap: var(--space-sm); margin-bottom: var(--space-xs);' });
          header.appendChild(h('span', { style: 'font-size: 24px;' }, type.icon));
          header.appendChild(h('span', { style: 'font-weight: 600; font-size: var(--text-lg);' }, type.label));
          btn.appendChild(header);
          btn.appendChild(h('div', { style: 'color: var(--text-muted); font-size: var(--text-sm); margin-left: 32px;' }, type.desc));
          
          if (type.value === selectedType) {
            btn.style.borderColor = 'var(--primary)';
          }
          
          typeButtons.push(btn);
          typeSection.appendChild(btn);
        });
        
        modalBody.appendChild(typeSection);
        
        // Step 2: Extension Metadata
        const metaSection = h('div', { style: 'margin-bottom: var(--space-xl);' });
        metaSection.appendChild(h('div', { 
          style: 'font-weight: 700; margin-bottom: var(--space-md); font-size: var(--text-lg);'
        }, 'Step 2: Extension Details'));
        
        const form = h('div', { style: 'display: flex; flex-direction: column; gap: var(--space-lg);' });
        
        // Extension Name
        const nameGroup = h('div', {});
        nameGroup.appendChild(h('label', { style: 'display: block; margin-bottom: var(--space-xs); font-weight: 600;' }, 'Extension Name *'));
        const nameInput = h('input', {
          type: 'text',
          placeholder: 'My Awesome Extension',
          style: `
            width: 100%;
            padding: var(--space-md);
            border: 1px solid var(--border);
            border-radius: 4px;
            background: var(--bg-primary);
            color: var(--text-primary);
            font-size: 1rem;
          `
        });
        nameGroup.appendChild(nameInput);
        form.appendChild(nameGroup);
        
        // Extension ID
        const idGroup = h('div', {});
        idGroup.appendChild(h('label', { style: 'display: block; margin-bottom: var(--space-xs); font-weight: 600;' }, 'Extension ID *'));
        idGroup.appendChild(h('div', { style: 'font-size: var(--text-sm); color: var(--text-muted); margin-bottom: var(--space-xs);' }, 
          'Unique identifier (lowercase, no spaces, e.g., "my-extension")'));
        const idInput = h('input', {
          type: 'text',
          placeholder: 'my-extension',
          style: `
            width: 100%;
            padding: var(--space-md);
            border: 1px solid var(--border);
            border-radius: 4px;
            background: var(--bg-primary);
            color: var(--text-primary);
            font-size: 1rem;
          `
        });
        idGroup.appendChild(idInput);
        form.appendChild(idGroup);
        
        // Creator Name
        const creatorGroup = h('div', {});
        creatorGroup.appendChild(h('label', { style: 'display: block; margin-bottom: var(--space-xs); font-weight: 600;' }, 'Your Name'));
        const creatorInput = h('input', {
          type: 'text',
          placeholder: 'Your Name',
          style: `
            width: 100%;
            padding: var(--space-md);
            border: 1px solid var(--border);
            border-radius: 4px;
            background: var(--bg-primary);
            color: var(--text-primary);
            font-size: 1rem;
          `
        });
        creatorGroup.appendChild(creatorInput);
        form.appendChild(creatorGroup);
        
        // Description
        const descGroup = h('div', {});
        descGroup.appendChild(h('label', { style: 'display: block; margin-bottom: var(--space-xs); font-weight: 600;' }, 'Description'));
        const descInput = h('textarea', {
          placeholder: 'Brief description of what your extension does...',
          rows: 3,
          style: `
            width: 100%;
            padding: var(--space-md);
            border: 1px solid var(--border);
            border-radius: 4px;
            background: var(--bg-primary);
            color: var(--text-primary);
            font-size: 1rem;
            resize: vertical;
          `
        });
        descGroup.appendChild(descInput);
        form.appendChild(descGroup);
        
        // AI Assistants Field (v0.12.2 - Spec Compliance §2.5)
        const aiGroup = h('div', {});
        aiGroup.appendChild(h('label', { style: 'display: block; margin-bottom: var(--space-xs); font-weight: 600;' }, 'AI Assistants Used (Optional)'));
        aiGroup.appendChild(h('div', { style: 'font-size: var(--text-sm); color: var(--text-muted); margin-bottom: var(--space-xs);' }, 
          'List any AI tools used to create this extension (e.g., "GitHub Copilot, ChatGPT")'));
        const aiInput = h('input', {
          type: 'text',
          placeholder: 'e.g., GitHub Copilot, ChatGPT',
          style: `
            width: 100%;
            padding: var(--space-md);
            border: 1px solid var(--border);
            border-radius: 4px;
            background: var(--bg-primary);
            color: var(--text-primary);
            font-size: 1rem;
          `
        });
        aiGroup.appendChild(aiInput);
        form.appendChild(aiGroup);
        
        // Official/Community Toggle (v0.12.2 - Spec Compliance §2.5)
        const sourceGroup = h('div', { style: 'margin-top: var(--space-md);' });
        const sourceLabel = h('label', { 
          style: 'display: flex; align-items: center; gap: var(--space-sm); cursor: pointer;'
        });
        const sourceCheck = h('input', { type: 'checkbox' });
        sourceLabel.appendChild(sourceCheck);
        sourceLabel.appendChild(document.createTextNode('This is an official CardSpoke extension'));
        sourceGroup.appendChild(sourceLabel);
        sourceGroup.appendChild(h('div', { style: 'font-size: var(--text-sm); color: var(--text-muted); margin-left: 24px;' }, 
          'Check if this extension is from the CardSpoke team (leave unchecked for community extensions)'));
        form.appendChild(sourceGroup);
        
        metaSection.appendChild(form);
        modalBody.appendChild(metaSection);
        
        // Action Buttons
        const actions = h('div', { style: 'display: flex; gap: var(--space-md); justify-content: flex-end; margin-top: var(--space-xl);' });
        
        const cancelBtn = h('button', {
          className: 'btn',
          onclick: () => overlay.remove()
        }, 'Cancel');
        
        const generateBtn = h('button', {
          className: 'btn btn-primary',
          onclick: () => {
            const name = nameInput.value.trim();
            const id = idInput.value.trim();
            const creator = creatorInput.value.trim() || 'Anonymous';
            const description = descInput.value.trim();
            const aiAssistants = aiInput.value.trim();
            const isOfficial = sourceCheck.checked;
            
            if (!name) {
              showToast('Please enter an extension name', 'error');
              return;
            }
            if (!id) {
              showToast('Please enter an extension ID', 'error');
              return;
            }
            if (!/^[a-z0-9-]+$/.test(id)) {
              showToast('Extension ID must be lowercase letters, numbers, and hyphens only', 'error');
              return;
            }
            if (store.mods[id]) {
              showToast('An extension with this ID already exists', 'error');
              return;
            }
            
            generateExtensionTemplate(id, name, creator, description, selectedType, overlay, aiAssistants, isOfficial);
          }
        }, 'Generate Extension');
        
        actions.appendChild(cancelBtn);
        actions.appendChild(generateBtn);
        modalBody.appendChild(actions);
        
        modal.appendChild(modalBody);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
      }
      
      /**
       * Generate extension template code
       */
      function generateExtensionTemplate(id, name, creator, description, type, wizardOverlay, aiAssistants = '', isOfficial = false) {
        const today = new Date().toISOString().split('T')[0];
        
        // Generate JavaScript template based on type
        let jsTemplate = '';
        
        if (type === 'theme') {
          jsTemplate = `// ${name} - Theme Extension
// Created: ${today}

(function() {
  'use strict';
  
  // Theme extensions primarily use CSS
  // This file can be left minimal or used for dynamic theme switching
  
  CardSpoke_MODS.register('${id}', {
    meta: {
      name: '${name}',
      type: 'Theme',
      creator: '${creator}',
      version: '1.0.0',
      releaseDate: '${today}',
      description: '${description || 'A custom theme for CardSpoke'}',
      source: '${isOfficial ? 'official' : 'community'}',
      ai_assistants: '${aiAssistants || ''}'
    },
    onAppInit(ctx) {
      console.log('[${id}] Theme loaded');
    }
  });
})();`;
        } else if (type === 'patch') {
          jsTemplate = `// ${name} - Patch Extension
// Created: ${today}

(function() {
  'use strict';
  
  CardSpoke_MODS.register('${id}', {
    meta: {
      name: '${name}',
      type: 'Patch',
      creator: '${creator}',
      version: '1.0.0',
      releaseDate: '${today}',
      description: '${description || 'A small enhancement to CardSpoke'}',
      source: '${isOfficial ? 'official' : 'community'}',
      ai_assistants: '${aiAssistants || ''}'
    },
    onAppInit(ctx) {
      console.log('[${id}] Patch loaded');
      // Add your initialization code here
    },
    onCardRender(ctx, card, element) {
      // Called when a card is rendered
      // Modify the element or card display here
    }
  });
})();`;
        } else {
          // Plugin, Mod, or Expansion
          jsTemplate = `// ${name} - ${type.charAt(0).toUpperCase() + type.slice(1)} Extension
// Created: ${today}

(function() {
  'use strict';
  
  CardSpoke_MODS.register('${id}', {
    meta: {
      name: '${name}',
      type: '${type.charAt(0).toUpperCase() + type.slice(1)}',
      creator: '${creator}',
      version: '1.0.0',
      releaseDate: '${today}',
      description: '${description || 'A custom extension for CardSpoke'}',
      source: '${isOfficial ? 'official' : 'community'}',
      ai_assistants: '${aiAssistants || ''}'
    },
    onAppInit(ctx) {
      console.log('[${id}] Extension loaded');
      console.log('App Version:', ctx.appVersion);
      console.log('Available API:', ctx.api);
      
      // Example: Use CardSpoke.utils API
      // const meta = await CardSpoke.utils.getDatasetMeta();
      // console.log('Dataset info:', meta);
    },
    onCardSave(ctx, card, changes) {
      // Called when a card is saved
      // console.log('[${id}] Card saved:', card.id);
    },
    onCardDelete(ctx, card) {
      // Called when a card is deleted
      // console.log('[${id}] Card deleted:', card.id);
    },
    onCardRender(ctx, card, element) {
      // Called when a card is rendered
      // Modify the element appearance or add interactivity
    }
  });
})();`;
        }
        
        // Generate CSS template
        let cssTemplate = `/* ${name} - Styles */
/* Created: ${today} */

/* Add your custom styles here */
/* Example:
.card {
  border-color: #your-color;
}
*/
`;
        
        // Show generated code in a new modal
        if (wizardOverlay) wizardOverlay.remove();
        
        const overlay = h('div', { className: 'modal-overlay show' });
        const modal = h('div', { className: 'modal', style: 'max-width: 900px;' });
        const modalHeader = h('div', { className: 'modal-header' });
        modalHeader.appendChild(h('div', { className: 'modal-title' }, `Extension Generated: ${name}`));
        const closeBtn = h('button', { className: 'modal-close', onclick: () => overlay.remove() }, '✕');
        modalHeader.appendChild(closeBtn);
        modal.appendChild(modalHeader);
        
        const modalBody = h('div', { className: 'modal-body' });
        
        modalBody.appendChild(h('div', { style: 'margin-bottom: var(--space-lg); color: var(--text-muted);' }, 
          'Your extension template has been generated! You can now install it directly or download the code to customize further.'));
        
        // JavaScript Code
        modalBody.appendChild(h('div', { style: 'font-weight: 600; margin-bottom: var(--space-sm);' }, 'JavaScript Code:'));
        const jsCodeArea = h('textarea', {
          readonly: true,
          rows: 15,
          style: `
            width: 100%;
            padding: var(--space-md);
            border: 1px solid var(--border);
            border-radius: 4px;
            background: var(--bg-secondary);
            color: var(--text-primary);
            font-family: monospace;
            font-size: 0.875rem;
            margin-bottom: var(--space-lg);
            resize: vertical;
          `
        }, jsTemplate);
        modalBody.appendChild(jsCodeArea);
        
        // CSS Code
        modalBody.appendChild(h('div', { style: 'font-weight: 600; margin-bottom: var(--space-sm);' }, 'CSS Code (Optional):'));
        const cssCodeArea = h('textarea', {
          readonly: true,
          rows: 8,
          style: `
            width: 100%;
            padding: var(--space-md);
            border: 1px solid var(--border);
            border-radius: 4px;
            background: var(--bg-secondary);
            color: var(--text-primary);
            font-family: monospace;
            font-size: 0.875rem;
            margin-bottom: var(--space-lg);
            resize: vertical;
          `
        }, cssTemplate);
        modalBody.appendChild(cssCodeArea);
        
        // Actions
        const actions = h('div', { style: 'display: flex; gap: var(--space-md); justify-content: flex-end;' });
        
        const downloadBtn = h('button', {
          className: 'btn',
          onclick: () => {
            const content = JSON.stringify({
              id,
              meta: {
                name,
                type: type.charAt(0).toUpperCase() + type.slice(1),
                creator,
                version: '1.0.0',
                releaseDate: today,
                description: description || `A custom ${type} for CardSpoke`,
                source: isOfficial ? 'official' : 'community',
                ai_assistants: aiAssistants || ''
              },
              js: jsTemplate,
              css: cssTemplate,
              enabled: false
            }, null, 2);
            
            const blob = new Blob([content], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${id}.json`;
            a.click();
            URL.revokeObjectURL(url);
            
            showToast('Extension downloaded!', 'success');
          }
        }, 'Download JSON');
        
        const installBtn = h('button', {
          className: 'btn btn-primary',
          onclick: () => {
            store.mods[id] = {
              meta: {
                name,
                type: type.charAt(0).toUpperCase() + type.slice(1),
                creator,
                version: '1.0.0',
                releaseDate: today,
                description: description || `A custom ${type} for CardSpoke`,
                source: isOfficial ? 'official' : 'community',
                ai_assistants: aiAssistants || ''
              },
              js: jsTemplate,
              css: cssTemplate,
              enabled: false
            };
            
            save();
            overlay.remove();
            showToast(`Extension "${name}" installed! Enable it in the Extensions Manager.`, 'success');
          }
        }, 'Install Extension');
        
        actions.appendChild(downloadBtn);
        actions.appendChild(installBtn);
        modalBody.appendChild(actions);
        
        modal.appendChild(modalBody);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
      }


      /**
       * Show Extension Playground
       * Sandboxed environment for testing extension code
       */
      function showPlayground() {
        const overlay = h('div', { className: 'modal-overlay show' });
        const modal = h('div', { className: 'modal', style: 'max-width: 1200px; max-height: 90vh;' });
        const modalHeader = h('div', { className: 'modal-header' });
        modalHeader.appendChild(h('div', { className: 'modal-title' }, 'Extension Playground'));
        const closeBtn = h('button', { className: 'modal-close', onclick: () => overlay.remove() }, '✕');
        modalHeader.appendChild(closeBtn);
        modal.appendChild(modalHeader);
        
        const modalBody = h('div', { className: 'modal-body', style: 'padding: 0; display: flex; flex-direction: column; height: calc(90vh - 60px);' });
        
        // Toolbar
        const toolbar = h('div', { 
          style: `
            padding: var(--space-md);
            border-bottom: 1px solid var(--border);
            background: var(--bg-secondary);
            display: flex;
            gap: var(--space-md);
            align-items: center;
          `
        });
        
        const runBtn = h('button', {
          className: 'btn btn-primary',
          style: 'font-weight: 600;',
          onclick: () => runPlaygroundCode()
        }, 'Run Code');
        
        const clearBtn = h('button', {
          className: 'btn',
          onclick: () => {
            if (confirm('Clear all code and console output?')) {
              playgroundEditor.value = getPlaygroundTemplate();
              playgroundConsole.innerHTML = '';
            }
          }
        }, 'Clear');
        
        const templateBtn = h('button', {
          className: 'btn',
          onclick: () => {
            playgroundEditor.value = getPlaygroundTemplate();
            showToast('Template loaded', 'info');
          }
        }, 'Load Template');
        
        toolbar.appendChild(runBtn);
        toolbar.appendChild(clearBtn);
        toolbar.appendChild(templateBtn);
        toolbar.appendChild(h('div', { style: 'flex: 1;' })); // Spacer
        toolbar.appendChild(h('div', { style: 'color: var(--text-muted); font-size: var(--text-sm);' }, 
          'Tip: Use CardSpoke.utils API for safe data access'));
        
        modalBody.appendChild(toolbar);
        
        // Split view: Editor (left) and Console (right)
        const splitView = h('div', { 
          style: `
            flex: 1;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1px;
            background: var(--border);
            overflow: hidden;
          `
        });
        
        // Editor Panel
        const editorPanel = h('div', { 
          style: `
            background: var(--bg-primary);
            display: flex;
            flex-direction: column;
            overflow: hidden;
          `
        });
        
        editorPanel.appendChild(h('div', { 
          style: `
            padding: var(--space-sm) var(--space-md);
            background: var(--bg-secondary);
            font-weight: 600;
            border-bottom: 1px solid var(--border);
          `
        }, 'JavaScript Editor'));
        
        const playgroundEditor = h('textarea', {
          id: 'playgroundEditor',
          placeholder: 'Write your extension code here...',
          style: `
            flex: 1;
            padding: var(--space-md);
            border: none;
            background: var(--bg-primary);
            color: var(--text-primary);
            font-family: 'Courier New', monospace;
            font-size: 0.875rem;
            line-height: 1.5;
            resize: none;
            overflow: auto;
          `
        }, getPlaygroundTemplate());
        
        editorPanel.appendChild(playgroundEditor);
        splitView.appendChild(editorPanel);
        
        // Console Panel
        const consolePanel = h('div', { 
          style: `
            background: var(--bg-primary);
            display: flex;
            flex-direction: column;
            overflow: hidden;
          `
        });
        
        consolePanel.appendChild(h('div', { 
          style: `
            padding: var(--space-sm) var(--space-md);
            background: var(--bg-secondary);
            font-weight: 600;
            border-bottom: 1px solid var(--border);
          `
        }, 'Console Output'));
        
        const playgroundConsole = h('div', {
          id: 'playgroundConsole',
          style: `
            flex: 1;
            padding: var(--space-md);
            overflow: auto;
            font-family: 'Courier New', monospace;
            font-size: 0.875rem;
            line-height: 1.6;
          `
        });
        
        playgroundConsole.appendChild(h('div', { style: 'color: var(--text-muted);' }, 
          '→ Console ready. Click "Run Code" to execute your code.'));
        
        consolePanel.appendChild(playgroundConsole);
        splitView.appendChild(consolePanel);
        
        modalBody.appendChild(splitView);
        
        // Function to run playground code
        function runPlaygroundCode() {
          const code = playgroundEditor.value;
          playgroundConsole.innerHTML = '';
          
          const logEntry = (message, type = 'info') => {
            const color = {
              info: 'var(--text-primary)',
              success: '#4caf50',
              warning: '#ff9800',
              error: '#f44336'
            }[type];
            
            const entry = h('div', { 
              style: `color: ${color}; margin-bottom: var(--space-xs); border-left: 3px solid ${color}; padding-left: var(--space-sm);` 
            }, message);
            playgroundConsole.appendChild(entry);
          };
          
          // Create sandboxed console
          const sandboxConsole = {
            log: (...args) => logEntry(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '), 'info'),
            error: (...args) => logEntry('ERROR: ' + args.map(a => String(a)).join(' '), 'error'),
            warn: (...args) => logEntry('WARNING: ' + args.map(a => String(a)).join(' '), 'warning'),
            info: (...args) => logEntry('INFO: ' + args.map(a => String(a)).join(' '), 'info')
          };
          
          logEntry('→ Executing code...', 'info');
          
          try {
            // Use Function constructor to avoid eval and restrict scope
            const fn = new Function('console', 'CardSpoke', `
              "use strict";
              return (async () => {
                ${code}
              })();
            `);

            fn(sandboxConsole, window.CardSpoke).then(() => {
              logEntry('✓ Code execution completed', 'success');
            }).catch(err => {
              logEntry('Async error: ' + err.message, 'error');
              console.error('[Playground]', err);
            });
            
          } catch (err) {
            logEntry('Execution error: ' + err.message, 'error');
            console.error('[Playground]', err);
          }
        }
        
        // Store references for button handlers (namespaced to avoid global pollution)
        window.CardSpoke = window.CardSpoke || {};
        window.CardSpoke.playground = { editor: playgroundEditor, console: playgroundConsole, runCode: runPlaygroundCode };
        
        modal.appendChild(modalBody);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
      }
      
      /**
       * Get playground code template
       */
      function getPlaygroundTemplate() {
        return `// Extension Playground
// Test your extension code here in a safe environment

// Example 1: Use CardSpoke.utils API to get dataset info
const meta = await CardSpoke.utils.getDatasetMeta();
console.log('Dataset:', meta.name);
console.log('Total cards:', meta.cardCount);

// Example 2: Create a new card
const result = await CardSpoke.utils.createCard({
  title: 'Test Card from Playground',
  body: 'This card was created in the playground!',
  tags: ['playground', 'test']
});
console.log('Created card:', result.id);

// Example 3: Search for cards
const searchResults = await CardSpoke.utils.searchCards('test');
console.log('Found', searchResults.length, 'cards matching "test"');

// Example 4: Get all tags
const allTags = await CardSpoke.utils.getAllTags();
console.log('All tags:', allTags);

// Example 5: Show a toast notification
await CardSpoke.utils.showToast('Playground code executed!', 'success');

console.log('✓ All examples completed!');
`;
      }

      function showAppearanceSettings() {
        const overlay = h('div', { className: 'modal-overlay show' });
        const modal = h('div', { className: 'modal', style: 'max-width: 600px;' });
        const modalHeader = h('div', { className: 'modal-header' });
        modalHeader.appendChild(h('div', { className: 'modal-title' }, 'Appearance Settings'));
        const closeBtn = h('button', { className: 'modal-close', onclick: () => overlay.remove(), 'aria-label': 'Close' }, '✕');
        modalHeader.appendChild(closeBtn);
        modal.appendChild(modalHeader);
        
        const modalBody = h('div', { className: 'modal-body' });
        
        // View Mode Section
        const viewSection = h('div', { style: 'margin-bottom: var(--space-2xl); padding-bottom: var(--space-xl); border-bottom: 1px solid var(--border);' });
        viewSection.appendChild(h('div', { 
          style: 'font-weight: 700; margin-bottom: var(--space-lg); font-size: var(--text-lg);'
        }, 'View Options'));
        
        // Compact View Toggle
        const compactViewEnabled = store.viewMode === 'compact';
        const compactRow = h('div', { 
          className: 'menu-item-toggle',
          style: 'padding: var(--space-md); border: 1px solid var(--border); border-radius: 4px; margin-bottom: var(--space-md);'
        });
        const compactLabel = h('label', { className: 'menu-item-label' }, 'Compact View');
        const compactToggle = h('label', { className: 'switch-toggle' });
        const compactInput = h('input', { 
          type: 'checkbox', 
          checked: compactViewEnabled,
          onchange: function(e) {
            store.viewMode = e.target.checked ? 'compact' : 'normal';
            save();
            render();
          }
        });
        const compactSlider = h('span', { className: 'switch-slider' });
        compactToggle.appendChild(compactInput);
        compactToggle.appendChild(compactSlider);
        compactRow.appendChild(compactLabel);
        compactRow.appendChild(compactToggle);
        viewSection.appendChild(compactRow);
        
        // Grid View Toggle
        const gridViewEnabled = localStorage.getItem('cardspoke_gridView') === 'true';
        const gridRow = h('div', { 
          className: 'menu-item-toggle',
          style: 'padding: var(--space-md); border: 1px solid var(--border); border-radius: 4px; margin-bottom: var(--space-md);'
        });
        const gridLabel = h('label', { className: 'menu-item-label' }, 'Grid View');
        const gridToggle = h('label', { className: 'switch-toggle' });
        const gridInput = h('input', { 
          type: 'checkbox', 
          checked: gridViewEnabled,
          onchange: function(e) {
            localStorage.setItem('cardspoke_gridView', e.target.checked.toString());
            render();
          }
        });
        const gridSlider = h('span', { className: 'switch-slider' });
        gridToggle.appendChild(gridInput);
        gridToggle.appendChild(gridSlider);
        gridRow.appendChild(gridLabel);
        gridRow.appendChild(gridToggle);
        viewSection.appendChild(gridRow);
        
        // High Contrast Toggle
        const highContrastEnabled = localStorage.getItem('cardspoke_highContrast') === 'true';
        const contrastRow = h('div', { 
          className: 'menu-item-toggle',
          style: 'padding: var(--space-md); border: 1px solid var(--border); border-radius: 4px;'
        });
        const contrastLabel = h('label', { className: 'menu-item-label' }, 'High Contrast');
        const contrastToggle = h('label', { className: 'switch-toggle' });
        const contrastInput = h('input', { 
          type: 'checkbox', 
          checked: highContrastEnabled,
          onchange: function(e) {
            localStorage.setItem('cardspoke_highContrast', e.target.checked.toString());
            if (e.target.checked) {
              document.documentElement.classList.add('high-contrast');
            } else {
              document.documentElement.classList.remove('high-contrast');
            }
          }
        });
        const contrastSlider = h('span', { className: 'switch-slider' });
        contrastToggle.appendChild(contrastInput);
        contrastToggle.appendChild(contrastSlider);
        contrastRow.appendChild(contrastLabel);
        contrastRow.appendChild(contrastToggle);
        viewSection.appendChild(contrastRow);
        
        // Developer Mode Toggle
        const devModeEnabled = localStorage.getItem('cardspoke_devmode') === 'true';
        const devRow = h('div', { 
          className: 'menu-item-toggle',
          style: 'padding: var(--space-md); border: 1px solid var(--border); border-radius: 4px; margin-top: var(--space-md);'
        });
        const devLabel = h('label', { className: 'menu-item-label' }, 'Developer Mode');
        const devToggle = h('label', { className: 'switch-toggle' });
        const devInput = h('input', { 
          type: 'checkbox', 
          checked: devModeEnabled,
          onchange: function(e) {
            localStorage.setItem('cardspoke_devmode', e.target.checked.toString());
            showToast(e.target.checked ? 'Developer mode enabled' : 'Developer mode disabled');
          }
        });
        const devSlider = h('span', { className: 'switch-slider' });
        devToggle.appendChild(devInput);
        devToggle.appendChild(devSlider);
        devRow.appendChild(devLabel);
        devRow.appendChild(devToggle);
        viewSection.appendChild(devRow);
        
        modalBody.appendChild(viewSection);
        
        // Typography Section
        const typoSection = h('div', { style: 'margin-bottom: var(--space-2xl); padding-bottom: var(--space-xl); border-bottom: 1px solid var(--border);' });
        typoSection.appendChild(h('div', { 
          style: 'font-weight: 700; margin-bottom: var(--space-lg); font-size: var(--text-lg);'
        }, 'Typography'));
        
        const currentTypography = localStorage.getItem('cardspoke_typography') || 'default';
        const typographyPresets = [
          { id: 'default', name: 'Default', desc: 'Standard reading size' },
          { id: 'comfortable', name: 'Comfortable', desc: 'Larger text, more spacing' },
          { id: 'compact', name: 'Compact', desc: 'Smaller text, denser layout' },
          { id: 'dyslexia', name: 'Dyslexia-Friendly', desc: 'Optimized for readability' }
        ];
        
        typographyPresets.forEach(function(preset) {
          const isActive = currentTypography === preset.id;
          const presetOption = h('div', {
            style: 'padding: var(--space-md); border: 2px solid ' + (isActive ? 'var(--text)' : 'var(--border)') + '; border-radius: 4px; margin-bottom: var(--space-md); cursor: pointer;',
            onclick: function() {
              localStorage.setItem('cardspoke_typography', preset.id);
              document.documentElement.setAttribute('data-typography', preset.id);
              showToast('Typography: ' + preset.name);
              overlay.remove();
              showAppearanceSettings();
            }
          });
          presetOption.appendChild(h('div', { style: 'font-weight: 600;' }, (isActive ? '✓ ' : '') + preset.name));
          presetOption.appendChild(h('div', { style: 'font-size: var(--text-sm); color: var(--text-muted);' }, preset.desc));
          typoSection.appendChild(presetOption);
        });
        
        modalBody.appendChild(typoSection);
        
        // Theme Section
        const themeSection = h('div', { style: 'margin-bottom: var(--space-xl);' });
        themeSection.appendChild(h('div', { 
          style: 'font-weight: 700; margin-bottom: var(--space-lg); font-size: var(--text-lg);'
        }, 'Theme'));
        
        const currentTheme = store.activeTheme || 'light';
        
        // Light theme option
        const lightOption = h('div', { 
          className: 'theme-option',
          style: 'padding: var(--space-lg); border: 2px solid ' + (currentTheme === 'light' ? 'var(--text)' : 'var(--border)') + '; margin-bottom: var(--space-md); cursor: pointer; border-radius: 4px; background: white; color: black;',
          onclick: function() {
            applyTheme('light');
            overlay.remove();
          }
        });
        lightOption.appendChild(h('div', { style: 'font-weight: 600; margin-bottom: var(--space-xs);' }, (currentTheme === 'light' ? '✓ ' : '') + 'Light Theme'));
        lightOption.appendChild(h('div', { style: 'font-size: var(--text-sm); color: #666;' }, 'Default light color scheme'));
        themeSection.appendChild(lightOption);
        
        // Dark theme option
        const darkOption = h('div', { 
          className: 'theme-option',
          style: 'padding: var(--space-lg); border: 2px solid ' + (currentTheme === 'dark' ? 'white' : 'var(--border)') + '; margin-bottom: var(--space-md); cursor: pointer; border-radius: 4px; background: #1a1a1a; color: white;',
          onclick: function() {
            applyTheme('dark');
            overlay.remove();
          }
        });
        darkOption.appendChild(h('div', { style: 'font-weight: 600; margin-bottom: var(--space-xs);' }, (currentTheme === 'dark' ? '✓ ' : '') + 'Dark Theme'));
        darkOption.appendChild(h('div', { style: 'font-size: var(--text-sm); color: #aaa;' }, 'Dark color scheme'));
        themeSection.appendChild(darkOption);
        
        // Custom themes from extensions
        const themeExtensions = Object.values(store.mods || {}).filter(function(mod) {
          return mod.meta && mod.meta.type === 'Theme' && mod.enabled;
        });
        
        if (themeExtensions.length > 0) {
          themeSection.appendChild(h('div', { 
            style: 'font-weight: 600; margin: var(--space-lg) 0 var(--space-md);'
          }, 'Installed Theme Extensions:'));
          
          themeExtensions.forEach(function(theme) {
            const themeOption = h('div', {
              style: 'padding: var(--space-md); border: 1px solid var(--border); border-radius: 4px; margin-bottom: var(--space-sm);'
            });
            themeOption.appendChild(h('div', { style: 'font-weight: 600;' }, theme.meta.name || theme.id));
            themeOption.appendChild(h('div', { style: 'font-size: var(--text-sm); color: var(--text-muted);' }, 'By ' + (theme.meta.creator || 'Unknown')));
            themeSection.appendChild(themeOption);
          });
        }
        
        modalBody.appendChild(themeSection);
        
        modal.appendChild(modalBody);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // Set up focus trap
        trapFocus(modal);
        
        overlay.onclick = function(e) {
          if (e.target === overlay) overlay.remove();
        };
      }

      function showBookmarks() {
        const overlay = h('div', { className: 'modal-overlay show' });
        const modal = h('div', { className: 'modal' });
        const modalHeader = h('div', { className: 'modal-header' });
        modalHeader.appendChild(h('div', { className: 'modal-title' }, '★ Bookmarked Cards'));
        const closeBtn = h('button', { className: 'modal-close', onclick: () => overlay.remove() }, '✕');
        modalHeader.appendChild(closeBtn);
        modal.appendChild(modalHeader);
        const modalBody = h('div', { className: 'modal-body' });
        
        if (!store.bookmarks || store.bookmarks.length === 0) {
          modalBody.appendChild(h('div', { className: 'empty' }, 'No bookmarked cards yet'));
        } else {
          const bookmarkList = store.bookmarks
            .map(cardId => store.cards[cardId])
            .filter(card => card) // Filter out deleted cards
            .map(card => {
              const cardItem = h('div', { 
                style: 'padding: var(--space-lg); border: 1px solid var(--border); margin-bottom: var(--space-md); cursor: pointer;',
                onclick: () => {
                  overlay.remove();
                  goTo('read', { cardId: card.id });
                }
              });
              
              const cardHeader = h('div', { style: 'display: flex; justify-content: space-between; align-items: center;' });
              cardHeader.appendChild(h('div', { style: 'font-weight: 700;' }, card.title || '(Untitled)'));
              
              const unbookmarkBtn = h('button', {
                className: 'btn btn-danger',
                style: 'font-size: var(--text-sm);',
                onclick: (e) => {
                  e.stopPropagation();
                  toggleBookmark(card.id);
                  overlay.remove();
                  showBookmarks();
                }
              }, 'Remove');
              cardHeader.appendChild(unbookmarkBtn);
              cardItem.appendChild(cardHeader);
              
              if (card.body) {
                const preview = card.body.substring(0, 100) + (card.body.length > 100 ? '...' : '');
                cardItem.appendChild(h('div', { style: 'color: var(--text-muted); font-size: var(--text-sm); margin-top: var(--space-sm);' }, preview));
              }
              
              return cardItem;
            });
          
          bookmarkList.forEach(item => modalBody.appendChild(item));
        }
        
        modal.appendChild(modalBody);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
      }

      function showRecentCards() {
        const overlay = h('div', { className: 'modal-overlay show' });
        const modal = h('div', { className: 'modal' });
        const modalHeader = h('div', { className: 'modal-header' });
        modalHeader.appendChild(h('div', { className: 'modal-title' }, 'Recent Cards'));
        const closeBtn = h('button', { className: 'modal-close', onclick: () => overlay.remove() }, '✕');
        modalHeader.appendChild(closeBtn);
        modal.appendChild(modalHeader);
        const modalBody = h('div', { className: 'modal-body' });
        
        if (!store.recentCards || store.recentCards.length === 0) {
          modalBody.appendChild(h('div', { className: 'empty' }, 'No recently viewed cards'));
        } else {
          const recentList = store.recentCards
            .map(cardId => store.cards[cardId])
            .filter(card => card) // Filter out deleted cards
            .map((card, index) => {
              const cardItem = h('div', { 
                style: 'padding: var(--space-lg); border: 1px solid var(--border); margin-bottom: var(--space-md); cursor: pointer;',
                onclick: () => {
                  overlay.remove();
                  goTo('read', { cardId: card.id });
                }
              });
              
              const cardHeader = h('div', { style: 'display: flex; justify-content: space-between; align-items: center;' });
              cardHeader.appendChild(h('div', { style: 'font-weight: 700;' }, `${index + 1}. ${card.title || '(Untitled)'}`));
              cardItem.appendChild(cardHeader);
              
              if (card.body) {
                const preview = card.body.substring(0, 100) + (card.body.length > 100 ? '...' : '');
                cardItem.appendChild(h('div', { style: 'color: var(--text-muted); font-size: var(--text-sm); margin-top: var(--space-sm);' }, preview));
              }
              
              return cardItem;
            });
          
          recentList.forEach(item => modalBody.appendChild(item));
        }
        
        modal.appendChild(modalBody);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
      }

      function openUploadModalForCard(cardId, tabName) {
        // 1. Update all the select dropdowns
        updateImportLocationOptions();
        
        // 2. Set the value for the TXT and DOCX dropdowns to this cardId
        if (uploadModal.importLocationSelectTXT) {
          uploadModal.importLocationSelectTXT.value = cardId;
        }
        if (uploadModal.importLocationSelectDOCX) {
          uploadModal.importLocationSelectDOCX.value = cardId;
        }
        
        // 3. Set the correct radio button for TXT import (append)
        const txtAppendRadio = document.querySelector('input[name="txtImportMode"][value="append"]');
        if (txtAppendRadio) txtAppendRadio.checked = true;

        // 4. Set the correct radio button for DOCX import (append)
        const docxAppendRadio = document.querySelector('input[name="docxImportMode"][value="append"]');
        if (docxAppendRadio) docxAppendRadio.checked = true;

        // 5. Switch to the correct tab
        uploadModal.tabs.forEach(t => t.classList.remove('active'));
        uploadModal.tabContents.forEach(content => content.classList.remove('active'));
        
        const tabEl = document.querySelector(`.modal-tab[data-tab="${tabName}"]`);
        const contentEl = document.getElementById(`tab-${tabName}`);
        
        if (tabEl) tabEl.classList.add('active');
        if (contentEl) contentEl.classList.add('active');
        
        // 6. Show the modal
        uploadModal.overlay.classList.add('show');
      }

      function updateImportLocationOptions() {
        const selectJSON = uploadModal.importLocationSelectJSON;
        const selectTXT = uploadModal.importLocationSelectTXT;
        const selectDOCX = uploadModal.importLocationSelectDOCX;
        const sortedCards = Object.values(store.cards).sort((a, b) => {
          const A = (a.title || '').toLowerCase();
          const B = (b.title || '').toLowerCase();
          return A.localeCompare(B);
        });
        if (selectJSON) {
          selectJSON.innerHTML = '<option value="root">Add as Root Cards</option>';
          sortedCards.forEach(card => {
            const option = document.createElement('option');
            option.value = card.id;
            option.textContent = `Add as children of: ${card.title || '(Untitled)'}`;
            selectJSON.appendChild(option);
          });
        }
        if (selectTXT) {
          // Compromise text to work for both radio options
          selectTXT.innerHTML = '<option value="root">Add as Root Cards (Outline Mode)</option>';
          sortedCards.forEach(card => {
            const option = document.createElement('option');
            option.value = card.id;
            option.textContent = `Append to / Add children of: ${card.title || '(Untitled)'}`;
            selectTXT.appendChild(option);
          });
        }
        if (selectDOCX) {
          selectDOCX.innerHTML = '<option value="">Select a card...</option>';
          sortedCards.forEach(card => {
            const option = document.createElement('option');
            option.value = card.id;
            option.textContent = card.title || '(Untitled)';
            selectDOCX.appendChild(option);
          });
        }
      }

      function extractTags(body) {
        if (!body) return [];
        const matches = body.match(/#\w+/g);
        return matches ? matches.slice(0, 5) : [];
      }

      /**
       * Parse [[Card Name]] tokens from text
       * @param {string} text - Text to parse
       * @returns {Array<{match: string, cardName: string, startIndex: number, endIndex: number}>} Array of token matches
       */
      function parseCardLinks(text) {
        if (!text) return [];
        
        const regex = /\[\[([^\]]+)\]\]/g;
        const matches = [];
        let match;
        
        while ((match = regex.exec(text)) !== null) {
          matches.push({
            match: match[0],           // Full match: [[Card Name]]
            cardName: match[1].trim(), // Extracted card name
            startIndex: match.index,
            endIndex: match.index + match[0].length
          });
        }
        
        return matches;
      }

      /**
       * Normalize card name for comparison
       * @param {string} name - Card name to normalize
       * @returns {string} Normalized name (lowercase, trimmed, spaces normalized)
       */
      function normalizeCardName(name) {
        if (!name) return '';
        return name.toLowerCase().trim().replace(/\s+/g, ' ');
      }

      /**
       * Check if a card link token exists in text
       * @param {string} text - Text to search
       * @param {string} cardName - Card name to look for
       * @returns {boolean} True if card link exists
       */
      function hasCardLink(text, cardName) {
        if (!text || !cardName) return false;
        const links = parseCardLinks(text);
        const normalizedName = normalizeCardName(cardName);
        return links.some(link => normalizeCardName(link.cardName) === normalizedName);
      }

      /**
       * Find card ID by normalized name
       * @param {string} cardName - Card name to search for
       * @returns {string|null} Card ID if found, null otherwise
       */
      function findCardByName(cardName) {
        if (!cardName) return null;
        
        const normalizedSearch = normalizeCardName(cardName);
        
        for (const [id, card] of Object.entries(store.cards)) {
          if (normalizeCardName(card.title) === normalizedSearch) {
            return id;
          }
        }
        
        return null;
      }

      /**
       * Find all cards matching a name pattern
       * @param {string} cardName - Card name pattern to search for
       * @param {boolean} exactMatch - If true, requires exact match; if false, allows partial matches
       * @returns {Array<{id: string, title: string, similarity: number}>} Array of matching cards
       */
      function findCardsByName(cardName, exactMatch = true) {
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
            // Partial match - check if search term is contained
            if (normalizedTitle.includes(normalizedSearch)) {
              // Calculate simple similarity score
              const similarity = normalizedSearch.length / normalizedTitle.length;
              results.push({
                id,
                title: card.title,
                similarity
              });
            }
          }
        }
        
        // Sort by similarity (exact matches first, then by similarity score)
        results.sort((a, b) => b.similarity - a.similarity);
        
        return results;
      }

      /**
       * Resolve all card links in text to card IDs
       * @param {string} text - Text containing [[Card Name]] links
       * @returns {Array<{link: object, cardId: string|null}>} Array of links with resolved IDs
       */
      function resolveCardLinks(text) {
        const links = parseCardLinks(text);
        
        return links.map(link => ({
          link,
          cardId: findCardByName(link.cardName)
        }));
      }

      /**
       * Get all tags for a card
       * @param {string} cardId - Card ID
       * @returns {string[]} Array of tags
       */
      function getTags(cardId) {
        const card = store.cards[cardId];
        if (!card) return [];
        return card.tags || [];
      }

      /**
       * Add a tag to a card
       * @param {string} cardId - Card ID
       * @param {string} tag - Tag to add
       * @param {boolean} skipSave - Skip saving to localStorage
       * @returns {boolean} True if tag was added, false otherwise
       */
      function addTag(cardId, tag, skipSave = false) {
        const card = store.cards[cardId];
        if (!card) return false;
        
        // Normalize tag (remove # if present, lowercase)
        const normalizedTag = tag.replace(/^#/, '').toLowerCase().trim();
        if (!normalizedTag) return false;
        
        // Initialize tags array if not present
        if (!card.tags) card.tags = [];
        
        // Check if tag already exists (case-insensitive)
        if (card.tags.some(t => t.toLowerCase() === normalizedTag)) {
          return false;
        }
        
        // Add the tag
        card.tags.push(normalizedTag);
        card.updatedAt = Date.now();
        
        if (!skipSave) save();
        runModHook('onCardSave', cloneCard(card), { isNew: false, source: 'addTag' });
        
        return true;
      }

      /**
       * Remove a tag from a card
       * @param {string} cardId - Card ID
       * @param {string} tag - Tag to remove
       * @param {boolean} skipSave - Skip saving to localStorage
       * @returns {boolean} True if tag was removed, false otherwise
       */
      function removeTag(cardId, tag, skipSave = false) {
        const card = store.cards[cardId];
        if (!card || !card.tags) return false;
        
        // Normalize tag (remove # if present, lowercase)
        const normalizedTag = tag.replace(/^#/, '').toLowerCase().trim();
        
        // Find and remove the tag (case-insensitive)
        const initialLength = card.tags.length;
        card.tags = card.tags.filter(t => t.toLowerCase() !== normalizedTag);
        
        // Check if anything was removed
        if (card.tags.length === initialLength) {
          return false;
        }
        
        card.updatedAt = Date.now();
        
        if (!skipSave) save();
        runModHook('onCardSave', cloneCard(card), { isNew: false, source: 'removeTag' });
        
        return true;
      }

      /**
       * Set all tags for a card (replaces existing tags)
       * @param {string} cardId - Card ID
       * @param {string[]} tags - Array of tags to set
       * @param {boolean} skipSave - Skip saving to localStorage
       * @returns {boolean} True if tags were set successfully
       */
      function setTags(cardId, tags, skipSave = false) {
        const card = store.cards[cardId];
        if (!card) return false;
        
        // Normalize all tags
        const normalizedTags = tags
          .map(tag => tag.replace(/^#/, '').toLowerCase().trim())
          .filter(tag => tag.length > 0);
        
        // Remove duplicates
        card.tags = [...new Set(normalizedTags)];
        card.updatedAt = Date.now();
        
        if (!skipSave) save();
        runModHook('onCardSave', cloneCard(card), { isNew: false, source: 'setTags' });
        
        return true;
      }

      /**
       * Get all unique tags across all cards
       * @returns {string[]} Array of all unique tags
       */
      function getAllTags() {
        const allTags = new Set();
        Object.values(store.cards).forEach(card => {
          if (card.tags) {
            card.tags.forEach(tag => allTags.add(tag));
          }
        });
        return Array.from(allTags).sort();
      }
      /**
       * Get all cards that link to a specific card (backlinks)
       * @param {string} cardId - Card ID to find backlinks for
       * @returns {Array<{id: string, title: string}>} Array of cards that link to this card
       */
      function getBacklinks(cardId) {
        if (!cardId) return [];
        
        const card = store.cards[cardId];
        if (!card) return [];
        
        const cardTitle = card.title;
        if (!cardTitle) return [];
        
        const backlinks = [];
        
        // Search through all cards for [[Card Title]] references
        for (const [id, otherCard] of Object.entries(store.cards)) {
          if (id === cardId) continue; // Skip self-references
          
          if (otherCard.body && hasCardLink(otherCard.body, cardTitle)) {
            backlinks.push({
              id: otherCard.id,
              title: otherCard.title || '(Untitled)',
              body: otherCard.body
            });
          }
        }
        
        return backlinks;
      }

      /**
       * Get related cards based on shared tags
       * @param {string} cardId - Card ID to find related cards for
       * @param {number} limit - Maximum number of results (default: 10)
       * @returns {Array<{id: string, title: string, matchScore: number, matchedTags: string[]}>}
       */
      function getRelatedCards(cardId, limit = 10) {
        if (!cardId) return [];
        
        const card = store.cards[cardId];
        if (!card) return [];
        
        const cardTags = getTags(cardId);
        if (cardTags.length === 0) return [];
        
        const related = [];
        
        for (const [id, otherCard] of Object.entries(store.cards)) {
          if (id === cardId) continue; // Skip self
          
          const otherTags = getTags(id);
          const matchedTags = cardTags.filter(tag => otherTags.includes(tag));
          
          if (matchedTags.length > 0) {
            const matchScore = matchedTags.length / Math.max(cardTags.length, otherTags.length);
            related.push({
              id: otherCard.id,
              title: otherCard.title || '(Untitled)',
              matchScore,
              matchedTags
            });
          }
        }
        
        // Sort by match score (highest first)
        related.sort((a, b) => b.matchScore - a.matchScore);
        
        return related.slice(0, limit);
      }



      // =============================================================
      // --- RENDERING ---
      // Functions for rendering UI components and pages
      // =============================================================

      /**
       * Render breadcrumb navigation
       */
      function renderBreadcrumbs() {
        breadcrumbs.innerHTML = '';
        if (navState.page === 'search') {
          breadcrumbs.appendChild(h('span', { className: 'breadcrumb current', 'aria-current': 'page' }, 'Search Results'));
          return;
        }
        if (navState.page === 'edit') {
          breadcrumbs.appendChild(h('span', { className: 'breadcrumb current', 'aria-current': 'page' }, navState.cardId ? 'Edit Card' : 'New Card'));
          return;
        }
        let current = navState.cardId;
        const path = [];
        while (current) {
          const c = store.cards[current];
          if (!c) break;
          path.unshift(c);
          current = c.parentId;
        }
        if (path.length === 0) {
          breadcrumbs.appendChild(h('span', { className: 'breadcrumb current', 'aria-current': 'page' }, 'All Cards'));
        } else {
          const home = h('button', { className: 'breadcrumb', onclick: () => goTo('list', { cardId: null }), 'aria-label': 'Go to All Cards' }, 'All Cards');
          breadcrumbs.appendChild(home);
          path.forEach((c, i) => {
            const isCurrent = (i === path.length - 1 && navState.page === 'list');
            const cls = isCurrent ? 'breadcrumb current' : 'breadcrumb';
            const chip = isCurrent 
              ? h('span', { className: cls, 'aria-current': 'page' }, c.title || '(Untitled)')
              : h('button', { className: cls, onclick: () => goTo('list', { cardId: c.id }), 'aria-label': 'Go to ' + (c.title || 'Untitled') }, c.title || '(Untitled)');
            breadcrumbs.appendChild(chip);
          });
        }
      }

      /**
       * Render the list of cards (root level or children)
       */
      function renderCardList() {
        const parentId = navState.cardId;
        let kids = [];
        if (!parentId) {
          kids = store.rootOrder.map(id => store.cards[id]).filter(c => c);
        } else {
          const parent = store.cards[parentId];
          if (!parent) {
            main.appendChild(h('div', { className: 'empty' }, 'Card not found.'));
            return;
          }
          kids = parent.children.map(id => store.cards[id]).filter(c => c);
        }
        searchContainer.style.display = 'block';
        const title = parentId ? (store.cards[parentId]?.title || 'Card') : 'Top Level Cards';
        main.appendChild(h('div', { className: 'page-title' }, title));
        
        kids.sort((a, b) => (a.title || '').toLowerCase().localeCompare((b.title || '').toLowerCase()));
        
        if (kids.length === 0) {
          main.appendChild(h('div', { className: 'empty' }, 'No cards yet. Create one to get started!'));
        } else {
          const gridViewEnabled = localStorage.getItem('cardspoke_gridView') === 'true';
          const gridClass = gridViewEnabled ? 'card-grid grid-view' : 'card-grid';
          const grid = h('div', { className: gridClass });
          kids.forEach(card => {
            const cardEl = renderCardTile(card);
            grid.appendChild(cardEl);
            runModHook('onCardRender', cloneCard(card), cardEl);
          });
          main.appendChild(grid);
        }
      }

      /**
       * Render a single card tile in list view
       * @param {Object} card - Card to render
       * @returns {HTMLElement} Card tile element
       */
      function renderCardTile(card) {
        const isCompact = store.viewMode === 'compact';
        const cardClasses = isCompact ? 'card card-compact' : 'card';
        const cardEl = h('button', { className: cardClasses + ' card-tile', onclick: () => goTo('read', { cardId: card.id }), 'aria-label': 'Open card: ' + (card.title || 'Untitled') });
        cardEl.dataset.cardId = card.id;
        cardEl.dataset.renderType = 'list';

        // Left side content
        const contentEl = h('div', { className: 'card-content' });
        
        // Add bookmark indicator if bookmarked
        const titleWrapper = h('div', { style: 'display: flex; align-items: center; gap: 8px;' });
        if (isBookmarked(card.id)) {
          titleWrapper.appendChild(h('span', { 
            style: 'color: gold; font-size: 18px;',
            title: 'Bookmarked'
          }, '★'));
        }
        titleWrapper.appendChild(h('div', { className: 'card-title' }, card.title || '(Untitled)'));
        contentEl.appendChild(titleWrapper);
        
        if (card.body && !isCompact) {
          const preview = card.body.substring(0, 140) + (card.body.length > 140 ? '...' : '');
          contentEl.appendChild(h('div', { className: 'card-description' }, preview));
        }
        
        const tags = (card.tags && card.tags.length ? card.tags : extractTags(card.body));
        if (tags.length > 0 && !isCompact) {
          const tagsEl = h('div', { className: 'card-tags' });
          tags.forEach(tag => {
            tagsEl.appendChild(h('span', { className: 'card-tag' }, tag));
          });
          contentEl.appendChild(tagsEl);
        }
        
        cardEl.appendChild(contentEl);

        // Right side count
        if (card.children.length > 0) {
          cardEl.appendChild(h('div', { className: 'card-count' }, String(card.children.length)));
        }
        
        return cardEl;
      }

      /**
       * Render card body text with clickable card links
       * Converts [[Card Name]] to clickable links
       * @param {string} text - Card body text
       * @returns {HTMLElement} Div element with rendered content
       */
      function renderCardBody(text) {
        const container = h('div', { className: 'card-detail-body' });
        
        if (!text) return container;
        
        const links = parseCardLinks(text);
        
        if (links.length === 0) {
          // No links, just return plain text
          container.textContent = text;
          return container;
        }
        
        // Sort links by start index to process in order
        links.sort((a, b) => a.startIndex - b.startIndex);
        
        let lastIndex = 0;
        
        links.forEach(link => {
          // Add text before the link
          if (link.startIndex > lastIndex) {
            const textBefore = text.substring(lastIndex, link.startIndex);
            container.appendChild(document.createTextNode(textBefore));
          }
          
          // Find the card ID
          const cardId = findCardByName(link.cardName);
          
          // Create clickable link
          const linkEl = h('span', { 
            className: cardId ? 'card-link' : 'card-link-missing',
            style: 'cursor: pointer;',
            title: cardId ? `Go to: ${link.cardName}` : `Card not found: ${link.cardName} (click to create)`
          }, link.cardName);
          
          // Add click handler
          linkEl.addEventListener('click', (e) => {
            e.stopPropagation();
            if (cardId) {
              // Card exists, navigate to it
              goTo('read', { cardId });
            } else {
              // Card doesn't exist, offer to create it
              if (confirm(`Card "${link.cardName}" doesn't exist. Create it?`)) {
                const newId = createCard(link.cardName, '', null);
                goTo('edit', { cardId: newId });
              }
            }
          });
          
          container.appendChild(linkEl);
          lastIndex = link.endIndex;
        });
        
        // Add remaining text after the last link
        if (lastIndex < text.length) {
          const textAfter = text.substring(lastIndex);
          container.appendChild(document.createTextNode(textAfter));
        }
        
        return container;
      }

      /**
       * Render a card in read-only/detail view
       */
      function renderReadOnlyCard() {
        searchContainer.style.display = 'none';
        const card = store.cards[navState.cardId];
        if (!card) {
          main.appendChild(h('div', { className: 'empty' }, 'Card not found.'));
          return;
        }
        const detail = h('div', { className: 'card-detail' });
        detail.appendChild(h('div', { className: 'card-detail-title' }, card.title || '(Untitled)'));
        if (card.body) {
          detail.appendChild(renderCardBody(card.body));
        }
        // Tags display
        const _tags = (card.tags && card.tags.length ? card.tags : extractTags(card.body));
        if (_tags.length) {
          const tagsWrap = h('div', { className: 'card-tags' });
          _tags.forEach(t => tagsWrap.appendChild(h('span', { className: 'card-tag' }, t)));
          detail.appendChild(tagsWrap);
        }
        const actions = h('div', { className: 'card-detail-actions' });
        actions.appendChild(h('button', { className: 'btn btn-primary', onclick: () => goTo('edit', { cardId: card.id }) }, 'Edit'));
        
        // Bookmark button
        const bookmarkBtnText = isBookmarked(card.id) ? '★ Unbookmark' : '☆ Bookmark';
        actions.appendChild(h('button', { 
          className: 'btn', 
          onclick: (e) => {
            e.stopPropagation();
            toggleBookmark(card.id);
          }
        }, bookmarkBtnText));
        
        // Duplicate button with dropdown-like behavior
        actions.appendChild(h('button', { 
          className: 'btn', 
          onclick: () => {
            const choice = confirm('Duplicate with children?\n\nOK = Yes (with children)\nCancel = No (only this card)');
            const newId = duplicateCard(card.id, choice);
            if (newId) {
              showToast('Card duplicated successfully');
              goTo('read', { cardId: newId });
            }
          }
        }, 'Duplicate'));
        
        actions.appendChild(h('button', { className: 'btn', onclick: () => {
          const newId = createCard('', '', card.id);
          goTo('edit', { cardId: newId });
        } }, 'Add Child'));
        
        actions.appendChild(h('button', { className: 'btn', onclick: () => openUploadModalForCard(card.id, 'txt') }, 'Import TXT'));
        actions.appendChild(h('button', { className: 'btn', onclick: () => openUploadModalForCard(card.id, 'docx') }, 'Import DOCX'));
        
        actions.appendChild(h('button', { className: 'btn btn-danger', onclick: () => {
          if (confirm('Delete this card and all its children?')) {
            deleteCard(card.id);
            goTo('list', { cardId: card.parentId });
          }
        } }, 'Delete'));
        detail.appendChild(actions);
        if (card.children.length > 0) {
          const childrenSection = h('div', { className: 'children-section' });
          childrenSection.appendChild(h('div', { className: 'children-title' }, `Children (${card.children.length})`));
          const childrenGrid = h('div', { className: 'card-grid' });
          card.children.forEach(cid => {
            const childCard = store.cards[cid];
            if (childCard) {
              const childEl = renderCardTile(childCard);
              childrenGrid.appendChild(childEl);
              runModHook('onCardRender', cloneCard(childCard), childEl);
            }
          });
          childrenSection.appendChild(childrenGrid);
          detail.appendChild(childrenSection);
        }
        // Backlinks section
        const backlinks = getBacklinks(card.id);
        if (backlinks.length > 0) {
          const backlinksSection = h('div', { className: 'backlinks-section' });
          backlinksSection.appendChild(h('div', { className: 'section-title' }, `← Referenced By (${backlinks.length})`));
          const backlinksGrid = h('div', { className: 'card-grid' });
          backlinks.forEach(backlink => {
            const backlinkTile = h('div', { 
              className: 'card-tile', 
              onclick: () => goTo('read', { cardId: backlink.id }) 
            });
            backlinkTile.appendChild(h('div', { className: 'card-tile-title' }, backlink.title));
            backlinksGrid.appendChild(backlinkTile);
          });
          backlinksSection.appendChild(backlinksGrid);
          detail.appendChild(backlinksSection);
        }
        
        // Related cards section (based on tags)
        const relatedCards = getRelatedCards(card.id, 5);
        if (relatedCards.length > 0) {
          const relatedSection = h('div', { className: 'related-section' });
          relatedSection.appendChild(h('div', { className: 'section-title' }, `Related Cards (${relatedCards.length})`));
          const relatedGrid = h('div', { className: 'card-grid' });
          relatedCards.forEach(related => {
            const relatedTile = h('div', { 
              className: 'card-tile', 
              onclick: () => goTo('read', { cardId: related.id }) 
            });
            const titleDiv = h('div', { className: 'card-tile-title' }, related.title);
            relatedTile.appendChild(titleDiv);
            // Show matched tags
            const tagsDiv = h('div', { className: 'card-tags' });
            related.matchedTags.forEach(tag => {
              tagsDiv.appendChild(h('span', { className: 'card-tag' }, tag));
            });
            relatedTile.appendChild(tagsDiv);
            relatedGrid.appendChild(relatedTile);
          });
          relatedSection.appendChild(relatedGrid);
          detail.appendChild(relatedSection);
        }
        main.appendChild(detail);
        runModHook('onCardRender', cloneCard(card), detail);
      }

      /**
       * Render card edit form
       */
      function renderEditCard() {
        searchContainer.style.display = 'none';
        const editing = !!navState.cardId;
        const card = editing ? store.cards[navState.cardId] : {
          id: null,
          title: '',
          body: '',
          parentId: navState.parentId,
          children: []
        };
        if (editing && !card) {
          main.appendChild(h('div', { className: 'empty' }, 'Card not found.'));
          return;
        }
        const form = h('form', {
          onsubmit: (e) => {
            e.preventDefault();
            const titleVal = form.querySelector('#cardTitle').value.trim();
            const bodyVal = form.querySelector('#cardBody').value.trim();
            const parentVal = form.querySelector('#cardParent').value || null;
            const tagsVal = (form.querySelector('#cardTags')?.value || '').split(',').map(s => s.trim()).filter(Boolean);
            if (editing) {
              const oldParentId = card.parentId;
              if (oldParentId !== parentVal) {
                if (oldParentId) {
                  const oldParent = store.cards[oldParentId];
                  if (oldParent) oldParent.children = oldParent.children.filter(c => c !== card.id);
                } else {
                  store.rootOrder = store.rootOrder.filter(c => c !== card.id);
                }
                if (parentVal) {
                  const newParent = store.cards[parentVal];
                  if (newParent && !newParent.children.includes(card.id)) newParent.children.push(card.id);
                } else {
                  if (!store.rootOrder.includes(card.id)) store.rootOrder.push(card.id);
                }
                card.parentId = parentVal;
              }
              updateCard(card.id, { title: titleVal, body: bodyVal, tags: tagsVal }, true, true);
              card.children.forEach(cid => {
                const inp = childrenInpMap[cid];
                if (inp) updateCard(cid, { title: inp.value.trim() }, true, true);
              });
              const newKidRows = form.querySelectorAll('#addChildList .form-child-row input');
              newKidRows.forEach(inp => {
                const t = inp.value.trim();
                if (t) createCard(t, '', card.id, true, true);
              });
              save();
              runModHook('onCardSave', cloneCard(card), { isNew: false, source: 'update' });
              goTo('read', { cardId: card.id });
            } else {
              const newId = createCard(titleVal, bodyVal, parentVal, true, true);
              const newKidRows = form.querySelectorAll('#addChildList .form-child-row input');
              newKidRows.forEach(inp => {
                const t = inp.value.trim();
                if (t) createCard(t, '', newId, true, true);
              });
              save();
              runModHook('onCardSave', cloneCard(store.cards[newId]), { isNew: true, source: 'create' });
              goTo('read', { cardId: newId });
            }
          }
        });
        const formGroup1 = h('div', { className: 'form-group' });
        formGroup1.appendChild(h('label', { className: 'form-label' }, 'Title'));
        formGroup1.appendChild(h('input', { type: 'text', id: 'cardTitle', className: 'form-input', value: card.title, oninput: () => { dirty = true; } }));
        form.appendChild(formGroup1);
        const formGroup2 = h('div', { className: 'form-group' });
        const bodyLabelRow = h('div', { style: 'display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-sm);' });
        bodyLabelRow.appendChild(h('label', { className: 'form-label', style: 'margin-bottom: 0;' }, 'Body'));
        
        // Add upload button for importing text from files (v0.12.3)
        const importBodyBtn = h('button', {
          type: 'button',
          className: 'btn',
          style: 'font-size: var(--text-sm);',
          onclick: function() {
            const fileInput = h('input', { type: 'file', accept: '.txt,.md,.text', style: 'display: none' });
            fileInput.onchange = function(e) {
              const file = e.target.files[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = function(ev) {
                  const currentBody = document.getElementById('cardBody');
                  if (currentBody.value && !confirm('Replace existing content?')) {
                    currentBody.value += '\n\n' + ev.target.result;
                  } else {
                    currentBody.value = ev.target.result;
                  }
                  dirty = true;
                  showToast('Content imported from ' + file.name);
                };
                reader.onerror = function() {
                  showToast('Failed to read file', 'error');
                };
                reader.readAsText(file);
              }
            };
            fileInput.click();
          }
        }, 'Import from File');
        bodyLabelRow.appendChild(importBodyBtn);
        formGroup2.appendChild(bodyLabelRow);
        
        const bodyTextarea = h('textarea', { id: 'cardBody', className: 'form-textarea' });
        bodyTextarea.value = card.body;
        bodyTextarea.addEventListener('input', () => { dirty = true; });
        formGroup2.appendChild(bodyTextarea);
        form.appendChild(formGroup2);
        // Tags input with autocomplete
        const formGroupTags = h('div', { className: 'form-group' });
        formGroupTags.appendChild(h('label', { className: 'form-label' }, 'Tags (comma-separated)'));
        
        // Create datalist with all existing tags for autocomplete
        const tagsDatalistId = 'tags-datalist-' + Date.now();
        const tagsDatalist = h('datalist', { id: tagsDatalistId });
        const existingTags = getAllTags();
        existingTags.forEach(tag => {
          tagsDatalist.appendChild(h('option', { value: tag }));
        });
        
        const tagsInput = h('input', { 
          type: 'text', 
          id: 'cardTags', 
          className: 'form-input',
          list: tagsDatalistId,
          placeholder: 'Start typing to see suggestions...'
        });
        tagsInput.value = (card.tags && card.tags.length) ? card.tags.join(', ') : '';
        tagsInput.addEventListener('input', () => { dirty = true; });
        
        formGroupTags.appendChild(tagsInput);
        formGroupTags.appendChild(tagsDatalist);
        form.appendChild(formGroupTags);
        
        // Add "Suggest Tags" button
        if (editing && card.id) {
          const suggestBtn = h('button', {
            type: 'button',
            className: 'btn btn-secondary',
            onclick: () => showTagSuggestions(card.id),
            style: 'margin-top: var(--space-sm);'
          }, 'Suggest Tags');
          formGroupTags.appendChild(suggestBtn);
        }
    
        const formGroup3 = h('div', { className: 'form-group' });
        formGroup3.appendChild(h('label', { className: 'form-label' }, 'Parent Card'));
        const parentSel = h('select', { id: 'cardParent', className: 'form-select' });
        const parVal = card.parentId || '';
        parentSel.appendChild(h('option', { value: '', selected: !parVal }, '(Root Level)'));
        Object.values(store.cards)
          .filter(c => c.id !== card.id)
          .sort((a, b) => {
            const A = (a.title || '').toLowerCase();
            const B = (b.title || '').toLowerCase();
            return A.localeCompare(B);
          })
          .forEach(c => {
            parentSel.appendChild(h('option', { value: c.id, selected: parVal === c.id }, c.title || '(Untitled)'));
          });
        parentSel.addEventListener('change', () => { dirty = true; });
        formGroup3.appendChild(parentSel);
        form.appendChild(formGroup3);
        let childrenInpMap = {};
        if (editing) {
          const formGroup4 = h('div', { className: 'form-group' });
          formGroup4.appendChild(h('label', { className: 'form-label form-section-title' }, 'Children'));
          const kidsWrap = h('div', { className: 'form-children' });
          card.children.forEach(cid => {
            const c = store.cards[cid];
            const row = h('div', { className: 'form-child-row' });
            const chInp = h('input', { type: 'text', value: c.title, className: 'form-input form-child-input' });
            chInp.addEventListener('input', () => { dirty = true; });
            row.appendChild(chInp);
            const delBtn = h('button', {
              type: 'button',
              className: 'form-child-delete',
              onclick: () => {
                if (confirm('Delete child and all its children?')) {
                  deleteCard(cid);
                  save();
                  render();
                }
              }
            }, '✕');
            row.appendChild(delBtn);
            childrenInpMap[cid] = chInp;
            kidsWrap.appendChild(row);
          });
          formGroup4.appendChild(kidsWrap);
          form.appendChild(formGroup4);
          const formGroup5 = h('div', { className: 'form-group' });
          formGroup5.appendChild(h('label', { className: 'form-label form-section-title' }, 'Add New Children'));
          const newKidsWrap = h('div', { className: 'form-children', id: 'addChildList' });
          const addChildRow = (title = '') => {
            const r = h('div', { className: 'form-child-row' });
            const t = h('input', { type: 'text', value: title, placeholder: 'Child title...', className: 'form-input form-child-input' });
            t.addEventListener('input', () => { dirty = true; });
            const d = h('button', { type: 'button', className: 'form-child-delete', onclick: () => { r.remove(); } }, '✕');
            r.appendChild(t);
            r.appendChild(d);
            newKidsWrap.appendChild(r);
          };
          addChildRow();
          formGroup5.appendChild(newKidsWrap);
          formGroup5.appendChild(h('button', { type: 'button', className: 'btn', onclick: () => addChildRow() }, '+ Add Another Child'));
          form.appendChild(formGroup5);
        } else {
          const formGroup4 = h('div', { className: 'form-group' });
          formGroup4.appendChild(h('label', { className: 'form-label form-section-title' }, 'Add Children Now (title only)'));
          const kidsWrap = h('div', { className: 'form-children', id: 'addChildList' });
          const addChildRow = (title = '') => {
            const r = h('div', { className: 'form-child-row' });
            const t = h('input', { type: 'text', value: title, placeholder: 'Child title...', className: 'form-input form-child-input' });
            t.addEventListener('input', () => { dirty = true; });
            const d = h('button', { type: 'button', className: 'form-child-delete', onclick: () => { r.remove(); } }, '✕');
            r.appendChild(t);
            r.appendChild(d);
            kidsWrap.appendChild(r);
          };
          addChildRow();
          formGroup4.appendChild(kidsWrap);
          formGroup4.appendChild(h('button', { type: 'button', className: 'btn', onclick: () => addChildRow() }, '+ Add Another Child'));
          form.appendChild(formGroup4);
        }
        const formActions = h('div', { className: 'form-actions' });
        formActions.appendChild(h('button', { type: 'submit', className: 'btn btn-primary' }, 'Save'));
        formActions.appendChild(h('button', { type: 'button', className: 'btn', onclick: () => editing ? goTo('read', { cardId: card.id }) : goBack() }, 'Cancel'));
        if (editing) {
          formActions.appendChild(h('button', {
            type: 'button',
            className: 'btn btn-danger',
            onclick: () => {
              if (confirm('Delete this card and all children?')) {
                deleteCard(card.id);
                save();
                goTo('list', { cardId: card.parentId ?? null });
              }
            }
          }, 'Delete'));
        }
        form.appendChild(formActions);
        main.appendChild(h('div', { className: 'page-title' }, editing ? 'Edit Card' : 'New Card'));
        main.appendChild(form);
      }

      /**
       * Render search results page
       */
      function renderSearchResults() {
        searchContainer.style.display = 'none';
        const query = navState.searchQuery.trim();
        if (!query) {
          main.appendChild(h('div', { className: 'empty' }, 'Please enter a search term.'));
          return;
        }
        
        // Get selected dataset scope
        const scope = datasetSelector ? datasetSelector.value : 'current';
        
        // Show loading indicator
        main.appendChild(h('div', { className: 'page-title' }, `Search: "${navState.searchQuery}"`));
        const loadingDiv = h('div', { 
          className: 'search-info',
          style: 'padding: 12px; margin-bottom: 12px; background: var(--bg-secondary); border-radius: 8px; font-size: 14px; color: var(--text-secondary);'
        }, 'Searching...');
        main.appendChild(loadingDiv);
        
        // Use multi-dataset fuzzy search for typo-tolerant results
        fuzzySearchMultiDataset(query, scope).then(fuzzyResults => {
          // Remove loading indicator
          loadingDiv.remove();

          const hookResults = fuzzyResults.map(result => ({
            ...result,
            card: cloneCard(result.card)
          }));
          runModHook('onSearch', query, hookResults);

          if (fuzzyResults.length === 0) {
            main.appendChild(h('div', { className: 'empty' }, 'No results found. Try different keywords.'));
          } else {
            // Show result count with fuzzy indicator
            const scopeText = scope === 'all' ? ' across all datasets' : '';
            const resultInfo = h('div', { 
              className: 'search-info',
              style: 'padding: 12px; margin-bottom: 12px; background: var(--bg-secondary); border-radius: 8px; font-size: 14px; color: var(--text-secondary);'
            }, `Found ${fuzzyResults.length} result${fuzzyResults.length === 1 ? '' : 's'}${scopeText} (fuzzy matching enabled)`);
            main.appendChild(resultInfo);
            
            const gridViewEnabled = localStorage.getItem('cardspoke_gridView') === 'true';
          const gridClass = gridViewEnabled ? 'card-grid grid-view' : 'card-grid';
          const grid = h('div', { className: gridClass });
            fuzzyResults.forEach(result => {
              const card = result.card;
              const cardEl = renderCardTile(card);
              
              // Add dataset badge for multi-dataset search
              if (scope === 'all' && result.datasetName) {
                const datasetBadge = h('span', {
                  style: 'position: absolute; top: 8px; left: 8px; background: #3b82f6; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600;'
                }, result.datasetName);
                cardEl.style.position = 'relative';
                cardEl.appendChild(datasetBadge);
              }
              
              // Add match quality indicator
              if (result.score < 60) {
                const matchBadge = h('span', {
                  style: 'position: absolute; top: 8px; right: 8px; background: #fbbf24; color: #000; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600;'
                }, '~');
                cardEl.style.position = 'relative';
                cardEl.appendChild(matchBadge);
              }
              
              grid.appendChild(cardEl);
              runModHook('onCardRender', cloneCard(card), cardEl);
            });
            main.appendChild(grid);
          }
        }).catch(err => {
          loadingDiv.remove();
          main.appendChild(h('div', { className: 'empty' }, 'Search error: ' + err.message));
        });
      }


      /**
       * Main render function - orchestrates page rendering
       */
      function render() {
        try {
          renderBreadcrumbs();
          main.innerHTML = '';
          switch (navState.page) {
            case 'read':
              renderReadOnlyCard();
              break;
            case 'list':
              renderCardList();
              break;
            case 'search':
              renderSearchResults();
              break;
            case 'edit':
              renderEditCard();
              break;
            default:
              renderCardList();
          }
        } catch (e) {
          bootError('Render failed: ' + (e.message || e));
        }
      }

      // =============================================================
      // --- THEME MANAGEMENT ---
      // Handle dark/light theme switching
      // =============================================================

      /**
       * Apply theme (light or dark mode)
       * @param {'light'|'dark'} theme - Theme to apply
       */
      function applyTheme(theme) {
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        
        // Save to store for persistence across dataset switches
        store.activeTheme = theme;
        save();
        
        try {
          localStorage.setItem('cardspoke_theme', theme);
        } catch { }
        
        // Sync header button
        const moonIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
        const sunIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
        if (header.themeToggle) header.themeToggle.innerHTML = theme === 'dark' ? sunIcon : moonIcon;
        
        // Run mod hook
        runModHook('onThemeChange', theme);
      }
      
      // =============================================================
      // --- APP FOOTER ---
      // Populate footer with version and attribution information
      // =============================================================
      
      /**
       * Populate footer with app metadata
       * Enhanced with error handling and logging for debugging
       */
      function populateFooter() {
        try {
          const creatorEl = document.getElementById('app-creator');
          const versionEl = document.getElementById('app-version');
          const dateEl = document.getElementById('app-release-date');
          const updaterEl = document.getElementById('app-updater');

          // Verify all elements exist
          if (!creatorEl || !versionEl || !dateEl || !updaterEl) {
            console.error('[Footer] Missing footer elements:', {
              creator: !!creatorEl,
              version: !!versionEl,
              date: !!dateEl,
              updater: !!updaterEl
            });
            return;
          }

          // Populate elements
          creatorEl.textContent = APP_CREATOR;
          versionEl.textContent = APP_VERSION;
          dateEl.textContent = APP_RELEASE_DATE;
          updaterEl.textContent = APP_UPDATER;

          if (isDeveloperMode()) {
            console.log('[Footer] Populated successfully:', {
              creator: APP_CREATOR,
              version: APP_VERSION,
              date: APP_RELEASE_DATE,
              updater: APP_UPDATER
            });
          }
        } catch (error) {
          console.error('[Footer] Error populating footer:', error);
        }
      }

      /**
       * Update dataset selector options
       */
      function updateDatasetSelector() {
        if (!datasetSelector || !datasetManager) return;
        
        // Clear existing options
        datasetSelector.innerHTML = '';
        
        // Add "Current Dataset" option
        const currentOption = document.createElement('option');
        currentOption.value = 'current';
        currentOption.textContent = 'Current Dataset';
        datasetSelector.appendChild(currentOption);
        
        // Add "All Datasets" option if there are multiple datasets
        const datasets = datasetManager.listDatasets();
        if (datasets.length > 1) {
          const allOption = document.createElement('option');
          allOption.value = 'all';
          allOption.textContent = 'All Datasets';
          datasetSelector.appendChild(allOption);
          
          // Add separator
          const separator = document.createElement('option');
          separator.disabled = true;
          separator.textContent = '───────────';
          datasetSelector.appendChild(separator);
          
          // Add individual dataset options
          datasets.forEach(dataset => {
            const option = document.createElement('option');
            option.value = dataset.id;
            option.textContent = dataset.name + (dataset.isActive ? ' (active)' : '');
            datasetSelector.appendChild(option);
          });
        }
      }

      // =============================================================
      // --- INITIALIZATION & EVENT LISTENERS ---
      // Set up event handlers for user interactions
      // =============================================================

      // Initialize theme
      const savedTheme = store.activeTheme || localStorage.getItem('cardspoke_theme') || 'light';
      applyTheme(savedTheme);

      // --- Header Button Handlers ---
      
      header.themeToggle.onclick = () => {
        const isDark = document.documentElement.classList.contains('dark');
        applyTheme(isDark ? 'light' : 'dark');
      };
      
      // Apply saved high contrast mode on startup
      const savedHC = localStorage.getItem('cardspoke_highcontrast') === 'true';
      if (savedHC) document.documentElement.classList.add('high-contrast');
      
      // --- Menu Handlers ---
      
      // Focus trap cleanup function
      let menuFocusTrapCleanup = null;
      
      header.menuBtn.onclick = () => {
        menu.overlay.classList.add('show');
        // Set up focus trap for accessibility
        menuFocusTrapCleanup = trapFocus(menu.overlay.querySelector('.menu-panel'));
      };

      menu.closeBtn.onclick = () => {
        menu.overlay.classList.remove('show');
        if (menuFocusTrapCleanup) {
          menuFocusTrapCleanup();
          menuFocusTrapCleanup = null;
        }
      };

      menu.overlay.onclick = (e) => {
        if (e.target === menu.overlay) {
          menu.overlay.classList.remove('show');
          if (menuFocusTrapCleanup) {
            menuFocusTrapCleanup();
            menuFocusTrapCleanup = null;
          }
        }
      };

      menu.newCard.onclick = () => {
        menu.overlay.classList.remove('show');
        goTo('edit', { cardId: null, parentId: null });
      };

      menu.upload.onclick = () => {
        menu.overlay.classList.remove('show');
        updateImportLocationOptions();
        
        // Reset JSON import to root
        if (uploadModal.importLocationSelectJSON) {
          uploadModal.importLocationSelectJSON.value = 'root';
        }
        
        // Reset TXT import to root and outline
        if (uploadModal.importLocationSelectTXT) {
          uploadModal.importLocationSelectTXT.value = 'root';
        }
        const txtOutlineRadio = document.querySelector('input[name="txtImportMode"][value="outline"]');
        if (txtOutlineRadio) txtOutlineRadio.checked = true;

        // Reset DOCX import to have no card selected
        if (uploadModal.importLocationSelectDOCX) {
          uploadModal.importLocationSelectDOCX.value = '';
        }
        const docxAppendRadio = document.querySelector('input[name="docxImportMode"][value="append"]');
        if (docxAppendRadio) docxAppendRadio.checked = true;

        // Restore last used tab or default to json
        const lastTab = localStorage.getItem('cardspoke_lastUploadTab') || 'json';
        uploadModal.tabs.forEach(t => t.classList.remove('active'));
        uploadModal.tabContents.forEach(content => content.classList.remove('active'));
        const tabToActivate = document.querySelector(`.modal-tab[data-tab="${lastTab}"]`) || document.querySelector('.modal-tab[data-tab="json"]');
        const contentToActivate = document.getElementById(`tab-${lastTab}`) || document.getElementById('tab-json');
        if (tabToActivate) tabToActivate.classList.add('active');
        if (contentToActivate) contentToActivate.classList.add('active');
        
        // Show modal
        uploadModal.overlay.classList.add('show');
      };

      menu.extensionsHub.onclick = () => {
        menu.overlay.classList.remove('show');
        showExtensionsHub('installed');
      };

      if (menu.tagManager) {
        menu.tagManager.onclick = () => {
          menu.overlay.classList.remove('show');
          showTagManager();
        };
      }

      if (menu.advancedSearch) {
        menu.advancedSearch.onclick = () => {
          menu.overlay.classList.remove('show');
          showAdvancedSearch();
        };
      }

      if (menu.trashBin) {
        menu.trashBin.onclick = () => {
          menu.overlay.classList.remove('show');
          showTrashBin();
        };
      }

      menu.appearance.onclick = () => {
        menu.overlay.classList.remove('show');
        showAppearanceSettings();
      };

      menu.bookmarks.onclick = () => {
        menu.overlay.classList.remove('show');
        showBookmarks();
      };

      menu.recentCards.onclick = () => {
        menu.overlay.classList.remove('show');
        showRecentCards();
      };

      if (menu.typography) {
        menu.typography.onclick = () => {
          menu.overlay.classList.remove('show');
          showTypographySelector();
        };
      }

      menu.dataHub.onclick = () => {
        menu.overlay.classList.remove('show');
        showDataHub();
      };

      menu.clearAll.onclick = () => {
        menu.overlay.classList.remove('show');
        clearAllData();
      };

      menu.help.onclick = () => {
        menu.overlay.classList.remove('show');
        showHelp();
      };

      menu.keyboardShortcuts.onclick = () => {
        menu.overlay.classList.remove('show');
        showKeyboardHelp();
      };

      header.homeBtn.onclick = () => {
        goTo('list', { cardId: null });
      };

      header.brandBtn.onclick = () => {
        goTo('list', { cardId: null });
      };

      searchInput.addEventListener('input', (e) => {
        if (e.target.value.trim()) {
          searchClear.style.display = 'block';
        } else {
          searchClear.style.display = 'none';
        }
      });

      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && searchInput.value.trim()) {
          goTo('search', { searchQuery: searchInput.value.trim() });
        }
      });

      searchClear.onclick = () => {
        searchInput.value = '';
        searchClear.style.display = 'none';
        if (navState.page === 'search') goBack();
      };

      uploadModal.tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          const tabName = tab.getAttribute('data-tab');
          uploadModal.tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          uploadModal.tabContents.forEach(content => content.classList.remove('active'));
          document.getElementById(`tab-${tabName}`).classList.add('active');
          // Remember last used tab
          localStorage.setItem('cardspoke_lastUploadTab', tabName);
        });
      });

      uploadModal.closeBtn.onclick = () => {
        uploadModal.overlay.classList.remove('show');
      };

      uploadModal.overlay.onclick = (e) => {
        if (e.target === uploadModal.overlay) {
          uploadModal.overlay.classList.remove('show');
        }
      };

      uploadModal.fileUploadAreaJSON.onclick = () => {
        uploadModal.fileInputJSON.click();
      };

      uploadModal.fileInputJSON.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const data = JSON.parse(reader.result);
            const mode = uploadModal.importLocationSelectJSON.value || 'root';
            importJSON(data, mode);
            uploadModal.overlay.classList.remove('show');
          } catch (err) {
            showToast('Failed to parse JSON: ' + err.message, 'error');
          }
        };
        reader.readAsText(file);
      });

      uploadModal.fileUploadAreaTXT.onclick = () => {
        uploadModal.fileInputTXT.click();
      };

      uploadModal.fileInputTXT.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          const text = reader.result;
          const modeRadio = document.querySelector('input[name="txtImportMode"]:checked');
          const mode = modeRadio ? modeRadio.value : 'outline';
          const location = uploadModal.importLocationSelectTXT.value || 'root';
          importTXT(text, mode, location);
          uploadModal.overlay.classList.remove('show');
        };
        reader.readAsText(file);
      });

      uploadModal.fileUploadAreaDOCX.onclick = () => {
        uploadModal.fileInputDOCX.click();
      };

      uploadModal.fileInputDOCX.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          const text = '(DOCX text extraction not fully implemented - would need mammoth.js library)';
          const modeRadio = document.querySelector('input[name="docxImportMode"]:checked');
          const mode = modeRadio ? modeRadio.value : 'append';
          const targetCardId = uploadModal.importLocationSelectDOCX.value;
          importDOCX(text, mode, targetCardId);
          uploadModal.overlay.classList.remove('show');
        };
        reader.readAsArrayBuffer(file);
      });

      uploadModal.fileUploadAreaMods.onclick = () => {
        uploadModal.fileInputMods.click();
      };

      uploadModal.fileInputMods.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          try {
            let modData;
            if (file.name.endsWith('.json')) {
              modData = JSON.parse(reader.result);
            } else if (file.name.endsWith('.js')) {
              const modId = prompt('Enter mod ID:', file.name.replace('.js', ''));
              if (!modId) return;
              modData = {
                id: modId,
                js: reader.result,
                css: '',
                meta: { name: modId } // Basic meta
              };
            }
            if (modData) {
              const modId = modData.id || uid();
              store.mods[modId] = {
                enabled: false,
                js: modData.js || '',
                css: modData.css || '',
                meta: modData.meta || { name: modId } // Ensure meta exists
              };
              save();
              showToast('Mod installed: ' + (modData.meta.name || modId));
              uploadModal.overlay.classList.remove('show');
            }
          } catch (err) {
            showToast('Failed to install mod: ' + err.message, 'error');
          }
        };
        reader.readAsText(file);
      });

      uploadModal.installManualMod.onclick = () => {
        const modName = uploadModal.manualModName.value.trim();
        const modJS = uploadModal.manualModJS.value.trim();
        const modCSS = uploadModal.manualModCSS.value.trim();
        
        // *** ADDED: Get new meta values ***
        const modCreator = uploadModal.manualModCreator.value.trim();
        const modVersion = uploadModal.manualModVersion.value.trim();
        const modReleaseDate = uploadModal.manualModReleaseDate.value.trim();

        if (!modName || !modJS) {
          showToast('Please provide mod name and JS code', 'error');
          return;
        }
        const modId = modName.replace(/\s+/g, '-').toLowerCase();
        store.mods[modId] = {
          enabled: false,
          js: modJS,
          css: modCSS,
          meta: { // *** ADDED: Save new meta fields ***
            name: modName,
            creator: modCreator,
            version: modVersion,
            releaseDate: modReleaseDate
          }
        };
        save();
        showToast('Mod installed: ' + modName);
        uploadModal.overlay.classList.remove('show');
        
        // *** ADDED: Clear new fields ***
        uploadModal.manualModName.value = '';
        uploadModal.manualModCreator.value = '';
        uploadModal.manualModVersion.value = '';
        uploadModal.manualModReleaseDate.value = '';
        uploadModal.manualModJS.value = '';
        uploadModal.manualModCSS.value = '';
      };



      // =============================================================
      // --- UNDO/REDO SYSTEM (v0.12.0) ---
      // =============================================================
      
      /**
       * Push a state to the undo stack
       * @param {string} action - Description of the action
       * @param {Object} data - Data needed to undo
       */
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
      
      /**
       * Undo the last action
       */
      function undo() {
        if (undoStack.length === 0) {
          showToast('Nothing to undo', 'info');
          return false;
        }
        
        const action = undoStack.pop();
        
        try {
          switch (action.action) {
            case 'deleteCard':
              const cardData = action.data.card;
              store.cards[cardData.id] = cardData;
              if (cardData.parentId) {
                const parent = store.cards[cardData.parentId];
                if (parent && !parent.children.includes(cardData.id)) {
                  parent.children.push(cardData.id);
                }
              } else {
                if (!store.rootOrder.includes(cardData.id)) {
                  store.rootOrder.push(cardData.id);
                }
              }
              const trashIndex = trashBin.findIndex(t => t.card.id === cardData.id);
              if (trashIndex > -1) trashBin.splice(trashIndex, 1);
              break;
              
            case 'updateCard':
              Object.assign(store.cards[action.data.cardId], action.data.previousState);
              break;
              
            case 'createCard':
              const card = store.cards[action.data.cardId];
              if (card) {
                if (card.parentId) {
                  const parent = store.cards[card.parentId];
                  if (parent) parent.children = parent.children.filter(c => c !== card.id);
                } else {
                  store.rootOrder = store.rootOrder.filter(c => c !== card.id);
                }
                delete store.cards[action.data.cardId];
              }
              break;
              
            case 'addTag':
              removeTag(action.data.cardId, action.data.tag, true);
              break;
              
            case 'removeTag':
              addTag(action.data.cardId, action.data.tag, true);
              break;
              
            case 'moveCard':
              const movedCard = store.cards[action.data.cardId];
              if (movedCard) {
                const currentParent = store.cards[movedCard.parentId];
                if (currentParent) {
                  currentParent.children = currentParent.children.filter(c => c !== movedCard.id);
                } else {
                  store.rootOrder = store.rootOrder.filter(c => c !== movedCard.id);
                }
                movedCard.parentId = action.data.originalParentId;
                if (action.data.originalParentId) {
                  const origParent = store.cards[action.data.originalParentId];
                  if (origParent && !origParent.children.includes(movedCard.id)) {
                    origParent.children.push(movedCard.id);
                  }
                } else {
                  if (!store.rootOrder.includes(movedCard.id)) {
                    store.rootOrder.push(movedCard.id);
                  }
                }
              }
              break;
          }
          
          redoStack.push(action);
          save();
          render();
          showToast('Undo: ' + action.action, 'info');
          return true;
        } catch (err) {
          console.error('Undo failed:', err);
          showToast('Undo failed', 'error');
          return false;
        }
      }
      
      /**
       * Redo the last undone action
       */
      function redo() {
        if (redoStack.length === 0) {
          showToast('Nothing to redo', 'info');
          return false;
        }
        
        const action = redoStack.pop();
        
        try {
          switch (action.action) {
            case 'deleteCard':
              const cardId = action.data.card.id;
              const card = store.cards[cardId];
              if (card) {
                if (card.parentId) {
                  const parent = store.cards[card.parentId];
                  if (parent) parent.children = parent.children.filter(c => c !== cardId);
                } else {
                  store.rootOrder = store.rootOrder.filter(c => c !== cardId);
                }
                trashBin.unshift({ card: cloneCard(card), deletedAt: Date.now() });
                if (trashBin.length > MAX_TRASH_SIZE) trashBin.pop();
                delete store.cards[cardId];
              }
              break;
              
            case 'updateCard':
              Object.assign(store.cards[action.data.cardId], action.data.newState);
              break;
              
            case 'createCard':
              const newCard = action.data.card;
              store.cards[newCard.id] = newCard;
              if (newCard.parentId) {
                const parent = store.cards[newCard.parentId];
                if (parent && !parent.children.includes(newCard.id)) {
                  parent.children.push(newCard.id);
                }
              } else {
                if (!store.rootOrder.includes(newCard.id)) {
                  store.rootOrder.push(newCard.id);
                }
              }
              break;
              
            case 'addTag':
              addTag(action.data.cardId, action.data.tag, true);
              break;
              
            case 'removeTag':
              removeTag(action.data.cardId, action.data.tag, true);
              break;
              
            case 'moveCard':
              const mvCard = store.cards[action.data.cardId];
              if (mvCard) {
                const oldParent = store.cards[mvCard.parentId];
                if (oldParent) {
                  oldParent.children = oldParent.children.filter(c => c !== mvCard.id);
                } else {
                  store.rootOrder = store.rootOrder.filter(c => c !== mvCard.id);
                }
                mvCard.parentId = action.data.newParentId;
                if (action.data.newParentId) {
                  const newParent = store.cards[action.data.newParentId];
                  if (newParent && !newParent.children.includes(mvCard.id)) {
                    newParent.children.push(mvCard.id);
                  }
                } else {
                  if (!store.rootOrder.includes(mvCard.id)) {
                    store.rootOrder.push(mvCard.id);
                  }
                }
              }
              break;
          }
          
          undoStack.push(action);
          save();
          render();
          showToast('Redo: ' + action.action, 'info');
          return true;
        } catch (err) {
          console.error('Redo failed:', err);
          showToast('Redo failed', 'error');
          return false;
        }
      }
      
      /**
       * Show trash bin modal
       */
      function showTrashBin() {
        const overlay = h('div', { className: 'modal-overlay show' });
        const modal = h('div', { className: 'modal', style: 'max-width: 600px;' });
        const modalHeader = h('div', { className: 'modal-header' });
        modalHeader.appendChild(h('div', { className: 'modal-title' }, 'Trash Bin'));
        const closeBtn = h('button', { className: 'modal-close', onclick: () => overlay.remove() }, 'X');
        modalHeader.appendChild(closeBtn);
        modal.appendChild(modalHeader);
        
        const modalBody = h('div', { className: 'modal-body' });
        
        if (trashBin.length === 0) {
          modalBody.appendChild(h('div', { className: 'empty' }, 'Trash bin is empty'));
        } else {
          const description = h('p', { style: 'margin-bottom: var(--space-lg); color: var(--text-secondary);' },
            trashBin.length + ' item(s) in trash. Restore or permanently delete items.');
          modalBody.appendChild(description);
          
          trashBin.forEach((item, index) => {
            const itemDiv = h('div', {
              style: 'background: var(--bg-secondary); padding: var(--space-lg); border-radius: var(--radius); border: 1px solid var(--border); margin-bottom: var(--space-md); display: flex; justify-content: space-between; align-items: center;'
            });
            
            const info = h('div', { style: 'flex: 1;' });
            info.appendChild(h('div', { style: 'font-weight: 700;' }, item.card.title || '(Untitled)'));
            info.appendChild(h('div', { style: 'font-size: 0.875rem; color: var(--text-secondary);' },
              'Deleted: ' + new Date(item.deletedAt).toLocaleString()));
            itemDiv.appendChild(info);
            
            const actions = h('div', { style: 'display: flex; gap: var(--space-sm);' });
            
            const restoreBtn = h('button', {
              className: 'btn btn-primary',
              onclick: () => {
                store.cards[item.card.id] = item.card;
                if (item.card.parentId) {
                  const parent = store.cards[item.card.parentId];
                  if (parent && !parent.children.includes(item.card.id)) {
                    parent.children.push(item.card.id);
                  }
                } else {
                  if (!store.rootOrder.includes(item.card.id)) {
                    store.rootOrder.push(item.card.id);
                  }
                }
                trashBin.splice(index, 1);
                save();
                overlay.remove();
                showTrashBin();
                showToast('Card restored: ' + (item.card.title || '(Untitled)'));
                render();
              }
            }, 'Restore');
            actions.appendChild(restoreBtn);
            
            const deleteBtn = h('button', {
              className: 'btn btn-danger',
              onclick: () => {
                if (confirm('Permanently delete this card?')) {
                  trashBin.splice(index, 1);
                  overlay.remove();
                  showTrashBin();
                  showToast('Card permanently deleted');
                }
              }
            }, 'Delete');
            actions.appendChild(deleteBtn);
            
            itemDiv.appendChild(actions);
            modalBody.appendChild(itemDiv);
          });
          
          const emptyBtn = h('button', {
            className: 'btn btn-danger',
            style: 'width: 100%; margin-top: var(--space-lg);',
            onclick: () => {
              if (confirm('Permanently delete all items in trash?')) {
                trashBin.length = 0;
                overlay.remove();
                showToast('Trash emptied');
              }
            }
          }, 'Empty Trash');
          modalBody.appendChild(emptyBtn);
        }
        
        modal.appendChild(modalBody);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        overlay.onclick = (e) => {
          if (e.target === overlay) overlay.remove();
        };
      }

      // =============================================================
      // --- TAG MANAGEMENT SYSTEM (v0.12.0) ---
      // =============================================================
      
      /**
       * Rename a tag across all cards
       */
      function renameTag(oldTag, newTag) {
        const normalizedOld = oldTag.replace(/^#/, '').toLowerCase().trim();
        const normalizedNew = newTag.replace(/^#/, '').toLowerCase().trim();
        
        if (!normalizedOld || !normalizedNew) return 0;
        if (normalizedOld === normalizedNew) return 0;
        
        let count = 0;
        Object.values(store.cards).forEach(card => {
          if (card.tags && card.tags.includes(normalizedOld)) {
            card.tags = card.tags.map(t => t === normalizedOld ? normalizedNew : t);
            card.tags = [...new Set(card.tags)];
            card.updatedAt = Date.now();
            count++;
          }
        });
        
        if (count > 0) save();
        return count;
      }
      
      /**
       * Merge two tags
       */
      function mergeTags(tag1, tag2) {
        return renameTag(tag1, tag2);
      }
      
      /**
       * Delete a tag from all cards
       */
      function deleteTagGlobal(tag) {
        const normalizedTag = tag.replace(/^#/, '').toLowerCase().trim();
        if (!normalizedTag) return 0;
        
        let count = 0;
        Object.values(store.cards).forEach(card => {
          if (card.tags && card.tags.includes(normalizedTag)) {
            card.tags = card.tags.filter(t => t !== normalizedTag);
            card.updatedAt = Date.now();
            count++;
          }
        });
        
        if (count > 0) save();
        return count;
      }
      
      /**
       * Get tag statistics
       */
      function getTagStats() {
        const tagCounts = {};
        Object.values(store.cards).forEach(card => {
          if (card.tags) {
            card.tags.forEach(tag => {
              tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
          }
        });
        return Object.entries(tagCounts)
          .map(([tag, count]) => ({ tag, count }))
          .sort((a, b) => b.count - a.count);
      }
      
      /**
       * Show tag manager modal
       */
      function showTagManager() {
        const overlay = h('div', { className: 'modal-overlay show' });
        const modal = h('div', { className: 'modal', style: 'max-width: 700px;' });
        const modalHeader = h('div', { className: 'modal-header' });
        modalHeader.appendChild(h('div', { className: 'modal-title' }, 'Tag Manager'));
        const closeBtn = h('button', { className: 'modal-close', onclick: () => overlay.remove() }, 'X');
        modalHeader.appendChild(closeBtn);
        modal.appendChild(modalHeader);
        
        const modalBody = h('div', { className: 'modal-body' });
        const tagStats = getTagStats();
        
        if (tagStats.length === 0) {
          modalBody.appendChild(h('div', { className: 'empty' }, 'No tags found. Add tags to your cards to manage them here.'));
        } else {
          const summary = h('div', { style: 'background: var(--bg-secondary); padding: var(--space-lg); border-radius: var(--radius); margin-bottom: var(--space-xl);' });
          summary.appendChild(h('div', { style: 'font-weight: 700; margin-bottom: var(--space-sm);' }, 
            tagStats.length + ' unique tags across ' + Object.keys(store.cards).length + ' cards'));
          modalBody.appendChild(summary);
          
          tagStats.forEach(function(tagStat) {
            const tag = tagStat.tag;
            const count = tagStat.count;
            const tagItem = h('div', {
              style: 'background: var(--bg-secondary); padding: var(--space-lg); border-radius: var(--radius); border: 1px solid var(--border); margin-bottom: var(--space-md); display: flex; justify-content: space-between; align-items: center;'
            });
            
            const tagInfo = h('div', { style: 'display: flex; align-items: center; gap: var(--space-md);' });
            const tagChip = h('span', { 
              className: 'card-tag',
              style: 'cursor: pointer;',
              onclick: function() {
                overlay.remove();
                goTo('search', { searchQuery: '#' + tag });
              }
            }, tag);
            tagInfo.appendChild(tagChip);
            tagInfo.appendChild(h('span', { style: 'color: var(--text-secondary);' }, '(' + count + ' card' + (count !== 1 ? 's' : '') + ')'));
            tagItem.appendChild(tagInfo);
            
            const actions = h('div', { style: 'display: flex; gap: var(--space-sm);' });
            
            const renameBtn = h('button', {
              className: 'btn',
              style: 'font-size: var(--text-sm);',
              onclick: function() {
                const newName = prompt('Rename tag "' + tag + '" to:', tag);
                if (newName && newName.trim() !== tag) {
                  const affected = renameTag(tag, newName.trim());
                  if (affected > 0) {
                    showToast('Renamed "' + tag + '" to "' + newName.trim() + '" in ' + affected + ' card(s)');
                    overlay.remove();
                    showTagManager();
                  }
                }
              }
            }, 'Rename');
            actions.appendChild(renameBtn);
            
            const mergeBtn = h('button', {
              className: 'btn',
              style: 'font-size: var(--text-sm);',
              onclick: function() {
                const otherTags = tagStats.map(function(t) { return t.tag; }).filter(function(t) { return t !== tag; });
                if (otherTags.length === 0) {
                  showToast('No other tags to merge with', 'info');
                  return;
                }
                const targetTag = prompt('Merge "' + tag + '" into which tag?\n\nAvailable: ' + otherTags.join(', '));
                if (targetTag && otherTags.includes(targetTag.trim().toLowerCase())) {
                  const affected = mergeTags(tag, targetTag.trim());
                  if (affected > 0) {
                    showToast('Merged "' + tag + '" into "' + targetTag.trim() + '" (' + affected + ' card(s))');
                    overlay.remove();
                    showTagManager();
                  }
                }
              }
            }, 'Merge');
            actions.appendChild(mergeBtn);
            
            const deleteBtn = h('button', {
              className: 'btn btn-danger',
              style: 'font-size: var(--text-sm);',
              onclick: function() {
                if (confirm('Delete tag "' + tag + '" from all ' + count + ' card(s)?')) {
                  const affected = deleteTagGlobal(tag);
                  showToast('Deleted tag "' + tag + '" from ' + affected + ' card(s)');
                  overlay.remove();
                  showTagManager();
                }
              }
            }, 'Delete');
            actions.appendChild(deleteBtn);
            
            tagItem.appendChild(actions);
            modalBody.appendChild(tagItem);
          });
        }
        
        modal.appendChild(modalBody);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        overlay.onclick = function(e) {
          if (e.target === overlay) overlay.remove();
        };
      }

      // =============================================================
      // --- ADVANCED SEARCH (v0.12.0) ---
      // =============================================================
      
      /**
       * Show advanced search modal with filters
       */
      function showAdvancedSearch() {
        const overlay = h('div', { className: 'modal-overlay show' });
        const modal = h('div', { className: 'modal', style: 'max-width: 600px;' });
        const modalHeader = h('div', { className: 'modal-header' });
        modalHeader.appendChild(h('div', { className: 'modal-title' }, 'Advanced Search'));
        const closeBtn = h('button', { className: 'modal-close', onclick: () => overlay.remove() }, 'X');
        modalHeader.appendChild(closeBtn);
        modal.appendChild(modalHeader);
        
        const modalBody = h('div', { className: 'modal-body' });
        
        // Search query
        const queryGroup = h('div', { style: 'margin-bottom: var(--space-lg);' });
        queryGroup.appendChild(h('label', { style: 'display: block; margin-bottom: var(--space-xs); font-weight: 600;' }, 'Search Text'));
        const queryInput = h('input', {
          type: 'text',
          placeholder: 'Search in titles and content...',
          style: 'width: 100%; padding: var(--space-md); border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg-primary); color: var(--text-primary); font-size: 1rem;'
        });
        queryGroup.appendChild(queryInput);
        modalBody.appendChild(queryGroup);
        
        // Filter by tag
        const tagGroup = h('div', { style: 'margin-bottom: var(--space-lg);' });
        tagGroup.appendChild(h('label', { style: 'display: block; margin-bottom: var(--space-xs); font-weight: 600;' }, 'Filter by Tag'));
        const tagSelect = h('select', {
          style: 'width: 100%; padding: var(--space-md); border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg-primary); color: var(--text-primary); font-size: 1rem;'
        });
        tagSelect.appendChild(h('option', { value: '' }, 'Any tag'));
        getAllTags().forEach(function(tag) {
          tagSelect.appendChild(h('option', { value: tag }, tag));
        });
        tagGroup.appendChild(tagSelect);
        modalBody.appendChild(tagGroup);
        
        // Filter by bookmarked
        const bookmarkGroup = h('div', { style: 'margin-bottom: var(--space-lg);' });
        const bookmarkCheck = h('label', { style: 'display: flex; align-items: center; gap: var(--space-sm); cursor: pointer;' });
        const bookmarkInput = h('input', { type: 'checkbox' });
        bookmarkCheck.appendChild(bookmarkInput);
        bookmarkCheck.appendChild(document.createTextNode('Only show bookmarked cards'));
        bookmarkGroup.appendChild(bookmarkCheck);
        modalBody.appendChild(bookmarkGroup);
        
        // Filter by date
        const dateGroup = h('div', { style: 'margin-bottom: var(--space-lg);' });
        dateGroup.appendChild(h('label', { style: 'display: block; margin-bottom: var(--space-xs); font-weight: 600;' }, 'Created/Modified'));
        const dateSelect = h('select', {
          style: 'width: 100%; padding: var(--space-md); border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg-primary); color: var(--text-primary); font-size: 1rem;'
        });
        dateSelect.appendChild(h('option', { value: '' }, 'Any time'));
        dateSelect.appendChild(h('option', { value: 'today' }, 'Today'));
        dateSelect.appendChild(h('option', { value: 'week' }, 'Past 7 days'));
        dateSelect.appendChild(h('option', { value: 'month' }, 'Past 30 days'));
        dateGroup.appendChild(dateSelect);
        modalBody.appendChild(dateGroup);
        
        // Search button
        const searchBtn = h('button', {
          className: 'btn btn-primary',
          style: 'width: 100%;',
          onclick: function() {
            const query = queryInput.value.trim();
            const tagFilter = tagSelect.value;
            const bookmarkOnly = bookmarkInput.checked;
            const dateFilter = dateSelect.value;
            
            // Store filters
            sessionStorage.setItem('searchFilters', JSON.stringify({
              query: query, tagFilter: tagFilter, bookmarkOnly: bookmarkOnly, dateFilter: dateFilter
            }));
            
            overlay.remove();
            goTo('search', { searchQuery: query || '*' });
          }
        }, 'Search');
        modalBody.appendChild(searchBtn);
        
        modal.appendChild(modalBody);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        overlay.onclick = function(e) {
          if (e.target === overlay) overlay.remove();
        };
        
        setTimeout(function() { queryInput.focus(); }, 100);
      }

      // =============================================================
      // --- MARKDOWN PREVIEW (v0.12.0) ---
      // =============================================================
      
      /**
       * Simple markdown to HTML conversion
       */
      function simpleMarkdown(text) {
        if (!text) return '';
        
        var html = text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        
        // Headers
        html = html.replace(/^### (.+)$/gm, '<h4>$1</h4>');
        html = html.replace(/^## (.+)$/gm, '<h3>$1</h3>');
        html = html.replace(/^# (.+)$/gm, '<h2>$1</h2>');
        
        // Bold and italic
        html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
        
        // Code
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Lists
        html = html.replace(/^\* (.+)$/gm, '<li>$1</li>');
        html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
        
        // Blockquotes
        html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
        
        // Line breaks
        html = html.replace(/\n\n/g, '</p><p>');
        html = '<p>' + html + '</p>';
        
        return html;
      }

      // =============================================================
      // --- EXTENSIONS STORE PLACEHOLDER (v0.12.0) ---
      // =============================================================
      
      /**
       * Show extensions store modal
       */
      function showExtensionsStore() {
        const overlay = h('div', { className: 'modal-overlay show' });
        const modal = h('div', { className: 'modal', style: 'max-width: 800px;' });
        const modalHeader = h('div', { className: 'modal-header' });
        modalHeader.appendChild(h('div', { className: 'modal-title' }, 'Extensions Store'));
        const closeBtn = h('button', { className: 'modal-close', onclick: () => overlay.remove() }, 'X');
        modalHeader.appendChild(closeBtn);
        modal.appendChild(modalHeader);
        
        const modalBody = h('div', { className: 'modal-body' });
        
        // Coming soon banner
        const banner = h('div', {
          style: 'background: linear-gradient(135deg, var(--primary), #1565c0); color: white; padding: var(--space-2xl); border-radius: var(--radius); margin-bottom: var(--space-xl); text-align: center;'
        });
        banner.appendChild(h('div', { style: 'font-size: 48px; margin-bottom: var(--space-md);' }, ''));
        banner.appendChild(h('div', { style: 'font-size: var(--text-xl); font-weight: 700; margin-bottom: var(--space-sm);' }, 'Extensions Store Coming Soon'));
        banner.appendChild(h('div', { style: 'opacity: 0.9;' }, 'Browse, install, and manage extensions from the community'));
        modalBody.appendChild(banner);
        
        // Categories preview
        modalBody.appendChild(h('h3', { style: 'margin-bottom: var(--space-md);' }, 'Featured Categories'));
        
        const categories = [
          { icon: '', name: 'Themes', desc: 'Visual styles and color schemes' },
          { icon: '', name: 'Tools', desc: 'Productivity extensions' },
          { icon: '', name: 'Analytics', desc: 'Data visualization' },
          { icon: '', name: 'Integrations', desc: 'External services' }
        ];
        
        const categoryGrid = h('div', {
          style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: var(--space-md); margin-bottom: var(--space-xl);'
        });
        
        categories.forEach(function(cat) {
          const catItem = h('div', {
            style: 'background: var(--bg-secondary); padding: var(--space-lg); border-radius: var(--radius); border: 1px solid var(--border); text-align: center;'
          });
          catItem.appendChild(h('div', { style: 'font-size: 32px; margin-bottom: var(--space-sm);' }, cat.icon));
          catItem.appendChild(h('div', { style: 'font-weight: 700;' }, cat.name));
          catItem.appendChild(h('div', { style: 'font-size: var(--text-sm); color: var(--text-secondary);' }, cat.desc));
          catItem.appendChild(h('div', { style: 'font-size: var(--text-sm); color: var(--primary); margin-top: var(--space-sm);' }, 'Coming soon'));
          categoryGrid.appendChild(catItem);
        });
        
        modalBody.appendChild(categoryGrid);
        
        // Current extensions link
        const currentBtn = h('button', {
          className: 'btn',
          style: 'width: 100%;',
          onclick: function() {
            overlay.remove();
            showModsManager();
          }
        }, 'Manage Installed Extensions');
        modalBody.appendChild(currentBtn);
        
        modal.appendChild(modalBody);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        overlay.onclick = function(e) {
          if (e.target === overlay) overlay.remove();
        };
      }

      // =============================================================
      // --- BULK IMPORT/EXPORT (v0.12.0) ---
      // =============================================================
      
      /**
       * Bulk export cards
       */
      function bulkExportCards(cardIds, format) {
        format = format || 'json';
        if (!cardIds || cardIds.length === 0) {
          showToast('No cards selected for export', 'error');
          return;
        }
        
        const exportCards = {};
        function includeChildren(id) {
          const card = store.cards[id];
          if (!card) return;
          exportCards[id] = cloneCard(card);
          card.children.forEach(function(childId) { includeChildren(childId); });
        }
        
        cardIds.forEach(function(id) { includeChildren(id); });
        
        var content, filename, mimeType;
        
        if (format === 'markdown') {
          content = Object.values(exportCards).map(function(card) {
            var md = '# ' + (card.title || '(Untitled)') + '\n\n';
            if (card.tags && card.tags.length) {
              md += 'Tags: ' + card.tags.map(function(t) { return '#' + t; }).join(' ') + '\n\n';
            }
            md += card.body || '';
            return md;
          }).join('\n\n---\n\n');
          filename = 'cardspoke-export-' + Date.now() + '.md';
          mimeType = 'text/markdown';
        } else if (format === 'txt') {
          content = Object.values(exportCards).map(function(card) {
            var txt = '=== ' + (card.title || '(Untitled)') + ' ===\n\n';
            if (card.tags && card.tags.length) {
              txt += 'Tags: ' + card.tags.join(', ') + '\n\n';
            }
            txt += card.body || '';
            return txt;
          }).join('\n\n' + '='.repeat(50) + '\n\n');
          filename = 'cardspoke-export-' + Date.now() + '.txt';
          mimeType = 'text/plain';
        } else {
          content = JSON.stringify({
            exportedAt: new Date().toISOString(),
            cardCount: Object.keys(exportCards).length,
            cards: exportCards
          }, null, 2);
          filename = 'cardspoke-export-' + Date.now() + '.json';
          mimeType = 'application/json';
        }
        
        downloadWithFeedback(content, filename, mimeType);
        showToast('Exported ' + Object.keys(exportCards).length + ' card(s)');
      }
      
      /**
       * Bulk import cards from JSON
       */
      function bulkImportCards(importData, targetParentId) {
        try {
          var cards = {};
          
          if (importData.cards) {
            cards = importData.cards;
          } else if (Array.isArray(importData)) {
            importData.forEach(function(card) {
              cards[card.id || uid()] = card;
            });
          } else if (importData.id) {
            cards[importData.id] = importData;
          }
          
          var idMap = {};
          
          Object.keys(cards).forEach(function(oldId) {
            idMap[oldId] = uid();
          });
          
          Object.values(cards).forEach(function(card) {
            var newId = idMap[card.id];
            var newCard = {
              id: newId,
              title: card.title || '',
              body: card.body || '',
              parentId: card.parentId ? (idMap[card.parentId] || targetParentId) : targetParentId,
              children: card.children ? card.children.map(function(cid) { return idMap[cid]; }).filter(Boolean) : [],
              tags: card.tags || [],
              createdAt: Date.now(),
              updatedAt: Date.now()
            };
            
            store.cards[newId] = newCard;
            
            if (newCard.parentId) {
              var parent = store.cards[newCard.parentId];
              if (parent && !parent.children.includes(newId)) {
                parent.children.push(newId);
              }
            } else {
              if (!store.rootOrder.includes(newId)) {
                store.rootOrder.push(newId);
              }
            }
          });
          
          save();
          return Object.keys(cards).length;
        } catch (err) {
          console.error('Bulk import failed:', err);
          showToast('Import failed: ' + err.message, 'error');
          return 0;
        }
      }

      // =============================================================
      // --- DRAG AND DROP (v0.12.0) ---
      // =============================================================
      
      /**
       * Handle drag start
       */
      function handleDragStart(e, cardId) {
        draggedCardId = cardId;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', cardId);
        e.target.style.opacity = '0.5';
      }
      
      /**
       * Handle drag end
       */
      function handleDragEnd(e) {
        e.target.style.opacity = '1';
        draggedCardId = null;
        dragOverCardId = null;
        document.querySelectorAll('.drag-over').forEach(function(el) { el.classList.remove('drag-over'); });
      }
      
      /**
       * Handle drag over
       */
      function handleDragOver(e, cardId) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        if (dragOverCardId !== cardId) {
          document.querySelectorAll('.drag-over').forEach(function(el) { el.classList.remove('drag-over'); });
          if (cardId !== draggedCardId) {
            var tile = e.target.closest('.card-tile');
            if (tile) tile.classList.add('drag-over');
          }
          dragOverCardId = cardId;
        }
      }
      
      /**
       * Handle drop
       */
      function handleDrop(e, targetCardId) {
        e.preventDefault();
        var tile = e.target.closest('.card-tile');
        if (tile) tile.classList.remove('drag-over');
        
        if (!draggedCardId || draggedCardId === targetCardId) return;
        
        var draggedCard = store.cards[draggedCardId];
        var targetCard = store.cards[targetCardId];
        
        if (!draggedCard || !targetCard) return;
        
        if (isDescendant(targetCardId, draggedCardId)) {
          showToast('Cannot move a card into its own child', 'error');
          return;
        }
        
        pushUndo('moveCard', {
          cardId: draggedCardId,
          originalParentId: draggedCard.parentId,
          newParentId: targetCardId
        });
        
        if (draggedCard.parentId) {
          var oldParent = store.cards[draggedCard.parentId];
          if (oldParent) {
            oldParent.children = oldParent.children.filter(function(c) { return c !== draggedCardId; });
          }
        } else {
          store.rootOrder = store.rootOrder.filter(function(c) { return c !== draggedCardId; });
        }
        
        draggedCard.parentId = targetCardId;
        if (!targetCard.children.includes(draggedCardId)) {
          targetCard.children.push(draggedCardId);
        }
        
        draggedCard.updatedAt = Date.now();
        save();
        render();
        
        showToast('Moved "' + (draggedCard.title || '(Untitled)') + '" to "' + (targetCard.title || '(Untitled)') + '"');
      }
      
      /**
       * Check if a card is a descendant of another
       */
      function isDescendant(cardId, ancestorId) {
        var ancestor = store.cards[ancestorId];
        if (!ancestor) return false;
        if (ancestor.children.includes(cardId)) return true;
        return ancestor.children.some(function(childId) { return isDescendant(cardId, childId); });
      }
      
      /**
       * Reorder cards within a parent
       */
      function reorderCard(parentId, cardId, newIndex) {
        if (parentId) {
          var parent = store.cards[parentId];
          if (!parent || !parent.children.includes(cardId)) return;
          parent.children = parent.children.filter(function(c) { return c !== cardId; });
          parent.children.splice(newIndex, 0, cardId);
        } else {
          if (!store.rootOrder.includes(cardId)) return;
          store.rootOrder = store.rootOrder.filter(function(c) { return c !== cardId; });
          store.rootOrder.splice(newIndex, 0, cardId);
        }
        save();
        render();
      }

      /**
       * Edit dataset name
       */
      function editDatasetName() {
        var currentName = (store.metadata && store.metadata.name) || instanceKey;
        var newName = prompt('Enter new dataset name:', currentName);
        if (newName && newName.trim() && newName.trim() !== currentName) {
          if (!store.metadata) store.metadata = {};
          store.metadata.name = newName.trim();
          store.metadata.updatedAt = Date.now();
          save();
          showToast('Dataset renamed to: ' + newName.trim());
          render();
        }
      }


      // =============================================================
      // --- KEYBOARD SHORTCUTS ---
      // Global keyboard shortcuts for navigation and actions
      // =============================================================
      
      const shortcuts = {
        'ctrl+h': { action: () => goTo('list'), description: 'Go to Home (card list)' },
        'ctrl+n': { action: () => { menu.newCard.click(); }, description: 'New card' },
        'ctrl+f': { action: () => { searchInput.focus(); }, description: 'Focus search' },
        'ctrl+b': { action: () => { menu.bookmarks.click(); closeMenu(); }, description: 'Show bookmarks' },
        'ctrl+r': { action: () => { menu.recentCards.click(); closeMenu(); }, description: 'Show recent cards' },
        'ctrl+e': { action: () => { menu.extensions.click(); closeMenu(); }, description: 'Show extensions' },
        'ctrl+u': { action: () => { menu.upload.click(); closeMenu(); }, description: 'Upload data' },
        'ctrl+/': { action: () => showKeyboardHelp(), description: 'Show this help' },
        'ctrl+z': { action: () => undo(), description: 'Undo last action' },
        'ctrl+y': { action: () => redo(), description: 'Redo last action' },
        'escape': { action: () => handleEscape(), description: 'Close modals/go back' },
        'alt+t': { action: () => { header.themeToggle.click(); }, description: 'Toggle theme' },
        'alt+c': { action: () => toggleViewMode(), description: 'Toggle compact view' },
        'ctrl+d': { action: () => { 
          if (navState.page === 'read' && navState.cardId) {
            const card = store.cards[navState.cardId];
            if (card) {
              const choice = confirm('Duplicate with children?\n\nOK = Yes (with children)\nCancel = No (only this card)');
              const newId = duplicateCard(navState.cardId, choice);
              if (newId) {
                showToast('Card duplicated successfully');
                goTo('read', { cardId: newId });
              }
            }
          }
        }, description: 'Duplicate current card' },
        'ctrl+t': { action: () => {
          if (navState.page === 'edit') {
            const tagsInput = document.getElementById('cardTags');
            if (tagsInput) tagsInput.focus();
          }
        }, description: 'Focus tags input (when editing)' },
        'ctrl+[': { action: () => {
          if (navState.page === 'read' && navState.cardId) {
            const card = store.cards[navState.cardId];
            if (card && card.parentId) {
              goTo('read', { cardId: card.parentId });
            } else {
              goTo('list');
            }
          }
        }, description: 'Navigate to parent card' },
        'ctrl+]': { action: () => {
          if (navState.page === 'read' && navState.cardId) {
            const card = store.cards[navState.cardId];
            if (card && card.children.length > 0) {
              goTo('read', { cardId: card.children[0] });
            }
          }
        }, description: 'Navigate to first child card' },
        'ctrl+g': { action: () => {
          // Toggle between list and grid view
          const gridModeEnabled = localStorage.getItem('cardspoke_gridView') === 'true';
          localStorage.setItem('cardspoke_gridView', (!gridModeEnabled).toString());
          showToast(gridModeEnabled ? 'List view enabled' : 'Grid view enabled');
          render();
        }, description: 'Toggle grid/list view' },
      };
      
      function handleEscape() {
        // Close menu if open
        if (menu.overlay.classList.contains('show')) {
          closeMenu();
          return;
        }
        // Close upload modal if open
        if (uploadModal.overlay.classList.contains('show')) {
          uploadModal.overlay.classList.remove('show');
          return;
        }
        // Close help if open
        const helpModal = document.getElementById('keyboardHelpModal');
        if (helpModal && helpModal.classList.contains('show')) {
          helpModal.classList.remove('show');
          return;
        }
        // Otherwise go back if we can
        if (navHistory.length > 0) {
          goBack();
        }
      }
      
      function closeMenu() {
        menu.overlay.classList.remove('show');
      }
      
      
      /**
       * Show typography preset selector modal
       */
      function showTypographySelector() {
        const currentTypography = localStorage.getItem('cardspoke_typography') || 'default';
        
        const modal = h('div', { 
          id: 'typographyModal', 
          className: 'menu-overlay show',
          onclick: (e) => { if (e.target === modal) modal.remove(); }
        },
          h('div', { className: 'menu-panel' },
            h('div', { className: 'menu-header' },
              h('div', { className: 'menu-title' }, 'Typography'),
              h('button', { 
                className: 'menu-close',
                onclick: () => modal.remove()
              }, '✕')
            ),
            h('div', { className: 'typography-presets' },
              h('div', { className: 'preset-description' }, 'Choose a reading mode that suits your preference:'),
              ...[
                { id: 'default', name: 'Default', desc: '16px, comfortable line height' },
                { id: 'comfortable', name: 'Comfortable', desc: '18px, extra line height for relaxed reading' },
                { id: 'compact', name: 'Compact', desc: '14px, tighter spacing for more content' },
                { id: 'dyslexia', name: 'Dyslexia-Friendly', desc: '18px, wider spacing, readable font' }
              ].map(preset => 
                h('div', { 
                  className: `preset-option ${currentTypography === preset.id ? 'active' : ''}`,
                  onclick: () => {
                    localStorage.setItem('cardspoke_typography', preset.id);
                    document.documentElement.setAttribute('data-typography', preset.id);
                    showToast(`Typography: ${preset.name}`);
                    modal.remove();
                  }
                },
                  h('div', { className: 'preset-name' }, preset.name),
                  h('div', { className: 'preset-desc' }, preset.desc)
                )
              )
            )
          )
        );
        
        document.body.appendChild(modal);
      }

      /**
       * Generate smart tag suggestions for a card based on content
       * @param {string} cardId - Card ID to analyze
       * @param {number} limit - Maximum number of suggestions (default: 5)
       * @returns {Array<{tag: string, score: number}>} Suggested tags with relevance scores
       */
      function suggestTags(cardId, limit = 5) {
        const card = store.cards[cardId];
        if (!card) return [];
        
        const existingTags = getTags(cardId);
        const allExistingTags = getAllTags();
        const suggestions = [];
        
        // Combine title and body for analysis
        const content = ((card.title || '') + ' ' + (card.body || '')).toLowerCase();
        
        // Get tags from other cards with similar content
        for (const tag of allExistingTags) {
          if (existingTags.includes(tag)) continue; // Skip already applied tags
          
          // Find cards with this tag
          const cardsWithTag = Object.values(store.cards).filter(c => 
            c.tags && c.tags.includes(tag)
          );
          
          // Calculate relevance based on content similarity
          let totalScore = 0;
          for (const otherCard of cardsWithTag) {
            const otherContent = ((otherCard.title || '') + ' ' + (otherCard.body || '')).toLowerCase();
            
            // Simple word overlap scoring
            const contentWords = new Set(content.split(/\s+/).filter(w => w.length > 3));
            const otherWords = new Set(otherContent.split(/\s+/).filter(w => w.length > 3));
            const commonWords = [...contentWords].filter(w => otherWords.has(w));
            
            if (commonWords.length > 0) {
              totalScore += commonWords.length / Math.max(contentWords.size, otherWords.size);
            }
          }
          
          if (totalScore > 0) {
            suggestions.push({
              tag,
              score: totalScore / cardsWithTag.length
            });
          }
        }
        
        // Sort by score and return top suggestions
        suggestions.sort((a, b) => b.score - a.score);
        return suggestions.slice(0, limit);
      }
      
      /**
       * Show smart tag suggestions modal
       * @param {string} cardId - Card ID to suggest tags for
       */
      function showTagSuggestions(cardId) {
        const card = store.cards[cardId];
        if (!card) return;
        
        const suggestions = suggestTags(cardId, 8);
        
        if (suggestions.length === 0) {
          showToast('No tag suggestions available', 'info');
          return;
        }
        
        const modal = h('div', { 
          id: 'tagSuggestionsModal', 
          className: 'menu-overlay show',
          onclick: (e) => { if (e.target === modal) modal.remove(); }
        },
          h('div', { className: 'menu-panel' },
            h('div', { className: 'menu-header' },
              h('div', { className: 'menu-title' }, 'Suggested Tags'),
              h('button', { 
                className: 'menu-close',
                onclick: () => modal.remove()
              }, '✕')
            ),
            h('div', { className: 'tag-suggestions' },
              h('div', { className: 'suggestion-description' }, 
                `Based on similar cards, you might want to add these tags:`
              ),
              ...suggestions.map(({ tag, score }) => 
                h('button', { 
                  className: 'suggestion-tag',
                  onclick: () => {
                    addTag(cardId, tag);
                    showToast(`✓ Tag "${tag}" added`);
                    modal.remove();
                    render();
                  }
                },
                  h('span', { className: 'tag-name' }, tag),
                  h('span', { className: 'tag-score' }, `${Math.round(score * 100)}% match`)
                )
              ),
              h('button', {
                className: 'btn btn-primary',
                onclick: () => {
                  // Apply all suggestions
                  suggestions.forEach(({ tag }) => addTag(cardId, tag, true));
                  save();
                  showToast(`✓ ${suggestions.length} tags added`);
                  modal.remove();
                  render();
                }
              }, `Apply All ${suggestions.length} Tags`)
            )
          )
        );
        
        document.body.appendChild(modal);
      }

      // =========================================================
      // In-app Help Modal (v0.12.1)
      // =========================================================
      function showHelp() {
        let helpModal = document.getElementById('inAppHelpModal');
        
        if (!helpModal) {
          helpModal = h('div', { 
            id: 'inAppHelpModal', 
            className: 'menu-overlay',
            onclick: (e) => { if (e.target === helpModal) helpModal.classList.remove('show'); }
          },
            h('div', { className: 'menu-panel', style: 'max-width: 600px; max-height: 80vh; overflow-y: auto;' },
              h('div', { className: 'menu-header' },
                h('div', { className: 'menu-title' }, 'Help & Documentation'),
                h('button', { 
                  className: 'menu-close',
                  onclick: () => helpModal.classList.remove('show')
                }, '✕')
              ),
              h('div', { style: 'padding: var(--space-md);' },
                // Quick Start Section
                h('div', { style: 'margin-bottom: var(--space-lg);' },
                  h('h3', { style: 'margin-bottom: var(--space-sm); color: var(--primary);' }, 'Quick Start'),
                  h('p', { style: 'margin-bottom: var(--space-xs);' }, '1. Click "New Card" to create your first card'),
                  h('p', { style: 'margin-bottom: var(--space-xs);' }, '2. Add content, tags, and child cards'),
                  h('p', { style: 'margin-bottom: var(--space-xs);' }, '3. Use search to find cards quickly'),
                  h('p', {}, '4. Organize with bookmarks and recent cards')
                ),
                
                // Features Section
                h('div', { style: 'margin-bottom: var(--space-lg);' },
                  h('h3', { style: 'margin-bottom: var(--space-sm); color: var(--primary);' }, 'Key Features'),
                  h('div', { style: 'display: grid; gap: var(--space-sm);' },
                    h('div', {}, h('strong', {}, 'Cards'), ' — Hierarchical notes with parent-child relationships'),
                    h('div', {}, h('strong', {}, 'Tags'), ' — Organize and filter cards with tags'),
                    h('div', {}, h('strong', {}, 'Links'), ' — Reference other cards with [[Card Name]]'),
                    h('div', {}, h('strong', {}, 'Search'), ' — Fuzzy search across all cards'),
                    h('div', {}, h('strong', {}, 'Bookmarks'), ' — Star important cards for quick access'),
                    h('div', {}, h('strong', {}, 'Undo/Redo'), ' — Ctrl+Z / Ctrl+Y for changes'),
                    h('div', {}, h('strong', {}, 'Trash Bin'), ' — Recover deleted cards'),
                    h('div', {}, h('strong', {}, 'Extensions'), ' — Customize with themes and plugins')
                  )
                ),
                
                // Keyboard Shortcuts Section
                h('div', { style: 'margin-bottom: var(--space-lg);' },
                  h('h3', { style: 'margin-bottom: var(--space-sm); color: var(--primary);' }, 'Keyboard Shortcuts'),
                  h('div', { style: 'display: grid; grid-template-columns: auto 1fr; gap: var(--space-xs) var(--space-md);' },
                    h('kbd', { style: 'background: var(--bg-alt); padding: 2px 6px; border-radius: 4px;' }, 'Ctrl+N'),
                    h('span', {}, 'New card'),
                    h('kbd', { style: 'background: var(--bg-alt); padding: 2px 6px; border-radius: 4px;' }, 'Ctrl+F'),
                    h('span', {}, 'Search'),
                    h('kbd', { style: 'background: var(--bg-alt); padding: 2px 6px; border-radius: 4px;' }, 'Ctrl+Z'),
                    h('span', {}, 'Undo'),
                    h('kbd', { style: 'background: var(--bg-alt); padding: 2px 6px; border-radius: 4px;' }, 'Ctrl+Y'),
                    h('span', {}, 'Redo'),
                    h('kbd', { style: 'background: var(--bg-alt); padding: 2px 6px; border-radius: 4px;' }, 'Ctrl+/'),
                    h('span', {}, 'All shortcuts')
                  )
                ),
                
                // Extensions Section
                h('div', { style: 'margin-bottom: var(--space-lg);' },
                  h('h3', { style: 'margin-bottom: var(--space-sm); color: var(--primary);' }, 'Extensions'),
                  h('p', { style: 'margin-bottom: var(--space-xs);' }, 'CardSpoke supports themes, plugins, and mods:'),
                  h('ul', { style: 'margin-left: var(--space-md); margin-bottom: var(--space-sm);' },
                    h('li', {}, 'Use the Extension Wizard to create custom extensions'),
                    h('li', {}, 'Test code in the Playground'),
                    h('li', {}, 'Access CardSpoke.utils API for card management')
                  )
                ),
                
                // Data & Privacy Section
                h('div', { style: 'margin-bottom: var(--space-lg);' },
                  h('h3', { style: 'margin-bottom: var(--space-sm); color: var(--primary);' }, 'Data & Privacy'),
                  h('p', {}, 'Your data is stored locally on your device. CardSpoke never sends your data to external servers. Export anytime to JSON, Markdown, or CSV.')
                ),
                
                // Version Info
                h('div', { style: 'padding-top: var(--space-md); border-top: 1px solid var(--border); text-align: center; color: var(--text-secondary);' },
                  h('p', {}, `CardSpoke v${APP_VERSION}`),
                  h('p', { style: 'font-size: var(--text-sm);' }, 
                    h('a', { href: 'https://github.com/jxburros/CardSpoke', target: '_blank', style: 'color: var(--primary);' }, 'GitHub'),
                    ' · ',
                    h('a', { href: 'https://github.com/jxburros/CardSpoke/blob/main/README.md', target: '_blank', style: 'color: var(--primary);' }, 'Documentation')
                  )
                )
              )
            )
          );
          document.body.appendChild(helpModal);
        }
        
        helpModal.classList.add('show');
      }

      function showKeyboardHelp() {
        let helpModal = document.getElementById('keyboardHelpModal');
        
        if (!helpModal) {
          // Create help modal
          helpModal = h('div', { 
            id: 'keyboardHelpModal', 
            className: 'menu-overlay',
            onclick: (e) => { if (e.target === helpModal) helpModal.classList.remove('show'); }
          },
            h('div', { className: 'menu-panel' },
              h('div', { className: 'menu-header' },
                h('div', { className: 'menu-title' }, 'Keyboard Shortcuts'),
                h('button', { 
                  className: 'menu-close',
                  onclick: () => helpModal.classList.remove('show')
                }, '✕')
              ),
              h('div', { className: 'keyboard-shortcuts' },
                h('div', { className: 'shortcuts-section' },
                  h('div', { className: 'shortcuts-section-title' }, 'Navigation'),
                  ...Object.entries(shortcuts)
                    .filter(([key]) => ['ctrl+h', 'ctrl+b', 'ctrl+r', 'escape'].includes(key))
                    .map(([key, { description }]) => 
                      h('div', { className: 'shortcut-item' },
                        h('kbd', {}, key.replace('ctrl+', 'Ctrl+')),
                        h('span', {}, description)
                      )
                    )
                ),
                h('div', { className: 'shortcuts-section' },
                  h('div', { className: 'shortcuts-section-title' }, 'Actions'),
                  ...Object.entries(shortcuts)
                    .filter(([key]) => ['ctrl+n', 'ctrl+f', 'ctrl+u', 'ctrl+e'].includes(key))
                    .map(([key, { description }]) => 
                      h('div', { className: 'shortcut-item' },
                        h('kbd', {}, key.replace('ctrl+', 'Ctrl+')),
                        h('span', {}, description)
                      )
                    )
                ),
                h('div', { className: 'shortcuts-section' },
                  h('div', { className: 'shortcuts-section-title' }, 'View'),
                  ...Object.entries(shortcuts)
                    .filter(([key]) => ['alt+t', 'alt+c'].includes(key))
                    .map(([key, { description }]) => 
                      h('div', { className: 'shortcut-item' },
                        h('kbd', {}, key.replace('alt+', 'Alt+')),
                        h('span', {}, description)
                      )
                    )
                ),
                h('div', { className: 'shortcuts-section' },
                  h('div', { className: 'shortcuts-section-title' }, 'Help'),
                  h('div', { className: 'shortcut-item' },
                    h('kbd', {}, 'Ctrl+/'),
                    h('span', {}, 'Show this help')
                  )
                )
              )
            )
          );
          document.body.appendChild(helpModal);
        }
        
        helpModal.classList.add('show');
      }
      
      // Global keyboard event handler
      document.addEventListener('keydown', (e) => {
        // Don't trigger shortcuts when typing in inputs
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
          // Allow Escape to work in inputs
          if (e.key === 'Escape') {
            e.target.blur();
            handleEscape();
          }
          return;
        }
        
        // Build shortcut key string
        let key = e.key.toLowerCase();
        if (e.ctrlKey || e.metaKey) key = 'ctrl+' + key;
        if (e.altKey) key = 'alt+' + key;
        
        // Execute shortcut if it exists
        const shortcut = shortcuts[key];
        if (shortcut) {
          e.preventDefault();
          try {
            shortcut.action();
          } catch (error) {
            console.error('Keyboard shortcut error:', error);
            showToast('Shortcut failed: ' + key, 'error');
          }
        }
      });

      // =============================================================
      // --- APPLICATION BOOT ---
      // Initialize and start the application
      // =============================================================
      
      load();                          // Load data from localStorage
      populateFooter();                // Populate footer with metadata
      updateDatasetSelector();         // Update dataset selector options

      // Apply saved typography preset
      const savedTypography = localStorage.getItem('cardspoke_typography') || 'default';
      document.documentElement.setAttribute('data-typography', savedTypography);
      
      // Check for safe mode URL parameter (global for import/reset functions)
      const urlParams = new URLSearchParams(window.location.search);
      let safeMode = urlParams.has('safemode');
      
      if (safeMode) {
        console.warn('[Safe Mode] Extensions disabled via ?safemode parameter');
        showToast('Safe Mode Active - Extensions Disabled', 'warning');
      }
      
      if (!safeMode) CardSpoke_MODS.syncFromStore();        // Initialize mods from store (skip in safe mode)
      if (!safeMode) CardSpoke_MODS.runHook('onAppInit');   // Run mod initialization hooks (skip in safe mode)
      render();                        // Initial render
      populateFooter();                // Re-populate footer to ensure it displays

      // Warn user about unsaved changes before leaving
      window.addEventListener('beforeunload', (e) => {
        if (dirty) {
          e.preventDefault();
          e.returnValue = '';
        }
      });
    })();
