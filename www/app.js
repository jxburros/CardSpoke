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

/**
 * Shared application state module
 *
 * All mutable cross-module state lives here as named ESM exports.
 * Variables that are re-assigned by consuming modules (store, navState,
 * instanceKey, …) are paired with a setter function — because ESM only
 * permits the *declaring* module to reassign a live export.
 *
 * Arrays that are only ever mutated in-place (undoStack, redoStack,
 * trashBin) are exported as plain `const` references.
 *
 * Read-only constants and the `createDefaultStore` factory are also
 * exported here so every module has a single source of truth.
 */

// ── App metadata constants ────────────────────────────────────────────────────
export const APP_CREATOR = 'Jeffrey from GX Generations Software';
export const APP_VERSION = '0.17.0';
export const APP_RELEASE_DATE = '2026-02-17';
export const APP_UPDATER = 'Claude Code (Sonnet 4.5)';
export const SCHEMA_VERSION = 4;

// ── Undo / trash size limits ──────────────────────────────────────────────────
export const MAX_UNDO_STACK = 50;
export const MAX_TRASH_SIZE = 100;

// ── Store factory ─────────────────────────────────────────────────────────────
/**
 * Return a fresh store object with default values.
 * @returns {Object} Default store shape
 */
export function createDefaultStore() {
  return {
    rootOrder: [],
    cards: {},
    plugins: {},
    bookmarks: [],
    recentCards: [],
    viewMode: 'normal',
    activeTheme: 'light',
    richTextEnabled: false
  };
}

// ── Mutable application state ─────────────────────────────────────────────────
// Each `let` export is paired with a setter so that importing modules can
// trigger a full reassignment (e.g. store = parsedPayload).

export let store = createDefaultStore();
/** Replace the entire store object (e.g. after a fresh load from storage). */
export function setStore(s) { store = s; }

export let navState = {
  page: 'list',
  cardId: null,
  parentId: null,
  searchQuery: ''
};
/** Replace the navigation state object. */
export function setNavState(s) { navState = s; }

export let navHistory = [];
/** Replace the navigation history array. */
export function setNavHistory(h) { navHistory = h; }

// instanceKey is read from localStorage at startup (browser-only).
export let instanceKey =
  (typeof localStorage !== 'undefined' ? localStorage.getItem('activeInstance') : null) ||
  'nested_cards_store';
/** Update the active localStorage key used for the current dataset. */
export function setInstanceKey(k) { instanceKey = k; }

export let dirty = false;
/** Mark whether the store has unsaved changes. */
export function setDirty(d) { dirty = d; }

export let searchResultsState = {
  items: [],
  elements: [],
  selectedIndex: 0
};
/** Replace the fuzzy-search results snapshot. */
export function setSearchResultsState(s) { searchResultsState = s; }

export let draggedCardId = null;
/** Track which card is currently being dragged. */
export function setDraggedCardId(id) { draggedCardId = id; }

export let dragOverCardId = null;
/** Track which card the drag target is hovering over. */
export function setDragOverCardId(id) { dragOverCardId = id; }

// ── Mutable arrays (mutated in-place; no setter needed) ──────────────────────

/** Undo history stack — entries are pushed/shifted, never reassigned. */
export const undoStack = [];

/** Redo history stack — entries are pushed/popped, never reassigned. */
export const redoStack = [];

/** Soft-deleted cards awaiting permanent deletion or restore. */
export const trashBin = [];
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
  let pluginSandboxRuntime = null;

  function ensurePluginSandboxRuntime() {
    if (pluginSandboxRuntime) return pluginSandboxRuntime;

    const frame = document.createElement('iframe');
    frame.setAttribute('sandbox', 'allow-scripts');
    frame.style.display = 'none';
    document.body.appendChild(frame);

    const pending = new Map();
    const callCtxPath = function(root, path, args) {
      const parts = (path || '').split('.');
      let target = root;
      for (let i = 0; i < parts.length; i++) {
        if (!target) break;
        target = target[parts[i]];
      }
      if (typeof target !== 'function') throw new Error('ctx method not found: ' + path);
      return target.apply(null, args || []);
    };

    window.addEventListener('message', function(ev) {
      if (ev.source !== frame.contentWindow) return;
      const data = ev.data || {};
      if (data.type === 'sandbox:ctx-result' && pending.has(data.id)) {
        const entry = pending.get(data.id);
        pending.delete(data.id);
        data.error ? entry.reject(new Error(data.error)) : entry.resolve(data.result);
      }
    });

    frame.srcdoc = `<!doctype html><html><body><script>
      const pendingCalls = new Map();
      window.addEventListener('message', async (event) => {
        const data = event.data || {};
        if (data.type === 'sandbox:execute') {
          const reqId = data.id;
          const callCtx = (path, args) => new Promise((resolve, reject) => {
            const id = 'ctx_' + Math.random().toString(36).slice(2);
            pendingCalls.set(id, { resolve, reject });
            parent.postMessage({ type: 'sandbox:ctx-call', id, path, args }, '*');
          });
          window.addEventListener('message', function onResult(ev){
            const msg = ev.data || {};
            if (msg.type !== 'sandbox:ctx-result') return;
            const c = pendingCalls.get(msg.id);
            if (!c) return;
            pendingCalls.delete(msg.id);
            msg.error ? c.reject(new Error(msg.error)) : c.resolve(msg.result);
          });
          const makeProxy = (prefix='') => new Proxy(function(){}, {
            get(_t, prop){
              const p = prefix ? prefix + '.' + String(prop) : String(prop);
              return makeProxy(p);
            },
            apply(_t,_this,args){
              return callCtx(prefix, args || []);
            }
          });
          try {
            const fn = new Function('ctx', data.code);
            const ctx = makeProxy('');
            const result = await fn(ctx);
            parent.postMessage({ type: 'sandbox:exec-result', id: reqId, result }, '*');
          } catch (err) {
            parent.postMessage({ type: 'sandbox:exec-result', id: reqId, error: String(err && err.message ? err.message : err) }, '*');
          }
        }
      });
    </script></body></html>`;

    const execute = function(code, ctx) {
      return new Promise((resolve, reject) => {
        const execId = 'exec_' + Math.random().toString(36).slice(2);
        const onMessage = async function(ev) {
          if (ev.source !== frame.contentWindow) return;
          const data = ev.data || {};
          if (data.type === 'sandbox:ctx-call') {
            try {
              const result = await callCtxPath(ctx, data.path, data.args);
              frame.contentWindow.postMessage({ type: 'sandbox:ctx-result', id: data.id, result }, '*');
            } catch (err) {
              frame.contentWindow.postMessage({ type: 'sandbox:ctx-result', id: data.id, error: err.message }, '*');
            }
            return;
          }
          if (data.type === 'sandbox:exec-result' && data.id === execId) {
            window.removeEventListener('message', onMessage);
            data.error ? reject(new Error(data.error)) : resolve(data.result);
          }
        };
        window.addEventListener('message', onMessage);
        frame.contentWindow.postMessage({ type: 'sandbox:execute', id: execId, code }, '*');
      });
    };

    pluginSandboxRuntime = { execute };
    return pluginSandboxRuntime;
  }

  function _createSandboxedFunction(code) {
    return function(ctx) {
      if (typeof window === 'undefined' || typeof document === 'undefined' || typeof window.addEventListener !== 'function' || typeof document.createElement !== 'function') {
        return new Function('ctx', code)(ctx);
      }
      return ensurePluginSandboxRuntime().execute(code, ctx || {});
    };
  }

  function _functionToCtxCode(fn) {
    if (typeof fn !== 'function') return null;
    return 'return (' + fn.toString() + ')(ctx);';
  }

  function _createSerializableDefinition(definition) {
    if (!definition) return null;
    return {
      manifest: definition.manifest,
      css: definition.css,
      js: (typeof definition.js === 'string' && definition.js) || _functionToCtxCode(definition.setup),
      teardownJs: (typeof definition.teardownJs === 'string' && definition.teardownJs) || _functionToCtxCode(definition.teardown)
    };
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
          if (window.showToast) {
            window.showToast('Plugin "' + id + '" failed to start: ' + err.message, 'error');
          }
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
      if (!resources || resources.size === 0) {
        return;
      }

      // Track cleanup statistics
      const cleanup = {
        domElements: 0,
        components: 0,
        listeners: 0,
        events: 0,
        errors: 0
      };

      resources.forEach(function(resource) {
        try {
          if (resource.type === 'dom') {
            // For replaced elements, restore the original
            if (resource.original) {
              if (resource.element && resource.element.parentNode) {
                resource.element.parentNode.replaceChild(resource.original, resource.element);
                cleanup.domElements++;
              }
            }
            // For injected elements, just remove them
            else if (resource.element && resource.element.parentNode) {
              resource.element.parentNode.removeChild(resource.element);
              cleanup.domElements++;
            }
          } else if (resource.type === 'component') {
            // Unregister component
            if (window.CardSpoke && window.CardSpoke.ComponentRegistry) {
              window.CardSpoke.ComponentRegistry.unregister(resource.name);
              cleanup.components++;
            }
          } else if (resource.type === 'listener') {
            // Data update listeners are tracked separately in dataUpdateListeners map
            cleanup.listeners++;
          } else if (resource.type === 'event') {
            // Task 1.5: Clean up global event bus handlers on plugin disable/unregister
            const list = globalEventBus.get(resource.event);
            if (list) {
              const idx = list.findIndex(function(h) { return h.callback === resource.callback && h.pluginId === id; });
              if (idx !== -1) {
                list.splice(idx, 1);
              }
            }
            cleanup.events++;
          }
        } catch (err) {
          cleanup.errors++;
          console.error('[Plugin] Resource cleanup error for', id, ':', err);
        }
      });

      // Clear all resources
      resources.clear();

      // Clean up data update listeners
      const listeners = dataUpdateListeners.get(id);
      if (listeners && listeners.length > 0) {
        cleanup.listeners += listeners.length;
        dataUpdateListeners.delete(id);
      }

      // Log cleanup summary
      console.log('[Plugin] Cleanup complete for', id, ':',
        cleanup.domElements, 'DOM elements,',
        cleanup.components, 'components,',
        cleanup.listeners, 'listeners,',
        cleanup.events, 'events',
        cleanup.errors > 0 ? '(' + cleanup.errors + ' errors)' : ''
      );
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
        js: pkg.js || pkg.javascript,  // Preserve raw JS string for Task 2.1 (persistence)
        teardownJs: pkg.teardownJs || (typeof pkg.teardown === 'string' ? pkg.teardown : null)
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
          definition: _createSerializableDefinition(definition),
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
  window.CardSpoke.PluginSandbox = { createFunction: _createSandboxedFunction };

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
// CardSpoke JavaScript Application (Source)
// Version: 0.17.0
// Creator: jxburros
// Schema: v4
// Note: Sources are split across www/src/* and concatenated with
//       `npm run build` for the file://-friendly bundle in www/app.js.
// =============================================================

'use strict';

// ── Shared state & constants (ESM) ───────────────────────────────────────────
import {
  APP_CREATOR, APP_VERSION, APP_RELEASE_DATE, APP_UPDATER, SCHEMA_VERSION,
  MAX_UNDO_STACK, MAX_TRASH_SIZE,
  createDefaultStore,
  store, setStore,
  navState, setNavState,
  navHistory, setNavHistory,
  instanceKey, setInstanceKey,
  dirty, setDirty,
  searchResultsState, setSearchResultsState,
  draggedCardId, setDraggedCardId,
  dragOverCardId, setDragOverCardId,
  undoStack, redoStack, trashBin
} from './state.js';

// =============================================================
// --- SELF-CONTAINED UTILITIES ---
// All utilities are defined locally to support opening directly
// from the filesystem (file:// protocol) without CORS issues.
// The ES module versions in ./modules/ are kept for reference.
// =============================================================

// --- APP METADATA & SIGNATURES ---
// (Imported from ./state.js — APP_CREATOR, APP_VERSION, APP_RELEASE_DATE, APP_UPDATER, SCHEMA_VERSION)

/**
 * Helper function to create DOM elements
 */
function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  Object.entries(props).forEach(([k, v]) => {
    if (k === 'className') el.className = v;
    else if (k === 'onclick') el.onclick = v;
    else if (k === 'onsubmit') el.onsubmit = v;
    else if (k === 'style') el.style.cssText = v;
    else if (k === 'oninput') el.oninput = v;
    else if (k === 'onchange') el.onchange = v;
    else if (k === 'selected' || k === 'disabled' || k === 'checked' || k === 'readonly') {
      if (v) el.setAttribute(k, '');
    }
    else if (v !== false && v !== null && v !== undefined) el.setAttribute(k, v);
  });
  children.flat().forEach(ch => {
    if (typeof ch === 'string') el.appendChild(document.createTextNode(ch));
    else if (ch) el.appendChild(ch);
  });
  return el;
}

/**
 * Generate unique ID
 */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Debounce function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Normalize and split tag input
 */
function normalizeTagInput(raw) {
  if (!raw) return [];
  return raw
    .split(/[\s,]+/)
    .map(tag => tag.replace(/^#/, '').toLowerCase().trim())
    .filter(Boolean);
}

/**
 * Escape HTML special characters
 */
function escapeHtml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Highlight matched query terms within text
 */
function highlightText(text, query) {
  if (!query || !text) return document.createTextNode(text || '');
  const terms = query.split(/\s+/).filter(Boolean).map(t => t.toLowerCase());
  if (!terms.length) return document.createTextNode(text);
  let html = escapeHtml(text);
  terms.forEach(term => {
    const safeTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    html = html.replace(new RegExp(safeTerm, 'gi'), match => `<mark>${match}</mark>`);
  });
  const span = document.createElement('span');
  span.innerHTML = html;
  return span;
}

/**
 * Clone a card object deeply
 */
function cloneCard(card) {
  if (!card) return null;
  let modsData = {};
  if (card.modsData) {
    try {
      modsData = JSON.parse(JSON.stringify(card.modsData));
    } catch (err) {
      modsData = { ...card.modsData };
    }
  }
  return {
    ...card,
    children: Array.isArray(card.children) ? card.children.slice() : [],
    tags: Array.isArray(card.tags) ? card.tags.slice() : [],
    modsData
  };
}

/**
 * Focus trapping for accessibility
 */
function trapFocus(modal) {
  const focusableElements = modal.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];
  
  const handleKeyDown = (e) => {
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
  };
  
  modal.addEventListener('keydown', handleKeyDown);
  
  if (firstFocusable) {
    firstFocusable.focus();
  }
  
  return () => {
    modal.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Format bytes into human readable string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Create a fresh store object with default values
 * @see ./state.js — canonical definition; re-exported here for local use.
 */
// (imported from ./state.js — createDefaultStore)

/**
 * Check if rich text mode is enabled globally
 */
function isRichTextEnabled() {
  return localStorage.getItem('cardspoke_richtext') === 'true';
}

/**
 * Set rich text mode
 */
function setRichTextEnabled(enabled) {
  localStorage.setItem('cardspoke_richtext', enabled ? 'true' : 'false');
}

/**
 * Get the active theme plugin ID (if any)
 */
function getActiveThemeMod() {
  return localStorage.getItem('cardspoke_activeThemeMod') || localStorage.getItem('cardspoke_activeThemeExtension') || null;
}

/**
 * Set the active theme plugin
 */
function setActiveThemeMod(modId) {
  if (modId) {
    localStorage.setItem('cardspoke_activeThemeMod', modId);
  } else {
    localStorage.removeItem('cardspoke_activeThemeMod');
  }
  localStorage.removeItem('cardspoke_activeThemeExtension');
}

/**
 * Check if developer mode is enabled
 * @returns {boolean} True if developer mode is active
 */
function isDeveloperMode() {
  return localStorage.getItem('cardspoke_devmode') === 'true';
}

// --- TOAST NOTIFICATION SYSTEM ---
let toastContainer = null;

/**
 * Initialize toast container
 */
function initToast() {
  toastContainer = document.getElementById('toastContainer');
}

/**
 * Show a toast notification
 */
function showToast(message, type = 'success', duration = 3000) {
  if (!toastContainer) {
    toastContainer = document.getElementById('toastContainer');
  }
  if (!toastContainer) {
    console.warn('[Toast] Container not found');
    return;
  }

  const toast = h('div', { 
    className: `toast ${type}`,
    role: 'alert',
    'aria-live': type === 'error' ? 'assertive' : 'polite',
    'aria-atomic': 'true',
    tabindex: '0'
  }, message);
  toastContainer.appendChild(toast);
  
  let timeoutId = null;
  let isPaused = false;
  let remainingTime = duration;
  let startTime = Date.now();
  
  const scheduleRemoval = () => {
    startTime = Date.now();
    timeoutId = setTimeout(() => {
      if (!isPaused) {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
      }
    }, remainingTime);
  };
  
  const pauseTimer = () => {
    if (!isPaused && timeoutId) {
      clearTimeout(timeoutId);
      remainingTime -= (Date.now() - startTime);
      isPaused = true;
    }
  };
  
  const resumeTimer = () => {
    if (isPaused) {
      isPaused = false;
      scheduleRemoval();
    }
  };
  
  toast.addEventListener('mouseenter', pauseTimer);
  toast.addEventListener('mouseleave', resumeTimer);
  
  // Add click to dismiss
  toast.style.cursor = 'pointer';
  const dismissToast = () => {
    clearTimeout(timeoutId);
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  };
  
  toast.addEventListener('click', dismissToast);
  
  // Add keyboard support
  toast.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Enter') {
      e.preventDefault();
      dismissToast();
    }
  });
  
  scheduleRemoval();
}

// =============================================================
// --- AI DEVELOPER INSTRUCTIONS ---
//
// 1. UPDATE VERSION & METADATA:
//    Update APP_VERSION, APP_RELEASE_DATE, APP_UPDATER above.
//
// 2. MAINTAIN FUNCTIONALITY:
//    Do not remove or break existing features unless explicitly requested.
//    All changes should be additive or improvements.
//
// 3. FILE PROTOCOL COMPATIBILITY:
//    This file is self-contained to work with file:// URLs.
//    ES module versions in ./modules/ are kept for reference.
//
// =============================================================

// Version History
// Version 0.16.0: Split source into buildable chunks (see www/src/*, `npm run build`)
// Version 1.0.0: Major refactor - ES Modules for maintainability, Rich Text toggle, Theme plugin handler
// Version 0.13.1: Accessibility & Theme Customization for Plugins
// (see previous versions in git history)

// --- CORE APP STATE ---
// All mutable state is declared in and exported from ./state.js.
// The names (store, navState, navHistory, …) are imported at the top of this
// file so the rest of the module can reference them without qualification.

// renderCleanupCallbacks is private to this module (not shared cross-module).
let renderCleanupCallbacks = [];

function registerRenderCleanup(fn) {
  if (typeof fn === 'function') renderCleanupCallbacks.push(fn);
}

function runRenderCleanup() {
  if (!renderCleanupCallbacks.length) return;
  renderCleanupCallbacks.forEach(fn => {
    try {
      fn();
    } catch (err) {
      console.error('[Render Cleanup] Failed:', err);
    }
  });
  renderCleanupCallbacks = [];
}

// Note: save, saveNow, load, clearAllData, showAppearanceSettings, applyTheme 
// are defined later in this file with local implementations

// --- DOM ELEMENTS ---
const header = {
        homeBtn: document.getElementById('homeBtn'),
        themeToggle: document.getElementById('themeToggle'),
        menuBtn: document.getElementById('menuBtn'),
        brandBtn: document.getElementById('brandBtn'),
        undoBtn: document.getElementById('undoBtn')
      };
      
      const menu = {
        overlay: document.getElementById('menuOverlay'),
        closeBtn: document.getElementById('menuClose'),
        newCard: document.getElementById('menuNewCard'),
        upload: document.getElementById('menuUpload'),
        pluginManager: document.getElementById('menuPluginManager'),
        appearance: document.getElementById('menuAppearance'),
        tagManager: document.getElementById('menuTagManager'),
        advancedSearch: document.getElementById('menuAdvancedSearch'),
        trashBin: document.getElementById('menuTrashBin'),
        bookmarks: document.getElementById('menuBookmarks'),
        typography: document.getElementById('menuTypography'),
        recentCards: document.getElementById('menuRecentCards'),
        dataHub: document.getElementById('menuDataHub'),
        clearAll: document.getElementById('menuClearAll'),
        gettingStarted: document.getElementById('menuGettingStarted'),
        help: document.getElementById('menuHelp'),
        keyboardShortcuts: document.getElementById('menuKeyboardShortcuts'),
        developerSection: document.getElementById('menuDeveloperSection'),
        developerConsole: document.getElementById('menuDeveloperConsole')
      };
      
      const searchContainer = document.getElementById('searchContainer');
      const searchInput = document.getElementById('searchInput');
      const searchClear = document.getElementById('searchClear');
      const datasetSelector = document.getElementById('datasetSelector');
      
      const breadcrumbs = document.getElementById('breadcrumbs');
      const main = document.getElementById('main');
      // Note: toastContainer is initialized via initToast() called during app boot
      let previewObserver = null;

      const uploadModal = {
        overlay: document.getElementById('uploadModal'),
        closeBtn: document.getElementById('closeUploadModal'),
        tabs: document.querySelectorAll('.modal-tab'),
        tabContents: document.querySelectorAll('.tab-content'),
        fileUploadAreaJSON: document.getElementById('fileUploadAreaJSON'),
        fileInputJSON: document.getElementById('fileInputJSON'),
        importLocationSelectJSON: document.getElementById('importLocationSelectJSON'),
        fileUploadAreaTXT: document.getElementById('fileUploadAreaTXT'),
        fileInputTXT: document.getElementById('fileInputTXT'),
        importLocationSelectTXT: document.getElementById('importLocationSelectTXT'),
        fileUploadAreaMods: document.getElementById('fileUploadAreaMods'),
        fileInputMods: document.getElementById('fileInputMods'),
        // Plugin install fields
        manualModName: document.getElementById('manualModName'),
        manualModCreator: document.getElementById('manualModCreator'),
        manualModVersion: document.getElementById('manualModVersion'),
        manualModReleaseDate: document.getElementById('manualModReleaseDate'),
        manualModJS: document.getElementById('manualModJS'),
        manualModCSS: document.getElementById('manualModCSS'),
        installManualMod: document.getElementById('installManualMod')
      };

      // --- UTILITIES ---
      // Imported from modules: h, uid, debounce, normalizeTagInput, escapeHtml, 
      // highlightText, cloneCard, trapFocus, formatBytes, showToast
      // Locally defined: simpleMarkdown (~line 7379), isDeveloperMode (~line 359)

      function bootError(msg) {
        main.innerHTML = '';
        main.appendChild(h('div', { className: 'empty' }, 'Error: ' + msg));
      }


      // =============================================================
      // --- FUZZY SEARCH ---
      // Typo-tolerant search using Levenshtein distance
      // =============================================================

      /**
       * Calculate Levenshtein distance between two strings
       * @param {string} a - First string
       * @param {string} b - Second string
       * @returns {number} - Edit distance
       */
      function levenshteinDistance(a, b) {
        const matrix = [];
        
        for (let i = 0; i <= b.length; i++) {
          matrix[i] = [i];
        }
        
        for (let j = 0; j <= a.length; j++) {
          matrix[0][j] = j;
        }
        
        for (let i = 1; i <= b.length; i++) {
          for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
              matrix[i][j] = matrix[i - 1][j - 1];
            } else {
              matrix[i][j] = Math.min(
                matrix[i - 1][j - 1] + 1, // substitution
                matrix[i][j - 1] + 1,     // insertion
                matrix[i - 1][j] + 1      // deletion
              );
            }
          }
        }
        
        return matrix[b.length][a.length];
      }

      /**
       * Calculate fuzzy match score (0-100, higher is better)
       * @param {string} query - Search query
       * @param {string} text - Text to match against
       * @returns {number} - Match score
       */
      function fuzzyMatchScore(query, text) {
        const queryLower = query.toLowerCase();
        const textLower = text.toLowerCase();
        
        // Exact match gets highest score
        if (textLower.includes(queryLower)) {
          const position = textLower.indexOf(queryLower);
          // Bonus for matches at start of text
          return 100 - (position * 0.5);
        }
        
        // Calculate fuzzy score based on edit distance
        const distance = levenshteinDistance(queryLower, textLower.substring(0, query.length + 5));
        const maxLen = Math.max(queryLower.length, textLower.length);
        const similarity = 1 - (distance / maxLen);
        
        return Math.max(0, similarity * 70); // Fuzzy matches get up to 70 points
      }

      /**
       * Fuzzy search cards
       * @param {Object} store - Card store
       * @param {string} query - Search query
       * @returns {Array} - Sorted results with scores
       */
      function fuzzySearchCards(store, query) {
        if (!query || query.trim() === '') {
          return [];
        }
        
        const results = [];
        const queryLower = query.toLowerCase().trim();
        
        Object.values(store.cards).forEach(card => {
          const titleScore = fuzzyMatchScore(queryLower, card.title || '');
          const bodyScore = fuzzyMatchScore(queryLower, card.body || '') * 0.7; // Body matches worth less
          const tagScore = card.tags ? card.tags.some(tag => 
            fuzzyMatchScore(queryLower, tag) > 50
          ) ? 30 : 0 : 0;
          
          const totalScore = Math.max(titleScore, bodyScore) + tagScore;
          
          // Only include results with score > 30 (reasonable match threshold)
          if (totalScore > 30) {
            results.push({
              card,
              score: totalScore,
              titleMatch: titleScore > 50,
              bodyMatch: bodyScore > 35
            });
          }
        });
        
        // Sort by score (highest first)
        results.sort((a, b) => b.score - a.score);
        
        return results;
      }

      /**
       * Multi-dataset fuzzy search
       * Search across multiple datasets with optional scope
       * @param {string} query - Search query
       * @param {string} scope - Dataset scope: 'current', 'all', or specific dataset ID
       * @returns {Promise<Array>} - Sorted results with scores and dataset info
       */
      async function fuzzySearchMultiDataset(query, scope = 'current') {
        if (!query || query.trim() === '') {
          return [];
        }
        
        if (!datasetManager) {
          // Fallback to single dataset search if manager not initialized
          return fuzzySearchCards(store, query);
        }
        
        const allResults = [];
        
        if (scope === 'current') {
          // Search only current dataset
          const results = fuzzySearchCards(store, query);
          const currentDataset = datasetManager.getActiveDataset();
          results.forEach(result => {
            allResults.push({
              ...result,
              datasetId: currentDataset.id,
              datasetName: currentDataset.name
            });
          });
        } else if (scope === 'all') {
          // Search all datasets
          const datasets = datasetManager.listDatasets();
          const currentDatasetId = datasetManager.activeDatasetId;
          
          for (const dataset of datasets) {
            try {
              // Load dataset if not current
              let datasetStore;
              if (dataset.id === currentDatasetId) {
                datasetStore = store;
              } else {
                // Load dataset store from storage
                const driver = datasetManager.datasets.get(dataset.id).driver;
                const storeData = await driver.get('store');
                datasetStore = storeData || { cards: {} };
              }
              
              // Search this dataset
              const results = fuzzySearchCards(datasetStore, query);
              results.forEach(result => {
                allResults.push({
                  ...result,
                  datasetId: dataset.id,
                  datasetName: dataset.name
                });
              });
            } catch (err) {
              console.warn(`Failed to search dataset ${dataset.name}:`, err);
            }
          }
        } else {
          // Search specific dataset
          const dataset = datasetManager.datasets.get(scope);
          if (dataset) {
            try {
              let datasetStore;
              if (scope === datasetManager.activeDatasetId) {
                datasetStore = store;
              } else {
                const storeData = await dataset.driver.get('store');
                datasetStore = storeData || { cards: {} };
              }
              
              const results = fuzzySearchCards(datasetStore, query);
              results.forEach(result => {
                allResults.push({
                  ...result,
                  datasetId: dataset.id,
                  datasetName: dataset.name
                });
              });
            } catch (err) {
              console.warn(`Failed to search dataset ${dataset.name}:`, err);
            }
          }
        }
        
        // Sort combined results by score
        allResults.sort((a, b) => b.score - a.score);
        
        // Limit results to prevent performance issues
        const MAX_RESULTS = 100;
        return allResults.slice(0, MAX_RESULTS);
      }
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

import {
  APP_VERSION, SCHEMA_VERSION,
  store, setStore,
  navState, setNavState,
  navHistory, setNavHistory,
  instanceKey
} from './state.js';


      // Source Part 2/5: Storage drivers, navigation, and plugin runtime
      // Concatenated via `npm run build` in lexical order of www/src/*.js
      // =============================================================
      // --- STORAGE DRIVER ARCHITECTURE (v0.9.4) ---
      // =============================================================

      // Cloud Storage Configuration
      // Replace these with your own OAuth client IDs
      const GOOGLE_CLIENT_ID = '905559232060-5utnmrdvr3n7k2rvamkt7rcflhj2afs8.apps.googleusercontent.com';
      const MS_CLIENT_ID = '222a2760-c041-43ee-b83b-57957fd632bf';

      /**
       * StorageDriver Interface
       * Provides abstraction for different storage backends
       */
      class StorageDriver {
        constructor() {
          if (new.target === StorageDriver) {
            throw new Error('StorageDriver is an abstract class');
          }
        }
      
        async init(config) {
          throw new Error('init() must be implemented');
        }
      
        async get(key) {
          throw new Error('get() must be implemented');
        }
      
        async set(key, value) {
          throw new Error('set() must be implemented');
        }
      
        async remove(key) {
          throw new Error('remove() must be implemented');
        }
      
        async list(prefix) {
          throw new Error('list() must be implemented');
        }
      
        async getSize() {
          throw new Error('getSize() must be implemented');
        }
      
        getKind() {
          throw new Error('getKind() must be implemented');
        }
      }
      
      /**
       * IndexedDB Storage Driver
       */
      class IndexedDBDriver extends StorageDriver {
        constructor() {
          super();
          this.dbName = 'CardSpokeDB';
          this.storeName = 'datasets';
          this.db = null;
        }
      
        async init(config = {}) {
          this.dbName = config.dbName || 'CardSpokeDB';
          this.storeName = config.storeName || 'datasets';
      
          return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);
      
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
              this.db = request.result;
              resolve();
            };
      
            request.onupgradeneeded = (event) => {
              const db = event.target.result;
              if (!db.objectStoreNames.contains(this.storeName)) {
                db.createObjectStore(this.storeName);
              }
            };
          });
        }
      
        async get(key) {
          return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(key);
      
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
          });
        }
      
        async set(key, value) {
          return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.put(value, key);
      
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
          });
        }
      
        async remove(key) {
          return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(key);
      
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
          });
        }
      
        async list(prefix = '') {
          return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAllKeys();
      
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
              const keys = request.result;
              const filtered = prefix ? keys.filter(k => k.startsWith(prefix)) : keys;
              resolve(filtered);
            };
          });
        }
      
        async getSize() {
          const keys = await this.list();
          let totalSize = 0;
      
          for (const key of keys) {
            const value = await this.get(key);
            if (value) {
              totalSize += JSON.stringify(value).length;
            }
          }
      
          return totalSize;
        }
      
        getKind() {
          return 'indexeddb';
        }
      }
      
      /**
       * LocalStorage Driver (fallback/compatibility)
       */
      class LocalStorageDriver extends StorageDriver {
        constructor() {
          super();
          this.prefix = 'cardspoke_';
        }
      
        async init(config = {}) {
          this.prefix = config.prefix || 'cardspoke_';
          return Promise.resolve();
        }
      
        async get(key) {
          const fullKey = this.prefix + key;
          const value = localStorage.getItem(fullKey);
          return value ? JSON.parse(value) : null;
        }
      
        async set(key, value) {
          const fullKey = this.prefix + key;
          localStorage.setItem(fullKey, JSON.stringify(value));
          return Promise.resolve();
        }
      
        async remove(key) {
          const fullKey = this.prefix + key;
          localStorage.removeItem(fullKey);
          return Promise.resolve();
        }
      
        async list(prefix = '') {
          const keys = [];
          const searchPrefix = this.prefix + prefix;
      
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(searchPrefix)) {
              keys.push(key.substring(this.prefix.length));
            }
          }
      
          return keys;
        }
      
        async getSize() {
          const keys = await this.list();
          let totalSize = 0;
      
          for (const key of keys) {
            const fullKey = this.prefix + key;
            const value = localStorage.getItem(fullKey);
            if (value) {
              totalSize += value.length;
            }
          }
      
          return totalSize;
        }
      
        getKind() {
          return 'localstorage';
        }
      }

      /**
       * Google Drive Storage Driver
       * Uses Google Identity Services for authentication
       */
      class GoogleDriveDriver extends StorageDriver {
        constructor() {
          super();
          this.accessToken = null;
          this.tokenClient = null;
          this.fileName = 'cardspoke.json';
          this.fileId = null;
        }

        async init(config = {}) {
          this.fileName = config.fileName || 'cardspoke.json';
          if (typeof google === 'undefined' || !google.accounts) {
            throw new Error('Google Identity Services not loaded. Please refresh the page.');
          }
          if (GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com') {
            throw new Error('Google Drive not configured. Developer needs to set up OAuth client ID.');
          }
          this.tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/drive.file',
            callback: (response) => {
              if (response.error) {
                showToast('Google Drive authentication failed: ' + response.error, 'error');
                return;
              }
              this.accessToken = response.access_token;
            },
          });
          return Promise.resolve();
        }

        async ensureAuthenticated() {
          if (!this.accessToken) {
            return new Promise((resolve, reject) => {
              this.tokenClient.callback = (response) => {
                if (response.error) {
                  reject(new Error('Authentication failed: ' + response.error));
                  return;
                }
                this.accessToken = response.access_token;
                resolve();
              };
              this.tokenClient.requestAccessToken();
            });
          }
        }

        async findFile() {
          await this.ensureAuthenticated();
          const response = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=name='${this.fileName}' and trashed=false`,
            { headers: { Authorization: `Bearer ${this.accessToken}` } }
          );
          if (!response.ok) throw new Error('Failed to search for file: ' + response.statusText);
          const data = await response.json();
          return data.files && data.files.length > 0 ? data.files[0].id : null;
        }

        async get(key) {
          try {
            const fileId = await this.findFile();
            if (!fileId) return null;
            const response = await fetch(
              `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
              { headers: { Authorization: `Bearer ${this.accessToken}` } }
            );
            if (!response.ok) throw new Error('Failed to download file: ' + response.statusText);
            const data = await response.json();
            return data[key] || null;
          } catch (error) {
            console.error('Google Drive get error:', error);
            showToast('Failed to read from Google Drive: ' + error.message, 'error');
            return null;
          }
        }

        async set(key, value) {
          try {
            await this.ensureAuthenticated();
            let fileId = await this.findFile();
            let allData = {};
            if (fileId) {
              const response = await fetch(
                `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
                { headers: { Authorization: `Bearer ${this.accessToken}` } }
              );
              if (response.ok) allData = await response.json();
            }
            allData[key] = value;
            const content = JSON.stringify(allData, null, 2);
            if (fileId) {
              const response = await fetch(
                `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
                {
                  method: 'PATCH',
                  headers: { Authorization: `Bearer ${this.accessToken}`, 'Content-Type': 'application/json' },
                  body: content,
                }
              );
              if (!response.ok) throw new Error('Failed to update file: ' + response.statusText);
            } else {
              const metadata = { name: this.fileName, mimeType: 'application/json' };
              const form = new FormData();
              form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
              form.append('file', new Blob([content], { type: 'application/json' }));
              const response = await fetch(
                'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
                { method: 'POST', headers: { Authorization: `Bearer ${this.accessToken}` }, body: form }
              );
              if (!response.ok) throw new Error('Failed to create file: ' + response.statusText);
            }
          } catch (error) {
            console.error('Google Drive set error:', error);
            showToast('Failed to save to Google Drive: ' + error.message, 'error');
            throw error;
          }
        }

        async remove(key) {
          try {
            const fileId = await this.findFile();
            if (!fileId) return;
            const response = await fetch(
              `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
              { headers: { Authorization: `Bearer ${this.accessToken}` } }
            );
            if (response.ok) {
              const allData = await response.json();
              delete allData[key];
              const content = JSON.stringify(allData, null, 2);
              await fetch(
                `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
                {
                  method: 'PATCH',
                  headers: { Authorization: `Bearer ${this.accessToken}`, 'Content-Type': 'application/json' },
                  body: content,
                }
              );
            }
          } catch (error) {
            console.error('Google Drive remove error:', error);
            showToast('Failed to remove from Google Drive: ' + error.message, 'error');
            throw error;
          }
        }

        async list(prefix = '') {
          try {
            const fileId = await this.findFile();
            if (!fileId) return [];
            const response = await fetch(
              `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
              { headers: { Authorization: `Bearer ${this.accessToken}` } }
            );
            if (!response.ok) return [];
            const allData = await response.json();
            const keys = Object.keys(allData);
            return prefix ? keys.filter(k => k.startsWith(prefix)) : keys;
          } catch (error) {
            console.error('Google Drive list error:', error);
            return [];
          }
        }

        async getSize() {
          try {
            const fileId = await this.findFile();
            if (!fileId) return 0;
            const response = await fetch(
              `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
              { headers: { Authorization: `Bearer ${this.accessToken}` } }
            );
            if (!response.ok) return 0;
            const content = await response.text();
            return content.length;
          } catch (error) {
            console.error('Google Drive getSize error:', error);
            return 0;
          }
        }

        getKind() {
          return 'googledrive';
        }
      }

      /**
       * OneDrive Storage Driver
       * Uses MSAL.js for Microsoft authentication
       */
      class OneDriveDriver extends StorageDriver {
        constructor() {
          super();
          this.msalInstance = null;
          this.accessToken = null;
          this.fileName = 'cardspoke.json';
        }

        async init(config = {}) {
          this.fileName = config.fileName || 'cardspoke.json';
          if (typeof msal === 'undefined') {
            throw new Error('MSAL library not loaded. Please refresh the page.');
          }
          if (MS_CLIENT_ID === 'YOUR_MICROSOFT_CLIENT_ID') {
            throw new Error('OneDrive not configured. Developer needs to set up OAuth client ID.');
          }
          const msalConfig = {
            auth: {
              clientId: MS_CLIENT_ID,
              authority: 'https://login.microsoftonline.com/common',
              redirectUri: window.location.origin,
            },
            cache: { cacheLocation: 'sessionStorage', storeAuthStateInCookie: false },
          };
          this.msalInstance = new msal.PublicClientApplication(msalConfig);
          await this.msalInstance.initialize();
          return Promise.resolve();
        }

        async ensureAuthenticated() {
          if (this.accessToken) return;
          const accounts = this.msalInstance.getAllAccounts();
          const request = { scopes: ['Files.ReadWrite', 'User.Read'], account: accounts[0] };
          try {
            const response = await this.msalInstance.acquireTokenSilent(request);
            this.accessToken = response.accessToken;
          } catch (error) {
            const response = await this.msalInstance.loginPopup(request);
            this.accessToken = response.accessToken;
          }
        }

        async findFile() {
          await this.ensureAuthenticated();
          const response = await fetch(
            `https://graph.microsoft.com/v1.0/me/drive/root/search(q='${this.fileName}')`,
            { headers: { Authorization: `Bearer ${this.accessToken}` } }
          );
          if (!response.ok) throw new Error('Failed to search for file: ' + response.statusText);
          const data = await response.json();
          return data.value && data.value.length > 0 ? data.value[0].id : null;
        }

        async get(key) {
          try {
            const fileId = await this.findFile();
            if (!fileId) return null;
            const response = await fetch(
              `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`,
              { headers: { Authorization: `Bearer ${this.accessToken}` } }
            );
            if (!response.ok) throw new Error('Failed to download file: ' + response.statusText);
            const data = await response.json();
            return data[key] || null;
          } catch (error) {
            console.error('OneDrive get error:', error);
            showToast('Failed to read from OneDrive: ' + error.message, 'error');
            return null;
          }
        }

        async set(key, value) {
          try {
            await this.ensureAuthenticated();
            let fileId = await this.findFile();
            let allData = {};
            if (fileId) {
              const response = await fetch(
                `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`,
                { headers: { Authorization: `Bearer ${this.accessToken}` } }
              );
              if (response.ok) allData = await response.json();
            }
            allData[key] = value;
            const content = JSON.stringify(allData, null, 2);
            const uploadUrl = fileId
              ? `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`
              : `https://graph.microsoft.com/v1.0/me/drive/root:/${this.fileName}:/content`;
            const response = await fetch(uploadUrl, {
              method: 'PUT',
              headers: { Authorization: `Bearer ${this.accessToken}`, 'Content-Type': 'application/json' },
              body: content,
            });
            if (!response.ok) throw new Error('Failed to save file: ' + response.statusText);
          } catch (error) {
            console.error('OneDrive set error:', error);
            showToast('Failed to save to OneDrive: ' + error.message, 'error');
            throw error;
          }
        }

        async remove(key) {
          try {
            const fileId = await this.findFile();
            if (!fileId) return;
            const response = await fetch(
              `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`,
              { headers: { Authorization: `Bearer ${this.accessToken}` } }
            );
            if (response.ok) {
              const allData = await response.json();
              delete allData[key];
              const content = JSON.stringify(allData, null, 2);
              await fetch(
                `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`,
                {
                  method: 'PUT',
                  headers: { Authorization: `Bearer ${this.accessToken}`, 'Content-Type': 'application/json' },
                  body: content,
                }
              );
            }
          } catch (error) {
            console.error('OneDrive remove error:', error);
            showToast('Failed to remove from OneDrive: ' + error.message, 'error');
            throw error;
          }
        }

        async list(prefix = '') {
          try {
            const fileId = await this.findFile();
            if (!fileId) return [];
            const response = await fetch(
              `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`,
              { headers: { Authorization: `Bearer ${this.accessToken}` } }
            );
            if (!response.ok) return [];
            const allData = await response.json();
            const keys = Object.keys(allData);
            return prefix ? keys.filter(k => k.startsWith(prefix)) : keys;
          } catch (error) {
            console.error('OneDrive list error:', error);
            return [];
          }
        }

        async getSize() {
          try {
            const fileId = await this.findFile();
            if (!fileId) return 0;
            const response = await fetch(
              `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`,
              { headers: { Authorization: `Bearer ${this.accessToken}` } }
            );
            if (!response.ok) return 0;
            const content = await response.text();
            return content.length;
          } catch (error) {
            console.error('OneDrive getSize error:', error);
            return 0;
          }
        }

        getKind() {
          return 'onedrive';
        }
      }

      /**
       * WebDAV Storage Driver
       * For self-hosted cloud storage
       */
      class WebDAVDriver extends StorageDriver {
        constructor() {
          super();
          this.url = null;
          this.username = null;
          this.password = null;
          this.fileName = 'cardspoke.json';
        }

        async init(config = {}) {
          if (!config.url || !config.username || !config.password) {
            throw new Error('WebDAV requires url, username, and password in config');
          }
          // Security: Validate HTTPS usage
          const url = config.url.toLowerCase();
          if (url.startsWith('http://') && !url.includes('localhost') && !url.includes('127.0.0.1')) {
            const useInsecure = confirm(
              '⚠️ SECURITY WARNING: You are connecting to WebDAV over HTTP (not HTTPS).\n\n' +
              'Your credentials and data will be transmitted unencrypted and could be intercepted.\n\n' +
              'We strongly recommend using HTTPS for WebDAV connections.\n\n' +
              'Do you want to continue with insecure HTTP anyway?'
            );
            if (!useInsecure) {
              throw new Error('WebDAV connection rejected: HTTPS required for security');
            }
            showToast('⚠️ Warning: Using insecure HTTP connection to WebDAV', 'error');
          }
          this.url = config.url.endsWith('/') ? config.url : config.url + '/';
          this.username = config.username;
          this.password = config.password;
          this.fileName = config.fileName || 'cardspoke.json';
          return Promise.resolve();
        }

        getAuthHeader() {
          const credentials = btoa(`${this.username}:${this.password}`);
          return `Basic ${credentials}`;
        }

        async get(key) {
          try {
            const response = await fetch(this.url + this.fileName, {
              method: 'GET',
              headers: { Authorization: this.getAuthHeader() },
            });
            if (response.status === 404) return null;
            if (!response.ok) throw new Error('Failed to read file: ' + response.statusText);
            const allData = await response.json();
            return allData[key] || null;
          } catch (error) {
            if (error.message.includes('CORS')) {
              showToast('CORS error: Configure your WebDAV server to allow requests from this origin', 'error');
            } else {
              showToast('Failed to read from WebDAV: ' + error.message, 'error');
            }
            console.error('WebDAV get error:', error);
            return null;
          }
        }

        async set(key, value) {
          try {
            let allData = {};
            try {
              const response = await fetch(this.url + this.fileName, {
                method: 'GET',
                headers: { Authorization: this.getAuthHeader() },
              });
              if (response.ok) allData = await response.json();
            } catch (error) {
              // File doesn't exist yet
            }
            allData[key] = value;
            const content = JSON.stringify(allData, null, 2);
            const response = await fetch(this.url + this.fileName, {
              method: 'PUT',
              headers: { Authorization: this.getAuthHeader(), 'Content-Type': 'application/json' },
              body: content,
            });
            if (!response.ok) throw new Error('Failed to write file: ' + response.statusText);
          } catch (error) {
            if (error.message.includes('CORS')) {
              showToast('CORS error: Configure your WebDAV server to allow requests from this origin', 'error');
            } else {
              showToast('Failed to save to WebDAV: ' + error.message, 'error');
            }
            console.error('WebDAV set error:', error);
            throw error;
          }
        }

        async remove(key) {
          try {
            const response = await fetch(this.url + this.fileName, {
              method: 'GET',
              headers: { Authorization: this.getAuthHeader() },
            });
            if (response.ok) {
              const allData = await response.json();
              delete allData[key];
              const content = JSON.stringify(allData, null, 2);
              await fetch(this.url + this.fileName, {
                method: 'PUT',
                headers: { Authorization: this.getAuthHeader(), 'Content-Type': 'application/json' },
                body: content,
              });
            }
          } catch (error) {
            console.error('WebDAV remove error:', error);
            showToast('Failed to remove from WebDAV: ' + error.message, 'error');
            throw error;
          }
        }

        async list(prefix = '') {
          try {
            const response = await fetch(this.url + this.fileName, {
              method: 'GET',
              headers: { Authorization: this.getAuthHeader() },
            });
            if (!response.ok) return [];
            const allData = await response.json();
            const keys = Object.keys(allData);
            return prefix ? keys.filter(k => k.startsWith(prefix)) : keys;
          } catch (error) {
            console.error('WebDAV list error:', error);
            return [];
          }
        }

        async getSize() {
          try {
            const response = await fetch(this.url + this.fileName, {
              method: 'GET',
              headers: { Authorization: this.getAuthHeader() },
            });
            if (!response.ok) return 0;
            const content = await response.text();
            return content.length;
          } catch (error) {
            console.error('WebDAV getSize error:', error);
            return 0;
          }
        }

        getKind() {
          return 'webdav';
        }
      }

      /**
       * Local File Storage Driver
       * Uses File System Access API (web) or Capacitor Filesystem (native)
       */
      class LocalFileDriver extends StorageDriver {
        constructor() {
          super();
          this.fileHandle = null;
          this.fileName = 'cardspoke.json';
          this.handleKey = 'cardspoke_localfile_handle';
          this.isNative = false;
          this.nativeFilePath = null;
        }

        async init(config = {}) {
          this.fileName = config.fileName || 'cardspoke.json';
          this.handleKey = config.handleKey || 'cardspoke_localfile_handle';
          
          // Detect if running in Capacitor native environment
          this.isNative = typeof window.Capacitor !== 'undefined' && 
                          typeof window.Capacitor.isNativePlatform === 'function' && 
                          window.Capacitor.isNativePlatform();
          
          if (this.isNative) {
            // Native: Use Capacitor Filesystem
            const { Filesystem } = window.Capacitor.Plugins;
            if (!Filesystem) {
              throw new Error('Capacitor Filesystem plugin not available');
            }
            // Store file in Documents directory
            this.nativeFilePath = this.fileName;
          } else {
            // Web: Try to restore file handle from IndexedDB
            await this.restoreHandle();
          }
          
          return Promise.resolve();
        }

        async restoreHandle() {
          try {
            // Try to restore the file handle from IndexedDB
            const db = await this.openHandleDB();
            const handle = await this.getHandleFromDB(db);
            if (handle) {
              // Verify we still have permission
              const permission = await handle.queryPermission({ mode: 'readwrite' });
              if (permission === 'granted') {
                this.fileHandle = handle;
              }
            }
          } catch (error) {
            console.warn('Could not restore file handle:', error);
          }
        }

        async openHandleDB() {
          return new Promise((resolve, reject) => {
            const request = indexedDB.open('CardSpokeFileHandles', 1);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            request.onupgradeneeded = (event) => {
              const db = event.target.result;
              if (!db.objectStoreNames.contains('handles')) {
                db.createObjectStore('handles');
              }
            };
          });
        }

        async getHandleFromDB(db) {
          return new Promise((resolve, reject) => {
            const transaction = db.transaction(['handles'], 'readonly');
            const store = transaction.objectStore('handles');
            const request = store.get(this.handleKey);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
          });
        }

        async saveHandleToDB(handle) {
          const db = await this.openHandleDB();
          return new Promise((resolve, reject) => {
            const transaction = db.transaction(['handles'], 'readwrite');
            const store = transaction.objectStore('handles');
            const request = store.put(handle, this.handleKey);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
          });
        }

        async ensureHandle() {
          if (this.isNative) {
            // Native platform always has access to file system
            return;
          }
          
          if (!this.fileHandle) {
            // Check if File System Access API is supported
            if (!('showSaveFilePicker' in window)) {
              throw new Error('File System Access API not supported in this browser. Please use Chrome, Edge, or another compatible browser.');
            }
            
            // Prompt user to select/create a file
            try {
              this.fileHandle = await window.showSaveFilePicker({
                suggestedName: this.fileName,
                types: [{
                  description: 'CardSpoke Data File',
                  accept: { 'application/json': ['.json'] }
                }]
              });
              
              // Save handle to IndexedDB for future use
              await this.saveHandleToDB(this.fileHandle);
            } catch (error) {
              if (error.name === 'AbortError') {
                throw new Error('File selection cancelled by user');
              }
              throw error;
            }
          }
        }

        async readFile() {
          if (this.isNative) {
            // Native: Read using Capacitor Filesystem
            const { Filesystem, Directory } = window.Capacitor.Plugins;
            try {
              const result = await Filesystem.readFile({
                path: this.nativeFilePath,
                directory: Directory.Documents,
                encoding: 'utf8'
              });
              const text = result.data || '';
              if (!text.trim()) {
                return {};
              }
              try {
                return JSON.parse(text);
              } catch (parseError) {
                console.error('Failed to parse file content:', parseError);
                throw new Error('Invalid JSON in file');
              }
            } catch (error) {
              // Check for file not found error
              if (error.code === 'NOT_FOUND' || (error.message && error.message.toLowerCase().includes('not exist'))) {
                return {};
              }
              throw error;
            }
          } else {
            // Web: Read using File System Access API
            await this.ensureHandle();
            const file = await this.fileHandle.getFile();
            const text = await file.text();
            if (!text.trim()) {
              return {};
            }
            try {
              return JSON.parse(text);
            } catch (parseError) {
              console.error('Failed to parse file content:', parseError);
              throw new Error('Invalid JSON in file');
            }
          }
        }

        async writeFile(data) {
          if (this.isNative) {
            // Native: Write using Capacitor Filesystem
            const { Filesystem, Directory } = window.Capacitor.Plugins;
            await Filesystem.writeFile({
              path: this.nativeFilePath,
              data: JSON.stringify(data, null, 2),
              directory: Directory.Documents,
              encoding: 'utf8'
            });
          } else {
            // Web: Write using File System Access API
            await this.ensureHandle();
            const writable = await this.fileHandle.createWritable();
            await writable.write(JSON.stringify(data, null, 2));
            await writable.close();
          }
        }

        async get(key) {
          try {
            const data = await this.readFile();
            return data[key] || null;
          } catch (error) {
            console.error('LocalFile get error:', error);
            showToast('Failed to read from local file: ' + error.message, 'error');
            return null;
          }
        }

        async set(key, value) {
          try {
            const data = await this.readFile();
            data[key] = value;
            await this.writeFile(data);
          } catch (error) {
            console.error('LocalFile set error:', error);
            showToast('Failed to save to local file: ' + error.message, 'error');
            throw error;
          }
        }

        async remove(key) {
          try {
            const data = await this.readFile();
            delete data[key];
            await this.writeFile(data);
          } catch (error) {
            console.error('LocalFile remove error:', error);
            showToast('Failed to remove from local file: ' + error.message, 'error');
            throw error;
          }
        }

        async list(prefix = '') {
          try {
            const data = await this.readFile();
            const keys = Object.keys(data);
            return prefix ? keys.filter(k => k.startsWith(prefix)) : keys;
          } catch (error) {
            console.error('LocalFile list error:', error);
            return [];
          }
        }

        async getSize() {
          try {
            if (this.isNative) {
              const { Filesystem, Directory } = window.Capacitor.Plugins;
              const stat = await Filesystem.stat({
                path: this.nativeFilePath,
                directory: Directory.Documents
              });
              return stat.size;
            } else {
              await this.ensureHandle();
              const file = await this.fileHandle.getFile();
              return file.size;
            }
          } catch (error) {
            console.error('LocalFile getSize error:', error);
            return 0;
          }
        }

        getKind() {
          return 'localfile';
        }
      }

      /**
       * Dataset Manager
       * Manages multiple datasets with different storage drivers
       */
      class DatasetManager {
        constructor() {
          this.datasets = new Map();
          this.activeDatasetId = null;
          this.metadataKey = 'cardspoke_dataset_metadata';
        }
      
        async init() {
          // Load dataset metadata from localStorage
          const metadataJson = localStorage.getItem(this.metadataKey);
          if (metadataJson) {
            const metadata = JSON.parse(metadataJson);
            this.activeDatasetId = metadata.activeDatasetId;
      
            // Initialize datasets
            for (const [id, meta] of Object.entries(metadata.datasets || {})) {
              const driver = await this.createDriver(meta.storage.driver, meta.storage.config);
              this.datasets.set(id, {
                id,
                name: meta.name,
                driver,
                pin: meta.pin || null,
                createdAt: meta.createdAt,
                updatedAt: meta.updatedAt
              });
            }
          }
      
          // Create default dataset if none exist
          if (this.datasets.size === 0) {
            await this.createDataset('Default', 'localstorage');
          }
        }
      
        async createDriver(kind, config = {}) {
          let driver;

          switch (kind) {
            case 'indexeddb':
              driver = new IndexedDBDriver();
              break;
            case 'googledrive':
              driver = new GoogleDriveDriver();
              break;
            case 'onedrive':
              driver = new OneDriveDriver();
              break;
            case 'localfile':
              driver = new LocalFileDriver();
              break;
            case 'localstorage':
            default:
              driver = new LocalStorageDriver();
              break;
          }

          await driver.init(config);
          return driver;
        }
      
        async createDataset(name, storageKind = 'localstorage', pin = null) {
          const id = 'dataset_' + Date.now();
          const driver = await this.createDriver(storageKind, {
            dbName: `CardSpokeDB_${id}`,
            prefix: `cardspoke_${id}_`
          });
      
          const dataset = {
            id,
            name,
            driver,
            pin,
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
      
          this.datasets.set(id, dataset);
      
          if (!this.activeDatasetId) {
            this.activeDatasetId = id;
          }
      
          await this.saveMetadata();
          return dataset;
        }
      
        async saveMetadata() {
          const metadata = {
            activeDatasetId: this.activeDatasetId,
            datasets: {}
          };
      
          for (const [id, dataset] of this.datasets) {
            metadata.datasets[id] = {
              name: dataset.name,
              storage: {
                driver: dataset.driver.getKind(),
                config: {}
              },
              pin: dataset.pin,
              createdAt: dataset.createdAt,
              updatedAt: dataset.updatedAt
            };
          }
      
          localStorage.setItem(this.metadataKey, JSON.stringify(metadata));
        }
      
        getActiveDataset() {
          return this.datasets.get(this.activeDatasetId);
        }
      
        async switchDataset(datasetId, pin = null) {
          const dataset = this.datasets.get(datasetId);
          if (!dataset) {
            throw new Error('Dataset not found');
          }
      
          // Check PIN if required
          if (dataset.pin && dataset.pin !== pin) {
            throw new Error('Invalid PIN');
          }
      
          this.activeDatasetId = datasetId;
          await this.saveMetadata();
          return dataset;
        }
      
        async deleteDataset(datasetId) {
          if (this.datasets.size <= 1) {
            throw new Error('Cannot delete the last dataset');
          }
      
          const dataset = this.datasets.get(datasetId);
          if (!dataset) {
            throw new Error('Dataset not found');
          }
      
          // Remove all data from storage
          const keys = await dataset.driver.list();
          for (const key of keys) {
            await dataset.driver.remove(key);
          }
      
          this.datasets.delete(datasetId);
      
          // Switch to another dataset if this was active
          if (this.activeDatasetId === datasetId) {
            this.activeDatasetId = this.datasets.keys().next().value;
          }
      
          await this.saveMetadata();
        }
      
        async getDatasetInfo(datasetId) {
          const dataset = this.datasets.get(datasetId || this.activeDatasetId);
          if (!dataset) {
            throw new Error('Dataset not found');
          }
      
          const size = await dataset.driver.getSize();
          const keys = await dataset.driver.list();
      
          return {
            id: dataset.id,
            name: dataset.name,
            storageKind: dataset.driver.getKind(),
            hasPIN: !!dataset.pin,
            size: size,
            sizeFormatted: this.formatBytes(size),
            itemCount: keys.length,
            createdAt: new Date(dataset.createdAt).toLocaleString(),
            updatedAt: new Date(dataset.updatedAt).toLocaleString()
          };
        }
      
        formatBytes(bytes) {
          if (bytes === 0) return '0 Bytes';
          const k = 1024;
          const sizes = ['Bytes', 'KB', 'MB', 'GB'];
          const i = Math.floor(Math.log(bytes) / Math.log(k));
          return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
        }
      
        listDatasets() {
          return Array.from(this.datasets.values()).map(d => ({
            id: d.id,
            name: d.name,
            storageKind: d.driver.getKind(),
            hasPIN: !!d.pin,
            isActive: d.id === this.activeDatasetId
          }));
        }
      }
      
      // Global dataset manager instance
      let datasetManager = null;
      

      // --- LOCAL STORAGE ---

      // Save state tracking
      let saveTimeout = null;
      let savePending = false;
      let lastSaveTime = 0;
      const SAVE_DEBOUNCE_MS = 500; // Wait 500ms after last change before saving
      const MIN_SAVE_INTERVAL_MS = 100; // Minimum time between actual saves


      let indexedDbMirrorDriver = null;

      async function getIndexedDbMirrorDriver() {
        if (indexedDbMirrorDriver) return indexedDbMirrorDriver;
        const driver = new IndexedDBDriver();
        await driver.init({ dbName: 'CardSpokeDB', storeName: 'datasets' });
        indexedDbMirrorDriver = driver;
        return indexedDbMirrorDriver;
      }

      function isIndexedDbDataset() {
        return !!(store && store.metadata && store.metadata.storageType === 'indexeddb');
      }

      function getStorageType() {
        return (store && store.metadata && store.metadata.storageType) || 'localstorage';
      }

      function supportsFileSystemAccess() {
        return typeof window.showSaveFilePicker === 'function';
      }

      function getDatasetFileHandleKey() {
        const key = instanceKey || 'nested_cards_store';
        return (store.metadata && store.metadata.storageConfig && store.metadata.storageConfig.handleKey) || (`cardspoke_file_handle_${key}`);
      }

      async function openFileHandleDb() {
        return new Promise((resolve, reject) => {
          const req = indexedDB.open('CardSpokeFileHandles', 1);
          req.onerror = () => reject(req.error);
          req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains('handles')) db.createObjectStore('handles');
          };
          req.onsuccess = () => resolve(req.result);
        });
      }

      async function saveDatasetFileHandle(handleKey, handle) {
        const db = await openFileHandleDb();
        return new Promise((resolve, reject) => {
          const tx = db.transaction(['handles'], 'readwrite');
          tx.objectStore('handles').put(handle, handleKey);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      }

      async function loadDatasetFileHandle(handleKey) {
        const db = await openFileHandleDb();
        return new Promise((resolve, reject) => {
          const tx = db.transaction(['handles'], 'readonly');
          const req = tx.objectStore('handles').get(handleKey);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => reject(req.error);
        });
      }

      async function ensureLocalFileHandle() {
        if (!supportsFileSystemAccess()) {
          throw new Error('File System Access API is not supported in this browser/runtime');
        }
        const handleKey = getDatasetFileHandleKey();
        let handle = await loadDatasetFileHandle(handleKey);
        if (!handle) {
          const suggestedName = ((store.metadata && store.metadata.name) || 'cardspoke-dataset').replace(/\s+/g, '-').toLowerCase() + '.json';
          handle = await window.showSaveFilePicker({
            suggestedName,
            types: [{ description: 'JSON Dataset', accept: { 'application/json': ['.json'] } }]
          });
          await saveDatasetFileHandle(handleKey, handle);
        }
        if (store.metadata && store.metadata.storageConfig) {
          store.metadata.storageConfig.handleKey = handleKey;
          store.metadata.storageConfig.fileName = handle.name || 'dataset.json';
        }
        return handle;
      }

      async function writeDatasetToLocalFile(payload) {
        if (getStorageType() !== 'localfile') return;
        const handle = await ensureLocalFileHandle();
        const writable = await handle.createWritable();
        await writable.write(payload);
        await writable.close();
      }

      async function readDatasetFromLocalFile() {
        if (getStorageType() !== 'localfile') return null;
        const handle = await ensureLocalFileHandle();
        const file = await handle.getFile();
        const text = await file.text();
        return text || null;
      }



      function toBase64(bytes) {
        let binary = '';
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        return btoa(binary);
      }

      function fromBase64(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return bytes;
      }

      async function derivePinKey(pin, saltBytes) {
        if (!window.crypto || !window.crypto.subtle) throw new Error('Web Crypto API unavailable');
        const encoder = new TextEncoder();
        const baseKey = await window.crypto.subtle.importKey('raw', encoder.encode(pin), 'PBKDF2', false, ['deriveKey']);
        return window.crypto.subtle.deriveKey(
          {
            name: 'PBKDF2',
            salt: saltBytes,
            iterations: 250000,
            hash: 'SHA-256'
          },
          baseKey,
          { name: 'AES-GCM', length: 256 },
          false,
          ['encrypt', 'decrypt']
        );
      }

      async function encryptStorePayload(payload, pin) {
        const salt = window.crypto.getRandomValues(new Uint8Array(16));
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const key = await derivePinKey(pin, salt);
        const data = new TextEncoder().encode(payload);
        const encrypted = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
        return JSON.stringify({
          encrypted: true,
          version: 1,
          kdf: 'PBKDF2',
          cipher: 'AES-GCM',
          iterations: 250000,
          salt: toBase64(salt),
          iv: toBase64(iv),
          payload: toBase64(new Uint8Array(encrypted))
        });
      }

      async function decryptStorePayload(encryptedPayload, pin) {
        const envelope = typeof encryptedPayload === 'string' ? JSON.parse(encryptedPayload) : encryptedPayload;
        if (!envelope || !envelope.encrypted) return encryptedPayload;
        const salt = fromBase64(envelope.salt);
        const iv = fromBase64(envelope.iv);
        const ciphertext = fromBase64(envelope.payload);
        const key = await derivePinKey(pin, salt);
        const decrypted = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
        return new TextDecoder().decode(decrypted);
      }

      function validateStoreConsistency() {
        if (!store || !store.cards || typeof store.cards !== 'object') return false;
        let changed = false;
        const cards = store.cards;
        const ids = new Set(Object.keys(cards));

        Object.values(cards).forEach(card => {
          if (!Array.isArray(card.children)) {
            card.children = [];
            changed = true;
          }
          card.children = card.children.filter(cid => ids.has(cid));
        });

        Object.values(cards).forEach(card => {
          if (card.parentId && !cards[card.parentId]) {
            card.parentId = null;
            changed = true;
          }
        });

        const visiting = new Set();
        const visited = new Set();
        const breakCycle = (id) => {
          if (visited.has(id)) return;
          if (visiting.has(id)) {
            cards[id].parentId = null;
            changed = true;
            return;
          }
          visiting.add(id);
          const parentId = cards[id] && cards[id].parentId;
          if (parentId && cards[parentId]) breakCycle(parentId);
          visiting.delete(id);
          visited.add(id);
        };
        Object.keys(cards).forEach(breakCycle);

        Object.values(cards).forEach(card => {
          if (card.parentId && cards[card.parentId] && !cards[card.parentId].children.includes(card.id)) {
            cards[card.parentId].children.push(card.id);
            changed = true;
          }
        });

        const computedRoots = Object.values(cards).filter(card => !card.parentId).map(card => card.id);
        const existingRootOrder = Array.isArray(store.rootOrder) ? store.rootOrder : [];
        const cleanedRootOrder = existingRootOrder.filter(id => cards[id] && !cards[id].parentId);
        computedRoots.forEach(id => {
          if (!cleanedRootOrder.includes(id)) {
            cleanedRootOrder.push(id);
            changed = true;
          }
        });
        if (cleanedRootOrder.length !== existingRootOrder.length || !cleanedRootOrder.every((id, i) => id === existingRootOrder[i])) {
          store.rootOrder = cleanedRootOrder;
          changed = true;
        }

        return changed;
      }

      // Cloud sync tracking
      let cloudSyncTimeout = null;
      let lastCloudSyncTime = 0;
      const CLOUD_SYNC_DEBOUNCE_MS = 60000; // Wait 60s between cloud syncs to respect API limits

      /**
       * Sync data to cloud storage if configured
       * Debounced to avoid excessive API calls
       */
      async function syncToCloud() {
        // Check if cloud storage is configured
        if (!store.metadata || !store.metadata.storageType) return;
        
        const storageType = store.metadata.storageType;
        if (storageType !== 'googledrive' && storageType !== 'onedrive') return;
        
        try {
          let driver;
          const config = store.metadata.storageConfig || {};
          
          if (storageType === 'googledrive') {
            driver = new GoogleDriveDriver();
          } else if (storageType === 'onedrive') {
            driver = new OneDriveDriver();
          }
          
          if (!driver) return;
          
          await driver.init(config);
          await driver.ensureAuthenticated();
          await driver.set('cardspoke.json', JSON.stringify(store));
          
          lastCloudSyncTime = Date.now();
          console.log(`[Cloud Sync] Synced to ${storageType} at ${new Date().toISOString()}`);
          showToast('Cloud sync complete', 'success');
        } catch (error) {
          console.error('[Cloud Sync] Error:', error);
          showToast('Cloud sync failed: ' + error.message, 'error');
        }
      }

      /**
       * Schedule cloud sync with debouncing
       */
      function scheduleCloudSync() {
        // Check if cloud storage is configured
        if (!store.metadata || !store.metadata.storageType) return;
        
        const storageType = store.metadata.storageType;
        if (storageType !== 'googledrive' && storageType !== 'onedrive') return;
        
        // Clear any pending cloud sync
        if (cloudSyncTimeout) {
          clearTimeout(cloudSyncTimeout);
          cloudSyncTimeout = null;
        }
        
        // Check if we're syncing too frequently - if enough time has passed, sync immediately
        const timeSinceLastSync = Date.now() - lastCloudSyncTime;
        const delay = timeSinceLastSync >= CLOUD_SYNC_DEBOUNCE_MS ? 0 : CLOUD_SYNC_DEBOUNCE_MS - timeSinceLastSync;
        
        cloudSyncTimeout = setTimeout(() => {
          syncToCloud();
        }, delay);
      }

      async function saveNow() {
        try {
          // Run middleware pipeline before saving (Task 1.1)
          if (window.CardSpoke && window.CardSpoke.Middleware) {
            try {
              const result = await window.CardSpoke.Middleware.run('card.save', [store]);
              if (result && result.prevented) {
                savePending = false;
                return;
              }
            } catch (err) {
              console.error('[Middleware] card.save pipeline error:', err);
            }
          }

          const key = instanceKey || 'nested_cards_store';
          const startTime = performance.now();

          if (!store.metadata) store.metadata = {};
          store.metadata.navState = { ...navState };
          store.metadata.navHistory = Array.isArray(navHistory) ? navHistory.slice(-100) : [];

          // Use requestIdleCallback if available to avoid blocking UI
          const doSave = async () => {
            try {
              const payload = JSON.stringify(store);
              const activeDataset = datasetManager && datasetManager.getActiveDataset ? datasetManager.getActiveDataset() : null;
              const activePin = (activeDataset && activeDataset.pin) || (store && store.metadata && store.metadata.pin) || null;
              const finalPayload = activePin
                ? await encryptStorePayload(payload, activePin)
                : payload;

              localStorage.setItem(key, finalPayload);

              if (isIndexedDbDataset()) {
                getIndexedDbMirrorDriver()
                  .then(driver => driver.set(key, finalPayload))
                  .catch(err => console.error('[IndexedDB] Mirror save failed:', err));
              }

              if (getStorageType() === 'localfile') {
                writeDatasetToLocalFile(finalPayload)
                  .catch(err => {
                    console.error('[Local File] Save failed:', err);
                    showToast('Local file save failed: ' + err.message, 'error');
                  });
              }


              const duration = performance.now() - startTime;
              lastSaveTime = Date.now();
              savePending = false;

              // Show success indicator briefly
              updateSaveStatus('saved');
              setTimeout(() => updateSaveStatus('idle'), 1000);

              console.log(`Saved in ${duration.toFixed(2)}ms`);
              
              // Schedule cloud sync if cloud storage is configured
              scheduleCloudSync();

            } catch (e) {
              savePending = false;
              if (e.name === 'QuotaExceededError') {
                showToast('Storage quota exceeded! Please clear old data or export your cards.', 'error');
              } else {
                showToast('Failed to save: ' + e.message, 'error');
              }
              updateSaveStatus('error');
            }
          };

          if (window.requestIdleCallback) {
            requestIdleCallback(() => { doSave(); }, { timeout: 2000 });
          } else {
            doSave();
          }
        } catch (e) {
          showToast('Failed to save: ' + e.message, 'error');
          savePending = false;
          updateSaveStatus('error');
        }
      }

      function save(immediate = false) {
        // Clear any pending save
        if (saveTimeout) {
          clearTimeout(saveTimeout);
          saveTimeout = null;
        }

        // If immediate save requested, save now
        if (immediate) {
          saveNow();
          return;
        }

        // Check if we're saving too frequently
        const timeSinceLastSave = Date.now() - lastSaveTime;
        if (timeSinceLastSave < MIN_SAVE_INTERVAL_MS) {
          // Schedule save after minimum interval
          savePending = true;
          updateSaveStatus('pending');
          saveTimeout = setTimeout(saveNow, Math.max(SAVE_DEBOUNCE_MS, MIN_SAVE_INTERVAL_MS - timeSinceLastSave));
          return;
        }

        // Debounce: wait for user to stop making changes
        savePending = true;
        updateSaveStatus('pending');
        saveTimeout = setTimeout(saveNow, SAVE_DEBOUNCE_MS);
      }

      function updateSaveStatus(status) {
        const indicator = document.getElementById('saveStatus');
        if (!indicator) return;

        indicator.className = 'save-status ' + status;
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        switch (status) {
          case 'pending':
            indicator.textContent = '●';
            indicator.title = `Saving... (${timeStr})`;
            break;
          case 'saved':
            indicator.textContent = '✓';
            indicator.title = `Last saved at ${timeStr}`;
            break;
          case 'error':
            indicator.textContent = '✕';
            indicator.title = `Save failed at ${timeStr}`;
            break;
          default:
            indicator.textContent = '';
            indicator.title = '';
        }
      }

      function clearAllData() {
        if (!confirm('WARNING: This will DELETE ALL instances and data from localStorage.\n\nThis action CANNOT be undone!\n\nAre you absolutely sure?')) {
          return;
        }

        if (!confirm('This is your FINAL warning.\n\nAll card data, all instances, and all settings will be permanently deleted.\n\nContinue?')) {
          return;
        }

        try {
          // Get all keys to clear
          const allKeys = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            allKeys.push(key);
          }

          // Clear everything
          localStorage.clear();

          showToast(`Cleared ${allKeys.length} items from localStorage`, 'success');

          // Reset the app
          setTimeout(() => {
            location.reload();
          }, 1000);
        } catch (e) {
          showToast('Failed to clear data: ' + e.message, 'error');
        }
      }

      async function load() {
        const key = instanceKey || 'nested_cards_store';
        let raw = localStorage.getItem(key);
        const activeDataset = datasetManager && datasetManager.getActiveDataset ? datasetManager.getActiveDataset() : null;
        const activePin = (activeDataset && activeDataset.pin) || (store && store.metadata && store.metadata.pin) || null;
        if (raw && activePin) {
          try {
            raw = await decryptStorePayload(raw, activePin);
          } catch (err) {
            console.error('[Dataset] Failed to decrypt payload:', err);
            showToast('Failed to decrypt dataset. Check your PIN.', 'error');
            throw err;
          }
        }
        if (!raw) {
          setStore({ rootOrder: [], cards: {}, plugins: {}, bookmarks: [], recentCards: [], viewMode: 'normal', activeTheme: 'light' });
          save();
          return;
        }
        try {
          const parsed = JSON.parse(raw);
          setStore({
            rootOrder: parsed.rootOrder || [],
            cards: parsed.cards || {},
            plugins: parsed.plugins || {},
            bookmarks: parsed.bookmarks || [],
            recentCards: parsed.recentCards || [],
            viewMode: parsed.viewMode || 'normal',
            activeTheme: parsed.activeTheme || 'light',
            metadata: parsed.metadata || {}
          });

          if (store.metadata && store.metadata.navState) {
            setNavState({ ...navState, ...store.metadata.navState });
          }
          if (store.metadata && Array.isArray(store.metadata.navHistory)) {
            setNavHistory(store.metadata.navHistory.slice(-100));
          }

          const repaired = validateStoreConsistency();
          if (repaired) {
            save();
            showToast('Data integrity check repaired structural metadata', 'info');
          }

          const storageType = getStorageType();
          if (storageType === 'indexeddb') {
            getIndexedDbMirrorDriver()
              .then(driver => driver.get(key))
              .then(async payload => {
                if (!payload) return;
                const parsedMirror = typeof payload === 'string' ? JSON.parse(payload) : payload;
                if (!parsedMirror || typeof parsedMirror !== 'object') return;
                setStore({
                  rootOrder: parsedMirror.rootOrder || [],
                  cards: parsedMirror.cards || {},
                  plugins: parsedMirror.plugins || {},
                  bookmarks: parsedMirror.bookmarks || [],
                  recentCards: parsedMirror.recentCards || [],
                  viewMode: parsedMirror.viewMode || 'normal',
                  activeTheme: parsedMirror.activeTheme || 'light',
                  metadata: parsedMirror.metadata || store.metadata
                });
                if (store.metadata && store.metadata.navState) setNavState({ ...navState, ...store.metadata.navState });
                if (store.metadata && Array.isArray(store.metadata.navHistory)) setNavHistory(store.metadata.navHistory.slice(-100));
                if (validateStoreConsistency()) save();
                render();
              })
              .catch(err => {
                console.error('[IndexedDB] Load failed, using LocalStorage fallback:', err);
              });
          } else if (storageType === 'localfile') {
            readDatasetFromLocalFile()
              .then(async payload => {
                if (!payload) return;
                const active = datasetManager && datasetManager.getActiveDataset ? datasetManager.getActiveDataset() : null;
                const filePin = (active && active.pin) || (store && store.metadata && store.metadata.pin) || null;
                const payloadText = filePin ? await decryptStorePayload(payload, filePin) : payload;
                const parsedFile = JSON.parse(payloadText);
                setStore({
                  rootOrder: parsedFile.rootOrder || [],
                  cards: parsedFile.cards || {},
                  plugins: parsedFile.plugins || {},
                  bookmarks: parsedFile.bookmarks || [],
                  recentCards: parsedFile.recentCards || [],
                  viewMode: parsedFile.viewMode || 'normal',
                  activeTheme: parsedFile.activeTheme || 'light',
                  metadata: parsedFile.metadata || store.metadata
                });
                if (store.metadata && store.metadata.navState) setNavState({ ...navState, ...store.metadata.navState });
                if (store.metadata && Array.isArray(store.metadata.navHistory)) setNavHistory(store.metadata.navHistory.slice(-100));
                if (validateStoreConsistency()) save();
                render();
              })
              .catch(err => {
                console.error('[Local File] Load failed, using LocalStorage fallback:', err);
              });
          }
        } catch (e) {
          bootError('Corrupted data.');
        }
      }

      // --- NAVIGATION ---

      function goTo(page, opts = {}) {
        navHistory.push({ ...navState });
        setNavState({
          page,
          cardId: opts.cardId ?? null,
          parentId: opts.parentId ?? null,
          searchQuery: opts.searchQuery ?? ''
        });

        // Add to recent cards when viewing a card
        if (page === 'read' && opts.cardId) {
          addToRecentCards(opts.cardId);
        }

        render();
      }

      function goBack() {
        if (navHistory.length) {
          setNavState(navHistory.pop());
          render();
        }
      }
      
      // --- PLUGINS API ---

      // =============================================================
      // --- PLUGIN SYSTEM v2 ---
      // JSON-driven plugin loading system. Plugins are JSON packages that
      // can do anything from simple themes to full app transformations.
      //
      // Plugin layers:
      //   theme   - CSS only. No JS execution. Safest.
      //   feature - CSS + JS. Hooks, DOM manipulation, card behavior.
      //   app     - CSS + JS + overrides. Can rename app, add pages,
      //             hide features, replace menus, etc.
      // =============================================================
      


      // =============================================================
      // --- Modern Plugin System ---
      // Use the modern Plugin API (window.CardSpoke.Plugin) for all extensions.
      // See docs/MOD_SYSTEM.md for complete plugin development documentation.
      // =============================================================

      // =============================================================
      // --- CardSpoke.utils API ---
      // Public utility API for plugin developers
      // =============================================================

      window.CardSpoke = window.CardSpoke || {};
      window.CardSpoke.utils = {
        createCard: async function(data) {
          data = data || {};
          var title = data.title || '';
          var body = data.body || '';
          var parentId = data.parentId || null;
          var tags = data.tags || [];
          var cardId = createCard(title, body, parentId, false, false);
          if (tags.length > 0) tags.forEach(function(tag) { addTag(cardId, tag, true); });
          save();
          render();
          return { id: cardId, card: cloneCard(store.cards[cardId]) };
        },
        updateCard: async function(cardId, changes) {
          changes = changes || {};
          if (!cardId) throw new Error('cardId is required');
          if (!store.cards[cardId]) throw new Error('Card ' + cardId + ' not found');
          var tags = changes.tags;
          var otherChanges = Object.assign({}, changes);
          delete otherChanges.tags;
          if (Object.keys(otherChanges).length > 0) updateCard(cardId, otherChanges, false, false);
          if (tags !== undefined) setTags(cardId, tags, false);
          return true;
        },
        getTags: async function(cardId) { return getTags(cardId); },
        addTag: async function(cardId, tag) { return addTag(cardId, tag, false); },
        removeTag: async function(cardId, tag) { return removeTag(cardId, tag, false); },
        setTags: async function(cardId, tags) { return setTags(cardId, tags, false); },
        getAllTags: async function() { return getAllTags(); },
        showToast: async function(message, type, duration) { showToast(message, type || 'info', duration || 3000); },
        getDatasetMeta: async function() {
          return {
            name: instanceKey,
            cardCount: Object.keys(store.cards).length,
            rootCardCount: store.rootOrder.length,
            bookmarkCount: (store.bookmarks || []).length,
            recentCount: (store.recentCards || []).length,
            modCount: Object.keys(store.plugins || {}).length,
            schemaVersion: SCHEMA_VERSION,
            appVersion: APP_VERSION
          };
        },
        getCard: async function(cardId) {
          if (!cardId) return null;
          var card = store.cards[cardId];
          return card ? cloneCard(card) : null;
        },
        searchCards: async function(query) {
          if (!query) return [];
          var lowerQuery = query.toLowerCase();
          var results = [];
          for (var id in store.cards) {
            var card = store.cards[id];
            if (card.title.toLowerCase().includes(lowerQuery) ||
                card.body.toLowerCase().includes(lowerQuery) ||
                (card.tags && card.tags.some(function(tag) { return tag.toLowerCase().includes(lowerQuery); }))) {
              results.push(cloneCard(card));
            }
          }
          return results;
        },
        getAccessibilitySettings: async function() {
          return {
            theme: store.activeTheme || 'light',
            typography: localStorage.getItem('cardspoke_typography') || 'default',
            highContrast: document.documentElement.classList.contains('high-contrast'),
            reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          };
        },
        setTheme: async function(theme) {
          if (theme !== 'light' && theme !== 'dark') throw new Error('Theme must be "light" or "dark"');
          applyTheme(theme);
          return true;
        },
        getTheme: async function() { return store.activeTheme || 'light'; },
        setTypography: async function(preset) {
          var valid = ['default', 'comfortable', 'compact', 'dyslexia'];
          if (!valid.includes(preset)) throw new Error('Preset must be one of: ' + valid.join(', '));
          localStorage.setItem('cardspoke_typography', preset);
          document.documentElement.setAttribute('data-typography', preset);
          return true;
        },
        getTypography: async function() { return localStorage.getItem('cardspoke_typography') || 'default'; },
        setHighContrast: async function(enabled) {
          if (enabled) document.documentElement.classList.add('high-contrast');
          else document.documentElement.classList.remove('high-contrast');
          localStorage.setItem('cardspoke_highcontrast', enabled.toString());
          return true;
        },
        isHighContrast: async function() { return document.documentElement.classList.contains('high-contrast'); },
        prefersReducedMotion: async function() { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; },
        getThemeVariables: async function() {
          return {
            colors: ['--bg', '--surface', '--border', '--text', '--text-medium', '--text-muted', '--text-ghost'],
            typography: ['--font', '--font-brand', '--text-xs', '--text-sm', '--text-base', '--text-lg', '--text-xl', '--text-2xl', '--text-3xl'],
            spacing: ['--space-xs', '--space-sm', '--space-md', '--space-lg', '--space-xl', '--space-2xl', '--space-3xl', '--space-4xl', '--radius'],
            accessibility: {
              highContrast: ['--hc-bg', '--hc-text', '--hc-border', '--hc-accent'],
              focus: ['--focus-outline-color', '--focus-outline-width']
            }
          };
        }
      };

      if (isDeveloperMode()) {
        console.log('[CardSpoke.utils] API initialized and available at window.CardSpoke.utils');
      }

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

import {
  APP_VERSION,
  createDefaultStore,
  store, setStore,
  instanceKey, setInstanceKey,
  trashBin
} from './state.js';


      // Source Part 3/5: Data CRUD, imports/exports, dataset modals
      // Concatenated via `npm run build` in lexical order of www/src/*.js
      // --- DATA (CRUD) ---

      /**
       * Create a new card
       * @param {string} title - Card title
       * @param {string} body - Card content/body
       * @param {string|null} parentId - Parent card ID or null for root
       * @param {boolean} skipSave - Skip saving to localStorage
       * @param {boolean} skipHooks - Skip running plugin hooks
       * @returns {string} New card ID
       */
      function createCard(title, body, parentId = null, skipSave = false, skipHooks = false) {
        const id = uid();
        const now = Date.now();
        store.cards[id] = {
          id,
          title: title || '',
          body: body || '',
          parentId: parentId || null,
          children: [],
          createdAt: now,
          updatedAt: now,
          modsData: {},
          tags: [],
          isRichText: false
        };
        if (!parentId) {
          store.rootOrder.push(id);
        } else {
          const parent = store.cards[parentId];
          if (parent && !parent.children.includes(id)) {
            parent.children.push(id);
          }
        }
        // Add to undo stack for undo support (v0.12.0 fix)
        // Always track undo regardless of skipHooks - skipHooks only controls plugin hooks
        pushUndo('createCard', { cardId: id, card: cloneCard(store.cards[id]) });
        if (!skipSave) save();
        // Fire middleware event for plugins (Task 1.1)
        if (!skipHooks && window.CardSpoke && window.CardSpoke.Middleware) {
          window.CardSpoke.Middleware.run('card.create', [id, store.cards[id]])
            .catch(err => console.error('[Middleware] card.create error:', err));
        }
        return id;
      }

      /**
       * Update an existing card
       * @param {string} id - Card ID to update
       * @param {Object} updates - Fields to update
       * @param {boolean} skipSave - Skip saving to localStorage
       * @param {boolean} skipHooks - Skip running plugin hooks
       */
      function updateCard(id, updates, skipSave = false, skipHooks = false) {
        const card = store.cards[id];
        if (!card) return;
        // Store previous state for undo support (v0.12.0 fix)
        // Always track undo regardless of skipHooks - skipHooks only controls plugin hooks
        const previousState = cloneCard(card);
        const updateTimestamp = Date.now();
        pushUndo('updateCard', { 
          cardId: id, 
          previousState: previousState,
          newState: { ...updates, updatedAt: updateTimestamp }
        });
        Object.assign(card, updates, { updatedAt: updateTimestamp });
        if (!skipSave) save();
        // Fire middleware event for plugins (Task 1.1)
        if (!skipHooks && window.CardSpoke && window.CardSpoke.Middleware) {
          window.CardSpoke.Middleware.run('card.update', [id, store.cards[id]])
            .catch(err => console.error('[Middleware] card.update error:', err));
        }
      }

      /**
       * Delete a card and all its children recursively
       * @param {string} id - Card ID to delete
       */
      function deleteCard(id, opts = {}) {
        const { skipSave = false, skipHooks = false, rootCall = true } = opts;
        const card = store.cards[id];
        if (!card) return;
        
        // Add to undo stack before deletion
        pushUndo('deleteCard', { card: cloneCard(card) });
        
        // Add to trash bin
        trashBin.unshift({
          card: cloneCard(card),
          deletedAt: Date.now()
        });
        if (trashBin.length > MAX_TRASH_SIZE) trashBin.pop();
        
        // Skip hooks for children to avoid redundant middleware calls on recursive deletes
        (card.children || []).forEach(cid => deleteCard(cid, { skipSave, skipHooks: true, rootCall: false }));
        if (card.parentId) {
          const parent = store.cards[card.parentId];
          if (parent) parent.children = parent.children.filter(c => c !== id);
        } else {
          store.rootOrder = store.rootOrder.filter(c => c !== id);
        }
        delete store.cards[id];
        if (!skipSave && rootCall) save();
        // Fire middleware event for plugins (Task 1.1)
        if (!skipHooks && window.CardSpoke && window.CardSpoke.Middleware) {
          window.CardSpoke.Middleware.run('card.delete', [id])
            .catch(err => console.error('[Middleware] card.delete error:', err));
        }
      }

      function getStorageTypeLabel(storageType) {
        switch (storageType) {
          case 'indexeddb': return 'IndexedDB';
          case 'localfile': return 'Local File (chosen location)';
          case 'googledrive': return 'Google Drive';
          case 'onedrive': return 'OneDrive';
          default: return 'LocalStorage';
        }
      }

      async function migrateCurrentDatasetStorage(targetStorage) {
        const currentStorage = (store.metadata && store.metadata.storageType) || 'localstorage';
        if (targetStorage === currentStorage) {
          showToast('Dataset is already using ' + getStorageTypeLabel(targetStorage), 'info');
          return;
        }

        if (!store.metadata) store.metadata = {};
        if (!store.metadata.storageConfig) store.metadata.storageConfig = {};

        if (targetStorage === 'indexeddb') {
          const driver = new IndexedDBDriver();
          await driver.init({ dbName: 'CardSpokeDB', storeName: 'datasets' });
          await driver.set(instanceKey, JSON.stringify(store));
          store.metadata.storageType = 'indexeddb';
          store.metadata.storageConfig = { dbName: 'CardSpokeDB', storeName: 'datasets' };
        } else if (targetStorage === 'localfile') {
          if (typeof window.showSaveFilePicker !== 'function') {
            throw new Error('Local file location selection is not supported in this environment');
          }
          store.metadata.storageType = 'localfile';
          if (!store.metadata.storageConfig) store.metadata.storageConfig = {};
          await writeDatasetToLocalFile(JSON.stringify(store));
        } else if (targetStorage === 'googledrive' || targetStorage === 'onedrive') {
          const driver = targetStorage === 'googledrive' ? new GoogleDriveDriver() : new OneDriveDriver();
          await driver.init({});
          await driver.ensureAuthenticated();
          await driver.set('cardspoke.json', JSON.stringify(store));
          store.metadata.storageType = targetStorage;
          store.metadata.storageConfig = {};
        } else {
          store.metadata.storageType = 'localstorage';
          store.metadata.storageConfig = {};
        }

        store.metadata.migratedAt = Date.now();
        save(true);
        showToast('Dataset storage updated to ' + getStorageTypeLabel(targetStorage), 'success');
      }

      function showDatasetStorageSettings() {
        const overlay = h('div', { className: 'modal-overlay show' });
        const modal = h('div', { className: 'modal', style: 'max-width: 560px;' });
        const header = h('div', { className: 'modal-header' });
        header.appendChild(h('div', { className: 'modal-title' }, 'Dataset Storage Settings'));
        header.appendChild(h('button', { className: 'modal-close', onclick: () => overlay.remove() }, '✕'));
        modal.appendChild(header);

        const body = h('div', { className: 'modal-body' });
        const currentStorage = (store.metadata && store.metadata.storageType) || 'localstorage';

        body.appendChild(h('p', { style: 'margin-bottom: var(--space-md); color: var(--text-secondary);' },
          'New datasets default to LocalStorage. You can migrate this dataset to another on-device storage backend after creation.'));
        body.appendChild(h('p', { style: 'margin-bottom: var(--space-lg);' },
          'Current storage: ' + getStorageTypeLabel(currentStorage)));

        const select = h('select', {
          style: 'width: 100%; padding: var(--space-md); border: 1px solid var(--border); border-radius: var(--radius); margin-bottom: var(--space-md);'
        });
        const localOpt = h('option', { value: 'localstorage' }, 'LocalStorage (default)');
        const idbOpt = h('option', { value: 'indexeddb' }, 'IndexedDB (on-device database)');
        const fileOpt = h('option', { value: 'localfile' }, 'Local File (choose location on device)');
        const gdriveOpt = h('option', { value: 'googledrive' }, 'Google Drive (your account)');
        const onedriveOpt = h('option', { value: 'onedrive' }, 'OneDrive (your account)');
        if (currentStorage === 'localstorage') localOpt.selected = true;
        if (currentStorage === 'indexeddb') idbOpt.selected = true;
        if (currentStorage === 'localfile') fileOpt.selected = true;
        if (currentStorage === 'googledrive') gdriveOpt.selected = true;
        if (currentStorage === 'onedrive') onedriveOpt.selected = true;
        select.appendChild(localOpt);
        select.appendChild(idbOpt);
        select.appendChild(fileOpt);
        select.appendChild(gdriveOpt);
        select.appendChild(onedriveOpt);
        body.appendChild(select);

        body.appendChild(h('div', { style: 'font-size: 0.875rem; color: var(--text-secondary); margin-bottom: var(--space-lg);' },
          'Migration copies data to the selected storage target and keeps a local fallback copy in LocalStorage.'));

        const migrateBtn = h('button', {
          className: 'btn btn-primary',
          style: 'width: 100%;',
          onclick: async () => {
            migrateBtn.disabled = true;
            const target = select.value;
            try {
              await migrateCurrentDatasetStorage(target);
              overlay.remove();
            } catch (err) {
              showToast('Migration failed: ' + err.message, 'error');
              migrateBtn.disabled = false;
            }
          }
        }, 'Migrate Storage');
        body.appendChild(migrateBtn);

        modal.appendChild(body);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        overlay.onclick = (e) => {
          if (e.target === overlay) overlay.remove();
        };
      }

      /**
       * Duplicate a card with option to clone children
       * @param {string} id - Card ID to duplicate
       * @param {boolean} withChildren - Whether to clone children recursively
       * @returns {string} New card ID
       */
      function duplicateCard(id, withChildren = false) {
        const original = store.cards[id];
        if (!original) return null;

        const groupedUndo = withChildren && window.startUndoGroup && window.startUndoGroup('duplicateCard');

        const newId = uid();
        const now = Date.now();
        
        // Create duplicate with new ID and title suffix
        store.cards[newId] = {
          ...cloneCard(original),
          id: newId,
          title: (original.title || 'Untitled') + ' (Copy)',
          children: [],
          createdAt: now,
          updatedAt: now
        };
        
        // Add to parent or root
        if (original.parentId) {
          const parent = store.cards[original.parentId];
          if (parent && !parent.children.includes(newId)) {
            parent.children.push(newId);
          }
        } else {
          store.rootOrder.push(newId);
        }
        
        // Recursively duplicate children if requested
        if (withChildren && original.children.length > 0) {
          original.children.forEach(childId => {
            const newChildId = duplicateCardAsChild(childId, newId, true);
          });
        }
        
        save();
        if (groupedUndo && window.endUndoGroup) window.endUndoGroup();
        return newId;
      }

      /**
       * Helper to duplicate a card as child of another card
       * @param {string} id - Card ID to duplicate
       * @param {string} newParentId - New parent card ID
       * @param {boolean} withChildren - Whether to clone children recursively
       * @returns {string} New card ID
       */
      function duplicateCardAsChild(id, newParentId, withChildren = false) {
        const original = store.cards[id];
        if (!original) return null;
        
        const newId = uid();
        const now = Date.now();
        
        store.cards[newId] = {
          ...cloneCard(original),
          id: newId,
          parentId: newParentId,
          children: [],
          createdAt: now,
          updatedAt: now
        };
        
        const parent = store.cards[newParentId];
        if (parent && !parent.children.includes(newId)) {
          parent.children.push(newId);
        }
        
        if (withChildren && original.children.length > 0) {
          original.children.forEach(childId => {
            duplicateCardAsChild(childId, newId, true);
          });
        }
        
        return newId;
      }

      /**
       * Toggle bookmark status for a card
       * @param {string} cardId - Card ID to bookmark/unbookmark
       */
      function toggleBookmark(cardId) {
        if (!store.bookmarks) store.bookmarks = [];
        const idx = store.bookmarks.indexOf(cardId);
        if (idx >= 0) {
          store.bookmarks.splice(idx, 1);
          showToast('Bookmark removed', 'info');
        } else {
          store.bookmarks.push(cardId);
          showToast('Card bookmarked', 'success');
        }
        save();
        render();
      }

      /**
       * Check if a card is bookmarked
       * @param {string} cardId - Card ID to check
       * @returns {boolean} True if bookmarked
       */
      function isBookmarked(cardId) {
        if (!store.bookmarks) store.bookmarks = [];
        return store.bookmarks.includes(cardId);
      }

      /**
       * Add card to recent history
       * @param {string} cardId - Card ID to add to recent history
       */
      function addToRecentCards(cardId) {
        if (!store.recentCards) store.recentCards = [];
        // Remove if already in list
        store.recentCards = store.recentCards.filter(id => id !== cardId);
        // Add to front
        store.recentCards.unshift(cardId);
        // Keep only last 10
        if (store.recentCards.length > 10) {
          store.recentCards = store.recentCards.slice(0, 10);
        }
        save(true); // Save immediately but don't show toast
      }

      /**
       * Toggle view mode between normal and compact
       */
      function toggleViewMode() {
        if (!store.viewMode) store.viewMode = 'normal';
        store.viewMode = store.viewMode === 'normal' ? 'compact' : 'normal';
        save();
        render();
        showToast(`View mode: ${store.viewMode}`, 'info');
      }

      // --- DATA (IMPORT/EXPORT) ---

      function exportJSON(type = 'instance') {
        let data;
        if (type === 'instance') {
          data = {
            exportType: 'instance',
            appVersion: APP_VERSION,
            timestamp: Date.now(),
            cards: store.cards,
            rootIds: store.rootOrder,
            plugins: store.plugins
          };
        } else if (type === 'plugins') {
          data = {
            exportType: 'plugins',
            appVersion: APP_VERSION,
            timestamp: Date.now(),
            plugins: store.plugins
          };
        }
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const filename = `cardspoke-${type}-${Date.now()}.json`;
        downloadWithFeedback(blob, filename, 'JSON');
      }

      /**
       * Download file with feedback and fallback handling
       * @param {Blob} blob - File blob to download
       * @param {string} filename - Suggested filename
       * @param {string} format - File format for display (e.g., 'TXT', 'Markdown')
       */
      function downloadWithFeedback(content, filename, mimeType) {
        // Create blob from content if it's a string
        const blob = typeof content === 'string' 
          ? new Blob([content], { type: mimeType || 'text/plain' })
          : content;
        const url = URL.createObjectURL(blob);
        const format = mimeType || 'file';
        
        try {
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          
          // Add to document for Firefox compatibility
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          
          // Show success feedback
          showToast(`✓ ${format} export downloaded: ${filename}`, 'success');
          
        } catch (err) {
          // Fallback: show modal with download link
          console.warn('[Export] Automatic download failed:', err);
          
          const overlay = h('div', { className: 'modal-overlay show' });
          const modal = h('div', { className: 'modal' });
          const modalHeader = h('div', { className: 'modal-header' });
          modalHeader.appendChild(h('div', { className: 'modal-title' }, 'Export Ready'));
          const closeBtn = h('button', { className: 'modal-close', onclick: () => overlay.remove() }, '✕');
          modalHeader.appendChild(closeBtn);
          modal.appendChild(modalHeader);
          
          const modalBody = h('div', { className: 'modal-body' });
          modalBody.appendChild(h('p', { style: 'margin-bottom: var(--space-lg);' }, 
            `Your ${format} export is ready. Click the button below to download.`));
          
          const downloadBtn = h('a', {
            className: 'btn btn-primary',
            href: url,
            download: filename,
            style: 'display: inline-block; text-decoration: none;'
          }, `Download ${filename}`);
          
          downloadBtn.onclick = () => {
            showToast(`✓ ${format} export downloaded`, 'success');
            setTimeout(() => overlay.remove(), 500);
          };
          
          modalBody.appendChild(downloadBtn);
          modal.appendChild(modalBody);
          overlay.appendChild(modal);
          document.body.appendChild(overlay);
          
          showToast(`${format} export ready - click to download`, 'info');
        }
        
        // Clean up blob URL after a delay
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      }

      function exportTXT() {
        let text = '# CardSpoke Export\n\n';
        function writeCard(cardId, depth = 0) {
          const card = store.cards[cardId];
          if (!card) return;
          const indent = '  '.repeat(depth);
          text += `${indent}${card.title || '(Untitled)'}\n`;
          if (card.body) {
            text += `${indent}  ${card.body.replace(/\n/g, '\n' + indent + '  ')}\n`;
          }
          text += '\n';
          (card.children || []).forEach(cid => writeCard(cid, depth + 1));
        }
        store.rootOrder.forEach(id => writeCard(id));
        const blob = new Blob([text], { type: 'text/plain' });
        const filename = `cardspoke-${new Date().toISOString().slice(0,10)}.txt`;
        downloadWithFeedback(blob, filename, 'TXT');
      }


      /**
       * Export cards to Markdown format with hierarchy
       */
      function exportMarkdown() {
        let markdown = '# CardSpoke Export\n\n';
        markdown += `*Exported: ${new Date().toLocaleString()}*\n\n`;
        markdown += '---\n\n';
        
        function writeCardMD(cardId, depth = 0) {
          const card = store.cards[cardId];
          if (!card) return;
          
          const heading = '#'.repeat(Math.min(depth + 1, 6));
          markdown += `${heading} ${card.title || '(Untitled)'}\n\n`;
          
          if (card.tags && card.tags.length > 0) {
            markdown += `*Tags: ${card.tags.map(t => `\`${t}\``).join(', ')}*\n\n`;
          }
          
          if (card.body) {
            markdown += `${card.body}\n\n`;
          }
          
          (card.children || []).forEach(cid => writeCardMD(cid, depth + 1));
        }
        
        store.rootOrder.forEach(id => writeCardMD(id));

        const blob = new Blob([markdown], { type: 'text/markdown' });
        const filename = `cardspoke-${new Date().toISOString().slice(0,10)}.md`;
        downloadWithFeedback(blob, filename, 'Markdown');
      }

      /**
       * Export cards to CSV format (flat structure)
       */
      function exportCSV() {
        let csv = 'ID,Title,Body,Parent ID,Tags,Children Count,Created,Updated\n';
        
        Object.values(store.cards).forEach(card => {
          const id = card.id || '';
          const title = (card.title || '').replace(/"/g, '""');
          const body = (card.body || '').replace(/"/g, '""').replace(/\n/g, ' ');
          const parentId = card.parentId || '';
          const tags = (card.tags || []).join(';');
          const childrenCount = (card.children || []).length;
          const created = card.createdAt || '';
          const updated = card.updatedAt || '';

          csv += `"${id}","${title}","${body}","${parentId}","${tags}",${childrenCount},"${created}","${updated}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const filename = `cardspoke-${new Date().toISOString().slice(0,10)}.csv`;
        downloadWithFeedback(blob, filename, 'CSV');
      }
      function handleExport(type) {
        if (type === 'instance-json') exportJSON('instance');
        else if (type === 'instance-txt') exportTXT();
        else if (type === 'plugins-json') exportJSON('plugins');
      }

      function importJSON(data, mode = 'root') {
        const groupedUndo = window.startUndoGroup && window.startUndoGroup('importJSON');
        try {
          let pkg;
          try {
            pkg = typeof data === 'string' ? JSON.parse(data) : data;
          } catch (err) {
            showToast('Invalid JSON: ' + err.message, 'error');
            throw new Error('Failed to parse JSON: ' + err.message);
          }

        // Security: Validate import data structure
        if (!pkg || typeof pkg !== 'object') {
          showToast('Invalid import: data must be an object', 'error');
          throw new Error('Invalid import data structure');
        }

        // Validate cards object
        if (pkg.cards && typeof pkg.cards !== 'object') {
          showToast('Invalid import: cards must be an object', 'error');
          throw new Error('Invalid cards structure');
        }

        // Validate each card has required fields
        if (pkg.cards) {
          for (const [cardId, card] of Object.entries(pkg.cards)) {
            if (!card || typeof card !== 'object') {
              showToast(`Invalid card structure for ID: ${cardId}`, 'error');
              throw new Error('Invalid card structure');
            }
            // Validate required card fields
            if (card.children && !Array.isArray(card.children)) {
              showToast(`Invalid children array for card: ${cardId}`, 'error');
              throw new Error('Invalid card children structure');
            }
          }
        }

        // Validate rootIds if present
        if (pkg.rootIds && !Array.isArray(pkg.rootIds)) {
          showToast('Invalid import: rootIds must be an array', 'error');
          throw new Error('Invalid rootIds structure');
        }

        // Validate plugins if present (and warn about security)
        if (pkg.plugins && pkg.exportType === 'instance') {
          const modCount = Object.keys(pkg.plugins).length;
          if (modCount > 0) {
            const confirmImportMods = confirm(
              `⚠️ SECURITY WARNING\n\n` +
              `This import includes ${modCount} plugin(s).\n\n` +
              `Plugins can execute code and access your data. ` +
              `Only import plugins from sources you trust.\n\n` +
              `Do you want to import the plugins?\n` +
              `(Click Cancel to import only the cards without plugins)`
            );
            if (!confirmImportMods) {
              delete pkg.plugins;
            }
          }
        }

        const importedIds = [];
        const idMap = {};
        const remappedCards = {};

        Object.entries(pkg.cards || {}).forEach(([oldId, card]) => {
          const newId = uid();
          idMap[oldId] = newId;
          remappedCards[newId] = { ...card, id: newId };
          importedIds.push(newId);
        });
        
        Object.values(remappedCards).forEach(card => {
          card.children = (card.children || []).map(cid => idMap[cid] || cid);
          if (card.parentId && idMap[card.parentId]) {
            card.parentId = idMap[card.parentId];
          }
        });
        
        const remappedRootIds = (pkg.rootIds || []).map(id => idMap[id] || id);
        
        Object.values(remappedCards).forEach(card => {
          store.cards[card.id] = card;
        });
        
        if (mode === 'root') {
          remappedRootIds.forEach(id => {
            if (store.cards[id]) {
              store.cards[id].parentId = null;
              if (!store.rootOrder.includes(id)) {
                store.rootOrder.push(id);
              }
            }
          });
        } else {
          const parentCard = store.cards[mode];
          if (parentCard) {
            remappedRootIds.forEach(cardId => {
              if (store.cards[cardId]) {
                store.cards[cardId].parentId = mode;
                if (!parentCard.children.includes(cardId)) {
                  parentCard.children.push(cardId);
                }
              }
            });
          }
        }
        
        if (pkg.exportType === 'instance' && pkg.plugins) {
          Object.entries(pkg.plugins).forEach(([modId, plugin]) => {
            if (!store.plugins[modId]) {
              store.plugins[modId] = {
                enabled: !!plugin.enabled,
                js: plugin.js || '',
                css: plugin.css || '',
                meta: plugin.meta ? { ...plugin.meta } : {}
              };
            }
          });
        }
        
        save();

        importedIds.forEach(cardId => {
          const storedCard = store.cards[cardId];
          if (storedCard) {
          }
        });
        
        showToast(`Imported ${Object.keys(remappedCards).length} cards`);
        render();
        } finally {
          if (groupedUndo && window.endUndoGroup) window.endUndoGroup();
        }
      }

      function importTXT(text, mode = 'outline', location = 'root') {
        const createdIds = [];
        if (mode === 'outline') {
          const lines = text.split('\n').filter(l => l.trim());
          const stack = [];
          lines.forEach(line => {
            const indent = line.search(/\S/);
            const title = line.trim();
            const depth = Math.floor(indent / 2);
            const parentId = depth > 0 && stack[depth - 1] ? stack[depth - 1] :
                           (location === 'root' ? null : location);
            const id = createCard(title, '', parentId);
            stack[depth] = id;
            stack.length = depth + 1;
            createdIds.push(id);
          });
          showToast('Imported outline successfully');
          render();
        } else if (mode === 'append') {
          if (location && location !== 'root') {
            const card = store.cards[location];
            if (card) {
              card.body = (card.body ? card.body + '\n\n' : '') + text;
              card.updatedAt = Date.now();
              save();
              showToast('Text appended successfully');
              render();
            }
          }
        }

      }

      // --- INSTANCE & MODALS ---

      function showDatasetManager() {
        const overlay = h('div', { className: 'modal-overlay show' });
        const modal = h('div', { className: 'modal', style: 'max-width: 700px;' });
        const modalHeader = h('div', { className: 'modal-header' });
        modalHeader.appendChild(h('div', { className: 'modal-title' }, 'Dataset Manager'));
        const closeBtn = h('button', { className: 'modal-close', onclick: () => overlay.remove() }, '✕');
        modalHeader.appendChild(closeBtn);
        modal.appendChild(modalHeader);
        const modalBody = h('div', { className: 'modal-body' });

        // Get all existing datasets (instances)
        const allKeys = Object.keys(localStorage).filter(k => k.startsWith('nested_cards_') || k === 'nested_cards_store');
        const current = instanceKey || 'nested_cards_store';

        // Title and description
        const description = h('p', { style: 'margin-bottom: var(--space-lg); color: var(--text-secondary);' }, 
          'Manage your datasets. Each dataset is an independent collection of cards with its own storage.');
        modalBody.appendChild(description);

        // Existing datasets section
        const datasetsTitle = h('h3', { style: 'margin-bottom: var(--space-md);' }, 'Your Datasets');
        modalBody.appendChild(datasetsTitle);

        if (allKeys.length === 0) {
          const empty = h('div', { className: 'empty', style: 'margin-bottom: var(--space-xl);' }, 
            'No datasets found. Create your first dataset below.');
          modalBody.appendChild(empty);
        } else {
          // List existing datasets
          const datasetList = h('div', { style: 'margin-bottom: var(--space-xl);' });
          
          allKeys.forEach(key => {
            const isCurrent = key === current;
            const datasetItem = h('div', { 
              style: `
                background: ${isCurrent ? 'var(--primary-light, #e3f2fd)' : 'var(--bg-secondary)'};
                padding: var(--space-lg);
                border-radius: var(--radius);
                border: 2px solid ${isCurrent ? 'var(--primary)' : 'var(--border)'};
                margin-bottom: var(--space-md);
                display: flex;
                justify-content: space-between;
                align-items: center;
              `
            });

            // Dataset info
            const datasetInfo = h('div', { style: 'flex: 1;' });
            const datasetName = h('div', { style: 'font-weight: 700; margin-bottom: var(--space-xs);' }, 
              key + (isCurrent ? ' (Active)' : ''));
            const datasetMeta = h('div', { style: 'font-size: 0.875rem; color: var(--text-secondary);' });
            
            // Get size info
            try {
              const data = localStorage.getItem(key);
              const size = data ? new Blob([data]).size : 0;
              const formatBytes = (bytes) => {
                if (bytes === 0) return '0 Bytes';
                const k = 1024;
                const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
              };
              
              const parsed = data ? JSON.parse(data) : null;
              const cardCount = parsed ? Object.keys(parsed.cards || {}).length : 0;
              const datasetName = (parsed && parsed.metadata && parsed.metadata.name) || key;
              const storageType = (parsed && parsed.metadata && parsed.metadata.storageType) || 'localstorage';
              const storageTypeDisplay = getStorageTypeLabel(storageType);
              
              datasetMeta.textContent = `Storage: ${storageTypeDisplay} • Size: ${formatBytes(size)} • Cards: ${cardCount}`;
            } catch (e) {
              datasetMeta.textContent = 'Storage: Unknown • Unable to read dataset info';
            }

            datasetInfo.appendChild(datasetName);
            datasetInfo.appendChild(datasetMeta);
            datasetItem.appendChild(datasetInfo);

            // Actions
            const actions = h('div', { style: 'display: flex; gap: var(--space-sm);' });
            
            if (!isCurrent) {
              const openBtn = h('button', { 
                className: 'btn btn-primary',
                onclick: () => {
                  localStorage.setItem('activeInstance', key);
                  setInstanceKey(key);
                  load();
                  if (!safeMode) {
                  }
                  render();
                  overlay.remove();
                  showToast('Switched to: ' + key);
                }
              }, 'Open');
              actions.appendChild(openBtn);
            }

            if (isCurrent) {
              const storageBtn = h('button', {
                className: 'btn',
                onclick: () => {
                  overlay.remove();
                  showDatasetStorageSettings();
                }
              }, 'Storage Settings');
              actions.appendChild(storageBtn);
            }

            const deleteBtn = h('button', { 
              className: 'btn btn-danger',
              onclick: () => {
                if (allKeys.length === 1) {
                  showToast('Cannot delete the only dataset', 'error');
                  return;
                }
                if (confirm(`Delete dataset "${key}"?\n\nThis will permanently delete all cards and data in this dataset.\n\nThis action cannot be undone!`)) {
                  localStorage.removeItem(key);
                  if (isCurrent && allKeys.length > 1) {
                    // Switch to another dataset
                    const otherKey = allKeys.find(k => k !== key);
                    localStorage.setItem('activeInstance', otherKey);
                    setInstanceKey(otherKey);
                    load();
                    render();
                  }
                  overlay.remove();
                  showToast('Dataset deleted: ' + key);
                  // Reopen manager to refresh list
                  setTimeout(() => showDatasetManager(), 100);
                }
              }
            }, 'Delete');
            actions.appendChild(deleteBtn);

            datasetItem.appendChild(actions);
            datasetList.appendChild(datasetItem);
          });

          modalBody.appendChild(datasetList);
        }

        // Create new dataset section
        const createTitle = h('h3', { style: 'margin-bottom: var(--space-md);' }, 'Create New Dataset');
        modalBody.appendChild(createTitle);

        const createForm = h('div', { 
          style: `
            background: var(--bg-secondary);
            padding: var(--space-lg);
            border-radius: var(--radius);
            border: 1px solid var(--border);
          `
        });

        // Dataset name input
        const nameLabel = h('label', { 
          style: 'display: block; margin-bottom: var(--space-xs); font-weight: 600;' 
        }, 'Dataset Name');
        const nameInput = h('input', {
          type: 'text',
          id: 'newDatasetName',
          placeholder: 'My Dataset',
          style: `
            width: 100%;
            padding: var(--space-md);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            background: var(--bg-primary);
            color: var(--text-primary);
            margin-bottom: var(--space-lg);
            font-size: 1rem;
          `
        });

        // Storage type selection
        const storageLabel = h('label', { 
          style: 'display: block; margin-bottom: var(--space-xs); font-weight: 600;' 
        }, 'Storage Type');
        const storageSelect = h('select', {
          id: 'newDatasetStorage',
          style: `
            width: 100%;
            padding: var(--space-md);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            background: var(--bg-primary);
            color: var(--text-primary);
            margin-bottom: var(--space-xs);
            font-size: 1rem;
          `
        });

        const optionLocal = h('option', { value: 'localstorage' }, 'LocalStorage (Browser storage, fast access)');
        const optionIndexed = h('option', { value: 'indexeddb' }, 'IndexedDB (Browser database, larger capacity)');
        const optionLocalFile = h('option', { value: 'localfile' }, 'Local File (choose location on device)');
        const optionGoogleDrive = h('option', { value: 'googledrive' }, 'Google Drive (Cross-Device, cloud sync)');
        const optionOneDrive = h('option', { value: 'onedrive' }, 'OneDrive (Cross-Device, cloud sync)');
                storageSelect.appendChild(optionLocal);
        storageSelect.appendChild(optionIndexed);
        storageSelect.appendChild(optionLocalFile);
        storageSelect.appendChild(optionGoogleDrive);
        storageSelect.appendChild(optionOneDrive);

        const storageHelp = h('div', {
          style: 'font-size: 0.875rem; color: var(--text-secondary); margin-bottom: var(--space-lg);'
        }, 'Default: LocalStorage. You can migrate later. Local File lets you choose a save location. Cloud options use your own Google Drive or OneDrive account.');

        // PIN protection
        const pinLabel = h('label', { 
          style: 'display: block; margin-bottom: var(--space-xs); font-weight: 600;' 
        }, 'PIN Protection (Optional)');
        const pinInput = h('input', {
          type: 'password',
          id: 'newDatasetPin',
          placeholder: 'Leave empty for no PIN',
          title: 'Optional PIN used for dataset encryption',
          style: `
            width: 100%;
            padding: var(--space-md);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            background: var(--bg-primary);
            color: var(--text-primary);
            margin-bottom: var(--space-xs);
            font-size: 1rem;
          `
        });

        const pinHelp = h('div', { 
          style: 'font-size: 0.875rem; color: var(--text-secondary); margin-bottom: var(--space-lg);' 
        }, 'If set, this PIN encrypts dataset payloads via Web Crypto (PBKDF2 + AES-GCM).');

        // Create button
        const createBtn = h('button', {
          className: 'btn btn-primary',
          style: 'width: 100%;',
          onclick: async () => {
            let name = document.getElementById('newDatasetName').value.trim();
            const storageType = document.getElementById('newDatasetStorage').value;
            const pin = document.getElementById('newDatasetPin').value.trim();

            // Generate a readable default name if none provided
            if (!name) {
              const now = new Date();
              const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '_');
              const count = Object.keys(localStorage).filter(k => k.startsWith('cards_')).length + 1;
              name = 'Dataset_' + count;
            }

            if (storageType === 'localfile') {
              if (typeof window.showSaveFilePicker !== 'function') {
                showToast('Local file location selection is not supported in this environment', 'error');
                return;
              }
            }

            // For cloud storage (Google Drive, OneDrive), initialize and trigger auth
            if (storageType === 'googledrive') {
              try {
                const driver = new GoogleDriveDriver();
                await driver.init({});
                showToast('Connecting to Google Drive...', 'info');
                // The OAuth popup will appear automatically via ensureAuthenticated
                await driver.ensureAuthenticated();
                showToast('Connected to Google Drive!', 'success');
              } catch (error) {
                showToast('Failed to connect to Google Drive: ' + error.message, 'error');
                return;
              }
            } else if (storageType === 'onedrive') {
              try {
                const driver = new OneDriveDriver();
                await driver.init({});
                showToast('Connecting to OneDrive...', 'info');
                // The OAuth popup will appear automatically via ensureAuthenticated
                await driver.ensureAuthenticated();
                showToast('Connected to OneDrive!', 'success');
              } catch (error) {
                showToast('Failed to connect to OneDrive: ' + error.message, 'error');
                return;
              }
            }

            // Generate a clean, short key using the name and a short timestamp
            const shortId = Date.now().toString(36).slice(-4);
            const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20);
            const newKey = 'cards_' + cleanName + '_' + shortId;

            // Store the display name and storage type in the store metadata
            const newStore = {
              rootOrder: [],
              cards: {},
              plugins: {},
              bookmarks: [],
              recentCards: [],
              viewMode: 'normal',
              activeTheme: 'light',
              metadata: {
                name: name,
                storageType: storageType,
                storageConfig: {},
                createdAt: Date.now(),
                pin: pin || null
              }
            };

            // Save to localStorage (for now - cloud sync will happen on subsequent saves)
            localStorage.setItem('activeInstance', newKey);
            setInstanceKey(newKey);
            setStore(newStore);
            save();
            render();
            overlay.remove();
            showToast(`Created new dataset: ${name} (${storageType})`);
          }
        }, '+ Create Dataset');

        createForm.appendChild(nameLabel);
        createForm.appendChild(nameInput);
        createForm.appendChild(storageLabel);
        createForm.appendChild(storageSelect);
        createForm.appendChild(storageHelp);
        createForm.appendChild(pinLabel);
        createForm.appendChild(pinInput);
        createForm.appendChild(pinHelp);
        createForm.appendChild(createBtn);

        modalBody.appendChild(createForm);

        modal.appendChild(modalBody);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        overlay.onclick = (e) => {
          if (e.target === overlay) overlay.remove();
        };

        // Focus on name input
        setTimeout(() => nameInput.focus(), 100);
      }



      function showDatasetInfo() {
        const overlay = h('div', { className: 'modal-overlay show' });
        const modal = h('div', { className: 'modal' });
        const modalHeader = h('div', { className: 'modal-header' });
        modalHeader.appendChild(h('div', { className: 'modal-title' }, 'Dataset Information'));
        const closeBtn = h('button', { className: 'modal-close', onclick: () => overlay.remove() }, '✕');
        modalHeader.appendChild(closeBtn);
        modal.appendChild(modalHeader);
        const modalBody = h('div', { className: 'modal-body' });

        // Current instance/dataset info
        const currentKey = instanceKey || 'nested_cards_store';
        const currentData = localStorage.getItem(currentKey);
        
        // Calculate size
        let dataSize = 0;
        let totalSize = 0;
        let itemCount = 0;
        
        if (currentData) {
          dataSize = new Blob([currentData]).size;
        }
        
        // Count all localStorage items
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += new Blob([value]).size;
            itemCount++;
          }
        }

        // Parse store info
        let cardCount = 0;
        let modCount = 0;
        let bookmarkCount = 0;
        let recentCount = 0;
        
        if (store) {
          cardCount = Object.keys(store.cards || {}).length;
          modCount = Object.keys(store.plugins || {}).length;
          bookmarkCount = (store.bookmarks || []).length;
          recentCount = (store.recentCards || []).length;
        }

        // Format bytes
        const formatBytes = (bytes) => {
          if (bytes === 0) return '0 Bytes';
          const k = 1024;
          const sizes = ['Bytes', 'KB', 'MB', 'GB'];
          const i = Math.floor(Math.log(bytes) / Math.log(k));
          return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
        };

        // Get storage type and display name from store metadata
        const displayName = (store && store.metadata && store.metadata.name) || currentKey;
        const storageType = (store && store.metadata && store.metadata.storageType) || 'localstorage';
        const storageTypeDisplay = getStorageTypeLabel(storageType);

        // Create info sections using safe DOM methods
        const infoRow = (label, value) => {
          const row = h('div', { style: 'margin-bottom: var(--space-sm);' });
          row.appendChild(h('strong', {}, label));
          row.appendChild(document.createTextNode(' ' + value));
          return row;
        };
        const sectionStyle = 'background: var(--bg-secondary); padding: var(--space-lg); border-radius: var(--radius); border: 1px solid var(--border);';
        const headingStyle = 'margin-bottom: var(--space-md); color: var(--text-primary);';

        // Current Dataset section
        const currentSection = h('div', { style: 'margin-bottom: var(--space-xl);' },
          h('h3', { style: headingStyle }, 'Current Dataset'),
          h('div', { style: sectionStyle },
            infoRow('Name:', displayName),
            infoRow('Storage Type:', storageTypeDisplay),
            infoRow('Size:', formatBytes(dataSize)),
            infoRow('PIN Protected:', 'No')
          )
        );
        modalBody.appendChild(currentSection);

        // Dataset Contents section
        const contentsSection = h('div', { style: 'margin-bottom: var(--space-xl);' },
          h('h3', { style: headingStyle }, 'Dataset Contents'),
          h('div', { style: sectionStyle },
            infoRow('Cards:', String(cardCount)),
            infoRow('Plugins:', String(modCount)),
            infoRow('Bookmarks:', String(bookmarkCount)),
            infoRow('Recent Cards:', String(recentCount))
          )
        );
        modalBody.appendChild(contentsSection);

        // Storage Overview section
        const quotaPercent = '~' + Math.round((totalSize / (5 * 1024 * 1024)) * 100) + '% (typical 5MB limit)';
        const storageSection = h('div', { style: 'margin-bottom: var(--space-xl);' },
          h('h3', { style: headingStyle }, 'Storage Overview'),
          h('div', { style: sectionStyle },
            infoRow('Total LocalStorage:', formatBytes(totalSize)),
            infoRow('Total Items:', String(itemCount)),
            infoRow('Quota Used:', quotaPercent)
          )
        );
        modalBody.appendChild(storageSection);

        // Quick Actions section
        const exportBtn = h('button', {
          className: 'btn btn-primary',
          onclick: () => { overlay.remove(); handleExport('instance-json'); }
        }, 'Export Dataset');
        const switchBtn = h('button', {
          className: 'btn btn-secondary',
          onclick: () => { overlay.remove(); showDatasetManager(); }
        }, 'Switch Dataset');
        const actionsSection = h('div', {},
          h('h3', { style: headingStyle }, 'Quick Actions'),
          h('div', { style: 'display: flex; gap: var(--space-md); flex-wrap: wrap;' },
            exportBtn, switchBtn
          )
        );
        modalBody.appendChild(actionsSection);

        modal.appendChild(modalBody);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        overlay.onclick = (e) => {
          if (e.target === overlay) overlay.remove();
        };
      }


      // =============================================================
      // --- PLUGIN MANAGER UI ---
      // Unified interface for installing, managing, and creating plugins
      // =============================================================

      function showPluginManager(initialTab) {
        initialTab = initialTab || 'installed';
        var overlay = h('div', { className: 'modal-overlay show' });
        var modal = h('div', { className: 'modal', style: 'max-width: 800px; max-height: 90vh;' });
        
        var modalHeader = h('div', { className: 'modal-header' });
        modalHeader.appendChild(h('div', { className: 'modal-title' }, 'Plugin Manager'));
        modalHeader.appendChild(h('button', {
          className: 'modal-close',
          onclick: function() { overlay.remove(); }
        }, '\u2715'));
        modal.appendChild(modalHeader);

        // Tab buttons
        var tabBar = h('div', { style: 'display: flex; border-bottom: 2px solid var(--border); padding: 0 var(--space-lg);' });
        var tabs = ['installed', 'install', 'gallery', 'create'];
        var tabButtons = {};
        var tabContents = {};

        tabs.forEach(function(tabName) {
          var btn = h('button', {
            className: 'tab-btn',
            style: 'padding: var(--space-md) var(--space-lg); border: none; background: none; cursor: pointer; border-bottom: 3px solid transparent; font-weight: 500;',
            onclick: function() { switchTab(tabName); }
          }, tabName.charAt(0).toUpperCase() + tabName.slice(1));
          tabButtons[tabName] = btn;
          tabBar.appendChild(btn);
        });
        modal.appendChild(tabBar);

        var bodyContent = h('div', { className: 'modal-body', style: 'overflow-y: auto; max-height: 65vh; padding: var(--space-lg);' });

        // Tab content containers
        tabs.forEach(function(tabName) {
          var container = h('div', { 
            className: 'tab-content',
            style: 'display: none;'
          });
          tabContents[tabName] = container;
          bodyContent.appendChild(container);
        });

        function switchTab(tabName) {
          tabs.forEach(function(t) {
            tabButtons[t].style.borderBottom = t === tabName ? '3px solid var(--primary, #3b82f6)' : '3px solid transparent';
            tabButtons[t].style.color = t === tabName ? 'var(--primary, #3b82f6)' : 'inherit';
            tabContents[t].style.display = t === tabName ? 'block' : 'none';
          });
        }

        // ===== INSTALLED TAB =====
        function renderInstalledTab() {
          var container = tabContents['installed'];
          container.innerHTML = '';

          var plugins = window.CardSpoke && window.CardSpoke.Plugin ? window.CardSpoke.Plugin.listAll() : [];
          
          if (plugins.length === 0) {
            container.appendChild(h('div', { className: 'empty', style: 'padding: var(--space-xl); text-align: center; color: var(--text-muted);' }, 
              'No plugins installed. Use the Install or Create tabs to add plugins.'));
            return;
          }

          plugins.forEach(function(plugin) {
            var manifest = plugin.definition.manifest || {};
            var pkg = { manifest: manifest, setup: plugin.definition.setup, teardown: plugin.definition.teardown, css: plugin.definition.css };
            var risk = window.CardSpoke.Plugin.assessModRisk(pkg);
            
            var card = h('div', {
              style: 'border: 1px solid var(--border); border-radius: var(--radius); padding: var(--space-md); margin-bottom: var(--space-md);'
            });

            var headerRow = h('div', { style: 'display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-sm);' });
            headerRow.appendChild(h('div', { style: 'font-weight: 700; font-size: var(--text-lg);' }, manifest.name || plugin.id));
            
            var riskBadge = h('span', {
              style: 'font-size: var(--text-xs); padding: 2px 8px; border-radius: 4px; font-weight: 600; ' +
                (risk === 'SAFE' ? 'background: #d1fae5; color: #065f46;' :
                 risk === 'LOW' ? 'background: #dbeafe; color: #1e40af;' :
                 risk === 'MEDIUM' ? 'background: #fef3c7; color: #92400e;' :
                 'background: #fee2e2; color: #991b1b;')
            }, risk);
            headerRow.appendChild(riskBadge);
            card.appendChild(headerRow);

            var info = h('div', { style: 'font-size: var(--text-sm); color: var(--text-muted); margin-bottom: var(--space-sm);' });
            info.textContent = 'v' + (manifest.version || '1.0.0') + ' by ' + (manifest.author || 'Unknown') + 
              (manifest.description ? ' — ' + manifest.description : '');
            card.appendChild(info);

            var actions = h('div', { style: 'display: flex; gap: var(--space-sm); margin-top: var(--space-md);' });
            
            var toggleBtn = h('button', {
              className: 'btn btn-sm',
              style: 'font-size: var(--text-sm);',
              onclick: async function() {
                try {
                  if (plugin.enabled) {
                    await window.CardSpoke.Plugin.disable(plugin.id);
                    showToast('Plugin disabled: ' + manifest.name);
                  } else {
                    await window.CardSpoke.Plugin.enable(plugin.id);
                    showToast('Plugin enabled: ' + manifest.name);
                  }
                  renderInstalledTab();
                } catch (err) {
                  showToast('Error: ' + err.message, 'error');
                }
              }
            }, plugin.enabled ? 'Disable' : 'Enable');
            actions.appendChild(toggleBtn);

            var removeBtn = h('button', {
              className: 'btn btn-sm',
              style: 'font-size: var(--text-sm); background: var(--danger, #ef4444); color: white;',
              onclick: function() {
                if (confirm('Remove plugin "' + manifest.name + '"?')) {
                  window.CardSpoke.Plugin.unregister(plugin.id);
                  showToast('Plugin removed: ' + manifest.name);
                  renderInstalledTab();
                }
              }
            }, 'Remove');
            actions.appendChild(removeBtn);
            
            card.appendChild(actions);
            container.appendChild(card);
          });

          // Legacy plugins section (if any exist)
          var modIds = Object.keys(store.plugins || {});
          if (modIds.length > 0) {
            var legacySection = h('div', { style: 'margin-top: var(--space-xl); padding-top: var(--space-xl); border-top: 1px solid var(--border);' });
            legacySection.appendChild(h('h3', { style: 'margin-bottom: var(--space-md); color: var(--warning, #f59e0b);' }, 'Legacy Plugins (Non-functional)'));
            legacySection.appendChild(h('p', { style: 'margin-bottom: var(--space-md); color: var(--text-muted);' },
              'These legacy plugins use the old system and are no longer functional:'));

            modIds.forEach(function(modId) {
              var pkg = store.plugins[modId];
              var manifest = pkg.manifest || {};
              
              var legacyCard = h('div', {
                style: 'border: 1px solid var(--border); border-radius: var(--radius); padding: var(--space-md); margin-bottom: var(--space-md); opacity: 0.6;'
              });

              legacyCard.appendChild(h('div', { style: 'font-weight: 700;' }, manifest.name || modId));
              legacyCard.appendChild(h('div', { style: 'font-size: var(--text-sm); color: var(--text-muted);' }, 
                'v' + (manifest.version || '?') + ' by ' + (manifest.author || 'Unknown')));
              
              var exportBtn = h('button', {
                className: 'btn btn-sm',
                style: 'font-size: var(--text-xs); margin-top: var(--space-sm);',
                onclick: function() {
                  var json = JSON.stringify(pkg, null, 2);
                  downloadWithFeedback(json, modId + '.json', 'application/json');
                  showToast('Legacy plugin exported for migration');
                }
              }, 'Export');
              legacyCard.appendChild(exportBtn);
              
              legacySection.appendChild(legacyCard);
            });

            container.appendChild(legacySection);
          }
        }

        // ===== INSTALL TAB =====
        function renderInstallTab() {
          var container = tabContents['install'];
          container.innerHTML = '';

          container.appendChild(h('h3', { style: 'margin-bottom: var(--space-md);' }, 'Install Plugin'));
          
          // File upload section
          var uploadSection = h('div', { style: 'margin-bottom: var(--space-xl);' });
          uploadSection.appendChild(h('h4', { style: 'margin-bottom: var(--space-sm);' }, 'Upload Plugin File'));
          uploadSection.appendChild(h('p', { style: 'margin-bottom: var(--space-md); color: var(--text-muted);' }, 
            'Upload a JSON file containing a plugin definition.'));
          
          var fileInput = h('input', { 
            type: 'file', 
            accept: '.json',
            style: 'margin-bottom: var(--space-sm);'
          });
          
          var uploadBtn = h('button', {
            className: 'btn',
            onclick: async function() {
              var file = fileInput.files[0];
              if (!file) {
                showToast('Please select a file', 'error');
                return;
              }
              
              try {
                var text = await file.text();
                var pkg = JSON.parse(text);
                
                // Task 1.2: pkg.js takes priority, then pkg.javascript (only if setup not already set)
                if (!pkg.setup) {
                  if (pkg.js && typeof pkg.js === 'string') {
                    pkg.setup = (window.CardSpoke && window.CardSpoke.PluginSandbox ? window.CardSpoke.PluginSandbox.createFunction(pkg.js) : new Function('ctx', pkg.js));
                  } else if (pkg.javascript && typeof pkg.javascript === 'string') {
                    pkg.setup = (window.CardSpoke && window.CardSpoke.PluginSandbox ? window.CardSpoke.PluginSandbox.createFunction(pkg.javascript) : new Function('ctx', pkg.javascript));
                  }
                }
                
                var id = await window.CardSpoke.Plugin.install(pkg);
                showToast('Plugin installed: ' + (pkg.manifest.name || id), 'success');
                renderInstalledTab();
                switchTab('installed');
              } catch (err) {
                showToast('Installation failed: ' + err.message, 'error');
              }
            }
          }, 'Install from File');
          
          uploadSection.appendChild(fileInput);
          uploadSection.appendChild(uploadBtn);
          container.appendChild(uploadSection);

          // URL section
          var urlSection = h('div', {});
          urlSection.appendChild(h('h4', { style: 'margin-bottom: var(--space-sm);' }, 'Install from URL'));
          urlSection.appendChild(h('p', { style: 'margin-bottom: var(--space-md); color: var(--text-muted);' }, 
            'Load a plugin from a remote URL.'));
          
          var urlInput = h('input', {
            type: 'url',
            placeholder: 'https://example.com/plugin.json',
            style: 'width: 100%; padding: var(--space-sm); margin-bottom: var(--space-sm); border: 1px solid var(--border); border-radius: 4px;'
          });
          
          var urlBtn = h('button', {
            className: 'btn',
            onclick: async function() {
              var url = urlInput.value.trim();
              if (!url) {
                showToast('Please enter a URL', 'error');
                return;
              }
              
              try {
                var response = await fetch(url);
                if (!response.ok) throw new Error('Failed to fetch plugin: ' + response.status + ' ' + response.statusText);
                var pkg = await response.json();
                
                // Task 1.2: pkg.js takes priority, then pkg.javascript (only if setup not already set)
                if (!pkg.setup) {
                  if (pkg.js && typeof pkg.js === 'string') {
                    pkg.setup = (window.CardSpoke && window.CardSpoke.PluginSandbox ? window.CardSpoke.PluginSandbox.createFunction(pkg.js) : new Function('ctx', pkg.js));
                  } else if (pkg.javascript && typeof pkg.javascript === 'string') {
                    pkg.setup = (window.CardSpoke && window.CardSpoke.PluginSandbox ? window.CardSpoke.PluginSandbox.createFunction(pkg.javascript) : new Function('ctx', pkg.javascript));
                  }
                }
                
                var id = await window.CardSpoke.Plugin.install(pkg);
                showToast('Plugin installed: ' + (pkg.manifest.name || id), 'success');
                renderInstalledTab();
                switchTab('installed');
              } catch (err) {
                showToast('Installation failed: ' + err.message, 'error');
              }
            }
          }, 'Install from URL');
          
          urlSection.appendChild(urlInput);
          urlSection.appendChild(urlBtn);
          container.appendChild(urlSection);
        }



        // ===== GALLERY TAB =====
        function renderGalleryTab() {
          var container = tabContents['gallery'];
          container.innerHTML = '';
          container.appendChild(h('h3', { style: 'margin-bottom: var(--space-md);' }, 'Plugin Gallery'));
          container.appendChild(h('p', { style: 'margin-bottom: var(--space-lg); color: var(--text-muted);' },
            'Browse curated plugins from the CardSpoke GitHub repository.'));

          var loading = h('div', { style: 'padding: var(--space-md); color: var(--text-muted);' }, 'Loading gallery...');
          container.appendChild(loading);

          fetch('https://raw.githubusercontent.com/jxburros/CardSpoke/main/sample-plugins/manifest.json')
            .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
            .then(function(manifest) {
              loading.remove();
              var plugins = Array.isArray(manifest.plugins) ? manifest.plugins : [];
              if (!plugins.length) {
                container.appendChild(h('div', { className: 'empty' }, 'No gallery plugins available.'));
                return;
              }
              plugins.forEach(function(item) {
                var card = h('div', { style: 'border: 1px solid var(--border); border-radius: var(--radius); padding: var(--space-md); margin-bottom: var(--space-md);' });
                card.appendChild(h('div', { style: 'font-weight: 700;' }, item.name || item.id || 'Plugin'));
                card.appendChild(h('div', { style: 'font-size: var(--text-sm); color: var(--text-muted); margin-top: var(--space-xs);' }, item.description || ''));
                var installBtn = h('button', { className: 'btn btn-sm', style: 'margin-top: var(--space-sm);', onclick: async function() {
                  try {
                    var url = item.url || item.sourceUrl;
                    if (!url) throw new Error('Missing plugin URL in manifest');
                    var res = await fetch(url);
                    if (!res.ok) throw new Error('Failed to fetch plugin package');
                    var pkg = await res.json();
                    var id = await window.CardSpoke.Plugin.install(pkg);
                    showToast('Installed: ' + (pkg.manifest && pkg.manifest.name ? pkg.manifest.name : id), 'success');
                    renderInstalledTab();
                  } catch (err) {
                    showToast('Gallery install failed: ' + err.message, 'error');
                  }
                }}, 'Install');
                card.appendChild(installBtn);
                container.appendChild(card);
              });
            })
            .catch(function(err) {
              loading.textContent = 'Failed to load gallery: ' + err.message;
            });
        }

        // ===== CREATE TAB =====
        function renderCreateTab() {
          var container = tabContents['create'];
          container.innerHTML = '';

          container.appendChild(h('h3', { style: 'margin-bottom: var(--space-md);' }, 'Create Plugin'));
          container.appendChild(h('p', { style: 'margin-bottom: var(--space-lg); color: var(--text-muted);' }, 
            'Build a plugin directly in the app by providing metadata, JavaScript, and CSS.'));

          var form = h('div', {});

          // Manifest section
          form.appendChild(h('h4', { style: 'margin-bottom: var(--space-sm);' }, 'Manifest (JSON)'));
          var manifestInput = h('textarea', {
            placeholder: '{\n  "name": "My Plugin",\n  "version": "1.0.0",\n  "author": "Your Name",\n  "layer": "feature",\n  "permissions": []\n}',
            style: 'width: 100%; min-height: 120px; padding: var(--space-sm); margin-bottom: var(--space-md); font-family: monospace; border: 1px solid var(--border); border-radius: 4px;'
          });
          form.appendChild(manifestInput);

          // JavaScript section
          form.appendChild(h('h4', { style: 'margin-bottom: var(--space-sm);' }, 'JavaScript (setup function)'));
          var jsInput = h('textarea', {
            placeholder: '// Access APIs via ctx parameter\nconst cards = ctx.api.data.listCards();\nctx.api.ui.showToast(`Loaded ${cards.length} cards`, \'info\');',
            style: 'width: 100%; min-height: 150px; padding: var(--space-sm); margin-bottom: var(--space-md); font-family: monospace; border: 1px solid var(--border); border-radius: 4px;'
          });
          form.appendChild(jsInput);

          // CSS section
          form.appendChild(h('h4', { style: 'margin-bottom: var(--space-sm);' }, 'CSS (optional)'));
          var cssInput = h('textarea', {
            placeholder: '/* Custom styles */\n.my-element {\n  color: var(--primary);\n}',
            style: 'width: 100%; min-height: 100px; padding: var(--space-sm); margin-bottom: var(--space-md); font-family: monospace; border: 1px solid var(--border); border-radius: 4px;'
          });
          form.appendChild(cssInput);

          // Save button
          var saveBtn = h('button', {
            className: 'btn',
            onclick: async function() {
              try {
                var manifest = JSON.parse(manifestInput.value || '{}');
                if (!manifest.name) {
                  showToast('Plugin name is required', 'error');
                  return;
                }

                var jsCode = jsInput.value.trim();
                var css = cssInput.value.trim();

                var pkg = {
                  manifest: manifest,
                  css: css || undefined
                };

                if (jsCode) {
                  pkg.setup = (window.CardSpoke && window.CardSpoke.PluginSandbox ? window.CardSpoke.PluginSandbox.createFunction(jsCode) : new Function('ctx', jsCode));
                }

                var id = await window.CardSpoke.Plugin.install(pkg);
                showToast('Plugin created and registered: ' + manifest.name, 'success');
                renderInstalledTab();
                switchTab('installed');
              } catch (err) {
                showToast('Failed to create plugin: ' + err.message, 'error');
              }
            }
          }, 'Save & Register');
          form.appendChild(saveBtn);

          container.appendChild(form);
        }

        // Render all tabs
        renderInstalledTab();
        renderInstallTab();
        renderGalleryTab();
        renderCreateTab();

        // Switch to initial tab
        switchTab(initialTab);

        modal.appendChild(bodyContent);
        overlay.appendChild(modal);
        overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
        document.body.appendChild(overlay);
      }

      function showAppearanceSettings() {
        const overlay = h('div', { className: 'modal-overlay show' });
        const modal = h('div', { className: 'modal', style: 'max-width: 600px;' });
        const modalHeader = h('div', { className: 'modal-header' });
        modalHeader.appendChild(h('div', { className: 'modal-title' }, 'Appearance Settings'));
        const closeBtn = h('button', { className: 'modal-close', onclick: () => overlay.remove(), 'aria-label': 'Close' }, '✕');
        modalHeader.appendChild(closeBtn);
        modal.appendChild(modalHeader);
        
        const modalBody = h('div', { className: 'modal-body' });
        
        // View Mode Section
        const viewSection = h('div', { style: 'margin-bottom: var(--space-2xl); padding-bottom: var(--space-xl); border-bottom: 1px solid var(--border);' });
        viewSection.appendChild(h('div', { 
          style: 'font-weight: 700; margin-bottom: var(--space-lg); font-size: var(--text-lg);'
        }, 'View Options'));
        
        // Rich Text Toggle (NEW)
        const richTextEnabled = localStorage.getItem('cardspoke_richtext') === 'true';
        const richTextRow = h('div', { 
          className: 'menu-item-toggle',
          style: 'padding: var(--space-md); border: 1px solid var(--border); border-radius: 4px; margin-bottom: var(--space-md);'
        });
        const richTextLabel = h('div', { className: 'menu-item-label' });
        richTextLabel.appendChild(h('span', { style: 'display: block;' }, 'Rich Text'));
        richTextLabel.appendChild(h('span', { style: 'font-size: var(--text-sm); color: var(--text-muted); display: block;' }, 'Enable markdown formatting in card body'));
        const richTextToggle = h('label', { className: 'switch-toggle' });
        const richTextInput = h('input', { 
          type: 'checkbox', 
          checked: richTextEnabled,
          onchange: function(e) {
            localStorage.setItem('cardspoke_richtext', e.target.checked ? 'true' : 'false');
            showToast(e.target.checked ? 'Rich Text enabled' : 'Rich Text disabled');
            render();
          }
        });
        const richTextSlider = h('span', { className: 'switch-slider' });
        richTextToggle.appendChild(richTextInput);
        richTextToggle.appendChild(richTextSlider);
        richTextRow.appendChild(richTextLabel);
        richTextRow.appendChild(richTextToggle);
        viewSection.appendChild(richTextRow);
        
        // Compact View Toggle
        const compactViewEnabled = store.viewMode === 'compact';
        const compactRow = h('div', { 
          className: 'menu-item-toggle',
          style: 'padding: var(--space-md); border: 1px solid var(--border); border-radius: 4px; margin-bottom: var(--space-md);'
        });
        const compactLabel = h('label', { className: 'menu-item-label' }, 'Compact View');
        const compactToggle = h('label', { className: 'switch-toggle' });
        const compactInput = h('input', { 
          type: 'checkbox', 
          checked: compactViewEnabled,
          onchange: function(e) {
            store.viewMode = e.target.checked ? 'compact' : 'normal';
            save();
            render();
          }
        });
        const compactSlider = h('span', { className: 'switch-slider' });
        compactToggle.appendChild(compactInput);
        compactToggle.appendChild(compactSlider);
        compactRow.appendChild(compactLabel);
        compactRow.appendChild(compactToggle);
        viewSection.appendChild(compactRow);
        
        // Grid View Toggle
        const gridViewEnabled = localStorage.getItem('cardspoke_gridView') === 'true';
        const gridRow = h('div', { 
          className: 'menu-item-toggle',
          style: 'padding: var(--space-md); border: 1px solid var(--border); border-radius: 4px; margin-bottom: var(--space-md);'
        });
        const gridLabel = h('label', { className: 'menu-item-label' }, 'Grid View');
        const gridToggle = h('label', { className: 'switch-toggle' });
        const gridInput = h('input', { 
          type: 'checkbox', 
          checked: gridViewEnabled,
          onchange: function(e) {
            localStorage.setItem('cardspoke_gridView', e.target.checked.toString());
            render();
          }
        });
        const gridSlider = h('span', { className: 'switch-slider' });
        gridToggle.appendChild(gridInput);
        gridToggle.appendChild(gridSlider);
        gridRow.appendChild(gridLabel);
        gridRow.appendChild(gridToggle);
        viewSection.appendChild(gridRow);
        
        // High Contrast Toggle
        const highContrastEnabled = localStorage.getItem('cardspoke_highcontrast') === 'true';
        const contrastRow = h('div', { 
          className: 'menu-item-toggle',
          style: 'padding: var(--space-md); border: 1px solid var(--border); border-radius: 4px;'
        });
        const contrastLabel = h('label', { className: 'menu-item-label' }, 'High Contrast');
        const contrastToggle = h('label', { className: 'switch-toggle' });
        const contrastInput = h('input', { 
          type: 'checkbox', 
          checked: highContrastEnabled,
          onchange: function(e) {
            localStorage.setItem('cardspoke_highcontrast', e.target.checked.toString());
            if (e.target.checked) {
              document.documentElement.classList.add('high-contrast');
            } else {
              document.documentElement.classList.remove('high-contrast');
            }
          }
        });
        const contrastSlider = h('span', { className: 'switch-slider' });
        contrastToggle.appendChild(contrastInput);
        contrastToggle.appendChild(contrastSlider);
        contrastRow.appendChild(contrastLabel);
        contrastRow.appendChild(contrastToggle);
        viewSection.appendChild(contrastRow);
        
        // Developer Mode Toggle
        const devModeEnabled = localStorage.getItem('cardspoke_devmode') === 'true';
        const devRow = h('div', { 
          className: 'menu-item-toggle',
          style: 'padding: var(--space-md); border: 1px solid var(--border); border-radius: 4px; margin-top: var(--space-md);'
        });
        const devLabel = h('label', { className: 'menu-item-label' }, 'Developer Mode');
        const devToggle = h('label', { className: 'switch-toggle' });
        const devInput = h('input', { 
          type: 'checkbox', 
          checked: devModeEnabled,
          onchange: function(e) {
            localStorage.setItem('cardspoke_devmode', e.target.checked.toString());
            if (e.target.checked) {
              showToast('Developer mode enabled - Open menu to access Developer Console', 'success');
            } else {
              showToast('Developer mode disabled', 'info');
            }
          }
        });
        const devSlider = h('span', { className: 'switch-slider' });
        devToggle.appendChild(devInput);
        devToggle.appendChild(devSlider);
        devRow.appendChild(devLabel);
        devRow.appendChild(devToggle);
        viewSection.appendChild(devRow);
        
        modalBody.appendChild(viewSection);
        
        // Typography Section
        const typoSection = h('div', { style: 'margin-bottom: var(--space-2xl); padding-bottom: var(--space-xl); border-bottom: 1px solid var(--border);' });
        typoSection.appendChild(h('div', { 
          style: 'font-weight: 700; margin-bottom: var(--space-lg); font-size: var(--text-lg);'
        }, 'Typography'));
        
        const currentTypography = localStorage.getItem('cardspoke_typography') || 'default';
        const typographyPresets = [
          { id: 'default', name: 'Default', desc: 'Standard reading size' },
          { id: 'comfortable', name: 'Comfortable', desc: 'Larger text, more spacing' },
          { id: 'compact', name: 'Compact', desc: 'Smaller text, denser layout' },
          { id: 'dyslexia', name: 'Dyslexia-Friendly', desc: 'Optimized for readability' }
        ];
        
        typographyPresets.forEach(function(preset) {
          const isActive = currentTypography === preset.id;
          const presetOption = h('div', {
            style: 'padding: var(--space-md); border: 2px solid ' + (isActive ? 'var(--text)' : 'var(--border)') + '; border-radius: 4px; margin-bottom: var(--space-md); cursor: pointer;',
            onclick: function() {
              localStorage.setItem('cardspoke_typography', preset.id);
              document.documentElement.setAttribute('data-typography', preset.id);
              showToast('Typography: ' + preset.name);
              overlay.remove();
              showAppearanceSettings();
            }
          });
          presetOption.appendChild(h('div', { style: 'font-weight: 600;' }, (isActive ? '✓ ' : '') + preset.name));
          presetOption.appendChild(h('div', { style: 'font-size: var(--text-sm); color: var(--text-muted);' }, preset.desc));
          typoSection.appendChild(presetOption);
        });
        
        modalBody.appendChild(typoSection);
        
        // Mode Section (Light/Dark)
        const modeSection = h('div', { style: 'margin-bottom: var(--space-2xl); padding-bottom: var(--space-xl); border-bottom: 1px solid var(--border);' });
        modeSection.appendChild(h('div', { 
          style: 'font-weight: 700; margin-bottom: var(--space-lg); font-size: var(--text-lg);'
        }, 'Mode'));
        
        const currentTheme = store.activeTheme || 'light';
        
        // Light mode option
        const lightOption = h('div', { 
          className: 'theme-option',
          style: 'padding: var(--space-lg); border: 2px solid ' + (currentTheme === 'light' ? 'var(--text)' : 'var(--border)') + '; margin-bottom: var(--space-md); cursor: pointer; border-radius: 4px; background: white; color: black;',
          onclick: function() {
            applyTheme('light');
            overlay.remove();
            showAppearanceSettings();
          }
        });
        lightOption.appendChild(h('div', { style: 'font-weight: 600; margin-bottom: var(--space-xs);' }, (currentTheme === 'light' ? '✓ ' : '') + 'Light Mode'));
        lightOption.appendChild(h('div', { style: 'font-size: var(--text-sm); color: #666;' }, 'Light color scheme'));
        modeSection.appendChild(lightOption);
        
        // Dark mode option
        const darkOption = h('div', { 
          className: 'theme-option',
          style: 'padding: var(--space-lg); border: 2px solid ' + (currentTheme === 'dark' ? 'white' : 'var(--border)') + '; margin-bottom: var(--space-md); cursor: pointer; border-radius: 4px; background: #1a1a1a; color: white;',
          onclick: function() {
            applyTheme('dark');
            overlay.remove();
            showAppearanceSettings();
          }
        });
        darkOption.appendChild(h('div', { style: 'font-weight: 600; margin-bottom: var(--space-xs);' }, (currentTheme === 'dark' ? '✓ ' : '') + 'Dark Mode'));
        darkOption.appendChild(h('div', { style: 'font-size: var(--text-sm); color: #aaa;' }, 'Dark color scheme'));
        modeSection.appendChild(darkOption);
        
        modalBody.appendChild(modeSection);
        
        // Theme Plugins Section
        const themeSection = h('div', { style: 'margin-bottom: var(--space-xl);' });
        themeSection.appendChild(h('div', {
          style: 'font-weight: 700; margin-bottom: var(--space-lg); font-size: var(--text-lg);'
        }, 'Theme Plugins'));

        // Custom themes from plugins
        const themeExtensions = Object.entries(store.plugins || {}).filter(function([modId, plugin]) {
          var manifest = plugin.manifest || plugin.meta || {};
          return manifest.layer === 'theme' || (manifest.type && manifest.type === 'Theme');
        }).map(function([modId, plugin]) {
          var manifest = plugin.manifest || plugin.meta || {};
          return { manifest: manifest, meta: manifest, enabled: plugin.enabled, css: plugin.css, id: modId };
        });

        // Get active theme plugin ID
        const activeThemeExtension = localStorage.getItem('cardspoke_activeThemeMod') || null;
        
        if (themeExtensions.length > 0) {
          // Default Theme option (no extension)
          const defaultThemeOption = h('div', {
            style: 'padding: var(--space-md); border: 2px solid ' + (!activeThemeExtension ? 'var(--text)' : 'var(--border)') + '; border-radius: 4px; margin-bottom: var(--space-sm); cursor: pointer;',
            onclick: function() {
              localStorage.removeItem('cardspoke_activeThemeMod');
              document.documentElement.className = document.documentElement.className
                .split(' ')
                .filter(c => !c.startsWith('theme-ext-'))
                .join(' ');
              showToast('Default theme applied');
              overlay.remove();
              showAppearanceSettings();
            }
          });
          defaultThemeOption.appendChild(h('div', { style: 'font-weight: 600;' }, (!activeThemeExtension ? '✓ ' : '') + 'Default Theme'));
          defaultThemeOption.appendChild(h('div', { style: 'font-size: var(--text-sm); color: var(--text-muted);' }, 'Standard CardSpoke appearance'));
          themeSection.appendChild(defaultThemeOption);
          
          themeExtensions.forEach(function(theme) {
            const isActive = activeThemeExtension === theme.id;
            const themeOption = h('div', {
              style: 'padding: var(--space-md); border: 2px solid ' + (isActive ? 'var(--text)' : 'var(--border)') + '; border-radius: 4px; margin-bottom: var(--space-sm); cursor: pointer; display: flex; justify-content: space-between; align-items: center;',
              onclick: function() {
                // Apply the theme extension (preserves current Light/Dark mode)
                localStorage.setItem('cardspoke_activeThemeMod', theme.id);
                // Remove all other theme extension classes and add this one
                document.documentElement.className = document.documentElement.className
                  .split(' ')
                  .filter(c => !c.startsWith('theme-ext-'))
                  .join(' ');
                document.documentElement.classList.add('theme-ext-' + theme.id);
                showToast('Theme applied: ' + (theme.manifest.name || theme.id));
                overlay.remove();
                showAppearanceSettings();
              }
            });
            
            const themeInfo = h('div', {});
            themeInfo.appendChild(h('div', { style: 'font-weight: 600;' }, (isActive ? '✓ ' : '') + (theme.manifest.name || theme.id)));
            themeInfo.appendChild(h('div', { style: 'font-size: var(--text-sm); color: var(--text-muted);' }, 'By ' + (theme.manifest.author || theme.manifest.creator || 'Unknown')));
            if (theme.manifest.description) {
              themeInfo.appendChild(h('div', { style: 'font-size: var(--text-sm); color: var(--text-muted); margin-top: var(--space-xs);' }, theme.manifest.description));
            }
            themeOption.appendChild(themeInfo);
            
            // Status badge
            const statusBadge = h('span', {
              style: 'font-size: var(--text-xs); padding: 2px 8px; border-radius: 10px; background: ' + (theme.enabled ? 'var(--success, #28a745)' : 'var(--text-muted)') + '; color: white;'
            }, theme.enabled ? 'Enabled' : 'Disabled');
            themeOption.appendChild(statusBadge);
            
            themeSection.appendChild(themeOption);
          });
        } else {
          themeSection.appendChild(h('div', { 
            style: 'padding: var(--space-lg); background: var(--bg-secondary); border-radius: 4px; text-align: center; color: var(--text-muted);'
          },
            h('div', { style: 'margin-bottom: var(--space-sm);' }, 'No custom themes installed'),
            h('div', { style: 'font-size: var(--text-sm);' }, 'Install theme plugins from the Plugin Manager')
          ));
        }
        
        modalBody.appendChild(themeSection);
        
        modal.appendChild(modalBody);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // Set up focus trap
        trapFocus(modal);
        
        overlay.onclick = function(e) {
          if (e.target === overlay) overlay.remove();
        };
      }

      function showBookmarks() {
        const overlay = h('div', { className: 'modal-overlay show' });
        const modal = h('div', { className: 'modal' });
        const modalHeader = h('div', { className: 'modal-header' });
        modalHeader.appendChild(h('div', { className: 'modal-title' }, '★ Bookmarked Cards'));
        const closeBtn = h('button', { className: 'modal-close', onclick: () => overlay.remove() }, '✕');
        modalHeader.appendChild(closeBtn);
        modal.appendChild(modalHeader);
        const modalBody = h('div', { className: 'modal-body' });
        
        if (!store.bookmarks || store.bookmarks.length === 0) {
          modalBody.appendChild(h('div', { className: 'empty' }, 'No bookmarked cards yet'));
        } else {
          const bookmarkList = store.bookmarks
            .map(cardId => store.cards[cardId])
            .filter(card => card) // Filter out deleted cards
            .map(card => {
              const cardItem = h('div', { 
                style: 'padding: var(--space-lg); border: 1px solid var(--border); margin-bottom: var(--space-md); cursor: pointer;',
                onclick: () => {
                  overlay.remove();
                  goTo('read', { cardId: card.id });
                }
              });
              
              const cardHeader = h('div', { style: 'display: flex; justify-content: space-between; align-items: center;' });
              cardHeader.appendChild(h('div', { style: 'font-weight: 700;' }, card.title || '(Untitled)'));
              
              const unbookmarkBtn = h('button', {
                className: 'btn btn-danger',
                style: 'font-size: var(--text-sm);',
                onclick: (e) => {
                  e.stopPropagation();
                  toggleBookmark(card.id);
                  overlay.remove();
                  showBookmarks();
                }
              }, 'Remove');
              cardHeader.appendChild(unbookmarkBtn);
              cardItem.appendChild(cardHeader);
              
              if (card.body) {
                const preview = card.body.substring(0, 100) + (card.body.length > 100 ? '...' : '');
                cardItem.appendChild(h('div', { style: 'color: var(--text-muted); font-size: var(--text-sm); margin-top: var(--space-sm);' }, preview));
              }
              
              return cardItem;
            });
          
          bookmarkList.forEach(item => modalBody.appendChild(item));
        }
        
        modal.appendChild(modalBody);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
      }

      function showRecentCards() {
        const overlay = h('div', { className: 'modal-overlay show' });
        const modal = h('div', { className: 'modal' });
        const modalHeader = h('div', { className: 'modal-header' });
        modalHeader.appendChild(h('div', { className: 'modal-title' }, 'Recent Cards'));
        const closeBtn = h('button', { className: 'modal-close', onclick: () => overlay.remove() }, '✕');
        modalHeader.appendChild(closeBtn);
        modal.appendChild(modalHeader);
        const modalBody = h('div', { className: 'modal-body' });
        
        if (!store.recentCards || store.recentCards.length === 0) {
          modalBody.appendChild(h('div', { className: 'empty' }, 'No recently viewed cards'));
        } else {
          const recentList = store.recentCards
            .map(cardId => store.cards[cardId])
            .filter(card => card) // Filter out deleted cards
            .map((card, index) => {
              const cardItem = h('div', { 
                style: 'padding: var(--space-lg); border: 1px solid var(--border); margin-bottom: var(--space-md); cursor: pointer;',
                onclick: () => {
                  overlay.remove();
                  goTo('read', { cardId: card.id });
                }
              });
              
              const cardHeader = h('div', { style: 'display: flex; justify-content: space-between; align-items: center;' });
              cardHeader.appendChild(h('div', { style: 'font-weight: 700;' }, `${index + 1}. ${card.title || '(Untitled)'}`));
              cardItem.appendChild(cardHeader);
              
              if (card.body) {
                const preview = card.body.substring(0, 100) + (card.body.length > 100 ? '...' : '');
                cardItem.appendChild(h('div', { style: 'color: var(--text-muted); font-size: var(--text-sm); margin-top: var(--space-sm);' }, preview));
              }
              
              return cardItem;
            });
          
          recentList.forEach(item => modalBody.appendChild(item));
        }
        
        modal.appendChild(modalBody);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
      }

      function openUploadModalForCard(cardId, tabName) {
        // 1. Update all the select dropdowns
        updateImportLocationOptions();
        
        // 2. Set the value for the TXT dropdown to this cardId
        if (uploadModal.importLocationSelectTXT) {
          uploadModal.importLocationSelectTXT.value = cardId;
        }
        
        // 3. Set the correct radio button for TXT import (append)
        const txtAppendRadio = document.querySelector('input[name="txtImportMode"][value="append"]');
        if (txtAppendRadio) txtAppendRadio.checked = true;

        // 4. Switch to the correct tab
        uploadModal.tabs.forEach(t => t.classList.remove('active'));
        uploadModal.tabContents.forEach(content => content.classList.remove('active'));
        
        const tabEl = document.querySelector(`.modal-tab[data-tab="${tabName}"]`);
        const contentEl = document.getElementById(`tab-${tabName}`);
        
        if (tabEl) tabEl.classList.add('active');
        if (contentEl) contentEl.classList.add('active');
        
        // 5. Show the modal
        uploadModal.overlay.classList.add('show');
      }

      function updateImportLocationOptions() {
        const selectJSON = uploadModal.importLocationSelectJSON;
        const selectTXT = uploadModal.importLocationSelectTXT;
        const sortedCards = Object.values(store.cards).sort((a, b) => {
          const A = (a.title || '').toLowerCase();
          const B = (b.title || '').toLowerCase();
          return A.localeCompare(B);
        });
        if (selectJSON) {
          selectJSON.innerHTML = '<option value="root">Add as Root Cards</option>';
          sortedCards.forEach(card => {
            const option = document.createElement('option');
            option.value = card.id;
            option.textContent = `Add as children of: ${card.title || '(Untitled)'}`;
            selectJSON.appendChild(option);
          });
        }
        if (selectTXT) {
          // Compromise text to work for both radio options
          selectTXT.innerHTML = '<option value="root">Add as Root Cards (Outline Mode)</option>';
          sortedCards.forEach(card => {
            const option = document.createElement('option');
            option.value = card.id;
            option.textContent = `Append to / Add children of: ${card.title || '(Untitled)'}`;
            selectTXT.appendChild(option);
          });
        }
      }

      function extractTags(body) {
        if (!body) return [];
        const matches = body.match(/#\w+/g);
        return matches ? matches.slice(0, 5) : [];
      }

      /**
       * Parse [[Card Name]] tokens from text
       * @param {string} text - Text to parse
       * @returns {Array<{match: string, cardName: string, startIndex: number, endIndex: number}>} Array of token matches
       */
      function parseCardLinks(text) {
        if (!text) return [];
        
        const regex = /\[\[([^\]]+)\]\]/g;
        const matches = [];
        let match;
        
        while ((match = regex.exec(text)) !== null) {
          matches.push({
            match: match[0],           // Full match: [[Card Name]]
            cardName: match[1].trim(), // Extracted card name
            startIndex: match.index,
            endIndex: match.index + match[0].length
          });
        }
        
        return matches;
      }

      /**
       * Normalize card name for comparison
       * @param {string} name - Card name to normalize
       * @returns {string} Normalized name (lowercase, trimmed, spaces normalized)
       */
      function normalizeCardName(name) {
        if (!name) return '';
        return name.toLowerCase().trim().replace(/\s+/g, ' ');
      }

      /**
       * Check if a card link token exists in text
       * @param {string} text - Text to search
       * @param {string} cardName - Card name to look for
       * @returns {boolean} True if card link exists
       */
      function hasCardLink(text, cardName) {
        if (!text || !cardName) return false;
        const links = parseCardLinks(text);
        const normalizedName = normalizeCardName(cardName);
        return links.some(link => normalizeCardName(link.cardName) === normalizedName);
      }

      /**
       * Find card ID by normalized name
       * @param {string} cardName - Card name to search for
       * @returns {string|null} Card ID if found, null otherwise
       */
      function findCardByName(cardName) {
        if (!cardName) return null;
        
        const normalizedSearch = normalizeCardName(cardName);
        
        for (const [id, card] of Object.entries(store.cards)) {
          if (normalizeCardName(card.title) === normalizedSearch) {
            return id;
          }
        }
        
        return null;
      }

      /**
       * Find all cards matching a name pattern
       * @param {string} cardName - Card name pattern to search for
       * @param {boolean} exactMatch - If true, requires exact match; if false, allows partial matches
       * @returns {Array<{id: string, title: string, similarity: number}>} Array of matching cards
       */
      function findCardsByName(cardName, exactMatch = true) {
        if (!cardName) return [];
        
        const normalizedSearch = normalizeCardName(cardName);
        const results = [];
        
        for (const [id, card] of Object.entries(store.cards)) {
          const normalizedTitle = normalizeCardName(card.title);
          
          if (exactMatch) {
            if (normalizedTitle === normalizedSearch) {
              results.push({
                id,
                title: card.title,
                similarity: 1.0
              });
            }
          } else {
            // Partial match - check if search term is contained
            if (normalizedTitle.includes(normalizedSearch)) {
              // Calculate simple similarity score (capped at 1.0)
              const similarity = Math.min(normalizedSearch.length, normalizedTitle.length) / Math.max(normalizedSearch.length, normalizedTitle.length);
              results.push({
                id,
                title: card.title,
                similarity
              });
            }
          }
        }
        
        // Sort by similarity (exact matches first, then by similarity score)
        results.sort((a, b) => b.similarity - a.similarity);
        
        return results;
      }

      /**
       * Resolve all card links in text to card IDs
       * @param {string} text - Text containing [[Card Name]] links
       * @returns {Array<{link: object, cardId: string|null}>} Array of links with resolved IDs
       */
      function resolveCardLinks(text) {
        const links = parseCardLinks(text);
        
        return links.map(link => ({
          link,
          cardId: findCardByName(link.cardName)
        }));
      }

      /**
       * Get all tags for a card
       * @param {string} cardId - Card ID
       * @returns {string[]} Array of tags
       */
      function getTags(cardId) {
        const card = store.cards[cardId];
        if (!card) return [];
        return card.tags || [];
      }

      /**
       * Add a tag to a card
       * @param {string} cardId - Card ID
       * @param {string} tag - Tag to add
       * @param {boolean} skipSave - Skip saving to localStorage
       * @returns {boolean} True if tag was added, false otherwise
       */
      function addTag(cardId, tag, skipSave = false) {
        const card = store.cards[cardId];
        if (!card) return false;
        
        // Normalize tag (remove # if present, lowercase)
        const normalizedTag = tag.replace(/^#/, '').toLowerCase().trim();
        if (!normalizedTag) return false;
        
        // Initialize tags array if not present
        if (!card.tags) card.tags = [];
        
        // Check if tag already exists (case-insensitive)
        if (card.tags.some(t => t.toLowerCase() === normalizedTag)) {
          return false;
        }
        
        // Add the tag
        card.tags.push(normalizedTag);
        card.updatedAt = Date.now();
        
        if (!skipSave) save();
        
        return true;
      }

      /**
       * Remove a tag from a card
       * @param {string} cardId - Card ID
       * @param {string} tag - Tag to remove
       * @param {boolean} skipSave - Skip saving to localStorage
       * @returns {boolean} True if tag was removed, false otherwise
       */
      function removeTag(cardId, tag, skipSave = false) {
        const card = store.cards[cardId];
        if (!card || !card.tags) return false;
        
        // Normalize tag (remove # if present, lowercase)
        const normalizedTag = tag.replace(/^#/, '').toLowerCase().trim();
        
        // Find and remove the tag (case-insensitive)
        const initialLength = card.tags.length;
        card.tags = card.tags.filter(t => t.toLowerCase() !== normalizedTag);
        
        // Check if anything was removed
        if (card.tags.length === initialLength) {
          return false;
        }
        
        card.updatedAt = Date.now();
        
        if (!skipSave) save();
        
        return true;
      }

      /**
       * Set all tags for a card (replaces existing tags)
       * @param {string} cardId - Card ID
       * @param {string[]} tags - Array of tags to set
       * @param {boolean} skipSave - Skip saving to localStorage
       * @returns {boolean} True if tags were set successfully
       */
      function setTags(cardId, tags, skipSave = false) {
        const card = store.cards[cardId];
        if (!card) return false;
        
        // Normalize all tags
        const normalizedTags = tags
          .map(tag => tag.replace(/^#/, '').toLowerCase().trim())
          .filter(tag => tag.length > 0);
        
        // Remove duplicates
        card.tags = [...new Set(normalizedTags)];
        card.updatedAt = Date.now();
        
        if (!skipSave) save();
        
        return true;
      }

      /**
       * Get all unique tags across all cards
       * @returns {string[]} Array of all unique tags
       */
      function getAllTags() {
        const allTags = new Set();
        Object.values(store.cards).forEach(card => {
          if (card.tags) {
            card.tags.forEach(tag => allTags.add(tag));
          }
        });
        return Array.from(allTags).sort();
      }

      /**
       * Create interactive tag editor with chips
       */
      function createTagEditor(initialTags, datalistId) {
        const normalized = Array.from(new Set(normalizeTagInput(initialTags.join(' '))));
        const tagSet = new Set(normalized);
        const wrapper = h('div', { className: 'tag-editor', role: 'list', 'aria-label': 'Tag editor' });
        const input = h('input', {
          type: 'text',
          className: 'tag-editor-input',
          list: datalistId,
          placeholder: 'Add tags...',
          'aria-label': 'Add tag'
        });

        function renderChips() {
          wrapper.querySelectorAll('.tag-chip').forEach(c => c.remove());
          tagSet.forEach(tag => {
            const chip = h('span', { className: 'tag-chip', role: 'listitem' },
              h('span', { className: 'tag-chip-text' }, tag),
              h('button', {
                type: 'button',
                className: 'tag-chip-remove',
                'aria-label': `Remove tag ${tag}`,
                onclick: (e) => {
                  e.stopPropagation();
                  tagSet.delete(tag);
                  renderChips();
                }
              }, '×')
            );
            wrapper.insertBefore(chip, input);
          });
        }

        function addTagsFromInput(val) {
          const tags = normalizeTagInput(val);
          tags.forEach(t => tagSet.add(t));
          renderChips();
          input.value = '';
        }

        input.addEventListener('keydown', (e) => {
          if (['Enter', 'Tab', ',', ' '].includes(e.key)) {
            addTagsFromInput(input.value);
            if (e.key !== 'Tab') e.preventDefault();
          } else if (e.key === 'Backspace' && !input.value && tagSet.size) {
            const last = Array.from(tagSet).pop();
            tagSet.delete(last);
            renderChips();
          }
        });
        input.addEventListener('blur', () => addTagsFromInput(input.value));

        renderChips();
        wrapper.appendChild(input);
        wrapper.getTags = () => Array.from(tagSet);
        wrapper.focusInput = () => input.focus();
        return wrapper;
      }
      /**
       * Get all cards that link to a specific card (backlinks)
       * @param {string} cardId - Card ID to find backlinks for
       * @returns {Array<{id: string, title: string}>} Array of cards that link to this card
       */
      function getBacklinks(cardId) {
        if (!cardId) return [];
        
        const card = store.cards[cardId];
        if (!card) return [];
        
        const cardTitle = card.title;
        if (!cardTitle) return [];
        
        const backlinks = [];
        
        // Search through all cards for [[Card Title]] references
        for (const [id, otherCard] of Object.entries(store.cards)) {
          if (id === cardId) continue; // Skip self-references
          
          if (otherCard.body && hasCardLink(otherCard.body, cardTitle)) {
            backlinks.push({
              id: otherCard.id,
              title: otherCard.title || '(Untitled)',
              body: otherCard.body
            });
          }
        }
        
        return backlinks;
      }

      /**
       * Get related cards based on shared tags
       * @param {string} cardId - Card ID to find related cards for
       * @param {number} limit - Maximum number of results (default: 10)
       * @returns {Array<{id: string, title: string, matchScore: number, matchedTags: string[]}>}
       */
      function getRelatedCards(cardId, limit = 10) {
        if (!cardId) return [];
        
        const card = store.cards[cardId];
        if (!card) return [];
        
        const cardTags = getTags(cardId);
        if (cardTags.length === 0) return [];
        
        const related = [];
        
        for (const [id, otherCard] of Object.entries(store.cards)) {
          if (id === cardId) continue; // Skip self
          
          const otherTags = getTags(id);
          const matchedTags = cardTags.filter(tag => otherTags.includes(tag));
          
          if (matchedTags.length > 0) {
            const matchScore = matchedTags.length / Math.max(cardTags.length, otherTags.length);
            related.push({
              id: otherCard.id,
              title: otherCard.title || '(Untitled)',
              matchScore,
              matchedTags
            });
          }
        }
        
        // Sort by match score (highest first)
        related.sort((a, b) => b.matchScore - a.matchScore);
        
        return related.slice(0, limit);
      }


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

import {
  APP_CREATOR, APP_VERSION, APP_RELEASE_DATE, APP_UPDATER,
  store,
  navState,
  dirty, setDirty,
  searchResultsState, setSearchResultsState,
  trashBin
} from './state.js';


      // Source Part 4/5: Rendering, themes, footer, and initialization
      // Concatenated via `npm run build` in lexical order of www/src/*.js
      // =============================================================
      // --- RENDERING ---
      // Functions for rendering UI components and pages
      // =============================================================

      /**
       * Render breadcrumb navigation
       */
      function renderBreadcrumbs() {
        breadcrumbs.innerHTML = '';
        if (navState.page === 'search') {
          breadcrumbs.appendChild(h('span', { className: 'breadcrumb current', 'aria-current': 'page' }, 'Search Results'));
          return;
        }
        if (navState.page === 'edit') {
          breadcrumbs.appendChild(h('span', { className: 'breadcrumb current', 'aria-current': 'page' }, navState.cardId ? 'Edit Card' : 'New Card'));
          return;
        }
        let current = navState.cardId;
        const path = [];
        while (current) {
          const c = store.cards[current];
          if (!c) break;
          path.unshift(c);
          current = c.parentId;
        }
        if (path.length === 0) {
          breadcrumbs.appendChild(h('span', { className: 'breadcrumb current', 'aria-current': 'page' }, 'All Cards'));
        } else {
          const home = h('button', { className: 'breadcrumb', onclick: () => goTo('list', { cardId: null }), 'aria-label': 'Go to All Cards' }, 'All Cards');
          breadcrumbs.appendChild(home);
          path.forEach((c, i) => {
            const isCurrent = (i === path.length - 1 && navState.page === 'list');
            const cls = isCurrent ? 'breadcrumb current' : 'breadcrumb';
            const chip = isCurrent 
              ? h('span', { className: cls, 'aria-current': 'page' }, c.title || '(Untitled)')
              : h('button', { className: cls, onclick: () => goTo('list', { cardId: c.id }), 'aria-label': 'Go to ' + (c.title || 'Untitled') }, c.title || '(Untitled)');
            breadcrumbs.appendChild(chip);
          });
        }
      }

      /**
       * Render the list of cards (root level or children)
       */
      function renderCardList() {
        const parentId = navState.cardId;
        let kids = [];
        if (!parentId) {
          kids = store.rootOrder.map(id => store.cards[id]).filter(c => c);
        } else {
          const parent = store.cards[parentId];
          if (!parent) {
            main.appendChild(h('div', { className: 'empty' }, 'Card not found.'));
            return;
          }
          kids = parent.children.map(id => store.cards[id]).filter(c => c);
        }
        searchContainer.style.display = 'block';
        const title = parentId ? (store.cards[parentId]?.title || 'Card') : 'Top Level Cards';
        main.appendChild(h('div', { className: 'page-title' }, title));
        
        kids.sort((a, b) => (a.title || '').toLowerCase().localeCompare((b.title || '').toLowerCase()));
        
        if (kids.length === 0) {
          main.appendChild(h('div', { className: 'empty' }, 'No cards yet. Create one to get started!'));
        } else {
          const gridViewEnabled = localStorage.getItem('cardspoke_gridView') === 'true';
          const gridClass = gridViewEnabled ? 'card-grid grid-view' : 'card-grid';
          const grid = h('div', { className: gridClass, role: 'list' });
          let renderIndex = 0;
          const batchSize = 60;
          const renderBatch = () => {
            const frag = document.createDocumentFragment();
            const start = renderIndex;
            for (let i = start; i < Math.min(start + batchSize, kids.length); i++) {
              const card = kids[i];
              const cardEl = renderCardTile(card, { lazyBody: true });
              frag.appendChild(cardEl);
            }
            grid.appendChild(frag);
            renderIndex += batchSize;
          };
          const onScroll = () => {
            if (renderIndex >= kids.length) return;
            const threshold = grid.offsetTop + grid.offsetHeight - window.innerHeight * 2;
            if (window.scrollY + window.innerHeight > threshold) {
              requestAnimationFrame(renderBatch);
            }
          };
          renderBatch();
          window.addEventListener('scroll', onScroll, { passive: true });
          registerRenderCleanup(() => window.removeEventListener('scroll', onScroll));
          main.appendChild(grid);
        }
      }

      /**
       * Render a single card tile in list view
       * @param {Object} card - Card to render
       * @returns {HTMLElement} Card tile element
       */
      function renderCardTile(card, opts = {}) {
        // Check ComponentRegistry for a custom Card component
        if (window.CardSpoke && window.CardSpoke.ComponentRegistry) {
          const CustomCard = window.CardSpoke.ComponentRegistry.get('Card');
          if (CustomCard && typeof CustomCard.render === 'function') {
            try {
              const isSelected = opts.isSelected || false;
              const customEl = CustomCard.render({ card: card, isSelected: isSelected, opts: opts, onSelect: function() { goTo('read', { cardId: card.id }); } });
              if (customEl instanceof HTMLElement) {
                customEl.dataset.cardId = card.id;
                customEl.dataset.renderType = 'list';
                return customEl;
              }
            } catch (err) {
              console.warn('[ComponentRegistry] Custom Card render failed, using default:', err);
            }
          }
        }

        const isCompact = store.viewMode === 'compact';
        const cardClasses = isCompact ? 'card card-compact' : 'card';
        const cardEl = h('button', { className: cardClasses + ' card-tile', onclick: () => goTo('read', { cardId: card.id }), 'aria-label': 'Open card: ' + (card.title || 'Untitled'), role: 'listitem' });
        cardEl.dataset.cardId = card.id;
        cardEl.dataset.renderType = 'list';

        // Left side content
        const contentEl = h('div', { className: 'card-content' });
        
        // Add bookmark indicator if bookmarked
        const titleWrapper = h('div', { style: 'display: flex; align-items: center; gap: 8px;' });
        if (isBookmarked(card.id)) {
          titleWrapper.appendChild(h('span', { 
            style: 'color: gold; font-size: 18px;',
            title: 'Bookmarked'
          }, '★'));
        }
        const titleContent = opts.highlightQuery ? highlightText(card.title || '(Untitled)', opts.highlightQuery) : document.createTextNode(card.title || '(Untitled)');
        const titleDiv = h('div', { className: 'card-title' });
        titleDiv.appendChild(titleContent);
        titleWrapper.appendChild(titleDiv);
        contentEl.appendChild(titleWrapper);

        if (card.body && !isCompact) {
          const previewText = card.body.substring(0, 140) + (card.body.length > 140 ? '...' : '');
          const desc = h('div', { className: 'card-description' });
          if (opts.highlightQuery) {
            desc.appendChild(highlightText(previewText, opts.highlightQuery));
          } else if (opts.lazyBody) {
            desc.dataset.preview = previewText;
          } else {
            desc.textContent = previewText;
          }
          contentEl.appendChild(desc);
        }
        
        const tags = (card.tags && card.tags.length ? card.tags : extractTags(card.body));
        if (tags.length > 0 && !isCompact) {
          const tagsEl = h('div', { className: 'card-tags' });
          tags.forEach(tag => {
            tagsEl.appendChild(h('span', { className: 'card-tag' }, tag));
          });
          contentEl.appendChild(tagsEl);
        }
        
        cardEl.appendChild(contentEl);

        // Right side count
        if (card.children && card.children.length > 0) {
          cardEl.appendChild(h('div', { className: 'card-count' }, String(card.children.length)));
        }

        if (opts.lazyBody) {
          if (!previewObserver) {
            previewObserver = new IntersectionObserver(entries => {
              entries.forEach(entry => {
                if (entry.isIntersecting) {
                  const previewEl = entry.target.querySelector('.card-description[data-preview]');
                  if (previewEl && previewEl.dataset.preview) {
                    previewEl.textContent = previewEl.dataset.preview;
                    delete previewEl.dataset.preview;
                  }
                  previewObserver.unobserve(entry.target);
                }
              });
            }, { rootMargin: '200px' });
          }
          previewObserver.observe(cardEl);
        }

        // Fire card.render middleware for plugins (Task 1.1)
        if (window.CardSpoke && window.CardSpoke.Middleware) {
          window.CardSpoke.Middleware.run('card.render', [card, cardEl])
            .catch(err => console.error('[Middleware] card.render error:', err));
        }

        return cardEl;
      }

      /**
       * Render card body text with clickable card links
       * Converts [[Card Name]] to clickable links
       * @param {string} text - Card body text
       * @returns {HTMLElement} Div element with rendered content
       */
      function renderCardBody(text) {
        const container = h('div', { className: 'card-detail-body' });

        if (!text) return container;
        
        const links = parseCardLinks(text);
        
        if (links.length === 0) {
          // No links, just return plain text
          container.textContent = text;
          return container;
        }
        
        // Sort links by start index to process in order
        links.sort((a, b) => a.startIndex - b.startIndex);
        
        let lastIndex = 0;
        
        links.forEach(link => {
          // Add text before the link
          if (link.startIndex > lastIndex) {
            const textBefore = text.substring(lastIndex, link.startIndex);
            container.appendChild(document.createTextNode(textBefore));
          }
          
          // Find the card ID
          const cardId = findCardByName(link.cardName);
          
          // Create clickable link
          const linkEl = h('span', { 
            className: cardId ? 'card-link' : 'card-link-missing',
            style: 'cursor: pointer;',
            title: cardId ? `Go to: ${link.cardName}` : `Card not found: ${link.cardName} (click to create)`
          }, link.cardName);
          
          // Add click handler
          linkEl.addEventListener('click', (e) => {
            e.stopPropagation();
            if (cardId) {
              // Card exists, navigate to it
              goTo('read', { cardId });
            } else {
              // Card doesn't exist, offer to create it
              if (confirm(`Card "${link.cardName}" doesn't exist. Create it?`)) {
                const newId = createCard(link.cardName, '', null);
                goTo('edit', { cardId: newId });
              }
            }
          });
          
          container.appendChild(linkEl);
          lastIndex = link.endIndex;
        });
        
        // Add remaining text after the last link
        if (lastIndex < text.length) {
          const textAfter = text.substring(lastIndex);
          container.appendChild(document.createTextNode(textAfter));
        }
        
        return container;
      }

      function renderRichTextBody(text) {
        const container = h('div', { className: 'card-detail-body rich-body', role: 'article' });
        if (!text) return container;
        const lines = text.split(/\n/);
        let listEl = null;
        lines.forEach(line => {
          if (/^#{1,3} /.test(line)) {
            if (listEl) { container.appendChild(listEl); listEl = null; }
            const level = line.match(/^#+/)[0].length;
            const title = line.replace(/^#{1,3} /, '');
            const header = h(`h${level}`, {}, title);
            container.appendChild(header);
            return;
          }
          if (/^-\s+/.test(line)) {
            if (!listEl) listEl = document.createElement('ul');
            const li = document.createElement('li');
            li.textContent = line.replace(/^-\s+/, '');
            listEl.appendChild(li);
            return;
          }
          if (listEl) { container.appendChild(listEl); listEl = null; }
          const para = document.createElement('p');
          let html = escapeHtml(line)
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/_(.+?)_/g, '<em>$1</em>');
          para.innerHTML = html;
          container.appendChild(para);
        });
        if (listEl) container.appendChild(listEl);
        return container;
      }

      /**
       * Render a card in read-only/detail view
       */
      function renderReadOnlyCard() {
        searchContainer.style.display = 'none';
        const card = store.cards[navState.cardId];
        if (!card) {
          main.appendChild(h('div', { className: 'empty' }, 'Card not found.'));
          return;
        }
        const detail = h('div', { className: 'card-detail' });
        detail.appendChild(h('div', { className: 'card-detail-title' }, card.title || '(Untitled)'));
        if (card.body) {
          // Check global Rich Text setting OR per-card setting
          const globalRichText = localStorage.getItem('cardspoke_richtext') === 'true';
          const useRichText = globalRichText || card.isRichText;
          detail.appendChild(useRichText ? renderRichTextBody(card.body) : renderCardBody(card.body));
        }
        // Tags display
        const _tags = (card.tags && card.tags.length ? card.tags : extractTags(card.body));
        if (_tags.length) {
          const tagsWrap = h('div', { className: 'card-tags' });
          _tags.forEach(t => tagsWrap.appendChild(h('span', { className: 'card-tag' }, t)));
          detail.appendChild(tagsWrap);
        }
        const actions = h('div', { className: 'card-detail-actions' });
        actions.appendChild(h('button', { className: 'btn btn-primary', onclick: () => goTo('edit', { cardId: card.id }) }, 'Edit'));
        
        // Bookmark button
        const bookmarkBtnText = isBookmarked(card.id) ? '★ Unbookmark' : '☆ Bookmark';
        actions.appendChild(h('button', { 
          className: 'btn', 
          onclick: (e) => {
            e.stopPropagation();
            toggleBookmark(card.id);
          }
        }, bookmarkBtnText));
        
        // Duplicate button with dropdown-like behavior
        actions.appendChild(h('button', {
          className: 'btn',
          onclick: () => {
            const choice = confirm('Duplicate with children?\n\nOK = Yes (with children)\nCancel = No (only this card)');
            const newId = duplicateCard(card.id, choice);
            if (newId) {
              showToast('Card duplicated successfully');
              goTo('read', { cardId: newId });
            }
          }
        }, 'Duplicate'));

        // Share button (v1.0.0)
        actions.appendChild(h('button', {
          className: 'btn',
          onclick: () => showShareCard(card.id)
        }, 'Share'));

        actions.appendChild(h('button', { className: 'btn', onclick: () => {
          const newId = createCard('', '', card.id);
          goTo('edit', { cardId: newId });
        } }, 'Add Child'));
        
        actions.appendChild(h('button', { className: 'btn', onclick: () => openUploadModalForCard(card.id, 'txt') }, 'Import TXT'));
        
        actions.appendChild(h('button', { className: 'btn btn-danger', onclick: () => {
          if (confirm('Delete this card and all its children?')) {
            deleteCard(card.id);
            goTo('list', { cardId: card.parentId });
          }
        } }, 'Delete'));
        detail.appendChild(actions);
        if (card.children && card.children.length > 0) {
          const childrenSection = h('div', { className: 'children-section' });
          childrenSection.appendChild(h('div', { className: 'children-title' }, `Children (${card.children.length})`));
          const childrenGrid = h('div', { className: 'card-grid' });
          card.children.forEach(cid => {
            const childCard = store.cards[cid];
            if (childCard) {
              const childEl = renderCardTile(childCard);
              childrenGrid.appendChild(childEl);
            }
          });
          childrenSection.appendChild(childrenGrid);
          detail.appendChild(childrenSection);
        }
        // Backlinks section
        const backlinks = getBacklinks(card.id);
        if (backlinks.length > 0) {
          const backlinksSection = h('div', { className: 'backlinks-section' });
          backlinksSection.appendChild(h('div', { className: 'section-title' }, `← Referenced By (${backlinks.length})`));
          const backlinksGrid = h('div', { className: 'card-grid' });
          backlinks.forEach(backlink => {
            const backlinkTile = h('div', { 
              className: 'card-tile', 
              onclick: () => goTo('read', { cardId: backlink.id }) 
            });
            backlinkTile.appendChild(h('div', { className: 'card-tile-title' }, backlink.title));
            backlinksGrid.appendChild(backlinkTile);
          });
          backlinksSection.appendChild(backlinksGrid);
          detail.appendChild(backlinksSection);
        }
        
        // Related cards section (based on tags)
        const relatedCards = getRelatedCards(card.id, 5);
        if (relatedCards.length > 0) {
          const relatedSection = h('div', { className: 'related-section' });
          relatedSection.appendChild(h('div', { className: 'section-title' }, `Related Cards (${relatedCards.length})`));
          const relatedGrid = h('div', { className: 'card-grid' });
          relatedCards.forEach(related => {
            const relatedTile = h('div', { 
              className: 'card-tile', 
              onclick: () => goTo('read', { cardId: related.id }) 
            });
            const titleDiv = h('div', { className: 'card-tile-title' }, related.title);
            relatedTile.appendChild(titleDiv);
            // Show matched tags
            const tagsDiv = h('div', { className: 'card-tags' });
            related.matchedTags.forEach(tag => {
              tagsDiv.appendChild(h('span', { className: 'card-tag' }, tag));
            });
            relatedTile.appendChild(tagsDiv);
            relatedGrid.appendChild(relatedTile);
          });
          relatedSection.appendChild(relatedGrid);
          detail.appendChild(relatedSection);
        }
        main.appendChild(detail);
      }

      /**
       * Render card edit form
       */
      function renderEditCard() {
        searchContainer.style.display = 'none';
        const editing = !!navState.cardId;
        const card = editing ? store.cards[navState.cardId] : {
          id: null,
          title: '',
          body: '',
          parentId: navState.parentId,
          children: []
        };
        if (editing && !card) {
          main.appendChild(h('div', { className: 'empty' }, 'Card not found.'));
          return;
        }
        const form = h('form', {
          onsubmit: (e) => {
            e.preventDefault();
            const titleVal = form.querySelector('#cardTitle').value.trim();
            const bodyVal = form.querySelector('#cardBody').value.trim();
            const parentVal = form.querySelector('#cardParent').value || null;
            const tagsVal = (tagEditor.getTags && tagEditor.getTags()) || [];
            if (editing) {
              const oldParentId = card.parentId;
              if (oldParentId !== parentVal) {
                if (oldParentId) {
                  const oldParent = store.cards[oldParentId];
                  if (oldParent) oldParent.children = oldParent.children.filter(c => c !== card.id);
                } else {
                  store.rootOrder = store.rootOrder.filter(c => c !== card.id);
                }
                if (parentVal) {
                  const newParent = store.cards[parentVal];
                  if (newParent && !newParent.children.includes(card.id)) newParent.children.push(card.id);
                } else {
                  if (!store.rootOrder.includes(card.id)) store.rootOrder.push(card.id);
                }
                card.parentId = parentVal;
              }
              updateCard(card.id, { title: titleVal, body: bodyVal, tags: tagsVal, isRichText: richToggle.checked }, true, true);
              card.children.forEach(cid => {
                const inp = childrenInpMap[cid];
                if (inp) updateCard(cid, { title: inp.value.trim() }, true, true);
              });
              const newKidRows = form.querySelectorAll('#addChildList .form-child-row input');
              newKidRows.forEach(inp => {
                const t = inp.value.trim();
                if (t) createCard(t, '', card.id, true, true);
              });
              save();
              goTo('read', { cardId: card.id });
            } else {
              const newId = createCard(titleVal, bodyVal, parentVal, true, true);
              store.cards[newId].isRichText = richToggle.checked;
              const newKidRows = form.querySelectorAll('#addChildList .form-child-row input');
              newKidRows.forEach(inp => {
                const t = inp.value.trim();
                if (t) createCard(t, '', newId, true, true);
              });
              save();
              goTo('read', { cardId: newId });
            }
          }
        });
        const formGroup1 = h('div', { className: 'form-group' });
        formGroup1.appendChild(h('label', { className: 'form-label' }, 'Title'));
        formGroup1.appendChild(h('input', { type: 'text', id: 'cardTitle', className: 'form-input', value: card.title, oninput: () => { setDirty(true); } }));
        form.appendChild(formGroup1);
        const formGroup2 = h('div', { className: 'form-group' });
        const bodyLabelRow = h('div', { style: 'display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-sm);' });
        bodyLabelRow.appendChild(h('label', { className: 'form-label', style: 'margin-bottom: 0;' }, 'Body'));
        
        // Add upload button for importing text from files (v0.12.3)
        const importBodyBtn = h('button', {
          type: 'button',
          className: 'btn',
          style: 'font-size: var(--text-sm);',
          onclick: function() {
            const fileInput = h('input', { type: 'file', accept: '.txt,.md,.text', style: 'display: none' });
            fileInput.onchange = function(e) {
              const file = e.target.files[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = function(ev) {
                  const currentBody = document.getElementById('cardBody');
                  if (currentBody.value && !confirm('Replace existing content?')) {
                    currentBody.value += '\n\n' + ev.target.result;
                  } else {
                    currentBody.value = ev.target.result;
                  }
                  setDirty(true);
                  showToast('Content imported from ' + file.name);
                };
                reader.onerror = function() {
                  showToast('Failed to read file', 'error');
                };
                reader.readAsText(file);
              }
            };
            fileInput.click();
          }
        }, 'Import from File');
        bodyLabelRow.appendChild(importBodyBtn);
        formGroup2.appendChild(bodyLabelRow);
        
        const richToggleRow = h('div', { className: 'form-row' });
        const richToggle = h('input', { type: 'checkbox', id: 'cardRich', checked: card.isRichText });
        const richLabel = h('label', { for: 'cardRich', style: 'margin-left: 6px;' }, 'Enable formatting (Markdown)');
        richToggle.addEventListener('change', () => { setDirty(true); });
        richToggleRow.appendChild(richToggle);
        richToggleRow.appendChild(richLabel);
        formGroup2.appendChild(richToggleRow);

        const bodyTextarea = h('textarea', { id: 'cardBody', className: 'form-textarea', 'aria-label': 'Card body' });
        bodyTextarea.value = card.body;
        bodyTextarea.addEventListener('input', () => { setDirty(true); });

        const toolbar = h('div', { className: 'rich-toolbar', role: 'toolbar', 'aria-label': 'Formatting toolbar' });
        const applyWrap = (before, after = before) => {
          const start = bodyTextarea.selectionStart;
          const end = bodyTextarea.selectionEnd;
          const selected = bodyTextarea.value.substring(start, end) || 'text';
          const newValue = bodyTextarea.value.slice(0, start) + before + selected + after + bodyTextarea.value.slice(end);
          bodyTextarea.value = newValue;
          bodyTextarea.focus();
          bodyTextarea.selectionStart = start + before.length;
          bodyTextarea.selectionEnd = start + before.length + selected.length;
          setDirty(true);
        };
        const addBlockPrefix = (prefix) => {
          const cursor = bodyTextarea.selectionStart;
          const value = bodyTextarea.value;
          const before = value.slice(0, cursor);
          const after = value.slice(cursor);
          const newText = before + `\n${prefix}`;
          bodyTextarea.value = newText + after;
          bodyTextarea.focus();
          setDirty(true);
        };
        const buttons = [
          { label: 'B', action: () => applyWrap('**', '**'), aria: 'Bold' },
          { label: 'I', action: () => applyWrap('_', '_'), aria: 'Italic' },
          { label: 'H1', action: () => addBlockPrefix('# '), aria: 'Heading 1' },
          { label: 'H2', action: () => addBlockPrefix('## '), aria: 'Heading 2' },
          { label: 'H3', action: () => addBlockPrefix('### '), aria: 'Heading 3' },
          { label: '• List', action: () => addBlockPrefix('- '), aria: 'Bullet list' }
        ];
        buttons.forEach(btn => {
          const el = h('button', { type: 'button', className: 'btn btn-ghost', 'aria-label': btn.aria, onclick: btn.action });
          el.textContent = btn.label;
          toolbar.appendChild(el);
        });

        formGroup2.appendChild(toolbar);
        formGroup2.appendChild(bodyTextarea);
        form.appendChild(formGroup2);
        // Tags input with autocomplete
        const formGroupTags = h('div', { className: 'form-group' });
        formGroupTags.appendChild(h('label', { className: 'form-label' }, 'Tags (comma-separated)'));
        
        // Create datalist with all existing tags for autocomplete
        const tagsDatalistId = 'tags-datalist-' + Date.now();
        const tagsDatalist = h('datalist', { id: tagsDatalistId });
        const existingTags = getAllTags();
        existingTags.forEach(tag => {
          tagsDatalist.appendChild(h('option', { value: tag }));
        });

        const tagEditor = createTagEditor(card.tags || [], tagsDatalistId);
        tagEditor.addEventListener('focusin', () => { setDirty(true); });

        formGroupTags.appendChild(tagEditor);
        formGroupTags.appendChild(tagsDatalist);
        form.appendChild(formGroupTags);
        
        // Add "Suggest Tags" button
        if (editing && card.id) {
          const suggestBtn = h('button', {
            type: 'button',
            className: 'btn btn-secondary',
            onclick: () => showTagSuggestions(card.id),
            style: 'margin-top: var(--space-sm);'
          }, 'Suggest Tags');
          formGroupTags.appendChild(suggestBtn);
        }
    
        const formGroup3 = h('div', { className: 'form-group' });
        formGroup3.appendChild(h('label', { className: 'form-label' }, 'Parent Card'));
        const parentSel = h('select', { id: 'cardParent', className: 'form-select' });
        const parVal = card.parentId || '';
        parentSel.appendChild(h('option', { value: '', selected: !parVal }, '(Root Level)'));
        Object.values(store.cards)
          .filter(c => c.id !== card.id)
          .sort((a, b) => {
            const A = (a.title || '').toLowerCase();
            const B = (b.title || '').toLowerCase();
            return A.localeCompare(B);
          })
          .forEach(c => {
            parentSel.appendChild(h('option', { value: c.id, selected: parVal === c.id }, c.title || '(Untitled)'));
          });
        parentSel.addEventListener('change', () => { setDirty(true); });
        formGroup3.appendChild(parentSel);
        form.appendChild(formGroup3);
        let childrenInpMap = {};
        if (editing) {
          const formGroup4 = h('div', { className: 'form-group' });
          formGroup4.appendChild(h('label', { className: 'form-label form-section-title' }, 'Children'));
          const kidsWrap = h('div', { className: 'form-children' });
          card.children.forEach(cid => {
            const c = store.cards[cid];
            const row = h('div', { className: 'form-child-row' });
            const chInp = h('input', { type: 'text', value: c.title, className: 'form-input form-child-input' });
            chInp.addEventListener('input', () => { setDirty(true); });
            row.appendChild(chInp);
            const delBtn = h('button', {
              type: 'button',
              className: 'form-child-delete',
              onclick: () => {
                if (confirm('Delete child and all its children?')) {
                  deleteCard(cid);
                  save();
                  render();
                }
              }
            }, '✕');
            row.appendChild(delBtn);
            childrenInpMap[cid] = chInp;
            kidsWrap.appendChild(row);
          });
          formGroup4.appendChild(kidsWrap);
          form.appendChild(formGroup4);
          const formGroup5 = h('div', { className: 'form-group' });
          formGroup5.appendChild(h('label', { className: 'form-label form-section-title' }, 'Add New Children'));
          const newKidsWrap = h('div', { className: 'form-children', id: 'addChildList' });
          const addChildRow = (title = '') => {
            const r = h('div', { className: 'form-child-row' });
            const t = h('input', { type: 'text', value: title, placeholder: 'Child title...', className: 'form-input form-child-input' });
            t.addEventListener('input', () => { setDirty(true); });
            const d = h('button', { type: 'button', className: 'form-child-delete', onclick: () => { r.remove(); } }, '✕');
            r.appendChild(t);
            r.appendChild(d);
            newKidsWrap.appendChild(r);
          };
          addChildRow();
          formGroup5.appendChild(newKidsWrap);
          formGroup5.appendChild(h('button', { type: 'button', className: 'btn', onclick: () => addChildRow() }, '+ Add Another Child'));
          form.appendChild(formGroup5);
        } else {
          const formGroup4 = h('div', { className: 'form-group' });
          formGroup4.appendChild(h('label', { className: 'form-label form-section-title' }, 'Add Children Now (title only)'));
          const kidsWrap = h('div', { className: 'form-children', id: 'addChildList' });
          const addChildRow = (title = '') => {
            const r = h('div', { className: 'form-child-row' });
            const t = h('input', { type: 'text', value: title, placeholder: 'Child title...', className: 'form-input form-child-input' });
            t.addEventListener('input', () => { setDirty(true); });
            const d = h('button', { type: 'button', className: 'form-child-delete', onclick: () => { r.remove(); } }, '✕');
            r.appendChild(t);
            r.appendChild(d);
            kidsWrap.appendChild(r);
          };
          addChildRow();
          formGroup4.appendChild(kidsWrap);
          formGroup4.appendChild(h('button', { type: 'button', className: 'btn', onclick: () => addChildRow() }, '+ Add Another Child'));
          form.appendChild(formGroup4);
        }
        const formActions = h('div', { className: 'form-actions' });
        formActions.appendChild(h('button', { type: 'submit', className: 'btn btn-primary' }, 'Save'));
        formActions.appendChild(h('button', { type: 'button', className: 'btn', onclick: () => editing ? goTo('read', { cardId: card.id }) : goBack() }, 'Cancel'));
        if (editing) {
          formActions.appendChild(h('button', {
            type: 'button',
            className: 'btn btn-danger',
            onclick: () => {
              if (confirm('Delete this card and all children?')) {
                deleteCard(card.id);
                save();
                goTo('list', { cardId: card.parentId ?? null });
              }
            }
          }, 'Delete'));
        }
        form.appendChild(formActions);
        main.appendChild(h('div', { className: 'page-title' }, editing ? 'Edit Card' : 'New Card'));
        main.appendChild(form);
      }

      /**
       * Render search results page
       */
      function renderSearchResults() {
        searchContainer.style.display = 'none';
        const query = navState.searchQuery.trim();
        if (!query) {
          main.appendChild(h('div', { className: 'empty' }, 'Please enter a search term.'));
          return;
        }
        
        // Get selected dataset scope
        const scope = datasetSelector ? datasetSelector.value : 'current';
        
        // Show loading indicator
        main.appendChild(h('div', { className: 'page-title' }, `Search: "${navState.searchQuery}"`));
        const loadingDiv = h('div', { 
          className: 'search-info',
          style: 'padding: 12px; margin-bottom: 12px; background: var(--bg-secondary); border-radius: 8px; font-size: 14px; color: var(--text-secondary);'
        }, 'Searching...');
        main.appendChild(loadingDiv);
        
        // Use multi-dataset fuzzy search for typo-tolerant results
        fuzzySearchMultiDataset(query, scope).then(fuzzyResults => {
          // Remove loading indicator
          loadingDiv.remove();

          // Apply advanced search filters if present
          try {
            const filtersStr = sessionStorage.getItem('searchFilters');
            if (filtersStr) {
              const filters = JSON.parse(filtersStr);
              
              // Filter by tag
              if (filters.tagFilter) {
                const tagFilterLower = filters.tagFilter.toLowerCase();
                fuzzyResults = fuzzyResults.filter(result => {
                  const card = result.card;
                  return card.tags && card.tags.some(tag => tag.toLowerCase() === tagFilterLower);
                });
              }
              
              // Filter by bookmark status
              if (filters.bookmarkOnly) {
                fuzzyResults = fuzzyResults.filter(result => result.card.bookmarked === true);
              }
              
              // Filter by date
              if (filters.dateFilter) {
                const now = Date.now();
                let startTime = 0;
                
                if (filters.dateFilter === 'today') {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  startTime = today.getTime();
                } else if (filters.dateFilter === 'week') {
                  startTime = now - (7 * 24 * 60 * 60 * 1000);
                } else if (filters.dateFilter === 'month') {
                  startTime = now - (30 * 24 * 60 * 60 * 1000);
                }
                
                fuzzyResults = fuzzyResults.filter(result => {
                  const card = result.card;
                  return (card.createdAt && card.createdAt >= startTime) || 
                         (card.updatedAt && card.updatedAt >= startTime);
                });
              }
              
              // Clear filters after use
              sessionStorage.removeItem('searchFilters');
            }
          } catch (err) {
            console.error('Error applying search filters:', err);
          }

          const hookResults = fuzzyResults.map(result => ({
            ...result,
            card: cloneCard(result.card)
          }));

          if (fuzzyResults.length === 0) {
            main.appendChild(h('div', { className: 'empty' }, 'No results found. Try different keywords.'));
          } else {
            // Show result count with fuzzy indicator
            const scopeText = scope === 'all' ? ' across all datasets' : '';
            const resultInfo = h('div', {
              className: 'search-info',
              style: 'padding: 12px; margin-bottom: 8px; background: var(--bg-secondary); border-radius: 8px; font-size: 14px; color: var(--text-secondary);'
            }, `Found ${fuzzyResults.length} result${fuzzyResults.length === 1 ? '' : 's'}${scopeText} (fuzzy matching enabled)`);
            main.appendChild(resultInfo);

            // Keyboard navigation hint (v1.0.0)
            const keyboardHint = h('div', {
              className: 'search-keyboard-hint',
              style: 'padding: 8px 12px; margin-bottom: 12px; background: var(--bg-alt, var(--bg-secondary)); border: 1px solid var(--border); border-radius: 6px; font-size: 13px; color: var(--text-secondary); display: flex; align-items: center; gap: 12px;'
            },
              h('span', { style: 'opacity: 0.7;' }, '💡'),
              h('span', {},
                h('kbd', { style: 'background: var(--bg-primary); padding: 2px 6px; border-radius: 4px; border: 1px solid var(--border); font-size: 12px; font-family: monospace;' }, '↑'),
                ' / ',
                h('kbd', { style: 'background: var(--bg-primary); padding: 2px 6px; border-radius: 4px; border: 1px solid var(--border); font-size: 12px; font-family: monospace;' }, '↓'),
                ' to navigate • ',
                h('kbd', { style: 'background: var(--bg-primary); padding: 2px 6px; border-radius: 4px; border: 1px solid var(--border); font-size: 12px; font-family: monospace;' }, 'Enter'),
                ' to open'
              )
            );
            main.appendChild(keyboardHint);
            
            const gridViewEnabled = localStorage.getItem('cardspoke_gridView') === 'true';
            const gridClass = gridViewEnabled ? 'card-grid grid-view' : 'card-grid';
            const grid = h('div', { className: gridClass, role: 'list', id: 'searchResultGrid' });
            setSearchResultsState({ items: fuzzyResults, elements: [], selectedIndex: 0 });
            const batchSize = 50;
            let renderIndex = 0;
            const renderBatch = () => {
              const frag = document.createDocumentFragment();
              for (let i = renderIndex; i < Math.min(renderIndex + batchSize, fuzzyResults.length); i++) {
                const result = fuzzyResults[i];
                const card = result.card;
                const cardEl = renderCardTile(card, { highlightQuery: query, lazyBody: true });
                cardEl.classList.add('search-result');
                cardEl.dataset.resultIndex = i;
                cardEl.addEventListener('click', () => {
                  searchResultsState.selectedIndex = i;
                  updateSearchSelection(0);
                });

                // Add dataset badge for multi-dataset search
                if (scope === 'all' && result.datasetName) {
                  const datasetBadge = h('span', {
                    style: 'position: absolute; top: 8px; left: 8px; background: #3b82f6; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600;'
                  }, result.datasetName);
                  cardEl.style.position = 'relative';
                  cardEl.appendChild(datasetBadge);
                }

                // Add match quality indicator
                if (result.score < 60) {
                  const matchBadge = h('span', {
                    style: 'position: absolute; top: 8px; right: 8px; background: #fbbf24; color: #000; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600;'
                  }, '~');
                  cardEl.style.position = 'relative';
                  cardEl.appendChild(matchBadge);
                }

                frag.appendChild(cardEl);
                searchResultsState.elements.push(cardEl);
              }
              grid.appendChild(frag);
              renderIndex += batchSize;
              updateSearchSelection(0);
            };
            const onScroll = () => {
              if (renderIndex >= fuzzyResults.length) return;
              const threshold = grid.offsetTop + grid.offsetHeight - window.innerHeight * 2;
              if (window.scrollY + window.innerHeight > threshold) {
                requestAnimationFrame(renderBatch);
              }
            };
            renderBatch();
            window.addEventListener('scroll', onScroll, { passive: true });
            registerRenderCleanup(() => window.removeEventListener('scroll', onScroll));
            main.appendChild(grid);
          }
        }).catch(err => {
          loadingDiv.remove();
          main.appendChild(h('div', { className: 'empty' }, 'Search error: ' + err.message));
        });
      }


      /**
       * Main render function - orchestrates page rendering
       */
      function render() {
        try {
          runRenderCleanup();
          renderBreadcrumbs();
          main.innerHTML = '';
          switch (navState.page) {
            case 'read':
              renderReadOnlyCard();
              break;
            case 'list':
              renderCardList();
              break;
            case 'search':
              renderSearchResults();
              break;
            case 'edit':
              renderEditCard();
              break;
            default:
              renderCardList();
          }
        } catch (e) {
          bootError('Render failed: ' + (e.message || e));
        }
      }

      /**
       * Apply custom components from the ComponentRegistry to core UI areas.
       * Task 2.5: Expand Component Registry to Sidebar, Header, and SearchBar.
       * Called once after plugins are synced from store.
       */
      function applyRegistryComponents() {
        if (!window.CardSpoke || !window.CardSpoke.ComponentRegistry) {
          return;
        }
        const registry = window.CardSpoke.ComponentRegistry;

        // Replace Header if a custom component is registered
        const CustomHeader = registry.get('Header');
        if (CustomHeader && typeof CustomHeader.render === 'function') {
          try {
            const headerEl = document.querySelector('.header');
            if (headerEl) {
              const customEl = CustomHeader.render({ header: headerEl });
              if (customEl instanceof HTMLElement) {
                headerEl.parentNode.replaceChild(customEl, headerEl);
                console.log('[ComponentRegistry] Custom Header component applied');
              }
            }
          } catch (err) {
            console.warn('[ComponentRegistry] Custom Header render failed, using default:', err);
          }
        }

        // Replace Sidebar (menu panel) if a custom component is registered
        const CustomSidebar = registry.get('Sidebar');
        if (CustomSidebar && typeof CustomSidebar.render === 'function') {
          try {
            const menuPanel = document.querySelector('.menu-panel');
            if (menuPanel) {
              const customEl = CustomSidebar.render({ panel: menuPanel });
              if (customEl instanceof HTMLElement) {
                menuPanel.parentNode.replaceChild(customEl, menuPanel);
                console.log('[ComponentRegistry] Custom Sidebar component applied');
              }
            }
          } catch (err) {
            console.warn('[ComponentRegistry] Custom Sidebar render failed, using default:', err);
          }
        }

        // Replace SearchBar if a custom component is registered
        const CustomSearchBar = registry.get('SearchBar');
        if (CustomSearchBar && typeof CustomSearchBar.render === 'function') {
          try {
            const searchWrapper = document.querySelector('.search-input-wrapper');
            if (searchWrapper) {
              const customEl = CustomSearchBar.render({ wrapper: searchWrapper });
              if (customEl instanceof HTMLElement) {
                searchWrapper.parentNode.replaceChild(customEl, searchWrapper);
                console.log('[ComponentRegistry] Custom SearchBar component applied');
              }
            }
          } catch (err) {
            console.warn('[ComponentRegistry] Custom SearchBar render failed, using default:', err);
          }
        }
      }

      // =============================================================
      // --- THEME MANAGEMENT ---
      // Handle dark/light theme switching
      // =============================================================

      /**
       * Apply theme (light or dark mode)
       * @param {'light'|'dark'} theme - Theme to apply
       */
      function applyTheme(theme) {
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        
        // Save to store for persistence across dataset switches
        store.activeTheme = theme;
        save();
        
        try {
          localStorage.setItem('cardspoke_theme', theme);
        } catch { }
        
        // Sync header button
        const moonIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
        const sunIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
        if (header.themeToggle) header.themeToggle.innerHTML = theme === 'dark' ? sunIcon : moonIcon;
        
      }
      
      // =============================================================
      // --- APP FOOTER ---
      // Populate footer with version and attribution information
      // =============================================================
      
      /**
       * Populate footer with app metadata
       * Enhanced with error handling and logging for debugging
       */
      function populateFooter() {
        try {
          const creatorEl = document.getElementById('app-creator');
          const versionEl = document.getElementById('app-version');
          const dateEl = document.getElementById('app-release-date');
          const updaterEl = document.getElementById('app-updater');

          // Verify all elements exist
          if (!creatorEl || !versionEl || !dateEl || !updaterEl) {
            console.error('[Footer] Missing footer elements:', {
              creator: !!creatorEl,
              version: !!versionEl,
              date: !!dateEl,
              updater: !!updaterEl
            });
            return;
          }

          // Populate elements
          creatorEl.textContent = APP_CREATOR;
          versionEl.textContent = APP_VERSION;
          dateEl.textContent = APP_RELEASE_DATE;
          updaterEl.textContent = APP_UPDATER;

          if (isDeveloperMode()) {
            console.log('[Footer] Populated successfully:', {
              creator: APP_CREATOR,
              version: APP_VERSION,
              date: APP_RELEASE_DATE,
              updater: APP_UPDATER
            });
          }
        } catch (error) {
          console.error('[Footer] Error populating footer:', error);
        }
      }

      /**
       * Update dataset selector options
       */
      function updateDatasetSelector() {
        if (!datasetSelector || !datasetManager) return;
        
        // Clear existing options
        datasetSelector.innerHTML = '';
        
        // Add "Current Dataset" option
        const currentOption = document.createElement('option');
        currentOption.value = 'current';
        currentOption.textContent = 'Current Dataset';
        datasetSelector.appendChild(currentOption);
        
        // Add "All Datasets" option if there are multiple datasets
        const datasets = datasetManager.listDatasets();
        if (datasets.length > 1) {
          const allOption = document.createElement('option');
          allOption.value = 'all';
          allOption.textContent = 'All Datasets';
          datasetSelector.appendChild(allOption);
          
          // Add separator
          const separator = document.createElement('option');
          separator.disabled = true;
          separator.textContent = '───────────';
          datasetSelector.appendChild(separator);
          
          // Add individual dataset options
          datasets.forEach(dataset => {
            const option = document.createElement('option');
            option.value = dataset.id;
            option.textContent = dataset.name + (dataset.isActive ? ' (active)' : '');
            datasetSelector.appendChild(option);
          });
        }
      }

      // =============================================================
      // --- INITIALIZATION & EVENT LISTENERS ---
      // Set up event handlers for user interactions
      // =============================================================

      // Initialize theme
      const savedTheme = store.activeTheme || localStorage.getItem('cardspoke_theme') || 'light';
      applyTheme(savedTheme);

      // --- Header Button Handlers ---
      
      header.themeToggle.onclick = () => {
        const isDark = document.documentElement.classList.contains('dark');
        applyTheme(isDark ? 'light' : 'dark');
      };
      
      // Apply saved high contrast mode on startup
      const savedHC = localStorage.getItem('cardspoke_highcontrast') === 'true';
      if (savedHC) document.documentElement.classList.add('high-contrast');
      
      // --- Menu Handlers ---
      
      // Focus trap cleanup function
      let menuFocusTrapCleanup = null;
      
      header.menuBtn.onclick = () => {
        menu.overlay.classList.add('show');
        // Show/hide developer section based on developer mode
        if (menu.developerSection) {
          menu.developerSection.style.display = isDeveloperMode() ? 'block' : 'none';
        }
        // Set up focus trap for accessibility
        menuFocusTrapCleanup = trapFocus(menu.overlay.querySelector('.menu-panel'));
      };

      menu.closeBtn.onclick = () => {
        menu.overlay.classList.remove('show');
        if (menuFocusTrapCleanup) {
          menuFocusTrapCleanup();
          menuFocusTrapCleanup = null;
        }
      };

      menu.overlay.onclick = (e) => {
        if (e.target === menu.overlay) {
          menu.overlay.classList.remove('show');
          if (menuFocusTrapCleanup) {
            menuFocusTrapCleanup();
            menuFocusTrapCleanup = null;
          }
        }
      };

      menu.newCard.onclick = () => {
        menu.overlay.classList.remove('show');
        goTo('edit', { cardId: null, parentId: null });
      };

      menu.upload.onclick = () => {
        menu.overlay.classList.remove('show');
        updateImportLocationOptions();
        
        // Reset JSON import to root
        if (uploadModal.importLocationSelectJSON) {
          uploadModal.importLocationSelectJSON.value = 'root';
        }
        
        // Reset TXT import to root and outline
        if (uploadModal.importLocationSelectTXT) {
          uploadModal.importLocationSelectTXT.value = 'root';
        }
        const txtOutlineRadio = document.querySelector('input[name="txtImportMode"][value="outline"]');
        if (txtOutlineRadio) txtOutlineRadio.checked = true;

        // Restore last used tab or default to json
        const lastTab = localStorage.getItem('cardspoke_lastUploadTab') || 'json';
        uploadModal.tabs.forEach(t => t.classList.remove('active'));
        uploadModal.tabContents.forEach(content => content.classList.remove('active'));
        const tabToActivate = document.querySelector(`.modal-tab[data-tab="${lastTab}"]`) || document.querySelector('.modal-tab[data-tab="json"]');
        const contentToActivate = document.getElementById(`tab-${lastTab}`) || document.getElementById('tab-json');
        if (tabToActivate) tabToActivate.classList.add('active');
        if (contentToActivate) contentToActivate.classList.add('active');
        
        // Show modal
        uploadModal.overlay.classList.add('show');
      };

      menu.pluginManager.onclick = () => {
        menu.overlay.classList.remove('show');
        showPluginManager('installed');
      };

      if (menu.tagManager) {
        menu.tagManager.onclick = () => {
          menu.overlay.classList.remove('show');
          showTagManager();
        };
      }

      if (menu.advancedSearch) {
        menu.advancedSearch.onclick = () => {
          menu.overlay.classList.remove('show');
          showAdvancedSearch();
        };
      }

      if (menu.trashBin) {
        menu.trashBin.onclick = () => {
          menu.overlay.classList.remove('show');
          showTrashBin();
        };
      }

      menu.appearance.onclick = () => {
        menu.overlay.classList.remove('show');
        showAppearanceSettings();
      };

      menu.bookmarks.onclick = () => {
        menu.overlay.classList.remove('show');
        showBookmarks();
      };

      menu.recentCards.onclick = () => {
        menu.overlay.classList.remove('show');
        showRecentCards();
      };

      if (menu.typography) {
        menu.typography.onclick = () => {
          menu.overlay.classList.remove('show');
          showTypographySelector();
        };
      }

      menu.dataHub.onclick = () => {
        menu.overlay.classList.remove('show');
        showDatasetInfo();
      };

      menu.clearAll.onclick = () => {
        menu.overlay.classList.remove('show');
        clearAllData();
      };

      menu.gettingStarted.onclick = () => {
        menu.overlay.classList.remove('show');
        showGettingStarted();
      };

      menu.help.onclick = () => {
        menu.overlay.classList.remove('show');
        showHelp();
      };

      menu.keyboardShortcuts.onclick = () => {
        menu.overlay.classList.remove('show');
        showKeyboardHelp();
      };

      if (menu.developerConsole) {
        menu.developerConsole.onclick = () => {
          menu.overlay.classList.remove('show');
          showDeveloperConsole();
        };
      }

      const debouncedNavigateSearch = debounce((query) => {
        if (query) {
          goTo('search', { searchQuery: query });
        }
      }, 180);

      function updateSearchSelection(delta = 0) {
        if (!searchResultsState.items.length) return;
        const max = searchResultsState.items.length - 1;
        const next = Math.min(max, Math.max(0, searchResultsState.selectedIndex + delta));
        searchResultsState.selectedIndex = next;
        searchResultsState.elements.forEach((el, idx) => {
          if (idx === next) el.classList.add('search-result-selected');
          else el.classList.remove('search-result-selected');
        });
        const active = searchResultsState.elements[next];
        if (active) active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }

      function openSelectedSearchResult() {
        if (!searchResultsState.items.length) return;
        const target = searchResultsState.items[searchResultsState.selectedIndex];
        if (target?.card?.id) goTo('read', { cardId: target.card.id });
      }

      header.homeBtn.onclick = () => {
        goTo('list', { cardId: null });
      };

      header.brandBtn.onclick = () => {
        goTo('list', { cardId: null });
      };

      header.undoBtn.onclick = () => {
        undo();
      };

      searchInput.addEventListener('input', (e) => {
        if (e.target.value.trim()) {
          searchClear.style.display = 'block';
        } else {
          searchClear.style.display = 'none';
        }
        if (navState.page === 'search') {
          debouncedNavigateSearch(e.target.value.trim());
        }
      });

      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && searchInput.value.trim()) {
          if (navState.page === 'search' && searchResultsState.items.length) {
            e.preventDefault();
            openSelectedSearchResult();
            return;
          }
          goTo('search', { searchQuery: searchInput.value.trim() });
        }
        if (navState.page === 'search' && searchResultsState.items.length) {
          if (e.key === 'ArrowDown') { e.preventDefault(); updateSearchSelection(1); }
          if (e.key === 'ArrowUp') { e.preventDefault(); updateSearchSelection(-1); }
        }
      });

      searchClear.onclick = () => {
        searchInput.value = '';
        searchClear.style.display = 'none';
        if (navState.page === 'search') goBack();
      };

      uploadModal.tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          const tabName = tab.getAttribute('data-tab');
          uploadModal.tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          uploadModal.tabContents.forEach(content => content.classList.remove('active'));
          document.getElementById(`tab-${tabName}`).classList.add('active');
          // Remember last used tab
          localStorage.setItem('cardspoke_lastUploadTab', tabName);
        });
      });

      uploadModal.closeBtn.onclick = () => {
        uploadModal.overlay.classList.remove('show');
      };

      uploadModal.overlay.onclick = (e) => {
        if (e.target === uploadModal.overlay) {
          uploadModal.overlay.classList.remove('show');
        }
      };

      uploadModal.fileUploadAreaJSON.onclick = () => {
        uploadModal.fileInputJSON.click();
      };

      uploadModal.fileInputJSON.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const data = JSON.parse(reader.result);
            const mode = uploadModal.importLocationSelectJSON.value || 'root';
            importJSON(data, mode);
            uploadModal.overlay.classList.remove('show');
          } catch (err) {
            showToast('Failed to parse JSON: ' + err.message, 'error');
          }
        };
        reader.readAsText(file);
      });

      uploadModal.fileUploadAreaTXT.onclick = () => {
        uploadModal.fileInputTXT.click();
      };

      uploadModal.fileInputTXT.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          const text = reader.result;
          const modeRadio = document.querySelector('input[name="txtImportMode"]:checked');
          const mode = modeRadio ? modeRadio.value : 'outline';
          const location = uploadModal.importLocationSelectTXT.value || 'root';
          importTXT(text, mode, location);
          uploadModal.overlay.classList.remove('show');
        };
        reader.readAsText(file);
      });


      // =============================================================
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

import {
  APP_VERSION,
  MAX_UNDO_STACK, MAX_TRASH_SIZE,
  store,
  navState, navHistory,
  instanceKey,
  dirty,
  undoStack, redoStack, trashBin,
  draggedCardId, setDraggedCardId,
  dragOverCardId, setDragOverCardId
} from './state.js';


      // Source Part 5/5: Advanced systems (undo/redo, tags, search) and boot
      // Concatenated via `npm run build` in lexical order of www/src/*.js
      // --- UNDO/REDO SYSTEM (v0.12.0) ---
      // =============================================================
      
      /**
       * Push a state to the undo stack
       * @param {string} action - Description of the action
       * @param {Object} data - Data needed to undo
       */
      function pushUndo(action, data) {
        if (undoGroupState.active) {
          undoGroupState.actions.push({ action, data, timestamp: Date.now() });
          redoStack.length = 0;
          return;
        }
        undoStack.push({
          action,
          data,
          timestamp: Date.now()
        });
        if (undoStack.length > MAX_UNDO_STACK) {
          undoStack.shift();
        }
        redoStack.length = 0;
      }

      const undoGroupState = {
        active: false,
        label: null,
        actions: []
      };

      function startUndoGroup(label) {
        if (undoGroupState.active) return false;
        undoGroupState.active = true;
        undoGroupState.label = label || 'group';
        undoGroupState.actions = [];
        return true;
      }

      function endUndoGroup() {
        if (!undoGroupState.active) return false;
        const groupedActions = undoGroupState.actions.slice();
        const label = undoGroupState.label || 'group';
        undoGroupState.active = false;
        undoGroupState.label = null;
        undoGroupState.actions = [];
        if (!groupedActions.length) return true;
        undoStack.push({
          action: 'undoGroup',
          data: { label, actions: groupedActions },
          timestamp: Date.now()
        });
        if (undoStack.length > MAX_UNDO_STACK) undoStack.shift();
        redoStack.length = 0;
        return true;
      }
      
      /**
       * Undo the last action
       */
      function undo() {
        if (undoStack.length === 0) {
          showToast('Nothing to undo', 'info');
          return false;
        }
        
        const action = undoStack.pop();
        
        try {
          if (action.action === 'undoGroup') {
            const grouped = action.data.actions || [];
            for (let i = grouped.length - 1; i >= 0; i--) {
              applyUndoAction(grouped[i]);
            }
            redoStack.push(action);
            save();
            render();
            showToast('Undo: ' + (action.data.label || 'bulk operation'), 'info');
            return true;
          }
          applyUndoAction(action);
          
          redoStack.push(action);
          save();
          render();
          showToast('Undo: ' + action.action, 'info');
          return true;
        } catch (err) {
          console.error('Undo failed:', err);
          showToast('Undo failed', 'error');
          return false;
        }
      }

      function applyUndoAction(action) {
        switch (action.action) {
            case 'deleteCard':
              const cardData = action.data.card;
              store.cards[cardData.id] = cardData;
              if (cardData.parentId) {
                const parent = store.cards[cardData.parentId];
                if (parent && !parent.children.includes(cardData.id)) {
                  parent.children.push(cardData.id);
                }
              } else {
                if (!store.rootOrder.includes(cardData.id)) {
                  store.rootOrder.push(cardData.id);
                }
              }
              const trashIndex = trashBin.findIndex(t => t.card.id === cardData.id);
              if (trashIndex > -1) trashBin.splice(trashIndex, 1);
              break;
              
            case 'updateCard':
              Object.assign(store.cards[action.data.cardId], action.data.previousState);
              break;
              
            case 'createCard':
              const card = store.cards[action.data.cardId];
              if (card) {
                if (card.parentId) {
                  const parent = store.cards[card.parentId];
                  if (parent) parent.children = parent.children.filter(c => c !== card.id);
                } else {
                  store.rootOrder = store.rootOrder.filter(c => c !== card.id);
                }
                delete store.cards[action.data.cardId];
              }
              break;
              
            case 'addTag':
              removeTag(action.data.cardId, action.data.tag, true);
              break;
              
            case 'removeTag':
              addTag(action.data.cardId, action.data.tag, true);
              break;
              
            case 'moveCard':
              const movedCard = store.cards[action.data.cardId];
              if (movedCard) {
                const currentParent = store.cards[movedCard.parentId];
                if (currentParent) {
                  currentParent.children = currentParent.children.filter(c => c !== movedCard.id);
                } else {
                  store.rootOrder = store.rootOrder.filter(c => c !== movedCard.id);
                }
                movedCard.parentId = action.data.originalParentId;
                if (action.data.originalParentId) {
                  const origParent = store.cards[action.data.originalParentId];
                  if (origParent && !origParent.children.includes(movedCard.id)) {
                    origParent.children.push(movedCard.id);
                  }
                } else {
                  if (!store.rootOrder.includes(movedCard.id)) {
                    store.rootOrder.push(movedCard.id);
                  }
                }
              }
              break;
        }
      }
      
      /**
       * Redo the last undone action
       */
      function redo() {
        if (redoStack.length === 0) {
          showToast('Nothing to redo', 'info');
          return false;
        }
        
        const action = redoStack.pop();
        
        try {
          if (action.action === 'undoGroup') {
            const grouped = action.data.actions || [];
            grouped.forEach(applyRedoAction);
            undoStack.push(action);
            save();
            render();
            showToast('Redo: ' + (action.data.label || 'bulk operation'), 'info');
            return true;
          }

          applyRedoAction(action);
          
          undoStack.push(action);
          save();
          render();
          showToast('Redo: ' + action.action, 'info');
          return true;
        } catch (err) {
          console.error('Redo failed:', err);
          showToast('Redo failed', 'error');
          return false;
        }
      }

      function applyRedoAction(action) {
        switch (action.action) {
            case 'deleteCard':
              const cardId = action.data.card.id;
              const card = store.cards[cardId];
              if (card) {
                if (card.parentId) {
                  const parent = store.cards[card.parentId];
                  if (parent) parent.children = parent.children.filter(c => c !== cardId);
                } else {
                  store.rootOrder = store.rootOrder.filter(c => c !== cardId);
                }
                trashBin.unshift({ card: cloneCard(card), deletedAt: Date.now() });
                if (trashBin.length > MAX_TRASH_SIZE) trashBin.pop();
                delete store.cards[cardId];
              }
              break;
              
            case 'updateCard':
              Object.assign(store.cards[action.data.cardId], action.data.newState);
              break;
              
            case 'createCard':
              const newCard = action.data.card;
              store.cards[newCard.id] = newCard;
              if (newCard.parentId) {
                const parent = store.cards[newCard.parentId];
                if (parent && !parent.children.includes(newCard.id)) {
                  parent.children.push(newCard.id);
                }
              } else {
                if (!store.rootOrder.includes(newCard.id)) {
                  store.rootOrder.push(newCard.id);
                }
              }
              break;
              
            case 'addTag':
              addTag(action.data.cardId, action.data.tag, true);
              break;
              
            case 'removeTag':
              removeTag(action.data.cardId, action.data.tag, true);
              break;
              
            case 'moveCard':
              const mvCard = store.cards[action.data.cardId];
              if (mvCard) {
                const oldParent = store.cards[mvCard.parentId];
                if (oldParent) {
                  oldParent.children = oldParent.children.filter(c => c !== mvCard.id);
                } else {
                  store.rootOrder = store.rootOrder.filter(c => c !== mvCard.id);
                }
                mvCard.parentId = action.data.newParentId;
                if (action.data.newParentId) {
                  const newParent = store.cards[action.data.newParentId];
                  if (newParent && !newParent.children.includes(mvCard.id)) {
                    newParent.children.push(mvCard.id);
                  }
                } else {
                  if (!store.rootOrder.includes(mvCard.id)) {
                    store.rootOrder.push(mvCard.id);
                  }
                }
              }
              break;
        }
      }

      window.startUndoGroup = startUndoGroup;
      window.endUndoGroup = endUndoGroup;
      
      /**
       * Show trash bin modal
       */
      function showTrashBin() {
        const overlay = h('div', { className: 'modal-overlay show' });
        const modal = h('div', { className: 'modal', style: 'max-width: 600px;' });
        const modalHeader = h('div', { className: 'modal-header' });
        modalHeader.appendChild(h('div', { className: 'modal-title' }, 'Trash Bin'));
        const closeBtn = h('button', { className: 'modal-close', onclick: () => overlay.remove() }, 'X');
        modalHeader.appendChild(closeBtn);
        modal.appendChild(modalHeader);
        
        const modalBody = h('div', { className: 'modal-body' });
        
        if (trashBin.length === 0) {
          modalBody.appendChild(h('div', { className: 'empty' }, 'Trash bin is empty'));
        } else {
          const description = h('p', { style: 'margin-bottom: var(--space-lg); color: var(--text-secondary);' },
            trashBin.length + ' item(s) in trash. Restore or permanently delete items.');
          modalBody.appendChild(description);
          
          trashBin.forEach((item, index) => {
            const itemDiv = h('div', {
              style: 'background: var(--bg-secondary); padding: var(--space-lg); border-radius: var(--radius); border: 1px solid var(--border); margin-bottom: var(--space-md); display: flex; justify-content: space-between; align-items: center;'
            });
            
            const info = h('div', { style: 'flex: 1;' });
            info.appendChild(h('div', { style: 'font-weight: 700;' }, item.card.title || '(Untitled)'));
            info.appendChild(h('div', { style: 'font-size: 0.875rem; color: var(--text-secondary);' },
              'Deleted: ' + new Date(item.deletedAt).toLocaleString()));
            itemDiv.appendChild(info);
            
            const actions = h('div', { style: 'display: flex; gap: var(--space-sm);' });
            
            const restoreBtn = h('button', {
              className: 'btn btn-primary',
              onclick: () => {
                store.cards[item.card.id] = item.card;
                if (item.card.parentId) {
                  const parent = store.cards[item.card.parentId];
                  if (parent && !parent.children.includes(item.card.id)) {
                    parent.children.push(item.card.id);
                  }
                } else {
                  if (!store.rootOrder.includes(item.card.id)) {
                    store.rootOrder.push(item.card.id);
                  }
                }
                trashBin.splice(index, 1);
                save();
                overlay.remove();
                showTrashBin();
                showToast('Card restored: ' + (item.card.title || '(Untitled)'));
                render();
              }
            }, 'Restore');
            actions.appendChild(restoreBtn);
            
            const deleteBtn = h('button', {
              className: 'btn btn-danger',
              onclick: () => {
                if (confirm('Permanently delete this card?')) {
                  trashBin.splice(index, 1);
                  overlay.remove();
                  showTrashBin();
                  showToast('Card permanently deleted');
                }
              }
            }, 'Delete');
            actions.appendChild(deleteBtn);
            
            itemDiv.appendChild(actions);
            modalBody.appendChild(itemDiv);
          });
          
          const emptyBtn = h('button', {
            className: 'btn btn-danger',
            style: 'width: 100%; margin-top: var(--space-lg);',
            onclick: () => {
              if (confirm('Permanently delete all items in trash?')) {
                trashBin.length = 0;
                overlay.remove();
                showToast('Trash emptied');
              }
            }
          }, 'Empty Trash');
          modalBody.appendChild(emptyBtn);
        }
        
        modal.appendChild(modalBody);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        overlay.onclick = (e) => {
          if (e.target === overlay) overlay.remove();
        };
      }

      // =============================================================
      // --- TAG MANAGEMENT SYSTEM (v0.12.0) ---
      // =============================================================
      
      /**
       * Rename a tag across all cards
       */
      function renameTag(oldTag, newTag) {
        const normalizedOld = oldTag.replace(/^#/, '').toLowerCase().trim();
        const normalizedNew = newTag.replace(/^#/, '').toLowerCase().trim();
        
        if (!normalizedOld || !normalizedNew) return 0;
        if (normalizedOld === normalizedNew) return 0;
        
        let count = 0;
        Object.values(store.cards).forEach(card => {
          if (card.tags && card.tags.includes(normalizedOld)) {
            card.tags = card.tags.map(t => t === normalizedOld ? normalizedNew : t);
            card.tags = [...new Set(card.tags)];
            card.updatedAt = Date.now();
            count++;
          }
        });
        
        if (count > 0) save();
        return count;
      }
      
      /**
       * Merge two tags
       */
      function mergeTags(tag1, tag2) {
        return renameTag(tag1, tag2);
      }
      
      /**
       * Delete a tag from all cards
       */
      function deleteTagGlobal(tag) {
        const normalizedTag = tag.replace(/^#/, '').toLowerCase().trim();
        if (!normalizedTag) return 0;
        
        let count = 0;
        Object.values(store.cards).forEach(card => {
          if (card.tags && card.tags.includes(normalizedTag)) {
            card.tags = card.tags.filter(t => t !== normalizedTag);
            card.updatedAt = Date.now();
            count++;
          }
        });
        
        if (count > 0) save();
        return count;
      }
      
      /**
       * Get tag statistics
       */
      function getTagStats() {
        const tagCounts = {};
        Object.values(store.cards).forEach(card => {
          if (card.tags) {
            card.tags.forEach(tag => {
              tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
          }
        });
        return Object.entries(tagCounts)
          .map(([tag, count]) => ({ tag, count }))
          .sort((a, b) => b.count - a.count);
      }
      
      /**
       * Show tag manager modal
       */
      function showTagManager() {
        const overlay = h('div', { className: 'modal-overlay show' });
        const modal = h('div', { className: 'modal', style: 'max-width: 700px;' });
        const modalHeader = h('div', { className: 'modal-header' });
        modalHeader.appendChild(h('div', { className: 'modal-title' }, 'Tag Manager'));
        const closeBtn = h('button', { 
          className: 'modal-close', 
          'aria-label': 'Close tag manager',
          onclick: () => overlay.remove() 
        }, 'X');
        modalHeader.appendChild(closeBtn);
        modal.appendChild(modalHeader);
        
        const modalBody = h('div', { className: 'modal-body' });
        const tagStats = getTagStats();
        
        if (tagStats.length === 0) {
          modalBody.appendChild(h('div', { className: 'empty' }, 'No tags found. Add tags to your cards to manage them here.'));
        } else {
          const summary = h('div', { style: 'background: var(--bg-secondary); padding: var(--space-lg); border-radius: var(--radius); margin-bottom: var(--space-xl);' });
          summary.appendChild(h('div', { style: 'font-weight: 700; margin-bottom: var(--space-sm);' }, 
            tagStats.length + ' unique tags across ' + Object.keys(store.cards).length + ' cards'));
          modalBody.appendChild(summary);
          
          tagStats.forEach(function(tagStat) {
            const tag = tagStat.tag;
            const count = tagStat.count;
            const tagItem = h('div', {
              style: 'background: var(--bg-secondary); padding: var(--space-lg); border-radius: var(--radius); border: 1px solid var(--border); margin-bottom: var(--space-md); display: flex; justify-content: space-between; align-items: center;'
            });
            
            const tagInfo = h('div', { style: 'display: flex; align-items: center; gap: var(--space-md);' });
            const tagChip = h('span', { 
              className: 'card-tag',
              style: 'cursor: pointer;',
              onclick: function() {
                overlay.remove();
                goTo('search', { searchQuery: '#' + tag });
              }
            }, tag);
            tagInfo.appendChild(tagChip);
            tagInfo.appendChild(h('span', { style: 'color: var(--text-secondary);' }, '(' + count + ' card' + (count !== 1 ? 's' : '') + ')'));
            tagItem.appendChild(tagInfo);
            
            const actions = h('div', { style: 'display: flex; gap: var(--space-sm);' });
            
            const renameBtn = h('button', {
              className: 'btn',
              style: 'font-size: var(--text-sm);',
              onclick: function() {
                const newName = prompt('Rename tag "' + tag + '" to:', tag);
                if (newName && newName.trim() !== tag) {
                  const affected = renameTag(tag, newName.trim());
                  if (affected > 0) {
                    showToast('Renamed "' + tag + '" to "' + newName.trim() + '" in ' + affected + ' card(s)');
                    overlay.remove();
                    showTagManager();
                  }
                }
              }
            }, 'Rename');
            actions.appendChild(renameBtn);
            
            const mergeBtn = h('button', {
              className: 'btn',
              style: 'font-size: var(--text-sm);',
              onclick: function() {
                const otherTags = tagStats.map(function(t) { return t.tag; }).filter(function(t) { return t !== tag; });
                if (otherTags.length === 0) {
                  showToast('No other tags to merge with', 'info');
                  return;
                }
                const targetTag = prompt('Merge "' + tag + '" into which tag?\n\nAvailable: ' + otherTags.join(', '));
                if (targetTag && otherTags.includes(targetTag.trim().toLowerCase())) {
                  const affected = mergeTags(tag, targetTag.trim());
                  if (affected > 0) {
                    showToast('Merged "' + tag + '" into "' + targetTag.trim() + '" (' + affected + ' card(s))');
                    overlay.remove();
                    showTagManager();
                  }
                }
              }
            }, 'Merge');
            actions.appendChild(mergeBtn);
            
            const deleteBtn = h('button', {
              className: 'btn btn-danger',
              style: 'font-size: var(--text-sm);',
              onclick: function() {
                if (confirm('Delete tag "' + tag + '" from all ' + count + ' card(s)?')) {
                  const affected = deleteTagGlobal(tag);
                  showToast('Deleted tag "' + tag + '" from ' + affected + ' card(s)');
                  overlay.remove();
                  showTagManager();
                }
              }
            }, 'Delete');
            actions.appendChild(deleteBtn);
            
            tagItem.appendChild(actions);
            modalBody.appendChild(tagItem);
          });
        }
        
        modal.appendChild(modalBody);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        overlay.onclick = function(e) {
          if (e.target === overlay) overlay.remove();
        };
      }

      // =============================================================
      // --- ADVANCED SEARCH (v0.12.0) ---
      // =============================================================
      
      /**
       * Show advanced search modal with filters
       */
      function showAdvancedSearch() {
        const overlay = h('div', { className: 'modal-overlay show' });
        const modal = h('div', { className: 'modal', style: 'max-width: 600px;' });
        const modalHeader = h('div', { className: 'modal-header' });
        modalHeader.appendChild(h('div', { className: 'modal-title' }, 'Advanced Search'));
        const closeBtn = h('button', { 
          className: 'modal-close', 
          'aria-label': 'Close advanced search',
          onclick: () => overlay.remove() 
        }, 'X');
        modalHeader.appendChild(closeBtn);
        modal.appendChild(modalHeader);
        
        const modalBody = h('div', { className: 'modal-body' });
        
        // Add help text at the top
        const helpText = h('div', { 
          style: 'background: var(--bg-secondary); padding: var(--space-md); border-radius: var(--radius); margin-bottom: var(--space-lg); font-size: 14px; color: var(--text-secondary);'
        }, '💡 Tip: Use advanced filters to narrow down your search results by tag, bookmark status, or date.');
        modalBody.appendChild(helpText);
        
        // Search query
        const queryGroup = h('div', { style: 'margin-bottom: var(--space-lg);' });
        queryGroup.appendChild(h('label', { style: 'display: block; margin-bottom: var(--space-xs); font-weight: 600;' }, 'Search Text'));
        const queryInput = h('input', {
          type: 'text',
          placeholder: 'Search in titles and content...',
          'aria-label': 'Search text input',
          style: 'width: 100%; padding: var(--space-md); border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg-primary); color: var(--text-primary); font-size: 1rem;'
        });
        queryGroup.appendChild(queryInput);
        modalBody.appendChild(queryGroup);
        
        // Filter by tag
        const tagGroup = h('div', { style: 'margin-bottom: var(--space-lg);' });
        tagGroup.appendChild(h('label', { style: 'display: block; margin-bottom: var(--space-xs); font-weight: 600;' }, 'Filter by Tag'));
        const tagSelect = h('select', {
          'aria-label': 'Filter by tag',
          style: 'width: 100%; padding: var(--space-md); border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); color: var(--text); font-size: 1rem;'
        });
        tagSelect.appendChild(h('option', { value: '' }, 'Any tag'));
        getAllTags().forEach(function(tag) {
          tagSelect.appendChild(h('option', { value: tag }, tag));
        });
        tagGroup.appendChild(tagSelect);
        modalBody.appendChild(tagGroup);
        
        // Filter by bookmarked
        const bookmarkGroup = h('div', { style: 'margin-bottom: var(--space-lg);' });
        const bookmarkCheck = h('label', { style: 'display: flex; align-items: center; gap: var(--space-sm); cursor: pointer;' });
        const bookmarkInput = h('input', { type: 'checkbox', 'aria-label': 'Only show bookmarked cards' });
        bookmarkCheck.appendChild(bookmarkInput);
        bookmarkCheck.appendChild(document.createTextNode('Only show bookmarked cards'));
        bookmarkGroup.appendChild(bookmarkCheck);
        modalBody.appendChild(bookmarkGroup);
        
        // Filter by date
        const dateGroup = h('div', { style: 'margin-bottom: var(--space-lg);' });
        dateGroup.appendChild(h('label', { style: 'display: block; margin-bottom: var(--space-xs); font-weight: 600;' }, 'Created/Modified'));
        const dateSelect = h('select', {
          'aria-label': 'Filter by date',
          style: 'width: 100%; padding: var(--space-md); border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); color: var(--text); font-size: 1rem;'
        });
        dateSelect.appendChild(h('option', { value: '' }, 'Any time'));
        dateSelect.appendChild(h('option', { value: 'today' }, 'Today'));
        dateSelect.appendChild(h('option', { value: 'week' }, 'Past 7 days'));
        dateSelect.appendChild(h('option', { value: 'month' }, 'Past 30 days'));
        dateGroup.appendChild(dateSelect);
        modalBody.appendChild(dateGroup);
        
        // Search button
        const searchBtn = h('button', {
          className: 'btn btn-primary',
          style: 'width: 100%;',
          onclick: function() {
            const query = queryInput.value.trim();
            const tagFilter = tagSelect.value;
            const bookmarkOnly = bookmarkInput.checked;
            const dateFilter = dateSelect.value;
            
            // Store filters
            sessionStorage.setItem('searchFilters', JSON.stringify({
              query: query, tagFilter: tagFilter, bookmarkOnly: bookmarkOnly, dateFilter: dateFilter
            }));
            
            overlay.remove();
            goTo('search', { searchQuery: query || '*' });
          }
        }, 'Search');
        modalBody.appendChild(searchBtn);
        
        modal.appendChild(modalBody);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        overlay.onclick = function(e) {
          if (e.target === overlay) overlay.remove();
        };
        
        setTimeout(function() { queryInput.focus(); }, 100);
      }

      // =============================================================
      // --- MARKDOWN PREVIEW (v0.12.0) ---
      // =============================================================
      
      /**
       * Simple markdown to HTML conversion
       */
      function simpleMarkdown(text) {
        if (!text) return '';
        
        var html = text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        
        // Headers
        html = html.replace(/^### (.+)$/gm, '<h4>$1</h4>');
        html = html.replace(/^## (.+)$/gm, '<h3>$1</h3>');
        html = html.replace(/^# (.+)$/gm, '<h2>$1</h2>');
        
        // Bold and italic
        html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
        
        // Code
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Lists
        html = html.replace(/^\* (.+)$/gm, '<li>$1</li>');
        html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
        
        // Blockquotes
        html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
        
        // Line breaks
        html = html.replace(/\n\n/g, '</p><p>');
        html = '<p>' + html + '</p>';
        
        return html;
      }

      // =============================================================
      // --- EXTENSIONS STORE PLACEHOLDER (v0.12.0) ---
      // =============================================================
      
      /**
       * Show plugin store modal (coming soon)
       */
      function showPluginStore() {
        showPluginManager('install');
      }

      // =============================================================
      // --- BULK IMPORT/EXPORT (v0.12.0) ---
      // =============================================================
      
      /**
       * Bulk export cards
       */
      function bulkExportCards(cardIds, format) {
        format = format || 'json';
        if (!cardIds || cardIds.length === 0) {
          showToast('No cards selected for export', 'error');
          return;
        }
        
        const exportCards = {};
        function includeChildren(id) {
          const card = store.cards[id];
          if (!card) return;
          exportCards[id] = cloneCard(card);
          card.children.forEach(function(childId) { includeChildren(childId); });
        }
        
        cardIds.forEach(function(id) { includeChildren(id); });
        
        var content, filename, mimeType;
        
        if (format === 'markdown') {
          content = Object.values(exportCards).map(function(card) {
            var md = '# ' + (card.title || '(Untitled)') + '\n\n';
            if (card.tags && card.tags.length) {
              md += 'Tags: ' + card.tags.map(function(t) { return '#' + t; }).join(' ') + '\n\n';
            }
            md += card.body || '';
            return md;
          }).join('\n\n---\n\n');
          filename = 'cardspoke-export-' + Date.now() + '.md';
          mimeType = 'text/markdown';
        } else if (format === 'txt') {
          content = Object.values(exportCards).map(function(card) {
            var txt = '=== ' + (card.title || '(Untitled)') + ' ===\n\n';
            if (card.tags && card.tags.length) {
              txt += 'Tags: ' + card.tags.join(', ') + '\n\n';
            }
            txt += card.body || '';
            return txt;
          }).join('\n\n' + '='.repeat(50) + '\n\n');
          filename = 'cardspoke-export-' + Date.now() + '.txt';
          mimeType = 'text/plain';
        } else {
          content = JSON.stringify({
            exportedAt: new Date().toISOString(),
            cardCount: Object.keys(exportCards).length,
            cards: exportCards
          }, null, 2);
          filename = 'cardspoke-export-' + Date.now() + '.json';
          mimeType = 'application/json';
        }
        
        downloadWithFeedback(content, filename, mimeType);
        showToast('Exported ' + Object.keys(exportCards).length + ' card(s)');
      }
      
      /**
       * Bulk import cards from JSON
       */
      function bulkImportCards(importData, targetParentId) {
        try {
          var cards = {};
          
          if (importData.cards) {
            cards = importData.cards;
          } else if (Array.isArray(importData)) {
            importData.forEach(function(card) {
              cards[card.id || uid()] = card;
            });
          } else if (importData.id) {
            cards[importData.id] = importData;
          }
          
          var idMap = {};
          
          Object.keys(cards).forEach(function(oldId) {
            idMap[oldId] = uid();
          });
          
          Object.values(cards).forEach(function(card) {
            var newId = idMap[card.id];
            var newCard = {
              id: newId,
              title: card.title || '',
              body: card.body || '',
              parentId: card.parentId ? (idMap[card.parentId] || targetParentId) : targetParentId,
              children: card.children ? card.children.map(function(cid) { return idMap[cid]; }).filter(Boolean) : [],
              tags: card.tags || [],
              createdAt: Date.now(),
              updatedAt: Date.now()
            };
            
            store.cards[newId] = newCard;
            
            if (newCard.parentId) {
              var parent = store.cards[newCard.parentId];
              if (parent && !parent.children.includes(newId)) {
                parent.children.push(newId);
              }
            } else {
              if (!store.rootOrder.includes(newId)) {
                store.rootOrder.push(newId);
              }
            }
          });
          
          save();
          return Object.keys(cards).length;
        } catch (err) {
          console.error('Bulk import failed:', err);
          showToast('Import failed: ' + err.message, 'error');
          return 0;
        }
      }

      // =============================================================
      // --- DRAG AND DROP (v0.12.0) ---
      // =============================================================
      
      /**
       * Handle drag start
       */
      function handleDragStart(e, cardId) {
        setDraggedCardId(cardId);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', cardId);
        e.target.style.opacity = '0.5';
      }
      
      /**
       * Handle drag end
       */
      function handleDragEnd(e) {
        e.target.style.opacity = '1';
        setDraggedCardId(null);
        setDragOverCardId(null);
        document.querySelectorAll('.drag-over').forEach(function(el) { el.classList.remove('drag-over'); });
      }
      
      /**
       * Handle drag over
       */
      function handleDragOver(e, cardId) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        if (dragOverCardId !== cardId) {
          document.querySelectorAll('.drag-over').forEach(function(el) { el.classList.remove('drag-over'); });
          if (cardId !== draggedCardId) {
            var tile = e.target.closest('.card-tile');
            if (tile) tile.classList.add('drag-over');
          }
          setDragOverCardId(cardId);
        }
      }
      
      /**
       * Handle drop
       */
      function handleDrop(e, targetCardId) {
        e.preventDefault();
        var tile = e.target.closest('.card-tile');
        if (tile) tile.classList.remove('drag-over');
        
        if (!draggedCardId || draggedCardId === targetCardId) return;
        
        var draggedCard = store.cards[draggedCardId];
        var targetCard = store.cards[targetCardId];
        
        if (!draggedCard || !targetCard) return;
        
        if (isDescendant(targetCardId, draggedCardId)) {
          showToast('Cannot move a card into its own child', 'error');
          return;
        }
        
        pushUndo('moveCard', {
          cardId: draggedCardId,
          originalParentId: draggedCard.parentId,
          newParentId: targetCardId
        });
        
        if (draggedCard.parentId) {
          var oldParent = store.cards[draggedCard.parentId];
          if (oldParent) {
            oldParent.children = oldParent.children.filter(function(c) { return c !== draggedCardId; });
          }
        } else {
          store.rootOrder = store.rootOrder.filter(function(c) { return c !== draggedCardId; });
        }
        
        draggedCard.parentId = targetCardId;
        if (!targetCard.children.includes(draggedCardId)) {
          targetCard.children.push(draggedCardId);
        }
        
        draggedCard.updatedAt = Date.now();
        save();
        render();
        
        showToast('Moved "' + (draggedCard.title || '(Untitled)') + '" to "' + (targetCard.title || '(Untitled)') + '"');
      }
      
      /**
       * Check if a card is a descendant of another
       */
      function isDescendant(cardId, ancestorId) {
        var ancestor = store.cards[ancestorId];
        if (!ancestor) return false;
        if (ancestor.children.includes(cardId)) return true;
        return ancestor.children.some(function(childId) { return isDescendant(cardId, childId); });
      }
      
      /**
       * Reorder cards within a parent
       */
      function reorderCard(parentId, cardId, newIndex) {
        if (parentId) {
          var parent = store.cards[parentId];
          if (!parent || !parent.children.includes(cardId)) return;
          parent.children = parent.children.filter(function(c) { return c !== cardId; });
          parent.children.splice(newIndex, 0, cardId);
        } else {
          if (!store.rootOrder.includes(cardId)) return;
          store.rootOrder = store.rootOrder.filter(function(c) { return c !== cardId; });
          store.rootOrder.splice(newIndex, 0, cardId);
        }
        save();
        render();
      }

      /**
       * Edit dataset name
       */
      function editDatasetName() {
        var currentName = (store.metadata && store.metadata.name) || instanceKey;
        var newName = prompt('Enter new dataset name:', currentName);
        if (newName && newName.trim() && newName.trim() !== currentName) {
          if (!store.metadata) store.metadata = {};
          store.metadata.name = newName.trim();
          store.metadata.updatedAt = Date.now();
          // Update the datasets registry
          const datasets = JSON.parse(localStorage.getItem('cardspoke_datasets') || '{}');
          if (datasets[instanceKey]) {
            datasets[instanceKey].name = newName.trim();
            localStorage.setItem('cardspoke_datasets', JSON.stringify(datasets));
          }
          save();
          showToast('Dataset renamed to: ' + newName.trim());
          render();
        }
      }


      // =============================================================
      // --- KEYBOARD SHORTCUTS ---
      // Global keyboard shortcuts for navigation and actions
      // =============================================================
      
      const shortcuts = {
        'ctrl+h': { action: () => goTo('list'), description: 'Go to Home (card list)' },
        'ctrl+n': { action: () => { menu.newCard.click(); }, description: 'New card' },
        'ctrl+f': { action: () => { searchInput.focus(); }, description: 'Focus search' },
        'ctrl+b': { action: () => { menu.bookmarks.click(); closeMenu(); }, description: 'Show bookmarks' },
        'ctrl+r': { action: () => { menu.recentCards.click(); closeMenu(); }, description: 'Show recent cards' },
        'ctrl+e': { action: () => { showPluginManager('installed'); closeMenu(); }, description: 'Show plugin manager' },
        'ctrl+u': { action: () => { menu.upload.click(); closeMenu(); }, description: 'Upload data' },
        'ctrl+/': { action: () => showKeyboardHelp(), description: 'Show this help' },
        'ctrl+z': { action: () => undo(), description: 'Undo last action' },
        'ctrl+y': { action: () => redo(), description: 'Redo last action' },
        'escape': { action: () => handleEscape(), description: 'Close modals/go back' },
        'alt+t': { action: () => { header.themeToggle.click(); }, description: 'Toggle theme' },
        'alt+c': { action: () => toggleViewMode(), description: 'Toggle compact view' },
        'ctrl+d': { action: () => { 
          if (navState.page === 'read' && navState.cardId) {
            const card = store.cards[navState.cardId];
            if (card) {
              const choice = confirm('Duplicate with children?\n\nOK = Yes (with children)\nCancel = No (only this card)');
              const newId = duplicateCard(navState.cardId, choice);
              if (newId) {
                showToast('Card duplicated successfully');
                goTo('read', { cardId: newId });
              }
            }
          }
        }, description: 'Duplicate current card' },
        'ctrl+t': { action: () => {
          if (navState.page === 'edit') {
            const tagsInput = document.getElementById('cardTags');
            if (tagsInput) tagsInput.focus();
          }
        }, description: 'Focus tags input (when editing)' },
        'ctrl+[': { action: () => {
          if (navState.page === 'read' && navState.cardId) {
            const card = store.cards[navState.cardId];
            if (card && card.parentId) {
              goTo('read', { cardId: card.parentId });
            } else {
              goTo('list');
            }
          }
        }, description: 'Navigate to parent card' },
        'ctrl+]': { action: () => {
          if (navState.page === 'read' && navState.cardId) {
            const card = store.cards[navState.cardId];
            if (card && card.children.length > 0) {
              goTo('read', { cardId: card.children[0] });
            }
          }
        }, description: 'Navigate to first child card' },
        'ctrl+g': { action: () => {
          // Toggle between list and grid view
          const gridModeEnabled = localStorage.getItem('cardspoke_gridView') === 'true';
          localStorage.setItem('cardspoke_gridView', (!gridModeEnabled).toString());
          showToast(gridModeEnabled ? 'List view enabled' : 'Grid view enabled');
          render();
        }, description: 'Toggle grid/list view' },
      };
      
      function handleEscape() {
        // Close menu if open
        if (menu.overlay.classList.contains('show')) {
          closeMenu();
          return;
        }
        // Close upload modal if open
        if (uploadModal.overlay.classList.contains('show')) {
          uploadModal.overlay.classList.remove('show');
          return;
        }
        // Close help if open
        const helpModal = document.getElementById('keyboardHelpModal');
        if (helpModal && helpModal.classList.contains('show')) {
          helpModal.classList.remove('show');
          return;
        }
        // Otherwise go back if we can
        if (navHistory.length > 0) {
          goBack();
        }
      }
      
      function closeMenu() {
        menu.overlay.classList.remove('show');
      }
      
      
      /**
       * Show typography preset selector modal
       */
      function showTypographySelector() {
        const currentTypography = localStorage.getItem('cardspoke_typography') || 'default';
        
        const modal = h('div', { 
          id: 'typographyModal', 
          className: 'menu-overlay show',
          onclick: (e) => { if (e.target === modal) modal.remove(); }
        },
          h('div', { className: 'menu-panel' },
            h('div', { className: 'menu-header' },
              h('div', { className: 'menu-title' }, 'Typography'),
              h('button', { 
                className: 'menu-close',
                onclick: () => modal.remove()
              }, '✕')
            ),
            h('div', { className: 'typography-presets' },
              h('div', { className: 'preset-description' }, 'Choose a reading mode that suits your preference:'),
              ...[
                { id: 'default', name: 'Default', desc: '16px, comfortable line height' },
                { id: 'comfortable', name: 'Comfortable', desc: '18px, extra line height for relaxed reading' },
                { id: 'compact', name: 'Compact', desc: '14px, tighter spacing for more content' },
                { id: 'dyslexia', name: 'Dyslexia-Friendly', desc: '18px, wider spacing, readable font' }
              ].map(preset => 
                h('div', { 
                  className: `preset-option ${currentTypography === preset.id ? 'active' : ''}`,
                  onclick: () => {
                    localStorage.setItem('cardspoke_typography', preset.id);
                    document.documentElement.setAttribute('data-typography', preset.id);
                    showToast(`Typography: ${preset.name}`);
                    modal.remove();
                  }
                },
                  h('div', { className: 'preset-name' }, preset.name),
                  h('div', { className: 'preset-desc' }, preset.desc)
                )
              )
            )
          )
        );
        
        document.body.appendChild(modal);
      }

      /**
       * Generate smart tag suggestions for a card based on content
       * @param {string} cardId - Card ID to analyze
       * @param {number} limit - Maximum number of suggestions (default: 5)
       * @returns {Array<{tag: string, score: number}>} Suggested tags with relevance scores
       */
      function suggestTags(cardId, limit = 5) {
        const card = store.cards[cardId];
        if (!card) return [];
        
        const existingTags = getTags(cardId);
        const allExistingTags = getAllTags();
        const suggestions = [];
        
        // Combine title and body for analysis
        const content = ((card.title || '') + ' ' + (card.body || '')).toLowerCase();
        
        // Get tags from other cards with similar content
        for (const tag of allExistingTags) {
          if (existingTags.includes(tag)) continue; // Skip already applied tags
          
          // Find cards with this tag
          const cardsWithTag = Object.values(store.cards).filter(c => 
            c.tags && c.tags.includes(tag)
          );
          
          // Calculate relevance based on content similarity
          let totalScore = 0;
          for (const otherCard of cardsWithTag) {
            const otherContent = ((otherCard.title || '') + ' ' + (otherCard.body || '')).toLowerCase();
            
            // Simple word overlap scoring
            const contentWords = new Set(content.split(/\s+/).filter(w => w.length > 3));
            const otherWords = new Set(otherContent.split(/\s+/).filter(w => w.length > 3));
            const commonWords = [...contentWords].filter(w => otherWords.has(w));
            
            if (commonWords.length > 0) {
              totalScore += commonWords.length / Math.max(contentWords.size, otherWords.size);
            }
          }
          
          if (totalScore > 0) {
            suggestions.push({
              tag,
              score: totalScore / cardsWithTag.length
            });
          }
        }
        
        // Sort by score and return top suggestions
        suggestions.sort((a, b) => b.score - a.score);
        return suggestions.slice(0, limit);
      }
      
      /**
       * Show smart tag suggestions modal
       * @param {string} cardId - Card ID to suggest tags for
       */
      function showTagSuggestions(cardId) {
        const card = store.cards[cardId];
        if (!card) return;
        
        const suggestions = suggestTags(cardId, 8);
        
        if (suggestions.length === 0) {
          showToast('No tag suggestions available', 'info');
          return;
        }
        
        const modal = h('div', { 
          id: 'tagSuggestionsModal', 
          className: 'menu-overlay show',
          onclick: (e) => { if (e.target === modal) modal.remove(); }
        },
          h('div', { className: 'menu-panel' },
            h('div', { className: 'menu-header' },
              h('div', { className: 'menu-title' }, 'Suggested Tags'),
              h('button', { 
                className: 'menu-close',
                onclick: () => modal.remove()
              }, '✕')
            ),
            h('div', { className: 'tag-suggestions' },
              h('div', { className: 'suggestion-description' }, 
                `Based on similar cards, you might want to add these tags:`
              ),
              ...suggestions.map(({ tag, score }) => 
                h('button', { 
                  className: 'suggestion-tag',
                  onclick: () => {
                    addTag(cardId, tag);
                    showToast(`✓ Tag "${tag}" added`);
                    modal.remove();
                    render();
                  }
                },
                  h('span', { className: 'tag-name' }, tag),
                  h('span', { className: 'tag-score' }, `${Math.round(score * 100)}% match`)
                )
              ),
              h('button', {
                className: 'btn btn-primary',
                onclick: () => {
                  // Apply all suggestions
                  suggestions.forEach(({ tag }) => addTag(cardId, tag, true));
                  save();
                  showToast(`✓ ${suggestions.length} tags added`);
                  modal.remove();
                  render();
                }
              }, `Apply All ${suggestions.length} Tags`)
            )
          )
        );
        
        document.body.appendChild(modal);
      }

      // =========================================================
      // Share Card Feature (v1.0.0)
      // =========================================================

      /**
       * Get card and all descendants as an object
       */
      function getCardWithDescendants(cardId) {
        const card = store.cards[cardId];
        if (!card) return null;

        const result = {
          id: card.id,
          title: card.title,
          body: card.body,
          tags: card.tags || [],
          createdAt: card.createdAt,
          updatedAt: card.updatedAt,
          children: []
        };

        if (card.children && card.children.length > 0) {
          card.children.forEach(childId => {
            const childData = getCardWithDescendants(childId);
            if (childData) result.children.push(childData);
          });
        }

        return result;
      }

      /**
       * Convert card tree to Markdown
       */
      function cardToMarkdown(cardData, depth = 0) {
        let md = '';
        const indent = '  '.repeat(depth);
        const headingLevel = Math.min(depth + 1, 6);
        const heading = '#'.repeat(headingLevel);

        md += `${heading} ${cardData.title || '(Untitled)'}\n\n`;

        if (cardData.tags && cardData.tags.length > 0) {
          md += `*Tags: ${cardData.tags.map(t => '#' + t).join(', ')}*\n\n`;
        }

        if (cardData.body) {
          md += `${cardData.body}\n\n`;
        }

        if (cardData.children && cardData.children.length > 0) {
          cardData.children.forEach(child => {
            md += cardToMarkdown(child, depth + 1);
          });
        }

        return md;
      }

      /**
       * Show share options for a card
       */
      function showShareCard(cardId) {
        const card = store.cards[cardId];
        if (!card) {
          showToast('Card not found', 'error');
          return;
        }

        const modal = h('div', {
          className: 'modal-overlay show',
          onclick: (e) => { if (e.target === modal) modal.remove(); }
        },
          h('div', { className: 'modal', style: 'max-width: 600px;' },
            h('div', { className: 'modal-header' },
              h('div', { className: 'modal-title' }, 'Share Card'),
              h('button', {
                className: 'modal-close',
                'aria-label': 'Close',
                onclick: () => modal.remove()
              }, '✕')
            ),
            h('div', { className: 'modal-body' },
              h('p', { style: 'margin-bottom: var(--space-xl); color: var(--text-secondary);' },
                'Copy this card in different formats to share with others.'
              ),

              // Card only - JSON
              h('div', { style: 'margin-bottom: var(--space-lg);' },
                h('h3', { style: 'margin-bottom: var(--space-md);' }, 'Card Only'),
                h('button', {
                  className: 'btn btn-primary',
                  style: 'width: 100%; margin-bottom: var(--space-sm);',
                  onclick: () => {
                    const cardData = {
                      id: card.id,
                      title: card.title,
                      body: card.body,
                      tags: card.tags || []
                    };
                    navigator.clipboard.writeText(JSON.stringify(cardData, null, 2))
                      .then(() => {
                        showToast('Card copied as JSON');
                        modal.remove();
                      })
                      .catch(() => showToast('Failed to copy', 'error'));
                  }
                }, 'Copy as JSON'),
                h('button', {
                  className: 'btn',
                  style: 'width: 100%;',
                  onclick: () => {
                    let md = `# ${card.title || '(Untitled)'}\n\n`;
                    if (card.tags && card.tags.length > 0) {
                      md += `*Tags: ${card.tags.map(t => '#' + t).join(', ')}*\n\n`;
                    }
                    md += card.body || '';
                    navigator.clipboard.writeText(md)
                      .then(() => {
                        showToast('Card copied as Markdown');
                        modal.remove();
                      })
                      .catch(() => showToast('Failed to copy', 'error'));
                  }
                }, 'Copy as Markdown')
              ),

              // Card + Children
              h('div', { style: 'margin-bottom: var(--space-lg);' },
                h('h3', { style: 'margin-bottom: var(--space-md);' }, 'Card + Children'),
                h('button', {
                  className: 'btn btn-primary',
                  style: 'width: 100%; margin-bottom: var(--space-sm);',
                  onclick: () => {
                    const cardData = getCardWithDescendants(card.id);
                    navigator.clipboard.writeText(JSON.stringify(cardData, null, 2))
                      .then(() => {
                        showToast('Card tree copied as JSON');
                        modal.remove();
                      })
                      .catch(() => showToast('Failed to copy', 'error'));
                  }
                }, 'Copy Tree as JSON'),
                h('button', {
                  className: 'btn',
                  style: 'width: 100%;',
                  onclick: () => {
                    const cardData = getCardWithDescendants(card.id);
                    const md = cardToMarkdown(cardData);
                    navigator.clipboard.writeText(md)
                      .then(() => {
                        showToast('Card tree copied as Markdown');
                        modal.remove();
                      })
                      .catch(() => showToast('Failed to copy', 'error'));
                  }
                }, 'Copy Tree as Markdown')
              ),

              h('div', { style: 'font-size: var(--text-sm); color: var(--text-secondary); padding: var(--space-md); background: var(--bg-secondary); border-radius: var(--radius);' },
                'Tip: Use JSON format to import the card into another CardSpoke instance. Use Markdown to share in documents or emails.'
              )
            )
          )
        );

        document.body.appendChild(modal);
      }

      // =========================================================
      // Getting Started Guide (v1.0.0)
      // =========================================================
      function showGettingStarted() {
        let modal = document.getElementById('gettingStartedModal');

        if (!modal) {
          modal = h('div', {
            id: 'gettingStartedModal',
            className: 'menu-overlay',
            onclick: (e) => { if (e.target === modal) modal.classList.remove('show'); }
          },
            h('div', { className: 'menu-panel', style: 'max-width: 700px; max-height: 85vh; overflow-y: auto;' },
              h('div', { className: 'menu-header' },
                h('div', { className: 'menu-title' }, 'Getting Started with CardSpoke'),
                h('button', {
                  className: 'menu-close',
                  'aria-label': 'Close',
                  onclick: () => modal.classList.remove('show')
                }, '✕')
              ),
              h('div', { style: 'padding: var(--space-lg);' },
                // Welcome
                h('div', { style: 'margin-bottom: var(--space-xl); text-align: center;' },
                  h('h2', { style: 'margin-bottom: var(--space-sm); color: var(--primary);' }, 'Welcome to CardSpoke!'),
                  h('p', { style: 'color: var(--text-secondary);' }, 'A local-first, lightweight hierarchical note-taking app')
                ),

                // What are Cards?
                h('div', { style: 'margin-bottom: var(--space-xl);' },
                  h('h3', { style: 'margin-bottom: var(--space-md); color: var(--primary);' }, 'What are Cards?'),
                  h('p', { style: 'margin-bottom: var(--space-sm);' },
                    'Cards are the building blocks of CardSpoke. Think of them as notes or ideas that can be organized hierarchically.'
                  ),
                  h('ul', { style: 'margin-left: var(--space-lg); margin-bottom: var(--space-sm);' },
                    h('li', { style: 'margin-bottom: var(--space-xs);' }, 'Each card has a title and body content'),
                    h('li', { style: 'margin-bottom: var(--space-xs);' }, 'Cards can have child cards to create nested structures'),
                    h('li', { style: 'margin-bottom: var(--space-xs);' }, 'Organize your thoughts in a hierarchy that makes sense to you')
                  )
                ),

                // Creating Cards
                h('div', { style: 'margin-bottom: var(--space-xl);' },
                  h('h3', { style: 'margin-bottom: var(--space-md); color: var(--primary);' }, 'Creating Cards'),
                  h('div', { style: 'background: var(--bg-secondary); padding: var(--space-md); border-radius: var(--radius); border-left: 3px solid var(--primary); margin-bottom: var(--space-md);' },
                    h('p', { style: 'font-weight: 600; margin-bottom: var(--space-xs);' }, 'To create your first card:'),
                    h('ol', { style: 'margin-left: var(--space-lg);' },
                      h('li', { style: 'margin-bottom: var(--space-xs);' }, 'Click the menu button (☰) in the top right'),
                      h('li', { style: 'margin-bottom: var(--space-xs);' }, 'Select "New Card" or press Ctrl+N'),
                      h('li', { style: 'margin-bottom: var(--space-xs);' }, 'Add a title and body text'),
                      h('li', {}, 'Click "Save Card"')
                    )
                  ),
                  h('p', { style: 'margin-bottom: var(--space-sm);' },
                    'To create a child card, open any existing card and click the "Add Child Card" button. Child cards appear nested under their parent.'
                  )
                ),

                // Tags
                h('div', { style: 'margin-bottom: var(--space-xl);' },
                  h('h3', { style: 'margin-bottom: var(--space-md); color: var(--primary);' }, 'Using Tags'),
                  h('p', { style: 'margin-bottom: var(--space-sm);' },
                    'Tags help you categorize and find cards quickly:'
                  ),
                  h('ul', { style: 'margin-left: var(--space-lg); margin-bottom: var(--space-sm);' },
                    h('li', { style: 'margin-bottom: var(--space-xs);' }, 'Add tags when creating or editing a card'),
                    h('li', { style: 'margin-bottom: var(--space-xs);' }, 'Click on a tag to see all cards with that tag'),
                    h('li', { style: 'margin-bottom: var(--space-xs);' }, 'Use Tag Manager (in menu) to rename, merge, or delete tags')
                  )
                ),

                // Search
                h('div', { style: 'margin-bottom: var(--space-xl);' },
                  h('h3', { style: 'margin-bottom: var(--space-md); color: var(--primary);' }, 'Finding Cards with Search'),
                  h('p', { style: 'margin-bottom: var(--space-sm);' },
                    'CardSpoke has powerful search capabilities:'
                  ),
                  h('ul', { style: 'margin-left: var(--space-lg); margin-bottom: var(--space-sm);' },
                    h('li', { style: 'margin-bottom: var(--space-xs);' }, 'Press Ctrl+F or click the search icon to search'),
                    h('li', { style: 'margin-bottom: var(--space-xs);' }, 'Use ↑/↓ arrow keys to navigate results'),
                    h('li', { style: 'margin-bottom: var(--space-xs);' }, 'Press Enter to open the selected card'),
                    h('li', { style: 'margin-bottom: var(--space-xs);' }, 'Search works across titles, content, and tags')
                  )
                ),

                // Other Features
                h('div', { style: 'margin-bottom: var(--space-xl);' },
                  h('h3', { style: 'margin-bottom: var(--space-md); color: var(--primary);' }, 'More Features'),
                  h('div', { style: 'display: grid; gap: var(--space-md);' },
                    h('div', {},
                      h('strong', {}, 'Bookmarks'), ' — Click the star icon on any card to bookmark it for quick access'
                    ),
                    h('div', {},
                      h('strong', {}, 'Undo/Redo'), ' — Press Ctrl+Z to undo and Ctrl+Y to redo changes'
                    ),
                    h('div', {},
                      h('strong', {}, 'Export'), ' — Save your data in JSON, Markdown, or CSV formats (Data & Export menu)'
                    ),
                    h('div', {},
                      h('strong', {}, 'Backups'), ' — Create manual backups anytime from the Data & Export menu'
                    ),
                    h('div', {},
                      h('strong', {}, 'Plugins'), ' — Customize CardSpoke with themes and plugins (Plugin Manager)'
                    ),
                    h('div', {},
                      h('strong', {}, 'Dark Mode'), ' — Toggle dark mode with the moon icon in the header'
                    )
                  )
                ),

                // Privacy Note
                h('div', { style: 'margin-bottom: var(--space-lg);' },
                  h('div', { style: 'background: var(--bg-secondary); padding: var(--space-md); border-radius: var(--radius);' },
                    h('p', { style: 'margin-bottom: var(--space-xs); font-weight: 600;' }, 'Your Privacy Matters'),
                    h('p', { style: 'color: var(--text-secondary); font-size: 0.9rem;' },
                      'All your data is stored locally on your device. CardSpoke never sends your data to any server. You have complete control and ownership of your information.'
                    )
                  )
                ),

                // Get Started Button
                h('div', { style: 'text-align: center;' },
                  h('button', {
                    className: 'btn btn-primary',
                    style: 'padding: var(--space-md) var(--space-xl);',
                    onclick: () => {
                      modal.classList.remove('show');
                      // Mark as seen
                      localStorage.setItem('cardspoke_hasSeenGettingStarted', 'true');
                      // Open new card creation
                      goTo('edit', { cardId: null, parentId: null });
                    }
                  }, 'Create Your First Card')
                )
              )
            )
          );
          document.body.appendChild(modal);
        }

        modal.classList.add('show');
      }

      // =========================================================
      // In-app Help Modal (v0.12.1)
      // =========================================================
      function showHelp() {
        let helpModal = document.getElementById('inAppHelpModal');
        
        if (!helpModal) {
          helpModal = h('div', { 
            id: 'inAppHelpModal', 
            className: 'menu-overlay',
            onclick: (e) => { if (e.target === helpModal) helpModal.classList.remove('show'); }
          },
            h('div', { className: 'menu-panel', style: 'max-width: 600px; max-height: 80vh; overflow-y: auto;' },
              h('div', { className: 'menu-header' },
                h('div', { className: 'menu-title' }, 'Help & Documentation'),
                h('button', { 
                  className: 'menu-close',
                  onclick: () => helpModal.classList.remove('show')
                }, '✕')
              ),
              h('div', { style: 'padding: var(--space-md);' },
                // Quick Start Section
                h('div', { style: 'margin-bottom: var(--space-lg);' },
                  h('h3', { style: 'margin-bottom: var(--space-sm); color: var(--primary);' }, 'Quick Start'),
                  h('p', { style: 'margin-bottom: var(--space-xs);' }, '1. Click "New Card" to create your first card'),
                  h('p', { style: 'margin-bottom: var(--space-xs);' }, '2. Add content, tags, and child cards'),
                  h('p', { style: 'margin-bottom: var(--space-xs);' }, '3. Use search to find cards quickly'),
                  h('p', {}, '4. Organize with bookmarks and recent cards')
                ),
                
                // Features Section
                h('div', { style: 'margin-bottom: var(--space-lg);' },
                  h('h3', { style: 'margin-bottom: var(--space-sm); color: var(--primary);' }, 'Key Features'),
                  h('div', { style: 'display: grid; gap: var(--space-sm);' },
                    h('div', {}, h('strong', {}, 'Cards'), ' — Hierarchical notes with parent-child relationships'),
                    h('div', {}, h('strong', {}, 'Tags'), ' — Organize and filter cards with tags'),
                    h('div', {}, h('strong', {}, 'Links'), ' — Reference other cards with [[Card Name]]'),
                    h('div', {}, h('strong', {}, 'Search'), ' — Fuzzy search across all cards'),
                    h('div', {}, h('strong', {}, 'Bookmarks'), ' — Star important cards for quick access'),
                    h('div', {}, h('strong', {}, 'Undo/Redo'), ' — Ctrl+Z / Ctrl+Y for changes'),
                    h('div', {}, h('strong', {}, 'Trash Bin'), ' — Recover deleted cards'),
                    h('div', {}, h('strong', {}, 'Plugins'), ' — Customize with themes and plugins')
                  )
                ),
                
                // Keyboard Shortcuts Section
                h('div', { style: 'margin-bottom: var(--space-lg);' },
                  h('h3', { style: 'margin-bottom: var(--space-sm); color: var(--primary);' }, 'Keyboard Shortcuts'),
                  h('div', { style: 'display: grid; grid-template-columns: auto 1fr; gap: var(--space-xs) var(--space-md);' },
                    h('kbd', { style: 'background: var(--bg-alt); padding: 2px 6px; border-radius: 4px;' }, 'Ctrl+N'),
                    h('span', {}, 'New card'),
                    h('kbd', { style: 'background: var(--bg-alt); padding: 2px 6px; border-radius: 4px;' }, 'Ctrl+F'),
                    h('span', {}, 'Search'),
                    h('kbd', { style: 'background: var(--bg-alt); padding: 2px 6px; border-radius: 4px;' }, 'Ctrl+Z'),
                    h('span', {}, 'Undo'),
                    h('kbd', { style: 'background: var(--bg-alt); padding: 2px 6px; border-radius: 4px;' }, 'Ctrl+Y'),
                    h('span', {}, 'Redo'),
                    h('kbd', { style: 'background: var(--bg-alt); padding: 2px 6px; border-radius: 4px;' }, 'Ctrl+/'),
                    h('span', {}, 'All shortcuts')
                  )
                ),
                
                // Plugins Section
                h('div', { style: 'margin-bottom: var(--space-lg);' },
                  h('h3', { style: 'margin-bottom: var(--space-sm); color: var(--primary);' }, 'Plugins'),
                  h('p', { style: 'margin-bottom: var(--space-xs);' }, 'CardSpoke supports JSON-based plugins in three layers:'),
                  h('ul', { style: 'margin-left: var(--space-md); margin-bottom: var(--space-sm);' },
                    h('li', {}, 'Theme plugins: CSS-only visual changes'),
                    h('li', {}, 'Feature plugins: Add new functionality with JS hooks'),
                    h('li', {}, 'App plugins: Full app transformations with overrides')
                  ),
                  h('p', { style: 'font-size: var(--text-sm); color: var(--text-secondary);' },
                    'Access Plugin Manager from the menu to install and manage plugins.'
                  )
                ),
                
                // Advanced Features Section
                h('div', { style: 'margin-bottom: var(--space-lg);' },
                  h('h3', { style: 'margin-bottom: var(--space-sm); color: var(--primary);' }, 'Advanced Features'),
                  h('div', { style: 'display: grid; gap: var(--space-sm);' },
                    h('div', {}, 
                      h('strong', {}, 'Tag Manager'), 
                      ' — Rename, merge, or delete tags across all cards. Access from the menu.'
                    ),
                    h('div', {}, 
                      h('strong', {}, 'Advanced Search'), 
                      ' — Filter cards by tag, bookmark status, or date range. Access from the menu.'
                    ),
                    h('div', {}, 
                      h('strong', {}, 'Datasets'), 
                      ' — Create multiple isolated data vaults. Access from Data & Export menu.'
                    ),
                    h('div', {}, 
                      h('strong', {}, 'Developer Mode'), 
                      ' — Enable in Appearance settings to access debugging tools and system information.'
                    )
                  )
                ),
                
                // Data & Privacy Section
                h('div', { style: 'margin-bottom: var(--space-lg);' },
                  h('h3', { style: 'margin-bottom: var(--space-sm); color: var(--primary);' }, 'Data & Privacy'),
                  h('p', {}, 'Your data is stored locally on your device. CardSpoke never sends your data to external servers. Export anytime to JSON, Markdown, or CSV.')
                ),

                // Language & Localization Section (v1.0.0)
                h('div', { style: 'margin-bottom: var(--space-lg);' },
                  h('h3', { style: 'margin-bottom: var(--space-sm); color: var(--primary);' }, 'Language & Localization'),
                  h('p', { style: 'margin-bottom: var(--space-sm);' },
                    'CardSpoke supports community language packs. Visit the CardSpoke website to download language packs for your preferred language.'
                  ),
                  h('p', { style: 'font-size: var(--text-sm); color: var(--text-secondary);' },
                    'Coming soon: Download language packs from ',
                    h('a', {
                      href: 'https://github.com/jxburros/CardSpoke/wiki/Language-Packs',
                      target: '_blank',
                      style: 'color: var(--primary);'
                    }, 'CardSpoke Language Packs')
                  )
                ),

                // Version Info
                h('div', { style: 'padding-top: var(--space-md); border-top: 1px solid var(--border); text-align: center; color: var(--text-secondary);' },
                  h('p', {}, `CardSpoke v${APP_VERSION}`),
                  h('p', { style: 'font-size: var(--text-sm);' },
                    h('a', { href: 'https://github.com/jxburros/CardSpoke', target: '_blank', style: 'color: var(--primary);' }, 'GitHub'),
                    ' · ',
                    h('a', { href: 'https://github.com/jxburros/CardSpoke/blob/main/README.md', target: '_blank', style: 'color: var(--primary);' }, 'Documentation')
                  )
                )
              )
            )
          );
          document.body.appendChild(helpModal);
        }
        
        helpModal.classList.add('show');
      }

      function showKeyboardHelp() {
        let helpModal = document.getElementById('keyboardHelpModal');
        
        if (!helpModal) {
          // Create help modal
          helpModal = h('div', { 
            id: 'keyboardHelpModal', 
            className: 'menu-overlay',
            onclick: (e) => { if (e.target === helpModal) helpModal.classList.remove('show'); }
          },
            h('div', { className: 'menu-panel' },
              h('div', { className: 'menu-header' },
                h('div', { className: 'menu-title' }, 'Keyboard Shortcuts'),
                h('button', { 
                  className: 'menu-close',
                  onclick: () => helpModal.classList.remove('show')
                }, '✕')
              ),
              h('div', { className: 'keyboard-shortcuts' },
                h('div', { className: 'shortcuts-section' },
                  h('div', { className: 'shortcuts-section-title' }, 'Navigation'),
                  ...Object.entries(shortcuts)
                    .filter(([key]) => ['ctrl+h', 'ctrl+b', 'ctrl+r', 'escape'].includes(key))
                    .map(([key, { description }]) => 
                      h('div', { className: 'shortcut-item' },
                        h('kbd', {}, key.replace('ctrl+', 'Ctrl+')),
                        h('span', {}, description)
                      )
                    )
                ),
                h('div', { className: 'shortcuts-section' },
                  h('div', { className: 'shortcuts-section-title' }, 'Actions'),
                  ...Object.entries(shortcuts)
                    .filter(([key]) => ['ctrl+n', 'ctrl+f', 'ctrl+u', 'ctrl+e'].includes(key))
                    .map(([key, { description }]) => 
                      h('div', { className: 'shortcut-item' },
                        h('kbd', {}, key.replace('ctrl+', 'Ctrl+')),
                        h('span', {}, description)
                      )
                    )
                ),
                h('div', { className: 'shortcuts-section' },
                  h('div', { className: 'shortcuts-section-title' }, 'View'),
                  ...Object.entries(shortcuts)
                    .filter(([key]) => ['alt+t', 'alt+c'].includes(key))
                    .map(([key, { description }]) => 
                      h('div', { className: 'shortcut-item' },
                        h('kbd', {}, key.replace('alt+', 'Alt+')),
                        h('span', {}, description)
                      )
                    )
                ),
                h('div', { className: 'shortcuts-section' },
                  h('div', { className: 'shortcuts-section-title' }, 'Help'),
                  h('div', { className: 'shortcut-item' },
                    h('kbd', {}, 'Ctrl+/'),
                    h('span', {}, 'Show this help')
                  )
                )
              )
            )
          );
          document.body.appendChild(helpModal);
        }
        
        helpModal.classList.add('show');
      }
      
      // Global keyboard event handler
      document.addEventListener('keydown', (e) => {
        // Don't trigger shortcuts when typing in inputs
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
          // Allow Escape to work in inputs
          if (e.key === 'Escape') {
            e.target.blur();
            handleEscape();
          }
          return;
        }
        
        // Build shortcut key string
        let key = e.key.toLowerCase();
        if (e.ctrlKey || e.metaKey) key = 'ctrl+' + key;
        if (e.altKey) key = 'alt+' + key;
        
        // Execute shortcut if it exists
        const shortcut = shortcuts[key];
        if (shortcut) {
          e.preventDefault();
          try {
            shortcut.action();
          } catch (error) {
            console.error('Keyboard shortcut error:', error);
            showToast('Shortcut failed: ' + key, 'error');
          }
        }
      });

      // =============================================================
      // --- DEVELOPER CONSOLE (v0.16.1) ---
      // Show debugging information when developer mode is enabled
      // =============================================================
      
      /**
       * Show developer console with debugging information
       */
      function showDeveloperConsole() {
        const overlay = h('div', { className: 'modal-overlay show' });
        const modal = h('div', { className: 'modal', style: 'max-width: 800px;' });
        const modalHeader = h('div', { className: 'modal-header' });
        modalHeader.appendChild(h('div', { className: 'modal-title' }, '🔧 Developer Console'));
        const closeBtn = h('button', { 
          className: 'modal-close', 
          'aria-label': 'Close developer console',
          onclick: () => overlay.remove() 
        }, 'X');
        modalHeader.appendChild(closeBtn);
        modal.appendChild(modalHeader);
        
        const modalBody = h('div', { className: 'modal-body', style: 'max-height: 70vh; overflow-y: auto;' });
        
        // System Information
        const sysSection = h('div', { style: 'margin-bottom: var(--space-xl); padding: var(--space-lg); background: var(--bg-secondary); border-radius: var(--radius);' });
        sysSection.appendChild(h('div', { style: 'font-weight: 700; margin-bottom: var(--space-md); font-size: var(--text-lg);' }, '📊 System Information'));
        
        const sysInfo = [
          { label: 'App Version', value: APP_VERSION },
          { label: 'Schema Version', value: store.schemaVersion || 'N/A' },
          { label: 'Active Dataset', value: datasetManager ? datasetManager.getActiveDataset().name : 'Default' },
          { label: 'Total Cards', value: Object.keys(store.cards).length },
          { label: 'Root Cards', value: store.rootOrder.length },
          { label: 'Total Tags', value: getAllTags().length },
          { label: 'Active Plugins', value: store.plugins ? Object.keys(store.plugins).length : 0 },
          { label: 'Developer Mode', value: isDeveloperMode() ? '✓ Enabled' : '✗ Disabled' }
        ];
        
        sysInfo.forEach(info => {
          const row = h('div', { style: 'display: flex; justify-content: space-between; padding: var(--space-sm) 0; border-bottom: 1px solid var(--border);' });
          row.appendChild(h('span', { style: 'font-weight: 600;' }, info.label + ':'));
          row.appendChild(h('span', { style: 'font-family: monospace; color: var(--text-secondary);' }, String(info.value)));
          sysSection.appendChild(row);
        });
        modalBody.appendChild(sysSection);
        
        // Card Statistics
        const statsSection = h('div', { style: 'margin-bottom: var(--space-xl); padding: var(--space-lg); background: var(--bg-secondary); border-radius: var(--radius);' });
        statsSection.appendChild(h('div', { style: 'font-weight: 700; margin-bottom: var(--space-md); font-size: var(--text-lg);' }, '📈 Card Statistics'));
        
        const bookmarkedCount = Object.values(store.cards).filter(c => c.bookmarked).length;
        const withTagsCount = Object.values(store.cards).filter(c => c.tags && c.tags.length > 0).length;
        const withChildrenCount = Object.values(store.cards).filter(c => c.children && c.children.length > 0).length;
        
        const stats = [
          { label: 'Bookmarked Cards', value: bookmarkedCount },
          { label: 'Cards with Tags', value: withTagsCount },
          { label: 'Cards with Children', value: withChildrenCount },
          { label: 'Orphaned Cards', value: Object.values(store.cards).filter(c => !c.parentId && !store.rootOrder.includes(c.id)).length }
        ];
        
        stats.forEach(stat => {
          const row = h('div', { style: 'display: flex; justify-content: space-between; padding: var(--space-sm) 0; border-bottom: 1px solid var(--border);' });
          row.appendChild(h('span', { style: 'font-weight: 600;' }, stat.label + ':'));
          row.appendChild(h('span', { style: 'font-family: monospace; color: var(--text-secondary);' }, String(stat.value)));
          statsSection.appendChild(row);
        });
        modalBody.appendChild(statsSection);
        
        // Recent Activity
        const activitySection = h('div', { style: 'margin-bottom: var(--space-xl); padding: var(--space-lg); background: var(--bg-secondary); border-radius: var(--radius);' });
        activitySection.appendChild(h('div', { style: 'font-weight: 700; margin-bottom: var(--space-md); font-size: var(--text-lg);' }, '🕐 Recent Activity'));
        
        const recentCards = Object.values(store.cards)
          .sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0))
          .slice(0, 5);
        
        if (recentCards.length > 0) {
          recentCards.forEach(card => {
            const row = h('div', { 
              style: 'padding: var(--space-sm); border-bottom: 1px solid var(--border); cursor: pointer;',
              onclick: () => {
                overlay.remove();
                goTo('read', { cardId: card.id });
              }
            });
            row.appendChild(h('div', { style: 'font-weight: 600; margin-bottom: var(--space-xs);' }, card.title || '(Untitled)'));
            const timestamp = new Date(card.updatedAt || card.createdAt).toLocaleString();
            row.appendChild(h('div', { style: 'font-size: var(--text-sm); color: var(--text-secondary); font-family: monospace;' }, 
              `ID: ${card.id.slice(0, 8)}... • Updated: ${timestamp}`));
            activitySection.appendChild(row);
          });
        } else {
          activitySection.appendChild(h('div', { style: 'color: var(--text-secondary); font-style: italic;' }, 'No recent activity'));
        }
        modalBody.appendChild(activitySection);
        
        // Storage Information
        const storageSection = h('div', { style: 'margin-bottom: var(--space-xl); padding: var(--space-lg); background: var(--bg-secondary); border-radius: var(--radius);' });
        storageSection.appendChild(h('div', { style: 'font-weight: 700; margin-bottom: var(--space-md); font-size: var(--text-lg);' }, '💾 Storage Information'));
        
        let storageUsed = 0;
        try {
          // Estimate localStorage usage
          let total = 0;
          for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
              total += localStorage[key].length + key.length;
            }
          }
          storageUsed = (total / 1024).toFixed(2);
        } catch (e) {
          storageUsed = 'N/A';
        }
        
        const storageInfo = [
          { label: 'LocalStorage Used', value: storageUsed + ' KB' },
          { label: 'Storage Keys', value: Object.keys(localStorage).filter(k => k.startsWith('cardspoke_')).length }
        ];
        
        storageInfo.forEach(info => {
          const row = h('div', { style: 'display: flex; justify-content: space-between; padding: var(--space-sm) 0; border-bottom: 1px solid var(--border);' });
          row.appendChild(h('span', { style: 'font-weight: 600;' }, info.label + ':'));
          row.appendChild(h('span', { style: 'font-family: monospace; color: var(--text-secondary);' }, String(info.value)));
          storageSection.appendChild(row);
        });
        modalBody.appendChild(storageSection);
        
        // Actions
        const actionsSection = h('div', { style: 'padding: var(--space-lg); background: var(--bg-secondary); border-radius: var(--radius);' });
        actionsSection.appendChild(h('div', { style: 'font-weight: 700; margin-bottom: var(--space-md); font-size: var(--text-lg);' }, '⚡ Quick Actions'));
        
        const actionsRow = h('div', { style: 'display: flex; gap: var(--space-sm); flex-wrap: wrap;' });
        
        const exportBtn = h('button', { 
          className: 'btn btn-primary',
          onclick: () => {
            overlay.remove();
            exportJSON('instance');
          }
        }, 'Export Data');
        actionsRow.appendChild(exportBtn);
        
        const consoleBtn = h('button', { 
          className: 'btn',
          onclick: () => {
            console.log('[Developer Console] Store:', store);
            console.log('[Developer Console] NavState:', navState);
            showToast('Store logged to browser console', 'info');
          }
        }, 'Log to Console');
        actionsRow.appendChild(consoleBtn);
        
        const refreshBtn = h('button', { 
          className: 'btn',
          onclick: () => {
            overlay.remove();
            showDeveloperConsole();
          }
        }, 'Refresh');
        actionsRow.appendChild(refreshBtn);
        
        actionsSection.appendChild(actionsRow);
        modalBody.appendChild(actionsSection);
        
        modal.appendChild(modalBody);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        overlay.onclick = function(e) {
          if (e.target === overlay) overlay.remove();
        };
      }

      // =============================================================
      // --- APPLICATION BOOT ---
      // Initialize and start the application
      // =============================================================
      
      (async function() {
        initToast();                       // Initialize toast container
        load();                          // Load data from localStorage
        populateFooter();                // Populate footer with metadata
        updateDatasetSelector();         // Update dataset selector options

        // Apply saved typography preset
        const savedTypography = localStorage.getItem('cardspoke_typography') || 'default';
        document.documentElement.setAttribute('data-typography', savedTypography);

        // Check for safe mode URL parameter (global for import/reset functions)
        const urlParams = new URLSearchParams(window.location.search);
        let safeMode = urlParams.has('safemode');

        if (safeMode) {
          console.warn('[Safe Mode] Plugins disabled via ?safemode parameter');
          showToast('Safe Mode Active - Plugins Disabled', 'warning');
        }

        // Sync plugins from store after load() but before render()
        if (window.CardSpoke && window.CardSpoke.Plugin && window.CardSpoke.Plugin.syncFromStore) {
          await window.CardSpoke.Plugin.syncFromStore(safeMode);
        }

        // Task 2.5: Apply custom components from ComponentRegistry (Header, Sidebar, SearchBar)
        if (typeof applyRegistryComponents === 'function') {
          applyRegistryComponents();
        }

        render();                        // Initial render
        populateFooter();                // Re-populate footer to ensure it displays

        // First-run detection (v1.0.0) - Show Getting Started guide if no cards exist
        setTimeout(() => {
          const hasSeenGettingStarted = localStorage.getItem('cardspoke_hasSeenGettingStarted');
          const hasCards = Object.keys(store.cards || {}).length > 0;

          if (!hasSeenGettingStarted && !hasCards) {
            showGettingStarted();
          }
        }, 500);

        // Warn user about unsaved changes before leaving
        window.addEventListener('beforeunload', (e) => {
          if (dirty) {
            e.preventDefault();
            e.returnValue = '';
          }
        });
      })();
