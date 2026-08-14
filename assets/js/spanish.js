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

  // 结合当下新闻事实的每日西语短文（中西双语），每日轮换
  const ARTICLES = [
    {
      title: 'Los Juegos Olímpicos de Invierno 2026',
      es: 'Los Juegos Olímpicos de Invierno 2026 se celebraron en Milán y Cortina, Italia. China ganó cinco medallas de oro y logró su mejor resultado en unos Juegos de Invierno fuera de casa. La esquiadora Eileen Gu hizo historia con seis medallas en su carrera.',
      zh: '2026 年冬奥会在意大利米兰-科尔蒂纳举行。中国夺得五枚金牌，创下境外冬奥会最佳战绩。滑雪运动员谷爱凌以职业生涯六枚奖牌成为历史最佳自由式滑雪选手。',
      tip: '重点词：ganar（赢得）、medalla（奖牌）、oro（金）、lograr（实现/达成）。试着用“ganar”造一句你今天的成就。'
    },
    {
      title: 'Un planeta escondido en el espacio',
      es: 'El telescopio James Webb descubrió un planeta gigante escondido en el sistema Beta Pictoris, a 63 años luz de la Tierra. El planeta tiene al menos el doble de la masa de Júpiter y orbita como Neptuno en nuestro sistema solar.',
      zh: '詹姆斯·韦伯望远镜在距地球 63 光年的绘架座 β 星系中发现了一颗隐藏的巨行星。它质量至少是木星的两倍，轨道位置类似太阳系中的海王星。',
      tip: '重点词：descubrir（发现）、planeta（行星）、sistema（系统）、masa（质量）。可以在写作区用这些词写两句描述。'
    },
    {
      title: 'El deporte une al mundo',
      es: 'En los Juegos Olímpicos, atletas de más de 90 países compiten con respeto y amistad. Una pareja de China ganó oro en el mismo día, un momento muy emotivo que el mundo recordará.',
      zh: '在奥运会上，来自 90 多个国家的运动员以尊重与友谊同场竞技。中国一对夫妻在同一天夺金，这一动人时刻将被世界铭记。',
      tip: '重点词：competir（竞争/参赛）、respeto（尊重）、amistad（友谊）、emotivo（动人的）。练口语时试着复述这段话。'
    },
    {
      title: 'La ciencia mira más lejos',
      es: 'Los científicos usan telescopios poderosos para ver planetas lejanos. Cada descubrimiento nos ayuda a entender mejor el universo y nuestro lugar en él.',
      zh: '科学家使用强大的望远镜观测遥远的星球。每一次发现都帮助我们更好地理解宇宙以及我们在其中的位置。',
      tip: '重点词：científico（科学家）、universo（宇宙）、entender（理解）、lugar（位置）。今天听力练习可以找一段天文主题的西语播客。'
    },
  ];
  function dailyArticle() {
    const s = daySeed();
    return ARTICLES[s % ARTICLES.length];
  }

  function render(view) {
    window.__view = view;
    const d = today();
    if (d.articleDone === undefined) d.articleDone = false;
    const known = d.words.filter(w => w.done).length;
    const art = dailyArticle();

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

      <div class="card">
        <div class="head-row">
          <h2>📰 今日西语短文</h2>
          <span class="chip">结合当日新闻</span>
        </div>
        <div class="card-sub">${Util.pretty()} · 双语阅读 + 重点词</div>
        <h3 style="margin:6px 0 8px">${Util.esc(art.title)}</h3>
        <div class="article-es">${Util.esc(art.es)}</div>
        <div class="article-zh">${Util.esc(art.zh)}</div>
        <div class="article-tip">💡 ${Util.esc(art.tip)}</div>
        <div class="row" style="align-items:center;margin-top:10px">
          <div class="check ${d.articleDone ? 'on' : ''}" id="aChk">${d.articleDone ? '✓' : ''}</div>
          <span>已读 + 重点词已练</span>
        </div>
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
    view.querySelector('#aChk').onclick = () => { d.articleDone = !d.articleDone; save(d); };
  }

  window.Spanish = { render };
})();
