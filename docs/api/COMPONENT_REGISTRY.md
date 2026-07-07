# Component Registry

**Version:** 0.17.0

The Component Registry provides a centralized system for registering and overriding UI components. Instead of using CSS/JS to "find and replace" elements, plugins register their versions of components with priority-based resolution.

**How plugins use it:** register components from your setup body via
`ctx.api.ui.registerComponent(name, component)` /
`ctx.api.ui.unregisterComponent(name)` (permission: `ui-override`), documented
under [Integration with Plugin API](#integration-with-plugin-api) below. Those
registrations are tracked and removed automatically on suspend/delete. The
registry is also reachable as `window.CardSpoke.ComponentRegistry` for the
host app and advanced app-layer plugins, but `ctx.api.ui.registerComponent` is
the preferred surface. The app queries these component names: `Card` (live,
per card-tile render) and `Header` / `Sidebar` / `SearchBar` (applied once at
boot).

## Overview

Benefits:

- **Centralized Management**: All components in one registry
- **Priority-Based Resolution**: Higher priority components override lower ones
- **Type Safety**: With TypeScript definitions
- **Hot Swapping**: Replace components without page reload
- **Predictable Behavior**: Deterministic component resolution

## Component Structure

A component is an object with a `render` function:

```javascript
{
  render: (props) => HTMLElement | string,
  priority: number  // Optional, default: 0
}
```

## API Reference

The methods below are available on `window.CardSpoke.ComponentRegistry`
(module: `www/src/core/component-registry.js`). From plugin code, prefer
`ctx.api.ui.registerComponent()` / `ctx.api.ui.unregisterComponent()`, which
wrap `register`/`unregister` with automatic per-plugin cleanup.

### `register(name, component, priority)`

Register a component.

```javascript
// From plugin code, prefer: ctx.api.ui.registerComponent('Card', { ... })
window.CardSpoke.ComponentRegistry.register('Card', {
  render: (props) => {
    const el = document.createElement('div');
    el.className = 'custom-card';
    el.innerHTML = `
      <h3>${props.title}</h3>
      <p>${props.body}</p>
    `;
    return el;
  },
  priority: 10
});
```

**Priority Guidelines:**

- `100+`: Critical overrides (theme components)
- `50-99`: Feature enhancements
- `0-49`: Minor modifications
- `-100`: Default/fallback implementations

**Conflict warning:** If two components are registered under the same `name` with the same `priority`, the registry logs a console warning about the conflict; the most recently registered component wins (last registration wins).

### `unregister(name)`

Unregister a component.

### `get(name)`

Get a registered component.

```javascript
const CardComponent = ComponentRegistry.get('Card');
if (CardComponent) {
  const element = CardComponent.render({ title: 'Hello', body: 'World' });
}
```

### `resolve(name)`

Resolve a component (same as `get` but for API consistency).

### `has(name)`

Check if a component is registered.

### `list()`

List all registered components.

```javascript
const components = ComponentRegistry.list();
// Returns: [{ name: 'Card', priority: 10 }, ...]
```

### `clear()`

Clears all registered components from the registry. Used internally (e.g. during teardown/reset); not exposed to plugin code.

## Standard Components

The following core components are available for override:

| Component | Purpose | Props |
|-----------|---------|-------|
| `Card` | Card display | `{ id, title, body, tags, children }` |
| `CardEditor` | Card editing form | `{ card, onSave, onCancel }` |
| `Sidebar` | Left sidebar | `{ bookmarks, recentCards }` |
| `SearchBar` | Search input | `{ onSearch, query }` |
| `SearchResults` | Search results list | `{ results, query }` |
| `TagList` | Tag display | `{ tags, onTagClick }` |
| `Modal` | Modal dialog | `{ title, content, onClose }` |
| `Toast` | Notification | `{ message, type }` |
| `Menu` | Hamburger menu | `{ items }` |

## Examples

### Custom Card Component

```javascript
// In plugin setup(ctx): ctx.api.ui.registerComponent('Card', { ... })
ctx.api.ui.registerComponent('Card', {
  render: (props) => {
    const card = document.createElement('article');
    card.className = 'enhanced-card';
    card.setAttribute('data-card-id', props.id);
    
    const header = document.createElement('header');
    const title = document.createElement('h2');
    title.textContent = props.title || 'Untitled';
    header.appendChild(title);
    
    if (props.tags && props.tags.length > 0) {
      const tagContainer = document.createElement('div');
      tagContainer.className = 'tag-container';
      props.tags.forEach(tag => {
        const tagEl = document.createElement('span');
        tagEl.className = 'tag';
        tagEl.textContent = tag;
        tagContainer.appendChild(tagEl);
      });
      header.appendChild(tagContainer);
    }
    
    const body = document.createElement('div');
    body.className = 'card-body';
    body.textContent = props.body || '';
    
    card.appendChild(header);
    card.appendChild(body);
    
    return card;
  },
  priority: 50
});
```

### Custom Search Bar

```javascript
ctx.api.ui.registerComponent('SearchBar', {
  render: (props) => {
    const container = document.createElement('div');
    container.className = 'search-container';
    
    const input = document.createElement('input');
    input.type = 'search';
    input.placeholder = 'Search with AI...';
    input.value = props.query || '';
    input.oninput = (e) => {
      if (props.onSearch) {
        props.onSearch(e.target.value);
      }
    };
    
    const icon = document.createElement('span');
    icon.textContent = '🔍';
    
    container.appendChild(icon);
    container.appendChild(input);
    
    return container;
  },
  priority: 75
});
```

### Wrapper Component

Enhance existing components without replacing them:

```javascript
// Note: ctx.api.ui does not expose a get()/resolve() lookup — this pattern
// assumes access to the previously-registered component reference (e.g.
// captured by the plugin that registered it originally).
const OriginalCard = /* reference to previously registered 'Card' component */;

// Register enhanced version
ctx.api.ui.registerComponent('Card', {
  render: (props) => {
    // Render original
    const originalElement = OriginalCard ? 
      OriginalCard.render(props) : 
      document.createElement('div');
    
    // Add enhancements
    const wrapper = document.createElement('div');
    wrapper.className = 'card-wrapper';
    
    const timestamp = document.createElement('span');
    timestamp.className = 'timestamp';
    timestamp.textContent = new Date(props.createdAt).toLocaleDateString();
    
    wrapper.appendChild(timestamp);
    wrapper.appendChild(originalElement);
    
    return wrapper;
  },
  priority: 5  // Lower priority than original
});
```

## Component Resolution

When a component is requested:

1. Registry looks up the component name
2. Returns the component with highest priority
3. If multiple components have same priority, last registered wins
4. If no component found, returns `undefined`

## Usage in Core App

The core app checks the registry before rendering. This uses the internal `ComponentRegistry` module directly (not `window.CardSpoke`, which plugin code is confined to):

```javascript
function renderCard(card) {
  const CardComponent = ComponentRegistry.get('Card');
  
  if (CardComponent) {
    // Use registered component
    return CardComponent.render(card);
  } else {
    // Fallback to default rendering
    return defaultRenderCard(card);
  }
}
```

## Integration with Plugin API

Plugins can register components via the Plugin API:

```javascript
// In plugin setup
ctx.api.ui.registerComponent('Card', {
  render: (props) => { /* ... */ },
  priority: 50
});

// Automatically unregistered on plugin disable
```

## Best Practices

1. **Preserve Props Contract**: Accept and use all standard props
2. **Maintain Accessibility**: Keep ARIA attributes and keyboard support
3. **Document Custom Props**: If adding new props, document them
4. **Test Fallback**: Ensure your component works if original is unavailable
5. **Set Appropriate Priority**: Don't always use maximum priority
6. **Clean Up**: Unregister components when plugin is disabled

## TypeScript Support

Using type definitions from the repository:

```typescript
/// <reference path="path/to/CardSpoke/types/index.d.ts" />

const MyCard: CardSpoke.Component = {
  render: (props: CardSpoke.CardProps) => {
    // TypeScript knows props shape
    return element;
  },
  priority: 50
};

ctx.api.ui.registerComponent('Card', MyCard);
```

**Note:** The `@cardspoke/core` package is not currently published to npm. Reference the type definitions directly from the `types/` directory in the repository.

## Performance

- Component lookup is O(1) via Map
- Priority sorting happens only on registration
- Render functions are not cached (stateless)
- No virtual DOM diffing (direct DOM manipulation)

## Migration from CSS/JS Injection

Instead of:

```javascript
// Old way - brittle
document.querySelectorAll('.card').forEach(card => {
  card.style.background = 'blue';
});
```

Use:

```javascript
// New way - robust
ctx.api.ui.registerComponent('Card', {
  render: (props) => {
    const el = OriginalCard.render(props);
    el.style.background = 'blue';
    return el;
  }
});
```

## See Also

- [Plugin API](./PLUGIN_API.md) - Full plugin development
- [Middleware Pipeline](./MIDDLEWARE_PIPELINE.md) - Intercept operations
- [TypeScript Definitions](../../types/index.d.ts) - Type safety
