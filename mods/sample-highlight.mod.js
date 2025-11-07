(function(){
  if (!window.CIB_MODS) {
    console.warn('[Sample Highlight Mod] CIB_MODS not available.');
    return;
  }
  const MOD_ID = 'sample.highlight@1.0.0';
  const HIGHLIGHT_CLASS = 'sample-highlight-card';

  if (!document.querySelector('style[data-sample-highlight]')) {
    const style = document.createElement('style');
    style.dataset.sampleHighlight = 'true';
    style.textContent = `
      .${HIGHLIGHT_CLASS} {
        outline: 2px solid #67e2bc;
        outline-offset: 3px;
        box-shadow: 0 0 12px rgba(103, 226, 188, 0.4);
      }
    `;
    document.head.appendChild(style);
  }

  CIB_MODS.register(MOD_ID, {
    meta: {
      name: 'Sample Highlight',
      version: '1.0.0',
      author: 'Card Info Base',
      description: 'Highlights cards that have more than three children.'
    },
    onCardRender(card, element) {
      if (!element || !card) return;
      if (Array.isArray(card.children) && card.children.length > 3) {
        element.classList.add(HIGHLIGHT_CLASS);
      } else {
        element.classList.remove(HIGHLIGHT_CLASS);
      }
    },
    onCardDelete(card, info, context) {
      const api = context?.api;
      if (api && typeof api.showToast === 'function') {
        api.showToast(`Removed ${card?.title || 'a card'} (Sample Highlight).`, 'success');
      }
    }
  });
})();
