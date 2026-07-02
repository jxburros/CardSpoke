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
 * Conversion Utilities (CardSpoke Core)
 *
 * Transform cards between kinds without duplicating logic across app modes.
 * All helpers take the store as their first argument and are DOM-free.
 *
 * Principles (see docs/architecture/CONVERSIONS.md):
 *   - Preserve title/body/tags and parent/child relationships unless the
 *     conversion explicitly changes them.
 *   - Never delete original metadata: the previous kind is recorded under
 *     modsData.previousKind and old payloads stay in place, so conversions
 *     are reversible in practice.
 *   - Side effects (undo entries, save, render) belong to the shell: pass
 *     `options.ops = { createCard, updateCard, reparent }` to route changes
 *     through shell mechanisms; without ops the store is mutated directly.
 */

import {
  getCardKind, setCardKind, getKindData, updateKindData, GENERIC_KIND
} from './typed-cards.js';

/** Generate a unique card id (matches the kernel's format). */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/** Resolve the effective ops, falling back to direct store mutation. */
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
        title: title || '',
        body: body || '',
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
        store.cards[card.parentId].children =
          (store.cards[card.parentId].children || []).filter(c => c !== id);
      } else if (Array.isArray(store.rootOrder)) {
        store.rootOrder = store.rootOrder.filter(c => c !== id);
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

/**
 * Convert a card to a target kind, preserving title/body/tags and all
 * existing metadata. The previous kind is recorded for reversibility.
 * @param {{cards: Object}} store
 * @param {string} cardId
 * @param {string} targetKind
 * @param {Object} [options]
 * @param {Object} [options.payload] - Initial payload for the target kind.
 * @param {Object} [options.ops] - Shell operations (updateCard, …).
 * @returns {{ ok: boolean, cardId?: string, error?: string }}
 */
export function convertCardKind(store, cardId, targetKind, options = {}) {
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

/**
 * Convert a note (or generic) card into a task.
 * @param {{cards: Object}} store
 * @param {string} cardId
 * @param {Object} [options] - { projectId, dueDate, priority, ops }
 * @returns {{ ok: boolean, cardId?: string, error?: string }}
 */
export function convertNoteToTask(store, cardId, options = {}) {
  const result = convertCardKind(store, cardId, 'task', {
    ops: options.ops,
    payload: {
      status: 'todo',
      priority: options.priority || 'medium',
      dueDate: options.dueDate ?? null,
      completed: false
    }
  });
  if (result.ok && options.projectId && store.cards[options.projectId]) {
    resolveOps(store, options).reparent(cardId, options.projectId);
  }
  return result;
}

/**
 * Convert a note card into a slide, optionally moving it into a deck.
 * @param {{cards: Object}} store
 * @param {string} cardId
 * @param {string} [deckId] - Deck to attach the slide to.
 * @param {Object} [options] - { layout, ops }
 * @returns {{ ok: boolean, cardId?: string, error?: string }}
 */
export function convertNoteToSlide(store, cardId, deckId, options = {}) {
  const deck = deckId && store && store.cards ? store.cards[deckId] : null;
  const order = deck && Array.isArray(deck.children) ? deck.children.length + 1 : 1;
  const result = convertCardKind(store, cardId, 'slide', {
    ops: options.ops,
    payload: {
      layout: options.layout || 'title-bullets',
      speakerNotes: '',
      order
    }
  });
  if (result.ok && deck) {
    resolveOps(store, options).reparent(cardId, deckId);
  }
  return result;
}

/**
 * Turn an outline card into a deck: the card becomes a deck and each of
 * its direct children becomes a slide (ordered by current child order).
 * @param {{cards: Object}} store
 * @param {string} cardId
 * @param {Object} [options] - { theme, aspectRatio, ops }
 * @returns {{ ok: boolean, deckId?: string, slideIds?: string[], error?: string }}
 */
export function createDeckFromOutline(store, cardId, options = {}) {
  const card = store && store.cards && store.cards[cardId];
  if (!card) return { ok: false, error: `Card "${cardId}" not found` };

  const deckResult = convertCardKind(store, cardId, 'deck', {
    ops: options.ops,
    payload: {
      theme: options.theme || 'default',
      aspectRatio: options.aspectRatio || '16:9'
    }
  });
  if (!deckResult.ok) return deckResult;

  const slides = createSlidesFromChildren(store, cardId, options);
  return { ok: true, deckId: cardId, slideIds: slides.slideIds };
}

/**
 * Convert every direct child of a card into a slide with sequential order.
 * @param {{cards: Object}} store
 * @param {string} parentId
 * @param {Object} [options] - { layout, ops }
 * @returns {{ ok: boolean, slideIds: string[] }}
 */
export function createSlidesFromChildren(store, parentId, options = {}) {
  const parent = store && store.cards && store.cards[parentId];
  if (!parent) return { ok: false, slideIds: [] };
  const slideIds = [];
  (parent.children || []).forEach((childId, index) => {
    const result = convertCardKind(store, childId, 'slide', {
      ops: options.ops,
      payload: {
        layout: options.layout || 'title-bullets',
        speakerNotes: '',
        order: index + 1
      }
    });
    if (result.ok) slideIds.push(childId);
  });
  return { ok: true, slideIds };
}

/**
 * Turn an outline card into a project: the card becomes a project and each
 * direct child becomes a task.
 * @param {{cards: Object}} store
 * @param {string} cardId
 * @param {Object} [options] - { priority, ops }
 * @returns {{ ok: boolean, projectId?: string, taskIds?: string[], error?: string }}
 */
export function createProjectFromOutline(store, cardId, options = {}) {
  const card = store && store.cards && store.cards[cardId];
  if (!card) return { ok: false, error: `Card "${cardId}" not found` };

  const projectResult = convertCardKind(store, cardId, 'project', {
    ops: options.ops,
    payload: { status: 'active', priority: options.priority || 'medium', dueDate: null }
  });
  if (!projectResult.ok) return projectResult;

  const taskIds = [];
  (card.children || []).forEach(childId => {
    const result = convertCardKind(store, childId, 'task', {
      ops: options.ops,
      payload: { status: 'todo', priority: options.priority || 'medium', dueDate: null, completed: false }
    });
    if (result.ok) taskIds.push(childId);
  });
  return { ok: true, projectId: cardId, taskIds };
}

/**
 * Create a reminder card targeting another card. The reminder is created
 * as a child of the target card.
 * @param {{cards: Object}} store
 * @param {string} cardId - The card the reminder is about.
 * @param {Object} reminderData - { type, dueAt, repeat, title, ops }
 * @returns {{ ok: boolean, reminderId?: string, error?: string }}
 */
export function createReminderForCard(store, cardId, reminderData = {}) {
  const target = store && store.cards && store.cards[cardId];
  if (!target) return { ok: false, error: `Card "${cardId}" not found` };
  const ops = resolveOps(store, reminderData);

  const title = reminderData.title || `Reminder: ${target.title || 'Untitled'}`;
  const reminderId = ops.createCard(title, reminderData.body || '', cardId);
  if (!reminderId || !store.cards[reminderId]) {
    return { ok: false, error: 'Failed to create reminder card' };
  }

  const result = convertCardKind(store, reminderId, 'reminder', {
    ops: reminderData.ops,
    payload: {
      targetCardId: cardId,
      type: reminderData.type || 'general',
      dueAt: reminderData.dueAt ?? null,
      repeat: reminderData.repeat ?? null,
      status: 'scheduled'
    }
  });
  if (!result.ok) return result;
  return { ok: true, reminderId };
}

/**
 * Revert a converted card to its recorded previous kind (if any).
 * @param {{cards: Object}} store
 * @param {string} cardId
 * @param {Object} [options] - { ops }
 * @returns {{ ok: boolean, cardId?: string, error?: string }}
 */
export function revertCardKind(store, cardId, options = {}) {
  const card = store && store.cards && store.cards[cardId];
  if (!card) return { ok: false, error: `Card "${cardId}" not found` };
  const previousKind = card.modsData && card.modsData.previousKind;
  if (!previousKind) return { ok: false, error: 'No previous kind recorded' };
  return convertCardKind(store, cardId, previousKind, options);
}

export { getCardKind, getKindData, updateKindData };
