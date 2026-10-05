#!/usr/bin/env python3
"""Split crewviewpro_source.html into module-wise files."""
import re, os

with open('crewviewpro_source.html', 'r') as f:
    html = f.read()

# 1. Extract CSS (between <style> and </style>)
css_match = re.search(r'<style>\s*(.*?)\s*</style>', html, re.DOTALL)
css_content = css_match.group(1) if css_match else ''
os.makedirs('css', exist_ok=True)
with open('css/styles.css', 'w') as f:
    f.write(css_content)
print("✓ css/styles.css")

# 2. Extract sidebar HTML
sidebar_match = re.search(r'(<!-- ===== SIDEBAR ===== -->.*?</nav>)', html, re.DOTALL)
sidebar_html = sidebar_match.group(1) if sidebar_match else ''

# 3. Extract topbar HTML
topbar_match = re.search(r'(<!-- ===== TOPBAR ===== -->.*?</header>)', html, re.DOTALL)
topbar_html = topbar_match.group(1) if topbar_match else ''

# 4. Extract JS
js_match = re.search(r'<script>\s*(.*?)\s*</script>', html, re.DOTALL)
js_content = js_match.group(1) if js_match else ''
os.makedirs('js', exist_ok=True)

# 5. Extract all screens
screen_pattern = r'(<!-- =+ SCREEN \d+:.*?=+ -->.*?)</div>\s*(?=<!-- =+ SCREEN|</main>)'
# More robust: find screen divs
screens = []
screen_starts = [(m.start(), m.group(1)) for m in re.finditer(r'<!-- =+ (SCREEN [\d/]+:.*?) =+ -->', html)]

for i, (start, label) in enumerate(screen_starts):
    # Find the screen div id
    id_match = re.search(r'id="screen-(\w+)"', html[start:start+500])
    if not id_match:
        continue
    screen_id = id_match.group(1)

    # Extract content until next screen or </main>
    if i + 1 < len(screen_starts):
        end = screen_starts[i+1][0]
    else:
        end = html.index('</main>', start)

    screen_html = html[start:end].strip()
    screens.append((screen_id, label, screen_html))

print(f"Found {len(screens)} screens")

# Map screen IDs to page filenames
def screen_to_filename(sid):
    mapping = {
        'login': 'login',
        'dashboard': 'dashboard',
        'clients': 'clients',
        'clientDetail': 'client-detail',
        'employees': 'employees',
        'employeeDetail': 'employee-detail',
        'teams': 'teams',
        'jobs': 'jobs',
        'createJob': 'create-job',
        'jobDetail': 'job-detail',
        'calendar': 'calendar',
        'attendance': 'attendance',
        'timesheet': 'timesheet',
        'overtime': 'overtime',
        'geo': 'geo',
        'alerts': 'alerts',
        'reports': 'reports',
        'mileage': 'mileage',
        'billing': 'billing',
        'settings': 'settings',
        'audit': 'audit',
        'notifications': 'notifications',
    }
    return mapping.get(sid, sid)

# Build reverse map for sidebar links
filename_map = {sid: screen_to_filename(sid) for sid, _, _ in screens}

# Modify sidebar: replace onclick with href links
def make_sidebar_for_page(active_screen_id):
    s = sidebar_html
    # Replace onclick="showScreen('xxx')" with href="xxx.html"
    def replace_nav(m):
        full = m.group(0)
        sid = m.group(1)
        fname = filename_map.get(sid, sid)
        # Remove onclick, add href behavior
        new = full.replace(f"onclick=\"showScreen('{sid}')\"", f"onclick=\"window.location.href='{fname}.html'\"")
        # Mark active
        if sid == active_screen_id:
            new = new.replace('class="nav-item"', 'class="nav-item active"')
        else:
            new = new.replace('class="nav-item active"', 'class="nav-item"')
        return new

    s = re.sub(r'<div class="nav-item[^"]*"[^>]*onclick="showScreen\(\'(\w+)\'\)"[^>]*>.*?</div>',
               replace_nav, s, flags=re.DOTALL)
    return s

# Modify topbar for each page
def make_topbar_for_page(screen_id, title, crumb):
    t = topbar_html
    t = t.replace('id="topbarTitle">Operational Dashboard', f'id="topbarTitle">{title}')
    t = re.sub(r'<div class="breadcrumb".*?</div>\s*</div>',
               f'''<div class="breadcrumb" id="topbarBreadcrumb">
        <a href="dashboard.html">Home</a>
        <span>/</span>
        <span>{crumb}</span>
      </div>
    </div>''', t, count=1, flags=re.DOTALL)
    return t

# Screen titles/crumbs from the JS screenMap
screen_info = {
    'dashboard': ('Operational Dashboard', 'Dashboard'),
    'login': ('Login & Authentication', 'Login'),
    'clients': ('Client Master', 'Clients'),
    'clientDetail': ('Client Detail', 'Clients / Detail'),
    'employees': ('Employee Master', 'Employees'),
    'employeeDetail': ('Employee Profile', 'Employees / Profile'),
    'teams': ('Teams & Crew Management', 'Teams'),
    'jobs': ('Jobs & Dispatch', 'Dispatch / Jobs'),
    'createJob': ('Create Job', 'Dispatch / Create Job'),
    'jobDetail': ('Job Execution View', 'Dispatch / Job Detail'),
    'calendar': ('Job Scheduling Calendar', 'Dispatch / Calendar'),
    'attendance': ('Attendance & Time Tracking', 'Attendance'),
    'timesheet': ('Timesheet Approval', 'Timesheets'),
    'overtime': ('Overtime Monitor', 'Overtime'),
    'geo': ('Geo-Compliance & Locations', 'Geo & Locations'),
    'alerts': ('Alerts & Exceptions', 'Alerts'),
    'reports': ('Reports & Analytics', 'Reports'),
    'mileage': ('Mileage Tracker', 'Mileage'),
    'billing': ('Billing & Job Costing', 'Billing'),
    'settings': ('System Configuration', 'Settings'),
    'audit': ('Audit Trail', 'Audit'),
    'notifications': ('Notifications', 'Notifications'),
}

# Modify JS: update showScreen to navigate to pages, keep showClientTab
modified_js = '''// Screen navigation (multi-page)
function showScreen(id) {
  const fileMap = {
''' + ',\n'.join(f"    '{sid}': '{screen_to_filename(sid)}.html'" for sid in filename_map) + '''
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
'''

with open('js/app.js', 'w') as f:
    f.write(modified_js)
print("✓ js/app.js")

# 6. Generate page files
os.makedirs('pages', exist_ok=True)

for screen_id, label, screen_content in screens:
    fname = screen_to_filename(screen_id)
    title, crumb = screen_info.get(screen_id, (screen_id, screen_id))

    sidebar = make_sidebar_for_page(screen_id)
    topbar = make_topbar_for_page(screen_id, title, crumb)

    # Make screen content visible (replace class="screen" with class="screen active")
    content = screen_content.replace(f'class="screen"', 'class="screen active"')
    # Also handle if it was already active
    content = content.replace('class="screen active"', 'class="screen active"')

    # Replace showScreen('xxx') in content with page navigation
    for sid, fn in filename_map.items():
        content = content.replace(f"showScreen('{sid}')", f"window.location.href='{fn}.html'")

    page_html = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CrewViewPro - {title}</title>
<link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800;900&family=Barlow+Condensed:wght@600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../css/styles.css">
</head>
<body>

{sidebar}

{topbar}

<!-- ===== MAIN CONTENT ===== -->
<main class="main">

{content}

</main>

<script src="../js/app.js"></script>
</body>
</html>
'''

    with open(f'pages/{fname}.html', 'w') as f:
        f.write(page_html)
    print(f"✓ pages/{fname}.html")

# 7. Create index.html that redirects to dashboard
index_html = '''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="refresh" content="0;url=pages/dashboard.html">
<title>CrewViewPro - Redirecting...</title>
</head>
<body>
<p>Redirecting to <a href="pages/dashboard.html">Dashboard</a>...</p>
</body>
</html>
'''

with open('index.html', 'w') as f:
    f.write(index_html)
print("✓ index.html")

print("\n✅ Split complete! Open index.html or pages/dashboard.html to start.")
