from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.platypus import Table, TableStyle

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "pdf" / "AN-Industory-Demo-Daily-Financial-Report.pdf"
LOGO = ROOT / "public" / "an-industory-logo.png"

NAVY = colors.HexColor("#0B1A33")
GREEN = colors.HexColor("#079D68")
RED = colors.HexColor("#DC2626")
GRAY = colors.HexColor("#667085")
PALE = colors.HexColor("#F5F8FA")
LINE = colors.HexColor("#D8DDE3")
W, H = A4


def money(value):
    return f"{value:,.2f} ETB"


def draw_header(c, page_no):
    c.drawImage(str(LOGO), 18*mm, H-45*mm, 32*mm, 32*mm, preserveAspectRatio=True, mask='auto')
    c.setFillColor(NAVY); c.setFont("Helvetica-Bold", 25); c.drawString(55*mm, H-25*mm, "AN-INDUSTORY")
    c.setFillColor(GREEN); c.setFont("Helvetica-Bold", 10); c.drawString(55*mm, H-33*mm, "DAILY FINANCIAL REPORT - DEMO")
    c.setFillColor(GRAY); c.setFont("Helvetica", 8); c.drawString(55*mm, H-39*mm, "Plastic Bottle Manufacturing Operations")
    meta = [("DATE", "2026-08-06"), ("REF NUMBER", "AN-D-20260806"), ("PREPARED BY", "Hamse Moalin")]
    for i, (label, value) in enumerate(meta):
        y = H-(18+i*8)*mm
        c.setFillColor(NAVY); c.setFont("Helvetica-Bold", 8); c.drawString(142*mm, y, label)
        c.setFont("Helvetica", 8); c.drawString(173*mm, y, value)
    c.setStrokeColor(GREEN); c.setLineWidth(0.8); c.line(15*mm, H-49*mm, W-15*mm, H-49*mm)
    c.setFillColor(colors.HexColor("#9AA3AF")); c.setFont("Helvetica", 6.8)
    c.drawString(15*mm, 10*mm, "Generated demo report - AN-Industory Financial System")
    c.drawCentredString(W/2, 10*mm, f"Page {page_no} of 2")
    c.drawRightString(W-15*mm, 10*mm, "For demonstration only")


def section(c, title, y):
    c.setFillColor(NAVY); c.setFont("Helvetica-Bold", 14); c.drawString(15*mm, y, title)
    c.setStrokeColor(GREEN); c.setLineWidth(0.5); c.line(15*mm, y-5*mm, W-15*mm, y-5*mm)
    return y-8*mm


def table(c, data, widths, x, y, row_height=8*mm, total_row=False, total_color=NAVY):
    t = Table(data, colWidths=widths, rowHeights=[row_height]*len(data))
    style = [
        ('FONT', (0,0), (-1,0), 'Helvetica-Bold', 7.5), ('TEXTCOLOR', (0,0), (-1,0), NAVY),
        ('FONT', (0,1), (-1,-1), 'Helvetica', 7.3), ('TEXTCOLOR', (0,1), (-1,-1), colors.HexColor('#26364A')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'), ('LINEBELOW', (0,0), (-1,0), 0.7, colors.HexColor('#AEB4BA')),
        ('LINEBELOW', (0,1), (-1,-1), 0.25, LINE), ('LEFTPADDING', (0,0), (-1,-1), 2), ('RIGHTPADDING', (0,0), (-1,-1), 2),
        ('ALIGN', (-1,0), (-1,-1), 'RIGHT'),
    ]
    if total_row:
        style += [('FONT', (0,-1), (-1,-1), 'Helvetica-Bold', 8), ('BACKGROUND', (0,-1), (-1,-1), PALE), ('TEXTCOLOR', (-1,-1), (-1,-1), total_color)]
    t.setStyle(TableStyle(style)); t.wrapOn(c, sum(widths), H); t.drawOn(c, x, y-len(data)*row_height)
    return y-len(data)*row_height


def build():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUT), pagesize=A4)

    draw_header(c, 1)
    y = section(c, "Account Balances", H-60*mm)
    accounts = [
        ["ACCOUNT", "PREVIOUS BALANCE", "CURRENT BALANCE", "CHANGE"],
        ["E-Birr Merchant", money(50000), money(50050), money(50)],
        ["CBE Business", money(125000), money(143500), money(18500)],
        ["TOTAL", money(175000), money(193550), money(18550)],
    ]
    y = table(c, accounts, [49*mm, 48*mm, 48*mm, 35*mm], 15*mm, y, 8*mm, True, GREEN)-10*mm

    y = section(c, "Income Received", y)
    income = [
        ["SOURCE", "DESCRIPTION", "ACCOUNT", "AMOUNT"],
        ["Product Sales", "PET bottles sales collection", "CBE Business", money(25000)],
        ["Account Top-up", "Operating cash deposit", "E-Birr Merchant", money(10000)],
        ["", "", "TOTAL INCOME", money(35000)],
    ]
    y = table(c, income, [42*mm, 70*mm, 38*mm, 30*mm], 15*mm, y, 8*mm, True, GREEN)-10*mm

    y = section(c, "Operational Expenses", y)
    expenses = [
        ["CATEGORY", "EMPLOYEE / VENDOR", "DESCRIPTION", "AMOUNT"],
        ["Raw Materials", "Jigjiga Polymer Supply", "PET preforms and caps", money(8500)],
        ["Salaries", "Production Team", "Daily labor payment", money(4000)],
        ["Transport & Fuel", "Kiro Transport", "Material delivery fuel", money(1200)],
        ["Utilities", "Office / Factory", "Electricity and internet", money(750)],
        ["Equipment Rental", "Jigjiga Equipment", "Forklift rental", money(2000)],
        ["", "", "TOTAL OPERATING EXPENSE", money(16450)],
    ]
    table(c, expenses, [40*mm, 50*mm, 62*mm, 28*mm], 15*mm, y, 7.4*mm, True, RED)
    c.showPage()

    draw_header(c, 2)
    y = section(c, "Category Summary", H-60*mm)
    summary = [
        ["CATEGORY", "TRANSACTIONS", "TOTAL AMOUNT", "% OF EXPENSE"],
        ["Raw Materials", "1", money(8500), "51.67%"],
        ["Salaries", "1", money(4000), "24.32%"],
        ["Equipment Rental", "1", money(2000), "12.16%"],
        ["Transport & Fuel", "1", money(1200), "7.29%"],
        ["Utilities", "1", money(750), "4.56%"],
        ["TOTAL", "5", money(16450), "100%"],
    ]
    y = table(c, summary, [55*mm, 35*mm, 52*mm, 38*mm], 15*mm, y, 8*mm, True, GREEN)-14*mm

    c.setFillColor(NAVY); c.roundRect(13*mm, y-12*mm, W-26*mm, 12*mm, 2*mm, fill=1, stroke=0)
    c.setFillColor(colors.white); c.setFont("Helvetica-Bold", 10); c.drawString(18*mm, y-7.5*mm, "DAILY FINANCIAL STATEMENT")
    c.setFont("Helvetica", 7); c.drawRightString(W-18*mm, y-7.5*mm, "2026-08-06")
    y -= 22*mm
    statement = [
        ("Opening Balance", money(175000), NAVY, False),
        ("+ Income Received", "+ " + money(35000), GREEN, False),
        ("TOTAL INFLOWS", "+ " + money(35000), GREEN, True),
        ("- Operational Expenses", "- " + money(16450), RED, False),
        ("TOTAL OUTFLOWS", "- " + money(16450), RED, True),
    ]
    for label, value, color, bold in statement:
        c.setFillColor(color); c.setFont("Helvetica-Bold" if bold else "Helvetica", 9)
        c.drawString(18*mm, y, label); c.drawRightString(W-18*mm, y, value)
        if bold: c.setStrokeColor(LINE); c.line(18*mm, y-3*mm, W-18*mm, y-3*mm)
        y -= 10*mm
    c.setStrokeColor(NAVY); c.setLineWidth(1); c.line(15*mm, y+3*mm, W-15*mm, y+3*mm); c.line(15*mm, y, W-15*mm, y)
    c.setFont("Helvetica-Bold", 13); c.setFillColor(NAVY); c.drawString(15*mm, y-10*mm, "Closing Balance")
    c.setFillColor(GREEN); c.drawRightString(W-15*mm, y-10*mm, money(193550))
    c.setFillColor(GRAY); c.setFont("Helvetica-Oblique", 7.5); c.drawString(15*mm, y-25*mm, "Demo data only - values are not connected to the live company database.")
    c.save()
    print(OUT)


if __name__ == '__main__':
    build()
