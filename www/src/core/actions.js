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
 * Shared Action Registry (CardSpoke Core)
 *
 * Generalizes hardcoded card actions (edit, bookmark, duplicate, …) into a
 * registry that shells and app modes share. Actions declare which cards they
 * apply to and receive a context object (`ctx`) from the calling shell with
 * whatever side-effect capabilities it provides (store, updateCard, save,
 * navigate, toast, …). The registry itself is DOM-free.
 *
 * See docs/architecture/ACTION_REGISTRY.md.
 */

import { getCardKind, getKindData, updateKindData } from './typed-cards.js';

/** @type {Map<string, Object>} */
const actions = new Map();

/**
 * Register an action.
 * @param {Object} action
 * @param {string} action.id - Unique action id, e.g. "task.markDone".
 * @param {string} action.label - Human-readable label.
 * @param {string} [action.icon] - Icon hint for shells.
 * @param {Function} [action.appliesTo] - (card, ctx) => boolean. Defaults to always.
 * @param {Function} action.run - (card, ctx) => any.
 * @returns {boolean} True if registered.
 */
export function registerAction(action) {
  if (!action || typeof action.id !== 'string' || !action.id) return false;
  if (typeof action.run !== 'function') return false;
  actions.set(action.id, {
    icon: null,
    appliesTo: () => true,
    ...action
  });
  return true;
}

/**
 * Remove an action from the registry.
 * @param {string} actionId
 * @returns {boolean} True if it existed.
 */
export function unregisterAction(actionId) {
  return actions.delete(actionId);
}

/**
 * Look up a single action.
 * @param {string} actionId
 * @returns {Object|null}
 */
export function getAction(actionId) {
  return actions.get(actionId) || null;
}

/**
 * List all registered actions.
 * @returns {Object[]}
 */
export function listActions() {
  return Array.from(actions.values());
}

/**
 * List the actions applicable to a card in a given context.
 * An appliesTo() that throws is treated as "does not apply".
 * @param {Object} card
 * @param {Object} [ctx]
 * @returns {Object[]}
 */
export function getActionsForCard(card, ctx = {}) {
  return listActions().filter(action => {
    try {
      return !!action.appliesTo(card, ctx);
    } catch (_err) {
      return false;
    }
  });
}

/**
 * Run an action by id.
 * @param {string} actionId
 * @param {Object} card
 * @param {Object} [ctx]
 * @returns {{ ok: boolean, result?: any, error?: string }}
 */
export function runAction(actionId, card, ctx = {}) {
  const action = actions.get(actionId);
  if (!action) return { ok: false, error: `Unknown action "${actionId}"` };
  try {
    if (!action.appliesTo(card, ctx)) {
      return { ok: false, error: `Action "${actionId}" does not apply to this card` };
    }
    const result = action.run(card, ctx);
    return { ok: true, result };
  } catch (err) {
    return { ok: false, error: (err && err.message) || String(err) };
  }
}

/** Remove every registered action (test helper). */
export function clearActions() {
  actions.clear();
}

// ── Built-in action definitions ──────────────────────────────────────────────
//
// Core card actions delegate their side effects to handlers supplied by the
// shell via `handlers` (registerCoreCardActions) or per-call via `ctx`.
// Typed-card actions that only touch card data run through ctx.updateCard
// when available, falling back to direct mutation of ctx.store.

/**
 * Apply a modsData change through the context's card-update capability.
 * @param {Object} card
 * @param {Object} ctx
 * @param {Function} mutate - (card) => void, mutates the card object.
 */
function applyCardChange(card, ctx, mutate) {
  if (ctx && typeof ctx.updateCard === 'function') {
    // Work on a clone so the shell's updateCard sees a clean before/after.
    const draft = JSON.parse(JSON.stringify(card));
    mutate(draft);
    ctx.updateCard(card.id, { modsData: draft.modsData });
    return draft;
  }
  const target = (ctx && ctx.store && ctx.store.cards && ctx.store.cards[card.id]) || card;
  mutate(target);
  return target;
}

/**
 * Register the existing hardcoded card behaviors as shared actions.
 * The shell supplies concrete handlers; missing handlers make the matching
 * action a safe no-op stub so contracts exist ahead of full wiring.
 * @param {Object} [handlers]
 * @param {Function} [handlers.edit] - (card, ctx)
 * @param {Function} [handlers.bookmark] - (card, ctx)
 * @param {Function} [handlers.duplicate] - (card, ctx)
 * @param {Function} [handlers.share] - (card, ctx)
 * @param {Function} [handlers.addChild] - (card, ctx)
 * @param {Function} [handlers.remove] - (card, ctx)
 * @param {Function} [handlers.importText] - (card, ctx)
 */
export function registerCoreCardActions(handlers = {}) {
  const defs = [
    { id: 'card.edit', label: 'Edit', icon: 'edit', handler: handlers.edit },
    { id: 'card.bookmark', label: 'Bookmark', icon: 'bookmark', handler: handlers.bookmark },
    { id: 'card.duplicate', label: 'Duplicate', icon: 'copy', handler: handlers.duplicate },
    { id: 'card.share', label: 'Share', icon: 'share', handler: handlers.share },
    { id: 'card.addChild', label: 'Add Child', icon: 'plus', handler: handlers.addChild },
    { id: 'card.delete', label: 'Delete', icon: 'trash', handler: handlers.remove },
    { id: 'card.importText', label: 'Import TXT', icon: 'upload', handler: handlers.importText }
  ];
  for (const def of defs) {
    registerAction({
      id: def.id,
      label: def.label,
      icon: def.icon,
      appliesTo: () => true,
      run: (card, ctx) => (typeof def.handler === 'function' ? def.handler(card, ctx) : undefined)
    });
  }
}

/**
 * Register the typed-card actions. Data-only actions (task status, plant
 * tracking/watering) are functional; workflow actions that need conversions
 * or UI are contract stubs that delegate to ctx capabilities when provided.
 */
export function registerTypedCardActions() {
  registerAction({
    id: 'task.markDone',
    label: 'Mark Done',
    icon: 'check',
    appliesTo: (card) => {
      if (getCardKind(card) !== 'task') return false;
      const task = getKindData(card, 'task');
      return !(task && task.completed);
    },
    run: (card, ctx) => applyCardChange(card, ctx, c => {
      updateKindData(c, 'task', { completed: true, status: 'done' });
    })
  });

  registerAction({
    id: 'task.markTodo',
    label: 'Mark To-Do',
    icon: 'circle',
    appliesTo: (card) => {
      if (getCardKind(card) !== 'task') return false;
      const task = getKindData(card, 'task');
      return !!(task && task.completed);
    },
    run: (card, ctx) => applyCardChange(card, ctx, c => {
      updateKindData(c, 'task', { completed: false, status: 'todo' });
    })
  });

  registerAction({
    id: 'plant.logWatering',
    label: 'Log Watering',
    icon: 'droplet',
    appliesTo: (card) => getCardKind(card) === 'plant',
    run: (card, ctx) => applyCardChange(card, ctx, c => {
      updateKindData(c, 'plant', { lastWatered: (ctx && ctx.now) || Date.now() });
    })
  });

  registerAction({
    id: 'plant.toggleTracking',
    label: 'Toggle Tracking',
    icon: 'activity',
    appliesTo: (card) => getCardKind(card) === 'plant',
    run: (card, ctx) => applyCardChange(card, ctx, c => {
      const plant = getKindData(c, 'plant') || {};
      updateKindData(c, 'plant', { trackingEnabled: !plant.trackingEnabled });
    })
  });

  // Workflow stubs — contracts exist; shells wire real behavior via ctx.
  const stubs = [
    { id: 'note.convertToTask', label: 'Convert to Task', icon: 'check-square', kind: 'note', capability: 'convertNoteToTask' },
    { id: 'note.convertToSlide', label: 'Convert to Slide', icon: 'monitor', kind: 'note', capability: 'convertNoteToSlide' },
    { id: 'project.addTask', label: 'Add Task', icon: 'plus', kind: 'project', capability: 'addTask' },
    { id: 'deck.addSlide', label: 'Add Slide', icon: 'plus', kind: 'deck', capability: 'addSlide' },
    { id: 'deck.present', label: 'Present', icon: 'play', kind: 'deck', capability: 'present' },
    { id: 'contact.addNote', label: 'Add Note', icon: 'file-text', kind: 'contact', capability: 'addNote' }
  ];
  for (const stub of stubs) {
    registerAction({
      id: stub.id,
      label: stub.label,
      icon: stub.icon,
      appliesTo: (card) => getCardKind(card) === stub.kind,
      run: (card, ctx) => {
        if (ctx && typeof ctx[stub.capability] === 'function') {
          return ctx[stub.capability](card, ctx);
        }
        return { stub: true, action: stub.id };
      }
    });
  }
}
