/**
 * App Mode Registry Tests
 * Covers mode registration, active-mode switching, per-card mode lookup,
 * and the built-in stub modes' kind filtering.
 */

import { test } from 'uvu';
import * as assert from 'uvu/assert';
import {
  DEFAULT_MODE_ID,
  registerAppMode,
  unregisterAppMode,
  getAppMode,
  listAppModes,
  getModesForCard,
  setActiveMode,
  getActiveMode,
  getActiveModeId,
  filterCardsForMode,
  clearAppModes,
  registerBuiltInModes
} from '../www/src/core/app-modes.js';
import { setCardKind } from '../www/src/core/typed-cards.js';
import { createTestStore, createTestCard, addCardToStore } from './helpers.js';

test.before.each(() => {
  clearAppModes();
  registerBuiltInModes();
});

test('built-in stub modes are registered', () => {
  const ids = listAppModes().map(m => m.id);
  for (const expected of ['cardspoke', 'repository', 'notes', 'projects', 'decks', 'contacts', 'plants']) {
    assert.ok(ids.includes(expected), `mode "${expected}" registered`);
  }
});

test('registerAppMode and getAppMode round-trip', () => {
  registerAppMode({ id: 'custom', title: 'Custom', accepts: () => false });
  assert.is(getAppMode('custom').title, 'Custom');
  assert.not.ok(registerAppMode({ title: 'no id' }), 'id is required');
});

test('active mode defaults to cardspoke and can change', () => {
  assert.is(getActiveModeId(), DEFAULT_MODE_ID);
  setActiveMode('notes');
  assert.is(getActiveModeId(), 'notes');
  assert.is(getActiveMode().title, 'Notes');
});

test('setting an unknown mode falls back to the default', () => {
  setActiveMode('does-not-exist');
  assert.is(getActiveModeId(), DEFAULT_MODE_ID);
});

test('unregistering the active mode falls back to the default', () => {
  setActiveMode('plants');
  assert.ok(unregisterAppMode('plants'));
  assert.is(getActiveModeId(), DEFAULT_MODE_ID);
  assert.not.ok(unregisterAppMode(DEFAULT_MODE_ID), 'default mode cannot be removed');
});

test('getModesForCard returns modes accepting the card', () => {
  const task = setCardKind(createTestCard('T', ''), 'task');
  const ids = getModesForCard(task).map(m => m.id);
  assert.ok(ids.includes('cardspoke'), 'default mode accepts everything');
  assert.ok(ids.includes('projects'), 'projects mode accepts tasks');
  assert.not.ok(ids.includes('notes'));
});

test('stub modes filter cards by kind', () => {
  const store = createTestStore();
  const note = addCardToStore(store, setCardKind(createTestCard('N', ''), 'note'));
  const project = addCardToStore(store, setCardKind(createTestCard('P', ''), 'project'));
  const task = addCardToStore(store, setCardKind(createTestCard('T', ''), 'task'));
  const plant = addCardToStore(store, setCardKind(createTestCard('Pl', ''), 'plant'));
  const legacy = addCardToStore(store, createTestCard('L', ''));

  assert.equal(filterCardsForMode(store, 'notes').map(c => c.id), [note.id]);
  const projectIds = filterCardsForMode(store, 'projects').map(c => c.id).sort();
  assert.equal(projectIds, [project.id, task.id].sort());
  assert.equal(filterCardsForMode(store, 'plants').map(c => c.id), [plant.id]);
  assert.is(filterCardsForMode(store, 'cardspoke').length, 5, 'default mode shows all cards');
  assert.ok(filterCardsForMode(store, 'cardspoke').some(c => c.id === legacy.id));
});

test('a throwing accepts() is treated as not accepting', () => {
  registerAppMode({ id: 'explosive', title: 'Boom', accepts: () => { throw new Error('x'); } });
  const card = createTestCard('C', '');
  assert.not.ok(getModesForCard(card).some(m => m.id === 'explosive'));
  assert.equal(filterCardsForMode({ cards: { [card.id]: card } }, 'explosive'), []);
});

test.run();
