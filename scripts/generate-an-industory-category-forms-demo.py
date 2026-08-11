from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.platypus import Table, TableStyle

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output' / 'pdf' / 'AN-Industries-General-Transactions-Demo-v4.pdf'
LOGO = ROOT / 'public' / 'logo.png'
W, H = A4
NAVY = colors.HexColor('#07172F')
GREEN = colors.HexColor('#159B50')
RED = colors.HexColor('#E52323')
LINE = colors.HexColor('#E2E5E8')
STRONG_LINE = colors.HexColor('#BFC3C7')
MUTED = colors.HexColor('#6B7280')
TOTAL_BG = colors.HexColor('#F4F7F8')

OPENING_BALANCE = 175000
ROWS = [
    ('06 Aug 08:15', 'Deposit', 'Abdehakim A. Mumin', 'Petty cash account top-up', 'E-Birr', 10000, 0),
    ('06 Aug 09:00', 'Income', 'Product Customer', 'PET bottle sales received', 'CBE', 25000, 0),
    ('06 Aug 09:20', 'Salary', 'Qordheere', 'Monthly salary part-payment', 'CBE', 0, 2500),
    ('06 Aug 09:35', 'Salary', 'Mustaf', 'Delivery support labor', 'E-Birr', 0, 1500),
    ('06 Aug 10:00', 'Raw Materials', 'Jigjiga Polymer', 'PET preforms purchase', 'E-Birr', 0, 6500),
    ('06 Aug 10:15', 'Raw Materials', 'Jigjiga Polymer', 'Bottle caps purchase', 'CBE', 0, 2000),
    ('06 Aug 10:40', 'Transport & Fuel', 'Kacaan', 'Raw material delivery', 'E-Birr', 0, 700),
    ('06 Aug 11:05', 'Transport & Fuel', 'Mustaf', 'Factory delivery fuel', 'E-Birr', 0, 500),
    ('06 Aug 11:30', 'Utilities', 'Jigjiga Utility', 'Factory electricity bill', 'CBE', 0, 450),
    ('06 Aug 11:45', 'Utilities', 'Office ISP', 'Internet and cloud bill', 'CBE', 0, 300),
    ('06 Aug 12:10', 'Rental', 'Jigjiga Equipment', 'Forklift rental', 'CBE', 0, 2000),
    ('06 Aug 12:30', 'Maintenance', 'Ahmed Technician', 'Filling machine repair', 'E-Birr', 0, 900),
    ('06 Aug 13:00', 'Consultancy', 'Factory Safety Advisor', 'Safety inspection service', 'CBE', 0, 1100),
]

def money(value):
    return f'{value:,.2f} ETB'

def build():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUT), pagesize=A4)

    # Correct AN Industries Partnership identity appears once at the top.
    c.drawImage(str(LOGO), 18*mm, H-31*mm, 25*mm, 19*mm, preserveAspectRatio=True, mask='auto')
    c.setFillColor(NAVY)
    c.setFont('Helvetica-Bold', 12.5)
    c.drawString(48*mm, H-19*mm, 'AN INDUSTRIES PARTNERSHIP')
    c.setFillColor(MUTED)
    c.setFont('Helvetica-Oblique', 7)
    c.drawString(48*mm, H-26*mm, 'Daily General Transaction Report')
    meta = [('DATE', '06 Aug 2026'), ('REF NUMBER', 'AN-DFR-20260806'), ('PREPARED BY', 'Hamse Moalin')]
    for i, (label, value) in enumerate(meta):
        y = H-(13+i*6.5)*mm
        c.setFillColor(NAVY); c.setFont('Helvetica-Bold', 6.2); c.drawString(148*mm, y, label)
        c.setFont('Helvetica', 6.2); c.drawRightString(W-18*mm, y, value)
    c.setStrokeColor(GREEN); c.setLineWidth(.6); c.line(18*mm, H-36*mm, W-18*mm, H-36*mm)

    # Very light correct-logo watermark, matching the reference report style.
    c.saveState()
    try:
        c.setFillAlpha(.045)
    except Exception:
        pass
    c.drawImage(str(LOGO), W/2-47*mm, H/2-37*mm, 94*mm, 74*mm, preserveAspectRatio=True, mask='auto')
    c.restoreState()

    total_in = sum(row[5] for row in ROWS)
    total_out = sum(row[6] for row in ROWS)
    balance = OPENING_BALANCE + total_in - total_out

    # Compact three-column summary (not cards).
    summary = Table([
        ['MONEY IN', 'MONEY OUT', 'BALANCE'],
        [money(total_in), money(total_out), money(balance)],
    ], colWidths=[58*mm]*3, rowHeights=[7*mm, 9*mm])
    summary.setStyle(TableStyle([
        ('FONT',(0,0),(-1,0),'Helvetica-Bold',6.8),('TEXTCOLOR',(0,0),(-1,0),MUTED),
        ('FONT',(0,1),(-1,1),'Helvetica-Bold',10),('TEXTCOLOR',(0,1),(0,1),GREEN),
        ('TEXTCOLOR',(1,1),(1,1),RED),('TEXTCOLOR',(2,1),(2,1),NAVY),
        ('ALIGN',(0,0),(-1,-1),'LEFT'),('VALIGN',(0,0),(-1,-1),'MIDDLE'),
        ('LINEBELOW',(0,1),(-1,1),.4,LINE),('LEFTPADDING',(0,0),(-1,-1),2),
    ]))
    summary.wrapOn(c,174*mm,H); summary.drawOn(c,18*mm,H-58*mm)

    data = [['DATE', 'CATEGORY', 'NAME / PERSON', 'DESCRIPTION', 'ACCOUNT', 'MONEY IN', 'MONEY OUT']]
    data += [[date, category, person, description, account,
              money(amount_in) if amount_in else '-', money(amount_out) if amount_out else '-']
             for date, category, person, description, account, amount_in, amount_out in ROWS]
    data.append(['', '', '', '', 'TOTAL', money(total_in), money(total_out)])

    row_h = 8.2*mm
    table = Table(data, colWidths=[24*mm, 27*mm, 30*mm, 39*mm, 19*mm, 18*mm, 17*mm], rowHeights=[row_h]*len(data))
    table.setStyle(TableStyle([
        ('FONT', (0,0), (-1,0), 'Helvetica-Bold', 5.8),
        ('TEXTCOLOR', (0,0), (-1,0), NAVY),
        ('FONT', (0,1), (-1,-2), 'Helvetica', 5.8),
        ('TEXTCOLOR', (0,1), (-1,-2), NAVY),
        ('FONT', (0,-1), (-1,-1), 'Helvetica-Bold', 6.3),
        ('TEXTCOLOR', (-2,-1), (-2,-1), GREEN),('TEXTCOLOR', (-1,-1), (-1,-1), RED),
        ('BACKGROUND', (4,-1), (-1,-1), TOTAL_BG),
        ('ALIGN', (-2,0), (-1,-1), 'RIGHT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING', (0,0), (-1,-1), 2.5),
        ('RIGHTPADDING', (0,0), (-1,-1), 2.5),
        ('LINEBELOW', (0,0), (-1,0), .9, STRONG_LINE),
        ('LINEBELOW', (0,1), (-1,-2), .28, LINE),
        ('LINEABOVE', (4,-1), (-1,-1), .28, LINE),
    ]))
    table.wrapOn(c, 174*mm, H)
    table.drawOn(c, 18*mm, H-65*mm-len(data)*row_h)

    c.setStrokeColor(LINE); c.line(18*mm, 14*mm, W-18*mm, 14*mm)
    c.setFillColor(MUTED); c.setFont('Helvetica', 6.7)
    c.drawString(18*mm, 9*mm, 'AN Industries Partnership - Financial Report - Demo Data')
    c.drawRightString(W-18*mm, 9*mm, 'Page 1 of 1')
    c.save()
    print(OUT)

if __name__ == '__main__':
    build()
