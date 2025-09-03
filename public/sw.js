// Empty service worker to prevent 404 errors
// This file exists only to stop browser requests for sw.js

self.addEventListener('install', () => {
  // Do nothing
});

self.addEventListener('fetch', () => {
  // Do nothing
});