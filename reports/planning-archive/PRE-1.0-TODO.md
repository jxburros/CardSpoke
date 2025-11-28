# CardSpoke Pre-1.0 TODO List

**Generated:** 2025-11-27  
**Updated:** 2025-11-28
**Current Version:** 0.12.2  
**Target:** 1.0.0 Stable Release

This document consolidates all remaining tasks from the Road Map V2.md and spec-compliance-report.md that must be completed before the 1.0 release.

---

## ✅ Completed Items (v0.12.2)

These items have been completed in the current release:

- [x] **CONTRIBUTING.md** - Contribution guidelines (v0.12.1)
- [x] **CODE_OF_CONDUCT.md** - Community standards (v0.12.1)
- [x] **In-app Help Modal** - User documentation accessible from menu (v0.12.1)
- [x] **API Reference** - `docs/api-reference.md` (v0.12.1)
- [x] **Tutorial Mod Pack** - `examples/extensions/` with sample theme, plugin, patch (v0.12.1)
- [x] **README.md Updates** - Version sync, v0.12.0/0.12.1/0.12.2 features (v0.12.2)
- [x] **Version Sync** - All files updated to 0.12.2 (v0.12.2)
- [x] **`ai_assistants` Field in Extension Wizard** - Declare AI tools used (v0.12.2)
- [x] **Official vs Community Badge** - Source distinction in Extensions Manager (v0.12.2)
- [x] **Kit/Expansion Bundling UI** - Added Kit extension type (v0.12.2)
- [x] **Nested Menu UX** - Clean, organized menu with sections and submenus (v0.12.2)

---

## 📋 Remaining TODO Items Before 1.0

### Priority 1: Critical (Must Have)

| Item | Source | Status | Notes |
|------|--------|--------|-------|
| ~~CONTRIBUTING.md~~ | Roadmap | ✅ Done | v0.12.1 |
| ~~CODE_OF_CONDUCT.md~~ | Roadmap | ✅ Done | v0.12.1 |
| ~~In-app Help Modal~~ | Roadmap | ✅ Done | v0.12.1 |
| ~~README version sync~~ | Spec Compliance | ✅ Done | v0.12.2 |

**All Priority 1 items completed!**

---

### Priority 2: Important (Should Have)

| Item | Source | Status | Effort |
|------|--------|--------|--------|
| ~~`ai_assistants` field in Extension Wizard~~ | Spec Compliance §2.5 | ✅ Done | v0.12.2 |
| ~~Official vs Community badge distinction~~ | Spec Compliance §2.5 | ✅ Done | v0.12.2 |
| ~~Kit/Expansion bundling UI~~ | Spec Compliance §1.3 | ✅ Done | v0.12.2 |

**All Priority 2 items completed!**

---

### Priority 3: Medium (Nice to Have)

| Item | Source | Status | Effort |
|------|--------|--------|--------|
| Inline help tooltips | Roadmap v0.13 | ⏳ Pending | Medium |
| First-run experience/wizard | Roadmap v0.13 | ⏳ Pending | High |
| Migration guide | Roadmap v0.13 | ⏳ Pending | Low |
| Troubleshooting guide | Roadmap v0.13 | ⏳ Pending | Low |
| Changelog field in Extension Wizard | Spec Compliance §2.5 | ⏳ Pending | Low |

---

### Priority 4: Post-1.0 (Future Enhancement)

| Item | Source | Notes |
|------|--------|-------|
| Extension dependencies UI | Spec Compliance | Advanced feature |
| Schema compatibility field | Spec Compliance | Safety enhancement |
| Real-time collaboration | Spec Compliance §5 | Major feature |

---

## 📊 Summary

| Priority | Total | Done | Remaining |
|----------|-------|------|-----------|
| P1 Critical | 4 | 4 | **0** |
| P2 Important | 3 | 3 | **0** |
| P3 Medium | 5 | 0 | **5** |
| P4 Post-1.0 | 3 | 0 | (deferred) |

**Items blocking 1.0:** 0 Critical, 0 Important
**Recommended before 1.0:** Complete P3 items (optional)

---

## 🎯 Next Steps for 1.0 Release

### Phase 1: Final Testing ✓
1. All 177 tests passing
2. Manual verification of new features
3. Cross-browser testing

### Phase 2: Documentation Polish
1. Add inline help tooltips to complex UI elements (optional)
2. Create first-run onboarding wizard (optional)
3. Write migration and troubleshooting guides (optional)

### Phase 3: 1.0 Release
1. Final testing pass
2. Update version to 1.0.0
3. Create release notes
4. Tag release

---

## ✅ Version 0.12.2 Completion Summary

**Completed in this release:**

1. **Extension Wizard Enhancements**
   - Added `ai_assistants` optional field in Step 2
   - Added official/community source toggle
   - Added Kit extension type for bundling

2. **Extensions Manager Updates**
   - Official badge (✓ Official) for CardSpoke team extensions
   - Community badge for third-party extensions
   - Display of AI assistants used (🤖 AI: ...)

3. **Menu UX/UI Redesign**
   - Reorganized into logical sections: Cards, Extensions, Data, View, Help
   - Added visual icons for better discoverability
   - Nested submenus for Developer Tools and Export options
   - Cleaner, more intuitive navigation

4. **Version Synchronization**
   - package.json: 0.12.2
   - app.js: 0.12.2
   - index.html meta: 0.12.2
   - README.md: 0.12.2

---

*This TODO list was generated from Road Map V2.md and reports/spec-compliance-report.md*
*Updated: 2025-11-28 for v0.12.2 release*
