module.exports = {
  core: [
  [
    "01",
    "Platform Foundation & Access Control",
    [
      "Single unified application replacing the separate dispatch and reporting systems",
      "Landing and authentication; session handling with configurable expiry",
      "Role management — create unlimited roles with module-level Create, Read, Update, Delete permissions",
      "Data-level permissions — control who can see customer contact details, rates, margin and payroll",
      "Pre-configured roles: Super Admin, Operations Manager, Inspector, Billing, Read-only",
      "Employee kill switch — marking a person terminated revokes web access, mobile app access, job roster placement and customer communication in a single action",
      "Session tracking — user, role, IP address, device, browser, login and logout times, duration",
      "Activity log across every module with before-and-after values, user, timestamp and IP",
      "Contextual in-app help markers on fields, actions and screens, with a global help mode",
      "Responsive interface optimised for iPad field use, including a collapsible sidebar for maximum screen area",
      "Business settings — company details, three logo slots (platform, invoice, inspection report), business hours, holidays",
      "Notification centre and in-app alerts"
    ]
  ],
  [
    "02",
    "Customer, Site & Division Master",
    [
      "Customer headquarters register with client code, industry, website, payment terms, tax rate and status",
      "Unlimited sites per customer with full address, city, state, ZIP, territory and district",
      "Unlimited divisions per site — the third level of the hierarchy",
      "Contacts per customer and site with name, job title, phone and status",
      "Typed email distribution list per customer — complete report, inspected items only, category-restricted reports, manager, shop, accounts payable",
      "Per-customer business rules: require PO on inspection submit, require PO after invoice, PO request reminder cadence, report delivery format (single PDF, multiple PDF, combined), reminder due-date cadence, finance fee, minimum callout, total mileage allowance, send inspected items on submit",
      "Configurable inspection table columns per customer (Operator, Job #, PO #, Rig, DT #, Lease/Well)",
      "Default job safety analysis template per customer",
      "Geo-fence configuration per site — allowed radius, grace period, escalation target",
      "Missed-attendance triggers per site — late after, absent after, notification target",
      "Certification requirements per customer",
      "Document store per customer with controlled-document and customer-spec flags",
      "Connection types assigned per customer",
      "Complete job and inspection history per customer",
      "Per-account activity log",
      "Customer status management and CSV export"
    ]
  ],
  [
    "03",
    "Price Sheets & Rate Master",
    [
      "Standard pricing per customer — item, material, method, unit of measure, rate, discount percentage, discounted rate, commission percentage",
      "Customer-specific tool pricing — tool ID, description, prefix, UOM, size, pins, boxes, misc item count",
      "Project pricing — item, price, discount",
      "Automatic charges applied without manual entry",
      "Closeout item charges — name, UOM, rate, discount",
      "Misc items library shared across pricing and inspection",
      "Mileage rate and inspector hourly rate held on the same sheet the inspection bills from",
      "Holiday, after-hours and priority pricing logic",
      "Tax handling per customer with configurable percentage"
    ]
  ],
  [
    "04",
    "Workforce, Crews & Payroll Rules",
    [
      "Employee master with profile, role, territory, district, contact details and status",
      "Certification register per employee with type, level and expiry date",
      "Pay rules per employee — hourly or salaried, pay rate, pay frequency, overtime threshold, overtime multiplier, mileage rate",
      "Employee documents and signature capture for report sign-off",
      "Crews and teams — crew lead, members, shift window, home base, overtime cap, dispatch priority",
      "Swap crew members without generating attendance anomalies",
      "Service capabilities per crew",
      "Portal users — customer-side logins mapped to customer and site",
      "Employee assignment, attendance, overtime, mileage, payout, certification and document views per person"
    ]
  ],
  [
    "05",
    "Jobs & Dispatch",
    [
      "Job creation with customer, site, division, work type, inspection type and priority",
      "Pre-job checklist so crews know what to carry before leaving",
      "Job task checklist assigned to dispatched crew members",
      "Crew or individual assignment, including assign-all",
      "Document attachment to a job before dispatch",
      "Configurable job progress stages with colour, sequence and live progress bar",
      "Job templates for repeat work",
      "Scheduled start, estimated end and push reminders to assigned crew",
      "Optional map pin per job",
      "Job lifecycle statuses from scheduled through to invoiced",
      "Employee-initiated reschedule and extension requests with reason, notifying the administrator"
    ]
  ],
  [
    "06",
    "Scheduling Calendar",
    [
      "Day, week and month views",
      "Week view arranged by crew, with an unassigned row for jobs still needing a crew",
      "Inspections and invoice due dates shown on the same calendar as crew work",
      "Colour coding by status; click through to the underlying record",
      "Today marker and forward and backward navigation"
    ]
  ],
  [
    "07",
    "Operations Map & Geo-Compliance",
    [
      "Live map of crew positions and job sites with real coordinates",
      "Geo-fence rings drawn per site from the radius on the customer record",
      "Crew status — on site, in transit, off shift — with last-updated time",
      "Route display for crews in transit",
      "Open-job count per site",
      "Region switching for multi-territory operations",
      "Geo violation detection — check-in outside the fence, unexpected departure, unusual movement",
      "Crew status and site panels with click-through to the job or account"
    ]
  ],
  [
    "08",
    "Attendance, Time & Site Cost",
    [
      "Geo-verified check in and check out against the site record",
      "Attendance notes captured at check in and check out",
      "Exception flagging — late arrival, early exit, absence, missed check-out, outside fence",
      "Administrator correction of missed check-outs with an audit trail",
      "Hours calculated per person per job",
      "Timesheet generation by week with draft, submitted, approved, rejected and paid states",
      "Overtime monitoring against per-employee thresholds with projected cost impact",
      "Overtime distribution by department and team",
      "Live cost per site — crew hours at their real pay rate tied to the customer location",
      "Payroll view — regular pay, overtime pay, travel pay, mileage reimbursement and gross payout per person"
    ]
  ],
  [
    "09",
    "Mileage",
    [
      "Trip capture with start and end location and distance",
      "Work or personal classification",
      "Billable flag and reimbursement calculated from the customer price sheet",
      "Approve, reject and reopen workflow with bulk approval",
      "Mileage attributed to the job it belongs to so it reaches the invoice",
      "Export for finance, tax rebate and customer billing"
    ]
  ],
  [
    "10",
    "Standards, Procedures & Acceptance Criteria",
    [
      "Standards register with issuing body, designation, revision and effective date",
      "Standard revisions with version history",
      "Zion inspection procedures held against the standards they implement",
      "NDT method register — MPI, LPI, VT, UT, ET, Dimensional and others",
      "Techniques defined per method",
      "Equipment, probe and reference-standard requirements per technique",
      "Acceptance criteria sets by standard, customer and OEM",
      "Required inspector qualification per procedure",
      "Asset type to governing standard mapping, so selecting the asset determines the applicable rules",
      "Connection type library with reface type and per-dimension tolerance ranges across pin and box",
      "Reface type register",
      "Dimension and dimension-header configuration",
      "Guard preventing acceptance criteria from one asset class being applied to another"
    ]
  ],
  [
    "11",
    "Tool & Item Templates",
    [
      "Tool templates per customer, single or multi-part",
      "Template identity — description, abbreviation, serial prefix, tool size, model type",
      "Methods and materials per template",
      "Report format assignment per template",
      "Default misc items per template",
      "Weld report flag",
      "Custom column definition — free measurement columns and status columns with their own allowed values",
      "Parts list for multi-part tools, each part captured against every defined column",
      "Customer approval state per template",
      "Template images",
      "Item templates for single tools sent in repeatedly, pre-filling description, prefix, size, methods, materials, connection standard and rate",
      "Template import"
    ]
  ],
  [
    "12",
    "Inspection Tickets & Requests",
    [
      "Inspection tickets raised by customers through the portal or by operations",
      "Ticket detail with customer, site, operator, rig, DT number, job number and item list",
      "Accept a ticket and dispatch a crew directly from it",
      "Convert a ticket into a full inspection with data carried across",
      "Inspection request register with status and tool and connection summary"
    ]
  ],
  [
    "13",
    "Inspections",
    [
      "Inspection record with job header, equipment, specification, job safety analysis, inspection table, report items, photos, documents, quality assurance, close out, billing authorisation and print",
      "Job header — customer location, project, division, contact, lead and assistant inspectors, date, lease/well, operator, area, yard, rig/DT number, AFE/PO, customer job number, work order, third-party flag and address",
      "User-defined custom fields on the job header",
      "Calibrated equipment selection with serial, calibration date, expiry and certificate; validity checked against the job date",
      "Specification capture — inspected-per standards, methods, white light intensity, blacklight intensity, bath strength and batch, dry powder batch, penetrant and developer batches, contrast and oxide brands, tool surface temperature, pen and developer dwell times, control strip and block test verification",
      "User-defined additional specification fields",
      "Inspection table with per-customer configurable columns and a dimensional view",
      "Status workflow — in progress, submitted, approved, invoice pending, invoiced",
      "Clone inspection",
      "Re-inspection and submit-for-review",
      "Soft delete with restore and a deleted-records view",
      "Filtering by customer, project, inspector, status and date range; column chooser; CSV export"
    ]
  ],
  [
    "14",
    "Inspected Items & Measurements",
    [
      "Item record with serial number, description, tool template, material, methods, size, tool length and hours used",
      "Body status and body internal status with acceptance codes",
      "Connection measurements captured per pin and per box across all defined dimensions",
      "Fractional imperial entry as written in the field, normalised to decimal by the platform",
      "Automatic comparison against the connection standard with pass, marginal and fail verdicts",
      "Margin-to-limit reporting so dimensions trending toward rejection are visible before they fail",
      "Misc items per inspected item with their own acceptance codes and inspection methods",
      "Custom template columns captured per part for multi-part tools",
      "Verdict roll-up taking the worst of body condition, connection results, misc findings and status columns",
      "Remedial work generated from findings and priced onto the item",
      "Photographs attached per item",
      "Item-level pricing with rate, quantity, discount and standard rates",
      "Cross-inspection item register with filtering by operator, customer, rig, DT, job number, acceptance code, body status and date",
      "Asset history — every previous inspection of the same serial"
    ]
  ],
  [
    "15",
    "Equipment & Calibration",
    [
      "Equipment register with description, serial number, category and location",
      "Calibration date, expiry date and certificate storage",
      "Calibration validity checked automatically against every job the instrument is used on",
      "Expiry warnings ahead of time",
      "Tool boxes assigned per customer",
      "Recalibration booking with vendor and new dates"
    ]
  ],
  [
    "16",
    "Job Safety Analysis",
    [
      "JSA template library, global or customer-specific",
      "Sequence of basic steps with potential hazards and controls for each",
      "Job safety equipment matrix across the full PPE list",
      "Persons in attendance and noteworthy conditions",
      "Template selection per inspection with sign-off",
      "Create a new template from a completed JSA"
    ]
  ],
  [
    "17",
    "Reporting Engine",
    [
      "Report format designer — ordered columns typed as connection, body or tool status",
      "Report formats assigned per tool template and per customer",
      "Single PDF report, combined report and individual reports as a zip",
      "Inspected items report, equipment report, specification report and job safety analysis report",
      "Billing authorisation document",
      "Certificate of compliance structure",
      "Report preview before issue",
      "Distribution rules per customer determining which address types receive which report",
      "Email template management",
      "Email log per inspection"
    ]
  ],
  [
    "18",
    "Close Out, Billing Authorisation & Invoicing",
    [
      "Close out converting inspected items and remedial findings into priced lines",
      "Closeout requirements with description, UOM, rate, quantity and discount",
      "Billing authorisation with priced recap by item and customer signature capture",
      "Invoice generation from the approved billing authorisation",
      "Invoice header — number, PO number, invoice date, due date computed from customer terms",
      "Line items carried from close out with rate, UOM, quantity, discount and amount",
      "Subtotal, tax at the customer rate, discount by percentage or fixed amount, and total",
      "Payment recording including partial payments, method and reference",
      "Invoice reminders and PO request reminders",
      "Purchase order register mapped against invoices",
      "Invoice status tracking — unsent, sent, overdue, paid, free",
      "Invoice analytics — total billed, pending billing, paid, outstanding, average invoice value, status breakdown, payment methods and ageing analysis",
      "Payment risk scoring per invoice based on the customer's own settlement history"
    ]
  ],
  [
    "19",
    "Profitability & Margin",
    [
      "Delivered cost per job — crew hours at real pay rates, overtime at the applicable multiplier, mileage and consumables",
      "Revenue per job from the invoice and billing authorisation",
      "Gross margin per job in currency and percentage",
      "Profitability by inspection, customer, site, inspector and service category",
      "Rate source visibility — purchase order, standard rate, project rate or holiday rate",
      "Quoted value against invoiced value against delivered cost",
      "Period roll-up of total revenue, total delivered cost and gross margin"
    ]
  ],
  [
    "20",
    "Master Data & Configuration",
    [
      "Methods, materials, tool types, makes, models, operators, units of measure, yards",
      "Pin/box, body and weld acceptance codes",
      "Territories and districts",
      "Misc items with type and inspection-allowed flags",
      "Connection types and reface types",
      "Job types, inspection types and progress stages",
      "Certification types, employee roles and departments",
      "Client industry types, service types, site types and contact roles",
      "Every list maintained centrally and reflected across the platform immediately"
    ]
  ],
  [
    "21",
    "Data Migration",
    [
      "Customers, sites, divisions, contacts and email distribution lists",
      "Employees, roles, certifications and pay rules",
      "Tool templates, item templates and report formats",
      "Connection types with their tolerance ranges",
      "All master data and vocabularies",
      "Active and recent inspections with inspected items, measurements and attachments",
      "Open invoices, purchase orders and outstanding balances",
      "Reconciliation report comparing source and destination record counts",
      "Remaining historical records retained in a read-only archive, queryable from the platform"
    ]
  ],
  [
    "22",
    "Mobile & Field Use",
    [
      "Existing employee mobile applications updated to run against the unified platform",
      "iPad-optimised inspection capture in the web application",
      "Field check in and check out with location capture",
      "Mileage capture and trip classification",
      "Assigned job and task visibility",
      "Document and photograph upload from the field"
    ]
  ],
  [
    "23",
    "Deployment, Support & Ownership",
    [
      "Cloud hosting setup and deployment",
      "Environment configuration and release management",
      "User acceptance testing support and defect resolution",
      "Administrator and end-user handover sessions",
      "Four months of post-deployment support at no additional cost",
      "No recurring licence or platform fees payable to Nile",
      "Full source code, database and intellectual property transferred to Zion"
    ]
  ]
],
  addons: [
  [
    "Communications Hub",
    "48 days",
    "$9,600",
    [
      "In-app calling from crew to customer through platform-owned numbers",
      "Customer telephone numbers never exposed to or stored on crew devices",
      "Sticky number per customer so they always see the same Zion line",
      "In-app messaging, crew to crew and crew to customer",
      "Masked SMS through the same number",
      "Full call and message log attached to the job it belongs to",
      "Optional call recording with announcement",
      "Instant revocation when an employee is terminated",
      "Telephony provider account, carrier registration and usage charges are Zion's"
    ]
  ],
  [
    "Customer Portal",
    "45 days",
    "$9,000",
    [
      "Customer login with role-based access",
      "Raise and track inspection tickets",
      "Job and inspection status visibility",
      "Report download and history",
      "Outstanding and paid invoice visibility",
      "Purchase order submission"
    ]
  ],
  [
    "LMS & Certification Management",
    "60 days",
    "$12,000",
    [
      "Course and training material library",
      "On-the-job training records per employee",
      "Assessments and completion tracking",
      "Certification register with levels, issue and expiry dates",
      "Renewal reminders and expiry escalation",
      "Competency matrix mapped to the qualifications each inspection procedure requires",
      "Blocking or warning when an unqualified inspector is assigned"
    ]
  ],
  [
    "Company Document Centre with AI",
    "42 days",
    "$8,400",
    [
      "Central store for employee handbook, processes, W-9, certificates of insurance and policies",
      "Version control and controlled-document flags",
      "Acknowledgement tracking per employee",
      "Secure share links with expiry",
      "Email delivery to customers and staff",
      "AI search and question answering across the document set"
    ]
  ],
  [
    "Asset Management, Vendors & Purchase Orders",
    "80 days",
    "$16,000",
    [
      "Asset register with categories, locations and lifecycle events",
      "Maintenance scheduling and history",
      "Parts and supplies inventory with reorder rules",
      "Vendor register and vendor SKUs",
      "Purchase order raising and tracking",
      "Vendor invoice capture and matching",
      "Audit templates, schedules, runs and observations"
    ]
  ],
  [
    "Advanced Billing",
    "55 days",
    "$11,000",
    [
      "Recurring invoices",
      "Customer statements and scheduled statement delivery",
      "Combined invoices across multiple inspections",
      "Inspector commission calculation and reporting",
      "Payment gateway integration for card payment",
      "Finance fee automation"
    ]
  ],
  [
    "QMS & Safety Data Sheets",
    "32 days",
    "$6,400",
    [
      "Corrective and preventive action reports tied to inspections and employees",
      "Risk level, warning stage and follow-up tracking",
      "Supplier register",
      "Safety data sheet library with supplier links",
      "Controlled document handling"
    ]
  ],
  [
    "Standards Content Encoding",
    "30 days",
    "$6,000",
    [
      "Encoding of acceptance criteria from the standards Zion supplies",
      "Priority set: API RP 7G-2, API RP 8B, API RP 4G with API Spec 4F, AWS D1.1",
      "Mapping of criteria to asset classes, methods and techniques",
      "Zion supplies licensed standards documents and validates the encoded criteria"
    ]
  ],
  [
    "Full Historical Data Migration",
    "38 days",
    "$7,600",
    [
      "Complete five-year history transformed into the new model rather than archived",
      "Historical inspections, items, connections and measurements",
      "Historical invoices, line items and payments",
      "Historical attachments and evidence",
      "Full reconciliation reporting"
    ]
  ],
  [
    "Zion Intelligence — AI Layer",
    "To be scoped",
    "Phase 2",
    [
      "Automatic inspection package generation — job type determines assets, standards, procedures, methods, equipment and specifications",
      "Pre-job checklist generated from the inspection package",
      "AI-assisted report generation and certificate of compliance",
      "AI quality control of completed reports against the applicable rules",
      "AI-assisted invoicing from historical patterns",
      "Per-module intelligence panels surfacing what needs attention",
      "Ask Zion — natural language questions answered from live platform data",
      "Scoped and priced once the unified platform is in production"
    ]
  ]
]
};
