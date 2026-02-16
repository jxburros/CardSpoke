// Middleware Pipeline System
// Replaces the hook-based system with a priority-weighted pipeline
// Allows mods to intercept and modify core operations

(function() {
  'use strict';

  const middlewares = [];
  const middlewaresByOperation = new Map();

  class MiddlewareContextImpl {
    constructor(operation, args) {
      this.operation = operation;
      this.args = args;
      this.result = undefined;
      this.error = undefined;
      this._stopped = false;
      this._prevented = false;
    }

    stopPropagation() {
      this._stopped = true;
    }

    preventDefault() {
      this._prevented = true;
    }

    get stopped() {
      return this._stopped;
    }

    get prevented() {
      return this._prevented;
    }
  }

  const MiddlewareManager = {
    /**
     * Register a new middleware
     * @param {Object} middleware - { name, priority, operations, handler }
     */
    register: function(middleware) {
      if (!middleware.name || !middleware.handler) {
        throw new Error('Middleware must have name and handler');
      }

      middleware.priority = middleware.priority || 0;
      middleware.operations = middleware.operations || ['*'];

      // Check for duplicate
      const existing = middlewares.findIndex(m => m.name === middleware.name);
      if (existing !== -1) {
        middlewares[existing] = middleware;
      } else {
        middlewares.push(middleware);
      }

      // Sort by priority (higher priority runs first)
      middlewares.sort((a, b) => b.priority - a.priority);

      // Clear operation cache
      middlewaresByOperation.clear();

      console.log('[Middleware] Registered:', middleware.name, 'priority:', middleware.priority);
    },

    /**
     * Unregister a middleware by name
     */
    unregister: function(name) {
      const index = middlewares.findIndex(m => m.name === name);
      if (index !== -1) {
        middlewares.splice(index, 1);
        middlewaresByOperation.clear();
        console.log('[Middleware] Unregistered:', name);
      }
    },

    /**
     * Get middlewares for a specific operation
     */
    _getMiddlewaresForOperation: function(operation) {
      if (middlewaresByOperation.has(operation)) {
        return middlewaresByOperation.get(operation);
      }

      const matching = middlewares.filter(m => 
        m.operations.includes('*') || m.operations.includes(operation)
      );

      middlewaresByOperation.set(operation, matching);
      return matching;
    },

    /**
     * Run middleware pipeline for an operation
     * @param {string} operation - Operation name (e.g., 'card.save', 'card.delete')
     * @param {Array} args - Arguments for the operation
     * @returns {Promise<any>} Result of the operation
     */
    run: async function(operation, args) {
      const ctx = new MiddlewareContextImpl(operation, args);
      const matching = this._getMiddlewaresForOperation(operation);

      if (matching.length === 0) {
        return { context: ctx, prevented: false };
      }

      let index = 0;

      const next = async () => {
        if (ctx.stopped || index >= matching.length) {
          return;
        }

        const middleware = matching[index++];
        try {
          await middleware.handler(ctx, next);
        } catch (err) {
          ctx.error = err;
          console.error('[Middleware] Error in', middleware.name, ':', err);
          throw err;
        }
      };

      try {
        await next();
      } catch (err) {
        console.error('[Middleware] Pipeline error for', operation, ':', err);
      }

      return { context: ctx, prevented: ctx.prevented };
    },

    /**
     * List all registered middlewares
     */
    list: function() {
      return middlewares.map(m => ({
        name: m.name,
        priority: m.priority,
        operations: m.operations
      }));
    },

    /**
     * Clear all middlewares
     */
    clear: function() {
      middlewares.length = 0;
      middlewaresByOperation.clear();
    }
  };

  // Export to window
  if (!window.CardSpoke) window.CardSpoke = {};
  window.CardSpoke.Middleware = MiddlewareManager;

  console.log('[Middleware] Pipeline system initialized');
})();
