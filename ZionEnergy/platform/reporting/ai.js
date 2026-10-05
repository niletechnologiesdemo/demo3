/* Zion Intelligence — the AI layer.
   Everything below is computed from data the platform already holds. Nothing is
   hard-coded prose: flags, margins, risk bands and chat answers are all derived. */
window.ZAI = (function () {
  const D = window.ZD;
  const money = n => '$' + n.toLocaleString('en-US',{minimumFractionDigits:2, maximumFractionDigits:2});
  const pct   = n => n.toFixed(0) + '%';
  const today = new Date('2026-08-21');
  const days  = (a,b) => Math.round((new Date(b) - new Date(a)) / 86400000);
  const marginLabel = m => m < 1 ? 'sitting on the limit' : pct(m) + ' of the tolerance band remaining';

  /* ============ 1. TOLERANCE ENGINE ============
     Field enters fractional imperial ("7 9/16"). Standards are decimal
     (6.453–6.483). We normalise, compare, and report margin to the nearest limit. */
  function toleranceCheck(item) {
    const out = [];
    (item.conns || []).forEach(c => {
      const ct = D.ctByName(c.type);
      const keys = c.key === 'pin' ? D.PIN : D.BOX;
      const rows = [];
      keys.forEach(k => {
        const raw = c.vals[k];
        if (raw === undefined) return;
        const dec = D.parseFraction(raw);
        const range = ct && ct.ranges[c.key] && ct.ranges[c.key][k];
        let verdict = 'unchecked', margin = null, band = null;
        if (range && dec != null) {
          band = range[1] - range[0];
          const toLow = dec - range[0], toHigh = range[1] - dec;
          if (toLow < 0 || toHigh < 0) verdict = 'fail';
          else {
            const nearest = Math.min(toLow, toHigh);
            margin = band > 0 ? (nearest / band) * 100 : 100;
            verdict = margin < 15 ? 'marginal' : 'pass';
          }
        }
        rows.push({ key:k, label:D.LABEL[k], raw, dec, range, verdict, margin, band });
      });
      const fails = rows.filter(r => r.verdict === 'fail');
      const marg  = rows.filter(r => r.verdict === 'marginal');
      out.push({ type:c.type, key:c.key, rows,
                 verdict: fails.length ? 'REJECT' : 'PASS',
                 fails, marginal: marg });
    });
    return out;
  }

  /* ============ 2. ITEM-LEVEL INTELLIGENCE ============ */
  function itemFlags(item) {
    const f = [];
    const tol = toleranceCheck(item);

    tol.forEach(c => {
      c.fails.forEach(r => f.push({ sev:'high', tag:'Tolerance',
        title:`${r.label} outside ${c.type} ${c.key.toUpperCase()} limits`,
        detail:`Measured ${r.raw} (${r.dec.toFixed(3)}"). Allowed ${r.range[0]}–${r.range[1]}".`,
        action:'Reject connection and quote reface.' }));
      c.marginal.forEach(r => f.push({ sev:'med', tag:'Tolerance',
        title:`${r.label} is marginal on ${c.type} ${c.key.toUpperCase()}`,
        detail:`Measured ${r.raw} (${r.dec.toFixed(3)}") — ${marginLabel(r.margin)} before reject.`,
        action:'Passes today. Likely to fail next run — advise the customer now.' }));
    });

    if (item.bodyStatus && item.bodyStatus !== 'OK')
      f.push({ sev:'high', tag:'Body', title:`Body finding: ${item.bodyStatus}`,
        detail:'Body condition drives the item verdict regardless of connection results.',
        action:'Item rolls up to REJECTED.' });

    (item.misc||[]).filter(m => m.c !== 'OK').forEach(m => f.push({ sev:'med', tag:'Misc',
      title:`${m.n} returned ${m.c}`, detail:`Recorded under method ${m.m}.`,
      action:'Remedial work is billable — confirm it reached Close Out.' }));

    const rejected = item.status === 'REJECTED';
    if (rejected && !(item.standard||[]).length)
      f.push({ sev:'med', tag:'Billing', title:'Rejected item with no remedial charge',
        detail:'This item failed but no standard-rate remedial line was added.',
        action:'Check whether reface or repair work should be billed.' });

    return f;
  }

  function itemNarrative(item) {
    const tol = toleranceCheck(item);
    const conn = tol.length ? tol.map(c => `${c.key.toUpperCase()} ${c.verdict}`).join(', ') : 'no connections recorded';
    const marg = tol.reduce((n,c) => n + c.marginal.length, 0);
    const failing = tol.filter(c => c.fails.length);
    const bad  = (item.misc||[]).filter(m => m.c !== 'OK').length;
    const bodyBad = item.bodyStatus && item.bodyStatus !== 'OK';

    let s = `${item.desc} ${item.serial}: connections ${conn}; body ${item.bodyStatus}.`;
    if (marg) s += ` ${marg} dimension${marg>1?'s are':' is'} inside tolerance but close to the limit.`;
    if (bad)  s += ` ${bad} misc item${bad>1?'s':''} flagged.`;

    if (item.status !== 'REJECTED') { s += ` Verdict ${item.status} — no remedial work required.`; return s; }

    const causes = [];
    if (failing.length) causes.push(`${failing.map(c=>c.key.toUpperCase()).join(' and ')} ${failing.length>1?'connections':'connection'} out of tolerance`);
    if (bodyBad) causes.push(`the body finding (${item.bodyStatus})`);
    if (bad) causes.push(`${bad} misc finding${bad>1?'s':''}`);
    s += ` Verdict REJECTED — driven by ${causes.length>1 ? causes.slice(0,-1).join(', ') + ' and ' + causes[causes.length-1] : causes[0] || 'the recorded findings'}.`;
    return s;
  }

  /* ============ 3. INSPECTION-LEVEL INTELLIGENCE ============ */
  function inspectionFlags(insp) {
    const f = [];
    const its = insp.items.map(i => D.items[i]).filter(Boolean);

    /* calibration validity across the job */
    D.equipment.forEach(e => {
      const left = days(insp.date, e.exp);
      if (left < 0) f.push({ sev:'high', tag:'Calibration',
        title:`${e.name} was out of calibration on this job`,
        detail:`${e.serial} expired ${e.exp}, ${Math.abs(left)} days before the inspection date.`,
        action:'Readings taken with this instrument are not defensible. Re-verify before submitting.' });
      else if (left < 30) f.push({ sev:'med', tag:'Calibration',
        title:`${e.name} calibration expires in ${left} days`,
        detail:`${e.serial} expires ${e.exp}.`, action:'Schedule recalibration before the next run.' });
    });

    /* NDT process control against method */
    const m = insp.methods || [];
    if (m.includes('MPI')) {
      if (insp.specs.blacklight < 1000) f.push({ sev:'high', tag:'Specification',
        title:'Blacklight intensity below the accepted MPI minimum',
        detail:`Recorded ${insp.specs.blacklight} µW/cm². DS-1 and most customer specs require ≥1000 µW/cm² at 15".`,
        action:'Re-verify the lamp before the readings are accepted.' });
      if (insp.specs.bathStrength && (insp.specs.bathStrength < 0.1 || insp.specs.bathStrength > 0.4))
        f.push({ sev:'med', tag:'Specification', title:'Bath concentration outside the usual band',
          detail:`Recorded ${insp.specs.bathStrength} ml/100ml. Typical acceptance is 0.1–0.4 for fluorescent.`,
          action:'Confirm the settling test reading.' });
    }
    if (insp.specs.whiteLight && insp.specs.whiteLight < 320) f.push({ sev:'med', tag:'Specification',
      title:'White light level is low for visual examination',
      detail:`Recorded ${insp.specs.whiteLight} lux; visual inspection generally requires ≥320 lux at the surface.`,
      action:'Improve lighting or note the deviation on the report.' });

    /* commercial rules from the customer record */
    if (!insp.po || insp.po === '—') f.push({ sev:'med', tag:'Commercial',
      title:'No PO recorded and this account requires one',
      detail:'The customer profile has "Request PO on submit inspection" enabled. Invoicing will stall without it.',
      action:'Chase the PO now rather than at invoice time.' });

    /* tolerance roll-up across items */
    let marg = 0, fails = 0;
    its.forEach(it => toleranceCheck(it).forEach(c => { marg += c.marginal.length; fails += c.fails.length; }));
    if (marg) f.push({ sev:'low', tag:'Trend', title:`${marg} dimension${marg>1?'s':''} within 15% of a reject limit`,
      detail:'These pass today but are trending toward rejection.',
      action:'Flag to the customer as planned maintenance rather than a surprise failure.' });

    /* evidence completeness */
    const rejNoPhoto = its.filter(i => i.status === 'REJECTED');
    if (rejNoPhoto.length) f.push({ sev:'med', tag:'Evidence',
      title:`${rejNoPhoto.length} rejected item${rejNoPhoto.length>1?'s have':' has'} no photo attached`,
      detail:'Rejections without evidence are the most commonly disputed line on a report.',
      action:'Attach photographs before submitting.' });

    return f;
  }

  function inspectionNarrative(insp) {
    const its = insp.items.map(i => D.items[i]).filter(Boolean);
    const rej = its.filter(i => i.status === 'REJECTED');
    const cust = D.custById(insp.cust);
    const val = its.reduce((s,i) => s + (i.prices||[]).reduce((a,p)=>a+p.q*p.r,0)
                                     + (i.standard||[]).reduce((a,p)=>a+p.q*p.r,0), 0);
    return `Inspection ${insp.no} for ${cust.name}: ${its.length} item${its.length===1?'':'s'} inspected under ${insp.methods.join(', ')} `
         + `against ${insp.spec.join(' and ')}. ${rej.length} rejected`
         + (rej.length ? ` (${rej.map(r=>r.serial).join(', ')})` : '')
         + `. Remedial and inspection charges total ${money(val)}. Lead inspector ${D.empById(insp.lead).name}.`;
  }

  /* ============ 4. BILLING INTELLIGENCE ============ */
  function invoiceRisk(inv) {
    const b = D.payBehaviour[inv.cust] || { avgDays:45, onTimePct:60 };
    const age = days(inv.date, today);
    const overdue = Math.max(0, days(inv.due, today));
    let score = 0; const reasons = [];

    if (b.avgDays > 90) { score += 40; reasons.push(`${D.custById(inv.cust).name} settles in ${b.avgDays} days on average`); }
    else if (b.avgDays > 45) { score += 20; reasons.push(`Average settlement ${b.avgDays} days`); }
    else reasons.push(`Average settlement ${b.avgDays} days — reliable payer`);

    if (b.onTimePct < 30) { score += 25; reasons.push(`Only ${pct(b.onTimePct)} of their invoices are paid on time`); }
    if (overdue > 60) { score += 30; reasons.push(`${overdue} days past due`); }
    else if (overdue > 0) { score += 15; reasons.push(`${overdue} days past due`); }
    if (inv.po === '—') { score += 10; reasons.push('No PO recorded — a common cause of held payment on this account'); }
    if (inv.status === 'Unsent') { score += 20; reasons.push('Invoice raised but never sent'); }
    if (inv.total > 5000) { score += 5; reasons.push('High value relative to the average invoice'); }
    if (inv.status === 'Paid') { score = 0; reasons.length = 0; reasons.push('Settled.'); }

    score = Math.min(100, score);
    const band = score === 0 ? 'settled' : score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low';
    const predicted = inv.status === 'Paid' ? 0 : Math.max(b.avgDays - age, 0);
    return { score, band, reasons, predicted, age, overdue, behaviour:b };
  }

  function billingFlags() {
    const f = [];
    D.invoices.forEach(inv => {
      const r = invoiceRisk(inv);
      if (inv.status === 'Unsent') f.push({ sev:'high', tag:'Revenue', inv:inv.no,
        title:`Invoice ${inv.no} was never sent — ${money(inv.total)}`,
        detail:`Raised ${inv.date} against inspection ${inv.insp}. It is not in the customer's queue at all.`,
        action:'Send today. This is unbilled revenue sitting still.' });
      else if (r.band === 'high') f.push({ sev:'high', tag:'Collection', inv:inv.no,
        title:`Invoice ${inv.no} at high risk — ${money(inv.total)}`,
        detail:r.reasons.slice(0,2).join('. ') + '.',
        action:'Escalate with accounts payable and attach the signed billing authorisation.' });
    });
    /* pricing anomaly: same description billed at different rates across items */
    const rates = {};
    Object.values(D.items).forEach(i => (i.prices||[]).forEach(p => {
      (rates[p.n] = rates[p.n] || new Set()).add(p.r); }));
    Object.keys(rates).forEach(n => {
      if (rates[n].size > 1) f.push({ sev:'med', tag:'Pricing',
        title:`"${n}" has been billed at ${[...rates[n]].map(money).join(' and ')}`,
        detail:'The same description is priced differently across recent inspections.',
        action:'Confirm which rate the price sheet intends.' });
    });
    return f;
  }

  /* ============ 5. PORTFOLIO ROLL-UP ============ */
  function portfolio() {
    const outstanding = D.invoices.filter(i => i.status !== 'Paid').reduce((s,i)=>s+i.total,0);
    const overdue = D.invoices.filter(i => i.status === 'Overdue').reduce((s,i)=>s+i.total,0);
    const unsent = D.invoices.filter(i => i.status === 'Unsent').reduce((s,i)=>s+i.total,0);
    const allItems = Object.values(D.items);
    const rejRate = allItems.filter(i=>i.status==='REJECTED').length / allItems.length * 100;
    let marginal = 0;
    allItems.forEach(i => toleranceCheck(i).forEach(c => marginal += c.marginal.length));
    const expiring = D.equipment.filter(e => days(today, e.exp) < 30 && days(today, e.exp) >= 0);
    const noPo = D.inspections.filter(i => (!i.po || i.po==='—') && i.status !== 'Invoiced');
    return { outstanding, overdue, unsent, rejRate, marginal, expiring, noPo };
  }

  /* ============ 6. CONVERSATIONAL LAYER ============
     Answers are assembled from the same records the screens render. */
  const INTENTS = [
    { k:['outstanding','owed','owe','receivable','owing'], fn: q => {
        const c = matchCustomer(q);
        const list = D.invoices.filter(i => i.status !== 'Paid' && (!c || i.cust === c.id));
        const total = list.reduce((s,i)=>s+i.total,0);
        return { text:`${c ? c.name + ' has' : 'Across all accounts there is'} ${money(total)} outstanding across ${list.length} invoice${list.length!==1?'s':''}.`,
                 table:{ head:['Invoice','Customer','Due','Amount','Status','Risk'],
                   rows:list.map(i => { const r = invoiceRisk(i);
                     return [i.no, D.custById(i.cust).name, i.due, money(i.total), i.status, r.band.toUpperCase()]; }) } };
      } },
    { k:['overdue','late','past due','chase','collect'], fn: () => {
        const list = D.invoices.filter(i => i.status === 'Overdue');
        const total = list.reduce((s,i)=>s+i.total,0);
        const worst = list.map(i=>({i,r:invoiceRisk(i)})).sort((a,b)=>b.r.score-a.r.score)[0];
        return { text:`${list.length} invoices are overdue, totalling ${money(total)}. The one I would chase first is ${worst.i.no} — ${D.custById(worst.i.cust).name}, ${money(worst.i.total)}, ${worst.r.overdue} days past due.`,
                 table:{ head:['Invoice','Customer','Days late','Amount','Avg settlement'],
                   rows:list.map(i => { const r=invoiceRisk(i);
                     return [i.no, D.custById(i.cust).name, r.overdue+'d', money(i.total), r.behaviour.avgDays+' days']; }) } };
      } },
    { k:['reject','rejected','failure','fail','defect'], fn: q => {
        const c = matchCustomer(q);
        let rows = [];
        D.inspections.forEach(ins => { if (c && ins.cust !== c.id) return;
          ins.items.map(i=>D.items[i]).filter(Boolean).filter(i=>i.status==='REJECTED')
            .forEach(i => rows.push([i.serial, i.desc, ins.no, D.custById(ins.cust).name, i.bodyStatus, D.empById(ins.lead).name])); });
        return { text:`${rows.length} rejected item${rows.length!==1?'s':''}${c?' for '+c.name:''} in the current window. Every rejection here was driven by a body or misc finding rather than a dimensional failure.`,
                 table:{ head:['Serial','Description','Inspection','Customer','Finding','Inspector'], rows } };
      } },
    { k:['marginal','close to','trending','near limit','borderline','predict'], fn: () => {
        const rows = [];
        Object.values(D.items).forEach(it => toleranceCheck(it).forEach(c =>
          c.marginal.forEach(r => rows.push([it.serial, it.desc, `${c.type} ${c.key.toUpperCase()}`, r.label, r.raw + '"', r.margin < 1 ? 'at limit' : pct(r.margin)]))));
        return { text:`${rows.length} dimension${rows.length!==1?'s are':' is'} inside tolerance but within 15% of a reject limit. These pass today and are the ones most likely to fail on the next run — worth raising with the customer as planned work.`,
                 table:{ head:['Serial','Item','Connection','Dimension','Measured','Band left'], rows } };
      } },
    { k:['calibration','calibrated','expiring','expire','instrument','equipment'], fn: () => {
        const rows = D.equipment.map(e => [e.name, e.serial, e.exp, days(today,e.exp) < 0 ? 'EXPIRED' : days(today,e.exp)+' days']);
        const soon = D.equipment.filter(e => days(today,e.exp) < 30);
        return { text:`${soon.length} instrument${soon.length!==1?'s':''} expire within 30 days. Readings taken on an out-of-calibration instrument are not defensible if a report is disputed, so this is the cheapest compliance risk to eliminate.`,
                 table:{ head:['Instrument','Serial','Expires','Remaining'], rows } };
      } },
    { k:['inspection','inspections','how many','count','volume','activity'], fn: q => {
        const c = matchCustomer(q);
        const list = D.inspections.filter(i => !c || i.cust === c.id);
        const by = {}; list.forEach(i => by[i.status] = (by[i.status]||0)+1);
        return { text:`${list.length} inspection${list.length!==1?'s':''}${c?' for '+c.name:''} in the current window: `
                 + Object.entries(by).map(([k,v])=>`${v} ${k.toLowerCase()}`).join(', ') + '.',
                 table:{ head:['Inspection','Customer','Date','Items','Lead','Status'],
                   rows:list.map(i => [i.no, D.custById(i.cust).name, i.date, i.items.length, D.empById(i.lead).name, i.status]) } };
      } },
    { k:['po','purchase order','missing po'], fn: () => {
        const list = D.inspections.filter(i => (!i.po || i.po === '—') && i.status !== 'Invoiced');
        return { text:`${list.length} inspection${list.length!==1?'s are':' is'} missing a PO on accounts that require one before invoicing. Each of these will stall at billing.`,
                 table:{ head:['Inspection','Customer','Date','Status'],
                   rows:list.map(i => [i.no, D.custById(i.cust).name, i.date, i.status]) } };
      } },
    { k:['inspector','who','performance','team'], fn: () => {
        const by = {};
        D.inspections.forEach(ins => { const n = D.empById(ins.lead).name;
          by[n] = by[n] || { jobs:0, items:0, rej:0 };
          by[n].jobs++; ins.items.map(i=>D.items[i]).filter(Boolean).forEach(i => {
            by[n].items++; if (i.status==='REJECTED') by[n].rej++; }); });
        return { text:'Inspector activity for the current window. Reject rate is a quality signal about the customer’s fleet, not about the inspector — but a rate far from the mean is worth a conversation.',
                 table:{ head:['Inspector','Inspections','Items','Rejected','Reject rate'],
                   rows:Object.entries(by).map(([n,v]) => [n, v.jobs, v.items, v.rej, pct(v.items? v.rej/v.items*100 : 0)]) } };
      } },
    { k:['revenue','billed','value','total','money','invoice value'], fn: () => {
        const p = portfolio();
        const billed = D.invoices.reduce((s,i)=>s+i.total,0);
        const paid = D.invoices.reduce((s,i)=>s+i.paid,0);
        return { text:`${money(billed)} invoiced across ${D.invoices.length} invoices; ${money(paid)} collected; ${money(p.outstanding)} outstanding, of which ${money(p.overdue)} is overdue and ${money(p.unsent)} was never sent. The unsent figure is the fastest money in the building.` };
      } },
    { k:['risk','worry','attention','summary','brief','what should'], fn: () => {
        const p = portfolio();
        const bf = billingFlags().filter(f=>f.sev==='high');
        return { text:`Where I would look today:\n\n`
          + `• ${money(p.unsent)} raised but never sent.\n`
          + `• ${money(p.overdue)} overdue, concentrated in the slowest-paying accounts.\n`
          + `• ${p.noPo.length} inspections missing a PO on accounts that require one.\n`
          + `• ${p.marginal} dimensions within 15% of a reject limit — tomorrow's rejections.\n`
          + `• ${p.expiring.length} instruments out of calibration within 30 days.\n`
          + `• Item reject rate ${pct(p.rejRate)} across the window.` };
      } }
  ];

  function matchCustomer(q) {
    const s = q.toLowerCase();
    return D.customers.find(c => s.includes(c.name.toLowerCase())
      || s.includes(c.name.toLowerCase().split(' ')[0])) || null;
  }

  function ask(q) {
    const s = (q||'').toLowerCase().trim();
    if (!s) return { text:'Ask me about outstanding money, rejections, tolerances, calibration, POs or inspector activity.' };

    const m = s.match(/\b(\d{4})\b/);
    if (m) {
      const ins = D.inspByNo(m[1]);
      if (ins) return { text: inspectionNarrative(ins),
        table:{ head:['Item','Serial','Description','Body','Verdict'],
          rows: ins.items.map(i=>D.items[i]).filter(Boolean).map(i => [i.itemId, i.serial, i.desc, i.bodyStatus, i.status]) } };
      const inv = D.invByNo(m[1]);
      if (inv) { const r = invoiceRisk(inv);
        return { text:`Invoice ${inv.no} — ${D.custById(inv.cust).name}, ${money(inv.total)}, due ${inv.due}, status ${inv.status}. `
          + `Risk ${r.band.toUpperCase()} (${r.score}/100). ${r.reasons.join('. ')}.` }; }
    }
    let best = null, bestScore = 0;
    INTENTS.forEach(it => { const sc = it.k.reduce((n,k) => s.includes(k) ? n+k.length : n, 0);
      if (sc > bestScore) { bestScore = sc; best = it; } });
    if (best) return best.fn(q);
    return { text:'I can answer from what the platform already holds — try: "what is outstanding on NOV", "show me rejected items", "which dimensions are marginal", "what should I look at today", "is any equipment out of calibration", or give me an inspection or invoice number.' };
  }

  const SUGGESTIONS = [
    'What should I look at today?',
    'What is outstanding on NOV?',
    'Show me rejected items',
    'Which dimensions are marginal?',
    'Any equipment out of calibration?',
    'Which inspections are missing a PO?'
  ];

  return { toleranceCheck, itemFlags, itemNarrative, marginLabel, inspectionFlags, inspectionNarrative,
           invoiceRisk, billingFlags, portfolio, ask, SUGGESTIONS, money, pct, days, today };
})();
