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


import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Build configuration — produces a single IIFE bundle at www/app.js
  build: {
    outDir: 'www',
    emptyOutDir: false,
    rollupOptions: {
      input: resolve(__dirname, 'www/src/main.js'),
      output: {
        // Bundle everything into a single self-executing IIFE
        format: 'iife',
        // The IIFE name is the isolated internal namespace (not the public API)
        name: 'CardSpokeCore',
        // Output directly to www/app.js (same path as the legacy cat build)
        entryFileNames: 'app.js'
      }
    },
    // Generate source maps for debugging
    sourcemap: true,
    // Optimize for modern browsers
    target: 'es2020'
  },

  // Development server configuration
  server: {
    port: 3000,
    open: true,
    cors: true
  },

  // Resolve configuration
  resolve: {
    alias: {
      '@': resolve(__dirname, 'www/src'),
      '@core': resolve(__dirname, 'www/src/core'),
      '@types': resolve(__dirname, 'types')
    }
  },

  // Plugin configuration
  plugins: [],

  // Define global constants
  define: {
    __APP_VERSION__: JSON.stringify('0.17.0'),
    __SCHEMA_VERSION__: 4
  }
});
