// Shared small components.
import { h, put } from './dom.js';
import { icon } from './icons.js';
import { fmtPts, relTime, fmtDate, fmtTime } from '../format.js';
import { getTheme, setTheme, onTheme, can, getSession } from '../session.js';
import * as store from '../data/store.js';
import { openSheet } from './sheet.js';
import { toast } from './toast.js';
import { errMsg, act, saved } from './act.js';
import { confirmSheet } from './form.js';
import { setDraft } from './draft.js';
import { logError } from '../errors.js';
import { unseen, onNotif } from '../notify.js';

export const logo = () => h('span', { class: 'logo' }, h('span', { class: 'logo-sq', 'aria-hidden': 'true' }, 'a'), h('span', { class: 'logo-t' }, 'aaba'));
export const dot = color => h('span', { class: `dot g-${color || 'slate'}`, 'aria-hidden': 'true' });
export const chip = (kids, tone = '') => h('span', { class: 'chip ' + tone }, kids);
export const pointsChip = n => chip(fmtPts(n), n > 0 ? 'pos' : n < 0 ? 'neg' : '');

export function skeletonCards(n = 4) {
  return Array.from({ length: n }, () => h('div', { class: 'card skeleton', 'aria-hidden': 'true' }));
}
// action: {label, href} | {label, onClick}
export function emptyState({ icon: ic = 'clock', title, text, action } = {}) {
  return h('div', { class: 'empty' },
    h('div', { class: 'empty-ico' }, icon(ic, 26)),
    h('h2', null, title), text && h('p', { class: 'muted' }, text),
    action && (action.href
      ? h('a', { class: 'btn btn-ghost pressable', href: action.href }, action.label)
      : h('button', { class: 'btn btn-ghost pressable', onclick: action.onClick }, action.label)));
}

export function themeToggle() {
  const b = h('button', { class: 'icon-btn pressable', 'aria-label': 'Đổi giao diện sáng/tối' });
  const paint = () => put(b, icon(getTheme() === 'dark' ? 'sun' : 'moon'));
  paint();
  b.addEventListener('click', () => setTheme(getTheme() === 'dark' ? 'light' : 'dark'));
  const born = Date.now(); // not connected after mount time = the view is gone -> drop the listener
  const off = onTheme(() => { if (b.isConnected) paint(); else if (Date.now() - born > 2000) off(); });
  return b;
}

// Bell: only for anyone with a studentId; red dot while there are unseen entries about me. Opens Tôi (Điểm của tôi, tag "Mới").
export function bell() {
  if (!getSession()?.studentId) return null;
  const dot = h('span', { class: 'ndot', hidden: !unseen() });
  const a = h('a', { class: 'icon-btn pressable', href: '#/toi', 'aria-label': 'Thông báo' }, icon('bell'), dot);
  const born = Date.now(); // not connected after mount time = the view is gone -> drop the listener
  const off = onNotif(() => { if (a.isConnected) dot.hidden = !unseen(); else if (Date.now() - born > 2000) off(); });
  return a;
}

const ROLE_VI = { recorder: 'cán sự ghi điểm', teacher: 'giáo viên', admin: 'quản trị', dev: 'quản trị' };
// Sync state of an entry: failed | queued | sending | '' (confirmed). _out comes from the outbox, _pend from the Firestore snapshot.
export const syncOf = e => (e.status === 'failed' || e._out === 'error' ? 'failed' : e._out === 'queued' ? 'queued' : e._out === 'sending' || e._pend ? 'sending' : '');
const SYNC_VI = { failed: 'chưa gửi được', queued: 'chờ mạng để gửi', sending: 'đang gửi' };
// Inline tổ name: tinted pill in the tổ hue (tokens --tb/--tf). Big headings keep plain text.
export const groupTag = g => (g ? h('span', { class: `gtag g-${g.color || 'slate'}` }, g.name || '') : null);
// Activity row: 1 who (+tags) · 2 rule (signed colour, 2 lines) · 3 [tổ] · bởi … · time. Right: amount + badges.
export function entryRow(e, { group, student, onOpen, isNew } = {}) {
  const who = e.studentId ? student?.name || 'Học sinh đã xoá' : 'Cả tổ', sync = syncOf(e), tone = e.points > 0 ? 'pos' : e.points < 0 ? 'neg' : '';
  const amt = h('span', { class: 'amt ' + tone }, fmtPts(e.points));
  const row = h('div', { class: 'entry' + (e.status === 'void' ? ' is-void' : '') + (sync === 'failed' ? ' is-fail' : '') + (onOpen ? ' pressable' : ''), role: onOpen ? 'button' : null, tabindex: onOpen ? '0' : null },
    h('div', { class: 'entry-main' },
      h('div', { class: 'entry-who' }, h('b', null, who), e.addedAt && h('span', { class: 'tag' }, 'Bổ sung'), e.replaces && h('span', { class: 'tag' }, 'Bản sửa'), isNew && h('span', { class: 'tag new' }, 'Mới')),
      h('div', { class: 'entry-rule ' + tone }, e.ruleName),
      h('div', { class: 'entry-meta' }, groupTag(group), h('span', { class: 'entry-by' }, `bởi ${e.byName || 'Không rõ'} · ${relTime(e.at)}`))),
    h('div', { class: 'entry-pts' }, amt,
      sync && h('span', { class: 'pend' + (sync === 'failed' ? ' err' : '') }, icon(sync === 'failed' ? 'x' : 'clock', 14), SYNC_VI[sync]),
      e.status === 'pending' && h('span', { class: 'pend' }, icon('clock', 14), 'chờ xác nhận'),
      e.status === 'void' && h('span', { class: 'void-t' }, 'Đã thu hồi')));
  if (onOpen) {
    row.addEventListener('click', () => onOpen(e));
    row.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); onOpen(e); } });
  }
  return row;
}

export function pageHeader(title, { back, sub } = {}) {
  return h('header', { class: 'hdr' },
    back && h('a', { class: 'icon-btn back', href: back, 'aria-label': 'Quay lại' }, icon('chevron', 22)),
    h('div', { class: 'hdr-main' }, h('h1', null, title), sub && h('p', { class: 'hdr-sub muted' }, sub)));
}

// Subscribe to collections; show skeleton until all arrived, then el <- render(S, first) (array of nodes).
// Errors become an error state. Returns stop().
// Entry sources for live(): current week (sets S.weekStart), all pending, one student's entries.
export const weekSrc = (cb, S) => store.onWeek(m => { S.weekStart = m.weekStart; cb(m.entries); });
export const pendingSrc = cb => store.pendingEntries(cb);
export const studentSrc = id => cb => store.studentEntries(id, cb);
export function live(el, cols, render, opts = {}) {
  const S = {};
  let first = true;
  put(el, ...skeletonCards(3));
  const paint = () => {
    if (!cols.every(c => S[c] !== undefined)) return;
    try { put(el, ...[].concat(render(S, first))); }
    catch (err) { logError('render', err); put(el, emptyState({ icon: 'x', title: 'Có lỗi xảy ra', text: 'Không hiển thị được mục này. Hãy thử tải lại.', action: { label: 'Tải lại', onClick: () => location.reload() } })); }
    first = false;
  };
  // opts.src[col](cb, S) -> unsub replaces store.on for that col (week model: weekSrc / pendingSrc / studentSrc)
  const subs = cols.map(c => (opts.src?.[c] ? opts.src[c](v => { S[c] = v; paint(); }, S) : store.on(c, v => { S[c] = v; paint(); }, opts[c])));
  return () => subs.forEach(u => u());
}

// Shared "reason required" confirm sheet (void / reject).
export function reasonSheet({ title, text, label, onSubmit }) {
  const ta = h('textarea', { class: 'input textarea', rows: '3', placeholder: 'Lý do thu hồi (bắt buộc)', maxlength: '500', 'aria-label': 'Lý do thu hồi' });
  const err = h('div', { class: 'form-err', role: 'alert', hidden: true }, 'Cần nhập lý do.');
  const ok = h('button', { class: 'btn btn-danger', type: 'button' }, label);
  const sh = openSheet({ title, content: h('div', { class: 'form' }, text && h('p', { class: 'muted' }, text), ta, err,
    h('div', { class: 'row-btns' }, h('button', { class: 'btn btn-ghost', type: 'button', onclick: () => sh.close() }, 'Không'), ok)) });
  ok.onclick = async () => {
    const v = ta.value.trim();
    if (!v) { err.textContent = 'Cần nhập lý do.'; err.hidden = false; ta.focus(); return; }
    ok.disabled = true;
    try { await onSubmit(v); sh.close(); } catch (e) { ok.disabled = false; logError('form', e); err.textContent = errMsg(e); err.hidden = false; }
  };
  setTimeout(() => ta.focus(), 50);
  return sh;
}

export function entrySheet(e, { group, student, readOnly } = {}) {
  const kv = (k, v) => h('div', { class: 'kv' }, h('span', { class: 'muted' }, k), h('span', null, v));
  const status = { ok: chip('đã xác nhận', 'pos'), pending: chip('chờ xác nhận', 'warn'), void: chip('Đã thu hồi', 'neg'), failed: chip('Chưa gửi được', 'neg') }[e.status];
  const sync = syncOf(e), failed = sync === 'failed', live = !failed && e.status !== 'void';
  const canVoid = !readOnly && live && can('void', { entry: e });
  const canEdit = !readOnly && live && can('backdate');
  const canPurge = can('purge', { entry: e });
  const canOk = !readOnly && !failed && e.status === 'pending' && can('approve', { entry: e });
  const stamp = t => `${fmtDate(t)} ${fmtTime(t)}`;
  const edit = () => act(async () => {
    if (!(await store.ruleUsable(e.ruleId))) return toast('Nội dung này đã bị tắt hoặc xoá nên không sửa được. Bạn vẫn có thể thu hồi điểm.');
    setDraft({ edit: e }); sh.close(); location.hash = '#/ghi';
  });
  const sh = openSheet({ title: 'Chi tiết điểm', content: h('div', { class: 'detail' },
    h('div', { class: 'detail-top' }, h('div', { class: 'detail-name' }, e.ruleName), pointsChip(e.points)),
    kv('Tổ', groupTag(group) || ''),
    kv('Học sinh', e.studentId ? student?.name || 'Học sinh đã xoá' : 'Cả tổ'),
    e.qty > 1 && kv('Số lượng', `${e.qty} × ${fmtPts(e.unit)}`),
    kv('Thời gian', stamp(e.at)),
    e.addedAt && kv('Bổ sung', `Ghi lúc ${stamp(e.addedAt)} bởi ${e.byName}`),
    e.replaces && kv('Bản sửa', 'Thay cho một dòng đã thu hồi'),
    kv('Người ghi', `${e.byName || 'Không rõ'}${e.byRole && ROLE_VI[e.byRole] ? ` (${ROLE_VI[e.byRole]})` : ''}`), kv('Trạng thái', status),
    sync && kv('Đồng bộ', SYNC_VI[sync]),
    failed && store.entryError(e.id) && h('p', { class: 'form-err', role: 'alert' }, errMsg(store.entryError(e.id))),
    failed && h('div', { class: 'detail-acts' },
      h('button', { class: 'btn btn-ghost', type: 'button', onclick: () => { sh.close(); store.dismissEntry(e.id); } }, 'Bỏ qua'),
      h('button', { class: 'btn', type: 'button', onclick: () => { sh.close(); store.retryEntry(e.id); } }, 'Gửi lại')),
    e.note && kv('Ghi chú', e.note),
    e.status === 'void' && kv('Lý do thu hồi', e.voidReason),
    (canVoid || canEdit || canOk) && h('div', { class: 'detail-acts' },
      canOk && h('button', { class: 'btn detail-ok', type: 'button', onclick: ev => act(async () => { await store.approveEntry(e.id); sh.close(); },
        { btn: ev.currentTarget, ok: `Đã xác nhận ${fmtPts(e.points)} cho ${group?.name || ''}` }) }, icon('check', 18), 'Xác nhận'),
      canEdit && h('button', { class: 'btn btn-ghost', type: 'button', onclick: edit }, 'Sửa'),
      canVoid && h('button', { class: 'btn btn-ghost detail-void', type: 'button', onclick: () => {
        sh.close();
        reasonSheet({ title: 'Thu hồi điểm này?', text: `${e.ruleName}: ${fmtPts(e.points)} điểm sẽ không còn được tính.`, label: 'Thu hồi điểm',
          onSubmit: async r => { await store.voidEntry(e.id, r); toast(saved('Đã thu hồi điểm')); } });
      } }, 'Thu hồi điểm')),
    canPurge && h('button', { class: 'btn btn-ghost detail-void', type: 'button', onclick: () => {
      sh.close();
      confirmSheet({ title: 'Xoá hẳn dòng này?', label: 'Xoá hẳn', text: 'Xoá vĩnh viễn dòng này? Không khôi phục được. Điểm của tổ không thay đổi vì dòng này đã thu hồi.',
        onConfirm: async () => { await store.purgeEntries([e]); toast(saved('Đã xoá hẳn')); } });
    } }, 'Xoá hẳn')) });
  return sh;
}
