/**
 * CardSpoke Storage Module
 * Version: 0.15.0
 * 
 * Storage drivers and data persistence
 */

import { state, getStore, setStore, createDefaultStore } from './state.js';
import { showToast } from '../ui/toast.js';

/**
 * StorageDriver Interface
 * Provides abstraction for different storage backends
 */
export class StorageDriver {
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
export class IndexedDBDriver extends StorageDriver {
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
export class LocalStorageDriver extends StorageDriver {
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
export class DatasetManager {
  constructor() {
    this.datasets = new Map();
    this.activeDatasetId = null;
    this.metadataKey = 'cardspoke_dataset_metadata';
  }

  async init() {
    const metadataJson = localStorage.getItem(this.metadataKey);
    if (metadataJson) {
      const metadata = JSON.parse(metadataJson);
      this.activeDatasetId = metadata.activeDatasetId;

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

    const keys = await dataset.driver.list();
    for (const key of keys) {
      await dataset.driver.remove(key);
    }

    this.datasets.delete(datasetId);

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

// Save status indicator element reference
let saveStatusEl = null;

/**
 * Update save status indicator
 * @param {string} status - Status: 'pending', 'saved', 'error', 'idle'
 */
export function updateSaveStatus(status) {
  if (!saveStatusEl) {
    saveStatusEl = document.getElementById('saveStatus');
  }
  if (!saveStatusEl) return;

  saveStatusEl.className = 'save-status ' + status;
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  
  switch (status) {
    case 'pending':
      saveStatusEl.textContent = '●';
      saveStatusEl.title = `Saving... (${timeStr})`;
      break;
    case 'saved':
      saveStatusEl.textContent = '✓';
      saveStatusEl.title = `Last saved at ${timeStr}`;
      break;
    case 'error':
      saveStatusEl.textContent = '✕';
      saveStatusEl.title = `Save failed at ${timeStr}`;
      break;
    default:
      saveStatusEl.textContent = '';
      saveStatusEl.title = '';
  }
}

/**
 * Save immediately
 */
export function saveNow() {
  try {
    const key = state.instanceKey || 'nested_cards_store';
    const startTime = performance.now();

    const doSave = () => {
      try {
        localStorage.setItem(key, JSON.stringify(state.store));
        const duration = performance.now() - startTime;
        state.lastSaveTime = Date.now();
        state.savePending = false;

        updateSaveStatus('saved');
        setTimeout(() => updateSaveStatus('idle'), 1000);

        console.log(`Saved in ${duration.toFixed(2)}ms`);
      } catch (e) {
        state.savePending = false;
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
    state.savePending = false;
    updateSaveStatus('error');
  }
}

/**
 * Save with debouncing
 * @param {boolean} immediate - Whether to save immediately
 */
export function save(immediate = false) {
  if (state.saveTimeout) {
    clearTimeout(state.saveTimeout);
    state.saveTimeout = null;
  }

  if (immediate) {
    saveNow();
    return;
  }

  const timeSinceLastSave = Date.now() - state.lastSaveTime;
  if (timeSinceLastSave < state.MIN_SAVE_INTERVAL_MS) {
    state.savePending = true;
    updateSaveStatus('pending');
    state.saveTimeout = setTimeout(saveNow, Math.max(state.SAVE_DEBOUNCE_MS, state.MIN_SAVE_INTERVAL_MS - timeSinceLastSave));
    return;
  }

  state.savePending = true;
  updateSaveStatus('pending');
  state.saveTimeout = setTimeout(saveNow, state.SAVE_DEBOUNCE_MS);
}

/**
 * Load data from localStorage
 */
export function load() {
  const key = state.instanceKey || 'nested_cards_store';
  const raw = localStorage.getItem(key);
  if (!raw) {
    state.store = createDefaultStore();
    save();
    return;
  }
  try {
    const parsed = JSON.parse(raw);
    state.store = {
      rootOrder: parsed.rootOrder || [],
      cards: parsed.cards || {},
      mods: parsed.mods || {},
      bookmarks: parsed.bookmarks || [],
      recentCards: parsed.recentCards || [],
      viewMode: parsed.viewMode || 'normal',
      activeTheme: parsed.activeTheme || 'light',
      richTextEnabled: parsed.richTextEnabled || false
    };

    // Data migration
    let needsMigration = false;
    
    if (state.store.rootOrder.length === 0 && Object.keys(state.store.cards).length > 0) {
      const rootCards = Object.values(state.store.cards).filter(card => !card.parentId);
      state.store.rootOrder = rootCards.map(card => card.id);
      needsMigration = state.store.rootOrder.length > 0;
    }
    
    if (Object.keys(state.store.cards).length > 0) {
      const validRootOrder = state.store.rootOrder.filter(id => state.store.cards[id]);
      
      const actualRootCards = Object.values(state.store.cards).filter(card => {
        return !card.parentId || !state.store.cards[card.parentId];
      });
      
      actualRootCards.forEach(card => {
        if (!validRootOrder.includes(card.id)) {
          validRootOrder.push(card.id);
          needsMigration = true;
        }
      });
      
      if (validRootOrder.length !== state.store.rootOrder.length || 
          !validRootOrder.every((id, i) => id === state.store.rootOrder[i])) {
        state.store.rootOrder = validRootOrder;
        needsMigration = true;
      }
    }
    
    if (needsMigration) {
      save();
      showToast('Data migrated: synchronized root cards');
    }
  } catch (e) {
    console.error('Failed to load data:', e);
    state.store = createDefaultStore();
  }
}

/**
 * Clear all data from localStorage
 */
export function clearAllData() {
  if (!confirm('WARNING: This will DELETE ALL instances and data from localStorage.\n\nThis action CANNOT be undone!\n\nAre you absolutely sure?')) {
    return;
  }

  if (!confirm('This is your FINAL warning.\n\nAll card data, all instances, and all settings will be permanently deleted.\n\nContinue?')) {
    return;
  }

  try {
    const allKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      allKeys.push(key);
    }

    localStorage.clear();

    showToast(`Cleared ${allKeys.length} items from localStorage`, 'success');

    setTimeout(() => {
      location.reload();
    }, 1000);
  } catch (e) {
    showToast('Failed to clear data: ' + e.message, 'error');
  }
}
