/**
 * Typed-Card Migration Tests
 * Covers store/card migration idempotency, unknown-kind preservation,
 * default fill-in, and registered kind data migrations.
 */

import { test } from 'uvu';
import * as assert from 'uvu/assert';
import {
  migrateStore,
  migrateCard,
  migrateTypedCard,
  migrateKindData,
  registerKindMigration,
  clearKindMigrations
} from '../www/src/core/migrations.js';
import { setCardKind, getKindData } from '../www/src/core/typed-cards.js';
import { createTestStore, createTestCard, addCardToStore } from './helpers.js';

test.after.each(() => clearKindMigrations());

test('migrateStore is idempotent', () => {
  const store = createTestStore();
  const task = createTestCard('T', '');
  task.modsData = { kind: 'task', schemaVersion: 1, task: { status: 'todo' } };
  addCardToStore(store, task);
  addCardToStore(store, createTestCard('Legacy', ''));

  const first = migrateStore(store);
  assert.ok(first.changed, 'first run fills missing task defaults');
  const second = migrateStore(store);
  assert.not.ok(second.changed, 'second run changes nothing');
  assert.is(second.migratedCount, 0);
});

test('migration fills missing defaults without overwriting existing data', () => {
  const card = createTestCard('T', '');
  card.modsData = { kind: 'task', schemaVersion: 1, task: { status: 'doing', custom: 'kept' } };
  const result = migrateTypedCard(card);
  assert.ok(result.changed);
  const task = getKindData(card, 'task');
  assert.is(task.status, 'doing', 'existing value untouched');
  assert.is(task.custom, 'kept', 'unknown field preserved');
  assert.is(task.completed, false, 'missing default filled');
  assert.is(task.priority, 'medium');
});

test('unknown kinds pass through migration untouched', () => {
  const card = createTestCard('Future', '');
  card.modsData = { kind: 'hologram', schemaVersion: 9, hologram: { depth: 4 } };
  const before = JSON.stringify(card.modsData);
  const result = migrateTypedCard(card);
  assert.not.ok(result.changed);
  assert.is(JSON.stringify(card.modsData), before);
});

test('legacy cards pass through migration untouched', () => {
  const card = createTestCard('Legacy', '');
  const result = migrateTypedCard(card);
  assert.not.ok(result.changed);
  assert.equal(card.modsData, {});
});

test('malformed payload is replaced with defaults but original is preserved', () => {
  const card = createTestCard('Broken', '');
  card.modsData = { kind: 'note', schemaVersion: 1, note: 'oops' };
  const result = migrateTypedCard(card);
  assert.ok(result.changed);
  assert.ok(result.warnings.length > 0);
  assert.is(getKindData(card, 'note').pinned, false, 'defaults installed');
  assert.is(card.modsData.note__invalid, 'oops', 'original data not lost');
});

test('registered kind migrations upgrade versioned data', () => {
  // Simulate an old task payload (v0) using a legacy field name.
  registerKindMigration('task', 0, (data) => {
    const { done, ...rest } = data;
    return { ...rest, completed: !!done };
  });

  const upgraded = migrateKindData('task', { done: true, status: 'todo' }, 0, 1);
  assert.is(upgraded.completed, true);
  assert.is(upgraded.done, undefined);

  const card = createTestCard('Old task', '');
  card.modsData = { kind: 'task', schemaVersion: 0, task: { done: true } };
  migrateTypedCard(card);
  assert.is(card.modsData.schemaVersion, 1, 'schemaVersion bumped');
  assert.is(getKindData(card, 'task').completed, true, 'migration step applied');
});

test('a throwing kind migration leaves the card readable', () => {
  registerKindMigration('note', 0, () => { throw new Error('boom'); });
  const card = createTestCard('N', '');
  card.modsData = { kind: 'note', schemaVersion: 0, note: { pinned: true } };
  const result = migrateTypedCard(card);
  assert.ok(result.warnings.some(w => w.includes('boom')));
  assert.is(getKindData(card, 'note').pinned, true, 'data survived failed migration');
});

test('migrateCard repairs baseline card fields', () => {
  const card = { id: 'x', title: 'X', body: '' };
  const result = migrateCard(card);
  assert.ok(result.changed);
  assert.ok(Array.isArray(card.children));
  assert.ok(Array.isArray(card.tags));
  assert.equal(card.modsData, {});
});

test('migrateStore collects warnings per card without deleting data', () => {
  const store = createTestStore();
  const broken = createTestCard('B', '');
  broken.modsData = { kind: 'plant', schemaVersion: 1, plant: [] };
  addCardToStore(store, broken);
  const result = migrateStore(store);
  assert.ok(result.warnings.length > 0);
  assert.ok(store.cards[broken.id], 'card still present');
  assert.equal(store.cards[broken.id].modsData.plant__invalid, [], 'invalid payload preserved');
});

test.run();
