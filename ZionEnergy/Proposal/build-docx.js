const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
  LevelFormat, PageBreak, PageOrientation, Header, Footer, PageNumber,
  ExternalHyperlink, convertInchesToTwip
} = require('docx');

/* ---------- design tokens ---------- */
const INK='18181B', INK2='52525B', INK3='A1A1AA', LINE='E4E4E7', PANEL='FAFAFA';
const BRAND='C2410C', BRANDD='9A3412', SOFT='FFF3EC', OK='15803D';
const UI='Calibri', MONO='Consolas';
const W = 10080;                    /* content width, DXA (Letter, 0.75in margins) */

const noBorder = { top:{style:BorderStyle.NONE,size:0,color:'auto'}, bottom:{style:BorderStyle.NONE,size:0,color:'auto'},
  left:{style:BorderStyle.NONE,size:0,color:'auto'}, right:{style:BorderStyle.NONE,size:0,color:'auto'},
  insideHorizontal:{style:BorderStyle.NONE,size:0,color:'auto'}, insideVertical:{style:BorderStyle.NONE,size:0,color:'auto'} };
const hairline = c => ({ style:BorderStyle.SINGLE, size:4, color:c||LINE });

const T = (t,o={}) => new TextRun(Object.assign({ text:t, font:UI, size:20, color:INK }, o));
const P = (runs,o={}) => new Paragraph(Object.assign({ children:Array.isArray(runs)?runs:[runs] }, o));
const gap  = (n=120) => new Paragraph({ children:[], spacing:{ after:n } });

const H1 = t => new Paragraph({ children:[T(t,{ size:44, bold:true, color:INK })],
  spacing:{ before:200, after:140 } });
const H2 = t => new Paragraph({ children:[T(t.toUpperCase(),{ size:24, bold:true, color:INK, characterSpacing:14 })],
  spacing:{ before:340, after:120 }, border:{ bottom:{ style:BorderStyle.SINGLE, size:12, color:INK, space:6 } } });
const H3 = (n,t) => new Paragraph({ children:[
    ...(n ? [T(n+'  ',{ font:MONO, size:18, color:BRAND, bold:true })] : []),
    T(t,{ size:22, bold:true, color:INK })],
  spacing:{ before:220, after:80 } });
const body = (t,o={}) => new Paragraph({ children:[T(t, Object.assign({ color:INK2, size:20 }, o))],
  spacing:{ after:100 }, alignment:AlignmentType.LEFT });
const bullet = t => new Paragraph({ children:[T(t,{ color:INK2, size:19 })],
  numbering:{ reference:'b', level:0 }, spacing:{ after:20 } });

/* callout box */
const callout = (boldLead, rest) => new Table({
  width:{ size:W, type:WidthType.DXA }, columnWidths:[W],
  borders:{ ...noBorder, left:{ style:BorderStyle.SINGLE, size:18, color:BRAND } },
  rows:[ new TableRow({ children:[ new TableCell({
    width:{ size:W, type:WidthType.DXA },
    shading:{ type:ShadingType.CLEAR, fill:PANEL, color:'auto' },
    margins:{ top:140, bottom:140, left:180, right:180 },
    children:[ new Paragraph({ children:[
      T(boldLead+' ',{ bold:true, color:INK, size:19 }), T(rest,{ color:INK2, size:19 }) ] }) ]
  })]})]
});

/* generic table */
function table(cols, head, rows, opts={}) {
  const mk = (txt, o={}) => new Paragraph({ children:[T(String(txt), Object.assign({ size:19 }, o.run||{}))],
    alignment:o.align||AlignmentType.LEFT });
  const headRow = head ? [ new TableRow({ tableHeader:true, children: head.map((h,i)=> new TableCell({
      width:{ size:cols[i], type:WidthType.DXA },
      shading:{ type:ShadingType.CLEAR, fill:PANEL, color:'auto' },
      margins:{ top:90, bottom:90, left:130, right:130 },
      children:[ mk(h.toUpperCase(), { run:{ bold:true, size:15, color:INK3, characterSpacing:12 },
        align: i>0 && opts.rightFrom!==undefined && i>=opts.rightFrom ? AlignmentType.RIGHT : AlignmentType.LEFT }) ]
    }))})] : [];
  const bodyRows = rows.map(r => new TableRow({ children: r.cells.map((c,i)=> new TableCell({
      width:{ size:cols[i], type:WidthType.DXA },
      shading: r.shade ? { type:ShadingType.CLEAR, fill:r.shade, color:'auto' } : undefined,
      margins:{ top:80, bottom:80, left:130, right:130 },
      borders: r.topRule ? { top:{ style:BorderStyle.SINGLE, size:12, color:INK } } : undefined,
      children:[ mk(c, { run:{ bold:!!r.bold, color:r.color||INK2, font:(i>=(opts.monoFrom??99))?MONO:UI },
        align: opts.rightFrom!==undefined && i>=opts.rightFrom ? AlignmentType.RIGHT : AlignmentType.LEFT }) ]
    }))}));
  return new Table({ width:{ size:cols.reduce((a,b)=>a+b,0), type:WidthType.DXA }, columnWidths:cols,
    borders:{ ...noBorder, insideHorizontal:hairline(), bottom:hairline() },
    rows:[...headRow, ...bodyRows] });
}

const numbering = { config:[{ reference:'b', levels:[{ level:0, format:LevelFormat.BULLET, text:'•',
  alignment:AlignmentType.LEFT, style:{ paragraph:{ indent:{ left:300, hanging:190 } },
  run:{ color:BRAND, size:19 } } }] }] };

const pageSetup = { size:{ width:12240, height:15840 },
  margin:{ top:1080, right:1080, bottom:1080, left:1080 } };

function docHeader(sub) {
  return new Header({ children:[
    new Table({ width:{ size:W, type:WidthType.DXA }, columnWidths:[W*0.5, W*0.5], borders:noBorder,
      rows:[ new TableRow({ children:[
        new TableCell({ width:{ size:W*0.5, type:WidthType.DXA }, borders:noBorder, margins:{ left:0 },
          children:[ new Paragraph({ children:[ T('ZION ENERGY SERVICES',{ bold:true, size:22, characterSpacing:24 }) ] }) ]}),
        new TableCell({ width:{ size:W*0.5, type:WidthType.DXA }, borders:noBorder, margins:{ right:0 },
          children:[ new Paragraph({ alignment:AlignmentType.RIGHT, children:[
            T(sub,{ font:MONO, size:15, color:INK3, characterSpacing:10 }) ] }) ]}),
      ]})]}),
    new Paragraph({ children:[], border:{ bottom:{ style:BorderStyle.SINGLE, size:18, color:INK, space:4 } },
      spacing:{ after:220 } })
  ]});
}
function docFooter(left) {
  return new Footer({ children:[
    new Paragraph({ border:{ top:{ style:BorderStyle.SINGLE, size:4, color:LINE, space:6 } },
      children:[
        T(left,{ font:MONO, size:14, color:INK3, characterSpacing:8 }),
        new TextRun({ children:[ '\t\t' ], font:UI }),
        T('PAGE ',{ font:MONO, size:14, color:INK3 }),
        new TextRun({ children:[ PageNumber.CURRENT ], font:MONO, size:14, color:INK3 }),
        T(' OF ',{ font:MONO, size:14, color:INK3 }),
        new TextRun({ children:[ PageNumber.TOTAL_PAGES ], font:MONO, size:14, color:INK3 }),
      ],
      tabStops:[{ type:'right', position: W }] })
  ]});
}

module.exports = { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell,
  WidthType, BorderStyle, ShadingType, PageBreak, T, P, gap, H1, H2, H3, body, bullet, callout, table,
  numbering, pageSetup, docHeader, docFooter, noBorder, hairline,
  INK, INK2, INK3, LINE, PANEL, BRAND, BRANDD, SOFT, OK, UI, MONO, W, fs };
