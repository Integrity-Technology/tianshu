/* ============================================================================
   账号与安全：用户管理 / 角色权限 / 会话 / 登录日志 / 安全设置
   —— 对应认证内核 auth.py 的产品化管理界面
   ========================================================================== */
(function (w) {
  const { UI, API, icon, esc } = w;

  const TABS = [['users', '用户管理'], ['roles', '角色与权限'], ['sessions', '会话'],
    ['logs', '登录日志'], ['policy', '安全设置']];
  const ROLE_LABEL = { admin: '平台管理员', redteam: '红队工程师', blueteam: '蓝队工程师', judge: '裁判组', auditor: '只读审计' };
  const ROLE_DESC = {
    admin: '平台全量权限：用户/角色/会话管理、系统设置与全部业务操作',
    redteam: '攻击面：任务/编排/智能体/样本全量，可发起攻击与导出评估',
    blueteam: '防护面：防护插件配置与演练防守，业务数据只读',
    judge: '评估面：评估任务、评分与导出全量，攻击与样本只读',
    auditor: '只读审计：全局只读 + 导出，可查看用户与审计记录'
  };
  const RES_LABEL = {
    dashboard: '总览', attack: '攻击任务', samples: '样本', evals: '评估', envs: '环境',
    models: '模型', defense: '防护', data: '数据', cost: '成本', open: '开放能力',
    admin: '系统管理', reqs: '需求覆盖'
  };
  const ACT_LABEL = { read: '读', create: '建', update: '改', delete: '删', execute: '执行', export: '导出' };

  const state = {
    tab: 'users', q: '', role: '', status: '',
    users: [], roles: [], sessions: [], logs: [],
    info: null, me: null, roleSel: '', rolePerms: null,
    logFilter: { account: '', ok: '' }, loading: false
  };

  const STYLE = `
  .sec-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
  .sec-toolbar{display:flex;align-items:center;gap:8px;padding:10px 14px;border-bottom:1px solid var(--line-2);flex-wrap:wrap}
  .sec-toolbar .sp{flex:1}
  .sec-tbl td{vertical-align:middle}
  .u-cell{display:flex;align-items:center;gap:9px;min-width:0}
  .u-ava{width:28px;height:28px;border-radius:8px;display:grid;place-items:center;font-size:11.5px;font-weight:650;flex:0 0 28px}
  .u-name{font-weight:550;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .u-sub{font-size:10.5px;color:var(--text-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .role-card{border:1px solid var(--line);border-radius:12px;padding:14px;background:#fff;transition:.18s var(--ease);cursor:pointer}
  .role-card:hover{border-color:#D6DBE6;box-shadow:var(--sh-2)}
  .role-card.on{border-color:var(--brand);box-shadow:0 0 0 3px var(--brand-050)}
  .role-card .rc-top{display:flex;align-items:center;gap:10px}
  .role-card .rc-name{font-size:13px;font-weight:600}
  .role-card .rc-sub{font-size:10.5px;color:var(--text-3)}
  .role-card .rc-desc{font-size:11.5px;color:var(--text-2);line-height:1.65;margin:10px 0 8px;min-height:38px}
  .role-card .rc-foot{display:flex;align-items:center;gap:8px;border-top:1px solid var(--line-2);padding-top:9px;font-size:11px;color:var(--text-3)}
  .pmx-wrap{overflow:auto}
  .pmx{table-layout:fixed;min-width:640px}
  .pmx th,.pmx td{padding:7px 10px;text-align:center}
  .pmx th:first-child,.pmx td:first-child{text-align:left;width:132px}
  .pmx input[type=checkbox]{width:15px;height:15px;accent-color:var(--brand);cursor:pointer}
  .pmx tr.on td{background:#F7F9FE}
  .log-ua{font-size:10.5px;color:var(--text-3);max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .sec-note{border:1px solid var(--line);border-radius:12px;padding:14px;background:var(--surface-2);
    font-size:11.5px;color:var(--text-2);line-height:1.75}
  .sec-note b{color:var(--text);font-weight:600}
  .sec-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  .sec-kv{display:grid;grid-template-columns:112px 1fr;gap:7px 12px;font-size:12px}
  .sec-kv .k{color:var(--text-3)}
  .sec-kv .v{color:var(--text);font-weight:500;word-break:break-all}
  .temp-pw{font-family:var(--mono);font-size:16px;letter-spacing:.06em;background:var(--brand-050);
    color:var(--brand-600);border:1px dashed var(--brand-100);border-radius:10px;padding:12px;text-align:center;user-select:all}
  @media (max-width:1100px){.sec-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.sec-grid{grid-template-columns:1fr}}
  `;

  /* ------------------------------------------------------------ 工具 */
  const fmt = (s) => (s ? String(s).replace('T', ' ').slice(0, 19) : '—');
  const rolePill = (code) => `<span class="pill ${code === 'admin' ? 'brand' : code === 'redteam' ? 'danger'
    : code === 'blueteam' ? 'ok' : code === 'judge' ? 'violet' : 'gray'}"><i class="dot"></i>${esc(ROLE_LABEL[code] || code)}</span>`;
  const statusPill = (s) => `<span class="pill ${s === '启用' ? 'ok' : 'gray'}"><i class="dot"></i>${esc(s || '—')}</span>`;
  const avaColor = (code) => code === 'admin' ? 'brand' : code === 'redteam' ? 'danger' : code === 'blueteam' ? 'ok' : code === 'judge' ? 'violet' : 'gray';

  function loadTab() {
    if (state.tab === 'users') return API.get('/api/users', { current: 1, pageSize: 100 }).then((d) => { state.users = d.items || []; });
    if (state.tab === 'roles') return API.get('/api/roles').then((d) => { state.roles = d.items || []; });
    if (state.tab === 'sessions') return API.get('/api/sessions', { all: 1 }).then((d) => { state.sessions = d.items || []; });
    if (state.tab === 'logs') return API.get('/api/login-logs', { current: 1, pageSize: 100, account: state.logFilter.account, ok: state.logFilter.ok || '' }).then((d) => { state.logs = d.items || []; });
    return Promise.resolve();
  }

  /* ------------------------------------------------------------ 渲染 */
  function headHTML() {
    const info = state.info || {};
    const st = info.stats || {};
    const sec = info.security || {};
    return `<div class="stack" style="display:flex;flex-direction:column;gap:14px">
      ${UI.pageHd({
      title: '账号与安全',
      sub: `认证 ${info.authMode === 'on' ? '已启用' : '已关闭（开发模式）'} · 版本 ${esc(info.version || '')} · 用户 ${st.users || 0} · 在线会话 ${st.sessions || 0}`,
      actions: `<button class="btn" data-act="refresh">${icon('refresh', 14)} 刷新</button>`
    })}
      <div class="sec-kpis">
        ${UI.kpi({ label: '用户账号', value: UI.num(st.users || 0), meta: '含管理员账号' })}
        ${UI.kpi({ label: '在线会话', value: UI.num(st.sessions || 0), meta: '未过期且未退出' })}
        ${UI.kpi({ label: '今日登录', value: UI.num(st.loginToday || 0), meta: '成功登录次数' })}
        ${UI.kpi({ label: '审计记录', value: UI.num(st.audits || 0), meta: '登录、权限变更等操作均记录' })}
      </div>
      <section class="card" style="overflow:hidden">
        <div class="tabs-row" style="display:flex;gap:2px;padding:4px 14px 0;border-bottom:1px solid var(--line);overflow-x:auto">
          ${TABS.map(([v, t]) => `<button class="adm-tab ${state.tab === v ? 'on' : ''}" data-act="tab" data-tab="${v}"
            style="position:relative;display:flex;align-items:center;height:40px;padding:0 13px;font-size:12.5px;
            color:${state.tab === v ? 'var(--text)' : 'var(--text-2)'};font-weight:${state.tab === v ? 600 : 500};
            border-bottom:2px solid ${state.tab === v ? 'var(--brand)' : 'transparent'};margin-bottom:-1px;white-space:nowrap">${t}</button>`).join('')}
        </div>
        <div id="sec-body" style="min-height:320px">${bodyHTML()}</div>
      </section>
      <div class="sec-note">
        <b>安全说明</b>　密码采用 PBKDF2-SHA256（21 万次迭代 + 随机盐）存储；连续 ${esc(String(sec.maxLoginFail || 5))} 次密码错误锁定 ${esc(String(sec.lockMinutes || 15))} 分钟；
        失败登录限流 ${esc(String(sec.loginRpm || 30))} 次/分钟/IP；全部写操作需 CSRF 双提交校验（Cookie + X-CSRF-Token），并记录审计日志。
        生产环境请通过 HTTPS 反代访问并设置 PLATFORM_COOKIE_SECURE=1。
      </div>
    </div>`;
  }

  function bodyHTML() {
    if (state.tab === 'users') return usersHTML();
    if (state.tab === 'roles') return rolesHTML();
    if (state.tab === 'sessions') return sessionsHTML();
    if (state.tab === 'logs') return logsHTML();
    return policyHTML();
  }

  function usersHTML() {
    const q = state.q.trim().toLowerCase();
    const rows = state.users.filter((u) => {
      if (q && !(String(u.account).toLowerCase().includes(q) || String(u.name || '').toLowerCase().includes(q)
        || String(u.dept || '').toLowerCase().includes(q))) return false;
      if (state.role && u.role_code !== state.role) return false;
      if (state.status && u.status !== state.status) return false;
      return true;
    });
    const roleOpts = ['', ...Object.keys(ROLE_LABEL)].map((c) =>
      `<option value="${c}" ${state.role === c ? 'selected' : ''}>${c ? ROLE_LABEL[c] : '全部角色'}</option>`).join('');
    return `
      <div class="sec-toolbar">
        <input class="input" id="u-q" placeholder="搜索账号 / 姓名 / 部门" value="${esc(state.q)}" style="width:230px;height:30px">
        <select class="select" id="u-role" style="width:130px;height:30px">${roleOpts}</select>
        <select class="select" id="u-status" style="width:110px;height:30px">
          <option value="">全部状态</option>
          <option value="启用" ${state.status === '启用' ? 'selected' : ''}>启用</option>
          <option value="停用" ${state.status === '停用' ? 'selected' : ''}>停用</option>
        </select>
        <span class="sp"></span>
        <span class="tiny dim">共 ${rows.length} 个账号</span>
        <button class="btn primary sm" data-act="user-new">${icon('plus', 13)} 新建用户</button>
      </div>
      ${UI.table({
      cls: 'sec-tbl',
      cols: [
        {
          label: '账号 / 姓名', w: '24%', render: (u) => `<div class="u-cell">
            <div class="u-ava pill ${avaColor(u.role_code)}" style="width:28px;height:28px;border-radius:8px">${esc(String(u.name || u.account || '?').slice(0, 1))}</div>
            <div style="min-width:0"><div class="u-name">${esc(u.account)}</div>
            <div class="u-sub">${esc(u.name || '')}${u.must_change ? ' · 待改密' : ''}</div></div></div>`
        },
        { label: '角色', w: '13%', render: (u) => rolePill(u.role_code) },
        { label: '部门 / 租户', w: '17%', render: (u) => `<div class="u-name" style="font-weight:400">${esc(u.dept || '—')}</div><div class="u-sub">${esc(u.tenant || '')}</div>` },
        { label: '状态', w: '9%', render: (u) => statusPill(u.status) },
        { label: '最近登录', w: '15%', render: (u) => `<div class="tiny">${esc(fmt(u.last_login))}</div><div class="u-sub">${esc(u.last_ip || '—')}</div>` },
        {
          label: '操作', w: '22%', render: (u) => `<div class="row" style="gap:6px">
            <button class="btn sm" data-act="user-edit" data-id="${u.id}">编辑</button>
            <button class="btn sm" data-act="user-reset" data-id="${u.id}">重置密码</button>
            <button class="btn sm ${u.status === '启用' ? 'danger' : ''}" data-act="user-toggle" data-id="${u.id}"
              data-status="${u.status === '启用' ? '停用' : '启用'}">${u.status === '启用' ? '停用' : '启用'}</button>
          </div>`
        }
      ],
      rows
    })}`;
  }

  function rolesHTML() {
    const roles = state.roles;
    return `
      <div style="padding:14px 16px;display:flex;flex-direction:column;gap:14px">
        <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px">
          ${roles.map((r) => `<div class="role-card ${state.roleSel === r.role_code ? 'on' : ''}" data-act="role-sel" data-role="${esc(r.role_code)}" tabindex="0" role="button">
            <div class="rc-top"><div class="u-ava pill ${avaColor(r.role_code)}" style="width:32px;height:32px;border-radius:9px">${esc(String(r.name || '?').slice(0, 1))}</div>
              <div><div class="rc-name">${esc(r.name)}</div><div class="rc-sub">${esc(r.role_code || '')} · ${r.members || 0} 名成员</div></div></div>
            <div class="rc-desc">${esc(ROLE_DESC[r.role_code] || r.desc || '')}</div>
            <div class="rc-foot"><span>${r.members || 0} 名成员</span>
              <span style="margin-left:auto;color:var(--brand);font-weight:550">查看权限 →</span></div>
          </div>`).join('')}
        </div>
        ${state.roleSel ? matrixHTML() : `<div style="border:1px dashed var(--line);border-radius:12px;padding:26px;text-align:center;color:var(--text-3);font-size:12.5px">选择上方角色查看并编辑「资源 × 动作」权限矩阵</div>`}
      </div>`;
  }

  function matrixHTML() {
    const p = state.rolePerms;
    if (!p) return `<div class="sec-note">权限加载中…</div>`;
    const acts = p.actions || [];
    const matrix = p.matrix || [];
    const readOnly = p.role === 'admin';
    return `
      <div class="card" style="overflow:hidden">
        <div class="card-hd"><h3>${esc(ROLE_LABEL[p.role] || p.role)} · 权限矩阵</h3>
          <span class="sub">${readOnly ? '管理员拥有全部权限，不可修改（防止锁死）' : '勾选后保存立即生效，接口级强制执行'}</span>
          <div class="right">${readOnly ? '' : `<button class="btn primary sm" data-act="perms-save">保存权限</button>`}</div></div>
        <div class="card-bd flush"><div class="pmx-wrap"><table class="tbl pmx">
          <thead><tr><th>资源 / 动作</th>${acts.map((a) => `<th>${esc(ACT_LABEL[a] || a)}</th>`).join('')}</tr></thead>
          <tbody>${matrix.map((row) => `<tr><td><b>${esc(RES_LABEL[row.res] || row.res)}</b> <span class="tiny dim">${esc(row.res)}</span></td>
            ${acts.map((a) => `<td><input type="checkbox" data-perm="${esc(row.res)}|${esc(a)}" ${row.acts[a] ? 'checked' : ''} ${readOnly ? 'disabled' : ''}></td>`).join('')}
          </tr>`).join('')}</tbody>
        </table></div></div>
      </div>`;
  }

  function sessionsHTML() {
    return `
      <div class="sec-toolbar"><span class="tiny dim">会话采用 HttpOnly Cookie，滑动续期 8 小时（勾选“7 天免登录”为 7 天）</span>
        <span class="sp"></span><span class="tiny dim">共 ${state.sessions.length} 条</span></div>
      ${UI.table({
      cls: 'sec-tbl',
      cols: [
        { label: '用户', w: '18%', render: (s) => `<div class="u-name">${esc(s.name || s.account || '—')}</div><div class="u-sub">${esc(s.account || '')}</div>` },
        { label: '来源 IP', w: '12%', render: (s) => `<span class="mono">${esc(s.ip || '—')}</span>` },
        {
          label: '最近活跃 / 过期时间', w: '22%', render: (s) => `<div class="tiny">${esc(fmt(s.last_seen))}</div>
            <div class="u-sub">到期 ${esc(fmt(s.expires))}</div>`
        },
        {
          label: '状态', w: '12%', render: (s) => s.revoked ? '<span class="pill gray"><i class="dot"></i>已退出</span>'
            : (s.expired ? '<span class="pill warn"><i class="dot"></i>已过期</span>' : '<span class="pill ok"><i class="dot"></i>在线</span>')
        },
        { label: '客户端', w: '26%', render: (s) => `<div class="log-ua" title="${esc(s.ua || '')}">${esc(s.ua || '—')}</div>${s.current ? '<span class="pill brand" style="margin-top:3px"><i class="dot"></i>当前会话</span>' : ''}` },
        {
          label: '操作', w: '10%', render: (s) => (s.revoked || s.expired) ? '—'
            : `<button class="btn sm danger" data-act="sess-revoke" data-id="${s.id}">下线</button>`
        }
      ],
      rows: state.sessions
    })}`;
  }

  function logsHTML() {
    return `
      <div class="sec-toolbar">
        <input class="input" id="log-q" placeholder="按账号筛选" value="${esc(state.logFilter.account)}" style="width:180px;height:30px">
        <select class="select" id="log-ok" style="width:120px;height:30px">
          <option value="">全部结果</option>
          <option value="1" ${state.logFilter.ok === '1' ? 'selected' : ''}>成功</option>
          <option value="0" ${state.logFilter.ok === '0' ? 'selected' : ''}>失败</option>
        </select>
        <button class="btn sm" data-act="log-filter">查询</button>
        <span class="sp"></span><span class="tiny dim">共 ${state.logs.length} 条（最近 100 条）</span>
      </div>
      ${UI.table({
      cols: [
        { label: '时间', w: '16%', render: (r) => `<span class="mono">${esc(fmt(r.ts))}</span>` },
        { label: '账号', w: '14%', render: (r) => esc(r.account || '—') },
        { label: '结果', w: '9%', render: (r) => r.ok ? '<span class="pill ok"><i class="dot"></i>成功</span>' : '<span class="pill danger"><i class="dot"></i>失败</span>' },
        { label: '说明', w: '20%', render: (r) => esc(r.reason || '') },
        { label: 'IP', w: '13%', render: (r) => `<span class="mono">${esc(r.ip || '')}</span>` },
        { label: '客户端', w: '28%', render: (r) => `<div class="log-ua" title="${esc(r.ua || '')}">${esc(r.ua || '—')}</div>` }
      ],
      rows: state.logs
    })}`;
  }

  function policyHTML() {
    const info = state.info || {};
    const sec = info.security || {};
    const me = (state.me && state.me.user) || {};
    return `
      <div style="padding:14px 16px">
        <div class="sec-grid">
          <div class="card"><div class="card-hd"><h3>密码与会话策略</h3><span class="sub">由环境变量配置，重启生效</span></div>
            <div class="card-bd"><div class="sec-kv">
              <span class="k">密码最小长度</span><span class="v">${esc(String(sec.passwordMin || 8))} 位（且需 ≥3 类字符）</span>
              <span class="k">失败锁定</span><span class="v">连续 ${esc(String(sec.maxLoginFail || 5))} 次 / 锁定 ${esc(String(sec.lockMinutes || 15))} 分钟</span>
              <span class="k">失败登录限流</span><span class="v">${esc(String(sec.loginRpm || 30))} 次 / 分钟 / IP（成功登录不计数）</span>
              <span class="k">会话有效期</span><span class="v">${esc(String(info.sessionTTL || 28800))} 秒（滑动续期）</span>
              <span class="k">CSRF 防护</span><span class="v">${sec.csrf ? '已启用（Cookie + Header 双提交）' : '未启用'}</span>
              <span class="k">Cookie Secure</span><span class="v">${esc(String(sec.cookieSecure || 'auto'))}</span>
            </div></div>
          </div>
          <div class="card"><div class="card-hd"><h3>当前账号</h3><span class="sub">我的密码修改后其他终端将强制下线</span></div>
            <div class="card-bd"><div class="sec-kv">
              <span class="k">账号</span><span class="v">${esc(me.account || '—')}</span>
              <span class="k">姓名</span><span class="v">${esc(me.name || '—')}</span>
              <span class="k">角色</span><span class="v">${esc(ROLE_LABEL[me.role_code] || me.role || '—')}</span>
              <span class="k">部门</span><span class="v">${esc(me.dept || '—')}</span>
              <span class="k">最近登录</span><span class="v">${esc(fmt(me.last_login))}</span>
              <span class="k">上次改密</span><span class="v">${esc(fmt(me.pwd_changed))}</span>
            </div>
            <div class="row" style="margin-top:14px;gap:8px">
              <button class="btn sm" data-act="profile-self">编辑资料</button>
              <button class="btn primary sm" data-act="pwd-self">修改我的密码</button>
            </div></div>
          </div>
        </div>
        <div class="sec-note" style="margin-top:14px">
          <b>运行信息</b>　Python ${esc(info.python || '')} · ${esc(info.platform || '')} · 数据库 ${esc(info.dbPath || '')}
          （${esc((Math.round((info.dbSize || 0) / 1024 / 1024 * 10) / 10) + ' MB')}）· 已运行 ${esc(String(Math.floor((info.uptimeSec || 0) / 3600)))} 小时
        </div>
      </div>`;
  }

  /* ------------------------------------------------------------ 交互 */
  function repaint(root) {
    const body = root.querySelector('#sec-body');
    if (body) body.innerHTML = bodyHTML();
    root.querySelectorAll('[data-act="tab"]').forEach((b) => {
      const on = b.dataset.tab === state.tab;
      b.classList.toggle('on', on);
      b.style.color = on ? 'var(--text)' : 'var(--text-2)';
      b.style.fontWeight = on ? '600' : '500';
      b.style.borderBottomColor = on ? 'var(--brand)' : 'transparent';
    });
  }

  function reload(root) {
    return loadTab().then(() => { repaint(root); }).catch((e) => {
      UI.toast('加载失败：' + e.message, 'err');
    });
  }

  function userForm(u) {
    const isNew = !u;
    u = u || {};
    return `
      <div class="form-grid" style="grid-template-columns:1fr">
        <div class="field"><label>账号（登录名）</label>
          <input class="input" id="f-account" value="${esc(u.account || '')}" ${isNew ? '' : 'disabled'} placeholder="字母开头，3-32 位">
          ${isNew ? '' : '<span class="hint">账号创建后不可修改</span>'}</div>
        <div class="field"><label>姓名</label><input class="input" id="f-name" value="${esc(u.name || '')}" placeholder="真实姓名"></div>
        <div class="field"><label>角色</label><select class="select" id="f-role">
          ${Object.keys(ROLE_LABEL).map((c) => `<option value="${c}" ${(u.role_code === c) ? 'selected' : ''}>${ROLE_LABEL[c]}</option>`).join('')}
        </select></div>
        <div class="field"><label>部门</label><input class="input" id="f-dept" value="${esc(u.dept || '')}" placeholder="如：红队 / 安全运营部"></div>
        <div class="field"><label>邮箱</label><input class="input" id="f-email" value="${esc(u.email || '')}" placeholder="可选"></div>
        <div class="field"><label>手机号</label><input class="input" id="f-phone" value="${esc(u.phone || '')}" placeholder="可选"></div>
        ${isNew ? `<div class="field"><label>初始密码</label><input class="input" id="f-password" placeholder="留空则自动生成临时密码">
          <span class="hint">首次登录将强制修改密码</span></div>` : ''}
      </div>`;
  }

  function openUserDrawer(root, u) {
    const isNew = !u;
    const d = UI.drawer({
      title: isNew ? '新建用户' : '编辑用户',
      sub: isNew ? '创建后首次登录需修改初始密码' : ('账号 ' + (u.account || '')),
      body: userForm(u),
      footer: `<button class="btn" data-cancel>取消</button><button class="btn primary" data-save>保存</button>`
    });
    d.el.querySelector('[data-cancel]').onclick = d.close;
    d.el.querySelector('[data-save]').onclick = async () => {
      const val = (id) => (d.el.querySelector(id) || {}).value || '';
      const payload = { name: val('#f-name').trim(), role: val('#f-role'), dept: val('#f-dept').trim(), email: val('#f-email').trim(), phone: val('#f-phone').trim() };
      try {
        if (isNew) {
          payload.account = val('#f-account').trim();
          const pw = val('#f-password').trim();
          if (pw) payload.password = pw;
          if (!payload.account) return UI.toast('请输入账号', 'err');
          if (!payload.name) return UI.toast('请输入姓名', 'err');
          const r = await API.post('/api/users', payload);
          d.close();
          reload(root);
          if (r && r.tempPassword) showTempPassword(r.account, r.tempPassword);
          else UI.toast('用户已创建', 'ok');
          return;
        }
        if (!payload.name) return UI.toast('请输入姓名', 'err');
        await API.req('PUT', '/api/users/' + u.id, payload);
        d.close(); reload(root); UI.toast('用户已更新', 'ok');
      } catch (e) { UI.toast('保存失败：' + e.message, 'err'); }
    };
  }

  function showTempPassword(account, pw) {
    const d = UI.modal({
      title: '初始密码（仅显示一次）',
      body: `<p style="font-size:12.5px;color:var(--text-2);line-height:1.7;margin-bottom:12px">
        账号 <b>${esc(account)}</b> 的临时密码如下，请通过安全渠道告知用户，并提示其首次登录后立即修改。</p>
        <div class="temp-pw" id="tp">${esc(pw)}</div>`,
      okText: '我已记录',
      cancelText: '',
      onOk: () => true
    });
    const el = d.body.querySelector('#tp');
    if (el) {
      const btn = document.createElement('button');
      btn.className = 'btn sm'; btn.textContent = '复制';
      btn.style.marginTop = '10px';
      btn.onclick = () => {
        try { navigator.clipboard.writeText(pw).then(() => UI.toast('已复制', 'ok')); }
        catch (e) { UI.toast('请手动选择复制', 'err'); }
      };
      el.insertAdjacentElement('afterend', btn);
    }
  }

  async function selectRole(root, code) {
    state.roleSel = code;
    state.rolePerms = null;
    repaint(root);
    try {
      state.rolePerms = await API.get('/api/roles/' + code + '/perms');
    } catch (e) {
      UI.toast('权限加载失败：' + e.message, 'err');
    }
    repaint(root);
  }

  function onClick(root, ev) {
    const btn = ev.target.closest('[data-act]');
    if (!btn) return;
    const act = btn.dataset.act;
    if (act === 'tab') { state.tab = btn.dataset.tab; repaint(root); reload(root); return; }
    if (act === 'refresh') {
      loadInfo().then(() => {
        root.innerHTML = headHTML();
        return loadTab();
      }).then(() => {
        repaint(root);
        if (state.roleSel) return selectRole(root, state.roleSel);
        return null;
      }).then(() => UI.toast('已刷新', 'ok'))
        .catch((e) => UI.toast('刷新失败：' + e.message, 'err'));
      return;
    }
    if (act === 'user-new') { openUserDrawer(root, null); return; }
    if (act === 'user-edit') { openUserDrawer(root, state.users.find((x) => String(x.id) === btn.dataset.id)); return; }
    if (act === 'user-reset') {
      const u = state.users.find((x) => String(x.id) === btn.dataset.id) || {};
      UI.modal({
        title: '重置密码',
        body: `<p style="font-size:12.5px;line-height:1.7">将重置账号 <b>${esc(u.account || '')}</b> 的密码，系统生成随机临时密码，
          该账号所有会话立即下线，下次登录必须修改密码。</p>`,
        danger: true, okText: '确认重置',
        onOk: async () => {
          const r = await API.post('/api/users/' + u.id + '/reset-password', {});
          reload(root);
          showTempPassword(u.account, r.tempPassword);
        }
      });
      return;
    }
    if (act === 'user-toggle') {
      const u = state.users.find((x) => String(x.id) === btn.dataset.id) || {};
      const st = btn.dataset.status;
      API.post('/api/users/' + u.id + '/status', { status: st }).then(() => {
        UI.toast('账号已' + st, 'ok'); reload(root);
      }).catch((e) => UI.toast('操作失败：' + e.message, 'err'));
      return;
    }
    if (act === 'role-sel') { selectRole(root, btn.dataset.role); return; }
    if (act === 'perms-save') {
      const p = state.rolePerms;
      if (!p) return;
      const matrix = p.resources.map((res) => {
        const acts = {};
        p.actions.forEach((a) => {
          const cb = root.querySelector('[data-perm="' + res + '|' + a + '"]');
          acts[a] = !!(cb && cb.checked);
        });
        return { res, acts };
      });
      API.req('PUT', '/api/roles/' + p.role + '/perms', { matrix }).then((r) => {
        UI.toast('权限已保存（' + (r.changed || 0) + ' 项）', 'ok');
        state.rolePerms = null; selectRole(root, p.role);
      }).catch((e) => UI.toast('保存失败：' + e.message, 'err'));
      return;
    }
    if (act === 'sess-revoke') {
      const id = btn.dataset.id;
      UI.modal({
        title: '下线会话', body: '<p style="font-size:12.5px;line-height:1.7">该会话将立即失效，用户需重新登录。</p>',
        danger: true, okText: '确认下线',
        onOk: async () => { await API.del('/api/sessions/' + id); reload(root); UI.toast('会话已下线', 'ok'); }
      });
      return;
    }
    if (act === 'log-filter') { repaint(root); reload(root); return; }
    if (act === 'pwd-self') { openSelfPwd(root); return; }
    if (act === 'profile-self') { openSelfProfile(root); return; }
  }

  function openSelfPwd(root) {
    const d = UI.drawer({
      title: '修改我的密码',
      sub: '修改后其他终端的会话将强制退出',
      body: `<div style="display:flex;flex-direction:column;gap:12px">
        <div class="field"><label>当前密码</label><input class="input" type="password" id="p-old"></div>
        <div class="field"><label>新密码</label><input class="input" type="password" id="p-new" placeholder="至少 8 位，含大小写/数字/符号中 3 类"></div>
        <div class="field"><label>确认新密码</label><input class="input" type="password" id="p-new2"></div>
      </div>`,
      footer: `<button class="btn" data-cancel>取消</button><button class="btn primary" data-save>保存</button>`
    });
    d.el.querySelector('[data-cancel]').onclick = d.close;
    d.el.querySelector('[data-save]').onclick = async () => {
      const g = (id) => (d.el.querySelector(id) || {}).value || '';
      if (g('#p-new').length < 8) return UI.toast('新密码至少 8 位', 'err');
      if (g('#p-new') !== g('#p-new2')) return UI.toast('两次输入不一致', 'err');
      try {
        await API.post('/api/auth/change-password', { old: g('#p-old'), new: g('#p-new') });
        d.close(); UI.toast('密码已修改', 'ok');
        loadInfo().then(() => repaint(root));
      } catch (e) { UI.toast('修改失败：' + e.message, 'err'); }
    };
  }

  function openSelfProfile(root) {
    const me = (state.me && state.me.user) || {};
    const d = UI.drawer({
      title: '编辑个人资料',
      sub: '姓名 / 邮箱 / 手机号，用于通知与审计展示',
      body: `<div style="display:flex;flex-direction:column;gap:12px">
        <div class="field"><label>账号</label><input class="input" value="${esc(me.account || '')}" disabled></div>
        <div class="field"><label>姓名</label><input class="input" id="pf-name" value="${esc(me.name || '')}"></div>
        <div class="field"><label>邮箱</label><input class="input" id="pf-email" value="${esc(me.email || '')}" placeholder="可选"></div>
        <div class="field"><label>手机号</label><input class="input" id="pf-phone" value="${esc(me.phone || '')}" placeholder="可选"></div>
      </div>`,
      footer: `<button class="btn" data-cancel>取消</button><button class="btn primary" data-save>保存</button>`
    });
    d.el.querySelector('[data-cancel]').onclick = d.close;
    d.el.querySelector('[data-save]').onclick = async () => {
      const g = (id) => (d.el.querySelector(id) || {}).value || '';
      try {
        const r = await API.req('PUT', '/api/auth/profile',
          { name: g('#pf-name'), email: g('#pf-email'), phone: g('#pf-phone') });
        d.close();
        if (state.me && state.me.user) state.me.user = Object.assign({}, state.me.user, r || {});
        const foot = document.querySelector('.rail-foot .who');
        if (foot && r && r.name) {
          foot.innerHTML = esc(r.name) + '<span>' + esc((r.role || '') +
            (r.dept ? ' · ' + r.dept : '')) + '</span>';
        }
        const av = document.querySelector('.rail-foot .avatar');
        if (av && r && r.name) av.textContent = String(r.name).slice(0, 1);
        repaint(root);
        UI.toast('资料已更新', 'ok');
      } catch (e) { UI.toast('保存失败：' + e.message, 'err'); }
    };
  }

  function onInput(root, ev) {
    const t = ev.target;
    if (t.id === 'u-q') { state.q = t.value; clearTimeout(state._t1); state._t1 = setTimeout(() => repaint(root), 180); return; }
    if (t.id === 'u-role') { state.role = t.value; repaint(root); return; }
    if (t.id === 'u-status') { state.status = t.value; repaint(root); return; }
    if (t.id === 'log-q') { state.logFilter.account = t.value; return; }
    if (t.id === 'log-ok') { state.logFilter.ok = t.value; return; }
  }

  function loadInfo() {
    return API.get('/api/system/info').then((d) => { state.info = d; }).catch(() => { });
  }

  /* ------------------------------------------------------------ 入口 */
  w.Pages = w.Pages || {};
  w.Pages.security = {
    cockpit: false,
    async mount(root) {
      if (!document.getElementById('pg-security')) {
        const s = document.createElement('style');
        s.id = 'pg-security'; s.textContent = STYLE;
        document.head.appendChild(s);
      }
      root.innerHTML = `<div id="sec-root" class="stack" style="padding-bottom:8px"></div>`;
      const box = root.querySelector('#sec-root');
      try {
        const [me] = await Promise.all([API.get('/api/auth/me'), loadInfo()]);
        state.me = me;
      } catch (e) {
        box.innerHTML = UI.card({ body: UI.empty('安全数据加载失败', e.message) });
        return () => { };
      }
      box.innerHTML = headHTML();
      await reload(box);
      const host = root.querySelector('#sec-root');
      host.addEventListener('click', (ev) => onClick(host, ev));
      host.addEventListener('input', (ev) => onInput(host, ev));
      host.addEventListener('change', (ev) => {
        if (ev.target.id === 'u-role' || ev.target.id === 'u-status') onInput(host, ev);
      });
      return () => { clearTimeout(state._t1); };
    }
  };
})(window);
