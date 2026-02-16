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
