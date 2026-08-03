import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import prisma from '@/lib/db';

export interface ReceiptVerificationResult {
    isVerified: boolean;
    isMatch: boolean;
    extractedAmount: number | null;
    expectedAmount: number;
    transactionId?: string | null;
    receiverName?: string | null;
    receiverPhone?: string | null;
    paymentService?: string | null;
    difference?: number;
    message: string;
    isDuplicateTxId?: boolean;
    isPhoneMismatch?: boolean;
}

function normalizePhone(phone: string | null | undefined): string {
    if (!phone) return '';
    return phone.replace(/[^\d]/g, '').replace(/^251/, '').replace(/^0/, '');
}

export async function verifyReceiptImageWithAI(
    imagePath: string,
    expectedAmount: number,
    expectedPhone?: string
): Promise<ReceiptVerificationResult> {
    try {
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            console.log('Gemini API Key missing in environment.');
            return {
                isVerified: false,
                isMatch: true,
                extractedAmount: null,
                expectedAmount,
                message: 'AI key missing'
            };
        }

        if (!fs.existsSync(imagePath)) {
            return {
                isVerified: false,
                isMatch: true,
                extractedAmount: null,
                expectedAmount,
                message: 'Receipt file not found'
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

        const prompt = `Analyze this payment receipt screenshot or image (E-birr, Telebirr, CBE Birr, Bank transfer, paper receipt, etc.).
Extract:
1. Numerical transaction amount (Amount Sent / Paid)
2. Transaction ID / Ref number (e.g. 2580758880)
3. Receiver Name
4. Receiver Phone / Account Number (e.g. 0915188409, 251915188409)
5. Payment Service Name (E-birr, Telebirr, CBE, etc.)

Return ONLY a valid raw JSON object (with NO markdown backticks or extra text) using this exact format:
{
  "amount": 1220.0,
  "transactionId": "2580758880",
  "receiverName": "mohamed abdi abdulahi",
  "receiverPhone": "0915188409",
  "paymentService": "E-birr"
}
If any field cannot be found, use null for that field. Ensure amount is a raw number (e.g. 1220.0).`;

        let response;
        try {
            response = await model.generateContent([prompt, imagePart]);
        } catch (mErr) {
            console.warn('Gemini model failed, retrying with gemini-2.0-flash:', mErr);
            const fallbackModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
            response = await fallbackModel.generateContent([prompt, imagePart]);
        }
        const responseText = response.response.text().trim().replace(/^```json\s*/, '').replace(/\s*```$/, '');
        
        let parsed: any = {};
        try {
            parsed = JSON.parse(responseText);
        } catch(e) {
            console.error('Failed to parse Gemini output:', responseText);
        }

        const extractedAmount = typeof parsed.amount === 'number' ? parsed.amount : (parsed.amount ? parseFloat(parsed.amount) : null);
        const transactionId = parsed.transactionId ? String(parsed.transactionId).trim() : null;
        const receiverPhone = parsed.receiverPhone ? String(parsed.receiverPhone).trim() : null;

        // 1. Transaction ID Deduplication Check
        let isDuplicateTxId = false;
        if (transactionId) {
            try {
                const existingExpense = await prisma.expense.findFirst({
                    where: {
                        note: { contains: `[TxId: ${transactionId}]` }
                    }
                });
                if (existingExpense) {
                    isDuplicateTxId = true;
                }
            } catch (e) {
                console.error("TxId deduplication check error:", e);
            }
        }

        if (isDuplicateTxId) {
            return {
                isVerified: true,
                isMatch: false,
                extractedAmount,
                expectedAmount,
                transactionId,
                receiverName: parsed.receiverName || null,
                receiverPhone,
                paymentService: parsed.paymentService || null,
                isDuplicateTxId: true,
                message: `🛑 RASIIDKANI MAR HORE AYAA LA ISTICMAALAY! (Transaction ID: ${transactionId} mar hore ayaa kharash kale lagu bixiyay)`
            };
        }

        // 2. Amount Matching Check (Strict)
        if (extractedAmount === null || isNaN(extractedAmount)) {
            return {
                isVerified: true,
                isMatch: true,
                extractedAmount: null,
                expectedAmount,
                transactionId,
                receiverName: parsed.receiverName || null,
                receiverPhone,
                paymentService: parsed.paymentService || null,
                message: 'Rasiidka waa la akhriyay laakiin lacagta si cad looma helin.'
            };
        }

        const diff = Math.abs(extractedAmount - expectedAmount);
        const isAmountMatch = diff <= 1.0; // Allow max 1 ETB difference

        // 3. Phone Matching Check (If mobile phone provided)
        let isPhoneMatch = true;
        let isPhoneMismatch = false;
        const normExtractedPhone = normalizePhone(receiverPhone);
        const normExpectedPhone = normalizePhone(expectedPhone);

        if (normExpectedPhone && normExtractedPhone && normExpectedPhone.length >= 8 && normExtractedPhone.length >= 8) {
            if (normExtractedPhone !== normExpectedPhone) {
                isPhoneMatch = false;
                isPhoneMismatch = true;
            }
        }

        const overallMatch = isAmountMatch && isPhoneMatch;

        let msg = '';
        if (!isAmountMatch) {
            msg = `🚨 LACAGTA RASIIDKA IYO LACAGTA LA DALBAY ISMA LAHA!\n` +
                  `Lacagta Rasiidka: ${extractedAmount.toLocaleString()} ETB\n` +
                  `Lacagta la dalbay: ${expectedAmount.toLocaleString()} ETB`;
        } else if (!isPhoneMatch) {
            msg = `🚨 LAMBARKA RASIIDKA IYO LAMBARKA LA BIXINAYAY ISMA LAHA!\n` +
                  `Lambarka Rasiidka: ${receiverPhone}\n` +
                  `Lambarka la dalbay: ${expectedPhone}`;
        } else {
            msg = `✅ RASIIDKA WAA LA HUBUY: Lacagta (${extractedAmount.toLocaleString()} ETB) iyo Lambarku (${receiverPhone || expectedPhone}) waa sax!`;
        }

        return {
            isVerified: true,
            isMatch: overallMatch,
            extractedAmount,
            expectedAmount,
            difference: diff,
            transactionId,
            receiverName: parsed.receiverName || null,
            receiverPhone,
            paymentService: parsed.paymentService || null,
            isPhoneMismatch,
            message: msg
        };
    } catch (error) {
        console.error('Receipt AI Verification Error:', error);
        return {
            isVerified: false,
            isMatch: true,
            extractedAmount: null,
            expectedAmount,
            message: 'Cilad ayaa ku dhacday hubinta AI-da'
        };
    }
}
