/* ===== 模块8：运动饮食记录 ===== */
(function () {
  const KEY = 'health';
  function today() {
    let d = DB.day(KEY);
    if (!d) { d = { food: [], ex: [], water: 0 }; DB.setDay(KEY, d); }
    return d;
  }
  function save(d, rerender = true) { DB.setDay(KEY, d); if (rerender) render(window.__view); }

  function addFood(name, kcal) {
    kcal = parseFloat(kcal); if (!name.trim() || !(kcal >= 0)) return;
    const d = today(); d.food.push({ name: name.trim(), kcal }); save(d);
  }
  function addEx(name, kcal) {
    kcal = parseFloat(kcal); if (!name.trim() || !(kcal >= 0)) return;
    const d = today(); d.ex.push({ name: name.trim(), kcal }); save(d);
  }
  function del(arrKey, id) {
    const d = today(); d[arrKey] = d[arrKey].filter((_, i) => i !== id); save(d);
  }

  function weekTrend() {
    const out = []; const base = new Date();
    for (let i = 6; i >= 0; i--) {
      const dt = new Date(base); dt.setDate(base.getDate() - i);
      const dk = Util.dateKey(dt); const d = DB.day(KEY, dk) || { food: [], ex: [] };
      const in_ = d.food.reduce((s, x) => s + (x.kcal || 0), 0);
      const out_ = d.ex.reduce((s, x) => s + (x.kcal || 0), 0);
      out.push({ label: `${dt.getMonth() + 1}/${dt.getDate()}`, net: in_ - out_ });
    }
    return out;
  }

  function render(view) {
    window.__view = view;
    const d = today();
    const inK = d.food.reduce((s, x) => s + (x.kcal || 0), 0);
    const outK = d.ex.reduce((s, x) => s + (x.kcal || 0), 0);
    const net = inK - outK;

    const foodHtml = d.food.length ? d.food.map((f, i) =>
      `<div class="item"><div class="meta"><div class="title">${Util.esc(f.name)}</div></div><div style="font-weight:700">${f.kcal} kcal</div><button class="del" data-k="food" data-i="${i}">✕</button></div>`).join('')
      : '<div class="empty">还没记录吃了啥～</div>';
    const exHtml = d.ex.length ? d.ex.map((f, i) =>
      `<div class="item"><div class="meta"><div class="title">${Util.esc(f.name)}</div></div><div style="font-weight:700;color:var(--good)">-${f.kcal} kcal</div><button class="del" data-k="ex" data-i="${i}">✕</button></div>`).join('')
      : '<div class="empty">今天还没运动哦</div>';

    const tr = weekTrend(); const max = Math.max(1, ...tr.map(t => Math.abs(t.net)));
    const bars = tr.map(t => `
      <div class="bar-row">
        <div class="bar-label">${t.label}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${Math.max(6, Math.abs(t.net) / max * 100)}%;background:${t.net > 0 ? 'linear-gradient(90deg,#ef6b7d,#f48fb1)' : 'linear-gradient(90deg,#4caf86,#7fd6b5)'}"></div></div>
        <div class="bar-val">${t.net > 0 ? '+' : ''}${Math.round(t.net)}</div>
      </div>`).join('');

    view.innerHTML = `
      <div class="card">
        <h2>🥗 运动饮食记录</h2>
        <div class="card-sub">${Util.pretty()} · 吃了啥、动了多少，一眼看清</div>
        <div class="sum" style="margin-bottom:14px">
          <div class="pill"><div class="n" style="color:var(--bad)">${Math.round(inK)}</div><div class="l">摄入 kcal</div></div>
          <div class="pill"><div class="n" style="color:var(--good)">${Math.round(outK)}</div><div class="l">消耗 kcal</div></div>
          <div class="pill"><div class="n" style="color:var(--primary-d)">${net > 0 ? '+' : ''}${Math.round(net)}</div><div class="l">净摄入</div></div>
          <div class="pill"><div class="n">${d.water}🥛</div><div class="l">饮水</div></div>
        </div>
        <div class="row" style="gap:8px;margin-bottom:6px">
          <button class="btn sec" id="wMinus">－杯水</button>
          <button class="btn sec" id="wPlus">＋杯水</button>
        </div>
      </div>

      <div class="card">
        <h2>🍽️ 吃了什么</h2>
        <div class="row" style="margin:10px 0">
          <input class="input" id="fName" placeholder="食物名" style="flex:1;min-width:120px" />
          <input class="input" id="fKcal" type="number" placeholder="热量kcal" style="max-width:120px" />
          <button class="btn" id="fAdd">添加</button>
        </div>
        <div id="foodList">${foodHtml}</div>
      </div>

      <div class="card">
        <h2>🏃 运动消耗</h2>
        <div class="row" style="margin:10px 0">
          <input class="input" id="eName" placeholder="运动项目" style="flex:1;min-width:120px" />
          <input class="input" id="eKcal" type="number" placeholder="消耗kcal" style="max-width:120px" />
          <button class="btn" id="eAdd">添加</button>
        </div>
        <div id="exList">${exHtml}</div>
      </div>

      <div class="card">
        <h2>📉 近 7 天净摄入</h2>
        <div class="card-sub">正值偏红（吃多），负值偏绿（消耗多）</div>
        ${bars}
      </div>`;

    view.querySelector('#fAdd').onclick = () => { addFood(view.querySelector('#fName').value, view.querySelector('#fKcal').value); };
    view.querySelector('#eAdd').onclick = () => { addEx(view.querySelector('#eName').value, view.querySelector('#eKcal').value); };
    view.querySelectorAll('.del').forEach(b => b.onclick = () => del(b.dataset.k, +b.dataset.i));
    view.querySelector('#wMinus').onclick = () => { const x = today(); x.water = Math.max(0, x.water - 1); save(x); };
    view.querySelector('#wPlus').onclick = () => { const x = today(); x.water += 1; save(x); };
  }

  window.Health = { render };
})();
