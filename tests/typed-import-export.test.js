/**
 * Typed Import/Export Tests
 * Covers kind-filterable exports across formats, JSON round trips, and
 * modsData preservation (including unknown future kinds).
 */

import { test } from 'uvu';
import * as assert from 'uvu/assert';
import {
  EXPORT_FORMATS,
  selectCardsForExport,
  exportCards,
  prepareImportCards,
  collectSubtree
} from '../www/src/core/import-export.js';
import { setCardKind, getCardKind } from '../www/src/core/typed-cards.js';
import { createTestStore, createTestCard, addCardToStore } from './helpers.js';

function seedStore() {
  const store = createTestStore();
  const project = addCardToStore(store, setCardKind(createTestCard('Project', 'Parent project'), 'project'));
  const task = addCardToStore(store, setCardKind(createTestCard('Task 1', 'Do it', project.id), 'task'));
  const plant = addCardToStore(store, setCardKind(createTestCard('Monstera', 'Water weekly'), 'plant'));
  plant.tags = ['indoor'];
  const legacy = addCardToStore(store, createTestCard('Legacy note', 'Old data'));
  return { store, project, task, plant, legacy };
}

test('export by kind includes only matching cards', () => {
  const { store, task } = seedStore();
  const result = exportCards(store, { format: 'json', kind: 'task' });
  assert.ok(result.ok);
  assert.is(result.count, 1);
  const payload = JSON.parse(result.content);
  assert.equal(Object.keys(payload.cards), [task.id]);
});

test('export by multiple kinds', () => {
  const { store } = seedStore();
  const result = exportCards(store, { format: 'json', kinds: ['project', 'task'] });
  assert.is(result.count, 2);
});

test('export by rootId with includeChildren exports the subtree', () => {
  const { store, project, task } = seedStore();
  const withChildren = exportCards(store, { format: 'markdown', rootId: project.id, includeChildren: true });
  assert.is(withChildren.count, 2);
  assert.ok(withChildren.content.includes('# Project'));
  assert.ok(withChildren.content.includes('## Task 1'), 'child nested one heading deeper');

  const solo = exportCards(store, { format: 'json', rootId: project.id, includeChildren: false });
  assert.is(solo.count, 1);
  assert.is(collectSubtree(store, project.id).length, 2);
  void task;
});

test('export by tag', () => {
  const { store, plant } = seedStore();
  const result = selectCardsForExport(store, { tag: 'indoor' });
  assert.equal(result.map(c => c.id), [plant.id]);
});

test('all directive formats are supported', () => {
  const { store } = seedStore();
  assert.equal([...EXPORT_FORMATS], ['json', 'markdown', 'txt', 'csv', 'html']);
  for (const format of EXPORT_FORMATS) {
    const result = exportCards(store, { format });
    assert.ok(result.ok, `${format} export works`);
    assert.type(result.content, 'string');
    assert.ok(result.content.length > 0);
  }
  assert.not.ok(exportCards(store, { format: 'pptx' }).ok, 'PPTX is not in this phase');
});

test('CSV export includes the kind column and escapes cells', () => {
  const store = createTestStore();
  const tricky = addCardToStore(store, setCardKind(createTestCard('Has, comma', 'Line1\n"quoted"'), 'note'));
  const result = exportCards(store, { format: 'csv', kind: 'note' });
  const [header, row] = result.content.split('\n');
  assert.ok(header.includes('kind'));
  assert.ok(row.includes('"Has, comma"'));
  assert.ok(result.content.includes('""quoted""'));
  void tricky;
});

test('HTML export escapes markup', () => {
  const store = createTestStore();
  addCardToStore(store, createTestCard('<script>alert(1)</script>', 'a < b'));
  const result = exportCards(store, { format: 'html' });
  assert.not.ok(result.content.includes('<script>alert'), 'title escaped');
  assert.ok(result.content.includes('&lt;script&gt;'));
});

test('JSON round trip preserves modsData', () => {
  const { store, task } = seedStore();
  const exported = exportCards(store, { format: 'json', kind: 'task' });
  const imported = prepareImportCards(exported.content);
  assert.ok(imported.ok);
  const roundTripped = imported.cards[task.id];
  assert.is(getCardKind(roundTripped), 'task');
  assert.equal(roundTripped.modsData.task, store.cards[task.id].modsData.task);
});

test('unknown future modsData survives export and import untouched', () => {
  const store = createTestStore();
  const future = addCardToStore(store, createTestCard('Future card', ''));
  future.modsData = {
    kind: 'quantum_note',
    schemaVersion: 7,
    quantum_note: { superposition: true },
    pluginExtras: { anything: [1, 2, 3] }
  };

  const exported = exportCards(store, { format: 'json' });
  const imported = prepareImportCards(exported.content);
  assert.ok(imported.ok);
  assert.equal(imported.cards[future.id].modsData, future.modsData, 'nothing stripped');
  assert.ok(imported.warnings.some(w => w.includes('quantum_note')), 'unknown kind warned about');
});

test('import validates and migrates known typed cards', () => {
  const payload = {
    cards: {
      t1: {
        id: 't1', title: 'Old task', body: '', parentId: null, children: [],
        modsData: { kind: 'task', schemaVersion: 1, task: { status: 'todo' } }
      }
    },
    rootIds: ['t1']
  };
  const imported = prepareImportCards(payload);
  assert.ok(imported.ok);
  assert.is(imported.cards.t1.modsData.task.completed, false, 'missing defaults filled on import');
  // The input payload was not mutated.
  assert.is(payload.cards.t1.modsData.task.completed, undefined);
});

test('invalid typed metadata warns without data loss on import', () => {
  const imported = prepareImportCards({
    cards: {
      b1: { id: 'b1', title: 'Broken', body: '', modsData: { kind: 'note', note: 'oops' } }
    }
  });
  assert.ok(imported.ok);
  assert.ok(imported.warnings.length > 0);
  assert.is(imported.cards.b1.modsData.note__invalid, 'oops', 'original preserved');
});

test('prepareImportCards rejects malformed payloads cleanly', () => {
  assert.not.ok(prepareImportCards('{not json').ok);
  assert.not.ok(prepareImportCards(null).ok);
  assert.not.ok(prepareImportCards({ cards: 'nope' }).ok);
});

test.run();
