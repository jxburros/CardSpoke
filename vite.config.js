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
  // Build configuration
  build: {
    outDir: 'www/dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'www/index.html'),
        'core-systems': resolve(__dirname, 'www/src/core-systems-bundle.js')
      },
      output: {
        // Enable code splitting for dynamic imports
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
          if (id.includes('www/src/core/')) {
            return 'core';
          }
        }
      }
    },
    // Generate source maps for debugging
    sourcemap: true,
    // Optimize for modern browsers
    target: 'es2020',
    // Enable dynamic imports
    dynamicImportVarsOptions: {
      warnOnError: true
    }
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

  // Optimization
  optimizeDeps: {
    include: []
  },

  // Define global constants
  define: {
    __APP_VERSION__: JSON.stringify('0.17.0'),
    __SCHEMA_VERSION__: 4
  }
});
