/*
 * Copyright 2026 Jeffrey Guntly (JX Holdings, LLC)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Typed Cards (CardSpoke Core)
 *
 * Formal typed-card convention on top of the existing card shape.
 * A card may optionally declare an application kind via `card.modsData`:
 *
 *   card.modsData = {
 *     kind: "note",
 *     schemaVersion: 1,
 *     note: { ... }          // payload keyed by the kind's payload key
 *   }
 *
 * Design rules (see docs/architecture/TYPED_CARDS.md):
 *   - Cards without `modsData.kind` remain valid legacy CardSpoke cards.
 *   - Unknown / future kinds are preserved, never stripped.
 *   - Validation produces warnings and safe fallbacks, never data loss.
 *   - This module has zero DOM / browser dependencies.
 */

/** Generic kind reported for legacy cards without a `modsData.kind`. */
export const GENERIC_KIND = 'generic';

/**
 * Registry of known card kinds.
 * Each entry defines the payload key inside modsData, the current schema
 * version, and a factory for the default payload.
 */
export const KIND_DEFINITIONS = {
  note: {
    payloadKey: 'note',
    schemaVersion: 1,
    defaults: () => ({ pinned: false })
  },
  repository_page: {
    payloadKey: 'repositoryPage',
    schemaVersion: 1,
    defaults: () => ({ section: '', source: 'user', status: 'draft' })
  },
  project: {
    payloadKey: 'project',
    schemaVersion: 1,
    defaults: () => ({ status: 'active', priority: 'medium', dueDate: null })
  },
  task: {
    payloadKey: 'task',
    schemaVersion: 1,
    defaults: () => ({ status: 'todo', priority: 'medium', dueDate: null, completed: false })
  },
  deck: {
    payloadKey: 'deck',
    schemaVersion: 1,
    defaults: () => ({ theme: 'default', aspectRatio: '16:9' })
  },
  slide: {
    payloadKey: 'slide',
    schemaVersion: 1,
    defaults: () => ({ layout: 'title-bullets', speakerNotes: '', order: 0 })
  },
  contact: {
    payloadKey: 'contact',
    schemaVersion: 1,
    defaults: () => ({
      displayName: '', email: '', phone: '', organization: '',
      relationship: '', trackingEnabled: false
    })
  },
  plant: {
    payloadKey: 'plant',
    schemaVersion: 1,
    defaults: () => ({
      species: '', location: '', trackingEnabled: false,
      wateringIntervalDays: null, lastWatered: null, lastFertilized: null
    })
  },
  care_log: {
    payloadKey: 'careLog',
    schemaVersion: 1,
    defaults: () => ({ targetCardId: null, careType: 'water', performedAt: null, notes: '' })
  },
  reminder: {
    payloadKey: 'reminder',
    schemaVersion: 1,
    defaults: () => ({
      targetCardId: null, type: 'general', dueAt: null,
      repeat: null, status: 'scheduled'
    })
  },
  collection: {
    payloadKey: 'collection',
    schemaVersion: 1,
    defaults: () => ({ filter: {}, sort: null })
  }
};

/** All known card kind identifiers. */
export const CARD_KINDS = Object.freeze(Object.keys(KIND_DEFINITIONS));

/**
 * Whether a kind is one of the known built-in kinds.
 * @param {string} kind
 * @returns {boolean}
 */
export function isKnownKind(kind) {
  return typeof kind === 'string' && Object.prototype.hasOwnProperty.call(KIND_DEFINITIONS, kind);
}

/**
 * Payload key used inside modsData for a given kind.
 * Unknown kinds fall back to the kind string itself so their data is
 * still addressable and preserved.
 * @param {string} kind
 * @returns {string}
 */
export function getKindPayloadKey(kind) {
  const def = KIND_DEFINITIONS[kind];
  return def ? def.payloadKey : String(kind);
}

/**
 * Get the application kind of a card.
 * Legacy cards (no modsData.kind) report the generic kind.
 * @param {Object} card
 * @returns {string}
 */
export function getCardKind(card) {
  if (!card || !card.modsData || typeof card.modsData !== 'object') return GENERIC_KIND;
  const kind = card.modsData.kind;
  return typeof kind === 'string' && kind ? kind : GENERIC_KIND;
}

/**
 * Whether a card declares the given kind.
 * @param {Object} card
 * @param {string} kind
 * @returns {boolean}
 */
export function isCardKind(card, kind) {
  return getCardKind(card) === kind;
}

/**
 * Assign a kind (and optional payload) to a card.
 * Merges the payload over the kind's defaults and preserves all other
 * modsData entries (plugin data, unknown metadata, previous kind payloads).
 * Mutates and returns the card.
 * @param {Object} card
 * @param {string} kind
 * @param {Object} [payload]
 * @returns {Object} The same card, updated.
 */
export function setCardKind(card, kind, payload = {}) {
  if (!card || typeof kind !== 'string' || !kind) return card;
  if (!card.modsData || typeof card.modsData !== 'object') card.modsData = {};
  const def = KIND_DEFINITIONS[kind];
  const key = getKindPayloadKey(kind);
  const base = def ? def.defaults() : {};
  const existing = (card.modsData[key] && typeof card.modsData[key] === 'object')
    ? card.modsData[key]
    : {};
  card.modsData.kind = kind;
  card.modsData.schemaVersion = def ? def.schemaVersion : (card.modsData.schemaVersion || 1);
  card.modsData[key] = { ...base, ...existing, ...payload };
  return card;
}

/**
 * Read the kind payload of a card.
 * @param {Object} card
 * @param {string} [kind] - Defaults to the card's own kind.
 * @returns {Object|null} The payload object, or null if absent.
 */
export function getKindData(card, kind) {
  if (!card || !card.modsData || typeof card.modsData !== 'object') return null;
  const k = kind || getCardKind(card);
  if (k === GENERIC_KIND) return null;
  const data = card.modsData[getKindPayloadKey(k)];
  return data && typeof data === 'object' ? data : null;
}

/**
 * Merge updates into a card's kind payload.
 * Creates the payload (with defaults) if it does not exist yet.
 * Mutates and returns the card.
 * @param {Object} card
 * @param {string} kind
 * @param {Object} updates
 * @returns {Object} The same card, updated.
 */
export function updateKindData(card, kind, updates) {
  if (!card || !isCardKind(card, kind)) return card;
  const key = getKindPayloadKey(kind);
  const def = KIND_DEFINITIONS[kind];
  const existing = (card.modsData[key] && typeof card.modsData[key] === 'object')
    ? card.modsData[key]
    : (def ? def.defaults() : {});
  card.modsData[key] = { ...existing, ...(updates || {}) };
  return card;
}

/**
 * Validate a card's typed metadata.
 * Never mutates the card and never destroys metadata — invalid shapes are
 * reported as warnings so callers can decide what to do.
 * @param {Object} card
 * @returns {{ valid: boolean, kind: string, known: boolean, warnings: string[] }}
 */
export function validateTypedCard(card) {
  const warnings = [];
  if (!card || typeof card !== 'object') {
    return { valid: false, kind: GENERIC_KIND, known: false, warnings: ['Card is not an object'] };
  }

  const kind = getCardKind(card);
  if (kind === GENERIC_KIND) {
    // Legacy card — always valid.
    return { valid: true, kind, known: false, warnings };
  }

  const mods = card.modsData;
  const known = isKnownKind(kind);
  if (!known) {
    warnings.push(`Unknown card kind "${kind}" — metadata preserved as-is`);
  }

  if (mods.schemaVersion !== undefined && typeof mods.schemaVersion !== 'number') {
    warnings.push(`modsData.schemaVersion should be a number (got ${typeof mods.schemaVersion})`);
  }

  const key = getKindPayloadKey(kind);
  const payload = mods[key];
  if (payload !== undefined && (payload === null || typeof payload !== 'object' || Array.isArray(payload))) {
    warnings.push(`modsData.${key} should be an object (got ${payload === null ? 'null' : Array.isArray(payload) ? 'array' : typeof payload})`);
  }

  // A typed card is "valid" as long as it can be read safely; warnings
  // flag shape problems without ever failing the card outright.
  return { valid: true, kind, known, warnings };
}

/**
 * Migrate a card's typed metadata to the current schema version.
 * Idempotent and loss-free:
 *   - Legacy cards are returned untouched.
 *   - Unknown kinds are preserved untouched.
 *   - Missing payloads for known kinds are filled with defaults.
 *   - Unknown fields inside payloads are preserved.
 * Delegates versioned data upgrades to migrations.js (migrateKindData).
 * Mutates and returns the card.
 * @param {Object} card
 * @param {Object} [options]
 * @param {Function} [options.migrateKindData] - (kind, data, fromVersion, toVersion) => data
 * @returns {{ card: Object, changed: boolean, warnings: string[] }}
 */
export function migrateTypedCard(card, options = {}) {
  const warnings = [];
  if (!card || typeof card !== 'object') return { card, changed: false, warnings };

  const kind = getCardKind(card);
  if (kind === GENERIC_KIND || !isKnownKind(kind)) {
    // Legacy or unknown/future kind — preserve untouched.
    return { card, changed: false, warnings };
  }

  const def = KIND_DEFINITIONS[kind];
  const key = def.payloadKey;
  const mods = card.modsData;
  let changed = false;

  const fromVersion = typeof mods.schemaVersion === 'number' ? mods.schemaVersion : 1;

  // Ensure payload exists and carries all default fields (fill, never overwrite).
  const defaults = def.defaults();
  const payload = (mods[key] && typeof mods[key] === 'object' && !Array.isArray(mods[key]))
    ? mods[key]
    : {};
  if (mods[key] !== payload) {
    if (mods[key] !== undefined) {
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

  // Versioned data migration hook.
  if (fromVersion < def.schemaVersion && typeof options.migrateKindData === 'function') {
    try {
      const migrated = options.migrateKindData(kind, payload, fromVersion, def.schemaVersion);
      if (migrated && typeof migrated === 'object') {
        mods[key] = migrated;
        changed = true;
      }
    } catch (err) {
      // Failed migrations must not delete data — leave the card readable.
      warnings.push(`Kind data migration failed for "${kind}": ${err && err.message}`);
    }
  }

  if (mods.schemaVersion !== def.schemaVersion) {
    mods.schemaVersion = def.schemaVersion;
    changed = true;
  }

  return { card, changed, warnings };
}

/**
 * List all cards in a store with the given kind.
 * @param {{cards: Object}} store
 * @param {string} kind
 * @returns {Object[]}
 */
export function listCardsByKind(store, kind) {
  if (!store || !store.cards || typeof store.cards !== 'object') return [];
  return Object.values(store.cards).filter(card => isCardKind(card, kind));
}

/**
 * List the direct children of a card that have the given kind.
 * @param {{cards: Object, rootOrder?: string[]}} store
 * @param {string|null} parentId - null lists root cards.
 * @param {string} kind
 * @returns {Object[]}
 */
export function listChildrenByKind(store, parentId, kind) {
  if (!store || !store.cards || typeof store.cards !== 'object') return [];
  let childIds;
  if (!parentId) {
    childIds = Array.isArray(store.rootOrder) ? store.rootOrder : [];
  } else {
    const parent = store.cards[parentId];
    childIds = parent && Array.isArray(parent.children) ? parent.children : [];
  }
  return childIds
    .map(id => store.cards[id])
    .filter(card => card && isCardKind(card, kind));
}

/**
 * Build a fresh typed modsData block for a kind.
 * @param {string} kind
 * @param {Object} [payload]
 * @returns {Object}
 */
export function createTypedModsData(kind, payload = {}) {
  const def = KIND_DEFINITIONS[kind];
  const key = getKindPayloadKey(kind);
  return {
    kind,
    schemaVersion: def ? def.schemaVersion : 1,
    [key]: { ...(def ? def.defaults() : {}), ...payload }
  };
}
