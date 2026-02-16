# CardSpoke Specification v1.0 (AI-Optimized Edition)
**Purpose:** Define the philosophy, rules, structure, licensing, and ecosystem of **CardSpoke** for use by humans and AI systems.
**Audience:** Developers, plugin creators, Deviators (fork creators), community moderators, automated agents.

---

## 1. Summary
- **CardSpoke** is a lightweight, card-based information system that presents knowledge in hierarchical, tiered structures.
- It is **free to use**, owned by **JX Holdings, LLC**, and intentionally **malleable**, with a built-in **Plugin System**.
- Users own their data; CardSpoke does **not** host or collect data except voluntary submissions.
- The ecosystem allows **Plugins**, **Deviations**, and **community contributions** with required credit, versioning, and transparency.

---

## 2. Core Philosophy

### 2.1 Lightweight by Design
- The core app remains minimal.
- Missing features may be intentional to preserve performance and clarity.

### 2.2 User Ownership
- Data is local by default (LocalStorage / IndexedDB).
- Optional cloud/file integrations are supported through user-configured storage drivers (e.g., WebDAV/Google Drive/OneDrive/Local File).
- CardSpoke will not host or collect user data.

### 2.3 Mod-Friendly Architecture
- The app is intentionally built to support mods across three layers: Theme, Feature, and App.
- Low barriers for beginners; high ceilings for advanced developers.

### 2.4 Community Ecosystem
- Community builds on the core through mods and Deviations.
- CardSpoke remains free; community creators may monetize their work.

### 2.5 Accountability & Transparency
All Angled content requires:
- Version number
- Creator identity
- AI assistants used
- Changelog
- Clear distinction between **official** and **angled** (community) content

---

## 3. Ownership & Licensing Model

### 3.1 CardSpoke Core
- Owned by **JX Holdings, LLC**.
- Free to use.
- Source code may be open for modification and distribution.
- "CardSpoke" name and branding may not be reused for forks or remixes.

### 3.2 Community Rights
Creators may:
- Make **Plugins**
- Make **Deviations** (forks)
- Monetize mods and Deviations
- Release them anywhere

Creators must:
- Provide clear credit to:
  - CardSpoke
  - JX Holdings, LLC
  - Themselves
  - Any AI assistants used
- Avoid implying official endorsement unless granted
- Include mandatory metadata

### 3.3 Liability
JX Holdings is not responsible for:
- Breakage caused by angled content
- Data loss from third-party mods
- Security issues introduced by community content

Compatibility is attempted but not guaranteed.

---

## 4. Plugin System Specification

### 4.1 Overview
**Mod** = Any modular add-on to CardSpoke.
Plugins must declare:
- Layer (theme, feature, or app)
- Version
- Author metadata
- Whether they modify logic, UI, or data structures

### 4.2 Plugin Layers

#### 1. Theme
- Cosmetic only (CSS).
- Changes appearance but not functionality.
- Cannot include JavaScript or overrides.

#### 2. Feature
- Adds new features via CSS and JavaScript.
- Examples: UI panels, keyboard shortcuts, import/export tools, integrations.
- Cannot include overrides.

#### 3. App
- Full capabilities: CSS, JavaScript, and overrides.
- Can rename the app, hide/add menu items, inject custom pages, disable built-in features.
- Represents deep modifications to app behavior.

---

## 5. Deviation Specification
**Deviation** = A fork or derivative build of CardSpoke.

Rules:
- Must not use "CardSpoke" name.
- Must not imply official status unless granted.
- Must include mandatory metadata.
- Monetization permitted.
- Must provide credit.

---

## 6. Update & Versioning Rules

### 6.1 Update Types
- **Update** = Core app changes
- **Mod** = Modular add-ons for extending functionality

### 6.2 Backward Compatibility
- CardSpoke *attempts* backward compatibility.
- Data migrations provided when possible.
- Innovation allowed to supersede legacy constraints.

### 6.3 Schema Versioning
Schema changes must include:
- `schemaVersion` integer
- Migration notes
- Fallback behavior

---

## 7. Storage Model

### 7.1 Local-First
- Default storage is local (LocalStorage, IndexedDB).
- No remote transfer without explicit consent.

### 7.2 Optional Off-Device Storage
- May include integration with:
  - Self-hosted cloud
  - Third-party services
  - Encrypted vaults

### 7.3 No Hosted Data
CardSpoke does *not*:
- Store user data
- Analyze datasets
- Sell information
- Sync automatically

---

## 8. Content Classification (Official Terminology)

- **Official** — Created by JX Holdings
- **Angled** — Community-created
- **Mod** — Any modular addition (theme, feature, or app layer)
- **Theme / Feature / App** — Plugin layers
- **Deviation** — Fork
- **Schema Version** — Data model version
- **Legacy** — Older maintained versions
- **Canon** — Core app + this spec
- **Ultra-Light** — Performance-focused configuration/theme

---

## 9. Community Standards

### 9.1 Quality Expectations
Plugins should:
- Fail safely
- Avoid data corruption
- Provide clear errors
- Avoid harmful/obfuscated behavior
- Document setup & removal

### 9.2 Behavioral Expectations
Creators must:
- Clearly state modifications
- Respect user ownership of data
- Follow metadata and credit rules
- Distinguish angled vs. official

---

## 10. Mandatory Metadata for Plugins & Deviations
Every plugin must include a manifest in the JSON package format:

```json
{
  "id": "my-plugin",
  "manifest": {
    "name": "My Mod",
    "version": "1.0.0",
    "author": "Creator Name",
    "description": "What this plugin does",
    "layer": "theme | feature | app",
    "compatibility": ">=0.16.0"
  },
  "config": {},
  "css": "",
  "js": "",
  "overrides": {},
  "enabled": false
}
```

**All manifest fields (name, version, author, layer) are required.**

---

## 11. Long-Term Vision
CardSpoke aims to be:
- A universal card-based knowledge system
- Adaptable to writing, research, planning, worldbuilding, PKM, design, etc.
- A foundation for community-driven mods and custom builds
- A lightweight app with heavyweight potential
- A durable ecosystem built through mods instead of core bloat

---

## 12. Use Cases
Supported fields include (but are not limited to):
- Knowledge management
- Creative writing
- Research
- RPG and game design
- Personal organization
- Worldbuilding
- Prototyping
- AI-assisted workflows
- Collaborative creativity

---

## 13. Governance & Evolution of This Document
- This specification uses semantic versioning.
- Updates follow:
  - **Major** — Breaking changes
  - **Minor** — Additions
  - **Patch** — Clarifications
- The canonical form of CardSpoke is defined by:
  - The Core App
  - This Specification
  - The Schema Version

---

*End of CardSpoke Specification v1.0*
