/**
 * Test Suite: Backlinks and Related Cards
 * Tests for getBacklinks() and getRelatedCards() functions
 */

import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appJsPath = join(__dirname, '..', 'www', 'app.js');
const appJsContent = readFileSync(appJsPath, 'utf-8');

// Extract functions from app.js
const getBacklinksMatch = appJsContent.match(/function getBacklinks\([\s\S]*?\n      \}/);
assert.ok(getBacklinksMatch, 'getBacklinks function should exist');

const getRelatedCardsMatch = appJsContent.match(/function getRelatedCards\([\s\S]*?\n      \}/);
assert.ok(getRelatedCardsMatch, 'getRelatedCards function should exist');

test('getBacklinks function exists in app.js', () => {
  assert.ok(appJsContent.includes('function getBacklinks('), 
    'getBacklinks function should be defined');
});

test('getBacklinks has proper JSDoc documentation', () => {
  const jsdocPattern = /\/\*\*[\s\S]*?Get all cards that link to a specific card[\s\S]*?\*\/\s*function getBacklinks/;
  assert.ok(jsdocPattern.test(appJsContent), 
    'getBacklinks should have JSDoc documentation');
});

test('getBacklinks returns empty array for null/undefined cardId', () => {
  const functionCode = getBacklinksMatch[0];
  assert.ok(functionCode.includes('if (!cardId) return []'), 
    'getBacklinks should handle null/undefined cardId');
});

test('getBacklinks checks for card existence', () => {
  const functionCode = getBacklinksMatch[0];
  assert.ok(functionCode.includes('store.cards[cardId]'), 
    'getBacklinks should check if card exists');
  assert.ok(functionCode.includes('if (!card) return []'), 
    'getBacklinks should return empty array for non-existent card');
});

test('getBacklinks uses hasCardLink to find references', () => {
  const functionCode = getBacklinksMatch[0];
  assert.ok(functionCode.includes('hasCardLink'), 
    'getBacklinks should use hasCardLink function');
});

test('getBacklinks skips self-references', () => {
  const functionCode = getBacklinksMatch[0];
  assert.ok(functionCode.includes('if (id === cardId) continue'), 
    'getBacklinks should skip the card itself');
});

test('getBacklinks returns array with id, title, and body', () => {
  const functionCode = getBacklinksMatch[0];
  assert.ok(functionCode.includes('id: otherCard.id'), 
    'backlinks should include card ID');
  assert.ok(functionCode.includes('title: otherCard.title'), 
    'backlinks should include card title');
  assert.ok(functionCode.includes('body: otherCard.body'), 
    'backlinks should include card body');
});

test('getRelatedCards function exists in app.js', () => {
  assert.ok(appJsContent.includes('function getRelatedCards('), 
    'getRelatedCards function should be defined');
});

test('getRelatedCards has proper JSDoc documentation', () => {
  const jsdocPattern = /\/\*\*[\s\S]*?Get related cards based on shared tags[\s\S]*?\*\/\s*function getRelatedCards/;
  assert.ok(jsdocPattern.test(appJsContent), 
    'getRelatedCards should have JSDoc documentation');
});

test('getRelatedCards accepts limit parameter', () => {
  const functionCode = getRelatedCardsMatch[0];
  assert.ok(functionCode.includes('limit = 10'), 
    'getRelatedCards should have default limit of 10');
});

test('getRelatedCards returns empty array for null/undefined cardId', () => {
  const functionCode = getRelatedCardsMatch[0];
  assert.ok(functionCode.includes('if (!cardId) return []'), 
    'getRelatedCards should handle null/undefined cardId');
});

test('getRelatedCards returns empty if card has no tags', () => {
  const functionCode = getRelatedCardsMatch[0];
  assert.ok(functionCode.includes('if (cardTags.length === 0) return []'), 
    'getRelatedCards should return empty array if no tags');
});

test('getRelatedCards uses getTags function', () => {
  const functionCode = getRelatedCardsMatch[0];
  assert.ok(functionCode.includes('getTags(cardId)'), 
    'getRelatedCards should use getTags function');
  assert.ok(functionCode.includes('getTags(id)'), 
    'getRelatedCards should get tags for other cards');
});

test('getRelatedCards calculates match score', () => {
  const functionCode = getRelatedCardsMatch[0];
  assert.ok(functionCode.includes('matchScore'), 
    'getRelatedCards should calculate matchScore');
  assert.ok(functionCode.includes('matchedTags.length'), 
    'matchScore should be based on number of matched tags');
});

test('getRelatedCards skips self-references', () => {
  const functionCode = getRelatedCardsMatch[0];
  assert.ok(functionCode.includes('if (id === cardId) continue'), 
    'getRelatedCards should skip the card itself');
});

test('getRelatedCards sorts by match score', () => {
  const functionCode = getRelatedCardsMatch[0];
  assert.ok(functionCode.includes('sort'), 
    'getRelatedCards should sort results');
  assert.ok(functionCode.includes('b.matchScore - a.matchScore'), 
    'getRelatedCards should sort by matchScore descending');
});

test('getRelatedCards respects limit parameter', () => {
  const functionCode = getRelatedCardsMatch[0];
  assert.ok(functionCode.includes('.slice(0, limit)'), 
    'getRelatedCards should limit results using slice');
});

test('getRelatedCards returns array with required fields', () => {
  const functionCode = getRelatedCardsMatch[0];
  assert.ok(functionCode.includes('id: otherCard.id'), 
    'related cards should include ID');
  assert.ok(functionCode.includes('title: otherCard.title'), 
    'related cards should include title');
  assert.ok(functionCode.includes('matchScore'), 
    'related cards should include matchScore');
  assert.ok(functionCode.includes('matchedTags'), 
    'related cards should include matchedTags array');
});

test('renderReadOnlyCard includes backlinks section', () => {
  assert.ok(appJsContent.includes('getBacklinks(card.id)'), 
    'renderReadOnlyCard should call getBacklinks');
  assert.ok(appJsContent.includes('backlinks-section'), 
    'renderReadOnlyCard should create backlinks section');
  assert.ok(appJsContent.includes('Referenced By'), 
    'backlinks section should have "Referenced By" title');
});

test('renderReadOnlyCard includes related cards section', () => {
  assert.ok(appJsContent.includes('getRelatedCards(card.id'), 
    'renderReadOnlyCard should call getRelatedCards');
  assert.ok(appJsContent.includes('related-section'), 
    'renderReadOnlyCard should create related section');
  assert.ok(appJsContent.includes('Related Cards'), 
    'related section should have "Related Cards" title');
});

test('backlinks section only renders if backlinks exist', () => {
  const renderMatch = appJsContent.match(/const backlinks = getBacklinks[\s\S]*?if \(backlinks\.length > 0\)/);
  assert.ok(renderMatch, 
    'backlinks section should only render if backlinks exist');
});

test('related cards section only renders if related cards exist', () => {
  const renderMatch = appJsContent.match(/const relatedCards = getRelatedCards[\s\S]*?if \(relatedCards\.length > 0\)/);
  assert.ok(renderMatch, 
    'related cards section should only render if related cards exist');
});

test('backlinks are clickable and navigate to card', () => {
  const backlinkPattern = /onclick: \(\) => goTo\('read', \{ cardId: backlink\.id \}\)/;
  assert.ok(backlinkPattern.test(appJsContent), 
    'backlinks should be clickable and navigate to card');
});

test('related cards are clickable and navigate to card', () => {
  const relatedPattern = /onclick: \(\) => goTo\('read', \{ cardId: related\.id \}\)/;
  assert.ok(relatedPattern.test(appJsContent), 
    'related cards should be clickable and navigate to card');
});

test('related cards display matched tags', () => {
  const relatedTagsPattern = /related\.matchedTags\.forEach\(tag =>/;
  assert.ok(relatedTagsPattern.test(appJsContent), 
    'related cards should display matched tags');
});

test.run();
