# Mega Showrunner Plan — Operation Quantum Leap 🔮

**Generated:** 2025-11-14T06:47:41Z
**Agent:** mega-showrunner
**Theme:** Operation Quantum Leap
**Tagline:** "Leaping into the future, one feature at a time"

---

## Campaign Brief

**Mission:** Execute a comprehensive update that brings CardSpoke from 90% v0.10 completion to a feature-rich v0.11 with significantly enhanced capabilities for knowledge management and user experience.

**Vision:** Transform CardSpoke into a more powerful, user-friendly, and extensible platform by implementing 12-15 high-value features spanning search, export, relationships, and user experience.

**Tone:** Progressive, ambitious, yet methodical — we're making big leaps forward while maintaining code quality and backward compatibility.

---

## Implementation Strategy

### Approach
1. **Incremental Commits** — Small, focused changes (≤20 files per commit)
2. **Test-Driven** — Write tests before or alongside implementation
3. **Feature Branches** — Work in `mega/feat/quantum-leap/*` branches
4. **Continuous Validation** — Run tests after each feature
5. **Documentation-First** — Update docs as features are built

### Risk Mitigation
- Start with low-risk features (exports, backlinks)
- Test on sample datasets before real data
- Keep rollback points every 3-5 features
- Maintain backward compatibility at all times

---

## TODO List

### GROUP 1: FIXES (Critical Stability) 🔴

**F1** — Complete v0.10 Multi-Dataset Search [L, P1]
- **Task:** Implement N8.1-N8.3 from TODO.generated.md
- **Details:**
  - N8.1: Add dataset selector dropdown to search bar
  - N8.2: Search service to accept dataset scope & merge results
  - N8.3: Performance optimization (debounce, limit results)
- **Acceptance:** Search works across multiple datasets with filter
- **Tests:** Add 10+ tests for multi-dataset search scenarios
- **Est:** 1-1.5 days

**F2** — Performance Optimization [M, P2]
- **Task:** Implement Q3.1-Q3.3 from TODO.generated.md
- **Details:**
  - Q3.1: Add dataset switch benchmark harness
  - Q3.2: Measure hotspots with profiling
  - Q3.3: Implement incremental improvements (virtualize, memoize)
- **Acceptance:** Dataset switching <500ms for 1000+ cards
- **Tests:** Add performance benchmarks
- **Est:** 1 day

---

### GROUP 2: QUALITY OF LIFE (User Experience) 💚

**Q1** — Enhanced Export: Markdown with Hierarchy [M, P1]
- **Task:** Improve markdown export to preserve card hierarchy
- **Details:**
  - Add nested structure with indentation or heading levels
  - Include metadata (tags, dates) in frontmatter
  - Preserve internal links in markdown format
- **Acceptance:** Exported markdown maintains structure
- **Tests:** Add export format validation tests
- **Est:** 0.5 day

**Q2** — Enhanced Export: CSV with Full Metadata [S, P1]
- **Task:** Improve CSV export with all card fields
- **Details:**
  - Add columns for tags, parent ID, creation date
  - Include metadata fields
  - Proper escaping for multi-line content
- **Acceptance:** CSV opens in Excel/Sheets with all data
- **Tests:** Add CSV format tests
- **Est:** 0.5 day

**Q3** — Backlinks Panel [M, P1]
- **Task:** Show cards that link to current card
- **Details:**
  - Add "Referenced By" section in card view
  - List all cards containing [[Current Card]] links
  - Make backlinks clickable
  - Update in real-time as links change
- **Acceptance:** Backlinks panel shows and navigates correctly
- **Tests:** Add 8+ backlink tests
- **Est:** 0.5 day

**Q4** — Keyboard Shortcuts Enhancement [S, P2]
- **Task:** Add more keyboard shortcuts for power users
- **Details:**
  - Ctrl+D: Duplicate card
  - Ctrl+L: Toggle card links view
  - Ctrl+T: Focus tags input
  - Ctrl+[: Navigate to parent
  - Ctrl+]: Navigate to first child
  - Alt+Up/Down: Move card in sibling order
- **Acceptance:** New shortcuts work and appear in help
- **Tests:** Add keyboard event tests
- **Est:** 0.5 day

**Q5** — Card Import from Markdown [M, P2]
- **Task:** Add ability to import markdown files as cards
- **Details:**
  - Parse markdown frontmatter for metadata
  - Convert heading levels to card hierarchy
  - Preserve internal links
  - Batch import multiple files
- **Acceptance:** Markdown files become card hierarchies
- **Tests:** Add import parsing tests
- **Est:** 1 day

**Q6** — Quick Card Templates [M, P2]
- **Task:** Allow users to save card structures as templates
- **Details:**
  - "Save as Template" button in card menu
  - Template library in sidebar
  - "New from Template" option
  - Templates include structure + placeholder text
- **Acceptance:** Templates can be saved and reused
- **Tests:** Add template CRUD tests
- **Est:** 0.5 day

---

### GROUP 3: NEXT-UP (Major Features) 🚀

**N1** — Basic Markdown Rendering [M, P1]
- **Task:** Render basic markdown in card body
- **Details:**
  - Support: **bold**, *italic*, `code`, [links]
  - Support: # headers, - lists, > blockquotes
  - Keep rendering simple (no heavy library)
  - Toggle between edit/view mode
- **Acceptance:** Markdown renders in view mode
- **Tests:** Add markdown parsing tests
- **Est:** 1 day

**N2** — Batch Card Operations [L, P1]
- **Task:** Multi-select cards for bulk actions
- **Details:**
  - Checkbox selection in card list
  - "Select All" / "Select None" buttons
  - Bulk actions: Delete, Move, Tag, Export
  - Visual feedback for selected cards
  - Keyboard: Shift+Click for range select
- **Acceptance:** Can select and act on multiple cards
- **Tests:** Add batch operation tests
- **Est:** 1 day

**N3** — Card Layout: Grid View [M, P2]
- **Task:** Add grid layout option for card display
- **Details:**
  - Toggle between list/grid view
  - Responsive grid (2-4 columns based on screen)
  - Show card title + preview
  - Click to open card
- **Acceptance:** Grid view displays cards in grid
- **Tests:** Add layout rendering tests
- **Est:** 0.5 day

**N4** — Typography Presets [S, P2]
- **Task:** Add reading mode options
- **Details:**
  - Preset 1: Default (16px, 1.5 line height)
  - Preset 2: Comfortable (18px, 1.7 line height)
  - Preset 3: Compact (14px, 1.4 line height)
  - Preset 4: Dyslexia-friendly (OpenDyslexic font, wider spacing)
  - Toggle in menu, save preference
- **Acceptance:** Typography changes throughout app
- **Tests:** Add preference storage tests
- **Est:** 0.5 day

**N5** — Card Version History [L, P2]
- **Task:** Track changes to card content
- **Details:**
  - Save snapshot on edit (max 10 versions per card)
  - Version list in card menu
  - View diff between versions
  - Restore previous version
  - Include timestamp + change summary
- **Acceptance:** Can view and restore previous versions
- **Tests:** Add version tracking tests
- **Est:** 1.5 days

**N6** — Smart Tag Suggestions [M, P2]
- **Task:** Auto-suggest tags based on content
- **Details:**
  - Analyze card title + body for keywords
  - Suggest existing tags that match
  - Suggest new tags from common words
  - "Apply All" button for suggestions
  - Learn from user's tag patterns
- **Acceptance:** Relevant tags suggested
- **Tests:** Add tag suggestion tests
- **Est:** 0.5 day

**N7** — Related Cards Panel [M, P2]
- **Task:** Show related cards based on tags and content
- **Details:**
  - Match cards with similar tags
  - Match cards with similar titles/content
  - Show relationship strength (% match)
  - Click to navigate to related card
- **Acceptance:** Related cards shown with relevance
- **Tests:** Add relationship matching tests
- **Est:** 0.5 day

**N8** — HTML Export [M, P2]
- **Task:** Export dataset as static HTML site
- **Details:**
  - Generate index.html with card list
  - Individual pages for each card
  - Navigation menu with hierarchy
  - Preserve styling and links
  - Include search functionality
- **Acceptance:** HTML export creates navigable site
- **Tests:** Add HTML generation tests
- **Est:** 1 day

---

## Task Sizing Summary

**Small (S):** 4 tasks (Q2, Q4, N4, estimated 2 days total)
**Medium (M):** 11 tasks (F2, Q1, Q3, Q5, Q6, N1, N3, N6, N7, N8, estimated 8.5 days)
**Large (L):** 3 tasks (F1, N2, N5, estimated 4 days)

**Total Estimated Effort:** 14.5 days
**Compressed Timeline (parallel work):** 8-10 days
**Target Timeline:** 2-3 days (high intensity)

---

## Priority Breakdown

**P1 (Must Have for v0.11):**
- F1: Multi-dataset search ✨
- Q1: Enhanced Markdown export
- Q2: Enhanced CSV export
- Q3: Backlinks panel
- N1: Basic markdown rendering
- N2: Batch operations

**P2 (Should Have):**
- F2: Performance optimization
- Q4: Keyboard shortcuts
- Q5: Markdown import
- Q6: Card templates
- N3: Grid view
- N4: Typography presets
- N5: Version history
- N6: Smart tags
- N7: Related cards
- N8: HTML export

---

## Implementation Order

### Phase A: Complete v0.10 (Day 1, 4 hours)
1. F1: Multi-dataset search
2. F2: Performance optimization

### Phase B: Export Enhancements (Day 1, 2 hours)
3. Q1: Enhanced Markdown export
4. Q2: Enhanced CSV export

### Phase C: Card Relationships (Day 1, 2 hours)
5. Q3: Backlinks panel
6. N7: Related cards panel

### Phase D: User Experience (Day 2, 4 hours)
7. N2: Batch operations
8. N3: Grid view
9. N4: Typography presets
10. Q4: Keyboard shortcuts

### Phase E: Content Features (Day 2, 4 hours)
11. N1: Basic markdown rendering
12. Q6: Card templates
13. N6: Smart tag suggestions

### Phase F: Advanced Features (Day 3, 4 hours)
14. Q5: Markdown import
15. N8: HTML export
16. N5: Version history (if time permits)

---

## Success Criteria

### Feature Completion
- ✅ Implement 12-15 features from TODO
- ✅ All P1 features complete (6 features)
- ✅ At least 8 P2 features complete

### Code Quality
- ✅ All 127+ existing tests pass
- ✅ Add 40+ new tests
- ✅ Code stays under 5,500 lines
- ✅ No linting errors
- ✅ Mobile responsive maintained

### Documentation
- ✅ README updated with new features
- ✅ AI_DEVELOPER_GUIDE updated
- ✅ Release notes created
- ✅ Version bumped to 0.11.0

### Testing
- ✅ Manual testing on mobile and desktop
- ✅ Edge case validation
- ✅ Backward compatibility verified
- ✅ Export/import roundtrips work

---

## Risk Assessment

### Low Risk
- Export enhancements (isolated)
- Keyboard shortcuts (additive)
- Typography presets (UI only)
- Backlinks (uses existing link parser)

### Medium Risk
- Multi-dataset search (performance concerns)
- Batch operations (UI complexity)
- Markdown rendering (parsing edge cases)
- Grid view (layout complexity)

### High Risk
- Version history (storage overhead)
- Markdown import (parsing variability)
- HTML export (template complexity)

### Mitigation Strategies
1. Test each feature thoroughly before moving on
2. Keep feature flags for risky features
3. Implement undo/rollback for destructive actions
4. Profile performance after each major change
5. Maintain backward compatibility with v0.10 data

---

**Status:** Plan Complete, Ready for Implementation
**Next Phase:** Build Execution
