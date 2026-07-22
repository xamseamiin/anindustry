// lib/sales-receipt-ai.ts - Gemini 2.5 Flash Sales Receipt AI Scanner
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

export interface SalesReceiptAnalysisResult {
    isSuccess: boolean;
    customerName: string | null;
    customerPhone: string | null;
    productName: string | null;
    quantity: number | null;
    unitPrice: number | null;
    totalAmount: number | null;
    paidAmount: number | null;
    paymentMethod: 'CASH' | 'CARD' | 'PARTIAL' | 'CREDIT' | null;
    accountName: string | null;
    receiptNumber: string | null;
    date: string | null;
    message: string;
}

export async function parseSalesReceiptImageWithAI(
    imagePath: string
): Promise<SalesReceiptAnalysisResult> {
    try {
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            return {
                isSuccess: false,
                customerName: null,
                customerPhone: null,
                productName: null,
                quantity: null,
                unitPrice: null,
                totalAmount: null,
                paidAmount: null,
                paymentMethod: null,
                accountName: null,
                receiptNumber: null,
                date: null,
                message: 'AI key is missing in server environment.'
            };
        }

        if (!fs.existsSync(imagePath)) {
            return {
                isSuccess: false,
                customerName: null,
                customerPhone: null,
                productName: null,
                quantity: null,
                unitPrice: null,
                totalAmount: null,
                paidAmount: null,
                paymentMethod: null,
                accountName: null,
                receiptNumber: null,
                date: null,
                message: 'Sales receipt file not found on server.'
            };
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        let model;
        try {
            model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        } catch (e) {
            model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        }

        const fileBuffer = fs.readFileSync(imagePath);
        const imagePart = {
            inlineData: {
                data: fileBuffer.toString('base64'),
                mimeType: 'image/jpeg'
            }
        };

        const prompt = `Analyze this Sales Receipt / Invoice / Payment Voucher image (Rasiidka Iibka ama Bixinta) which shows products sold to a customer.
Extract key sales transaction fields accurately:
1. customerName: Name of customer or buyer (Magaca Macmiilka).
2. customerPhone: Phone number of the customer if present.
3. productName: Name of the product or material sold (e.g. Block, Cement, Sand, Gravel, Tiles, etc.).
4. quantity: Quantity of items sold as a raw number.
5. unitPrice: Unit price per item in ETB as a raw number.
6. totalAmount: Grand total price of the sale as a raw number.
7. paidAmount: Amount paid/deposited according to the receipt as a raw number.
8. paymentMethod: One of "CASH", "CARD", "PARTIAL", "CREDIT". If paidAmount >= totalAmount, use "CASH". If 0 < paidAmount < totalAmount, use "PARTIAL". If paidAmount == 0, use "CREDIT".
9. accountName: Bank, Wallet, or Merchant account name mentioned where money was sent/deposited (e.g. "E-Birr Merchant", "CBE", "Zaad", "Cash", etc.).
10. receiptNumber: Invoice or receipt reference number.
11. date: Date of transaction in YYYY-MM-DD format if visible.

Return ONLY a valid raw JSON object (strictly no markdown codeblocks or extra text):
{
  "customerName": "Abdi Hassan",
  "customerPhone": "0912345678",
  "productName": "Block 15cm",
  "quantity": 500,
  "unitPrice": 150,
  "totalAmount": 75000,
  "paidAmount": 75000,
  "paymentMethod": "CASH",
  "accountName": "E-Birr Merchant",
  "receiptNumber": "INV-1092",
  "date": "2026-07-22"
}
If any field cannot be found, use null for that field. All numerical fields MUST be numbers.`;

        let response;
        try {
            response = await model.generateContent([prompt, imagePart]);
        } catch (mErr) {
            console.warn('Gemini 2.5 Flash model failed for sales receipt, falling back to gemini-2.0-flash:', mErr);
            const fallbackModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
            response = await fallbackModel.generateContent([prompt, imagePart]);
        }

        const responseText = response.response.text().trim().replace(/^```json\s*/, '').replace(/\s*```$/, '');

        let parsed: any = {};
        try {
            parsed = JSON.parse(responseText);
        } catch (e) {
            console.error('Failed to parse Gemini sales receipt output:', responseText);
        }

        return {
            isSuccess: true,
            customerName: parsed.customerName || null,
            customerPhone: parsed.customerPhone || null,
            productName: parsed.productName || null,
            quantity: typeof parsed.quantity === 'number' ? parsed.quantity : parseFloat(parsed.quantity) || null,
            unitPrice: typeof parsed.unitPrice === 'number' ? parsed.unitPrice : parseFloat(parsed.unitPrice) || null,
            totalAmount: typeof parsed.totalAmount === 'number' ? parsed.totalAmount : parseFloat(parsed.totalAmount) || null,
            paidAmount: typeof parsed.paidAmount === 'number' ? parsed.paidAmount : parseFloat(parsed.paidAmount) || null,
            paymentMethod: parsed.paymentMethod || null,
            accountName: parsed.accountName || null,
            receiptNumber: parsed.receiptNumber || null,
            date: parsed.date || null,
            message: '✅ Rasiidka iibka waa la akhriyay oo waa la hubiyay!'
        };
    } catch (error: any) {
        console.error('Sales Receipt AI Scanning Error:', error);
        return {
            isSuccess: false,
            customerName: null,
            customerPhone: null,
            productName: null,
            quantity: null,
            unitPrice: null,
            totalAmount: null,
            paidAmount: null,
            paymentMethod: null,
            accountName: null,
            receiptNumber: null,
            date: null,
            message: 'Cilad ayaa ku dhacday akhrinta rasiidka iibka: ' + (error.message || 'Error')
        };
    }
}
