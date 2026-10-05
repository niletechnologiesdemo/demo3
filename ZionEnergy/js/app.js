// Screen navigation (multi-page)
function showScreen(id) {
  const fileMap = {
    'screenIndex': '../index.html',
    'login': 'login.html',
    'dashboard': 'dashboard.html',
    'clients': 'clients.html',
    'clientDetail': 'client-detail.html',
    'clientProfile': 'client-detail.html',
    'portalUsers': 'portal-users.html',
    'portalPreview': 'portal-preview.html',
    'employees': 'employees.html',
    'employeeDetail': 'employee-detail.html',
    'teams': 'teams.html',
    'jobs': 'jobs.html',
    'createJob': 'create-job.html',
    'jobDetail': 'job-detail.html',
    'editJob': 'edit-job.html',
    'calendar': 'calendar.html',
    'inspectionRequests': 'inspection-requests.html',
    'inspections': 'inspections.html',
    'inspectionDetail': 'inspection-detail.html',
    'inspectionTickets': 'inspection-tickets.html',
    'ticketDetail': 'ticket-detail.html',
    'inspectedItems': 'inspected-items.html',
    'itemSummary': 'item-summary.html',
    'fieldCapture': 'field-capture.html',
    'assetModels': 'asset-models.html',
    'assetModelDetail': 'asset-model-detail.html',
    'standards': 'standards.html',
    'equipment': 'equipment.html',
    'attendance': 'attendance.html',
    'timesheet': 'timesheet.html',
    'overtime': 'overtime.html',
    'geo': 'geo.html',
    'mileage': 'mileage.html',
    'billing': 'billing.html',
    'rateMaster': 'rate-master.html',
    'purchaseOrders': 'purchase-orders.html',
    'invoices': 'invoices.html',
    'invoiceDetail': 'invoice-detail.html',
    'profitability': 'profitability.html',
    'payroll': 'payroll.html',
    'jobSafety': 'job-safety.html',
    'inspectionPackage': 'inspection-package.html',
    'alerts': 'alerts.html',
    'reports': 'reports.html',
    'reportTemplates': 'report-templates.html',
    'settings': 'settings.html',
    'audit': 'audit.html',
    'notifications': 'notifications.html'
  };
  if (fileMap[id]) {
    window.location.href = fileMap[id];
  }
}

function showClientTab(tabId) {
  document.querySelectorAll('.client-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('clientTab-' + tabId).classList.add('active');
  document.querySelectorAll('#clientDetailTabs .tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
}

function showEmployeeTab(tabId) {
  document.querySelectorAll('.emp-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('empTab-' + tabId).classList.add('active');
  document.querySelectorAll('#employeeDetailTabs .tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
}

function toggleAddCert() {
  var form = document.getElementById('addCertForm');
  var exportBtn = document.getElementById('certExportBtn');
  var addBtn = document.getElementById('addCertBtn');
  if (form.style.display === 'none' || form.style.display === '') {
    form.style.display = 'block';
    if (exportBtn) exportBtn.style.display = 'none';
    if (addBtn) addBtn.style.display = 'none';
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    form.style.display = 'none';
    if (exportBtn) exportBtn.style.display = '';
    if (addBtn) addBtn.style.display = '';
  }
}

function toggleCreateTeam() {
  var form = document.getElementById('createTeamForm');
  if (form.style.display === 'none' || form.style.display === '') {
    form.style.display = 'block';
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    form.style.display = 'none';
  }
}

var teamMemberCount = 0;
var memberRoles = [
  'QC Inspector',
  'NDT Technician L1',
  'NDT Technician L2',
  'Field Technician',
  'Welder',
  'Helper / Laborer',
  'Driver',
  'Safety Officer',
  'Rigger',
  'Scaffold Builder',
  'Custom'
];
var memberEmployees = [
  'Ezven Ortiz \u2014 Lead Inspector',
  'Leo Lawrence \u2014 Inspector L1',
  'Caleb Washington \u2014 Field Tech',
  'Sebastian Salgado \u2014 Inspector (Night)',
  'Briston Clark \u2014 Field Tech (Night)',
  'Derek Simmons \u2014 Inspector L2',
  'Javier Morales \u2014 NDT Tech',
  'Tommy Fuentes \u2014 Helper',
  'Marcus Reyes \u2014 Senior Inspector',
  'Adrian Vega \u2014 Welder',
  'Carlos Medina \u2014 Rigger'
];

function addTeamMember() {
  teamMemberCount++;
  var container = document.getElementById('additionalMembersContainer');
  var card = document.createElement('div');
  card.id = 'addedMember-' + teamMemberCount;
  card.style.cssText = 'display:flex;gap:16px;margin-bottom:12px;animation:fadeIn 0.2s ease;';

  var empOpts = '<option value="" disabled selected>Choose employee...</option>';
  for (var i = 0; i < memberEmployees.length; i++) {
    empOpts += '<option>' + memberEmployees[i] + '</option>';
  }

  var roleOpts = '<option value="" disabled selected>Select role...</option>';
  for (var j = 0; j < memberRoles.length; j++) {
    roleOpts += '<option>' + memberRoles[j] + '</option>';
  }

  card.innerHTML =
    '<div style="flex:1;min-width:200px;background:#F2F2F7;border:2px solid #D1D1D6;border-radius:8px;padding:16px;position:relative;">' +
      '<button onclick="removeTeamMember(' + teamMemberCount + ')" style="position:absolute;top:8px;right:8px;background:none;border:none;cursor:pointer;font-size:16px;color:#8E8E93;padding:2px 6px;border-radius:4px;" onmouseover="this.style.background=\'#FF3B3020\';this.style.color=\'#FF3B30\'" onmouseout="this.style.background=\'none\';this.style.color=\'#8E8E93\'">&times;</button>' +
      '<div style="font-size:11px;font-weight:700;color:#636366;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Additional Member #' + teamMemberCount + '</div>' +
      '<div style="display:flex;gap:12px;flex-wrap:wrap;">' +
        '<div class="form-group" style="flex:1;min-width:180px;margin-bottom:0;">' +
          '<label class="form-label">Employee *</label>' +
          '<select class="form-select">' + empOpts + '</select>' +
        '</div>' +
        '<div class="form-group" style="flex:1;min-width:150px;margin-bottom:0;">' +
          '<label class="form-label">Team Role *</label>' +
          '<select class="form-select">' + roleOpts + '</select>' +
        '</div>' +
        '<div class="form-group" style="flex:1;min-width:150px;margin-bottom:0;">' +
          '<label class="form-label">Role Override</label>' +
          '<input class="form-input" placeholder="Custom title (optional)">' +
        '</div>' +
        '<div class="form-group" style="width:120px;margin-bottom:0;">' +
          '<label class="form-label">Chain Position</label>' +
          '<select class="form-select">' +
            '<option>Technician</option>' +
            '<option>Assistant</option>' +
            '<option>Support</option>' +
            '<option>Specialist</option>' +
          '</select>' +
        '</div>' +
      '</div>' +
    '</div>';

  container.appendChild(card);
  card.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function removeTeamMember(id) {
  var el = document.getElementById('addedMember-' + id);
  if (el) {
    el.style.opacity = '0';
    el.style.transform = 'translateX(-20px)';
    el.style.transition = 'all 0.2s ease';
    setTimeout(function() { el.remove(); }, 200);
  }
}

function toggleAddDivision() {
  var form = document.getElementById('addDivisionForm');
  var btn = document.getElementById('addDivisionBtn');
  var search = document.getElementById('divisionSearchBar');
  if (form.style.display === 'none' || form.style.display === '') {
    form.style.display = 'block';
    if (btn) btn.style.display = 'none';
    if (search) search.style.display = 'none';
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    form.style.display = 'none';
    if (btn) btn.style.display = '';
    if (search) search.style.display = '';
  }
}

function toggleAddSite() {
  var form = document.getElementById('addSiteForm');
  var btn = document.getElementById('addSiteBtn');
  var search = document.getElementById('sitesSearchBar');
  var filters = document.getElementById('sitesFilterBar');
  if (form.style.display === 'none' || form.style.display === '') {
    form.style.display = 'block';
    if (btn) btn.style.display = 'none';
    if (search) search.style.display = 'none';
    if (filters) filters.style.display = 'none';
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    form.style.display = 'none';
    if (btn) btn.style.display = '';
    if (search) search.style.display = '';
    if (filters) filters.style.display = '';
  }
}

function toggleAssignJob() {
  var form = document.getElementById('assignJobForm');
  var btn = document.getElementById('assignJobBtn');
  var filters = document.getElementById('assignFilterBar');
  if (form.style.display === 'none' || form.style.display === '') {
    form.style.display = 'block';
    if (btn) btn.style.display = 'none';
    if (filters) filters.style.display = 'none';
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    form.style.display = 'none';
    if (btn) btn.style.display = '';
    if (filters) filters.style.display = '';
  }
}

function addChecklistItem() {
  document.getElementById('addTaskRow').style.display = 'block';
  document.getElementById('newTaskName').focus();
}

function saveChecklistItem() {
  var name = document.getElementById('newTaskName').value.trim();
  if (!name) { document.getElementById('newTaskName').focus(); return; }
  var desc = document.getElementById('newTaskDesc').value.trim();
  var priority = document.getElementById('newTaskPriority').value;
  var badgeClass = priority === 'Required' ? 'gold' : priority === 'Standard' ? 'blue' : 'gray';
  var container = document.getElementById('checklistContainer');
  var lastItem = container.lastElementChild;
  if (lastItem) lastItem.style.borderBottom = '1px solid #F2F2F7';
  var item = document.createElement('div');
  item.className = 'checklist-item';
  item.style.cssText = 'display:flex;align-items:flex-start;gap:10px;padding:10px 0;animation:fadeIn 0.2s ease;';
  item.innerHTML =
    '<input type="checkbox" style="margin-top:3px;width:16px;height:16px;accent-color:var(--gold);cursor:pointer;">' +
    '<div style="flex:1;"><div style="font-weight:600;font-size:13px;">' + name + '</div>' +
    (desc ? '<div style="font-size:11px;color:var(--light-gray);">' + desc + '</div>' : '') +
    '</div><span class="badge ' + badgeClass + '" style="font-size:10px;">' + priority + '</span>';
  container.appendChild(item);
  document.getElementById('newTaskName').value = '';
  document.getElementById('newTaskDesc').value = '';
  document.getElementById('addTaskRow').style.display = 'none';
}

function addJobChecklistItem() {
  document.getElementById('jobAddTaskRow').style.display = 'block';
  document.getElementById('jobNewTaskName').focus();
}

function saveJobChecklistItem() {
  var name = document.getElementById('jobNewTaskName').value.trim();
  if (!name) { document.getElementById('jobNewTaskName').focus(); return; }
  var desc = document.getElementById('jobNewTaskDesc').value.trim();
  var priority = document.getElementById('jobNewTaskPriority').value;
  var badgeClass = priority === 'Required' ? 'gold' : priority === 'Standard' ? 'blue' : 'gray';
  var container = document.getElementById('jobChecklistContainer');
  var lastItem = container.lastElementChild;
  if (lastItem) lastItem.style.borderBottom = '1px solid #F2F2F7';
  var item = document.createElement('div');
  item.className = 'checklist-item';
  item.style.cssText = 'display:flex;align-items:flex-start;gap:10px;padding:10px 0;animation:fadeIn 0.2s ease;';
  item.innerHTML =
    '<input type="checkbox" style="margin-top:3px;width:16px;height:16px;accent-color:var(--gold);cursor:pointer;">' +
    '<div style="flex:1;"><div style="font-weight:600;font-size:13px;">' + name + '</div>' +
    (desc ? '<div style="font-size:11px;color:var(--light-gray);">' + desc + '</div>' : '') +
    '</div><span class="badge ' + badgeClass + '" style="font-size:10px;">' + priority + '</span>';
  container.appendChild(item);
  document.getElementById('jobNewTaskName').value = '';
  document.getElementById('jobNewTaskDesc').value = '';
  document.getElementById('jobAddTaskRow').style.display = 'none';
}

function toggleAddDeduction() {
  var form = document.getElementById('addDeductionForm');
  var btn = document.getElementById('addDeductionBtn');
  if (form.style.display === 'none' || form.style.display === '') {
    form.style.display = 'block';
    if (btn) btn.style.display = 'none';
    document.getElementById('newDeductionName').focus();
  } else {
    form.style.display = 'none';
    if (btn) btn.style.display = '';
  }
}

function saveDeduction() {
  var name = document.getElementById('newDeductionName').value.trim();
  var amount = document.getElementById('newDeductionAmount').value.trim();
  if (!name || !amount) return;
  var list = document.getElementById('deductionList');
  var item = document.createElement('div');
  item.style.cssText = 'display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #F2F2F7;';
  item.innerHTML = '<span style="font-size:13px;color:var(--gray);">' + name + '</span><span style="font-weight:600;">' + amount + '</span>';
  list.appendChild(item);
  document.getElementById('newDeductionName').value = '';
  document.getElementById('newDeductionAmount').value = '';
  toggleAddDeduction();
}

function openUploadDocModal() {
  document.getElementById('uploadDocModal').style.display = '';
}
function closeUploadDocModal() {
  document.getElementById('uploadDocModal').style.display = 'none';
}

function openViewDocModal(name, category, date, uploader, size, status, notes) {
  document.getElementById('viewDocTitle').textContent = name;
  document.getElementById('viewDocPreviewName').textContent = name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '.pdf';
  document.getElementById('viewDocName').textContent = name;
  var catBadgeMap = {'Employment':'gold','Certification':'green','Tax / Payroll':'blue','Safety':'amber','Other':'gray'};
  var catClass = catBadgeMap[category] || 'gray';
  document.getElementById('viewDocCategory').innerHTML = '<span class="badge ' + catClass + '">' + category + '</span>';
  document.getElementById('viewDocDate').textContent = date;
  document.getElementById('viewDocUploader').textContent = uploader;
  document.getElementById('viewDocSize').textContent = size;
  var statusClassMap = {'Verified':'green','Pending':'amber','Rejected':'red'};
  var statusClass = statusClassMap[status] || 'amber';
  document.getElementById('viewDocStatus').innerHTML = '<span class="badge ' + statusClass + '">' + status + '</span>';
  document.getElementById('viewDocStatusSelect').value = status;
  document.getElementById('viewDocNotes').textContent = notes || 'No notes available.';
  document.getElementById('viewDocModal').style.display = '';
}
function updateViewDocStatus(val) {
  var statusClassMap = {'Verified':'green','Pending':'amber','Rejected':'red'};
  var cls = statusClassMap[val] || 'amber';
  document.getElementById('viewDocStatus').innerHTML = '<span class="badge ' + cls + '">' + val + '</span>';
}
function closeViewDocModal() {
  document.getElementById('viewDocModal').style.display = 'none';
}

function toggleAddCertReq() {
  var form = document.getElementById('addCertReqForm');
  if (form.style.display === 'none' || form.style.display === '') {
    form.style.display = 'block';
    document.getElementById('newCertName').focus();
  } else {
    form.style.display = 'none';
  }
}

function saveCertReq() {
  var name = document.getElementById('newCertName').value.trim();
  if (!name) { document.getElementById('newCertName').focus(); return; }
  var body = document.getElementById('newCertBody').value.trim() || '—';
  var priority = document.getElementById('newCertPriority').value;
  var badgeClass = priority === 'Required' ? 'gold' : priority === 'Preferred' ? 'blue' : 'gray';
  var container = document.getElementById('certReqContainer');
  var lastItem = container.lastElementChild;
  if (lastItem) lastItem.style.borderBottom = '1px solid #F2F2F7';
  var item = document.createElement('div');
  item.className = 'cert-req-item';
  item.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:8px 0;animation:fadeIn 0.2s ease;';
  item.innerHTML =
    '<div style="display:flex;align-items:center;gap:10px;"><input type="checkbox" checked style="accent-color:var(--gold);width:15px;height:15px;"><div><div style="font-weight:600;font-size:13px;">' + name + '</div><div style="font-size:11px;color:var(--light-gray);">' + body + '</div></div></div><span class="badge ' + badgeClass + '" style="font-size:10px;">' + priority + '</span>';
  container.appendChild(item);
  document.getElementById('newCertName').value = '';
  document.getElementById('newCertBody').value = '';
  document.getElementById('addCertReqForm').style.display = 'none';
}

function toggleAddContact(title) {
  var form = document.getElementById('addContactForm');
  var btn = document.getElementById('addContactBtn');
  var heading = document.getElementById('contactFormTitle');
  var filters = document.getElementById('contactFilterBar');
  var search = document.getElementById('contactSearchBar');
  if (form.style.display === 'none' || form.style.display === '') {
    form.style.display = 'block';
    if (heading) heading.textContent = title || 'Add New Contact';
    if (btn) btn.style.display = 'none';
    if (filters) filters.style.display = 'none';
    if (search) search.style.display = 'none';
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    form.style.display = 'none';
    if (btn) btn.style.display = '';
    if (filters) filters.style.display = '';
    if (search) search.style.display = '';
  }
}

function filterJobEmployees(query) {
  var items = document.querySelectorAll('#jobEmpList .job-emp-item');
  var q = query.toLowerCase();
  for (var i = 0; i < items.length; i++) {
    var text = items[i].textContent.toLowerCase();
    items[i].style.display = text.indexOf(q) !== -1 ? '' : 'none';
  }
}

function showTeamMembers(team) {
  var teams = ['Alpha', 'Bravo', 'Charlie', 'Unassigned'];
  for (var i = 0; i < teams.length; i++) {
    var el = document.getElementById('team' + teams[i] + 'Members');
    if (el) el.style.display = 'none';
  }
  var selected = document.getElementById('team' + team.charAt(0).toUpperCase() + team.slice(1) + 'Members');
  if (selected) selected.style.display = 'block';
}

// Create Invoice Modal
function openCreateInvoiceModal() {
  document.getElementById('createInvoiceModal').style.display = '';
}
function closeCreateInvoiceModal() {
  document.getElementById('createInvoiceModal').style.display = 'none';
}

// View Invoice Modal
function openViewInvoiceModal(invNum, date, job, amount, status, client, description) {
  document.getElementById('viewInvNumber').textContent = invNum;
  document.getElementById('viewInvDate').textContent = date;
  document.getElementById('viewInvJob').textContent = job;
  document.getElementById('viewInvAmount').textContent = amount;
  document.getElementById('viewInvClient').textContent = client;
  document.getElementById('viewInvDescription').textContent = description;
  document.getElementById('viewInvSubtitle').textContent = 'Viewing ' + invNum + ' — ' + client;
  var statusClassMap = {'Paid':'green','Pending':'amber','Overdue':'red','Cancelled':'gray'};
  var cls = statusClassMap[status] || 'amber';
  document.getElementById('viewInvStatus').className = 'badge ' + cls;
  document.getElementById('viewInvStatus').style.cssText = 'font-size:12px;padding:6px 14px;';
  document.getElementById('viewInvStatus').textContent = status;
  document.getElementById('viewInvStatusSelect').value = status;
  document.getElementById('viewInvoiceModal').style.display = '';
}
function updateViewInvStatus(val) {
  var statusClassMap = {'Paid':'green','Pending':'amber','Overdue':'red','Cancelled':'gray'};
  var cls = statusClassMap[val] || 'amber';
  var el = document.getElementById('viewInvStatus');
  el.className = 'badge ' + cls;
  el.style.cssText = 'font-size:12px;padding:6px 14px;';
  el.textContent = val;
}
function closeViewInvoiceModal() {
  document.getElementById('viewInvoiceModal').style.display = 'none';
}

function filterTable(input, tableId) {
  var q = input.value.toLowerCase();
  var rows = document.getElementById(tableId).querySelectorAll('tbody tr');
  for (var i = 0; i < rows.length; i++) {
    var text = rows[i].textContent.toLowerCase();
    rows[i].style.display = text.indexOf(q) !== -1 ? '' : 'none';
  }
}

function filterTableByDateRange(tableId, fromId, toId) {
  var fromVal = document.getElementById(fromId).value;
  var toVal = document.getElementById(toId).value;
  var rows = document.getElementById(tableId).querySelectorAll('tbody tr');
  if (!fromVal && !toVal) {
    for (var i = 0; i < rows.length; i++) rows[i].style.display = '';
    return;
  }
  var fromDate = fromVal ? new Date(fromVal) : null;
  var toDate = toVal ? new Date(toVal) : null;
  for (var j = 0; j < rows.length; j++) {
    var text = rows[j].textContent;
    var match = text.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (match) {
      var rowDate = new Date(match[3] + '-' + match[1] + '-' + match[2]);
      var show = true;
      if (fromDate && rowDate < fromDate) show = false;
      if (toDate && rowDate > toDate) show = false;
      rows[j].style.display = show ? '' : 'none';
    } else {
      rows[j].style.display = '';
    }
  }
}

function addJobDetailTask() {
  var body = document.getElementById('jobDetailChecklistBody');
  var existing = body.querySelector('.jd-add-task-row');
  if (existing) { existing.querySelector('input').focus(); return; }
  var row = document.createElement('div');
  row.className = 'jd-add-task-row';
  row.style.cssText = 'display:flex;gap:8px;align-items:center;padding:8px 0;border-top:1px solid #F2F2F7;animation:fadeIn 0.2s ease;';
  row.innerHTML =
    '<input type="text" placeholder="Task name..." style="flex:1;padding:6px 10px;border:1px solid #D1D1D6;border-radius:6px;font-size:13px;font-family:Barlow,sans-serif;outline:none;" onfocus="this.style.borderColor=\'var(--gold)\'" onblur="this.style.borderColor=\'#D1D1D6\'">' +
    '<button class="btn btn-sm btn-primary" onclick="saveJobDetailTask(this)">Save</button>' +
    '<button class="btn btn-sm btn-ghost" onclick="this.parentElement.remove()" style="font-size:16px;">&times;</button>';
  body.appendChild(row);
  row.querySelector('input').focus();
}

function saveJobDetailTask(btn) {
  var row = btn.parentElement;
  var name = row.querySelector('input').value.trim();
  if (!name) { row.querySelector('input').focus(); return; }
  var label = document.createElement('label');
  label.style.cssText = 'display:flex;align-items:center;gap:8px;padding:6px 0;font-size:13px;cursor:pointer;';
  label.innerHTML = '<input type="checkbox"> ' + name;
  row.parentElement.insertBefore(label, row);
  row.remove();
}

// Export table to CSV
// ===== SUPPLIES FORM =====
function toggleAddSupplyForm() {
  var form = document.getElementById('addSupplyForm');
  var btn = document.getElementById('addSupplyBtn');
  if (form.style.display === 'none' || form.style.display === '') {
    form.style.display = 'block';
    if (btn) btn.style.display = 'none';
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    form.style.display = 'none';
    if (btn) btn.style.display = '';
  }
}

function saveSupplyItem() {
  var jobId = document.getElementById('supplyJobId').value;
  var date = document.getElementById('supplyDate').value;
  var item = document.getElementById('supplyItem').value.trim();
  var qty = parseInt(document.getElementById('supplyQty').value) || 0;
  var unitCost = parseFloat(document.getElementById('supplyUnitCost').value) || 0;
  var category = document.getElementById('supplyCategory').value;
  var notes = document.getElementById('supplyNotes').value.trim();
  if (!jobId || !date || !item || qty <= 0 || unitCost <= 0) { alert('Please fill in all required fields.'); return; }
  var total = (qty * unitCost).toFixed(2);
  var d = new Date(date);
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var dateStr = months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
  var catColors = {'Consumables':'blue','Equipment Rental':'green','Safety Gear':'amber','Chemicals':'amber','Parts & Hardware':'gold','Other':'gray'};
  var catClass = catColors[category] || 'gray';
  var tbody = document.getElementById('suppliesBody');
  var tr = document.createElement('tr');
  tr.style.animation = 'fadeIn 0.2s ease';
  tr.innerHTML = '<td>' + dateStr + '</td>' +
    '<td style="font-family:\'JetBrains Mono\',monospace;font-size:12px;">' + jobId + '</td>' +
    '<td>' + item + (notes ? ' <span style="font-size:10px;color:var(--light-gray);">(' + notes + ')</span>' : '') + '</td>' +
    '<td><span class="badge ' + catClass + '">' + category + '</span></td>' +
    '<td>' + qty + '</td>' +
    '<td>$' + unitCost.toFixed(2) + '</td>' +
    '<td style="font-weight:700;">$' + total + '</td>';
  tbody.insertBefore(tr, tbody.firstChild);
  // Reset form
  document.getElementById('supplyJobId').selectedIndex = 0;
  document.getElementById('supplyDate').value = '';
  document.getElementById('supplyItem').value = '';
  document.getElementById('supplyQty').value = '';
  document.getElementById('supplyUnitCost').value = '';
  document.getElementById('supplyCategory').selectedIndex = 0;
  document.getElementById('supplyNotes').value = '';
  toggleAddSupplyForm();
}

function exportTableCSV(tableId, filename) {
  var table = document.getElementById(tableId);
  if (!table) return;
  var csv = [];
  var rows = table.querySelectorAll('tr');
  for (var i = 0; i < rows.length; i++) {
    var row = [], cols = rows[i].querySelectorAll('th, td');
    for (var j = 0; j < cols.length; j++) {
      var text = cols[j].innerText.replace(/"/g, '""');
      row.push('"' + text + '"');
    }
    csv.push(row.join(','));
  }
  var blob = new Blob([csv.join('\n')], { type: 'text/csv' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = (filename || 'export') + '.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}


/* ===== WIREFRAME HELPERS (fused modules) ===== */
function wfToast(msg) {
  var t = document.getElementById('wfToast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'wfToast';
    t.className = 'wf-toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  void t.offsetWidth;
  t.classList.add('on');
  clearTimeout(window.__wfToastTimer);
  window.__wfToastTimer = setTimeout(function () { t.classList.remove('on'); }, 2600);
}

function openModal(id) {
  var m = document.getElementById(id);
  if (m) m.style.display = 'flex';
}

function closeModal(id) {
  var m = document.getElementById(id);
  if (m) m.style.display = 'none';
}

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    document.querySelectorAll('.wf-modal').forEach(function (m) { m.style.display = 'none'; });
  }
});

/* ---- Tabs: activate the clicked tab and reveal its matching pane ---- */
function pickTab(el) {
  var bar = el.parentElement;
  bar.querySelectorAll('.tab').forEach(function (t) { t.classList.remove('active'); });
  el.classList.add('active');
  var key = el.getAttribute('data-pane');
  if (!key) return;
  var scope = bar.parentElement;
  scope.querySelectorAll('[data-pane-body]').forEach(function (p) {
    p.style.display = (p.getAttribute('data-pane-body') === key) ? '' : 'none';
  });
}
