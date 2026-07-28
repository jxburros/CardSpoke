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

// Plugin vnode system
//
// Plugin JS runs inside a Worker with no DOM. It cannot build a real
// HTMLElement and hand it to the host (elements aren't structured-clonable,
// and even if they were, that would defeat the isolation). Instead plugins
// describe UI as a plain, serializable tree via `h(tag, props, children)`,
// and the host (which owns the real document) turns that description into
// real DOM.
//
// `h` has no DOM dependency and is safe to call from inside the worker.
// Everything else in this file (`vnodeToDOM`, `updateElementFromVnode`,
// `applyPatch`) touches `document`/live elements and only ever runs on the
// host side.

const EVENT_PROP_PATTERN = /^on([a-z]+)$/i;

/**
 * Build a vnode. Safe to call from a Worker (no DOM access required).
 *
 *   ctx.h('button', { className: 'my-btn', onclick: () => {...} }, ['Click me'])
 */
export function h(tag, props, children) {
  if (typeof tag !== 'string' || !tag) {
    throw new Error('ctx.h: tag must be a non-empty string');
  }
  return {
    __vnode: true,
    tag: tag,
    props: props || {},
    children: normalizeChildren(children)
  };
}

function normalizeChildren(children) {
  if (children == null) return [];
  const flat = Array.isArray(children) ? children : [children];
  return flat.filter(c => c !== null && c !== undefined && c !== false);
}

function isVnode(value) {
  return !!(value && typeof value === 'object' && value.__vnode);
}

/** Apply style/dataset/className/event/plain-attribute props to a real element. */
function applyProps(el, props) {
  Object.keys(props || {}).forEach(key => {
    const value = props[key];
    if (value === null || value === undefined) return;

    if (key === 'style') {
      if (typeof value === 'string') {
        el.style.cssText = value;
      } else if (typeof value === 'object') {
        Object.keys(value).forEach(prop => {
          el.style[prop] = value[prop];
        });
      }
      return;
    }

    if (key === 'dataset') {
      Object.keys(value).forEach(dk => {
        el.dataset[dk] = value[dk];
      });
      return;
    }

    if (key === 'className' || key === 'class') {
      el.className = value;
      return;
    }

    const eventMatch = key.match(EVENT_PROP_PATTERN);
    if (eventMatch && typeof value === 'function') {
      const eventType = eventMatch[1].toLowerCase();
      el.addEventListener(eventType, makeDomListener(value));
      return;
    }

    // Plain attribute. Booleans reflect as presence/absence (checked,
    // disabled, readOnly, ...); everything else is set via setAttribute so
    // it round-trips through outerHTML/serialization normally.
    if (typeof value === 'boolean') {
      if (value) el.setAttribute(key, '');
      else el.removeAttribute(key);
      if (key in el) {
        try { el[key] = value; } catch (_e) { /* read-only IDL attribute, ignore */ }
      }
    } else {
      el.setAttribute(key, String(value));
      if (key === 'value' && 'value' in el) el.value = value;
    }
  });
}

/**
 * Wrap a plugin-provided event handler (already deserialized by plugin-rpc
 * into a remote-callback function that round-trips into the plugin's
 * worker) so the real DOM Event object is never handed across the boundary
 * — Events aren't structured-clonable and shouldn't be exposed raw anyway.
 * Only an explicit, safe subset of fields crosses over; the handler's
 * returned value (if any) can request preventDefault()/stopPropagation().
 */
function makeDomListener(remoteHandler) {
  return function domListener(event) {
    const descriptor = {
      type: event.type,
      key: event.key,
      code: event.code,
      clientX: event.clientX,
      clientY: event.clientY,
      target: {
        value: event.target && 'value' in event.target ? event.target.value : undefined,
        checked: event.target && 'checked' in event.target ? event.target.checked : undefined,
        dataset: event.target && event.target.dataset ? Object.assign({}, event.target.dataset) : undefined
      }
    };
    // Returning this promise is harmless for a real DOM addEventListener
    // (the return value of an event listener is ignored) and lets a test
    // harness `await el._dispatch('click', ...)` deterministically instead
    // of guessing at a timeout for the RPC round trip to settle.
    return Promise.resolve(remoteHandler(descriptor)).then(result => {
      if (result && result.preventDefault) event.preventDefault();
      if (result && result.stopPropagation) event.stopPropagation();
    }).catch(err => {
      console.error('[Plugin] Event handler error:', err);
    });
  };
}

/** Build a real DOM subtree from a vnode. Host-only (uses `document`). */
export function vnodeToDOM(vnode) {
  if (vnode === null || vnode === undefined) return document.createTextNode('');
  if (typeof vnode === 'string' || typeof vnode === 'number') {
    return document.createTextNode(String(vnode));
  }
  if (!isVnode(vnode)) {
    throw new Error('Invalid vnode: expected the result of ctx.h(...)');
  }

  const el = document.createElement(vnode.tag);
  applyProps(el, vnode.props);
  vnode.children.forEach(child => {
    el.appendChild(vnodeToDOM(child));
  });
  return el;
}

/**
 * Replace an existing element's attributes/children in place from a new
 * vnode, without changing its identity in the DOM tree (so callers that
 * captured a reference to the element itself — undo functions, etc. — keep
 * working). Used by the `update()` handle returned from `ui.inject`/
 * `ui.replace` so plugins can revise UI they previously built without ever
 * holding a live node reference themselves.
 */
export function updateElementFromVnode(el, vnode) {
  if (!isVnode(vnode)) {
    throw new Error('Invalid vnode: expected the result of ctx.h(...)');
  }
  // Clear existing attributes (except housekeeping data-* the host itself
  // may have set, e.g. data-plugin-id) and children, then reapply.
  Array.from(el.attributes).forEach(attr => {
    if (attr.name.indexOf('data-plugin') !== 0) el.removeAttribute(attr.name);
  });
  while (el.firstChild) el.removeChild(el.firstChild);
  applyProps(el, vnode.props);
  vnode.children.forEach(child => {
    el.appendChild(vnodeToDOM(child));
  });
}

/**
 * Apply a `card.render` decorator patch (see PLUGIN_SYSTEM.md) to a real,
 * already-built card tile element. Host-only.
 *
 * patch: {
 *   addClass?: string[], removeClass?: string[],
 *   setStyle?: { [selector]: { [cssProp]: value } },
 *   setStyleByIndex?: { [selector]: Array<{ [cssProp]: value }> },
 *   appendChildren?: { [selector]: Vnode[] },
 *   prependChildren?: { [selector]: Vnode[] }
 * }
 * An empty-string selector addresses the root tile element itself.
 */
export function applyPatch(rootEl, patch) {
  if (!patch || typeof patch !== 'object') return;

  (patch.addClass || []).forEach(cls => rootEl.classList.add(cls));
  (patch.removeClass || []).forEach(cls => rootEl.classList.remove(cls));

  Object.keys(patch.setStyle || {}).forEach(selector => {
    const target = selector === '' ? rootEl : rootEl.querySelector(selector);
    if (!target) return;
    const styles = patch.setStyle[selector];
    Object.keys(styles).forEach(prop => { target.style[prop] = styles[prop]; });
  });

  Object.keys(patch.setStyleByIndex || {}).forEach(selector => {
    const targets = rootEl.querySelectorAll(selector);
    const stylesList = patch.setStyleByIndex[selector];
    targets.forEach((target, i) => {
      const styles = stylesList[i];
      if (!styles) return;
      Object.keys(styles).forEach(prop => { target.style[prop] = styles[prop]; });
    });
  });

  Object.keys(patch.appendChildren || {}).forEach(selector => {
    const target = selector === '' ? rootEl : rootEl.querySelector(selector);
    if (!target) return;
    (patch.appendChildren[selector] || []).forEach(vnode => {
      target.appendChild(vnodeToDOM(vnode));
    });
  });

  Object.keys(patch.prependChildren || {}).forEach(selector => {
    const target = selector === '' ? rootEl : rootEl.querySelector(selector);
    if (!target) return;
    (patch.prependChildren[selector] || []).slice().reverse().forEach(vnode => {
      target.insertBefore(vnodeToDOM(vnode), target.firstChild);
    });
  });
}

export { isVnode };
