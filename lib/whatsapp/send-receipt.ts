import prisma from '@/lib/db';
import { whatsappManager, logToFile } from './manager';
import { MessageMedia } from 'whatsapp-web.js';
import puppeteer from 'puppeteer';
import { format } from 'date-fns';
import fs from 'fs';
import path from 'path';

export async function generateReceiptPDF(expense: any, companyName: string): Promise<Buffer | null> {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    // ... HTML content construction ...
    const htmlContent = `
      <html>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
          <style>
            :root {
              --primary: #1e40af;
              --primary-light: #3b82f6;
              --success: #059669;
              --gray-50: #f9fafb;
              --gray-100: #f3f4f6;
              --gray-200: #e5e7eb;
              --gray-400: #9ca3af;
              --gray-600: #4b5563;
              --gray-800: #1f2937;
              --gray-900: #111827;
            }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Inter', sans-serif; 
              color: var(--gray-800); 
              background: white;
              line-height: 1.5;
            }
            .page {
              padding: 50px;
              position: relative;
              background: white;
              min-height: 100vh;
            }
            
            /* Header Design */
            .header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 50px;
              position: relative;
            }
            .brand {
              display: flex;
              align-items: center;
              gap: 15px;
            }
            .logo-placeholder {
              width: 45px;
              height: 45px;
              background: linear-gradient(135deg, var(--primary), var(--primary-light));
              border-radius: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: 800;
              font-size: 24px;
              box-shadow: 0 4px 12px rgba(30, 64, 175, 0.2);
            }
            .brand-name {
              font-size: 24px;
              font-weight: 800;
              color: var(--primary);
              letter-spacing: -0.5px;
              text-transform: uppercase;
            }
            
            .receipt-status {
              padding: 6px 14px;
              background: #ecfdf5;
              color: var(--success);
              border-radius: 99px;
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 1px;
              display: flex;
              align-items: center;
              gap: 6px;
              border: 1px solid #d1fae5;
            }

            /* Main Layout */
            .main-info {
              display: grid;
              grid-template-columns: 2fr 1fr;
              gap: 40px;
              margin-bottom: 50px;
            }

            .info-block h3 {
              font-size: 10px;
              font-weight: 700;
              color: var(--gray-400);
              text-transform: uppercase;
              letter-spacing: 1.5px;
              margin-bottom: 8px;
            }
            .info-block p {
              font-size: 16px;
              font-weight: 600;
              color: var(--gray-900);
            }
            .info-block .sub-info {
              font-size: 13px;
              font-weight: 400;
              color: var(--gray-600);
              margin-top: 2px;
            }

            .amount-card {
              background: var(--gray-50);
              border-radius: 20px;
              padding: 25px;
              border: 1px solid var(--gray-100);
              text-align: right;
            }
            .amount-card h2 {
              font-size: 10px;
              font-weight: 700;
              color: var(--gray-400);
              text-transform: uppercase;
              letter-spacing: 1.5px;
              margin-bottom: 10px;
            }
            .amount-value {
              font-size: 32px;
              font-weight: 800;
              color: var(--gray-900);
              letter-spacing: -1px;
            }
            .currency {
              font-size: 14px;
              font-weight: 600;
              color: var(--gray-400);
              margin-left: 4px;
            }

            /* Table Design */
            .table-container {
              margin-bottom: 50px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th {
              text-align: left;
              padding: 12px 15px;
              font-size: 10px;
              font-weight: 700;
              color: var(--gray-400);
              text-transform: uppercase;
              letter-spacing: 1px;
              border-bottom: 2px solid var(--gray-100);
            }
            td {
              padding: 18px 15px;
              font-size: 14px;
              color: var(--gray-800);
              border-bottom: 1px solid var(--gray-50);
            }
            .item-description {
              font-weight: 600;
              color: var(--gray-900);
            }
            .total-row {
              background: var(--gray-50);
            }
            .total-row td {
              border-bottom: none;
              padding: 20px 15px;
            }
            .grand-total-label {
              font-size: 12px;
              font-weight: 700;
              color: var(--gray-600);
              text-transform: uppercase;
            }
            .grand-total-value {
              font-size: 18px;
              font-weight: 800;
              color: var(--primary);
            }

            /* Footer & Watermark */
            .watermark {
              position: absolute;
              top: 55%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-30deg);
              font-size: 140px;
              font-weight: 900;
              color: rgba(5, 150, 105, 0.04);
              text-transform: uppercase;
              pointer-events: none;
              z-index: 0;
              white-space: nowrap;
            }
            
            .footer {
              margin-top: auto;
              padding-top: 40px;
              border-top: 1px solid var(--gray-100);
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              font-size: 11px;
              color: var(--gray-400);
            }
            .footer-legal {
              font-weight: 500;
            }
            .footer-sig {
              text-align: right;
            }
            .sig-line {
              width: 150px;
              border-bottom: 1px solid var(--gray-200);
              margin-bottom: 8px;
            }
            .sig-label {
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="watermark">${expense.paymentStatus || 'OFFICIAL PAID'}</div>
            
            <div class="header">
              <div class="brand">
                <div class="logo-placeholder">R</div>
                <div class="brand-name">${companyName}</div>
              </div>
              <div class="receipt-status">
                <span>●</span> ${expense.paymentStatus || 'PAID'}
              </div>
            </div>

            <div class="main-info">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                <div class="info-block">
                  <h3>Macmiilka / Payee</h3>
                  <p>${expense.vendor?.name || expense.supplierName || 'Macaamiil'}</p>
                  <div class="sub-info">${expense.vendor?.phone || expense.vendor?.phoneNumber || ''}</div>
                </div>
                <div class="info-block">
                  <h3>Taariikhda / Date</h3>
                  <p>${format(new Date(expense.expenseDate || Date.now()), 'MMMM d, yyyy')}</p>
                  <div class="sub-info">${format(new Date(expense.expenseDate || Date.now()), 'EEEE')}</div>
                </div>
                <div class="info-block">
                  <h3>Mashruuca / Project</h3>
                  <p>${expense.project?.name || 'Guud / General'}</p>
                </div>
                <div class="info-block">
                  <h3>Rasiid No.</h3>
                  <p>#EXP-${String(expense.id).substring(0, 8).toUpperCase()}</p>
                </div>
              </div>
              
              <div class="amount-card">
                <h2>Wadarta Lacagta</h2>
                <div class="amount-value">
                  ${Number(expense.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  <span class="currency">ETB</span>
                </div>
              </div>
            </div>

            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th style="width: 50%;">FAAHFAAHINTA (DESCRIPTION)</th>
                    <th>TIRE (QTY)</th>
                    <th>QIIMAHA (PRICE)</th>
                    <th style="text-align: right;">ISGEYN (TOTAL)</th>
                  </tr>
                </thead>
                <tbody>
                  ${expense.materials && Array.isArray(expense.materials) && expense.materials.length > 0 ? expense.materials.map((m: any) => `
                    <tr>
                      <td class="item-description">${m.name || 'Alaab'}</td>
                      <td>${m.qty || 1} ${m.unit || ''}</td>
                      <td>${Number(m.price || 0).toLocaleString()}</td>
                      <td style="text-align: right; font-weight: 700;">${(Number(m.qty || 1) * Number(m.price || 0)).toLocaleString()}</td>
                    </tr>
                  `).join('') : `
                    <tr>
                      <td class="item-description">${expense.description || 'Kharash Guud'}</td>
                      <td>1</td>
                      <td>${Number(expense.amount).toLocaleString()}</td>
                      <td style="text-align: right; font-weight: 700;">${Number(expense.amount).toLocaleString()}</td>
                    </tr>
                  `}
                  <tr class="total-row">
                    <td colspan="3" style="text-align: right;" class="grand-total-label">Wadarta Guud (Grand Total)</td>
                    <td style="text-align: right;" class="grand-total-value">${Number(expense.amount).toLocaleString()} ETB</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="footer">
              <div class="footer-legal">
                Nidaamka Xisaabaadka: <strong>Revlo Business Solutions</strong><br>
                Maamulka: ${companyName}
              </div>
              <div class="footer-sig">
                <div class="sig-line"></div>
                <div class="sig-label">Authorized Signature</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
    });

    return Buffer.from(pdfBuffer);
  } catch (error) {
    logToFile(`[WhatsApp ERROR] Failed to generate PDF: ${error}`);
    return null;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export async function sendReceiptViaWhatsApp(companyId: string, companyName: string, vendorPhone: string | null | undefined, expense: any) {
  if (!vendorPhone) {
    logToFile(`[WhatsApp] No vendor phone provided for expense ${expense.id}, skipping receipt.`);
    return false;
  }

  try {
    // Check database status first before even touching the manager
    // This prevents Puppeteer from starting for companies that aren't linked
    const company = await (prisma as any).company.findUnique({
      where: { id: companyId },
      select: { whatsappSessionStatus: true }
    });

    if (company?.whatsappSessionStatus !== 'CONNECTED') {
      logToFile(`[WhatsApp] Status for ${companyId} is ${company?.whatsappSessionStatus}, skipping receipt.`);
      return false;
    }

    let session = await whatsappManager.getSession(companyId);

    // If status is CONNECTING, wait up to 15 seconds for it to become CONNECTED
    if (session.status === 'CONNECTING') {
      logToFile(`[WhatsApp] Session for ${companyId} is CONNECTING, waiting (max 15s)...`);
      for (let i = 0; i < 15; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        session = await whatsappManager.getSession(companyId);
        if (session.status === 'CONNECTED') {
          logToFile(`[WhatsApp] Session for ${companyId} became CONNECTED after ${i + 1}s`);
          break;
        }
      }
    }

    if (session.status !== 'CONNECTED' || !session.client) {
      logToFile(`[WhatsApp] Cannot send receipt for company ${companyId}. Manager Status: ${session.status}`);
      return false;
    }

    // Format phone number for WhatsApp:
    // Remove all non-digit characters (spaces, +, -, etc.)
    let formattedPhone = vendorPhone.replace(/[\+\s\-\(\)]/g, '');

    // If number starts with 0, replace with Ethiopian country code 251
    // e.g. 0912345678 → 251912345678
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '251' + formattedPhone.substring(1);
    }

    // Append WhatsApp suffix if not already present
    if (!formattedPhone.endsWith('@c.us')) {
      formattedPhone = `${formattedPhone}@c.us`;
    }

    // Construct the public receipt link
    const baseUrl = process.env.NEXTAUTH_URL || 'https://revlo.me';
    const receiptLink = `${baseUrl}/receipt/${expense.id}`;

    const messageText = `Salaamu Calaykum ${expense.vendor?.name || 'Macaamiil'}.\n\nWaa shirkadda *${companyName}*.\nWaxaan kuugu soo lifaaqnay rasiidka lacag bixinta oo cadadkiisu yahay *${Number(expense.amount).toLocaleString()} ETB* oo aan kuugu bixinay alaabta.\n\n*Furi rasiidkaaga halkan (PDF):*\n${receiptLink}\n\nWaad ku mahadsan tahay wada shaqayntaada.`;

    logToFile(`[WhatsApp] Sending link-based receipt to ${formattedPhone}`);
    await session.client.sendMessage(formattedPhone, messageText);
    logToFile(`[WhatsApp] Link-based receipt sent successfully to ${formattedPhone}`);

    return true;
  } catch (error) {
    logToFile(`[WhatsApp ERROR] Error sending receipt to ${vendorPhone}: ${error}`);
    return false;
  }
}
