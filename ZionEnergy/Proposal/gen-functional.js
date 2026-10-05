const K = require('./build-docx.js');
const { Document, Packer, Paragraph, T, gap, H1, H2, H3, body, bullet, callout,
        numbering, pageSetup, docHeader, docFooter, Table, TableRow, TableCell, WidthType,
        ShadingType, BorderStyle, noBorder, INK, INK2, INK3, BRAND, BRANDD, SOFT, MONO, UI, W, fs } = K;

const core = require('./scope-data.js').core;
const addons = require('./scope-data.js').addons;

const modHead = (n, title, eff, inv) => new Table({
  width:{ size:W, type:WidthType.DXA }, columnWidths:[7000, 1600, 1480], borders:noBorder,
  rows:[ new TableRow({ children:[
    new TableCell({ width:{ size:7000, type:WidthType.DXA }, borders:noBorder, margins:{ left:0, top:60, bottom:40 },
      children:[ new Paragraph({ children:[
        ...(n?[T(n+'   ',{ font:MONO, size:17, bold:true, color:BRAND })]:[]),
        T(title,{ size:22, bold:true, color:INK }) ] }) ]}),
    new TableCell({ width:{ size:1600, type:WidthType.DXA }, borders:noBorder, margins:{ top:60, bottom:40 },
      children:[ new Paragraph({ alignment:'right', children:[ T(eff||'',{ font:MONO, size:17, color:INK3 }) ] }) ]}),
    new TableCell({ width:{ size:1480, type:WidthType.DXA }, borders:noBorder, margins:{ top:60, bottom:40, right:0 },
      children:[ new Paragraph({ alignment:'right', children:[ T(inv||'',{ font:MONO, size:18, bold:true, color:BRANDD }) ] }) ]}),
  ]})]
});

const children = [
  new Paragraph({ children:[ T('FUNCTIONAL SCOPE · ZION UNIFIED PLATFORM',
    { font:MONO, size:16, bold:true, color:BRAND, characterSpacing:16 }) ], spacing:{ after:60 } }),
  H1('Functional Scope'),
  body('This document sets out the functionality included in Phase 1 of the Zion Unified platform, and the functionality available as optional modules. It is the reference for what is being built.', { size:21 }),
  gap(160),
  callout('How to read this.','Everything listed under Phase 1 is included in the Phase 1 investment. Everything listed under Optional Modules is available separately at the stated effort and price. Functionality not described in this document has not been scoped and would be assessed and quoted on request.'),
  H2('Phase 1 — Zion Unified Core'),
];

core.forEach(([n,title,items]) => {
  children.push(H3(n, title));
  items.forEach(i => children.push(bullet(i)));
});

children.push(H2('Optional Modules'));
addons.forEach(([title, eff, inv, items]) => {
  children.push(modHead(null, title, eff, inv));
  items.forEach(i => children.push(bullet(i)));
});

children.push(gap(260));
children.push(callout('Assumptions.','Zion provides access to the existing system and its database for migration, supplies licensed copies of any standards to be encoded, and makes operational staff available for walkthrough sessions and user acceptance testing. Third-party accounts — telephony, payment gateway, app store, mapping — are held in Zion’s name. Hosting infrastructure costs are billed to Zion at cost.'));

const doc = new Document({ numbering, styles:{ default:{ document:{ run:{ font:UI, size:20, color:INK } } } },
  sections:[{ properties:{ page: pageSetup },
    headers:{ default: docHeader('FUNCTIONAL SCOPE\nZION UNIFIED PLATFORM') },
    footers:{ default: docFooter('ZION UNIFIED · FUNCTIONAL SCOPE · NILE TECHNOLOGIES') },
    children }]});

Packer.toBuffer(doc).then(b => { fs.writeFileSync('Zion Unified - Functional Scope.docx', b);
  console.log('functional docx written', b.length, 'bytes'); });
