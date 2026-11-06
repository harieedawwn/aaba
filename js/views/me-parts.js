// Tôi: guest name picker (localStorage only). (The "Thông báo" list was removed in 0.4.0: new entries get "Mới" in Điểm của tôi.)
import { h, put } from '../ui/dom.js';
import { dot } from '../ui/components.js';
import * as store from '../data/store.js';
import { toast } from '../ui/toast.js';
import { act } from '../ui/act.js';

export function namePicker(groups, students) {
  let q = '';
  const list = h('div');
  const paint = () => {
    const kids = [];
    for (const g of [...groups].sort((a, b) => a.order - b.order)) {
      const ss = students.filter(s => s.groupId === g.id && s.name.toLowerCase().includes(q));
      if (!ss.length) continue;
      kids.push(h('div', { class: 'pick-g inl' }, dot(g.color), g.name), h('div', { class: 'pick' }, ss.map(s => h('button', {
        class: 'fchip pressable', type: 'button', onclick: () => act(() => store.pickStudent(s.id)) }, s.name))));
    }
    put(list, kids);
  };
  const search = h('input', { class: 'input', placeholder: 'Tìm tên của bạn', 'aria-label': 'Tìm tên', oninput: e => { q = e.target.value.toLowerCase(); paint(); } });
  paint();
  return h('section', { class: 'card pick-box' }, h('h2', null, 'Chọn tên của bạn'),
    h('p', { class: 'muted' }, 'Chỉ lưu trên máy này, để xem điểm và thông báo của bạn.'), search, list);
}
