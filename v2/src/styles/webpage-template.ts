// The <style> block for the standalone .html page that webbuilder's
// ⬇ SAVE MY PAGE generates (ported from v1 webbuilder.js download()).
// Lives in src/styles with the rest of the game's look: the generated file is
// self-contained, so it names the game's own fonts (VT323 / Press Start 2P)
// literally and loads them itself via Google Fonts.
export function webpageStyle(bg: string, glow: string): string {
  return (
    'html,body{height:100%;margin:0}body{background:' + bg + ';color:#fff;font-family:VT323,monospace;' +
    'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;text-align:center;transition:.4s}' +
    'h1{font-family:"Press Start 2P",monospace;font-size:22px;line-height:1.6}#pic{font-size:96px;transition:.25s}' +
    'button{font-family:VT323,monospace;font-size:28px;padding:14px 30px;border:none;border-radius:12px;cursor:pointer;' +
    'background:' + glow + ';color:#06080f;box-shadow:0 6px 0 #0005}.by{font-size:18px;opacity:.7}'
  );
}
