# Middle Manager Plan — v0.11.X Remaining Work
**Generated:** 2025-11-21  
**Agent:** Middle Manager (GitHub Copilot)  
**Branch:** copilot/fix-footer-and-check-status  
**Context:** v0.11.2.5 status check and planning

---

## Executive Summary

**Current Status:** v0.11.2.5  
**Progress Report Source:** reports/roadmap-progress.md (generated 2025-11-14)

**Key Findings:**
- ✅ **Footer issue FIXED** in v0.11.2.5 with enhanced error handling and debugging
- ⚠️ **v0.11 Original Plan: 20% complete** (1/5 core features, 1/5 partial)
- ✅ **Strategic Pivot Delivered:** 7 Post-1.0 Priority Features implemented instead
- ✅ **Test Coverage:** 152/152 tests passing (100%)
- ✅ **P1 Tasks from v0.10:** 100% complete

**Strategic Decision Point:**
The v0.11 phase deviated from the original roadmap (Developer Ecosystem) and delivered Post-1.0 Priority Features (Knowledge Management) instead. This TODO list addresses both paths forward.

---

## Recently Completed (v0.11.2.5)

### FIXES
- [x] **FIX-001: Footer metadata display** (Priority: P1, Size: S, Owner: Middle-Manager)
  - **Issue:** Footer showing empty values "Version: () — Last update by:"
  - **Solution:** Enhanced `populateFooter()` with error handling, logging, and validation
  - **Evidence:** www/app.js:4558-4605, package.json version updated
  - **Tests:** All 152 tests passing including version validation
  - **Status:** ✅ COMPLETE

---

## TODO List — Three-Tier Breakdown

### FIXES (Critical Issues — P1 Priority)

**None identified.** All critical issues resolved. System is stable and fully functional.

---

### QUALITY-OF-LIFE IMPROVEMENTS (P2 Priority)

#### QOL-001: Expose CardSpoke.utils API for Mod Developers
- **Size:** Small (S) — 2-4 hours
- **Priority:** P2 (High)
- **Dependencies:** None
- **Owner:** Constructor or Insect-Enthusiast
- **Description:** Make utility functions available as `window.CardSpoke.utils.*` for mod developers
- **Evidence:** Functions exist (createCard, updateCard, getTags, addTag, showToast) but not exposed globally
- **Location:** www/app.js (create wrapper around line 1421+)
- **Acceptance Criteria:**
  - [ ] `CardSpoke.utils.createCard()` callable from browser console
  - [ ] `CardSpoke.utils.updateCard()` callable
  - [ ] `CardSpoke.utils.getTags()` callable
  - [ ] [ ] `CardSpoke.utils.addTag()` callable
  - [ ] `CardSpoke.utils.showToast()` callable
  - [ ] Documentation added to AI_DEVELOPER_GUIDE.md
  - [ ] Tests added for API exposure

#### QOL-002: Update README.md for v0.11.X
- **Size:** Small (S) — 30-60 minutes
- **Priority:** P2 (High)
- **Dependencies:** None
- **Owner:** Librarian or Creative-Director
- **Description:** README.md still shows v0.10.6, needs update with v0.11.0+ features
- **Evidence:** reports/roadmap-progress.md line 254
- **Features to Document:**
  - Backlinks panel
  - Related cards
  - Grid view (Ctrl+G)
  - Typography presets (4 modes)
  - Smart tag suggestions
  - Enhanced keyboard shortcuts (Ctrl+D, Ctrl+T, Ctrl+[/])
  - Enhanced exports (Markdown hierarchy, CSV metadata)
- **Acceptance Criteria:**
  - [ ] Version updated to 0.11.2.5
  - [ ] All 7 new features documented
  - [ ] Screenshots/GIFs added if possible
  - [ ] Quick start guide updated

#### QOL-003: Create RELEASE_NOTES_v0.11.0.md
- **Size:** Small (S) — 1 hour
- **Priority:** P2 (Medium)
- **Dependencies:** None
- **Owner:** Librarian or Showrunner
- **Description:** Document the strategic pivot and feature delivery for v0.11
- **Evidence:** reports/roadmap-progress.md recommendation
- **Content:**
  - Explanation of strategic pivot (Developer Ecosystem → Priority Features)
  - List of 7 delivered features
  - Migration guide (if any breaking changes)
  - Known issues
  - Next steps
- **Acceptance Criteria:**
  - [ ] Release notes created in reports/releases/
  - [ ] Strategic pivot explained clearly
  - [ ] Feature list with code references
  - [ ] Version history updated

#### QOL-004: Add Footer Population Test
- **Size:** Small (S) — 1-2 hours
- **Priority:** P2 (Low)
- **Dependencies:** None
- **Owner:** Insect-Enthusiast
- **Description:** Add explicit test for footer population to prevent regression
- **Location:** tests/footer.test.js (new file)
- **Test Cases:**
  - [ ] Footer elements exist in DOM
  - [ ] populateFooter() sets creator correctly
  - [ ] populateFooter() sets version correctly
  - [ ] populateFooter() sets date correctly
  - [ ] populateFooter() sets updater correctly
  - [ ] populateFooter() handles missing elements gracefully
  - [ ] populateFooter() logs errors when elements missing
- **Acceptance Criteria:**
  - [ ] 7+ tests added
  - [ ] All tests passing
  - [ ] Coverage for error cases

---

### NEXT-UP (v0.11 Original Roadmap Features — P2/P3 Priority)

#### NEXT-001: Extension Wizard (Original v0.11 Deliverable)
- **Size:** Large (L) — 2-3 days
- **Priority:** P2 (Medium) — Can defer to v0.12 or later
- **Dependencies:** None
- **Owner:** Constructor or Mega-Showrunner
- **Description:** Interactive wizard to scaffold new extensions
- **Planned Features:**
  - Type selection (Theme, Patch, Plugin, Mod, Expansion)
  - Manifest generation with metadata
  - Skeleton code templates
  - Live preview
  - Export as .json or .js
- **Estimated Complexity:** High (new UI modal, template system, code generation)
- **Acceptance Criteria:**
  - [ ] Modal UI with step-by-step flow
  - [ ] Type selection with descriptions
  - [ ] Manifest form (name, version, creator, description)
  - [ ] Code template generation
  - [ ] Live preview of generated code
  - [ ] Export functionality
  - [ ] Tests for wizard logic
- **Deferral Justification:** Not blocking any other features, can ship v0.11.X without it

#### NEXT-002: Playground (Original v0.11 Deliverable)
- **Size:** Large (L) — 3-4 days
- **Priority:** P2 (Medium) — Can defer to v0.12 or later
- **Dependencies:** NEXT-001 (recommended but not required)
- **Owner:** Constructor or Mega-Showrunner
- **Description:** Sandboxed editor for testing extension code
- **Planned Features:**
  - Split-pane editor (JS, CSS, manifest)
  - Syntax highlighting
  - Live reload
  - Error boundary and debugging
  - Console output
  - Temporary extension loading
- **Estimated Complexity:** High (code editor integration, sandboxing, error handling)
- **Acceptance Criteria:**
  - [ ] Editor UI with tabs for JS/CSS/Manifest
  - [ ] Syntax highlighting
  - [ ] Live reload on code change
  - [ ] Console output panel
  - [ ] Error display with stack traces
  - [ ] Temporary extension loading
  - [ ] Save/Load playground sessions
  - [ ] Tests for playground functionality
- **Deferral Justification:** Not blocking any other features, can ship v0.11.X without it

#### NEXT-003: Multi-Dataset Search (v0.10 Incomplete)
- **Size:** Medium (M) — 1-2 days
- **Priority:** P2 (Low) — Can defer to v0.12
- **Dependencies:** None (infrastructure exists)
- **Owner:** Insect-Enthusiast
- **Description:** Complete multi-dataset search functionality
- **Remaining Work:**
  - N8.1: Dataset selector dropdown to search bar ✅ (exists in HTML)
  - N8.2: Search service accepting dataset scope & merge results
  - N8.3: Performance optimization (debounce, limit/paginate)
- **Evidence:** TODO.checklist.md lines 47-49, tests/multi-dataset-search.test.js (10 tests)
- **Acceptance Criteria:**
  - [ ] Dataset selector functional
  - [ ] "All Datasets" search merges results
  - [ ] Results show dataset source
  - [ ] Debounced input (300ms)
  - [ ] Pagination for large result sets
  - [ ] Performance tests (<100ms for 1000 cards)
- **Deferral Justification:** Current single-dataset search is sufficient for most use cases

#### NEXT-004: Performance Optimization (v0.10 Incomplete)
- **Size:** Medium (M) — 1-2 days
- **Priority:** P3 (Low) — Can defer indefinitely
- **Dependencies:** NEXT-003 (for multi-dataset benchmarks)
- **Owner:** Insect-Enthusiast
- **Description:** Dataset switching and rendering optimization
- **Remaining Work:**
  - Q3.1: Add dataset switch benchmark harness
  - Q3.2: Measure hotspots with flamegraphs & profiling
  - Q3.3: Implement incremental improvements (virtualize, memoize)
- **Evidence:** TODO.checklist.md lines 49-51
- **Acceptance Criteria:**
  - [ ] Benchmark suite for dataset operations
  - [ ] Profiling data collected
  - [ ] Dataset switch <500ms for 1000 cards
  - [ ] Render time <100ms for card list
  - [ ] Virtual scrolling for 10k+ cards (optional)
- **Deferral Justification:** No reported performance issues, current speed is acceptable

---

## Recommended Implementation Order

### Sprint 1: Documentation & Polish (1-2 days)
1. **QOL-002:** Update README.md (30-60 min) — Immediate user value
2. **QOL-003:** Create RELEASE_NOTES_v0.11.0.md (1 hour) — Historical record
3. **QOL-004:** Add footer population test (1-2 hours) — Prevent regression

### Sprint 2: Developer Experience (2-4 hours)
4. **QOL-001:** Expose CardSpoke.utils API (2-4 hours) — Enables mod developers

### Sprint 3: Optional Enhancements (5-7 days — defer to v0.12 if needed)
5. **NEXT-003:** Multi-dataset search (1-2 days) — Complete v0.10 feature
6. **NEXT-001:** Extension Wizard (2-3 days) — Original v0.11 feature
7. **NEXT-002:** Playground (3-4 days) — Original v0.11 feature

### Sprint 4: Performance (1-2 days — low priority)
8. **NEXT-004:** Performance optimization (1-2 days) — Only if issues arise

---

## Task Breakdown Summary

| Category | Count | Size Distribution | Priority Distribution |
|----------|-------|-------------------|----------------------|
| **FIXES** | 0 | - | - |
| **QOL** | 4 | 4S | 2×P2-High, 1×P2-Med, 1×P2-Low |
| **NEXT-UP** | 4 | 2L, 2M | 3×P2, 1×P3 |
| **TOTAL** | 8 | 4S, 2M, 2L | 5×P2, 1×P3 |

**Estimated Total Time:**
- Must-Have (QOL): 4-8 hours (documentation + tests + API exposure)
- Optional (NEXT-UP): 7-11 days (wizard, playground, search, perf)

**Recommended v0.11.X Scope:** QOL items only (4-8 hours)  
**Defer to v0.12+:** NEXT-UP items (wizard, playground, multi-dataset search)

---

## Dependencies Graph

```
QOL-001 (CardSpoke.utils API)
  └─ (enables) NEXT-001, NEXT-002 (but not blocking)

QOL-002 (README)
  └─ (documents) All v0.11.0 features

QOL-003 (Release Notes)
  └─ (explains) Strategic pivot

QOL-004 (Footer Tests)
  └─ (no dependencies)

NEXT-001 (Wizard)
  └─ (optional) ← QOL-001 (for testing)

NEXT-002 (Playground)
  └─ (optional) ← NEXT-001 (for generating test code)

NEXT-003 (Multi-Dataset Search)
  └─ (no dependencies)

NEXT-004 (Performance)
  └─ (recommended) ← NEXT-003 (for benchmarking)
```

---

## Blockers & Risks

**No blockers identified.** All tasks are independently executable.

**Risks:**
1. **Scope Creep:** Wizard and Playground are large features that could expand beyond estimates
2. **Strategic Misalignment:** v0.11 already pivoted away from Developer Ecosystem features
3. **Time Investment:** Completing NEXT-001 and NEXT-002 would require 5-7 days of focused work
4. **User Demand:** Unclear if users need Wizard/Playground more than other features

**Mitigation:**
- Keep Sprint 1 & 2 (documentation + API) as mandatory for v0.11.X
- Defer NEXT-001, NEXT-002, NEXT-003, NEXT-004 to v0.12+ based on user feedback
- Consider renaming v0.11 to "v0.11 — Knowledge Management" to reflect actual deliverables

---

## Success Criteria

### v0.11.X Patch Release (v0.11.2.6 or v0.11.3.0)
- [x] Footer display issue resolved (v0.11.2.5)
- [ ] README.md updated with v0.11 features
- [ ] RELEASE_NOTES_v0.11.0.md created
- [ ] CardSpoke.utils API exposed for mod developers
- [ ] Footer population tests added
- [ ] All tests passing (152+)
- [ ] No regressions

### v0.12.0 Release (Next Major)
- Follow Road Map V2.md: Safety & Governance
  - Mod Safety Layer
  - Deviation Metadata
  - Rewind Snapshots
  - Health Panel
- OR continue with Post-1.0 Priority Features
  - Card Duplication UI
  - Batch Operations
  - Version History
  - Bookmarks/Favorites

---

## Confidence & Metadata

**Confidence Level:** 95%  
- ✅ All features verified by code inspection
- ✅ Progress report source is recent (2025-11-14)
- ✅ Tests validate current state (152/152 passing)
- ✅ Strategic pivot clearly documented

**Assumptions:**
- User wants both status check AND remaining work planning
- Footer issue is the primary blocker
- v0.11.X should complete QOL items before moving to v0.12
- Original v0.11 Developer Ecosystem features can be deferred

**Sources:**
- Road Map V2.md (lines 138-163)
- reports/roadmap-progress.md (generated 2025-11-14)
- TODO.checklist.md (v0.10 completion status)
- www/app.js (code inspection)
- tests/ (152 passing tests)

---

**Generated By:** Middle Manager Agent  
**Date:** 2025-11-21  
**Version:** 2.0  
**Next Update:** After QOL tasks complete or v0.12.0 planning begins
