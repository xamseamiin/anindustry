import json
from datetime import datetime
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.platypus import Table, TableStyle

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'tmp' / 'live-financial-data.json'
OUT = ROOT / 'output' / 'pdf' / 'AN-Industries-Live-Financial-Report-2026-08.pdf'
LOGO = ROOT / 'public' / 'logo.png'
W, H = A4
NAVY = colors.HexColor('#07172F'); GREEN = colors.HexColor('#159B50')
RED = colors.HexColor('#DC2626'); MUTED = colors.HexColor('#6B7280')
LINE = colors.HexColor('#E2E5E8'); TOTAL_BG = colors.HexColor('#F4F7F8')

def money(value): return f'{float(value or 0):,.2f} ETB'
def clip(value, limit):
    text=str(value or '-')
    return text if len(text) <= limit else text[:limit-3].rstrip() + '...'
def dt(value):
    parsed=datetime.fromisoformat(value.replace('Z','+00:00'))
    return parsed.strftime('%d %b %Y')

def build():
    payload=json.loads(DATA.read_text(encoding='utf-8-sig'))
    OUT.parent.mkdir(parents=True,exist_ok=True)
    c=canvas.Canvas(str(OUT),pagesize=A4)
    c.drawImage(str(LOGO),15*mm,H-31*mm,25*mm,19*mm,preserveAspectRatio=True,mask='auto')
    c.setFillColor(NAVY); c.setFont('Helvetica-Bold',12.5); c.drawString(45*mm,H-18*mm,'AN INDUSTRIES PARTNERSHIP')
    c.setFillColor(MUTED); c.setFont('Helvetica-Oblique',7); c.drawString(45*mm,H-25*mm,'Monthly General Transaction Report - LIVE DATA')
    meta=[('DATE',datetime.now().strftime('%d %b %Y')),('REF NUMBER','AN-LIVE-202608'),('PREPARED BY','Financial System')]
    for i,(label,value) in enumerate(meta):
        y=H-(12+i*6.5)*mm; c.setFillColor(NAVY); c.setFont('Helvetica-Bold',6); c.drawString(148*mm,y,label)
        c.setFont('Helvetica',6); c.drawRightString(W-15*mm,y,value)
    c.setStrokeColor(GREEN); c.setLineWidth(.6); c.line(15*mm,H-36*mm,W-15*mm,H-36*mm)
    summary=payload['summary']
    items=[('MONEY IN',summary['totalIn'],GREEN),('MONEY OUT',summary['totalOut'],RED),('BALANCE',summary['closingBalance'],NAVY)]
    for i,(label,value,color) in enumerate(items):
        x=15*mm+i*60*mm; c.setFillColor(MUTED); c.setFont('Helvetica-Bold',6.5); c.drawString(x,H-47*mm,label)
        c.setFillColor(color); c.setFont('Helvetica-Bold',10); c.drawString(x,H-56*mm,money(value))
    c.setStrokeColor(LINE); c.line(15*mm,H-61*mm,W-15*mm,H-61*mm)

    rows=[['DATE','CATEGORY','NAME / PERSON','DESCRIPTION','ACCOUNT','MONEY IN','MONEY OUT']]
    for row in payload['ledger']:
        rows.append([dt(row['date']),clip(row['category'] or 'General',18),clip(row['person'],22),clip(row['description'],27),clip(row['account'],15),money(row['inflow']) if row['inflow'] else '-',money(row['outflow']) if row['outflow'] else '-'])
    rows.append(['','','','','TOTAL',money(summary['totalIn']),money(summary['totalOut'])])
    row_h=7.5*mm
    table=Table(rows,colWidths=[24*mm,27*mm,30*mm,39*mm,19*mm,18*mm,17*mm],rowHeights=[row_h]*len(rows))
    table.setStyle(TableStyle([
        ('FONT',(0,0),(-1,0),'Helvetica-Bold',5.4),('TEXTCOLOR',(0,0),(-1,0),NAVY),
        ('FONT',(0,1),(-1,-2),'Helvetica',4.9),('TEXTCOLOR',(0,1),(-1,-2),NAVY),
        ('FONT',(0,-1),(-1,-1),'Helvetica-Bold',5.7),('BACKGROUND',(4,-1),(-1,-1),TOTAL_BG),
        ('TEXTCOLOR',(-2,-1),(-2,-1),GREEN),('TEXTCOLOR',(-1,-1),(-1,-1),RED),
        ('ALIGN',(-2,0),(-1,-1),'RIGHT'),('VALIGN',(0,0),(-1,-1),'MIDDLE'),
        ('LEFTPADDING',(0,0),(-1,-1),1.5),('RIGHTPADDING',(0,0),(-1,-1),1.5),
        ('LINEBELOW',(0,0),(-1,0),.6,colors.HexColor('#B9BEC3')),('LINEBELOW',(0,1),(-1,-2),.2,LINE)
    ]))
    table.wrapOn(c,174*mm,H); table.drawOn(c,15*mm,H-66*mm-len(rows)*row_h)
    c.setStrokeColor(LINE); c.line(15*mm,14*mm,W-15*mm,14*mm)
    c.setFillColor(MUTED); c.setFont('Helvetica',6); c.drawString(15*mm,9*mm,'AN Industries Partnership - Live Financial Report')
    c.drawRightString(W-15*mm,9*mm,f"Generated {datetime.now().strftime('%d %b %Y %H:%M')}")
    c.save(); print(OUT)

if __name__=='__main__': build()
