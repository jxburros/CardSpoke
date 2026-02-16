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
 * CardSpoke Toast Notifications
 * Version: 0.16.0
 * 
 * Toast notification system for user feedback
 */

import { h } from '../core/utils.js';

let toastContainer = null;

/**
 * Initialize toast container
 */
export function initToast() {
  toastContainer = document.getElementById('toastContainer');
}

/**
 * Show a toast notification with auto-dismiss and pause on hover
 * @param {string} message - Message to display
 * @param {string} type - Toast type: 'success', 'error', 'warning', 'info'
 * @param {number} duration - Duration in milliseconds (default: 3000)
 */
export function showToast(message, type = 'success', duration = 3000) {
  if (!toastContainer) {
    toastContainer = document.getElementById('toastContainer');
  }
  if (!toastContainer) {
    console.warn('[Toast] Container not found');
    return;
  }

  const toast = h('div', { 
    className: `toast ${type}`,
    role: 'alert',
    'aria-live': type === 'error' ? 'assertive' : 'polite',
    'aria-atomic': 'true',
    tabindex: '0'
  }, message);
  toastContainer.appendChild(toast);
  
  let timeoutId = null;
  let isPaused = false;
  let remainingTime = duration;
  let startTime = Date.now();
  
  const scheduleRemoval = () => {
    startTime = Date.now();
    timeoutId = setTimeout(() => {
      if (!isPaused) {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
      }
    }, remainingTime);
  };
  
  const pauseTimer = () => {
    if (!isPaused && timeoutId) {
      clearTimeout(timeoutId);
      remainingTime -= (Date.now() - startTime);
      isPaused = true;
    }
  };
  
  const resumeTimer = () => {
    if (isPaused) {
      isPaused = false;
      scheduleRemoval();
    }
  };
  
  toast.addEventListener('mouseenter', pauseTimer);
  toast.addEventListener('mouseleave', resumeTimer);
  
  // Add click to dismiss
  toast.style.cursor = 'pointer';
  const dismissToast = () => {
    clearTimeout(timeoutId);
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  };
  
  toast.addEventListener('click', dismissToast);
  
  // Add keyboard support
  toast.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Enter') {
      e.preventDefault();
      dismissToast();
    }
  });
  
  scheduleRemoval();
}
