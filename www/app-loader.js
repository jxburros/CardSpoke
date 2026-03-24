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
 * Application entry point loader.
 * Prefers the stable bundled app.js; falls back to the ESM entry (src/main.js)
 * if app.js fails to load (e.g. file not found).
 *
 * This is an external script file so it can be served under the 'self' CSP
 * source without requiring 'unsafe-inline'.
 */
(function() {
  function loadModuleEntry() {
    var entry = document.createElement('script');
    entry.type = 'module';
    entry.src = './src/main.js';
    document.body.appendChild(entry);
  }

  var bundle = document.createElement('script');
  bundle.src = './app.js';
  bundle.defer = true;
  bundle.onerror = loadModuleEntry;
  document.body.appendChild(bundle);
})();
