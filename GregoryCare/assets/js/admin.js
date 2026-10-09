/* ============================================================
   Gregory Care — Admin Console (used by the owner)
   ============================================================ */

const ME = 'Owner';
const UI = { req: 'new', q: '', week: 0, cgFilter: 'all', repTab: 'pending', msgSel: null };
let ROUTE = { name: 'dashboard', id: null };
let SCHED_ROWS = [];
const CG_COLOR = ['#1F55A6', '#1E7A47', '#7A5AF8', '#B54708', '#0E7090'];
const cgColor = (gid) => CG_COLOR.at(Math.max(0, S().caregivers.findIndex(g => g.id === gid)) % CG_COLOR.length);

loadDB();
ensureOverlays();
document.getElementById('today-label').textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
demoBar('admin.html', document.getElementById('demo-slot'));
window.addEventListener('hashchange', () => { const p = ROUTE; render(); if (p.name !== ROUTE.name || p.id !== ROUTE.id) window.scrollTo(0, 0); });
onDBChange(() => rerender());
render();
setInterval(() => { if (['dashboard', 'schedule'].includes(ROUTE.name) && !document.querySelector('.modal-overlay')) rerender(); }, 30000);

function go(h) { location.hash = h; document.getElementById('sidebar').classList.remove('open'); }
function parseRoute() { const [name, id] = location.hash.replace(/^#\/?/, '').split('/'); return { name: name || 'dashboard', id: id ? decodeURIComponent(id) : null }; }
function rerender() {
  const y = window.scrollY, keep = {};
  document.querySelectorAll('[data-keep]').forEach(el => { keep[el.id] = el.value; });
  render();
  Object.entries(keep).forEach(([id, v]) => { const el = document.getElementById(id); if (el) el.value = v; });
  window.scrollTo(0, y);
}
function render() {
  ROUTE = parseRoute();
  renderNav();
  const views = { dashboard: vDashboard, requests: vRequests, booking: vBooking, schedule: vSchedule, reports: vReports, clients: vClients, client: vClient, team: vTeam, caregiver: vCaregiver, messages: vMessages };
  document.getElementById('view').innerHTML = (views[ROUTE.name] || vDashboard)(ROUTE.id);
  icons();
  document.querySelectorAll('.chat-scroll').forEach(el => { el.scrollTop = el.scrollHeight; });
}

/* ---------------- Navigation ---------------- */
function renderNav() {
  const st = S();
  const nNew = st.bookings.filter(b => b.status === 'new').length;
  const nRep = st.visits.filter(v => v.review && v.review.status === 'pending').length;
  const nMsg = st.bookings.filter(b => b.unread.admin > 0).length;
  const active = { booking: 'requests', client: 'clients', caregiver: 'team' }[ROUTE.name] || ROUTE.name;
  const item = (id, label, icon, badge, cls) => `<div class="nav-item ${active === id ? 'active' : ''}" onclick="go('#/${id}')"><i data-lucide="${icon}"></i><span>${label}</span>${badge ? `<span class="count-pill ${cls || ''}">${badge}</span>` : ''}</div>`;
  document.getElementById('nav').innerHTML = `
    <div class="nav-label">Operations</div>
    ${item('dashboard', 'Dashboard', 'layout-dashboard')}
    ${item('requests', 'Care Requests', 'inbox', nNew)}
    ${item('schedule', 'Schedule', 'calendar-days')}
    ${item('reports', 'Visit Reports', 'clipboard-list', nRep, 'blue')}
    ${item('messages', 'Messages', 'messages-square', nMsg, 'blue')}
    <div class="nav-label">People</div>
    ${item('clients', 'Clients & Families', 'users')}
    ${item('team', 'Caregivers & Hours', 'heart-handshake')}
    <div class="nav-label">My visits</div>
    <div class="nav-item" onclick="window.open('caregiver.html','_blank')"><i data-lucide="smartphone"></i><span>Open caregiver app</span><i data-lucide="external-link" class="ic-sm" style="margin-left:auto"></i></div>`;
}

/* ---------------- Search ---------------- */
function globalSearch(q) {
  const box = document.getElementById('gsearch-results');
  q = q.trim().toLowerCase();
  if (!q) { box.classList.remove('open'); return; }
  const st = S();
  const row = (h, icon, t, s) => `<div class="sr-item" onmousedown="go('${h}');document.getElementById('gsearch').value='';document.getElementById('gsearch-results').classList.remove('open')"><div class="ic"><i data-lucide="${icon}"></i></div><div class="grow"><div class="bold ellipsis">${esc(t)}</div><div class="muted text-xs ellipsis">${esc(s)}</div></div></div>`;
  const rec = st.recipients.filter(r => (r.name + ' ' + r.address).toLowerCase().includes(q)).slice(0, 5);
  const cl = st.clients.filter(c => (c.name + ' ' + c.email + ' ' + c.phone).toLowerCase().includes(q)).slice(0, 4);
  const bk = st.bookings.filter(b => (b.id + ' ' + getRecipient(b.recipientId).name).toLowerCase().includes(q)).slice(0, 4);
  const cg = st.caregivers.filter(g => g.name.toLowerCase().includes(q)).slice(0, 3);
  let html = '';
  if (rec.length) html += '<div class="sr-group">Care recipients</div>' + rec.map(r => row('#/client/' + r.clientId, 'heart', r.name, `${r.relation} · ${r.address}`)).join('');
  if (cl.length) html += '<div class="sr-group">Clients</div>' + cl.map(c => row('#/client/' + c.id, 'user', c.name, c.email)).join('');
  if (bk.length) html += '<div class="sr-group">Bookings</div>' + bk.map(b => row('#/booking/' + b.id, 'calendar', b.id + ' · ' + getRecipient(b.recipientId).name, scheduleText(b))).join('');
  if (cg.length) html += '<div class="sr-group">Caregivers</div>' + cg.map(g => row('#/caregiver/' + g.id, 'heart-handshake', g.name, g.role)).join('');
  box.innerHTML = html || `<div class="muted text-sm" style="padding:12px">No matches for “${esc(q)}”</div>`;
  box.classList.add('open'); icons();
}
document.addEventListener('click', (e) => { if (!e.target.closest('.topbar .search')) document.getElementById('gsearch-results').classList.remove('open'); });

/* ---------------- Shared bits ---------------- */
function cgChip(gid, me = true) {
  const g = getCaregiver(gid);
  return `<span class="row" style="gap:6px"><span class="avatar sm" style="background:${cgColor(gid)}">${cgInitials(g)}</span><span class="text-sm">${g.isOwner && me ? 'Me (Owner)' : esc(g.name)}</span></span>`;
}
function nextVisitOf(b) { const t = todayStr(); return visitsOf(b.id).find(v => v.status !== 'cancelled' && v.status !== 'completed' && v.date >= t); }
function visitRow(v, opts = {}) {
  const r = getRecipient(v.recipientId), b = getBooking(v.bookingId);
  return `<div class="sched-item" onclick="openVisit('${v.id}')" style="padding:9px 20px">
    <div class="time" style="width:72px">${fmtTime12(v.from)}</div><div class="bar" style="background:${cgColor(v.caregiverId)}"></div>
    <div class="grow" style="min-width:0"><div class="bold text-sm ellipsis">${esc(r.name)} <span class="muted" style="font-weight:500">· ${esc(serviceNames(b.services))}</span></div>
    <div class="muted text-xs ellipsis">${opts.date ? fmtDay(v.date) + ' · ' : ''}${fmtRange(v)} · ${getCaregiver(v.caregiverId).isOwner ? 'Me' : esc(getCaregiver(v.caregiverId).name)}</div></div>
    ${visitBadge(v)}</div>`;
}

/* ================= DASHBOARD ================= */
function vDashboard() {
  const st = S(), t = todayStr();
  const today = st.visits.filter(v => v.date === t && v.status !== 'cancelled').sort((a, b) => a.from.localeCompare(b.from));
  const mine = today.filter(v => v.caregiverId === OWNER_ID);
  const newReq = st.bookings.filter(b => b.status === 'new');
  const toReview = st.visits.filter(v => v.review && v.review.status === 'pending');
  const live = st.visits.filter(v => v.status === 'in_progress');
  const wk = weekRange(0);
  const hrs = st.visits.filter(v => v.clockIn && v.date >= wk[0] && v.date <= wk[1]).reduce((s, v) => s + workedMins(v), 0);
  const h = new Date().getHours();
  const nowM = new Date().getHours() * 60 + new Date().getMinutes();
  const late = today.filter(v => v.status === 'scheduled' && nowM > toMin(v.from) + 10 && toMin(v.to) > toMin(v.from));
  const att = [];
  newReq.forEach(b => att.push({ cls: 'a-blue', icon: 'inbox', t: `New request · ${getRecipient(b.recipientId).name}`, s: `${b.id} · ${typeLabel(b)} · ${serviceNames(b.services)} · from ${getClient(b.clientId).name}`, time: b.created, go: `go('#/booking/${b.id}')` }));
  toReview.forEach(v => att.push({ cls: 'a-sun', icon: 'clipboard-list', t: `Review report · ${getRecipient(v.recipientId).name}`, s: `${getCaregiver(v.caregiverId).name} · visit ${fmtDay(v.date)}${v.report.concerns ? ' · has a concern for the office' : ''}`, time: v.report.submittedAt, go: `openVisit('${v.id}')` }));
  late.forEach(v => att.push({ cls: 'a-red', icon: 'clock-alert', t: `Not clocked in · ${getRecipient(v.recipientId).name}`, s: `Due ${fmtTime12(v.from)} · ${getCaregiver(v.caregiverId).isOwner ? 'Me' : getCaregiver(v.caregiverId).name}`, time: new Date().toISOString(), go: `openVisit('${v.id}')` }));
  st.bookings.filter(b => b.unread.admin > 0 && b.thread.length).forEach(b => { const m = b.thread.at(-1); att.push({ cls: 'a-green', icon: 'message-circle', t: `${getClient(b.clientId).name} sent a message`, s: `${b.id} · “${m.text}”`, time: m.t, go: `go('#/booking/${b.id}')` }); });
  const kpi = (n, l, icon, bg, fg, hash) => `<div class="card kpi clickable" onclick="go('${hash}')"><div class="k-ic" style="background:${bg};color:${fg}"><i data-lucide="${icon}"></i></div><div class="k-n">${n}</div><div class="k-l">${l}</div></div>`;
  const activity = [];
  st.bookings.forEach(b => b.events.forEach(e => activity.push({ e, b })));
  activity.sort((a, b) => new Date(b.e.t) - new Date(a.e.t));
  return `
  <div class="page-head"><div><h1>${h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'}</h1><p class="sub">Here's today at Gregory Care Services.</p></div>
    <div class="row"><button class="btn btn-secondary" onclick="window.open('caregiver.html','_blank')"><i data-lucide="smartphone"></i>My caregiver app</button><button class="btn btn-primary" onclick="go('#/requests')"><i data-lucide="inbox"></i>Care requests</button></div></div>
  <div class="kpis">
    ${kpi(newReq.length, 'New requests', 'inbox', 'var(--brand-100)', 'var(--brand-700)', '#/requests')}
    ${kpi(today.length, 'Visits today', 'calendar-days', 'var(--teal-100)', 'var(--teal-700)', '#/schedule')}
    ${kpi(mine.length, 'My visits today', 'user-round', '#E5EDFA', 'var(--brand-800)', '#/schedule')}
    ${kpi(live.length, 'In progress now', 'activity', 'var(--leaf-100)', 'var(--leaf-600)', '#/schedule')}
    ${kpi(toReview.length, 'Reports to review', 'clipboard-list', 'var(--sun-100)', '#7A5B00', '#/reports')}
    ${kpi(fmtDur(hrs), 'Hours this week', 'timer', 'var(--violet-100)', 'var(--violet-700)', '#/team')}
  </div>
  <div class="grid-main">
    <div>
      <div class="card mb-4"><div class="card-head"><h3>Needs your attention</h3><span class="badge b-gray">${att.length}</span></div>
        ${att.length ? att.sort((a, b) => new Date(b.time) - new Date(a.time)).map(a => `<div class="att" onclick="${a.go}"><div class="a-ic ${a.cls}"><i data-lucide="${a.icon}"></i></div><div class="grow" style="min-width:0"><div class="t ellipsis">${esc(a.t)}</div><div class="s ellipsis">${esc(a.s)}</div></div><span class="muted text-xs nowrap">${fmtRel(a.time)}</span><i data-lucide="chevron-right" style="color:var(--gray-300)"></i></div>`).join('')
          : '<div class="empty"><div class="e-ic"><i data-lucide="party-popper"></i></div><h4>All caught up</h4></div>'}
      </div>
      <div class="card"><div class="card-head"><h3>Today's visits</h3><a class="text-sm bold" style="cursor:pointer" onclick="go('#/schedule')">Week view →</a></div>
        <div style="padding:6px 0">${today.length ? today.map(v => visitRow(v)).join('') : '<div class="empty"><p class="text-sm">No visits today.</p></div>'}</div></div>
    </div>
    <div>
      <div class="card mb-4" style="border:1.5px solid var(--brand-200);background:linear-gradient(180deg,var(--brand-50),#fff)">
        <div class="card-head" style="border-bottom-color:var(--brand-100)"><div><h3>My visits today</h3><div class="muted text-xs">You're on the rota as a caregiver</div></div><button class="btn btn-sm btn-primary" onclick="window.open('caregiver.html','_blank')"><i data-lucide="log-in"></i>Clock in</button></div>
        <div style="padding:6px 0">${mine.length ? mine.map(v => visitRow(v)).join('') : '<div class="empty" style="padding:18px"><p class="text-sm">No call-outs for you today.</p></div>'}</div>
      </div>
      <div class="card mb-4"><div class="card-head"><h3>Team right now</h3><a class="text-sm bold" style="cursor:pointer" onclick="go('#/team')">Hours →</a></div>
        ${st.caregivers.map(g => { const lv = live.find(v => v.caregiverId === g.id); const nx = st.visits.filter(v => v.caregiverId === g.id && v.status === 'scheduled' && (v.date > t || (v.date === t && toMin(v.from) > nowM))).sort((a, b) => (a.date + a.from).localeCompare(b.date + b.from))[0];
          return `<div class="team-card"><span class="avatar ${lv ? 'live' : ''}" style="background:${cgColor(g.id)}">${cgInitials(g)}</span><div class="grow" style="min-width:0"><div class="bold text-sm">${g.isOwner ? 'Me (Owner)' : esc(g.name)}</div><div class="muted text-xs ellipsis">${g.status === 'invited' ? 'Invited — waiting to log in' : lv ? `With ${esc(getRecipient(lv.recipientId).name)} since ${fmtClock(lv.clockIn)}` : nx ? `Next: ${fmtDay(nx.date)} ${fmtTime12(nx.from)} · ${esc(getRecipient(nx.recipientId).name)}` : 'No upcoming visits'}</div></div>${lv ? '<span class="badge b-leaf">On a visit</span>' : g.status === 'invited' ? '<span class="badge b-violet">Invited</span>' : '<span class="badge b-gray">Available</span>'}</div>`; }).join('')}
      </div>
      <div class="card"><div class="card-head"><h3>Recent activity</h3></div><div class="card-body"><div class="timeline">
        ${activity.slice(0, 6).map(({ e, b }) => `<div class="tl-item" style="cursor:pointer" onclick="go('#/booking/${b.id}')"><div class="tl-icon ${e.role === 'client' ? 'customer' : e.role === 'caregiver' ? 'provider' : 'admin'}"><i data-lucide="${e.icon}"></i></div><div class="tl-body"><div class="tl-text"><b>${esc(e.by)}</b> — ${esc(e.text)}</div><div class="tl-meta">${b.id} · ${esc(getRecipient(b.recipientId).name)} · ${fmtRel(e.t)}</div></div></div>`).join('')}
      </div></div></div>
    </div>
  </div>`;
}

/* ================= CARE REQUESTS / BOOKINGS ================= */
function vRequests() {
  const all = S().bookings;
  const f = UI.req;
  const groups = { new: all.filter(b => b.status === 'new'), scheduled: all.filter(b => b.status !== 'new' && bookingStatus(b)[2] !== 'Completed' && b.status !== 'cancelled'), completed: all.filter(b => bookingStatus(b)[2] === 'Completed'), all };
  const q = UI.q.toLowerCase();
  const list = groups[f].filter(b => !q || (b.id + getRecipient(b.recipientId).name + getClient(b.clientId).name).toLowerCase().includes(q)).slice().sort((a, b) => new Date(b.created) - new Date(a.created));
  return `
  <div class="page-head"><div><h1>Care Requests</h1><p class="sub">Requests from the client app. Confirm a schedule and the client sees their visits straight away.</p></div></div>
  <div class="card">
    <div class="card-body row wrap between" style="border-bottom:1px solid var(--gray-150);gap:12px">
      <div class="segmented">${[['new', 'New'], ['scheduled', 'Scheduled'], ['completed', 'Completed'], ['all', 'All']].map(x => `<button class="${f === x[0] ? 'active' : ''}" onclick="UI.req='${x[0]}';rerender()">${x[1]} <span class="muted">${groups[x[0]].length}</span></button>`).join('')}</div>
      <div class="search" style="width:300px"><i data-lucide="search"></i><input id="rq-q" data-keep placeholder="Search name or booking" value="${esc(UI.q)}" oninput="UI.q=this.value;rerender()"></div>
    </div>
    ${list.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Care for</th><th>Booked by</th><th>Services</th><th>Schedule</th><th>Next visit</th><th>Status</th></tr></thead><tbody>
      ${list.map(b => { const r = getRecipient(b.recipientId), c = getClient(b.clientId), nv = nextVisitOf(b);
        return `<tr class="clickable-row" onclick="go('#/booking/${b.id}')">
          <td><div class="row"><div class="avatar av-customer">${initials(r.name)}</div><div><div class="bold">${esc(r.name)}</div><div class="muted text-xs">${b.id} · ${r.relation === 'Myself' ? 'Booking for self' : esc(r.relation) + ', ' + r.age}</div></div></div></td>
          <td class="text-sm">${r.relation === 'Myself' ? '<span class="muted">Self</span>' : esc(c.name)}</td>
          <td class="text-sm" style="max-width:200px">${esc(serviceNames(b.services))}</td>
          <td><div>${typeBadge(b)}</div><div class="muted text-xs mt-1">${esc(scheduleText(b))}</div></td>
          <td class="text-sm nowrap">${nv ? `${fmtDay(nv.date)} · ${fmtTime12(nv.from)}<div class="mt-1">${cgChip(nv.caregiverId)}</div>` : b.status === 'new' ? '<span class="muted">Not scheduled</span>' : '<span class="muted">—</span>'}</td>
          <td class="nowrap">${bookingBadge(b, 'admin')}${b.unread.admin ? ' <i data-lucide="message-circle-more" class="ic-sm" style="color:var(--red-600);vertical-align:middle"></i>' : ''}</td></tr>`; }).join('')}
    </tbody></table></div>` : '<div class="empty"><div class="e-ic"><i data-lucide="inbox"></i></div><h4>Nothing here</h4></div>'}
  </div>`;
}

function draftRows(b) {
  const r = b.request;
  if (b.type === 'recurring') {
    const rows = []; const d = parseDay(r.start > todayStr() ? r.start : todayStr());
    const end = r.end ? parseDay(r.end) : new Date(d.getTime() + 27 * 864e5);
    for (let x = new Date(d); x <= end && rows.length < 40; x.setDate(x.getDate() + 1)) if (r.days.includes(x.getDay())) rows.push({ date: _ds(x), from: r.from, to: r.to, caregiverId: OWNER_ID });
    return rows;
  }
  return r.dates.map(([date, from, to]) => ({ date, from, to, caregiverId: OWNER_ID }));
}
function vBooking(id) {
  const b = getBooking(id);
  if (!b) return '<div class="empty"><h4>Booking not found</h4></div>';
  if (b.unread.admin) { b.unread.admin = 0; saveDB(); }
  const r = getRecipient(b.recipientId), c = getClient(b.clientId);
  const vs = visitsOf(b.id);
  if (b.status === 'new' && (!SCHED_ROWS.length || SCHED_ROWS.bid !== b.id)) { SCHED_ROWS = draftRows(b); SCHED_ROWS.bid = b.id; }
  const team = S().caregivers;
  return `
  <div class="back-link" onclick="go('#/requests')"><i data-lucide="arrow-left" class="ic-sm"></i>Care Requests</div>
  <div class="card mb-4"><div class="job-head">
    <div class="row wrap"><span class="badge b-gray" style="font-family:ui-monospace,Menlo,monospace">${b.id}</span>${bookingBadge(b, 'admin')}${typeBadge(b)}</div>
    <h1>Care for ${esc(r.name)}</h1>
    <div class="job-meta">
      <span><i data-lucide="heart"></i>${r.relation === 'Myself' ? 'Booked for self' : esc(r.relation) + ' of ' + esc(c.name)} · age ${r.age}</span>
      <span><i data-lucide="map-pin"></i>${esc(r.address)}</span>
      <span><i data-lucide="clock"></i>Requested ${fmtRel(b.created)}</span>
    </div>
    <div class="chip-row mt-3">${b.services.map(s => `<span class="badge b-blue"><i data-lucide="${getService(s).icon}"></i>${esc(getService(s).name)}</span>`).join('')}</div>
  </div></div>
  <div class="grid-main">
    <div style="min-width:0">
      ${b.status === 'new' ? `
      <div class="card mb-4" style="border:1.5px solid var(--brand-200)">
        <div class="card-head" style="background:var(--brand-50)"><div><h3>Schedule this request</h3><div class="muted text-xs">Requested: ${esc(scheduleText(b))}${b.type === 'recurring' ? ' — first 4 weeks shown' : ''}. Adjust times, assign a caregiver, then confirm.</div></div></div>
        <div class="card-body">
          <div class="row between mb-2"><span class="label">Assign all visits to</span><select class="select" style="width:220px;height:34px" onchange="SCHED_ROWS.forEach(x=>x.caregiverId=this.value);rerender()">${team.filter(g => g.status === 'active').map(g => `<option value="${g.id}">${g.isOwner ? 'Me (Owner)' : esc(g.name)}</option>`).join('')}</select></div>
          <div class="sched-row" style="border-bottom:1px solid var(--gray-200)"><span class="text-xs bold muted upper">Date</span><span class="text-xs bold muted upper">From</span><span class="text-xs bold muted upper">To</span><span class="text-xs bold muted upper">Caregiver</span><span></span></div>
          ${SCHED_ROWS.map((x, i) => `<div class="sched-row">
            <input class="input" type="date" value="${x.date}" onchange="SCHED_ROWS[${i}].date=this.value">
            <input class="input" type="time" value="${x.from}" onchange="SCHED_ROWS[${i}].from=this.value">
            <input class="input" type="time" value="${x.to}" onchange="SCHED_ROWS[${i}].to=this.value">
            <select class="select" onchange="SCHED_ROWS[${i}].caregiverId=this.value">${team.map(g => `<option value="${g.id}" ${x.caregiverId === g.id ? 'selected' : ''} ${g.status !== 'active' ? 'disabled' : ''}>${g.isOwner ? 'Me (Owner)' : esc(g.name)}${g.status !== 'active' ? ' (invited)' : ''}</option>`).join('')}</select>
            <button class="icon-btn" title="Remove" onclick="SCHED_ROWS.splice(${i},1);rerender()"><i data-lucide="x"></i></button></div>`).join('')}
          <button class="btn btn-sm btn-ghost mt-2" onclick="SCHED_ROWS.push(Object.assign({},SCHED_ROWS.at(-1)||{date:todayStr(),from:'09:00',to:'12:00',caregiverId:'${OWNER_ID}'}));rerender()"><i data-lucide="plus"></i>Add a date</button>
          <div class="field mt-4"><label class="label">Message to ${esc(firstName(c.name))} <span class="muted">(optional)</span></label><textarea class="textarea" id="sc-msg" data-keep style="min-height:64px">Hi ${esc(firstName(c.name))}, your visits for ${esc(r.relation === 'Myself' ? 'you' : firstName(r.name))} are confirmed — you can see the dates and times in the app.</textarea></div>
          <div class="row between mt-3 wrap"><span class="muted text-sm"><i data-lucide="bell-ring" class="ic-sm" style="vertical-align:-2px"></i> The client sees the schedule in their app. Staff caregivers get an SMS.</span><button class="btn btn-primary" onclick="confirmSchedule('${b.id}')"><i data-lucide="calendar-check"></i>Confirm ${SCHED_ROWS.length} visit${SCHED_ROWS.length === 1 ? '' : 's'}</button></div>
        </div>
      </div>` : `
      <div class="card mb-4"><div class="card-head"><h3>Visits</h3><button class="btn btn-sm btn-secondary" onclick="openAddVisit('${b.id}')"><i data-lucide="calendar-plus"></i>Add visit</button></div>
        <div class="table-wrap"><table class="table"><thead><tr><th>Date</th><th>Time</th><th>Caregiver</th><th>Clock in / out</th><th>Status</th><th>Report</th></tr></thead><tbody>
        ${vs.map(v => `<tr class="clickable-row" onclick="openVisit('${v.id}')">
          <td class="nowrap bold text-sm">${fmtDay(v.date)}</td><td class="nowrap text-sm">${fmtRange(v)}</td><td class="nowrap">${cgChip(v.caregiverId)}</td>
          <td class="nowrap text-sm">${v.clockIn ? fmtClock(v.clockIn) + (v.clockOut ? ' – ' + fmtClock(v.clockOut) + ` <span class="muted">(${fmtDur(workedMins(v))})</span>` : ' – <span class="muted">on site</span>') : '<span class="muted">—</span>'}</td>
          <td class="nowrap">${visitBadge(v)}</td><td class="nowrap">${reportBadge(v, 'admin')}</td></tr>`).join('')}
        </tbody></table></div></div>`}
      <div class="card mb-4"><div class="card-head"><h3>Messages with ${esc(c.name)}</h3></div>
        <div class="chat-box chat-scroll" style="max-height:340px">${chatHTML(b, 'admin')}</div>
        <div style="padding:0 20px 16px"><div class="composer"><textarea class="textarea" id="bk-msg" data-keep placeholder="Message ${esc(firstName(c.name))}…" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendMsg('${b.id}','bk-msg')}"></textarea><button class="btn btn-primary" onclick="sendMsg('${b.id}','bk-msg')"><i data-lucide="send"></i>Send</button></div></div></div>
      <div class="card"><div class="card-head"><h3>Activity</h3></div><div class="card-body">${timelineHTML(b.events)}</div></div>
    </div>
    <div>
      <div class="card card-pad side-card"><h4 class="mb-3">Care recipient</h4>
        <div class="person"><div class="avatar lg av-customer">${initials(r.name)}</div><div class="grow"><div class="n">${esc(r.name)}</div><div class="s">${r.relation === 'Myself' ? 'Client (self)' : esc(r.relation)} · ${r.age}</div></div></div>
        <div class="mini-kv mt-3"><i data-lucide="map-pin"></i><span>${esc(r.address)}</span><i data-lucide="phone"></i><span>${esc(r.emergency)}</span></div>
        ${r.careNotes ? `<div class="callout info mt-3"><i data-lucide="notebook-pen"></i><div class="text-sm"><b>Care notes</b><div>${esc(r.careNotes)}</div></div></div>` : ''}
      </div>
      <div class="card card-pad side-card"><h4 class="mb-3">Requested</h4>
        <div class="bold">${esc(scheduleText(b))}</div>
        ${b.type !== 'recurring' ? `<div class="stack-sm mt-2">${b.request.dates.map(([d, f, t]) => `<div class="text-sm">${fmtDayAbs(d)} · ${fmtTime12(f)} – ${fmtTime12(t)}</div>`).join('')}</div>` : `<div class="text-sm mt-1">Starting ${fmtDayAbs(b.request.start)}${b.request.end ? ' until ' + fmtDayAbs(b.request.end) : ' · ongoing'}</div>`}
        ${b.notes ? `<div class="divider"></div><div class="text-sm"><span class="muted">Note from client:</span> “${esc(b.notes)}”</div>` : ''}
      </div>
      <div class="card card-pad side-card"><h4 class="mb-3">Booked by</h4>
        <div class="person" style="cursor:pointer" onclick="go('#/client/${c.id}')"><div class="avatar av-customer">${initials(c.name)}</div><div class="grow"><div class="n">${esc(c.name)}</div><div class="s">${esc(c.email)}</div></div></div>
        <div class="mini-kv mt-3"><i data-lucide="phone"></i><span>${esc(c.phone)}</span></div>
      </div>
    </div>
  </div>`;
}
function confirmSchedule(bid) {
  if (!SCHED_ROWS.length) { toast('Add at least one visit'); return; }
  const rows = SCHED_ROWS.slice().sort((a, b) => (a.date + a.from).localeCompare(b.date + b.from));
  actScheduleBooking(bid, rows, ME, val('sc-msg'));
  const staff = [...new Set(rows.map(r => r.caregiverId))].filter(x => x !== OWNER_ID);
  SCHED_ROWS = [];
  toast(`${rows.length} visit${rows.length > 1 ? 's' : ''} confirmed — client notified in the app`);
  staff.forEach((g, i) => setTimeout(() => toast(`SMS sent to ${getCaregiver(g).name}`, 'sms'), 500 + i * 300));
  rerender();
}
function sendMsg(bid, inputId) { const t = val(inputId); if (!t) return; document.getElementById(inputId).value = ''; actMessage(bid, 'admin', ME, t); rerender(); }
function openAddVisit(bid) {
  const b = getBooking(bid);
  openModal(`${modalHead('Add a visit', `${b.id} · ${esc(getRecipient(b.recipientId).name)}`)}
    <div class="modal-body"><div class="grid-2">
      <div class="field"><label class="label">Date</label><input class="input" type="date" id="av-d" value="${todayStr(new Date(Date.now() + 864e5))}"></div>
      <div class="field"><label class="label">Caregiver</label><select class="select" id="av-g">${S().caregivers.filter(g => g.status === 'active').map(g => `<option value="${g.id}">${g.isOwner ? 'Me (Owner)' : esc(g.name)}</option>`).join('')}</select></div>
      <div class="field"><label class="label">From</label><input class="input" type="time" id="av-f" value="09:00"></div>
      <div class="field"><label class="label">To</label><input class="input" type="time" id="av-t" value="12:00"></div></div></div>
    <div class="modal-foot"><button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="actAddVisit('${bid}',{date:val('av-d'),from:val('av-f'),to:val('av-t'),caregiverId:val('av-g')},ME);closeModal();toast('Visit added — client notified');rerender()"><i data-lucide="calendar-plus"></i>Add visit</button></div>`);
}

/* ---------------- Visit modal (details, reassign, report review) ---------------- */
function openVisit(id) {
  const v = getVisit(id), b = getBooking(v.bookingId), r = getRecipient(v.recipientId), c = getClient(b.clientId), g = getCaregiver(v.caregiverId);
  const shareTo = r.relation === 'Myself' ? c.name : `${c.name} (${r.relation === 'Spouse' ? 'spouse' : r.relation === 'Mother' || r.relation === 'Father' ? (r.relation === 'Mother' ? 'daughter/son of ' + firstName(r.name) : 'daughter/son of ' + firstName(r.name)) : 'family'})`;
  openModal(`${modalHead(`Visit · ${esc(r.name)}`, `${fmtDayFull(v.date)} · ${fmtRange(v)} · ${b.id}`)}
    <div class="modal-body">
      <div class="row wrap mb-3">${visitBadge(v)}${reportBadge(v, 'admin')}<span class="muted text-sm">${esc(serviceNames(b.services))}</span></div>
      <div class="grid-2" style="gap:12px">
        <div class="report-block" style="margin:0"><h5>Caregiver</h5>${v.status === 'scheduled' ? `<select class="select" style="height:36px" onchange="actReassign('${v.id}',this.value,ME);toast(this.value==='${OWNER_ID}'?'Assigned to you':'Reassigned — SMS sent');openVisit('${v.id}');rerender()">${S().caregivers.map(x => `<option value="${x.id}" ${x.id === v.caregiverId ? 'selected' : ''} ${x.status !== 'active' ? 'disabled' : ''}>${x.isOwner ? 'Me (Owner)' : esc(x.name)}</option>`).join('')}</select>` : cgChip(g.id)}</div>
        <div class="report-block" style="margin:0"><h5>Clock in / out</h5>${v.clockIn ? `<div class="bold">${fmtClock(v.clockIn)} – ${v.clockOut ? fmtClock(v.clockOut) : 'on site now'}</div><div class="muted text-xs">${fmtDur(workedMins(v))} worked · scheduled ${visitHours(v)}h</div>` : '<div class="muted text-sm">Not clocked in yet</div>'}</div>
      </div>
      ${v.report ? `<div class="divider"></div><div class="sec-title"><i data-lucide="clipboard-list" class="ic-sm"></i>Visit report by ${g.isOwner ? 'you' : esc(g.name)} · ${fmtRel(v.report.submittedAt)}</div>${reportHTML(v, 'admin')}
        ${v.review.status === 'pending' ? `<div class="callout info mt-3" style="display:block"><b>Share with the family</b><div class="text-sm mt-1 mb-2">Edit the summary if needed. Office concerns stay internal.</div>
          <textarea class="textarea" id="rv-sum" style="min-height:90px">${esc(v.report.summary)}</textarea></div>`
        : `<div class="callout success mt-3"><i data-lucide="share-2"></i><div>Shared with ${esc(shareTo.split(' (')[0])} ${fmtRel(v.review.sharedAt)}</div></div>`}`
      : v.status === 'completed' ? '<div class="callout warn mt-3"><i data-lucide="clock"></i><div>Waiting for the caregiver to submit the visit report.</div></div>' : ''}
      ${r.careNotes ? `<div class="callout info mt-3"><i data-lucide="notebook-pen"></i><div class="text-sm"><b>Care notes</b> — ${esc(r.careNotes)}</div></div>` : ''}
    </div>
    <div class="modal-foot">
      ${v.status === 'scheduled' ? `<button class="btn btn-secondary" style="margin-right:auto" onclick="if(confirm('Cancel this visit?')){actCancelVisit('${v.id}',ME,'');closeModal();toast('Visit cancelled — client notified');rerender()}"><i data-lucide="calendar-x"></i>Cancel visit</button>` : ''}
      ${v.caregiverId === OWNER_ID && ['scheduled', 'in_progress'].includes(v.status) ? `<button class="btn btn-secondary" onclick="window.open('caregiver.html#visit/${v.id}','_blank')"><i data-lucide="smartphone"></i>Open in my caregiver app</button>` : ''}
      <button class="btn btn-secondary" onclick="closeModal();go('#/booking/${b.id}')"><i data-lucide="folder-open"></i>Booking</button>
      ${v.report && v.review.status === 'pending' ? `<button class="btn btn-primary" onclick="actShareReport('${v.id}',ME,val('rv-sum'));closeModal();toast('Report shared — ${esc(firstName(c.name))} notified in the app');rerender()"><i data-lucide="share-2"></i>Share with ${esc(firstName(c.name))}</button>` : ''}
    </div>`, { wide: true });
}

/* ================= SCHEDULE (week) ================= */
function weekRange(off) {
  const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + off * 7);
  const e = new Date(d); e.setDate(d.getDate() + 6);
  return [_ds(d), _ds(e), d];
}
function vSchedule() {
  const [from, to, start] = weekRange(UI.week);
  const st = S();
  const vs = st.visits.filter(v => v.date >= from && v.date <= to && v.status !== 'cancelled' && (UI.cgFilter === 'all' || v.caregiverId === UI.cgFilter));
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  const label = `${days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${days[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  const hrs = (gid) => vs.filter(v => v.caregiverId === gid).reduce((s, v) => s + visitHours(v), 0);
  return `
  <div class="page-head"><div><h1>Schedule</h1><p class="sub">Every visit this week, colour-coded by caregiver. Click a visit to reassign, view the clock-in or review the report.</p></div></div>
  <div class="card mb-4"><div class="card-body row wrap between" style="gap:12px">
    <div class="row"><button class="icon-btn" onclick="UI.week--;rerender()"><i data-lucide="chevron-left"></i></button><h2 style="min-width:230px;text-align:center">${label}</h2><button class="icon-btn" onclick="UI.week++;rerender()"><i data-lucide="chevron-right"></i></button><button class="btn btn-sm btn-secondary" onclick="UI.week=0;rerender()">This week</button></div>
    <div class="chip-row"><button class="chip ${UI.cgFilter === 'all' ? 'active' : ''}" onclick="UI.cgFilter='all';rerender()">Everyone</button>${st.caregivers.filter(g => g.status === 'active').map(g => `<button class="chip ${UI.cgFilter === g.id ? 'active' : ''}" onclick="UI.cgFilter='${g.id}';rerender()"><span class="cg-dot" style="background:${cgColor(g.id)}"></span>${g.isOwner ? 'Me' : esc(firstName(g.name))} <span class="n">${hrs(g.id)}h</span></button>`).join('')}</div>
  </div></div>
  <div class="week">${days.map(d => { const ds = _ds(d); const list = vs.filter(v => v.date === ds).sort((a, b) => a.from.localeCompare(b.from));
    return `<div class="wk-col ${ds === todayStr() ? 'today' : ''}"><div class="wk-h"><span>${DOW.at(d.getDay())}</span><b>${d.getDate()}</b></div><div class="wk-body">
      ${list.map(v => { const r = getRecipient(v.recipientId), g = getCaregiver(v.caregiverId); return `<div class="wk-ev" style="border-left-color:${cgColor(v.caregiverId)};${v.status === 'in_progress' ? 'background:var(--leaf-100)' : v.status === 'completed' ? 'background:var(--gray-50)' : ''}" onclick="openVisit('${v.id}')">
        <div class="t">${fmtTime12(v.from)}${v.status === 'in_progress' ? ' · <span style="color:var(--leaf-600)">● live</span>' : v.status === 'completed' ? ' ✓' : ''}</div><div class="n ellipsis">${esc(r.name)}</div><div class="c ellipsis">${g.isOwner ? 'Me' : esc(firstName(g.name))} · ${visitHours(v)}h</div></div>`; }).join('') || '<div class="muted text-xs" style="padding:6px">—</div>'}
    </div></div>`; }).join('')}</div>`;
}

/* ================= VISIT REPORTS ================= */
function vReports() {
  const st = S();
  const pending = st.visits.filter(v => v.review && v.review.status === 'pending').sort((a, b) => new Date(b.report.submittedAt) - new Date(a.report.submittedAt));
  const shared = st.visits.filter(v => v.review && v.review.status === 'shared').sort((a, b) => new Date(b.review.sharedAt) - new Date(a.review.sharedAt)).slice(0, 25);
  const due = st.visits.filter(v => v.status === 'completed' && !v.report);
  const list = UI.repTab === 'pending' ? pending : UI.repTab === 'due' ? due : shared;
  return `
  <div class="page-head"><div><h1>Visit Reports</h1><p class="sub">Caregivers write a report after every visit. Review it, then share it with the client or their family.</p></div></div>
  <div class="card">
    <div class="card-body" style="border-bottom:1px solid var(--gray-150)"><div class="segmented">${[['pending', 'To review', pending.length], ['due', 'Not submitted', due.length], ['shared', 'Shared', shared.length]].map(x => `<button class="${UI.repTab === x[0] ? 'active' : ''}" onclick="UI.repTab='${x[0]}';rerender()">${x[1]} <span class="muted">${x[2]}</span></button>`).join('')}</div></div>
    ${list.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Care recipient</th><th>Visit</th><th>Caregiver</th><th>Summary</th><th>${UI.repTab === 'shared' ? 'Shared' : 'Submitted'}</th></tr></thead><tbody>
      ${list.map(v => { const r = getRecipient(v.recipientId); return `<tr class="clickable-row" onclick="openVisit('${v.id}')">
        <td><div class="bold">${esc(r.name)}</div><div class="muted text-xs">${r.relation === 'Myself' ? 'Self' : esc(r.relation) + ' of ' + esc(getClient(r.clientId).name)}</div></td>
        <td class="nowrap text-sm">${fmtDay(v.date)}<div class="muted text-xs">${v.clockIn ? fmtClock(v.clockIn) + ' – ' + (v.clockOut ? fmtClock(v.clockOut) : '') : ''}</div></td>
        <td class="nowrap">${cgChip(v.caregiverId)}</td>
        <td class="text-sm" style="max-width:340px"><div class="ellipsis">${v.report ? esc(v.report.summary) : '<span class="muted">Waiting for report</span>'}</div>${v.report && v.report.concerns ? '<span class="badge b-amber mt-1"><i data-lucide="triangle-alert"></i>Concern noted</span>' : ''}</td>
        <td class="nowrap muted text-sm">${v.report ? fmtRel(UI.repTab === 'shared' ? v.review.sharedAt : v.report.submittedAt) : fmtRel(v.clockOut)}</td></tr>`; }).join('')}
    </tbody></table></div>` : '<div class="empty"><div class="e-ic"><i data-lucide="clipboard-check"></i></div><h4>Nothing here</h4></div>'}
  </div>`;
}

/* ================= CLIENTS & FAMILIES ================= */
function vClients() {
  const st = S();
  return `
  <div class="page-head"><div><h1>Clients & Families</h1><p class="sub">Each client account can book care for themselves and for family members.</p></div></div>
  <div class="card"><div class="table-wrap"><table class="table"><thead><tr><th>Client (account holder)</th><th>Care recipients</th><th>Active bookings</th><th>Contact</th><th>Client since</th></tr></thead><tbody>
    ${st.clients.map(c => { const rs = st.recipients.filter(r => r.clientId === c.id); const bk = st.bookings.filter(b => b.clientId === c.id && bookingStatus(b)[2] !== 'Completed');
      return `<tr class="clickable-row" onclick="go('#/client/${c.id}')">
        <td><div class="row"><div class="avatar av-customer">${initials(c.name)}</div><div><div class="bold">${esc(c.name)} ${c.isNew ? '<span class="badge b-blue">New</span>' : ''}</div><div class="muted text-xs">${esc(c.address)}</div></div></div></td>
        <td><div class="chip-row">${rs.map(r => `<span class="badge ${r.relation === 'Myself' ? 'b-gray' : 'b-sand'}">${esc(r.relation === 'Myself' ? 'Self' : firstName(r.name) + ' · ' + r.relation)}</span>`).join('')}</div></td>
        <td>${bk.length ? `<span class="badge b-teal">${bk.length}</span>` : '<span class="muted">—</span>'}</td>
        <td class="text-sm">${esc(c.phone)}<div class="muted text-xs">${esc(c.email)}</div></td>
        <td class="muted text-sm">${fmtDay(c.since, false)}</td></tr>`; }).join('')}
  </tbody></table></div></div>`;
}
function vClient(id) {
  const c = getClient(id); if (!c) return '<div class="empty"><h4>Not found</h4></div>';
  const st = S();
  const rs = st.recipients.filter(r => r.clientId === id);
  const bks = st.bookings.filter(b => b.clientId === id).sort((a, b) => new Date(b.created) - new Date(a.created));
  return `
  <div class="back-link" onclick="go('#/clients')"><i data-lucide="arrow-left" class="ic-sm"></i>Clients & Families</div>
  <div class="card card-pad mb-4"><div class="row-top"><div class="avatar xl av-customer">${initials(c.name)}</div><div class="grow"><span class="badge b-sand">Client account</span><h1 class="mt-1">${esc(c.name)}</h1>
    <div class="mini-kv mt-3" style="grid-template-columns:22px auto 22px auto 22px auto;justify-content:start;column-gap:8px"><i data-lucide="mail"></i><span>${esc(c.email)}&nbsp;&nbsp;</span><i data-lucide="phone"></i><span>${esc(c.phone)}&nbsp;&nbsp;</span><i data-lucide="map-pin"></i><span>${esc(c.address)}</span></div></div></div></div>
  <h3 class="mb-3">Care recipients</h3>
  <div class="prop-grid mb-4">${rs.map(r => `<div class="card prop-card"><div class="row-top"><div class="avatar lg av-customer">${initials(r.name)}</div><div class="grow"><div class="bold" style="font-size:15px">${esc(r.name)}</div><div class="muted text-sm">${r.relation === 'Myself' ? 'The client (self)' : esc(r.relation)} · ${r.age}</div></div></div>
    <div class="mini-kv mt-3"><i data-lucide="map-pin"></i><span class="text-sm">${esc(r.address)}</span>${r.careNotes ? `<i data-lucide="notebook-pen"></i><span class="text-sm">${esc(r.careNotes)}</span>` : ''}</div></div>`).join('')}</div>
  <div class="card"><div class="card-head"><h3>Bookings</h3></div><div class="table-wrap"><table class="table"><thead><tr><th>Booking</th><th>Care for</th><th>Schedule</th><th>Status</th></tr></thead><tbody>
    ${bks.map(b => `<tr class="clickable-row" onclick="go('#/booking/${b.id}')"><td class="bold">${b.id}</td><td>${esc(whoLabel(getRecipient(b.recipientId)))}</td><td>${typeBadge(b)} <span class="muted text-sm">${esc(scheduleText(b))}</span></td><td>${bookingBadge(b, 'admin')}</td></tr>`).join('')}
  </tbody></table></div></div>`;
}

/* ================= CAREGIVERS & HOURS ================= */
function vTeam() {
  const st = S();
  const [from, to] = weekRange(0);
  return `
  <div class="page-head"><div><h1>Caregivers & Hours</h1><p class="sub">You're on the rota yourself today. As Gregory Care grows, add caregivers here — they get an SMS invite to the caregiver app.</p></div>
    <button class="btn btn-primary" onclick="openAddCaregiver()"><i data-lucide="user-plus"></i>Add caregiver</button></div>
  <div class="card"><div class="card-head"><h3>This week · ${fmtDay(from, false)} – ${fmtDay(to, false)}</h3><span class="muted text-sm">Hours from clock in / clock out</span></div>
    <div class="table-wrap"><table class="table"><thead><tr><th>Caregiver</th><th>Role</th><th>Visits this week</th><th>Scheduled hours</th><th>Clocked hours</th><th>Reports pending</th><th>Status</th></tr></thead><tbody>
    ${st.caregivers.map(g => { const vs = st.visits.filter(v => v.caregiverId === g.id && v.date >= from && v.date <= to && v.status !== 'cancelled');
      const sch = vs.reduce((s, v) => s + visitHours(v), 0), clk = vs.reduce((s, v) => s + workedMins(v), 0);
      const pend = st.visits.filter(v => v.caregiverId === g.id && v.status === 'completed' && !v.report).length;
      return `<tr class="clickable-row" onclick="go('#/caregiver/${g.id}')">
        <td><div class="row"><span class="avatar" style="background:${cgColor(g.id)}">${cgInitials(g)}</span><div><div class="bold">${g.isOwner ? 'Me (Owner)' : esc(g.name)}</div><div class="muted text-xs">${esc(g.phone)}</div></div></div></td>
        <td class="text-sm">${esc(g.role)}</td><td>${vs.length}</td><td>${sch}h</td><td class="bold">${fmtDur(clk)}</td>
        <td>${pend ? `<span class="badge b-amber">${pend}</span>` : '<span class="muted">—</span>'}</td>
        <td>${g.status === 'invited' ? '<span class="badge b-violet">Invited · SMS sent</span>' : '<span class="badge dot b-green">Active</span>'}</td></tr>`; }).join('')}
    </tbody></table></div></div>`;
}
function vCaregiver(id) {
  const g = getCaregiver(id); if (!g) return '<div class="empty"><h4>Not found</h4></div>';
  const vs = S().visits.filter(v => v.caregiverId === id && v.clockIn).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20);
  const up = S().visits.filter(v => v.caregiverId === id && v.status === 'scheduled').sort((a, b) => (a.date + a.from).localeCompare(b.date + b.from)).slice(0, 8);
  return `
  <div class="back-link" onclick="go('#/team')"><i data-lucide="arrow-left" class="ic-sm"></i>Caregivers & Hours</div>
  <div class="card card-pad mb-4"><div class="row"><span class="avatar xl" style="background:${cgColor(g.id)}">${cgInitials(g)}</span><div><h1>${g.isOwner ? 'Me (Owner)' : esc(g.name)}</h1><p class="muted">${esc(g.role)} · ${esc(g.phone)}</p></div></div></div>
  <div class="grid-main">
    <div class="card"><div class="card-head"><h3>Timesheet</h3><span class="muted text-sm">Clock in / out</span></div>
      <div class="table-wrap"><table class="table"><thead><tr><th>Date</th><th>Client</th><th>Clock in</th><th>Clock out</th><th>Hours</th><th>Report</th></tr></thead><tbody>
      ${vs.map(v => `<tr class="clickable-row" onclick="openVisit('${v.id}')"><td class="nowrap">${fmtDay(v.date)}</td><td>${esc(getRecipient(v.recipientId).name)}</td><td>${fmtClock(v.clockIn)}</td><td>${v.clockOut ? fmtClock(v.clockOut) : '<span class="badge b-leaf">On site</span>'}</td><td class="bold">${fmtDur(workedMins(v))}</td><td>${reportBadge(v, 'admin')}</td></tr>`).join('') || '<tr><td colspan="6" class="muted">No clocked visits yet.</td></tr>'}
      </tbody></table></div></div>
    <div class="card"><div class="card-head"><h3>Upcoming</h3></div><div style="padding:6px 0">${up.map(v => visitRow(v, { date: true })).join('') || '<div class="empty"><p class="text-sm">Nothing scheduled.</p></div>'}</div></div>
  </div>`;
}
function openAddCaregiver() {
  openModal(`${modalHead('Add a caregiver', 'They receive an SMS with a link to the caregiver app')}
    <div class="modal-body"><div class="grid-2">
      <div class="field"><label class="label">Full name</label><input class="input" id="ng-n"></div>
      <div class="field"><label class="label">Mobile number</label><input class="input" id="ng-p" placeholder="(210) 555-…"></div></div>
      <div class="field"><label class="label">Services they can provide</label><div class="chip-row">${S().services.map(s => `<button class="chip active" onclick="this.classList.toggle('active')">${esc(s.short)}</button>`).join('')}</div></div></div>
    <div class="modal-foot"><button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="doAddCaregiver()"><i data-lucide="send"></i>Add & send invite</button></div>`);
}
function doAddCaregiver() {
  const n = val('ng-n'); if (!n) { document.getElementById('ng-n').focus(); return; }
  const g = actAddCaregiver({ name: n, phone: val('ng-p') || '(210) 555-0000', status: 'active' });
  closeModal(); toast(`${n} added — you can now assign visits to them`); setTimeout(() => toast(`Invite sent by SMS to ${g.phone}`, 'sms'), 400); rerender();
}

/* ================= MESSAGES ================= */
function vMessages() {
  const list = S().bookings.filter(b => b.thread.length).sort((a, b) => new Date(b.thread.at(-1).t) - new Date(a.thread.at(-1).t));
  if (!UI.msgSel || !list.find(b => b.id === UI.msgSel)) UI.msgSel = list[0] && list[0].id;
  const sel = UI.msgSel && getBooking(UI.msgSel);
  if (sel && sel.unread.admin) { sel.unread.admin = 0; saveDB(); }
  return `
  <div class="page-head"><div><h1>Messages</h1><p class="sub">Conversations with clients, one per booking.</p></div></div>
  <div class="card inbox">
    <div class="inbox-list"><div class="lst">${list.map(b => { const c = getClient(b.clientId), m = b.thread.at(-1); return `<div class="th-item ${UI.msgSel === b.id ? 'sel' : ''}" onclick="UI.msgSel='${b.id}';rerender()"><div class="avatar av-customer">${initials(c.name)}</div><div class="grow" style="min-width:0"><div class="row between"><span class="n ellipsis">${esc(c.name)}</span><span class="muted text-xs nowrap">${fmtRel(m.t)}</span></div><div class="j ellipsis">${b.id} · care for ${esc(getRecipient(b.recipientId).name)}</div><div class="p ellipsis">${m.role === 'admin' ? 'You: ' : ''}${esc(m.text)}</div></div>${b.unread.admin ? '<span class="unread-dot"></span>' : ''}</div>`; }).join('') || '<div class="empty"><p class="text-sm">No conversations.</p></div>'}</div></div>
    <div class="inbox-thread">${sel ? `<div class="th-head"><div class="avatar av-customer">${initials(getClient(sel.clientId).name)}</div><div class="grow"><div class="bold">${esc(getClient(sel.clientId).name)}</div><div class="muted text-xs">${sel.id} · care for ${esc(getRecipient(sel.recipientId).name)}</div></div><button class="btn btn-sm btn-secondary" onclick="go('#/booking/${sel.id}')"><i data-lucide="folder-open"></i>Open booking</button></div>
      <div class="th-body chat-scroll">${chatHTML(sel, 'admin')}</div>
      <div class="th-foot"><div class="composer"><textarea class="textarea" id="mg-msg" data-keep placeholder="Write a message…" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendMsg('${sel.id}','mg-msg')}"></textarea><button class="btn btn-primary" onclick="sendMsg('${sel.id}','mg-msg')"><i data-lucide="send"></i>Send</button></div></div>` : '<div class="empty" style="margin:auto"><h4>No conversation selected</h4></div>'}</div>
  </div>`;
}
