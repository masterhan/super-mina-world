// Buddy color helpers — her chosen color follows BYTE everywhere
// (sprite tint in the world, glow in the UI).

export const BUDDY_HEX: Record<string, number> = {
  cyan: 0x3df2ff,
  violet: 0x9b3bff,
  magenta: 0xff3da6,
  gold: 0xffd24a
};

export const BUDDY_CSS: Record<string, string> = {
  cyan: '#3df2ff',
  violet: '#9b3bff',
  magenta: '#ff3da6',
  gold: '#ffd24a'
};

export function buddyTint(color: string): number {
  return BUDDY_HEX[color] ?? BUDDY_HEX.cyan;
}
