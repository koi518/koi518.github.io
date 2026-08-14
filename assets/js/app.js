/* ===== 主程序：导航 / 主题 / 路由 ===== */
(function () {
  // 8 个模块形象（Hello Kitty 主题图）
  const IMG = 'assets/img/mascots/';
  const MODULES = [
    { key: 'fortune', name: '每日运势', img: IMG + '7.png', render: () => window.Fortune.render(view) },
    { key: 'todo', name: '待办清单', img: IMG + '1.png', render: () => window.Todo.render(view) },
    { key: 'finance', name: '每日记账', img: IMG + '6.png', render: () => window.Finance.render(view) },
    { key: 'spanish', name: '西语学习', img: IMG + '4.png', render: () => window.Spanish.render(view) },
    { key: 'english', name: '英语学习', img: IMG + '8.png', render: () => window.English.render(view) },
    { key: 'financenews', name: '金融信息', img: IMG + '5.png', render: () => window.FinanceNews.render(view) },
    { key: 'ainews', name: 'AI 播报', img: IMG + '2.png', render: () => window.AINews.render(view) },
    { key: 'health', name: '运动饮食', img: IMG + '3.png', render: () => window.Health.render(view) },
  ];

  const view = document.getElementById('view');
  const navEl = document.getElementById('nav');
  let active = 'fortune';

  function badge(key) {
    if (key === 'todo') { const l = DB.day('todo') || []; const n = l.filter(x => !x.done).length; return n ? String(n) : ''; }
    if (key === 'finance') { const l = DB.day('finance') || []; return l.length ? String(l.length) : ''; }
    return '';
  }

  function mascotHTML(m) {
    return m.img ? `<img src="${m.img}" alt="">` : `<span>${m.emoji || '✨'}</span>`;
  }
  function buildNav() {
    navEl.innerHTML = MODULES.map(m => `
      <button class="nav-item ${m.key === active ? 'active' : ''}" data-key="${m.key}">
        <span class="mascot">${mascotHTML(m)}</span>
        <span class="nav-label">${m.name}</span>
        ${badge(m.key) ? `<span class="nav-badge">${badge(m.key)}</span>` : ''}
      </button>`).join('');
    navEl.querySelectorAll('.nav-item').forEach(b => b.onclick = () => select(b.dataset.key));
  }

  function select(key) {
    active = key;
    const m = MODULES.find(x => x.key === key);
    buildNav();
    window.scrollTo(0, 0);
    m.render();
    // 手机端选完关闭抽屉
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('scrim').classList.remove('show');
  }

  // 主题
  const THEME_LABEL = { auto: '自动', light: '浅色', dark: '深色' };
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    const lbl = document.getElementById('themeLabel'); if (lbl) lbl.textContent = THEME_LABEL[t];
  }
  function cycleTheme() {
    const order = ['auto', 'light', 'dark'];
    const cur = DB.get('theme', 'auto');
    const next = order[(order.indexOf(cur) + 1) % 3];
    DB.set('theme', next); applyTheme(next);
  }

  // 日期栏
  function refreshHeader() {
    const now = new Date();
    const lu = Lunar.fromDate(now);
    let jq = ''; try { jq = lu.getJieQi(); } catch (e) {}
    document.getElementById('mainDate').textContent = Util.pretty(now);
    document.getElementById('brandDate').textContent = Util.pretty(now);
    document.getElementById('mainLunar').textContent =
      `农历 ${lu.getMonthInChinese()}月${lu.getDayInChinese()}` + (jq ? ` · ${jq}` : '');
    const h = now.getHours();
    const g = h < 6 ? '凌晨好' : h < 12 ? '早上好' : h < 14 ? '中午好' : h < 18 ? '下午好' : '晚上好';
    document.getElementById('greet').textContent = `${g}，${SITE.name} 💕`;
    document.getElementById('brandMascot').innerHTML = `<img src="${IMG}9.png" alt="">`;
  }

  // 初始化
  function init() {
    applyTheme(DB.get('theme', 'auto'));
    refreshHeader();
    buildNav();
    MODULES.find(m => m.key === active).render();

    document.getElementById('themeBtn').onclick = cycleTheme;
    const tb2 = document.getElementById('themeBtn2'); if (tb2) tb2.onclick = cycleTheme;
    document.getElementById('menuBtn').onclick = () => {
      document.getElementById('sidebar').classList.toggle('open');
      document.getElementById('scrim').classList.toggle('show');
    };
    document.getElementById('scrim').onclick = () => {
      document.getElementById('sidebar').classList.remove('open');
      document.getElementById('scrim').classList.remove('show');
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
