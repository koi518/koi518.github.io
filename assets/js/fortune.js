/* ===== 模块1：每日运势（基于八字） ===== */
(function () {
  const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const WX = { 甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水' };
  const SHENG = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' }; // 我生
  const KE = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };     // 我克
  const COLOR = { 木: '绿色', 火: '红色', 土: '黄色', 金: '白色', 水: '蓝色' };
  const ELEM_C = { 木: '#4caf86', 火: '#ef6b7d', 土: '#e8a33d', 金: '#9aa7b5', 水: '#5b9bd5' };

  function hourPillar(dayGanChar, h) {
    const gi = GAN.indexOf(dayGanChar);
    const startHour = [23, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21];
    let idx = 0;
    if (h >= 1 && h < 23) { for (let i = 1; i < 12; i++) if (h >= startHour[i]) idx = i; }
    const ziGan = (gi % 5) * 2;
    const pGan = GAN[(ziGan + idx * 2) % 10];
    return pGan + ZHI[idx];
  }

  function bazi() {
    const b = SITE.bazi;
    const lu = Lunar.fromDate(new Date(b.y, b.m - 1, b.d, b.h));
    const yg = lu.getYearInGanZhi(), mg = lu.getMonthInGanZhi(), dg = lu.getDayInGanZhi();
    const hg = hourPillar(dg[0], b.h);
    return { yg, mg, dg, hg, gan: dg[0], zodiac: lu.getYearShengXiao() };
  }

  function compute() {
    const me = bazi();
    const t = Lunar.fromDate(new Date());
    const tGz = t.getDayInGanZhi();
    const tGan = tGz[0];
    const meEl = WX[me.gan], tEl = WX[tGan];

    let rel, score = 0;
    if (meEl === tEl) { rel = '比和'; score += 1; }
    else if (SHENG[meEl] === tEl) { rel = '我生（付出）'; score += 0; }
    else if (SHENG[tEl] === meEl) { rel = '今日生我（得助）'; score += 2; }
    else if (KE[meEl] === tEl) { rel = '我克（掌控）'; score += 1; }
    else { rel = '今日克我（受制）'; score -= 2; }

    let chong = '';
    try { chong = t.getChong(); } catch (e) {}
    if (chong && chong.indexOf(me.zodiac) >= 0) score -= 1;

    let stars = 3 + score;
    stars = Math.max(1, Math.min(5, stars));

    const lucky = COLOR[tEl];
    const yi = (t.getDayYi() || []).slice(0, 8);
    const ji = (t.getDayJi() || []).slice(0, 8);

    let comment;
    if (stars >= 5) comment = '今日气场很旺，适合推进重要的事，贵人运也不错～';
    else if (stars === 4) comment = '整体顺遂，按节奏来就能有不错收获。';
    else if (stars === 3) comment = '平稳的一天，宜守不宜冒进，把小事做好就很好。';
    else if (stars === 2) comment = '稍显阻滞，重要决定可缓一缓，注意沟通别急。';
    else comment = '今日宜低调养护，少折腾、多休息，明天会更好。';

    return { me, tGz, rel, stars, lucky, luckyColor: ELEM_C[tEl], yi, ji, chong, comment, zodiac: me.zodiac };
  }

  function render(view) {
    const f = compute();
    const starHtml = Array.from({ length: 5 }, (_, i) =>
      `<span class="${i < f.stars ? '' : 'off'}">★</span>`).join('');
    const yiHtml = f.yi.length ? f.yi.map(x => `<span class="tag">${Util.esc(x)}</span>`).join(' ') : '<span class="muted">—</span>';
    const jiHtml = f.ji.length ? f.ji.map(x => `<span class="tag">${Util.esc(x)}</span>`).join(' ') : '<span class="muted">—</span>';

    view.innerHTML = `
      <div class="card">
        <h2>🧧 每日运势</h2>
        <div class="card-sub">根据你的八字（${f.me.yg}年 ${f.me.zodiac}）推算 · 仅供参考</div>
        <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
          <div style="font-size:15px;font-weight:700">${f.me.yg} ${f.me.mg} ${f.me.dg} ${f.me.hg}</div>
          <div class="stars">${starHtml}</div>
          <span class="chip" style="background:${f.luckyColor}22;color:${f.luckyColor}">幸运色 ${f.lucky}</span>
        </div>
        <p style="margin:14px 0;color:var(--text-soft);line-height:1.7">${Util.esc(f.comment)}</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px">
          <span class="chip">日干关系：${Util.esc(f.rel)}</span>
          ${f.chong ? `<span class="chip" style="background:#ef6b7d22;color:#ef6b7d">今日冲 ${Util.esc(f.chong)}</span>` : ''}
        </div>
        <div class="row" style="gap:18px">
          <div style="flex:1;min-width:200px">
            <div style="font-size:13px;color:var(--muted);margin-bottom:6px">宜</div>
            <div>${yiHtml}</div>
          </div>
          <div style="flex:1;min-width:200px">
            <div style="font-size:13px;color:var(--muted);margin-bottom:6px">忌</div>
            <div>${jiHtml}</div>
          </div>
        </div>
        <p class="muted" style="margin-top:14px;font-size:12px">提示：出生时辰默认按午时(12:00)。在 app.js 的 SITE.bazi.h 改成你的真实时辰，运势会更准。</p>
      </div>`;
  }

  window.Fortune = { render, compute };
})();
