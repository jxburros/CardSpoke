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


// =============================================================
// Core Systems Layer (NEW)
// Version: 0.17.0
// This file loads first and initializes the new architecture:
// - Middleware Pipeline
// - Component Registry
// - Plugin API
// - Storage Driver Registry
// - Permissions System
// =============================================================

'use strict';

// Include core systems
// Middleware Pipeline System
// Replaces the hook-based system with a priority-weighted pipeline
// Allows plugins to intercept and modify core operations

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

  // Export to window
  if (!window.CardSpoke) window.CardSpoke = {};
  window.CardSpoke.Middleware = MiddlewareManager;

  console.log('[Middleware] Pipeline system initialized');
})();
// Component Registry System
// Allows plugins to register and override UI components
// Provides a central registry for component resolution

(function() {
  'use strict';

  const components = new Map();
  const componentPriorities = new Map();

  const ComponentRegistry = {
    /**
     * Register a component
     * @param {string} name - Component name (e.g., 'Card', 'Sidebar', 'SearchBar')
     * @param {Object} component - { render, priority? }
     * @param {number} priority - Priority (higher wins, default 0)
     */
    register: function(name, component, priority) {
      if (!name || !component) {
        throw new Error('Component name and definition are required');
      }

      priority = priority !== undefined ? priority : (component.priority || 0);

      const existing = components.get(name);
      if (existing && componentPriorities.get(name) > priority) {
        console.warn('[ComponentRegistry] Component', name, 'not overridden (lower priority)');
        return;
      }

      // Phase 3.2: Conflict Warning System
      // Warn if an existing registration at the exact same priority is being replaced
      if (existing && componentPriorities.get(name) === priority) {
        console.warn('[ComponentRegistry] Conflict: Component "' + name + '" is already registered at priority ' +
          priority + '. The previous registration will be overridden. ' +
          'Consider using different priority levels to avoid ambiguous overrides.');
      }

      components.set(name, component);
      componentPriorities.set(name, priority);

      console.log('[ComponentRegistry] Registered:', name, 'priority:', priority);
    },

    /**
     * Unregister a component
     */
    unregister: function(name) {
      if (components.has(name)) {
        components.delete(name);
        componentPriorities.delete(name);
        console.log('[ComponentRegistry] Unregistered:', name);
      }
    },

    /**
     * Get a component by name
     */
    get: function(name) {
      return components.get(name);
    },

    /**
     * Resolve a component (same as get, but for API compatibility)
     */
    resolve: function(name) {
      return this.get(name);
    },

    /**
     * Check if a component is registered
     */
    has: function(name) {
      return components.has(name);
    },

    /**
     * List all registered components
     */
    list: function() {
      const result = [];
      components.forEach((component, name) => {
        result.push({
          name: name,
          priority: componentPriorities.get(name)
        });
      });
      return result;
    },

    /**
     * Clear all components
     */
    clear: function() {
      components.clear();
      componentPriorities.clear();
    }
  };

  // Export to window
  if (!window.CardSpoke) window.CardSpoke = {};
  window.CardSpoke.ComponentRegistry = ComponentRegistry;

  console.log('[ComponentRegistry] System initialized');
})();
// Plugin Validation System
// Validates plugin manifests, CSS, and JS content before execution
// Prevents malformed or potentially dangerous plugins from loading

(function() {
  'use strict';

  // Valid values for plugin manifest fields
  var VALID_LAYERS = ['theme', 'feature', 'app'];
  var VALID_PERMISSIONS = ['ui-override', 'storage', 'network', 'filesystem', 'core-override', 'data-modify'];
  var MAX_CSS_LENGTH = 100000;   // 100KB max CSS
  var MAX_JS_LENGTH = 500000;    // 500KB max JS

  // Dangerous CSS patterns that could be used for attacks
  var DANGEROUS_CSS_PATTERNS = [
    { pattern: /@import/gi, name: '@import (external resource loading)' },
    { pattern: /javascript:/gi, name: 'javascript: protocol' },
    { pattern: /behavior:/gi, name: 'behavior: (IE behavior)' },
    { pattern: /-moz-binding/gi, name: '-moz-binding (Mozilla binding)' },
    { pattern: /expression\s*\(/gi, name: 'expression() (IE expressions)' }
  ];

  // Dangerous JS patterns
  // Task 1.3: Allow new Function('ctx', ...) since the installer uses that exact pattern
  // to instantiate stringified JS from manifests. Other new Function() forms are still blocked.
  var DANGEROUS_JS_PATTERNS = [
    { pattern: /\beval\s*\(/g, name: 'eval()' },
    { pattern: /\bnew\s+Function\s*\(\s*(?!['"]ctx['"])/g, name: 'new Function()' }
  ];

  var PluginValidator = {
    /**
     * Validate a complete plugin package
     * @param {Object} plugin - Plugin object to validate
     * @returns {Object} { valid: boolean, errors: string[], warnings: string[], sanitized: Object }
     */
    validate: function(plugin) {
      var errors = [];
      var warnings = [];

      // 1. Validate required fields
      if (!plugin) {
        return { valid: false, errors: ['Plugin object is required'], warnings: [], sanitized: null };
      }

      if (!plugin.id || typeof plugin.id !== 'string') {
        errors.push('Plugin must have a string id');
      } else if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(plugin.id)) {
        warnings.push('Plugin id should use lowercase letters, numbers, and hyphens only');
      }

      // 2. Validate manifest
      var manifestResult = this.validateManifest(plugin.manifest);
      errors = errors.concat(manifestResult.errors);
      warnings = warnings.concat(manifestResult.warnings);

      // 3. Validate and sanitize CSS
      if (plugin.css) {
        var cssResult = this.validateCSS(plugin.css);
        errors = errors.concat(cssResult.errors);
        warnings = warnings.concat(cssResult.warnings);
        if (cssResult.sanitized !== plugin.css) {
          plugin.css = cssResult.sanitized;
        }
      }

      // 4. Validate JS
      if (plugin.js) {
        var jsResult = this.validateJS(plugin.js);
        errors = errors.concat(jsResult.errors);
        warnings = warnings.concat(jsResult.warnings);
      }

      return {
        valid: errors.length === 0,
        errors: errors,
        warnings: warnings,
        sanitized: errors.length === 0 ? plugin : null
      };
    },

    /**
     * Validate plugin manifest structure
     * @param {Object} manifest - Plugin manifest
     * @returns {Object} { errors: string[], warnings: string[] }
     */
    validateManifest: function(manifest) {
      var errors = [];
      var warnings = [];

      if (!manifest || typeof manifest !== 'object') {
        errors.push('Plugin manifest is required and must be an object');
        return { errors: errors, warnings: warnings };
      }

      // Required fields
      if (!manifest.name || typeof manifest.name !== 'string') {
        errors.push('manifest.name is required and must be a string');
      } else if (manifest.name.length > 100) {
        errors.push('manifest.name must be 100 characters or less');
      }

      if (!manifest.version || typeof manifest.version !== 'string') {
        errors.push('manifest.version is required and must be a string');
      } else if (!/^\d+\.\d+\.\d+/.test(manifest.version)) {
        warnings.push('manifest.version should follow semver format (e.g., 1.0.0)');
      }

      if (!manifest.layer || typeof manifest.layer !== 'string') {
        errors.push('manifest.layer is required and must be a string');
      } else if (VALID_LAYERS.indexOf(manifest.layer) === -1) {
        errors.push('manifest.layer must be one of: ' + VALID_LAYERS.join(', '));
      }

      // Optional fields
      if (manifest.author && typeof manifest.author !== 'string') {
        warnings.push('manifest.author should be a string');
      } else if (manifest.author && manifest.author.length > 200) {
        warnings.push('manifest.author should be 200 characters or less');
      }

      if (manifest.description && typeof manifest.description !== 'string') {
        warnings.push('manifest.description should be a string');
      } else if (manifest.description && manifest.description.length > 500) {
        warnings.push('manifest.description should be 500 characters or less');
      }

      // Validate permissions
      if (manifest.permissions) {
        if (!Array.isArray(manifest.permissions)) {
          errors.push('manifest.permissions must be an array');
        } else {
          manifest.permissions.forEach(function(perm) {
            if (VALID_PERMISSIONS.indexOf(perm) === -1) {
              warnings.push('Unknown permission: ' + perm);
            }
          });
        }
      }

      return { errors: errors, warnings: warnings };
    },

    /**
     * Validate and sanitize CSS content
     * @param {string} css - CSS string to validate
     * @returns {Object} { errors: string[], warnings: string[], sanitized: string }
     */
    validateCSS: function(css) {
      var errors = [];
      var warnings = [];
      var sanitized = css;

      if (typeof css !== 'string') {
        return { errors: ['CSS must be a string'], warnings: [], sanitized: '' };
      }

      if (css.length > MAX_CSS_LENGTH) {
        errors.push('CSS exceeds maximum size of ' + MAX_CSS_LENGTH + ' characters');
        return { errors: errors, warnings: warnings, sanitized: css };
      }

      // Check and remove dangerous patterns
      DANGEROUS_CSS_PATTERNS.forEach(function(entry) {
        if (entry.pattern.test(sanitized)) {
          warnings.push('Removed dangerous CSS pattern: ' + entry.name);
          sanitized = sanitized.replace(entry.pattern, '/* removed */');
        }
        // Reset lastIndex for global regex
        entry.pattern.lastIndex = 0;
      });

      return { errors: errors, warnings: warnings, sanitized: sanitized };
    },

    /**
     * Validate JS content for dangerous patterns
     * @param {string} js - JS string to validate
     * @returns {Object} { errors: string[], warnings: string[] }
     */
    validateJS: function(js) {
      var errors = [];
      var warnings = [];

      if (typeof js !== 'string') {
        return { errors: ['JS must be a string'], warnings: [] };
      }

      if (js.length > MAX_JS_LENGTH) {
        errors.push('JS exceeds maximum size of ' + MAX_JS_LENGTH + ' characters');
        return { errors: errors, warnings: warnings };
      }

      // Check for dangerous patterns
      DANGEROUS_JS_PATTERNS.forEach(function(entry) {
        if (entry.pattern.test(js)) {
          errors.push('Plugin contains ' + entry.name + ' - not allowed');
        }
        // Reset lastIndex for global regex
        entry.pattern.lastIndex = 0;
      });

      return { errors: errors, warnings: warnings };
    }
  };

  // Export to window
  if (!window.CardSpoke) window.CardSpoke = {};
  window.CardSpoke.PluginValidator = PluginValidator;

  console.log('[PluginValidator] Validation system initialized');
})();
// Plugin API System
// Provides sandboxed contexts and resource management for plugins
// with isolated contexts and automatic cleanup support

(function() {
  'use strict';

  const plugins = new Map();
  const pluginResources = new Map();
  const dataUpdateListeners = new Map();

  // Task 1.5: Central global event bus for cross-plugin communication
  // Handlers stored as { pluginId, callback } entries per event name
  const globalEventBus = new Map();

  // Stable internal references captured at initialization time
  const InternalAPI = {
    data: {},
    ui: {},
    utils: {}
  };

  function captureInternalReferences() {
    if (!InternalAPI.data.createCard && window.createCard) InternalAPI.data.createCard = window.createCard;
    if (!InternalAPI.data.updateCard && window.updateCard) InternalAPI.data.updateCard = window.updateCard;
    if (!InternalAPI.data.deleteCard && window.deleteCard) InternalAPI.data.deleteCard = window.deleteCard;
    if (!InternalAPI.utils.cloneCard && window.cloneCard) InternalAPI.utils.cloneCard = window.cloneCard;
    if (!InternalAPI.data.getTags && window.getTags) InternalAPI.data.getTags = window.getTags;
    if (!InternalAPI.data.addTag && window.addTag) InternalAPI.data.addTag = window.addTag;
    if (!InternalAPI.data.removeTag && window.removeTag) InternalAPI.data.removeTag = window.removeTag;
    if (!InternalAPI.data.setTags && window.setTags) InternalAPI.data.setTags = window.setTags;
    if (!InternalAPI.data.getAllTags && window.getAllTags) InternalAPI.data.getAllTags = window.getAllTags;
    if (!InternalAPI.ui.showToast && window.showToast) InternalAPI.ui.showToast = window.showToast;
  }

  function hasPermission(pluginId, permission) {
    if (window.CardSpoke && window.CardSpoke.Permissions) {
      return window.CardSpoke.Permissions.hasPermission(pluginId, permission);
    }
    return true;
  }

  function createUIApi(pluginId) {
    const resources = pluginResources.get(pluginId) || new Set();

    return {
      inject: function(selector, element, position) {
        if (!hasPermission(pluginId, 'ui-override')) {
          throw new Error('Plugin does not have ui-override permission');
        }
        position = position || 'append';
        const target = document.querySelector(selector);
        if (!target) {
          console.warn('[Plugin:' + pluginId + '] Selector not found:', selector);
          return () => {};
        }

        switch (position) {
          case 'before':
            target.parentNode.insertBefore(element, target);
            break;
          case 'after':
            target.parentNode.insertBefore(element, target.nextSibling);
            break;
          case 'prepend':
            target.insertBefore(element, target.firstChild);
            break;
          case 'append':
          default:
            target.appendChild(element);
            break;
        }

        const resource = { type: 'dom', element: element };
        resources.add(resource);

        return function() {
          if (element.parentNode) {
            element.parentNode.removeChild(element);
          }
          resources.delete(resource);
        };
      },

      replace: function(selector, element) {
        if (!hasPermission(pluginId, 'ui-override')) {
          throw new Error('Plugin does not have ui-override permission');
        }
        const target = document.querySelector(selector);
        if (!target) {
          console.warn('[Plugin:' + pluginId + '] Selector not found:', selector);
          return () => {};
        }

        const original = target;
        target.parentNode.replaceChild(element, target);

        const resource = { type: 'dom', element: element, original: original };
        resources.add(resource);

        return function() {
          if (element.parentNode) {
            element.parentNode.replaceChild(original, element);
          }
          resources.delete(resource);
        };
      },

      registerComponent: function(name, component) {
        if (!hasPermission(pluginId, 'ui-override')) {
          throw new Error('Plugin does not have ui-override permission');
        }
        if (window.CardSpoke && window.CardSpoke.ComponentRegistry) {
          window.CardSpoke.ComponentRegistry.register(name, component, component.priority || 0);
          const resource = { type: 'component', name: name };
          resources.add(resource);
        }
      },

      unregisterComponent: function(name) {
        if (window.CardSpoke && window.CardSpoke.ComponentRegistry) {
          window.CardSpoke.ComponentRegistry.unregister(name);
        }
      },

      showToast: function(message, type, duration) {
        var fn = InternalAPI.ui.showToast || window.showToast;
        if (fn) {
          fn(message, type || 'info', duration);
        }
      }
    };
  }

  function createDataApi(pluginId) {
    const resources = pluginResources.get(pluginId) || new Set();

    return {
      onUpdate: function(callback) {
        const listeners = dataUpdateListeners.get(pluginId) || [];
        listeners.push(callback);
        dataUpdateListeners.set(pluginId, listeners);

        const resource = { type: 'listener', callback: callback };
        resources.add(resource);

        return function() {
          const idx = listeners.indexOf(callback);
          if (idx !== -1) {
            listeners.splice(idx, 1);
          }
          resources.delete(resource);
        };
      },

      getCard: function(id) {
        if (window.store && window.store.cards && window.store.cards[id]) {
          var cloneFn = InternalAPI.utils.cloneCard || window.cloneCard;
          if (cloneFn) return cloneFn(window.store.cards[id]);
          if (typeof structuredClone === 'function') return structuredClone(window.store.cards[id]);
          return JSON.parse(JSON.stringify(window.store.cards[id]));
        }
        return undefined;
      },

      listCards: function() {
        if (window.store && window.store.cards) {
          var cloneFn = InternalAPI.utils.cloneCard || window.cloneCard;
          return Object.values(window.store.cards).map(function(card) {
            if (cloneFn) return cloneFn(card);
            if (typeof structuredClone === 'function') return structuredClone(card);
            return JSON.parse(JSON.stringify(card));
          });
        }
        return [];
      },

      createCard: function(data) {
        if (!hasPermission(pluginId, 'data-modify')) {
          throw new Error('Plugin does not have data-modify permission');
        }
        var fn = InternalAPI.data.createCard || window.createCard;
        if (fn) {
          return fn(data.title || '', data.body || '', data.parentId || null, false, false);
        }
        throw new Error('createCard not available');
      },

      updateCard: function(id, updates) {
        if (!hasPermission(pluginId, 'data-modify')) {
          throw new Error('Plugin does not have data-modify permission');
        }
        var fn = InternalAPI.data.updateCard || window.updateCard;
        if (fn) {
          fn(id, updates, false, false);
          return this.getCard(id);
        }
        throw new Error('updateCard not available');
      },

      deleteCard: function(id) {
        if (!hasPermission(pluginId, 'data-modify')) {
          throw new Error('Plugin does not have data-modify permission');
        }
        var fn = InternalAPI.data.deleteCard || window.deleteCard;
        if (fn) {
          fn(id);
          return true;
        }
        return false;
      },

      getTags: function(cardId) {
        var fn = InternalAPI.data.getTags || window.getTags;
        if (fn) {
          return fn(cardId);
        }
        return [];
      },

      addTag: function(cardId, tag) {
        if (!hasPermission(pluginId, 'data-modify')) {
          throw new Error('Plugin does not have data-modify permission');
        }
        var fn = InternalAPI.data.addTag || window.addTag;
        if (fn) {
          return fn(cardId, tag);
        }
        return false;
      },

      removeTag: function(cardId, tag) {
        if (!hasPermission(pluginId, 'data-modify')) {
          throw new Error('Plugin does not have data-modify permission');
        }
        var fn = InternalAPI.data.removeTag || window.removeTag;
        if (fn) {
          return fn(cardId, tag);
        }
        return false;
      },

      setTags: function(cardId, tags) {
        if (!hasPermission(pluginId, 'data-modify')) {
          throw new Error('Plugin does not have data-modify permission');
        }
        var fn = InternalAPI.data.setTags || window.setTags;
        if (fn) {
          return fn(cardId, tags);
        }
        return false;
      },

      getAllTags: function() {
        var fn = InternalAPI.data.getAllTags || window.getAllTags;
        if (fn) {
          return fn();
        }
        return [];
      }
    };
  }

  function createStorageApi(pluginId) {
    const namespace = 'plugin_' + pluginId + '_';

    return {
      getNamespace: function() {
        return namespace;
      },

      get: async function(key) {
        if (!hasPermission(pluginId, 'storage')) {
          throw new Error('Plugin does not have storage permission');
        }
        const fullKey = namespace + key;
        if (window.storageDriver && window.storageDriver.get) {
          return await window.storageDriver.get(fullKey);
        }
        const raw = localStorage.getItem(fullKey);
        if (raw === null) return null;
        try { return JSON.parse(raw); } catch(e) { return raw; }
      },

      set: async function(key, value) {
        if (!hasPermission(pluginId, 'storage')) {
          throw new Error('Plugin does not have storage permission');
        }
        const fullKey = namespace + key;
        if (window.storageDriver && window.storageDriver.set) {
          return await window.storageDriver.set(fullKey, value);
        }
        localStorage.setItem(fullKey, JSON.stringify(value));
      },

      remove: async function(key) {
        if (!hasPermission(pluginId, 'storage')) {
          throw new Error('Plugin does not have storage permission');
        }
        const fullKey = namespace + key;
        if (window.storageDriver && window.storageDriver.remove) {
          return await window.storageDriver.remove(fullKey);
        }
        localStorage.removeItem(fullKey);
      },

      list: async function(prefix) {
        if (!hasPermission(pluginId, 'storage')) {
          throw new Error('Plugin does not have storage permission');
        }
        const fullPrefix = namespace + (prefix || '');
        if (window.storageDriver && window.storageDriver.list) {
          return await window.storageDriver.list(fullPrefix);
        }
        // Fallback for localStorage
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(fullPrefix)) {
            keys.push(key.substring(namespace.length));
          }
        }
        return keys;
      }
    };
  }

  function createEventApi(pluginId) {
    // Task 1.5: Use global event bus for cross-plugin communication while
    // preserving per-plugin ctx.api.events interface
    const resources = pluginResources.get(pluginId) || new Set();

    return {
      on: function(event, callback) {
        // Ensure the handlers array exists in the global bus, then append to the same reference
        if (!globalEventBus.has(event)) {
          globalEventBus.set(event, []);
        }
        const handlers = globalEventBus.get(event);
        handlers.push({ pluginId: pluginId, callback: callback });

        const resource = { type: 'event', event: event, callback: callback };
        resources.add(resource);

        return function() {
          const list = globalEventBus.get(event);
          if (list) {
            const idx = list.findIndex(function(h) { return h.callback === callback && h.pluginId === pluginId; });
            if (idx !== -1) {
              list.splice(idx, 1);
            }
          }
          resources.delete(resource);
        };
      },

      emit: function(event) {
        const handlers = globalEventBus.get(event);
        if (handlers) {
          const args = Array.prototype.slice.call(arguments, 1);
          // Iterate over a copy to avoid issues if handlers array is modified during dispatch
          handlers.slice().forEach(function(entry) {
            try {
              entry.callback.apply(null, args);
            } catch (err) {
              console.error('[EventBus] Handler error in plugin ' + entry.pluginId + ':', err);
            }
          });
        }
      },

      once: function(event, callback) {
        const self = this;
        const wrapper = function() {
          self.off(event, wrapper);
          callback.apply(null, arguments);
        };
        return this.on(event, wrapper);
      },

      off: function(event, callback) {
        const list = globalEventBus.get(event);
        if (list) {
          const idx = list.findIndex(function(h) { return h.callback === callback && h.pluginId === pluginId; });
          if (idx !== -1) {
            list.splice(idx, 1);
          }
        }
      }
    };
  }

  function createNetworkApi(pluginId) {
    return {
      fetch: async function(url, options) {
        if (!hasPermission(pluginId, 'network')) {
          throw new Error('Plugin does not have network permission');
        }
        return window.fetch(url, options);
      },
      xhr: function() {
        if (!hasPermission(pluginId, 'network')) {
          throw new Error('Plugin does not have network permission');
        }
        return new XMLHttpRequest();
      }
    };
  }

  function createFilesystemApi(pluginId) {
    return {
      readFile: async function(path, options) {
        if (!hasPermission(pluginId, 'filesystem')) {
          throw new Error('Plugin does not have filesystem permission');
        }
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Filesystem) {
          return window.Capacitor.Plugins.Filesystem.readFile(Object.assign({}, options, { path: path }));
        }
        throw new Error('Filesystem not available on this platform');
      },
      writeFile: async function(path, data, options) {
        if (!hasPermission(pluginId, 'filesystem')) {
          throw new Error('Plugin does not have filesystem permission');
        }
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Filesystem) {
          return window.Capacitor.Plugins.Filesystem.writeFile(Object.assign({}, options, { path: path, data: data }));
        }
        throw new Error('Filesystem not available on this platform');
      }
    };
  }

  function createLogger(pluginId) {
    const prefix = '[Plugin:' + pluginId + ']';
    return {
      log: function() { console.log.apply(console, [prefix].concat(Array.from(arguments))); },
      info: function() { console.info.apply(console, [prefix].concat(Array.from(arguments))); },
      warn: function() { console.warn.apply(console, [prefix].concat(Array.from(arguments))); },
      error: function() { console.error.apply(console, [prefix].concat(Array.from(arguments))); }
    };
  }

  function createPluginContext(pluginId) {
    return {
      modId: pluginId,
      appVersion: window.APP_VERSION || '0.17.0',
      schemaVersion: window.SCHEMA_VERSION || 4,
      api: {
        ui: createUIApi(pluginId),
        data: createDataApi(pluginId),
        storage: createStorageApi(pluginId),
        events: createEventApi(pluginId),
        network: createNetworkApi(pluginId),
        filesystem: createFilesystemApi(pluginId)
      },
      utils: window.CardSpoke && window.CardSpoke.utils ? window.CardSpoke.utils : {},
      logger: createLogger(pluginId)
    };
  }

  // Phase 3.4: Sandbox Hardening
  // Centralized factory for all plugin JS execution.
  // All plugin code is instantiated here, providing a single upgrade point
  // when full iframe or Web Worker isolation is implemented in the future.
  //
  // Current approach: new Function('ctx', code) creates a function scope
  // where 'ctx' is the only explicitly-named parameter, providing the
  // plugin's entire allowed API surface. Direct window access is not blocked
  // at this level; future work should run this function inside a dedicated
  // iframe or Worker that exposes a controlled message-passing API instead
  // of the live window object.
  function _createSandboxedFunction(code) {
    return new Function('ctx', code);
  }

  const PluginManager = {
    register: function(id, definition) {
      if (!id || !definition) {
        throw new Error('Plugin ID and definition are required');
      }

      if (!definition.manifest) {
        throw new Error('Plugin manifest is required');
      }

      // Validate plugin content if validator is available
      if (window.CardSpoke && window.CardSpoke.PluginValidator) {
        var validationResult = window.CardSpoke.PluginValidator.validate({
          id: id,
          manifest: definition.manifest,
          css: definition.css,
          js: definition.js
        });

        if (validationResult.warnings.length > 0) {
          validationResult.warnings.forEach(function(w) {
            console.warn('[Plugin] Validation warning for ' + id + ':', w);
          });
        }

        if (!validationResult.valid) {
          throw new Error('Plugin validation failed: ' + validationResult.errors.join('; '));
        }
      }

      const context = createPluginContext(id);
      const instance = {
        id: id,
        definition: definition,
        context: context,
        enabled: false,
        resources: new Set()
      };

      plugins.set(id, instance);
      pluginResources.set(id, instance.resources);

      console.log('[Plugin] Registered:', id);
    },

    unregister: function(id) {
      const instance = plugins.get(id);
      if (instance) {
        if (instance.enabled) {
          this.disable(id);
        }
        this._cleanupResources(id);
        plugins.delete(id);
        pluginResources.delete(id);
        dataUpdateListeners.delete(id);
        
        // Remove from store
        if (window.store && window.store.plugins) {
          delete window.store.plugins[id];
          if (window.save) {
            window.save();
          }
        }
        
        console.log('[Plugin] Unregistered:', id);
      }
    },

    get: function(id) {
      return plugins.get(id);
    },

    list: function() {
      return Array.from(plugins.values());
    },

    enable: async function(id) {
      const instance = plugins.get(id);
      if (!instance) {
        throw new Error('Plugin not found: ' + id);
      }

      if (instance.enabled) {
        return;
      }

      // Capture stable internal references before plugin runs
      captureInternalReferences();

      // Task 2.6: Pass config to plugin context
      if (instance.definition.manifest.config) {
        instance.context.config = instance.definition.manifest.config;
      }

      // Task 2.6: Apply overrides from manifest
      if (instance.definition.manifest.overrides) {
        const overrides = instance.definition.manifest.overrides;
        if (overrides.appName && typeof overrides.appName === 'string') {
          const brandBtn = document.getElementById && document.getElementById('brandBtn');
          if (brandBtn) brandBtn.textContent = overrides.appName;
        }
      }

      // Check permissions
      if (instance.definition.manifest.permissions) {
        const granted = await this._checkPermissions(id, instance.definition.manifest.permissions);
        if (!granted) {
          throw new Error('Permissions not granted for plugin: ' + id);
        }
      }

      // Apply CSS
      if (instance.definition.css) {
        this._applyCSS(id, instance.definition.css);
      }

      // Run setup
      if (instance.definition.setup) {
        try {
          await instance.definition.setup(instance.context);
        } catch (err) {
          console.error('[Plugin] Setup error for', id, ':', err);
          console.error('[Plugin] Stack trace:', err.stack);
          // Clean up partially applied resources
          this._removeCSS(id);
          this._cleanupResources(id);
          if (instance.context && instance.context.logger) {
            instance.context.logger.error('Plugin setup failed and was disabled: ' + err.message);
          }
          throw err;
        }
      }

      instance.enabled = true;
      console.log('[Plugin] Enabled:', id);
    },

    disable: async function(id) {
      const instance = plugins.get(id);
      if (!instance) {
        throw new Error('Plugin not found: ' + id);
      }

      if (!instance.enabled) {
        return;
      }

      // Run teardown
      if (instance.definition.teardown) {
        try {
          await instance.definition.teardown(instance.context);
        } catch (err) {
          console.error('[Plugin] Teardown error for', id, ':', err);
          console.error('[Plugin] Stack trace:', err.stack);
          if (instance.context && instance.context.logger) {
            instance.context.logger.warn('Plugin cleanup had errors but continuing: ' + err.message);
          }
          // Continue anyway - don't let cleanup errors break app
        }
      }

      // Remove CSS
      this._removeCSS(id);

      // Cleanup resources
      this._cleanupResources(id);

      instance.enabled = false;
      console.log('[Plugin] Disabled:', id);
    },

    _applyCSS: function(id, css) {
      const existing = document.querySelector('style[data-plugin-id="' + id + '"]');
      if (existing) {
        existing.textContent = css;
      } else {
        const style = document.createElement('style');
        style.setAttribute('data-plugin-id', id);
        style.textContent = css;
        document.head.appendChild(style);
      }
    },

    _removeCSS: function(id) {
      const style = document.querySelector('style[data-plugin-id="' + id + '"]');
      if (style && style.parentNode) {
        style.parentNode.removeChild(style);
      }
    },

    _cleanupResources: function(id) {
      const resources = pluginResources.get(id);
      if (resources) {
        resources.forEach(function(resource) {
          try {
            if (resource.type === 'dom' && resource.element && resource.element.parentNode) {
              resource.element.parentNode.removeChild(resource.element);
            } else if (resource.type === 'component' && window.CardSpoke && window.CardSpoke.ComponentRegistry) {
              window.CardSpoke.ComponentRegistry.unregister(resource.name);
            } else if (resource.type === 'event') {
              // Task 1.5: Clean up global event bus handlers on plugin disable/unregister
              const list = globalEventBus.get(resource.event);
              if (list) {
                const idx = list.findIndex(function(h) { return h.callback === resource.callback && h.pluginId === id; });
                if (idx !== -1) {
                  list.splice(idx, 1);
                }
              }
            }
          } catch (err) {
            console.error('[Plugin] Resource cleanup error:', err);
          }
        });
        resources.clear();
      }
    },

    _checkPermissions: async function(id, permissions) {
      // Task 1.4: Use PermissionsManager for actual user consent instead of auto-granting
      console.log('[Plugin] Permissions requested for', id, ':', permissions);

      if (!permissions || permissions.length === 0) {
        return true;
      }

      // Use the PermissionsManager if available (preferred path)
      if (window.CardSpoke && window.CardSpoke.Permissions) {
        const instance = plugins.get(id);
        const pluginName = (instance && instance.definition.manifest && instance.definition.manifest.name) || id;
        return await window.CardSpoke.Permissions.requestPermissions(id, pluginName, permissions);
      }

      // Fallback: use global dialog if available
      if (window.showPermissionDialog) {
        return await window.showPermissionDialog(id, permissions);
      }

      // Last resort: deny by default when no consent mechanism is available
      console.warn('[Plugin] No permission consent mechanism available; denying permissions for', id);
      return false;
    },

    notifyDataUpdate: function(event) {
      dataUpdateListeners.forEach(function(listeners, pluginId) {
        listeners.forEach(function(callback) {
          try {
            callback(event);
          } catch (err) {
            console.error('[Plugin] Data update callback error:', err);
          }
        });
      });
    },

    /**
     * List all registered plugins
     * @returns {Array} Array of plugin instances
     */
    listAll: function() {
      return this.list();
    },

    /**
     * Install a plugin from a package definition
     * @param {Object} pkg - Plugin package with manifest, setup, teardown, css, js
     * @returns {Promise<string>} Plugin ID
     */
    install: async function(pkg) {
      if (!pkg || !pkg.manifest) {
        throw new Error('Invalid plugin package: manifest is required');
      }

      // Phase 3.3: Dependency Checking
      // Halt installation if any declared dependency is not already installed
      if (pkg.manifest.dependencies && Array.isArray(pkg.manifest.dependencies) && pkg.manifest.dependencies.length > 0) {
        const missing = pkg.manifest.dependencies.filter(function(dep) {
          return !plugins.has(dep);
        });
        if (missing.length > 0) {
          throw new Error('Missing dependencies: ' + missing.join(', ') + '. Install the required plugins first.');
        }
      }

      // Task 1.2: Support pkg.js field via sandboxed function factory
      if (!pkg.setup) {
        if (pkg.js && typeof pkg.js === 'string') {
          pkg.setup = _createSandboxedFunction(pkg.js);
        } else if (pkg.javascript && typeof pkg.javascript === 'string') {
          pkg.setup = _createSandboxedFunction(pkg.javascript);
        }
      }

      // Generate unique ID
      let id = pkg.manifest.id || pkg.manifest.name.toLowerCase().replace(/\s+/g, '-');
      
      // Task 2.4: If plugin with this base ID already exists, update it
      if (plugins.has(id)) {
        const existing = plugins.get(id);
        if (existing.enabled) {
          await this.disable(id);
        }
        this.unregister(id);
      }
      
      // Register the plugin
      const definition = {
        manifest: pkg.manifest,
        setup: pkg.setup,
        teardown: pkg.teardown,
        css: pkg.css,
        js: pkg.js || pkg.javascript  // Preserve raw JS string for Task 2.1 (persistence)
      };
      
      this.register(id, definition);

      // Auto-enable based on risk (only LOW and SAFE)
      const risk = this.assessModRisk(pkg);
      if (risk === 'SAFE' || risk === 'LOW') {
        await this.enable(id);
      }

      // Persist to store
      if (window.store) {
        if (!window.store.plugins) {
          window.store.plugins = {};
        }
        window.store.plugins[id] = {
          definition: definition,
          enabled: risk === 'SAFE' || risk === 'LOW'
        };
        if (window.save) {
          window.save();
        }
      }

      console.log('[Plugin] Installed:', id);
      return id;
    },

    /**
     * Assess the risk level of a plugin package
     * @param {Object} pkg - Plugin package
     * @returns {string} Risk level: SAFE, LOW, MEDIUM, HIGH
     */
    assessModRisk: function(pkg) {
      if (!pkg || !pkg.manifest) {
        return 'HIGH';
      }

      const manifest = pkg.manifest;
      const layer = manifest.layer || 'feature';
      const hasJS = !!pkg.setup || !!pkg.teardown;
      const hasCSS = !!pkg.css;
      const hasOverrides = !!pkg.overrides || !!(manifest.overrides);

      // Theme layer - CSS only
      if (layer === 'theme' && !hasJS && hasCSS) {
        return 'SAFE';
      }

      // Feature layer - CSS and JS, no overrides
      if (layer === 'feature' && !hasOverrides) {
        return 'LOW';
      }

      // App layer or has overrides
      if (layer === 'app' || hasOverrides) {
        return 'HIGH';
      }

      // Default to medium risk
      return 'MEDIUM';
    },

    /**
     * Sync plugins from store during boot
     * Loads registered plugins from store and enables them if not in safe mode
     * @param {boolean} safeMode - If true, plugins are loaded but not enabled
     */
    syncFromStore: async function(safeMode) {
      if (!window.store || !window.store.plugins) {
        return;
      }

      const storedPlugins = window.store.plugins || {};
      const pluginIds = Object.keys(storedPlugins);

      if (pluginIds.length === 0) {
        return;
      }

      console.log('[Plugin] Syncing', pluginIds.length, 'plugins from store');

      for (const id of pluginIds) {
        const pluginData = storedPlugins[id];
        
        try {
          // Register the plugin
          if (pluginData.definition) {
            // Task 2.1: Reconstruct setup/teardown from saved JS string via sandbox factory
            const def = pluginData.definition;
            if (!def.setup && def.js && typeof def.js === 'string') {
              def.setup = _createSandboxedFunction(def.js);
            }
            if (!def.teardown && def.teardownJs && typeof def.teardownJs === 'string') {
              def.teardown = _createSandboxedFunction(def.teardownJs);
            }
            this.register(id, pluginData.definition);
            
            // Enable if not in safe mode and plugin was previously enabled
            if (!safeMode && pluginData.enabled) {
              await this.enable(id);
            }
          }
        } catch (err) {
          console.error('[Plugin] Failed to sync plugin', id, ':', err);
        }
      }
    },

    /**
     * Phase 3.1: Auto-Generated Settings UI
     * Dynamically build a settings panel from the plugin's config object.
     * Each config key becomes a labelled form input whose type is inferred
     * from the value type (boolean → checkbox, number → number, else → text).
     * Changes made in the panel are written back to the plugin's live context.
     *
     * @param {string} id - Plugin ID
     * @returns {HTMLElement|null} A <div class="plugin-settings-panel"> element,
     *   or null if the plugin has no config.
     */
    buildSettingsPanel: function(id) {
      const instance = plugins.get(id);
      if (!instance) return null;

      const config = instance.definition.manifest && instance.definition.manifest.config;
      if (!config || typeof config !== 'object') return null;

      const keys = Object.keys(config);
      if (keys.length === 0) return null;

      const panel = document.createElement('div');
      panel.className = 'plugin-settings-panel';
      panel.setAttribute('data-plugin-id', id);

      const title = document.createElement('h3');
      title.className = 'plugin-settings-title';
      title.textContent = (instance.definition.manifest.name || id) + ' Settings';
      panel.appendChild(title);

      keys.forEach(function(key) {
        const defaultValue = config[key];
        const valueType = typeof defaultValue;

        const row = document.createElement('div');
        row.className = 'plugin-settings-row';

        const label = document.createElement('label');
        label.textContent = key;
        label.setAttribute('for', 'plugin-setting-' + id + '-' + key);

        let input;
        if (valueType === 'boolean') {
          input = document.createElement('input');
          input.type = 'checkbox';
          input.checked = defaultValue;
        } else if (valueType === 'number') {
          input = document.createElement('input');
          input.type = 'number';
          input.value = String(defaultValue);
        } else {
          input = document.createElement('input');
          input.type = 'text';
          input.value = defaultValue != null ? String(defaultValue) : '';
        }

        input.id = 'plugin-setting-' + id + '-' + key;
        input.setAttribute('data-config-key', key);
        input.setAttribute('data-plugin-id', id);

        // Write changes back to the live config object and context
        input.onchange = function() {
          let newValue;
          if (valueType === 'boolean') {
            newValue = input.checked;
          } else if (valueType === 'number') {
            newValue = Number(input.value);
          } else {
            newValue = input.value;
          }
          config[key] = newValue;
          if (instance.context && instance.context.config) {
            instance.context.config[key] = newValue;
          }
        };

        row.appendChild(label);
        row.appendChild(input);
        panel.appendChild(row);
      });

      return panel;
    }
  };

  // Export to window
  if (!window.CardSpoke) window.CardSpoke = {};
  window.CardSpoke.Plugin = PluginManager;

  console.log('[Plugin] API system initialized');
})();
// Storage Driver Registry
// Allows plugins to register custom storage drivers
// Provides pluggable storage backends (cloud, git, etc.)

(function() {
  'use strict';

  const drivers = new Map();
  let activeDriver = null;

  const StorageDriverRegistry = {
    /**
     * Register a storage driver
     * @param {string} name - Driver name (e.g., 'indexeddb', 'cloud', 'git')
     * @param {Object} driver - Driver instance implementing StorageDriver interface
     */
    register: function(name, driver) {
      if (!name || !driver) {
        throw new Error('Driver name and instance are required');
      }

      // Validate driver has required methods
      const required = ['init', 'get', 'set', 'remove', 'list', 'getSize', 'getKind'];
      for (const method of required) {
        if (typeof driver[method] !== 'function') {
          throw new Error('Driver missing required method: ' + method);
        }
      }

      drivers.set(name, driver);
      console.log('[StorageDriverRegistry] Registered:', name);
    },

    /**
     * Unregister a storage driver
     */
    unregister: function(name) {
      if (drivers.has(name)) {
        if (activeDriver && activeDriver.getKind() === name) {
          console.warn('[StorageDriverRegistry] Cannot unregister active driver:', name);
          return false;
        }
        drivers.delete(name);
        console.log('[StorageDriverRegistry] Unregistered:', name);
        return true;
      }
      return false;
    },

    /**
     * Get a driver by name
     */
    get: function(name) {
      return drivers.get(name);
    },

    /**
     * Set the active storage driver
     */
    setActive: async function(name) {
      const driver = drivers.get(name);
      if (!driver) {
        throw new Error('Storage driver not found: ' + name);
      }

      // Initialize the driver if not already initialized
      if (!driver._initialized) {
        await driver.init();
        driver._initialized = true;
      }

      activeDriver = driver;
      console.log('[StorageDriverRegistry] Active driver set to:', name);
    },

    /**
     * Get the active storage driver
     */
    getActive: function() {
      return activeDriver;
    },

    /**
     * List all registered drivers
     */
    list: function() {
      const result = [];
      drivers.forEach((driver, name) => {
        result.push({
          name: name,
          kind: driver.getKind(),
          active: activeDriver === driver
        });
      });
      return result;
    },

    /**
     * Clear all drivers (except active)
     */
    clear: function() {
      const activeKind = activeDriver ? activeDriver.getKind() : null;
      drivers.forEach((driver, name) => {
        if (activeKind !== name) {
          drivers.delete(name);
        }
      });
    }
  };

  // Export to window
  if (!window.CardSpoke) window.CardSpoke = {};
  window.CardSpoke.StorageDriverRegistry = StorageDriverRegistry;

  console.log('[StorageDriverRegistry] System initialized');
})();
// Permissions System
// Manages plugin permissions and user consent
// Provides security layer for plugin capabilities

(function() {
  'use strict';

  const STORAGE_KEY = 'cardspoke_plugin_permissions';
  const grantedPermissions = new Map();

  // Load saved permissions from localStorage
  function loadPermissions() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        Object.keys(parsed).forEach(pluginId => {
          grantedPermissions.set(pluginId, new Set(parsed[pluginId]));
        });
      }
    } catch (err) {
      console.error('[Permissions] Failed to load saved permissions:', err);
    }
  }

  // Save permissions to localStorage
  function savePermissions() {
    try {
      const data = {};
      grantedPermissions.forEach((perms, pluginId) => {
        data[pluginId] = Array.from(perms);
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error('[Permissions] Failed to save permissions:', err);
    }
  }

  const PERMISSION_DESCRIPTIONS = {
    'ui-override': 'Modify the user interface and inject custom elements',
    'storage': 'Access and modify local storage',
    'network': 'Make network requests to external services',
    'filesystem': 'Access the file system (mobile platforms)',
    'core-override': 'Override core application functions (high risk)'
  };

  const PermissionsManager = {
    /**
     * Check if a plugin has a specific permission
     */
    hasPermission: function(pluginId, permission) {
      const perms = grantedPermissions.get(pluginId);
      return perms && perms.has(permission);
    },

    /**
     * Check if a plugin has all required permissions
     */
    hasAllPermissions: function(pluginId, permissions) {
      if (!permissions || permissions.length === 0) {
        return true;
      }
      const perms = grantedPermissions.get(pluginId);
      if (!perms) {
        return false;
      }
      return permissions.every(p => perms.has(p));
    },

    /**
     * Grant permissions to a plugin
     */
    grantPermissions: function(pluginId, permissions) {
      if (!permissions || permissions.length === 0) {
        return;
      }

      let perms = grantedPermissions.get(pluginId);
      if (!perms) {
        perms = new Set();
        grantedPermissions.set(pluginId, perms);
      }

      permissions.forEach(p => perms.add(p));
      savePermissions();

      console.log('[Permissions] Granted to', pluginId, ':', permissions);
    },

    /**
     * Revoke permissions from a plugin
     */
    revokePermissions: function(pluginId, permissions) {
      const perms = grantedPermissions.get(pluginId);
      if (!perms) {
        return;
      }

      if (!permissions) {
        grantedPermissions.delete(pluginId);
      } else {
        permissions.forEach(p => perms.delete(p));
        if (perms.size === 0) {
          grantedPermissions.delete(pluginId);
        }
      }

      savePermissions();
      console.log('[Permissions] Revoked from', pluginId, ':', permissions || 'all');
    },

    /**
     * Get all permissions for a plugin
     */
    getPermissions: function(pluginId) {
      const perms = grantedPermissions.get(pluginId);
      return perms ? Array.from(perms) : [];
    },

    /**
     * Request permissions with user consent
     */
    requestPermissions: async function(pluginId, pluginName, permissions) {
      if (!permissions || permissions.length === 0) {
        return true;
      }

      // Check if already granted
      if (this.hasAllPermissions(pluginId, permissions)) {
        return true;
      }

      // Show consent dialog
      const granted = await this._showConsentDialog(pluginId, pluginName, permissions);
      if (granted) {
        this.grantPermissions(pluginId, permissions);
      }

      return granted;
    },

    /**
     * Show permission consent dialog
     */
    _showConsentDialog: async function(pluginId, pluginName, permissions) {
      return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'modal permission-modal';
        modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:10000;';

        const content = document.createElement('div');
        content.style.cssText = 'background:var(--bg-primary,#fff);padding:2rem;border-radius:8px;max-width:500px;box-shadow:0 4px 20px rgba(0,0,0,0.2);';

        const title = document.createElement('h2');
        title.textContent = 'Permission Request';
        title.style.cssText = 'margin:0 0 1rem;font-size:1.5rem;color:var(--text-primary,#000);';

        const desc = document.createElement('p');
        desc.textContent = '"' + pluginName + '" requests the following permissions:';
        desc.style.cssText = 'margin:0 0 1rem;color:var(--text-secondary,#666);';

        const list = document.createElement('ul');
        list.style.cssText = 'margin:0 0 1.5rem;padding-left:1.5rem;';
        permissions.forEach(perm => {
          const item = document.createElement('li');
          item.style.cssText = 'margin:0.5rem 0;color:var(--text-primary,#000);';
          const permName = document.createElement('strong');
          permName.textContent = perm;
          const permDesc = document.createTextNode(': ' + (PERMISSION_DESCRIPTIONS[perm] || 'Unknown permission'));
          item.appendChild(permName);
          item.appendChild(permDesc);
          list.appendChild(item);
        });

        const buttons = document.createElement('div');
        buttons.style.cssText = 'display:flex;gap:1rem;justify-content:flex-end;';

        const denyBtn = document.createElement('button');
        denyBtn.textContent = 'Deny';
        denyBtn.className = 'btn btn-secondary';
        denyBtn.style.cssText = 'padding:0.5rem 1.5rem;border:1px solid #ccc;background:#fff;border-radius:4px;cursor:pointer;';
        denyBtn.onclick = function() {
          document.body.removeChild(modal);
          resolve(false);
        };

        const allowBtn = document.createElement('button');
        allowBtn.textContent = 'Allow';
        allowBtn.className = 'btn btn-primary';
        allowBtn.style.cssText = 'padding:0.5rem 1.5rem;border:none;background:var(--accent,#007bff);color:#fff;border-radius:4px;cursor:pointer;';
        allowBtn.onclick = function() {
          document.body.removeChild(modal);
          resolve(true);
        };

        buttons.appendChild(denyBtn);
        buttons.appendChild(allowBtn);

        content.appendChild(title);
        content.appendChild(desc);
        content.appendChild(list);
        content.appendChild(buttons);
        modal.appendChild(content);

        document.body.appendChild(modal);
      });
    },

    /**
     * Get permission description
     */
    getPermissionDescription: function(permission) {
      return PERMISSION_DESCRIPTIONS[permission] || 'Unknown permission';
    },

    /**
     * List all available permissions
     */
    listAvailablePermissions: function() {
      return Object.keys(PERMISSION_DESCRIPTIONS).map(perm => ({
        name: perm,
        description: PERMISSION_DESCRIPTIONS[perm]
      }));
    },

    /**
     * Clear all permissions (for testing)
     */
    clearAll: function() {
      grantedPermissions.clear();
      savePermissions();
    }
  };

  // Initialize
  loadPermissions();

  // Export to window
  if (!window.CardSpoke) window.CardSpoke = {};
  window.CardSpoke.Permissions = PermissionsManager;

  // Make permission dialog available globally
  window.showPermissionDialog = function(pluginId, permissions) {
    const pluginName = pluginId; // Fallback to ID if name not available
    return PermissionsManager.requestPermissions(pluginId, pluginName, permissions);
  };

  console.log('[Permissions] System initialized');
})();
