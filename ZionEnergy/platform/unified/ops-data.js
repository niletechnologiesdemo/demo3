/* ============================================================================
   Zion Unified — the field-operations half.

   Everything below hangs off the SAME masters the inspection side already uses:
   the same customers, the same sites, the same people. Nothing is duplicated.
   A JOB is the spine — dispatch creates it, the crew works it, the inspection
   record attaches to it, and the invoice comes off the same record.
   ============================================================================ */
(function () {
  const D = window.ZD;

  /* people gain their field-operations attributes rather than living in a
     second directory: pay rules, certifications, crew membership */
  const workforce = {
    'EMP-01':{ pay:'salary', rate:0,     ot:40, cert:['API 5DP','DS-1'],        phone:'(432) 555-0101' },
    'EMP-02':{ pay:'hourly', rate:42.50, ot:40, cert:['MPI L-II','UT L-II','VT L-II'], phone:'(432) 555-0102' },
    'EMP-03':{ pay:'hourly', rate:38.00, ot:40, cert:['MPI L-II','LPI L-II'],   phone:'(432) 555-0103' },
    'EMP-04':{ pay:'hourly', rate:36.50, ot:40, cert:['MPI L-I','VT L-II'],     phone:'(432) 555-0104' },
    'EMP-05':{ pay:'salary', rate:0,     ot:45, cert:['Supervisor'],            phone:'(432) 555-0105' },
    'EMP-06':{ pay:'salary', rate:0,     ot:40, cert:[],                        phone:'(432) 555-0106' }
  };

  const crews = [
    { id:'CRW-01', name:'Shop Crew A',   lead:'EMP-02', members:['EMP-02','EMP-04'],
      shift:'Day · 06:00–18:00',   base:'Midland Shop',  otCap:20, status:'On site' },
    { id:'CRW-02', name:'Field Crew B',  lead:'EMP-03', members:['EMP-03'],
      shift:'Day · 06:00–18:00',   base:'Midland Shop',  otCap:20, status:'In transit' },
    { id:'CRW-03', name:'Night Crew',    lead:'EMP-04', members:['EMP-04','EMP-02'],
      shift:'Night · 18:00–06:00', base:'Odessa Yard',   otCap:16, status:'Off shift' }
  ];

  /* A job carries dispatch AND inspection. `inspection` links to the record the
     reporting side already holds — in the legacy system this was the empty
     job_id / job_no column pair. */
  const jobs = [
    { no:'JOB-2026-0118', cust:'CUS-03', loc:'LOC-03', crew:'CRW-01', priority:'High',
      scheduled:'2026-08-20 07:00', started:'2026-08-20 07:12', finished:'2026-08-20 15:40',
      status:'Inspection complete', inspection:'6198', type:'Shop inspection',
      geo:{ fence:200, verified:true }, notes:'21 handling plugs and swages in for annual.' },
    { no:'JOB-2026-0117', cust:'CUS-01', loc:'LOC-01', crew:'CRW-02', priority:'Normal',
      scheduled:'2026-08-20 06:30', started:'2026-08-20 06:41', finished:'2026-08-20 14:05',
      status:'Inspection complete', inspection:'6194', type:'Shop inspection',
      geo:{ fence:200, verified:true }, notes:'' },
    { no:'JOB-2026-0116', cust:'CUS-04', loc:'LOC-04', crew:'CRW-01', priority:'High',
      scheduled:'2026-08-19 07:00', started:'2026-08-19 07:03', finished:'2026-08-19 12:20',
      status:'Report submitted', inspection:'6192', type:'MWD collars',
      geo:{ fence:150, verified:true }, notes:'Rig Nabors X12.' },
    { no:'JOB-2026-0115', cust:'CUS-01', loc:'LOC-01', crew:'CRW-02', priority:'Normal',
      scheduled:'2026-08-19 06:30', started:'2026-08-19 06:35', finished:'2026-08-19 11:50',
      status:'Invoiced', inspection:'6187', type:'Shop inspection',
      geo:{ fence:200, verified:true }, notes:'' },
    { no:'JOB-2026-0114', cust:'CUS-02', loc:'LOC-02', crew:'CRW-01', priority:'Normal',
      scheduled:'2026-08-18 07:00', started:'2026-08-18 07:20', finished:'2026-08-18 16:10',
      status:'Report approved', inspection:'6185', type:'Thru tubing motors',
      geo:{ fence:250, verified:false }, notes:'Check-in recorded 140 m outside the fence.' },
    { no:'JOB-2026-0119', cust:'CUS-05', loc:'LOC-05', crew:'CRW-02', priority:'Urgent',
      scheduled:'2026-08-21 06:00', started:null, finished:null,
      status:'Dispatched', inspection:null, type:'Rig mast inspection',
      geo:{ fence:300, verified:null }, notes:'PA Yard. Third party — Ranger to countersign.' },
    { no:'JOB-2026-0120', cust:'CUS-06', loc:'LOC-06', crew:'CRW-03', priority:'Normal',
      scheduled:'2026-08-21 18:00', started:null, finished:null,
      status:'Scheduled', inspection:null, type:'Crossover inspection',
      geo:{ fence:200, verified:null }, notes:'' },
    { no:'JOB-2026-0121', cust:'CUS-07', loc:'LOC-07', crew:null, priority:'Normal',
      scheduled:'2026-08-22 07:00', started:null, finished:null,
      status:'Unassigned', inspection:null, type:'Pump strip and inspect',
      geo:{ fence:200, verified:null }, notes:'Needs a crew.' }
  ];

  /* attendance — one geo-verified record per person per job */
  const attendance = [
    { job:'JOB-2026-0118', emp:'EMP-02', in:'07:12', out:'15:40', hrs:8.47, geo:'Verified', flag:null },
    { job:'JOB-2026-0118', emp:'EMP-04', in:'07:14', out:'15:38', hrs:8.40, geo:'Verified', flag:null },
    { job:'JOB-2026-0117', emp:'EMP-03', in:'06:41', out:'14:05', hrs:7.40, geo:'Verified', flag:null },
    { job:'JOB-2026-0116', emp:'EMP-02', in:'07:03', out:'12:20', hrs:5.28, geo:'Verified', flag:null },
    { job:'JOB-2026-0115', emp:'EMP-03', in:'06:35', out:'11:50', hrs:5.25, geo:'Verified', flag:null },
    { job:'JOB-2026-0114', emp:'EMP-02', in:'07:20', out:'16:10', hrs:8.83, geo:'Outside fence',
      flag:'Checked in 140 m outside the configured geo-fence' },
    { job:'JOB-2026-0114', emp:'EMP-04', in:'07:22', out:'16:10', hrs:8.80, geo:'Verified', flag:null },
    { job:'JOB-2026-0116', emp:'EMP-04', in:'07:05', out:'12:18', hrs:5.22, geo:'Verified', flag:'Missed check-out — corrected by admin' }
  ];

  /* mileage — priced from the SAME customer price sheet the inspection uses */
  const mileage = [
    { id:'M-01', emp:'EMP-03', job:'JOB-2026-0117', date:'2026-08-20', from:'Midland Shop',
      to:'Alliance Drilling Tools', miles:14.2, type:'Work', billable:true,  status:'Approved' },
    { id:'M-02', emp:'EMP-02', job:'JOB-2026-0118', date:'2026-08-20', from:'Midland Shop',
      to:'Tubular Solutions', miles:9.4,  type:'Work', billable:true,  status:'Approved' },
    { id:'M-03', emp:'EMP-02', job:'JOB-2026-0116', date:'2026-08-19', from:'Midland Shop',
      to:'Gordon Technologies, Odessa', miles:22.8, type:'Work', billable:true, status:'Pending' },
    { id:'M-04', emp:'EMP-04', job:'JOB-2026-0114', date:'2026-08-18', from:'Odessa Yard',
      to:'NOV I20 & 1788', miles:6.1,  type:'Work', billable:true,  status:'Pending' },
    { id:'M-05', emp:'EMP-03', job:null,            date:'2026-08-18', from:'Home',
      to:'Midland Shop', miles:11.0, type:'Personal', billable:false, status:'Rejected' }
  ];


  /* ---------- GEOGRAPHY ----------
     Real coordinates for each site, so the operations map places crews and
     job sites in their true relative positions rather than decoratively. */
  const siteGeo = {
    'LOC-01':{ lat:31.9840, lng:-102.0980, region:'permian' },   /* Alliance — Midland */
    'LOC-02':{ lat:31.8930, lng:-102.2600, region:'permian' },   /* NOV — Odessa, I20 & 1788 */
    'LOC-03':{ lat:31.9450, lng:-102.2100, region:'permian' },   /* Tubular Solutions — Midland */
    'LOC-04':{ lat:31.8700, lng:-102.4200, region:'permian' },   /* Gordon — Odessa */
    'LOC-05':{ lat:31.9113, lng:-102.1970, region:'permian' },   /* Ranger PA Yard — Midland */
    'LOC-06':{ lat:32.0200, lng:-102.1500, region:'permian' },   /* NXL — Midland */
    'LOC-07':{ lat:31.9700, lng:-102.1400, region:'permian' },   /* Premium Oilfield — Midland */
    'LOC-08':{ lat:35.4460, lng:-97.5600,  region:'oklahoma' }   /* Stealth Thru Tubing — OKC */
  };

  const regions = {
    permian:  { name:'Permian Basin', w:-102.55, e:-101.95, n:32.08, s:31.80,
      towns:[{n:'Midland', lat:31.9973, lng:-102.0779},{n:'Odessa', lat:31.8457, lng:-102.3676}],
      roads:[[[-102.55,31.845],[-101.95,31.90]],           /* I-20 corridor */
             [[-102.08,32.08],[-102.10,31.80]],            /* SH-349 */
             [[-102.37,32.08],[-102.30,31.80]]] },         /* SH-302 */
    oklahoma: { name:'Oklahoma', w:-97.80, e:-97.30, n:35.60, s:35.30,
      towns:[{n:'Oklahoma City', lat:35.4676, lng:-97.5164}],
      roads:[[[-97.80,35.47],[-97.30,35.46]],[[-97.52,35.60],[-97.55,35.30]]] }
  };

  /* where each crew is right now — the live layer */
  const live = [
    { crew:'CRW-01', at:'LOC-03', lat:31.9452, lng:-102.2098, status:'On site',
      job:'JOB-2026-0118', updated:'4 min ago', inFence:true },
    { crew:'CRW-02', at:null,     lat:31.9520, lng:-102.1520, status:'In transit',
      job:'JOB-2026-0119', updated:'2 min ago', inFence:null,
      route:[[-102.0980,31.9840],[-102.1520,31.9520],[-102.1970,31.9113]] },
    { crew:'CRW-03', at:'LOC-02', lat:31.8946, lng:-102.2588, status:'Off shift',
      job:null, updated:'6 h ago', inFence:true }
  ];

  /* what the merge actually does to the data — used by the Data Model view */
  const merge = [
    { entity:'Customers', rep:'Company Headquarters — 44 records', dis:'Clients — 11 records',
      key:'Legal name + client code', keep:'Reporting', drop:'11 dispatch clients collapse into the 44',
      note:'Every dispatch client already exists as a reporting customer. The dispatch copy is a thinner duplicate.' },
    { entity:'Sites', rep:'Company Locations — 45 records', dis:'Sites — 12 records',
      key:'Street address + city', keep:'Reporting', drop:'12 dispatch sites collapse into the 45',
      note:'Reporting holds the SLA, price sheet and connection standards per site. Dispatch holds only an address and a geo-fence — that fence moves onto the reporting site record.' },
    { entity:'Divisions', rep:'Division per location', dis:'Division per site', key:'Name within site',
      keep:'Reporting', drop:'Second division list', note:'Identical three-level hierarchy on both sides.' },
    { entity:'People', rep:'Employees + Portal Users', dis:'Employees + Teams & Crews',
      key:'Email, then full name', keep:'Merged', drop:'One of two directories',
      note:'Inspector certifications live on the reporting side, pay rules and crew membership on the dispatch side. One person record carries both.' },
    { entity:'Jobs', rep:'inspections.job_id / job_no — empty columns', dis:'JOB-2026-nnnn',
      key:'job_no', keep:'Dispatch', drop:'The reconciliation itself',
      note:'The reporting schema already carries these columns unused. Dispatch becomes the parent record and the inspection attaches to it.' },
    { entity:'Rules & compliance', rep:'Per-customer SLA, PO rules, report distribution',
      dis:'Per-client SLA, geo-fence, attendance triggers', key:'Customer + site', keep:'Merged',
      drop:'Second rule engine', note:'One rule set per customer covering both halves of the work.' },
    { entity:'Rates & pricing', rep:'Price sheets, standard rates, misc items',
      dis:'Mileage rate, OT multiplier, pay rules', key:'Customer', keep:'Merged',
      drop:'Second rate table', note:'Mileage and hourly already sit on the reporting price sheet. Dispatch reads the same rates instead of keeping its own.' },
    { entity:'Time & mileage', rep:'"Time Mileage Logs" in the permission matrix — never built',
      dis:'Mileage tracker, timesheets, payout', key:'Person + job + date', keep:'Dispatch',
      drop:'An entire unbuilt module', note:'Reporting was going to build this. It already exists on the dispatch side.' },
    { entity:'Access control', rep:'Roles with module-level CRUD', dis:'Roles with module-level CRUD',
      key:'Role name', keep:'Merged', drop:'Second permission matrix',
      note:'Both sides already model permissions the same way. One matrix covers both.' }
  ];

  Object.assign(D, { workforce, crews, jobs, attendance, mileage, merge, siteGeo, regions, live,
    crewById: id => crews.find(c => c.id === id),
    jobByNo:  n  => jobs.find(j => j.no === n),
    jobForInspection: no => jobs.find(j => j.inspection === no) });
})();
