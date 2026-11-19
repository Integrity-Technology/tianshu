/* 资源与容器 —— 计算资源、实时指标、容器与 Web 控制台、告警处置 */
(function (w) {
  'use strict';
  const { UI, API, Charts, esc, icon } = w;

  const CSS = `
  .if-live{display:flex;align-items:center;gap:6px;font-size:11.5px;color:var(--text-3)}
  .if-dot{width:6px;height:6px;border-radius:50%;background:var(--ok);box-shadow:0 0 0 0 rgba(11,158,110,.5);animation:if-pulse 1.8s infinite}
  @keyframes if-pulse{0%{box-shadow:0 0 0 0 rgba(11,158,110,.45)}70%{box-shadow:0 0 0 7px rgba(11,158,110,0)}100%{box-shadow:0 0 0 0 rgba(11,158,110,0)}}
  .if-metric{display:flex;flex-direction:column;gap:6px}
  .if-metric .mv{display:flex;align-items:baseline;gap:5px}
  .if-metric .mv b{font-size:23px;font-weight:680;letter-spacing:-.03em;color:var(--ink);font-variant-numeric:tabular-nums}
  .if-metric .mv small{font-size:11.5px;color:var(--text-3)}
  .if-metric .mm{font-size:11.5px;color:var(--text-2)}
  .if-spark{height:34px;margin-top:2px}
  .if-node{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px dashed var(--line)}
  .if-node:last-child{border-bottom:0}
  .if-node .nm{font-size:12.5px;font-weight:600;color:var(--ink);width:74px}
  .if-node .hd{display:flex;align-items:center;gap:8px;width:100%;justify-content:space-between}
  .if-node .bars{flex:1;display:flex;flex-direction:column;gap:4px;margin-top:6px}
  .if-node .bl{display:flex;align-items:center;gap:7px}
  .if-node .bl em{font-style:normal;font-size:10px;color:var(--text-3);width:26px}
  .if-node{flex-direction:column;align-items:stretch;gap:4px}
  .if-quota{padding:8px 0 2px;border-top:1px dashed var(--line);margin-top:6px}
  .if-quota .qt{font-size:11.5px;color:var(--text-3);margin:4px 0 8px}
  .if-qrow{display:flex;align-items:center;gap:9px;margin-bottom:7px}
  .if-qrow .qn{font-size:12px;color:var(--ink);width:118px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .if-qrow .qb{flex:1;height:6px;border-radius:4px;background:#EEF1F7;overflow:hidden}
  .if-qrow .qb i{display:block;height:100%;border-radius:4px}
  .if-qrow .qv{font-size:11px;color:var(--text-2);width:104px;text-align:right;font-variant-numeric:tabular-nums}
  .if-alert:last-child{padding-bottom:2px}
  .if-node .mb{flex:1;height:6px;border-radius:4px;background:#EEF1F7;overflow:hidden}
  .if-node .mb i{display:block;height:100%;border-radius:4px}
  .if-node .vv{font-size:11.5px;color:var(--text-2);width:96px;text-align:right;font-variant-numeric:tabular-nums}
  .if-alert{display:flex;gap:10px;padding:10px 0;border-bottom:1px dashed var(--line);align-items:flex-start}
  .if-alert:last-child{border-bottom:0}
  .if-alert .lv{flex:0 0 34px;height:20px;border-radius:6px;font-size:10.5px;font-weight:700;display:flex;align-items:center;justify-content:center}
  .if-alert .bd{min-width:0;flex:1}
  .if-alert .tt{font-size:12.5px;font-weight:600;color:var(--ink)}
  .if-alert .ms{font-size:11.5px;color:var(--text-2);margin-top:2px;line-height:1.5}
  .if-alert .ft{font-size:11px;color:var(--text-3);margin-top:3px}
  .if-term{background:#0C1018;border-radius:12px;padding:12px 14px;font-family:Consolas,"Courier New",monospace;font-size:12px;
    color:#C9D4E6;height:340px;overflow:auto;line-height:1.65}
  .if-term .ln{white-space:pre-wrap;word-break:break-all}
  .if-term .cmd{color:#7FB0FF}
  .if-term .outb{color:#A9B6CA}
  .if-term .err{color:#FF8A8A}
  .if-term-in{display:flex;align-items:center;gap:8px;margin-top:10px;background:#0C1018;border-radius:10px;padding:8px 12px}
  .if-term-in span{color:#35D6A4;font-family:Consolas,monospace;font-size:12px}
  .if-term-in input{flex:1;background:transparent;border:0;outline:0;color:#E6EDF8;font-family:Consolas,monospace;font-size:12px}
  .if-term-in input::placeholder{color:#4A566B}
  .if-tabs2{display:flex;gap:4px;background:#F1F3F8;border-radius:9px;padding:3px}
  .if-tabs2 button{border:0;background:transparent;padding:5px 11px;border-radius:7px;font-size:12px;color:var(--text-2);cursor:pointer}
  .if-tabs2 button.on{background:#fff;color:var(--ink);font-weight:600;box-shadow:0 1px 2px rgba(12,16,24,.06)}
  .if-chip{display:inline-flex;align-items:center;gap:4px;font-size:10.5px;padding:1px 6px;border-radius:6px;background:#F1F4FA;color:var(--text-2)}
  `;

  const LV = { P0: ['#FDECEC', '#A62A2A'], P1: ['#FDF1E6', '#8A5A08'], P2: ['#EEF2FB', '#2C55E6'], P3: ['#F1F3F8', '#5B6474'] };

  w.Pages = w.Pages || {};
  w.Pages['infra'] = {
    async mount(root) {
      let D;
      try { D = await API.get('/api/infra'); }
      catch (e) { root.innerHTML = UI.empty('资源数据加载失败', String(e && e.message || e)); return; }

      const st = { filter: '全部', timer: null };

      root.innerHTML = `
      <style id="pg-infra">${CSS}</style>
      ${UI.pageHd({
        title: '资源与容器',
        sub: 'CPU、内存、并发与时延 · 容器与 Web 控制台 · 告警分级处置',
        actions: `<span class="if-live"><i class="if-dot"></i>10s 刷新</span>
          <button class="btn" id="if-refresh">${icon('refresh', 13)} 立即刷新</button>`
      })}
      <div class="grid g-4" id="if-kpi"></div>
      <div class="grid g-4" id="if-live" style="margin-top:14px"></div>
      <div class="grid g-2" style="margin-top:14px">
        <section class="card"><div class="card-hd"><h3>CPU 使用率趋势</h3><span class="sub">近 24 个采样点</span></div>
          <div class="card-bd" id="if-cpu"></div></section>
        <section class="card"><div class="card-hd"><h3>内存使用率趋势</h3><span class="sub">近 24 个采样点</span></div>
          <div class="card-bd" id="if-mem"></div></section>
      </div>
      <section class="card" style="margin-top:14px">
        <div class="card-hd"><h3>容器</h3><span class="sub">启停、重启、销毁与 Web 控制台，操作全部入库审计</span>
          <div class="right" id="if-cfilter"></div></div>
        <div class="card-bd" id="if-ctn"></div>
      </section>
      <div class="grid g-2" style="margin-top:14px">
        <section class="card"><div class="card-hd"><h3>计算节点</h3><span class="sub">CPU / 内存 双指标</span></div>
          <div class="card-bd" id="if-nodes"></div></section>
        <section class="card"><div class="card-hd"><h3>告警中心</h3><span class="sub">P0~P3 分级，支持确认处置</span>
          <div class="right"><span class="if-chip" id="if-acount"></span></div></div>
          <div class="card-bd" id="if-alerts"></div></section>
      </div>`;

      const $ = (s) => root.querySelector(s);

      /* ---------------------------------------------- 渲染 */
      function kpis(d) {
        const r = d.resources;
        const cell = (label, pct, used, total, unit, tone) => UI.card({
          body: `<div class="if-metric">
            <div class="mm">${label}</div>
            <div class="mv"><b>${used}</b><small>/ ${total} ${unit}</small></div>
            ${UI.bar(pct, tone)}
            <div class="mm">使用率 ${pct}%</div></div>`, pad: true
        });
        return cell('CPU', r.cpu.pct, r.cpu.used, r.cpu.cores, '核', r.cpu.pct > 80 ? 'danger' : 'brand')
          + cell('内存', r.mem.pct, r.mem.used, r.mem.totalGB, 'GB', r.mem.pct > 80 ? 'danger' : 'ok')
          + cell('存储', r.storage.pct, r.storage.used, r.storage.totalTB, 'TB', r.storage.pct > 85 ? 'warn' : 'violet')
          + cell('Pod', Math.round(r.pods.used / r.pods.total * 100), r.pods.used, r.pods.total, '个', 'cyan');
      }

      function liveCards(d) {
        const l = d.live, s = d.series;
        const one = (label, v, unit, meta, series, color, tone) => `<div class="kpi">
          <div class="lab">${label}</div>
          <div class="if-metric"><div class="mv"><b>${v}</b><small>${unit}</small></div>
            <div class="mm">${meta}</div>
            <div class="if-spark">${Charts.spark(series.map((x) => ({ v: x })), { color, h: 34 })}</div></div></div>`;
        return one('并发数', l.concurrency, '个', '攻击 + 评估任务实时并发', s.concurrency, '#2C55E6')
          + one('平均时延', Math.round(l.latency), 'ms', '模型接口 P50 时延', s.latency, '#0E9DB3')
          + one('TPS', l.tps, 'req/s', '每秒事务数', s.tps, '#0B9E6E')
          + one('QPS', l.qps, 'req/s', '每秒查询数', s.qps, '#6B47E8');
      }

      function renderCharts(d) {
        const s = d.series;
        $('#if-cpu').innerHTML = Charts.area(s.cpu.map((x, i) => ({ v: x, k: i + 1 })), { h: 200, unit: '%', min: 0, max: 100 });
        $('#if-mem').innerHTML = Charts.area(s.mem.map((x, i) => ({ v: x, k: i + 1 })), { h: 200, unit: '%', min: 0, max: 100, color: '#0B9E6E' });
      }

      function ctnTable(d) {
        const list = d.containers.filter((c) => st.filter === '全部' || c.status === st.filter);
        if (!list.length) return UI.empty('暂无容器', '请切换筛选条件');
        return UI.table({
          cols: [
            { label: '容器', w: '170px', render: (c) => `<div style="font-weight:600;color:var(--ink)">${esc(c.name)}</div>
                <div style="font-size:11px;color:var(--text-3)">${esc(c.image)}</div>` },
            { label: '类型', w: '76px', render: (c) => `<span class="if-chip">${esc(c.kind)}</span>` },
            { label: '用户组', w: '84px', k: 'grp' },
            { label: '环境', w: '140px', cls: 'dim', k: 'env' },
            { label: '状态', w: '84px', render: (c) => UI.pill(c.status) },
            { label: 'CPU', w: '66px', cls: 'num', render: (c) => (c.cpu || 0).toFixed(2) + ' 核' },
            { label: '内存', w: '72px', cls: 'num', render: (c) => (c.mem || 0).toFixed(1) + ' GB' },
            { label: '运行时长', w: '86px', cls: 'dim', k: 'uptime' },
            { label: '操作', w: '250px', render: (c) => `<div style="display:flex;gap:5px;justify-content:flex-end">
                ${c.status === '运行中'
                  ? `<button class="btn sm" data-act="stop" data-id="${c.id}">停止</button>
                     <button class="btn sm" data-act="restart" data-id="${c.id}">重启</button>`
                  : `<button class="btn sm" data-act="start" data-id="${c.id}">启动</button>`}
                <button class="btn sm" data-console="${c.id}" data-name="${esc(c.name)}">控制台</button>
                <button class="btn sm danger" data-act="destroy" data-id="${c.id}">销毁</button></div>` }
          ],
          rows: list
        });
      }

      function renderCtn(d) {
        $('#if-cfilter').innerHTML = `<div class="if-tabs2">${['全部', '运行中', '已停止'].map((v) =>
          `<button data-cf="${v}" class="${st.filter === v ? 'on' : ''}">${v}</button>`).join('')}</div>`;
        $('#if-ctn').innerHTML = ctnTable(d);
        $('#if-cfilter').querySelectorAll('[data-cf]').forEach((b) => b.onclick = () => {
          st.filter = b.dataset.cf; renderCtn(D);
        });
        $('#if-ctn').querySelectorAll('[data-act]').forEach((b) => b.onclick = () => act(b.dataset.id, b.dataset.act, b));
        $('#if-ctn').querySelectorAll('[data-console]').forEach((b) => b.onclick = () => consoleDrawer(b.dataset.console, b.dataset.name));
      }

      function renderNodes(d) {
        const bars = (n) => `<div class="bars">
            <div class="bl"><em>CPU</em><div class="mb"><i style="width:${n.cpu}%;background:${n.cpu > 80 ? '#D93B3B' : '#2C55E6'}"></i></div>
              <span class="vv" style="width:52px">${n.cpu}%</span></div>
            <div class="bl"><em>内存</em><div class="mb"><i style="width:${n.mem}%;background:${n.mem > 80 ? '#D93B3B' : '#0B9E6E'}"></i></div>
              <span class="vv" style="width:52px">${n.mem}%</span></div>
          </div>`;
        const nodes = d.nodes.map((n) => `<div class="if-node">
            <div class="hd"><span class="nm">${esc(n.name)}</span>
              <span class="if-chip">${esc(n.status)}</span>
              <span class="vv">已调度 Pod ${Math.max(1, Math.round(d.resources.pods.used / (d.nodes.length || 1)))} 个</span></div>
            ${bars(n)}</div>`).join('');
        const q = (d.quotas || []).slice(0, 4).map((x) => `<div class="if-qrow">
            <span class="qn" title="${esc(x.name)}">${esc(x.name)}</span>
            <div class="qb"><i style="width:${x.pct}%;background:${x.pct >= x.fuse ? '#D93B3B' : x.pct >= 70 ? '#C97C10' : '#2C55E6'}"></i></div>
            <span class="qv">${x.pct}% / 熔断 ${x.fuse}%</span></div>`).join('');
        $('#if-nodes').innerHTML = nodes +
          `<div class="if-quota"><div class="qt">预算配额与熔断阈值（按部门 / 项目维度，超阈值自动限流）</div>${q}</div>
          <div style="font-size:11px;color:var(--text-3);margin-top:8px">
          节点由 K8s 调度，Pod 与容器共享配额；容器资源视图见上方容器列表。</div>`;
      }

      function renderAlerts(d) {
        const list = d.alerts;
        $('#if-acount').textContent = '未处理 ' + list.filter((a) => a.status === '未处理').length + ' 条';
        if (!list.length) { $('#if-alerts').innerHTML = UI.empty('暂无告警', '所有指标在阈值内'); return; }
        $('#if-alerts').innerHTML = list.map((a) => {
          const c = LV[a.level] || LV.P3;
          return `<div class="if-alert">
            <span class="lv" style="background:${c[0]};color:${c[1]}">${esc(a.level)}</span>
            <div class="bd"><div class="tt">${esc(a.name)}</div><div class="ms">${esc(a.msg)}</div>
              <div class="ft">对象 ${esc(a.target)} · ${esc(a.ts)} · ${esc(a.status)}</div></div>
            ${a.status === '未处理' ? `<button class="btn sm" data-ack="${a.id}">确认</button>` : '<span class="if-chip">已确认</span>'}
          </div>`;
        }).join('');
        $('#if-alerts').querySelectorAll('[data-ack]').forEach((b) => b.onclick = async () => {
          try { await API.post(`/api/infra/alerts/${b.dataset.ack}/ack`, {}); UI.toast('告警已确认'); await load(); }
          catch (e) { UI.toast('操作失败：' + (e.message || e), 'err'); }
        });
      }

      /* ---------------------------------------------- 交互 */
      async function act(id, action, btn) {
        const label = { start: '启动', stop: '停止', restart: '重启', destroy: '销毁' }[action] || action;
        if (action === 'destroy') {
          const ok = await new Promise((res) => {
            UI.modal({
              title: '销毁容器', danger: true, okText: '确认销毁',
              body: '<div style="font-size:13px;color:var(--text-2)">销毁后容器与其本地数据将被回收，审计记录保留。确认继续？</div>',
              onOk: () => res(true)
            });
          });
          if (!ok) return;
        }
        btn.disabled = true;
        try {
          await API.post(`/api/infra/containers/${id}/action`, { action });
          UI.toast('容器已' + label);
          await load();
        } catch (e) { UI.toast(label + '失败：' + (e.message || e), 'err'); }
        btn.disabled = false;
      }

      function consoleDrawer(id, name) {
        const dr = UI.drawer({
          title: 'Web 控制台 · ' + UI.esc(name),
          sub: '沙箱内只读文件系统与出网拒绝策略，命令与回执全部入库',
          width: '760px',
          body: `<div class="if-term" id="if-term"><div class="ln outb">连接中…</div></div>
            <div class="if-term-in"><span>agent@sandbox:~$</span>
              <input id="if-cmd" placeholder="输入命令，如 ls / ps / whoami / env / help" autocomplete="off"></div>
            <div style="font-size:11px;color:var(--text-3);margin-top:8px">只允许白名单命令；curl 等出网命令会被策略拒绝并生成审计事件。</div>`
        });
        const term = dr.body.querySelector('#if-term');
        const inp = dr.body.querySelector('#if-cmd');
        const log = (html) => {
          term.insertAdjacentHTML('beforeend', html);
          term.scrollTop = term.scrollHeight;
        };
        API.post(`/api/infra/containers/${id}/console`, {}).then((d) => {
          term.innerHTML = '';
          log(`<div class="ln outb">${esc(d.banner || '')}</div>`);
        }).catch(() => { term.innerHTML = '<div class="ln err">连接失败</div>'; });
        const hist = [];
        let hi = -1;
        inp.addEventListener('keydown', async (ev) => {
          if (ev.key === 'ArrowUp') { if (hi < hist.length - 1) { hi++; inp.value = hist[hist.length - 1 - hi]; } ev.preventDefault(); return; }
          if (ev.key === 'ArrowDown') { if (hi > 0) { hi--; inp.value = hist[hist.length - 1 - hi]; } else { hi = -1; inp.value = ''; } ev.preventDefault(); return; }
          if (ev.key !== 'Enter') return;
          const cmd = inp.value.trim();
          if (!cmd) return;
          if (cmd === 'clear') { term.innerHTML = ''; inp.value = ''; return; }
          if (cmd === 'exit') { dr.close(); return; }
          hist.push(cmd); hi = -1; inp.value = '';
          log(`<div class="ln cmd">agent@sandbox:~$ ${esc(cmd)}</div>`);
          try {
            const r = await API.post(`/api/infra/containers/${id}/console`, { cmd });
            const out = r.out || '';
            log(`<div class="ln ${/拒绝|not found|denied/.test(out) ? 'err' : 'outb'}">${esc(out)}</div>`);
          } catch (e) { log(`<div class="ln err">${esc(e.message || String(e))}</div>`); }
        });
        setTimeout(() => inp.focus(), 150);
      }

      /* ---------------------------------------------- 数据 */
      async function load() {
        const d = await API.get('/api/infra');
        try { const q = await API.get('/api/quota'); d.quotas = (q && q.items) || []; } catch (e) { d.quotas = []; }
        D = d;
        $('#if-kpi').innerHTML = kpis(d);
        $('#if-live').innerHTML = liveCards(d);
        renderCharts(d);
        renderNodes(d);
        renderAlerts(d);
        renderCtn(d);
        return d;
      }

      $('#if-refresh').onclick = async () => {
        try { await load(); UI.toast('数据已刷新'); } catch (e) { UI.toast('刷新失败', 'err'); }
      };

      $('#if-kpi').innerHTML = kpis(D);
      $('#if-live').innerHTML = liveCards(D);
      renderCharts(D);
      renderAlerts(D);
      renderCtn(D);
      API.get('/api/quota').then((q) => { D.quotas = (q && q.items) || []; renderNodes(D); })
        .catch(() => renderNodes(D));

      st.timer = setInterval(async () => {
        try {
          const d = await API.get('/api/infra');
          try { const q = await API.get('/api/quota'); d.quotas = (q && q.items) || []; } catch (e) { d.quotas = D.quotas; }
          D = d;
          $('#if-kpi').innerHTML = kpis(d);
          $('#if-live').innerHTML = liveCards(d);
          renderNodes(d);
        } catch (e) { /* 静默重试 */ }
      }, 10000);

      return () => { if (st.timer) clearInterval(st.timer); };
    }
  };
})(window);
