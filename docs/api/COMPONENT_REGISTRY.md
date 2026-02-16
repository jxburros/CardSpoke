# Component Registry

**Version:** 0.16.0

The Component Registry provides a centralized system for registering and overriding UI components. Instead of using CSS/JS to "find and replace" elements, mods register their versions of components with priority-based resolution.

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

### `CardSpoke.ComponentRegistry.register(name, component, priority)`

Register a component.

```javascript
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

### `CardSpoke.ComponentRegistry.unregister(name)`

Unregister a component.

```javascript
window.CardSpoke.ComponentRegistry.unregister('Card');
```

### `CardSpoke.ComponentRegistry.get(name)`

Get a registered component.

```javascript
const CardComponent = window.CardSpoke.ComponentRegistry.get('Card');
if (CardComponent) {
  const element = CardComponent.render({ title: 'Hello', body: 'World' });
}
```

### `CardSpoke.ComponentRegistry.resolve(name)`

Resolve a component (same as `get` but for API consistency).

```javascript
const component = window.CardSpoke.ComponentRegistry.resolve('Card');
```

### `CardSpoke.ComponentRegistry.has(name)`

Check if a component is registered.

```javascript
if (window.CardSpoke.ComponentRegistry.has('CustomWidget')) {
  // Component is available
}
```

### `CardSpoke.ComponentRegistry.list()`

List all registered components.

```javascript
const components = window.CardSpoke.ComponentRegistry.list();
// Returns: [{ name: 'Card', priority: 10 }, ...]
```

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
window.CardSpoke.ComponentRegistry.register('Card', {
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
}, 50);
```

### Custom Search Bar

```javascript
window.CardSpoke.ComponentRegistry.register('SearchBar', {
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
}, 75);
```

### Wrapper Component

Enhance existing components without replacing them:

```javascript
// Get the original component
const OriginalCard = window.CardSpoke.ComponentRegistry.get('Card');

// Register enhanced version
window.CardSpoke.ComponentRegistry.register('Card', {
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
}, 5);
```

## Component Resolution

When a component is requested:

1. Registry looks up the component name
2. Returns the component with highest priority
3. If multiple components have same priority, last registered wins
4. If no component found, returns `undefined`

## Usage in Core App

The core app checks the registry before rendering:

```javascript
function renderCard(card) {
  const CardComponent = window.CardSpoke.ComponentRegistry.get('Card');
  
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

With the `@cardspoke/core` package:

```typescript
import type { Component } from '@cardspoke/core';

const MyCard: Component = {
  render: (props: CardProps) => {
    // TypeScript knows props shape
    return element;
  },
  priority: 50
};

window.CardSpoke.ComponentRegistry.register('Card', MyCard);
```

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
window.CardSpoke.ComponentRegistry.register('Card', {
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
