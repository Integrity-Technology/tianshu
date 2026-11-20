/* ============================================================================
   应用外壳：路由 / 布局 / 组件助手 / 交互
   ========================================================================== */
(function (w) {
  const Icons = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M14 17.5h7M17.5 14v7"/>',
    server: '<rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01M11 7.5h5M11 16.5h5"/>',
    dashboard: '<path d="M3 3h7v7H3zM14 3h7v4h-7zM14 11h7v10h-7zM3 14h7v7H3z"/>',
    attack: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
    sample: '<path d="M12 3 3 8l9 5 9-5-9-5Z"/><path d="m3 13 9 5 9-5"/><path d="m3 17.5 9 5 9-5"/>',
    eval: '<path d="M4 19V5"/><path d="M4 19h16"/><path d="m7 15 4-4 3 3 5-6"/>',
    agent: '<rect x="4" y="7" width="16" height="12" rx="3"/><path d="M9 12h.01M15 12h.01"/><path d="M12 3v4M8 19v2M16 19v2"/>',
    model: '<path d="M7 18a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.4A3.5 3.5 0 0 1 18 18H7Z"/>',
    env: '<path d="M21 8 12 3 3 8v8l9 5 9-5V8Z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
    shield: '<path d="m12 3 8 3v6c0 5-3.4 8.4-8 9-4.6-.6-8-4-8-9V6l8-3Z"/><path d="m9 12 2 2 4-4"/>',
    data: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7"/>',
    open: '<path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1"/>',
    admin: '<circle cx="9" cy="8" r="3.2"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M17 11a3 3 0 1 0 0-6"/><path d="M21.5 20a5 5 0 0 0-3.5-4.8"/>',
    reqs: '<rect x="3" y="4" width="18" height="17" rx="3"/><path d="m8 10 2 2 3-3M8 16h8"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>',
    bell: '<path d="M18 8a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7"/><path d="M10.5 20a2 2 0 0 0 3 0"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/>',
    stop: '<rect x="7" y="7" width="10" height="10" rx="2"/>',
    play: '<path d="m8 5 11 7-11 7V5Z"/>',
    download: '<path d="M12 3v12"/><path d="m7 11 5 5 5-5"/><path d="M4 21h16"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    check: '<path d="m5 13 4 4L19 7"/>',
    bolt: '<path d="m13 2-9 12h7l-1 8 9-12h-7l1-8Z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    filter: '<path d="M3 5h18l-7 8v6l-4 2v-8L3 5Z"/>',
    more: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
    key: '<circle cx="8" cy="12" r="4"/><path d="M12 12h9M18 12v3M15 12v2"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9a2.5 2.5 0 1 1 4.1 2c-.8.6-1.7 1.1-1.7 2.2"/><path d="M12 17h.01"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>'
  };
  const icon = (n, size = 16, cls = 'ic') =>
    `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${Icons[n] || ''}</svg>`;

  const NAV = [
    { group: '攻防作业', items: [
      { id: 'dashboard', label: '攻防总览', icon: 'dashboard' },
      { id: 'tasks', label: '攻击任务', icon: 'attack', badge: null },
      { id: 'studio', label: '攻击编排', icon: 'grid' },
      { id: 'agents', label: '攻击智能体', icon: 'agent' }
    ]},
    { group: '资产与评估', items: [
      { id: 'samples', label: '样本工厂', icon: 'sample' },
      { id: 'evals', label: '评估中心', icon: 'eval' }
    ]},
    { group: '平台能力', items: [
      { id: 'models', label: '模型网关', icon: 'model' },
      { id: 'envs', label: '测试环境', icon: 'env' },
      { id: 'infra', label: '资源与容器', icon: 'server' },
      { id: 'defense', label: '防护插件', icon: 'shield' }
    ]},
    { group: '数据与开放', items: [
      { id: 'data', label: '数据资产', icon: 'data' },
      { id: 'open', label: '开放能力', icon: 'open' }
    ]},
    { group: '平台治理', items: [
      { id: 'security', label: '账号与安全', icon: 'key' },
      { id: 'admin', label: '系统管理', icon: 'admin' },
      // 已隐藏「需求覆盖」页面菜单；如需恢复，去掉下一行行首的 // 即可
      // { id: 'reqs', label: '需求覆盖', icon: 'reqs' }
    ]}
  ];

  /* -------------------------------------------------------------- 基础设施 */
  const csrfToken = () => {
    const m = String(document.cookie || '').match(/(?:^|;\s*)ls_csrf=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : '';
  };
  const toLogin = (force) => {
    const next = location.pathname === '/login.html' ? ''
      : '?next=' + encodeURIComponent(location.pathname + (location.hash || ''));
    location.replace('/login.html' + (force ? '?force=1' : next));
  };
  const API = {
    async req(method, url, body) {
      const opt = { method, headers: {}, credentials: 'same-origin', cache: 'no-store' };
      if (method !== 'GET') {
        const t = csrfToken();
        if (t) opt.headers['X-CSRF-Token'] = t;
      }
      if (body) { opt.headers['Content-Type'] = 'application/json'; opt.body = JSON.stringify(body); }
      let r;
      try { r = await fetch(url, opt); }
      catch (e) { throw new Error('网络异常，无法连接服务器'); }
      if (r.status === 401) { toLogin(false); throw new Error('登录已过期，请重新登录'); }
      const j = await r.json().catch(() => ({ code: -1, message: '响应解析失败' }));
      if (j.code === 4010) { toLogin(false); throw new Error(j.message || '请先登录'); }
      if (j.code === 4032) { toLogin(true); throw new Error(j.message || '首次登录需先修改密码'); }
      if (j.code !== 0) throw new Error(j.message || '请求失败');
      if (method !== 'GET') { GS_CACHE = null; GS_AT = 0; }
      return j.data;
    },
    get(u, q) { return this.req('GET', u + (q ? '?' + new URLSearchParams(q) : '')); },
    post(u, b) { return this.req('POST', u, b); },
    put(u, b) { return this.req('PUT', u, b); },
    del(u) { return this.req('DELETE', u); }
  };

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  /* 只允许站内相对地址、锚点与 http(s)；拒绝 javascript:/data:/// 外站协议 */
  const safeHref = (u) => {
    const s = String(u == null ? '' : u).trim();
    return /^(https?:\/\/|\/(?!\/)|#|\.{1,2}\/)/i.test(s) ? s : '#';
  };
  const num = (n) => {
    if (n == null || n === '') return '—';
    if (typeof n === 'number') return Number.isFinite(n) ? n.toLocaleString('zh-CN') : '—';
    const raw = String(n).trim();
    const v = Number(raw.replace(/,/g, ''));
    return Number.isFinite(v) ? v.toLocaleString('zh-CN') : raw;
  };
  const money = (n) => {
    const v = Number(n);
    if (!Number.isFinite(v)) return '—';
    return Math.abs(v) >= 10000
      ? '¥' + (v / 10000).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' 万'
      : '¥' + v.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  const ago = (s) => {
    if (s == null || s === '') return '—';
    let raw = s, t = NaN;
    if (s instanceof Date) t = s.getTime();
    else if (typeof s === 'number') t = s < 1e12 ? s * 1000 : s;
    else {
      const str = String(s).trim();
      if (/^\d+$/.test(str)) t = Number(str) < 1e12 ? Number(str) * 1000 : Number(str);
      else t = new Date(str.replace(/-/g, '/')).getTime();
    }
    if (!Number.isFinite(t) || isNaN(t)) return String(raw);
    const d = Math.floor((Date.now() - t) / 1000);
    if (d < 0) return String(raw).slice(0, 10);
    if (d < 60) return '刚刚';
    if (d < 3600) return Math.floor(d / 60) + ' 分钟前';
    if (d < 86400) return Math.floor(d / 3600) + ' 小时前';
    if (d < 86400 * 30) return Math.floor(d / 86400) + ' 天前';
    const dt = new Date(t);
    return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
  };

  /* -------------------------------------------------------------- 组件 */
  const TONE = {
    '运行中': 'brand', '排队中': 'gray', '已完成': 'ok', '已终止': 'danger', '已暂停': 'warn',
    '启用': 'ok', '停用': 'gray', '已撤销': 'danger', '通过': 'ok', '未校验': 'warn',
    '高危': 'danger', '中危': 'warn', '低危': 'gray', '在线': 'ok', '已停止': 'gray', '已销毁': 'danger'
  };
  let dlgSeq = 0;
  const DIALOG_STACK = [];
  const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  const focusableIn = (el) => Array.from(el.querySelectorAll(FOCUSABLE))
    .filter((x) => x.getClientRects().length && getComputedStyle(x).visibility !== 'hidden');
  function setAppInert(on) {
    const app = document.getElementById('app');
    if (!app) return;
    try { app.inert = on; } catch (e) { /* 旧浏览器降级 */ }
    if (on) app.setAttribute('aria-hidden', 'true');
    else app.removeAttribute('aria-hidden');
  }
  /* Esc 关闭 + Tab 焦点循环 + 关闭还焦；返回 dispose 供关闭时调用 */
  function focusFirst(el) {
    try {
      const f = el.querySelector('input:not([disabled]),select:not([disabled]),textarea:not([disabled]),button:not([disabled])');
      (f || el).focus({ preventScroll: true });
    } catch (e) { /* 忽略 */ }
  }
  function registerDialog(el, requestClose) {
    const previous = document.activeElement;
    let disposed = false;
    const entry = { el, requestClose };
    DIALOG_STACK.push(entry);
    if (DIALOG_STACK.length === 1) setAppInert(true);
    const onKey = (e) => {
      if (DIALOG_STACK[DIALOG_STACK.length - 1] !== entry) return;
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); requestClose(); return; }
      if (e.key !== 'Tab') return;
      const f = focusableIn(el);
      if (!f.length) { e.preventDefault(); el.focus(); return; }
      const first = f[0], last = f[f.length - 1];
      if (!el.contains(document.activeElement)) { e.preventDefault(); (e.shiftKey ? last : first).focus(); return; }
      if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    };
    document.addEventListener('keydown', onKey, true);
    setTimeout(() => {
      if (disposed) return;
      const f = focusableIn(el);
      const target = el.querySelector('[autofocus]') || f[0] || el;
      try { target.focus({ preventScroll: true }); } catch (e) { /* 忽略 */ }
    }, 30);
    const handle = {
      dispose() {
        if (disposed) return;
        disposed = true;
        document.removeEventListener('keydown', onKey, true);
        const i = DIALOG_STACK.indexOf(entry);
        if (i >= 0) DIALOG_STACK.splice(i, 1);
        if (!DIALOG_STACK.length) setAppInert(false);
        try { if (previous && previous.isConnected) previous.focus({ preventScroll: true }); } catch (e) { /* 忽略 */ }
      }
    };
    el.__dialogDispose = handle.dispose;
    return handle;
  }
  /* 路由切换时强制收口所有弹层，包括页面 cleanup 直接 remove 的残留 */
  function closeAllDialogs() {
    DIALOG_STACK.slice().reverse().forEach((entry) => {
      try { if (entry.el.__dialogDispose) entry.el.__dialogDispose(); } catch (e) { /* 忽略 */ }
      const sc = entry.el.previousElementSibling;
      entry.el.remove();
      if (sc && sc.classList && sc.classList.contains('scrim')) sc.remove();
    });
    document.querySelectorAll('.scrim').forEach((el) => el.remove());
    setAppInert(false);
  }

  const UI = {
    icon, esc, num, ago, safeHref, money,
    pill(text, tone) {
      const t = tone || TONE[text] || 'gray';
      return `<span class="pill ${t}"><i class="dot"></i>${esc(text)}</span>`;
    },
    pageHd({ title, sub, actions }) {
      return `<div class="page-hd"><div><div class="page-title">${esc(title)}</div>
        ${sub ? `<div class="page-sub">${sub}</div>` : ''}</div>
        <div class="actions">${actions || ''}</div></div>`;
    },
    card({ title, sub, right, body, flush, cls, pad }) {
      const hd = title ? `<div class="card-hd"><h3>${title}</h3>${sub ? `<span class="sub">${sub}</span>` : ''}
        ${right ? `<div class="right">${right}</div>` : ''}</div>` : '';
      return `<section class="card ${cls || ''}">${hd}
        <div class="card-bd ${flush ? 'flush' : ''} ${pad === false ? 'pad-none' : ''}">${body || ''}</div></section>`;
    },
    kpi({ label, value, unit, meta, trend, spark, tone }) {
      return `<div class="kpi">
        <div class="lab">${label}</div>
        <div class="val">${value}${unit ? `<small>${unit}</small>` : ''}</div>
        ${meta ? `<div class="meta">${meta}</div>` : ''}
        ${spark ? `<div class="spark">${spark}</div>` : ''}
      </div>`;
    },
    bar(pct, tone) {
      const n = Number(pct);
      const width = Number.isFinite(n) ? Math.max(2, Math.min(100, n)) : 0;
      return `<div class="bar ${tone || ''}"><i style="width:${width}%"></i></div>`;
    },
    table({ cols, rows, onRow, cls }) {
      rows = Array.isArray(rows) ? rows : [];
      const th = cols.map((c) => `<th style="${c.w ? 'width:' + c.w : ''}">${c.label}</th>`).join('');
      const tr = rows.length ? rows.map((r, i) => `<tr data-i="${i}" class="${onRow ? 'clickable' : ''}"` +
        `${onRow ? ' tabindex="0" role="button"' : ''}>` +
        cols.map((c) => `<td class="${c.cls || ''}">${c.render ? c.render(r, i) : esc(r[c.k])}</td>`).join('') + '</tr>').join('')
        : `<tr><td colspan="${cols.length}">${UI.empty('暂无数据', '调整筛选条件或稍后重试')}</td></tr>`;
      return `<div class="tbl-wrap"><table class="tbl ${cls || ''}"><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table></div>`;
    },
    empty(title, desc, action) {
      return `<div class="empty"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="1.3" style="margin:0 auto;opacity:.5"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <div class="t">${esc(title)}</div><div class="d">${esc(desc || '')}</div>${action || ''}</div>`;
    },
    note(text, tone) { return `<div class="note ${tone || ''}">${text}</div>`; },
    seg(items, active) {
      return `<div class="seg">${items.map((i) =>
        `<button data-seg="${i.v}" class="${i.v === active ? 'on' : ''}">${i.t}</button>`).join('')}</div>`;
    },
    tabs(items, active) {
      return `<div class="row" style="gap:2px;border-bottom:1px solid var(--line)">
        ${items.map((i) => `<button data-tab="${i.v}" style="padding:8px 12px;font-size:12.5px;font-weight:${i.v === active ? 600 : 500};
        color:${i.v === active ? 'var(--text)' : 'var(--text-2)'};border-bottom:2px solid ${i.v === active ? 'var(--brand)' : 'transparent'};
        margin-bottom:-1px">${i.t}</button>`).join('')}</div>`;
    },
    /* 对话框基础：同一时刻只允许一个键盘焦点陷阱，Esc 关闭，关闭后还焦 */
    drawer({ title, sub, body, footer, width, onClose }) {
      const scrim = document.createElement('div');
      scrim.className = 'scrim';
      scrim.setAttribute('aria-hidden', 'true');
      const el = document.createElement('div');
      el.className = 'drawer';
      el.tabIndex = -1;
      const hdId = 'dlg-' + (++dlgSeq);
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-modal', 'true');
      el.setAttribute('aria-labelledby', hdId);
      if (width) el.style.width = width;
      el.innerHTML = `<div class="drawer-hd" id="${hdId}"><div><div style="font-size:14.5px;font-weight:650;letter-spacing:-.02em">${title}</div>
        ${sub ? `<div style="font-size:11.5px;color:var(--text-3)">${sub}</div>` : ''}</div>
        <button class="icon-btn" data-x style="margin-left:auto" aria-label="关闭">${icon('close')}</button></div>
        <div class="drawer-bd">${body}</div>
        ${footer ? `<div class="drawer-ft">${footer}</div>` : ''}`;
      document.body.appendChild(scrim); document.body.appendChild(el);
      requestAnimationFrame(() => { scrim.classList.add('show'); el.classList.add('show'); });
      focusFirst(el);
      let closed = false;
      let handle = null;
      const close = () => {
        if (closed) return;
        closed = true;
        if (handle) handle.dispose();
        scrim.classList.remove('show'); el.classList.remove('show');
        setTimeout(() => { scrim.remove(); el.remove(); }, 260);
        if (onClose) { try { onClose(); } catch (e) { /* 忽略 */ } }
      };
      handle = registerDialog(el, close);
      scrim.onclick = close;
      el.querySelector('[data-x]').onclick = close;
      return { el, close, body: el.querySelector('.drawer-bd') };
    },
    modal({ title, body, okText = '确定', cancelText = '取消', onOk, danger, onClose }) {
      const scrim = document.createElement('div'); scrim.className = 'scrim';
      scrim.setAttribute('aria-hidden', 'true');
      const el = document.createElement('div'); el.className = 'modal'; el.tabIndex = -1;
      const hdId = 'dlg-' + (++dlgSeq);
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-modal', 'true');
      el.setAttribute('aria-labelledby', hdId);
      el.innerHTML = `<div class="modal-hd" id="${hdId}">${esc(title)}</div><div class="modal-bd">${body}</div>
        <div class="modal-ft">${cancelText === '' ? '' : `<button class="btn" data-cancel>${esc(cancelText)}</button>`}
        <button class="btn ${danger ? 'danger' : 'primary'}" data-ok>${esc(okText)}</button></div>`;
      document.body.appendChild(scrim); document.body.appendChild(el);
      requestAnimationFrame(() => { scrim.classList.add('show'); el.classList.add('show'); });
      focusFirst(el);
      let closed = false, busy = false, handle = null;
      const cancelBtn = el.querySelector('[data-cancel]');
      const okBtn = el.querySelector('[data-ok]');
      const close = (force) => {
        if (closed || (busy && !force)) return;
        closed = true;
        if (handle) handle.dispose();
        scrim.remove(); el.remove();
        if (onClose) { try { onClose(); } catch (e) { /* 忽略 */ } }
      };
      handle = registerDialog(el, () => close(false));
      scrim.onclick = () => close(false);
      if (cancelBtn) cancelBtn.onclick = () => close(false);
      okBtn.onclick = async () => {
        if (okBtn.disabled) return;
        busy = true;
        okBtn.disabled = true;
        if (cancelBtn) cancelBtn.disabled = true;
        el.setAttribute('aria-busy', 'true');
        try {
          if (onOk) { const r = await onOk(el); if (r === false) { busy = false; okBtn.disabled = false; if (cancelBtn) cancelBtn.disabled = false; el.removeAttribute('aria-busy'); return; } }
          close(true);
        } catch (e) {
          busy = false;
          okBtn.disabled = false;
          if (cancelBtn) cancelBtn.disabled = false;
          el.removeAttribute('aria-busy');
          UI.toast('操作失败：' + ((e && e.message) || e), 'err');
        }
      };
      return { el, close, body: el.querySelector('.modal-bd') };
    },
    closeAllDialogs,
    toast(msg, type) {
      let wrap = document.querySelector('.toast-wrap');
      if (!wrap) { wrap = document.createElement('div'); wrap.className = 'toast-wrap'; document.body.appendChild(wrap); }
      const t = document.createElement('div');
      const tone = type === 'err' || type === 'danger' ? 'err' : type === 'warn' ? 'warn' : '';
      t.className = 'toast' + (tone ? ' ' + tone : '');
      t.setAttribute('role', tone === 'err' ? 'alert' : 'status');
      t.innerHTML = `${icon(tone === 'err' ? 'close' : tone === 'warn' ? 'clock' : 'check', 15)}<span>${esc(msg)}</span>`;
      wrap.appendChild(t);
      setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .2s'; setTimeout(() => t.remove(), 220); }, 2400);
    },
    skel(n = 3) {
      return `<div class="card pad">${Array.from({ length: n }).map(() =>
        `<div class="skel" style="height:12px;width:${40 + Math.random() * 50}%;margin-bottom:10px"></div>`).join('')}</div>`;
    }
  };

  /* -------------------------------------------------------------- 外壳 */
  const Shell = {
    current: null,
    mountedId: null,
    navToken: 0,
    cleanup: null,
    me: null,
    menus: null,
    _nav: null,
    async boot() {
      if (this._booted) return;
      this._booted = true;
      try { this.me = await API.get('/api/auth/me'); }
      catch (e) { return; }               // API 层已跳转登录页
      if (this.me && this.me.must_change) { location.replace('/login.html?force=1'); return; }
      const root = document.getElementById('app');
      const user = (this.me && this.me.user) || {};
      const menus = new Set(((this.me && this.me.menus) || []).map((m) => m.id));
      this.menus = menus;
      const nav = NAV.map((g) => ({ ...g, items: g.items.filter((i) => !menus.size || menus.has(i.id)) }))
        .filter((g) => g.items.length);
      this._nav = nav.length ? nav : NAV;
      const initial = String(user.name || user.account || '灵').slice(0, 1);
      const roleName = user.role || '';
      root.innerHTML = `
        <div class="app">
          <aside class="rail">
            <div class="rail-brand">
              <div class="rail-logo">${icon('bolt', 17)}</div>
              <div><div class="rail-name">天枢 · 攻防平台</div><div class="rail-sub">内容安全测评</div></div>
            </div>
            <nav class="rail-nav" aria-label="主导航">${this._nav.map((g) => `
              <div class="rail-group">${g.group}</div>
              ${g.items.map((i) => `<a class="rail-item" data-nav="${i.id}" href="#/${i.id}" aria-label="${i.label}">${icon(i.icon)}
                <span>${i.label}</span></a>`).join('')}`).join('')}
            </nav>
            <div class="rail-foot">
              <div class="avatar" aria-hidden="true">${esc(initial)}</div>
              <div class="who">${esc(user.name || user.account || '未命名')}<span>${esc(roleName)}${user.dept ? ' · ' + esc(user.dept) : ''}</span></div>
              <button class="icon-btn" id="btn-logout" style="margin-left:auto;color:#8892A6" title="退出登录" aria-label="退出登录">${icon('logout', 15)}</button>
            </div>
          </aside>
          <div class="main">
            <header class="topbar">
              <div class="crumb" id="crumb"></div>
              <div class="searchbox" role="button" tabindex="-1" title="点击或按 Ctrl/⌘ + K 打开全局搜索">
                ${icon('search', 14)}<input placeholder="搜索任务 / 样本 / 报告" readonly aria-label="打开全局搜索"><span class="kbd">⌘K</span></div>
              <button class="icon-btn" data-page-help title="本页使用引导" aria-label="打开本页使用引导">${icon('help', 17)}</button>
              <button class="icon-btn" data-setup title="配置向导" aria-label="打开配置向导" style="position:relative;display:none">${icon('bolt', 17)}
                <span data-setup-badge style="position:absolute;top:2px;right:1px;min-width:15px;height:15px;padding:0 4px;border-radius:8px;background:var(--danger);color:#fff;font-size:9px;line-height:15px;text-align:center;font-weight:600">!</span></button>
              <button class="icon-btn" data-env title="测试环境" aria-label="打开测试环境">${icon('env', 17)}</button>
              <button class="icon-btn" data-notify title="通知中心" aria-label="打开通知中心" style="position:relative">${icon('bell', 17)}
                <i style="position:absolute;top:7px;right:8px;width:6px;height:6px;border-radius:50%;background:var(--danger)"></i></button>
              <div class="avatar" style="margin-left:2px" aria-hidden="true" title="${esc(user.name || '')}">${esc(initial)}</div>
            </header>
            <main class="content" id="view"></main>
          </div>
        </div>`;
      const out = root.querySelector('#btn-logout');
      if (out) out.onclick = () => this.logout();
      this.wireSearch(root);
      this.wireTopbar(root);
      this.bindGlobalKeys();
      window.addEventListener('hashchange', () => {
        const r = (location.hash || '#/dashboard').replace('#/', '');
        this.go(r || 'dashboard', true);
      });
      const route = (location.hash || '#/dashboard').replace('#/', '');
      this.go(route || 'dashboard');
    },
    wireSearch(root) {
      const box = root.querySelector('.searchbox');
      const input = root.querySelector('.searchbox input');
      if (!box || !input) return;
      const open = () => openGlobalSearch();
      input.onclick = (e) => { e.preventDefault(); open(); };
      input.onkeydown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
      };
      box.onclick = (e) => { if (e.target !== input) { e.preventDefault(); open(); } };
    },
    wireTopbar(root) {
      const env = root.querySelector('[data-env]');
      if (env) env.onclick = () => this.go('envs');
      const bell = root.querySelector('[data-notify]');
      if (bell) bell.onclick = () => openNotifications();
      const help = root.querySelector('[data-page-help]');
      if (help) help.onclick = () => { if (w.Setup) w.Setup.help(); else UI.toast('帮助加载中，请稍后'); };
      const setup = root.querySelector('[data-setup]');
      if (setup) setup.onclick = () => { if (w.Setup) w.Setup.open(); else UI.toast('配置向导加载中，请稍后'); };
    },
    bindGlobalKeys() {
      if (this._keysBound) return;
      this._keysBound = true;
      document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
          e.preventDefault();
          openGlobalSearch();
          return;
        }
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const t = e.target;
        if (!t || !t.closest) return;
        if (t.closest('button,a,input,select,textarea')) return;
        const row = t.closest('tr.clickable');
        if (row) { e.preventDefault(); row.click(); }
      });
    },
    nav(id) {
      const src = this._nav || NAV;
      for (const g of src) { const it = g.items.find((i) => i.id === id); if (it) return { ...it, group: g.group }; }
      return null;
    },
    allowed(id) {
      return !this.menus || !this.menus.size || this.menus.has(id);
    },
    async logout() {
      try { await API.post('/api/auth/logout', {}); } catch (e) { /* 忽略：本地照样跳转 */ }
      location.replace('/login.html');
    },
    markNav(id) {
      document.querySelectorAll('[data-nav]').forEach((el) => {
        const on = el.dataset.nav === id;
        el.classList.toggle('on', on);
        if (on) el.setAttribute('aria-current', 'page');
        else el.removeAttribute('aria-current');
      });
    },
    settle(id) {
      if (this.cleanup) { try { this.cleanup(); } catch (e) { /* 忽略 */ } this.cleanup = null; }
      this.mountedId = null;
      this.current = id;
    },
    async go(id, fromHash) {
      id = id || 'dashboard';
      if (!this.allowed(id)) {
        const first = (this._nav && this._nav[0] && this._nav[0].items[0]) ? this._nav[0].items[0].id : 'dashboard';
        id = this.allowed(first) ? first : 'dashboard';
      }
      const target = '#/' + id;
      const curHash = location.hash || '#/dashboard';
      if (!fromHash) {
        if (curHash !== target) { location.hash = target; return; }
        if (this.current === id && this.mountedId === id) return;
      } else if (this.current === id && this.mountedId === id) {
        return;
      }

      const token = ++this.navToken;
      const page = w.Pages[id];
      UI.closeAllDialogs();
      this.settle(id);

      const nav = this.nav(id);
      this.markNav(id);
      const crumb = document.getElementById('crumb');
      if (crumb) {
        if (nav) crumb.innerHTML = `<span>${esc(nav.group)}</span><span class="sep">/</span><b>${esc(nav.label)}</b>`;
        else crumb.innerHTML = `<span>未知页面</span><span class="sep">/</span><b>${esc(id)}</b>`;
      }
      document.title = (nav ? nav.label : '未知页面') + ' · 天枢攻防平台';
      document.body.classList.toggle('m-dark', !!(page && page.cockpit));

      const oldView = document.getElementById('view');
      const nextView = document.createElement('main');
      nextView.id = 'view';
      nextView.className = 'content' + (page && page.cockpit ? ' is-cockpit' : '');
      if (oldView) oldView.replaceWith(nextView);
      else {
        const main = document.querySelector('.main');
        if (main) main.appendChild(nextView);
      }
      const main = document.querySelector('.main');
      if (main) main.scrollTop = 0;
      window.scrollTo(0, 0);

      if (!page) {
        nextView.innerHTML = `<div class="card pad">${UI.empty('未知页面', '没有找到「' + String(id) + '」对应的页面，请检查地址或返回总览',
          '<button class="btn primary" data-home>返回总览</button>')}</div>`;
        const home = nextView.querySelector('[data-home]');
        if (home) home.onclick = () => this.go('dashboard');
        this.mountedId = id;
        return;
      }

      nextView.innerHTML = `<div class="fade-in">${UI.skel(3)}</div>`;
      try {
        const cleanup = await page.mount(nextView);
        if (token !== this.navToken) {
          if (typeof cleanup === 'function') { try { cleanup(); } catch (e2) { /* 忽略 */ } }
          return;
        }
        this.cleanup = typeof cleanup === 'function' ? cleanup : null;
        this.mountedId = id;
      } catch (e) {
        if (token !== this.navToken) return;
        console.error(e);
        nextView.innerHTML = `<div class="card pad">${UI.empty('页面加载失败', String((e && e.message) || e),
          '<button class="btn" data-retry>重试</button>')}</div>`;
        const retry = nextView.querySelector('[data-retry]');
        if (retry) retry.onclick = () => { this.current = null; this.mountedId = null; this.go(id, true); };
        this.mountedId = id;
      }
    }
  };

  /* ---------------------------------------------------------------- 顶栏通知 */
  async function openNotifications() {
    const token = Shell.navToken;
    let inf;
    try { inf = await API.get('/api/infra'); }
    catch (e) { UI.toast('通知加载失败：' + ((e && e.message) || e), 'err'); return; }
    if (token !== Shell.navToken) return;
    const alerts = (inf && inf.alerts) || [];
    const rows = alerts.length ? alerts.map((a) => {
      const tone = a.level === 'P0' ? 'danger' : a.level === 'P1' ? 'warn' : a.level === 'P2' ? 'brand' : 'gray';
      return `<div style="display:flex;gap:10px;align-items:flex-start;padding:11px 0;border-bottom:1px solid var(--line-2)">
        ${UI.pill(a.level || 'P3', tone)}
        <div style="min-width:0;flex:1"><div style="font-size:12.5px;font-weight:560">${esc(a.name || '告警')}</div>
          <div style="font-size:11.5px;color:var(--text-3);line-height:1.65">${esc(a.msg || '')}${a.target ? ' · ' + esc(a.target) : ''}</div></div>
        <span style="font-size:10.5px;color:var(--text-3);white-space:nowrap">${esc(a.status || '')}</span></div>`;
    }).join('') : UI.empty('暂无通知', '当前没有系统告警或待办通知');
    const dr = UI.drawer({
      title: '通知中心', sub: '系统告警与运行事件 · 数据来自 /api/infra',
      width: '520px',
      body: `<div style="padding:2px 0">${rows}</div>`,
      footer: `<button class="btn" data-notify-close>关闭</button>`
    });
    const close = dr.el.querySelector('[data-notify-close]');
    if (close) close.onclick = dr.close;
  }

  /* ---------------------------------------------------------------- 全局搜索 */
  let GS_CACHE = null, GS_AT = 0;
  let GS_MODAL = null;
  const GS_TTL = 30000;
  const GS_LABEL = { task: '攻击任务', sample: '攻击样本', agent: '攻击智能体', eval: '评估任务' };
  async function gsData(force) {
    if (!force && GS_CACHE && Date.now() - GS_AT < GS_TTL) return { data: GS_CACHE, failed: 0 };
    const defs = [
      ['task', '/api/tasks', (x) => ({ id: x.id, t: x.name, s: x.no + ' · ' + x.agent + ' · ' + x.status, go: 'tasks' })],
      ['sample', '/api/samples', (x) => ({ id: x.id, t: x.title, s: x.category + '/' + x.sub + ' · ' + x.lib, go: 'samples' })],
      ['agent', '/api/agents', (x) => ({ id: x.id, t: x.name, s: x.scenario + ' · ' + x.descr, go: 'agents' })],
      ['eval', '/api/evals', (x) => ({ id: x.id, t: x.name, s: x.no + ' · 得分 ' + (x.score || 0), go: 'evals' })]
    ];
    const rs = await Promise.allSettled(defs.map((d) => API.get(d[1])));
    const failed = rs.filter((r) => r.status === 'rejected').length;
    if (failed === defs.length) throw new Error('搜索数据加载失败');
    const data = {};
    defs.forEach((d, i) => {
      const r = rs[i];
      data[d[0]] = r.status === 'fulfilled' ? ((r.value && r.value.items) || []).map(d[2]) : [];
    });
    if (!failed) { GS_CACHE = data; GS_AT = Date.now(); }
    return { data, failed };
  }
  function openGlobalSearch() {
    if (GS_MODAL && GS_MODAL.el && GS_MODAL.el.isConnected) {
      const q0 = GS_MODAL.el.querySelector('#gs-q');
      if (q0) q0.focus();
      return;
    }
    const md = UI.modal({
      title: '全局搜索', okText: '关闭', cancelText: '',
      body: `<div class="gs-wrap">
        <div class="searchbox" style="width:100%;height:38px">${icon('search', 15)}
          <input id="gs-q" placeholder="搜索任务、样本、智能体、评估报告…" autocomplete="off" aria-label="全局搜索关键词"></div>
        <div class="gs-list" id="gs-l" role="listbox" aria-live="polite"><div class="gs-tip">正在加载搜索索引…</div></div></div>`,
      onClose: () => { if (GS_MODAL === md) GS_MODAL = null; }
    });
    GS_MODAL = md;
    const q = md.el.querySelector('#gs-q');
    const list = md.el.querySelector('#gs-l');
    if (!q || !list) return;
    const state = { data: null, failed: 0, loading: true, error: '', total: 0 };
    const retryBtn = () => `<button class="btn sm" data-gs-retry style="margin-left:8px">重试</button>`;
    const bindRetry = () => {
      const b = list.querySelector('[data-gs-retry]');
      if (b) b.onclick = () => load(true);
    };
    const tip = (html) => {
      list.innerHTML = `<div class="gs-tip">${html}</div>`;
      bindRetry();
    };
    const run = (kw) => {
      kw = String(kw || '').trim().toLowerCase();
      if (state.error) { tip(state.error + retryBtn()); return; }
      if (state.loading || !state.data) { tip('正在加载搜索索引…'); return; }
      const hits = [];
      Object.keys(state.data).forEach((k) => {
        state.data[k].filter((x) => (String(x.t || '') + ' ' + String(x.s || '')).toLowerCase().includes(kw))
          .slice(0, 4).forEach((x) => hits.push({ ...x, kind: k }));
      });
      const partial = state.failed
        ? `<div class="gs-tip" style="padding:8px 6px;text-align:left;color:var(--warn)">部分数据源加载失败（${state.failed} 个），结果可能不完整${retryBtn()}</div>`
        : '';
      if (!kw) {
        list.innerHTML = partial + `<div class="gs-tip">共索引 ${state.total} 条对象，输入关键词检索</div>`;
        bindRetry(); return;
      }
      if (!hits.length) {
        list.innerHTML = partial + `<div class="gs-tip">未找到与「${esc(kw)}」相关的内容</div>`;
        bindRetry(); return;
      }
      list.innerHTML = partial + hits.map((h, i) => `<div class="gs-item" role="option" tabindex="0" data-i="${i}">
          <span class="gs-tag">${GS_LABEL[h.kind]}</span>
          <div style="min-width:0"><div class="t">${esc(h.t)}</div><div class="s">${esc(h.s)}</div></div>
          <span style="margin-left:auto;color:var(--text-3)">${icon('arrow', 13)}</span></div>`).join('');
      list.querySelectorAll('.gs-item').forEach((el) => {
        const go = () => { const h = hits[+el.dataset.i]; md.close(); Shell.go(h.go); };
        el.onclick = go;
        el.onkeydown = (ev) => {
          if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); go(); }
        };
      });
      bindRetry();
    };
    const load = async (force) => {
      state.loading = true; state.error = '';
      tip('正在加载搜索索引…');
      try {
        const r = await gsData(force);
        if (!md.el.isConnected) return;
        state.data = r.data; state.failed = r.failed; state.loading = false;
        state.total = Object.values(r.data).reduce((s, a) => s + a.length, 0);
        run(q.value);
      } catch (e) {
        if (!md.el.isConnected) return;
        state.loading = false;
        state.error = '搜索数据加载失败：' + ((e && e.message) || e);
        tip(esc(state.error) + retryBtn());
      }
    };
    q.oninput = () => run(q.value);
    q.onkeydown = (e) => {
      if (e.key === 'Enter') {
        const first = list.querySelector('.gs-item');
        if (first) { e.preventDefault(); first.click(); }
      }
    };
    load(false);
  }

  w.Shell = Shell; w.UI = UI; w.API = API; w.icon = icon; w.esc = esc; w.safeHref = safeHref;
  document.addEventListener('DOMContentLoaded', () => Shell.boot());
})(window);
