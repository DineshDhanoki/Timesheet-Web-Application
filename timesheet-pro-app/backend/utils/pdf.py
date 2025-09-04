from jinja2 import Template
from weasyprint import HTML, CSS
import json
from datetime import datetime

base_css = CSS(string='''
@page { size: A4; margin: 24px; }
body { font-family: Arial, sans-serif; font-size: 12px; color: #111; }
h1 { font-size: 18px; margin: 0 0 8px 0; }
h2 { font-size: 14px; margin: 0 0 6px 0; }
table { width: 100%; border-collapse: collapse; }
th, td { border: 1px solid #999; padding: 6px; }
tfoot td { font-weight: bold; }
.meta { margin-bottom: 12px; }
.row { display:flex; justify-content: space-between; }
.label { color:#555; }
.value { font-weight: 600; }
''')

template_str = '''
<div class="meta">
  <div class="row">
    <div><h1>TechnoApex Ltd.</h1></div>
    <div><h2>Timesheet</h2></div>
  </div>
  <div>Customer: <strong>{{ t.client }}</strong></div>
  <div>Manager: <strong>{{ t.manager }}</strong></div>
  <div>Week: <strong>{{ t.week_start }} to {{ t.week_end }}</strong></div>
  <div>Total Hours: <strong>{{ t.total_hours }}</strong></div>
</div>
<table>
  <thead>
    <tr><th>Day</th><th>Date</th><th>Hours</th><th>Description</th></tr>
  </thead>
  <tbody>
    {% for e in entries %}
    <tr>
      <td>{{ e.day }}</td>
      <td>{{ e.date }}</td>
      <td>{{ e.hours }}</td>
      <td>{{ e.description }}</td>
    </tr>
    {% endfor %}
  </tbody>
  <tfoot>
    <tr><td colspan="2">Total</td><td>{{ t.total_hours }}</td><td></td></tr>
  </tfoot>
</table>
'''

def render_timesheet_pdf(t):
    entries = json.loads(t.entries_json)
    # decorate with day names
    for e in entries:
        dt = datetime.fromisoformat(e['date'])
        e['day'] = dt.strftime('%A')
    html = Template(template_str).render(t={
        "client": t.client,
        "manager": t.manager,
        "week_start": t.week_start.strftime('%Y-%m-%d'),
        "week_end": t.week_end.strftime('%Y-%m-%d'),
        "total_hours": f"{t.total_hours:.2f}",
    }, entries=entries)
    pdf = HTML(string=html).write_pdf(stylesheets=[base_css])
    return pdf
