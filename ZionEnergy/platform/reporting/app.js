/* Zion Platform — shell, router, AI assistant. */
(function () {
  const D = window.ZD, AI = window.ZAI;

  /* ---------- state ---------- */
  const S = { role:'Super Admin', route:'dashboard', arg:null, tab:0, thread:'TH-01', chat:[], chatOpen:false, helpMode:false, aiOpen:{}, tsub:'tool', calMode:'week', calAnchor:null, mapRegion:'permian' };
  window.S = S;

  /* ---------- helpers ---------- */
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const money = AI.money;
  const go = (r, a) => { location.hash = '#/' + r + (a ? '/' + a : ''); };
  const pill = (t, k) => `<span class="pill p-${k}">${esc(t)}</span>`;
  const statusPill = s => pill(s, s==='OK'||s==='Paid'||s==='Approved' ? 'ok'
    : s==='REJECTED'||s==='Overdue' ? 'bad'
    : s==='In Progress'||s==='Sent' ? 'info'
    : s==='Submitted' ? 'acc' : s==='Unsent' ? 'warn' : 'mute');
  window.UI = { esc, money, go, pill, statusPill };

  const I = {
    grid:'<path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/>',
    clipboard:'<path d="M9 2h6v4H9zM7 4H5v18h14V4h-2"/>',
    layers:'<path d="M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>',
    building:'<path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h2M9 13h2M13 9h2M13 13h2M9 21v-4h6v4"/>',
    invoice:'<path d="M6 2h9l5 5v15H6zM15 2v5h5M9 12h7M9 16h5"/>',
    chat:'<path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    gauge:'<path d="M12 21a9 9 0 1 1 9-9M12 12l4-3"/>',
    shield:'<path d="M12 2 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6z"/>',
    table:'<path d="M3 5h18v14H3zM3 10h18M9 10v9"/>',
    sparkle:'<path d="M12 2l1.9 5.6L19.5 9l-5.6 1.9L12 16l-1.9-5.1L4.5 9l5.6-1.4z"/><path d="M18.5 14.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>',
    bell:'<path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8M13.7 21a2 2 0 0 1-3.4 0"/>',
    link:'<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2"/>',
    lock:'<path d="M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4"/>',
    truck:'<path d="M1 3h15v13H1zM16 8h4l3 3v5h-7M5.5 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18.5 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>',
    back:'<path d="M19 12H5M12 19l-7-7 7-7"/>',
    send:'<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>',
    phone:'<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>'
  };
  const ic = (n, cls) => `<svg class="${cls||'ic'}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${I[n]}</svg>`;
  window.UI.ic = ic;

  const LOGO = `<svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
    <circle cx="24" cy="24" r="21" stroke="currentColor" stroke-width="2.4"/>
    <path d="M15 15h18l-13 18h13" stroke="currentColor" stroke-width="3.4" stroke-linecap="square" stroke-linejoin="miter"/>
    <path d="M24 3v42" stroke="currentColor" stroke-width="1" opacity=".28"/></svg>`;

  /* ---------- navigation (role-gated) ---------- */
  const NAV = window.NAV_OVERRIDE || [
    { g:'Overview', items:[
      { r:'dashboard', n:'Dashboard', i:'grid', k:'dashboard' } ] },
    { g:'Inspections', items:[
      { r:'inspections', n:'Inspections', i:'clipboard', k:'inspections', c:()=>D.inspections.length },
      { r:'items', n:'Inspected Items', i:'layers', k:'items', c:()=>Object.keys(D.items).length },
      { r:'tickets', n:'Inspection Tickets', i:'table', k:'inspections', c:()=>D.tickets.length } ] },
    { g:'Accounts', items:[
      { r:'accounts', n:'Customers & Sites', i:'building', k:'accounts', c:()=>D.customers.length } ] },
    { g:'Billing', items:[
      { r:'invoices', n:'Invoices', i:'invoice', k:'invoices', c:()=>D.invoices.length },
      { r:'analytics', n:'Revenue Intelligence', i:'gauge', k:'invoices' } ] },
    { g:'Configuration', items:[
      { r:'standards', n:'Connection Standards', i:'gauge', k:'accounts', c:()=>D.connectionTypes.length },
      { r:'formats', n:'Report Formats', i:'table', k:'accounts', c:()=>D.reportFormats.length },
      { r:'jsa', n:'Job Safety Analysis', i:'shield', k:'inspections', c:()=>D.jsaTemplates.length },
      { r:'master', n:'Master Data', i:'layers', k:'accounts' },
      { r:'access', n:'Roles & Access', i:'shield', k:'dashboard' } ] },
    { g:'Platform', items:[
      { r:'dispatch', n:'Zion Dispatch', i:'truck', k:'dispatch', ext:true } ] }
  ];

  function allowed(k) {
    const R = D.roles[S.role];
    if (k === 'dispatch') return R.dispatch === true || R.dispatch === 'read';
    if (R.modules === 'all') return true;
    return R.modules.indexOf(k) > -1 || (k==='accounts' && R.modules.indexOf('accounts')>-1);
  }
  window.UI.allowed = allowed;

  /* ---------- shell ---------- */
  function sidebar() {
    return `<aside class="side">
      <div class="brand"><img src="../assets/logo-light.png" alt="Zion Energy Services"/>
        ${window.APP_TAG ? `<span class="apptag">${esc(window.APP_TAG)}</span>` : ''}</div>
      ${NAV.map(g => `<div class="navgroup"><div class="eyebrow">${g.g}</div><nav class="nav">
        ${g.items.map(it => {
          const ok = allowed(it.k);
          const cnt = it.c ? it.c() : null;
          if (it.ext) return `<a class="${ok?'':'locked'}" ${ok?'href="http://44.213.195.233" target="_blank" rel="noopener"':''}>
            ${ic(it.i)}<span>${it.n}</span>${ok?'':ic('lock','ic')}</a>`;
          return `<a class="${S.route===it.r?'on':''} ${ok?'':'locked'}" ${ok?`href="#/${it.r}"`:''}>
            ${ic(it.i)}<span>${it.n}</span>${!ok?ic('lock','ic'):(cnt?`<span class="cnt">${cnt}</span>`:'')}</a>`;
        }).join('')}
      </nav></div>`).join('')}
      <div class="side-foot">
        <div class="eyebrow" style="margin-bottom:6px">Viewing as</div>
        <div style="font-family:var(--disp);font-size:13px;letter-spacing:.04em;text-transform:uppercase">${esc(S.role)}</div>
        <div class="dim" style="font-size:11px;line-height:1.5;margin-top:5px">${esc(D.roles[S.role].note)}</div>
      </div>
    </aside>`;
  }

  function topbar(crumb) {
    const roles = Object.keys(D.roles);
    return `<div class="top">
      <div class="crumb">${esc(window.APP_NAME || 'Zion Reporting')} <span style="opacity:.4">/</span> <b>${esc(crumb)}</b></div>
      <div class="sp"></div>
      <span class="eyebrow" style="display:flex;align-items:center;gap:4px">Viewing as ${window.UI.help('role')}</span>
      <div class="roleswitch">${roles.map(r=>`<button data-role="${esc(r)}" class="${S.role===r?'on':''}">${esc(r)}</button>`).join('')}</div>
      <button class="btn sm ${S.helpMode?'pri':''}" data-help-toggle title="Show help markers">? Help</button>
      <button class="iconbtn" data-reset title="Reset demo data">${ic('back')}</button>
      <div class="avatar">${esc(WHO[S.role]||'ZE')}</div>
    </div>`;
  }

  const WHO = { 'Super Admin':'HS', 'Operations Manager':'NP', 'Inspector':'LL', 'Billing':'DW' };

  /* ---------- CONTEXTUAL HELP ----------
     Short, plain explanations attached to the control they describe, for people
     who are new to the system. Toggled visible with the Help button in the top bar. */
  const HELP = {
    role:{t:'Who you are signed in as',b:'The platform shows different things to different people. Switching here changes which modules appear, whether rates are visible, and whether customer contact details are shown or masked.',eg:'An inspector sees their jobs and reports. Billing sees invoices but cannot edit an inspection.'},
    help:{t:'Help mode',b:'Turns on the small question marks beside fields and buttons across the platform. Click any of them for a plain explanation of what that control does.',eg:'Useful when someone new joins — no manual required.'},
    ask:{t:'Ask Zion',b:'A question box that answers from the records already in the platform: inspections, tolerances, calibration, price sheets and the ledger. It does not guess — every answer is assembled from data you can open yourself.',eg:'Try: "what is outstanding on NOV" or "which dimensions are marginal".'},

    inspStatus:{t:'Inspection status',b:'Where the job sits in its lifecycle. In Progress means the inspector is still working. Submitted means it is waiting for review. Approved releases it to the customer. Invoice Pending means it is ready to bill.',eg:'Status controls what can still be edited and who is notified.'},
    lead:{t:'Lead inspector',b:'The person accountable for this inspection. Their signature appears on the report and their certification is what the customer is relying on.',eg:'Assistant inspectors can record readings but the lead signs it off.'},
    po:{t:'AFE / PO number',b:'The customer\u2019s purchase order or authorisation-for-expenditure reference. On accounts configured to require one, an invoice cannot be raised without it.',eg:'If this is blank on such an account, the job will stall at billing — ask for it now, not at invoice time.'},
    thirdParty:{t:'Third party',b:'Marks an inspection performed for someone other than the tool owner — typically an operator inspecting a rental company\u2019s equipment.',eg:'Changes who the report is addressed to and who gets billed.'},
    division:{t:'Division',b:'The customer\u2019s internal section or yard at that location. Sits below Location in the hierarchy: Customer, then Location, then Division.',eg:'Lets one customer keep separate reporting for their shop and their field yard.'},
    reportFormat:{t:'Report format',b:'Decides which columns appear on the printed report for this job. Each format is an ordered list of columns, each one showing a connection result, a body reading or an overall tool status.',eg:'Different tool families need different columns — a motor report is not a drill pipe report.'},

    equipment:{t:'Calibrated equipment',b:'The instruments used on this job, with their calibration dates. Readings taken on an instrument that was out of calibration are not defensible if the report is ever challenged.',eg:'The platform checks each expiry against the job date automatically.'},
    calExpiry:{t:'Calibration expiry',b:'When this instrument\u2019s certificate runs out. Anything measured after that date can be disputed.',eg:'Amber means it expires within 30 days. Red means it had already expired on the day of this job.'},

    spec:{t:'Inspected per',b:'Which published standard the inspection was carried out against. This determines the acceptance criteria applied to every reading.',eg:'DS-1 Cat 3-5 is the TH Hill drill stem standard. Customer Spec means the customer supplied their own criteria.'},
    blacklight:{t:'Blacklight intensity',b:'The UV lamp output measured at the inspection surface, in microwatts per square centimetre. Fluorescent magnetic particle inspection needs enough UV to make indications visible.',eg:'Most specifications require at least 1000 \u00b5W/cm\u00b2 measured at 15 inches.'},
    whiteLight:{t:'White light level',b:'Ambient visible light at the surface, in lux. Too little and a visual examination cannot be relied on.',eg:'Visual inspection generally requires 320 lux or more.'},
    bath:{t:'Bath concentration',b:'The strength of the magnetic particle suspension, taken from a settling test. Too weak and indications are missed; too strong and the background masks them.',eg:'Fluorescent baths usually run between 0.1 and 0.4 ml per 100 ml.'},
    dwell:{t:'Dwell time',b:'How long penetrant or developer is left on the surface before examination. Too short and small defects do not show.',eg:'Recorded so a report can be defended years later.'},

    jsa:{t:'Job safety analysis',b:'The hazard assessment completed before work starts: the steps involved, what could go wrong at each one, and the controls in place. Signed by everyone present.',eg:'Customers on their own sites frequently ask to see this.'},
    jsaSteps:{t:'Writing the steps',b:'Break the job into the sequence a crew actually follows, then name what can go wrong at each step and the control that removes it.',eg:'Format: step, hazard, control — separated by pipes, one per line.'},
    qa:{t:'Quality assurance closeout',b:'The housekeeping checklist completed before leaving site. It protects Zion as much as the customer — most complaints after a job are about the state the shop was left in.',eg:'Each item is ticked by the crew before the job can be submitted.'},

    itemVerdict:{t:'How an item passes or fails',b:'An item takes the worst result of three things: its body condition, its connection measurements, and its miscellaneous findings. Any one of them failing rejects the whole item.',eg:'A tool can have perfect connections and still be rejected on a body crack.'},
    bodyStatus:{t:'Body status',b:'The condition of the tool body itself, away from the connections — cracks, pitting, wall thickness loss, damaged hardbanding.',eg:'BC means body crack. WT means wall thickness below minimum.'},
    connection:{t:'Connection results',b:'Each threaded end is measured against the standard for that connection type. Pin is the male end, box is the female end.',eg:'A 6 5/8 REG pin has its own allowed range for every dimension.'},
    tolerance:{t:'Reading the tolerance bar',b:'The field enters measurements as fractions. The platform converts them to decimal, compares them to the allowed range for that connection, and shows how much of the tolerance band is left before the dimension would be rejected.',eg:'Amber means it passes today but sits close to the limit — likely to fail on the next run.'},
    marginal:{t:'Marginal dimension',b:'A measurement that is still inside tolerance but within 15% of the reject limit. It passes now, and it is the thing most likely to fail next time.',eg:'Worth telling the customer about as planned work rather than letting it fail in service.'},
    miscItem:{t:'Misc items',b:'Additional work or findings recorded against the item outside the connections — hardbanding, refacing, cleaning, buffing. Each carries its own accept or reject code.',eg:'Anything rejected here usually becomes billable remedial work.'},

    closeOut:{t:'Close out',b:'Where the inspection turns into money. Every item inspected and every piece of remedial work found becomes a priced line here.',eg:'A reface discovered during inspection is billable — this is where it gets captured.'},
    billingAuth:{t:'Billing authorisation',b:'The priced summary the customer signs before an invoice is raised. It removes the argument later about what was agreed.',eg:'Once signed it converts straight into an invoice with no re-entry.'},
    standardRate:{t:'Standard rates',b:'The rate card for remedial work, taken from the customer\u2019s own price sheet rather than typed in per job.',eg:'Changing a rate on the price sheet changes it everywhere it is used.'},
    priceSheet:{t:'Price sheet',b:'What this customer pays. Rates are keyed on material, method and unit of measure, and can carry a discount and a sales commission.',eg:'Mileage and hourly rates live here too.'},
    rules:{t:'Business rules',b:'Per-customer settings that change how the platform behaves for that account, without any code change.',eg:'Whether a PO is required, how reports are sent, how long before a reminder fires.'},
    distribution:{t:'Report distribution',b:'Who receives which report for this customer. Addresses are typed, so the shop gets day-to-day traffic while accounts payable only gets invoices.',eg:'Set once per customer rather than remembered per job.'},

    invoiceRisk:{t:'Payment risk',b:'A score based on how this account actually pays — average settlement days, how often they pay on time, how overdue this invoice already is, and whether a PO is on it.',eg:'It is a prompt about where to spend collection effort, not a credit decision.'},
    ageing:{t:'Ageing',b:'How long outstanding money has been outstanding, in bands. The further right the balance sits, the less likely it is to be collected in full.',eg:'Anything past 90 days usually needs a different conversation.'},
    unsent:{t:'Never sent',b:'Invoices that were raised in the system but never actually delivered to the customer. They are not in anyone\u2019s queue, so nobody is chasing them.',eg:'Usually the fastest money available.'},

    toolTemplate:{t:'Tool templates',b:'A tool template is the definition of a tool for one customer — its identity, the methods and materials it is inspected under, which report format it prints on, and the custom columns captured against it.',eg:'Change a template and every future inspection of that tool changes with it. Nothing is hard-coded.'},
    toolColumns:{t:'Column definition',b:'This is what makes each customer\u2019s report different. Every line becomes a column on the inspection entry form and on the printed report.',eg:'Write "Seal" for a free measurement field, or "Seal Status | OK/REJECTED/DBR" to make it a status column with those three options.'},
    toolParts:{t:'Parts list',b:'A multi-part tool is inspected part by part. Each part is captured against every column defined above, so a six-part pump produces six rows of results.',eg:'Format: part number, equipment, material — separated by pipes.'},
    itemTemplate:{t:'Item templates',b:'A shortcut for single tools a customer sends in repeatedly. Selecting one pre-fills the description, methods, materials, connection standard and rate.',eg:'Saves an inspector re-typing the same drill pipe definition forty times a week.'},
    newInspection:{t:'Creating an inspection',b:'Pick the customer and site first — that pulls in their rules, their price sheet and the connection standards their fleet runs. Everything downstream depends on getting this right.',eg:'Change the customer later and the pricing changes with it.'},
    newItem:{t:'Adding an item',b:'Each physical tool inspected gets its own record: serial, description, body condition and a measurement set per connection.',eg:'Enter measurements as fractions the way the field writes them — 6 7/16 — and the platform converts and compares.'},
    newCustomer:{t:'Creating a customer',b:'Sets up the account, its first location and its commercial terms. Rules, price sheet and connection standards are configured on the account afterwards.',eg:'The client code is generated from the company name.'},
    fraction:{t:'Entering a measurement',b:'Type it the way it is written on the tally — whole number and fraction separated by a space.',eg:'6 7/16 or 11/16 or 8. The platform stores the decimal and compares it to the standard.'},
    resetDemo:{t:'Reset demo data',b:'Puts the system back to its starting records. Anything created during the session is cleared.',eg:'Useful before showing someone else.'},

    connStd:{t:'Connection standards',b:'The tolerance library. Every pass or fail in the platform ultimately resolves to a minimum and maximum in one of these tables.',eg:'A blank min and max means that dimension is not checked at all for this connection.'},
    masterData:{t:'Master data',b:'The lists that populate every dropdown in the platform — methods, materials, units, acceptance codes, yards.',eg:'Adding a new inspection method here makes it available everywhere at once.'},
    access:{t:'Roles and access',b:'What each role can open, and what data they can see inside it.',eg:'An inspector never sees a rate. Billing never edits an inspection.'}
  };
  window.UI.help = k => HELP[k] ? `<button class="hb" data-help="${k}" title="What is this?">?</button>` : '';
  window.UI.addHelp = extra => Object.assign(HELP, extra || {});

  function closePop() {
    document.querySelectorAll('.pop').forEach(p => p.remove());
    document.querySelectorAll('.hb.on').forEach(x => x.classList.remove('on'));
  }

  function popover(key, x, y) {
    const h = HELP[key]; if (!h) return;
    const d = document.createElement('div');
    d.className = 'pop';
    d.innerHTML = `<button class="pop-x" data-pop-x>&#10005;</button>
      <div class="pk">${ic('sparkle')}<span>What is this?</span></div>
      <h4>${esc(h.t)}</h4><p>${esc(h.b)}</p>${h.eg?`<div class="eg"><b>Example.</b> ${esc(h.eg)}</div>`:''}`;
    document.body.appendChild(d);
    const w = d.offsetWidth, hh = d.offsetHeight;
    d.style.left = Math.max(12, Math.min(x - w/2, innerWidth - w - 12)) + 'px';
    d.style.top  = (y + hh + 16 > innerHeight ? Math.max(12, y - hh - 12) : y + 12) + 'px';
    d.querySelector('[data-pop-x]').onclick = closePop;
  }

  /* ---------- ZION INTELLIGENCE PANEL ---------- */
  const SEV = { high:0, med:1, low:2 };
  const CARET = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';

  function aiPanel(cfg) {
    const flags = (cfg.flags || []).slice().sort((a,b) => SEV[a.sev] - SEV[b.sev]);
    const id = cfg.id || (S.route + ':' + (cfg.title || 'ai'));
    if (S.aiOpen[id] === undefined) S.aiOpen[id] = !!cfg.open;
    const open = S.aiOpen[id];

    const n = { high:0, med:0, low:0 };
    flags.forEach(f => n[f.sev]++);
    const counts = [['high','h'],['med','m'],['low','l']]
      .filter(([k]) => n[k])
      .map(([k,c]) => `<span class="ai-dot ${c}"><i></i>${n[k]}</span>`).join('');

    /* the one line that shows when collapsed — the thing most worth knowing */
    let line;
    if (flags.length) line = `<b>${esc(flags[0].title)}</b>` + (flags.length > 1
      ? ` <span style="opacity:.62">and ${flags.length - 1} other${flags.length > 2 ? 's' : ''}</span>` : '');
    else if (cfg.narrative) line = esc(String(cfg.narrative).split(/(?<=\.)\s/)[0]);
    else line = '<span style="opacity:.62">Nothing needs attention here.</span>';

    return `<div class="ai ${open?'open':''} ${n.high?'alert':''}">
      <button class="ai-bar" data-ai="${esc(id)}">
        <span class="ai-spark">${ic('sparkle','')}</span>
        <span class="ai-name">Zion Intelligence</span>
        <span class="ai-line">${line}</span>
        <span class="ai-counts">${counts}</span>
        <span class="ai-caret">${CARET}</span>
      </button>
      <div class="ai-wrap"><div class="ai-in"><div class="ai-b">
        ${cfg.narrative ? `<div class="ai-sum">${esc(cfg.narrative)}</div>` : ''}
        ${flags.length ? flags.map(f => `<div class="flag ${f.sev}"><span class="sev"></span><div>
            <div class="ft">${esc(f.title)} ${pill(f.tag, f.sev==='high'?'bad':f.sev==='med'?'marg':'info')}</div>
            <div class="fd">${esc(f.detail)}</div>
            <div class="fa">${esc(f.action)}</div></div></div>`).join('')
          : (cfg.narrative ? '' : `<div class="ai-empty">${ic('sparkle')} Nothing needs attention here.</div>`)}
        <div class="ai-foot">${ic('sparkle')} ${esc(cfg.tagline || 'Derived from records already in the platform')}</div>
      </div></div></div>
    </div>`;
  }
  window.UI.aiPanel = aiPanel;

  /* ---------- TOASTS ---------- */
  function toast(text, kind) {
    let box = document.querySelector('.toasts');
    if (!box) { box = document.createElement('div'); box.className = 'toasts'; document.body.appendChild(box); }
    const t = document.createElement('div');
    t.className = 'toast ' + (kind || '');
    t.innerHTML = text;
    box.appendChild(t);
    setTimeout(() => { t.style.transition = 'opacity .3s,transform .3s'; t.style.opacity = '0';
      t.style.transform = 'translateY(8px)'; setTimeout(() => t.remove(), 320); }, 3000);
  }
  window.UI.toast = toast;

  /* ---------- MODAL + FORM RUNTIME ---------- */
  let modalEls = null;
  function ensureModal() {
    if (modalEls) return modalEls;
    const scrim = document.createElement('div'); scrim.className = 'mscrim';
    const m = document.createElement('div'); m.className = 'modal';
    document.body.appendChild(scrim); document.body.appendChild(m);
    scrim.onclick = closeModal;
    modalEls = { scrim, m };
    return modalEls;
  }
  function closeModal() {
    if (!modalEls) return;
    modalEls.m.classList.remove('on'); modalEls.scrim.classList.remove('on');
    setTimeout(() => { if (modalEls) modalEls.m.innerHTML = ''; }, 220);
  }
  window.UI.closeModal = closeModal;

  function fieldHTML(f, v) {
    const id = 'fld_' + f.k;
    const lab = `<label for="${id}">${esc(f.label)}${f.help ? window.UI.help(f.help) : ''}</label>`;
    let ctl = '';
    if (f.type === 'select') {
      ctl = `<select class="ctl" id="${id}" data-k="${f.k}">
        ${(f.placeholder ? `<option value="">${esc(f.placeholder)}</option>` : '')}
        ${f.options.map(o => { const val = o.v !== undefined ? o.v : o, lb = o.l !== undefined ? o.l : o;
          return `<option value="${esc(val)}" ${String(v)===String(val)?'selected':''}>${esc(lb)}</option>`; }).join('')}
      </select>`;
    } else if (f.type === 'multi') {
      const cur = Array.isArray(v) ? v : [];
      ctl = `<div class="pickrow" data-k="${f.k}" data-multi>
        ${f.options.map(o => `<span class="pick ${cur.indexOf(o)>-1?'on':''}" data-v="${esc(o)}">${esc(o)}</span>`).join('')}
      </div>`;
    } else if (f.type === 'textarea') {
      ctl = `<textarea class="ctl" id="${id}" data-k="${f.k}" placeholder="${esc(f.placeholder||'')}">${esc(v||'')}</textarea>`;
    } else if (f.type === 'checkbox') {
      ctl = `<div class="pickrow" data-k="${f.k}" data-bool><span class="pick ${v?'on':''}" data-v="yes">${esc(f.onLabel||'Yes')}</span></div>`;
    } else {
      ctl = `<input class="ctl ${f.mono?'mono':''}" id="${id}" data-k="${f.k}" type="${f.type||'text'}"
        value="${esc(v==null?'':v)}" placeholder="${esc(f.placeholder||'')}" ${f.step?`step="${f.step}"`:''}/>`;
    }
    return `<div class="frow" style="${f.width?`grid-column:span ${f.width}`:''}">${lab}${ctl}
      ${f.hint?`<div class="hint">${esc(f.hint)}</div>`:''}<div class="fe" data-fe="${f.k}"></div></div>`;
  }

  function openForm(cfg) {
    const { scrim, m } = ensureModal();
    const vals = Object.assign({}, cfg.values || {});
    const sections = cfg.sections || [{ fields: cfg.fields || [] }];
    m.className = 'modal' + (cfg.wide ? ' wide' : '');
    m.innerHTML = `
      <div class="modal-h"><div><h3>${esc(cfg.title)}</h3>${cfg.subtitle?`<p>${esc(cfg.subtitle)}</p>`:''}</div>
        <div class="sp"></div><button class="iconbtn" data-x>&#10005;</button></div>
      <div class="modal-b">
        ${sections.map(sec => `${sec.label?`<div class="sect">${esc(sec.label)}</div>`:''}
          <div class="fgrid" style="${sec.cols?`grid-template-columns:repeat(${sec.cols},minmax(0,1fr))`:''}">
            ${sec.fields.map(f => fieldHTML(f, vals[f.k])).join('')}
          </div>`).join('')}
        ${cfg.footNote?`<div class="note" style="margin-top:16px">${cfg.footNote}</div>`:''}
      </div>
      <div class="modal-f">
        ${cfg.danger?`<button class="btn danger" data-danger>${esc(cfg.danger.label)}</button><div style="flex:1"></div>`:''}
        <button class="btn" data-x>Cancel</button>
        <button class="btn pri" data-ok>${esc(cfg.submitLabel || 'Save')}</button>
      </div>`;
    scrim.classList.add('on'); requestAnimationFrame(() => m.classList.add('on'));

    m.querySelectorAll('[data-x]').forEach(b => b.onclick = closeModal);
    m.querySelectorAll('[data-multi] .pick').forEach(p => p.onclick = () => p.classList.toggle('on'));
    m.querySelectorAll('[data-bool] .pick').forEach(p => p.onclick = () => p.classList.toggle('on'));
    m.querySelectorAll('[data-help]').forEach(b => b.onclick = e => {
      e.stopPropagation(); const was = b.classList.contains('on'); closePop(); if (was) return;
      b.classList.add('on'); const r = b.getBoundingClientRect(); popover(b.dataset.help, r.left + r.width/2, r.bottom);
    });
    if (cfg.danger) m.querySelector('[data-danger]').onclick = () => { closeModal(); cfg.danger.run(); };

    function collect() {
      const out = {};
      m.querySelectorAll('[data-k]').forEach(el => {
        const k = el.dataset.k;
        if (el.hasAttribute('data-multi')) out[k] = [...el.querySelectorAll('.pick.on')].map(p => p.dataset.v);
        else if (el.hasAttribute('data-bool')) out[k] = !!el.querySelector('.pick.on');
        else out[k] = el.value.trim();
      });
      return out;
    }
    m.querySelector('[data-ok]').onclick = () => {
      const v = collect();
      let bad = false;
      m.querySelectorAll('.fe').forEach(e => e.classList.remove('on'));
      m.querySelectorAll('.ctl.bad').forEach(e => e.classList.remove('bad'));
      sections.flatMap(s => s.fields).forEach(f => {
        const empty = f.type === 'multi' ? !(v[f.k]||[]).length : !v[f.k];
        if (f.required && empty) {
          bad = true;
          const fe = m.querySelector(`[data-fe="${f.k}"]`); if (fe) { fe.textContent = 'Required'; fe.classList.add('on'); }
          const c = m.querySelector(`[data-k="${f.k}"]`); if (c && c.classList) c.classList.add('bad');
        }
      });
      if (bad) { toast('Fill in the required fields', 'bad'); return; }
      const r = cfg.onSubmit(v);
      if (r !== false) closeModal();
    };
    setTimeout(() => { const f = m.querySelector('.ctl'); if (f) f.focus(); }, 180);
  }
  window.UI.openForm = openForm;

  function confirmAction(title, body, label, run) {
    const { scrim, m } = ensureModal();
    m.className = 'modal';
    m.innerHTML = `<div class="modal-h"><div><h3>${esc(title)}</h3></div></div>
      <div class="modal-b"><p style="margin:0;font-size:13.5px;line-height:1.6;color:var(--ink-2)">${esc(body)}</p></div>
      <div class="modal-f"><button class="btn" data-x>Cancel</button>
        <button class="btn danger" data-ok>${esc(label)}</button></div>`;
    scrim.classList.add('on'); requestAnimationFrame(() => m.classList.add('on'));
    m.querySelectorAll('[data-x]').forEach(b => b.onclick = closeModal);
    m.querySelector('[data-ok]').onclick = () => { closeModal(); run(); };
  }
  window.UI.confirmAction = confirmAction;

  /* commit a change: persist, re-render, confirm */
  window.UI.commit = function (msg, kind) {
    window.DB.save();
    render();
    if (msg) toast(msg, kind || 'ok');
  };

  /* ---------- AI assistant drawer ---------- */
  function drawer() {
    return `<div class="scrim ${S.chatOpen?'on':''}" data-close-chat></div>
    <div class="drawer ${S.chatOpen?'open':''}">
      <div class="drawer-h">
        <span style="color:var(--acc)">${ic('sparkle')}</span>
        <div><div style="font-family:var(--disp);font-size:12px;letter-spacing:.14em;text-transform:uppercase">Zion Intelligence</div>
        <div class="dim" style="font-size:10.5px">Answers from live platform data</div></div>
        <div class="sp" style="flex:1"></div>
        <button class="iconbtn" data-close-chat>✕</button>
      </div>
      <div class="drawer-b" id="chatBody">
        ${S.chat.length ? S.chat.map(renderMsg).join('') : `
          <div class="msg a"><div class="who">Zion Intelligence</div><div class="bub">I read the same records the screens do — inspections, tolerances, calibration, price sheets and the ledger. Ask me anything about them.</div></div>`}
      </div>
      <div class="drawer-f">
        <div class="chips">${AI.SUGGESTIONS.map(s=>`<span class="chip" data-ask="${esc(s)}">${esc(s)}</span>`).join('')}</div>
        <div class="askbox"><input id="askInput" placeholder="Ask about money, rejects, tolerances, calibration…"/>
          <button class="btn pri" data-send>${ic('send')}</button></div>
      </div>
    </div>`;
  }

  function renderMsg(m) {
    if (m.role === 'u') return `<div class="msg u"><div class="who">You</div><div class="bub">${esc(m.text)}</div></div>`;
    let t = '';
    if (m.table) t = `<div class="tw"><table class="t"><thead><tr>${m.table.head.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead>
      <tbody>${m.table.rows.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    return `<div class="msg a"><div class="who">Zion Intelligence</div><div class="bub">${esc(m.text)}${t}</div></div>`;
  }

  function sendAsk(q) {
    if (!q || !q.trim()) return;
    S.chat.push({ role:'u', text:q });
    const a = AI.ask(q);
    S.chat.push({ role:'a', text:a.text, table:a.table });
    S.chatOpen = true; render();
    const b = document.getElementById('chatBody'); if (b) b.scrollTop = b.scrollHeight;
  }
  window.UI.sendAsk = sendAsk;

  /* ---------- render ---------- */
  function render() {
    const V = window.VIEWS;
    let route = S.route, body, crumb;
    const view = V[route] || V.dashboard;
    if (!allowed((NAV.flatMap(g=>g.items).find(i=>i.r===route)||{k:'dashboard'}).k)) {
      body = `<div class="phead"><div><h1>Restricted</h1>
        <p>The <b>${esc(S.role)}</b> role does not have access to this module. That is the point of the demo — switch role in the top bar to see how the same platform presents itself to different people.</p></div></div>
        <div class="note">${esc(D.roles[S.role].note)}</div>`;
      crumb = 'Restricted';
    } else {
      const out = view(S.arg);
      body = out.html; crumb = out.crumb;
    }
    document.body.classList.toggle('helpmode', S.helpMode);
    document.getElementById('root').innerHTML =
      `<div class="app">${sidebar()}<div class="main">${topbar(crumb)}<div class="content">${body}</div></div></div>
       <button class="fab" data-open-chat>${ic('sparkle')} Ask Zion</button>${drawer()}`;
    wire();
  }
  window.UI.render = render;

  function wire() {
    document.querySelectorAll('[data-help]').forEach(b => b.onclick = e => {
      e.stopPropagation();
      const was = b.classList.contains('on');
      closePop();
      if (was) return;
      b.classList.add('on');
      const r = b.getBoundingClientRect();
      popover(b.dataset.help, r.left + r.width/2, r.bottom);
    });
    document.querySelectorAll('[data-tsub]').forEach(b => b.onclick = () => { S.tsub = b.dataset.tsub; render(); });
    document.querySelectorAll('[data-calmode]').forEach(b => b.onclick = () => { S.calMode = b.dataset.calmode; render(); });
    document.querySelectorAll('[data-cal]').forEach(b => b.onclick = () => { S.calAnchor = b.dataset.cal; render(); });
    document.querySelectorAll('[data-region]').forEach(b => b.onclick = () => { S.mapRegion = b.dataset.region; render(); });
    document.querySelectorAll('[data-help-toggle]').forEach(b => b.onclick = () => { S.helpMode = !S.helpMode; render(); });
    document.querySelectorAll('[data-ai]').forEach(b => b.onclick = () => {
      const k = b.dataset.ai; S.aiOpen[k] = !S.aiOpen[k];
      const panel = b.closest('.ai'); panel.classList.toggle('open', S.aiOpen[k]);
      panel.querySelectorAll('.flag').forEach(f => { f.style.animation = 'none'; f.offsetHeight; f.style.animation = ''; });
    });
    document.querySelectorAll('[data-role]').forEach(b => b.onclick = () => {
      S.role = b.dataset.role;
      const cur = NAV.flatMap(g=>g.items).find(i=>i.r===S.route);
      if (cur && !allowed(cur.k)) { S.route='dashboard'; S.arg=null; }
      render();
    });
    document.querySelectorAll('[data-open-chat]').forEach(b => b.onclick = () => { S.chatOpen = true; render(); setTimeout(()=>{const i=document.getElementById('askInput'); i&&i.focus();},60); });
    document.querySelectorAll('[data-close-chat]').forEach(b => b.onclick = () => { S.chatOpen = false; render(); });
    document.querySelectorAll('[data-ask]').forEach(b => b.onclick = () => sendAsk(b.dataset.ask));
    const send = document.querySelector('[data-send]'), inp = document.getElementById('askInput');
    if (send && inp) { send.onclick = () => { sendAsk(inp.value); }; inp.onkeydown = e => { if (e.key === 'Enter') sendAsk(inp.value); }; }
    document.querySelectorAll('[data-reset]').forEach(b => b.onclick = () => {
      if (confirm('Reset the demo back to its starting data? Anything you created will be removed.')) window.DB.reset();
    });
    document.querySelectorAll('[data-go]').forEach(b => b.onclick = () => go(b.dataset.go, b.dataset.arg || null));
    document.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { S.tab = +b.dataset.tab; render(); });
    document.querySelectorAll('[data-thread]').forEach(b => b.onclick = () => { S.thread = b.dataset.thread; render(); });
    if (window.VIEWS.wire) window.VIEWS.wire();
  }

  function route() {
    const h = (location.hash || '#/dashboard').replace(/^#\//,'').split('/');
    if (h[0] !== S.route) S.tab = 0;
    S.route = h[0] || 'dashboard'; S.arg = h[1] || null;
    render(); window.scrollTo(0,0);
  }
  document.addEventListener('click', e => {
    if (!e.target.closest('.pop') && !e.target.closest('.hb')) closePop();
  });
  window.addEventListener('keydown', e => { if (e.key === 'Escape') { closePop(); closeModal(); } });

  window.addEventListener('hashchange', route);
  window.UI.init = route;   /* called once views.js has loaded */
})();
