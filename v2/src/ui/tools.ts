// Map-screen utility overlays: Save Code (backup/restore — iPhones can silently
// wipe browser storage after ~7 days unused, this is the insurance) and the
// Players picker (siblings share a device, each kid gets their own world).

import { SaveV2 } from '../core/types';
import { exportCode, importCode, loadProfiles, createProfile, setActive, writeSave } from '../core/save';
import { sfx } from '../core/sfx';

export function openSaveCode(host: HTMLElement, save: SaveV2, onClose: () => void) {
  const wrap = document.createElement('div');
  wrap.className = 'gpanel';
  wrap.innerHTML = `
    <div class="gtitle">Save Code</div>
    <div class="gbody">This code IS your whole game. Copy it somewhere safe (a note, a text to a grown-up). Paste a code below to bring a game back.</div>
    <textarea class="gcode" readonly>${exportCode(save)}</textarea>
    <div class="growbtns"><button class="gbtn gcopy">📋 Copy</button></div>
    <div class="gbody">Restore from a code:</div>
    <textarea class="gcode gpaste" placeholder="paste a save code here"></textarea>
    <div class="growbtns"><button class="gbtn grestore">Restore</button><button class="gbtn gclose">Back</button></div>
    <div class="gbody gmsg"></div>`;
  host.appendChild(wrap);

  const msg = wrap.querySelector('.gmsg') as HTMLElement;
  (wrap.querySelector('.gcopy') as HTMLButtonElement).onclick = async () => {
    try {
      await navigator.clipboard.writeText(exportCode(save));
      msg.textContent = 'Copied! ✓';
    } catch {
      (wrap.querySelector('.gcode') as HTMLTextAreaElement).select();
      msg.textContent = 'Select the code and copy it.';
    }
    sfx.win();
  };
  (wrap.querySelector('.grestore') as HTMLButtonElement).onclick = () => {
    const code = (wrap.querySelector('.gpaste') as HTMLTextAreaElement).value;
    const restored = importCode(code);
    if (restored) {
      const idx = loadProfiles();
      const id = idx.active || 'p1';
      writeSave(id, restored);
      sfx.fanfare();
      msg.textContent = 'Restored! Reloading...';
      setTimeout(() => location.reload(), 800);
    } else {
      sfx.buzz();
      msg.textContent = 'That code didn’t work — check it copied completely.';
    }
  };
  (wrap.querySelector('.gclose') as HTMLButtonElement).onclick = () => { wrap.remove(); onClose(); };
}

export function openPlayers(host: HTMLElement, onClose: () => void) {
  const idx = loadProfiles();
  const wrap = document.createElement('div');
  wrap.className = 'gpanel';
  wrap.innerHTML = `
    <div class="gtitle">Who’s playing?</div>
    <div class="gplist">${idx.profiles.map(p =>
      `<button class="gbtn gprof${p.id === idx.active ? ' active' : ''}" data-id="${p.id}">👤 ${p.name}${p.id === idx.active ? ' ✓' : ''}</button>`).join('')}
    </div>
    <div class="growbtns"><button class="gbtn gnew">＋ New player</button><button class="gbtn gclose">Back</button></div>
    <div class="gbody">Each player gets their own buddy, stars and progress.</div>`;
  host.appendChild(wrap);

  wrap.querySelectorAll<HTMLButtonElement>('.gprof').forEach(b => {
    b.onclick = () => {
      setActive(b.dataset.id!);
      sfx.win();
      location.reload(); // cleanest scene reset into the chosen save
    };
  });
  (wrap.querySelector('.gnew') as HTMLButtonElement).onclick = () => {
    createProfile('');
    sfx.fanfare();
    location.reload(); // boots into the intro for the fresh profile
  };
  (wrap.querySelector('.gclose') as HTMLButtonElement).onclick = () => { wrap.remove(); onClose(); };
}
