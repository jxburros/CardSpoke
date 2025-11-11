# CardSpoke — Road Map V2
*(Updated with Pre-1.0 and Post-1.0 Feature Expansions)*

---

## 🧭 Project Overview

**CardSpoke** is a lightweight, extensible, multi-platform knowledge base framework that combines hierarchical notes (“cards”), modular extensions (“mods”), and local-first data design.

Its long-term goal is to be:
- **A creative platform** for projects, stories, and experiments.
- **A modding base** for themes, patches, and expansions.
- **A learning environment** for new developers exploring “vibe-code.”

---

## 🎯 Core Philosophy
- **Lightweight:** prioritize clarity, speed, and minimalism.
- **Portable:** user data lives locally and exports easily.
- **Extendable:** every feature should be mod-ready.
- **Readable:** human-understandable schema and code.
- **Educational:** easy to learn, modify, and fork.

---

## 🔢 Version Overview

| Version | Focus | Key Additions |
|--------:|:------|:--------------|
| **0.7.x** | Foundation Overhaul | UI redesign, schema v4, documentation & structure |
| **0.8.x** | Capacitor Migration | Standalone builds, cross-platform support, filesystem access |
| **0.9.x** | Dataset Architecture | Multi-dataset system, local storage, PINs |
| **0.10.x** | Extensions Framework | Mod/Theme Manager, tagging, search, internal linking |
| **0.11.x** | Developer Ecosystem | Wizard, Playground, Utilities, Developer Mode |
| **0.12.x** | Safety & Governance | Mod safety, Rewind, Deviations, Info panels |
| **0.13.x** | UX Polish & Undo | Undo buffer, optimization, visual polish |
| **0.14.x** | Documentation & Open Source Prep | Docs, templates, onboarding |
| **1.0.0** | Stable Platform | Complete, portable, and extensible release |

---

## ⚙️ Version Details

### v0.7 — Foundation Overhaul
**Focus:** stability, structure, and clarity.

**Goals**
- Complete **Ultra-Light UI redesign**.
- Upgrade to **Schema v4** (tag/meta-ready, mod taxonomy).
- Clean up and document **core codebase**.
- Write **developer-facing READMEs** and **AI resource files**.

**Deliverables**
- Unified design tokens (color, spacing, typography).
- Consistent, accessible components and responsive layout.
- Mod type taxonomy: `Theme`, `Patch`, `Plugin`, `Mod`, `Expansion`.
- File/folder structure refactor (UI, core, data).
- Inline comments, code signatures, and developer documentation.
- Resource folder for AI instructions, JSON schemas, and training prompts.

**Outcome**
> A stable, elegant, and well-documented foundation ready for cross-platform deployment.

---

### v0.8 — Capacitor Migration & Platform Integration
**Focus:** cross-platform independence and native access.

**Goals**
- Transition from browser-only to **Capacitor** framework.
- Enable standalone builds for **Web**, **Desktop**, **Android**, and **iOS**.
- Implement native file operations and permissions.

**Deliverables**
- Capacitor project setup and packaging scripts.
- Shared codebase (TypeScript/HTML/JS).
- Bridge modules for file picker, folder chooser, and export.
- Migration from IndexedDB to Capacitor Storage fallback.
- App manifest, splash, and icons for all platforms.
- Testing on Android and Desktop builds.

**Outcome**
> CIB runs as a native-capable standalone app with deeper local integration.

---

### v0.9 — Dataset Architecture
**Focus:** multi-dataset support and portable local storage.

**Goals**
- Multiple datasets with independent storage drivers.
- On-device storage choice: IndexedDB or local file/folder.
- Optional PIN per dataset.
- Dataset Info Panel (storage type, size, PIN status).

**Deliverables**
- `StorageDriver` interface:
  ```ts
  interface StorageDriver {
    kind: 'indexeddb' | 'localfile';
    init(cfg: any): Promise<void>;
    get(key: string): Promise<any>;
    set(key: string, val: any): Promise<void>;
    list(prefix?: string): Promise<string[]>;
    remove(key: string): Promise<void>;
    backup?(): Promise<Blob>;
  }
  ```
- Dataset registry and switcher in UI.
- PIN gate (PBKDF2/scrypt, portable in exports).
- Info panel with dataset stats and export shortcuts.

**Outcome**
> Local, modular, and secure data architecture.

---

### v0.10 — Extensions Framework
**Focus:** centralized control for mods, themes, and tagging.

**Goals**
- Launch **Extensions & Theme Manager**.
- Add **Tagging**, **Global Search**, and **Internal Link Backbone**.
- Introduce mod-aware toasts/logs.

**Deliverables**
- **Extensions Page**: enable/disable checkboxes, order, type badges, Safe Mode.
- **Theme Manager** under Appearance.
- Tag chips, filters, and metadata fields.
- Global search across datasets (with tag/dataset filters).
- Internal link recognition for `[[Card Name]]`.
- Toasts for mod load events, warnings, and errors.

**Outcome**
> Unified extension management with search, tags, and linking support.

---

### v0.11 — Developer Ecosystem
**Focus:** empower creators to build and test mods safely.

**Goals**
- Build **Extension Wizard** and **Playground**.
- Provide **CIB.utils** helper library.
- Add **Persistent Mod Data Registry** and **Developer Mode** toggle.

**Deliverables**
- Wizard: select type → scaffold manifest + skeleton code.
- Playground: sandboxed editor, logs, live reload, error boundary.
- `CIB.utils` API:
  ```ts
  createCard(data: Partial<Card>): Promise<Card>;
  updateCard(id: string, changes: Partial<Card>): Promise<void>;
  addTag(id: string, tag: string): Promise<void>;
  getDatasetMeta(): DatasetMeta;
  showToast(message: string, type?: 'info'|'warn'|'error'): void;
  ```
- Persistent mod data registry (`store.modsData['mod@ver']`).
- Developer Mode: verbose logs and unrestricted testing.

**Outcome**
> Safe, well-documented developer tools and learning environment.

---

### v0.12 — Safety & Governance
**Focus:** mod reliability and dataset transparency.

**Goals**
- Implement **Mod Safety Layer** and error isolation.
- Add **Deviation Metadata** and **Rewind Snapshots**.
- Expand **Dataset Info Panel**.

**Deliverables**
- Capability enforcement (`ui`, `data`, `network`).
- Hook timeouts and failure logs.
- Health Panel with mod diagnostics.
- Deviation metadata in exports:
  ```json
  {
    "deviation": { "baseVersion": "0.11.0", "author": "User", "purpose": "Fork" }
  }
  ```
- Rewind with preview and restore.

**Outcome**
> Secure, auditable, and reversible datasets and mods.

---

### v0.13 — UX Polish & Undo
**Focus:** refinement, recovery, and performance.

**Goals**
- Add **Undo/Redo** buffer.
- Optimize rendering for large datasets.
- Refine animations, shortcuts, and visual cues.

**Deliverables**
- In-memory undo system.
- Virtualized card list for 10k+ entries.
- Command Palette improvements.
- Micro-animations for actions and transitions.

**Outcome**
> Smooth, responsive, and forgiving user experience.

---

### v0.14 — Documentation & Open Source Prep
**Focus:** community and contributor readiness.

**Goals**
- Finalize internal and public documentation.
- Provide templates and examples for modders.
- Prepare for open-source release.

**Deliverables**
- In-app Help/Docs section.
- Example dataset and tutorial mod pack.
- CONTRIBUTING.md, CODE_OF_CONDUCT.md, API Reference.
- AI prompt and signature resource files finalized.

**Outcome**
> A transparent, teachable, and open community platform.

---

### 1.0.0 — Stable Platform
**Includes**
- Ultra-Light UI & schema v4
- Capacitor multi-platform builds
- Multi-dataset with on-device storage and PINs
- Tagging, search, and internal link backbone
- Extensions & Theme Manager
- Wizard, Playground, Utilities, Developer Mode
- Mod Safety Layer + Rewind & Deviations
- Undo, performance optimization, and polish
- Full documentation and templates

**Post-1.0 Outlook**

### Priority Features (Before v2.0)

**Card Layout Options**
- Alternative card display modes (compact, expanded, list view)
- Grid view for root cards
- Timeline view for chronological content

**Typography Presets**
- Multiple "reading modes" with different font sizes and line heights
- Dyslexia-friendly font options

**Card Duplication & Cloning**
- One-click card duplication
- Clone with or without children

**Batch Operations**
- Multi-select cards for bulk actions
- Batch delete, move, or tag
- Bulk export selected cards

**Card Relationships**
- Bi-directional links (backlinks)
- Related cards suggestions
- Reference/citation system

**Rich Text Formatting**
- Basic markdown support (bold, italic, lists, headers)
- Code block syntax highlighting
- Block quotes and callouts
- Maintained through minimal, accessible markup

**Version History**
- Track changes to individual cards
- View previous versions
- Restore previous content

**Fuzzy Search**
- More forgiving search with typo tolerance
- Search-as-you-type with instant results
- Search within specific card subtrees

**Recent Cards History**
- Track recently viewed/edited cards
- Quick access to work-in-progress
- Session history

**Bookmarks/Favorites**
- Star important cards for quick access
- Multiple bookmark collections
- Bookmark sidebar or dedicated page

**Encrypted Card Content**
- Optional encryption for sensitive cards
- Per-card or per-subtree encryption
- Separate from dataset PIN

**Additional Import Formats**
- Markdown (.md) import
- HTML import with structure parsing
- CSV import for structured data
- PDF text extraction

**API for External Tools**
- REST API for programmatic access
- Webhook support for integrations
- Command-line interface (CLI) tool

**Mobile-Optimized Interface**
- Touch-friendly card manipulation
- Swipe gestures for navigation
- Mobile-specific layouts

**High Contrast Mode**
- Ultra-high contrast option beyond dark mode
- Meets WCAG AAA standards
- Toggle for vision accessibility

**Auto-Save Indicators**
- More detailed save status
- Save conflict resolution
- Manual save override option

**Categories**
- Similar to Cards, but with restriction on content
- Framework for future extensions

### Advanced Features (v2.0+)

**Advanced Export Options**
- Export to Markdown with hierarchy
- Export to static HTML site
- Export to PDF with formatting
- Export as Obsidian vault
- Export as Notion import file

**Mod Marketplace/Gallery**
- Curated mod directory
- In-app mod browser
- Mod ratings and reviews
- One-click mod installation from gallery

**Mod Dependency System**
- Mods can depend on other mods
- Automatic dependency resolution
- Version compatibility checking

**Scripting Console**
- In-app JavaScript console for power users
- Execute scripts against card data
- Batch transformations
- Data exploration

**Drag and Drop Reordering**
- Drag cards to reorder
- Drag to change parent/hierarchy
- Visual feedback during drag

**Card Archiving**
- Archive cards instead of delete
- Archive view/management
- Restore archived cards

**Smart Tags**
- Auto-suggested tags based on content
- Tag hierarchies (parent/child tags)
- Tag colors and icons

### Infrastructure & Core Improvements
- Cloud/off-device sync (HTTP/WebDAV/S3)
- Worker sandbox for mods
- AI plugin architecture
- Collaboration & shared datasets

---

## 🧩 Schema v4 Snapshot
*(Introduced in v0.7)*

```ts
type DatasetMeta = {
  id: string;
  name: string;
  storage: { driver: 'indexeddb'|'localfile'; config: Record<string,any> };
  pin?: { algo: 'pbkdf2'|'scrypt'; salt: string; hash: string; iterations: number };
  deviation?: { baseVersion?: string; author?: string; purpose?: string };
  createdAt: number;
  updatedAt: number;
};

type Card = {
  id: string;
  title: string;
  body: string;
  parentId: string | null;
  children: string[];
  tags: string[];
  meta?: Record<String, any>;
  attributes?: Record<string, any>;
  modsData?: Record<string, any>;
};
```

---

## ✅ 1.0 “Gold Standard” Checklist
- [x] Schema v4 and organized codebase
- [x] Capacitor multi-platform builds
- [x] Multi-dataset local storage + PIN
- [x] Tagging + search + linking backbone
- [x] Mod & Theme Manager
- [x] Wizard, Playground, Utilities, Developer Mode
- [x] Mod safety, Rewind, and Deviations
- [x] Undo + optimized performance
- [x] Documentation, examples, and templates

---

**Note:** This is Road Map V2, which expands on V1 with detailed feature planning for pre-1.0 and post-1.0 development. See the separate "Extension Features.md" document for features planned as optional extensions.
