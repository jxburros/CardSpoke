/**
 * Storage Manager - handles storage mode selection and persistence
 * This module allows the user to choose between localStorage, sessionStorage, or memory storage
 */

(function() {
  'use strict';

  const StorageManager = {
    mode: null,
    initialized: false,
    memoryStorage: {},

    init() {
      // Check if this is a baked/exported build
      if (window.__IS_BAKED__) {
        this.mode = 'baked';
        this.initialized = true;
        console.log('[StorageManager] Running in baked mode');
        return;
      }

      // Check if storage mode was previously selected
      try {
        const savedMode = localStorage.getItem('cib_storage_mode');
        if (savedMode && ['localStorage', 'sessionStorage', 'memory'].includes(savedMode)) {
          this.mode = savedMode;
          this.initialized = true;
          console.log('[StorageManager] Using saved storage mode:', savedMode);
          this.notifyReady();
          return;
        }
      } catch (e) {
        console.warn('[StorageManager] Could not read saved storage mode:', e);
      }

      // Show storage picker modal
      this.showStoragePicker();
    },

    showStoragePicker() {
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
      `;

      modal.innerHTML = `
        <div style="
          background: #1a1f2e;
          color: #f2f6ff;
          padding: 30px;
          border-radius: 14px;
          max-width: 500px;
          width: 90%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        ">
          <h2 style="margin: 0 0 20px 0; font-size: 24px;">Choose Storage Mode</h2>
          <p style="margin: 0 0 20px 0; color: #b7c2d9;">Select how you want to store your data:</p>
          
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <button id="storageLocal" style="
              background: #86a8ff;
              color: #0a0f1a;
              border: none;
              padding: 14px 20px;
              border-radius: 10px;
              cursor: pointer;
              font-weight: 600;
              font-size: 16px;
              text-align: left;
            ">
              <div style="font-size: 18px; margin-bottom: 4px;">💾 Local Storage</div>
              <div style="font-size: 14px; opacity: 0.9;">Persists across sessions</div>
            </button>
            
            <button id="storageSession" style="
              background: #131a2a;
              color: #f2f6ff;
              border: 1px solid #3a4561;
              padding: 14px 20px;
              border-radius: 10px;
              cursor: pointer;
              font-weight: 600;
              font-size: 16px;
              text-align: left;
            ">
              <div style="font-size: 18px; margin-bottom: 4px;">🔄 Session Storage</div>
              <div style="font-size: 14px; color: #b7c2d9;">Clears when browser closes</div>
            </button>
            
            <button id="storageMemory" style="
              background: #131a2a;
              color: #f2f6ff;
              border: 1px solid #3a4561;
              padding: 14px 20px;
              border-radius: 10px;
              cursor: pointer;
              font-weight: 600;
              font-size: 16px;
              text-align: left;
            ">
              <div style="font-size: 18px; margin-bottom: 4px;">⚡ Memory Only</div>
              <div style="font-size: 14px; color: #b7c2d9;">Temporary, clears on page refresh</div>
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      // Wire up button handlers
      document.getElementById('storageLocal').addEventListener('click', () => {
        this.selectMode('localStorage');
        modal.remove();
      });

      document.getElementById('storageSession').addEventListener('click', () => {
        this.selectMode('sessionStorage');
        modal.remove();
      });

      document.getElementById('storageMemory').addEventListener('click', () => {
        this.selectMode('memory');
        modal.remove();
      });
    },

    selectMode(mode) {
      this.mode = mode;
      this.initialized = true;

      // Save preference (if using localStorage)
      if (mode === 'localStorage') {
        try {
          localStorage.setItem('cib_storage_mode', mode);
        } catch (e) {
          console.warn('[StorageManager] Could not save storage preference:', e);
        }
      }

      console.log('[StorageManager] Selected storage mode:', mode);
      this.notifyReady();
    },

    notifyReady() {
      // Dispatch custom event to signal app initialization can proceed
      window.dispatchEvent(new CustomEvent('storageReady', {
        detail: { mode: this.mode }
      }));
    },

    // Storage API wrappers
    getItem(key) {
      if (this.mode === 'localStorage') {
        return localStorage.getItem(key);
      } else if (this.mode === 'sessionStorage') {
        return sessionStorage.getItem(key);
      } else if (this.mode === 'memory') {
        return this.memoryStorage[key] || null;
      } else if (this.mode === 'baked') {
        return localStorage.getItem(key);
      }
      return null;
    },

    setItem(key, value) {
      if (this.mode === 'localStorage') {
        localStorage.setItem(key, value);
      } else if (this.mode === 'sessionStorage') {
        sessionStorage.setItem(key, value);
      } else if (this.mode === 'memory') {
        this.memoryStorage[key] = value;
      } else if (this.mode === 'baked') {
        localStorage.setItem(key, value);
      }
    },

    removeItem(key) {
      if (this.mode === 'localStorage') {
        localStorage.removeItem(key);
      } else if (this.mode === 'sessionStorage') {
        sessionStorage.removeItem(key);
      } else if (this.mode === 'memory') {
        delete this.memoryStorage[key];
      } else if (this.mode === 'baked') {
        localStorage.removeItem(key);
      }
    }
  };

  // Expose globally
  window.StorageManager = StorageManager;

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => StorageManager.init());
  } else {
    StorageManager.init();
  }
})();
