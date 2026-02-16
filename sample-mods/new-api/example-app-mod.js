// Example App Layer Mod using New Plugin API
// Demonstrates app-level customization with high privilege operations

export default {
  manifest: {
    name: 'Custom Knowledge Base',
    version: '1.0.0',
    author: 'Example Author',
    description: 'Rebrands and customizes the application',
    layer: 'app',
    permissions: ['ui-override', 'core-override', 'storage']
  },

  setup: async (ctx) => {
    ctx.logger.info('Initializing Custom Knowledge Base');

    // Rebrand the application
    const header = document.querySelector('h1');
    if (header) {
      header.textContent = 'My Knowledge Base';
    }

    // Register custom storage driver
    if (window.CardSpoke && window.CardSpoke.StorageDriverRegistry) {
      // Example: Register a mock cloud storage driver
      class MockCloudDriver {
        constructor() {
          this.cache = new Map();
        }

        async init(config) {
          ctx.logger.info('Mock cloud driver initialized');
          this.cache.clear();
        }

        async get(key) {
          return this.cache.get(key);
        }

        async set(key, value) {
          this.cache.set(key, value);
          ctx.logger.log('Stored in cloud:', key);
        }

        async remove(key) {
          this.cache.delete(key);
        }

        async list(prefix) {
          const keys = Array.from(this.cache.keys());
          return prefix ? keys.filter(k => k.startsWith(prefix)) : keys;
        }

        async getSize() {
          return this.cache.size;
        }

        getKind() {
          return 'mock-cloud';
        }
      }

      // Note: Not setting as active, just demonstrating registration
      window.CardSpoke.StorageDriverRegistry.register('mock-cloud', new MockCloudDriver());
      ctx.logger.info('Registered mock cloud storage driver');
    }

    // Intercept card operations with middleware
    if (window.CardSpoke && window.CardSpoke.Middleware) {
      // Add approval workflow for deletions
      window.CardSpoke.Middleware.register({
        name: 'delete-confirmation',
        priority: 100, // Run first
        operations: ['card.delete'],
        handler: async (mwCtx, next) => {
          const card = mwCtx.args[0];
          
          const confirmed = confirm(
            `Are you sure you want to delete "${card.title}"?\n\n` +
            'This action cannot be undone.'
          );
          
          if (!confirmed) {
            ctx.logger.info('Card deletion cancelled:', card.id);
            mwCtx.preventDefault();
            return; // Don't call next()
          }
          
          ctx.logger.info('Card deletion approved:', card.id);
          await next();
        }
      });

      // Add auto-backup middleware
      window.CardSpoke.Middleware.register({
        name: 'auto-backup',
        priority: -100, // Run last
        operations: ['card.save', 'card.delete'],
        handler: async (mwCtx, next) => {
          await next();
          
          // After operation completes, save backup
          const backupKey = 'backup_' + Date.now();
          const allCards = ctx.api.data.listCards();
          
          await ctx.api.storage.set(backupKey, {
            timestamp: Date.now(),
            cardCount: allCards.length,
            operation: mwCtx.operation
          });
          
          ctx.logger.log('Auto-backup created:', backupKey);
        }
      });
    }

    // Replace the search component
    if (window.CardSpoke && window.CardSpoke.ComponentRegistry) {
      window.CardSpoke.ComponentRegistry.register('SearchBar', {
        render: (props) => {
          const container = document.createElement('div');
          container.className = 'custom-search-bar';
          
          const input = document.createElement('input');
          input.type = 'search';
          input.placeholder = '🔍 Search your knowledge base...';
          input.value = props.query || '';
          input.className = 'enhanced-search-input';
          
          input.oninput = (e) => {
            if (props.onSearch) {
              props.onSearch(e.target.value);
            }
          };
          
          // Add keyboard shortcuts
          input.onkeydown = (e) => {
            if (e.key === 'Escape') {
              input.value = '';
              if (props.onSearch) props.onSearch('');
            }
          };
          
          container.appendChild(input);
          return container;
        },
        priority: 100
      }, 100);
    }

    // Add custom menu item
    ctx.api.events.on('menu-open', () => {
      ctx.logger.log('Menu opened');
    });

    // Show welcome toast
    ctx.api.ui.showToast('Custom Knowledge Base activated!', 'success', 3000);

    ctx.logger.info('Initialized successfully');
  },

  teardown: async (ctx) => {
    ctx.logger.info('Cleaning up Custom Knowledge Base');
    
    // Unregister middleware
    if (window.CardSpoke && window.CardSpoke.Middleware) {
      window.CardSpoke.Middleware.unregister('delete-confirmation');
      window.CardSpoke.Middleware.unregister('auto-backup');
    }
    
    // Unregister storage driver
    if (window.CardSpoke && window.CardSpoke.StorageDriverRegistry) {
      window.CardSpoke.StorageDriverRegistry.unregister('mock-cloud');
    }
    
    ctx.logger.info('Cleanup complete');
  },

  css: `
    .custom-search-bar {
      padding: 0.5rem;
    }
    
    .enhanced-search-input {
      width: 100%;
      padding: 0.75rem 1rem;
      font-size: 1rem;
      border: 2px solid var(--accent, #007bff);
      border-radius: 8px;
      background: var(--bg-primary, #fff);
      color: var(--text-primary, #000);
      transition: all 0.2s ease;
    }
    
    .enhanced-search-input:focus {
      outline: none;
      box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
      border-color: var(--accent-dark, #0056b3);
    }
  `
};
