(function() {
  'use strict';

  const Overlay = {
    meta: {
      id: 'plugin-insight-overlay',
      name: 'Insight Overlay',
      type: 'Plugin',
      version: '1.1.1',
      description: 'Side panel with analytics, filters, and CSV export using supported CardSpoke mod hooks and APIs.'
    },

    panel: null,
    lastRenderedTag: '',

    onAppInit(ctx) {
      this.renderPanel(ctx);
    },

    onCardSave(ctx) {
      // Keep analytics in sync without relying on custom events
      this.refresh(ctx);
    },

    onDisable() {
      if (this.panel && this.panel.parentNode) {
        this.panel.parentNode.removeChild(this.panel);
      }
      this.panel = null;
    },

    renderPanel(ctx) {
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
      this.refresh(ctx);
    },

    refresh(ctx) {
      if (!this.panel) return;
      const { totalCards, avgCycleTime, topTags } = this.computeSnapshot(ctx);
      const summary = this.panel.querySelector('#insight-summary');
      const rows = [
        `<p><strong>Cards:</strong> ${totalCards}</p>`,
        `<p><strong>Avg Cycle Time:</strong> ${avgCycleTime ?? 'n/a'}</p>`,
        `<p><strong>Tags:</strong> ${topTags.map((t) => `#${t.tag} (${t.count})`).join(', ') || 'none'}</p>`
      ];
      summary.innerHTML = rows.join('');
    },

    computeSnapshot(ctx) {
      const cards = ctx.api.listCards();
      const tagCounts = {};
      let cycleTimeTotal = 0;
      let cycleTimeCount = 0;

      cards.forEach((card) => {
        (card.tags || []).forEach((tag) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });

        if (card.createdAt && card.updatedAt && card.updatedAt > card.createdAt) {
          cycleTimeTotal += card.updatedAt - card.createdAt;
          cycleTimeCount += 1;
        }
      });

      const topTags = Object.entries(tagCounts)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const avgCycleTime = cycleTimeCount ? `${Math.round((cycleTimeTotal / cycleTimeCount) / (1000 * 60 * 60))}h` : null;

      return {
        totalCards: cards.length,
        avgCycleTime,
        topTags
      };
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

    applyFilter(ctx) {
      if (!this.panel) return;
      const tag = this.panel.querySelector('[data-filter-tag]').value.trim();
      if (!tag) return this.refresh(ctx);
      this.lastRenderedTag = tag;
      const cards = ctx.api.listCards().filter((card) => (card.tags || []).includes(tag));
      const summary = this.panel.querySelector('#insight-summary');
      summary.innerHTML = `<p><strong>${cards.length}</strong> cards with #${tag}</p>`;
    },

    exportCsv(ctx) {
      const snapshot = this.computeSnapshot(ctx);
      const rows = [
        ['metric', 'value'],
        ['total_cards', snapshot.totalCards],
        ['avg_cycle_time_hours', snapshot.avgCycleTime || 'n/a'],
        ...snapshot.topTags.map((t) => [`tag_${t.tag}`, t.count])
      ];
      const csv = rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'insights.csv';
      link.click();
      URL.revokeObjectURL(url);
      ctx.utils.showToast('Exported insights to CSV', 'success');
    }
  };

  CardSpoke_MODS.register(Overlay.meta.id, Overlay);
})();
