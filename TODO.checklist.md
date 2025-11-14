# v0.10 Checklist — Tasks by Size, Urgency, Dependencies, and Recommended Order

Generated from: TODO.generated.md (reports/middle-manager-plan.md)  
Generated: 2025-11-14 by @copilot

How to read this file
- Each line is a single actionable checklist item (intended as one PR).
- Size: S = Small, M = Medium, L = Large (see plan for definitions).
- Urgency: P1 = high (required for v0.10), P2 = medium, P3 = low.
- Dependencies: list of items that should complete first (arrow means "depends on").
- "Order" column is a recommended implementation order (1 = first). Use it as a guide, not a hard rule.

Summary: remaining work broken into S/M/L tasks below (all unchecked).

---

## Small tasks (S)
- [ ] N1.1 — Schema: add optional `tags: string[]` to card schema (Est: ½d) — Urg: P1 — Deps: none — Order: 1
- [ ] N3.1 — Define mods metadata shape & types (Est: ½d) — Urg: P1 — Deps: none — Order: 2
- [ ] Q5.1 — Toast UI component + CSS (Est: ½d) — Urg: P2 — Deps: none — Order: 3
- [ ] N4.1 — /extensions route and skeleton container (Est: ½d) — Urg: P1 — Deps: N3.1 recommended — Order: 4
- [ ] N4.3 — Enable/disable checkbox wiring to store (Est: ½d) — Urg: P1 — Deps: N3.2 (persisting metadata) — Order: 5
- [ ] N6.1 — Parser: detect [[Card Name]] tokens (regex) (Est: ½d) — Urg: P2 — Deps: none — Order: 9
- [ ] N7.1 — Lookup: find card ID by normalized name (Est: ½d) — Urg: P2 — Deps: N6.2 (normalizer recommended) — Order: 10
- [ ] N8.1 — Add dataset selector dropdown to search bar (Est: ½d) — Urg: P2 — Deps: none — Order: 11
- [ ] N5.1 — Theme registry: activeTheme key in store (Est: ½d) — Urg: P2 — Deps: N3.1 suggested — Order: 6
- [ ] Q3.1 — Add dataset switch benchmark harness (Est: ½d) — Urg: P2 — Deps: none — Order: 12

---

## Medium tasks (M)
- [ ] N1.2 — Implement tags API: addTag/removeTag/getTags (Est: 1d) — Urg: P1 — Deps: N1.1 — Order: 7
- [ ] N1.3 — Persist tags across export/import & dataset switch (Est: 1d) — Urg: P1 — Deps: N1.2 — Order: 8
- [ ] N2.2 — Tag input component (enter/comma/paste support) (Est: 1d) — Urg: P1 — Deps: N1.2, N2.1 — Order: 13
- [ ] N2.3 — Tag autocomplete (dataset suggestions) (Est: 1d) — Urg: P1 — Deps: N1.3, N2.2 — Order: 14
- [ ] N2.4 — Integrate tags UI into card editor/details (Est: 1d) — Urg: P1 — Deps: N2.1–N2.3 — Order: 15
- [ ] N3.2 — Persist mods metadata in store + dataset serialization (Est: ½–1d) — Urg: P1 — Deps: N3.1 — Order: 3 (parallel with Q5.1)
- [ ] N3.3 — Show mods metadata (name/ver/author) in Extensions list (Est: 1d) — Urg: P1 — Deps: N4.2, N3.2 — Order: 16
- [ ] N4.2 — Extensions list component (reads store.mods) (Est: 1d) — Urg: P1 — Deps: N3.2 — Order: 17
- [ ] N4.4 — Type badges in extensions list (.ext-badge classes) (Est: ½d) — Urg: P1 — Deps: Q1 (already done), N4.2 — Order: 18
- [ ] Q5.2 — showToast API + auto-dismiss (3s), pause on hover (Est: ½d) — Urg: P2 — Deps: Q5.1 — Order: 19
- [ ] Q5.3 — Integrate toasts in key flows (dataset switch, extension load) (Est: ½d) — Urg: P2 — Deps: Q5.2 — Order: 20
- [ ] N5.3 — Appearance UI: theme list + set active + preview (Est: 1–1.5d) — Urg: P2 — Deps: N5.1, N4.2 recommended — Order: 21
- [ ] N6.3 — Render pipeline: produce clickable-looking inline tokens (no navigation yet) (Est: 1d) — Urg: P2 — Deps: N6.1, N6.2 — Order: 22
- [ ] N7.2 — Click handler: navigate to card (open/highlight) (Est: 1d) — Urg: P2 — Deps: N6.3, N7.1 — Order: 23
- [ ] N8.2 — Search service: accept dataset scope & merge results (Est: 1d) — Urg: P2 — Deps: N8.1 — Order: 24
- [ ] N8.3 — Search performance: debounce, limit/paginate multi-dataset queries (Est: 1d) — Urg: P2 — Deps: N8.2, Q3 profiling — Order: 25
- [ ] Q3.3 — Implement incremental dataset-switch improvements (virtualize, memoize) (Est: 1–2d) — Urg: P2 — Deps: Q3.2 (profiling) — Order: 26
- [ ] Q3.2 — Measure hotspots with flamegraphs & profiling (Est: 1d) — Urg: P2 — Deps: Q3.1 — Order: 27

---

## Large tasks (L)
- [ ] N4 — Extensions page full (list view, safe mode, controls) broken into smaller PRs (aggregate Est: 4–5d) — Urg: P1 — Deps: N3.1–N3.2, N4.1–N4.4 — Order: 5 (start early)
  - Subtasks recommended: N4.1, N4.2, N4.3, N4.4, N4.5
- [ ] N8 — Global fuzzy search across multiple datasets (aggregate Est: 3–4d) — Urg: P2 — Deps: N8.1–N8.4, Q3 perf tuning, N1 (if tags indexed) — Order: 28
  - Subtasks recommended: N8.1–N8.4
- [ ] N7.3 — UX for missing-linked-cards: create or search modal (Est: 1d) — Urg: P2 — Deps: N7.2 — Order: 29
- [ ] Q5.4 — Toast accessibility: ARIA live region, keyboard close, a11y tests (Est: 1d) — Urg: P2 — Deps: Q5.1–Q5.3 — Order: 30

---

## Recommended implementation sequence (concise)
1. N1.1 (tags schema)  
2. N3.1 (mods metadata shape)  
3. N3.2 (persist metadata) + Q5.1 (toast component) — parallelizable
4. N4.1 (extensions route skeleton)  
5. Start N4 aggregate (N4.2 list, N4.3 toggle, N4.4 badges) and N3.3 (show metadata) — get a minimal Extensions page working
6. N1.2 (tags API) → N1.3 (persistence)
7. N2.1 (tag chip) → N2.2 (tag input) → N2.3 (autocomplete) → N2.4 (editor integration)
8. N5.1 (theme registry) → N5.2 (apply logic) → N5.3 (Appearance UI)
9. N6.1 → N6.2 → N6.3 (render links) → N7.1 → N7.2 (click navigation) → N7.3 (missing-card UX)
10. N8.1 (search dropdown) → N8.2 (multi-dataset search) → N8.3 (performance) → N8.4 (result badges/UI)
11. Q3.1 (benchmark harness) → Q3.2 (profiling) → Q3.3 (optimizations) → Q3.4 (metrics in devMode)
12. Q5.2 → Q5.3 → Q5.4 (toast API, integration, accessibility)
13. Final polish: tests, docs (README, release notes), ensure 80%+ test coverage and no regressions.

Notes about parallelism and risk
- Many S tasks are independent and safe to land early; do them in small PRs.
- Prioritize P1 items (N1.*, N3.*, N4.*) in the first sprint. These are core infra and required for extensions + tags.
- N4 is large but can be delivered incrementally (route → list → toggle → badges → safe mode).
- Performance tasks (Q3, N8 performance) rely on measurement first; do profiling before heavy optimization.

If you'd like, I can now:
- convert each checklist item into GitHub issues (one per item) and draft titles/descriptions, or
- produce a single milestone + issue templates and a suggested two-week sprint split.

What should I do next?