# Middle Manager Plan — v0.10 Extensions Framework

**Generated:** 2025-11-14  
**Current Version:** 0.10.0  
**Phase:** Extensions Framework  
**Progress Report Source:** reports/roadmap-progress.md (commit: 95e84d3, date: 2025-11-13)

---

## Executive Summary

Version 0.10.0 marks the beginning of the **Extensions Framework** phase. With v0.9 Dataset Architecture complete (100% roadmap compliance), we now focus on centralizing control for mods, themes, and tagging systems. This plan divides work into three strategic groups: **Fixes** (critical stability), **Quality-of-Life** (developer experience), and **Next-Up** (v0.10 roadmap features).

**Key Metrics:**
- v0.9.4 completion: 100% (7 planned + 9 bonus features)
- Test coverage: 62/62 passing (6ms execution time)
- Codebase health: Excellent (no open issues, comprehensive docs)
- Technical debt: Minimal
- Readiness for v0.10: HIGH ✅

---

## Assumptions & Constraints

### Assumptions
1. **Stable Foundation:** v0.9 architecture is production-ready and requires no breaking changes
2. **Test-Driven Development:** All new features will maintain 100% test pass rate
3. **Backward Compatibility:** Existing datasets and mods must continue working
4. **Incremental Delivery:** Features can be delivered in small, focused PRs
5. **Documentation First:** Each feature requires inline comments and README updates

### Constraints
1. **No Breaking Changes:** Users should upgrade seamlessly from v0.9.4 to v0.10.x
2. **Performance Budget:** No feature should slow core operations (card create/edit/navigate)
3. **Storage Compatibility:** Extensions must work with both IndexedDB and LocalStorage drivers
4. **Mobile First:** All UI changes must work on mobile screens (360px+)
5. **Size Cap:** Keep core app.js under 5,000 lines (current: 3,258)

### Evidence Base
- **Progress Report:** Fresh (< 24 hours old), comprehensive analysis
- **Roadmap:** Road Map V2.md clearly defines v0.10 scope
- **Test Suite:** 62 automated tests provide safety net
- **Recent PRs:** #31, #28, #27 show strong development velocity

---

## TODO List for v0.10

### Group 1: Fixes (Critical Stability) 🔴

*Priority: P1 (High) — Address broken or failing acceptance checks*

| # | Task | Rationale | Size | Priority | Owner |
|---|------|-----------|------|----------|-------|
| F1 | **Version history in app.js** | Comments reference v0.8.1 in header (line 6) but code is v0.10.0 | S | P1 | - |
| F2 | **Test version assertions** | No tests verify APP_VERSION constant matches package.json | S | P1 | - |
| F3 | **PIN encryption placeholder** | PIN infrastructure exists but lacks encryption layer, needs clear user messaging | M | P2 | - |

**Fixes Summary:** 3 tasks (2 Small, 1 Medium)

---

### Group 2: Quality-of-Life (Developer Experience) 💚

*Priority: P2-P3 — Small polish and dev-ex improvements*

| # | Task | Rationale | Size | Priority | Owner |
|---|------|-----------|------|----------|-------|
| Q1 | **Extension type badges** | Prepare CSS classes for future extension type display (Theme/Patch/Plugin/Mod) | S | P2 | - |
| Q2 | **Code comments for v0.10** | Add inline documentation for upcoming extension manager hooks | S | P3 | - |
| Q3 | **Dataset switcher performance** | Profile and optimize dataset switching for large datasets (1000+ cards) | M | P2 | - |
| Q4 | **Developer mode toggle prep** | Add UI toggle infrastructure (hidden) for future developer features | S | P3 | - |
| Q5 | **Toast notification system** | Implement base toast system (needed for mod load events in v0.10.1) | M | P2 | - |

**QoL Summary:** 5 tasks (3 Small, 2 Medium)

---

### Group 3: Next-Up (v0.10 Roadmap Features) 🚀

*Priority: P1-P2 — Roadmap items with clear acceptance criteria*

| # | Task | Rationale | Size | Priority | Owner |
|---|------|-----------|------|----------|-------|
| N1 | **Tagging infrastructure** | Add tags array to store schema, tag input UI, tag chips display | M | P1 | - |
| N2 | **Tag management UI** | Create tag filter panel, tag autocomplete, tag editing | M | P1 | - |
| N3 | **Extension registry** | Implement extension metadata storage in store.mods with enable/disable state | M | P1 | - |
| N4 | **Extensions page skeleton** | Create Extensions page with list view, enable/disable checkboxes, type badges | L | P1 | - |
| N5 | **Theme manager foundation** | Separate theme management from general extensions, under Appearance menu | M | P2 | - |
| N6 | **Internal link detection** | Add parser for `[[Card Name]]` syntax in card body text | M | P2 | - |
| N7 | **Internal link navigation** | Make `[[Card Name]]` clickable, navigate to linked card | M | P2 | - |
| N8 | **Global search foundation** | Extend current search to span multiple datasets (with dataset filter) | L | P2 | - |
| N9 | **Safe mode toggle** | Add emergency "load without extensions" option for troubleshooting | S | P2 | - |
| N10 | **Extension load logs** | Basic logging system to track which extensions loaded successfully | S | P2 | - |

**Next-Up Summary:** 10 tasks (2 Small, 6 Medium, 2 Large)

---

## Task Details & Acceptance Criteria

### Fixes

#### F1: Version history in app.js (S, P1)
- **File:** www/app.js (line 6)
- **Change:** Update comment from "Version: 0.8.1" to "Version: 0.10.0"
- **Acceptance:** Comment matches current version
- **Risk:** None
- **Effort:** 1 line change

#### F2: Test version assertions (S, P1)
- **File:** tests/store-structure.test.js (new test)
- **Change:** Add test that reads APP_VERSION from app.js and compares to package.json
- **Acceptance:** Test fails if versions mismatch
- **Risk:** Low (test-only change)
- **Effort:** ~10 lines

#### F3: PIN encryption placeholder (M, P2)
- **Files:** www/app.js (DatasetManager), www/index.html (Dataset Manager modal)
- **Change:** Add "PIN encryption coming in v0.10.3" message, disable PIN input with tooltip
- **Acceptance:** Users see clear status, no confusion about PIN readiness
- **Risk:** Low (UI-only change)
- **Effort:** ~20 lines (1 function, 1 modal update)

---

### Quality-of-Life

#### Q1: Extension type badges (S, P2)
- **File:** www/styles.css
- **Change:** Add CSS classes for .ext-badge, .ext-theme, .ext-patch, .ext-plugin, .ext-mod
- **Acceptance:** Badges styled consistently with card-count style
- **Risk:** None (CSS-only)
- **Effort:** ~15 lines CSS

#### Q2: Code comments for v0.10 (S, P3)
- **File:** www/app.js (store object, loadData function)
- **Change:** Add JSDoc-style comments for extension hooks (future)
- **Acceptance:** Comments explain planned extension points
- **Risk:** None (comment-only)
- **Effort:** ~30 lines comments

#### Q3: Dataset switcher performance (M, P2)
- **File:** www/app.js (DatasetManager.switchDataset)
- **Change:** Profile switching time, add lazy loading for large datasets
- **Acceptance:** Switching <500ms for datasets up to 5000 cards
- **Risk:** Medium (performance tuning)
- **Effort:** ~40 lines (profiling, optimization)
- **Note:** May need performance testing with generated data

#### Q4: Developer mode toggle prep (S, P3)
- **File:** www/index.html (menu), www/app.js (state)
- **Change:** Add hidden toggle in menu, store devMode flag in localStorage
- **Acceptance:** Toggle exists but does nothing (ready for v0.11)
- **Risk:** Low (hidden feature)
- **Effort:** ~15 lines

#### Q5: Toast notification system (M, P2)
- **Files:** www/app.js (new functions), www/styles.css (toast styles), www/index.html (toast container)
- **Change:** Implement showToast(message, type) with auto-dismiss
- **Acceptance:** Toast appears, styled, dismisses after 3s
- **Risk:** Low (isolated feature)
- **Effort:** ~60 lines (30 JS, 20 CSS, 10 HTML)

---

### Next-Up

#### N1: Tagging infrastructure (M, P1)
- **Files:** www/app.js (store schema, createCard, updateCard)
- **Change:** Add tags: [] to card schema, tag management functions
- **Acceptance:** Cards can have tags array, tags persist in storage
- **Risk:** Low (schema extension, backward compatible)
- **Effort:** ~40 lines (schema + 2 functions)
- **Dependencies:** None

#### N2: Tag management UI (M, P1)
- **Files:** www/app.js (card edit modal), www/styles.css (tag chips)
- **Change:** Add tag input field, display tag chips, tag autocomplete
- **Acceptance:** Users can add/remove tags, see existing tags
- **Risk:** Medium (UI interaction complexity)
- **Effort:** ~80 lines (50 JS, 30 CSS)
- **Dependencies:** N1

#### N3: Extension registry (M, P1)
- **File:** www/app.js (store.mods structure)
- **Change:** Extend store.mods to include metadata: enabled, type, version, author
- **Acceptance:** Extensions have rich metadata, persisted correctly
- **Risk:** Low (data structure change, tests exist)
- **Effort:** ~50 lines (structure + migration)
- **Dependencies:** None

#### N4: Extensions page skeleton (L, P1)
- **Files:** www/app.js (new page), www/index.html (new page structure), www/styles.css
- **Change:** Create full Extensions page with list, enable/disable, type badges, safe mode
- **Acceptance:** Extensions page renders, shows all mods, checkboxes work
- **Risk:** High (large UI change, ~150 lines across 3 files)
- **Effort:** ~150 lines (80 JS, 40 HTML, 30 CSS)
- **Dependencies:** N3, Q1
- **Note:** Can be split into 2-3 smaller tasks if needed

#### N5: Theme manager foundation (M, P2)
- **Files:** www/app.js (theme functions), www/index.html (Appearance section)
- **Change:** Extract theme mods to separate management under Appearance menu
- **Acceptance:** Themes listed separately from extensions, one active at a time
- **Risk:** Medium (refactoring existing mod system)
- **Effort:** ~60 lines (30 JS, 30 HTML)
- **Dependencies:** N3, N4

#### N6: Internal link detection (M, P2)
- **File:** www/app.js (new parser function)
- **Change:** Regex parser to detect [[Card Name]] in card body, store references
- **Acceptance:** Parser finds all [[...]] patterns, handles edge cases
- **Risk:** Low (parsing logic, well-tested pattern)
- **Effort:** ~40 lines (parser + tests)
- **Dependencies:** None

#### N7: Internal link navigation (M, P2)
- **Files:** www/app.js (renderCard, navigation), www/styles.css (link styling)
- **Change:** Convert [[Card Name]] to clickable links, navigate on click
- **Acceptance:** Links are clickable, navigate to correct card (or show error if not found)
- **Risk:** Medium (UI interaction + navigation logic)
- **Effort:** ~50 lines (35 JS, 15 CSS)
- **Dependencies:** N6

#### N8: Global search foundation (L, P2)
- **File:** www/app.js (search functions, DatasetManager integration)
- **Change:** Extend fuzzy search to query multiple datasets, add dataset filter dropdown
- **Acceptance:** Search returns results from all datasets, filter works
- **Risk:** High (performance concerns, ~100 lines)
- **Effort:** ~100 lines
- **Dependencies:** None (uses existing DatasetManager)
- **Note:** May need performance optimization for 10+ datasets

#### N9: Safe mode toggle (S, P2)
- **File:** www/app.js (startup logic)
- **Change:** Check for ?safemode URL param, skip loading extensions if present
- **Acceptance:** Adding ?safemode to URL loads app without extensions
- **Risk:** Low (URL param check)
- **Effort:** ~15 lines
- **Dependencies:** N4

#### N10: Extension load logs (S, P2)
- **File:** www/app.js (mod loading functions)
- **Change:** Add console.log statements when extensions load, track failures
- **Acceptance:** Console shows which extensions loaded/failed
- **Risk:** Low (logging only)
- **Effort:** ~20 lines
- **Dependencies:** N4

---

## Delivery Strategy

### Phase 1: Stabilization (Tasks F1-F3, Q1-Q2) — Est. 1-2 days
Focus on version consistency and documentation preparation.
- Update version comments
- Add version tests
- Clarify PIN status
- Add CSS prep for extensions
- Document extension hooks

**Outcome:** Clean foundation, no breaking changes, clear messaging

---

### Phase 2: Infrastructure (Tasks N1-N3, Q5) — Est. 3-4 days
Build core systems needed for extensions.
- Tagging infrastructure + UI
- Extension registry metadata
- Toast notification system

**Outcome:** Tags work, extensions have metadata, toast system ready

---

### Phase 3: Extensions Page (Tasks N4-N5, Q4, N9-N10) — Est. 4-5 days
Create the main Extensions management UI.
- Extensions page with full UI
- Theme manager separation
- Developer mode prep
- Safe mode toggle
- Extension logs

**Outcome:** Extensions page is usable, themes separated, safe mode works

---

### Phase 4: Internal Links (Tasks N6-N7) — Est. 2-3 days
Implement card linking system.
- Link detection parser
- Clickable link navigation

**Outcome:** [[Card Name]] syntax works end-to-end

---

### Phase 5: Global Search (Task N8, Q3) — Est. 3-4 days
Extend search to multiple datasets.
- Multi-dataset search
- Dataset switcher optimization

**Outcome:** Search works across datasets with good performance

---

## Risks & Mitigations

### High-Risk Items
1. **N4 (Extensions Page):** Large UI change (~150 lines)
   - **Mitigation:** Break into 3 PRs (structure, functionality, polish)
   - **Validation:** Test with 0, 1, 10 extensions

2. **N8 (Global Search):** Performance with many datasets
   - **Mitigation:** Test with 10 datasets × 1000 cards each
   - **Validation:** Search completes <1s, no UI blocking

### Medium-Risk Items
1. **Q3 (Dataset Switcher Performance):** Optimization without tests
   - **Mitigation:** Add performance tests, profile before/after
   - **Validation:** <500ms switching time

2. **N7 (Internal Link Navigation):** Complex UI interaction
   - **Mitigation:** Write comprehensive tests for edge cases
   - **Validation:** Links work from any navigation context

### Low-Risk Items
- All Size S tasks (minimal code change)
- CSS-only changes
- Comment-only changes

---

## Testing Strategy

### For Each Task
1. **Existing tests must pass:** 62/62 before and after
2. **New tests for new features:** Minimum 2 tests per feature
3. **Manual testing checklist:** Documented in PR description
4. **Mobile testing:** Check responsive layout on 360px viewport
5. **Storage compatibility:** Test with both IndexedDB and LocalStorage

### Test Expansion Plan
- **Current:** 62 tests (card ops, navigator, search, store, ui-state)
- **Target v0.10:** 80+ tests
- **New suites needed:**
  - tests/tagging.test.js (N1, N2)
  - tests/extensions.test.js (N3, N4)
  - tests/internal-links.test.js (N6, N7)
  - tests/global-search.test.js (N8)

---

## Success Metrics

### Code Quality
- ✅ Test coverage: Maintain 100% pass rate, grow to 80+ tests
- ✅ Performance: No regression in core operations (<10ms for create/edit)
- ✅ Size: Keep app.js under 5,000 lines (current 3,258 + ~600 new = 3,858)
- ✅ Documentation: Every function has inline comments

### Feature Completion
- ✅ All P1 tasks complete (9 tasks)
- ✅ 80%+ of P2 tasks complete (7/9 tasks)
- ✅ Roadmap alignment: v0.10 deliverables met

### User Experience
- ✅ No breaking changes for v0.9.4 users
- ✅ All features work on mobile (360px+)
- ✅ Extensions page is intuitive (no docs needed)
- ✅ Performance maintained (no user complaints)

---

## Dependencies & Blockers

### External Dependencies
- **None:** All work is internal to CardSpoke

### Internal Dependencies
- N2 requires N1 (tags UI needs tags infrastructure)
- N4 requires N3 (extensions page needs metadata)
- N5 requires N3, N4 (theme manager needs extension registry + page)
- N7 requires N6 (link navigation needs detection)
- N9 requires N4 (safe mode needs extensions page)
- N10 requires N4 (logs need extension loading)

### Potential Blockers
1. **Size of N4:** May need to split into multiple PRs
2. **Performance of N8:** May need async implementation
3. **Unknown scope:** Some tasks may reveal hidden complexity

**Mitigation:** Start with smallest P1 tasks, build confidence, adjust plan as needed

---

## Open Questions

1. **Mod Taxonomy:** Should we enforce strict types (Theme/Patch/Plugin/Mod/Expansion) now or in v0.11?
   - **Recommendation:** Add type field in N3, but don't enforce validation until v0.11

2. **Tag Limits:** Should cards have a maximum number of tags?
   - **Recommendation:** Start with no limit, monitor performance, add if needed

3. **Extension Order:** Should users control extension load order in v0.10?
   - **Recommendation:** Defer to v0.11 (Developer Ecosystem), use alphabetical for now

4. **Global Search UX:** Results from different datasets mixed or grouped?
   - **Recommendation:** Grouped by dataset, with dataset name headers

5. **Internal Links:** Support for `[[Dataset::Card Name]]` cross-dataset links?
   - **Recommendation:** Defer to v0.10.2, start with same-dataset only

---

## Post-v0.10 Outlook

After completing v0.10 tasks:
- **v0.10.1-0.10.3:** Polish, performance tuning, bug fixes
- **v0.11:** Developer Ecosystem (Wizard, Playground, CIB.utils)
- **v0.12:** Safety & Governance (Mod safety, Rewind, Deviations)
- **v1.0:** Final polish and documentation

v0.10 represents ~20% of remaining work to v1.0. Estimated timeline:
- **v0.10 completion:** 15-20 days (given 18 total tasks)
- **v0.11-0.14 completion:** 40-60 days
- **v1.0 release:** ~90 days from today

---

## Notes for Middle Manager

This plan was generated following the Middle Manager agent pattern:
- ✅ Used fresh progress report (reports/roadmap-progress.md, <24 hours old)
- ✅ Three task groups: Fixes (3), QoL (5), Next-Up (10)
- ✅ Sizing: Small (≤1 file, low risk), Medium (2-5 files), Large (>5 files)
- ✅ Priority: P1 (critical), P2 (important), P3 (nice-to-have)
- ✅ Evidence: All tasks linked to roadmap or code analysis
- ✅ Safety: No changes to releases, secrets, licensing
- ✅ Balanced: Mix of quick wins (8 Small) and strategic work (2 Large)

**Repository Status:**
- ✅ No unknown status items (100% confidence)
- ✅ Can propose L-sized tasks safely
- ✅ No existing issues to consider
- ✅ Recent PRs show strong development velocity

**Recommendation:** Begin with Phase 1 (Stabilization), then proceed sequentially through phases. Each phase can be delivered independently without blocking other work.

---

**Report Status:** COMPLETE  
**Generated By:** Middle Manager Agent  
**Next Review:** After Phase 1 completion (F1-F3, Q1-Q2 tasks done)
