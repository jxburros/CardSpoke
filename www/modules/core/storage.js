/**
 * CardSpoke Storage Module
 * Version: 0.15.0
 * 
 * Storage drivers and data persistence
 */

import { state, getStore, setStore, createDefaultStore } from './state.js';
import { showToast } from '../ui/toast.js';

// Cloud Storage Configuration
// Replace these with your own OAuth client IDs
const GOOGLE_CLIENT_ID = '905559232060-5utnmrdvr3n7k2rvamkt7rcflhj2afs8.apps.googleusercontent.com';
const MS_CLIENT_ID = '222a2760-c041-43ee-b83b-57957fd632bf';

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
 * Google Drive Storage Driver
 * Uses Google Identity Services for authentication
 */
export class GoogleDriveDriver extends StorageDriver {
  constructor() {
    super();
    this.accessToken = null;
    this.tokenClient = null;
    this.fileName = 'cardspoke.json';
    this.fileId = null;
  }

  async init(config = {}) {
    this.fileName = config.fileName || 'cardspoke.json';

    // Check if Google Identity Services is available
    if (typeof google === 'undefined' || !google.accounts) {
      throw new Error('Google Identity Services not loaded. Please refresh the page.');
    }

    if (GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com') {
      throw new Error('Google Drive not configured. Developer needs to set up OAuth client ID.');
    }

    // Initialize the token client
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
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to search for file: ' + response.statusText);
    }

    const data = await response.json();
    return data.files && data.files.length > 0 ? data.files[0].id : null;
  }

  async get(key) {
    try {
      const fileId = await this.findFile();
      if (!fileId) {
        return null;
      }

      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to download file: ' + response.statusText);
      }

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
        // Read existing data
        const response = await fetch(
          `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
          {
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
            },
          }
        );

        if (response.ok) {
          allData = await response.json();
        }
      }

      // Update data
      allData[key] = value;
      const content = JSON.stringify(allData, null, 2);

      if (fileId) {
        // Update existing file
        const response = await fetch(
          `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json',
            },
            body: content,
          }
        );

        if (!response.ok) {
          throw new Error('Failed to update file: ' + response.statusText);
        }
      } else {
        // Create new file
        const metadata = {
          name: this.fileName,
          mimeType: 'application/json',
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', new Blob([content], { type: 'application/json' }));

        const response = await fetch(
          'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
            },
            body: form,
          }
        );

        if (!response.ok) {
          throw new Error('Failed to create file: ' + response.statusText);
        }
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
      if (!fileId) {
        return;
      }

      // Read existing data
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      if (response.ok) {
        const allData = await response.json();
        delete allData[key];

        // Update file with key removed
        const content = JSON.stringify(allData, null, 2);
        await fetch(
          `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json',
            },
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
      if (!fileId) {
        return [];
      }

      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        return [];
      }

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
      if (!fileId) {
        return 0;
      }

      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        return 0;
      }

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
export class OneDriveDriver extends StorageDriver {
  constructor() {
    super();
    this.msalInstance = null;
    this.accessToken = null;
    this.fileName = 'cardspoke.json';
  }

  async init(config = {}) {
    this.fileName = config.fileName || 'cardspoke.json';

    // Check if MSAL is available
    if (typeof msal === 'undefined') {
      throw new Error('MSAL library not loaded. Please refresh the page.');
    }

    if (MS_CLIENT_ID === 'YOUR_MICROSOFT_CLIENT_ID') {
      throw new Error('OneDrive not configured. Developer needs to set up OAuth client ID.');
    }

    // Initialize MSAL
    const msalConfig = {
      auth: {
        clientId: MS_CLIENT_ID,
        authority: 'https://login.microsoftonline.com/common',
        redirectUri: window.location.origin,
      },
      cache: {
        cacheLocation: 'sessionStorage',
        storeAuthStateInCookie: false,
      },
    };

    this.msalInstance = new msal.PublicClientApplication(msalConfig);
    await this.msalInstance.initialize();

    return Promise.resolve();
  }

  async ensureAuthenticated() {
    if (this.accessToken) {
      return;
    }

    const accounts = this.msalInstance.getAllAccounts();
    const request = {
      scopes: ['Files.ReadWrite', 'User.Read'],
      account: accounts[0],
    };

    try {
      // Try silent token acquisition first
      const response = await this.msalInstance.acquireTokenSilent(request);
      this.accessToken = response.accessToken;
    } catch (error) {
      // Fall back to interactive login
      const response = await this.msalInstance.loginPopup(request);
      this.accessToken = response.accessToken;
    }
  }

  async findFile() {
    await this.ensureAuthenticated();

    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/root/search(q='${this.fileName}')`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to search for file: ' + response.statusText);
    }

    const data = await response.json();
    return data.value && data.value.length > 0 ? data.value[0].id : null;
  }

  async get(key) {
    try {
      const fileId = await this.findFile();
      if (!fileId) {
        return null;
      }

      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to download file: ' + response.statusText);
      }

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
        // Read existing data
        const response = await fetch(
          `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`,
          {
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
            },
          }
        );

        if (response.ok) {
          allData = await response.json();
        }
      }

      // Update data
      allData[key] = value;
      const content = JSON.stringify(allData, null, 2);

      // Upload/update file
      const uploadUrl = fileId
        ? `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`
        : `https://graph.microsoft.com/v1.0/me/drive/root:/${this.fileName}:/content`;

      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: content,
      });

      if (!response.ok) {
        throw new Error('Failed to save file: ' + response.statusText);
      }
    } catch (error) {
      console.error('OneDrive set error:', error);
      showToast('Failed to save to OneDrive: ' + error.message, 'error');
      throw error;
    }
  }

  async remove(key) {
    try {
      const fileId = await this.findFile();
      if (!fileId) {
        return;
      }

      // Read existing data
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      if (response.ok) {
        const allData = await response.json();
        delete allData[key];

        // Update file with key removed
        const content = JSON.stringify(allData, null, 2);
        await fetch(
          `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json',
            },
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
      if (!fileId) {
        return [];
      }

      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        return [];
      }

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
      if (!fileId) {
        return 0;
      }

      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        return 0;
      }

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
export class WebDAVDriver extends StorageDriver {
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
        headers: {
          Authorization: this.getAuthHeader(),
        },
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error('Failed to read file: ' + response.statusText);
      }

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

      // Try to read existing data
      try {
        const response = await fetch(this.url + this.fileName, {
          method: 'GET',
          headers: {
            Authorization: this.getAuthHeader(),
          },
        });

        if (response.ok) {
          allData = await response.json();
        }
      } catch (error) {
        // File doesn't exist yet, that's okay
      }

      // Update data
      allData[key] = value;
      const content = JSON.stringify(allData, null, 2);

      // Write file
      const response = await fetch(this.url + this.fileName, {
        method: 'PUT',
        headers: {
          Authorization: this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: content,
      });

      if (!response.ok) {
        throw new Error('Failed to write file: ' + response.statusText);
      }
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
        headers: {
          Authorization: this.getAuthHeader(),
        },
      });

      if (response.ok) {
        const allData = await response.json();
        delete allData[key];

        // Update file with key removed
        const content = JSON.stringify(allData, null, 2);
        await fetch(this.url + this.fileName, {
          method: 'PUT',
          headers: {
            Authorization: this.getAuthHeader(),
            'Content-Type': 'application/json',
          },
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
        headers: {
          Authorization: this.getAuthHeader(),
        },
      });

      if (!response.ok) {
        return [];
      }

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
        headers: {
          Authorization: this.getAuthHeader(),
        },
      });

      if (!response.ok) {
        return 0;
      }

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
          config: meta.storage.config,
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

  async createDataset(name, storageKind = 'localstorage', pin = null, config = {}) {
    const id = 'dataset_' + Date.now();

    // Build config based on storage kind
    let driverConfig = {};
    if (storageKind === 'indexeddb') {
      driverConfig = {
        dbName: `CardSpokeDB_${id}`,
        ...config
      };
    } else if (storageKind === 'localstorage') {
      driverConfig = {
        prefix: `cardspoke_${id}_`,
        ...config
      };
    } else if (storageKind === 'webdav') {
      // WebDAV requires url, username, password
      driverConfig = {
        fileName: `cardspoke_${id}.json`,
        ...config
      };
    } else {
      // Google Drive, OneDrive
      driverConfig = {
        fileName: `cardspoke_${id}.json`,
        ...config
      };
    }

    const driver = await this.createDriver(storageKind, driverConfig);

    const dataset = {
      id,
      name,
      driver,
      pin,
      config: driverConfig,
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
      // Don't save sensitive WebDAV credentials in metadata
      // They should be re-entered each session for security
      let configToSave = { ...dataset.config };
      if (dataset.driver.getKind() === 'webdav') {
        delete configToSave.password;
      }

      metadata.datasets[id] = {
        name: dataset.name,
        storage: {
          driver: dataset.driver.getKind(),
          config: configToSave
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
