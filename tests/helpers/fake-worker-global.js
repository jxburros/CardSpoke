// A `Worker` global for the test environment that satisfies the browser
// Worker API surface plugin-worker-manager.js calls (`new Worker(url, {type})`,
// `postMessage`, `addEventListener('message'|'error', fn)`, `terminate()`),
// backed by a REAL Node worker_threads.Worker running the actual
// www/src/core/plugin-worker-bootstrap.js source — real thread isolation,
// not a same-process mock, so a test that strips `self.fetch` inside the
// sandbox genuinely cannot observe the test process's globals and vice versa.
import { Worker as ThreadWorker } from 'worker_threads';
import { fileURLToPath, pathToFileURL } from 'url';
import { resolve, dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ADAPTER_PATH = resolve(__dirname, 'worker-thread-adapter.mjs');
const BOOTSTRAP_URL = pathToFileURL(resolve(__dirname, '../../www/src/core/plugin-worker-bootstrap.js')).href;

export class FakeWorker {
  constructor(_scriptUrl, _options) {
    this._listeners = { message: [], error: [] };
    this._thread = new ThreadWorker(ADAPTER_PATH, {
      workerData: { bootstrapUrl: BOOTSTRAP_URL }
    });
    this._thread.on('message', data => {
      this._listeners.message.forEach(fn => fn({ data }));
    });
    this._thread.on('error', err => {
      this._listeners.error.forEach(fn => fn({ message: err && err.message }));
    });
  }

  postMessage(msg) {
    this._thread.postMessage(msg);
  }

  addEventListener(type, fn) {
    (this._listeners[type] || (this._listeners[type] = [])).push(fn);
  }

  terminate() {
    this._thread.terminate();
  }
}

/** Install FakeWorker as the global `Worker` for the current test process. */
export function installFakeWorkerGlobal() {
  global.Worker = FakeWorker;
}
