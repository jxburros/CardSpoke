/**
 * Typed Card Tests
 * Covers the typed-card convention: kinds, validation, kind data helpers,
 * legacy compatibility, and unknown-kind preservation.
 */

import { test } from 'uvu';
import * as assert from 'uvu/assert';
import {
  CARD_KINDS,
  GENERIC_KIND,
  getCardKind,
  isCardKind,
  setCardKind,
  getKindData,
  updateKindData,
  validateTypedCard,
  listCardsByKind,
  listChildrenByKind,
  createTypedModsData,
  isKnownKind
} from '../www/src/core/typed-cards.js';
import { createTestStore, createTestCard, addCardToStore } from './helpers.js';

test('all directive kinds are registered', () => {
  const expected = ['note', 'repository_page', 'project', 'task', 'deck', 'slide',
    'contact', 'plant', 'care_log', 'reminder', 'collection'];
  for (const kind of expected) {
    assert.ok(CARD_KINDS.includes(kind), `kind "${kind}" should be registered`);
    assert.ok(isKnownKind(kind));
  }
});

test('legacy card without modsData.kind reports generic kind and stays valid', () => {
  const card = createTestCard('Legacy', 'Body');
  assert.is(getCardKind(card), GENERIC_KIND);
  const result = validateTypedCard(card);
  assert.ok(result.valid);
  assert.is(result.warnings.length, 0);

  // Cards with no modsData at all are also fine.
  const bare = { id: 'x', title: 'Bare', body: '' };
  assert.is(getCardKind(bare), GENERIC_KIND);
  assert.ok(validateTypedCard(bare).valid);
});

test('setCardKind assigns kind, schemaVersion, and default payload', () => {
  const card = createTestCard('Note', 'Body');
  setCardKind(card, 'note', { pinned: true });
  assert.is(card.modsData.kind, 'note');
  assert.is(card.modsData.schemaVersion, 1);
  assert.equal(card.modsData.note, { pinned: true });
  assert.ok(isCardKind(card, 'note'));
});

test('setCardKind preserves existing plugin metadata in modsData', () => {
  const card = createTestCard('Note', 'Body');
  card.modsData = { somePlugin: { theme: 'dark' } };
  setCardKind(card, 'task');
  assert.equal(card.modsData.somePlugin, { theme: 'dark' });
  assert.is(card.modsData.kind, 'task');
  assert.is(card.modsData.task.completed, false);
});

test('getKindData and updateKindData round-trip', () => {
  const card = createTestCard('Task', '');
  setCardKind(card, 'task');
  assert.is(getKindData(card, 'task').status, 'todo');

  updateKindData(card, 'task', { status: 'done', completed: true });
  assert.is(getKindData(card, 'task').status, 'done');
  assert.is(getKindData(card, 'task').completed, true);
  // Untouched defaults remain.
  assert.is(getKindData(card, 'task').priority, 'medium');
});

test('known typed card validates without warnings', () => {
  const card = createTestCard('Plant', '');
  setCardKind(card, 'plant', { species: 'Monstera deliciosa' });
  const result = validateTypedCard(card);
  assert.ok(result.valid);
  assert.ok(result.known);
  assert.is(result.warnings.length, 0);
});

test('unknown kind is preserved and produces a warning, not data loss', () => {
  const card = createTestCard('Future', '');
  card.modsData = { kind: 'hologram', schemaVersion: 3, hologram: { depth: 4 } };
  const result = validateTypedCard(card);
  assert.ok(result.valid, 'unknown kinds stay valid');
  assert.not.ok(result.known);
  assert.ok(result.warnings.length > 0);
  // Nothing was stripped.
  assert.equal(card.modsData.hologram, { depth: 4 });
  assert.is(getCardKind(card), 'hologram');
});

test('invalid kind payload produces warning, not data loss', () => {
  const card = createTestCard('Broken', '');
  card.modsData = { kind: 'note', schemaVersion: '1', note: 'not-an-object' };
  const result = validateTypedCard(card);
  assert.ok(result.valid);
  assert.ok(result.warnings.length >= 2, 'warn on schemaVersion type and payload type');
  assert.is(card.modsData.note, 'not-an-object', 'original data untouched');
});

test('listCardsByKind returns only cards of that kind', () => {
  const store = createTestStore();
  const note = addCardToStore(store, setCardKind(createTestCard('N', ''), 'note'));
  addCardToStore(store, setCardKind(createTestCard('T', ''), 'task'));
  addCardToStore(store, createTestCard('Legacy', ''));

  const notes = listCardsByKind(store, 'note');
  assert.is(notes.length, 1);
  assert.is(notes[0].id, note.id);
  assert.is(listCardsByKind(store, 'task').length, 1);
  assert.is(listCardsByKind(store, 'unknown_kind').length, 0, 'unknown kind returns empty list');
});

test('listChildrenByKind returns only matching direct children', () => {
  const store = createTestStore();
  const deck = addCardToStore(store, setCardKind(createTestCard('Deck', ''), 'deck'));
  const slide1 = addCardToStore(store, setCardKind(createTestCard('S1', '', deck.id), 'slide'));
  addCardToStore(store, setCardKind(createTestCard('Note child', '', deck.id), 'note'));
  // Grandchild slide must not be included.
  addCardToStore(store, setCardKind(createTestCard('S2', '', slide1.id), 'slide'));

  const slides = listChildrenByKind(store, deck.id, 'slide');
  assert.is(slides.length, 1);
  assert.is(slides[0].id, slide1.id);
  assert.is(listChildrenByKind(store, deck.id, 'plant').length, 0);
});

test('listChildrenByKind with null parent lists root cards', () => {
  const store = createTestStore();
  const rootNote = addCardToStore(store, setCardKind(createTestCard('Root note', ''), 'note'));
  const parent = addCardToStore(store, createTestCard('Parent', ''));
  addCardToStore(store, setCardKind(createTestCard('Child note', '', parent.id), 'note'));

  const rootNotes = listChildrenByKind(store, null, 'note');
  assert.is(rootNotes.length, 1);
  assert.is(rootNotes[0].id, rootNote.id);
});

test('createTypedModsData builds a complete block', () => {
  const mods = createTypedModsData('reminder', { targetCardId: 'abc', dueAt: '2026-07-09T09:00:00' });
  assert.is(mods.kind, 'reminder');
  assert.is(mods.schemaVersion, 1);
  assert.is(mods.reminder.targetCardId, 'abc');
  assert.is(mods.reminder.status, 'scheduled');
});

test.run();
