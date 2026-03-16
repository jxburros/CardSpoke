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

    listAll: function() {
      return this.list();
    },

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

      // Support pkg.js field (Task 1.2) via sandboxed function factory
      if (!pkg.setup) {
        if (pkg.js && typeof pkg.js === 'string') {
          pkg.setup = _createSandboxedFunction(pkg.js);
        } else if (pkg.javascript && typeof pkg.javascript === 'string') {
          pkg.setup = _createSandboxedFunction(pkg.javascript);
        }
      }

      // Generate base ID
      let id = pkg.manifest.id || pkg.manifest.name.toLowerCase().replace(/\s+/g, '-');

      // Task 2.4: If plugin with this base ID already exists, update it (disable+unregister+overwrite)
      if (plugins.has(id)) {
        if (plugins.get(id).enabled) {
          await this.disable(id);
        }
        this.unregister(id);
      }

      const definition = {
        manifest: pkg.manifest,
        setup: pkg.setup,
        teardown: pkg.teardown,
        css: pkg.css,
        js: pkg.js || pkg.javascript
      };

      this.register(id, definition);

      const risk = this.assessModRisk(pkg);
      if (risk === 'SAFE' || risk === 'LOW') {
        await this.enable(id);
      }

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

    assessModRisk: function(pkg) {
      if (!pkg || !pkg.manifest) {
        return 'HIGH';
      }

      const manifest = pkg.manifest;
      const layer = manifest.layer || 'feature';
      const hasJS = !!pkg.setup || !!pkg.teardown;
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
          if (pluginData.definition) {
            const def = pluginData.definition;

            // Task 2.1: Reconstruct setup/teardown from saved JS string via sandbox factory
            if (!def.setup && def.js && typeof def.js === 'string') {
              def.setup = _createSandboxedFunction(def.js);
            }
            if (!def.teardown && def.teardownJs && typeof def.teardownJs === 'string') {
              def.teardown = _createSandboxedFunction(def.teardownJs);
            }

            this.register(id, def);

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
