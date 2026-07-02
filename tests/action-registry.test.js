/**
 * Action Registry Tests
 * Covers register/list/filter/run/unregister plus core and typed-card
 * action definitions.
 */

import { test } from 'uvu';
import * as assert from 'uvu/assert';
import {
  registerAction,
  unregisterAction,
  getAction,
  listActions,
  getActionsForCard,
  runAction,
  clearActions,
  registerCoreCardActions,
  registerTypedCardActions
} from '../www/src/core/actions.js';
import { setCardKind, getKindData } from '../www/src/core/typed-cards.js';
import { createTestStore, createTestCard, addCardToStore } from './helpers.js';

test.before.each(() => clearActions());

test('registers, gets, lists, and unregisters an action', () => {
  assert.ok(registerAction({ id: 'test.hello', label: 'Hello', run: () => 'hi' }));
  assert.is(getAction('test.hello').label, 'Hello');
  assert.is(listActions().length, 1);
  assert.ok(unregisterAction('test.hello'));
  assert.is(getAction('test.hello'), null);
  assert.is(listActions().length, 0);
});

test('rejects invalid action definitions', () => {
  assert.not.ok(registerAction(null));
  assert.not.ok(registerAction({ id: 'no.run', label: 'X' }));
  assert.not.ok(registerAction({ label: 'no id', run: () => {} }));
});

test('getActionsForCard filters by card kind', () => {
  registerTypedCardActions();
  const task = setCardKind(createTestCard('T', ''), 'task');
  const note = setCardKind(createTestCard('N', ''), 'note');

  const taskActionIds = getActionsForCard(task).map(a => a.id);
  assert.ok(taskActionIds.includes('task.markDone'));
  assert.not.ok(taskActionIds.includes('note.convertToTask'));

  const noteActionIds = getActionsForCard(note).map(a => a.id);
  assert.ok(noteActionIds.includes('note.convertToTask'));
  assert.ok(noteActionIds.includes('note.convertToSlide'));
  assert.not.ok(noteActionIds.includes('task.markDone'));
});

test('runAction executes and reports unknown actions', () => {
  registerAction({ id: 'test.run', label: 'Run', run: () => 42 });
  const result = runAction('test.run', createTestCard('C', ''));
  assert.ok(result.ok);
  assert.is(result.result, 42);

  const missing = runAction('test.missing', createTestCard('C', ''));
  assert.not.ok(missing.ok);
  assert.ok(missing.error.includes('Unknown action'));
});

test('runAction refuses actions that do not apply', () => {
  registerTypedCardActions();
  const note = setCardKind(createTestCard('N', ''), 'note');
  const result = runAction('task.markDone', note);
  assert.not.ok(result.ok);
});

test('task.markDone / task.markTodo update task data through ctx.store', () => {
  registerTypedCardActions();
  const store = createTestStore();
  const task = addCardToStore(store, setCardKind(createTestCard('T', ''), 'task'));

  const done = runAction('task.markDone', task, { store });
  assert.ok(done.ok);
  assert.is(getKindData(store.cards[task.id], 'task').completed, true);
  assert.is(getKindData(store.cards[task.id], 'task').status, 'done');

  // markDone no longer applies; markTodo does.
  assert.not.ok(runAction('task.markDone', store.cards[task.id], { store }).ok);
  assert.ok(runAction('task.markTodo', store.cards[task.id], { store }).ok);
  assert.is(getKindData(store.cards[task.id], 'task').completed, false);
});

test('typed actions route through ctx.updateCard when provided', () => {
  registerTypedCardActions();
  const store = createTestStore();
  const task = addCardToStore(store, setCardKind(createTestCard('T', ''), 'task'));
  const calls = [];
  const ctx = {
    store,
    updateCard: (id, updates) => {
      calls.push({ id, updates });
      Object.assign(store.cards[id], updates);
    }
  };
  const result = runAction('task.markDone', task, ctx);
  assert.ok(result.ok);
  assert.is(calls.length, 1);
  assert.is(calls[0].id, task.id);
  assert.is(getKindData(store.cards[task.id], 'task').completed, true);
});

test('plant actions log watering and toggle tracking', () => {
  registerTypedCardActions();
  const store = createTestStore();
  const plant = addCardToStore(store, setCardKind(createTestCard('P', ''), 'plant'));

  runAction('plant.logWatering', plant, { store, now: 123456 });
  assert.is(getKindData(store.cards[plant.id], 'plant').lastWatered, 123456);

  runAction('plant.toggleTracking', store.cards[plant.id], { store });
  assert.is(getKindData(store.cards[plant.id], 'plant').trackingEnabled, true);
  runAction('plant.toggleTracking', store.cards[plant.id], { store });
  assert.is(getKindData(store.cards[plant.id], 'plant').trackingEnabled, false);
});

test('registerCoreCardActions maps existing behaviors to registered actions', () => {
  const log = [];
  registerCoreCardActions({
    edit: (card) => log.push(`edit:${card.id}`),
    bookmark: (card) => log.push(`bookmark:${card.id}`)
  });
  const ids = listActions().map(a => a.id);
  for (const expected of ['card.edit', 'card.bookmark', 'card.duplicate', 'card.share',
    'card.addChild', 'card.delete', 'card.importText']) {
    assert.ok(ids.includes(expected), `${expected} registered`);
  }

  const card = createTestCard('C', '');
  assert.ok(runAction('card.edit', card).ok);
  assert.is(log[0], `edit:${card.id}`);
  // Handlers not supplied are safe no-op stubs.
  assert.ok(runAction('card.share', card).ok);
});

test('workflow stubs report themselves and delegate to ctx capabilities', () => {
  registerTypedCardActions();
  const deck = setCardKind(createTestCard('D', ''), 'deck');
  const stub = runAction('deck.present', deck, {});
  assert.ok(stub.ok);
  assert.equal(stub.result, { stub: true, action: 'deck.present' });

  const wired = runAction('deck.present', deck, { present: () => 'presenting' });
  assert.is(wired.result, 'presenting');
});

test.run();
