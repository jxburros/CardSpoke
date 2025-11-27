# CardSpoke Pre-1.0 TODO List

**Generated:** 2025-11-27  
**Current Version:** 0.12.1  
**Target:** 1.0.0 Stable Release

This document consolidates all remaining tasks from the Road Map V2.md and spec-compliance-report.md that must be completed before the 1.0 release.

---

## ✅ Completed Items (v0.12.1)

These items have been completed in the current release:

- [x] **CONTRIBUTING.md** - Contribution guidelines
- [x] **CODE_OF_CONDUCT.md** - Community standards  
- [x] **In-app Help Modal** - User documentation accessible from menu
- [x] **API Reference** - `docs/api-reference.md`
- [x] **Tutorial Mod Pack** - `examples/extensions/` with sample theme, plugin, patch
- [x] **README.md Updates** - Version sync, v0.12.0/0.12.1 features, updated roadmap
- [x] **Version Sync** - All files updated to 0.12.1

---

## 📋 Remaining TODO Items Before 1.0

### Priority 1: Critical (Must Have)

| Item | Source | Status | Notes |
|------|--------|--------|-------|
| ~~CONTRIBUTING.md~~ | Roadmap | ✅ Done | v0.12.1 |
| ~~CODE_OF_CONDUCT.md~~ | Roadmap | ✅ Done | v0.12.1 |
| ~~In-app Help Modal~~ | Roadmap | ✅ Done | v0.12.1 |
| ~~README version sync~~ | Spec Compliance | ✅ Done | v0.12.1 |

**All Priority 1 items completed!**

---

### Priority 2: Important (Should Have)

| Item | Source | Status | Effort |
|------|--------|--------|--------|
| `ai_assistants` field in Extension Wizard | Spec Compliance §2.5 | ⏳ Pending | Low |
| Official vs Angled badge distinction | Spec Compliance §2.5 | ⏳ Pending | Medium |
| Kit/Expansion bundling UI | Spec Compliance §1.3 | ⏳ Pending | Medium |

#### Details:

**1. `ai_assistants` Field in Extension Wizard**
- **Issue:** Extension metadata schema includes `ai_assistants` field but Extension Wizard doesn't prompt for it
- **Location:** `www/app.js` - `showExtensionWizard()` function
- **Action:** Add optional field in step 2 to declare AI assistants used

**2. Official vs Angled Badge Distinction**
- **Issue:** No visual distinction between "official" (CardSpoke team) and "angled" (community) extensions
- **Location:** Extensions Manager UI
- **Action:** Add badge or indicator showing extension source

**3. Kit/Expansion Bundling UI**
- **Issue:** Kit and Expansion types exist but no UI for creating bundles
- **Location:** Extension Wizard
- **Action:** Add bundling interface for Kit/Expansion types

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
| P2 Important | 3 | 0 | **3** |
| P3 Medium | 5 | 0 | **5** |
| P4 Post-1.0 | 3 | 0 | (deferred) |

**Items blocking 1.0:** 0 Critical, 3 Important  
**Recommended before 1.0:** Complete P2 items (3 tasks)

---

## 🎯 Recommended Action Plan

### Phase 1: Extension Wizard Enhancements (P2)
1. Add `ai_assistants` optional field to Extension Wizard step 2
2. Add "official/community" badge to Extensions Manager
3. Add Kit/Expansion bundling option to Extension Wizard

### Phase 2: Documentation Polish (P3, Optional)
4. Add inline help tooltips to complex UI elements
5. Create first-run onboarding wizard
6. Write migration and troubleshooting guides

### Phase 3: 1.0 Release
7. Final testing pass
8. Update version to 1.0.0
9. Create release notes

---

## Decision Point

**Question for maintainer:** Which Priority 2 items should be completed before 1.0?

Options:
- **A) All P2 items** - Complete spec compliance before 1.0
- **B) Only `ai_assistants` field** - Minimum spec compliance
- **C) None** - Ship 1.0 with current state (90% compliance)

Current spec compliance score: **90%** (Excellent)

---

*This TODO list was generated from Road Map V2.md and reports/spec-compliance-report.md*
