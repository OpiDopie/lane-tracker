/* ============================================================
   utils.js — date math, formatting, small pure helpers
   ============================================================ */

function todayStr() {
  return toDateStr(new Date());
}

function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDateStr(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function daysBetween(a, b) {
  const MS = 1000 * 60 * 60 * 24;
  const da = parseDateStr(typeof a === 'string' ? a : toDateStr(a));
  const db = parseDateStr(typeof b === 'string' ? b : toDateStr(b));
  return Math.round((db - da) / MS);
}

// Monday-start week. Returns {start, end} Date objects (Mon..Sun) containing d.
function weekRangeContaining(d) {
  const date = new Date(d);
  const day = date.getDay(); // 0 Sun .. 6 Sat
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = addDays(date, diffToMonday);
  start.setHours(0, 0, 0, 0);
  const end = addDays(start, 6);
  return { start, end };
}

function formatDateShort(dateOrStr) {
  const d = typeof dateOrStr === 'string' ? parseDateStr(dateOrStr) : dateOrStr;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatDateLong(dateOrStr) {
  const d = typeof dateOrStr === 'string' ? parseDateStr(dateOrStr) : dateOrStr;
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
}

function formatWeekday(dateOrStr) {
  const d = typeof dateOrStr === 'string' ? parseDateStr(dateOrStr) : dateOrStr;
  return d.toLocaleDateString(undefined, { weekday: 'long' });
}

function fmtNum(n, decimals = 1) {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  return Number(n).toFixed(decimals);
}

function fmtSigned(n, decimals = 1) {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  const v = Number(n);
  const sign = v > 0 ? '+' : '';
  return `${sign}${v.toFixed(decimals)}`;
}

function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }
  return `${m}:${String(sec).padStart(2, '0')}`;
}

// group a { 'YYYY-MM-DD': value } map into weeks, most recent first
// valueFn extracts a number from the stored value
function buildWeeklySummary(logMap, valueFn) {
  const dates = Object.keys(logMap).sort();
  if (dates.length === 0) return [];
  const weeksMap = new Map(); // key: monday date string -> {start,end,values:[{date,value}]}
  dates.forEach(dateStr => {
    const d = parseDateStr(dateStr);
    const { start, end } = weekRangeContaining(d);
    const key = toDateStr(start);
    if (!weeksMap.has(key)) weeksMap.set(key, { start, end, entries: [] });
    const val = valueFn(logMap[dateStr]);
    if (val !== null && val !== undefined && !Number.isNaN(val)) {
      weeksMap.get(key).entries.push({ date: dateStr, value: val });
    }
  });
  const weeks = Array.from(weeksMap.values()).sort((a, b) => b.start - a.start);
  weeks.forEach(w => {
    w.avg = w.entries.length ? w.entries.reduce((s, e) => s + e.value, 0) / w.entries.length : null;
  });
  // compute week-over-week change (this week avg - previous week avg)
  for (let i = 0; i < weeks.length; i++) {
    const prev = weeks[i + 1];
    weeks[i].change = (weeks[i].avg !== null && prev && prev.avg !== null) ? weeks[i].avg - prev.avg : null;
  }
  return weeks;
}

function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

// Build a lightweight inline SVG line chart. points: [{date, value}] oldest->newest.
function buildSparkline(points, { width = 320, height = 110, color = 'var(--accent)', goalValue = null } = {}) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('class', 'sparkline');
  if (points.length < 2) {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', width / 2);
    text.setAttribute('y', height / 2);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('class', 'sparkline-empty');
    text.textContent = 'Log a few more days to see a trend';
    svg.appendChild(text);
    return svg;
  }
  const pad = 10;
  const values = points.map(p => p.value);
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (goalValue !== null) { min = Math.min(min, goalValue); max = Math.max(max, goalValue); }
  if (min === max) { min -= 1; max += 1; }
  const xStep = (width - pad * 2) / (points.length - 1);
  const yFor = v => height - pad - ((v - min) / (max - min)) * (height - pad * 2);
  const xFor = i => pad + i * xStep;

  if (goalValue !== null) {
    const gy = yFor(goalValue);
    const goalLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    goalLine.setAttribute('x1', pad); goalLine.setAttribute('x2', width - pad);
    goalLine.setAttribute('y1', gy); goalLine.setAttribute('y2', gy);
    goalLine.setAttribute('class', 'sparkline-goal-line');
    svg.appendChild(goalLine);
  }

  const linePts = points.map((p, i) => `${xFor(i)},${yFor(p.value)}`).join(' ');
  const areaPts = `${xFor(0)},${height - pad} ${linePts} ${xFor(points.length - 1)},${height - pad}`;

  const area = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  area.setAttribute('points', areaPts);
  area.setAttribute('class', 'sparkline-area');
  svg.appendChild(area);

  const line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  line.setAttribute('points', linePts);
  line.setAttribute('class', 'sparkline-line');
  svg.appendChild(line);

  const lastDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  lastDot.setAttribute('cx', xFor(points.length - 1));
  lastDot.setAttribute('cy', yFor(points[points.length - 1].value));
  lastDot.setAttribute('r', 4);
  lastDot.setAttribute('class', 'sparkline-dot');
  svg.appendChild(lastDot);

  return svg;
}

// small shared UI helpers
function emptyState(title, body, actionLabel, onAction) {
  return el('div', { class: 'empty-state' }, [
    el('h3', {}, title),
    el('p', {}, body),
    actionLabel ? el('button', { class: 'btn btn-primary', onclick: onAction }, actionLabel) : null
  ]);
}

function confirmModal(title, body, confirmLabel, onConfirm, danger = true) {
  const modalRoot = document.getElementById('modal-root');
  modalRoot.innerHTML = '';
  const overlay = el('div', { class: 'modal-overlay', onclick: (e) => { if (e.target === overlay) close(); } });
  const box = el('div', { class: 'modal-box' }, [
    el('h3', {}, title),
    el('p', {}, body),
    el('div', { class: 'modal-actions' }, [
      el('button', { class: 'btn btn-ghost', onclick: () => close() }, 'Cancel'),
      el('button', { class: `btn ${danger ? 'btn-danger' : 'btn-primary'}`, onclick: () => { close(); onConfirm(); } }, confirmLabel)
    ])
  ]);
  function close() { modalRoot.innerHTML = ''; }
  overlay.appendChild(box);
  modalRoot.appendChild(overlay);
}

function toast(message) {
  const root = document.getElementById('toast-root');
  const t = el('div', { class: 'toast' }, message);
  root.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 300);
  }, 2200);
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (v !== undefined && v !== null) node.setAttribute(k, v);
  });
  (Array.isArray(children) ? children : [children]).forEach(c => {
    if (c === null || c === undefined) return;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return node;
}
