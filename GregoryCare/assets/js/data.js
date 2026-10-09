/* ============================================================
   Gregory Care Services — demo seed data
   Services taken from Gregory Care's flyer. Dates are generated
   relative to "today" so the demo always looks current.
   All people below are sample data.
   ============================================================ */

const GC_SERVICES = [
  { id: 'companion', name: 'Companion Services', short: 'Companionship', icon: 'users', img: 'svc-companion.jpg',
    desc: 'Friendly support, meaningful conversation and assistance with daily activities.',
    tasks: ['Conversation & companionship', 'Activities, games or reading', 'Walk or light exercise'] },
  { id: 'cleaning', name: 'Light Duty Cleaning / Cooking', short: 'Cleaning & cooking', icon: 'spray-can', img: 'svc-cooking.jpg',
    desc: 'A clean, comfortable home and nutritious meals.',
    tasks: ['Light housekeeping', 'Laundry', 'Meal prepared', 'Dishes washed'] },
  { id: 'daily', name: 'Daily Operation Assistance', short: 'Daily assistance', icon: 'calendar-check', img: 'svc-daily.jpg',
    desc: 'Help with everyday tasks to keep life organized and running smoothly.',
    tasks: ['Medication reminder given', 'Mail & paperwork organized', 'Calendar & appointments reviewed'] },
  { id: 'errands', name: 'Run Light Errands', short: 'Errands', icon: 'shopping-cart', img: 'svc-errands.jpg',
    desc: 'Grocery shopping, picking up items, and other light errands.',
    tasks: ['Grocery shopping', 'Pharmacy pick-up', 'Other errand'] },
  { id: 'overnight', name: 'Overnight Sitting', short: 'Overnight sitting', icon: 'moon', img: 'svc-overnight.jpg',
    desc: 'Peace of mind with overnight care and support.',
    tasks: ['Evening routine', 'Overnight check-ins', 'Morning routine'] },
  { id: 'adl', name: 'ADL Reporting', short: 'ADL reporting', icon: 'clipboard-list', img: 'svc-adl.jpg',
    desc: 'Tracking and reporting Activities of Daily Living (ADLs) for ongoing care support.',
    tasks: [] },
];
const ADLS = [['bathing', 'Bathing'], ['dressing', 'Dressing'], ['eating', 'Eating'], ['toileting', 'Toileting'], ['mobility', 'Transferring & mobility'], ['continence', 'Continence']];
const ADL_VALUES = [['independent', 'Independent'], ['assisted', 'Needed help'], ['not_done', 'Not done']];
const MOODS = ['Cheerful', 'Calm', 'Tired', 'Anxious', 'Confused', 'Upset'];
const RELATIONS = ['Mother', 'Father', 'Spouse', 'Grandparent', 'Sibling', 'Other family'];

function _ds(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function _pd(ds) { const [y, m, d] = ds.split('-').map(Number); return new Date(y, m - 1, d); }

function buildSeed() {
  const now = new Date();
  const day = (o) => _ds(new Date(now.getFullYear(), now.getMonth(), now.getDate() + o));
  const at = (o, hhmm) => { const [h, m] = hhmm.split(':').map(Number); return new Date(now.getFullYear(), now.getMonth(), now.getDate() + o, h, m).toISOString(); };
  const ago = (mins) => new Date(now.getTime() - mins * 60000).toISOString();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

  const clients = [
    { id: 'c1', name: 'Michelle Johnson', email: 'michelle.johnson@email.com', phone: '(210) 555-0147', address: 'Alamo Heights, San Antonio, TX 78209', since: day(-120), lastLogin: ago(35) },
    { id: 'c2', name: 'Robert Alvarez', email: 'r.alvarez@email.com', phone: '(210) 555-0192', address: '6815 Bandera Rd, San Antonio, TX 78238', since: day(-60), lastLogin: ago(60 * 20) },
    { id: 'c3', name: 'Patricia Nguyen', email: 'pnguyen@email.com', phone: '(210) 555-0133', address: 'Westover Hills, San Antonio, TX 78251', since: day(-45), lastLogin: ago(60 * 30) },
    { id: 'c4', name: 'Linda Brooks', email: 'linda.brooks@email.com', phone: '(512) 555-0176', address: 'Austin, TX 78704', since: day(0), lastLogin: ago(125), isNew: true },
  ];
  const recipients = [
    { id: 'r1', clientId: 'c1', name: 'Evelyn Johnson', relation: 'Mother', age: 82, address: '214 Oak Ridge Dr, San Antonio, TX 78245',
      careNotes: 'Uses a walker. Mild memory loss — gentle reminders help. Allergic to shellfish. Enjoys gospel music and crosswords.', emergency: 'Michelle Johnson (daughter) · (210) 555-0147' },
    { id: 'r2', clientId: 'c1', name: 'Harold Johnson', relation: 'Father', age: 85, address: '214 Oak Ridge Dr, San Antonio, TX 78245',
      careNotes: 'Hard of hearing — face him and speak clearly. Diabetic diet.', emergency: 'Michelle Johnson (daughter) · (210) 555-0147' },
    { id: 'r3', clientId: 'c1', name: 'Michelle Johnson', relation: 'Myself', age: 54, address: 'Alamo Heights, San Antonio, TX 78209', careNotes: '', emergency: 'David Johnson (husband) · (210) 555-0148' },
    { id: 'r4', clientId: 'c2', name: 'Robert Alvarez', relation: 'Myself', age: 71, address: '6815 Bandera Rd, San Antonio, TX 78238',
      careNotes: 'Recovering from knee surgery — no lifting heavy items. Small dog (friendly).', emergency: 'Ana Alvarez (daughter) · (210) 555-0193' },
    { id: 'r5', clientId: 'c3', name: 'Tom Nguyen', relation: 'Spouse', age: 78, address: 'Westover Hills, San Antonio, TX 78251',
      careNotes: "Parkinson's. Usually wakes 2–3 times a night and needs a steady arm to the bathroom.", emergency: 'Patricia Nguyen (wife) · (210) 555-0133' },
    { id: 'r6', clientId: 'c4', name: 'Walter Brooks', relation: 'Father', age: 88, address: '12662 Cygnus, San Antonio, TX 78245',
      careNotes: 'Lives alone. Independent but lonely since his wife passed. Needs help with groceries.', emergency: 'Linda Brooks (daughter) · (512) 555-0176' },
  ];
  const caregivers = [
    { id: 'g1', name: 'Gregory Care (Owner)', short: 'Owner', initials: 'GC', isOwner: true, role: 'Owner & Caregiver', phone: '(210) 555-0100', status: 'active', since: day(-400) },
    { id: 'g2', name: 'Tasha Williams', initials: 'TW', role: 'Caregiver', phone: '(210) 555-0161', status: 'active', since: day(-120) },
    { id: 'g3', name: 'Maria Lopez', initials: 'ML', role: 'Caregiver', phone: '(210) 555-0168', status: 'invited', since: day(-2) },
  ];

  /* ---- report text bank ---- */
  const summaries = {
    r1: ['Evelyn was in great spirits today. We did the crossword together, listened to her gospel playlist and took a short walk to the mailbox with her walker. Lunch was chicken soup and she ate it all.',
      'Quiet morning — Evelyn was a little tired but brightened up after breakfast. Laundry and kitchen done. She asked about Michelle\'s visit this weekend.',
      'We sorted the photo albums and she told stories about her teaching days. Light housekeeping done, fridge restocked from the list. Reminded her to drink water through the morning.',
      'Evelyn needed a few reminders about the day and date but was calm and cheerful. Made baked fish and vegetables (no shellfish). Changed bed linens.'],
    r2: ['Picked up Harold\'s prescriptions and groceries (diabetic-friendly list). Sorted his mail and wrote his appointments on the kitchen calendar. He was cheerful and chatty.'],
    r4: ['Picked up groceries and the pharmacy order. Vacuumed living room, cleaned kitchen and changed sheets. Robert is walking more steadily — no complaints of knee pain today.'],
    r5: ['Tom slept from about 10:30 PM. Helped him to the bathroom at 1:15 AM and 4:40 AM — steady both times. Morning routine done before Patricia woke up; he had oatmeal and tea.'],
  };
  const moods = ['Cheerful', 'Calm', 'Tired', 'Cheerful'];

  let vseq = 1;
  const visits = [];
  function mkVisit(bookingId, rid, date, from, to, gid, services, k) {
    const v = { id: 'V-' + String(1000 + vseq++), bookingId, recipientId: rid, date, from, to, caregiverId: gid, status: 'scheduled', clockIn: null, clockOut: null, report: null, review: null };
    const off = Math.round((_pd(date) - _pd(day(0))) / 864e5);
    const pastDone = off < 0 || (off === 0 && nowMin >= toMin(to) + 5 && toMin(to) > toMin(from));
    const inProg = off === 0 && nowMin >= toMin(from) + 5 && (nowMin < toMin(to) + 5 || toMin(to) < toMin(from));
    if (pastDone || inProg) v.clockIn = at(off, String(Math.floor((toMin(from) + 4) / 60)).padStart(2, '0') + ':' + String((toMin(from) + 4) % 60).padStart(2, '0'));
    if (inProg) v.status = 'in_progress';
    if (pastDone) {
      v.status = 'completed';
      const endOff = toMin(to) < toMin(from) ? off + 1 : off;
      v.clockOut = at(endOff, String(Math.floor((toMin(to) - 3) / 60)).padStart(2, '0') + ':' + String((toMin(to) - 3 + 60) % 60).padStart(2, '0'));
      const bank = summaries[rid] || ['Visit completed as planned.'];
      const svcTasks = services.flatMap(s => (GC_SERVICES.find(x => x.id === s) || { tasks: [] }).tasks);
      v.report = {
        tasks: svcTasks.filter((_, i) => (i + k) % 4 !== 3),
        adls: services.includes('adl') ? { bathing: k % 2 ? 'assisted' : 'independent', dressing: 'assisted', eating: 'independent', toileting: 'independent', mobility: 'assisted', continence: 'independent' } : null,
        mood: moods[k % moods.length], meals: rid === 'r5' ? 'Water at 1:15 AM. Oatmeal and tea at 6:30 AM.' : 'Breakfast eaten. Lunch: full portion. 3 glasses of water.',
        summary: bank[k % bank.length], concerns: k % 5 === 2 ? 'Slight bruise on left forearm — Evelyn says she bumped the door frame. Will keep an eye on it.' : '',
        submittedAt: v.clockOut,
      };
      v.review = { status: 'shared', sharedAt: v.clockOut, by: 'Owner' };
    }
    visits.push(v);
    return v;
  }

  const bookings = [];
  function booking(b) { bookings.push(Object.assign({ events: [], thread: [], unread: { admin: 0, client: 0 } }, b)); return bookings.at(-1); }

  /* Anchor today's demo visits to the current time: the owner is mid-visit when the demo opens */
  const hm = (m) => String(Math.floor(((m % 1440) + 1440) % 1440 / 60)).padStart(2, '0') + ':' + String(((m % 60) + 60) % 60).padStart(2, '0');
  const liveStart = Math.max(0, Math.floor((nowMin - 40) / 30) * 30);
  const EV_FROM = hm(liveStart), EV_TO = hm(liveStart + 180);
  const laterStart = liveStart + 240;
  const robertToday = laterStart + 120 < 1440 ? [0, hm(laterStart), hm(laterStart + 120)] : [1, '10:00', '12:00'];

  /* B-201 · Michelle → Evelyn (mother) · recurring 3x a week */
  const dow0 = now.getDay();
  const evDays = [dow0, (dow0 + 2) % 7, (dow0 + 5) % 7].sort();
  const b1 = booking({ id: 'B-201', clientId: 'c1', recipientId: 'r1', services: ['companion', 'cleaning', 'adl'], type: 'recurring',
    request: { days: evDays, start: day(-21), end: null, from: EV_FROM, to: EV_TO },
    notes: 'Mom does best with the same caregiver where possible. Key is in the lockbox — code shared by phone.', status: 'scheduled', created: at(-24, '19:10'), scheduledAt: at(-23, '10:00') });
  let k = 0;
  for (let o = -21; o <= 21; o++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + o);
    if (!evDays.includes(d.getDay())) continue;
    const gid = (o < 0 && k % 3 === 2) || (o > 0 && k % 4 === 1) ? 'g2' : 'g1';
    mkVisit(b1.id, 'r1', day(o), EV_FROM, EV_TO, o === 0 ? 'g1' : gid, b1.services, k++);
  }
  // most recent past visit → by Tasha, report awaiting owner review
  const evPast = visits.filter(v => v.bookingId === 'B-201' && v.status === 'completed');
  const awaiting = evPast.at(-1);
  awaiting.caregiverId = 'g2';
  awaiting.review = { status: 'pending' };
  awaiting.report.summary = 'Evelyn was cheerful and chatty. We baked oatmeal cookies together (her recipe) and she showed me photos from her grandson\'s graduation. Kitchen and bathroom cleaned, laundry folded and put away.';
  awaiting.report.concerns = 'She was a little unsteady getting up from the sofa in the afternoon — might be worth asking her doctor about her blood pressure meds.';
  awaiting.report.mood = 'Cheerful';
  b1.events.push(
    { t: at(-24, '19:10'), role: 'client', by: 'Michelle Johnson', text: 'Requested care for Evelyn · 3 visits a week', icon: 'send' },
    { t: at(-23, '10:00'), role: 'admin', by: 'Owner', text: 'Schedule confirmed · recurring visits created', icon: 'calendar-check' });
  b1.thread.push(
    { role: 'client', by: 'Michelle Johnson', text: 'Thank you for the reports — it is such a relief to know how Mom\'s day went while I\'m at work.', t: at(-5, '18:30') },
    { role: 'admin', by: 'Owner', text: 'It is our pleasure, Michelle. Evelyn is a joy to be with.', t: at(-5, '19:02') });

  /* B-202 · Robert (himself) · custom dates */
  const b2 = booking({ id: 'B-202', clientId: 'c2', recipientId: 'r4', services: ['errands', 'cleaning'], type: 'custom',
    request: { dates: [[day(-6), '10:00', '12:00'], [day(robertToday[0]), robertToday[1], robertToday[2]], [day(4), '10:00', '12:00'], [day(11), '10:00', '12:00']] },
    notes: 'Grocery list will be on the fridge.', status: 'scheduled', created: at(-9, '11:20'), scheduledAt: at(-8, '09:15') });
  mkVisit(b2.id, 'r4', day(-6), '10:00', '12:00', 'g1', b2.services, 0);
  mkVisit(b2.id, 'r4', day(robertToday[0]), robertToday[1], robertToday[2], 'g1', b2.services, 1);
  mkVisit(b2.id, 'r4', day(4), '10:00', '12:00', 'g2', b2.services, 2);
  mkVisit(b2.id, 'r4', day(11), '10:00', '12:00', 'g1', b2.services, 3);
  b2.events.push({ t: at(-9, '11:20'), role: 'client', by: 'Robert Alvarez', text: 'Requested care for himself · 4 selected dates', icon: 'send' },
    { t: at(-8, '09:15'), role: 'admin', by: 'Owner', text: 'Schedule confirmed · 4 visits', icon: 'calendar-check' });

  /* B-203 · Patricia → Tom (husband) · overnight sitting on selected nights */
  const b3 = booking({ id: 'B-203', clientId: 'c3', recipientId: 'r5', services: ['overnight'], type: 'custom',
    request: { dates: [[day(-6), '20:00', '06:00'], [day(1), '20:00', '06:00'], [day(8), '20:00', '06:00']] },
    notes: 'I need to sleep through on these nights. Spare room is made up for the caregiver.', status: 'scheduled', created: at(-10, '21:00'), scheduledAt: at(-9, '08:30') });
  [-6, 1, 8].forEach((o, i) => mkVisit(b3.id, 'r5', day(o), '20:00', '06:00', 'g2', b3.services, i));
  b3.events.push({ t: at(-10, '21:00'), role: 'client', by: 'Patricia Nguyen', text: 'Requested overnight care for Tom · 3 nights', icon: 'send' },
    { t: at(-9, '08:30'), role: 'admin', by: 'Owner', text: 'Schedule confirmed · Tasha Williams assigned', icon: 'calendar-check' });

  /* B-205 · Michelle → Harold (father) · one-time, done */
  const b5 = booking({ id: 'B-205', clientId: 'c1', recipientId: 'r2', services: ['errands', 'daily'], type: 'once',
    request: { dates: [[day(-10), '13:00', '15:00']] }, notes: 'Prescriptions are ready at the Walgreens on Military Dr.', status: 'completed', created: at(-13, '08:40'), scheduledAt: at(-13, '09:30') });
  mkVisit(b5.id, 'r2', day(-10), '13:00', '15:00', 'g1', b5.services, 0);
  b5.events.push({ t: at(-13, '08:40'), role: 'client', by: 'Michelle Johnson', text: 'Requested a one-time visit for Harold', icon: 'send' },
    { t: at(-13, '09:30'), role: 'admin', by: 'Owner', text: 'Schedule confirmed', icon: 'calendar-check' });

  /* B-204 · NEW · Linda → Walter (father) · picked dates: Mon, Fri next week, Tue the week after */
  const nextMon = (8 - dow0) % 7 || 7;
  const b4 = booking({ id: 'B-204', clientId: 'c4', recipientId: 'r6', services: ['companion', 'errands'], type: 'custom',
    request: { dates: [[day(nextMon), '10:00', '13:00'], [day(nextMon + 11), '10:00', '13:00'], [day(nextMon + 15), '11:00', '14:00']] },
    notes: 'Dad lives alone since Mom passed. He would love some company and help with groceries. He is hard to reach by phone — please call me instead.',
    status: 'new', created: ago(125) });
  b4.events.push({ t: ago(125), role: 'client', by: 'Linda Brooks', text: 'Requested care for Walter (father) · 3 selected dates', icon: 'send' });
  b4.thread.push({ role: 'client', by: 'Linda Brooks', text: 'Hi! First time using Gregory Care. Is it possible to have the same caregiver each time?', t: ago(120) });
  b4.unread.admin = 1;

  /* B-206 · NEW · Michelle (herself) · one-time */
  const b6 = booking({ id: 'B-206', clientId: 'c1', recipientId: 'r3', services: ['cleaning', 'errands'], type: 'once',
    request: { dates: [[day(5), '09:00', '12:00']] }, notes: 'I am having minor surgery and will be off my feet for a few days. Light cleaning and a grocery run would help a lot.',
    status: 'new', created: ago(40) });
  b6.events.push({ t: ago(40), role: 'client', by: 'Michelle Johnson', text: 'Requested a one-time visit for herself', icon: 'send' });

  // visit-level events for the activity feed
  visits.forEach(v => {
    const b = bookings.find(x => x.id === v.bookingId);
    const g = caregivers.find(x => x.id === v.caregiverId);
    if (v.clockIn) b.events.push({ t: v.clockIn, role: 'caregiver', by: g.name, text: `Clocked in · ${_pd(v.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`, icon: 'log-in' });
    if (v.clockOut) b.events.push({ t: v.clockOut, role: 'caregiver', by: g.name, text: 'Clocked out · visit report submitted', icon: 'clipboard-check' });
    if (v.review && v.review.status === 'shared') b.events.push({ t: v.review.sharedAt, role: 'admin', by: 'Owner', text: 'Visit report shared with the family', icon: 'share-2' });
  });

  const announcements = [
    { id: 'a1', audience: 'clients', title: 'Holiday schedule', body: 'Visits continue as normal over the holidays. If you need extra overnight sitting, book early — dates are filling up.', t: at(-4, '10:00') },
    { id: 'a2', audience: 'caregivers', title: 'Reports within the hour', body: 'Please submit your visit report before leaving or within an hour of clocking out — families read them the same day.', t: at(-2, '08:00') },
  ];

  return { version: 1, seededOn: day(0), seq: 207, vseq: 1000 + vseq, services: GC_SERVICES, clients, recipients, caregivers, bookings, visits, announcements };
}
