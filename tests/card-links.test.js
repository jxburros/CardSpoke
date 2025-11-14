/**
 * Card Links Tests
 * Tests for parsing [[Card Name]] tokens
 */

import { test } from 'uvu';
import * as assert from 'uvu/assert';

// Mock functions matching app.js implementation
function parseCardLinks(text) {
  if (!text) return [];
  
  const regex = /\[\[([^\]]+)\]\]/g;
  const matches = [];
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    matches.push({
      match: match[0],
      cardName: match[1].trim(),
      startIndex: match.index,
      endIndex: match.index + match[0].length
    });
  }
  
  return matches;
}

function normalizeCardName(name) {
  if (!name) return '';
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

function hasCardLink(text, cardName) {
  if (!text || !cardName) return false;
  const links = parseCardLinks(text);
  const normalizedName = normalizeCardName(cardName);
  return links.some(link => normalizeCardName(link.cardName) === normalizedName);
}

test('parseCardLinks returns empty array for null or empty text', () => {
  assert.equal(parseCardLinks(null), []);
  assert.equal(parseCardLinks(''), []);
  assert.equal(parseCardLinks(undefined), []);
});

test('parseCardLinks finds single card link', () => {
  const text = 'Check out [[My Card]] for more info';
  const links = parseCardLinks(text);
  
  assert.is(links.length, 1);
  assert.is(links[0].match, '[[My Card]]');
  assert.is(links[0].cardName, 'My Card');
  assert.is(links[0].startIndex, 10);
});

test('parseCardLinks finds multiple card links', () => {
  const text = 'See [[First Card]] and [[Second Card]] and [[Third Card]]';
  const links = parseCardLinks(text);
  
  assert.is(links.length, 3);
  assert.is(links[0].cardName, 'First Card');
  assert.is(links[1].cardName, 'Second Card');
  assert.is(links[2].cardName, 'Third Card');
});

test('parseCardLinks trims whitespace from card names', () => {
  const text = '[[  Card With Spaces  ]]';
  const links = parseCardLinks(text);
  
  assert.is(links.length, 1);
  assert.is(links[0].cardName, 'Card With Spaces');
});

test('parseCardLinks handles card names with special characters', () => {
  const text = '[[Card-Name_123!@#]]';
  const links = parseCardLinks(text);
  
  assert.is(links.length, 1);
  assert.is(links[0].cardName, 'Card-Name_123!@#');
});

test('parseCardLinks ignores single brackets', () => {
  const text = '[Not a link] and [also not]';
  const links = parseCardLinks(text);
  
  assert.is(links.length, 0);
});

test('parseCardLinks handles nested brackets', () => {
  const text = '[[Outer [[Inner]]]]';
  const links = parseCardLinks(text);
  
  // Should only match valid patterns
  assert.is(links.length, 1);
  assert.is(links[0].cardName, 'Outer [[Inner');
});

test('parseCardLinks captures start and end indices', () => {
  const text = 'Before [[Card]] after';
  const links = parseCardLinks(text);
  
  assert.is(links[0].startIndex, 7);
  assert.is(links[0].endIndex, 15);
  assert.is(text.substring(links[0].startIndex, links[0].endIndex), '[[Card]]');
});

test('normalizeCardName converts to lowercase', () => {
  assert.is(normalizeCardName('My Card'), 'my card');
  assert.is(normalizeCardName('UPPERCASE'), 'uppercase');
  assert.is(normalizeCardName('MiXeD CaSe'), 'mixed case');
});

test('normalizeCardName trims whitespace', () => {
  assert.is(normalizeCardName('  Card  '), 'card');
  assert.is(normalizeCardName('\tCard\n'), 'card');
});

test('normalizeCardName normalizes multiple spaces', () => {
  assert.is(normalizeCardName('Card   With   Spaces'), 'card with spaces');
  assert.is(normalizeCardName('Multiple    Spaces'), 'multiple spaces');
});

test('normalizeCardName handles empty input', () => {
  assert.is(normalizeCardName(''), '');
  assert.is(normalizeCardName(null), '');
  assert.is(normalizeCardName(undefined), '');
});

test('hasCardLink returns true when link exists', () => {
  const text = 'See [[My Card]] for details';
  assert.is(hasCardLink(text, 'My Card'), true);
});

test('hasCardLink is case-insensitive', () => {
  const text = 'See [[My Card]] for details';
  assert.is(hasCardLink(text, 'my card'), true);
  assert.is(hasCardLink(text, 'MY CARD'), true);
  assert.is(hasCardLink(text, 'My CaRd'), true);
});

test('hasCardLink handles whitespace variations', () => {
  const text = 'See [[My  Card]] for details';
  assert.is(hasCardLink(text, 'My Card'), true);
  assert.is(hasCardLink(text, '  My Card  '), true);
});

test('hasCardLink returns false when link does not exist', () => {
  const text = 'See [[My Card]] for details';
  assert.is(hasCardLink(text, 'Other Card'), false);
  assert.is(hasCardLink(text, 'My'), false);
});

test('hasCardLink returns false for empty inputs', () => {
  assert.is(hasCardLink('', 'Card'), false);
  assert.is(hasCardLink('Text', ''), false);
  assert.is(hasCardLink(null, 'Card'), false);
  assert.is(hasCardLink('Text', null), false);
});

test('hasCardLink finds link among multiple links', () => {
  const text = '[[First]] and [[Second]] and [[Third]]';
  assert.is(hasCardLink(text, 'First'), true);
  assert.is(hasCardLink(text, 'Second'), true);
  assert.is(hasCardLink(text, 'Third'), true);
  assert.is(hasCardLink(text, 'Fourth'), false);
});

test('parseCardLinks handles card links at text boundaries', () => {
  const text = '[[Start]]middle[[End]]';
  const links = parseCardLinks(text);
  
  assert.is(links.length, 2);
  assert.is(links[0].cardName, 'Start');
  assert.is(links[1].cardName, 'End');
});

test('parseCardLinks works with multiline text', () => {
  const text = 'Line 1 [[Card One]]\nLine 2 [[Card Two]]\nLine 3';
  const links = parseCardLinks(text);
  
  assert.is(links.length, 2);
  assert.is(links[0].cardName, 'Card One');
  assert.is(links[1].cardName, 'Card Two');
});

test.run();
