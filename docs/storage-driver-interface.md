# Storage Driver Interface Specification

**Version:** 0.15.0  
**Author:** Showrunner Agent / jxburros  
**Date:** 2025-11-30  
**Status:** Implemented Specification  

---

## Overview

The **Storage Driver Interface** provides an abstraction layer for persisting CardSpoke data across different storage backends. This enables support for browser storage, filesystem, and future cloud storage while maintaining a consistent API.

### Goals
1. Abstract storage implementation details
2. Support multiple storage backends
3. Enable async operations for all drivers
4. Facilitate testing with mock drivers
5. Support future storage innovations

---

## Interface Definition

### TypeScript Interface

```typescript
interface StorageDriver {
  // Driver identification
  readonly kind: 'indexeddb' | 'localStorage' | 'capacitor-preferences' | 'filesystem' | 'custom';
  readonly name: string;
  readonly description?: string;
  
  // Lifecycle
  init(config: StorageConfig): Promise<void>;
  close?(): Promise<void>;
  
  // Basic CRUD Operations
  get(key: string): Promise<any | null>;
  set(key: string, value: any): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  
  // Batch Operations (Optional)
  getMulti?(keys: string[]): Promise<Record<string, any>>;
  setMulti?(entries: Record<string, any>): Promise<void>;
  removeMulti?(keys: string[]): Promise<void>;
  
  // Query Operations
  list(prefix?: string): Promise<string[]>;
  keys(): Promise<string[]>;
  has(key: string): Promise<boolean>;
  
  // Metadata
  size?(): Promise<number>;
  quota?(): Promise<StorageQuota>;
  
  // Backup & Export
  backup?(): Promise<Blob>;
  restore?(blob: Blob): Promise<void>;
  
  // Events (Optional)
  on?(event: string, handler: Function): void;
  off?(event: string, handler: Function): void;
}

interface StorageConfig {
  // Common options
  namespace?: string;           // Key prefix for isolation
  encryption?: boolean;         // Enable encryption
  compression?: boolean;        // Enable compression
  
  // Driver-specific options
  [key: string]: any;
}

interface StorageQuota {
  used: number;                 // Bytes used
  available: number;            // Bytes available
  total: number;                // Total capacity
}
```

---

## Driver Implementations

### 1. IndexedDB Driver

**Best for:** Web apps, large datasets (>10MB)

```javascript
class IndexedDBDriver {
  constructor() {
    this.kind = 'indexeddb';
    this.name = 'IndexedDB Driver';
    this.db = null;
  }
  
  async init(config) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(config.dbName || 'cardspoke', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('store')) {
          db.createObjectStore('store');
        }
      };
    });
  }
  
  async get(key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['store'], 'readonly');
      const store = transaction.objectStore('store');
      const request = store.get(key);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }
  
  async set(key, value) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['store'], 'readwrite');
      const store = transaction.objectStore('store');
      const request = store.put(value, key);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
  
  async remove(key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['store'], 'readwrite');
      const store = transaction.objectStore('store');
      const request = store.delete(key);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
  
  async clear() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['store'], 'readwrite');
      const store = transaction.objectStore('store');
      const request = store.clear();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
  
  async keys() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['store'], 'readonly');
      const store = transaction.objectStore('store');
      const request = store.getAllKeys();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }
  
  async list(prefix) {
    const allKeys = await this.keys();
    if (!prefix) return allKeys;
    return allKeys.filter(key => key.startsWith(prefix));
  }
  
  async has(key) {
    const value = await this.get(key);
    return value !== null;
  }
}
```

**Features:**
- ✅ Large capacity (50MB-1GB+)
- ✅ Async operations
- ✅ Indexed queries (future)
- ✅ Transaction support
- ❌ More complex than localStorage

---

### 2. localStorage Driver

**Best for:** Fallback, simple apps, small datasets (<5MB)

```javascript
class LocalStorageDriver {
  constructor() {
    this.kind = 'localStorage';
    this.name = 'localStorage Driver';
    this.namespace = '';
  }
  
  async init(config) {
    this.namespace = config.namespace || 'cardspoke_';
  }
  
  async get(key) {
    const fullKey = this.namespace + key;
    const value = localStorage.getItem(fullKey);
    return value ? JSON.parse(value) : null;
  }
  
  async set(key, value) {
    const fullKey = this.namespace + key;
    localStorage.setItem(fullKey, JSON.stringify(value));
  }
  
  async remove(key) {
    const fullKey = this.namespace + key;
    localStorage.removeItem(fullKey);
  }
  
  async clear() {
    const keys = await this.keys();
    keys.forEach(key => localStorage.removeItem(key));
  }
  
  async keys() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(this.namespace)) {
        keys.push(key);
      }
    }
    return keys;
  }
  
  async list(prefix) {
    const allKeys = await this.keys();
    if (!prefix) return allKeys.map(k => k.replace(this.namespace, ''));
    const fullPrefix = this.namespace + prefix;
    return allKeys
      .filter(k => k.startsWith(fullPrefix))
      .map(k => k.replace(this.namespace, ''));
  }
  
  async has(key) {
    const fullKey = this.namespace + key;
    return localStorage.getItem(fullKey) !== null;
  }
  
  async size() {
    const keys = await this.keys();
    let total = 0;
    keys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) total += value.length * 2; // Rough estimate (UTF-16)
    });
    return total;
  }
}
```

**Features:**
- ✅ Simple API
- ✅ Universal support
- ✅ Synchronous (wrapped in async)
- ❌ Limited capacity (~5-10MB)
- ❌ Slower for large data

---

### 3. Capacitor Preferences Driver

**Best for:** Native apps (iOS/Android)

```javascript
import { Preferences } from '@capacitor/preferences';

class CapacitorPreferencesDriver {
  constructor() {
    this.kind = 'capacitor-preferences';
    this.name = 'Capacitor Preferences Driver';
    this.namespace = '';
  }
  
  async init(config) {
    this.namespace = config.namespace || 'cardspoke_';
  }
  
  async get(key) {
    const fullKey = this.namespace + key;
    const { value } = await Preferences.get({ key: fullKey });
    return value ? JSON.parse(value) : null;
  }
  
  async set(key, value) {
    const fullKey = this.namespace + key;
    await Preferences.set({
      key: fullKey,
      value: JSON.stringify(value)
    });
  }
  
  async remove(key) {
    const fullKey = this.namespace + key;
    await Preferences.remove({ key: fullKey });
  }
  
  async clear() {
    const { keys } = await Preferences.keys();
    for (const key of keys) {
      if (key.startsWith(this.namespace)) {
        await Preferences.remove({ key });
      }
    }
  }
  
  async keys() {
    const { keys } = await Preferences.keys();
    return keys.filter(k => k.startsWith(this.namespace));
  }
  
  async list(prefix) {
    const allKeys = await this.keys();
    if (!prefix) return allKeys.map(k => k.replace(this.namespace, ''));
    const fullPrefix = this.namespace + prefix;
    return allKeys
      .filter(k => k.startsWith(fullPrefix))
      .map(k => k.replace(this.namespace, ''));
  }
  
  async has(key) {
    const value = await this.get(key);
    return value !== null;
  }
}
```

**Features:**
- ✅ Native device storage
- ✅ Good capacity (device dependent)
- ✅ Async operations
- ✅ Cross-platform (iOS/Android)
- ❌ Requires Capacitor
- ❌ No web browser support

---

### 4. Filesystem Driver (Future - v0.9.1+)

**Best for:** Large datasets, user-specified locations, backups

```javascript
import { Filesystem, Directory } from '@capacitor/filesystem';

class FilesystemDriver {
  constructor() {
    this.kind = 'filesystem';
    this.name = 'Filesystem Driver';
    this.directory = null;
    this.path = '';
  }
  
  async init(config) {
    this.directory = config.directory || Directory.Data;
    this.path = config.path || 'cardspoke/';
    
    // Create directory if it doesn't exist
    try {
      await Filesystem.mkdir({
        path: this.path,
        directory: this.directory,
        recursive: true
      });
    } catch (e) {
      // Directory exists
    }
  }
  
  async get(key) {
    try {
      const result = await Filesystem.readFile({
        path: this.path + key + '.json',
        directory: this.directory,
        encoding: 'utf8'
      });
      return JSON.parse(result.data);
    } catch (e) {
      return null; // File doesn't exist
    }
  }
  
  async set(key, value) {
    await Filesystem.writeFile({
      path: this.path + key + '.json',
      data: JSON.stringify(value, null, 2),
      directory: this.directory,
      encoding: 'utf8',
      recursive: true
    });
  }
  
  async remove(key) {
    try {
      await Filesystem.deleteFile({
        path: this.path + key + '.json',
        directory: this.directory
      });
    } catch (e) {
      // File doesn't exist
    }
  }
  
  async clear() {
    const files = await this.keys();
    for (const file of files) {
      await this.remove(file.replace('.json', ''));
    }
  }
  
  async keys() {
    const result = await Filesystem.readdir({
      path: this.path,
      directory: this.directory
    });
    return result.files
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''));
  }
  
  async list(prefix) {
    const allKeys = await this.keys();
    if (!prefix) return allKeys;
    return allKeys.filter(k => k.startsWith(prefix));
  }
  
  async has(key) {
    try {
      await Filesystem.stat({
        path: this.path + key + '.json',
        directory: this.directory
      });
      return true;
    } catch (e) {
      return false;
    }
  }
  
  async size() {
    const files = await this.keys();
    let total = 0;
    for (const file of files) {
      const stat = await Filesystem.stat({
        path: this.path + file + '.json',
        directory: this.directory
      });
      total += stat.size;
    }
    return total;
  }
}
```

**Features:**
- ✅ Unlimited capacity (device storage)
- ✅ User-controlled location
- ✅ Easy backup (copy files)
- ✅ Human-readable (JSON files)
- ❌ Slower than IndexedDB
- ❌ Requires Capacitor
- ❌ More complex permissions

---

## Driver Selection Strategy

### Auto-Selection Logic

```javascript
function selectDriver(preferredDriver, fallback = true) {
  // Check availability
  const available = {
    indexeddb: typeof indexedDB !== 'undefined',
    localStorage: typeof localStorage !== 'undefined',
    capacitor: typeof Capacitor !== 'undefined'
  };
  
  // Try preferred first
  if (preferredDriver === 'indexeddb' && available.indexeddb) {
    return new IndexedDBDriver();
  }
  
  if (preferredDriver === 'localStorage' && available.localStorage) {
    return new LocalStorageDriver();
  }
  
  if (preferredDriver === 'capacitor-preferences' && available.capacitor) {
    return new CapacitorPreferencesDriver();
  }
  
  // Fallback logic
  if (!fallback) {
    throw new Error('Preferred driver not available');
  }
  
  // Default priority: IndexedDB > Capacitor > localStorage
  if (available.indexeddb) return new IndexedDBDriver();
  if (available.capacitor) return new CapacitorPreferencesDriver();
  if (available.localStorage) return new LocalStorageDriver();
  
  throw new Error('No storage driver available');
}
```

---

## Testing

### Mock Driver for Tests

```javascript
class MockStorageDriver {
  constructor() {
    this.kind = 'mock';
    this.name = 'Mock Driver';
    this.data = new Map();
  }
  
  async init(config) {}
  
  async get(key) {
    return this.data.has(key) ? this.data.get(key) : null;
  }
  
  async set(key, value) {
    this.data.set(key, value);
  }
  
  async remove(key) {
    this.data.delete(key);
  }
  
  async clear() {
    this.data.clear();
  }
  
  async keys() {
    return Array.from(this.data.keys());
  }
  
  async list(prefix) {
    const allKeys = await this.keys();
    if (!prefix) return allKeys;
    return allKeys.filter(k => k.startsWith(prefix));
  }
  
  async has(key) {
    return this.data.has(key);
  }
  
  async size() {
    return JSON.stringify(Array.from(this.data.entries())).length;
  }
}
```

---

## Error Handling

### Standard Error Codes

```javascript
class StorageError extends Error {
  constructor(code, message, cause) {
    super(message);
    this.name = 'StorageError';
    this.code = code;
    this.cause = cause;
  }
}

// Error codes
const ErrorCodes = {
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  KEY_NOT_FOUND: 'KEY_NOT_FOUND',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  DRIVER_NOT_AVAILABLE: 'DRIVER_NOT_AVAILABLE',
  INVALID_DATA: 'INVALID_DATA',
  OPERATION_FAILED: 'OPERATION_FAILED'
};
```

---

## Performance Considerations

### Benchmarks (Approximate)

| Driver | Init | Get | Set | List | Clear |
|--------|------|-----|-----|------|-------|
| IndexedDB | 50ms | 5ms | 10ms | 20ms | 50ms |
| localStorage | 1ms | 1ms | 2ms | 5ms | 10ms |
| Capacitor | 10ms | 3ms | 5ms | 15ms | 30ms |
| Filesystem | 20ms | 10ms | 30ms | 50ms | 100ms |

### Optimization Tips

1. **Batch Operations:** Use `setMulti()` for multiple writes
2. **Caching:** Cache frequently accessed data
3. **Lazy Loading:** Only load data when needed
4. **Compression:** Enable for large datasets
5. **Indexing:** Use proper keys for fast lookups

---

## Migration Between Drivers

```javascript
async function migrateDriver(fromDriver, toDriver) {
  // Initialize both drivers
  await fromDriver.init({});
  await toDriver.init({});
  
  // Get all keys
  const keys = await fromDriver.keys();
  
  // Migrate data
  for (const key of keys) {
    const value = await fromDriver.get(key);
    await toDriver.set(key, value);
  }
  
  // Verify migration
  const verifyKeys = await toDriver.keys();
  if (verifyKeys.length !== keys.length) {
    throw new Error('Migration incomplete');
  }
}
```

---

## Future Enhancements

### v0.10+
- Compression support
- Encryption support
- Batch operations
- Transaction support

### v0.11+
- Cloud drivers (S3, Google Drive, Dropbox)
- Sync drivers (multi-device)
- Cache layers (memory + disk)

### v1.0+
- Driver plugins (custom storage)
- Real-time sync
- Conflict resolution

---

## References

- v0.9 Dataset Architecture document
- IndexedDB API documentation
- Capacitor Storage APIs
- Web Storage API specification

---

**Document Status:** Implemented in v0.15.0  
**Next Steps:** Feature complete  
**Review Required:** Lead developer, Performance team
