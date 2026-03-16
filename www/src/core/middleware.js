/*
 * Copyright 2026 Jeffrey Guntly (JX Holdings, LLC)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


// Middleware Pipeline System
// Replaces the hook-based system with a priority-weighted pipeline
// Allows plugins to intercept and modify core operations

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

      // Phase 3.2: Conflict Warning System
      // Warn if another middleware at the same priority handles overlapping operations
      const conflicts = middlewares.filter(function(m) {
        if (m.name === middleware.name) return false;
        if (m.priority !== middleware.priority) return false;
        return m.operations.some(function(op) {
          return op === '*' || middleware.operations.includes('*') || middleware.operations.includes(op);
        });
      });
      if (conflicts.length > 0) {
        console.warn('[Middleware] Conflict: "' + middleware.name + '" registered at priority ' + middleware.priority +
          ' conflicts with: ' + conflicts.map(function(m) { return m.name; }).join(', ') +
          '. Consider using different priority levels to ensure deterministic execution order.');
      }

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

  console.log('[Middleware] Pipeline system initialized');

export { MiddlewareManager as Middleware };
