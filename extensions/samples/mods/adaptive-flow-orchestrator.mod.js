(function() {
  'use strict';

  const Orchestrator = {
    meta: {
      id: 'mod-adaptive-flow-orchestrator',
      name: 'Adaptive Flow Orchestrator',
      type: 'Mod',
      version: '1.2.0',
      description: 'Auto-advances cards based on SLA, priority, dependencies, and checkpoints with keyboard remapping.'
    },

    rules: [
      { condition: (card) => card.priority === 'urgent', targetLane: 'doing' },
      { condition: (card) => card.slaHours && card.slaHours < 24, targetLane: 'review' },
      { condition: (card) => card.tags.includes('blocked'), targetLane: 'blocked' }
    ],

    onCardSave(ctx, card, info) {
      if (info.isNew) return;
      const matched = this.rules.find((rule) => rule.condition(card));
      if (matched) {
        ctx.board.moveCard(card.id, matched.targetLane);
        ctx.utils.showToast(`Moved card to ${matched.targetLane} per adaptive rule`, 'info');
      }
    },

    onAppInit(ctx) {
      this.installCheckpoints(ctx);
      this.remapShortcuts(ctx);
    },

    installCheckpoints(ctx) {
      ctx.board.defineCheckpoint('experiment', {
        requiredFields: ['hypothesis', 'successCriteria'],
        validator(card) {
          return Boolean(card.custom?.hypothesis && card.custom?.successCriteria);
        }
      });
    },

    remapShortcuts(ctx) {
      ctx.utils.registerShortcut('g d', () => ctx.utils.navigateToLane('doing'));
      ctx.utils.registerShortcut('g r', () => ctx.utils.navigateToLane('review'));
      ctx.utils.registerShortcut('g b', () => ctx.utils.navigateToLane('blocked'));
    }
  };

  CardSpoke_MODS.register(Orchestrator.meta.id, Orchestrator);
})();
