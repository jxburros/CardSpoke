#!/usr/bin/env node
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

// Bundles the plugin sandbox's worker entry point into a single, standalone
// ES module at www/plugin-worker-bootstrap.js.
//
// This is a SEPARATE build step from the main `vite build` on purpose: the
// app bundle (www/app.js) is built as a single-entry IIFE (see the
// flatten-app-scope plugin in vite.config.js), and Rollup's iife/umd output
// formats only support one entry point per build — they cannot also emit a
// second, independent ES-module chunk for the worker in the same pass.
// Bundling the worker separately with esbuild (already a transitive
// dependency of vite) keeps the existing app build untouched while still
// resolving the worker's own `./plugin-rpc.js` / `./plugin-vnode.js`
// imports into one self-contained file — loaded via
// `new Worker('./plugin-worker-bootstrap.js', { type: 'module' })`, a
// runtime construct Vite's dev/build module graph cannot see ahead of time,
// so a real static file has to exist at that path either way.
//
// Run via `npm run build` and `npm run dev` (both chained BEFORE `vite`/
// `vite build`), so the static file already exists at www/plugin-worker-
// bootstrap.js by the time vite.config.js's copy-site-to-dist plugin copies
// it into dist/. Editing plugin-worker-bootstrap.js, plugin-rpc.js, or
// plugin-vnode.js during `npm run dev` requires re-running this script (or
// restarting dev) to pick up the change — the same rebuild friction the
// project already accepts for www/app.js itself.

import { build } from 'esbuild';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

async function main() {
  await build({
    entryPoints: [resolve(ROOT, 'www/src/core/plugin-worker-bootstrap.js')],
    bundle: true,
    format: 'esm',
    target: 'es2020',
    platform: 'browser',
    outfile: resolve(ROOT, 'www/plugin-worker-bootstrap.js'),
    sourcemap: true,
    minify: false,
    logLevel: 'info'
  });
}

main().catch(err => {
  console.error('[build-plugin-worker] failed:', err);
  process.exit(1);
});
