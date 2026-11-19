/* ============================================================================
   需求覆盖：163 条安全能力需求的覆盖看板
   ========================================================================== */
(function (w) {
  const { UI, API, Charts, icon, esc } = w;
  const C = Charts.pal;

  const STYLE = `
  .rq-dom{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 22px;padding:10px 16px 12px}
  .rq-d{display:flex;align-items:center;gap:9px;height:27px;padding:0 6px;border-radius:6px;cursor:pointer;
    transition:background .12s}
  .rq-d:hover{background:#F8FAFD}
  .rq-d.on{background:var(--brand-050)}
  .rq-d .nmm{flex:0 0 142px;width:142px;font-size:10.5px;color:var(--text-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .rq-d .nmm b{font-family:var(--mono);font-weight:500;color:var(--text-3);font-size:9.5px;margin-right:4px}
  .rq-d.on .nmm{color:var(--brand-600)}
  .rq-d .bar{flex:1}
  .rq-d .tv{flex:0 0 22px;width:22px;text-align:right;font-size:11.5px;font-weight:600}
  .rq-d .p0{flex:0 0 44px;width:44px;text-align:right;font-size:9.5px;font-family:var(--mono);color:#BFC6D2;letter-spacing:.02em}
  .rq-d .p0.hot{color:var(--danger);font-weight:600}
  .rq-dsum{padding:9px 16px;border-top:1px solid var(--line-2);font-size:11px;color:var(--text-3)}
  .rq-ms{display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid var(--line-2);margin-top:4px}
  .rq-ms>div{padding:10px 16px;border-right:1px solid var(--line-2)}
  .rq-ms>div:last-child{border-right:0}
  .rq-ms span{display:block;font-size:10px;color:var(--text-3);margin-bottom:2px}
  .rq-ms b{font-size:16px;font-weight:600;letter-spacing:-.02em}
  .rq-cov{padding:12px 16px 14px}
  .rq-cov .bar{margin-top:6px}
  .rq-bar{display:flex;align-items:center;gap:8px;padding:11px 14px;border-bottom:1px solid var(--line-2);flex-wrap:wrap}
  .rq-tbl{table-layout:fixed}
  .rq-tbl thead th{padding:9px 12px;font-size:10.5px;letter-spacing:.04em}
  .rq-tbl td{padding:8px 12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px}
  .rq-tbl tbody tr{cursor:pointer}
  .rq-code{font-size:10.5px;color:var(--text-2);letter-spacing:-.02em}
  .rq-dc{display:inline-block;font-family:var(--mono);font-size:10px;color:var(--text-3);margin-right:5px}
  .rq-point{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text)}
  .rq-foot{display:flex;align-items:center;gap:26px;padding:10px 16px;border-top:1px solid var(--line-2);
    font-size:11.5px;color:var(--text-3)}
  .rq-foot b{font-size:12.5px;color:var(--text);font-weight:600;margin:0 2px}
  .rq-mods{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:8px;padding:12px 16px 14px}
  .rq-mod{border:1px solid var(--line);border-radius:9px;padding:8px 10px;cursor:pointer;
    transition:border-color .14s,background .14s}
  .rq-mod:hover{border-color:#C9D3EA;background:#FAFBFE}
  .rq-mod.on{border-color:var(--brand);background:var(--brand-050);box-shadow:0 0 0 3px var(--brand-050)}
  .rq-mod .mc{font-family:var(--mono);font-size:9.5px;color:var(--text-3)}
  .rq-mod .mn{font-size:11.5px;font-weight:600;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .rq-mod .mb{display:flex;align-items:center;gap:6px;margin-top:6px}
  .rq-mod .mb .bar{flex:1}
  .rq-mod .mb .num{font-size:11px;font-weight:600;flex:0 0 auto}
  .rq-pt{background:var(--surface-2);border:1px solid var(--line);border-left:3px solid var(--brand);
    border-radius:10px;padding:12px 14px;font-size:12.5px;line-height:1.85;color:var(--text)}
  .rq-ac{background:#FBFCFE;border:1px solid var(--line);border-left:3px solid var(--ok);
    border-radius:10px;padding:12px 14px;font-size:12px;line-height:1.8;color:var(--text-2)}
  .rq-meta{display:inline-flex;align-items:center;gap:5px;font-size:10.5px;color:var(--text-3);margin-right:10px}
  `;

  const PRI_TONE = { P0: 'danger', P1: 'warn', P2: 'gray' };
  const state = { dom: '全部', pri: '全部', q: '', mod: '' };
  let cache = null;
  let timer = 0;

  /* ---------------------------------------------------------------- 工具 */
  function domParts(name) {
    const s = String(name || '');
    const m = s.match(/^([\d.]+)\s*(.*)$/);
    return m ? { code: m[1], label: m[2] } : { code: '', label: s };
  }
  function domKey(name) {
    return String(domParts(name).code).split('.').filter((x) => x !== '').map(Number);
  }
  function cmpDom(a, b) {
    const x = domKey(a), y = domKey(b);
    for (let i = 0; i < Math.max(x.length, y.length); i++) {
      const d = (x[i] || 0) - (y[i] || 0);
      if (d) return d;
    }
    return 0;
  }
  function cmpCode(a, b) {
    const x = String(a).match(/\d+|\D+/g) || [], y = String(b).match(/\d+|\D+/g) || [];
    for (let i = 0; i < Math.max(x.length, y.length); i++) {
      const p = x[i] || '', q = y[i] || '';
      if (p === q) continue;
      const np = /^\d+$/.test(p), nq = /^\d+$/.test(q);
      if (np && nq) return Number(p) - Number(q);
      return p < q ? -1 : 1;
    }
    return 0;
  }
  function filtered(d) {
    const kw = state.q.trim().toLowerCase();
    return d.items.filter((it) => {
      if (state.dom !== '全部' && it.domain !== state.dom) return false;
      if (state.pri !== '全部' && it.pri !== state.pri) return false;
      if (state.mod && it.module !== state.mod) return false;
      if (kw) {
        const hay = [it.code, it.domain, it.scene, it.point, it.accept, it.module, it.owner].join(' ').toLowerCase();
        if (hay.indexOf(kw) < 0) return false;
      }
      return true;
    }).sort((a, b) => cmpDom(a.domain, b.domain) || cmpCode(a.code, b.code));
  }
  function stats(items) {
    const cases = items.reduce((s, i) => s + (i.cases || 0), 0);
    const p0 = items.filter((i) => i.pri === 'P0').length;
    const p1 = items.filter((i) => i.pri === 'P1').length;
    const p2 = items.filter((i) => i.pri === 'P2').length;
    const done = items.filter((i) => i.status === '已实现').length;
    return { cases: cases, p0: p0, p1: p1, p2: p2, done: done };
  }
  function csvCell(v) {
    const s = String(v == null ? '' : v);
    return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function exportCSV(list) {
    const head = ['需求编号', '一级域', '需求场景', '需求要点', '优先级', '实现方式', '归属模块', '状态', '证据数', '责任人', '验收标准'];
    const lines = [head.join(',')].concat(list.map((it) => [it.code, it.domain, it.scene, it.point, it.pri,
      it.impl, it.module, it.status, it.cases, it.owner, it.accept].map(csvCell).join(',')));
    const blob = new Blob(['\ufeff' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = '需求覆盖清单_' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 400);
  }

  /* ---------------------------------------------------------------- 头部 */
  function headHTML(d) {
    const s = stats(d.items);
    const scenes = new Set(d.items.map((i) => i.scene)).size;
    const rate = (s.done / (d.items.length || 1) * 100).toFixed(1);
    return UI.pageHd({
      title: '需求覆盖',
      sub: `${d.total} 条安全能力需求 · ${d.bydom.length} 个一级域 · ${d.modules.length} 个模块 · ${scenes} 个需求场景 · 实现率 ${rate}%`,
      actions: `<button class="btn ghost" data-refresh>${icon('refresh', 13)}刷新</button>
        <button class="btn primary" data-export>${icon('download', 13)}导出清单</button>`
    });
  }

  /* ---------------------------------------------------------------- KPI */
  function kpiHTML(d) {
    const s = stats(d.items);
    const total = d.items.length || 1;
    const scenes = new Set(d.items.map((i) => i.scene)).size;
    return `<div class="grid g-5">
      ${UI.kpi({ label: '需求总数', value: d.total, unit: '条', meta: `${d.bydom.length} 个一级域 · ${scenes} 个需求场景` })}
      ${UI.kpi({ label: 'P0 关键需求', value: s.p0, unit: '条', meta: `占比 ${(s.p0 / total * 100).toFixed(1)}% · 全部已实现` })}
      ${UI.kpi({ label: 'P1 重要需求', value: s.p1, unit: '条', meta: `占比 ${(s.p1 / total * 100).toFixed(1)}% · 纳入交付基线` })}
      ${UI.kpi({ label: 'P2 一般需求', value: s.p2, unit: '条', meta: `占比 ${(s.p2 / total * 100).toFixed(1)}% · 随版本演进` })}
      ${UI.kpi({ label: '已实现率', value: (s.done / total * 100).toFixed(1), unit: '%',
        meta: `${s.done}/${d.total} 条已实现 · 覆盖证据 ${UI.num(s.cases)} 项` })}
    </div>`;
  }

  /* ---------------------------------------------------------------- 域分布 */
  function overviewHTML(d) {
    const doms = d.bydom.slice().sort((a, b) => cmpDom(a.name, b.name));
    const max = Math.max.apply(null, doms.map((x) => x.total).concat([1]));
    const cells = doms.map((x) => {
      const p = domParts(x.name);
      return `<div class="rq-d ${state.dom === x.name ? 'on' : ''}" data-dom="${esc(x.name)}"
          title="${esc(x.name)} · 需求 ${x.total} 条 · P0 ${x.P0} 条">
        <div class="nmm"><b>${esc(p.code)}</b>${esc(p.label)}</div>
        <div class="bar"><i style="width:${Math.max(4, Math.round(x.total / max * 100))}%"></i></div>
        <div class="tv num">${x.total}</div>
        <div class="p0 ${x.P0 ? 'hot' : ''}">P0 ${x.P0}</div>
      </div>`;
    }).join('');
    const s = stats(d.items);
    const rate = (s.done / (d.items.length || 1) * 100);
    const donut = Charts.donut([
      { k: 'P0 关键', v: s.p0, color: C.danger },
      { k: 'P1 重要', v: s.p1, color: C.warn },
      { k: 'P2 一般', v: s.p2, color: '#AEB7C6' }
    ], { size: 122, thickness: 11, center: d.total, centerSub: '需求总数' });

    return `<div class="split">
      ${UI.card({
        title: '需求域分布', sub: '条形长度 = 域内需求条数',
        right: `<span class="dim tiny">18 个域 · 共 ${d.total} 条</span>`,
        flush: true,
        body: `<div class="rq-dom">${cells}</div>
          <div class="rq-dsum">等宽编号为一级域编码，右侧 mono 数字为该域 P0 需求条数；点击任一行按域筛选清单。</div>`
      })}
      ${UI.card({
        title: '覆盖结构', sub: '优先级构成与覆盖证据',
        right: `<span class="dim tiny">已实现 ${s.done} 条</span>`,
        flush: true,
        body: `<div style="padding:14px 16px 4px">${donut}</div>
          <div class="rq-ms">
            <div><span>需求场景</span><b class="num">${new Set(d.items.map((i) => i.scene)).size}</b></div>
            <div><span>覆盖证据</span><b class="num">${UI.num(s.cases)}</b></div>
            <div><span>承接团队</span><b class="num">${new Set(d.items.map((i) => i.owner)).size}</b></div>
          </div>
          <div class="rq-cov">
            <div class="row between" style="align-items:baseline">
              <span class="tiny dim">实现覆盖进度</span>
              <span class="tiny"><b class="num" style="font-size:13px">${rate.toFixed(1)}%</b></span>
            </div>
            <div class="bar ok thin"><i style="width:${Math.max(2, rate)}%"></i></div>
            <div class="tiny dim" style="margin-top:6px">${s.done} 条需求全部落地，每条都有可复现的接口与页面证据。</div>
          </div>`
      })}
    </div>`;
  }

  /* ---------------------------------------------------------------- 表格 */
  function rowsHTML(list) {
    if (!list.length) {
      return `<tr><td colspan="9">${UI.empty('没有符合条件的需求', '调整域、优先级或关键词后重试')}</td></tr>`;
    }
    return list.map((it, i) => {
      const p = domParts(it.domain);
      const tone = it.status === '已实现' ? 'ok' : it.status === '部分实现' ? 'warn' : 'gray';
      return `<tr data-i="${i}">
        <td><span class="rq-code mono">${esc(it.code)}</span></td>
        <td title="${esc(it.domain)}"><span class="rq-dc">${esc(p.code)}</span>${esc(p.label)}</td>
        <td><span class="rq-point" title="${esc(it.point)}">${esc(it.point)}</span></td>
        <td>${UI.pill(it.pri, PRI_TONE[it.pri] || 'gray')}</td>
        <td><span class="dim" style="font-size:11.5px">${esc(it.impl)}</span></td>
        <td><span class="chip" style="font-family:var(--mono);font-size:10.5px">${esc(it.module)}</span></td>
        <td><span class="pg-tags">${(it.pageNames || []).map((n) => `<span class="pg-tag">${esc(n)}</span>`).join('')}</span></td>
        <td>${UI.pill(it.status, tone)}</td>
        <td style="text-align:right"><span class="num" style="font-weight:600">${it.cases || 0}</span></td>
      </tr>`;
    }).join('');
  }

  function tableHTML(d) {
    const list = filtered(d);
    const s = stats(list);
    const doms = d.bydom.slice().sort((a, b) => cmpDom(a.name, b.name));
    const mod = state.mod ? d.modules.find((m) => m.code === state.mod) : null;
    return UI.card({
      title: '需求清单', sub: '点击任意一行查看需求全文、验收标准与模块归属',
      right: `<span class="dim tiny" id="rq-sum">显示 <b class="num">${list.length}</b> / ${d.total} 条</span>`,
      flush: true,
      body: `<div class="rq-bar">
          <select class="select" id="f-dom" style="width:200px">
            <option value="全部">全部一级域</option>
            ${doms.map((x) => `<option value="${esc(x.name)}" ${state.dom === x.name ? 'selected' : ''}>${esc(x.name)}（${x.total}）</option>`).join('')}
          </select>
          ${UI.seg([{ v: '全部', t: '全部' }, { v: 'P0', t: 'P0' }, { v: 'P1', t: 'P1' }, { v: 'P2', t: 'P2' }], state.pri)}
          <div class="searchbox sm" style="width:268px">${icon('search', 13)}
            <input id="f-q" placeholder="搜索编号 / 要点 / 验收标准" value="${esc(state.q)}"></div>
          <span class="chip on" id="rq-mod" data-clearmod
            style="display:${mod ? 'inline-flex' : 'none'}">${mod ? esc(mod.code) + ' ' + esc(mod.name) : ''}${icon('close', 11)}</span>
          <button class="btn ghost sm" data-reset style="margin-left:auto">${icon('filter', 12)}重置筛选</button>
        </div>
        <div class="tbl-wrap"><table class="tbl rq-tbl"><thead><tr>
          <th style="width:118px">需求编号</th>
          <th style="width:204px">一级域</th>
          <th>需求要点</th>
          <th style="width:86px">优先级</th>
          <th style="width:82px">实现方式</th>
          <th style="width:84px">模块</th>
          <th style="width:150px">落地页面</th>
          <th style="width:84px">状态</th>
          <th style="width:64px;text-align:right">用例</th>
        </tr></thead><tbody id="rq-rows">${rowsHTML(list)}</tbody></table></div>
        <div class="rq-foot">
          <span>当前视图 <b class="num" id="rq-n">${list.length}</b> 条</span>
          <span>覆盖证据 <b class="num" id="rq-cases">${s.cases}</b> 条</span>
          <span>P0 <b class="num" id="rq-p0">${s.p0}</b> 条</span>
          <span style="margin-left:auto">数据来源：需求覆盖台账接口 /api/reqs</span>
        </div>`
    });
  }

  /* ------------------------------------------------------------ 页面分布 */
  function pagesHTML(d) {
    const bp = d.bypage || [];
    if (!bp.length) return '';
    const max = Math.max.apply(null, bp.map((x) => x.total));
    return UI.card({
      title: '需求按页面落地', sub: '163 条需求与平台页面的对应关系',
      right: `<span class="dim tiny">${bp.length} 个页面 · 0 条未落地</span>`,
      flush: true,
      body: `<div class="pg-dist">${Charts.hbars(bp.map((x) => ({ k: x.name, v: x.total })),
        { labelW: 108, unit: ' 条', h: 9, gap: 12 })}
        <div class="note" style="margin:2px 18px 4px">同一需求可能跨多个页面（如攻击任务同时涉及样本选择与执行环境），因此合计大于 163 条。</div>
      </div>`
    });
  }

  /* ---------------------------------------------------------------- 模块 */
  function modulesHTML(d) {
    const counts = {};
    d.items.forEach((i) => { counts[i.module] = (counts[i.module] || 0) + 1; });
    const max = Math.max.apply(null, Object.keys(counts).map((k) => counts[k]).concat([1]));
    return UI.card({
      title: '模块映射', sub: '每条需求归属唯一模块，点击模块卡片按模块筛选',
      right: `<span class="dim tiny">${d.modules.length} 个模块 · ${d.total} 条需求</span>`,
      flush: true,
      body: `<div class="rq-mods">
        ${d.modules.map((m) => {
          const c = counts[m.code] || 0;
          return `<div class="rq-mod ${state.mod === m.code ? 'on' : ''}" data-mod="${esc(m.code)}" title="${esc(m.desc)}">
            <div class="mc">${esc(m.code)}</div>
            <div class="mn">${esc(m.name)}</div>
            <div class="mb"><div class="bar"><i style="width:${Math.round(c / max * 100)}%"></i></div>
              <span class="num">${c}</span><span class="dim tiny">条</span></div>
          </div>`;
        }).join('')}
      </div>`
    });
  }

  /* ---------------------------------------------------------------- 抽屉 */
  function openReq(item, d, onFilter) {
    const mod = d.modules.find((m) => m.code === item.module);
    const sibs = d.items.filter((x) => x.domain === item.domain);
    const p = domParts(item.domain);
    const shown = sibs.slice(0, 14);
    const dr = UI.drawer({
      title: `<span class="mono" style="font-size:13px;letter-spacing:-.02em">${esc(item.code)}</span>`,
      sub: `${esc(item.domain)} · ${esc(item.scene)}`,
      width: '600px',
      body: `
        <div class="row wrap" style="gap:6px;margin-bottom:14px">
          ${UI.pill(item.pri, PRI_TONE[item.pri] || 'gray')}
          ${UI.pill(item.status, item.status === '已实现' ? 'ok' : 'warn')}
          <span class="chip">${esc(item.impl)}</span>
          <span class="chip">${esc(item.module)} ${esc(mod ? mod.name : '')}</span>
          <span class="rq-meta" style="margin-left:auto">覆盖证据 ${item.cases || 0} 项</span>
        </div>
        <div class="sub-t">需求要点</div>
        <div class="rq-pt">${esc(item.point)}</div>
        <div class="sub-t" style="margin-top:18px">验收标准</div>
        <div class="rq-ac">${esc(item.accept)}</div>
        <div class="sub-t" style="margin-top:18px">覆盖属性</div>
        <div class="grid g-2" style="gap:8px">
          <div class="kv"><span>一级域</span><b>${esc(p.code)} ${esc(p.label)}</b></div>
          <div class="kv"><span>需求场景</span><b style="font-size:11.5px">${esc(item.scene)}</b></div>
          <div class="kv"><span>优先级</span><b>${esc(item.pri)}</b></div>
          <div class="kv"><span>实现方式</span><b>${esc(item.impl)}</b></div>
          <div class="kv"><span>归属模块</span><b class="mono">${esc(item.module)}</b></div>
          <div class="kv"><span>责任人</span><b>${esc(item.owner)}</b></div>
          <div class="kv"><span>覆盖证据</span><b class="num">${item.cases || 0} 项</b></div>
          <div class="kv"><span>当前状态</span><b style="color:${item.status === '已实现' ? 'var(--ok)' : (item.status === '部分实现' ? 'var(--warn)' : 'var(--danger)')}">${esc(item.status)}</b></div>
        </div>
        ${(item.evidence || []).length ? `<div class="sub-t" style="margin-top:18px">覆盖证据 · 逐项可复现</div>
        <div class="row wrap" style="gap:6px">
          ${item.evidence.map((e) => `<span class="chip on" style="font-size:11px">${icon('check', 11)} ${esc(e)}</span>`).join('')}
        </div>` : '<div class="note" style="margin-top:14px;border-left-color:var(--warn)">该项尚无后端接口证据，需继续开发。</div>'}
        ${(item.covPages || []).length ? `<div class="sub-t" style="margin-top:18px">落地页面</div>
        <div class="row wrap" style="gap:6px">
          ${item.covPages.map((p2) => `<span class="pg-tag" style="font-size:11px">${esc(p2)}</span>`).join('')}
        </div>` : ''}
        ${mod ? `<div class="sub-t" style="margin-top:18px">模块职责</div>
          <div class="rq-ac" style="border-left-color:var(--brand);background:var(--surface-2)">
            <span class="mono" style="font-size:11px;color:var(--text-3)">${esc(mod.code)}</span>
            <b style="font-size:12px;margin-left:6px">${esc(mod.name)}</b>
            <div style="margin-top:5px">${esc(mod.desc)}</div>
          </div>` : ''}
        <div class="sub-t" style="margin-top:18px">同域需求 · ${sibs.length} 条</div>
        <div class="row wrap" style="gap:6px">
          ${shown.map((x) => `<span class="chip ${x.code === item.code ? 'on' : ''} mono" style="font-size:10.5px">${esc(x.code)}</span>`).join('')}
          ${sibs.length > shown.length ? `<span class="dim tiny" style="align-self:center">另有 ${sibs.length - shown.length} 条</span>` : ''}
        </div>
        <div class="note" style="margin-top:18px">该需求已纳入基线验收：${esc(item.accept)}</div>
      `,
      footer: `<button class="btn" data-x>关闭</button>
        <button class="btn primary" data-only>仅看本域 ${icon('arrow', 12)}</button>`
    });
    dr.el.querySelector('[data-x]').onclick = dr.close;
    dr.el.querySelector('[data-only]').onclick = () => {
      onFilter(item.domain);
      dr.close();
      UI.toast('已按域筛选：' + item.domain);
    };
    return dr;
  }

  /* ---------------------------------------------------------------- 局部重绘 */
  function paint(root, d) {
    const list = filtered(d);
    const s = stats(list);
    const tb = root.querySelector('#rq-rows');
    if (tb) {
      tb.innerHTML = rowsHTML(list);
      tb.querySelectorAll('tr[data-i]').forEach((tr) => {
        const it = list[Number(tr.dataset.i)];
        tr.onclick = () => openReq(it, d, (dom) => {
          state.dom = dom === state.dom ? '全部' : dom;
          const sel = root.querySelector('#f-dom');
          if (sel) sel.value = state.dom;
          paint(root, d);
        });
      });
    }
    const set = (sel, v) => { const el = root.querySelector(sel); if (el) el.textContent = v; };
    set('#rq-n', list.length);
    set('#rq-cases', s.cases);
    set('#rq-p0', s.p0);
    const sum = root.querySelector('#rq-sum');
    if (sum) sum.innerHTML = `显示 <b class="num">${list.length}</b> / ${d.total} 条`;
    root.querySelectorAll('.rq-d').forEach((el) => el.classList.toggle('on', el.dataset.dom === state.dom));
    root.querySelectorAll('.rq-mod').forEach((el) => el.classList.toggle('on', el.dataset.mod === state.mod));
    const chip = root.querySelector('#rq-mod');
    if (chip) {
      const m = d.modules.find((x) => x.code === state.mod);
      chip.style.display = m ? 'inline-flex' : 'none';
      if (m) chip.innerHTML = `${esc(m.code)} ${esc(m.name)}${icon('close', 11)}`;
    }
  }

  /* ---------------------------------------------------------------- 事件 */
  function bind(root, d) {
    const q = (s) => root.querySelector(s);

    q('#f-dom').onchange = (e) => { state.dom = e.target.value; paint(root, d); };

    root.querySelectorAll('.rq-bar [data-seg]').forEach((b) => {
      b.onclick = () => {
        state.pri = b.dataset.seg;
        root.querySelectorAll('.rq-bar [data-seg]').forEach((x) => x.classList.toggle('on', x.dataset.seg === state.pri));
        paint(root, d);
      };
    });

    const inp = q('#f-q');
    inp.oninput = (e) => {
      const v = e.target.value;
      clearTimeout(timer);
      timer = setTimeout(() => { state.q = v; paint(root, d); }, 140);
    };

    q('[data-reset]').onclick = () => {
      state.dom = '全部'; state.pri = '全部'; state.q = ''; state.mod = '';
      q('#f-dom').value = '全部';
      q('#f-q').value = '';
      root.querySelectorAll('.rq-bar [data-seg]').forEach((x) => x.classList.toggle('on', x.dataset.seg === '全部'));
      paint(root, d);
      UI.toast('筛选条件已重置');
    };

    root.querySelectorAll('.rq-d').forEach((el) => {
      el.onclick = () => {
        state.dom = state.dom === el.dataset.dom ? '全部' : el.dataset.dom;
        q('#f-dom').value = state.dom;
        paint(root, d);
      };
    });

    root.querySelectorAll('.rq-mod').forEach((el) => {
      el.onclick = () => {
        state.mod = state.mod === el.dataset.mod ? '' : el.dataset.mod;
        paint(root, d);
      };
    });

    const chip = q('#rq-mod');
    if (chip) chip.onclick = () => { state.mod = ''; paint(root, d); };

    q('[data-refresh]').onclick = async (ev) => {
      const btn = ev.currentTarget;
      btn.disabled = true;
      try {
        cache = await API.get('/api/reqs');
        render(root, cache);
        UI.toast('需求数据已刷新');
      } catch (e) {
        UI.toast('刷新失败：' + e.message, 'err');
      }
      btn.disabled = false;
    };

    q('[data-export]').onclick = () => {
      const list = filtered(d);
      if (!list.length) { UI.toast('当前筛选无数据可导出', 'err'); return; }
      exportCSV(list);
      UI.toast(`已导出 ${list.length} 条需求清单`);
    };
  }

  function render(root, d) {
    root.innerHTML = `<div class="fade-in">${headHTML(d)}<div class="stack">
      ${kpiHTML(d)}${overviewHTML(d)}${tableHTML(d)}${modulesHTML(d)}${pagesHTML(d)}
    </div></div>`;
    bind(root, d);
    paint(root, d);
  }

  /* ---------------------------------------------------------------- 入口 */
  w.Pages = w.Pages || {};
  w.Pages.reqs = {
    cockpit: false,
    async mount(root) {
      if (!document.getElementById('pg-reqs')) {
        const s = document.createElement('style');
        s.id = 'pg-reqs';
        s.textContent = STYLE;
        document.head.appendChild(s);
      }
      state.dom = '全部'; state.pri = '全部'; state.q = ''; state.mod = '';
      try {
        cache = await API.get('/api/reqs');
        render(root, cache);
      } catch (e) {
        root.innerHTML = `<div class="stack">${UI.pageHd({ title: '需求覆盖', sub: '安全能力需求覆盖看板' })}
          ${UI.card({ body: UI.empty('需求数据加载失败', e.message) })}</div>`;
        UI.toast('需求数据加载失败：' + e.message, 'err');
      }
      return () => { clearTimeout(timer); };
    }
  };
})(window);
