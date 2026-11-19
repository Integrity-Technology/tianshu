/* ============================================================================
   轻量 SVG 图表库（无依赖，服务端返回的 JSON 直接渲染）
   ========================================================================== */
(function (w) {
  const P = {
    brand: '#2C55E6', brand2: '#6B47E8', ok: '#0B9E6E', warn: '#D98A1B',
    danger: '#D93B3B', cyan: '#0E9DB3', violet: '#6B47E8', gray: '#94A0B8'
  };
  const D = {
    line: 'rgba(255,255,255,.08)', text: '#6B7689', text2: '#94A0B8',
    brand: '#4E77FF', brand2: '#8E6BFF', ok: '#35D6A4', warn: '#F0B454', danger: '#FF6B6B'
  };
  const EMPTY = '<div class="tiny muted" style="padding:14px">暂无数据</div>';

  const H = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const n = (v, fb) => {
    const x = Number(v);
    return Number.isFinite(x) ? x : (fb == null ? 0 : fb);
  };
  const f = (x) => (Math.round(n(x) * 100) / 100).toString();

  /* 平滑路径（单调三次贝塞尔近似） */
  function smooth(pts) {
    if (pts.length < 2) return '';
    let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ` C${f(c1x)},${f(c1y)} ${f(c2x)},${f(c2y)} ${f(p2[0])},${f(p2[1])}`;
    }
    return d;
  }

  let uid = 0;
  const nid = () => 'g' + (++uid);

  /** 面积折线图 */
  function area(data, opt = {}) {
    data = (Array.isArray(data) ? data : []).filter((d) => d && Number.isFinite(Number(d.v)));
    if (!data.length) return EMPTY;
    const w = n(opt.w, 640), h = n(opt.h, 180), pad = opt.pad || [12, 10, 24, 34];
    const dark = !!opt.dark;
    const color = opt.color || (dark ? D.brand : P.brand);
    const vals = data.map((d) => Number(d.v));
    const rawMax = Math.max(...vals) * 1.15;
    const max = n(opt.max, rawMax) || 1;
    const min = opt.min != null ? n(opt.min) : 0;
    const span = max - min || 1;
    const iw = w - pad[1] - pad[3], ih = h - pad[0] - pad[2];
    const X = (i) => pad[3] + (data.length === 1 ? iw / 2 : (i / (data.length - 1)) * iw);
    const Y = (v) => pad[0] + ih - ((v - min) / span) * ih;
    const pts = data.map((d, i) => [X(i), Y(Number(d.v))]);
    const id = nid();
    const gridN = opt.gridN || 4;
    let g = '';
    if (typeof opt.yLabel === 'string' && opt.yLabel) {
      g += `<text x="${pad[3]}" y="8" font-size="9.5" fill="${dark ? D.text : '#98A0AF'}">${H(opt.yLabel)}</text>`;
    }
    for (let i = 0; i <= gridN; i++) {
      const y = pad[0] + (ih / gridN) * i;
      const v = max - ((max - min) / gridN) * i;
      g += `<line x1="${pad[3]}" y1="${f(y)}" x2="${w - pad[1]}" y2="${f(y)}" stroke="${dark ? D.line : '#EEF1F6'}" stroke-dasharray="${i === gridN ? '0' : '3 4'}"/>`;
      if (opt.yLabel !== false)
        g += `<text x="${pad[3] - 8}" y="${f(y + 3)}" text-anchor="end" font-size="9.5" fill="${dark ? D.text : '#98A0AF'}">${Math.round(v)}${H(opt.unit || '')}</text>`;
    }
    const line = smooth(pts);
    const areaD = vals.length === 1
      ? `M${f(pts[0][0] - 18)},${f(pts[0][1])} L${f(pts[0][0] + 18)},${f(pts[0][1])} L${f(pts[0][0] + 18)},${pad[0] + ih} L${f(pts[0][0] - 18)},${pad[0] + ih} Z`
      : `${line} L${f(pts[pts.length - 1][0])},${pad[0] + ih} L${f(pts[0][0])},${pad[0] + ih} Z`;
    let dots = '';
    if (opt.dots !== false) {
      const step = Math.max(1, Math.ceil(data.length / 10));
      data.forEach((d, i) => {
        if (i % step && i !== data.length - 1) return;
        dots += `<circle cx="${f(pts[i][0])}" cy="${f(pts[i][1])}" r="3" fill="${dark ? '#0D131F' : '#fff'}" stroke="${color}" stroke-width="1.8"/>`;
      });
    }
    if (opt.xLabel !== false) {
      const labels = Array.isArray(opt.labels) ? opt.labels : data.map((d) => d.k);
      const step = Math.max(1, Math.ceil(data.length / 7));
      data.forEach((d, i) => {
        if (i % step && i !== data.length - 1) return;
        g += `<text x="${f(pts[i][0])}" y="${h - 6}" text-anchor="middle" font-size="9.5" fill="${dark ? D.text : '#98A0AF'}">${H(labels[i] != null ? labels[i] : d.k)}</text>`;
      });
    }
    return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" preserveAspectRatio="none" style="overflow:visible">
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${color}" stop-opacity="${dark ? .34 : .20}"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
      ${g}<path d="${areaD}" fill="url(#${id})"/><path d="${line || 'M0,0'}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round"/>${dots}
    </svg>`;
  }

  /** 迷你走势 */
  function spark(data, opt = {}) {
    const vals = (Array.isArray(data) ? data : [])
      .map((d) => (typeof d === 'number' ? d : d && d.v))
      .map(Number).filter((v) => Number.isFinite(v));
    if (!vals.length) return EMPTY;
    const w = n(opt.w, 108), h = n(opt.h, 34);
    const color = opt.color || P.brand;
    if (vals.length === 1) {
      return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-label="单点走势">
        <line x1="3" y1="${h / 2}" x2="${w - 3}" y2="${h / 2}" stroke="${color}" stroke-opacity=".22" stroke-width="1"/>
        <circle cx="${w / 2}" cy="${h / 2}" r="2.6" fill="${color}"/></svg>`;
    }
    const max = Math.max(...vals), min = Math.min(...vals);
    const pts = vals.map((v, i) => [2 + (i / (vals.length - 1)) * (w - 4), h - 3 - ((v - min) / ((max - min) || 1)) * (h - 8)]);
    const id = nid();
    return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${color}" stop-opacity=".22"/><stop offset="100%" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
      <path d="${smooth(pts)} L${w - 2},${h} L2,${h} Z" fill="url(#${id})"/>
      <path d="${smooth(pts)}" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round"/>
      <circle cx="${f(pts[pts.length - 1][0])}" cy="${f(pts[pts.length - 1][1])}" r="2.4" fill="${color}"/>
    </svg>`;
  }

  /** 柱状图 */
  function bars(data, opt = {}) {
    data = (Array.isArray(data) ? data : []).filter((d) => d && Number.isFinite(Number(d.v)));
    if (!data.length) return EMPTY;
    const w = n(opt.w, 640), h = n(opt.h, 190), pad = [14, 10, 26, 34];
    const dark = !!opt.dark;
    const iw = w - pad[1] - pad[3], ih = h - pad[0] - pad[2];
    const rawMax = Math.max(...data.map((d) => Number(d.v))) * 1.2;
    const max = n(opt.max, rawMax) || 1;
    const bw = (iw / data.length) * (opt.ratio || 0.56);
    let out = '';
    for (let i = 0; i <= 4; i++) {
      const y = pad[0] + (ih / 4) * i;
      out += `<line x1="${pad[3]}" y1="${f(y)}" x2="${w - pad[1]}" y2="${f(y)}" stroke="${dark ? D.line : '#EEF1F6'}" stroke-dasharray="3 4"/>`;
    }
    data.forEach((d, i) => {
      const v = Number(d.v);
      const x = pad[3] + (iw / data.length) * (i + 0.5) - bw / 2;
      const bh = (v / max) * ih, y = pad[0] + ih - bh;
      const col = d.color || opt.color || (dark ? D.brand : P.brand);
      out += `<rect x="${f(x)}" y="${f(y)}" width="${f(bw)}" height="${f(bh)}" rx="4" fill="${col}" opacity="${opt.opacity || .92}"><title>${H(d.k)}：${H(d.v)}${H(opt.unit || '')}</title></rect>`;
      out += `<text x="${f(x + bw / 2)}" y="${h - 8}" text-anchor="middle" font-size="9.5" fill="${dark ? D.text : '#98A0AF'}">${H(d.k)}</text>`;
      if (opt.valueLabel) out += `<text x="${f(x + bw / 2)}" y="${f(y - 5)}" text-anchor="middle" font-size="9.5" fill="${dark ? D.text2 : '#6B7280'}">${H(d.v)}</text>`;
    });
    return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}">${out}</svg>`;
  }

  /** 横向排行 */
  function hbars(data, opt = {}) {
    data = (Array.isArray(data) ? data : []).filter((d) => d && Number.isFinite(Number(d.v)));
    if (!data.length) return EMPTY;
    const dark = !!opt.dark;
    const max = Math.max(...data.map((d) => Number(d.v))) || 1;
    return data.map((d) => {
      const pct = Math.max(0, Math.min(100, Math.round((Number(d.v) / max) * 100)));
      const col = d.color || opt.color || (dark ? D.brand : P.brand);
      return `<div style="display:flex;align-items:center;gap:10px;margin-bottom:${opt.gap || 10}px">
        <div style="width:${opt.labelW || 96}px;font-size:11.5px;color:var(--text-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${H(d.k)}</div>
        <div style="flex:1;height:${opt.h || 7}px;background:${dark ? 'rgba(255,255,255,.07)' : '#EFF2F7'};border-radius:20px;overflow:hidden">
          <div style="width:${pct}%;height:100%;border-radius:20px;background:${col};opacity:.9"></div>
        </div>
        <div style="width:${opt.valW || 46}px;text-align:right;font-size:11.5px;color:var(--text);font-weight:550" class="num">${opt.fmt ? H(opt.fmt(d.v)) : H(d.v) + H(opt.unit || '')}</div>
      </div>`;
    }).join('');
  }

  /** 环形图 */
  function donut(data, opt = {}) {
    data = (Array.isArray(data) ? data : []).filter((d) => d && Number.isFinite(Number(d.v)) && Number(d.v) > 0);
    if (!data.length) return EMPTY;
    const size = n(opt.size, 148), r = size / 2 - 10, cx = size / 2, cy = size / 2;
    const total = data.reduce((s, d) => s + Number(d.v), 0) || 1;
    let acc = 0, segs = '';
    data.forEach((d) => {
      const frac = Number(d.v) / total, a0 = acc * Math.PI * 2 - Math.PI / 2;
      acc += frac;
      const a1 = acc * Math.PI * 2 - Math.PI / 2 - 0.02;
      const large = frac > 0.5 ? 1 : 0;
      const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
      const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
      segs += `<path d="M${f(x0)},${f(y0)} A${r},${r} 0 ${large} 1 ${f(x1)},${f(y1)}" fill="none"
        stroke="${d.color}" stroke-width="${opt.thickness || 13}" stroke-linecap="round" opacity=".95"><title>${H(d.k)}：${H(d.v)}</title></path>`;
    });
    return `<div style="display:flex;align-items:center;gap:18px;flex-wrap:wrap">
      <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${opt.dark ? 'rgba(255,255,255,.06)' : '#F1F3F8'}" stroke-width="${opt.thickness || 13}"/>
        ${segs}
        <text x="${cx}" y="${cy - 2}" text-anchor="middle" font-size="20" font-weight="650" fill="${opt.dark ? '#fff' : 'var(--text)'}" style="letter-spacing:-.03em">${H(opt.center || total)}</text>
        <text x="${cx}" y="${cy + 15}" text-anchor="middle" font-size="9.5" fill="${opt.dark ? '#94A0B8' : '#98A0AF'}">${H(opt.centerSub || '总计')}</text>
      </svg>
      <div class="legend" style="flex-direction:column;gap:7px">${data.map((d) =>
        `<span class="li"><i style="background:${d.color}"></i>${H(d.k)}
         <b style="margin-left:4px;font-weight:600">${H(d.v)}</b>
         <span class="dim" style="margin-left:2px">${Math.round(Number(d.v) / total * 100)}%</span></span>`).join('')}</div>
    </div>`;
  }

  /** 雷达图 */
  function radar(dims, opt = {}) {
    dims = dims && typeof dims === 'object' ? dims : {};
    const keys = Object.keys(dims).filter((k) => Number.isFinite(Number(dims[k])));
    if (keys.length < 3) return EMPTY;
    const size = n(opt.size, 260), cx = size / 2, cy = size / 2 + 4, R = size / 2 - 46;
    const nKeys = keys.length;
    const max = n(opt.max, 100) || 100;
    const ang = (i) => (Math.PI * 2 * i) / nKeys - Math.PI / 2;
    const pt = (i, v) => [cx + (n(v) / max) * R * Math.cos(ang(i)), cy + (n(v) / max) * R * Math.sin(ang(i))];
    let grid = '';
    [0.25, 0.5, 0.75, 1].forEach((k) => {
      const pts = keys.map((_, i) => pt(i, max * k).map(f).join(',')).join(' ');
      grid += `<polygon points="${pts}" fill="none" stroke="${opt.dark ? 'rgba(255,255,255,.09)' : '#EDF0F6'}" stroke-width="1"/>`;
    });
    keys.forEach((_, i) => {
      const p = pt(i, max);
      grid += `<line x1="${cx}" y1="${cy}" x2="${f(p[0])}" y2="${f(p[1])}" stroke="${opt.dark ? 'rgba(255,255,255,.07)' : '#EDF0F6'}"/>`;
    });
    const vals = keys.map((k) => Number(dims[k]));
    const poly = keys.map((_, i) => pt(i, vals[i]).map(f).join(',')).join(' ');
    let dots = '', labels = '';
    keys.forEach((k, i) => {
      const p = pt(i, vals[i]);
      dots += `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="3.2" fill="${opt.color || P.brand}" stroke="${opt.dark ? '#0D131F' : '#fff'}" stroke-width="1.6"/>`;
      const lp = pt(i, max * 1.2);
      const anchor = Math.abs(lp[0] - cx) < 6 ? 'middle' : lp[0] > cx ? 'start' : 'end';
      labels += `<text x="${f(lp[0])}" y="${f(lp[1] + 3.5)}" text-anchor="${anchor}" font-size="10.5" fill="${opt.dark ? '#94A0B8' : '#6B7280'}">${H(k)}</text>`;
      labels += `<text x="${f(lp[0])}" y="${f(lp[1] + 15)}" text-anchor="${anchor}" font-size="9" fill="${opt.dark ? '#5F6B80' : '#A6ADBA'}">${H(vals[i])}</text>`;
    });
    const id = nid();
    return `<svg viewBox="0 0 ${size} ${size}" width="100%" height="${size}" style="max-width:${size}px;margin:0 auto">
      <defs><radialGradient id="${id}"><stop offset="0%" stop-color="${opt.color || P.brand}" stop-opacity=".28"/>
      <stop offset="100%" stop-color="${opt.color || P.brand}" stop-opacity=".10"/></radialGradient></defs>
      ${grid}<polygon points="${poly}" fill="url(#${id})" stroke="${opt.color || P.brand}" stroke-width="2" stroke-linejoin="round"/>
      ${dots}${labels}</svg>`;
  }

  /** 热力矩阵 */
  function heat(rows, cols, opt = {}) {
    rows = Array.isArray(rows) ? rows : [];
    cols = Array.isArray(cols) ? cols : [];
    if (!rows.length || !cols.length) return EMPTY;
    const cell = n(opt.cell, 30), lw = n(opt.labelW, 104), top = 18;
    const w = lw + cols.length * cell, h = top + rows.length * cell + 4;
    const all = rows.flatMap((r) => r.vals || r.cells || []).map(Number).filter(Number.isFinite);
    const max = n(opt.max, Math.max(...all)) || 1;
    let out = '';
    cols.forEach((c, i) => {
      out += `<text x="${lw + i * cell + cell / 2}" y="11" text-anchor="middle" font-size="9.5" fill="${opt.dark ? '#6B7689' : '#98A0AF'}">${H(c)}</text>`;
    });
    rows.forEach((r, ri) => {
      const vals = r.vals || r.cells || [];
      out += `<text x="${lw - 10}" y="${top + ri * cell + cell / 2 + 3.5}" text-anchor="end" font-size="10.5" fill="${opt.dark ? '#94A0B8' : '#6B7280'}">${H(r.cat)}</text>`;
      vals.forEach((v, ci) => {
        const num = n(v), t = num / max;
        const base = [44, 85, 230];
        const col = `rgba(${base[0]},${base[1]},${base[2]},${(0.06 + Math.max(0, Math.min(1, t)) * 0.9).toFixed(3)})`;
        out += `<rect x="${lw + ci * cell + 2}" y="${top + ri * cell + 2}" width="${cell - 4}" height="${cell - 4}" rx="4" fill="${col}">
          <title>${H(r.cat)} / ${H(cols[ci])}：${H(v)}</title></rect>`;
        if (opt.showVal && cell > 26)
          out += `<text x="${lw + ci * cell + cell / 2}" y="${top + ri * cell + cell / 2 + 3.5}" text-anchor="middle" font-size="9" fill="${t > .55 ? '#fff' : (opt.dark ? '#A9B4C8' : '#4B5563')}">${H(v)}</text>`;
      });
    });
    return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}">${out}</svg>`;
  }

  /** 环形进度 */
  function gauge(pct, opt = {}) {
    const p = Math.max(0, Math.min(100, n(pct)));
    const size = n(opt.size, 120), r = size / 2 - 9, c = 2 * Math.PI * r;
    const col = opt.color || (p > 85 ? P.ok : p > 60 ? P.warn : P.danger);
    return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="${H(p + '%')}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${opt.dark ? 'rgba(255,255,255,.08)' : '#F0F2F7'}" stroke-width="8"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${col}" stroke-width="8" stroke-linecap="round"
        stroke-dasharray="${f(c * p / 100)} ${f(c)}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
      <text x="${size / 2}" y="${size / 2 + 2}" text-anchor="middle" font-size="${size > 100 ? 19 : 15}" font-weight="650"
        fill="${opt.dark ? '#fff' : 'var(--text)'}" style="letter-spacing:-.03em">${f(p)}<tspan font-size="10">%</tspan></text>
      ${opt.label ? `<text x="${size / 2}" y="${size / 2 + 17}" text-anchor="middle" font-size="9.5" fill="${opt.dark ? '#6B7689' : '#98A0AF'}">${H(opt.label)}</text>` : ''}
    </svg>`;
  }

  w.Charts = { area, spark, bars, hbars, donut, radar, heat, gauge, pal: P, dark: D, esc: H, empty: EMPTY };
})(window);
