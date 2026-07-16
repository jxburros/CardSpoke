// Tests for Component Registry System
import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { ComponentRegistry } from '../www/src/core/component-registry.js';

// Set up the window mock before tests run.
test.before(() => {
  global.window = { CardSpoke: { ComponentRegistry } };
});

test('Component registry initializes', () => {
  assert.ok(window.CardSpoke.ComponentRegistry, 'Registry exists');
  assert.type(window.CardSpoke.ComponentRegistry.register, 'function');
  assert.type(window.CardSpoke.ComponentRegistry.get, 'function');
});

test('Can register component', () => {
  const component = {
    render: (props) => ({ element: 'div', props })
  };

  window.CardSpoke.ComponentRegistry.register('TestComponent', component);
  
  const retrieved = window.CardSpoke.ComponentRegistry.get('TestComponent');
  assert.ok(retrieved, 'Component registered');
});

test('Priority determines override', () => {
  window.CardSpoke.ComponentRegistry.clear();

  const lowPriority = {
    render: () => ({ priority: 'low' }),
    priority: 10
  };

  const highPriority = {
    render: () => ({ priority: 'high' }),
    priority: 100
  };

  window.CardSpoke.ComponentRegistry.register('Card', lowPriority, 10);
  window.CardSpoke.ComponentRegistry.register('Card', highPriority, 100);

  const component = window.CardSpoke.ComponentRegistry.get('Card');
  const result = component.render();
  assert.equal(result.priority, 'high', 'High priority component wins');
});

test('Lower priority does not override higher', () => {
  window.CardSpoke.ComponentRegistry.clear();

  const highPriority = {
    render: () => ({ priority: 'high' })
  };

  const lowPriority = {
    render: () => ({ priority: 'low' })
  };

  window.CardSpoke.ComponentRegistry.register('Card', highPriority, 100);
  window.CardSpoke.ComponentRegistry.register('Card', lowPriority, 10);

  const component = window.CardSpoke.ComponentRegistry.get('Card');
  const result = component.render();
  assert.equal(result.priority, 'high', 'High priority maintained');
});

test('Can unregister component', () => {
  window.CardSpoke.ComponentRegistry.clear();

  window.CardSpoke.ComponentRegistry.register('Removable', {
    render: () => ({})
  });

  assert.ok(window.CardSpoke.ComponentRegistry.has('Removable'), 'Component exists');

  window.CardSpoke.ComponentRegistry.unregister('Removable');
  
  assert.not.ok(window.CardSpoke.ComponentRegistry.has('Removable'), 'Component removed');
});

test('Resolve works like get', () => {
  window.CardSpoke.ComponentRegistry.clear();

  const component = { render: () => ({}) };
  window.CardSpoke.ComponentRegistry.register('Test', component);

  const resolved = window.CardSpoke.ComponentRegistry.resolve('Test');
  const gotten = window.CardSpoke.ComponentRegistry.get('Test');

  assert.equal(resolved, gotten, 'Resolve and get return same component');
});

test('List returns all components', () => {
  window.CardSpoke.ComponentRegistry.clear();

  window.CardSpoke.ComponentRegistry.register('A', { render: () => ({}) }, 10);
  window.CardSpoke.ComponentRegistry.register('B', { render: () => ({}) }, 20);
  window.CardSpoke.ComponentRegistry.register('C', { render: () => ({}) }, 30);

  const list = window.CardSpoke.ComponentRegistry.list();
  assert.equal(list.length, 3, 'All components listed');
  
  const names = list.map(c => c.name);
  assert.ok(names.includes('A'), 'Component A listed');
  assert.ok(names.includes('B'), 'Component B listed');
  assert.ok(names.includes('C'), 'Component C listed');
});

test('Has checks component existence', () => {
  window.CardSpoke.ComponentRegistry.clear();

  assert.not.ok(window.CardSpoke.ComponentRegistry.has('NonExistent'), 'Non-existent not found');

  window.CardSpoke.ComponentRegistry.register('Existent', { render: () => ({}) });
  
  assert.ok(window.CardSpoke.ComponentRegistry.has('Existent'), 'Existent found');
});

// Ownership tracking (audit 2026-07-16): a losing registration must not let a
// plugin later remove the winner's live override.
test('register returns true when it wins and false when out-prioritized', () => {
  const R = window.CardSpoke.ComponentRegistry;
  R.clear();
  const hi = { render: () => ({ who: 'hi' }) };
  const lo = { render: () => ({ who: 'lo' }) };
  assert.equal(R.register('Card', hi, 100), true, 'first registration wins');
  assert.equal(R.register('Card', lo, 10), false, 'lower priority is rejected');
  assert.equal(R.get('Card'), hi, 'higher-priority component retained');
});

test('unregister(name, expected) only removes when identity matches', () => {
  const R = window.CardSpoke.ComponentRegistry;
  R.clear();
  const winner = { render: () => ({}) };
  const loser = { render: () => ({}) };
  R.register('Card', winner, 100);
  // The loser (which never held the slot) tries to clean up: identity mismatch
  // must be a no-op so the winner's active override survives.
  assert.equal(R.unregister('Card', loser), false, 'mismatched identity does not unregister');
  assert.ok(R.has('Card'), 'winner still registered');
  assert.equal(R.get('Card'), winner);
  // The winner's own cleanup matches identity and removes it.
  assert.equal(R.unregister('Card', winner), true, 'matching identity unregisters');
  assert.not.ok(R.has('Card'));
});

test('Clear removes all components', () => {
  window.CardSpoke.ComponentRegistry.clear();

  window.CardSpoke.ComponentRegistry.register('A', { render: () => ({}) });
  window.CardSpoke.ComponentRegistry.register('B', { render: () => ({}) });

  assert.equal(window.CardSpoke.ComponentRegistry.list().length, 2, 'Components registered');

  window.CardSpoke.ComponentRegistry.clear();
  
  assert.equal(window.CardSpoke.ComponentRegistry.list().length, 0, 'All cleared');
});

// Task 2.5: Verify Sidebar, Header, SearchBar can be registered
test('Sidebar component can be registered and retrieved', () => {
  window.CardSpoke.ComponentRegistry.clear();

  const CustomSidebar = {
    render: (props) => {
      const el = { tagName: 'DIV', dataset: {}, textContent: 'Custom Sidebar' };
      return el;
    }
  };

  window.CardSpoke.ComponentRegistry.register('Sidebar', CustomSidebar, 10);
  const retrieved = window.CardSpoke.ComponentRegistry.get('Sidebar');
  assert.ok(retrieved, 'Sidebar component registered');
  assert.type(retrieved.render, 'function', 'Sidebar render function available');
});

test('Header component can be registered and retrieved', () => {
  window.CardSpoke.ComponentRegistry.clear();

  const CustomHeader = {
    render: (props) => {
      return { tagName: 'HEADER', textContent: 'Custom Header' };
    }
  };

  window.CardSpoke.ComponentRegistry.register('Header', CustomHeader, 10);
  const retrieved = window.CardSpoke.ComponentRegistry.get('Header');
  assert.ok(retrieved, 'Header component registered');
  assert.type(retrieved.render, 'function', 'Header render function available');
});

test('SearchBar component can be registered and retrieved', () => {
  window.CardSpoke.ComponentRegistry.clear();

  const CustomSearchBar = {
    render: (props) => {
      return { tagName: 'DIV', className: 'custom-search' };
    }
  };

  window.CardSpoke.ComponentRegistry.register('SearchBar', CustomSearchBar, 10);
  const retrieved = window.CardSpoke.ComponentRegistry.get('SearchBar');
  assert.ok(retrieved, 'SearchBar component registered');
  assert.type(retrieved.render, 'function', 'SearchBar render function available');
});

test.run();
