// Profiles + persistence. Several kids can share one device (siblings):
// each profile gets an isolated save. The v1 single save ('pixelrealm')
// migrates into profile p1 on first boot — name, BYTE, badges, stars,
// introDone all survive.

import { SaveV2, freshSave, DEFAULT_BUDDY } from './types';

const PROFILES_KEY = 'smw:profiles';
const SAVE_PREFIX = 'smw:save:';
const V1_KEY = 'pixelrealm';

export interface ProfileMeta { id: string; name: string; createdAt: number }
interface ProfileIndex { v: 1; active: string | null; profiles: ProfileMeta[] }

function readJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch { return null; }
}

function writeJSON(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* quota errors must never crash play */ }
}

export function loadProfiles(): ProfileIndex {
  let idx = readJSON<ProfileIndex>(PROFILES_KEY);
  if (!idx) {
    idx = { v: 1, active: null, profiles: [] };
    // one-time v1 migration: wrap the old single save as profile p1
    const v1 = readJSON<Record<string, unknown>>(V1_KEY);
    if (v1) {
      const save = migrateV1(v1);
      const meta: ProfileMeta = { id: 'p1', name: save.player.name || 'PLAYER', createdAt: Date.now() };
      idx.profiles.push(meta);
      idx.active = 'p1';
      writeJSON(SAVE_PREFIX + 'p1', save);
      // v1 key intentionally left in place as a backup until v2 is proven in the wild
    }
    writeJSON(PROFILES_KEY, idx);
  }
  return idx;
}

export function migrateV1(v1: Record<string, unknown>): SaveV2 {
  const s = freshSave();
  const player = v1.player as { name?: string } | undefined;
  if (player?.name) s.player.name = String(player.name);
  const buddy = v1.buddy as Record<string, string> | undefined;
  if (buddy) {
    for (const k of ['form', 'eyes', 'color', 'marks', 'name'] as const) {
      if (typeof buddy[k] === 'string' && buddy[k]) s.buddy[k] = buddy[k];
    }
  } else {
    s.buddy = { ...DEFAULT_BUDDY };
  }
  if (Array.isArray(v1.badges)) s.badges = (v1.badges as unknown[]).filter((b): b is number => typeof b === 'number');
  if (v1.stars && typeof v1.stars === 'object') s.stars = { ...(v1.stars as Record<string, boolean>) };
  if (v1.choices && typeof v1.choices === 'object') s.choices = { ...(v1.choices as Record<string, string>) };
  s.introDone = Boolean(v1.introDone) || s.badges.includes(1); // Spark badge = intro was finished
  return s;
}

export function createProfile(name: string): ProfileMeta {
  const idx = loadProfiles();
  const id = 'p' + (Math.max(0, ...idx.profiles.map(p => parseInt(p.id.slice(1), 10) || 0)) + 1);
  const meta: ProfileMeta = { id, name, createdAt: Date.now() };
  idx.profiles.push(meta);
  idx.active = id;
  writeJSON(PROFILES_KEY, idx);
  writeJSON(SAVE_PREFIX + id, freshSave(name));
  return meta;
}

export function setActive(id: string) {
  const idx = loadProfiles();
  if (idx.profiles.some(p => p.id === id)) {
    idx.active = id;
    writeJSON(PROFILES_KEY, idx);
  }
}

export function loadSave(id: string): SaveV2 {
  const s = readJSON<SaveV2>(SAVE_PREFIX + id);
  if (s && s.v === 2) {
    // tolerate older blobs missing newer fields
    const base = freshSave(s.player?.name || '');
    return { ...base, ...s, mastery: { ...base.mastery, ...(s.mastery || {}) }, rpg: { ...base.rpg, ...(s.rpg || {}) }, inv: { ...base.inv, ...(s.inv || {}) } };
  }
  return freshSave();
}

export function writeSave(id: string, save: SaveV2) {
  writeJSON(SAVE_PREFIX + id, save);
}

// "Save Code" insurance: iOS Safari silently evicts site storage after ~7 days
// of disuse. A copyable code lets any wiped save be restored from a paste.
export function exportCode(save: SaveV2): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(save))));
}

export function importCode(code: string): SaveV2 | null {
  try {
    const parsed = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
    if (parsed && parsed.v === 2 && parsed.player) return parsed as SaveV2;
    return null;
  } catch { return null; }
}
