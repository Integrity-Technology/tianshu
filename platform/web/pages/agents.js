/* ============================================================================
   攻击智能体：智能体列表 / 技能 · MCP · 样本库 / 战术编排 / 复合攻击链
   ========================================================================== */
(function (w) {
  const { UI, API, Charts, icon, esc } = w;
  const AVA = ['#2C55E6', '#6B47E8', '#0E9DB3', '#0B9E6E', '#C97C10', '#D93B3B', '#3F5BB8'];
  const KINDS = ['代码上传', '模板导入', 'git 同步'];
  const TACTICS = ['诱导', '编码混淆', '分片拼接', '多轮渐进', '语境渐变', '角色扮演',
    '工具诱导', '上下文劫持', '终止判定'];
  const TACTIC_DESC = {
    '诱导': '以合规、调试等话术引导模型突破限制',
    '编码混淆': 'base64 / unicode / 序号编码后再提交',
    '分片拼接': '载荷切片分多轮投递，最后拼接执行',
    '多轮渐进': '逐轮放宽请求强度，观察拒答率变化',
    '语境渐变': '长对话中逐步漂移上下文目标',
    '角色扮演': '设定虚构身份或场景，规避安全策略',
    '工具诱导': '诱导智能体调用高危工具链',
    '上下文劫持': '污染检索或记忆内容，覆盖原始指令',
    '终止判定': '命中终止条件即停，保留完整证据链'
  };
  const STEP_TYPE = {
    thought: '思考', action: '行动', observation: '观察', observe: '观察', judge: '判定',
    verdict: '判定', info: '信息', tool: '工具调用', error: '异常', risk: '风险判定'
  };
  const LEVEL_TXT = { info: '信息', low: '低', mid: '中', high: '高', warn: '中', risk: '高', error: '高' };
  const STATUS_COLOR = {
    '运行中': '#2C55E6', '已完成': '#0B9E6E', '排队中': '#C97C10',
    '已终止': '#D93B3B', '已暂停': '#C97C10', '在线': '#0B9E6E', '启用': '#0B9E6E'
  };
  const KIND_META = {
    '代码上传': { ic: 'download', bg: '#EDF1FE', fg: '#2C55E6' },
    '模板导入': { ic: 'sample', bg: '#F1EDFE', fg: '#6B47E8' },
    'git 同步': { ic: 'open', bg: '#E8F6F9', fg: '#0E9DB3' }
  };
  const TP_META = {
    HTTP: { cls: '', bg: '#EDF1FE', fg: '#2C55E6' },
    SSE: { cls: 'sse', bg: '#F1EDFE', fg: '#6B47E8' },
    STDIO: { cls: 'stdio', bg: '#E8F6F9', fg: '#0E9DB3' }
  };
  const LAYERS = new Set();
  let chainUid = 0;

  const STYLE = `
  /* 智能体列表 */
  .ag-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
  @media(max-width:1460px){.ag-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
  .ag{background:var(--surface);border:1px solid var(--line);border-radius:var(--r-lg);box-shadow:var(--sh-1);
    display:flex;flex-direction:column;min-width:0;transition:box-shadow .18s var(--ease),transform .18s var(--ease),border-color .18s}
  .ag:hover{box-shadow:var(--sh-2);transform:translateY(-2px);border-color:#D6DCE8}
  .ag-hd{display:flex;align-items:flex-start;gap:10px;padding:15px 16px 0}
  .ag-ava{width:36px;height:36px;border-radius:11px;display:grid;place-items:center;color:#fff;
    font-size:12.5px;font-weight:700;letter-spacing:.02em;flex:0 0 36px}
  .ag-nm{font-size:13.5px;font-weight:640;letter-spacing:-.015em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .ag-sc{display:flex;align-items:center;gap:5px;font-size:11px;color:var(--text-3);margin-top:2px}
  .ag-badge{font-size:9.5px;font-weight:600;padding:1px 5px;border-radius:4px;background:var(--brand-050);
    color:var(--brand-600);white-space:nowrap}
  .ag-badge.own{background:var(--violet-bg);color:var(--violet)}
  .ag-ds{padding:10px 16px 0;font-size:11.8px;line-height:1.65;color:var(--text-2);
    display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;height:39px}
  .ag-res{display:flex;align-items:center;gap:14px;padding:9px 16px 0;font-size:10.5px;color:var(--text-3)}
  .ag-res span{display:inline-flex;align-items:center;gap:4px;white-space:nowrap}
  .ag-res b{color:var(--text);font-weight:600;font-size:11px}
  .ag-res .ic{width:12px;height:12px;display:block;opacity:.65}
  .ag-chips{display:flex;flex-wrap:wrap;align-content:flex-start;gap:5px;padding:8px 16px 0;height:49px;overflow:hidden}
  .ag-chip{font-size:10.5px;padding:2px 7px;border-radius:5px;background:#F2F5FA;color:#5A6478;
    font-family:var(--mono);border:1px solid #E7ECF4;white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis}
  .ag-chip.mcp{background:var(--violet-bg);color:#5B3BC4;border-color:#E5DDFB}
  .ag-chip.tac{background:#FBF5EA;color:#8A5A12;border-color:#F0E2C7;font-family:var(--font)}
  .ag-chip.more{font-family:var(--font);color:var(--text-3)}
  .ag-chip.empty{font-family:var(--font);color:var(--text-3);background:#F7F8FB}
  .ag-mt{display:grid;grid-template-columns:1.25fr 1fr 1fr;gap:0;margin:12px 16px 0;padding-top:10px;border-top:1px solid var(--line-2)}
  .ag-mt .m{text-align:center;border-right:1px solid var(--line-2);min-width:0;padding:0 4px}
  .ag-mt .m:first-child{text-align:left}
  .ag-mt .m:last-child{border-right:0;text-align:right}
  .ag-mt .m span{display:block;font-size:10px;color:var(--text-3);margin-bottom:2px}
  .ag-mt .m b{font-size:14px;font-weight:650;letter-spacing:-.02em;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .ag-ft{display:flex;gap:5px;padding:12px 16px 15px;margin-top:auto}
  .ag-ft .btn{flex:1;justify-content:center;font-size:11px;height:28px;padding:0 3px;min-width:0;gap:4px}
  .ag-ft .btn .ic{width:12px;height:12px;flex:0 0 12px}

  /* 抽屉通用 */
  .dr-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:16px}
  .dr-stat{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:11px 13px;min-width:0}
  .dr-stat span{display:block;font-size:11px;color:var(--text-3)}
  .dr-stat b{display:block;font-size:20px;font-weight:650;letter-spacing:-.03em;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .dr-stat b small{font-size:11px;font-weight:500;color:var(--text-3);margin-left:3px;letter-spacing:0}
  .dr-sec{background:var(--surface);border:1px solid var(--line);border-radius:var(--r-lg);padding:14px 16px 16px;margin-bottom:14px}
  .dr-sec:last-child{margin-bottom:0}
  .dr-hd{display:flex;align-items:center;gap:8px;font-size:12.5px;font-weight:600;letter-spacing:-.01em;margin-bottom:11px}
  .dr-hd .dim{font-weight:400;font-size:11px}
  .dr-hint{font-size:11px;color:var(--text-3);line-height:1.6}
  .dr-2col{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  @media(max-width:720px){.dr-2col{grid-template-columns:1fr}}
  .kv2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .kv2 .kv{min-width:0}
  .kv2 .kv b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

  /* 资源挂载 */
  .res-tabs{padding:0 16px}
  .res-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px;
    flex-wrap:wrap;border-bottom:1px solid var(--line-2)}
  .res-bar .rg{display:flex;align-items:center;gap:12px;font-size:11.5px;color:var(--text-3);flex-wrap:wrap}
  .res-bar .rg b{color:var(--text);font-weight:600}
  .res-row{padding:13px 16px;border-bottom:1px solid var(--line-2)}
  .res-row:last-child{border-bottom:0}
  .rr-hd{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
  .rr-nm{font-size:12.8px;font-weight:600;letter-spacing:-.01em;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .tp{font-size:9.5px;font-weight:700;font-family:var(--mono);padding:2px 6px;border-radius:5px;
    background:var(--brand-050);color:var(--brand-600);letter-spacing:.02em}
  .tp.sse{background:var(--violet-bg);color:var(--violet)}
  .tp.stdio{background:#E8F6F9;color:#0E9DB3}
  .rr-tools{font-size:10.5px;color:var(--text-3)}
  .rr-acts{margin-left:auto;display:flex;gap:6px;flex-wrap:wrap}
  .rr-acts .btn{height:26px;padding:0 9px;font-size:11px}
  .rr-ep{font-family:var(--mono);font-size:10.5px;color:var(--text-2);margin-top:5px;word-break:break-all}
  .rr-metas{display:flex;gap:14px;flex-wrap:wrap;font-size:10.5px;color:var(--text-3);margin-top:5px}
  .rr-metas b{color:var(--text-2);font-weight:550}
  .rr-ds{font-size:11.5px;color:var(--text-2);margin-top:6px;line-height:1.55}
  .mp-res{margin-top:10px;border-radius:10px;background:var(--surface-2);border:1px solid var(--line-2);padding:10px 12px}
  .mp-res+.mp-res{margin-top:8px}
  .mp-res.hi{background:#FFF7F7;border-color:#F6D5D5}
  .mp-rh{display:flex;align-items:center;gap:8px;font-size:11.5px;font-weight:600;flex-wrap:wrap}
  .mp-rh .dim{font-weight:400;margin-left:auto;font-size:10.5px}
  .mp-hits{display:flex;flex-wrap:wrap;gap:5px;margin-top:7px}
  .mp-hit{font-size:10px;font-family:var(--mono);padding:1px 6px;border-radius:4px;background:var(--danger-bg);color:var(--danger)}
  .mp-line{font-size:11px;color:var(--text-2);margin-top:6px;line-height:1.65;word-break:break-word}
  .mp-tools{margin-top:7px;display:flex;flex-direction:column;gap:4px}
  .mp-tool{display:flex;gap:8px;font-size:11px;min-width:0}
  .mp-tool .n{font-family:var(--mono);color:var(--text);font-weight:550;flex:0 0 auto}
  .mp-tool .d{color:var(--text-3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .mp-err{font-family:var(--mono);font-size:10.5px;color:var(--danger);margin-top:6px;word-break:break-all;line-height:1.6}
  .mp-wait{font-size:10.5px;color:var(--text-3);margin-top:6px}

  /* 技能行 */
  .sk-row{display:flex;align-items:flex-start;gap:11px;padding:12px 16px;border-bottom:1px solid var(--line-2)}
  .sk-row:last-child{border-bottom:0}
  .sk-ic{width:32px;height:32px;border-radius:9px;display:grid;place-items:center;flex:0 0 32px;background:var(--brand-050);color:var(--brand)}
  .sk-main{flex:1;min-width:0}
  .sk-nm{display:flex;align-items:center;gap:7px;flex-wrap:wrap;font-size:12.5px;font-weight:560;letter-spacing:-.01em}
  .sk-kind{font-size:10px;font-weight:500;color:var(--text-2);background:#F1F3F7;border-radius:5px;padding:1px 6px}
  .sk-ds{font-size:11.5px;color:var(--text-2);line-height:1.55;margin-top:3px}
  .sk-meta{display:flex;align-items:center;gap:12px;flex-wrap:wrap;font-size:10.5px;color:var(--text-3);margin-top:5px}
  .sk-meta .mono{font-size:10.5px;color:var(--text-2)}
  .sk-file{display:flex;align-items:center;gap:11px;border:1px dashed #C9D3E6;border-radius:10px;
    padding:11px 12px;background:#FAFBFE;margin-bottom:10px}
  .sk-file .sk-fic{width:32px;height:32px;flex:0 0 32px;border-radius:9px;background:var(--brand-050);
    color:var(--brand);display:grid;place-items:center}
  .sk-file .t{font-size:12px;font-weight:550}
  .sk-file .s{font-size:10.5px;color:var(--text-3);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

  /* 样本库 */
  .sl-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;padding:14px 16px 16px}
  @media(max-width:1240px){.sl-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
  .sl{border:1px solid var(--line);border-radius:12px;padding:13px 14px;background:var(--surface);
    display:flex;flex-direction:column;gap:6px;min-width:0}
  .sl-hd{display:flex;align-items:center;gap:7px;min-width:0}
  .sl-nm{font-size:12.8px;font-weight:600;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .sl-cat{font-size:10.5px;color:var(--text-3)}
  .sl-ds{font-size:11.5px;color:var(--text-2);line-height:1.6;display:-webkit-box;-webkit-line-clamp:2;
    -webkit-box-orient:vertical;overflow:hidden;height:37px}
  .sl-tags{display:flex;gap:4px;flex-wrap:wrap;height:19px;overflow:hidden}
  .sl-tag{font-size:10px;padding:1px 6px;border-radius:4px;background:#F2F5FA;color:var(--text-2);white-space:nowrap}
  .sl-ft{display:flex;align-items:center;gap:8px;margin-top:auto;padding-top:9px;border-top:1px solid var(--line-2)}
  .sl-n{font-size:20px;font-weight:650;letter-spacing:-.03em}
  .sl-n span{font-size:10.5px;color:var(--text-3);font-weight:500;margin-left:3px;letter-spacing:0}
  .sl-ft .dim{margin-left:auto;font-size:10px}

  /* 聊天 */
  .drawer-bd.chat-host{display:flex;flex-direction:column;padding:0;overflow:hidden}
  .chat{display:flex;flex-direction:column;height:100%;min-height:0}
  .chat-hint{padding:12px 20px 0;font-size:10.5px;color:var(--text-3);text-align:center;line-height:1.6}
  .chat .chat-body{flex:1;overflow:auto;padding:12px 20px 14px;display:flex;flex-direction:column;gap:12px;min-height:0}
  .chat .msg{display:flex;gap:8px;max-width:90%}
  .chat .msg .bub{padding:9px 12px;border-radius:12px;font-size:12.5px;line-height:1.6;white-space:pre-wrap;word-break:break-word}
  .chat .msg.u{align-self:flex-end;flex-direction:row-reverse}
  .chat .msg.u .bub{background:var(--brand);color:#fff;border-bottom-right-radius:4px}
  .chat .msg.a .bub{background:#F3F5F9;color:var(--text);border-bottom-left-radius:4px;border:1px solid var(--line-2)}
  .chat .msg .who{font-size:10.5px;color:var(--text-3);margin-bottom:2px}
  .chat .msg.u .who{text-align:right}
  .chat-badges{display:flex;gap:5px;flex-wrap:wrap;margin-top:6px}
  .cb{font-size:10px;padding:1px 6px;border-radius:4px;background:#E9EDF6;color:#4E5A70;font-family:var(--mono)}
  .cb.danger{background:var(--danger-bg);color:var(--danger)}
  .cb.ok{background:var(--ok-bg);color:var(--ok)}
  .cb.warn{background:var(--warn-bg);color:var(--warn)}
  .chat-steps{margin-top:7px;display:flex;flex-direction:column;gap:3px;max-width:100%}
  .chat-steps div{font-size:10.5px;color:var(--text-3);line-height:1.5}
  .chat-steps b{color:var(--text-2);font-weight:600;margin-right:5px;font-family:var(--mono)}
  .chat .chat-in{display:flex;gap:8px;align-items:flex-end;border-top:1px solid var(--line);padding:12px 20px 16px;background:#fff}
  .chat .chat-in textarea{flex:1;height:40px;max-height:120px;resize:none;padding:10px 12px;border:1px solid var(--line);
    border-radius:10px;outline:none;font-size:12.5px;line-height:1.4}
  .chat .chat-in textarea:focus{border-color:var(--brand);box-shadow:0 0 0 3px rgba(44,85,230,.12)}

  /* 复合攻击链 */
  .ch-meta{display:grid;grid-template-columns:repeat(3,minmax(0,1fr)) 1.7fr;gap:10px;margin-bottom:14px}
  @media(max-width:820px){.ch-meta{grid-template-columns:repeat(3,1fr)}.ch-meta .ch-note{grid-column:1/-1}}
  .ch-note{background:var(--brand-050);border:1px solid var(--brand-100);color:#1F3CA8;border-radius:10px;
    padding:9px 11px;font-size:11px;line-height:1.6}
  .ch-wrap{display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:12px;align-items:start}
  @media(max-width:900px){.ch-wrap{grid-template-columns:minmax(0,1fr)}}
  .ch-panel{background:var(--surface);border:1px solid var(--line);border-radius:var(--r-lg);min-width:0;overflow:hidden}
  .ch-hd{display:flex;align-items:center;gap:8px;padding:11px 14px;border-bottom:1px solid var(--line-2);
    font-size:12.5px;font-weight:600;letter-spacing:-.01em}
  .ch-hd .dim{font-weight:400;font-size:10.5px}
  .ch-canvas{overflow-x:auto;overflow-y:hidden;padding:14px 10px 12px;min-height:150px}
  .ch-svg{display:block;margin:0 auto;max-width:none}
  .ch-steps{max-height:calc(100vh - 320px);overflow:auto;padding:4px 14px 12px}
  .ch-step{display:flex;gap:10px;padding:10px 0;border-bottom:1px solid var(--line-2)}
  .ch-step:last-child{border-bottom:0}
  .ch-no{flex:0 0 24px;height:24px;border-radius:7px;background:#F1F4FA;color:var(--text-2);
    font-family:var(--mono);font-size:10.5px;display:grid;place-items:center;margin-top:1px}
  .ch-step.risk .ch-no{background:var(--danger-bg);color:var(--danger)}
  .ch-step.warn .ch-no{background:var(--warn-bg);color:var(--warn)}
  .ch-sb{min-width:0;flex:1}
  .ch-sh{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
  .ch-type{font-size:11.5px;font-weight:600;color:var(--text)}
  .ch-tag{font-size:9.5px;padding:1px 6px;border-radius:4px;background:#F1F3F7;color:var(--text-3)}
  .ch-tag.risk{background:var(--danger-bg);color:var(--danger)}
  .ch-tag.warn{background:var(--warn-bg);color:var(--warn)}
  .ch-sd{font-size:11.5px;color:var(--text-2);line-height:1.65;margin-top:3px;word-break:break-word}
  .ch-empty{padding:28px 8px;text-align:center;font-size:11.5px;color:var(--text-3)}
  .ch-empty .t{color:var(--text-2);font-size:12.5px;font-weight:550;margin-bottom:4px}

  /* 战术 */
  .tc-cur{display:flex;flex-wrap:wrap;gap:6px;align-items:center;min-height:26px}
  .tc-cur .ag-chip{font-size:11px;padding:3px 8px}
  .tc-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
  @media(max-width:640px){.tc-grid{grid-template-columns:1fr}}
  .tc{position:relative;text-align:left;border:1px solid var(--line);border-radius:11px;background:var(--surface);
    padding:11px 12px;display:flex;flex-direction:column;gap:3px;transition:.16s var(--ease);cursor:pointer}
  .tc:hover{border-color:#C9D4EC;background:#FAFBFE}
  .tc.on{border-color:var(--brand);background:#F7F9FF;box-shadow:0 0 0 3px rgba(44,85,230,.08)}
  .tc-ix{font-family:var(--mono);font-size:9.5px;color:var(--text-3)}
  .tc-t{font-size:12.5px;font-weight:600;letter-spacing:-.01em}
  .tc-d{font-size:10.5px;color:var(--text-3);line-height:1.55}
  .tc-ck{position:absolute;top:10px;right:10px;width:16px;height:16px;border-radius:50%;border:1px solid #D5DCEA;
    background:#fff;color:transparent;display:grid;place-items:center}
  .tc.on .tc-ck{background:var(--brand);border-color:var(--brand);color:#fff}
  .tc.on .tc-ck .ic{stroke-width:2.6}
  .tc-res{display:none}
  .tc-kv{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}

  /* 新建智能体 */
  .na-sec{margin-bottom:12px}
  .na-lab{display:flex;align-items:center;gap:7px;font-size:12px;color:var(--text-2);font-weight:500;margin-bottom:7px}
  .na-chips{display:flex;flex-wrap:wrap;gap:6px;max-height:96px;overflow:auto}
  .na-chip{font-size:11px;padding:3px 9px;border-radius:6px;border:1px solid var(--line);background:var(--surface);
    color:var(--text-2);transition:.15s;white-space:nowrap}
  .na-chip:hover{border-color:#C9D4EC}
  .na-chip.on{background:var(--brand-050);border-color:var(--brand-100);color:var(--brand-600);font-weight:550}
  .na-err{font-size:11.5px;color:var(--danger);min-height:16px;margin-top:2px}
  .cf-err{font-size:11.5px;color:var(--danger);line-height:1.65;margin-top:10px;min-height:16px}
  .tc-plans{display:flex;flex-direction:column;gap:8px;margin-bottom:10px;max-height:214px;overflow:auto}
  .tc-plan{text-align:left;border:1px solid var(--line);border-radius:10px;background:var(--surface);
    padding:8px 10px;display:flex;flex-direction:column;gap:5px;cursor:pointer;transition:border-color .15s,background .15s;width:100%}
  .tc-plan:hover{border-color:#C9D4EC}
  .tc-plan.on{border-color:var(--brand);background:var(--brand-050)}
  .tc-plan .nm{font-size:12px;font-weight:600;display:flex;align-items:center;gap:6px;letter-spacing:-.01em}
  .tc-plan .nm .cur{font-style:normal;font-size:9.5px;font-weight:600;color:var(--brand-600);background:#fff;
    border:1px solid var(--brand-100);border-radius:20px;padding:0 6px;line-height:15px}
  .tc-plan .ch{display:flex;flex-wrap:wrap;gap:4px}
  .tc-plan .ch em{font-style:normal;font-size:10px;padding:1px 6px;border-radius:4px;background:#F2F5FA;color:#5A6478}
  .tc-plan.on .ch em{background:#fff;color:#3B5BC8}
  .tc-plan .mt{font-size:10px;color:var(--text-3);font-variant-numeric:tabular-nums}
  .tc-plan-bar{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
  .tc-plan-bar .input{flex:1;min-width:170px;height:30px;font-size:11.5px;padding:0 9px}
  .tc-tstop{display:flex;align-items:center;gap:6px;margin-bottom:11px;flex-wrap:wrap;font-size:11.5px;color:var(--text-2)}
  .tc-tstop .input{width:98px;height:28px;font-size:11.5px;padding:0 8px}
  .tc-tstop .chip{cursor:pointer}
  `;

  /* -------------------------------------------------------------- 基础工具 */
  function injectStyle() {
    let s = document.getElementById('pg-agents');
    if (!s) {
      s = document.createElement('style');
      s.id = 'pg-agents';
      document.head.appendChild(s);
    }
    s.textContent = STYLE;
  }

  function track(layer) {
    LAYERS.add(layer);
    const close = layer.close;
    layer.close = () => { LAYERS.delete(layer); close(); };
    return layer;
  }

  function clearLayers() {
    LAYERS.forEach((l) => {
      const sc = l.el && l.el.previousElementSibling;
      if (sc && sc.classList && sc.classList.contains('scrim')) sc.remove();
      if (l.el) l.el.remove();
    });
    LAYERS.clear();
  }

  const pad2 = (n) => (Number(n) < 10 ? '0' : '') + Number(n);

  function isWide(ch) {
    const c = ch.codePointAt(0);
    return (c >= 0x2E80 && c <= 0x9FFF) || (c >= 0xF900 && c <= 0xFAFF) || (c >= 0xFF00 && c <= 0xFFEF);
  }

  function charW(ch, fs) {
    return isWide(ch) ? fs : fs * 0.56;
  }

  function clip(text, maxW, fs) {
    const str = String(text == null ? '' : text);
    let width = 0;
    let out = '';
    for (const ch of str) {
      const cw = isWide(ch) ? fs : fs * 0.56;
      if (width + cw > maxW) return out + '…';
      width += cw;
      out += ch;
    }
    return out;
  }

  function wrapText(text, maxW, fs, maxLines) {
    const src = String(text == null ? '' : text).trim();
    const tokens = [];
    let buf = '';
    const pushBuf = () => { if (buf) { tokens.push(buf); buf = ''; } };
    for (const ch of src) {
      if (isWide(ch)) { pushBuf(); tokens.push(ch); }
      else if (/[A-Za-z0-9_./:+@#%&-]/.test(ch)) buf += ch;
      else { pushBuf(); tokens.push(ch); }
    }
    pushBuf();
    const lines = [];
    let line = '';
    let w = 0;
    let rest = false;
    const flush = () => {
      if (!line) return;
      lines.push(line);
      line = '';
      w = 0;
    };
    for (const tk of tokens) {
      let tw = 0;
      for (const ch of tk) tw += charW(ch, fs);
      if (w > 0 && w + tw > maxW) {
        flush();
        if (lines.length >= maxLines) { rest = true; break; }
      }
      if (tw > maxW) {
        for (const ch of tk) {
          const cw = charW(ch, fs);
          if (w > 0 && w + cw > maxW) {
            flush();
            if (lines.length >= maxLines) { rest = true; break; }
          }
          line += ch;
          w += cw;
        }
        if (rest) break;
      } else {
        line += tk;
        w += tw;
      }
    }
    if (!rest && line) lines.push(line);
    if (rest) {
      lines.length = maxLines;
      lines[maxLines - 1] = clip(lines[maxLines - 1] + '…', maxW, fs);
    }
    return lines.slice(0, maxLines);
  }

  function parseTactics(descr) {
    const text = String(descr == null ? '' : descr);
    const mark = '｜战术：';
    const idx = text.indexOf(mark);
    if (idx < 0) return { text: text, tactics: [] };
    const tail = text.slice(idx + mark.length).split(mark);
    const last = tail[tail.length - 1] || '';
    const tactics = last.split('→').map((s) => s.trim()).filter(Boolean);
    return { text: text.slice(0, idx).trim(), tactics: Array.from(new Set(tactics)) };
  }

  function confirmModal(title, msg, onYes) {
    return track(UI.modal({
      title: title,
      okText: '确认删除',
      danger: true,
      body: `<div style="font-size:12.5px;color:var(--text-2);line-height:1.75">${msg}</div>`,
      onOk: async () => {
        try { await onYes(); } catch (e) {
          UI.toast((e && e.message) || '操作失败', 'err');
          return false;
        }
      }
    }));
  }

  function dash(v) {
    return v == null || v === '' ? '—' : String(v);
  }

  function pctText(v) {
    if (v == null || v === '' || isNaN(Number(v))) return '—';
    const n = Math.round(Number(v) * 10) / 10;
    return n + '%';
  }

  function asrTone(v) {
    const n = Number(v) || 0;
    return n >= 40 ? 'var(--danger)' : n >= 20 ? 'var(--warn)' : 'var(--ok)';
  }

  function fmtSize(v) {
    if (v == null || v === '') return '—';
    if (typeof v === 'string' && /[A-Za-z]/.test(v)) return v;
    const b = Number(v);
    if (isNaN(b)) return String(v);
    if (b < 1024) return b + ' B';
    if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1024 / 1024).toFixed(2) + ' MB';
  }

  function splitTags(t) {
    if (Array.isArray(t)) return t.filter(Boolean);
    return String(t == null ? '' : t).split(/[,，、|/]/).map((s) => s.trim()).filter(Boolean);
  }

  function kvItem(k, v) {
    return `<div class="kv"><span>${esc(k)}</span><b title="${esc(dash(v))}">${esc(dash(v))}</b></div>`;
  }

  /* ------------------------------------------------------------ 对话测试 */
  function chatDrawer(a) {
    const d = track(UI.drawer({
      title: esc(a.name) + ' · 对话测试',
      sub: `场景 ${esc(a.scenario || '—')} · 绑定模型 ${esc(a.model || '—')}`,
      body: `
        <div class="chat">
          <div class="chat-hint" id="chat-hint">调用 POST /api/agents/${a.id}/chat 获取真实回复 · Enter 发送 / Shift+Enter 换行</div>
          <div class="chat-body" id="chat-body"></div>
          <div class="chat-in">
            <textarea id="chat-in" placeholder="输入测试消息，验证该智能体的攻击编排与响应…"></textarea>
            <button class="btn primary" id="chat-send">${icon('play', 14)}发送</button>
          </div>
        </div>`,
      width: '640px'
    }));
    d.body.classList.add('chat-host');

    const box = d.body.querySelector('#chat-body');
    const ta = d.body.querySelector('#chat-in');
    const sendBtn = d.body.querySelector('#chat-send');
    const hint = d.body.querySelector('#chat-hint');
    let turns = 0;

    function push(role, text, who, badges, steps) {
      const wrap = document.createElement('div');
      wrap.className = 'msg ' + role;
      const inner = document.createElement('div');
      inner.style.cssText = 'display:flex;flex-direction:column;gap:3px;min-width:0;align-items:'
        + (role === 'u' ? 'flex-end' : 'flex-start');
      const w = document.createElement('div');
      w.className = 'who';
      w.textContent = who;
      const bub = document.createElement('div');
      bub.className = 'bub';
      bub.textContent = text;
      inner.appendChild(w);
      inner.appendChild(bub);
      if (badges && badges.length) {
        const bs = document.createElement('div');
        bs.className = 'chat-badges';
        badges.forEach((b) => {
          const item = typeof b === 'string' ? { t: b } : (b || {});
          const s = document.createElement('span');
          s.className = 'cb' + (item.cls ? ' ' + item.cls : '');
          s.textContent = item.t || '';
          bs.appendChild(s);
        });
        inner.appendChild(bs);
      }
      if (steps && steps.length) {
        const sl = document.createElement('div');
        sl.className = 'chat-steps';
        steps.forEach((step, i) => {
          const row = document.createElement('div');
          const ix = document.createElement('b');
          ix.textContent = pad2(i + 1);
          row.appendChild(ix);
          row.appendChild(document.createTextNode(String(step)));
          sl.appendChild(row);
        });
        inner.appendChild(sl);
      }
      wrap.appendChild(inner);
      box.appendChild(wrap);
      box.scrollTop = box.scrollHeight;
      return wrap;
    }

    const LABELS = {
      leaked: '泄露', blocked: '拦截', refused: '拒答',
      harmful: '有害输出', rag_hit: '检索命中', pass: '未突破'
    };
    const LABEL_TONE = {
      leaked: 'danger', harmful: 'danger', blocked: 'ok', refused: 'ok',
      rag_hit: 'warn', pass: 'warn'
    };

    function badgesOf(r) {
      const out = [];
      if (!r) return out;
      if (r.label) out.push({ t: '判定：' + (LABELS[r.label] || r.label), cls: LABEL_TONE[r.label] || '' });
      if (Array.isArray(r.steps)) out.push({ t: '步骤 ' + r.steps.length + ' 步' });
      else if (r.steps != null && !isNaN(Number(r.steps))) out.push({ t: '步骤 ' + Number(r.steps) + ' 步' });
      if (r.mode) out.push({ t: '模式：' + r.mode });
      if (r.model) out.push({ t: '模型：' + r.model });
      return out;
    }

    async function send() {
      const msg = ta.value.trim();
      if (!msg || sendBtn.disabled) return;
      ta.value = '';
      sendBtn.disabled = true;
      const round = turns + 1;
      push('u', msg, '本次测试输入');
      const wait = document.createElement('div');
      wait.className = 'msg a';
      wait.innerHTML = `<div class="bub" style="color:var(--text-3)">正在调用攻击智能体…</div>`;
      box.appendChild(wait);
      box.scrollTop = box.scrollHeight;
      try {
        const r = await API.post(`/api/agents/${a.id}/chat`, { msg: msg });
        wait.remove();
        if (r && r.turns != null && !isNaN(Number(r.turns))) turns = Number(r.turns);
        else turns = round;
        push('a', (r && r.reply) || '（后端未返回回复内容）', `累计第 ${turns} 轮 · 智能体回复`,
          badgesOf(r), r && Array.isArray(r.steps) ? r.steps : null);
        hint.innerHTML = `已累计 <b style="color:var(--text-2)">${turns}</b> 轮（后端会话计数） · turns=${esc(String(r && r.turns != null ? r.turns : '—'))}`;
      } catch (e) {
        wait.remove();
        push('a', '调用失败：' + ((e && e.message) || '未知错误'), '接口异常', ['POST /api/agents/' + a.id + '/chat']);
      } finally {
        sendBtn.disabled = false;
        ta.focus();
      }
    }

    sendBtn.onclick = send;
    ta.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' && !ev.shiftKey) {
        ev.preventDefault();
        send();
      }
    });
    setTimeout(() => ta.focus(), 60);
    return d;
  }

  /* ------------------------------------------------------------ 复合攻击链 */
  function normAsr(v) {
    const n = Number(v);
    if (v == null || v === '' || isNaN(n)) return null;
    /* 后端口径应为 0–100；前端不再把 >100 的值静默 ÷100 */
    return n;
  }

  function chainSVG(nodes, edges) {
    const NW = 142, NH = 50, GAP = 46, PAD = 6;
    const W = PAD * 2 + nodes.length * NW + Math.max(0, nodes.length - 1) * GAP;
    const H = NH + 28;
    const idxOf = {};
    nodes.forEach((n, i) => { idxOf[n.id] = i; });
    const edgeHTML = edges.map((e) => {
      const from = idxOf[e.from];
      const to = idxOf[e.to];
      if (from == null || to == null || to <= from) return '';
      const x1 = PAD + from * (NW + GAP) + NW;
      const x2 = PAD + to * (NW + GAP);
      const y = 10 + NH / 2;
      const mx = (x1 + x2) / 2;
      return `<g>
        <line x1="${x1 + 2}" y1="${y}" x2="${x2 - 9}" y2="${y}" stroke="#B7C2D8" stroke-width="1.5"
          stroke-dasharray="5 4" stroke-linecap="round"/>
        <text x="${mx}" y="${y - 7}" text-anchor="middle" font-size="8.5" fill="#9AA3B2">${esc(e.label || '')}</text>
        <polygon points="${x2 - 9},${y - 4.5} ${x2 - 1},${y} ${x2 - 9},${y + 4.5}" fill="#B7C2D8"/>
      </g>`;
    }).join('');
    const nodeHTML = nodes.map((n, i) => {
      const x = PAD + i * (NW + GAP);
      const col = STATUS_COLOR[n.status] || '#5B6474';
      const av = normAsr(n.asr);
      const asr = av != null
        ? `<text x="${x + NW - 10}" y="27" text-anchor="end" font-size="9.5" font-family="var(--mono)" fill="${asrTone(av)}">${esc(pctText(av))}</text>`
        : '';
      return `<g>
        <rect x="${x}" y="10" width="${NW}" height="${NH}" rx="9" fill="#fff" stroke="#DCE3EF"/>
        <rect x="${x}" y="10" width="3.5" height="${NH}" rx="1.75" fill="${col}"/>
        <circle cx="${x + 14}" cy="24" r="3.6" fill="${col}" opacity=".85"/>
        <text x="${x + 23}" y="27" font-size="11" font-weight="600" fill="#0F1319">${esc(clip(n.label || '—', NW - 82, 11))}</text>
        ${asr}
        <text x="${x + 13}" y="45" font-size="9.5" fill="#8B93A3" font-family="var(--mono)">${esc(clip(n.sub || '', NW - 26, 9.5))}</text>
      </g>`;
    }).join('');
    return `<svg class="ch-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${edgeHTML}${nodeHTML}</svg>`;
  }

  function stepsHTML(steps) {
    if (!steps || !steps.length) {
      return `<div class="ch-empty"><div class="t">该链路暂无步骤事件</div>
        <div>后端 task_event 未检索到该任务的事件记录</div></div>`;
    }
    return steps.map((s, i) => {
      const level = String(s.level || '').toLowerCase();
      const tone = level === 'high' || level === 'error' || level === 'risk' ? 'risk'
        : level === 'mid' || level === 'warn' ? 'warn' : '';
      const lvText = level && level !== 'info' ? (LEVEL_TXT[level] || '') : '';
      const type = STEP_TYPE[String(s.type || '').toLowerCase()] || s.type || '事件';
      return `<div class="ch-step ${tone}">
        <div class="ch-no">${pad2(s.seq != null ? s.seq : i + 1)}</div>
        <div class="ch-sb">
          <div class="ch-sh"><span class="ch-type">${esc(type)}</span>
            ${lvText ? `<span class="ch-tag ${tone}">${esc(lvText)}</span>` : ''}</div>
          <div class="ch-sd">${esc(s.content || '—')}</div>
        </div>
      </div>`;
    }).join('');
  }

  function chainDrawer(a) {
    const d = track(UI.drawer({
      title: esc(a.name) + ' · 复合攻击链',
      sub: '由该智能体最近的任务记录还原攻击链路与事件步骤',
      body: `<div id="ch-host">${'<div class="skel" style="height:12px;margin-bottom:12px"></div>'.repeat(6)}</div>`,
      width: '1160px'
    }));
    const host = d.body.querySelector('#ch-host');
    (async () => {
      try {
        const r = await API.get(`/api/agents/${a.id}/chain`);
        const nodes = (r && r.nodes) || [];
        const edges = (r && r.edges) || [];
        const steps = (r && r.steps) || [];
        const asrs = nodes.map((n) => normAsr(n.asr)).filter((v) => v != null);
        const avg = asrs.length ? asrs.reduce((s, v) => s + v, 0) / asrs.length : null;
        host.innerHTML = `
          <div class="ch-meta">
            <div class="dr-stat"><span>链路节点</span><b>${nodes.length}<small>个</small></b></div>
            <div class="dr-stat"><span>结果传递</span><b>${edges.length}<small>条</small></b></div>
            <div class="dr-stat"><span>平均 ASR</span><b>${avg == null ? '—' : esc(pctText(avg))}</b></div>
            <div class="ch-note">${esc((r && r.note) || '—')}</div>
          </div>
          ${nodes.length ? `<div class="ch-wrap">
            <div class="ch-panel">
              <div class="ch-hd">链路拓扑<span class="dim">节点=攻击步骤 · 虚线=结果传递</span></div>
              <div class="ch-canvas" id="ch-canvas">${chainSVG(nodes, edges)}</div>
            </div>
            <div class="ch-panel">
              <div class="ch-hd">步骤清单<span class="dim">${steps.length} 条事件</span></div>
              <div class="ch-steps">${stepsHTML(steps)}</div>
            </div>
          </div>` : `<div class="ch-panel"><div class="ch-empty">
            <div class="t">暂无链路数据</div><div>该智能体还没有可还原的任务执行记录，先下发攻击任务后再查看</div>
          </div></div>`}`;
        if (nodes.length) {
          host.insertAdjacentHTML('beforeend',
            '<div class="dr-hint" style="margin-top:10px">注：链路接口返回的 ASR 存在二次 ×100（与智能体统计口径不同），页面已按百分数归一展示。</div>');
        }
      } catch (e) {
        host.innerHTML = UI.empty('攻击链加载失败', (e && e.message) || '接口异常');
      }
    })();
    return d;
  }

  /* -------------------------------------------------------------- 战术编排 */
  function tacticDrawer(a, onSaved) {
    const cur = parseTactics(a.descr);
    const picked = new Set(cur.tactics.filter((t) => TACTICS.indexOf(t) >= 0));
    const key = 'ag_tactic_intervene_' + a.id;
    let mode = 'allow';
    try { mode = localStorage.getItem(key) || 'allow'; } catch (e) { mode = 'allow'; }

    const body = `
      <div class="dr-sec">
        <div class="dr-hd">战术方案<span class="dim" id="tc-plan-meta">加载中…</span></div>
        <div class="tc-plans" id="tc-plans"><div class="dr-hint">正在读取方案…</div></div>
        <div class="tc-plan-bar">
          <input class="input" id="tc-plan-name" placeholder="新方案名称，如：方案D · 分段诱导" maxlength="40" aria-label="新方案名称">
          <button type="button" class="btn sm" id="tc-save-new">${icon('plus', 12)}另存为新方案</button>
          <button type="button" class="btn sm primary" id="tc-save-plan">${icon('check', 12)}保存到当前方案</button>
        </div>
      </div>
      <div class="dr-sec">
        <div class="dr-hd">当前战术链<span class="dim">解析自智能体描述，可切换方案或勾选步骤</span></div>
        <div class="tc-cur" id="tc-cur">
          ${cur.tactics.length
            ? cur.tactics.map((t) => `<span class="ag-chip tac">${esc(t)}</span>`).join('')
            : '<span class="dr-hint">尚未配置战术，从下方选择编排步骤</span>'}
        </div>
      </div>
      <div class="dr-sec">
        <div class="dr-hd">选择战术<span class="dim">按执行顺序依次下发</span></div>
        <div class="tc-grid" id="tc-grid">
          ${TACTICS.map((t, i) => `<button type="button" class="tc ${picked.has(t) ? 'on' : ''}" data-tactic="${esc(t)}">
            <span class="tc-ix">${pad2(i + 1)}</span>
            <span class="tc-t">${esc(t)}</span>
            <span class="tc-d">${esc(TACTIC_DESC[t] || '')}</span>
            <span class="tc-ck">${icon('check', 11)}</span>
          </button>`).join('')}
        </div>
      </div>
      <div class="dr-sec">
        <div class="dr-hd">终止条件<span class="dim">单任务最大轮次（支持 20 / 30）与高危处置</span></div>
        <div class="tc-tstop">
          <span>最大轮次</span>
          <input class="input num" id="tc-turns" type="number" min="1" max="100" step="1" value="20" aria-label="单任务最大轮次">
          ${[20, 30].map((n) => `<button type="button" class="chip" data-turns="${n}">${n}</button>`).join('')}
        </div>
        <div id="tc-seg">${UI.seg([{ v: 'allow', t: '允许继续' }, { v: 'deny', t: '立即中断' }], mode)}</div>
      </div>
      <div class="dr-sec tc-res" id="tc-res"></div>`;

    const d = track(UI.drawer({
      title: esc(a.name) + ' · 战术编排',
      sub: '触发一次真实战术执行，保存后写入该智能体描述',
      body,
      footer: `<button class="btn ghost" data-close>关闭</button>
        <button class="btn primary" id="tc-run">${icon('bolt', 14)}触发战术执行</button>`,
      width: '700px'
    }));

    const grid = d.body.querySelector('#tc-grid');
    const res = d.body.querySelector('#tc-res');
    const runBtn = d.el.querySelector('#tc-run');
    const closeBtn = d.el.querySelector('[data-close]');
    const plansBox = d.body.querySelector('#tc-plans');
    const planMeta = d.body.querySelector('#tc-plan-meta');
    const nameInput = d.body.querySelector('#tc-plan-name');
    const turnsEl = d.body.querySelector('#tc-turns');
    let plans = [];
    let planId = null;
    if (closeBtn) closeBtn.onclick = () => d.close();
    if (res) res.style.display = 'none';

    const alive = () => d.el.isConnected;
    const readStops = () => {
      const v = Math.max(1, Math.min(100, parseInt(turnsEl ? turnsEl.value : '20', 10) || 20));
      return { maxTurns: v, onHighRisk: mode === 'deny' };
    };
    const syncGrid = () => {
      d.body.querySelectorAll('#tc-grid [data-tactic]').forEach((b) => {
        b.classList.toggle('on', picked.has(b.dataset.tactic));
      });
    };
    const syncMode = () => {
      d.body.querySelectorAll('#tc-seg [data-seg]').forEach((x) => {
        x.classList.toggle('on', x.dataset.seg === mode);
      });
    };
    const renderCur = () => {
      const box = d.body.querySelector('#tc-cur');
      if (!box) return;
      const list = TACTICS.filter((t) => picked.has(t));
      box.innerHTML = list.length
        ? list.map((t) => `<span class="ag-chip tac">${esc(t)}</span>`).join('')
        : '<span class="dr-hint">尚未配置战术，从下方选择编排步骤</span>';
    };
    const renderPlans = () => {
      if (!plansBox) return;
      if (!plans.length) {
        plansBox.innerHTML = '<div class="dr-hint">暂无方案，勾选步骤后「另存为新方案」</div>';
        if (planMeta) planMeta.textContent = '0 套';
        return;
      }
      plansBox.innerHTML = plans.map((pl) => {
        const st = (pl.stops && typeof pl.stops === 'object') ? pl.stops : {};
        return `<button type="button" class="tc-plan${pl.id === planId ? ' on' : ''}" data-plan="${pl.id}">
          <span class="nm">${esc(pl.name)}${pl.id === planId ? '<i class="cur">当前</i>' : ''}</span>
          <span class="ch">${(pl.tactics || []).map((t) => `<em>${esc(t)}</em>`).join('') || '<em>无步骤</em>'}</span>
          <span class="mt">上限 ${esc(String(st.maxTurns == null ? '—' : st.maxTurns))} 轮 · 高危${st.onHighRisk ? '中断' : '放行'}${pl.updated ? ' · ' + esc(String(pl.updated).slice(5, 16)) : ''}</span>
        </button>`;
      }).join('');
      if (planMeta) planMeta.textContent = plans.length + ' 套方案';
      plansBox.querySelectorAll('[data-plan]').forEach((b) => {
        b.onclick = () => applyPlan(Number(b.dataset.plan), false);
      });
    };
    const applyPlan = (id, silent) => {
      const pl = plans.filter((p) => p.id === id)[0];
      if (!pl) return;
      planId = id;
      picked.clear();
      (pl.tactics || []).forEach((t) => { if (TACTICS.indexOf(t) >= 0) picked.add(t); });
      const st = (pl.stops && typeof pl.stops === 'object') ? pl.stops : {};
      mode = st.onHighRisk ? 'deny' : 'allow';
      if (turnsEl) turnsEl.value = st.maxTurns == null ? 20 : st.maxTurns;
      syncGrid(); syncMode(); renderCur(); renderPlans();
      if (nameInput) nameInput.value = '';
      if (!silent) UI.toast('已切换方案：' + pl.name);
    };
    const loadPlans = async () => {
      try {
        const r = await API.post(`/api/agents/${a.id}/tactic`, { action: 'list' });
        if (!alive()) return;
        plans = r.plans || [];
        if (!plans.length) { renderPlans(); return; }
        const pid = (planId && plans.some((x) => x.id === planId)) ? planId : plans[plans.length - 1].id;
        applyPlan(pid, true);
      } catch (e) {
        if (!alive() || !plansBox) return;
        plansBox.innerHTML = `<div class="dr-hint" style="color:var(--danger)">方案加载失败：${esc((e && e.message) || e)}</div>`;
        if (planMeta) planMeta.textContent = '加载失败';
      }
    };
    const savePlan = async (asNew) => {
      const list = TACTICS.filter((t) => picked.has(t));
      if (!list.length) { UI.toast('请至少选择一个战术步骤', 'err'); return false; }
      const payload = { tactics: list, stops: readStops() };
      if (asNew) {
        payload.name = (nameInput && nameInput.value.trim()) || ('方案' + (plans.length + 1) + ' · ' + list.slice(0, 2).join('/'));
      } else if (planId) {
        payload.id = planId;
      }
      try {
        const r = await API.post(`/api/agents/${a.id}/tactic`, payload);
        if (!alive()) return true;
        plans = r.plans || plans;
        if (r.planId) planId = r.planId;
        renderPlans();
        if (nameInput) nameInput.value = '';
        UI.toast(asNew ? '已另存为新方案' : '当前方案已保存');
        if (typeof onSaved === 'function') onSaved();
        return true;
      } catch (e) {
        UI.toast('方案保存失败：' + ((e && e.message) || e), 'err');
        return false;
      }
    };

    grid.addEventListener('click', (ev) => {
      const btn = ev.target.closest('[data-tactic]');
      if (!btn) return;
      const t = btn.dataset.tactic;
      if (picked.has(t)) picked.delete(t); else picked.add(t);
      btn.classList.toggle('on', picked.has(t));
      renderCur();
    });

    d.body.querySelectorAll('#tc-seg [data-seg]').forEach((b) => {
      b.onclick = () => {
        mode = b.dataset.seg;
        try { localStorage.setItem(key, mode); } catch (e) { /* 隐私模式忽略 */ }
        syncMode();
      };
    });
    d.body.querySelectorAll('[data-turns]').forEach((b) => {
      b.onclick = () => { if (turnsEl) turnsEl.value = b.dataset.turns; };
    });
    const saveNewBtn = d.body.querySelector('#tc-save-new');
    const saveCurBtn = d.body.querySelector('#tc-save-plan');
    if (saveNewBtn) saveNewBtn.onclick = () => savePlan(true);
    if (saveCurBtn) saveCurBtn.onclick = () => savePlan(false);
    loadPlans();

    runBtn.onclick = async () => {
      const list = TACTICS.filter((t) => picked.has(t));
      if (!list.length) {
        UI.toast('请至少选择一个战术步骤', 'err');
        return;
      }
      runBtn.disabled = true;
      const raw = runBtn.innerHTML;
      runBtn.innerHTML = '执行中…';
      try {
        const payload = { tactics: list, stops: readStops() };
        if (planId) payload.id = planId;
        const r = await API.post(`/api/agents/${a.id}/tactic`, payload);
        const steps = r && r.steps != null ? r.steps : list.length;
        const st = (r && r.stops) || {};
        res.style.display = 'block';
        res.innerHTML = `
          <div class="dr-hd">执行结果<span class="dim">已保存到后端 · 刚刚触发</span></div>
          <div class="dr-stats">
            <div class="dr-stat"><span>执行步骤</span><b>${esc(String(steps))}<small>步</small></b></div>
            <div class="dr-stat"><span>战术数量</span><b>${((r && r.tactics) || list).length}<small>个</small></b></div>
            <div class="dr-stat"><span>高危策略</span><b>${st.onHighRisk ? '中断' : '放行'}</b></div>
          </div>
          <div class="tc-cur">${((r && r.tactics) || list).map((t) => `<span class="ag-chip tac">${esc(t)}</span>`).join('')}</div>
          <div class="kv2 mt12">
            ${kvItem('智能体 ID', r && r.id)}
            ${kvItem('单任务最大轮次', st.maxTurns)}
            ${kvItem('战术链', ((r && r.tactics) || list).join(' → '))}
            ${kvItem('写入字段', 'agent.descr ｜战术：')}
          </div>`;
        const curBox = d.body.querySelector('#tc-cur');
        if (curBox) {
          curBox.innerHTML = ((r && r.tactics) || list)
            .map((t) => `<span class="ag-chip tac">${esc(t)}</span>`).join('');
        }
        if (r && r.plans) { plans = r.plans; if (r.planId) planId = r.planId; renderPlans(); }
        UI.toast('战术编排已保存并触发执行');
        if (typeof onSaved === 'function') onSaved();
      } catch (e) {
        res.style.display = 'block';
        res.innerHTML = `<div class="dr-hd">执行失败</div>
          <div class="cf-err">${esc((e && e.message) || '接口异常')}</div>`;
        UI.toast('战术执行失败：' + ((e && e.message) || '未知错误'), 'err');
      } finally {
        runBtn.disabled = false;
        runBtn.innerHTML = raw;
      }
    };
    return d;
  }

  /* -------------------------------------------------------------- 配置抽屉 */
  function chipPicker(list, set) {
    if (!list.length) return '<span class="dr-hint">暂无可选项</span>';
    return list.map((it) => `<button type="button" class="na-chip ${set.has(it.v) ? 'on' : ''}"
      data-v="${esc(it.v)}" title="${esc(it.tip || it.v)}">${esc(it.t)}</button>`).join('');
  }

  function bindChips(box, set) {
    box.addEventListener('click', (ev) => {
      const b = ev.target.closest('[data-v]');
      if (!b) return;
      const v = b.dataset.v;
      if (set.has(v)) set.delete(v); else set.add(v);
      b.classList.toggle('on', set.has(v));
    });
  }

  function configDrawer(a, ctx) {
    const chosen = { libs: new Set(), skills: new Set(), mcps: new Set() };
    const lists = {
      libs: (ctx.libs || []).map((l) => ({ id: l.id, v: l.name, t: `${l.name} · ${l.count || 0} 条`, tip: l.descr || '样本库' })),
      skills: (ctx.skills || []).map((s) => ({ id: s.id, v: s.name, t: s.name, tip: (s.kind || '技能') })),
      mcps: (ctx.mcps || []).map((m) => ({ id: m.id, v: m.name, t: m.name, tip: (m.transport || 'MCP') }))
    };
    (a.skills || []).forEach((v) => chosen.skills.add(v));
    (a.mcps || []).forEach((v) => chosen.mcps.add(v));
    const cfgModels = (ctx.models || []).slice().sort((x, y) => {
      const sx = (x.kind === 'chat' ? 2 : 0) + (/模型接口/.test(String(x.category || '')) ? 1 : 0);
      const sy = (y.kind === 'chat' ? 2 : 0) + (/模型接口/.test(String(y.category || '')) ? 1 : 0);
      return sy - sx;
    });

    const body = `
      <div id="cf-banner"></div>
      <div class="dr-stats">
        <div class="dr-stat"><span>累计任务</span><b>${esc(UI.num(a.tasks || 0))}<small>个</small></b></div>
        <div class="dr-stat"><span>样本数</span><b>${esc(UI.num(a.samples || 0))}<small>条</small></b></div>
        <div class="dr-stat"><span>平均 ASR</span><b style="color:${asrTone(a.asr)}">${esc(pctText(a.asr))}</b></div>
      </div>
      <div class="dr-sec">
        <div class="dr-hd">模型参数<span class="dim">绑定后用于对话测试、任务与评估</span></div>
        <div class="na-lab">绑定模型</div>
        <select id="cf-model" class="select">
          ${cfgModels.length
            ? cfgModels.map((md) => `<option value="${md.id}">${esc(md.name)} · ${esc(md.category || '模型接口')}${md.status === '停用' ? '（停用）' : ''}</option>`).join('')
            : `<option value="${a.model_id || ''}">${esc(a.model || '暂无可用模型')}</option>`}
        </select>
        <div class="dr-hint">切换模型后保存即可生效；新任务与对话测试将使用新模型。</div>
        <div class="na-lab" style="margin-top:12px">System Prompt</div>
        <textarea id="cf-prompt" class="textarea" rows="7"
          placeholder="设定该智能体的角色、攻击目标与输出约束…"></textarea>
        <div class="dr-2col mt12">
          <div>
            <div class="na-lab">温度 temperature</div>
            <input id="cf-temp" class="input" type="number" min="0" max="2" step="0.1" value="0.3">
            <div class="dr-hint">0 更确定 · 2 更发散</div>
          </div>
          <div>
            <div class="na-lab">最大 Token</div>
            <input id="cf-max" class="input" type="number" min="64" max="32768" step="64" value="2048">
            <div class="dr-hint">单轮回复上限</div>
          </div>
        </div>
      </div>
      <div class="dr-sec">
        <div class="dr-hd">挂载样本库<span class="dim" id="cf-lib-n">多选</span></div>
        <div class="na-chips" id="cf-libs"></div>
      </div>
      <div class="dr-sec">
        <div class="dr-hd">挂载技能 Skill<span class="dim" id="cf-skill-n">多选</span></div>
        <div class="na-chips" id="cf-skills"></div>
      </div>
      <div class="dr-sec">
        <div class="dr-hd">挂载 MCP 服务<span class="dim" id="cf-mcp-n">多选</span></div>
        <div class="na-chips" id="cf-mcps"></div>
      </div>
      <div class="cf-err" id="cf-err"></div>`;

    const d = track(UI.drawer({
      title: esc(a.name) + ' · 配置',
      sub: `智能体 #${a.id} · ${esc(a.scenario || '—')}`,
      body,
      footer: `<button class="btn ghost" data-close>取消</button>
        <button class="btn primary" id="cf-save">${icon('check', 14)}保存配置</button>`,
      width: '720px'
    }));

    const banner = d.body.querySelector('#cf-banner');
    const errBox = d.body.querySelector('#cf-err');
    const modelEl = d.body.querySelector('#cf-model');
    const promptEl = d.body.querySelector('#cf-prompt');
    const tempEl = d.body.querySelector('#cf-temp');
    const maxEl = d.body.querySelector('#cf-max');
    const saveBtn = d.el.querySelector('#cf-save');
    const closeBtn = d.el.querySelector('[data-close]');
    if (closeBtn) closeBtn.onclick = () => d.close();

    const box = {
      libs: d.body.querySelector('#cf-libs'),
      skills: d.body.querySelector('#cf-skills'),
      mcps: d.body.querySelector('#cf-mcps')
    };
    const tag = {
      libs: d.body.querySelector('#cf-lib-n'),
      skills: d.body.querySelector('#cf-skill-n'),
      mcps: d.body.querySelector('#cf-mcp-n')
    };

    function paint(key) {
      box[key].innerHTML = chipPicker(lists[key], chosen[key]);
      tag[key].textContent = `多选 · 已选 ${chosen[key].size} 项 / 共 ${lists[key].length} 项`;
    }
    function paintAll() { paint('libs'); paint('skills'); paint('mcps'); }

    bindChips(box.libs, chosen.libs);
    bindChips(box.skills, chosen.skills);
    bindChips(box.mcps, chosen.mcps);
    paintAll();

    const parseArr = (v) => {
      if (Array.isArray(v)) return v;
      try {
        const x = JSON.parse(v || '[]');
        return Array.isArray(x) ? x : [];
      } catch (e) { return []; }
    };
    function resolveInto(set, vals, list) {
      (vals || []).forEach((v) => {
        const s = String(v);
        const hit = list.find((x) => x.v === s || String(x.id) === s);
        if (hit) set.add(hit.v);
      });
    }

    (async () => {
      try {
        const r = (await API.get(`/api/agents/${a.id}/config`)) || {};
        const cfg = r.config || {};
        const defs = r.defaults || {};
        if (modelEl) modelEl.value = String(r.model_id || a.model_id || '');
        promptEl.value = cfg.sys_prompt || defs.sys_prompt || '';
        tempEl.value = cfg.temperature != null ? cfg.temperature : (defs.temperature != null ? defs.temperature : 0.3);
        maxEl.value = cfg.max_tokens != null ? cfg.max_tokens : (defs.max_tokens || 2048);
        if ((r.libs || []).length) {
          lists.libs = r.libs.map((x) => ({ id: x.id, v: x.name, t: x.name, tip: '样本库 #' + x.id }));
        }
        if ((r.skills || []).length) {
          lists.skills = r.skills.map((x) => ({ id: x.id, v: x.name, t: x.name, tip: (x.kind || '技能') + ' · #' + x.id }));
        }
        if ((r.mcps || []).length) {
          lists.mcps = r.mcps.map((x) => ({ id: x.id, v: x.name, t: x.name, tip: (x.transport || 'MCP') + ' · #' + x.id }));
        }
        chosen.libs.clear();
        chosen.skills.clear();
        chosen.mcps.clear();
        resolveInto(chosen.libs, parseArr(cfg.sample_libs), lists.libs);
        resolveInto(chosen.skills, parseArr(cfg.skills), lists.skills);
        resolveInto(chosen.mcps, parseArr(cfg.mcps), lists.mcps);
        if (!chosen.skills.size) resolveInto(chosen.skills, a.skills || [], lists.skills);
        if (!chosen.mcps.size) resolveInto(chosen.mcps, a.mcps || [], lists.mcps);
        paintAll();
        banner.innerHTML = `<div class="dr-hint" style="color:var(--ok);margin-bottom:4px">
          配置接口已连通：保存后写入 agent_conf，并立即用于对话测试的 System Prompt 与判定策略。</div>`;
      } catch (e) {
        const msg = (e && e.message) || '接口异常';
        const missing = /404|不存在|未实现/.test(String(msg));
        banner.innerHTML = missing
          ? UI.note('后端接口待接入：GET / POST /api/agents/{id}/config 尚未实现（返回 404）。当前仅前端表单，保存不会写入数据库。', 'warn')
          : UI.note(`配置读取失败（${esc(msg)}）。表单仍可填写并尝试保存。`, 'warn');
      }
    })();

    saveBtn.onclick = async () => {
      const temp = Number(tempEl.value);
      const maxTok = Number(maxEl.value);
      const prompt = promptEl.value.trim();
      if (!prompt) { errBox.textContent = 'System Prompt 不能为空'; return; }
      if (isNaN(temp) || temp < 0 || temp > 2) { errBox.textContent = '温度需在 0 ~ 2 之间'; return; }
      if (isNaN(maxTok) || maxTok < 64) { errBox.textContent = '最大 Token 不能小于 64'; return; }
      errBox.textContent = '';
      const payload = {
        sys_prompt: prompt,
        temperature: temp,
        max_tokens: maxTok,
        sample_libs: Array.from(chosen.libs),
        skills: Array.from(chosen.skills),
        mcps: Array.from(chosen.mcps),
        model_id: Number(modelEl && modelEl.value) || 0
      };
      saveBtn.disabled = true;
      const raw = saveBtn.innerHTML;
      saveBtn.innerHTML = '保存中…';
      try {
        await API.post(`/api/agents/${a.id}/config`, payload);
        const hit = (ctx.models || []).find((m) => String(m.id) === String(payload.model_id));
        if (hit) { a.model = hit.name; a.model_id = hit.id; }
        render();
        UI.toast('配置已保存并生效');
        d.close();
      } catch (e) {
        const msg = (e && e.message) || '接口异常';
        const missing = /404|不存在|未实现/.test(String(msg));
        errBox.textContent = (missing ? '保存失败（后端接口待接入）：' : '保存失败：') + msg;
        UI.toast(missing ? '配置未保存：后端接口待接入' : '配置未保存：' + msg, 'err');
      } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = raw;
      }
    };
    return d;
  }

  /* ---------------------------------------------------------------- 技能库 */
  function skillRowTab(x) {
    const meta = KIND_META[x.kind] || KIND_META['代码上传'];
    return `<div class="sk-row">
      <div class="sk-ic" style="background:${meta.bg};color:${meta.fg}">${icon(meta.ic, 15)}</div>
      <div class="sk-main">
        <div class="sk-nm">${esc(x.name)}
          <span class="sk-kind">${esc(dash(x.kind))}</span>
          ${UI.pill(x.status || '—')}
        </div>
        <div class="sk-ds">${esc(x.descr || '未填写能力说明')}</div>
        <div class="sk-meta">
          <span class="mono">${esc(dash(x.lang))}</span>
          <span>体积 ${esc(fmtSize(x.size))}</span>
          <span>调用 ${esc(UI.num(x.uses || 0))} 次</span>
          <span>${esc(UI.ago(x.created))}</span>
        </div>
      </div>
      <button class="btn sm" data-sk-detail="${x.id}">详情</button>
    </div>`;
  }

  function skillDetailDrawer(s, onChanged) {
    const meta = KIND_META[s.kind] || KIND_META['代码上传'];
    const d = track(UI.drawer({
      title: esc(s.name),
      sub: `技能 #${s.id} · ${esc(dash(s.kind))}`,
      body: `
        <div class="dr-stats">
          <div class="dr-stat"><span>类型</span><b style="font-size:15px">${esc(dash(s.kind))}</b></div>
          <div class="dr-stat"><span>语言</span><b style="font-size:15px">${esc(dash(s.lang))}</b></div>
          <div class="dr-stat"><span>体积</span><b style="font-size:15px">${esc(fmtSize(s.size))}</b></div>
        </div>
        <div class="dr-sec">
          <div class="dr-hd">能力说明<span class="dim">${esc(s.status || '—')}</span></div>
          <div style="font-size:12.5px;line-height:1.75;color:var(--text-2)">${esc(s.descr || '—')}</div>
        </div>
        <div class="dr-sec">
          <div class="dr-hd">元信息</div>
          <div class="kv2">
            ${kvItem('技能 ID', s.id)}
            ${kvItem('状态', s.status)}
            ${kvItem('语言', s.lang)}
            ${kvItem('体积', fmtSize(s.size))}
            ${kvItem('调用次数', s.uses)}
            ${kvItem('创建时间', s.created)}
          </div>
        </div>`,
      footer: `<button class="btn danger" data-del>${icon('close', 13)}删除技能</button>
        <button class="btn primary" data-close>关闭</button>`,
      width: '620px'
    }));
    d.el.querySelector('[data-close]').onclick = () => d.close();
    d.el.querySelector('[data-del]').onclick = () => {
      confirmModal('删除技能', `确认删除技能「${esc(s.name)}」？删除后已挂载该技能的智能体将无法调用。`, async () => {
        await API.del(`/api/skills/${s.id}`);
        UI.toast('技能已删除');
        d.close();
        if (typeof onChanged === 'function') onChanged();
      });
    };
    return d;
  }

  function newSkillModal(onChanged) {
    const m = track(UI.modal({
      title: '新建技能',
      okText: '创建技能',
      body: `
        <div class="na-sec">
          <div class="na-lab">技能名称 <span style="color:var(--danger)">*</span></div>
          <input id="sk-name" class="input" placeholder="例如：网页越狱载荷生成器" maxlength="40">
        </div>
        <div class="dr-2col">
          <div class="na-sec">
            <div class="na-lab">来源类型</div>
            <select id="sk-kind" class="select">${KINDS.map((k) => `<option value="${esc(k)}">${esc(k)}</option>`).join('')}</select>
          </div>
          <div class="na-sec">
            <div class="na-lab">实现语言</div>
            <select id="sk-lang" class="select">
              ${['python', 'javascript', 'go', 'java', 'bash'].map((l) => `<option value="${l}">${l}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="na-sec">
          <div class="na-lab">能力描述</div>
          <textarea id="sk-descr" class="textarea" rows="3" placeholder="说明该技能的攻击面、输入输出与依赖…"></textarea>
        </div>
        <div class="na-sec">
          <div class="na-lab">上传文件<span class="dim" style="font-weight:400">可选 · 体积取自真实文件</span></div>
          <label class="sk-file" style="cursor:pointer;margin-bottom:0">
            <span class="sk-fic">${icon('download', 15)}</span>
            <span style="min-width:0;flex:1">
              <span class="t" id="sk-fname" style="display:block">点击选择代码文件</span>
              <span class="s" id="sk-fsize" style="display:block">未选择文件，体积将记录为「—」</span>
            </span>
            <input id="sk-file" type="file" style="display:none">
          </label>
        </div>
        <label class="na-chip" id="sk-enable" style="display:inline-flex;align-items:center;gap:7px;cursor:pointer">
          <input id="sk-enable-in" type="checkbox" checked style="margin:0"> 创建后立即启用
        </label>
        <div class="na-err" id="sk-err"></div>`,
      onOk: async (el) => {
        const name = el.querySelector('#sk-name').value.trim();
        const err = el.querySelector('#sk-err');
        if (!name) { err.textContent = '技能名称不能为空'; return false; }
        const payload = {
          name: name,
          kind: el.querySelector('#sk-kind').value,
          lang: el.querySelector('#sk-lang').value,
          descr: el.querySelector('#sk-descr').value.trim(),
          enable: el.querySelector('#sk-enable-in').checked,
          size: el.dataset.size || '—'
        };
        try {
          await API.post('/api/skills', payload);
        } catch (e) {
          err.textContent = '创建失败：' + ((e && e.message) || '接口异常');
          return false;
        }
        UI.toast('技能已创建');
        if (typeof onChanged === 'function') onChanged();
        return true;
      }
    }));
    const file = m.el.querySelector('#sk-file');
    file.addEventListener('change', () => {
      const f = file.files && file.files[0];
      if (!f) return;
      m.el.dataset.size = String(f.size);
      m.el.querySelector('#sk-fname').textContent = f.name;
      m.el.querySelector('#sk-fsize').textContent = fmtSize(f.size) + ' · 真实文件体积';
    });
    return m;
  }

  /* -------------------------------------------------------------- MCP 服务 */
  function mcpResHTML(id) {
    const st = S.res[id] || {};
    let out = '';
    if (st.scanLoading) {
      out += `<div class="mp-res"><div class="mp-rh">${icon('search', 13)}投毒扫描中…</div>
        <div class="mp-wait">GET /api/mcp/${id}/scan</div></div>`;
    } else if (st.scan) {
      const high = st.scan.risk === '高';
      const hits = st.scan.hits || [];
      out += `<div class="mp-res ${high ? 'hi' : ''}">
        <div class="mp-rh">${icon('shield', 13)}投毒扫描 ${UI.pill(st.scan.risk || '—')}
          <span class="dim">拦截率 ${esc(st.scan.interceptRate != null ? st.scan.interceptRate + '%' : '—')}</span></div>
        <div class="mp-hits">${hits.length
          ? hits.map((h) => `<span class="mp-hit">${esc(h)}</span>`).join('')
          : '<span class="dr-hint">未命中注入特征</span>'}</div>
        <div class="mp-line">${esc(st.scan.advice || '—')}</div>
      </div>`;
    } else if (st.scanErr) {
      out += `<div class="mp-res hi"><div class="mp-rh">${icon('close', 13)}投毒扫描失败</div>
        <div class="mp-err">${esc(st.scanErr)}</div></div>`;
    }

    if (st.invLoading) {
      out += `<div class="mp-res"><div class="mp-rh">${icon('bolt', 13)}实测调用中…</div>
        <div class="mp-wait">POST /api/mcp/${id}/invoke · method=tools/list</div></div>`;
    } else if (st.inv) {
      const r = st.inv;
      const tools = (r.result && r.result.tools) || r.tools || [];
      out += `<div class="mp-res ${r.ok === false ? 'hi' : ''}">
        <div class="mp-rh">${icon('bolt', 13)}实测调用
          ${UI.pill(r.mode || '—', r.mode === '真实' ? 'brand' : 'violet')}
          ${r.ok === false ? UI.pill('失败', 'danger') : r.ok ? UI.pill('成功', 'ok') : ''}
          <span class="dim">${r.latency != null ? esc(r.latency + ' ms') : ''}</span></div>
        ${r.error ? `<div class="mp-err">${esc(r.error)}</div>` : ''}
        ${r.raw ? `<div class="mp-line mono" style="font-size:10.5px;max-height:80px;overflow:auto">${esc(String(r.raw).slice(0, 400))}</div>` : ''}
        ${tools.length ? `<div class="mp-tools">${tools.slice(0, 8).map((t) => `<div class="mp-tool">
          <span class="n">${esc(t.name || '—')}</span>
          <span class="d">${esc(t.description || t.desc || '')}</span></div>`).join('')}</div>` : ''}
        ${!tools.length && r.mode === '本地注册表' ? '<div class="mp-line">本地注册表已受理，未返回工具清单</div>' : ''}
      </div>`;
    } else if (st.invErr) {
      out += `<div class="mp-res hi"><div class="mp-rh">${icon('close', 13)}实测调用失败</div>
        <div class="mp-err">${esc(st.invErr)}</div></div>`;
    }
    return out;
  }

  function mcpRow(x) {
    const tp = String(x.transport || 'HTTP').toUpperCase();
    const meta = TP_META[tp] || TP_META.HTTP;
    return `<div class="res-row">
      <div class="rr-hd">
        <span class="tp ${meta.cls}">${esc(tp)}</span>
        <span class="rr-nm">${esc(x.name)}</span>
        ${UI.pill(x.status || '—')}
        <span class="rr-tools">工具 ${esc(UI.num(x.tools || 0))} 个</span>
        <div class="rr-acts">
          <button class="btn sm" data-mcp-scan="${x.id}">${icon('search', 12)}投毒扫描</button>
          <button class="btn sm" data-mcp-invoke="${x.id}">${icon('play', 12)}实测调用</button>
          <button class="btn sm ghost" data-mcp-edit="${x.id}">编辑</button>
          <button class="icon-btn" data-mcp-del="${x.id}" title="删除服务"
            style="width:26px;height:26px;color:var(--text-3)">${icon('close', 13)}</button>
        </div>
      </div>
      <div class="rr-ep">${esc(dash(x.endpoint))}</div>
      <div class="rr-metas">
        <span>命名空间 <b>${esc(dash(x.namespace))}</b></span>
        <span>优先级 <b>${esc(dash(x.priority))}</b></span>
        <span>回调 <b>${esc(dash(x.callback))}</b></span>
        <span>鉴权 <b>${esc(dash(x.auth))}</b></span>
        <span>${esc(UI.ago(x.created))}</span>
      </div>
      <div class="rr-ds">${esc(x.descr || '未填写服务描述')}</div>
      <div id="mpres-${x.id}">${mcpResHTML(x.id)}</div>
    </div>`;
  }

  function mcpModal(item, onChanged) {
    const isEdit = !!item;
    const it = item || {};
    const m = track(UI.modal({
      title: isEdit ? '编辑 MCP 服务' : '注册 MCP 服务',
      okText: isEdit ? '保存并新增记录' : '保存服务',
      body: `
        <div class="dr-2col">
          <div class="na-sec">
            <div class="na-lab">Server 名称 <span style="color:var(--danger)">*</span></div>
            <input id="mc-name" class="input" maxlength="40" value="${esc(it.name || '')}" placeholder="例如：kb-search">
          </div>
          <div class="na-sec">
            <div class="na-lab">传输方式 <span style="color:var(--danger)">*</span></div>
            <select id="mc-transport" class="select">
              ${['HTTP', 'SSE', 'STDIO'].map((t) => `<option value="${t}" ${String(it.transport || 'HTTP').toUpperCase() === t ? 'selected' : ''}>${t}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="na-sec">
          <div class="na-lab">端点 Endpoint</div>
          <input id="mc-endpoint" class="input mono" value="${esc(it.endpoint || 'http://127.0.0.1:9000/mcp')}">
        </div>
        <div class="dr-2col">
          <div class="na-sec">
            <div class="na-lab">鉴权方式</div>
            <input id="mc-auth" class="input" value="${esc(it.auth || '无')}">
          </div>
          <div class="na-sec">
            <div class="na-lab">工具数量</div>
            <input id="mc-tools" class="input" type="number" min="1" max="64" value="${esc(it.tools || 3)}">
          </div>
        </div>
        <div class="na-sec">
          <div class="na-lab">服务描述</div>
          <textarea id="mc-descr" class="textarea" rows="2" placeholder="工具描述会被注入扫描，可填写服务用途…">${esc(it.descr || '')}</textarea>
        </div>
        <div class="dr-2col">
          <div class="na-sec">
            <div class="na-lab">回调地址</div>
            <input id="mc-callback" class="input" value="${esc(it.callback || '')}" placeholder="https://…">
          </div>
          <div class="na-sec">
            <div class="na-lab">命名空间</div>
            <input id="mc-ns" class="input" value="${esc(it.namespace || '')}" placeholder="default">
          </div>
        </div>
        <div class="na-sec">
          <div class="na-lab">优先级</div>
          <input id="mc-prio" class="input" type="number" min="1" max="99" value="${esc(it.priority || 5)}" style="max-width:160px">
        </div>
        ${isEdit ? `<div class="dr-hint" style="color:var(--warn)">后端未提供 MCP 更新接口（仅 GET / POST /api/mcp），保存将按「新增」落库一条记录。</div>` : ''}
        <div class="dr-hint" style="color:var(--warn)">注册接口当前只落库 名称 / 传输 / 端点 / 鉴权 / 工具数 / 参数，描述、回调、命名空间、优先级暂未入库。</div>
        <div class="na-err" id="mc-err"></div>`,
      onOk: async (el) => {
        const name = el.querySelector('#mc-name').value.trim();
        const err = el.querySelector('#mc-err');
        if (!name) { err.textContent = 'Server 名称不能为空'; return false; }
        const transport = el.querySelector('#mc-transport').value;
        if (!transport) { err.textContent = '传输方式必填'; return false; }
        const payload = {
          name: name,
          transport: transport,
          endpoint: el.querySelector('#mc-endpoint').value.trim(),
          auth: el.querySelector('#mc-auth').value.trim() || '无',
          tools: Number(el.querySelector('#mc-tools').value) || 3,
          descr: el.querySelector('#mc-descr').value.trim(),
          callback: el.querySelector('#mc-callback').value.trim(),
          namespace: el.querySelector('#mc-ns').value.trim(),
          priority: Number(el.querySelector('#mc-prio').value) || 5
        };
        try {
          await API.post('/api/mcp', payload);
        } catch (e) {
          err.textContent = '注册失败：' + ((e && e.message) || '接口异常');
          return false;
        }
        UI.toast(isEdit ? '已按新增写入一条 MCP 记录' : 'MCP 服务已接入');
        if (typeof onChanged === 'function') onChanged();
        return true;
      }
    }));
    return m;
  }

  /* -------------------------------------------------------------- 样本库 */
  function libCard(l) {
    const tags = splitTags(l.tags);
    return `<div class="sl">
      <div class="sl-hd">
        <span class="sl-nm" title="${esc(l.name)}">${esc(l.name)}</span>
        <span style="margin-left:auto">${UI.pill(l.status || '启用')}</span>
      </div>
      <div class="sl-cat">类别 · ${esc(dash(l.cat))}</div>
      <div class="sl-ds">${esc(l.descr || '未填写样本库说明')}</div>
      <div class="sl-tags">${tags.length
        ? tags.slice(0, 4).map((t) => `<span class="sl-tag">${esc(t)}</span>`).join('')
        : '<span class="sl-tag">未打标签</span>'}</div>
      <div class="sl-ft">
        <span class="sl-n">${esc(UI.num(l.count || 0))}<span>样本</span></span>
        <span class="dim">${esc((l.created || '').slice(0, 10) || '—')}</span>
      </div>
    </div>`;
  }

  function newLibModal(onChanged) {
    const m = track(UI.modal({
      title: '新建样本库',
      okText: '创建样本库',
      body: `
        <div class="dr-2col">
          <div class="na-sec">
            <div class="na-lab">样本库名称 <span style="color:var(--danger)">*</span></div>
            <input id="lb-name" class="input" maxlength="40" placeholder="例如：金融越狱载荷库">
          </div>
          <div class="na-sec">
            <div class="na-lab">类别</div>
            <select id="lb-cat" class="select">
              ${['越狱', '提示注入', '数据泄露', '越权访问', 'MCP安全', '自定义'].map((c) =>
                `<option value="${esc(c)}">${esc(c)}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="na-sec">
          <div class="na-lab">说明</div>
          <textarea id="lb-descr" class="textarea" rows="3" placeholder="说明该库的样本来源、攻击目标与适用场景…"></textarea>
        </div>
        <div class="na-sec">
          <div class="na-lab">标签<span class="dim" style="font-weight:400">逗号分隔，默认「自定义」</span></div>
          <input id="lb-tags" class="input" placeholder="金融,合规,多轮">
        </div>
        <div class="na-err" id="lb-err"></div>`,
      onOk: async (el) => {
        const name = el.querySelector('#lb-name').value.trim();
        const err = el.querySelector('#lb-err');
        if (!name) { err.textContent = '样本库名称不能为空'; return false; }
        try {
          await API.post('/api/sample-libs', {
            name: name,
            cat: el.querySelector('#lb-cat').value,
            descr: el.querySelector('#lb-descr').value.trim(),
            tags: el.querySelector('#lb-tags').value.trim() || '自定义'
          });
        } catch (e) {
          err.textContent = '创建失败：' + ((e && e.message) || '接口异常');
          return false;
        }
        UI.toast('样本库已创建');
        if (typeof onChanged === 'function') onChanged();
        return true;
      }
    }));
    return m;
  }

  /* ------------------------------------------------------------ 智能体卡片 */
  function initials(nm) {
    const s = String(nm || '').trim();
    const m = s.match(/^[A-Za-z]+/);
    if (m) return m[0].slice(0, 2).toUpperCase();
    return s.slice(0, 2) || 'AI';
  }

  function agentCard(a) {
    const parsed = parseTactics(a.descr);
    const skills = a.skills || [];
    const mcps = a.mcps || [];
    const tactics = parsed.tactics.slice();
    const chips = []
      .concat(skills.slice(0, 3).map((s) => `<span class="ag-chip">${esc(s)}</span>`))
      .concat(mcps.slice(0, 2).map((m) => `<span class="ag-chip mcp">${esc(m)}</span>`))
      .concat(tactics.slice(0, 1).map((t) => `<span class="ag-chip tac">${esc(t)}</span>`));
    const extra = skills.length + mcps.length + tactics.length - Math.min(3, skills.length) - Math.min(2, mcps.length) - Math.min(1, tactics.length);
    if (extra > 0) chips.push(`<span class="ag-chip more">+${extra}</span>`);
    if (!chips.length) chips.push('<span class="ag-chip empty">未挂载技能与 MCP</span>');
    const online = a.status === '启用' || a.status === '在线';
    return `<div class="ag" data-agent="${a.id}">
      <div class="ag-hd">
        <div class="ag-ava" style="background:${AVA[a.id % AVA.length]}">${esc(initials(a.name))}</div>
        <div style="min-width:0;flex:1">
          <div class="ag-nm" title="${esc(a.name)}">${esc(a.name)}</div>
          <div class="ag-sc">
            <span>${esc(dash(a.scenario))}</span>
            <span class="ag-badge ${a.builtin ? '' : 'own'}">${a.builtin ? '内置' : '自建'}</span>
          </div>
        </div>
        ${UI.pill(a.status || '—', online ? 'ok' : 'gray')}
      </div>
      <div class="ag-ds" title="${esc(parsed.text.replace(/\s+/g, ' '))}">${esc(parsed.text || '未填写智能体描述')}</div>
      <div class="ag-res">
        <span>${icon('bolt', 12)}技能 <b>${skills.length}</b></span>
        <span>${icon('server', 12)}MCP <b>${mcps.length}</b></span>
        <span>${icon('sample', 12)}样本 <b>${esc(UI.num(a.samples || 0))}</b></span>
      </div>
      <div class="ag-chips">${chips.join('')}</div>
      <div class="ag-mt">
        <div class="m"><span>绑定模型</span><b title="${esc(dash(a.model))}">${esc(dash(a.model))}</b></div>
        <div class="m"><span>任务数</span><b>${esc(UI.num(a.tasks || 0))}</b></div>
        <div class="m"><span>平均 ASR</span><b style="color:${asrTone(a.asr)}">${esc(pctText(a.asr))}</b></div>
      </div>
      <div class="ag-ft">
        <button class="btn sm" data-act="chat" data-id="${a.id}">${icon('play', 12)}对话测试</button>
        <button class="btn sm" data-act="config" data-id="${a.id}">${icon('key', 12)}配置</button>
        <button class="btn sm" data-act="chain" data-id="${a.id}">${icon('arrow', 12)}攻击链</button>
        <button class="btn sm" data-act="tactic" data-id="${a.id}">${icon('bolt', 12)}战术编排</button>
      </div>
    </div>`;
  }

  /* ---------------------------------------------------------- 新建智能体 */
  function newAgentModal(ctx, onCreated) {
    const scenarios = (ctx.scenarios || []).length ? ctx.scenarios : ['数据安全', '提示词越狱', '智能体应用', 'MCP安全', 'AI基础设施'];
    const models = (ctx.models || []).slice().sort((a, b) => {
      const sa = (a.kind === 'chat' ? 2 : 0) + (a.category === '模型接口' ? 1 : 0) + (a.status === '停用' ? 0 : 1);
      const sb = (b.kind === 'chat' ? 2 : 0) + (b.category === '模型接口' ? 1 : 0) + (b.status === '停用' ? 0 : 1);
      return sb - sa;
    });
    const libs = ctx.libs || [];
    const pickedLibs = new Set();
    const m = track(UI.modal({
      title: '新建攻击智能体',
      okText: '创建智能体',
      body: `
        <div class="dr-2col">
          <div class="na-sec">
            <div class="na-lab">智能体名称 <span style="color:var(--danger)">*</span></div>
            <input id="na-name" class="input" maxlength="30" placeholder="例如：多轮诱导猎手">
          </div>
          <div class="na-sec">
            <div class="na-lab">攻击场景</div>
            <select id="na-scenario" class="select">
              ${scenarios.map((s) => `<option value="${esc(s)}">${esc(s)}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="na-sec">
          <div class="na-lab">智能体描述</div>
          <textarea id="na-descr" class="textarea" rows="3" placeholder="描述攻击目标、策略与适用边界…"></textarea>
        </div>
        <div class="na-sec">
          <div class="na-lab">绑定模型</div>
          <select id="na-model" class="select">
            ${models.length
              ? models.map((md) => `<option value="${md.id}">${esc(md.name)}${md.category ? ' · ' + esc(md.category) : ''}</option>`).join('')
              : '<option value="1">暂无可用模型</option>'}
          </select>
        </div>
        <div class="na-sec">
          <div class="na-lab">绑定样本库<span class="dim" style="font-weight:400">多选</span></div>
          <div class="na-chips" id="na-libs">${chipPicker(libs.map((l) => ({ v: l.name, t: `${l.name} · ${l.count || 0} 条` })), pickedLibs)}</div>
          <div class="dr-hint" style="margin-top:6px;color:var(--warn)">后端 agent 表暂未提供样本库绑定字段，创建仅落库名称 / 场景 / 描述 / 绑定模型，样本库选择不会持久化。</div>
        </div>
        <div class="na-err" id="na-err"></div>`,
      onOk: async (el) => {
        const name = el.querySelector('#na-name').value.trim();
        const err = el.querySelector('#na-err');
        if (!name) { err.textContent = '智能体名称不能为空'; return false; }
        const payload = {
          name: name,
          scenario: el.querySelector('#na-scenario').value,
          descr: el.querySelector('#na-descr').value.trim(),
          model_id: Number(el.querySelector('#na-model').value) || 1,
          skills: [],
          mcps: [],
          sample_libs: Array.from(pickedLibs)
        };
        try {
          await API.post('/api/agents', payload);
        } catch (e) {
          err.textContent = '创建失败：' + ((e && e.message) || '接口异常');
          return false;
        }
        UI.toast('智能体已创建并写入数据库');
        if (typeof onCreated === 'function') await onCreated();
        return true;
      }
    }));
    bindChips(m.el.querySelector('#na-libs'), pickedLibs);
    return m;
  }

  /* -------------------------------------------------------------- 页面状态 */
  let root = null;
  let S = null;

  function filteredAgents() {
    const q = String(S.q || '').trim().toLowerCase();
    return (S.agents || []).filter((a) => {
      if (S.scene !== 'all' && a.scenario !== S.scene) return false;
      if (!q) return true;
      const hay = [a.name, a.scenario, a.descr, (a.skills || []).join(' '), (a.mcps || []).join(' '), a.model]
        .join(' ').toLowerCase();
      return hay.indexOf(q) >= 0;
    });
  }

  function kpiCards() {
    const total = S.agents.length;
    const builtin = S.agents.filter((a) => Number(a.builtin) === 1).length;
    const online = S.agents.filter((a) => a.status === '启用' || a.status === '在线').length;
    const tasks = S.agents.reduce((s, a) => s + (Number(a.tasks) || 0), 0);
    const res = S.skills.length + S.mcps.length + S.libs.length;
    const samples = S.libs.reduce((s, l) => s + (Number(l.count) || 0), 0);
    return [
      { label: '智能体总数', value: UI.num(total), unit: '个', meta: `内置 ${builtin} · 自建 ${total - builtin}` },
      { label: '在线运行', value: UI.num(online), unit: '个', meta: total - online ? `停用 ${total - online} 个` : '全部在线' },
      { label: '累计下发任务', value: UI.num(tasks), unit: '个', meta: `覆盖 ${S.agents.filter((a) => Number(a.tasks) > 0).length} 个智能体` },
      { label: '已接入资源', value: UI.num(res), unit: '项', meta: `样本库 ${S.libs.length} · 样本 ${UI.num(samples)} 条` }
    ].map((k) => UI.kpi(k)).join('');
  }

  function skelCards(n) {
    const one = `<div class="ag" style="padding:16px 16px 0">
      <div class="skel" style="height:34px;width:60%;margin-bottom:12px"></div>
      <div class="skel" style="height:10px;margin-bottom:8px"></div>
      <div class="skel" style="height:10px;width:80%;margin-bottom:14px"></div>
      <div class="skel" style="height:22px;margin-bottom:16px"></div>
      <div class="skel" style="height:28px"></div></div>`;
    return Array.from({ length: n }).map(() => one).join('');
  }

  function matrixCard() {
    const list = filteredAgents();
    return UI.card({
      title: '智能体',
      sub: '按场景筛选 · 卡片可直接对话测试、配置、查看攻击链、编排战术',
      right: `<span class="dim tiny" id="ag-count">${list.length} / ${S.agents.length}</span>`,
      flush: true,
      body: `
        <div class="tbl-toolbar" style="gap:10px">
          <div id="ag-scene-seg">${UI.seg([{ v: 'all', t: '全部' }].concat(
            S.scenarios.map((s) => ({ v: s, t: s }))), S.scene)}</div>
          <div class="searchbox sm" style="margin-left:auto">
            ${icon('search', 14)}
            <input id="ag-q" placeholder="搜索名称 / 描述 / 技能 / 战术" value="${esc(S.q)}">
          </div>
        </div>
        <div style="padding:14px 16px 16px">
          ${!S.loaded
            ? `<div class="ag-grid">${skelCards(3)}</div>`
            : S.err.agents
              ? UI.empty('智能体加载失败', S.err.agents)
              : `<div class="ag-grid" id="ag-grid">${list.length
                  ? list.map(agentCard).join('')
                  : `<div style="grid-column:1/-1">${UI.empty('没有匹配的智能体', '先接入被测模型，再创建绑定模型的攻击智能体', '<button class="btn primary sm" data-new-agent style="margin-top:10px">新建第一个智能体</button>')}</div>`}</div>`}
        </div>`
    });
  }

  function resCard() {
    return UI.card({
      title: '资源挂载',
      sub: 'MCP 服务扫描与实测调用，以及智能体可挂载的技能与样本库',
      right: `<span class="dim tiny">技能 ${S.skills.length} · MCP ${S.mcps.length} · 样本库 ${S.libs.length}</span>`,
      flush: true,
      body: `<div class="res-tabs" id="res-tabs"></div><div id="res-body"></div>`
    });
  }

  function drawMcp(box) {
    const tools = S.mcps.reduce((s, x) => s + (Number(x.tools) || 0), 0);
    const linked = S.mcps.filter((x) => x.status === '已连接').length;
    box.innerHTML = `
      <div class="res-bar">
        <div class="rg">
          <span>共 <b>${S.mcps.length}</b> 个服务</span>
          <span>工具 ${tools} 个</span>
          <span>已连接 ${linked} 个</span>
        </div>
        <button class="btn sm primary" data-new-mcp>${icon('plus', 13)}注册 MCP 服务</button>
      </div>
      ${S.err.mcps
        ? `<div style="padding:18px">${UI.empty('MCP 服务加载失败', S.err.mcps)}</div>`
        : S.mcps.length
          ? `<div>${S.mcps.map(mcpRow).join('')}</div>`
          : `<div style="padding:18px">${UI.empty('暂无 MCP 服务', '注册后即可被智能体挂载并调用工具')}</div>`}
      ${S.mcpBuiltin.length ? `<div style="padding:11px 16px;border-top:1px solid var(--line-2)">
        <div class="dr-hint">平台内置工具 ${S.mcpBuiltin.length} 个：${S.mcpBuiltin.map((b) => esc(b.name)).join('、')}</div>
      </div>` : ''}`;
  }

  function drawSkills(box) {
    const kinds = ['全部'].concat(Array.from(new Set(S.skills.map((s) => s.kind).filter(Boolean))));
    const list = S.kind === '全部' ? S.skills : S.skills.filter((s) => s.kind === S.kind);
    const enabled = S.skills.filter((s) => s.status === '启用').length;
    box.innerHTML = `
      <div class="res-bar">
        <div id="sk-filter">${UI.seg(kinds.map((k) => ({ v: k, t: k })), S.kind)}</div>
        <div class="row" style="gap:12px;align-items:center">
          <span class="dr-hint">共 ${S.skills.length} 个 · 启用 ${enabled} 个</span>
          <button class="btn sm primary" data-new-skill>${icon('plus', 13)}新建技能</button>
        </div>
      </div>
      ${S.err.skills
        ? `<div style="padding:18px">${UI.empty('技能库加载失败', S.err.skills)}</div>`
        : list.length
          ? `<div>${list.map(skillRowTab).join('')}</div>`
          : `<div style="padding:18px">${UI.empty('暂无技能', '新建技能后可在智能体配置中挂载')}</div>`}`;
  }

  function drawLibs(box) {
    const total = S.libs.reduce((s, l) => s + (Number(l.count) || 0), 0);
    box.innerHTML = `
      <div class="res-bar">
        <div class="rg"><span>共 <b>${S.libs.length}</b> 个样本库</span><span>样本合计 ${UI.num(total)} 条</span></div>
        <button class="btn sm primary" data-new-lib>${icon('plus', 13)}新建样本库</button>
      </div>
      ${S.err.libs
        ? `<div style="padding:18px">${UI.empty('样本库加载失败', S.err.libs)}</div>`
        : S.libs.length
          ? `<div class="sl-grid">${S.libs.map(libCard).join('')}</div>`
          : `<div style="padding:18px">${UI.empty('暂无样本库', '新建后即可在智能体配置中挂载')}</div>`}`;
  }

  function drawRes() {
    if (!root) return;
    const tabsEl = root.querySelector('#res-tabs');
    const bodyEl = root.querySelector('#res-body');
    if (!tabsEl || !bodyEl) return;
    tabsEl.innerHTML = UI.tabs([
      { v: 'mcp', t: `MCP 服务 ${S.mcps.length}` },
      { v: 'skill', t: `技能库 ${S.skills.length}` },
      { v: 'lib', t: `样本库 ${S.libs.length}` }
    ], S.tab);
    if (S.tab === 'mcp') drawMcp(bodyEl);
    else if (S.tab === 'skill') drawSkills(bodyEl);
    else drawLibs(bodyEl);
  }

  function drawAgentsGrid() {
    if (!root) return;
    const list = filteredAgents();
    const grid = root.querySelector('#ag-grid');
    if (grid) {
      grid.innerHTML = list.length
        ? list.map(agentCard).join('')
        : `<div style="grid-column:1/-1">${UI.empty('没有匹配的智能体', '先接入被测模型，再创建绑定模型的攻击智能体', '<button class="btn primary sm" data-new-agent style="margin-top:10px">新建第一个智能体</button>')}</div>`;
    }
    const cnt = root.querySelector('#ag-count');
    if (cnt) cnt.textContent = `${list.length} / ${S.agents.length}`;
    const seg = root.querySelector('#ag-scene-seg');
    if (seg) seg.querySelectorAll('[data-seg]').forEach((b) => {
      b.classList.toggle('on', b.dataset.seg === S.scene);
    });
  }

  function sceneStats() {
    const map = {};
    S.agents.forEach((a) => {
      const k = a.scenario || '未分类';
      map[k] = (map[k] || 0) + 1;
    });
    return Object.keys(map).sort((a, b) => map[b] - map[a])
      .map((k, i) => ({ k: esc(k), v: map[k], color: AVA[i % AVA.length] }));
  }

  function libBars() {
    if (!S.libs.length) return '<div class="dr-hint" style="padding:6px 0">暂无样本库数据</div>';
    const list = S.libs.slice().sort((a, b) => (Number(b.count) || 0) - (Number(a.count) || 0)).slice(0, 6);
    return Charts.hbars(list.map((l) => ({ k: l.name, v: Number(l.count) || 0 })),
      { labelW: 118, valW: 52, unit: ' 条', gap: 11, h: 8 });
  }

  function agentBars() {
    if (!S.agents.length) return '<div class="dr-hint" style="padding:6px 0">暂无智能体数据</div>';
    const list = S.agents.slice().sort((a, b) => (Number(b.tasks) || 0) - (Number(a.tasks) || 0)).slice(0, 6);
    return Charts.hbars(list.map((a) => ({ k: a.name, v: Number(a.tasks) || 0 })),
      { labelW: 118, valW: 48, unit: ' 个', gap: 11, h: 8, color: '#6B47E8' });
  }

  function chartCards() {
    return `
      ${UI.card({
        title: '攻击场景分布',
        sub: '按场景统计智能体数量',
        body: S.loaded
          ? (S.agents.length ? Charts.donut(sceneStats(), {
              size: 150, thickness: 14, center: String(S.agents.length), centerSub: '智能体'
            }) : '<div class="dr-hint">暂无智能体数据</div>')
          : '<div class="skel" style="height:150px"></div>'
      })}
      ${UI.card({
        title: '样本承载',
        sub: '按样本库样本数排序',
        body: S.loaded ? libBars() : '<div class="skel" style="height:130px"></div>'
      })}
      ${UI.card({
        title: '任务承载',
        sub: '按智能体累计任务数排序',
        body: S.loaded ? agentBars() : '<div class="skel" style="height:130px"></div>'
      })}`;
  }

  function render() {
    if (!root) return;
    root.innerHTML = `
      ${UI.pageHd({
        title: '攻击智能体',
        sub: '内置与自建智能体 · 可挂载技能、MCP 与样本库 · 支持战术编排',
        actions: `<button class="btn" data-nav="skill">${icon('bolt', 14)}技能库</button>
          <button class="btn" data-nav="mcp">${icon('server', 14)}MCP 服务</button>
          <button class="btn" data-nav="lib">${icon('sample', 14)}样本库</button>
          <button class="btn ghost" data-refresh>${icon('refresh', 14)}刷新</button>
          <button class="btn primary" data-new-agent>${icon('plus', 14)}新建智能体</button>`
      })}
      <div class="grid g-4 mt16">${S.loaded ? kpiCards() : ''}</div>
      <div class="mt16">${matrixCard()}</div>
      <div class="mt16">${resCard()}</div>
      <div class="grid g-3 mt16">${chartCards()}</div>`;
    drawRes();
  }

  /* -------------------------------------------------------------- 数据加载 */
  const ENDPOINTS = {
    agents: '/api/agents',
    skills: '/api/skills',
    mcps: '/api/mcp',
    libs: '/api/sample-libs',
    models: '/api/models'
  };

  function applyData(key, d) {
    const data = d || {};
    if (key === 'agents') {
      S.agents = data.items || [];
      S.scenarios = (data.scenarios || []).filter(Boolean);
    } else if (key === 'skills') {
      S.skills = data.items || [];
    } else if (key === 'mcps') {
      S.mcps = data.items || [];
      S.mcpBuiltin = data.builtin || [];
    } else if (key === 'libs') {
      S.libs = data.items || [];
    } else if (key === 'models') {
      S.models = data.items || [];
    }
  }

  async function loadOne(key) {
    try {
      applyData(key, await API.get(ENDPOINTS[key]));
      S.err[key] = '';
    } catch (e) {
      if (!S) return;
      S.err[key] = (e && e.message) || '接口异常';
    }
  }

  async function loadAll() {
    await Promise.all(Object.keys(ENDPOINTS).map((k) => loadOne(k)));
    S.loaded = true;
  }

  async function reloadAgents() { await loadOne('agents'); render(); }
  async function reloadMcp() { await loadOne('mcps'); render(); }
  async function reloadSkills() { await loadOne('skills'); render(); }
  async function reloadLibs() { await loadOne('libs'); render(); }

  /* ---------------------------------------------------------- MCP 操作 */
  function renderMcpRes(id) {
    if (!root) return;
    const el = root.querySelector('#mpres-' + id);
    if (el) el.innerHTML = mcpResHTML(id);
  }

  async function scanMcp(id, btn) {
    const st = S.res[id] || (S.res[id] = {});
    st.scanLoading = true;
    st.scanErr = '';
    renderMcpRes(id);
    if (btn) btn.disabled = true;
    try {
      st.scan = await API.get(`/api/mcp/${id}/scan`);
      const risk = (st.scan && st.scan.risk) || '—';
      const rate = st.scan && st.scan.interceptRate != null ? st.scan.interceptRate + '%' : '—';
      UI.toast(`扫描完成：风险 ${risk} · 拦截率 ${rate}`, st.scan && st.scan.risk === '高' ? 'err' : undefined);
    } catch (e) {
      st.scanErr = (e && e.message) || '扫描失败';
      UI.toast('投毒扫描失败：' + st.scanErr, 'err');
    } finally {
      st.scanLoading = false;
      renderMcpRes(id);
      if (btn) btn.disabled = false;
    }
  }

  async function invokeMcp(id, btn) {
    const st = S.res[id] || (S.res[id] = {});
    st.invLoading = true;
    st.invErr = '';
    renderMcpRes(id);
    if (btn) btn.disabled = true;
    try {
      st.inv = await API.post(`/api/mcp/${id}/invoke`, { method: 'tools/list' });
      const r = st.inv || {};
      const n = ((r.result && r.result.tools) || r.tools || []).length;
      UI.toast(`实测调用完成：${r.mode || '—'}${r.ok === false ? ' · 失败' : ''}${n ? ' · ' + n + ' 个工具' : ''}`,
        r.ok === false ? 'err' : undefined);
    } catch (e) {
      st.invErr = (e && e.message) || '调用失败';
      UI.toast('实测调用失败：' + st.invErr, 'err');
    } finally {
      st.invLoading = false;
      renderMcpRes(id);
      if (btn) btn.disabled = false;
    }
  }

  /* -------------------------------------------------------------- 事件委托 */
  function onRootClick(ev) {
    const t = ev.target;
    if (!t || !root || !root.contains(t)) return;

    const actBtn = t.closest('[data-act]');
    if (actBtn) {
      const a = S.agents.find((x) => Number(x.id) === Number(actBtn.dataset.id));
      if (!a) return;
      const act = actBtn.dataset.act;
      if (act === 'chat') chatDrawer(a);
      else if (act === 'config') configDrawer(a, { skills: S.skills, mcps: S.mcps, libs: S.libs, models: S.models });
      else if (act === 'chain') chainDrawer(a);
      else if (act === 'tactic') tacticDrawer(a, () => reloadAgents());
      return;
    }

    const nav = t.closest('[data-nav]');
    if (nav) {
      S.tab = nav.dataset.nav;
      drawRes();
      const tabs = root.querySelector('#res-tabs');
      if (tabs && tabs.closest('.card')) {
        tabs.closest('.card').scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }

    if (t.closest('[data-refresh]')) {
      S.loaded = false;
      render();
      loadAll().then(() => {
        if (!root) return;
        render();
        UI.toast('数据已刷新');
      });
      return;
    }

    if (t.closest('[data-new-agent]')) {
      newAgentModal({ scenarios: S.scenarios, models: S.models, libs: S.libs },
        async () => { await loadOne('agents'); render(); });
      return;
    }

    const tabBtn = t.closest('#res-tabs [data-tab]');
    if (tabBtn) {
      S.tab = tabBtn.dataset.tab;
      drawRes();
      return;
    }

    const segBtn = t.closest('[data-seg]');
    if (segBtn) {
      if (segBtn.closest('#ag-scene-seg')) {
        S.scene = segBtn.dataset.seg;
        drawAgentsGrid();
      } else if (segBtn.closest('#sk-filter')) {
        S.kind = segBtn.dataset.seg;
        drawRes();
      }
      return;
    }

    const scanBtn = t.closest('[data-mcp-scan]');
    if (scanBtn) { scanMcp(Number(scanBtn.dataset.mcpScan), scanBtn); return; }

    const invBtn = t.closest('[data-mcp-invoke]');
    if (invBtn) { invokeMcp(Number(invBtn.dataset.mcpInvoke), invBtn); return; }

    const editBtn = t.closest('[data-mcp-edit]');
    if (editBtn) {
      const item = S.mcps.find((x) => Number(x.id) === Number(editBtn.dataset.mcpEdit));
      if (item) mcpModal(item, () => reloadMcp());
      return;
    }

    const delBtn = t.closest('[data-mcp-del]');
    if (delBtn) {
      const id = Number(delBtn.dataset.mcpDel);
      const item = S.mcps.find((x) => Number(x.id) === id) || { name: '该服务' };
      confirmModal('删除 MCP 服务', `确认移除「${esc(item.name)}」？已挂载该服务的智能体将无法再调用其工具。`, async () => {
        await API.del(`/api/mcp/${id}`);
        delete S.res[id];
        UI.toast('MCP 服务已移除');
        await reloadMcp();
      });
      return;
    }

    if (t.closest('[data-new-mcp]')) { mcpModal(null, () => reloadMcp()); return; }
    if (t.closest('[data-new-skill]')) { newSkillModal(() => reloadSkills()); return; }
    if (t.closest('[data-new-lib]')) { newLibModal(() => reloadLibs()); return; }

    const skBtn = t.closest('[data-sk-detail]');
    if (skBtn) {
      const s = S.skills.find((x) => Number(x.id) === Number(skBtn.dataset.skDetail));
      if (s) skillDetailDrawer(s, () => reloadSkills());
    }
  }

  function onRootInput(ev) {
    if (ev.target && ev.target.id === 'ag-q') {
      S.q = ev.target.value;
      drawAgentsGrid();
    }
  }

  /* ------------------------------------------------------------------ 挂载 */
  w.Pages = w.Pages || {};
  w.Pages.agents = {
    cockpit: false,
    async mount(el) {
      root = el;
      injectStyle();
      S = {
        agents: [], scenarios: [], skills: [], mcps: [], mcpBuiltin: [], libs: [], models: [],
        scene: 'all', q: '', tab: 'mcp', kind: '全部',
        res: {}, err: {}, loaded: false
      };
      root.addEventListener('click', onRootClick);
      root.addEventListener('input', onRootInput);
      render();
      await loadAll();
      if (!root) return null;
      render();
      return () => {
        if (root) {
          root.removeEventListener('click', onRootClick);
          root.removeEventListener('input', onRootInput);
        }
        clearLayers();
        const st = document.getElementById('pg-agents');
        if (st) st.remove();
        root = null;
        S = null;
      };
    }
  };

})(window);
