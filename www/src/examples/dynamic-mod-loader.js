// Dynamic Mod Loader
// Example of loading mods as ES modules with Vite/ESBuild

/**
 * Load a mod from a URL as an ES module
 * @param {string} url - URL to the mod module
 * @returns {Promise<Object>} Loaded mod
 */
export async function loadModFromURL(url) {
  try {
    const module = await import(/* @vite-ignore */ url);
    return module.default || module;
  } catch (err) {
    console.error('[ModLoader] Failed to load mod from URL:', url, err);
    throw err;
  }
}

/**
 * Load a mod from local file (development)
 * @param {string} path - Path to the mod file
 * @returns {Promise<Object>} Loaded mod
 */
export async function loadModFromFile(path) {
  try {
    const module = await import(/* @vite-ignore */ path);
    return module.default || module;
  } catch (err) {
    console.error('[ModLoader] Failed to load mod from file:', path, err);
    throw err;
  }
}

/**
 * Install and enable a dynamically loaded mod
 * @param {string} modId - Mod ID
 * @param {Object} modDefinition - Mod definition from ES module
 */
export async function installDynamicMod(modId, modDefinition) {
  if (!window.CardSpoke || !window.CardSpoke.Plugin) {
    throw new Error('Plugin system not available');
  }

  // Convert module export to plugin format if needed
  const plugin = {
    manifest: modDefinition.manifest || {
      name: modId,
      version: '1.0.0',
      author: 'Unknown',
      layer: 'feature'
    },
    setup: modDefinition.setup || modDefinition.default?.setup,
    teardown: modDefinition.teardown || modDefinition.default?.teardown,
    css: modDefinition.css || modDefinition.default?.css
  };

  // Register with plugin system
  window.CardSpoke.Plugin.register(modId, plugin);
  
  // Enable the plugin
  await window.CardSpoke.Plugin.enable(modId);
  
  console.log('[ModLoader] Installed and enabled:', modId);
}

/**
 * Load mods from a manifest file
 * @param {string} manifestUrl - URL to mods manifest JSON
 */
export async function loadModsFromManifest(manifestUrl) {
  try {
    const response = await fetch(manifestUrl);
    const manifest = await response.json();
    
    const results = [];
    for (const mod of manifest.mods || []) {
      try {
        const modDef = await loadModFromURL(mod.url);
        await installDynamicMod(mod.id, modDef);
        results.push({ id: mod.id, success: true });
      } catch (err) {
        console.error('[ModLoader] Failed to load mod:', mod.id, err);
        results.push({ id: mod.id, success: false, error: err.message });
      }
    }
    
    return results;
  } catch (err) {
    console.error('[ModLoader] Failed to load manifest:', manifestUrl, err);
    throw err;
  }
}

/**
 * Example manifest format:
 * {
 *   "mods": [
 *     {
 *       "id": "my-mod",
 *       "url": "https://example.com/mods/my-mod.js"
 *     }
 *   ]
 * }
 */

// Export for use in app
if (typeof window !== 'undefined') {
  if (!window.CardSpoke) window.CardSpoke = {};
  window.CardSpoke.ModLoader = {
    loadFromURL: loadModFromURL,
    loadFromFile: loadModFromFile,
    install: installDynamicMod,
    loadManifest: loadModsFromManifest
  };
}
