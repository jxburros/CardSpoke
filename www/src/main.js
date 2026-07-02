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
 * CardSpoke Application Entry Point
 *
 * This module is the Vite IIFE build entry point.  It imports the core
 * sub-systems as proper ES Modules, then exposes a strictly controlled,
 * read-only surface on `window.CardSpoke` for the plugin ecosystem.
 *
 * Plugins must call `window.CardSpoke.registerPlugin()` and
 * `window.CardSpoke.requestPermissions()` — they cannot reach internal
 * state or override core APIs directly.
 */

// ── Core sub-systems (fully ESM) ────────────────────────────────────────────
import { Middleware } from './core/middleware.js';
import { ComponentRegistry } from './core/component-registry.js';
import { PluginValidator } from './core/plugin-validator.js';
import { Permissions, showPermissionDialog } from './core/permissions.js';
import { StorageDriverRegistry } from './core/storage-driver-registry.js';
import { Plugin as PluginAPI, PluginSandbox } from './core/plugin-api.js';
import { registerBuiltInModes } from './core/app-modes.js';

// ── Shared application state (ESM live bindings) ─────────────────────────────
import './state.js';

// ── Layer 0: Kernel (pure data engine — no browser deps) ─────────────────────
// Imported by data.js; listed here for build-order documentation.
import './kernel.js';

// ── App layers (loaded in dependency order) ──────────────────────────────────
// Each module imports the specific state bindings it needs from state.js.
import './metadata.js';
import './storage.js';
import './data.js';
import './rendering.js';
import './systems.js';

// ── App mode registry (OS preparation) ──────────────────────────────────────
// Registers the built-in stub modes (cardspoke, repository, notes, projects,
// decks, contacts, plants). The default "cardspoke" mode preserves current
// behavior; the others filter cards by kind for future lightweight shells.
registerBuiltInModes();

// ── Public plugin API — frozen, read-only surface on window ─────────────────
// Plugins access exactly two entry-points; everything else is internal.
window.CardSpoke = Object.freeze({
  /**
   * Register and activate a plugin.
   * @param {string} id - Unique plugin identifier
   * @param {Object} definition - Plugin definition object (manifest, setup, teardown, css, js)
   */
  registerPlugin: function(id, definition) {
    return PluginAPI.register(id, definition);
  },

  /**
   * Request user consent for a set of permissions on behalf of a plugin.
   * @param {string} pluginId - Plugin identifier
   * @param {string} pluginName - Human-readable plugin name
   * @param {string[]} permissions - Array of permission names
   * @returns {Promise<boolean>} Whether permissions were granted
   */
  requestPermissions: function(pluginId, pluginName, permissions) {
    return Permissions.requestPermissions(pluginId, pluginName, permissions);
  }
});
