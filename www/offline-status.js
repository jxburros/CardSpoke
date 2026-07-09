/*
 * Offline status coordinator for CardSpoke.
 *
 * CardSpoke's core save path is local-first. This script keeps that visible to
 * users by normalizing the save indicator to explicit local-save language and
 * registering the offline app-shell service worker.
 *
 * The public app has no hosted sync and no cloud storage drivers, so there is
 * no remote sync state to report — only local save state.
 */
(function () {
  var LOCAL_SAVE_TEXT = {
    saved: 'Saved locally',
    pending: 'Saving locally...',
    error: 'Local save failed'
  };

  function isOnline() {
    return typeof navigator.onLine === 'boolean' ? navigator.onLine : true;
  }

  function setStatus(text, title) {
    var indicator = document.getElementById('saveStatus');
    if (!indicator) return;
    if (indicator.textContent !== text) {
      indicator.textContent = text;
    }
    if (typeof title === 'string' && indicator.title !== title) {
      indicator.title = title;
    }
  }

  function refreshOfflineStatus() {
    var indicator = document.getElementById('saveStatus');
    if (!indicator) return;

    var current = (indicator.textContent || '').trim();
    var lower = current.toLowerCase();

    if (!isOnline()) {
      if (lower === 'saved' || lower === LOCAL_SAVE_TEXT.saved.toLowerCase()) {
        setStatus(LOCAL_SAVE_TEXT.saved, 'Saved on this device. CardSpoke does not need internet for local editing.');
      }
    }
  }

  function normalizeCoreSaveText() {
    var indicator = document.getElementById('saveStatus');
    if (!indicator) return;

    var current = (indicator.textContent || '').trim();
    if (current === 'Saved' || current === '✓') {
      setStatus(LOCAL_SAVE_TEXT.saved, 'Saved on this device.');
    } else if (current === 'Saving…' || current === 'Saving...' || current === '●') {
      setStatus(LOCAL_SAVE_TEXT.pending, 'Saving to this device.');
    } else if (current === 'Save failed' || current === '✕') {
      setStatus(LOCAL_SAVE_TEXT.error, 'CardSpoke could not save to this device.');
    }
  }

  function watchSaveIndicator() {
    var indicator = document.getElementById('saveStatus');
    if (!indicator || typeof MutationObserver === 'undefined') return;

    var observer = new MutationObserver(function () {
      normalizeCoreSaveText();
      refreshOfflineStatus();
    });

    observer.observe(indicator, { childList: true, characterData: true, subtree: true });
    normalizeCoreSaveText();
    refreshOfflineStatus();
  }

  function registerServiceWorker() {
    var isNative = typeof window.Capacitor !== 'undefined' &&
      typeof window.Capacitor.isNativePlatform === 'function' &&
      window.Capacitor.isNativePlatform();

    if (isNative) return;
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') return;

    navigator.serviceWorker.register('./service-worker.js').catch(function (error) {
      console.warn('[CardSpoke Offline] Service worker registration failed:', error);
    });
  }

  window.addEventListener('online', refreshOfflineStatus);
  window.addEventListener('offline', refreshOfflineStatus);
  window.addEventListener('DOMContentLoaded', function () {
    registerServiceWorker();
    watchSaveIndicator();
  });
})();
