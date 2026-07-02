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
 * Core-only build target (`npm run build:core`).
 *
 * Bundles the reusable, DOM-free CardSpoke Core (www/src/core/index.js) —
 * kernel, typed cards, queries, migrations, actions, conversions, app modes,
 * profiles, import/export — into standalone artifacts that future shells
 * (lite, OS-native) can import without the full CardSpoke UI:
 *
 *   dist/cardspoke-core.js   (ESM)
 *   dist/cardspoke-core.umd.cjs (UMD, global `CardSpokeCore`)
 *
 * See docs/architecture/CORE_SHELL_SPLIT.md.
 */

import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'www/src/core/index.js'),
      name: 'CardSpokeCore',
      formats: ['es', 'umd'],
      fileName: (format) => format === 'es' ? 'cardspoke-core.js' : 'cardspoke-core.umd.cjs'
    },
    minify: false,
    sourcemap: true,
    target: 'es2020'
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'www/src'),
      '@core': resolve(__dirname, 'www/src/core')
    }
  }
});
