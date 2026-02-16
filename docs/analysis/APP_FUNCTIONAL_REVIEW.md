# CardSpoke App Analysis: Functions, User Flow, and Recommendations

## Scope and method
This review analyzes CardSpoke by reading core docs (`README.md`, `docs/guides/FEATURES.md`) and runtime slices in `www/src/` that define storage, navigation, rendering, and advanced systems.

## Product and architecture summary
CardSpoke is a local-first, card-based knowledge app with a minimal core and built-in plugin runtime. The architecture combines:
- **Single-bundle runtime** (`www/app.js`) built from numbered slices in `www/src`.
- **Stateful client store** (`store`) persisted by dataset key.
- **Hierarchical card graph model** (`cards`, `rootOrder`, `parentId`, `children`).
- **Hook-driven plugin engine** (`onCardSave`, `onNavigate`, `onRender`, etc.).
- **Route-based UI composition** (`list`, `read`, `edit`, `search`) orchestrated by `render()`.

This yields flexibility and extensibility, with most responsibilities currently concentrated in one shared runtime surface.

## Functional system analysis

### 1) Core data and CRUD systems
Key functions:
- `createCard(title, body, parentId, skipSave, skipHooks)`
- `updateCard(id, updates, skipSave, skipHooks)`
- `deleteCard(id)`
- `duplicateCard(id, withChildren)`
- `duplicateCardAsChild(id, newParentId, withChildren)`
- `toggleBookmark(cardId)` and `addToRecentCards(cardId)`

Findings:
- CRUD is straightforward and includes undo tracking for create/update/delete.
- Deletion is recursive and writes to trash + undo for recoverability.
- Deep duplication supports template-style workflows.
- Tags and view mode are integrated into user state with low friction.

Risks/opportunities:
- Recursive delete currently saves repeatedly and can become expensive on large trees.
- Duplicate logic split across multiple helpers can drift without centralized invariants.

### 2) Persistence and navigation
Key functions:
- `load()` with root-order migration logic.
- `save()` / `saveNow()` (debounced + immediate writes).
- `goTo(page, opts)` and `goBack()` with `navHistory`.

Findings:
- Migration safeguards repair common root-level integrity issues.
- Navigation flow is predictable and hook-aware.
- Recent-card tracking improves return-path UX.

Risks/opportunities:
- Large datasets may hit LocalStorage quota/perf limits.
- Navigation history is session-memory only; optional restore could improve resilience.

### 3) Rendering and interaction model
Key functions:
- `render()` + page renderers (`renderCardList`, `renderReadOnlyCard`, `renderEditCard`, `renderSearchResults`).
- `renderCardTile` with lazy body previews.
- `renderCardBody` (`[[Card Name]]` links + create-on-missing).
- `renderRichTextBody` (light markdown-style rendering).

Findings:
- Batched list rendering and `IntersectionObserver` support better scalability.
- Interaction affordances are strong: bookmark, duplicate, child create, import/share.
- Wiki-link behavior effectively supports graph-style note taking.

Risks/opportunities:
- Route-level scroll listeners can accumulate without cleanup.
- Rich text escaping is handled correctly now; parser expansion should keep explicit safety tests.

### 4) Search, tags, and recovery
Key systems:
- Fuzzy/advanced/multi-dataset search with keyboard navigation.
- Undo/redo stacks and Trash Bin recovery.
- Tag management and suggestions.

Findings:
- Search UX is robust and keyboard-friendly.
- Recovery model is stronger than many local-first apps (undo + trash layers).
- Accessibility mechanics are embedded across core flows.

Risks/opportunities:
- Multi-card operations need transaction-aware undo boundaries.

### 5) Plugin ecosystem
Key systems:
- Plugin package validation, layer model, risk assessment, hook dispatch.
- Plugin manager for install/create/manage.

Findings:
- Layer model is clear and useful for risk communication.
- Hook surface is broad enough for an active ecosystem.

Risks/opportunities:
- Trust model is user-driven; stronger permission disclosures would reduce accidental risk.

## User flow analysis

### Primary flow (new user)
1. App boots, loads store, applies theme/accessibility preferences.
2. User lands on top-level cards list.
3. User creates first card from menu.
4. User edits title/body/tags and optionally adds children.
5. User reads card and navigates via breadcrumbs/search/children.

### Returning user flow
1. App loads prior dataset and preferences.
2. User resumes via recent cards/bookmarks/search.
3. User manages data through Data Hub (backup/export/import) and tag tools.

### Power user / modder flow
1. User opens Plugin Manager.
2. User installs or creates plugin (JSON/JS/CSS).
3. User iterates behavior through hooks/dev mode/safe mode.

### Flow quality summary
- **Strengths:** low-friction core loop, practical recovery, strong navigation affordances.
- **Weak points:** advanced capabilities can overwhelm without progressive disclosure.

## Incorporated recommendation package

The following recommendations are now consolidated as an implementation package and intentionally include all previously proposed themes.

### High priority
1. **Lifecycle cleanup registry for route renderers**
   - Add a render-lifecycle cleanup stack for scroll/listener teardown.
   - Prevent listener accumulation and improve long-session stability.

2. **Batched persistence for recursive/bulk operations**
   - Collapse recursive `save()` calls to a single commit boundary.
   - Apply to delete/duplicate/import paths.

3. **Transaction-aware undo groups**
   - Group multi-card operations into one logical undo action.
   - Include bulk import, recursive duplicate, and tag merge.

4. **Plugin safety UX hardening**
   - Add capability summaries pre-install.
   - Add first-run consent prompts for sensitive behaviors (network/storage/DOM overrides).

### Medium priority
5. **Progressive onboarding for advanced features**
   - Keep default experience minimal.
   - Contextually reveal datasets/plugins/advanced search.

6. **Performance budget + local-only diagnostics**
   - Track render time, save latency, listener counts in dev mode.
   - Gate regressions with tests/thresholds.

7. **Formalized data integrity checks**
   - Validate orphan links, parent/child consistency, duplicate IDs, cycles.
   - Provide auto-fix with user confirmation.

### Strategic
8. **Incremental runtime modularization**
   - Keep single-file distribution but enforce clearer internal boundaries.

9. **Storage architecture with user-controlled on-device location (updated requirement)**
   - **Default each new dataset to LocalStorage.**
   - After creation, provide a **Dataset Storage Settings** action where users can choose where the dataset is stored on-device.
   - Minimum supported on-device targets:
     - LocalStorage (default)
     - IndexedDB (higher-capacity local database)
     - Optional local file location via native shell / File System Access where available
   - Include one-click migration workflow (copy + verify + switch + rollback option).
   - Keep preference/config metadata in LocalStorage even when dataset payload moves.

10. **Expanded plugin threat-model documentation**
   - Publish practical risk profiles and safe-mode troubleshooting runbooks.

## Suggested implementation sequence (6 weeks)
- **Week 1:** render-lifecycle cleanup + listener leak tests.
- **Week 2:** batched save boundaries for recursive operations + perf benchmark.
- **Week 3:** undo transaction groups for bulk operations.
- **Week 4:** plugin capability disclosure + consent UX.
- **Week 5:** progressive onboarding and contextual feature education.
- **Week 6:** dataset storage settings (default LocalStorage + post-creation on-device location migration), plus integrity checker rollout.

## Overall assessment
CardSpoke’s core is strong for local-first, hierarchy-centric knowledge work with meaningful extensibility. The highest leverage is now operational hardening (lifecycle cleanup, save/undo semantics), safer plugin ergonomics, and user-controlled storage evolution that preserves a LocalStorage-first default.
