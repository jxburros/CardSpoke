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
