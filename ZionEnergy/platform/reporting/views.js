/* Zion Platform — views. */
(function () {
  const D = window.ZD, AI = window.ZAI, U = window.UI;
  const { esc, money, pill, statusPill, ic } = U;
  const S = window.S;
  const V = {};

  /* ---------- shared bits ---------- */
  const head = (t, sub, right) => `<div class="phead"><div><h1>${esc(t)}</h1>${sub?`<p>${sub}</p>`:''}</div>
    <div class="sp"></div>${right||''}</div>`;

  const kpi = (k, v, s, cls) => `<div class="kpi ${cls||''}"><div class="k" style="display:flex;align-items:center;gap:5px">${k}</div>
    <div class="v">${v}</div>${s?`<div class="s">${s}</div>`:''}</div>`;

  const field = (label, val, opts) => {
    opts = opts || {};
    const empty = val === undefined || val === null || val === '' || val === '—';
    return `<div class="f ${opts.req?'req':''}"><label>${esc(label)}${opts.help?U.help(opts.help):''}</label>
      <div class="val ${opts.mono?'mono':''} ${empty?'empty':''}">${empty?'—':val}</div></div>`;
  };

  const table = (head, rows, opts) => {
    opts = opts || {};
    if (!rows.length) return `<div class="center">Nothing to show here yet.</div>`;
    return `<div class="tw"><table class="t"><thead><tr>${head.map(h=>`<th class="${/^\+/.test(h)?'r':''}">${esc(h.replace(/^\+/,''))}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(r=>`<tr class="${opts.click?'rowbtn':''}" ${opts.click?`data-go="${opts.click}" data-arg="${esc(r.__arg)}"`:''}>${
        r.cells.map((c,i)=>`<td class="${/^\+/.test(head[i]||'')?'r':''}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  };

  const aiPanel = (title, narrative, flags, tagline, open) =>
    U.aiPanel({ title, narrative, flags, tagline, open });

  /* tolerance table for an item */
  function tolTable(item) {
    const tol = AI.toleranceCheck(item);
    if (!tol.length) return `<div class="center">No dimensional connections recorded on this item.</div>`;
    return tol.map(c => `
      <div style="margin-bottom:18px">
        <div class="split" style="margin-bottom:9px">
          <span class="eyebrow">Conn — ${esc(c.key)}</span>
          <b class="mono" style="font-size:13px">${esc(c.type)}</b>
          ${c.verdict==='PASS'?pill('Accept','ok'):pill('Reject','bad')}
          ${c.marginal.length?pill(c.marginal.length+' marginal','marg'):''}
        </div>
        <div class="tw"><table class="t"><thead><tr>
          <th>Dimension</th><th>Measured</th><th>Decimal</th><th>Allowed range</th><th>Margin to limit</th><th>Verdict</th>
        </tr></thead><tbody>${c.rows.map(r=>{
          const v = r.verdict;
          const w = v==='fail'?100:v==='unchecked'?0:Math.max(4,Math.min(100,r.margin));
          return `<tr class="tolrow">
            <td class="lbl">${esc(r.label)}</td>
            <td><b>${esc(r.raw)}"</b></td>
            <td class="dim">${r.dec!=null?r.dec.toFixed(4)+'"':'—'}</td>
            <td class="dim">${r.range?r.range[0].toFixed(3)+' – '+r.range[1].toFixed(3)+'"':'not specified'}</td>
            <td>${r.range&&v!=='unchecked'?`<div class="tol"><div class="bar"><i class="fill ${v==='pass'?'ok':v}" style="width:${w}%"></i></div>
                <span class="pc">${v==='fail'?'out':(r.margin<1?'limit':AI.pct(r.margin))}</span></div>`:'<span class="dim">—</span>'}</td>
            <td>${v==='pass'?pill('Pass','ok'):v==='marginal'?pill('Marginal','marg'):v==='fail'?pill('Fail','bad'):pill('Not checked','mute')}</td>
          </tr>`;}).join('')}</tbody></table></div>
      </div>`).join('');
  }

  /* ============================================================ DASHBOARD */
  V.dashboard = () => {
    const p = AI.portfolio();
    const inProg = D.inspections.filter(i=>i.status==='In Progress');
    const flags = AI.billingFlags().concat(
      p.expiring.map(e=>({sev:'med',tag:'Calibration',title:`${e.name} expires ${e.exp}`,
        detail:`${e.serial} — readings taken after expiry are not defensible.`,action:'Book recalibration.'})),
      p.noPo.map(i=>({sev:'med',tag:'Commercial',title:`Inspection ${i.no} has no PO`,
        detail:`${D.custById(i.cust).name} requires a PO before invoicing.`,action:'Chase it before the job reaches billing.'}))
    );
    const narrative = AI.ask('what should I look at today').text;

    return { crumb:'Dashboard', html:
      head('Operations Overview', 'Live position across inspection, compliance and revenue — one screen, one source.') +
      `<div class="grid g4" style="margin-bottom:16px">
        ${kpi('Inspections open', inProg.length, `${D.inspections.length} in the current window`,'a')}
        ${kpi('Item reject rate', AI.pct(p.rejRate), `${Object.values(D.items).filter(i=>i.status==='REJECTED').length} of ${Object.keys(D.items).length} items`,'w')}
        ${kpi('Outstanding', money(p.outstanding), `${money(p.overdue)} of it overdue`,'b')}
        ${kpi('Never sent', money(p.unsent), 'Raised but not in the customer queue','w')}
      </div>
      <div class="grid g-2-1">
        <div class="stack">
          ${aiPanel('Daily Brief', null, flags.slice(0,6),
            'Reads inspections, calibration, price sheets and the ledger', true)}
          <div class="panel"><div class="panel-h"><h3>Inspections in progress</h3><div class="sp"></div>
            <button class="btn sm" data-go="inspections">View all</button></div>
            ${table(['Inspection','Customer','Date','Items','Lead','Status'],
              inProg.map(i=>({__arg:i.no, cells:[
                `<b class="mono link">${i.no}</b>`, esc(D.custById(i.cust).name), i.date,
                i.items.length, esc(D.empById(i.lead).name), statusPill(i.status)]})), {click:'inspection'})}
          </div>
        </div>
        <div class="stack">
          <div class="panel"><div class="panel-h"><h3>Ask Zion</h3>${U.help('ask')}</div><div class="panel-b">
            <div class="ai-sum" style="margin-bottom:12px">${esc(narrative.split('\n')[0])}</div>
            <div class="chips">${AI.SUGGESTIONS.slice(0,4).map(s=>`<span class="chip" data-ask="${esc(s)}">${esc(s)}</span>`).join('')}</div>
          </div></div>
        </div>
      </div>` };
  };

  /* ============================================================ INSPECTIONS LIST */
  V.inspections = () => ({ crumb:'Inspections', html:
    head('Inspections', 'Every job, its items, its compliance position and where it sits in the billing chain.',
      `<button class="btn pri" data-act="newInspection">${ic('clipboard')} New inspection</button>`) +
    `<div class="grid g4" style="margin-bottom:16px">
      ${kpi('In progress', D.inspections.filter(i=>i.status==='In Progress').length,'','a')}
      ${kpi('Submitted', D.inspections.filter(i=>i.status==='Submitted').length,'','w')}
      ${kpi('Approved', D.inspections.filter(i=>i.status==='Approved').length,'','g')}
      ${kpi('Invoiced', D.inspections.filter(i=>i.status==='Invoiced').length,'','')}
    </div>
    <div class="panel">${table(
      ['Inspection','Customer','Site','Date','Items','Rejects','PO','Lead','Status'],
      D.inspections.map(i=>{
        const its = i.items.map(x=>D.items[x]).filter(Boolean);
        const rej = its.filter(x=>x.status==='REJECTED').length;
        return { __arg:i.no, cells:[
          `<b class="mono link">${i.no}</b>`, esc(D.custById(i.cust).name),
          esc(D.locById(i.loc).loc.city+', '+D.locById(i.loc).loc.state), i.date, its.length,
          rej?pill(rej,'bad'):'<span class="dim">0</span>',
          i.po==='—'?pill('Missing','warn'):`<span class="mono">${esc(i.po)}</span>`,
          esc(D.empById(i.lead).name), statusPill(i.status)]};
      }), {click:'inspection'})}</div>` });

  /* ============================================================ INSPECTION DETAIL */
  const TABS = ['Job Header','Equipment','Specification','Job Safety','Inspection Table','Report Items',
                'Photos','Documents','Quality Assurance','Close Out','Billing Authorization','Print'];

  V.inspection = (no) => {
    const ins = D.inspByNo(no) || D.inspections[0];
    const cust = D.custById(ins.cust), loc = D.locById(ins.loc).loc;
    const its = ins.items.map(i=>D.items[i]).filter(Boolean);
    const flags = AI.inspectionFlags(ins);
    const canPrice = D.roles[S.role].pricing;
    const t = S.tab;

    const totals = its.reduce((a,i)=>{
      (i.prices||[]).forEach(p=>a.items += p.q*p.r);
      (i.standard||[]).forEach(p=>a.rem += p.q*p.r); return a; }, {items:0, rem:0});

    let body = '';
    if (t===0) body = `<div class="panel"><div class="panel-h"><h3>Job header</h3></div><div class="panel-b">
      <div class="fgrid">
        ${field('Company Location', esc(cust.name)+' — '+esc(loc.name), {req:1})}
        ${field('Division', esc(ins.division), {help:'division'})}
        ${field('Customer Contact', D.roles[S.role].customerContacts
            ? '<span class="mono">(432) 555-0148</span>'
            : `<span class="masked">${ic('lock')} Hidden — message via platform</span>`)}
        ${field('Lead Inspector', esc(D.empById(ins.lead).name), {req:1, help:'lead'})}
        ${field('Assistant Inspectors', ins.assist.map(a=>esc(D.empById(a).name)).join(', '))}
        ${field('Date', ins.date, {req:1, mono:1})}
        ${field('Lease / Well','')}
        ${field('Operator','')}
        ${field('Area', esc(loc.city)+', '+esc(loc.state))}
        ${field('Yard', esc(ins.division))}
        ${field('Rig / DT #', esc(ins.rig), {mono:1})}
        ${field('AFE / PO', ins.po==='—'?pill('Required — not supplied','warn'):`<span class="mono">${esc(ins.po)}</span>`, {req:1, help:'po'})}
        ${field('Customer Job #','')}
        ${field('BA / Invoice', ins.invoice?`<span class="mono link" data-go="invoice" data-arg="${ins.invoice}">${ins.invoice}</span>`:'')}
        ${field('Work Order','')}
        ${field('Is 3rd Party', ins.thirdParty?'Yes':'No', {help:'thirdParty'})}
        ${field('Report Format', esc((D.reportFormats.find(f=>f.id===ins.format)||{}).name), {help:'reportFormat'})}
        ${field('Status', statusPill(ins.status), {help:'inspStatus'})}
      </div></div></div>`;

    if (t===1) body = `<div class="panel"><div class="panel-h"><h3>Calibrated equipment used</h3>${U.help('equipment')}<div class="sp"></div>
      <span class="dim" style="font-size:11.5px">${D.equipment.length} instruments selected for report</span></div>
      ${table(['Instrument','Serial','Calibrated','Expires','Valid on job date'],
        D.equipment.map(e=>{ const left = AI.days(ins.date, e.exp);
          return { cells:[esc(e.name), `<span class="mono">${esc(e.serial)}</span>`, e.cal, e.exp,
            left<0?pill('Expired','bad'):left<30?pill(left+' days left','marg'):pill('Valid','ok')] };}))}</div>`;

    if (t===2) body = `<div class="panel"><div class="panel-h"><h3>Technique & specification</h3></div><div class="panel-b">
      <div class="split" style="margin-bottom:16px">
        <span class="eyebrow">Inspected per</span>
        ${D.master.spec.map(s=>`<span class="chk ${ins.spec.includes(s)?'on':''}"><i></i>${esc(s)}</span>`).join('')}
      </div>
      <div class="split" style="margin-bottom:16px">
        <span class="eyebrow">Methods</span>${ins.methods.map(m=>pill(m,'acc')).join(' ')}
      </div>
      <div class="fgrid">
        ${field('White Light Intensity', ins.specs.whiteLight?ins.specs.whiteLight+' lux':'', {mono:1, help:'whiteLight'})}
        ${field('Blacklight Intensity', ins.specs.blacklight?ins.specs.blacklight+' µW/cm²':'', {mono:1, help:'blacklight'})}
        ${field('Bath Strength', ins.specs.bathStrength?ins.specs.bathStrength+' ml/100ml':'', {mono:1, help:'bath'})}
        ${field('Bath Batch', ins.specs.bathBatch, {mono:1})}
        ${field('Dry Powder Batch #', ins.specs.dryPowder, {mono:1})}
        ${field('Tool Surface Temp', ins.specs.surfaceTemp?ins.specs.surfaceTemp+' °F':'', {mono:1})}
        ${field('Pen Dwell Time', ins.specs.penDwell?ins.specs.penDwell+' min':'', {mono:1, help:'dwell'})}
        ${field('Dev Dwell Time', ins.specs.devDwell?ins.specs.devDwell+' min':'', {mono:1})}
        ${field('MPI Control Strips', ins.methods.includes('MPI')?'Verified':'—')}
      </div></div></div>`;

    if (t===3) { const j = ins.jsa ? D.jsaById(ins.jsa) : null;
      body = `<div class="panel"><div class="panel-h"><h3>Job safety analysis</h3>${U.help('jsa')}<div class="sp"></div>
        <span class="dim" style="font-size:11.5px">Template</span>
        <select class="ctl" style="width:auto;padding:5px 26px 5px 10px;font-size:11.5px" data-setjsa="${ins.no}">
          <option value="">— none selected —</option>
          ${D.jsaTemplates.map(x=>`<option value="${x.id}" ${ins.jsa===x.id?'selected':''}>${esc(x.name)}</option>`).join('')}
        </select>
        ${j?`<button class="btn sm" data-go="jsa" data-arg="${j.id}">Open template</button>`:''}</div>
        ${j ? table(['#','Sequence of basic steps','Potential hazards','Controls'],
            j.steps.map((x,i)=>({cells:[`<span class="mono dim">${i+1}</span>`, `<b>${esc(x.step)}</b>`,
              esc(x.hazard), `<span class="muted">${esc(x.control)}</span>`]})))
          : `<div class="center">No JSA selected for this inspection.<br/>Pick a template above — the crew signs it before work starts.</div>`}
        ${j?`<div class="panel-b" style="border-top:1px solid var(--line)">
          <div class="eyebrow" style="margin-bottom:9px">Job safety equipment</div>
          <div class="grid g4">${D.ppe.map(e=>`<span class="chk ${j.equipment.indexOf(e)>-1?'on':''}"><i></i>${esc(e)}</span>`).join('')}</div>
          <div class="sep"></div>
          <div class="fgrid">
            ${field('Persons in attendance', [D.empById(ins.lead).name].concat(ins.assist.map(a=>D.empById(a).name)).map(n=>pill(n,'mute')).join(' '))}
            ${field('Noteworthy conditions', j.notes || '')}
            ${field('Signed', pill('Signed on site — '+ins.date,'ok'))}
          </div></div>`:''}
      </div>`; }

    if (t===4) body = `<div class="panel"><div class="panel-h"><h3>Inspection table</h3>${U.help('newItem')}<div class="sp"></div>
      <span class="dim" style="font-size:11.5px">${its.length} items</span>
      <button class="btn pri sm" data-act="addItem" data-arg="${ins.no}">+ Add item</button></div>
      ${its.length ? table(['Item ID','Serial #','Description','Template','Connections','Body','Misc findings','Verdict','+'],
        its.map(i=>{ const tol = AI.toleranceCheck(i);
          const marg = tol.reduce((n,c)=>n+c.marginal.length,0);
          const bad = (i.misc||[]).filter(m=>m.c!=='OK').length;
          const src = i.tplId ? D.ttById(i.tplId) : null;
          return { __arg:i.id, cells:[
            `<b class="mono link">${i.itemId}</b>`, `<span class="mono">${esc(i.serial)}</span>`, esc(i.desc),
            src?pill(src.description,'acc'):'<span class="dim">—</span>',
            tol.length?tol.map(c=>c.verdict==='PASS'?pill(c.key.toUpperCase()+' pass','ok'):pill(c.key.toUpperCase()+' fail','bad')).join(' ')+(marg?' '+pill(marg+' marginal','marg'):''):'<span class="dim">—</span>',
            i.bodyStatus==='OK'?pill('OK','ok'):pill(i.bodyStatus,'bad'),
            bad?pill(bad+' flagged','marg'):'<span class="dim">clear</span>',
            statusPill(i.status),
            `<span class="rowact"><button class="btn sm" data-act="editItem" data-arg="${i.id}">Edit</button></span>`]};}), {click:'item'})
      : `<div class="center">No items on this inspection yet.<br/>Add the first tool to start recording measurements.
          <button class="btn pri" data-act="addItem" data-arg="${ins.no}">+ Add item</button></div>`}</div>`;

    if (t===5) { const used = [...new Set(its.map(i=>i.tplId).filter(Boolean))].map(id=>D.ttById(id)).filter(Boolean);
      const fmt = D.reportFormats.find(f=>f.id===ins.format) || {cols:[],name:''};
      body = `<div class="panel"><div class="panel-h"><h3>Report columns</h3>${U.help('reportFormat')}<div class="sp"></div>
        <span class="dim" style="font-size:11.5px">What the printed report shows for this job</span></div>
      ${table(['Column','Type','Comes from'], [
        ...fmt.cols.map(c=>({cells:[esc(c[0]), pill(c[1],'info'), 'Report format — '+esc(fmt.name)]})),
        ...used.reduce((a,t)=>a.concat(t.columns.map(c=>({cells:[esc(c.label),
          pill(c.type==='status'?'Status':'Measurement', c.type==='status'?'acc':'info'),
          'Tool template — '+esc(t.description)]}))),[])])}
      </div>`; }

    if (t===6||t===7) body = `<div class="panel"><div class="panel-h"><h3>${t===6?'Photos':'Documents'}</h3><div class="sp"></div>
      <button class="btn sm">Upload</button></div><div class="center">
      ${t===6?'Field photographs attach per item and print into the report.':'Customer specs, drawings and certificates attach to the job.'}</div></div>`;

    if (t===8) body = `<div class="panel"><div class="panel-h"><h3>Quality assurance closeout</h3>${U.help('qa')}</div><div class="panel-b">
      <div class="grid g3">${['Confirmed item polarity / demag','Customer shop / location clean up','Post tool / truck clean up','Tools & supply check','Tool ID check (rags / debris)','Trash removal','Customer farewell']
        .map(x=>`<span class="chk on"><i></i>${esc(x)}</span>`).join('')}</div></div></div>`;

    if (t===9) body = `<div class="panel"><div class="panel-h"><h3>Close out</h3>${U.help('closeOut')}<div class="sp"></div>
      <span class="dim" style="font-size:11.5px">Findings become billable lines here</span></div>
      ${canPrice ? table(['Serial #','Description','Type','+Qty','+Rate','+Amount','Verdict'],
        its.flatMap(i=>[
          ...(i.prices||[]).map(p=>({cells:[`<span class="mono">${esc(i.serial)}</span>`, esc(p.n), esc(p.t),
            p.q.toFixed(2), money(p.r), `<b>${money(p.q*p.r)}</b>`, statusPill(i.status)]})),
          ...(i.standard||[]).map(p=>({cells:[`<span class="mono">${esc(i.serial)}</span>`,
            esc(p.n)+' <span class="dim">(remedial)</span>', 'Standard rate', p.q.toFixed(2), money(p.r),
            `<b>${money(p.q*p.r)}</b>`, pill('From finding','marg')]}))
        ]))
        : `<div class="center">${ic('lock')} &nbsp; Rates and totals are hidden for the ${esc(S.role)} role.</div>`}
      ${canPrice?`<div class="panel-b" style="border-top:1px solid var(--line)"><div class="split">
        <span class="eyebrow">Inspection charges</span><b class="mono">${money(totals.items)}</b>
        <span class="eyebrow" style="margin-left:14px">Remedial from findings</span><b class="mono" style="color:var(--marg)">${money(totals.rem)}</b>
        <div class="sp" style="flex:1"></div><span class="eyebrow">Total</span>
        <b class="mono" style="font-size:17px">${money(totals.items+totals.rem)}</b></div></div>`:''}</div>`;

    if (t===10) body = `<div class="panel"><div class="panel-h"><h3>Billing authorization</h3>${U.help('billingAuth')}<div class="sp"></div>
      ${ins.invoice?pill('Invoiced','ok'):pill('Awaiting customer signature','warn')}</div>
      ${canPrice?table(['Item','+Qty','UOM','+Rate','+Amount'],
        (()=>{ const rec={}; its.forEach(i=>{ [...(i.prices||[]),...(i.standard||[])].forEach(p=>{
            const k=p.n+'|'+(p.u||'EACH'); rec[k]=rec[k]||{n:p.n,u:p.u||'EACH',q:0,r:p.r,a:0};
            rec[k].q+=p.q; rec[k].a+=p.q*p.r; });});
          return Object.values(rec).map(r=>({cells:[esc(r.n), r.q.toFixed(2), esc(r.u), money(r.r), `<b>${money(r.a)}</b>`]}));})())
        :`<div class="center">${ic('lock')} &nbsp; Hidden for the ${esc(S.role)} role.</div>`}</div>`;

    if (t===11) body = `<div class="panel"><div class="panel-h"><h3>Report actions</h3></div><div class="panel-b">
      <div class="grid g3">
        ${['Single PDF report','Combined report','Individual reports (zip)','Inspected items report','Equipment report','Specification report','JSA report','Billing authorization']
          .map(x=>`<div class="split" style="justify-content:space-between;border:1px solid var(--line);border-radius:var(--r2);padding:10px 12px">
            <span>${esc(x)}</span><span class="split"><button class="btn sm">Download</button>
            <button class="btn sm">Send</button></span></div>`).join('')}
      </div>
      </div></div>`;

    return { crumb:`Inspection ${ins.no}`, html:
      `<div class="split" style="margin-bottom:14px">
        <button class="btn sm" data-go="inspections">${ic('back')} Inspections</button>
        <div class="sp" style="flex:1"></div>
        ${ins.invoice
          ? `<button class="btn sm" data-go="invoice" data-arg="${ins.invoice}">${ic('invoice')} Invoice ${ins.invoice}</button>`
          : (canPrice ? `<button class="btn acc sm" data-act="createInvoice" data-arg="${ins.no}">${ic('invoice')} Create invoice</button>` : '')}
        <select class="ctl" style="width:auto;padding:5px 26px 5px 10px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em" data-setstatus="${ins.no}">
          ${['In Progress','Submitted','Approved','Invoice Pending','Invoiced'].map(x=>`<option ${ins.status===x?'selected':''}>${x}</option>`).join('')}
        </select>
        <button class="btn sm danger" data-act="deleteInspection" data-arg="${ins.no}">Delete</button>
      </div>` +
      head(`Inspection ${ins.no}`, `${esc(cust.name)}${loc.name!==cust.name?' — '+esc(loc.name):''} · ${esc(loc.city)}, ${esc(loc.state)} · ${esc(ins.methods.join(', '))} · ${esc(ins.spec.join(', '))}`,
        `<div class="split">${statusPill(ins.status)}${pill(D.empById(ins.lead).name+' — lead','mute')}</div>`) +
      `<div class="grid g4" style="margin-bottom:16px">
        ${kpi('Items', its.length,'','a')}
        ${kpi('Rejected', its.filter(i=>i.status==='REJECTED').length,'Driven by body & misc findings','b')}
        ${kpi('Marginal dimensions '+U.help('marginal'), its.reduce((n,i)=>n+AI.toleranceCheck(i).reduce((m,c)=>m+c.marginal.length,0),0),'Inside tolerance, near the limit','w')}
        ${canPrice?kpi('Job value', money(totals.items+totals.rem), money(totals.rem)+' from findings','g'):kpi('Compliance flags', flags.length,'','w')}
      </div>
      <div style="margin-bottom:16px">${aiPanel('Inspection Review', AI.inspectionNarrative(ins), flags)}</div>
      <div class="tabs">${TABS.map((n,i)=>`<button data-tab="${i}" class="${t===i?'on':''}">${esc(n)}${i===4?`<span class="n">${its.length}</span>`:''}</button>`).join('')}</div>
      ${body}` };
  };

  /* ============================================================ INSPECTED ITEMS */
  V.items = () => ({ crumb:'Inspected Items', html:
    head('Inspected Items', 'Every item ever inspected, with its measurements, findings and verdict. The asset register the new architecture is centred on.') +
    `<div class="panel">${table(
      ['Item ID','Serial #','Description','Inspection','Customer','Body','Verdict','Tolerance'],
      Object.values(D.items).map(i=>{
        const ins = D.inspections.find(x=>x.items.indexOf(i.id)>-1);
        const tol = AI.toleranceCheck(i);
        const marg = tol.reduce((n,c)=>n+c.marginal.length,0);
        const fail = tol.reduce((n,c)=>n+c.fails.length,0);
        return { __arg:i.id, cells:[
          `<b class="mono link">${i.itemId}</b>`, `<span class="mono">${esc(i.serial)}</span>`, esc(i.desc),
          ins?`<span class="mono">${ins.no}</span>`:'—', ins?esc(D.custById(ins.cust).name):'—',
          i.bodyStatus==='OK'?pill('OK','ok'):pill(i.bodyStatus,'bad'), statusPill(i.status),
          fail?pill(fail+' out of range','bad'):marg?pill(marg+' marginal','marg'):pill('Clear','ok')]};
      }), {click:'item'})}</div>` });

  /* ============================================================ ITEM DETAIL */
  V.item = (id) => {
    const it = D.items[id] || Object.values(D.items)[0];
    const ins = D.inspections.find(x=>x.items.indexOf(it.id)>-1);
    const flags = AI.itemFlags(it);
    const canPrice = D.roles[S.role].pricing;

    return { crumb:`Item ${it.itemId}`, html:
      `<div class="split" style="margin-bottom:14px">
        <button class="btn sm" data-go="items">${ic('back')} Inspected items</button>
        ${ins?`<button class="btn sm" data-go="inspection" data-arg="${ins.no}">Inspection ${ins.no}</button>`:''}
      </div>` +
      head(`Item ${it.itemId}`, `${esc(it.desc)} · serial ${esc(it.serial)}`,
        `<div class="split">${it.status==='OK'?pill('Accepted','ok'):pill('Rejected','bad')}
         <button class="btn" data-act="editItem" data-arg="${it.id}">Edit item</button></div>`) +
      `<div class="grid g4" style="margin-bottom:16px">
        ${kpi('Body status '+U.help('bodyStatus'), it.bodyStatus==='OK'?'OK':it.bodyStatus.split(' ')[0], it.bodyStatus==='OK'?'No body finding':esc(it.bodyStatus), it.bodyStatus==='OK'?'g':'b')}
        ${kpi('Connections '+U.help('connection'), AI.toleranceCheck(it).map(c=>c.verdict).join(' / ')||'—','Measured against the standard','a')}
        ${kpi('Misc findings', (it.misc||[]).filter(m=>m.c!=='OK').length, `${(it.misc||[]).length} recorded`,'w')}
        ${kpi('Verdict '+U.help('itemVerdict'), it.status, 'Worst-of body, connections and misc', it.status==='OK'?'g':'b')}
      </div>
      <div style="margin-bottom:16px">${aiPanel('Item Analysis', AI.itemNarrative(it), flags,
        'Fractional entries normalised to decimal and compared to the standard')}</div>
      <div class="grid g-2-1">
        <div class="stack">
          <div class="panel"><div class="panel-h"><h3>Dimensional analysis</h3>${U.help('tolerance')}<div class="sp"></div>
            <span class="dim" style="font-size:11.5px">Field entry is fractional — the engine normalises and compares</span></div>
            <div class="panel-b">${tolTable(it)}</div></div>
          ${(() => { const src = it.tplId ? D.ttById(it.tplId) : null;
            const cap = it.cols || {};
            if (!src || !Object.keys(cap).length) return '';
            const labels = src.columns.map(c => c.label);
            return `<div class="panel"><div class="panel-h"><h3>${esc(src.description)} — captured columns</h3>${U.help('toolColumns')}
              <div class="sp"></div>${pill(src.type,'mute')}</div>
              ${table([src.parts.length?'Part':'Item', ...labels], Object.keys(cap).map(r=>({cells:[
                `<b class="mono">${esc(r)}</b>`,
                ...labels.map(l => { const val = cap[r][l];
                  if (!val) return '<span class="dim">—</span>';
                  return /REJECT|DBR/i.test(val) ? pill(val,'bad') : (val === 'OK' ? pill('OK','ok') : `<span class="mono">${esc(val)}</span>`); })]})))}
            </div>`; })()}
          <div class="panel"><div class="panel-h"><h3>Misc items</h3>${U.help('miscItem')}</div>
            ${table(['Item','Method','Result'], (it.misc||[]).map(m=>({cells:[esc(m.n), esc(m.m),
              m.c==='OK'?pill('OK','ok'):pill(m.c,'bad')]})))}</div>
        </div>
        <div class="stack">
          <div class="panel"><div class="panel-h"><h3>Details</h3></div><div class="panel-b">
            <div class="fgrid" style="grid-template-columns:1fr">
              ${field('Serial #', `<span class="mono">${esc(it.serial)}</span>`)}
              ${field('Tool template', esc(it.tool))}
              ${field('Material', esc(it.material))}
              ${field('Methods', it.methods.map(m=>pill(m,'acc')).join(' '))}
              ${field('Tool length', it.len==='—'?'':`<span class="mono">${esc(it.len)}"</span>`)}
              ${field('Inspected by', ins?esc(D.empById(ins.lead).name):'')}
            </div></div></div>
          ${canPrice?`<div class="panel"><div class="panel-h"><h3>Charges</h3></div>
            ${table(['Line','+Qty','+Rate','+Amount'], [
              ...(it.prices||[]).map(p=>({cells:[esc(p.n)+' <span class="dim">('+esc(p.t)+')</span>', p.q.toFixed(2), money(p.r), `<b>${money(p.q*p.r)}</b>`]})),
              ...(it.standard||[]).map(p=>({cells:[esc(p.n)+' <span class="dim">(remedial)</span>', p.q.toFixed(2), money(p.r), `<b>${money(p.q*p.r)}</b>`]}))
            ])}</div>`:''}
        </div>
      </div>` };
  };

  /* ============================================================ TICKETS */
  V.tickets = () => ({ crumb:'Inspection Tickets', html:
    head('Inspection Tickets', 'Lightweight intake — raised by the customer through the portal or by ops — that becomes a full inspection.',
      `<button class="btn pri" data-act="newTicket">+ New ticket</button>`) +
    `<div class="panel">${table(['Ticket #','Customer','Site','Raised','Raised by','Items','Status','+'],
      D.tickets.map(t=>({cells:[`<b class="mono">${esc(t.no)}</b>`, esc(D.custById(t.cust).name),
        esc(D.locById(t.loc).loc.city), t.date,
        t.by==='Portal User'?pill('Customer portal','acc'):esc(t.by), t.items,
        t.status==='Open'?pill('Open','info'):pill('Converted','ok'),
        t.status==='Open'?`<span class="rowact"><button class="btn sm acc" data-act="convertTicket" data-arg="${esc(t.no)}">Convert</button></span>`:'']})))}</div>
` });

  window.VIEWS = V;
})();

/* Zion Platform — views, part 2: accounts, billing, comms, configuration, platform story. */
(function () {
  const D = window.ZD, AI = window.ZAI, U = window.UI, V = window.VIEWS, S = window.S;
  const { esc, money, pill, statusPill, ic } = U;

  const head = (t, sub, right) => `<div class="phead"><div><h1>${esc(t)}</h1>${sub?`<p>${sub}</p>`:''}</div>
    <div class="sp"></div>${right||''}</div>`;
  const kpi = (k,v,s,cls) => `<div class="kpi ${cls||''}"><div class="k">${esc(k)}</div><div class="v">${v}</div>${s?`<div class="s">${s}</div>`:''}</div>`;
  const field = (l,v,o)=>{o=o||{};const e=v===undefined||v===null||v===''||v==='—';
    return `<div class="f ${o.req?'req':''}"><label>${esc(l)}${o.help?U.help(o.help):''}</label><div class="val ${o.mono?'mono':''} ${e?'empty':''}">${e?'—':v}</div></div>`;};
  const table = (h, rows, o) => { o=o||{};
    if(!rows.length) return `<div class="center">Nothing to show here yet.</div>`;
    return `<div class="tw"><table class="t"><thead><tr>${h.map(x=>`<th class="${/^\+/.test(x)?'r':''}">${esc(x.replace(/^\+/,''))}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(r=>`<tr class="${o.click?'rowbtn':''}" ${o.click?`data-go="${o.click}" data-arg="${esc(r.__arg)}"`:''}>${
        r.cells.map((c,i)=>`<td class="${/^\+/.test(h[i]||'')?'r':''}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;};
  const aiPanel = (title, narrative, flags, tagline, open) =>
    U.aiPanel({ title, narrative, flags, tagline, open });

  /* ============================================================ ACCOUNTS */
  V.accounts = () => ({ crumb:'Customers & Sites', html:
    head('Customers & Sites','Customer, site and division — with the rules, price sheet and connection standards that drive every job for that account.',
      `<button class="btn pri" data-act="newCustomer">+ New customer</button>`) +
    `<div class="panel">${table(['Customer','Code','Industry','Sites','Terms','Inspections','Outstanding','Payment behaviour','+'],
      D.customers.map(c=>{
        const ins = D.inspections.filter(i=>i.cust===c.id).length;
        const out = D.invoices.filter(i=>i.cust===c.id&&i.status!=='Paid').reduce((s,i)=>s+i.total,0);
        const b = D.payBehaviour[c.id];
        return { __arg:c.id, cells:[`<b class="link">${esc(c.name)}</b>`, `<span class="mono dim">${esc(c.code)}</span>`,
          esc(c.industry), c.locations.length, esc(c.terms), ins,
          out?`<span class="mono">${money(out)}</span>`:'<span class="dim">—</span>',
          b.avgDays>90?pill(b.avgDays+'d avg','bad'):b.avgDays>45?pill(b.avgDays+'d avg','marg'):pill(b.avgDays+'d avg','ok'),
          `<span class="rowact"><button class="btn sm" data-act="editCustomer" data-arg="${c.id}">Edit</button></span>`]};
      }), {click:'account'})}</div>` });

  V.account = (id) => {
    const c = D.custById(id) || D.customers[0];
    const loc = c.locations[0];
    const ins = D.inspections.filter(i=>i.cust===c.id);
    const invs = D.invoices.filter(i=>i.cust===c.id);
    const b = D.payBehaviour[c.id];
    const canPrice = D.roles[S.role].pricing;
    const canContacts = D.roles[S.role].customerContacts;
    const t = S.tab;
    const TABS = ['Company Info','Sites & Locations','Tool Templates','Price Sheet','Business Rules','Connection Standards','Contacts','Job History'];
    let body='';

    if (t===0) body = `<div class="panel"><div class="panel-h"><h3>Company</h3></div><div class="panel-b">
      <div class="fgrid">
        ${field('Company name', esc(c.name), {req:1})}
        ${field('Client code', `<span class="mono">${esc(c.code)}</span>`)}
        ${field('Industry', esc(c.industry))}
        ${field('Payment terms', esc(c.terms))}
        ${field('Tax', c.tax+'%', {mono:1})}
        ${field('Sites', c.locations.length + ' · ' + c.locations.reduce((n,l)=>n+l.divisions.length,0) + ' divisions')}
        ${field('Accounts payable email', canContacts?`<span class="mono">ap@${esc(c.name.toLowerCase().replace(/[^a-z]/g,''))}.com</span>`:pill('Hidden for this role','mute'))}
        ${field('Average settlement', b.avgDays + ' days · ' + AI.pct(b.onTimePct) + ' on time')}
        ${field('Status', pill('Active','ok'))}
      </div></div></div>`;

    if (t===1) body = `<div class="panel"><div class="panel-h"><h3>Sites &amp; locations</h3><div class="sp"></div>
      <span class="dim" style="font-size:11.5px">${c.locations.length} site${c.locations.length===1?'':'s'} · customer → site → division</span>
      <button class="btn pri sm" data-act="addLocation" data-arg="${c.id}">+ Add site</button></div>
      ${table(['Site','Address','City / State','Territory','Divisions','Inspections','+'],
        c.locations.map(l=>({cells:[
          `<b>${esc(l.name)}</b>`,
          l.addr ? esc(l.addr) : '<span class="dim">—</span>',
          esc(l.city)+', '+esc(l.state),
          esc(l.territory),
          l.divisions.length ? `<span class="tagrow">${l.divisions.map(d=>pill(d,'mute')).join('')}</span>` : '<span class="dim">—</span>',
          D.inspections.filter(i=>i.loc===l.id).length,
          `<span class="rowact"><button class="btn sm" data-act="editLocation" data-arg="${c.id}" data-arg2="${l.id}">Edit</button></span>`]})))}
      </div>`;

    if (t===2) {
      const sub = S.tsub || 'tool';
      const tts = D.ttFor(c.id), ixs = D.ixFor(c.id);
      body = `<div class="split" style="margin-bottom:14px">
          <div class="roleswitch">
            <button data-tsub="tool" class="${sub==='tool'?'on':''}">Tool templates (${tts.length})</button>
            <button data-tsub="item" class="${sub==='item'?'on':''}">Item templates (${ixs.length})</button>
          </div>
          <div class="sp" style="flex:1"></div>
          ${sub==='tool'
            ? `<button class="btn" data-act="newTool" data-arg="${c.id}" data-arg2="Single">+ Single tool</button>
               <button class="btn pri" data-act="newTool" data-arg="${c.id}" data-arg2="Multiple">+ Multi tool</button>`
            : `<button class="btn pri" data-act="newItemTemplate" data-arg="${c.id}">+ Item template</button>`}
        </div>`;

      if (sub === 'tool') body += `<div class="panel"><div class="panel-h"><h3>Tool templates</h3>${U.help('toolTemplate')}
        <div class="sp"></div><span class="dim" style="font-size:11.5px">Defines what the entry form and the report show for this customer</span></div>
        ${tts.length ? table(['Tool description','Type','Size','Methods','Materials','Report format','Columns','Parts','Approved','+'],
          tts.map(x=>({cells:[
            `<b>${esc(x.description)}</b>${x.abbreviation?` <span class="dim mono">${esc(x.abbreviation)}</span>`:''}`,
            pill(x.type, x.type==='Multiple'?'info':'mute'),
            `<span class="mono">${esc(x.toolSize)}</span>`,
            `<span class="tagrow">${x.methods.map(m=>pill(m,'mute')).join('')}</span>`,
            esc(x.materials.join(', ')),
            esc(x.reportType),
            `<span class="mono">${x.columns.length}</span>`,
            x.parts.length?`<span class="mono">${x.parts.length}</span>`:'<span class="dim">—</span>',
            x.approved?pill('Approved','ok'):pill('Pending','warn'),
            `<span class="rowact"><button class="btn sm" data-act="editTool" data-arg="${x.id}">Edit</button></span>`]})))
        : `<div class="center">No tool templates for ${esc(c.name)} yet.<br/>A template defines the columns the inspection form and the printed report use.
            <button class="btn pri" data-act="newTool" data-arg="${c.id}" data-arg2="Multiple">+ Add the first one</button></div>`}
        </div>
        ${tts.length ? `<div class="grid g2" style="margin-top:14px">${tts.slice(0,2).map(x=>`
          <div class="panel"><div class="panel-h"><h3>${esc(x.description)} — column definition</h3><div class="sp"></div>
            ${pill(x.type,'mute')}</div>
            ${table(['#','Column','Type','Allowed values'], x.columns.map((col,i)=>({cells:[
              `<span class="mono dim">${i+1}</span>`, esc(col.label),
              pill(col.type==='status'?'Status':'Measurement', col.type==='status'?'acc':'info'),
              col.options?`<span class="tagrow">${col.options.map(o=>pill(o, o==='OK'?'ok':o==='REJECTED'?'bad':'mute')).join('')}</span>`:'<span class="dim">free text</span>']})))}
            ${x.parts.length?`<div class="panel-b" style="border-top:1px solid var(--line)">
              <div class="eyebrow" style="margin-bottom:8px">Parts (${x.parts.length})</div>
              <div class="tagrow">${x.parts.map(p=>pill(p.partNo+' · '+p.equipment,'mute')).join('')}</div></div>`:''}
          </div>`).join('')}</div>` : ''}`;

      if (sub === 'item') body += `<div class="panel"><div class="panel-h"><h3>Item templates</h3>${U.help('itemTemplate')}
        <div class="sp"></div><span class="dim" style="font-size:11.5px">Pre-fills an inspected item for tools this customer sends in repeatedly</span></div>
        ${ixs.length ? table(['Description','Prefix','Size','Methods','Material','Connection','Standard misc','+Rate','+'],
          ixs.map(x=>({cells:[
            `<b>${esc(x.description)}</b>`, `<span class="mono">${esc(x.prefix)}</span>`,
            `<span class="mono">${esc(x.size)}</span>`,
            `<span class="tagrow">${x.methods.map(m=>pill(m,'mute')).join('')}</span>`,
            esc(x.materials.join(', ')),
            `<span class="mono">${esc(x.connection)}</span>`,
            `<span class="tagrow">${(x.misc||[]).map(m=>pill(m,'mute')).join('')}</span>`,
            canPrice?money(x.rate):pill('Hidden','mute'),
            `<span class="rowact"><button class="btn sm" data-act="editItemTemplate" data-arg="${x.id}">Edit</button></span>`]})))
        : `<div class="center">No item templates for ${esc(c.name)} yet.
            <button class="btn pri" data-act="newItemTemplate" data-arg="${c.id}">+ Add the first one</button></div>`}
        </div>`;
    }

    if (t===3) body = canPrice ? `<div class="panel"><div class="panel-h"><h3>Standard pricing</h3>${U.help('priceSheet')}<div class="sp"></div>
      <span class="dim" style="font-size:11.5px">Rate keyed on material, method and unit of measure</span></div>
      ${table(['Item','Material','Method','UOM','+Rate','+Discount %','+Net','+Commission %'], [
        {cells:['Inspection — per tool','Steel','MPI / VT','PER TOOL',money(40),'0.00',money(40),'2.50']},
        {cells:['Inspection — per tool','Non Mag','LPI / VT','PER TOOL',money(130),'0.00',money(130),'2.50']},
        {cells:['API Reface','—','VT','PER CONNECTION',money(45),'0.00',money(45),'2.50']},
        {cells:['Hardbands','—','LPI','EACH',money(30),'0.00',money(30),'0.00']},
        {cells:['Flapper Wheel Connection','—','VT','PER CONNECTION',money(8),'0.00',money(8),'0.00']},
        {cells:['Inspector — per hour','—','—','PER HR',money(95),'0.00',money(95),'0.00']},
        {cells:['Mileage','—','—','MILEAGE',money(3),'0.00',money(3),'0.00']}])}
      </div>`
      : `<div class="panel"><div class="center">${ic('lock')} &nbsp; Price sheets are hidden for the ${esc(S.role)} role.</div></div>`;

    if (t===4) body = `<div class="panel"><div class="panel-h"><h3>Business rules for this account</h3>${U.help('rules')}<div class="sp"></div>
      <span class="dim" style="font-size:11.5px">Configured centrally — no code change</span></div><div class="panel-b">
      <div class="fgrid">
        ${field('Request PO on submit inspection', pill('Yes','acc'))}
        ${field('Request PO after creating invoice', pill('No','mute'))}
        ${field('PO request reminder','3 days after')}
        ${field('Send reports as','Combined report')}
        ${field('Send inspected items on submit', pill('Yes','acc'))}
        ${field('Reminder due date','7 days after')}
        ${field('Finance fee', pill('No','mute'))}
        ${field('Minimum callout', money(450), {mono:1})}
        ${field('Job safety template','General Standard Inspection JSA')}
      </div>
      <div class="sep"></div>
      <div class="eyebrow" style="margin-bottom:8px">Inspection table columns for this customer</div>
      <div class="tagrow">${['Operator','Job #','PO #','Rig','DT #','Lease / Well'].map((x,i)=>pill(x, i<3?'acc':'mute')).join(' ')}</div>
      <div class="sep"></div>
      <div class="eyebrow" style="margin-bottom:8px;display:flex;align-items:center;gap:5px">Report distribution ${U.help('distribution')}</div>
      ${table(['Address type','Receives'],[
        {cells:['Auto email — complete report','Every approved inspection report']},
        {cells:['Auto email — inspected items only','Item list without technique detail']},
        {cells:['Auto email — TH Hill / Cat 3-5 only','Category-restricted reports']},
        {cells:['Manager email','Escalations and rejections']},
        {cells:['Shop email','Day-to-day job traffic']},
        {cells:['Accounts payable','Invoices and statements']}])}
      </div></div>`;

    if (t===5) body = `<div class="panel"><div class="panel-h"><h3>Connection standards in use</h3><div class="sp"></div>
      <button class="btn sm" data-go="standards">Full library</button></div>
      ${table(['Connection','Reface type','Pin dimensions checked','Box dimensions checked'],
        D.connectionTypes.slice(0,4).map(ct=>({cells:[`<b class="mono">${esc(ct.name)}</b>`, esc(ct.reface),
          Object.keys(ct.ranges.pin||{}).length, Object.keys(ct.ranges.box||{}).length]})))}</div>`;

    if (t===6) body = `<div class="panel"><div class="panel-h"><h3>Contacts</h3></div>
        ${table(['Name','Job title','Contact','Receives'], [
          {cells:['Operations Contact','Yard Manager',
            canContacts?'<span class="mono">(432) 555-0148</span>':pill('Hidden for this role','mute'),'Shop email']},
          {cells:['Accounts Payable','AP Clerk',
            canContacts?`<span class="mono">ap@${esc(c.name.toLowerCase().replace(/[^a-z]/g,''))}.com</span>`:pill('Hidden for this role','mute'),'Invoices']}])}
      </div>`;
    if (t===7) body = `<div class="panel"><div class="panel-h"><h3>Job history</h3></div>
      ${table(['Inspection','Date','Items','Rejects','Status','Invoice'], ins.map(i=>{
        const its=i.items.map(x=>D.items[x]).filter(Boolean);
        return {__arg:i.no, cells:[`<b class="mono link">${i.no}</b>`, i.date, its.length,
          its.filter(x=>x.status==='REJECTED').length||'<span class="dim">0</span>', statusPill(i.status),
          i.invoice?`<span class="mono">${i.invoice}</span>`:'<span class="dim">—</span>']};
      }), {click:'inspection'})}</div>`;

    const flags = [];
    if (b.avgDays>90) flags.push({sev:'high',tag:'Credit',title:`${c.name} settles in ${b.avgDays} days on average`,
      detail:`Only ${AI.pct(b.onTimePct)} of their invoices are paid on time. ${money(D.invoices.filter(i=>i.cust===c.id&&i.status!=='Paid').reduce((s,i)=>s+i.total,0))} is currently outstanding.`,
      action:'Consider requiring PO up front and shortening terms at renewal.'});
    const noPo = ins.filter(i=>i.po==='—'&&i.status!=='Invoiced');
    if (noPo.length) flags.push({sev:'med',tag:'Commercial',title:`${noPo.length} inspection${noPo.length>1?'s':''} without a PO on an account that requires one`,
      detail:'Each will stall at billing until a PO is supplied.',action:'Chase it before the job reaches billing.'});
    let marg=0; ins.forEach(i=>i.items.map(x=>D.items[x]).filter(Boolean).forEach(it=>AI.toleranceCheck(it).forEach(cc=>marg+=cc.marginal.length)));
    if (marg) flags.push({sev:'low',tag:'Fleet',title:`${marg} dimensions across this fleet are near a reject limit`,
      detail:'These pass today and are the most likely rejections on the next run.',
      action:'Offer a planned reface programme rather than letting them fail in service.'});

    return { crumb:esc(c.name), html:
      `<div class="split" style="margin-bottom:14px"><button class="btn sm" data-go="accounts">${ic('back')} Customers</button></div>` +
      head(c.name, `${esc(loc.addr)}, ${esc(loc.city)}, ${esc(loc.state)} · ${esc(c.industry)} · terms ${esc(c.terms)}`,
        `<div class="split">${pill(c.code,'mute')}${pill('Active','ok')}
         <button class="btn" data-act="editCustomer" data-arg="${c.id}">Edit account</button></div>`) +
      `<div class="grid g4" style="margin-bottom:16px">
        ${kpi('Inspections', ins.length,'','a')}
        ${kpi('Outstanding', money(invs.filter(i=>i.status!=='Paid').reduce((s,i)=>s+i.total,0)),`${invs.length} invoices`,'b')}
        ${kpi('Avg settlement', b.avgDays+' days', AI.pct(b.onTimePct)+' paid on time', b.avgDays>90?'b':b.avgDays>45?'w':'g')}
        ${kpi('Sites', c.locations.length, c.locations.reduce((n,l)=>n+l.divisions.length,0)+' divisions','')}
      </div>
      <div style="margin-bottom:16px">${aiPanel('Account Review', null, flags)}</div>
      <div class="tabs">${TABS.map((n,i)=>`<button data-tab="${i}" class="${t===i?'on':''}">${esc(n)}</button>`).join('')}</div>
      ${body}` };
  };

  /* ============================================================ INVOICES */
  V.invoices = () => {
    const p = AI.portfolio();
    return { crumb:'Invoices', html:
      head('Invoices','Every invoice traced back to the inspection that produced it — and scored for how likely it is to be paid.') +
      `<div class="grid g4" style="margin-bottom:16px">
        ${kpi('Outstanding', money(p.outstanding),'Across all accounts','b')}
        ${kpi('Overdue', money(p.overdue), D.invoices.filter(i=>i.status==='Overdue').length+' invoices','b')}
        ${kpi('Never sent '+U.help('unsent'), money(p.unsent),'Raised but not delivered','w')}
        ${kpi('Collected', money(D.invoices.reduce((s,i)=>s+i.paid,0)),'This window','g')}
      </div>
      <div style="margin-bottom:16px">${aiPanel('Collections', null, AI.billingFlags(),
        'Scored on this account’s own settlement history')}</div>
      <div class="panel">${table(['Invoice','Inspection','Customer','Date','Due','PO','+Amount','Status','Risk'],
        D.invoices.map(i=>{ const r=AI.invoiceRisk(i);
          return {__arg:i.no, cells:[`<b class="mono link">${i.no}</b>`,
            `<span class="mono dim">${esc(i.insp)}</span>`, esc(D.custById(i.cust).name), i.date, i.due,
            i.po==='—'?pill('None','warn'):`<span class="mono">${esc(i.po)}</span>`,
            `<b>${money(i.total)}</b>`, statusPill(i.status),
            r.band==='settled'?pill('Settled','ok'):r.band==='high'?pill('High','bad'):r.band==='medium'?pill('Medium','marg'):pill('Low','ok')]};
        }), {click:'invoice'})}</div>` };
  };

  V.invoice = (no) => {
    const inv = D.invByNo(no) || D.invoices[0];
    const c = D.custById(inv.cust);
    const r = AI.invoiceRisk(inv);
    const ins = D.inspByNo(inv.insp);
    const its = ins ? ins.items.map(i=>D.items[i]).filter(Boolean) : [];
    const lines = [];
    its.forEach(i => { [...(i.prices||[]),...(i.standard||[])].forEach(p =>
      lines.push({ serial:i.serial, n:p.n, t:p.t||'Standard rate', q:p.q, r:p.r, u:p.u||'EACH' })); });
    const sub = lines.reduce((s,l)=>s+l.q*l.r,0), tax = sub*c.tax/100;

    const flags = [];
    if (inv.status==='Unsent') flags.push({sev:'high',tag:'Revenue',title:'This invoice has never been sent',
      detail:`Raised ${inv.date} for ${money(inv.total)} and still not in the customer's queue.`,action:'Send it today.'});
    if (r.overdue>0) flags.push({sev:r.overdue>60?'high':'med',tag:'Collection',
      title:`${r.overdue} days past due`, detail:r.reasons.join('. ')+'.',
      action:'Escalate with accounts payable and attach the signed billing authorisation.'});
    if (inv.po==='—') flags.push({sev:'med',tag:'Commercial',title:'No PO recorded',
      detail:'This account holds payment without a PO reference on the invoice.',action:'Request the PO before chasing payment.'});
    if (r.predicted>0) flags.push({sev:'low',tag:'Forecast',
      title:`Expected to settle in about ${r.predicted} more days`,
      detail:`Based on ${c.name}'s own history of ${r.behaviour.avgDays} days and ${AI.pct(r.behaviour.onTimePct)} on-time payment.`,
      action:'Plan cash on this date rather than the due date.'});

    return { crumb:`Invoice ${inv.no}`, html:
      `<div class="split" style="margin-bottom:14px"><button class="btn sm" data-go="invoices">${ic('back')} Invoices</button>
       ${ins?`<button class="btn sm" data-go="inspection" data-arg="${ins.no}">${ic('clipboard')} Inspection ${ins.no}</button>`:''}
       <div class="sp" style="flex:1"></div>
       ${inv.status==='Unsent'?`<button class="btn" data-act="sendInvoice" data-arg="${inv.no}">Mark as sent</button>`:''}
       <button class="btn">Download PDF</button>
       ${inv.status!=='Paid'?`<button class="btn pri" data-act="recordPayment" data-arg="${inv.no}">Record payment</button>`:pill('Settled','ok')}</div>` +
      head(`Invoice ${inv.no}`, `${esc(c.name)} · issued ${inv.date} · due ${inv.due}`,
        `<div class="split">${statusPill(inv.status)}</div>`) +
      `<div class="grid g4" style="margin-bottom:16px">
        ${kpi('Amount', money(inv.total),'', 'a')}
        ${kpi('Outstanding', money(inv.total-inv.paid), inv.paid?money(inv.paid)+' received':'Nothing received', inv.paid?'g':'b')}
        ${kpi('Age', r.age+' days', r.overdue?r.overdue+' days past due':'Within terms', r.overdue?'b':'')}
        ${kpi('Payment risk '+U.help('invoiceRisk'), r.band==='settled'?'Settled':r.score+'/100', r.band.toUpperCase(),
          r.band==='high'?'b':r.band==='medium'?'w':'g')}
      </div>
      <div style="margin-bottom:16px">${aiPanel('Payment Outlook', 
        `${c.name} settles in ${r.behaviour.avgDays} days on average and pays ${AI.pct(r.behaviour.onTimePct)} of invoices on time. This invoice is ${r.age} days old.`,
        flags, 'Scored on this account’s settlement history')}</div>
      <div class="grid g-2-1">
        <div class="panel"><div class="panel-h"><h3>Lines</h3><div class="sp"></div>
          <span class="dim" style="font-size:11.5px">Pulled from inspection ${esc(inv.insp)} close out</span></div>
          ${table(['Serial','Item','Type','+Qty','UOM','+Rate','+Amount'], lines.map(l=>({cells:[
            `<span class="mono">${esc(l.serial)}</span>`, esc(l.n), esc(l.t), l.q.toFixed(2), esc(l.u),
            money(l.r), `<b>${money(l.q*l.r)}</b>`]})))}
        </div>
        <div class="panel"><div class="panel-h"><h3>Summary</h3></div><div class="panel-b">
          <div class="fgrid" style="grid-template-columns:1fr">
            ${field('Invoice number', `<span class="mono">${esc(inv.no)}</span>`, {req:1})}
            ${field('PO number', inv.po==='—'?pill('Not supplied','warn'):`<span class="mono">${esc(inv.po)}</span>`)}
            ${field('Invoice date', inv.date, {mono:1, req:1})}
            ${field('Due date', inv.due, {mono:1, req:1})}
          </div>
          <div class="sep"></div>
          <div class="split" style="justify-content:space-between"><span class="muted">Subtotal</span><b class="mono">${money(sub||inv.total)}</b></div>
          <div class="split" style="justify-content:space-between;margin-top:6px"><span class="muted">Tax (${c.tax}%)</span><b class="mono">${money(tax|| inv.total*c.tax/100)}</b></div>
          <div class="split" style="justify-content:space-between;margin-top:10px;padding-top:10px;border-top:1px solid var(--line)">
            <span class="eyebrow">Total</span><b class="mono" style="font-size:19px">${money(inv.total)}</b></div>
        </div></div>
      </div>` };
  };

  /* ============================================================ REVENUE INTELLIGENCE */
  V.analytics = () => {
    const p = AI.portfolio();
    const rows = D.customers.map(c=>{
      const inv = D.invoices.filter(i=>i.cust===c.id);
      const out = inv.filter(i=>i.status!=='Paid').reduce((s,i)=>s+i.total,0);
      const b = D.payBehaviour[c.id];
      const risk = out * (b.avgDays>90?0.9:b.avgDays>45?0.5:0.15);
      return { c, inv, out, b, risk };
    }).sort((a,b)=>b.risk-a.risk);
    const atRisk = rows.reduce((s,r)=>s+r.risk,0);

    return { crumb:'Revenue Intelligence', html:
      head('Revenue Intelligence','Not a report of what happened — a read on what is likely to happen to the money.') +
      `<div class="grid g4" style="margin-bottom:16px">
        ${kpi('Invoiced', money(D.invoices.reduce((s,i)=>s+i.total,0)), D.invoices.length+' invoices','a')}
        ${kpi('Outstanding', money(p.outstanding),'','b')}
        ${kpi('Weighted at risk', money(atRisk),'Outstanding × account behaviour','b')}
        ${kpi('Never sent '+U.help('unsent'), money(p.unsent),'Fastest money available','w')}
      </div>
      <div style="margin-bottom:16px">${aiPanel('Portfolio Read',
        `${money(p.outstanding)} is outstanding. Weighting each balance by how that account actually pays puts ${money(atRisk)} genuinely at risk — concentrated in a small number of slow payers. ${money(p.unsent)} was raised and never sent, which is the fastest money in the building.`,
        AI.billingFlags().filter(f=>f.sev==='high'))}</div>
      <div class="grid g-2-1">
        <div class="panel"><div class="panel-h"><h3>Exposure by account</h3></div>
          ${table(['Customer','Invoices','+Outstanding','Avg settlement','On time','+Weighted risk','Band'],
            rows.filter(r=>r.out>0).map(r=>({cells:[esc(r.c.name), r.inv.length,
              `<b class="mono">${money(r.out)}</b>`, r.b.avgDays+' days', AI.pct(r.b.onTimePct),
              `<span class="mono">${money(r.risk)}</span>`,
              r.b.avgDays>90?pill('High','bad'):r.b.avgDays>45?pill('Medium','marg'):pill('Low','ok')]})))}
        </div>
        <div class="stack">
          <div class="panel"><div class="panel-h"><h3>Ageing</h3>${U.help('ageing')}</div><div class="panel-b">
            ${[['0–30 days',0.32],['31–60 days',0.21],['61–90 days',0.14],['90+ days',0.33]].map(([l,f])=>`
              <div style="margin-bottom:12px"><div class="split" style="justify-content:space-between;margin-bottom:5px">
                <span class="muted">${l}</span><b class="mono">${money(p.outstanding*f)}</b></div>
                <div class="progress"><i style="width:${f*100}%;background:${f>0.3?'var(--bad)':'var(--acc)'}"></i></div></div>`).join('')}
          </div></div>
          <div class="panel"><div class="panel-h"><h3>Where the money leaks</h3></div><div class="panel-b">
            <div class="note" style="border-left-color:var(--bad)"><b>Missing POs.</b> ${p.noPo.length} inspections are sitting without a PO on accounts that require one. Each is an invoice that cannot be raised until it arrives.</div>
            <div class="note" style="margin-top:10px"><b>Findings not billed.</b> Close-out lines are reconciled against the findings on each item, and any rejection carrying no remedial charge is flagged for review.</div>
          </div></div>
        </div>
      </div>` };
  };

  window.VIEWS = V;
})();

/* Zion Platform — views, part 3: comms, configuration, the platform story. */
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
  const aiPanel = (title, narrative, flags, tagline, open) =>
    U.aiPanel({ title, narrative, flags, tagline, open });

  /* ============================================================ STANDARDS */
  V.standards = () => {
    const sel = D.connectionTypes.find(c=>c.id===(S.arg||'')) || D.connectionTypes[0];
    const rowsFor = (side) => {
      const keys = side==='pin'?D.PIN:D.BOX, r = sel.ranges[side]||{};
      return keys.map(k=>({cells:[ esc(D.LABEL[k]),
        r[k]?`<span class="mono">${r[k][0].toFixed(3)}"</span>`:'<span class="dim">—</span>',
        r[k]?`<span class="mono">${r[k][1].toFixed(3)}"</span>`:'<span class="dim">—</span>',
        r[k]?`<span class="mono dim">${(r[k][1]-r[k][0]).toFixed(3)}"</span>`:'<span class="dim">—</span>',
        r[k]?pill('Checked','acc'):pill('Not checked','mute')]}));
    };
    return { crumb:'Connection Standards', html:
      head('Connection Standards','The tolerance library. Every pass or fail in the platform resolves to a number in one of these tables.',
        `<button class="btn pri" data-act="newStandard">+ New standard</button>`) +
      `<div class="grid g-1-2">
        <div class="panel"><div class="panel-h"><h3>Library</h3>${U.help('connStd')}<div class="sp"></div>
          <span class="dim" style="font-size:11.5px">${D.connectionTypes.length} connections</span></div>
          <div class="panel-b" style="padding:0">
          ${D.connectionTypes.map(ct=>{
            const np = Object.keys(ct.ranges.pin||{}).length, nb = Object.keys(ct.ranges.box||{}).length;
            const used = Object.values(D.items).filter(i=>(i.conns||[]).some(c=>c.type===ct.name)).length;
            return `<div class="titem ${ct.id===sel.id?'on':''}" data-go="standards" data-arg="${ct.id}">
              <div class="s"><span class="mono">${esc(ct.name)}</span><span class="sp"></span>
                ${used?pill(used+' item'+(used>1?'s':''),'mute'):''}</div>
              <div class="m"><b>${np}</b> pin <span class="sep">·</span> <b>${nb}</b> box dimensions</div>
              <div class="m dim">${esc(ct.reface)}</div>
            </div>`;}).join('')}</div></div>
        <div class="stack">
          <div style="margin-bottom:0">${aiPanel('Standards',
            `Field measurements arrive as fractional imperial values such as 7 9/16". The engine normalises them to decimal, compares against the range below, and reports how much of the tolerance band is left — so a dimension that passes today but is close to the limit is visible before it fails in service.`,
            [{sev:'low',tag:'Coverage',title:`${D.connectionTypes.reduce((n,c)=>n+Object.keys(c.ranges.pin||{}).length+Object.keys(c.ranges.box||{}).length,0)} dimensions defined across the library`,
              detail:'Dimensions left blank on a connection are not checked at all — a silent gap in the legacy system.',
              action:'Review blanks before go-live so nothing goes unchecked by accident.'}], 'Fraction-to-decimal normalisation')}</div>
          <div class="panel"><div class="panel-h"><h3>${esc(sel.name)} — pin</h3><div class="sp"></div>${pill(sel.reface,'mute')}
            <button class="btn sm" data-act="editStandard" data-arg="${sel.id}">Edit ranges</button></div>
            ${table(['Dimension','+Min','+Max','+Band','Status'], rowsFor('pin'))}</div>
          <div class="panel"><div class="panel-h"><h3>${esc(sel.name)} — box</h3></div>
            ${table(['Dimension','+Min','+Max','+Band','Status'], rowsFor('box'))}</div>
        </div>
      </div>` };
  };

  /* ============================================================ JOB SAFETY ANALYSIS */
  V.jsa = () => {
    const sel = D.jsaTemplates.find(t => t.id === (S.arg || '')) || D.jsaTemplates[0];
    const used = D.inspections.filter(i => i.jsa === sel.id).length;
    return { crumb:'Job Safety Analysis', html:
      head('Job Safety Analysis','The hazard assessments crews work to. Each inspection selects one and the crew signs it before work starts.',
        `<button class="btn pri" data-act="newJsa">+ New JSA</button>`) +
      `<div class="grid g-1-2">
        <div class="panel"><div class="panel-h"><h3>Templates</h3>${U.help('jsa')}<div class="sp"></div>
          <span class="dim" style="font-size:11.5px">${D.jsaTemplates.length}</span></div>
          <div class="panel-b" style="padding:0">
          ${D.jsaTemplates.map(t=>{
            const n = D.inspections.filter(i=>i.jsa===t.id).length;
            return `<div class="titem ${t.id===sel.id?'on':''}" data-go="jsa" data-arg="${t.id}">
              <div class="s">${esc(t.name)}<span class="sp"></span>
                ${n?pill(n+' in use','mute'):''}</div>
              <div class="m"><b>${t.steps.length}</b> steps <span class="sep">·</span> <b>${t.equipment.length}</b> PPE items</div>
              <div class="m dim">${t.cust?esc(D.custById(t.cust).name):'All customers'}</div>
            </div>`;}).join('')}
          </div></div>

        <div class="stack">
          <div class="panel"><div class="panel-h"><h3>${esc(sel.name)}</h3><div class="sp"></div>
            ${sel.cust?pill(D.custById(sel.cust).name,'acc'):pill('All customers','mute')}
            ${used?pill(used+' in use','info'):''}
            <button class="btn sm" data-act="editJsa" data-arg="${sel.id}">Edit</button></div>
            ${table(['#','Sequence of basic steps','Potential hazards','Controls'],
              sel.steps.map((x,i)=>({cells:[`<span class="mono dim">${i+1}</span>`, `<b>${esc(x.step)}</b>`,
                esc(x.hazard), `<span class="muted">${esc(x.control)}</span>`]})))}
          </div>
          <div class="panel"><div class="panel-h"><h3>Required equipment</h3><div class="sp"></div>
            <span class="dim" style="font-size:11.5px">${sel.equipment.length} of ${D.ppe.length}</span></div>
            <div class="panel-b"><div class="grid g3">
              ${D.ppe.map(e=>`<span class="chk ${sel.equipment.indexOf(e)>-1?'on':''}"><i></i>${esc(e)}</span>`).join('')}
            </div>
            ${sel.notes?`<div class="sep"></div><div class="note">${esc(sel.notes)}</div>`:''}
            </div></div>
        </div>
      </div>` };
  };

  /* ============================================================ REPORT FORMATS */
  V.formats = () => ({ crumb:'Report Formats', html:
    head('Report Formats','Each format is an ordered list of columns, typed as Connection, Body or Tool Status.',
      `<button class="btn pri" data-act="newFormat">+ New format</button>`) +
    `<div style="margin-bottom:16px">${aiPanel('Format Analysis',
      'Every legacy report format resolves to an ordered list of columns, each typed as Connection, Body or Tool Status. Nothing else varies. That is why the reporting backlog never closed — each new customer meant a new format instead of a new configuration.',
      [{sev:'low',tag:'Simplification',title:'38 formats collapse to one configurable engine',
        detail:'Adding a customer becomes a data entry task rather than a development task.',
        action:'Migrate each legacy format as configuration during import.'}], 'Structural analysis of the legacy formats')}</div>
    <div class="grid g2">${D.reportFormats.map(f=>`
      <div class="panel"><div class="panel-h"><h3>${esc(f.name)}</h3><div class="sp"></div>${pill(f.cols.length+' columns','mute')}
        <button class="btn sm danger" data-act="deleteFormat" data-arg="${f.id}">Delete</button></div>
        ${table(['#','Column','Type'], f.cols.map((c,i)=>({cells:[`<span class="mono dim">${i+1}</span>`, esc(c[0]),
          pill(c[1], c[1]==='Connection'?'acc':c[1]==='Body'?'info':'marg')]})))}</div>`).join('')}</div>` });

  /* ============================================================ MASTER DATA */
  V.master = () => ({ crumb:'Master Data', html:
    head('Master Data','The lists that populate every dropdown in the platform.') +
    `<div class="grid g3">${Object.entries(D.master).map(([k,v])=>`
      <div class="panel"><div class="panel-h"><h3>${esc(k.replace(/_/g,' '))}</h3><div class="sp"></div>${pill(v.length,'mute')}
        <button class="btn sm" data-act="addMaster" data-arg="${k}">+ Add</button></div>
        <div class="panel-b"><div class="tagrow">${v.map(x=>`<span class="pill p-mute" style="cursor:pointer" data-act="removeMaster" data-arg="${esc(k)}" data-arg2="${esc(x)}" title="Remove">${esc(x)} &times;</span>`).join(' ')}</div></div></div>`).join('')}</div>` });

  /* ============================================================ ROLES & ACCESS */
  V.access = () => {
    const mods = [['Dashboard','dashboard'],['Inspections','inspections'],['Inspected items','items'],
      ['Customers & sites','accounts'],['Invoices & pricing','invoices'],['Comms hub','comms'],['Crew dispatch','dispatch']];
    return { crumb:'Roles & Access', html:
      head('Roles & Access','One platform, four experiences. Access is what makes a unified system feel small to the person using it.') +
      `<div class="panel"><div class="panel-h"><h3>Module access by role</h3>${U.help('access')}</div>
        ${table(['Module', ...Object.keys(D.roles)], mods.map(([n,k])=>({cells:[`<b>${esc(n)}</b>`,
          ...Object.keys(D.roles).map(r=>{
            const R = D.roles[r];
            const ok = k==='dispatch' ? (R.dispatch===true?'Full':R.dispatch==='read'?'Read only':false)
                     : (R.modules==='all' ? 'Full' : R.modules.indexOf(k)>-1 ? 'Full' : false);
            return ok ? pill(ok, ok==='Read only'?'info':'ok') : pill('No access','mute');
          })]})))}
      </div>
      <div class="grid g2" style="margin-top:14px">
        <div class="panel"><div class="panel-h"><h3>Data-level permissions</h3></div>
          ${table(['Capability', ...Object.keys(D.roles)], [
            {cells:['<b>See customer contact details</b>', ...Object.keys(D.roles).map(r=>D.roles[r].customerContacts?pill('Yes','ok'):pill('Masked','marg'))]},
            {cells:['<b>See rates, margin and price sheets</b>', ...Object.keys(D.roles).map(r=>D.roles[r].pricing?pill('Yes','ok'):pill('Hidden','mute'))]},
            {cells:['<b>Dispatch and crew management</b>', ...Object.keys(D.roles).map(r=>D.roles[r].dispatch===true?pill('Full','ok'):D.roles[r].dispatch==='read'?pill('Read only','info'):pill('No','mute'))]}])}
        </div>
        <div class="panel"><div class="panel-h"><h3>Roles</h3></div><div class="panel-b">
          ${Object.entries(D.roles).map(([r,R])=>`<div style="padding:10px 0;border-top:1px solid var(--line)">
            <div class="split"><b style="font-family:var(--disp);letter-spacing:.05em;text-transform:uppercase">${esc(r)}</b>
              ${S.role===r?pill('Currently viewing','acc'):''}</div>
            <div class="dim" style="font-size:12px;margin-top:4px;line-height:1.55">${esc(R.note)}</div></div>`).join('')}
        </div></div>
      </div>` };
  };

  V.wire = function () {
    document.querySelectorAll('[data-act]').forEach(el => el.onclick = e => {
      e.stopPropagation();
      const fn = window.ACT[el.dataset.act];
      if (fn) fn(el.dataset.arg, el.dataset.arg2);
    });
    document.querySelectorAll('[data-setstatus]').forEach(el => el.onchange = () => {
      window.ACT.setStatus(el.dataset.setstatus, el.value);
    });
    document.querySelectorAll('[data-setjsa]').forEach(el => el.onchange = () => {
      window.ACT.setJsa(el.dataset.setjsa, el.value);
    });
  };

  window.VIEWS = V;
})();

/* ============================================================================
   ACTIONS — everything the user can actually do. Each one mutates the live
   store, persists it and re-renders, so created records behave like real ones.
   ============================================================================ */
(function () {
  const D = window.ZD, AI = window.ZAI, U = window.UI, S = window.S, DB = window.DB;
  const A = {};

  const locOptions = () => D.customers.flatMap(c => c.locations.map(l => ({
    v: c.id + '|' + l.id, l: c.name + (l.name !== c.name ? ' — ' + l.name : '') + '  (' + l.city + ', ' + l.state + ')' })));
  const empOptions = re => D.employees.filter(e => !re || re.test(e.role)).map(e => ({ v:e.id, l:e.name + ' — ' + e.role }));
  const ctNames = () => D.connectionTypes.map(c => c.name);
  const toolNames = () => D.reportFormats.map(f => f.name);

  /* ---------------- CUSTOMERS ---------------- */
  A.newCustomer = () => U.openForm({
    title:'New customer', subtitle:'Creates the account and its first location.', wide:true,
    submitLabel:'Create customer',
    sections:[
      { label:'Company', cols:3, fields:[
        { k:'name', label:'Company name', required:true, placeholder:'Pioneer Drilling', help:'newCustomer', width:2 },
        { k:'industry', label:'Industry', placeholder:'Downhole Tools' },
        { k:'terms', label:'Payment terms', type:'select', options:['Net 15','Net 30','Net 45','Net 60'] },
        { k:'tax', label:'Tax %', type:'number', step:'0.01', placeholder:'8.25', mono:true },
        { k:'avgDays', label:'Expected settlement (days)', type:'number', placeholder:'45', mono:true,
          hint:'Used by the payment-risk model' } ] },
      { label:'First location', cols:3, fields:[
        { k:'locName', label:'Location name', placeholder:'Leave blank to use company name', width:2 },
        { k:'territory', label:'Territory', type:'select', options:['United States','Guam','American Samoa'] },
        { k:'addr', label:'Street address', placeholder:'3718 N County Road 1148', width:2 },
        { k:'city', label:'City', required:true, placeholder:'Midland' },
        { k:'state', label:'State', required:true, placeholder:'TX' },
        { k:'divisions', label:'Divisions', placeholder:'Shop, North Yard', width:2,
          hint:'Comma separated' } ] } ],
    onSubmit(v) {
      const id = DB.nextCustomerId();
      D.customers.unshift({ id, code: DB.code(v.name), name: v.name,
        industry: v.industry || 'Oilfield Services', terms: v.terms || 'Net 30',
        tax: parseFloat(v.tax) || 8.25,
        locations:[{ id: DB.nextLocationId(), name: v.locName || v.name, city: v.city,
          state: v.state.toUpperCase(), addr: v.addr || '', territory: v.territory || 'United States',
          divisions: (v.divisions || 'Main').split(',').map(x => x.trim()).filter(Boolean) }] });
      D.payBehaviour[id] = { avgDays: parseInt(v.avgDays,10) || 45, onTimePct: 60 };
      U.commit('Customer <b>' + U.esc(v.name) + '</b> created');
      U.go('account', id);
    } });

  A.editCustomer = (id) => {
    const c = D.custById(id); if (!c) return; const l = c.locations[0];
    U.openForm({ title:'Edit ' + c.name, wide:true, submitLabel:'Save changes',
      values:{ name:c.name, industry:c.industry, terms:c.terms, tax:c.tax, locName:l.name,
        addr:l.addr, city:l.city, state:l.state, territory:l.territory, divisions:l.divisions.join(', '),
        avgDays:(D.payBehaviour[c.id]||{}).avgDays },
      sections:[
        { label:'Company', cols:3, fields:[
          { k:'name', label:'Company name', required:true, width:2 },
          { k:'industry', label:'Industry' },
          { k:'terms', label:'Payment terms', type:'select', options:['Net 15','Net 30','Net 45','Net 60'] },
          { k:'tax', label:'Tax %', type:'number', step:'0.01', mono:true },
          { k:'avgDays', label:'Expected settlement (days)', type:'number', mono:true } ] },
        { label:'Primary location', cols:3, fields:[
          { k:'locName', label:'Location name', width:2 },
          { k:'territory', label:'Territory', type:'select', options:['United States','Guam','American Samoa'] },
          { k:'addr', label:'Street address', width:2 },
          { k:'city', label:'City', required:true },
          { k:'state', label:'State', required:true },
          { k:'divisions', label:'Divisions', width:2, hint:'Comma separated' } ] } ],
      danger:{ label:'Delete customer', run:() => A.deleteCustomer(c.id) },
      onSubmit(v) {
        Object.assign(c, { name:v.name, industry:v.industry, terms:v.terms, tax:parseFloat(v.tax)||8.25 });
        Object.assign(l, { name:v.locName || v.name, addr:v.addr, city:v.city,
          state:v.state.toUpperCase(), territory:v.territory,
          divisions:(v.divisions||'Main').split(',').map(x=>x.trim()).filter(Boolean) });
        D.payBehaviour[c.id] = D.payBehaviour[c.id] || { onTimePct:60 };
        D.payBehaviour[c.id].avgDays = parseInt(v.avgDays,10) || 45;
        U.commit('Customer updated');
      } });
  };

  A.deleteCustomer = (id) => {
    const c = D.custById(id); if (!c) return;
    const jobs = D.inspections.filter(i => i.cust === id).length;
    U.confirmAction('Delete ' + c.name + '?',
      jobs ? `This account has ${jobs} inspection${jobs>1?'s':''} against it. They will be removed too.`
           : 'This removes the account and its locations.',
      'Delete', () => {
        D.inspections.filter(i => i.cust === id).forEach(i => i.items.forEach(k => delete D.items[k]));
        [...D.inspections].forEach(i => { if (i.cust === id) D.inspections.splice(D.inspections.indexOf(i),1); });
        [...D.invoices].forEach(i => { if (i.cust === id) D.invoices.splice(D.invoices.indexOf(i),1); });
        D.customers.splice(D.customers.indexOf(c), 1);
        U.commit('Customer deleted'); U.go('accounts');
      });
  };




  /* ---------------- JOB SAFETY ANALYSIS ---------------- */
  function jsaForm(existing) {
    U.openForm({
      title: existing ? 'Edit ' + existing.name : 'New job safety analysis',
      subtitle:'Steps, the hazard at each one, and the control that removes it.',
      wide:true, submitLabel: existing ? 'Save JSA' : 'Create JSA',
      values: existing ? { name:existing.name, cust:existing.cust || '', notes:existing.notes,
        equipment: existing.equipment.slice(),
        steps: existing.steps.map(x => [x.step, x.hazard, x.control].join(' | ')).join('\n') }
        : { equipment:['Hard Hat','Safety Boots','Safety Glasses','Gloves'],
            steps:'Site entry and orientation | Unfamiliar site, live operations | Report to company man and attend the site briefing.' },
      sections:[
        { cols:2, fields:[
          { k:'name', label:'JSA name', required:true, placeholder:'Rig Site Inspection', help:'jsa' },
          { k:'cust', label:'Customer specific', type:'select', placeholder:'All customers',
            options: D.customers.map(c => ({ v:c.id, l:c.name })) } ] },
        { label:'Steps', cols:1, fields:[
          { k:'steps', label:'Sequence, hazard, control', type:'textarea', required:true, help:'jsaSteps',
            hint:'One step per line — the step, the hazard, then the control, separated by pipes.' } ] },
        { label:'Required equipment', cols:1, fields:[
          { k:'equipment', label:'PPE', type:'multi', options: D.ppe } ] },
        { cols:1, fields:[ { k:'notes', label:'Noteworthy conditions / notes', type:'textarea', placeholder:'Optional' } ] } ],
      danger: existing ? { label:'Delete JSA', run:() => {
        const used = D.inspections.filter(i => i.jsa === existing.id);
        used.forEach(i => i.jsa = null);
        D.jsaTemplates.splice(D.jsaTemplates.indexOf(existing), 1);
        U.commit('JSA deleted' + (used.length ? ' — detached from ' + used.length + ' inspection' + (used.length>1?'s':'') : ''));
        U.go('jsa'); } } : null,
      onSubmit(v) {
        const steps = v.steps.split('\n').map(l => l.trim()).filter(Boolean).map(l => {
          const p = l.split('|').map(x => x.trim());
          return { step:p[0], hazard:p[1] || '', control:p[2] || '' }; });
        if (!steps.length) { U.toast('Add at least one step', 'bad'); return false; }
        const rec = existing || { id:'JSA-' + String(D.jsaTemplates.length + 1).padStart(2,'0') };
        Object.assign(rec, { name:v.name, cust:v.cust || null, status:'Active',
          steps, equipment:v.equipment || [], notes:v.notes || '' });
        if (!existing) D.jsaTemplates.push(rec);
        U.commit('JSA <b>' + U.esc(v.name) + '</b> saved — ' + steps.length + ' steps');
        U.go('jsa', rec.id);
      } });
  }
  A.newJsa  = () => jsaForm(null);
  A.editJsa = (id) => { const t = D.jsaById(id); if (t) jsaForm(t); };
  A.setJsa  = (no, id) => {
    const ins = D.inspByNo(no); if (!ins) return;
    ins.jsa = id || null;
    U.commit(id ? 'JSA set to <b>' + U.esc(D.jsaById(id).name) + '</b>' : 'JSA cleared');
  };

  /* ---------------- TOOL + ITEM TEMPLATES ---------------- */
  function toolForm(cust, type, existing) {
    const vals = existing
      ? Object.assign({}, existing, {
          miscItems: existing.miscItems || [],
          columns: (existing.columns||[]).map(c => c.label + (c.type==='status' ? ' | ' + (c.options||[]).join('/') : '')).join('\n'),
          parts: (existing.parts||[]).map(p => [p.partNo, p.equipment, p.material].join(' | ')).join('\n') })
      : { type, materials:['Steel'], methods:[], miscItems:[], status:'Active',
          columns: type==='Multiple' ? 'Seal\nSeal Status | OK/REJECTED/DBR' : 'Body Wall\nHardbanding | OK/REJECTED/N-A',
          parts: type==='Multiple' ? 'P-1 | Assembly | Steel\nP-2 | Assembly | Steel' : '' };
    const isMulti = (existing ? existing.type : type) === 'Multiple';

    U.openForm({
      title: existing ? 'Edit ' + existing.description : 'New ' + (isMulti ? 'multi' : 'single') + ' tool template',
      subtitle:'Defines what the inspection form captures and what the report prints for ' + cust.name + '.',
      wide:true, submitLabel: existing ? 'Save template' : 'Create template', values: vals,
      sections:[
        { label:'Identity', cols:3, fields:[
          { k:'description', label:'Tool description', required:true, placeholder:'Demay Pump', width:2, help:'toolTemplate' },
          { k:'abbreviation', label:'Abbreviation', mono:true, placeholder:'DMP' },
          { k:'serialPrefix', label:'Serial prefix', mono:true, placeholder:'DP' },
          { k:'toolSize', label:'Tool size', mono:true, placeholder:'4 1/2"' },
          { k:'modelType', label:'Model type', placeholder:'—' } ] },
        { label:'Inspection', cols:2, fields:[
          { k:'methods', label:'Methods', type:'multi', required:true, options: D.master.method },
          { k:'materials', label:'Materials', type:'multi', required:true, options: D.master.material },
          { k:'reportType', label:'Report format', type:'select', required:true, options: toolNames(), help:'reportFormat' },
          { k:'miscItems', label:'Default misc items', type:'multi', options: D.master.misc },
          { k:'weldReport', label:'Weld report', type:'checkbox', onLabel:'Include weld report' },
          { k:'approved', label:'Customer approval', type:'checkbox', onLabel:'Approved by customer' } ] },
        { label:'Column definition — what gets captured and printed', cols:1, fields:[
          { k:'columns', label:'Columns', type:'textarea', required:true, help:'toolColumns',
            hint:'One per line. Add “| A/B/C” to make it a status column with those options; otherwise it is a free measurement field.' } ] },
        isMulti ? { label:'Parts', cols:1, fields:[
          { k:'parts', label:'Parts list', type:'textarea', help:'toolParts',
            hint:'One per line — part number, equipment, material, separated by pipes. Every part is captured against every column above.' } ] }
          : { fields:[] },
        { cols:1, fields:[ { k:'comment', label:'Comment', type:'textarea', placeholder:'Optional' } ] } ],
      danger: existing ? { label:'Delete template', run:() => {
        D.toolTemplates.splice(D.toolTemplates.indexOf(existing), 1); U.commit('Tool template deleted'); } } : null,
      onSubmit(v) {
        const columns = v.columns.split('\n').map(l => l.trim()).filter(Boolean).map(l => {
          const [label, opts] = l.split('|').map(x => x.trim());
          return opts ? { label, type:'status', options: opts.split('/').map(o=>o.trim().replace(/-/g,'/')) }
                      : { label, type:'text' }; });
        const parts = (v.parts||'').split('\n').map(l => l.trim()).filter(Boolean).map(l => {
          const p = l.split('|').map(x => x.trim());
          return { partNo:p[0], equipment:p[1] || v.description, material:p[2] || 'Steel' }; });
        const rec = existing || { id: 'TT-' + (D.toolTemplates.length + 1), cust: cust.id };
        Object.assign(rec, { description:v.description, abbreviation:v.abbreviation, type: isMulti?'Multiple':'Single',
          toolSize:v.toolSize || 'N/A', modelType:v.modelType || '—', serialPrefix:v.serialPrefix || '',
          methods:v.methods, materials:v.materials, reportType:v.reportType, miscItems:v.miscItems || [],
          weldReport:!!v.weldReport, approved:!!v.approved, status:'Active', comment:v.comment || '',
          columns, parts: isMulti ? parts : [] });
        if (!existing) D.toolTemplates.push(rec);
        U.commit('Tool template <b>' + U.esc(v.description) + '</b> saved — ' + columns.length + ' columns'
          + (parts.length ? ', ' + parts.length + ' parts' : ''));
      } });
  }
  A.newTool  = (custId, type) => { const c = D.custById(custId); if (c) toolForm(c, type || 'Single', null); };
  A.editTool = (id) => { const t = D.ttById(id); const c = t && D.custById(t.cust); if (t) toolForm(c, t.type, t); };

  function itemTemplateForm(cust, existing) {
    U.openForm({
      title: existing ? 'Edit ' + existing.description : 'New item template',
      subtitle:'Pre-fills an inspected item for tools ' + cust.name + ' sends in repeatedly.',
      wide:true, submitLabel: existing ? 'Save template' : 'Create template',
      values: existing || { materials:['Steel'], methods:[], misc:[] },
      sections:[{ cols:3, fields:[
        { k:'description', label:'Description', required:true, placeholder:'Steel Pup Joint 4 1/2', width:2, help:'itemTemplate' },
        { k:'prefix', label:'Serial prefix', mono:true, placeholder:'APJ' },
        { k:'size', label:'Size', mono:true, placeholder:'4 1/2"' },
        { k:'connection', label:'Connection standard', type:'select', placeholder:'None', options: ctNames(), help:'connStd' },
        { k:'rate', label:'Inspection rate ($)', type:'number', mono:true, placeholder:'105' },
        { k:'methods', label:'Methods', type:'multi', required:true, options: D.master.method, width:2 },
        { k:'materials', label:'Materials', type:'multi', required:true, options: D.master.material },
        { k:'misc', label:'Standard misc items', type:'multi', options: D.master.misc, width:3 } ]}],
      danger: existing ? { label:'Delete template', run:() => {
        D.itemTemplates.splice(D.itemTemplates.indexOf(existing), 1); U.commit('Item template deleted'); } } : null,
      onSubmit(v) {
        const rec = existing || { id:'IX-' + (D.itemTemplates.length + 1), cust: cust.id };
        Object.assign(rec, { description:v.description, prefix:v.prefix || '', size:v.size || '—',
          methods:v.methods, materials:v.materials, connection:v.connection || '',
          misc:v.misc || [], rate: parseFloat(v.rate) || 0, status:'Active' });
        if (!existing) D.itemTemplates.push(rec);
        U.commit('Item template <b>' + U.esc(v.description) + '</b> saved');
      } });
  }
  A.newItemTemplate  = (custId) => { const c = D.custById(custId); if (c) itemTemplateForm(c, null); };
  A.editItemTemplate = (id) => { const t = D.itemTemplates.find(x => x.id === id);
    const c = t && D.custById(t.cust); if (t) itemTemplateForm(c, t); };

  /* pick a template, then open the item form pre-filled from it */
  A.addItem = (no) => {
    const ins = D.inspByNo(no); if (!ins) return;
    const tts = D.ttFor(ins.cust), ixs = D.ixFor(ins.cust);
    if (!tts.length && !ixs.length) { itemForm(ins, null, null); return; }
    U.openForm({
      title:'Add item to inspection ' + no,
      subtitle:'Start from one of this customer’s templates, or enter the item from scratch.',
      submitLabel:'Continue',
      values:{ tpl:'' },
      sections:[{ cols:1, fields:[
        { k:'tpl', label:'Template', type:'select', placeholder:'Blank item — enter everything manually',
          help:'toolTemplate',
          options: tts.map(t => ({ v:'TT|'+t.id, l:'Tool · ' + t.description + '  (' + t.type.toLowerCase()
              + ', ' + t.columns.length + ' columns' + (t.parts.length ? ', ' + t.parts.length + ' parts' : '') + ')' }))
            .concat(ixs.map(t => ({ v:'IX|'+t.id, l:'Item · ' + t.description + '  (' + t.connection + ')' }))) } ]}],
      onSubmit(v) {
        if (!v.tpl) { setTimeout(() => itemForm(ins, null, null), 240); return; }
        const [kind, id] = v.tpl.split('|');
        setTimeout(() => itemForm(ins, null, kind === 'TT' ? D.ttById(id) : D.itemTemplates.find(x => x.id === id)), 240);
      } });
  };

  /* ---------------- LOCATIONS ---------------- */
  function locationForm(cust, existing) {
    U.openForm({
      title: existing ? 'Edit ' + existing.name : 'Add a site to ' + cust.name,
      subtitle: existing ? null : 'A customer can run as many yards, shops and field sites as they need.',
      wide:true, submitLabel: existing ? 'Save site' : 'Add site',
      values: existing ? Object.assign({}, existing, { divisions: existing.divisions.join(', ') })
                       : { territory:'United States' },
      sections:[{ cols:3, fields:[
        { k:'name', label:'Site name', required:true, placeholder:'North Yard', width:2 },
        { k:'territory', label:'Territory', type:'select', options:['United States','Guam','American Samoa'] },
        { k:'addr', label:'Street address', placeholder:'3718 N County Road 1148', width:2 },
        { k:'city', label:'City', required:true, placeholder:'Midland' },
        { k:'state', label:'State', required:true, placeholder:'TX' },
        { k:'divisions', label:'Divisions at this site', width:2, placeholder:'Shop, North Yard',
          hint:'Comma separated — the third level below customer and site' } ] }],
      danger: existing && cust.locations.length > 1
        ? { label:'Delete site', run:() => A.deleteLocation(cust.id, existing.id) } : null,
      onSubmit(v) {
        const data = { name:v.name, addr:v.addr || '', city:v.city, state:v.state.toUpperCase(),
          territory:v.territory || 'United States',
          divisions:(v.divisions || 'Main').split(',').map(x=>x.trim()).filter(Boolean) };
        if (existing) { Object.assign(existing, data); U.commit('Site updated'); }
        else { cust.locations.push(Object.assign({ id: DB.nextLocationId() }, data));
               U.commit('Site <b>' + U.esc(v.name) + '</b> added to ' + U.esc(cust.name)); }
      } });
  }
  A.addLocation  = (custId) => { const c = D.custById(custId); if (c) locationForm(c, null); };
  A.editLocation = (custId, locId) => { const c = D.custById(custId);
    const l = c && c.locations.find(x => x.id === locId); if (l) locationForm(c, l); };
  A.deleteLocation = (custId, locId) => {
    const c = D.custById(custId); if (!c) return;
    const l = c.locations.find(x => x.id === locId); if (!l) return;
    if (c.locations.length < 2) { U.toast('A customer must keep at least one site', 'bad'); return; }
    const jobs = D.inspections.filter(i => i.loc === locId).length;
    U.confirmAction('Delete ' + l.name + '?',
      jobs ? `${jobs} inspection${jobs>1?'s are':' is'} recorded against this site. They will be removed too.`
           : 'This removes the site and its divisions.',
      'Delete site', () => {
        D.inspections.filter(i => i.loc === locId).forEach(i => i.items.forEach(k => delete D.items[k]));
        [...D.inspections].forEach(i => { if (i.loc === locId) D.inspections.splice(D.inspections.indexOf(i),1); });
        c.locations.splice(c.locations.indexOf(l), 1);
        U.commit('Site deleted');
      });
  };

  /* ---------------- INSPECTIONS ---------------- */
  A.newInspection = () => U.openForm({
    title:'New inspection', subtitle:'Pick the customer and site first — that pulls in their rules and rates.',
    wide:true, submitLabel:'Create inspection',
    values:{ date: new Date().toISOString().slice(0,10) },
    sections:[
      { label:'Job header', cols:3, fields:[
        { k:'loc', label:'Customer and site', type:'select', required:true, placeholder:'Select…',
          options: locOptions(), width:2, help:'newInspection' },
        { k:'division', label:'Division', placeholder:'Shop' },
        { k:'date', label:'Date', type:'date', required:true, mono:true },
        { k:'lead', label:'Lead inspector', type:'select', required:true, placeholder:'Select…',
          options: empOptions(/Inspector|Manager/), help:'lead' },
        { k:'po', label:'AFE / PO number', placeholder:'Leave blank if not yet supplied', mono:true, help:'po' },
        { k:'rig', label:'Rig / DT #', mono:true },
        { k:'format', label:'Report format', type:'select', options: toolNames(), help:'reportFormat' },
        { k:'thirdParty', label:'Third party job', type:'checkbox', onLabel:'Yes, third party', help:'thirdParty' } ] },
      { label:'Technique', cols:2, fields:[
        { k:'methods', label:'Methods', type:'multi', required:true, options: D.master.method },
        { k:'spec', label:'Inspected per', type:'multi', required:true, options: D.master.spec, help:'spec' } ] } ],
    onSubmit(v) {
      const [cust, loc] = v.loc.split('|');
      const no = DB.nextInspectionNo();
      const fmt = D.reportFormats.find(f => f.name === v.format) || D.reportFormats[0];
      D.inspections.unshift({ no, uuid:'n'+no, cust, loc, date:v.date, status:'In Progress',
        lead:v.lead, assist:[], po:v.po || '—', rig:v.rig || '—', division:v.division || 'Main',
        spec:v.spec, methods:v.methods, format:fmt.id, thirdParty:!!v.thirdParty,
        specs:{ whiteLight:420, blacklight:v.methods.indexOf('MPI')>-1?4200:0, bathStrength:v.methods.indexOf('MPI')>-1?0.3:0,
          bathBatch:'24E024', dryPowder:'23081', surfaceTemp:74, penDwell:10, devDwell:7 },
        items:[] });
      U.commit('Inspection <b>' + no + '</b> created');
      U.go('inspection', no);
    } });

  A.setStatus = (no, status) => {
    const ins = D.inspByNo(no); if (!ins) return;
    ins.status = status;
    U.commit('Inspection ' + no + ' moved to <b>' + U.esc(status) + '</b>');
  };

  A.deleteInspection = (no) => {
    const ins = D.inspByNo(no); if (!ins) return;
    U.confirmAction('Delete inspection ' + no + '?', 'The inspection and its ' + ins.items.length + ' item records will be removed.',
      'Delete', () => {
        ins.items.forEach(k => delete D.items[k]);
        D.inspections.splice(D.inspections.indexOf(ins), 1);
        U.commit('Inspection deleted'); U.go('inspections');
      });
  };

  /* ---------------- ITEMS ---------------- */
  function itemForm(ins, existing, tpl) {
    const pinF = D.PIN.map(k => ({ k:'pin_'+k, label:D.LABEL[k], mono:true, placeholder:'—' }));
    const boxF = D.BOX.map(k => ({ k:'box_'+k, label:D.LABEL[k], mono:true, placeholder:'—' }));
    const isTool = tpl && tpl.columns;                       /* tool template */
    const isItem = tpl && tpl.connection !== undefined;      /* item template */
    const src = existing && existing.tplId ? D.ttById(existing.tplId) : null;
    const cols = isTool ? tpl.columns : (src ? src.columns : []);
    const parts = isTool ? (tpl.parts || []) : (src ? (src.parts || []) : []);
    const rows = parts.length ? parts.map(p => p.partNo) : [''];
    const key = (r,c) => 'c_' + (r || 'x') + '_' + c.replace(/\W/g,'');

    const vals = { methods:[], material:'Steel', bodyStatus:'OK' };
    if (tpl) Object.assign(vals, {
      desc: tpl.description, tool: isTool ? tpl.reportType : 'Drill Pipe / Tubular',
      methods: tpl.methods.slice(), material: tpl.materials[0] || 'Steel',
      serial: (isTool ? tpl.serialPrefix : tpl.prefix) ? (isTool ? tpl.serialPrefix : tpl.prefix) + '-' : '',
      rate: isItem ? tpl.rate : '', pinType: isItem ? tpl.connection : '' });
    if (existing) {
      Object.assign(vals, { serial:existing.serial, desc:existing.desc, tool:existing.tool,
        material:existing.material, methods:existing.methods, bodyStatus:existing.bodyStatus,
        len:existing.len === '—' ? '' : existing.len, rate:(existing.prices||[{}])[0].r });
      (existing.conns||[]).forEach(c => { vals[c.key + 'Type'] = c.type;
        Object.keys(c.vals).forEach(k => vals[c.key + '_' + k] = c.vals[k]); });
      Object.keys(existing.cols || {}).forEach(r => Object.keys(existing.cols[r]).forEach(c =>
        vals[key(r,c)] = existing.cols[r][c]));
    }

    const colSections = cols.length ? rows.map(r => {
      const p = parts.find(x => x.partNo === r);
      return { label: p ? 'Part ' + p.partNo + ' — ' + p.equipment + ' (' + p.material + ')'
                        : 'Captured columns — ' + (tpl || src).description,
        cols: Math.min(4, cols.length),
        fields: cols.map(c => c.type === 'status'
          ? { k:key(r,c.label), label:c.label, type:'select', placeholder:'—', options:c.options }
          : { k:key(r,c.label), label:c.label, mono:true, placeholder:'—' }) };
    }) : [];

    U.openForm({
      title: existing ? 'Edit item ' + existing.itemId
           : (tpl ? 'Add ' + tpl.description : 'Add item') + ' to inspection ' + ins.no,
      subtitle: cols.length
        ? 'Columns below come from the ' + (tpl || src).description + ' template — the same ones the report prints.'
        : 'Enter measurements as fractions — the platform converts and compares them to the standard.',
      wide:true, submitLabel: existing ? 'Save item' : 'Add item', values: vals,
      sections:[
        { label:'Item', cols:3, fields:[
          { k:'serial', label:'Serial #', required:true, mono:true, placeholder:'APJ618', help:'newItem' },
          { k:'desc', label:'Description', required:true, placeholder:'Steel Pup Joint' },
          { k:'tool', label:'Report format', type:'select', options: toolNames() },
          { k:'material', label:'Material', type:'select', options: D.master.material },
          { k:'len', label:'Tool length (in)', mono:true, placeholder:'28.40' },
          { k:'rate', label:'Inspection rate ($)', type:'number', mono:true, placeholder:'105' },
          { k:'methods', label:'Methods', type:'multi', required:true, options: D.master.method, width:2 },
          { k:'bodyStatus', label:'Body status', type:'select', options: D.master.acceptance, help:'bodyStatus' } ] },
        ...colSections,
        { label:'Pin connection', cols:5, fields:[
          { k:'pinType', label:'Connection', type:'select', placeholder:'Not measured', options: ctNames(), help:'connection' },
          ...pinF ] },
        { label:'Box connection', cols:5, fields:[
          { k:'boxType', label:'Connection', type:'select', placeholder:'Not measured', options: ctNames() },
          ...boxF ] } ],
      danger: existing ? { label:'Remove item', run:() => A.deleteItem(ins.no, existing.id) } : null,
      onSubmit(v) {
        const conns = [];
        ['pin','box'].forEach(side => {
          const type = v[side + 'Type']; if (!type) return;
          const keys = side === 'pin' ? D.PIN : D.BOX, vv = {};
          keys.forEach(k => { const raw = v[side + '_' + k]; if (raw) vv[k] = raw; });
          if (Object.keys(vv).length) conns.push({ type, key:side, vals:vv });
        });
        const captured = {};
        rows.forEach(r => { const o = {};
          cols.forEach(c => { const val = v[key(r, c.label)]; if (val) o[c.label] = val; });
          if (Object.keys(o).length) captured[r || '—'] = o; });

        const rate = parseFloat(v.rate) || 0;
        const rec = existing || { id: DB.nextKey('IT', D.items), itemId: DB.nextItemId() };
        const tplId = existing ? existing.tplId : (isTool ? tpl.id : null);
        Object.assign(rec, {
          serial:v.serial.toUpperCase(), desc:v.desc, tool:v.tool || 'Drill Pipe / Tubular',
          material:v.material, methods:v.methods, bodyStatus:v.bodyStatus,
          len: v.len || '—', conns, tplId, cols: captured,
          misc: existing ? existing.misc
                : ((tpl && (tpl.miscItems || tpl.misc)) || []).map(n => ({ n, c:'OK', m:v.methods[0] || 'VT' })),
          prices:[{ n:v.desc, t:'Incoming/Dirty', q:1, r:rate, u:'PER TOOL' }],
          standard: existing ? existing.standard : [] });

        /* verdict: worst of body, connections, misc and any status column */
        const tol = AI.toleranceCheck(rec);
        const dimFail = tol.some(c => c.fails.length);
        const miscBad = (rec.misc||[]).some(m => m.c !== 'OK');
        const colBad = Object.values(captured).some(o =>
          Object.values(o).some(val => /REJECT|DBR/i.test(String(val))));
        rec.status = (rec.bodyStatus !== 'OK' || dimFail || miscBad || colBad) ? 'REJECTED' : 'OK';
        D.items[rec.id] = rec;
        if (ins.items.indexOf(rec.id) === -1) ins.items.push(rec.id);
        U.commit('Item <b>' + rec.serial + '</b> ' + (existing ? 'updated' : 'added') + ' — verdict ' + rec.status,
          rec.status === 'REJECTED' ? 'bad' : 'ok');
      } });
  }
  A.editItem = (id) => { const it = D.items[id]; const ins = D.inspections.find(x => x.items.indexOf(id) > -1);
                         if (it && ins) itemForm(ins, it, null); };
  A.deleteItem = (no, id) => {
    const ins = D.inspByNo(no); if (!ins) return;
    const i = ins.items.indexOf(id); if (i > -1) ins.items.splice(i, 1);
    delete D.items[id];
    U.commit('Item removed');
    if (S.route === 'item') U.go('inspection', no);
  };

  /* ---------------- BILLING ---------------- */
  A.createInvoice = (no) => {
    const ins = D.inspByNo(no); if (!ins) return;
    if (ins.invoice) { U.toast('Inspection ' + no + ' is already invoiced', 'bad'); return; }
    const its = ins.items.map(i => D.items[i]).filter(Boolean);
    if (!its.length) { U.toast('Add at least one item before invoicing', 'bad'); return; }
    const total = its.reduce((s,i) => s + (i.prices||[]).reduce((a,p)=>a+p.q*p.r,0)
                                        + (i.standard||[]).reduce((a,p)=>a+p.q*p.r,0), 0);
    const c = D.custById(ins.cust);
    const days = parseInt((c.terms||'Net 30').replace(/\D/g,''),10) || 30;
    const due = new Date(new Date(ins.date).getTime() + days*86400000).toISOString().slice(0,10);
    U.openForm({ title:'Create invoice', subtitle:'From inspection ' + no + ' — ' + c.name,
      submitLabel:'Raise invoice',
      values:{ no:DB.nextInvoiceNo(), date:ins.date, due, po:ins.po === '—' ? '' : ins.po,
               total: (total * (1 + c.tax/100)).toFixed(2) },
      sections:[{ cols:2, fields:[
        { k:'no', label:'Invoice number', required:true, mono:true },
        { k:'po', label:'PO number', mono:true, placeholder:'Not supplied', help:'po' },
        { k:'date', label:'Invoice date', type:'date', required:true, mono:true },
        { k:'due', label:'Due date', type:'date', required:true, mono:true },
        { k:'total', label:'Total including tax ($)', type:'number', step:'0.01', required:true, mono:true, width:2 } ]}],
      footNote:'Lines are carried across from close out. Tax applied at ' + c.tax + '%.',
      onSubmit(v) {
        D.invoices.unshift({ no:v.no, insp:no, cust:ins.cust, date:v.date, due:v.due,
          total: parseFloat(v.total), paid:0, status:'Sent', po: v.po || '—' });
        ins.invoice = v.no; ins.status = 'Invoiced';
        U.commit('Invoice <b>' + v.no + '</b> raised');
        U.go('invoice', v.no);
      } });
  };

  A.recordPayment = (no) => {
    const inv = D.invByNo(no); if (!inv) return;
    const outstanding = inv.total - inv.paid;
    U.openForm({ title:'Record payment', subtitle:'Invoice ' + no + ' — ' + D.custById(inv.cust).name,
      submitLabel:'Record payment',
      values:{ amount: outstanding.toFixed(2), date: new Date().toISOString().slice(0,10), method:'Bank transfer' },
      sections:[{ cols:2, fields:[
        { k:'amount', label:'Amount received ($)', type:'number', step:'0.01', required:true, mono:true },
        { k:'date', label:'Date received', type:'date', required:true, mono:true },
        { k:'method', label:'Method', type:'select', options:['Bank transfer','Credit card','Cash','Cheque','Other'] },
        { k:'ref', label:'Reference', mono:true, placeholder:'Optional' } ]}],
      footNote:'Outstanding on this invoice: <b>' + AI.money(outstanding) + '</b>',
      onSubmit(v) {
        inv.paid = Math.min(inv.total, inv.paid + (parseFloat(v.amount) || 0));
        inv.status = inv.paid >= inv.total - 0.005 ? 'Paid' : 'Sent';
        U.commit('Payment of ' + AI.money(parseFloat(v.amount)) + ' recorded');
      } });
  };

  A.sendInvoice = (no) => {
    const inv = D.invByNo(no); if (!inv) return;
    inv.status = 'Sent';
    U.commit('Invoice ' + no + ' marked as sent');
  };

  /* ---------------- STANDARDS ---------------- */
  function standardForm(existing) {
    const f = side => (side === 'pin' ? D.PIN : D.BOX).flatMap(k => ([
      { k:side+'_'+k+'_min', label:D.LABEL[k] + ' min', mono:true, type:'number', step:'0.001', placeholder:'—' },
      { k:side+'_'+k+'_max', label:D.LABEL[k] + ' max', mono:true, type:'number', step:'0.001', placeholder:'—' } ]));
    const vals = {};
    if (existing) {
      vals.name = existing.name; vals.reface = existing.reface;
      ['pin','box'].forEach(side => Object.keys(existing.ranges[side] || {}).forEach(k => {
        vals[side+'_'+k+'_min'] = existing.ranges[side][k][0];
        vals[side+'_'+k+'_max'] = existing.ranges[side][k][1]; }));
    }
    U.openForm({
      title: existing ? 'Edit ' + existing.name : 'New connection standard',
      subtitle:'Minimum and maximum for each dimension. Leave a pair blank and that dimension is not checked.',
      wide:true, submitLabel: existing ? 'Save standard' : 'Create standard', values: vals,
      sections:[
        { cols:2, fields:[
          { k:'name', label:'Connection name', required:true, mono:true, placeholder:'NC-46', help:'connStd' },
          { k:'reface', label:'Reface type', type:'select', options: D.master.reface } ] },
        { label:'Pin dimensions', cols:4, fields: f('pin') },
        { label:'Box dimensions', cols:4, fields: f('box') } ],
      danger: existing ? { label:'Delete standard', run:() => {
        D.connectionTypes.splice(D.connectionTypes.indexOf(existing), 1);
        U.commit('Standard deleted'); U.go('standards'); } } : null,
      onSubmit(v) {
        const ranges = { pin:{}, box:{} };
        ['pin','box'].forEach(side => (side === 'pin' ? D.PIN : D.BOX).forEach(k => {
          const lo = parseFloat(v[side+'_'+k+'_min']), hi = parseFloat(v[side+'_'+k+'_max']);
          if (!isNaN(lo) && !isNaN(hi)) ranges[side][k] = [lo, hi];
        }));
        if (existing) { existing.name = v.name; existing.reface = v.reface; existing.ranges = ranges; }
        else D.connectionTypes.push({ id:'CT-' + (D.connectionTypes.length+1), name:v.name,
          reface:v.reface || 'API Reface', ranges });
        U.commit('Standard <b>' + U.esc(v.name) + '</b> saved');
        U.go('standards', (existing || D.connectionTypes[D.connectionTypes.length-1]).id);
      } });
  }
  A.newStandard  = () => standardForm(null);
  A.editStandard = (id) => { const c = D.connectionTypes.find(x => x.id === id); if (c) standardForm(c); };

  /* ---------------- FORMATS + MASTER DATA ---------------- */
  A.newFormat = () => U.openForm({
    title:'New report format', subtitle:'A format is an ordered list of columns, each typed.',
    submitLabel:'Create format',
    sections:[{ cols:1, fields:[
      { k:'name', label:'Format name', required:true, placeholder:'Thru Tubing Motor', help:'reportFormat' },
      { k:'cols', label:'Columns', type:'textarea', required:true,
        placeholder:'Pin Connection | Connection\nBody Wall | Body\nItem Status | Tool Status',
        hint:'One per line — column name, a pipe, then Connection, Body or Tool Status' } ]}],
    onSubmit(v) {
      const cols = v.cols.split('\n').map(l => l.split('|').map(x => x.trim())).filter(p => p[0])
        .map(p => [p[0], ['Connection','Body','Tool Status'].indexOf(p[1]) > -1 ? p[1] : 'Body']);
      if (!cols.length) { U.toast('Add at least one column', 'bad'); return false; }
      D.reportFormats.push({ id:'RF-' + (D.reportFormats.length+1), name:v.name, cols });
      U.commit('Report format <b>' + U.esc(v.name) + '</b> created');
    } });

  A.deleteFormat = (id) => {
    const f = D.reportFormats.find(x => x.id === id); if (!f) return;
    U.confirmAction('Delete ' + f.name + '?', 'Inspections already using this format keep their columns.',
      'Delete', () => { D.reportFormats.splice(D.reportFormats.indexOf(f), 1); U.commit('Format deleted'); });
  };

  A.addMaster = (group) => U.openForm({
    title:'Add to ' + group.replace(/_/g,' '), submitLabel:'Add value',
    sections:[{ cols:1, fields:[{ k:'v', label:'Value', required:true, help:'masterData' }] }],
    onSubmit(v) {
      if (D.master[group].indexOf(v.v) > -1) { U.toast('That value already exists', 'bad'); return false; }
      D.master[group].push(v.v);
      U.commit('Added <b>' + U.esc(v.v) + '</b> to ' + group.replace(/_/g,' '));
    } });

  A.removeMaster = (group, value) => {
    const i = D.master[group].indexOf(value);
    if (i > -1) { D.master[group].splice(i, 1); U.commit('Removed ' + U.esc(value)); }
  };

  /* ---------------- TICKETS ---------------- */
  A.newTicket = () => U.openForm({
    title:'New inspection ticket', subtitle:'Lightweight intake that becomes a full inspection.',
    submitLabel:'Raise ticket',
    values:{ date:new Date().toISOString().slice(0,10), items:1 },
    sections:[{ cols:2, fields:[
      { k:'loc', label:'Customer and site', type:'select', required:true, placeholder:'Select…', options: locOptions(), width:2 },
      { k:'date', label:'Date', type:'date', required:true, mono:true },
      { k:'items', label:'Item count', type:'number', required:true, mono:true },
      { k:'rig', label:'Rig', mono:true },
      { k:'by', label:'Raised by', type:'select', options:['Portal User'].concat(D.employees.map(e=>e.name)) } ]}],
    onSubmit(v) {
      const [cust, loc] = v.loc.split('|');
      D.tickets.unshift({ no:DB.nextTicketNo(), cust, loc, date:v.date, by:v.by || 'Portal User',
        items:parseInt(v.items,10)||1, rig:v.rig || '—', status:'Open' });
      U.commit('Ticket raised');
    } });

  A.convertTicket = (no) => {
    const t = D.tickets.find(x => x.no === no); if (!t || t.status !== 'Open') return;
    const insNo = DB.nextInspectionNo();
    D.inspections.unshift({ no:insNo, uuid:'n'+insNo, cust:t.cust, loc:t.loc, date:t.date,
      status:'In Progress', lead:D.employees.find(e=>e.role.indexOf('Inspector')>-1).id, assist:[],
      po:'—', rig:t.rig, division:'Main', spec:['ZION Spec'], methods:['MPI','VT'],
      format:D.reportFormats[0].id, thirdParty:false,
      specs:{ whiteLight:420, blacklight:4200, bathStrength:0.3, bathBatch:'24E024',
        dryPowder:'23081', surfaceTemp:74, penDwell:10, devDwell:7 }, items:[] });
    t.status = 'Converted';
    U.commit('Ticket ' + no + ' converted to inspection <b>' + insNo + '</b>');
    U.go('inspection', insNo);
  };

  window.ACT = A;
})();
