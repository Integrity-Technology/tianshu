/* ============================================================================
   攻防总览（深色视图）
   ========================================================================== */
(function (w) {
  const { UI, API, Charts } = w;
  const C = Charts.pal;

  const STYLE = `
  .hero{display:grid;grid-template-columns:236px 1fr;gap:0;padding:0;overflow:hidden}
  .hero-l{padding:22px 24px;display:flex;flex-direction:column;gap:8px;border-right:1px solid rgba(255,255,255,.07);
    background:radial-gradient(120% 120% at 0% 0%,rgba(44,85,230,.22),transparent 60%)}
  .hero-l .t{font-size:11.5px;letter-spacing:.16em;color:#8FA0BE;font-weight:600}
  .hero-l .ring{margin:2px 0 0 -6px}
  .hero-l .rate{font-size:12px;color:#B9C4D6;display:flex;align-items:center;gap:6px}
  .hero-l .rank{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:6px;
    background:rgba(78,119,255,.18);color:#8FB0FF;font-size:11.5px;font-weight:700;border:1px solid rgba(78,119,255,.3)}
  .hero-l .sub{font-size:11px;color:#7E8AA0;margin-top:auto}
  .hero-stats{display:grid;grid-template-columns:repeat(4,1fr)}
  .hero-stats .hs{padding:20px 18px;border-right:1px solid rgba(255,255,255,.06);display:flex;flex-direction:column;gap:6px}
  .hero-stats .hs:last-child{border-right:0}
  .mon-grid{display:grid;grid-template-columns:repeat(4,1fr)}
  .mon-cell{padding:14px 16px;border-right:1px solid rgba(255,255,255,.06)}
  .mon-cell:last-child{border-right:0}
  .mon-cell .l{font-size:11px;color:#8FA0BE;letter-spacing:.06em}
  .mon-cell .v{font-size:23px;font-weight:680;color:#EEF2F9;margin:4px 0 2px;font-variant-numeric:tabular-nums}
  .mon-cell .v small{font-size:11.5px;color:#8FA0BE;font-weight:500;margin-left:3px}
  .mon-cell .s{margin-top:6px}
  .al-row{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.06)}
  .al-row:last-child{border-bottom:0}
  .al-lv{flex:0 0 30px;height:19px;border-radius:5px;font-size:10.5px;font-weight:700;display:flex;align-items:center;justify-content:center}
  .al-lv.p0{background:rgba(217,59,59,.18);color:#FF8A8A}
  .al-lv.p1{background:rgba(201,124,16,.18);color:#F0B45C}
  .al-lv.p2{background:rgba(78,119,255,.16);color:#93AFFF}
  .al-lv.p3{background:rgba(255,255,255,.08);color:#9AA7BE}
  .al-t{flex:1;min-width:0}
  .al-t b{display:block;font-size:12px;color:#DDE4F0;font-weight:560;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .al-t span{font-size:10.5px;color:#7E8AA0}
  .bud{margin-bottom:14px}
  .bud-hd{display:flex;align-items:baseline;gap:8px;margin-bottom:7px}
  .bud-hd b{font-size:19px;font-weight:680;color:#EEF2F9;font-variant-numeric:tabular-nums}
  .bud-hd span{font-size:11px;color:#8FA0BE}
  .bud-bar{height:7px;border-radius:4px;background:rgba(255,255,255,.08);overflow:hidden}
  .bud-bar i{display:block;height:100%;border-radius:4px;background:linear-gradient(90deg,#4E77FF,#7C9CFF)}
  .hs .k{font-size:11.5px;color:#8FA0BE}
  .hs .v{font-size:25px;font-weight:660;letter-spacing:-.035em;color:#fff;line-height:1.05}
  .hs .v small{font-size:11.5px;font-weight:500;color:#8FA0BE;margin-left:3px;letter-spacing:0}
  .hs .m{font-size:10.5px;color:#6B7689;display:flex;align-items:center;gap:5px}
  .up{color:#35D6A4}.down{color:#FF6B6B}
  .live-head{display:flex;align-items:center;gap:8px}
  .beat{width:6px;height:6px;border-radius:50%;background:#35D6A4;box-shadow:0 0 0 0 rgba(53,214,164,.7);animation:beat 1.8s infinite}
  @keyframes beat{70%{box-shadow:0 0 0 7px rgba(53,214,164,0)}100%{box-shadow:0 0 0 0 rgba(53,214,164,0)}}
  .tlist{max-height:336px;overflow:auto;padding:2px 14px 10px;font-family:inherit;scrollbar-width:thin}
  .split>.card:has(.tlist){display:flex;flex-direction:column;height:552px}
  .split>.card:has(.tlist)>.card-bd{flex:1;min-height:0;display:flex}
  .split>.card:has(.tlist) .tlist{flex:1;min-height:0;max-height:none}
  .ev{display:flex;gap:11px;padding:11px 2px;position:relative}
  .ev+.ev{border-top:1px solid rgba(255,255,255,.055)}
  .ev:hover{background:rgba(255,255,255,.018)}
  .ev-rail{display:flex;flex-direction:column;align-items:center;flex:0 0 24px;padding-top:1px}
  .ev-ic{width:24px;height:24px;border-radius:8px;display:grid;place-items:center;
    border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:#8E9AB2}
  .ev-ic.th{color:#A99CFF;background:rgba(124,102,255,.13);border-color:rgba(124,102,255,.28)}
  .ev-ic.ac{color:#5BD3F0;background:rgba(50,180,220,.12);border-color:rgba(50,180,220,.26)}
  .ev-ic.ob{color:#E8BE72;background:rgba(220,170,70,.12);border-color:rgba(220,170,70,.26)}
  .ev-ic.vd{color:#5FE0B0;background:rgba(45,190,140,.12);border-color:rgba(45,190,140,.26)}
  .ev-ic.rk{color:#FF8E8E;background:rgba(220,80,80,.13);border-color:rgba(220,80,80,.3)}
  .ev-body{flex:1;min-width:0}
  .ev-top{display:flex;align-items:center;gap:8px;min-width:0}
  .ev-badge{font-size:10px;font-weight:650;line-height:1.7;padding:0 7px;border-radius:5px;white-space:nowrap;
    border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.05);color:#9AA6BC}
  .ev-badge.th{color:#BDB3FF;border-color:rgba(124,102,255,.3);background:rgba(124,102,255,.1)}
  .ev-badge.ac{color:#7FE2FA;border-color:rgba(50,180,220,.28);background:rgba(50,180,220,.09)}
  .ev-badge.ob{color:#F3CD8A;border-color:rgba(220,170,70,.28);background:rgba(220,170,70,.09)}
  .ev-badge.vd{color:#7FEBC2;border-color:rgba(45,190,140,.28);background:rgba(45,190,140,.09)}
  .ev-badge.rk{color:#FFA3A3;border-color:rgba(220,80,80,.3);background:rgba(220,80,80,.1)}
  .ev-actor{font-size:11.5px;font-weight:560;color:#C9D2E1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .ev-time{margin-left:auto;font-family:var(--mono);font-size:10.5px;color:#6B7689;white-space:nowrap;flex:0 0 auto}
  .ev-text{font-size:12px;line-height:1.62;color:#B9C4D6;margin-top:4px;word-break:break-word}
  .ev-meta{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px}
  .ev-chip{display:inline-flex;align-items:center;gap:3px;font-size:10px;line-height:1.5;padding:1px 6px;
    border-radius:4px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.04);color:#7F8CA3;
    font-variant-numeric:tabular-nums}
  .ev-chip.mono{font-family:var(--mono)}
  .ev-chip.ok{color:#5FE0B0;border-color:rgba(45,190,140,.22);background:rgba(45,190,140,.08)}
  .ev-chip.warn{color:#F3C376;border-color:rgba(220,170,70,.22);background:rgba(220,170,70,.08)}
  .ev-chip.danger{color:#FF9A9A;border-color:rgba(220,80,80,.24);background:rgba(220,80,80,.09)}
  .ev-chip.brand{color:#93AEFF;border-color:rgba(78,119,255,.24);background:rgba(78,119,255,.1)}
  .prog{display:flex;align-items:center;gap:8px}
  .prog .bar{flex:1}
  `;

  const fin = (v, fb) => {
    const x = Number(v);
    return Number.isFinite(x) ? x : (fb == null ? 0 : fb);
  };
  const clampPct = (v) => Math.max(0, Math.min(100, fin(v)));
  function tokenParts(v) {
    if (v == null || v === '') return { value: '—', unit: '' };
    if (typeof v === 'number' && Number.isFinite(v)) return { value: UI.num(v), unit: 'Token' };
    const str = String(v).trim();
    const m = str.match(/^(-?[\d,.]+)\s*(万|亿|千)?\s*(?:Token)?$/i);
    if (m) {
      const val = Number(m[1].replace(/,/g, ''));
      if (Number.isFinite(val)) return { value: UI.num(val), unit: (m[2] || '') + (m[2] ? ' ' : '') + 'Token' };
    }
    const val = Number(str.replace(/,/g, ''));
    return Number.isFinite(val) ? { value: UI.num(val), unit: 'Token' } : { value: UI.esc(str), unit: '' };
  }
  function gradeOf(score) {
    const x = Number(score);
    if (!Number.isFinite(x)) return { rank: '—', text: '评级待生成' };
    if (x >= 90) return { rank: 'A', text: 'A 级 · ≥ 90 分' };
    if (x >= 80) return { rank: 'B', text: 'B 级 · 80–89 分' };
    if (x >= 70) return { rank: 'C', text: 'C 级 · 70–79 分' };
    return { rank: 'D', text: 'D 级 · < 70 分' };
  }
  function todayTasks(tasks) {
    const d = new Date(), p = (x) => String(x).padStart(2, '0');
    const prefix = d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
    return (tasks || []).filter((t) => String(t.created || '').slice(0, 10) === prefix).length;
  }

  function heroHTML(kpi, tasks) {
    kpi = kpi || {};
    const score = Number(kpi.score);
    const gate = Number.isFinite(score)
      ? Charts.gauge(Math.round(score), { size: 112, dark: true, color: '#4E77FF' })
      : `<div class="tiny" style="color:#7E8AA0;padding:42px 0 38px">暂无评分</div>`;
    const grade = gradeOf(score);
    const tk = tokenParts(kpi.tokens);
    const budgetPct = Number.isFinite(Number(kpi.costPct)) ? UI.num(Math.round(Number(kpi.costPct))) : '—';
    const cells = [
      { k: '今日攻击任务', v: UI.num(todayTasks(tasks)), u: '个', m: `<span class="dim">累计 ${UI.num(kpi.tasks || 0)} 个任务</span>` },
      { k: '运行中任务', v: UI.num(kpi.running || 0), u: '个', m: '<span class="up">●</span> 实时执行中' },
      { k: '高危风险发现', v: UI.num(kpi.high || 0), u: '项', m: '<span class="dim">来自任务与评估汇总</span>' },
      { k: 'Token 消耗', v: tk.value, u: tk.unit, m: `月度预算已用 ${budgetPct}%` }
    ];
    return `<section class="card hero">
      <div class="hero-l">
        <div class="t">综合安全得分</div>
        <div class="ring">${gate}</div>
        <div class="rate"><span class="rank">${grade.rank}</span>${grade.text}</div>
        <div class="sub">对标 TC260 评估框架</div>
      </div>
      <div class="hero-stats">
        ${cells.map((c) => `<div class="hs"><div class="k">${c.k}</div>
          <div class="v">${c.v}<small>${c.u}</small></div><div class="m">${c.m}</div></div>`).join('')}
      </div>
    </section>`;
  }

  function monitorHTML(inf) {
    if (!inf) return '';
    const l = inf.live || {};
    const sr = inf.series || {};
    const cells = [
      { k: '并发会话', v: l.concurrency, u: '个', series: sr.concurrency || [] },
      { k: '平均时延', v: l.latency, u: 'ms', series: sr.latency || [] },
      { k: 'TPS', v: l.tps, u: 'req/s', series: sr.tps || [] },
      { k: 'QPS', v: l.qps, u: '次/s', series: sr.qps || [] }
    ];
    return `<section class="card" style="padding:0">
      <div class="row between" style="padding:12px 18px;border-bottom:1px solid rgba(255,255,255,.06)">
        <div><span style="font-size:12.5px;font-weight:600;color:#DDE4F0">实时监控</span>
          <span style="font-size:11px;color:#7E8AA0;margin-left:8px">并发 / 时延 / TPS-QPS · 5 秒采样 · 阈值告警</span></div>
        <span class="pill ok"><i class="dot"></i>采集正常</span>
      </div>
      <div class="mon-grid">${cells.map((c) => `<div class="mon-cell">
        <div class="l">${c.k}</div>
        <div class="v">${UI.num(c.v)}<small>${c.u}</small></div>
        <div class="s">${Charts.spark((c.series || []).map((v) => ({ v })), { color: '#4E77FF', h: 30 })}</div>
      </div>`).join('')}</div>
    </section>`;
  }

  function alertsCard(inf) {
    const list = (inf && inf.alerts) || [];
    const active = list.filter((a) => a.status !== '已确认');
    return UI.card({
      title: '告警中心', sub: '按 P0–P3 分级',
      right: `<span class="pill ${active.length ? 'danger' : 'ok'}"><i class="dot"></i>${active.length} 条待确认</span>`,
      flush: true,
      body: list.length ? `<div style="padding:4px 16px">${list.slice(0, 5).map((a) => `<div class="al-row">
          <span class="al-lv ${esc(String(a.level).toLowerCase())}">${UI.esc(a.level)}</span>
          <div class="al-t"><b>${UI.esc(a.name)}</b><span>${UI.esc(a.msg)} · ${UI.esc(a.target)}</span></div>
          ${a.status === '已确认' ? '<span class="dim" style="font-size:11px">已确认</span>'
            : `<button class="btn sm" data-ack="${esc(a.id)}">确认</button>`}
        </div>`).join('')}</div>` : `<div style="padding:8px 16px">${UI.empty('暂无告警', '告警中心运行正常')}</div>`
    });
  }

  function costCard(page) {
    if (page.costError) {
      return UI.card({
        title: 'Token 费用', sub: '按部门、项目与任务归集，可设月度预算与熔断',
        body: UI.empty('费用数据加载失败', '错误：' + page.costError,
          '<button class="btn primary" data-cost-retry>重试</button>')
      });
    }
    const c = page.cost || { items: [], dims: [] };
    const dim = page.costDim || 'dept';
    const items = c.items || [];
    if (!items.length && !fin(c.used)) {
      return UI.card({ title: 'Token 费用', sub: '按部门、项目与任务归集', body: UI.empty('暂无成本数据', '接口产生调用后自动汇总') });
    }
    const bars = Charts.hbars(items.map((x) => ({ k: x.name, v: x.cost, color: '#4E77FF' })),
      { labelW: 96, valW: 92, unit: ' 元', gap: 11, fmt: UI.money });
    const pct = clampPct(c.pct);
    return UI.card({
      title: 'Token 费用', sub: '按部门、项目与任务归集，可设月度预算与熔断',
      right: `<div class="seg" style="transform:scale(.92)">${(c.dims || []).map((x) =>
        `<button data-dim="${esc(x.k)}" class="${dim === x.k ? 'on' : ''}">${esc(x.t)}</button>`).join('')}</div>`,
      body: `<div class="bud">
          <div class="bud-hd"><b>${UI.money(c.used || 0)}</b><span>/ ${UI.money(c.budget || 0)} · 月度预算已用 ${pct}%</span></div>
          <div class="bud-bar"><i style="width:${pct}%"></i></div>
        </div>${bars}
        <div class="note" style="margin-top:12px">金额单位统一为元；大额按「金额 / 10000」折算为万元显示。熔断阈值 85%：达到后暂停新任务并告警。</div>`
    });
  }

  function Pg() {
    const d = this.data || {};
    const defense = this.defense || { items: [] };
    const allTrend = (d.trend || []).filter((x) => Number.isFinite(Number(x.asr)));
    const range = this.range || '14d';
    const rangeMap = { '1d': { n: 1, label: '今日' }, '7d': { n: 7, label: '近 7 天' }, '14d': { n: 14, label: '近 14 天' } };
    const cfg = rangeMap[range] || rangeMap['14d'];
    const t = allTrend.slice(-cfg.n);
    const area = Charts.area(t.map((x) => ({ v: Number(x.asr), k: x.d })), {
      dark: true, h: 268, color: '#4E77FF', labels: t.map((x) => x.d), unit: '%'
    });
    const mean = t.length ? (t.reduce((s, x) => s + fin(x.asr), 0) / t.length).toFixed(1) : '0.0';
    const weekTasks = t.slice(-7).reduce((s, x) => s + fin(x.tasks), 0);
    const cats = (d.riskDist || []).filter((c) => Number.isFinite(Number(c.c))).slice(0, 6).map((c, i) => ({
      k: c.category, v: Number(c.c), color: [C.brand, C.violet, C.warn, C.danger, C.cyan, '#5B6B8C'][i]
    }));
    const donut = Charts.donut(cats, { dark: true, size: 150, thickness: 12, center: cats.reduce((s, x) => s + x.v, 0), centerSub: '风险项' });

    const modelRows = (d.models || []).map((m) => `<tr>
      <td><div style="font-weight:560">${UI.esc(m.name)}</div><div style="font-size:10.5px;color:var(--text-3)">${UI.esc(m.vendor)}</div></td>
      <td><div class="prog"><div class="bar"><i style="width:${clampPct(m.success_rate)}%"></i></div>
        <span class="num" style="font-size:11px;width:38px;text-align:right">${UI.num(m.success_rate)}%</span></div></td>
      <td class="num">${UI.num(m.latency)}<span style="color:var(--text-3);font-size:10px">ms</span></td>
      <td>${UI.pill(m.status)}</td></tr>`).join('');
    const modelRow = modelRows || `<tr><td colspan="4">${UI.empty('暂无模型健康数据', '接入模型接口后自动探测')}</td></tr>`;

    const taskRows = (this.tasks || []).slice(0, 5).map((x) => `<tr data-id="${esc(x.id)}" class="clickable" tabindex="0" role="button">
      <td><div style="font-weight:560">${UI.esc(x.name)}</div><div style="font-size:10.5px;color:var(--text-3)">${UI.esc(x.no)}</div></td>
      <td style="font-size:11.5px;color:var(--text-2)">${UI.esc(x.agent)}</td>
      <td><div class="prog"><div class="bar ${x.status === '已终止' ? 'danger' : ''}"><i style="width:${clampPct(x.progress)}%"></i></div>
        <span class="num" style="font-size:11px;width:32px;text-align:right">${UI.num(x.progress)}%</span></div></td>
      <td>${UI.pill(x.status)}</td></tr>`).join('');
    const tasks = taskRows || `<tr><td colspan="4">${UI.empty('暂无任务', '新建攻击任务后展示执行进度')}</td></tr>`;

    const pluginRows = (defense.items || []).map((p) => `<div class="row between" style="padding:9px 0;border-bottom:1px solid var(--line-2)">
      <div><div style="font-size:12px;font-weight:550">${UI.esc(p.name)}</div>
        <div style="font-size:10.5px;color:var(--text-3)">${p.side === '输入' ? '输入侧' : '输出侧'} · ${UI.esc(p.version)} · ${UI.esc(p.vendor)}</div></div>
      <div style="text-align:right"><div class="num" style="font-size:12px">${UI.num(p.hits)}</div>
        <div style="font-size:10px;color:var(--text-3)">命中 ${UI.num(p.latency)}ms</div></div></div>`).join('');
    const plugins = pluginRows || UI.empty('暂无防护插件', '接入插件后展示在线状态');

    return `<div class="cockpit">
      ${UI.pageHd({
        title: '攻防总览',
        sub: `今日攻击与风险 · 数据每 6 秒刷新`,
        actions: `${UI.seg([{ v: '1d', t: '今日' }, { v: '7d', t: '近 7 天' }, { v: '14d', t: '近 14 天' }], range)}
          <button class="btn" data-refresh>${w.icon('refresh', 14)}刷新</button>`
      })}
      <div class="stack">
        ${heroHTML(d.kpi, this.tasks)}
        ${monitorHTML(this.infra)}
        <div class="split" style="grid-template-columns:1.55fr 1fr">
          ${UI.card({
            title: '攻击成功率趋势', sub: 'ASR · ' + cfg.label,
            right: `<span class="pill brand"><i class="dot"></i>均值 ${esc(mean)}%</span>
              <span class="pill gray">${cfg.label} ${UI.num(weekTasks)} 个任务</span>`,
            body: area
          })}
          ${UI.card({
            title: '风险分布', sub: '按 TC260 风险分类',
            right: `<a class="link" href="#/evals" style="font-size:11.5px;white-space:nowrap;display:inline-flex;align-items:center;gap:3px">查看全部 ${w.icon('arrow', 12)}</a>`,
            body: donut
          })}
        </div>
        <div class="split" style="grid-template-columns:1.2fr 1fr">
          ${UI.card({
            title: `<span class="live-head"><i class="beat"></i>攻击事件流</span>`,
            sub: '思考 · 动作 · 观测 · 判定',
            right: `<span class="pill gray">${(this.live || []).length} 条</span>`,
            flush: true,
            body: `<div class="tlist" id="live">${(this.live || []).map(liveRow).join('') || UI.empty('暂无实时事件', '任务运行后展示事件流')}</div>`
          })}
          ${UI.card({
            title: '模型接口健康', sub: '被测模型与攻击侧模型的探测结果',
            right: `<a class="link" href="#/models" style="font-size:11.5px;white-space:nowrap;display:inline-flex;align-items:center;gap:3px">网关 ${w.icon('arrow', 12)}</a>`,
            flush: true,
            body: `<table class="tbl"><thead><tr><th>模型</th><th style="width:38%">成功率</th><th style="width:64px">时延</th><th style="width:78px">状态</th></tr></thead>
              <tbody>${modelRow}</tbody></table>`
          })}
        </div>
        <div class="split" style="grid-template-columns:1.3fr 1fr">
          ${costCard(this)}
          ${alertsCard(this.infra)}
        </div>
        <div class="split" style="grid-template-columns:1.35fr 1fr">
          ${UI.card({
            title: '任务进度', sub: '按状态显示执行进度',
            right: `<a class="link" href="#/tasks" style="font-size:11.5px;white-space:nowrap;display:inline-flex;align-items:center;gap:3px">全部任务 ${w.icon('arrow', 12)}</a>`,
            flush: true,
            body: `<table class="tbl"><thead><tr><th>任务</th><th style="width:22%">攻击智能体</th><th style="width:26%">进度</th><th style="width:82px">状态</th></tr></thead>
              <tbody>${tasks}</tbody></table>`
          })}
          ${UI.card({
            title: '防护插件在线率', sub: '输入侧与输出侧拦截',
            right: `<span class="pill ok"><i class="dot"></i>${(defense.items || []).length} 个在线</span>`,
            body: `<div style="max-height:250px;overflow:auto">${plugins}</div>`
          })}
        </div>
      </div>
    </div>`;
  }

  function dedupe(list) {
    const seen = new Set();
    return (list || []).filter((e) => {
      const k = e.type + '|' + e.content;
      if (seen.has(k)) return false;
      seen.add(k); return true;
    });
  }

  const EVT = { thought: ['思考', 'th', 'bolt'], plan: ['规划', 'th', 'grid'], action: ['动作', 'ac', 'play'],
    observe: ['观测', 'ob', 'search'], observation: ['观测', 'ob', 'search'],
    verdict: ['判定', 'vd', 'check'], judge: ['判定', 'vd', 'check'], risk: ['风险', 'rk', 'shield'] };
  function evChips(e, text) {
    const chips = [];
    if (e.task_no) chips.push(`<span class="ev-chip mono" title="${esc(e.task_name || '')}">${esc(e.task_no)}</span>`);
    const m = text.match(/\((\d+)ms,\s*([\d,]+)\s*tok(?:,\s*推理\s*([\d,]+))?\)/);
    if (m) {
      chips.push(`<span class="ev-chip mono">${esc(m[1])} ms</span>`);
      chips.push(`<span class="ev-chip mono">${esc(m[2])} tok</span>`);
      if (m[3]) chips.push(`<span class="ev-chip mono">推理 ${esc(m[3])}</span>`);
    } else if (e.tokens) {
      chips.push(`<span class="ev-chip mono">${UI.num(e.tokens)} tok</span>`);
    }
    if (/\brefused\b|拒答|已拦截|拦截成功/.test(text)) chips.push('<span class="ev-chip ok">已拦截</span>');
    else if (/命中|泄露成功|越权成功/.test(text)) chips.push('<span class="ev-chip danger">命中</span>');
    const enc = text.match(/编码：([^\s·]+)/);
    if (enc) chips.push(`<span class="ev-chip">编码 ${esc(enc[1])}</span>`);
    const asr = text.match(/ASR\s*([\d.]+%)/);
    if (asr) chips.push(`<span class="ev-chip brand">ASR ${esc(asr[1])}</span>`);
    const cost = Number(e.cost);
    if (Number.isFinite(cost) && cost > 0) {
      chips.push(`<span class="ev-chip mono">¥${cost < 0.01 ? cost.toFixed(4) : cost.toFixed(2)}</span>`);
    }
    if (e.level === 'high') chips.push('<span class="ev-chip danger">高危</span>');
    else if (e.level === 'mid') chips.push('<span class="ev-chip warn">中危</span>');
    return chips.length ? `<div class="ev-meta">${chips.join('')}</div>` : '';
  }
  function liveRow(e) {
    const meta = EVT[e.type] || ['事件', 'ts', 'current'];
    const label = meta[0], cls = meta[1], ic = meta[2] || 'current';
    let text = String(e.content || '');
    const m = text.match(/\((\d+)ms,\s*[\d,]+\s*tok(?:,\s*推理\s*[\d,]+)?\)/);
    if (m) text = text.replace(m[0], '');
    text = text.replace(/\s*·\s*refused\s*·\s*/i, ' · ')
               .replace(/\s*·\s*编码：\S+/, '')
               .replace(/\s{2,}/g, ' ').replace(/\s+·\s*$/, '');
    return `<div class="ev">
      <div class="ev-rail"><span class="ev-ic ${cls}">${w.icon(ic, 12)}</span></div>
      <div class="ev-body">
        <div class="ev-top"><span class="ev-badge ${cls}">${esc(label)}</span>
          <span class="ev-actor">${esc(e.actor || e.task_name || '平台')}</span>
          <span class="ev-time">${esc(String(e.ts || '').slice(11, 19))}</span></div>
        <div class="ev-text" title="${esc(e.content || '')}">${esc(text)}</div>
        ${evChips(e, String(e.content || ''))}
      </div></div>`;
  }

  w.Pages = w.Pages || {};
  w.Pages.dashboard = {
    cockpit: true,
    async mount(root) {
      if (!document.getElementById('pg-dashboard')) {
        const s = document.createElement('style'); s.id = 'pg-dashboard'; s.textContent = STYLE;
        document.head.appendChild(s);
      }
      const page = this;
      page.costDim = page.costDim || 'dept';
      page.range = page.range || '14d';
      root.innerHTML = `<div class="cockpit">${UI.skel(4)}</div>`;

      const loadCost = async (dim) => {
        page.costDim = dim || page.costDim || 'dept';
        try {
          page.cost = await API.get('/api/cost/report?dim=' + encodeURIComponent(page.costDim));
          page.costError = '';
        } catch (e) {
          page.cost = null;
          page.costError = (e && e.message) || '费用服务不可用';
        }
      };
      const load = async () => {
        const [ov, tk, df, inf] = await Promise.all([
          API.get('/api/overview'), API.get('/api/tasks'), API.get('/api/defense'),
          API.get('/api/infra').catch(() => null)
        ]);
        page.data = ov || {};
        page.tasks = (tk && tk.items) || [];
        page.defense = df || { items: [] };
        page.infra = inf;
        page.live = dedupe((ov && ov.live) || []);
        await loadCost(page.costDim);
      };

      await load();
      if (!root.isConnected) return () => {};

      const renderPage = () => {
        if (!root.isConnected) return;
        root.innerHTML = Pg.call(page);
        bind();
        if (w.Setup) w.Setup.dashboard(root);
      };
      const refreshLive = async () => {
        if (!root.isConnected) return;
        const ov = await API.get('/api/overview');
        if (!root.isConnected) return;
        page.live = dedupe((ov && ov.live) || []);
        const box = root.querySelector('#live');
        if (box) box.innerHTML = page.live.map(liveRow).join('') || UI.empty('暂无实时事件', '任务运行后展示事件流');
      };
      const bind = () => {
        if (!root.isConnected) return;
        root.querySelectorAll('[data-refresh]').forEach((b) => b.onclick = async () => {
          if (b.disabled) return;
          b.disabled = true;
          try { await load(); renderPage(); UI.toast('数据已刷新'); }
          catch (e) { UI.toast('刷新失败：' + ((e && e.message) || e), 'err'); b.disabled = false; }
        });
        root.querySelectorAll('[data-seg]').forEach((b) => b.onclick = () => {
          page.range = b.dataset.seg || '14d';
          renderPage();
        });
        root.querySelectorAll('[data-dim]').forEach((b) => b.onclick = async () => {
          if (b.disabled) return;
          b.disabled = true;
          await loadCost(b.dataset.dim);
          renderPage();
          if (page.costError) UI.toast('费用数据加载失败：' + page.costError, 'err');
        });
        const cr = root.querySelector('[data-cost-retry]');
        if (cr) cr.onclick = async () => {
          cr.disabled = true;
          await loadCost(page.costDim);
          renderPage();
          UI.toast(page.costError ? '费用数据仍不可用' : '费用数据已恢复', page.costError ? 'err' : 'ok');
        };
        root.querySelectorAll('[data-ack]').forEach((b) => b.onclick = async () => {
          b.disabled = true;
          try {
            await API.post('/api/infra/alerts/' + encodeURIComponent(b.dataset.ack) + '/ack', {});
            UI.toast('告警已确认');
            page.infra = await API.get('/api/infra');
            renderPage();
          } catch (e) { UI.toast('确认失败：' + ((e && e.message) || e), 'err'); b.disabled = false; }
        });
        root.querySelectorAll('tr[data-id]').forEach((tr) => {
          tr.onclick = () => { location.hash = '#/tasks'; };
        });
      };

      renderPage();
      const timer = setInterval(() => refreshLive().catch(() => {}), 6000);
      return () => { clearInterval(timer); };
    }
  };
})(window);
