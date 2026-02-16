# CardSpoke Architecture Diagram

## Before (Legacy Hook System)

```
┌─────────────────────────────────────────────────────────┐
│                     CardSpoke App                        │
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Application Code                     │   │
│  │  • Card CRUD operations                          │   │
│  │  • Rendering logic                               │   │
│  │  • Navigation                                    │   │
│  └──────────────────────────────────────────────────┘   │
│                          ↓                               │
│  ┌──────────────────────────────────────────────────┐   │
│  │          runModHook() Dispatcher                 │   │
│  │  • Fires hooks after operations                  │   │
│  │  • No interception capability                    │   │
│  └──────────────────────────────────────────────────┘   │
│                          ↓                               │
│  ┌──────────────────────────────────────────────────┐   │
│  │     window.CardSpoke_MODS (Global)              │   │
│  │  • Direct access to everything                   │   │
│  │  • No resource tracking                          │   │
│  │  • No sandboxing                                 │   │
│  └──────────────────────────────────────────────────┘   │
│                          ↓                               │
│            ┌─────────────┬─────────────┐                │
│            ↓             ↓             ↓                │
│      ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│      │  Mod 1  │  │  Mod 2  │  │  Mod 3  │            │
│      │ onLoad  │  │onSave   │  │onRender │            │
│      └─────────┘  └─────────┘  └─────────┘            │
└─────────────────────────────────────────────────────────┘
```

## After (Modern Architecture)

```
┌────────────────────────────────────────────────────────────────────┐
│                          CardSpoke App                              │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │              Core Application Layer                         │   │
│  │  • Card CRUD • Rendering • Navigation • Search             │   │
│  └────────────────────────────────────────────────────────────┘   │
│                               ↓                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │            🔄 Middleware Pipeline                          │   │
│  │  ┌────────────────────────────────────────────────────┐   │   │
│  │  │  Priority Queue (Higher → Lower)                   │   │   │
│  │  │  • Validator (100) → Interceptor (50) → Logger (-100)│  │   │
│  │  │  • Can modify, cancel, or pass-through            │   │   │
│  │  │  • Operations: card.save, card.delete, etc.       │   │   │
│  │  └────────────────────────────────────────────────────┘   │   │
│  └────────────────────────────────────────────────────────────┘   │
│                               ↓                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │            🎨 Component Registry                           │   │
│  │  ┌────────────────────────────────────────────────────┐   │   │
│  │  │  Component Map (Priority-based)                    │   │   │
│  │  │  • Card → CustomCard (priority: 50)               │   │   │
│  │  │  • SearchBar → EnhancedSearch (priority: 75)      │   │   │
│  │  │  • Sidebar → CustomSidebar (priority: 10)         │   │   │
│  │  └────────────────────────────────────────────────────┘   │   │
│  └────────────────────────────────────────────────────────────┘   │
│                               ↓                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │            🔌 Plugin Manager                               │   │
│  │  ┌────────────────────────────────────────────────────┐   │   │
│  │  │  Active Plugins (Isolated Contexts)               │   │   │
│  │  │  ┌──────────────┬──────────────┬──────────────┐  │   │   │
│  │  │  │   Plugin 1   │   Plugin 2   │   Plugin 3   │  │   │   │
│  │  │  │   Context    │   Context    │   Context    │  │   │   │
│  │  │  └──────────────┴──────────────┴──────────────┘  │   │   │
│  │  └────────────────────────────────────────────────────┘   │   │
│  └────────────────────────────────────────────────────────────┘   │
│                               ↓                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │            🔐 Permissions System                           │   │
│  │  • User consent dialogs                                    │   │
│  │  • Permission checking: ui-override, storage, network      │   │
│  │  • Revocable permissions                                   │   │
│  └────────────────────────────────────────────────────────────┘   │
│                               ↓                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │            💾 Storage Driver Registry                      │   │
│  │  ┌────────────────────────────────────────────────────┐   │   │
│  │  │  Available Drivers                                 │   │   │
│  │  │  • IndexedDB (default) ✓                          │   │   │
│  │  │  • LocalStorage                                   │   │   │
│  │  │  • Custom Cloud Driver (plugin)                   │   │   │
│  │  │  • Git-based Driver (plugin)                      │   │   │
│  │  └────────────────────────────────────────────────────┘   │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │            🛠️  Plugin API (Sandboxed)                      │   │
│  │  ┌──────────────────┬──────────────────┐                  │   │
│  │  │   ctx.api.ui     │   ctx.api.data   │                  │   │
│  │  │   • inject()     │   • getCard()    │                  │   │
│  │  │   • replace()    │   • listCards()  │                  │   │
│  │  │   • register()   │   • onUpdate()   │                  │   │
│  │  └──────────────────┴──────────────────┘                  │   │
│  │  ┌──────────────────┬──────────────────┐                  │   │
│  │  │ ctx.api.storage  │  ctx.api.events  │                  │   │
│  │  │   • get()        │   • on()         │                  │   │
│  │  │   • set()        │   • emit()       │                  │   │
│  │  │   • namespaced   │   • once()       │                  │   │
│  │  └──────────────────┴──────────────────┘                  │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │            🔄 Compatibility Bridge                         │   │
│  │  • Maps legacy hooks to middleware                         │   │
│  │  • CardSpoke_MODS → Plugin API                            │   │
│  │  • 100% backward compatible                                │   │
│  └────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────┘
```

## Data Flow: Card Save Operation

### Before (Legacy)
```
User clicks Save
    ↓
createCard() / updateCard()
    ↓
Store updated
    ↓
runModHook('onCardSave', card)
    ↓
Mods notified (after the fact)
    ↓
No way to intercept or modify
```

### After (Modern)
```
User clicks Save
    ↓
Middleware.run('card.save', [card])
    ↓
Validator Middleware (priority: 100)
    ├─ Validates card data
    ├─ Can prevent() if invalid
    └─ Calls next()
    ↓
Enrichment Middleware (priority: 50)
    ├─ Adds metadata
    ├─ Modifies card object
    └─ Calls next()
    ↓
createCard() / updateCard()
    ↓
Store updated
    ↓
Logger Middleware (priority: -100)
    ├─ Logs the operation
    └─ Calls next()
    ↓
Plugin.notifyDataUpdate({ type: 'create', card })
    ↓
Plugins receive update via ctx.api.data.onUpdate()
    ↓
Components re-render via Component Registry
```

## Plugin Lifecycle

```
┌────────────────────────────────────────────────┐
│              Plugin Registration                │
│  CardSpoke.Plugin.register('my-plugin', def)   │
└────────────────────────────────────────────────┘
                     ↓
┌────────────────────────────────────────────────┐
│          Permission Check (if needed)           │
│  • User sees consent dialog                    │
│  • Approves permissions                        │
└────────────────────────────────────────────────┘
                     ↓
┌────────────────────────────────────────────────┐
│              Plugin Activation                  │
│  1. Create isolated context                    │
│  2. Apply CSS                                  │
│  3. Call setup(ctx)                            │
│  4. Track resources                            │
└────────────────────────────────────────────────┘
                     ↓
┌────────────────────────────────────────────────┐
│              Plugin Active                      │
│  • Responds to events                          │
│  • Modifies UI via ctx.api                     │
│  • Resources tracked                           │
└────────────────────────────────────────────────┘
                     ↓
┌────────────────────────────────────────────────┐
│           Plugin Deactivation                   │
│  1. Call teardown(ctx)                         │
│  2. Remove CSS                                 │
│  3. Clean up resources automatically           │
│  4. Remove DOM elements                        │
│  5. Unregister listeners                       │
│  6. Storage persists                           │
└────────────────────────────────────────────────┘
```

## Component Override Resolution

```
Component Request: "Card"
         ↓
┌─────────────────────────────┐
│   Component Registry        │
│                             │
│   Registered Components:    │
│   • DefaultCard (p: 0)     │
│   • ThemeCard (p: 50)      │
│   • FeatureCard (p: 75)    │
│   • AppCard (p: 100)   ← Selected (highest)
└─────────────────────────────┘
         ↓
   AppCard.render(props)
         ↓
   Returns HTMLElement
```

## Key Architectural Principles

### 1. Separation of Concerns
- **Core**: Business logic and data management
- **Middleware**: Operation interception and modification
- **Components**: UI rendering and presentation
- **Plugins**: Extensions and customization
- **Storage**: Data persistence abstraction

### 2. Priority-Based Resolution
- **Middleware**: Higher priority runs first
- **Components**: Higher priority overrides lower
- **Deterministic**: Same priority = last registered wins

### 3. Resource Management
- **Automatic Tracking**: All resources tracked via plugin context
- **Clean Unload**: Resources removed on plugin disable
- **No Leaks**: WeakMap/WeakSet prevent memory leaks

### 4. Security Layers
- **Sandboxing**: Isolated plugin contexts
- **Permissions**: Explicit capability model
- **Validation**: Middleware can validate operations
- **Namespacing**: Storage automatically isolated

### 5. Backward Compatibility
- **Bridge Layer**: Translates legacy calls
- **Dual Support**: Both systems coexist
- **Gradual Migration**: No forced upgrades
- **Zero Breaking**: All existing mods work

## Technology Stack

```
┌─────────────────────────────────────────┐
│          Development Layer              │
│  • TypeScript definitions               │
│  • Vite build system                    │
│  • ES modules support                   │
│  • Hot module replacement               │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│          Application Layer              │
│  • Middleware Pipeline (ES2020)        │
│  • Component Registry (ES2020)         │
│  • Plugin Manager (ES2020)             │
│  • Storage Abstraction (ES2020)        │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│          Runtime Layer                  │
│  • Modern JavaScript (ES2020+)         │
│  • IndexedDB / LocalStorage            │
│  • DOM API                             │
│  • Capacitor (mobile)                  │
└─────────────────────────────────────────┘
```

## Performance Characteristics

| System | Lookup | Registration | Execution |
|--------|--------|--------------|-----------|
| Middleware | O(1) cached | O(n log n) sort | O(n) pipeline |
| Components | O(1) Map | O(1) | O(1) |
| Plugin API | O(1) Map | O(1) | O(1) |
| Storage | O(1) Map | O(1) | Depends on driver |

## Size Impact

| Component | Size (minified) | Size (gzipped) |
|-----------|----------------|----------------|
| Middleware | ~3 KB | ~1.2 KB |
| Component Registry | ~2 KB | ~0.8 KB |
| Plugin API | ~6 KB | ~2.5 KB |
| Storage Registry | ~1.5 KB | ~0.6 KB |
| Permissions | ~2.5 KB | ~1 KB |
| **Total New Code** | **~15 KB** | **~6 KB** |

## Conclusion

The new architecture provides:
- ✅ Modern plugin development experience
- ✅ Enterprise-grade security and isolation
- ✅ Type safety and developer tooling
- ✅ Pluggable storage and UI components
- ✅ Perfect backward compatibility
- ✅ Minimal performance overhead

While maintaining:
- ✅ Simple API for basic plugins
- ✅ Local-first data model
- ✅ Lightweight core bundle
- ✅ File:// protocol support
