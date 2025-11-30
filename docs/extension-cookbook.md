# Extension Development Cookbook

**Version:** 0.14.0
**Last Updated:** 2025-11-30

This cookbook provides practical recipes and patterns for common extension development tasks in CardSpoke.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [UI Modifications](#ui-modifications)
3. [Data Operations](#data-operations)
4. [Keyboard Shortcuts](#keyboard-shortcuts)
5. [Storage & Persistence](#storage--persistence)
6. [API Integration](#api-integration)
7. [Inter-Extension Communication](#inter-extension-communication)
8. [Performance Optimization](#performance-optimization)
9. [Error Handling](#error-handling)
10. [Testing & Debugging](#testing--debugging)

---

## Getting Started

### Basic Extension Template

```javascript
(function() {
  'use strict';

  const api = window.CardSpoke.utils;

  CardSpoke_MODS.register('my-extension-id', {
    meta: {
      name: 'My Extension',
      type: 'Plugin',
      version: '1.0.0',
      creator: 'Your Name',
      description: 'What this extension does'
    },

    onAppInit(ctx) {
      ctx.logger.log('Extension initialized');
    }
  });
})();
```

---

## UI Modifications

### Recipe: Add a Floating Widget

```javascript
CardSpoke_MODS.register('floating-widget', {
  widgetElement: null,

  onAppInit(ctx) {
    this.widgetElement = this.createWidget();
    document.body.appendChild(this.widgetElement);
  },

  createWidget() {
    const widget = document.createElement('div');
    widget.id = 'my-widget';
    widget.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: var(--bg-alt);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px;
      z-index: 9999;
    `;
    widget.innerHTML = '<strong>My Widget</strong><p>Content here</p>';
    return widget;
  },

  onDisable(ctx) {
    // Cleanup when disabled
    if (this.widgetElement && this.widgetElement.parentNode) {
      this.widgetElement.parentNode.removeChild(this.widgetElement);
    }
  }
});
```

### Recipe: Modify Card Appearance

```javascript
CardSpoke_MODS.register('card-decorator', {
  onCardRender(ctx, card, element) {
    // Add a badge to cards with specific tags
    if (card.tags.includes('urgent')) {
      const badge = document.createElement('span');
      badge.className = 'urgent-badge';
      badge.textContent = '🔥 URGENT';
      badge.style.cssText = `
        color: #ff3333;
        font-weight: bold;
        margin-left: 8px;
      `;

      const titleElement = element.querySelector('.card-title');
      if (titleElement) {
        titleElement.appendChild(badge);
      }
    }
  }
});
```

### Recipe: Add Menu Items

```javascript
CardSpoke_MODS.register('custom-menu', {
  onAppInit(ctx) {
    // Add a custom button to the UI
    const button = document.createElement('button');
    button.textContent = 'My Action';
    button.className = 'btn btn-secondary';
    button.onclick = () => this.handleCustomAction(ctx);

    const toolbar = document.querySelector('.toolbar');
    if (toolbar) {
      toolbar.appendChild(button);
    }
  },

  handleCustomAction(ctx) {
    ctx.utils.showToast('Custom action triggered!', 'info');
  }
});
```

---

## Data Operations

### Recipe: Batch Tag Operations

```javascript
CardSpoke_MODS.register('batch-tagger', {
  async tagSearchResults(ctx, query, tag) {
    const results = await ctx.utils.searchCards(query);
    let count = 0;

    for (const card of results) {
      const added = await ctx.utils.addTag(card.id, tag);
      if (added) count++;
    }

    ctx.utils.showToast(`Tagged ${count} cards with #${tag}`, 'success');
    return count;
  },

  onAppInit(ctx) {
    // Example: Tag all cards containing "project" with "active"
    // this.tagSearchResults(ctx, 'project', 'active');
  }
});
```

### Recipe: Auto-Tag Based on Content

```javascript
CardSpoke_MODS.register('auto-tagger', {
  rules: [
    { pattern: /\b(bug|issue|problem)\b/i, tag: 'bug' },
    { pattern: /\b(todo|task)\b/i, tag: 'todo' },
    { pattern: /\b(question|\?)\b/i, tag: 'question' }
  ],

  async onCardSave(ctx, card, saveInfo) {
    if (!saveInfo.isNew && !this.contentChanged(saveInfo)) return;

    const content = `${card.title} ${card.body}`.toLowerCase();
    const currentTags = card.tags || [];

    for (const rule of this.rules) {
      if (rule.pattern.test(content)) {
        if (!currentTags.includes(rule.tag)) {
          await ctx.utils.addTag(card.id, rule.tag);
          ctx.logger.log(`Auto-tagged card ${card.id} with #${rule.tag}`);
        }
      }
    }
  },

  contentChanged(saveInfo) {
    return saveInfo.previousData &&
           (saveInfo.previousData.title || saveInfo.previousData.body);
  }
});
```

### Recipe: Create Card Templates

```javascript
CardSpoke_MODS.register('card-templates', {
  templates: {
    meeting: {
      title: 'Meeting Notes - ',
      body: `# Attendees\n\n# Agenda\n\n# Notes\n\n# Action Items\n`
    },
    project: {
      title: 'Project: ',
      body: `# Overview\n\n# Goals\n\n# Timeline\n\n# Resources\n`
    }
  },

  async createFromTemplate(ctx, templateName, customTitle) {
    const template = this.templates[templateName];
    if (!template) {
      ctx.utils.showToast('Template not found', 'error');
      return null;
    }

    const result = await ctx.utils.createCard({
      title: template.title + (customTitle || 'Untitled'),
      body: template.body,
      tags: [templateName]
    });

    ctx.utils.showToast(`Created ${templateName} card`, 'success');
    return result;
  }
});
```

---

## Keyboard Shortcuts

### Recipe: Register Global Keyboard Shortcuts

```javascript
CardSpoke_MODS.register('keyboard-shortcuts', {
  shortcuts: {},

  onEnable(ctx) {
    this.shortcuts.search = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.handleQuickSearch(ctx);
      }
    };

    this.shortcuts.newCard = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        this.createQuickCard(ctx);
      }
    };

    document.addEventListener('keydown', this.shortcuts.search);
    document.addEventListener('keydown', this.shortcuts.newCard);
  },

  onDisable(ctx) {
    // Clean up event listeners
    document.removeEventListener('keydown', this.shortcuts.search);
    document.removeEventListener('keydown', this.shortcuts.newCard);
  },

  handleQuickSearch(ctx) {
    const query = prompt('Search:');
    if (query) {
      // Trigger search functionality
      ctx.utils.showToast(`Searching for: ${query}`, 'info');
    }
  },

  async createQuickCard(ctx) {
    const title = prompt('Card title:');
    if (title) {
      await ctx.utils.createCard({ title });
    }
  }
});
```

---

## Storage & Persistence

### Recipe: Save Extension Settings

```javascript
CardSpoke_MODS.register('settings-example', {
  STORAGE_KEY: 'my-extension-settings',

  defaultSettings: {
    enabled: true,
    autoSync: false,
    interval: 60
  },

  loadSettings() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      return saved ? { ...this.defaultSettings, ...JSON.parse(saved) } : this.defaultSettings;
    } catch (err) {
      console.error('Failed to load settings:', err);
      return this.defaultSettings;
    }
  },

  saveSettings(settings) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
      return true;
    } catch (err) {
      console.error('Failed to save settings:', err);
      return false;
    }
  },

  onAppInit(ctx) {
    this.settings = this.loadSettings();
    ctx.logger.log('Loaded settings:', this.settings);
  },

  onUninstall(ctx) {
    // Clean up on uninstall
    localStorage.removeItem(this.STORAGE_KEY);
  }
});
```

### Recipe: Per-Card Extension Data

```javascript
CardSpoke_MODS.register('card-metadata', {
  async getCardMetadata(ctx, cardId) {
    const card = await ctx.utils.getCard(cardId);
    if (!card || !card.modsData) return null;
    return card.modsData[ctx.modId] || null;
  },

  async setCardMetadata(ctx, cardId, data) {
    const card = await ctx.utils.getCard(cardId);
    if (!card) return false;

    if (!card.modsData) card.modsData = {};
    card.modsData[ctx.modId] = data;

    await ctx.utils.updateCard(cardId, { modsData: card.modsData });
    return true;
  },

  async onCardSave(ctx, card, saveInfo) {
    // Example: Track when card was last modified by this extension
    await this.setCardMetadata(ctx, card.id, {
      lastModified: Date.now(),
      version: '1.0.0'
    });
  }
});
```

---

## API Integration

### Recipe: Sync with External API

```javascript
CardSpoke_MODS.register('api-sync', {
  API_ENDPOINT: 'https://api.example.com/cards',

  async syncCard(ctx, card) {
    try {
      const response = await fetch(this.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_TOKEN'
        },
        body: JSON.stringify({
          id: card.id,
          title: card.title,
          body: card.body,
          tags: card.tags
        })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      ctx.logger.log('Synced card:', data);
      return data;

    } catch (err) {
      ctx.logger.error('Sync failed:', err);
      ctx.utils.showToast('Failed to sync card', 'error');
      return null;
    }
  },

  async onCardSave(ctx, card, saveInfo) {
    // Auto-sync when cards are saved
    if (saveInfo.isNew || this.shouldSync(card)) {
      await this.syncCard(ctx, card);
    }
  },

  shouldSync(card) {
    return card.tags.includes('sync');
  }
});
```

---

## Inter-Extension Communication

### Recipe: Publish/Subscribe Pattern

```javascript
// Extension A: Publisher
CardSpoke_MODS.register('data-provider', {
  onAppInit(ctx) {
    // Emit event when data is ready
    CardSpoke_MODS.events.emit('data:loaded', {
      timestamp: Date.now(),
      count: 100
    });
  },

  onCardSave(ctx, card) {
    // Notify other extensions of card changes
    CardSpoke_MODS.events.emit('card:modified', {
      cardId: card.id,
      tags: card.tags
    });
  }
});

// Extension B: Subscriber
CardSpoke_MODS.register('data-consumer', {
  onEnable(ctx) {
    // Subscribe to events
    this.handleDataLoaded = (data) => {
      ctx.logger.log('Data loaded:', data);
    };

    this.handleCardModified = (data) => {
      ctx.logger.log('Card modified:', data.cardId);
    };

    CardSpoke_MODS.events.on('data:loaded', this.handleDataLoaded);
    CardSpoke_MODS.events.on('card:modified', this.handleCardModified);
  },

  onDisable(ctx) {
    // Unsubscribe when disabled
    CardSpoke_MODS.events.off('data:loaded', this.handleDataLoaded);
    CardSpoke_MODS.events.off('card:modified', this.handleCardModified);
  }
});
```

---

## Performance Optimization

### Recipe: Debounce Expensive Operations

```javascript
CardSpoke_MODS.register('debounced-search', {
  debounceTimer: null,

  debounce(func, delay) {
    return (...args) => {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => func.apply(this, args), delay);
    };
  },

  onEnable(ctx) {
    // Debounced search function
    this.performSearch = this.debounce(async (query) => {
      const results = await ctx.utils.searchCards(query);
      ctx.logger.log('Search results:', results.length);
    }, 300);
  },

  onDisable(ctx) {
    clearTimeout(this.debounceTimer);
  }
});
```

### Recipe: Batch DOM Updates

```javascript
CardSpoke_MODS.register('batch-dom-updates', {
  updateQueue: [],

  onCardRender(ctx, card, element) {
    // Queue updates instead of applying immediately
    this.updateQueue.push({ card, element });

    // Process queue on next animation frame
    requestAnimationFrame(() => this.processBatch(ctx));
  },

  processBatch(ctx) {
    if (this.updateQueue.length === 0) return;

    // Batch process all queued updates
    const batch = this.updateQueue.splice(0);
    batch.forEach(({ card, element }) => {
      // Apply updates here
      element.classList.add('processed');
    });

    ctx.logger.log(`Processed ${batch.length} updates`);
  }
});
```

---

## Error Handling

### Recipe: Graceful Degradation

```javascript
CardSpoke_MODS.register('error-handling-example', {
  async onCardSave(ctx, card) {
    try {
      // Attempt risky operation
      await this.riskyOperation(card);
    } catch (err) {
      ctx.logger.error('Operation failed:', err);

      // Fallback behavior
      ctx.utils.showToast('Using fallback mode', 'warning');
      await this.fallbackOperation(card);
    }
  },

  async riskyOperation(card) {
    const response = await fetch('https://unreliable-api.com/data');
    if (!response.ok) throw new Error('API failed');
    return await response.json();
  },

  async fallbackOperation(card) {
    // Use local storage or skip the operation
    return { success: true, mode: 'offline' };
  }
});
```

### Recipe: Retry with Exponential Backoff

```javascript
CardSpoke_MODS.register('retry-logic', {
  async retryWithBackoff(fn, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (err) {
        if (i === maxRetries - 1) throw err;

        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  },

  async onCardSave(ctx, card) {
    await this.retryWithBackoff(async () => {
      const response = await fetch('https://api.example.com/save', {
        method: 'POST',
        body: JSON.stringify(card)
      });
      if (!response.ok) throw new Error('Save failed');
      return response.json();
    });
  }
});
```

---

## Testing & Debugging

### Recipe: Extension Self-Test

```javascript
CardSpoke_MODS.register('self-test-example', {
  async runSelfTest(ctx) {
    const tests = [
      { name: 'API Available', fn: () => typeof ctx.utils !== 'undefined' },
      { name: 'Can Create Card', fn: async () => {
        const result = await ctx.utils.createCard({ title: 'Test' });
        return result && result.id;
      }},
      { name: 'Can Search Cards', fn: async () => {
        const results = await ctx.utils.searchCards('test');
        return Array.isArray(results);
      }}
    ];

    const results = [];
    for (const test of tests) {
      try {
        const passed = await test.fn();
        results.push({ name: test.name, passed: !!passed });
      } catch (err) {
        results.push({ name: test.name, passed: false, error: err.message });
      }
    }

    ctx.logger.log('Self-test results:', results);
    return results;
  },

  onAppInit(ctx) {
    // Run tests on initialization
    this.runSelfTest(ctx);
  }
});
```

### Recipe: Performance Monitoring

```javascript
CardSpoke_MODS.register('performance-monitor', {
  onAppInit(ctx) {
    // Log performance stats every 30 seconds
    this.monitorInterval = setInterval(() => {
      const stats = CardSpoke_MODS.devTools.getHookStats(ctx.modId);
      ctx.logger.log('Performance stats:', stats);

      // Alert if hooks are slow
      Object.values(stats).forEach(stat => {
        if (stat.avgDuration > 100) {
          ctx.logger.warn(`Slow hook: ${stat.hookName} avg ${stat.avgDuration.toFixed(2)}ms`);
        }
      });
    }, 30000);
  },

  onDisable(ctx) {
    clearInterval(this.monitorInterval);
  }
});
```

### Recipe: Development Mode

```javascript
CardSpoke_MODS.register('dev-mode-example', {
  DEV_MODE: true, // Set to false in production

  debug(ctx, ...args) {
    if (this.DEV_MODE) {
      ctx.logger.log('[DEBUG]', ...args);
    }
  },

  onCardSave(ctx, card) {
    this.debug(ctx, 'Card saved:', card.id, card.title);

    if (this.DEV_MODE) {
      // Extra validation in dev mode
      if (!card.title) {
        ctx.logger.warn('Card has no title!');
      }
    }
  },

  onAppInit(ctx) {
    if (this.DEV_MODE) {
      // Expose for console debugging
      window.myExtension = this;
      ctx.logger.log('Dev mode enabled - extension available as window.myExtension');
    }
  }
});
```

---

## Advanced Patterns

### Recipe: State Machine

```javascript
CardSpoke_MODS.register('state-machine', {
  state: 'idle',

  states: {
    idle: {
      onEnter(ctx) { ctx.logger.log('Entering idle state'); },
      onExit(ctx) { ctx.logger.log('Exiting idle state'); }
    },
    processing: {
      onEnter(ctx) { ctx.utils.showToast('Processing...', 'info'); },
      onExit(ctx) { ctx.utils.showToast('Processing complete', 'success'); }
    },
    error: {
      onEnter(ctx) { ctx.utils.showToast('Error occurred', 'error'); }
    }
  },

  transition(ctx, newState) {
    if (this.states[this.state]?.onExit) {
      this.states[this.state].onExit(ctx);
    }

    this.state = newState;

    if (this.states[newState]?.onEnter) {
      this.states[newState].onEnter(ctx);
    }
  },

  async onCardSave(ctx, card) {
    this.transition(ctx, 'processing');

    try {
      // Do work...
      await new Promise(resolve => setTimeout(resolve, 1000));
      this.transition(ctx, 'idle');
    } catch (err) {
      this.transition(ctx, 'error');
    }
  }
});
```

---

## Best Practices Summary

1. **Always clean up resources** in `onDisable` and `onUninstall` hooks
2. **Use async/await** for asynchronous operations
3. **Validate inputs** before using API data
4. **Debounce expensive operations** like search and rendering
5. **Use the event bus** for inter-extension communication
6. **Log errors** with proper context using `ctx.logger`
7. **Test in dev mode** before deploying
8. **Use `CardSpoke_MODS.devTools`** to monitor performance
9. **Follow semantic versioning** for your extensions
10. **Document your code** with comments

---

## Resources

- [API Reference](./api-reference.md)
- [Extension Examples](../examples/extensions/)
- [TypeScript Definitions](../types/extensions.d.ts)
- [GitHub Repository](https://github.com/jxburros/CardSpoke)

---

*Happy coding! If you create an interesting extension, consider sharing it with the community.*
