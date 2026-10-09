/* ============================================================
   Gregory Care demo core — shared store, formatting, UI helpers
   and the workflow actions used by all three portals.
   Data lives in localStorage so the Admin Console, Caregiver
   Portal and Client App stay in sync across browser windows.
   ============================================================ */

const STORE_KEY = 'gc-demo-v1';
const DB = { state: null };
function todayStr(d) { return _ds(d || new Date()); }

function loadDB() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) { const s = JSON.parse(raw); if (s && s.version === 1 && s.seededOn === todayStr()) { DB.state = s; return s; } }
  } catch (e) { /* storage unavailable */ }
  DB.state = buildSeed(); saveDB(); return DB.state;
}
function saveDB() { try { localStorage.setItem(STORE_KEY, JSON.stringify(DB.state)); } catch (e) { console.warn(e); } }
function resetDB() { DB.state = buildSeed(); saveDB(); }
function onDBChange(cb) {
  window.addEventListener('storage', (e) => { if (e.key !== STORE_KEY || !e.newValue) return; try { DB.state = JSON.parse(e.newValue); cb(); } catch (_) { /* ignore */ } });
}

/* ---------- Lookups ---------- */
const S = () => DB.state;
const getBooking = (id) => S().bookings.find(b => b.id === id);
const getVisit = (id) => S().visits.find(v => v.id === id);
const getClient = (id) => S().clients.find(c => c.id === id);
const getRecipient = (id) => S().recipients.find(r => r.id === id);
const getCaregiver = (id) => S().caregivers.find(g => g.id === id);
const getService = (id) => S().services.find(s => s.id === id);
const visitsOf = (bid) => S().visits.filter(v => v.bookingId === bid).sort((a, b) => (a.date + a.from).localeCompare(b.date + b.from));
const firstName = (n) => (n || '').split(' ')[0];
const OWNER_ID = 'g1';

/* ---------- Formatting ---------- */
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])); }
function initials(name) { return (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase(); }
function cgInitials(g) { return g.initials || initials(g.name); }
function parseDay(ds) { return _pd(ds); }
function fmtTime12(hhmm) { if (!hhmm) return ''; const [h, m] = hhmm.split(':').map(Number); return ((h % 12) || 12) + ':' + String(m).padStart(2, '0') + (h < 12 ? ' AM' : ' PM'); }
function fmtClock(iso) { const d = new Date(iso); return fmtTime12(String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')); }
function dayDiff(date) { const a = new Date(); a.setHours(0, 0, 0, 0); const b = new Date(date); b.setHours(0, 0, 0, 0); return Math.round((b - a) / 864e5); }
function fmtDay(dsOrDate, weekday = true) {
  const d = typeof dsOrDate === 'string' && dsOrDate.length === 10 ? parseDay(dsOrDate) : new Date(dsOrDate);
  const diff = dayDiff(d);
  if (diff === 0) return 'Today'; if (diff === 1) return 'Tomorrow'; if (diff === -1) return 'Yesterday';
  return d.toLocaleDateString('en-US', weekday ? { weekday: 'short', month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric' });
}
function fmtDayAbs(ds) { return parseDay(ds).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); }
function fmtDayFull(ds) { return parseDay(ds).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }); }
function fmtRel(iso) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins >= 0 && mins < 1) return 'Just now';
  if (mins >= 0 && mins < 60) return mins + ' min ago';
  if (mins >= 0 && mins < 360) return Math.floor(mins / 60) + ' h ago';
  return fmtDay(new Date(iso), false) + ', ' + fmtClock(iso);
}
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
function visitHours(v) { let m = toMin(v.to) - toMin(v.from); if (m <= 0) m += 1440; return m / 60; }
function fmtRange(v) { return `${fmtTime12(v.from)} – ${fmtTime12(v.to)}${toMin(v.to) <= toMin(v.from) ? ' (next day)' : ''}`; }
function workedMins(v) { if (!v.clockIn) return 0; const end = v.clockOut ? new Date(v.clockOut) : new Date(); return Math.max(0, Math.round((end - new Date(v.clockIn)) / 60000)); }
function fmtDur(mins) { const h = Math.floor(mins / 60), m = mins % 60; return h ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`; }
function joinAnd(a) { return a.length <= 1 ? a.join('') : a.slice(0, -1).join(', ') + ' & ' + a.at(-1); }
function scheduleText(b) {
  const r = b.request;
  if (b.type === 'recurring') return `Every ${joinAnd(r.days.slice().sort((x, y) => ((x + 6) % 7) - ((y + 6) % 7)).map(d => DOW.at(d)))} · ${fmtTime12(r.from)} – ${fmtTime12(r.to)}`;
  if (b.type === 'once') return `One visit · ${fmtDayAbs(r.dates[0][0])}, ${fmtTime12(r.dates[0][1])}`;
  return `${r.dates.length} selected dates`;
}
function typeLabel(b) { return { once: 'One-time', recurring: 'Recurring', custom: 'Selected dates' }[b.type]; }
function typeBadge(b) { return `<span class="badge ${b.type === 'recurring' ? 'b-teal' : b.type === 'custom' ? 'b-violet' : 'b-gray'}"><i data-lucide="${b.type === 'recurring' ? 'repeat' : b.type === 'custom' ? 'calendar-range' : 'calendar'}"></i>${typeLabel(b)}</span>`; }
function whoLabel(r) { return r.relation === 'Myself' ? `${r.name} (self)` : `${r.name} · ${r.relation}`; }
function serviceNames(ids) { return ids.map(id => getService(id).short).join(', '); }

/* ---------- Status ---------- */
function bookingStatus(b) {
  if (b.status === 'new') return ['Request received', 'b-blue', 'New request'];
  if (b.status === 'cancelled') return ['Cancelled', 'b-gray', 'Cancelled'];
  const vs = visitsOf(b.id);
  if (vs.some(v => v.status === 'in_progress')) return ['Visit in progress', 'b-navy', 'In progress'];
  if (vs.length && vs.every(v => ['completed', 'cancelled'].includes(v.status))) return ['Completed', 'b-green', 'Completed'];
  return ['Scheduled', 'b-teal', 'Scheduled'];
}
function bookingBadge(b, who) { const s = bookingStatus(b); return `<span class="badge dot ${s[1]}">${who === 'admin' ? s[2] : s[0]}</span>`; }
const VSTATUS = {
  scheduled: ['Scheduled', 'b-teal'], in_progress: ['In progress', 'b-navy'], completed: ['Completed', 'b-green'], cancelled: ['Cancelled', 'b-gray'],
};
function visitBadge(v) {
  const s = VSTATUS[v.status];
  return `<span class="badge dot ${s[1]}">${v.status === 'in_progress' ? 'Clocked in ' + fmtClock(v.clockIn) : s[0]}</span>`;
}
function reportBadge(v, who) {
  if (!v.report) return v.status === 'completed' ? '<span class="badge b-amber">Report due</span>' : '';
  if (v.review && v.review.status === 'shared') return `<span class="badge b-green"><i data-lucide="share-2"></i>${who === 'client' ? 'Report' : 'Shared'}</span>`;
  return who === 'client' ? '' : '<span class="badge b-sun"><i data-lucide="eye"></i>To review</span>';
}

/* ---------- Generic UI ---------- */
function icons() { if (window.lucide) lucide.createIcons(); }
function ensureOverlays() {
  if (document.getElementById('toasts')) return;
  const tw = document.createElement('div'); tw.className = 'toast-wrap'; tw.id = 'toasts'; document.body.appendChild(tw);
  const mr = document.createElement('div'); mr.id = 'modal-root'; document.body.appendChild(mr);
}
function toast(msg, kind) {
  const wrap = document.getElementById('toasts'); if (!wrap) return;
  const el = document.createElement('div'); el.className = 'toast ' + (kind || '');
  el.innerHTML = `<i data-lucide="${kind === 'sms' ? 'message-square-text' : 'circle-check'}"></i><span>${esc(msg)}</span>`;
  wrap.appendChild(el); icons();
  setTimeout(() => { el.style.transition = 'opacity .3s'; el.style.opacity = '0'; }, 3200);
  setTimeout(() => el.remove(), 3600);
}
function openModal(html, opts = {}) {
  const root = document.getElementById('modal-root');
  root.innerHTML = `<div class="modal-overlay open" onclick="if(event.target===this)closeModal()"><div class="modal ${opts.wide ? 'wide' : ''}">${html}</div></div>`;
  icons();
}
function closeModal() { const r = document.getElementById('modal-root'); if (r) r.innerHTML = ''; }
function modalHead(title, sub) {
  return `<div class="modal-head"><div><h2>${title}</h2>${sub ? `<p class="muted text-sm mt-1">${sub}</p>` : ''}</div><button class="icon-btn" onclick="closeModal()" aria-label="Close"><i data-lucide="x"></i></button></div>`;
}
function val(id) { const el = document.getElementById(id); return el ? el.value.trim() : ''; }
function timelineHTML(list) {
  if (!list.length) return '<p class="muted text-sm">No activity yet.</p>';
  return `<div class="timeline">${list.slice().sort((a, b) => new Date(a.t) - new Date(b.t)).map(e => `<div class="tl-item"><div class="tl-icon ${e.role === 'client' ? 'customer' : e.role === 'caregiver' ? 'provider' : 'admin'}"><i data-lucide="${e.icon || 'circle'}"></i></div>
    <div class="tl-body"><div class="tl-text">${esc(e.text)}</div><div class="tl-meta">${esc(e.by)} · ${fmtRel(e.t)}</div></div></div>`).join('')}</div>`;
}
function chatHTML(b, me) {
  if (!b.thread.length) return `<div class="empty" style="padding:20px"><p class="text-sm">No messages yet.</p></div>`;
  return `<div class="chat">${b.thread.map(m => {
    const mine = m.role === me;
    return `<div class="msg ${mine ? 'me' : ''}">${mine ? '' : `<div class="avatar sm ${m.role === 'client' ? 'av-customer' : 'av-admin'}">${m.role === 'admin' ? 'GC' : initials(m.by)}</div>`}
      <div><div class="bubble">${esc(m.text)}</div><div class="msg-meta">${mine ? '' : esc(m.role === 'admin' ? 'Gregory Care' : m.by) + ' · '}${fmtRel(m.t)}</div></div></div>`;
  }).join('')}</div>`;
}

/* Visit report (read-only), used by admin + client */
function reportHTML(v, who) {
  const r = v.report; if (!r) return '<p class="muted text-sm">No report yet.</p>';
  const adlLabel = Object.fromEntries(ADL_VALUES);
  return `
    <div class="report-block"><h5>Visit summary</h5><p>${esc(r.summary)}</p></div>
    <div class="grid-2 mt-2" style="gap:10px">
      <div class="report-block" style="margin:0"><h5>Mood</h5><p class="bold">${esc(r.mood || '—')}</p></div>
      <div class="report-block" style="margin:0"><h5>Meals & fluids</h5><p>${esc(r.meals || '—')}</p></div>
    </div>
    <div class="report-block"><h5>Tasks completed</h5>${r.tasks.length ? `<div class="chip-row">${r.tasks.map(t => `<span class="badge b-leaf"><i data-lucide="check"></i>${esc(t)}</span>`).join('')}</div>` : '<p class="muted text-sm">—</p>'}</div>
    ${r.adls ? `<div class="report-block"><h5>Activities of daily living (ADLs)</h5><div class="adl-grid">${ADLS.map(([k, l]) => `<span class="text-sm">${l}</span><span class="badge ${r.adls[k] === 'independent' ? 'b-green' : r.adls[k] === 'assisted' ? 'b-amber' : 'b-gray'}">${adlLabel[r.adls[k]] || '—'}</span>`).join('')}</div></div>` : ''}
    ${who === 'admin' && r.concerns ? `<div class="callout warn mt-2"><i data-lucide="triangle-alert"></i><div><b>Concerns for the office (not shared with family)</b><div class="text-sm mt-1">${esc(r.concerns)}</div></div></div>` : ''}`;
}

/* ============================================================
   Workflow actions
   ============================================================ */
const nowISO = () => new Date().toISOString();
function addEvent(b, role, by, text, icon) { b.events.push({ t: nowISO(), role, by, text, icon }); }

function actAddRecipient(clientId, data) {
  const r = Object.assign({ id: 'r' + Date.now().toString(36), clientId, careNotes: '', emergency: '' }, data);
  S().recipients.push(r); saveDB(); return r;
}
function actRequestBooking({ clientId, recipientId, services, type, request, notes }) {
  const st = S();
  const c = getClient(clientId), r = getRecipient(recipientId);
  const b = { id: 'B-' + (st.seq++), clientId, recipientId, services, type, request, notes, status: 'new', created: nowISO(), events: [], thread: [], unread: { admin: 1, client: 0 } };
  addEvent(b, 'client', c.name, `Requested ${type === 'once' ? 'a one-time visit' : type === 'recurring' ? 'recurring care' : request.dates.length + ' selected dates'} for ${r.relation === 'Myself' ? 'themselves' : r.name + ' (' + r.relation.toLowerCase() + ')'}`, 'send');
  st.bookings.push(b); saveDB(); return b;
}
function newVisitId() { return 'V-' + (S().vseq++); }
function actScheduleBooking(bookingId, rows, by, message) {
  const b = getBooking(bookingId);
  rows.forEach(r => S().visits.push({ id: newVisitId(), bookingId, recipientId: b.recipientId, date: r.date, from: r.from, to: r.to, caregiverId: r.caregiverId, status: 'scheduled', clockIn: null, clockOut: null, report: null, review: null }));
  b.status = 'scheduled'; b.scheduledAt = nowISO();
  const staff = [...new Set(rows.map(r => r.caregiverId))].filter(id => id !== OWNER_ID).map(id => getCaregiver(id).name);
  addEvent(b, 'admin', by, `Schedule confirmed · ${rows.length} visit${rows.length > 1 ? 's' : ''}${staff.length ? ' · SMS sent to ' + joinAnd(staff) : ''}`, 'calendar-check');
  if (message) { b.thread.push({ role: 'admin', by, text: message, t: nowISO() }); }
  b.unread.client++; b.unread.admin = 0;
  saveDB();
}
function actAddVisit(bookingId, row, by) {
  const b = getBooking(bookingId);
  S().visits.push({ id: newVisitId(), bookingId, recipientId: b.recipientId, date: row.date, from: row.from, to: row.to, caregiverId: row.caregiverId, status: 'scheduled', clockIn: null, clockOut: null, report: null, review: null });
  addEvent(b, 'admin', by, `Visit added · ${fmtDayAbs(row.date)}, ${fmtTime12(row.from)}`, 'calendar-plus');
  b.unread.client++; saveDB();
}
function actReassign(visitId, gid, by) {
  const v = getVisit(visitId), b = getBooking(v.bookingId);
  v.caregiverId = gid;
  addEvent(b, 'admin', by, `Visit on ${fmtDayAbs(v.date)} assigned to ${getCaregiver(gid).name}${gid !== OWNER_ID ? ' · SMS sent' : ''}`, 'user-round-cog');
  b.unread.client++; saveDB();
}
function actCancelVisit(visitId, by, reason) {
  const v = getVisit(visitId), b = getBooking(v.bookingId);
  v.status = 'cancelled';
  addEvent(b, 'admin', by, `Visit on ${fmtDayAbs(v.date)} cancelled${reason ? ' — ' + reason : ''}`, 'calendar-x');
  b.unread.client++; saveDB();
}
function actClockIn(visitId) {
  const v = getVisit(visitId), b = getBooking(v.bookingId), g = getCaregiver(v.caregiverId);
  v.status = 'in_progress'; v.clockIn = nowISO();
  addEvent(b, 'caregiver', g.name, `Clocked in · ${fmtDayAbs(v.date)}`, 'log-in');
  saveDB();
}
function actClockOut(visitId) {
  const v = getVisit(visitId), b = getBooking(v.bookingId), g = getCaregiver(v.caregiverId);
  v.status = 'completed'; v.clockOut = nowISO();
  addEvent(b, 'caregiver', g.name, `Clocked out · ${fmtDur(workedMins(v))} worked`, 'log-out');
  saveDB();
}
function actSubmitReport(visitId, report, shareNow) {
  const v = getVisit(visitId), b = getBooking(v.bookingId), g = getCaregiver(v.caregiverId);
  v.report = Object.assign({ submittedAt: nowISO() }, report);
  v.review = { status: 'pending' };
  addEvent(b, 'caregiver', g.name, 'Visit report submitted', 'clipboard-check');
  if (shareNow) actShareReport(visitId, 'Owner');
  saveDB();
}
function actShareReport(visitId, by, summary) {
  const v = getVisit(visitId), b = getBooking(v.bookingId);
  if (summary) v.report.summary = summary;
  v.review = { status: 'shared', sharedAt: nowISO(), by };
  addEvent(b, 'admin', by, `Visit report for ${fmtDayAbs(v.date)} shared with the family`, 'share-2');
  b.unread.client++; saveDB();
}
function actMessage(bookingId, role, by, text) {
  const b = getBooking(bookingId);
  b.thread.push({ role, by, text, t: nowISO() });
  if (role === 'client') b.unread.admin++; else b.unread.client++;
  saveDB();
}
function actAddCaregiver(data) {
  const g = Object.assign({ id: 'g' + Date.now().toString(36), role: 'Caregiver', status: 'invited', since: todayStr() }, data);
  S().caregivers.push(g); saveDB(); return g;
}

/* Demo helper bar */
function demoBar(current, mount) {
  const links = [['admin.html', 'Admin', 'layout-dashboard'], ['caregiver.html', 'Caregiver', 'heart-handshake'], ['client.html', 'Client', 'smartphone']];
  const bar = document.createElement('div');
  bar.className = 'demo-bar';
  bar.innerHTML = `<span>Demo</span>${links.filter(l => l[0] !== current).map(l => `<a href="${l[0]}" target="_blank"><i data-lucide="${l[2]}"></i>${l[1]}</a>`).join('')}
    <a href="index.html"><i data-lucide="grid-2x2"></i>All</a>
    <button onclick="if(confirm('Reset all demo data?')){resetDB();location.reload();}"><i data-lucide="rotate-ccw"></i>Reset</button>`;
  (mount || document.body).appendChild(bar);
}
