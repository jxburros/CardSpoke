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


// Dynamic Plugin Loader
// Example of loading plugins as ES modules with Vite/ESBuild

/**
 * Load a plugin from a URL as an ES module
 * @param {string} url - URL to the plugin module
 * @returns {Promise<Object>} Loaded plugin
 */
export async function loadPluginFromURL(url) {
  try {
    const module = await import(/* @vite-ignore */ url);
    return module.default || module;
  } catch (err) {
    console.error('[PluginLoader] Failed to load plugin from URL:', url, err);
    throw err;
  }
}

/**
 * Load a plugin from local file (development)
 * @param {string} path - Path to the plugin file
 * @returns {Promise<Object>} Loaded plugin
 */
export async function loadPluginFromFile(path) {
  try {
    const module = await import(/* @vite-ignore */ path);
    return module.default || module;
  } catch (err) {
    console.error('[PluginLoader] Failed to load plugin from file:', path, err);
    throw err;
  }
}

/**
 * Install and enable a dynamically loaded plugin
 * @param {string} pluginId - Plugin ID
 * @param {Object} pluginDefinition - Plugin definition from ES module
 */
export async function installDynamicPlugin(pluginId, pluginDefinition) {
  if (!window.CardSpoke || !window.CardSpoke.Plugin) {
    throw new Error('Plugin system not available');
  }

  // Convert module export to plugin format if needed
  const plugin = {
    manifest: pluginDefinition.manifest || {
      name: pluginId,
      version: '1.0.0',
      author: 'Unknown',
      layer: 'feature'
    },
    setup: pluginDefinition.setup || pluginDefinition.default?.setup,
    teardown: pluginDefinition.teardown || pluginDefinition.default?.teardown,
    css: pluginDefinition.css || pluginDefinition.default?.css
  };

  // Register with plugin system
  window.CardSpoke.Plugin.register(pluginId, plugin);
  
  // Enable the plugin
  await window.CardSpoke.Plugin.enable(pluginId);
  
  console.log('[PluginLoader] Installed and enabled:', pluginId);
}

/**
 * Load plugins from a manifest file
 * @param {string} manifestUrl - URL to plugins manifest JSON
 */
export async function loadPluginsFromManifest(manifestUrl) {
  try {
    const response = await fetch(manifestUrl);
    const manifest = await response.json();
    
    const results = [];
    for (const plugin of manifest.plugins || []) {
      try {
        const pluginDef = await loadPluginFromURL(plugin.url);
        await installDynamicPlugin(plugin.id, pluginDef);
        results.push({ id: plugin.id, success: true });
      } catch (err) {
        console.error('[PluginLoader] Failed to load plugin:', plugin.id, err);
        results.push({ id: plugin.id, success: false, error: err.message });
      }
    }
    
    return results;
  } catch (err) {
    console.error('[PluginLoader] Failed to load manifest:', manifestUrl, err);
    throw err;
  }
}

/**
 * Example manifest format:
 * {
 *   "plugins": [
 *     {
 *       "id": "my-plugin",
 *       "url": "https://example.com/plugins/my-plugin.js"
 *     }
 *   ]
 * }
 */

// Export for use in app
if (typeof window !== 'undefined') {
  if (!window.CardSpoke) window.CardSpoke = {};
  window.CardSpoke.PluginLoader = {
    loadFromURL: loadPluginFromURL,
    loadFromFile: loadPluginFromFile,
    install: installDynamicPlugin,
    loadManifest: loadPluginsFromManifest
  };
}
