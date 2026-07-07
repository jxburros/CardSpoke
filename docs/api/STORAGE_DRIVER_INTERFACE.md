# Storage Driver Interface

CardSpoke abstracts persistence behind a `StorageDriver` contract so datasets can live in LocalStorage, IndexedDB, or optional cloud backends.

> **Status: custom drivers are experimental.** The built-in drivers below are
> constructed directly by `www/src/storage.js` and are what actually persist
> your data. A `StorageDriverRegistry` (`www/src/core/storage-driver-registry.js`)
> is exposed on `window.CardSpoke.StorageDriverRegistry`, but the host app
> does **not yet consume plugin-registered drivers** — registering a driver
> there will not hot-swap the app's storage backend today. Treat the registry
> as a forward-looking extension point, not a supported way to replace
> persistence. See [Registering custom drivers](#registering-custom-drivers-experimental).

## Interface

Drivers extend the abstract `StorageDriver` class and must implement:

- `init(config)`: prepare credentials or connections.
- `get(key)`: fetch a value.
- `set(key, value)`: write a value.
- `remove(key)`: delete a value.
- `list(prefix?)`: enumerate stored keys, optionally filtered by prefix.
- `getSize()`: return approximate size (bytes or characters).
- `getKind()`: string identifier for the driver.

## Built-in drivers

- **IndexedDBDriver (`kind: 'indexeddb'`)**: stores datasets in the `datasets` object store inside `CardSpokeDB` (configurable names). Uses read/write transactions per operation and computes size by summing serialized values.
- **LocalStorageDriver (`kind: 'localstorage'`)**: prefix-based keys (default `cardspoke_`); JSON serializes values and calculates size from stored string lengths.
- **LocalFileDriver (`kind: 'localfile'`)**: stores datasets in a local file using the File System Access API (web) or Capacitor Filesystem plugin (native). For web, prompts user to select/create a JSON file and persists the file handle in IndexedDB for future access. For native platforms (iOS/Android), stores data in the Documents directory. Provides full control over where data is saved.
- **GoogleDriveDriver (`kind: 'googledrive'`)**: OAuth via Google Identity Services; reads/writes a JSON file (default `cardspoke.json`) using Drive v3 APIs. Requires developer-supplied client id; surfaces toast errors on failures.
- **OneDriveDriver (`kind: 'onedrive'`)**: Auth via MSAL; also stores a JSON payload in the user’s drive and uses PUT/PATCH operations to update it.
- **WebDAVDriver (`kind: 'webdav'`)**: Basic-auth to a configured endpoint; reads/writes a JSON file (default `cardspoke.json`) and warns about CORS when misconfigured.

## Dataset manager expectations

- Each dataset tracks `id`, `name`, `storage` driver + config, `pin` (optional), and timestamps.
- Sensitive fields (e.g., WebDAV password) are stripped before metadata is saved to LocalStorage.
- Switching datasets validates PINs and persists the active dataset id; deleting a dataset cascades removal across all keys in that driver.
- `getDatasetInfo()` returns driver kind, size in bytes (formatted), item count, and timestamps to surface in diagnostics UIs.

## Registering custom drivers (experimental)

`window.CardSpoke.StorageDriverRegistry` is a small registry keyed by driver
name. Its methods (see `www/src/core/storage-driver-registry.js`):

- `register(name, driver)` — validates that `driver` implements every required
  method (`init`, `get`, `set`, `remove`, `list`, `getSize`, `getKind`) and
  stores it.
- `unregister(name)` — removes a driver (refuses to remove the active one).
- `get(name)` / `list()` — look up a driver / list `{ name, kind, active }`.
- `setActive(name)` — initialize (once) and mark a driver active.
- `getActive()` — the currently active driver.

**Important caveat:** this registry is not wired into the app's persistence
path. `www/src/storage.js` instantiates the built-in drivers directly and does
not read from `StorageDriverRegistry`, so a driver you `register()` and even
`setActive()` here will not become the store that `load()`/`save()` use. The
registry is present so future work (and advanced app-layer plugins) can build
on it; it does not let a plugin replace the app's storage backend today.

## Usage notes

- Cloud drivers are opt-in and require explicit configuration; the app defaults to IndexedDB/LocalStorage.
- Plugins should use window-level utilities like `window.getDatasetMeta()` instead of directly touching drivers; this keeps storage decisions centralized. Plugins access this through the global window object, not through `ctx.api`.
- For per-plugin persistence today, use `ctx.api.storage` (namespaced,
  localStorage-backed) rather than registering a storage driver.
