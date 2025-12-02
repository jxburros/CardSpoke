# Extension Cookbook

Practical recipes for building CardSpoke extensions. Every snippet assumes the runtime provides `window`, `document`, `CardSpoke_MODS`, and `CardSpoke.utils`.

## 1) Minimal extension skeleton
Use an IIFE that calls `CardSpoke_MODS.register` exactly once. Add metadata and only the hooks you need.

```js
(() => {
  CardSpoke_MODS.register('my-mod', {
    meta: { name: 'My Mod', type: 'Plugin', version: '1.0.0', source: 'community' },
    onAppInit(ctx) {
      ctx.logger.info('Ready on schema', ctx.schemaVersion);
    },
    onDisable() {
      // clean up listeners/DOM here
    }
  });
})();
```

## 2) React to card renders
Attach UI affordances after the card element exists.

```js
(() => {
  CardSpoke_MODS.register('render-highlight', {
    meta: { name: 'Render Highlight', type: 'Patch', version: '1.0.0' },
    onCardRender(ctx, card, el) {
      const badge = document.createElement('span');
      badge.textContent = `#${card.tags?.[0] || 'untagged'}`;
      badge.className = 'render-badge';
      el.appendChild(badge);
    },
    onDisable() {
      document.querySelectorAll('.render-badge').forEach(n => n.remove());
    }
  });
})();
```

## 3) Guard destructive actions
Block deletes for certain cards using `onCardDelete`.

```js
(() => {
  CardSpoke_MODS.register('protect-parents', {
    meta: { name: 'Protect Parents', type: 'Patch', version: '1.0.0' },
    onCardDelete(ctx, card) {
      if (card.children && card.children.length) {
        ctx.api.showToast('Cannot delete a card that has children', 'error');
        return false; // prevent deletion
      }
    }
  });
})();
```

## 4) Use the event bus for cross-mod messaging

```js
(() => {
  CardSpoke_MODS.register('bus-producer', {
    meta: { name: 'Bus Producer', type: 'Plugin', version: '1.0.0' },
    onAppInit(ctx) {
      setInterval(() => CardSpoke_MODS.events.emit('heartbeat', Date.now()), 5000);
    },
    onDisable() {
      CardSpoke_MODS.events.clear('heartbeat');
    }
  });

  CardSpoke_MODS.register('bus-consumer', {
    meta: { name: 'Bus Consumer', type: 'Plugin', version: '1.0.0' },
    onAppInit(ctx) {
      const cb = (timestamp) => ctx.logger.info('Heartbeat', timestamp);
      CardSpoke_MODS.events.on('heartbeat', cb);
      this._cb = cb;
    },
    onDisable() {
      if (this._cb) CardSpoke_MODS.events.off('heartbeat', this._cb);
    }
  });
})();
```

## 5) Tap into accessibility changes
React to theme, typography, and high-contrast toggles.

```js
(() => {
  CardSpoke_MODS.register('a11y-listener', {
    meta: { name: 'A11y Listener', type: 'Plugin', version: '1.0.0' },
    onThemeChange(ctx, theme) {
      ctx.logger.info('Theme changed to', theme);
    },
    onTypographyChange(ctx, preset) {
      ctx.logger.info('Typography preset', preset);
    },
    onHighContrastChange(ctx, enabled) {
      ctx.logger.info('High contrast', enabled);
    }
  });
})();
```

## 6) Use CardSpoke.utils for quick CRUD

```js
(async () => {
  const { id } = await CardSpoke.utils.createCard({ title: 'Cookbook Demo', tags: ['demo'] });
  await CardSpoke.utils.updateCard(id, { body: 'Filled in later' });
  const allTags = await CardSpoke.utils.getAllTags();
  await CardSpoke.utils.showToast(`Created card ${id} with ${allTags.length} tags known`, 'success');
})();
```

## 7) Hot reload for rapid iteration
- Store your extension definition in `store.mods[<id>]` (the built-in UI does this automatically).
- Call `CardSpoke_MODS.reload('<id>')` after editing `js`/`css` to replay `onDisable`, re-run registration, and re-fire `onAppInit`.

## 8) Error handling and diagnostics
- `CardSpoke_MODS.devTools.getErrorLog()` returns structured errors captured during hook execution.
- `CardSpoke_MODS.devTools.getHookStats('<id>')` shows execution counts and timings to spot slow hooks.
- `CardSpoke_MODS.devTools.testHook('<id>', 'onAppInit')` manually exercises a hook with your own arguments.

## 9) Storage-aware extensions
When persisting data, pick a namespaced key and clean it up in `onUninstall`. Use `ctx.api.getDatasetMeta()` to check available storage counts and schema versions before writing large payloads.

## 10) Publishing checklist
- Provide complete metadata (name, type, version, creator, description, source, release date, schema compatibility).
- Respond to `onDisable` for any DOM or timers you create.
- Avoid mutating globals directly; prefer hooks, the event bus, and `ctx.api`.
- Declare any capabilities you expect (e.g., `['tags', 'a11y', 'export']`) so users know what your mod touches.
