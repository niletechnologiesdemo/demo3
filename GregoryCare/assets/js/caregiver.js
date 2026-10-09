/* ============================================================
   Gregory Care — Caregiver App (owner on call-outs + staff)
   Default sign-in: the Owner (g1) — switch in Profile
   ============================================================ */

let GID = 'g1';
try { GID = localStorage.getItem('gc-cg-id') || 'g1'; } catch (e) { /* ignore */ }
const PV = { view: 'today', id: null };
const RF = { visitId: null, tasks: [], adls: {}, mood: '' };

loadDB();
ensureOverlays();
['modal-root', 'toasts'].forEach(id => document.getElementById('phone-screen').appendChild(document.getElementById(id)));
demoBar('caregiver.html');
if (!getCaregiver(GID) || getCaregiver(GID).status !== 'active') GID = 'g1';
initPreview();
onDBChange(() => rerender());
(() => {
  const q = new URLSearchParams(location.search);
  if (q.get('as') && getCaregiver(q.get('as'))) GID = q.get('as');
  const d = location.hash.replace(/^#\/?/, '').split('/'); if (d[0]) { PV.view = d[0]; PV.id = d[1] || null; }
  if (q.get('layout') === 'desktop') { document.body.classList.remove('preview'); applyMode(); }
})();
render();
setInterval(() => {
  document.getElementById('clock').textContent = fmtClock(nowISO()).replace(/ (AM|PM)/, '');
  document.querySelectorAll('[data-timer]').forEach(el => { const v = getVisit(el.dataset.timer); if (v && v.clockIn) { const s = Math.floor((Date.now() - new Date(v.clockIn)) / 1000); el.textContent = `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; } });
}, 1000);

function me() { return getCaregiver(GID); }
function myName() { return me().isOwner ? 'Owner' : firstName(me().name); }
function myVisits() { return S().visits.filter(v => v.caregiverId === GID && v.status !== 'cancelled').sort((a, b) => (a.date + a.from).localeCompare(b.date + b.from)); }

/* ---------- Layout mode (same as TPMS provider portal) ---------- */
function initPreview() {
  let pref = null; try { pref = localStorage.getItem('gc-cg-preview'); } catch (e) { /* ignore */ }
  document.body.classList.toggle('preview', window.innerWidth > 860 && pref !== 'off');
  applyMode(); window.addEventListener('resize', applyMode);
}
function applyMode() {
  const wide = window.innerWidth > 860;
  if (!wide) document.body.classList.remove('preview');
  document.body.classList.toggle('m', !wide || document.body.classList.contains('preview'));
  document.getElementById('vt-btn').innerHTML = document.body.classList.contains('preview') ? '<i data-lucide="monitor"></i>Desktop view' : '<i data-lucide="smartphone"></i>Phone view';
  icons();
}
function togglePreview() {
  const on = !document.body.classList.contains('preview');
  document.body.classList.toggle('preview', on);
  try { localStorage.setItem('gc-cg-preview', on ? 'on' : 'off'); } catch (e) { /* ignore */ }
  applyMode();
}

/* ---------- Routing ---------- */
function pgo(view, id) { PV.view = view; PV.id = id || null; render(); document.getElementById('pmain').scrollTop = 0; window.scrollTo(0, 0); }
function rerender() {
  const pm = document.getElementById('pmain'); const y = pm.scrollTop; const keep = {};
  document.querySelectorAll('[data-keep]').forEach(el => { keep[el.id] = el.value; });
  render();
  Object.entries(keep).forEach(([id, v]) => { const el = document.getElementById(id); if (el) el.value = v; });
  pm.scrollTop = y;
}
function render() {
  const views = { today: vToday, visit: vVisit, schedule: vSchedule, hours: vHours, messages: vNotices, profile: vProfile, login: vLogin };
  document.getElementById('pview').innerHTML = (views[PV.view] || vToday)();
  renderNav(); icons();
}
function renderNav() {
  const due = myVisits().filter(v => v.status === 'completed' && !v.report).length;
  const active = PV.view === 'visit' ? 'today' : PV.view;
  const items = [['today', 'Today', 'sun', due], ['schedule', 'Schedule', 'calendar-days'], ['hours', 'My hours', 'timer'], ['messages', 'Notices', 'bell'], ['profile', 'Profile', 'user']];
  document.getElementById('side-me').innerHTML = `<div class="avatar" style="background:var(--leaf-600)">${cgInitials(me())}</div><div class="grow"><div class="bold">${me().isOwner ? 'Owner' : esc(me().name)}</div><div class="r">${esc(me().role)}</div></div>`;
  document.getElementById('pnav').innerHTML = items.map(i => `<div class="pnav-item ${active === i[0] ? 'active' : ''}" onclick="pgo('${i[0]}')"><i data-lucide="${i[2]}"></i>${i[1]}${i[3] ? `<span class="count-pill">${i[3]}</span>` : ''}</div>`).join('');
  document.getElementById('pbottom').innerHTML = items.map(i => `<button class="${active === i[0] ? 'active' : ''}" onclick="pgo('${i[0]}')"><i data-lucide="${i[2]}"></i>${i[1]}${i[3] ? `<span class="count-pill">${i[3]}</span>` : ''}</button>`).join('');
  document.getElementById('top-dot').classList.add('hidden');
  const hide = PV.view === 'login';
  ['pbottom'].forEach(id => document.getElementById(id).style.display = hide ? 'none' : '');
  document.querySelector('.ptop').style.display = hide ? 'none' : '';
  document.querySelector('.pside').style.display = hide ? 'none' : '';
}

/* ---------- Components ---------- */
function visitCard(v, big) {
  const r = getRecipient(v.recipientId), b = getBooking(v.bookingId);
  const action = v.status === 'scheduled' && v.date === todayStr() ? `<button class="btn btn-sm btn-success" onclick="event.stopPropagation();doClockIn('${v.id}')"><i data-lucide="log-in"></i>Clock in</button>`
    : v.status === 'in_progress' ? `<button class="btn btn-sm btn-danger" onclick="event.stopPropagation();doClockOut('${v.id}')"><i data-lucide="log-out"></i>Clock out</button>`
    : v.status === 'completed' && !v.report ? `<button class="btn btn-sm btn-primary" onclick="event.stopPropagation();pgo('visit','${v.id}')"><i data-lucide="pen-line"></i>Write report</button>`
    : v.report ? '<span class="badge b-green"><i data-lucide="check"></i>Report sent</span>' : '<i data-lucide="chevron-right" style="color:var(--gray-300)"></i>';
  return `<div class="card jcard clickable" onclick="pgo('visit','${v.id}')" ${v.status === 'in_progress' ? 'style="border-left:4px solid var(--leaf-500)"' : ''}>
    <div class="row between"><div class="row">${visitBadge(v)}</div><span class="muted text-xs bold">${fmtDay(v.date)}</span></div>
    <div class="jt">${esc(r.name)} <span class="muted" style="font-weight:500;font-size:13px">· ${r.age}</span></div>
    <div class="ja"><i data-lucide="heart-handshake"></i>${esc(serviceNames(b.services))}</div>
    <div class="ja mt-1"><i data-lucide="map-pin"></i>${esc(r.address)}</div>
    <div class="jfoot"><span class="when"><i data-lucide="clock"></i>${fmtRange(v)}</span>${action}</div></div>`;
}

/* ================= TODAY ================= */
function vToday() {
  const t = todayStr();
  const all = myVisits();
  const live = all.find(v => v.status === 'in_progress');
  const today = all.filter(v => v.date === t && v !== live);
  const due = all.filter(v => v.status === 'completed' && !v.report);
  const up = all.filter(v => v.date > t && v.status === 'scheduled').slice(0, 4);
  const h = new Date().getHours();
  return `
    <div class="hello"><p class="muted text-sm">${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      <h1>${h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'}${me().isOwner ? '' : ', ' + esc(myName())}</h1></div>
    ${live ? `<div class="card card-pad mt-4" style="border:2px solid var(--leaf-500);background:linear-gradient(180deg,var(--leaf-100),#fff)">
      <div class="row between"><span class="badge b-leaf"><span class="status-dot live" style="background:var(--leaf-500)"></span>&nbsp;On a visit</span><span class="muted text-xs">since ${fmtClock(live.clockIn)}</span></div>
      <div class="bold mt-2" style="font-size:16px">${esc(getRecipient(live.recipientId).name)}</div><div class="timer mt-1" data-timer="${live.id}">0:00:00</div>
      <div class="muted text-xs">Scheduled ${fmtRange(live)}</div>
      <div class="row mt-3" style="gap:8px"><button class="btn btn-secondary grow" onclick="pgo('visit','${live.id}')"><i data-lucide="pen-line"></i>Report</button><button class="btn btn-danger grow" onclick="doClockOut('${live.id}')"><i data-lucide="log-out"></i>Clock out</button></div></div>` : ''}
    ${due.length ? `<div class="sec-h"><h3>Reports to write</h3><span class="badge b-amber">${due.length}</span></div>${due.map(v => visitCard(v)).join('')}` : ''}
    <div class="sec-h"><h3>Today's visits</h3><span class="muted text-sm">${today.length + (live ? 1 : 0)}</span></div>
    ${today.length ? today.map(v => visitCard(v)).join('') : `<div class="card"><div class="empty" style="padding:22px"><p class="text-sm">${live ? 'No other visits today.' : 'No visits today.'}</p></div></div>`}
    ${up.length ? `<div class="sec-h"><h3>Coming up</h3></div>${up.map(v => visitCard(v)).join('')}` : ''}`;
}

/* ================= VISIT ================= */
function vVisit() {
  const v = getVisit(PV.id);
  if (!v || v.caregiverId !== GID) return `<div class="empty"><h4>Visit not available</h4><button class="btn btn-secondary mt-3" onclick="pgo('today')">Back</button></div>`;
  const r = getRecipient(v.recipientId), b = getBooking(v.bookingId), c = getClient(b.clientId);
  const tasks = b.services.flatMap(s => getService(s).tasks);
  const hasAdl = b.services.includes('adl');
  if (RF.visitId !== v.id) Object.assign(RF, { visitId: v.id, tasks: [], adls: {}, mood: '' });
  const clock = v.status === 'scheduled'
    ? `<button class="clock-btn in" onclick="doClockIn('${v.id}')"><i data-lucide="log-in"></i>Clock in</button><p class="hint mt-2" style="text-align:center">Tap when you arrive at ${esc(firstName(r.name))}'s home.</p>`
    : v.status === 'in_progress'
      ? `<div style="text-align:center"><div class="muted text-xs bold upper">On visit since ${fmtClock(v.clockIn)}</div><div class="timer" data-timer="${v.id}">0:00:00</div></div><button class="clock-btn out mt-3" onclick="doClockOut('${v.id}')"><i data-lucide="log-out"></i>Clock out</button>`
      : `<div class="row between"><div><div class="muted text-xs bold upper">Clocked</div><div class="bold">${fmtClock(v.clockIn)} – ${fmtClock(v.clockOut)}</div></div><div style="text-align:right"><div class="muted text-xs bold upper">Worked</div><div class="bold" style="font-size:18px">${fmtDur(workedMins(v))}</div></div></div>`;
  const canReport = ['in_progress', 'completed'].includes(v.status) && !v.report;
  return `
    <div class="back-link" onclick="pgo('today')" style="margin-bottom:10px"><i data-lucide="arrow-left" class="ic-sm"></i>Today</div>
    <div class="card detail-head mb-4">
      <div class="row wrap">${visitBadge(v)}<span class="muted text-xs bold">${b.id}</span></div>
      <h1>${esc(r.name)}</h1>
      <div class="muted text-sm">${fmtDayFull(v.date)} · ${fmtRange(v)}</div>
      <div class="chip-row mt-3">${b.services.map(s => `<span class="badge b-blue"><i data-lucide="${getService(s).icon}"></i>${esc(getService(s).short)}</span>`).join('')}</div>
    </div>
    <div class="p-grid">
      <div>
        <div class="card card-pad mb-4">${clock}</div>
        ${canReport ? reportForm(v, tasks, hasAdl) : v.report ? `<div class="card card-pad mb-4"><div class="row between mb-3"><h3>Your visit report</h3>${v.review.status === 'shared' ? '<span class="badge b-green">Shared with family</span>' : '<span class="badge b-sun">With the office</span>'}</div>${reportHTML(v, 'admin')}</div>` : ''}
      </div>
      <div>
        <div class="card card-pad mb-4">
          <div class="bold mb-2" style="display:flex;gap:8px;align-items:center"><i data-lucide="map-pin" class="ic-sm"></i>Address</div>
          <div>${esc(r.address)}</div>
          <div class="divider"></div>
          <div class="bold mb-2" style="display:flex;gap:8px;align-items:center"><i data-lucide="notebook-pen" class="ic-sm"></i>Care notes</div>
          <p class="text-sm">${esc(r.careNotes || 'No special notes.')}</p>
          ${b.notes ? `<p class="text-sm mt-2"><span class="muted">From ${esc(firstName(c.name))}:</span> “${esc(b.notes)}”</p>` : ''}
          <div class="divider"></div>
          <div class="bold mb-2" style="display:flex;gap:8px;align-items:center"><i data-lucide="phone" class="ic-sm"></i>Emergency contact</div>
          <div class="text-sm">${esc(r.emergency)}</div>
        </div>
      </div>
    </div>`;
}
function reportForm(v, tasks, hasAdl) {
  return `<div class="card card-pad mb-4">
    <h3>Visit report</h3><p class="muted text-xs mt-1">${me().isOwner ? 'You can share it with the family straight away.' : 'Reviewed by the office before the family sees it.'}</p>
    <div class="label mt-3 mb-2">Tasks completed</div>
    ${tasks.map((t, i) => `<div class="task-check ${RF.tasks.includes(t) ? 'on' : ''}" onclick="toggleTask(${i})"><span class="bx">${RF.tasks.includes(t) ? '<i data-lucide="check"></i>' : ''}</span>${esc(t)}</div>`).join('') || '<p class="muted text-sm">—</p>'}
    ${hasAdl ? `<div class="label mt-4 mb-2">Activities of daily living (ADLs)</div><div class="adl-grid">${ADLS.map(([k, l]) => `<span class="text-sm">${l}</span><div class="adl-pick">${ADL_VALUES.map(([vv, ll]) => `<button class="${vv} ${RF.adls[k] === vv ? 'on' : ''}" onclick="RF.adls['${k}']='${vv}';rerender()">${ll}</button>`).join('')}</div>`).join('')}</div>` : ''}
    <div class="label mt-4 mb-2">Mood</div>
    <div class="chip-row">${MOODS.map(m => `<button class="chip ${RF.mood === m ? 'active' : ''}" onclick="RF.mood='${m}';rerender()">${m}</button>`).join('')}</div>
    <div class="field mt-4"><label class="label">Meals & fluids</label><input class="input" id="rf-meals" data-keep placeholder="e.g. Lunch eaten, 3 glasses of water"></div>
    <div class="field"><label class="label">Visit summary for the family</label><textarea class="textarea" id="rf-sum" data-keep placeholder="How the visit went — what you did together, how they seemed"></textarea></div>
    <div class="field"><label class="label">Concerns for the office <span class="muted">(not shared with family)</span></label><textarea class="textarea" id="rf-con" data-keep style="min-height:64px" placeholder="Anything the office should know — falls, health changes, supplies needed"></textarea></div>
    ${me().isOwner ? `<label class="checkbox mt-3"><input type="checkbox" id="rf-share" checked> <span class="text-sm">Share with the family now (you're the owner — no review needed)</span></label>` : ''}
    <button class="btn btn-primary btn-block btn-lg mt-4" onclick="submitReport('${v.id}')"><i data-lucide="send"></i>Submit report${v.status === 'in_progress' ? ' & clock out' : ''}</button>
  </div>`;
}
function toggleTask(i) {
  const v = getVisit(RF.visitId), b = getBooking(v.bookingId);
  const t = b.services.flatMap(s => getService(s).tasks).at(i);
  const k = RF.tasks.indexOf(t); if (k >= 0) RF.tasks.splice(k, 1); else RF.tasks.push(t);
  rerender();
}
function doClockIn(id) {
  const live = myVisits().find(v => v.status === 'in_progress');
  if (live) { toast('Clock out of your current visit first'); return; }
  actClockIn(id); toast(`Clocked in at ${fmtClock(nowISO())}`); PV.view = 'visit'; PV.id = id; rerender();
}
function doClockOut(id) {
  actClockOut(id); toast(`Clocked out — ${fmtDur(workedMins(getVisit(id)))} worked`);
  PV.view = 'visit'; PV.id = id; rerender();
}
function submitReport(id) {
  const v = getVisit(id);
  const sum = val('rf-sum');
  if (!sum) { toast('Please write a short summary for the family'); document.getElementById('rf-sum').focus(); return; }
  if (!RF.mood) { toast('Please choose a mood'); return; }
  if (v.status === 'in_progress') actClockOut(id);
  const share = me().isOwner && document.getElementById('rf-share') && document.getElementById('rf-share').checked;
  actSubmitReport(id, { tasks: RF.tasks.slice(), adls: getBooking(v.bookingId).services.includes('adl') ? Object.assign({}, RF.adls) : null, mood: RF.mood, meals: val('rf-meals'), summary: sum, concerns: val('rf-con') }, share);
  RF.visitId = null;
  toast(share ? 'Report submitted and shared with the family' : 'Report sent to the office for review');
  rerender();
}

/* ================= SCHEDULE ================= */
function vSchedule() {
  const t = todayStr();
  const up = myVisits().filter(v => v.date >= t && v.status !== 'completed').slice(0, 20);
  const g = {}; up.forEach(v => (g[v.date] = g[v.date] || []).push(v));
  return `<h1 class="mb-3">My Schedule</h1>
    ${Object.keys(g).length ? Object.keys(g).map(d => `<div class="sec-h"><h3>${fmtDayFull(d)}</h3>${d === t ? '<span class="badge b-blue">Today</span>' : ''}</div>${g[d].map(v => visitCard(v)).join('')}`).join('') : '<div class="card"><div class="empty"><h4>Nothing scheduled</h4></div></div>'}`;
}

/* ================= HOURS ================= */
function weekStart(off) { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + off * 7); return d; }
function vHours() {
  const s = weekStart(0), e = new Date(s); e.setDate(s.getDate() + 6);
  const ls = weekStart(-1), le = new Date(ls); le.setDate(ls.getDate() + 6);
  const inR = (v, a, b) => v.date >= _ds(a) && v.date <= _ds(b);
  const wk = myVisits().filter(v => v.clockIn && inR(v, s, e));
  const last = myVisits().filter(v => v.clockIn && inR(v, ls, le));
  const tot = (l) => l.reduce((x, v) => x + workedMins(v), 0);
  return `<h1 class="mb-3">My Hours</h1>
    <div class="stat-tiles"><div class="card stile hot"><div class="n">${fmtDur(tot(wk))}</div><div class="l">This week</div></div><div class="card stile"><div class="n">${wk.length}</div><div class="l">Visits</div></div><div class="card stile"><div class="n">${fmtDur(tot(last))}</div><div class="l">Last week</div></div></div>
    <div class="card"><div class="card-head"><h3>This week</h3><span class="muted text-xs">From clock in / out</span></div>
      ${wk.length ? wk.slice().reverse().map(v => `<div class="thread-row" onclick="pgo('visit','${v.id}')"><div class="grow"><div class="bold text-sm">${fmtDay(v.date)} · ${esc(getRecipient(v.recipientId).name)}</div><div class="muted text-xs">${fmtClock(v.clockIn)} – ${v.clockOut ? fmtClock(v.clockOut) : 'now'}</div></div><span class="bold">${fmtDur(workedMins(v))}</span></div>`).join('') : '<div class="empty"><p class="text-sm">No clocked visits yet this week.</p></div>'}
    </div>`;
}

/* ================= NOTICES ================= */
function vNotices() {
  const a = S().announcements.filter(x => x.audience === 'caregivers' || x.audience === 'all');
  return `<h1 class="mb-3">Notices</h1><div class="card">${a.map(x => `<div class="ann-item"><div class="row between"><span class="bold text-sm">${esc(x.title)}</span><span class="muted text-xs">${fmtDay(x.t, false)}</span></div><p class="text-sm mt-1" style="color:var(--gray-600)">${esc(x.body)}</p></div>`).join('') || '<div class="empty"><p class="text-sm">No notices.</p></div>'}</div>`;
}

/* ================= PROFILE ================= */
function vProfile() {
  const g = me();
  return `<h1 class="mb-3">Profile</h1>
    <div class="card card-pad"><div class="row"><div class="avatar xl" style="background:var(--leaf-600)">${cgInitials(g)}</div><div><h2>${g.isOwner ? 'Owner' : esc(g.name)}</h2><p class="muted">${esc(g.role)}</p></div></div>
      <div class="divider"></div><dl class="kv"><dt>Mobile</dt><dd>${esc(g.phone)}</dd><dt>Visit alerts</dt><dd><span class="badge b-green">SMS on</span></dd></dl></div>
    <div class="card card-pad mt-4" style="border-style:dashed">
      <div class="label mb-2"><i data-lucide="users" class="ic-sm" style="vertical-align:-2px"></i> Demo: view the app as</div>
      <select class="select" onchange="switchUser(this.value)">${S().caregivers.filter(x => x.status === 'active').map(x => `<option value="${x.id}" ${x.id === GID ? 'selected' : ''}>${x.isOwner ? 'Owner (you)' : esc(x.name) + ' — staff caregiver'}</option>`).join('')}</select>
      <p class="hint mt-2">Staff caregivers only see the visits assigned to them, and their reports go to the owner for review.</p>
    </div>
    <button class="btn btn-secondary btn-block mt-4" onclick="pgo('login')"><i data-lucide="log-out"></i>Log out</button>`;
}
function switchUser(id) { GID = id; try { localStorage.setItem('gc-cg-id', id); } catch (e) { /* ignore */ } toast('Now viewing as ' + (me().isOwner ? 'the Owner' : me().name)); pgo('today'); }
function vLogin() {
  return `<div style="max-width:380px;margin:0 auto;padding-top:20px"><div style="text-align:center"><img src="assets/img/logo-sm.jpg" style="width:140px;margin:0 auto"><h2 class="mt-3">Caregiver App</h2></div>
    <div class="card card-pad mt-5"><div class="field"><label class="label">Mobile number</label><input class="input" value="${esc(me().phone)}"></div><div class="field"><label class="label">Password</label><input class="input" type="password" value="demo-password"></div>
    <button class="btn btn-primary btn-block btn-lg mt-4" onclick="pgo('today')">Log in</button></div></div>`;
}
