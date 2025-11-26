/**
 * Tag Management Tests
 * Tests for the tag management system added in v0.12.0
 */

import { test } from 'uvu';
import * as assert from 'uvu/assert';

// Mock store and functions
let store = { rootOrder: [], cards: {}, mods: {}, bookmarks: [], recentCards: [] };

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function createCard(title, body, tags = []) {
  const id = uid();
  store.cards[id] = {
    id,
    title: title || '',
    body: body || '',
    parentId: null,
    children: [],
    tags: tags,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  store.rootOrder.push(id);
  return id;
}

function renameTag(oldTag, newTag) {
  const normalizedOld = oldTag.replace(/^#/, '').toLowerCase().trim();
  const normalizedNew = newTag.replace(/^#/, '').toLowerCase().trim();
  
  if (!normalizedOld || !normalizedNew) return 0;
  if (normalizedOld === normalizedNew) return 0;
  
  let count = 0;
  Object.values(store.cards).forEach(card => {
    if (card.tags && card.tags.includes(normalizedOld)) {
      card.tags = card.tags.map(t => t === normalizedOld ? normalizedNew : t);
      card.tags = [...new Set(card.tags)];
      card.updatedAt = Date.now();
      count++;
    }
  });
  
  return count;
}

function mergeTags(tag1, tag2) {
  return renameTag(tag1, tag2);
}

function deleteTagGlobal(tag) {
  const normalizedTag = tag.replace(/^#/, '').toLowerCase().trim();
  if (!normalizedTag) return 0;
  
  let count = 0;
  Object.values(store.cards).forEach(card => {
    if (card.tags && card.tags.includes(normalizedTag)) {
      card.tags = card.tags.filter(t => t !== normalizedTag);
      card.updatedAt = Date.now();
      count++;
    }
  });
  
  return count;
}

function getTagStats() {
  const tagCounts = {};
  Object.values(store.cards).forEach(card => {
    if (card.tags) {
      card.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    }
  });
  return Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

// Reset before each test
function resetStore() {
  store = { rootOrder: [], cards: {}, mods: {}, bookmarks: [], recentCards: [] };
}

test('renameTag renames tag across all cards', () => {
  resetStore();
  
  createCard('Card 1', '', ['work', 'important']);
  createCard('Card 2', '', ['work', 'personal']);
  createCard('Card 3', '', ['personal']);
  
  const affected = renameTag('work', 'business');
  
  assert.is(affected, 2);
  
  const tagStats = getTagStats();
  const businessTag = tagStats.find(t => t.tag === 'business');
  const workTag = tagStats.find(t => t.tag === 'work');
  
  assert.ok(businessTag);
  assert.is(businessTag.count, 2);
  assert.not.ok(workTag);
});

test('renameTag handles # prefix', () => {
  resetStore();
  
  createCard('Card 1', '', ['tag1']);
  
  const affected = renameTag('#tag1', '#tag2');
  
  assert.is(affected, 1);
  
  const tagStats = getTagStats();
  assert.ok(tagStats.find(t => t.tag === 'tag2'));
});

test('renameTag returns 0 for same tag', () => {
  resetStore();
  
  createCard('Card 1', '', ['work']);
  
  const affected = renameTag('work', 'work');
  
  assert.is(affected, 0);
});

test('mergeTags combines tags', () => {
  resetStore();
  
  createCard('Card 1', '', ['javascript']);
  createCard('Card 2', '', ['js']);
  createCard('Card 3', '', ['javascript', 'react']);
  
  const affected = mergeTags('js', 'javascript');
  
  assert.is(affected, 1);
  
  const tagStats = getTagStats();
  const jsTag = tagStats.find(t => t.tag === 'javascript');
  
  assert.is(jsTag.count, 3);
});

test('deleteTagGlobal removes tag from all cards', () => {
  resetStore();
  
  createCard('Card 1', '', ['delete-me', 'keep']);
  createCard('Card 2', '', ['delete-me']);
  createCard('Card 3', '', ['keep']);
  
  const affected = deleteTagGlobal('delete-me');
  
  assert.is(affected, 2);
  
  const tagStats = getTagStats();
  assert.not.ok(tagStats.find(t => t.tag === 'delete-me'));
  assert.ok(tagStats.find(t => t.tag === 'keep'));
});

test('getTagStats returns correct counts', () => {
  resetStore();
  
  createCard('Card 1', '', ['popular', 'common']);
  createCard('Card 2', '', ['popular']);
  createCard('Card 3', '', ['popular', 'common']);
  createCard('Card 4', '', ['rare']);
  
  const tagStats = getTagStats();
  
  assert.is(tagStats.length, 3);
  assert.is(tagStats[0].tag, 'popular');
  assert.is(tagStats[0].count, 3);
  assert.is(tagStats[1].tag, 'common');
  assert.is(tagStats[1].count, 2);
  assert.is(tagStats[2].tag, 'rare');
  assert.is(tagStats[2].count, 1);
});

test('getTagStats returns empty array when no tags', () => {
  resetStore();
  
  createCard('Card 1', '', []);
  createCard('Card 2', '', []);
  
  const tagStats = getTagStats();
  
  assert.is(tagStats.length, 0);
});

test('renameTag removes duplicates after rename', () => {
  resetStore();
  
  createCard('Card 1', '', ['old-tag', 'new-tag']);
  
  const affected = renameTag('old-tag', 'new-tag');
  
  assert.is(affected, 1);
  
  const card = Object.values(store.cards)[0];
  assert.is(card.tags.length, 1);
  assert.is(card.tags[0], 'new-tag');
});

test.run();
