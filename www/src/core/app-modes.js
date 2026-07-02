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
 * App Mode Registry (CardSpoke Core)
 *
 * Lets multiple lightweight app views (notes, projects, decks, contacts,
 * plants, repository, …) share the same card data. A mode declares which
 * cards it accepts and (optionally) how to render its list/detail/editor —
 * renderers receive a shell-provided context and are stubs until a shell
 * implements them. The registry itself is DOM-free.
 *
 * See docs/architecture/APP_MODES.md.
 */

import { getCardKind } from './typed-cards.js';

/** The default mode: the full current CardSpoke behavior over all cards. */
export const DEFAULT_MODE_ID = 'cardspoke';

/** @type {Map<string, Object>} */
const modes = new Map();

let activeModeId = DEFAULT_MODE_ID;

/**
 * Register an app mode.
 * @param {Object} mode
 * @param {string} mode.id - Unique mode id, e.g. "notes".
 * @param {string} mode.title - Display title.
 * @param {string} [mode.icon]
 * @param {Function} [mode.accepts] - (card) => boolean. Defaults to accept all.
 * @param {Function} [mode.renderList] - (ctx) => void (stub until shells implement).
 * @param {Function} [mode.renderDetail] - (ctx, cardId) => void.
 * @param {Function} [mode.renderEditor] - (ctx, cardId) => void.
 * @param {Function} [mode.getActions] - (card) => Action[].
 * @returns {boolean} True if registered.
 */
export function registerAppMode(mode) {
  if (!mode || typeof mode.id !== 'string' || !mode.id) return false;
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

/**
 * Remove a mode. The default mode cannot be unregistered; unregistering
 * the active mode falls back to the default.
 * @param {string} modeId
 * @returns {boolean}
 */
export function unregisterAppMode(modeId) {
  if (modeId === DEFAULT_MODE_ID) return false;
  const removed = modes.delete(modeId);
  if (removed && activeModeId === modeId) activeModeId = DEFAULT_MODE_ID;
  return removed;
}

/**
 * @param {string} modeId
 * @returns {Object|null}
 */
export function getAppMode(modeId) {
  return modes.get(modeId) || null;
}

/** @returns {Object[]} All registered modes. */
export function listAppModes() {
  return Array.from(modes.values());
}

/**
 * List the modes that accept a given card.
 * @param {Object} card
 * @returns {Object[]}
 */
export function getModesForCard(card) {
  return listAppModes().filter(mode => {
    try {
      return !!mode.accepts(card);
    } catch (_err) {
      return false;
    }
  });
}

/**
 * Switch the active mode. Unknown mode ids fall back to the default.
 * @param {string} modeId
 * @returns {string} The mode id actually activated.
 */
export function setActiveMode(modeId) {
  activeModeId = modes.has(modeId) ? modeId : DEFAULT_MODE_ID;
  return activeModeId;
}

/** @returns {Object|null} The active mode definition. */
export function getActiveMode() {
  return modes.get(activeModeId) || modes.get(DEFAULT_MODE_ID) || null;
}

/** @returns {string} The active mode id. */
export function getActiveModeId() {
  return activeModeId;
}

/**
 * Filter the cards of a store through a mode's accepts().
 * @param {{cards: Object}} store
 * @param {string} modeId
 * @returns {Object[]}
 */
export function filterCardsForMode(store, modeId) {
  const mode = modes.get(modeId);
  if (!mode || !store || !store.cards) return [];
  return Object.values(store.cards).filter(card => {
    try {
      return !!mode.accepts(card);
    } catch (_err) {
      return false;
    }
  });
}

/** Remove all modes and reset the active mode (test helper). */
export function clearAppModes() {
  modes.clear();
  activeModeId = DEFAULT_MODE_ID;
}

/**
 * Register the initial stub modes. Each filters cards by kind; rendering
 * falls back to the current card list/detail views until a shell provides
 * custom renderers.
 */
export function registerBuiltInModes() {
  const byKinds = (...kinds) => (card) => kinds.includes(getCardKind(card));
  registerAppMode({ id: 'cardspoke', title: 'CardSpoke', icon: 'grid', accepts: () => true });
  registerAppMode({ id: 'repository', title: 'Repository', icon: 'book', accepts: byKinds('repository_page') });
  registerAppMode({ id: 'notes', title: 'Notes', icon: 'note', accepts: byKinds('note') });
  registerAppMode({ id: 'projects', title: 'Projects', icon: 'briefcase', accepts: byKinds('project', 'task') });
  registerAppMode({ id: 'decks', title: 'Decks', icon: 'monitor', accepts: byKinds('deck', 'slide') });
  registerAppMode({ id: 'contacts', title: 'Contacts', icon: 'users', accepts: byKinds('contact') });
  registerAppMode({ id: 'plants', title: 'Plant Pal', icon: 'leaf', accepts: byKinds('plant', 'care_log') });
}
