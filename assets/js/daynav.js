/* ===== 按天浏览 / 历史共用组件（待办/记账/西语/英语 统一接入） ===== */
const DayNav = {
  _state: {}, // 各模块记住上次查看的日期
  get(key) { return this._state[key] || Util.dateKey(); },
  set(key, dk) { this._state[key] = dk; },

  _shift(dk, delta) { const d = new Date(dk + 'T00:00:00'); d.setDate(d.getDate() + delta); return Util.dateKey(d); },

  // 顶部日期切换卡片：默认今天，可前后翻、可回到今天
  bar(key) {
    const curDK = this.get(key);
    const isToday = curDK === Util.dateKey();
    const prevDK = this._shift(curDK, -1);
    const nextDK = this._shift(curDK, 1);
    const canNext = nextDK <= Util.dateKey();
    const label = isToday ? '今天' : Util.pretty(new Date(curDK + 'T00:00:00'));
    return `<div class="card">
      <div class="row" style="justify-content:space-between;align-items:center;gap:8px">
        <button class="btn sec" data-dn="prev" data-key="${key}">◀ 前一天</button>
        <div style="text-align:center;font-weight:800"><div>${label}${isToday ? ' · 今天' : ''}</div></div>
        <button class="btn sec" data-dn="next" data-key="${key}" ${canNext ? '' : 'disabled style="opacity:.45;cursor:not-allowed"'}>后一天 ▶</button>
      </div>
      ${isToday ? '' : `<div style="text-align:center;margin-top:8px"><button class="btn ghost" data-dn="today" data-key="${key}">回到今天</button></div>`}
    </div>`;
  },

  // 历史卡片：列出有数据的日期 + 模块自定义汇总行
  // summaryFn(dk, data) -> 一行 HTML（需自带 data-dn-row="<key>" data-dk="<dk>" 与可点击样式）
  history(key, summaryFn) {
    const all = DB.get(key, {});
    const days = Object.keys(all).filter(k => this._hasData(all[k])).sort((a, b) => b.localeCompare(a));
    const rows = days.map(dk => summaryFn(dk, all[dk])).join('');
    return `<div class="card">
      <h2>📚 全部历史记录</h2>
      <div class="card-sub">点击任一日期可查看 / 补录当天 · 共记录 ${days.length} 天</div>
      <div>${rows || '<div class="empty">还没有任何历史记录～</div>'}</div>
    </div>`;
  },

  // 判断某天是否有实质数据（数组看长度、数字看非零、对象递归）
  _hasData(d) {
    if (!d) return false;
    if (Array.isArray(d)) return d.length > 0;
    if (typeof d === 'number') return d !== 0;
    if (typeof d === 'object') return Object.keys(d).some(k => this._hasData(d[k]));
    return d !== '';
  },

  // 在模块 render 写入 innerHTML 之后调用，绑定所有日期控件
  bind(view, key, onChange) {
    const go = dk => { this.set(key, dk); onChange(); };
    view.querySelectorAll('[data-dn]').forEach(el => {
      el.onclick = () => {
        const cur = this.get(key);
        const act = el.dataset.dn;
        if (act === 'prev') go(this._shift(cur, -1));
        else if (act === 'next') { const n = this._shift(cur, 1); if (n <= Util.dateKey()) go(n); }
        else if (act === 'today') go(Util.dateKey());
      };
    });
    view.querySelectorAll(`[data-dn-row="${key}"]`).forEach(el => {
      el.onclick = () => { this.set(key, el.dataset.dk); onChange(); };
    });
  },
};
