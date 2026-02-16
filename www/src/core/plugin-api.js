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
    }
  };

  // Export to window
  if (!window.CardSpoke) window.CardSpoke = {};
  window.CardSpoke.Plugin = PluginManager;

  console.log('[Plugin] API system initialized');
})();
