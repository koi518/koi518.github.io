/* ===== 主程序：导航 / 主题 / 路由 ===== */
(function () {
  // 8 个模块头像（Hello Kitty 图，mascots/2~9.png；品牌头像用 1.png）
  const MODULES = [
    { key: 'fortune', name: '每日运势', img: 'assets/img/mascots/2.png', render: () => window.Fortune.render(view) },
    { key: 'todo', name: '待办清单', img: 'assets/img/mascots/3.png', render: () => window.Todo.render(view) },
    { key: 'finance', name: '每日记账', img: 'assets/img/mascots/4.png', render: () => window.Finance.render(view) },
    { key: 'spanish', name: '西语学习', img: 'assets/img/mascots/5.png', render: () => window.Spanish.render(view) },
    { key: 'english', name: '英语学习', img: 'assets/img/mascots/6.png', render: () => window.English.render(view) },
    { key: 'financenews', name: '金融信息', img: 'assets/img/mascots/7.png', render: () => window.FinanceNews.render(view) },
    { key: 'ainews', name: 'AI 播报', img: 'assets/img/mascots/8.png', render: () => window.AINews.render(view) },
    { key: 'health', name: '运动饮食', img: 'assets/img/mascots/9.png', render: () => window.Health.render(view) },
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

  // 主题（仅 浅色 / 深色 两态）
  const THEME_LABEL = { light: '浅色', dark: '深色' };
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    const lbl = document.getElementById('themeLabel'); if (lbl) lbl.textContent = THEME_LABEL[t];
  }
  function cycleTheme() {
    const order = ['light', 'dark'];
    const cur = DB.get('theme', 'light');
    const next = order[(order.indexOf(cur) + 1) % order.length];
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
    const bm = document.getElementById('brandMascot');
    bm.innerHTML = '<img src="assets/img/mascots/1.png" alt="小昕">';
  }

  // 初始化
  function init() {
    applyTheme(DB.get('theme', 'light'));
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

    // 设置弹窗：打开 / 关闭
    const modal = document.getElementById('settingsModal');
    const openSettings = () => modal.classList.add('show');
    const closeSettings = () => modal.classList.remove('show');
    document.getElementById('settingsBtnTop').onclick = openSettings;
    document.getElementById('settingsBtnSide').onclick = openSettings;
    document.getElementById('settingsClose').onclick = closeSettings;
    modal.onclick = (e) => { if (e.target === modal) closeSettings(); };
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSettings(); });

    // 导出全部数据（打包所有 localStorage 为 JSON 下载）
    document.getElementById('exportBtn').onclick = () => {
      const data = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        data[k] = localStorage.getItem(k);
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      a.href = url;
      a.download = `小昕工作台-数据备份-${stamp}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    };

    // 导入数据（覆盖同名）
    document.getElementById('importFile').onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          if (confirm('导入会用文件内容覆盖当前同名数据，确定继续？')) {
            Object.keys(data).forEach(k => localStorage.setItem(k, data[k]));
            location.reload();
          }
        } catch (err) { alert('文件解析失败：' + err.message); }
      };
      reader.readAsText(file);
      e.target.value = '';
    };

    // 清除全部数据
    document.getElementById('clearBtn').onclick = () => {
      if (confirm('确定清除本地全部数据吗？此操作不可恢复！')) {
        localStorage.clear();
        location.reload();
      }
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
