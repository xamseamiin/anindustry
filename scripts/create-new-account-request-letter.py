from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "an-industry-new-account-request.pdf"
OUTPUT.parent.mkdir(parents=True, exist_ok=True)

regular_path = Path("C:/Windows/Fonts/arial.ttf")
bold_path = Path("C:/Windows/Fonts/arialbd.ttf")
if regular_path.exists() and bold_path.exists():
    pdfmetrics.registerFont(TTFont("Arial", str(regular_path)))
    pdfmetrics.registerFont(TTFont("Arial-Bold", str(bold_path)))
    regular, bold = "Arial", "Arial-Bold"
else:
    regular, bold = "Helvetica", "Helvetica-Bold"

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="Company", fontName=bold, fontSize=16, leading=19, textColor=colors.HexColor("#152536"), spaceAfter=2))
styles.add(ParagraphStyle(name="Meta", fontName=regular, fontSize=8.5, leading=11, textColor=colors.HexColor("#52606D")))
styles.add(ParagraphStyle(name="BodyLetter", fontName=regular, fontSize=11, leading=16, textColor=colors.HexColor("#1F2933"), spaceAfter=8))
styles.add(ParagraphStyle(name="Subject", fontName=bold, fontSize=11, leading=15, textColor=colors.HexColor("#152536"), spaceBefore=9, spaceAfter=10))
styles.add(ParagraphStyle(name="Signature", fontName=regular, fontSize=10, leading=14, textColor=colors.HexColor("#1F2933")))

doc = SimpleDocTemplate(str(OUTPUT), pagesize=LETTER, leftMargin=25 * mm, rightMargin=25 * mm, topMargin=22 * mm, bottomMargin=20 * mm, title="AN Industry - New Account Request", author="AN Industry")

story = [
    Paragraph("AN INDUSTRY", styles["Company"]),
    Paragraph("AN INDUSTRIES PARTNERSHIP | Somali Region, Fafen Zone, Jigjiga", styles["Meta"]),
    Paragraph("Tel: 0913437741 | TIN: 0090669530", styles["Meta"]),
    Spacer(1, 12 * mm),
    Paragraph("17 September 2026", styles["BodyLetter"]),
    Paragraph("To: The Branch Manager", styles["BodyLetter"]),
    Paragraph("Subject: Request to Open a New Business Account", styles["Subject"]),
    Paragraph("Dear Sir/Madam,", styles["BodyLetter"]),
    Paragraph("We kindly request your bank to open a new business account in the name of <b>AN INDUSTRY</b> for our company, AN INDUSTRIES PARTNERSHIP. The account will be used for our lawful business transactions. Please process this request and advise us of any required documents.", styles["BodyLetter"]),
    Paragraph("Yours faithfully,", styles["BodyLetter"]),
    Spacer(1, 12 * mm),
]

signatures = Table([
    [Paragraph("Signature: ______________________________", styles["Signature"]), Paragraph("Signature: ______________________________", styles["Signature"])],
    [Paragraph("Mr. Abdehakim Abdi Mumin", styles["Signature"]), Paragraph("Mr. Nur Mohamed Amin", styles["Signature"])],
    [Paragraph("General Manager", styles["Meta"]), Paragraph("Authorized Signatory", styles["Meta"])],
    [Paragraph("Date: __________________", styles["Signature"]), Paragraph("Date: __________________", styles["Signature"])],
], colWidths=[82 * mm, 82 * mm])
signatures.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 8), ("TOPPADDING", (0, 0), (-1, -1), 2), ("BOTTOMPADDING", (0, 0), (-1, -1), 3)]))
story.append(signatures)
story.extend([Spacer(1, 10 * mm), Paragraph("Company Stamp: ______________________________", styles["Signature"])])

def footer(canvas, document):
    canvas.saveState()
    canvas.setFont(regular, 7.5)
    canvas.setFillColor(colors.HexColor("#7B8794"))
    canvas.drawString(25 * mm, 10 * mm, "AN INDUSTRY - New Account Request")
    canvas.restoreState()

doc.build(story, onFirstPage=footer)
print(OUTPUT)
