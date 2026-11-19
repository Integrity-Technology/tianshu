/* ============================================================================
   开放能力：API Key / OpenAPI 文档 / MCP Server / 异步任务 / 安全策略
   ========================================================================== */
(function (w) {
  const { UI, API, Charts } = w;
  const icon = w.icon;
  const esc = w.esc;
  const ORIGIN = (w.location && w.location.origin) ? w.location.origin : 'http://127.0.0.1:8848';
  const API_BASE = ORIGIN + '/v1';
  const MCP_BASE = ORIGIN + '/mcp';
  const API_HOST = ORIGIN.replace(/^https?:\/\//, '');

  const STYLE = `
  .o-tabs{display:flex;gap:4px;border-bottom:1px solid var(--line);margin:0 0 16px}
  .o-tabs button{border:0;background:transparent;padding:10px 13px;font-size:12.5px;color:var(--text-2);cursor:pointer;
    border-bottom:2px solid transparent;margin-bottom:-1px}
  .o-tabs button.on{color:var(--brand);border-bottom-color:var(--brand);font-weight:600}
  .o-scope{font-family:var(--mono);font-size:10.5px;color:#42506A;background:#F2F5FA;border:1px solid #E8ECF3;
    border-radius:5px;padding:1px 6px;white-space:nowrap}
  .o-scel{display:flex;flex-wrap:wrap;gap:4px;max-width:250px}
  .o-key{font-family:var(--mono);font-size:11.5px;color:var(--text)}
  .o-hash{font-family:var(--mono);font-size:10px;color:var(--text-3);margin-top:2px}
  .o-code{border:1px solid #1B2331;border-radius:var(--r);overflow:hidden;background:#0B0F17}
  .o-code-hd{display:flex;align-items:center;gap:8px;padding:7px 12px;background:#141B28;border-bottom:1px solid rgba(255,255,255,.06)}
  .o-dots{display:flex;gap:4px}
  .o-dots i{width:7px;height:7px;border-radius:50%;background:#39445A}
  .o-dots i:first-child{background:#4A3B45}
  .o-code-t{font-family:var(--mono);font-size:10.5px;color:#7E8AA0;letter-spacing:.02em}
  .o-code-hd .btn{margin-left:auto;height:24px;padding:0 8px;font-size:11px;background:rgba(255,255,255,.06);
    border-color:rgba(255,255,255,.12);color:#C9D3E4}
  .o-code-hd .btn:hover{background:rgba(255,255,255,.12)}
  .o-pre{margin:0;padding:13px 14px;background:#0B0F17;color:#C6D0E2;font-family:var(--mono);font-size:11px;
    line-height:1.95;overflow:auto;white-space:pre}
  .o-pre .c-cm{color:#5A6577}
  .o-pre .c-kw{color:#7C9CFF}
  .o-pre .c-fl{color:#D8B26A}
  .o-pre .c-st{color:#5FCFA8}
  .o-mcp{display:grid;grid-template-columns:repeat(3,minmax(0,1fr))}
  .o-mcp-col{padding:4px 16px 14px;border-right:1px solid var(--line-2)}
  .o-mcp-col:last-child{border-right:0}
  .o-mcp-hd{display:flex;align-items:center;gap:8px;padding:8px 0 6px;font-size:12px;font-weight:600}
  .o-mcp-hd .pill{margin-left:auto}
  .o-tool{padding:8px;border-radius:7px;transition:.14s var(--ease);cursor:default}
  .o-tool:hover{background:#F7FAFD}
  .o-tool-n{display:flex;align-items:center;gap:6px;font-family:var(--mono);font-size:11px;color:var(--text);letter-spacing:-.01em}
  .o-tool-n i{width:5px;height:5px;border-radius:2px;background:var(--brand);opacity:.55;flex:0 0 5px}
  .o-tool-d{font-size:11px;color:var(--text-3);margin-top:2px;padding-left:11px}
  .o-mcp-ft{display:flex;align-items:center;gap:18px;padding:9px 16px;border-top:1px solid var(--line-2);
    background:var(--surface-2);font-size:11.5px;color:var(--text-3);flex-wrap:wrap}
  .o-secret{border:1px solid #1B2331;border-radius:var(--r);overflow:hidden;background:#0B0F17}
  .o-secret-hd{display:flex;align-items:center;gap:8px;padding:8px 12px;background:#141B28;border-bottom:1px solid rgba(255,255,255,.06)}
  .o-secret-hd span{font-family:var(--mono);font-size:10.5px;color:#7E8AA0}
  .o-secret pre{margin:0;padding:14px;color:#7FE3B8;font-family:var(--mono);font-size:12px;
    word-break:break-all;user-select:all;line-height:1.7}
  .o-secret-ft{display:flex;align-items:center;gap:10px;padding:10px 12px;border-top:1px solid rgba(255,255,255,.07)}
  .o-secret-ft .btn{height:27px;padding:0 10px;font-size:11.5px;background:rgba(255,255,255,.06);
    border-color:rgba(255,255,255,.14);color:#DCE4F0}
  .o-secret-ft .btn:hover{background:rgba(255,255,255,.12)}
  .o-secret-ft span{font-size:10.5px;color:#6E7A90}
  .o-ep{border-bottom:1px solid var(--line-2)}
  .o-ep:last-child{border-bottom:0}
  .o-ep-hd{display:flex;align-items:center;gap:10px;padding:11px 16px;cursor:pointer}
  .o-ep-hd:hover{background:#FAFBFE}
  .o-mth{font-family:var(--mono);font-size:10px;font-weight:700;letter-spacing:.04em;padding:2px 7px;border-radius:4px;
    background:#EAF0FE;color:#2046C8;flex:0 0 auto}
  .o-mth.post{background:#EAF8F1;color:#0B7F58}
  .o-mth.del{background:#FDEDED;color:#B3261E}
  .o-ep-p{font-family:var(--mono);font-size:11.5px;color:var(--ink);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .o-ep-s{font-size:11.5px;color:var(--text-3);flex:0 0 auto;max-width:330px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .o-ep-bd{padding:0 16px 14px;background:#FCFDFF}
  .o-step{display:flex;gap:11px;padding:9px 0;border-bottom:1px dashed var(--line)}
  .o-step:last-child{border-bottom:0}
  .o-step .sn{flex:0 0 22px;height:22px;border-radius:50%;background:var(--brand-050);color:var(--brand-600);
    font-size:11px;font-weight:600;display:flex;align-items:center;justify-content:center}
  .o-step .st{flex:1}
  .o-step .st b{font-size:12.5px;display:block;margin-bottom:2px}
  .o-step .st .mono{font-size:11px;color:var(--text-2)}
  .o-step .sd{flex:0 0 auto;font-size:11px;color:var(--text-3);max-width:300px;text-align:right}
  .o-frm{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
  .o-frm label{font-size:12px;color:var(--text-2);display:block;margin-bottom:6px}
  .o-frm .full{grid-column:1/-1}
  `;

  const BASE_SCOPES = ['attack:read', 'attack:write', 'eval:read', 'eval:write', 'data:read', 'data:write', 'report:read', 'env:read'];
  const TONE = { '启用': 'ok', '停用': 'gray', '已撤销': 'danger' };
  const parseScopes = (s) => { try { const v = JSON.parse(s || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; } };

  /* ------------------------------------------------------------ 页签一：密钥与调用 */
  function kpis(d) {
    const usage = d.usage || [];
    const today = usage.length ? usage[usage.length - 1].v : 0;
    const sum = usage.reduce((s, u) => s + u.v, 0);
    const active = d.items.filter((k) => k.status === '启用').length;
    const off = d.items.length - active;
    const rpm = d.items.reduce((s, k) => s + (k.rpm || 0), 0);
    const maxRpm = d.items.reduce((s, k) => Math.max(s, k.rpm || 0), 0);
    return `<div class="grid g-4">
      ${UI.kpi({ label: 'API Key', value: d.items.length, unit: '个', meta: `启用 ${active}${off ? ' · 停用/撤销 ' + off : ''}` })}
      ${UI.kpi({ label: 'MCP 工具', value: (d.mcp || []).length, unit: '个', meta: 'JSON-RPC 2.0 · /mcp' })}
      ${UI.kpi({ label: '今日调用', value: UI.num(today), unit: '次', meta: `近 ${usage.length} 日累计 ${UI.num(sum)} 次` })}
      ${UI.kpi({ label: '速率配额', value: UI.num(rpm), unit: 'RPM', meta: `单 Key 上限 ${UI.num(maxRpm)} RPM · ${active} 个启用` })}
    </div>`;
  }

  function keyRows(d) {
    if (!d.items.length) return `<tr><td colspan="7">${UI.empty('暂无 API Key', '点击「生成密钥」创建第一个接入凭证')}</td></tr>`;
    return d.items.map((k) => {
      const scopes = parseScopes(k.scopes);
      const dead = k.status === '已撤销';
      return `<tr${dead ? ' style="opacity:.62"' : ''}>
        <td><div class="t-main">${esc(k.name)}</div>
          <div class="t-sub">创建于 ${esc(String(k.created).slice(0, 10))}</div></td>
        <td><div class="o-key">${esc(k.prefix)}<span style="color:var(--text-3)">…</span></div>
          <div class="o-hash">${esc(String(k.hash || '').length > 26 ? String(k.hash).slice(0, 24) + '…' : k.hash)}</div></td>
        <td><div class="o-scel">${scopes.map((s) => `<span class="o-scope">${esc(s)}</span>`).join('') || '<span class="dim">—</span>'}</div></td>
        <td>${UI.pill(k.status, TONE[k.status] || 'gray')}</td>
        <td class="num" style="text-align:right;color:var(--text-2)">${UI.num(k.rpm)}</td>
        <td><div>${k.last_used ? UI.ago(k.last_used) : '<span class="dim">从未使用</span>'}</div>
          <div class="t-sub mono">${k.last_used ? esc(String(k.last_used).slice(5, 16)) : '—'}</div></td>
        <td class="t-act">${dead ? '<span class="dim" style="font-size:11.5px">已撤销</span>'
          : `<button class="btn sm" data-rotate="${k.id}">${icon('refresh', 12)}重签</button>
             <button class="btn sm danger" data-revoke="${k.id}">${icon('close', 12)}撤销</button>`}</td>
      </tr>`;
    }).join('');
  }

  function trendCard(d) {
    const usage = d.usage || [];
    const vals = usage.map((u) => u.v);
    const sum = vals.reduce((s, v) => s + v, 0);
    const max = vals.length ? Math.max(...vals) : 0;
    const avg = vals.length ? Math.round(sum / vals.length) : 0;
    const svg = Charts.area(usage.map((u) => ({ v: u.v, k: u.d })), { h: 300, color: '#2C55E6' });
    return UI.card({
      title: '调用量趋势', sub: `近 ${usage.length} 日 · 按密钥聚合计次`,
      right: `<span class="pill brand"><i class="dot"></i>峰值 ${UI.num(max)}</span>
        <span class="pill gray">日均 ${UI.num(avg)}</span>`,
      body: `${svg}
        <div class="row between" style="margin-top:8px;font-size:11.5px;color:var(--text-3)">
          <span>单位：次 / 日 · 分钟级聚合，保留 14 天</span><span class="num">区间累计 ${UI.num(sum)} 次</span>
        </div>`
    });
  }

  function codeHTML(prefix) {
    const k = esc(prefix || 'sk-live-0000') + '…';
    return `<span class="c-cm"># 创建攻击任务（异步执行，返回 task_id）</span>
<span class="c-kw">curl</span> <span class="c-fl">-X POST</span> ${esc(API_BASE)}/tasks \\\\
  <span class="c-fl">-H</span> <span class="c-st">"Authorization: Bearer ${k}"</span> \\\\
  <span class="c-fl">-H</span> <span class="c-st">"Content-Type: application/json"</span> \\\\
  <span class="c-fl">-d</span> <span class="c-st">'{"agent_id":3,"model_id":2,"samples":60}'</span>

<span class="c-cm"># 拉取评估报告（五维得分 + 风险发现项）</span>
<span class="c-kw">curl</span> ${esc(API_BASE)}/evals/12/report \\\\
  <span class="c-fl">-H</span> <span class="c-st">"Authorization: Bearer ${k}"</span>`;
  }

  function codePlain(prefix) {
    const k = (prefix || 'sk-live-0000') + '…';
    return `# 创建攻击任务（异步执行，返回 task_id）
curl -X POST ${API_BASE}/tasks \\
  -H "Authorization: Bearer ${k}" \\
  -H "Content-Type: application/json" \\
  -d '{"agent_id":3,"model_id":2,"samples":60}'

# 拉取评估报告（五维得分 + 风险发现项）
curl ${API_BASE}/evals/12/report \\
  -H "Authorization: Bearer ${k}"`;
  }

  function curlCard(d) {
    const first = d.items.find((k) => k.status === '启用') || d.items[0] || {};
    return UI.card({
      title: 'curl 调用示例', sub: 'Bearer Token 认证 · JSON 请求体',
      right: `<span class="pill gray">API v1</span>`,
      body: `<div class="o-code">
          <div class="o-code-hd"><span class="o-dots"><i></i><i></i><i></i></span>
            <span class="o-code-t">bash · ${esc(API_HOST)}</span>
            <button class="btn sm" data-copy="code">${icon('key', 12)}复制</button></div>
          <pre class="o-pre" id="curl-code">${codeHTML(first.prefix)}</pre>
        </div>
        <div class="col" style="gap:7px;margin-top:12px">
          <div class="kv"><span>接入地址</span><b class="mono" style="font-size:11.5px">${esc(API_BASE)}</b></div>
          <div class="kv"><span>认证头</span><b class="mono" style="font-size:11.5px">Authorization: Bearer &lt;key&gt;</b></div>
          <div class="kv"><span>MCP 端点</span><b class="mono" style="font-size:11.5px">${esc(MCP_BASE)}</b></div>
        </div>`
    });
  }

  function quotaCard(d) {
    const bars = Charts.hbars(d.items.map((k) => ({ k: k.name, v: k.rpm, color: k.status === '启用' ? '#2C55E6' : '#94A0B8' })),
      { labelW: 104, valW: 62, unit: ' RPM', gap: 12 });
    return UI.card({
      title: '配额与限速', sub: '每密钥独立限速，超额返回 429',
      right: `<span class="pill gray">${d.items.length} 个密钥</span>`,
      body: `${bars}
        <div class="col" style="gap:7px;margin-top:14px;padding-top:12px;border-top:1px solid var(--line-2)">
          <div class="kv"><span>限速维度</span><b>每密钥 / 每分钟</b></div>
          <div class="kv"><span>密钥摘要</span><b class="mono" style="font-size:11.5px">SHA-256</b></div>
          <div class="kv"><span>超额响应</span><b class="mono" style="font-size:11.5px">429 Too Many Requests</b></div>
        </div>`
    });
  }

  function tabKeys(d) {
    return `<div class="stack">
      ${kpis(d)}
      ${UI.card({
        title: 'API Key', sub: '凭证仅展示前缀，明文不入库；重签会立即失效旧密钥',
        right: `<span class="pill ok"><i class="dot"></i>${d.items.filter((k) => k.status === '启用').length} 个启用</span>
          <button class="btn sm" data-newkey>${icon('key', 13)}生成密钥</button>`,
        flush: true,
        body: `<table class="tbl"><thead><tr>
            <th>名称</th><th style="width:186px">密钥前缀</th><th style="width:238px">权限范围</th>
            <th style="width:78px">状态</th><th style="width:70px;text-align:right">RPM</th>
            <th style="width:112px">最后使用</th><th style="width:150px;text-align:right">操作</th>
          </tr></thead><tbody>${keyRows(d)}</tbody></table>`
      })}
      <div class="split" style="grid-template-columns:1.62fr 1fr">
        ${trendCard(d)}
        ${curlCard(d)}
      </div>
      <div class="split" style="grid-template-columns:1.62fr 1fr">
        ${quotaCard(d)}
        ${UI.card({
          title: '接入位置', sub: '三种方式覆盖流水线、告警平台与 Agent',
          body: `<div class="col" style="gap:10px">
            <div class="kv"><span>RESTful /v1</span><b>OpenAI 风格资源路径</b></div>
            <div class="kv"><span>MCP /mcp</span><b>JSON-RPC 2.0 · 9 个工具</b></div>
            <div class="kv"><span>OpenAPI</span><b class="mono" style="font-size:11.5px">/openapi.json</b></div>
          </div>
          <div class="note" style="margin-top:12px">先在「API 文档」页签试调 GET 接口，再到「MCP 服务」页签查看工具清单与调用示例。</div>`
        })}
      </div>
    </div>`;
  }

  /* ------------------------------------------------------------ 页签二：API 文档 */
  function epRow(ep, i) {
    const m = String(ep.method || 'get').toLowerCase();
    const cls = m === 'post' ? 'post' : m === 'delete' ? 'del' : '';
    return `<div class="o-ep">
      <div class="o-ep-hd" data-ep="${i}">
        <span class="o-mth ${cls}">${esc(ep.method)}</span>
        <span class="o-ep-p">${esc(ep.path)}</span>
        <span class="o-ep-s">${esc(ep.summary)}</span>
        <span class="pill gray" style="margin-left:auto">${(ep.params || []).length} 参数</span>
      </div>
      <div class="o-ep-bd" id="ep-bd-${i}" hidden>
        ${(ep.params || []).length ? `<table class="tbl" style="margin:6px 0 10px"><thead><tr>
            <th style="width:150px">参数</th><th style="width:70px">位置</th><th style="width:80px">类型</th><th>说明</th>
          </tr></thead><tbody>${(ep.params || []).map((p) => `<tr>
            <td class="mono" style="font-size:11.5px">${esc(p.name)}</td>
            <td><span class="chip">${esc(p.in)}</span></td>
            <td class="dim mono" style="font-size:11px">${esc(p.type)}</td>
            <td style="font-size:12px;color:var(--text-2)">${esc(p.desc || '')}</td></tr>`).join('')}</tbody></table>` : ''}
        <div class="row" style="gap:8px;margin-bottom:10px">
          ${ep.method === 'GET' && ep.path.indexOf('{') < 0
            ? `<button class="btn sm primary" data-try="${esc(ep.path)}">${icon('play', 12)}试一试</button>` : ''}
          <button class="btn sm" data-copy-ep="${i}">${icon('key', 12)}复制响应示例</button>
          <span class="dim" style="font-size:11px;margin-left:auto">统一响应 {code,message,data} · HTTP 恒 200</span>
        </div>
        <div class="o-code"><div class="o-code-hd"><span class="o-dots"><i></i><i></i><i></i></span>
          <span class="o-code-t">response · JSON</span></div>
          <pre class="o-pre" id="ep-json-${i}">${esc(JSON.stringify(ep.example, null, 2))}</pre></div>
      </div>
    </div>`;
  }

  function tabDocs(d) {
    const dcs = d || {};
    const eps = dcs.endpoints || [];
    return UI.card({
      title: 'OpenAPI 3.0 接口文档', sub: `共 ${eps.length} 个端点 · 覆盖攻击任务 / 评估报告 / 数据导出 / 环境管理`,
      right: `<span class="pill brand"><i class="dot"></i>OpenAPI 3.0</span>
        <a class="btn sm" href="/openapi.json" target="_blank" rel="noopener">${icon('download', 12)}下载 openapi.json</a>`,
      flush: true,
      body: `<div style="padding:10px 16px;border-bottom:1px solid var(--line-2);display:flex;gap:8px;flex-wrap:wrap">
          <span class="chip on">全部 ${eps.length}</span>
          <span class="chip">GET ${eps.filter((e) => e.method === 'GET').length}</span>
          <span class="chip">POST ${eps.filter((e) => e.method === 'POST').length}</span>
          <span class="chip">鉴权 ${esc((dcs.auth || {}).header || 'X-API-Key')}</span>
          <span class="chip">HTTPS 强制</span>
        </div>
        ${eps.map(epRow).join('')}
        <div class="o-mcp-ft" style="border-top:1px solid var(--line-2)">
          <span>分页 <b class="mono">current/pageSize/total/items</b></span>
          <span>错误码 <b class="mono">0/1001/2001/3001/4001/5001</b></span>
          <span style="margin-left:auto">异步多步上传见「异步任务」页签</span>
        </div>`
    });
  }

  /* ------------------------------------------------------------ 页签三：MCP 服务 */
  function mcpTools(d) {
    const groups = [];
    const idx = {};
    (d.mcp || []).forEach((t) => {
      if (idx[t.group] == null) { idx[t.group] = groups.length; groups.push({ name: t.group, items: [] }); }
      groups[idx[t.group]].items.push(t);
    });
    return groups.map((g) => `<div class="o-mcp-col">
        <div class="o-mcp-hd">${esc(g.name)}<span class="pill gray">${g.items.length}</span></div>
        ${g.items.map((t) => `<div class="o-tool">
            <div class="o-tool-n"><i></i>${esc(t.name)}</div>
            <div class="o-tool-d">${esc(t.desc)}</div></div>`).join('')}
      </div>`).join('');
  }

  function tabMcp(d) {
    const rpc = `// 1) 握手：协商协议版本与能力
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","clientInfo":{"name":"soc-agent"}}}

// 2) 列工具
{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}

// 3) 调工具（创建攻击任务）
{"jsonrpc":"2.0","id":3,"method":"tools/call",
 "params":{"name":"attack_create_task","arguments":{"agent_id":3,"samples":60}}}`;
    return `<div class="stack">
      ${UI.card({
        title: 'MCP 工具清单', sub: '对外暴露攻击能力 / 安全评估 / 测试环境管理三类服务',
        right: `<span class="pill brand"><i class="dot"></i>${(d.mcp || []).length} 个工具</span>
          <button class="btn sm primary" data-mcp-test>${icon('play', 13)}调用 tools/list</button>`,
        flush: true,
        body: `<div class="o-mcp">${mcpTools(d)}</div>
          <div class="o-mcp-ft"><span>传输 <b style="color:var(--text);font-weight:560">Streamable HTTP</b></span>
            <span>协议 <b style="color:var(--text);font-weight:560">JSON-RPC 2.0</b></span>
            <span>鉴权 <b style="color:var(--text);font-weight:560">Bearer Token</b></span>
            <span style="margin-left:auto" class="mono">POST /mcp</span></div>`
      })}
      <div class="split" style="grid-template-columns:1.1fr 1fr">
        ${UI.card({
          title: 'JSON-RPC 调用示例', sub: '三步完成一次工具调用',
          right: `<button class="btn sm" data-copy-rpc>${icon('key', 12)}复制</button>`,
          body: `<div class="o-code"><div class="o-code-hd"><span class="o-dots"><i></i><i></i><i></i></span>
            <span class="o-code-t">jsonrpc · /mcp</span></div>
            <pre class="o-pre" id="mcp-rpc">${esc(rpc)}</pre></div>`
        })}
        ${UI.card({
          title: '能力边界', sub: '与平台页面共用同一套 RBAC 与限额',
          body: `<div class="col" style="gap:9px">
            <div class="kv"><span>工具数</span><b>${(d.mcp || []).length} 个（3 组）</b></div>
            <div class="kv"><span>调用限额</span><b>与 REST 共用 RPM</b></div>
            <div class="kv"><span>审计</span><b>全量写入行为审计</b></div>
            <div class="kv"><span>可用 Skill 替代</span><b>支持</b></div>
          </div>
          <div class="note" style="margin-top:12px">MCP 适合把攻击能力嵌进 IDE / SOC Agent；RESTful 适合流水线与批处理。</div>`
        })}
      </div>
    </div>`;
  }

  /* ------------------------------------------------------------ 页签四：异步任务 */
  function tabAsync(page) {
    const ups = page.uploads || [];
    const rows = ups.length ? ups.map((u) => `<tr>
        <td class="mono" style="font-size:11.5px">${esc(u.taskId)}</td>
        <td>${esc(u.name)}</td>
        <td class="num">${esc(u.size || '—')}</td>
        <td><div class="row" style="gap:8px"><div class="bar" style="width:80px"><i style="width:${u.progress || 0}%"></i></div>
          <span class="num" style="font-size:11px">${u.progress || 0}%</span></div></td>
        <td>${UI.pill(u.status || '上传中')}</td>
        <td class="t-act">${u.resultUrl ? `<a class="btn sm" href="${esc(UI.safeHref(u.resultUrl))}" target="_blank" rel="noopener">${icon('download', 12)}下载</a>`
          : `<span class="dim" style="font-size:11px">处理中</span>`}</td>
      </tr>`).join('') : `<tr><td colspan="6">${UI.empty('暂无上传任务', '点击「申请直传地址」体验五步异步流程')}</td></tr>`;
    const steps = [['申请直传地址', 'POST /api/open/async-upload', '返回 taskId 与 OSS/S3 预签名地址'],
      ['PUT 大文件', 'PUT {putUrl}', '客户端直传对象存储，不经平台网关'],
      ['提交任务', 'POST /api/open/async-upload/{taskId}/commit', '平台校验对象后转异步任务'],
      ['轮询进度', 'GET /api/open/async/{taskId}', '返回 status / progress / resultUrl'],
      ['下载结果', 'GET {resultUrl}', '生成完毕后返回可下载地址']];
    return `<div class="stack">
      ${UI.card({
        title: '大文件异步上传', sub: '五步流程 · 预签名 15 分钟有效 · 单文件上限 512 MB',
        right: `<button class="btn sm primary" data-async-new>${icon('plus', 13)}申请直传地址</button>`,
        body: `<div>${steps.map((s, i) => `<div class="o-step">
            <span class="sn">${i + 1}</span>
            <span class="st"><b>${esc(s[0])}</b><span class="mono">${esc(s[1])}</span></span>
            <span class="sd">${esc(s[2])}</span></div>`).join('')}</div>`
      })}
      ${UI.card({
        title: '上传任务', sub: '按创建时间倒序 · 进度来自轮询接口',
        flush: true,
        body: `<table class="tbl"><thead><tr>
            <th style="width:150px">taskId</th><th>文件</th><th style="width:96px">大小</th>
            <th style="width:150px">进度</th><th style="width:96px">状态</th><th style="width:96px;text-align:right">结果</th>
          </tr></thead><tbody>${rows}</tbody></table>`
      })}
      ${UI.card({
        title: '数据导出与特征库同步', sub: '导出走异步任务，特征库支持增量同步',
        body: `<div class="tk-dl" style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn" data-export="csv">${icon('download', 13)}导出 CSV 明细</button>
            <button class="btn" data-export="pdf">${icon('download', 13)}导出 PDF 报告</button>
            <button class="btn" data-export="docx">${icon('download', 13)}导出 Word 报告</button>
            <button class="btn primary" data-feature-sync>${icon('refresh', 13)}特征库增量同步</button>
          </div>
          <div class="note" style="margin-top:12px">导出上限 20000 条/次，超出请使用异步任务分片；特征库同步返回版本号与新增/更新条数。</div>`
      })}
    </div>`;
  }

  /* ------------------------------------------------------------ 页签五：安全策略 */
  function tabSecurity(page) {
    const s = page.sec || {};
    return `<div class="split" style="grid-template-columns:1.3fr 1fr">
      ${UI.card({
        title: '服务端鉴权策略', sub: '所有开放接口强制 HTTPS，密钥仅以 SHA-256 摘要存储',
        right: `<button class="btn sm primary" data-save-sec>${icon('check', 13)}保存策略</button>`,
        body: `<div class="o-frm">
          <div class="full"><label>IP 白名单（逗号分隔 CIDR）</label>
            <input class="input" id="s-ip" value="${esc(s.ipWhitelist || '')}" placeholder="10.20.0.0/16, 172.16.8.0/24"></div>
          <div><label>每密钥 RPM 上限</label><input class="input" id="s-rpm" type="number" value="${esc(s.rpm || 300)}"></div>
          <div><label>密钥有效期（天，0 为长期）</label><input class="input" id="s-ttl" type="number" value="${esc(s.ttl || 60)}"></div>
          <div class="full"><label>默认 RBAC 角色</label>
            <select class="select" id="s-rbac">${(s.rbacOptions || ['只读']).map((r) =>
              `<option ${r === s.rbac ? 'selected' : ''}>${esc(r)}</option>`).join('')}</select></div>
          <div class="full"><label>密钥摘要算法</label><input class="input" value="${esc(s.hash || 'sha256(secret + salt)')}" disabled></div>
        </div>
        <div class="note" style="margin-top:14px">保存后立即生效：新请求按新的白名单与限流校验，已建立连接在下一请求重新校验。</div>`
      })}
      <div class="col" style="gap:14px">
        ${UI.card({
          title: '校验链路', sub: '网关 → 鉴权 → 限流 → 路由',
          body: `<div class="o-step"><span class="sn">1</span><span class="st"><b>HTTPS 强制</b><span class="mono">TLS 1.2+ · HSTS</span></span></div>
            <div class="o-step"><span class="sn">2</span><span class="st"><b>密钥校验</b><span class="mono">sha256 比对 + 状态检查</span></span></div>
            <div class="o-step"><span class="sn">3</span><span class="st"><b>身份绑定</b><span class="mono">key → 租户 → RBAC scope</span></span></div>
            <div class="o-step"><span class="sn">4</span><span class="st"><b>配额与限流</b><span class="mono">RPM 滑窗 · 429</span></span></div>
            <div class="o-step"><span class="sn">5</span><span class="st"><b>审计落库</b><span class="mono">调用者 / IP / 耗时 / 结果</span></span></div>`
        })}
        ${UI.card({
          title: '当前生效', sub: `版本 ${esc(s.version || 'V1.0')}`,
          body: `<div class="col" style="gap:8px">
            <div class="kv"><span>IP 白名单</span><b class="mono" style="font-size:11px">${esc(s.ipWhitelist || '未限制')}</b></div>
            <div class="kv"><span>RPM</span><b>${esc(s.rpm || 300)}</b></div>
            <div class="kv"><span>有效期</span><b>${esc(s.ttl || 60)} 天</b></div>
            <div class="kv"><span>默认角色</span><b>${esc(s.rbac || '只读')}</b></div>
          </div>`
        })}
      </div>
    </div>`;
  }

  /* ------------------------------------------------------------ 通用工具 */
  function copyText(text, okMsg) {
    const done = () => UI.toast(okMsg || '已复制到剪贴板');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallback());
    } else fallback();
    function fallback() {
      try {
        const ta = document.createElement('textarea');
        ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); done();
      } catch (e) { UI.toast('复制失败，请手动选择文本', 'err'); }
    }
  }

  function showJson(title, obj) {
    UI.modal({
      title, okText: '关闭',
      body: `<div class="o-code"><div class="o-code-hd"><span class="o-dots"><i></i><i></i><i></i></span>
        <span class="o-code-t">response · JSON</span></div>
        <pre class="o-pre" style="max-height:420px">${esc(JSON.stringify(obj, null, 2))}</pre></div>`
    });
  }

  function newKeyModal(page) {
    const d = page.d;
    const scopes = Array.from(new Set(d.items.reduce((a, k) => a.concat(parseScopes(k.scopes)), []).concat(BASE_SCOPES)));
    const md = UI.modal({
      title: '生成 API Key',
      body: `<div class="form">
        <label>密钥名称<input class="input" id="k-name" placeholder="例如：CI 流水线扫描" value="流水线接入密钥"></label>
        <div class="field" style="margin-bottom:14px">
          <label style="font-size:12px;color:var(--text-2);margin-bottom:7px">权限范围（scopes，可多选）</label>
          <div class="row wrap" style="gap:6px" id="k-scopes">
            ${scopes.map((s, i) => `<button class="chip ${i < 2 ? 'on' : ''}" data-scope="${esc(s)}">${esc(s)}</button>`).join('')}
          </div>
          <div style="font-size:11px;color:var(--text-3);margin-top:7px">遵循最小权限原则，仅勾选流水线实际需要的读写范围。</div>
        </div>
        <div class="kv"><span>速率限制</span><b>600 RPM</b></div>
        <div class="kv"><span>密钥强度</span><b>128 bit 随机 · sk-live- 前缀</b></div>
      </div>`,
      okText: '生成密钥',
      onOk: async (el) => {
        const name = (el.querySelector('#k-name').value || '').trim();
        const picked = [...el.querySelectorAll('[data-scope].on')].map((b) => b.dataset.scope);
        if (!name) { UI.toast('请填写密钥名称', 'err'); return false; }
        if (!picked.length) { UI.toast('请至少选择一个权限范围', 'err'); return false; }
        let r;
        try { r = await API.post('/api/open/keys', { name, scopes: picked }); }
        catch (e) { UI.toast('生成失败：' + (e.message || e), 'err'); return false; }
        UI.toast('密钥已生成，请立即保存');
        secretModal(r, name, picked, page, '密钥已生成');
        try { await page.reload(); } catch (e) { /* 忽略 */ }
      }
    });
    md.el.querySelectorAll('[data-scope]').forEach((b) => { b.onclick = () => b.classList.toggle('on'); });
  }

  function secretModal(r, name, scopes, page, title) {
    const prefix = String(r.secret || '').slice(0, 12);
    const md = UI.modal({
      title: title || '密钥已生成',
      body: `${UI.note('密钥明文仅在本次显示一次。关闭后平台只保留 SHA-256 摘要，无法再次查看，请立即复制并存入密钥管理服务。', 'warn')}
        <div class="o-secret" style="margin-top:12px">
          <div class="o-secret-hd"><span>${esc(name)} · ${esc(prefix)}…</span>
            <span class="pill ok" style="margin-left:auto"><i class="dot"></i>已启用</span></div>
          <pre id="k-secret">${esc(r.secret)}</pre>
          <div class="o-secret-ft">
            <button class="btn" data-copy="secret">${icon('key', 12)}复制密钥</button>
            <span>丢失后只能重签或撤销后重新生成</span>
          </div>
        </div>
        <div class="col" style="gap:7px;margin-top:12px">
          <div class="kv"><span>权限范围</span><b class="mono" style="font-size:11.5px">${esc(scopes.join(' · '))}</b></div>
          <div class="kv"><span>密钥强度</span><b>128 bit（32 位十六进制）</b></div>
        </div>`,
      okText: '我已保存',
      onOk: async () => { try { await page.reload(); } catch (e) { UI.toast('刷新失败：' + (e.message || e), 'err'); } }
    });
    const btn = md.el.querySelector('[data-copy="secret"]');
    if (btn) btn.onclick = () => copyText(r.secret, '密钥已复制，请妥善保存');
  }

  function revokeModal(k, page) {
    UI.modal({
      title: '撤销 API Key', danger: true, okText: '确认撤销',
      body: `<div style="font-size:12.5px;line-height:1.75;color:var(--text-2)">
          即将撤销密钥 <b style="color:var(--text)">${esc(k.name)}</b>（${esc(k.prefix)}…）。撤销后该凭证立即失效，
          使用它的流水线会收到 401 响应，且无法恢复。
        </div>
        <div class="col" style="gap:7px;margin-top:14px">
          <div class="kv"><span>权限范围</span><b class="mono" style="font-size:11.5px">${esc(parseScopes(k.scopes).join(' · ') || '—')}</b></div>
          <div class="kv"><span>最后使用</span><b>${k.last_used ? esc(String(k.last_used).slice(0, 16)) : '从未使用'}</b></div>
        </div>`,
      onOk: async () => {
        try { await API.del('/api/open/keys/' + k.id); UI.toast('密钥已撤销'); await page.reload(); }
        catch (e) { UI.toast('撤销失败：' + (e.message || e), 'err'); }
      }
    });
  }

  function rotateModal(k, page) {
    UI.modal({
      title: '重签密钥', okText: '确认重签',
      body: `<div style="font-size:12.5px;line-height:1.75;color:var(--text-2)">
          将为 <b style="color:var(--text)">${esc(k.name)}</b> 生成新的密钥明文，旧密钥立即失效。
          适用于密钥疑似泄露的应急轮换。
        </div>`,
      onOk: async () => {
        try {
          const r = await API.post('/api/open/keys/' + k.id + '/rotate', {});
          secretModal(r, k.name, parseScopes(k.scopes), page, '密钥已重签');
          await page.reload();
        } catch (e) { UI.toast('重签失败：' + (e.message || e), 'err'); }
      }
    });
  }

  function asyncNewModal(page) {
    UI.modal({
      title: '申请直传地址',
      body: `<div class="form">
        <label>文件名称<input class="input" id="u-name" value="攻击样本包-20261105.zip"></label>
        <div class="row" style="gap:10px">
          <label style="flex:1">文件大小<input class="input" id="u-size" value="128 MB"></label>
          <label style="flex:1">分片数<input class="input" value="4" disabled></label>
        </div>
        <div class="note">预签名地址 15 分钟有效；PUT 完成后调用 commit 接口转异步任务。</div>
      </div>`,
      okText: '获取直传地址',
      onOk: async (el) => {
        const name = el.querySelector('#u-name').value || '样本包.zip';
        const size = el.querySelector('#u-size').value || '128 MB';
        try {
          const r = await API.post('/api/open/async-upload', { name, size });
          page.uploads = (page.uploads || []).concat([{
            taskId: r.taskId, name, size, progress: 5, status: '上传中'
          }]);
          page.render();
          showJson('直传地址已生成', r);
        } catch (e) { UI.toast('申请失败：' + (e.message || e), 'err'); }
      }
    });
  }

  /* ------------------------------------------------------------ 页面挂载 */
  w.Pages = w.Pages || {};
  w.Pages.open = {
    async mount(root) {
      if (!document.getElementById('pg-open')) {
        const s = document.createElement('style');
        s.id = 'pg-open'; s.textContent = STYLE;
        document.head.appendChild(s);
      }
      const page = this;
      page.alive = true;
      page.tab = page.tab || 'keys';
      page.uploads = page.uploads || [];

      const load = async () => {
        const [open, docs, sec] = await Promise.all([
          API.get('/api/open'), API.get('/api/open/docs'), API.get('/api/open/security')
        ]);
        page.d = open; page.docs = docs; page.sec = sec;
      };

      root.innerHTML = `<div class="fade-in">${UI.skel(4)}</div>`;
      try { await load(); }
      catch (e) {
        if (root.isConnected) root.innerHTML = `<div class="card pad">${UI.empty('开放能力加载失败', String(e.message || e))}</div>`;
        return () => { page.alive = false; };
      }
      if (!page.alive || !root.isConnected) return () => {};

      const TABS = [['keys', '密钥与调用'], ['docs', 'API 文档'], ['mcp', 'MCP 服务'],
        ['async', '异步任务'], ['sec', '安全策略']];

      const bodyOf = () => {
        if (page.tab === 'docs') return tabDocs(page.docs);
        if (page.tab === 'mcp') return tabMcp(page.d);
        if (page.tab === 'async') return tabAsync(page);
        if (page.tab === 'sec') return tabSecurity(page);
        return tabKeys(page.d);
      };

      const render = () => {
        if (!page.alive || !root.isConnected) return;
        root.innerHTML = `<div class="fade-in">
          ${UI.pageHd({
            title: '开放能力',
            sub: 'RESTful /v1 · MCP Server · OpenAPI 3.0 · 面向 CI 流水线与 SOC 平台的系统集成',
            actions: `<a class="btn" href="/openapi.json" target="_blank" rel="noopener">${icon('download', 14)}openapi.json</a>
              <button class="btn" data-refresh>${icon('refresh', 14)}刷新</button>
              <button class="btn primary" data-newkey>${icon('plus', 14)}生成密钥</button>`
          })}
          <div class="o-tabs">${TABS.map((t) =>
            `<button data-tab="${t[0]}" class="${page.tab === t[0] ? 'on' : ''}">${t[1]}</button>`).join('')}</div>
          ${bodyOf()}
        </div>`;
        bind();
      };

      const bind = () => {
        root.querySelectorAll('[data-tab]').forEach((b) => b.onclick = () => { page.tab = b.dataset.tab; render(); });
        root.querySelectorAll('[data-newkey]').forEach((b) => b.onclick = () => newKeyModal(page));
        root.querySelectorAll('[data-refresh]').forEach((b) => b.onclick = async () => {
          b.disabled = true;
          try { await page.reload(); UI.toast('开放能力已刷新'); }
          catch (e) { UI.toast('刷新失败：' + (e.message || e), 'err'); }
        });
        root.querySelectorAll('[data-revoke]').forEach((b) => b.onclick = () => {
          const k = page.d.items.find((x) => String(x.id) === b.dataset.revoke);
          if (k) revokeModal(k, page);
        });
        root.querySelectorAll('[data-rotate]').forEach((b) => b.onclick = () => {
          const k = page.d.items.find((x) => String(x.id) === b.dataset.rotate);
          if (k) rotateModal(k, page);
        });
        const copyBtn = root.querySelector('[data-copy="code"]');
        if (copyBtn) {
          const first = page.d.items.find((k) => k.status === '启用') || page.d.items[0] || {};
          copyBtn.onclick = () => copyText(codePlain(first.prefix), 'curl 示例已复制');
        }
        const rpcBtn = root.querySelector('[data-copy-rpc]');
        if (rpcBtn) {
          rpcBtn.onclick = () => copyText(root.querySelector('#mcp-rpc').textContent, 'JSON-RPC 示例已复制');
        }

        /* API 文档交互 */
        root.querySelectorAll('[data-ep]').forEach((hd) => hd.onclick = () => {
          const bd = root.querySelector('#ep-bd-' + hd.dataset.ep);
          if (bd) bd.hidden = !bd.hidden;
        });
        root.querySelectorAll('[data-copy-ep]').forEach((b) => b.onclick = () => {
          const pre = root.querySelector('#ep-json-' + b.dataset.copyEp);
          if (pre) copyText(pre.textContent, '响应示例已复制');
        });
        root.querySelectorAll('[data-try]').forEach((b) => b.onclick = async () => {
          b.disabled = true;
          try {
            const r = await API.get(b.dataset.try);
            showJson('调用结果 · ' + b.dataset.try, r);
          } catch (e) { UI.toast('调用失败：' + (e.message || e), 'err'); }
          b.disabled = false;
        });

        /* MCP 测试 */
        const mcpBtn = root.querySelector('[data-mcp-test]');
        if (mcpBtn) mcpBtn.onclick = async () => {
          mcpBtn.disabled = true;
          try {
            const res = await fetch('/mcp', {
              method: 'POST', headers: { 'Content-Type': 'application/json', 'X-API-Key': '<YOUR_API_KEY>' },
              body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} })
            });
            showJson('POST /mcp · tools/list', await res.json());
          } catch (e) { UI.toast('MCP 调用失败：' + (e.message || e), 'err'); }
          mcpBtn.disabled = false;
        };

        /* 异步任务 */
        const an = root.querySelector('[data-async-new]');
        if (an) an.onclick = () => asyncNewModal(page);
        root.querySelectorAll('[data-export]').forEach((b) => b.onclick = async () => {
          b.disabled = true;
          try {
            const fmt = b.dataset.export;
            const r = await API.get('/api/evals/2/export?fmt=' + fmt);
            UI.toast('已生成 ' + fmt.toUpperCase() + ' 文件');
            UI.modal({
              title: '导出完成 · ' + fmt.toUpperCase(), okText: '关闭',
              body: `<div style="font-size:12.5px;line-height:1.9;color:var(--text-2)">
                  文件：<b class="mono" style="color:var(--text)">${esc(r.file || '')}</b><br>
                  大小：<b>${esc(r.size || '—')}</b> · 条数 ${esc(r.count || '—')}
                </div>
                <div style="margin-top:14px"><a class="btn primary" href="${esc(UI.safeHref(r.url || '#'))}" target="_blank" rel="noopener">${icon('download', 13)}下载文件</a></div>`
            });
          } catch (e) { UI.toast('导出失败：' + (e.message || e), 'err'); }
          b.disabled = false;
        });
        const fs = root.querySelector('[data-feature-sync]');
        if (fs) fs.onclick = async () => {
          fs.disabled = true;
          try { const r = await API.post('/api/open/features/sync', {}); showJson('特征库增量同步', r); }
          catch (e) { UI.toast('同步失败：' + (e.message || e), 'err'); }
          fs.disabled = false;
        };

        /* 安全策略 */
        const sv = root.querySelector('[data-save-sec]');
        if (sv) sv.onclick = async () => {
          const body = {
            ipWhitelist: root.querySelector('#s-ip').value.trim(),
            rpm: +root.querySelector('#s-rpm').value || 300,
            ttl: +root.querySelector('#s-ttl').value || 60,
            rbac: root.querySelector('#s-rbac').value
          };
          try {
            page.sec = await API.post('/api/open/security', body);
            UI.toast('安全策略已保存并生效');
            render();
          } catch (e) { UI.toast('保存失败：' + (e.message || e), 'err'); }
        };
      };

      page.render = render;
      page.reload = async () => { await load(); render(); };
      render();

      /* 轮询上传进度 */
      const timer = setInterval(async () => {
        if (!page.alive || !root.isConnected) return;
        const pending = (page.uploads || []).filter((u) => u.progress < 100);
        if (!pending.length) return;
        for (const u of pending) {
          try {
            const r = await API.get('/api/open/async/' + u.taskId);
            if (!page.alive || !root.isConnected) return;
            u.progress = r.progress || u.progress;
            u.status = r.status || u.status;
            u.resultUrl = r.resultUrl || null;
          } catch (e) { /* 忽略单次失败 */ }
        }
        if (page.alive && root.isConnected && page.tab === 'async') render();
      }, 4000);
      return () => { page.alive = false; clearInterval(timer); };
    }
  };
})(window);
