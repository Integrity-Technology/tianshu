/* ============================================================================
   任务中心 V3
   攻击链路（多轮）/ 事件回放 / 三维评分 / 工具调用 / 任务报告
   案例库复现 / 经验总结 / 运行中人工介入
   ========================================================================== */
(function (w) {
  'use strict';

  const { UI, API, Charts, icon } = w;
  const esc = UI.esc;
  const PAL = Charts.pal;

  const STYLE = `
  .pg-tabs{display:flex;gap:2px;border-bottom:1px solid var(--line);margin:0 0 14px;overflow-x:auto}
  .pg-tabs button{border:0;background:transparent;padding:9px 11px;font-size:12.5px;color:var(--text-2);cursor:pointer;
    border-bottom:2px solid transparent;margin-bottom:-1px;white-space:nowrap}
  .pg-tabs button:hover{color:var(--text)}
  .pg-tabs button.on{color:var(--brand);border-bottom-color:var(--brand);font-weight:600}
  .pg-tabs .n{display:inline-block;margin-left:5px;padding:0 5px;height:16px;line-height:16px;border-radius:8px;
    background:#F0F3F9;color:var(--text-2);font-size:10px;font-weight:600;vertical-align:1px}
  .pg-tabs button.on .n{background:var(--brand-050);color:var(--brand)}
  .pg-nw{white-space:nowrap}
  .pg-chips{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:12px}
  .pg-chip{display:inline-flex;align-items:center;gap:6px;height:24px;padding:0 9px;border:1px solid var(--line);
    border-radius:7px;background:#fff;font-size:11px;color:var(--text-2);white-space:nowrap}
  .pg-chip b{color:var(--text);font-weight:600;font-variant-numeric:tabular-nums}
  .pg-chip .dot{width:6px;height:6px;border-radius:50%;background:var(--brand)}
  .pg-stamp{font-size:11px;color:var(--text-3);margin-left:auto;align-self:center}
  .pg-ev{display:block;width:100%;text-align:left;border:1px solid var(--line);border-radius:10px;background:#fff;
    padding:9px 11px;margin-bottom:8px;cursor:pointer;transition:border-color .15s,background .15s}
  .pg-ev:hover{border-color:#C9D5F5;background:#FBFCFE}
  .pg-ev.lv-risk{border-left:3px solid var(--danger);background:#FFFCFC}
  .pg-ev.lv-warn{border-left:3px solid var(--warn)}
  .pg-ev-hd{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-bottom:4px}
  .pg-ev-seq{display:inline-grid;place-items:center;min-width:24px;height:18px;padding:0 4px;border-radius:5px;
    background:#F0F3F9;color:var(--text-2);font-size:10px;font-weight:600;font-variant-numeric:tabular-nums}
  .pg-ev-t{font-size:11px;font-weight:600;letter-spacing:.02em}
  .pg-ev-a{font-size:11px;color:var(--text-3)}
  .pg-ev-m{margin-left:auto;font-size:10.5px;color:var(--text-3);font-variant-numeric:tabular-nums;white-space:nowrap}
  .pg-ev-b{font-size:12.5px;color:var(--text-2);line-height:1.62;
    display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  .pg-ev.lv-risk .pg-ev-b{color:#A32B2B}
  .pg-flag{display:inline-flex;align-items:center;height:17px;padding:0 5px;border-radius:4px;font-size:10px;font-weight:600}
  .pg-inject{margin-top:12px;border:1px dashed #C7D3F3;background:#F8FAFF;border-radius:10px;padding:11px 12px}
  .pg-inject .ih{display:flex;align-items:center;gap:6px;font-size:11.5px;font-weight:600;color:var(--brand-600);margin-bottom:8px}
  .pg-inject .ir{display:flex;gap:8px}
  .pg-inject .ir .input{flex:1}
  .pg-inject .tip{font-size:10.5px;color:var(--text-3);margin-top:7px}
  .pg-round{display:flex;align-items:center;gap:8px;margin:14px 0 8px}
  .pg-round:first-of-type{margin-top:0}
  .pg-round:before{content:"";width:3px;height:12px;border-radius:2px;background:var(--brand)}
  .pg-round b{font-size:12px;font-weight:600}
  .pg-turn{border:1px solid var(--line);border-radius:10px;background:#fff;padding:11px 13px;margin-bottom:9px}
  .pg-turn.leaked{border-color:#F0C9C9;background:#FFFDFD}
  .pg-turn.harmful{border-color:#DCCFF8}
  .pg-turn-hd{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:8px}
  .pg-turn-no{margin-left:auto;font-size:10.5px;color:var(--text-3);font-variant-numeric:tabular-nums}
  .pg-badge{display:inline-flex;align-items:center;height:19px;padding:0 7px;border-radius:5px;font-size:10.5px;
    font-weight:600;letter-spacing:.01em}
  .pg-badge.pass{background:#EEF2F7;color:#5F6B80}
  .pg-badge.leaked{background:var(--danger-bg);color:#B32B2B}
  .pg-badge.harmful{background:var(--violet-bg);color:#5B3BC0}
  .pg-badge.blocked{background:var(--brand-050);color:var(--brand-600)}
  .pg-badge.refused{background:var(--ok-bg);color:#0A7A56}
  .pg-lab{font-size:10.5px;color:var(--text-3);margin:7px 0 4px;letter-spacing:.02em}
  .pg-pre{font-family:var(--mono);font-size:11.5px;line-height:1.72;background:var(--surface-2);
    border:1px solid var(--line-2);border-radius:7px;padding:8px 10px;white-space:pre-wrap;word-break:break-word;
    color:var(--text);max-height:150px;overflow:auto}
  .pg-pre.sm{max-height:96px;font-size:11px}
  .pg-pre.lg{max-height:none;min-height:90px}
  .pg-pre.risk{background:#FFF8F8;border-color:#F3D2D2;color:#8F2626}
  .pg-q{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
  .pg-q-c{display:flex;flex-direction:column;align-items:center;border:1px solid var(--line);border-radius:11px;
    background:#fff;padding:14px 12px 12px}
  .pg-q-c .t{font-size:12.5px;font-weight:600;margin-top:7px}
  .pg-q-c .d{font-size:10.5px;color:var(--text-3);margin-top:3px;text-align:center;line-height:1.55}
  .pg-rp{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.08fr);gap:12px;align-items:start}
  .pg-rp-bar{display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap}
  .pg-rp-list{border:1px solid var(--line);border-radius:10px;background:var(--surface-2);padding:5px;
    max-height:430px;overflow:auto}
  .pg-rp-item{display:flex;align-items:center;gap:7px;width:100%;text-align:left;border:0;background:transparent;
    border-radius:7px;padding:6px 7px;font-size:11px;color:var(--text-2);cursor:pointer}
  .pg-rp-item:hover{background:#F1F4FA}
  .pg-rp-item.on{background:#E9EEFE;box-shadow:inset 0 0 0 1px #BCCAFB;color:var(--text)}
  .pg-rp-item .s{flex:0 0 auto;font-family:var(--mono);font-size:10px;color:var(--text-3)}
  .pg-rp-item .t{flex:0 0 34px;font-weight:600;font-size:10.5px}
  .pg-rp-item .x{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .pg-rp-item .m{flex:0 0 auto;font-size:9.5px;color:var(--text-3)}
  .pg-rp-item.on .x{white-space:normal}
  .pg-detail{border:1px solid var(--line);border-radius:10px;background:#fff;padding:12px 13px}
  .pg-meta{display:flex;justify-content:space-between;gap:10px;font-size:11.5px;padding:5px 0;
    border-bottom:1px dashed var(--line-2)}
  .pg-meta:last-of-type{border-bottom:0}
  .pg-meta span{color:var(--text-3);flex:0 0 auto}
  .pg-meta b{font-weight:560;text-align:right;word-break:break-word}
  .pg-foot-note{margin-right:auto;align-self:center;font-size:11px;color:var(--text-3)}
  .pg-tools td .mono{font-size:10.5px}
  .pg-turn .pg-pre{background:#FBFCFE}
  @media (max-width:1180px){
    .pg-rp{grid-template-columns:1fr}
    .pg-q{grid-template-columns:1fr}
  }
  .tk-intel-hd{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1px;background:var(--line-2);border-bottom:1px solid var(--line-2)}
  .tk-i-stat{background:var(--surface-2);padding:11px 14px;min-width:0}
  .tk-i-stat span{display:block;font-size:10.5px;color:var(--text-3)}
  .tk-i-stat b{font-size:19px;font-weight:650;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
  .tk-i-stat b small{font-size:10.5px;font-weight:500;color:var(--text-3);margin-left:3px;letter-spacing:0}
  .tk-i-stat em{display:block;font-style:normal;font-size:10.5px;color:var(--text-3);margin-top:1px}
  .tk-intel-toolbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:10px 16px;border-bottom:1px solid var(--line-2)}
  .tk-ioc{font-family:var(--mono);font-size:11px;display:inline-block;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;vertical-align:middle}
  .tk-intel-foot{display:flex;align-items:center;gap:8px;padding:10px 16px;border-top:1px solid var(--line-2);font-size:11.5px;color:var(--text-3);flex-wrap:wrap}
  @media (max-width:1180px){.tk-intel-hd{grid-template-columns:repeat(2,minmax(0,1fr))}.tk-ioc{max-width:120px}}
  `;

  const STATUS = ['全部', '运行中', '排队中', '已完成', '已终止'];
  const STATUS_COLOR = { 运行中: PAL.brand, 排队中: PAL.warn, 已完成: PAL.ok, 已终止: PAL.danger };

  const EV = {
    thought: { t: '思考', c: '#5B6474', bg: '#EEF1F6' },
    action: { t: '动作', c: '#1F42C4', bg: '#EDF1FE' },
    observation: { t: '观测', c: '#0B7C8C', bg: '#E6F6F9' },
    observe: { t: '观测', c: '#0B7C8C', bg: '#E6F6F9' },
    verdict: { t: '判定', c: '#6B47E8', bg: '#F1EDFE' },
    risk: { t: '风险', c: '#B42F2B', bg: '#FDECEC' }
  };
  const LVL = {
    info: { t: '信息', c: 'var(--text-2)', bg: '#F0F3F9' },
    warn: { t: '关注', c: 'var(--warn)', bg: 'var(--warn-bg)' },
    risk: { t: '风险', c: 'var(--danger)', bg: 'var(--danger-bg)' }
  };
  const LABEL = {
    pass: { t: '通过', cls: 'pass' },
    leaked: { t: '已泄露', cls: 'leaked' },
    harmful: { t: '有害内容', cls: 'harmful' },
    blocked: { t: '已拦截', cls: 'blocked' },
    refused: { t: '模型拒答', cls: 'refused' }
  };

  /* ------------------------------------------------------------------ 工具 */
  const msg = (e) => {
    const s = (e && e.message) || String(e || '未知错误');
    return s === 'server error' ? '服务内部错误，请稍后重试' : s;
  };
  const num = (v) => (v === null || v === undefined || v === '' ? '—' : Number(v).toLocaleString('en-US'));
  const money = (v) => { const n = Number(v) || 0; return '¥' + n.toFixed(n > 0 && n < 0.01 ? 4 : 2); };
  const pct = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.round(n * 10) / 10 : 0;
  };
  const asrNote = (v) => (Number(v) > 100
    ? '接口原始值 ' + v + '，超过 100%，请核对后端口径（前端不再自动 ÷100）'
    : '攻击成功率');
  const hms = (s) => (s ? String(s).slice(11, 19) : '—');
  const toMs = (s) => (s ? new Date(String(s).replace(' ', 'T')).getTime() : 0);
  const dur = (a, b) => {
    const t0 = toMs(a);
    if (!t0) return '—';
    const t1 = b ? toMs(b) : Date.now();
    const sec = Math.max(0, Math.round((t1 - t0) / 1000));
    if (sec < 60) return sec + ' 秒';
    const m = Math.round(sec / 60000);
    if (m < 60) return m + ' 分钟';
    const h = Math.floor(m / 60);
    if (h < 24) return h + ' 时' + (m % 60 ? ' ' + (m % 60) + ' 分' : '');
    return Math.floor(h / 24) + ' 天 ' + (h % 24) + ' 时';
  };
  const clip = (s, n) => {
    if (s === null || s === undefined || s === '') return '—';
    const str = typeof s === 'string' ? s : JSON.stringify(s);
    const one = str.replace(/\s+/g, ' ');
    return one.length > n ? one.slice(0, n) + '…' : one;
  };
  const evMeta = (type) => EV[type] || { t: type || '事件', c: 'var(--text-2)', bg: '#F0F3F9' };
  const lvlMeta = (level) => LVL[level] || LVL.info;
  const asrTone = (v) => {
    const p = pct(v);
    return p >= 50 ? 'var(--danger)' : p >= 25 ? 'var(--warn)' : 'var(--text)';
  };
  const asrCell = (v) => `<b class="num" style="font-weight:600;color:${asrTone(v)}" title="${esc(asrNote(v))}">${pct(v)}%</b>`;

  function ensureStyle() {
    let el = document.getElementById('pg-tasks');
    if (!el) {
      el = document.createElement('style');
      el.id = 'pg-tasks';
      document.head.appendChild(el);
    }
    el.textContent = STYLE;
  }

  /* -------------------------------------------------------------- 页面数据 */
  let S = { root: null, items: [], stat: {}, reflow: [], cases: [], agents: [], models: [], envs: [] };
  let DR = null;
  let PAGE_TIMER = null;

  async function fetchAll() {
    const [tk, rf, cs] = await Promise.all([
      API.get('/api/tasks'),
      API.get('/api/reflow').catch(() => ({ items: [] })),
      API.get('/api/cases').catch(() => ({ items: [] }))
    ]);
    return {
      items: tk.items || [],
      stat: tk.stat || {},
      reflow: rf.items || [],
      cases: cs.items || []
    };
  }

  /* ------------------------------------------------------------------ KPI */
  function kpis() {
    const items = S.items;
    const total = items.length;
    const run = items.filter((t) => t.status === '运行中').length;
    const queued = items.filter((t) => t.status === '排队中').length;
    const done = items.filter((t) => t.status === '已完成').length;
    const samples = items.reduce((s, t) => s + (Number(t.samples) || 0), 0);
    const turns = items.reduce((s, t) => s + (Number(t.turns) || 0), 0);
    const executed = items.filter((t) => ['已完成', '运行中', '已终止'].indexOf(t.status) >= 0 && Number(t.samples) > 0);
    const mean = executed.length
      ? executed.reduce((s, t) => s + pct(t.asr), 0) / executed.length
      : 0;
    const high = items.reduce((s, t) => s + (Number(t.high) || 0), 0);
    const mid = items.reduce((s, t) => s + (Number(t.mid) || 0), 0);
    const low = items.reduce((s, t) => s + (Number(t.low) || 0), 0);
    return `<div class="grid g-4">
      ${UI.kpi({ label: '任务总数', value: total, unit: '个', meta: `运行中 ${run} · 排队中 ${queued} · 已完成 ${done}` })}
      ${UI.kpi({ label: '累计样本', value: num(samples), unit: '条', meta: `覆盖 ${total} 个任务 · ${num(turns)} 轮交互` })}
      ${UI.kpi({ label: '平均攻击成功率', value: mean.toFixed(1), unit: '%',
        meta: `按 ${executed.length} 个已执行任务归一化计算` })}
      ${UI.kpi({ label: '高危样本', value: num(high), unit: '项',
        meta: `中危 ${mid} 项 · 低危 ${low} 项` })}
    </div>`;
  }

  /* -------------------------------------------------------------- 任务表格 */
  function rowHTML(t) {
    const st = t.status;
    const prog = Number(t.progress) || 0;
    return `<tr class="clickable" data-id="${t.id}" tabindex="0" role="button" aria-label="查看任务 ${esc(t.name)}">
      <td>
        <div class="t-main">${esc(t.name)}</div>
        <div class="t-sub"><span class="mono">${esc(t.no)}</span> · ${esc(t.agent)} · ${esc(t.model)}</div>
      </td>
      <td>${UI.pill(st)}
        ${st === '运行中' || st === '排队中'
          ? `<div class="tiny dim" style="margin-top:4px">进度 ${prog}%</div>`
          : `<div class="tiny dim" style="margin-top:4px">${esc(t.level || '')}</div>`}</td>
      <td><span class="chip">${esc(t.mode || '—')}</span></td>
      <td class="num" style="text-align:right">${num(t.samples)}</td>
      <td class="num" style="text-align:right">${num(t.turns)}</td>
      <td style="text-align:right">${asrCell(t.asr)}</td>
      <td class="num" style="text-align:right" title="Token 原始值 ${num(t.tokens)}">${esc(t.tokensText || num(t.tokens))}</td>
      <td class="dim" style="white-space:nowrap;font-size:11.5px">${esc(dur(t.created, t.finished))}</td>
      <td><span class="risk-mini h">${num(t.high)}</span><span class="risk-mini m">${num(t.mid)}</span><span class="risk-mini l">${num(t.low)}</span></td>
      <td class="dim" style="font-size:11.5px;white-space:nowrap" title="${esc(t.created)}">${UI.ago(t.created)}</td>
    </tr>`;
  }

  function taskCard(list) {
    const body = `
      <div class="tbl-toolbar">
        ${UI.seg(STATUS.map((s) => ({ v: s, t: s })), currentFilter)}
        <div class="searchbox sm">${icon('search', 13)}<input id="q" placeholder="搜索名称 / 编号 / 智能体 / 模型" value="${esc(currentQuery)}"></div>
        <span class="dim" style="font-size:11.5px;margin-left:auto">显示 ${list.length} / ${S.items.length} 条</span>
      </div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr>
        <th>任务</th><th style="width:92px">状态</th><th style="width:74px">模式</th>
        <th style="width:66px" class="num">样本</th><th style="width:60px" class="num">轮次</th>
        <th style="width:78px" class="num">ASR</th><th style="width:90px" class="num">Token</th>
        <th style="width:104px">耗时</th><th style="width:104px">风险 高/中/低</th><th style="width:92px">创建</th>
      </tr></thead>
      <tbody>${list.length ? list.map(rowHTML).join('')
        : `<tr><td colspan="10">${UI.empty('暂无符合条件的任务', '调整状态筛选，或先完成模型/靶场/样本/智能体配置', '<button class="btn primary sm" data-setup-open style="margin-top:10px">打开配置向导</button>')}</td></tr>`}</tbody></table></div>
      <div style="padding:10px 16px;font-size:11px;color:var(--text-3);display:flex;gap:16px;flex-wrap:wrap">
        <span>● 列表每 5 秒自动刷新</span><span>点击任意行打开抽屉：攻击链 / 多轮会话 / 三维评分 / 事件回放 / 工具调用 / 报告</span>
        <span style="margin-left:auto">共 ${list.length} 条 · 全量 ${S.items.length} 条</span>
      </div>`;
    return UI.card({
      title: '攻击任务',
      sub: `共 ${S.items.length} 个任务 · 运行中 ${S.items.filter((t) => t.status === '运行中').length} 个 · 数据取自任务库与事件流`,
      flush: true,
      body
    });
  }

  /* -------------------------------------------------------------- 经验总结 */
  function reflowCard() {
    const rows = S.reflow;
    const pending = rows.filter((r) => r.status === '待回流').length;
    const table = rows.length ? `<table class="tbl"><thead><tr>
        <th>任务</th><th style="width:92px">类型</th><th style="width:132px">完成时间</th>
        <th style="width:74px" class="num">交互</th><th style="width:62px" class="num">样本</th>
        <th style="width:66px" class="num">ASR</th><th style="width:146px">报告</th>
        <th style="width:78px">状态</th><th style="width:94px">操作</th>
      </tr></thead><tbody>${rows.map((r) => `<tr>
        <td><div class="t-main">${esc(r.name)}</div>
          <div class="t-sub mono">任务 #${r.task_id}</div></td>
        <td class="pg-nw"><span class="chip">${esc(r.task_type)}</span></td>
        <td class="dim" style="font-size:11.5px;white-space:nowrap">${esc(r.finished || '—')}</td>
        <td class="num" style="text-align:right">${num(r.turns)}</td>
        <td class="num" style="text-align:right">${num(r.samples)}</td>
        <td style="text-align:right">${asrCell(r.asr)}</td>
        <td class="mono" style="font-size:10.5px;color:var(--text-2);white-space:nowrap">${esc(r.report_id || '—')}</td>
        <td>${UI.pill(r.status)}</td>
        <td>${r.status === '待回流'
          ? `<button class="btn sm" data-reflow="${r.id}">接受回流</button>`
          : '<span class="dim" style="font-size:11px">已入库</span>'}</td>
      </tr>`).join('')}</tbody></table>`
      : UI.empty('暂无回流记录', '任务完成后自动进入回流池');
    return UI.card({
      title: '经验总结',
      sub: `任务完成后样本、事件与报告进入回流池 · 待回流 ${pending} 条`,
      right: `<span class="dim" style="font-size:11.5px">共 ${rows.length} 条</span>`,
      flush: true,
      body: table
    });
  }

  /* ---------------------------------------------------------------- 案例库 */
  function caseCard() {
    const rows = S.cases;
    const body = rows.length ? `<table class="tbl"><thead><tr>
        <th>案例</th><th style="width:168px">来源</th><th style="width:64px">行业</th>
        <th style="width:58px">等级</th><th style="width:112px">场景</th>
        <th style="width:132px">保真度</th><th style="width:70px" class="num">使用</th>
        <th style="width:92px">操作</th>
      </tr></thead><tbody>${rows.map((c) => `<tr>
        <td><div class="t-main">${esc(c.name)}</div>
          <div class="t-sub">${esc(clip(c.script, 42))}</div></td>
        <td class="dim" style="font-size:11.5px">${esc(c.source || '—')}</td>
        <td style="font-size:11.5px">${esc(c.industry || '—')}</td>
        <td>${UI.pill(c.level)}</td>
        <td class="pg-nw"><span class="chip">${esc(c.scenario || '—')}</span></td>
        <td>
          <div class="row" style="gap:7px">
            <div class="bar" style="width:64px"><i style="width:${Math.round((Number(c.fidelity) || 0) * 100)}%"></i></div>
            <span class="num" style="font-size:11.5px;font-weight:600">${(Number(c.fidelity) || 0).toFixed(2)}</span>
          </div>
        </td>
        <td class="num" style="text-align:right">${num(c.uses)}</td>
        <td><button class="btn sm" data-case="${c.id}">复现</button></td>
      </tr>`).join('')}</tbody></table>`
      : UI.empty('案例库为空', '点击「录入案例」保存已验证的攻击样例');
    return UI.card({
      title: '案例库',
      sub: '已保存的攻击样例，复现会生成新的攻击任务并增加使用次数',
      right: `<button class="btn sm" data-act="case-new">${icon('plus', 13)}录入案例</button>`,
      flush: true,
      body
    });
  }

  /* -------------------------------------------------------------- 威胁情报 */
  let IN = { root: null, page: 1, size: 20, q: '', sev: '', total: 0, pages: 1, items: [], stats: null,
    loading: false, err: '', busy: false, timer: null };
  const SEV_TONE = { '严重': 'danger', '高': 'danger', '中': 'warn', '低': 'gray' };
  const N = (v) => esc(num(v));

  const kvRow = (k, v) => `<div class="pg-meta"><span>${esc(k)}</span><b>${v}</b></div>`;
  function intelLoading() {
    return `<div style="padding:18px 16px">
      <div class="skel" style="height:12px;width:46%;margin-bottom:11px"></div>
      <div class="skel" style="height:12px;width:82%;margin-bottom:11px"></div>
      <div class="skel" style="height:12px;width:68%"></div>
    </div>`;
  }

  function intelStatsHTML() {
    const s = IN.stats || {};
    const srcN = Array.isArray(s.bySource) ? s.bySource.length : 0;
    const indN = Array.isArray(s.byIndustry) ? s.byIndustry.length : 0;
    const rate = s.conversionRate == null ? '—' : Number(s.conversionRate).toFixed(1) + '%';
    return `<div class="tk-intel-hd">
      <div class="tk-i-stat"><span>情报总数</span><b>${N(s.total)}<small>条</small></b></div>
      <div class="tk-i-stat"><span>已转用例</span><b>${N(s.converted)}<small>条</small></b><em>转化率 ${esc(rate)}</em></div>
      <div class="tk-i-stat"><span>情报来源</span><b>${N(srcN)}<small>个</small></b></div>
      <div class="tk-i-stat"><span>覆盖行业</span><b>${N(indN)}<small>个</small></b></div>
    </div>`;
  }

  function intelToolbarHTML() {
    const sevs = (IN.stats && IN.stats.bySeverity) || [];
    return `<div class="tk-intel-toolbar">
      <div class="searchbox sm">${icon('search', 13)}<input id="tk-iq" placeholder="搜索 IOC / TTP / 描述" value="${esc(IN.q)}"></div>
      <select class="select" id="tk-isev" style="width:124px" aria-label="按严重度筛选">
        <option value="">全部严重度</option>
        ${sevs.map((x) => `<option value="${esc(x.severity)}"${IN.sev === x.severity ? ' selected' : ''}>${esc(x.severity)} · ${N(x.count)}</option>`).join('')}
      </select>
      <span class="dim" style="font-size:11.5px">共 ${N(IN.total)} 条 · 每页 ${IN.size} 条 · 支持按 IOC / TTP / 描述检索</span>
      <button class="btn sm" data-intel="reload" style="margin-left:auto">${icon('refresh', 13)}刷新</button>
    </div>`;
  }

  function intelTableHTML() {
    const rows = IN.items;
    return `<div class="tbl-wrap"><table class="tbl"><thead><tr>
      <th style="width:112px">来源</th><th style="width:132px">时间</th><th style="width:78px">行业</th>
      <th>IOC 指标</th><th style="width:86px">TTP</th><th style="width:70px">严重度</th>
      <th style="width:94px">状态</th><th style="width:108px">操作</th>
    </tr></thead><tbody>${rows.length ? rows.map((it) => `<tr class="clickable" data-intel-id="${it.id}" tabindex="0" role="button">
      <td>${esc(it.source)}</td>
      <td class="dim" style="font-size:11.5px;white-space:nowrap" title="${esc(it.itime)}">${esc(String(it.itime || '').slice(0, 16))}</td>
      <td>${esc(it.industry || '通用')}</td>
      <td><span class="tk-ioc" title="${esc(it.ioc)}">${esc(it.ioc)}</span><div class="t-sub mono">${esc(it.ioc_type || '—')}</div></td>
      <td><span class="chip">${esc(it.ttp || '未标注')}</span></td>
      <td>${UI.pill(it.severity || '—', SEV_TONE[it.severity] || 'gray')}</td>
      <td>${it.converted ? UI.pill('已转用例', 'ok') : UI.pill('未转用例', 'gray')}</td>
      <td>${it.converted
        ? `<a class="btn sm" href="#/samples" data-intel-sample="${esc(it.sample_id)}">样本 #${esc(it.sample_id)}</a>`
        : `<button class="btn sm" data-intel-case="${it.id}">转为用例</button>`}</td>
    </tr>`).join('')
      : `<tr><td colspan="8">${UI.empty('暂无情报数据', '点击右上角「导入内置 200 条」载入内置情报库，或导入 CSV / JSON')}</td></tr>`}</tbody></table></div>`;
  }

  function intelFootHTML() {
    return `<div class="tk-intel-foot">
      <span>第 ${IN.page} / ${IN.pages} 页 · 每页 ${IN.size} 条 · 共 ${N(IN.total)} 条</span>
      <span style="margin-left:auto"></span>
      <button class="btn sm" data-intel-page="prev"${IN.page <= 1 ? ' disabled' : ''}>上一页</button>
      <button class="btn sm" data-intel-page="next"${IN.page >= IN.pages ? ' disabled' : ''}>下一页</button>
    </div>`;
  }

  function intelInner() {
    if (IN.err) {
      return `<div style="padding:16px">${UI.empty('威胁情报加载失败', IN.err,
        '<button class="btn sm" data-intel="reload" style="margin-top:10px">重试</button>')}</div>`;
    }
    if (!IN.stats) return intelLoading();
    return intelStatsHTML() + intelToolbarHTML() + intelTableHTML() + intelFootHTML();
  }

  function intelCard() {
    const s = IN.stats || {};
    const total = s.total == null ? 0 : s.total;
    return UI.card({
      title: '威胁情报',
      sub: `<span id="tk-intel-sub">R-3.7.1-05 · 外部情报接入与转为攻击用例 · 共 ${N(total)} 条 · 已转 ${N(s.converted)} 条</span>`,
      right: `<button class="btn sm" data-intel="seed">${icon('download', 13)}导入内置 200 条</button>
        <button class="btn sm" data-intel="import">${icon('plus', 13)}导入 CSV/JSON</button>`,
      flush: true,
      body: `<div id="tk-intel">${intelInner()}</div>`
    });
  }

  function bindIntel(root) {
    root.querySelectorAll('[data-intel]').forEach((b) => {
      b.onclick = (ev) => {
        ev.preventDefault();
        const k = b.dataset.intel;
        if (k === 'reload') loadIntel(false);
        else if (k === 'seed') intelSeed(root);
        else if (k === 'import') intelImport(root);
      };
    });
    const box = root.querySelector('#tk-intel');
    if (!box) return;
    const qi = box.querySelector('#tk-iq');
    if (qi) {
      qi.oninput = () => {
        IN.q = qi.value;
        if (IN.timer) clearTimeout(IN.timer);
        IN.timer = setTimeout(() => { IN.timer = null; loadIntel(true); }, 280);
      };
    }
    const sev = box.querySelector('#tk-isev');
    if (sev) sev.onchange = () => { IN.sev = sev.value; loadIntel(true); };
    box.querySelectorAll('[data-intel-page]').forEach((b) => {
      b.onclick = () => {
        const p = b.dataset.intelPage === 'prev' ? IN.page - 1 : IN.page + 1;
        if (p < 1 || p > IN.pages || p === IN.page) return;
        IN.page = p;
        loadIntel(false);
      };
    });
    box.querySelectorAll('[data-intel-case]').forEach((b) => {
      b.onclick = (ev) => { ev.stopPropagation(); intelToCase(Number(b.dataset.intelCase)); };
    });
    box.querySelectorAll('[data-intel-id]').forEach((tr) => {
      tr.onclick = () => intelDetail(Number(tr.dataset.intelId));
      tr.onkeydown = (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); intelDetail(Number(tr.dataset.intelId)); } };
    });
  }

  function paintIntel(root) {
    const box = root && root.querySelector('#tk-intel');
    if (!box) return;
    const ae = document.activeElement;
    const keep = ae && ae.id === 'tk-iq' && box.contains(ae) ? { s: ae.selectionStart } : null;
    box.innerHTML = intelInner();
    bindIntel(root);
    const sub = root.querySelector('#tk-intel-sub');
    if (sub && IN.stats) {
      sub.textContent = `R-3.7.1-05 · 外部情报接入与转为攻击用例 · 共 ${IN.stats.total} 条 · 已转 ${IN.stats.converted} 条`;
    }
    if (keep) {
      const q2 = box.querySelector('#tk-iq');
      if (q2) { q2.focus(); try { q2.setSelectionRange(keep.s, keep.s); } catch (e) { /* 忽略 */ } }
    }
    if (!IN.stats && !IN.loading && !IN.err) loadIntel(false);
  }

  async function loadIntel(reset) {
    const root = IN.root;
    if (!root || !root.isConnected || IN.loading) return;
    if (reset) IN.page = 1;
    IN.loading = true;
    if (!IN.stats) paintIntel(root);
    try {
      const q = { page: IN.page, pageSize: IN.size };
      if (IN.q.trim()) q.q = IN.q.trim();
      if (IN.sev) q.severity = IN.sev;
      const d = await API.get('/api/intel', q);
      if (!IN.root || !IN.root.isConnected) return;
      IN.items = d.items || [];
      IN.total = Number(d.total) || 0;
      IN.pages = Math.max(1, Number(d.pages) || Math.ceil(IN.total / IN.size) || 1);
      IN.stats = d.stats || IN.stats;
      IN.err = '';
      if (IN.page > IN.pages) { IN.page = IN.pages; IN.loading = false; return loadIntel(false); }
    } catch (e) {
      if (!IN.root || !IN.root.isConnected) return;
      IN.err = String((e && e.message) || e || '接口异常');
    }
    IN.loading = false;
    if (IN.root && IN.root.isConnected) paintIntel(IN.root);
  }

  async function intelSeed(root) {
    if (IN.busy) return;
    IN.busy = true;
    const btn = root.querySelector('[data-intel="seed"]');
    if (btn) btn.disabled = true;
    try {
      const r = await API.post('/api/intel/seed', {});
      UI.toast(r.already
        ? `内置情报已存在（${N(r.totalSeed)} 条，幂等跳过）`
        : `已导入 ${N(r.added)} 条内置情报并自动转换 ${N(r.converted)} 条用例`);
      await loadIntel(true);
    } catch (e) {
      UI.toast('导入内置情报失败：' + msg(e), 'err');
    }
    IN.busy = false;
    if (btn) btn.disabled = false;
  }

  async function intelToCase(id) {
    if (IN.busy) return;
    IN.busy = true;
    try {
      const r = await API.post('/api/intel/' + id + '/to-case', {});
      UI.toast(`情报 #${id} ${r.existed ? '已转过用例' : '已转为攻击用例'} · 样本 #${r.sampleId}（${r.lib || '威胁情报用例库'}）`);
      await loadIntel(false);
    } catch (e) {
      UI.toast('转用例失败：' + msg(e), 'err');
    }
    IN.busy = false;
  }

  function intelDetail(id) {
    const it = IN.items.filter((x) => Number(x.id) === id)[0];
    if (!it) return;
    const kv = (k, v) => `<div class="pg-meta"><span>${esc(k)}</span><b>${v}</b></div>`;
    const dr = UI.drawer({
      title: '情报 #' + esc(it.id) + ' · ' + esc(it.source || '未知来源'),
      sub: '威胁情报详情 · IOC / TTP / 行业与用例转化状态',
      width: '620px',
      body: kv('来源', esc(it.source || '—')) +
        kv('情报时间', esc(it.itime || '—')) +
        kv('行业', esc(it.industry || '通用')) +
        kv('IOC 指标', `<span class="mono">${esc(it.ioc || '—')}</span>（${esc(it.ioc_type || '—')}）`) +
        kv('ATT&CK 技战术', esc(it.ttp || '未标注')) +
        kv('严重度', UI.pill(it.severity || '—', SEV_TONE[it.severity] || 'gray')) +
        kv('状态', it.converted ? `已转用例 · 样本 #${esc(it.sample_id)}` : '未转用例') +
        `<div class="pg-lab" style="margin-top:12px">情报描述</div>
         <div class="pg-pre" style="max-height:none">${esc(it.descr || '暂无描述')}</div>`,
      footer: `<button class="btn" data-intel-close>关闭</button>
        ${it.converted ? '<a class="btn" href="#/samples">查看样本库</a>'
          : '<button class="btn primary" data-intel-conv>转为用例</button>'}`
    });
    dr.el.querySelector('[data-intel-close]').onclick = dr.close;
    const conv = dr.el.querySelector('[data-intel-conv]');
    if (conv) conv.onclick = async () => {
      conv.disabled = true;
      try {
        const r = await API.post('/api/intel/' + it.id + '/to-case', {});
        UI.toast('已转为攻击用例 · 样本 #' + r.sampleId);
        dr.close();
        await loadIntel(false);
      } catch (e) {
        UI.toast('转用例失败：' + msg(e), 'err');
        conv.disabled = false;
      }
    };
  }

  function intelImport() {
    let done = false;
    UI.modal({
      title: '导入威胁情报',
      okText: '开始导入',
      body: `<div class="pg-lab">导入格式</div>
        <select class="select" id="tk-im-fmt" style="margin-bottom:10px" aria-label="导入格式">
          <option value="json">JSON（数组 / {items:[]} / STIX bundle）</option>
          <option value="csv">CSV（首行表头）</option>
          <option value="stix">STIX 2.1（objects 数组）</option>
        </select>
        <div class="pg-lab">粘贴内容（逐条校验，失败行在结果中回显 errors[]）</div>
        <textarea class="textarea" id="tk-im-text" rows="11" spellcheck="false"
          style="font-family:var(--mono);font-size:11.5px"
          placeholder="JSON 数组 / CSV 文本 / STIX objects"></textarea>
        <div class="pg-lab" style="margin-top:8px">字段：source 来源、ioc 指标、severity 严重度（严重/高/中/低）、ttp ATT&amp;CK 编号、industry 行业、time 时间、descr 描述</div>
        <div class="pg-lab">示例行：{"source":"厂商通报","ioc":"203.0.113.9","severity":"高","ttp":"T1566","industry":"金融","time":"2026-11-01 10:00:00","descr":"钓鱼投递"}</div>
        <div id="tk-im-msg" style="margin-top:8px"></div>`,
      onOk: async (el) => {
        if (done) return true;
        const fmt = el.querySelector('#tk-im-fmt').value;
        const ta = el.querySelector('#tk-im-text');
        const msgBox = el.querySelector('#tk-im-msg');
        const text = ta ? ta.value : '';
        if (!String(text).trim()) {
          msgBox.innerHTML = '<div class="note">请先粘贴要导入的内容</div>';
          return false;
        }
        msgBox.innerHTML = '<div class="dim" style="font-size:11.5px">正在导入…</div>';
        try {
          const r = await API.post('/api/intel/import', { format: fmt, text });
          const errs = r.errors || [];
          el.querySelector('.modal-bd').innerHTML = `<div class="pg-lab">导入结果</div>
            ${kvRow('成功写入', N(r.added) + ' 条')}
            ${kvRow('失败条目', N(r.failed) + ' 条')}
            ${kvRow('解析总数', N(r.total) + ' 条')}
            ${errs.length
              ? `<div class="pg-lab" style="margin-top:10px">失败明细（逐行回显）</div>
                 <div class="pg-pre" style="max-height:220px">${errs.map((x) => '第 ' + esc(String(x.row)) + ' 行：' + esc(x.reason)).join('\n')}</div>`
              : '<div class="note" style="margin-top:10px">全部条目导入成功，已刷新情报列表。</div>'}`;
          const ok = el.querySelector('[data-ok]');
          if (ok) ok.textContent = '关闭';
          const cancel = el.querySelector('[data-cancel]');
          if (cancel) cancel.remove();
          done = true;
          UI.toast(`已导入 ${r.added} 条情报，失败 ${r.failed} 条`);
          loadIntel(true);
          return false;
        } catch (e) {
          msgBox.innerHTML = '<div class="note" style="color:var(--danger)">导入失败：' + esc(msg(e)) + '</div>';
          return false;
        }
      }
    });
  }

  /* ------------------------------------------------------------ 底部统计 */
  function statsCards() {
    const items = S.items;
    const cnt = ['运行中', '排队中', '已完成', '已终止']
      .map((k) => ({ k, v: items.filter((t) => t.status === k).length, color: STATUS_COLOR[k] }))
      .filter((x) => x.v > 0);
    const byAgent = {};
    items.forEach((t) => { byAgent[t.agent] = (byAgent[t.agent] || 0) + (Number(t.high) || 0); });
    const hb = Object.keys(byAgent).map((k) => ({ k, v: byAgent[k] })).filter((x) => x.v > 0)
      .sort((a, b) => b.v - a.v).slice(0, 6);
    const executed = items.filter((t) => ['已完成', '运行中', '已终止'].indexOf(t.status) >= 0 && Number(t.samples) > 0);
    const mean = executed.length ? executed.reduce((s, t) => s + pct(t.asr), 0) / executed.length : 0;
    return `<div class="split">
      ${UI.card({
        title: '任务状态分布',
        sub: '全量任务，不受列表筛选影响',
        body: cnt.length
          ? Charts.donut(cnt, { center: items.length, centerSub: '任务' }) +
            `<div class="note" style="margin-top:14px">运行中任务的事件流每 5 秒自动刷新；终止或重跑会生成新的任务记录。</div>`
          : UI.empty('暂无任务', '新建任务后自动统计')
      })}
      ${UI.card({
        title: '高危样本对比',
        sub: '按攻击智能体聚合高危发现数',
        body: hb.length
          ? Charts.hbars(hb, { labelW: 108, unit: ' 项' }) +
            `<div class="note" style="margin-top:14px">已执行任务平均 ASR ${mean.toFixed(1)}% · 高危 ${num(items.reduce((s, t) => s + (Number(t.high) || 0), 0))} 项 · 事件流已全部入库可回溯</div>`
          : UI.empty('暂无高危样本', '任务执行判定后自动聚合')
      })}
    </div>`;
  }

  /* -------------------------------------------------------------- 页面渲染 */
  let currentFilter = '全部';
  let currentQuery = '';

  function filtered() {
    const q = currentQuery.trim().toLowerCase();
    return S.items.filter((t) => (currentFilter === '全部' || t.status === currentFilter) &&
      (!q || (t.name + ' ' + t.no + ' ' + t.agent + ' ' + t.model + ' ' + t.mode + ' ' + (t.cur || ''))
        .toLowerCase().includes(q)));
  }

  function render(root) {
    if (!root.isConnected) return;
    const active = document.activeElement;
    const refocus = active && active.id === 'q';
    const caret = refocus ? active.selectionStart : 0;
    const main = document.querySelector('.main');
    const scroll = main ? main.scrollTop : 0;
    const list = filtered();
    root.innerHTML = `
      ${UI.pageHd({
        title: '任务中心',
        sub: '任务执行记录、多轮会话、评分与事件回放',
        actions: `<button class="btn" data-act="refresh">${icon('refresh', 14)}刷新</button>
          <button class="btn" data-act="case-new">${icon('plus', 14)}录入案例</button>
          <button class="btn primary" data-act="new">${icon('plus', 14)}新建任务</button>`
      })}
      <div class="stack">
        ${kpis()}
        ${taskCard(list)}
        ${reflowCard()}
        ${caseCard()}
        ${intelCard()}
        ${statsCards()}
      </div>`;
    if (main) main.scrollTop = scroll;

    /* 状态筛选 */
    root.querySelectorAll('[data-seg]').forEach((b) => {
      b.onclick = () => { currentFilter = b.dataset.seg; render(root); };
    });
    /* 搜索 */
    const q = root.querySelector('#q');
    if (q) {
      q.oninput = () => { currentQuery = q.value; render(root); };
      if (refocus) { q.focus(); try { q.setSelectionRange(caret, caret); } catch (e) { /* 忽略 */ } }
    }
    /* 行点击 */
    root.querySelectorAll('tr[data-id]').forEach((tr) => {
      tr.onclick = () => openTask(Number(tr.dataset.id), reload);
    });
    /* 顶部操作 */
    const refresh = root.querySelector('[data-act="refresh"]');
    if (refresh) refresh.onclick = async () => {
      refresh.disabled = true;
      try { await reload(); UI.toast('任务数据已刷新'); } catch (e) { UI.toast('刷新失败：' + msg(e), 'err'); }
      finally { refresh.disabled = false; }
    };
    root.querySelector('[data-act="new"]').onclick = () => newTaskModal(reload);
    root.querySelectorAll('[data-act="case-new"]').forEach((b) => { b.onclick = () => newCaseModal(reload); });
    /* 回流接受 */
    root.querySelectorAll('[data-reflow]').forEach((b) => {
      b.onclick = async () => {
        b.disabled = true;
        try {
          await API.post('/api/reflow/' + b.dataset.reflow + '/accept', {});
          UI.toast('已接受回流，样本与报告进入经验库');
          await reload();
        } catch (e) { UI.toast('回流失败：' + msg(e), 'err'); b.disabled = false; }
      };
    });
    /* 案例复现 */
    root.querySelectorAll('[data-case]').forEach((b) => {
      b.onclick = async () => {
        const html = b.innerHTML;
        b.disabled = true;
        b.innerHTML = '复现中…';
        try {
          const r = await API.post('/api/cases/' + b.dataset.case + '/instantiate', {});
          await reload();
          const nt = (S.items || []).filter((x) => x.id === r.task_id)[0];
          UI.toast(`已生成复现任务 ${nt ? nt.no : '#' + r.task_id} · 用时 ${r.elapsed_ms} ms`);
        } catch (e) {
          UI.toast('复现失败：' + msg(e), 'err');
          b.disabled = false;
          b.innerHTML = html;
        }
      };
    });
    /* 威胁情报区块：每次整页重绘后按已加载状态重建 */
    paintIntel(root);
  }

  async function reload() {
    const data = await fetchAll();
    S.items = data.items;
    S.stat = data.stat;
    S.reflow = data.reflow;
    S.cases = data.cases;
    const root = S.root;
    if (root && root.isConnected) render(root);
  }

  /* ============================================================ 任务抽屉 */
  function openTask(id, reloadFn) {
    if (DR) { try { DR.close(); } catch (e) { /* 忽略 */ } DR = null; }
    let t = null;
    const eventsRef = { list: [] };
    let tab = 'chain';
    let cache = { turns: null, quality: null, tools: null, report: null };
    let poll = null;
    let mo = null;
    let replayTimer = null;
    let replaying = false;
    let selIdx = -1;
    let draft = '';
    let lastStamp = '';

    const dr = UI.drawer({
      title: '加载中…',
      sub: '正在读取任务信息…',
      width: 'min(980px,94vw)',
      body: `<div class="dim" style="font-size:12px;padding:20px 0">正在读取任务详情与事件流…</div>`,
      footer: `<span class="pg-foot-note" id="pg-tk-stamp"></span>
        <button class="btn" data-act="close">关闭</button>`
    });
    DR = dr;

    const q = (sel) => dr.el.querySelector(sel);
    const stopReplay = () => {
      if (replayTimer) { clearInterval(replayTimer); replayTimer = null; }
      replaying = false;
    };
    const stopAll = () => {
      if (poll) { clearInterval(poll); poll = null; }
      stopReplay();
      if (mo) { mo.disconnect(); mo = null; }
      if (DR === dr) DR = null;
    };
    mo = new MutationObserver(() => {
      if (!dr.el.isConnected) stopAll();
    });
    mo.observe(document.body, { childList: true });

    /* 任务状态在轮询中变化时，重建页脚按钮，避免「已完成」仍显示暂停/终止 */
    function refreshFooter() {
      const f = dr.el.querySelector('.drawer-ft');
      if (!f) return;
      const running = t.status === '运行中';
      const queued = t.status === '排队中';
      f.innerHTML = `<span class="pg-foot-note" id="pg-tk-stamp"></span>
        ${running ? `<button class="btn" data-fa="pause">暂停</button>
          <button class="btn danger" data-fa="stop">${icon('stop', 14)}终止</button>` : ''}
        ${queued ? `<button class="btn primary" data-fa="resume">继续执行</button>
          <button class="btn danger" data-fa="stop">${icon('stop', 14)}终止</button>` : ''}
        <button class="btn" data-fa="rerun">${icon('refresh', 14)}重新运行</button>
        <button class="btn" data-fa="close">关闭</button>`;
      const sp = f.querySelector('#pg-tk-stamp');
      if (sp) sp.textContent = '共 ' + eventsRef.list.length + ' 条事件';
      const bind = (name, fn) => {
        const el = f.querySelector('[data-fa="' + name + '"]');
        if (!el) return;
        el.onclick = async () => {
          if (el.disabled) return;
          el.disabled = true;
          try { await fn(el); } catch (e) { UI.toast(msg(e), 'err'); el.disabled = false; }
        };
      };
      bind('close', async () => { dr.close(); });
      bind('pause', async () => {
        await API.post('/api/tasks/' + id + '/pause', {});
        UI.toast('任务已暂停，回到排队队列，可继续执行');
        dr.close(); await reloadFn();
      });
      bind('resume', async () => {
        await API.post('/api/tasks/' + id + '/resume', {});
        UI.toast('任务已继续执行');
        dr.close(); await reloadFn();
      });
      bind('rerun', async () => {
        const r = await API.post('/api/tasks/' + id + '/rerun', {});
        const nid = r.task_id || r.id;
        UI.toast(r.reused ? `已复用重跑任务 #${nid}` : `已创建重跑任务 #${nid}${r.no ? ' · ' + r.no : ''}`);
        dr.close(); await reloadFn();
      });
      bind('stop', async () => {
        UI.modal({
          title: '终止任务',
          body: `<div style="font-size:12.5px;color:var(--text-2);line-height:1.7">确认终止「${esc(t.name)}」？终止后不可继续，只能重新运行生成新任务。</div>`,
          okText: '终止任务', danger: true,
          onOk: async () => {
            try {
              await API.post('/api/tasks/' + id + '/stop', {});
              UI.toast('任务已终止');
              dr.close(); await reloadFn();
            } catch (e) { UI.toast('终止失败：' + msg(e), 'err'); return false; }
          }
        });
      });
    }

    /* ---------------------------------------------------------- 各页签内容 */
    function chainHtml() {
      const events = eventsRef.list;
      if (!events.length) {
        return UI.empty('暂无事件', '任务尚未写入事件流；运行中任务的事件会随执行自动追加');
      }
      const counts = {};
      events.forEach((e) => { counts[e.type] = (counts[e.type] || 0) + 1; });
      const chips = Object.keys(counts).map((k) => {
        const m = evMeta(k);
        return `<span class="pg-flag" style="background:${m.bg};color:${m.c}">${m.t} ${counts[k]}</span>`;
      }).join('');
      const list = events.map((e, i) => {
        const m = evMeta(e.type);
        const lv = lvlMeta(e.level);
        return `<button type="button" class="pg-ev lv-${esc(e.level || 'info')}" data-ev="${i}">
          <div class="pg-ev-hd">
            <span class="pg-ev-seq">#${e.seq}</span>
            <span class="pg-ev-t" style="color:${m.c}">${m.t}</span>
            <span class="pg-ev-a">${esc(e.actor)}</span>
            ${e.level && e.level !== 'info'
              ? `<span class="pg-flag" style="background:${lv.bg};color:${lv.c}">${lv.t}</span>` : ''}
            <span class="pg-ev-m">${esc(hms(e.ts))} · ${num(e.tokens)} token · ${money(e.cost)}</span>
          </div>
          <div class="pg-ev-b">${esc(e.content)}</div>
        </button>`;
      }).join('');
      const inject = tab === 'chain' && t.status === '运行中' ? `<div class="pg-inject">
          <div class="ih">${icon('bolt', 14)}人工介入</div>
          <div class="ir">
            <input class="input" id="pg-inj" placeholder="向执行中的智能体追加一条指令，例如「改走多语言混写路径」" value="${esc(draft)}">
            <button class="btn primary" id="pg-inj-btn">注入指令</button>
          </div>
          <div class="tip">注入内容会以「动作」事件写入攻击链（actor=人工介入 / level=关注），智能体在下一轮采纳。</div>
        </div>` : '';
      return `<div class="pg-chips">${chips}
          <span class="pg-chip">事件总数 <b>${events.length}</b></span>
          <span class="pg-chip">风险事件 <b>${events.filter((e) => e.level === 'risk').length}</b></span>
          <span class="pg-stamp">按 seq 升序 · 点击事件可在「事件回放」查看原始内容</span>
        </div>
        <div>${list}</div>${inject}`;
    }

    function bindChain() {
      dr.el.querySelectorAll('[data-ev]').forEach((el) => {
        el.onclick = () => {
          selIdx = Number(el.dataset.ev);
          setTab('replay');
        };
      });
      const btn = q('#pg-inj-btn');
      const input = q('#pg-inj');
      if (input) input.oninput = () => { draft = input.value; };
      if (btn) btn.onclick = async () => {
        const v = (input && input.value || '').trim();
        if (!v) { UI.toast('请先输入注入指令', 'err'); return; }
        btn.disabled = true;
        try {
          const r = await API.post('/api/tasks/' + id + '/inject', { msg: v });
          draft = '';
          const fresh = await API.get('/api/tasks/' + id);
          t = fresh.task;
          eventsRef.list = fresh.events || [];
          paint();
          UI.toast('指令已注入，事件 seq #' + (r.seq || ''));
        } catch (e) {
          UI.toast('注入失败：' + msg(e), 'err');
          btn.disabled = false;
        }
      };
    }

    function turnsHtml(turns) {
      if (!turns.length) {
        return UI.empty('暂无多轮会话', '多轮模式任务执行后，逐轮 Prompt / Response 与判定标签会写入会话表；该任务暂无记录');
      }
      const rounds = [];
      const map = {};
      turns.forEach((x) => {
        if (!map[x.round]) { map[x.round] = []; rounds.push(x.round); }
        map[x.round].push(x);
      });
      const fail = turns.filter((x) => x.leak === 1 || x.label === 'leaked')[0] || null;
      const failIdx = fail ? turns.indexOf(fail) + 1 : 0;
      const counts = {};
      turns.forEach((x) => { counts[x.label] = (counts[x.label] || 0) + 1; });
      const encoded = turns.filter((x) => x.encoded === '是').length;
      const tokens = turns.reduce((s, x) => s + (Number(x.tokens) || 0), 0);
      const leaked = turns.filter((x) => x.leak === 1).length;
      const labelChips = ['pass', 'leaked', 'harmful', 'blocked', 'refused']
        .filter((k) => counts[k])
        .map((k) => `<span class="pg-badge ${LABEL[k].cls}">${LABEL[k].t} ${counts[k]}</span>`).join('');
      const groups = rounds.map((r) => {
        const arr = map[r];
        const rTokens = arr.reduce((s, x) => s + (Number(x.tokens) || 0), 0);
        return `<div class="pg-round"><b>第 ${r} 轮</b>
            <span class="dim" style="font-size:11px">${arr.length} 条交互 · ${num(rTokens)} token</span>
            <span class="pg-stamp">${esc(hms(arr[0].created))} 起</span></div>
          ${arr.map((x) => {
            const lb = LABEL[x.label] || { t: esc(x.label || '未知'), cls: 'pass' };
            return `<div class="pg-turn ${lb.cls}">
              <div class="pg-turn-hd">
                <span class="pg-badge ${lb.cls}">${lb.t}</span>
                ${x.encoded === '是' ? '<span class="pg-flag" style="background:var(--violet-bg);color:var(--violet)">编码样本</span>' : ''}
                ${Number(x.blocked) === 1 && x.label !== 'blocked' ? '<span class="pg-flag" style="background:var(--brand-050);color:var(--brand-600)">已拦截</span>' : ''}
                ${Number(x.leak) === 1 && x.label !== 'leaked' ? '<span class="pg-flag" style="background:var(--danger-bg);color:var(--danger)">失守</span>' : ''}
                <span class="pg-turn-no">#${x.id} · ${num(x.tokens)} token · ${esc(hms(x.created))}</span>
              </div>
              <div class="pg-lab">攻击 Prompt</div>
              <div class="pg-pre sm">${esc(x.prompt || '（空）')}</div>
              <div class="pg-lab">模型 Response</div>
              <div class="pg-pre sm">${esc(x.response || '（空响应）')}</div>
            </div>`;
          }).join('')}`;
      }).join('');
      return `<div class="grid g-4" style="gap:10px;margin-bottom:12px">
          <div class="mini-stat"><span>交互总数</span><b>${turns.length}</b></div>
          <div class="mini-stat"><span>轮次数</span><b>${rounds.length}</b></div>
          <div class="mini-stat"><span>首次失守轮次</span>
            <b style="color:${fail ? 'var(--danger)' : 'var(--ok)'}">${fail ? '第 ' + fail.round + ' 轮' : '未失守'}</b></div>
          <div class="mini-stat"><span>失守条数</span>
            <b>${leaked} <small class="dim" style="font-size:10.5px;font-weight:400">/ ${turns.length} 条</small></b></div>
        </div>
        <div class="pg-chips">${labelChips}
          <span class="pg-chip">Token 合计 <b>${num(tokens)}</b></span>
          <span class="pg-chip">编码样本 <b>${encoded}</b></span>
          ${fail ? `<span class="pg-chip">首次失守位置 <b>第 ${failIdx} 条</b></span>` : ''}
        </div>
        ${groups}`;
    }

    function qualityHtml(x) {
      const ring = (label2, val, desc) => {
        const n = Number(val) || 0;
        const color = n >= 80 ? Charts.pal.ok : n >= 60 ? Charts.pal.warn : Charts.pal.danger;
        return `<div class="pg-q-c">
          ${Charts.gauge(n.toFixed(1), { size: 118, color })}
          <div class="t">${label2}</div>
          <div class="d">${desc}</div>
        </div>`;
      };
      return `<div class="pg-q">
          ${ring('保真度', x.fidelity || 0, '攻击样本对真实业务场景的还原程度')}
          ${ring('推理过程', x.reasoning || 0, '攻击链推理步骤的完整性与可解释性')}
          ${ring('决策质量', x.decision || 0, '判定结论与风险分级的一致性')}
        </div>
        <div class="note" style="margin-top:14px"><b>评分说明</b><br>${esc(x.note || '暂无评分说明')}</div>
        <div class="dim" style="font-size:11px;margin-top:10px">评分写入任务质量表 · ${esc(x.created || '—')} · 三项均为百分制，越高表示质量越好</div>`;
    }

    function toolsHtml(d) {
      const items = d.items || [];
      const allowed = items.filter((x) => Number(x.allowed) === 1).length;
      const tampered = items.filter((x) => Number(x.tampered) === 1).length;
      const rows = items.length ? items.map((x) => `<tr>
          <td class="mono" style="font-size:11px;white-space:nowrap">${esc(x.tool || '—')}</td>
          <td style="font-size:11px" title="${esc(typeof x.args === 'string' ? x.args : JSON.stringify(x.args || ''))}">${esc(clip(x.args, 52))}</td>
          <td>${Number(x.allowed) === 1 ? UI.pill('允许', 'ok') : UI.pill('拒绝', 'danger')}</td>
          <td class="dim" style="font-size:11px">${esc(clip(x.reason, 30))}</td>
          <td style="font-size:11px" title="${esc(typeof x.output === 'string' ? x.output : JSON.stringify(x.output || ''))}">${esc(clip(x.output, 42))}</td>
          <td class="mono" style="font-size:10px;color:var(--text-3)" title="${esc(x.hash || '')}">${esc(String(x.hash || '—').slice(0, 14))}</td>
          <td>${Number(x.tampered) === 1 ? UI.pill('已篡改', 'danger') : UI.pill('一致', 'gray')}</td>
        </tr>`).join('')
        : `<tr><td colspan="7">${UI.empty('暂无工具调用', '该任务未登记工具调用记录；执行器显式登记后会在此展示')}</td></tr>`;
      return `<div class="grid g-4" style="gap:10px;margin-bottom:12px">
          <div class="mini-stat"><span>调用次数</span><b>${items.length}</b></div>
          <div class="mini-stat"><span>允许调用</span><b style="color:var(--ok)">${allowed}</b></div>
          <div class="mini-stat"><span>策略拒绝</span><b style="color:var(--danger)">${items.length - allowed}</b></div>
          <div class="mini-stat"><span>Hash 不一致</span><b style="color:${tampered ? 'var(--danger)' : 'var(--text)'}">${tampered}</b></div>
        </div>
        <div class="tbl-wrap"><table class="tbl pg-tools"><thead><tr>
          <th style="width:116px">工具</th><th style="width:170px">参数</th><th style="width:60px">允许</th>
          <th style="width:120px">原因</th><th style="width:170px">输出摘要</th>
          <th style="width:110px">Hash</th><th style="width:70px">篡改</th>
        </tr></thead><tbody>${rows}</tbody></table></div>
        <div class="note" style="margin-top:10px">工具调用来自执行器的显式登记：allowed=否 表示被策略拦截，tampered=是 表示输出 hash 与登记值不一致。</div>`;
    }

    function reportHtml(r) {
      const s = r.summary || {};
      return `<div class="grid g-4" style="gap:10px">
          <div class="mini-stat"><span>样本数</span><b>${num(s.samples)}</b></div>
          <div class="mini-stat"><span>攻击成功率</span>
            <b style="color:${asrTone(s.asr)}">${pct(s.asr)}%</b></div>
          <div class="mini-stat"><span>高危 / 中危 / 低危</span><b>${num(s.high)} / ${num(s.mid)} / ${num(s.low)}</b></div>
          <div class="mini-stat"><span>Token / 费用</span><b>${num(s.tokens)} · ${money(s.cost)}</b></div>
        </div>
        <div class="pg-chips" style="margin-top:12px">
          <span class="pg-chip">报告编号 <b class="mono">${esc(r.reportId || '—')}</b></span>
          <span class="pg-chip">状态 <b>${esc(t.status)}</b></span>
          <span class="pg-chip">覆盖事件 <b>${(r.events || []).length}</b></span>
          <span class="pg-chip">任务轮次 <b>${num(t.turns)}</b></span>
        </div>
        <div class="note" style="margin-top:12px;line-height:1.8"><b>评估结论</b><br>${esc(r.conclusion || '暂无结论')}</div>
        <div style="margin-top:14px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span class="dim" style="font-size:11.5px">导出报告：</span>
          <button class="btn sm" data-dl="pdf">${icon('download', 13)}PDF 报告</button>
          <button class="btn sm" data-dl="docx">${icon('download', 13)}Word 文档</button>
          <button class="btn sm" data-dl="csv">${icon('download', 13)}CSV 明细</button>
        </div>
        <div class="note" style="margin-top:12px">报告包含任务基本信息、攻击链事件流、多轮会话与三维评分、工具调用审计、风险分级统计与整改建议。导出接口先生成文件，再通过下载地址获取。</div>`;
    }

    /* ------------------------------------------------------------ 回放 */
    function detailHtml(e) {
      const m = evMeta(e.type);
      const lv = lvlMeta(e.level);
      return `<div class="pg-detail">
        <div class="row between" style="margin-bottom:8px">
          <span class="pg-ev-t" style="color:${m.c}">${m.t} · ${esc(e.actor)}</span>
          <span class="dim" style="font-size:10.5px">seq #${e.seq}</span>
        </div>
        <div class="pg-meta"><span>事件类型</span><b>${m.t}（${esc(e.type)}）</b></div>
        <div class="pg-meta"><span>执行主体</span><b>${esc(e.actor)}</b></div>
        <div class="pg-meta"><span>发生时间</span><b>${esc(e.ts)}</b></div>
        <div class="pg-meta"><span>风险等级</span><b style="color:${lv.c}">${lv.t}</b></div>
        <div class="pg-meta"><span>Token / 费用</span><b>${num(e.tokens)} token · ${money(e.cost)}</b></div>
        <div class="pg-lab">原始内容 content</div>
        <div class="pg-pre lg ${e.level === 'risk' ? 'risk' : ''}">${esc(e.content || '（空）')}</div>
      </div>`;
    }

    function replayHtml() {
      const events = eventsRef.list;
      if (!events.length) return UI.empty('暂无事件', '任务尚未写入事件流');
      const rows = events.map((e, i) => {
        const m = evMeta(e.type);
        return `<button type="button" class="pg-rp-item${i === selIdx ? ' on' : ''}" data-rp="${i}">
          <span class="s">#${e.seq}</span>
          <span class="t" style="color:${m.c}">${m.t}</span>
          <span class="x">${esc(clip(e.content, 60))}</span>
          <span class="m">${esc(hms(e.ts))}</span>
        </button>`;
      }).join('');
      return `<div class="pg-rp-bar">
          <button class="btn primary sm" data-play>${icon('play', 13)}${replaying ? '暂停' : '回放'}</button>
          <button class="btn sm" data-rstop>停止</button>
          <span class="dim" style="font-size:11px" id="pg-rp-pos">${selIdx >= 0 ? selIdx + 1 + ' / ' + events.length + ' 条' : '共 ' + events.length + ' 条'}</span>
          <span class="pg-stamp">按 seq 顺序每 1 秒高亮一条</span>
        </div>
        <div class="pg-rp">
          <div class="pg-rp-list">${rows}</div>
          <div id="pg-rp-detail">${selIdx >= 0 ? detailHtml(events[selIdx]) : '<div class="dim" style="font-size:12px;padding:20px 4px">选择左侧事件查看原始内容、actor、token 与风险等级</div>'}</div>
        </div>`;
    }

    function updateReplayUI() {
      const events = eventsRef.list;
      if (tab !== 'replay') return;
      dr.el.querySelectorAll('[data-rp]').forEach((el, i) => {
        el.classList.toggle('on', i === selIdx);
        if (i === selIdx) el.scrollIntoView({ block: 'nearest' });
      });
      const box = q('#pg-rp-detail');
      if (box) box.innerHTML = selIdx >= 0 && events[selIdx] ? detailHtml(events[selIdx])
        : '<div class="dim" style="font-size:12px;padding:20px 4px">选择左侧事件查看原始内容、actor、token 与风险等级</div>';
      const pos = q('#pg-rp-pos');
      if (pos) pos.textContent = selIdx >= 0 ? (selIdx + 1) + ' / ' + events.length + ' 条' : '共 ' + events.length + ' 条';
      const play = q('[data-play]');
      if (play) play.innerHTML = icon('play', 13) + (replaying ? '暂停' : '回放');
    }

    function bindReplay() {
      const play = q('[data-play]');
      const stop = q('[data-rstop]');
      dr.el.querySelectorAll('[data-rp]').forEach((el) => {
        el.onclick = () => {
          selIdx = Number(el.dataset.rp);
          stopReplay();
          updateReplayUI();
        };
      });
      if (play) play.onclick = () => {
        if (replaying) { stopReplay(); updateReplayUI(); return; }
        const events = eventsRef.list;
        if (!events.length) return;
        if (selIdx >= events.length - 1) selIdx = -1;
        replaying = true;
        stepReplay();
        replayTimer = setInterval(stepReplay, 1000);
        updateReplayUI();
      };
      if (stop) stop.onclick = () => { stopReplay(); updateReplayUI(); };
    }

    function stepReplay() {
      const events = eventsRef.list;
      if (!events.length) { stopReplay(); return; }
      if (selIdx >= events.length - 1) { stopReplay(); updateReplayUI(); return; }
      selIdx += 1;
      updateReplayUI();
    }

    /* ------------------------------------------------------------ 页签渲染 */
    function paint() {
      const pane = q('#pg-tk-pane');
      if (!pane) return;
      if (tab !== 'replay') stopReplay();
      if (tab === 'chain') {
        const ae = document.activeElement;
        const inInject = ae && ae.id === 'pg-inj';
        const caret = inInject ? ae.selectionStart : 0;
        pane.innerHTML = chainHtml();
        bindChain();
        if (inInject) {
          const el = q('#pg-inj');
          if (el) { el.focus(); try { el.setSelectionRange(caret, caret); } catch (e) { /* 忽略 */ } }
        }
        q('#pg-tk-stamp').textContent = (t.status === '运行中' ? '运行中 · 事件每 5 秒自动刷新 · ' : '') +
          '共 ' + eventsRef.list.length + ' 条事件';
        return;
      }
      if (tab === 'turns') {
        q('#pg-tk-stamp').textContent = '多轮会话 · 逐轮 Prompt / Response 与判定标签';
        if (cache.turns) { pane.innerHTML = turnsHtml(cache.turns); return; }
        pane.innerHTML = '<div class="dim" style="font-size:12px;padding:20px 0">正在加载多轮会话…</div>';
        API.get('/api/tasks/' + id + '/turns').then((d) => {
          cache.turns = d.items || [];
          if (tab === 'turns') pane.innerHTML = turnsHtml(cache.turns);
        }).catch((e) => {
          if (tab === 'turns') pane.innerHTML = UI.empty('多轮会话加载失败', msg(e));
        });
        return;
      }
      if (tab === 'quality') {
        q('#pg-tk-stamp').textContent = '三维评分 · 保真度 / 推理过程 / 决策质量';
        if (cache.quality) { pane.innerHTML = qualityHtml(cache.quality); return; }
        pane.innerHTML = '<div class="dim" style="font-size:12px;padding:20px 0">正在计算三维评分…</div>';
        API.get('/api/tasks/' + id + '/quality').then((d) => {
          cache.quality = d;
          if (tab === 'quality') pane.innerHTML = qualityHtml(d);
        }).catch((e) => {
          if (tab === 'quality') pane.innerHTML = UI.empty('三维评分加载失败', msg(e));
        });
        return;
      }
      if (tab === 'replay') {
        q('#pg-tk-stamp').textContent = '事件回放 · 点击事件或按 seq 逐条播放';
        pane.innerHTML = replayHtml();
        bindReplay();
        return;
      }
      if (tab === 'tools') {
        q('#pg-tk-stamp').textContent = '工具调用 · 参数 / 策略 / hash 校验';
        if (cache.tools) { pane.innerHTML = toolsHtml(cache.tools); return; }
        pane.innerHTML = '<div class="dim" style="font-size:12px;padding:20px 0">正在加载工具调用…</div>';
        API.get('/api/tasks/' + id + '/tools').then((d) => {
          cache.tools = d;
          if (tab === 'tools') pane.innerHTML = toolsHtml(d);
        }).catch((e) => {
          if (tab === 'tools') pane.innerHTML = UI.empty('工具调用加载失败', msg(e));
        });
        return;
      }
      if (tab === 'report') {
        q('#pg-tk-stamp').textContent = '任务报告 · 结论 / 统计 / PDF · Word · CSV';
        if (cache.report) { pane.innerHTML = reportHtml(cache.report); bindDownloads(); return; }
        pane.innerHTML = '<div class="dim" style="font-size:12px;padding:20px 0">正在生成任务报告…</div>';
        API.get('/api/tasks/' + id + '/report').then((r) => {
          cache.report = r;
          if (tab === 'report') { pane.innerHTML = reportHtml(r); bindDownloads(); }
        }).catch((e) => {
          if (tab === 'report') pane.innerHTML = UI.empty('报告加载失败', msg(e));
        });
      }
    }

    function bindDownloads() {
      dr.el.querySelectorAll('[data-dl]').forEach((b) => {
        b.onclick = async () => {
          const fmt = b.dataset.dl;
          const html = b.innerHTML;
          b.disabled = true;
          b.innerHTML = '生成中…';
          try {
            const r = await API.get('/api/tasks/' + id + '/export?fmt=' + fmt);
            const a = document.createElement('a');
            a.href = UI.safeHref(r.url);
            a.download = r.file || '';
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            a.remove();
            UI.toast(fmt.toUpperCase() + ' 已生成 · ' + (typeof r.size === 'number' ? (r.size / 1024).toFixed(1) + ' KB' : (r.size || '—')));
          } catch (e) {
            UI.toast('导出失败：' + msg(e), 'err');
          } finally {
            b.disabled = false;
            b.innerHTML = html;
          }
        };
      });
    }

    function setTab(name) {
      tab = name;
      dr.el.querySelectorAll('[data-tab]').forEach((b) => b.classList.toggle('on', b.dataset.tab === name));
      paint();
    }

    /* ------------------------------------------------------------ 抽屉初始化 */
    API.get('/api/tasks/' + id).then((d) => {
      t = d.task || {};
      eventsRef.list = d.events || [];
      const myAgent = d.agent || {};
      dr.el.querySelector('.drawer-hd > div > div').textContent = t.name || ('任务 #' + id);
      const sub = dr.el.querySelector('.drawer-hd > div > div:nth-child(2)');
      if (sub) sub.textContent = [t.no, t.agent, t.model, t.env, t.level].filter(Boolean).join(' · ');
      lastStamp = t.created || '';

      const footer = dr.el.querySelector('.drawer-ft');
      const running = t.status === '运行中';
      const queued = t.status === '排队中';
      footer.innerHTML = `<span class="pg-foot-note" id="pg-tk-stamp"></span>
        ${running ? `<button class="btn" data-act="pause">暂停</button>
          <button class="btn danger" data-act="stop">${icon('stop', 14)}终止</button>` : ''}
        ${queued ? `<button class="btn primary" data-act="resume">继续执行</button>
          <button class="btn danger" data-act="stop">${icon('stop', 14)}终止</button>` : ''}
        <button class="btn" data-act="rerun">${icon('refresh', 14)}重新运行</button>
        <button class="btn" data-act="close">关闭</button>`;

      const header = `<div class="pg-chips">
          ${UI.pill(t.status)}
          <span class="pg-chip">模式 <b>${esc(t.mode || '—')}</b></span>
          <span class="pg-chip">样本 <b>${num(t.samples)}</b></span>
          <span class="pg-chip">轮次 <b>${num(t.turns)}</b></span>
          <span class="pg-chip" title="${esc(asrNote(t.asr))}">ASR <b style="color:${asrTone(t.asr)}">${pct(t.asr)}%</b></span>
          <span class="pg-chip">Token <b>${esc(t.tokensText || num(t.tokens))}</b></span>
          <span class="pg-chip">费用 <b>${money(t.cost)}</b></span>
          <span class="pg-chip">高危 <b style="color:var(--danger)">${num(t.high)}</b></span>
          <span class="pg-chip">耗时 <b>${esc(dur(t.created, t.finished))}</b></span>
        </div>
        <div class="pg-tabs">
          <button data-tab="chain" class="on">攻击链路<span class="n">${eventsRef.list.length}</span></button>
          <button data-tab="turns">多轮会话</button>
          <button data-tab="quality">三维评分</button>
          <button data-tab="replay">事件回放</button>
          <button data-tab="tools">工具调用</button>
          <button data-tab="report">任务报告</button>
        </div>
        <div id="pg-tk-pane"></div>
        ${(t.cur || t.status === '已完成') ? `<div class="note" style="margin-top:14px"><b>当前进展</b> · ${esc(t.status === '已完成' ? '任务已完成' : t.cur)}</div>` : ''}`;
      dr.body.innerHTML = header;

      dr.el.querySelectorAll('[data-tab]').forEach((b) => {
        b.onclick = () => setTab(b.dataset.tab);
      });
      dr.el.querySelector('[data-act="close"]').onclick = () => dr.close();

      const bindAct = (name, fn) => {
        const el = dr.el.querySelector('[data-act="' + name + '"]');
        if (!el) return;
        el.onclick = async () => {
          if (el.disabled) return;
          el.disabled = true;
          try { await fn(el); } catch (e) { UI.toast(msg(e), 'err'); el.disabled = false; }
        };
      };

      bindAct('pause', async () => {
        await API.post('/api/tasks/' + id + '/pause', {});
        UI.toast('任务已暂停，回到排队队列，可继续执行');
        dr.close();
        await reloadFn();
      });
      bindAct('resume', async () => {
        await API.post('/api/tasks/' + id + '/resume', {});
        UI.toast('任务已继续执行');
        dr.close();
        await reloadFn();
      });
      bindAct('rerun', async () => {
        const r = await API.post('/api/tasks/' + id + '/rerun', {});
        const nid = r.task_id || r.id;
        UI.toast(r.reused ? `已复用重跑任务 #${nid}` : `已创建重跑任务 #${nid}${r.no ? ' · ' + r.no : ''}`);
        dr.close();
        await reloadFn();
      });
      bindAct('stop', async () => {
        UI.modal({
          title: '终止任务',
          body: `<div style="font-size:12.5px;color:var(--text-2);line-height:1.7">确认终止「${esc(t.name)}」？终止后不可继续，只能重新运行生成新任务。</div>`,
          okText: '终止任务',
          danger: true,
          onOk: async () => {
            try {
              await API.post('/api/tasks/' + id + '/stop', {});
              UI.toast('任务已终止');
              dr.close();
              await reloadFn();
            } catch (e) {
              UI.toast('终止失败：' + msg(e), 'err');
              return false;
            }
          }
        });
      });

      paint();

      if (t.status === '运行中' || t.status === '排队中') {
        poll = setInterval(async () => {
          if (!dr.el.isConnected) { stopAll(); return; }
          if (t.status !== '运行中' && t.status !== '排队中') return;
          try {
            const fresh = await API.get('/api/tasks/' + id);
            const list = fresh.events || [];
            const prev = eventsRef.list;
            const changed = list.length !== prev.length ||
              JSON.stringify(list[list.length - 1] || {}) !== JSON.stringify(prev[prev.length - 1] || {});
            const stChanged = !!(fresh.task && fresh.task.status !== t.status);
            if (changed || stChanged) {
              if (fresh.task) t = fresh.task;
              eventsRef.list = list;
              if (tab === 'chain') paint();
              const n = dr.el.querySelector('.pg-tabs .n');
              if (n) n.textContent = list.length;
              const stamp = q('#pg-tk-stamp');
              if (stamp && tab === 'chain') stamp.textContent = '运行中 · 事件每 5 秒自动刷新 · 共 ' + list.length + ' 条事件';
            }
            if (stChanged) {
              const pill = dr.el.querySelector('.pg-chips > .pill');
              if (pill) pill.outerHTML = UI.pill(t.status);
              if (t.status !== '运行中' && t.status !== '排队中') {
                if (poll) { clearInterval(poll); poll = null; }
                refreshFooter();
                UI.toast('任务状态已更新为「' + t.status + '」');
              } else {
                refreshFooter();
                const stamp2 = q('#pg-tk-stamp');
                if (stamp2 && tab === 'chain') stamp2.textContent = '运行中 · 事件每 5 秒自动刷新 · 共 ' + eventsRef.list.length + ' 条事件';
              }
            }
          } catch (e) { /* 轮询静默重试 */ }
        }, 5000);
      }
    }).catch((e) => {
      dr.body.innerHTML = UI.empty('任务详情加载失败', msg(e));
      UI.toast('任务详情加载失败：' + msg(e), 'err');
    });
  }

  /* ============================================================ 新建任务 */
  function newTaskModal(reloadFn) {
    const ags = S.agents || [];
    const models = (S.models || []).slice().sort((a, b) => {
      const sa = (a.kind === 'chat' ? 2 : 0) + (a.category === '模型接口' ? 1 : 0) + (a.status === '停用' ? 0 : 1);
      const sb = (b.kind === 'chat' ? 2 : 0) + (b.category === '模型接口' ? 1 : 0) + (b.status === '停用' ? 0 : 1);
      return sb - sa;
    });
    const es = S.envs || [];
    UI.modal({
      title: '新建攻击任务',
      body: `<div class="form">
        <label>任务名称<input class="input" id="f-name" value="自定义攻击任务" placeholder="例如：金融行业越狱专项"></label>
        <label>攻击智能体<select class="select" id="f-agent">${ags.map((a) => `<option value="${a.id}">${esc(a.name)}（${esc(a.scenario || '')}）</option>`).join('')}</select></label>
        <label>被测模型<select class="select" id="f-model">${models.map((m) => `<option value="${m.id}">${esc(m.name)} · ${esc(m.category || '模型接口')}${m.status === '停用' ? '（停用）' : ''}</option>`).join('') || '<option value="">暂无可用模型</option>'}</select></label>
        <label>测试环境<select class="select" id="f-env">${es.map((x) => `<option value="${x.id}">${esc(x.name)} · ${esc(x.level || '')}</option>`).join('')}</select></label>
        <div class="row" style="gap:10px">
          <label style="flex:1">样本条数<input class="input" id="f-samples" type="number" min="1" max="500" value="60"></label>
          <label style="flex:1">执行模式<select class="select" id="f-mode"><option value="自动">自动</option><option value="多轮">多轮</option></select></label>
        </div>
        <div class="note">任务在隔离靶场中执行，攻击事件按 seq 写入事件流；运行中可暂停、注入指令或终止。</div>
      </div>`,
      okText: '创建并执行',
      onOk: async (el) => {
        const sampleEl = el.querySelector('#f-samples');
        const samples = Math.max(1, Math.min(500, Number(sampleEl.value) || 60));
        try {
          const r = await API.post('/api/tasks', {
            name: el.querySelector('#f-name').value.trim() || '自定义攻击任务',
            agent_id: Number(el.querySelector('#f-agent').value) || 1,
            model_id: Number(el.querySelector('#f-model').value) || 1,
            env_id: Number(el.querySelector('#f-env').value) || 1,
            samples,
            mode: el.querySelector('#f-mode').value
          });
          UI.toast('任务已创建：' + (r.no || '#' + r.id));
          await reloadFn();
        } catch (e) {
          UI.toast('创建失败：' + msg(e), 'err');
          return false;
        }
      }
    });
  }

  /* ============================================================ 录入案例 */
  function newCaseModal(reloadFn) {
    UI.modal({
      title: '录入案例',
      body: `<div class="form">
        <label>案例名称<input class="input" id="c-name" placeholder="例如：客服系统 SystemPrompt 泄露"></label>
        <label>来源<input class="input" id="c-source" placeholder="例如：公开漏洞披露（2025-03）"></label>
        <div class="row" style="gap:10px">
          <label style="flex:1">行业<input class="input" id="c-industry" placeholder="例如：电信"></label>
          <label style="flex:1">等级<select class="select" id="c-level"><option value="高">高</option><option value="中">中</option><option value="低">低</option></select></label>
        </div>
        <div class="row" style="gap:10px">
          <label style="flex:1">场景<input class="input" id="c-scenario" placeholder="例如：数据安全攻击"></label>
          <label style="flex:1">保真度<input class="input" id="c-fidelity" type="number" min="0.5" max="1" step="0.01" value="0.85"></label>
        </div>
        <label>攻击脚本<textarea class="textarea" id="c-script" rows="4" placeholder="描述复现步骤与载荷要点"></textarea></label>
        <div class="note">案例保存到案例库，可在列表中复现，生成新的攻击任务。</div>
      </div>`,
      okText: '保存案例',
      onOk: async (el) => {
        const name = el.querySelector('#c-name').value.trim();
        if (!name) { UI.toast('请填写案例名称', 'err'); return false; }
        const fidelity = Math.max(0.5, Math.min(1, Number(el.querySelector('#c-fidelity').value) || 0.85));
        try {
          await API.post('/api/cases', {
            name,
            source: el.querySelector('#c-source').value.trim(),
            industry: el.querySelector('#c-industry').value.trim(),
            level: el.querySelector('#c-level').value,
            scenario: el.querySelector('#c-scenario').value.trim(),
            script: el.querySelector('#c-script').value.trim(),
            fidelity
          });
          UI.toast('案例已录入');
          await reloadFn();
        } catch (e) {
          UI.toast('录入失败：' + msg(e), 'err');
          return false;
        }
      }
    });
  }

  /* ================================================================ 挂载 */
  w.Pages = w.Pages || {};
  w.Pages.tasks = {
    async mount(root) {
      ensureStyle();
      DR = null;
      S.root = root;
      IN = { root: root, page: 1, size: 20, q: '', sev: '', total: 0, pages: 1, items: [], stats: null,
        loading: false, err: '', busy: false, timer: null };
      currentFilter = '全部';
      currentQuery = '';
      const data = await fetchAll();
      if (!root.isConnected) return () => {};
      S = { root: root, items: data.items, stat: data.stat, reflow: data.reflow, cases: data.cases, agents: [], models: [], envs: [] };
      const extras = await Promise.all([
        API.get('/api/agents').catch(() => ({ items: [] })),
        API.get('/api/models').catch(() => ({ items: [] })),
        API.get('/api/envs').catch(() => ({ items: [] }))
      ]);
      if (!root.isConnected) return () => {};
      S.agents = extras[0].items || [];
      S.models = extras[1].items || [];
      S.envs = extras[2].items || [];

      render(root);

      if (PAGE_TIMER) clearInterval(PAGE_TIMER);
      PAGE_TIMER = setInterval(async () => {
        if (!root.isConnected) { clearInterval(PAGE_TIMER); PAGE_TIMER = null; return; }
        if (DR) return;
        const ae = document.activeElement;
        if (ae && root.contains(ae)) return;
        if (String(window.getSelection ? window.getSelection() : '').trim()) return;
        try {
          const fresh = await fetchAll();
          const changed = JSON.stringify(fresh.items) !== JSON.stringify(S.items) ||
            JSON.stringify(fresh.reflow) !== JSON.stringify(S.reflow) ||
            JSON.stringify(fresh.cases) !== JSON.stringify(S.cases);
          if (changed) {
            S.items = fresh.items;
            S.stat = fresh.stat;
            S.reflow = fresh.reflow;
            S.cases = fresh.cases;
            render(root);
          }
        } catch (e) { /* 轮询静默重试 */ }
      }, 5000);

      return () => {
        if (PAGE_TIMER) { clearInterval(PAGE_TIMER); PAGE_TIMER = null; }
        if (IN.timer) { clearTimeout(IN.timer); IN.timer = null; }
        if (IN.root === root) IN.root = null;
        if (DR) { DR.close(); DR = null; }
        if (S.root === root) S.root = null;
      };
    }
  };
})(window);
