(function(global, factory) {
  typeof exports === "object" && typeof module !== "undefined" ? factory(exports) : typeof define === "function" && define.amd ? define(["exports"], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, factory(global.CardSpokeCore = {}));
})(this, (function(exports2) {
  "use strict";
  function uid$1() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
  function cloneCard(card) {
    if (!card) return null;
    let modsData = {};
    if (card.modsData) {
      try {
        modsData = JSON.parse(JSON.stringify(card.modsData));
      } catch (_err) {
        modsData = { ...card.modsData };
      }
    }
    return {
      ...card,
      children: Array.isArray(card.children) ? card.children.slice() : [],
      tags: Array.isArray(card.tags) ? card.tags.slice() : [],
      modsData
    };
  }
  function normalizeCardName(name) {
    if (!name) return "";
    return name.toLowerCase().trim().replace(/\s+/g, " ");
  }
  function parseCardLinks(text) {
    if (!text) return [];
    const regex = /\[\[([^\]]+)\]\]/g;
    const matches = [];
    let m;
    while ((m = regex.exec(text)) !== null) {
      matches.push({
        match: m[0],
        cardName: m[1].trim(),
        startIndex: m.index,
        endIndex: m.index + m[0].length
      });
    }
    return matches;
  }
  function hasCardLink(text, cardName) {
    if (!text || !cardName) return false;
    const links = parseCardLinks(text);
    const normalized = normalizeCardName(cardName);
    return links.some((link) => normalizeCardName(link.cardName) === normalized);
  }
  function extractTags(body) {
    if (!body) return [];
    const matches = body.match(/#\w+/g);
    return matches ? matches.slice(0, 5) : [];
  }
  class Kernel {
    /**
     * Create a new Kernel instance with its own isolated data store.
     * @param {Object} [initialData] - Optional seed data { cards, rootOrder }
     */
    constructor(initialData) {
      this.cards = {};
      this.rootOrder = [];
      if (initialData) {
        if (initialData.cards && typeof initialData.cards === "object") {
          for (const [id, card] of Object.entries(initialData.cards)) {
            this.cards[id] = cloneCard(card);
          }
        }
        if (Array.isArray(initialData.rootOrder)) {
          this.rootOrder = initialData.rootOrder.slice();
        }
      }
    }
    // ── Snapshot / hydration ──────────────────────────────────────────────────
    /**
     * Return a deep-cloned snapshot of the full data store.
     * Safe to serialize or hand to another layer.
     * @returns {{ cards: Object, rootOrder: string[] }}
     */
    snapshot() {
      const cards = {};
      for (const [id, card] of Object.entries(this.cards)) {
        cards[id] = cloneCard(card);
      }
      return { cards, rootOrder: this.rootOrder.slice() };
    }
    /**
     * Replace the entire internal store (e.g. after loading from storage).
     * Deep-clones incoming data.
     * @param {{ cards: Object, rootOrder: string[] }} data
     */
    hydrate(data) {
      this.cards = {};
      this.rootOrder = [];
      if (data.cards && typeof data.cards === "object") {
        for (const [id, card] of Object.entries(data.cards)) {
          this.cards[id] = cloneCard(card);
        }
      }
      if (Array.isArray(data.rootOrder)) {
        this.rootOrder = data.rootOrder.slice();
      }
    }
    // ── Card CRUD ─────────────────────────────────────────────────────────────
    /**
     * Create a new card.
     * @param {string} title
     * @param {string} body
     * @param {string|null} [parentId=null]
     * @returns {{ id: string, card: Object }} The new card (cloned).
     */
    createCard(title, body, parentId = null) {
      const id = uid$1();
      const now = Date.now();
      const card = {
        id,
        title: title || "",
        body: body || "",
        parentId: parentId || null,
        children: [],
        createdAt: now,
        updatedAt: now,
        modsData: {},
        tags: [],
        isRichText: false
      };
      this.cards[id] = card;
      if (!parentId) {
        this.rootOrder.push(id);
      } else {
        const parent = this.cards[parentId];
        if (parent && !parent.children.includes(id)) {
          parent.children.push(id);
        }
      }
      return { id, card: cloneCard(card) };
    }
    /**
     * Update fields on an existing card.
     * @param {string} id
     * @param {Object} updates - Fields to merge onto the card.
     * @returns {{ previousState: Object|null, card: Object|null }} Cloned before/after.
     */
    updateCard(id, updates) {
      const card = this.cards[id];
      if (!card) return { previousState: null, card: null };
      const previousState = cloneCard(card);
      const updateTimestamp = Date.now();
      Object.assign(card, updates, { updatedAt: updateTimestamp });
      return { previousState, card: cloneCard(card) };
    }
    /**
     * Delete a card and all its descendants recursively.
     * @param {string} id
     * @returns {{ deleted: Object[], affectedChildIds: string[] }}
     *   deleted: array of cloned card snapshots (root first, then descendants).
     *   affectedChildIds: flat list of every removed ID (including root).
     */
    deleteCard(id) {
      const deleted = [];
      const affectedChildIds = [];
      const remove = (cardId) => {
        const card = this.cards[cardId];
        if (!card) return;
        deleted.push(cloneCard(card));
        affectedChildIds.push(cardId);
        const children = (card.children || []).slice();
        children.forEach((cid) => remove(cid));
        if (card.parentId) {
          const parent = this.cards[card.parentId];
          if (parent) {
            parent.children = parent.children.filter((c) => c !== cardId);
          }
        } else {
          this.rootOrder = this.rootOrder.filter((c) => c !== cardId);
        }
        delete this.cards[cardId];
      };
      remove(id);
      return { deleted, affectedChildIds };
    }
    /**
     * Retrieve a single card by ID.
     * @param {string} id
     * @returns {Object|null} Cloned card or null.
     */
    getCard(id) {
      return cloneCard(this.cards[id] || null);
    }
    /**
     * Check whether a card exists.
     * @param {string} id
     * @returns {boolean}
     */
    hasCard(id) {
      return id in this.cards;
    }
    /**
     * Return cloned direct children of a card (or root cards if id is null).
     * @param {string|null} parentId
     * @returns {Object[]}
     */
    getChildren(parentId) {
      if (!parentId) {
        return this.rootOrder.map((id) => cloneCard(this.cards[id])).filter(Boolean);
      }
      const parent = this.cards[parentId];
      if (!parent) return [];
      return (parent.children || []).map((id) => cloneCard(this.cards[id])).filter(Boolean);
    }
    /**
     * Return the ancestor chain from a card up to the root (inclusive).
     * @param {string} id
     * @returns {Object[]} Array of cloned cards, nearest parent first.
     */
    getAncestors(id) {
      const ancestors = [];
      let current = this.cards[id];
      while (current && current.parentId) {
        const parent = this.cards[current.parentId];
        if (!parent) break;
        ancestors.push(cloneCard(parent));
        current = parent;
      }
      return ancestors;
    }
    /**
     * Count all cards in the store.
     * @returns {number}
     */
    cardCount() {
      return Object.keys(this.cards).length;
    }
    /**
     * Collect every descendant ID under a card (not including the card itself).
     * @param {string} id
     * @returns {string[]}
     */
    getDescendantIds(id) {
      const ids = [];
      const walk = (cardId) => {
        const card = this.cards[cardId];
        if (!card) return;
        for (const childId of card.children || []) {
          ids.push(childId);
          walk(childId);
        }
      };
      walk(id);
      return ids;
    }
    // ── Hierarchy operations ──────────────────────────────────────────────────
    /**
     * Move a card to a new parent (or to root if newParentId is null).
     * Prevents moving a card into its own subtree.
     * @param {string} id
     * @param {string|null} newParentId
     * @returns {{ success: boolean, previousParentId: string|null }}
     */
    reparent(id, newParentId) {
      const card = this.cards[id];
      if (!card) return { success: false, previousParentId: null };
      if (newParentId) {
        const descendantIds = this.getDescendantIds(id);
        if (descendantIds.includes(newParentId) || newParentId === id) {
          return { success: false, previousParentId: card.parentId };
        }
      }
      const previousParentId = card.parentId;
      if (card.parentId) {
        const oldParent = this.cards[card.parentId];
        if (oldParent) {
          oldParent.children = oldParent.children.filter((c) => c !== id);
        }
      } else {
        this.rootOrder = this.rootOrder.filter((c) => c !== id);
      }
      card.parentId = newParentId || null;
      if (newParentId) {
        const newParent = this.cards[newParentId];
        if (newParent && !newParent.children.includes(id)) {
          newParent.children.push(id);
        }
      } else {
        if (!this.rootOrder.includes(id)) {
          this.rootOrder.push(id);
        }
      }
      card.updatedAt = Date.now();
      return { success: true, previousParentId };
    }
    /**
     * Reorder a card within its sibling list.
     * @param {string} id
     * @param {number} newIndex - Target index in the sibling array.
     * @returns {{ success: boolean, previousIndex: number }}
     */
    reorder(id, newIndex) {
      const card = this.cards[id];
      if (!card) return { success: false, previousIndex: -1 };
      const list = card.parentId ? this.cards[card.parentId] ? this.cards[card.parentId].children : null : this.rootOrder;
      if (!list) return { success: false, previousIndex: -1 };
      const previousIndex = list.indexOf(id);
      if (previousIndex === -1) return { success: false, previousIndex: -1 };
      list.splice(previousIndex, 1);
      const clamped = Math.max(0, Math.min(newIndex, list.length));
      list.splice(clamped, 0, id);
      return { success: true, previousIndex };
    }
    /**
     * Duplicate a card (and optionally its entire subtree).
     * @param {string} id
     * @param {boolean} [withChildren=false]
     * @returns {{ newId: string|null, allNewIds: string[] }} IDs of created cards.
     */
    duplicateHierarchy(id, withChildren = false) {
      const original = this.cards[id];
      if (!original) return { newId: null, allNewIds: [] };
      const allNewIds = [];
      const dup = (sourceId, targetParentId) => {
        const src = this.cards[sourceId];
        if (!src) return null;
        const newId2 = uid$1();
        const now = Date.now();
        this.cards[newId2] = {
          ...cloneCard(src),
          id: newId2,
          parentId: targetParentId,
          children: [],
          title: targetParentId === (original.parentId || null) && sourceId === id ? (src.title || "Untitled") + " (Copy)" : src.title || "",
          createdAt: now,
          updatedAt: now
        };
        allNewIds.push(newId2);
        if (targetParentId) {
          const parent = this.cards[targetParentId];
          if (parent && !parent.children.includes(newId2)) {
            parent.children.push(newId2);
          }
        } else {
          this.rootOrder.push(newId2);
        }
        if (withChildren) {
          for (const childId of src.children || []) {
            dup(childId, newId2);
          }
        }
        return newId2;
      };
      const newId = dup(id, original.parentId || null);
      return { newId, allNewIds };
    }
    // ── Tag operations ────────────────────────────────────────────────────────
    /**
     * Get all tags for a card.
     * @param {string} cardId
     * @returns {string[]}
     */
    getTags(cardId) {
      const card = this.cards[cardId];
      if (!card) return [];
      return (card.tags || []).slice();
    }
    /**
     * Add a tag to a card.
     * @param {string} cardId
     * @param {string} tag
     * @returns {boolean} True if the tag was added.
     */
    addTag(cardId, tag) {
      const card = this.cards[cardId];
      if (!card) return false;
      const normalized = tag.replace(/^#/, "").toLowerCase().trim();
      if (!normalized) return false;
      if (!card.tags) card.tags = [];
      if (card.tags.some((t) => t.toLowerCase() === normalized)) return false;
      card.tags.push(normalized);
      card.updatedAt = Date.now();
      return true;
    }
    /**
     * Remove a tag from a card.
     * @param {string} cardId
     * @param {string} tag
     * @returns {boolean} True if the tag was removed.
     */
    removeTag(cardId, tag) {
      const card = this.cards[cardId];
      if (!card || !card.tags) return false;
      const normalized = tag.replace(/^#/, "").toLowerCase().trim();
      const before = card.tags.length;
      card.tags = card.tags.filter((t) => t.toLowerCase() !== normalized);
      if (card.tags.length === before) return false;
      card.updatedAt = Date.now();
      return true;
    }
    /**
     * Replace all tags on a card.
     * @param {string} cardId
     * @param {string[]} tags
     * @returns {boolean}
     */
    setTags(cardId, tags) {
      const card = this.cards[cardId];
      if (!card) return false;
      const normalized = tags.map((t) => t.replace(/^#/, "").toLowerCase().trim()).filter(Boolean);
      card.tags = [...new Set(normalized)];
      card.updatedAt = Date.now();
      return true;
    }
    /**
     * Collect every unique tag across all cards.
     * @returns {string[]}
     */
    getAllTags() {
      const all = /* @__PURE__ */ new Set();
      for (const card of Object.values(this.cards)) {
        if (card.tags) card.tags.forEach((t) => all.add(t));
      }
      return Array.from(all).sort();
    }
    // ── Query helpers ─────────────────────────────────────────────────────────
    /**
     * Find a card by its title (case-insensitive, whitespace-normalized).
     * @param {string} cardName
     * @returns {string|null} Card ID or null.
     */
    findCardByName(cardName) {
      if (!cardName) return null;
      const normalized = normalizeCardName(cardName);
      for (const [id, card] of Object.entries(this.cards)) {
        if (normalizeCardName(card.title) === normalized) return id;
      }
      return null;
    }
    /**
     * Find all cards matching a name (exact or partial).
     * @param {string} cardName
     * @param {boolean} [exactMatch=true]
     * @returns {Array<{id: string, title: string, similarity: number}>}
     */
    findCardsByName(cardName, exactMatch = true) {
      if (!cardName) return [];
      const normalized = normalizeCardName(cardName);
      const results = [];
      for (const [id, card] of Object.entries(this.cards)) {
        const nt = normalizeCardName(card.title);
        if (exactMatch) {
          if (nt === normalized) {
            results.push({ id, title: card.title, similarity: 1 });
          }
        } else if (nt.includes(normalized)) {
          const similarity = Math.min(normalized.length, nt.length) / Math.max(normalized.length, nt.length);
          results.push({ id, title: card.title, similarity });
        }
      }
      results.sort((a, b) => b.similarity - a.similarity);
      return results;
    }
    /**
     * Resolve all [[Card Name]] links in text to card IDs.
     * @param {string} text
     * @returns {Array<{link: Object, cardId: string|null}>}
     */
    resolveCardLinks(text) {
      const links = parseCardLinks(text);
      return links.map((link) => ({
        link,
        cardId: this.findCardByName(link.cardName)
      }));
    }
    /**
     * Get all cards that link to a given card via [[Title]] references.
     * @param {string} cardId
     * @returns {Array<{id: string, title: string}>}
     */
    getBacklinks(cardId) {
      const card = this.cards[cardId];
      if (!card || !card.title) return [];
      const backlinks = [];
      for (const [id, other] of Object.entries(this.cards)) {
        if (id === cardId) continue;
        if (other.body && hasCardLink(other.body, card.title)) {
          backlinks.push({ id: other.id, title: other.title || "(Untitled)" });
        }
      }
      return backlinks;
    }
    /**
     * Get related cards based on shared tags.
     * @param {string} cardId
     * @param {number} [limit=10]
     * @returns {Array<{id: string, title: string, matchScore: number, matchedTags: string[]}>}
     */
    getRelatedCards(cardId, limit = 10) {
      const card = this.cards[cardId];
      if (!card) return [];
      const cardTags = this.getTags(cardId);
      if (cardTags.length === 0) return [];
      const related = [];
      for (const [id, other] of Object.entries(this.cards)) {
        if (id === cardId) continue;
        const otherTags = this.getTags(id);
        const matchedTags = cardTags.filter((t) => otherTags.includes(t));
        if (matchedTags.length > 0) {
          related.push({
            id: other.id,
            title: other.title || "(Untitled)",
            matchScore: matchedTags.length / Math.max(cardTags.length, otherTags.length),
            matchedTags
          });
        }
      }
      related.sort((a, b) => b.matchScore - a.matchScore);
      return related.slice(0, limit);
    }
  }
  const GENERIC_KIND = "generic";
  const KIND_DEFINITIONS = {
    note: {
      payloadKey: "note",
      schemaVersion: 1,
      defaults: () => ({ pinned: false })
    },
    repository_page: {
      payloadKey: "repositoryPage",
      schemaVersion: 1,
      defaults: () => ({ section: "", source: "user", status: "draft" })
    },
    project: {
      payloadKey: "project",
      schemaVersion: 1,
      defaults: () => ({ status: "active", priority: "medium", dueDate: null })
    },
    task: {
      payloadKey: "task",
      schemaVersion: 1,
      defaults: () => ({ status: "todo", priority: "medium", dueDate: null, completed: false })
    },
    deck: {
      payloadKey: "deck",
      schemaVersion: 1,
      defaults: () => ({ theme: "default", aspectRatio: "16:9" })
    },
    slide: {
      payloadKey: "slide",
      schemaVersion: 1,
      defaults: () => ({ layout: "title-bullets", speakerNotes: "", order: 0 })
    },
    contact: {
      payloadKey: "contact",
      schemaVersion: 1,
      defaults: () => ({
        displayName: "",
        email: "",
        phone: "",
        organization: "",
        relationship: "",
        trackingEnabled: false
      })
    },
    plant: {
      payloadKey: "plant",
      schemaVersion: 1,
      defaults: () => ({
        species: "",
        location: "",
        trackingEnabled: false,
        wateringIntervalDays: null,
        lastWatered: null,
        lastFertilized: null
      })
    },
    care_log: {
      payloadKey: "careLog",
      schemaVersion: 1,
      defaults: () => ({ targetCardId: null, careType: "water", performedAt: null, notes: "" })
    },
    reminder: {
      payloadKey: "reminder",
      schemaVersion: 1,
      defaults: () => ({
        targetCardId: null,
        type: "general",
        dueAt: null,
        repeat: null,
        status: "scheduled"
      })
    },
    collection: {
      payloadKey: "collection",
      schemaVersion: 1,
      defaults: () => ({ filter: {}, sort: null })
    }
  };
  const CARD_KINDS = Object.freeze(Object.keys(KIND_DEFINITIONS));
  function isKnownKind(kind) {
    return typeof kind === "string" && Object.prototype.hasOwnProperty.call(KIND_DEFINITIONS, kind);
  }
  function getKindPayloadKey(kind) {
    const def = KIND_DEFINITIONS[kind];
    return def ? def.payloadKey : String(kind);
  }
  function getCardKind(card) {
    if (!card || !card.modsData || typeof card.modsData !== "object") return GENERIC_KIND;
    const kind = card.modsData.kind;
    return typeof kind === "string" && kind ? kind : GENERIC_KIND;
  }
  function isCardKind(card, kind) {
    return getCardKind(card) === kind;
  }
  function setCardKind(card, kind, payload = {}) {
    if (!card || typeof kind !== "string" || !kind) return card;
    if (!card.modsData || typeof card.modsData !== "object") card.modsData = {};
    const def = KIND_DEFINITIONS[kind];
    const key = getKindPayloadKey(kind);
    const base = def ? def.defaults() : {};
    const existing = card.modsData[key] && typeof card.modsData[key] === "object" ? card.modsData[key] : {};
    card.modsData.kind = kind;
    card.modsData.schemaVersion = def ? def.schemaVersion : card.modsData.schemaVersion || 1;
    card.modsData[key] = { ...base, ...existing, ...payload };
    return card;
  }
  function getKindData(card, kind) {
    if (!card || !card.modsData || typeof card.modsData !== "object") return null;
    const k = kind || getCardKind(card);
    if (k === GENERIC_KIND) return null;
    const data = card.modsData[getKindPayloadKey(k)];
    return data && typeof data === "object" ? data : null;
  }
  function updateKindData(card, kind, updates) {
    if (!card || !isCardKind(card, kind)) return card;
    const key = getKindPayloadKey(kind);
    const def = KIND_DEFINITIONS[kind];
    const existing = card.modsData[key] && typeof card.modsData[key] === "object" ? card.modsData[key] : def ? def.defaults() : {};
    card.modsData[key] = { ...existing, ...updates || {} };
    return card;
  }
  function validateTypedCard(card) {
    const warnings = [];
    if (!card || typeof card !== "object") {
      return { valid: false, kind: GENERIC_KIND, known: false, warnings: ["Card is not an object"] };
    }
    const kind = getCardKind(card);
    if (kind === GENERIC_KIND) {
      return { valid: true, kind, known: false, warnings };
    }
    const mods = card.modsData;
    const known = isKnownKind(kind);
    if (!known) {
      warnings.push(`Unknown card kind "${kind}" — metadata preserved as-is`);
    }
    if (mods.schemaVersion !== void 0 && typeof mods.schemaVersion !== "number") {
      warnings.push(`modsData.schemaVersion should be a number (got ${typeof mods.schemaVersion})`);
    }
    const key = getKindPayloadKey(kind);
    const payload = mods[key];
    if (payload !== void 0 && (payload === null || typeof payload !== "object" || Array.isArray(payload))) {
      warnings.push(`modsData.${key} should be an object (got ${payload === null ? "null" : Array.isArray(payload) ? "array" : typeof payload})`);
    }
    return { valid: true, kind, known, warnings };
  }
  function migrateTypedCard$1(card, options = {}) {
    const warnings = [];
    if (!card || typeof card !== "object") return { card, changed: false, warnings };
    const kind = getCardKind(card);
    if (kind === GENERIC_KIND || !isKnownKind(kind)) {
      return { card, changed: false, warnings };
    }
    const def = KIND_DEFINITIONS[kind];
    const key = def.payloadKey;
    const mods = card.modsData;
    let changed = false;
    const fromVersion = typeof mods.schemaVersion === "number" ? mods.schemaVersion : 1;
    const defaults = def.defaults();
    const payload = mods[key] && typeof mods[key] === "object" && !Array.isArray(mods[key]) ? mods[key] : {};
    if (mods[key] !== payload) {
      if (mods[key] !== void 0) {
        warnings.push(`Replaced malformed modsData.${key} with defaults (original preserved under modsData.${key}__invalid)`);
        mods[`${key}__invalid`] = mods[key];
      }
      mods[key] = payload;
      changed = true;
    }
    for (const [field, value] of Object.entries(defaults)) {
      if (!(field in payload)) {
        payload[field] = value;
        changed = true;
      }
    }
    if (fromVersion < def.schemaVersion && typeof options.migrateKindData === "function") {
      try {
        const migrated = options.migrateKindData(kind, payload, fromVersion, def.schemaVersion);
        if (migrated && typeof migrated === "object") {
          mods[key] = migrated;
          changed = true;
        }
      } catch (err) {
        warnings.push(`Kind data migration failed for "${kind}": ${err && err.message}`);
      }
    }
    if (mods.schemaVersion !== def.schemaVersion) {
      mods.schemaVersion = def.schemaVersion;
      changed = true;
    }
    return { card, changed, warnings };
  }
  function listCardsByKind(store, kind) {
    if (!store || !store.cards || typeof store.cards !== "object") return [];
    return Object.values(store.cards).filter((card) => isCardKind(card, kind));
  }
  function listChildrenByKind(store, parentId, kind) {
    if (!store || !store.cards || typeof store.cards !== "object") return [];
    let childIds;
    if (!parentId) {
      childIds = Array.isArray(store.rootOrder) ? store.rootOrder : [];
    } else {
      const parent = store.cards[parentId];
      childIds = parent && Array.isArray(parent.children) ? parent.children : [];
    }
    return childIds.map((id) => store.cards[id]).filter((card) => card && isCardKind(card, kind));
  }
  function createTypedModsData(kind, payload = {}) {
    const def = KIND_DEFINITIONS[kind];
    const key = getKindPayloadKey(kind);
    return {
      kind,
      schemaVersion: def ? def.schemaVersion : 1,
      [key]: { ...def ? def.defaults() : {}, ...payload }
    };
  }
  function listRootCardsByKind(store, kind) {
    if (!store || !store.cards) return [];
    const rootOrder = Array.isArray(store.rootOrder) ? store.rootOrder : [];
    return rootOrder.map((id) => store.cards[id]).filter((card) => card && !card.parentId && isCardKind(card, kind));
  }
  function findCardsByKindAndTag(store, kind, tag) {
    if (!store || !store.cards || !tag) return [];
    const normalized = String(tag).replace(/^#/, "").toLowerCase().trim();
    return Object.values(store.cards).filter(
      (card) => isCardKind(card, kind) && Array.isArray(card.tags) && card.tags.some((t) => String(t).toLowerCase() === normalized)
    );
  }
  function parseDueAt(dueAt) {
    if (dueAt == null) return null;
    if (typeof dueAt === "number") return Number.isFinite(dueAt) ? dueAt : null;
    const parsed = Date.parse(dueAt);
    return Number.isNaN(parsed) ? null : parsed;
  }
  function findDueReminders(store, now = Date.now()) {
    if (!store || !store.cards) return [];
    const nowMs = now instanceof Date ? now.getTime() : now;
    return Object.values(store.cards).filter((card) => {
      if (!isCardKind(card, "reminder")) return false;
      const data = getKindData(card, "reminder");
      if (!data || data.status !== "scheduled") return false;
      const dueMs = parseDueAt(data.dueAt);
      return dueMs !== null && dueMs <= nowMs;
    });
  }
  function findTasksDueToday(store, now = Date.now()) {
    if (!store || !store.cards) return [];
    const ref = now instanceof Date ? now : new Date(now);
    const dayStart = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate()).getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1e3;
    return Object.values(store.cards).filter((card) => {
      if (!isCardKind(card, "task")) return false;
      const data = getKindData(card, "task");
      if (!data || data.completed) return false;
      const dueMs = parseDueAt(data.dueDate);
      return dueMs !== null && dueMs >= dayStart && dueMs < dayEnd;
    });
  }
  function findPlantsWithTrackingEnabled(store) {
    if (!store || !store.cards) return [];
    return Object.values(store.cards).filter((card) => {
      if (!isCardKind(card, "plant")) return false;
      const data = getKindData(card, "plant");
      return !!(data && data.trackingEnabled);
    });
  }
  function evaluateCollection(store, collectionCard) {
    if (!store || !store.cards) return [];
    if (!isCardKind(collectionCard, "collection")) return [];
    const data = getKindData(collectionCard, "collection");
    const filter = data && data.filter && typeof data.filter === "object" ? data.filter : {};
    const { kind, tag, ...payloadFields } = filter;
    const normalizedTag = tag ? String(tag).replace(/^#/, "").toLowerCase().trim() : null;
    return Object.values(store.cards).filter((card) => {
      if (collectionCard.id && card.id === collectionCard.id) return false;
      if (kind && getCardKind(card) !== kind) return false;
      if (normalizedTag) {
        const tags = Array.isArray(card.tags) ? card.tags : [];
        if (!tags.some((t) => String(t).toLowerCase() === normalizedTag)) return false;
      }
      const fieldKeys = Object.keys(payloadFields);
      if (fieldKeys.length) {
        const payload = getKindData(card) || {};
        for (const key of fieldKeys) {
          if (payload[key] !== payloadFields[key]) return false;
        }
      }
      return true;
    });
  }
  const kindMigrations = {};
  function registerKindMigration(kind, fromVersion, migrate) {
    if (!kind || typeof migrate !== "function") return;
    if (!kindMigrations[kind]) kindMigrations[kind] = {};
    kindMigrations[kind][fromVersion] = migrate;
  }
  function clearKindMigrations() {
    for (const key of Object.keys(kindMigrations)) delete kindMigrations[key];
  }
  function migrateKindData(kind, data, fromVersion, toVersion) {
    let current = data;
    for (let v = fromVersion; v < toVersion; v++) {
      const step = kindMigrations[kind] && kindMigrations[kind][v];
      if (typeof step === "function") {
        const next = step(current);
        if (next && typeof next === "object") current = next;
      }
    }
    return current;
  }
  function migrateTypedCard(card) {
    return migrateTypedCard$1(card, { migrateKindData });
  }
  function migrateCard(card) {
    if (!card || typeof card !== "object") return { card, changed: false, warnings: [] };
    let changed = false;
    if (!Array.isArray(card.children)) {
      card.children = [];
      changed = true;
    }
    if (!Array.isArray(card.tags)) {
      card.tags = [];
      changed = true;
    }
    if (card.modsData == null || typeof card.modsData !== "object") {
      card.modsData = {};
      changed = true;
    }
    const typed = migrateTypedCard(card);
    return { card, changed: changed || typed.changed, warnings: typed.warnings };
  }
  function migrateStore(store) {
    const warnings = [];
    let changed = false;
    let migratedCount = 0;
    if (!store || !store.cards || typeof store.cards !== "object") {
      return { store, changed, migratedCount, warnings };
    }
    for (const [id, card] of Object.entries(store.cards)) {
      try {
        const result = migrateCard(card);
        if (result.changed) {
          changed = true;
          migratedCount++;
        }
        for (const w of result.warnings) warnings.push(`[${id}] ${w}`);
      } catch (err) {
        warnings.push(`[${id}] Migration failed: ${err && err.message}`);
      }
    }
    return { store, changed, migratedCount, warnings };
  }
  const actions = /* @__PURE__ */ new Map();
  function registerAction(action) {
    if (!action || typeof action.id !== "string" || !action.id) return false;
    if (typeof action.run !== "function") return false;
    actions.set(action.id, {
      icon: null,
      appliesTo: () => true,
      ...action
    });
    return true;
  }
  function unregisterAction(actionId) {
    return actions.delete(actionId);
  }
  function getAction(actionId) {
    return actions.get(actionId) || null;
  }
  function listActions() {
    return Array.from(actions.values());
  }
  function getActionsForCard(card, ctx = {}) {
    return listActions().filter((action) => {
      try {
        return !!action.appliesTo(card, ctx);
      } catch (_err) {
        return false;
      }
    });
  }
  function runAction(actionId, card, ctx = {}) {
    const action = actions.get(actionId);
    if (!action) return { ok: false, error: `Unknown action "${actionId}"` };
    try {
      if (!action.appliesTo(card, ctx)) {
        return { ok: false, error: `Action "${actionId}" does not apply to this card` };
      }
      const result = action.run(card, ctx);
      return { ok: true, result };
    } catch (err) {
      return { ok: false, error: err && err.message || String(err) };
    }
  }
  function clearActions() {
    actions.clear();
  }
  function applyCardChange(card, ctx, mutate) {
    if (ctx && typeof ctx.updateCard === "function") {
      const draft = JSON.parse(JSON.stringify(card));
      mutate(draft);
      ctx.updateCard(card.id, { modsData: draft.modsData });
      return draft;
    }
    const target = ctx && ctx.store && ctx.store.cards && ctx.store.cards[card.id] || card;
    mutate(target);
    return target;
  }
  function registerCoreCardActions(handlers = {}) {
    const defs = [
      { id: "card.edit", label: "Edit", icon: "edit", handler: handlers.edit },
      { id: "card.bookmark", label: "Bookmark", icon: "bookmark", handler: handlers.bookmark },
      { id: "card.duplicate", label: "Duplicate", icon: "copy", handler: handlers.duplicate },
      { id: "card.share", label: "Share", icon: "share", handler: handlers.share },
      { id: "card.addChild", label: "Add Child", icon: "plus", handler: handlers.addChild },
      { id: "card.delete", label: "Delete", icon: "trash", handler: handlers.remove },
      { id: "card.importText", label: "Import TXT", icon: "upload", handler: handlers.importText }
    ];
    for (const def of defs) {
      registerAction({
        id: def.id,
        label: def.label,
        icon: def.icon,
        appliesTo: () => true,
        run: (card, ctx) => typeof def.handler === "function" ? def.handler(card, ctx) : void 0
      });
    }
  }
  function registerTypedCardActions() {
    registerAction({
      id: "task.markDone",
      label: "Mark Done",
      icon: "check",
      appliesTo: (card) => {
        if (getCardKind(card) !== "task") return false;
        const task = getKindData(card, "task");
        return !(task && task.completed);
      },
      run: (card, ctx) => applyCardChange(card, ctx, (c) => {
        updateKindData(c, "task", { completed: true, status: "done" });
      })
    });
    registerAction({
      id: "task.markTodo",
      label: "Mark To-Do",
      icon: "circle",
      appliesTo: (card) => {
        if (getCardKind(card) !== "task") return false;
        const task = getKindData(card, "task");
        return !!(task && task.completed);
      },
      run: (card, ctx) => applyCardChange(card, ctx, (c) => {
        updateKindData(c, "task", { completed: false, status: "todo" });
      })
    });
    registerAction({
      id: "plant.logWatering",
      label: "Log Watering",
      icon: "droplet",
      appliesTo: (card) => getCardKind(card) === "plant",
      run: (card, ctx) => applyCardChange(card, ctx, (c) => {
        updateKindData(c, "plant", { lastWatered: ctx && ctx.now || Date.now() });
      })
    });
    registerAction({
      id: "plant.toggleTracking",
      label: "Toggle Tracking",
      icon: "activity",
      appliesTo: (card) => getCardKind(card) === "plant",
      run: (card, ctx) => applyCardChange(card, ctx, (c) => {
        const plant = getKindData(c, "plant") || {};
        updateKindData(c, "plant", { trackingEnabled: !plant.trackingEnabled });
      })
    });
    const stubs = [
      { id: "note.convertToTask", label: "Convert to Task", icon: "check-square", kind: "note", capability: "convertNoteToTask" },
      { id: "note.convertToSlide", label: "Convert to Slide", icon: "monitor", kind: "note", capability: "convertNoteToSlide" },
      { id: "project.addTask", label: "Add Task", icon: "plus", kind: "project", capability: "addTask" },
      { id: "deck.addSlide", label: "Add Slide", icon: "plus", kind: "deck", capability: "addSlide" },
      { id: "deck.present", label: "Present", icon: "play", kind: "deck", capability: "present" },
      { id: "contact.addNote", label: "Add Note", icon: "file-text", kind: "contact", capability: "addNote" }
    ];
    for (const stub of stubs) {
      registerAction({
        id: stub.id,
        label: stub.label,
        icon: stub.icon,
        appliesTo: (card) => getCardKind(card) === stub.kind,
        run: (card, ctx) => {
          if (ctx && typeof ctx[stub.capability] === "function") {
            return ctx[stub.capability](card, ctx);
          }
          return { stub: true, action: stub.id };
        }
      });
    }
  }
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
  function resolveOps(store, options = {}) {
    const ops = options.ops || {};
    return {
      updateCard: ops.updateCard || ((id, updates) => {
        const card = store.cards[id];
        if (!card) return;
        Object.assign(card, updates, { updatedAt: Date.now() });
      }),
      createCard: ops.createCard || ((title, body, parentId = null) => {
        const id = uid();
        const now = Date.now();
        store.cards[id] = {
          id,
          title: title || "",
          body: body || "",
          parentId: parentId || null,
          children: [],
          tags: [],
          createdAt: now,
          updatedAt: now,
          isRichText: false,
          modsData: {}
        };
        if (parentId && store.cards[parentId]) {
          if (!Array.isArray(store.cards[parentId].children)) store.cards[parentId].children = [];
          if (!store.cards[parentId].children.includes(id)) store.cards[parentId].children.push(id);
        } else if (Array.isArray(store.rootOrder)) {
          store.rootOrder.push(id);
        }
        return id;
      }),
      reparent: ops.reparent || ((id, newParentId) => {
        const card = store.cards[id];
        if (!card) return;
        if (card.parentId && store.cards[card.parentId]) {
          store.cards[card.parentId].children = (store.cards[card.parentId].children || []).filter((c) => c !== id);
        } else if (Array.isArray(store.rootOrder)) {
          store.rootOrder = store.rootOrder.filter((c) => c !== id);
        }
        card.parentId = newParentId || null;
        if (newParentId && store.cards[newParentId]) {
          if (!Array.isArray(store.cards[newParentId].children)) store.cards[newParentId].children = [];
          if (!store.cards[newParentId].children.includes(id)) store.cards[newParentId].children.push(id);
        } else if (Array.isArray(store.rootOrder) && !store.rootOrder.includes(id)) {
          store.rootOrder.push(id);
        }
      })
    };
  }
  function convertCardKind(store, cardId, targetKind, options = {}) {
    const card = store && store.cards && store.cards[cardId];
    if (!card) return { ok: false, error: `Card "${cardId}" not found` };
    const ops = resolveOps(store, options);
    const previousKind = getCardKind(card);
    const modsData = JSON.parse(JSON.stringify(card.modsData || {}));
    const draft = { ...card, modsData };
    setCardKind(draft, targetKind, options.payload || {});
    if (previousKind !== GENERIC_KIND && previousKind !== targetKind) {
      draft.modsData.previousKind = previousKind;
    }
    ops.updateCard(cardId, { modsData: draft.modsData });
    return { ok: true, cardId };
  }
  function convertNoteToTask(store, cardId, options = {}) {
    const result = convertCardKind(store, cardId, "task", {
      ops: options.ops,
      payload: {
        status: "todo",
        priority: options.priority || "medium",
        dueDate: options.dueDate ?? null,
        completed: false
      }
    });
    if (result.ok && options.projectId && store.cards[options.projectId]) {
      resolveOps(store, options).reparent(cardId, options.projectId);
    }
    return result;
  }
  function convertNoteToSlide(store, cardId, deckId, options = {}) {
    const deck = deckId && store && store.cards ? store.cards[deckId] : null;
    const order = deck && Array.isArray(deck.children) ? deck.children.length + 1 : 1;
    const result = convertCardKind(store, cardId, "slide", {
      ops: options.ops,
      payload: {
        layout: options.layout || "title-bullets",
        speakerNotes: "",
        order
      }
    });
    if (result.ok && deck) {
      resolveOps(store, options).reparent(cardId, deckId);
    }
    return result;
  }
  function createDeckFromOutline(store, cardId, options = {}) {
    const card = store && store.cards && store.cards[cardId];
    if (!card) return { ok: false, error: `Card "${cardId}" not found` };
    const deckResult = convertCardKind(store, cardId, "deck", {
      ops: options.ops,
      payload: {
        theme: options.theme || "default",
        aspectRatio: options.aspectRatio || "16:9"
      }
    });
    if (!deckResult.ok) return deckResult;
    const slides = createSlidesFromChildren(store, cardId, options);
    return { ok: true, deckId: cardId, slideIds: slides.slideIds };
  }
  function createSlidesFromChildren(store, parentId, options = {}) {
    const parent = store && store.cards && store.cards[parentId];
    if (!parent) return { ok: false, slideIds: [] };
    const slideIds = [];
    (parent.children || []).forEach((childId, index) => {
      const result = convertCardKind(store, childId, "slide", {
        ops: options.ops,
        payload: {
          layout: options.layout || "title-bullets",
          speakerNotes: "",
          order: index + 1
        }
      });
      if (result.ok) slideIds.push(childId);
    });
    return { ok: true, slideIds };
  }
  function createProjectFromOutline(store, cardId, options = {}) {
    const card = store && store.cards && store.cards[cardId];
    if (!card) return { ok: false, error: `Card "${cardId}" not found` };
    const projectResult = convertCardKind(store, cardId, "project", {
      ops: options.ops,
      payload: { status: "active", priority: options.priority || "medium", dueDate: null }
    });
    if (!projectResult.ok) return projectResult;
    const taskIds = [];
    (card.children || []).forEach((childId) => {
      const result = convertCardKind(store, childId, "task", {
        ops: options.ops,
        payload: { status: "todo", priority: options.priority || "medium", dueDate: null, completed: false }
      });
      if (result.ok) taskIds.push(childId);
    });
    return { ok: true, projectId: cardId, taskIds };
  }
  function createReminderForCard(store, cardId, reminderData = {}) {
    const target = store && store.cards && store.cards[cardId];
    if (!target) return { ok: false, error: `Card "${cardId}" not found` };
    const ops = resolveOps(store, reminderData);
    const title = reminderData.title || `Reminder: ${target.title || "Untitled"}`;
    const reminderId = ops.createCard(title, reminderData.body || "", cardId);
    if (!reminderId || !store.cards[reminderId]) {
      return { ok: false, error: "Failed to create reminder card" };
    }
    const result = convertCardKind(store, reminderId, "reminder", {
      ops: reminderData.ops,
      payload: {
        targetCardId: cardId,
        type: reminderData.type || "general",
        dueAt: reminderData.dueAt ?? null,
        repeat: reminderData.repeat ?? null,
        status: "scheduled"
      }
    });
    if (!result.ok) return result;
    return { ok: true, reminderId };
  }
  function revertCardKind(store, cardId, options = {}) {
    const card = store && store.cards && store.cards[cardId];
    if (!card) return { ok: false, error: `Card "${cardId}" not found` };
    const previousKind = card.modsData && card.modsData.previousKind;
    if (!previousKind) return { ok: false, error: "No previous kind recorded" };
    return convertCardKind(store, cardId, previousKind, options);
  }
  const DEFAULT_MODE_ID = "cardspoke";
  const modes = /* @__PURE__ */ new Map();
  let activeModeId = DEFAULT_MODE_ID;
  function registerAppMode(mode) {
    if (!mode || typeof mode.id !== "string" || !mode.id) return false;
    modes.set(mode.id, {
      icon: null,
      accepts: () => true,
      renderList: null,
      renderDetail: null,
      renderEditor: null,
      getActions: () => [],
      ...mode
    });
    return true;
  }
  function unregisterAppMode(modeId) {
    if (modeId === DEFAULT_MODE_ID) return false;
    const removed = modes.delete(modeId);
    if (removed && activeModeId === modeId) activeModeId = DEFAULT_MODE_ID;
    return removed;
  }
  function getAppMode(modeId) {
    return modes.get(modeId) || null;
  }
  function listAppModes() {
    return Array.from(modes.values());
  }
  function getModesForCard(card) {
    return listAppModes().filter((mode) => {
      try {
        return !!mode.accepts(card);
      } catch (_err) {
        return false;
      }
    });
  }
  function setActiveMode(modeId) {
    activeModeId = modes.has(modeId) ? modeId : DEFAULT_MODE_ID;
    return activeModeId;
  }
  function getActiveMode() {
    return modes.get(activeModeId) || modes.get(DEFAULT_MODE_ID) || null;
  }
  function getActiveModeId() {
    return activeModeId;
  }
  function filterCardsForMode(store, modeId) {
    const mode = modes.get(modeId);
    if (!mode || !store || !store.cards) return [];
    return Object.values(store.cards).filter((card) => {
      try {
        return !!mode.accepts(card);
      } catch (_err) {
        return false;
      }
    });
  }
  function clearAppModes() {
    modes.clear();
    activeModeId = DEFAULT_MODE_ID;
  }
  function registerBuiltInModes() {
    const byKinds = (...kinds) => (card) => kinds.includes(getCardKind(card));
    registerAppMode({ id: "cardspoke", title: "CardSpoke", icon: "grid", accepts: () => true });
    registerAppMode({ id: "repository", title: "Repository", icon: "book", accepts: byKinds("repository_page") });
    registerAppMode({ id: "notes", title: "Notes", icon: "note", accepts: byKinds("note") });
    registerAppMode({ id: "projects", title: "Projects", icon: "briefcase", accepts: byKinds("project", "task") });
    registerAppMode({ id: "decks", title: "Decks", icon: "monitor", accepts: byKinds("deck", "slide") });
    registerAppMode({ id: "contacts", title: "Contacts", icon: "users", accepts: byKinds("contact") });
    registerAppMode({ id: "plants", title: "Plant Pal", icon: "leaf", accepts: byKinds("plant", "care_log") });
  }
  const PROFILES = Object.freeze(["full", "lite", "os"]);
  const DEFAULT_PROFILE = "full";
  const FEATURE_FLAGS = Object.freeze({
    pluginManager: true,
    developerConsole: true,
    advancedSearch: true,
    dataHub: true,
    typedCards: true,
    appModes: false,
    actionRegistry: true,
    conversionHelpers: true
  });
  const PROFILE_FEATURES = Object.freeze({
    full: Object.freeze({
      pluginManager: true,
      developerConsole: true,
      advancedSearch: true,
      dataHub: true,
      appModes: false
    }),
    lite: Object.freeze({
      pluginManager: false,
      developerConsole: false,
      advancedSearch: true,
      dataHub: false,
      appModes: false
    }),
    os: Object.freeze({
      pluginManager: false,
      developerConsole: false,
      advancedSearch: true,
      dataHub: false,
      appModes: true
    })
  });
  function resolveProfile(name) {
    return PROFILES.includes(name) ? name : DEFAULT_PROFILE;
  }
  function getFeatureFlags(profile) {
    const resolved = resolveProfile(profile);
    return { ...FEATURE_FLAGS, ...PROFILE_FEATURES[resolved] || {} };
  }
  let activeProfile = DEFAULT_PROFILE;
  function setActiveProfile(profile) {
    activeProfile = resolveProfile(profile);
    return activeProfile;
  }
  function getActiveProfile() {
    return activeProfile;
  }
  function isFeatureEnabled(feature) {
    const flags = getFeatureFlags(activeProfile);
    return !!flags[feature];
  }
  function detectProfile(env = {}) {
    let search = env.search;
    if (search === void 0 && typeof globalThis !== "undefined" && globalThis.location) {
      search = globalThis.location.search;
    }
    if (typeof search === "string" && search) {
      const match = /[?&]profile=([^&]+)/.exec(search);
      if (match && PROFILES.includes(decodeURIComponent(match[1]))) {
        return decodeURIComponent(match[1]);
      }
    }
    const globalProfile = env.globalProfile !== void 0 ? env.globalProfile : typeof globalThis !== "undefined" ? globalThis.CardSpokeProfile : void 0;
    if (PROFILES.includes(globalProfile)) return globalProfile;
    return resolveProfile(env.fallback);
  }
  function initProfile(env = {}) {
    return setActiveProfile(detectProfile(env));
  }
  const EXPORT_FORMATS = Object.freeze(["json", "markdown", "txt", "csv", "html"]);
  function collectSubtree(store, rootId) {
    const out = [];
    const walk = (id) => {
      const card = store.cards[id];
      if (!card) return;
      out.push(card);
      (card.children || []).forEach(walk);
    };
    walk(rootId);
    return out;
  }
  function selectCardsForExport(store, options = {}) {
    if (!store || !store.cards) return [];
    let cards;
    if (options.rootId) {
      const includeChildren = options.includeChildren !== false;
      cards = includeChildren ? collectSubtree(store, options.rootId) : [store.cards[options.rootId]].filter(Boolean);
    } else {
      cards = Object.values(store.cards);
    }
    const kinds = options.kinds || (options.kind ? [options.kind] : null);
    if (kinds) {
      cards = cards.filter((card) => kinds.includes(getCardKind(card)));
    }
    if (options.tag) {
      const normalized = String(options.tag).replace(/^#/, "").toLowerCase().trim();
      cards = cards.filter((card) => Array.isArray(card.tags) && card.tags.some((t) => String(t).toLowerCase() === normalized));
    }
    return cards;
  }
  function csvCell(value) {
    const str = value == null ? "" : String(value);
    if (/[",\n\r]/.test(str)) return '"' + str.replace(/"/g, '""') + '"';
    return str;
  }
  function escapeHtml(str) {
    return String(str == null ? "" : str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function depthWithin(card, byId) {
    let depth = 0;
    let current = card;
    while (current && current.parentId && byId[current.parentId]) {
      depth++;
      current = byId[current.parentId];
    }
    return depth;
  }
  function orderAsOutline(cards) {
    const byId = {};
    cards.forEach((c) => {
      byId[c.id] = c;
    });
    const roots = cards.filter((c) => !c.parentId || !byId[c.parentId]);
    const out = [];
    const walk = (card) => {
      out.push(card);
      (card.children || []).forEach((id) => {
        if (byId[id]) walk(byId[id]);
      });
    };
    roots.forEach(walk);
    cards.forEach((c) => {
      if (!out.includes(c)) out.push(c);
    });
    return { ordered: out, byId };
  }
  function exportCards(store, options = {}) {
    const format = options.format || "json";
    if (!EXPORT_FORMATS.includes(format)) {
      return { ok: false, format, count: 0, error: `Unsupported format "${format}"` };
    }
    const cards = selectCardsForExport(store, options);
    const count = cards.length;
    if (format === "json") {
      const cardsById = {};
      cards.forEach((card) => {
        cardsById[card.id] = card;
      });
      const includedIds = new Set(Object.keys(cardsById));
      const rootIds = cards.filter((card) => !card.parentId || !includedIds.has(card.parentId)).map((card) => card.id);
      const payload = {
        exportType: "cards",
        timestamp: Date.now(),
        filter: {
          kind: options.kind || null,
          kinds: options.kinds || null,
          tag: options.tag || null,
          rootId: options.rootId || null
        },
        cards: cardsById,
        rootIds
      };
      return { ok: true, format, content: JSON.stringify(payload, null, 2), count };
    }
    const { ordered, byId } = orderAsOutline(cards);
    if (format === "markdown") {
      const lines = ordered.map((card) => {
        const depth = Math.min(depthWithin(card, byId), 5);
        const heading = "#".repeat(depth + 1);
        const body = card.body ? `

${card.body}` : "";
        return `${heading} ${card.title || "Untitled"}${body}`;
      });
      return { ok: true, format, content: lines.join("\n\n"), count };
    }
    if (format === "txt") {
      const lines = ordered.map((card) => {
        const indent = "	".repeat(depthWithin(card, byId));
        const body = card.body ? "\n" + card.body.split("\n").map((l) => `${indent}	${l}`).join("\n") : "";
        return `${indent}${card.title || "Untitled"}${body}`;
      });
      return { ok: true, format, content: lines.join("\n"), count };
    }
    if (format === "csv") {
      const header = ["id", "title", "body", "parentId", "tags", "kind", "createdAt", "updatedAt"];
      const rows = ordered.map((card) => [
        card.id,
        card.title || "",
        card.body || "",
        card.parentId || "",
        (card.tags || []).join("; "),
        getCardKind(card),
        card.createdAt || "",
        card.updatedAt || ""
      ].map(csvCell).join(","));
      return { ok: true, format, content: [header.join(","), ...rows].join("\n"), count };
    }
    const items = ordered.map((card) => {
      const depth = depthWithin(card, byId);
      const level = Math.min(depth + 1, 6);
      const body = card.body ? `<p>${escapeHtml(card.body).replace(/\n/g, "<br>")}</p>` : "";
      const tags = (card.tags || []).length ? `<p class="tags">${(card.tags || []).map((t) => `#${escapeHtml(t)}`).join(" ")}</p>` : "";
      return `<section class="card kind-${escapeHtml(getCardKind(card))}"><h${level}>${escapeHtml(card.title || "Untitled")}</h${level}>${body}${tags}</section>`;
    });
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>CardSpoke Export</title></head>
<body>
${items.join("\n")}
</body>
</html>`;
    return { ok: true, format, content: html, count };
  }
  function prepareImportCards(payload) {
    const warnings = [];
    let pkg = payload;
    if (typeof pkg === "string") {
      try {
        pkg = JSON.parse(pkg);
      } catch (err) {
        return { ok: false, cards: {}, rootIds: [], warnings, error: "Invalid JSON: " + err.message };
      }
    }
    if (!pkg || typeof pkg !== "object" || pkg.cards && typeof pkg.cards !== "object") {
      return { ok: false, cards: {}, rootIds: [], warnings, error: "Invalid import payload" };
    }
    const cards = {};
    for (const [id, original] of Object.entries(pkg.cards || {})) {
      if (!original || typeof original !== "object") {
        warnings.push(`[${id}] Skipped: card is not an object`);
        continue;
      }
      const card = JSON.parse(JSON.stringify(original));
      const validation = validateTypedCard(card);
      for (const w of validation.warnings) warnings.push(`[${id}] ${w}`);
      const kind = getCardKind(card);
      if (kind !== "generic" && !isKnownKind(kind)) ;
      else {
        const migrated = migrateCard(card);
        for (const w of migrated.warnings) warnings.push(`[${id}] ${w}`);
      }
      cards[id] = card;
    }
    const rootIds = Array.isArray(pkg.rootIds) ? pkg.rootIds.filter((id) => cards[id]) : Object.values(cards).filter((c) => !c.parentId || !cards[c.parentId]).map((c) => c.id);
    return { ok: true, cards, rootIds, warnings };
  }
  exports2.CARD_KINDS = CARD_KINDS;
  exports2.DEFAULT_MODE_ID = DEFAULT_MODE_ID;
  exports2.DEFAULT_PROFILE = DEFAULT_PROFILE;
  exports2.EXPORT_FORMATS = EXPORT_FORMATS;
  exports2.FEATURE_FLAGS = FEATURE_FLAGS;
  exports2.GENERIC_KIND = GENERIC_KIND;
  exports2.KIND_DEFINITIONS = KIND_DEFINITIONS;
  exports2.Kernel = Kernel;
  exports2.PROFILES = PROFILES;
  exports2.PROFILE_FEATURES = PROFILE_FEATURES;
  exports2.clearActions = clearActions;
  exports2.clearAppModes = clearAppModes;
  exports2.clearKindMigrations = clearKindMigrations;
  exports2.cloneCard = cloneCard;
  exports2.collectSubtree = collectSubtree;
  exports2.convertCardKind = convertCardKind;
  exports2.convertNoteToSlide = convertNoteToSlide;
  exports2.convertNoteToTask = convertNoteToTask;
  exports2.createDeckFromOutline = createDeckFromOutline;
  exports2.createProjectFromOutline = createProjectFromOutline;
  exports2.createReminderForCard = createReminderForCard;
  exports2.createSlidesFromChildren = createSlidesFromChildren;
  exports2.createTypedModsData = createTypedModsData;
  exports2.detectProfile = detectProfile;
  exports2.evaluateCollection = evaluateCollection;
  exports2.exportCards = exportCards;
  exports2.extractTags = extractTags;
  exports2.filterCardsForMode = filterCardsForMode;
  exports2.findCardsByKindAndTag = findCardsByKindAndTag;
  exports2.findDueReminders = findDueReminders;
  exports2.findPlantsWithTrackingEnabled = findPlantsWithTrackingEnabled;
  exports2.findTasksDueToday = findTasksDueToday;
  exports2.getAction = getAction;
  exports2.getActionsForCard = getActionsForCard;
  exports2.getActiveMode = getActiveMode;
  exports2.getActiveModeId = getActiveModeId;
  exports2.getActiveProfile = getActiveProfile;
  exports2.getAppMode = getAppMode;
  exports2.getCardKind = getCardKind;
  exports2.getFeatureFlags = getFeatureFlags;
  exports2.getKindData = getKindData;
  exports2.getKindPayloadKey = getKindPayloadKey;
  exports2.getModesForCard = getModesForCard;
  exports2.hasCardLink = hasCardLink;
  exports2.initProfile = initProfile;
  exports2.isCardKind = isCardKind;
  exports2.isFeatureEnabled = isFeatureEnabled;
  exports2.isKnownKind = isKnownKind;
  exports2.listActions = listActions;
  exports2.listAppModes = listAppModes;
  exports2.listCardsByKind = listCardsByKind;
  exports2.listChildrenByKind = listChildrenByKind;
  exports2.listRootCardsByKind = listRootCardsByKind;
  exports2.migrateCard = migrateCard;
  exports2.migrateKindData = migrateKindData;
  exports2.migrateStore = migrateStore;
  exports2.migrateTypedCard = migrateTypedCard;
  exports2.normalizeCardName = normalizeCardName;
  exports2.parseCardLinks = parseCardLinks;
  exports2.prepareImportCards = prepareImportCards;
  exports2.registerAction = registerAction;
  exports2.registerAppMode = registerAppMode;
  exports2.registerBuiltInModes = registerBuiltInModes;
  exports2.registerCoreCardActions = registerCoreCardActions;
  exports2.registerKindMigration = registerKindMigration;
  exports2.registerTypedCardActions = registerTypedCardActions;
  exports2.resolveProfile = resolveProfile;
  exports2.revertCardKind = revertCardKind;
  exports2.runAction = runAction;
  exports2.selectCardsForExport = selectCardsForExport;
  exports2.setActiveMode = setActiveMode;
  exports2.setActiveProfile = setActiveProfile;
  exports2.setCardKind = setCardKind;
  exports2.uid = uid$1;
  exports2.unregisterAction = unregisterAction;
  exports2.unregisterAppMode = unregisterAppMode;
  exports2.updateKindData = updateKindData;
  exports2.validateTypedCard = validateTypedCard;
  Object.defineProperty(exports2, Symbol.toStringTag, { value: "Module" });
}));
//# sourceMappingURL=cardspoke-core.umd.cjs.map
