/* ===== 模块1：每日运势（基于八字 · 大白话版） ===== */
(function () {
  const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const WX = { 甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水' };
  const SHENG = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' }; // 我生
  const KE = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };     // 我克
  const COLOR = { 木: '绿色', 火: '红色', 土: '黄色', 金: '白色', 水: '蓝色' };
  const ELEM_C = { 木: '#4caf86', 火: '#ef6b7d', 土: '#e8a33d', 金: '#9aa7b5', 水: '#5b9bd5' };
  // 五行 → 幸运数字（河图“生数”，成数 = 生数+5）
  const ELEM_NUM = { 木: 3, 火: 2, 土: 5, 金: 4, 水: 1 };
  // 当日日干 → 吉时（传统“贵人时”，粗略映射）
  const GUI_SHI = {
    甲: ['丑', '未'], 戊: ['丑', '未'], 庚: ['丑', '未'],
    乙: ['子', '申'], 己: ['子', '申'],
    丙: ['亥', '酉'], 丁: ['亥', '酉'],
    壬: ['卯', '巳'], 癸: ['卯', '巳'],
    辛: ['寅', '午']
  };
  const ZHI_TIME = {
    子: '23-1点', 丑: '1-3点', 寅: '3-5点', 卯: '5-7点', 辰: '7-9点', 巳: '9-11点',
    午: '11-13点', 未: '13-15点', 申: '15-17点', 酉: '17-19点', 戌: '19-21点', 亥: '21-23点'
  };

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

    // ===== 大白话总评（5 级）=====
    let comment;
    if (stars >= 5) comment = '今天你的状态特别在线！整个人气场很足，想推进的事、想说的话，今天都格外顺，贵人也容易主动找上门。别浪费好运气，该出手就出手～';
    else if (stars === 4) comment = '今天整体挺顺的，按部就班来就能有不错的收获。适合把计划里的事一件件推进，不用太焦虑。';
    else if (stars === 3) comment = '今天是平稳的一天，没什么大起大落。把日常小事做好、顺便整理一下自己就很好，重要的冒险先放一放。';
    else if (stars === 2) comment = '今天稍微有点卡，沟通容易急、事情也容易拖。重要决定能缓就缓，先把情绪稳住最要紧。';
    else comment = '今天适合低调一点，少折腾、多休息。有些事看开了反而轻松，明天又是新的一天。';

    // 把术语“日干关系”翻译成口语状态描述
    const stateText = ({
      '比和': '今天跟你气场特别合拍，做事顺手',
      '我生（付出）': '今天你是付出比较多的一方，精力容易外散',
      '今日生我（得助）': '今天容易有人帮你，遇到难处别硬扛',
      '我克（掌控）': '今天你比较能掌控局面，适合主导',
      '今日克我（受制）': '今天容易感觉被事情压着，先听后说更稳'
    })[rel] || '';

    // 玄学小数据
    const luckyNum = ELEM_NUM[tEl];
    const guiShi = (GUI_SHI[tGan] || []).map(z => `${z}时(${ZHI_TIME[z]})`).join('、');

    return { me, tGz, rel, stars, lucky, luckyColor: ELEM_C[tEl], yi, ji, chong, comment, zodiac: me.zodiac, luckyNum, guiShi, stateText };
  }

  // ===== 玄学注意事项（根据星级/关系/冲煞动态生成）=====
  function notes(f) {
    const a = [];
    if (f.stars >= 4) a.push('今天气场旺，适合主动社交、谈事、做决定，别缩着。');
    if (f.rel.indexOf('得助') >= 0) a.push('容易遇到帮你的人，开口求助比自己硬扛划算。');
    if (f.rel.indexOf('付出') >= 0) a.push('今天精力容易外散，付出多收获少，别太操心别人的事。');
    if (f.rel.indexOf('受制') >= 0) a.push('重要场合先听后说，别抢话，少做重大决定。');
    if (f.chong) a.push(`今天和你生肖相冲（${f.chong}），尽量别做重大抉择、也别远行，宜静不宜动。`);
    a.push('再准的运势也只是图个好心情，真正的好坏还是看你今天怎么过～');
    return a;
  }

  function render(view) {
    if (!SITE.bazi || !SITE.bazi.y) {
      view.innerHTML = `
        <div class="card">
          <h2>🔮 每日运势</h2>
          <p style="color:var(--text-soft);line-height:1.9;margin:8px 0">还没有设置出生信息，运势暂时算不了～</p>
          <p class="muted">打开左上角 ⚙️ 设置 →「个人资料」，填一下出生年 / 月 / 日 / 小时，运势就会按你的命盘推算啦（纯属娱乐）。</p>
          <button class="btn" onclick="document.getElementById('settingsBtnSide').click()">去设置</button>
        </div>`;
      return;
    }
    const f = compute();
    const starHtml = Array.from({ length: 5 }, (_, i) =>
      `<span class="${i < f.stars ? '' : 'off'}">★</span>`).join('');
    const yiHtml = f.yi.length ? f.yi.map(x => `<span class="tag">${Util.esc(x)}</span>`).join(' ') : '<span class="muted">—</span>';
    const jiHtml = f.ji.length ? f.ji.map(x => `<span class="tag">${Util.esc(x)}</span>`).join(' ') : '<span class="muted">—</span>';
    const noteHtml = notes(f).map(t => `<li>${Util.esc(t)}</li>`).join('');

    view.innerHTML = `
      <div class="card">
        <h2>🔮 每日运势</h2>
        <div class="card-sub">根据你的命盘（${f.me.zodiac}年）推算 · 纯属娱乐，图个好心情 💕</div>

        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:8px">
          <div class="stars">${starHtml}</div>
          <span class="chip" style="background:${f.luckyColor}22;color:${f.luckyColor}">今天旺你的颜色：${f.lucky}</span>
        </div>

        <p style="margin:6px 0 16px;color:var(--text-soft);line-height:1.85;font-size:15px">${Util.esc(f.comment)}</p>

        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <span class="chip">🍀 幸运数字：${f.luckyNum}（也可试试 ${f.luckyNum + 5}）</span>
          <span class="chip">⏰ 吉时：${f.guiShi || '—'}</span>
        </div>
        ${f.stateText ? `<p class="muted" style="margin:12px 0 0;font-size:13px">💡 ${Util.esc(f.stateText)}</p>` : ''}

        <div class="row" style="gap:18px;margin-top:16px">
          <div style="flex:1;min-width:150px">
            <div style="font-size:13px;color:var(--muted);margin-bottom:6px">✅ 今日宜</div>
            <div>${yiHtml}</div>
          </div>
          <div style="flex:1;min-width:150px">
            <div style="font-size:13px;color:var(--muted);margin-bottom:6px">❌ 今日忌</div>
            <div>${jiHtml}</div>
          </div>
        </div>

        <div class="card" style="margin-top:16px;background:var(--surface2)">
          <div style="font-weight:700;margin-bottom:8px">🔮 玄学注意事项</div>
          <ul style="margin:0;padding-left:18px;color:var(--text-soft);line-height:1.9;font-size:14px">${noteHtml}</ul>
        </div>

        <p class="muted" style="margin-top:14px;font-size:12px">命盘参考：${f.me.yg} ${f.me.mg} ${f.me.dg} ${f.me.hg}（出生时辰在设置 → 个人资料里改成真实时间会更准）。</p>
      </div>`;
  }

  window.Fortune = { render, compute };
})();
