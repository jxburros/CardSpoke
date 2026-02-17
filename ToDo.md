Phase 1: Core Instrumentation (Connecting the Machinery)
[ ] Instrument Data Operations with Middleware: Wrap core functions (e.g., createCard, updateCard, deleteCard in 03-data-and-modals.js) with window.CardSpoke.Middleware.run(operation, args).

[ ] Instrument UI Rendering with Component Registry: Update rendering logic in 04-rendering-and-init.js to check window.CardSpoke.ComponentRegistry.get(componentName) before falling back to default HTML templates.

[ ] Abstract Global Dependencies: Update plugin-api.js to use a stable internal reference for core functions instead of relying on the mutable window object.

Phase 2: AI-Agent Readability & Grounding
[ ] Generate TypeScript Definitions: Maintain types/index.d.ts as the "ground truth" for the API surface so an AI agent knows the exact signatures for ctx.api.

[ ] Create a Capabilities Manifest: Produce a static JSON file (e.g., capabilities.json) that explicitly lists all available Middleware operations (card.save, ui.render), Component names (Card, Sidebar), and stable DOM selectors.

[ ] Implement Semantic Selectors: Add data-plugin-anchor attributes to key UI elements in index.html to provide stable targets for AI-generated DOM manipulation.

Phase 3: Developer & Agent Experience
[ ] Implement a "Plugin Sandbox": Build a UI panel in the "Create" tab of the Plugin Manager that allows for hot-reloading code snippets.

[ ] Add Scoped Error Handling: Wrap setup() and teardown() calls in plugin-api.js with try/catch blocks that automatically disable a plugin and log detailed stack traces to ctx.logger.

[ ] Standardize Plugin Scaffolding: Provide a "Runtime Registration Format" template that AI agents can use as a consistent starting point.

Phase 4: Validation & Safety
[ ] Enforce Permission Checks: Ensure _checkPermissions in plugin-api.js is fully integrated before enabling any feature or app layer plugins.

[ ] Audit Resource Cleanup: Verify that the _cleanupResources method in plugin-api.js correctly removes all DOM elements, event listeners, and components registered by a plugin.
