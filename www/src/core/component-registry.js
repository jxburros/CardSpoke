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
