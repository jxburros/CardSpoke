    (function() {
      'use strict';
      
      // =============================================================
      // CardSpoke JavaScript Application
      // Version: 0.8.1
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
      const APP_VERSION = '0.9.4'; // <-- AI: UPDATE THIS when making changes
      const APP_RELEASE_DATE = '2025-11-13'; // <-- AI: UPDATE THIS
      const APP_UPDATER = 'Github Copilot - Constructor'; // <-- AI: UPDATE THIS
      // Version 0.8.2: Responsive layout, fully migrated to Capacitor, Navigator Suite integrated
      // Version 0.9.1: Added user-facing error notifications for mod execution failures
      // Version 0.9.2: Added comprehensive keyboard shortcuts system (Ctrl+/ for help)
      // Version 0.9.3: Previous updates
      // Version 0.9.4: Added StorageDriver architecture, Dataset Info Panel, storage analytics
      
      // --- CORE APP STATE ---
      const SCHEMA_VERSION = 4; // Schema version (updated for v0.7+)
      let instanceKey = localStorage.getItem('activeInstance') || 'nested_cards_store';
      let store = { rootOrder: [], cards: {}, mods: {}, bookmarks: [], recentCards: [], viewMode: 'normal' }; // Main data store
      let navState = { page: 'list', cardId: null, parentId: null, searchQuery: '' }; // Navigation state
      let navHistory = []; // Navigation history for back button
      let dirty = false; // Tracks unsaved changes

      // --- DOM ELEMENTS ---
      const header = {
        homeBtn: document.getElementById('homeBtn'),
        themeToggle: document.getElementById('themeToggle'),
        menuBtn: document.getElementById('menuBtn')
      };
      
      const menu = {
        overlay: document.getElementById('menuOverlay'),
        closeBtn: document.getElementById('menuClose'),
        newCard: document.getElementById('menuNewCard'),
        upload: document.getElementById('menuUpload'),
        extensions: document.getElementById('menuExtensions'),
        bookmarks: document.getElementById('menuBookmarks'),
        recentCards: document.getElementById('menuRecentCards'),
        instance: document.getElementById('menuInstance'),
        datasetInfo: document.getElementById('menuDatasetInfo'),
        downloadJSON: document.getElementById('menuDownloadJSON'),
        downloadTXT: document.getElementById('menuDownloadTXT'),
        downloadMarkdown: document.getElementById('menuDownloadMarkdown'),
        downloadCSV: document.getElementById('menuDownloadCSV'),
        downloadMods: document.getElementById('menuDownloadMods'),
        clearAll: document.getElementById('menuClearAll')
      };
      
      const searchContainer = document.getElementById('searchContainer');
      const searchInput = document.getElementById('searchInput');
      const searchClear = document.getElementById('searchClear');
      
      const breadcrumbs = document.getElementById('breadcrumbs');
      const main = document.getElementById('main');
      const toastContainer = document.getElementById('toastContainer');
      
      const themeSwitch = document.getElementById('themeSwitch');
      const viewModeSwitch = document.getElementById('viewModeSwitch');
      const highContrastSwitch = document.getElementById('highContrastSwitch');

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
          else el.setAttribute(k, v);
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
       * Show toast notification
       * @param {string} message - Message to display
       * @param {'success'|'error'|'info'} type - Type of notification
       */
      function showToast(message, type = 'success') {
        const toast = h('div', { className: `toast ${type}` }, message);
        toastContainer.appendChild(toast);
        setTimeout(() => {
          toast.style.opacity = '0';
          setTimeout(() => toast.remove(), 300);
        }, 3000);
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
        if (!confirm('⚠️ WARNING: This will DELETE ALL instances and data from localStorage.\n\nThis action CANNOT be undone!\n\nAre you absolutely sure?')) {
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
          store = { rootOrder: [], cards: {}, mods: {}, bookmarks: [], recentCards: [], viewMode: 'normal' };
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
            viewMode: parsed.viewMode || 'normal'
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
        
        render();
      }

      function goBack() {
        if (navHistory.length) {
          navState = navHistory.pop();
          render();
        }
      }
      
      // --- MODS API ---
      
      // =============================================================
      // --- MOD SYSTEM ---
      // CardSpoke's extension/mod system allows users to add custom
      // functionality through JavaScript hooks and CSS styles.
      // =============================================================
      
      const CIB_MODS = (() => {
        // Registry of loaded mods
        const registry = {};
        // Map of mod IDs to their <style> tags
        const styleTags = {};
        // Set of mods that have run onAppInit
        const initializedMods = new Set();

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
            const runner = new Function('window', 'document', 'CIB_MODS', 'storeAPI', 'console', modData.js + sourceURL);
            runner(window, document, CIB_MODS, storeAPI, console);
            if (modData.meta) registry[modId].meta = { ...modData.meta };
            registry[modId].__loaded = true;
            return registry[modId];
          } catch (err) {
            console.error(`[Mods] Failed to evaluate ${modId}:`, err);
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
        }

        /**
         * Remove mod CSS from the document
         * @param {string} modId - Mod identifier
         */
        function removeStyle(modId) {
          const tag = styleTags[modId];
          if (tag && tag.parentNode) tag.parentNode.removeChild(tag);
          delete styleTags[modId];
        }

        /**
         * Create API object for mod to interact with app
         * @param {string} modId - Mod identifier
         * @returns {Object} API object with safe methods
         */
        function createStoreAPI(modId) {
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
            showToast(message, type = 'success') {
              showToast(message, type);
            },
            markDirty() {
              dirty = true;
            }
          };
        }

        /**
         * Build context object passed to mod hooks
         * @param {string} modId - Mod identifier
         * @returns {Object} Context with modId, versions, and API
         */
        function buildContext(modId) {
          return {
            modId,
            appVersion: APP_VERSION,
            schemaVersion: SCHEMA_VERSION,
            api: createStoreAPI(modId)
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
           * 
           * @param {string} modId - Unique mod identifier
           * @param {Object} definition - Mod definition with hooks and meta
           * @returns {Object} Registry entry
           */
          register(modId, definition = {}) {
            if (!modId) throw new Error('CIB_MODS.register requires a mod id');
            const entry = registry[modId] || { id: modId, hooks: {}, meta: {} };
            entry.hooks = {
              onAppInit: typeof definition.onAppInit === 'function' ? definition.onAppInit : entry.hooks.onAppInit,
              onCardRender: typeof definition.onCardRender === 'function' ? definition.onCardRender : entry.hooks.onCardRender,
              onCardSave: typeof definition.onCardSave === 'function' ? definition.onCardSave : entry.hooks.onCardSave,
              onCardDelete: typeof definition.onCardDelete === 'function' ? definition.onCardDelete : entry.hooks.onCardDelete
            };
            if (definition.meta) entry.meta = { ...definition.meta };
            registry[modId] = entry;
            entry.__loaded = true;
            return entry;
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
            this.runHook('onAppInit');
            return true;
          },
          disable(modId) {
            const modData = store.mods[modId];
            if (!modData) return false;
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
          runHook(hookName, ...args) {
            Object.keys(store.mods).forEach(modId => {
              const modData = store.mods[modId];
              if (!modData.enabled) return;
              const entry = registry[modId];
              if (!entry || !entry.__loaded || !entry.hooks[hookName]) return;
              if (hookName === 'onAppInit' && initializedMods.has(modId)) return;
              try {
                entry.hooks[hookName](buildContext(modId), ...args);
                if (hookName === 'onAppInit') initializedMods.add(modId);
              } catch (err) {
                console.error(`[Mods] Error in ${modId}.${hookName}:`, err);
                showToast(`Extension error: ${modId} (${hookName})`, 'error');
              }
            });
          },
          listMods() {
            return Object.keys(store.mods).map(id => ({
              id,
              enabled: !!store.mods[id]?.enabled,
              meta: store.mods[id]?.meta || {}
            }));
          }
        };
      })();

      window.CIB_MODS = CIB_MODS;

      function runModHook(hookName, ...args) {
        CIB_MODS.runHook(hookName, ...args);
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
        Object.assign(card, updates, { updatedAt: Date.now() });
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
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cardspoke-${type}-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast(`Exported ${type} successfully`);
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
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cardspoke-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Exported TXT successfully');
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
        
        const blob = new Blob([markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cardspoke-${Date.now()}.md`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('✓ Exported to Markdown');
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
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cardspoke-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('✓ Exported to CSV');
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
        if (window.CIB_MODS) {
          window.CIB_MODS.syncFromStore();
          window.CIB_MODS.runHook('onAppInit');
        }
        
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
      }

      // --- INSTANCE & MODALS ---

      function chooseInstance(isInitial = false) {
        const allKeys = Object.keys(localStorage).filter(k => k.startsWith('nested_cards_') || k === 'nested_cards_store');
        const current = instanceKey || 'nested_cards_store';
        let msg = 'Available instances:\n\n';
        allKeys.forEach((k, i) => {
          const isCurrent = (k === current);
          msg += `${i + 1}. ${k}${isCurrent ? ' (current)' : ''}\n`;
        });
        msg += `\n${allKeys.length + 1}. Create new instance`;
        const choice = prompt(msg, '1');
        if (!choice) return;
        const idx = parseInt(choice, 10) - 1;
        if (idx === allKeys.length) {
          const newName = prompt('Enter new instance key:', 'nested_cards_' + Date.now());
          if (!newName) return;
          localStorage.setItem('activeInstance', newName);
          instanceKey = newName;
          store = { rootOrder: [], cards: {}, mods: {} };
          save();
          render();
          showToast('Created new instance: ' + newName);
        } else if (idx >= 0 && idx < allKeys.length) {
          const selectedKey = allKeys[idx];
          localStorage.setItem('activeInstance', selectedKey);
          instanceKey = selectedKey;
          load();
          CIB_MODS.syncFromStore();
          CIB_MODS.runHook('onAppInit');
          render();
          showToast('Switched to: ' + selectedKey);
        }
      }


      function showDatasetInfo() {
        const overlay = h('div', { className: 'modal-overlay show' });
        const modal = h('div', { className: 'modal' });
        const modalHeader = h('div', { className: 'modal-header' });
        modalHeader.appendChild(h('div', { className: 'modal-title' }, '📊 Dataset Information'));
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

        // Create info sections
        const infoHtml = `
          <div style="margin-bottom: var(--space-xl);">
            <h3 style="margin-bottom: var(--space-md); color: var(--text-primary);">Current Dataset</h3>
            <div style="background: var(--bg-secondary); padding: var(--space-lg); border-radius: var(--radius); border: 1px solid var(--border);">
              <div style="margin-bottom: var(--space-sm);"><strong>Name:</strong> ${currentKey}</div>
              <div style="margin-bottom: var(--space-sm);"><strong>Storage Type:</strong> LocalStorage</div>
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
          chooseInstance(false);
        };

        overlay.onclick = (e) => {
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
          modHeader.appendChild(h('div', { style: 'font-weight: 700;' }, meta.name || modId));
          const toggleBtn = h('button', {
            className: modData.enabled ? 'btn btn-danger' : 'btn btn-primary',
            onclick: () => {
              if (modData.enabled) CIB_MODS.disable(modId);
              else CIB_MODS.enable(modId);
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
          
          const deleteBtn = h('button', {
            className: 'btn btn-danger',
            style: 'font-size: var(--text-sm); margin-top: var(--space-md);',
            onclick: () => {
              if (confirm(`Delete extension "${meta.name || modId}"?`)) {
                CIB_MODS.disable(modId);
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
        modalHeader.appendChild(h('div', { className: 'modal-title' }, '⏱ Recent Cards'));
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
          breadcrumbs.appendChild(h('div', { className: 'breadcrumb current' }, 'Search Results'));
          return;
        }
        if (navState.page === 'edit') {
          breadcrumbs.appendChild(h('div', { className: 'breadcrumb current' }, navState.cardId ? 'Edit Card' : 'New Card'));
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
          breadcrumbs.appendChild(h('div', { className: 'breadcrumb current' }, 'All Cards'));
        } else {
          const home = h('div', { className: 'breadcrumb', onclick: () => goTo('list', { cardId: null }) }, 'All Cards');
          breadcrumbs.appendChild(home);
          path.forEach((c, i) => {
            const isCurrent = (i === path.length - 1 && navState.page === 'list');
            const cls = isCurrent ? 'breadcrumb current' : 'breadcrumb';
            const chip = h('div', { className: cls, onclick: isCurrent ? null : () => goTo('list', { cardId: c.id }) }, c.title || '(Untitled)');
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
          const grid = h('div', { className: 'card-grid' });
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
        const cardEl = h('div', { className: cardClasses, onclick: () => goTo('read', { cardId: card.id }) });
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
          detail.appendChild(h('div', { className: 'card-detail-body' }, card.body));
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
        formGroup2.appendChild(h('label', { className: 'form-label' }, 'Body'));
        const bodyTextarea = h('textarea', { id: 'cardBody', className: 'form-textarea' });
        bodyTextarea.value = card.body;
        bodyTextarea.addEventListener('input', () => { dirty = true; });
        formGroup2.appendChild(bodyTextarea);
        form.appendChild(formGroup2);
        // Tags input
        const formGroupTags = h('div', { className: 'form-group' });
        formGroupTags.appendChild(h('label', { className: 'form-label' }, 'Tags (comma-separated)'));
        const tagsInput = h('input', { type: 'text', id: 'cardTags', className: 'form-input' });
        tagsInput.value = (card.tags && card.tags.length) ? card.tags.join(', ') : '';
        tagsInput.addEventListener('input', () => { dirty = true; });
        formGroupTags.appendChild(tagsInput);
        form.appendChild(formGroupTags);
    
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
        
        // Use fuzzy search for typo-tolerant results
        const fuzzyResults = fuzzySearchCards(store, query);
        
        main.appendChild(h('div', { className: 'page-title' }, `Search: "${navState.searchQuery}"`));
        
        if (fuzzyResults.length === 0) {
          main.appendChild(h('div', { className: 'empty' }, 'No results found. Try different keywords.'));
        } else {
          // Show result count with fuzzy indicator
          const resultInfo = h('div', { 
            className: 'search-info',
            style: 'padding: 12px; margin-bottom: 12px; background: var(--bg-secondary); border-radius: 8px; font-size: 14px; color: var(--text-secondary);'
          }, `Found ${fuzzyResults.length} result${fuzzyResults.length === 1 ? '' : 's'} (fuzzy matching enabled)`);
          main.appendChild(resultInfo);
          
          const grid = h('div', { className: 'card-grid' });
          fuzzyResults.forEach(result => {
            const card = result.card;
            const cardEl = renderCardTile(card);
            
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
          if (themeSwitch) themeSwitch.checked = true; // Sync switch
        } else {
          document.documentElement.classList.remove('dark');
          if (themeSwitch) themeSwitch.checked = false; // Sync switch
        }
        try {
          localStorage.setItem('cardspoke_theme', theme);
        } catch { }
        
        // Sync header button
        const moonIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
        const sunIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
        if (header.themeToggle) header.themeToggle.innerHTML = theme === 'dark' ? sunIcon : moonIcon;
      }
      
      // =============================================================
      // --- APP FOOTER ---
      // Populate footer with version and attribution information
      // =============================================================
      
      /**
       * Populate footer with app metadata
       */
      function populateFooter() {
        const creatorEl = document.getElementById('app-creator');
        const versionEl = document.getElementById('app-version');
        const dateEl = document.getElementById('app-release-date');
        const updaterEl = document.getElementById('app-updater');

        if (creatorEl) creatorEl.textContent = APP_CREATOR;
        if (versionEl) versionEl.textContent = APP_VERSION;
        if (dateEl) dateEl.textContent = APP_RELEASE_DATE;
        if (updaterEl) updaterEl.textContent = APP_UPDATER;
      }

      // =============================================================
      // --- INITIALIZATION & EVENT LISTENERS ---
      // Set up event handlers for user interactions
      // =============================================================

      // Initialize theme
      const savedTheme = localStorage.getItem('cardspoke_theme') || 'light';
      applyTheme(savedTheme);

      // --- Header Button Handlers ---
      
      header.themeToggle.onclick = () => {
        const isDark = document.documentElement.classList.contains('dark');
        applyTheme(isDark ? 'light' : 'dark');
      };
      
      if (themeSwitch) {
        themeSwitch.onchange = () => {
          applyTheme(themeSwitch.checked ? 'dark' : 'light');
        };
      }
      
      if (viewModeSwitch) {
        viewModeSwitch.checked = (store.viewMode === 'compact');
        viewModeSwitch.onchange = () => {
          toggleViewMode();
          viewModeSwitch.checked = (store.viewMode === 'compact');
        };
      }

      if (highContrastSwitch) {
        const savedHC = localStorage.getItem('cardspoke_highcontrast') === 'true';
        if (savedHC) document.documentElement.classList.add('high-contrast');
        highContrastSwitch.checked = savedHC;
        highContrastSwitch.onchange = () => {
          const enabled = highContrastSwitch.checked;
          if (enabled) {
            document.documentElement.classList.add('high-contrast');
          } else {
            document.documentElement.classList.remove('high-contrast');
          }
          localStorage.setItem('cardspoke_highcontrast', enabled);
        };
      }
      
      // --- Menu Handlers ---
      
      header.menuBtn.onclick = () => {
        menu.overlay.classList.add('show');
      };

      menu.closeBtn.onclick = () => {
        menu.overlay.classList.remove('show');
      };

      menu.overlay.onclick = (e) => {
        if (e.target === menu.overlay) {
          menu.overlay.classList.remove('show');
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

        // Reset to first tab
        uploadModal.tabs.forEach(t => t.classList.remove('active'));
        uploadModal.tabContents.forEach(content => content.classList.remove('active'));
        const firstTab = document.querySelector('.modal-tab[data-tab="json"]');
        const firstContent = document.getElementById('tab-json');
        if (firstTab) firstTab.classList.add('active');
        if (firstContent) firstContent.classList.add('active');
        
        // Show modal
        uploadModal.overlay.classList.add('show');
      };

      menu.extensions.onclick = () => {
        menu.overlay.classList.remove('show');
        showModsManager();
      };

      menu.bookmarks.onclick = () => {
        menu.overlay.classList.remove('show');
        showBookmarks();
      };

      menu.recentCards.onclick = () => {
        menu.overlay.classList.remove('show');
        showRecentCards();
      };

      menu.instance.onclick = () => {
        menu.overlay.classList.remove('show');
        chooseInstance(false);
      };

      menu.datasetInfo.onclick = () => {
        menu.overlay.classList.remove('show');
        showDatasetInfo();
      };

      menu.downloadJSON.onclick = () => {
        menu.overlay.classList.remove('show');
        handleExport('instance-json');
      };

      menu.downloadTXT.onclick = () => {
        menu.overlay.classList.remove('show');
        handleExport('instance-txt');
      };

      menu.downloadMarkdown.onclick = () => {
        menu.overlay.classList.remove('show');
        exportMarkdown();
      };

      menu.downloadCSV.onclick = () => {
        menu.overlay.classList.remove('show');
        exportCSV();
      };

      menu.downloadMods.onclick = () => {
        menu.overlay.classList.remove('show');
        handleExport('mods-json');
      };

      menu.clearAll.onclick = () => {
        menu.overlay.classList.remove('show');
        clearAllData();
      };

      header.homeBtn.onclick = () => {
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
        'escape': { action: () => handleEscape(), description: 'Close modals/go back' },
        'alt+t': { action: () => { header.themeToggle.click(); }, description: 'Toggle theme' },
        'alt+c': { action: () => toggleViewMode(), description: 'Toggle compact view' }
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
                h('div', { className: 'menu-title' }, '⌨️ Keyboard Shortcuts'),
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
      CIB_MODS.syncFromStore();        // Initialize mods from store
      CIB_MODS.runHook('onAppInit');   // Run mod initialization hooks
      render();                        // Initial render

      // Warn user about unsaved changes before leaving
      window.addEventListener('beforeunload', (e) => {
        if (dirty) {
          e.preventDefault();
          e.returnValue = '';
        }
      });
    })();
