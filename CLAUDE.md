# aaba — notes for Claude
Class tổ-points PWA (lớp 11A3). Vanilla ES modules, no build step, no npm deps, Firebase (Firestore + anon auth), GitHub Pages. All UI copy Vietnamese (terms: PROGRESS.md "Terms").
Start by skimming PROGRESS.md top (latest DONE block) + "Terms" + "Week model". Do not explore the whole repo; grep -n + Read with offset/limit.

## File map
- Shell/nav: js/app.js (NAV array, phone bar 3·(+)·3), js/router.js (routes, guards), index.html (CSS order), sw.js (`CACHE`, bump on every release).
- Data: js/data/store.js (only data API for views: addEntry/addEntries/editEntry/voidEntry/approveEntry…), js/data/weekstore.js (week queries, outbox: one item = one batch), adapter.firebase.js / adapter.local.js (same API), seed.js. js/config.js `BACKEND` ('firebase' live; 'local' = demo data, `?role=admin|teacher|recorder|student|guest`).
- Permissions: js/session.js `can()` ('record','approve','void','backdate','purge','manage','edit',…), `role()`.
- UI kit: js/ui/dom.js `h()`/`put()`, components.js (entryRow, entrySheet, groupTag, live(), pageHeader, emptyState), sheet.js (openSheet: pinned head, scrolling .sheet-body), act.js (`act(fn,{btn,ok})`, errMsg, saved), toast.js, form.js (confirmSheet, formSheet), draft.js (hand-over to Ghi điểm).
- Views: js/views/{home,feed(Nhật ký),group,add(+add-date,add-done),me(+me-parts),review,rules}.js, tongket/, notes in js/notes/, chieu/ (slideshow), admin/, dev/.
- CSS: tokens.css (colours, tổ --gc/--gt/--go/--tb/--tf), base, layout (nav/rail), components, phone.css (<600px density), weeks, appearance.css (accent + Liquid Glass off/lite/full, loaded last), notes.css (lazy).
- Week math: js/weeks.js (pure, VN = fixed UTC+7).

## Conventions
- Files ≲200 lines; split rather than grow (store.js is already over: don't add more there).
- Build DOM with h()/put(); async buttons via act(); feedback via toast(); never write Firestore from views directly.
- No new dependencies, Firestore fields or collections. Every UI change must work in light + dark and glass off/lite/full; phone (<600 bar) + rail (≥600) + sidebar (≥1024).
- Touch targets ≥40px; inputs 16px on phones; chrome is user-select:none (base.css).

## Week model
Tuần = Thứ Bảy 00:00 → hết Thứ Sáu (giờ VN); key = ISO date of the Saturday; month = month of the Friday; scores restart each week. Back-dated (admin/dev) entries use noonOf(day) = 12:00 VN, max 199 days.

## Firestore rules policy
Avoid touching firestore.rules. If a change is truly unavoidable, the final report must START with "⚠️ FIRESTORE RULES CHANGED – republish in Firebase console" and show the diff.

## Checks + deploy
- `for f in <changed js>; do node --check $f; done` and every `*.selftest.mjs` (notes, tokens, js/weeks, js/scoring, js/views/chieu/*).
- Browser check: copy the repo to a scratch dir, set BACKEND='local' there, `python3 -m http.server`, Playwright (preinstalled Chromium).
- Deploy: GitHub Pages serves `main` (root). Bump sw.js CACHE + js/config.js APP_VERSION, update PROGRESS.md, push to main. Installed PWAs update after close + reopen.
