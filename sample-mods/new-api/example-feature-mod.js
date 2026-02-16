// Example Feature Mod using New Plugin API
// Demonstrates middleware, component registry, and plugin API usage

export default {
  manifest: {
    name: 'Enhanced Card Features',
    version: '1.0.0',
    author: 'Example Author',
    description: 'Adds word count and reading time to cards',
    layer: 'feature',
    permissions: ['ui-override', 'storage']
  },

  setup: async (ctx) => {
    ctx.logger.info('Initializing Enhanced Card Features');

    // Register middleware to add metadata on save
    if (window.CardSpoke && window.CardSpoke.Middleware) {
      window.CardSpoke.Middleware.register({
        name: 'card-word-counter',
        priority: 10,
        operations: ['card.save'],
        handler: async (mwCtx, next) => {
          const card = mwCtx.args[0];
          if (card && card.body) {
            // Calculate word count
            const wordCount = card.body.split(/\s+/).filter(Boolean).length;
            
            // Store in metadata
            if (!card.metadata) card.metadata = {};
            card.metadata.wordCount = wordCount;
            card.metadata.readingTime = Math.ceil(wordCount / 200); // 200 wpm
            
            ctx.logger.log('Added metadata to card:', card.id, 'words:', wordCount);
          }
          await next();
        }
      });
    }

    // Register custom card component
    if (window.CardSpoke && window.CardSpoke.ComponentRegistry) {
      const OriginalCard = window.CardSpoke.ComponentRegistry.get('Card');
      
      window.CardSpoke.ComponentRegistry.register('Card', {
        render: (props) => {
          // Render original card
          const cardEl = OriginalCard ? 
            OriginalCard.render(props) : 
            document.createElement('div');
          
          // Add metadata display
          if (props.metadata && props.metadata.wordCount) {
            const metaBar = document.createElement('div');
            metaBar.className = 'card-metadata-bar';
            metaBar.innerHTML = `
              <span>📝 ${props.metadata.wordCount} words</span>
              <span>⏱️ ${props.metadata.readingTime} min read</span>
            `;
            cardEl.appendChild(metaBar);
          }
          
          return cardEl;
        },
        priority: 10
      }, 10);
    }

    // Listen for card updates
    ctx.api.data.onUpdate(async (event) => {
      if (event.type === 'create') {
        ctx.logger.info('New card created:', event.cardId);
        
        // Store plugin-specific data
        const count = await ctx.api.storage.get('cards_created') || 0;
        await ctx.api.storage.set('cards_created', count + 1);
      }
    });

    // Add custom UI element
    const statsPanel = document.createElement('div');
    statsPanel.id = 'card-stats-panel';
    statsPanel.className = 'stats-panel';
    
    const updateStats = async () => {
      const cards = ctx.api.data.listCards();
      const totalWords = cards.reduce((sum, card) => {
        return sum + (card.metadata?.wordCount || 0);
      }, 0);
      
      statsPanel.innerHTML = `
        <h4>Collection Stats</h4>
        <p><strong>${cards.length}</strong> cards</p>
        <p><strong>${totalWords.toLocaleString()}</strong> total words</p>
      `;
    };
    
    await updateStats();
    ctx.api.ui.inject('#sidebar', statsPanel, 'append');

    // Update stats on data changes
    ctx.api.data.onUpdate(updateStats);

    ctx.logger.info('Initialized successfully');
  },

  teardown: async (ctx) => {
    ctx.logger.info('Cleaning up Enhanced Card Features');
    
    // Unregister middleware
    if (window.CardSpoke && window.CardSpoke.Middleware) {
      window.CardSpoke.Middleware.unregister('card-word-counter');
    }
    
    // Resources automatically cleaned up by plugin system
  },

  css: `
    .card-metadata-bar {
      display: flex;
      gap: 1rem;
      padding: 0.5rem;
      background: var(--bg-secondary, #f5f5f5);
      border-top: 1px solid var(--border-color, #ddd);
      font-size: 0.875rem;
      color: var(--text-secondary, #666);
    }
    
    .stats-panel {
      padding: 1rem;
      background: var(--bg-secondary, #f5f5f5);
      border-radius: 8px;
      margin-top: 1rem;
    }
    
    .stats-panel h4 {
      margin: 0 0 0.5rem;
      font-size: 1rem;
      color: var(--text-primary, #000);
    }
    
    .stats-panel p {
      margin: 0.25rem 0;
      color: var(--text-secondary, #666);
    }
  `
};
