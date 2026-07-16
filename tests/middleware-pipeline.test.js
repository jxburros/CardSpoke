// Tests for Middleware Pipeline System
import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { Middleware } from '../www/src/core/middleware.js';

// Set up the window mock before tests run.
test.before(() => {
  global.window = {
    CardSpoke: { Middleware },
    performance: {
      now: () => Date.now()
    }
  };
});

test('Middleware system initializes', () => {
  assert.ok(window.CardSpoke.Middleware, 'Middleware manager exists');
  assert.type(window.CardSpoke.Middleware.register, 'function');
  assert.type(window.CardSpoke.Middleware.run, 'function');
});

test('Can register middleware', () => {
  window.CardSpoke.Middleware.register({
    name: 'test-middleware',
    priority: 10,
    operations: ['test.operation'],
    handler: async (ctx, next) => {
      await next();
    }
  });

  const list = window.CardSpoke.Middleware.list();
  assert.ok(list.find(m => m.name === 'test-middleware'), 'Middleware registered');
});

test('Middleware executes in priority order', async () => {
  window.CardSpoke.Middleware.clear();
  const order = [];

  window.CardSpoke.Middleware.register({
    name: 'low-priority',
    priority: 1,
    operations: ['test.order'],
    handler: async (ctx, next) => {
      order.push('low-before');
      await next();
      order.push('low-after');
    }
  });

  window.CardSpoke.Middleware.register({
    name: 'high-priority',
    priority: 100,
    operations: ['test.order'],
    handler: async (ctx, next) => {
      order.push('high-before');
      await next();
      order.push('high-after');
    }
  });

  await window.CardSpoke.Middleware.run('test.order', []);

  assert.equal(order[0], 'high-before', 'High priority runs first');
  assert.equal(order[1], 'low-before', 'Low priority runs second');
  assert.equal(order[2], 'low-after', 'Low priority completes third');
  assert.equal(order[3], 'high-after', 'High priority completes last');
});

test('Middleware can modify arguments', async () => {
  window.CardSpoke.Middleware.clear();

  window.CardSpoke.Middleware.register({
    name: 'arg-modifier',
    priority: 10,
    operations: ['test.modify'],
    handler: async (ctx, next) => {
      ctx.args[0] = ctx.args[0] * 2;
      await next();
    }
  });

  const result = await window.CardSpoke.Middleware.run('test.modify', [5]);
  assert.equal(result.context.args[0], 10, 'Argument modified');
});

test('Middleware can prevent operation', async () => {
  window.CardSpoke.Middleware.clear();
  let executedNext = false;

  window.CardSpoke.Middleware.register({
    name: 'preventer',
    priority: 10,
    operations: ['test.prevent'],
    handler: async (ctx, next) => {
      ctx.preventDefault();
      // Don't call next()
    }
  });

  window.CardSpoke.Middleware.register({
    name: 'follower',
    priority: 5,
    operations: ['test.prevent'],
    handler: async (ctx, next) => {
      executedNext = true;
      await next();
    }
  });

  const result = await window.CardSpoke.Middleware.run('test.prevent', []);
  
  assert.equal(result.prevented, true, 'Operation prevented');
  assert.equal(executedNext, false, 'Next middleware not executed');
});

test('Wildcard operation matches all', async () => {
  window.CardSpoke.Middleware.clear();
  let executed = false;

  window.CardSpoke.Middleware.register({
    name: 'wildcard',
    priority: 10,
    operations: ['*'],
    handler: async (ctx, next) => {
      executed = true;
      await next();
    }
  });

  await window.CardSpoke.Middleware.run('any.operation', []);
  assert.equal(executed, true, 'Wildcard matched');
});

// Fault isolation (audit 2026-07-16): one plugin's throwing middleware must
// not starve other plugins' hooks or silently prevent the core operation.
test('a throwing middleware is isolated; later middlewares still run and the op is not prevented', async () => {
  window.CardSpoke.Middleware.clear();
  const ran = [];

  window.CardSpoke.Middleware.register({
    name: 'a-high', priority: 30, operations: ['*'],
    handler: async (ctx, next) => { ran.push('a'); await next(); }
  });
  window.CardSpoke.Middleware.register({
    name: 'b-throws', priority: 20, operations: ['*'],
    handler: async () => { throw new Error('boom'); }
  });
  window.CardSpoke.Middleware.register({
    name: 'c-low', priority: 10, operations: ['*'],
    handler: async (ctx, next) => { ran.push('c'); await next(); }
  });

  const result = await window.CardSpoke.Middleware.run('card.save', []);

  assert.ok(ran.includes('a'), 'first middleware ran');
  assert.ok(ran.includes('c'), 'a throwing middleware does not starve the next one');
  assert.not.ok(result.prevented, 'a throwing middleware does not prevent the operation');
});

test('Can unregister middleware', () => {
  window.CardSpoke.Middleware.clear();
  
  window.CardSpoke.Middleware.register({
    name: 'removable',
    priority: 10,
    operations: ['test.remove'],
    handler: async (ctx, next) => await next()
  });

  let list = window.CardSpoke.Middleware.list();
  assert.equal(list.length, 1, 'Middleware registered');

  window.CardSpoke.Middleware.unregister('removable');
  
  list = window.CardSpoke.Middleware.list();
  assert.equal(list.length, 0, 'Middleware removed');
});

test.run();
