import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { readFileSync } from 'fs';

const rendering = readFileSync('./www/src/rendering.js', 'utf8');
const systems = readFileSync('./www/src/systems.js', 'utf8');
const metadata = readFileSync('./www/src/metadata.js', 'utf8');
const data = readFileSync('./www/src/data.js', 'utf8');
const storage = readFileSync('./www/src/storage.js', 'utf8');
const styles = readFileSync('./www/styles.css', 'utf8');

test('add child opens create flow with child-specific title', () => {
  assert.ok(
    rendering.includes("goTo('edit', { cardId: null, parentId: card.id });"),
    'Add Child should open the create-child flow'
  );
  assert.ok(
    rendering.includes("navState.parentId ? 'Add Child Card' : 'New Card'"),
    'Child creation should use an Add Child Card title'
  );
});

test('advanced search modal submits from Enter', () => {
  assert.ok(
    systems.includes("const modalBody = h('form', { className: 'modal-body' });"),
    'Advanced search should use a form body'
  );
  assert.ok(
    systems.includes("type: 'submit'"),
    'Advanced search should expose a submit button'
  );
});

test('app source uses in-app dialogs instead of native confirm/prompt', () => {
  assert.ok(metadata.includes('function showConfirmDialog('), 'Confirm dialog helper should exist');
  assert.ok(metadata.includes('function showPromptDialog('), 'Prompt dialog helper should exist');
  const appSources = rendering + systems + data + storage;
  assert.not.ok(/\bconfirm\(/.test(appSources), 'App sources should not use native confirm()');
  assert.not.ok(/\bprompt\(/.test(appSources), 'App sources should not use native prompt()');
});

test('long titles and breadcrumbs wrap instead of overflowing', () => {
  assert.ok(styles.includes('overflow-wrap: anywhere;'), 'Styles should allow long text to wrap anywhere');
  assert.ok(styles.includes('word-break: break-word;'), 'Styles should break long words when needed');
});

test('fuzzy search requires stronger approximate matches', () => {
  assert.ok(
    metadata.includes('queryTerms.length > 1 && !queryTerms.some(term => textLower.includes(term))'),
    'Multi-term fuzzy search should require some term overlap'
  );
  assert.ok(
    metadata.includes('approximate: !hasDirectMatch'),
    'Approximate results should be explicitly labeled'
  );
});

test.run();
