(function() {
  'use strict';

  const WipGuard = {
    meta: {
      id: 'mod-strict-wip-guard',
      name: 'Strict WIP Guard',
      type: 'Mod',
      version: '1.0.0',
      description: 'Enforces per-lane WIP limits by blocking moves that exceed thresholds.'
    },

    limits: {
      backlog: 999,
      todo: 5,
      doing: 3,
      review: 4,
      done: 999
    },

    onCardMove(ctx, move) {
      const lane = move.toLane;
      const limit = this.limits[lane];
      if (!limit) return;
      const count = ctx.board.countCardsInLane(lane);
      if (count >= limit) {
        ctx.utils.showToast(`Cannot move card. ${lane} lane is at capacity (${limit}).`, 'error');
        move.cancel();
      }
    }
  };

  CardSpoke_MODS.register(WipGuard.meta.id, WipGuard);
})();
