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
 * Import / Export Transforms (CardSpoke Core)
 *
 * Pure, DOM-free transforms: they take a store and options and return
 * strings/objects. Shells own downloads, file pickers, and toasts.
 *
 * Exports are filterable by kind(s), tag, or subtree root. JSON exports use
 * the same payload shape as the existing full-app export ({ cards, rootIds })
 * so they round-trip through the current import path, and always preserve
 * `modsData` — including unknown/future kinds.
 */

import { getCardKind, isKnownKind, validateTypedCard } from './typed-cards.js';
import { migrateCard } from './migrations.js';

export const EXPORT_FORMATS = Object.freeze(['json', 'markdown', 'txt', 'csv', 'html']);

/**
 * Collect a card and all its descendants (depth-first).
 * @param {{cards: Object}} store
 * @param {string} rootId
 * @returns {Object[]}
 */
export function collectSubtree(store, rootId) {
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

/**
 * Select the cards an export should include.
 * @param {{cards: Object, rootOrder?: string[]}} store
 * @param {Object} [options]
 * @param {string} [options.kind] - Single kind filter.
 * @param {string[]} [options.kinds] - Multiple kinds filter.
 * @param {string} [options.tag] - Tag filter (case-insensitive).
 * @param {string} [options.rootId] - Restrict to a card (and its subtree).
 * @param {boolean} [options.includeChildren=true] - With rootId, include descendants.
 * @returns {Object[]}
 */
export function selectCardsForExport(store, options = {}) {
  if (!store || !store.cards) return [];
  let cards;
  if (options.rootId) {
    const includeChildren = options.includeChildren !== false;
    cards = includeChildren
      ? collectSubtree(store, options.rootId)
      : [store.cards[options.rootId]].filter(Boolean);
  } else {
    cards = Object.values(store.cards);
  }

  const kinds = options.kinds || (options.kind ? [options.kind] : null);
  if (kinds) {
    cards = cards.filter(card => kinds.includes(getCardKind(card)));
  }
  if (options.tag) {
    const normalized = String(options.tag).replace(/^#/, '').toLowerCase().trim();
    cards = cards.filter(card =>
      Array.isArray(card.tags) && card.tags.some(t => String(t).toLowerCase() === normalized));
  }
  return cards;
}

/** Escape a value for a CSV cell. */
function csvCell(value) {
  const str = value == null ? '' : String(value);
  if (/[",\n\r]/.test(str)) return '"' + str.replace(/"/g, '""') + '"';
  return str;
}

/** Escape text for HTML output. */
function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Depth of a card relative to the exported set (for outline formats). */
function depthWithin(card, byId) {
  let depth = 0;
  let current = card;
  while (current && current.parentId && byId[current.parentId]) {
    depth++;
    current = byId[current.parentId];
  }
  return depth;
}

/** Order cards as a forest: roots (relative to the set) first, then children. */
function orderAsOutline(cards) {
  const byId = {};
  cards.forEach(c => { byId[c.id] = c; });
  const roots = cards.filter(c => !c.parentId || !byId[c.parentId]);
  const out = [];
  const walk = (card) => {
    out.push(card);
    (card.children || []).forEach(id => { if (byId[id]) walk(byId[id]); });
  };
  roots.forEach(walk);
  // Include any stragglers not reachable from the set's roots.
  cards.forEach(c => { if (!out.includes(c)) out.push(c); });
  return { ordered: out, byId };
}

/**
 * Export cards to a string in the requested format.
 * @param {{cards: Object, rootOrder?: string[]}} store
 * @param {Object} [options] - Selection options (see selectCardsForExport)
 *   plus { format: 'json'|'markdown'|'txt'|'csv'|'html' } (default 'json').
 * @returns {{ ok: boolean, format: string, content?: string, count: number, error?: string }}
 */
export function exportCards(store, options = {}) {
  const format = options.format || 'json';
  if (!EXPORT_FORMATS.includes(format)) {
    return { ok: false, format, count: 0, error: `Unsupported format "${format}"` };
  }
  const cards = selectCardsForExport(store, options);
  const count = cards.length;

  if (format === 'json') {
    const cardsById = {};
    cards.forEach(card => { cardsById[card.id] = card; });
    const includedIds = new Set(Object.keys(cardsById));
    const rootIds = cards
      .filter(card => !card.parentId || !includedIds.has(card.parentId))
      .map(card => card.id);
    const payload = {
      exportType: 'cards',
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

  if (format === 'markdown') {
    const lines = ordered.map(card => {
      const depth = Math.min(depthWithin(card, byId), 5);
      const heading = '#'.repeat(depth + 1);
      const body = card.body ? `\n\n${card.body}` : '';
      return `${heading} ${card.title || 'Untitled'}${body}`;
    });
    return { ok: true, format, content: lines.join('\n\n'), count };
  }

  if (format === 'txt') {
    const lines = ordered.map(card => {
      const indent = '\t'.repeat(depthWithin(card, byId));
      const body = card.body
        ? '\n' + card.body.split('\n').map(l => `${indent}\t${l}`).join('\n')
        : '';
      return `${indent}${card.title || 'Untitled'}${body}`;
    });
    return { ok: true, format, content: lines.join('\n'), count };
  }

  if (format === 'csv') {
    const header = ['id', 'title', 'body', 'parentId', 'tags', 'kind', 'createdAt', 'updatedAt'];
    const rows = ordered.map(card => [
      card.id,
      card.title || '',
      card.body || '',
      card.parentId || '',
      (card.tags || []).join('; '),
      getCardKind(card),
      card.createdAt || '',
      card.updatedAt || ''
    ].map(csvCell).join(','));
    return { ok: true, format, content: [header.join(','), ...rows].join('\n'), count };
  }

  // html
  const items = ordered.map(card => {
    const depth = depthWithin(card, byId);
    const level = Math.min(depth + 1, 6);
    const body = card.body ? `<p>${escapeHtml(card.body).replace(/\n/g, '<br>')}</p>` : '';
    const tags = (card.tags || []).length
      ? `<p class="tags">${(card.tags || []).map(t => `#${escapeHtml(t)}`).join(' ')}</p>`
      : '';
    return `<section class="card kind-${escapeHtml(getCardKind(card))}">` +
      `<h${level}>${escapeHtml(card.title || 'Untitled')}</h${level}>${body}${tags}</section>`;
  });
  const html = `<!DOCTYPE html>\n<html>\n<head><meta charset="utf-8"><title>CardSpoke Export</title></head>\n<body>\n${items.join('\n')}\n</body>\n</html>`;
  return { ok: true, format, content: html, count };
}

/**
 * Validate (and migrate) an import payload's cards without mutating the
 * input. Typed metadata is preserved — including unknown/future kinds —
 * and invalid typed metadata produces warnings, never data loss.
 * @param {Object|string} payload - Parsed payload or JSON string with { cards }.
 * @returns {{ ok: boolean, cards: Object, rootIds: string[], warnings: string[], error?: string }}
 */
export function prepareImportCards(payload) {
  const warnings = [];
  let pkg = payload;
  if (typeof pkg === 'string') {
    try {
      pkg = JSON.parse(pkg);
    } catch (err) {
      return { ok: false, cards: {}, rootIds: [], warnings, error: 'Invalid JSON: ' + err.message };
    }
  }
  if (!pkg || typeof pkg !== 'object' || (pkg.cards && typeof pkg.cards !== 'object')) {
    return { ok: false, cards: {}, rootIds: [], warnings, error: 'Invalid import payload' };
  }

  const cards = {};
  for (const [id, original] of Object.entries(pkg.cards || {})) {
    if (!original || typeof original !== 'object') {
      warnings.push(`[${id}] Skipped: card is not an object`);
      continue;
    }
    // Deep clone so validation/migration never mutates the caller's payload.
    const card = JSON.parse(JSON.stringify(original));

    const validation = validateTypedCard(card);
    for (const w of validation.warnings) warnings.push(`[${id}] ${w}`);
    const kind = getCardKind(card);
    if (kind !== 'generic' && !isKnownKind(kind)) {
      // Unknown/future kind: preserved as-is (warning already recorded).
    } else {
      const migrated = migrateCard(card);
      for (const w of migrated.warnings) warnings.push(`[${id}] ${w}`);
    }
    cards[id] = card;
  }

  const rootIds = Array.isArray(pkg.rootIds)
    ? pkg.rootIds.filter(id => cards[id])
    : Object.values(cards).filter(c => !c.parentId || !cards[c.parentId]).map(c => c.id);

  return { ok: true, cards, rootIds, warnings };
}
