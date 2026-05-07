# Middleware Pipeline API

**Version:** 0.17.0

The Middleware Pipeline provides a priority-weighted, interceptor-style architecture that allows plugins to wrap core operations, modify data, or cancel operations before they complete.

## Overview

The middleware pipeline provides:

- **Interception**: Wrap and modify core operations before/after execution
- **Priority Ordering**: Deterministic execution order based on priority weights
- **Operation Control**: Prevent or modify operations mid-pipeline
- **Error Handling**: Graceful error handling with fallback support

## Core Concepts

### Middleware Context

Every middleware receives a context object:

```javascript
{
  operation: string,      // Operation name (e.g., 'card.save')
  args: any[],           // Operation arguments
  result: any,           // Operation result (set by handler)
  error: Error,          // Error if operation failed
  stopPropagation(),     // Stop further middleware execution
  preventDefault()       // Prevent the operation from completing
}
```

### Middleware Definition

```javascript
{
  name: string,          // Unique middleware name
  priority: number,      // Higher priority runs first (default: 0)
  operations: string[],  // Operations to intercept (* for all)
  handler: async (ctx, next) => Promise<void>
}
```

## API Reference

### `CardSpoke.Middleware.register(middleware)`

Register a new middleware.

```javascript
window.CardSpoke.Middleware.register({
  name: 'my-interceptor',
  priority: 10,
  operations: ['card.save', 'card.delete'],
  handler: async (ctx, next) => {
    console.log('Before:', ctx.operation, ctx.args);
    await next(); // Call next middleware
    console.log('After:', ctx.operation);
  }
});
```

### `CardSpoke.Middleware.unregister(name)`

Unregister a middleware by name.

```javascript
window.CardSpoke.Middleware.unregister('my-interceptor');
```

### `CardSpoke.Middleware.run(operation, args)`

Execute the middleware pipeline for an operation.

```javascript
const result = await window.CardSpoke.Middleware.run('card.save', [card]);
if (result.prevented) {
  console.log('Operation was prevented');
}
```

### `CardSpoke.Middleware.list()`

List all registered middlewares.

```javascript
const middlewares = window.CardSpoke.Middleware.list();
// Returns: [{ name, priority, operations }, ...]
```

## Standard Operations

The following operations are available for interception:

| Operation | Description | Arguments |
|-----------|-------------|-----------|
| `card.create` | Card creation flow | `[id, card]` |
| `card.update` | Card update flow | `[id, card]` |
| `card.delete` | Card deletion flow | `[id]` |
| `card.save` | Store persistence checkpoint | `[store]` |
| `card.render` | Card rendering | `[card, element]` |

## Examples

### Validation Middleware

```javascript
window.CardSpoke.Middleware.register({
  name: 'card-validator',
  priority: 100, // Run first
  operations: ['card.create', 'card.update'],
  handler: async (ctx, next) => {
    const card = ctx.args[1];
    
    if (!card.title || card.title.length < 3) {
      ctx.preventDefault();
      window.showToast('Card title must be at least 3 characters', 'error');
      return;
    }
    
    await next();
  }
});
```

### Logging Middleware

```javascript
window.CardSpoke.Middleware.register({
  name: 'audit-logger',
  priority: -100, // Run last
  operations: ['*'],
  handler: async (ctx, next) => {
    const start = Date.now();
    await next();
    const duration = Date.now() - start;
    
    console.log('Operation:', ctx.operation, 'took', duration, 'ms');
  }
});
```

### Data Enrichment

```javascript
window.CardSpoke.Middleware.register({
  name: 'auto-tagger',
  priority: 50,
  operations: ['card.create', 'card.update'],
  handler: async (ctx, next) => {
    const card = ctx.args[1];

    // Add automatic tags based on content
    if (card.body.includes('TODO')) {
      if (!card.tags.includes('todo')) {
        card.tags.push('todo');
      }
    }
    
    await next();
  }
});
```

## Best Practices

1. **Use meaningful names**: Name your middleware descriptively
2. **Set appropriate priority**: Higher priority (100+) for validators, lower (-100) for loggers
3. **Always call next()**: Unless intentionally stopping the pipeline
4. **Handle errors**: Wrap async operations in try/catch
5. **Keep it fast**: Middleware executes sequentially and awaits each handler
6. **Document operations**: Specify which operations your middleware handles

## Performance

- Middleware is cached by operation for fast lookup
- Priority-sorted execution ensures deterministic order
- Error isolation prevents one middleware from breaking others

## See Also

- [Plugin API](./PLUGIN_API.md) - Full plugin development guide
- [Component Registry](./COMPONENT_REGISTRY.md) - UI component system
- [Storage Drivers](./STORAGE_DRIVER_INTERFACE.md) - Pluggable storage
