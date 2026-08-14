/* ===== 模块5：英语学习（油管播客精选） ===== */
(function () {
  const KEY = 'english';
  // 精选油管英语学习频道（handle 用于 RSS 与打开）
  const CH = [
    { name: 'BBC Learning English', user: 'BBCLearningEnglish' },
    { name: 'English with Lucy', user: 'englishwithlucy' },
    { name: 'Speak English With Vanessa', user: 'SpeakEnglishWithVanessa' },
    { name: 'VOA Learning English', user: 'VOALearningEnglish' },
    { name: 'EnglishClass101', user: 'englishclass101' },
    { name: 'TED', user: 'TED' },
  ];
  const PROXY = 'https://api.allorigins.win/raw?url=';
  const RSS = u => `https://www.youtube.com/feeds/videos.xml?user=${u}`;

  function daySeed() {
    const d = new Date(); const s = new Date(d.getFullYear(), 0, 0);
    return Math.floor((d - s) / 86400000);
  }
  function studied() { return DB.day(KEY) || {}; }
  function saveStudied(obj) { DB.setDay(KEY, obj); }

  async function fetchLatest(ch) {
    try {
      const r = await fetch(PROXY + encodeURIComponent(RSS(ch.user)));
      const xml = new DOMParser().parseFromString(await r.text(), 'text/xml');
      const t = xml.querySelector('feed > entry > title');
      return t ? t.textContent : null;
    } catch (e) { return null; }
  }

  function render(view) {
    window.__view = view;
    const sd = studied();
    const pick = CH[daySeed() % CH.length];

    const cards = CH.map(c => {
      const s = sd[c.user] || { min: 0, done: false };
      const rec = c.user === pick.user ? '<span class="chip">★ 今日推荐</span>' : '';
      return `
      <div class="item" style="flex-direction:column;align-items:stretch;gap:8px">
        <div class="row" style="align-items:center">
          <div class="meta"><div class="title">${Util.esc(c.name)}</div></div>
          ${rec}
          <a class="btn sec" href="https://www.youtube.com/user/${c.user}" target="_blank" rel="noopener" style="text-decoration:none">打开频道</a>
        </div>
        <div class="eng-latest muted" data-ch="${c.user}" style="font-size:13px">最新：加载中…</div>
        <div class="row" style="align-items:center">
          <div class="check ${s.done ? 'on' : ''}" data-chk="${c.user}">${s.done ? '✓' : ''}</div>
          <span style="font-size:13px">学过</span>
          <input class="input" data-min="${c.user}" type="number" value="${s.min}" placeholder="分钟" style="max-width:90px" />
        </div>
      </div>`;
    }).join('');

    view.innerHTML = `
      <div class="card">
        <div class="head-row">
          <h2>🎬 英语学习台</h2>
          <button class="btn ghost" id="engRefresh">🔄 刷新最新</button>
        </div>
        <div class="card-sub">${Util.pretty()} · 精选油管播客/频道，点“刷新”拉最新视频</div>
        <p class="muted" style="font-size:12px;margin-bottom:6px">💡 学英语建议：先盲听→看字幕→跟读→复述。每日挑 1 个频道跟练 15–30 分钟。</p>
        <div id="engList" style="display:flex;flex-direction:column;gap:10px">${cards}</div>
      </div>`;

    // 勾选 / 分钟
    view.querySelectorAll('[data-chk]').forEach(el => el.onclick = () => {
      const u = el.dataset.chk; const o = studied(); o[u] = o[u] || { min: 0, done: false };
      o[u].done = !o[u].done; saveStudied(o); render(view);
    });
    view.querySelectorAll('[data-min]').forEach(el => el.oninput = () => {
      const u = el.dataset.min; const o = studied(); o[u] = o[u] || { min: 0, done: false };
      o[u].min = +el.value || 0; saveStudied(o);
    });

    // 刷新最新视频
    const refresh = view.querySelector('#engRefresh');
    refresh.onclick = async () => {
      refresh.innerHTML = '<span class="spin">🔄</span> 刷新中';
      const titles = await Promise.all(CH.map(fetchLatest));
      titles.forEach((t, i) => {
        const el = view.querySelector(`[data-ch="${CH[i].user}"]`);
        if (el) el.textContent = '最新：' + (t || '（暂未取到，点“打开频道”查看）');
      });
      refresh.textContent = '🔄 刷新最新';
    };
    // 首次自动拉一次（轻量）
    refresh.onclick();
  }

  window.English = { render };
})();
