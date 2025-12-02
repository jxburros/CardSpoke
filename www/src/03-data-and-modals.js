      // Source Part 3/5: Data CRUD, imports/exports, dataset modals
      // Concatenated via `npm run build` in lexical order of www/src/*.js
      // --- DATA (CRUD) ---

      /**
       * Create a new card
       * @param {string} title - Card title
       * @param {string} body - Card content/body
       * @param {string|null} parentId - Parent card ID or null for root
       * @param {boolean} skipSave - Skip saving to localStorage
       * @param {boolean} skipHooks - Skip running mod hooks
       * @returns {string} New card ID
       */
      function createCard(title, body, parentId = null, skipSave = false, skipHooks = false) {
        const id = uid();
        const now = Date.now();
        store.cards[id] = {
          id,
          title: title || '',
          body: body || '',
          parentId: parentId || null,
          children: [],
          createdAt: now,
          updatedAt: now,
          modsData: {},
          tags: [],
          isRichText: false
        };
        if (!parentId) {
          store.rootOrder.push(id);
        } else {
          const parent = store.cards[parentId];
          if (parent && !parent.children.includes(id)) {
            parent.children.push(id);
          }
        }
        // Add to undo stack for undo support (v0.12.0 fix)
        // Always track undo regardless of skipHooks - skipHooks only controls mod hooks
        pushUndo('createCard', { cardId: id, card: cloneCard(store.cards[id]) });
        if (!skipSave) save();
        if (!skipHooks) runModHook('onCardSave', cloneCard(store.cards[id]), { isNew: true, source: 'create' });
        return id;
      }

      /**
       * Update an existing card
       * @param {string} id - Card ID to update
       * @param {Object} updates - Fields to update
       * @param {boolean} skipSave - Skip saving to localStorage
       * @param {boolean} skipHooks - Skip running mod hooks
       */
      function updateCard(id, updates, skipSave = false, skipHooks = false) {
        const card = store.cards[id];
        if (!card) return;
        // Store previous state for undo support (v0.12.0 fix)
        // Always track undo regardless of skipHooks - skipHooks only controls mod hooks
        const previousState = cloneCard(card);
        const updateTimestamp = Date.now();
        pushUndo('updateCard', { 
          cardId: id, 
          previousState: previousState,
          newState: { ...updates, updatedAt: updateTimestamp }
        });
        Object.assign(card, updates, { updatedAt: updateTimestamp });
        if (!skipSave) save();
        if (!skipHooks) runModHook('onCardSave', cloneCard(card), { isNew: false, source: 'update' });
      }

      /**
       * Delete a card and all its children recursively
       * @param {string} id - Card ID to delete
       */
      function deleteCard(id) {
        const card = store.cards[id];
        if (!card) return;
        
        // Add to undo stack before deletion
        pushUndo('deleteCard', { card: cloneCard(card) });
        
        // Add to trash bin
        trashBin.unshift({
          card: cloneCard(card),
          deletedAt: Date.now()
        });
        if (trashBin.length > MAX_TRASH_SIZE) trashBin.pop();
        
        runModHook('onCardDelete', cloneCard(card));
        (card.children || []).forEach(cid => deleteCard(cid));
        if (card.parentId) {
          const parent = store.cards[card.parentId];
          if (parent) parent.children = parent.children.filter(c => c !== id);
        } else {
          store.rootOrder = store.rootOrder.filter(c => c !== id);
        }
        delete store.cards[id];
        save();
      }

      /**
       * Duplicate a card with option to clone children
       * @param {string} id - Card ID to duplicate
       * @param {boolean} withChildren - Whether to clone children recursively
       * @returns {string} New card ID
       */
      function duplicateCard(id, withChildren = false) {
        const original = store.cards[id];
        if (!original) return null;
        
        const newId = uid();
        const now = Date.now();
        
        // Create duplicate with new ID and title suffix
        store.cards[newId] = {
          ...cloneCard(original),
          id: newId,
          title: (original.title || 'Untitled') + ' (Copy)',
          children: [],
          createdAt: now,
          updatedAt: now
        };
        
        // Add to parent or root
        if (original.parentId) {
          const parent = store.cards[original.parentId];
          if (parent && !parent.children.includes(newId)) {
            parent.children.push(newId);
          }
        } else {
          store.rootOrder.push(newId);
        }
        
        // Recursively duplicate children if requested
        if (withChildren && original.children.length > 0) {
          original.children.forEach(childId => {
            const newChildId = duplicateCardAsChild(childId, newId, true);
          });
        }
        
        save();
        runModHook('onCardSave', cloneCard(store.cards[newId]), { isNew: true, source: 'duplicate' });
        return newId;
      }

      /**
       * Helper to duplicate a card as child of another card
       * @param {string} id - Card ID to duplicate
       * @param {string} newParentId - New parent card ID
       * @param {boolean} withChildren - Whether to clone children recursively
       * @returns {string} New card ID
       */
      function duplicateCardAsChild(id, newParentId, withChildren = false) {
        const original = store.cards[id];
        if (!original) return null;
        
        const newId = uid();
        const now = Date.now();
        
        store.cards[newId] = {
          ...cloneCard(original),
          id: newId,
          parentId: newParentId,
          children: [],
          createdAt: now,
          updatedAt: now
        };
        
        const parent = store.cards[newParentId];
        if (parent && !parent.children.includes(newId)) {
          parent.children.push(newId);
        }
        
        if (withChildren && original.children.length > 0) {
          original.children.forEach(childId => {
            duplicateCardAsChild(childId, newId, true);
          });
        }
        
        return newId;
      }

      /**
       * Toggle bookmark status for a card
       * @param {string} cardId - Card ID to bookmark/unbookmark
       */
      function toggleBookmark(cardId) {
        if (!store.bookmarks) store.bookmarks = [];
        const idx = store.bookmarks.indexOf(cardId);
        if (idx >= 0) {
          store.bookmarks.splice(idx, 1);
          showToast('Bookmark removed', 'info');
        } else {
          store.bookmarks.push(cardId);
          showToast('Card bookmarked', 'success');
        }
        save();
        render();
      }

      /**
       * Check if a card is bookmarked
       * @param {string} cardId - Card ID to check
       * @returns {boolean} True if bookmarked
       */
      function isBookmarked(cardId) {
        if (!store.bookmarks) store.bookmarks = [];
        return store.bookmarks.includes(cardId);
      }

      /**
       * Add card to recent history
       * @param {string} cardId - Card ID to add to recent history
       */
      function addToRecentCards(cardId) {
        if (!store.recentCards) store.recentCards = [];
        // Remove if already in list
        store.recentCards = store.recentCards.filter(id => id !== cardId);
        // Add to front
        store.recentCards.unshift(cardId);
        // Keep only last 10
        if (store.recentCards.length > 10) {
          store.recentCards = store.recentCards.slice(0, 10);
        }
        save(true); // Save immediately but don't show toast
      }

      /**
       * Toggle view mode between normal and compact
       */
      function toggleViewMode() {
        if (!store.viewMode) store.viewMode = 'normal';
        store.viewMode = store.viewMode === 'normal' ? 'compact' : 'normal';
        save();
        render();
        showToast(`View mode: ${store.viewMode}`, 'info');
      }

      // --- DATA (IMPORT/EXPORT) ---

      function exportJSON(type = 'instance') {
        let data;
        if (type === 'instance') {
          data = {
            exportType: 'instance',
            appVersion: APP_VERSION,
            timestamp: Date.now(),
            cards: store.cards,
            rootIds: store.rootOrder,
            mods: store.mods
          };
        } else if (type === 'mods') {
          data = {
            exportType: 'mods',
            appVersion: APP_VERSION,
            timestamp: Date.now(),
            mods: store.mods
          };
        }
        runModHook('onExport', { type, payload: data });
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cardspoke-${type}-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast(`Exported ${type} successfully`);
      }

      /**
       * Download file with feedback and fallback handling
       * @param {Blob} blob - File blob to download
       * @param {string} filename - Suggested filename
       * @param {string} format - File format for display (e.g., 'TXT', 'Markdown')
       */
      function downloadWithFeedback(content, filename, mimeType) {
        // Create blob from content if it's a string
        const blob = typeof content === 'string' 
          ? new Blob([content], { type: mimeType || 'text/plain' })
          : content;
        const url = URL.createObjectURL(blob);
        const format = mimeType || 'file';
        
        try {
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          
          // Add to document for Firefox compatibility
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          
          // Show success feedback
          showToast(`✓ ${format} export downloaded: ${filename}`, 'success');
          
        } catch (err) {
          // Fallback: show modal with download link
          console.warn('[Export] Automatic download failed:', err);
          
          const overlay = h('div', { className: 'modal-overlay show' });
          const modal = h('div', { className: 'modal' });
          const modalHeader = h('div', { className: 'modal-header' });
          modalHeader.appendChild(h('div', { className: 'modal-title' }, 'Export Ready'));
          const closeBtn = h('button', { className: 'modal-close', onclick: () => overlay.remove() }, '✕');
          modalHeader.appendChild(closeBtn);
          modal.appendChild(modalHeader);
          
          const modalBody = h('div', { className: 'modal-body' });
          modalBody.appendChild(h('p', { style: 'margin-bottom: var(--space-lg);' }, 
            `Your ${format} export is ready. Click the button below to download.`));
          
          const downloadBtn = h('a', {
            className: 'btn btn-primary',
            href: url,
            download: filename,
            style: 'display: inline-block; text-decoration: none;'
          }, `Download ${filename}`);
          
          downloadBtn.onclick = () => {
            showToast(`✓ ${format} export downloaded`, 'success');
            setTimeout(() => overlay.remove(), 500);
          };
          
          modalBody.appendChild(downloadBtn);
          modal.appendChild(modalBody);
          overlay.appendChild(modal);
          document.body.appendChild(overlay);
          
          showToast(`${format} export ready - click to download`, 'info');
        }
        
        // Clean up blob URL after a delay
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      }

      function exportTXT() {
        let text = '# CardSpoke Export\n\n';
        function writeCard(cardId, depth = 0) {
          const card = store.cards[cardId];
          if (!card) return;
          const indent = '  '.repeat(depth);
          text += `${indent}${card.title || '(Untitled)'}\n`;
          if (card.body) {
            text += `${indent}  ${card.body.replace(/\n/g, '\n' + indent + '  ')}\n`;
          }
          text += '\n';
          (card.children || []).forEach(cid => writeCard(cid, depth + 1));
        }
        store.rootOrder.forEach(id => writeCard(id));
        runModHook('onExport', { type: 'txt', payloadLength: text.length });
        const blob = new Blob([text], { type: 'text/plain' });
        const filename = `cardspoke-${new Date().toISOString().slice(0,10)}.txt`;
        downloadWithFeedback(blob, filename, 'TXT');
      }


      /**
       * Export cards to Markdown format with hierarchy
       */
      function exportMarkdown() {
        let markdown = '# CardSpoke Export\n\n';
        markdown += `*Exported: ${new Date().toLocaleString()}*\n\n`;
        markdown += '---\n\n';
        
        function writeCardMD(cardId, depth = 0) {
          const card = store.cards[cardId];
          if (!card) return;
          
          const heading = '#'.repeat(Math.min(depth + 1, 6));
          markdown += `${heading} ${card.title || '(Untitled)'}\n\n`;
          
          if (card.tags && card.tags.length > 0) {
            markdown += `*Tags: ${card.tags.map(t => `\`${t}\``).join(', ')}*\n\n`;
          }
          
          if (card.body) {
            markdown += `${card.body}\n\n`;
          }
          
          (card.children || []).forEach(cid => writeCardMD(cid, depth + 1));
        }
        
        store.rootOrder.forEach(id => writeCardMD(id));

        runModHook('onExport', { type: 'markdown', payloadLength: markdown.length });
        const blob = new Blob([markdown], { type: 'text/markdown' });
        const filename = `cardspoke-${new Date().toISOString().slice(0,10)}.md`;
        downloadWithFeedback(blob, filename, 'Markdown');
      }

      /**
       * Export cards to CSV format (flat structure)
       */
      function exportCSV() {
        let csv = 'ID,Title,Body,Parent ID,Tags,Children Count,Created,Updated\n';
        
        Object.values(store.cards).forEach(card => {
          const id = card.id || '';
          const title = (card.title || '').replace(/"/g, '""');
          const body = (card.body || '').replace(/"/g, '""').replace(/\n/g, ' ');
          const parentId = card.parentId || '';
          const tags = (card.tags || []).join(';');
          const childrenCount = (card.children || []).length;
          const created = card.createdAt || '';
          const updated = card.updatedAt || '';

          csv += `"${id}","${title}","${body}","${parentId}","${tags}",${childrenCount},"${created}","${updated}"\n`;
        });

        runModHook('onExport', { type: 'csv', payloadLength: csv.length });
        const blob = new Blob([csv], { type: 'text/csv' });
        const filename = `cardspoke-${new Date().toISOString().slice(0,10)}.csv`;
        downloadWithFeedback(blob, filename, 'CSV');
      }
      function handleExport(type) {
        if (type === 'instance-json') exportJSON('instance');
        else if (type === 'instance-txt') exportTXT();
        else if (type === 'mods-json') exportJSON('mods');
      }

      function importJSON(data, mode = 'root') {
        let pkg;
        try {
          pkg = typeof data === 'string' ? JSON.parse(data) : data;
        } catch (err) {
          showToast('Invalid JSON: ' + err.message, 'error');
          throw new Error('Failed to parse JSON: ' + err.message);
        }

        // Security: Validate import data structure
        if (!pkg || typeof pkg !== 'object') {
          showToast('Invalid import: data must be an object', 'error');
          throw new Error('Invalid import data structure');
        }

        // Validate cards object
        if (pkg.cards && typeof pkg.cards !== 'object') {
          showToast('Invalid import: cards must be an object', 'error');
          throw new Error('Invalid cards structure');
        }

        // Validate each card has required fields
        if (pkg.cards) {
          for (const [cardId, card] of Object.entries(pkg.cards)) {
            if (!card || typeof card !== 'object') {
              showToast(`Invalid card structure for ID: ${cardId}`, 'error');
              throw new Error('Invalid card structure');
            }
            // Validate required card fields
            if (card.children && !Array.isArray(card.children)) {
              showToast(`Invalid children array for card: ${cardId}`, 'error');
              throw new Error('Invalid card children structure');
            }
          }
        }

        // Validate rootIds if present
        if (pkg.rootIds && !Array.isArray(pkg.rootIds)) {
          showToast('Invalid import: rootIds must be an array', 'error');
          throw new Error('Invalid rootIds structure');
        }

        // Validate mods if present (and warn about security)
        if (pkg.mods && pkg.exportType === 'instance') {
          const modCount = Object.keys(pkg.mods).length;
          if (modCount > 0) {
            const confirmImportMods = confirm(
              `⚠️ SECURITY WARNING\n\n` +
              `This import includes ${modCount} extension(s).\n\n` +
              `Extensions can execute code and access your data. ` +
              `Only import extensions from sources you trust.\n\n` +
              `Do you want to import the extensions?\n` +
              `(Click Cancel to import only the cards without extensions)`
            );
            if (!confirmImportMods) {
              delete pkg.mods;
            }
          }
        }

        const importedIds = [];
        const idMap = {};
        const remappedCards = {};

        Object.entries(pkg.cards || {}).forEach(([oldId, card]) => {
          const newId = uid();
          idMap[oldId] = newId;
          remappedCards[newId] = { ...card, id: newId };
          importedIds.push(newId);
        });
        
        Object.values(remappedCards).forEach(card => {
          card.children = (card.children || []).map(cid => idMap[cid] || cid);
          if (card.parentId && idMap[card.parentId]) {
            card.parentId = idMap[card.parentId];
          }
        });
        
        const remappedRootIds = (pkg.rootIds || []).map(id => idMap[id] || id);
        
        Object.values(remappedCards).forEach(card => {
          store.cards[card.id] = card;
        });
        
        if (mode === 'root') {
          remappedRootIds.forEach(id => {
            if (store.cards[id]) {
              store.cards[id].parentId = null;
              if (!store.rootOrder.includes(id)) {
                store.rootOrder.push(id);
              }
            }
          });
        } else {
          const parentCard = store.cards[mode];
          if (parentCard) {
            remappedRootIds.forEach(cardId => {
              if (store.cards[cardId]) {
                store.cards[cardId].parentId = mode;
                if (!parentCard.children.includes(cardId)) {
                  parentCard.children.push(cardId);
                }
              }
            });
          }
        }
        
        if (pkg.exportType === 'instance' && pkg.mods) {
          Object.entries(pkg.mods).forEach(([modId, mod]) => {
            if (!store.mods[modId]) {
              store.mods[modId] = {
                enabled: !!mod.enabled,
                js: mod.js || '',
                css: mod.css || '',
                meta: mod.meta ? { ...mod.meta } : {}
              };
            }
          });
        }
        
        save();
        if (window.CardSpoke.mods && !safeMode) {
          window.CardSpoke.mods.syncFromStore();
          window.CardSpoke.mods.runHook('onAppInit');
        }

        runModHook('onImport', { type: pkg.exportType || 'unknown', cards: importedIds.slice(), mods: Object.keys(pkg.mods || {}) });
        importedIds.forEach(cardId => {
          const storedCard = store.cards[cardId];
          if (storedCard) {
            runModHook('onCardSave', cloneCard(storedCard), { isNew: true, source: 'importJSON', exportType: pkg.exportType });
          }
        });
        
        showToast(`Imported ${Object.keys(remappedCards).length} cards`);
        render();
      }

      function importTXT(text, mode = 'outline', location = 'root') {
        const createdIds = [];
        if (mode === 'outline') {
          const lines = text.split('\n').filter(l => l.trim());
          const stack = [];
          lines.forEach(line => {
            const indent = line.search(/\S/);
            const title = line.trim();
            const depth = Math.floor(indent / 2);
            const parentId = depth > 0 && stack[depth - 1] ? stack[depth - 1] :
                           (location === 'root' ? null : location);
            const id = createCard(title, '', parentId);
            stack[depth] = id;
            stack.length = depth + 1;
            createdIds.push(id);
          });
          showToast('Imported outline successfully');
          render();
        } else if (mode === 'append') {
          if (location && location !== 'root') {
            const card = store.cards[location];
            if (card) {
              card.body = (card.body ? card.body + '\n\n' : '') + text;
              card.updatedAt = Date.now();
              save();
              showToast('Text appended successfully');
              render();
            }
          }
        }

        runModHook('onImport', { type: 'text', mode, location, cards: createdIds });
      }

      function importDOCX(text, mode = 'append', targetCardId) {
        if (!targetCardId || !store.cards[targetCardId]) {
          showToast('Please select a target card', 'error');
          return;
        }
        const card = store.cards[targetCardId];
        if (mode === 'append') {
          card.body = (card.body ? card.body + '\n\n' : '') + text;
        } else if (mode === 'replace') {
          card.body = text;
        }
        card.updatedAt = Date.now();
        save();
        showToast('DOCX imported successfully');
        render();
        runModHook('onImport', { type: 'docx', mode, targetCardId });
      }

      // --- INSTANCE & MODALS ---

      function showDatasetManager() {
        const overlay = h('div', { className: 'modal-overlay show' });
        const modal = h('div', { className: 'modal', style: 'max-width: 700px;' });
        const modalHeader = h('div', { className: 'modal-header' });
        modalHeader.appendChild(h('div', { className: 'modal-title' }, 'Dataset Manager'));
        const closeBtn = h('button', { className: 'modal-close', onclick: () => overlay.remove() }, '✕');
        modalHeader.appendChild(closeBtn);
        modal.appendChild(modalHeader);
        const modalBody = h('div', { className: 'modal-body' });

        // Get all existing datasets (instances)
        const allKeys = Object.keys(localStorage).filter(k => k.startsWith('nested_cards_') || k === 'nested_cards_store');
        const current = instanceKey || 'nested_cards_store';

        // Title and description
        const description = h('p', { style: 'margin-bottom: var(--space-lg); color: var(--text-secondary);' }, 
          'Manage your datasets. Each dataset is an independent collection of cards with its own storage.');
        modalBody.appendChild(description);

        // Existing datasets section
        const datasetsTitle = h('h3', { style: 'margin-bottom: var(--space-md);' }, 'Your Datasets');
        modalBody.appendChild(datasetsTitle);

        if (allKeys.length === 0) {
          const empty = h('div', { className: 'empty', style: 'margin-bottom: var(--space-xl);' }, 
            'No datasets found. Create your first dataset below.');
          modalBody.appendChild(empty);
        } else {
          // List existing datasets
          const datasetList = h('div', { style: 'margin-bottom: var(--space-xl);' });
          
          allKeys.forEach(key => {
            const isCurrent = key === current;
            const datasetItem = h('div', { 
              style: `
                background: ${isCurrent ? 'var(--primary-light, #e3f2fd)' : 'var(--bg-secondary)'};
                padding: var(--space-lg);
                border-radius: var(--radius);
                border: 2px solid ${isCurrent ? 'var(--primary)' : 'var(--border)'};
                margin-bottom: var(--space-md);
                display: flex;
                justify-content: space-between;
                align-items: center;
              `
            });

            // Dataset info
            const datasetInfo = h('div', { style: 'flex: 1;' });
            const datasetName = h('div', { style: 'font-weight: 700; margin-bottom: var(--space-xs);' }, 
              key + (isCurrent ? ' (Active)' : ''));
            const datasetMeta = h('div', { style: 'font-size: 0.875rem; color: var(--text-secondary);' });
            
            // Get size info
            try {
              const data = localStorage.getItem(key);
              const size = data ? new Blob([data]).size : 0;
              const formatBytes = (bytes) => {
                if (bytes === 0) return '0 Bytes';
                const k = 1024;
                const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
              };
              
              const parsed = data ? JSON.parse(data) : null;
              const cardCount = parsed ? Object.keys(parsed.cards || {}).length : 0;
              const datasetName = (parsed && parsed.metadata && parsed.metadata.name) || key;
              const storageType = (parsed && parsed.metadata && parsed.metadata.storageType) || 'localstorage';
              const storageTypeDisplay = storageType === 'indexeddb' ? 'IndexedDB' : 'LocalStorage';
              
              datasetMeta.textContent = `Storage: ${storageTypeDisplay} • Size: ${formatBytes(size)} • Cards: ${cardCount}`;
            } catch (e) {
              datasetMeta.textContent = 'Storage: Unknown • Unable to read dataset info';
            }

            datasetInfo.appendChild(datasetName);
            datasetInfo.appendChild(datasetMeta);
            datasetItem.appendChild(datasetInfo);

            // Actions
            const actions = h('div', { style: 'display: flex; gap: var(--space-sm);' });
            
            if (!isCurrent) {
              const openBtn = h('button', { 
                className: 'btn btn-primary',
                onclick: () => {
                  localStorage.setItem('activeInstance', key);
                  instanceKey = key;
                  load();
                  if (!safeMode) {
                    CardSpoke_MODS.syncFromStore();
                    CardSpoke_MODS.runHook('onAppInit');
                  }
                  render();
                  overlay.remove();
                  showToast('Switched to: ' + key);
                }
              }, 'Open');
              actions.appendChild(openBtn);
            }

            const deleteBtn = h('button', { 
              className: 'btn btn-danger',
              onclick: () => {
                if (allKeys.length === 1) {
                  showToast('Cannot delete the only dataset', 'error');
                  return;
                }
                if (confirm(`Delete dataset "${key}"?\n\nThis will permanently delete all cards and data in this dataset.\n\nThis action cannot be undone!`)) {
                  localStorage.removeItem(key);
                  if (isCurrent && allKeys.length > 1) {
                    // Switch to another dataset
                    const otherKey = allKeys.find(k => k !== key);
                    localStorage.setItem('activeInstance', otherKey);
                    instanceKey = otherKey;
                    load();
                    CardSpoke_MODS.syncFromStore();
                    CardSpoke_MODS.runHook('onAppInit');
                    render();
                  }
                  overlay.remove();
                  showToast('Dataset deleted: ' + key);
                  // Reopen manager to refresh list
                  setTimeout(() => showDatasetManager(), 100);
                }
              }
            }, 'Delete');
            actions.appendChild(deleteBtn);

            datasetItem.appendChild(actions);
            datasetList.appendChild(datasetItem);
          });

          modalBody.appendChild(datasetList);
        }

        // Create new dataset section
        const createTitle = h('h3', { style: 'margin-bottom: var(--space-md);' }, 'Create New Dataset');
        modalBody.appendChild(createTitle);

        const createForm = h('div', { 
          style: `
            background: var(--bg-secondary);
            padding: var(--space-lg);
            border-radius: var(--radius);
            border: 1px solid var(--border);
          `
        });

        // Dataset name input
        const nameLabel = h('label', { 
          style: 'display: block; margin-bottom: var(--space-xs); font-weight: 600;' 
        }, 'Dataset Name');
        const nameInput = h('input', {
          type: 'text',
          id: 'newDatasetName',
          placeholder: 'My Dataset',
          style: `
            width: 100%;
            padding: var(--space-md);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            background: var(--bg-primary);
            color: var(--text-primary);
            margin-bottom: var(--space-lg);
            font-size: 1rem;
          `
        });

        // Storage type selection
        const storageLabel = h('label', { 
          style: 'display: block; margin-bottom: var(--space-xs); font-weight: 600;' 
        }, 'Storage Type');
        const storageSelect = h('select', {
          id: 'newDatasetStorage',
          style: `
            width: 100%;
            padding: var(--space-md);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            background: var(--bg-primary);
            color: var(--text-primary);
            margin-bottom: var(--space-xs);
            font-size: 1rem;
          `
        });

        const optionLocal = h('option', { value: 'localstorage' }, 'LocalStorage (Browser storage, fast access)');
        const optionIndexed = h('option', { value: 'indexeddb' }, 'IndexedDB (Browser database, larger capacity)');
        const optionGoogleDrive = h('option', { value: 'googledrive' }, 'Google Drive (Cross-Device, cloud sync)');
        const optionOneDrive = h('option', { value: 'onedrive' }, 'OneDrive (Cross-Device, cloud sync)');
        const optionWebDAV = h('option', { value: 'webdav' }, 'WebDAV Server (Self-hosted)');
        storageSelect.appendChild(optionLocal);
        storageSelect.appendChild(optionIndexed);
        storageSelect.appendChild(optionGoogleDrive);
        storageSelect.appendChild(optionOneDrive);
        storageSelect.appendChild(optionWebDAV);

        const storageHelp = h('div', {
          style: 'font-size: 0.875rem; color: var(--text-secondary); margin-bottom: var(--space-lg);'
        }, 'LocalStorage: ~5MB, fast. IndexedDB: ~50MB+. Cloud options: unlimited storage, sync across devices.');

        // WebDAV configuration fields (conditional)
        const webdavConfig = h('div', {
          id: 'webdavConfig',
          style: 'display: none; margin-bottom: var(--space-lg);'
        });

        const webdavUrlLabel = h('label', {
          style: 'display: block; margin-bottom: var(--space-xs); font-weight: 600; color: var(--text-primary);'
        }, 'WebDAV Server URL');
        const webdavUrlInput = h('input', {
          type: 'text',
          id: 'webdavUrl',
          placeholder: 'https://your-server.com/webdav/',
          style: `
            width: 100%;
            padding: var(--space-md);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            background: var(--bg-primary);
            color: var(--text-primary);
            margin-bottom: var(--space-md);
            font-size: 1rem;
          `
        });

        const webdavUserLabel = h('label', {
          style: 'display: block; margin-bottom: var(--space-xs); font-weight: 600; color: var(--text-primary);'
        }, 'Username');
        const webdavUserInput = h('input', {
          type: 'text',
          id: 'webdavUser',
          placeholder: 'username',
          style: `
            width: 100%;
            padding: var(--space-md);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            background: var(--bg-primary);
            color: var(--text-primary);
            margin-bottom: var(--space-md);
            font-size: 1rem;
          `
        });

        const webdavPassLabel = h('label', {
          style: 'display: block; margin-bottom: var(--space-xs); font-weight: 600; color: var(--text-primary);'
        }, 'Password');
        const webdavPassInput = h('input', {
          type: 'password',
          id: 'webdavPass',
          placeholder: 'password',
          style: `
            width: 100%;
            padding: var(--space-md);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            background: var(--bg-primary);
            color: var(--text-primary);
            margin-bottom: var(--space-xs);
            font-size: 1rem;
          `
        });

        const webdavHelp = h('div', {
          style: 'font-size: 0.875rem; color: var(--text-secondary);'
        }, 'Warning: Password will NOT be saved for security. You\'ll need to re-enter it each session.');

        webdavConfig.appendChild(webdavUrlLabel);
        webdavConfig.appendChild(webdavUrlInput);
        webdavConfig.appendChild(webdavUserLabel);
        webdavConfig.appendChild(webdavUserInput);
        webdavConfig.appendChild(webdavPassLabel);
        webdavConfig.appendChild(webdavPassInput);
        webdavConfig.appendChild(webdavHelp);

        // Show/hide WebDAV config based on storage type selection
        storageSelect.addEventListener('change', () => {
          const selected = storageSelect.value;
          if (selected === 'webdav') {
            webdavConfig.style.display = 'block';
          } else {
            webdavConfig.style.display = 'none';
          }
        });

        // PIN protection (future feature)
        const pinLabel = h('label', { 
          style: 'display: block; margin-bottom: var(--space-xs); font-weight: 600;' 
        }, 'PIN Protection (Optional)');
        const pinInput = h('input', {
          type: 'password',
          id: 'newDatasetPin',
          placeholder: 'Leave empty for no PIN',
          title: 'PIN encryption will be available in v0.10.3',
          style: `
            width: 100%;
            padding: var(--space-md);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            background: var(--bg-primary);
            color: var(--text-primary);
            margin-bottom: var(--space-xs);
            font-size: 1rem;
            cursor: not-allowed;
          `,
          disabled: true
        });

        const pinHelp = h('div', { 
          style: 'font-size: 0.875rem; color: var(--text-secondary); margin-bottom: var(--space-lg);' 
        }, 'PIN encryption coming in v0.10.3 - feature currently disabled for security hardening.');

        // Create button
        const createBtn = h('button', {
          className: 'btn btn-primary',
          style: 'width: 100%;',
          onclick: async () => {
            let name = document.getElementById('newDatasetName').value.trim();
            const storageType = document.getElementById('newDatasetStorage').value;

            // Generate a readable default name if none provided
            if (!name) {
              const now = new Date();
              const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '_');
              const count = Object.keys(localStorage).filter(k => k.startsWith('cards_')).length + 1;
              name = 'Dataset_' + count;
            }

            // Validate WebDAV config if selected
            let config = {};
            if (storageType === 'webdav') {
              const url = document.getElementById('webdavUrl').value.trim();
              const username = document.getElementById('webdavUser').value.trim();
              const password = document.getElementById('webdavPass').value;

              if (!url || !username || !password) {
                showToast('Please fill in all WebDAV configuration fields', 'error');
                return;
              }

              config = { url, username, password };
            }

            // For cloud storage (Google Drive, OneDrive), initialize and trigger auth
            if (storageType === 'googledrive') {
              try {
                const driver = new GoogleDriveDriver();
                await driver.init({});
                showToast('Connecting to Google Drive...', 'info');
                // The OAuth popup will appear automatically via ensureAuthenticated
                await driver.ensureAuthenticated();
                showToast('Connected to Google Drive!', 'success');
              } catch (error) {
                showToast('Failed to connect to Google Drive: ' + error.message, 'error');
                return;
              }
            } else if (storageType === 'onedrive') {
              try {
                const driver = new OneDriveDriver();
                await driver.init({});
                showToast('Connecting to OneDrive...', 'info');
                // The OAuth popup will appear automatically via ensureAuthenticated
                await driver.ensureAuthenticated();
                showToast('Connected to OneDrive!', 'success');
              } catch (error) {
                showToast('Failed to connect to OneDrive: ' + error.message, 'error');
                return;
              }
            }

            // Generate a clean, short key using the name and a short timestamp
            const shortId = Date.now().toString(36).slice(-4);
            const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20);
            const newKey = 'cards_' + cleanName + '_' + shortId;

            // Store the display name and storage type in the store metadata
            const newStore = {
              rootOrder: [],
              cards: {},
              mods: {},
              bookmarks: [],
              recentCards: [],
              viewMode: 'normal',
              activeTheme: 'light',
              metadata: {
                name: name,
                storageType: storageType,
                storageConfig: config,
                createdAt: Date.now()
              }
            };

            // Save to localStorage (for now - cloud sync will happen on subsequent saves)
            localStorage.setItem('activeInstance', newKey);
            instanceKey = newKey;
            store = newStore;
            save();
            render();
            overlay.remove();
            showToast(`Created new dataset: ${name} (${storageType})`);
          }
        }, '+ Create Dataset');

        createForm.appendChild(nameLabel);
        createForm.appendChild(nameInput);
        createForm.appendChild(storageLabel);
        createForm.appendChild(storageSelect);
        createForm.appendChild(storageHelp);
        createForm.appendChild(webdavConfig);
        createForm.appendChild(pinLabel);
        createForm.appendChild(pinInput);
        createForm.appendChild(pinHelp);
        createForm.appendChild(createBtn);

        modalBody.appendChild(createForm);

        modal.appendChild(modalBody);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        overlay.onclick = (e) => {
          if (e.target === overlay) overlay.remove();
        };

        // Focus on name input
        setTimeout(() => nameInput.focus(), 100);
      }



      function showDatasetInfo() {
        const overlay = h('div', { className: 'modal-overlay show' });
        const modal = h('div', { className: 'modal' });
        const modalHeader = h('div', { className: 'modal-header' });
        modalHeader.appendChild(h('div', { className: 'modal-title' }, 'Dataset Information'));
        const closeBtn = h('button', { className: 'modal-close', onclick: () => overlay.remove() }, '✕');
        modalHeader.appendChild(closeBtn);
        modal.appendChild(modalHeader);
        const modalBody = h('div', { className: 'modal-body' });

        // Current instance/dataset info
        const currentKey = instanceKey || 'nested_cards_store';
        const currentData = localStorage.getItem(currentKey);
        
        // Calculate size
        let dataSize = 0;
        let totalSize = 0;
        let itemCount = 0;
        
        if (currentData) {
          dataSize = new Blob([currentData]).size;
        }
        
        // Count all localStorage items
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += new Blob([value]).size;
            itemCount++;
          }
        }

        // Parse store info
        let cardCount = 0;
        let modCount = 0;
        let bookmarkCount = 0;
        let recentCount = 0;
        
        if (store) {
          cardCount = Object.keys(store.cards || {}).length;
          modCount = Object.keys(store.mods || {}).length;
          bookmarkCount = (store.bookmarks || []).length;
          recentCount = (store.recentCards || []).length;
        }

        // Format bytes
        const formatBytes = (bytes) => {
          if (bytes === 0) return '0 Bytes';
          const k = 1024;
          const sizes = ['Bytes', 'KB', 'MB', 'GB'];
          const i = Math.floor(Math.log(bytes) / Math.log(k));
          return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
        };

        // Get storage type and display name from store metadata
        const displayName = (store && store.metadata && store.metadata.name) || currentKey;
        const storageType = (store && store.metadata && store.metadata.storageType) || 'localstorage';
        const storageTypeDisplay = storageType === 'indexeddb' ? 'IndexedDB' : 'LocalStorage';

        // Create info sections
        const infoHtml = `
          <div style="margin-bottom: var(--space-xl);">
            <h3 style="margin-bottom: var(--space-md); color: var(--text-primary);">Current Dataset</h3>
            <div style="background: var(--bg-secondary); padding: var(--space-lg); border-radius: var(--radius); border: 1px solid var(--border);">
              <div style="margin-bottom: var(--space-sm);"><strong>Name:</strong> ${displayName}</div>
              <div style="margin-bottom: var(--space-sm);"><strong>Storage Type:</strong> ${storageTypeDisplay}</div>
              <div style="margin-bottom: var(--space-sm);"><strong>Size:</strong> ${formatBytes(dataSize)}</div>
              <div style="margin-bottom: var(--space-sm);"><strong>PIN Protected:</strong> No</div>
            </div>
          </div>

          <div style="margin-bottom: var(--space-xl);">
            <h3 style="margin-bottom: var(--space-md); color: var(--text-primary);">Dataset Contents</h3>
            <div style="background: var(--bg-secondary); padding: var(--space-lg); border-radius: var(--radius); border: 1px solid var(--border);">
              <div style="margin-bottom: var(--space-sm);"><strong>Cards:</strong> ${cardCount}</div>
              <div style="margin-bottom: var(--space-sm);"><strong>Extensions:</strong> ${modCount}</div>
              <div style="margin-bottom: var(--space-sm);"><strong>Bookmarks:</strong> ${bookmarkCount}</div>
              <div style="margin-bottom: var(--space-sm);"><strong>Recent Cards:</strong> ${recentCount}</div>
            </div>
          </div>

          <div style="margin-bottom: var(--space-xl);">
            <h3 style="margin-bottom: var(--space-md); color: var(--text-primary);">Storage Overview</h3>
            <div style="background: var(--bg-secondary); padding: var(--space-lg); border-radius: var(--radius); border: 1px solid var(--border);">
              <div style="margin-bottom: var(--space-sm);"><strong>Total LocalStorage:</strong> ${formatBytes(totalSize)}</div>
              <div style="margin-bottom: var(--space-sm);"><strong>Total Items:</strong> ${itemCount}</div>
              <div style="margin-bottom: var(--space-sm);"><strong>Quota Used:</strong> ~${Math.round((totalSize / (5 * 1024 * 1024)) * 100)}% (typical 5MB limit)</div>
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: var(--space-md); color: var(--text-primary);">Quick Actions</h3>
            <div style="display: flex; gap: var(--space-md); flex-wrap: wrap;">
              <button id="exportDataBtn" class="btn btn-primary">Export Dataset</button>
              <button id="switchInstanceBtn" class="btn btn-secondary">Switch Dataset</button>
            </div>
          </div>
        `;

        modalBody.innerHTML = infoHtml;
        modal.appendChild(modalBody);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Add event listeners for quick actions
        document.getElementById('exportDataBtn').onclick = () => {
          overlay.remove();
          handleExport('instance-json');
        };

        document.getElementById('switchInstanceBtn').onclick = () => {
          overlay.remove();
          showDatasetManager();
        };

        overlay.onclick = (e) => {
          if (e.target === overlay) overlay.remove();
        };
      }


      /**
       * Show Extensions Hub - unified interface for extensions management (v0.12.3)
       * Combines Extensions, Extensions Store, Extension Wizard, and Playground
       */
      function showExtensionsHub(initialTab = 'installed') {
        const overlay = h('div', { className: 'modal-overlay show' });
        const modal = h('div', { className: 'modal', style: 'max-width: 900px; max-height: 90vh;' });
        const modalHeader = h('div', { className: 'modal-header' });
        modalHeader.appendChild(h('div', { className: 'modal-title' }, 'Extensions Hub'));
        const closeBtn = h('button', { className: 'modal-close', onclick: () => overlay.remove(), 'aria-label': 'Close' }, '✕');
        modalHeader.appendChild(closeBtn);
        modal.appendChild(modalHeader);
        
        // Tabs for different sections
        const tabContainer = h('div', { className: 'modal-tabs', role: 'tablist' });
        const tabs = [
          { id: 'installed', label: 'Installed', ariaLabel: 'View installed extensions' },
          { id: 'store', label: 'Store', ariaLabel: 'Browse extensions store' },
          { id: 'wizard', label: 'Wizard', ariaLabel: 'Create new extension' },
          { id: 'playground', label: 'Playground', ariaLabel: 'Test extension code' }
        ];
        
        let activeTab = initialTab;
        
        function renderTabContent() {
          const existingBody = modal.querySelector('.modal-body');
          if (existingBody) existingBody.remove();
          
          const modalBody = h('div', { className: 'modal-body', style: 'max-height: calc(90vh - 150px); overflow-y: auto;' });
          
          switch (activeTab) {
            case 'installed':
              renderInstalledTab(modalBody);
              break;
            case 'store':
              renderStoreTab(modalBody);
              break;
            case 'wizard':
              renderWizardTab(modalBody, overlay);
              break;
            case 'playground':
              renderPlaygroundTab(modalBody);
              break;
          }
          
          modal.appendChild(modalBody);
        }
        
        function renderInstalledTab(container) {
          const mods = Object.entries(store.mods || {});
          
          if (mods.length === 0) {
            container.appendChild(h('div', { className: 'empty', style: 'padding: var(--space-2xl);' }, 
              'No extensions installed. Browse the Store or create one with the Wizard!'));
            return;
          }
          
          const devMode = isDeveloperMode();
          
          mods.forEach(function([modId, modData]) {
            const modItem = h('div', {
              style: 'background: var(--bg-secondary); padding: var(--space-lg); border-radius: var(--radius); border: 1px solid var(--border); margin-bottom: var(--space-md);'
            });
            
            const modHeader = h('div', { style: 'display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-sm);' });
            const modInfo = h('div', {});
            const titleRow = h('div', { style: 'display: flex; align-items: center; gap: var(--space-sm);' });
            titleRow.appendChild(h('span', { style: 'font-weight: 700; font-size: var(--text-lg);' }, modData.meta?.name || modId));

            // Security: Add risk badge
            const risk = assessExtensionRisk(modData);
            const riskBadge = h('span', {
              style: `font-size: var(--text-xs); padding: 2px 8px; border-radius: 12px; background: ${risk.color}22; color: ${risk.color}; font-weight: 700; border: 1px solid ${risk.color};`,
              title: risk.permissions.join(', ') || 'No special permissions'
            }, risk.icon + ' ' + risk.riskLevel);
            titleRow.appendChild(riskBadge);

            modInfo.appendChild(titleRow);
            modInfo.appendChild(h('div', { style: 'color: var(--text-muted); font-size: var(--text-sm);' },
              'v' + (modData.meta?.version || '1.0.0') + ' by ' + (modData.meta?.creator || 'Unknown')));
            modHeader.appendChild(modInfo);
            
            const toggleBtn = h('button', {
              className: modData.enabled ? 'btn btn-primary' : 'btn',
              onclick: function() {
                if (modData.enabled) CardSpoke_MODS.disable(modId);
                else CardSpoke_MODS.enable(modId);
                overlay.remove();
                showExtensionsHub('installed');
              }
            }, modData.enabled ? 'Enabled ✓' : 'Disabled');
            modHeader.appendChild(toggleBtn);
            
            modItem.appendChild(modHeader);
            
            if (modData.meta?.description) {
              modItem.appendChild(h('div', { style: 'margin-bottom: var(--space-sm);' }, modData.meta.description));
            }
            
            // Actions row
            const actionsRow = h('div', { style: 'display: flex; gap: var(--space-sm);' });
            
            if (devMode) {
              const exportBtn = h('button', {
                className: 'btn',
                style: 'font-size: var(--text-sm);',
                onclick: function() {
                  const blob = new Blob([JSON.stringify(modData, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = h('a', { href: url, download: modId + '.json' });
                  a.click();
                  URL.revokeObjectURL(url);
                  showToast('Extension exported');
                }
              }, 'Export');
              actionsRow.appendChild(exportBtn);
            }
            
            const deleteBtn = h('button', {
              className: 'btn btn-danger',
              style: 'font-size: var(--text-sm);',
              onclick: function() {
                if (confirm('Delete extension "' + (modData.meta?.name || modId) + '"?')) {
                  CardSpoke_MODS.disable(modId);
                  delete store.mods[modId];
                  save();
                  showToast('Extension deleted');
                  overlay.remove();
                  showExtensionsHub('installed');
                }
              }
            }, 'Delete');
            actionsRow.appendChild(deleteBtn);
            
            modItem.appendChild(actionsRow);
            container.appendChild(modItem);
          });
          
          // Upload Extension button
          const uploadSection = h('div', { style: 'margin-top: var(--space-xl); padding-top: var(--space-xl); border-top: 1px solid var(--border);' });
          uploadSection.appendChild(h('div', { style: 'font-weight: 700; margin-bottom: var(--space-md);' }, 'Install Extension'));
          
          const uploadArea = h('div', { 
            className: 'file-upload-area',
            style: 'padding: var(--space-xl);',
            onclick: function() {
              const input = h('input', { type: 'file', accept: '.json', style: 'display:none' });
              input.onchange = function(e) {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = function(ev) {
                    try {
                      const modData = JSON.parse(ev.target.result);
                      const modId = modData.id || file.name.replace('.json', '');

                      // Security: Assess extension risk and show warning
                      const risk = assessExtensionRisk(modData);
                      const extName = modData.meta?.name || modId;

                      let warningMessage = `Install extension "${extName}"?\n\n`;
                      warningMessage += `Type: ${risk.type}\n`;
                      warningMessage += `Security Risk: ${risk.riskLevel}\n\n`;

                      if (risk.permissions.length > 0) {
                        warningMessage += 'This extension will be able to:\n';
                        risk.permissions.forEach(p => warningMessage += `• ${p}\n`);
                      }

                      if (risk.riskLevel === 'HIGH') {
                        warningMessage += '\n⚠️ HIGH RISK: This extension can access and modify all your data, ';
                        warningMessage += 'and could send it to external servers. Only install if you trust the source.';
                      } else if (risk.riskLevel === 'MEDIUM') {
                        warningMessage += '\n⚠️ MEDIUM RISK: This extension can modify your data. ';
                        warningMessage += 'Only install from trusted sources.';
                      } else if (risk.hasJS) {
                        warningMessage += '\n✓ LOW RISK: This extension has limited capabilities.';
                      } else {
                        warningMessage += '\n✓ LOW RISK: This is a CSS-only theme with no code execution.';
                      }

                      if (confirm(warningMessage)) {
                        store.mods[modId] = modData;
                        save();
                        CardSpoke_MODS.syncFromStore();
                        showToast('Extension installed: ' + extName);
                        overlay.remove();
                        showExtensionsHub('installed');
                      }
                    } catch (err) {
                      showToast('Invalid extension file: ' + err.message, 'error');
                    }
                  };
                  reader.readAsText(file);
                }
              };
              input.click();
            }
          });
          uploadArea.appendChild(h('div', { className: 'upload-text' }, 'Click to install extension (.json)'));
          uploadSection.appendChild(uploadArea);
          container.appendChild(uploadSection);
        }
        
        function renderStoreTab(container) {
          const banner = h('div', {
            style: 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: var(--space-2xl); border-radius: var(--radius); margin-bottom: var(--space-xl); text-align: center;'
          });
          banner.appendChild(h('div', { style: 'font-size: 48px; margin-bottom: var(--space-md);' }, ''));
          banner.appendChild(h('div', { style: 'font-size: var(--text-xl); font-weight: 700; margin-bottom: var(--space-sm);' }, 'Extensions Store'));
          banner.appendChild(h('div', { style: 'opacity: 0.9;' }, 'Coming Soon! Browse and install community extensions.'));
          container.appendChild(banner);
          
          const categories = [
            { icon: '', name: 'Themes', desc: 'Visual styles and color schemes' },
            { icon: '', name: 'Tools', desc: 'Productivity enhancements' },
            { icon: '', name: 'Analytics', desc: 'Data visualization' },
            { icon: '', name: 'Integrations', desc: 'External services' }
          ];
          
          const grid = h('div', { style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-lg);' });
          categories.forEach(function(cat) {
            const card = h('div', {
              style: 'padding: var(--space-lg); border: 1px solid var(--border); border-radius: var(--radius); text-align: center;'
            });
            card.appendChild(h('div', { style: 'font-size: 32px; margin-bottom: var(--space-sm);' }, cat.icon));
            card.appendChild(h('div', { style: 'font-weight: 700;' }, cat.name));
            card.appendChild(h('div', { style: 'font-size: var(--text-sm); color: var(--text-muted);' }, cat.desc));
            grid.appendChild(card);
          });
          container.appendChild(grid);
        }
        
        function renderWizardTab(container, overlayRef) {
          container.appendChild(h('div', { style: 'font-weight: 700; font-size: var(--text-lg); margin-bottom: var(--space-lg);' }, 
            'Create New Extension'));
          
          const form = h('form', { 
            style: 'display: flex; flex-direction: column; gap: var(--space-lg);',
            onsubmit: function(e) {
              e.preventDefault();
              const formData = new FormData(e.target);
              const modId = formData.get('name').toLowerCase().replace(/[^a-z0-9-]/g, '-');
              const newMod = {
                id: modId,
                meta: {
                  name: formData.get('name'),
                  type: formData.get('type'),
                  creator: formData.get('creator'),
                  version: '1.0.0',
                  releaseDate: new Date().toISOString().split('T')[0],
                  description: formData.get('description')
                },
                js: formData.get('js') || '',
                css: formData.get('css') || '',
                enabled: false
              };
              store.mods[modId] = newMod;
              save();
              showToast('Extension created: ' + newMod.meta.name);
              overlayRef.remove();
              showExtensionsHub('installed');
            }
          });
          
          form.appendChild(createFormGroup('Name', 'text', 'name', 'My Extension', true));
          form.appendChild(createFormGroup('Creator', 'text', 'creator', 'Your Name', true));
          form.appendChild(createFormGroup('Description', 'text', 'description', 'A brief description'));
          
          const typeGroup = h('div', { className: 'form-group' });
          typeGroup.appendChild(h('label', { className: 'form-label' }, 'Type'));
          const typeSelect = h('select', { className: 'form-select', name: 'type' });
          ['Theme', 'Patch', 'Plugin', 'Mod'].forEach(function(t) {
            typeSelect.appendChild(h('option', { value: t }, t));
          });
          typeGroup.appendChild(typeSelect);
          form.appendChild(typeGroup);
          
          const jsGroup = h('div', { className: 'form-group' });
          jsGroup.appendChild(h('label', { className: 'form-label' }, 'JavaScript (optional)'));
          jsGroup.appendChild(h('textarea', { 
            className: 'form-textarea', 
            name: 'js', 
            placeholder: "CardSpoke_MODS.register('my-mod', { onAppInit(ctx) { console.log('Hello!'); } });",
            style: 'min-height: 100px; font-family: monospace;'
          }));
          form.appendChild(jsGroup);
          
          const cssGroup = h('div', { className: 'form-group' });
          cssGroup.appendChild(h('label', { className: 'form-label' }, 'CSS (optional)'));
          cssGroup.appendChild(h('textarea', { 
            className: 'form-textarea', 
            name: 'css', 
            placeholder: '/* Custom styles */',
            style: 'min-height: 80px; font-family: monospace;'
          }));
          form.appendChild(cssGroup);
          
          form.appendChild(h('button', { type: 'submit', className: 'btn btn-primary' }, 'Create Extension'));
          container.appendChild(form);
        }
        
        function createFormGroup(label, type, name, placeholder, required) {
          const group = h('div', { className: 'form-group' });
          group.appendChild(h('label', { className: 'form-label' }, label));
          group.appendChild(h('input', { 
            type: type, 
            className: 'form-input', 
            name: name, 
            placeholder: placeholder,
            required: required || false
          }));
          return group;
        }
        
        function renderPlaygroundTab(container) {
          container.appendChild(h('div', { style: 'font-weight: 700; font-size: var(--text-lg); margin-bottom: var(--space-md);' }, 
            'Code Playground'));
          container.appendChild(h('div', { style: 'color: var(--text-muted); margin-bottom: var(--space-lg);' }, 
            'Test CardSpoke API code in a sandboxed environment.'));
          
          const codeArea = h('textarea', {
            className: 'form-textarea',
            style: 'min-height: 200px; font-family: monospace; font-size: var(--text-sm);',
            placeholder: "// Example: Use CardSpoke.utils API\nconst meta = await CardSpoke.utils.getDatasetMeta();\nconsole.log('Dataset:', meta.name);\n\n// Search cards\nconst results = await CardSpoke.utils.searchCards('test');\nconsole.log('Found:', results.length, 'cards');",
            id: 'playgroundCode'
          });
          container.appendChild(codeArea);
          
          const outputArea = h('pre', {
            style: 'background: #1e1e1e; color: #d4d4d4; padding: var(--space-lg); border-radius: var(--radius); min-height: 100px; margin-top: var(--space-lg); overflow: auto; font-family: monospace; font-size: var(--text-sm);',
            id: 'playgroundOutput'
          }, '// Output will appear here');
          container.appendChild(outputArea);
          
          const btnRow = h('div', { style: 'display: flex; gap: var(--space-md); margin-top: var(--space-lg);' });
          
          const runBtn = h('button', {
            className: 'btn btn-primary',
            onclick: function() {
              const code = document.getElementById('playgroundCode').value;
              const output = document.getElementById('playgroundOutput');
              output.textContent = '';
              
              const sandboxConsole = {
                log: function() { output.textContent += Array.from(arguments).join(' ') + '\n'; },
                error: function() { output.textContent += '[ERROR] ' + Array.from(arguments).join(' ') + '\n'; },
                warn: function() { output.textContent += '[WARN] ' + Array.from(arguments).join(' ') + '\n'; }
              };
              
              try {
                const fn = new Function('console', 'CardSpoke', 'return (async () => {' + code + '})();');
                fn(sandboxConsole, window.CardSpoke).then(function() {
                  output.textContent += '\n[OK] Code executed successfully';
                }).catch(function(err) {
                  output.textContent += '\n[ERROR] Error: ' + err.message;
                });
              } catch (err) {
                output.textContent = '[ERROR] Syntax Error: ' + err.message;
              }
            }
          }, 'Run Code');
          btnRow.appendChild(runBtn);
          
          const clearBtn = h('button', {
            className: 'btn',
            onclick: function() {
              document.getElementById('playgroundCode').value = '';
              document.getElementById('playgroundOutput').textContent = '// Output will appear here';
            }
          }, 'Clear');
          btnRow.appendChild(clearBtn);
          
          container.appendChild(btnRow);
        }
        
        // Create tabs
        tabs.forEach(function(tab) {
          const tabBtn = h('button', {
            className: 'modal-tab' + (activeTab === tab.id ? ' active' : ''),
            'data-tab': tab.id,
            role: 'tab',
            'aria-selected': (activeTab === tab.id).toString(),
            'aria-label': tab.ariaLabel,
            onclick: function() {
              activeTab = tab.id;
              // Update tab styles
              tabContainer.querySelectorAll('.modal-tab').forEach(function(t) {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
              });
              this.classList.add('active');
              this.setAttribute('aria-selected', 'true');
              renderTabContent();
            }
          }, tab.label);
          tabContainer.appendChild(tabBtn);
        });
        
        modal.appendChild(tabContainer);
        renderTabContent();
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        trapFocus(modal);
        
        overlay.onclick = function(e) {
          if (e.target === overlay) overlay.remove();
        };
      }



      /**
       * Show Data Hub - unified interface for dataset and export management (v0.12.3)
       * Combines Dataset Manager, Dataset Info, and all export options
       */
      function showDataHub() {
        const overlay = h('div', { className: 'modal-overlay show' });
        const modal = h('div', { className: 'modal', style: 'max-width: 700px; max-height: 90vh;' });
        const modalHeader = h('div', { className: 'modal-header' });
        modalHeader.appendChild(h('div', { className: 'modal-title' }, 'Data & Export'));
        const closeBtn = h('button', { className: 'modal-close', onclick: () => overlay.remove(), 'aria-label': 'Close' }, '✕');
        modalHeader.appendChild(closeBtn);
        modal.appendChild(modalHeader);
        
        const modalBody = h('div', { className: 'modal-body', style: 'max-height: calc(90vh - 100px); overflow-y: auto;' });
        
        // Dataset Info Section
        const infoSection = h('div', { style: 'margin-bottom: var(--space-2xl); padding-bottom: var(--space-xl); border-bottom: 1px solid var(--border);' });
        infoSection.appendChild(h('div', { 
          style: 'font-weight: 700; margin-bottom: var(--space-lg); font-size: var(--text-lg);'
        }, 'Dataset Info'));
        
        // Dataset name with rename capability (v0.12.3 fix)
        const currentDatasetName = ((store.metadata && store.metadata.name) || instanceKey || 'Default').trim();
        const nameRow = h('div', { 
          style: 'display: flex; align-items: center; gap: var(--space-md); margin-bottom: var(--space-lg); background: var(--bg-secondary); padding: var(--space-md); border-radius: var(--radius); border: 1px solid var(--border);'
        });
        nameRow.appendChild(h('label', { 
          style: 'font-weight: 600; min-width: 80px;'
        }, 'Name:'));
        const nameInput = h('input', {
          type: 'text',
          value: currentDatasetName,
          id: 'datasetNameInput',
          style: 'flex: 1; padding: var(--space-sm); border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg-primary); color: var(--text-primary);'
        });
        nameRow.appendChild(nameInput);
        const saveNameBtn = h('button', {
          className: 'btn btn-primary',
          onclick: function() {
            const newName = nameInput.value.trim();
            if (newName && newName !== currentDatasetName.trim()) {
              if (!store.metadata) store.metadata = {};
              store.metadata.name = newName;
              store.metadata.updatedAt = Date.now();
              save();
              showToast('Dataset renamed to: ' + newName);
            }
          }
        }, 'Save');
        nameRow.appendChild(saveNameBtn);
        infoSection.appendChild(nameRow);
        
        const cardCount = Object.keys(store.cards || {}).length;
        const tagCount = getAllTags().length;
        const modCount = Object.keys(store.mods || {}).length;
        const bookmarkCount = (store.bookmarks || []).length;
        
        const statsGrid = h('div', { style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: var(--space-md); margin-bottom: var(--space-lg);' });
        
        const stats = [
          { label: 'Cards', value: cardCount, icon: '' },
          { label: 'Tags', value: tagCount, icon: '' },
          { label: 'Extensions', value: modCount, icon: '' },
          { label: 'Bookmarks', value: bookmarkCount, icon: '' }
        ];
        
        stats.forEach(function(stat) {
          const statCard = h('div', {
            style: 'background: var(--bg-secondary); padding: var(--space-lg); border-radius: var(--radius); text-align: center; border: 1px solid var(--border);'
          });
          statCard.appendChild(h('div', { style: 'font-size: 24px; margin-bottom: var(--space-xs);' }, stat.icon));
          statCard.appendChild(h('div', { style: 'font-size: var(--text-2xl); font-weight: 700;' }, String(stat.value)));
          statCard.appendChild(h('div', { style: 'color: var(--text-muted); font-size: var(--text-sm);' }, stat.label));
          statsGrid.appendChild(statCard);
        });
        
        infoSection.appendChild(statsGrid);
        
        // Storage info
        const storageInfo = h('div', { style: 'font-size: var(--text-sm); color: var(--text-muted);' });
        try {
          const key = instanceKey || 'nested_cards_store';
          const storeSize = JSON.stringify(store).length;
          storageInfo.textContent = 'Storage: ~' + Math.round(storeSize / 1024) + ' KB used';
        } catch(e) {
          storageInfo.textContent = 'Storage: Unable to calculate';
        }
        infoSection.appendChild(storageInfo);
        
        modalBody.appendChild(infoSection);
        
        // Export Section
        const exportSection = h('div', { style: 'margin-bottom: var(--space-2xl); padding-bottom: var(--space-xl); border-bottom: 1px solid var(--border);' });
        exportSection.appendChild(h('div', { 
          style: 'font-weight: 700; margin-bottom: var(--space-lg); font-size: var(--text-lg);'
        }, 'Export Data'));
        
        const exportOptions = [
          { id: 'json', label: 'Full Backup (JSON)', desc: 'Complete dataset with all cards and settings', icon: '' },
          { id: 'txt', label: 'Cards as Text', desc: 'Plain text format for reading', icon: '' },
          { id: 'markdown', label: 'Cards as Markdown', desc: 'Formatted markdown with headers and tags', icon: '' },
          { id: 'csv', label: 'Cards as CSV', desc: 'Spreadsheet format for analysis', icon: '' },
          { id: 'mods', label: 'Extensions Only', desc: 'Export all installed extensions', icon: '' }
        ];
        
        exportOptions.forEach(function(opt) {
          const exportBtn = h('button', {
            className: 'btn',
            style: 'width: 100%; text-align: center; padding: var(--space-lg); margin-bottom: var(--space-sm); border: 1px solid var(--border); border-radius: var(--radius); display: flex; align-items: center; justify-content: center; gap: var(--space-md);',
            onclick: function() {
              switch (opt.id) {
                case 'json':
                  downloadWithFeedback(JSON.stringify(store, null, 2), 'cardspoke-backup-' + Date.now() + '.json', 'application/json');
                  break;
                case 'txt':
                  const txtContent = Object.values(store.cards || {}).map(function(c) {
                    return '=== ' + (c.title || '(Untitled)') + ' ===\n' + (c.body || '');
                  }).join('\n\n');
                  downloadWithFeedback(txtContent, 'cardspoke-cards-' + Date.now() + '.txt', 'text/plain');
                  break;
                case 'markdown':
                  const mdContent = Object.values(store.cards || {}).map(function(c) {
                    var md = '# ' + (c.title || '(Untitled)') + '\n';
                    if (c.tags && c.tags.length) md += 'Tags: ' + c.tags.map(function(t) { return '#' + t; }).join(' ') + '\n';
                    md += '\n' + (c.body || '');
                    return md;
                  }).join('\n\n---\n\n');
                  downloadWithFeedback(mdContent, 'cardspoke-cards-' + Date.now() + '.md', 'text/markdown');
                  break;
                case 'csv':
                  var csvContent = 'ID,Title,Body,Tags,Parent\n';
                  Object.values(store.cards || {}).forEach(function(c) {
                    csvContent += '"' + c.id + '","' + (c.title || '').replace(/"/g, '""') + '","' + (c.body || '').replace(/"/g, '""') + '","' + (c.tags || []).join(';') + '","' + (c.parentId || '') + '"\n';
                  });
                  downloadWithFeedback(csvContent, 'cardspoke-cards-' + Date.now() + '.csv', 'text/csv');
                  break;
                case 'mods':
                  downloadWithFeedback(JSON.stringify(store.mods || {}, null, 2), 'cardspoke-extensions-' + Date.now() + '.json', 'application/json');
                  break;
              }
              showToast('Export complete: ' + opt.label);
            }
          });
          exportBtn.appendChild(h('span', { style: 'font-size: 20px;' }, opt.icon));
          const textDiv = h('div', {});
          textDiv.appendChild(h('div', { style: 'font-weight: 600;' }, opt.label));
          textDiv.appendChild(h('div', { style: 'font-size: var(--text-sm); color: var(--text-muted);' }, opt.desc));
          exportBtn.appendChild(textDiv);
          exportSection.appendChild(exportBtn);
        });
        
        modalBody.appendChild(exportSection);

        // Backups Section (v1.0.0)
        const backupsSection = h('div', { style: 'margin-bottom: var(--space-2xl); padding-bottom: var(--space-xl); border-bottom: 1px solid var(--border);' });
        backupsSection.appendChild(h('div', {
          style: 'font-weight: 700; margin-bottom: var(--space-md); font-size: var(--text-lg);'
        }, 'Manual Backups'));

        backupsSection.appendChild(h('p', {
          style: 'margin-bottom: var(--space-lg); color: var(--text-secondary); font-size: var(--text-sm);'
        }, 'Create timestamped backups of your entire dataset. Backups are downloaded as JSON files that you can restore later.'));

        const createBackupBtn = h('button', {
          className: 'btn btn-primary',
          style: 'width: 100%; padding: var(--space-lg); margin-bottom: var(--space-lg);',
          onclick: function() {
            const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
            const backupName = 'cardspoke-backup-' + timestamp + '.json';
            const backupData = JSON.stringify(store, null, 2);
            downloadWithFeedback(backupData, backupName, 'application/json');

            // Store backup record in localStorage
            const backups = JSON.parse(localStorage.getItem('cardspoke_backups') || '[]');
            backups.unshift({
              timestamp: Date.now(),
              name: backupName,
              cardCount: Object.keys(store.cards || {}).length,
              size: Math.round(backupData.length / 1024)
            });
            // Keep only last 10 backup records
            if (backups.length > 10) backups.length = 10;
            localStorage.setItem('cardspoke_backups', JSON.stringify(backups));

            showToast('Backup created: ' + backupName);
            // Refresh the modal
            overlay.remove();
            setTimeout(() => showDataHub(), 100);
          }
        }, '💾 Create Backup Now');
        backupsSection.appendChild(createBackupBtn);

        // Show recent backups list
        const backups = JSON.parse(localStorage.getItem('cardspoke_backups') || '[]');
        if (backups.length > 0) {
          backupsSection.appendChild(h('div', {
            style: 'font-weight: 600; margin-bottom: var(--space-sm); font-size: var(--text-sm);'
          }, 'Recent Backups:'));

          const backupsList = h('div', { style: 'background: var(--bg-secondary); padding: var(--space-md); border-radius: var(--radius); border: 1px solid var(--border);' });
          backups.slice(0, 5).forEach(function(backup) {
            const backupItem = h('div', {
              style: 'padding: var(--space-sm) 0; border-bottom: 1px solid var(--border); font-size: var(--text-sm);'
            });
            const date = new Date(backup.timestamp);
            backupItem.appendChild(h('div', { style: 'font-weight: 600;' }, backup.name));
            backupItem.appendChild(h('div', { style: 'color: var(--text-secondary); font-size: 12px;' },
              date.toLocaleString() + ' • ' + backup.cardCount + ' cards • ' + backup.size + ' KB'
            ));
            backupsList.appendChild(backupItem);
          });
          backupsSection.appendChild(backupsList);
        }

        modalBody.appendChild(backupsSection);

        // Cloud Storage Section
        const cloudSection = h('div', { style: 'margin-bottom: var(--space-2xl); padding-bottom: var(--space-xl); border-bottom: 1px solid var(--border);' });
        cloudSection.appendChild(h('div', {
          style: 'font-weight: 700; margin-bottom: var(--space-md); font-size: var(--text-lg);'
        }, '☁️ Cloud Storage Sync'));

        cloudSection.appendChild(h('p', {
          style: 'margin-bottom: var(--space-lg); color: var(--text-secondary); font-size: var(--text-sm);'
        }, 'Sync your data across devices using your own cloud storage accounts. Click to connect and create a synced dataset.'));

        // Google Drive button
        const googleDriveBtn = h('button', {
          className: 'btn',
          style: 'width: 100%; padding: var(--space-lg); margin-bottom: var(--space-md); border: 1px solid var(--border); border-radius: var(--radius); display: flex; align-items: center; gap: var(--space-md); background: #fff; color: #333;',
          onclick: async function() {
            const name = prompt('Enter a name for this dataset:', 'Google Drive Dataset');
            if (!name) return;

            try {
              showToast('Connecting to Google Drive...', 'info');
              const driver = new GoogleDriveDriver();
              await driver.init({});
              await driver.ensureAuthenticated();
              showToast('✓ Connected to Google Drive!', 'success');

              // Store as the active dataset with Google Drive storage type
              const newKey = 'cardspoke_googledrive_' + Date.now();
              localStorage.setItem('activeInstance', newKey);
              instanceKey = newKey;
              store = {
                rootOrder: [],
                cards: {},
                mods: {},
                bookmarks: [],
                recentCards: [],
                viewMode: 'normal',
                activeTheme: 'light',
                metadata: {
                  name: name,
                  storageType: 'googledrive',
                  createdAt: Date.now()
                }
              };
              save();
              render();
              overlay.remove();
              showToast('Dataset created with Google Drive sync!');
            } catch (error) {
              showToast('Failed to connect: ' + error.message, 'error');
            }
          }
        });
        googleDriveBtn.appendChild(h('span', { style: 'font-size: 24px;' }, '🔵'));
        const googleText = h('div', { style: 'flex: 1; text-align: left;' });
        googleText.appendChild(h('div', { style: 'font-weight: 600;' }, 'Google Drive'));
        googleText.appendChild(h('div', { style: 'font-size: var(--text-sm); color: var(--text-muted);' }, 'Sign in with your Google account'));
        googleDriveBtn.appendChild(googleText);
        cloudSection.appendChild(googleDriveBtn);

        // OneDrive button
        const oneDriveBtn = h('button', {
          className: 'btn',
          style: 'width: 100%; padding: var(--space-lg); margin-bottom: var(--space-md); border: 1px solid var(--border); border-radius: var(--radius); display: flex; align-items: center; gap: var(--space-md); background: #0078d4; color: #fff;',
          onclick: async function() {
            const name = prompt('Enter a name for this dataset:', 'OneDrive Dataset');
            if (!name) return;

            try {
              showToast('Connecting to OneDrive...', 'info');
              const driver = new OneDriveDriver();
              await driver.init({});
              await driver.ensureAuthenticated();
              showToast('✓ Connected to OneDrive!', 'success');

              // Store as the active dataset with OneDrive storage type
              const newKey = 'cardspoke_onedrive_' + Date.now();
              localStorage.setItem('activeInstance', newKey);
              instanceKey = newKey;
              store = {
                rootOrder: [],
                cards: {},
                mods: {},
                bookmarks: [],
                recentCards: [],
                viewMode: 'normal',
                activeTheme: 'light',
                metadata: {
                  name: name,
                  storageType: 'onedrive',
                  createdAt: Date.now()
                }
              };
              save();
              render();
              overlay.remove();
              showToast('Dataset created with OneDrive sync!');
            } catch (error) {
              showToast('Failed to connect: ' + error.message, 'error');
            }
          }
        });
        oneDriveBtn.appendChild(h('span', { style: 'font-size: 24px;' }, '📘'));
        const onedriveText = h('div', { style: 'flex: 1; text-align: left;' });
        onedriveText.appendChild(h('div', { style: 'font-weight: 600;' }, 'OneDrive'));
        onedriveText.appendChild(h('div', { style: 'font-size: var(--text-sm); opacity: 0.9;' }, 'Sign in with your Microsoft account'));
        oneDriveBtn.appendChild(onedriveText);
        cloudSection.appendChild(oneDriveBtn);

        modalBody.appendChild(cloudSection);

        // WebDAV Helper Section
        const webdavSection = h('div', { style: 'margin-bottom: var(--space-2xl); padding-bottom: var(--space-xl); border-bottom: 1px solid var(--border);' });
        webdavSection.appendChild(h('div', {
          style: 'font-weight: 700; margin-bottom: var(--space-md); font-size: var(--text-lg);'
        }, '☁️ Self-Hosted Storage (WebDAV)'));

        webdavSection.appendChild(h('p', {
          style: 'margin-bottom: var(--space-lg); color: var(--text-secondary); font-size: var(--text-sm);'
        }, 'Connect to your own WebDAV server (Nextcloud, ownCloud, or any WebDAV-compatible storage) to keep your data on infrastructure you control.'));

        // Info box
        const webdavInfo = h('div', {
          style: 'background: var(--bg-secondary); padding: var(--space-lg); border-radius: var(--radius); border: 1px solid var(--border); margin-bottom: var(--space-lg);'
        });

        webdavInfo.appendChild(h('div', {
          style: 'font-weight: 600; margin-bottom: var(--space-sm);'
        }, 'What you\'ll need:'));

        const requirements = [
          'WebDAV server URL (e.g., https://cloud.example.com/remote.php/webdav/)',
          'Username for your WebDAV account',
          'Password or app-specific token',
          'CORS configured on your server (if using from browser)'
        ];

        requirements.forEach(function(req) {
          const item = h('div', {
            style: 'padding: var(--space-xs) 0; color: var(--text-secondary); font-size: var(--text-sm);'
          }, '• ' + req);
          webdavInfo.appendChild(item);
        });

        webdavSection.appendChild(webdavInfo);

        // CORS warning
        const corsWarning = h('div', {
          style: 'background: #fff3cd; border: 1px solid #ffc107; padding: var(--space-md); border-radius: var(--radius); margin-bottom: var(--space-lg); font-size: var(--text-sm);'
        });
        corsWarning.appendChild(h('div', {
          style: 'font-weight: 600; margin-bottom: var(--space-xs);'
        }, '⚠️ CORS Configuration Required'));
        corsWarning.appendChild(h('div', {}, 'For browser access, your WebDAV server must allow CORS requests. Add these headers to your server:'));
        corsWarning.appendChild(h('pre', {
          style: 'background: rgba(0,0,0,0.1); padding: var(--space-sm); margin-top: var(--space-sm); border-radius: var(--radius); overflow-x: auto; font-size: 12px;'
        }, 'Access-Control-Allow-Origin: *\nAccess-Control-Allow-Methods: GET, PUT, DELETE\nAccess-Control-Allow-Headers: Authorization, Content-Type'));
        webdavSection.appendChild(corsWarning);

        // Create WebDAV dataset button
        const createWebDAVBtn = h('button', {
          className: 'btn btn-primary',
          style: 'width: 100%; padding: var(--space-lg);',
          onclick: function() {
            overlay.remove();
            setTimeout(() => showDatasetManager(), 100);
          }
        }, '+ Create WebDAV Dataset');
        webdavSection.appendChild(createWebDAVBtn);

        modalBody.appendChild(webdavSection);

        // Dataset Management Section
        const manageSection = h('div', {});
        manageSection.appendChild(h('div', { 
          style: 'font-weight: 700; margin-bottom: var(--space-lg); font-size: var(--text-lg);'
        }, 'Dataset Management'));
        
        // Description
        manageSection.appendChild(h('p', {
          style: 'margin-bottom: var(--space-lg); color: var(--text-muted); font-size: var(--text-sm);'
        }, 'Create new datasets to organize different types of content separately, or switch between existing datasets.'));
        
        // Create new dataset button
        const createDatasetBtn = h('button', {
          className: 'btn btn-primary',
          style: 'width: 100%; padding: var(--space-lg); margin-bottom: var(--space-lg);',
          onclick: function() {
            const newName = prompt('Enter name for new dataset:', 'New Dataset');
            if (newName && newName.trim()) {
              // Create a new instance key for the dataset using uid() for better uniqueness
              const newKey = 'cardspoke_' + uid();
              // Save current store before switching
              save(true);
              // Store the dataset name mapping
              const datasets = JSON.parse(localStorage.getItem('cardspoke_datasets') || '{}');
              datasets[newKey] = {
                name: newName.trim(),
                createdAt: Date.now()
              };
              // Add current dataset if not already tracked
              if (!datasets[instanceKey]) {
                datasets[instanceKey] = {
                  name: (store.metadata && store.metadata.name) || 'Default',
                  createdAt: Date.now()
                };
              }
              localStorage.setItem('cardspoke_datasets', JSON.stringify(datasets));
              // Switch to the new dataset
              instanceKey = newKey;
              localStorage.setItem('activeInstance', newKey);
              // Create fresh store for new dataset
              store = createDefaultStore();
              store.metadata = { name: newName.trim(), createdAt: Date.now() };
              save(true);
              showToast('Created and switched to dataset: ' + newName.trim());
              overlay.remove();
              render();
            }
          }
        }, '➕ Create New Dataset');
        manageSection.appendChild(createDatasetBtn);
        
        // List existing datasets
        const datasets = JSON.parse(localStorage.getItem('cardspoke_datasets') || '{}');
        // Ensure current dataset is in the list
        if (!datasets[instanceKey]) {
          datasets[instanceKey] = {
            name: (store.metadata && store.metadata.name) || 'Default',
            createdAt: Date.now()
          };
          localStorage.setItem('cardspoke_datasets', JSON.stringify(datasets));
        }
        
        const datasetKeys = Object.keys(datasets);
        if (datasetKeys.length > 0) {
          manageSection.appendChild(h('div', {
            style: 'font-weight: 600; margin-bottom: var(--space-sm); font-size: var(--text-sm);'
          }, 'Available Datasets:'));
          
          const datasetList = h('div', { 
            style: 'background: var(--bg-secondary); padding: var(--space-md); border-radius: var(--radius); border: 1px solid var(--border); margin-bottom: var(--space-lg);' 
          });
          
          datasetKeys.forEach(function(key) {
            const dataset = datasets[key];
            const isActive = key === instanceKey;
            const datasetItem = h('div', {
              style: 'padding: var(--space-sm); border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;' + (isActive ? ' background: var(--bg-tertiary, rgba(0,0,0,0.05));' : '')
            });
            
            const datasetInfo = h('div', {});
            datasetInfo.appendChild(h('div', { style: 'font-weight: 600;' }, (isActive ? '✓ ' : '') + (dataset.name || key)));
            if (dataset.createdAt) {
              datasetInfo.appendChild(h('div', { style: 'font-size: 12px; color: var(--text-muted);' }, 
                'Created: ' + new Date(dataset.createdAt).toLocaleDateString()));
            }
            datasetItem.appendChild(datasetInfo);
            
            if (!isActive) {
              const switchBtn = h('button', {
                className: 'btn btn-primary',
                style: 'font-size: var(--text-sm); padding: var(--space-xs) var(--space-md);',
                onclick: function() {
                  // Save current store before switching
                  save(true);
                  // Switch to the selected dataset
                  instanceKey = key;
                  localStorage.setItem('activeInstance', key);
                  // Load the new store
                  load();
                  showToast('Switched to dataset: ' + (dataset.name || key));
                  overlay.remove();
                  render();
                }
              }, 'Switch');
              datasetItem.appendChild(switchBtn);
            }
            
            datasetList.appendChild(datasetItem);
          });
          
          manageSection.appendChild(datasetList);
        }
        
        // Rename current dataset button
        const renameBtn = h('button', {
          className: 'btn',
          style: 'margin-right: var(--space-md);',
          onclick: function() {
            editDatasetName();
            overlay.remove();
          }
        }, 'Rename Current Dataset');
        manageSection.appendChild(renameBtn);
        
        modalBody.appendChild(manageSection);
        
        modal.appendChild(modalBody);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        trapFocus(modal);
        
        overlay.onclick = function(e) {
          if (e.target === overlay) overlay.remove();
        };
      }

      function showModsManager() {
        const overlay = h('div', { className: 'modal-overlay show' });
        const modal = h('div', { className: 'modal' });
        const modalHeader = h('div', { className: 'modal-header' });
        modalHeader.appendChild(h('div', { className: 'modal-title' }, 'Extension Manager'));
        const closeBtn = h('button', { className: 'modal-close', onclick: () => overlay.remove() }, '✕');
        modalHeader.appendChild(closeBtn);
        modal.appendChild(modalHeader);
        const modalBody = h('div', { className: 'modal-body' });
        
        const modList = Object.entries(store.mods).map(([modId, modData]) => {
          const meta = modData.meta || {};
          const modItem = h('div', { style: 'padding: var(--space-lg); border: 1px solid var(--border); margin-bottom: var(--space-md);' });
          const modHeader = h('div', { style: 'display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-sm);' });
          const headerLeft = h('div', { style: 'display: flex; align-items: center; gap: var(--space-sm);' });
          headerLeft.appendChild(h('div', { style: 'font-weight: 700;' }, meta.name || modId));
          // Add type badge if type is specified
          if (meta.type) {
            const badgeClass = 'ext-badge ext-' + (meta.type.toLowerCase());
            const badge = h('span', { className: badgeClass }, meta.type);
            headerLeft.appendChild(badge);
          }
          // Add official/community source badge (v0.12.2)
          if (meta.source) {
            const sourceBadge = h('span', { 
              className: 'ext-badge ext-badge-' + (meta.source === 'official' ? 'official' : 'community')
            }, meta.source === 'official' ? '✓ Official' : 'Community');
            headerLeft.appendChild(sourceBadge);
          }
          modHeader.appendChild(headerLeft);
          const toggleBtn = h('button', {
            className: modData.enabled ? 'btn btn-danger' : 'btn btn-primary',
            onclick: () => {
              if (modData.enabled) CardSpoke_MODS.disable(modId);
              else CardSpoke_MODS.enable(modId);
              overlay.remove();
              showModsManager();
            }
          }, modData.enabled ? 'Disable' : 'Enable');
          modHeader.appendChild(toggleBtn);
          modItem.appendChild(modHeader);
          
          // *** ADDED: Display new mod metadata ***
          if (meta.version) {
            modItem.appendChild(h('div', { style: 'color: var(--text-muted); font-size: var(--text-sm);' }, `Version: ${meta.version}`));
          }
          if (meta.creator) {
            modItem.appendChild(h('div', { style: 'color: var(--text-muted); font-size: var(--text-sm);' }, `By: ${meta.creator}`));
          }
           if (meta.releaseDate) {
            modItem.appendChild(h('div', { style: 'color: var(--text-muted); font-size: var(--text-sm);' }, `Date: ${meta.releaseDate}`));
          }
          if (meta.description) {
            modItem.appendChild(h('div', { style: 'color: var(--text-muted); font-size: var(--text-sm); margin-top: var(--space-sm);' }, meta.description));
          }
          // Show AI assistants if specified (v0.12.2)
          if (meta.ai_assistants) {
            modItem.appendChild(h('div', { style: 'color: var(--text-muted); font-size: var(--text-sm); font-style: italic;' }, 
              'AI: ' + meta.ai_assistants));
          }
          
          const deleteBtn = h('button', {
            className: 'btn btn-danger',
            style: 'font-size: var(--text-sm); margin-top: var(--space-md);',
            onclick: () => {
              if (confirm(`Delete extension "${meta.name || modId}"?`)) {
                CardSpoke_MODS.disable(modId);
                delete store.mods[modId];
                save();
                overlay.remove();
                showModsManager();
              }
            }
          }, 'Delete');
          modItem.appendChild(deleteBtn);
          return modItem;
        });
        
        if (modList.length === 0) {
          modalBody.appendChild(h('div', { className: 'empty' }, 'No extensions installed'));
        } else {
          modList.forEach(item => modalBody.appendChild(item));
        }
        modal.appendChild(modalBody);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
      }


      /**
       * Show Extension Wizard
       * Interactive wizard for creating new extensions
       */
      function showExtensionWizard() {
        const overlay = h('div', { className: 'modal-overlay show' });
        const modal = h('div', { className: 'modal', style: 'max-width: 700px;' });
        const modalHeader = h('div', { className: 'modal-header' });
        modalHeader.appendChild(h('div', { className: 'modal-title' }, 'Extension Wizard'));
        const closeBtn = h('button', { className: 'modal-close', onclick: () => overlay.remove() }, '✕');
        modalHeader.appendChild(closeBtn);
        modal.appendChild(modalHeader);
        
        const modalBody = h('div', { className: 'modal-body' });
        
        // Introduction
        modalBody.appendChild(h('div', { style: 'margin-bottom: var(--space-xl); font-size: var(--text-base);' }, 
          'Create a new extension using our guided wizard. Choose a type, configure metadata, and get started with a working template.'));
        
        // Step 1: Extension Type Selection
        const typeSection = h('div', { style: 'margin-bottom: var(--space-xl);' });
        typeSection.appendChild(h('div', { 
          style: 'font-weight: 700; margin-bottom: var(--space-md); font-size: var(--text-lg);'
        }, 'Step 1: Choose Extension Type'));
        
        const types = [
          { value: 'theme', label: 'Theme', desc: 'Custom CSS styling for CardSpoke UI', icon: '' },
          { value: 'patch', label: 'Patch', desc: 'Small modifications or enhancements', icon: '' },
          { value: 'plugin', label: 'Plugin', desc: 'Add new functionality with JavaScript hooks', icon: '' },
          { value: 'mod', label: 'Mod', desc: 'Comprehensive modifications (CSS + JS)', icon: '' },
          { value: 'kit', label: 'Kit', desc: 'Bundle of related extensions (themes + plugins)', icon: '' },
          { value: 'expansion', label: 'Expansion', desc: 'Major feature additions and overhauls', icon: '' }
        ];
        
        let selectedType = 'plugin';
        const typeButtons = [];
        
        types.forEach(type => {
          const btn = h('button', {
            className: 'wizard-type-btn',
            style: `
              display: block;
              width: 100%;
              padding: var(--space-lg);
              margin-bottom: var(--space-sm);
              border: 2px solid var(--border);
              background: var(--bg-primary);
              text-align: left;
              cursor: pointer;
              border-radius: 4px;
              transition: all 0.2s;
            `,
            onclick: () => {
              selectedType = type.value;
              typeButtons.forEach(b => b.style.borderColor = 'var(--border)');
              btn.style.borderColor = 'var(--primary)';
            }
          });
          
          const header = h('div', { style: 'display: flex; align-items: center; gap: var(--space-sm); margin-bottom: var(--space-xs);' });
          header.appendChild(h('span', { style: 'font-size: 24px;' }, type.icon));
          header.appendChild(h('span', { style: 'font-weight: 600; font-size: var(--text-lg);' }, type.label));
          btn.appendChild(header);
          btn.appendChild(h('div', { style: 'color: var(--text-muted); font-size: var(--text-sm); margin-left: 32px;' }, type.desc));
          
          if (type.value === selectedType) {
            btn.style.borderColor = 'var(--primary)';
          }
          
          typeButtons.push(btn);
          typeSection.appendChild(btn);
        });
        
        modalBody.appendChild(typeSection);
        
        // Step 2: Extension Metadata
        const metaSection = h('div', { style: 'margin-bottom: var(--space-xl);' });
        metaSection.appendChild(h('div', { 
          style: 'font-weight: 700; margin-bottom: var(--space-md); font-size: var(--text-lg);'
        }, 'Step 2: Extension Details'));
        
        const form = h('div', { style: 'display: flex; flex-direction: column; gap: var(--space-lg);' });
        
        // Extension Name
        const nameGroup = h('div', {});
        nameGroup.appendChild(h('label', { style: 'display: block; margin-bottom: var(--space-xs); font-weight: 600;' }, 'Extension Name *'));
        const nameInput = h('input', {
          type: 'text',
          placeholder: 'My Awesome Extension',
          style: `
            width: 100%;
            padding: var(--space-md);
            border: 1px solid var(--border);
            border-radius: 4px;
            background: var(--bg-primary);
            color: var(--text-primary);
            font-size: 1rem;
          `
        });
        nameGroup.appendChild(nameInput);
        form.appendChild(nameGroup);
        
        // Extension ID
        const idGroup = h('div', {});
        idGroup.appendChild(h('label', { style: 'display: block; margin-bottom: var(--space-xs); font-weight: 600;' }, 'Extension ID *'));
        idGroup.appendChild(h('div', { style: 'font-size: var(--text-sm); color: var(--text-muted); margin-bottom: var(--space-xs);' }, 
          'Unique identifier (lowercase, no spaces, e.g., "my-extension")'));
        const idInput = h('input', {
          type: 'text',
          placeholder: 'my-extension',
          style: `
            width: 100%;
            padding: var(--space-md);
            border: 1px solid var(--border);
            border-radius: 4px;
            background: var(--bg-primary);
            color: var(--text-primary);
            font-size: 1rem;
          `
        });
        idGroup.appendChild(idInput);
        form.appendChild(idGroup);
        
        // Creator Name
        const creatorGroup = h('div', {});
        creatorGroup.appendChild(h('label', { style: 'display: block; margin-bottom: var(--space-xs); font-weight: 600;' }, 'Your Name'));
        const creatorInput = h('input', {
          type: 'text',
          placeholder: 'Your Name',
          style: `
            width: 100%;
            padding: var(--space-md);
            border: 1px solid var(--border);
            border-radius: 4px;
            background: var(--bg-primary);
            color: var(--text-primary);
            font-size: 1rem;
          `
        });
        creatorGroup.appendChild(creatorInput);
        form.appendChild(creatorGroup);
        
        // Description
        const descGroup = h('div', {});
        descGroup.appendChild(h('label', { style: 'display: block; margin-bottom: var(--space-xs); font-weight: 600;' }, 'Description'));
        const descInput = h('textarea', {
          placeholder: 'Brief description of what your extension does...',
          rows: 3,
          style: `
            width: 100%;
            padding: var(--space-md);
            border: 1px solid var(--border);
            border-radius: 4px;
            background: var(--bg-primary);
            color: var(--text-primary);
            font-size: 1rem;
            resize: vertical;
          `
        });
        descGroup.appendChild(descInput);
        form.appendChild(descGroup);
        
        // AI Assistants Field (v0.12.2 - Spec Compliance §2.5)
        const aiGroup = h('div', {});
        aiGroup.appendChild(h('label', { style: 'display: block; margin-bottom: var(--space-xs); font-weight: 600;' }, 'AI Assistants Used (Optional)'));
        aiGroup.appendChild(h('div', { style: 'font-size: var(--text-sm); color: var(--text-muted); margin-bottom: var(--space-xs);' }, 
          'List any AI tools used to create this extension (e.g., "GitHub Copilot, ChatGPT")'));
        const aiInput = h('input', {
          type: 'text',
          placeholder: 'e.g., GitHub Copilot, ChatGPT',
          style: `
            width: 100%;
            padding: var(--space-md);
            border: 1px solid var(--border);
            border-radius: 4px;
            background: var(--bg-primary);
            color: var(--text-primary);
            font-size: 1rem;
          `
        });
        aiGroup.appendChild(aiInput);
        form.appendChild(aiGroup);
        
        // Official/Community Toggle (v0.12.2 - Spec Compliance §2.5)
        const sourceGroup = h('div', { style: 'margin-top: var(--space-md);' });
        const sourceLabel = h('label', { 
          style: 'display: flex; align-items: center; gap: var(--space-sm); cursor: pointer;'
        });
        const sourceCheck = h('input', { type: 'checkbox' });
        sourceLabel.appendChild(sourceCheck);
        sourceLabel.appendChild(document.createTextNode('This is an official CardSpoke extension'));
        sourceGroup.appendChild(sourceLabel);
        sourceGroup.appendChild(h('div', { style: 'font-size: var(--text-sm); color: var(--text-muted); margin-left: 24px;' }, 
          'Check if this extension is from the CardSpoke team (leave unchecked for community extensions)'));
        form.appendChild(sourceGroup);
        
        metaSection.appendChild(form);
        modalBody.appendChild(metaSection);
        
        // Action Buttons
        const actions = h('div', { style: 'display: flex; gap: var(--space-md); justify-content: flex-end; margin-top: var(--space-xl);' });
        
        const cancelBtn = h('button', {
          className: 'btn',
          onclick: () => overlay.remove()
        }, 'Cancel');
        
        const generateBtn = h('button', {
          className: 'btn btn-primary',
          onclick: () => {
            const name = nameInput.value.trim();
            const id = idInput.value.trim();
            const creator = creatorInput.value.trim() || 'Anonymous';
            const description = descInput.value.trim();
            const aiAssistants = aiInput.value.trim();
            const isOfficial = sourceCheck.checked;
            
            if (!name) {
              showToast('Please enter an extension name', 'error');
              return;
            }
            if (!id) {
              showToast('Please enter an extension ID', 'error');
              return;
            }
            if (!/^[a-z0-9-]+$/.test(id)) {
              showToast('Extension ID must be lowercase letters, numbers, and hyphens only', 'error');
              return;
            }
            if (store.mods[id]) {
              showToast('An extension with this ID already exists', 'error');
              return;
            }
            
            generateExtensionTemplate(id, name, creator, description, selectedType, overlay, aiAssistants, isOfficial);
          }
        }, 'Generate Extension');
        
        actions.appendChild(cancelBtn);
        actions.appendChild(generateBtn);
        modalBody.appendChild(actions);
        
        modal.appendChild(modalBody);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
      }
      
      /**
       * Generate extension template code
       */
      function generateExtensionTemplate(id, name, creator, description, type, wizardOverlay, aiAssistants = '', isOfficial = false) {
        const today = new Date().toISOString().split('T')[0];
        
        // Generate JavaScript template based on type
        let jsTemplate = '';
        
        if (type === 'theme') {
          jsTemplate = `// ${name} - Theme Extension
// Created: ${today}

(function() {
  'use strict';
  
  // Theme extensions primarily use CSS
  // This file can be left minimal or used for dynamic theme switching
  
  CardSpoke_MODS.register('${id}', {
    meta: {
      name: '${name}',
      type: 'Theme',
      creator: '${creator}',
      version: '1.0.0',
      releaseDate: '${today}',
      description: '${description || 'A custom theme for CardSpoke'}',
      source: '${isOfficial ? 'official' : 'community'}',
      ai_assistants: '${aiAssistants || ''}'
    },
    onAppInit(ctx) {
      console.log('[${id}] Theme loaded');
    }
  });
})();`;
        } else if (type === 'patch') {
          jsTemplate = `// ${name} - Patch Extension
// Created: ${today}

(function() {
  'use strict';
  
  CardSpoke_MODS.register('${id}', {
    meta: {
      name: '${name}',
      type: 'Patch',
      creator: '${creator}',
      version: '1.0.0',
      releaseDate: '${today}',
      description: '${description || 'A small enhancement to CardSpoke'}',
      source: '${isOfficial ? 'official' : 'community'}',
      ai_assistants: '${aiAssistants || ''}'
    },
    onAppInit(ctx) {
      console.log('[${id}] Patch loaded');
      // Add your initialization code here
    },
    onCardRender(ctx, card, element) {
      // Called when a card is rendered
      // Modify the element or card display here
    }
  });
})();`;
        } else {
          // Plugin, Mod, or Expansion
          jsTemplate = `// ${name} - ${type.charAt(0).toUpperCase() + type.slice(1)} Extension
// Created: ${today}

(function() {
  'use strict';
  
  CardSpoke_MODS.register('${id}', {
    meta: {
      name: '${name}',
      type: '${type.charAt(0).toUpperCase() + type.slice(1)}',
      creator: '${creator}',
      version: '1.0.0',
      releaseDate: '${today}',
      description: '${description || 'A custom extension for CardSpoke'}',
      source: '${isOfficial ? 'official' : 'community'}',
      ai_assistants: '${aiAssistants || ''}'
    },
    onAppInit(ctx) {
      console.log('[${id}] Extension loaded');
      console.log('App Version:', ctx.appVersion);
      console.log('Available API:', ctx.api);
      
      // Example: Use CardSpoke.utils API
      // const meta = await CardSpoke.utils.getDatasetMeta();
      // console.log('Dataset info:', meta);
    },
    onCardSave(ctx, card, changes) {
      // Called when a card is saved
      // console.log('[${id}] Card saved:', card.id);
    },
    onCardDelete(ctx, card) {
      // Called when a card is deleted
      // console.log('[${id}] Card deleted:', card.id);
    },
    onCardRender(ctx, card, element) {
      // Called when a card is rendered
      // Modify the element appearance or add interactivity
    }
  });
})();`;
        }
        
        // Generate CSS template
        let cssTemplate = `/* ${name} - Styles */
/* Created: ${today} */

/* Add your custom styles here */
/* Example:
.card {
  border-color: #your-color;
}
*/
`;
        
        // Show generated code in a new modal
        if (wizardOverlay) wizardOverlay.remove();
        
        const overlay = h('div', { className: 'modal-overlay show' });
        const modal = h('div', { className: 'modal', style: 'max-width: 900px;' });
        const modalHeader = h('div', { className: 'modal-header' });
        modalHeader.appendChild(h('div', { className: 'modal-title' }, `Extension Generated: ${name}`));
        const closeBtn = h('button', { className: 'modal-close', onclick: () => overlay.remove() }, '✕');
        modalHeader.appendChild(closeBtn);
        modal.appendChild(modalHeader);
        
        const modalBody = h('div', { className: 'modal-body' });
        
        modalBody.appendChild(h('div', { style: 'margin-bottom: var(--space-lg); color: var(--text-muted);' }, 
          'Your extension template has been generated! You can now install it directly or download the code to customize further.'));
        
        // JavaScript Code
        modalBody.appendChild(h('div', { style: 'font-weight: 600; margin-bottom: var(--space-sm);' }, 'JavaScript Code:'));
        const jsCodeArea = h('textarea', {
          readonly: true,
          rows: 15,
          style: `
            width: 100%;
            padding: var(--space-md);
            border: 1px solid var(--border);
            border-radius: 4px;
            background: var(--bg-secondary);
            color: var(--text-primary);
            font-family: monospace;
            font-size: 0.875rem;
            margin-bottom: var(--space-lg);
            resize: vertical;
          `
        }, jsTemplate);
        modalBody.appendChild(jsCodeArea);
        
        // CSS Code
        modalBody.appendChild(h('div', { style: 'font-weight: 600; margin-bottom: var(--space-sm);' }, 'CSS Code (Optional):'));
        const cssCodeArea = h('textarea', {
          readonly: true,
          rows: 8,
          style: `
            width: 100%;
            padding: var(--space-md);
            border: 1px solid var(--border);
            border-radius: 4px;
            background: var(--bg-secondary);
            color: var(--text-primary);
            font-family: monospace;
            font-size: 0.875rem;
            margin-bottom: var(--space-lg);
            resize: vertical;
          `
        }, cssTemplate);
        modalBody.appendChild(cssCodeArea);
        
        // Actions
        const actions = h('div', { style: 'display: flex; gap: var(--space-md); justify-content: flex-end;' });
        
        const downloadBtn = h('button', {
          className: 'btn',
          onclick: () => {
            const content = JSON.stringify({
              id,
              meta: {
                name,
                type: type.charAt(0).toUpperCase() + type.slice(1),
                creator,
                version: '1.0.0',
                releaseDate: today,
                description: description || `A custom ${type} for CardSpoke`,
                source: isOfficial ? 'official' : 'community',
                ai_assistants: aiAssistants || ''
              },
              js: jsTemplate,
              css: cssTemplate,
              enabled: false
            }, null, 2);
            
            const blob = new Blob([content], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${id}.json`;
            a.click();
            URL.revokeObjectURL(url);
            
            showToast('Extension downloaded!', 'success');
          }
        }, 'Download JSON');
        
        const installBtn = h('button', {
          className: 'btn btn-primary',
          onclick: () => {
            store.mods[id] = {
              meta: {
                name,
                type: type.charAt(0).toUpperCase() + type.slice(1),
                creator,
                version: '1.0.0',
                releaseDate: today,
                description: description || `A custom ${type} for CardSpoke`,
                source: isOfficial ? 'official' : 'community',
                ai_assistants: aiAssistants || ''
              },
              js: jsTemplate,
              css: cssTemplate,
              enabled: false
            };
            
            save();
            overlay.remove();
            showToast(`Extension "${name}" installed! Enable it in the Extensions Manager.`, 'success');
          }
        }, 'Install Extension');
        
        actions.appendChild(downloadBtn);
        actions.appendChild(installBtn);
        modalBody.appendChild(actions);
        
        modal.appendChild(modalBody);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
      }


      /**
       * Show Extension Playground
       * Sandboxed environment for testing extension code
       */
      function showPlayground() {
        const overlay = h('div', { className: 'modal-overlay show' });
        const modal = h('div', { className: 'modal', style: 'max-width: 1200px; max-height: 90vh;' });
        const modalHeader = h('div', { className: 'modal-header' });
        modalHeader.appendChild(h('div', { className: 'modal-title' }, 'Extension Playground'));
        const closeBtn = h('button', { className: 'modal-close', onclick: () => overlay.remove() }, '✕');
        modalHeader.appendChild(closeBtn);
        modal.appendChild(modalHeader);
        
        const modalBody = h('div', { className: 'modal-body', style: 'padding: 0; display: flex; flex-direction: column; height: calc(90vh - 60px);' });
        
        // Toolbar
        const toolbar = h('div', { 
          style: `
            padding: var(--space-md);
            border-bottom: 1px solid var(--border);
            background: var(--bg-secondary);
            display: flex;
            gap: var(--space-md);
            align-items: center;
          `
        });
        
        const runBtn = h('button', {
          className: 'btn btn-primary',
          style: 'font-weight: 600;',
          onclick: () => runPlaygroundCode()
        }, 'Run Code');
        
        const clearBtn = h('button', {
          className: 'btn',
          onclick: () => {
            if (confirm('Clear all code and console output?')) {
              playgroundEditor.value = getPlaygroundTemplate();
              playgroundConsole.innerHTML = '';
            }
          }
        }, 'Clear');
        
        const templateBtn = h('button', {
          className: 'btn',
          onclick: () => {
            playgroundEditor.value = getPlaygroundTemplate();
            showToast('Template loaded', 'info');
          }
        }, 'Load Template');
        
        toolbar.appendChild(runBtn);
        toolbar.appendChild(clearBtn);
        toolbar.appendChild(templateBtn);
        toolbar.appendChild(h('div', { style: 'flex: 1;' })); // Spacer
        toolbar.appendChild(h('div', { style: 'color: var(--text-muted); font-size: var(--text-sm);' }, 
          'Tip: Use CardSpoke.utils API for safe data access'));
        
        modalBody.appendChild(toolbar);
        
        // Split view: Editor (left) and Console (right)
        const splitView = h('div', { 
          style: `
            flex: 1;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1px;
            background: var(--border);
            overflow: hidden;
          `
        });
        
        // Editor Panel
        const editorPanel = h('div', { 
          style: `
            background: var(--bg-primary);
            display: flex;
            flex-direction: column;
            overflow: hidden;
          `
        });
        
        editorPanel.appendChild(h('div', { 
          style: `
            padding: var(--space-sm) var(--space-md);
            background: var(--bg-secondary);
            font-weight: 600;
            border-bottom: 1px solid var(--border);
          `
        }, 'JavaScript Editor'));
        
        const playgroundEditor = h('textarea', {
          id: 'playgroundEditor',
          placeholder: 'Write your extension code here...',
          style: `
            flex: 1;
            padding: var(--space-md);
            border: none;
            background: var(--bg-primary);
            color: var(--text-primary);
            font-family: 'Courier New', monospace;
            font-size: 0.875rem;
            line-height: 1.5;
            resize: none;
            overflow: auto;
          `
        }, getPlaygroundTemplate());
        
        editorPanel.appendChild(playgroundEditor);
        splitView.appendChild(editorPanel);
        
        // Console Panel
        const consolePanel = h('div', { 
          style: `
            background: var(--bg-primary);
            display: flex;
            flex-direction: column;
            overflow: hidden;
          `
        });
        
        consolePanel.appendChild(h('div', { 
          style: `
            padding: var(--space-sm) var(--space-md);
            background: var(--bg-secondary);
            font-weight: 600;
            border-bottom: 1px solid var(--border);
          `
        }, 'Console Output'));
        
        const playgroundConsole = h('div', {
          id: 'playgroundConsole',
          style: `
            flex: 1;
            padding: var(--space-md);
            overflow: auto;
            font-family: 'Courier New', monospace;
            font-size: 0.875rem;
            line-height: 1.6;
          `
        });
        
        playgroundConsole.appendChild(h('div', { style: 'color: var(--text-muted);' }, 
          '→ Console ready. Click "Run Code" to execute your code.'));
        
        consolePanel.appendChild(playgroundConsole);
        splitView.appendChild(consolePanel);
        
        modalBody.appendChild(splitView);
        
        // Function to run playground code
        function runPlaygroundCode() {
          const code = playgroundEditor.value;
          playgroundConsole.innerHTML = '';
          
          const logEntry = (message, type = 'info') => {
            const color = {
              info: 'var(--text-primary)',
              success: '#4caf50',
              warning: '#ff9800',
              error: '#f44336'
            }[type];
            
            const entry = h('div', { 
              style: `color: ${color}; margin-bottom: var(--space-xs); border-left: 3px solid ${color}; padding-left: var(--space-sm);` 
            }, message);
            playgroundConsole.appendChild(entry);
          };
          
          // Create sandboxed console
          const sandboxConsole = {
            log: (...args) => logEntry(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '), 'info'),
            error: (...args) => logEntry('ERROR: ' + args.map(a => String(a)).join(' '), 'error'),
            warn: (...args) => logEntry('WARNING: ' + args.map(a => String(a)).join(' '), 'warning'),
            info: (...args) => logEntry('INFO: ' + args.map(a => String(a)).join(' '), 'info')
          };
          
          logEntry('→ Executing code...', 'info');
          
          try {
            // Use Function constructor to avoid eval and restrict scope
            const fn = new Function('console', 'CardSpoke', `
              "use strict";
              return (async () => {
                ${code}
              })();
            `);

            fn(sandboxConsole, window.CardSpoke).then(() => {
              logEntry('✓ Code execution completed', 'success');
            }).catch(err => {
              logEntry('Async error: ' + err.message, 'error');
              console.error('[Playground]', err);
            });
            
          } catch (err) {
            logEntry('Execution error: ' + err.message, 'error');
            console.error('[Playground]', err);
          }
        }
        
        // Store references for button handlers (namespaced to avoid global pollution)
        window.CardSpoke = window.CardSpoke || {};
        window.CardSpoke.playground = { editor: playgroundEditor, console: playgroundConsole, runCode: runPlaygroundCode };
        
        modal.appendChild(modalBody);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
      }
      
      /**
       * Get playground code template
       */
      function getPlaygroundTemplate() {
        return `// Extension Playground
// Test your extension code here in a safe environment

// Example 1: Use CardSpoke.utils API to get dataset info
const meta = await CardSpoke.utils.getDatasetMeta();
console.log('Dataset:', meta.name);
console.log('Total cards:', meta.cardCount);

// Example 2: Create a new card
const result = await CardSpoke.utils.createCard({
  title: 'Test Card from Playground',
  body: 'This card was created in the playground!',
  tags: ['playground', 'test']
});
console.log('Created card:', result.id);

// Example 3: Search for cards
const searchResults = await CardSpoke.utils.searchCards('test');
console.log('Found', searchResults.length, 'cards matching "test"');

// Example 4: Get all tags
const allTags = await CardSpoke.utils.getAllTags();
console.log('All tags:', allTags);

// Example 5: Show a toast notification
await CardSpoke.utils.showToast('Playground code executed!', 'success');

console.log('✓ All examples completed!');
`;
      }

      function showAppearanceSettings() {
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
        const richTextEnabled = localStorage.getItem('cardspoke_richtext') === 'true';
        const richTextRow = h('div', { 
          className: 'menu-item-toggle',
          style: 'padding: var(--space-md); border: 1px solid var(--border); border-radius: 4px; margin-bottom: var(--space-md);'
        });
        const richTextLabel = h('div', { className: 'menu-item-label' });
        richTextLabel.appendChild(h('span', { style: 'display: block;' }, 'Rich Text'));
        richTextLabel.appendChild(h('span', { style: 'font-size: var(--text-sm); color: var(--text-muted); display: block;' }, 'Enable markdown formatting in card body'));
        const richTextToggle = h('label', { className: 'switch-toggle' });
        const richTextInput = h('input', { 
          type: 'checkbox', 
          checked: richTextEnabled,
          onchange: function(e) {
            localStorage.setItem('cardspoke_richtext', e.target.checked ? 'true' : 'false');
            showToast(e.target.checked ? 'Rich Text enabled' : 'Rich Text disabled');
            render();
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
            render();
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
            render();
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
              showAppearanceSettings();
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
        
        // Light theme option
        const lightOption = h('div', { 
          className: 'theme-option',
          style: 'padding: var(--space-lg); border: 2px solid ' + (currentTheme === 'light' ? 'var(--text)' : 'var(--border)') + '; margin-bottom: var(--space-md); cursor: pointer; border-radius: 4px; background: white; color: black;',
          onclick: function() {
            applyTheme('light');
            overlay.remove();
          }
        });
        lightOption.appendChild(h('div', { style: 'font-weight: 600; margin-bottom: var(--space-xs);' }, (currentTheme === 'light' ? '✓ ' : '') + 'Light Theme'));
        lightOption.appendChild(h('div', { style: 'font-size: var(--text-sm); color: #666;' }, 'Default light color scheme'));
        themeSection.appendChild(lightOption);
        
        // Dark theme option
        const darkOption = h('div', { 
          className: 'theme-option',
          style: 'padding: var(--space-lg); border: 2px solid ' + (currentTheme === 'dark' ? 'white' : 'var(--border)') + '; margin-bottom: var(--space-md); cursor: pointer; border-radius: 4px; background: #1a1a1a; color: white;',
          onclick: function() {
            applyTheme('dark');
            overlay.remove();
          }
        });
        darkOption.appendChild(h('div', { style: 'font-weight: 600; margin-bottom: var(--space-xs);' }, (currentTheme === 'dark' ? '✓ ' : '') + 'Dark Theme'));
        darkOption.appendChild(h('div', { style: 'font-size: var(--text-sm); color: #aaa;' }, 'Dark color scheme'));
        themeSection.appendChild(darkOption);
        
        // Custom themes from extensions (ENHANCED)
        const themeExtensions = Object.values(store.mods || {}).filter(function(mod) {
          return mod.meta && mod.meta.type === 'Theme';
        });
        
        // Get active theme extension ID
        const activeThemeExtension = localStorage.getItem('cardspoke_activeThemeExtension') || null;
        
        if (themeExtensions.length > 0) {
          themeSection.appendChild(h('div', { 
            style: 'font-weight: 600; margin: var(--space-lg) 0 var(--space-md);'
          }, 'Installed Theme Extensions'));
          
          themeExtensions.forEach(function(theme) {
            const isActive = activeThemeExtension === theme.id;
            const themeOption = h('div', {
              style: 'padding: var(--space-md); border: 2px solid ' + (isActive ? 'var(--primary)' : 'var(--border)') + '; border-radius: 4px; margin-bottom: var(--space-sm); cursor: pointer; display: flex; justify-content: space-between; align-items: center;',
              onclick: function() {
                if (!theme.enabled) {
                  // Enable the theme extension first
                  CardSpoke_MODS.enable(theme.id);
                }
                // Apply the theme extension
                localStorage.setItem('cardspoke_activeThemeExtension', theme.id);
                // Remove all other theme extension classes and add this one
                document.documentElement.className = document.documentElement.className
                  .split(' ')
                  .filter(c => !c.startsWith('theme-ext-'))
                  .join(' ');
                document.documentElement.classList.add('theme-ext-' + theme.id);
                showToast('Theme applied: ' + (theme.meta.name || theme.id));
                overlay.remove();
                showAppearanceSettings();
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
              style: 'font-size: var(--text-xs); padding: 2px 8px; border-radius: 10px; background: ' + (theme.enabled ? 'var(--success, #28a745)' : 'var(--text-muted)') + '; color: white;'
            }, theme.enabled ? 'Enabled' : 'Disabled');
            themeOption.appendChild(statusBadge);
            
            themeSection.appendChild(themeOption);
          });
          
          // Add "Reset to Default" button if a theme extension is active
          if (activeThemeExtension) {
            const resetBtn = h('button', {
              className: 'btn',
              style: 'width: 100%; margin-top: var(--space-md);',
              onclick: function() {
                localStorage.removeItem('cardspoke_activeThemeExtension');
                document.documentElement.className = document.documentElement.className
                  .split(' ')
                  .filter(c => !c.startsWith('theme-ext-'))
                  .join(' ');
                showToast('Theme reset to default');
                overlay.remove();
                showAppearanceSettings();
              }
            }, 'Reset to Default Theme');
            themeSection.appendChild(resetBtn);
          }
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

      function showBookmarks() {
        const overlay = h('div', { className: 'modal-overlay show' });
        const modal = h('div', { className: 'modal' });
        const modalHeader = h('div', { className: 'modal-header' });
        modalHeader.appendChild(h('div', { className: 'modal-title' }, '★ Bookmarked Cards'));
        const closeBtn = h('button', { className: 'modal-close', onclick: () => overlay.remove() }, '✕');
        modalHeader.appendChild(closeBtn);
        modal.appendChild(modalHeader);
        const modalBody = h('div', { className: 'modal-body' });
        
        if (!store.bookmarks || store.bookmarks.length === 0) {
          modalBody.appendChild(h('div', { className: 'empty' }, 'No bookmarked cards yet'));
        } else {
          const bookmarkList = store.bookmarks
            .map(cardId => store.cards[cardId])
            .filter(card => card) // Filter out deleted cards
            .map(card => {
              const cardItem = h('div', { 
                style: 'padding: var(--space-lg); border: 1px solid var(--border); margin-bottom: var(--space-md); cursor: pointer;',
                onclick: () => {
                  overlay.remove();
                  goTo('read', { cardId: card.id });
                }
              });
              
              const cardHeader = h('div', { style: 'display: flex; justify-content: space-between; align-items: center;' });
              cardHeader.appendChild(h('div', { style: 'font-weight: 700;' }, card.title || '(Untitled)'));
              
              const unbookmarkBtn = h('button', {
                className: 'btn btn-danger',
                style: 'font-size: var(--text-sm);',
                onclick: (e) => {
                  e.stopPropagation();
                  toggleBookmark(card.id);
                  overlay.remove();
                  showBookmarks();
                }
              }, 'Remove');
              cardHeader.appendChild(unbookmarkBtn);
              cardItem.appendChild(cardHeader);
              
              if (card.body) {
                const preview = card.body.substring(0, 100) + (card.body.length > 100 ? '...' : '');
                cardItem.appendChild(h('div', { style: 'color: var(--text-muted); font-size: var(--text-sm); margin-top: var(--space-sm);' }, preview));
              }
              
              return cardItem;
            });
          
          bookmarkList.forEach(item => modalBody.appendChild(item));
        }
        
        modal.appendChild(modalBody);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
      }

      function showRecentCards() {
        const overlay = h('div', { className: 'modal-overlay show' });
        const modal = h('div', { className: 'modal' });
        const modalHeader = h('div', { className: 'modal-header' });
        modalHeader.appendChild(h('div', { className: 'modal-title' }, 'Recent Cards'));
        const closeBtn = h('button', { className: 'modal-close', onclick: () => overlay.remove() }, '✕');
        modalHeader.appendChild(closeBtn);
        modal.appendChild(modalHeader);
        const modalBody = h('div', { className: 'modal-body' });
        
        if (!store.recentCards || store.recentCards.length === 0) {
          modalBody.appendChild(h('div', { className: 'empty' }, 'No recently viewed cards'));
        } else {
          const recentList = store.recentCards
            .map(cardId => store.cards[cardId])
            .filter(card => card) // Filter out deleted cards
            .map((card, index) => {
              const cardItem = h('div', { 
                style: 'padding: var(--space-lg); border: 1px solid var(--border); margin-bottom: var(--space-md); cursor: pointer;',
                onclick: () => {
                  overlay.remove();
                  goTo('read', { cardId: card.id });
                }
              });
              
              const cardHeader = h('div', { style: 'display: flex; justify-content: space-between; align-items: center;' });
              cardHeader.appendChild(h('div', { style: 'font-weight: 700;' }, `${index + 1}. ${card.title || '(Untitled)'}`));
              cardItem.appendChild(cardHeader);
              
              if (card.body) {
                const preview = card.body.substring(0, 100) + (card.body.length > 100 ? '...' : '');
                cardItem.appendChild(h('div', { style: 'color: var(--text-muted); font-size: var(--text-sm); margin-top: var(--space-sm);' }, preview));
              }
              
              return cardItem;
            });
          
          recentList.forEach(item => modalBody.appendChild(item));
        }
        
        modal.appendChild(modalBody);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
      }

      function openUploadModalForCard(cardId, tabName) {
        // 1. Update all the select dropdowns
        updateImportLocationOptions();
        
        // 2. Set the value for the TXT and DOCX dropdowns to this cardId
        if (uploadModal.importLocationSelectTXT) {
          uploadModal.importLocationSelectTXT.value = cardId;
        }
        if (uploadModal.importLocationSelectDOCX) {
          uploadModal.importLocationSelectDOCX.value = cardId;
        }
        
        // 3. Set the correct radio button for TXT import (append)
        const txtAppendRadio = document.querySelector('input[name="txtImportMode"][value="append"]');
        if (txtAppendRadio) txtAppendRadio.checked = true;

        // 4. Set the correct radio button for DOCX import (append)
        const docxAppendRadio = document.querySelector('input[name="docxImportMode"][value="append"]');
        if (docxAppendRadio) docxAppendRadio.checked = true;

        // 5. Switch to the correct tab
        uploadModal.tabs.forEach(t => t.classList.remove('active'));
        uploadModal.tabContents.forEach(content => content.classList.remove('active'));
        
        const tabEl = document.querySelector(`.modal-tab[data-tab="${tabName}"]`);
        const contentEl = document.getElementById(`tab-${tabName}`);
        
        if (tabEl) tabEl.classList.add('active');
        if (contentEl) contentEl.classList.add('active');
        
        // 6. Show the modal
        uploadModal.overlay.classList.add('show');
      }

      function updateImportLocationOptions() {
        const selectJSON = uploadModal.importLocationSelectJSON;
        const selectTXT = uploadModal.importLocationSelectTXT;
        const selectDOCX = uploadModal.importLocationSelectDOCX;
        const sortedCards = Object.values(store.cards).sort((a, b) => {
          const A = (a.title || '').toLowerCase();
          const B = (b.title || '').toLowerCase();
          return A.localeCompare(B);
        });
        if (selectJSON) {
          selectJSON.innerHTML = '<option value="root">Add as Root Cards</option>';
          sortedCards.forEach(card => {
            const option = document.createElement('option');
            option.value = card.id;
            option.textContent = `Add as children of: ${card.title || '(Untitled)'}`;
            selectJSON.appendChild(option);
          });
        }
        if (selectTXT) {
          // Compromise text to work for both radio options
          selectTXT.innerHTML = '<option value="root">Add as Root Cards (Outline Mode)</option>';
          sortedCards.forEach(card => {
            const option = document.createElement('option');
            option.value = card.id;
            option.textContent = `Append to / Add children of: ${card.title || '(Untitled)'}`;
            selectTXT.appendChild(option);
          });
        }
        if (selectDOCX) {
          selectDOCX.innerHTML = '<option value="">Select a card...</option>';
          sortedCards.forEach(card => {
            const option = document.createElement('option');
            option.value = card.id;
            option.textContent = card.title || '(Untitled)';
            selectDOCX.appendChild(option);
          });
        }
      }

      function extractTags(body) {
        if (!body) return [];
        const matches = body.match(/#\w+/g);
        return matches ? matches.slice(0, 5) : [];
      }

      /**
       * Parse [[Card Name]] tokens from text
       * @param {string} text - Text to parse
       * @returns {Array<{match: string, cardName: string, startIndex: number, endIndex: number}>} Array of token matches
       */
      function parseCardLinks(text) {
        if (!text) return [];
        
        const regex = /\[\[([^\]]+)\]\]/g;
        const matches = [];
        let match;
        
        while ((match = regex.exec(text)) !== null) {
          matches.push({
            match: match[0],           // Full match: [[Card Name]]
            cardName: match[1].trim(), // Extracted card name
            startIndex: match.index,
            endIndex: match.index + match[0].length
          });
        }
        
        return matches;
      }

      /**
       * Normalize card name for comparison
       * @param {string} name - Card name to normalize
       * @returns {string} Normalized name (lowercase, trimmed, spaces normalized)
       */
      function normalizeCardName(name) {
        if (!name) return '';
        return name.toLowerCase().trim().replace(/\s+/g, ' ');
      }

      /**
       * Check if a card link token exists in text
       * @param {string} text - Text to search
       * @param {string} cardName - Card name to look for
       * @returns {boolean} True if card link exists
       */
      function hasCardLink(text, cardName) {
        if (!text || !cardName) return false;
        const links = parseCardLinks(text);
        const normalizedName = normalizeCardName(cardName);
        return links.some(link => normalizeCardName(link.cardName) === normalizedName);
      }

      /**
       * Find card ID by normalized name
       * @param {string} cardName - Card name to search for
       * @returns {string|null} Card ID if found, null otherwise
       */
      function findCardByName(cardName) {
        if (!cardName) return null;
        
        const normalizedSearch = normalizeCardName(cardName);
        
        for (const [id, card] of Object.entries(store.cards)) {
          if (normalizeCardName(card.title) === normalizedSearch) {
            return id;
          }
        }
        
        return null;
      }

      /**
       * Find all cards matching a name pattern
       * @param {string} cardName - Card name pattern to search for
       * @param {boolean} exactMatch - If true, requires exact match; if false, allows partial matches
       * @returns {Array<{id: string, title: string, similarity: number}>} Array of matching cards
       */
      function findCardsByName(cardName, exactMatch = true) {
        if (!cardName) return [];
        
        const normalizedSearch = normalizeCardName(cardName);
        const results = [];
        
        for (const [id, card] of Object.entries(store.cards)) {
          const normalizedTitle = normalizeCardName(card.title);
          
          if (exactMatch) {
            if (normalizedTitle === normalizedSearch) {
              results.push({
                id,
                title: card.title,
                similarity: 1.0
              });
            }
          } else {
            // Partial match - check if search term is contained
            if (normalizedTitle.includes(normalizedSearch)) {
              // Calculate simple similarity score
              const similarity = normalizedSearch.length / normalizedTitle.length;
              results.push({
                id,
                title: card.title,
                similarity
              });
            }
          }
        }
        
        // Sort by similarity (exact matches first, then by similarity score)
        results.sort((a, b) => b.similarity - a.similarity);
        
        return results;
      }

      /**
       * Resolve all card links in text to card IDs
       * @param {string} text - Text containing [[Card Name]] links
       * @returns {Array<{link: object, cardId: string|null}>} Array of links with resolved IDs
       */
      function resolveCardLinks(text) {
        const links = parseCardLinks(text);
        
        return links.map(link => ({
          link,
          cardId: findCardByName(link.cardName)
        }));
      }

      /**
       * Get all tags for a card
       * @param {string} cardId - Card ID
       * @returns {string[]} Array of tags
       */
      function getTags(cardId) {
        const card = store.cards[cardId];
        if (!card) return [];
        return card.tags || [];
      }

      /**
       * Add a tag to a card
       * @param {string} cardId - Card ID
       * @param {string} tag - Tag to add
       * @param {boolean} skipSave - Skip saving to localStorage
       * @returns {boolean} True if tag was added, false otherwise
       */
      function addTag(cardId, tag, skipSave = false) {
        const card = store.cards[cardId];
        if (!card) return false;
        
        // Normalize tag (remove # if present, lowercase)
        const normalizedTag = tag.replace(/^#/, '').toLowerCase().trim();
        if (!normalizedTag) return false;
        
        // Initialize tags array if not present
        if (!card.tags) card.tags = [];
        
        // Check if tag already exists (case-insensitive)
        if (card.tags.some(t => t.toLowerCase() === normalizedTag)) {
          return false;
        }
        
        // Add the tag
        card.tags.push(normalizedTag);
        card.updatedAt = Date.now();
        
        if (!skipSave) save();
        runModHook('onCardSave', cloneCard(card), { isNew: false, source: 'addTag' });
        
        return true;
      }

      /**
       * Remove a tag from a card
       * @param {string} cardId - Card ID
       * @param {string} tag - Tag to remove
       * @param {boolean} skipSave - Skip saving to localStorage
       * @returns {boolean} True if tag was removed, false otherwise
       */
      function removeTag(cardId, tag, skipSave = false) {
        const card = store.cards[cardId];
        if (!card || !card.tags) return false;
        
        // Normalize tag (remove # if present, lowercase)
        const normalizedTag = tag.replace(/^#/, '').toLowerCase().trim();
        
        // Find and remove the tag (case-insensitive)
        const initialLength = card.tags.length;
        card.tags = card.tags.filter(t => t.toLowerCase() !== normalizedTag);
        
        // Check if anything was removed
        if (card.tags.length === initialLength) {
          return false;
        }
        
        card.updatedAt = Date.now();
        
        if (!skipSave) save();
        runModHook('onCardSave', cloneCard(card), { isNew: false, source: 'removeTag' });
        
        return true;
      }

      /**
       * Set all tags for a card (replaces existing tags)
       * @param {string} cardId - Card ID
       * @param {string[]} tags - Array of tags to set
       * @param {boolean} skipSave - Skip saving to localStorage
       * @returns {boolean} True if tags were set successfully
       */
      function setTags(cardId, tags, skipSave = false) {
        const card = store.cards[cardId];
        if (!card) return false;
        
        // Normalize all tags
        const normalizedTags = tags
          .map(tag => tag.replace(/^#/, '').toLowerCase().trim())
          .filter(tag => tag.length > 0);
        
        // Remove duplicates
        card.tags = [...new Set(normalizedTags)];
        card.updatedAt = Date.now();
        
        if (!skipSave) save();
        runModHook('onCardSave', cloneCard(card), { isNew: false, source: 'setTags' });
        
        return true;
      }

      /**
       * Get all unique tags across all cards
       * @returns {string[]} Array of all unique tags
       */
      function getAllTags() {
        const allTags = new Set();
        Object.values(store.cards).forEach(card => {
          if (card.tags) {
            card.tags.forEach(tag => allTags.add(tag));
          }
        });
        return Array.from(allTags).sort();
      }

      /**
       * Create interactive tag editor with chips
       */
      function createTagEditor(initialTags, datalistId) {
        const normalized = Array.from(new Set(normalizeTagInput(initialTags.join(' '))));
        const tagSet = new Set(normalized);
        const wrapper = h('div', { className: 'tag-editor', role: 'list', 'aria-label': 'Tag editor' });
        const input = h('input', {
          type: 'text',
          className: 'tag-editor-input',
          list: datalistId,
          placeholder: 'Add tags...',
          'aria-label': 'Add tag'
        });

        function renderChips() {
          wrapper.querySelectorAll('.tag-chip').forEach(c => c.remove());
          tagSet.forEach(tag => {
            const chip = h('span', { className: 'tag-chip', role: 'listitem' },
              h('span', { className: 'tag-chip-text' }, tag),
              h('button', {
                type: 'button',
                className: 'tag-chip-remove',
                'aria-label': `Remove tag ${tag}`,
                onclick: (e) => {
                  e.stopPropagation();
                  tagSet.delete(tag);
                  renderChips();
                }
              }, '×')
            );
            wrapper.insertBefore(chip, input);
          });
        }

        function addTagsFromInput(val) {
          const tags = normalizeTagInput(val);
          tags.forEach(t => tagSet.add(t));
          renderChips();
          input.value = '';
        }

        input.addEventListener('keydown', (e) => {
          if (['Enter', 'Tab', ',', ' '].includes(e.key)) {
            addTagsFromInput(input.value);
            if (e.key !== 'Tab') e.preventDefault();
          } else if (e.key === 'Backspace' && !input.value && tagSet.size) {
            const last = Array.from(tagSet).pop();
            tagSet.delete(last);
            renderChips();
          }
        });
        input.addEventListener('blur', () => addTagsFromInput(input.value));

        renderChips();
        wrapper.appendChild(input);
        wrapper.getTags = () => Array.from(tagSet);
        wrapper.focusInput = () => input.focus();
        return wrapper;
      }
      /**
       * Get all cards that link to a specific card (backlinks)
       * @param {string} cardId - Card ID to find backlinks for
       * @returns {Array<{id: string, title: string}>} Array of cards that link to this card
       */
      function getBacklinks(cardId) {
        if (!cardId) return [];
        
        const card = store.cards[cardId];
        if (!card) return [];
        
        const cardTitle = card.title;
        if (!cardTitle) return [];
        
        const backlinks = [];
        
        // Search through all cards for [[Card Title]] references
        for (const [id, otherCard] of Object.entries(store.cards)) {
          if (id === cardId) continue; // Skip self-references
          
          if (otherCard.body && hasCardLink(otherCard.body, cardTitle)) {
            backlinks.push({
              id: otherCard.id,
              title: otherCard.title || '(Untitled)',
              body: otherCard.body
            });
          }
        }
        
        return backlinks;
      }

      /**
       * Get related cards based on shared tags
       * @param {string} cardId - Card ID to find related cards for
       * @param {number} limit - Maximum number of results (default: 10)
       * @returns {Array<{id: string, title: string, matchScore: number, matchedTags: string[]}>}
       */
      function getRelatedCards(cardId, limit = 10) {
        if (!cardId) return [];
        
        const card = store.cards[cardId];
        if (!card) return [];
        
        const cardTags = getTags(cardId);
        if (cardTags.length === 0) return [];
        
        const related = [];
        
        for (const [id, otherCard] of Object.entries(store.cards)) {
          if (id === cardId) continue; // Skip self
          
          const otherTags = getTags(id);
          const matchedTags = cardTags.filter(tag => otherTags.includes(tag));
          
          if (matchedTags.length > 0) {
            const matchScore = matchedTags.length / Math.max(cardTags.length, otherTags.length);
            related.push({
              id: otherCard.id,
              title: otherCard.title || '(Untitled)',
              matchScore,
              matchedTags
            });
          }
        }
        
        // Sort by match score (highest first)
        related.sort((a, b) => b.matchScore - a.matchScore);
        
        return related.slice(0, limit);
      }



