from docx import Document
from docx.shared import Inches, Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from pathlib import Path

out = Path(r"C:\Users\OMEN\projects\An-Industory\output\docx\an-industry-new-account-request.docx")
out.parent.mkdir(parents=True, exist_ok=True)

doc = Document()
sec = doc.sections[0]
sec.top_margin = Inches(0.8)
sec.bottom_margin = Inches(0.8)
sec.left_margin = Inches(1.0)
sec.right_margin = Inches(1.0)

styles = doc.styles
styles['Normal'].font.name = 'Arial'
styles['Normal']._element.rPr.rFonts.set(qn('w:eastAsia'), 'Arial')
styles['Normal'].font.size = Pt(11)

def p(text='', bold=False, size=11, align=None, space_after=6):
    para = doc.add_paragraph()
    if align is not None:
        para.alignment = align
    para.paragraph_format.space_after = Pt(space_after)
    run = para.add_run(text)
    run.bold = bold
    run.font.name = 'Arial'
    run._element.rPr.rFonts.set(qn('w:eastAsia'), 'Arial')
    run.font.size = Pt(size)
    return para

title = doc.add_paragraph()
title.alignment = WD_ALIGN_PARAGRAPH.CENTER
title.paragraph_format.space_after = Pt(2)
r = title.add_run('AN INDUSTRY')
r.font.name = 'Arial'
r._element.rPr.rFonts.set(qn('w:eastAsia'), 'Arial')
r.font.size = Pt(16)
r.bold = True

p('AN INDUSTRIES PARTNERSHIP', bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=0)
p('Somali Region, Fafen Zone, Jigjiga | Tel: 0913437741 | TIN: 0090669530', align=WD_ALIGN_PARAGRAPH.CENTER, size=10, space_after=18)

p('17 September 2026', space_after=12)
p('To: The Branch Manager', space_after=4)
p('Subject: Request to Open a New Business Account', bold=True, space_after=12)

p('Dear Sir/Madam,', space_after=8)
p('We kindly request your bank to open a new business account in the name of AN INDUSTRY for our company, AN INDUSTRIES PARTNERSHIP. The account will be used for our lawful business transactions. Please process this request and advise us of any required documents.', space_after=12)
p('Yours faithfully,', space_after=18)

table = doc.add_table(rows=3, cols=2)
table.alignment = WD_TABLE_ALIGNMENT.CENTER
table.autofit = False
for row in table.rows:
    for cell in row.cells:
        cell.width = Inches(3.25)
        cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
        tcPr = cell._tc.get_or_add_tcPr()
        borders = OxmlElement('w:tcBorders')
        for edge in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV'):
            tag = OxmlElement(f'w:{edge}')
            tag.set(qn('w:val'), 'nil')
            borders.append(tag)
        tcPr.append(borders)

entries = [
    ('Signature: ____________________', 'Signature: ____________________'),
    ('Mr. Abdehakim Abdi Mumin', 'Mr. Nur Mohamed Amin'),
    ('General Manager', 'Authorized Signatory'),
]
for i, values in enumerate(entries):
    for j, value in enumerate(values):
        para = table.cell(i, j).paragraphs[0]
        para.paragraph_format.space_after = Pt(2 if i else 8)
        run = para.add_run(value)
        run.font.name = 'Arial'
        run._element.rPr.rFonts.set(qn('w:eastAsia'), 'Arial')
        run.font.size = Pt(10.5)
        if i == 1:
            run.bold = True

p('Company Stamp: ______________________________', space_after=0)

doc.core_properties.title = 'Request to Open a New Business Account'
doc.core_properties.author = 'AN INDUSTRIES PARTNERSHIP'
doc.save(out)
print(out)
