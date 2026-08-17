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

    // 导出 Excel（按模块分 sheet，纯前端 SheetJS）
    document.getElementById('exportExcelBtn').onclick = () => {
      if (typeof XLSX === 'undefined') { alert('Excel 组件未加载，请刷新页面后重试'); return; }
      const get = (k) => DB.get(k, {});
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      const ts = (t) => (t ? new Date(t).toLocaleString('zh-CN') : '');
      const sheets = {};

      // 记账
      {
        const fin = get('finance');
        const a = [['日期', '类型', '分类', '金额(元)', '备注', '记录时间']];
        Object.keys(fin).sort().forEach(dk => (fin[dk] || []).forEach(r => {
          a.push([dk, r.type === 'in' ? '收入' : '支出', r.cat, r.amount, r.note || '', ts(r.ts)]);
        }));
        if (a.length > 1) sheets['记账'] = a;
      }

      // 待办
      {
        const td = get('todo');
        const a = [['日期', '内容', '是否完成', '记录时间']];
        Object.keys(td).sort().forEach(dk => (td[dk] || []).forEach(r => {
          a.push([dk, r.text, r.done ? '是' : '否', ts(r.ts)]);
        }));
        if (a.length > 1) sheets['待办'] = a;
      }

      // 运动饮食
      {
        const h = get('health');
        const a = [['日期', '类型', '名称', '数值', '单位']];
        Object.keys(h).sort().forEach(dk => {
          const d = h[dk] || {};
          (d.food || []).forEach(f => a.push([dk, '饮食(摄入)', f.name, f.kcal, 'kcal']));
          (d.ex || []).forEach(e => a.push([dk, '运动(消耗)', e.name, e.kcal, 'kcal']));
          if (d.water) a.push([dk, '饮水', d.water, d.water, 'ml']);
        });
        if (a.length > 1) sheets['运动饮食'] = a;
      }

      // 西语
      {
        const sp = get('spanish');
        const a = [['日期', '单句(西)', '单句(中)', '是否掌握', '听力(min)', '口语(min)', '写作内容', '短文完成']];
        Object.keys(sp).sort().forEach(dk => {
          const d = sp[dk] || {};
          const arr = d.sentences || [];
          if (arr.length === 0) {
            a.push([dk, '', '', '', d.listen ? d.listen.min : '', d.speak ? d.speak.min : '', d.write ? d.write.text : '', d.articleDone ? '是' : '否']);
          } else {
            arr.forEach((s, i) => a.push([
              dk, s.t, s.m, s.done ? '是' : '否',
              i === 0 && d.listen ? d.listen.min : '',
              i === 0 && d.speak ? d.speak.min : '',
              i === 0 && d.write ? d.write.text : '',
              i === 0 && d.articleDone ? '是' : '否'
            ]));
          }
        });
        if (a.length > 1) sheets['西语'] = a;
      }

      // 英语
      {
        const en = get('english');
        const a = [['日期', '频道', '听力(min)', '是否完成', '每日单句(英)', '每日单句(中)', '文章标题']];
        Object.keys(en).sort().forEach(dk => {
          const d = en[dk] || {};
          const sen = (window.English && window.English.sentence) ? window.English.sentence(dk) : null;
          const art = (window.English && window.English.article) ? window.English.article(dk) : null;
          const keys = Object.keys(d);
          if (keys.length === 0) {
            a.push([dk, '', '', '', sen ? sen[0] : '', sen ? sen[1] : '', art ? art.title : '']);
          } else {
            keys.forEach(ch => {
              const s = d[ch] || {};
              a.push([dk, ch, s.min || 0, s.done ? '是' : '否', sen ? sen[0] : '', sen ? sen[1] : '', art ? art.title : '']);
            });
          }
        });
        if (a.length > 1) sheets['英语'] = a;
      }

      // 月度汇总
      {
        const months = {};
        const add = (mk) => months[mk] || (months[mk] = { income: 0, expense: 0, inK: 0, exK: 0, todoDone: 0, todoTotal: 0, esDays: 0, enMin: 0 });
        const fin = get('finance');
        Object.keys(fin).forEach(dk => (fin[dk] || []).forEach(r => { const o = add(dk.slice(0, 7)); if (r.type === 'in') o.income += r.amount; else o.expense += r.amount; }));
        const h = get('health');
        Object.keys(h).forEach(dk => { const d = h[dk] || {}; const o = add(dk.slice(0, 7)); (d.food || []).forEach(f => o.inK += f.kcal || 0); (d.ex || []).forEach(e => o.exK += e.kcal || 0); });
        const td = get('todo');
        Object.keys(td).forEach(dk => (td[dk] || []).forEach(r => { const o = add(dk.slice(0, 7)); o.todoTotal++; if (r.done) o.todoDone++; }));
        const sp = get('spanish');
        Object.keys(sp).forEach(dk => { const d = sp[dk] || {}; const arr = d.sentences || []; const active = arr.length > 0 || (d.listen && d.listen.min) || (d.speak && d.speak.min) || (d.write && d.write.text) || d.articleDone; if (active) add(dk.slice(0, 7)).esDays++; });
        const en = get('english');
        Object.keys(en).forEach(dk => { const d = en[dk] || {}; const o = add(dk.slice(0, 7)); Object.keys(d).forEach(ch => { const s = d[ch] || {}; o.enMin += s.min || 0; }); });
        const ks = Object.keys(months).sort();
        const a = [['月份', '记账收入(元)', '记账支出(元)', '记账净额(元)', '运动摄入(kcal)', '运动消耗(kcal)', '运动净(kcal)', '待办完成/总数', '西语打卡天', '英语学习(分钟)']];
        ks.forEach(mk => { const o = months[mk]; a.push([mk, o.income, o.expense, o.income - o.expense, o.inK, o.exK, o.inK - o.exK, `${o.todoDone}/${o.todoTotal}`, o.esDays, o.enMin]); });
        if (ks.length) sheets['月度汇总'] = a;
      }

      if (Object.keys(sheets).length === 0) { alert('当前还没有可导出的记录数据'); return; }

      const wb = XLSX.utils.book_new();
      Object.keys(sheets).forEach(name => {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheets[name]), name.slice(0, 31));
      });
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
        ['小昕工作台 · 数据导出 (Excel)'],
        ['导出时间', new Date().toLocaleString('zh-CN')],
        ['说明', '本表为各模块历史记录快照，按模块分工作表。'],
        ['提示', '需完整备份/恢复请用同窗口的“导出全部数据(JSON)”。']
      ]), '导出说明');

      XLSX.writeFile(wb, `小昕工作台-数据-${stamp}.xlsx`);
    };

    // 导出 CSV（单文件统一活动流，UTF-8 BOM 防乱码）
    document.getElementById('exportCsvBtn').onclick = () => {
      const get = (k) => DB.get(k, {});
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      const cell = (v) => { const s = String(v == null ? '' : v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
      const rows = [['模块', '日期', '类别', '名称', '数值', '单位', '备注']];
      const fin = get('finance');
      Object.keys(fin).sort().forEach(dk => (fin[dk] || []).forEach(r => rows.push(['记账', dk, r.type === 'in' ? '收入' : '支出', r.cat, r.amount, '元', r.note || ''])));
      const td = get('todo');
      Object.keys(td).sort().forEach(dk => (td[dk] || []).forEach(r => rows.push(['待办', dk, '任务', r.text, '', '', r.done ? '已完成' : '未完成'])));
      const h = get('health');
      Object.keys(h).sort().forEach(dk => { const d = h[dk] || {}; (d.food || []).forEach(f => rows.push(['运动饮食', dk, '饮食(摄入)', f.name, f.kcal, 'kcal', ''])); (d.ex || []).forEach(e => rows.push(['运动饮食', dk, '运动(消耗)', e.name, e.kcal, 'kcal', ''])); if (d.water) rows.push(['运动饮食', dk, '饮水', d.water, d.water, 'ml', '']); });
      const sp = get('spanish');
      Object.keys(sp).sort().forEach(dk => { const d = sp[dk] || {}; const arr = d.sentences || []; if (arr.length === 0) { if (d.listen || d.speak || d.write || d.articleDone) rows.push(['西语', dk, '汇总', `听力${d.listen ? d.listen.min : 0}/口语${d.speak ? d.speak.min : 0}分`, '', '', '短文' + (d.articleDone ? '已完成' : '未完成')]); } else arr.forEach(s => rows.push(['西语', dk, '单句', s.t + ' / ' + s.m, '', '', s.done ? '已掌握' : ''])); });
      const en = get('english');
      Object.keys(en).sort().forEach(dk => { const d = en[dk] || {}; Object.keys(d).forEach(ch => { const s = d[ch] || {}; rows.push(['英语', dk, ch, '学习' + (s.min || 0) + '分钟', '', '', '完成:' + (s.done ? '是' : '否')]); }); });
      if (rows.length === 1) { alert('当前还没有可导出的记录数据'); return; }
      const csv = '﻿' + rows.map(r => r.map(cell).join(',')).join('\r\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `小昕工作台-数据-${stamp}.csv`;
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

    // ===== 云同步（GitHub）=====
    const SYNC_DEF = { repo: 'koi518/koi518.github.io', branch: 'sync', path: 'data.json', token: '' };
    function syncCfg() { return Object.assign({}, SYNC_DEF, DB.get('syncCfg', {})); }
    function b64enc(str) { return btoa(unescape(encodeURIComponent(str))); }
    function b64dec(b64) { return decodeURIComponent(escape(atob(b64.replace(/\s/g, '')))); }
    function setSyncStatus(msg, isErr) {
      const el = document.getElementById('syncStatus');
      if (el) { el.textContent = msg; el.style.color = isErr ? '#ef6b7d' : 'var(--primary-d)'; }
    }
    async function gh(pathUrl, opts) {
      const cfg = syncCfg();
      const headers = Object.assign({ 'Content-Type': 'application/json' }, (opts && opts.headers) || {});
      if (cfg.token) headers['Authorization'] = 'Bearer ' + cfg.token;
      return fetch('https://api.github.com' + pathUrl, Object.assign({ headers }, opts));
    }
    async function ensureBranch(cfg) {
      const r = await gh(`/repos/${cfg.repo}/git/ref/heads/${cfg.branch}`);
      if (r.ok) return;
      if (r.status !== 404) throw new Error('检查分支失败: ' + r.status);
      const info = await gh(`/repos/${cfg.repo}`);
      const def = (await info.json()).default_branch || 'main';
      const ref = await gh(`/repos/${cfg.repo}/git/ref/heads/${def}`);
      if (!ref.ok) throw new Error('取默认分支失败');
      const sha = (await ref.json()).object.sha;
      const c = await gh(`/repos/${cfg.repo}/git/refs`, { method: 'POST', body: JSON.stringify({ ref: `refs/heads/${cfg.branch}`, sha }) });
      if (!c.ok) throw new Error('创建分支失败: ' + c.status);
    }
    async function syncPush() {
      const cfg = syncCfg();
      if (!cfg.token) { setSyncStatus('请先填写并保存 GitHub 令牌', true); return; }
      setSyncStatus('上传中…');
      try {
        await ensureBranch(cfg);
        const data = {};
        for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); data[k] = localStorage.getItem(k); }
        const content = b64enc(JSON.stringify(data));
        let sha = '';
        const get = await gh(`/repos/${cfg.repo}/contents/${cfg.path}?ref=${cfg.branch}`);
        if (get.ok) sha = (await get.json()).sha || '';
        const put = await gh(`/repos/${cfg.repo}/contents/${cfg.path}`, {
          method: 'PUT', body: JSON.stringify({ message: 'sync: ' + new Date().toISOString(), content, branch: cfg.branch, sha })
        });
        if (!put.ok) { const e = await put.json().catch(() => ({})); throw new Error('上传失败 ' + put.status + ' ' + (e.message || '')); }
        setSyncStatus('✅ 已上传到云端');
      } catch (err) { setSyncStatus('❌ ' + err.message, true); }
    }
    async function syncPull() {
      const cfg = syncCfg();
      if (!cfg.token) { setSyncStatus('请先填写并保存 GitHub 令牌', true); return; }
      setSyncStatus('下载中…');
      try {
        const get = await gh(`/repos/${cfg.repo}/contents/${cfg.path}?ref=${cfg.branch}`);
        if (get.status === 404) { setSyncStatus('云端还没有数据，请先上传一份', true); return; }
        if (!get.ok) throw new Error('下载失败 ' + get.status);
        const j = await get.json();
        const data = JSON.parse(b64dec(j.content));
        if (!confirm('下载会用云端数据覆盖本地同名数据，确定继续？')) { setSyncStatus('已取消'); return; }
        Object.keys(data).forEach(k => localStorage.setItem(k, data[k]));
        location.reload();
      } catch (err) { setSyncStatus('❌ ' + err.message, true); }
    }

    // 清除全部数据
    document.getElementById('clearBtn').onclick = () => {
      if (confirm('确定清除本地全部数据吗？此操作不可恢复！')) {
        localStorage.clear();
        location.reload();
      }
    };

    // 云同步（GitHub）：回填配置 + 绑定
    const cfg0 = syncCfg();
    const stEl = document.getElementById('syncToken'), srEl = document.getElementById('syncRepo'),
          sbEl = document.getElementById('syncBranch'), spEl = document.getElementById('syncPath');
    if (stEl) stEl.value = cfg0.token || '';
    if (srEl) srEl.value = cfg0.repo || '';
    if (sbEl) sbEl.value = cfg0.branch || '';
    if (spEl) spEl.value = cfg0.path || '';
    document.getElementById('syncSaveCfg').onclick = () => {
      DB.set('syncCfg', {
        repo: (srEl.value || '').trim(),
        branch: (sbEl.value || '').trim() || 'sync',
        path: (spEl.value || '').trim() || 'data.json',
        token: (stEl.value || '').trim()
      });
      setSyncStatus('✅ 配置已保存（令牌仅存在本机浏览器）');
    };
    document.getElementById('syncPush').onclick = syncPush;
    document.getElementById('syncPull').onclick = syncPull;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
