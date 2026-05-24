import prisma from '@/lib/db';
import { whatsappManager, logToFile } from './manager';
import puppeteer from 'puppeteer';
import { format } from 'date-fns';
import fs from 'fs';
import path from 'path';
import { MessageMedia } from 'whatsapp-web.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function generateShopReceiptPDF(sale: any, company: any): Promise<Buffer | null> {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    const companyName = (typeof company === 'string' ? company : company?.name) || 'Revlo Shop';
    const logoUrl = company?.logoUrl || '';

    // Detailed payment logic
    const total = Number(sale.total);
    const paid = Number(sale.paidAmount || 0);
    const balance = Math.max(0, total - paid);
    const isFullyPaid = balance <= 0;

    const statusText = isFullyPaid ? 'PAID' : (paid > 0 ? 'PARTIAL' : 'UNPAID');
    const statusColor = isFullyPaid ? '#059669' : (paid > 0 ? '#d97706' : '#dc2626');
    const statusBg = isFullyPaid ? '#ecfdf5' : (paid > 0 ? '#fffbeb' : '#fef2f2');

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@300;400;500;700;800;900&display=swap" rel="stylesheet">
        <style>
          :root {
            --brand-primary: #3498DB;
            --brand-dark: #0f172a;
            --bg-light: #f8fafc;
            --border-soft: #e2e8f0;
            --text-main: #1e293b;
            --text-muted: #64748b;
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Inter', sans-serif; 
            color: var(--text-main); 
            background: #ffffff;
            -webkit-font-smoothing: antialiased;
          }
          .page {
            width: 100%;
            max-width: 800px;
            margin: 0 auto;
            padding: 30px 40px;
            background: #f8fafc;
            position: relative;
            min-height: auto;
          }

          /* Header Section */
          .top-section {
            display: flex;
            gap: 30px;
            margin-bottom: 25px;
          }
          .left-col {
            width: 32%;
            position: relative;
          }
          .qr-box {
            width: 75px;
            height: 75px;
            background: white;
            padding: 6px;
            margin-left: 15px;
            margin-bottom: -35px;
            position: relative;
            z-index: 10;
          }
          .dark-box {
            background: #2a2a2a;
            color: #ffffff;
            padding: 45px 20px 20px 20px;
            min-height: 240px;
          }
          .dark-box .title {
            font-size: 10px;
            font-weight: 700;
            margin-bottom: 4px;
          }
          .dark-box .value {
            font-size: 11px;
            color: #e2e8f0;
            margin-bottom: 15px;
          }
          .dark-box .divider {
            width: 25px;
            height: 1px;
            background: #ffffff;
            margin-bottom: 15px;
          }
          .dark-box .to-value {
            font-size: 12px;
            color: #ffffff;
          }
          .dark-box .to-contact {
            font-size: 10px;
            color: #94a3b8;
            margin-top: 4px;
            line-height: 1.4;
          }

          .right-col {
            width: 68%;
            padding-top: 15px;
          }
          .brand {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 20px;
          }
          .brand-icon {
            width: 24px;
            height: 24px;
            border: 4px solid #2a2a2a;
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          .brand-icon::after {
            content: '';
            width: 8px;
            height: 8px;
            background: #2a2a2a;
            border-radius: 50%;
          }
          .brand-text-wrapper {
            display: flex;
            flex-direction: column;
          }
          .brand-name {
            font-size: 14px;
            font-weight: 800;
            color: #1a1a1a;
          }
          .brand-tagline {
            font-size: 10px;
            color: #64748b;
          }
          .invoice-title {
            font-family: 'Outfit', sans-serif;
            font-size: 42px;
            font-weight: 900;
            color: #1a1a1a;
            letter-spacing: -1.5px;
            line-height: 1;
            margin-bottom: 5px;
          }
          .invoice-subtitle {
            font-size: 11px;
            color: #64748b;
            margin-bottom: 20px;
          }
          .card-box {
            background: #ffffff;
            padding: 15px 25px;
            display: flex;
            gap: 30px;
            margin-bottom: 25px;
          }
          .card-col {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          .card-col .label {
            font-size: 10px;
            color: #94a3b8;
            font-weight: 600;
          }
          .card-col .val {
            font-size: 13px;
            color: #475569;
            font-weight: 500;
          }
          .card-box .divider {
            width: 1px;
            background: #e2e8f0;
          }
          .payment-method-row {
            display: flex;
            gap: 30px;
          }
          .method-label {
            display: flex;
            flex-direction: column;
          }
          .method-label span {
            font-weight: 800;
            font-size: 12px;
            color: #1a1a1a;
          }
          .method-label .line {
            width: 20px;
            height: 2px;
            background: #1a1a1a;
            margin-top: 8px;
          }
          .method-details {
            font-size: 11px;
            color: #64748b;
            line-height: 1.4;
          }

          /* Table */
          .table-wrapper {
            margin-bottom: 30px;
            background: #ffffff;
            padding: 15px;
          }
          table { width: 100%; border-collapse: collapse; }
          th { 
            background: var(--brand-dark);
            text-align: left; padding: 10px 14px; 
            font-size: 9px; color: #ffffff; font-weight: 700;
            text-transform: uppercase; letter-spacing: 1px; 
          }
          td { 
            padding: 10px 14px; 
            border-bottom: 1px solid var(--border-soft); 
            font-size: 11px;
          }
          tr:last-child td { border-bottom: 2px solid var(--brand-dark); }
          
          .item-desc { font-weight: 700; color: var(--brand-dark); font-family: 'Outfit', sans-serif; font-size: 13px; }
          .qty-cell { text-align: center; font-weight: 600; color: var(--text-muted); }
          .price-cell { text-align: right; font-weight: 600; color: var(--text-muted); }
          .total-cell { text-align: right; font-weight: 800; color: var(--brand-dark); }
          .sup-currency { font-size: 8px; vertical-align: super; margin-left: 2px; color: var(--text-muted); }

          /* Summary Section */
          .summary-wrapper {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 40px;
          }
          .summary-box {
            width: 300px;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            font-size: 12px;
            color: var(--text-muted);
            font-weight: 500;
          }
          .summary-row.total {
            border-top: 2px solid var(--brand-dark);
            border-bottom: 2px solid var(--border-soft);
            margin-top: 10px;
            padding: 14px 0;
            color: var(--brand-dark);
          }
          .total-label { font-family: 'Outfit', sans-serif; font-size: 18px; font-weight: 900; color: var(--brand-dark); }
          .total-value { font-family: 'Outfit', sans-serif; font-size: 20px; font-weight: 900; color: var(--brand-primary); }
          
          .summary-row.paid {
            padding-top: 14px;
            color: #10b981;
            align-items: flex-start;
          }
          .payment-details {
            display: flex; flex-direction: column; gap: 3px;
          }
          .payment-label { font-weight: 700; font-size: 12px; }
          .payment-meta { font-size: 9px; color: #059669; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.8; }
          .paid-value { font-weight: 800; font-size: 13px; }

          .summary-row.balance {
            color: #ef4444;
            font-weight: 800;
            font-size: 13px;
          }

          /* Status Badge */
          .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-top: 10px;
          }

          /* Footer */
          .footer {
            margin-top: 50px;
            padding-top: 25px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .footer-message h4 {
            font-family: 'Outfit', sans-serif;
            font-size: 14px; color: var(--brand-dark); font-weight: 800;
            margin-bottom: 6px;
          }
          .footer-message p {
            font-size: 10px; color: var(--text-muted); line-height: 1.5;
          }
          .signature-area {
            text-align: right;
          }
          .sig-line {
            width: 120px;
            height: 2px;
            background: var(--brand-dark);
            margin-bottom: 8px;
            margin-left: auto;
          }
          .sig-text {
            font-size: 9px; color: var(--text-muted); font-weight: 700;
            text-transform: uppercase; letter-spacing: 1px;
          }
          
          /* Watermark */
          .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-30deg);
            font-size: 140px;
            font-family: 'Outfit', sans-serif;
            font-weight: 900;
            color: rgba(241, 245, 249, 0.5);
            z-index: 0;
            pointer-events: none;
            white-space: nowrap;
          }
        </style>
      </head>
      <body>
        <div class="page">
          
          ${isFullyPaid ? '<div class="watermark">PAID IN FULL</div>' : ''}

          <div class="top-section">
            <div class="left-col">
              <div class="qr-box">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&color=2a2a2a&data=${encodeURIComponent('INV-' + sale.invoiceNumber)}" style="width: 100%; height: 100%; object-fit: contain" alt="QR Code" />
              </div>
              <div class="dark-box">
                <div class="title">Date :</div>
                <div class="value">${format(new Date(sale.createdAt || Date.now()), 'dd MMMM yyyy')}</div>
                
                <div class="title">Due Date :</div>
                <div class="value">${sale.dueDate ? format(new Date(sale.dueDate), 'dd MMMM yyyy') : 'On Receipt / Cleared'}</div>
                
                <div class="divider"></div>
                
                <div class="title">To</div>
                <div class="to-value">${sale.customer?.name || 'Walk-in Customer'}</div>
                <div class="to-contact">
                  ${sale.customer?.phone || 'No phone provided'}<br>
                  ${sale.customer?.email ? sale.customer.email : ''}
                </div>
              </div>
            </div>
            
            <div class="right-col">
              <div class="brand">
                ${logoUrl
        ? `<img src="${logoUrl}" style="height: 38px; object-fit: contain;" alt="Logo" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                     <div class="brand-icon" style="display: none;"></div>`
        : `<div class="brand-icon"></div>`
      }
                <div class="brand-text-wrapper">
                  <span class="brand-name">${companyName}</span>
                  <span class="brand-tagline">Official Receipt Document</span>
                </div>
              </div>
              
              <h1 class="invoice-title">RECEIPT</h1>
              <p class="invoice-subtitle">Document Payment Information</p>
              
              <div class="card-box">
                <div class="card-col">
                  <span class="label">Billed Amount:</span>
                  <span class="val">${total.toLocaleString()} ETB</span>
                </div>
                <div class="divider"></div>
                <div class="card-col">
                  <span class="label">Invoice No:</span>
                  <span class="val">#${sale.invoiceNumber}</span>
                </div>
              </div>
              
              <div class="payment-method-row">
                <div class="method-label">
                  <span>Payment</span>
                  <span>Method</span>
                  <div class="line"></div>
                </div>
                <div class="method-details">
                  <span style="color:#94a3b8">Details / Account</span><br>
                  ${sale.payments && sale.payments.length > 0 ? sale.payments.map((p: any) => p.method).join(', ') : (sale.paymentMethod || 'Walk-in / Cash')}<br>
                  Payment Status: <strong>${statusText}</strong>
                </div>
              </div>
            </div>
          </div>

          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: right;">Unit Price</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${sale.items && sale.items.length > 0 ? sale.items.map((item: any) => `
                  <tr>
                    <td class="item-desc">${item.productName || 'General Item'}</td>
                    <td class="qty-cell">${item.quantity || 1}</td>
                    <td class="price-cell">${Number(item.unitPrice || 0).toLocaleString()}<span class="sup-currency">ETB</span></td>
                    <td class="total-cell">${Math.round(Number(item.quantity || 1) * Number(item.unitPrice || 0)).toLocaleString()}<span class="sup-currency">ETB</span></td>
                  </tr>
                `).join('') : `<tr><td colspan="4" style="text-align: center; padding: 40px; color: #94a3b8; font-weight: 500;">No items listed in this transaction.</td></tr>`}
              </tbody>
            </table>
          </div>

          <div class="summary-wrapper">
            <div class="summary-box">
              <div class="summary-row">
                <span>Subtotal</span>
                <span style="color: var(--brand-dark); font-weight: 700">${Number(sale.subtotal || sale.total).toLocaleString()} ETB</span>
              </div>
              ${(sale.tax || 0) > 0 ? `
              <div class="summary-row">
                <span>Tax (VAT)</span>
                <span style="color: var(--brand-dark); font-weight: 700">${Number(sale.tax).toLocaleString()} ETB</span>
              </div>
              ` : ''}
              ${(sale.discountAmount || 0) > 0 ? `
              <div class="summary-row" style="color: #10b981;">
                <span>Discount</span>
                <span style="font-weight: 700">-${Number(sale.discountAmount).toLocaleString()} ETB</span>
              </div>
              ` : ''}
              
              <div class="summary-row total">
                <span class="total-label">Grand Total</span>
                <span class="total-value">${total.toLocaleString()} <span style="font-size: 16px;">ETB</span></span>
              </div>
              
              <div class="summary-row paid">
                <div class="payment-details">
                   <span class="payment-label">Amount Paid</span>
                   <span class="payment-meta">
                     ${sale.payments && sale.payments.length > 0
        ? sale.payments.map((p: any) => `Via ${p.method}`).join(' & ')
        : `Via ${sale.paymentMethod || 'Recorded Payment'}`
      }
                   </span>
                </div>
                <span class="paid-value">${paid.toLocaleString()} ETB</span>
              </div>

              ${balance > 0 ? `
              <div class="summary-row balance">
                <span>Balance Due</span>
                <span>${balance.toLocaleString()} ETB</span>
              </div>
              ` : ''}
            </div>
          </div>

          <footer class="footer">
            <div class="footer-message">
              <h4>Thank you for your business!</h4>
              <p>If you have any questions relating to this invoice, please contact us.<br>
              <span style="color: #cbd5e1; font-size: 10px; margin-top: 12px; display: inline-block; font-weight: 600;">
                Generated securely by Revlo Premium System<br>
                REF: ${sale.id.substring(sale.id.length - 12).toUpperCase()}
              </span></p>
            </div>
            <div class="signature-area">
              <div class="sig-line"></div>
              <span class="sig-text">Authorized Signature</span>
            </div>
          </footer>
        </div>
      </body>
      </html>
    `;

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
    });

    return Buffer.from(pdfBuffer);
  } catch (error) {
    logToFile(`[WhatsApp ERROR] Failed to generate PDF: ${error} `);
    return null;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}



/**
 * Uses Gemini AI to generate a professional, context-aware Somali message for the customer.
 */
async function generateAISomaliMessage(sale: any, companyName: string, type: 'SALE' | 'PAYMENT', paymentAmount?: number): Promise<string> {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error("Missing GOOGLE_API_KEY in environment");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Standard model name for best compatibility
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const customerName = sale.customer?.name || 'Macaamiil';
    const total = Number(sale.total);
    const paidSoFar = Number(sale.paidAmount || 0);
    const balance = Math.max(0, total - paidSoFar);
    const isPaid = balance <= 0;

    const prompt = `
      You are a premium AI assistant for "${companyName}". 
      Generate a professional, warm Somali WhatsApp message for a customer named "${customerName}".
      
      Transaction Details:
    - Action: ${type === 'SALE' ? 'New Sale/Invoice' : 'Payment Received'}
    - Invoice: #${sale.invoiceNumber}
    - Grand Total: ${total.toLocaleString()} ETB
      ${type === 'PAYMENT' ? `- Just Paid Now: ${Number(paymentAmount).toLocaleString()} ETB` : `- Paid Amount: ${paidSoFar.toLocaleString()} ETB`}
    - Total Paid So Far: ${paidSoFar.toLocaleString()} ETB
      - Remaining Balance: ${balance.toLocaleString()} ETB
        - Status: ${isPaid ? 'Fully Paid (Shubay)' : 'Partial Payment (Baqi)'}

    Rules:
    1. Use modern, beautiful Somali(Af - Soomaali suuban).
      2. Mention the specific amount paid and the remaining balance very clearly.
      3. If it is a partial payment, encourage them and mention the balance.
      4. If it is fully paid, congratulate them and thank them warmly.
      5. Mention that their professional PDF receipt is attached below.
      6. Include a warm closing from "${companyName}".
      7. Return ONLY the message.No English, no explanations.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    logToFile(`[WhatsApp AI ERROR] Failed to generate message: ${error}`);
    const customerName = sale.customer?.name || 'Macaamiil';
    const total = Number(sale.total);
    const paidSoFar = Number(sale.paidAmount || 0);
    const balance = Math.max(0, total - paidSoFar);

    const finalFallback = type === 'SALE'
      ? `Salaamu Calaykum *${customerName}*.\n\nWaxaan halkaan kuugu soo lifaaqnay rasiidka rasmiga ah ee shirkadda *${companyName}*.\n\n*Invoice:* #${sale.invoiceNumber}\n*Wadarta guud ee alaabta: :* ${total.toLocaleString()} ETB\n*Lacagta aad bixisay :* ${paidSoFar.toLocaleString()} ETB\n*Haraaga:* ${balance.toLocaleString()} ETB\n\nWaad ku mahadsan tahay.`
      : `Salaamu Calaykum *${customerName}*.\n\nWaad ku mahadsan tahay lacag bixintaada shirkadda *${companyName}*.\n\n*Rasiidka:* #${sale.invoiceNumber}\n*Lacag bixinta hadda:* ${Number(paymentAmount).toLocaleString()} ETB\n*Haraaga cusub:* ${balance.toLocaleString()} ETB\n\nWaad ku mahadsan tahay.`;
    return finalFallback;
  }
}

export async function sendShopReceiptViaWhatsApp(
  companyId: string,
  companyName: string,
  vendorPhone: string | null | undefined,
  sale: any,
  type: 'SALE' | 'PAYMENT' = 'SALE',
  paymentAmount?: number
) {
  if (!vendorPhone) {
    logToFile(`[WhatsApp] No customer phone provided, skipping.`);
    return false;
  }

  try {
    const company = await (prisma as any).company.findUnique({
      where: { id: companyId },
      include: { personalizationSettings: true }
    });

    if (company?.whatsappSessionStatus !== 'CONNECTED') return false;

    let session = await whatsappManager.getSession(companyId);

    if (session.status === 'CONNECTING') {
      for (let i = 0; i < 15; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        session = await whatsappManager.getSession(companyId);
        if (session.status === 'CONNECTED') break;
      }
    }

    if (session.status !== 'CONNECTED' || !session.client) return false;

    let formattedPhone = vendorPhone.replace(/[^\d]/g, ''); // Strictly only digits
    if (formattedPhone.startsWith('0')) formattedPhone = '251' + formattedPhone.substring(1);
    const jid = formattedPhone.endsWith('@c.us') ? formattedPhone : `${formattedPhone}@c.us`;
    logToFile(`[WhatsApp] Final target JID: ${jid}`);

    const baseUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://revlo.me';
    const receiptLink = `${baseUrl}/receipt/shop/${sale.id}`;
    const downloadLink = `${baseUrl}/api/public/shop/receipt/${sale.id}`;

    // 1. Generate Premium PDF
    logToFile(`[WhatsApp] Generating Premium PDF for ${sale.invoiceNumber}...`);
    const pdfBuffer = await generateShopReceiptPDF(sale, sale.company);
    let media: MessageMedia | null = null;
    let tempFilePath: string | null = null;

    if (pdfBuffer) {
      const magicNumber = pdfBuffer.slice(0, 5).toString();
      logToFile(`[WhatsApp] PDF Buffer ready: ${pdfBuffer.length} bytes, Magic: ${magicNumber} `);

      try {
        const tempDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
        tempFilePath = path.join(tempDir, `Receipt_${sale.invoiceNumber}_${Date.now()}.pdf`);
        fs.writeFileSync(tempFilePath, pdfBuffer);

        // Use fromFilePath - internally more robust for many wwebjs versions
        media = MessageMedia.fromFilePath(tempFilePath);
        media.mimetype = 'application/pdf'; // Explicitly set mimetype for reliability

        logToFile(`[WhatsApp] Media object created from file: ${tempFilePath} `);
      } catch (mediaErr: any) {
        logToFile(`[WhatsApp ERROR] Failed to create media: ${mediaErr?.message || mediaErr} `);
      }
    }

    // 2. Generate Message (Fixed Template as requested by user)
    const total = Number(sale.total);
    const paidSoFar = Number(sale.paidAmount || 0);
    const balance = Math.max(0, total - paidSoFar);
    const customerName = (sale.customer?.name || 'Macaamiil').replace(/[^\w\s]/gi, ''); // Clean name

    // Sanitize string to avoid weird Unicode characters from toLocaleString in some environments
    const fmtTotal = total.toLocaleString().replace(/[^\d\.,]/g, '');
    const fmtPaid = paidSoFar.toLocaleString().replace(/[^\d\.,]/g, '');
    const fmtBalance = balance.toLocaleString().replace(/[^\d\.,]/g, '');

    const balanceWarning = balance > 0 
      ? `\n\n*⚠️ Fiiro Gaar ah (Deynta):*\n- Haddii aad doonayso inaad Dollar ku bixiso deyntan, waa mid la aqbali karo iyadoo la eegayo sarifka maalinta.\n- Haddii deyntan bixinteeda ay dhaafto muddo *Hal Isbuuc (7 Casho)* ah, haraaga ETB ah waxaa si toos ah loogu bedeli doonaa *Dollar* iyadoo lagu xisaabinayo sarifka maalintaas.`
      : '';

    let fixedMessage = type === 'SALE'
      ? `Salaamu Calaykum *${customerName}*.\n\nKu soo dhawaada dukaanka *${companyName}*.\nHalkan waxaa ah faah-faahinta iibkaaga:\n\n*Wadarta Guud:* ${fmtTotal} ETB\n*Lacagta la bixiyay:* ${fmtPaid} ETB\n*Haraaga (Deynta):* ${fmtBalance} ETB${balanceWarning}\n\n*🔗 Link-ga Rasiidka:* ${receiptLink}\n*📄 Rasiidka PDF-ka:* ${downloadLink}\n\nWaad ku mahadsan tahay macaamilkaaga wacan!`
      : `Salaamu Calaykum *${customerName}*.\n\nWaan guddoonay lacag bixintaada. Waad ku mahadsan tahay inaad la macaamisho *${companyName}*.\n\n*Faah-faahinta Lacag Bixinta Hadda:*\n*Lacagta shubatay:* ${Number(paymentAmount).toLocaleString()} ETB\n*Haraaga (Deynta kugu hartay):* ${fmtBalance} ETB${balanceWarning}\n\n*🔗 Link-ga Rasiidka:* ${receiptLink}\n*📄 Rasiidka PDF-ka:* ${downloadLink}\n\nMahadsanid!`;

    // Explicitly clean message of any potential non-printable characters
    fixedMessage = fixedMessage.replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, "");
    logToFile(`[WhatsApp] Message length: ${fixedMessage.length}`);

    const captionLimit = 1000;
    let finalMessage = fixedMessage;
    if (finalMessage.length > captionLimit) {
      finalMessage = finalMessage.substring(0, captionLimit - 20) + '... (cont.)';
    }

    // 3. Send
    try {
      // Get the chat object first
      logToFile(`[WhatsApp] Getting chat for ${jid}...`);
      const chat = await session.client.getChatById(jid);

      if (media && media.data) {
        logToFile(`[WhatsApp] Sending PDF as document to ${jid} `);

        // Final sanity check for media
        if (!media.data || media.data.length < 100) {
          throw new Error("Media data corrupted or too short");
        }

        // Wait slightly more to ensure the chat is fully loaded in the browser
        await new Promise(resolve => setTimeout(resolve, 6000));

        // Use the most compatible send options for 1.34.6
        // Some versions prefer sending media WITHOUT a caption if it's a document to avoid "Invalid value"
        await chat.sendMessage(media, {
          sendMediaAsDocument: true,
          caption: finalMessage
        });

        logToFile(`[WhatsApp] Premium PDF sent successfully to ${jid} `);
      } else {
        logToFile(`[WhatsApp] No media, sending text - only fariin.`);
        await chat.sendMessage(finalMessage);
      }
    } catch (sendError: any) {
      logToFile(`[WhatsApp Warning] Primary send failed: ${sendError?.message || sendError} `);

      // Fallback: Send text THEN media separately
      logToFile(`[WhatsApp] Falling back to split delivery for ${jid}...`);
      try {
        const chat = await session.client.getChatById(jid);

        // 1. Send the text first
        await chat.sendMessage(finalMessage);
        logToFile(`[WhatsApp] Fallback text sent.`);

        if (media && media.data) {
          await new Promise(resolve => setTimeout(resolve, 4000));
          // Use sendMessage on chat object directly if possible, or through client with jid
          await session.client.sendMessage(jid, media, { sendMediaAsDocument: true });
          logToFile(`[WhatsApp] Fallback media sent separately.`);
        }
      } catch (innerErr: any) {
        logToFile(`[WhatsApp Fallback ERROR] ${innerErr?.message || innerErr} `);
        throw innerErr;
      }
    }
    finally {
      // Clean up temp file
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try { fs.unlinkSync(tempFilePath); } catch (e) { }
      }
    }

    logToFile(`[WhatsApp] Premium receipt workflow completed for ${sale.invoiceNumber}`);
    return true;
  } catch (error: any) {
    logToFile(`[WhatsApp FATAL] sendShopReceiptViaWhatsApp failed: ${error?.message || error} `);
    return false;
  }
}
