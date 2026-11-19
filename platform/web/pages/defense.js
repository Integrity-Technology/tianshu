/* ============================================================================
   防护插件：输入 / 输出双向链路、插件开关、策略配置
   ========================================================================== */
(function (w) {
  const { UI, API, Charts } = w;
  const C = Charts.pal;
  const SCOPES = ['请求级', '会话级', '全局'];
  const MODES = { 'fail-close': '失败关闭（阻断请求）', 'fail-open': '失败开放（放行并告警）' };

  const STYLE = `
  .plug-hd,.plug{display:grid;grid-template-columns:1fr 76px 104px 76px 54px;gap:12px;align-items:center;padding:0 16px}
  .plug-hd{height:34px;border-bottom:1px solid var(--line);background:var(--surface-2);
    font-size:10.5px;letter-spacing:.03em;color:var(--text-3);font-weight:600}
  .plug-hd .r{text-align:right}
  .plug{height:60px;border-bottom:1px solid var(--line-2);transition:background .15s}
  .plug:last-child{border-bottom:0}
  .plug:hover{background:#F8FAFD}
  .plug.off .plug-name{color:var(--text-2)}
  .plug.off .plug-meta{opacity:.72}
  .plug-name{font-size:12.5px;font-weight:560;display:flex;align-items:center;gap:7px;min-width:0}
  .plug-name .nm{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .ver{font-size:9.5px;font-weight:500;color:var(--text-3);background:#F3F5F9;border:1px solid var(--line);
    border-radius:5px;padding:1px 5px;white-space:nowrap}
  .plug-meta{font-size:10.5px;color:var(--text-3);margin-top:3px;display:flex;gap:6px;align-items:center}
  .plug-meta .sep{color:#CBD2DF}
  .side{font-size:10px;font-weight:600;padding:2px 7px;border-radius:5px;white-space:nowrap;letter-spacing:.02em}
  .side.in{color:var(--brand-600);background:var(--brand-050);border:1px solid var(--brand-100)}
  .side.out{color:var(--violet);background:var(--violet-bg);border:1px solid #E4DAFC}
  .plug-n{text-align:right;font-size:12px;font-weight:560;font-variant-numeric:tabular-nums}
  .plug-n small{font-size:9.5px;font-weight:400;color:var(--text-3);margin-left:2px}
  .plug-l{text-align:right;font-size:11.5px;color:var(--text-2);font-variant-numeric:tabular-nums}
  .plug-l small{font-size:9.5px;color:var(--text-3);margin-left:1px}
  .sw{width:34px;height:19px;border-radius:12px;background:#DDE2EB;position:relative;flex:0 0 34px;
    margin-left:auto;transition:background .18s var(--ease);cursor:pointer}
  .sw::after{content:"";position:absolute;top:2px;left:2px;width:15px;height:15px;border-radius:50%;
    background:#fff;box-shadow:0 1px 2px rgba(16,24,40,.22);transition:left .18s var(--ease)}
  .sw.on{background:var(--brand)}
  .sw.on::after{left:17px}
  .sw:disabled{opacity:.5;cursor:default}
  .pol{display:flex;flex-direction:column;gap:13px}
  .plab{font-size:11px;color:var(--text-3);margin-bottom:6px;font-weight:500}
  .eff{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--line-2);
    border:1px solid var(--line-2);border-radius:10px;overflow:hidden;margin-top:2px}
  .eff>div{background:var(--surface);padding:9px 11px}
  .eff .k{font-size:10px;color:var(--text-3)}
  .eff .v{font-size:15px;font-weight:650;letter-spacing:-.02em;margin-top:2px}
  .eff .v small{font-size:10px;font-weight:500;color:var(--text-3);margin-left:2px;letter-spacing:0}
  .legend-t{font-size:11px;color:var(--text-3);line-height:1.75;margin-top:12px;padding-top:10px;border-top:1px solid var(--line-2)}
  .side-row{display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px dashed var(--line-2);font-size:11.5px}
  .side-row:last-of-type{border-bottom:0}
  .side-row .sk{color:var(--text-2);flex:1}
  .side-row .sv{font-variant-numeric:tabular-nums;color:var(--text);font-weight:600}
  .side-row .sm{color:var(--text-3);width:74px;text-align:right;font-size:10.5px}
  .side-foot{font-size:10.5px;color:var(--text-3);margin-top:8px;padding-top:9px;border-top:1px dashed var(--line-2)}
  .sidewrap > div{justify-content:center}
  .sidewrap .legend{display:none}
  .sdot{width:7px;height:7px;border-radius:50%;flex:none;display:inline-block}
  .side-row .sv small{font-size:10px;color:var(--text-3);font-weight:500;margin-left:1px}
  .ab-tool{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px}
  .ab-lab{font-size:11.5px;color:var(--text-3);font-weight:500}
  .ab-tool .select{width:auto;min-width:238px;max-width:300px}
  .ab-note{flex:1;min-width:250px;font-size:11.5px;color:var(--text-3);line-height:1.6;
    padding-left:13px;border-left:1px solid var(--line)}
  .ab-res{display:flex;flex-direction:column;gap:12px}
  .ab-ar{color:#98A0AF;font-weight:500;padding:0 2px}
  .ab-cmp{border:1px solid var(--line);border-radius:12px;padding:11px 14px;background:var(--surface-2)}
  .ab-cmp-h{display:flex;align-items:center;gap:12px;margin-bottom:9px}
  .ab-cmp-t{font-size:11.5px;font-weight:600;color:var(--text-2)}
  .ab-cmp-h .legend{margin-left:auto;font-size:10.5px;color:var(--text-3);gap:12px}
  .ab-cmp-h .legend i{width:7px;height:7px;border-radius:2px}
  .ab-row{display:grid;grid-template-columns:62px minmax(0,1fr) 148px 52px;gap:12px;align-items:center;
    margin-bottom:7px}
  .ab-row:last-of-type{margin-bottom:0}
  .ab-k{font-size:11.5px;color:var(--text-2);white-space:nowrap}
  .ab-track{display:flex;height:9px;border-radius:20px;overflow:hidden;background:#E7EBF3}
  .ab-track i{display:block;height:100%}
  .ab-track .blk{background:linear-gradient(90deg,#2C55E6,#5E7BFF)}
  .ab-track .pass{background:#D6DDEA}
  .ab-cnt{font-size:11px;color:var(--text-3);text-align:right;white-space:nowrap}
  .ab-cnt b{color:var(--text);font-weight:600}
  .ab-rate{text-align:right;font-size:12.5px;font-weight:600;font-variant-numeric:tabular-nums}
  .ab-ft{display:flex;align-items:center;gap:18px;flex-wrap:wrap;margin-top:9px;padding-top:9px;
    border-top:1px dashed var(--line);font-size:11.5px;color:var(--text-3)}
  .ab-ft b{color:var(--text);font-weight:600}
  .ab-tbl{border:1px solid var(--line);border-radius:12px;overflow:hidden}
  .ab-tbl-h{display:flex;align-items:center;gap:8px;padding:8px 14px;background:var(--surface-2);
    border-bottom:1px solid var(--line-2);font-size:11.5px;font-weight:600;color:var(--text-2)}
  .ab-tbl-h span{font-weight:400;color:var(--text-3);font-size:11px}
  .ab-tbl .tbl thead th{background:transparent}
  .ab-tbl .tbl th,.ab-tbl .tbl td{padding-top:8px;padding-bottom:8px}
  .ab-pay{font-size:12px;line-height:1.55;color:var(--text);max-width:560px;word-break:break-all}
  .ab-exp{font-size:11.5px;color:var(--text-2)}
  `;

  const sum = (arr, f) => arr.reduce((s, x) => s + (f(x) || 0), 0);

  function kpis(items, policy) {
    const total = items.length;
    const on = items.filter((p) => p.status === '启用');
    const off = total - on.length;
    const hits = sum(items, (p) => p.hits);
    const inHits = sum(items.filter((p) => p.side === '输入'), (p) => p.hits);
    const outHits = hits - inHits;
    const lat = sum(items, (p) => p.latency) / (total || 1);
    const lats = items.map((p) => p.latency);
    const fc = items.filter((p) => p.fail_mode === 'fail-close').length;
    const modeT = policy.mode === 'fail-open' ? '失败开放' : '失败关闭';
    return `<div class="grid g-4">
      ${UI.kpi({ label: '在线插件', value: on.length, unit: `/ ${total} 个`, meta: off ? `${off} 个已停用 · 均可在链路上重新启用` : '全部插件在线' })}
      ${UI.kpi({ label: '拦截总量', value: hits.toLocaleString('zh-CN'), unit: '次', meta: `输入侧 ${inHits.toLocaleString('zh-CN')} · 输出侧 ${outHits.toLocaleString('zh-CN')}` })}
      ${UI.kpi({ label: '平均时延', value: Math.round(lat), unit: 'ms', meta: `最快 ${Math.min(...lats)}ms · 最慢 ${Math.max(...lats)}ms` })}
      ${UI.kpi({ label: '失败关闭插件', value: fc, unit: '个', meta: `失败开放 ${total - fc} 个 · 全局策略：${modeT}` })}
    </div>`;
  }

  function pluginRows(items) {
    const order = { '输入': 0, '输出': 1 };
    return items.slice().sort((a, b) => (order[a.side] - order[b.side]) || a.id - b.id).map((p) => {
      const isOn = p.status === '启用';
      const isIn = p.side === '输入';
      return `<div class="plug ${isOn ? '' : 'off'}">
        <div>
          <div class="plug-name"><span class="nm">${UI.esc(p.name)}</span><span class="ver">${UI.esc(p.version)}</span></div>
          <div class="plug-meta"><span>${UI.esc(p.vendor)}</span><span class="sep">·</span>
            <span>${p.fail_mode === 'fail-close' ? '失败关闭' : '失败开放'}</span></div>
        </div>
        <div><span class="side ${isIn ? 'in' : 'out'}">${UI.esc(p.side)}</span></div>
        <div class="plug-n">${p.hits.toLocaleString('zh-CN')}<small>次</small></div>
        <div class="plug-l">${p.latency}<small>ms</small></div>
        <div><button class="sw ${isOn ? 'on' : ''}" data-sw="${p.id}" aria-pressed="${isOn}"
          title="${isOn ? '停用插件' : '启用插件'}" aria-label="${isOn ? '停用' : '启用'}${UI.esc(p.name)}"></button></div>
      </div>`;
    }).join('');
  }

  function policyCard(page, items, policy) {
    const on = items.filter((p) => p.status === '启用');
    const chain = sum(on, (p) => p.latency);
    return UI.card({
      title: '策略配置', sub: '对所有插件生效的统一策略',
      right: `<span class="pill ${policy.mode === 'fail-close' ? 'ok' : 'warn'}">${policy.mode === 'fail-close' ? '失败关闭' : '失败开放'}</span>`,
      body: `<div class="pol">
        <div>
          <div class="plab">作用域</div>
          ${UI.seg(SCOPES.map((s) => ({ v: s, t: s })), policy.scope)}
        </div>
        <div class="row" style="gap:12px;align-items:flex-end">
          <div style="flex:1"><div class="plab">最大插件数</div>
            <input class="input num" id="p-max" type="number" min="1" max="16" value="${policy.maxPlugins}"></div>
          <div style="flex:1"><div class="plab">总超时（ms）</div>
            <input class="input num" id="p-to" type="number" min="200" step="100" value="${policy.timeout}"></div>
        </div>
        <div>
          <div class="plab">失败策略</div>
          <select class="select" id="p-mode">
            ${Object.keys(MODES).map((m) => `<option value="${m}" ${m === policy.mode ? 'selected' : ''}>${MODES[m]}</option>`).join('')}
          </select>
        </div>
        <div class="eff">
          <div><div class="k">生效插件</div><div class="v num">${on.length}<small>个</small></div></div>
          <div><div class="k">链路时延</div><div class="v num">${chain}<small>ms</small></div></div>
          <div><div class="k">总超时</div><div class="v num">${policy.timeout}<small>ms</small></div></div>
        </div>
        <button class="btn primary" data-save style="justify-content:center">${w.icon('check', 14)}保存策略</button>
        <div class="tiny dim" style="line-height:1.75;margin-top:-3px">策略实时下发至网关，单次请求最多串联 ${policy.maxPlugins} 个插件，任一插件超时按${policy.mode === 'fail-close' ? '失败关闭' : '失败开放'}处理。</div>
      </div>`
    });
  }

  function barRank(list) {
    const data = list.map((x) => ({ k: x.name, v: x.hits }));
    let h = Charts.hbars(data, { labelW: 136, valW: 68, unit: ' 次', h: 8, gap: 19, color: C.brand });
    data.forEach((d) => {
      h = h.split('>' + d.v + ' 次<').join('>' + Number(d.v).toLocaleString('zh-CN') + ' 次<');
    });
    return h;
  }

  function abRow(label, o) {
    const blk = o['拦截'] || 0;
    const pass = o['放行'] || 0;
    const t = blk + pass || 1;
    const pctBlocked = Math.round((blk / t) * 1000) / 10;
    return `<div class="ab-row">
      <div class="ab-k">${UI.esc(label)}</div>
      <div class="ab-track"><i class="blk" style="width:${pctBlocked}%"></i><i class="pass" style="width:${100 - pctBlocked}%"></i></div>
      <div class="ab-cnt">拦截 <b>${blk}</b> · 放行 <b>${pass}</b></div>
      <div class="ab-rate">${pctBlocked}%</div>
    </div>`;
  }

  function abResult(r) {
    const before = r.before || {};
    const after = r.after || {};
    const detail = r.detail || [];
    const exp = detail.filter((d) => d.expect === '拦截').length;
    const hitN = detail.filter((d) => d.hit).length;
    const net = (r.latencyOn || 0) - (r.latencyOff || 0);
    const accDelta = Math.round(((r.accuracyOn || 0) - (r.accuracyOff || 0)) * 10) / 10;
    const sig = (n) => (n > 0 ? '+' : '');
    const worth = (r.deltaBlocked || 0) > 0;
    return `<div class="ab-res">
      <div class="grid g-4">
        ${UI.kpi({ label: '拦截数', value: `${before['拦截'] || 0} <span class="ab-ar">→</span> ${after['拦截'] || 0}`, unit: '条', meta: `同一批 ${r.payloads} 条载荷` })}
        ${UI.kpi({ label: '准确率', value: `${Number(r.accuracyOff || 0).toFixed(1)} <span class="ab-ar">→</span> ${Number(r.accuracyOn || 0).toFixed(1)}`, unit: '%', meta: `净提升 <span class="trend ${accDelta >= 0 ? 'up' : 'down'}">${sig(accDelta)}${accDelta.toFixed(1)} pt</span>` })}
        ${UI.kpi({ label: '新增拦截', value: `${sig(r.deltaBlocked || 0)}${r.deltaBlocked || 0}`, unit: '条', meta: `期望拦截 ${exp} 条 · 关闭态漏放 ${Math.max(0, exp - (before['拦截'] || 0))} 条` })}
        ${UI.kpi({ label: '净增时延', value: `${sig(net)}${net.toFixed(2)}`, unit: 'ms', meta: `关闭 ${r.latencyOff}ms · 开启 ${r.latencyOn}ms` })}
      </div>
      <div class="ab-cmp">
        <div class="ab-cmp-h"><span class="ab-cmp-t">拦截 / 放行占比</span>
          <span class="legend"><span class="li"><i style="background:${C.brand}"></i>拦截</span><span class="li"><i style="background:#D6DDEA"></i>放行</span></span>
        </div>
        ${abRow('关闭插件', before)}
        ${abRow('开启插件', after)}
        <div class="ab-ft">
          <span>新增拦截 <b>${sig(r.deltaBlocked || 0)}${r.deltaBlocked || 0} 条</b></span>
          <span>准确率 <b>${Number(r.accuracyOff || 0).toFixed(1)}% → ${Number(r.accuracyOn || 0).toFixed(1)}%</b></span>
          <span>链路代价 <b>${sig(net)}${net.toFixed(2)} ms</b></span>
          <span style="margin-left:auto">净收益判定 <b style="color:${worth ? 'var(--ok)' : 'var(--warn)'}">${worth ? '值得开启' : '收益有限'}</b></span>
        </div>
      </div>
      <div class="ab-tbl">
        <div class="ab-tbl-h">逐条载荷明细<span>${detail.length} 条 · 符合预期 ${hitN} / ${detail.length}</span></div>
        <table class="tbl"><thead><tr>
          <th>载荷</th><th style="width:92px">关闭时</th><th style="width:92px">开启时</th>
          <th style="width:76px">期望</th><th style="width:118px">结论</th>
        </tr></thead><tbody>
          ${detail.map((d) => `<tr>
            <td><div class="ab-pay">${UI.esc(d.payload)}</div></td>
            <td>${UI.pill(d.off, d.off === '拦截' ? 'brand' : 'gray')}</td>
            <td>${UI.pill(d.on, d.on === '拦截' ? 'brand' : 'gray')}</td>
            <td><span class="ab-exp">${UI.esc(d.expect)}</span></td>
            <td>${UI.pill(d.hit ? '符合预期' : '不符合预期', d.hit ? 'ok' : 'danger')}</td>
          </tr>`).join('')}
        </tbody></table>
      </div>
    </div>`;
  }

  function abInner(ab, items) {
    ab = ab || {};
    const has = items.some((p) => p.id === ab.pid);
    const pid = has ? ab.pid : (items[0] || {}).id;
    const r = ab.data;
    const st = ab.loading ? '<span class="pill warn"><i class="dot"></i>对比中</span>'
      : r ? '<span class="pill ok"><i class="dot"></i>已完成</span>'
        : '<span class="pill gray"><i class="dot"></i>待运行</span>';
    return `<div class="ab-tool">
      <span class="ab-lab">插件</span>
      <select class="select" id="ab-plug" ${items.length ? '' : 'disabled'}>
        ${items.map((p) => `<option value="${p.id}" ${p.id === pid ? 'selected' : ''}>${UI.esc(p.name)} · ${UI.esc(p.side)}侧 · ${UI.esc(p.version)}</option>`).join('')}
      </select>
      <button class="btn primary" data-ab-run ${ab.loading || !items.length ? 'disabled' : ''}>${w.icon('play', 13)}${ab.loading ? '对比中' : '运行对比'}</button>
      ${st}
      <div class="ab-note">同一批 5 条载荷，在关闭/开启两种条件下各跑一遍，用净收益判断插件是否值得开</div>
    </div>
    <div id="ab-out">${ab.loading
      ? UI.empty('正在运行对比', '同一批载荷正在插件关闭与开启两种条件下回放')
      : r ? abResult(r)
        : ab.error ? UI.note(UI.esc(ab.error), 'warn')
          : UI.empty('选择插件后点击「运行对比」')}</div>`;
  }

  function view(p) {
    const items = p.items || [];
    const policy = Object.assign({ scope: '会话级', maxPlugins: 8, timeout: 2000, mode: 'fail-close' }, p.policy || {});
    const inItems = items.filter((x) => x.side === '输入');
    const outItems = items.filter((x) => x.side === '输出');
    const inHits = sum(inItems, (x) => x.hits);
    const outHits = sum(outItems, (x) => x.hits);
    const total = inHits + outHits;
    const pctIn = total ? Math.round((inHits / total) * 1000) / 10 : 0;
    const enabled = items.filter((x) => x.status === '启用');
    const chain = sum(enabled, (x) => x.latency);
    const sorted = items.slice().sort((a, b) => b.hits - a.hits);
    const donutHtml = Charts.donut([
      { k: '输入侧', v: inHits, color: C.brand },
      { k: '输出侧', v: outHits, color: C.violet }
    ], { size: 130, thickness: 11, center: total.toLocaleString('zh-CN'), centerSub: '次拦截' });
    return `
      ${UI.pageHd({
        title: '防护插件',
        sub: `输入侧与输出侧插件 · 共 ${items.length} 个 · ${enabled.length} 个在线 · 串联时延 ${chain}ms`,
        actions: `<button class="btn" data-refresh>${w.icon('refresh', 14)}刷新</button>`
      })}
      <div class="stack">
        ${kpis(items, policy)}
        <div class="split">
          ${UI.card({
            flush: true,
            title: '插件链路', sub: '按输入侧 → 输出侧顺序执行',
            right: `<span class="pill gray">${inItems.length} 输入 · ${outItems.length} 输出</span>`,
            body: `<div class="plug-hd"><span>插件</span><span>侧别</span><span class="r">命中</span><span class="r">时延</span><span class="r">状态</span></div>
              ${pluginRows(items)}`
          })}
          ${policyCard(p, items, policy)}
        </div>
        ${UI.card({
          title: '插件效果 A/B 对比', sub: '关闭与开启两种条件下回放同一批载荷',
          right: items.length ? `<span class="pill gray">${items.length} 个插件可选</span>` : '',
          body: `<div id="ab-wrap">${abInner(p.ab, items)}</div>`
        })}
        <div class="grid g-2">
          ${UI.card({
            title: '拦截量排行', sub: '按插件累计命中次数',
            right: `<span class="pill brand">合计 ${total.toLocaleString('zh-CN')} 次</span>`,
            body: barRank(sorted)
          })}
          ${UI.card({
            title: '侧别拦截结构', sub: '输入侧与输出侧拦截占比',
            body: `<div class="sidewrap">${donutHtml}</div>
              <div style="margin-top:6px">
                <div class="side-row"><i class="sdot" style="background:${C.brand}"></i><span class="sk">输入侧 · ${inItems.length} 个插件</span>
                  <span class="sv">${inHits.toLocaleString('zh-CN')}<small> 次</small></span><span class="sm">${pctIn}%</span></div>
                <div class="side-row"><i class="sdot" style="background:${C.violet}"></i><span class="sk">输出侧 · ${outItems.length} 个插件</span>
                  <span class="sv">${outHits.toLocaleString('zh-CN')}<small> 次</small></span><span class="sm">${(100 - pctIn).toFixed(1)}%</span></div>
                <div class="side-foot">输入侧均耗 ${Math.round(sum(inItems, (x) => x.latency) / (inItems.length || 1))}ms · 输出侧均耗 ${Math.round(sum(outItems, (x) => x.latency) / (outItems.length || 1))}ms · 链路串联 ${chain}ms</div>
              </div>`
          })}
        </div>
      </div>`;
  }

  w.Pages = w.Pages || {};
  w.Pages.defense = {
    async mount(root) {
      if (!document.getElementById('pg-defense')) {
        const s = document.createElement('style'); s.id = 'pg-defense'; s.textContent = STYLE;
        document.head.appendChild(s);
      }
      const page = this;
      page.items = [];
      page.policy = null;
      page.scope = null;
      page.alive = true;
      page.ab = { pid: null, data: null, loading: false, error: '' };

      page.load = async () => {
        const d = await API.get('/api/defense');
        page.items = d.items || [];
        page.policy = Object.assign({ scope: '会话级', maxPlugins: 8, timeout: 2000, mode: 'fail-close' }, d.policy || {});
        page.scope = page.policy.scope;
        if (!page.ab.pid || !page.items.some((p) => p.id === page.ab.pid)) {
          page.ab.pid = (page.items[0] || {}).id || null;
        }
      };

      page.bindAb = () => {
        const sel = root.querySelector('#ab-plug');
        if (sel) sel.onchange = () => {
          page.ab.pid = +sel.value;
          page.ab.data = null;
          page.ab.error = '';
          page.renderAb();
        };
        const run = root.querySelector('[data-ab-run]');
        if (run) run.onclick = async () => {
          const el = root.querySelector('#ab-plug');
          if (el) page.ab.pid = +el.value;
          if (!page.ab.pid) { UI.toast('暂无可对比的插件', 'err'); return; }
          page.ab.loading = true;
          page.ab.error = '';
          page.renderAb();
          try {
            const r = await API.post('/api/defense/ab', { plugin_id: page.ab.pid });
            if (!page.alive) return;
            page.ab.data = r;
            page.ab.loading = false;
            page.renderAb();
            UI.toast(`对比完成：新增拦截 ${r.deltaBlocked} 条 · 净增时延 ${((r.latencyOn || 0) - (r.latencyOff || 0)).toFixed(2)} ms`);
          } catch (e) {
            if (!page.alive) return;
            page.ab.loading = false;
            page.ab.error = '对比失败：' + (e.message || e);
            page.renderAb();
            UI.toast('对比失败：' + (e.message || e), 'err');
          }
        };
      };

      page.renderAb = () => {
        const wrap = root.querySelector('#ab-wrap');
        if (!wrap) return;
        wrap.innerHTML = abInner(page.ab, page.items);
        page.bindAb();
      };

      page.render = () => {
        root.innerHTML = view({ items: page.items, policy: Object.assign({}, page.policy, { scope: page.scope }), ab: page.ab });
        page.bindAb();
        root.querySelectorAll('[data-seg]').forEach((b) => b.onclick = () => {
          page.scope = b.dataset.seg;
          root.querySelectorAll('[data-seg]').forEach((x) => x.classList.toggle('on', x === b));
        });
        root.querySelectorAll('[data-sw]').forEach((b) => b.onclick = async () => {
          const id = +b.dataset.sw;
          const p = page.items.find((x) => x.id === id);
          b.disabled = true;
          try {
            const r = await API.post('/api/defense/plugins/' + id + '/toggle', {});
            UI.toast(`${p ? p.name : '插件'}已${r.status === '启用' || r.status === true ? '启用' : '停用'}`);
            await page.load();
            page.render();
          } catch (e) {
            UI.toast('操作失败：' + e.message, 'err');
            b.disabled = false;
          }
        });
        const save = root.querySelector('[data-save]');
        if (save) save.onclick = async () => {
          const maxEl = root.querySelector('#p-max');
          const toEl = root.querySelector('#p-to');
          const modeEl = root.querySelector('#p-mode');
          const maxPlugins = parseInt(maxEl.value, 10);
          const timeout = parseInt(toEl.value, 10);
          if (!maxPlugins || maxPlugins < 1 || maxPlugins > 16) { UI.toast('最大插件数需在 1 - 16 之间', 'err'); maxEl.focus(); return; }
          if (!timeout || timeout < 200 || timeout > 10000) { UI.toast('总超时需在 200 - 10000 ms 之间', 'err'); toEl.focus(); return; }
          save.disabled = true;
          try {
            await API.post('/api/defense/policy', {
              scope: page.scope, maxPlugins, timeout, mode: modeEl.value
            });
            page.policy = Object.assign({}, page.policy, { scope: page.scope, maxPlugins, timeout, mode: modeEl.value });
            UI.toast('策略已保存并下发至网关');
            page.render();
          } catch (e) {
            UI.toast('保存失败：' + e.message, 'err');
            save.disabled = false;
          }
        };
        const rf = root.querySelector('[data-refresh]');
        if (rf) rf.onclick = async () => {
          rf.disabled = true;
          try { await page.load(); page.render(); UI.toast('防护链路数据已刷新'); }
          catch (e) { UI.toast('刷新失败：' + e.message, 'err'); rf.disabled = false; }
        };
      };

      await page.load();
      page.render();
      return () => { page.alive = false; };
    }
  };
})(window);
