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


// Plugin API System
// Provides sandboxed contexts and resource management for plugins
// with isolated contexts and automatic cleanup support

(function() {
  'use strict';

  const plugins = new Map();
  const pluginResources = new Map();
  const dataUpdateListeners = new Map();

  // Stable internal references to core functions (Phase 1.3)
  // Captured at initialization time to prevent plugins from
  // breaking the app by overwriting window functions
  const InternalAPI = {
    data: {},
    ui: {},
    utils: {}
  };

  // Capture core function references once they become available
  function captureInternalReferences() {
    // Data operations
    if (window.createCard) InternalAPI.data.createCard = window.createCard;
    if (window.updateCard) InternalAPI.data.updateCard = window.updateCard;
    if (window.deleteCard) InternalAPI.data.deleteCard = window.deleteCard;
    if (window.cloneCard) InternalAPI.utils.cloneCard = window.cloneCard;
    // Tag operations
    if (window.getTags) InternalAPI.data.getTags = window.getTags;
    if (window.addTag) InternalAPI.data.addTag = window.addTag;
    if (window.removeTag) InternalAPI.data.removeTag = window.removeTag;
    if (window.setTags) InternalAPI.data.setTags = window.setTags;
    if (window.getAllTags) InternalAPI.data.getAllTags = window.getAllTags;
    // UI operations
    if (window.showToast) InternalAPI.ui.showToast = window.showToast;
  }

  // Helper function to check permissions
  function hasPermission(pluginId, permission) {
    if (window.CardSpoke && window.CardSpoke.Permissions) {
      return window.CardSpoke.Permissions.hasPermission(pluginId, permission);
    }
    // Fallback - auto-grant if permissions system not available
    return true;
  }

  function createUIApi(pluginId) {
    const resources = pluginResources.get(pluginId) || new Set();

    return {
      inject: function(selector, element, position) {
        // Check ui-override permission
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
        // Check ui-override permission
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
        // Check ui-override permission
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
          return cloneFn ? cloneFn(window.store.cards[id]) : window.store.cards[id];
        }
        return undefined;
      },

      listCards: function() {
        if (window.store && window.store.cards) {
          var cloneFn = InternalAPI.utils.cloneCard || window.cloneCard;
          return Object.values(window.store.cards).map(function(card) {
            return cloneFn ? cloneFn(card) : card;
          });
        }
        return [];
      },

      createCard: function(data) {
        // Check data-modify permission
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
        // Check data-modify permission
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
        // Check data-modify permission
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
        // Check data-modify permission
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
        // Check data-modify permission
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
        // Check data-modify permission
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
        // Check storage permission
        if (!hasPermission(pluginId, 'storage')) {
          throw new Error('Plugin does not have storage permission');
        }

        const fullKey = namespace + key;
        if (window.storageDriver && window.storageDriver.get) {
          return await window.storageDriver.get(fullKey);
        }
        return localStorage.getItem(fullKey);
      },

      set: async function(key, value) {
        // Check storage permission
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
        // Check storage permission
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
        // Check storage permission
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
      appVersion: window.APP_VERSION || '0.17.0',
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
          
          // Log to plugin context if available
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
          // Log to plugin context if available
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
            // Event handlers are tracked in the event API
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
    }
  };

  // Export to window
  if (!window.CardSpoke) window.CardSpoke = {};
  window.CardSpoke.Plugin = PluginManager;

  console.log('[Plugin] API system initialized');
})();
