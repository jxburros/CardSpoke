(function() {
  'use strict';

  const Dock = {
    meta: {
      id: 'plugin-quick-capture-dock',
      name: 'Quick Capture Dock',
      type: 'Plugin',
      version: '1.0.1',
      description: 'Collapsible bottom dock for rapid card entry with presets and shortcuts (uses supported CardSpoke utils only).'
    },

    dockEl: null,
    shortcutListener: null,

    onAppInit(ctx) {
      this.renderDock(ctx);
      this.bindShortcut(ctx);
    },

    onDisable() {
      if (this.shortcutListener) {
        document.removeEventListener('keydown', this.shortcutListener);
        this.shortcutListener = null;
      }
      if (this.dockEl && this.dockEl.parentNode) {
        this.dockEl.parentNode.removeChild(this.dockEl);
      }
      this.dockEl = null;
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

      dock.querySelector('[data-dock-toggle]').onclick = () => this.toggleDock();
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
      const result = await ctx.utils.createCard(payload);
      ctx.utils.showToast('Captured card to backlog', 'success');
      dock.querySelector('[data-dock-title]').value = '';
      ctx.logger.info('Captured card', result.id);
    },

    bindShortcut(ctx) {
      if (this.shortcutListener) return;
      this.shortcutListener = (event) => {
        const key = event.key.toLowerCase();
        if (event.ctrlKey && event.shiftKey && key === 'c') {
          event.preventDefault();
          this.toggleDock(ctx);
        }
      };
      document.addEventListener('keydown', this.shortcutListener);
    },

    toggleDock(ctx) {
      if (!this.dockEl) {
        this.renderDock(ctx);
        return;
      }
      const hidden = this.dockEl.style.display === 'none';
      this.dockEl.style.display = hidden ? 'block' : 'none';
    }
  };

  CardSpoke_MODS.register(Dock.meta.id, Dock);
})();
