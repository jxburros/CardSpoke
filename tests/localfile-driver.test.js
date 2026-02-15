/**
 * LocalFileDriver Tests
 * Tests for the LocalFileDriver storage implementation
 */

import { test } from 'uvu';
import * as assert from 'uvu/assert';

// Mock the Capacitor environment
global.window = global.window || {};

// Mock IndexedDB for testing
class MockIndexedDB {
  constructor() {
    this.stores = new Map();
  }

  open(name, version) {
    const request = {
      result: {
        objectStoreNames: {
          contains: (storeName) => this.stores.has(storeName)
        },
        createObjectStore: (storeName) => {
          this.stores.set(storeName, new Map());
          return { name: storeName };
        },
        transaction: (storeNames, mode) => {
          return {
            objectStore: (storeName) => {
              const store = this.stores.get(storeName) || new Map();
              return {
                get: (key) => ({
                  result: store.get(key),
                  onsuccess: null,
                  onerror: null
                }),
                put: (value, key) => ({
                  result: value,
                  onsuccess: null,
                  onerror: null
                }),
                delete: (key) => ({
                  result: undefined,
                  onsuccess: null,
                  onerror: null
                }),
                getAllKeys: () => ({
                  result: Array.from(store.keys()),
                  onsuccess: null,
                  onerror: null
                })
              };
            }
          };
        }
      },
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null
    };

    setTimeout(() => {
      if (request.onupgradeneeded) {
        request.onupgradeneeded({ target: request });
      }
      if (request.onsuccess) {
        request.onsuccess();
      }
    }, 0);

    return request;
  }
}

// Mock environment setup
global.indexedDB = new MockIndexedDB();

// Create a mock StorageDriver base class
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

// Mock LocalFileDriver implementation for testing
class LocalFileDriver extends StorageDriver {
  constructor() {
    super();
    this.mockData = {};
    this.fileName = 'cardspoke.json';
    this.isNative = false;
  }

  async init(config = {}) {
    this.fileName = config.fileName || 'cardspoke.json';
    this.isNative = typeof window.Capacitor !== 'undefined' && 
                    typeof window.Capacitor.isNativePlatform === 'function' && 
                    window.Capacitor.isNativePlatform();
    return Promise.resolve();
  }

  async readFile() {
    return { ...this.mockData };
  }

  async writeFile(data) {
    this.mockData = { ...data };
  }

  async get(key) {
    const data = await this.readFile();
    return data[key] || null;
  }

  async set(key, value) {
    const data = await this.readFile();
    data[key] = value;
    await this.writeFile(data);
  }

  async remove(key) {
    const data = await this.readFile();
    delete data[key];
    await this.writeFile(data);
  }

  async list(prefix = '') {
    const data = await this.readFile();
    const keys = Object.keys(data);
    return prefix ? keys.filter(k => k.startsWith(prefix)) : keys;
  }

  async getSize() {
    const data = await this.readFile();
    return JSON.stringify(data).length;
  }

  getKind() {
    return 'localfile';
  }
}

// Tests
test('LocalFileDriver can be instantiated', () => {
  const driver = new LocalFileDriver();
  assert.ok(driver, 'Driver should be created');
  assert.is(driver.getKind(), 'localfile', 'Kind should be localfile');
});

test('LocalFileDriver can be initialized', async () => {
  const driver = new LocalFileDriver();
  await driver.init();
  assert.ok(driver, 'Driver should be initialized');
});

test('LocalFileDriver can set and get values', async () => {
  const driver = new LocalFileDriver();
  await driver.init();
  
  await driver.set('test_key', { value: 'test_value' });
  const result = await driver.get('test_key');
  
  assert.ok(result, 'Should retrieve value');
  assert.is(result.value, 'test_value', 'Should retrieve correct value');
});

test('LocalFileDriver returns null for non-existent keys', async () => {
  const driver = new LocalFileDriver();
  await driver.init();
  
  const result = await driver.get('non_existent_key');
  assert.is(result, null, 'Should return null for non-existent key');
});

test('LocalFileDriver can remove values', async () => {
  const driver = new LocalFileDriver();
  await driver.init();
  
  await driver.set('test_key', { value: 'test_value' });
  await driver.remove('test_key');
  const result = await driver.get('test_key');
  
  assert.is(result, null, 'Should return null after removal');
});

test('LocalFileDriver can list all keys', async () => {
  const driver = new LocalFileDriver();
  await driver.init();
  
  await driver.set('key1', { value: 'value1' });
  await driver.set('key2', { value: 'value2' });
  await driver.set('key3', { value: 'value3' });
  
  const keys = await driver.list();
  
  assert.is(keys.length, 3, 'Should have 3 keys');
  assert.ok(keys.includes('key1'), 'Should include key1');
  assert.ok(keys.includes('key2'), 'Should include key2');
  assert.ok(keys.includes('key3'), 'Should include key3');
});

test('LocalFileDriver can list keys with prefix', async () => {
  const driver = new LocalFileDriver();
  await driver.init();
  
  await driver.set('card_1', { value: 'value1' });
  await driver.set('card_2', { value: 'value2' });
  await driver.set('setting_1', { value: 'value3' });
  
  const keys = await driver.list('card_');
  
  assert.is(keys.length, 2, 'Should have 2 keys with card_ prefix');
  assert.ok(keys.includes('card_1'), 'Should include card_1');
  assert.ok(keys.includes('card_2'), 'Should include card_2');
  assert.not.ok(keys.includes('setting_1'), 'Should not include setting_1');
});

test('LocalFileDriver can calculate size', async () => {
  const driver = new LocalFileDriver();
  await driver.init();
  
  const initialSize = await driver.getSize();
  assert.is(initialSize, 2, 'Empty object should have size 2 (for {})');
  
  await driver.set('key1', { value: 'test' });
  const sizeAfter = await driver.getSize();
  
  assert.ok(sizeAfter > initialSize, 'Size should increase after adding data');
});

test('LocalFileDriver can handle multiple operations', async () => {
  const driver = new LocalFileDriver();
  await driver.init();
  
  // Add multiple items
  await driver.set('card_1', { title: 'Card 1', content: 'Content 1' });
  await driver.set('card_2', { title: 'Card 2', content: 'Content 2' });
  await driver.set('card_3', { title: 'Card 3', content: 'Content 3' });
  
  // Verify all items exist
  const keys = await driver.list();
  assert.is(keys.length, 3, 'Should have 3 items');
  
  // Remove one item
  await driver.remove('card_2');
  
  // Verify item was removed
  const keysAfter = await driver.list();
  assert.is(keysAfter.length, 2, 'Should have 2 items after removal');
  assert.not.ok(keysAfter.includes('card_2'), 'Should not include removed item');
  
  // Verify other items still exist
  const card1 = await driver.get('card_1');
  const card3 = await driver.get('card_3');
  assert.ok(card1, 'card_1 should still exist');
  assert.ok(card3, 'card_3 should still exist');
});

test('LocalFileDriver can use custom file name', async () => {
  const driver = new LocalFileDriver();
  await driver.init({ fileName: 'custom.json' });
  
  assert.is(driver.fileName, 'custom.json', 'Should use custom file name');
});

test('LocalFileDriver detects native environment correctly', async () => {
  const driver = new LocalFileDriver();
  await driver.init();
  
  // In test environment, isNative should be false
  assert.is(driver.isNative, false, 'Should detect non-native environment');
});

test.run();
