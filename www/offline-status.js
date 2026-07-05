/*
 * Offline status coordinator for CardSpoke.
 *
 * CardSpoke's core save path is local-first. This script keeps that visible to
 * users by separating local save status from remote/off-device sync status.
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

  function getRemoteStorageKind() {
    try {
      var raw = localStorage.getItem('nested_cards_store');
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      var storageType = parsed && parsed.metadata && parsed.metadata.storageType;
      if (storageType === 'googledrive' || storageType === 'onedrive' || storageType === 'webdav') {
        return storageType;
      }
    } catch (_err) {
      // Encrypted/corrupt/unavailable stores should not break offline status.
    }
    return null;
  }

  function setStatus(text, title) {
    var indicator = document.getElementById('saveStatus');
    if (!indicator) return;
    indicator.textContent = text;
    if (title) indicator.title = title;
  }

  function describeRemote(kind) {
    if (kind === 'googledrive') return 'Google Drive';
    if (kind === 'onedrive') return 'OneDrive';
    if (kind === 'webdav') return 'WebDAV';
    return 'remote storage';
  }

  function refreshOfflineStatus() {
    var indicator = document.getElementById('saveStatus');
    if (!indicator) return;

    var current = (indicator.textContent || '').trim();
    var lower = current.toLowerCase();
    var remoteKind = getRemoteStorageKind();
    var online = isOnline();

    if (!online && remoteKind) {
      if (lower === 'saved' || lower === LOCAL_SAVE_TEXT.saved.toLowerCase() || lower === '') {
        setStatus('Saved locally · Sync pending', describeRemote(remoteKind) + ' will sync when this device is online.');
      }
      return;
    }

    if (!online) {
      if (lower === 'saved' || lower === LOCAL_SAVE_TEXT.saved.toLowerCase()) {
        setStatus(LOCAL_SAVE_TEXT.saved, 'Saved on this device. CardSpoke does not need internet for local editing.');
      }
      return;
    }

    if (online && remoteKind && lower === 'saved locally · sync pending') {
      setStatus('Saved locally · Sync ready', describeRemote(remoteKind) + ' sync can resume now that this device is online.');
    }
  }

  function normalizeCoreSaveText() {
    var indicator = document.getElementById('saveStatus');
    if (!indicator) return;

    var current = (indicator.textContent || '').trim();
    if (current === 'Saved') {
      var remoteKind = getRemoteStorageKind();
      if (!isOnline() && remoteKind) {
        setStatus('Saved locally · Sync pending', describeRemote(remoteKind) + ' will sync when this device is online.');
      } else {
        setStatus(LOCAL_SAVE_TEXT.saved, 'Saved on this device.');
      }
    } else if (current === 'Saving…') {
      setStatus(LOCAL_SAVE_TEXT.pending, 'Saving to this device.');
    } else if (current === 'Save failed') {
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
