/* Zion Platform — demo seed data.
   Representative of live TRS structure: customers -> locations -> divisions,
   connection standards with pin/box tolerance ranges, inspections -> items ->
   connections -> pricing -> invoices. Figures are illustrative. */
window.ZD = (function () {

  /* ---------- ORGANISATION ---------- */
  const customers = [
    { id:'CUS-01', code:'ALL-0012', name:'Alliance Drilling Tools', industry:'Downhole Tools', terms:'Net 30', tax:8.25,
      locations:[{ id:'LOC-01', name:'Alliance Drilling Tools', city:'Midland', state:'TX', addr:'3718 N County Road 1148', territory:'United States', divisions:['North Yard','Shop'] }] },
    { id:'CUS-02', code:'NOV-0008', name:'NOV', industry:'Drilling Equipment', terms:'Net 45', tax:8.25,
      locations:[{ id:'LOC-02', name:'NOV — I20 & 1788', city:'Odessa', state:'TX', addr:'I20 and 1788', territory:'United States', divisions:['Motor Shop'] }] },
    { id:'CUS-03', code:'TUB-0004', name:'Tubular Solutions', industry:'Tubular Services', terms:'Net 15', tax:8.25,
      locations:[{ id:'LOC-03', name:'Tubular Solutions', city:'Midland', state:'TX', addr:'10100 Liberator Lane', territory:'United States', divisions:['Main'] }] },
    { id:'CUS-04', code:'GOR-0007', name:'Gordon Technologies', industry:'MWD / Directional', terms:'Net 30', tax:8.25,
      locations:[{ id:'LOC-04', name:'Gordon Technologies', city:'Odessa', state:'TX', addr:'12615 W CR 137', territory:'United States', divisions:['MWD'] }] },
    { id:'CUS-05', code:'RAN-0011', name:'Ranger Energy Services', industry:'Well Service', terms:'Net 45', tax:8.25,
      locations:[{ id:'LOC-05', name:'Ranger Energy (PA Yard)', city:'Midland', state:'TX', addr:'East Hwy 80', territory:'United States', divisions:['PA Yard'] }] },
    { id:'CUS-06', code:'NXL-0019', name:'NXL Technologies', industry:'Pressure Control', terms:'Net 30', tax:8.25,
      locations:[{ id:'LOC-06', name:'NXL Technologies', city:'Midland', state:'TX', addr:'W County Rd', territory:'United States', divisions:['Main'] }] },
    { id:'CUS-07', code:'PRE-0001', name:'Premium Oilfield Technologies', industry:'Rental Tools', terms:'Net 15', tax:8.25,
      locations:[{ id:'LOC-07', name:'Premium Oilfield Technologies', city:'Midland', state:'TX', addr:'10207 W Industrial Ave', territory:'United States', divisions:['North division'] }] },
    { id:'CUS-08', code:'STE-0016', name:'Stealth Thru Tubing', industry:'Thru Tubing', terms:'Net 30', tax:8.25,
      locations:[{ id:'LOC-08', name:'Stealth Thru Tubing', city:'Oklahoma City', state:'OK', addr:'8533 SW 2nd St', territory:'United States', divisions:['Main'] }] }
  ];

  /* ---------- STANDARDS: connection tolerance library ---------- */
  const PIN = ['pin_od','bev_dia','pin_id','nose_dia','pin_length','srg_dia','srg_length','tong_space','cyl_dia'];
  const BOX = ['box_od','bev_dia','c_bore_dia','c_bore_depth','box_depth','bore_dia','bore_length','float_dia','float_length','fishing_neck'];
  const LABEL = { pin_od:'Pin OD', bev_dia:'Bev Dia', pin_id:'Pin ID', nose_dia:'Nose Dia', pin_length:'Pin Length',
    srg_dia:'SRG Dia', srg_length:'SRG Length', tong_space:'Tong Space', cyl_dia:'Cyl Dia', box_od:'Box OD',
    c_bore_dia:'C-bore Dia', c_bore_depth:'C-bore Depth', box_depth:'Box Depth', bore_dia:'Bore Dia',
    bore_length:'Bore Length', float_dia:'Float Dia', float_length:'Float Length', fishing_neck:'Fishing Neck' };

  const connectionTypes = [
    { id:'CT-01', name:'HLNST54', reface:'Double Shoulder RF', ranges:{
      pin:{ pin_od:[6.453,6.483], bev_dia:[5.529,5.559], pin_id:[4.826,4.856], pin_length:[4.496,5.004] },
      box:{ box_od:[6.453,6.483], bev_dia:[5.529,5.559], c_bore_dia:[5.660,5.706], box_depth:[5.002,5.010] } } },
    { id:'CT-02', name:'6 5/8 REG', reface:'API Reface', ranges:{
      pin:{ pin_od:[7.938,8.063], bev_dia:[7.500,7.594], pin_id:[3.688,3.812], pin_length:[4.938,5.062], cyl_dia:[5.812,5.938] },
      box:{ box_od:[7.875,8.000], bev_dia:[7.688,7.812], c_bore_dia:[5.938,6.062], c_bore_depth:[0.625,0.750], box_depth:[5.375,5.500] } } },
    { id:'CT-03', name:'NC-50', reface:'API Reface', ranges:{
      pin:{ pin_od:[6.375,6.438], bev_dia:[6.156,6.219], pin_id:[3.000,3.125], pin_length:[4.500,4.625] },
      box:{ box_od:[6.375,6.438], c_bore_dia:[5.281,5.344], box_depth:[4.750,4.875] } } },
    { id:'CT-04', name:'XT-39', reface:'Double Shoulder RF', ranges:{
      pin:{ pin_od:[5.250,5.320], bev_dia:[4.930,5.000], pin_id:[2.688,2.750], pin_length:[3.875,4.000] },
      box:{ box_od:[5.250,5.320], c_bore_dia:[4.312,4.375], box_depth:[4.125,4.250] } } },
    { id:'CT-05', name:'DS-50', reface:'Double Shoulder RF', ranges:{
      pin:{ pin_od:[6.500,6.570], bev_dia:[6.219,6.281], pin_id:[3.250,3.320], pin_length:[4.625,4.750] },
      box:{ box_od:[6.500,6.562], c_bore_dia:[5.375,5.438], box_depth:[4.875,5.000] } } },
    { id:'CT-06', name:'4 1/2 REG', reface:'API Reface', ranges:{
      pin:{ pin_od:[5.625,5.688], bev_dia:[5.281,5.344], pin_id:[2.250,2.375], pin_length:[4.000,4.125] },
      box:{ box_od:[5.625,5.688], c_bore_dia:[4.156,4.219], box_depth:[4.250,4.375] } } }
  ];

  /* ---------- MASTER VOCABULARY (one polymorphic settings table in TRS) ---------- */
  const master = {
    method:      ['MPI','LPI','VT','UT','Dimensional','EMI'],
    material:    ['Steel','Non Mag','Inconel'],
    tool_type:   ['Single','Multiple'],
    uom:         ['PER TOOL','PER CONNECTION','PER FT','PER HR','MILEAGE','EACH'],
    yard:        ['North Yard','Shop','PA Yard','Motor Shop'],
    acceptance:  ['OK','BC — Body Crack','DT — Damaged Thread','DS — Damaged Shoulder','WT — Wall Thickness','PIT — Pitting','REJ — Reject'],
    spec:        ['ZION Spec','DS-1 Cat 3-5','NS-2','API RP7G-2','Customer Spec'],
    reface:      ['API Reface','Double Shoulder RF','No Reface'],
    misc:        ['API Reface','1" Buff','Hardbands','Flapper Wheel Connection','MPI Connection','LPI Connection','Shop Clean','Tool Clean','Dry Molly','Standby Charge','Per Hour Inspection','Mileage']
  };

  const reportFormats = [
    { id:'RF-01', name:'Thru Tubing Motor', cols:[['Utt Wall #1','Body'],['Utt Wall #2','Body'],['Utt Wall #3','Body'],['New Weld / Existing Weld','Body'],['Item Status','Tool Status']] },
    { id:'RF-02', name:'Drill Pipe / Tubular', cols:[['Pin Connection','Connection'],['Box Connection','Connection'],['Body Wall','Body'],['Item Status','Tool Status']] },
    { id:'RF-03', name:'Bushing Pullers', cols:[['Seal','Body'],['Seal Status','Tool Status']] },
    { id:'RF-04', name:'Rig Inspection', cols:[['Mast Section','Body'],['Weld Condition','Body'],['Item Status','Tool Status']] },
    { id:'RF-05', name:'NDT Crossover', cols:[['Pin Connection','Connection'],['Box Connection','Connection'],['Item Status','Tool Status']] }
  ];


  /* ---------- TOOL TEMPLATES (the per-customer schema engine) ----------
     A tool template defines, for one customer, what a given tool IS: its identity,
     the methods and materials it is inspected under, which report format it prints
     on, and — critically — the custom columns that the inspection entry form and the
     printed report both render from. Multi-part tools carry a parts list; every part
     is measured against those same custom columns. */
  const toolTemplates = [
    { id:'TT-01', cust:'CUS-07', description:'Demay Pump', abbreviation:'DMP', type:'Multiple',
      toolSize:'N/A', modelType:'N/A', serialPrefix:'DP', methods:['MPI','VT'], materials:['Steel'],
      reportType:'Bushing Pullers', miscItems:['Shop Clean','1" Buff'], weldReport:false,
      status:'Active', approved:true, comment:'Six-part assembly. Seal condition drives the verdict.',
      columns:[ { label:'Seal', type:'text' },
                { label:'Seal Status', type:'status', options:['OK','REJECTED','DBR'] } ],
      parts:[ { partNo:'P-1', equipment:'Demay Pump', material:'Steel' },
              { partNo:'P-2', equipment:'Demay Pump', material:'Steel' },
              { partNo:'P-3', equipment:'Demay Pump', material:'Steel' },
              { partNo:'P-4', equipment:'Demay Pump', material:'Steel' },
              { partNo:'P-5', equipment:'Demay Pump', material:'Steel' },
              { partNo:'P-6', equipment:'Demay Pump', material:'Steel' } ] },

    { id:'TT-02', cust:'CUS-07', description:'Swivel (XK-90)', abbreviation:'SWV', type:'Multiple',
      toolSize:'XK-90', modelType:'N/A', serialPrefix:'SW', methods:['MPI','LPI','VT'], materials:['Steel'],
      reportType:'Bushing Pullers', miscItems:['Shop Clean'], weldReport:true, status:'Active', approved:true,
      comment:'', columns:[ { label:'Bearing', type:'text' },
                            { label:'Bearing Status', type:'status', options:['OK','REJECTED','DBR'] },
                            { label:'Weld Condition', type:'status', options:['OK','REJECTED'] } ],
      parts:[ { partNo:'SW-A', equipment:'Swivel Body', material:'Steel' },
              { partNo:'SW-B', equipment:'Bearing Pack', material:'Steel' },
              { partNo:'SW-C', equipment:'Gooseneck', material:'Steel' } ] },

    { id:'TT-03', cust:'CUS-01', description:'Steel Pup Joint', abbreviation:'SPJ', type:'Single',
      toolSize:'4 1/2"', modelType:'—', serialPrefix:'APJ', methods:['LPI','VT','Dimensional'],
      materials:['Steel'], reportType:'Drill Pipe / Tubular', miscItems:['API Reface','Flapper Wheel Connection'],
      weldReport:false, status:'Active', approved:true, comment:'',
      columns:[ { label:'Body Wall', type:'text' },
                { label:'Hardbanding', type:'status', options:['OK','REJECTED','N/A'] } ], parts:[] },

    { id:'TT-04', cust:'CUS-01', description:'Steel Crossover', abbreviation:'SXO', type:'Single',
      toolSize:'6 5/8"', modelType:'—', serialPrefix:'AX', methods:['MPI','VT'], materials:['Steel'],
      reportType:'NDT Crossover', miscItems:['API Reface'], weldReport:false, status:'Active', approved:true,
      comment:'', columns:[ { label:'Shoulder', type:'status', options:['OK','REJECTED'] } ], parts:[] },

    { id:'TT-05', cust:'CUS-02', description:'Thru Tubing Motor', abbreviation:'TTM', type:'Multiple',
      toolSize:'3 1/8"', modelType:'NOV', serialPrefix:'NOV-TTM', methods:['MPI','LPI','VT','UT'],
      materials:['Steel'], reportType:'Thru Tubing Motor', miscItems:['Dry Molly','Shop Clean'],
      weldReport:false, status:'Active', approved:false,
      comment:'Awaiting customer approval of the wall-thickness columns.',
      columns:[ { label:'Utt Wall #1', type:'text' }, { label:'Utt Wall #2', type:'text' },
                { label:'Utt Wall #3', type:'text' },
                { label:'Rotor / Stator', type:'status', options:['OK','REJECTED','DBR'] } ],
      parts:[ { partNo:'TOP', equipment:'Power Section', material:'Steel' },
              { partNo:'MID', equipment:'Transmission', material:'Steel' },
              { partNo:'BTM', equipment:'Bearing Pack', material:'Steel' } ] }
  ];

  /* ---------- ITEM TEMPLATES ----------
     Reusable definitions for single items a customer sends in repeatedly. Selecting
     one when adding an inspected item pre-fills the identity, methods, materials and
     the connection standard the fleet runs. */
  const itemTemplates = [
    { id:'IX-01', cust:'CUS-01', description:'Steel Pup Joint 4 1/2', prefix:'APJ', size:'4 1/2"',
      methods:['LPI','VT','Dimensional'], materials:['Steel'], connection:'NC-50',
      misc:['API Reface','Flapper Wheel Connection'], rate:105, status:'Active' },
    { id:'IX-02', cust:'CUS-01', description:'Non Mag Stabilizer', prefix:'ASM', size:'6 3/4"',
      methods:['LPI','VT','Dimensional'], materials:['Non Mag'], connection:'NC-50',
      misc:['Hardbands'], rate:130, status:'Active' },
    { id:'IX-03', cust:'CUS-02', description:'Mud Motor Section', prefix:'NOV', size:'3 1/8"',
      methods:['MPI','LPI','VT'], materials:['Steel'], connection:'4 1/2 REG',
      misc:['Dry Molly'], rate:210, status:'Active' },
    { id:'IX-04', cust:'CUS-03', description:'Handling Plug', prefix:'T', size:'—',
      methods:['MPI','VT'], materials:['Steel'], connection:'6 5/8 REG',
      misc:['Flapper Wheel Connection'], rate:40, status:'Active' },
    { id:'IX-05', cust:'CUS-04', description:'MWD Collar', prefix:'GT', size:'4 3/4"',
      methods:['MPI','UT'], materials:['Non Mag'], connection:'XT-39',
      misc:['MPI Connection'], rate:145, status:'Active' }
  ];


  /* ---------- JOB SAFETY ANALYSIS ----------
     A JSA template is the hazard assessment a crew works to. Each inspection
     selects one, and the crew signs it before work starts. */
  const jsaTemplates = [
    { id:'JSA-01', name:'General Standard Inspection JSA', status:'Active', cust:null,
      steps:[
        { step:'Arrange tools for cleaning', hazard:'Pinch points, overhead loads, slips and trips',
          control:'Be deliberate with hand placement. Keep walkways clear and clean up after yourself.' },
        { step:'Inspect items and tools', hazard:'Chemical overspray, restricted vision, head strike',
          control:'Wear eye protection. Do not put your head under a suspended tool.' },
        { step:'Move tools between racks', hazard:'Overhead loads, forklift traffic',
          control:'Stay in the driver’s line of sight. Never stand beneath a suspended load.' },
        { step:'Demagnetise and mark', hazard:'Sharp edges, residual magnetism',
          control:'Gloves on. Verify field strength before handling.' } ],
      equipment:['Hard Hat','Safety Boots','Safety Glasses','Gloves','Face Shields','Hearing Protection',
                 'Apron / Protective Clothing','H2S Monitors'],
      notes:'Standard shop inspection. Review before every shift.' },

    { id:'JSA-02', name:'Weld JSA', status:'Active', cust:null,
      steps:[
        { step:'Set up welding area', hazard:'Fire, combustible material nearby',
          control:'Clear 35 ft radius. Fire watch posted and extinguisher within reach.' },
        { step:'Strike arc and weld', hazard:'Arc flash, UV burn, fume inhalation',
          control:'Welding hood, sleeves and screens. Local exhaust running.' },
        { step:'Post-weld inspection', hazard:'Hot metal contact',
          control:'Allow cool-down. Use tongs and heat-resistant gloves.' } ],
      equipment:['Hard Hat','Safety Boots','Safety Glasses','Gloves','Face Shields','Fire Extinguisher',
                 'Respiratory Protection','Barricades'],
      notes:'Hot work permit required before starting.' },

    { id:'JSA-03', name:'Drill Pipe', status:'Active', cust:null,
      steps:[
        { step:'Receive and rack tubulars', hazard:'Rolling pipe, crush injury',
          control:'Chock every rack. Never place hands between joints.' },
        { step:'Clean and buff connections', hazard:'Rotating equipment, flying debris',
          control:'Guards in place. Full face shield.' },
        { step:'MPI and dimensional inspection', hazard:'Chemical exposure, UV',
          control:'Nitrile gloves, blacklight rated eyewear.' } ],
      equipment:['Hard Hat','Safety Boots','Safety Glasses','Gloves','Hearing Protection','Full Face'],
      notes:'' },

    { id:'JSA-04', name:'Mud Motor', status:'Active', cust:'CUS-02',
      steps:[
        { step:'Break down motor sections', hazard:'Stored energy, heavy components',
          control:'Two-person lift or crane. Bleed pressure before breaking connections.' },
        { step:'UT wall readings', hazard:'Couplant slip hazard',
          control:'Contain couplant. Clean as you go.' } ],
      equipment:['Hard Hat','Safety Boots','Safety Glasses','Gloves','Fall Protection'],
      notes:'NOV-specific. Confirm rotor is secured before handling.' },

    { id:'JSA-05', name:'Rig Site Inspection', status:'Active', cust:null,
      steps:[
        { step:'Site entry and orientation', hazard:'Unfamiliar site, live operations',
          control:'Report to company man. Attend site safety briefing.' },
        { step:'Mast and derrick inspection', hazard:'Working at height, dropped objects',
          control:'100% tie-off above 6 ft. Tool lanyards on everything.' },
        { step:'Egress', hazard:'H2S, vehicle traffic',
          control:'Monitor worn at all times. Reverse-park on arrival.' } ],
      equipment:['Hard Hat','Safety Boots','Safety Glasses','Gloves','Fall Protection','H2S Monitors',
                 'Work Permits','Barricades'],
      notes:'Customer site. Their permit system takes precedence.' }
  ];

  const ppe = ['Hard Hat','Safety Boots','Safety Glasses','Goggles','Face Shields','Gloves',
    'Apron / Protective Clothing','Hearing Protection','Fire Extinguisher','Fall Protection',
    'Respiratory Protection','Cartridge','Full Face','SCBA','Barricades','Work Permits',
    'Lock Out / Tag Out','H2S Monitors'];

  /* ---------- PEOPLE ---------- */
  const employees = [
    { id:'EMP-01', name:'Hunter Sisti',      role:'Super Admin',       territory:'United States', status:'Active', initials:'HS' },
    { id:'EMP-02', name:'Isaac Black',       role:'Lead Inspector',    territory:'United States', status:'Active', initials:'IB' },
    { id:'EMP-03', name:'Leo Lawrence',      role:'Inspector',         territory:'United States', status:'Active', initials:'LL' },
    { id:'EMP-04', name:'Sebastian Salgado', role:'Inspector',         territory:'United States', status:'Active', initials:'SS' },
    { id:'EMP-05', name:'Nick Palacios',     role:'Operations Manager',territory:'United States', status:'Active', initials:'NP' },
    { id:'EMP-06', name:'Dana Whitfield',    role:'Billing',           territory:'United States', status:'Active', initials:'DW' }
  ];

  /* Role -> what the platform exposes. Drives the demo role switcher. */
  const roles = {
    'Super Admin':       { modules:'all', dispatch:true,  customerContacts:true,  pricing:true,  ai:'full',
      note:'Sees both halves of the platform — inspection reporting and crew dispatch — plus pricing, margin and customer contact records.' },
    'Operations Manager':{ modules:['dashboard','inspections','items','accounts','dispatchRead'], dispatch:'read', customerContacts:true, pricing:false, ai:'ops',
      note:'Runs the schedule and the floor. Sees dispatch read-only, sees contacts, does not see rates or margin.' },
    'Inspector':         { modules:['dashboard','inspections','items'], dispatch:false, customerContacts:false, pricing:false, ai:'field',
      note:'Sees only their assigned inspections and the report they must produce. No dispatch, no pricing, and customer contact details are masked — all customer communication goes through the platform.' },
    'Billing':           { modules:['dashboard','invoices','accounts'], dispatch:false, customerContacts:true, pricing:true, ai:'billing',
      note:'Invoicing, collections and price sheets. No inspection editing.' }
  };

  /* ---------- HELPERS ---------- */
  const FR = [[0,''],[0.0625,'1/16'],[0.125,'1/8'],[0.1875,'3/16'],[0.25,'1/4'],[0.3125,'5/16'],[0.375,'3/8'],
    [0.4375,'7/16'],[0.5,'1/2'],[0.5625,'9/16'],[0.625,'5/8'],[0.6875,'11/16'],[0.75,'3/4'],[0.8125,'13/16'],
    [0.875,'7/8'],[0.9375,'15/16']];
  function toFraction(dec){
    if (dec == null) return null;
    const whole = Math.floor(dec); let rem = dec - whole; let best = FR[0];
    FR.forEach(f => { if (Math.abs(f[0]-rem) < Math.abs(best[0]-rem)) best = f; });
    if (!best[1]) return String(whole);
    return whole ? whole + ' ' + best[1] : best[1];
  }
  function parseFraction(str){
    if (str == null || str === '') return null;
    if (typeof str === 'number') return str;
    let total = 0, ok = false;
    String(str).trim().split(/\s+/).forEach(p => {
      if (p.indexOf('/') > -1) { const a = p.split('/'); const v = parseFloat(a[0]) / parseFloat(a[1]); if (!isNaN(v)) { total += v; ok = true; } }
      else { const v = parseFloat(p); if (!isNaN(v)) { total += v; ok = true; } }
    });
    return ok ? total : null;
  }

  /* ---------- INSPECTIONS ---------- */
  /* meas values are stored the way the field enters them: fractional imperial strings. */
  function conn(type, key, vals){ return { type, key, vals }; }

  const inspections = [
    { no:'6198', uuid:'e57e89', cust:'CUS-03', loc:'LOC-03', date:'2026-08-20', status:'In Progress',
      lead:'EMP-02', assist:[], po:'88233', rig:'—', division:'Main', spec:['ZION Spec','Customer Spec'],
      methods:['MPI','VT'], format:'RF-03', thirdParty:false,
      specs:{ whiteLight:432, blacklight:4327, bathStrength:0.3, bathBatch:'24E024', dryPowder:'23081', surfaceTemp:75, penDwell:10, devDwell:7 },
      jsa:'JSA-01', items:['IT-01','IT-02','IT-03'] },

    { no:'6194', uuid:'6abf27', cust:'CUS-01', loc:'LOC-01', date:'2026-08-20', status:'In Progress',
      lead:'EMP-03', assist:[], po:'—', rig:'—', division:'North Yard', spec:['DS-1 Cat 3-5','ZION Spec'],
      methods:['LPI','VT','Dimensional'], format:'RF-02', thirdParty:false,
      specs:{ whiteLight:401, blacklight:3980, bathStrength:0.28, bathBatch:'24E019', dryPowder:'23074', surfaceTemp:72, penDwell:10, devDwell:7 },
      jsa:'JSA-03', items:['IT-04','IT-05','IT-06','IT-07'] },

    { no:'6192', uuid:'027418', cust:'CUS-04', loc:'LOC-04', date:'2026-08-19', status:'Submitted',
      lead:'EMP-04', assist:['EMP-02'], po:'—', rig:'Nabors X12', division:'MWD', spec:['API RP7G-2'],
      methods:['MPI','UT'], format:'RF-05', thirdParty:false,
      specs:{ whiteLight:455, blacklight:4510, bathStrength:0.31, bathBatch:'24E024', dryPowder:'23081', surfaceTemp:78, penDwell:10, devDwell:7 },
      jsa:'JSA-01', items:['IT-08','IT-09'] },

    { no:'6187', uuid:'a41b02', cust:'CUS-01', loc:'LOC-01', date:'2026-08-19', status:'Invoiced',
      lead:'EMP-03', assist:[], po:'—', rig:'—', division:'Shop', spec:['ZION Spec'],
      methods:['MPI','VT'], format:'RF-02', thirdParty:false, invoice:'2715',
      specs:{ whiteLight:410, blacklight:4102, bathStrength:0.29, bathBatch:'24E019', dryPowder:'23074', surfaceTemp:74, penDwell:10, devDwell:7 },
      jsa:'JSA-03', items:['IT-10','IT-11'] },

    { no:'6185', uuid:'b7c331', cust:'CUS-02', loc:'LOC-02', date:'2026-08-18', status:'Approved',
      lead:'EMP-02', assist:[], po:'H&P 416', rig:'—', division:'Motor Shop', spec:['Customer Spec','ZION Spec'],
      methods:['MPI','LPI','VT'], format:'RF-01', thirdParty:false,
      specs:{ whiteLight:398, blacklight:3860, bathStrength:0.27, bathBatch:'24E019', dryPowder:'23074', surfaceTemp:71, penDwell:10, devDwell:7 },
      jsa:'JSA-04', items:['IT-12','IT-13'] },

    { no:'6181', uuid:'c92d15', cust:'CUS-05', loc:'LOC-05', date:'2026-08-18', status:'In Progress',
      lead:'EMP-04', assist:[], po:'—', rig:'—', division:'PA Yard', spec:['ZION Spec'],
      methods:['VT','Dimensional'], format:'RF-04', thirdParty:true,
      specs:{ whiteLight:388, blacklight:0, bathStrength:0, bathBatch:'—', dryPowder:'—', surfaceTemp:69, penDwell:0, devDwell:0 },
      jsa:'JSA-05', items:['IT-14'] },

    { no:'6178', uuid:'d10a77', cust:'CUS-06', loc:'LOC-06', date:'2026-08-17', status:'Approved',
      lead:'EMP-03', assist:[], po:'—', rig:'—', division:'Main', spec:['ZION Spec','NS-2'],
      methods:['MPI','VT'], format:'RF-05', thirdParty:false,
      specs:{ whiteLight:421, blacklight:4230, bathStrength:0.30, bathBatch:'24E024', dryPowder:'23081', surfaceTemp:76, penDwell:10, devDwell:7 },
      jsa:'JSA-01', items:['IT-15','IT-16'] },

    { no:'6175', uuid:'e88f30', cust:'CUS-07', loc:'LOC-07', date:'2026-08-17', status:'Invoiced',
      lead:'EMP-02', assist:[], po:'125943', rig:'—', division:'North division', spec:['ZION Spec'],
      methods:['MPI','VT'], format:'RF-03', thirdParty:false, invoice:'2696',
      specs:{ whiteLight:430, blacklight:4400, bathStrength:0.30, bathBatch:'24E024', dryPowder:'23081', surfaceTemp:75, penDwell:10, devDwell:7 },
      jsa:'JSA-01', items:['IT-17'] }
  ];

  const items = {
    'IT-01': { id:'IT-01', itemId:'74200', serial:'T-0214-7',    desc:'Handling Plug', tool:'Bushing Pullers', material:'Steel', methods:['MPI','VT'], bodyStatus:'OK', status:'OK', len:'18.50',
      conns:[ conn('6 5/8 REG','pin',{pin_od:'8', bev_dia:'7 9/16', pin_id:'3 3/4', pin_length:'5', cyl_dia:'5 7/8'}) ],
      misc:[{n:'Flapper Wheel Connection',c:'OK',m:'VT'}], prices:[{n:'Handling Plug',t:'Incoming/Dirty',q:1,r:40,u:'PER TOOL'}] },

    'IT-02': { id:'IT-02', itemId:'74213', serial:'T-100319-1',  desc:'Swage', tool:'Bushing Pullers', material:'Steel', methods:['MPI','VT'], bodyStatus:'OK', status:'OK', len:'22.00',
      conns:[ conn('6 5/8 REG','pin',{pin_od:'8', bev_dia:'7 1/2', pin_id:'3 3/4', pin_length:'5'}) ],
      misc:[{n:'Shop Clean',c:'OK',m:'VT'}], prices:[{n:'Swage',t:'Incoming/Dirty',q:1,r:60,u:'PER TOOL'}] },

    'IT-03': { id:'IT-03', itemId:'74221', serial:'MC-011024-11',desc:'Crossover', tool:'Bushing Pullers', material:'Steel', methods:['MPI','VT'], bodyStatus:'OK', status:'OK', len:'30.25',
      conns:[ conn('6 5/8 REG','pin',{pin_od:'8', bev_dia:'7 9/16', pin_id:'3 3/4', pin_length:'5'}),
              conn('6 5/8 REG','box',{box_od:'7 15/16', c_bore_dia:'6', c_bore_depth:'11/16', box_depth:'5 7/16'}) ],
      misc:[{n:'MPI Connection',c:'OK',m:'MPI'}], prices:[{n:'Crossover',t:'Incoming/Dirty',q:1,r:60,u:'PER TOOL'}] },

    'IT-04': { id:'IT-04', itemId:'74182', serial:'AS-11016',    desc:'Steel Stabilizer', tool:'Drill Pipe / Tubular', material:'Steel', methods:['LPI','VT','Dimensional'], bodyStatus:'OK', status:'OK', len:'28.40',
      conns:[ conn('NC-50','pin',{pin_od:'6 7/16', bev_dia:'6 3/16', pin_id:'3 1/16', pin_length:'4 9/16'}),
              conn('NC-50','box',{box_od:'6 7/16', c_bore_dia:'5 5/16', box_depth:'4 13/16'}) ],
      misc:[{n:'Hardbands',c:'OK',m:'VT'}], prices:[{n:'Steel Stabilizer',t:'Incoming/Dirty',q:1,r:95,u:'PER TOOL'}] },

    'IT-05': { id:'IT-05', itemId:'74184', serial:'APJ618',      desc:'Steel Pup Joint', tool:'Drill Pipe / Tubular', material:'Steel', methods:['LPI','VT','Dimensional'], bodyStatus:'DT — Damaged Thread', status:'REJECTED', len:'10.00',
      conns:[ conn('NC-50','pin',{pin_od:'6 5/16', bev_dia:'6 3/16', pin_id:'3 1/16', pin_length:'4 1/2'}),
              conn('NC-50','box',{box_od:'6 1/4', c_bore_dia:'5 5/16', box_depth:'4 13/16'}) ],
      misc:[{n:'API Reface',c:'REJ',m:'VT'},{n:'LPI Connection',c:'OK',m:'LPI'}],
      prices:[{n:'Steel Pup Joint',t:'Incoming/Dirty',q:1,r:105,u:'PER TOOL'}], standard:[{n:'API Reface',q:2,r:45},{n:'Flapper Wheel Connection',q:2,r:8}] },

    'IT-06': { id:'IT-06', itemId:'74186', serial:'ASM12027',    desc:'Non Mag Stabilizer', tool:'Drill Pipe / Tubular', material:'Non Mag', methods:['LPI','VT','Dimensional'], bodyStatus:'OK', status:'OK', len:'30.10',
      conns:[ conn('NC-50','pin',{pin_od:'6 7/16', bev_dia:'6 3/16', pin_id:'3 1/16', pin_length:'4 9/16'}) ],
      misc:[{n:'Hardbands',c:'OK',m:'LPI'}], prices:[{n:'Non Mag Stabilizer',t:'Incoming/Dirty',q:1,r:130,u:'PER TOOL'}] },

    'IT-07': { id:'IT-07', itemId:'74195', serial:'AMDC8071',    desc:'NMDC', tool:'Drill Pipe / Tubular', material:'Non Mag', methods:['LPI','VT','Dimensional'], bodyStatus:'BC — Body Crack', status:'REJECTED', len:'31.13',
      conns:[ conn('6 5/8 REG','pin',{pin_od:'8', bev_dia:'7 9/16', pin_id:'3 3/4', pin_length:'5', cyl_dia:'5 13/16'}),
              conn('6 5/8 REG','box',{box_od:'7 15/16', bev_dia:'7 3/4', c_bore_dia:'6', c_bore_depth:'11/16', box_depth:'5 7/16'}) ],
      misc:[{n:'Hardbands',c:'OK',m:'LPI'},{n:'Hardbands',c:'BC',m:'LPI'},{n:'Hardbands',c:'OK',m:'LPI'},{n:'Hardbands',c:'OK',m:'LPI'}],
      prices:[{n:'NMDC',t:'Incoming/Dirty',q:1,r:130,u:'PER TOOL'}],
      standard:[{n:'API Reface',q:2,r:45},{n:'Flapper Wheel Connection',q:2,r:8},{n:'Hardbands',q:4,r:30}] },

    'IT-08': { id:'IT-08', itemId:'74301', serial:'GT-4471',     desc:'MWD Collar', tool:'NDT Crossover', material:'Non Mag', methods:['MPI','UT'], bodyStatus:'OK', status:'OK', len:'29.80',
      conns:[ conn('XT-39','pin',{pin_od:'5 5/16', bev_dia:'4 15/16', pin_id:'2 3/4', pin_length:'3 15/16'}) ],
      misc:[{n:'MPI Connection',c:'OK',m:'MPI'}], prices:[{n:'MWD Collar',t:'Incoming/Dirty',q:1,r:145,u:'PER TOOL'}] },

    'IT-09': { id:'IT-09', itemId:'74302', serial:'GT-4472',     desc:'MWD Collar', tool:'NDT Crossover', material:'Non Mag', methods:['MPI','UT'], bodyStatus:'PIT — Pitting', status:'REJECTED', len:'29.75',
      conns:[ conn('XT-39','pin',{pin_od:'5 1/4', bev_dia:'4 15/16', pin_id:'2 3/4', pin_length:'3 7/8'}) ],
      misc:[{n:'MPI Connection',c:'REJ',m:'MPI'}], prices:[{n:'MWD Collar',t:'Incoming/Dirty',q:1,r:145,u:'PER TOOL'}], standard:[{n:'API Reface',q:1,r:45}] },

    'IT-10': { id:'IT-10', itemId:'74183', serial:'APJ617',      desc:'Steel Pup Joint', tool:'Drill Pipe / Tubular', material:'Steel', methods:['MPI','VT'], bodyStatus:'OK', status:'OK', len:'10.00',
      conns:[ conn('NC-50','pin',{pin_od:'6 7/16', bev_dia:'6 3/16', pin_id:'3 1/16', pin_length:'4 9/16'}) ],
      misc:[{n:'Flapper Wheel Connection',c:'OK',m:'VT'}], prices:[{n:'Steel Pup Joint',t:'Incoming/Dirty',q:1,r:105,u:'PER TOOL'}] },

    'IT-11': { id:'IT-11', itemId:'74188', serial:'AX6421',      desc:'Steel Crossover', tool:'Drill Pipe / Tubular', material:'Steel', methods:['MPI','VT'], bodyStatus:'DS — Damaged Shoulder', status:'REJECTED', len:'26.00',
      conns:[ conn('NC-50','box',{box_od:'6 7/16', c_bore_dia:'5 5/16', box_depth:'4 3/4'}) ],
      misc:[{n:'API Reface',c:'REJ',m:'VT'}], prices:[{n:'Steel Crossover',t:'Incoming/Dirty',q:1,r:75,u:'PER TOOL'}], standard:[{n:'API Reface',q:1,r:45}] },

    'IT-12': { id:'IT-12', itemId:'74410', serial:'NOV-TTM-118', desc:'Thru Tubing Motor', tool:'Thru Tubing Motor', material:'Steel', methods:['MPI','LPI','VT'], bodyStatus:'OK', status:'OK', len:'24.60',
      conns:[ conn('4 1/2 REG','pin',{pin_od:'5 11/16', bev_dia:'5 5/16', pin_id:'2 5/16', pin_length:'4 1/16'}) ],
      misc:[{n:'Shop Clean',c:'OK',m:'VT'}], prices:[{n:'Thru Tubing Motor',t:'Incoming/Dirty',q:1,r:210,u:'PER TOOL'}] },

    'IT-13': { id:'IT-13', itemId:'74411', serial:'NOV-TTM-119', desc:'Thru Tubing Motor', tool:'Thru Tubing Motor', material:'Steel', methods:['MPI','LPI','VT'], bodyStatus:'WT — Wall Thickness', status:'REJECTED', len:'24.55',
      conns:[ conn('4 1/2 REG','pin',{pin_od:'5 5/8', bev_dia:'5 5/16', pin_id:'2 1/4', pin_length:'4'}) ],
      misc:[{n:'Dry Molly',c:'OK',m:'VT'}], prices:[{n:'Thru Tubing Motor',t:'Incoming/Dirty',q:1,r:210,u:'PER TOOL'}] },

    'IT-14': { id:'IT-14', itemId:'74505', serial:'RNG-MAST-02', desc:'Mast Section', tool:'Rig Inspection', material:'Steel', methods:['VT','Dimensional'], bodyStatus:'OK', status:'OK', len:'—',
      conns:[], misc:[{n:'Per Hour Inspection',c:'OK',m:'VT'}], prices:[{n:'Rig Inspection',t:'Incoming/Dirty',q:8,r:95,u:'PER HR'}] },

    'IT-15': { id:'IT-15', itemId:'74601', serial:'NXL-XO-441',  desc:'Steel Crossover', tool:'NDT Crossover', material:'Steel', methods:['MPI','VT'], bodyStatus:'OK', status:'OK', len:'19.20',
      conns:[ conn('DS-50','pin',{pin_od:'6 9/16', bev_dia:'6 1/4', pin_id:'3 5/16', pin_length:'4 11/16'}) ],
      misc:[{n:'MPI Connection',c:'OK',m:'MPI'}], prices:[{n:'Steel Crossover',t:'Incoming/Dirty',q:1,r:75,u:'PER TOOL'}] },

    'IT-16': { id:'IT-16', itemId:'74602', serial:'NXL-XO-442',  desc:'Steel Crossover', tool:'NDT Crossover', material:'Steel', methods:['MPI','VT'], bodyStatus:'OK', status:'OK', len:'19.15',
      conns:[ conn('DS-50','box',{box_od:'6 1/2', c_bore_dia:'5 3/8', box_depth:'4 15/16'}) ],
      misc:[{n:'MPI Connection',c:'OK',m:'MPI'}], prices:[{n:'Steel Crossover',t:'Incoming/Dirty',q:1,r:75,u:'PER TOOL'}] },

    'IT-17': { id:'IT-17', itemId:'74702', serial:'POT-BP-90',   desc:'Bushing Puller', tool:'Bushing Pullers', material:'Steel', methods:['MPI','VT'], bodyStatus:'OK', status:'OK', len:'14.00',
      conns:[], misc:[{n:'Shop Clean',c:'OK',m:'VT'}], prices:[{n:'Bushing Puller',t:'Incoming/Dirty',q:1,r:85,u:'PER TOOL'}] }
  };

  /* ---------- CALIBRATED EQUIPMENT ---------- */
  const equipment = [
    { name:'Blacklight #1',      serial:'ZIO-20041705',      cal:'2026-03-06', exp:'2026-10-02' },
    { name:'Gauss Meter',        serial:'ZES-8822-3',        cal:'2025-09-10', exp:'2026-09-10' },
    { name:'UV / White Light Meter', serial:'ZIO-1965272',   cal:'2026-03-06', exp:'2026-09-06' },
    { name:'Digital Calipers',   serial:'ZIO-SC5050223249765',cal:'2026-04-02',exp:'2026-10-02' },
    { name:'Digital Depth Gauge',serial:'ZIO-2002251562',    cal:'2023-06-12', exp:'2026-08-28' },
    { name:'Pit Gauge',          serial:'ZIO-30528',         cal:'2025-12-22', exp:'2026-12-22' },
    { name:'Profile Gauge #1',   serial:'ZES-PG-542-001',    cal:'2025-03-21', exp:'2028-03-21' },
    { name:'Coil',               serial:'ZIO-CES-105634',    cal:'2026-03-06', exp:'2026-09-06' }
  ];

  /* ---------- BILLING ---------- */
  const invoices = [
    { no:'2715', insp:'6187', cust:'CUS-01', date:'2026-08-19', due:'2026-09-18', total:818.00,  paid:0,      status:'Sent',   po:'—'      },
    { no:'2696', insp:'6175', cust:'CUS-07', date:'2026-08-19', due:'2026-08-19', total:541.25,  paid:541.25, status:'Paid',   po:'125943' },
    { no:'2693', insp:'6128', cust:'CUS-05', date:'2026-08-19', due:'2026-10-18', total:5139.00, paid:0,      status:'Unsent', po:'—'      },
    { no:'2694', insp:'6173', cust:'CUS-01', date:'2026-08-19', due:'2026-09-18', total:2862.00, paid:0,      status:'Sent',   po:'—'      },
    { no:'2695', insp:'6168', cust:'CUS-03', date:'2026-08-19', due:'2026-09-18', total:2650.00, paid:0,      status:'Sent',   po:'—'      },
    { no:'2671', insp:'6102', cust:'CUS-02', date:'2026-06-14', due:'2026-07-29', total:9420.50, paid:0,      status:'Overdue',po:'H&P 416'},
    { no:'2660', insp:'6081', cust:'CUS-04', date:'2026-05-30', due:'2026-06-29', total:3180.00, paid:0,      status:'Overdue',po:'—'      },
    { no:'2648', insp:'6055', cust:'CUS-06', date:'2026-05-02', due:'2026-06-01', total:1245.00, paid:1245.00,status:'Paid',   po:'—'      },
    { no:'2631', insp:'6021', cust:'CUS-08', date:'2026-04-11', due:'2026-05-11', total:7760.00, paid:0,      status:'Overdue',po:'—'      },
    { no:'2610', insp:'5988', cust:'CUS-05', date:'2026-03-22', due:'2026-05-06', total:4310.75, paid:0,      status:'Overdue',po:'—'      }
  ];

  /* Illustrative payment behaviour used by the AI risk model. */
  const payBehaviour = {
    'CUS-01':{ avgDays:41, onTimePct:62 }, 'CUS-02':{ avgDays:128, onTimePct:18 },
    'CUS-03':{ avgDays:29, onTimePct:88 }, 'CUS-04':{ avgDays:97,  onTimePct:31 },
    'CUS-05':{ avgDays:151,onTimePct:12 }, 'CUS-06':{ avgDays:34,  onTimePct:79 },
    'CUS-07':{ avgDays:18, onTimePct:94 }, 'CUS-08':{ avgDays:113, onTimePct:22 }
  };

  const tickets = [
    { no:'IT2026/00052', cust:'CUS-03', loc:'LOC-03', date:'2026-08-19', by:'Portal User', items:14, rig:'—', status:'Open' },
    { no:'IT2026/00051', cust:'CUS-04', loc:'LOC-04', date:'2026-08-17', by:'Juan Alcocer', items:1,  rig:'—', status:'Converted' },
    { no:'IT2026/00050', cust:'CUS-04', loc:'LOC-04', date:'2026-07-31', by:'Nick Palacios',items:2,  rig:'—', status:'Converted' },
    { no:'IT2026/00049', cust:'CUS-06', loc:'LOC-06', date:'2026-07-23', by:'Portal User', items:2,  rig:'—', status:'Converted' }
  ];


  return { customers, connectionTypes, PIN, BOX, LABEL, master, reportFormats, employees, roles,
           toolTemplates, itemTemplates, jsaTemplates, ppe,
           inspections, items, equipment, invoices, payBehaviour, tickets,
           toFraction, parseFraction,
           custById: id => customers.find(c => c.id === id),
           locById:  id => { let r=null; customers.forEach(c=>c.locations.forEach(l=>{ if(l.id===id) r={loc:l,cust:c}; })); return r; },
           empById:  id => employees.find(e => e.id === id),
           ctByName: n  => connectionTypes.find(c => c.name === n),
           inspByNo: n  => inspections.find(i => i.no === n),
           invByNo:  n  => invoices.find(i => i.no === n),
           ttById:   id => toolTemplates.find(t => t.id === id),
           jsaById:  id => jsaTemplates.find(t => t.id === id),
           ttFor:    c  => toolTemplates.filter(t => t.cust === c),
           ixFor:    c  => itemTemplates.filter(t => t.cust === c) };
})();

/* ============================================================
   Live store. The seed above is the starting state; everything the
   user creates or edits mutates it in place and persists locally,
   so the demo behaves like a real system across reloads.
   ============================================================ */
window.DB = (function () {
  const KEY = window.DB_KEY || 'zion.reporting.v3';
  const LISTS = (window.DB_LISTS || []).concat(['customers','connectionTypes','employees','reportFormats','inspections','invoices','tickets','toolTemplates','itemTemplates','jsaTemplates']);
  const Z = window.ZD;

  function snapshot() {
    const o = { items: Z.items, master: Z.master };
    LISTS.forEach(k => o[k] = Z[k]);
    return o;
  }
  function apply(s) {
    LISTS.forEach(k => { if (Array.isArray(s[k])) { Z[k].length = 0; s[k].forEach(x => Z[k].push(x)); } });
    if (s.items) { Object.keys(Z.items).forEach(k => delete Z.items[k]); Object.assign(Z.items, s.items); }
    if (s.master) Object.keys(s.master).forEach(k => {
      if (Array.isArray(Z.master[k])) { Z.master[k].length = 0; s.master[k].forEach(v => Z.master[k].push(v)); } });
  }
  const maxNum = (arr, f) => arr.reduce((m,x) => Math.max(m, parseInt(String(f(x)).replace(/\D/g,''),10) || 0), 0);

  return {
    load()  { try { const r = localStorage.getItem(KEY); if (r) apply(JSON.parse(r)); } catch (e) {} },
    save()  { try { localStorage.setItem(KEY, JSON.stringify(snapshot())); } catch (e) {} },
    reset() { try { localStorage.removeItem(KEY); } catch (e) {} location.reload(); },
    isModified() { try { return !!localStorage.getItem(KEY); } catch (e) { return false; } },

    nextInspectionNo() { return String(maxNum(Z.inspections, i => i.no) + 1); },
    nextInvoiceNo()    { return String(maxNum(Z.invoices, i => i.no) + 1); },
    nextItemId()       { return String(maxNum(Object.values(Z.items), i => i.itemId) + 1); },
    nextTicketNo()     { return 'IT2026/' + String(maxNum(Z.tickets, t => t.no.split('/')[1]) + 1).padStart(5,'0'); },
    nextKey(prefix, obj) { let n = 1; while (obj[prefix + '-' + String(n).padStart(2,'0')]) n++;
                           return prefix + '-' + String(n).padStart(2,'0'); },
    nextCustomerId()   { let n = Z.customers.length + 1;
                         while (Z.customers.some(c => c.id === 'CUS-' + String(n).padStart(2,'0'))) n++;
                         return 'CUS-' + String(n).padStart(2,'0'); },
    nextLocationId()   { let n = 1; const all = Z.customers.flatMap(c => c.locations.map(l => l.id));
                         while (all.indexOf('LOC-' + String(n).padStart(2,'0')) > -1) n++;
                         return 'LOC-' + String(n).padStart(2,'0'); },
    code(name)         { return (name.replace(/[^A-Za-z]/g,'').toUpperCase().slice(0,3) || 'CUS')
                                + '-' + String(Z.customers.length + 1).padStart(4,'0'); }
  };
})();
window.DB.load();
