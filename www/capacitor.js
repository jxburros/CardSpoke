// Capacitor initialization - Web-compatible version
// This script handles both web-only and native Capacitor environments

(function() {
  'use strict';
  
  // Try to detect if we're in a Capacitor environment
  // In native builds, Capacitor will be injected by the native bridge
  // In web builds, we'll create a minimal shim
  
  if (typeof window.Capacitor === 'undefined') {
    // Web-only environment - create a minimal Capacitor shim
    window.Capacitor = {
      getPlatform: function() {
        return 'web';
      },
      isNativePlatform: function() {
        return false;
      },
      isPluginAvailable: function() {
        return false;
      }
    };
    console.log('[Capacitor] Running in web-only mode');
  } else {
    // Native Capacitor environment detected
    console.log('[Capacitor] Native platform detected:', window.Capacitor.getPlatform());
  }
  
  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    console.log('Capacitor platform:', window.Capacitor.getPlatform());
    console.log('Capacitor native:', window.Capacitor.isNativePlatform());
  });
})();
