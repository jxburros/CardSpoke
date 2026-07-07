# `ctx` API quick reference

The setup body runs as `function(ctx) { <your js> }`. Everything created via
`ctx.api.*` is tracked and auto-removed on suspend/delete. Full detail in
`docs/PLUGIN_SYSTEM.md`.

```text
ctx.modId            plugin id
ctx.appVersion       '0.17.0'
ctx.schemaVersion    4
ctx.config           manifest.config (live; settings panel writes here)
ctx.logger           .log / .info / .warn / .error   (prefixed console)
ctx.utils            async host helpers (createCard, searchCards, setTheme, …)
ctx.api.ui           needs "ui-override"
ctx.api.data         writes need "data-modify"; reads are free
ctx.api.storage      needs "storage"
ctx.api.events       global bus, no permission
ctx.api.middleware   core-operation hooks, no permission
ctx.api.network      needs "network"
ctx.api.filesystem   needs "filesystem" (Capacitor/mobile)
```

## ui  (permission: `ui-override`; showToast is free)

```javascript
const undo = ctx.api.ui.inject(selector, element, position); // 'append'|'prepend'|'before'|'after'
const undo = ctx.api.ui.replace(selector, element);          // original restored on cleanup
ctx.api.ui.registerComponent('Card', { priority: 10, render(props) { return htmlElement; } });
ctx.api.ui.unregisterComponent('Card');
ctx.api.ui.showToast('message', 'success');                  // 'info'|'success'|'warning'|'error'
```

Component names the app renders: `Card` (live, props `{card,isSelected,opts,onSelect}`),
`Header`/`Sidebar`/`SearchBar` (applied once at boot; reload to see them).

## data  (writes: `data-modify`)

```javascript
ctx.api.data.getCard(id);                 // clone or undefined      (free)
ctx.api.data.listCards();                 // clones                  (free)
ctx.api.data.createCard({ title, body, parentId, tags }); // → new id
ctx.api.data.updateCard(id, updates);     // → updated clone
ctx.api.data.deleteCard(id);              // → true
ctx.api.data.getTags(cardId);             // (free)  / getAllTags()  (free)
ctx.api.data.addTag(cardId, tag); removeTag(cardId, tag); setTags(cardId, tags);
const off = ctx.api.data.onUpdate(e => {}); // e = {type:'card.create'|'card.update'|'card.delete', cardId, card?}
```

## storage  (permission: `storage`; async, namespaced `plugin_<id>_`)

```javascript
await ctx.api.storage.set('key', value);   // JSON-serialized
const v = await ctx.api.storage.get('key');// parsed, or null
await ctx.api.storage.remove('key');
const keys = await ctx.api.storage.list(prefix?);
```

## events  (global bus)

```javascript
const off = ctx.api.events.on('my-event', (...args) => {});
ctx.api.events.emit('my-event', payload);
ctx.api.events.once('my-event', cb);
ctx.api.events.off('my-event', cb);
```

## middleware  (core-operation hooks)

```javascript
const off = ctx.api.middleware.register({
  name: 'my-hook',                 // becomes '<pluginId>:my-hook'
  priority: 10,                    // higher runs first (default 0)
  operations: ['card.save'],       // default ['*']
  handler: async (mw, next) => {   // mw.operation, mw.args, mw.preventDefault(), mw.stopPropagation()
    await next();                  // ALWAYS call next() unless intercepting
  }
});
```

| Operation | `mw.args` | preventDefault() |
|---|---|---|
| `card.create` | `[cardId, card]` | no-op (fires after) |
| `card.update` | `[cardId, card]` | no-op (fires after) |
| `card.delete` | `[cardId]` | no-op (fires after) |
| `card.save` | `[store]` | **aborts the save** |
| `card.render` | `[card, cardTileElement]` | no-op (post-process hook) |

## network / filesystem

```javascript
await ctx.api.network.fetch(url, options);   // permission: network
ctx.api.network.xhr();                        // permission: network
await ctx.api.filesystem.readFile(path, options);   // permission: filesystem (mobile)
await ctx.api.filesystem.writeFile(path, data, options);
```
