/* ===== 模块3：每日记账 + 月统计 ===== */
(function () {
  const KEY = 'finance';
  const OUT_CAT = ['餐饮', '交通', '购物', '居住', '娱乐', '医疗', '学习', '其他'];
  const IN_CAT = ['工资', '兼职', '理财', '红包', '其他'];
  let type = 'out';

  function load() { return DB.get(KEY, {}); }
  function save(all) { DB.set(KEY, all); }
  function todayList() { return load()[Util.dateKey()] || []; }

  function add(amount, cat, note) {
    amount = parseFloat(amount); if (!(amount > 0)) return;
    const all = load(); const d = Util.dateKey();
    all[d] = all[d] || [];
    all[d].push({ id: Util.uid(), type, amount, cat, note: (note || '').trim(), ts: Date.now() });
    save(all); render(window.__view);
  }
  function del(id) {
    const all = load(); const arr = all[Util.dateKey()] || [];
    all[Util.dateKey()] = arr.filter(x => x.id !== id);
    save(all); render(window.__view);
  }

  function monthStat() {
    const all = load();
    const y = new Date().getFullYear(), m = new Date().getMonth();
    const dates = DB.monthDates(y, m);
    let in_ = 0, out = 0; const byCat = {};
    dates.forEach(d => (all[d] || []).forEach(r => {
      if (r.type === 'in') in_ += r.amount; else { out += r.amount; byCat[r.cat] = (byCat[r.cat] || 0) + r.amount; }
    }));
    return { in: in_, out: out, net: in_ - out, byCat };
  }

  function render(view) {
    window.__view = view;
    const list = todayList();
    const st = monthStat();
    const rows = list.length ? list.map(r => `
      <div class="item">
        <div class="meta">
          <div class="title">${Util.esc(r.cat)}${r.note ? ' · ' + Util.esc(r.note) : ''}</div>
          <div class="sub">${Util.dateKey()} ${r.type === 'in' ? '收入' : '支出'}</div>
        </div>
        <div style="font-weight:700;color:${r.type === 'in' ? 'var(--good)' : 'var(--bad)'}">${r.type === 'in' ? '+' : '-'}${Util.money(r.amount)}</div>
        <button class="del" data-id="${r.id}">✕</button>
      </div>`).join('') : '<div class="empty">今天还没记账～</div>';

    const cats = Object.entries(st.byCat).sort((a, b) => b[1] - a[1]);
    const max = cats.length ? cats[0][1] : 1;
    const bars = cats.length ? cats.map(([c, v]) => `
      <div class="bar-row">
        <div class="bar-label">${Util.esc(c)}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${Math.max(6, v / max * 100)}%"></div></div>
        <div class="bar-val">${Util.money(v)}</div>
      </div>`).join('') : '<div class="empty">本月暂无支出</div>';

    const opt = (type === 'in' ? IN_CAT : OUT_CAT).map(c => `<option>${c}</option>`).join('');

    view.innerHTML = `
      <div class="card">
        <h2>💰 每日记账</h2>
        <div class="card-sub">${Util.pretty()} · 随手记，月末看趋势</div>
        <div class="row" style="margin-bottom:10px">
          <div style="display:flex;gap:8px">
            <button class="btn ${type === 'out' ? '' : 'sec'}" data-type="out">支出</button>
            <button class="btn ${type === 'in' ? '' : 'sec'}" data-type="in">收入</button>
          </div>
        </div>
        <div class="row" style="margin-bottom:14px">
          <input class="input" id="fAmt" type="number" inputmode="decimal" placeholder="金额" style="max-width:140px" />
          <select class="input" id="fCat" style="max-width:130px">${opt}</select>
          <input class="input" id="fNote" placeholder="备注(可选)" style="flex:1;min-width:120px" />
          <button class="btn" id="fAdd">记一笔</button>
        </div>
        <div id="fList">${rows}</div>
      </div>

      <div class="card">
        <h2>📊 本月消费统计</h2>
        <div class="card-sub">${Util.monthKey()} · 收入 / 支出 / 结余</div>
        <div class="sum" style="margin-bottom:16px">
          <div class="pill"><div class="n" style="color:var(--good)">${Util.money(st.in)}</div><div class="l">收入</div></div>
          <div class="pill"><div class="n" style="color:var(--bad)">${Util.money(st.out)}</div><div class="l">支出</div></div>
          <div class="pill"><div class="n" style="color:var(--primary-d)">${Util.money(st.net)}</div><div class="l">结余</div></div>
        </div>
        <div style="font-size:13px;color:var(--muted);margin-bottom:8px">支出分类占比</div>
        ${bars}
      </div>`;

    view.querySelectorAll('[data-type]').forEach(b => b.onclick = () => { type = b.dataset.type; render(view); });
    view.querySelector('#fAdd').onclick = () => {
      const a = view.querySelector('#fAmt').value;
      add(a, view.querySelector('#fCat').value, view.querySelector('#fNote').value);
    };
    view.querySelectorAll('#fList .del').forEach(b => b.onclick = () => del(b.dataset.id));
  }

  window.Finance = { render };
})();
