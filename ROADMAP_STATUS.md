# Features Still Needing Development from Road Map V1

This document lists all features from the Road Map V1 that are not yet implemented or are still in progress.

---

## Current Status: v0.7.x Complete
CardSpoke is currently at version 0.7.4, with the v0.7 milestone **COMPLETE**. The following versions and their features remain to be developed.

---

## ✅ v0.7 — Foundation Overhaul [COMPLETE]
All v0.7 features have been implemented:
- ✅ Ultra-Light UI redesign
- ✅ Schema v4 upgrade
- ✅ Clean and documented core codebase
- ✅ Developer-facing documentation
- ✅ Unified design tokens
- ✅ Consistent, accessible components
- ✅ Mod type taxonomy
- ✅ File/folder structure refactor

---

## 🔨 v0.8 — Capacitor Migration & Platform Integration [IN PROGRESS/PLANNED]

**Status:** Partially implemented - needs completion

### Remaining Features:
- [ ] **Complete Capacitor project setup** - Some groundwork done, needs finalization
- [ ] **Standalone builds for all platforms:**
  - [ ] Web - Progressive Web App (basic structure exists)
  - [ ] Desktop - Electron support
  - [ ] Android - Native Android app
  - [ ] iOS - Native iOS app
- [ ] **Native file operations:**
  - [ ] File picker integration
  - [ ] Folder chooser for local storage
  - [ ] Native export functionality
- [ ] **Storage migration:**
  - [ ] Migrate from IndexedDB to Capacitor Storage
  - [ ] Implement fallback storage strategy
- [ ] **Platform packaging:**
  - [ ] App manifest for all platforms
  - [ ] Splash screens
  - [ ] App icons for all platforms
  - [ ] Build scripts and automation
- [ ] **Testing:**
  - [ ] Android build testing
  - [ ] Desktop build testing
  - [ ] iOS build testing (when ready)
  - [ ] Cross-platform compatibility testing

**Deliverable:** CIB runs as a native-capable standalone app with deeper local integration.

---

## 🗂️ v0.9 — Dataset Architecture [NOT STARTED]

**Status:** Not yet started

### Features Needed:
- [ ] **Multi-dataset support:**
  - [ ] Create `StorageDriver` interface
  - [ ] Implement IndexedDB storage driver
  - [ ] Implement local file storage driver
  - [ ] Dataset registry system
  - [ ] Dataset switcher UI
- [ ] **Storage drivers:**
  - [ ] Abstract storage layer
  - [ ] Driver initialization and configuration
  - [ ] get/set/list/remove operations per driver
  - [ ] Optional backup functionality per driver
- [ ] **Security features:**
  - [ ] PIN per dataset (optional)
  - [ ] PIN gate implementation
  - [ ] PBKDF2/scrypt encryption
  - [ ] Portable PIN in exports
- [ ] **Dataset management:**
  - [ ] Dataset Info Panel UI
  - [ ] Display storage type and size
  - [ ] Show PIN status
  - [ ] Dataset statistics
  - [ ] Export shortcuts per dataset

**Deliverable:** Local, modular, and secure data architecture.

---

## 🎛️ v0.10 — Extensions Framework [PARTIALLY IMPLEMENTED]

**Status:** Basic mod system exists, advanced features needed

### Implemented:
- ✅ Basic mod loading and execution
- ✅ Mod registry and hooks
- ✅ Enable/disable functionality
- ✅ Mod metadata support

### Features Still Needed:
- [ ] **Extensions Page:**
  - [ ] Dedicated Extensions management page
  - [ ] Enable/disable checkboxes
  - [ ] Mod ordering/priority system
  - [ ] Type badges for mod categories
  - [ ] Safe Mode toggle
  - [ ] Mod health monitoring
- [ ] **Theme Manager:**
  - [ ] Separate Theme Manager under Appearance
  - [ ] Theme preview functionality
  - [ ] Easy theme switching
  - [ ] Theme collections/packs
- [ ] **Tagging system:**
  - [ ] Tag chips UI
  - [ ] Tag filters and search
  - [ ] Tag metadata fields
  - [ ] Tag management page
  - [ ] Tag autocomplete
- [ ] **Global Search:**
  - [ ] Search across all datasets
  - [ ] Tag-based filters
  - [ ] Dataset-specific filters
  - [ ] Advanced search operators
  - [ ] Search history
- [ ] **Internal Link Backbone:**
  - [ ] `[[Card Name]]` link recognition
  - [ ] Link auto-completion
  - [ ] Backlinks tracking
  - [ ] Broken link detection
  - [ ] Link preview on hover
- [ ] **Mod Events:**
  - [ ] Toast notifications for mod events
  - [ ] Mod load logs
  - [ ] Warning and error reporting
  - [ ] Mod diagnostics panel

**Deliverable:** Unified extension management with search, tags, and linking support.

---

## 👨‍💻 v0.11 — Developer Ecosystem [NOT STARTED]

**Status:** Not yet started

### Features Needed:
- [ ] **Extension Wizard:**
  - [ ] Type selection interface (Theme/Patch/Plugin/Mod/Expansion)
  - [ ] Scaffold manifest generation
  - [ ] Skeleton code generation
  - [ ] Template library
  - [ ] Export wizard-created mods
- [ ] **Playground:**
  - [ ] Sandboxed editor environment
  - [ ] Live code editing
  - [ ] Console logs display
  - [ ] Live reload functionality
  - [ ] Error boundary and handling
  - [ ] Testing tools
- [ ] **CIB.utils Helper Library:**
  - [ ] `createCard()` API
  - [ ] `updateCard()` API
  - [ ] `addTag()` API
  - [ ] `getDatasetMeta()` API
  - [ ] `showToast()` API (already exists, needs documentation)
  - [ ] Additional utility functions
- [ ] **Persistent Mod Data Registry:**
  - [ ] `store.modsData['mod@ver']` system
  - [ ] Mod-specific data storage
  - [ ] Data migration utilities
  - [ ] Data cleanup on mod removal
- [ ] **Developer Mode:**
  - [ ] Developer Mode toggle
  - [ ] Verbose logging
  - [ ] Unrestricted testing
  - [ ] Debug panel
  - [ ] Performance monitoring

**Deliverable:** Safe, well-documented developer tools and learning environment.

---

## 🛡️ v0.12 — Safety & Governance [NOT STARTED]

**Status:** Not yet started

### Features Needed:
- [ ] **Mod Safety Layer:**
  - [ ] Capability enforcement system (`ui`, `data`, `network`)
  - [ ] Mod permissions declaration
  - [ ] Permission approval workflow
  - [ ] Sandboxing for unsafe operations
- [ ] **Error Isolation:**
  - [ ] Hook timeouts
  - [ ] Failure logs and recovery
  - [ ] Mod error isolation (prevent cascade failures)
  - [ ] Automatic mod disabling on critical errors
- [ ] **Health Panel:**
  - [ ] Mod diagnostics dashboard
  - [ ] Performance metrics per mod
  - [ ] Error history
  - [ ] Mod compatibility checking
- [ ] **Deviation Metadata:**
  - [ ] Deviation metadata in exports
  - [ ] Base version tracking
  - [ ] Author attribution
  - [ ] Purpose documentation
  - [ ] Lineage visualization
- [ ] **Rewind Snapshots:**
  - [ ] Automatic snapshot creation
  - [ ] Manual snapshot trigger
  - [ ] Snapshot preview
  - [ ] Snapshot restore functionality
  - [ ] Snapshot management (delete old snapshots)
  - [ ] Snapshot metadata (time, cards count, size)

**Deliverable:** Secure, auditable, and reversible datasets and mods.

---

## 🎨 v0.13 — UX Polish & Undo [NOT STARTED]

**Status:** Not yet started

### Features Needed:
- [ ] **Undo/Redo System:**
  - [ ] In-memory undo buffer
  - [ ] Undo stack per session
  - [ ] Redo functionality
  - [ ] Keyboard shortcuts (Ctrl+Z, Ctrl+Y)
  - [ ] Undo history panel
  - [ ] Clear history option
- [ ] **Performance Optimization:**
  - [ ] Virtualized card list for large datasets (10k+ entries)
  - [ ] Lazy loading for card content
  - [ ] Optimized rendering pipeline
  - [ ] Memory management improvements
  - [ ] Reduced re-renders
- [ ] **Command Palette:**
  - [ ] Improvements to existing command system
  - [ ] Additional commands
  - [ ] Command history
  - [ ] Fuzzy search in command palette
- [ ] **Visual Polish:**
  - [ ] Micro-animations for actions
  - [ ] Transition animations
  - [ ] Loading states and skeletons
  - [ ] Improved feedback for user actions
- [ ] **Keyboard Shortcuts:**
  - [ ] Comprehensive shortcut system
  - [ ] Customizable shortcuts
  - [ ] Shortcut cheat sheet
  - [ ] Vim-style navigation (optional)

**Deliverable:** Smooth, responsive, and forgiving user experience.

---

## 📖 v0.14 — Documentation & Open Source Prep [NOT STARTED]

**Status:** Not yet started (some docs exist but incomplete)

### Features Needed:
- [ ] **Internal Documentation:**
  - [ ] In-app Help/Docs section
  - [ ] Interactive tutorials
  - [ ] Getting started guide
  - [ ] Feature documentation
  - [ ] FAQ section
- [ ] **Example Content:**
  - [ ] Example dataset with sample cards
  - [ ] Tutorial mod pack
  - [ ] Starter templates
  - [ ] Use case examples
- [ ] **External Documentation:**
  - [ ] Comprehensive README (complete for v0.7.4, needs updates for future versions)
  - [ ] CONTRIBUTING.md
  - [ ] CODE_OF_CONDUCT.md
  - [ ] API Reference documentation
  - [ ] Schema documentation (to be created in Task 6)
  - [ ] Mod development guide
- [ ] **AI Resources:**
  - [ ] AI prompt files finalized
  - [ ] Code signature files
  - [ ] Training documentation
  - [ ] Development patterns guide
- [ ] **Community Prep:**
  - [ ] Issue templates
  - [ ] Pull request templates
  - [ ] Community guidelines
  - [ ] Roadmap for community input

**Deliverable:** A transparent, teachable, and open community platform.

---

## 🎯 v1.0.0 — Stable Platform [NOT STARTED]

**Status:** Awaiting completion of all previous versions

### Requirements:
- [ ] All v0.8 features complete
- [ ] All v0.9 features complete
- [ ] All v0.10 features complete
- [ ] All v0.11 features complete
- [ ] All v0.12 features complete
- [ ] All v0.13 features complete
- [ ] All v0.14 features complete
- [ ] **Final Testing:**
  - [ ] Cross-platform testing
  - [ ] Performance benchmarking
  - [ ] Security audit
  - [ ] Accessibility audit
  - [ ] User acceptance testing
- [ ] **Final Polish:**
  - [ ] Bug fixes
  - [ ] UI/UX refinements
  - [ ] Documentation review
  - [ ] Release notes
- [ ] **Launch Preparation:**
  - [ ] Marketing materials
  - [ ] Website/landing page
  - [ ] Announcement post
  - [ ] Community launch

**Deliverable:** Complete, portable, and extensible CardSpoke 1.0 release.

---

## 🚀 Post-1.0 Planned Features

These are noted in the Road Map but scheduled for after 1.0:
- [ ] Cloud/off-device sync (HTTP/WebDAV/S3)
- [ ] Worker sandbox for mods
- [ ] AI plugin architecture
- [ ] Collaboration & shared datasets
- [ ] Multi-user support
- [ ] Real-time collaboration

---

## Summary

### Completion Status:
- **v0.7** (Foundation): ✅ 100% Complete
- **v0.8** (Capacitor): 🔨 ~20% Complete
- **v0.9** (Dataset): ⏳ 0% Complete
- **v0.10** (Extensions): 🔨 ~40% Complete (basic mod system only)
- **v0.11** (Developer): ⏳ 0% Complete
- **v0.12** (Safety): ⏳ 0% Complete
- **v0.13** (Polish): ⏳ 0% Complete
- **v0.14** (Docs): 🔨 ~15% Complete (basic docs only)
- **v1.0** (Stable): ⏳ 0% Complete

### Estimated Overall Progress to 1.0: ~23%

---

**Document Version:** 1.0  
**Created:** November 11, 2025  
**Creator:** jxburros with GitHub Copilot  
**Last Updated:** November 11, 2025  
**Based on:** Road Map V1.md
