/* Zion Unified — field operations views + the merged data model. */
(function () {
  const D = window.ZD, AI = window.ZAI, U = window.UI, V = window.VIEWS, S = window.S;
  const { esc, money, pill, statusPill, ic } = U;

  const head = (t,sub,right)=>`<div class="phead"><div><h1>${esc(t)}</h1>${sub?`<p>${sub}</p>`:''}</div><div class="sp"></div>${right||''}</div>`;
  const kpi=(k,v,s,cls)=>`<div class="kpi ${cls||''}"><div class="k" style="display:flex;align-items:center;gap:5px">${k}</div><div class="v">${v}</div>${s?`<div class="s">${s}</div>`:''}</div>`;
  const field=(l,v,o)=>{o=o||{};const e=v===undefined||v===null||v===''||v==='—';
    return `<div class="f ${o.req?'req':''}"><label>${esc(l)}${o.help?U.help(o.help):''}</label><div class="val ${o.mono?'mono':''} ${e?'empty':''}">${e?'—':v}</div></div>`;};
  const table=(h,rows,o)=>{o=o||{};if(!rows.length)return `<div class="center">Nothing to show here yet.</div>`;
    return `<div class="tw"><table class="t"><thead><tr>${h.map(x=>`<th class="${/^\+/.test(x)?'r':''}">${esc(x.replace(/^\+/,''))}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(r=>`<tr class="${o.click?'rowbtn':''}" ${o.click?`data-go="${o.click}" data-arg="${esc(r.__arg)}"`:''}>${
        r.cells.map((c,i)=>`<td class="${/^\+/.test(h[i]||'')?'r':''}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;};
  const aiPanel = (title,narrative,flags,tagline,open) => U.aiPanel({ title, narrative, flags, tagline, open });

  const jobPill = s => pill(s,
    s==='Invoiced'?'ok' : s==='Report approved'?'ok' : s==='Inspection complete'?'info' :
    s==='Report submitted'?'acc' : s==='Dispatched'?'warn' : s==='Unassigned'?'bad' : 'mute');
  const rate = c => (D.payBehaviour[c] ? 3.00 : 3.00);   /* mileage rate off the customer price sheet */

  /* ============================================================ UNIFIED OVERVIEW */
  V.dashboard = () => {
    const p = AI.portfolio();
    const open = D.jobs.filter(j => ['Scheduled','Dispatched','Unassigned'].indexOf(j.status) > -1);
    const unassigned = D.jobs.filter(j => j.status === 'Unassigned');
    const geoFlag = D.attendance.filter(a => a.geo !== 'Verified');
    const pendMiles = D.mileage.filter(m => m.status === 'Pending');

    const flags = [];
    unassigned.forEach(j => flags.push({ sev:'high', tag:'Dispatch',
      title:`${j.no} has no crew assigned`, detail:`${D.custById(j.cust).name} · ${j.type} · scheduled ${j.scheduled}.`,
      action:'Assign a crew before the shift starts.' }));
    geoFlag.forEach(a => flags.push({ sev:'med', tag:'Compliance',
      title:`${D.empById(a.emp).name} — ${a.geo.toLowerCase()} on ${a.job}`,
      detail:a.flag || 'Attendance did not verify against the site geo-fence.',
      action:'Confirm with the crew before the hours reach payroll.' }));
    if (pendMiles.length) flags.push({ sev:'low', tag:'Billing',
      title:`${pendMiles.length} mileage claims awaiting approval`,
      detail:`${pendMiles.reduce((s,m)=>s+m.miles,0).toFixed(1)} miles, billable to the customer at the rate on their price sheet.`,
      action:'Approve so they reach the next invoice.' });
    AI.billingFlags().slice(0,2).forEach(f => flags.push(f));

    return { crumb:'Overview', html:
      head('Operations Overview','Crews, inspections and money on one screen — because they are one operation.') +
      `<div class="grid g4" style="margin-bottom:16px">
        ${kpi('Jobs open', open.length, `${unassigned.length} unassigned`, unassigned.length?'b':'a')}
        ${kpi('Crews on shift', D.crews.filter(c=>c.status!=='Off shift').length, `${D.crews.length} crews`,'')}
        ${kpi('Item reject rate', AI.pct(p.rejRate), `${Object.keys(D.items).length} items inspected`,'w')}
        ${kpi('Outstanding', money(p.outstanding), `${money(p.overdue)} overdue`,'b')}
      </div>
      <div style="margin-bottom:16px">${aiPanel('Daily Brief', null, flags.slice(0,6),
        'Reads dispatch, attendance, inspection and the ledger together', true)}</div>
      <div class="grid g-2-1">
        <div class="panel"><div class="panel-h"><h3>Jobs in flight</h3><div class="sp"></div>
          <button class="btn sm" data-go="jobs">Dispatch board</button></div>
          ${table(['Job','Customer','Type','Crew','Scheduled','Inspection','Status'],
            D.jobs.slice(0,6).map(j=>({__arg:j.no, cells:[
              `<b class="mono link">${esc(j.no)}</b>`, esc(D.custById(j.cust).name), esc(j.type),
              j.crew?esc(D.crewById(j.crew).name):pill('Unassigned','bad'),
              `<span class="mono">${esc(j.scheduled)}</span>`,
              j.inspection?`<span class="mono">${esc(j.inspection)}</span>`:'<span class="dim">—</span>',
              jobPill(j.status)]})), {click:'job'})}
        </div>
        <div class="panel"><div class="panel-h"><h3>Crews</h3><div class="sp"></div>
          <button class="btn sm" data-go="crews">All crews</button></div>
          <div class="panel-b" style="padding:0">
          ${D.crews.map(c=>`<div class="titem" data-go="crews">
            <div class="s"><span class="led ${c.status==='On site'?'ok':c.status==='In transit'?'info':'mute'}"></span>
              ${esc(c.name)}<span class="sp"></span>
              ${pill(c.status, c.status==='On site'?'ok':c.status==='In transit'?'info':'mute')}</div>
            <div class="m"><b>${esc(D.empById(c.lead).name)}</b> <span class="sep">·</span> ${c.members.length} on crew</div>
            <div class="m dim">${esc(c.shift)}</div>
          </div>`).join('')}
          </div></div>
      </div>` };
  };

  /* ============================================================ DISPATCH BOARD */
  V.jobs = () => ({ crumb:'Dispatch', html:
    head('Dispatch Board','Every job from the moment it is scheduled to the moment it is paid.',
      `<button class="btn pri" data-act="newJob">+ New job</button>`) +
    `<div class="grid g4" style="margin-bottom:16px">
      ${kpi('Unassigned', D.jobs.filter(j=>j.status==='Unassigned').length,'Need a crew','b')}
      ${kpi('Scheduled', D.jobs.filter(j=>['Scheduled','Dispatched'].indexOf(j.status)>-1).length,'','w')}
      ${kpi('In inspection', D.jobs.filter(j=>['Inspection complete','Report submitted'].indexOf(j.status)>-1).length,'','a')}
      ${kpi('Closed', D.jobs.filter(j=>['Report approved','Invoiced'].indexOf(j.status)>-1).length,'','g')}
    </div>
    <div class="panel">${table(['Job','Customer','Site','Type','Crew','Scheduled','Hours','Inspection','Invoice','Status'],
      D.jobs.map(j=>{
        const att = D.attendance.filter(a=>a.job===j.no);
        const hrs = att.reduce((s,a)=>s+a.hrs,0);
        const ins = j.inspection ? D.inspByNo(j.inspection) : null;
        return {__arg:j.no, cells:[
          `<b class="mono link">${esc(j.no)}</b>`, esc(D.custById(j.cust).name),
          esc(D.locById(j.loc).loc.city), esc(j.type),
          j.crew?esc(D.crewById(j.crew).name):pill('Unassigned','bad'),
          `<span class="mono">${esc(j.scheduled)}</span>`,
          hrs?`<span class="mono">${hrs.toFixed(2)}</span>`:'<span class="dim">—</span>',
          ins?`<span class="mono link">${esc(ins.no)}</span>`:'<span class="dim">—</span>',
          ins&&ins.invoice?`<span class="mono">${esc(ins.invoice)}</span>`:'<span class="dim">—</span>',
          jobPill(j.status)]};
      }), {click:'job'})}</div>` });

  /* ============================================================ THE UNIFIED JOB RECORD */
  V.job = (no) => {
    const j = D.jobByNo(no) || D.jobs[0];
    const c = D.custById(j.cust), loc = D.locById(j.loc).loc;
    const crew = j.crew ? D.crewById(j.crew) : null;
    const att = D.attendance.filter(a => a.job === j.no);
    const mil = D.mileage.filter(m => m.job === j.no);
    const ins = j.inspection ? D.inspByNo(j.inspection) : null;
    const its = ins ? ins.items.map(i => D.items[i]).filter(Boolean) : [];
    const inv = ins && ins.invoice ? D.invByNo(ins.invoice) : null;
    const canPrice = D.roles[S.role].pricing;
    const hrs = att.reduce((s,a)=>s+a.hrs,0);
    const miles = mil.filter(m=>m.billable).reduce((s,m)=>s+m.miles,0);
    const labour = att.reduce((s,a)=>{ const w = D.workforce[a.emp]||{}; return s + a.hrs*(w.rate||0); }, 0);
    const inspValue = its.reduce((s,i)=>s+(i.prices||[]).reduce((a,p)=>a+p.q*p.r,0)
                                       +(i.standard||[]).reduce((a,p)=>a+p.q*p.r,0), 0);
    const t = S.tab;
    const TABS = ['Job & Crew','Attendance','Mileage','Inspection','Items','Billing'];

    const flags = [];
    if (!crew) flags.push({sev:'high',tag:'Dispatch',title:'No crew assigned',
      detail:`Scheduled ${j.scheduled} at ${loc.name}.`,action:'Assign before the shift.'});
    att.filter(a=>a.geo!=='Verified').forEach(a=>flags.push({sev:'med',tag:'Compliance',
      title:`${D.empById(a.emp).name} — ${a.geo.toLowerCase()}`,detail:a.flag||'',
      action:'Confirm before these hours reach payroll.'}));
    att.filter(a=>a.flag&&/Missed check-out/.test(a.flag)).forEach(a=>flags.push({sev:'med',tag:'Attendance',
      title:`${D.empById(a.emp).name} missed check-out`,detail:a.flag,action:'Verify the corrected hours.'}));
    if (ins) AI.inspectionFlags(ins).slice(0,3).forEach(f=>flags.push(f));
    if (mil.some(m=>m.status==='Pending')) flags.push({sev:'low',tag:'Billing',
      title:'Mileage on this job is not approved yet',
      detail:`${mil.filter(m=>m.status==='Pending').reduce((s,m)=>s+m.miles,0).toFixed(1)} billable miles pending.`,
      action:'Approve so it reaches the invoice.'});

    let body='';
    if (t===0) body = `<div class="grid g-2-1">
      <div class="panel"><div class="panel-h"><h3>Job</h3></div><div class="panel-b"><div class="fgrid">
        ${field('Job number', `<span class="mono">${esc(j.no)}</span>`, {req:1})}
        ${field('Customer', esc(c.name), {req:1})}
        ${field('Site', esc(loc.name)+' — '+esc(loc.city)+', '+esc(loc.state))}
        ${field('Work type', esc(j.type))}
        ${field('Priority', pill(j.priority, j.priority==='Urgent'?'bad':j.priority==='High'?'marg':'mute'))}
        ${field('Scheduled', `<span class="mono">${esc(j.scheduled)}</span>`, {mono:1})}
        ${field('Started', j.started?`<span class="mono">${esc(j.started)}</span>`:'')}
        ${field('Finished', j.finished?`<span class="mono">${esc(j.finished)}</span>`:'')}
        ${field('Geo-fence', j.geo.fence+' m · '+(j.geo.verified===null?'not yet checked':j.geo.verified?'all check-ins verified':'a check-in fell outside'))}
      </div>${j.notes?`<div class="sep"></div><div class="note">${esc(j.notes)}</div>`:''}</div></div>
      <div class="panel"><div class="panel-h"><h3>Crew</h3><div class="sp"></div>
        ${crew?pill(crew.status, crew.status==='On site'?'ok':'info'):pill('Unassigned','bad')}</div>
        ${crew ? table(['Member','Role','Certifications','+Rate'],
          crew.members.map(m=>{ const e=D.empById(m), w=D.workforce[m]||{};
            return {cells:[`<b>${esc(e.name)}</b>${m===crew.lead?' '+pill('Lead','acc'):''}`, esc(e.role),
              `<span class="tagrow">${(w.cert||[]).map(x=>pill(x,'mute')).join('')}</span>`,
              canPrice?(w.pay==='hourly'?money(w.rate)+'/h':pill('Salary','mute')):pill('Hidden','mute')]};}))
        : `<div class="center">No crew assigned.<button class="btn pri" data-act="assignCrew" data-arg="${j.no}">Assign crew</button></div>`}
      </div></div>`;

    if (t===1) body = `<div class="panel"><div class="panel-h"><h3>Attendance</h3><div class="sp"></div>
      <span class="dim" style="font-size:11.5px">Geo-verified against the site fence — the same site record the inspection uses</span></div>
      ${table(['Member','Check in','Check out','+Hours','Geo','Flag'],
        att.map(a=>({cells:[esc(D.empById(a.emp).name), `<span class="mono">${esc(a.in)}</span>`,
          `<span class="mono">${esc(a.out)}</span>`, `<b class="mono">${a.hrs.toFixed(2)}</b>`,
          a.geo==='Verified'?pill('Verified','ok'):pill(a.geo,'bad'),
          a.flag?`<span class="muted">${esc(a.flag)}</span>`:'<span class="dim">clear</span>']})))}
      <div class="panel-b" style="border-top:1px solid var(--line)"><div class="split">
        <span class="eyebrow">Total hours on job</span><b class="mono" style="font-size:16px">${hrs.toFixed(2)}</b>
        ${canPrice?`<div class="sp" style="flex:1"></div><span class="eyebrow">Labour cost</span>
        <b class="mono" style="font-size:16px">${money(labour)}</b>`:''}
      </div></div></div>`;

    if (t===2) body = `<div class="panel"><div class="panel-h"><h3>Mileage</h3><div class="sp"></div>
      <span class="dim" style="font-size:11.5px">Priced from ${esc(c.name)}'s price sheet</span></div>
      ${table(['Member','Date','Route','+Miles','Type','Billable','+Amount','Status'],
        mil.map(m=>({cells:[esc(D.empById(m.emp).name), m.date,
          `${esc(m.from)} &rarr; ${esc(m.to)}`, `<span class="mono">${m.miles.toFixed(1)}</span>`,
          esc(m.type), m.billable?pill('Yes','ok'):pill('No','mute'),
          canPrice?money(m.miles*rate(j.cust)):pill('Hidden','mute'),
          m.status==='Approved'?pill('Approved','ok'):m.status==='Pending'?pill('Pending','warn'):pill('Rejected','bad')]})))}
      ${canPrice?`<div class="panel-b" style="border-top:1px solid var(--line)"><div class="split">
        <span class="eyebrow">Billable miles</span><b class="mono">${miles.toFixed(1)}</b>
        <div class="sp" style="flex:1"></div><span class="eyebrow">To invoice</span>
        <b class="mono" style="font-size:16px">${money(miles*rate(j.cust))}</b></div></div>`:''}</div>`;

    if (t===3) body = ins
      ? `<div class="panel"><div class="panel-h"><h3>Inspection ${esc(ins.no)}</h3><div class="sp"></div>
          ${statusPill(ins.status)}<button class="btn sm" data-go="inspection" data-arg="${ins.no}">Open full record</button></div>
          <div class="panel-b"><div class="fgrid">
            ${field('Lead inspector', esc(D.empById(ins.lead).name))}
            ${field('Methods', ins.methods.map(m=>pill(m,'acc')).join(' '))}
            ${field('Inspected per', ins.spec.join(', '))}
            ${field('JSA', ins.jsa?esc(D.jsaById(ins.jsa).name):'')}
            ${field('AFE / PO', ins.po==='—'?pill('Not supplied','warn'):`<span class="mono">${esc(ins.po)}</span>`)}
            ${field('Items', its.length + ' · ' + its.filter(i=>i.status==='REJECTED').length + ' rejected')}
          </div></div></div>`
      : `<div class="center">No inspection has been raised against this job yet.<br/>
          It will attach here the moment the crew starts recording.
          <button class="btn pri" data-act="raiseInspection" data-arg="${j.no}">Raise inspection</button></div>`;

    if (t===4) body = its.length ? `<div class="panel"><div class="panel-h"><h3>Items inspected</h3><div class="sp"></div>
      <span class="dim" style="font-size:11.5px">${its.length} on this job</span></div>
      ${table(['Item','Serial','Description','Body','Verdict'],
        its.map(i=>({__arg:i.id, cells:[`<b class="mono link">${i.itemId}</b>`,
          `<span class="mono">${esc(i.serial)}</span>`, esc(i.desc),
          i.bodyStatus==='OK'?pill('OK','ok'):pill(i.bodyStatus,'bad'), statusPill(i.status)]})), {click:'item'})}
      </div>` : `<div class="center">No items recorded on this job.</div>`;

    if (t===5) body = canPrice ? `<div class="panel"><div class="panel-h"><h3>What this job bills</h3><div class="sp"></div>
      ${inv?pill('Invoice '+inv.no,'ok'):pill('Not invoiced','warn')}</div>
      ${table(['Line','Source','+Qty','+Rate','+Amount'], [
        { cells:['Inspection and remedial work','Inspection '+(ins?ins.no:'—'), its.length.toFixed(0),
          '<span class="dim">per item</span>', `<b>${money(inspValue)}</b>`] },
        { cells:['Billable mileage','Mileage log', miles.toFixed(1), money(rate(j.cust)), `<b>${money(miles*rate(j.cust))}</b>`] },
        { cells:['Crew hours','Attendance', hrs.toFixed(2), '<span class="dim">cost, not billed</span>',
          `<span class="dim">${money(labour)}</span>`] } ])}
      <div class="panel-b" style="border-top:1px solid var(--line)"><div class="split">
        <span class="eyebrow">Billable</span><b class="mono" style="font-size:18px">${money(inspValue + miles*rate(j.cust))}</b>
        <div class="sp" style="flex:1"></div>
        <span class="eyebrow">Labour cost</span><b class="mono">${money(labour)}</b>
        <span class="eyebrow" style="margin-left:14px">Margin</span>
        <b class="mono" style="font-size:16px;color:var(--ok)">${money(inspValue + miles*rate(j.cust) - labour)}</b>
      </div></div></div>`
      : `<div class="panel"><div class="center">${ic('lock')} &nbsp; Billing is hidden for the ${esc(S.role)} role.</div></div>`;

    return { crumb:esc(j.no), html:
      `<div class="split" style="margin-bottom:14px">
        <button class="btn sm" data-go="jobs">${ic('back')} Dispatch board</button>
        <div class="sp" style="flex:1"></div>
        ${ins?`<button class="btn sm" data-go="inspection" data-arg="${ins.no}">${ic('clipboard')} Inspection ${ins.no}</button>`
             :`<button class="btn acc sm" data-act="raiseInspection" data-arg="${j.no}">${ic('clipboard')} Raise inspection</button>`}
        ${inv?`<button class="btn sm" data-go="invoice" data-arg="${inv.no}">${ic('invoice')} Invoice ${inv.no}</button>`:''}
        ${crew?'':`<button class="btn pri sm" data-act="assignCrew" data-arg="${j.no}">Assign crew</button>`}
        <button class="btn sm" data-act="editJob" data-arg="${j.no}">Edit job</button>
      </div>` +
      head(j.no, `${esc(c.name)} — ${esc(loc.name)} · ${esc(j.type)} · scheduled ${esc(j.scheduled)}`,
        `<div class="split">${jobPill(j.status)}${crew?pill(crew.name,'mute'):pill('Unassigned','bad')}</div>`) +
      `<div class="grid g4" style="margin-bottom:16px">
        ${kpi('Crew hours', hrs.toFixed(2), att.length+' check-ins','a')}
        ${kpi('Billable miles', miles.toFixed(1), mil.length+' trips','')}
        ${kpi('Items', its.length, its.filter(i=>i.status==='REJECTED').length+' rejected','w')}
        ${canPrice?kpi('Job value', money(inspValue + miles*rate(j.cust)), money(labour)+' labour cost','g')
                  :kpi('Inspection', ins?ins.status:'Not raised','','')}
      </div>
      <div style="margin-bottom:16px">${aiPanel('Job Review',
        `${j.no} for ${c.name} at ${loc.name}. ${crew?crew.name+' worked '+hrs.toFixed(2)+' hours across '+att.length+' check-ins':'No crew assigned yet'}`
        + (ins?`, producing inspection ${ins.no} with ${its.length} items and ${its.filter(i=>i.status==='REJECTED').length} rejections`:'')
        + (inv?`, invoiced as ${inv.no}`:'') + '.', flags)}</div>
      <div class="tabs">${TABS.map((n,i)=>`<button data-tab="${i}" class="${t===i?'on':''}">${esc(n)}${i===4&&its.length?`<span class="n">${its.length}</span>`:''}</button>`).join('')}</div>
      ${body}` };
  };

  /* ============================================================ CREWS */
  V.crews = () => ({ crumb:'Crews & Teams', html:
    head('Crews & Teams','One workforce. Certifications come from the inspection side, pay rules and crew membership from operations — on the same person record.') +
    `<div class="grid g3">${D.crews.map(c=>{
      const jobs = D.jobs.filter(j=>j.crew===c.id);
      const hrs = D.attendance.filter(a=>c.members.indexOf(a.emp)>-1).reduce((s,a)=>s+a.hrs,0);
      return `<div class="panel"><div class="panel-h"><h3>${esc(c.name)}</h3><div class="sp"></div>
        ${pill(c.status, c.status==='On site'?'ok':c.status==='In transit'?'info':'mute')}</div>
        <div class="panel-b">
          <div class="fgrid" style="grid-template-columns:1fr 1fr">
            ${field('Crew lead', esc(D.empById(c.lead).name))}
            ${field('Shift', esc(c.shift))}
            ${field('Home base', esc(c.base))}
            ${field('Overtime cap', c.otCap+' h/week', {mono:1})}
          </div>
          <div class="sep"></div>
          <div class="eyebrow" style="margin-bottom:8px">Members</div>
          ${table(['Name','Role','Certifications'], c.members.map(m=>{
            const e=D.empById(m), w=D.workforce[m]||{};
            return {cells:[`<b>${esc(e.name)}</b>`, esc(e.role),
              `<span class="tagrow">${(w.cert||[]).map(x=>pill(x,'mute')).join('')}</span>`]};}))}
          <div class="sep"></div>
          <div class="split"><span class="eyebrow">Jobs</span><b class="mono">${jobs.length}</b>
            <span class="eyebrow" style="margin-left:14px">Hours</span><b class="mono">${hrs.toFixed(2)}</b></div>
        </div></div>`;}).join('')}</div>` });

  /* ============================================================ ATTENDANCE + MILEAGE */
  V.attendance = () => {
    const flagged = D.attendance.filter(a=>a.geo!=='Verified'||a.flag);
    return { crumb:'Attendance', html:
      head('Attendance','Geo-verified check in and out, against the same site record the inspection is booked to.') +
      `<div class="grid g4" style="margin-bottom:16px">
        ${kpi('Records', D.attendance.length,'This window','a')}
        ${kpi('Total hours', D.attendance.reduce((s,a)=>s+a.hrs,0).toFixed(2),'','')}
        ${kpi('Geo verified', D.attendance.filter(a=>a.geo==='Verified').length,'of '+D.attendance.length,'g')}
        ${kpi('Flagged', flagged.length,'Need review', flagged.length?'b':'g')}
      </div>
      <div class="panel">${table(['Member','Job','Customer','Check in','Check out','+Hours','Geo','Flag'],
        D.attendance.map(a=>{ const j=D.jobByNo(a.job);
          return {cells:[esc(D.empById(a.emp).name), `<span class="mono">${esc(a.job)}</span>`,
            j?esc(D.custById(j.cust).name):'—', `<span class="mono">${esc(a.in)}</span>`,
            `<span class="mono">${esc(a.out)}</span>`, `<b class="mono">${a.hrs.toFixed(2)}</b>`,
            a.geo==='Verified'?pill('Verified','ok'):pill(a.geo,'bad'),
            a.flag?`<span class="muted">${esc(a.flag)}</span>`:'<span class="dim">clear</span>']};}))}
      </div>` };
  };

  V.mileage = () => {
    const canPrice = D.roles[S.role].pricing;
    const bill = D.mileage.filter(m=>m.billable);
    return { crumb:'Mileage', html:
      head('Mileage','Trips classified work or personal, priced from the customer’s own price sheet — the same sheet the inspection bills from.',
        `<button class="btn pri" data-act="approveAllMileage">Approve all pending</button>`) +
      `<div class="grid g4" style="margin-bottom:16px">
        ${kpi('Trips', D.mileage.length,'','a')}
        ${kpi('Billable miles', bill.reduce((s,m)=>s+m.miles,0).toFixed(1),'','')}
        ${kpi('Pending approval', D.mileage.filter(m=>m.status==='Pending').length,'','w')}
        ${canPrice?kpi('To invoice', money(bill.reduce((s,m)=>s+m.miles*3,0)),'At $3.00/mile','g')
                  :kpi('Rate','Hidden','','')}
      </div>
      <div class="panel">${table(['Member','Date','Job','Route','+Miles','Type','+Amount','Status','+'],
        D.mileage.map(m=>({cells:[esc(D.empById(m.emp).name), m.date,
          m.job?`<span class="mono">${esc(m.job)}</span>`:'<span class="dim">—</span>',
          `${esc(m.from)} &rarr; ${esc(m.to)}`, `<span class="mono">${m.miles.toFixed(1)}</span>`,
          m.type==='Work'?pill('Work','ok'):pill('Personal','mute'),
          canPrice?(m.billable?money(m.miles*3):'<span class="dim">—</span>'):pill('Hidden','mute'),
          m.status==='Approved'?pill('Approved','ok'):m.status==='Pending'?pill('Pending','warn'):pill('Rejected','bad'),
          m.status==='Pending'
            ? `<span class="rowact"><button class="btn sm" data-act="setMileage" data-arg="${m.id}" data-arg2="Approved">Approve</button>
               <button class="btn sm danger" data-act="setMileage" data-arg="${m.id}" data-arg2="Rejected">Reject</button></span>`
            : `<span class="rowact"><button class="btn sm" data-act="setMileage" data-arg="${m.id}" data-arg2="Pending">Reopen</button></span>`]})))}
      </div>` };
  };

  /* ============================================================ PAYROLL */
  V.payroll = () => {
    const canPrice = D.roles[S.role].pricing;
    if (!canPrice) return { crumb:'Payroll', html: head('Payroll') +
      `<div class="panel"><div class="center">${ic('lock')} &nbsp; Hidden for the ${esc(S.role)} role.</div></div>` };
    const rows = Object.keys(D.workforce).map(id => {
      const e = D.empById(id), w = D.workforce[id];
      const att = D.attendance.filter(a=>a.emp===id);
      const hrs = att.reduce((s,a)=>s+a.hrs,0);
      const ot = Math.max(0, hrs - w.ot);
      const miles = D.mileage.filter(m=>m.emp===id&&m.billable).reduce((s,m)=>s+m.miles,0);
      const pay = w.pay==='hourly' ? (hrs-ot)*w.rate + ot*w.rate*1.5 : 0;
      return { e, w, hrs, ot, miles, pay };
    }).filter(r => r.hrs > 0 || r.miles > 0);
    return { crumb:'Payroll', html:
      head('Payroll','Hours from attendance, mileage from the trip log, rates from the person record. One chain, no re-entry.') +
      `<div class="grid g4" style="margin-bottom:16px">
        ${kpi('People with hours', rows.length,'This period','a')}
        ${kpi('Total hours', rows.reduce((s,r)=>s+r.hrs,0).toFixed(2),'','')}
        ${kpi('Overtime hours', rows.reduce((s,r)=>s+r.ot,0).toFixed(2),'At 1.5x', rows.some(r=>r.ot)?'w':'g')}
        ${kpi('Gross pay', money(rows.reduce((s,r)=>s+r.pay,0)),'Hourly staff','g')}
      </div>
      <div class="panel">${table(['Person','Role','Pay type','+Rate','+Hours','+OT','+Miles','+Gross'],
        rows.map(r=>({cells:[`<b>${esc(r.e.name)}</b>`, esc(r.e.role),
          r.w.pay==='hourly'?pill('Hourly','info'):pill('Salary','mute'),
          r.w.pay==='hourly'?money(r.w.rate):'<span class="dim">—</span>',
          `<span class="mono">${r.hrs.toFixed(2)}</span>`,
          r.ot?`<span class="mono" style="color:var(--marg)">${r.ot.toFixed(2)}</span>`:'<span class="dim">0.00</span>',
          `<span class="mono">${r.miles.toFixed(1)}</span>`,
          `<b class="mono">${money(r.pay)}</b>`]})))}
      </div>` };
  };

  /* ============================================================ THE MERGE MAP */
  V.model = () => {
    const dedupe = [
      ['Customer masters', 2, 1], ['Site registers', 2, 1], ['People directories', 2, 1],
      ['Rate tables', 2, 1], ['Rule engines', 2, 1], ['Mileage systems', 2, 1],
      ['Permission matrices', 2, 1], ['Job identifiers', 2, 1]
    ];
    return { crumb:'Unified Data Model', html:
      head('Unified Data Model','What actually happens to the data when the two systems become one.') +
      `<div class="grid g4" style="margin-bottom:16px">
        ${kpi('Records that merge', D.merge.length + ' entities','Not two databases joined — one','a')}
        ${kpi('Duplicate stores removed', dedupe.length,'Each currently maintained twice','g')}
        ${kpi('Integration layer needed','None','The join is the primary key','g')}
        ${kpi('Systems to maintain','1','Instead of two plus a bridge','a')}
      </div>
      <div style="margin-bottom:16px">${aiPanel('What the merge is actually doing',
        'Every dispatch client already exists as a reporting customer, and every dispatch site already exists as a reporting location — the dispatch copies are thinner duplicates of records the inspection side holds in full. The reporting schema already carries job_id and job_no as empty columns waiting for exactly this. So the work is not building a bridge between two systems; it is deleting one copy of each master and pointing everything at the survivor.',
        [{sev:'med',tag:'Migration',title:'The only genuinely hard part is matching people',
          detail:'Customers and sites match cleanly on name, code and address. People need matching on email first and full name second, because the same person can appear as an inspector on one side and a crew member on the other with different spellings.',
          action:'Resolve the workforce list by hand before cutover — it is small enough to do once.'}], 'Observed across both systems', true)}</div>

      <div class="panel" style="margin-bottom:16px"><div class="panel-h"><h3>Entity by entity</h3><div class="sp"></div>
        <span class="dim" style="font-size:11.5px">How each record carries across</span></div>
        ${table(['Entity','In Reporting','In Dispatch','Match on','Survives','What is dropped'],
          D.merge.map(m=>({cells:[`<b>${esc(m.entity)}</b>`, esc(m.rep), esc(m.dis),
            `<span class="mono">${esc(m.key)}</span>`,
            m.keep==='Merged'?pill('Merged','acc'):pill(m.keep, m.keep==='Reporting'?'info':'ok'),
            `<span class="muted">${esc(m.drop)}</span>`]})))}
      </div>

      <div class="grid g2">
        <div class="panel"><div class="panel-h"><h3>Duplication removed</h3></div>
          ${table(['What','Today','Unified'], dedupe.map(d=>({cells:[`<b>${esc(d[0])}</b>`,
            pill(d[1]+'','bad'), pill(d[2]+'','ok')]})))}
        </div>
        <div class="panel"><div class="panel-h"><h3>Why each survivor wins</h3></div>
          <div class="panel-b">${D.merge.filter(m=>m.keep!=='Merged').map(m=>`
            <div style="padding:10px 0;border-top:1px solid var(--line)">
              <div class="split"><b>${esc(m.entity)}</b>${pill(m.keep+' wins', m.keep==='Reporting'?'info':'ok')}</div>
              <div class="muted" style="font-size:12px;margin-top:4px;line-height:1.55">${esc(m.note)}</div>
            </div>`).join('')}</div>
        </div>
      </div>

      <div class="panel" style="margin-top:16px"><div class="panel-h"><h3>One record, end to end</h3><div class="sp"></div>
        <span class="dim" style="font-size:11.5px">Open any job to see this chain on a single screen</span></div>
        <div class="panel-b">
          <div class="steps" style="flex-wrap:wrap;gap:10px 0">
            ${['Customer & site','Job raised','Crew dispatched','Check in / out','Mileage','Inspection & report','Close out','Invoice']
              .map((x,i)=>`<div class="step done"><span class="dot">${i+1}</span><span class="nm">${esc(x)}</span></div>${i<7?'<span class="ln"></span>':''}`).join('')}
          </div>
          <div class="sep"></div>
          <div class="split"><button class="btn pri" data-go="job" data-arg="JOB-2026-0117">Open JOB-2026-0117</button>
            <span class="dim" style="font-size:12px">Crew, hours, mileage, 4 inspected items, close out and invoice — one record.</span></div>
        </div>
      </div>` };
  };

  window.VIEWS = V;
})();

/* ============================================================================
   Field-operations actions. Same store, same persistence as the inspection side.
   ============================================================================ */
(function () {
  const D = window.ZD, U = window.UI, S = window.S, DB = window.DB, A = window.ACT;

  const locOptions = () => D.customers.flatMap(c => c.locations.map(l => ({
    v: c.id + '|' + l.id, l: c.name + (l.name !== c.name ? ' — ' + l.name : '') + '  (' + l.city + ', ' + l.state + ')' })));
  const crewOptions = () => D.crews.map(c => ({ v:c.id,
    l: c.name + ' — ' + D.empById(c.lead).name + ' · ' + c.members.length + ' on crew · ' + c.shift }));
  const nextJobNo = () => 'JOB-2026-' + String(D.jobs.reduce((m,j) =>
    Math.max(m, parseInt(j.no.split('-').pop(), 10) || 0), 0) + 1).padStart(4, '0');

  function jobForm(existing) {
    U.openForm({
      title: existing ? 'Edit ' + existing.no : 'New job',
      subtitle:'Dispatch raises the job. The inspection, the hours and the invoice all attach to it.',
      wide:true, submitLabel: existing ? 'Save job' : 'Create job',
      values: existing
        ? { loc: existing.cust + '|' + existing.loc, type:existing.type, priority:existing.priority,
            scheduled:existing.scheduled, crew:existing.crew || '', fence:existing.geo.fence, notes:existing.notes }
        : { priority:'Normal', fence:200, scheduled: new Date().toISOString().slice(0,10) + ' 07:00' },
      sections:[{ cols:3, fields:[
        { k:'loc', label:'Customer and site', type:'select', required:true, placeholder:'Select…',
          options: locOptions(), width:2, help:'newJob' },
        { k:'type', label:'Work type', required:true, placeholder:'Shop inspection' },
        { k:'scheduled', label:'Scheduled', required:true, mono:true, placeholder:'2026-08-22 07:00' },
        { k:'priority', label:'Priority', type:'select', options:['Low','Normal','High','Urgent'] },
        { k:'crew', label:'Crew', type:'select', placeholder:'Leave unassigned', options: crewOptions(), help:'assignCrew' },
        { k:'fence', label:'Geo-fence radius (m)', type:'number', mono:true, help:'geofence' },
        { k:'notes', label:'Notes', type:'textarea', width:2, placeholder:'Optional' } ]}],
      danger: existing ? { label:'Delete job', run:() => A.deleteJob(existing.no) } : null,
      onSubmit(v) {
        const [cust, loc] = v.loc.split('|');
        const rec = existing || { no: nextJobNo(), started:null, finished:null, inspection:null };
        Object.assign(rec, { cust, loc, crew: v.crew || null, priority: v.priority || 'Normal',
          scheduled: v.scheduled, type: v.type, notes: v.notes || '',
          geo:{ fence: parseInt(v.fence,10) || 200, verified: existing ? existing.geo.verified : null },
          status: rec.inspection ? rec.status : (v.crew ? 'Dispatched' : 'Unassigned') });
        if (!existing) D.jobs.unshift(rec);
        U.commit('Job <b>' + rec.no + '</b> ' + (existing ? 'updated' : 'created'));
        if (!existing) U.go('job', rec.no);
      } });
  }
  A.newJob  = () => jobForm(null);
  A.editJob = (no) => { const j = D.jobByNo(no); if (j) jobForm(j); };

  A.deleteJob = (no) => {
    const j = D.jobByNo(no); if (!j) return;
    U.confirmAction('Delete ' + no + '?',
      j.inspection ? `Inspection ${j.inspection} stays, but it will no longer be attached to a job.`
                   : 'Attendance and mileage recorded against this job will be removed.',
      'Delete job', () => {
        [...D.attendance].forEach(a => { if (a.job === no) D.attendance.splice(D.attendance.indexOf(a),1); });
        D.mileage.forEach(m => { if (m.job === no) m.job = null; });
        D.jobs.splice(D.jobs.indexOf(j), 1);
        U.commit('Job deleted'); U.go('jobs');
      });
  };

  A.assignCrew = (no) => {
    const j = D.jobByNo(no); if (!j) return;
    U.openForm({
      title:'Assign a crew to ' + no,
      subtitle: D.custById(j.cust).name + ' · ' + j.type + ' · scheduled ' + j.scheduled,
      submitLabel:'Assign crew', values:{ crew: j.crew || '' },
      sections:[{ cols:1, fields:[
        { k:'crew', label:'Crew', type:'select', required:true, placeholder:'Select…',
          options: crewOptions(), help:'assignCrew' } ]}],
      footNote:'Certifications are carried on each person’s record — the same record the inspection side reads.',
      onSubmit(v) {
        j.crew = v.crew;
        if (j.status === 'Unassigned') j.status = 'Dispatched';
        U.commit('<b>' + U.esc(D.crewById(v.crew).name) + '</b> assigned to ' + no);
      } });
  };

  /* the mechanic that only exists once the two halves are one system */
  A.raiseInspection = (no) => {
    const j = D.jobByNo(no); if (!j) return;
    if (j.inspection) { U.toast('This job already has inspection ' + j.inspection, 'bad'); return; }
    const crew = j.crew ? D.crewById(j.crew) : null;
    const loc = D.locById(j.loc).loc;
    U.openForm({
      title:'Raise an inspection from ' + no,
      subtitle:'Customer, site, date and crew carry across. Nothing is re-typed.',
      wide:true, submitLabel:'Raise inspection',
      values:{ lead: crew ? crew.lead : 'EMP-02', division: loc.divisions[0] || 'Main',
        date: j.scheduled.slice(0,10), po:'', methods:['MPI','VT'], spec:['ZION Spec'],
        format:(D.reportFormats[0]||{}).name, jsa:'' },
      sections:[
        { label:'Carried from the job', cols:3, fields:[
          { k:'_c', label:'Customer', type:'select', options:[D.custById(j.cust).name] },
          { k:'_s', label:'Site', type:'select', options:[loc.name + ' — ' + loc.city] },
          { k:'date', label:'Date', required:true, mono:true } ] },
        { label:'Inspection', cols:3, fields:[
          { k:'lead', label:'Lead inspector', type:'select', required:true,
            options: D.employees.filter(e=>/Inspector|Manager/.test(e.role)).map(e=>({v:e.id,l:e.name+' — '+e.role})), help:'lead' },
          { k:'division', label:'Division' },
          { k:'po', label:'AFE / PO', mono:true, placeholder:'Leave blank if not supplied', help:'po' },
          { k:'format', label:'Report format', type:'select', options: D.reportFormats.map(f=>f.name), help:'reportFormat' },
          { k:'jsa', label:'Job safety analysis', type:'select', placeholder:'Select…',
            options: D.jsaTemplates.map(t=>({v:t.id,l:t.name})), help:'jsa' } ] },
        { label:'Technique', cols:2, fields:[
          { k:'methods', label:'Methods', type:'multi', required:true, options: D.master.method },
          { k:'spec', label:'Inspected per', type:'multi', required:true, options: D.master.spec, help:'spec' } ] } ],
      onSubmit(v) {
        const insNo = DB.nextInspectionNo();
        const fmt = D.reportFormats.find(f => f.name === v.format) || D.reportFormats[0];
        D.inspections.unshift({ no:insNo, uuid:'n'+insNo, cust:j.cust, loc:j.loc, date:v.date,
          status:'In Progress', lead:v.lead, assist:[], po:v.po || '—', rig:'—',
          division:v.division || 'Main', spec:v.spec, methods:v.methods, format:fmt.id,
          thirdParty:false, jsa:v.jsa || null, job:j.no,
          specs:{ whiteLight:420, blacklight:v.methods.indexOf('MPI')>-1?4200:0,
            bathStrength:v.methods.indexOf('MPI')>-1?0.3:0, bathBatch:'24E024', dryPowder:'23081',
            surfaceTemp:74, penDwell:10, devDwell:7 },
          items:[] });
        j.inspection = insNo;
        j.status = 'Inspection complete';
        U.commit('Inspection <b>' + insNo + '</b> raised from ' + no);
        U.go('inspection', insNo);
      } });
  };

  A.setMileage = (id, status) => {
    const m = D.mileage.find(x => x.id === id); if (!m) return;
    m.status = status;
    if (status === 'Rejected') m.billable = false;
    U.commit('Mileage ' + status.toLowerCase());
  };
  A.approveAllMileage = () => {
    const pend = D.mileage.filter(m => m.status === 'Pending');
    if (!pend.length) { U.toast('Nothing pending', 'bad'); return; }
    pend.forEach(m => m.status = 'Approved');
    U.commit(pend.length + ' mileage claim' + (pend.length>1?'s':'') + ' approved');
  };

  /* help for the operations side */
  if (window.UI.addHelp) window.UI.addHelp({
    newJob:{ t:'Raising a job', b:'A job is the parent record for everything that follows — the crew, their hours, their mileage, the inspection and the invoice all attach to it.',
      eg:'In the split systems this is the record that had to be reconciled by hand.' },
    assignCrew:{ t:'Assigning a crew', b:'Crews carry their own shift, home base and overtime cap. Certifications come from each person’s record, which is the same record the inspection side reads.',
      eg:'Assigning a crew moves the job from Unassigned to Dispatched.' },
    geofence:{ t:'Geo-fence radius', b:'How close to the site a crew must be for a check-in to count as verified. Set per job, defaulting from the site record.',
      eg:'A check-in outside the fence still records, but it is flagged before the hours reach payroll.' }
  });
})();

/* ============================================================================
   Calendar + Operations map — the two views that make the unified system a
   superset of what CrewViewPro already does.
   ============================================================================ */
(function () {
  const D = window.ZD, U = window.UI, V = window.VIEWS, S = window.S;
  const { esc, pill, ic } = U;
  const head = (t,sub,right)=>`<div class="phead"><div><h1>${esc(t)}</h1>${sub?`<p>${sub}</p>`:''}</div><div class="sp"></div>${right||''}</div>`;
  const kpi=(k,v,s,cls)=>`<div class="kpi ${cls||''}"><div class="k" style="display:flex;align-items:center;gap:5px">${k}</div><div class="v">${v}</div>${s?`<div class="s">${s}</div>`:''}</div>`;

  const DAY = 86400000;
  const iso = d => d.toISOString().slice(0,10);
  const parse = s => new Date(s.slice(0,10) + 'T00:00:00');
  const TODAY = new Date('2026-08-21T00:00:00');
  const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const MON = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const jobTone = j => j.status==='Invoiced'||j.status==='Report approved' ? 'ok'
    : j.status==='Unassigned' ? 'bad'
    : j.status==='Dispatched'||j.status==='Scheduled' ? 'warn' : 'info';

  /* every dated thing in the business, on one calendar */
  function entries() {
    const out = [];
    D.jobs.forEach(j => out.push({ kind:'job', date: iso(parse(j.scheduled)), time: j.scheduled.slice(11) || '',
      label: j.no, sub: D.custById(j.cust).name, crew: j.crew, tone: jobTone(j), go:'job', arg:j.no,
      status: j.status }));
    D.inspections.forEach(i => { if (D.jobs.some(j => j.inspection === i.no)) return;
      out.push({ kind:'insp', date:i.date, time:'', label:'Insp ' + i.no, sub: D.custById(i.cust).name,
        crew:null, tone:'acc', go:'inspection', arg:i.no, status:i.status }); });
    D.invoices.forEach(v => out.push({ kind:'inv', date:v.due, time:'', label:'Inv ' + v.no + ' due',
      sub: D.custById(v.cust).name, crew:null, tone: v.status==='Paid'?'mute':'marg',
      go:'invoice', arg:v.no, status:v.status }));
    return out;
  }

  V.calendar = () => {
    const mode = S.calMode || 'week';
    const anchor = S.calAnchor ? new Date(S.calAnchor) : TODAY;
    const all = entries();

    /* ---- week: crews down the side, days across ---- */
    let grid = '', title = '';
    if (mode === 'week') {
      const start = new Date(anchor.getTime() - anchor.getDay()*DAY);
      const days = Array.from({length:7}, (_,i) => new Date(start.getTime() + i*DAY));
      title = `Week of ${MON[start.getMonth()]} ${start.getDate()} – ${days[6].getDate()}, ${days[6].getFullYear()}`;
      const rows = D.crews.map(c => ({ id:c.id, name:c.name, sub:D.empById(c.lead).name + ' · ' + c.shift.split(' · ')[0] }))
        .concat([{ id:'__none', name:'Unassigned', sub:'Needs a crew' },
                 { id:'__other', name:'Reporting & billing', sub:'Not crew-scheduled' }]);
      grid = `<div class="tw"><table class="t cal"><thead><tr><th style="width:190px">Crew</th>
        ${days.map(d=>`<th class="${iso(d)===iso(TODAY)?'now':''}">${DOW[d.getDay()]} ${d.getDate()}</th>`).join('')}</tr></thead>
        <tbody>${rows.map(r=>`<tr>
          <td class="crewcell"><b>${esc(r.name)}</b><div class="dim" style="font-size:11px">${esc(r.sub)}</div></td>
          ${days.map(d=>{ const k = iso(d);
            const cell = all.filter(e => e.date === k && (
              r.id==='__none'  ? (e.kind==='job' && !e.crew) :
              r.id==='__other' ? (e.kind!=='job') : e.crew === r.id));
            return `<td class="daycell ${k===iso(TODAY)?'now':''}">${cell.map(e=>
              `<span class="chip-e ${e.tone}" data-go="${e.go}" data-arg="${esc(e.arg)}" title="${esc(e.sub)} — ${esc(e.status)}">
                 ${e.time?`<i>${esc(e.time.slice(0,5))}</i>`:''}${esc(e.label)}</span>`).join('')}</td>`;}).join('')}
        </tr>`).join('')}</tbody></table></div>`;
    }

    /* ---- month ---- */
    if (mode === 'month') {
      const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
      const startPad = first.getDay();
      const cells = Array.from({length:42}, (_,i) => new Date(first.getTime() + (i - startPad)*DAY));
      title = `${MON[anchor.getMonth()]} ${anchor.getFullYear()}`;
      grid = `<div class="monthgrid">
        ${DOW.map(d=>`<div class="mh">${d}</div>`).join('')}
        ${cells.map(d=>{ const k = iso(d); const on = all.filter(e=>e.date===k);
          const out = d.getMonth() !== anchor.getMonth();
          return `<div class="mcell ${out?'out':''} ${k===iso(TODAY)?'now':''}">
            <div class="mnum">${d.getDate()}</div>
            ${on.slice(0,4).map(e=>`<span class="chip-e ${e.tone}" data-go="${e.go}" data-arg="${esc(e.arg)}"
               title="${esc(e.sub)} — ${esc(e.status)}">${esc(e.label)}</span>`).join('')}
            ${on.length>4?`<span class="more">+${on.length-4} more</span>`:''}</div>`;}).join('')}
      </div>`;
    }

    /* ---- day ---- */
    if (mode === 'day') {
      const k = iso(anchor);
      const on = all.filter(e => e.date === k);
      title = `${DOW[anchor.getDay()]} ${MON[anchor.getMonth()]} ${anchor.getDate()}, ${anchor.getFullYear()}`;
      grid = on.length ? `<div class="panel">${(() => {
        const rows = on.map(e => ({ cells:[
          e.time?`<span class="mono">${esc(e.time.slice(0,5))}</span>`:'<span class="dim">—</span>',
          pill(e.kind==='job'?'Job':e.kind==='insp'?'Inspection':'Invoice', e.kind==='job'?'info':e.kind==='insp'?'acc':'marg'),
          `<b class="link" data-go="${e.go}" data-arg="${esc(e.arg)}">${esc(e.label)}</b>`,
          esc(e.sub), e.crew?esc(D.crewById(e.crew).name):'<span class="dim">—</span>',
          pill(e.status, e.tone)] }));
        return `<div class="tw"><table class="t"><thead><tr>
          <th>Time</th><th>Type</th><th>Reference</th><th>Customer</th><th>Crew</th><th>Status</th></tr></thead>
          <tbody>${rows.map(r=>`<tr>${r.cells.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
      })()}</div>` : `<div class="panel"><div class="center">Nothing scheduled on this day.</div></div>`;
    }

    const step = mode==='month' ? 30 : mode==='week' ? 7 : 1;
    const shift = n => iso(new Date(anchor.getTime() + n*step*DAY));
    const wk = all.filter(e => Math.abs(parse(e.date) - TODAY) < 4*DAY);

    return { crumb:'Calendar', html:
      head('Calendar','Crews, inspections and invoice dates on one schedule — the whole operation, not half of it.') +
      `<div class="grid g4" style="margin-bottom:16px">
        ${kpi('Jobs this week', all.filter(e=>e.kind==='job'&&Math.abs(parse(e.date)-TODAY)<4*DAY).length,'Across all crews','a')}
        ${kpi('Unassigned', D.jobs.filter(j=>j.status==='Unassigned').length,'No crew yet', D.jobs.some(j=>j.status==='Unassigned')?'b':'g')}
        ${kpi('Invoices falling due', all.filter(e=>e.kind==='inv'&&parse(e.date)>=TODAY).length,'Next 60 days','w')}
        ${kpi('On the board today', wk.filter(e=>e.date===iso(TODAY)).length,'Jobs, inspections and due dates','')}
      </div>
      <div class="panel"><div class="panel-h">
        <button class="btn sm" data-cal="${shift(-1)}">&larr;</button>
        <button class="btn sm" data-cal="${iso(TODAY)}">Today</button>
        <button class="btn sm" data-cal="${shift(1)}">&rarr;</button>
        <h3 style="margin-left:8px">${esc(title)}</h3>
        <div class="sp"></div>
        <div class="roleswitch">
          ${['day','week','month'].map(m=>`<button data-calmode="${m}" class="${mode===m?'on':''}">${m}</button>`).join('')}
        </div></div>
        ${grid}
        <div class="panel-b" style="border-top:1px solid var(--line)">
          <div class="split" style="gap:16px">
            <span class="eyebrow">Legend</span>
            ${pill('Scheduled / dispatched','warn')}${pill('In inspection','info')}
            ${pill('Approved / invoiced','ok')}${pill('Unassigned','bad')}
            ${pill('Inspection only','acc')}${pill('Invoice due','marg')}
          </div></div>
      </div>` };
  };

  /* ============================================================ OPERATIONS MAP */
  V.map = () => {
    const reg = D.regions[S.mapRegion || 'permian'];
    const key = S.mapRegion || 'permian';
    const W = 1000, H = 620, PAD = 46;
    const X = lng => PAD + ((lng - reg.w) / (reg.e - reg.w)) * (W - PAD*2);
    const Y = lat => PAD + ((reg.n - lat) / (reg.n - reg.s)) * (H - PAD*2);

    const short = n => n.replace(/\b(Technologies|Services|Solutions|Energy|Oilfield|Drilling|Tools|Inc|Ltd)\b/g,'').replace(/\s+/g,' ').trim() || n;
    const sites = Object.keys(D.siteGeo).filter(id => D.siteGeo[id].region === key)
      .map((id, i) => { const g = D.siteGeo[id], l = D.locById(id);
        const open = D.jobs.filter(j => j.loc === id && ['Scheduled','Dispatched'].indexOf(j.status) > -1);
        return { id, g, i, name:l.loc.name, cust:l.cust.name, label:short(l.cust.name), city:l.loc.city, open }; });
    const crews = D.live.filter(p => {
      const inBox = p.lng >= reg.w && p.lng <= reg.e && p.lat >= reg.s && p.lat <= reg.n;
      return inBox; });

    const onSite = D.live.filter(p=>p.status==='On site').length;
    const transit = D.live.filter(p=>p.status==='In transit').length;
    const off = D.live.filter(p=>p.status==='Off shift').length;
    const viol = D.attendance.filter(a=>a.geo!=='Verified').length;

    const tone = s => s==='On site'?'var(--ok)':s==='In transit'?'var(--info)':'var(--ink-3)';

    return { crumb:'Operations Map', html:
      head('Operations Map','Where every crew and every job site is, right now — against the same site records the inspection side bills from.',
        `<div class="roleswitch">${Object.keys(D.regions).map(r=>
          `<button data-region="${r}" class="${key===r?'on':''}">${esc(D.regions[r].name)}</button>`).join('')}</div>`) +
      `<div class="grid g4" style="margin-bottom:16px">
        ${kpi('On site', onSite, 'Inside the geo-fence','g')}
        ${kpi('In transit', transit, 'Between jobs','a')}
        ${kpi('Off shift', off, 'Not clocked in','')}
        ${kpi('Geo violations', viol, viol?'Check-ins outside the fence':'All check-ins verified', viol?'b':'g')}
      </div>
      <div class="grid g-2-1">
        <div class="panel"><div class="panel-h"><h3>${esc(reg.name)}</h3><div class="sp"></div>
          <span class="livedot"></span><span class="dim" style="font-size:11.5px">Live · updated 2 min ago</span></div>
          <div class="mapwrap">
          <svg viewBox="0 0 ${W} ${H}" class="opsmap" preserveAspectRatio="xMidYMid meet">
            <defs>
              <pattern id="g" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M50 0H0V50" fill="none" stroke="var(--line)" stroke-width="1"/></pattern>
            </defs>
            <rect width="${W}" height="${H}" fill="var(--panel-2)"/>
            <rect width="${W}" height="${H}" fill="url(#g)"/>
            ${reg.roads.map(r=>`<path d="M${r.map(p=>X(p[0]).toFixed(1)+' '+Y(p[1]).toFixed(1)).join(' L')}"
              fill="none" stroke="var(--line-2)" stroke-width="6" stroke-linecap="round"/>`).join('')}
            ${reg.towns.map(t=>`<g>
              <circle cx="${X(t.lng).toFixed(1)}" cy="${Y(t.lat).toFixed(1)}" r="5" fill="var(--ink-3)"/>
              <text x="${(X(t.lng)+11).toFixed(1)}" y="${(Y(t.lat)+4).toFixed(1)}"
                font-size="15" font-weight="700" fill="var(--ink-3)" letter-spacing="1.6"
                paint-order="stroke" stroke="var(--panel-2)" stroke-width="4" stroke-linejoin="round">${esc(t.n.toUpperCase())}</text>
            </g>`).join('')}
            ${sites.map(s=>{const x=X(s.g.lng),y=Y(s.g.lat);
              return `<g class="sitepin" data-go="account" data-arg="${esc(D.locById(s.id).cust.id)}">
                <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="26" fill="var(--brand)" opacity=".07"/>
                <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="26" fill="none" stroke="var(--brand)"
                  stroke-width="1" stroke-dasharray="3 4" opacity=".5"/>
                <rect x="${(x-5).toFixed(1)}" y="${(y-5).toFixed(1)}" width="10" height="10"
                  fill="var(--paper)" stroke="var(--brand)" stroke-width="2.5"/>
                <text x="${(x).toFixed(1)}" y="${(y + (s.i%2?38:-32)).toFixed(1)}" text-anchor="middle"
                  font-size="12.5" font-weight="700" fill="var(--ink-2)"
                  paint-order="stroke" stroke="var(--panel-2)" stroke-width="4" stroke-linejoin="round">${esc(s.label)}</text>
                ${s.open.length?`<circle cx="${(x+9).toFixed(1)}" cy="${(y-9).toFixed(1)}" r="7" fill="var(--marg)"/>
                  <text x="${(x+9).toFixed(1)}" y="${(y-5.6).toFixed(1)}" text-anchor="middle" font-size="9"
                    font-weight="700" fill="#fff">${s.open.length}</text>`:''}
              </g>`;}).join('')}
            ${crews.filter(p=>p.route).map(p=>`<path d="M${p.route.map(c=>X(c[0]).toFixed(1)+' '+Y(c[1]).toFixed(1)).join(' L')}"
              fill="none" stroke="var(--info)" stroke-width="2.5" stroke-dasharray="7 6" opacity=".8">
              <animate attributeName="stroke-dashoffset" from="26" to="0" dur="1.4s" repeatCount="indefinite"/></path>`).join('')}
            ${crews.map(p=>{const x=X(p.lng),y=Y(p.lat),c=D.crewById(p.crew);
              return `<g class="crewpin" data-go="${p.job?'job':'crews'}" data-arg="${esc(p.job||'')}">
                ${p.status!=='Off shift'?`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="15" fill="${tone(p.status)}" opacity=".18">
                  <animate attributeName="r" values="11;20;11" dur="2.6s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values=".3;0;.3" dur="2.6s" repeatCount="indefinite"/></circle>`:''}
                <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9" fill="${tone(p.status)}" stroke="var(--paper)" stroke-width="3"/>
                <text x="${(x).toFixed(1)}" y="${(y-19).toFixed(1)}" text-anchor="middle" font-size="12.5"
                  font-weight="700" fill="var(--ink)"
                  paint-order="stroke" stroke="var(--panel-2)" stroke-width="4" stroke-linejoin="round">${esc(c.name)}</text>
              </g>`;}).join('')}
          </svg></div>
          <div class="panel-b" style="border-top:1px solid var(--line)"><div class="split" style="gap:18px">
            <span class="eyebrow">Legend</span>
            <span class="lg"><i style="background:var(--ok)"></i>On site</span>
            <span class="lg"><i style="background:var(--info)"></i>In transit</span>
            <span class="lg"><i style="background:var(--ink-3)"></i>Off shift</span>
            <span class="lg"><i class="sq"></i>Job site &amp; geo-fence</span>
            <span class="lg"><i style="background:var(--marg)"></i>Open jobs at site</span>
          </div></div>
        </div>

        <div class="stack">
          <div class="panel"><div class="panel-h"><h3>Crew status</h3><div class="sp"></div>
            <span class="dim" style="font-size:11.5px">${D.live.length} tracked</span></div>
            <div class="panel-b" style="padding:0">
            ${D.live.map(p=>{const c=D.crewById(p.crew), j=p.job?D.jobByNo(p.job):null;
              const tn = p.status==='On site'?'ok':p.status==='In transit'?'info':'mute';
              return `<div class="titem" ${j?`data-go="job" data-arg="${esc(j.no)}"`:''}>
                <div class="s"><span class="led ${tn}"></span>${esc(c.name)}<span class="sp"></span>
                  ${pill(p.status, tn)}</div>
                <div class="m"><b>${esc(D.empById(c.lead).name)}</b> <span class="sep">·</span> ${c.members.length} on crew
                  <span class="sep">·</span> ${esc(p.updated)}</div>
                <div class="m dim">${j?esc(j.no)+' — '+esc(D.custById(j.cust).name):'No active job'}
                  ${p.inFence===false?pill('Outside fence','bad'):''}</div>
              </div>`;}).join('')}
            </div></div>

          <div class="panel"><div class="panel-h"><h3>Sites in ${esc(reg.name)}</h3><div class="sp"></div>
            <span class="dim" style="font-size:11.5px">${sites.length}</span></div>
            <div class="panel-b" style="padding:0">
            ${sites.map(s=>{const fj=D.jobs.find(j=>j.loc===s.id);
              return `<div class="titem" data-go="account" data-arg="${esc(D.locById(s.id).cust.id)}">
              <div class="s">${esc(s.cust)}<span class="sp"></span>
                ${s.open.length?pill(s.open.length+' open','marg'):''}</div>
              <div class="m"><b>${esc(s.city)}</b> <span class="sep">·</span> geo-fence ${fj?fj.geo.fence:200} m</div>
            </div>`;}).join('')}
            </div></div>
        </div>
      </div>` };
  };

  window.VIEWS = V;
})();
