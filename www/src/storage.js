/*
 * Copyright 2026 Jeffrey Guntly (JX Holdings, LLC)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  APP_VERSION, SCHEMA_VERSION,
  store, setStore, createDefaultStore,
  navState, setNavState,
  navHistory, setNavHistory,
  instanceKey
} from './state.js';
import { migrateStore as coreMigrateStore } from '@core/migrations.js';


      // Source Part 2/5: Storage drivers, navigation, and plugin runtime
      // Concatenated via `npm run build` in lexical order of www/src/*.js
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
       * Local File Storage Driver
       * Uses File System Access API (web) or Capacitor Filesystem (native)
       */
      class LocalFileDriver extends StorageDriver {
        constructor() {
          super();
          this.fileHandle = null;
          this.fileName = 'cardspoke.json';
          this.handleKey = 'cardspoke_localfile_handle';
          this.isNative = false;
          this.nativeFilePath = null;
        }

        async init(config = {}) {
          this.fileName = config.fileName || 'cardspoke.json';
          this.handleKey = config.handleKey || 'cardspoke_localfile_handle';
          
          // Detect if running in Capacitor native environment
          this.isNative = typeof window.Capacitor !== 'undefined' && 
                          typeof window.Capacitor.isNativePlatform === 'function' && 
                          window.Capacitor.isNativePlatform();
          
          if (this.isNative) {
            // Native: Use Capacitor Filesystem
            const { Filesystem } = window.Capacitor.Plugins;
            if (!Filesystem) {
              throw new Error('Capacitor Filesystem plugin not available');
            }
            // Store file in Documents directory
            this.nativeFilePath = this.fileName;
          } else {
            // Web: Try to restore file handle from IndexedDB
            await this.restoreHandle();
          }
          
          return Promise.resolve();
        }

        async restoreHandle() {
          try {
            // Try to restore the file handle from IndexedDB
            const db = await this.openHandleDB();
            const handle = await this.getHandleFromDB(db);
            if (handle) {
              // Verify we still have permission
              const permission = await handle.queryPermission({ mode: 'readwrite' });
              if (permission === 'granted') {
                this.fileHandle = handle;
              }
            }
          } catch (error) {
            console.warn('Could not restore file handle:', error);
          }
        }

        async openHandleDB() {
          return new Promise((resolve, reject) => {
            const request = indexedDB.open('CardSpokeFileHandles', 1);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            request.onupgradeneeded = (event) => {
              const db = event.target.result;
              if (!db.objectStoreNames.contains('handles')) {
                db.createObjectStore('handles');
              }
            };
          });
        }

        async getHandleFromDB(db) {
          return new Promise((resolve, reject) => {
            const transaction = db.transaction(['handles'], 'readonly');
            const store = transaction.objectStore('handles');
            const request = store.get(this.handleKey);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
          });
        }

        async saveHandleToDB(handle) {
          const db = await this.openHandleDB();
          return new Promise((resolve, reject) => {
            const transaction = db.transaction(['handles'], 'readwrite');
            const store = transaction.objectStore('handles');
            const request = store.put(handle, this.handleKey);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
          });
        }

        async ensureHandle() {
          if (this.isNative) {
            // Native platform always has access to file system
            return;
          }
          
          if (!this.fileHandle) {
            // Check if File System Access API is supported
            if (!('showSaveFilePicker' in window)) {
              throw new Error('File System Access API not supported in this browser. Please use Chrome, Edge, or another compatible browser.');
            }
            
            // Prompt user to select/create a file
            try {
              this.fileHandle = await window.showSaveFilePicker({
                suggestedName: this.fileName,
                types: [{
                  description: 'CardSpoke Data File',
                  accept: { 'application/json': ['.json'] }
                }]
              });
              
              // Save handle to IndexedDB for future use
              await this.saveHandleToDB(this.fileHandle);
            } catch (error) {
              if (error.name === 'AbortError') {
                throw new Error('File selection cancelled by user');
              }
              throw error;
            }
          }
        }

        async readFile() {
          if (this.isNative) {
            // Native: Read using Capacitor Filesystem
            const { Filesystem, Directory } = window.Capacitor.Plugins;
            try {
              const result = await Filesystem.readFile({
                path: this.nativeFilePath,
                directory: Directory.Documents,
                encoding: 'utf8'
              });
              const text = result.data || '';
              if (!text.trim()) {
                return {};
              }
              try {
                return JSON.parse(text);
              } catch (parseError) {
                console.error('Failed to parse file content:', parseError);
                throw new Error('Invalid JSON in file');
              }
            } catch (error) {
              // Check for file not found error
              if (error.code === 'NOT_FOUND' || (error.message && error.message.toLowerCase().includes('not exist'))) {
                return {};
              }
              throw error;
            }
          } else {
            // Web: Read using File System Access API
            await this.ensureHandle();
            const file = await this.fileHandle.getFile();
            const text = await file.text();
            if (!text.trim()) {
              return {};
            }
            try {
              return JSON.parse(text);
            } catch (parseError) {
              console.error('Failed to parse file content:', parseError);
              throw new Error('Invalid JSON in file');
            }
          }
        }

        async writeFile(data) {
          if (this.isNative) {
            // Native: Write using Capacitor Filesystem
            const { Filesystem, Directory } = window.Capacitor.Plugins;
            await Filesystem.writeFile({
              path: this.nativeFilePath,
              data: JSON.stringify(data, null, 2),
              directory: Directory.Documents,
              encoding: 'utf8'
            });
          } else {
            // Web: Write using File System Access API
            await this.ensureHandle();
            const writable = await this.fileHandle.createWritable();
            await writable.write(JSON.stringify(data, null, 2));
            await writable.close();
          }
        }

        async get(key) {
          try {
            const data = await this.readFile();
            return data[key] || null;
          } catch (error) {
            console.error('LocalFile get error:', error);
            showToast('Failed to read from local file: ' + error.message, 'error');
            return null;
          }
        }

        async set(key, value) {
          try {
            const data = await this.readFile();
            data[key] = value;
            await this.writeFile(data);
          } catch (error) {
            console.error('LocalFile set error:', error);
            showToast('Failed to save to local file: ' + error.message, 'error');
            throw error;
          }
        }

        async remove(key) {
          try {
            const data = await this.readFile();
            delete data[key];
            await this.writeFile(data);
          } catch (error) {
            console.error('LocalFile remove error:', error);
            showToast('Failed to remove from local file: ' + error.message, 'error');
            throw error;
          }
        }

        async list(prefix = '') {
          try {
            const data = await this.readFile();
            const keys = Object.keys(data);
            return prefix ? keys.filter(k => k.startsWith(prefix)) : keys;
          } catch (error) {
            console.error('LocalFile list error:', error);
            return [];
          }
        }

        async getSize() {
          try {
            if (this.isNative) {
              const { Filesystem, Directory } = window.Capacitor.Plugins;
              const stat = await Filesystem.stat({
                path: this.nativeFilePath,
                directory: Directory.Documents
              });
              return stat.size;
            } else {
              await this.ensureHandle();
              const file = await this.fileHandle.getFile();
              return file.size;
            }
          } catch (error) {
            console.error('LocalFile getSize error:', error);
            return 0;
          }
        }

        getKind() {
          return 'localfile';
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

          switch (kind) {
            case 'indexeddb':
              driver = new IndexedDBDriver();
              break;
            case 'localfile':
              driver = new LocalFileDriver();
              break;
            case 'localstorage':
            default:
              // Cloud drivers (googledrive/onedrive/webdav) are not part of
              // the public app; legacy dataset metadata referencing them
              // falls back to on-device LocalStorage.
              driver = new LocalStorageDriver();
              break;
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


      let indexedDbMirrorDriver = null;

      async function getIndexedDbMirrorDriver() {
        if (indexedDbMirrorDriver) return indexedDbMirrorDriver;
        const driver = new IndexedDBDriver();
        await driver.init({ dbName: 'CardSpokeDB', storeName: 'datasets' });
        indexedDbMirrorDriver = driver;
        return indexedDbMirrorDriver;
      }

      function isIndexedDbDataset() {
        return !!(store && store.metadata && store.metadata.storageType === 'indexeddb');
      }

      function getStorageType() {
        return (store && store.metadata && store.metadata.storageType) || 'localstorage';
      }

      function supportsFileSystemAccess() {
        return typeof window.showSaveFilePicker === 'function';
      }

      function getDatasetFileHandleKey() {
        const key = instanceKey || 'nested_cards_store';
        return (store.metadata && store.metadata.storageConfig && store.metadata.storageConfig.handleKey) || (`cardspoke_file_handle_${key}`);
      }

      async function openFileHandleDb() {
        return new Promise((resolve, reject) => {
          const req = indexedDB.open('CardSpokeFileHandles', 1);
          req.onerror = () => reject(req.error);
          req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains('handles')) db.createObjectStore('handles');
          };
          req.onsuccess = () => resolve(req.result);
        });
      }

      async function saveDatasetFileHandle(handleKey, handle) {
        const db = await openFileHandleDb();
        return new Promise((resolve, reject) => {
          const tx = db.transaction(['handles'], 'readwrite');
          tx.objectStore('handles').put(handle, handleKey);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      }

      async function loadDatasetFileHandle(handleKey) {
        const db = await openFileHandleDb();
        return new Promise((resolve, reject) => {
          const tx = db.transaction(['handles'], 'readonly');
          const req = tx.objectStore('handles').get(handleKey);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => reject(req.error);
        });
      }

      async function ensureLocalFileHandle() {
        if (!supportsFileSystemAccess()) {
          throw new Error('File System Access API is not supported in this browser/runtime');
        }
        const handleKey = getDatasetFileHandleKey();
        let handle = await loadDatasetFileHandle(handleKey);
        if (!handle) {
          const suggestedName = ((store.metadata && store.metadata.name) || 'cardspoke-dataset').replace(/\s+/g, '-').toLowerCase() + '.json';
          handle = await window.showSaveFilePicker({
            suggestedName,
            types: [{ description: 'JSON Dataset', accept: { 'application/json': ['.json'] } }]
          });
          await saveDatasetFileHandle(handleKey, handle);
        }
        if (store.metadata && store.metadata.storageConfig) {
          store.metadata.storageConfig.handleKey = handleKey;
          store.metadata.storageConfig.fileName = handle.name || 'dataset.json';
        }
        return handle;
      }

      async function writeDatasetToLocalFile(payload) {
        if (getStorageType() !== 'localfile') return;
        const handle = await ensureLocalFileHandle();
        const writable = await handle.createWritable();
        await writable.write(payload);
        await writable.close();
      }

      async function readDatasetFromLocalFile() {
        if (getStorageType() !== 'localfile') return null;
        const handle = await ensureLocalFileHandle();
        const file = await handle.getFile();
        const text = await file.text();
        return text || null;
      }



      function toBase64(bytes) {
        let binary = '';
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        return btoa(binary);
      }

      function fromBase64(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return bytes;
      }

      async function derivePinKey(pin, saltBytes) {
        if (!window.crypto || !window.crypto.subtle) throw new Error('Web Crypto API unavailable');
        const encoder = new TextEncoder();
        const baseKey = await window.crypto.subtle.importKey('raw', encoder.encode(pin), 'PBKDF2', false, ['deriveKey']);
        return window.crypto.subtle.deriveKey(
          {
            name: 'PBKDF2',
            salt: saltBytes,
            iterations: 250000,
            hash: 'SHA-256'
          },
          baseKey,
          { name: 'AES-GCM', length: 256 },
          false,
          ['encrypt', 'decrypt']
        );
      }

      async function encryptStorePayload(payload, pin) {
        const salt = window.crypto.getRandomValues(new Uint8Array(16));
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const key = await derivePinKey(pin, salt);
        const data = new TextEncoder().encode(payload);
        const encrypted = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
        return JSON.stringify({
          encrypted: true,
          version: 1,
          kdf: 'PBKDF2',
          cipher: 'AES-GCM',
          iterations: 250000,
          salt: toBase64(salt),
          iv: toBase64(iv),
          payload: toBase64(new Uint8Array(encrypted))
        });
      }

      async function decryptStorePayload(encryptedPayload, pin) {
        const envelope = typeof encryptedPayload === 'string' ? JSON.parse(encryptedPayload) : encryptedPayload;
        if (!envelope || !envelope.encrypted) return encryptedPayload;
        const salt = fromBase64(envelope.salt);
        const iv = fromBase64(envelope.iv);
        const ciphertext = fromBase64(envelope.payload);
        const key = await derivePinKey(pin, salt);
        const decrypted = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
        return new TextDecoder().decode(decrypted);
      }

      function validateStoreConsistency() {
        if (!store || !store.cards || typeof store.cards !== 'object') return false;
        let changed = false;
        const cards = store.cards;
        const ids = new Set(Object.keys(cards));

        Object.values(cards).forEach(card => {
          if (!Array.isArray(card.children)) {
            card.children = [];
            changed = true;
          }
          card.children = card.children.filter(cid => ids.has(cid));
        });

        Object.values(cards).forEach(card => {
          if (card.parentId && !cards[card.parentId]) {
            card.parentId = null;
            changed = true;
          }
        });

        const visiting = new Set();
        const visited = new Set();
        const breakCycle = (id) => {
          if (visited.has(id)) return;
          if (visiting.has(id)) {
            cards[id].parentId = null;
            changed = true;
            return;
          }
          visiting.add(id);
          const parentId = cards[id] && cards[id].parentId;
          if (parentId && cards[parentId]) breakCycle(parentId);
          visiting.delete(id);
          visited.add(id);
        };
        Object.keys(cards).forEach(breakCycle);

        Object.values(cards).forEach(card => {
          if (card.parentId && cards[card.parentId] && !cards[card.parentId].children.includes(card.id)) {
            cards[card.parentId].children.push(card.id);
            changed = true;
          }
        });

        const computedRoots = Object.values(cards).filter(card => !card.parentId).map(card => card.id);
        const existingRootOrder = Array.isArray(store.rootOrder) ? store.rootOrder : [];
        const cleanedRootOrder = existingRootOrder.filter(id => cards[id] && !cards[id].parentId);
        computedRoots.forEach(id => {
          if (!cleanedRootOrder.includes(id)) {
            cleanedRootOrder.push(id);
            changed = true;
          }
        });
        if (cleanedRootOrder.length !== existingRootOrder.length || !cleanedRootOrder.every((id, i) => id === existingRootOrder[i])) {
          store.rootOrder = cleanedRootOrder;
          changed = true;
        }

        return changed;
      }

      /**
       * Run the typed-card migration layer over the loaded store.
       * Idempotent and loss-free (see www/src/core/migrations.js): fills
       * missing kind defaults, preserves unknown kinds/metadata, and logs
       * warnings instead of dropping data.
       * @returns {boolean} True if any card changed and a save is needed.
       */
      function migrateTypedCards() {
        try {
          const result = coreMigrateStore(store);
          result.warnings.forEach(w => console.warn('[TypedCards]', w));
          return result.changed;
        } catch (err) {
          console.error('[TypedCards] Migration failed (data left untouched):', err);
          return false;
        }
      }

      async function saveNow() {
        try {
          // Run middleware pipeline before saving (Task 1.1)
          if (window.CardSpoke && window.CardSpoke.Middleware) {
            try {
              const result = await window.CardSpoke.Middleware.run('card.save', [store]);
              if (result && result.prevented) {
                savePending = false;
                return;
              }
            } catch (err) {
              console.error('[Middleware] card.save pipeline error:', err);
            }
          }

          const key = instanceKey || 'nested_cards_store';
          const startTime = performance.now();

          if (!store.metadata) store.metadata = {};
          store.metadata.navState = { ...navState };
          store.metadata.navHistory = Array.isArray(navHistory) ? navHistory.slice(-100) : [];

          // Use requestIdleCallback if available to avoid blocking UI
          const doSave = async () => {
            try {
              const payload = JSON.stringify(store);
              const activeDataset = datasetManager && datasetManager.getActiveDataset ? datasetManager.getActiveDataset() : null;
              const activePin = (activeDataset && activeDataset.pin) || (store && store.metadata && store.metadata.pin) || null;
              const finalPayload = activePin
                ? await encryptStorePayload(payload, activePin)
                : payload;

              localStorage.setItem(key, finalPayload);

              if (isIndexedDbDataset()) {
                getIndexedDbMirrorDriver()
                  .then(driver => driver.set(key, finalPayload))
                  .catch(err => console.error('[IndexedDB] Mirror save failed:', err));
              }

              if (getStorageType() === 'localfile') {
                writeDatasetToLocalFile(finalPayload)
                  .catch(err => {
                    console.error('[Local File] Save failed:', err);
                    showToast('Local file save failed: ' + err.message, 'error');
                  });
              }


              const duration = performance.now() - startTime;
              lastSaveTime = Date.now();
              savePending = false;

              // Show success indicator briefly
              updateSaveStatus('saved');
              setTimeout(() => updateSaveStatus('idle'), 1000);

              console.log(`Saved in ${duration.toFixed(2)}ms`);
              
              // Schedule cloud sync if cloud storage is configured
              scheduleCloudSync();

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
            requestIdleCallback(() => { doSave(); }, { timeout: 2000 });
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
            indicator.textContent = 'Saving…';
            indicator.title = `Saving… (${timeStr})`;
            break;
          case 'saved':
            indicator.textContent = 'Saved';
            indicator.title = `Last saved at ${timeStr}`;
            break;
          case 'error':
            indicator.textContent = 'Save failed';
            indicator.title = `Save failed at ${timeStr}`;
            break;
          default:
            indicator.textContent = '';
            indicator.title = '';
        }
      }

      async function clearAllData() {
        if (!await showConfirmDialog('WARNING: This will DELETE ALL instances and data from localStorage.\n\nThis action CANNOT be undone!\n\nAre you absolutely sure?', {
          title: 'Delete All Data',
          confirmLabel: 'Continue',
          cancelLabel: 'Cancel',
          confirmClassName: 'btn btn-danger'
        })) {
          return;
        }

        if (!await showConfirmDialog('This is your FINAL warning.\n\nAll card data, all instances, and all settings will be permanently deleted.\n\nContinue?', {
          title: 'Final Warning',
          confirmLabel: 'Delete Everything',
          cancelLabel: 'Cancel',
          confirmClassName: 'btn btn-danger'
        })) {
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

      async function load() {
        const key = instanceKey || 'nested_cards_store';
        let raw = localStorage.getItem(key);
        const activeDataset = datasetManager && datasetManager.getActiveDataset ? datasetManager.getActiveDataset() : null;
        const activePin = (activeDataset && activeDataset.pin) || (store && store.metadata && store.metadata.pin) || null;
        if (raw && activePin) {
          try {
            raw = await decryptStorePayload(raw, activePin);
          } catch (err) {
            console.error('[Dataset] Failed to decrypt payload:', err);
            showToast('Failed to decrypt dataset. Check your PIN.', 'error');
            throw err;
          }
        }
        if (!raw) {
          setStore(createDefaultStore());
          save();
          return;
        }
        try {
          const parsed = JSON.parse(raw);
          setStore({
            rootOrder: parsed.rootOrder || [],
            cards: parsed.cards || {},
            plugins: parsed.plugins || {},
            bookmarks: parsed.bookmarks || [],
            recentCards: parsed.recentCards || [],
            viewMode: parsed.viewMode || 'normal',
            activeTheme: parsed.activeTheme || 'light',
            metadata: parsed.metadata || {}
          });

          if (store.metadata && store.metadata.navState) {
            setNavState({ ...navState, ...store.metadata.navState });
          }
          if (store.metadata && Array.isArray(store.metadata.navHistory)) {
            setNavHistory(store.metadata.navHistory.slice(-100));
          }

          const repaired = validateStoreConsistency();
          const typedChanged = migrateTypedCards();
          if (repaired || typedChanged) {
            save();
            if (repaired) showToast('Data integrity check repaired structural metadata', 'info');
          }

          const storageType = getStorageType();
          if (storageType === 'indexeddb') {
            getIndexedDbMirrorDriver()
              .then(driver => driver.get(key))
              .then(async payload => {
                if (!payload) return;
                const parsedMirror = typeof payload === 'string' ? JSON.parse(payload) : payload;
                if (!parsedMirror || typeof parsedMirror !== 'object') return;
                setStore({
                  rootOrder: parsedMirror.rootOrder || [],
                  cards: parsedMirror.cards || {},
                  plugins: parsedMirror.plugins || {},
                  bookmarks: parsedMirror.bookmarks || [],
                  recentCards: parsedMirror.recentCards || [],
                  viewMode: parsedMirror.viewMode || 'normal',
                  activeTheme: parsedMirror.activeTheme || 'light',
                  metadata: parsedMirror.metadata || store.metadata
                });
                if (store.metadata && store.metadata.navState) setNavState({ ...navState, ...store.metadata.navState });
                if (store.metadata && Array.isArray(store.metadata.navHistory)) setNavHistory(store.metadata.navHistory.slice(-100));
                const mirrorRepaired = validateStoreConsistency();
                const mirrorTypedChanged = migrateTypedCards();
                if (mirrorRepaired || mirrorTypedChanged) save();
                // The mirror payload may contain plugins the boot-time sync
                // never saw; syncFromStore is idempotent, so re-run it.
                if (window.CardSpoke && window.CardSpoke.Plugin && window.CardSpoke.Plugin.syncFromStore) {
                  window.CardSpoke.Plugin.syncFromStore()
                    .catch(err => console.error('[Plugin] Re-sync after IndexedDB load failed:', err));
                }
                render();
              })
              .catch(err => {
                console.error('[IndexedDB] Load failed, using LocalStorage fallback:', err);
              });
          } else if (storageType === 'localfile') {
            readDatasetFromLocalFile()
              .then(async payload => {
                if (!payload) return;
                const active = datasetManager && datasetManager.getActiveDataset ? datasetManager.getActiveDataset() : null;
                const filePin = (active && active.pin) || (store && store.metadata && store.metadata.pin) || null;
                const payloadText = filePin ? await decryptStorePayload(payload, filePin) : payload;
                const parsedFile = JSON.parse(payloadText);
                setStore({
                  rootOrder: parsedFile.rootOrder || [],
                  cards: parsedFile.cards || {},
                  plugins: parsedFile.plugins || {},
                  bookmarks: parsedFile.bookmarks || [],
                  recentCards: parsedFile.recentCards || [],
                  viewMode: parsedFile.viewMode || 'normal',
                  activeTheme: parsedFile.activeTheme || 'light',
                  metadata: parsedFile.metadata || store.metadata
                });
                if (store.metadata && store.metadata.navState) setNavState({ ...navState, ...store.metadata.navState });
                if (store.metadata && Array.isArray(store.metadata.navHistory)) setNavHistory(store.metadata.navHistory.slice(-100));
                const fileRepaired = validateStoreConsistency();
                const fileTypedChanged = migrateTypedCards();
                if (fileRepaired || fileTypedChanged) save();
                // Same as the IndexedDB path: pick up plugins that arrived
                // with the async payload (idempotent re-sync).
                if (window.CardSpoke && window.CardSpoke.Plugin && window.CardSpoke.Plugin.syncFromStore) {
                  window.CardSpoke.Plugin.syncFromStore()
                    .catch(err => console.error('[Plugin] Re-sync after local-file load failed:', err));
                }
                render();
              })
              .catch(err => {
                console.error('[Local File] Load failed, using LocalStorage fallback:', err);
              });
          }
        } catch (e) {
          console.error('[CardSpoke] Failed to parse stored data — resetting to clean state:', e);
          setStore(createDefaultStore());
          try {
            save();
          } catch (_saveErr) { /* ignore */ }
          if (typeof showToast === 'function') {
            showToast('Stored data was corrupted and has been reset.', 'warning', 6000);
          }
        }
      }

      // --- NAVIGATION ---

      function goTo(page, opts = {}) {
        navHistory.push({ ...navState });
        setNavState({
          // Mode-aware routing: missing mode defaults to the full CardSpoke
          // experience so existing pages/routes stay backward compatible.
          mode: opts.mode ?? navState.mode ?? 'cardspoke',
          page,
          cardId: opts.cardId ?? null,
          parentId: opts.parentId ?? null,
          searchQuery: opts.searchQuery ?? ''
        });

        // Add to recent cards when viewing a card
        if (page === 'read' && opts.cardId) {
          addToRecentCards(opts.cardId);
        }

        render();
      }

      function goBack() {
        if (navHistory.length) {
          setNavState(navHistory.pop());
          render();
        }
      }
      
      // --- PLUGINS API ---

      // =============================================================
      // --- PLUGIN SYSTEM v2 ---
      // JSON-driven plugin loading system. Plugins are JSON packages that
      // range from simple CSS themes to deep app transformations.
      //
      // Plugin layers:
      //   theme   - CSS only. No JS execution. Safest; auto-enabled.
      //   feature - CSS + JS. Middleware hooks, DOM injection, card
      //             behavior via ctx.api. Auto-enabled unless it declares
      //             overrides.
      //   app     - CSS + JS + overrides (currently: appName). Component
      //             replacement, middleware, custom pages via ctx.api.
      //             HIGH risk; must be enabled manually by the user.
      // =============================================================
      


      // =============================================================
      // --- Modern Plugin System ---
      // Use the modern Plugin API (window.CardSpoke.Plugin) for all extensions.
      // See docs/PLUGIN_SYSTEM.md for complete plugin development documentation.
      // =============================================================

      // =============================================================
      // --- CardSpoke.utils API ---
      // Public utility API for plugin developers.
      //
      // The window.CardSpoke root object is created (and frozen) by
      // core/global-api.js before this module runs; its `utils` property is
      // a stable mutable object that this block populates in place. Do NOT
      // reassign window.CardSpoke or window.CardSpoke.utils — merge into it.
      // =============================================================

      Object.assign((window.CardSpoke && window.CardSpoke.utils) || {}, {
        createCard: async function(data) {
          data = data || {};
          var title = data.title || '';
          var body = data.body || '';
          var parentId = data.parentId || null;
          var tags = data.tags || [];
          var cardId = createCard(title, body, parentId, false, false);
          if (tags.length > 0) tags.forEach(function(tag) { addTag(cardId, tag, true); });
          save();
          render();
          return { id: cardId, card: cloneCard(store.cards[cardId]) };
        },
        updateCard: async function(cardId, changes) {
          changes = changes || {};
          if (!cardId) throw new Error('cardId is required');
          if (!store.cards[cardId]) throw new Error('Card ' + cardId + ' not found');
          var tags = changes.tags;
          var otherChanges = Object.assign({}, changes);
          delete otherChanges.tags;
          if (Object.keys(otherChanges).length > 0) updateCard(cardId, otherChanges, false, false);
          if (tags !== undefined) setTags(cardId, tags, false);
          return true;
        },
        getTags: async function(cardId) { return getTags(cardId); },
        addTag: async function(cardId, tag) { return addTag(cardId, tag, false); },
        removeTag: async function(cardId, tag) { return removeTag(cardId, tag, false); },
        setTags: async function(cardId, tags) { return setTags(cardId, tags, false); },
        getAllTags: async function() { return getAllTags(); },
        showToast: async function(message, type, duration) { showToast(message, type || 'info', duration || 3000); },
        getDatasetMeta: async function() {
          return {
            name: instanceKey,
            cardCount: Object.keys(store.cards).length,
            rootCardCount: store.rootOrder.length,
            bookmarkCount: (store.bookmarks || []).length,
            recentCount: (store.recentCards || []).length,
            modCount: Object.keys(store.plugins || {}).length,
            schemaVersion: SCHEMA_VERSION,
            appVersion: APP_VERSION
          };
        },
        getCard: async function(cardId) {
          if (!cardId) return null;
          var card = store.cards[cardId];
          return card ? cloneCard(card) : null;
        },
        searchCards: async function(query) {
          if (!query) return [];
          var lowerQuery = query.toLowerCase();
          var results = [];
          for (var id in store.cards) {
            var card = store.cards[id];
            if (card.title.toLowerCase().includes(lowerQuery) ||
                card.body.toLowerCase().includes(lowerQuery) ||
                (card.tags && card.tags.some(function(tag) { return tag.toLowerCase().includes(lowerQuery); }))) {
              results.push(cloneCard(card));
            }
          }
          return results;
        },
        getAccessibilitySettings: async function() {
          return {
            theme: store.activeTheme || 'light',
            typography: localStorage.getItem('cardspoke_typography') || 'default',
            highContrast: document.documentElement.classList.contains('high-contrast'),
            reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          };
        },
        setTheme: async function(theme) {
          if (theme !== 'light' && theme !== 'dark') throw new Error('Theme must be "light" or "dark"');
          applyTheme(theme);
          return true;
        },
        getTheme: async function() { return store.activeTheme || 'light'; },
        setTypography: async function(preset) {
          var valid = ['default', 'comfortable', 'compact', 'dyslexia'];
          if (!valid.includes(preset)) throw new Error('Preset must be one of: ' + valid.join(', '));
          localStorage.setItem('cardspoke_typography', preset);
          document.documentElement.setAttribute('data-typography', preset);
          return true;
        },
        getTypography: async function() { return localStorage.getItem('cardspoke_typography') || 'default'; },
        setHighContrast: async function(enabled) {
          if (enabled) document.documentElement.classList.add('high-contrast');
          else document.documentElement.classList.remove('high-contrast');
          localStorage.setItem('cardspoke_highcontrast', enabled.toString());
          return true;
        },
        isHighContrast: async function() { return document.documentElement.classList.contains('high-contrast'); },
        prefersReducedMotion: async function() { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; },
        getThemeVariables: async function() {
          return {
            colors: ['--bg', '--surface', '--border', '--text', '--text-medium', '--text-muted', '--text-ghost'],
            typography: ['--font', '--font-brand', '--text-xs', '--text-sm', '--text-base', '--text-lg', '--text-xl', '--text-2xl', '--text-3xl'],
            spacing: ['--space-xs', '--space-sm', '--space-md', '--space-lg', '--space-xl', '--space-2xl', '--space-3xl', '--space-4xl', '--radius'],
            accessibility: {
              highContrast: ['--hc-bg', '--hc-text', '--hc-border', '--hc-accent'],
              focus: ['--focus-outline-color', '--focus-outline-width']
            }
          };
        }
      });

      if (isDeveloperMode()) {
        console.log('[CardSpoke.utils] API initialized and available at window.CardSpoke.utils');
      }
