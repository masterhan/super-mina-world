// The HTML overlay — a plain div stacked over the game canvas. All text-heavy
// UI (dialogue, menus, question cards, HP bars) lives here in real DOM at native
// resolution (crisp fonts), while Phaser owns the pixel-art world underneath.
// This is the v1 pattern (#layer over canvas) carried forward on purpose.

let root: HTMLElement | null = null;

export function uiRoot(): HTMLElement {
  if (!root) {
    root = document.createElement('div');
    root.id = 'ui';
    document.body.appendChild(root);
  }
  return root;
}

// Each scene takes a fresh layer; switching scenes clears the old one.
export function uiLayer(name: string): HTMLElement {
  const r = uiRoot();
  const existing = r.querySelector(`[data-layer="${name}"]`);
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.dataset.layer = name;
  el.className = 'uilayer';
  r.appendChild(el);
  return el;
}

export function clearLayer(name: string) {
  uiRoot().querySelector(`[data-layer="${name}"]`)?.remove();
}

export function clearAllLayers() {
  uiRoot().innerHTML = '';
}
