/**
 * Typed Query Helper Tests
 * Covers kind/tag queries, due reminders/tasks, plant tracking, and
 * collection card filter evaluation.
 */

import { test } from 'uvu';
import * as assert from 'uvu/assert';
import {
  listRootCardsByKind,
  findCardsByKindAndTag,
  findDueReminders,
  findTasksDueToday,
  findPlantsWithTrackingEnabled,
  evaluateCollection
} from '../www/src/core/queries.js';
import { setCardKind, updateKindData } from '../www/src/core/typed-cards.js';
import { createTestStore, createTestCard, addCardToStore } from './helpers.js';

function addTyped(store, title, kind, payload = {}, parentId = null, tags = []) {
  const card = createTestCard(title, '', parentId);
  card.tags = tags;
  setCardKind(card, kind, payload);
  return addCardToStore(store, card);
}

test('listRootCardsByKind returns only root cards of that kind', () => {
  const store = createTestStore();
  const rootProject = addTyped(store, 'Root project', 'project');
  addTyped(store, 'Child project', 'project', {}, rootProject.id);
  addTyped(store, 'Root note', 'note');

  const roots = listRootCardsByKind(store, 'project');
  assert.is(roots.length, 1);
  assert.is(roots[0].id, rootProject.id);
});

test('findCardsByKindAndTag matches kind and tag together', () => {
  const store = createTestStore();
  const indoor = addTyped(store, 'Monstera', 'plant', {}, null, ['plant', 'indoor']);
  addTyped(store, 'Oak', 'plant', {}, null, ['outdoor']);
  addTyped(store, 'Indoor note', 'note', {}, null, ['indoor']);

  const results = findCardsByKindAndTag(store, 'plant', 'indoor');
  assert.is(results.length, 1);
  assert.is(results[0].id, indoor.id);
  // Tag matching is case-insensitive and tolerates a leading '#'.
  assert.is(findCardsByKindAndTag(store, 'plant', '#INDOOR').length, 1);
});

test('findDueReminders returns scheduled reminders due at or before now', () => {
  const store = createTestStore();
  const due = addTyped(store, 'Water plant', 'reminder', {
    dueAt: '2026-07-01T09:00:00', status: 'scheduled'
  });
  addTyped(store, 'Future', 'reminder', { dueAt: '2026-07-20T09:00:00', status: 'scheduled' });
  addTyped(store, 'Done', 'reminder', { dueAt: '2026-06-01T09:00:00', status: 'completed' });
  addTyped(store, 'No due', 'reminder', { status: 'scheduled' });

  const now = new Date('2026-07-02T12:00:00').getTime();
  const results = findDueReminders(store, now);
  assert.is(results.length, 1);
  assert.is(results[0].id, due.id);
});

test('findTasksDueToday returns incomplete tasks due within the day', () => {
  const store = createTestStore();
  const today = addTyped(store, 'Due today', 'task', { dueDate: '2026-07-02T15:00:00' });
  addTyped(store, 'Due tomorrow', 'task', { dueDate: '2026-07-03T09:00:00' });
  addTyped(store, 'Done today', 'task', { dueDate: '2026-07-02T10:00:00', completed: true });
  addTyped(store, 'No due date', 'task');

  const now = new Date('2026-07-02T08:00:00').getTime();
  const results = findTasksDueToday(store, now);
  assert.is(results.length, 1);
  assert.is(results[0].id, today.id);
});

test('findPlantsWithTrackingEnabled filters on the tracking flag', () => {
  const store = createTestStore();
  const tracked = addTyped(store, 'Tracked', 'plant', { trackingEnabled: true });
  addTyped(store, 'Untracked', 'plant');
  assert.is(findPlantsWithTrackingEnabled(store).length, 1);
  assert.is(findPlantsWithTrackingEnabled(store)[0].id, tracked.id);
});

test('collection cards evaluate simple kind/tag/payload filters', () => {
  const store = createTestStore();
  const tracked = addTyped(store, 'Tracked indoor', 'plant', { trackingEnabled: true }, null, ['indoor']);
  addTyped(store, 'Untracked indoor', 'plant', {}, null, ['indoor']);
  addTyped(store, 'Tracked outdoor', 'plant', { trackingEnabled: true }, null, ['outdoor']);

  const collection = addTyped(store, 'Tracked indoor plants', 'collection', {
    filter: { kind: 'plant', tag: 'indoor', trackingEnabled: true },
    sort: 'title'
  });

  const results = evaluateCollection(store, collection);
  assert.is(results.length, 1);
  assert.is(results[0].id, tracked.id);
});

test('collection with kind-only filter matches all cards of the kind', () => {
  const store = createTestStore();
  addTyped(store, 'N1', 'note');
  addTyped(store, 'N2', 'note');
  addTyped(store, 'T1', 'task');
  const collection = addTyped(store, 'All notes', 'collection', { filter: { kind: 'note' } });
  assert.is(evaluateCollection(store, collection).length, 2);
});

test('evaluateCollection on a non-collection card returns empty', () => {
  const store = createTestStore();
  const note = addTyped(store, 'N', 'note');
  assert.equal(evaluateCollection(store, note), []);
});

test.run();
