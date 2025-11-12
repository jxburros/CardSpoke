# Middle Manager Plan
**Generated:** 2025-11-12  
**Repository:** jxburros/CardSpoke  
**Current Version:** 0.8.2  
**Branch:** copilot/complete-function-code

---

## Executive Summary

CardSpoke is currently at **version 0.8.2**, having successfully completed the Capacitor migration and Navigator Suite integration according to Road Map V2. The application now includes responsive design, cross-platform support (Web, Android, iOS), and enhanced navigation features (bookmarks, recent cards, card duplication, compact view).

### Progress Report Source
No fresh progress report found in `reports/roadmap-progress.md`. This plan is based on a local scan of:
- Current codebase (www/app.js v0.8.2)
- Road Map V2.md
- Open PRs (#24, #14, #9, #1)
- Recent commits (last 24h)
- TO DO.md

---

## Current State Analysis

### ✅ Completed Features (v0.8.2)
- **Capacitor Migration**: Full cross-platform support
- **Responsive Design**: Mobile-first with 3 breakpoints (1024px, 768px, 480px)
- **Navigator Suite**: 
  - ✅ Card bookmarks (`toggleBookmark`, `isBookmarked`)
  - ✅ Recent cards tracking
  - ✅ Card duplication (`duplicateCard`, `duplicateCardAsChild`)
  - ✅ Compact view mode (`viewMode: 'normal' | 'compact'`)
- **Schema v4**: Extended card structure with tags, meta, attributes, modsData

### 🚧 Known Status (from open PRs)
- **PR #14**: Schema v4 work in progress (Agent-Testing branch)
- **PR #9**: Additional v0.7 Schema v4 enhancements
- **PR #1**: UI refactor (codex branch)
- **PR #24**: This middle-manager planning session

### 📊 Technical Debt & Gaps
Based on code analysis:
1. **No test infrastructure** (package.json shows `"test": "echo \"Error: no test specified\" && exit 1"`)
2. **Incomplete Navigator Suite UI**: Features implemented but menu integration needs verification
3. **Dataset architecture (v0.9)**: Next major milestone, not started
4. **Extensions framework (v0.10)**: Mod system partially implemented but not fully exposed in UI

---

## Assumptions

1. **Scope**: Focus on quick wins that don't require schema changes or major refactoring
2. **Version**: Changes will increment to 0.8.3 (patch level)
3. **Capacity**: Task sizing assumes small team or solo developer context
4. **Risk tolerance**: Low - prioritize stability over new features
5. **Evidence threshold**: Items marked "needs-spec" if acceptance criteria unclear

---

## Planning Method

### Task Sizing
- **S (Small)**: ≤1 file, low risk, <2 hours (e.g., UI text fix, single function)
- **M (Medium)**: 2-5 files OR test changes, moderate risk, 2-8 hours (e.g., feature polish, integration)
- **L (Large)**: >5 files OR cross-cutting, high risk, 1-3 days (e.g., new subsystem, major refactor)

### Priority Levels
- **P1 (Critical)**: Broken core functionality or security issue
- **P2 (High)**: User-facing bug or important polish
- **P3 (Normal)**: Nice-to-have, future-facing improvement

### Task Cap
Current selection: **10 Small OR 5 Medium OR 2 Large** (mixed as needed). Given 0% unknown status and stable v0.8.2, we favor more S/M tasks for incremental improvement.

---

## TODO: Right-Sized Task List

### 🔴 Fixes (Critical/High Priority)

| ID | Task | Rationale | Size | Priority | Owner |
|----|------|-----------|------|----------|-------|
| FIX-1 | Add save status indicator | AI_DEVELOPER_GUIDE mentions save status (line 321), but implementation needs verification in UI | S | P2 | TBD |
| FIX-2 | Verify bookmark/recent menu integration | Features exist in code but menu items need testing (app.js:54-55) | S | P2 | TBD |
| FIX-3 | Add error boundary for mod execution | Safety layer mentioned in Roadmap v0.12 but basic protection needed now | M | P2 | TBD |

### 💚 Quality-of-Life (Developer & User Experience)

| ID | Task | Rationale | Size | Priority | Owner |
|----|------|-----------|------|----------|-------|
| QOL-1 | Add basic test infrastructure | No tests exist; package.json test script fails | M | P2 | TBD |
| QOL-2 | Document Navigator Suite features in README | Features complete but not highlighted in current README | S | P3 | TBD |
| QOL-3 | Add keyboard shortcuts reference | Enhance UX per Roadmap v0.13 goals | S | P3 | TBD |
| QOL-4 | Implement view mode UI toggle | Backend exists (`viewMode`), UI control needs confirmation | S | P2 | TBD |
| QOL-5 | Add save conflict resolution | Mentioned in Roadmap priority features | M | P3 | TBD |

### 🔵 Next-Up (Roadmap Alignment)

| ID | Task | Rationale | Size | Priority | Owner |
|----|------|-----------|------|----------|-------|
| NEXT-1 | Prepare for v0.9: Dataset Architecture planning | Next major version per Roadmap V2 | M | P3 | TBD |
| NEXT-2 | Create mod capability taxonomy | Foundation for v0.10 Extensions Framework | S | P3 | TBD |
| NEXT-3 | Design storage driver interface | v0.9 deliverable: `StorageDriver` interface definition | M | P3 | TBD |

---

## Task Details

### FIX-1: Add save status indicator
**Evidence**: AI_DEVELOPER_GUIDE.md lines 276-283 mention save status  
**Acceptance Criteria**:
- Visual indicator shows 'saved', 'saving', 'error' states
- Updates automatically on data changes
- Visible in all views

**Files to modify**: `www/index.html` (1 line), `www/app.js` (~10 lines), `www/styles.css` (~20 lines)

---

### FIX-2: Verify bookmark/recent menu integration
**Evidence**: `app.js:54-55` reference menu elements `menuBookmarks`, `menuRecentCards`  
**Acceptance Criteria**:
- Click "Bookmarks" menu → show bookmarked cards
- Click "Recent Cards" menu → show recent cards list
- Empty states handled gracefully

**Files to modify**: `www/app.js` (~30 lines validation/fixes)

---

### FIX-3: Add error boundary for mod execution
**Evidence**: Roadmap v0.12 "Mod Safety Layer", current `runModHook` lacks isolation  
**Acceptance Criteria**:
- Mod errors don't crash main app
- Errors logged to console with mod ID
- Optional: toast notification on mod failure

**Files to modify**: `www/app.js` (~20 lines)

---

### QOL-1: Add basic test infrastructure
**Evidence**: `package.json:6` shows placeholder test script  
**Acceptance Criteria**:
- Install minimal test framework (e.g., tape, uvu)
- Add 3-5 basic tests for core functions (createCard, deleteCard, searchCards)
- `npm test` runs successfully

**Files to modify**: `package.json`, new `tests/` directory (~150 lines total)

---

### QOL-2: Document Navigator Suite features
**Evidence**: v0.8.2 release notes in README incomplete  
**Acceptance Criteria**:
- Add "Navigator Suite" section to README with feature descriptions
- Include usage examples (how to bookmark, duplicate, etc.)
- Add screenshots if available

**Files to modify**: `README.md` (~50 lines)

---

### QOL-3: Add keyboard shortcuts reference
**Evidence**: Roadmap v0.13 mentions "shortcuts"  
**Acceptance Criteria**:
- Document existing shortcuts (if any)
- Add in-app help overlay (Ctrl+? or similar)
- Update README with shortcuts table

**Files to modify**: `README.md` (~20 lines), `www/app.js` (~40 lines)

---

### QOL-4: Implement view mode UI toggle
**Evidence**: `store.viewMode` exists but UI control unclear  
**Acceptance Criteria**:
- Add compact/normal view toggle in menu
- Persists across sessions
- Visual difference clear to user

**Files to modify**: `www/index.html` (~5 lines), `www/app.js` (~15 lines), `www/styles.css` (~30 lines)

---

### QOL-5: Add save conflict resolution
**Evidence**: Roadmap priority features "Save conflict resolution"  
**Acceptance Criteria**:
- Detect concurrent edits (e.g., multiple tabs)
- Prompt user to choose version or merge
- Document behavior in AI_DEVELOPER_GUIDE

**Files to modify**: `www/app.js` (~60 lines), AI_DEVELOPER_GUIDE.md (~20 lines)

---

### NEXT-1: Prepare for v0.9 Dataset Architecture
**Evidence**: Roadmap V2 v0.9 section  
**Acceptance Criteria**:
- Create design doc for multi-dataset support
- Define data migration strategy from v0.8.2 to v0.9
- Identify breaking changes (if any)

**Files to create**: `docs/v0.9-dataset-architecture.md` (~200 lines)

---

### NEXT-2: Create mod capability taxonomy
**Evidence**: Roadmap v0.12 mentions capability enforcement (`ui`, `data`, `network`)  
**Acceptance Criteria**:
- Define capability types in schema
- Document in AI_DEVELOPER_GUIDE
- Add `capabilities: string[]` to mod metadata

**Files to modify**: AI_DEVELOPER_GUIDE.md (~40 lines), `www/app.js` (~10 lines)

---

### NEXT-3: Design storage driver interface
**Evidence**: Roadmap v0.9 includes `StorageDriver` TypeScript interface  
**Acceptance Criteria**:
- Define interface with get/set/list/remove methods
- Create README for storage drivers
- Add to AI_DEVELOPER_GUIDE

**Files to create**: `docs/storage-driver-interface.md` (~100 lines)

---

## Recommendations

### Immediate Actions (This Sprint)
1. **FIX-1, FIX-2**: Validate/fix Navigator Suite UI integration
2. **QOL-2**: Document completed features for users
3. **QOL-4**: Polish view mode toggle for v0.8.3 release

### Next Sprint
1. **QOL-1**: Add test infrastructure before v0.9
2. **FIX-3**: Improve mod safety for extension developers
3. **NEXT-1**: Begin v0.9 planning phase

### Avoid For Now
- Large-scale refactors (PR #1 already in progress)
- Schema changes (v4 stabilizing across PRs)
- New major features (focus on polish and docs)

---

## Notes

### Unknown/Unclear Items
- **PR merge strategy**: Multiple PRs open; coordination needed to avoid conflicts
- **Navigator Suite completeness**: Code suggests partial implementation; needs manual testing
- **Mod system usage**: Zero mods in repo; hard to validate extensibility

### Out of Scope (Per Safety Rules)
- ❌ Release pipeline changes
- ❌ License modifications
- ❌ Canonical roadmap rewrites (this is a generated plan)
- ❌ Main branch direct modifications (work on feature branches)

---

## References

- **Roadmap**: `Road Map V2.md`
- **TODO**: `TO DO.md`
- **Developer Guide**: `AI_DEVELOPER_GUIDE.md`
- **Current Version**: `www/app.js` (v0.8.2)
- **Open PRs**: #1, #9, #14, #24

---

## Appendix: Task Summary

**Total Tasks**: 11  
**Breakdown**:
- Fixes: 3 (1S, 2M)
- QoL: 5 (3S, 2M)
- Next-Up: 3 (1S, 2M)

**Estimated Effort** (S=2h, M=5h, L=20h):
- Fixes: 12h
- QoL: 16h
- Next-Up: 12h
- **Total**: ~40 hours (~1 week for single developer)

**Risk Assessment**: **Low**  
All tasks are well-scoped, documentation-heavy, or polish-focused. No breaking changes proposed.

---

**Plan Confidence**: 75%  
**Reason**: No fresh progress report; some items inferred from code scanning rather than explicit requirements.

---

*Generated by Middle Manager Agent*  
*Last Updated: 2025-11-12*
