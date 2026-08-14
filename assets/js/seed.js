/* ===== 首次打开时灌入示例数据 =====
 * 仅在本地没有任何数据（wb_seeded 标记不存在）时运行一次。
 * 之后你在界面上记的真实数据不会被覆盖；想清空重来可在浏览器控制台执行
 * localStorage.clear() 后刷新。
 */
(function () {
  const FLAG = 'wb_seeded_v1';

  function seed() {
    if (localStorage.getItem(FLAG)) return;
    try {
      const now = new Date();
      const y = now.getFullYear(), m = now.getMonth();
      const dk = (day) => { const d = new Date(y, m, day); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
      const ts = (day, h = 12) => new Date(y, m, day, h, 0, 0).getTime();

      /* ---------- 1. 记账：本月多天，覆盖各分类 ---------- */
      const fin = DB.get('finance', {});
      // 月初工资
      fin[dk(1)] = [{ id: Util.uid(), type: 'in', amount: 5200, cat: '工资', note: '本月工资', ts: ts(1, 10) }];
      // 每日支出模式（轮流不同分类，保证扇形图丰富）
      const pat = [
        [['餐饮', 32, '早餐'], ['交通', 15, '地铁']],
        [['餐饮', 45, '午餐'], ['购物', 99, '日用品']],
        [['娱乐', 38, '电影']],
        [['餐饮', 28, '奶茶'], ['学习', 59, '网课']],
        [['居住', 800, '房租水电']],
        [['餐饮', 52, '聚餐'], ['交通', 20, '打车']],
        [['医疗', 60, '感冒药']],
        [['购物', 258, '护肤品'], ['餐饮', 35, '外卖']],
        [['娱乐', 30, '视频会员'], ['餐饮', 42, '晚餐']],
        [['餐饮', 18, '咖啡'], ['交通', 15, '地铁']],
        [['学习', 99, '买书'], ['餐饮', 40, '午餐']],
        [['购物', 199, '衣服'], ['餐饮', 33, '早餐']],
        [['餐饮', 50, '下午茶'], ['娱乐', 45, '游戏']],
      ];
      const maxDay = Math.min(now.getDate(), 14);
      for (let day = 2; day <= maxDay; day++) {
        const items = pat[(day - 2) % pat.length];
        fin[dk(day)] = items.map(([cat, amount, note]) => ({ id: Util.uid(), type: 'out', amount, cat, note, ts: ts(day, 13) }));
      }
      // 今天（today）再来一两笔
      fin[dk(now.getDate())] = [
        { id: Util.uid(), type: 'out', amount: 16, cat: '餐饮', note: '早餐', ts: ts(now.getDate(), 8) },
        { id: Util.uid(), type: 'out', amount: 22, cat: '交通', note: '地铁', ts: ts(now.getDate(), 9) },
      ];
      DB.set('finance', fin);

      /* ---------- 2. 待办：今天 ---------- */
      const todo = DB.get('todo', {});
      todo[dk(now.getDate())] = [
        { id: Util.uid(), text: '完成 RuoYi 项目模块联调', done: false, ts: ts(now.getDate(), 9) },
        { id: Util.uid(), text: '背 20 个西语单词', done: false, ts: ts(now.getDate(), 9) },
        { id: Util.uid(), text: '看一集英语播客跟读', done: true, ts: ts(now.getDate(), 10) },
        { id: Util.uid(), text: '晚上跑步 3 公里', done: false, ts: ts(now.getDate(), 10) },
        { id: Util.uid(), text: '整理本月记账明细', done: false, ts: ts(now.getDate(), 11) },
      ];
      DB.set('todo', todo);

      /* ---------- 3. 运动饮食：近 7 天 + 今天 ---------- */
      const health = DB.get('health', {});
      const dayPlan = [
        { food: [['早餐·鸡蛋牛奶', 320], ['午餐·粉面', 580], ['晚餐·沙拉', 260]], ex: [['快走', 150]], water: 6 },
        { food: [['早餐·包子豆浆', 300], ['午餐·盖饭', 650], ['晚餐·火锅', 720]], ex: [['跑步 3km', 320]], water: 5 },
        { food: [['早餐·面包', 260], ['午餐·便当', 600], ['晚餐·粥', 220]], ex: [], water: 4 },
        { food: [['早餐·三明治', 340], ['午餐·螺蛳粉', 560], ['晚餐·轻食', 300]], ex: [['瑜伽', 120]], water: 7 },
        { food: [['早餐·牛奶燕麦', 290], ['午餐·牛肉面', 620], ['晚餐·炒菜', 480]], ex: [['骑车', 200]], water: 6 },
        { food: [['早餐·鸡蛋', 280], ['午餐·快餐', 700], ['晚餐·水果', 180]], ex: [['跳绳', 160]], water: 5 },
        { food: [['早餐·鸡蛋牛奶', 320], ['午餐·宫保鸡丁饭', 650], ['晚餐·沙拉', 280]], ex: [['跑步 3km', 320]], water: 5 }, // 今天
      ];
      for (let i = 6; i >= 0; i--) {
        const dt = new Date(y, m, now.getDate() - i);
        const day = dt.getDate();
        const p = dayPlan[6 - i];
        const food = p.food.map(([name, kcal]) => ({ name, kcal }));
        const ex = p.ex.map(([name, kcal]) => ({ name, kcal }));
        health[dk(day)] = { food, ex, water: p.water };
      }
      DB.set('health', health);

      /* ---------- 4. 西语：今天（让单词/听说写看起来已有进度） ---------- */
      const spanish = DB.get('spanish', {});
      if (!spanish[dk(now.getDate())]) {
        spanish[dk(now.getDate())] = {
          words: [
            { t: 'el trabajo', m: '工作', done: true },
            { t: 'aprender', m: '学习', done: true },
            { t: 'la comida', m: '食物', done: false },
            { t: 'el ejercicio', m: '运动', done: false },
            { t: 'descansar', m: '休息', done: false },
          ],
          listen: { min: 20, done: true },
          speak: { min: 10, done: false },
          write: { text: 'Hoy aprendí cinco palabras nuevas y escuché un podcast.', done: false },
          articleDone: true,
        };
        DB.set('spanish', spanish);
      }

      /* ---------- 5. 英语：今天学过的频道 ---------- */
      const english = DB.get('english', {});
      if (!english[dk(now.getDate())]) {
        english[dk(now.getDate())] = {
          'BBCLearningEnglish': { min: 20, done: true },
          'englishwithlucy': { min: 15, done: true },
          'SpeakEnglishWithVanessa': { min: 0, done: false },
          'VOALearningEnglish': { min: 10, done: false },
          'englishclass101': { min: 0, done: false },
          'TED': { min: 0, done: false },
        };
        DB.set('english', english);
      }

      localStorage.setItem(FLAG, '1');
    } catch (e) {
      console.warn('示例数据写入失败', e);
    }
  }

  // store.js 已先加载，DB/Util 已就绪
  seed();
})();
