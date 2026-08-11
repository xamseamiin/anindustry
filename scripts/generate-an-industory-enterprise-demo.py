from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.platypus import Table, TableStyle
from pypdf import PdfReader, PdfWriter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output' / 'pdf' / 'AN-Industory-Enterprise-Report-Demo.pdf'
LOGO = ROOT / 'public' / 'an-industory-logo.png'
W, H = landscape(A4)
NAVY = colors.HexColor('#0B1A33')
GREEN = colors.HexColor('#079D68')
CYAN = colors.HexColor('#0EA5C6')
RED = colors.HexColor('#DC2626')
ORANGE = colors.HexColor('#EA8A00')
PALE = colors.HexColor('#F3F7F9')
LINE = colors.HexColor('#D9E0E6')
TEXT = colors.HexColor('#26364A')
MUTED = colors.HexColor('#667085')

def money(v): return f'{v:,.2f} ETB'

def base(c, page, title, subtitle):
    c.setPageSize(landscape(A4))
    c.resetTransforms()
    c.setFillColor(PALE); c.rect(0, H-40*mm, W, 40*mm, fill=1, stroke=0)
    c.drawImage(str(LOGO), 14*mm, H-34*mm, 26*mm, 26*mm, preserveAspectRatio=True, mask='auto')
    c.setFillColor(NAVY); c.setFont('Helvetica-Bold', 20); c.drawString(45*mm, H-19*mm, 'AN-INDUSTORY')
    c.setFillColor(GREEN); c.setFont('Helvetica-Bold', 9.5); c.drawString(45*mm, H-27*mm, title.upper())
    c.setFillColor(MUTED); c.setFont('Helvetica', 7.5); c.drawString(45*mm, H-33*mm, subtitle)
    meta=[('PERIOD','06 Aug 2026'),('REPORT','AN-ENT-DEMO-001'),('PREPARED BY','Hamse Moalin')]
    for i,(k,v) in enumerate(meta):
        y=H-(12+i*9)*mm; c.setFillColor(NAVY); c.setFont('Helvetica-Bold',7.5); c.drawString(211*mm,y,k)
        c.setFont('Helvetica',7.5); c.drawString(241*mm,y,v)
    c.setStrokeColor(GREEN); c.setLineWidth(.7); c.line(14*mm,H-40*mm,W-14*mm,H-40*mm)
    c.setStrokeColor(LINE); c.line(14*mm,10*mm,W-14*mm,10*mm)
    c.setFillColor(MUTED); c.setFont('Helvetica',6.5); c.drawString(14*mm,6*mm,'AN-Industory Enterprise Financial & Factory Report - DEMO DATA')
    c.drawCentredString(W/2,6*mm,f'Page {page} of 7'); c.drawRightString(W-14*mm,6*mm,'Confidential - Demonstration Only')

def heading(c,text,y):
    c.setFillColor(NAVY); c.setFont('Helvetica-Bold',13); c.drawString(14*mm,y,text)
    c.setStrokeColor(GREEN); c.setLineWidth(.45); c.line(14*mm,y-4*mm,W-14*mm,y-4*mm)
    return y-8*mm

def grid(c,data,widths,y,align_last=True,total_color=None,row_h=8*mm,font=7.2):
    t=Table(data,colWidths=widths,rowHeights=[row_h]*len(data))
    st=[('FONT',(0,0),(-1,0),'Helvetica-Bold',font),('TEXTCOLOR',(0,0),(-1,0),NAVY),('BACKGROUND',(0,0),(-1,0),PALE),
        ('FONT',(0,1),(-1,-1),'Helvetica',font),('TEXTCOLOR',(0,1),(-1,-1),TEXT),('VALIGN',(0,0),(-1,-1),'MIDDLE'),
        ('GRID',(0,0),(-1,-1),.25,LINE),('LEFTPADDING',(0,0),(-1,-1),3),('RIGHTPADDING',(0,0),(-1,-1),3)]
    if align_last: st.append(('ALIGN',(-1,0),(-1,-1),'RIGHT'))
    if total_color:
        st += [('FONT',(0,-1),(-1,-1),'Helvetica-Bold',font+0.3),('BACKGROUND',(0,-1),(-1,-1),colors.white),('TEXTCOLOR',(-1,-1),(-1,-1),total_color)]
    t.setStyle(TableStyle(st)); t.wrapOn(c,sum(widths),H)
    c.saveState(); t.drawOn(c,14*mm,y-len(data)*row_h); c.restoreState()
    return y-len(data)*row_h

def card(c,x,y,w,label,value,color=NAVY,note=''):
    c.setFillColor(PALE); c.roundRect(x,y,w,23*mm,2*mm,fill=1,stroke=0)
    c.setFillColor(MUTED); c.setFont('Helvetica-Bold',7); c.drawString(x+5*mm,y+16*mm,label.upper())
    c.setFillColor(color); c.setFont('Helvetica-Bold',13); c.drawString(x+5*mm,y+8*mm,value)
    if note: c.setFillColor(MUTED); c.setFont('Helvetica',6.3); c.drawRightString(x+w-4*mm,y+4*mm,note)

def page1(c):
    base(c,1,'Financial Overview','Cash position, account availability and daily movement')
    y=H-51*mm
    heading(c,'Executive Financial Position',y)
    labels=[('Opening Balance',175000,NAVY),('Money In',35000,GREEN),('Paid Expenses',16450,RED),('Available Balance',193550,GREEN)]
    for i,(k,v,col) in enumerate(labels): card(c,14*mm+i*69*mm,H-88*mm,63*mm,k,money(v),col)
    y=H-100*mm; y=heading(c,'Account Summary',y)
    data=[['ACCOUNT','OPENING','MONEY IN','MONEY OUT','RESERVED','AVAILABLE'],
          ['E-Birr Merchant',money(50000),money(10000),money(9950),money(2500),money(47550)],
          ['CBE Business',money(125000),money(25000),money(6500),money(0),money(143500)],
          ['TOTAL',money(175000),money(35000),money(16450),money(2500),money(191050)]]
    y=grid(c,data,[55*mm,43*mm,42*mm,42*mm,42*mm,45*mm],y,total_color=GREEN)
    y-=10*mm; heading(c,'Workflow Position',y)
    card(c,14*mm,y-31*mm,60*mm,'Pending Approval','2 Requests',ORANGE,money(6200))
    card(c,81*mm,y-31*mm,60*mm,'Approved / Unpaid','1 Request',CYAN,money(2500))
    card(c,148*mm,y-31*mm,60*mm,'Missing Receipts','1 Expense',RED,money(750))
    card(c,215*mm,y-31*mm,60*mm,'Paid & Verified','5 Expenses',GREEN,money(15700))

def page2(c):
    base(c,2,'Income & Deposits','All funds received during the reporting period')
    y=heading(c,'Income Received',H-51*mm)
    data=[['DATE','SOURCE','DESCRIPTION','ACCOUNT','TX / REFERENCE','AMOUNT','RECORDED BY'],
          ['06 Aug','Product Sales','PET bottles wholesale payment','CBE Business','DEP-260806-01',money(25000),'Hamse'],
          ['06 Aug','Account Top-up','Operating cash deposit','E-Birr Merchant','DEP-260806-02',money(10000),'Hamse'],
          ['','','','', 'TOTAL INCOME',money(35000),'']]
    y=grid(c,data,[25*mm,40*mm,65*mm,42*mm,43*mm,35*mm,28*mm],y,total_color=GREEN,row_h=10*mm,font=6.6)
    y-=12*mm; heading(c,'Income Classification',y)
    card(c,14*mm,y-31*mm,80*mm,'Product Sales',money(25000),GREEN,'71.43%')
    card(c,103*mm,y-31*mm,80*mm,'Account Top-up',money(10000),CYAN,'28.57%')
    card(c,192*mm,y-31*mm,83*mm,'Total Deposits',money(35000),NAVY,'2 transactions')
    c.setFillColor(PALE); c.roundRect(14*mm,32*mm,W-28*mm,36*mm,2*mm,fill=1,stroke=0)
    c.setFillColor(NAVY); c.setFont('Helvetica-Bold',9); c.drawString(20*mm,57*mm,'Control Check')
    c.setFont('Helvetica',8); c.setFillColor(TEXT); c.drawString(20*mm,48*mm,'All demo deposits are posted to a named company account and have a unique reference number.')
    c.setFillColor(GREEN); c.setFont('Helvetica-Bold',9); c.drawRightString(W-20*mm,48*mm,'RECONCILED')

def page3(c):
    base(c,3,'Factory Expenses','Paid operating expenses and supporting receipt status')
    y=heading(c,'Expense Ledger',H-51*mm)
    data=[['DATE','CATEGORY','EMPLOYEE / VENDOR','DESCRIPTION','ACCOUNT','STATUS','RECEIPT','AMOUNT'],
          ['06 Aug','Raw Materials','Jigjiga Polymer Supply','PET preforms and caps','E-Birr','PAID','VERIFIED',money(8500)],
          ['06 Aug','Salaries','Production Team','Daily labor payment','CBE','PAID','VERIFIED',money(4000)],
          ['06 Aug','Transport & Fuel','Kiro Transport','Material delivery fuel','E-Birr','PAID','VERIFIED',money(1200)],
          ['06 Aug','Utilities','Office / Factory','Electricity and internet','CBE','PAID','MISSING',money(750)],
          ['06 Aug','Equipment Rental','Jigjiga Equipment','Forklift rental','CBE','PAID','VERIFIED',money(2000)],
          ['','','','','','','TOTAL PAID',money(16450)]]
    y=grid(c,data,[24*mm,40*mm,50*mm,57*mm,29*mm,25*mm,28*mm,27*mm],y,total_color=RED,row_h=9*mm,font=6.2)
    y-=11*mm; heading(c,'Expense Controls',y)
    card(c,14*mm,y-31*mm,60*mm,'Paid Expenses',money(16450),RED,'5 transactions')
    card(c,81*mm,y-31*mm,60*mm,'Receipts Verified','4 of 5',GREEN,'80% coverage')
    card(c,148*mm,y-31*mm,60*mm,'Missing Receipt',money(750),ORANGE,'Utilities')
    card(c,215*mm,y-31*mm,60*mm,'Largest Category',money(8500),NAVY,'Raw Materials')

def page4(c):
    base(c,4,'Production & Raw Materials','Factory output, material movement and unit manufacturing cost')
    y=heading(c,'Raw Material Movement',H-51*mm)
    data=[['MATERIAL','UNIT','OPENING STOCK','PURCHASED','CONSUMED','WASTE','CLOSING STOCK'],
          ['PET Preforms','pcs','28,000','15,000','12,000','240','30,760'],
          ['Bottle Caps','pcs','31,500','20,000','12,000','120','39,380'],
          ['Labels','pcs','18,000','10,000','11,800','100','16,100'],
          ['Packaging Bags','bags','620','300','240','5','675']]
    y=grid(c,data,[55*mm,25*mm,40*mm,40*mm,40*mm,35*mm,45*mm],y,row_h=9*mm)
    y-=11*mm; heading(c,'Production Output',y)
    card(c,14*mm,y-31*mm,60*mm,'Good Bottles','11,760 pcs',GREEN,'98.0% yield')
    card(c,81*mm,y-31*mm,60*mm,'Rejected / Waste','240 pcs',RED,'2.0% waste')
    card(c,148*mm,y-31*mm,60*mm,'Production Cost',money(14200),NAVY,'materials + labor')
    card(c,215*mm,y-31*mm,60*mm,'Cost Per Bottle','1.21 ETB',CYAN,'demo estimate')
    y-=44*mm; heading(c,'Manufacturing Cost Composition',y)
    costs=[['COST COMPONENT','AMOUNT','SHARE'],['Raw Materials',money(8500),'59.86%'],['Direct Labor',money(4000),'28.17%'],['Energy & Factory Utilities',money(500),'3.52%'],['Equipment Allocation',money(1200),'8.45%'],['TOTAL PRODUCTION COST',money(14200),'100%']]
    grid(c,costs,[110*mm,80*mm,80*mm],y,total_color=NAVY,row_h=7.5*mm)

def page5(c):
    base(c,5,'Salary & Labor','Employee earnings, advances, payments and remaining balances')
    y=heading(c,'Employee Payroll Register',H-51*mm)
    data=[['EMPLOYEE','DEPARTMENT','TYPE','BASE / EARNED','ADVANCE','PAID','BALANCE','STATUS'],
          ['Qordheere','Production','Monthly',money(7000),money(1000),money(4000),money(2000),'PARTIAL'],
          ['Mustaf','Logistics','Daily Labor',money(1600),money(0),money(1600),money(0),'PAID'],
          ['Kacaan','Transport','Daily Labor',money(1200),money(0),money(1200),money(0),'PAID'],
          ['TOTAL','','',money(9800),money(1000),money(6800),money(2000),'']]
    y=grid(c,data,[46*mm,42*mm,37*mm,43*mm,35*mm,35*mm,35*mm,27*mm],y,total_color=NAVY,row_h=10*mm,font=6.6)
    y-=13*mm; heading(c,'Payroll Controls',y)
    card(c,14*mm,y-31*mm,60*mm,'Gross Earnings',money(9800),NAVY,'3 employees')
    card(c,81*mm,y-31*mm,60*mm,'Salary Advances',money(1000),ORANGE,'deducted')
    card(c,148*mm,y-31*mm,60*mm,'Paid This Period',money(6800),GREEN,'receipt linked')
    card(c,215*mm,y-31*mm,60*mm,'Outstanding',money(2000),RED,'Qordheere')
    c.setFillColor(PALE); c.roundRect(14*mm,28*mm,W-28*mm,28*mm,2*mm,fill=1,stroke=0)
    c.setFillColor(NAVY); c.setFont('Helvetica-Bold',8.5); c.drawString(20*mm,46*mm,'Data Integrity Rule')
    c.setFillColor(TEXT); c.setFont('Helvetica',7.5); c.drawString(20*mm,37*mm,'Deleting or reversing a salary transaction must automatically remove its payment from the employee record and recalculate the balance.')

def page6(c):
    base(c,6,'Approval & Receipt Audit','Full workflow trail from request through payment verification')
    y=heading(c,'Approval Workflow',H-51*mm)
    data=[['REQUEST','REQUESTER','CATEGORY','AMOUNT','APPROVER','WORKFLOW STATUS','RECEIPT'],
          ['REQ-260806-01','Muxiyadin','Maintenance',money(3700),'Abdehakim','PENDING APPROVAL','NOT REQUIRED'],
          ['REQ-260806-02','Muxiyadin','Utilities',money(2500),'Abdehakim','APPROVED / UNPAID','WAITING'],
          ['REQ-260806-03','Hamse','Raw Materials',money(8500),'Hamse','PAID & VERIFIED','VERIFIED'],
          ['REQ-260806-04','Hamse','Utilities',money(750),'Hamse','PAID','MISSING'],
          ['REQ-260806-05','Muxiyadin','Consultancy',money(1800),'Abdehakim','REJECTED','N/A']]
    y=grid(c,data,[36*mm,35*mm,40*mm,33*mm,35*mm,62*mm,38*mm],y,row_h=10*mm,font=6.4)
    y-=13*mm; heading(c,'Audit Status',y)
    card(c,14*mm,y-31*mm,60*mm,'Pending Approval','1',ORANGE,money(3700))
    card(c,81*mm,y-31*mm,60*mm,'Approved / Unpaid','1',CYAN,money(2500))
    card(c,148*mm,y-31*mm,60*mm,'Paid / Verified','1',GREEN,money(8500))
    card(c,215*mm,y-31*mm,60*mm,'Receipt Exception','1',RED,money(750))
    c.setFillColor(PALE); c.roundRect(14*mm,25*mm,W-28*mm,31*mm,2*mm,fill=1,stroke=0)
    c.setFillColor(NAVY); c.setFont('Helvetica-Bold',8.5); c.drawString(20*mm,47*mm,'Required Controls')
    c.setFillColor(TEXT); c.setFont('Helvetica',7.2)
    c.drawString(20*mm,38*mm,'- Only Hamse Moalin and Abdehakim Mumin can approve or reject requests.')
    c.drawString(20*mm,31*mm,'- Members can submit requests and upload receipts, but cannot approve their own requests.')

def page7(c):
    base(c,7,'Management Summary','Decision-ready view of finance, production and operational risk')
    y=heading(c,'Management Dashboard',H-51*mm)
    cards=[('Total Income',money(35000),GREEN,'+20% demo'),('Total Expenses',money(16450),RED,'47% of inflow'),('Net Cash Flow',money(18550),GREEN,'positive'),('Available Cash',money(191050),NAVY,'after reserves'),
           ('Production Output','11,760 pcs',CYAN,'98% yield'),('Cost Per Bottle','1.21 ETB',NAVY,'demo estimate'),('Pending Approval',money(3700),ORANGE,'1 request'),('Missing Receipts',money(750),RED,'1 exception')]
    for i,(k,v,col,note) in enumerate(cards):
        row=i//4; colidx=i%4; card(c,14*mm+colidx*67*mm,H-(88+row*34)*mm,60*mm,k,v,col,note)
    y=H-132*mm; heading(c,'Management Attention',y)
    alerts=[['PRIORITY','AREA','FINDING','RECOMMENDED ACTION'],
            ['HIGH','Receipt Compliance','Utilities receipt missing for 750 ETB','Upload and verify receipt before period close'],
            ['MEDIUM','Approvals','Maintenance request of 3,700 ETB pending','Manager to approve or reject'],
            ['MEDIUM','Payroll','Qordheere has 2,000 ETB outstanding','Confirm next payroll settlement'],
            ['LOW','Production Waste','Waste rate is 2.0%','Monitor against 2.5% threshold']]
    y=grid(c,alerts,[30*mm,50*mm,105*mm,85*mm],y,row_h=9*mm,font=6.8)
    c.setFillColor(NAVY); c.roundRect(14*mm,12*mm,W-28*mm,17*mm,2*mm,fill=1,stroke=0)
    c.setFillColor(colors.white); c.setFont('Helvetica-Bold',8.5); c.drawString(20*mm,22*mm,'Overall Demo Position')
    c.setFillColor(colors.HexColor('#78F0C2')); c.setFont('Helvetica-Bold',10.5); c.drawRightString(W-20*mm,22*mm,'POSITIVE CASH FLOW - CONTROLS NEED ATTENTION')
    c.setFillColor(colors.white); c.setFont('Helvetica',6.5); c.drawString(20*mm,16*mm,'Financial totals reconcile. One receipt exception and one approval remain open in this demonstration report.')

def build():
    OUT.parent.mkdir(parents=True,exist_ok=True)
    temp_dir=ROOT/'tmp'/'pdfs'/'enterprise-build'; temp_dir.mkdir(parents=True,exist_ok=True)
    parts=[]
    for index,fn in enumerate([page1,page2,page3,page4,page5,page6,page7],1):
        part=temp_dir/f'page-{index}.pdf'; c=canvas.Canvas(str(part),pagesize=landscape(A4)); fn(c); c.save(); parts.append(part)
    writer=PdfWriter()
    for part in parts: writer.append(PdfReader(str(part)))
    with OUT.open('wb') as stream: writer.write(stream)
    print(OUT)

if __name__=='__main__': build()
