// Adapter loaded inside a real Node worker_threads.Worker. Bridges the
// browser Worker global API (self.postMessage / self.addEventListener) that
// www/src/core/plugin-worker-bootstrap.js is written against onto Node's
// parentPort API, so the exact same production bootstrap source runs under
// test with real OS-thread isolation (not a mock).
import { parentPort, workerData } from 'worker_threads';

// In a REAL browser Worker, `self` IS the global object (self === globalThis),
// which is exactly why plugin-worker-bootstrap.js's `Object.defineProperty(self,
// 'fetch', ...)` strip also shadows the bare `fetch` identifier used anywhere
// else in plugin code. Node's worker_threads has its own ambient `fetch`
// global with no `self` at all, so `self` is aliased directly to `globalThis`
// here (not a separate stand-in object) to reproduce that exact semantic —
// an earlier version of this adapter used a plain object and the strip
// silently failed to shadow the bare `fetch` identifier.
globalThis.postMessage = msg => parentPort.postMessage(msg);
globalThis.addEventListener = (type, handler) => {
  if (type === 'message') {
    parentPort.on('message', data => handler({ data }));
  }
  // 'error'/'messageerror' listeners registered by the bootstrap itself
  // (it doesn't register any today) would go here too.
};
globalThis.self = globalThis;

await import(workerData.bootstrapUrl);
