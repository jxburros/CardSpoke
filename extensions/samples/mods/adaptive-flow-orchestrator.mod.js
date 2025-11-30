(function() {
  'use strict';

  const Orchestrator = {
    meta: {
      id: 'mod-adaptive-flow-orchestrator',
      name: 'Adaptive Flow Orchestrator',
      type: 'Mod',
      version: '1.2.1',
      description: 'Auto-adjusts tags and reminders based on simple rules and provides keyboard navigation without custom APIs.'
    },

    rules: [
      { match: (card) => (card.tags || []).includes('urgent'), apply: (ctx, card) => this.ensureTag(ctx, card, 'doing') },
      { match: (card) => (card.tags || []).includes('blocked'), apply: (ctx, card) => this.ensureTag(ctx, card, 'review') },
      { match: (card) => (card.body || '').toLowerCase().includes('experiment'), apply: (ctx, card) => this.ensureTag(ctx, card, 'experiment') }
    ],

    shortcutListener: null,

    onAppInit(ctx) {
      this.bindShortcuts(ctx);
    },

    onCardSave(ctx, card) {
      this.rules.forEach((rule) => {
        if (rule.match(card)) {
          rule.apply(ctx, card);
        }
      });
    },

    onDisable() {
      if (this.shortcutListener) {
        document.removeEventListener('keydown', this.shortcutListener);
        this.shortcutListener = null;
      }
    },

    ensureTag(ctx, card, tag) {
      const tags = Array.from(new Set([...(card.tags || []), tag]));
      ctx.api.updateCard(card.id, { tags });
      ctx.utils.showToast(`Marked card ${card.title || card.id} for ${tag}`, 'info');
    },

    bindShortcuts(ctx) {
      if (this.shortcutListener) return;
      this.shortcutListener = (event) => {
        if (!event.ctrlKey || !event.shiftKey) return;
        const key = event.key.toLowerCase();
        const targetTag = key === 'd' ? 'doing' : key === 'r' ? 'review' : key === 'b' ? 'blocked' : null;
        if (!targetTag) return;
        event.preventDefault();
        const currentCardId = ctx.api.getNavState().cardId;
        if (!currentCardId) return;
        const card = ctx.api.getCard(currentCardId);
        if (!card) return;
        this.ensureTag(ctx, card, targetTag);
      };
      document.addEventListener('keydown', this.shortcutListener);
    }
  };

  CardSpoke_MODS.register(Orchestrator.meta.id, Orchestrator);
})();
