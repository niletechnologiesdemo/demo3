/* ============================================================
   Gregory Care — Client App (clients & families)
   Signed in as: Michelle Johnson (c1) — books for her mother,
   her father and herself
   ============================================================ */

let CID = 'c1';
try { CID = sessionStorage.getItem('gc-client-id') || 'c1'; } catch (e) { /* ignore */ }
const CV = { view: 'home', id: null, filter: 'all', bkTab: 'active', inbox: 'reports', stack: [] };
const DRAFT = {};
const CAL = { y: 0, m: 0 };

loadDB();
ensureOverlays();
['modal-root', 'toasts'].forEach(id => document.getElementById('phone-screen').appendChild(document.getElementById(id)));
demoBar('client.html');
applyFrame(); window.addEventListener('resize', applyFrame);
onDBChange(() => rerender());
let loggedIn = false;
try { loggedIn = sessionStorage.getItem('gc-client-auth') === '1'; } catch (e) { /* ignore */ }
const deep = location.hash.replace(/^#\/?/, '').split('/');
if (deep[0]) { loggedIn = !['login', 'signup'].includes(deep[0]); CV.view = deep[0]; CV.id = deep[1] || null; }
if (!getClient(CID)) CID = 'c1';
if (!loggedIn && CV.view !== 'signup') CV.view = 'login';
if (CV.view === 'book') startBooking();
render();
setInterval(() => { document.getElementById('clock').textContent = fmtClock(nowISO()).replace(/ (AM|PM)/, ''); }, 1000);

function applyFrame() { document.body.classList.toggle('preview', window.innerWidth > 700); }
function me() { return getClient(CID); }
function myRecips() { return S().recipients.filter(r => r.clientId === CID).sort((a, b) => (a.relation === 'Myself') - (b.relation === 'Myself')); }
function myBookings() { return S().bookings.filter(b => b.clientId === CID && (CV.filter === 'all' || b.recipientId === CV.filter)); }
function myVisits() { const ids = myBookings().map(b => b.id); return S().visits.filter(v => ids.includes(v.bookingId) && v.status !== 'cancelled').sort((a, b) => (a.date + a.from).localeCompare(b.date + b.from)); }
function rName(r) { return r.relation === 'Myself' ? 'You' : firstName(r.name); }
function cgPublic(gid) { const g = getCaregiver(gid); return g.isOwner ? 'Gregory Care (Owner)' : g.name; }

/* ---------- Navigation ---------- */
function cgo(view, id, push = true) {
  if (push && CV.view !== view) CV.stack.push({ view: CV.view, id: CV.id });
  CV.view = view; CV.id = id || null; render(); document.getElementById('cmain').scrollTop = 0;
}
function cback(fb) { const p = CV.stack.pop(); if (p && p.view !== CV.view) Object.assign(CV, p); else { CV.view = fb || 'home'; CV.id = null; } render(); document.getElementById('cmain').scrollTop = 0; }
function tabGo(v) { CV.stack = []; cgo(v, null, false); }
function rerender() {
  const m = document.getElementById('cmain'); const y = m.scrollTop; const keep = {};
  document.querySelectorAll('[data-keep]').forEach(el => { keep[el.id] = el.value; });
  render();
  Object.entries(keep).forEach(([id, v]) => { const el = document.getElementById(id); if (el) el.value = v; });
  m.scrollTop = y;
}
function render() {
  const views = { login: vLogin, signup: vSignup, home: vHome, book: vBook, sent: vSent, bookings: vBookings, booking: vBooking, report: vReport, schedule: vSchedule, inbox: vInbox, profile: vProfile };
  document.getElementById('cview').innerHTML = (views[CV.view] || vHome)();
  renderChrome(); icons();
  document.querySelectorAll('.chat-scroll').forEach(el => { el.scrollTop = el.scrollHeight; });
}
function unreadReports() { return S().visits.filter(v => v.review && v.review.status === 'shared' && !v.seenByClient && getBooking(v.bookingId).clientId === CID).length; }
function renderChrome() {
  const head = document.getElementById('chead'), bar = document.getElementById('cbar');
  if (['login', 'signup', 'sent'].includes(CV.view)) { head.innerHTML = ''; bar.style.display = 'none'; return; }
  bar.style.display = '';
  const root = ['home', 'bookings', 'schedule', 'inbox'].includes(CV.view);
  const titles = { bookings: 'My Bookings', schedule: 'Schedule', inbox: 'Inbox', profile: 'Profile & Family', book: 'Book care', booking: CV.id || 'Booking', report: 'Visit report' };
  head.innerHTML = CV.view === 'home'
    ? `<div class="chead"><img class="logo" src="assets/img/logo-sm.jpg" alt="" style="width:40px;height:40px;border-radius:50%"><div class="grow"><div style="font-family:var(--font-head);font-weight:800;color:var(--green-deep);line-height:1.05">Gregory Care</div><div class="text-xs" style="color:var(--brand-700);font-weight:600;letter-spacing:.04em">SERVICES</div></div><div class="avatar av-customer me-btn" onclick="cgo('profile')">${initials(me().name)}</div></div>`
    : `<div class="chead">${root ? '' : `<div class="back" onclick="cback()"><i data-lucide="chevron-left"></i></div>`}<h2 class="grow ellipsis">${esc(titles[CV.view] || '')}</h2>${root ? `<div class="avatar av-customer me-btn" onclick="cgo('profile')">${initials(me().name)}</div>` : ''}</div>`;
  const active = CV.view === 'booking' || CV.view === 'report' ? 'bookings' : CV.view;
  const unread = S().bookings.filter(b => b.clientId === CID && b.unread.client).length;
  const b = (v, l, i, n) => `<button class="${active === v ? 'active' : ''}" onclick="tabGo('${v}')"><i data-lucide="${i}"></i>${l}${n ? `<span class="count-pill">${n}</span>` : ''}</button>`;
  bar.innerHTML = b('home', 'Home', 'house') + b('bookings', 'Bookings', 'clipboard-list') + `<button onclick="startBooking();cgo('book')"><span class="fab"><i data-lucide="plus"></i></span></button>` + b('schedule', 'Schedule', 'calendar-days') + b('inbox', 'Inbox', 'inbox', unread);
}

/* ---------- Components ---------- */
function visitLine(v, opts = {}) {
  const r = getRecipient(v.recipientId);
  const st = v.status === 'in_progress' ? `<span class="badge b-leaf"><span class="status-dot live" style="background:var(--leaf-500)"></span>&nbsp;Here now</span>` : v.status === 'completed' ? (v.review && v.review.status === 'shared' ? '<span class="badge b-green"><i data-lucide="file-text"></i>Report</span>' : '<span class="badge b-gray">Done</span>') : '';
  const d = parseDay(v.date);
  return `<div class="sched-card" onclick="${v.review && v.review.status === 'shared' ? `cgo('report','${v.id}')` : `cgo('booking','${v.bookingId}')`}">
    <div class="date-tile" ${v.status === 'completed' ? 'style="background:var(--gray-300)"' : ''}><span class="d">${d.getDate()}</span><span class="mo">${d.toLocaleDateString('en-US', { month: 'short' })}</span></div>
    <div class="grow" style="min-width:0"><div class="bold ellipsis">${opts.noName ? fmtDay(v.date) : esc(rName(r) === 'You' ? 'You' : r.name)}</div>
      <div class="muted text-sm">${opts.noName ? '' : fmtDay(v.date) + ' · '}${fmtRange(v)}</div>
      <div class="muted text-xs ellipsis"><i data-lucide="heart-handshake" class="ic-sm" style="vertical-align:-2px"></i> ${esc(cgPublic(v.caregiverId))}</div></div>${st}</div>`;
}
function bookingCard(b) {
  const r = getRecipient(b.recipientId);
  const nv = visitsOf(b.id).find(v => v.status !== 'cancelled' && v.status !== 'completed' && v.date >= todayStr());
  return `<div class="rcard" onclick="cgo('booking','${b.id}')">
    <div class="row between"><div class="row wrap">${bookingBadge(b, 'client')}${typeBadge(b)}</div>${b.unread.client ? `<span class="count-pill">${b.unread.client}</span>` : `<span class="muted text-xs">${b.id}</span>`}</div>
    <div class="t">Care for ${esc(r.relation === 'Myself' ? 'you' : r.name)}</div>
    <div class="m">${esc(serviceNames(b.services))}</div>
    <div class="foot">${b.status === 'new' ? '<span>Waiting for Gregory Care to confirm</span>' : nv ? `<span class="bold" style="color:var(--brand-800)"><i data-lucide="calendar-check" class="ic-sm" style="vertical-align:-2px"></i> Next: ${fmtDay(nv.date)} · ${fmtTime12(nv.from)}</span>` : `<span>${esc(scheduleText(b))}</span>`}<i data-lucide="chevron-right" class="ic-sm" style="color:var(--gray-300)"></i></div></div>`;
}

/* ================= LOGIN / SIGNUP ================= */
function vLogin() {
  return `<div class="login"><img class="logo-big" src="assets/img/logo.jpg" alt="Gregory Care Services" style="width:170px;border-radius:50%">
    <h1 style="text-align:center;font-size:26px">Welcome</h1><p class="script" style="text-align:center;font-size:20px;color:var(--leaf-600)">Companionship When You Need it Most</p>
    <div class="mt-4"><div class="field"><label class="label">Email</label><input class="input" value="${esc(me().email)}"></div><div class="field"><label class="label">Password</label><input class="input" type="password" value="demo-password"></div>
    <button class="btn btn-primary btn-lg btn-block mt-4" onclick="doLogin()">Log in</button></div>
    <div class="grow"></div>
    <p class="text-sm" style="text-align:center;margin-top:18px">New to Gregory Care? <a style="cursor:pointer;font-weight:700" onclick="cgo('signup')">Create an account</a></p></div>`;
}
function doLogin() { try { sessionStorage.setItem('gc-client-auth', '1'); sessionStorage.setItem('gc-client-id', CID); } catch (e) { /* ignore */ } CV.stack = []; cgo('home', null, false); }
function vSignup() {
  return `<div class="login"><img class="logo-big" src="assets/img/logo-sm.jpg" alt="" style="width:110px;border-radius:50%"><h1 style="text-align:center;font-size:24px">Create your account</h1>
    <p class="muted text-sm" style="text-align:center">Book care for yourself or a family member.</p>
    <div class="mt-4"><div class="field"><label class="label">Full name</label><input class="input" id="su-n"></div><div class="field"><label class="label">Email</label><input class="input" id="su-e"></div>
    <div class="field"><label class="label">Phone</label><input class="input" id="su-p"></div><div class="field"><label class="label">Password</label><input class="input" type="password" id="su-pw"></div>
    <button class="btn btn-primary btn-lg btn-block mt-4" onclick="doSignup()">Create account</button></div>
    <p class="text-sm" style="text-align:center;margin-top:16px"><a style="cursor:pointer" onclick="cgo('login')">I already have an account</a></p></div>`;
}
function doSignup() {
  const n = val('su-n'); if (!n || !val('su-e')) { toast('Please add your name and email'); return; }
  const c = { id: 'c' + Date.now().toString(36), name: n, email: val('su-e'), phone: val('su-p') || '—', address: '—', since: todayStr(), lastLogin: nowISO(), isNew: true };
  S().clients.push(c); saveDB(); CID = c.id; toast('Welcome to Gregory Care, ' + firstName(n) + '!'); doLogin();
}

/* ================= HOME ================= */
function vHome() {
  const rs = myRecips(), t = todayStr();
  const vs = myVisits();
  const live = vs.filter(v => v.status === 'in_progress');
  const next = vs.filter(v => v.status === 'scheduled' && v.date >= t).slice(0, 3);
  const reports = vs.filter(v => v.review && v.review.status === 'shared').sort((a, b) => new Date(b.review.sharedAt) - new Date(a.review.sharedAt)).slice(0, 2);
  const pending = myBookings().filter(b => b.status === 'new');
  const h = new Date().getHours();
  return `<div class="cpad">
    <div class="hero photo"><p style="margin:0">${h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'},</p><h1>${esc(firstName(me().name))}</h1>
      <p>${rs.length ? 'Caring for ' + joinAnd(rs.map(r => r.relation === 'Myself' ? 'you' : firstName(r.name))) : 'Book care for yourself or a loved one'}</p>
      ${rs.length > 1 ? `<div class="prop-chips"><button class="${CV.filter === 'all' ? 'active' : ''}" onclick="CV.filter='all';render()">Everyone</button>${rs.map(r => `<button class="${CV.filter === r.id ? 'active' : ''}" onclick="CV.filter='${r.id}';render()"><i data-lucide="${r.relation === 'Myself' ? 'user' : 'heart'}"></i>${esc(r.relation === 'Myself' ? 'Me' : firstName(r.name))}</button>`).join('')}</div>` : ''}</div>
    ${live.map(v => `<div class="action-banner" style="background:var(--leaf-100);border-color:var(--leaf-500)" onclick="cgo('booking','${v.bookingId}')"><div class="ic" style="background:var(--leaf-600);color:#fff"><i data-lucide="heart-handshake"></i></div>
      <div class="grow"><b class="text-sm">${esc(cgPublic(v.caregiverId))} is with ${esc(rName(getRecipient(v.recipientId)) === 'You' ? 'you' : firstName(getRecipient(v.recipientId).name))}</b><div class="text-xs" style="color:#17603A">Clocked in at ${fmtClock(v.clockIn)} · until ${fmtTime12(v.to)}</div></div><span class="status-dot live" style="background:var(--leaf-500)"></span></div>`).join('')}
    <button class="btn btn-primary btn-lg btn-block mt-4" onclick="startBooking();cgo('book')"><i data-lucide="calendar-plus"></i>Book care</button>
    ${pending.length ? `<div class="sec-h"><h3>Waiting for confirmation</h3></div>${pending.map(bookingCard).join('')}` : ''}
    <div class="sec-h"><h3>Upcoming visits</h3>${next.length ? `<a onclick="tabGo('schedule')">See all</a>` : ''}</div>
    ${next.length ? next.map(v => visitLine(v)).join('') : '<div class="rcard" style="cursor:default"><p class="muted text-sm" style="text-align:center">No upcoming visits.</p></div>'}
    ${reports.length ? `<div class="sec-h"><h3>Latest visit reports</h3><a onclick="CV.inbox='reports';tabGo('inbox')">All</a></div>${reports.map(v => `<div class="ann-card" style="cursor:pointer" onclick="cgo('report','${v.id}')"><div class="ic" style="background:var(--leaf-100);color:var(--leaf-600)"><i data-lucide="file-heart"></i></div><div class="grow" style="min-width:0"><div class="row between"><span class="bold text-sm">${esc(getRecipient(v.recipientId).name)} · ${fmtDay(v.date)}</span>${!v.seenByClient ? '<span class="count-pill">New</span>' : ''}</div><p class="text-sm mt-1" style="color:var(--gray-600);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(v.report.summary)}</p></div></div>`).join('')}` : ''}
    <div class="sec-h"><h3>Our services</h3></div>
    ${S().services.map(s => `<div class="svc-tile" onclick="startBooking('${s.id}');cgo('book')"><img src="assets/img/${s.img}" alt=""><div class="grow"><div class="bold text-sm">${esc(s.name)}</div><div class="muted text-xs">${esc(s.desc)}</div></div><i data-lucide="chevron-right" class="ic-sm" style="color:var(--gray-300)"></i></div>`).join('')}
  </div>`;
}

/* ================= BOOK CARE ================= */
function startBooking(svc) {
  Object.keys(DRAFT).forEach(k => delete DRAFT[k]);
  const rs = myRecips();
  const t = new Date(Date.now() + 2 * 864e5);
  Object.assign(DRAFT, { recipientId: CV.filter !== 'all' ? CV.filter : (rs.find(r => r.relation !== 'Myself') || rs[0] || {}).id || null, services: svc ? [svc] : [], type: 'custom',
    once: { date: _ds(t), from: '09:00', to: '12:00' }, weekly: { days: [], start: _ds(t), end: '', from: '09:00', to: '12:00' }, dates: [], from: '10:00', to: '13:00', notes: '' });
  const n = new Date(); CAL.y = n.getFullYear(); CAL.m = n.getMonth();
}
function vBook() {
  if (!DRAFT.services) startBooking();
  const rs = myRecips();
  const hasSelf = rs.some(r => r.relation === 'Myself');
  const sec = (n, title, body) => `<div class="detail-card"><h4><span class="avatar sm" style="background:var(--brand-700);width:22px;height:22px;font-size:11px">${n}</span>${title}</h4>${body}</div>`;
  const who = `${!hasSelf ? `<div class="prop-opt ${DRAFT.recipientId === 'self-new' ? 'sel' : ''}" onclick="DRAFT.recipientId='self-new';rerender()"><span class="radio"></span><div class="grow"><div class="bold text-sm">Myself</div><div class="muted text-xs">${esc(me().name)}</div></div></div>` : ''}
    ${rs.map(r => `<div class="prop-opt ${DRAFT.recipientId === r.id ? 'sel' : ''}" onclick="DRAFT.recipientId='${r.id}';rerender()"><span class="radio"></span><div class="grow"><div class="bold text-sm">${r.relation === 'Myself' ? 'Myself' : esc(r.name)}</div><div class="muted text-xs">${r.relation === 'Myself' ? esc(r.address) : esc(r.relation) + ' · ' + r.age}</div></div></div>`).join('')}
    <button class="btn btn-ghost btn-sm mt-2" onclick="openAddFamily(true)"><i data-lucide="user-plus"></i>Add a family member</button>`;
  const svcs = S().services.map(s => `<div class="svc-tile ${DRAFT.services.includes(s.id) ? 'sel' : ''}" onclick="toggleSvc('${s.id}')"><img src="assets/img/${s.img}" alt=""><div class="grow"><div class="bold text-sm">${esc(s.name)}</div><div class="muted text-xs">${esc(s.desc)}</div></div><span class="ck">${DRAFT.services.includes(s.id) ? '<i data-lucide="check"></i>' : ''}</span></div>`).join('');
  const typeSeg = `<div class="segmented" style="display:flex">${[['once', 'One visit'], ['recurring', 'Weekly'], ['custom', 'Pick dates']].map(x => `<button style="flex:1;justify-content:center" class="${DRAFT.type === x[0] ? 'active' : ''}" onclick="saveB();DRAFT.type='${x[0]}';rerender()">${x[1]}</button>`).join('')}</div>`;
  let when = '';
  if (DRAFT.type === 'once') when = `<div class="field mt-3"><label class="label">Date</label><input class="input" type="date" id="o-d" value="${DRAFT.once.date}"></div>
    <div class="grid-2"><div class="field"><label class="label">From</label><input class="input" type="time" id="o-f" value="${DRAFT.once.from}"></div><div class="field"><label class="label">To</label><input class="input" type="time" id="o-t" value="${DRAFT.once.to}"></div></div>`;
  if (DRAFT.type === 'recurring') when = `<div class="field mt-3"><label class="label">Which days each week?</label><div class="day-chips">${[1, 2, 3, 4, 5, 6, 0].map(d => `<button class="${DRAFT.weekly.days.includes(d) ? 'on' : ''}" onclick="saveB();toggleDay(${d})">${DOW.at(d)}</button>`).join('')}</div></div>
    <div class="grid-2"><div class="field"><label class="label">From</label><input class="input" type="time" id="w-f" value="${DRAFT.weekly.from}"></div><div class="field"><label class="label">To</label><input class="input" type="time" id="w-t" value="${DRAFT.weekly.to}"></div>
    <div class="field"><label class="label">Starting</label><input class="input" type="date" id="w-s" value="${DRAFT.weekly.start}"></div><div class="field"><label class="label">Until <span class="muted">(optional)</span></label><input class="input" type="date" id="w-e" value="${DRAFT.weekly.end}"></div></div>`;
  if (DRAFT.type === 'custom') when = `<p class="hint mt-3">Tap every day you need care — they can be any days, in any week.</p>${calHTML()}
    ${DRAFT.dates.length ? `<div class="label mt-3 mb-2">${DRAFT.dates.length} date${DRAFT.dates.length > 1 ? 's' : ''} selected — set the times</div>
      ${DRAFT.dates.map((d, i) => `<div class="row" style="gap:6px;padding:6px 0;border-top:1px solid var(--gray-150)"><span class="bold text-sm" style="width:92px">${fmtDayAbs(d.date)}</span><input class="input" type="time" style="height:34px;font-size:13px" value="${d.from}" onchange="DRAFT.dates[${i}].from=this.value"><span class="muted">–</span><input class="input" type="time" style="height:34px;font-size:13px" value="${d.to}" onchange="DRAFT.dates[${i}].to=this.value"><button class="icon-btn" style="width:32px;height:32px;flex-shrink:0" onclick="DRAFT.dates.splice(${i},1);rerender()"><i data-lucide="x"></i></button></div>`).join('')}` : ''}`;
  return `<div class="cpad">
    ${sec(1, 'Who is this care for?', who)}
    ${sec(2, 'Which services?', '<p class="hint mb-2">Choose one or more.</p>' + svcs)}
    ${sec(3, 'When?', typeSeg + when)}
    ${sec(4, 'Anything we should know?', `<textarea class="textarea" id="b-notes" data-keep placeholder="Access, routines, preferences — e.g. key in the lockbox, likes to walk after lunch">${esc(DRAFT.notes)}</textarea>`)}
    <div class="sticky-foot"><button class="btn btn-primary btn-lg btn-block" onclick="submitBooking()"><i data-lucide="send"></i>Send request</button></div>
  </div>`;
}
function calHTML() {
  const first = new Date(CAL.y, CAL.m, 1);
  const off = (first.getDay() + 6) % 7, days = new Date(CAL.y, CAL.m + 1, 0).getDate();
  const t = todayStr();
  const cells = [];
  for (let i = 0; i < off; i++) cells.push('<span class="blank"></span>');
  for (let d = 1; d <= days; d++) { const ds = _ds(new Date(CAL.y, CAL.m, d)); cells.push(`<button class="${DRAFT.dates.some(x => x.date === ds) ? 'sel' : ''} ${ds === t ? 'today' : ''}" ${ds < t ? 'disabled' : ''} onclick="toggleDate('${ds}')">${d}</button>`); }
  return `<div class="row between mt-2 mb-2"><button class="icon-btn" onclick="calNav(-1)"><i data-lucide="chevron-left"></i></button><b>${first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</b><button class="icon-btn" onclick="calNav(1)"><i data-lucide="chevron-right"></i></button></div>
    <div class="mini-cal">${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(x => `<span class="h">${x}</span>`).join('')}${cells.join('')}</div>`;
}
function calNav(n) { saveB(); const d = new Date(CAL.y, CAL.m + n, 1); CAL.y = d.getFullYear(); CAL.m = d.getMonth(); rerender(); }
function toggleDate(ds) {
  saveB();
  const i = DRAFT.dates.findIndex(x => x.date === ds);
  if (i >= 0) DRAFT.dates.splice(i, 1);
  else { const last = DRAFT.dates.at(-1); DRAFT.dates.push({ date: ds, from: last ? last.from : DRAFT.from, to: last ? last.to : DRAFT.to }); DRAFT.dates.sort((a, b) => a.date.localeCompare(b.date)); }
  rerender();
}
function toggleSvc(id) { saveB(); const a = DRAFT.services, i = a.indexOf(id); if (i >= 0) a.splice(i, 1); else a.push(id); rerender(); }
function toggleDay(d) { const a = DRAFT.weekly.days, i = a.indexOf(d); if (i >= 0) a.splice(i, 1); else a.push(d); rerender(); }
function saveB() {
  const g = (id) => { const el = document.getElementById(id); return el ? el.value : null; };
  if (g('o-d') !== null) Object.assign(DRAFT.once, { date: g('o-d'), from: g('o-f'), to: g('o-t') });
  if (g('w-f') !== null) Object.assign(DRAFT.weekly, { from: g('w-f'), to: g('w-t'), start: g('w-s'), end: g('w-e') });
  if (g('b-notes') !== null) DRAFT.notes = g('b-notes');
}
function submitBooking() {
  saveB();
  if (!DRAFT.recipientId) { toast('Please choose who the care is for'); return; }
  if (!DRAFT.services.length) { toast('Please choose at least one service'); return; }
  let request;
  if (DRAFT.type === 'once') request = { dates: [[DRAFT.once.date, DRAFT.once.from, DRAFT.once.to]] };
  if (DRAFT.type === 'recurring') { if (!DRAFT.weekly.days.length) { toast('Please choose the days'); return; } request = { days: DRAFT.weekly.days.slice(), start: DRAFT.weekly.start, end: DRAFT.weekly.end || null, from: DRAFT.weekly.from, to: DRAFT.weekly.to }; }
  if (DRAFT.type === 'custom') { if (!DRAFT.dates.length) { toast('Please tap the dates you need'); return; } request = { dates: DRAFT.dates.map(d => [d.date, d.from, d.to]) }; }
  let rid = DRAFT.recipientId;
  if (rid === 'self-new') rid = actAddRecipient(CID, { name: me().name, relation: 'Myself', age: '', address: me().address, emergency: '' }).id;
  const b = actRequestBooking({ clientId: CID, recipientId: rid, services: DRAFT.services.slice(), type: DRAFT.type, request, notes: DRAFT.notes });
  CV.stack = []; cgo('sent', b.id, false);
}
function vSent() {
  const b = getBooking(CV.id); if (!b) return vHome();
  const r = getRecipient(b.recipientId);
  return `<div class="cpad"><div class="success"><div class="big"><i data-lucide="check"></i></div><h1 style="font-size:24px">Request sent</h1>
    <p class="muted mt-1">Care for ${esc(r.relation === 'Myself' ? 'you' : r.name)} · ${esc(scheduleText(b))}</p>
    <div class="detail-card next-list mt-5"><h4><i data-lucide="list-checks"></i>What happens next</h4>
      <div class="it"><span class="n">1</span><div class="text-sm"><b>Gregory Care confirms your schedule</b><div class="muted">You'll see each visit, its time and your caregiver here.</div></div></div>
      <div class="it"><span class="n">2</span><div class="text-sm"><b>Know when your caregiver arrives</b><div class="muted">The app shows when they clock in and out.</div></div></div>
      <div class="it"><span class="n">3</span><div class="text-sm"><b>Read the visit report</b><div class="muted">A summary of each visit, shared after it ends.</div></div></div></div>
    <button class="btn btn-primary btn-lg btn-block mt-5" onclick="CV.stack=[{view:'home'}];cgo('booking','${b.id}',false)">View booking</button>
    <button class="btn btn-ghost btn-block mt-2" onclick="tabGo('home')">Back to home</button></div></div>`;
}

/* ================= FAMILY ================= */
function openAddFamily(fromBooking) {
  openModal(`${modalHead('Add a family member', 'Someone you would like to book care for')}
    <div class="modal-body">
      <div class="field"><label class="label">Full name</label><input class="input" id="af-n"></div>
      <div class="grid-2"><div class="field"><label class="label">Relationship</label><select class="select" id="af-r">${RELATIONS.map(r => `<option>${r}</option>`).join('')}</select></div><div class="field"><label class="label">Age</label><input class="input" type="number" id="af-a"></div></div>
      <div class="field"><label class="label">Address where care is needed</label><input class="input" id="af-ad"></div>
      <div class="field"><label class="label">Care notes <span class="muted">(optional)</span></label><textarea class="textarea" id="af-cn" style="min-height:64px" placeholder="Mobility, memory, allergies, routines…"></textarea></div>
    </div>
    <div class="modal-foot"><button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="doAddFamily(${!!fromBooking})"><i data-lucide="user-plus"></i>Add</button></div>`);
}
function doAddFamily(fromBooking) {
  const n = val('af-n'); if (!n) { document.getElementById('af-n').focus(); return; }
  if (fromBooking) saveB();
  const r = actAddRecipient(CID, { name: n, relation: val('af-r'), age: Number(val('af-a')) || '', address: val('af-ad') || '—', careNotes: val('af-cn'), emergency: me().name + ' · ' + me().phone });
  if (fromBooking) DRAFT.recipientId = r.id;
  closeModal(); toast(n + ' added to your family'); rerender();
}

/* ================= BOOKINGS ================= */
function vBookings() {
  const all = myBookings();
  const active = all.filter(b => bookingStatus(b)[0] !== 'Completed' && b.status !== 'cancelled').sort((a, b) => new Date(b.created) - new Date(a.created));
  const past = all.filter(b => !active.includes(b));
  const list = CV.bkTab === 'active' ? active : past;
  const rs = myRecips();
  return `<div class="cpad">
    <div class="segmented" style="display:flex;width:100%"><button style="flex:1;justify-content:center" class="${CV.bkTab === 'active' ? 'active' : ''}" onclick="CV.bkTab='active';render()">Active (${active.length})</button><button style="flex:1;justify-content:center" class="${CV.bkTab === 'past' ? 'active' : ''}" onclick="CV.bkTab='past';render()">Past (${past.length})</button></div>
    ${rs.length > 1 ? `<div class="chip-row mt-3"><button class="chip ${CV.filter === 'all' ? 'active' : ''}" onclick="CV.filter='all';render()">Everyone</button>${rs.map(r => `<button class="chip ${CV.filter === r.id ? 'active' : ''}" onclick="CV.filter='${r.id}';render()">${esc(r.relation === 'Myself' ? 'Me' : firstName(r.name))}</button>`).join('')}</div>` : ''}
    <div class="mt-4">${list.map(bookingCard).join('') || '<div class="empty"><div class="e-ic"><i data-lucide="clipboard-list"></i></div><h4>No bookings</h4></div>'}</div></div>`;
}
function vBooking() {
  const b = getBooking(CV.id);
  if (!b || b.clientId !== CID) return '<div class="empty"><h4>Not found</h4></div>';
  if (b.unread.client) { b.unread.client = 0; saveDB(); }
  const r = getRecipient(b.recipientId), vs = visitsOf(b.id).filter(v => v.status !== 'cancelled');
  const t = todayStr();
  const up = vs.filter(v => v.date >= t && v.status !== 'completed'), past = vs.filter(v => !up.includes(v)).reverse();
  return `<div class="cpad">
    <div class="detail-card"><div class="row wrap">${bookingBadge(b, 'client')}${typeBadge(b)}</div>
      <h1 style="font-size:21px;margin:8px 0 4px">Care for ${esc(r.relation === 'Myself' ? 'you' : r.name)}</h1>
      <div class="chip-row mt-2">${b.services.map(s => `<span class="badge b-blue"><i data-lucide="${getService(s).icon}"></i>${esc(getService(s).short)}</span>`).join('')}</div>
      <p class="muted text-sm mt-2">${esc(scheduleText(b))}</p></div>
    ${b.status === 'new' ? `<div class="callout info mt-3"><i data-lucide="hourglass"></i><div><b>Request received</b><div class="text-sm">Gregory Care will confirm the schedule and caregiver shortly. You requested:</div>
      <div class="stack-sm mt-2">${b.type === 'recurring' ? `<div class="text-sm bold">${esc(scheduleText(b))} from ${fmtDayAbs(b.request.start)}</div>` : b.request.dates.map(([d, f, to]) => `<div class="text-sm bold">${fmtDayAbs(d)} · ${fmtTime12(f)} – ${fmtTime12(to)}</div>`).join('')}</div></div></div>` : ''}
    ${up.length ? `<div class="sec-h"><h3>Upcoming visits</h3></div>${up.map(v => visitLine(v, { noName: true })).join('')}` : ''}
    ${past.length ? `<div class="sec-h"><h3>Past visits</h3></div>${past.map(v => visitLine(v, { noName: true })).join('')}` : ''}
    <div class="detail-card mt-3"><h4><i data-lucide="message-circle"></i>Messages with Gregory Care</h4>
      <div class="chat-box chat-scroll">${chatHTML(b, 'client')}</div>
      <div class="composer"><textarea class="textarea" id="c-msg" data-keep placeholder="Message Gregory Care…" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendC('${b.id}')}"></textarea><button class="btn btn-primary" style="width:44px;padding:0" onclick="sendC('${b.id}')"><i data-lucide="send"></i></button></div></div>
  </div>`;
}
function sendC(bid) { const t = val('c-msg'); if (!t) return; document.getElementById('c-msg').value = ''; actMessage(bid, 'client', me().name, t); rerender(); }

/* ================= REPORT ================= */
function vReport() {
  const v = getVisit(CV.id);
  if (!v || !v.report || v.review.status !== 'shared') return '<div class="empty"><h4>Report not available yet</h4></div>';
  if (!v.seenByClient) { v.seenByClient = true; saveDB(); }
  const r = getRecipient(v.recipientId), b = getBooking(v.bookingId);
  return `<div class="cpad">
    <div class="detail-card"><div class="row"><div class="avatar lg" style="background:var(--leaf-600)">${cgInitials(getCaregiver(v.caregiverId))}</div><div><div class="bold">${esc(r.relation === 'Myself' ? 'Your visit' : r.name)}</div><div class="muted text-sm">${fmtDayFull(v.date)}</div></div></div>
      <dl class="kv mt-3" style="grid-template-columns:110px 1fr;font-size:13px"><dt>Caregiver</dt><dd>${esc(cgPublic(v.caregiverId))}</dd><dt>Arrived</dt><dd>${fmtClock(v.clockIn)}</dd><dt>Left</dt><dd>${fmtClock(v.clockOut)} <span class="muted">(${fmtDur(workedMins(v))})</span></dd><dt>Services</dt><dd>${esc(serviceNames(b.services))}</dd></dl></div>
    ${reportHTML(v, 'client')}
    <button class="btn btn-secondary btn-block mt-4" onclick="cgo('booking','${b.id}')"><i data-lucide="message-circle"></i>Message Gregory Care</button>
  </div>`;
}

/* ================= SCHEDULE ================= */
function vSchedule() {
  const t = todayStr();
  const vs = myVisits().filter(v => v.date >= t && v.status !== 'completed');
  const days = []; for (let i = 0; i < 14; i++) { const d = new Date(); d.setDate(d.getDate() + i); days.push(d); }
  return `<div class="cpad">
    <div class="week-strip">${days.map(d => { const ds = _ds(d); const has = vs.some(v => v.date === ds); return `<div class="wd ${ds === t ? 'today' : ''}">${DOW.at(d.getDay())}<b>${d.getDate()}</b>${has ? '<div class="dotm"></div>' : '<div style="height:10px"></div>'}</div>`; }).join('')}</div>
    <div class="sec-h"><h3>Upcoming visits</h3></div>
    ${vs.length ? vs.slice(0, 15).map(v => visitLine(v)).join('') : '<div class="rcard" style="cursor:default"><p class="muted text-sm" style="text-align:center">Nothing scheduled yet.</p></div>'}
  </div>`;
}

/* ================= INBOX ================= */
function vInbox() {
  const reps = S().visits.filter(v => v.review && v.review.status === 'shared' && getBooking(v.bookingId).clientId === CID).sort((a, b) => new Date(b.review.sharedAt) - new Date(a.review.sharedAt));
  const threads = S().bookings.filter(b => b.clientId === CID && b.thread.length).sort((a, b) => new Date(b.thread.at(-1).t) - new Date(a.thread.at(-1).t));
  const notices = S().announcements.filter(a => a.audience === 'clients' || a.audience === 'all');
  const tab = CV.inbox;
  return `<div class="cpad">
    <div class="segmented" style="display:flex;width:100%">${[['reports', 'Reports'], ['messages', 'Messages'], ['notices', 'Notices']].map(x => `<button style="flex:1;justify-content:center" class="${tab === x[0] ? 'active' : ''}" onclick="CV.inbox='${x[0]}';render()">${x[1]}</button>`).join('')}</div>
    <div class="mt-4">
    ${tab === 'reports' ? reps.map(v => `<div class="ann-card" style="cursor:pointer" onclick="cgo('report','${v.id}')"><div class="ic" style="background:var(--leaf-100);color:var(--leaf-600)"><i data-lucide="file-heart"></i></div><div class="grow" style="min-width:0"><div class="row between"><span class="bold text-sm">${esc(getRecipient(v.recipientId).name)} · ${fmtDay(v.date)}</span>${!v.seenByClient ? '<span class="count-pill">New</span>' : ''}</div><p class="text-sm mt-1" style="color:var(--gray-600);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(v.report.summary)}</p><p class="muted text-xs mt-1">${esc(cgPublic(v.caregiverId))}</p></div></div>`).join('') || '<div class="empty"><p class="text-sm">No reports yet.</p></div>'
      : tab === 'messages' ? threads.map(b => { const m = b.thread.at(-1); return `<div class="ann-card" style="cursor:pointer" onclick="cgo('booking','${b.id}')"><div class="avatar av-admin">GC</div><div class="grow" style="min-width:0"><div class="row between"><span class="bold text-sm">Care for ${esc(firstName(getRecipient(b.recipientId).name))}</span>${b.unread.client ? `<span class="count-pill">${b.unread.client}</span>` : ''}</div><div class="muted text-sm ellipsis">${m.role === 'client' ? 'You: ' : ''}${esc(m.text)}</div><div class="muted text-xs mt-1">${fmtRel(m.t)}</div></div></div>`; }).join('') || '<div class="empty"><p class="text-sm">No messages.</p></div>'
      : notices.map(a => `<div class="ann-card"><div class="ic"><i data-lucide="megaphone"></i></div><div><div class="bold text-sm">${esc(a.title)}</div><p class="text-sm mt-1" style="color:var(--gray-600)">${esc(a.body)}</p></div></div>`).join('')}
    </div></div>`;
}

/* ================= PROFILE ================= */
function vProfile() {
  const c = me();
  return `<div class="cpad">
    <div style="text-align:center;padding:10px 0"><div class="avatar xl av-customer" style="margin:0 auto">${initials(c.name)}</div><h2 class="mt-3">${esc(c.name)}</h2><p class="muted text-sm">${esc(c.email)}</p></div>
    <div class="detail-card mt-3"><div class="row between mb-2"><h4 style="margin:0"><i data-lucide="heart"></i>People I book care for</h4><button class="btn btn-sm btn-ghost" onclick="openAddFamily(false)"><i data-lucide="plus"></i>Add</button></div>
      ${myRecips().map(r => `<div class="row" style="padding:9px 0;border-top:1px solid var(--gray-150)"><div class="avatar av-customer">${initials(r.name)}</div><div class="grow"><div class="bold text-sm">${r.relation === 'Myself' ? 'Myself' : esc(r.name)}</div><div class="muted text-xs">${r.relation === 'Myself' ? '' : esc(r.relation) + ' · ' + r.age + ' · '}${esc(r.address)}</div></div></div>`).join('') || '<p class="muted text-sm">Add yourself or a family member when you book care.</p>'}
    </div>
    <div class="detail-card"><h4><i data-lucide="user"></i>My details</h4><dl class="kv" style="grid-template-columns:80px 1fr;font-size:13px"><dt>Phone</dt><dd>${esc(c.phone)}</dd><dt>Address</dt><dd>${esc(c.address)}</dd></dl></div>
    <button class="btn btn-secondary btn-block mt-4" onclick="try{sessionStorage.removeItem('gc-client-auth')}catch(e){};CV.stack=[];cgo('login',null,false)"><i data-lucide="log-out"></i>Log out</button>
  </div>`;
}
