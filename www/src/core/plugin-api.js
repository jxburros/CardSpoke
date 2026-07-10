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

import { PluginValidator } from './plugin-validator.js';
import { Permissions } from './permissions.js';
import { ComponentRegistry } from './component-registry.js';
import { Middleware } from './middleware.js';

const plugins = new Map();
const pluginResources = new Map();
const dataUpdateListeners = new Map();

  // Task 1.5: Central global event bus for cross-plugin communication
  // Handlers stored as { pluginId, callback } entries per event name
  const globalEventBus = new Map();

  // Stable internal references to core functions (Phase 1.3)
  // Captured at initialization time to prevent plugins from
  // breaking the app by overwriting window functions
  const InternalAPI = {
    data: {},
    ui: {},
    utils: {}
  };

  // Capture core function references once they become available
  // Only captures each reference once to avoid redundant work
  function captureInternalReferences() {
    // Data operations
    if (!InternalAPI.data.createCard && window.createCard) InternalAPI.data.createCard = window.createCard;
    if (!InternalAPI.data.updateCard && window.updateCard) InternalAPI.data.updateCard = window.updateCard;
    if (!InternalAPI.data.deleteCard && window.deleteCard) InternalAPI.data.deleteCard = window.deleteCard;
    if (!InternalAPI.utils.cloneCard && window.cloneCard) InternalAPI.utils.cloneCard = window.cloneCard;
    // Tag operations
    if (!InternalAPI.data.getTags && window.getTags) InternalAPI.data.getTags = window.getTags;
    if (!InternalAPI.data.addTag && window.addTag) InternalAPI.data.addTag = window.addTag;
    if (!InternalAPI.data.removeTag && window.removeTag) InternalAPI.data.removeTag = window.removeTag;
    if (!InternalAPI.data.setTags && window.setTags) InternalAPI.data.setTags = window.setTags;
    if (!InternalAPI.data.getAllTags && window.getAllTags) InternalAPI.data.getAllTags = window.getAllTags;
    // UI operations
    if (!InternalAPI.ui.showToast && window.showToast) InternalAPI.ui.showToast = window.showToast;
  }

  // Helper function to check permissions
  function hasPermission(pluginId, permission) {
    if (Permissions) {
      return Permissions.hasPermission(pluginId, permission);
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
            if (!target.parentNode) {
              console.warn('[Plugin:' + pluginId + '] Target has no parent node for "before" injection');
              return () => {};
            }
            target.parentNode.insertBefore(element, target);
            break;
          case 'after':
            if (!target.parentNode) {
              console.warn('[Plugin:' + pluginId + '] Target has no parent node for "after" injection');
              return () => {};
            }
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
        if (!target.parentNode) {
          console.warn('[Plugin:' + pluginId + '] Target has no parent node for replace');
          return () => {};
        }
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

        if (ComponentRegistry) {
          ComponentRegistry.register(name, component, component.priority || 0);
          const resource = { type: 'component', name: name };
          resources.add(resource);
        }
      },

      unregisterComponent: function(name) {
        if (ComponentRegistry) {
          ComponentRegistry.unregister(name);
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
        // Check data-modify permission
        if (!hasPermission(pluginId, 'data-modify')) {
          throw new Error('Plugin does not have data-modify permission');
        }

        var fn = InternalAPI.data.createCard || window.createCard;
        if (fn) {
          // Apply tags in the same call so plugins don't need a second
          // permission-gated round-trip for a common creation pattern.
          // When tags are supplied, suppress the host's card.create hooks so
          // they fire ONCE below with the finished (tagged) card, not with an
          // intermediate untagged one that tag-aware listeners would misread.
          var hasTags = Array.isArray(data.tags) && data.tags.length > 0;
          var newId = fn(data.title || '', data.body || '', data.parentId || null, false, hasTags);
          if (hasTags && newId) {
            var setTagsFn = InternalAPI.data.setTags || window.setTags;
            if (setTagsFn) {
              setTagsFn(newId, data.tags);
            }
            var createdCard = (window.store && window.store.cards) ? window.store.cards[newId] : undefined;
            if (window.CardSpoke && window.CardSpoke.Middleware) {
              window.CardSpoke.Middleware.run('card.create', [newId, createdCard])
                .catch(function(err) { console.error('[Middleware] card.create error:', err); });
            }
            PluginManager.notifyDataUpdate({ type: 'card.create', cardId: newId, card: createdCard });
          }
          return newId;
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
        const raw = localStorage.getItem(fullKey);
        if (raw === null) return null;
        try { return JSON.parse(raw); } catch(e) { return raw; }
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

  function createMiddlewareApi(pluginId) {
    const resources = pluginResources.get(pluginId) || new Set();

    return {
      /**
       * Register a middleware interceptor for core operations
       * ('card.create', 'card.update', 'card.delete', 'card.save',
       * 'card.render', or '*'). The name is namespaced per plugin, and the
       * registration is tracked so it is automatically removed when the
       * plugin is disabled or unregistered.
       *
       * @param {Object} middleware - { name, priority?, operations?, handler }
       * @returns {Function} Unregister function
       */
      register: function(middleware) {
        if (!middleware || !middleware.name || typeof middleware.handler !== 'function') {
          throw new Error('Middleware must have a name and a handler function');
        }
        if (!Middleware) {
          throw new Error('Middleware pipeline not available');
        }

        const namespacedName = pluginId + ':' + middleware.name;
        Middleware.register({
          name: namespacedName,
          priority: middleware.priority || 0,
          operations: middleware.operations || ['*'],
          handler: middleware.handler
        });

        const resource = { type: 'middleware', name: namespacedName };
        resources.add(resource);

        return function() {
          Middleware.unregister(namespacedName);
          resources.delete(resource);
        };
      },

      unregister: function(name) {
        if (Middleware) {
          Middleware.unregister(pluginId + ':' + name);
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
      appVersion: window.APP_VERSION || '0.18.0',
      schemaVersion: window.SCHEMA_VERSION || 4,
      api: {
        ui: createUIApi(pluginId),
        data: createDataApi(pluginId),
        storage: createStorageApi(pluginId),
        events: createEventApi(pluginId),
        middleware: createMiddlewareApi(pluginId),
        network: createNetworkApi(pluginId),
        filesystem: createFilesystemApi(pluginId)
      },
      utils: window.CardSpoke && window.CardSpoke.utils ? window.CardSpoke.utils : {},
      logger: createLogger(pluginId)
    };
  }

  // Centralized factory for all plugin JS execution.
  // All plugin code strings are compiled here, providing a single upgrade
  // point if stronger isolation (iframe/Worker message-passing) is ever
  // implemented.
  //
  // TRUST MODEL (CS-002): there is NO sandbox. Plugin code runs on the main
  // thread in the page realm and can reach window, document, localStorage,
  // fetch, and the host bridge directly — declared permissions scope the
  // supported ctx API surface but are NOT a security boundary. Every plugin
  // that ships JavaScript therefore requires explicit full-trust consent
  // (Permissions.requestFullTrust) before enable(). The validator screens
  // packages for obvious footguns, layer-based risk labels set expectations,
  // and `?safemode` boots with all plugins disabled.
  //
  // Compilation is eager so that a syntax error in plugin code fails the
  // install/sync step immediately (where it is caught and reported) instead
  // of surfacing later at enable time.
  function _createSandboxedFunction(code) {
    const compiled = new Function('ctx', '"use strict";\n' + code);
    const wrapper = function(ctx) {
      return compiled(ctx);
    };
    // Marker so serialization never tries to stringify this wrapper —
    // the original source string in definition.js is the canonical form.
    wrapper.__cardspokeCompiled = true;
    return wrapper;
  }

  function _functionToCtxCode(fn) {
    if (typeof fn !== 'function') return null;
    // Compiled wrappers must never be stringified — their source is a
    // closure over internal state. The raw code string in definition.js is
    // the canonical serialized form for those.
    if (fn.__cardspokeCompiled) return null;
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

      if (plugins.has(id)) {
        throw new Error(
          'Plugin "' + id + '" is already registered. ' +
          'Use install() to update an existing plugin, or unregister() it first.'
        );
      }

      // Validate plugin content if validator is available
      if (PluginValidator) {
        var validationResult = PluginValidator.validate({
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

      // Pre-initialize the shared resources Set so that all API factory functions
      // (createUIApi, createDataApi, createEventApi) close over the correct Set
      // instead of creating orphaned Sets that _cleanupResources cannot reach.
      const resources = new Set();
      pluginResources.set(id, resources);

      const context = createPluginContext(id);
      const instance = {
        id: id,
        definition: definition,
        context: context,
        enabled: false,
        resources: resources
      };

      plugins.set(id, instance);

      console.log('[Plugin] Registered:', id);
    },

    unregister: async function(id) {
      const instance = plugins.get(id);
      if (instance) {
        if (instance.enabled) {
          await this.disable(id);
        }
        this._cleanupResources(id);
        plugins.delete(id);
        pluginResources.delete(id);
        dataUpdateListeners.delete(id);

        // Revoke any permissions and full-trust consent the user granted
        // this plugin so a future reinstall must ask again.
        if (Permissions && Permissions.revokePermissions) {
          Permissions.revokePermissions(id);
        }
        if (Permissions && Permissions.revokeFullTrust) {
          Permissions.revokeFullTrust(id);
        }

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

    /**
     * Runtime-only teardown for a dataset switch. Disables the plugin (running
     * its teardown + resource cleanup so no CSS/DOM/listeners leak) and drops
     * the instance from the runtime so a subsequent syncFromStore() can cleanly
     * re-register it — but deliberately does NOT touch the persisted store or
     * the user's permission/trust grants, which are keyed to the plugin id and
     * must survive switching away from and back to a dataset.
     *
     * Unlike unregister(), this never deletes store.plugins[id] or revokes
     * consent. syncFromStore skips ids already in the runtime Map, so without
     * this teardown a plugin carried over from the previous dataset would be
     * stuck in its old enabled/definition state after a switch.
     */
    teardownForReload: async function(id) {
      const instance = plugins.get(id);
      if (!instance) return;
      if (instance.enabled) {
        await this.disable(id);
      } else {
        // Even when suspended, drop any resources/CSS defensively.
        this._removeCSS(id);
        this._cleanupResources(id);
      }
      plugins.delete(id);
      pluginResources.delete(id);
      dataUpdateListeners.delete(id);
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

      // CS-002: JavaScript plugins run unsandboxed in the page realm, so
      // running one is a full-trust decision. Require explicit, persisted
      // consent before any package-sourced JS executes. (Plugins registered
      // programmatically with real functions are host code already.)
      const requiresFullTrust = !!(instance.definition.js || instance.definition.teardownJs);
      if (requiresFullTrust && Permissions &&
          typeof Permissions.requestFullTrust === 'function') {
        const pluginName = (instance.definition.manifest && instance.definition.manifest.name) || id;
        const trusted = await Permissions.requestFullTrust(id, pluginName);
        if (!trusted) {
          throw new Error('Plugin "' + id + '" was not enabled: full-trust consent was declined');
        }
      }

      // Task 2.6: Pass config to plugin context
      if (instance.definition.manifest.config) {
        instance.context.config = instance.definition.manifest.config;
      }

      // Task 2.6: Apply overrides from manifest. appName renames the brand
      // button; we snapshot its original content first so disable() can
      // fully restore it (the button normally holds the logo <img>, which
      // setting textContent would otherwise destroy with no way back).
      if (instance.definition.manifest.overrides) {
        const overrides = instance.definition.manifest.overrides;
        if (overrides.appName && typeof overrides.appName === 'string') {
          const brandBtn = document.getElementById && document.getElementById('brandBtn');
          if (brandBtn) {
            if (instance._savedBrandHTML == null) instance._savedBrandHTML = brandBtn.innerHTML;
            brandBtn.textContent = overrides.appName;
          }
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
          
          // Log to plugin context if available
          if (instance.context && instance.context.logger) {
            instance.context.logger.error('Plugin setup failed and was disabled: ' + err.message);
          }
          
          throw err;
        }
      }

      instance.enabled = true;
      this._persistEnabledState(id, true);
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

      // Restore the brand button if this plugin overrode appName, so no
      // ghost UI (or a destroyed logo) is left behind on suspend/remove.
      if (instance._savedBrandHTML != null) {
        const brandBtn = document.getElementById && document.getElementById('brandBtn');
        if (brandBtn) brandBtn.innerHTML = instance._savedBrandHTML;
        instance._savedBrandHTML = null;
      }

      // Remove CSS
      this._removeCSS(id);

      // Cleanup resources
      this._cleanupResources(id);

      instance.enabled = false;
      this._persistEnabledState(id, false);
      console.log('[Plugin] Disabled:', id);
    },

    /**
     * Keep the persisted enabled flag in sync with the runtime state so that
     * enabling/suspending a plugin survives a page reload. No-op for plugins
     * that were registered without install() (session-only plugins have no
     * store entry).
     */
    _persistEnabledState: function(id, enabled) {
      if (window.store && window.store.plugins && window.store.plugins[id] &&
          window.store.plugins[id].enabled !== enabled) {
        window.store.plugins[id].enabled = enabled;
        if (window.save) {
          window.save();
        }
      }
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
            if (ComponentRegistry) {
              ComponentRegistry.unregister(resource.name);
              cleanup.components++;
            }
          } else if (resource.type === 'middleware') {
            // Unregister middleware interceptor
            if (Middleware) {
              Middleware.unregister(resource.name);
              cleanup.listeners++;
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
      if (Permissions) {
        const instance = plugins.get(id);
        const pluginName = (instance && instance.definition.manifest && instance.definition.manifest.name) || id;
        return await Permissions.requestPermissions(id, pluginName, permissions);
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

    listAll: function() {
      return this.list();
    },

    install: async function(pkg) {
      if (!pkg || !pkg.manifest) {
        throw new Error('Invalid plugin package: manifest is required');
      }
      if (!pkg.manifest.name && !pkg.manifest.id && !pkg.id) {
        throw new Error('Invalid plugin package: manifest.name or an id is required');
      }

      // Normalize package-level fields into the manifest. Published plugin
      // packages (see sample-plugins/) may declare id/config/overrides at the
      // package top level; explicit manifest values win on conflict.
      if (pkg.id && !pkg.manifest.id) pkg.manifest.id = pkg.id;
      if (pkg.config && typeof pkg.config === 'object' && !pkg.manifest.config) {
        pkg.manifest.config = pkg.config;
      }
      if (pkg.overrides && typeof pkg.overrides === 'object' && !pkg.manifest.overrides) {
        pkg.manifest.overrides = pkg.overrides;
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

      // The js/teardownJs source strings are the canonical executable form of
      // a plugin package: they are what gets persisted and reconstructed
      // after a reload. Empty strings (common in CSS-only theme packages)
      // count as absent.
      const jsSource =
        (typeof pkg.js === 'string' && pkg.js.trim()) ? pkg.js :
        (typeof pkg.javascript === 'string' && pkg.javascript.trim()) ? pkg.javascript : null;
      const teardownSource =
        (typeof pkg.teardownJs === 'string' && pkg.teardownJs.trim()) ? pkg.teardownJs :
        (typeof pkg.teardown === 'string' && pkg.teardown.trim()) ? pkg.teardown : null;

      // Compile source strings unless the caller supplied real functions.
      // A syntax error here throws before anything is registered.
      if (!pkg.setup && jsSource) {
        pkg.setup = _createSandboxedFunction(jsSource);
      }
      const teardownFn = (typeof pkg.teardown === 'function') ? pkg.teardown :
        (teardownSource ? _createSandboxedFunction(teardownSource) : undefined);

      // Generate base ID
      let id = pkg.manifest.id || pkg.manifest.name.toLowerCase().replace(/\s+/g, '-');

      // Task 2.4: If a plugin with this ID already exists, this install is an
      // update: fully unregister (disable + cleanup + store removal) first.
      if (plugins.has(id)) {
        await this.unregister(id);
      }

      const definition = {
        manifest: pkg.manifest,
        setup: pkg.setup,
        teardown: teardownFn,
        css: pkg.css,
        js: jsSource,
        teardownJs: teardownSource
      };

      this.register(id, definition);

      // Persist before enabling so _persistEnabledState keeps the stored
      // flag in sync with whatever enable() ends up doing.
      if (window.store) {
        if (!window.store.plugins) {
          window.store.plugins = {};
        }
        window.store.plugins[id] = {
          definition: _createSerializableDefinition(definition),
          enabled: false
        };
        if (window.save) {
          window.save();
        }
      }

      // Only CSS-only themes (SAFE) enable silently — they execute no
      // JavaScript. Anything carrying JS goes through enable(), whose
      // full-trust consent dialog the user must accept first (CS-002);
      // declining leaves the plugin installed-but-suspended. App-layer
      // (HIGH) plugins always stay suspended until enabled explicitly.
      const risk = this.assessModRisk(pkg);
      if (risk === 'SAFE' || risk === 'LOW') {
        try {
          await this.enable(id);
        } catch (err) {
          console.warn('[Plugin] Installed but not enabled', id, ':', err.message);
        }
      }

      console.log('[Plugin] Installed:', id);
      return id;
    },

    assessModRisk: function(pkg) {
      if (!pkg || !pkg.manifest) {
        return 'HIGH';
      }

      const manifest = pkg.manifest;
      const layer = manifest.layer || 'feature';
      // Check both function-form (setup/teardown) and string-form (js/javascript) so that
      // raw JSON packages that have not yet been through install() are assessed correctly.
      const hasJS = !!pkg.setup || !!pkg.teardown || !!pkg.js || !!pkg.javascript;
      const hasCSS = !!pkg.css;
      const hasOverrides = !!pkg.overrides || !!(manifest.overrides);

      if (layer === 'theme' && !hasJS && hasCSS) {
        return 'SAFE';
      }
      if (layer === 'feature' && !hasOverrides) {
        return 'LOW';
      }
      if (layer === 'app' || hasOverrides) {
        return 'HIGH';
      }
      return 'MEDIUM';
    },

    syncFromStore: async function(safeMode) {
      // When the caller does not know the safe-mode state (e.g. a re-sync
      // after an async IndexedDB/local-file payload arrives), derive it from
      // the URL so ?safemode reliably keeps every sync path disabled.
      if (typeof safeMode === 'undefined' && typeof window !== 'undefined' &&
          window.location && typeof window.location.search === 'string') {
        safeMode = new URLSearchParams(window.location.search).has('safemode');
      }

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

        // Idempotent: a plugin already registered this session (e.g. by an
        // earlier sync, or because an async storage mirror re-triggered the
        // sync after boot) is left untouched.
        if (plugins.has(id)) {
          continue;
        }

        // Entries without a definition are legacy-format plugins that the
        // current runtime cannot execute; they are surfaced (read-only) in
        // the Plugin Manager UI for export/removal.
        if (!pluginData || !pluginData.definition) {
          continue;
        }

        try {
          const stored = pluginData.definition;

          // Reconstruct executable functions from the persisted source
          // strings on a fresh definition object — never mutate the stored
          // entry, which must stay JSON-serializable.
          const def = {
            manifest: stored.manifest,
            css: stored.css,
            js: (typeof stored.js === 'string' && stored.js.trim()) ? stored.js : null,
            teardownJs: (typeof stored.teardownJs === 'string' && stored.teardownJs.trim()) ? stored.teardownJs : null
          };
          if (def.js) {
            def.setup = _createSandboxedFunction(def.js);
          }
          if (def.teardownJs) {
            def.teardown = _createSandboxedFunction(def.teardownJs);
          }

          this.register(id, def);

          if (!safeMode && pluginData.enabled) {
            await this.enable(id);
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
          // Persist the new value so plugin settings survive a reload.
          if (window.store && window.store.plugins && window.store.plugins[id]) {
            const storedDef = window.store.plugins[id].definition;
            if (storedDef && storedDef.manifest && storedDef.manifest.config) {
              storedDef.manifest.config[key] = newValue;
            }
            if (window.save) {
              window.save();
            }
          }
        };

        row.appendChild(label);
        row.appendChild(input);
        panel.appendChild(row);
      });

      return panel;
    }
  };

  console.log('[Plugin] API system initialized');

export { PluginManager as Plugin };
export { _createSandboxedFunction as PluginSandbox };

// Reset internal state (used in tests for isolation)
export function resetForTesting() {
  plugins.clear();
  pluginResources.clear();
  dataUpdateListeners.clear();
  globalEventBus.clear();
  // Drop captured host references so each test re-captures from its own
  // window/document mock instead of a stale one from a previous file.
  InternalAPI.data = {};
  InternalAPI.ui = {};
  InternalAPI.utils = {};
}
