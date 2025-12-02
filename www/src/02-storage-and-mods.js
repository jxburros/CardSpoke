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
            case 'webdav':
              driver = new WebDAVDriver();
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

      /**
       * Extension Security Risk Assessment
       * Analyzes extension metadata to determine risk level
       */
      function assessExtensionRisk(modData) {
        const meta = modData.meta || {};
        const type = meta.type || 'Mod';
        const hasJS = modData.js && modData.js.trim().length > 0;
        const hasCSS = modData.css && modData.css.trim().length > 0;
        const capabilities = meta.capabilities || [];

        // Risk factors
        let riskScore = 0;
        const risks = [];
        const permissions = [];

        // Type-based risk (lower risk for themes, higher for mods)
        const typeRisk = {
          'Theme': 0,
          'Patch': 1,
          'Plugin': 2,
          'Kit': 1,
          'Expansion': 2,
          'Mod': 3
        };
        riskScore += typeRisk[type] || 3;

        // JavaScript presence (major risk factor)
        if (hasJS) {
          riskScore += 3;
          permissions.push('Execute JavaScript code');

          // Check for high-risk capabilities
          if (capabilities.includes('cards')) {
            riskScore += 2;
            permissions.push('Create, modify, or delete your cards');
          }
          if (capabilities.includes('export') || capabilities.includes('import')) {
            riskScore += 2;
            permissions.push('Access data during export/import');
          }
          if (capabilities.includes('storage')) {
            riskScore += 1;
            permissions.push('Store additional data');
          }
          if (capabilities.includes('navigation')) {
            permissions.push('Monitor navigation and search');
          }
          if (capabilities.includes('ui')) {
            permissions.push('Modify the user interface');
          }
        } else if (hasCSS && !hasJS) {
          // CSS-only is very low risk
          permissions.push('Apply custom styles (CSS only)');
        }

        // Determine risk level
        let riskLevel, color, icon;
        if (!hasJS && hasCSS) {
          riskLevel = 'LOW';
          color = '#22c55e';
          icon = '✓';
        } else if (riskScore <= 3) {
          riskLevel = 'LOW';
          color = '#22c55e';
          icon = '✓';
        } else if (riskScore <= 5) {
          riskLevel = 'MEDIUM';
          color = '#f59e0b';
          icon = '⚠';
        } else {
          riskLevel = 'HIGH';
          color = '#ef4444';
          icon = '⚠';
        }

        return {
          riskLevel,
          riskScore,
          color,
          icon,
          type,
          hasJS,
          hasCSS,
          capabilities,
          permissions,
          risks
        };
      }

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
        try {
          const start = performance.now();
          CardSpoke_MODS.runHook(hookName, ...args);
          const duration = performance.now() - start;
          if (duration > 120) {
            console.warn(`Mod hook ${hookName} took ${Math.round(duration)}ms and may block UI.`);
          }
        } catch (err) {
          console.warn('Mod hook failed', hookName, err);
          showToast(`Mod error in ${hookName}: ${err.message || err}`, 'error', 5000);
        }
      }

