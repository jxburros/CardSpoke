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
