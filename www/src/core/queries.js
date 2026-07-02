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
 * Typed Query Helpers (CardSpoke Core)
 *
 * Reusable, DOM-free query helpers over the existing in-memory store shape
 * ({ cards: { [id]: card }, rootOrder: string[] }). No new database engine —
 * these are plain filters/finders so future app modes can share one query
 * vocabulary. See docs/architecture/TYPED_CARDS.md.
 */

import { getCardKind, isCardKind, getKindData } from './typed-cards.js';

export { listCardsByKind, listChildrenByKind } from './typed-cards.js';

/**
 * List root-level cards (no parent) of the given kind, in root order.
 * @param {{cards: Object, rootOrder?: string[]}} store
 * @param {string} kind
 * @returns {Object[]}
 */
export function listRootCardsByKind(store, kind) {
  if (!store || !store.cards) return [];
  const rootOrder = Array.isArray(store.rootOrder) ? store.rootOrder : [];
  return rootOrder
    .map(id => store.cards[id])
    .filter(card => card && !card.parentId && isCardKind(card, kind));
}

/**
 * Find cards matching both a kind and a tag (case-insensitive tag match).
 * @param {{cards: Object}} store
 * @param {string} kind
 * @param {string} tag
 * @returns {Object[]}
 */
export function findCardsByKindAndTag(store, kind, tag) {
  if (!store || !store.cards || !tag) return [];
  const normalized = String(tag).replace(/^#/, '').toLowerCase().trim();
  return Object.values(store.cards).filter(card =>
    isCardKind(card, kind) &&
    Array.isArray(card.tags) &&
    card.tags.some(t => String(t).toLowerCase() === normalized)
  );
}

/**
 * Parse a reminder's dueAt (ISO string or epoch ms) into epoch ms.
 * @param {*} dueAt
 * @returns {number|null}
 */
function parseDueAt(dueAt) {
  if (dueAt == null) return null;
  if (typeof dueAt === 'number') return Number.isFinite(dueAt) ? dueAt : null;
  const parsed = Date.parse(dueAt);
  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * Find reminder cards that are due at or before `now` and still scheduled.
 * @param {{cards: Object}} store
 * @param {number|Date} [now=Date.now()]
 * @returns {Object[]}
 */
export function findDueReminders(store, now = Date.now()) {
  if (!store || !store.cards) return [];
  const nowMs = now instanceof Date ? now.getTime() : now;
  return Object.values(store.cards).filter(card => {
    if (!isCardKind(card, 'reminder')) return false;
    const data = getKindData(card, 'reminder');
    if (!data || data.status !== 'scheduled') return false;
    const dueMs = parseDueAt(data.dueAt);
    return dueMs !== null && dueMs <= nowMs;
  });
}

/**
 * Find task cards due today (relative to `now`), not yet completed.
 * @param {{cards: Object}} store
 * @param {number|Date} [now=Date.now()]
 * @returns {Object[]}
 */
export function findTasksDueToday(store, now = Date.now()) {
  if (!store || !store.cards) return [];
  const ref = now instanceof Date ? now : new Date(now);
  const dayStart = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate()).getTime();
  const dayEnd = dayStart + 24 * 60 * 60 * 1000;
  return Object.values(store.cards).filter(card => {
    if (!isCardKind(card, 'task')) return false;
    const data = getKindData(card, 'task');
    if (!data || data.completed) return false;
    const dueMs = parseDueAt(data.dueDate);
    return dueMs !== null && dueMs >= dayStart && dueMs < dayEnd;
  });
}

/**
 * Find plant cards with care tracking enabled.
 * @param {{cards: Object}} store
 * @returns {Object[]}
 */
export function findPlantsWithTrackingEnabled(store) {
  if (!store || !store.cards) return [];
  return Object.values(store.cards).filter(card => {
    if (!isCardKind(card, 'plant')) return false;
    const data = getKindData(card, 'plant');
    return !!(data && data.trackingEnabled);
  });
}

/**
 * Evaluate a collection card's saved filter against a store.
 *
 * Supported filter fields (all optional, AND-combined):
 *   - kind:   match cards of this kind
 *   - tag:    match cards carrying this tag
 *   - status: match cards whose kind payload has this `status`
 *   - any other scalar field: matched against the card's kind payload
 *     (e.g. { trackingEnabled: true } for plants)
 *
 * @param {{cards: Object}} store
 * @param {Object} collectionCard - A card of kind "collection".
 * @returns {Object[]} Matching cards (the collection card itself excluded).
 */
export function evaluateCollection(store, collectionCard) {
  if (!store || !store.cards) return [];
  if (!isCardKind(collectionCard, 'collection')) return [];
  const data = getKindData(collectionCard, 'collection');
  const filter = data && data.filter && typeof data.filter === 'object' ? data.filter : {};
  const { kind, tag, ...payloadFields } = filter;
  const normalizedTag = tag ? String(tag).replace(/^#/, '').toLowerCase().trim() : null;

  return Object.values(store.cards).filter(card => {
    if (collectionCard.id && card.id === collectionCard.id) return false;
    if (kind && getCardKind(card) !== kind) return false;
    if (normalizedTag) {
      const tags = Array.isArray(card.tags) ? card.tags : [];
      if (!tags.some(t => String(t).toLowerCase() === normalizedTag)) return false;
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
