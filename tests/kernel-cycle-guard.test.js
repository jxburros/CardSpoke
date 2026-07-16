/**
 * Kernel cycle-guard regressions (audit 2026-07-16).
 *
 * A hand-crafted or third-party import can contain a card whose parent chain
 * (or children array) forms a cycle. The Kernel's ancestor/descendant walks
 * must terminate on such data instead of looping forever or overflowing the
 * stack. (The UI additionally repairs these on load/import and prevents
 * creating them via the editor, but the engine must be safe on its own.)
 */

import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { Kernel } from '../www/src/kernel.js';

test('getAncestors terminates on a cyclic parent chain', () => {
  const k = new Kernel({
    cards: {
      a: { id: 'a', title: 'A', parentId: 'b', children: ['b'], tags: [] },
      b: { id: 'b', title: 'B', parentId: 'a', children: ['a'], tags: [] }
    },
    rootOrder: []
  });
  const ancestors = k.getAncestors('a'); // would loop forever without the guard
  assert.ok(Array.isArray(ancestors), 'returns an array');
  assert.ok(ancestors.length <= 2, 'bounded — does not loop forever');
});

test('getDescendantIds terminates on a cyclic children array', () => {
  const k = new Kernel({
    cards: {
      a: { id: 'a', title: 'A', parentId: null, children: ['b'], tags: [] },
      b: { id: 'b', title: 'B', parentId: 'a', children: ['a'], tags: [] } // cycles back
    },
    rootOrder: ['a']
  });
  const ids = k.getDescendantIds('a'); // would recurse forever without the guard
  assert.ok(Array.isArray(ids), 'returns an array');
  assert.ok(ids.length <= 2, 'bounded — does not recurse forever');
});

test.run();
