# 🃏 Project Objectives — CardSpoke (v1)

**Created by:** jxburros  
**Updated by:** ChatGPT (GPT-5)  
**Version:** 1.0  
**Date:** November 11, 2025  

---

## 1. Core Vision
**CardSpoke** is a **modular, local-first, card-based information repository** designed to organize, connect, and preserve ideas, lore, and creative data.  
It functions as both a **framework** and a **creative tool** — a foundation for building personal universes, story systems, or structured knowledge bases.  
Every user controls their data, their structure, and their experience.

---

## 2. Core Objectives

### 2.1. Information Architecture
- Build a **nested card system** that allows users to create, edit, and organize information through hierarchies of connected “cards.”  
- Support **parent–child relationships**, **tags**, and **cross-links** between cards.  
- Enable **multiple instances**, allowing separate data collections (projects, worlds, or databases).  
- Include **search and filtering** features with tag-based and alphabetical sorting.

---

### 2.2. Storage & Data Ownership
- Operate **entirely offline by default**, ensuring privacy and autonomy.  
- Allow users to **save data anywhere on their device**, not just within browser storage.  
- Plan future support for **user logins and optional local-server sync**, enabling users to store or access instances across devices or local networks.  
- Keep all data **user-controlled**, whether local or hosted — with no cloud dependency or external database requirement.  
- Decide later whether server-based functionality will be part of the **core app** or distributed as **Extensions**.

---

### 2.3. Extension & Mod System
CardSpoke is designed around a flexible **Extension Framework**.  
Extensions allow users to modify, enhance, or personalize their experience without altering the base source code directly.

#### Extension Types
1. **Themes** — Visual or aesthetic changes only (typography, layout spacing, color variations).  
2. **Patches** — Code fixes or quality-of-life improvements that modify functionality *without* altering the underlying source code. Essentially deliverable app updates in removable form.  
3. **Plugins** — Add new tools or functionality that expand user interaction or automation (e.g., tag generators, visualizers, analytics tools).  
4. **Mods** — Change how the app fundamentally behaves or interprets data (e.g., new logic systems, UI restructuring, or behavioral overhauls).  
5. **Kits** — Curated collections of **Themes** and/or **Plugins** packaged together for convenience or stylistic unity.  
6. **Expansions** — Large-scale bundles containing multiple Extension types, including at least one **Patch** or **Mod**, functioning like major content or system overhauls.

#### Deviations
- **Deviations** are **forked versions** of CardSpoke — alternative builds where an Extension or combination of Extensions is hard-coded into the source.  
- Each Deviation carries its own independent versioning, changelog, and identity but retains lineage to the base CardSpoke framework.  
- Deviations can themselves serve as hosts for additional Extensions, enabling layered ecosystems.  
- Official CardSpoke development will maintain a **mainline** and **Legacy Versions**, while community forks (Angled Deviations) may explore alternative directions.

#### Angled Works
- **Angled** refers to any **Extension, Deviation, or Update** created by contributors outside of **jxburros** or his future **Official Team**.  
- Examples: *Angled Mod*, *Angled Kit*, *Angled Deviation*.  
- Angled projects are encouraged, provided they include proper attribution, version tracking, and follow the open documentation standards of CardSpoke.

#### Updates & Patches
- Official **Updates** modify the base app’s source code directly, increasing the core version number.  
- The same improvements may also be released as **Patches** (Extensions) so users can toggle new behavior without altering their local source version.  
- Legacy builds will remain downloadable to preserve historical continuity.

---

### 2.4. Design & UX Principles
- Adhere to a **clean, bold, elegant, easy-to-read, and minimalist** visual language.  
- Prioritize **content over interface** — design should frame, not compete with, information.  
- The **base app** remains **black and white only**, maximizing contrast and clarity.  
- Leverage **typographic scale and weight** for hierarchy and navigation.  
- Maintain **ample white space** and **simple iconography** to ensure focus and calm.  
- Prioritize **usability and legibility** — intuitive for newcomers, efficient for experts.

---

### 2.5. Versioning, Signatures, & Attribution
- Include a transparent **version and signature system** in both UI and source:  
  - Display **creator (jxburros)** and **latest update info** (date, version, AI collaborator).  
  - Increment versions automatically (“.1”, “.2”, etc.) when unspecified.  
  - Maintain an internal **credits list** of all contributing AIs and developers (ChatGPT, Claude, Gemini, Copilot, etc.).  
- Provide **clear update protocols** for all AI collaborators to follow when contributing.  
- Require all **Angled** and **Deviated** works to preserve attribution and visible version lineage.

---

### 2.6. Stability, Transparency & Maintenance
- Guarantee **safe saving, loading, and export** across all instances and mods.  
- Provide **save confirmations**, **error messaging**, and **console logging** for transparency.  
- Remove deprecated systems promptly to maintain clarity and efficiency.  
- Prioritize **readability and modularity** in all code layers.

---

### 2.7. Extensibility & Future Direction
- Keep the **base app extremely lightweight**, acting as a **stable core** for a rich extension ecosystem.  
- Encourage community development through **open APIs** and documentation.  
- Support advanced functionality (e.g., collaboration, visualization, AI assistants) primarily through **Extensions**.  
- Multi-user and networked collaboration will be considered **beyond v1.0**, with modular integration in mind.  
- Integrate optional creative ecosystems (e.g., Emo Slimes lore, RPG data systems) through modular hooks.

---

### 2.8. Collaborative Development & Vibe Coding
- Ensure the entire app and its ecosystem are **thoroughly documented** — from architecture to mod APIs.  
- Provide **developer-facing tools and references** inside the app itself to guide learning and experimentation.  
- Encourage **“vibe coding”** — a creative, intuitive style of exploration where coding is treated as art and play.  
- Lower the barrier of entry for new coders by offering **interactive mod templates**, **editable examples**, and **live testing environments**.  
- Foster a **transparent, collaborative community** of creators who share mods, kits, and deviations while respecting lineage and credit.

---

## 3. Aesthetic & Creative Direction
- Embrace a **neutral, modern, typographic aesthetic** influenced by **Figma**, **Apple Human Interface**, and **Swiss design**.  
- Reflect **jxburros’ identity** — structured, expressive, and deliberate.  
- Primary fonts: **Inter** and **Outfit**.  
- No gradients, emojis, or decorative clutter — content and typography carry the tone.  
- Let simplicity be the brand’s signature.

---

## 4. Guiding Principles
1. **Simplicity:** Elegant design serves content, not itself.  
2. **User Ownership:** All data belongs fully to the user.  
3. **Transparency:** Every process and contributor is visible.  
4. **Longevity:** Code and data should survive years of iteration.  
5. **Extensibility:** Growth should come through Extensions, not bloat.  
6. **Creativity:** Encourage curiosity and vibe coding through open, playful design.  
7. **Integrity:** Signatures, versioning, and attribution ensure creative honesty.  
8. **Community:** Angled works are celebrated as part of CardSpoke’s living ecosystem.

---

**Documentation Standard:**  
All CardSpoke documentation must include: *Creator*, *Last Updated By*, *Version*, and *Date*.  
If not created by **jxburros** or the **Official Team**, mark it as **Angled** in the document header.

