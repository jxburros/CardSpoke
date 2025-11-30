(function() {
  'use strict';

  const Dock = {
    meta: {
      id: 'plugin-quick-capture-dock',
      name: 'Quick Capture Dock',
      type: 'Plugin',
      version: '1.0.0',
      description: 'Collapsible bottom dock for rapid card entry with presets and shortcuts.'
    },

    dockEl: null,

    onAppInit(ctx) {
      this.renderDock(ctx);
      this.bindShortcuts(ctx);
    },

    renderDock(ctx) {
      if (this.dockEl) return;
      const dock = document.createElement('section');
      dock.id = 'quick-capture-dock';
      dock.style.cssText = [
        'position: fixed',
        'left: 50%',
        'bottom: 0',
        'transform: translateX(-50%)',
        'width: min(960px, 96vw)',
        'background: var(--bg-panel, #16181d)',
        'border: 1px solid var(--border, #2c2f36)',
        'border-radius: 14px 14px 0 0',
        'box-shadow: 0 -10px 30px rgba(0,0,0,0.35)',
        'padding: 12px 16px',
        'z-index: 9999'
      ].join(';');

      dock.innerHTML = `
        <header style="display:flex;align-items:center;gap:8px;">
          <strong style="flex:1">Quick Capture</strong>
          <button aria-label="Close" data-dock-toggle>&#x2715;</button>
        </header>
        <div style="display:flex;gap:8px;margin-top:8px;">
          <input type="text" data-dock-title placeholder="Task title" style="flex:1" />
          <select data-dock-template>
            <option value="blank">Blank</option>
            <option value="bug">Bug</option>
            <option value="idea">Idea</option>
          </select>
          <button class="btn btn-primary" data-dock-submit>Capture</button>
        </div>
      `;

      dock.querySelector('[data-dock-toggle]').onclick = () => dock.remove();
      dock.querySelector('[data-dock-submit]').onclick = () => this.createCard(ctx, dock);
      this.dockEl = dock;
      document.body.appendChild(dock);
    },

    async createCard(ctx, dock) {
      const title = dock.querySelector('[data-dock-title]').value || 'New card';
      const template = dock.querySelector('[data-dock-template]').value;
      const templates = {
        bug: { tags: ['bug'], body: 'Describe the issue, steps, and expected behavior.' },
        idea: { tags: ['idea'], body: 'What is the idea? Who benefits? Expected impact?' },
        blank: { tags: [], body: '' }
      };

      const payload = Object.assign({ title }, templates[template]);
      await ctx.utils.createCard(payload);
      ctx.utils.showToast('Captured card to backlog', 'success');
      dock.querySelector('[data-dock-title]').value = '';
    },

    bindShortcuts(ctx) {
      ctx.utils.registerShortcut('ctrl+shift+c', () => this.renderDock(ctx));
    }
  };

  CardSpoke_MODS.register(Dock.meta.id, Dock);
})();
