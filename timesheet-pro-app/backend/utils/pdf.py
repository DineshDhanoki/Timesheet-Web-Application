from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.units import inch
from datetime import datetime
import json
import io

def render_timesheet_pdf(timesheet_data):
    """
    Generate a professional timesheet PDF
    
    timesheet_data structure:
    {
        'id': 123,
        'client': 'Claris International Inc',
        'manager': 'Sudheer Tivare', 
        'startDate': '2025-01-06',
        'entries': [
            {'date': '2025-01-06', 'hours': 8, 'description': 'Development work'},
            ...
        ],
        'user': 'John Doe',  # consultant name
        'total_hours': 40.0
    }
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=0.5*inch)
    styles = getSampleStyleSheet()
    elements = []

    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Title'],
        fontSize=18,
        textColor=colors.navy,
        spaceAfter=20
    )
    
    # Company Header
    title = Paragraph("TechnoApex Ltd. - Timesheet", title_style)
    elements.append(title)
    elements.append(Spacer(1, 12))

    # Header Information Table
    entries = timesheet_data.get('entries', [])
    start_date = timesheet_data.get('startDate', '')
    end_date = ''
    
    # Calculate end date (6 days after start date)
    if start_date and entries:
        try:
            start_dt = datetime.fromisoformat(start_date)
            end_dt = datetime.fromisoformat(entries[-1]['date']) if entries else start_dt
            end_date = end_dt.strftime('%Y-%m-%d')
        except:
            end_date = start_date

    total_hours = sum(float(entry.get('hours', 0)) for entry in entries)
    
    header_data = [
        ["Company:", "TechnoApex Ltd."],
        ["Customer:", timesheet_data.get('client', 'N/A')],
        ["Consultant:", timesheet_data.get('user', 'N/A')],
        ["Manager:", timesheet_data.get('manager', 'N/A')],
        ["Timesheet ID:", str(timesheet_data.get('id', 'N/A'))],
        ["Week Period:", f"{start_date} → {end_date}"],
        ["Total Hours:", f"{total_hours:.1f}"]
    ]
    
    header_table = Table(header_data, colWidths=[1.5*inch, 4*inch], hAlign="LEFT")
    header_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 20))

    # Time Entries Table
    subtitle = Paragraph("Time Entries", styles['Heading2'])
    elements.append(subtitle)
    elements.append(Spacer(1, 10))
    
    # Prepare time entries data
    time_data = [["Day", "Date", "Hours", "Work Description"]]
    
    for entry in entries:
        try:
            entry_date = datetime.fromisoformat(entry['date'])
            day_name = entry_date.strftime("%A")
            formatted_date = entry_date.strftime("%d-%m-%Y")
        except:
            day_name = "N/A"
            formatted_date = entry.get('date', 'N/A')
        
        hours = entry.get('hours', 0)
        description = entry.get('description', '')
        
        # Truncate long descriptions
        if len(description) > 60:
            description = description[:57] + "..."
            
        time_data.append([
            day_name,
            formatted_date,
            str(hours) if hours else "0",
            description
        ])
    
    # Add total row
    time_data.append(["", "TOTAL", f"{total_hours:.1f}", ""])
    
    time_table = Table(time_data, colWidths=[1*inch, 1.2*inch, 0.8*inch, 3*inch], 
                      repeatRows=1, hAlign="LEFT")
    time_table.setStyle(TableStyle([
        # Header row
        ('BACKGROUND', (0, 0), (-1, 0), colors.navy),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        
        # Data rows
        ('FONTNAME', (0, 1), (-1, -2), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -2), 9),
        ('GRID', (0, 0), (-1, -2), 0.5, colors.grey),
        
        # Alternating row colors
        ('ROWBACKGROUNDS', (0, 1), (-1, -2), [colors.white, colors.lightgrey]),
        
        # Total row
        ('BACKGROUND', (0, -1), (-1, -1), colors.lightblue),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('GRID', (0, -1), (-1, -1), 1, colors.black),
        
        # General formatting
        ('ALIGN', (2, 1), (2, -1), 'CENTER'),  # Hours column center aligned
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    
    elements.append(time_table)
    elements.append(Spacer(1, 20))

    # Summary Section
    summary_data = [
        ["Summary", ""],
        ["Total Working Days:", str(len([e for e in entries if float(e.get('hours', 0)) > 0]))],
        ["Total Hours:", f"{total_hours:.1f}"],
        ["Average Hours/Day:", f"{total_hours/7:.1f}" if entries else "0.0"],
    ]
    
    summary_table = Table(summary_data, colWidths=[2*inch, 2*inch], hAlign="LEFT")
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 30))

    # Footer
    footer_text = f"Generated on {datetime.now().strftime('%d-%m-%Y at %H:%M')} | TechnoApex Ltd."
    footer = Paragraph(footer_text, styles['Normal'])
    elements.append(footer)

    # Build PDF
    doc.build(elements)
    pdf_data = buffer.getvalue()
    buffer.close()
    
    return pdf_data


def render_timesheet_pdf_to_file(timesheet_data, filename="timesheet.pdf"):
    """
    Generate PDF and save to file
    """
    doc = SimpleDocTemplate(filename, pagesize=A4, topMargin=0.5*inch)
    # ... same content as above but using doc directly ...
    
    # For file output, you can reuse the same logic but build directly to file
    pdf_data = render_timesheet_pdf(timesheet_data)
    with open(filename, 'wb') as f:
        f.write(pdf_data)
    
    return filename