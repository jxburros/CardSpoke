(function() {
  'use strict';

  // Simple WIP guard that enforces limits based on lane tags on save.
  // Lanes are derived from tags: todo, doing, review, done.
  const WipGuard = {
    meta: {
      id: 'mod-strict-wip-guard',
      name: 'Strict WIP Guard',
      type: 'Mod',
      version: '1.1.0',
      description: 'Enforces per-lane limits (todo/doing/review/done) by reverting saves that exceed thresholds.'
    },

    limits: {
      todo: 8,
      doing: 4,
      review: 4,
      done: 999
    },

    onCardSave(ctx, card, info) {
      const lane = this.getLane(card.tags);
      if (!lane) return;
      const limit = this.limits[lane];
      if (!limit) return;

      const peers = ctx.api.listCards().filter((c) => this.getLane(c.tags) === lane);
      if (peers.length > limit) {
        ctx.logger.warn(`Lane ${lane} limit reached (${limit}). Reverting change for card ${card.id}.`);
        ctx.utils.showToast(`Cannot place card in ${lane}. Lane is at capacity (${limit}).`, 'error');
        const previousTags = info?.previousData?.tags || (card.tags || []).filter((t) => t !== lane);
        ctx.api.updateCard(card.id, { tags: previousTags });
      }
    },

    getLane(tags = []) {
      const laneTags = ['todo', 'doing', 'review', 'done'];
      return laneTags.find((tag) => tags.includes(tag));
    }
  };

  CardSpoke_MODS.register(WipGuard.meta.id, WipGuard);
})();
