const K = require('./build-docx.js');
const { Document, Packer, Paragraph, PageBreak, T, gap, H1, H2, body, bullet, callout, table,
        numbering, pageSetup, docHeader, docFooter, AlignmentType, Table, TableRow, TableCell,
        WidthType, ShadingType, BorderStyle, noBorder, INK, INK2, INK3, PANEL, BRAND, BRANDD, SOFT, OK, MONO, UI, W, fs } = K;

const wins = [
  ['Margin on every job','Core','Revenue against delivered cost — crew hours at their real pay rate, overtime, mileage and consumables. Profitability by job, customer, site, inspector and service type. You have never had this number.'],
  ['Live cost per site','Core','Geo-fenced check in and out ties every hour a crew spends to the customer’s location. You can see what a site is costing you while the job is still running, not after the invoice.'],
  ['All customers in one place','Core','One customer master. Sites, divisions, contacts, SLAs, business rules, price sheets, connection standards, tool templates and full job history — entered once, used by both halves of the business.'],
  ['The full customer view','Core','Open a customer and see everything: every job, every inspection, every item, every report, every invoice, what they owe and how they actually pay.'],
  ['Your inspection logic, built in','Core','Asset → governing standard → procedure → NDT method → technique → equipment → acceptance criteria → inspector qualification → report. An inspector cannot apply a drill-collar rule to a rig weld.'],
  ['A modern, fast platform','Core','A brand-new lightweight stack replacing five years of accumulated code. Fast, iPad-ready for the field, and built so new features take days rather than months.'],
  ['Internalised communication','Add-on','Crews call and message customers through the platform. They never see the number, it never lands on their phone, and one switch removes a leaver from every conversation at once.'],
  ['Training & certifications','Add-on','On-the-job training, competency records and certification expiry tracked against the qualifications each inspection procedure requires.'],
  ['Customer portal','Add-on','Your customers raise inspection tickets, follow job status, download reports and see what is outstanding — without calling your office.'],
  ['Zion Intelligence','Phase 2','The AI layer: automatic inspection packages from job type, AI-assisted reports and QC, and a system that tells you what needs attention before you go looking.'],
];

const winTable = new Table({
  width:{ size:W, type:WidthType.DXA }, columnWidths:[3000, 7080],
  borders:{ ...noBorder, insideHorizontal:K.hairline(), bottom:K.hairline() },
  rows: wins.map(([name,tag,desc]) => new TableRow({ children:[
    new TableCell({ width:{ size:3000, type:WidthType.DXA }, margins:{ top:110, bottom:110, left:0, right:140 },
      borders:{ left:{ style:BorderStyle.SINGLE, size:18, color: tag==='Core'?BRAND:'D4D4D8' } },
      children:[
        new Paragraph({ children:[ T(name,{ bold:true, size:21 }) ], indent:{ left:130 } }),
        new Paragraph({ children:[ T(tag.toUpperCase(),{ font:MONO, size:14, bold:true,
          color: tag==='Core'?BRANDD:INK3, characterSpacing:12 }) ], indent:{ left:130 }, spacing:{ before:40 } }) ]}),
    new TableCell({ width:{ size:7080, type:WidthType.DXA }, margins:{ top:110, bottom:110, left:0, right:0 },
      children:[ new Paragraph({ children:[ T(desc,{ color:INK2, size:19 }) ] }) ]}),
  ]}))
});

const effort = [
  ['Platform foundation — access control, roles, kill switch, audit trail, iPad-optimised interface','25 days'],
  ['Customer, site and division master — business rules, price sheets, contacts, documents','30 days'],
  ['Workforce — employees, certifications, pay rules, crews and teams','12 days'],
  ['Jobs and dispatch — absorbing and extending the existing CrewView platform','10 days'],
  ['Attendance, time, mileage and live site cost tracking','14 days'],
  ['Standards, procedures, methods and acceptance criteria backbone','30 days'],
  ['Tool and item templates — the dynamic form and report engine','28 days'],
  ['Inspections, inspected items, measurements and the tolerance engine','55 days'],
  ['Equipment and calibration register','12 days'],
  ['Job safety analysis','8 days'],
  ['Reporting engine and document output','30 days'],
  ['Billing, invoicing, profitability and margin analysis','35 days'],
  ['Data migration — active customers and recent history','15 days'],
  ['Quality assurance, user acceptance testing, deployment and handover','36 days'],
];
const addons = [
  ['Communications Hub — in-app calls and messaging, masked customer numbers, call history, instant revocation','48 days','$9,600'],
  ['Customer Portal — ticket raising, job status, report downloads, outstanding invoices','45 days','$9,000'],
  ['LMS & Certifications — on-the-job training, competency matrix, certification renewals','60 days','$12,000'],
  ['Company Document Centre with AI — handbook, processes, W-9, COI, share links and email delivery','42 days','$8,400'],
  ['Asset Management — maintenance, parts, supplies, vendors, purchase orders, vendor invoices','80 days','$16,000'],
  ['Advanced Billing — recurring invoices, customer statements, commission, payment gateway','55 days','$11,000'],
  ['QMS & Safety Data Sheets — corrective actions, document control, supplier SDS register','32 days','$6,400'],
  ['Standards content encoding — API and AWS acceptance criteria captured into the platform','30 days','$6,000'],
  ['Full historical migration — the complete five-year archive rather than active records only','38 days','$7,600'],
  ['Zion Intelligence (AI layer) — inspection packages, AI reports and QC, assisted invoicing','—','Phase 2'],
];

const priceBox = new Table({
  width:{ size:W, type:WidthType.DXA }, columnWidths:[6400, 3680],
  borders:noBorder,
  rows:[ new TableRow({ children:[
    new TableCell({ width:{ size:6400, type:WidthType.DXA },
      shading:{ type:ShadingType.CLEAR, fill:INK, color:'auto' },
      margins:{ top:200, bottom:200, left:200, right:200 },
      children:[
        new Paragraph({ children:[ T('PHASE 1 — ZION UNIFIED CORE',{ font:MONO, size:15, color:'A1A1AA', characterSpacing:14 }) ] }),
        new Paragraph({ children:[ T('$40,000',{ size:56, bold:true, color:'FFFFFF' }) ], spacing:{ before:60 } }),
        new Paragraph({ children:[ T('340 man-days · delivery targeted for the new year',{ size:18, color:'D4D4D8' }) ], spacing:{ before:40 } }),
      ]}),
    new TableCell({ width:{ size:3680, type:WidthType.DXA },
      margins:{ top:200, bottom:200, left:200, right:200 },
      borders:{ top:{style:BorderStyle.SINGLE,size:18,color:INK}, bottom:{style:BorderStyle.SINGLE,size:18,color:INK},
                left:{style:BorderStyle.SINGLE,size:18,color:INK}, right:{style:BorderStyle.SINGLE,size:18,color:INK} },
      children:[
        new Paragraph({ children:[ T('STANDARD DAY RATE',{ font:MONO, size:15, color:INK3, characterSpacing:14 }) ] }),
        new Paragraph({ children:[ T('$200',{ size:56, bold:true, color:INK }) ], spacing:{ before:60 } }),
        new Paragraph({ children:[ T('Applied to all future modules',{ size:18, color:INK2 }) ], spacing:{ before:40 } }),
      ]}),
  ]})]
});

const doc = new Document({ numbering, styles:{ default:{ document:{ run:{ font:UI, size:20, color:INK } } } },
  sections:[{
    properties:{ page: pageSetup },
    headers:{ default: docHeader('COMMERCIAL PROPOSAL\nZION UNIFIED PLATFORM') },
    footers:{ default: docFooter('ZION UNIFIED · COMMERCIAL PROPOSAL · NILE TECHNOLOGIES') },
    children:[
      new Paragraph({ children:[ T('ONE PLATFORM. ONE RECORD. ONE NUMBER THAT FINALLY MAKES SENSE.',
        { font:MONO, size:16, bold:true, color:BRAND, characterSpacing:16 }) ], spacing:{ after:60 } }),
      H1('Everything Zion does, in one system.'),
      body('Today the crew goes out on one system and the report comes back on another. Nothing joins up, so nothing can be measured. Zion Unified puts dispatch, inspection, reporting and billing on a single record — and for the first time shows you what every job actually earned.', { size:22 }),
      H2('What changes for Zion'),
      winTable,
      gap(200),
      callout('Why this order.','The intelligence layer is only possible once the operating system underneath it exists as structured data — assets, standards, procedures, measurements and costs all in one place. Build the backbone first and the AI becomes configuration rather than a research project. That is why it follows Phase 1 rather than competing with it.'),

      new Paragraph({ children:[ new PageBreak() ] }),

      H2('Phase 1 — Zion Unified Core'),
      table([8280,1800], ['Module','Effort'],
        effort.map(([m,e])=>({ cells:[m,e] })).concat([{ cells:['Total engineering effort','340 days'], bold:true, color:INK, topRule:true }]),
        { rightFrom:1, monoFrom:1 }),
      gap(240),
      table([8280,1800], null, [
        { cells:['340 man-days at our standard rate of $200 per day','$68,000'] },
        { cells:['Less — CrewView dispatch already delivered and absorbed into the platform','− $22,600'], color:OK },
        { cells:['Less — foundation credit, applied once at the start of the partnership','− $5,400'], color:OK },
        { cells:['Phase 1 investment','$40,000'], bold:true, color:INK, topRule:true },
      ], { rightFrom:1, monoFrom:1 }),
      gap(240),
      priceBox,

      H2('Optional modules'),
      table([6900,1500,1680], ['Module','Effort','Investment'],
        addons.map(([m,e,i])=>({ cells:[m,e,i] })), { rightFrom:1, monoFrom:1 }),

      H2('Payment schedule'),
      bullet('20% — kickoff and architecture agreed'),
      bullet('20% — customer, workforce and standards foundation in staging'),
      bullet('20% — inspection and reporting engine demonstrated'),
      bullet('20% — billing, profitability and migration complete'),
      bullet('20% — go-live plus 30 days of stable operation'),

      H2('Included as standard'),
      bullet('Four months of post-deployment support'),
      bullet('Cloud hosting setup and deployment'),
      bullet('Existing mobile applications updated for the unified platform'),
      bullet('No recurring licence or platform fees payable to Nile'),
      bullet('Full source code and intellectual property transferred to Zion'),

      gap(240),
      callout('Total platform position.','With the $22,600 already invested in dispatch, Zion owns the complete operating system of the business for $62,600 — replacing a platform that has been under development for five years and is still not finished.'),
    ]
  }]});

Packer.toBuffer(doc).then(b => { fs.writeFileSync('Zion Unified - Commercial Proposal.docx', b);
  console.log('commercial docx written', b.length, 'bytes'); });
