// Capacitor initialization
import { Capacitor } from '@capacitor/core';

// Initialize Capacitor when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('Capacitor platform:', Capacitor.getPlatform());
  console.log('Capacitor native:', Capacitor.isNativePlatform());
});

// Make Capacitor available globally for the app
window.Capacitor = Capacitor;
