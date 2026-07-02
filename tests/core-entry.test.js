/**
 * Core Entry Tests
 * Verifies the core-only import path (www/src/core/index.js) works without
 * any DOM: kernel CRUD, typed cards, queries, actions, conversions,
 * profiles, modes, and import/export all reachable from one entry.
 */

import { test } from 'uvu';
import * as assert from 'uvu/assert';
import * as Core from '../www/src/core/index.js';

test('core entry loads in Node without touching the DOM', () => {
  // Importing the core entry must not require document/window — the import
  // at the top of this file already proves it doesn't throw headlessly.
  assert.type(Core.Kernel, 'function');
});

test('core entry exposes the reusable platform surface', () => {
  const expected = [
    // kernel
    'Kernel', 'uid', 'cloneCard',
    // typed cards
    'getCardKind', 'isCardKind', 'setCardKind', 'getKindData', 'updateKindData',
    'validateTypedCard', 'listCardsByKind', 'listChildrenByKind',
    // queries
    'listRootCardsByKind', 'findCardsByKindAndTag', 'findDueReminders',
    'findTasksDueToday', 'findPlantsWithTrackingEnabled', 'evaluateCollection',
    // migrations
    'migrateStore', 'migrateCard', 'migrateTypedCard', 'migrateKindData',
    // actions
    'registerAction', 'unregisterAction', 'getAction', 'listActions',
    'getActionsForCard', 'runAction',
    // conversions
    'convertCardKind', 'convertNoteToTask', 'convertNoteToSlide',
    'createDeckFromOutline', 'createSlidesFromChildren', 'createProjectFromOutline',
    'createReminderForCard',
    // modes
    'registerAppMode', 'unregisterAppMode', 'getAppMode', 'listAppModes',
    'getModesForCard', 'setActiveMode', 'getActiveMode',
    // profiles
    'resolveProfile', 'getFeatureFlags', 'setActiveProfile', 'getActiveProfile',
    'isFeatureEnabled',
    // import/export
    'exportCards', 'prepareImportCards'
  ];
  for (const name of expected) {
    assert.type(Core[name], 'function', `Core.${name} is exported`);
  }
});

test('an end-to-end core flow works headlessly', () => {
  // Create cards with the kernel, type them, query, convert, export.
  const kernel = new Core.Kernel();
  const { id: projectId } = kernel.createCard('OS Suite', 'Parent project');
  const { id: noteId } = kernel.createCard('Prep typed cards', 'Define schema', projectId);

  const store = kernel.snapshot();
  Core.setCardKind(store.cards[projectId], 'project');
  Core.setCardKind(store.cards[noteId], 'note');

  assert.is(Core.listCardsByKind(store, 'project').length, 1);

  const converted = Core.convertNoteToTask(store, noteId, { priority: 'high' });
  assert.ok(converted.ok);
  assert.is(Core.getCardKind(store.cards[noteId]), 'task');
  assert.is(Core.listChildrenByKind(store, projectId, 'task').length, 1);

  const migration = Core.migrateStore(store);
  assert.ok(migration.warnings.length === 0);

  const exported = Core.exportCards(store, { format: 'json', kinds: ['project', 'task'] });
  assert.is(exported.count, 2);
  const imported = Core.prepareImportCards(exported.content);
  assert.ok(imported.ok);
  assert.equal(imported.cards[noteId].modsData.task, store.cards[noteId].modsData.task);
});

test.run();
