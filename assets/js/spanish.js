/* ===== 模块4：西语学习记录台 ===== */
(function () {
  const KEY = 'spanish';
  // 内置西语词库（西→中），每日轮换
  const VOCAB = [
    ['el agua', '水'], ['la casa', '房子'], ['el libro', '书'], ['comer', '吃'], ['beber', '喝'],
    ['el sol', '太阳'], ['la luna', '月亮'], ['el amor', '爱'], ['el tiempo', '时间/天气'], ['hablar', '说话'],
    ['aprender', '学习'], ['trabajar', '工作'], ['dormir', '睡觉'], ['correr', '跑'], ['leer', '读'],
    ['escribir', '写'], ['escuchar', '听'], ['la ciudad', '城市'], ['el perro', '狗'], ['el gato', '猫'],
    ['la playa', '海滩'], ['el mercado', '市场'], ['la comida', '食物'], ['el café', '咖啡'], ['la fruta', '水果'],
    ['el dinero', '钱'], ['la familia', '家庭'], ['el amigo', '朋友'], ['la escuela', '学校'], ['el problema', '问题'],
    ['la mañana', '早晨'], ['la noche', '夜晚'], ['el viaje', '旅行'], ['el corazón', '心'], ['la música', '音乐'],
    ['abrir', '打开'], ['cerrar', '关闭'], ['comprar', '买'], ['vender', '卖'], ['el tren', '火车'],
  ];

  function daySeed() {
    const d = new Date(); const start = new Date(d.getFullYear(), 0, 0);
    return Math.floor((d - start) / 86400000);
  }
  function dailyWords() {
    const s = daySeed(); const out = [];
    for (let i = 0; i < 5; i++) out.push(VOCAB[(s + i) % VOCAB.length]);
    return out.map(([t, m]) => ({ t, m, done: false }));
  }

  function today() {
    let d = DB.day(KEY);
    if (!d) { d = { words: dailyWords(), listen: { min: 0, done: false }, write: { text: '', done: false }, speak: { min: 0, done: false } }; DB.setDay(KEY, d); }
    return d;
  }
  function save(d, rerender = true) { DB.setDay(KEY, d); if (rerender) render(window.__view); }

  function render(view) {
    window.__view = view;
    const d = today();
    const known = d.words.filter(w => w.done).length;

    const wordHtml = d.words.map((w, i) => `
      <div class="item">
        <div class="check ${w.done ? 'on' : ''}" data-w="${i}">${w.done ? '✓' : ''}</div>
        <div class="meta"><div class="title">${Util.esc(w.t)}</div><div class="sub">${Util.esc(w.m)}</div></div>
      </div>`).join('');

    view.innerHTML = `
      <div class="card">
        <div class="head-row">
          <h2>🇪🇸 西语学习台</h2>
          <span class="chip">已掌握 ${known}/${d.words.length}</span>
        </div>
        <div class="card-sub">${Util.pretty()} · 每日轮换单词 + 听说写打卡</div>

        <h3 style="margin:6px 0 8px">📝 今日单词（点勾表示已掌握）</h3>
        <div class="row" style="margin-bottom:10px">
          <input class="input" id="wEs" placeholder="自己加一个西语词" style="flex:1" />
          <input class="input" id="wZh" placeholder="中文" style="max-width:120px" />
          <button class="btn" id="wAdd">加</button>
        </div>
        <div id="wordList">${wordHtml}</div>
      </div>

      <div class="grid2">
        <div class="panel">
          <h3>🎧 听力</h3>
          <label class="muted" style="font-size:12px">练习分钟</label>
          <input class="input" id="lMin" type="number" value="${d.listen.min}" style="margin:6px 0" />
          <div class="row" style="align-items:center">
            <div class="check ${d.listen.done ? 'on' : ''}" id="lChk">${d.listen.done ? '✓' : ''}</div>
            <span>今日已完成</span>
          </div>
        </div>
        <div class="panel">
          <h3>🗣️ 口语</h3>
          <label class="muted" style="font-size:12px">练习分钟</label>
          <input class="input" id="sMin" type="number" value="${d.speak.min}" style="margin:6px 0" />
          <div class="row" style="align-items:center">
            <div class="check ${d.speak.done ? 'on' : ''}" id="sChk">${d.speak.done ? '✓' : ''}</div>
            <span>今日已完成</span>
          </div>
        </div>
      </div>

      <div class="panel">
        <h3>✍️ 写作</h3>
        <textarea class="input" id="wText" rows="3" placeholder="写几句西语试试～">${Util.esc(d.write.text)}</textarea>
        <div class="row" style="align-items:center;margin-top:8px">
          <div class="check ${d.write.done ? 'on' : ''}" id="wChk">${d.write.done ? '✓' : ''}</div>
          <span>今日已完成</span>
        </div>
      </div>`;

    // 单词勾选 / 添加
    view.querySelectorAll('[data-w]').forEach(el => el.onclick = () => {
      const i = +el.dataset.w; d.words[i].done = !d.words[i].done; save(d);
    });
    view.querySelector('#wAdd').onclick = () => {
      const t = view.querySelector('#wEs').value.trim(), m = view.querySelector('#wZh').value.trim();
      if (t && m) { d.words.push({ t, m, done: false }); save(d); }
    };
    // 听说写
    const bind = (sel, key, isText) => {
      const el = view.querySelector(sel);
      if (isText) el.oninput = () => { d[key].text = el.value; save(d, false); };
      else el.onclick = () => { d[key].done = !d[key].done; save(d); };
    };
    view.querySelector('#lMin').oninput = e => { d.listen.min = +e.target.value || 0; save(d, false); };
    view.querySelector('#sMin').oninput = e => { d.speak.min = +e.target.value || 0; save(d, false); };
    bind('#lChk', 'listen'); bind('#sChk', 'speak'); bind('#wChk', 'write'); bind('#wText', 'write', true);
  }

  window.Spanish = { render };
})();
