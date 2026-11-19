/* ============================================================================
   系统管理：租户 / 用户 / 角色 / 权限矩阵（RBAC 三级）/ 供应链安全
   ========================================================================== */
(function (w) {
  const { UI, API, Charts, icon, esc } = w;

  const STYLE = `
  .adm-tabs{display:flex;align-items:center;gap:2px;padding:4px 14px 0;border-bottom:1px solid var(--line);overflow-x:auto}
  .adm-tab{position:relative;display:flex;align-items:center;gap:7px;height:40px;padding:0 13px;font-size:12.5px;
    color:var(--text-2);border-bottom:2px solid transparent;margin-bottom:-1px;white-space:nowrap;transition:.16s var(--ease)}
  .adm-tab:hover{color:var(--text)}
  .adm-tab.on{color:var(--text);font-weight:600;border-bottom-color:var(--brand)}
  .adm-tab .c{display:inline-grid;place-items:center;min-width:19px;height:18px;padding:0 6px;border-radius:20px;
    background:#F1F3F7;color:var(--text-3);font-size:10.5px;font-weight:650;font-variant-numeric:tabular-nums}
  .adm-tab.on .c{background:var(--brand-050);color:var(--brand-600)}
  .who-cell{display:flex;align-items:center;gap:9px;min-width:0}
  .ava{width:27px;height:27px;border-radius:8px;display:grid;place-items:center;font-size:11.5px;font-weight:650;flex:0 0 27px}
  .mem{display:flex;align-items:center;gap:8px}
  .mem .bar{width:54px;flex:0 0 54px}
  .adm-tbl{table-layout:fixed}
  .adm-tbl td,.adm-tbl th{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .adm-foot{padding:9px 14px;border-top:1px solid var(--line-2);font-size:11px;color:var(--text-3);line-height:1.6}
  .role-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
  .role{border:1px solid var(--line);border-radius:12px;padding:14px;background:#fff;cursor:pointer;
    transition:box-shadow .18s var(--ease),border-color .18s var(--ease),transform .18s var(--ease);display:flex;flex-direction:column}
  .role:hover{border-color:#D6DBE6;box-shadow:var(--sh-2);transform:translateY(-1px)}
  .role .rk{width:32px;height:32px;border-radius:9px;display:grid;place-items:center;font-size:13px;font-weight:650;flex:0 0 32px}
  .role .rn{font-size:13px;font-weight:600;letter-spacing:-.01em}
  .role .rc{font-size:10.5px;color:var(--text-3);letter-spacing:.02em;margin-top:1px}
  .role .rd{font-size:11.5px;color:var(--text-2);line-height:1.6;margin:10px 0 9px;min-height:36px}
  .role .rp{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:11px;min-height:22px}
  .role .rf{border-top:1px solid var(--line-2);padding-top:9px;margin-top:auto;font-size:11px;color:var(--text-3);
    display:flex;align-items:center;justify-content:space-between;gap:8px}
  .perm{height:20px;font-size:10.5px;gap:4px;padding:0 7px}
  .act-dot{width:6px;height:6px;border-radius:2px;display:inline-block;margin-right:7px;vertical-align:1px}
  .audit-time{font-family:var(--mono);font-size:11px;color:var(--text-2);white-space:nowrap}
  .sub-t{font-size:10.5px;font-weight:650;color:var(--text-3);letter-spacing:.09em;margin:0 0 8px}
  .tab-foot{display:flex;align-items:center;gap:26px;padding:11px 16px;border-top:1px solid var(--line-2);
    background:var(--surface-2);font-size:11.5px;color:var(--text-3);flex-wrap:wrap}
  .tab-foot b{font-size:13px;color:var(--text);font-weight:600;margin-right:3px}
  .fail-row{display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid var(--line-2);cursor:pointer;transition:background .14s}
  .fail-row:hover{background:#F8FAFD}
  .fail-row:last-child{border-bottom:0}
  .fail-row .fa{font-size:12px;font-weight:550}
  .fail-row .fm{font-size:10.5px;color:var(--text-3);margin-top:1px}
  .gov-3{display:grid;grid-template-columns:1.35fr 1fr 1fr;gap:14px;align-items:stretch}
  .gov-3 .card{min-width:0;display:flex;flex-direction:column}
  .gov-3 .card-bd{flex:1}
  .rmi{display:grid;grid-template-columns:1fr 1fr 1fr;border-bottom:1px solid var(--line-2)}
  .rmi>div{padding:9px 14px;border-right:1px solid var(--line-2)}
  .rmi>div:last-child{border-right:0}
  .rmi>div>span{display:block;font-size:10px;color:var(--text-3);margin-bottom:2px}
  .rmi b{font-size:14px;font-weight:600;white-space:nowrap}
  .role-mini{display:flex;align-items:center;gap:10px;padding:8px 14px;border-bottom:1px solid var(--line-2);cursor:pointer;transition:background .14s}
  .role-mini:hover{background:#F8FAFD}
  .role-mini:last-child{border-bottom:0}
  .role-mini .rn{font-size:12px;font-weight:550;white-space:nowrap;min-width:74px}
  .role-mini .bar{flex:1}
  .role-mini .rc{width:22px;text-align:right;font-size:12px;font-weight:600;flex:0 0 22px}
  .role-mini .tag{font-size:10px;color:var(--text-3);font-family:var(--mono);flex:0 0 auto;min-width:56px}
  .note-card{border:1px solid var(--line);border-radius:12px;padding:14px;background:var(--surface-2);
    font-size:11.5px;color:var(--text-2);line-height:1.7;display:flex;flex-direction:column;gap:8px}
  .note-card b{font-size:12.5px;color:var(--text)}

  /* 新增页签：通用面板 */
  .adm-pad{padding:14px 16px;display:flex;flex-direction:column;gap:14px}
  .adm-panel{border:1px solid var(--line);border-radius:12px;overflow:hidden;background:var(--surface)}
  .adm-sec-hd{display:flex;align-items:center;gap:9px;padding:10px 14px;border-bottom:1px solid var(--line-2);background:var(--surface-2)}
  .adm-sec-hd h3{font-size:12.5px;font-weight:600;letter-spacing:-.01em;white-space:nowrap}
  .adm-sec-hd .sub{font-size:11px;color:var(--text-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .adm-sec-hd .right{margin-left:auto;display:flex;align-items:center;gap:8px}
  .adm-panel-bd{padding:13px 14px}

  /* 权限矩阵 */
  .rbac-desc{display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding:10px 14px;border:1px solid var(--line);
    border-radius:12px;background:var(--surface-2);font-size:11.5px;color:var(--text-2);line-height:1.65}
  .rbac-desc b{color:var(--text);font-weight:600}
  .rbac-legend{display:flex;align-items:center;gap:6px;margin-left:auto}
  .rbac-mx{table-layout:fixed}
  .rbac-mx tbody td{padding:5px 10px}
  .rbac-mx tbody td:first-child{padding-left:14px}
  .rbac-mx tbody tr:nth-child(even){background:#FBFCFE}
  .rbac-mx tbody tr:hover{background:#F5F8FE}
  .rbac-cell{text-align:center}
  .rbac-sel{width:118px;height:26px;padding:0 22px 0 8px;font-size:11px;border-radius:7px;
    background-position:right 6px center;font-weight:550;text-align:left}
  .rbac-sel:disabled{opacity:.55}
  .rbac-sel.lv-0{color:var(--text-3);background-color:#F6F8FB;border-color:var(--line)}
  .rbac-sel.lv-1{color:#1F3CA8;background-color:var(--brand-050);border-color:var(--brand-100)}
  .rbac-sel.lv-2{color:#9A5E08;background-color:var(--warn-bg);border-color:#F3DDBA}
  .rbac-sel.lv-3{color:#08754F;background-color:var(--ok-bg);border-color:#BFEBDC}

  /* 供应链 */
  .sup-tbl{table-layout:fixed}
  .sup-tbl tbody td{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .sup-tbl tbody td:first-child{padding-left:14px}
  .sup-foot{display:flex;align-items:center;gap:12px;padding:10px 14px;border-top:1px solid var(--line-2);
    font-size:11.5px;color:var(--text-3);flex-wrap:wrap;background:var(--surface-2)}
  .sup-pager{margin-left:auto;display:flex;gap:6px}
  .sup-sw{display:inline-flex;align-items:center;gap:7px;font-size:11.5px;color:var(--text-2);cursor:pointer;user-select:none}
  .sup-sw input{position:absolute;opacity:0;pointer-events:none}
  .sup-sw i{width:28px;height:16px;border-radius:20px;background:#DDE2EC;position:relative;transition:background .18s;
    flex:0 0 28px;display:inline-block}
  .sup-sw i::after{content:"";position:absolute;left:2px;top:2px;width:12px;height:12px;border-radius:50%;
    background:#fff;box-shadow:0 1px 2px rgba(16,24,40,.22);transition:transform .18s}
  .sup-sw input:checked + i{background:var(--brand)}
  .sup-sw input:checked + i::after{transform:translateX(12px)}
  .sup-sw:hover span{color:var(--text)}
  .sup-verify{background:var(--surface-2);border:1px solid var(--line);border-radius:9px;padding:9px 11px;
    font-size:11.5px;color:var(--text-2);line-height:1.65}
  .ex-toolbar{display:flex;align-items:center;gap:8px;padding:10px 14px;border-bottom:1px solid var(--line-2);flex-wrap:wrap}
  .ex-score{font-weight:650;font-variant-numeric:tabular-nums}
  .ex-ag-grid{display:flex;flex-wrap:wrap;gap:7px;max-height:154px;overflow:auto;padding:2px}
  .ex-ag{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);border-radius:8px;
    padding:5px 9px;font-size:11.5px;background:#fff;cursor:pointer;user-select:none}
  .ex-ag input{margin:0}
  .ex-ag em{font-style:normal;font-size:10px;color:var(--text-3)}
  .ex-ag.on{border-color:var(--brand);background:var(--brand-050)}
  .ex-pol{display:grid;grid-template-columns:1.1fr 1.5fr 96px 28px;gap:6px;margin-bottom:6px;align-items:center}
  .ex-pol .input,.ex-pol .select{height:30px;font-size:11.5px;padding:0 8px}
  .ex-tl{max-height:250px;overflow:auto;border:1px solid var(--line);border-radius:10px;padding:8px 10px;background:var(--surface-2)}
  .ex-tl-row{display:flex;gap:8px;padding:5px 0;border-bottom:1px dashed var(--line-2);font-size:11.5px;line-height:1.6}
  .ex-tl-row:last-child{border-bottom:0}
  .ex-tl-row .ts{font-family:var(--mono);font-size:10.5px;color:var(--text-3);flex:0 0 96px}
  .ex-tl-row .ac{flex:0 0 58px;color:var(--text-2)}
  .ex-tl-row .ct{flex:1;min-width:0;color:var(--text-2);word-break:break-word}
  .ex-blk{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}
  @media (max-width:900px){.ex-pol{grid-template-columns:1fr 1fr}.ex-tl-row .ts{flex-basis:80px}}
  `;

  const TINTS = [
    { bg: 'var(--brand-050)', fg: 'var(--brand-600)' },
    { bg: 'var(--violet-bg)', fg: 'var(--violet)' },
    { bg: '#E4F5F8', fg: 'var(--cyan)' },
    { bg: 'var(--ok-bg)', fg: 'var(--ok)' },
    { bg: 'var(--warn-bg)', fg: 'var(--warn)' }
  ];
  const tint = (i) => TINTS[((i % TINTS.length) + TINTS.length) % TINTS.length];

  const PERM_LABEL = { ALL: '全部权限', READ: '只读访问', WRITE: '读写操作', EXPORT: '导出下载', ADMIN: '管理配置' };
  const ACT_TINT = [
    [/创建|新增/, 'var(--brand)'],
    [/修改|变更/, 'var(--warn)'],
    [/删除|撤销/, 'var(--danger)'],
    [/登录|退出/, 'var(--violet)'],
    [/访问|导出|启动|停止|重启/, 'var(--text-3)']
  ];

  const LV = { 0: '无权限', 1: '只读', 2: '操作', 3: '管理' };
  const SUP_PAGE = 20;

  const esc1 = (s) => esc(String(s == null ? '' : s).slice(0, 1));
  const actColor = (a) => (ACT_TINT.find((x) => x[0].test(a || '')) || [null, 'var(--text-3)'])[1];
  const tsDesc = (a, b) => String(b.ts).localeCompare(String(a.ts));
  const shortTime = (s) => (s ? String(s).slice(5, 16) : '—');
  const lvName = (rb, n) => (rb && rb.levels && rb.levels[String(n)]) || LV[n] || LV[0];

  function parsePerms(s) {
    if (Array.isArray(s)) return s;
    try {
      const v = JSON.parse(s);
      return Array.isArray(v) ? v : [String(v)];
    } catch (e) {
      return String(s || '').split(/[,，|]/).map((x) => x.trim()).filter(Boolean);
    }
  }

  function permChip(p) {
    return `<span class="chip perm">${icon(p === 'ALL' ? 'bolt' : 'key', 11)}${esc(PERM_LABEL[p] || p)}
      <b class="mono" style="font-weight:500;font-size:9.5px;color:var(--text-3)">${esc(p)}</b></span>`;
  }

  /* ------------------------------------------------------------------ KPI */
  function kpis(d) {
    const members = d.tenants.reduce((s, t) => s + (t.members || 0), 0);
    const active = d.users.filter((u) => u.status === '启用').length;
    const failed = d.auditFailed ?? d.audit.filter((a) => a.result !== '成功').length;
    const operators = Object.keys(d.auditByUser || {}).length || new Set(d.audit.map((a) => a.user)).size;
    const auditTotal = d.auditTotal ?? d.audit.length;
    const flagship = d.tenants.filter((t) => t.plan === '旗舰版').length;
    return `<div class="grid g-4">
      ${UI.kpi({ label: '租户空间', value: d.tenants.length, unit: '个', meta: `成员合计 <b class="num" style="color:var(--text-2)">${members}</b> · 旗舰版 ${flagship}` })}
      ${UI.kpi({ label: '平台用户', value: d.users.length, unit: '人', meta: `启用 ${active} · 停用 ${d.users.length - active}` })}
      ${UI.kpi({ label: '角色策略', value: d.roles.length, unit: '个', meta: `RBAC 预置角色 · 绑定 ${d.roles.reduce((s, r) => s + (r.members || 0), 0)} 名成员` })}
      ${UI.kpi({ label: '审计事件', value: UI.num(auditTotal), unit: '条', meta: `失败 <b class="num" style="color:var(--danger)">${failed}</b> · 覆盖 ${operators} 名操作人` })}
    </div>`;
  }

  /* ------------------------------------------------------------------ 页签 */
  const TABS = [
    ['tenant', '租户与组织'], ['user', '用户与成员'], ['role', '角色与授权'],
    ['rbac', '权限矩阵'], ['supply', '供应链安全'], ['exercise', '红蓝演练']
  ];

  function tabsHTML(state, d, cache) {
    const cnt = {
      tenant: d.tenants.length,
      user: d.users.length,
      role: d.roles.length,
      rbac: cache.rbac ? cache.rbac.resources.length : null,
      supply: cache.supply ? cache.supply.count : null,
      exercise: cache.exercise ? (cache.exercise.items || []).length : null
    };
    return `<div class="adm-tabs">${TABS.map(([v, t]) =>
      `<button class="adm-tab ${state.tab === v ? 'on' : ''}" data-tab="${v}">${t}${cnt[v] == null ? '' : `<span class="c num">${UI.num(cnt[v])}</span>`}</button>`).join('')}</div>`;
  }

  /* ---------------------------------------------------------------- 租户 */
  function tenantHTML(d) {
    const max = Math.max.apply(null, d.tenants.map((t) => t.members).concat([1]));
    const first = d.tenants.slice().sort((a, b) => String(a.created).localeCompare(String(b.created)))[0];
    const members = d.tenants.reduce((s, t) => s + (t.members || 0), 0);
    const accounts = (id) => d.users.filter((u) => u.tenant_id === id).length;
    const audits = (id) => {
      const names = new Set(d.users.filter((u) => u.tenant_id === id).map((u) => u.name));
      if (d.auditByUser) return Object.entries(d.auditByUser).filter(([n]) => names.has(n)).reduce((s, [, c]) => s + c, 0);
      return d.audit.filter((a) => names.has(a.user)).length;
    };
    return `<div class="tbl-wrap"><table class="tbl adm-tbl"><thead><tr>
        <th style="width:27%">租户名称</th><th style="width:10%">租户编码</th><th style="width:9.5%">版本</th>
        <th style="width:14%">成员席位</th><th style="width:9.5%">平台账号</th><th style="width:9%">审计事件</th>
        <th style="width:9%">状态</th><th style="width:12%">创建时间</th>
      </tr></thead><tbody>${d.tenants.map((t) => `<tr>
        <td><div class="who-cell">
          <div class="ava" style="background:var(--brand-050);color:var(--brand-600)">${esc1(t.name)}</div>
          <div style="min-width:0"><div class="t-main">${esc(t.name)}</div>
            <div class="t-sub">tenant #${t.id} · ${t.members} 名成员</div></div></div></td>
        <td><span class="mono">${esc(t.code)}</span></td>
        <td>${UI.pill(t.plan, t.plan === '旗舰版' ? 'brand' : 'gray')}</td>
        <td><div class="mem"><div class="bar"><i style="width:${Math.max(6, Math.round(t.members / max * 100))}%"></i></div>
          <b class="num" style="font-size:12px">${t.members}</b><span class="dim tiny">人</span></div></td>
        <td><b class="num" style="font-size:12px;font-weight:560">${accounts(t.id)}</b>
          <span class="dim tiny" style="margin-left:3px">个</span></td>
        <td><b class="num" style="font-size:12px;font-weight:560">${audits(t.id)}</b>
          <span class="dim tiny" style="margin-left:3px">条</span></td>
        <td>${UI.pill(t.status, t.status === '正常' ? 'ok' : 'warn')}</td>
        <td><span class="dim" style="font-size:11.5px" title="${esc(t.created)}">${esc(String(t.created).slice(0, 10))}</span>
          <div class="tiny dim">${UI.ago(t.created)}</div></td>
      </tr>`).join('')}</tbody></table></div>
      <div class="tab-foot">
        <span><b class="num">${members}</b>成员席位</span>
        <span><b class="num">${Math.round(members / (d.tenants.length || 1))}</b>平均每租户</span>
        <span><b class="num">${d.users.length}</b>已开通账号</span>
        <span style="margin-left:auto">最早开通 ${esc(String(first ? first.created : '').slice(0, 10))}</span>
      </div>`;
  }

  /* ---------------------------------------------------------------- 用户 */
  function usersOf(d, state) {
    const q = state.q.trim().toLowerCase();
    return d.users.filter((u) => {
      if (state.tenant !== 'all' && String(u.tenant_id) !== String(state.tenant)) return false;
      if (state.role && u.role !== state.role) return false;
      if (!q) return true;
      return (u.name + u.account + u.role + u.dept).toLowerCase().includes(q);
    });
  }

  function userRows(d, rows, state) {
    if (!rows.length) return `<tr><td colspan="7">${UI.empty('没有匹配的用户', '调整租户、角色或搜索条件')}</td></tr>`;
    const act = new Map();
    if (d.auditByUser) Object.entries(d.auditByUser).forEach(([n, c]) => act.set(n, c));
    else d.audit.forEach((a) => act.set(a.user, (act.get(a.user) || 0) + 1));
    return rows.map((u) => {
      const t = d.tenants.find((x) => x.id === u.tenant_id);
      const tone = tint(d.roles.findIndex((r) => r.name === u.role));
      const n = act.get(u.name) || 0;
      return `<tr class="clickable" data-user="${esc(u.account)}" tabindex="0" role="button">
        <td><div class="who-cell"><div class="ava" style="background:${tone.bg};color:${tone.fg}">${esc1(u.name)}</div>
          <div><div class="t-main">${esc(u.name)}</div><div class="t-sub">${esc(t ? t.name : '未归属租户')}</div></div></div></td>
        <td><span class="mono">${esc(u.account)}</span></td>
        <td><span class="chip">${esc(u.role)}</span></td>
        <td style="font-size:12px;color:var(--text-2)">${esc(u.dept)}</td>
        <td><span class="num" style="font-size:12.5px">${n}</span><span class="tiny dim"> 条</span></td>
        <td>${UI.pill(u.status)}</td>
        <td><span class="dim" style="font-size:11.5px">${esc(shortTime(u.last_login))}</span>
          <div class="tiny dim">${UI.ago(u.last_login)}</div></td>
      </tr>`;
    }).join('');
  }

  function userHTML(d, state) {
    const rows = usersOf(d, state);
    return `<div class="tbl-toolbar">
        <select class="select" id="f-tenant" style="width:196px">
          <option value="all">全部租户</option>
          ${d.tenants.map((t) => `<option value="${t.id}" ${String(state.tenant) === String(t.id) ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}
        </select>
        ${state.role ? `<button class="chip on" data-clear-role>角色：${esc(state.role)} ${icon('close', 10)}</button>` : ''}
        <div class="searchbox sm" style="margin-left:auto">${icon('search', 13)}
          <input id="f-q" placeholder="搜索姓名 / 账号 / 部门" value="${esc(state.q)}"></div>
        <a class="btn sm" href="#/security" title="新建用户 / 重置密码 / 停用账号 / 角色授权">账号与安全 →</a>
        <span class="dim" style="font-size:11.5px">共 <b class="num" id="cnt">${rows.length}</b> 人</span>
      </div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr>
        <th>姓名 / 租户</th><th style="width:120px">账号</th><th style="width:120px">角色</th>
        <th style="width:128px">部门</th><th style="width:96px">审计事件</th><th style="width:84px">状态</th><th style="width:140px">最近登录</th>
      </tr></thead><tbody id="rows">${userRows(d, rows, state)}</tbody></table></div>`;
  }

  /* ---------------------------------------------------------------- 角色 */
  function roleHTML(d) {
    const idx = new Map();
    d.users.forEach((u) => idx.set(u.role, (idx.get(u.role) || 0) + 1));
    return `<div style="padding:14px 16px">
      <div class="role-grid">
        ${d.roles.map((r, i) => {
          const tone = tint(i);
          const perms = parsePerms(r.perms);
          const n = idx.get(r.name) || 0;
          return `<div class="role" data-role="${esc(r.code)}">
            <div class="row between" style="align-items:flex-start">
              <div class="row" style="gap:9px;min-width:0">
                <div class="rk" style="background:${tone.bg};color:${tone.fg}">${esc1(r.name)}</div>
                <div style="min-width:0"><div class="rn">${esc(r.name)}</div>
                  <div class="rc mono">${esc(r.code)}</div></div>
              </div>
              <span class="pill ${n ? 'gray' : 'warn'}"><i class="dot"></i>${n} 人</span>
            </div>
            <div class="rd">${esc(r.descr)}</div>
            <div class="rp">${perms.map(permChip).join('')}</div>
            <div class="rf"><span>权限项 ${perms.length} · 成员 ${r.members}</span>
              <span class="link">查看 ${icon('arrow', 11)}</span></div>
          </div>`;
        }).join('')}
        <div class="note-card">
          <b>${icon('shield', 13)} 权限模型</b>
          <div>角色权限以 <span class="mono">perms</span> JSON 数组下发，前端解析为权限标签：<span class="mono">ALL</span> 为全部功能与配置权限，<span class="mono">READ</span> 为业务数据只读。</div>
          <div class="dim">${d.roles.length} 个角色 · ${d.roles.reduce((s, r) => s + (r.members || 0), 0)} 名成员 · 用户与租户绑定生效；细粒度授权见「权限矩阵」页签。</div>
        </div>
      </div>
    </div>`;
  }

  /* ------------------------------------------------------- 权限矩阵 RBAC */
  function rbacKpiCells(rb) {
    const roles = rb.roles || [];
    const matrix = rb.matrix || [];
    const logs = rb.logs || [];
    const granted = matrix.reduce((s, m) => s + roles.filter((r) => Number((m.levels || {})[r] || 0) > 0).length, 0);
    const total = matrix.length * roles.length;
    const allow = logs.filter((l) => l.result === '放行').length;
    const deny = logs.filter((l) => l.result === '拒绝').length;
    const res = new Set(matrix.map((m) => m.res)).size;
    return `
      ${UI.kpi({ label: '角色数', value: roles.length, unit: '个', meta: 'RBAC 预置角色' })}
      ${UI.kpi({ label: '资源动作数', value: matrix.length, unit: '项', meta: `覆盖 <b class="num" style="color:var(--text-2)">${res}</b> 类资源` })}
      ${UI.kpi({ label: '已授权格数', value: granted, unit: '格', meta: `共 ${total} 格 · 覆盖率 ${total ? Math.round((granted / total) * 100) : 0}%` })}
      ${UI.kpi({ label: '日志条数', value: UI.num(logs.length), unit: '条', meta: `放行 ${allow} · 拒绝 <b class="num" style="color:var(--danger)">${deny}</b>` })}
    `;
  }

  function levelSelect(role, res, act, v) {
    return `<select class="select rbac-sel lv-${v}" data-rbac data-role="${esc(role)}"
      data-res="${esc(res)}" data-act="${esc(act)}">
      ${[0, 1, 2, 3].map((n) => `<option value="${n}" ${n === v ? 'selected' : ''}>${n} ${LV[n]}</option>`).join('')}
    </select>`;
  }

  function rbacMatrixHTML(rb) {
    const roles = rb.roles || [];
    const matrix = rb.matrix || [];
    return `<table class="tbl rbac-mx"><thead><tr>
        <th style="width:132px">资源</th><th style="width:104px">动作</th>
        ${roles.map((r) => `<th class="rbac-cell" style="width:112px">${esc(r)}</th>`).join('')}
      </tr></thead><tbody>${matrix.map((row) => {
        const lv = row.levels || {};
        return `<tr>
          <td><span class="t-main">${esc(row.res)}</span></td>
          <td><span class="mono">${esc(row.act)}</span></td>
          ${roles.map((role) => `<td class="rbac-cell">${levelSelect(role, row.res, row.act, Number(lv[role] || 0))}</td>`).join('')}
        </tr>`;
      }).join('')}</tbody></table>`;
  }

  function rbacLogsHTML(rb) {
    const logs = rb.logs || [];
    if (!logs.length) {
      return `<tr><td colspan="6">${UI.empty('暂无授权校验记录', '调用授权校验接口后写入 rbac_log')}</td></tr>`;
    }
    return logs.map((l) => {
      const tone = l.result === '放行' ? 'ok' : l.result === '拒绝' ? 'danger' : 'gray';
      return `<tr>
        <td><span class="audit-time" title="${esc(l.ts)}">${esc(shortTime(l.ts))}</span></td>
        <td style="font-size:12px;font-weight:550">${esc(l.role)}</td>
        <td><span class="mono" style="font-size:11.5px">${esc(l.res)}</span><span class="dim" style="margin:0 4px">·</span><span style="font-size:11.5px;color:var(--text-2)">${esc(l.act)}</span></td>
        <td><span class="num" style="font-size:12px;font-weight:600">${Number(l.level || 0)}</span><span class="tiny dim" style="margin-left:4px">${esc(lvName(rb, l.level))}</span></td>
        <td><span class="num" style="font-size:12px;font-weight:600">${Number(l.need || 0)}</span><span class="tiny dim" style="margin-left:4px">${esc(lvName(rb, l.need))}</span></td>
        <td>${UI.pill(l.result, tone)}</td>
      </tr>`;
    }).join('');
  }

  function rbacBody(rb, state) {
    const roles = rb.roles || [];
    const matrix = rb.matrix || [];
    const logs = rb.logs || [];
    return `<div class="adm-pad">
      <div class="rbac-desc">
        <div>RBAC 三级授权：<b>1 只读</b> 查看 · <b>2 操作</b> 执行 · <b>3 管理</b> 配置，<b>0</b> 为清除权限；单元格修改即时写入权限矩阵并生效于接口鉴权层。</div>
        <div class="rbac-legend">
          <span class="pill gray"><i class="dot"></i>0 无权限</span>
          <span class="pill brand"><i class="dot"></i>1 只读</span>
          <span class="pill warn"><i class="dot"></i>2 操作</span>
          <span class="pill ok"><i class="dot"></i>3 管理</span>
        </div>
      </div>
      <div class="grid g-4" id="rbac-kpis">${rbacKpiCells(rb)}</div>
      <div class="adm-panel">
        <div class="adm-sec-hd"><h3>权限矩阵</h3>
          <span class="sub">${matrix.length} 个资源动作 × ${roles.length} 个角色 · 修改后立即提交</span>
          <div class="right"><button class="link" data-rbac-reload style="font-size:11.5px;display:inline-flex;align-items:center;gap:4px">${icon('refresh', 12)}重新加载</button></div>
        </div>
        <div class="tbl-wrap">${rbacMatrixHTML(rb)}</div>
      </div>
      <div class="adm-panel">
        <div class="adm-sec-hd"><h3>最近授权校验</h3>
          <span class="sub">每次鉴权校验写入一条 rbac_log</span>
          <div class="right"><span class="pill gray"><i class="dot"></i>${logs.length} 条</span></div>
        </div>
        <div class="tbl-wrap" style="max-height:322px"><table class="tbl"><thead><tr>
            <th style="width:126px">时间</th><th style="width:96px">角色</th><th>资源 · 动作</th>
            <th style="width:116px">当前级别</th><th style="width:116px">所需级别</th><th style="width:96px">结果</th>
          </tr></thead><tbody>${rbacLogsHTML(rb)}</tbody></table></div>
      </div>
    </div>`;
  }

  /* ------------------------------------------------------------ 供应链安全 */
  function isRiskyComp(sp, c) {
    const name = String(c.name || '').toLowerCase();
    if ((sp.licenseRisky || []).some((x) => String(x.name || '').toLowerCase() === name)) return true;
    const lic = String(c.license || '').toLowerCase();
    return ((sp.policy && sp.policy.banned) || []).some((b) => String(b).toLowerCase() === lic);
  }

  function supFiltered(sp, state) {
    const q = state.supQ.trim().toLowerCase();
    return (sp.components || []).filter((c) => {
      if (state.supRisky && !isRiskyComp(sp, c)) return false;
      if (!q) return true;
      return [c.name, c.version, c.license, c.purl].join(' ').toLowerCase().includes(q);
    });
  }

  function supRowsHTML(sp, rows) {
    if (!rows.length) {
      return `<tr><td colspan="4">${UI.empty('没有匹配的组件', '调整搜索关键词或关闭风险许可证过滤')}</td></tr>`;
    }
    return rows.map((c) => {
      const risk = isRiskyComp(sp, c);
      const lic = c.license || '未声明';
      return `<tr>
        <td><span class="t-main">${esc(c.name)}</span></td>
        <td><span class="mono" style="font-size:11.5px">${esc(c.version || '—')}</span></td>
        <td>${risk ? `<span class="pill danger"><i class="dot"></i>${esc(lic)}</span>`
          : `<span class="dim" style="font-size:11.5px">${esc(lic)}</span>`}</td>
        <td><span class="mono" style="font-size:10.5px;color:var(--text-3)" title="${esc(c.purl)}">${esc(c.purl)}</span></td>
      </tr>`;
    }).join('');
  }

  function supFootHTML(total, page, pages) {
    const from = total ? (page - 1) * SUP_PAGE + 1 : 0;
    const to = Math.min(total, page * SUP_PAGE);
    return `<span>第 <b class="num" style="color:var(--text-2)">${page}</b> / ${pages} 页 · 显示 ${from}-${to}，共 ${total} 个</span>
      <div class="sup-pager">
        <button class="btn sm" data-sup-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}>上一页</button>
        <button class="btn sm" data-sup-page="${page + 1}" ${page >= pages ? 'disabled' : ''}>下一页</button>
      </div>`;
  }

  function supKpiCells(sp) {
    const risky = (sp.licenseRisky || []).length;
    const banned = (sp.policy && sp.policy.banned) || [];
    return `
      ${UI.kpi({ label: '组件总数', value: UI.num(sp.count), unit: '个', meta: sp.truncated ? '清单截断为前 400 条' : '清单完整收录' })}
      ${UI.kpi({ label: '许可证风险', value: risky, unit: '个', meta: banned.length ? `禁用清单 ${esc(banned.join(' / '))}` : '未配置禁用清单' })}
      ${UI.kpi({ label: 'Python 版本', value: esc(sp.python || '—'), meta: `生成于 ${esc(shortTime(sp.generated))}` })}
      ${UI.kpi({ label: 'SBOM 格式', value: esc(sp.format || '—'), meta: '交付物格式 · 接口声明' })}
    `;
  }

  function supCompPanel(sp, state) {
    const view = supFiltered(sp, state);
    const pages = Math.max(1, Math.ceil(view.length / SUP_PAGE));
    const page = Math.min(Math.max(1, state.supPage), pages);
    const rows = view.slice((page - 1) * SUP_PAGE, page * SUP_PAGE);
    return `<div class="adm-panel">
      <div class="adm-sec-hd"><h3>组件清单</h3>
        <span class="sub">${esc(sp.format || 'SBOM')} · ${UI.num(sp.count)} 个组件</span>
        <div class="right">${sp.truncated ? '<span class="pill warn"><i class="dot"></i>已截断</span>'
          : '<span class="pill ok"><i class="dot"></i>全量</span>'}</div>
      </div>
      <div class="tbl-toolbar">
        <div class="searchbox sm" style="width:224px;margin-left:0">${icon('search', 13)}
          <input id="sup-q" placeholder="搜索名称 / 版本 / 许可证" value="${esc(state.supQ)}"></div>
        <label class="sup-sw"><input type="checkbox" id="sup-risk" ${state.supRisky ? 'checked' : ''}><i></i><span>仅风险许可证</span></label>
        <span class="dim" style="font-size:11.5px;margin-left:auto">筛选出 <b class="num" id="sup-cnt">${view.length}</b> 个</span>
      </div>
      <div class="tbl-wrap" style="max-height:540px"><table class="tbl sup-tbl"><thead><tr>
          <th style="width:37%">名称</th><th style="width:80px">版本</th><th style="width:136px">许可证</th><th>PURL</th>
        </tr></thead><tbody id="sup-rows">${supRowsHTML(sp, rows)}</tbody></table></div>
      <div class="sup-foot" id="sup-foot">${supFootHTML(view.length, page, pages)}</div>
    </div>`;
  }

  function supPolicyPanel(sp) {
    const p = sp.policy || {};
    const banned = p.banned || [];
    return `<div class="adm-panel">
      <div class="adm-sec-hd"><h3>合规策略</h3><span class="sub">依赖准入与交付校验</span></div>
      <div class="adm-panel-bd">
        <div class="kv"><span>SBOM 要求</span><b>${p.requireSbom ? UI.pill('已启用', 'ok') : UI.pill('未启用', 'warn')}</b></div>
        <div class="kv" style="margin-top:8px"><span>生成时间</span>
          <b class="mono" style="font-size:11px;font-weight:500">${esc(sp.generated || '—')}</b></div>
        <div class="sub-t" style="margin:14px 0 8px">禁用许可证</div>
        <div class="row wrap" style="gap:6px">${banned.length
          ? banned.map((b) => `<span class="pill danger"><i class="dot"></i>${esc(b)}</span>`).join('')
          : '<span class="dim" style="font-size:11.5px">未配置禁用清单</span>'}</div>
        <div class="sub-t" style="margin:14px 0 8px">交付校验</div>
        <div class="sup-verify">${esc(p.verify || '—')}</div>
      </div>
    </div>`;
  }

  function supRiskPanel(sp) {
    const list = sp.licenseRisky || [];
    const by = new Map();
    list.forEach((c) => {
      const k = c.license || '未声明';
      by.set(k, (by.get(k) || 0) + 1);
    });
    const data = Array.from(by.entries()).map(([k, v]) => ({ k, v, color: 'var(--danger)' })).sort((a, b) => b.v - a.v);
    return `<div class="adm-panel">
      <div class="adm-sec-hd"><h3>许可证风险</h3><span class="sub">按许可证聚合</span>
        <div class="right">${list.length ? `<span class="pill danger"><i class="dot"></i>${list.length} 个组件</span>`
          : '<span class="pill ok"><i class="dot"></i>未命中</span>'}</div>
      </div>
      <div class="adm-panel-bd">${data.length
        ? Charts.hbars(data, { labelW: 104, unit: ' 个', h: 7, gap: 9 })
        : UI.empty('未发现高风险许可证', '禁用许可证清单内暂无组件命中')}</div>
    </div>`;
  }

  function supDepsPanel(sp) {
    const deps = sp.keyDeps || [];
    return `<div class="adm-panel">
      <div class="adm-sec-hd"><h3>关键依赖</h3><span class="sub">交付必装组件</span></div>
      <table class="tbl"><thead><tr><th>名称</th><th style="width:88px">版本</th><th style="width:92px">类型</th></tr></thead>
        <tbody>${deps.length ? deps.map((x) => `<tr>
          <td><span class="mono" style="font-size:11.5px;font-weight:550">${esc(x.name)}</span></td>
          <td><span class="mono" style="font-size:11.5px">${esc(x.version || '未安装')}</span></td>
          <td><span class="pill ${x.required === '运行期' ? 'brand' : 'gray'}">${esc(x.required || '—')}</span></td>
        </tr>`).join('') : `<tr><td colspan="3">${UI.empty('未声明关键依赖', '接口 keyDeps 为空')}</td></tr>`}</tbody>
      </table>
    </div>`;
  }

  function supBody(sp, state) {
    return `<div class="adm-pad">
      <div class="grid g-4">${supKpiCells(sp)}</div>
      <div class="split">
        ${supCompPanel(sp, state)}
        <div class="stack">
          ${supPolicyPanel(sp)}
          ${supRiskPanel(sp)}
          ${supDepsPanel(sp)}
        </div>
      </div>
    </div>`;
  }

  /* ---------------------------------------------------------------- 审计 */
  function auditDetailHTML(rows) {
    if (!rows.length) return `<tr><td colspan="5">${UI.empty('暂无审计记录', '')}</td></tr>`;
    return rows.map((a) => `<tr class="clickable" data-audit="${a.id}" tabindex="0" role="button">
      <td><span class="audit-time" title="${esc(a.ts)}">${esc(shortTime(a.ts))}</span></td>
      <td style="font-size:12px;font-weight:550">${esc(a.user)}</td>
      <td><span class="act-dot" style="background:${actColor(a.action)}"></span><span style="font-size:12px">${esc(a.action)}</span></td>
      <td style="font-size:11.5px;color:var(--text-2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(a.target)}</td>
      <td>${UI.pill(a.result, a.result === '成功' ? 'ok' : 'danger')}</td>
    </tr>`).join('');
  }

  function openAuditList(d) {
    const rows = d.audit.slice().sort(tsDesc);
    const md = UI.modal({
      title: '审计日志（' + rows.length + ' 条）',
      okText: '关闭',
      cancelText: '',
      body: `<div class="dim" style="font-size:11.5px;margin-bottom:10px">最近 40 条操作记录 · 点击查看明细</div>
        <div class="tbl-wrap" style="max-height:436px;border:1px solid var(--line);border-radius:10px">
          <table class="tbl"><thead><tr>
            <th style="width:124px">时间</th><th style="width:92px">用户</th><th style="width:144px">动作</th>
            <th>对象</th><th style="width:104px">结果</th>
          </tr></thead><tbody>${auditDetailHTML(rows)}</tbody></table>
        </div>
        <div class="dim" style="font-size:11px;margin-top:10px">导出请使用页头「导出审计」按钮。</div>`
    });
    md.el.style.width = 'min(920px,94vw)';
    md.el.querySelectorAll('tr[data-audit]').forEach((tr) => {
      tr.onclick = () => {
        const a = d.audit.find((x) => String(x.id) === String(tr.dataset.audit));
        if (!a) return;
        md.close();
        openAudit(a, d);
      };
    });
  }

  /* ------------------------------------------------------------ 治理概览 */
  function governanceHTML(d) {
    const recent = d.audit.slice().sort(tsDesc).slice(0, 6);
    const fails = d.audit.filter((a) => a.result !== '成功').sort(tsDesc);
    const rmax = Math.max.apply(null, d.roles.map((r) => r.members || 0).concat([1]));
    const rate = d.audit.length ? (fails.length / d.audit.length * 100).toFixed(1) : '0.0';
    return `<div class="gov-3">
      ${UI.card({
        title: '最新审计动态', sub: '最近 40 条操作记录',
        right: `<button class="link" data-audit-all style="font-size:11.5px">查看全部 ${icon('arrow', 12)}</button>`,
        flush: true,
        body: `<div style="padding:10px 16px 4px"><div class="tl">
          ${recent.map((a) => `<div class="tl-item ${a.result === '成功' ? '' : 'risk'}" data-gov-audit="${a.id}" style="cursor:pointer">
            <div class="tl-dot"></div>
            <div class="tl-hd"><span class="tl-type" style="color:${actColor(a.action)}">${esc(a.action)}</span>
              <span class="tl-time">${esc(shortTime(a.ts))}</span></div>
            <div class="tl-body" style="font-size:12px">${esc(a.user)} · ${esc(a.target)}
              <span class="dim" style="margin-left:6px">${esc(a.ip)}</span></div>
          </div>`).join('')}
        </div></div>`
      })}
      ${UI.card({
        title: '权限拦截', sub: '失败事件需复核',
        right: `<span class="pill danger"><i class="dot"></i>${fails.length} 条</span>`,
        flush: true,
        body: `<div class="rmi">
            <div><span>失败事件</span><b class="num" style="color:var(--danger)">${fails.length}</b></div>
            <div><span>涉及操作人</span><b class="num">${new Set(fails.map((a) => a.user)).size}</b></div>
            <div><span>失败率</span><b class="num">${rate}<span style="font-size:10px;font-weight:500;color:var(--text-3)">%</span></b></div>
          </div>
          ${fails.map((a) => `<div class="fail-row" data-audit="${a.id}">
            <span class="pill danger" style="flex:0 0 auto">拒绝</span>
            <div style="min-width:0;flex:1"><div class="fa">${esc(a.action)} · ${esc(a.target)}</div>
              <div class="fm">${esc(a.user)} · ${esc(a.ip)} · ${esc(shortTime(a.ts))}</div></div>
            ${icon('arrow', 12)}
          </div>`).join('')}
          <div style="padding:10px 14px;border-top:1px solid var(--line-2);font-size:11px;color:var(--text-3);line-height:1.6">
            失败原因均为「权限不足」，拦截发生在接口鉴权层，未产生实际数据变更。</div>`
      })}
      ${UI.card({
        title: '角色成员', sub: 'RBAC 角色绑定',
        right: `<button class="link" data-goto="role" style="font-size:11.5px">角色详情 ${icon('arrow', 12)}</button>`,
        flush: true,
        body: `<div class="rmi">
            <div><span>角色数</span><b class="num">${d.roles.length}</b></div>
            <div><span>绑定成员</span><b class="num">${d.roles.reduce((s, r) => s + (r.members || 0), 0)}</b></div>
            <div><span>权限档</span><b class="num" style="font-size:12px;font-family:var(--mono)">1/2/3</b></div>
          </div>
          ${d.roles.map((r) => `<div class="role-mini" data-role="${r.id}">
            <span class="rn">${esc(r.name)}</span>
            <span class="tag">${esc(r.code)}</span>
            <div class="bar"><i style="width:${Math.round((r.members || 0) / rmax * 100)}%"></i></div>
            <span class="rc num">${r.members}</span>
          </div>`).join('')}
          <div class="adm-foot">权限按三级矩阵下发（只读 1 / 操作 2 / 管理 3），变更即时生效于接口鉴权层；详细矩阵见「权限矩阵」页签。</div>`
      })}
    </div>`;
  }

  /* ------------------------------------------------------------ 抽屉：用户 */
  function openUser(u, d) {
    const t = d.tenants.find((x) => x.id === u.tenant_id);
    const role = d.roles.find((r) => r.name === u.role);
    const perms = role ? parsePerms(role.perms) : [];
    const acts = d.audit.filter((a) => a.user === u.name).sort(tsDesc);
    const tone = tint(d.roles.findIndex((r) => r.name === u.role));
    const dr = UI.drawer({
      title: esc(u.name),
      sub: `${esc(u.account)} · ${esc(t ? t.name : '未归属租户')}`,
      width: '560px',
      body: `
        <div class="row" style="gap:10px;margin-bottom:16px">
          <div class="ava" style="width:44px;height:44px;border-radius:12px;font-size:16px;background:${tone.bg};color:${tone.fg}">${esc1(u.name)}</div>
          <div><div style="font-size:14px;font-weight:650">${esc(u.name)}</div>
            <div class="dim" style="font-size:11.5px">${esc(u.dept)} · ${esc(u.role)}</div></div>
          <div style="margin-left:auto">${UI.pill(u.status)}</div>
        </div>
        <div class="grid g-4" style="gap:10px;margin-bottom:16px">
          <div class="mini-stat"><span>所属租户</span><b style="font-size:13px">${esc(t ? t.code : '—')}</b></div>
          <div class="mini-stat"><span>角色成员</span><b class="num">${role ? role.members : 0}</b></div>
          <div class="mini-stat"><span>审计记录</span><b class="num">${acts.length}</b></div>
          <div class="mini-stat"><span>最近登录</span><b style="font-size:12px">${esc(UI.ago(u.last_login))}</b></div>
        </div>
        <div class="sub-t">账号信息</div>
        <div class="grid g-2" style="gap:8px;margin-bottom:16px">
          <div class="kv"><span>登录账号</span><b class="mono">${esc(u.account)}</b></div>
          <div class="kv"><span>所属部门</span><b>${esc(u.dept)}</b></div>
          <div class="kv"><span>角色编码</span><b class="mono">${esc(role ? role.code : '—')}</b></div>
          <div class="kv"><span>最近登录</span><b style="font-size:11.5px">${esc(u.last_login)}</b></div>
        </div>
        <div class="sub-t">角色权限</div>
        <div class="row wrap" style="gap:6px;margin-bottom:16px">${perms.map(permChip).join('') || '<span class="dim" style="font-size:12px">该角色未配置权限项</span>'}</div>
        <div class="sub-t">最近操作</div>
        ${acts.length ? `<div class="tl" style="margin-top:4px">${acts.slice(0, 4).map((a) => `<div class="tl-item ${a.result === '成功' ? '' : 'risk'}">
            <div class="tl-dot"></div>
            <div class="tl-hd"><span class="tl-type" style="color:${actColor(a.action)}">${esc(a.action)}</span>
              <span class="tl-time">${esc(shortTime(a.ts))}</span></div>
            <div class="tl-body" style="font-size:12px">${esc(a.target)} · ${esc(a.ip)}</div>
          </div>`).join('')}</div>`
        : `<div class="dim" style="font-size:12px">该用户暂无审计记录</div>`}
      `,
      footer: `<button class="btn" data-x2>关闭</button>`
    });
    dr.el.querySelector('[data-x2]').onclick = dr.close;
    return dr;
  }

  /* ------------------------------------------------------------ 抽屉：角色 */
  function openRole(r, d) {
    const perms = parsePerms(r.perms);
    const members = d.users.filter((u) => u.role === r.name);
    const dr = UI.drawer({
      title: esc(r.name),
      sub: `${esc(r.code)} · ${esc(r.descr)}`,
      width: '540px',
      body: `
        <div class="grid g-3" style="gap:10px;margin-bottom:16px">
          <div class="mini-stat"><span>绑定成员</span><b class="num">${r.members}</b></div>
          <div class="mini-stat"><span>权限项</span><b class="num">${perms.length}</b></div>
          <div class="mini-stat"><span>角色编号</span><b class="mono" style="font-size:12px">${esc(r.code)}</b></div>
        </div>
        <div class="sub-t">权限标签</div>
        <div class="row wrap" style="gap:6px;margin-bottom:18px">${perms.map(permChip).join('') || '<span class="dim" style="font-size:12px">未配置权限项</span>'}</div>
        <div class="sub-t">角色成员</div>
        ${members.length ? members.map((u) => `<div class="row between" style="padding:9px 0;border-bottom:1px solid var(--line-2)">
            <div class="who-cell"><div class="ava" style="background:var(--surface-2);color:var(--text-2)">${esc1(u.name)}</div>
              <div><div style="font-size:12.5px;font-weight:550">${esc(u.name)}</div>
                <div class="tiny dim">${esc(u.account)} · ${esc(u.dept)}</div></div></div>
            ${UI.pill(u.status)}
          </div>`).join('')
        : UI.empty('该角色暂无成员', '在用户页签中为用户分配该角色')}
      `,
      footer: `<button class="btn" data-x2>关闭</button>`
    });
    dr.el.querySelector('[data-x2]').onclick = dr.close;
    return dr;
  }

  /* ------------------------------------------------------------ 抽屉：审计 */
  function openAudit(a, d) {
    let det = {};
    try { det = JSON.parse(a.detail || '{}'); } catch (e) { det = { raw: String(a.detail || '') }; }
    const sameUser = d.audit.filter((x) => x.user === a.user).length;
    const sameIp = d.audit.filter((x) => x.ip === a.ip).length;
    const raw = Object.assign({}, a, { detail: det });
    const dr = UI.drawer({
      title: '审计明细 #' + a.id,
      sub: `${esc(shortTime(a.ts))} · ${esc(a.user)} · ${esc(a.result)}`,
      width: '600px',
      body: `
        <div class="grid g-4" style="gap:10px;margin-bottom:16px">
          <div class="mini-stat"><span>发生时间</span><b style="font-size:12px">${esc(shortTime(a.ts))}</b></div>
          <div class="mini-stat"><span>操作人</span><b style="font-size:13px">${esc(a.user)}</b></div>
          <div class="mini-stat"><span>结果</span><b style="font-size:12px">${UI.pill(a.result, a.result === '成功' ? 'ok' : 'danger')}</b></div>
          <div class="mini-stat"><span>来源 IP</span><b class="mono" style="font-size:12px">${esc(a.ip)}</b></div>
        </div>
        <div class="grid g-2" style="gap:8px;margin-bottom:16px">
          <div class="kv"><span>动作</span><b>${esc(a.action)}</b></div>
          <div class="kv"><span>操作对象</span><b>${esc(a.target)}</b></div>
          <div class="kv"><span>客户端</span><b class="mono">${esc(det.ua || '—')}</b></div>
          <div class="kv"><span>追踪号</span><b class="mono">${esc(det.trace || '—')}</b></div>
        </div>
        ${UI.note(`该操作人在审计日志中共 <b>${sameUser}</b> 条记录，该 IP 共 <b>${sameIp}</b> 条记录。`)}
        <div class="sub-t" style="margin-top:18px">原始记录</div>
        <pre class="code" style="white-space:pre-wrap;word-break:break-all">${esc(JSON.stringify(raw, null, 2))}</pre>
      `,
      footer: `<button class="btn" data-copy>${icon('key', 13)}复制追踪号</button>
        <button class="btn" data-x2>关闭</button>`
    });
    dr.el.querySelector('[data-x2]').onclick = dr.close;
    dr.el.querySelector('[data-copy]').onclick = () => {
      const txt = String(det.trace || a.id);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt).then(() => UI.toast('已复制：' + txt)).catch(() => UI.toast('复制失败，请手动选择', 'err'));
      } else {
        UI.toast('当前环境不支持剪贴板');
      }
    };
    return dr;
  }

  /* ---------------------------------------------------------------- 导出 */
  /* ------------------------------------------------------------ 红蓝演练 */
  const EX_STATUS_TONE = { '进行中': 'brand', '已完成': 'ok', '已暂停': 'warn', '已终止': 'danger', '未开始': 'gray' };
  const N = (v) => esc(UI.num(v));

  function exScoreColor(v) {
    const n = Number(v) || 0;
    return n >= 70 ? 'var(--ok)' : n >= 45 ? 'var(--warn)' : 'var(--danger)';
  }

  function exListHTML(ex) {
    const items = (ex && ex.items) || [];
    const running = items.filter((x) => x.status === '进行中').length;
    const avg = items.length
      ? (items.reduce((s2, x) => s2 + (Number(x.score) || 0), 0) / items.length).toFixed(1)
      : '—';
    const table = items.length
      ? `<div class="tbl-wrap"><table class="tbl adm-tbl"><thead><tr>
          <th style="width:27%">演练</th><th style="width:9%">租户</th><th style="width:9%">状态</th>
          <th style="width:9%" class="num">红队任务</th><th style="width:9%" class="num">蓝队策略</th>
          <th style="width:9%" class="num">综合分</th><th style="width:13%">开始时间</th><th style="width:10%">操作</th>
        </tr></thead><tbody>${items.map((it) => `<tr class="clickable" data-ex-id="${it.id}" tabindex="0" role="button">
          <td><div class="t-main">${esc(it.name)}</div><div class="t-sub">${esc((it.red_agents || []).join(' / ') || '未指定红队智能体')}</div></td>
          <td><span class="mono">${esc(it.tenant || '—')}</span></td>
          <td>${UI.pill(it.status || '—', EX_STATUS_TONE[it.status] || 'gray')}</td>
          <td class="num" style="text-align:right">${N(it.redTaskCount)}</td>
          <td class="num" style="text-align:right">${N(it.bluePolicyCount)}</td>
          <td class="num" style="text-align:right"><b class="ex-score" style="color:${exScoreColor(it.score)}">${it.score == null ? '—' : Number(it.score).toFixed(1)}</b></td>
          <td class="dim" style="font-size:11.5px;white-space:nowrap">${esc(String(it.started_at || '').slice(0, 16))}</td>
          <td><button class="btn sm" data-ex-open="${it.id}">计分卡</button></td>
        </tr>`).join('')}</tbody></table></div>`
      : UI.empty('尚未创建演练', '点击「新建演练」配置红队智能体与蓝队策略，绑定任务后即可查看计分卡');
    return `<div class="ex-toolbar">
        <button class="btn primary sm" data-ex-new>${icon('plus', 13)}新建演练</button>
        <button class="btn sm" data-ex-reload>${icon('refresh', 13)}刷新</button>
        <span class="dim" style="font-size:11.5px;margin-left:auto">共 ${N(items.length)} 个演练 · 进行中 ${N(running)} · 平均综合分 ${esc(String(avg))}</span>
      </div>${table}
      <div class="tab-foot">
        <span><b class="num">${N(items.length)}</b>演练</span>
        <span><b class="num">${N(items.reduce((s2, x) => s2 + (Number(x.redTaskCount) || 0), 0))}</b>红队任务</span>
        <span><b class="num">${N(items.reduce((s2, x) => s2 + (Number(x.bluePolicyCount) || 0), 0))}</b>蓝队策略</span>
        <span style="margin-left:auto">指标口径：红队 ASR / 高危发现 / 蓝队拦截率 / 漏报率 / MTTR / 综合分（均为后端真实统计）</span>
      </div>`;
  }

  function exDetailHTML(detail, sc) {
    const ex = (detail && detail.exercise) || {};
    const metrics = (sc && sc.metrics) || [];
    const redTasks = (detail && detail.redTasks) || [];
    const policies = (detail && detail.bluePolicies) || [];
    const timeline = (detail && detail.timeline) || [];
    const blue = (sc && sc.blue) || {};
    const red = (sc && sc.red) || {};
    const kpis = metrics.length
      ? `<div class="grid g-4" style="gap:10px;margin-bottom:14px">${metrics.map((m) => UI.kpi({
          label: esc(m.name), value: N(m.value), unit: esc(m.unit || ''),
          meta: `${esc(m.side || '')} · ${esc(m.formula || '')}`
        })).join('')}</div>`
      : `<div style="margin-bottom:14px">${UI.note('计分卡暂无可展示指标，请确认演练已绑定任务。', '')}</div>`;
    const redTbl = redTasks.length
      ? `<div class="tbl-wrap"><table class="tbl"><thead><tr>
          <th>任务</th><th style="width:78px">状态</th><th style="width:64px" class="num">ASR</th>
          <th style="width:56px" class="num">高危</th><th style="width:60px" class="num">样本</th><th style="width:104px">智能体</th>
        </tr></thead><tbody>${redTasks.map((t) => `<tr>
          <td><div class="t-main">${esc(t.name || '—')}</div><div class="t-sub mono">${esc(t.no || '')}</div></td>
          <td>${UI.pill(t.status || '—')}</td>
          <td class="num" style="text-align:right">${t.asr == null ? '—' : N(t.asr) + '%'}</td>
          <td class="num" style="text-align:right">${N(t.high)}</td>
          <td class="num" style="text-align:right">${N(t.samples)}</td>
          <td style="font-size:11.5px">${esc(t.agent || '—')}</td>
        </tr>`).join('')}</tbody></table></div>`
      : UI.empty('尚未绑定任务', '通过 POST /api/exercises/{id}/tasks 绑定攻击任务后，红队指标按真实任务与事件统计');
    const polTbl = policies.length
      ? `<div class="tbl-wrap"><table class="tbl"><thead><tr>
          <th>策略</th><th>规则</th><th style="width:82px">作用域</th>
          <th style="width:76px" class="num">命中拦截</th><th style="width:64px">状态</th>
        </tr></thead><tbody>${policies.map((p) => `<tr>
          <td><div class="t-main">${esc(p.name || '—')}</div></td>
          <td style="font-size:11.5px;color:var(--text-2);word-break:break-word">${esc(p.rule || '—')}</td>
          <td><span class="chip">${esc(p.scope || '输入')}</span></td>
          <td class="num" style="text-align:right">${N(p.blocked)}</td>
          <td>${UI.pill(p.enabled ? '启用' : '停用', p.enabled ? 'ok' : 'gray')}</td>
        </tr>`).join('')}</tbody></table></div>`
      : UI.empty('暂无蓝队策略', '创建演练时可配置输入 / 输出 / 工具调用拦截策略');
    const tl = timeline.length
      ? `<div class="ex-tl">${timeline.slice(0, 40).map((e) => `<div class="ex-tl-row">
          <span class="ts">${esc(String(e.ts || '').slice(5, 19))}</span>
          <span class="ac">${esc(e.type || '事件')}</span>
          <span class="ct">${esc(e.content || '')}</span>
        </div>`).join('')}</div>
        <div class="dim" style="font-size:11px;margin-top:6px">共 ${N(timeline.length)} 条事件，展示最近 40 条</div>`
      : UI.empty('暂无事件', '绑定任务后，攻击与拦截事件将按时间线汇聚');
    return `${kpis}
      <div class="ex-blk">
        <span class="chip">红队任务 ${N(red.tasks)}</span>
        <span class="chip">样本 ${N(red.samples)}</span>
        <span class="chip">命中 ${N(red.hits)}</span>
        <span class="chip">拦截事件 ${N(blue.blocked)}</span>
        <span class="chip">漏报事件 ${N(blue.missed)}</span>
        <span class="chip">处置时延 ${N(blue.mttrMs)} ms</span>
      </div>
      <div class="sub-t" style="margin:4px 0 8px">红队任务</div>${redTbl}
      <div class="sub-t" style="margin:16px 0 8px">蓝队策略</div>${polTbl}
      <div class="sub-t" style="margin:16px 0 8px">事件时间线</div>${tl}
      <div class="dim" style="font-size:11px;margin-top:12px;line-height:1.7">${esc((sc && sc.formula) || '')}</div>`;
  }

  async function openExercise(id, onChanged) {
    const dr = UI.drawer({
      title: '红蓝演习 · 加载中',
      sub: '正在读取计分卡、红队任务与事件时间线…',
      width: 'min(1000px,94vw)',
      body: `<div style="padding:26px 0;text-align:center">
        <div class="skel" style="height:12px;width:38%;margin:0 auto 10px"></div>
        <div class="skel" style="height:12px;width:62%;margin:0 auto"></div></div>`,
      footer: `<button class="btn" data-ex-export>${icon('download', 13)}导出 CSV</button>
        <button class="btn" data-ex-close>关闭</button>`
    });
    const isAlive = () => dr.el.isConnected;
    dr.el.querySelector('[data-ex-close]').onclick = dr.close;
    const exp = dr.el.querySelector('[data-ex-export]');
    exp.disabled = true;
    let sc = null;
    exp.onclick = async () => {
      if (!sc) return;
      exp.disabled = true;
      try {
        const r = await API.get('/api/exercises/' + id + '/scorecard', { export: 'csv' });
        const info = (r && r.export) || {};
        if (!info.url) throw new Error('接口未返回导出地址');
        const a = document.createElement('a');
        a.href = info.url;
        a.download = info.file || ('scorecard-' + id + '.csv');
        document.body.appendChild(a);
        a.click();
        a.remove();
        UI.toast(`已导出计分卡 ${info.metricCount || ((sc.metrics || []).length)} 项指标 · ${info.file || ''}`);
      } catch (e) {
        UI.toast('导出失败：' + ((e && e.message) || e), 'err');
      }
      exp.disabled = false;
    };
    try {
      const [detail, card] = await Promise.all([
        API.get('/api/exercises/' + id),
        API.get('/api/exercises/' + id + '/scorecard')
      ]);
      if (!isAlive()) return;
      sc = card || {};
      const ex = (detail && detail.exercise) || (card && card.exercise) || {};
      const hd = dr.el.querySelector('.drawer-hd');
      if (hd && hd.firstElementChild) {
        const t1 = hd.firstElementChild.firstElementChild;
        const t2 = t1 ? t1.nextElementSibling : null;
        if (t1) t1.textContent = ex.name || ('演练 #' + id);
        if (t2) t2.textContent = `${ex.tenant || '—'} · ${ex.status || '—'} · 开始 ${ex.started_at || '—'}`;
      }
      const bd = dr.el.querySelector('.drawer-bd');
      if (bd) bd.innerHTML = exDetailHTML(detail, sc);
      exp.disabled = false;
    } catch (e) {
      if (!isAlive()) return;
      const bd = dr.el.querySelector('.drawer-bd');
      if (bd) bd.innerHTML = `<div style="padding:14px 2px">${UI.empty('演练详情加载失败', String((e && e.message) || e),
        '<button class="btn sm" data-ex-retry style="margin-top:10px">重试</button>')}</div>`;
      const rb = dr.el.querySelector('[data-ex-retry]');
      if (rb) rb.onclick = () => { dr.close(); openExercise(id, onChanged); };
    }
    return dr;
  }

  async function newExerciseModal(d, onCreated) {
    let agents = [];
    try { const r = await API.get('/api/agents'); agents = r.items || []; } catch (e) { agents = []; }
    const tenants = (d && d.tenants) || [];
    const body = `<div class="grid g-2" style="gap:10px">
        <div><div class="sub-t">演练名称</div><input class="input" id="ex-name" placeholder="例如：红蓝对抗演练-02 · 越狱验证" maxlength="60"></div>
        <div><div class="sub-t">租户</div><select class="select" id="ex-tenant">
          ${tenants.length
            ? tenants.map((t) => `<option value="${esc(t.code || t.name)}">${esc(t.name)}（${esc(t.code || '')}）</option>`).join('')
            : '<option value="DEFAULT">DEFAULT</option>'}
        </select></div>
      </div>
      <div class="sub-t" style="margin:14px 0 8px">红队智能体<span class="dim">可多选，未选择时演练仅记录策略</span></div>
      <div class="ex-ag-grid" id="ex-agents">${agents.length
        ? agents.map((a) => `<label class="ex-ag"><input type="checkbox" value="${esc(a.name)}"><span>${esc(a.name)}</span><em>${esc(a.scenario || '')}</em></label>`).join('')
        : '<span class="dim" style="font-size:11.5px">暂无可用攻击智能体</span>'}</div>
      <div class="sub-t" style="margin:16px 0 8px">蓝队策略<span class="dim">名称 / 拦截规则 / 作用域，可添加多行</span></div>
      <div id="ex-policies"></div>
      <button class="btn sm" type="button" data-ex-add-policy>${icon('plus', 12)}添加策略</button>
      <div id="ex-msg" style="margin-top:10px"></div>`;
    const md = UI.modal({
      title: '新建红蓝对抗演练',
      okText: '创建演练',
      body,
      onOk: async (el) => {
        const msg = el.querySelector('#ex-msg');
        const name = (el.querySelector('#ex-name').value || '').trim();
        const tenant = el.querySelector('#ex-tenant').value;
        if (!name) { msg.innerHTML = UI.note('请填写演练名称'); return false; }
        const red = Array.from(el.querySelectorAll('#ex-agents input[type=checkbox]:checked')).map((x) => x.value);
        const pols = Array.from(el.querySelectorAll('.ex-pol')).map((row) => ({
          name: (row.querySelector('[data-p-name]').value || '').trim(),
          rule: (row.querySelector('[data-p-rule]').value || '').trim(),
          scope: row.querySelector('[data-p-scope]').value
        })).filter((p) => p.name || p.rule);
        if (pols.some((p) => !p.name || !p.rule)) {
          msg.innerHTML = UI.note('蓝队策略需同时填写名称与规则，或删除空行');
          return false;
        }
        msg.innerHTML = '<div class="dim" style="font-size:11.5px">正在创建…</div>';
        try {
          const r = await API.post('/api/exercises', { name, tenant, red_agents: red, blue_policies: pols });
          UI.toast(`演练已创建 #${r.id} · 蓝队策略 ${r.bluePolicyCount} 条`);
          if (typeof onCreated === 'function') onCreated();
        } catch (e) {
          msg.innerHTML = UI.note('创建失败：' + esc((e && e.message) || e));
          return false;
        }
      }
    });
    const box = md.el.querySelector('#ex-policies');
    const addRow = (p) => {
      const div = document.createElement('div');
      div.className = 'ex-pol';
      div.innerHTML = `<input class="input" data-p-name placeholder="策略名称" maxlength="40" value="${esc((p && p.name) || '')}">
        <input class="input" data-p-rule placeholder="拦截规则，如：拒答|拦截" maxlength="80" value="${esc((p && p.rule) || '')}">
        <select class="select" data-p-scope>${['输入', '输出', '工具调用'].map((s) =>
          `<option${p && p.scope === s ? ' selected' : ''}>${s}</option>`).join('')}</select>
        <button class="icon-btn" type="button" data-p-del title="删除该策略" aria-label="删除该策略">${icon('close', 13)}</button>`;
      div.querySelector('[data-p-del]').onclick = () => { div.remove(); if (!box.children.length) addRow(); };
      box.appendChild(div);
    };
    addRow();
    md.el.querySelector('[data-ex-add-policy]').onclick = () => addRow();
    md.el.querySelectorAll('#ex-agents .ex-ag input').forEach((cb) => {
      cb.onchange = () => cb.closest('.ex-ag').classList.toggle('on', cb.checked);
    });
    return md;
  }

  w.Pages = w.Pages || {};
  w.Pages.admin = {
    async mount(root) {
      if (!document.getElementById('pg-admin')) {
        const s = document.createElement('style');
        s.id = 'pg-admin';
        s.textContent = STYLE;
        document.head.appendChild(s);
      }

      const page = this;
      const state = { tab: 'tenant', q: '', tenant: 'all', role: '', supQ: '', supRisky: false, supPage: 1 };
      const cache = { rbac: null, supply: null, exercise: null };
      const errs = { rbac: '', supply: '', exercise: '' };
      page.state = state;
      page.cache = cache;

      root.innerHTML = `<div class="fade-in">${UI.skel(3)}</div>`;

      let d;
      try {
        d = await API.get('/api/admin');
      } catch (e) {
        root.innerHTML = `<div class="card pad">${UI.empty('系统管理数据加载失败', String(e.message || e))}</div>`;
        UI.toast('系统管理数据加载失败：' + e.message, 'err');
        return () => {};
      }
      page.data = d;

      const shell = () => `${UI.pageHd({
        title: '系统管理',
        sub: `租户、用户与角色 · ${d.tenants.length} 个租户 / ${d.users.length} 名用户 / ${d.roles.length} 个角色`,
        actions: `<button class="btn" data-export>${icon('download', 14)}导出审计</button>
          <button class="btn primary" data-refresh>${icon('refresh', 14)}刷新数据</button>`
      })}
      <div class="stack">
        ${kpis(d)}
        ${UI.card({ flush: true, body: `${tabsHTML(state, d, cache)}<div id="adm-body"></div>` })}
        <div id="adm-gov">${governanceHTML(d)}</div>
      </div>`;

      root.innerHTML = `<div class="fade-in">${shell()}</div>`;

      const body = () => root.querySelector('#adm-body');

      const setTabChip = (id, n) => {
        const b = root.querySelector('[data-tab="' + id + '"]');
        if (!b) return;
        let c = b.querySelector('.c');
        if (!c) { c = document.createElement('span'); c.className = 'c num'; b.appendChild(c); }
        c.textContent = UI.num(n);
      };

      const loadingHTML = () => `<div style="padding:26px 16px;text-align:center">
        <div style="font-size:11.5px;color:var(--text-3);margin-bottom:14px">加载中…</div>
        <div class="skel" style="height:12px;width:42%;margin:0 auto 9px"></div>
        <div class="skel" style="height:12px;width:64%;margin:0 auto 9px"></div>
        <div class="skel" style="height:12px;width:52%;margin:0 auto"></div>
      </div>`;

      const errorHTML = (title, msg, key) => `<div style="padding:16px">${UI.empty(title, msg,
        `<button class="btn sm" data-retry="${key}" style="margin-top:10px">重试</button>`)}</div>`;

      /* ---------------------------------------------------- 懒加载：接口 */
      let rbacBusy = false;
      const loadRbac = async () => {
        if (rbacBusy) return;
        rbacBusy = true;
        try {
          cache.rbac = await API.get('/api/admin/rbac');
          errs.rbac = '';
          setTabChip('rbac', cache.rbac.resources.length);
        } catch (e) {
          errs.rbac = String((e && e.message) || e);
          UI.toast('权限矩阵加载失败：' + errs.rbac, 'err');
        }
        rbacBusy = false;
        if (state.tab === 'rbac') renderBody();
      };

      let supBusy = false;
      const loadSupply = async () => {
        if (supBusy) return;
        supBusy = true;
        try {
          cache.supply = await API.get('/api/supply/sbom');
          errs.supply = '';
          setTabChip('supply', cache.supply.count);
        } catch (e) {
          errs.supply = String((e && e.message) || e);
          UI.toast('供应链清单加载失败：' + errs.supply, 'err');
        }
        supBusy = false;
        if (state.tab === 'supply') renderBody();
      };

      let exBusy = false;
      const loadExercises = async () => {
        if (exBusy) return;
        exBusy = true;
        try {
          cache.exercise = await API.get('/api/exercises');
          errs.exercise = '';
          setTabChip('exercise', (cache.exercise.items || []).length);
        } catch (e) {
          errs.exercise = String((e && e.message) || e);
          UI.toast('演练数据加载失败：' + errs.exercise, 'err');
        }
        exBusy = false;
        if (state.tab === 'exercise') renderBody();
      };

      const reloadEx = () => { cache.exercise = null; loadExercises(); };

      /* -------------------------------------------------------- 行事件绑定 */
      const bindUserRows = (scope) => {
        scope.querySelectorAll('tr[data-user]').forEach((tr) => {
          tr.onclick = () => {
            const u = d.users.find((x) => x.account === tr.dataset.user);
            if (u) openUser(u, d);
          };
        });
      };

      const bindUserTab = (el) => {
        bindUserRows(el);
        const repaint = () => {
          const rows = usersOf(d, state);
          const tb = el.querySelector('#rows');
          if (tb) { tb.innerHTML = userRows(d, rows, state); bindUserRows(tb); }
          const cnt = el.querySelector('#cnt');
          if (cnt) cnt.textContent = rows.length;
        };
        const q = el.querySelector('#f-q');
        if (q) {
          q.oninput = () => { state.q = q.value; repaint(); };
          if (state.q) { q.focus(); const n = q.value.length; try { q.setSelectionRange(n, n); } catch (e) {} }
        }
        const ft = el.querySelector('#f-tenant');
        if (ft) ft.onchange = () => { state.tenant = ft.value; repaint(); };
        const cr = el.querySelector('[data-clear-role]');
        if (cr) cr.onclick = () => { state.role = ''; renderBody(); };
      };

      const bindRoleCards = (el) => {
        el.querySelectorAll('[data-role]').forEach((card) => {
          card.onclick = () => {
            const r = d.roles.find((x) => x.code === card.dataset.role);
            if (r) openRole(r, d);
          };
        });
      };

      /* ------------------------------------------------------ 权限矩阵事件 */
      const bindRbac = (el) => {
        const rb = cache.rbac;
        const paintKpis = () => {
          const box = el.querySelector('#rbac-kpis');
          if (box) box.innerHTML = rbacKpiCells(rb);
        };
        el.querySelectorAll('select[data-rbac]').forEach((sel) => {
          let prev = sel.value;
          sel.onchange = async () => {
            const level = Number(sel.value);
            const role = sel.dataset.role;
            const res = sel.dataset.res;
            const act = sel.dataset.act;
            sel.disabled = true;
            try {
              const r = await API.post('/api/admin/rbac', { role, res, act, level });
              const row = (rb.matrix || []).find((m) => m.res === res && m.act === act);
              if (row) row.levels[role] = r.level;
              prev = String(r.level);
              sel.className = 'select rbac-sel lv-' + r.level;
              paintKpis();
              UI.toast(`已更新 ${role} · ${res}.${act} → ${lvName(rb, r.level)}`);
            } catch (e) {
              sel.value = prev;
              UI.toast('权限更新失败：' + ((e && e.message) || e), 'err');
            }
            sel.disabled = false;
          };
        });
        const reload = el.querySelector('[data-rbac-reload]');
        if (reload) reload.onclick = async () => {
          reload.disabled = true;
          try {
            cache.rbac = await API.get('/api/admin/rbac');
            errs.rbac = '';
            if (state.tab === 'rbac') renderBody();
            UI.toast('权限矩阵已刷新');
          } catch (e) {
            UI.toast('刷新失败：' + ((e && e.message) || e), 'err');
          }
          reload.disabled = false;
        };
      };

      /* -------------------------------------------------------- 供应链事件 */
      const bindPager = (el) => {
        el.querySelectorAll('[data-sup-page]').forEach((b) => {
          b.onclick = () => {
            state.supPage = Number(b.dataset.supPage) || 1;
            repaintSupply(el);
          };
        });
      };

      const repaintSupply = (el) => {
        const sp = cache.supply;
        if (!sp) return;
        const view = supFiltered(sp, state);
        const pages = Math.max(1, Math.ceil(view.length / SUP_PAGE));
        const page = Math.min(Math.max(1, state.supPage), pages);
        state.supPage = page;
        const rows = view.slice((page - 1) * SUP_PAGE, page * SUP_PAGE);
        const tbody = el.querySelector('#sup-rows');
        if (tbody) tbody.innerHTML = supRowsHTML(sp, rows);
        const cnt = el.querySelector('#sup-cnt');
        if (cnt) cnt.textContent = view.length;
        const foot = el.querySelector('#sup-foot');
        if (foot) { foot.innerHTML = supFootHTML(view.length, page, pages); bindPager(el); }
      };

      const bindSupply = (el) => {
        const q = el.querySelector('#sup-q');
        if (q) {
          q.oninput = () => { state.supQ = q.value; state.supPage = 1; repaintSupply(el); };
          if (state.supQ) { q.focus(); const n = q.value.length; try { q.setSelectionRange(n, n); } catch (e) {} }
        }
        const risk = el.querySelector('#sup-risk');
        if (risk) risk.onchange = () => { state.supRisky = risk.checked; state.supPage = 1; repaintSupply(el); };
        bindPager(el);
      };

      const bindRetry = (el) => {
        el.querySelectorAll('[data-retry]').forEach((b) => {
          b.onclick = () => {
            const k = b.dataset.retry;
            errs[k] = '';
            cache[k] = null;
            renderBody();
          };
        });
      };

      /* ------------------------------------------------------------ 渲染 */
      const renderRbac = (el) => {
        if (errs.rbac) { el.innerHTML = errorHTML('权限矩阵加载失败', errs.rbac, 'rbac'); return; }
        if (!cache.rbac) { el.innerHTML = loadingHTML(); loadRbac(); return; }
        el.innerHTML = rbacBody(cache.rbac, state);
        bindRbac(el);
      };

      const renderSupply = (el) => {
        if (errs.supply) { el.innerHTML = errorHTML('供应链清单加载失败', errs.supply, 'supply'); return; }
        if (!cache.supply) { el.innerHTML = loadingHTML(); loadSupply(); return; }
        el.innerHTML = supBody(cache.supply, state);
        bindSupply(el);
      };

      const bindExerciseTab = (el) => {
        el.querySelectorAll('[data-ex-new]').forEach((b) => {
          b.onclick = () => newExerciseModal(d, reloadEx);
        });
        el.querySelectorAll('[data-ex-reload]').forEach((b) => {
          b.onclick = () => reloadEx();
        });
        el.querySelectorAll('[data-ex-open]').forEach((b) => {
          b.onclick = (ev) => { ev.stopPropagation(); openExercise(Number(b.dataset.exOpen)); };
        });
        el.querySelectorAll('tr[data-ex-id]').forEach((tr) => {
          tr.onclick = () => openExercise(Number(tr.dataset.exId));
          tr.onkeydown = (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); openExercise(Number(tr.dataset.exId)); } };
        });
      };

      const renderExercise = (el) => {
        if (errs.exercise) { el.innerHTML = errorHTML('演练数据加载失败', errs.exercise, 'exercise'); return; }
        if (!cache.exercise) { el.innerHTML = loadingHTML(); loadExercises(); return; }
        el.innerHTML = exListHTML(cache.exercise);
        bindExerciseTab(el);
      };

      const renderBody = () => {
        root.querySelectorAll('[data-tab]').forEach((b) => b.classList.toggle('on', b.dataset.tab === state.tab));
        const el = body();
        if (!el) return;
        if (state.tab === 'tenant') el.innerHTML = tenantHTML(d);
        else if (state.tab === 'user') { el.innerHTML = userHTML(d, state); bindUserTab(el); }
        else if (state.tab === 'role') { el.innerHTML = roleHTML(d); bindRoleCards(el); }
        else if (state.tab === 'rbac') renderRbac(el);
        else if (state.tab === 'exercise') renderExercise(el);
        else renderSupply(el);
        bindRetry(el);
      };

      /* 外壳事件：页签 / 动作按钮 / 治理概览（每次重绘后重新绑定） */
      const bindShell = () => {
        root.querySelectorAll('[data-tab]').forEach((b) => {
          b.onclick = () => {
            if (state.tab === b.dataset.tab) return;
            state.tab = b.dataset.tab;
            state.q = '';
            if (state.tab !== 'user') state.role = '';
            renderBody();
          };
        });
        root.querySelectorAll('[data-goto]').forEach((b) => {
          b.onclick = () => {
            state.tab = b.dataset.goto;
            state.q = '';
            renderBody();
          };
        });
        root.querySelectorAll('#adm-gov [data-gov-audit], #adm-gov .fail-row').forEach((el) => {
          el.onclick = () => {
            const a = d.audit.find((x) => String(x.id) === String(el.dataset.govAudit || el.dataset.audit));
            if (a) openAudit(a, d);
          };
        });
        root.querySelectorAll('#adm-gov [data-role]').forEach((el) => {
          el.onclick = () => {
            const r = d.roles.find((x) => String(x.id) === String(el.dataset.role));
            if (r) openRole(r, d);
          };
        });
        const all = root.querySelector('[data-audit-all]');
        if (all) all.onclick = () => openAuditList(d);
        const rbtn = root.querySelector('[data-refresh]');
        if (rbtn) rbtn.onclick = async () => {
          rbtn.disabled = true;
          try {
            d = await API.get('/api/admin');
            page.data = d;
            root.innerHTML = `<div class="fade-in">${shell()}</div>`;
            bindShell();
            renderBody();
            UI.toast('系统管理数据已刷新');
          } catch (e) {
            UI.toast('刷新失败：' + e.message, 'err');
          }
          rbtn.disabled = false;
        };
        const ex = root.querySelector('[data-export]');
        if (ex) ex.onclick = async () => {
          ex.disabled = true;
          try {
            const r = await API.get('/api/audit/export');
            const a = document.createElement('a');
            a.href = r.url;
            a.download = r.file || '';
            document.body.appendChild(a);
            a.click();
            a.remove();
            UI.toast(`已导出 ${r.count} 条审计记录`);
          } catch (e) {
            UI.toast('导出失败：' + e.message, 'err');
          } finally {
            ex.disabled = false;
          }
        };
      };

      bindShell();
      renderBody();
      return () => {};
    }
  };
})(window);
