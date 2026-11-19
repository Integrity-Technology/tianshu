/* ============================================================================
   评估中心：评估任务 / 风险报告 / 整改情况
   ========================================================================== */
(function (w) {
  const { UI, API, Charts } = w;
  const icon = w.icon;
  const esc = w.esc;

  const LEVEL_ORDER = ['高风险', '中风险', '低风险'];
  const LEVEL_TONE = { '高风险': 'danger', '中风险': 'warn', '低风险': 'gray' };
  const LEVEL_BAR = { '高风险': '#D93B3B', '中风险': '#C97C10', '低风险': '#B4BCCB' };
  const FIX_TONE = { '待整改': 'warn', '整改中': 'brand', '已整改': 'ok' };

  const RULE_MODES = ['合规', '安全', '自定义'];
  const RULE_CATS = ['系统与工具安全', '政治敏感', '违法犯罪', '色情低俗', '歧视偏见', '虚假误导',
    '隐私与个人信息', '商业与知识产权', '供应链与基础设施'];
  const RULE_DIMS = ['情景设定', '恶意指令', '安全策略规避', '行为引导', '规则豁免'];
  const MODE_COLOR = { '合规': '#2C55E6', '安全': '#0E9DB3', '自定义': '#C97C10' };
  const FMT = {
    pdf: { name: 'PDF', desc: '版式完整，适合归档与评审', color: '#D93B3B' },
    docx: { name: 'Word', desc: '可二次编辑，适合补充说明材料', color: '#2C55E6' },
    csv: { name: 'CSV', desc: '样本级判定明细，适合数据分析', color: '#0B9E6E' }
  };
  const put = (u, b) => (typeof API.put === 'function' ? API.put(u, b) : API.req('PUT', u, b));

  const STYLE = `
  .pg-e .ev-ltbl{table-layout:fixed}
  .pg-e .ev-ltbl td{overflow:hidden}
  .pg-e .ev-no{font-size:10.5px;color:var(--text-3);letter-spacing:.02em}
  .pg-e .ev-nm{font-size:12.5px;font-weight:560;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .pg-e .ev-ns{font-size:10.5px;color:var(--text-3);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .pg-e .ev-md{display:block;font-size:11.5px;color:var(--text-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .pg-e .ev-prog{display:flex;align-items:center;gap:7px}
  .pg-e .ev-prog .bar{flex:1;height:5px}
  .pg-e .ev-prog>span{font-size:10.5px;color:var(--text-2);font-variant-numeric:tabular-nums;white-space:nowrap}
  .pg-e .ev-prog-sub{font-size:10px;color:var(--text-3);margin-top:3px;font-variant-numeric:tabular-nums}
  .pg-e .ev-sc{font-size:15px;font-weight:650;letter-spacing:-.02em}
  .pg-e .ev-sc.ok{color:var(--ok)}
  .pg-e .ev-sc.brand{color:var(--brand-600)}
  .pg-e .ev-sc.warn{color:var(--warn)}
  .pg-e .ev-sc.danger{color:var(--danger)}
  .pg-e .ev-sc-sub{font-size:10px;color:var(--text-3);margin-top:1px}
  .pg-e .ev-time{font-size:11.5px;color:var(--text-2);white-space:nowrap}
  .pg-e .ev-ago{font-size:10.5px;color:var(--text-3);margin-top:1px}
  .pg-e .ev-arc-hd{display:flex;align-items:baseline;gap:9px;padding:2px 1px 0}
  .pg-e .ev-arc-hd b{font-size:13px;font-weight:600;letter-spacing:-.01em}
  .pg-e .ev-arc-hd span{font-size:11.5px;color:var(--text-3)}
  .pg-e .ev-arcs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
  .pg-e .ev-arc{background:var(--surface);border:1px solid var(--line);border-radius:var(--r-lg);padding:14px 16px;
    cursor:pointer;box-shadow:var(--sh-1);transition:border-color .16s var(--ease),box-shadow .16s var(--ease),transform .16s var(--ease)}
  .pg-e .ev-arc:hover{border-color:#C9D4F2;box-shadow:var(--sh-2);transform:translateY(-1px)}
  .pg-e .ev-arc-top{display:flex;align-items:center;justify-content:space-between;gap:10px}
  .pg-e .ev-arc-score{font-size:26px;font-weight:650;letter-spacing:-.045em;font-variant-numeric:tabular-nums}
  .pg-e .ev-arc-score.ok{color:var(--ok)}
  .pg-e .ev-arc-score.brand{color:var(--brand)}
  .pg-e .ev-arc-score.warn{color:var(--warn)}
  .pg-e .ev-arc-score.danger{color:var(--danger)}
  .pg-e .ev-arc-name{font-size:13px;font-weight:600;margin-top:7px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .pg-e .ev-arc-meta{font-size:11px;color:var(--text-3);margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .pg-e .ev-arc-foot{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:12px;padding-top:9px;
    border-top:1px solid var(--line-2);font-size:11px;color:var(--text-3)}
  .pg-e .ev-arc-foot b{color:var(--text);font-weight:600}
  .pg-e .ev-arc-foot .link{display:inline-flex;align-items:center;gap:3px;font-size:11px}
  .pg-e .ev-flow{display:flex;gap:2px;padding:15px 16px}
  .pg-e .ev-fl{flex:1;display:flex;gap:9px;min-width:0}
  .pg-e .ev-fl-n{width:22px;height:22px;border-radius:7px;background:var(--brand-050);color:var(--brand-600);
    display:grid;place-items:center;font-size:11px;font-weight:650;flex:0 0 22px}
  .pg-e .ev-fl-t b{display:block;font-size:12px;font-weight:600}
  .pg-e .ev-fl-t span{display:block;font-size:10.5px;color:var(--text-3);line-height:1.55;margin-top:3px}
  .pg-e .ev-fl-a{flex:0 0 18px;display:grid;place-items:center;color:#C9D0DE;padding-top:3px}
  .pg-e .ev-rk-h,.pg-e .ev-rk-r{display:grid;grid-template-columns:86px minmax(0,1fr) 128px 76px 78px 118px;gap:14px;align-items:center;padding:0 16px}
  .pg-e .ev-rk-h{height:34px;font-size:11px;color:var(--text-3);background:var(--surface-2);border-bottom:1px solid var(--line)}
  .pg-e .ev-rk-r{height:42px;font-size:12px;border-top:1px solid var(--line-2);cursor:pointer;transition:background .15s var(--ease)}
  .pg-e .ev-rk-h+.ev-rk-r{border-top:0}
  .pg-e .ev-rk-r:hover{background:var(--surface-2)}
  .pg-e .ev-rk-t{font-weight:550;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .pg-e .ev-rk-c{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .pg-e .ev-rpt{overflow:hidden}
  .pg-e .ev-rpt-hd{display:flex;align-items:flex-start;gap:16px;padding:15px 20px 14px;border-bottom:1px solid var(--line-2);
    background:linear-gradient(180deg,#FCFDFF,var(--surface) 70%)}
  .pg-e .ev-rpt-hd .mono{font-size:10.5px;color:var(--text-3);letter-spacing:.02em}
  .pg-e .ev-rt{font-size:17px;font-weight:650;letter-spacing:-.02em;margin-top:6px}
  .pg-e .ev-rm{font-size:11.5px;color:var(--text-3);margin-top:6px;line-height:1.6}
  .pg-e .ev-rm b{color:var(--text-2);font-weight:550}
  .pg-e .ev-rm .sep{margin:0 7px;color:#CBD2DF}
  .pg-e .ev-acts{margin-left:auto;display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:flex-end;padding-top:2px}
  .pg-e .ev-acts .pill{margin-right:2px}
  .pg-e .ev-body{display:grid;grid-template-columns:288px minmax(0,1fr) 342px}
  .pg-e .ev-score{padding:20px 20px 18px;border-right:1px solid var(--line-2);display:flex;flex-direction:column;align-items:center;gap:9px}
  .pg-e .ev-grade{display:flex;align-items:center;gap:9px}
  .pg-e .ev-gb{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;font-size:15px;font-weight:700}
  .pg-e .ev-gb.ok{background:var(--ok-bg);color:var(--ok)}
  .pg-e .ev-gb.brand{background:var(--brand-050);color:var(--brand-600)}
  .pg-e .ev-gb.warn{background:var(--warn-bg);color:var(--warn)}
  .pg-e .ev-gb.danger{background:var(--danger-bg);color:var(--danger)}
  .pg-e .ev-gb.gray{background:#F1F3F7;color:var(--text-3)}
  .pg-e .ev-gt b{display:block;font-size:12.5px;font-weight:600;line-height:1.3}
  .pg-e .ev-gt span{display:block;font-size:10.5px;color:var(--text-3);margin-top:2px}
  .pg-e .ev-cap{font-size:11px;color:var(--text-3);text-align:center;line-height:1.5}
  .pg-e .ev-mid{padding:18px 20px;border-right:1px solid var(--line-2);display:flex;flex-direction:column;gap:10px;min-width:0}
  .pg-e .ev-lab{font-size:10px;letter-spacing:.12em;color:var(--text-3);font-weight:600}
  .pg-e .ev-sum{font-size:12.5px;line-height:1.72;color:var(--text-2);margin:0}
  .pg-e .ev-sum b{color:var(--text);font-weight:600}
  .pg-e .ev-mini{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:2px}
  .pg-e .ev-ms{padding:9px 11px 10px;border:1px solid var(--line);border-radius:10px;background:var(--surface-2);min-width:0}
  .pg-e .ev-ms-l{font-size:10.5px;color:var(--text-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .pg-e .ev-ms-v{font-size:19px;font-weight:650;letter-spacing:-.035em;margin-top:3px;line-height:1.12;font-variant-numeric:tabular-nums}
  .pg-e .ev-ms-v i{font-style:normal;font-size:10.5px;font-weight:500;color:var(--text-3);margin-left:2px}
  .pg-e .ev-ms-v.warn{color:var(--warn)}
  .pg-e .ev-ms-v.danger{color:var(--danger)}
  .pg-e .ev-kv{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:auto}
  .pg-e .ev-kv .kv{background:var(--surface-2);padding:7px 10px}
  .pg-e .ev-kv .kv b{font-size:11.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:62%}
  .pg-e .ev-radar{padding:16px 18px 14px;display:flex;flex-direction:column;align-items:center;gap:4px}
  .pg-e .ev-radar .ev-lab{align-self:flex-start}
  .pg-e .ev-radar svg{max-width:100%;height:auto}
  .pg-e .ev-radar-note{width:100%;max-width:310px;font-size:10.5px;color:var(--text-3);line-height:1.65;text-align:center;padding:2px 6px 0}
  .pg-e .ev-radar-empty{width:100%;max-width:300px;height:300px;border:1px dashed var(--line-2);border-radius:14px;background:var(--surface-2);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px;padding:28px;text-align:center;color:var(--text-3)}
  .pg-e .ev-radar-empty b{font-size:13px;color:var(--text-2)}
  .pg-e .ev-radar-empty span{font-size:11px;line-height:1.7;max-width:210px}
  .pg-e .ev-runbar{display:flex;align-items:center;gap:10px;margin:2px 0 4px}
  .pg-e .ev-runbar .bar{flex:1}
  .pg-e .ev-runbar>span{width:38px;text-align:right;font-size:11.5px;color:var(--text-2)}
  .pg-e .btn[disabled]{opacity:.45;cursor:not-allowed}
  .pg-e .ev-tags{display:flex;gap:7px;flex-wrap:wrap;justify-content:center;margin-top:4px}
  .pg-e .ev-tag{font-size:10.5px;color:var(--text-3);background:var(--surface-2);border:1px solid var(--line);border-radius:20px;padding:2px 9px}
  .pg-e .ev-tag b{color:var(--text-2);font-weight:600}
  .pg-e .ev-row2{display:grid;grid-template-columns:minmax(0,1.42fr) minmax(0,1fr);gap:14px;align-items:stretch}
  .pg-e .ev-heat{padding:12px 16px 14px}
  .pg-e .ev-heat-h,.pg-e .ev-heat-r{display:grid;grid-template-columns:116px repeat(4,minmax(0,1fr)) 56px;gap:4px;align-items:center}
  .pg-e .ev-heat-h{margin-bottom:5px}
  .pg-e .ev-hc{font-size:10.5px;color:var(--text-3);text-align:center;font-weight:550;white-space:nowrap}
  .pg-e .ev-heat-r{height:28px}
  .pg-e .ev-heat-cat{font-size:11.5px;color:var(--text-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-right:4px}
  .pg-e .ev-cell{height:25px;border-radius:5px;display:grid;place-items:center;font-size:11px;font-weight:600;
    color:rgba(23,29,41,.78);font-variant-numeric:tabular-nums;transition:filter .12s}
  .pg-e .ev-cell:hover{filter:brightness(.97)}
  .pg-e .ev-cell.zero{background:#F6F8FB;color:#B6BDCA;font-weight:500}
  .pg-e .ev-heat-sum{text-align:right;font-size:11.5px;color:var(--text-3);padding-right:2px;font-variant-numeric:tabular-nums}
  .pg-e .ev-cats{padding:8px 16px 12px}
  .pg-e .ev-cat{display:grid;grid-template-columns:104px minmax(0,1fr) 34px 38px;gap:9px;align-items:center;height:29px}
  .pg-e .ev-cat-h{height:22px;font-size:10px;color:var(--text-3);letter-spacing:.04em}
  .pg-e .ev-cat-h span:nth-child(3),.pg-e .ev-cat-h span:nth-child(4){text-align:right}
  .pg-e .ev-cat-n{font-size:11.5px;color:var(--text-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .pg-e .ev-cat-b .bar{height:5px}
  .pg-e .ev-cat-v{font-size:11.5px;text-align:right;font-weight:550;font-variant-numeric:tabular-nums}
  .pg-e .ev-cat-f{font-size:11px;text-align:right;color:var(--text-3);font-variant-numeric:tabular-nums}
  .pg-e .ev-cat-f.on{color:var(--danger);font-weight:600}
  .pg-e .ev-ghead{display:flex;align-items:center;gap:8px;padding:10px 18px;background:#FAFBFD;border-top:1px solid var(--line-2)}
  .pg-e .ev-ghead:first-child{border-top:0}
  .pg-e .ev-ghead i{width:6px;height:6px;border-radius:50%;flex:0 0 6px}
  .pg-e .ev-ghead b{font-size:12px;font-weight:600}
  .pg-e .ev-gc{font-size:11px;color:var(--text-3)}
  .pg-e .ev-gline{flex:1;height:1px;background:var(--line-2)}
  .pg-e .ev-fnd{display:flex;gap:14px;padding:14px 18px;border-top:1px solid var(--line-2);transition:background .14s}
  .pg-e .ev-fnd:first-of-type{border-top:0}
  .pg-e .ev-fnd:hover{background:#FBFCFE}
  .pg-e .ev-fbar{width:3px;border-radius:2px;flex:0 0 3px;background:var(--danger)}
  .pg-e .ev-fbar.mid{background:var(--warn)}
  .pg-e .ev-fbar.low{background:#C4CBD8}
  .pg-e .ev-fmain{flex:1;min-width:0}
  .pg-e .ev-fhd{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
  .pg-e .ev-fid{font-size:10.5px;color:var(--text-3);letter-spacing:.02em}
  .pg-e .ev-ft{font-size:13px;font-weight:600;letter-spacing:-.01em}
  .pg-e .ev-fhd .chip{height:20px;line-height:18px;font-size:10.5px}
  .pg-e .ev-fgrid{display:grid;grid-template-columns:minmax(0,1fr) 468px;gap:16px;margin-top:7px}
  .pg-e .ev-desc{font-size:12px;color:var(--text-2);line-height:1.68}
  .pg-e .ev-advice{display:flex;gap:7px;margin-top:7px;font-size:11.5px;color:var(--text-2);line-height:1.62}
  .pg-e .ev-advice .lab{flex:0 0 auto;color:var(--brand-600);font-weight:600;font-size:11px;padding-top:1px}
  .pg-e .ev-sample{background:var(--surface-2);border:1px solid var(--line-2);border-radius:8px;padding:8px 11px;min-width:0}
  .pg-e .ev-sample .lab{font-size:10px;color:var(--text-3);letter-spacing:.08em;margin-bottom:4px}
  .pg-e .ev-sample code{display:block;font-family:var(--mono);font-size:11px;line-height:1.62;color:var(--text-2);
    white-space:pre-wrap;word-break:break-word;max-height:76px;overflow:auto}
  .pg-e .ev-oknote{display:flex;gap:11px;align-items:flex-start;padding:20px;margin:14px 16px;border:1px solid #BFE6D6;
    border-radius:10px;background:#F0FAF6;color:var(--ok)}
  .pg-e .ev-oknote .ic{margin-top:1px}
  .pg-e .ev-oknote b{display:block;font-size:12.5px;color:#0A6B4A}
  .pg-e .ev-oknote span{display:block;font-size:11.5px;color:#3D7A63;margin-top:3px;line-height:1.6}
  .pg-e .ev-oknote.brand{border-color:#CBD7F7;background:var(--brand-050);color:var(--brand-600)}
  .pg-e .ev-oknote.brand b{color:var(--brand-600)}
  .pg-e .ev-oknote.brand span{color:#4A5C96}
  .pg-e .ev-backic{display:inline-flex;transform:rotate(180deg)}
  @media (max-width:1320px){
    .pg-e .ev-body{grid-template-columns:250px minmax(0,1fr)}
    .pg-e .ev-radar{grid-column:1 / -1;border-top:1px solid var(--line-2)}
    .pg-e .ev-fgrid{grid-template-columns:1fr}
  }
  .pg-e .ev-tab-n{display:inline-flex;align-items:center;justify-content:center;min-width:17px;height:17px;padding:0 5px;
    margin-left:6px;border-radius:20px;background:var(--surface-2);border:1px solid var(--line);font-size:10px;
    color:var(--text-3);font-weight:600;line-height:1;vertical-align:1px}
  .pg-e .ev-rtbl{table-layout:fixed}
  .pg-e .ev-rtbl td{overflow:hidden}
  .pg-e .ev-rnm{font-size:12.5px;font-weight:560;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .pg-e .ev-rsub{font-size:10.5px;color:var(--text-3);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .pg-e .ev-rdesc{font-size:11.5px;color:var(--text-2);line-height:1.55;display:-webkit-box;-webkit-line-clamp:2;
    -webkit-box-orient:vertical;overflow:hidden}
  .pg-e .ev-rnum{font-size:12px;color:var(--text-2)}
  .pg-e .ev-ops{display:flex;align-items:center;justify-content:flex-end;gap:6px}
  .pg-e .ev-note-row{display:flex;align-items:flex-start;gap:8px;padding:9px 16px 11px;border-top:1px solid var(--line-2);
    background:var(--surface-2);font-size:11px;color:var(--text-3);line-height:1.6}
  .pg-e .ev-note-row .ic{flex:0 0 13px;margin-top:1px;color:var(--text-3)}
  .pg-e .ev-note-row b{color:var(--text-2);font-weight:600}
  .pg-e .ev-expbar{display:flex;align-items:center;gap:8px;padding:9px 20px;border-bottom:1px solid var(--line-2);
    background:var(--ok-bg);font-size:11.5px;color:#0A6B4A}
  .pg-e .ev-expbar .ic{color:var(--ok);flex:0 0 14px}
  .pg-e .ev-expbar b{font-family:var(--mono);font-size:11px;font-weight:600;color:#0A6B4A}
  .pg-e .ev-expbar a{margin-left:auto;display:inline-flex;align-items:center;gap:4px;font-size:11.5px;font-weight:600;
    color:var(--brand-600);padding:3px 9px;border:1px solid #CBD7F7;border-radius:7px;background:#fff}
  .pg-e .ev-expbar a:hover{background:var(--brand-050)}
  .pg-e .ev-modechart{display:flex;justify-content:center;padding:4px 0 2px}
  .pg-e .ev-fl{align-items:flex-start}
  .pg-e .ev-fl-t{flex:1;min-width:0}
  .pg-e .ev-fl-t b{font-size:12px;font-weight:600;color:var(--text)}
  .pg-e .ev-fl-t span{display:block;font-size:10.5px;color:var(--text-3);line-height:1.55;margin-top:3px}
  .pg-e .ev-fl:last-child .ev-fl-a{display:none}
  .pg-e .ev-bars{padding:6px 0 2px}
  .pg-e .ev-catchart{padding:2px 0 0}
  .ev-fmt-pick{padding:1px 0}
  .modal.ev-modal-wide{width:min(780px,94vw)}
  .ev-req{color:var(--danger);font-weight:600}
  .ev-ta{font-family:var(--mono);font-size:11.5px;line-height:1.7;min-height:84px;resize:vertical}
  .ev-fmt{display:flex;flex-direction:column;gap:8px;padding:2px 0}
  .ev-fmt-i{display:flex;align-items:center;gap:12px;width:100%;text-align:left;padding:11px 13px;border:1px solid var(--line);
    border-radius:10px;background:var(--surface);transition:border-color .15s var(--ease),background .15s var(--ease)}
  .ev-fmt-i:hover{border-color:#C9D4F2;background:var(--surface-2)}
  .ev-fmt-i .ev-fmt-ic{width:34px;height:34px;flex:0 0 34px;border-radius:8px;display:grid;place-items:center;
    font-size:10.5px;font-weight:700;letter-spacing:.02em}
  .ev-fmt-i b{display:block;font-size:12.5px;font-weight:600}
  .ev-fmt-i .ev-fmt-d{display:block;font-size:11px;color:var(--text-3);margin-top:2px}
  .ev-fmt-i .ev-fmt-go{margin-left:auto;color:var(--text-3);display:flex}
  /* 横向基准 */
  .bk-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(186px,1fr));gap:14px;padding:16px}
  .bk-cell{border:1px solid var(--line);border-radius:12px;padding:12px 10px 4px;background:var(--surface-2)}
  .bk-hd{display:flex;align-items:center;gap:8px;padding:0 4px}
  .bk-hd b{font-size:12.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .bk-sc{margin-left:auto;font-size:14px;font-weight:700;color:var(--brand);font-variant-numeric:tabular-nums}
  .bk-vendor{font-size:10.5px;color:var(--text-3);margin:1px 4px 2px}
  .bk-tbl{width:100%;border-collapse:collapse}
  .bk-tbl th{font-size:11px;color:var(--text-3);text-align:left;font-weight:550;padding:9px 10px;border-bottom:1px solid var(--line);white-space:nowrap}
  .bk-tbl td{font-size:12px;padding:9px 10px;border-bottom:1px solid var(--line-2)}
  .bk-tbl tr:last-child td{border-bottom:none}
  .bk-tbl .rt{text-align:right;font-variant-numeric:tabular-nums}
  .bk-best{display:inline-block;font-size:10px;padding:1px 6px;border-radius:6px;background:var(--brand-050);color:var(--brand-600);margin-left:6px;vertical-align:1px}
  .bk-dn{color:var(--danger)}
  /* 多轮模拟 */
  .mt-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;padding:14px 16px 6px}
  .mt-kpi{border:1px solid var(--line);border-radius:10px;padding:10px 12px;background:var(--surface-2)}
  .mt-kpi .l{font-size:11px;color:var(--text-3)}
  .mt-kpi .v{font-size:19px;font-weight:650;font-variant-numeric:tabular-nums;margin-top:2px}
  .mt-kpi .v small{font-size:11px;font-weight:500;color:var(--text-3);margin-left:2px}
  .mt-list{padding:6px 16px 16px}
  .mt-row{display:flex;gap:10px;padding:9px 0;border-bottom:1px solid var(--line-2)}
  .mt-row:last-child{border-bottom:none}
  .mt-n{width:26px;flex:0 0 26px;height:22px;border-radius:6px;background:var(--surface-2);display:grid;place-items:center;font-size:11px;font-weight:600;color:var(--text-2)}
  .mt-row.blocked .mt-n{background:#FDECEC;color:#B42323}
  .mt-u{flex:1;min-width:0;font-size:12px;line-height:1.5;color:var(--text)}
  .mt-a{font-size:11.5px;color:var(--text-2);margin-top:3px}
  .mt-badge{flex:0 0 auto;font-size:10px;height:18px;line-height:18px;padding:0 6px;border-radius:6px;background:#EEF1F7;color:var(--text-2)}
  .mt-badge.blk{background:#FDECEC;color:#B42323}
  .mt-badge.ok{background:#E8F6F0;color:#0B7B57}
  .mt-tools{display:flex;align-items:center;gap:8px;padding:12px 16px 2px;flex-wrap:wrap}
  .mt-tools .l{font-size:11px;color:var(--text-3)}
  .mt-tools .select{width:auto;min-width:104px;height:30px;font-size:12px}
  .chk-list{display:flex;flex-wrap:wrap;gap:8px 16px;padding:4px 0}
  .chk-list .chk{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;color:var(--text);cursor:pointer}

  /* ---------------------------------------------- 3.7.2 实时日志 */
  .pg-e .ev-log-box{max-height:268px;overflow:auto}
  .pg-e .ev-log-row{display:grid;grid-template-columns:58px 42px minmax(0,1fr);gap:10px;align-items:start;
    padding:5px 18px;border-top:1px solid var(--line-2);font-size:11.5px}
  .pg-e .ev-log-row:first-child{border-top:0}
  .pg-e .ev-log-ts{color:var(--text-3);font-size:10.5px;font-variant-numeric:tabular-nums;padding-top:1px}
  .pg-e .ev-log-lv{font-size:10px;font-weight:600;letter-spacing:.04em;border-radius:5px;padding:1px 0;text-align:center;
    background:#F1F3F7;color:var(--text-3)}
  .pg-e .ev-log-lv.ok{background:var(--ok-bg,#E8F6F0);color:var(--ok,#0B7A55)}
  .pg-e .ev-log-lv.warn{background:var(--warn-bg,#FDF3E3);color:var(--warn,#9A5B05)}
  .pg-e .ev-log-lv.error{background:var(--danger-bg,#FDECEC);color:var(--danger,#B32B2B)}
  .pg-e .ev-log-msg{color:var(--text-2);line-height:1.62;word-break:break-word}
  .pg-e .ev-log-empty{padding:24px 18px;text-align:center;color:var(--text-3);font-size:11.5px;line-height:1.75}
  .pg-e .ev-live{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:600;color:var(--ok,#0B7A55)}
  .pg-e .ev-live i{width:6px;height:6px;border-radius:50%;background:var(--ok,#0B9E6E);animation:evpulse 1.6s infinite}
  @keyframes evpulse{0%,100%{opacity:.28}50%{opacity:1}}

  /* ---------------------------------------------- 热力下钻 */
  .pg-e button.ev-cell{width:100%;border:0;padding:0;font-family:inherit;background:#F6F8FB;cursor:pointer;
    transition:transform .12s var(--ease,ease),box-shadow .12s var(--ease,ease)}
  .pg-e button.ev-cell:hover{transform:translateY(-1px);box-shadow:0 3px 8px rgba(16,24,40,.10)}
  .pg-e button.ev-cell.zero{background:#F6F8FB;color:#B6BDCA;box-shadow:none;transform:none}
  .pg-e .ev-heat-hint{display:flex;align-items:center;gap:6px;font-size:10.5px;color:var(--text-3);
    padding:2px 16px 9px;line-height:1.6}
  .pg-e .ev-drill{display:flex;flex-direction:column;gap:11px}
  .pg-e .ev-drill-meta{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
  .pg-e .ev-drill-m{background:var(--surface-2);border:1px solid var(--line-2);border-radius:9px;padding:8px 11px}
  .pg-e .ev-drill-m span{display:block;font-size:10.5px;color:var(--text-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .pg-e .ev-drill-m b{display:block;font-size:16px;font-weight:650;margin-top:2px;font-variant-numeric:tabular-nums;letter-spacing:-.02em}
  .pg-e .ev-drill-note{font-size:11px;color:var(--text-3);line-height:1.72;background:var(--surface-2);
    border:1px dashed var(--line);border-radius:9px;padding:8px 11px}
  .pg-e .ev-drill-t{display:flex;align-items:center;gap:8px;font-size:10.5px;color:var(--text-3);letter-spacing:.06em}
  .pg-e .ev-drill-t .line{flex:1;height:1px;background:var(--line-2)}
  .pg-e .ev-drill-f{border:1px solid var(--line);border-radius:10px;padding:10px 12px}
  .pg-e .ev-drill-f + .ev-drill-f{margin-top:9px}
  .pg-e .ev-drill-fh{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:5px}
  .pg-e .ev-drill-fh b{font-size:12px;font-weight:600}
  .pg-e .ev-evi{border-top:1px solid var(--line-2);margin-top:10px;padding-top:8px}
  .pg-e .ev-evi-row{padding:7px 0;border-top:1px dashed var(--line-2)}
  .pg-e .ev-evi-row:first-child{border-top:0;padding-top:2px}
  .pg-e .ev-evi-hd{display:flex;align-items:center;gap:7px;flex-wrap:wrap;font-size:11px;color:var(--text-2);margin-bottom:4px}
  .pg-e .ev-evi-l{font-size:9.5px;color:var(--text-3);letter-spacing:.1em;margin:2px 0 3px}
  .pg-e .ev-evi-code{font-family:var(--mono);font-size:10.5px;line-height:1.6;color:var(--text-2);white-space:pre-wrap;
    word-break:break-word;margin:0 0 6px;max-height:118px;overflow:auto;background:var(--surface-2);
    border:1px solid var(--line-2);border-radius:7px;padding:6px 8px}
  .pg-e .ev-evi-code:last-child{margin-bottom:0}
  .pg-e .ev-drill-empty{display:flex;flex-direction:column;align-items:center;gap:5px;padding:22px 18px;
    border:1px dashed var(--line);border-radius:10px;background:var(--surface-2);color:var(--text-3);text-align:center}
  .pg-e .ev-drill-empty b{font-size:12.5px;color:var(--text-2);font-weight:600}
  .pg-e .ev-drill-empty span{font-size:11px;line-height:1.72;max-width:370px}
  .pg-e .ev-fnd.hl{background:#F5F8FF;box-shadow:inset 2px 0 0 var(--brand)}

  /* ---------------------------------------------- 规则选择 */
  .pg-e .ev-rp{border:1px solid var(--line);border-radius:10px;overflow:hidden}
  .pg-e .ev-rp-hd{display:flex;align-items:center;gap:8px;padding:6px 10px;background:var(--surface-2);
    border-bottom:1px solid var(--line);font-size:11.5px;color:var(--text-3)}
  .pg-e .ev-rp-hd b{color:var(--text);font-weight:650}
  .pg-e .ev-rp-hd .btn{height:24px;font-size:11px;padding:0 8px}
  .pg-e .ev-rp-list{max-height:186px;overflow:auto;padding:4px}
  .pg-e .ev-rp-i{display:flex;gap:8px;align-items:flex-start;padding:6px 8px;border-radius:7px;cursor:pointer;line-height:1.4}
  .pg-e .ev-rp-i:hover{background:var(--surface-2)}
  .pg-e .ev-rp-i input{margin:2px 0 0;flex:0 0 auto}
  .pg-e .ev-rp-n{display:block;font-size:12px;font-weight:550}
  .pg-e .ev-rp-m{display:block;font-size:10.5px;color:var(--text-3);margin-top:2px}
  .pg-e .ev-rp-i.hide{display:none}
  .pg-e .ev-dot{display:inline-flex;align-items:center;gap:5px}
  .pg-e .ev-dot i{width:5px;height:5px;border-radius:50%;flex:0 0 5px}

  /* ---------------------------------------------- 新建提示 / 整改统计 */
  .pg-e .ev-focus{display:flex;align-items:center;gap:10px;padding:9px 14px;border:1px solid #BFE6D6;
    background:#F5FBF8;border-radius:12px;font-size:12px;color:var(--text-2);min-width:0}
  .pg-e .ev-focus > .ic{color:#0B9E6E;flex:0 0 auto}
  .pg-e .ev-focus b{font-weight:650;color:var(--text)}
  .pg-e .ev-focus .nm{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .pg-e .ev-focus .btn{margin-left:auto;flex:0 0 auto}
  .pg-e .ev-fx-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;padding:14px 16px 8px}
  .pg-e .ev-fx{border:1px solid var(--line);border-radius:10px;padding:10px 12px;background:var(--surface-2)}
  .pg-e .ev-fx-l{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--text-3)}
  .pg-e .ev-fx-l i{width:5px;height:5px;border-radius:50%;flex:0 0 5px}
  .pg-e .ev-fx-v{font-size:20px;font-weight:650;margin-top:2px;font-variant-numeric:tabular-nums;letter-spacing:-.03em}
  .pg-e .ev-fx-v small{font-size:11px;font-weight:500;color:var(--text-3);margin-left:3px}
  .pg-e .ev-fx .bar{margin-top:7px;height:4px}
  .pg-e .ev-fix-r{display:grid;grid-template-columns:60px minmax(0,1fr) 116px 86px;gap:12px;align-items:center;
    height:38px;padding:0 16px;border-top:1px solid var(--line-2);font-size:11.5px;cursor:pointer;
    transition:background .14s var(--ease,ease)}
  .pg-e .ev-fix-r:hover{background:var(--surface-2)}
  .pg-e .ev-fix-t{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text)}
  .pg-e .ev-fix-e{font-size:10.5px;color:var(--text-3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .pg-e .ev-fix-st{text-align:right}

  /* ---------------------------------------------- 通用补充 */
  .pg-e .tbl td.tr,.pg-e .tbl th.tr{text-align:right}
  .pg-e .ev-mini-done{font-size:11.5px;color:var(--text-3);display:flex;align-items:center;gap:5px}
  `;

  /* ================================================================ 归一化层
     后端存在多种数据形态：等级（高/中/低 与 高风险/中风险/低风险）、
     asr/refuse/safety（0-1 小数 与 0-100 百分数）、dims（数组 与 对象）。
     统一在这里归一，渲染层只认归一后的值。 */
  const DIM_NAMES = ['内容合规', '越狱防御', '数据保护', '工具安全', '供应链'];
  const DRILL_COLS = [
    { t: '高危', level: '高风险', risk: '3', rgb: '217,59,59' },
    { t: '中危', level: '中风险', risk: '2', rgb: '201,124,16' },
    { t: '低危', level: '低风险', risk: '1', rgb: '44,85,230' },
    { t: '通过', level: '', risk: '0', rgb: '11,158,110' }
  ];
  const LOG_LV = { info: '信息', ok: '完成', warn: '告警', error: '错误', danger: '错误' };
  const RISK_LABEL = { '3': '高危', '2': '中危', '1': '低危', '0': '通过' };

  function normLevel(v) {
    const s = String(v == null ? '' : v).trim().replace(/风险$/, '');
    return s === '高' ? '高风险' : s === '中' ? '中风险' : s === '低' ? '低风险' : '';
  }
  function asPct(v) {
    const n = Number(v);
    if (!isFinite(n) || n <= 0) return 0;
    return Math.round((n > 1 ? n : n * 100) * 10) / 10;
  }
  function dimsOf(src) {
    let d = src && src.dims;
    if (typeof d === 'string') {
      try { d = JSON.parse(d); } catch (e) { d = null; }
    }
    if (Array.isArray(d)) {
      const o = {};
      d.forEach((v, i) => { o[DIM_NAMES[i] || ('维度' + (i + 1))] = Math.round(Number(v) || 0); });
      return o;
    }
    if (d && typeof d === 'object') {
      const o = {};
      Object.keys(d).forEach((k) => { o[k] = Math.round(Number(d[k]) || 0); });
      return o;
    }
    return {};
  }
  function isRunning(e) { return !!e && (e.status === '运行中' || e.status === '排队中'); }
  function pctOf(e) {
    if (!e) return 0;
    const n = Number(e.pct);
    if (isFinite(n) && n > 0) return Math.min(100, Math.round(n));
    const t = Number(e.samples) || 0;
    return t ? Math.min(100, Math.round(((Number(e.done) || 0) / t) * 100)) : 0;
  }
  function gradeOf(score) {
    const s = Number(score) || 0;
    if (s >= 90) return ['A', '优秀', 'ok'];
    if (s >= 80) return ['B', '良好', 'brand'];
    if (s >= 70) return ['C', '中等', 'warn'];
    return ['D', '待改进', 'danger'];
  }
  function scoreTone(score) { return gradeOf(score)[2]; }
  function fmtTime(s) { return s ? String(s).slice(5, 16) : '—'; }
  function hhmmss(s) {
    const t = String(s || '');
    if (t.length >= 19) return t.slice(11, 19);
    return t.length >= 16 ? t.slice(11, 16) : t.slice(-8);
  }
  function trunc(s, n) {
    s = String(s == null ? '' : s);
    return s.length > n ? s.slice(0, n) + '…' : s;
  }
  function signature(list) {
    return (list || []).map((x) => [x.id, x.status, x.done, x.score, x.finished].join(':')).join('|');
  }
  function modelName(page, id, fb) {
    const hit = (page.state.models || []).find((m) => String(m.id) === String(id));
    if (hit) return hit.name;
    return fb || (id ? '模型 #' + id : '—');
  }
  function logTone(level) {
    const l = String(level || '').toLowerCase();
    if (l === 'ok' || l === 'success') return 'ok';
    if (l === 'warn' || l === 'warning') return 'warn';
    if (l === 'error' || l === 'danger' || l === 'fail') return 'error';
    return '';
  }
  function sortedEvals(list) {
    return (list || []).slice().sort((a, b) => {
      const ra = isRunning(a) ? 0 : 1, rb = isRunning(b) ? 0 : 1;
      if (ra !== rb) return ra - rb;
      return (Number(b.id) || 0) - (Number(a.id) || 0);
    });
  }
  function filteredEvals(page) {
    const s = page.state;
    const q = String(s.q || '').trim().toLowerCase();
    return s.evals.filter((e) => {
      if (s.mode !== '全部' && e.mode !== s.mode) return false;
      if (!q) return true;
      return [e.name, e.no, e.target, e.target_model, e.evalmodel, e.id]
        .some((v) => String(v == null ? '' : v).toLowerCase().indexOf(q) >= 0);
    });
  }
  function filteredRules(page) {
    const s = page.state;
    const q = String(s.ruleQ || '').trim().toLowerCase();
    return s.rules.filter((r) => {
      if (s.ruleMode !== '全部' && r.mode !== s.ruleMode) return false;
      if (!q) return true;
      return [r.name, r.category, r.dim, r.descr].some((v) => String(v == null ? '' : v).toLowerCase().indexOf(q) >= 0);
    });
  }
  function segBtns(items, active, attr) {
    return `<div class="seg">${items.map((i) =>
      `<button ${attr}="${esc(i.v)}" class="${i.v === active ? 'on' : ''}">${esc(i.t)}</button>`).join('')}</div>`;
  }
  function countBy(list, key) {
    const m = {};
    (list || []).forEach((x) => { const k = x[key] || '未分类'; m[k] = (m[k] || 0) + 1; });
    return Object.keys(m).map((k) => ({ k: k, v: m[k] }));
  }
  function stopTimer(page, key) {
    if (!page || !page.timers) return;
    if (page.timers[key]) { clearInterval(page.timers[key]); delete page.timers[key]; }
    if (key === 'logs' && page.state.logs) page.state.logs.timer = null;
  }
  function isEditing() {
    return !!document.querySelector('.modal, .drawer');
  }

  /* ================================================================ 数据层 */
  async function loadEvals(page) {
    const res = await API.get('/api/evals');
    page.state.evals = sortedEvals(res.items || []);
  }
  async function loadModels(page) {
    try {
      const res = await API.get('/api/models');
      page.state.models = res.items || [];
    } catch (e) {
      page.state.models = [];
    }
  }
  async function loadRules(page) {
    const res = await API.get('/api/eval-rules');
    page.state.rules = res.items || [];
    page.state.ruleStat = res.stat || null;
    page.state.ruleByMode = res.byMode || [];
    page.state.ruleByCat = res.byCat || [];
    page.state.rulesLoaded = true;
    return page.state.rules;
  }
  async function loadReport(page, eid) {
    const s = page.state;
    const r = await API.get('/api/evals/' + eid + '/report');
    const ev = r.eval || {};
    const dims = dimsOf(r);
    r.dims = Object.keys(dims).length ? dims : dimsOf(ev);
    r.findings = Array.isArray(r.findings) ? r.findings : [];
    r.findings.forEach((f) => {
      f.evId = eid;
      f.evNo = ev.no || ('#' + eid);
      f.evName = ev.name || '';
    });
    s.reports[eid] = r;
    s.evalById[eid] = ev;
    refreshFindings(page);
    return r;
  }
  function refreshFindings(page) {
    const s = page.state;
    const out = [];
    Object.keys(s.reports).forEach((k) => {
      const eid = Number(k);
      const r = s.reports[k];
      const e = s.evalById[k] || s.evals.find((x) => String(x.id) === String(k));
      (r.findings || []).forEach((f) => {
        out.push(Object.assign({}, f, {
          evId: eid,
          evNo: e ? (e.no || '#' + eid) : '#' + eid,
          evName: e ? e.name : ''
        }));
      });
    });
    s.allFindings = out;
  }
  async function prefetchReports(page) {
    /* 首屏只预取前 3 份，其余报告在用户打开时按需拉取，避免进入页面即并发全量报告 */
    const done = page.state.evals.filter((e) => e.status === '已完成').slice(0, 3);
    for (const e of done) {
      if (!page.alive) return;
      await loadReport(page, e.id).catch(() => null);
    }
    page.state.reportsReady = true;
  }
  async function ensureItems(page, eid, cat, risk) {
    const s = page.state;
    const key = eid + '|' + cat + '|' + risk;
    if (s.itemsCache[key]) return s.itemsCache[key];
    const res = await API.get('/api/evals/' + eid + '/items', { category: cat, risk: risk });
    s.itemsCache[key] = res.items || [];
    return s.itemsCache[key];
  }

  /* ================================================================ 列表视图 */
  function kpiRow(page) {
    const s = page.state;
    const evs = s.evals;
    const done = evs.filter((e) => e.status === '已完成');
    const run = evs.filter(isRunning);
    const avg = done.length ? done.reduce((a, e) => a + (Number(e.score) || 0), 0) / done.length : 0;
    const asrs = done.map((e) => asPct(e.asr)).filter((v) => v > 0);
    const asr = asrs.length ? asrs.reduce((a, v) => a + v, 0) / asrs.length : 0;
    const samples = evs.reduce((a, e) => a + (Number(e.samples) || 0), 0);
    return `<div class="grid g-4">
      ${UI.kpi({ label: '评估任务', value: UI.num(evs.length), unit: '个', meta: `已完成 ${done.length} · 运行中 ${run.length}` })}
      ${UI.kpi({ label: '平均得分', value: avg.toFixed(1), unit: '分', meta: `基于 ${done.length} 个已完成任务` })}
      ${UI.kpi({ label: '平均攻击成功率', value: asr.toFixed(1), unit: '%', meta: 'ASR = 未拦截样本占比' })}
      ${UI.kpi({ label: '样本总量', value: UI.num(samples), unit: '条', meta: `覆盖 ${new Set(evs.map((e) => e.target || e.target_model)).size} 个被测模型` })}
    </div>`;
  }
  function focusBanner(page) {
    const s = page.state;
    if (!s.focusId) return '';
    const e = s.evals.find((x) => String(x.id) === String(s.focusId));
    if (!e) return '';
    const done = e.status === '已完成';
    return `<div class="ev-focus">${icon(done ? 'check' : 'clock', 15)}
      <span class="nm">已创建 <b>${esc(e.name)}</b> · 样本 ${UI.num(e.samples)} 条 · 规则 ${UI.num(s.lastRules || 0)} 条 ·
        状态 <b>${esc(e.status)}</b>${done ? ' · 得分 ' + (Number(e.score) || 0).toFixed(1) : ' · 进度 ' + pctOf(e) + '%'}</span>
      <button class="btn ghost sm" data-focus-go="${e.id}">查看报告</button>
      <button class="icon-btn" data-focus-x title="收起提示">${icon('close', 14)}</button>
    </div>`;
  }
  function listTable(page, rows) {
    if (!rows.length) {
      return UI.empty('没有匹配的评估任务', '调整筛选条件，或新建一个评估任务',
        `<button class="btn primary sm" data-new style="margin-top:10px">${icon('plus', 13)}新建评估</button>`);
    }
    return UI.table({
      cls: 'ev-ltbl',
      onRow: true,
      cols: [
        { label: '评估任务', w: '25%', render: (e) => `<div class="ev-nm" title="${esc(e.name)}">${esc(e.name)}</div>
          <div class="ev-ns">${esc(e.no || '#' + e.id)} · ${esc(e.mode || '—')}模式</div>` },
        { label: '被测模型 / 裁判', w: '18%', render: (e) => `<span class="ev-md">${esc(modelName(page, e.target_model, e.target))}</span>
          <span class="ev-ns">裁判 ${esc(modelName(page, e.eval_model, e.evalmodel))}</span>` },
        { label: '样本', w: '7%', cls: 'tr', render: (e) => `<span class="num" style="font-size:12px">${UI.num(e.samples)}</span>` },
        { label: '执行进度', w: '15%', render: (e) => {
          const done = Number(e.done) || 0;
          const total = Math.max(Number(e.samples) || 0, done);
          const pc = total ? Math.min(100, Math.round((done / total) * 100)) : 0;
          return `<div class="ev-prog">${UI.bar(pc, e.status === '已完成' ? 'ok' : isRunning(e) ? 'brand' : '')}
            <span>${UI.num(done)}/${UI.num(total)}</span></div>
            <div class="ev-prog-sub">${pc}%</div>`;
        } },
        { label: '得分', w: '7%', cls: 'tr', render: (e) => e.status === '已完成'
          ? `<div class="ev-sc ${scoreTone(e.score)}">${(Number(e.score) || 0).toFixed(1)}</div>`
          : `<div class="ev-sc" style="color:var(--text-3)">—</div>` },
        { label: '状态', w: '9%', render: (e) => UI.pill(e.status) },
        { label: '创建', w: '12%', render: (e) => `<div class="ev-time">${fmtTime(e.created)}</div>
          <div class="ev-ago">${UI.ago(e.created)}</div>` },
        { label: '', w: '7%', cls: 'tr', render: (e) => `<button class="btn ghost sm" data-exp="${e.id}" title="导出报告">${icon('download', 13)}</button>` }
      ],
      rows: rows
    });
  }
  function tasksCard(page) {
    const s = page.state;
    const rows = filteredEvals(page);
    return UI.card({
      title: '评估任务',
      sub: `<span id="ev-count">共 ${s.evals.length} 个任务 · 当前筛选 ${rows.length} 个</span>`,
      flush: true,
      right: `${UI.seg([{ v: '全部', t: '全部' }, { v: '合规', t: '合规' }, { v: '安全', t: '安全' }, { v: '自定义', t: '自定义' }], s.mode)}
        <div class="searchbox sm" style="margin-left:8px">${icon('search', 13)}
          <input id="ev-q" placeholder="搜索名称 / 编号 / 模型" value="${esc(s.q)}"></div>`,
      body: `<div id="ev-rows">${listTable(page, rows)}</div>`
    });
  }
  function archiveSection(page) {
    const done = page.state.evals.filter((e) => e.status === '已完成').slice(0, 3);
    if (!done.length) return '';
    return `<div class="stack" style="gap:10px">
      <div class="ev-arc-hd"><b>最近完成</b><span>已归档报告，点击卡片查看完整报告</span></div>
      <div class="ev-arcs">${done.map((e) => {
        const r = page.state.reports[e.id];
        const fcount = r ? (r.findings || []).length : null;
        return `<div class="ev-arc" data-eid="${e.id}">
          <div class="ev-arc-top"><div class="ev-arc-score ${scoreTone(e.score)}">${(Number(e.score) || 0).toFixed(1)}</div>
            <span class="chip">${esc(e.mode || '—')}</span></div>
          <div class="ev-arc-name" title="${esc(e.name)}">${esc(e.name)}</div>
          <div class="ev-arc-meta">${esc(e.no || '#' + e.id)} · ${UI.num(e.samples)} 样本 · ${fmtTime(e.finished || e.created)}</div>
          <div class="ev-arc-foot"><span>发现项 <b>${fcount == null ? '—' : fcount}</b></span>
            <span class="link">查看报告 ${icon('arrow', 12)}</span></div>
        </div>`;
      }).join('')}</div></div>`;
  }
  function remediationCard(page) {
    const all = page.state.allFindings;
    const KEYS = ['待整改', '整改中', '已整改'];
    const cnt = { '待整改': 0, '整改中': 0, '已整改': 0 };
    all.forEach((f) => { const k = KEYS.indexOf(f.fix_status) >= 0 ? f.fix_status : '待整改'; cnt[k] += 1; });
    const total = all.length;
    const colorOf = (k) => (k === '已整改' ? '#0B9E6E' : k === '整改中' ? '#2C55E6' : '#C97C10');
    const stats = `<div class="ev-fx-grid">${KEYS.map((k) => `<div class="ev-fx">
        <div class="ev-fx-l"><i style="background:${colorOf(k)}"></i>${k}</div>
        <div class="ev-fx-v">${cnt[k]}<small>项</small></div>
        ${UI.bar(total ? (cnt[k] / total) * 100 : 0, k === '已整改' ? 'ok' : k === '整改中' ? 'brand' : 'warn')}
      </div>`).join('')}</div>`;
    const rows = KEYS.map((k) => {
      const list = all.filter((f) => (KEYS.indexOf(f.fix_status) >= 0 ? f.fix_status : '待整改') === k);
      return list.slice(0, 3).map((f) => `<div class="ev-fix-r" data-eid="${f.evId}" data-fid="${esc(f.risk_id || '')}">
        <span>${UI.pill(normLevel(f.level) || '低风险', LEVEL_TONE[normLevel(f.level)] || 'gray')}</span>
        <span class="ev-fix-t" title="${esc(f.title)}">${esc(f.title)}</span>
        <span class="ev-fix-e" title="${esc(f.evName)}">${esc(f.evNo)}</span>
        <span class="ev-fix-st">${UI.pill(k, FIX_TONE[k] || 'gray')}</span>
      </div>`).join('');
    }).join('');
    const body = total
      ? stats + `<div style="margin-top:4px">
          <div class="ev-fix-r" style="pointer-events:none;color:var(--text-3);font-size:10.5px">
            <span>等级</span><span>发现项</span><span>来源评估</span><span class="ev-fix-st">状态</span></div>
          ${rows}
          ${total > 9 ? `<div style="padding:8px 16px"><span class="tiny muted">每组仅展示前 3 项，共 ${total} 项</span></div>` : ''}
        </div>`
      : `<div class="pad">${UI.empty('暂无风险发现项', '已完成评估的报告中没有记录风险发现，报告生成后自动汇总')}</div>`;
    return UI.card({
      title: '整改跟踪',
      sub: `共 ${total} 项风险发现 · 按 fix_status 分组`,
      flush: true,
      right: total ? `<span class="tiny muted">点击行跳转来源报告</span>` : '',
      body: body
    });
  }
  function flowHTML(page) {
    const s = page.state;
    const evs = s.evals;
    const done = evs.filter((e) => e.status === '已完成');
    const run = evs.filter(isRunning);
    const fixed = s.allFindings.filter((f) => f.fix_status === '已整改').length;
    const total = s.allFindings.length;
    const steps = [
      { t: '样本编排', a: `${UI.num(evs.reduce((a, e) => a + (Number(e.samples) || 0), 0))} 条样本 · ${s.rules.length} 条规则` },
      { t: '分片执行', a: `${run.length} 个任务执行中 · ${done.length} 个已完成` },
      { t: '判定归因', a: `${s.allFindings.length} 项风险命中` },
      { t: '报告生成', a: `${Object.keys(s.reports).length} 份报告可查看` },
      { t: '整改情况', a: `${fixed} / ${total} 项已整改` }
    ];
    return `<div class="ev-flow">${steps.map((st, i) => `<div class="ev-fl">
      <div class="ev-fl-n">${i + 1}</div>
      <div class="ev-fl-t"><b>${esc(st.t)}</b><span>${esc(st.a)}</span></div>
      <div class="ev-fl-a">${icon('arrow', 13)}</div></div>`).join('')}</div>`;
  }
  function flowCard(page) {
    return UI.card({ title: '评估流程', sub: '5 个环节，计数来自任务与报告', flush: true, body: flowHTML(page) });
  }

  /* ================================================================ 规则视图 */
  function rulesKpi(page) {
    const rules = page.state.rules;
    const builtin = rules.filter((r) => r.builtin).length;
    const uses = rules.reduce((a, r) => a + (Number(r.uses) || 0), 0);
    const clauses = rules.reduce((a, r) =>
      a + String(r.clauses || '').split(/[；;、,，\n]/).filter((x) => x.trim()).length, 0);
    const latest = rules.map((r) => String(r.updated || '')).sort().pop() || '';
    return `<div class="grid g-4">
      ${UI.kpi({ label: '规则总数', value: UI.num(rules.length), unit: '条', meta: `内置 ${builtin} · 自建 ${rules.length - builtin}` })}
      ${UI.kpi({ label: '条款覆盖', value: UI.num(clauses), unit: '项', meta: '法规 / 制度条款映射数量' })}
      ${UI.kpi({ label: '累计调用', value: UI.num(uses), unit: '次', meta: '被评估任务引用次数合计' })}
      ${UI.kpi({ label: '最近更新', value: latest ? UI.ago(latest) : '—', meta: latest ? fmtTime(latest) : '暂无更新记录' })}
    </div>`;
  }
  function rulesCharts(page) {
    const rules = page.state.rules;
    const byMode = RULE_MODES.map((m) => ({ k: m, v: rules.filter((r) => r.mode === m).length, color: MODE_COLOR[m] }))
      .filter((d) => d.v);
    const cats = countBy(rules, 'category').sort((a, b) => b.v - a.v).slice(0, 8);
    const donut = byMode.length
      ? Charts.donut(byMode, { size: 190, thickness: 20, center: String(rules.length), centerSub: '规则' })
      : UI.empty('暂无规则', '');
    const bars = cats.length
      ? Charts.hbars(cats.map((c) => ({ k: c.k, v: c.v })), { labelW: 116, h: 24 })
      : UI.empty('暂无分类数据', '');
    return `<div class="grid g-2">
      ${UI.card({ title: '规则构成', sub: '按模式', body: `<div class="ev-modechart">${donut}</div>` })}
      ${UI.card({ title: '风险分类分布', sub: '规则数 Top 8', body: `<div class="ev-catchart">${bars}</div>` })}
    </div>`;
  }
  function rulesTable(page) {
    const rows = filteredRules(page);
    if (!rows.length) return UI.empty('没有匹配的规则', '调整筛选条件，或新建一条自定义规则');
    return UI.table({
      cls: 'ev-rtbl',
      onRow: true,
      cols: [
        { label: '规则名称', w: '24%', render: (r) => `<div class="ev-rnm" title="${esc(r.name)}">${esc(r.name)}</div>
          <div class="ev-rsub">${esc(r.dim || '未标注维度')} · ${r.builtin ? '内置' : '自建'}</div>` },
        { label: '模式', w: '9%', render: (r) => `<span class="chip"><span class="ev-dot">
          <i style="background:${MODE_COLOR[r.mode] || '#8A93A5'}"></i>${esc(r.mode || '—')}</span></span>` },
        { label: '分类', w: '11%', render: (r) => `<span class="chip">${esc(r.category || '未分类')}</span>` },
        { label: '判定要点', w: '26%', render: (r) => `<div class="ev-rdesc" title="${esc(r.descr || '')}">${esc(r.descr || '—')}</div>` },
        { label: '条款', w: '13%', render: (r) => `<div class="ev-rsub" style="white-space:normal">${esc(trunc(r.clauses || '—', 26))}</div>` },
        { label: '使用', w: '6%', cls: 'tr', render: (r) => `<span class="ev-rnum num">${UI.num(r.uses || 0)}</span>` },
        { label: '更新', w: '8%', render: (r) => `<div class="ev-rsub">${UI.ago(r.updated)}</div>` },
        { label: '操作', w: '12%', render: (r) => `<div class="ev-ops">
          <button class="btn ghost sm" data-rule-use="${r.id}" title="以此规则新建评估">以此新建</button>
          <button class="icon-btn" data-rule-edit="${r.id}" title="编辑">${icon('more', 14)}</button>
          ${r.builtin ? '' : `<button class="icon-btn" data-rule-del="${r.id}" title="删除">${icon('close', 13)}</button>`}
        </div>` }
      ],
      rows: rows
    });
  }
  function rulesCard(page) {
    const s = page.state;
    const builtin = s.rules.filter((r) => r.builtin).length;
    return UI.card({
      title: '评估规则库',
      sub: `共 ${s.rules.length} 条 · 内置 ${builtin} 条 · 自建 ${s.rules.length - builtin} 条`,
      flush: true,
      right: `<div class="searchbox sm">${icon('search', 13)}<input id="ev-rule-q" placeholder="搜索规则 / 分类" value="${esc(s.ruleQ)}"></div>
        ${segBtns(['全部'].concat(RULE_MODES).map((m) => ({ v: m, t: m })), s.ruleMode, 'data-rseg')}`,
      body: `<div id="ev-rule-rows">${rulesTable(page)}</div>`
    });
  }
  function rulesView(page) {
    return `${rulesKpi(page)}
      <div id="ev-rule-charts">${rulesCharts(page)}</div>
      ${rulesCard(page)}`;
  }

  /* ================================================================ 横向基准 */
  function dimsObj(arr, names) {
    const o = {};
    (arr || []).forEach((v, i) => { o[names[i] || ('维度' + (i + 1))] = Math.round(Number(v) || 0); });
    return o;
  }
  function benchView(page) {
    const s = page.state;
    const b = s.bench;
    if (!b) return `<div class="card pad">${s.benchError ? UI.note('基准数据加载失败：' + esc(s.benchError), 'warn') : UI.skel(4)}</div>`;
    const items = b.items || [];
    if (!items.length) {
      return UI.card({ title: '横向基准', body: UI.empty('暂无基准数据', '点击右上角「重新计算」生成多模型横向对比') });
    }
    const dims = b.dims || [];
    const fastest = items.reduce((a, x) => (Number(x.latency) < Number(a.latency) ? x : a), items[0]);
    return `<div class="grid g-4">
        ${UI.kpi({ label: '参评模型', value: items.length, unit: '个', meta: `${dims.length || 5} 维统一口径 · 同套样本` })}
        ${UI.kpi({ label: '平均得分', value: (Number(b.avgScore) || 0).toFixed(1), unit: '分', meta: `最高 ${esc(b.best || '—')}` })}
        ${UI.kpi({ label: '得分极差', value: (Number(b.spread) || 0).toFixed(1), unit: '分', meta: '最高分与最低分之差' })}
        ${UI.kpi({ label: '最低延时', value: UI.num(Math.round(Number(fastest.latency) || 0)), unit: 'ms', meta: `最快 ${esc(fastest.model)}` })}
      </div>
      <div class="grid g-2">
        ${UI.card({ title: '综合得分对比', sub: '满分 100', body: `<div class="ev-bars">${Charts.hbars(
          items.map((x) => ({ k: x.model, v: x.score, color: x.model === b.best ? Charts.pal.brand : '#A8B2C4' })),
          { labelW: 132, h: 26 })}</div>` })}
        ${UI.card({ title: '平均响应延时', sub: '毫秒，越低越好', body: `<div class="ev-bars">${Charts.hbars(
          items.map((x) => ({ k: x.model, v: x.latency, color: x.model === fastest.model ? '#0B9E6E' : '#A8B2C4' })),
          { labelW: 132, h: 26, unit: 'ms' })}</div>` })}
      </div>
      ${UI.card({
        title: '基准明细', sub: '得分 / ASR / 拒答率 / 安全水位 / 延时 / 成功率', flush: true,
        body: UI.table({
          cls: 'bk-tbl',
          cols: [
            { label: '模型', render: (x) => `<b style="font-weight:600">${esc(x.model)}</b>${x.model === b.best ? `<span class="chip" style="margin-left:6px">最佳</span>` : ''}` },
            { label: '厂商', render: (x) => `<span class="muted">${esc(x.vendor || '—')}</span>` },
            { label: '得分', cls: 'tr', render: (x) => `<span class="num">${(Number(x.score) || 0).toFixed(1)}</span>` },
            { label: 'ASR', cls: 'tr', render: (x) => `${asPct(x.asr).toFixed(1)}%` },
            { label: '拒答率', cls: 'tr', render: (x) => `${asPct(x.refuse).toFixed(1)}%` },
            { label: '安全水位', cls: 'tr', render: (x) => `${asPct(x.safety).toFixed(1)}%` },
            { label: '延时', cls: 'tr', render: (x) => `${UI.num(x.latency)} ms` },
            { label: '成功率', cls: 'tr', render: (x) => `${asPct(x.success).toFixed(1)}%` }
          ],
          rows: items
        })
      })}
      <div class="stack" style="gap:10px">
        <div class="ev-arc-hd"><b>维度雷达对比</b><span>同一套 ${dims.length || 5} 维口径</span></div>
        <div class="bk-grid">${items.map((x) => `<div class="bk-cell">
          <div class="row between"><b style="font-size:12.5px">${esc(x.model)}</b>
            ${x.model === b.best ? `<span class="bk-best">最佳</span>` : ''}</div>
          <div class="bk-sc">${(Number(x.score) || 0).toFixed(1)}<small>分</small></div>
          <div class="bk-vendor">${esc(x.vendor || '')} · ${UI.num(x.latency)} ms</div>
          ${Charts.radar(dimsObj(x.dims, dims), { size: 206, max: 100 })}
          <div class="tiny muted" style="text-align:center">${esc(x.note || '')}</div>
        </div>`).join('')}</div>
      </div>`;
  }

  /* ================================================================ 报告视图 */
  function summarize(page, r, e) {
    const running = isRunning(e) || r.running === 1 || r.running === true;
    const score = Number(r.score) || 0;
    return {
      running: running,
      score: score,
      dims: r.dims || {},
      asr: asPct(r.asr),
      refuse: asPct(r.refuse),
      safety: asPct(r.safety),
      findings: r.findings || [],
      level: gradeOf(score)
    };
  }
  function ring(value, live) {
    const pct = Math.max(0, Math.min(100, Number(value) || 0));
    const R = 74, C = 2 * Math.PI * R;
    const color = pct >= 90 ? '#0B9E6E' : pct >= 80 ? '#2C55E6' : pct >= 70 ? '#C97C10' : '#D93B3B';
    return `<svg width="176" height="176" viewBox="0 0 176 176">
      <circle cx="88" cy="88" r="${R}" fill="none" stroke="#EDF0F6" stroke-width="12"/>
      <circle cx="88" cy="88" r="${R}" fill="none" stroke="${live ? color : '#DDE3EC'}" stroke-width="12"
        stroke-linecap="round" transform="rotate(-90 88 88)" stroke-dasharray="${C}"
        stroke-dashoffset="${live ? C * (1 - pct / 100) : C}"/>
      <text x="88" y="87" text-anchor="middle" font-size="34" font-weight="650" fill="#171D29"
        style="font-variant-numeric:tabular-nums">${live ? pct.toFixed(1) : '—'}</text>
      <text x="88" y="107" text-anchor="middle" font-size="10.5" fill="#8A93A5">综合得分</text>
    </svg>`;
  }
  function scoreCol(sum) {
    const lv = sum.level;
    return `<div class="ev-score">
      ${ring(sum.score, !sum.running)}
      <div class="ev-grade">
        <span class="ev-gb ${sum.running ? 'gray' : lv[2]}">${sum.running ? '…' : lv[0]}</span>
        <span class="ev-gt"><b>${sum.running ? '评估进行中' : lv[1]}</b>
          <span>${sum.running ? '完成后生成综合等级' : '综合得分 ' + sum.score.toFixed(1) + ' / 100'}</span></span>
      </div>
      <div class="ev-cap">满分 100 · 按规则命中与拦截结果计算</div>
    </div>`;
  }
  function midCol(page, r, e, sum) {
    const mini = (l, v, unit, tone) => `<div class="ev-ms"><div class="ev-ms-l">${l}</div>
      <div class="ev-ms-v ${tone || ''}">${v}${unit ? `<i>${unit}</i>` : ''}</div></div>`;
    const lv = { '高风险': 0, '中风险': 0, '低风险': 0 };
    sum.findings.forEach((f) => { const k = normLevel(f.level); if (lv[k] != null) lv[k] += 1; });
    const catN = (r.catstat || []).length;
    const concl = sum.running
      ? '评估仍在执行，得分与风险判定将在任务完成后生成。'
      : `本次评估覆盖 ${UI.num(e ? e.samples : 0)} 条样本、${catN} 个风险类别，命中风险发现 ${sum.findings.length} 项（高风险 ${lv['高风险']} · 中风险 ${lv['中风险']} · 低风险 ${lv['低风险']}），综合得分 ${sum.score.toFixed(1)}。`;
    return `<div class="ev-mid">
      <div class="ev-lab">评估结论</div>
      <div class="ev-sum" title="${esc(r.summary || '')}">${esc(concl)}</div>
      <div class="ev-mini">
        ${mini('攻击成功率 ASR', sum.asr.toFixed(1), '%', sum.asr >= 20 ? 'danger' : sum.asr >= 5 ? 'warn' : '')}
        ${mini('拒答率', sum.refuse.toFixed(1), '%', '')}
        ${mini('安全水位', sum.safety.toFixed(1), '%', '')}
      </div>
      <div class="ev-kv">
        <div class="kv"><span>综合得分</span><b>${sum.running ? '—' : sum.score.toFixed(1)}</b></div>
        <div class="kv"><span>风险发现</span><b>${sum.findings.length} 项</b></div>
        <div class="kv"><span>样本规模</span><b>${UI.num(e ? e.samples : 0)} 条</b></div>
        <div class="kv"><span>完成进度</span><b id="ev-kv-pct">${pctOf(e)}%</b></div>
      </div>
      ${sum.running ? `<div class="ev-runbar"><span style="width:auto;color:var(--text-3)">进度</span>
        <div class="bar brand" id="ev-run-bar"><i style="width:${Math.max(2, pctOf(e))}%"></i></div>
        <span id="ev-run-pct">${pctOf(e)}%</span></div>` : ''}
    </div>`;
  }
  function radarCol(page, r, sum) {
    const keys = Object.keys(sum.dims);
    if (!keys.length) {
      return `<div class="ev-radar"><div class="ev-lab">五维能力</div>
        <div class="ev-radar-empty">${icon('dashboard', 18)}<b>暂无维度数据</b>
          <span>报告接口未返回五维得分，评估完成后自动生成。</span></div></div>`;
    }
    const vals = keys.map((k) => sum.dims[k]);
    const hi = Math.max.apply(null, vals), lo = Math.min.apply(null, vals);
    return `<div class="ev-radar"><div class="ev-lab">五维能力</div>
      ${Charts.radar(sum.dims, { size: 292, max: 100 })}
      <div class="ev-tags">
        <span class="ev-tag"><b>${esc(keys[vals.indexOf(hi)])}</b> 最强 ${hi}</span>
        <span class="ev-tag"><b>${esc(keys[vals.indexOf(lo)])}</b> 短板 ${lo}</span>
      </div>
      <div class="ev-radar-note">维度取自报告接口 dims 字段，满分 100</div>
    </div>`;
  }
  function reportCard(page, r, e, sum) {
    const eid = e ? e.id : page.state.rid;
    return `<section class="card ev-rpt">
      <div class="ev-rpt-hd">
        <button class="icon-btn ev-backic" data-back title="返回评估列表">${icon('arrow', 16)}</button>
        <div style="min-width:0">
          <div class="mono">${esc((e && e.no) || '#' + eid)} · ${esc((e && e.mode) || '—')}模式 · 样本 ${UI.num(e ? e.samples : 0)} 条</div>
          <div class="ev-rt">${esc((e && e.name) || '评估报告')}</div>
          <div class="ev-rm">被测模型 <b>${esc(modelName(page, e && e.target_model, e && e.target))}</b>
            <span class="sep">|</span> 裁判模型 <b>${esc(modelName(page, e && e.eval_model, e && e.evalmodel))}</b>
            <span class="sep">|</span> 创建 ${fmtTime(e && e.created)}
            ${e && e.finished ? `<span class="sep">|</span> 完成 ${fmtTime(e.finished)}` : ''}</div>
        </div>
        <div class="ev-acts">
          ${e ? UI.pill(e.status) : ''}
          ${Object.keys(FMT).map((k) => `<button class="btn ghost sm" data-export="${eid}" data-fmt="${k}">
            ${icon('download', 12)}${FMT[k].name}</button>`).join('')}
        </div>
      </div>
      <div class="ev-body">
        ${scoreCol(sum)}
        ${midCol(page, r, e, sum)}
        ${radarCol(page, r, sum)}
      </div>
    </section>`;
  }
  function heatCard(page, r) {
    const heat = r.heat || [];
    const maxOf = (cells) => Math.max(1, cells.reduce((a, v) => Math.max(a, Number(v) || 0), 0));
    if (!heat.length) {
      return UI.card({ title: '风险热力矩阵', sub: '类别 × 风险等级', flush: true,
        body: `<div class="ev-heat">${UI.empty('暂无热力数据', '报告生成后展示类别与风险等级的样本分布')}</div>` });
    }
    const head = `<div class="ev-heat-h"><span class="ev-hc" style="text-align:left">风险类别</span>
      ${DRILL_COLS.map((c) => `<span class="ev-hc">${c.t}</span>`).join('')}<span class="ev-hc">合计</span></div>`;
    const rows = heat.map((row) => {
      const cells = (row.cells || []).map((v) => Number(v) || 0);
      const max = maxOf(cells);
      const total = cells.reduce((a, v) => a + v, 0);
      const tds = DRILL_COLS.map((c, i) => {
        const v = cells[i] || 0;
        const alpha = v ? (0.12 + 0.6 * (v / max)).toFixed(2) : 0;
        return `<button class="ev-cell ${v ? '' : 'zero'}" data-heat="${esc(row.cat)}|${i}"
          title="${esc(row.cat)} · ${c.t} · ${v} 条样本，点击下钻"${v ? ` style="background:rgba(${c.rgb},${alpha})"` : ''}>${v || ''}</button>`;
      }).join('');
      return `<div class="ev-heat-r"><span class="ev-heat-cat" title="${esc(row.cat)}">${esc(row.cat)}</span>
        ${tds}<span class="ev-heat-sum">${total}</span></div>`;
    }).join('');
    return UI.card({
      title: '风险热力矩阵', sub: '类别 × 风险等级 · 每格可点击下钻', flush: true,
      body: `<div class="ev-heat">${head}${rows}</div>
        <div class="ev-heat-hint">${icon('bolt', 11)} 点击任意格子，查看该类别该等级的样本证据与命中明细</div>`
    });
  }
  function catCard(page, r) {
    const cats = r.catstat || [];
    if (!cats.length) {
      return UI.card({ title: '类别分布', sub: '样本数 / 失败数', flush: true,
        body: `<div class="ev-cats">${UI.empty('暂无类别统计', '报告未返回 catstat 数据')}</div>` });
    }
    const max = Math.max(1, ...cats.map((c) => Number(c.value) || 0));
    const rows = cats.map((c) => {
      const v = Number(c.value) || 0;
      return `<div class="ev-cat">
        <span class="ev-cat-n" title="${esc(c.name)}">${esc(c.name)}</span>
        <span class="ev-cat-b">${UI.bar((v / max) * 100, '')}</span>
        <span class="ev-cat-v">${v}</span>
        <span class="ev-cat-f ${c.fail ? 'on' : ''}">${c.fail || 0}</span></div>`;
    }).join('');
    return UI.card({
      title: '类别分布', sub: '样本数 / 失败数', flush: true,
      body: `<div class="ev-cats">
        <div class="ev-cat ev-cat-h"><span>类别</span><span>样本分布</span><span>样本</span><span>失败</span></div>
        ${rows}</div>`
    });
  }
  function findingBlock(page, f, lv, idx) {
    const domId = 'evf-' + f.evId + '-' + idx;
    const advice = f.advice || ('按规则 ' + (f.rule_id || '—') + ' 加固系统提示词与输出过滤，并将该样本加入回归集复测。');
    return `<div class="ev-fnd" id="${domId}">
      <span class="ev-fbar ${lv === '高风险' ? '' : lv === '中风险' ? 'mid' : 'low'}"></span>
      <div class="ev-fmain">
        <div class="ev-fhd">
          <span class="ev-fid">${esc(f.risk_id || '—')}</span>
          <b class="ev-ft">${esc(f.title || '未命名发现项')}</b>
          <span class="chip">${esc(f.category || f.cat || '未分类')}</span>
          ${UI.pill(lv, LEVEL_TONE[lv] || 'gray')}
          ${UI.pill(f.fix_status || '待整改', FIX_TONE[f.fix_status] || 'gray')}
          <span class="ev-fid" style="margin-left:auto">${esc(f.evNo || '—')}</span>
        </div>
        <div class="ev-fgrid">
          <div>
            <div class="ev-desc">${esc(f.descr || '无判定说明')}</div>
            <div class="ev-advice"><span class="lab">整改建议</span><span>${esc(advice)}</span></div>
          </div>
          <div class="ev-sample"><div class="lab">命中样本（真实输入）</div>
            <code>${esc(f.sample || '—')}</code></div>
        </div>
      </div>
    </div>`;
  }
  function findingsCard(page, r) {
    const list = r.findings || [];
    if (!list.length) {
      return UI.card({
        title: '风险发现项', sub: '0 项', flush: true,
        body: `<div class="ev-oknote">${icon('check', 16)}
          <div><b style="font-size:12.5px">未发现风险项</b>
          <div class="tiny" style="margin-top:3px">本次评估的所有样本均通过规则判定，或报告仍在生成中。</div></div></div>`
      });
    }
    const groups = LEVEL_ORDER.map((lv) => {
      const items = list.filter((f) => normLevel(f.level) === lv);
      if (!items.length) return '';
      return `<div class="ev-ghead"><i style="background:${LEVEL_BAR[lv]}"></i><b>${lv}</b>
        <span class="ev-gc">${items.length} 项</span><span class="ev-gline"></span>
        <span class="ev-gc">等级与整改状态来自报告接口</span></div>` +
        items.map((f) => findingBlock(page, f, lv, list.indexOf(f))).join('');
    }).join('');
    return UI.card({ title: '风险发现项', sub: `共 ${list.length} 项 · 含命中样本证据`, flush: true, body: groups });
  }
  function multiCard(page) {
    const s = page.state;
    const m = s.multi;
    const metrics = (m && m.metrics) || {};
    const items = (m && m.items) || [];
    const personas = (m && m.personas && m.personas.length) ? m.personas : ['普通用户', '恶意用户', '模糊用户'];
    const cur = s.multiPersona && personas.indexOf(s.multiPersona) >= 0 ? s.multiPersona : personas[0];
    const turns = s.multiTurns || 6;
    const tools = `<div class="mt-tools">
      <div class="field" style="width:136px;gap:4px"><label>诱导人格</label>
        <select class="select" id="mt-persona">${personas.map((p) =>
          `<option ${p === cur ? 'selected' : ''}>${esc(p)}</option>`).join('')}</select></div>
      <div class="field" style="width:96px;gap:4px"><label>对话轮数</label>
        <select class="select" id="mt-turns">${[2, 4, 6, 8, 10, 12].map((n) =>
          `<option value="${n}" ${n === turns ? 'selected' : ''}>${n} 轮</option>`).join('')}</select></div>
      <button class="btn primary sm" data-sim ${s.multiLoading ? 'disabled' : ''}>
        ${icon('play', 12)}${s.multiLoading ? '模拟中…' : '重新模拟'}</button>
      <span class="tiny muted">当前：${esc(cur)} · ${turns} 轮</span>
    </div>`;
    const kpis = `<div class="mt-kpis">
      ${[['对话轮数', metrics.rounds || 0, '轮'], ['拦截率', metrics.blockRate || 0, '%'],
        ['诱导渗透率', metrics.carryRate || 0, '%'], ['一致性保持', metrics.consistency || 0, '%']]
        .map((row) => `<div class="mt-kpi"><div class="mt-kpi-l">${row[0]}</div>
          <div class="mt-kpi-v">${row[1]}<i>${row[2]}</i></div></div>`).join('')}
    </div>`;
    const list = items.length
      ? `<div class="mt-list">${items.map((it) => `<div class="mt-row ${it.blocked ? 'blocked' : ''}">
          <span class="mt-n">${it.round}</span>
          <div style="min-width:0"><div class="mt-u">${esc(it.user_prompt || '')}</div>
            <div class="mt-a">${esc(it.model_reply || '')}</div></div>
          <span class="mt-badge ${it.blocked ? 'ok' : 'blk'}">${it.blocked ? '已拦截' : '未拦截'}</span>
        </div>`).join('')}</div>`
      : `<div class="ev-log-empty">该评估还没有多轮模拟记录。选择人格与轮数后点击「重新模拟」生成对话。</div>`;
    return UI.card({
      title: '多轮诱导模拟',
      sub: '连续对话中的渐进式诱导，数据来自 /api/evals/{id}/multi 与 /simulate',
      body: tools + kpis + list
    });
  }
  function logRows(page) {
    const s = page.state;
    const items = (s.logs && s.logs.items) || [];
    if (!items.length) {
      const e = s.evalById[s.rid];
      const hint = s.logs && s.logs.loading
        ? '正在读取实时日志…'
        : isRunning(e)
          ? '任务已启动，首条样本判定完成后写入日志（每 6 条样本一条）'
          : '暂无运行日志：该评估未产生日志记录（历史任务不写入日志表）';
      return `<div class="ev-log-empty">${hint}</div>`;
    }
    return items.map((x) => `<div class="ev-log-row">
      <span class="ev-log-ts">${hhmmss(x.ts)}</span>
      <span class="ev-log-lv ${logTone(x.level)}">${LOG_LV[x.level] || '信息'}</span>
      <span class="ev-log-msg">${esc(x.msg || '')}</span></div>`).join('');
  }
  function logCard(page) {
    const s = page.state;
    const n = s.logs ? s.logs.items.length : 0;
    return UI.card({
      title: '实时日志',
      sub: `<span id="ev-log-count">每 3 秒增量拉取 · 已获取 ${n} 条</span>`,
      cls: 'ev-log-card', flush: true,
      right: `${s.logs && s.logs.timer ? `<span class="ev-live"><i></i>轮询中</span>` : `<span class="tiny muted">轮询已停止</span>`}
        <button class="btn ghost sm" data-log-refresh style="margin-left:8px">${icon('refresh', 12)}立即刷新</button>`,
      body: `<div class="ev-log-box" id="ev-log-box">${logRows(page)}</div>`
    });
  }
  function reportView(page) {
    const s = page.state;
    const rid = s.rid;
    const r = s.reports[rid];
    const e = s.evalById[rid] || s.evals.find((x) => String(x.id) === String(rid));
    if (!r) {
      return `<div class="stack">
        <div class="row"><button class="btn" data-back><span class="ev-backic">${icon('arrow', 14)}</span>返回评估列表</button></div>
        <div class="card pad">${s.reportError
          ? `<div class="row" style="gap:10px;align-items:flex-start">${UI.note('报告加载失败：' + esc(s.reportError), 'warn')}
              <button class="btn sm" data-retry>重试</button></div>`
          : UI.skel(5)}</div></div>`;
    }
    const sum = summarize(page, r, e);
    return `<div class="stack">
      ${reportCard(page, r, e, sum)}
      ${isRunning(e) ? logCard(page) : ''}
      <div class="ev-row2">${heatCard(page, r)}${catCard(page, r)}</div>
      <div id="ev-multi">${multiCard(page)}</div>
      ${findingsCard(page, r)}
    </div>`;
  }

  /* ================================================================ 热力下钻 */
  function drillFinding(page, f, domId) {
    const lv = normLevel(f.level);
    return `<div class="ev-drill-f">
      <div class="ev-drill-fh">
        ${UI.pill(lv || '低风险', LEVEL_TONE[lv] || 'gray')}
        <b>${esc(f.title || '未命名发现项')}</b>
        <span class="tiny muted">${esc(f.risk_id || '')}</span>
        <span class="chip">${esc(f.category || f.cat || '未分类')}</span>
        <button class="btn ghost sm" style="margin-left:auto" data-jump="${domId}">定位报告条目</button>
      </div>
      <div class="ev-desc">${esc(f.descr || '无判定说明')}</div>
      <div class="ev-evi-l">命中样本（真实输入）</div>
      <div class="ev-evi-code">${esc(f.sample || '—')}</div>
    </div>`;
  }
  function drillShell(page, ds) {
    const col = ds.col;
    const note = col.level
      ? `热力格计数 ${ds.n} 条来自样本级风险聚合；命中明细 ${ds.matches.length} 项来自报告发现项。两者统计口径不同，数量不保证一致。`
      : `该格表示未触发风险的通过样本 ${ds.n} 条，通过样本不产生发现项明细。`;
    const blocks = ds.matches.length
      ? ds.matches.map((m) => drillFinding(page, m.f, 'evf-' + page.state.rid + '-' + m.di)).join('')
      : `<div class="ev-drill-empty">${icon('search', 20)}<b>暂无可下钻样本</b>
          <span>该热力格没有对应的发现项明细。热力矩阵按样本级风险结果聚合，发现项只记录未拦截的高危 / 中危样本。</span></div>`;
    return `<div class="ev-drill">
      <div class="ev-drill-meta">
        <div class="ev-drill-m"><span>热力格样本</span><b>${ds.n}</b></div>
        <div class="ev-drill-m"><span>命中明细</span><b>${ds.matches.length}</b></div>
        <div class="ev-drill-m"><span>风险等级</span><b style="font-size:14px">${col.t}</b></div>
      </div>
      <div class="ev-drill-note">${esc(note)}</div>
      <div class="ev-drill-t"><span>发现项明细</span><span class="line"></span></div>
      <div>${blocks}</div>
      <div class="ev-drill-t"><span>原始样本证据 · category=${esc(ds.cat)} risk=${col.risk}</span><span class="line"></span></div>
      <div>${drillSamples(page, ds)}</div>
    </div>`;
  }
  function drillSamples(page, ds) {
    if (ds.loading) return `<div class="ev-log-empty">正在读取样本证据…</div>`;
    if (ds.err) return `<div class="ev-log-empty">读取失败：${esc(ds.err)}</div>`;
    const items = ds.items || [];
    if (!items.length) {
      return `<div class="ev-drill-empty"><b>该类别该等级暂无样本</b>
        <span>接口 /items?category=&risk= 返回 0 条记录${ds.n > 0 ? `；热力格计数 ${ds.n} 条来自样本级风险聚合，与明细口径不同` : ''}。</span></div>`;
    }
    const scopeNote = ds.fallback
      ? '<div class="ev-log-empty">该热力格计数由样本级风险聚合产生，实际未拦截样本如下（等级以样本字段为准）。</div>'
      : '';
    const rows = items.slice(0, 8).map((it) => `<div class="ev-evi-row">
      <div class="ev-evi-hd"><span class="mono tiny muted">#${it.idx} · ${esc(it.category || '')}${it.sub ? ' / ' + esc(it.sub) : ''}</span>
        ${UI.pill(String(it.result) === 'pass' ? '通过' : (RISK_LABEL[String(it.risk)] || '通过'), String(it.result) === 'pass' ? 'ok' : String(it.risk) === '3' ? 'danger' : String(it.risk) === '2' ? 'warn' : String(it.risk) === '1' ? 'brand' : 'ok')}
        <span class="tiny muted">得分 ${UI.num(it.score)}</span>
        <span class="tiny muted">结果 ${esc(it.result || '—')}</span></div>
      <div class="ev-evi-l">输入提示词</div>
      <div class="ev-evi-code">${esc(it.prompt || '—')}</div>
      <div class="ev-evi-l">模型响应</div>
      <div class="ev-evi-code">${esc(it.response || '—')}</div>
    </div>`).join('');
    return scopeNote + rows + (items.length > 8 ? `<div class="ev-log-empty">仅展示前 8 条，共 ${items.length} 条</div>` : '');
  }
  async function openDrill(page, cat, ci) {
    const s = page.state;
    const r = s.reports[s.rid] || {};
    const col = DRILL_COLS[ci] || DRILL_COLS[3];
    const row = (r.heat || []).find((h) => h.cat === cat);
    const n = row ? Number((row.cells || [])[ci]) || 0 : 0;
    const matches = [];
    (r.findings || []).forEach((f, di) => {
      if ((f.category || f.cat) === cat && col.level && normLevel(f.level) === col.level) matches.push({ f: f, di: di });
    });
    const ds = { cat: cat, ci: ci, col: col, n: n, matches: matches, items: null, loading: true, err: '' };
    const md = UI.modal({ title: '热力下钻 · ' + cat + ' · ' + col.t, body: drillShell(page, ds), okText: '关闭' });
    md.el.classList.add('ev-modal-wide', 'pg-e');
    const cancelBtn = md.el.querySelector('[data-cancel]');
    if (cancelBtn) cancelBtn.style.display = 'none';
    const bd = md.el.querySelector('.modal-bd');
    bd.onclick = (ev) => {
      const jump = ev.target.closest('[data-jump]');
      if (!jump) return;
      const target = document.getElementById(jump.getAttribute('data-jump'));
      md.close();
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target.classList.add('hl');
        setTimeout(() => target.classList.remove('hl'), 2400);
      }
    };
    try {
      ds.items = await ensureItems(page, s.rid, cat, col.risk);
      if (!ds.items.length && n > 0) {
        const all = await ensureItems(page, s.rid, cat, '');
        const miss = all.filter((it) => col.risk === '0' ? it.result === 'pass' : it.result !== 'pass');
        if (miss.length) { ds.items = miss.slice(0, 8); ds.fallback = true; }
      }
    } catch (err) {
      ds.err = err.message;
    }
    ds.loading = false;
    bd.innerHTML = drillShell(page, ds);
  }

  /* ================================================================ 新建评估 */
  function modelOptions(page, selected) {
    const score = (m) => (m.kind === 'chat' ? 4 : 0) + (/模型接口/.test(String(m.category || '')) ? 2 : 0) + (m.status === '停用' ? 0 : 1);
    const ms = (page.state.models || []).slice().sort((a, b) => score(b) - score(a));
    if (!ms.length) return '<option value="">暂无可用模型，请先到模型网关接入</option>';
    return ms.map((m) => `<option value="${m.id}"${String(m.id) === String(selected) ? ' selected' : ''}>${esc(m.name)} · ${esc(m.category || '模型接口')}${m.status === '停用' ? '（停用）' : ''}</option>`).join('');
  }
  function rulePicker(page, preset) {
    const rules = page.state.rules;
    if (!rules.length) {
      return `<div class="ev-rp"><div class="ev-rp-list">
        <div class="ev-log-empty">规则库为空，请先到「评估规则」页签创建规则。</div></div></div>`;
    }
    const modes = ['全部'].concat(RULE_MODES);
    return `<div class="ev-rp">
      <div class="ev-rp-hd"><b>规则库</b><span>${rules.length} 条</span>
        ${segBtns(modes.map((m) => ({ v: m, t: m })), '全部', 'data-rseg')}
        <span style="flex:1"></span>
        <button class="btn ghost sm" type="button" data-rp-all>全选</button>
        <button class="btn ghost sm" type="button" data-rp-none>清空</button>
      </div>
      <div class="ev-rp-list" id="f-rule-list">${rules.map((r) => `<label class="ev-rp-i" data-mode="${esc(r.mode)}">
        <input type="checkbox" value="${r.id}" ${preset.indexOf(r.id) >= 0 ? 'checked' : ''}>
        <span style="min-width:0">
          <span class="ev-rp-n">${esc(r.name)}${r.builtin ? '' : ' · 自建'}</span>
          <span class="ev-rp-m"><span class="ev-dot"><i style="background:${MODE_COLOR[r.mode] || '#8A93A5'}"></i>${esc(r.mode || '—')}</span>
            · ${esc(r.category || r.dim || '未分类')} · 使用 ${UI.num(r.uses || 0)} 次 · ${UI.ago(r.updated)}</span>
        </span></label>`).join('')}</div>
    </div>`;
  }
  function openNew(page, presetRuleId) {
    const s = page.state;
    const rules = s.rules;
    const pool = s.models || [];
    const preferred = pool.filter((m) => /模型接口/.test(String(m.category || '')));
    const pick = (exclude) => {
      const source = preferred.length ? preferred : pool;
      const active = source.filter((m) => m.status !== '停用');
      const hit = active.find((m) => String(m.id) !== String(exclude)) ||
        source.find((m) => String(m.id) !== String(exclude)) || pool[0];
      return hit ? hit.id : '';
    };
    const target0 = pick('');
    const eval0 = pick(target0);
    const preset = presetRuleId ? [Number(presetRuleId)] : rules.map((r) => r.id);
    const samples = [60, 120, 300, 500, 800];
    const body = `<div class="form" style="display:flex;flex-direction:column;gap:14px">
      <div class="field"><label>评估名称</label>
        <input class="input" id="f-name" maxlength="60" placeholder="如：金融合规基线 · 11 月"></div>
      <div class="form-grid">
        <div class="field"><label>评估模式</label><select class="select" id="f-mode">
          ${RULE_MODES.map((m) => `<option>${m}</option>`).join('')}</select></div>
        <div class="field"><label>样本规模</label><select class="select" id="f-samples">
          ${samples.map((n) => `<option value="${n}">${n} 条</option>`).join('')}</select></div>
        <div class="field"><label>被测模型</label>
          <select class="select" id="f-target">${modelOptions(page, target0)}</select></div>
        <div class="field"><label>评估模型（裁判）</label>
          <select class="select" id="f-eval">${modelOptions(page, eval0)}</select></div>
      </div>
      <div class="field"><label>评估规则 · <span class="muted" id="f-rule-count">已选 ${preset.length}/${rules.length}</span></label>
        ${rulePicker(page, preset)}</div>
      <div class="note" style="font-size:11.5px;line-height:1.7">规则选择随任务写入 <span class="mono">rule_ids</span>；
        按规则库执行样本，报告只记录实际命中的规则。</div>
    </div>`;
    const md = UI.modal({
      title: '新建评估任务', body: body, okText: '创建并运行',
      onOk: async (el) => {
        const q = (id) => (el.querySelector(id) || {}).value;
        const name = String(q('#f-name') || '').trim();
        const target = String(q('#f-target') || '').trim();
        const evaluator = String(q('#f-eval') || '').trim();
        const mode = q('#f-mode');
        const sampleN = Number(q('#f-samples')) || 60;
        if (!name) { UI.toast('请填写评估名称', 'err'); return false; }
        if (!target) { UI.toast('请填写被测模型', 'err'); return false; }
        if (!evaluator) { UI.toast('请填写评估模型', 'err'); return false; }
        const ids = Array.from(el.querySelectorAll('#f-rule-list input:checked')).map((i) => Number(i.value));
        const btn = el.querySelector('[data-ok]');
        btn.disabled = true;
        try {
          const res = await API.post('/api/evals', {
            name: name, mode: mode, samples: sampleN,
            target: target, evaluator: evaluator,
            rule_ids: ids.length ? ids : rules.map((r) => r.id)
          });
          s.lastRules = (res.rule_ids || []).length;
          s.focusId = res.id;
          s.view = 'list';
          s.tab = 'tasks';
          await loadEvals(page);
          render(page);
          UI.toast('评估任务已创建，进度每 6 秒自动刷新');
        } catch (err) {
          btn.disabled = false;
          UI.toast('创建失败：' + err.message, 'err');
          return false;
        }
      }
    });
    md.el.classList.add('ev-modal-wide', 'pg-e');
    const count = () => {
      const n = md.el.querySelectorAll('#f-rule-list input:checked').length;
      const c = md.el.querySelector('#f-rule-count');
      if (c) c.textContent = '已选 ' + n + '/' + rules.length;
    };
    md.el.querySelectorAll('[data-rseg]').forEach((b) => {
      b.onclick = () => {
        const v = b.getAttribute('data-rseg');
        md.el.querySelectorAll('[data-rseg]').forEach((x) => x.classList.toggle('on', x === b));
        md.el.querySelectorAll('.ev-rp-i').forEach((row) => {
          row.classList.toggle('hide', v !== '全部' && row.getAttribute('data-mode') !== v);
        });
      };
    });
    const all = md.el.querySelector('[data-rp-all]');
    const none = md.el.querySelector('[data-rp-none]');
    if (all) all.onclick = () => {
      md.el.querySelectorAll('.ev-rp-i:not(.hide) input').forEach((i) => { i.checked = true; });
      count();
    };
    if (none) none.onclick = () => {
      md.el.querySelectorAll('#f-rule-list input').forEach((i) => { i.checked = false; });
      count();
    };
    const listEl = md.el.querySelector('#f-rule-list');
    if (listEl) listEl.onchange = count;
  }

  /* ================================================================ 规则编辑 */
  function ruleFormBody(r) {
    const v = r || {};
    const cats = RULE_CATS || [];
    return `<div class="form" style="display:flex;flex-direction:column;gap:13px">
      <div class="form-grid">
        <div class="field"><label>规则名称</label>
          <input class="input" id="r-name" maxlength="60" value="${esc(v.name || '')}" placeholder="如：政治敏感内容拦截"></div>
        <div class="field"><label>模式</label>
          <select class="select" id="r-mode">${RULE_MODES.map((m) =>
            `<option ${m === (v.mode || '安全') ? 'selected' : ''}>${m}</option>`).join('')}</select></div>
        <div class="field"><label>风险分类</label>
          <input class="input" id="r-cat" list="r-cat-list" value="${esc(v.category || '')}" placeholder="选择或输入分类">
          <datalist id="r-cat-list">${cats.map((c) => `<option>${esc(c)}</option>`).join('')}</datalist></div>
        <div class="field"><label>维度</label>
          <select class="select" id="r-dim"><option value="" ${v.dim ? '' : 'selected'}>未指定</option>${RULE_DIMS.map((d) =>
            `<option ${d === (v.dim || '') ? 'selected' : ''}>${esc(d)}</option>`).join('')}</select></div>
      </div>
      <div class="field"><label>判定要点</label>
        <textarea class="textarea" id="r-descr" rows="3" placeholder="描述该规则拦截的行为边界">${esc(v.descr || '')}</textarea></div>
      <div class="field"><label>系统提示词</label>
        <textarea class="textarea" id="r-sys" rows="2" placeholder="可选：注入评估用的 system prompt">${esc(v.sys_prompt || '')}</textarea></div>
      <div class="field"><label>用户模板</label>
        <textarea class="textarea" id="r-user" rows="2" placeholder="可选：样本生成模板，使用 {topic} 占位">${esc(v.user_prompt || '')}</textarea></div>
      <div class="field"><label>依据条款</label>
        <input class="input" id="r-clauses" value="${esc(v.clauses || '')}" placeholder="如：TC260-政治敏感；生成式AI办法 第4条"></div>
    </div>`;
  }
  function openRule(page, rule) {
    const md = UI.modal({
      title: rule ? '编辑评估规则' : '新建评估规则',
      body: ruleFormBody(rule),
      okText: rule ? '保存修改' : '创建规则',
      onOk: async (el) => {
        const get = (id) => (el.querySelector(id) || {}).value;
        const name = String(get('#r-name') || '').trim();
        if (!name) { UI.toast('请填写规则名称', 'err'); return false; }
        const payload = {
          name: name,
          mode: get('#r-mode'),
          category: String(get('#r-cat') || '').trim(),
          dim: get('#r-dim'),
          descr: String(get('#r-descr') || '').trim(),
          sys_prompt: String(get('#r-sys') || '').trim(),
          user_prompt: String(get('#r-user') || '').trim(),
          clauses: String(get('#r-clauses') || '').trim()
        };
        try {
          if (rule) await put('/api/eval-rules/' + rule.id, payload);
          else await API.post('/api/eval-rules', payload);
          await loadRules(page);
          render(page);
          UI.toast(rule ? '规则已更新' : '规则已创建');
        } catch (err) {
          UI.toast('保存失败：' + err.message, 'err');
          return false;
        }
      }
    });
    md.el.classList.add('ev-modal-wide', 'pg-e');
  }
  function deleteRule(page, id) {
    const rule = page.state.rules.find((r) => Number(r.id) === Number(id));
    if (!rule) return;
    const md = UI.modal({
      title: '删除规则',
      body: `<div style="font-size:12.5px;line-height:1.8">确认删除规则 <b>${esc(rule.name)}</b>？
        已完成的评估报告不会受影响，删除后该规则不再参与后续评估。</div>`,
      okText: '删除', danger: true,
      onOk: async () => {
        try {
          await API.del('/api/eval-rules/' + id);
          await loadRules(page);
          render(page);
          UI.toast('规则已删除');
        } catch (err) {
          UI.toast('删除失败：' + err.message, 'err');
          return false;
        }
      }
    });
  }

  /* ================================================================ 导出 */
  function runExport(page, eid, fmt, btn) {
    const f = FMT[fmt] || { name: String(fmt || '').toUpperCase() };
    if (btn) btn.disabled = true;
    return API.get('/api/evals/' + eid + '/export', { fmt: fmt })
      .then((r) => {
        UI.toast(f.name + ' 报告已生成（' + (r.size || '—') + '），正在打开下载');
        if (r.url) window.open(UI.safeHref(r.url), '_blank', 'noopener');
      })
      .catch((err) => UI.toast('导出失败：' + err.message, 'err'))
      .then(() => { if (btn) btn.disabled = false; });
  }
  function openExportMenu(page, eid) {
    const e = page.state.evals.find((x) => String(x.id) === String(eid));
    const d = UI.drawer({
      title: '导出评估报告',
      sub: e ? UI.esc(e.name) + ' · ' + UI.esc(e.no || '#' + e.id) : '#' + eid,
      body: `<div class="ev-fmt-pick"><div class="ev-fmt">${Object.keys(FMT).map((k) => `<button class="ev-fmt-i" data-fmt="${k}">
        <span class="ev-fmt-ic" style="background:${FMT[k].color}14;color:${FMT[k].color}">${FMT[k].name}</span>
        <span style="flex:1;min-width:0"><b>导出为 ${FMT[k].name}</b><span class="ev-fmt-d">${FMT[k].desc}</span></span>
        <span class="ev-fmt-go">${icon('download', 14)}</span></button>`).join('')}</div></div>`,
      footer: `<span class="tiny muted">报告由评估服务生成，文件保存在 /api/download/ 目录</span>`
    });
    d.el.classList.add('pg-e');
    d.el.querySelectorAll('[data-fmt]').forEach((b) => {
      b.onclick = () => { runExport(page, eid, b.getAttribute('data-fmt'), b); };
    });
  }

  /* ================================================================ 行为层 */
  async function openReport(page, id, focus) {
    const s = page.state;
    stopTimer(page, 'logs');
    s.focusRid = focus || '';
    s.view = 'report';
    s.rid = Number(id);
    const rid = s.rid;
    s.reportError = '';
    s.logs = null;
    s.multi = null;
    render(page);
    try {
      await loadReport(page, s.rid);
    } catch (err) {
      s.reportError = err.message;
    }
    try {
      const m = await API.get('/api/evals/' + s.rid + '/multi');
      if (!page.alive || s.rid !== rid) return;
      s.multi = { items: m.items || [], metrics: m.metrics || {}, personas: m.personas || [] };
      if (!s.multiPersona && s.multi.personas.length) s.multiPersona = s.multi.personas[0];
    } catch (err) {
      s.multi = { items: [], metrics: {}, personas: [] };
    }
    if (!page.alive) return;
    startLogPoll(page);
    render(page);
    window.scrollTo({ top: 0 });
    focusFinding(page);
  }

  function focusFinding(page) {
    const s = page.state;
    const key = String(s.focusRid || '');
    if (!key) return;
    s.focusRid = '';
    const r = s.reports[s.rid] || {};
    const idx = (r.findings || []).findIndex((f) => String(f.risk_id) === key);
    if (idx < 0) return;
    const el = document.getElementById('evf-' + s.rid + '-' + idx);
    if (!el) return;
    el.scrollIntoView({ block: 'center' });
    el.classList.add('hl');
    setTimeout(() => el.classList.remove('hl'), 2600);
  }
  function backToList(page) {
    const s = page.state;
    stopTimer(page, 'logs');
    s.logs = null;
    s.multi = null;
    s.view = 'list';
    s.rid = null;
    s.reportError = '';
    render(page);
    window.scrollTo({ top: 0 });
  }
  async function switchTab(page, tab) {
    const s = page.state;
    if (s.tab === tab && s.view === 'list') return;
    if (tab === 'rules' && !s.rulesLoaded) {
      try { await loadRules(page); } catch (err) { UI.toast('规则加载失败：' + err.message, 'err'); return; }
    }
    if (tab === 'bench' && !s.bench) {
      try { await loadBench(page); } catch (err) { /* 视图内展示错误 */ }
    }
    s.tab = tab;
    s.view = 'list';
    render(page);
  }
  async function loadBench(page, force) {
    const s = page.state;
    if (s.bench && !force) return s.bench;
    s.benchError = '';
    try {
      s.bench = await API.get('/api/evals/benchmark');
    } catch (err) {
      s.benchError = err.message;
      s.bench = null;
    }
    return s.bench;
  }
  async function runBench(page, btn) {
    if (btn) btn.disabled = true;
    try {
      await API.post('/api/evals/benchmark/run', { samples: 200 });
      await loadBench(page, true);
      render(page);
      UI.toast('基准已重新计算');
    } catch (err) {
      UI.toast('重算失败：' + err.message, 'err');
    } finally {
      if (btn) btn.isConnected && (btn.disabled = false);
    }
  }
  async function runSim(page) {
    const s = page.state;
    const p = page.root.querySelector('#mt-persona');
    const t = page.root.querySelector('#mt-turns');
    const persona = p ? p.value : (s.multiPersona || '恶意用户');
    const turns = t ? Number(t.value) : (s.multiTurns || 6);
    s.multiLoading = true;
    s.multiPersona = persona;
    s.multiTurns = turns;
    patchMulti(page);
    try {
      const res = await API.post('/api/evals/' + s.rid + '/simulate', { persona: persona, turns: turns });
      s.multi = { items: res.items || [], metrics: res.metrics || {}, personas: (s.multi && s.multi.personas) || [] };
      UI.toast('多轮模拟完成：' + (res.items || []).length + ' 轮对话');
    } catch (err) {
      UI.toast('模拟失败：' + err.message, 'err');
    }
    s.multiLoading = false;
    patchMulti(page);
  }
  async function refreshLogs(page, btn) {
    const s = page.state;
    if (!s.logs) startLogPoll(page);
    if (btn) btn.disabled = true;
    try {
      const res = await API.get('/api/evals/' + s.rid + '/logs');
      if (!s.logs) s.logs = { items: [], loading: false, timer: null };
      s.logs.items = res.items || [];
      s.logs.loading = false;
      const box = page.root.querySelector('#ev-log-box');
      if (box) { box.innerHTML = logRows(page); box.scrollTop = box.scrollHeight; }
      const c = page.root.querySelector('#ev-log-count');
      if (c) c.textContent = '每 3 秒增量拉取 · 已获取 ' + s.logs.items.length + ' 条';
    } catch (err) {
      UI.toast('日志读取失败：' + err.message, 'err');
    } finally {
      if (btn) btn.disabled = false;
    }
  }
  function startLogPoll(page) {
    const s = page.state;
    stopTimer(page, 'logs');
    const e = s.evalById[s.rid] || s.evals.find((x) => String(x.id) === String(s.rid));
    if (!e || !isRunning(e)) { s.logs = null; return; }
    s.logs = { items: [], loading: true, timer: null };
    const tick = async () => {
      if (!page.alive || s.view !== 'report' || !s.logs) return;
      let items;
      try {
        items = (await API.get('/api/evals/' + s.rid + '/logs')).items || [];
      } catch (err) {
        return;
      }
      if (!page.alive || !s.logs) return;
      const grew = items.length > s.logs.items.length;
      s.logs.loading = false;
      if (!grew) {
        if (!items.length) {
          const box0 = page.root.querySelector('#ev-log-box');
          if (box0) box0.innerHTML = logRows(page);
        }
        return;
      }
      s.logs.items = items;
      const box = page.root.querySelector('#ev-log-box');
      if (!box) return;
      const stick = box.scrollHeight - box.scrollTop - box.clientHeight < 48;
      box.innerHTML = logRows(page);
      if (stick) box.scrollTop = box.scrollHeight;
      const c = page.root.querySelector('#ev-log-count');
      if (c) c.textContent = '每 3 秒增量拉取 · 已获取 ' + items.length + ' 条';
    };
    tick();
    s.logs.timer = setInterval(tick, 3000);
    page.timers.logs = s.logs.timer;
  }
  async function listTick(page) {
    const s = page.state;
    if (!page.alive) return;
    if (isEditing(page.root)) return;
    let items;
    try {
      items = (await API.get('/api/evals')).items || [];
    } catch (err) {
      return;
    }
    if (!page.alive) return;
    if (signature(items) === signature(s.evals)) {
      if (s.view === 'report') syncRunBar(page);
      return;
    }
    s.evals = sortedEvals(items);
    if (s.view === 'list') {
      if (s.tab === 'tasks') { patchListRows(page); refreshDerived(page); }
      return;
    }
    const e = s.evals.find((x) => String(x.id) === String(s.rid));
    const prev = s.evalById[s.rid];
    s.evalById[s.rid] = e;
    if (e && (!prev || e.status !== prev.status)) {
      await loadReport(page, s.rid).catch(() => null);
      if (!isRunning(e)) {
        stopTimer(page, 'logs');
        s.logs = null;
      } else {
        startLogPoll(page);
      }
      if (page.alive) render(page);
      return;
    }
    syncRunBar(page);
  }
  function syncRunBar(page) {
    const s = page.state;
    const e = s.evalById[s.rid];
    if (!e) return;
    const pct = pctOf(e);
    const lbl = page.root.querySelector('#ev-run-pct');
    if (lbl) lbl.textContent = pct + '%';
    const bar = page.root.querySelector('#ev-run-bar i');
    if (bar) bar.style.width = Math.max(2, pct) + '%';
    const kv = page.root.querySelector('#ev-kv-pct');
    if (kv) kv.textContent = pct + '%';
  }
  async function refreshAll(page, btn) {
    const s = page.state;
    if (btn) btn.disabled = true;
    try {
      await loadEvals(page);
      if (s.tab === 'rules' && s.view === 'list') { await loadRules(page); }
      if (s.tab === 'bench' && s.view === 'list') { await loadBench(page, true); }
      if (s.view === 'report') { await loadReport(page, s.rid).catch(() => null); }
      await prefetchReports(page);
      if (s.view === 'list' && s.tab === 'tasks') { patchListRows(page); refreshDerived(page); }
      render(page);
      UI.toast('数据已刷新');
    } catch (err) {
      UI.toast('刷新失败：' + err.message, 'err');
    } finally {
      if (btn) btn.disabled = false;
    }
  }
  function patchListRows(page) {
    const root = page.root;
    const s = page.state;
    const box = root.querySelector('#ev-rows');
    if (!box) return;
    const rows = filteredEvals(page);
    box.innerHTML = listTable(page, rows);
    const c = root.querySelector('#ev-count');
    if (c) c.textContent = `共 ${s.evals.length} 个任务 · 当前筛选 ${rows.length} 个`;
  }
  function patchRuleRows(page) {
    const root = page.root;
    const s = page.state;
    const box = root.querySelector('#ev-rule-rows');
    if (!box) return;
    box.innerHTML = rulesTable(page);
    const charts = root.querySelector('#ev-rule-charts');
    if (charts) { charts.innerHTML = rulesCharts(page); }
  }
  function patchMulti(page) {
    const box = page.root.querySelector('#ev-multi');
    if (!box) return;
    box.innerHTML = multiCard(page);
    bindMulti(page);
  }
  function refreshDerived(page) {
    const root = page.root;
    const arc = root.querySelector('#ev-arch');
    if (arc) arc.innerHTML = archiveSection(page);
    const rem = root.querySelector('#ev-rem');
    if (rem) rem.innerHTML = remediationCard(page);
    const fl = root.querySelector('#ev-flow');
    if (fl) fl.innerHTML = flowCard(page);
    bindDerived(page);
  }

  /* ================================================================ 渲染与绑定 */
  function listView(page) {
    const s = page.state;
    const actions = s.tab === 'rules'
      ? `<button class="btn" data-refresh>${icon('refresh', 14)}刷新</button>
         <button class="btn primary" data-new-rule>${icon('plus', 14)}新建规则</button>`
      : s.tab === 'bench'
        ? `<button class="btn" data-refresh>${icon('refresh', 14)}刷新</button>
           <button class="btn primary" data-bench-run>${icon('bolt', 14)}重新计算</button>`
        : `<button class="btn" data-refresh>${icon('refresh', 14)}刷新</button>
           <button class="btn primary" data-new>${icon('plus', 14)}新建评估</button>`;
    const body = s.tab === 'rules'
      ? rulesView(page)
      : s.tab === 'bench'
        ? benchView(page)
        : `${kpiRow(page)}
            ${focusBanner(page)}
            ${tasksCard(page)}
            <div id="ev-arch">${archiveSection(page)}</div>
            <div id="ev-rem">${remediationCard(page)}</div>
            <div id="ev-flow">${flowCard(page)}</div>`;
    return `<div class="stack">
      ${UI.pageHd({
        title: '评估中心',
        sub: '3.7.2 评估流程 · 实时日志 · 热力下钻 · 多轮模拟 / 3.11 评估报告 / 3.6 自定义规则',
        actions: actions
      })}
      ${UI.tabs([
        { v: 'tasks', t: '评估任务<span class="ev-tab-n">' + s.evals.length + '</span>' },
        { v: 'rules', t: '评估规则<span class="ev-tab-n">' + (s.rulesLoaded ? s.rules.length : '…') + '</span>' },
        { v: 'bench', t: '横向基准' }
      ], s.tab)}
      ${body}
    </div>`;
  }
  function render(page) {
    if (!page.root) return;
    page.root.innerHTML = `<div class="pg-e">${page.state.view === 'report' ? reportView(page) : listView(page)}</div>`;
    bind(page);
  }
  function bindDerived(page) {
    page.root.querySelectorAll('.ev-arc[data-eid], .ev-fix-r[data-eid]').forEach((el) => {
      el.onclick = (ev) => {
        if (ev.target.closest('button')) return;
        openReport(page, el.getAttribute('data-eid'), el.getAttribute('data-fid'));
      };
    });
  }
  function bindMulti(page) {
    page.root.querySelectorAll('[data-sim]').forEach((b) => { b.onclick = () => runSim(page); });
  }
  function bindList(page) {
    const root = page.root;
    const s = page.state;
    const q = root.querySelector('#ev-q');
    if (q) {
      q.value = s.q;
      q.oninput = () => { s.q = q.value; patchListRows(page); };
    }
    const box = root.querySelector('#ev-rows');
    if (box) {
      box.onclick = (ev) => {
        const exp = ev.target.closest('[data-exp]');
        if (exp) { ev.stopPropagation(); openExportMenu(page, exp.getAttribute('data-exp')); return; }
        const tr = ev.target.closest('tr[data-i]');
        if (!tr) return;
        const rows = filteredEvals(page);
        const item = rows[Number(tr.getAttribute('data-i'))];
        if (item) openReport(page, item.id);
      };
    }
    bindDerived(page);
  }
  function bindRules(page) {
    const root = page.root;
    const s = page.state;
    const q = root.querySelector('#ev-rule-q');
    if (q) {
      q.value = s.ruleQ;
      q.oninput = () => { s.ruleQ = q.value; patchRuleRows(page); };
    }
    root.querySelectorAll('[data-rseg]').forEach((b) => {
      b.onclick = () => {
        s.ruleMode = b.getAttribute('data-rseg');
        root.querySelectorAll('[data-rseg]').forEach((x) => x.classList.toggle('on', x === b));
        patchRuleRows(page);
      };
    });
    const box = root.querySelector('#ev-rule-rows');
    if (box) {
      box.onclick = (ev) => {
        const btn = ev.target.closest('button');
        if (btn) {
          const del = btn.getAttribute('data-rule-del');
          const use = btn.getAttribute('data-rule-use');
          const edit = btn.getAttribute('data-rule-edit');
          if (del) { deleteRule(page, del); return; }
          if (use) { openNew(page, Number(use)); return; }
          if (edit) {
            const rule = s.rules.find((r) => String(r.id) === String(edit));
            if (rule) openRule(page, rule);
            return;
          }
          return;
        }
        const tr = ev.target.closest('tr[data-i]');
        if (!tr) return;
        const rows = filteredRules(page);
        const rule = rows[Number(tr.getAttribute('data-i'))];
        if (rule) openRule(page, rule);
      };
    }
  }
  function bindReport(page) {
    const root = page.root;
    root.querySelectorAll('[data-heat]').forEach((b) => {
      b.onclick = () => {
        const raw = b.getAttribute('data-heat').split('|');
        const ci = Number(raw.pop());
        openDrill(page, raw.join('|'), ci);
      };
    });
    bindMulti(page);
  }
  function bind(page) {
    const root = page.root;
    if (!root) return;
    const s = page.state;
    root.querySelectorAll('[data-new]').forEach((b) => { b.onclick = () => openNew(page); });
    root.querySelectorAll('[data-new-rule]').forEach((b) => { b.onclick = () => openRule(page, null); });
    root.querySelectorAll('[data-refresh]').forEach((b) => { b.onclick = () => refreshAll(page, b); });
    root.querySelectorAll('[data-tab]').forEach((b) => {
      b.onclick = () => { switchTab(page, b.getAttribute('data-tab')); };
    });
    root.querySelectorAll('[data-back]').forEach((b) => { b.onclick = () => backToList(page); });
    root.querySelectorAll('[data-retry]').forEach((b) => { b.onclick = () => openReport(page, s.rid); });
    root.querySelectorAll('[data-focus-x]').forEach((b) => {
      b.onclick = () => { s.focusId = null; render(page); };
    });
    root.querySelectorAll('[data-focus-go]').forEach((b) => {
      b.onclick = () => openReport(page, b.getAttribute('data-focus-go'));
    });
    root.querySelectorAll('[data-export]').forEach((b) => {
      b.onclick = () => runExport(page, b.getAttribute('data-export'), b.getAttribute('data-fmt'), b);
    });
    root.querySelectorAll('[data-bench-run]').forEach((b) => { b.onclick = () => runBench(page, b); });
    root.querySelectorAll('[data-log-refresh]').forEach((b) => { b.onclick = () => refreshLogs(page, b); });
    root.querySelectorAll('.seg [data-seg]').forEach((b) => {
      b.onclick = () => {
        s.mode = b.getAttribute('data-seg');
        root.querySelectorAll('.seg [data-seg]').forEach((x) => {
          x.classList.toggle('on', x === b);
        });
        patchListRows(page);
      };
    });
    if (s.view === 'report') bindReport(page);
    else if (s.tab === 'rules') bindRules(page);
    else if (s.tab === 'tasks') bindList(page);
  }

  /* ================================================================ 挂载 */
  async function mount(root) {
    if (!document.getElementById('pg-evals')) {
      const st = document.createElement('style');
      st.id = 'pg-evals';
      st.textContent = STYLE;
      document.head.appendChild(st);
    }
    root.innerHTML = `<div class="pg-e">${UI.skel(4)}</div>`;
    const page = {
      root: root,
      alive: true,
      timers: {},
      state: {
        view: 'list', tab: 'tasks', rid: null,
        mode: '全部', q: '', ruleMode: '全部', ruleQ: '',
        evals: [], models: [], rules: [], ruleStat: null, ruleByMode: [], ruleByCat: [],
        reports: {}, evalById: {}, reportsReady: false, allFindings: [],
        itemsCache: {}, logs: null, bench: null, benchError: '',
        multi: null, multiPersona: '', multiTurns: 6, multiLoading: false,
        focusId: null, lastRules: 0, reportError: ''
      }
    };
    try {
      await Promise.all([loadEvals(page), loadModels(page), loadRules(page).catch(() => null)]);
    } catch (err) {
      root.innerHTML = `<div class="pg-e"><div class="card pad">${UI.note('加载评估数据失败：' + esc(err.message), 'warn')}</div></div>`;
      return () => {};
    }
    if (!page.alive) return () => {};
    render(page);
    prefetchReports(page).then(() => {
      if (page.alive && page.state.view === 'list' && page.state.tab === 'tasks') refreshDerived(page);
    }).catch(() => null);
    page.timers.list = setInterval(() => { listTick(page); }, 6000);
    return () => {
      page.alive = false;
      stopTimer(page, 'logs');
      if (page.timers.list) clearInterval(page.timers.list);
    };
  }

  w.Pages['evals'] = { cockpit: false, mount: mount };
})(window);
