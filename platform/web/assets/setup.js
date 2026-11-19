/* ============================================================================
   配置向导与页面引导：空库首次配置、全局帮助、页面空态跳转
   ========================================================================== */
(function (w) {
  const { UI, API, Shell, icon, esc } = w;
  const CACHE_MS = 8000;
  const state = { data: null, at: 0, loading: null, fab: null };
  const CREATE_SEL = {
    models: '[data-new]',
    envs: '[data-new-env]',
    samples: '[data-act="new-sample"]',
    agents: '[data-new-agent]'
  };
  const HELP = {
    dashboard: ['攻防总览', '先看四步配置进度与实时态势；配置完成后再关注 ASR、风险分布与 Token 费用。'],
    tasks: ['攻击任务', '发起任务前需要：被测模型、测试环境、攻击智能体、至少一条样本。任务运行中可暂停/注入/终止。'],
    studio: ['攻击编排', '用节点库拼链路，校验通过后保存模板；空库可先载入模板或从零拖节点。'],
    agents: ['攻击智能体', '智能体绑定被测模型与 System Prompt，是任务的执行主体。先建模型，再建智能体。'],
    samples: ['样本工厂', '样本是攻击载荷。可新建、生成、从任务回流或远程同步；生成前建议先有种子样本。'],
    evals: ['评估中心', '评估需要被测模型与裁判模型；规则库内置 10 条，可直接勾选后创建评估。'],
    models: ['模型网关', '被测模型 = Endpoint + 模型标识 + API Key。保存后必须点「校验」；也可使用内置靶标体验。'],
    envs: ['测试环境', '靶场是任务隔离运行环境。新建后先启动，再在参数配置里设置系统提示词与温度。'],
    infra: ['资源与容器', '查看 CPU/内存/存储与容器状态；资源告警在此确认。'],
    defense: ['防护插件', '输入/输出插件与失败策略；可用 A/B 对比验证拦截收益。'],
    data: ['数据资产', '数据清洗、资产仓与导出；RAG 投毒用于验证检索链路。'],
    open: ['开放能力', 'API Key、OpenAPI 与 MCP 集成；API Key 明文只显示一次。'],
    security: ['账号与安全', '用户、角色权限矩阵、会话与登录日志；新用户首次登录强制改密。'],
    admin: ['系统管理', '租户、成员、角色、权限矩阵、供应链与红蓝演练。'],
    reqs: ['需求覆盖', '167 条需求的实现方式、模块与落地页面追溯。']
  };


  const CSS = `
  .setup-hero{position:relative;margin:0 0 16px;padding:18px 20px 16px;border-radius:14px;
    background:linear-gradient(120deg,#111c33 0%,#0d1729 55%,#111b30 100%);border:1px solid #263b5e;
    box-shadow:0 10px 30px rgba(6,14,30,.22);color:#E8EFF9;overflow:hidden}
  .setup-hero:before{content:"";position:absolute;right:-40px;top:-60px;width:220px;height:220px;border-radius:50%;
    background:radial-gradient(circle,rgba(72,112,255,.32),transparent 65%)}
  .sh-k{font-size:10.5px;letter-spacing:.12em;color:#8FA6C8;text-transform:uppercase}
  .sh-k b{color:#AFC6FF;letter-spacing:0}
  .sh-h{font-size:19px;font-weight:650;letter-spacing:-.02em;margin:7px 0 4px}
  .sh-p{font-size:12px;line-height:1.7;color:#9FB0C9;max-width:760px}
  .sh-bar,.sd-bar{height:5px;border-radius:6px;background:rgba(255,255,255,.09);overflow:hidden;margin:12px 0 14px}
  .sh-bar i,.sd-bar i{display:block;height:100%;border-radius:6px;background:linear-gradient(90deg,#3D6BFF,#57C7FF)}
  .sh-list{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
  .sh-step{display:flex;gap:9px;align-items:flex-start;padding:10px;border:1px solid rgba(255,255,255,.09);
    border-radius:10px;background:rgba(255,255,255,.035);min-width:0}
  .sh-step.ok{border-color:rgba(60,200,150,.28);background:rgba(30,120,90,.1)}
  .sh-n{flex:0 0 20px;width:20px;height:20px;border-radius:50%;background:rgba(255,255,255,.12);
    font-size:11px;line-height:20px;text-align:center;color:#C9D8EE}
  .sh-step.ok .sh-n{background:#16A36A;color:#fff}
  .sh-tx{min-width:0;flex:1}
  .sh-tx b{display:block;font-size:12px;font-weight:620;line-height:1.4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .sh-tx span{display:block;font-size:10.5px;line-height:1.5;color:#8FA3C0;margin-top:3px}
  .sh-step .btn{padding:3px 7px;font-size:10.5px;height:24px;flex:0 0 auto}
  .sh-actions{display:flex;gap:8px;align-items:center;margin-top:12px}
  .sh-actions .btn{height:30px;font-size:11.5px}
  .setup-fab{position:fixed;right:22px;bottom:22px;z-index:900;display:flex;align-items:center;gap:7px;
    padding:9px 12px;border-radius:22px;border:1px solid #2C4A78;background:linear-gradient(135deg,#1E3A66,#152B4D);
    color:#E8F1FF;box-shadow:0 8px 22px rgba(10,25,50,.35);font-size:12px;cursor:grab;
    touch-action:none;user-select:none;transition:transform .14s,box-shadow .14s,opacity .14s}
  .setup-fab b{font-size:10.5px;background:#E5484D;color:#fff;border-radius:10px;padding:1px 6px;line-height:16px}
  .setup-fab:hover{transform:translateY(-1px)}
  .setup-fab.dragging{cursor:grabbing;transform:none!important;transition:none;
    box-shadow:0 12px 30px rgba(10,25,50,.5)}
  body:has(.drawer) .setup-fab,body:has(.modal) .setup-fab{opacity:0;pointer-events:none;transform:none}
  .setup-drawer{font-size:12.5px;color:var(--text-2)}
  .sd-top{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border:1px solid var(--line);
    border-radius:12px;background:var(--surface-2)}
  .sd-k{font-size:10.5px;color:var(--text-3);letter-spacing:.08em}
  .sd-v{font-size:17px;font-weight:650;margin-top:3px;color:var(--text)}
  .sd-ring{width:52px;height:52px;border-radius:50%;display:grid;place-items:center;font-size:11px;font-weight:650;
    color:var(--brand);background:conic-gradient(var(--brand) var(--p),var(--line-2) 0)}
  .sd-ring:after{content:"";position:absolute}
  .sd-bar{background:var(--line-2);margin:10px 0}
  .sd-note{font-size:11.5px;color:var(--text-3);line-height:1.7;margin-bottom:10px}
  .sd-steps{display:flex;flex-direction:column;gap:8px}
  .sd-steps .sh-step{border-color:var(--line);background:var(--surface);color:var(--text)}
  .sd-steps .sh-step.ok{border-color:#B7E4CE;background:#F2FBF7}
  .sd-steps .sh-n{background:var(--surface-3,#EEF2F8);color:var(--text-2)}
  .sd-steps .sh-step.ok .sh-n{background:#16A36A;color:#fff}
  .sd-steps .sh-tx b{font-size:12.5px;color:var(--text)}
  .sd-steps .sh-tx span{font-size:11px;color:var(--text-3)}
  .sd-why{margin-top:14px;padding:12px 14px;border-radius:10px;background:var(--surface-2);border:1px solid var(--line)}
  .sd-why b{font-size:12px;color:var(--text)}
  .sd-why p{font-size:11.5px;line-height:1.8;color:var(--text-2);margin:5px 0 0}
  .sd-actions{display:flex;gap:8px;margin-top:14px}
  @media (max-width:1100px){.sh-list{grid-template-columns:repeat(2,1fr)}}
  @media (max-width:640px){.sh-list{grid-template-columns:1fr}.setup-hero{padding:14px}.setup-fab{right:12px;bottom:12px}}
  `;
  if (!document.getElementById('setup-css')) {
    const st = document.createElement('style'); st.id = 'setup-css'; st.textContent = CSS; document.head.appendChild(st);
  }

  function isAdmin() {
    const u = (Shell.me && Shell.me.user) || {};
    return u.role_code === 'admin' || /平台管理员/.test(u.role || '');
  }

  async function load(force) {
    if (!isAdmin()) return null;
    if (!force && state.data && Date.now() - state.at < CACHE_MS) return state.data;
    if (state.loading) return state.loading;
    state.loading = API.get('/api/setup/status').then((d) => {
      state.data = d; state.at = Date.now(); state.loading = null;
      return d;
    }).catch((e) => {
      state.loading = null;
      state.data = null;
      return null;
    });
    return state.loading;
  }

  function stepDone(d, key) {
    const s = (d.steps || []).find((x) => x.key === key);
    return !!(s && s.done);
  }

  function stepHTML(s, i) {
    return `<div class="sh-step ${s.done ? 'ok' : ''}">
      <div class="sh-n">${s.done ? '✓' : i + 1}</div>
      <div class="sh-tx"><b>${esc(s.title)}</b><span>${esc(s.desc)}</span></div>
      <button class="btn ${s.done ? 'ghost' : 'primary'} sm" data-setup-go="${s.page}">${s.done ? '查看' : '去配置'}</button>
    </div>`;
  }

  function cardHTML(d) {
    return `<section class="setup-hero" id="setup-hero">
      <div class="sh-k">首次配置 <b>${d.done}/${d.total}</b></div>
      <div class="sh-h">先完成 4 步，再开始第一次攻防</div>
      <div class="sh-p">系统已内置 ${d.counts.models} 个本地靶标模型、${d.counts.agents} 个攻击智能体、${d.counts.samples} 条分类样本；补齐未完成项即可开始任务与评估。</div>
      <div class="sh-bar"><i style="width:${Math.round(d.done / d.total * 100)}%"></i></div>
      <div class="sh-list">${(d.steps || []).map(stepHTML).join('')}</div>
      <div class="sh-actions">
        <button class="btn" data-setup-open>打开配置向导</button>
        <button class="btn primary" data-setup-quick>${icon('bolt', 13)}一键补齐体验环境</button>
      </div>
    </section>`;
  }

  function drawerHTML(d) {
    return `<div class="setup-drawer">
      <div class="sd-top">
        <div><div class="sd-k">配置进度</div><div class="sd-v">${d.done}/${d.total} 已完成</div></div>
        <div class="sd-ring" style="--p:${d.done / d.total * 100}%">${Math.round(d.done / d.total * 100)}%</div>
      </div>
      <div class="sd-bar"><i style="width:${d.done / d.total * 100}%"></i></div>
      <div class="sd-note">${d.ready ? '配置已完成，可以直接发起第一次攻击任务。' : '内置资源已自动标记完成；先补齐未完成项，再开始任务。每步都可以点「去配置」跳到对应页面。'}</div>
      <div class="sd-steps">${(d.steps || []).map(stepHTML).join('')}</div>
      <div class="sd-why">
        <b>为什么需要这 4 步？</b>
        <p>任务执行链是「样本 → 智能体 → 被测模型 → 靶场 → 判定」。缺少任一项，新建任务时下拉框会为空，任务也无法产生有效结果。</p>
      </div>
      <div class="sd-actions">
        <button class="btn" data-setup-quick>${icon('bolt', 13)}内置靶标快速体验</button>
        ${d.ready ? '<button class="btn primary" data-setup-task>去发起任务</button>' : ''}
      </div>
    </div>`;
  }

  async function open() {
    const d = await load(true);
    if (!d) { UI.toast('配置向导暂不可用', 'err'); return; }
    UI.drawer({
      title: '配置向导',
      sub: '从空库到第一次攻击 · 管理员专用',
      width: '640px',
      body: drawerHTML(d)
    });
  }

  async function quickstart() {
    if (!isAdmin()) return;
    UI.modal({
      title: '一键补齐体验环境',
      okText: '创建体验配置',
      body: `<div style="font-size:12.5px;line-height:1.85;color:var(--text-2)">
        <p>将自动补齐以下缺失项（已存在的不重复创建，通常只需创建体验靶场）：</p>
        <ul style="margin:8px 0 0 18px;padding:0">
          <li>内置靶标模型：<code>${esc(location.origin)}/mock/v1/chat/completions</code></li>
          <li>体验靶场 L1、1 条提示词泄露样本、1 个通用体验智能体</li>
        </ul>
        <p style="margin-top:10px">默认已内置本地靶标模型、4800 条样本与 10 个智能体；正式测试请在「模型网关」接入真实被测模型。</p>
      </div>`,
      onOk: async () => {
        try {
          const r = await API.post('/api/setup/quickstart', { origin: location.origin });
          UI.closeAllDialogs();
          UI.toast(`体验配置已创建（${r.done}/${r.total} 步）`);
          state.data = null; state.at = 0;
          await refresh();
          location.hash = '#/tasks';
          setTimeout(() => {
            const b = document.querySelector('[data-act="new"]');
            if (b) b.click();
          }, 1200);
        } catch (e) {
          UI.toast('创建失败：' + (e.message || e), 'err');
          return false;
        }
      }
    });
  }

  function openCreate(page) {
    const sel = CREATE_SEL[page];
    if (!sel) return;
    if (page === 'models') { location.hash = '#/models'; }
    else if (page === 'envs') { location.hash = '#/envs'; }
    else if (page === 'samples') { location.hash = '#/samples'; }
    else if (page === 'agents') { location.hash = '#/agents'; }
    UI.closeAllDialogs();
    setTimeout(() => {
      const btn = document.querySelector(sel);
      if (btn) btn.click();
      else UI.toast('页面尚未加载完成，请稍后再点一次', 'err');
    }, 1200);
  }

  const FAB_KEY = 'tianshu_setup_fab_pos_v1';

  function clipFab(fab, left, top) {
    const r = fab.getBoundingClientRect();
    const maxL = Math.max(8, window.innerWidth - r.width - 8);
    const maxT = Math.max(8, window.innerHeight - r.height - 8);
    return { left: Math.min(Math.max(8, left), maxL), top: Math.min(Math.max(8, top), maxT) };
  }

  function placeFab(fab, left, top, save) {
    const p = clipFab(fab, left, top);
    fab.style.left = p.left + 'px';
    fab.style.top = p.top + 'px';
    fab.style.right = 'auto';
    fab.style.bottom = 'auto';
    if (save) { try { localStorage.setItem(FAB_KEY, JSON.stringify(p)); } catch (e) {} }
  }

  function restoreFab(fab) {
    try {
      const p = JSON.parse(localStorage.getItem(FAB_KEY) || 'null');
      if (p && Number.isFinite(p.left) && Number.isFinite(p.top)) {
        placeFab(fab, p.left, p.top, false);
        return;
      }
    } catch (e) {}
    fab.style.left = ''; fab.style.top = '';
    fab.style.right = '22px'; fab.style.bottom = '22px';
  }

  function makeFabDraggable(fab) {
    if (fab.dataset.dragReady) return;
    fab.dataset.dragReady = '1';
    let drag = null;
    fab.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      const r = fab.getBoundingClientRect();
      drag = { x: e.clientX, y: e.clientY, left: r.left, top: r.top, moved: false, id: e.pointerId };
      fab.classList.add('dragging');
      try { fab.setPointerCapture(e.pointerId); } catch (err) {}
    });
    fab.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 4) return;
      drag.moved = true;
      placeFab(fab, drag.left + dx, drag.top + dy, false);
      e.preventDefault();
    });
    const end = () => {
      if (!drag) return;
      const moved = drag.moved;
      fab.classList.remove('dragging');
      if (moved) {
        const r = fab.getBoundingClientRect();
        placeFab(fab, r.left, r.top, true);
        fab._dragMovedAt = Date.now();
      }
      drag = null;
    };
    fab.addEventListener('pointerup', end);
    fab.addEventListener('pointercancel', end);
    fab.addEventListener('click', (e) => {
      if (fab._dragMovedAt && Date.now() - fab._dragMovedAt < 320) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    }, true);
    window.addEventListener('resize', () => {
      if (fab.style.left) placeFab(fab, parseFloat(fab.style.left), parseFloat(fab.style.top), true);
    });
  }

  function ensureFab(d) {
    if (!isAdmin()) return;
    let fab = state.fab || document.querySelector('.setup-fab');
    let created = false;
    if (!fab) {
      fab = document.createElement('button');
      fab.className = 'setup-fab';
      fab.setAttribute('data-setup-open', '');
      fab.setAttribute('title', '点击打开配置向导；按住可拖动位置');
      fab.setAttribute('aria-label', '配置向导，可拖动');
      document.body.appendChild(fab);
      state.fab = fab;
      created = true;
    }
    if (d && !d.ready) {
      fab.style.display = 'flex';
      fab.innerHTML = `${icon('help', 15)}<span>配置向导</span><b>${d.done}/${d.total}</b>`;
    } else {
      fab.style.display = 'none';
    }
    if (created) {
      restoreFab(fab);
      makeFabDraggable(fab);
    }
  }

  async function refresh() {
    if (!isAdmin()) {
      const b = document.querySelector('[data-setup]');
      if (b) b.style.display = 'none';
      return;
    }
    const d = await load(false);
    if (!d) return;
    const top = document.querySelector('[data-setup]');
    if (top) {
      top.style.display = 'inline-flex';
      top.title = `配置向导（${d.done}/${d.total}）`;
      const badge = top.querySelector('[data-setup-badge]');
      if (badge) {
        badge.textContent = d.ready ? '✓' : `${d.done}/${d.total}`;
        badge.style.background = d.ready ? 'var(--ok, #0B9E6E)' : 'var(--danger)';
      }
    }
    ensureFab(d);
    const root = document.querySelector('#view');
    if (root && location.hash.replace('#/', '') === 'dashboard') {
      const old = root.querySelector('#setup-hero');
      if (old) old.remove();
      if (!d.ready) root.insertAdjacentHTML('afterbegin', cardHTML(d));
    }
  }

  function help() {
    const id = (location.hash || '#/dashboard').replace('#/', '') || 'dashboard';
    const h = HELP[id] || ['使用说明', '当前页面的操作说明。可打开配置向导查看空库初始化步骤。'];
    UI.drawer({
      title: h[0] + ' · 使用引导',
      sub: '当前页面能做什么、第一步做什么',
      width: '600px',
      body: `<div style="font-size:12.5px;line-height:1.9;color:var(--text-2)">
        <p>${esc(h[1])}</p>
        <div class="note" style="margin-top:14px">如果页面数据为空，通常是还没完成前置配置。配置向导会按「模型 → 靶场 → 样本 → 智能体」引导。</div>
        <div class="row" style="margin-top:16px;gap:8px">
          <button class="btn primary" data-setup-open>打开配置向导</button>
          <a class="btn" href="#/models">模型网关</a>
          <a class="btn" href="#/envs">测试环境</a>
        </div>
      </div>`
    });
  }

  w.Setup = { refresh, open, help, quickstart, dashboard: (root) => refresh(), load };

  document.addEventListener('click', (e) => {
    const go = e.target.closest('[data-setup-go]');
    if (go) { e.preventDefault(); openCreate(go.dataset.setupGo); return; }
    if (e.target.closest('[data-setup-open]')) { e.preventDefault(); open(); return; }
    if (e.target.closest('[data-setup-quick]')) { e.preventDefault(); quickstart(); return; }
    if (e.target.closest('[data-setup-task]')) {
      e.preventDefault(); UI.closeAllDialogs(); location.hash = '#/tasks';
      setTimeout(() => { const b = document.querySelector('[data-act="new"]'); if (b) b.click(); }, 1200);
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(refresh, 900);
    setTimeout(refresh, 2200);
  });
  window.addEventListener('hashchange', () => setTimeout(refresh, 700));
})(window);
