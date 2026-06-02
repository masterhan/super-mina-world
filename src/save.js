/* save.js — the ONLY place that touches the browser's on-device storage.
   Everything (name, BYTE, badges, progress, chosen next-build) goes through
   here, so a real backend could swap in later without touching game logic.
   Fails silently if storage is unavailable (private mode, etc.). */
window.PR = window.PR || {};

PR.save = {
  KEY: 'pixelrealm',

  load() {
    try { return JSON.parse(localStorage.getItem(this.KEY)) || null; }
    catch (e) { return null; }
  },

  write(data) {
    try { localStorage.setItem(this.KEY, JSON.stringify(data)); }
    catch (e) { /* storage blocked — game still works, just won't remember */ }
  },

  clear() {
    try { localStorage.removeItem(this.KEY); }
    catch (e) {}
  }
};
