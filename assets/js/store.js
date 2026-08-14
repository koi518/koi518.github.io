/* ===== 工具与本地存储层 ===== */
const Util = {
  // 本地日期 YYYY-MM-DD（避免 toISOString 的时区偏移）
  dateKey(d = new Date()) {
    const z = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
  },
  monthKey(d = new Date()) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  },
  uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); },
  esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  },
  money(n) { return '¥' + Number(n || 0).toLocaleString('zh-CN', { maximumFractionDigits: 2 }); },
  // 中文星期
  weekday(d = new Date()) {
    return '星期' + '日一二三四五六'[d.getDay()];
  },
  // 友好日期
  pretty(d = new Date()) {
    return `${d.getMonth() + 1}月${d.getDate()}日 ${this.weekday(d)}`;
  },
};

/* localStorage 封装（带命名空间 + 容错） */
const DB = {
  ns: 'wb_',
  get(k, fallback = null) {
    try {
      const v = localStorage.getItem(this.ns + k);
      return v == null ? fallback : JSON.parse(v);
    } catch (e) { return fallback; }
  },
  set(k, v) {
    try { localStorage.setItem(this.ns + k, JSON.stringify(v)); return true; }
    catch (e) { console.warn('存储失败', e); return false; }
  },
  // 读取某个“按天存储”的模块数据
  day(module, date = Util.dateKey()) {
    const all = this.get(module, {});
    return all[date] || null;
  },
  // 写入某天数据（合并）
  setDay(module, value, date = Util.dateKey()) {
    const all = this.get(module, {});
    all[date] = value;
    return this.set(module, all);
  },
  // 取一段时间范围内的所有天（含空）
  range(module, dates) {
    const all = this.get(module, {});
    return dates.map(d => ({ date: d, data: all[d] || null }));
  },
  // 当月所有日期字符串
  monthDates(y, m) {
    const out = [];
    const d = new Date(y, m, 1);
    while (d.getMonth() === m) { out.push(Util.dateKey(new Date(d))); d.setDate(d.getDate() + 1); }
    return out;
  },
};

/* 站点配置（生日八字等，可改） */
const SITE = DB.get('site', null) || {
  name: '小哭宝',
  bazi: { y: 2004, m: 3, d: 3, h: 12 }, // 默认午时，待校准
};
DB.set('site', SITE);
