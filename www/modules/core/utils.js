/*
 * Copyright 2026 Jeffrey Guntly (JX Holdings, LLC)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


/**
 * CardSpoke Utility Functions
 * Version: 0.16.0
 * 
 * Core utility functions used throughout the application
 */

/**
 * Helper function to create DOM elements
 * @param {string} tag - HTML tag name
 * @param {Object} props - Element properties and attributes
 * @param {...(string|HTMLElement)} children - Child elements or text
 * @returns {HTMLElement} Created DOM element
 */
export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  Object.entries(props).forEach(([k, v]) => {
    if (k === 'className') el.className = v;
    else if (k === 'onclick') el.onclick = v;
    else if (k === 'onsubmit') el.onsubmit = v;
    else if (k === 'style') el.style.cssText = v;
    else if (k === 'oninput') el.oninput = v;
    else if (k === 'onchange') el.onchange = v;
    else if (k === 'selected' || k === 'disabled' || k === 'checked' || k === 'readonly') {
      if (v) el.setAttribute(k, '');
    }
    else if (v !== false && v !== null && v !== undefined) el.setAttribute(k, v);
  });
  children.flat().forEach(ch => {
    if (typeof ch === 'string') el.appendChild(document.createTextNode(ch));
    else if (ch) el.appendChild(ch);
  });
  return el;
}

/**
 * Generate unique ID based on timestamp and random string
 * @returns {string} Unique identifier
 */
export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Debounce function - delays execution until after wait time has elapsed
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Normalize and split tag input
 * @param {string} raw - Raw tag input string
 * @returns {string[]} Array of normalized tags
 */
export function normalizeTagInput(raw) {
  if (!raw) return [];
  return raw
    .split(/[\s,]+/)
    .map(tag => tag.replace(/^#/, '').toLowerCase().trim())
    .filter(Boolean);
}

/**
 * Escape HTML special characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
export function escapeHtml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Highlight matched query terms within text
 * @param {string} text - Text to highlight in
 * @param {string} query - Search query
 * @returns {HTMLElement|Text} Element with highlighted matches
 */
export function highlightText(text, query) {
  if (!query || !text) return document.createTextNode(text || '');
  const terms = query.split(/\s+/).filter(Boolean).map(t => t.toLowerCase());
  if (!terms.length) return document.createTextNode(text);
  let html = escapeHtml(text);
  terms.forEach(term => {
    const safeTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    html = html.replace(new RegExp(safeTerm, 'gi'), match => `<mark>${match}</mark>`);
  });
  const span = document.createElement('span');
  span.innerHTML = html;
  return span;
}

/**
 * Clone a card object deeply to avoid reference issues
 * @param {Object} card - Card object to clone
 * @returns {Object|null} Cloned card object or null
 */
export function cloneCard(card) {
  if (!card) return null;
  let modsData = {};
  if (card.modsData) {
    try {
      modsData = JSON.parse(JSON.stringify(card.modsData));
    } catch (err) {
      modsData = { ...card.modsData };
    }
  }
  return {
    ...card,
    children: Array.isArray(card.children) ? card.children.slice() : [],
    modsData
  };
}

/**
 * Focus trapping for accessibility
 * @param {HTMLElement} modal - Modal element to trap focus in
 * @returns {Function} Cleanup function to remove trap
 */
export function trapFocus(modal) {
  const focusableElements = modal.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];
  
  const handleKeyDown = (e) => {
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
  };
  
  modal.addEventListener('keydown', handleKeyDown);
  
  if (firstFocusable) {
    firstFocusable.focus();
  }
  
  return () => {
    modal.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Simple markdown to HTML conversion
 * @param {string} text - Markdown text
 * @returns {string} HTML string
 */
export function simpleMarkdown(text) {
  if (!text) return '';
  
  var html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // Headers
  html = html.replace(/^### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^## (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^# (.+)$/gm, '<h2>$1</h2>');
  
  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  // Code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Lists
  html = html.replace(/^\* (.+)$/gm, '<li>$1</li>');
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  
  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
  
  // Line breaks
  html = html.replace(/\n\n/g, '</p><p>');
  html = '<p>' + html + '</p>';
  
  return html;
}

/**
 * Format bytes into human readable string
 * @param {number} bytes - Number of bytes
 * @returns {string} Formatted string
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
