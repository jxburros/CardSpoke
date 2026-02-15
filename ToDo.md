### Phase 1: Driver Implementation
* [x] **Create `LocalFileDriver` class**: Extend the abstract `StorageDriver` class to handle direct file system interactions.
* [x] **Implement `init(config)`**: Logic to retrieve or restore a persistent file handle from a secure location like IndexedDB.
* [x] **Implement `ensureHandle()`**: Private method to trigger the `window.showSaveFilePicker` if no handle is currently active.
* [x] **Implement Core CRUD**:
    * `get(key)`: Read and parse the JSON file to retrieve a specific card or setting.
    * `set(key, value)`: Update the JSON payload and perform a write operation to the local file.
    * `remove(key)`: Delete a specific entry from the JSON structure and save.
* [x] **Implement `getSize()` and `getKind()`**: Return the file byte count and the string identifier `localfile`.

### Phase 2: Dataset Manager Integration
* [x] **Update `createDriver`**: Modify the `DatasetManager` to recognize `localfile` as a valid storage kind in its switch/case logic.
* [x] **Enhance `saveMetadata`**: Ensure the dataset metadata in `LocalStorage` stores the file handle reference (key) but not the sensitive file contents.
* [x] **Implement Migration Logic**: Create a function to copy data from an existing `LocalStorage` or `IndexedDB` driver into a new `LocalFileDriver`.
* [x] **Add Integrity Checks**: Implement a post-migration verification step to ensure data parity before switching the active driver.

### Phase 3: Platform Adaptation
* [x] **Web Implementation**: Utilize the **File System Access API** (`showSaveFilePicker` and `createWritable`) for modern browser support.
* [x] **Native Implementation (Capacitor)**: Use the `@capacitor/filesystem` plugin to target the `Directory.Documents` folder for iOS and Android users.
* [x] **Environment Detection**: Add logic to the `LocalFileDriver` to automatically select the correct API (Web vs. Native) based on the runtime environment.

### Phase 4: User Interface (UI) Updates
* [x] **Dataset Creation Screen**: Add a "Local File" option to the storage location dropdown during new dataset setup.
* [x] **Dataset Settings Page**: Create a "Storage Location" section where users can see the current file path and initiate a migration.
* [x] **Consent Prompts**: Add clear UX indicators for permission requests when the app needs to access or write to the local file system.
* [x] **Save Status Feedback**: Ensure the `updateSaveStatus` indicator reflects successful writes to the local file, providing visual confirmation like "✓ Saved to File".
