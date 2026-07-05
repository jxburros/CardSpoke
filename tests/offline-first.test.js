import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { readFileSync } from 'node:fs';

function read(path) {
  return readFileSync(new URL('../' + path, import.meta.url), 'utf8');
}

test('web app declares an installable offline app shell', () => {
  const index = read('www/index.html');
  assert.ok(index.includes('rel="manifest" href="manifest.webmanifest"'));
  assert.ok(index.includes('offline-status.js'));
  assert.ok(index.includes('app-loader.js'));
});

test('service worker caches app shell assets', () => {
  const worker = read('www/service-worker.js');
  assert.ok(worker.includes('CACHE_VERSION'));
  assert.ok(worker.includes('./index.html'));
  assert.ok(worker.includes('./app.js'));
  assert.ok(worker.includes('./styles.css'));
  assert.ok(worker.includes('./offline-status.js'));
  assert.ok(worker.includes('url.origin !== self.location.origin'));
});

test('offline status separates local save from remote sync', () => {
  const status = read('www/offline-status.js');
  assert.ok(status.includes('Saved locally'));
  assert.ok(status.includes('Sync pending'));
  assert.ok(status.includes('Local save failed'));
  assert.ok(status.includes('googledrive'));
  assert.ok(status.includes('onedrive'));
  assert.ok(status.includes('webdav'));
});

test('storage policy requires offline-first behavior', () => {
  const policy = read('docs/policies/STORAGE_AND_PRIVACY.md');
  assert.ok(policy.includes('Offline use is a first-class experience'));
  assert.ok(policy.includes('Local saves are authoritative'));
  assert.ok(policy.includes('Remote sync may fail'));
});

test.run();
