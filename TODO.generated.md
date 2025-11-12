# TODO (Generated)

**Generated:** 2025-11-12  
**Source:** Middle Manager Agent  
**Based on:** Road Map V2, current v0.8.2 codebase

> **Note**: This is a generated file. The canonical TODO is in `TO DO.md`.  
> Review items below and copy relevant tasks to the main TODO as desired.

---

## 🔴 Fixes (Critical/High Priority)

### FIX-1: Add save status indicator (P2, Small)
- [x] Add visual indicator element to HTML
- [x] Implement status update logic in app.js
- [x] Style save status indicator (saved/saving/error)
- [x] Test with rapid edits and errors

**Evidence**: AI_DEVELOPER_GUIDE.md mentions save status pattern  
**Files**: `www/index.html`, `www/app.js`, `www/styles.css`

---

### FIX-2: Verify bookmark/recent menu integration (P2, Small)
- [ ] Test "Bookmarks" menu item functionality
- [x] Test "Recent Cards" menu item functionality  
- [x] Implement empty state handling
- [x] Add transitions/loading states

**Evidence**: Menu elements referenced in app.js:54-55  
**Files**: `www/app.js`

---

### FIX-3: Add error boundary for mod execution (P2, Medium)
- [x] Wrap `runModHook` calls in try-catch
- [x] Log errors with mod ID context
- [x] Add toast notification for mod failures
- [x] Update AI_DEVELOPER_GUIDE with error handling pattern
- [x] Test with intentionally broken mod

**Evidence**: Roadmap v0.12 safety layer; current code lacks isolation  
**Files**: `www/app.js`, `AI_DEVELOPER_GUIDE.md`

---

## 💚 Quality-of-Life (Developer & User Experience)

### QOL-1: Add basic test infrastructure (P2, Medium)
- [ ] Install test framework (tape/uvu/vitest)
- [ ] Create `tests/` directory structure
- [ ] Write tests for `createCard()`
- [ ] Write tests for `deleteCard()`
- [ ] Write tests for `searchCards()`
- [ ] Update `package.json` test script
- [ ] Document testing in README or DEVELOPER docs

**Evidence**: No test infrastructure exists  
**Files**: `package.json`, new `tests/` directory

---

### QOL-2: Document Navigator Suite features in README (P3, Small)
- [x] Add Navigator Suite section to README
- [x] Document bookmarks feature with usage
- [x] Document recent cards feature with usage
- [x] Document card duplication feature
- [x] Document compact view mode
- [x] Add screenshots if available

**Evidence**: v0.8.2 features not fully documented  
**Files**: `README.md`

---

### QOL-3: Add keyboard shortcuts reference (P3, Small)
- [ ] Audit existing keyboard shortcuts in code
- [ ] Create shortcuts reference table
- [ ] Add to README
- [ ] (Optional) Implement in-app help overlay (Ctrl+?)
- [ ] Test on different platforms

**Evidence**: Roadmap v0.13 mentions shortcuts  
**Files**: `README.md`, optionally `www/app.js`

---

### QOL-4: Implement view mode UI toggle (P2, Small)
- [x] Add toggle button/switch in menu
- [x] Connect to existing `store.viewMode` state
- [x] Verify persistence across sessions
- [x] Update styles for compact mode display
- [x] Test visual difference between modes

**Evidence**: `viewMode` exists in store but UI unclear  
**Files**: `www/index.html`, `www/app.js`, `www/styles.css`

---

### QOL-5: Add save conflict resolution (P3, Medium)
- [ ] Detect concurrent edits (localStorage events)
- [ ] Design conflict resolution UI
- [ ] Implement merge/choose strategy
- [ ] Add user prompts for conflicts
- [ ] Document behavior in AI_DEVELOPER_GUIDE
- [ ] Test with multiple tabs/windows

**Evidence**: Roadmap priority features list  
**Files**: `www/app.js`, `AI_DEVELOPER_GUIDE.md`

---

## 🔵 Next-Up (Roadmap Alignment, v0.9 Prep)

### NEXT-1: Prepare for v0.9 Dataset Architecture (P3, Medium)
- [ ] Review Roadmap v0.9 requirements
- [ ] Create design document for multi-dataset support
- [ ] Define data migration strategy (v0.8→v0.9)
- [ ] Identify breaking changes
- [ ] Plan PIN protection implementation
- [ ] Document storage driver interface requirements

**Evidence**: Roadmap V2 v0.9 section  
**Files**: New `docs/v0.9-dataset-architecture.md`

---

### NEXT-2: Create mod capability taxonomy (P3, Small)
- [ ] Define capability types (`ui`, `data`, `network`, etc.)
- [ ] Add to mod metadata schema
- [ ] Document in AI_DEVELOPER_GUIDE
- [ ] Update mod creation examples
- [ ] Plan enforcement strategy for v0.12

**Evidence**: Roadmap v0.12 capability enforcement  
**Files**: `AI_DEVELOPER_GUIDE.md`, `www/app.js`

---

### NEXT-3: Design storage driver interface (P3, Medium)
- [ ] Write TypeScript-style interface definition
- [ ] Document get/set/list/remove/backup methods
- [ ] Create storage driver README
- [ ] Add to AI_DEVELOPER_GUIDE
- [ ] Design adapter pattern for IndexedDB/localStorage
- [ ] Plan Capacitor Filesystem integration

**Evidence**: Roadmap v0.9 `StorageDriver` interface  
**Files**: New `docs/storage-driver-interface.md`, `AI_DEVELOPER_GUIDE.md`

---

## Summary

**Completion Status** (as of v0.9.1):
- ✅ **FIX-1**: Save status indicator - COMPLETED (already fully implemented)
- ✅ **FIX-2**: Bookmark/recent menu integration - COMPLETED (already fully implemented)
- ✅ **FIX-3**: Mod execution error boundary - COMPLETED (added toast notifications)
- ✅ **QOL-2**: Navigator Suite documentation - COMPLETED (comprehensive README section added)
- ✅ **QOL-4**: View mode UI toggle - COMPLETED (already fully implemented)

**Total Tasks**: 11 (5 completed, 6 remaining)
- **Fixes**: 3 tasks (1 Small, 2 Medium)
- **Quality-of-Life**: 5 tasks (3 Small, 2 Medium)
- **Next-Up**: 3 tasks (1 Small, 2 Medium)

**Estimated Effort**: ~40 hours total (~1 week for single developer)

**Priority Distribution**:
- P2 (High): 5 tasks
- P3 (Normal): 6 tasks

---

## Usage Notes

1. **Task Selection**: Start with P2 items for immediate impact
2. **Dependencies**: No blockers between tasks; can work in parallel
3. **Testing**: Consider QOL-1 early to enable test-driven development
4. **Documentation**: QOL-2 and QOL-3 are quick wins for user adoption

---

*This file was auto-generated. Manual edits will be overwritten on next run.*  
*To preserve custom TODO items, maintain them in `TO DO.md` instead.*
