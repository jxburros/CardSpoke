(function() {
  'use strict';

  const Overlay = {
    meta: {
      id: 'plugin-insight-overlay',
      name: 'Insight Overlay',
      type: 'Plugin',
      version: '1.1.0',
      description: 'Side panel with analytics, filters, and CSV export using read-only queries.'
    },

    panel: null,

    async onAppInit(ctx) {
      await this.renderPanel(ctx);
      ctx.utils.registerShortcut('ctrl+shift+i', () => this.togglePanel());
      ctx.events.on('card:saved', (card) => this.updateStats(ctx, card));
    },

    async renderPanel(ctx) {
      if (this.panel) return;
      const panel = document.createElement('aside');
      panel.id = 'insight-overlay';
      panel.style.cssText = [
        'position: fixed',
        'top: 0',
        'right: 0',
        'height: 100vh',
        'width: 360px',
        'background: var(--bg-panel, #0f1523)',
        'border-left: 1px solid var(--border, #1f2a3d)',
        'box-shadow: -12px 0 30px rgba(0,0,0,0.35)',
        'padding: 16px',
        'overflow-y: auto',
        'transform: translateX(0)',
        'transition: transform 120ms ease',
        'z-index: 9998'
      ].join(';');

      panel.innerHTML = `
        <header style="display:flex;align-items:center;gap:8px;">
          <strong style="flex:1">Insights</strong>
          <button data-overlay-close aria-label="Close">Close</button>
        </header>
        <section id="insight-summary" style="margin-top:12px;">
          Loading analytics...
        </section>
        <section style="margin-top:16px;display:flex;gap:8px;">
          <input data-filter-tag placeholder="Filter by tag" style="flex:1" />
          <button data-filter-apply class="btn">Apply</button>
        </section>
        <section style="margin-top:12px;display:flex;gap:8px;">
          <button data-export class="btn btn-secondary">Export CSV</button>
          <button data-refresh class="btn btn-secondary">Refresh</button>
        </section>
      `;

      panel.querySelector('[data-overlay-close]').onclick = () => this.hidePanel();
      panel.querySelector('[data-filter-apply]').onclick = () => this.applyFilter(ctx);
      panel.querySelector('[data-refresh]').onclick = () => this.refresh(ctx);
      panel.querySelector('[data-export]').onclick = () => this.exportCsv(ctx);

      this.panel = panel;
      document.body.appendChild(panel);
      await this.refresh(ctx);
    },

    async refresh(ctx) {
      const stats = await ctx.analytics.getBoardSnapshot();
      const summary = this.panel.querySelector('#insight-summary');
      const rows = [
        `<p><strong>Cards:</strong> ${stats.totalCards}</p>`,
        `<p><strong>Avg Cycle Time:</strong> ${stats.avgCycleTime || 'n/a'}</p>`,
        `<p><strong>Tags:</strong> ${stats.topTags.map((t) => `#${t.tag} (${t.count})`).join(', ')}</p>`
      ];
      summary.innerHTML = rows.join('');
    },

    togglePanel() {
      if (!this.panel) return;
      const hidden = this.panel.style.transform.includes('translateX(100%)');
      this.panel.style.transform = hidden ? 'translateX(0)' : 'translateX(100%)';
    },

    hidePanel() {
      if (this.panel) {
        this.panel.style.transform = 'translateX(100%)';
      }
    },

    async applyFilter(ctx) {
      const tag = this.panel.querySelector('[data-filter-tag]').value.trim();
      if (!tag) return this.refresh(ctx);
      const cards = await ctx.utils.searchCards(`#${tag}`);
      const summary = this.panel.querySelector('#insight-summary');
      summary.innerHTML = `<p><strong>${cards.length}</strong> cards with #${tag}</p>`;
    },

    async exportCsv(ctx) {
      const stats = await ctx.analytics.getBoardSnapshot();
      const csv = ctx.utils.toCsv([
        ['metric', 'value'],
        ['total_cards', stats.totalCards],
        ['avg_cycle_time', stats.avgCycleTime],
        ...stats.topTags.map((t) => [`tag_${t.tag}`, t.count])
      ]);
      ctx.utils.download(csv, 'insights.csv');
      ctx.utils.showToast('Exported insights to CSV', 'success');
    },

    updateStats(ctx, card) {
      ctx.logger.log(`Card ${card.id} saved; analytics overlay will refresh.`);
    }
  };

  CardSpoke_MODS.register(Overlay.meta.id, Overlay);
})();
