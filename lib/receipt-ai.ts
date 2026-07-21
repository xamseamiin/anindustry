import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

export interface ReceiptVerificationResult {
    isVerified: boolean;
    isMatch: boolean;
    extractedAmount: number | null;
    expectedAmount: number;
    transactionId?: string | null;
    receiverName?: string | null;
    paymentService?: string | null;
    difference?: number;
    message: string;
}

export async function verifyReceiptImageWithAI(
    imagePath: string,
    expectedAmount: number
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
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const fileBuffer = fs.readFileSync(imagePath);
        const imagePart = {
            inlineData: {
                data: fileBuffer.toString('base64'),
                mimeType: 'image/jpeg'
            }
        };

        const prompt = `Analyze this payment receipt screenshot or image (E-birr, Telebirr, CBE Birr, Bank transfer, paper receipt, etc.).
Extract the numerical transaction amount, transaction ID, receiver name, and payment service name.
Return ONLY a valid raw JSON object (with NO markdown backticks or extra text) using this exact format:
{
  "amount": 1220.0,
  "transactionId": "2562913614",
  "receiverName": "muhiyadin mahamed abdi",
  "paymentService": "E-birr"
}
If any field cannot be found, use null for that field. Ensure amount is a raw number (e.g. 1220.0, not a string).`;

        const response = await model.generateContent([prompt, imagePart]);
        const responseText = response.response.text().trim().replace(/^```json\s*/, '').replace(/\s*```$/, '');
        
        let parsed: any = {};
        try {
            parsed = JSON.parse(responseText);
        } catch(e) {
            console.error('Failed to parse Gemini output:', responseText);
        }

        const extractedAmount = typeof parsed.amount === 'number' ? parsed.amount : (parsed.amount ? parseFloat(parsed.amount) : null);

        if (extractedAmount === null || isNaN(extractedAmount)) {
            return {
                isVerified: true,
                isMatch: true,
                extractedAmount: null,
                expectedAmount,
                transactionId: parsed.transactionId || null,
                receiverName: parsed.receiverName || null,
                paymentService: parsed.paymentService || null,
                message: 'Rasiidka waa la akhriyay laakiin lacagta si cad looma helin.'
            };
        }

        const diff = Math.abs(extractedAmount - expectedAmount);
        const isMatch = diff <= 1.0; // Allow 1 ETB margin for rounding/fees

        return {
            isVerified: true,
            isMatch,
            extractedAmount,
            expectedAmount,
            difference: diff,
            transactionId: parsed.transactionId || null,
            receiverName: parsed.receiverName || null,
            paymentService: parsed.paymentService || null,
            message: isMatch
                ? `✅ RASIIDKA WAA LA HUBUY: Lacagta rasiidka (${extractedAmount.toLocaleString()} ETB) waxay 100% u dhigantaa lacagta la dalbaday (${expectedAmount.toLocaleString()} ETB).`
                : `🚨 DIGNIIN KHALAD: Lacagta Rasiidka ku qoran (${extractedAmount.toLocaleString()} ETB) iyo Lacagta la dalbaday (${expectedAmount.toLocaleString()} ETB) ISMA LAHA! (Farqi: ${diff.toLocaleString()} ETB)`
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
