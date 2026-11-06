// Ghi điểm: success screen after saving one or several entries (one batch). Shows the outbox state, Gửi lại, Hoàn tác (whole batch).
import { h } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import * as store from '../data/store.js';
import { fmtPts } from '../format.js';
import { toast } from '../ui/toast.js';
import { act, saved, errMsg } from '../ui/act.js';

const names = ss => (ss.length <= 3 ? ss.join(', ') : `${ss.slice(0, 2).join(', ')} và ${ss.length - 2} bạn khác`);

// es: saved entries (same batch) · edit: was a Sửa · onDone / onAgain: button handlers. Returns the node.
export function doneView(es, { D, edit, onDone, onAgain }) {
  const e = es[0], id = e.id, grp = D.groups.find(g => g.id === e.groupId);
  const stus = es.map(x => D.students.find(s => s.id === x.studentId)?.name).filter(Boolean);
  const base = e.status === 'pending' ? 'Đã gửi, chờ xác nhận' : edit ? 'Đã lưu bản sửa' : 'Đã ghi điểm';
  const title = h('h2', null, base), stat = h('div', { class: 'sync-st', role: 'status' });
  const again = h('button', { class: 'btn', type: 'button', hidden: true, onclick: () => store.retryEntry(id) }, 'Gửi lại');
  const paintStat = () => {
    const s = store.entryState(id) || 'ok';
    stat.className = 'sync-st ' + (s === 'error' ? 'err' : s === 'ok' ? 'ok' : '');
    stat.textContent = s === 'sending' ? 'Đang gửi lên máy chủ…' : s === 'queued' ? 'Đã lưu trên máy, đang chờ mạng để gửi lên máy chủ' : s === 'error' ? `Chưa gửi được: ${errMsg(store.entryError(id))}` : 'Đã lưu trên máy chủ ✓';
    if (title.isConnected && !title.dataset.undone) title.textContent = s === 'error' ? 'Chưa ghi được điểm' : base;
    again.hidden = s !== 'error';
  };
  const offOut = store.onOutbox(() => { if (stat.isConnected) paintStat(); else offOut(); });
  paintStat();
  const who = es.length > 1 ? `${es.length} bạn: ${names(stus)}` : stus[0] || '';
  const el = h('div', { class: 'success' }, h('div', { class: 'success-ico' }, icon('check', 40, 'check-draw')), title,
    h('p', { class: 'muted' }, `${fmtPts(e.points)} điểm${es.length > 1 ? ' mỗi bạn' : ''} cho ${grp?.name || ''}${who ? `, ${who}` : ''}`), stat,
    h('div', { class: 'row-btns', style: { width: '100%', marginTop: '8px' } }, again,
      h('button', { class: 'btn btn-ghost', type: 'button', onclick: onDone }, 'Xong'),
      h('button', { class: 'btn', type: 'button', onclick: onAgain }, 'Ghi tiếp')));
  if (!edit && e._out !== 'error') toast(saved(`${fmtPts(e.points)}${es.length > 1 ? ` × ${es.length} bạn` : ''} cho ${grp?.name || ''}`), { duration: 8000, action: { label: 'Hoàn tác', onClick: () =>
    act(async () => { await Promise.all(es.map(x => store.voidEntry(x.id, 'hoàn tác'))); title.dataset.undone = '1'; title.textContent = 'Đã hoàn tác'; }, { ok: 'Đã hoàn tác' }) } });
  return el;
}
