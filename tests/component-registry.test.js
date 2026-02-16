// Tests for Component Registry System
import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { readFileSync } from 'fs';

// Mock window
global.window = { CardSpoke: {} };

// Load the component registry
eval(readFileSync('./www/src/core/component-registry.js', 'utf8'));

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

test('Clear removes all components', () => {
  window.CardSpoke.ComponentRegistry.clear();

  window.CardSpoke.ComponentRegistry.register('A', { render: () => ({}) });
  window.CardSpoke.ComponentRegistry.register('B', { render: () => ({}) });

  assert.equal(window.CardSpoke.ComponentRegistry.list().length, 2, 'Components registered');

  window.CardSpoke.ComponentRegistry.clear();
  
  assert.equal(window.CardSpoke.ComponentRegistry.list().length, 0, 'All cleared');
});

test.run();
