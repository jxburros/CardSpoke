/**
 * CardSpoke Appearance Settings
 * Version: 0.16.0
 * 
 * Handles appearance settings including themes, typography, and view options
 */

import { h, trapFocus } from '../core/utils.js';
import { state, getStore, isRichTextEnabled, setRichTextEnabled, getActiveThemeExtension, setActiveThemeExtension } from '../core/state.js';
import { save } from '../core/storage.js';
import { showToast } from './toast.js';

/**
 * Apply a theme (light/dark or custom)
 * @param {string} theme - Theme name ('light', 'dark', or extension ID)
 */
export function applyTheme(theme) {
  const store = getStore();
  
  // Remove all theme classes first
  document.documentElement.classList.remove('dark');
  
  // Remove any custom theme classes
  document.documentElement.className = document.documentElement.className
    .split(' ')
    .filter(c => !c.startsWith('theme-'))
    .join(' ');
  
  // Apply built-in theme
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
    setActiveThemeExtension(null);
  } else if (theme === 'light') {
    setActiveThemeExtension(null);
  } else {
    // Custom theme from extension
    const themeExt = store.mods && store.mods[theme];
    if (themeExt && themeExt.enabled && themeExt.meta && themeExt.meta.type === 'Theme') {
      document.documentElement.classList.add('theme-' + theme);
      setActiveThemeExtension(theme);
    }
  }
  
  // Save to store for persistence
  store.activeTheme = theme;
  save();
  
  try {
    localStorage.setItem('cardspoke_theme', theme);
  } catch { }
  
  // Update header button icon
  const moonIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
  const sunIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
  
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.innerHTML = theme === 'dark' ? sunIcon : moonIcon;
  }
  
  // Run mod hook if available
  if (window.CardSpoke_MODS && window.CardSpoke_MODS.runHook) {
    window.CardSpoke_MODS.runHook('onThemeChange', theme);
  }
}

/**
 * Toggle between light and dark themes
 */
export function toggleTheme() {
  const isDark = document.documentElement.classList.contains('dark');
  applyTheme(isDark ? 'light' : 'dark');
}

/**
 * Get list of installed theme extensions
 * @returns {Array} Array of theme extension objects
 */
export function getInstalledThemes() {
  const store = getStore();
  if (!store.mods) return [];
  
  return Object.values(store.mods).filter(mod => {
    return mod.meta && mod.meta.type === 'Theme';
  });
}

/**
 * Show appearance settings modal
 * @param {Function} renderCallback - Callback to re-render the app
 */
export function showAppearanceSettings(renderCallback) {
  const store = getStore();
  const overlay = h('div', { className: 'modal-overlay show' });
  const modal = h('div', { className: 'modal', style: 'max-width: 600px;' });
  const modalHeader = h('div', { className: 'modal-header' });
  modalHeader.appendChild(h('div', { className: 'modal-title' }, 'Appearance Settings'));
  const closeBtn = h('button', { className: 'modal-close', onclick: () => overlay.remove(), 'aria-label': 'Close' }, '✕');
  modalHeader.appendChild(closeBtn);
  modal.appendChild(modalHeader);
  
  const modalBody = h('div', { className: 'modal-body' });
  
  // View Mode Section
  const viewSection = h('div', { style: 'margin-bottom: var(--space-2xl); padding-bottom: var(--space-xl); border-bottom: 1px solid var(--border);' });
  viewSection.appendChild(h('div', { 
    style: 'font-weight: 700; margin-bottom: var(--space-lg); font-size: var(--text-lg);'
  }, 'View Options'));
  
  // Rich Text Toggle (NEW)
  const richTextEnabled = isRichTextEnabled();
  const richTextRow = h('div', { 
    className: 'menu-item-toggle',
    style: 'padding: var(--space-md); border: 1px solid var(--border); border-radius: 4px; margin-bottom: var(--space-md);'
  });
  const richTextLabel = h('label', { className: 'menu-item-label' });
  richTextLabel.appendChild(h('span', {}, 'Rich Text'));
  richTextLabel.appendChild(h('span', { style: 'font-size: var(--text-sm); color: var(--text-muted); display: block;' }, 'Enable markdown formatting in card body'));
  const richTextToggle = h('label', { className: 'switch-toggle' });
  const richTextInput = h('input', { 
    type: 'checkbox', 
    checked: richTextEnabled,
    onchange: function(e) {
      setRichTextEnabled(e.target.checked);
      showToast(e.target.checked ? 'Rich Text enabled' : 'Rich Text disabled');
      if (renderCallback) renderCallback();
    }
  });
  const richTextSlider = h('span', { className: 'switch-slider' });
  richTextToggle.appendChild(richTextInput);
  richTextToggle.appendChild(richTextSlider);
  richTextRow.appendChild(richTextLabel);
  richTextRow.appendChild(richTextToggle);
  viewSection.appendChild(richTextRow);
  
  // Compact View Toggle
  const compactViewEnabled = store.viewMode === 'compact';
  const compactRow = h('div', { 
    className: 'menu-item-toggle',
    style: 'padding: var(--space-md); border: 1px solid var(--border); border-radius: 4px; margin-bottom: var(--space-md);'
  });
  const compactLabel = h('label', { className: 'menu-item-label' }, 'Compact View');
  const compactToggle = h('label', { className: 'switch-toggle' });
  const compactInput = h('input', { 
    type: 'checkbox', 
    checked: compactViewEnabled,
    onchange: function(e) {
      store.viewMode = e.target.checked ? 'compact' : 'normal';
      save();
      if (renderCallback) renderCallback();
    }
  });
  const compactSlider = h('span', { className: 'switch-slider' });
  compactToggle.appendChild(compactInput);
  compactToggle.appendChild(compactSlider);
  compactRow.appendChild(compactLabel);
  compactRow.appendChild(compactToggle);
  viewSection.appendChild(compactRow);
  
  // Grid View Toggle
  const gridViewEnabled = localStorage.getItem('cardspoke_gridView') === 'true';
  const gridRow = h('div', { 
    className: 'menu-item-toggle',
    style: 'padding: var(--space-md); border: 1px solid var(--border); border-radius: 4px; margin-bottom: var(--space-md);'
  });
  const gridLabel = h('label', { className: 'menu-item-label' }, 'Grid View');
  const gridToggle = h('label', { className: 'switch-toggle' });
  const gridInput = h('input', { 
    type: 'checkbox', 
    checked: gridViewEnabled,
    onchange: function(e) {
      localStorage.setItem('cardspoke_gridView', e.target.checked.toString());
      if (renderCallback) renderCallback();
    }
  });
  const gridSlider = h('span', { className: 'switch-slider' });
  gridToggle.appendChild(gridInput);
  gridToggle.appendChild(gridSlider);
  gridRow.appendChild(gridLabel);
  gridRow.appendChild(gridToggle);
  viewSection.appendChild(gridRow);
  
  // High Contrast Toggle
  const highContrastEnabled = localStorage.getItem('cardspoke_highContrast') === 'true';
  const contrastRow = h('div', { 
    className: 'menu-item-toggle',
    style: 'padding: var(--space-md); border: 1px solid var(--border); border-radius: 4px;'
  });
  const contrastLabel = h('label', { className: 'menu-item-label' }, 'High Contrast');
  const contrastToggle = h('label', { className: 'switch-toggle' });
  const contrastInput = h('input', { 
    type: 'checkbox', 
    checked: highContrastEnabled,
    onchange: function(e) {
      localStorage.setItem('cardspoke_highContrast', e.target.checked.toString());
      if (e.target.checked) {
        document.documentElement.classList.add('high-contrast');
      } else {
        document.documentElement.classList.remove('high-contrast');
      }
    }
  });
  const contrastSlider = h('span', { className: 'switch-slider' });
  contrastToggle.appendChild(contrastInput);
  contrastToggle.appendChild(contrastSlider);
  contrastRow.appendChild(contrastLabel);
  contrastRow.appendChild(contrastToggle);
  viewSection.appendChild(contrastRow);
  
  // Developer Mode Toggle
  const devModeEnabled = localStorage.getItem('cardspoke_devmode') === 'true';
  const devRow = h('div', { 
    className: 'menu-item-toggle',
    style: 'padding: var(--space-md); border: 1px solid var(--border); border-radius: 4px; margin-top: var(--space-md);'
  });
  const devLabel = h('label', { className: 'menu-item-label' }, 'Developer Mode');
  const devToggle = h('label', { className: 'switch-toggle' });
  const devInput = h('input', { 
    type: 'checkbox', 
    checked: devModeEnabled,
    onchange: function(e) {
      localStorage.setItem('cardspoke_devmode', e.target.checked.toString());
      showToast(e.target.checked ? 'Developer mode enabled' : 'Developer mode disabled');
    }
  });
  const devSlider = h('span', { className: 'switch-slider' });
  devToggle.appendChild(devInput);
  devToggle.appendChild(devSlider);
  devRow.appendChild(devLabel);
  devRow.appendChild(devToggle);
  viewSection.appendChild(devRow);
  
  modalBody.appendChild(viewSection);
  
  // Typography Section
  const typoSection = h('div', { style: 'margin-bottom: var(--space-2xl); padding-bottom: var(--space-xl); border-bottom: 1px solid var(--border);' });
  typoSection.appendChild(h('div', { 
    style: 'font-weight: 700; margin-bottom: var(--space-lg); font-size: var(--text-lg);'
  }, 'Typography'));
  
  const currentTypography = localStorage.getItem('cardspoke_typography') || 'default';
  const typographyPresets = [
    { id: 'default', name: 'Default', desc: 'Standard reading size' },
    { id: 'comfortable', name: 'Comfortable', desc: 'Larger text, more spacing' },
    { id: 'compact', name: 'Compact', desc: 'Smaller text, denser layout' },
    { id: 'dyslexia', name: 'Dyslexia-Friendly', desc: 'Optimized for readability' }
  ];
  
  typographyPresets.forEach(function(preset) {
    const isActive = currentTypography === preset.id;
    const presetOption = h('div', {
      style: 'padding: var(--space-md); border: 2px solid ' + (isActive ? 'var(--text)' : 'var(--border)') + '; border-radius: 4px; margin-bottom: var(--space-md); cursor: pointer;',
      onclick: function() {
        localStorage.setItem('cardspoke_typography', preset.id);
        document.documentElement.setAttribute('data-typography', preset.id);
        showToast('Typography: ' + preset.name);
        overlay.remove();
        showAppearanceSettings(renderCallback);
      }
    });
    presetOption.appendChild(h('div', { style: 'font-weight: 600;' }, (isActive ? '✓ ' : '') + preset.name));
    presetOption.appendChild(h('div', { style: 'font-size: var(--text-sm); color: var(--text-muted);' }, preset.desc));
    typoSection.appendChild(presetOption);
  });
  
  modalBody.appendChild(typoSection);
  
  // Theme Section
  const themeSection = h('div', { style: 'margin-bottom: var(--space-xl);' });
  themeSection.appendChild(h('div', { 
    style: 'font-weight: 700; margin-bottom: var(--space-lg); font-size: var(--text-lg);'
  }, 'Theme'));
  
  const currentTheme = store.activeTheme || 'light';
  const activeThemeExt = getActiveThemeExtension();
  
  // Light theme option
  const lightOption = h('div', { 
    className: 'theme-option',
    style: 'padding: var(--space-lg); border: 2px solid ' + (currentTheme === 'light' && !activeThemeExt ? 'var(--text)' : 'var(--border)') + '; margin-bottom: var(--space-md); cursor: pointer; border-radius: 4px; background: white; color: black;',
    onclick: function() {
      applyTheme('light');
      overlay.remove();
    }
  });
  lightOption.appendChild(h('div', { style: 'font-weight: 600; margin-bottom: var(--space-xs);' }, (currentTheme === 'light' && !activeThemeExt ? '✓ ' : '') + 'Light Theme'));
  lightOption.appendChild(h('div', { style: 'font-size: var(--text-sm); color: #666;' }, 'Default light color scheme'));
  themeSection.appendChild(lightOption);
  
  // Dark theme option
  const darkOption = h('div', { 
    className: 'theme-option',
    style: 'padding: var(--space-lg); border: 2px solid ' + (currentTheme === 'dark' && !activeThemeExt ? 'white' : 'var(--border)') + '; margin-bottom: var(--space-md); cursor: pointer; border-radius: 4px; background: #1a1a1a; color: white;',
    onclick: function() {
      applyTheme('dark');
      overlay.remove();
    }
  });
  darkOption.appendChild(h('div', { style: 'font-weight: 600; margin-bottom: var(--space-xs);' }, (currentTheme === 'dark' && !activeThemeExt ? '✓ ' : '') + 'Dark Theme'));
  darkOption.appendChild(h('div', { style: 'font-size: var(--text-sm); color: #aaa;' }, 'Dark color scheme'));
  themeSection.appendChild(darkOption);
  
  // Custom themes from extensions (NEW - Enhanced handling)
  const themeExtensions = getInstalledThemes();
  
  if (themeExtensions.length > 0) {
    themeSection.appendChild(h('div', { 
      style: 'font-weight: 600; margin: var(--space-lg) 0 var(--space-md);'
    }, 'Installed Theme Extensions'));
    
    themeExtensions.forEach(function(theme) {
      const isActive = activeThemeExt === theme.id;
      const themeOption = h('div', {
        style: 'padding: var(--space-md); border: 2px solid ' + (isActive ? 'var(--primary)' : 'var(--border)') + '; border-radius: 4px; margin-bottom: var(--space-sm); cursor: pointer; display: flex; justify-content: space-between; align-items: center;',
        onclick: function() {
          if (theme.enabled) {
            applyTheme(theme.id);
            overlay.remove();
          } else {
            showToast('Enable this extension first in Extensions Hub', 'info');
          }
        }
      });
      
      const themeInfo = h('div', {});
      themeInfo.appendChild(h('div', { style: 'font-weight: 600;' }, (isActive ? '✓ ' : '') + (theme.meta.name || theme.id)));
      themeInfo.appendChild(h('div', { style: 'font-size: var(--text-sm); color: var(--text-muted);' }, 'By ' + (theme.meta.creator || 'Unknown')));
      if (theme.meta.description) {
        themeInfo.appendChild(h('div', { style: 'font-size: var(--text-sm); color: var(--text-muted); margin-top: var(--space-xs);' }, theme.meta.description));
      }
      themeOption.appendChild(themeInfo);
      
      // Status badge
      const statusBadge = h('span', {
        style: 'font-size: var(--text-xs); padding: 2px 8px; border-radius: 10px; background: ' + (theme.enabled ? 'var(--success)' : 'var(--text-muted)') + '; color: white;'
      }, theme.enabled ? 'Enabled' : 'Disabled');
      themeOption.appendChild(statusBadge);
      
      themeSection.appendChild(themeOption);
    });
  } else {
    themeSection.appendChild(h('div', { 
      style: 'padding: var(--space-lg); background: var(--bg-secondary); border-radius: 4px; text-align: center; color: var(--text-muted);'
    },
      h('div', { style: 'margin-bottom: var(--space-sm);' }, 'No custom themes installed'),
      h('div', { style: 'font-size: var(--text-sm);' }, 'Install theme extensions from the Extensions Hub')
    ));
  }
  
  modalBody.appendChild(themeSection);
  
  modal.appendChild(modalBody);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  // Set up focus trap
  trapFocus(modal);
  
  overlay.onclick = function(e) {
    if (e.target === overlay) overlay.remove();
  };
}

/**
 * Show typography preset selector modal
 */
export function showTypographySelector() {
  const currentTypography = localStorage.getItem('cardspoke_typography') || 'default';
  
  const modal = h('div', { 
    id: 'typographyModal', 
    className: 'menu-overlay show',
    onclick: (e) => { if (e.target === modal) modal.remove(); }
  },
    h('div', { className: 'menu-panel' },
      h('div', { className: 'menu-header' },
        h('div', { className: 'menu-title' }, 'Typography'),
        h('button', { 
          className: 'menu-close',
          onclick: () => modal.remove()
        }, '✕')
      ),
      h('div', { className: 'typography-presets' },
        h('div', { className: 'preset-description' }, 'Choose a reading mode that suits your preference:'),
        ...[
          { id: 'default', name: 'Default', desc: '16px, comfortable line height' },
          { id: 'comfortable', name: 'Comfortable', desc: '18px, extra line height for relaxed reading' },
          { id: 'compact', name: 'Compact', desc: '14px, tighter spacing for more content' },
          { id: 'dyslexia', name: 'Dyslexia-Friendly', desc: '18px, wider spacing, readable font' }
        ].map(preset => 
          h('div', { 
            className: `preset-option ${currentTypography === preset.id ? 'active' : ''}`,
            onclick: () => {
              localStorage.setItem('cardspoke_typography', preset.id);
              document.documentElement.setAttribute('data-typography', preset.id);
              showToast(`Typography: ${preset.name}`);
              modal.remove();
            }
          },
            h('div', { className: 'preset-name' }, preset.name),
            h('div', { className: 'preset-desc' }, preset.desc)
          )
        )
      )
    )
  );
  
  document.body.appendChild(modal);
}

/**
 * Initialize appearance settings on page load
 */
export function initAppearance() {
  const store = getStore();
  
  // Apply saved theme
  const savedTheme = store.activeTheme || localStorage.getItem('cardspoke_theme') || 'light';
  applyTheme(savedTheme);
  
  // Apply saved typography preset
  const savedTypography = localStorage.getItem('cardspoke_typography') || 'default';
  document.documentElement.setAttribute('data-typography', savedTypography);
  
  // Apply saved high contrast mode
  const savedHC = localStorage.getItem('cardspoke_highContrast') === 'true';
  if (savedHC) document.documentElement.classList.add('high-contrast');
}
