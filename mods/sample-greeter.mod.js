(function(){
  if (!window.CIB_MODS) {
    console.warn('[Sample Greeter Mod] CIB_MODS not available.');
    return;
  }
  const MOD_ID = 'sample.greeter@1.0.0';
  CIB_MODS.register(MOD_ID, {
    meta: {
      name: 'Sample Greeter',
      version: '1.0.0',
      author: 'Card Info Base',
      description: 'Greets the user on launch and when cards are saved.'
    },
    onAppInit(_, context) {
      const api = context?.api;
      if (api && typeof api.showToast === 'function') {
        api.showToast('Sample Greeter ready to help!');
      }
    },
    onCardSave(card, info, context) {
      const api = context?.api;
      if (!api || typeof api.showToast !== 'function') return;
      const name = card?.title || '(Untitled)';
      if (info?.isNew) {
        api.showToast(`Created "${name}" with Sample Greeter.`, 'success');
      } else {
        api.showToast(`Updated "${name}" with Sample Greeter.`, 'success');
      }
    }
  });
})();
