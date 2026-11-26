// HomeLedger — charts: tiny SVG builders with no dependencies.
// Each one takes plain numbers and returns an SVG string. The donut is drawn
// as arc paths (polar coordinates), the bars as plain divs, the daily chart
// as columns. Nothing here fetches anything.

function polar(cx, cy, r, angleDeg) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

function arcPath(cx, cy, r, startDeg, endDeg) {
  const [sx, sy] = polar(cx, cy, r, startDeg);
  const [ex, ey] = polar(cx, cy, r, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${sx.toFixed(1)} ${sy.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${ex.toFixed(1)} ${ey.toFixed(1)}`;
}

// slices: [{ label, value, color }]; values must sum above zero.
export function donutChart(slices, size = 220, ring = 32) {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const mid = size / 2;
  const radius = (size - ring) / 2;
  if (total <= 0) {
    return `<svg viewBox="0 0 ${size} ${size}" class="donut-svg" role="img" aria-label="No spending yet">
      <circle cx="${mid}" cy="${mid}" r="${radius}" fill="none" stroke="#e7e0d2" stroke-width="${ring}"/>
      <text x="${mid}" y="${mid}" text-anchor="middle" class="donut-empty">No data</text></svg>`;
  }
  let angle = 0;
  const paths = slices.map((s) => {
    const span = (s.value / total) * 360;
    // A 2-degree gap keeps neighbouring slices readable.
    const path = arcPath(mid, mid, radius, angle + 1, angle + Math.max(span - 1, 0.5));
    angle += span;
    return `<path d="${path}" fill="none" stroke="${s.color}" stroke-width="${ring}"/>`;
  }).join('');
  return `<svg viewBox="0 0 ${size} ${size}" class="donut-svg" role="img" aria-label="Spending by category">
    ${paths}
    <text x="${mid}" y="${mid - 4}" text-anchor="middle" class="donut-center">$${Math.round(total).toLocaleString('en-US')}</text>
    <text x="${mid}" y="${mid + 20}" text-anchor="middle" class="donut-mid">spent</text></svg>`;
}

// One labelled horizontal bar: label and amount on top, track below, note under.
export function hbar(label, value, scale, color, note) {
  const pct = scale > 0 ? Math.min(100, (value / scale) * 100) : 0;
  const amount = '$' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `<div class="hbar">
    <div class="hbar-top"><span class="hbar-name">${label}</span><span class="hbar-amount">${amount}</span></div>
    <div class="hbar-track"><div class="hbar-fill" style="width:${pct.toFixed(1)}%;background:${color}"></div></div>
    ${note ? `<div class="hbar-note">${note}</div>` : ''}
  </div>`;
}

// The budget progress meter: a track plus a "% of budget" line that turns red
// and names the overrun once spending passes the limit.
export function budgetMeter(spent, limit, color) {
  const pct = limit > 0 ? (spent / limit) * 100 : 0;
  const over = pct > 100;
  const shown = Math.min(100, pct);
  const overBy = '$' + (spent - limit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `<div class="meter"><div class="meter-fill${over ? ' over' : ''}" style="width:${shown.toFixed(1)}%;background:${color}"></div></div>
    <div class="meter-note${over ? ' over' : ''}">${pct.toFixed(0)}% of budget${over ? ' — over by ' + overBy : ''}</div>`;
}

// days: [{ day, value }] — one column per day of the month.
export function dailyColumns(days) {
  const top = Math.max(...days.map((d) => d.value), 1);
  const w = 560;
  const h = 140;
  const slot = w / days.length;
  const bars = days.map((d, i) => {
    const height = Math.max(2, (d.value / top) * (h - 24));
    const x = (i * slot + 1).toFixed(1);
    const y = (h - 20 - height).toFixed(1);
    const shade = d.value > 0 ? 0.85 : 0.15;
    return `<rect x="${x}" y="${y}" width="${(slot - 2).toFixed(1)}" height="${height.toFixed(1)}" rx="2" fill="#2f6b4f" opacity="${shade}"><title>Day ${d.day}: $${d.value.toFixed(2)}</title></rect>`;
  }).join('');
  return `<svg viewBox="0 0 ${w} ${h}" class="daily-chart" role="img" aria-label="Daily spending">
    ${bars}
    <line x1="0" y1="${h - 20}" x2="${w}" y2="${h - 20}" stroke="#d8d0bf" stroke-width="1"/>
  </svg>`;
}
