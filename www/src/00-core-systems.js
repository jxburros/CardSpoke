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
// Version: 0.16.0
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
// Plugin API System
// Provides sandboxed contexts and resource management for plugins
// with isolated contexts and automatic cleanup support

(function() {
  'use strict';

  const plugins = new Map();
  const pluginResources = new Map();
  const dataUpdateListeners = new Map();

  function createUIApi(pluginId) {
    const resources = pluginResources.get(pluginId) || new Set();

    return {
      inject: function(selector, element, position) {
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
        if (window.showToast) {
          window.showToast(message, type || 'info', duration);
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
          return window.cloneCard ? window.cloneCard(window.store.cards[id]) : window.store.cards[id];
        }
        return undefined;
      },

      listCards: function() {
        if (window.store && window.store.cards) {
          return Object.values(window.store.cards).map(function(card) {
            return window.cloneCard ? window.cloneCard(card) : card;
          });
        }
        return [];
      },

      createCard: function(data) {
        if (window.createCard) {
          return window.createCard(data.title || '', data.body || '', data.parentId || null, false, false);
        }
        throw new Error('createCard not available');
      },

      updateCard: function(id, updates) {
        if (window.updateCard) {
          window.updateCard(id, updates, false, false);
          return this.getCard(id);
        }
        throw new Error('updateCard not available');
      },

      deleteCard: function(id) {
        if (window.deleteCard) {
          window.deleteCard(id);
          return true;
        }
        return false;
      },

      getTags: function(cardId) {
        if (window.getTags) {
          return window.getTags(cardId);
        }
        return [];
      },

      addTag: function(cardId, tag) {
        if (window.addTag) {
          return window.addTag(cardId, tag);
        }
        return false;
      },

      removeTag: function(cardId, tag) {
        if (window.removeTag) {
          return window.removeTag(cardId, tag);
        }
        return false;
      },

      setTags: function(cardId, tags) {
        if (window.setTags) {
          return window.setTags(cardId, tags);
        }
        return false;
      },

      getAllTags: function() {
        if (window.getAllTags) {
          return window.getAllTags();
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
        const fullKey = namespace + key;
        if (window.storageDriver && window.storageDriver.get) {
          return await window.storageDriver.get(fullKey);
        }
        return localStorage.getItem(fullKey);
      },

      set: async function(key, value) {
        const fullKey = namespace + key;
        if (window.storageDriver && window.storageDriver.set) {
          return await window.storageDriver.set(fullKey, value);
        }
        localStorage.setItem(fullKey, JSON.stringify(value));
      },

      remove: async function(key) {
        const fullKey = namespace + key;
        if (window.storageDriver && window.storageDriver.remove) {
          return await window.storageDriver.remove(fullKey);
        }
        localStorage.removeItem(fullKey);
      },

      list: async function(prefix) {
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
    const resources = pluginResources.get(pluginId) || new Set();
    const eventHandlers = new Map();

    return {
      on: function(event, callback) {
        const handlers = eventHandlers.get(event) || [];
        handlers.push(callback);
        eventHandlers.set(event, handlers);

        const resource = { type: 'event', event: event, callback: callback };
        resources.add(resource);

        return function() {
          const idx = handlers.indexOf(callback);
          if (idx !== -1) {
            handlers.splice(idx, 1);
          }
          resources.delete(resource);
        };
      },

      emit: function(event) {
        const handlers = eventHandlers.get(event);
        if (handlers) {
          const args = Array.prototype.slice.call(arguments, 1);
          handlers.forEach(function(handler) {
            try {
              handler.apply(null, args);
            } catch (err) {
              console.error('[Plugin:' + pluginId + '] Event handler error:', err);
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
        const handlers = eventHandlers.get(event);
        if (handlers) {
          const idx = handlers.indexOf(callback);
          if (idx !== -1) {
            handlers.splice(idx, 1);
          }
        }
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
      appVersion: window.APP_VERSION || '0.16.0',
      schemaVersion: window.SCHEMA_VERSION || 4,
      api: {
        ui: createUIApi(pluginId),
        data: createDataApi(pluginId),
        storage: createStorageApi(pluginId),
        events: createEventApi(pluginId)
      },
      utils: window.CardSpoke && window.CardSpoke.utils ? window.CardSpoke.utils : {},
      logger: createLogger(pluginId)
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
            }
          } catch (err) {
            console.error('[Plugin] Resource cleanup error:', err);
          }
        });
        resources.clear();
      }
    },

    _checkPermissions: async function(id, permissions) {
      // For now, auto-grant all permissions
      // In production, this should show a consent UI
      console.log('[Plugin] Permissions requested for', id, ':', permissions);
      
      // Show user consent UI if available
      if (window.showPermissionDialog) {
        return await window.showPermissionDialog(id, permissions);
      }
      
      // Auto-grant for now
      return true;
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
     * @param {Object} pkg - Plugin package with manifest, setup, teardown, css
     * @returns {Promise<string>} Plugin ID
     */
    install: async function(pkg) {
      if (!pkg || !pkg.manifest) {
        throw new Error('Invalid plugin package: manifest is required');
      }

      // Generate unique ID
      let id = pkg.manifest.id || pkg.manifest.name.toLowerCase().replace(/\s+/g, '-');
      
      // Ensure uniqueness
      let counter = 1;
      let uniqueId = id;
      while (plugins.has(uniqueId)) {
        uniqueId = id + '-' + counter;
        counter++;
      }
      id = uniqueId;
      
      // Register the plugin
      const definition = {
        manifest: pkg.manifest,
        setup: pkg.setup,
        teardown: pkg.teardown,
        css: pkg.css
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
