/* ===== 模块7：AI 信息播报（国内外大厂） ===== */
(function () {
  const PROXY = 'https://api.allorigins.win/raw?url=';
  const FEEDS = {
    hn: 'https://hnrss.org/frontpage',
    tc: 'https://techcrunch.com/category/artificial-intelligence/feed/',
    kr: 'https://36kr.com/feed',
  };
  const COMPANIES = [
    ['OpenAI', 'https://openai.com/blog'], ['Anthropic', 'https://www.anthropic.com/news'],
    ['Google DeepMind', 'https://deepmind.google/discover/blog/'], ['Meta AI', 'https://ai.meta.com/blog/'],
    ['Microsoft', 'https://blogs.microsoft.com/'], ['xAI', 'https://x.ai/'],
    ['百度 文心', 'https://yiyan.baidu.com/'], ['阿里 通义', 'https://tongyi.aliyun.com/'],
    ['字节 豆包', 'https://www.doubao.com/'], ['腾讯 混元', 'https://hunyuan.tencent.com/'],
    ['华为 盘古', 'https://www.huaweicloud.com/'], ['月之暗面 Kimi', 'https://kimi.moonshot.cn/'],
    ['智谱 GLM', 'https://www.zhipuai.cn/'], ['DeepSeek', 'https://www.deepseek.com/'],
  ];

  async function fetchRSS(url) {
    try {
      const r = await fetch(PROXY + encodeURIComponent(url));
      const xml = new DOMParser().parseFromString(await r.text(), 'text/xml');
      return [...xml.querySelectorAll('item, entry')].slice(0, 8).map(it => {
        const t = it.querySelector('title'); const l = it.querySelector('link');
        return { title: t ? t.textContent : '', link: l ? (l.textContent || (l.getAttribute('href') || '')) : '#' };
      });
    } catch (e) { return null; }
  }

  function render(view) {
    window.__view = view;
    const chips = COMPANIES.map(([n, u]) =>
      `<a class="btn sec" href="${u}" target="_blank" rel="noopener" style="text-decoration:none;font-size:13px">${Util.esc(n)}</a>`).join('');

    view.innerHTML = `
      <div class="card">
        <div class="head-row">
          <h2>🛰️ 每日 AI 播报</h2>
          <button class="btn ghost" id="aiRefresh">🔄 刷新播报</button>
        </div>
        <div class="card-sub">${Util.pretty()} · 国内外大型 AI 公司动态</div>
        <div style="font-size:13px;color:var(--muted);margin:6px 0 8px">重点公司（点开看官方动态）</div>
        <div class="row">${chips}</div>
        <div id="aiNews" style="margin-top:14px;font-size:13px;color:var(--muted)">头条：点击右上角“刷新”获取最新</div>
      </div>`;

    view.querySelector('#aiRefresh').onclick = async (e) => {
      const btn = e.currentTarget; btn.innerHTML = '<span class="spin">🔄</span> 刷新中';
      const [hn, tc, kr] = await Promise.all([fetchRSS(FEEDS.hn), fetchRSS(FEEDS.tc), fetchRSS(FEEDS.kr)]);
      const box = view.querySelector('#aiNews');
      const parts = [];
      const push = (label, data) => {
        if (data && data.length) {
          parts.push(`<div style="margin:10px 0 4px;font-weight:700">${label}</div>` +
            data.map(d => `<div class="news"><span class="dot"></span><a href="${Util.esc(d.link)}" target="_blank" rel="noopener">${Util.esc(d.title)}</a></div>`).join(''));
        }
      };
      push('🌍 全球（Hacker News / TechCrunch）', hn && tc ? hn.concat(tc).slice(0, 8) : (hn || tc));
      push('🇨🇳 国内（36氪）', kr);
      box.innerHTML = parts.length ? parts.join('') : '（暂未取到实时头条，点上方公司链接查看）';
      btn.textContent = '🔄 刷新播报';
    };
  }

  window.AINews = { render };
})();
