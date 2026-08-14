/* ===== 模块6：金融信息（存储芯片 / AI / CPO） ===== */
(function () {
  const PROXY = 'https://api.allorigins.win/raw?url=';
  const FEEDS = {
    kr: 'https://36kr.com/feed',          // 36氪（A股/科技/芯片）
    hn: 'https://hnrss.org/frontpage',    // Hacker News（全球 AI/科技）
  };
  const SECTORS = [
    { key: 'storage', name: '💾 存储芯片', feed: 'kr',
      watch: ['DRAM / NAND 现货价格', '三星 / SK海力士 / 美光财报', 'HBM 供需与产能', '国产存储替代进度'],
      links: [['36氪 芯片', 'https://36kr.com/search/articles/芯片'], ['雪球 存储', 'https://xueqiu.com/S/SH512760']] },
    { key: 'ai', name: '🤖 AI', feed: 'hn',
      watch: ['大模型发布与开源', '算力 / GPU 供需', 'AI 应用落地', '中美 AI 政策'],
      links: [['Hacker News', 'https://news.ycombinator.com/'], ['36氪 AI', 'https://36kr.com/search/articles/AI']] },
    { key: 'cpo', name: '🔌 CPO（共封装光学）', feed: 'kr',
      watch: ['光模块 800G/1.6T 订单', '中际旭创 / 新易盛动态', '硅光技术路线', '数据中心资本开支'],
      links: [['雪球 CPO', 'https://xueqiu.com/S/SH300308'], ['36氪 光模块', 'https://36kr.com/search/articles/光模块']] },
  ];

  async function fetchRSS(url) {
    try {
      const r = await fetch(PROXY + encodeURIComponent(url));
      const xml = new DOMParser().parseFromString(await r.text(), 'text/xml');
      const items = [...xml.querySelectorAll('item, entry')].slice(0, 6);
      return items.map(it => {
        const t = it.querySelector('title'); const l = it.querySelector('link');
        return { title: t ? t.textContent : '', link: l ? (l.textContent || (l.getAttribute('href') || '')) : '#' };
      });
    } catch (e) { return null; }
  }

  function render(view) {
    window.__view = view;
    const cards = SECTORS.map(s => `
      <div class="card">
        <div class="head-row"><h2>${s.name}</h2></div>
        <div style="margin:8px 0">
          ${s.watch.map(w => `<span class="tag">${Util.esc(w)}</span>`).join(' ')}
        </div>
        <div class="row" style="margin:8px 0">
          ${s.links.map(([n, u]) => `<a class="btn sec" href="${u}" target="_blank" rel="noopener" style="text-decoration:none;font-size:13px">${Util.esc(n)}</a>`).join('')}
        </div>
        <div class="eng-latest" data-sec="${s.key}" style="margin-top:6px;font-size:13px;color:var(--muted)">头条：点击右上角“刷新”获取最新</div>
      </div>`).join('');

    view.innerHTML = `
      <div class="card">
        <div class="head-row">
          <h2>📈 每日金融信息</h2>
          <button class="btn ghost" id="fnRefresh">🔄 刷新头条</button>
        </div>
        <div class="card-sub">关注：存储芯片 · AI · CPO ｜ 点刷新拉取最新（失败则显示精选源）</div>
        ${cards}
      </div>`;

    view.querySelector('#fnRefresh').onclick = async (e) => {
      const btn = e.currentTarget; btn.innerHTML = '<span class="spin">🔄</span> 刷新中';
      const [kr, hn] = await Promise.all([fetchRSS(FEEDS.kr), fetchRSS(FEEDS.hn)]);
      SECTORS.forEach(s => {
        const data = s.feed === 'hn' ? hn : kr;
        const el = view.querySelector(`[data-sec="${s.key}"]`);
        if (!el) return;
        if (data && data.length) {
          el.innerHTML = '<div style="margin-top:4px">' + data.map(d =>
            `<div class="news"><span class="dot"></span><a href="${Util.esc(d.link)}" target="_blank" rel="noopener">${Util.esc(d.title)}</a></div>`
          ).join('') + '</div>';
        } else {
          el.textContent = '（暂未取到实时头条，点上方来源链接查看）';
        }
      });
      btn.textContent = '🔄 刷新头条';
    };
  }

  window.FinanceNews = { render };
})();
