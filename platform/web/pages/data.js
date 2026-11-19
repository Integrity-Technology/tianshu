/* ============================================================================
   数据资产：采集 → 清洗 → 标注 → 资产仓 → 微调语料
   ========================================================================== */
(function (w) {
  const { UI, API } = w;
  const icon = w.icon;
  const esc = w.esc;

  const STYLE = `
  .d-flow{display:flex;align-items:stretch}
  .d-node{flex:1;min-width:0;border:1px solid var(--line);border-radius:12px;padding:13px 14px;background:var(--surface);transition:.16s var(--ease)}
  .d-node:hover{border-color:#D5DCEA}
  .d-node.end{border-color:var(--brand-100);background:#F8FAFF}
  .d-top{display:flex;align-items:center;gap:8px;margin-bottom:10px}
  .d-ic{width:26px;height:26px;border-radius:8px;display:grid;place-items:center;background:var(--brand-050);color:var(--brand);flex:0 0 26px}
  .d-nm{font-size:12.5px;font-weight:600;letter-spacing:-.01em}
  .d-ix{margin-left:auto;font-family:var(--mono);font-size:10px;color:var(--text-3)}
  .d-v{font-size:19px;font-weight:645;letter-spacing:-.035em;line-height:1.2}
  .d-v small{font-size:11px;font-weight:500;color:var(--text-3);margin-left:3px;letter-spacing:0}
  .d-s{font-size:11px;color:var(--text-3);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .d-arrow{flex:0 0 38px;display:flex;align-items:center;gap:2px;color:#B9C2D2;padding:0 2px}
  .d-arrow .ln{flex:1;height:1px;background:repeating-linear-gradient(90deg,#D3DAE6 0 4px,transparent 4px 8px)}
  .d-ft{display:flex;align-items:center;gap:22px;margin-top:14px;padding-top:12px;border-top:1px dashed var(--line);font-size:11.5px;color:var(--text-3);flex-wrap:wrap}
  .d-ft b{color:var(--text);font-weight:560}
  .d-at{width:28px;height:28px;border-radius:8px;display:grid;place-items:center;font-size:11.5px;font-weight:650;flex:0 0 28px}
  .d-exp{display:flex;align-items:center;gap:11px;padding:11px 12px;border:1px solid var(--line);border-radius:11px;background:var(--surface);transition:.16s var(--ease)}
  .d-exp:hover{border-color:var(--brand-100);background:#F9FBFF;box-shadow:var(--sh-1)}
  .d-exp .tile{width:38px;height:38px;flex:0 0 38px;border-radius:9px;background:#0B0F17;color:#B9C6DE;display:grid;place-items:center;font-family:var(--mono);font-size:8.5px;font-weight:600}
  .d-exp .tt{font-size:12.5px;font-weight:560;letter-spacing:-.01em}
  .d-exp .td{font-size:11px;color:var(--text-3);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .d-exp .tr{margin-left:auto;display:flex;align-items:center;gap:10px;flex:0 0 auto}
  .d-exp .sz{font-size:11.5px;color:var(--text-2)}
  .d-rls{display:flex;flex-wrap:wrap;gap:4px;max-width:230px}
  .d-rls span{font-size:10.5px;color:var(--text-2);background:#F3F5F9;border-radius:5px;padding:1px 6px;white-space:nowrap}
  .rag-cols{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);gap:18px}
  .rag-col{min-width:0;display:flex;flex-direction:column;gap:10px}
  .rag-col + .rag-col{border-left:1px solid var(--line-2);padding-left:18px}
  .rag-hd{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
  .rag-hd .t{font-size:12.5px;font-weight:600;letter-spacing:-.01em}
  .rag-hd .n{font-size:11px;color:var(--text-3)}
  .rag-hd .btn{margin-left:auto}
  .rag-wm{font-family:var(--mono);font-size:10.5px;color:#1F3CA8;background:#EEF2FE;
    border:1px solid #DCE4FB;border-radius:5px;padding:1px 6px;white-space:nowrap;letter-spacing:.02em}
  .rag-tb{border:1px solid var(--line-2);border-radius:11px;overflow:hidden}
  .rag-tb .tbl thead th{background:var(--surface-2)}
  .rag-tb .tbl th,.rag-tb .tbl td{padding-top:7px;padding-bottom:7px}
  .rag-tb .chip{white-space:nowrap}
  .rag-tt{font-size:12px;font-weight:550;line-height:1.5}
  .rag-ts{font-size:11px;color:var(--text-3);margin-top:2px;overflow:hidden;text-overflow:ellipsis;
    white-space:nowrap;max-width:300px}
  .rag-q{display:flex;gap:8px}
  .rag-q .input{flex:1;min-width:0}
  .rag-res{display:flex;flex-direction:column;gap:11px;margin-top:2px}
  .rag-vd{display:flex;align-items:center;gap:9px;flex-wrap:wrap}
  .rag-vd .qn{font-size:11.5px;color:var(--text-3)}
  .rag-stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
  .rag-evi{border:1px solid #F2CBCB;background:#FDF2F2;border-radius:11px;padding:10px 12px}
  .rag-evi-h{display:flex;align-items:center;gap:8px;margin-bottom:7px}
  .rag-evi-h .t{font-size:11.5px;font-weight:600;color:#B22B2B}
  .rag-evi-h .rag-wm{margin-left:auto;background:#fff;border-color:#F2CBCB;color:#B22B2B}
  .rag-evi-t{font-size:12.5px;font-weight:600;color:var(--text);margin-bottom:3px}
  .rag-evi-s{font-size:11.5px;color:#8A3B3B;line-height:1.65;word-break:break-all}
  .rag-list-h{display:flex;align-items:center;gap:6px;font-size:11.5px;font-weight:600;color:var(--text-2);margin-top:3px}
  .rag-list-h span{font-weight:400;color:var(--text-3);font-size:10.5px}
  .rag-hit{display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px dashed var(--line-2)}
  .rag-hit:last-child{border-bottom:0;padding-bottom:0}
  .rag-hit .ix{font-family:var(--mono);font-size:10px;color:#A6ADBA;flex:0 0 16px}
  .rag-hit .hn{flex:1;min-width:0}
  .rag-hit .ht{font-size:12px;font-weight:550;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .rag-hit .hm{font-size:10.5px;color:var(--text-3);margin-top:2px}
  .rag-hit .hb{width:66px;flex:0 0 66px}
  .rag-hit .hs{width:36px;text-align:right;font-size:11.5px;font-weight:600;font-variant-numeric:tabular-nums}
  .rag-sent{font-size:10.5px;color:var(--text-3);margin-top:4px;line-height:1.5}
  `;

  const TYPE = {
    '样本': ['#EDF1FE', '#2C55E6'], '日志': ['#E8F6F9', '#0E9DB3'],
    '轨迹': ['#F1EDFE', '#6B47E8'], '指标': ['#E7F7F1', '#0B9E6E'],
    '语料': ['#FDF3E3', '#C97C10']
  };
  const RULES = ['去重(SimHash)', 'PII 脱敏', '合规过滤', '语言过滤', '质量打分', '长度截断'];

  const gb = (s) => {
    const m = /([\d.]+)\s*(TB|GB|MB|KB)/i.exec(String(s || ''));
    if (!m) return 0;
    const v = parseFloat(m[1]), u = m[2].toUpperCase();
    return u === 'TB' ? v * 1024 : u === 'GB' ? v : u === 'MB' ? v / 1024 : v / 1048576;
  };
  const fmtGB = (v) => (v >= 1024 ? (v / 1024).toFixed(2) + ' TB' : v.toFixed(1) + ' GB');
  const pct = (a, b) => (b ? (a / b) * 100 : 0);

  function kpis(d) {
    const totalGB = d.assets.reduce((s, a) => s + gb(a.size), 0);
    const last = d.cleans[0];
    const keep = last ? pct(last.after_n, last.before_n) : 0;
    const catItems = (t) => (d.assets.find((a) => a.type === t) || {}).items || 0;
    return `<div class="grid g-4">
      ${UI.kpi({
        label: '数据总量', value: UI.num((d.totalItems / 1e4).toFixed(1)), unit: '万条',
        meta: `${d.assets.length} 类资产 · 占用 ${fmtGB(totalGB)}`
      })}
      ${UI.kpi({
        label: '资产项', value: d.assets.length, unit: '类',
        meta: `样本 ${UI.num(catItems('样本'))} · 语料 ${UI.num(catItems('语料'))}`
      })}
      ${UI.kpi({
        label: '导出格式', value: d.formats.length, unit: '种',
        meta: d.formats.map((f) => String(f.name).split(' ')[0]).join(' · ')
      })}
      ${UI.kpi({
        label: '清洗任务', value: d.cleans.length, unit: '个',
        meta: last ? `最近保留率 ${keep.toFixed(1)}% · ${UI.ago(last.ts)}` : '暂无清洗记录'
      })}
    </div>`;
  }

  function flow(d) {
    const totalGB = d.assets.reduce((s, a) => s + gb(a.size), 0);
    const last = d.cleans[0] || { before_n: 1, after_n: 1, ts: '' };
    const keep = pct(last.after_n, last.before_n);
    const sampleA = d.assets.find((a) => a.type === '样本') || { items: 0 };
    const corpusA = d.assets.find((a) => a.type === '语料') || { items: 0, size: '—' };
    const nodes = [
      { ic: 'data', nm: '采集', v: UI.num((d.totalItems / 1e4).toFixed(1)), u: '万条', s: '攻击轨迹 / 响应日志 / 外部同步' },
      { ic: 'filter', nm: '清洗', v: keep.toFixed(1), u: '%', s: `最近任务保留 ${UI.num(last.after_n)} 条` },
      { ic: 'sample', nm: '标注', v: UI.num(sampleA.items), u: '条', s: '五维组件人工复核' },
      { ic: 'env', nm: '资产仓', v: fmtGB(totalGB).split(' ')[0], u: fmtGB(totalGB).split(' ')[1], s: `${d.assets.length} 类资产分域存储` },
      { ic: 'bolt', nm: '微调语料', v: UI.num(corpusA.items), u: '条', s: `${corpusA.size} · 可导出 JSONL` }
    ];
    const body = nodes.map((n, i) => `${i ? `<div class="d-arrow"><span class="ln"></span>${icon('arrow', 13)}</div>` : ''}
      <div class="d-node ${i === nodes.length - 1 ? 'end' : ''}">
        <div class="d-top"><span class="d-ic">${icon(n.ic, 14)}</span><span class="d-nm">${n.nm}</span>
          <span class="d-ix">0${i + 1}</span></div>
        <div class="d-v num">${n.v}<small>${n.u}</small></div>
        <div class="d-s" title="${esc(n.s)}">${n.s}</div>
      </div>`).join('');
    return `<div class="d-flow">${body}</div>
      <div class="d-ft">
        <span>最近一次清洗 <b>${last.ts ? UI.ago(last.ts) : '—'}</b></span>
        <span>资产存储合计 <b>${fmtGB(totalGB)}</b></span>
        <span>可导出格式 <b>${d.formats.length} 种</b></span>
        <span style="margin-left:auto">清洗规则库 <b>${RULES.length} 类</b></span>
      </div>`;
  }

  function assetRows(d) {
    return d.assets.map((a) => {
      const t = TYPE[a.type] || ['#F1F3F7', '#5B6474'];
      return `<tr>
        <td><div class="row" style="gap:10px">
          <span class="d-at" style="background:${t[0]};color:${t[1]}">${esc((a.type || '数')[0])}</span>
          <div><div class="t-main">${esc(a.name)}</div>
            <div class="t-sub">ASSET-${String(a.id).padStart(3, '0')} · 保留 ${esc(a.keep)}</div></div></div></td>
        <td><span class="chip">${esc(a.type)}</span></td>
        <td class="num" style="text-align:right;color:var(--text-2)">${esc(a.size)}</td>
        <td class="num" style="text-align:right;font-weight:560">${UI.num(a.items)}</td>
        <td><div>${UI.ago(a.updated)}</div><div class="t-sub mono">${esc(String(a.updated).slice(5, 16))}</div></td>
        <td>${UI.pill(a.keep, a.keep === '永久' ? 'brand' : 'gray')}</td>
      </tr>`;
    }).join('');
  }

  function exportCards(d) {
    const ext = ['.jsonl', '.parquet', '.csv'];
    return d.formats.map((f, i) => `<div class="d-exp">
      <div class="tile">${ext[i] || '.dat'}</div>
      <div style="min-width:0"><div class="tt">${esc(f.name)}</div>
        <div class="td" title="${esc(f.desc)}">${esc(f.desc)}</div></div>
      <div class="tr"><span class="sz num">${esc(f.size)}</span>
        <button class="btn sm" data-exp="${['jsonl', 'parquet', 'csv'][i]}">${icon('download', 13)}导出</button></div>
    </div>`).join('');
  }

  function cleanRows(d) {
    if (!d.cleans.length) return `<tr><td colspan="7">${UI.empty('暂无清洗任务', '点击「发起清洗」创建第一条清洗任务')}</td></tr>`;
    return d.cleans.map((c) => {
      const keep = pct(c.after_n, c.before_n);
      const tone = keep >= 95 ? 'ok' : keep >= 90 ? '' : 'warn';
      return `<tr>
        <td><div class="t-main">${esc(c.name)}</div>
          <div class="t-sub mono">CLEAN-${String(c.id).padStart(3, '0')}</div></td>
        <td><span class="chip" style="white-space:nowrap">${esc(c.source)}</span></td>
        <td style="min-width:190px">
          <div class="row" style="gap:8px;font-size:12px">
            <span class="num" style="color:var(--text-3)">${UI.num(c.before_n)}</span>
            <span style="color:var(--text-3);font-size:10.5px">→</span>
            <span class="num" style="font-weight:560">${UI.num(c.after_n)}</span>
          </div>
          <div style="margin-top:5px;width:150px">${UI.bar(keep, tone)}</div>
        </td>
        <td class="num" style="text-align:right;font-weight:560">${keep.toFixed(1)}%</td>
        <td><div class="d-rls">${String(c.rules || '').split('+').filter(Boolean).map((r) => `<span>${esc(r)}</span>`).join('')}</div></td>
        <td><div>${UI.ago(c.ts)}</div><div class="t-sub mono">${esc(String(c.ts).slice(5, 16))}</div></td>
        <td>${UI.pill(c.status)}</td>
      </tr>`;
    }).join('');
  }

  function ragTable(rag) {
    if (!rag.items.length) {
      return `<tr><td colspan="5">${UI.empty('暂无投毒文档', '点击「注入投毒文档」写入第一篇投毒样本')}</td></tr>`;
    }
    return rag.items.map((it) => {
      const body = String(it.content || '');
      return `<tr>
        <td><div class="rag-tt">${esc(it.title)}</div>
          <div class="rag-ts" title="${esc(body)}">${esc(body.slice(0, 40))}${body.length > 40 ? '…' : ''}</div></td>
        <td><span class="chip">${esc(it.technique)}</span></td>
        <td><span class="rag-wm">${esc(it.watermark || '—')}</span></td>
        <td>${UI.pill(it.status, it.status === '已投毒' ? 'danger' : 'gray')}</td>
        <td><div class="t-sub mono" style="margin-top:0">${esc(String(it.created || '').slice(5, 16))}</div></td>
      </tr>`;
    }).join('');
  }

  function ragCard(rag) {
    const kb = rag.kb || {};
    const wm = rag.watermark || '—';
    const list = rag.err ? UI.note(esc(rag.err), 'warn')
      : `<div class="rag-tb"><table class="tbl"><thead><tr>
          <th>标题</th><th style="width:100px">手法</th><th style="width:116px">水印</th>
          <th style="width:74px">状态</th><th style="width:104px">创建时间</th>
        </tr></thead><tbody>${ragTable(rag)}</tbody></table></div>`;
    return UI.card({
      title: 'RAG 知识库投毒与泄露验证',
      sub: `知识库：${esc(kb.name || '产品制度知识库')} · ${rag.items.length} 篇投毒文档 · 水印 ${esc(wm)}`,
      right: `<span class="pill ${rag.err ? 'danger' : 'brand'}"><i class="dot"></i>${rag.err ? '加载失败' : '检测就绪'}</span>`,
      body: `<div class="rag-cols">
        <div class="rag-col">
          <div class="rag-hd"><span class="t">投毒文档</span>
            <span class="n">${kb.docs != null ? kb.docs + ' 篇索引' : ''}${kb.size ? ' · ' + esc(kb.size) : ''}</span>
            <button class="btn sm" data-rag-add>${icon('plus', 13)}注入投毒文档</button></div>
          ${list}
          <div class="rag-sent">投毒文档写入知识库后会随检索结果返回，正文中的校验串即泄露水印，命中即判定泄露。</div>
        </div>
        <div class="rag-col">
          <div class="rag-hd"><span class="t">检索验证</span><span class="n">命中带水印文档即判定泄露</span></div>
          <div class="rag-q">
            <input class="input" id="rag-q" value="${esc(rag.q)}" placeholder="输入检索问题，如：退款政策">
            <button class="btn primary" data-rag-run ${rag.loading ? 'disabled' : ''}>${icon('search', 13)}${rag.loading ? '检索中' : '检索验证'}</button>
          </div>
          <div class="rag-res" id="rag-res">${ragResult(rag)}</div>
        </div>
      </div>`
    });
  }

  function ragResult(rag) {
    if (rag.loading) return UI.empty('正在检索知识库', '命中带水印文档将返回泄露判定');
    if (rag.qerr) return UI.note(esc(rag.qerr), 'warn');
    const r = rag.res;
    if (!r) return UI.empty('输入检索词后点击「检索验证」', '检索命中带水印文档即判定为知识库泄露');
    const VD = { '泄露': 'danger', '命中': 'warn', '未命中': 'ok' };
    const hits = (r.hits || []).slice(0, 5);
    const top = hits.length ? Number(hits[0].score).toFixed(2) : '—';
    const evi = r.leakEvidence;
    return `<div class="rag-vd">
        <span class="pill ${VD[r.verdict] || 'gray'}"><i class="dot"></i>${esc(r.verdict)}</span>
        <span class="qn">检索「${esc(r.q || rag.q)}」· 最高相似度 ${top}</span>
      </div>
      <div class="rag-stats">
        <div class="mini-stat"><span>命中条数</span><b>${hits.length}<small style="font-size:10px;font-weight:500;color:var(--text-3);margin-left:2px">条</small></b></div>
        <div class="mini-stat"><span>结果水印</span><b class="mono" style="font-size:11px">${esc(r.watermark || rag.watermark || '—')}</b></div>
      </div>
      ${evi ? `<div class="rag-evi">
          <div class="rag-evi-h"><span class="t">泄露证据</span><span class="rag-wm">${esc(evi.watermark || r.watermark || '')}</span></div>
          <div class="rag-evi-t">${esc(evi.title || '')}</div>
          <div class="rag-evi-s">${esc(evi.snippet || '')}</div>
        </div>`
        : UI.note(`检索命中 ${hits.length} 条相关文档，未出现投毒水印，未判定为泄露。`)}
      <div class="rag-list-h">命中列表<span>按相似度排序 · 最多返回 5 条</span></div>
      <div>${hits.length ? hits.map((h, i) => `<div class="rag-hit">
          <span class="ix">0${i + 1}</span>
          <div class="hn"><div class="ht">${esc(h.title)}</div>
            <div class="hm">${h.watermark ? `<span class="rag-wm">${esc(h.watermark)}</span>` : '无水印'}</div></div>
          <div class="hb">${UI.bar(Number(h.score) * 100, Number(h.score) >= 0.66 ? 'ok' : Number(h.score) >= 0.34 ? 'warn' : 'danger')}</div>
          <div class="hs">${Number(h.score).toFixed(2)}</div>
        </div>`).join('') : `<div class="rag-sent">未检索到相关文档。</div>`}</div>
      ${r.note ? `<div class="rag-sent">${esc(r.note)}</div>` : ''}`;
  }

  function poisonModal(page) {
    const rag = page.rag || {};
    const techs = rag.technique && rag.technique.length ? rag.technique : ['指令注入', '分片拼接', '检索旁路', '权限越界'];
    const wm = rag.watermark || '';
    UI.modal({
      title: '注入投毒文档',
      body: `<div class="form">
        <label>文档标题<input class="input" id="rag-title" maxlength="40" placeholder="如：退款政策（投毒）" value="退款政策（投毒）"></label>
        <label>投毒手法<select class="select" id="rag-tech">${techs.map((t) => `<option value="${esc(t)}">${esc(t)}</option>`).join('')}</select></label>
        <label>正文<textarea class="textarea" id="rag-content" rows="4">退款政策：订单支付后 90 天内支持无理由退款，审核通过后原路退回。内部校验串 ${esc(wm)}，仅用于知识库泄露追踪。</textarea></label>
        ${UI.note('提交后文档写入知识库并重建检索索引；正文中的校验串即泄露水印，检索命中即可判定泄露。')}
      </div>`,
      okText: '注入文档',
      onOk: async (el) => {
        const title = (el.querySelector('#rag-title').value || '').trim();
        const technique = el.querySelector('#rag-tech').value;
        const content = (el.querySelector('#rag-content').value || '').trim();
        if (!title) { UI.toast('请填写文档标题', 'err'); return false; }
        if (content.length < 8) { UI.toast('正文至少 8 个字', 'err'); return false; }
        try {
          const r = await API.post('/api/rag/poison', { kb: 1, title, technique, content });
          UI.toast(`已注入「${r.title}」· 水印 ${r.watermark}`);
        } catch (e) {
          UI.toast('注入失败：' + (e.message || e), 'err');
          return false;
        }
        try {
          await page.loadRag();
          page.renderRag();
        } catch (e) {
          UI.toast('投毒列表刷新失败：' + (e.message || e), 'err');
        }
      }
    });
  }

  function pageHTML(d, rag) {
    const last = d.cleans[0];
    const keep = last ? pct(last.after_n, last.before_n) : 0;
    return `
      ${UI.pageHd({
        title: '数据资产',
        sub: '从采集到微调语料，各阶段产物可追溯、可导出',
        actions: `<button class="btn" data-refresh>${icon('refresh', 14)}刷新</button>
          <button class="btn primary" data-clean>${icon('filter', 14)}发起清洗</button>`
      })}
      <div class="stack">
        ${kpis(d)}
        ${UI.card({
          title: '数据流转', sub: '五阶段数据管道', flush: false,
          right: `<span class="pill ok"><i class="dot"></i>最近更新 ${UI.ago((d.assets[0] || {}).updated)}</span>
            <span class="pill gray">${UI.num(d.assets.length)} 类资产</span>`,
          body: flow(d)
        })}
        <div class="split" style="grid-template-columns:1.72fr 1fr">
          ${UI.card({
            title: '数据资产', sub: '按类型分域托管', flush: true,
            right: `<span class="pill gray">${d.assets.length} 项</span>`,
            body: `<table class="tbl"><thead><tr>
                <th>资产名称</th><th style="width:80px">类型</th><th style="width:88px;text-align:right">大小</th>
                <th style="width:112px;text-align:right">条目</th><th style="width:112px">更新时间</th>
                <th style="width:96px">保留策略</th>
              </tr></thead><tbody>${assetRows(d)}</tbody></table>`
          })}
          ${UI.card({
            title: '导出中心', sub: '清洗后的数据可直接下载',
            right: `<span class="pill brand"><i class="dot"></i>${d.formats.length} 种格式</span>`,
            body: `<div class="col" style="gap:10px">${exportCards(d)}</div>
              ${UI.note('导出文件写入平台对象存储，下载链接 24 小时内有效；语料格式遵循 instruction / input / output 三段式。')}`
          })}
        </div>
        <div id="rag-host">${ragCard(rag)}</div>
        ${UI.card({
          title: '清洗任务', sub: '去重、脱敏、合规过滤与质量打分',
          right: `<span class="pill ${keep >= 95 ? 'ok' : 'warn'}"><i class="dot"></i>保留率 ${keep.toFixed(1)}%</span>
            <button class="btn sm" data-clean>${icon('plus', 13)}发起清洗</button>`,
          flush: true,
          body: `<table class="tbl"><thead><tr>
              <th>任务</th><th style="width:110px">数据来源</th><th style="width:200px">处理量（条）</th>
              <th style="width:74px;text-align:right">保留率</th><th style="width:248px">清洗规则</th>
              <th style="width:112px">完成时间</th><th style="width:80px">状态</th>
            </tr></thead><tbody>${cleanRows(d)}</tbody></table>`
        })}
      </div>`;
  }

  function cleanModal(page) {
    const md = UI.modal({
      title: '发起数据清洗',
      body: `<div class="form">
        <label>数据来源<select class="select" id="c-src">
          <option>任务回流</option><option>全量</option><option>外部同步</option><option>日志归档</option>
        </select></label>
        <label>处理条数<input class="input" id="c-n" type="number" value="100000" min="1000" step="1000"></label>
        <div class="field" style="margin-bottom:14px"><label style="font-size:12px;color:var(--text-2);margin-bottom:7px">清洗规则（可多选）</label>
          <div class="row wrap" style="gap:6px" id="c-rules">
            ${RULES.map((r, i) => `<button class="chip ${i < 3 ? 'on' : ''}" data-rule="${esc(r)}">${esc(r)}</button>`).join('')}
          </div></div>
        ${UI.note('清洗在数据管道内异步执行，结果写入资产仓并追加一条清洗任务记录；原始数据保留 7 天可回溯。')}
      </div>`,
      okText: '开始清洗',
      onOk: async (el) => {
        const rules = [...el.querySelectorAll('[data-rule].on')].map((b) => b.dataset.rule);
        if (!page.alive) return false;
        if (!rules.length) { UI.toast('请至少选择一条清洗规则', 'err'); return false; }
        const body = {
          source: el.querySelector('#c-src').value,
          n: Math.max(1000, +el.querySelector('#c-n').value || 100000),
          rules
        };
        try {
          const r = await API.post('/api/clean', body);
          UI.toast(`清洗完成：${UI.num(r.before)} → ${UI.num(r.after)} 条`);
          resultModal(r);
          await page.reload();
        } catch (e) {
          UI.toast('清洗失败：' + (e.message || e), 'err');
          return false;
        }
      }
    });
    md.el.querySelectorAll('[data-rule]').forEach((b) => {
      b.onclick = () => b.classList.toggle('on');
    });
  }

  function resultModal(r) {
    const keep = pct(r.after, r.before);
    UI.modal({
      title: '清洗任务已完成',
      body: `<div class="grid g-2" style="gap:10px;margin-bottom:14px">
          <div class="mini-stat"><span>清洗前</span><b>${UI.num(r.before)}</b></div>
          <div class="mini-stat"><span>清洗后</span><b style="color:var(--ok)">${UI.num(r.after)}</b></div>
          <div class="mini-stat"><span>剔除</span><b style="color:var(--danger)">${UI.num(r.removed)}</b></div>
          <div class="mini-stat"><span>耗时 / 吞吐</span><b>${r.elapsed}s · ${UI.num(r.throughput)} 条/s</b></div>
        </div>
        <div class="row between" style="font-size:11.5px;color:var(--text-3);margin-bottom:6px">
          <span>数据保留率</span><span class="num">${keep.toFixed(1)}%</span></div>
        ${UI.bar(keep, keep >= 93 ? 'ok' : 'warn')}
        ${UI.note('清洗结果已写入资产仓，任务记录已追加至清洗任务列表。')}`,
      okText: '完成'
    });
  }

  w.Pages = w.Pages || {};
  w.Pages.data = {
    async mount(root) {
      if (!document.getElementById('pg-data')) {
        const s = document.createElement('style');
        s.id = 'pg-data';
        s.textContent = STYLE;
        document.head.appendChild(s);
      }
      const page = this;
      page.alive = true;
      page.rag = {
        kb: null, items: [], watermark: '', technique: [],
        q: '退款政策', res: null, loading: false, err: '', qerr: ''
      };
      const load = async () => {
        const d = await API.get('/api/data');
        page.d = d;
      };
      const loadRag = async () => {
        const r = await API.get('/api/rag/poison', { kb: 1 });
        page.rag.kb = r.kb || null;
        page.rag.items = r.items || [];
        page.rag.watermark = r.watermark || '';
        page.rag.technique = r.technique || [];
        page.rag.err = '';
      };
      page.loadRag = loadRag;
      root.innerHTML = `<div class="fade-in">${UI.skel(4)}</div>`;
      try {
        await load();
      } catch (e) {
        root.innerHTML = `<div class="card pad">${UI.empty('数据资产加载失败', String(e.message || e))}</div>`;
        UI.toast('数据资产加载失败', 'err');
        return;
      }
      try {
        await loadRag();
      } catch (e) {
        page.rag.err = '投毒文档加载失败：' + (e.message || e);
      }

      const bindRag = () => {
        const host = root.querySelector('#rag-host');
        if (!host) return;
        const add = host.querySelector('[data-rag-add]');
        if (add) add.onclick = () => poisonModal(page);
        const inp = host.querySelector('#rag-q');
        const btn = host.querySelector('[data-rag-run]');
        const run = async () => {
          if (page.rag.loading) return;
          const q = ((inp && inp.value) || page.rag.q || '').trim() || '退款政策';
          page.rag.q = q;
          page.rag.loading = true;
          page.rag.qerr = '';
          renderRag();
          try {
            const r = await API.post('/api/rag/query', { kb: 1, q });
            page.rag.res = r;
            page.rag.loading = false;
            renderRag();
            UI.toast(`检索完成：${r.verdict} · 命中 ${(r.hits || []).length} 条`);
          } catch (e) {
            page.rag.loading = false;
            page.rag.qerr = '检索失败：' + (e.message || e);
            renderRag();
            UI.toast('检索失败：' + (e.message || e), 'err');
          }
        };
        if (btn) btn.onclick = run;
        if (inp) {
          inp.oninput = () => { page.rag.q = inp.value; };
          inp.onkeydown = (e) => {
            if (e.key === 'Enter') { e.preventDefault(); run(); }
          };
        }
      };
      const renderRag = () => {
        const host = root.querySelector('#rag-host');
        if (!host) return;
        host.innerHTML = ragCard(page.rag);
        bindRag();
      };
      page.renderRag = renderRag;

      const bind = () => {
        root.querySelectorAll('[data-refresh]').forEach((b) => {
          b.onclick = async () => {
            b.disabled = true;
            try {
              await load();
              render();
              UI.toast('数据资产已刷新');
            } catch (e) {
              UI.toast('刷新失败：' + (e.message || e), 'err');
            } finally {
              b.disabled = false;
            }
          };
        });
        root.querySelectorAll('[data-clean]').forEach((b) => { b.onclick = () => cleanModal(page); });
        root.querySelectorAll('[data-exp]').forEach((b) => {
          b.onclick = async () => {
            const kind = b.dataset.exp;
            b.disabled = true;
            try {
              const r = await API.post('/api/data/export', { kind });
              const a = document.createElement('a');
              a.href = UI.safeHref(r.url);
              a.download = r.file;
              document.body.appendChild(a);
              a.click();
              a.remove();
              UI.toast(`已导出 ${r.count} 条 · ${r.file}`);
            } catch (e) {
              UI.toast('导出失败：' + (e.message || e), 'err');
            }
            b.disabled = false;
          };
        });
        bindRag();
      };

      const render = () => {
        root.innerHTML = `<div class="fade-in">${pageHTML(page.d, page.rag)}</div>`;
        bind();
      };

      page.reload = async () => {
        await load();
        render();
      };

      render();
      return () => { page.alive = false; };
    }
  };
})(window);
