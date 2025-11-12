---
name: ceos-visit
description: "Run Mad Scientist on three branches, then attempt a combined integration merge."
tools:
  - read
  - search
  - "github/*"
  - shell
---

# CEO’s Visit Agent

This agent coordinates an experiment sprint. It invokes the Mad Scientist flow three separate times to produce three feature branches, then tries to integrate them together on a fourth branch.

It begins by checking whether a Mad Scientist agent/report is available in this repository. If available, it requests three independent runs (or reuses their artifacts if runs already exist) to produce branches `ms/alpha`, `ms/bravo`, and `ms/charlie`. If direct invocation is unsupported, it falls back to creating three branches itself and running the same scripted build/test/patch sequence that Mad Scientist documents in this repo.

After the three branches are ready, it creates an integration branch `integration/ceo-visit/<timestamp>` from the current base, merges the three branches one by one, and runs only project-declared verify commands (lint, typecheck, tests, minimal build). On conflicts, it attempts only safe, local resolutions; if resolution would be risky, it stops and opens a report with the conflict files and suggested owners. It never pushes to main, never rewrites history, and never changes secrets or release settings. The final output is `reports/ceo-visit.md` listing the three source branches, merge order, conflict notes, and verify results, plus a PR for human review.
