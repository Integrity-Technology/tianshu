/* ============================================================================
   测试环境：资源池 / 环境卡片 / 参数配置 / 模板与镜像 / 知识库与工具 / 容器列表
   ========================================================================== */
(function (w) {
  const { UI, API, Charts } = w;
  const icon = w.icon;
  const esc = w.esc;
  const num = UI.num;
  const C = Charts.pal;

  const LEVELS = [
    { id: 'l1', name: 'L1 Docker', color: C.gray, desc: '容器级隔离' },
    { id: 'l2', name: 'L2 Kata', color: C.brand, desc: '轻量虚拟机隔离' },
    { id: 'l3', name: 'L3 Firecracker', color: C.violet, desc: '微虚拟机隔离' },
    { id: 'l4', name: 'L4 独立VPC', color: C.cyan, desc: '独立网络隔离' }
  ];
  const KINDS = ['对话', 'RAG', 'Agent', 'MCP', '基础设施', '自定义靶场'];
  const TOOL_KINDS = ['工具', 'MCP', 'skill'];
  const QUICK_CMDS = ['help', 'ls', 'ps', 'whoami', 'env', 'exit'];

  const STYLE = `
  .pool{padding:0;overflow:hidden}
  .pool-hd{display:flex;align-items:center;gap:12px;padding:13px 16px;border-bottom:1px solid var(--line-2)}
  .pool-ic{width:28px;height:28px;border-radius:8px;background:var(--brand-050);color:var(--brand);display:grid;place-items:center;flex:0 0 28px}
  .pool-name{font-size:13px;font-weight:600;letter-spacing:-.01em}
  .pool-sub{font-size:11.5px;color:var(--text-3);margin-top:1px}
  .pool-right{margin-left:auto;display:flex;align-items:center;gap:8px}
  .pool-bd{display:grid;grid-template-columns:296px 1fr;gap:26px;padding:16px;align-items:center}
  .pool-stats{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .pstat{padding:9px 12px;background:var(--surface-2);border:1px solid var(--line-2);border-radius:10px}
  .pstat .k{font-size:10.5px;color:var(--text-3)}
  .pstat .v{font-size:20px;font-weight:650;letter-spacing:-.03em;line-height:1.2;margin-top:1px}
  .pstat .v span{font-size:10.5px;font-weight:500;color:var(--text-3);margin-left:3px;letter-spacing:0}
  .quotas{display:flex;flex-direction:column;gap:13px;border-left:1px solid var(--line-2);padding-left:26px}
  .q{display:grid;grid-template-columns:42px 1fr 132px 54px;align-items:center;gap:14px}
  .qk{font-size:11.5px;color:var(--text-2);font-weight:550}
  .qbar .bar{height:7px}
  .qv{font-size:11.5px;color:var(--text-2);text-align:right;white-space:nowrap}
  .qv b{color:var(--text);font-weight:600}
  .qp{font-size:11.5px;font-weight:600;text-align:right;color:var(--text)}
  .qp.dimv{font-weight:500;color:var(--text-3)}
  .qscale{height:7px;border-radius:6px;background:
    repeating-linear-gradient(90deg,#DCE2EC 0 2px,transparent 2px 9px);position:relative}
  .qscale::after{content:"";position:absolute;right:0;top:-2px;bottom:-2px;width:2px;border-radius:2px;background:#C6CFDF}
  .env-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
  .env{background:var(--surface);border:1px solid var(--line);border-radius:var(--r-lg);box-shadow:var(--sh-1);
    padding:15px 16px;display:flex;flex-direction:column;gap:12px;transition:box-shadow .2s var(--ease),transform .2s var(--ease),border-color .2s}
  .env:hover{box-shadow:var(--sh-2);transform:translateY(-1px)}
  .env.off{background:var(--surface-2)}
  .env.dead{opacity:.56;box-shadow:none}
  .env.dead:hover{transform:none;box-shadow:none}
  .env-hd{display:flex;align-items:flex-start;gap:10px;min-width:0}
  .env-ic{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;flex:0 0 30px;
    background:var(--brand-050);color:var(--brand)}
  .env.off .env-ic{background:#EEF1F6;color:var(--text-3)}
  .env.dead .env-ic{background:#F3F5F9;color:var(--text-3)}
  .env-ttl{min-width:0;flex:1}
  .env-name{font-size:13px;font-weight:600;letter-spacing:-.01em;display:flex;align-items:center;gap:7px;flex-wrap:wrap}
  .env-sub{font-size:10.5px;color:var(--text-3);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .env-sub .mono{font-size:10.5px}
  .lvl{font-size:9.5px;font-weight:600;letter-spacing:.02em;padding:1.5px 6px;border-radius:5px;border:1px solid;white-space:nowrap;line-height:1.5}
  .lvl.l1{color:var(--text-2);background:#F2F4F8;border-color:#E3E7EF}
  .lvl.l2{color:var(--brand-600);background:var(--brand-050);border-color:var(--brand-100)}
  .lvl.l3{color:var(--violet);background:var(--violet-bg);border-color:#E2D8FC}
  .lvl.l4{color:var(--cyan);background:#E4F6F8;border-color:#C7EAEF}
  .env-note{font-size:11px;color:var(--text-3);line-height:1.6;min-height:17px;
    display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  .env-meters{display:flex;flex-direction:column;gap:8px;padding:10px 12px;background:var(--surface-2);
    border:1px solid var(--line-2);border-radius:10px}
  .env.off .env-meters{background:#F5F7FA}
  .meter{display:grid;grid-template-columns:32px 1fr 92px;align-items:center;gap:9px}
  .meter .mk{font-size:10.5px;color:var(--text-3)}
  .meter .bar{height:5px}
  .meter .mv{font-size:10.5px;color:var(--text-2);text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}
  .env-foot{display:flex;align-items:center;gap:9px;margin-top:auto;flex-wrap:wrap}
  .fs{font-size:10.5px;color:var(--text-3);white-space:nowrap}
  .fs b{color:var(--text-2);font-weight:600;margin-right:2px}
  .env-acts{display:flex;gap:5px;margin-left:auto;align-items:center;flex-wrap:wrap;justify-content:flex-end}
  .env-acts .btn{height:25px;padding:0 8px;font-size:11.5px}
  .env-acts .btn.danger{background:var(--surface);border-color:var(--line);color:#B33A3A}
  .env-acts .btn.danger:hover{background:var(--danger-bg);border-color:#F0C7C7;color:var(--danger)}
  .legend-t{font-size:11px;color:var(--text-3);line-height:1.75;margin-top:12px;padding-top:10px;border-top:1px solid var(--line-2)}
  .lb{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
  .lb-c{font-size:11.5px;color:var(--text-3)}
  .lb .searchbox{width:250px}
  .res-strip{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
  .res-box{padding:11px 12px;border:1px solid var(--line);border-radius:10px;background:var(--surface-2)}
  .res-box .k{font-size:10.5px;color:var(--text-3);display:flex;justify-content:space-between}
  .res-box .v{font-size:17px;font-weight:650;letter-spacing:-.02em;margin:3px 0 8px;font-variant-numeric:tabular-nums}
  .res-box .v small{font-size:10.5px;color:var(--text-3);font-weight:500;margin-left:4px;letter-spacing:0}
  .nodes{display:flex;gap:7px;flex-wrap:wrap;margin-top:12px;align-items:center}
  .nodes .nl{font-size:11px;color:var(--text-3);margin-right:2px}
  .node{display:inline-flex;align-items:center;gap:6px;font-size:11px;color:var(--text-2);
    border:1px solid var(--line);border-radius:20px;padding:3px 10px;background:#fff;font-variant-numeric:tabular-nums}
  .node i{width:6px;height:6px;border-radius:50%;background:var(--ok)}
  .node.warn i{background:var(--warn)}
  .ct-acts{display:flex;gap:4px;justify-content:flex-end;align-items:center;white-space:nowrap}
  .ct-acts .btn{height:25px;padding:0 8px;font-size:11.5px}
  .ct-cpu{display:flex;align-items:center;gap:8px;min-width:118px}
  .ct-cpu .bar{flex:1;height:5px}
  .ct-cpu span{font-size:11px;color:var(--text-2);min-width:46px;text-align:right;font-variant-numeric:tabular-nums}
  .t-snip{font-size:11px;color:var(--text-3);margin-top:2px;max-width:460px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .cs-quick{display:flex;gap:5px;flex-wrap:wrap;align-items:center;margin-bottom:10px}
  .cs-quick .chip{cursor:pointer;background:#fff}
  .cs-quick .chip:hover{border-color:var(--brand-100);color:var(--brand-600)}
  .cs-body{display:flex;flex-direction:column;overflow:hidden}
  .term.cs-term{flex:1;min-height:300px;height:auto;padding:0;display:flex;flex-direction:column;overflow:hidden}
  .cs-scroll{flex:1;min-height:0;overflow:auto;padding:14px 16px}
  .cs-line{white-space:pre-wrap;word-break:break-word;font-family:var(--mono);font-size:11.5px;line-height:1.8}
  .cs-s{color:#5A657A}
  .cs-e{color:#7C9CFF}
  .cs-o{color:#C6D0E2}
  .cs-w{color:#E2C275}
  .cs-x{color:#FF7B7B}
  .cs-in-row{display:flex;align-items:center;gap:8px;padding:10px 14px;background:#0E141F;border-top:1px solid #1A2230}
  .cs-p{color:#4ED2B0;font-family:var(--mono);font-size:11.5px;white-space:nowrap}
  .cs-in{flex:1;background:transparent;border:0;outline:0;color:#E6ECF8;font-family:var(--mono);font-size:11.5px;height:18px}
  .cs-in::placeholder{color:#5A657A}
  .cfg-env{display:flex;gap:22px;flex-wrap:wrap;align-items:center;padding:11px 14px;
    background:var(--surface-2);border:1px solid var(--line-2);border-radius:10px;margin-bottom:16px}
  .cfg-env .ce{font-size:10.5px;color:var(--text-3)}
  .cfg-env .ce b{display:block;color:var(--text);font-size:12.5px;font-weight:560;margin-top:2px}
  .cfg-s{margin-bottom:16px}
  .cfg-h{font-size:12px;font-weight:600;margin-bottom:7px;display:flex;align-items:center;gap:8px}
  .cfg-h .hint{font-weight:400;color:var(--text-3);font-size:11px;margin-left:auto}
  .cfg-hint{font-size:10.5px;color:var(--text-3);margin-top:6px;display:flex;justify-content:space-between;gap:8px}
  .pick{display:flex;flex-wrap:wrap;gap:6px;padding:9px 10px;border:1px solid var(--line);
    border-radius:10px;background:var(--surface-2);max-height:120px;overflow:auto}
  .pick .chip{cursor:pointer;background:#fff}
  .pick .chip.on{border-color:var(--brand);background:var(--brand-050);color:var(--brand-600);font-weight:550}
  .pick-empty{font-size:11.5px;color:var(--text-3);padding:1px 0}
  .rng{width:100%;accent-color:var(--brand);height:16px}
  .trow{display:grid;grid-template-columns:1fr 84px;gap:10px;align-items:center}
  .tokq{display:flex;gap:5px;margin-top:7px;flex-wrap:wrap}
  .tokq .chip{cursor:pointer;background:#fff}
  .tokq .chip:hover{border-color:var(--brand-100);color:var(--brand-600)}
  .cfg-sum{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;border:1px solid var(--line-2);
    border-radius:10px;padding:12px 14px;background:var(--surface-2)}
  .cfg-sum span{display:block;font-size:10.5px;color:var(--text-3)}
  .cfg-sum b{display:block;margin-top:4px;font-size:13px;font-weight:600;font-variant-numeric:tabular-nums}
  .cfg-flow{border:1px dashed var(--line);border-radius:10px;padding:12px 14px;background:#FBFCFE}
  .cfg-flow .fl-row{display:flex;gap:9px;align-items:flex-start;font-size:11.5px;color:var(--text-2);line-height:1.7}
  .chart-col{min-width:0}
  .chart-col + .chart-col{border-left:1px dashed var(--line-2);padding-left:20px}
  .cfg-flow .fl-row i{flex:none;width:15px;height:15px;border-radius:50%;background:var(--brand-050);
    color:var(--brand-600);font-style:normal;font-size:9.5px;font-weight:700;display:flex;
    align-items:center;justify-content:center;margin-top:2px}
  .tmplbar{display:flex;gap:8px;align-items:center}
  .tmplbar .select{flex:1}
  .cfg-pgroups{display:flex;flex-direction:column;gap:10px;margin-bottom:10px}
  .cfg-pg{border:1px solid var(--line);border-radius:11px;background:var(--surface-2);overflow:hidden}
  .cfg-pg-h{display:flex;align-items:center;gap:8px;padding:8px 12px;background:#fff;border-bottom:1px solid var(--line-2)}
  .cfg-pg-h b{font-size:11.5px;font-weight:650}
  .cfg-pg-h span{font-size:10.5px;color:var(--text-3);margin-left:auto;font-variant-numeric:tabular-nums}
  .cfg-pgrid{display:grid;grid-template-columns:1fr 1fr;gap:9px 12px;padding:11px 12px}
  .cfg-pf{display:flex;flex-direction:column;gap:3px;min-width:0}
  .cfg-pf .k{font-size:10.5px;color:var(--text-3);display:flex;align-items:center;gap:4px;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .cfg-pf .input,.cfg-pf .select{height:30px;font-size:11.5px;padding:0 8px;width:100%}
  .cfg-pf small{font-size:9.5px;color:var(--text-3);font-variant-numeric:tabular-nums}
  .cfg-pf.dirty .k{color:var(--brand-600);font-weight:600}
  .cfg-pf.dirty .input,.cfg-pf.dirty .select{border-color:var(--brand-100)}
  .cfg-pf.ck{flex-direction:row;align-items:center;justify-content:space-between;gap:8px;
    border:1px solid var(--line);border-radius:9px;background:#fff;padding:7px 10px}
  .cfg-pf.ck .k{color:var(--text-2);font-size:11.5px;white-space:normal}
  .cfg-sw{position:relative;display:inline-flex;flex:0 0 30px;width:30px;height:17px}
  .cfg-sw input{position:absolute;opacity:0;width:100%;height:100%;margin:0;cursor:pointer;z-index:1}
  .cfg-sw i{position:absolute;inset:0;border-radius:20px;background:#DDE2EC;transition:background .18s}
  .cfg-sw i::after{content:"";position:absolute;left:2px;top:2px;width:13px;height:13px;border-radius:50%;
    background:#fff;box-shadow:0 1px 2px rgba(16,24,40,.22);transition:transform .18s}
  .cfg-sw input:checked + i{background:var(--brand)}
  .cfg-sw input:checked + i::after{transform:translateX(13px)}
  @media (max-width:1560px){.env-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
  @media (max-width:1180px){.env-grid{grid-template-columns:1fr}.pool-bd{grid-template-columns:1fr}.res-strip{grid-template-columns:repeat(2,minmax(0,1fr))}}
  `;

  const sum = (arr, f) => arr.reduce((s, x) => s + (f(x) || 0), 0);
  const lvlClass = (level) => {
    const m = /^L(\d)/.exec(level || '');
    return m ? 'l' + m[1] : 'l1';
  };
  const toneOf = (pct) => (pct >= 80 ? 'danger' : pct >= 55 ? 'warn' : '');
  const splitList = (s) => String(s || '').split(/[,，]/).map((x) => x.trim()).filter(Boolean);
  const emptyPool = () => ({ nodes: 0, pods: 0, cpu: 0, mem: 0, storage: 0, cpuUsed: 0, memUsed: 0 });
  const statusKey = (st) => (st === '运行中' ? 'run' : st === '已销毁' ? 'dead' : 'stop');

  /* ---------------------------------------------------------------- 资源池 */
  function poolHTML(pool, items) {
    const cpuPct = pool.cpu ? (pool.cpuUsed / pool.cpu) * 100 : 0;
    const memPct = pool.mem ? (pool.memUsed / pool.mem) * 100 : 0;
    const targets = sum(items, (e) => e.targets);
    const tight = cpuPct >= 80 || memPct >= 80;
    const qrow = (k, used, unit, total, pct) => `<div class="q">
      <span class="qk">${k}</span>
      <div class="qbar"><div class="bar ${toneOf(pct)}"><i style="width:${Math.min(100, pct)}%"></i></div></div>
      <span class="qv"><b class="num">${used}</b> / ${total} ${unit}</span>
      <span class="qp num">${pct.toFixed(1)}%</span>
    </div>`;
    return `<section class="card pool">
      <div class="pool-hd">
        <div class="pool-ic">${icon('env', 15)}</div>
        <div><div class="pool-name">资源池配额</div>
          <div class="pool-sub">Kubernetes 集群 · 华东一区 · ${pool.nodes} 个节点参与调度 · 容器与靶场共享配额</div></div>
        <div class="pool-right">
          <span class="pill ${tight ? 'warn' : 'ok'}"><i class="dot"></i>${tight ? '配额紧张' : '配额充足'}</span>
          <span class="pill gray">${pool.pods} 个 Pod 运行中</span>
        </div>
      </div>
      <div class="pool-bd">
        <div class="pool-stats">
          <div class="pstat"><div class="k">节点数</div><div class="v num">${pool.nodes}<span>台</span></div></div>
          <div class="pstat"><div class="k">运行 Pod</div><div class="v num">${pool.pods}<span>个</span></div></div>
          <div class="pstat"><div class="k">测试环境</div><div class="v num">${items.length}<span>个</span></div></div>
          <div class="pstat"><div class="k">靶场目标</div><div class="v num">${targets}<span>个</span></div></div>
        </div>
        <div class="quotas">
          ${qrow('CPU', pool.cpuUsed, '核', pool.cpu, cpuPct)}
          ${qrow('内存', pool.memUsed, 'GB', pool.mem, memPct)}
          <div class="q">
            <span class="qk">存储</span>
            <div class="qbar"><div class="qscale" title="分布式块存储容量池"></div></div>
            <span class="qv"><b class="num">${pool.storage}</b> TB</span>
            <span class="qp dimv">容量池</span>
          </div>
        </div>
      </div>
    </section>`;
  }

  /* ---------------------------------------------------------------- 指标行 */
  function kpis(p) {
    const items = p.envs;
    const running = items.filter((e) => e.status === '运行中').length;
    const stopped = items.filter((e) => e.status === '已停止').length;
    const pool = p.pool;
    const cpuPct = pool.cpu ? (pool.cpuUsed / pool.cpu) * 100 : 0;
    const memPct = pool.mem ? (pool.memUsed / pool.mem) * 100 : 0;
    const cts = p.infra && p.infra.containers ? p.infra.containers : [];
    const cRun = cts.filter((c) => c.status === '运行中').length;
    const imported = p.images.filter((i) => i.status === '已导入').length;
    return `<div class="grid g-4">
      ${UI.kpi({
        label: '测试环境', value: items.length, unit: '个',
        meta: `运行中 ${running} · 已停止 ${stopped} · 靶场目标 ${sum(items, (e) => e.targets)} 个`
      })}
      ${UI.kpi({
        label: '资源池 CPU 占用', value: cpuPct.toFixed(1), unit: '%',
        meta: `${pool.cpuUsed} / ${pool.cpu} 核 · 内存 ${memPct.toFixed(1)}%`
      })}
      ${UI.kpi({
        label: '容器总数', value: cts.length, unit: '个',
        meta: `运行中 ${cRun} · 调度节点 ${pool.nodes} 台`
      })}
      ${UI.kpi({
        label: '镜像 / 知识库', value: p.images.length, unit: '个镜像',
        meta: `已导入 ${imported} · 知识库 ${p.kbs.length} 个 · 工具 ${p.tools.length} 个`
      })}
    </div>`;
  }

  /* ---------------------------------------------------------------- 环境卡 */
  function envCard(e) {
    const cls = e.status === '已停止' ? 'off' : e.status === '已销毁' ? 'dead' : '';
    const running = e.status === '运行中';
    const dead = e.status === '已销毁';
    const acts = dead
      ? `<div class="env-acts">
          <span class="fs dim">已回收 · 不可启停</span>
          <button class="btn sm" data-cfg="${e.id}">参数配置</button>
        </div>`
      : `<div class="env-acts">
          <button class="btn sm" data-cfg="${e.id}">参数配置</button>
          ${running
            ? `<button class="btn sm" data-act="stop" data-id="${e.id}">${icon('stop', 11)}停止</button>
               <button class="btn sm" data-act="restart" data-id="${e.id}">${icon('refresh', 11)}重启</button>`
            : `<button class="btn sm primary" data-act="start" data-id="${e.id}">${icon('play', 11)}启动</button>`}
          <button class="btn sm danger" data-act="destroy" data-id="${e.id}">销毁</button>
        </div>`;
    return `<article class="env ${cls}" data-card data-status="${statusKey(e.status)}"
      data-name="${esc(((e.name || '') + ' ' + (e.image || '')).toLowerCase())}">
      <div class="env-hd">
        <div class="env-ic">${icon('env', 16)}</div>
        <div class="env-ttl">
          <div class="env-name">${esc(e.name)}<span class="lvl ${lvlClass(e.level)}">${esc(e.level)}</span></div>
          <div class="env-sub">${esc(e.kind)} · <span class="mono">${esc(e.image)}</span></div>
        </div>
        ${UI.pill(e.status)}
      </div>
      <div class="env-note" title="${esc(e.note)}">${esc(e.note)}</div>
      <div class="env-meters">
        <div class="meter"><span class="mk">CPU</span>
          <div class="bar ${toneOf(e.cpuPct)}"><i style="width:${Math.min(100, e.cpuPct)}%"></i></div>
          <span class="mv">${e.cpu} / 8 核</span></div>
        <div class="meter"><span class="mk">内存</span>
          <div class="bar ${toneOf(e.memPct)}"><i style="width:${Math.min(100, e.memPct)}%"></i></div>
          <span class="mv">${e.mem} / 32 GB</span></div>
      </div>
      <div class="env-foot">
        <span class="fs"><b class="num">${e.targets}</b>个靶场目标</span>
        <span class="fs dim">${esc((e.created || '').slice(5, 10))} 创建</span>
        ${acts}
      </div>
    </article>`;
  }

  /* ---------------------------------------------------------------- 侧栏图 */
  function sideCards(items) {
    const alive = items.filter((e) => e.status !== '已销毁');
    const cpuData = alive.slice().sort((a, b) => b.cpu - a.cpu)
      .map((e) => ({ k: e.name, v: e.cpu, color: C.brand }));
    const lvData = LEVELS.map((l) => ({ k: l.name, v: items.filter((e) => e.level === l.name).length, color: l.color }))
      .filter((d) => d.v > 0);
    const memSum = sum(alive, (e) => e.mem);
    return `<div class="grid g-2">
      ${UI.card({
        title: '资源配置排行', sub: '按环境分配的 CPU 核数排序 · 含已停止环境',
        right: `<span class="pill gray">内存合计 ${memSum.toFixed(1)} GB</span>`,
        body: cpuData.length
          ? Charts.hbars(cpuData, { labelW: 148, valW: 54, unit: ' 核', h: 7, gap: 13 })
          : UI.empty('暂无环境资源记录', '启动环境后可查看资源分配')
      })}
      ${UI.card({
        title: '隔离级别分布', sub: '按沙箱隔离强度分层',
        body: (lvData.length
          ? Charts.donut(lvData, { size: 132, thickness: 11, center: items.length, centerSub: '个环境' })
          : UI.empty('暂无环境', '资源池中还没有测试环境')) +
          `<div class="legend-t">L1 Docker 用于常规对话靶场，L4 独立 VPC 用于高危逃逸演练；启动、销毁与容器级操作均需二次确认。</div>`
      })}
    </div>`;
  }

  /* ---------------------------------------------------------------- 环境列表 */
  function envPanel(p) {
    const items = p.envs;
    return `<div class="stack">
      ${poolHTML(p.pool, items)}
      <div class="lb">
        ${UI.seg([{ v: 'all', t: '全部' }, { v: 'run', t: '运行中' }, { v: 'stop', t: '已停止' }, { v: 'dead', t: '已销毁' }], p.filter)}
        <span class="lb-c" data-filter-count></span>
        <div class="searchbox" style="margin-left:auto">${icon('search', 13)}
          <input data-envq placeholder="搜索环境名称或镜像" value="${esc(p.q)}"></div>
      </div>
      ${items.length
        ? `<div class="env-grid" data-env-grid>${items.map(envCard).join('')}</div>`
        : UI.card({ body: UI.empty('资源池中还没有测试环境', '靶场是任务隔离运行环境，新建后请启动并配置系统提示词', '<button class="btn primary sm" data-new-env style="margin-top:10px">新建第一个环境</button>') })}
      ${sideCards(items)}
    </div>`;
  }

  /* ---------------------------------------------------------------- 容器列表 */
  function containersPanel(p) {
    const infra = p.infra || {};
    const cts = infra.containers || [];
    const res = infra.resources || { cpu: { pct: 0 }, mem: { pct: 0 }, storage: { pct: 0 }, pods: { used: 0, total: 0 } };
    const nodes = infra.nodes || [];
    const cRun = cts.filter((c) => c.status === '运行中').length;
    const box = (k, v, unit, sub, pct2) => `<div class="res-box">
      <div class="k"><span>${k}</span><span>${(Number(pct2) || 0).toFixed(1)}%</span></div>
      <div class="v">${v}<small>${unit}</small></div>
      ${UI.bar(Number(pct2) || 0, toneOf(Number(pct2) || 0))}
      <div class="k" style="margin-top:6px"><span>${sub}</span></div>
    </div>`;
    const rows = cts.map((c) => {
      const cpuPct = Math.min(100, (c.cpu / 8) * 100);
      const memPct = Math.min(100, (c.mem / 32) * 100);
      const dead = c.status === '已销毁';
      const running = c.status === '运行中';
      return `<tr>
        <td><div class="t-main mono">${esc(c.name)}</div><div class="t-sub mono">${esc(c.image)}</div></td>
        <td><div class="t-main" style="font-weight:520">${esc(c.env || '未绑定')}</div>
          <div class="t-sub">${esc(c.grp)} · ${esc(c.kind)}</div></td>
        <td>${UI.pill(c.status)}</td>
        <td><div class="ct-cpu"><div class="bar ${toneOf(cpuPct)}"><i style="width:${cpuPct}%"></i></div>
          <span>${c.cpu} 核</span></div></td>
        <td><div class="ct-cpu"><div class="bar ${toneOf(memPct)}"><i style="width:${memPct}%"></i></div>
          <span>${c.mem} GB</span></div></td>
        <td class="dim" style="font-size:11.5px">${dead ? '—' : esc(c.uptime || '—')}</td>
        <td><div class="ct-acts">
          ${dead
            ? `<button class="btn sm" data-cact="start" data-id="${c.id}">重新拉起</button>`
            : running
              ? `<button class="btn sm" data-cact="stop" data-id="${c.id}">${icon('stop', 11)}停止</button>`
              : `<button class="btn sm primary" data-cact="start" data-id="${c.id}">${icon('play', 11)}启动</button>`}
          <button class="btn sm" data-cact="restart" data-id="${c.id}" ${dead ? 'disabled' : ''}>重启</button>
          <button class="btn sm" data-console="${c.id}">控制台</button>
          <button class="btn sm danger" data-cact="destroy" data-id="${c.id}" ${dead ? 'disabled' : ''}>销毁</button>
        </div></td>
      </tr>`;
    }).join('');

    return `<div class="stack">
      ${UI.card({
        title: '集群负载与节点', sub: '每 10 秒自动刷新；配额见上方概况',
        body: `<div class="res-strip">
            ${box('CPU', res.cpu.used, '核', `${res.cpu.cores} 核总量`, res.cpu.pct)}
            ${box('内存', res.mem.used, 'GB', `${res.mem.totalGB} GB 总量`, res.mem.pct)}
            ${box('存储', res.storage.used, 'TB', `${res.storage.totalTB} TB 容量池`, res.storage.pct)}
            ${box('Pod', res.pods.used, '个', `上限 ${res.pods.total} 个`, res.pods.total ? (res.pods.used / res.pods.total) * 100 : 0)}
          </div>
          <div class="nodes"><span class="nl">调度节点</span>
            ${nodes.map((n) => `<span class="node ${n.cpu >= 80 ? 'warn' : ''}"><i></i>${esc(n.name)} · CPU ${n.cpu}% · 内存 ${n.mem}%</span>`).join('')}
          </div>`
      })}
      ${UI.card({
        title: '容器', sub: `共 ${cts.length} 个容器 · 运行中 ${cRun} 个 · 可启停、重启、销毁并打开 Web 控制台`,
        flush: true,
        right: `<button class="btn sm" data-refresh>${icon('refresh', 12)}刷新状态</button>`,
        body: cts.length
          ? `<div class="tbl-wrap"><table class="tbl">
              <thead><tr><th style="width:240px">容器</th><th style="width:180px">归属环境</th>
                <th style="width:92px">状态</th><th style="width:150px">CPU</th><th style="width:150px">内存</th>
                <th style="width:92px">运行时长</th><th style="width:236px"></th></tr></thead>
              <tbody>${rows}</tbody></table></div>`
          : UI.empty('暂无容器', '容器由调度器创建后自动出现在容器列表')
      })}
      ${UI.note('容器控制台为只读沙箱会话：文件系统只读、出网策略拒绝，所有命令记录审计事件。销毁容器只回收运行时，可在容器列表中重新拉起。')}
    </div>`;
  }

  /* ---------------------------------------------------------------- 模板与镜像 */
  function catalogPanel(p) {
    const imported = p.images.filter((i) => i.status === '已导入').length;
    const tplRows = p.templates.map((t) => `<tr>
      <td><div class="t-main">${esc(t.name)}</div>
        <div class="t-snip mono">${esc(t.sys_prompt || '（空提示词，创建后可再配置）')}</div></td>
      <td><span class="chip">${esc(t.kind)}</span></td>
      <td><span class="lvl ${lvlClass(t.level)}">${esc(t.level)}</span></td>
      <td class="t-num">${Number(t.temperature).toFixed(1)}</td>
      <td class="t-num">${num(t.max_tokens)}</td>
      <td class="t-num">${num(t.uses)}</td>
      <td class="dim" style="font-size:11.5px">${esc(String(t.created || '').slice(5, 16))}</td>
      <td class="t-act"><button class="btn sm" data-use-tmpl="${t.id}">从模板创建</button></td>
    </tr>`).join('');
    const imgRows = p.images.map((im) => `<tr>
      <td><div class="t-main mono">${esc(im.name)}:${esc(im.tag)}</div>
        <div class="t-sub">IMG-${String(im.id).padStart(3, '0')} · ${esc(String(im.created || '').slice(5, 16))}</div></td>
      <td class="t-num" style="color:var(--text-2)">${esc(im.size || '—')}</td>
      <td><span class="chip">${esc(im.source)}</span></td>
      <td>${UI.pill(im.status, im.status === '已导入' ? 'ok' : 'warn')}</td>
      <td class="t-act">${im.status === '已导入'
        ? '<span class="dim" style="font-size:11.5px">已可用于靶场</span>'
        : `<button class="btn sm primary" data-import-img="${im.id}">导入靶场</button>`}</td>
    </tr>`).join('');
    return `<div class="stack">
      ${UI.card({
        title: '环境模板', sub: `共 ${p.templates.length} 个模板 · 从模板创建可继承系统提示词与采样参数`,
        flush: true,
        right: `<button class="btn sm" data-new-tmpl>${icon('plus', 12)}新建模板</button>`,
        body: p.templates.length
          ? `<div class="tbl-wrap"><table class="tbl">
              <thead><tr><th>模板名称</th><th style="width:90px">场景</th><th style="width:122px">隔离级别</th>
                <th style="width:70px">温度</th><th style="width:104px">最大 Token</th><th style="width:86px">使用次数</th>
                <th style="width:120px">创建时间</th><th style="width:118px"></th></tr></thead>
              <tbody>${tplRows}</tbody></table></div>`
          : UI.empty('暂无环境模板', '新建模板后可按模板创建同规格的测试环境')
      })}
      ${UI.card({
        title: 'Docker 镜像', sub: `共 ${p.images.length} 个镜像 · 已导入 ${imported} 个 · 导入后可作为靶场运行时镜像`,
        flush: true,
        right: `<button class="btn sm" data-new-image>${icon('plus', 12)}登记镜像</button>`,
        body: p.images.length
          ? `<div class="tbl-wrap"><table class="tbl">
              <thead><tr><th>镜像</th><th style="width:120px">大小</th><th style="width:120px">来源</th>
                <th style="width:110px">状态</th><th style="width:140px"></th></tr></thead>
              <tbody>${imgRows}</tbody></table></div>`
          : UI.empty('暂无镜像', '登记镜像并导入靶场后可创建对应靶场实例')
      })}
    </div>`;
  }

  /* ---------------------------------------------------------------- 知识库与工具 */
  function assetsPanel(p) {
    const docs = sum(p.kbs, (k) => k.docs);
    const kbRows = p.kbs.map((k) => `<tr>
      <td><div class="t-main">${esc(k.name)}</div>
        <div class="t-sub">${esc(k.size || '—')} · 更新 ${esc(String(k.updated || '').slice(5, 16))}</div></td>
      <td class="t-num">${num(k.docs)}</td>
      <td class="dim" style="font-size:11.5px">${esc(k.env || '未挂载')}</td>
      <td>${UI.pill(k.status, k.status === '受控' ? 'warn' : 'ok')}</td>
    </tr>`).join('');
    const toolRows = p.tools.map((t) => `<tr>
      <td><div class="t-main">${esc(t.name)}</div>
        <div class="t-sub">${esc(t.descr || '暂无描述')}</div></td>
      <td><span class="chip">${esc(t.kind)}</span></td>
      <td class="t-num">${num(t.calls)}</td>
      <td>${UI.pill(t.status)}</td>
    </tr>`).join('');
    const kbChart = Charts.hbars(
      p.kbs.slice().sort((a, b) => b.docs - a.docs)
        .map((k) => ({ k: k.name, v: k.docs, color: C.brand })),
      { labelW: 150, valW: 62, unit: ' 篇', h: 7, gap: 13 }
    );
    const toolChart = Charts.hbars(
      p.tools.filter((t) => t.calls > 0).sort((a, b) => b.calls - a.calls)
        .map((t) => ({ k: t.name, v: t.calls, color: C.cyan })),
      { labelW: 150, valW: 62, unit: ' 次', h: 7, gap: 13 }
    );
    return `<div class="grid g-2" style="align-items:start">
      ${UI.card({
        title: '知识库', sub: `${p.kbs.length} 个库 · ${num(docs)} 篇文档 · 可在环境参数配置中挂载`,
        flush: true,
        right: `<button class="btn sm" data-new-kb>${icon('plus', 12)}新建知识库</button>`,
        body: p.kbs.length
          ? `<div class="tbl-wrap"><table class="tbl">
              <thead><tr><th>名称</th><th style="width:88px">文档数</th>
                <th style="width:150px">挂载环境</th><th style="width:82px">状态</th></tr></thead>
              <tbody>${kbRows}</tbody></table></div>`
          : UI.empty('暂无知识库', '新建知识库后可挂载到 RAG 靶场')
      })}
      ${UI.card({
        title: '自定义工具与 Skill', sub: `${p.tools.length} 个条目 · 共 ${num(sum(p.tools, (t) => t.calls))} 次调用`,
        flush: true,
        right: `<button class="btn sm" data-new-tool>${icon('plus', 12)}注册工具</button>`,
        body: p.tools.length
          ? `<div class="tbl-wrap"><table class="tbl">
              <thead><tr><th>名称 / 说明</th><th style="width:82px">类型</th>
                <th style="width:88px">调用量</th><th style="width:82px">状态</th></tr></thead>
              <tbody>${toolRows}</tbody></table></div>`
          : UI.empty('暂无工具', '注册工具或 Skill 后可挂载到 Agent 靶场')
      })}
    </div>
    ${UI.card({
      title: '资源使用排行',
      sub: `知识库共 ${num(docs)} 篇文档 · 工具累计 ${num(sum(p.tools, (t) => t.calls))} 次调用 · 排行取当前挂载配置`,
      body: `<div class="grid g-2" style="align-items:start">
        <div class="chart-col"><div class="cfg-h">知识库文档量</div>${p.kbs.length ? kbChart : UI.empty('暂无知识库', '新建知识库后展示文档量排行')}</div>
        <div class="chart-col"><div class="cfg-h">工具调用量</div>${p.tools.filter((t) => t.calls > 0).length ? toolChart : UI.empty('暂无调用记录', '工具被靶场调用后展示排行')}</div>
      </div>`
    })}`;
  }

  /* ---------------------------------------------------------------- 页面视图 */
  function view(p) {
    const items = p.envs;
    const running = items.filter((e) => e.status === '运行中').length;
    const stopped = items.filter((e) => e.status === '已停止').length;
    const dead = items.filter((e) => e.status === '已销毁').length;
    const cCount = p.infra && p.infra.containers ? p.infra.containers.length : 0;
    const tabs = [
      { v: 'envs', t: `环境列表 · ${items.length}` },
      { v: 'containers', t: `容器 · ${cCount}` },
      { v: 'catalog', t: `模板与镜像 · ${p.templates.length + p.images.length}` },
      { v: 'assets', t: `知识库与工具 · ${p.kbs.length + p.tools.length}` }
    ];
    return `${UI.pageHd({
      title: '测试环境',
      sub: `靶场的创建、启动与销毁 · 运行中 ${running} 个 · 已停止 ${stopped} 个${dead ? ` · 已销毁 ${dead} 个` : ''} · 销毁环境不可恢复`,
      actions: `<button class="btn" data-refresh>${icon('refresh', 14)}刷新数据</button>
        <button class="btn primary" data-new-env>${icon('plus', 14)}新建环境</button>`
    })}
    <div class="stack">
      ${kpis(p)}
      ${UI.tabs(tabs, p.tab)}
      <div class="fade-in">${panel(p)}</div>
    </div>`;
  }

  function panel(p) {
    if (p.tab === 'containers') return containersPanel(p);
    if (p.tab === 'catalog') return catalogPanel(p);
    if (p.tab === 'assets') return assetsPanel(p);
    return envPanel(p);
  }

  /* ---------------------------------------------------------------- 过滤 */
  function applyFilter(p, root) {
    const grid = root.querySelector('[data-env-grid]');
    const label = root.querySelector('[data-filter-count]');
    if (!grid) { if (label) label.textContent = ''; return; }
    const q = String(p.q || '').trim().toLowerCase();
    let shown = 0;
    grid.querySelectorAll('[data-card]').forEach((el) => {
      const okStatus = p.filter === 'all' || el.dataset.status === p.filter;
      const okQuery = !q || el.dataset.name.indexOf(q) >= 0;
      const on = okStatus && okQuery;
      el.style.display = on ? '' : 'none';
      if (on) shown++;
    });
    if (label) label.textContent = `显示 ${shown} / ${p.envs.length} 个环境`;
  }

  /* -------------------------------------------------- 环境参数（35 项分组） */
  function envParamInitial(def) {
    const v = def.value == null ? def.default : def.value;
    if (def.type === 'bool') return !!v;
    if (def.type === 'int') return Number.isFinite(Number(v)) ? Math.trunc(Number(v)) : 0;
    if (def.type === 'float') return Number.isFinite(Number(v)) ? Number(v) : 0;
    return v == null ? '' : String(v);
  }

  function envParamField(def) {
    const v = envParamInitial(def);
    const name = esc(def.name || def.k);
    const tip = esc(def.desc || def.k);
    if (def.type === 'bool') {
      return `<label class="cfg-pf ck"><span class="k" title="${tip}">${name}</span>
        <span class="cfg-sw"><input type="checkbox" data-pk="${esc(def.k)}" data-pt="bool"${v ? ' checked' : ''}><i></i></span></label>`;
    }
    if (def.type === 'select') {
      const opts = (def.options || []).map((o) =>
        `<option value="${esc(o)}"${String(v) === String(o) ? ' selected' : ''}>${esc(o)}</option>`).join('');
      return `<label class="cfg-pf"><span class="k" title="${tip}">${name}</span>
        <select class="select" data-pk="${esc(def.k)}" data-pt="select">${opts}</select></label>`;
    }
    const isNum = def.type === 'int' || def.type === 'float';
    const attrs = isNum
      ? ` type="number"${def.min != null ? ` min="${esc(String(def.min))}"` : ''}${def.max != null ? ` max="${esc(String(def.max))}"` : ''}${def.step != null ? ` step="${esc(String(def.step))}"` : ''}`
      : ' type="text"';
    const range = isNum && (def.min != null || def.max != null)
      ? `<small>${esc(String(def.min == null ? '−∞' : def.min))} ~ ${esc(String(def.max == null ? '∞' : def.max))}</small>`
      : '';
    return `<label class="cfg-pf"><span class="k" title="${tip}">${name}</span>
      <input class="input${isNum ? ' num' : ''}" data-pk="${esc(def.k)}" data-pt="${esc(def.type || 'text')}"${attrs} value="${esc(String(v))}">${range}</label>`;
  }

  function envParamPanel(d) {
    const defs = d.paramDefs || [];
    const byKey = {};
    defs.forEach((x) => { byKey[x.k] = x; });
    const groups = d.paramGroups || [];
    if (!defs.length) return '<div class="pick-empty">接口未返回参数定义（paramDefs），无法渲染参数面板</div>';
    return groups.map((g) => {
      const keys = (g.keys || []).filter((k) => byKey[k]);
      return `<div class="cfg-pg">
        <div class="cfg-pg-h"><b>${esc(g.name)}</b><span>${keys.length} 项</span></div>
        <div class="cfg-pgrid">${keys.map((k) => envParamField(byKey[k])).join('')}</div>
      </div>`;
    }).join('');
  }

  /* ---------------------------------------------------------------- 环境参数配置 */
  async function openConfig(p, env) {
    let d;
    try {
      d = await API.get('/api/env-config/' + env.id);
    } catch (e) {
      UI.toast('环境参数读取失败：' + e.message, 'err');
      return;
    }
    const kbs = d.kbs || [];
    const tools = d.toolsList || [];
    const skills = d.skillsList || [];
    const tpls = p.templates.length ? p.templates : (d.templates || []);
    const selKb = splitList(d.kb);
    const selTools = splitList(d.tools);
    const selSkills = splitList(d.skills);
    const picked = (list, cure) => (list.length
      ? list.map((x) => `<span class="chip ${cure.indexOf(x) >= 0 ? 'on' : ''}" data-v="${esc(x)}">${esc(x)}</span>`).join('')
      : '<span class="pick-empty">暂无可挂载项，请先在「知识库与工具」中创建</span>');
    const body = `<div class="cfg-env">
        <div class="ce">环境名称<b>${esc(env.name)}</b></div>
        <div class="ce">场景类型<b>${esc(env.kind)}</b></div>
        <div class="ce">隔离级别<b>${esc(env.level)}</b></div>
        <div class="ce">运行状态<b>${esc(env.status)}</b></div>
        <div class="ce">靶场镜像<b class="mono" style="font-size:11.5px">${esc(env.image)}</b></div>
        <div class="ce">靶场目标<b>${env.targets} 个</b></div>
      </div>
      <div class="cfg-s">
        <div class="cfg-h">环境模板<span class="hint">载入模板会覆盖下方提示词与采样参数，保存后生效</span></div>
        <div class="tmplbar">
          <select class="select" data-tmpl>
            <option value="">不使用模板</option>
            ${tpls.map((t) => `<option value="${t.id}" ${d.template === t.name ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}
          </select>
          <button class="btn" data-apply-tpl>载入模板</button>
        </div>
      </div>
      <div class="cfg-s">
        <div class="cfg-h">环境参数<span class="hint">共 ${esc(String(d.paramCount || 0))} 项 / ${(d.paramGroups || []).length} 组 · 按分组渲染，保存时仅提交变更项</span></div>
        <div class="cfg-pgroups" id="cfg-params">${envParamPanel(d)}</div>
        <div class="cfg-hint"><span data-pcount>0 项变更</span><span>数值需在允许区间内，保存后下发到靶场实例</span></div>
      </div>
      <div class="cfg-s">
        <div class="cfg-h">挂载知识库<span class="hint">可多选 · 注入 RAG 检索源</span></div>
        <div class="pick" data-pick-group="kb">${picked(kbs, selKb)}</div>
      </div>
      <div class="grid g-2">
        <div class="cfg-s" style="margin-bottom:0">
          <div class="cfg-h">挂载工具<span class="hint">可多选</span></div>
          <div class="pick" data-pick-group="tools">${picked(tools, selTools)}</div>
        </div>
        <div class="cfg-s" style="margin-bottom:0">
          <div class="cfg-h">挂载 Skill<span class="hint">可多选</span></div>
          <div class="pick" data-pick-group="skills">${picked(skills, selSkills)}</div>
        </div>
      </div>
      <div class="cfg-s" style="margin-top:18px">
        <div class="cfg-h">配置摘要<span class="hint">保存前核对</span></div>
        <div class="cfg-sum">
          <div><span>挂载知识库</span><b data-sum-kb>0 个</b></div>
          <div><span>挂载工具</span><b data-sum-tools>0 个</b></div>
          <div><span>挂载 Skill</span><b data-sum-skills>0 个</b></div>
          <div><span>单次回复上限</span><b data-sum-tok>0 Token</b></div>
        </div>
      </div>
      <div class="cfg-flow">
        <div class="cfg-h" style="margin-bottom:9px">下发链路</div>
        <div class="fl-row"><i>1</i><span>保存后写入环境配置，持久化存储</span></div>
        <div class="fl-row"><i>2</i><span>环境启动或重启时注入靶场实例，覆盖运行时参数</span></div>
        <div class="fl-row"><i>3</i><span>命中提示词与工具调用全量写入审计日志，可在审计日志中核对</span></div>
      </div>`;

    const dr = UI.drawer({
      title: '环境参数配置',
      sub: `${esc(env.name)} · ${esc(env.level)} · 配置保存后下发到靶场实例`,
      width: '820px',
      body,
      footer: `<span class="dim" style="font-size:11.5px;margin-right:auto">配置项随环境持久化，重启后保留</span>
        <button class="btn" data-x2>取消</button>
        <button class="btn primary" data-save>保存配置</button>`
    });
    const q = (sel) => dr.body.querySelector(sel);
    const tplSel = q('[data-tmpl]');
    const defs = d.paramDefs || [];
    const defMap = {};
    defs.forEach((x) => { defMap[x.k] = x; });
    const initial = {};
    defs.forEach((x) => { initial[x.k] = envParamInitial(x); });
    const fieldEl = (k) => dr.body.querySelector('[data-pk="' + k + '"]');
    const readParam = (x) => {
      const el = fieldEl(x.k);
      if (!el) return initial[x.k];
      if (x.type === 'bool') return !!el.checked;
      if (x.type === 'int') { const n = parseInt(el.value, 10); return isNaN(n) ? null : n; }
      if (x.type === 'float') { const n = parseFloat(el.value); return isNaN(n) ? null : n; }
      return el.value;
    };
    const changedParams = () => {
      const out = {};
      defs.forEach((x) => {
        const cur = readParam(x);
        if (cur === null) return;
        if (cur !== initial[x.k]) out[x.k] = cur;
      });
      return out;
    };
    const refreshDirty = () => {
      let n = 0;
      defs.forEach((x) => {
        const el = fieldEl(x.k);
        if (!el) return;
        const cur = readParam(x);
        const dirty = cur === null || cur !== initial[x.k];
        const wrap = el.closest('.cfg-pf');
        if (wrap) wrap.classList.toggle('dirty', dirty);
        if (dirty) n++;
      });
      const c = q('[data-pcount]');
      if (c) c.textContent = n ? '已修改 ' + n + ' 项' : '0 项变更';
    };
    const pick = (g) => Array.from(dr.body.querySelectorAll(`[data-pick-group="${g}"] .chip.on`))
      .map((x) => x.dataset.v).join(',');
    const tplName = () => (tplSel.value ? (tplSel.options[tplSel.selectedIndex] || {}).textContent || '' : '');
    const sortedKeys = (str) => String(str || '').split(',').filter(Boolean).sort().join(',');
    const initSel = { kb: pick('kb'), tools: pick('tools'), skills: pick('skills'), template: tplName() };
    const sameSel = (sel) => sortedKeys(sel.kb) === sortedKeys(initSel.kb) &&
      sortedKeys(sel.tools) === sortedKeys(initSel.tools) &&
      sortedKeys(sel.skills) === sortedKeys(initSel.skills) &&
      sel.template === initSel.template;
    const refreshSum = () => {
      const pickN = (g) => dr.body.querySelectorAll(`[data-pick-group="${g}"] .chip.on`).length;
      q('[data-sum-kb]').textContent = pickN('kb') + ' 个';
      q('[data-sum-tools]').textContent = pickN('tools') + ' 个';
      q('[data-sum-skills]').textContent = pickN('skills') + ' 个';
      const mt = defMap.max_tokens ? readParam(defMap.max_tokens) : 0;
      q('[data-sum-tok]').textContent = num(Number(mt) || 0) + ' Token';
    };
    refreshDirty(); refreshSum();
    const pbox = q('#cfg-params');
    if (pbox) {
      const onEdit = (ev) => { if (ev.target && ev.target.matches('[data-pk]')) refreshDirty(); };
      pbox.addEventListener('input', onEdit);
      pbox.addEventListener('change', onEdit);
    }
    q('[data-apply-tpl]').onclick = () => {
      const t = tpls.find((x) => String(x.id) === tplSel.value);
      if (!t) { UI.toast('请先在下拉框选择环境模板', 'err'); return; }
      const set = (k, v) => { const el = fieldEl(k); if (el && v != null && v !== '') el.value = v; };
      set('system_prompt', t.sys_prompt || '');
      const tv = Number(t.temperature);
      if (!isNaN(tv)) set('temperature', tv);
      if (t.max_tokens) set('max_tokens', Number(t.max_tokens));
      refreshDirty(); refreshSum();
      UI.toast('已载入模板「' + t.name + '」，保存后生效');
    };
    dr.body.addEventListener('click', (ev) => {
      const ch = ev.target.closest('.pick .chip[data-v]');
      if (ch) { ch.classList.toggle('on'); refreshSum(); }
    });
    dr.el.querySelector('[data-x2]').onclick = dr.close;
    const saveBtn = dr.el.querySelector('[data-save]');
    saveBtn.onclick = async () => {
      const bad = [];
      defs.forEach((x) => {
        if (x.type !== 'int' && x.type !== 'float') return;
        const v = readParam(x);
        if (v === null) { bad.push('「' + x.name + '」需填写数字'); return; }
        if (x.min != null && v < x.min) bad.push('「' + x.name + '」不能小于 ' + x.min);
        if (x.max != null && v > x.max) bad.push('「' + x.name + '」不能大于 ' + x.max);
      });
      if (bad.length) {
        UI.toast(bad[0] + (bad.length > 1 ? '（共 ' + bad.length + ' 项不合法）' : ''), 'err');
        return;
      }
      const sel = { kb: pick('kb'), tools: pick('tools'), skills: pick('skills'), template: tplName() };
      const params = changedParams();
      const pn = Object.keys(params).length;
      if (!pn && sameSel(sel)) { UI.toast('未检测到配置变更'); return; }
      const payload = { kb: sel.kb, tools: sel.tools, skills: sel.skills, template: sel.template };
      if (pn) payload.params = params;
      saveBtn.disabled = true;
      try {
        const r = await API.post('/api/env-config/' + env.id, payload);
        const appliedN = (r && r.applied) ? Object.keys(r.applied).length : pn;
        UI.toast(pn
          ? `环境参数已保存：${appliedN} 项变更已下发（共 ${(r && r.paramCount) || defs.length} 项）`
          : '环境挂载项已保存');
        dr.close();
        await p.loadEnvs();
        p.render();
      } catch (e) {
        UI.toast('保存失败：' + ((e && e.message) || e), 'err');
        saveBtn.disabled = false;
      }
    };
  }

  /* ---------------------------------------------------------------- 容器控制台 */
  function openConsole(p, c) {
    const promptText = `agent@${c.name}:~$`;
    const dr = UI.drawer({
      title: '容器控制台',
      sub: `${esc(c.name)} · ${esc(c.kind)} · ${esc(c.image)} · 归属 ${esc(c.env || '未绑定')}`,
      width: '860px',
      body: `<div class="note" style="margin-bottom:12px">只读文件系统 · 出网策略拒绝（egress-deny）· 命令与输出全量写入审计日志。支持：help / ls / ps / whoami / env / exit。</div>
        <div class="cs-quick"><span class="dim" style="font-size:11.5px;margin-right:2px">快捷命令</span>
          ${QUICK_CMDS.map((x) => `<button class="chip" data-quick="${x}">${x}</button>`).join('')}
        </div>
        <div class="term cs-term" data-term>
          <div class="cs-scroll" data-lines></div>
          <div class="cs-in-row">
            <span class="cs-p">${esc(promptText)}</span>
            <input class="cs-in" data-cmd placeholder="输入命令后回车执行" autocomplete="off" spellcheck="false">
          </div>
        </div>`,
      footer: `<button class="btn" data-clear>清屏</button><button class="btn" data-x3>关闭终端</button>`
    });
    dr.body.classList.add('cs-body');
    const scroller = dr.body.querySelector('.cs-scroll');
    const box = dr.body.querySelector('[data-lines]');
    const inp = dr.body.querySelector('[data-cmd]');
    const push = (cls, text) => {
      const div = document.createElement('div');
      div.className = 'cs-line ' + cls;
      div.textContent = text;
      box.appendChild(div);
      scroller.scrollTop = scroller.scrollHeight;
    };
    const echo = (cmd) => {
      const div = document.createElement('div');
      div.className = 'cs-line';
      const a = document.createElement('span');
      a.className = 'cs-s';
      a.textContent = promptText + ' ';
      const b = document.createElement('span');
      b.className = 'cs-e';
      b.textContent = cmd;
      div.append(a, b);
      box.appendChild(div);
      scroller.scrollTop = scroller.scrollHeight;
    };
    const run = async (raw) => {
      const cmd = String(raw == null ? inp.value : raw).trim();
      if (!cmd) return;
      inp.value = '';
      echo(cmd);
      if (cmd === 'exit' || cmd === 'quit') {
        push('cs-w', '会话已关闭，终端连接终止。');
        inp.disabled = true;
        setTimeout(dr.close, 700);
        return;
      }
      inp.disabled = true;
      try {
        const r = await API.post('/api/infra/containers/' + c.id + '/console', { cmd });
        const out = (r && r.out) ? String(r.out) : '（命令无输出）';
        out.split('\n').forEach((ln) => push('cs-o', ln));
      } catch (e) {
        push('cs-x', '执行失败：' + e.message);
      } finally {
        inp.disabled = false;
        inp.focus();
      }
    };
    inp.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') { ev.preventDefault(); run(); }
    });
    dr.body.querySelectorAll('[data-quick]').forEach((b) => {
      b.onclick = () => run(b.dataset.quick);
    });
    dr.el.querySelector('[data-x3]').onclick = dr.close;
    dr.el.querySelector('[data-clear]').onclick = () => { box.innerHTML = ''; inp.focus(); };
    API.post('/api/infra/containers/' + c.id + '/console', { cmd: '' }).then((r) => {
      String((r && r.banner) || '').split('\n').forEach((ln) => { if (ln.trim()) push('cs-s', ln); });
      setTimeout(() => inp.focus(), 240);
    }).catch((e) => push('cs-x', '终端连接失败：' + e.message));
  }

  /* ---------------------------------------------------------------- 弹窗 */
  function field(label, inner, full) {
    return `<div class="field" ${full ? 'style="grid-column:1/-1"' : ''}><label>${label}</label>${inner}</div>`;
  }

  function openNewEnv(p) {
    const body = `<div class="form-grid">
      ${field('环境名称', '<input class="input" data-name placeholder="如 多轮诱导靶场-L2">')}
      ${field('场景类型', `<select class="select" data-kind>${KINDS.map((k) => `<option>${esc(k)}</option>`).join('')}</select>`)}
      ${field('隔离级别', `<select class="select" data-level>${LEVELS.map((l) => `<option>${esc(l.name)}</option>`).join('')}</select>`)}
      ${field('靶场镜像', '<input class="input mono" data-image value="agent-base:1.4">')}
      ${field('被测目标数', '<input class="input num" data-targets type="number" min="0" max="64" value="2">')}
      ${field('环境备注', '<input class="input" data-note placeholder="用途与靶场说明">')}
    </div>
    <div class="note" style="margin-top:14px">新建环境默认处于「已停止」状态。创建后请在环境卡片上启动，并进入「参数配置」挂载系统提示词、知识库、工具与 Skill。</div>`;
    UI.modal({
      title: '新建测试环境',
      body,
      okText: '创建环境',
      onOk: async (el) => {
        const name = el.querySelector('[data-name]').value.trim();
        if (!name) { UI.toast('请填写环境名称', 'err'); return false; }
        const targets = parseInt(el.querySelector('[data-targets]').value, 10);
        const payload = {
          name,
          kind: el.querySelector('[data-kind]').value,
          level: el.querySelector('[data-level]').value,
          image: el.querySelector('[data-image]').value.trim() || 'agent-base:1.4',
          targets: isNaN(targets) ? 0 : Math.max(0, Math.min(64, targets)),
          note: el.querySelector('[data-note]').value.trim() || '手动创建'
        };
        try {
          await API.post('/api/envs', payload);
          UI.toast('测试环境「' + name + '」已创建');
          p.tab = 'envs';
          await p.loadAll();
          p.render();
        } catch (e) {
          UI.toast('创建失败：' + e.message, 'err');
          return false;
        }
      }
    });
  }

  function openNewTemplate(p) {
    const body = `<div class="form-grid">
      ${field('模板名称', '<input class="input" data-name placeholder="如 高危 RAG 泄露演练模板">')}
      ${field('场景类型', `<select class="select" data-kind>${KINDS.map((k) => `<option>${esc(k)}</option>`).join('')}</select>`)}
      ${field('隔离级别', `<select class="select" data-level>${LEVELS.map((l) => `<option>${esc(l.name)}</option>`).join('')}</select>`)}
      ${field('温度', '<input class="input num" data-temp type="number" min="0" max="2" step="0.1" value="0.7">')}
      ${field('最大 Token', '<input class="input num" data-max type="number" min="256" max="32768" step="256" value="2048">')}
      ${field('系统提示词', '<textarea class="textarea" data-sys rows="4" placeholder="模板内置的系统提示词，创建环境时继承"></textarea>', true)}
    </div>`;
    UI.modal({
      title: '新建环境模板',
      body,
      okText: '保存模板',
      onOk: async (el) => {
        const name = el.querySelector('[data-name]').value.trim();
        if (!name) { UI.toast('请填写模板名称', 'err'); return false; }
        const temp = parseFloat(el.querySelector('[data-temp]').value);
        const max = parseInt(el.querySelector('[data-max]').value, 10);
        if (isNaN(temp) || temp < 0 || temp > 2) { UI.toast('温度需在 0 到 2 之间', 'err'); return false; }
        if (isNaN(max) || max < 256 || max > 32768) { UI.toast('最大 Token 需在 256 到 32768 之间', 'err'); return false; }
        try {
          await API.post('/api/env-templates', {
            name,
            kind: el.querySelector('[data-kind]').value,
            level: el.querySelector('[data-level]').value,
            sysPrompt: el.querySelector('[data-sys]').value.trim(),
            temperature: temp,
            maxTokens: max
          });
          UI.toast('环境模板「' + name + '」已保存');
          p.tab = 'catalog';
          await p.loadTemplates();
          p.render();
        } catch (e) {
          UI.toast('模板保存失败：' + e.message, 'err');
          return false;
        }
      }
    });
  }

  function openFromTemplate(p, tpl) {
    if (!tpl) {
      if (!p.templates.length) { UI.toast('暂无可用环境模板，请先新建模板', 'err'); return; }
      tpl = p.templates[0];
    }
    const body = `<div class="note" style="margin-bottom:14px">将按模板「<b>${esc(tpl.name)}</b>」的 ${esc(tpl.kind)} 场景与 ${esc(tpl.level)} 隔离级别创建环境，并继承其系统提示词与采样参数。</div>
      <div class="form-grid">
        ${field('环境名称', `<input class="input" data-name value="${esc(tpl.name)}-实例">`, true)}
        ${field('目标模板', `<div class="input" style="display:flex;align-items:center;color:var(--text-2)">${esc(tpl.name)}</div>`, true)}
      </div>
      <div class="kv" style="margin-top:12px"><span>温度</span><b>${Number(tpl.temperature).toFixed(1)}</b></div>
      <div class="kv" style="margin-top:6px"><span>最大 Token</span><b>${num(tpl.max_tokens)}</b></div>
      <div class="kv" style="margin-top:6px"><span>已使用次数</span><b>${num(tpl.uses)} 次</b></div>`;
    UI.modal({
      title: '从模板创建环境',
      body,
      okText: '创建环境',
      onOk: async (el) => {
        const name = el.querySelector('[data-name]').value.trim();
        if (!name) { UI.toast('请填写环境名称', 'err'); return false; }
        try {
          await API.post('/api/envs/from-template', { template_id: tpl.id, templateId: tpl.id, name });
          UI.toast('已按模板创建测试环境「' + name + '」');
          p.tab = 'envs';
          await p.loadAll();
          p.render();
        } catch (e) {
          UI.toast('创建失败：' + e.message, 'err');
          return false;
        }
      }
    });
  }

  function openNewImage(p) {
    const body = `<div class="form-grid">
      ${field('镜像名称', '<input class="input mono" data-name placeholder="如 escape-lab">')}
      ${field('镜像 Tag', '<input class="input mono" data-tag value="1.0">')}
    </div>
    <div class="note" style="margin-top:14px">登记后自动导入靶场镜像仓库；导入完成的镜像可用于新建测试环境。</div>`;
    UI.modal({
      title: '登记 Docker 镜像',
      body,
      okText: '登记并导入',
      onOk: async (el) => {
        const name = el.querySelector('[data-name]').value.trim();
        if (!name) { UI.toast('请填写镜像名称', 'err'); return false; }
        const tag = el.querySelector('[data-tag]').value.trim() || 'latest';
        try {
          const r = await API.post('/api/images', { name, tag });
          if (r && r.id) await API.post('/api/images/' + r.id + '/import');
          UI.toast('镜像 ' + name + ':' + tag + ' 已登记并导入靶场');
          p.tab = 'catalog';
          await p.loadImages();
          p.render();
        } catch (e) {
          UI.toast('镜像登记失败：' + e.message, 'err');
          return false;
        }
      }
    });
  }

  function openNewKb(p) {
    const envs = p.envs.filter((e) => e.status !== '已销毁');
    const body = `<div class="form-grid">
      ${field('知识库名称', '<input class="input" data-name placeholder="如 攻击手法知识库">')}
      ${field('文档数量', '<input class="input num" data-docs type="number" min="1" max="100000" value="100">')}
      ${field('挂载环境', `<select class="select" data-env>${envs.map((e) => `<option value="${esc(e.name)}">${esc(e.name)}</option>`).join('') || '<option value="">暂无环境</option>'}</select>`, true)}
    </div>
    <div class="note" style="margin-top:14px">知识库创建后可在「环境参数配置」抽屉中挂载到 RAG 靶场，用于检索泄露与知识投毒演练。</div>`;
    UI.modal({
      title: '新建知识库',
      body,
      okText: '创建知识库',
      onOk: async (el) => {
        const name = el.querySelector('[data-name]').value.trim();
        if (!name) { UI.toast('请填写知识库名称', 'err'); return false; }
        const docs = parseInt(el.querySelector('[data-docs]').value, 10);
        if (isNaN(docs) || docs < 1) { UI.toast('文档数量需为大于 0 的整数', 'err'); return false; }
        try {
          await API.post('/api/knowledge', { name, docs, env: el.querySelector('[data-env]').value });
          UI.toast('知识库「' + name + '」已创建');
          p.tab = 'assets';
          await p.loadKbs();
          p.render();
        } catch (e) {
          UI.toast('知识库创建失败：' + e.message, 'err');
          return false;
        }
      }
    });
  }

  function openNewTool(p) {
    const body = `<div class="form-grid">
      ${field('名称', '<input class="input" data-name placeholder="如 代码执行沙箱工具">')}
      ${field('类型', `<select class="select" data-kind>${TOOL_KINDS.map((k) => `<option>${esc(k)}</option>`).join('')}</select>`)}
      ${field('功能说明', '<input class="input" data-descr placeholder="一句话说明工具能力与限制">', true)}
    </div>
    <div class="note" style="margin-top:14px">注册后的工具会出现在「环境参数配置」的挂载列表中，可组合出工具越权与 MCP 投毒场景。</div>`;
    UI.modal({
      title: '注册自定义工具',
      body,
      okText: '注册工具',
      onOk: async (el) => {
        const name = el.querySelector('[data-name]').value.trim();
        if (!name) { UI.toast('请填写工具名称', 'err'); return false; }
        try {
          await API.post('/api/tools', {
            name,
            kind: el.querySelector('[data-kind]').value,
            descr: el.querySelector('[data-descr]').value.trim()
          });
          UI.toast('工具「' + name + '」已注册');
          p.tab = 'assets';
          await p.loadTools();
          p.render();
        } catch (e) {
          UI.toast('工具注册失败：' + e.message, 'err');
          return false;
        }
      }
    });
  }

  /* ---------------------------------------------------------------- 操作 */
  function confirmDestroy(p, env) {
    UI.modal({
      title: '销毁测试环境',
      danger: true,
      okText: '确认销毁',
      body: `<div class="note warn">销毁将释放该环境的靶场实例、挂载卷与运行日志，操作不可恢复。请确认没有正在执行的攻击任务依赖此环境。</div>
        <div class="kv" style="margin-top:12px"><span>环境名称</span><b>${esc(env.name)}</b></div>
        <div class="kv" style="margin-top:6px"><span>隔离级别</span><b>${esc(env.level)}</b></div>
        <div class="kv" style="margin-top:6px"><span>靶场目标</span><b class="num">${env.targets} 个</b></div>`,
      onOk: async () => {
        try {
          await API.post('/api/envs/' + env.id + '/action', { action: 'destroy' });
          UI.toast('环境已销毁，资源已回收');
          await p.loadEnvs();
          p.render();
        } catch (err) {
          UI.toast('销毁失败：' + err.message, 'err');
          return false;
        }
      }
    });
  }

  async function envAction(p, env, act) {
    if (act === 'destroy') { confirmDestroy(p, env); return; }
    const map = { start: '环境已启动', stop: '环境已停止', restart: '环境已重启' };
    try {
      await API.post('/api/envs/' + env.id + '/action', { action: act });
      UI.toast(map[act] || '操作完成');
      await p.loadEnvs();
      p.render();
    } catch (e) {
      UI.toast('操作失败：' + e.message, 'err');
    }
  }

  function confirmCtDestroy(p, c) {
    UI.modal({
      title: '销毁容器',
      danger: true,
      okText: '确认销毁',
      body: `<div class="note warn">销毁只回收容器运行时与临时卷，镜像与归属环境保留；容器将标记为「已销毁」，可在容器列表中重新拉起。</div>
        <div class="kv" style="margin-top:12px"><span>容器名称</span><b class="mono">${esc(c.name)}</b></div>
        <div class="kv" style="margin-top:6px"><span>归属环境</span><b>${esc(c.env || '未绑定')}</b></div>`,
      onOk: async () => {
        try {
          await API.post('/api/infra/containers/' + c.id + '/action', { action: 'destroy' });
          UI.toast('容器已销毁');
          await p.loadInfra();
          p.render();
        } catch (e) {
          UI.toast('销毁失败：' + e.message, 'err');
          return false;
        }
      }
    });
  }

  async function ctAction(p, c, act) {
    if (act === 'destroy') { confirmCtDestroy(p, c); return; }
    const map = { start: '容器已启动', stop: '容器已停止', restart: '容器已重启' };
    try {
      await API.post('/api/infra/containers/' + c.id + '/action', { action: act });
      UI.toast(map[act] || '操作完成');
      await p.loadInfra();
      p.render();
    } catch (e) {
      UI.toast('操作失败：' + e.message, 'err');
    }
  }

  async function importImage(p, id) {
    try {
      await API.post('/api/images/' + id + '/import');
      UI.toast('镜像已导入靶场，可用于新建环境');
      await p.loadImages();
      p.render();
    } catch (e) {
      UI.toast('镜像导入失败：' + e.message, 'err');
    }
  }

  /* ---------------------------------------------------------------- 页面注册 */
  w.Pages = w.Pages || {};
  w.Pages.envs = {
    async mount(root) {
      const oldStyle = document.getElementById('pg-envs');
      if (oldStyle) oldStyle.remove();
      const st = document.createElement('style');
      st.id = 'pg-envs';
      st.textContent = STYLE;
      document.head.appendChild(st);

      const p = {
        tab: 'envs',
        filter: 'all',
        q: '',
        envs: [],
        pool: emptyPool(),
        infra: null,
        templates: [],
        images: [],
        kbs: [],
        tools: [],
        render: null,
        loadEnvs: async () => {
          const d = await API.get('/api/envs');
          p.envs = d.items || [];
          p.pool = d.pool || emptyPool();
        },
        loadInfra: async () => {
          p.infra = await API.get('/api/infra');
        },
        loadTemplates: async () => {
          const d = await API.get('/api/env-templates');
          p.templates = d.items || [];
        },
        loadImages: async () => {
          const d = await API.get('/api/images');
          p.images = d.items || [];
        },
        loadKbs: async () => {
          const d = await API.get('/api/knowledge');
          p.kbs = d.items || [];
        },
        loadTools: async () => {
          const d = await API.get('/api/tools');
          p.tools = d.items || [];
        },
        loadAll: async () => {
          const tasks = [
            ['环境', p.loadEnvs],
            ['容器', p.loadInfra],
            ['模板', p.loadTemplates],
            ['镜像', p.loadImages],
            ['知识库', p.loadKbs],
            ['工具', p.loadTools]
          ];
          const rs = await Promise.allSettled(tasks.map((t) => t[1]()));
          const bad = rs.map((r, i) => (r.status === 'rejected' ? tasks[i][0] : '')).filter(Boolean);
          if (bad.length) UI.toast(bad.join('、') + '数据加载失败，页面已展示可用部分', 'err');
        }
      };

      let alive = true;
      p.render = () => {
        if (!alive || !root.isConnected) return;
        root.innerHTML = view(p);
        const q = root.querySelector('[data-envq]');
        if (q) q.oninput = () => { p.q = q.value; applyFilter(p, root); };
        applyFilter(p, root);
      };

      root.innerHTML = `<div class="stack">${UI.skel(3)}</div>`;
      await p.loadAll();
      if (!alive || !root.isConnected) return () => { alive = false; };
      p.render();

      const findEnv = (id) => p.envs.find((e) => String(e.id) === String(id));
      const findCt = (id) => {
        const list = (p.infra && p.infra.containers) || [];
        return list.find((c) => String(c.id) === String(id));
      };
      const findTpl = (id) => p.templates.find((t) => String(t.id) === String(id));

      const onClick = (ev) => {
        const tab = ev.target.closest('[data-tab]');
        if (tab) { p.tab = tab.dataset.tab; p.render(); return; }
        const seg = ev.target.closest('[data-seg]');
        if (seg) { p.filter = seg.dataset.seg; p.render(); return; }

        const btn = ev.target.closest('button');
        if (!btn) return;

        if (btn.hasAttribute('data-refresh')) {
          btn.disabled = true;
          p.loadAll().then(() => {
            p.render();
            UI.toast('测试环境数据已刷新');
          }).catch((e) => {
            UI.toast('刷新失败：' + e.message, 'err');
            btn.disabled = false;
          });
          return;
        }
        if (btn.hasAttribute('data-new-env')) { openNewEnv(p); return; }
        if (btn.hasAttribute('data-new-tmpl')) { openNewTemplate(p); return; }
        if (btn.hasAttribute('data-new-image')) { openNewImage(p); return; }
        if (btn.hasAttribute('data-new-kb')) { openNewKb(p); return; }
        if (btn.hasAttribute('data-new-tool')) { openNewTool(p); return; }
        if (btn.hasAttribute('data-cfg')) {
          const env = findEnv(btn.getAttribute('data-cfg'));
          if (env) openConfig(p, env);
          return;
        }
        if (btn.hasAttribute('data-act')) {
          const env = findEnv(btn.getAttribute('data-id'));
          if (!env) return;
          if (btn.getAttribute('data-act') !== 'destroy') btn.disabled = true;
          envAction(p, env, btn.getAttribute('data-act'));
          return;
        }
        if (btn.hasAttribute('data-cact')) {
          const c = findCt(btn.getAttribute('data-id'));
          if (!c) return;
          if (btn.getAttribute('data-cact') !== 'destroy') btn.disabled = true;
          ctAction(p, c, btn.getAttribute('data-cact'));
          return;
        }
        if (btn.hasAttribute('data-console')) {
          const c = findCt(btn.getAttribute('data-console'));
          if (c) openConsole(p, c);
          return;
        }
        if (btn.hasAttribute('data-use-tmpl')) { openFromTemplate(p, findTpl(btn.getAttribute('data-use-tmpl'))); return; }
        if (btn.hasAttribute('data-import-img')) { importImage(p, btn.getAttribute('data-import-img')); return; }
      };

      root.addEventListener('click', onClick);

      const timer = setInterval(async () => {
        if (!alive || !root.isConnected) return;
        if (document.querySelector('.drawer.show')) return;
        if (p.tab !== 'envs' && p.tab !== 'containers') return;
        /* 焦点仍在页面内时不重建 DOM，避免打断输入、选择与读屏 */
        const ae = document.activeElement;
        if (ae && root.contains(ae)) return;
        if (String(window.getSelection ? window.getSelection() : '').trim()) return;
        const before = JSON.stringify({ envs: p.envs, pool: p.pool, infra: p.infra });
        try { await Promise.all([p.loadEnvs(), p.loadInfra()]); } catch (e) { return; }
        if (!alive || !root.isConnected) return;
        const after = JSON.stringify({ envs: p.envs, pool: p.pool, infra: p.infra });
        if (after === before) return;
        const main = document.querySelector('.main');
        const top = main ? main.scrollTop : 0;
        p.render();
        if (main) main.scrollTop = top;
      }, 10000);

      return () => {
        alive = false;
        clearInterval(timer);
        root.removeEventListener('click', onClick);
      };
    }
  };
})(window);
