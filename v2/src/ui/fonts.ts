// Font definitions + canvas text-style helpers (NON-jits personal game — its
// own design system on purpose). Scenes never spell out fonts; they call T.*.
// Press Start 2P = titles/numbers, VT323 = body, monospace = matrix glyphs.

const TITLE = '"Press Start 2P"';
const BODY = 'VT323, monospace';
const GLYPH = 'monospace';

export const T = {
  title(size: number, color = '#dfe9ff') {
    return { fontFamily: TITLE, fontSize: size + 'px', color };
  },
  body(size: number, color = '#dfe9ff') {
    return { fontFamily: BODY, fontSize: size + 'px', color };
  },
  glyph(size: number, color = '#3df2ff') {
    return { fontFamily: GLYPH, fontSize: size + 'px', color };
  },
  emoji(size: number) {
    return { fontSize: size + 'px' };
  }
};
