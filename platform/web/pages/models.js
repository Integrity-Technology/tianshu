/* ============================================================================
   模型网关：接口接入 / 连通性校验 / 成本归集
   ========================================================================== */
(function (w) {
  const { UI, API, Charts } = w;
  const C = Charts.pal;
  const TABS = ['模型接口', '防火墙接口', '场景接口'];
  const PROTO = { openai: 'OpenAI 兼容', private: '厂商私有', anthropic: 'Anthropic', http: 'HTTP' };
  const KIND = { chat: '对话模型', embed: '向量模型', guard: '防护网关', scene: '场景服务' };

  const STYLE = `
  .tb{display:flex;align-items:center;gap:2px;padding:0 12px;border-bottom:1px solid var(--line);background:var(--surface)}
  .tb button{position:relative;padding:11px 12px 10px;font-size:12.5px;font-weight:540;color:var(--text-2);
    border-bottom:2px solid transparent;margin-bottom:-1px;display:flex;align-items:center;gap:6px;transition:color .15s}
  .tb button:hover{color:var(--text)}
  .tb button.on{color:var(--text);font-weight:600;border-bottom-color:var(--brand)}
  .tb .n{font-size:10.5px;font-weight:600;color:var(--text-3);background:#F1F3F7;border-radius:20px;padding:0 6px;line-height:16px;min-width:18px;text-align:center}
  .tb button.on .n{background:var(--brand-050);color:var(--brand-600)}
  .ep{font-family:var(--mono);font-size:11px;color:var(--text-2);max-width:230px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .cell-t{font-size:12.5px;font-weight:560;letter-spacing:-.01em}
  .cell-s{font-size:11px;color:var(--text-3);margin-top:2px}
  .proto{font-family:var(--mono);font-size:10.5px;color:var(--text-2);background:var(--surface-2);
    border:1px solid var(--line);border-radius:6px;padding:1.5px 6px;display:inline-block;white-space:nowrap}
  .lat{display:flex;align-items:center;gap:8px}
  .lat .n{width:48px;text-align:right;font-size:12px;font-weight:560;font-variant-numeric:tabular-nums}
  .lat .n small{font-size:9.5px;color:var(--text-3);font-weight:400;margin-left:1px}
  .latbar{width:62px;flex:0 0 62px;height:5px;border-radius:4px;background:#EDF0F6;overflow:hidden}
  .latbar i{display:block;height:100%;border-radius:4px}
  .latbar i.fast{background:#0B9E6E}
  .latbar i.mid{background:#2C55E6}
  .latbar i.slow{background:#D98A1B}
  .latbar i.bad{background:#D93B3B}
  .succ{display:flex;align-items:center;gap:8px}
  .succ .bar{width:50px;flex:0 0 50px;height:5px}
  .succ .n{width:40px;font-size:12px;font-weight:560;font-variant-numeric:tabular-nums}
  .act-cell{display:flex;justify-content:flex-end}
  .bud-top{display:flex;align-items:flex-end;gap:10px;margin-bottom:12px}
  .bud-top .k{font-size:11px;color:var(--text-3);margin-bottom:3px}
  .bud-top .v{font-size:25px;font-weight:650;letter-spacing:-.035em;line-height:1.05}
  .bud-top .v small{font-size:11.5px;font-weight:500;color:var(--text-3);margin-left:3px;letter-spacing:0}
  .bud-top .pct{margin-left:auto;font-size:12px;font-weight:600;color:var(--brand);background:var(--brand-050);
    border-radius:20px;padding:2px 8px}
  .bud-spark{display:flex;align-items:center;gap:10px;margin-top:11px;padding-top:11px;border-top:1px solid var(--line-2)}
  .bud-spark .lab{font-size:11px;color:var(--text-3);white-space:nowrap}
  .depts{display:flex;flex-direction:column;gap:6px;margin-top:10px}
  .dept{display:flex;align-items:center;gap:8px;font-size:11.5px;color:var(--text-2)}
  .dept .dl{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .dept .dv{font-variant-numeric:tabular-nums;color:var(--text);font-weight:550}
  .legend-t{font-size:11px;color:var(--text-3);margin-top:12px;padding-top:10px;border-top:1px solid var(--line-2);line-height:1.7}
  `;

  const sum = (arr, f) => arr.reduce((s, x) => s + (f(x) || 0), 0);
  const minmax = (arr, f) => {
    const v = arr.map(f).filter((x) => x != null);
    return v.length ? [Math.min(...v), Math.max(...v)] : [0, 0];
  };
  const fmtTok = (n) => {
    n = Number(n);
    if (!Number.isFinite(n)) return ['—', 'Token'];
    if (n >= 1e8) return [(n / 1e8).toFixed(2), '亿 Token'];
    if (n >= 1e4) return [Math.round(n / 1e4).toLocaleString('zh-CN'), '万 Token'];
    return [UI.num(n), 'Token'];
  };

  function kpis(items, cost) {
    const total = items.length;
    const avgLat = Math.round(sum(items, (m) => m.latency) / (total || 1));
    const avgSucc = (sum(items, (m) => m.success_rate) / (total || 1)).toFixed(1);
    const inTok = sum(items, (m) => m.in_tokens);
    const outTok = sum(items, (m) => m.out_tokens);
    const [tk, tu] = fmtTok(inTok + outTok);
    const totalCost = cost ? cost.total : sum(items, (m) => m.cost);
    const top = items.slice().sort((a, b) => b.cost - a.cost)[0] || { cost: 0 };
    const [latMin, latMax] = minmax(items, (m) => m.latency);
    const low = items.filter((m) => m.success_rate < 97).length;
    const cats = TABS.map((t) => `${t.replace('接口', '')} ${items.filter((m) => m.category === t).length}`).join(' · ');
    return `<div class="grid g-5">
      ${UI.kpi({ label: '接口总数', value: total, unit: '个', meta: cats })}
      ${UI.kpi({ label: '平均时延', value: avgLat.toLocaleString('zh-CN'), unit: 'ms', meta: `最快 ${latMin}ms · 最慢 ${latMax}ms` })}
      ${UI.kpi({ label: '平均成功率', value: avgSucc, unit: '%', meta: low ? `低于 97% 的接口 ${low} 个` : '全部接口高于 97%' })}
      ${UI.kpi({ label: 'Token 总量', value: tk, unit: tu, meta: `输入 ${(inTok / 1e4).toFixed(0)} 万 · 输出 ${(outTok / 1e4).toFixed(0)} 万` })}
      ${UI.kpi({ label: '累计费用', value: UI.money(totalCost), unit: '', meta: `单位：元 · 单接口最高 ${UI.money(top.cost)}` })}
    </div>`;
  }

  function tabsHTML(items, active) {
    return `<div class="tb">${TABS.map((t) => {
      const n = items.filter((m) => m.category === t).length;
      return `<button data-tab="${t}" class="${t === active ? 'on' : ''}">${t}<span class="n">${n}</span></button>`;
    }).join('')}</div>`;
  }

  function latCell(m, maxLat) {
    const lat = m.latency || 0;
    const pct = Math.max(3, Math.round((lat / (maxLat || 1)) * 100));
    const tone = lat <= 300 ? 'fast' : lat <= 1200 ? 'mid' : lat <= 2000 ? 'slow' : 'bad';
    return `<div class="lat" title="响应 ${lat}ms"><span class="n">${lat}<small>ms</small></span>
      <span class="latbar"><i class="${tone}" style="width:${pct}%"></i></span></div>`;
  }

  function succCell(m) {
    const r = Number(m.success_rate);
    const pct = Number.isFinite(r) ? Math.max(0, Math.min(100, r)) : 0;
    const tone = r >= 99 ? 'ok' : r < 95 ? 'danger' : r < 97.5 ? 'warn' : '';
    return `<div class="succ" title="成功率 ${UI.num(pct)}% · 按 0–100% 绝对比例"><span class="bar ${tone}"><i style="width:${pct}%"></i></span>
      <span class="n">${UI.num(pct)}%</span></div>`;
  }

  function rowsHTML(list, items) {
    if (!list.length) {
      const none = !items.length;
      return `<tr><td colspan="10"><div style="padding:10px 0 18px">${UI.empty(
        none ? '还没有接入任何接口' : '该类别暂无接口',
        none ? '被测模型是攻击与评估的前置条件。可接入 OpenAI / DeepSeek / 通义 / 本地 Ollama，也可先用内置靶标体验。'
             : '切换页签或新增接口后即可在此管理',
        `<div class="row" style="justify-content:center;gap:8px;margin-top:12px">
          <button class="btn primary" data-empty-new>${w.icon('plus', 13)}接入第一个模型</button>
          <button class="btn" data-empty-builtin>${w.icon('bolt', 13)}使用内置靶标</button>
          <button class="btn ghost" data-help>配置说明</button>
        </div>`)}</div></td></tr>`;
    }
    const maxLat = Math.max(1, ...items.map((m) => m.latency || 0));
    return list.map((m) => {
      const v = m.verified === '通过';
      return `<tr data-id="${m.id}">
        <td><div class="cell-t">${UI.esc(m.name)}</div>
          <div class="cell-s">${UI.esc(m.vendor)} · ${KIND[m.kind] || UI.esc(m.kind)}${m.model_id ? ' · ' + UI.esc(m.model_id) : ''}</div></td>
        <td><span class="proto">${PROTO[m.protocol] || UI.esc(m.protocol)}</span></td>
        <td><div class="ep" title="${UI.esc(m.endpoint)}">${UI.esc(m.endpoint)}</div></td>
        <td>${latCell(m, maxLat)}</td>
        <td>${succCell(m)}</td>
        <td style="text-align:right;font-weight:560" class="num">${UI.esc(m.tokens)}</td>
        <td style="text-align:right;font-weight:560" class="num">${UI.money(m.cost)}</td>
        <td>${UI.pill(v ? '通过' : '未校验', v ? 'ok' : 'warn')}</td>
        <td>${UI.pill(m.status)}</td>
        <td><div class="act-cell" style="gap:4px"><button class="btn sm" data-probe="${m.id}">校验</button>
          <button class="btn sm" data-edit="${m.id}">编辑</button>
          <button class="btn sm ghost" data-del="${m.id}" title="删除接口">删除</button></div></td>
      </tr>`;
    }).join('');
  }

  function protoDonut(items) {
    const order = ['openai', 'private', 'anthropic', 'http'];
    const colors = [C.brand, C.violet, C.cyan, C.warn];
    const data = order
      .map((p, i) => ({ k: PROTO[p], v: items.filter((m) => m.protocol === p).length, color: colors[i] }))
      .filter((d) => d.v > 0);
    if (!data.length) return UI.empty('暂无协议数据', '新增接口后自动汇总');
    return Charts.donut(data, { size: 126, thickness: 11, center: items.length, centerSub: '个接口' });
  }

  function costErrorCard(title, sub, err) {
    return UI.card({
      title, sub,
      body: UI.empty('成本数据加载失败', String(err || '服务不可用'),
        '<button class="btn primary" data-cost-retry>重试</button>')
    });
  }

  function costCard(cost, err) {
    if (err) return costErrorCard('成本排行', '按模型归集 · 单位：元', err);
    if (!cost || !cost.models || !cost.models.length) return UI.card({ title: '成本排行', sub: '按模型归集 · 单位：元', body: UI.empty('暂无成本数据', '成本数据将在接口产生调用后汇总') });
    const data = cost.models.map((m) => ({ k: m.name, v: Number(m.cost) || 0, color: C.brand }));
    return UI.card({
      title: '成本排行', sub: '按模型累计费用 · 单位：元',
      right: `<span class="pill gray">合计 ${UI.money(cost.total)}</span>`,
      body: Charts.hbars(data, { labelW: 116, valW: 88, unit: ' 元', h: 7, gap: 12, fmt: UI.money })
    });
  }

  function budgetCard(cost, err) {
    if (err) return costErrorCard('预算执行', '本月 · 单位：元', err);
    if (!cost) return UI.card({ title: '预算执行', sub: '本月 · 单位：元', body: UI.empty('暂无预算数据', '预算服务未返回结果') });
    const pct = cost.budget ? Math.round((cost.used / cost.budget) * 1000) / 10 : 0;
    const tone = pct > 85 ? 'danger' : pct > 70 ? 'warn' : '';
    const series = (cost.series || []).map((s) => ({ v: s.v, k: s.d }));
    const spark = series.length ? Charts.spark(series.map((s) => s.v)) : '';
    const depts = (cost.depts || cost.items || []).slice(0, 4).map((d) => `<div class="dept">
      <span class="dl">${UI.esc(d.name)}</span><span class="dv">${UI.money(d.cost)}</span></div>`).join('');
    return UI.card({
      title: '预算执行', sub: '平台 Token 费用月度预算 · 单位：元',
      right: `<span class="pill ${tone === 'danger' ? 'danger' : tone === 'warn' ? 'warn' : 'ok'}">${pct}%</span>`,
      body: `<div class="bud-top">
          <div><div class="k">本月已用</div><div class="v">${UI.money(cost.used)}</div></div>
          <div class="pct num">${pct}%</div>
        </div>
        <div class="bar ${tone}"><i style="width:${Math.max(0, Math.min(100, pct))}%"></i></div>
        <div class="row between tiny dim" style="margin-top:7px">
          <span>预算 ${UI.money(cost.budget)}</span><span>剩余 ${UI.money((Number(cost.budget) || 0) - (Number(cost.used) || 0))}</span>
        </div>
        ${spark ? `<div class="bud-spark"><span class="lab">近 12 日</span>${spark}<span class="dim" style="font-size:10.5px;margin-left:auto">元 / 日</span></div>` : ''}
        ${depts ? `<div class="depts">${depts}</div>` : ''}`
    });
  }

  function view(p) {
    const items = p.items || [];
    const q = (p.q || '').toLowerCase();
    const list = items.filter((m) => m.category === p.tab &&
      (!q || (m.name + m.vendor + m.endpoint + m.protocol).toLowerCase().includes(q)));
    const active = list.filter((m) => m.status === '启用').length;
    return `
      ${UI.pageHd({
        title: '模型网关',
        sub: `被测模型、防护网关与场景服务 · 连通性探测与 Token 计量 · 共 ${items.length} 个接口`,
        actions: `<button class="btn" data-help>${w.icon('shield', 14)}配置说明</button>
          <button class="btn" data-refresh>${w.icon('refresh', 14)}刷新</button>
          <button class="btn primary" data-new>${w.icon('plus', 14)}新增接口</button>`
      })}
      <div class="stack">
        ${kpis(items, p.cost)}
        ${UI.card({
          flush: true,
          body: `${tabsHTML(items, p.tab)}
            <div class="tbl-toolbar" style="border-bottom:0">
              <span class="dim" style="font-size:11.5px">共 ${list.length} 个 · 启用 ${active} 个 · 停用 ${list.length - active} 个</span>
              <span class="pill gray">探测成功率 ${list.length ? (sum(list, (m) => m.success_rate) / list.length).toFixed(1) : '0.0'}%</span>
              <div class="searchbox sm" style="margin-left:auto">${w.icon('search', 13)}<input id="mq" placeholder="搜索名称 / 厂商 / Endpoint" value="${UI.esc(p.q || '')}"></div>
            </div>
            <div class="tbl-wrap"><table class="tbl">
              <thead><tr>
                <th>接口名称</th><th style="width:104px">协议</th><th style="width:238px">Endpoint</th>
                <th style="width:126px">时延</th><th style="width:118px">成功率</th>
                <th style="width:96px;text-align:right">Token</th><th style="width:104px;text-align:right">费用</th>
                <th style="width:88px">校验结果</th><th style="width:80px">状态</th><th style="width:168px;text-align:right">操作</th>
              </tr></thead>
              <tbody>${rowsHTML(list, items)}</tbody>
            </table></div>`
        })}
        <div class="grid" style="grid-template-columns:1.3fr 1fr .82fr">
          ${costCard(p.cost, p.costError)}
          ${budgetCard(p.cost, p.costError)}
          ${UI.card({
            title: '协议构成', sub: '按接入协议统计',
            body: protoDonut(items) + `<div class="legend-t">共 ${items.length} 个接口接入网关，OpenAI 兼容协议占比最高，新增接口默认按所选协议路由。</div>`
          })}
        </div>
      </div>`;
  }

  function field(label, inner, hint) {
    return `<label>${label}${inner}${hint ? `<span class="hint" style="font-size:10.5px;color:var(--text-3);font-weight:400;margin-top:3px">${hint}</span>` : ''}</label>`;
  }

  function newModal(page, existing) {
    const edit = !!existing;
    const m = existing || {};
    const cat0 = m.category || page.tab || '模型接口';
    const ui = UI.modal({
      title: edit ? '编辑模型接口' : '接入被测模型',
      okText: edit ? '保存并校验' : '创建并校验',
      cancelText: '取消',
      body: `<div class="form">
        <div class="note" style="margin-bottom:2px">被测模型是攻击任务与评估的必需项。填错任何一项都会导致「校验未通过」，可先点下方「使用内置靶标」跳过外部依赖。</div>
        <div class="row" style="gap:12px">
          ${field('显示名称 *', `<input class="input" id="f-name" placeholder="例如：DeepSeek 生产">`)}
          ${field('厂商', `<input class="input" id="f-vendor" placeholder="例如：DeepSeek / 阿里云 / 自建">`)}
        </div>
        <div class="row" style="gap:12px">
          ${field('接口类别', `<select class="select" id="f-cat">${TABS.map((t) => `<option value="${t}">${t}</option>`).join('')}</select>`)}
          ${field('协议模板', `<select class="select" id="f-proto">
            <option value="openai">OpenAI 兼容</option>
            <option value="private">厂商私有</option>
            <option value="anthropic">Anthropic</option>
            <option value="http">自定义 HTTP</option>
          </select>`)}
        </div>
        ${field('Endpoint *', `<input class="input mono" id="f-ep" placeholder="https://api.deepseek.com/chat/completions">`, '完整对话接口地址，需以 http(s):// 开头')}
        <div class="row" style="gap:12px">
          ${field('模型标识', `<input class="input mono" id="f-model" placeholder="deepseek-chat">`, '调用时传给上游的 model 字段')}
          ${field('鉴权方式', `<select class="select" id="f-auth">
            <option value="bearer">Bearer Token（Authorization）</option>
            <option value="x-api-key">X-API-Key（Anthropic 等）</option>
            <option value="none">无需鉴权</option>
          </select>`)}
        </div>
        ${field('API Key', `<input class="input mono" id="f-key" type="password" autocomplete="new-password" placeholder="${edit && m.has_key ? '已保存 ' + UI.esc(m.api_key_masked || '') + '，留空不修改' : 'sk-...'}">`, '仅保存在本机数据库；接口返回时脱敏，不会回显明文')}
        <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:2px">
          <button type="button" class="btn sm" data-preset="deepseek">DeepSeek</button>
          <button type="button" class="btn sm" data-preset="qwen">通义千问</button>
          <button type="button" class="btn sm" data-preset="openai">OpenAI</button>
          <button type="button" class="btn sm" data-preset="ollama">本地 Ollama</button>
          <button type="button" class="btn sm" data-preset="mock">内置靶标</button>
        </div>
        <div class="note" id="f-hint">示例：DeepSeek 填 <code>https://api.deepseek.com/chat/completions</code>，模型标识 <code>deepseek-chat</code>；Ollama 填 <code>http://127.0.0.1:11434/v1/chat/completions</code>，模型标识 <code>qwen2.5:7b</code>，鉴权选「无需鉴权」。</div>
        ${edit && m.has_key ? `<label class="row" style="gap:8px;align-items:center;font-weight:400"><input type="checkbox" id="f-clear"> 清空已保存的 API Key</label>` : ''}
      </div>`,
      onOk: async (el) => {
        const name = el.querySelector('#f-name').value.trim();
        const endpoint = el.querySelector('#f-ep').value.trim();
        const body = {
          name,
          vendor: el.querySelector('#f-vendor').value.trim() || '自建',
          category: el.querySelector('#f-cat').value,
          protocol: el.querySelector('#f-proto').value,
          endpoint,
          model_id: el.querySelector('#f-model').value.trim(),
          auth_type: el.querySelector('#f-auth').value,
          api_key: el.querySelector('#f-key').value.trim(),
          kind: el.querySelector('#f-cat').value === '防火墙接口' ? 'guard'
            : el.querySelector('#f-cat').value === '场景接口' ? 'scene' : 'chat'
        };
        if (!name) { UI.toast('请填写显示名称', 'err'); return false; }
        if (!/^https?:\/\/.+/.test(endpoint)) { UI.toast('Endpoint 需以 http(s):// 开头', 'err'); return false; }
        const clear = el.querySelector('#f-clear');
        if (clear && clear.checked) body.clear_key = true;
        try {
          const r = edit ? await API.put('/api/models/' + m.id, body) : await API.post('/api/models', body);
          const mid = edit ? m.id : (r && r.id);
          UI.toast(edit ? '接口已保存，正在校验…' : '接口已创建，正在校验…');
          if (mid) {
            try {
              const pr = await API.post('/api/models/' + mid + '/probe', {});
              UI.toast(pr && pr.verified === '通过' ? '校验通过，可用于攻击与评估' : '已保存，但校验未通过：请检查 Endpoint、模型标识与 API Key', pr && pr.verified === '通过' ? 'ok' : 'err');
            } catch (e2) {
              UI.toast('已保存，但校验失败：' + (e2.message || e2), 'err');
            }
          }
          await page.load();
          page.render();
        } catch (e) {
          UI.toast('保存失败：' + (e.message || e), 'err');
          return false;
        }
      }
    });
    const el = ui.el;
    el.querySelector('#f-cat').value = cat0;
    el.querySelector('#f-proto').value = m.protocol || 'openai';
    el.querySelector('#f-auth').value = m.auth_type || 'bearer';
    el.querySelector('#f-vendor').value = m.vendor || '';
    el.querySelector('#f-ep').value = m.endpoint || '';
    el.querySelector('#f-model').value = m.model_id || '';
    el.querySelector('#f-name').value = m.name || '';
    const PRESETS = {
      deepseek: { ep: 'https://api.deepseek.com/chat/completions', mid: 'deepseek-chat', proto: 'openai', auth: 'bearer', vendor: 'DeepSeek' },
      qwen: { ep: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', mid: 'qwen-plus', proto: 'openai', auth: 'bearer', vendor: '阿里云' },
      openai: { ep: 'https://api.openai.com/v1/chat/completions', mid: 'gpt-4o-mini', proto: 'openai', auth: 'bearer', vendor: 'OpenAI' },
      ollama: { ep: 'http://127.0.0.1:11434/v1/chat/completions', mid: 'qwen2.5:7b', proto: 'openai', auth: 'none', vendor: '本地 Ollama' },
      mock: { ep: location.origin + '/mock/v1/chat/completions', mid: 'target-l2', proto: 'openai', auth: 'none', vendor: '平台内置' }
    };
    const authEl = el.querySelector('#f-auth');
    if (authEl) authEl.onchange = () => {
      const key = el.querySelector('#f-key');
      if (key) key.placeholder = authEl.value === 'none' ? '无需鉴权，可留空'
        : (edit && m.has_key ? '已保存 ' + (m.api_key_masked || '') + '，留空不修改' : 'sk-...');
    };
    el.querySelectorAll('[data-preset]').forEach((b) => b.onclick = () => {
      const p = PRESETS[b.dataset.preset]; if (!p) return;
      el.querySelector('#f-ep').value = p.ep;
      el.querySelector('#f-model').value = p.mid;
      el.querySelector('#f-proto').value = p.proto;
      el.querySelector('#f-auth').value = p.auth;
      el.querySelector('#f-vendor').value = p.vendor;
      if (p.auth === 'none') el.querySelector('#f-key').value = '';
    });
    return ui;
  }

  function openHelp() {
    UI.drawer({
      title: '模型网关配置说明', sub: '被测模型接入的 4 个关键字段', width: '640px',
      body: `<div style="font-size:12.5px;line-height:1.85;color:var(--text-2)">
        <div class="note">被测模型 = 你要测试的大模型服务。平台不内置真实模型额度，需要你提供 Endpoint 与 API Key；也可以用「内置靶标」做流程体验。</div>
        <h4 style="margin:16px 0 6px;color:var(--text)">1. Endpoint 填什么</h4>
        <p>填完整的 Chat Completions 地址，不是 Base URL。OpenAI 兼容服务通常以 <code>/v1/chat/completions</code> 结尾：</p>
        <ul style="margin:6px 0 0 18px;padding:0">
          <li>DeepSeek：<code>https://api.deepseek.com/chat/completions</code></li>
          <li>OpenAI：<code>https://api.openai.com/v1/chat/completions</code></li>
          <li>通义千问：<code>https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions</code></li>
          <li>本地 Ollama：<code>http://127.0.0.1:11434/v1/chat/completions</code></li>
          <li>内置靶标：<code>${UI.esc(location.origin)}/mock/v1/chat/completions</code></li>
        </ul>
        <h4 style="margin:16px 0 6px;color:var(--text)">2. 模型标识填什么</h4>
        <p>填上游 API 的 <code>model</code> 参数，例如 <code>deepseek-chat</code>、<code>gpt-4o-mini</code>、<code>qwen-plus</code>、<code>qwen2.5:7b</code>。不是页面上的显示名称。</p>
        <h4 style="margin:16px 0 6px;color:var(--text)">3. 鉴权怎么选</h4>
        <p>OpenAI 兼容服务选 <b>Bearer Token</b>；Anthropic 选 <b>X-API-Key</b>；本地 Ollama 或内置靶标选 <b>无需鉴权</b>。API Key 只保存在本机数据库，列表与接口返回均脱敏。</p>
        <h4 style="margin:16px 0 6px;color:var(--text)">4. 保存后为什么还要校验</h4>
        <p>「校验」会真实请求一次上游并检查响应结构。校验通过才代表网络、地址、模型标识、Key 四项都正确；失败时按 toast 提示逐项排查。</p>
        <div class="row" style="margin-top:16px;gap:8px"><button class="btn primary" data-help-close>知道了</button></div>
      </div>`,
      footer: `<button class="btn" data-help-close>关闭</button>`,
      onClose: () => {}
    }).el.querySelectorAll('[data-help-close]').forEach((b) => b.onclick = () => {
      const sc = document.querySelector('.scrim.show'); if (sc) sc.click();
    });
  }


  w.Pages = w.Pages || {};
  w.Pages.models = {
    async mount(root) {
      if (!document.getElementById('pg-models')) {
        const s = document.createElement('style'); s.id = 'pg-models'; s.textContent = STYLE;
        document.head.appendChild(s);
      }
      const page = this;
      page.root = root;
      page.tab = '模型接口';
      page.q = '';
      page.items = [];
      page.cost = null;
      page.costError = '';

      page.loadCost = async () => {
        try {
          // /api/cost 当前 500；/api/cost/report 与其共用「元」口径且返回完整预算/模型费用
          page.cost = await API.get('/api/cost/report?dim=dept');
          page.costError = '';
        } catch (e) {
          page.cost = null;
          page.costError = (e && e.message) || '成本接口不可用';
        }
      };
      page.load = async () => {
        const md = await API.get('/api/models');
        page.items = (md && md.items) || [];
        await page.loadCost();
      };

      page.render = () => {
        if (!root.isConnected) return;
        root.innerHTML = view(page);
        root.querySelectorAll('[data-tab]').forEach((b) => b.onclick = () => {
          page.tab = b.dataset.tab;
          page.render();
        });
        root.querySelectorAll('[data-probe]').forEach((b) => b.onclick = async (ev) => {
          ev.stopPropagation();
          const id = +b.dataset.probe;
          const m = page.items.find((x) => x.id === id);
          b.disabled = true; b.textContent = '校验中';
          try {
            const r = await API.post('/api/models/' + id + '/probe', {});
            UI.toast(`${m ? m.name : '接口'} 校验通过 · 响应 ${r.latency}ms`);
            await page.load();
            page.render();
          } catch (e) {
            UI.toast('校验失败：' + e.message, 'err');
            b.disabled = false; b.textContent = '校验';
          }
        });
        root.querySelectorAll('[data-edit]').forEach((b) => b.onclick = (ev) => {
          ev.stopPropagation();
          const m = page.items.find((x) => x.id === +b.dataset.edit);
          if (m) newModal(page, m);
        });
        root.querySelectorAll('[data-del]').forEach((b) => b.onclick = (ev) => {
          ev.stopPropagation();
          const m = page.items.find((x) => x.id === +b.dataset.del);
          if (!m) return;
          UI.modal({
            title: '删除模型接口', danger: true, okText: '确认删除',
            body: `<div style="font-size:12.5px;line-height:1.8;color:var(--text-2)">确定删除「${UI.esc(m.name)}」？删除后引用该模型的任务/评估历史仍保留，但不能再新建任务。</div>`,
            onOk: async () => {
              try { await API.del('/api/models/' + m.id); UI.toast('接口已删除'); await page.load(); page.render(); }
              catch (e) { UI.toast('删除失败：' + e.message, 'err'); return false; }
            }
          });
        });
        root.querySelectorAll('[data-empty-new]').forEach((b) => b.onclick = () => newModal(page));
        root.querySelectorAll('[data-empty-builtin]').forEach((b) => b.onclick = () => {
          newModal(page);
          setTimeout(() => {
            const el = document.querySelector('.modal');
            if (!el) return;
            const ep = el.querySelector('#f-ep'), md = el.querySelector('#f-model'), au = el.querySelector('#f-auth'), nm = el.querySelector('#f-name'), vd = el.querySelector('#f-vendor');
            if (ep) ep.value = location.origin + '/mock/v1/chat/completions';
            if (md) md.value = 'target-l2';
            if (au) au.value = 'none';
            if (nm && !nm.value) nm.value = '内置靶标（本地）';
            if (vd && !vd.value) vd.value = '平台内置';
          }, 120);
        });
        root.querySelectorAll('[data-help]').forEach((b) => b.onclick = () => openHelp());
        const q = root.querySelector('#mq');
        if (q) q.oninput = (e) => {
          page.q = e.target.value;
          page.render();
          const el = root.querySelector('#mq');
          if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
        };
        root.querySelector('[data-new]').onclick = () => newModal(page);
        root.querySelectorAll('[data-cost-retry]').forEach((cr) => cr.onclick = async () => {
          cr.disabled = true;
          await page.loadCost();
          page.render();
          UI.toast(page.costError ? '成本数据仍不可用' : '成本数据已恢复', page.costError ? 'err' : 'ok');
        });
        root.querySelector('[data-refresh]').onclick = async (ev) => {
          const btn = ev.currentTarget;
          btn.disabled = true;
          try { await page.load(); page.render(); UI.toast('网关数据已刷新'); }
          catch (e) { UI.toast('刷新失败：' + e.message, 'err'); btn.disabled = false; }
        };
      };

      await page.load();
      page.render();
      return () => {};
    }
  };
})(window);
