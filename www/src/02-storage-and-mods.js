      // Source Part 2/5: Storage drivers, navigation, and mod runtime
      // Concatenated via `npm run build` in lexical order of www/src/*.js
      // =============================================================
      // --- STORAGE DRIVER ARCHITECTURE (v0.9.4) ---
      // =============================================================

      // Cloud Storage Configuration
      // Replace these with your own OAuth client IDs
      const GOOGLE_CLIENT_ID = '905559232060-5utnmrdvr3n7k2rvamkt7rcflhj2afs8.apps.googleusercontent.com';
      const MS_CLIENT_ID = '222a2760-c041-43ee-b83b-57957fd632bf';

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
       * Google Drive Storage Driver
       * Uses Google Identity Services for authentication
       */
      class GoogleDriveDriver extends StorageDriver {
        constructor() {
          super();
          this.accessToken = null;
          this.tokenClient = null;
          this.fileName = 'cardspoke.json';
          this.fileId = null;
        }

        async init(config = {}) {
          this.fileName = config.fileName || 'cardspoke.json';
          if (typeof google === 'undefined' || !google.accounts) {
            throw new Error('Google Identity Services not loaded. Please refresh the page.');
          }
          if (GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com') {
            throw new Error('Google Drive not configured. Developer needs to set up OAuth client ID.');
          }
          this.tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/drive.file',
            callback: (response) => {
              if (response.error) {
                showToast('Google Drive authentication failed: ' + response.error, 'error');
                return;
              }
              this.accessToken = response.access_token;
            },
          });
          return Promise.resolve();
        }

        async ensureAuthenticated() {
          if (!this.accessToken) {
            return new Promise((resolve, reject) => {
              this.tokenClient.callback = (response) => {
                if (response.error) {
                  reject(new Error('Authentication failed: ' + response.error));
                  return;
                }
                this.accessToken = response.access_token;
                resolve();
              };
              this.tokenClient.requestAccessToken();
            });
          }
        }

        async findFile() {
          await this.ensureAuthenticated();
          const response = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=name='${this.fileName}' and trashed=false`,
            { headers: { Authorization: `Bearer ${this.accessToken}` } }
          );
          if (!response.ok) throw new Error('Failed to search for file: ' + response.statusText);
          const data = await response.json();
          return data.files && data.files.length > 0 ? data.files[0].id : null;
        }

        async get(key) {
          try {
            const fileId = await this.findFile();
            if (!fileId) return null;
            const response = await fetch(
              `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
              { headers: { Authorization: `Bearer ${this.accessToken}` } }
            );
            if (!response.ok) throw new Error('Failed to download file: ' + response.statusText);
            const data = await response.json();
            return data[key] || null;
          } catch (error) {
            console.error('Google Drive get error:', error);
            showToast('Failed to read from Google Drive: ' + error.message, 'error');
            return null;
          }
        }

        async set(key, value) {
          try {
            await this.ensureAuthenticated();
            let fileId = await this.findFile();
            let allData = {};
            if (fileId) {
              const response = await fetch(
                `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
                { headers: { Authorization: `Bearer ${this.accessToken}` } }
              );
              if (response.ok) allData = await response.json();
            }
            allData[key] = value;
            const content = JSON.stringify(allData, null, 2);
            if (fileId) {
              const response = await fetch(
                `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
                {
                  method: 'PATCH',
                  headers: { Authorization: `Bearer ${this.accessToken}`, 'Content-Type': 'application/json' },
                  body: content,
                }
              );
              if (!response.ok) throw new Error('Failed to update file: ' + response.statusText);
            } else {
              const metadata = { name: this.fileName, mimeType: 'application/json' };
              const form = new FormData();
              form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
              form.append('file', new Blob([content], { type: 'application/json' }));
              const response = await fetch(
                'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
                { method: 'POST', headers: { Authorization: `Bearer ${this.accessToken}` }, body: form }
              );
              if (!response.ok) throw new Error('Failed to create file: ' + response.statusText);
            }
          } catch (error) {
            console.error('Google Drive set error:', error);
            showToast('Failed to save to Google Drive: ' + error.message, 'error');
            throw error;
          }
        }

        async remove(key) {
          try {
            const fileId = await this.findFile();
            if (!fileId) return;
            const response = await fetch(
              `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
              { headers: { Authorization: `Bearer ${this.accessToken}` } }
            );
            if (response.ok) {
              const allData = await response.json();
              delete allData[key];
              const content = JSON.stringify(allData, null, 2);
              await fetch(
                `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
                {
                  method: 'PATCH',
                  headers: { Authorization: `Bearer ${this.accessToken}`, 'Content-Type': 'application/json' },
                  body: content,
                }
              );
            }
          } catch (error) {
            console.error('Google Drive remove error:', error);
            showToast('Failed to remove from Google Drive: ' + error.message, 'error');
            throw error;
          }
        }

        async list(prefix = '') {
          try {
            const fileId = await this.findFile();
            if (!fileId) return [];
            const response = await fetch(
              `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
              { headers: { Authorization: `Bearer ${this.accessToken}` } }
            );
            if (!response.ok) return [];
            const allData = await response.json();
            const keys = Object.keys(allData);
            return prefix ? keys.filter(k => k.startsWith(prefix)) : keys;
          } catch (error) {
            console.error('Google Drive list error:', error);
            return [];
          }
        }

        async getSize() {
          try {
            const fileId = await this.findFile();
            if (!fileId) return 0;
            const response = await fetch(
              `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
              { headers: { Authorization: `Bearer ${this.accessToken}` } }
            );
            if (!response.ok) return 0;
            const content = await response.text();
            return content.length;
          } catch (error) {
            console.error('Google Drive getSize error:', error);
            return 0;
          }
        }

        getKind() {
          return 'googledrive';
        }
      }

      /**
       * OneDrive Storage Driver
       * Uses MSAL.js for Microsoft authentication
       */
      class OneDriveDriver extends StorageDriver {
        constructor() {
          super();
          this.msalInstance = null;
          this.accessToken = null;
          this.fileName = 'cardspoke.json';
        }

        async init(config = {}) {
          this.fileName = config.fileName || 'cardspoke.json';
          if (typeof msal === 'undefined') {
            throw new Error('MSAL library not loaded. Please refresh the page.');
          }
          if (MS_CLIENT_ID === 'YOUR_MICROSOFT_CLIENT_ID') {
            throw new Error('OneDrive not configured. Developer needs to set up OAuth client ID.');
          }
          const msalConfig = {
            auth: {
              clientId: MS_CLIENT_ID,
              authority: 'https://login.microsoftonline.com/common',
              redirectUri: window.location.origin,
            },
            cache: { cacheLocation: 'sessionStorage', storeAuthStateInCookie: false },
          };
          this.msalInstance = new msal.PublicClientApplication(msalConfig);
          await this.msalInstance.initialize();
          return Promise.resolve();
        }

        async ensureAuthenticated() {
          if (this.accessToken) return;
          const accounts = this.msalInstance.getAllAccounts();
          const request = { scopes: ['Files.ReadWrite', 'User.Read'], account: accounts[0] };
          try {
            const response = await this.msalInstance.acquireTokenSilent(request);
            this.accessToken = response.accessToken;
          } catch (error) {
            const response = await this.msalInstance.loginPopup(request);
            this.accessToken = response.accessToken;
          }
        }

        async findFile() {
          await this.ensureAuthenticated();
          const response = await fetch(
            `https://graph.microsoft.com/v1.0/me/drive/root/search(q='${this.fileName}')`,
            { headers: { Authorization: `Bearer ${this.accessToken}` } }
          );
          if (!response.ok) throw new Error('Failed to search for file: ' + response.statusText);
          const data = await response.json();
          return data.value && data.value.length > 0 ? data.value[0].id : null;
        }

        async get(key) {
          try {
            const fileId = await this.findFile();
            if (!fileId) return null;
            const response = await fetch(
              `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`,
              { headers: { Authorization: `Bearer ${this.accessToken}` } }
            );
            if (!response.ok) throw new Error('Failed to download file: ' + response.statusText);
            const data = await response.json();
            return data[key] || null;
          } catch (error) {
            console.error('OneDrive get error:', error);
            showToast('Failed to read from OneDrive: ' + error.message, 'error');
            return null;
          }
        }

        async set(key, value) {
          try {
            await this.ensureAuthenticated();
            let fileId = await this.findFile();
            let allData = {};
            if (fileId) {
              const response = await fetch(
                `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`,
                { headers: { Authorization: `Bearer ${this.accessToken}` } }
              );
              if (response.ok) allData = await response.json();
            }
            allData[key] = value;
            const content = JSON.stringify(allData, null, 2);
            const uploadUrl = fileId
              ? `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`
              : `https://graph.microsoft.com/v1.0/me/drive/root:/${this.fileName}:/content`;
            const response = await fetch(uploadUrl, {
              method: 'PUT',
              headers: { Authorization: `Bearer ${this.accessToken}`, 'Content-Type': 'application/json' },
              body: content,
            });
            if (!response.ok) throw new Error('Failed to save file: ' + response.statusText);
          } catch (error) {
            console.error('OneDrive set error:', error);
            showToast('Failed to save to OneDrive: ' + error.message, 'error');
            throw error;
          }
        }

        async remove(key) {
          try {
            const fileId = await this.findFile();
            if (!fileId) return;
            const response = await fetch(
              `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`,
              { headers: { Authorization: `Bearer ${this.accessToken}` } }
            );
            if (response.ok) {
              const allData = await response.json();
              delete allData[key];
              const content = JSON.stringify(allData, null, 2);
              await fetch(
                `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`,
                {
                  method: 'PUT',
                  headers: { Authorization: `Bearer ${this.accessToken}`, 'Content-Type': 'application/json' },
                  body: content,
                }
              );
            }
          } catch (error) {
            console.error('OneDrive remove error:', error);
            showToast('Failed to remove from OneDrive: ' + error.message, 'error');
            throw error;
          }
        }

        async list(prefix = '') {
          try {
            const fileId = await this.findFile();
            if (!fileId) return [];
            const response = await fetch(
              `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`,
              { headers: { Authorization: `Bearer ${this.accessToken}` } }
            );
            if (!response.ok) return [];
            const allData = await response.json();
            const keys = Object.keys(allData);
            return prefix ? keys.filter(k => k.startsWith(prefix)) : keys;
          } catch (error) {
            console.error('OneDrive list error:', error);
            return [];
          }
        }

        async getSize() {
          try {
            const fileId = await this.findFile();
            if (!fileId) return 0;
            const response = await fetch(
              `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`,
              { headers: { Authorization: `Bearer ${this.accessToken}` } }
            );
            if (!response.ok) return 0;
            const content = await response.text();
            return content.length;
          } catch (error) {
            console.error('OneDrive getSize error:', error);
            return 0;
          }
        }

        getKind() {
          return 'onedrive';
        }
      }

      /**
       * WebDAV Storage Driver
       * For self-hosted cloud storage
       */
      class WebDAVDriver extends StorageDriver {
        constructor() {
          super();
          this.url = null;
          this.username = null;
          this.password = null;
          this.fileName = 'cardspoke.json';
        }

        async init(config = {}) {
          if (!config.url || !config.username || !config.password) {
            throw new Error('WebDAV requires url, username, and password in config');
          }
          // Security: Validate HTTPS usage
          const url = config.url.toLowerCase();
          if (url.startsWith('http://') && !url.includes('localhost') && !url.includes('127.0.0.1')) {
            const useInsecure = confirm(
              '⚠️ SECURITY WARNING: You are connecting to WebDAV over HTTP (not HTTPS).\n\n' +
              'Your credentials and data will be transmitted unencrypted and could be intercepted.\n\n' +
              'We strongly recommend using HTTPS for WebDAV connections.\n\n' +
              'Do you want to continue with insecure HTTP anyway?'
            );
            if (!useInsecure) {
              throw new Error('WebDAV connection rejected: HTTPS required for security');
            }
            showToast('⚠️ Warning: Using insecure HTTP connection to WebDAV', 'error');
          }
          this.url = config.url.endsWith('/') ? config.url : config.url + '/';
          this.username = config.username;
          this.password = config.password;
          this.fileName = config.fileName || 'cardspoke.json';
          return Promise.resolve();
        }

        getAuthHeader() {
          const credentials = btoa(`${this.username}:${this.password}`);
          return `Basic ${credentials}`;
        }

        async get(key) {
          try {
            const response = await fetch(this.url + this.fileName, {
              method: 'GET',
              headers: { Authorization: this.getAuthHeader() },
            });
            if (response.status === 404) return null;
            if (!response.ok) throw new Error('Failed to read file: ' + response.statusText);
            const allData = await response.json();
            return allData[key] || null;
          } catch (error) {
            if (error.message.includes('CORS')) {
              showToast('CORS error: Configure your WebDAV server to allow requests from this origin', 'error');
            } else {
              showToast('Failed to read from WebDAV: ' + error.message, 'error');
            }
            console.error('WebDAV get error:', error);
            return null;
          }
        }

        async set(key, value) {
          try {
            let allData = {};
            try {
              const response = await fetch(this.url + this.fileName, {
                method: 'GET',
                headers: { Authorization: this.getAuthHeader() },
              });
              if (response.ok) allData = await response.json();
            } catch (error) {
              // File doesn't exist yet
            }
            allData[key] = value;
            const content = JSON.stringify(allData, null, 2);
            const response = await fetch(this.url + this.fileName, {
              method: 'PUT',
              headers: { Authorization: this.getAuthHeader(), 'Content-Type': 'application/json' },
              body: content,
            });
            if (!response.ok) throw new Error('Failed to write file: ' + response.statusText);
          } catch (error) {
            if (error.message.includes('CORS')) {
              showToast('CORS error: Configure your WebDAV server to allow requests from this origin', 'error');
            } else {
              showToast('Failed to save to WebDAV: ' + error.message, 'error');
            }
            console.error('WebDAV set error:', error);
            throw error;
          }
        }

        async remove(key) {
          try {
            const response = await fetch(this.url + this.fileName, {
              method: 'GET',
              headers: { Authorization: this.getAuthHeader() },
            });
            if (response.ok) {
              const allData = await response.json();
              delete allData[key];
              const content = JSON.stringify(allData, null, 2);
              await fetch(this.url + this.fileName, {
                method: 'PUT',
                headers: { Authorization: this.getAuthHeader(), 'Content-Type': 'application/json' },
                body: content,
              });
            }
          } catch (error) {
            console.error('WebDAV remove error:', error);
            showToast('Failed to remove from WebDAV: ' + error.message, 'error');
            throw error;
          }
        }

        async list(prefix = '') {
          try {
            const response = await fetch(this.url + this.fileName, {
              method: 'GET',
              headers: { Authorization: this.getAuthHeader() },
            });
            if (!response.ok) return [];
            const allData = await response.json();
            const keys = Object.keys(allData);
            return prefix ? keys.filter(k => k.startsWith(prefix)) : keys;
          } catch (error) {
            console.error('WebDAV list error:', error);
            return [];
          }
        }

        async getSize() {
          try {
            const response = await fetch(this.url + this.fileName, {
              method: 'GET',
              headers: { Authorization: this.getAuthHeader() },
            });
            if (!response.ok) return 0;
            const content = await response.text();
            return content.length;
          } catch (error) {
            console.error('WebDAV getSize error:', error);
            return 0;
          }
        }

        getKind() {
          return 'webdav';
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
            case 'googledrive':
              driver = new GoogleDriveDriver();
              break;
            case 'onedrive':
              driver = new OneDriveDriver();
              break;
            case 'localstorage':
            default:
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

      // Cloud sync tracking
      let cloudSyncTimeout = null;
      let lastCloudSyncTime = 0;
      const CLOUD_SYNC_DEBOUNCE_MS = 60000; // Wait 60s between cloud syncs to respect API limits

      /**
       * Sync data to cloud storage if configured
       * Debounced to avoid excessive API calls
       */
      async function syncToCloud() {
        // Check if cloud storage is configured
        if (!store.metadata || !store.metadata.storageType) return;
        
        const storageType = store.metadata.storageType;
        if (storageType !== 'googledrive' && storageType !== 'onedrive') return;
        
        try {
          let driver;
          const config = store.metadata.storageConfig || {};
          
          if (storageType === 'googledrive') {
            driver = new GoogleDriveDriver();
          } else if (storageType === 'onedrive') {
            driver = new OneDriveDriver();
          }
          
          if (!driver) return;
          
          await driver.init(config);
          await driver.ensureAuthenticated();
          await driver.set('cardspoke.json', JSON.stringify(store));
          
          lastCloudSyncTime = Date.now();
          console.log(`[Cloud Sync] Synced to ${storageType} at ${new Date().toISOString()}`);
          showToast('Cloud sync complete', 'success');
        } catch (error) {
          console.error('[Cloud Sync] Error:', error);
          showToast('Cloud sync failed: ' + error.message, 'error');
        }
      }

      /**
       * Schedule cloud sync with debouncing
       */
      function scheduleCloudSync() {
        // Check if cloud storage is configured
        if (!store.metadata || !store.metadata.storageType) return;
        
        const storageType = store.metadata.storageType;
        if (storageType !== 'googledrive' && storageType !== 'onedrive') return;
        
        // Clear any pending cloud sync
        if (cloudSyncTimeout) {
          clearTimeout(cloudSyncTimeout);
          cloudSyncTimeout = null;
        }
        
        // Check if we're syncing too frequently - if enough time has passed, sync immediately
        const timeSinceLastSync = Date.now() - lastCloudSyncTime;
        const delay = timeSinceLastSync >= CLOUD_SYNC_DEBOUNCE_MS ? 0 : CLOUD_SYNC_DEBOUNCE_MS - timeSinceLastSync;
        
        cloudSyncTimeout = setTimeout(() => {
          syncToCloud();
        }, delay);
      }

      function saveNow() {
        try {
          const key = instanceKey || 'nested_cards_store';
          const startTime = performance.now();

          // Use requestIdleCallback if available to avoid blocking UI
          const doSave = () => {
            try {
              const payload = JSON.stringify(store);
              localStorage.setItem(key, payload);

              if (isIndexedDbDataset()) {
                getIndexedDbMirrorDriver()
                  .then(driver => driver.set(key, payload))
                  .catch(err => console.error('[IndexedDB] Mirror save failed:', err));
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

              if (getStorageType() === 'localfile') {
                writeDatasetToLocalFile(payload)
                  .catch(err => {
                    console.error('[Local File] Save failed:', err);
                    showToast('Local file save failed: ' + err.message, 'error');
                  });
              }
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
            activeTheme: parsed.activeTheme || 'light',
            metadata: parsed.metadata || {}
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

          const storageType = getStorageType();
          if (storageType === 'indexeddb') {
            getIndexedDbMirrorDriver()
              .then(driver => driver.get(key))
              .then(payload => {
                if (!payload) return;
                const parsedMirror = typeof payload === 'string' ? JSON.parse(payload) : payload;
                if (!parsedMirror || typeof parsedMirror !== 'object') return;
                store = {
                  rootOrder: parsedMirror.rootOrder || [],
                  cards: parsedMirror.cards || {},
                  mods: parsedMirror.mods || {},
                  bookmarks: parsedMirror.bookmarks || [],
                  recentCards: parsedMirror.recentCards || [],
                  viewMode: parsedMirror.viewMode || 'normal',
                  activeTheme: parsedMirror.activeTheme || 'light',
                  metadata: parsedMirror.metadata || store.metadata
                };
                render();
              })
              .catch(err => {
                console.error('[IndexedDB] Load failed, using LocalStorage fallback:', err);
              });
          } else if (storageType === 'localfile') {
            readDatasetFromLocalFile()
              .then(payload => {
                if (!payload) return;
                const parsedFile = JSON.parse(payload);
                store = {
                  rootOrder: parsedFile.rootOrder || [],
                  cards: parsedFile.cards || {},
                  mods: parsedFile.mods || {},
                  bookmarks: parsedFile.bookmarks || [],
                  recentCards: parsedFile.recentCards || [],
                  viewMode: parsedFile.viewMode || 'normal',
                  activeTheme: parsedFile.activeTheme || 'light',
                  metadata: parsedFile.metadata || store.metadata
                };
                render();
              })
              .catch(err => {
                console.error('[Local File] Load failed, using LocalStorage fallback:', err);
              });
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
      // --- MOD SYSTEM v2 ---
      // JSON-driven mod loading system. Mods are JSON packages that
      // can do anything from simple themes to full app transformations.
      //
      // Mod layers:
      //   theme   - CSS only. No JS execution. Safest.
      //   feature - CSS + JS. Hooks, DOM manipulation, card behavior.
      //   app     - CSS + JS + overrides. Can rename app, add pages,
      //             hide features, replace menus, etc.
      // =============================================================
      
       /**
        * =============================================================
        * EXTENSION HOOKS

      // Valid mod layers (determines capabilities)
      const MOD_LAYERS = ['theme', 'feature', 'app'];

      // Valid hooks that mods can implement
      const VALID_MOD_HOOKS = new Set([
        'onLoad', 'onEnable', 'onDisable', 'onUninstall',
        'onCardSave', 'onCardDelete', 'onCardRender',
        'onNavigate', 'onSearch', 'onThemeChange',
        'onTypographyChange', 'onHighContrastChange',
        'onExport', 'onImport', 'onRender', 'onPageChange'
      ]);

      /**
       * Validate a mod JSON package structure.
       * Returns { valid: boolean, errors: string[] }
       */
      function validateModPackage(pkg) {
        const errors = [];
        if (!pkg || typeof pkg !== 'object') {
          return { valid: false, errors: ['Mod package must be a JSON object'] };
        }
        if (!pkg.id || typeof pkg.id !== 'string') errors.push('Missing or invalid "id" field');
        if (!pkg.manifest || typeof pkg.manifest !== 'object') {
          errors.push('Missing "manifest" object');
        } else {
          if (!pkg.manifest.name) errors.push('Missing manifest.name');
          if (!pkg.manifest.version) errors.push('Missing manifest.version');
          if (!pkg.manifest.author) errors.push('Missing manifest.author');
          if (!pkg.manifest.layer) errors.push('Missing manifest.layer');
          if (pkg.manifest.layer && !MOD_LAYERS.includes(pkg.manifest.layer)) {
            errors.push('manifest.layer must be one of: ' + MOD_LAYERS.join(', '));
          }
        }
        // Theme layer mods must not have JS
        if (pkg.manifest && pkg.manifest.layer === 'theme' && pkg.js && pkg.js.trim().length > 0) {
          errors.push('Theme-layer mods cannot contain JavaScript');
        }
        // Overrides only allowed for app layer
        if (pkg.overrides && Object.keys(pkg.overrides).length > 0 && pkg.manifest && pkg.manifest.layer !== 'app') {
          errors.push('Only app-layer mods can use overrides');
        }
        return { valid: errors.length === 0, errors };
      }

      /**
       * Assess risk level of a mod package
       */
      function assessModRisk(pkg) {
        const manifest = pkg.manifest || {};
        const layer = manifest.layer || 'feature';
        const hasJS = pkg.js && pkg.js.trim().length > 0;
        const hasCSS = pkg.css && pkg.css.trim().length > 0;
        const hasOverrides = pkg.overrides && Object.keys(pkg.overrides).length > 0;

        let riskScore = 0;
        const permissions = [];
        const risks = [];

        if (layer === 'theme') {
          permissions.push('Modify visual appearance');
        } else if (layer === 'feature') {
          riskScore += 3;
          permissions.push('Execute JavaScript code');
          permissions.push('Modify card behavior');
        } else if (layer === 'app') {
          riskScore += 5;
          permissions.push('Execute JavaScript code');
          permissions.push('Override app features');
          permissions.push('Modify menus and pages');
          risks.push('Can fundamentally alter the application');
        }

        if (hasJS) {
          const js = pkg.js;
          if (js.includes('fetch(') || js.includes('XMLHttpRequest')) {
            riskScore += 2;
            permissions.push('Make network requests');
            risks.push('Can send data to external servers');
          }
          if (js.includes('eval(') || js.includes('new Function(')) {
            riskScore += 2;
            risks.push('Can execute dynamic code');
          }
          if (js.includes('document.cookie')) {
            riskScore += 2;
            risks.push('Can access cookies');
          }
        }

        if (hasOverrides) {
          if (pkg.overrides.appName) permissions.push('Rename the application');
          if (pkg.overrides.hideMenuItems) permissions.push('Hide menu items');
          if (pkg.overrides.customPages) permissions.push('Add custom pages');
          if (pkg.overrides.disableFeatures) {
            permissions.push('Disable built-in features');
            risks.push('Can disable core functionality');
          }
        }

        let riskLevel, color, icon;
        if (layer === 'theme' && !hasJS) {
          riskLevel = 'SAFE'; color = '#22c55e'; icon = '\u2713';
        } else if (riskScore <= 3) {
          riskLevel = 'LOW'; color = '#22c55e'; icon = '\u2713';
        } else if (riskScore <= 5) {
          riskLevel = 'MEDIUM'; color = '#f59e0b'; icon = '\u26A0';
        } else {
          riskLevel = 'HIGH'; color = '#ef4444'; icon = '\u26A0';
        }

        return { riskLevel, riskScore, color, icon, layer, hasJS, hasCSS, hasOverrides, permissions, risks };
      }

      /**
       * Convert a legacy extension (old format) to new mod package format.
       * Handles automatic migration of store.mods entries.
       */
      function migrateLegacyMod(modId, legacyData) {
        const meta = legacyData.meta || {};
        let layer = 'feature';
        const type = (meta.type || '').toLowerCase();
        if (type === 'theme') layer = 'theme';
        else if (type === 'expansion' || type === 'kit') layer = 'app';

        return {
          id: modId,
          manifest: {
            name: meta.name || modId,
            version: meta.version || '1.0.0',
            author: meta.creator || 'Unknown',
            description: meta.description || '',
            layer: layer,
            compatibility: '>=' + APP_VERSION
          },
          config: {},
          css: legacyData.css || '',
          js: legacyData.js || '',
          overrides: {},
          enabled: !!legacyData.enabled
        };
      }

      // =============================================================
      // --- CardSpoke_MODS Runtime ---
      // The core mod runtime that manages loading, hooks, and lifecycle
      // =============================================================

      const CardSpoke_MODS = (() => {
        const registry = {};
        const styleTags = {};
        const initializedMods = new Set();
        const errorCounts = {};
        const hookStats = {};
        const eventListeners = {};
        const activeOverrides = {};

        function createModLogger(modId) {
          const prefix = '[Mod:' + modId + ']';
          return {
            log: function() { console.log.apply(console, [prefix].concat(Array.from(arguments))); },
            info: function() { console.info.apply(console, [prefix].concat(Array.from(arguments))); },
            warn: function() { console.warn.apply(console, [prefix].concat(Array.from(arguments))); },
            error: function() { console.error.apply(console, [prefix].concat(Array.from(arguments))); }
          };
        }

        function createStoreAPI(modId) {
          var modLogger = createModLogger(modId);
          return {
            getAppInfo: function() {
              return { appVersion: APP_VERSION, schemaVersion: SCHEMA_VERSION };
            },
            getCard: function(id) { return cloneCard(store.cards[id]); },
            listCards: function() { return Object.values(store.cards).map(cloneCard); },
            listRootIds: function() { return store.rootOrder.slice(); },
            getNavState: function() { return Object.assign({}, navState); },
            navigate: function(page, opts) { goTo(page, opts || {}); },
            goBack: function() { goBack(); },
            showToast: function(message, type) { showToast(message, type || 'success'); },
            markDirty: function() { dirty = true; },
            createCard: function(data) {
              data = data || {};
              var id = createCard(data.title || '', data.body || '', data.parentId || null, false, false);
              if (Array.isArray(data.tags) && data.tags.length) setTags(id, data.tags, false);
              return id;
            },
            updateCard: function(id, updates) {
              updateCard(id, updates || {}, false, false);
              return cloneCard(store.cards[id]);
            },
            deleteCard: function(id) { deleteCard(id); return true; },
            getTags: function(cardId) { return getTags(cardId); },
            addTag: function(cardId, tag) { return addTag(cardId, tag); },
            removeTag: function(cardId, tag) { return removeTag(cardId, tag); },
            setTags: function(cardId, tags) { return setTags(cardId, tags); },
            getAllTags: function() { return getAllTags(); },
            getDatasetMeta: function() {
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
            getModConfig: function() {
              var pkg = store.mods[modId];
              return (pkg && pkg.config) ? JSON.parse(JSON.stringify(pkg.config)) : {};
            },
            setModConfig: function(key, value) {
              var pkg = store.mods[modId];
              if (!pkg) return;
              if (!pkg.config) pkg.config = {};
              pkg.config[key] = value;
              save();
            },
            logger: modLogger,
            log: modLogger.log,
            warn: modLogger.warn,
            error: modLogger.error,
            info: modLogger.info
          };
        }

        function buildContext(modId) {
          return {
            modId: modId,
            appVersion: APP_VERSION,
            schemaVersion: SCHEMA_VERSION,
            api: createStoreAPI(modId),
            utils: window.CardSpoke && window.CardSpoke.utils ? window.CardSpoke.utils : {},
            logger: createModLogger(modId)
          };
        }

        function ensureStyle(modId, css) {
          if (!css || styleTags[modId]) return;
          var tag = document.createElement('style');
          tag.setAttribute('data-mod-style', modId);
          tag.textContent = css;
          document.head.appendChild(tag);
          styleTags[modId] = tag;
          console.log('[Mods] Applied CSS for: ' + modId);
        }

        function removeStyle(modId) {
          var tag = styleTags[modId];
          if (tag && tag.parentNode) {
            tag.parentNode.removeChild(tag);
            console.log('[Mods] Removed CSS for: ' + modId);
          }
          delete styleTags[modId];
        }

        function ensureRegistered(modId, pkg) {
          var existing = registry[modId];
          if (existing && existing.__loaded) return existing;

          var manifest = pkg.manifest || {};
          var layer = manifest.layer || 'feature';

          // CSS-only for theme layer
          if (!pkg.js || pkg.js.trim().length === 0 || layer === 'theme') {
            if (!registry[modId]) {
              registry[modId] = { id: modId, hooks: {}, manifest: manifest, __loaded: true };
            }
            return registry[modId];
          }

          try {
            registry[modId] = registry[modId] || { id: modId, hooks: {}, manifest: {} };
            var sourceURL = '\n//# sourceURL=' + modId + '.mod.js';
            var storeAPI = createStoreAPI(modId);
            var runner = new Function('window', 'document', 'CardSpoke_MODS', 'storeAPI', 'console', pkg.js + sourceURL);
            runner(window, document, CardSpoke_MODS, storeAPI, console);
            registry[modId].manifest = Object.assign({}, manifest);
            registry[modId].__loaded = true;
            console.log('[Mods] Loaded: ' + modId, manifest);
            return registry[modId];
          } catch (err) {
            console.error('[Mods] Failed to load ' + modId + ':', err);
            registry[modId] = registry[modId] || { id: modId, hooks: {}, manifest: manifest };
            registry[modId].__loaded = false;
            registry[modId].__error = err;
            return null;
          }
        }

        function applyOverrides(modId, pkg) {
          if (!pkg.overrides || pkg.manifest.layer !== 'app') return;
          var ov = pkg.overrides;
          activeOverrides[modId] = ov;

          // App name override
          if (ov.appName) {
            var brandBtn = document.getElementById('brandBtn');
            if (brandBtn) brandBtn.textContent = ov.appName;
            document.title = ov.appName;
          }

          // Hide menu items
          if (Array.isArray(ov.hideMenuItems)) {
            ov.hideMenuItems.forEach(function(itemId) {
              var el = document.getElementById(itemId);
              if (el) el.style.display = 'none';
            });
          }

          // Custom menu items
          if (Array.isArray(ov.customMenuItems)) {
            ov.customMenuItems.forEach(function(item) {
              var section = document.querySelector('.menu-section:first-child');
              if (!section) return;
              var existing = document.getElementById('mod-menu-' + item.id);
              if (existing) return;
              var btn = document.createElement('button');
              btn.className = 'menu-item';
              btn.id = 'mod-menu-' + item.id;
              btn.textContent = item.label;
              btn.onclick = function() {
                var overlay = document.getElementById('menuOverlay');
                if (overlay) overlay.classList.remove('show');
                if (item.page) {
                  goTo(item.page, {});
                }
                CardSpoke_MODS.events.emit('menuItem:' + item.id, {});
              };
              section.appendChild(btn);
            });
          }
        }

        function removeOverrides(modId) {
          var ov = activeOverrides[modId];
          if (!ov) return;

          // Restore app name
          if (ov.appName) {
            var brandBtn = document.getElementById('brandBtn');
            if (brandBtn) brandBtn.textContent = 'CardSpoke';
            document.title = 'CardSpoke';
          }

          // Restore hidden menu items
          if (Array.isArray(ov.hideMenuItems)) {
            ov.hideMenuItems.forEach(function(itemId) {
              var el = document.getElementById(itemId);
              if (el) el.style.display = '';
            });
          }

          // Remove custom menu items
          if (Array.isArray(ov.customMenuItems)) {
            ov.customMenuItems.forEach(function(item) {
              var el = document.getElementById('mod-menu-' + item.id);
              if (el && el.parentNode) el.parentNode.removeChild(el);
            });
          }

          delete activeOverrides[modId];
        }

        // --- PUBLIC API ---
        return {
          registry: registry,
          _registry: registry,

          /**
           * Install a mod from a JSON package object.
           * Validates, stores in store.mods, and optionally enables.
           */
          install: function(pkg, autoEnable) {
            var validation = validateModPackage(pkg);
            if (!validation.valid) {
              showToast('Invalid mod: ' + validation.errors.join(', '), 'error');
              return false;
            }
            var modId = pkg.id;
            store.mods[modId] = JSON.parse(JSON.stringify(pkg));
            if (autoEnable) {
              store.mods[modId].enabled = true;
            }
            save();
            if (store.mods[modId].enabled) {
              this.enable(modId);
            }
            console.log('[Mods] Installed: ' + modId);
            showToast('Installed mod: ' + (pkg.manifest.name || modId), 'success');
            return true;
          },

          /**
           * Uninstall a mod completely.
           */
          uninstall: function(modId) {
            this.runHookForMod(modId, 'onUninstall');
            removeOverrides(modId);
            removeStyle(modId);
            delete registry[modId];
            initializedMods.delete(modId);
            delete errorCounts[modId];
            if (store.mods[modId]) {
              delete store.mods[modId];
              save();
            }
            console.log('[Mods] Uninstalled: ' + modId);
          },

          /**
           * Register hooks from within mod JS code.
           * Called by mods: CardSpoke_MODS.register('my-mod', { onLoad: fn, ... })
           */
          register: function(modId, definition) {
            definition = definition || {};
            if (!modId) throw new Error('CardSpoke_MODS.register requires a mod id');
            var entry = registry[modId] || { id: modId, hooks: {}, manifest: {} };

            Object.entries(definition).forEach(function(pair) {
              var hook = pair[0];
              var fn = pair[1];
              if (hook.startsWith('on') && typeof fn === 'function') {
                if (!VALID_MOD_HOOKS.has(hook)) {
                  console.warn('[Mods] Unknown hook "' + hook + '" in ' + modId);
                }
                entry.hooks[hook] = fn;
              }
            });

            if (definition.meta) entry.manifest = Object.assign({}, definition.meta);
            registry[modId] = entry;
            entry.__loaded = true;
            errorCounts[modId] = 0;
            return entry;
          },

          /**
           * Unregister a mod from the registry (used by internal listeners).
           */
          unregister: function(modId) {
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

          enable: function(modId) {
            var pkg = store.mods[modId];
            if (!pkg) return false;
            pkg.enabled = true;
            ensureStyle(modId, pkg.css);
            var entry = ensureRegistered(modId, pkg);
            if (!entry) return false;
            initializedMods.delete(modId);
            applyOverrides(modId, pkg);
            save();
            this.runHookForMod(modId, 'onEnable');
            this.runHookForMod(modId, 'onLoad');
            return true;
          },

          disable: function(modId) {
            var pkg = store.mods[modId];
            if (!pkg) return false;
            this.runHookForMod(modId, 'onDisable');
            pkg.enabled = false;
            removeOverrides(modId);
            removeStyle(modId);
            initializedMods.delete(modId);
            save();
            return true;
          },

          syncFromStore: function() {
            // Remove registry entries for mods no longer in store
            Object.keys(registry).forEach(function(modId) {
              if (!store.mods[modId]) {
                removeStyle(modId);
                removeOverrides(modId);
                initializedMods.delete(modId);
                delete registry[modId];
              }
            });

            // Migrate any legacy format mods
            Object.entries(store.mods).forEach(function(pair) {
              var modId = pair[0];
              var modData = pair[1];
              if (modData.meta && !modData.manifest) {
                store.mods[modId] = migrateLegacyMod(modId, modData);
                console.log('[Mods] Migrated legacy mod: ' + modId);
              }
            });

            // Load enabled mods
            Object.entries(store.mods).forEach(function(pair) {
              var modId = pair[0];
              var pkg = pair[1];
              if (!pkg.enabled) return;
              ensureStyle(modId, pkg.css);
              ensureRegistered(modId, pkg);
              applyOverrides(modId, pkg);
            });
          },

          runHook: async function(hookName) {
            var args = Array.prototype.slice.call(arguments, 1);
            var promises = [];

            Object.keys(store.mods).forEach(function(modId) {
              var pkg = store.mods[modId];
              if (!pkg.enabled) return;
              var entry = registry[modId];
              if (!entry || !entry.__loaded || !entry.hooks[hookName]) return;
              if (hookName === 'onLoad' && initializedMods.has(modId)) return;

              try {
                var startTime = performance.now();
                var result = entry.hooks[hookName].apply(null, [buildContext(modId)].concat(args));

                if (result instanceof Promise) {
                  promises.push(
                    result
                      .then(function() {
                        var duration = performance.now() - startTime;
                        CardSpoke_MODS._recordHookExecution(modId, hookName, duration, true);
                        if (hookName === 'onLoad') initializedMods.add(modId);
                        errorCounts[modId] = 0;
                      })
                      .catch(function(err) {
                        var duration = performance.now() - startTime;
                        CardSpoke_MODS._recordHookExecution(modId, hookName, duration, false);
                        CardSpoke_MODS._handleHookError(modId, hookName, err);
                      })
                  );
                } else {
                  var duration = performance.now() - startTime;
                  CardSpoke_MODS._recordHookExecution(modId, hookName, duration, true);
                  if (hookName === 'onLoad') initializedMods.add(modId);
                  errorCounts[modId] = 0;
                }
              } catch (err) {
                CardSpoke_MODS._handleHookError(modId, hookName, err);
              }
            });

            if (promises.length > 0) {
              await Promise.allSettled(promises);
            }
          },

          runHookForMod: function(modId, hookName) {
            var args = Array.prototype.slice.call(arguments, 2);
            var pkg = store.mods[modId];
            if (!pkg) return;
            var entry = registry[modId];
            if (!entry || !entry.__loaded || !entry.hooks[hookName]) return;

            try {
              var startTime = performance.now();
              var result = entry.hooks[hookName].apply(null, [buildContext(modId)].concat(args));

              if (result instanceof Promise) {
                result
                  .then(function() {
                    var duration = performance.now() - startTime;
                    CardSpoke_MODS._recordHookExecution(modId, hookName, duration, true);
                    errorCounts[modId] = 0;
                  })
                  .catch(function(err) {
                    var duration = performance.now() - startTime;
                    CardSpoke_MODS._recordHookExecution(modId, hookName, duration, false);
                    CardSpoke_MODS._handleHookError(modId, hookName, err);
                  });
              } else {
                var duration = performance.now() - startTime;
                CardSpoke_MODS._recordHookExecution(modId, hookName, duration, true);
                errorCounts[modId] = 0;
              }
            } catch (err) {
              CardSpoke_MODS._handleHookError(modId, hookName, err);
            }
          },

          _handleHookError: function(modId, hookName, err) {
            console.error('[Mods] Error in ' + modId + '.' + hookName + ':', err);
            errorCounts[modId] = (errorCounts[modId] || 0) + 1;

            if (errorCounts[modId] >= 3) {
              console.error('[Mods] Auto-disabling ' + modId + ' due to repeated errors');
              showToast('Mod "' + modId + '" disabled due to repeated errors', 'error', 5000);
              this.disable(modId);
              return;
            }

            showToast('Mod error: ' + modId + ' (' + hookName + ') ' + err.message, 'error', 4000);

            if (!window._modErrors) window._modErrors = [];
            window._modErrors.push({
              modId: modId, hookName: hookName, error: err.message,
              stack: err.stack, timestamp: Date.now(), errorCount: errorCounts[modId]
            });
          },

          _recordHookExecution: function(modId, hookName, duration, success) {
            var key = modId + '.' + hookName;
            if (!hookStats[key]) {
              hookStats[key] = {
                modId: modId, hookName: hookName,
                executions: 0, failures: 0,
                totalDuration: 0, avgDuration: 0,
                maxDuration: 0, minDuration: Infinity
              };
            }
            var stats = hookStats[key];
            stats.executions++;
            if (!success) stats.failures++;
            stats.totalDuration += duration;
            stats.avgDuration = stats.totalDuration / stats.executions;
            stats.maxDuration = Math.max(stats.maxDuration, duration);
            stats.minDuration = Math.min(stats.minDuration, duration);
          },

          listMods: function() {
            return Object.keys(store.mods).map(function(id) {
              var pkg = store.mods[id];
              return {
                id: id,
                enabled: !!pkg.enabled,
                manifest: pkg.manifest || {},
                layer: (pkg.manifest && pkg.manifest.layer) || 'feature'
              };
            });
          },

          reload: function(modId) {
            var pkg = store.mods[modId];
            if (!pkg) return false;
            console.log('[Mods] Reloading ' + modId + '...');
            this.runHookForMod(modId, 'onDisable');
            removeOverrides(modId);
            removeStyle(modId);
            delete registry[modId];
            initializedMods.delete(modId);
            delete errorCounts[modId];
            ensureStyle(modId, pkg.css);
            var entry = ensureRegistered(modId, pkg);
            if (entry) {
              applyOverrides(modId, pkg);
              this.runHookForMod(modId, 'onEnable');
              this.runHookForMod(modId, 'onLoad');
              showToast('Reloaded: ' + modId, 'success');
              return true;
            }
            return false;
          },

          getActiveOverrides: function() {
            return JSON.parse(JSON.stringify(activeOverrides));
          },

          events: {
            on: function(eventName, callback) {
              if (!eventListeners[eventName]) eventListeners[eventName] = [];
              eventListeners[eventName].push(callback);
            },
            off: function(eventName, callback) {
              if (!eventListeners[eventName]) return;
              eventListeners[eventName] = eventListeners[eventName].filter(function(cb) { return cb !== callback; });
            },
            emit: function(eventName, data) {
              if (!eventListeners[eventName]) return;
              eventListeners[eventName].forEach(function(callback) {
                try { callback(data); } catch (err) {
                  console.error('[Mods] Event listener error for "' + eventName + '":', err);
                }
              });
            },
            clear: function(eventName) {
              if (eventName) delete eventListeners[eventName];
              else Object.keys(eventListeners).forEach(function(key) { delete eventListeners[key]; });
            }
          },

          devTools: {
            inspectMod: function(modId) {
              var entry = registry[modId];
              if (!entry) return null;
              return {
                id: modId,
                hooks: Object.keys(entry.hooks),
                manifest: entry.manifest,
                loaded: entry.__loaded,
                initialized: initializedMods.has(modId),
                error: entry.__error,
                errorCount: errorCounts[modId] || 0,
                enabled: store.mods[modId] ? !!store.mods[modId].enabled : false
              };
            },
            listAllMods: function() {
              return Object.keys(registry).map(function(modId) { return CardSpoke_MODS.devTools.inspectMod(modId); });
            },
            getHookStats: function(modId) {
              if (modId) {
                var filtered = {};
                Object.entries(hookStats).forEach(function(pair) {
                  if (pair[0].startsWith(modId + '.')) filtered[pair[0]] = pair[1];
                });
                return filtered;
              }
              return Object.assign({}, hookStats);
            },
            getErrorLog: function() { return window._modErrors || []; },
            clearErrorLog: function() { window._modErrors = []; },
            testHook: function(modId, hookName) {
              var args = Array.prototype.slice.call(arguments, 2);
              console.log('[Mods DevTools] Testing ' + modId + '.' + hookName, args);
              return CardSpoke_MODS.runHookForMod.apply(CardSpoke_MODS, [modId, hookName].concat(args));
            },
            getEventListeners: function() {
              var result = {};
              Object.keys(eventListeners).forEach(function(eventName) {
                result[eventName] = eventListeners[eventName].length;
              });
              return result;
            }
          }
        };
      })();

      window.CardSpoke = window.CardSpoke || {};
      window.CardSpoke.mods = CardSpoke_MODS;
      window.CardSpoke_MODS = CardSpoke_MODS;

      // =============================================================
      // --- CardSpoke.utils API ---
      // Public utility API for mod developers
      // =============================================================

      window.CardSpoke = window.CardSpoke || {};
      window.CardSpoke.utils = {
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
            modCount: Object.keys(store.mods || {}).length,
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
          runModHook('onTypographyChange', preset);
          return true;
        },
        getTypography: async function() { return localStorage.getItem('cardspoke_typography') || 'default'; },
        setHighContrast: async function(enabled) {
          if (enabled) document.documentElement.classList.add('high-contrast');
          else document.documentElement.classList.remove('high-contrast');
          localStorage.setItem('cardspoke_highcontrast', enabled.toString());
          runModHook('onHighContrastChange', enabled);
          return true;
        },
        isHighContrast: async function() { return document.documentElement.classList.contains('high-contrast'); },
        prefersReducedMotion: async function() { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; },
        onThemeChange: function(callback) {
          var id = 'theme-listener-' + Date.now();
          CardSpoke_MODS.register(id, {
            meta: { name: 'Theme Listener', layer: 'feature' },
            onThemeChange: function(ctx, theme) { callback(theme); }
          });
          return function() { CardSpoke_MODS.unregister(id); };
        },
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
      };

      if (isDeveloperMode()) {
        console.log('[CardSpoke.utils] API initialized and available at window.CardSpoke.utils');
      }

      function runModHook(hookName) {
        var args = Array.prototype.slice.call(arguments, 1);
        try {
          var start = performance.now();
          CardSpoke_MODS.runHook.apply(CardSpoke_MODS, [hookName].concat(args));
          var duration = performance.now() - start;
          if (duration > 120) {
            console.warn('Mod hook ' + hookName + ' took ' + Math.round(duration) + 'ms and may block UI.');
          }
        } catch (err) {
          console.warn('Mod hook failed', hookName, err);
          showToast('Mod error in ' + hookName + ': ' + (err.message || err), 'error', 5000);
        }
      }

