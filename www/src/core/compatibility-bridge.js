// Compatibility Bridge
// Connects legacy CardSpoke_MODS hook system with new middleware/plugin API
// Ensures backward compatibility with existing mods

(function() {
  'use strict';

  // Hook to Middleware mapping
  const hookToMiddleware = {
    'onCardSave': 'card.save',
    'onCardDelete': 'card.delete',
    'onCardRender': 'card.render',
    'onNavigate': 'navigation.change',
    'onSearch': 'search.execute',
    'onExport': 'data.export',
    'onImport': 'data.import',
    'onThemeChange': 'theme.change',
    'onTypographyChange': 'typography.change',
    'onHighContrastChange': 'contrast.change',
    'onPageChange': 'page.change'
  };

  // Store reference to original runModHook if it exists
  const originalRunModHook = window.runModHook;

  // Create enhanced runModHook that also triggers middleware
  window.runModHookEnhanced = async function(hookName) {
    const args = Array.prototype.slice.call(arguments, 1);
    
    // Run through middleware pipeline first if mapped
    const middlewareOp = hookToMiddleware[hookName];
    if (middlewareOp && window.CardSpoke && window.CardSpoke.Middleware) {
      try {
        const result = await window.CardSpoke.Middleware.run(middlewareOp, args);
        if (result.prevented) {
          console.log('[Bridge] Operation prevented by middleware:', middlewareOp);
          return;
        }
        
        // Use modified args if middleware changed them
        if (result.context && result.context.args) {
          args.splice(0, args.length, ...result.context.args);
        }
      } catch (err) {
        console.error('[Bridge] Middleware error:', err);
      }
    }
    
    // Run original hook system if it exists
    if (originalRunModHook) {
      originalRunModHook.apply(null, [hookName].concat(args));
    }
    
    // Notify plugin system of data updates
    if (hookName === 'onCardSave' || hookName === 'onCardDelete') {
      if (window.CardSpoke && window.CardSpoke.Plugin) {
        const event = {
          type: hookName === 'onCardSave' ? 'update' : 'delete',
          cardId: args[0] ? args[0].id : null,
          card: args[0]
        };
        window.CardSpoke.Plugin.notifyDataUpdate(event);
      }
    }
  };

  // Bridge CardSpoke_MODS.register to new Plugin system
  window.registerPluginFromLegacyMod = function(modId, hooks) {
    if (!window.CardSpoke || !window.CardSpoke.Plugin) {
      console.warn('[Bridge] Plugin system not available');
      return;
    }

    // Convert hooks to middleware
    Object.keys(hooks).forEach(hookName => {
      const middlewareOp = hookToMiddleware[hookName];
      if (middlewareOp) {
        window.CardSpoke.Middleware.register({
          name: modId + ':' + hookName,
          priority: 0,
          operations: [middlewareOp],
          handler: async function(ctx, next) {
            try {
              const legacyContext = {
                modId: modId,
                appVersion: window.APP_VERSION || '0.16.0',
                schemaVersion: window.SCHEMA_VERSION || 4,
                api: ctx.api || {},
                utils: window.CardSpoke && window.CardSpoke.utils ? window.CardSpoke.utils : {},
                logger: {
                  log: console.log.bind(console, '[' + modId + ']'),
                  info: console.info.bind(console, '[' + modId + ']'),
                  warn: console.warn.bind(console, '[' + modId + ']'),
                  error: console.error.bind(console, '[' + modId + ']')
                }
              };
              
              await hooks[hookName](legacyContext, ...ctx.args);
              await next();
            } catch (err) {
              console.error('[Bridge] Legacy hook error:', err);
              await next();
            }
          }
        });
      }
    });
  };

  console.log('[Bridge] Compatibility bridge initialized');
})();
