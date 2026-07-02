/**
 * Conversion Helper Tests
 * Covers kind conversions, preservation of title/body/tags, deck/project
 * outlines, reminders, and reversibility.
 */

import { test } from 'uvu';
import * as assert from 'uvu/assert';
import {
  convertCardKind,
  convertNoteToTask,
  convertNoteToSlide,
  createDeckFromOutline,
  createSlidesFromChildren,
  createProjectFromOutline,
  createReminderForCard,
  revertCardKind
} from '../www/src/core/conversions.js';
import { getCardKind, getKindData, setCardKind, validateTypedCard } from '../www/src/core/typed-cards.js';
import { createTestStore, createTestCard, addCardToStore } from './helpers.js';

function makeNote(store, title, body, tags = []) {
  const card = createTestCard(title, body);
  card.tags = tags;
  setCardKind(card, 'note');
  return addCardToStore(store, card);
}

test('note converts to task with valid modsData', () => {
  const store = createTestStore();
  const note = makeNote(store, 'Buy soil', 'For the monstera', ['plants']);

  const result = convertNoteToTask(store, note.id, { priority: 'high' });
  assert.ok(result.ok);

  const card = store.cards[note.id];
  assert.is(getCardKind(card), 'task');
  assert.is(card.title, 'Buy soil', 'title preserved');
  assert.is(card.body, 'For the monstera', 'body preserved');
  assert.equal(card.tags, ['plants'], 'tags preserved');
  const task = getKindData(card, 'task');
  assert.equal(task, { status: 'todo', priority: 'high', dueDate: null, completed: false });
  assert.ok(validateTypedCard(card).valid);
  assert.is(validateTypedCard(card).warnings.length, 0);
});

test('convertNoteToTask can move the task under a project', () => {
  const store = createTestStore();
  const project = addCardToStore(store, setCardKind(createTestCard('Project', ''), 'project'));
  const note = makeNote(store, 'Task note', '');

  convertNoteToTask(store, note.id, { projectId: project.id });
  assert.is(store.cards[note.id].parentId, project.id);
  assert.ok(store.cards[project.id].children.includes(note.id));
  assert.not.ok(store.rootOrder.includes(note.id));
});

test('note converts to slide and attaches to a deck with order', () => {
  const store = createTestStore();
  const deck = addCardToStore(store, setCardKind(createTestCard('Deck', ''), 'deck'));
  addCardToStore(store, setCardKind(createTestCard('Slide 1', '', deck.id), 'slide'));
  const note = makeNote(store, 'New slide', 'Bullet points');

  const result = convertNoteToSlide(store, note.id, deck.id);
  assert.ok(result.ok);
  const card = store.cards[note.id];
  assert.is(getCardKind(card), 'slide');
  assert.is(card.parentId, deck.id);
  assert.is(getKindData(card, 'slide').order, 2, 'appended after existing slide');
  assert.is(card.title, 'New slide');
});

test('outline converts to deck with children as ordered slides', () => {
  const store = createTestStore();
  const outline = addCardToStore(store, createTestCard('Talk outline', 'Overview'));
  const c1 = addCardToStore(store, createTestCard('Intro', '- hi', outline.id));
  const c2 = addCardToStore(store, createTestCard('Middle', '- meat', outline.id));

  const result = createDeckFromOutline(store, outline.id, { theme: 'dark' });
  assert.ok(result.ok);
  assert.is(result.deckId, outline.id);
  assert.equal(result.slideIds, [c1.id, c2.id]);

  assert.is(getCardKind(store.cards[outline.id]), 'deck');
  assert.is(getKindData(store.cards[outline.id], 'deck').theme, 'dark');
  assert.is(getKindData(store.cards[c1.id], 'slide').order, 1);
  assert.is(getKindData(store.cards[c2.id], 'slide').order, 2);
  assert.is(store.cards[c1.id].parentId, outline.id, 'hierarchy preserved');
  assert.is(store.cards[c1.id].title, 'Intro');
  assert.is(store.cards[c1.id].body, '- hi');
});

test('createSlidesFromChildren converts only direct children', () => {
  const store = createTestStore();
  const parent = addCardToStore(store, createTestCard('P', ''));
  const child = addCardToStore(store, createTestCard('C', '', parent.id));
  const grandchild = addCardToStore(store, createTestCard('G', '', child.id));

  const result = createSlidesFromChildren(store, parent.id);
  assert.equal(result.slideIds, [child.id]);
  assert.is(getCardKind(store.cards[grandchild.id]), 'generic');
});

test('outline converts to project with children as tasks', () => {
  const store = createTestStore();
  const outline = addCardToStore(store, createTestCard('Launch plan', ''));
  const step = addCardToStore(store, createTestCard('Write docs', '', outline.id));

  const result = createProjectFromOutline(store, outline.id);
  assert.ok(result.ok);
  assert.is(getCardKind(store.cards[outline.id]), 'project');
  assert.equal(result.taskIds, [step.id]);
  assert.is(getKindData(store.cards[step.id], 'task').status, 'todo');
});

test('createReminderForCard creates a scheduled reminder child', () => {
  const store = createTestStore();
  const plant = addCardToStore(store, setCardKind(createTestCard('Monstera', ''), 'plant'));

  const result = createReminderForCard(store, plant.id, {
    type: 'plant.water',
    dueAt: '2026-07-09T09:00:00',
    repeat: { every: 7, unit: 'days' }
  });
  assert.ok(result.ok);
  const reminder = store.cards[result.reminderId];
  assert.is(getCardKind(reminder), 'reminder');
  assert.is(reminder.parentId, plant.id);
  const data = getKindData(reminder, 'reminder');
  assert.is(data.targetCardId, plant.id);
  assert.is(data.type, 'plant.water');
  assert.is(data.status, 'scheduled');
  assert.equal(data.repeat, { every: 7, unit: 'days' });
  assert.ok(store.cards[plant.id].children.includes(result.reminderId));
});

test('conversions record previousKind and are revertible', () => {
  const store = createTestStore();
  const note = makeNote(store, 'N', 'body');
  convertCardKind(store, note.id, 'task');
  assert.is(store.cards[note.id].modsData.previousKind, 'note');
  // Original note payload is still there.
  assert.equal(store.cards[note.id].modsData.note, { pinned: false });

  const reverted = revertCardKind(store, note.id);
  assert.ok(reverted.ok);
  assert.is(getCardKind(store.cards[note.id]), 'note');
});

test('conversions route through shell ops when provided', () => {
  const store = createTestStore();
  const note = makeNote(store, 'N', '');
  const updates = [];
  const ops = {
    updateCard: (id, fields) => {
      updates.push(id);
      Object.assign(store.cards[id], fields);
    }
  };
  const result = convertNoteToTask(store, note.id, { ops });
  assert.ok(result.ok);
  assert.equal(updates, [note.id], 'change went through shell updateCard');
  assert.is(getCardKind(store.cards[note.id]), 'task');
});

test('converting a missing card fails cleanly', () => {
  const store = createTestStore();
  const result = convertCardKind(store, 'nope', 'task');
  assert.not.ok(result.ok);
  assert.ok(result.error.includes('not found'));
});

test.run();
