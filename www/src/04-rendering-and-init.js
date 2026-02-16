      // Source Part 4/5: Rendering, themes, footer, and initialization
      // Concatenated via `npm run build` in lexical order of www/src/*.js
      // =============================================================
      // --- RENDERING ---
      // Functions for rendering UI components and pages
      // =============================================================

      /**
       * Render breadcrumb navigation
       */
      function renderBreadcrumbs() {
        breadcrumbs.innerHTML = '';
        if (navState.page === 'search') {
          breadcrumbs.appendChild(h('span', { className: 'breadcrumb current', 'aria-current': 'page' }, 'Search Results'));
          return;
        }
        if (navState.page === 'edit') {
          breadcrumbs.appendChild(h('span', { className: 'breadcrumb current', 'aria-current': 'page' }, navState.cardId ? 'Edit Card' : 'New Card'));
          return;
        }
        let current = navState.cardId;
        const path = [];
        while (current) {
          const c = store.cards[current];
          if (!c) break;
          path.unshift(c);
          current = c.parentId;
        }
        if (path.length === 0) {
          breadcrumbs.appendChild(h('span', { className: 'breadcrumb current', 'aria-current': 'page' }, 'All Cards'));
        } else {
          const home = h('button', { className: 'breadcrumb', onclick: () => goTo('list', { cardId: null }), 'aria-label': 'Go to All Cards' }, 'All Cards');
          breadcrumbs.appendChild(home);
          path.forEach((c, i) => {
            const isCurrent = (i === path.length - 1 && navState.page === 'list');
            const cls = isCurrent ? 'breadcrumb current' : 'breadcrumb';
            const chip = isCurrent 
              ? h('span', { className: cls, 'aria-current': 'page' }, c.title || '(Untitled)')
              : h('button', { className: cls, onclick: () => goTo('list', { cardId: c.id }), 'aria-label': 'Go to ' + (c.title || 'Untitled') }, c.title || '(Untitled)');
            breadcrumbs.appendChild(chip);
          });
        }
      }

      /**
       * Render the list of cards (root level or children)
       */
      function renderCardList() {
        const parentId = navState.cardId;
        let kids = [];
        if (!parentId) {
          kids = store.rootOrder.map(id => store.cards[id]).filter(c => c);
        } else {
          const parent = store.cards[parentId];
          if (!parent) {
            main.appendChild(h('div', { className: 'empty' }, 'Card not found.'));
            return;
          }
          kids = parent.children.map(id => store.cards[id]).filter(c => c);
        }
        searchContainer.style.display = 'block';
        const title = parentId ? (store.cards[parentId]?.title || 'Card') : 'Top Level Cards';
        main.appendChild(h('div', { className: 'page-title' }, title));
        
        kids.sort((a, b) => (a.title || '').toLowerCase().localeCompare((b.title || '').toLowerCase()));
        
        if (kids.length === 0) {
          main.appendChild(h('div', { className: 'empty' }, 'No cards yet. Create one to get started!'));
        } else {
          const gridViewEnabled = localStorage.getItem('cardspoke_gridView') === 'true';
          const gridClass = gridViewEnabled ? 'card-grid grid-view' : 'card-grid';
          const grid = h('div', { className: gridClass, role: 'list' });
          let renderIndex = 0;
          const batchSize = 60;
          const renderBatch = () => {
            const frag = document.createDocumentFragment();
            const start = renderIndex;
            for (let i = start; i < Math.min(start + batchSize, kids.length); i++) {
              const card = kids[i];
              const cardEl = renderCardTile(card, { lazyBody: true });
              frag.appendChild(cardEl);
              runModHook('onCardRender', cloneCard(card), cardEl);
            }
            grid.appendChild(frag);
            renderIndex += batchSize;
          };
          const onScroll = () => {
            if (renderIndex >= kids.length) return;
            const threshold = grid.offsetTop + grid.offsetHeight - window.innerHeight * 2;
            if (window.scrollY + window.innerHeight > threshold) {
              requestAnimationFrame(renderBatch);
            }
          };
          renderBatch();
          window.addEventListener('scroll', onScroll, { passive: true });
          registerRenderCleanup(() => window.removeEventListener('scroll', onScroll));
          main.appendChild(grid);
        }
      }

      /**
       * Render a single card tile in list view
       * @param {Object} card - Card to render
       * @returns {HTMLElement} Card tile element
       */
      function renderCardTile(card, opts = {}) {
        const isCompact = store.viewMode === 'compact';
        const cardClasses = isCompact ? 'card card-compact' : 'card';
        const cardEl = h('button', { className: cardClasses + ' card-tile', onclick: () => goTo('read', { cardId: card.id }), 'aria-label': 'Open card: ' + (card.title || 'Untitled'), role: 'listitem' });
        cardEl.dataset.cardId = card.id;
        cardEl.dataset.renderType = 'list';

        // Left side content
        const contentEl = h('div', { className: 'card-content' });
        
        // Add bookmark indicator if bookmarked
        const titleWrapper = h('div', { style: 'display: flex; align-items: center; gap: 8px;' });
        if (isBookmarked(card.id)) {
          titleWrapper.appendChild(h('span', { 
            style: 'color: gold; font-size: 18px;',
            title: 'Bookmarked'
          }, '★'));
        }
        const titleContent = opts.highlightQuery ? highlightText(card.title || '(Untitled)', opts.highlightQuery) : document.createTextNode(card.title || '(Untitled)');
        const titleDiv = h('div', { className: 'card-title' });
        titleDiv.appendChild(titleContent);
        titleWrapper.appendChild(titleDiv);
        contentEl.appendChild(titleWrapper);

        if (card.body && !isCompact) {
          const previewText = card.body.substring(0, 140) + (card.body.length > 140 ? '...' : '');
          const desc = h('div', { className: 'card-description' });
          if (opts.highlightQuery) {
            desc.appendChild(highlightText(previewText, opts.highlightQuery));
          } else if (opts.lazyBody) {
            desc.dataset.preview = previewText;
          } else {
            desc.textContent = previewText;
          }
          contentEl.appendChild(desc);
        }
        
        const tags = (card.tags && card.tags.length ? card.tags : extractTags(card.body));
        if (tags.length > 0 && !isCompact) {
          const tagsEl = h('div', { className: 'card-tags' });
          tags.forEach(tag => {
            tagsEl.appendChild(h('span', { className: 'card-tag' }, tag));
          });
          contentEl.appendChild(tagsEl);
        }
        
        cardEl.appendChild(contentEl);

        // Right side count
        if (card.children.length > 0) {
          cardEl.appendChild(h('div', { className: 'card-count' }, String(card.children.length)));
        }

        if (opts.lazyBody) {
          if (!previewObserver) {
            previewObserver = new IntersectionObserver(entries => {
              entries.forEach(entry => {
                if (entry.isIntersecting) {
                  const previewEl = entry.target.querySelector('.card-description[data-preview]');
                  if (previewEl && previewEl.dataset.preview) {
                    previewEl.textContent = previewEl.dataset.preview;
                    delete previewEl.dataset.preview;
                  }
                  previewObserver.unobserve(entry.target);
                }
              });
            }, { rootMargin: '200px' });
          }
          previewObserver.observe(cardEl);
        }

        return cardEl;
      }

      /**
       * Render card body text with clickable card links
       * Converts [[Card Name]] to clickable links
       * @param {string} text - Card body text
       * @returns {HTMLElement} Div element with rendered content
       */
      function renderCardBody(text) {
        const container = h('div', { className: 'card-detail-body' });

        if (!text) return container;
        
        const links = parseCardLinks(text);
        
        if (links.length === 0) {
          // No links, just return plain text
          container.textContent = text;
          return container;
        }
        
        // Sort links by start index to process in order
        links.sort((a, b) => a.startIndex - b.startIndex);
        
        let lastIndex = 0;
        
        links.forEach(link => {
          // Add text before the link
          if (link.startIndex > lastIndex) {
            const textBefore = text.substring(lastIndex, link.startIndex);
            container.appendChild(document.createTextNode(textBefore));
          }
          
          // Find the card ID
          const cardId = findCardByName(link.cardName);
          
          // Create clickable link
          const linkEl = h('span', { 
            className: cardId ? 'card-link' : 'card-link-missing',
            style: 'cursor: pointer;',
            title: cardId ? `Go to: ${link.cardName}` : `Card not found: ${link.cardName} (click to create)`
          }, link.cardName);
          
          // Add click handler
          linkEl.addEventListener('click', (e) => {
            e.stopPropagation();
            if (cardId) {
              // Card exists, navigate to it
              goTo('read', { cardId });
            } else {
              // Card doesn't exist, offer to create it
              if (confirm(`Card "${link.cardName}" doesn't exist. Create it?`)) {
                const newId = createCard(link.cardName, '', null);
                goTo('edit', { cardId: newId });
              }
            }
          });
          
          container.appendChild(linkEl);
          lastIndex = link.endIndex;
        });
        
        // Add remaining text after the last link
        if (lastIndex < text.length) {
          const textAfter = text.substring(lastIndex);
          container.appendChild(document.createTextNode(textAfter));
        }
        
        return container;
      }

      function renderRichTextBody(text) {
        const container = h('div', { className: 'card-detail-body rich-body', role: 'article' });
        if (!text) return container;
        const lines = text.split(/\n/);
        let listEl = null;
        lines.forEach(line => {
          if (/^#{1,3} /.test(line)) {
            if (listEl) { container.appendChild(listEl); listEl = null; }
            const level = line.match(/^#+/)[0].length;
            const title = line.replace(/^#{1,3} /, '');
            const header = h(`h${level}`, {}, title);
            container.appendChild(header);
            return;
          }
          if (/^-\s+/.test(line)) {
            if (!listEl) listEl = document.createElement('ul');
            const li = document.createElement('li');
            li.textContent = line.replace(/^-\s+/, '');
            listEl.appendChild(li);
            return;
          }
          if (listEl) { container.appendChild(listEl); listEl = null; }
          const para = document.createElement('p');
          let html = escapeHtml(line)
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/_(.+?)_/g, '<em>$1</em>');
          para.innerHTML = html;
          container.appendChild(para);
        });
        if (listEl) container.appendChild(listEl);
        return container;
      }

      /**
       * Render a card in read-only/detail view
       */
      function renderReadOnlyCard() {
        searchContainer.style.display = 'none';
        const card = store.cards[navState.cardId];
        if (!card) {
          main.appendChild(h('div', { className: 'empty' }, 'Card not found.'));
          return;
        }
        const detail = h('div', { className: 'card-detail' });
        detail.appendChild(h('div', { className: 'card-detail-title' }, card.title || '(Untitled)'));
        if (card.body) {
          // Check global Rich Text setting OR per-card setting
          const globalRichText = localStorage.getItem('cardspoke_richtext') === 'true';
          const useRichText = globalRichText || card.isRichText;
          detail.appendChild(useRichText ? renderRichTextBody(card.body) : renderCardBody(card.body));
        }
        // Tags display
        const _tags = (card.tags && card.tags.length ? card.tags : extractTags(card.body));
        if (_tags.length) {
          const tagsWrap = h('div', { className: 'card-tags' });
          _tags.forEach(t => tagsWrap.appendChild(h('span', { className: 'card-tag' }, t)));
          detail.appendChild(tagsWrap);
        }
        const actions = h('div', { className: 'card-detail-actions' });
        actions.appendChild(h('button', { className: 'btn btn-primary', onclick: () => goTo('edit', { cardId: card.id }) }, 'Edit'));
        
        // Bookmark button
        const bookmarkBtnText = isBookmarked(card.id) ? '★ Unbookmark' : '☆ Bookmark';
        actions.appendChild(h('button', { 
          className: 'btn', 
          onclick: (e) => {
            e.stopPropagation();
            toggleBookmark(card.id);
          }
        }, bookmarkBtnText));
        
        // Duplicate button with dropdown-like behavior
        actions.appendChild(h('button', {
          className: 'btn',
          onclick: () => {
            const choice = confirm('Duplicate with children?\n\nOK = Yes (with children)\nCancel = No (only this card)');
            const newId = duplicateCard(card.id, choice);
            if (newId) {
              showToast('Card duplicated successfully');
              goTo('read', { cardId: newId });
            }
          }
        }, 'Duplicate'));

        // Share button (v1.0.0)
        actions.appendChild(h('button', {
          className: 'btn',
          onclick: () => showShareCard(card.id)
        }, 'Share'));

        actions.appendChild(h('button', { className: 'btn', onclick: () => {
          const newId = createCard('', '', card.id);
          goTo('edit', { cardId: newId });
        } }, 'Add Child'));
        
        actions.appendChild(h('button', { className: 'btn', onclick: () => openUploadModalForCard(card.id, 'txt') }, 'Import TXT'));
        
        actions.appendChild(h('button', { className: 'btn btn-danger', onclick: () => {
          if (confirm('Delete this card and all its children?')) {
            deleteCard(card.id);
            goTo('list', { cardId: card.parentId });
          }
        } }, 'Delete'));
        detail.appendChild(actions);
        if (card.children.length > 0) {
          const childrenSection = h('div', { className: 'children-section' });
          childrenSection.appendChild(h('div', { className: 'children-title' }, `Children (${card.children.length})`));
          const childrenGrid = h('div', { className: 'card-grid' });
          card.children.forEach(cid => {
            const childCard = store.cards[cid];
            if (childCard) {
              const childEl = renderCardTile(childCard);
              childrenGrid.appendChild(childEl);
              runModHook('onCardRender', cloneCard(childCard), childEl);
            }
          });
          childrenSection.appendChild(childrenGrid);
          detail.appendChild(childrenSection);
        }
        // Backlinks section
        const backlinks = getBacklinks(card.id);
        if (backlinks.length > 0) {
          const backlinksSection = h('div', { className: 'backlinks-section' });
          backlinksSection.appendChild(h('div', { className: 'section-title' }, `← Referenced By (${backlinks.length})`));
          const backlinksGrid = h('div', { className: 'card-grid' });
          backlinks.forEach(backlink => {
            const backlinkTile = h('div', { 
              className: 'card-tile', 
              onclick: () => goTo('read', { cardId: backlink.id }) 
            });
            backlinkTile.appendChild(h('div', { className: 'card-tile-title' }, backlink.title));
            backlinksGrid.appendChild(backlinkTile);
          });
          backlinksSection.appendChild(backlinksGrid);
          detail.appendChild(backlinksSection);
        }
        
        // Related cards section (based on tags)
        const relatedCards = getRelatedCards(card.id, 5);
        if (relatedCards.length > 0) {
          const relatedSection = h('div', { className: 'related-section' });
          relatedSection.appendChild(h('div', { className: 'section-title' }, `Related Cards (${relatedCards.length})`));
          const relatedGrid = h('div', { className: 'card-grid' });
          relatedCards.forEach(related => {
            const relatedTile = h('div', { 
              className: 'card-tile', 
              onclick: () => goTo('read', { cardId: related.id }) 
            });
            const titleDiv = h('div', { className: 'card-tile-title' }, related.title);
            relatedTile.appendChild(titleDiv);
            // Show matched tags
            const tagsDiv = h('div', { className: 'card-tags' });
            related.matchedTags.forEach(tag => {
              tagsDiv.appendChild(h('span', { className: 'card-tag' }, tag));
            });
            relatedTile.appendChild(tagsDiv);
            relatedGrid.appendChild(relatedTile);
          });
          relatedSection.appendChild(relatedGrid);
          detail.appendChild(relatedSection);
        }
        main.appendChild(detail);
        runModHook('onCardRender', cloneCard(card), detail);
      }

      /**
       * Render card edit form
       */
      function renderEditCard() {
        searchContainer.style.display = 'none';
        const editing = !!navState.cardId;
        const card = editing ? store.cards[navState.cardId] : {
          id: null,
          title: '',
          body: '',
          parentId: navState.parentId,
          children: []
        };
        if (editing && !card) {
          main.appendChild(h('div', { className: 'empty' }, 'Card not found.'));
          return;
        }
        const form = h('form', {
          onsubmit: (e) => {
            e.preventDefault();
            const titleVal = form.querySelector('#cardTitle').value.trim();
            const bodyVal = form.querySelector('#cardBody').value.trim();
            const parentVal = form.querySelector('#cardParent').value || null;
            const tagsVal = (tagEditor.getTags && tagEditor.getTags()) || [];
            if (editing) {
              const oldParentId = card.parentId;
              if (oldParentId !== parentVal) {
                if (oldParentId) {
                  const oldParent = store.cards[oldParentId];
                  if (oldParent) oldParent.children = oldParent.children.filter(c => c !== card.id);
                } else {
                  store.rootOrder = store.rootOrder.filter(c => c !== card.id);
                }
                if (parentVal) {
                  const newParent = store.cards[parentVal];
                  if (newParent && !newParent.children.includes(card.id)) newParent.children.push(card.id);
                } else {
                  if (!store.rootOrder.includes(card.id)) store.rootOrder.push(card.id);
                }
                card.parentId = parentVal;
              }
              updateCard(card.id, { title: titleVal, body: bodyVal, tags: tagsVal, isRichText: richToggle.checked }, true, true);
              card.children.forEach(cid => {
                const inp = childrenInpMap[cid];
                if (inp) updateCard(cid, { title: inp.value.trim() }, true, true);
              });
              const newKidRows = form.querySelectorAll('#addChildList .form-child-row input');
              newKidRows.forEach(inp => {
                const t = inp.value.trim();
                if (t) createCard(t, '', card.id, true, true);
              });
              save();
              runModHook('onCardSave', cloneCard(card), { isNew: false, source: 'update' });
              goTo('read', { cardId: card.id });
            } else {
              const newId = createCard(titleVal, bodyVal, parentVal, true, true);
              store.cards[newId].isRichText = richToggle.checked;
              const newKidRows = form.querySelectorAll('#addChildList .form-child-row input');
              newKidRows.forEach(inp => {
                const t = inp.value.trim();
                if (t) createCard(t, '', newId, true, true);
              });
              save();
              runModHook('onCardSave', cloneCard(store.cards[newId]), { isNew: true, source: 'create' });
              goTo('read', { cardId: newId });
            }
          }
        });
        const formGroup1 = h('div', { className: 'form-group' });
        formGroup1.appendChild(h('label', { className: 'form-label' }, 'Title'));
        formGroup1.appendChild(h('input', { type: 'text', id: 'cardTitle', className: 'form-input', value: card.title, oninput: () => { dirty = true; } }));
        form.appendChild(formGroup1);
        const formGroup2 = h('div', { className: 'form-group' });
        const bodyLabelRow = h('div', { style: 'display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-sm);' });
        bodyLabelRow.appendChild(h('label', { className: 'form-label', style: 'margin-bottom: 0;' }, 'Body'));
        
        // Add upload button for importing text from files (v0.12.3)
        const importBodyBtn = h('button', {
          type: 'button',
          className: 'btn',
          style: 'font-size: var(--text-sm);',
          onclick: function() {
            const fileInput = h('input', { type: 'file', accept: '.txt,.md,.text', style: 'display: none' });
            fileInput.onchange = function(e) {
              const file = e.target.files[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = function(ev) {
                  const currentBody = document.getElementById('cardBody');
                  if (currentBody.value && !confirm('Replace existing content?')) {
                    currentBody.value += '\n\n' + ev.target.result;
                  } else {
                    currentBody.value = ev.target.result;
                  }
                  dirty = true;
                  showToast('Content imported from ' + file.name);
                };
                reader.onerror = function() {
                  showToast('Failed to read file', 'error');
                };
                reader.readAsText(file);
              }
            };
            fileInput.click();
          }
        }, 'Import from File');
        bodyLabelRow.appendChild(importBodyBtn);
        formGroup2.appendChild(bodyLabelRow);
        
        const richToggleRow = h('div', { className: 'form-row' });
        const richToggle = h('input', { type: 'checkbox', id: 'cardRich', checked: card.isRichText });
        const richLabel = h('label', { for: 'cardRich', style: 'margin-left: 6px;' }, 'Enable formatting (Markdown)');
        richToggle.addEventListener('change', () => { dirty = true; });
        richToggleRow.appendChild(richToggle);
        richToggleRow.appendChild(richLabel);
        formGroup2.appendChild(richToggleRow);

        const bodyTextarea = h('textarea', { id: 'cardBody', className: 'form-textarea', 'aria-label': 'Card body' });
        bodyTextarea.value = card.body;
        bodyTextarea.addEventListener('input', () => { dirty = true; });

        const toolbar = h('div', { className: 'rich-toolbar', role: 'toolbar', 'aria-label': 'Formatting toolbar' });
        const applyWrap = (before, after = before) => {
          const start = bodyTextarea.selectionStart;
          const end = bodyTextarea.selectionEnd;
          const selected = bodyTextarea.value.substring(start, end) || 'text';
          const newValue = bodyTextarea.value.slice(0, start) + before + selected + after + bodyTextarea.value.slice(end);
          bodyTextarea.value = newValue;
          bodyTextarea.focus();
          bodyTextarea.selectionStart = start + before.length;
          bodyTextarea.selectionEnd = start + before.length + selected.length;
          dirty = true;
        };
        const addBlockPrefix = (prefix) => {
          const cursor = bodyTextarea.selectionStart;
          const value = bodyTextarea.value;
          const before = value.slice(0, cursor);
          const after = value.slice(cursor);
          const newText = before + `\n${prefix}`;
          bodyTextarea.value = newText + after;
          bodyTextarea.focus();
          dirty = true;
        };
        const buttons = [
          { label: 'B', action: () => applyWrap('**', '**'), aria: 'Bold' },
          { label: 'I', action: () => applyWrap('_', '_'), aria: 'Italic' },
          { label: 'H1', action: () => addBlockPrefix('# '), aria: 'Heading 1' },
          { label: 'H2', action: () => addBlockPrefix('## '), aria: 'Heading 2' },
          { label: 'H3', action: () => addBlockPrefix('### '), aria: 'Heading 3' },
          { label: '• List', action: () => addBlockPrefix('- '), aria: 'Bullet list' }
        ];
        buttons.forEach(btn => {
          const el = h('button', { type: 'button', className: 'btn btn-ghost', 'aria-label': btn.aria, onclick: btn.action });
          el.textContent = btn.label;
          toolbar.appendChild(el);
        });

        formGroup2.appendChild(toolbar);
        formGroup2.appendChild(bodyTextarea);
        form.appendChild(formGroup2);
        // Tags input with autocomplete
        const formGroupTags = h('div', { className: 'form-group' });
        formGroupTags.appendChild(h('label', { className: 'form-label' }, 'Tags (comma-separated)'));
        
        // Create datalist with all existing tags for autocomplete
        const tagsDatalistId = 'tags-datalist-' + Date.now();
        const tagsDatalist = h('datalist', { id: tagsDatalistId });
        const existingTags = getAllTags();
        existingTags.forEach(tag => {
          tagsDatalist.appendChild(h('option', { value: tag }));
        });

        const tagEditor = createTagEditor(card.tags || [], tagsDatalistId);
        tagEditor.addEventListener('focusin', () => { dirty = true; });

        formGroupTags.appendChild(tagEditor);
        formGroupTags.appendChild(tagsDatalist);
        form.appendChild(formGroupTags);
        
        // Add "Suggest Tags" button
        if (editing && card.id) {
          const suggestBtn = h('button', {
            type: 'button',
            className: 'btn btn-secondary',
            onclick: () => showTagSuggestions(card.id),
            style: 'margin-top: var(--space-sm);'
          }, 'Suggest Tags');
          formGroupTags.appendChild(suggestBtn);
        }
    
        const formGroup3 = h('div', { className: 'form-group' });
        formGroup3.appendChild(h('label', { className: 'form-label' }, 'Parent Card'));
        const parentSel = h('select', { id: 'cardParent', className: 'form-select' });
        const parVal = card.parentId || '';
        parentSel.appendChild(h('option', { value: '', selected: !parVal }, '(Root Level)'));
        Object.values(store.cards)
          .filter(c => c.id !== card.id)
          .sort((a, b) => {
            const A = (a.title || '').toLowerCase();
            const B = (b.title || '').toLowerCase();
            return A.localeCompare(B);
          })
          .forEach(c => {
            parentSel.appendChild(h('option', { value: c.id, selected: parVal === c.id }, c.title || '(Untitled)'));
          });
        parentSel.addEventListener('change', () => { dirty = true; });
        formGroup3.appendChild(parentSel);
        form.appendChild(formGroup3);
        let childrenInpMap = {};
        if (editing) {
          const formGroup4 = h('div', { className: 'form-group' });
          formGroup4.appendChild(h('label', { className: 'form-label form-section-title' }, 'Children'));
          const kidsWrap = h('div', { className: 'form-children' });
          card.children.forEach(cid => {
            const c = store.cards[cid];
            const row = h('div', { className: 'form-child-row' });
            const chInp = h('input', { type: 'text', value: c.title, className: 'form-input form-child-input' });
            chInp.addEventListener('input', () => { dirty = true; });
            row.appendChild(chInp);
            const delBtn = h('button', {
              type: 'button',
              className: 'form-child-delete',
              onclick: () => {
                if (confirm('Delete child and all its children?')) {
                  deleteCard(cid);
                  save();
                  render();
                }
              }
            }, '✕');
            row.appendChild(delBtn);
            childrenInpMap[cid] = chInp;
            kidsWrap.appendChild(row);
          });
          formGroup4.appendChild(kidsWrap);
          form.appendChild(formGroup4);
          const formGroup5 = h('div', { className: 'form-group' });
          formGroup5.appendChild(h('label', { className: 'form-label form-section-title' }, 'Add New Children'));
          const newKidsWrap = h('div', { className: 'form-children', id: 'addChildList' });
          const addChildRow = (title = '') => {
            const r = h('div', { className: 'form-child-row' });
            const t = h('input', { type: 'text', value: title, placeholder: 'Child title...', className: 'form-input form-child-input' });
            t.addEventListener('input', () => { dirty = true; });
            const d = h('button', { type: 'button', className: 'form-child-delete', onclick: () => { r.remove(); } }, '✕');
            r.appendChild(t);
            r.appendChild(d);
            newKidsWrap.appendChild(r);
          };
          addChildRow();
          formGroup5.appendChild(newKidsWrap);
          formGroup5.appendChild(h('button', { type: 'button', className: 'btn', onclick: () => addChildRow() }, '+ Add Another Child'));
          form.appendChild(formGroup5);
        } else {
          const formGroup4 = h('div', { className: 'form-group' });
          formGroup4.appendChild(h('label', { className: 'form-label form-section-title' }, 'Add Children Now (title only)'));
          const kidsWrap = h('div', { className: 'form-children', id: 'addChildList' });
          const addChildRow = (title = '') => {
            const r = h('div', { className: 'form-child-row' });
            const t = h('input', { type: 'text', value: title, placeholder: 'Child title...', className: 'form-input form-child-input' });
            t.addEventListener('input', () => { dirty = true; });
            const d = h('button', { type: 'button', className: 'form-child-delete', onclick: () => { r.remove(); } }, '✕');
            r.appendChild(t);
            r.appendChild(d);
            kidsWrap.appendChild(r);
          };
          addChildRow();
          formGroup4.appendChild(kidsWrap);
          formGroup4.appendChild(h('button', { type: 'button', className: 'btn', onclick: () => addChildRow() }, '+ Add Another Child'));
          form.appendChild(formGroup4);
        }
        const formActions = h('div', { className: 'form-actions' });
        formActions.appendChild(h('button', { type: 'submit', className: 'btn btn-primary' }, 'Save'));
        formActions.appendChild(h('button', { type: 'button', className: 'btn', onclick: () => editing ? goTo('read', { cardId: card.id }) : goBack() }, 'Cancel'));
        if (editing) {
          formActions.appendChild(h('button', {
            type: 'button',
            className: 'btn btn-danger',
            onclick: () => {
              if (confirm('Delete this card and all children?')) {
                deleteCard(card.id);
                save();
                goTo('list', { cardId: card.parentId ?? null });
              }
            }
          }, 'Delete'));
        }
        form.appendChild(formActions);
        main.appendChild(h('div', { className: 'page-title' }, editing ? 'Edit Card' : 'New Card'));
        main.appendChild(form);
      }

      /**
       * Render search results page
       */
      function renderSearchResults() {
        searchContainer.style.display = 'none';
        const query = navState.searchQuery.trim();
        if (!query) {
          main.appendChild(h('div', { className: 'empty' }, 'Please enter a search term.'));
          return;
        }
        
        // Get selected dataset scope
        const scope = datasetSelector ? datasetSelector.value : 'current';
        
        // Show loading indicator
        main.appendChild(h('div', { className: 'page-title' }, `Search: "${navState.searchQuery}"`));
        const loadingDiv = h('div', { 
          className: 'search-info',
          style: 'padding: 12px; margin-bottom: 12px; background: var(--bg-secondary); border-radius: 8px; font-size: 14px; color: var(--text-secondary);'
        }, 'Searching...');
        main.appendChild(loadingDiv);
        
        // Use multi-dataset fuzzy search for typo-tolerant results
        fuzzySearchMultiDataset(query, scope).then(fuzzyResults => {
          // Remove loading indicator
          loadingDiv.remove();

          // Apply advanced search filters if present
          try {
            const filtersStr = sessionStorage.getItem('searchFilters');
            if (filtersStr) {
              const filters = JSON.parse(filtersStr);
              
              // Filter by tag
              if (filters.tagFilter) {
                const tagFilterLower = filters.tagFilter.toLowerCase();
                fuzzyResults = fuzzyResults.filter(result => {
                  const card = result.card;
                  return card.tags && card.tags.some(tag => tag.toLowerCase() === tagFilterLower);
                });
              }
              
              // Filter by bookmark status
              if (filters.bookmarkOnly) {
                fuzzyResults = fuzzyResults.filter(result => result.card.bookmarked === true);
              }
              
              // Filter by date
              if (filters.dateFilter) {
                const now = Date.now();
                let startTime = 0;
                
                if (filters.dateFilter === 'today') {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  startTime = today.getTime();
                } else if (filters.dateFilter === 'week') {
                  startTime = now - (7 * 24 * 60 * 60 * 1000);
                } else if (filters.dateFilter === 'month') {
                  startTime = now - (30 * 24 * 60 * 60 * 1000);
                }
                
                fuzzyResults = fuzzyResults.filter(result => {
                  const card = result.card;
                  return (card.createdAt && card.createdAt >= startTime) || 
                         (card.updatedAt && card.updatedAt >= startTime);
                });
              }
              
              // Clear filters after use
              sessionStorage.removeItem('searchFilters');
            }
          } catch (err) {
            console.error('Error applying search filters:', err);
          }

          const hookResults = fuzzyResults.map(result => ({
            ...result,
            card: cloneCard(result.card)
          }));
          runModHook('onSearch', query, hookResults);

          if (fuzzyResults.length === 0) {
            main.appendChild(h('div', { className: 'empty' }, 'No results found. Try different keywords.'));
          } else {
            // Show result count with fuzzy indicator
            const scopeText = scope === 'all' ? ' across all datasets' : '';
            const resultInfo = h('div', {
              className: 'search-info',
              style: 'padding: 12px; margin-bottom: 8px; background: var(--bg-secondary); border-radius: 8px; font-size: 14px; color: var(--text-secondary);'
            }, `Found ${fuzzyResults.length} result${fuzzyResults.length === 1 ? '' : 's'}${scopeText} (fuzzy matching enabled)`);
            main.appendChild(resultInfo);

            // Keyboard navigation hint (v1.0.0)
            const keyboardHint = h('div', {
              className: 'search-keyboard-hint',
              style: 'padding: 8px 12px; margin-bottom: 12px; background: var(--bg-alt, var(--bg-secondary)); border: 1px solid var(--border); border-radius: 6px; font-size: 13px; color: var(--text-secondary); display: flex; align-items: center; gap: 12px;'
            },
              h('span', { style: 'opacity: 0.7;' }, '💡'),
              h('span', {},
                h('kbd', { style: 'background: var(--bg-primary); padding: 2px 6px; border-radius: 4px; border: 1px solid var(--border); font-size: 12px; font-family: monospace;' }, '↑'),
                ' / ',
                h('kbd', { style: 'background: var(--bg-primary); padding: 2px 6px; border-radius: 4px; border: 1px solid var(--border); font-size: 12px; font-family: monospace;' }, '↓'),
                ' to navigate • ',
                h('kbd', { style: 'background: var(--bg-primary); padding: 2px 6px; border-radius: 4px; border: 1px solid var(--border); font-size: 12px; font-family: monospace;' }, 'Enter'),
                ' to open'
              )
            );
            main.appendChild(keyboardHint);
            
            const gridViewEnabled = localStorage.getItem('cardspoke_gridView') === 'true';
            const gridClass = gridViewEnabled ? 'card-grid grid-view' : 'card-grid';
            const grid = h('div', { className: gridClass, role: 'list', id: 'searchResultGrid' });
            searchResultsState = { items: fuzzyResults, elements: [], selectedIndex: 0 };
            const batchSize = 50;
            let renderIndex = 0;
            const renderBatch = () => {
              const frag = document.createDocumentFragment();
              for (let i = renderIndex; i < Math.min(renderIndex + batchSize, fuzzyResults.length); i++) {
                const result = fuzzyResults[i];
                const card = result.card;
                const cardEl = renderCardTile(card, { highlightQuery: query, lazyBody: true });
                cardEl.classList.add('search-result');
                cardEl.dataset.resultIndex = i;
                cardEl.addEventListener('click', () => {
                  searchResultsState.selectedIndex = i;
                  updateSearchSelection(0);
                });

                // Add dataset badge for multi-dataset search
                if (scope === 'all' && result.datasetName) {
                  const datasetBadge = h('span', {
                    style: 'position: absolute; top: 8px; left: 8px; background: #3b82f6; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600;'
                  }, result.datasetName);
                  cardEl.style.position = 'relative';
                  cardEl.appendChild(datasetBadge);
                }

                // Add match quality indicator
                if (result.score < 60) {
                  const matchBadge = h('span', {
                    style: 'position: absolute; top: 8px; right: 8px; background: #fbbf24; color: #000; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600;'
                  }, '~');
                  cardEl.style.position = 'relative';
                  cardEl.appendChild(matchBadge);
                }

                frag.appendChild(cardEl);
                searchResultsState.elements.push(cardEl);
                runModHook('onCardRender', cloneCard(card), cardEl);
              }
              grid.appendChild(frag);
              renderIndex += batchSize;
              updateSearchSelection(0);
            };
            const onScroll = () => {
              if (renderIndex >= fuzzyResults.length) return;
              const threshold = grid.offsetTop + grid.offsetHeight - window.innerHeight * 2;
              if (window.scrollY + window.innerHeight > threshold) {
                requestAnimationFrame(renderBatch);
              }
            };
            renderBatch();
            window.addEventListener('scroll', onScroll, { passive: true });
            registerRenderCleanup(() => window.removeEventListener('scroll', onScroll));
            main.appendChild(grid);
          }
        }).catch(err => {
          loadingDiv.remove();
          main.appendChild(h('div', { className: 'empty' }, 'Search error: ' + err.message));
        });
      }


      /**
       * Main render function - orchestrates page rendering
       */
      function render() {
        try {
          runRenderCleanup();
          renderBreadcrumbs();
          main.innerHTML = '';
          switch (navState.page) {
            case 'read':
              renderReadOnlyCard();
              break;
            case 'list':
              renderCardList();
              break;
            case 'search':
              renderSearchResults();
              break;
            case 'edit':
              renderEditCard();
              break;
            default:
              renderCardList();
          }
        } catch (e) {
          bootError('Render failed: ' + (e.message || e));
        }
      }

      // =============================================================
      // --- THEME MANAGEMENT ---
      // Handle dark/light theme switching
      // =============================================================

      /**
       * Apply theme (light or dark mode)
       * @param {'light'|'dark'} theme - Theme to apply
       */
      function applyTheme(theme) {
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        
        // Save to store for persistence across dataset switches
        store.activeTheme = theme;
        save();
        
        try {
          localStorage.setItem('cardspoke_theme', theme);
        } catch { }
        
        // Sync header button
        const moonIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
        const sunIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
        if (header.themeToggle) header.themeToggle.innerHTML = theme === 'dark' ? sunIcon : moonIcon;
        
        // Run mod hook
        runModHook('onThemeChange', theme);
      }
      
      // =============================================================
      // --- APP FOOTER ---
      // Populate footer with version and attribution information
      // =============================================================
      
      /**
       * Populate footer with app metadata
       * Enhanced with error handling and logging for debugging
       */
      function populateFooter() {
        try {
          const creatorEl = document.getElementById('app-creator');
          const versionEl = document.getElementById('app-version');
          const dateEl = document.getElementById('app-release-date');
          const updaterEl = document.getElementById('app-updater');

          // Verify all elements exist
          if (!creatorEl || !versionEl || !dateEl || !updaterEl) {
            console.error('[Footer] Missing footer elements:', {
              creator: !!creatorEl,
              version: !!versionEl,
              date: !!dateEl,
              updater: !!updaterEl
            });
            return;
          }

          // Populate elements
          creatorEl.textContent = APP_CREATOR;
          versionEl.textContent = APP_VERSION;
          dateEl.textContent = APP_RELEASE_DATE;
          updaterEl.textContent = APP_UPDATER;

          if (isDeveloperMode()) {
            console.log('[Footer] Populated successfully:', {
              creator: APP_CREATOR,
              version: APP_VERSION,
              date: APP_RELEASE_DATE,
              updater: APP_UPDATER
            });
          }
        } catch (error) {
          console.error('[Footer] Error populating footer:', error);
        }
      }

      /**
       * Update dataset selector options
       */
      function updateDatasetSelector() {
        if (!datasetSelector || !datasetManager) return;
        
        // Clear existing options
        datasetSelector.innerHTML = '';
        
        // Add "Current Dataset" option
        const currentOption = document.createElement('option');
        currentOption.value = 'current';
        currentOption.textContent = 'Current Dataset';
        datasetSelector.appendChild(currentOption);
        
        // Add "All Datasets" option if there are multiple datasets
        const datasets = datasetManager.listDatasets();
        if (datasets.length > 1) {
          const allOption = document.createElement('option');
          allOption.value = 'all';
          allOption.textContent = 'All Datasets';
          datasetSelector.appendChild(allOption);
          
          // Add separator
          const separator = document.createElement('option');
          separator.disabled = true;
          separator.textContent = '───────────';
          datasetSelector.appendChild(separator);
          
          // Add individual dataset options
          datasets.forEach(dataset => {
            const option = document.createElement('option');
            option.value = dataset.id;
            option.textContent = dataset.name + (dataset.isActive ? ' (active)' : '');
            datasetSelector.appendChild(option);
          });
        }
      }

      // =============================================================
      // --- INITIALIZATION & EVENT LISTENERS ---
      // Set up event handlers for user interactions
      // =============================================================

      // Initialize theme
      const savedTheme = store.activeTheme || localStorage.getItem('cardspoke_theme') || 'light';
      applyTheme(savedTheme);

      // --- Header Button Handlers ---
      
      header.themeToggle.onclick = () => {
        const isDark = document.documentElement.classList.contains('dark');
        applyTheme(isDark ? 'light' : 'dark');
      };
      
      // Apply saved high contrast mode on startup
      const savedHC = localStorage.getItem('cardspoke_highcontrast') === 'true';
      if (savedHC) document.documentElement.classList.add('high-contrast');
      
      // --- Menu Handlers ---
      
      // Focus trap cleanup function
      let menuFocusTrapCleanup = null;
      
      header.menuBtn.onclick = () => {
        menu.overlay.classList.add('show');
        // Show/hide developer section based on developer mode
        if (menu.developerSection) {
          menu.developerSection.style.display = isDeveloperMode() ? 'block' : 'none';
        }
        // Set up focus trap for accessibility
        menuFocusTrapCleanup = trapFocus(menu.overlay.querySelector('.menu-panel'));
      };

      menu.closeBtn.onclick = () => {
        menu.overlay.classList.remove('show');
        if (menuFocusTrapCleanup) {
          menuFocusTrapCleanup();
          menuFocusTrapCleanup = null;
        }
      };

      menu.overlay.onclick = (e) => {
        if (e.target === menu.overlay) {
          menu.overlay.classList.remove('show');
          if (menuFocusTrapCleanup) {
            menuFocusTrapCleanup();
            menuFocusTrapCleanup = null;
          }
        }
      };

      menu.newCard.onclick = () => {
        menu.overlay.classList.remove('show');
        goTo('edit', { cardId: null, parentId: null });
      };

      menu.upload.onclick = () => {
        menu.overlay.classList.remove('show');
        updateImportLocationOptions();
        
        // Reset JSON import to root
        if (uploadModal.importLocationSelectJSON) {
          uploadModal.importLocationSelectJSON.value = 'root';
        }
        
        // Reset TXT import to root and outline
        if (uploadModal.importLocationSelectTXT) {
          uploadModal.importLocationSelectTXT.value = 'root';
        }
        const txtOutlineRadio = document.querySelector('input[name="txtImportMode"][value="outline"]');
        if (txtOutlineRadio) txtOutlineRadio.checked = true;

        // Restore last used tab or default to json
        const lastTab = localStorage.getItem('cardspoke_lastUploadTab') || 'json';
        uploadModal.tabs.forEach(t => t.classList.remove('active'));
        uploadModal.tabContents.forEach(content => content.classList.remove('active'));
        const tabToActivate = document.querySelector(`.modal-tab[data-tab="${lastTab}"]`) || document.querySelector('.modal-tab[data-tab="json"]');
        const contentToActivate = document.getElementById(`tab-${lastTab}`) || document.getElementById('tab-json');
        if (tabToActivate) tabToActivate.classList.add('active');
        if (contentToActivate) contentToActivate.classList.add('active');
        
        // Show modal
        uploadModal.overlay.classList.add('show');
      };

      menu.modManager.onclick = () => {
        menu.overlay.classList.remove('show');
        showModManager('installed');
      };

      if (menu.tagManager) {
        menu.tagManager.onclick = () => {
          menu.overlay.classList.remove('show');
          showTagManager();
        };
      }

      if (menu.advancedSearch) {
        menu.advancedSearch.onclick = () => {
          menu.overlay.classList.remove('show');
          showAdvancedSearch();
        };
      }

      if (menu.trashBin) {
        menu.trashBin.onclick = () => {
          menu.overlay.classList.remove('show');
          showTrashBin();
        };
      }

      menu.appearance.onclick = () => {
        menu.overlay.classList.remove('show');
        showAppearanceSettings();
      };

      menu.bookmarks.onclick = () => {
        menu.overlay.classList.remove('show');
        showBookmarks();
      };

      menu.recentCards.onclick = () => {
        menu.overlay.classList.remove('show');
        showRecentCards();
      };

      if (menu.typography) {
        menu.typography.onclick = () => {
          menu.overlay.classList.remove('show');
          showTypographySelector();
        };
      }

      menu.dataHub.onclick = () => {
        menu.overlay.classList.remove('show');
        showDatasetInfo();
      };

      menu.clearAll.onclick = () => {
        menu.overlay.classList.remove('show');
        clearAllData();
      };

      menu.gettingStarted.onclick = () => {
        menu.overlay.classList.remove('show');
        showGettingStarted();
      };

      menu.help.onclick = () => {
        menu.overlay.classList.remove('show');
        showHelp();
      };

      menu.keyboardShortcuts.onclick = () => {
        menu.overlay.classList.remove('show');
        showKeyboardHelp();
      };

      if (menu.developerConsole) {
        menu.developerConsole.onclick = () => {
          menu.overlay.classList.remove('show');
          showDeveloperConsole();
        };
      }

      const debouncedNavigateSearch = debounce((query) => {
        if (query) {
          goTo('search', { searchQuery: query });
        }
      }, 180);

      function updateSearchSelection(delta = 0) {
        if (!searchResultsState.items.length) return;
        const max = searchResultsState.items.length - 1;
        const next = Math.min(max, Math.max(0, searchResultsState.selectedIndex + delta));
        searchResultsState.selectedIndex = next;
        searchResultsState.elements.forEach((el, idx) => {
          if (idx === next) el.classList.add('search-result-selected');
          else el.classList.remove('search-result-selected');
        });
        const active = searchResultsState.elements[next];
        if (active) active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }

      function openSelectedSearchResult() {
        if (!searchResultsState.items.length) return;
        const target = searchResultsState.items[searchResultsState.selectedIndex];
        if (target?.card?.id) goTo('read', { cardId: target.card.id });
      }

      header.homeBtn.onclick = () => {
        goTo('list', { cardId: null });
      };

      header.brandBtn.onclick = () => {
        goTo('list', { cardId: null });
      };

      header.undoBtn.onclick = () => {
        undo();
      };

      searchInput.addEventListener('input', (e) => {
        if (e.target.value.trim()) {
          searchClear.style.display = 'block';
        } else {
          searchClear.style.display = 'none';
        }
        if (navState.page === 'search') {
          debouncedNavigateSearch(e.target.value.trim());
        }
      });

      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && searchInput.value.trim()) {
          if (navState.page === 'search' && searchResultsState.items.length) {
            e.preventDefault();
            openSelectedSearchResult();
            return;
          }
          goTo('search', { searchQuery: searchInput.value.trim() });
        }
        if (navState.page === 'search' && searchResultsState.items.length) {
          if (e.key === 'ArrowDown') { e.preventDefault(); updateSearchSelection(1); }
          if (e.key === 'ArrowUp') { e.preventDefault(); updateSearchSelection(-1); }
        }
      });

      searchClear.onclick = () => {
        searchInput.value = '';
        searchClear.style.display = 'none';
        if (navState.page === 'search') goBack();
      };

      uploadModal.tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          const tabName = tab.getAttribute('data-tab');
          uploadModal.tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          uploadModal.tabContents.forEach(content => content.classList.remove('active'));
          document.getElementById(`tab-${tabName}`).classList.add('active');
          // Remember last used tab
          localStorage.setItem('cardspoke_lastUploadTab', tabName);
        });
      });

      uploadModal.closeBtn.onclick = () => {
        uploadModal.overlay.classList.remove('show');
      };

      uploadModal.overlay.onclick = (e) => {
        if (e.target === uploadModal.overlay) {
          uploadModal.overlay.classList.remove('show');
        }
      };

      uploadModal.fileUploadAreaJSON.onclick = () => {
        uploadModal.fileInputJSON.click();
      };

      uploadModal.fileInputJSON.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const data = JSON.parse(reader.result);
            const mode = uploadModal.importLocationSelectJSON.value || 'root';
            importJSON(data, mode);
            uploadModal.overlay.classList.remove('show');
          } catch (err) {
            showToast('Failed to parse JSON: ' + err.message, 'error');
          }
        };
        reader.readAsText(file);
      });

      uploadModal.fileUploadAreaTXT.onclick = () => {
        uploadModal.fileInputTXT.click();
      };

      uploadModal.fileInputTXT.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          const text = reader.result;
          const modeRadio = document.querySelector('input[name="txtImportMode"]:checked');
          const mode = modeRadio ? modeRadio.value : 'outline';
          const location = uploadModal.importLocationSelectTXT.value || 'root';
          importTXT(text, mode, location);
          uploadModal.overlay.classList.remove('show');
        };
        reader.readAsText(file);
      });

      uploadModal.fileUploadAreaMods.onclick = () => {
        uploadModal.fileInputMods.click();
      };

      uploadModal.fileInputMods.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          try {
            let modData;
            if (file.name.endsWith('.json')) {
              modData = JSON.parse(reader.result);
            } else if (file.name.endsWith('.js')) {
              const modId = prompt('Enter mod ID:', file.name.replace('.js', ''));
              if (!modId) return;
              modData = {
                id: modId,
                js: reader.result,
                css: '',
                meta: { name: modId } // Basic meta
              };
            }
            if (modData) {
              // Extract mod ID from JS code if not provided
              let modId = modData.id;
              if (!modId && modData.js) {
                // Try to extract ID from CardSpoke_MODS.register('id', ...) call
                const registerMatch = modData.js.match(/CardSpoke_MODS\.register\s*\(\s*['"]([^'"]+)['"]/);
                if (registerMatch) {
                  modId = registerMatch[1];
                }
              }
              if (!modId) {
                modId = uid(); // Fallback to random ID if extraction fails
              }

              store.mods[modId] = {
                enabled: !!modData.enabled, // Preserve enabled field from JSON
                js: modData.js || '',
                css: modData.css || '',
                meta: modData.meta || { name: modId } // Ensure meta exists
              };
              save();

              // If mod is enabled, sync it immediately
              if (modData.enabled && window.CardSpoke && window.CardSpoke.mods) {
                window.CardSpoke.mods.syncFromStore();
                window.CardSpoke.mods.runHook('onLoad');
              }

              showToast('Mod installed: ' + (modData.meta.name || modId));
              uploadModal.overlay.classList.remove('show');
            }
          } catch (err) {
            showToast('Failed to install mod: ' + err.message, 'error');
          }
        };
        reader.readAsText(file);
      });

      uploadModal.installManualMod.onclick = () => {
        const modName = uploadModal.manualModName.value.trim();
        const modJS = uploadModal.manualModJS.value.trim();
        const modCSS = uploadModal.manualModCSS.value.trim();
        
        // *** ADDED: Get new meta values ***
        const modCreator = uploadModal.manualModCreator.value.trim();
        const modVersion = uploadModal.manualModVersion.value.trim();
        const modReleaseDate = uploadModal.manualModReleaseDate.value.trim();

        if (!modName || !modJS) {
          showToast('Please provide mod name and JS code', 'error');
          return;
        }

        // Extract mod ID from JS code, fallback to sanitized name
        let modId;
        const registerMatch = modJS.match(/CardSpoke_MODS\.register\s*\(\s*['"]([^'"]+)['"]/);
        if (registerMatch) {
          modId = registerMatch[1];
        } else {
          modId = modName.replace(/\s+/g, '-').toLowerCase();
        }

        store.mods[modId] = {
          enabled: false,
          js: modJS,
          css: modCSS,
          meta: { // *** ADDED: Save new meta fields ***
            name: modName,
            creator: modCreator,
            version: modVersion,
            releaseDate: modReleaseDate
          }
        };
        save();
        showToast('Mod installed: ' + modName);
        uploadModal.overlay.classList.remove('show');
        
        // *** ADDED: Clear new fields ***
        uploadModal.manualModName.value = '';
        uploadModal.manualModCreator.value = '';
        uploadModal.manualModVersion.value = '';
        uploadModal.manualModReleaseDate.value = '';
        uploadModal.manualModJS.value = '';
        uploadModal.manualModCSS.value = '';
      };



      // =============================================================
