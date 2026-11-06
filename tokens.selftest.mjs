// node tokens.selftest.mjs : groupTag colours (--tb bg / --tf text) reach AA (≥4.5:1) for every tổ colour in light and dark.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { contrast } from './js/notes/subjects.js';

// COLOR_IDS from js/ui/form.js (read as text: form.js needs the DOM)
const COLOR_IDS = JSON.parse(/COLOR_IDS = (\[[^\]]*\])/.exec(readFileSync(new URL('./js/ui/form.js', import.meta.url), 'utf8'))[1].replace(/'/g, '"'));
assert.equal(COLOR_IDS.length, 8);
const css = readFileSync(new URL('./css/tokens.css', import.meta.url), 'utf8');
const pick = (sel, v) => {
  const m = new RegExp(sel.replace(/[[\]().]/g, '\\$&') + '\\{[^}]*--' + v + ':(#[0-9A-Fa-f]{6})').exec(css);
  assert.ok(m, `missing ${v} for ${sel}`); return m[1];
};
let n = 0;
for (const c of COLOR_IDS) for (const [theme, sel] of [['light', `.g-${c}`], ['dark', `[data-theme=dark] .g-${c}`]]) {
  const bg = pick(sel, 'tb'), fg = pick(sel, 'tf'), r = contrast(bg, fg);
  assert.ok(r >= 4.5, `groupTag ${c} ${theme}: ${fg} on ${bg} = ${r.toFixed(2)}`); n++;
}
console.log(`tokens selftest OK (${n} tổ colour × theme pairs ≥ 4.5:1)`);
