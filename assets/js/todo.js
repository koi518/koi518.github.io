/* ===== 模块2：每日 Todolist ===== */
(function () {
  const KEY = 'todo';
  function load() { return DB.get(KEY, {}); }
  function save(all) { DB.set(KEY, all); }
  function todayList() {
    const all = load();
    return all[Util.dateKey()] || [];
  }

  function add(text) {
    text = text.trim(); if (!text) return;
    const all = load();
    const d = Util.dateKey();
    all[d] = all[d] || [];
    all[d].unshift({ id: Util.uid(), text, done: false, ts: Date.now() });
    save(all); render(window.__view);
  }
  function toggle(id) {
    const all = load(); const arr = all[Util.dateKey()] || [];
    const it = arr.find(x => x.id === id); if (it) it.done = !it.done;
    save(all); render(window.__view);
  }
  function del(id) {
    const all = load(); const arr = all[Util.dateKey()] || [];
    all[Util.dateKey()] = arr.filter(x => x.id !== id);
    save(all); render(window.__view);
  }

  function render(view) {
    window.__view = view;
    const list = todayList();
    const left = list.filter(x => !x.done).length;
    const items = list.length ? list.map(t => `
      <div class="item">
        <div class="check ${t.done ? 'on' : ''}" data-act="toggle" data-id="${t.id}">${t.done ? '✓' : ''}</div>
        <div class="meta"><div class="title" style="${t.done ? 'text-decoration:line-through;color:var(--muted)' : ''}">${Util.esc(t.text)}</div></div>
        <button class="del" data-act="del" data-id="${t.id}">✕</button>
      </div>`).join('') : '<div class="empty">今天还没有任务，加一个吧 🌟</div>';

    view.innerHTML = `
      <div class="card">
        <div class="head-row">
          <h2>✅ 每日 Todolist</h2>
          <span class="chip">待办 ${left}</span>
        </div>
        <div class="card-sub">${Util.pretty()} · 完成一件划一件</div>
        <div class="row" style="margin-bottom:14px">
          <input class="input" id="todoInput" placeholder="今天要做什么？回车添加" maxlength="120" />
          <button class="btn" id="todoAdd">添加</button>
        </div>
        <div id="todoList">${items}</div>
      </div>`;

    const inp = view.querySelector('#todoInput');
    const fire = () => add(inp.value);
    view.querySelector('#todoAdd').onclick = fire;
    inp.onkeydown = e => { if (e.key === 'Enter') fire(); };
    view.querySelectorAll('[data-act]').forEach(el => {
      el.onclick = () => {
        const id = el.dataset.id;
        if (el.dataset.act === 'toggle') toggle(id);
        else del(id);
      };
    });
  }

  window.Todo = { render };
})();
