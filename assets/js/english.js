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
  // 结合当下新闻事实的每日英文短文，每日轮换
  const ARTICLES = [
    {
      title: 'Milano Cortina 2026 Winter Olympics',
      en: "The 2026 Winter Olympics concluded in Milan and Cortina, Italy. China won five gold medals, its best result at an overseas Winter Games. Eileen Gu became the most decorated freestyle skier in Olympic history with six career medals.",
      zh: '2026 年冬奥会在意大利米兰-科尔蒂纳闭幕。中国夺得五枚金牌，创下境外冬奥会最佳战绩。谷爱凌以六枚奖牌成为奥运史上获得奖牌最多的自由式滑雪运动员。',
      tip: '词汇：conclude（闭幕/结束）、decorated（获奖无数的）、freestyle（自由式）。听力建议：BBC Learning English 搜 "sport" 主题。'
    },
    {
      title: 'Webb Telescope Finds Hidden Giant Planet',
      en: "NASA's James Webb Telescope discovered a hidden giant planet in the Beta Pictoris system, about 63 light-years from Earth. The planet, Beta Pictoris d, has at least twice the mass of Jupiter and was found through its atmospheric chemistry.",
      zh: 'NASA 的詹姆斯·韦伯望远镜在距地球约 63 光年的绘架座 β 星系中发现一颗隐藏的巨行星。这颗名为 Beta Pictoris d 的行星质量至少是木星的两倍，是通过大气化学成分发现的。',
      tip: '词汇：discover（发现）、atmospheric（大气的）、chemistry（化学）、light-year（光年）。口语建议：用 30 秒复述这段新闻。'
    },
    {
      title: 'Olympic Spirit Brings the World Together',
      en: "Athletes from over 90 countries competed with respect and friendship at the Winter Olympics. A married couple from China won gold on the same day, a touching moment the world will remember.",
      zh: '来自 90 多个国家的运动员在冬奥会上以尊重与友谊同场竞技。中国一对夫妻在同一天夺金，这一感人时刻将被世界铭记。',
      tip: '词汇：respect（尊重）、friendship（友谊）、touching（感人的）、compete（参赛）。写作建议：用这 3 个词写一段关于合作的短文。'
    },
    {
      title: 'Science Looks Farther into Space',
      en: "Scientists use powerful telescopes to study distant planets. Each discovery helps us better understand the universe and our place in it.",
      zh: '科学家使用强大的望远镜研究遥远的星球。每一次发现都帮助我们更好地理解宇宙以及我们在其中的位置。',
      tip: '词汇：telescope（望远镜）、distant（遥远的）、universe（宇宙）、discovery（发现）。听力建议：VOA Learning English 慢速新闻。'
    },
  ];
  function dailyArticle() { return ARTICLES[daySeed() % ARTICLES.length]; }
  // 每日英语单句（英→中），每日轮换
  const SENTENCES = [
    ['Practice makes perfect.', '熟能生巧。'],
    ['A little progress each day adds up to big results.', '每天的微小进步，终将累积成大成果。'],
    ['Learning a language opens new doors.', '学一门语言会打开新的大门。'],
    ['Consistency is the key to success.', '坚持是成功的关键。'],
    ['Mistakes are part of learning.', '犯错是学习的一部分。'],
    ['Read every day, even just a little.', '每天都要阅读，哪怕只是一点点。'],
    ['Speak out loud to build confidence.', '大声说出来，建立自信。'],
    ['Curiosity keeps the mind young.', '好奇心让头脑保持年轻。'],
    ['Today is a good day to start.', '今天就是开始的好日子。'],
    ['Small steps lead to big changes.', '一小步也能带来大改变。'],
  ];
  function dailySentence() { return SENTENCES[daySeed() % SENTENCES.length]; }
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
    const art = dailyArticle();
    const sen = dailySentence();

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

        <div class="card" style="margin-bottom:12px">
          <div class="head-row">
            <h2>💬 今日英语单句</h2>
            <span class="chip">每日轮换</span>
          </div>
          <div class="card-sub">${Util.pretty()} · 跟读 + 翻译练习</div>
          <h3 style="margin:6px 0 8px">${Util.esc(sen[0])}</h3>
          <div class="article-zh">${Util.esc(sen[1])}</div>
        </div>

        <div class="card" style="margin-bottom:12px">
          <div class="head-row">
            <h2>📰 今日英文短文</h2>
            <span class="chip">结合当日新闻</span>
          </div>
          <div class="card-sub">${Util.pretty()} · 双语阅读 + 词汇提示</div>
          <h3 style="margin:6px 0 8px">${Util.esc(art.title)}</h3>
          <div class="article-es">${Util.esc(art.en)}</div>
          <div class="article-zh">${Util.esc(art.zh)}</div>
          <div class="article-tip">💡 ${Util.esc(art.tip)}</div>
        </div>

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
