/* ===== 模块8：运动饮食记录 ===== */
(function () {
  const KEY = 'health';
  let curDK = Util.dateKey(); // 当前查看的日期（默认今天，可切换回看历史）

  function getDay(dk = curDK) {
    return DB.day(KEY, dk) || { food: [], ex: [], water: 0 };
  }
  function save(d, rerender = true) {
    DB.setDay(KEY, d, curDK);
    if (rerender) render(window.__view);
  }

  function addFood(name, kcal) {
    kcal = parseFloat(kcal); if (!name.trim() || !(kcal >= 0)) return;
    const d = getDay(); d.food.push({ name: name.trim(), kcal }); save(d);
  }
  function addEx(name, kcal) {
    kcal = parseFloat(kcal); if (!name.trim() || !(kcal >= 0)) return;
    const d = getDay(); d.ex.push({ name: name.trim(), kcal }); save(d);
  }
  function del(arrKey, id) {
    const d = getDay(); d[arrKey] = d[arrKey].filter((_, i) => i !== id); save(d);
  }

  function shiftDay(dk, delta) {
    const d = new Date(dk + 'T00:00:00');
    d.setDate(d.getDate() + delta);
    return Util.dateKey(d);
  }

  // 近 7 天净摄入（以 anchorDK 为终点）
  function weekTrend(anchorDK) {
    const out = []; const base = new Date(anchorDK + 'T00:00:00');
    for (let i = 6; i >= 0; i--) {
      const dt = new Date(base); dt.setDate(base.getDate() - i);
      const dk = Util.dateKey(dt); const d = DB.day(KEY, dk) || { food: [], ex: [] };
      const in_ = d.food.reduce((s, x) => s + (x.kcal || 0), 0);
      const out_ = d.ex.reduce((s, x) => s + (x.kcal || 0), 0);
      out.push({ label: `${dt.getMonth() + 1}/${dt.getDate()}`, net: in_ - out_ });
    }
    return out;
  }

  // 全部历史汇总
  function totals() {
    const all = DB.get(KEY, {});
    let inT = 0, outT = 0, days = 0;
    Object.values(all).forEach(d => {
      const f = (d.food || []).reduce((s, x) => s + (x.kcal || 0), 0);
      const e = (d.ex || []).reduce((s, x) => s + (x.kcal || 0), 0);
      if ((d.food && d.food.length) || (d.ex && d.ex.length) || (d.water > 0)) { days++; inT += f; outT += e; }
    });
    return { inT, outT, days, net: inT - outT };
  }

  // 根据当日摄入/消耗给出可执行的当日运动建议
  function advice(d, inK, outK, net, isToday) {
    const T = isToday ? '今天' : '当日';
    const tips = [];
    if (outK <= 0) tips.push(`${T}还没运动哦，建议先做 20–30 分钟有氧（快走/慢跑/跳绳）唤醒身体。`);
    if (net > 600) tips.push(`当日净摄入偏高（+${Math.round(net)} kcal），建议加一组 30 分钟中高强度运动（如 HIIT、骑车）帮助消耗。`);
    else if (net > 200) tips.push(`净摄入 +${Math.round(net)} kcal，适度运动 20 分钟即可平衡，散步或瑜伽都合适。`);
    else if (net <= 0) tips.push('热量已呈负平衡，状态不错！可做一些拉伸或力量训练塑形，别空腹运动。');
    else tips.push('热量基本平衡，保持日常活动量就好，记得多喝水 💧。');
    if (d.water < 6) tips.push(`${T}只记了 ${d.water} 杯水，建议每日饮水 6–8 杯，帮助代谢。`);
    const hasVeg = (d.food || []).some(f => /蔬|菜|果|salad/i.test(f.name));
    if (!hasVeg) tips.push('当日饮食记录里暂未见蔬果，记得补充一份蔬菜或水果，均衡饮食更轻盈。');
    return tips;
  }

  function historyRows() {
    const all = DB.get(KEY, {});
    const days = Object.keys(all)
      .filter(k => { const d = all[k]; return d && ((d.food && d.food.length) || (d.ex && d.ex.length) || (d.water > 0)); })
      .sort((a, b) => b.localeCompare(a));
    if (!days.length) return '<div class="empty">还没有任何历史记录，今天开始记一笔吧～</div>';
    return days.map(dk => {
      const d = all[dk];
      const inK = (d.food || []).reduce((s, x) => s + (x.kcal || 0), 0);
      const outK = (d.ex || []).reduce((s, x) => s + (x.kcal || 0), 0);
      const net = inK - outK;
      const foodN = (d.food || []).length, exN = (d.ex || []).length, w = d.water || 0;
      return `<div class="item hist-row" data-dk="${dk}" style="cursor:pointer">
        <div class="meta">
          <div class="title">${Util.pretty(new Date(dk + 'T00:00:00'))}</div>
          <div class="sub">${foodN} 餐 · ${exN} 项运动 · ${w} 杯水</div>
        </div>
        <div style="font-weight:700;color:${net > 0 ? 'var(--bad)' : 'var(--good)'}">${net > 0 ? '+' : ''}${Math.round(net)}</div>
      </div>`;
    }).join('');
  }

  function render(view) {
    window.__view = view;
    const d = getDay();
    const inK = d.food.reduce((s, x) => s + (x.kcal || 0), 0);
    const outK = d.ex.reduce((s, x) => s + (x.kcal || 0), 0);
    const net = inK - outK;
    const isToday = curDK === Util.dateKey();
    const prevDK = shiftDay(curDK, -1);
    const nextDK = shiftDay(curDK, 1);
    const canNext = nextDK <= Util.dateKey();

    const foodHtml = d.food.length ? d.food.map((f, i) =>
      `<div class="item"><div class="meta"><div class="title">${Util.esc(f.name)}</div></div><div style="font-weight:700">${f.kcal} kcal</div><button class="del" data-k="food" data-i="${i}">✕</button></div>`).join('')
      : '<div class="empty">还没记录吃了啥～</div>';
    const exHtml = d.ex.length ? d.ex.map((f, i) =>
      `<div class="item"><div class="meta"><div class="title">${Util.esc(f.name)}</div></div><div style="font-weight:700;color:var(--good)">-${f.kcal} kcal</div><button class="del" data-k="ex" data-i="${i}">✕</button></div>`).join('')
      : '<div class="empty">当天还没运动哦</div>';

    const tr = weekTrend(curDK); const max = Math.max(1, ...tr.map(t => Math.abs(t.net)));
    const bars = tr.map(t => `
      <div class="bar-row">
        <div class="bar-label">${t.label}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${Math.max(6, Math.abs(t.net) / max * 100)}%;background:${t.net > 0 ? 'linear-gradient(90deg,#ef6b7d,#f48fb1)' : 'linear-gradient(90deg,#4caf86,#7fd6b5)'}"></div></div>
        <div class="bar-val">${t.net > 0 ? '+' : ''}${Math.round(t.net)}</div>
      </div>`).join('');

    const tips = advice(d, inK, outK, net, isToday);

    const t = totals();
    const aggHtml = `<div class="sum" style="margin:6px 0 14px">
      <div class="pill"><div class="n" style="color:var(--primary-d)">${t.days}</div><div class="l">记录天数</div></div>
      <div class="pill"><div class="n" style="color:var(--bad)">${Math.round(t.inT)}</div><div class="l">累计摄入</div></div>
      <div class="pill"><div class="n" style="color:var(--good)">${Math.round(t.outT)}</div><div class="l">累计消耗</div></div>
      <div class="pill"><div class="n" style="color:var(--primary-d)">${t.net > 0 ? '+' : ''}${Math.round(t.net)}</div><div class="l">累计净</div></div>
    </div>`;

    view.innerHTML = `
      <div class="card">
        <div class="row" style="justify-content:space-between;align-items:center;gap:8px">
          <button class="btn sec" id="prevDay">◀ 前一天</button>
          <div style="text-align:center;font-weight:800">
            <div>${Util.pretty(new Date(curDK + 'T00:00:00'))}${isToday ? ' · 今天' : ''}</div>
          </div>
          <button class="btn sec" id="nextDay" ${canNext ? '' : 'disabled style="opacity:.45;cursor:not-allowed"'}>后一天 ▶</button>
        </div>
        ${isToday ? '' : `<div style="text-align:center;margin-top:8px"><button class="btn ghost" id="backToday">回到今天</button></div>`}
      </div>

      <div class="card">
        <h2>🥗 运动饮食记录</h2>
        <div class="card-sub">${isToday ? '今天' : Util.pretty(new Date(curDK + 'T00:00:00'))} · 吃了啥、动了多少，一眼看清</div>
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

      <div class="card advice-card">
        <h2>💡 ${isToday ? '今日' : '当日'}运动建议</h2>
        <div class="card-sub">根据${isToday ? '今日' : '当日'}摄入/消耗与饮水智能生成</div>
        <ul class="advice-list">
          ${tips.map(tip => `<li>${Util.esc(tip)}</li>`).join('')}
        </ul>
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
        <div class="card-sub">正值偏红（吃多），负值偏绿（消耗多）· 至 ${Util.pretty(new Date(curDK + 'T00:00:00'))}</div>
        ${bars}
      </div>

      <div class="card">
        <h2>📚 全部历史记录</h2>
        <div class="card-sub">点击任一日期可查看 / 补录当天 · 共记录 ${t.days} 天</div>
        ${aggHtml}
        <div id="histList">${historyRows()}</div>
      </div>`;

    view.querySelector('#fAdd').onclick = () => { addFood(view.querySelector('#fName').value, view.querySelector('#fKcal').value); };
    view.querySelector('#eAdd').onclick = () => { addEx(view.querySelector('#eName').value, view.querySelector('#eKcal').value); };
    view.querySelectorAll('.del').forEach(b => b.onclick = () => del(b.dataset.k, +b.dataset.i));
    view.querySelector('#wMinus').onclick = () => { const x = getDay(); x.water = Math.max(0, x.water - 1); save(x); };
    view.querySelector('#wPlus').onclick = () => { const x = getDay(); x.water += 1; save(x); };

    view.querySelector('#prevDay').onclick = () => { curDK = prevDK; render(view); };
    const nd = view.querySelector('#nextDay');
    if (nd && canNext) nd.onclick = () => { curDK = nextDK; render(view); };
    const bt = view.querySelector('#backToday');
    if (bt) bt.onclick = () => { curDK = Util.dateKey(); render(view); };
    view.querySelectorAll('.hist-row').forEach(r => r.onclick = () => { curDK = r.dataset.dk; render(view); });
  }

  window.Health = { render };
})();
