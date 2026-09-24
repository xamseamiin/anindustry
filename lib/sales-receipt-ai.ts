// lib/sales-receipt-ai.ts - Gemini 2.5 Flash Sales Receipt AI Scanner
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

export interface SalesReceiptCatalogItem {
    id?: string;
    name: string;
    sku?: string | null;
    sellingPrice?: number | null;
}

export interface SalesReceiptCustomer {
    id: string;
    name: string;
}

export interface SalesReceiptNameCorrection {
    observedName: string;
    correctedCustomerName: string;
}

export interface SalesReceiptLineItem {
    productName: string | null;
    customerName?: string | null;
    customerPhone?: string | null;
    matchedProductId?: string | null;
    matchedProductName?: string | null;
    matchedCustomerId?: string | null;
    matchedCustomerName?: string | null;
    quantity: number | null;
    unitPrice: number | null;
    total: number | null;
    confidence?: number;
}

export interface SalesReceiptAnalysisResult {
    isSuccess: boolean;
    customerName: string | null;
    customerPhone: string | null;
    customerType: 'WALK_IN' | 'NAMED';
    requiresCustomerRegistration: boolean;
    matchedCustomerId: string | null;
    matchedCustomerName: string | null;
    items: SalesReceiptLineItem[];
    productName: string | null;
    quantity: number | null;
    unitPrice: number | null;
    totalAmount: number | null;
    paidAmount: number | null;
    paymentMethod: 'CASH' | 'CARD' | 'PARTIAL' | 'CREDIT' | null;
    accountName: string | null;
    receiptNumber: string | null;
    date: string | null;
    transactionType: 'SALE' | 'CUSTOMER_PAYMENT' | 'DEPOSIT' | 'UNKNOWN';
    confidence: number;
    warnings: string[];
    rawText: string | null;
    message: string;
}

function asNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
        const cleaned = value.replace(/,/g, '').replace(/[^\d.-]/g, '');
        const parsed = Number.parseFloat(cleaned);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
}

function normalizeText(value: unknown): string {
    return String(value || '')
        .toLowerCase()
        .replace(/[^a-z0-9\u00c0-\u024f\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function similarity(left: string, right: string): number {
    if (!left || !right) return 0;
    if (left === right) return 1;
    const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
    for (let row = 1; row <= left.length; row += 1) {
        let diagonal = previous[0];
        previous[0] = row;
        for (let column = 1; column <= right.length; column += 1) {
            const above = previous[column];
            previous[column] = Math.min(
                previous[column] + 1,
                previous[column - 1] + 1,
                diagonal + (left[row - 1] === right[column - 1] ? 0 : 1)
            );
            diagonal = above;
        }
    }
    const editSimilarity = 1 - previous[right.length] / Math.max(left.length, right.length);
    const leftTokens = new Set(left.split(' ').filter(Boolean));
    const rightTokens = new Set(right.split(' ').filter(Boolean));
    const tokenSimilarity = [...leftTokens].filter(token => rightTokens.has(token)).length /
        Math.max(leftTokens.size, rightTokens.size, 1);
    return Math.max(editSimilarity, tokenSimilarity * 0.92);
}

function bestCustomerMatch(
    name: string | null,
    customers: SalesReceiptCustomer[] = [],
    corrections: SalesReceiptNameCorrection[] = []
) {
    const wanted = normalizeText(name);
    if (!wanted || !customers.length) return null;

    const learned = corrections.find(correction => normalizeText(correction.observedName) === wanted);
    if (learned) {
        const target = normalizeText(learned.correctedCustomerName);
        const exactLearned = customers.find(customer => normalizeText(customer.name) === target);
        if (exactLearned) return exactLearned;
    }

    const ranked = customers
        .map(customer => ({ customer, score: similarity(wanted, normalizeText(customer.name)) }))
        .sort((a, b) => b.score - a.score);
    const best = ranked[0];
    const runnerUp = ranked[1];
    // Handwriting can distort a few Latin characters (e.g. Somali names); only
    // auto-link a close, unambiguous match. Everything else needs cashier review.
    if (!best || best.score < 0.76 || (runnerUp && best.score - runnerUp.score < 0.08)) return null;
    return best.customer;
}

function scoreProductMatch(scanName: string, product: SalesReceiptCatalogItem): number {
    const left = normalizeText(scanName);
    const right = normalizeText(`${product.name} ${product.sku || ''}`);
    if (!left || !right) return 0;
    if (left === right) return 1;
    if (right.includes(left) || left.includes(right)) return 0.88;

    const bottleSize = (value: string) => {
        if (/\b(?:0\s*5\s*l|500\s*ml)\b/.test(value)) return '0.5L';
        if (/\b1\s*l\b/.test(value)) return '1L';
        return null;
    };
    const leftSize = bottleSize(left);
    const rightSize = bottleSize(right);
    if (leftSize && leftSize === rightSize) return 0.96;

    const leftTokens = new Set(left.split(' ').filter(Boolean));
    const rightTokens = new Set(right.split(' ').filter(Boolean));
    const overlap = [...leftTokens].filter(token => rightTokens.has(token)).length;
    const total = new Set([...leftTokens, ...rightTokens]).size || 1;
    return overlap / total;
}

function bestProductMatch(scanName: string | null, catalog: SalesReceiptCatalogItem[] = []) {
    if (!scanName || catalog.length === 0) return null;
    let best: { product: SalesReceiptCatalogItem; score: number } | null = null;
    for (const product of catalog) {
        const score = scoreProductMatch(scanName, product);
        if (!best || score > best.score) best = { product, score };
    }
    return best && best.score >= 0.45 ? best : null;
}

export function normalizeSalesReceiptAnalysis(
    parsed: any,
    catalog: SalesReceiptCatalogItem[] = [],
    customers: SalesReceiptCustomer[] = [],
    corrections: SalesReceiptNameCorrection[] = []
): Omit<SalesReceiptAnalysisResult, 'isSuccess' | 'message'> {
    const warnings: string[] = Array.isArray(parsed?.warnings) ? parsed.warnings.filter(Boolean).map(String) : [];
    const rawCustomerName = String(parsed?.customerName || parsed?.customer || parsed?.buyerName || '').trim();
    const normalizedCustomerName = normalizeText(rawCustomerName);
    const walkInCustomer = String(parsed?.customerType || '').toUpperCase() === 'WALK_IN'
        || !rawCustomerName
        || /^(walk in(?: customer)?|walkin(?: customer)?|customer|client|macmiil|macaamiil|cash customer|unknown|n a|na|aan la aqoon|macmiil guud)$/.test(normalizedCustomerName);
    const customerName = walkInCustomer ? null : rawCustomerName;
    const customerPhone = parsed?.customerPhone || parsed?.phone || null;
    const matchedCustomer = walkInCustomer ? null : bestCustomerMatch(customerName, customers, corrections);
    const requiresCustomerRegistration = !walkInCustomer && !matchedCustomer;
    if (requiresCustomerRegistration) warnings.push('Magaca macmiilka rasiidka ku qoran lama waafajin macaamiisha kaydsan; xaqiiji ama diiwaangeli. Lambarku iibka cash-ka khasab ma aha.');
    const rawItems = Array.isArray(parsed?.items) && parsed.items.length > 0
        ? parsed.items
        : [{
            productName: parsed?.productName ?? null,
            quantity: parsed?.quantity ?? null,
            unitPrice: parsed?.unitPrice ?? null,
            total: parsed?.lineTotal ?? parsed?.total ?? parsed?.totalAmount ?? null
        }];

    const explicitLineCustomerNames = rawItems
        .map((item: any) => String(item?.customerName || item?.buyerName || '').trim())
        .filter(Boolean);
    const uniqueLineCustomers = new Set(explicitLineCustomerNames.map(normalizeText));
    const mixedCustomerReceipt = uniqueLineCustomers.size > 1;

    const extractedItems: SalesReceiptLineItem[] = rawItems
        .map((item: any) => {
            const productName = item?.productName || item?.name || item?.item || null;
            const match = bestProductMatch(productName, catalog);
            const quantity = asNumber(item?.quantity) ?? 1;
            const total = asNumber(item?.total) ?? asNumber(item?.lineTotal);
            const unitPrice = asNumber(item?.unitPrice) ?? (total && quantity ? total / quantity : null);
            const itemWarnings: string[] = [];
            // A receipt-level customer is only a safe fallback when the invoice belongs
            // to one buyer. Mixed-customer notebook receipts must keep each row's buyer
            // independent; otherwise one header name silently gets copied to every row.
            const explicitLineCustomerName = String(item?.customerName || item?.buyerName || '').trim();
            const lineCustomerName = explicitLineCustomerName || (!mixedCustomerReceipt ? String(customerName || '').trim() : '');
            const matchedLineCustomer = lineCustomerName ? bestCustomerMatch(lineCustomerName, customers, corrections) : null;

            if (!productName) itemWarnings.push('Magaca product-ka lama akhrin.');
            if (!match && productName) itemWarnings.push(`Product "${productName}" inventory-ga lama hubo, dooro product sax ah.`);
            if (!unitPrice) itemWarnings.push(`Qiimaha "${productName || 'item'}" lama hubo.`);

            warnings.push(...itemWarnings);

            return {
                productName,
                customerName: lineCustomerName || null,
                customerPhone: item?.customerPhone || item?.buyerPhone || null,
                matchedProductId: match?.product.id || null,
                matchedProductName: match?.product.name || null,
                matchedCustomerId: matchedLineCustomer?.id || null,
                matchedCustomerName: matchedLineCustomer?.name || null,
                quantity,
                unitPrice,
                total: total ?? (unitPrice ? quantity * unitPrice : null),
                confidence: match ? Math.round(match.score * 100) : Number(item?.confidence) || 0
            };
        })
        .filter((item: SalesReceiptLineItem) => item.productName || item.total || item.unitPrice || item.customerName);

    // Handwritten invoices often repeat the same product on several rows. Merge only
    // confidently matched rows with the same unit price so the sale form remains clean.
    const mergedItems = new Map<string, SalesReceiptLineItem>();
    for (const item of extractedItems) {
        const normalizedName = normalizeText(item.matchedProductName || item.productName || '');
        const priceKey = Number(item.unitPrice || 0).toFixed(4);
        const key = item.matchedProductId
            ? `${item.matchedProductId}:${priceKey}:${normalizeText(item.customerName || '')}`
            : `${normalizedName}:${priceKey}:${normalizeText(item.customerName || '')}`;
        const existing = mergedItems.get(key);
        if (!existing) {
            mergedItems.set(key, { ...item });
            continue;
        }
        const quantity = Number(existing.quantity || 0) + Number(item.quantity || 0);
        const total = Number(existing.total || 0) + Number(item.total || 0);
        mergedItems.set(key, {
            ...existing,
            quantity,
            total,
            confidence: Math.min(Number(existing.confidence || 0), Number(item.confidence || 0))
        });
    }
    const items = [...mergedItems.values()];

    if (mixedCustomerReceipt && items.some(item => !item.customerName)) {
        warnings.push('Rasiidku wuxuu leeyahay macaamiil kala duwan; saf aan customer-kiisa la hubin waa in gacanta lagu xaqiijiyaa.');
    }

    const itemTotal = items.reduce((sum, item) => sum + (Number(item.total) || ((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0))), 0);
    const totalAmount = asNumber(parsed?.totalAmount) ?? asNumber(parsed?.grandTotal) ?? (itemTotal > 0 ? itemTotal : null);
    let paidAmount = asNumber(parsed?.paidAmount) ?? asNumber(parsed?.amountPaid) ?? null;
    const method = String(parsed?.paymentMethod || '').toUpperCase();
    if (walkInCustomer && totalAmount !== null) paidAmount = totalAmount;
    else if (paidAmount === null && method === 'CASH' && totalAmount !== null) paidAmount = totalAmount;
    const paymentMethod = walkInCustomer && totalAmount !== null
        ? 'CASH'
        : ['CASH', 'CARD', 'PARTIAL', 'CREDIT'].includes(method)
        ? method as SalesReceiptAnalysisResult['paymentMethod']
        : paidAmount === null
            ? null
            : paidAmount >= Number(totalAmount || 0) && Number(totalAmount || 0) > 0
                ? 'CASH'
                : paidAmount > 0
                    ? 'PARTIAL'
                    : 'CREDIT';

    if (items.length === 0) warnings.push('Rasiidka lagama helin product lines la kaydin karo.');
    if (totalAmount !== null && itemTotal > 0 && Math.abs(itemTotal - totalAmount) > 1) {
        warnings.push(`Wadarta items-ka (${itemTotal.toLocaleString()} ETB) iyo total-ka rasiidka (${totalAmount.toLocaleString()} ETB) way kala duwan yihiin.`);
    }
    if (paidAmount !== null && totalAmount !== null && paidAmount > totalAmount) {
        warnings.push('Lacagta la bixiyay waxay ka badan tahay total-ka rasiidka, hubi in tani deposit dheeraad ah tahay.');
    }

    const confidence = Math.max(0, Math.min(100, Number(parsed?.confidence) || (warnings.length ? 72 : 92)));

    let receiptDate = parsed?.date || null;
    if (receiptDate) {
        const parsedDate = new Date(receiptDate);
        const year = parsedDate.getUTCFullYear();
        const maximumYear = new Date().getUTCFullYear() + 1;
        if (Number.isNaN(parsedDate.getTime()) || year < 2020 || year > maximumYear) {
            warnings.push(`Taariikhda "${receiptDate}" si otomaatig ah looma gelin; hubi Gregorian/Ethiopian calendar-ka.`);
            receiptDate = null;
        }
    }

    const parsedTransactionType = String(parsed?.transactionType || '').toUpperCase();
    const transactionType: SalesReceiptAnalysisResult['transactionType'] =
        parsedTransactionType === 'CUSTOMER_PAYMENT' || parsedTransactionType === 'DEPOSIT' || parsedTransactionType === 'SALE'
            ? parsedTransactionType
            : 'SALE';

    return {
        customerName,
        customerPhone,
        customerType: walkInCustomer ? 'WALK_IN' : 'NAMED',
        requiresCustomerRegistration,
        matchedCustomerId: matchedCustomer?.id || null,
        matchedCustomerName: matchedCustomer?.name || null,
        items,
        productName: items[0]?.productName || parsed?.productName || null,
        quantity: items[0]?.quantity ?? asNumber(parsed?.quantity),
        unitPrice: items[0]?.unitPrice ?? asNumber(parsed?.unitPrice),
        totalAmount,
        paidAmount,
        paymentMethod,
        accountName: parsed?.accountName || parsed?.paidTo || parsed?.wallet || null,
        receiptNumber: parsed?.receiptNumber || parsed?.invoiceNumber || parsed?.reference || null,
        date: receiptDate,
        transactionType,
        confidence,
        warnings: [...new Set(warnings)],
        rawText: parsed?.rawText || parsed?.notes || null
    };
}

export async function parseSalesReceiptImageWithAI(
    imageSource: string | Buffer,
    catalog: SalesReceiptCatalogItem[] = [],
    mimeType = 'image/jpeg',
    customers: SalesReceiptCustomer[] = [],
    corrections: SalesReceiptNameCorrection[] = []
): Promise<SalesReceiptAnalysisResult> {
    try {
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            return {
                isSuccess: false,
                customerName: null,
                customerPhone: null,
                customerType: 'WALK_IN',
                requiresCustomerRegistration: false,
                matchedCustomerId: null,
                matchedCustomerName: null,
                items: [],
                productName: null,
                quantity: null,
                unitPrice: null,
                totalAmount: null,
                paidAmount: null,
                paymentMethod: null,
                accountName: null,
                receiptNumber: null,
                date: null,
                transactionType: 'UNKNOWN',
                confidence: 0,
                warnings: ['GOOGLE_API_KEY is missing.'],
                rawText: null,
                message: 'AI key is missing in server environment.'
            };
        }

        if (typeof imageSource === 'string' && !fs.existsSync(imageSource)) {
            return {
                isSuccess: false,
                customerName: null,
                customerPhone: null,
                customerType: 'WALK_IN',
                requiresCustomerRegistration: false,
                matchedCustomerId: null,
                matchedCustomerName: null,
                items: [],
                productName: null,
                quantity: null,
                unitPrice: null,
                totalAmount: null,
                paidAmount: null,
                paymentMethod: null,
                accountName: null,
                receiptNumber: null,
                date: null,
                transactionType: 'UNKNOWN',
                confidence: 0,
                warnings: ['Receipt image file was not found on the server.'],
                rawText: null,
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

        const fileBuffer = Buffer.isBuffer(imageSource) ? imageSource : fs.readFileSync(imageSource);
        const imagePart = {
            inlineData: {
                data: fileBuffer.toString('base64'),
                mimeType
            }
        };

        const productCatalog = catalog.length
            ? `Known AN-Industries inventory/products. Match product lines to these names when possible, but do not invent quantities or prices:\n${catalog.map(p => `- ${p.name}${p.sku ? ` (${p.sku})` : ''}${p.sellingPrice ? ` default price ${p.sellingPrice} ETB` : ''}`).join('\n')}`
            : 'No product catalog was provided. Extract the product names exactly as written.';

        const customerCatalog = customers.length
            ? `Known customer names from the company database. Use these as spelling/matching hints only; return the literal handwritten spelling in customerName and set matchedCustomerName only when the match is clear:\n${customers.map(customer => `- ${customer.name}`).join('\n')}`
            : 'No customer-name list was provided. Preserve any customer name exactly as written.';

        const prompt = `Analyze this Sales Receipt / Invoice / Payment Voucher image (Rasiidka Iibka ama Bixinta). It may be printed or handwritten Somali, Amharic, or English text. Read carefully and extract the sale draft for AN Industries. Be tolerant of ordinary handwriting and Somali Latin names: Abshir, Farax, Faarax, Maxamed, and similar names are personal names, not product names when context indicates a buyer.

${productCatalog}

${customerCatalog}

Extract key sales transaction fields accurately:
1. customerName: This receipt-level field is ONLY for an invoice where every product belongs to one buyer, usually the name after "To:". If the paper is a notebook/list containing sales for different buyers, return receipt-level customerName as null and customerType as "WALK_IN"; never copy the first buyer into this field. Preserve exact handwriting.
2. matchedCustomerName: Canonical spelling from the customer list only if one is clearly the same person despite a handwriting/spelling variation; otherwise null. The cashier will verify this suggestion. Do not guess.
3. If the receipt says only customer/client/macmiil or explicitly "walk-in customer", treat it as generic, return null and set customerType to "WALK_IN". A Walk-in sale is cash and fully paid at the receipt total. If a real person/company name is visible, set customerType to "NAMED" and do not invent a phone number.
4. customerPhone: Phone number only if actually written on the receipt.
5. customerType: One of "WALK_IN" or "NAMED".
6. items: Every product/material line sold. Return every handwritten row. EACH ROW MUST carry its own customerName when the paper contains different buyers—even when the same product repeats. Read the buyer beside that exact quantity/price/total; do not inherit the receipt-level customer or the preceding row's customer. For each item return productName, quantity, unitPrice, total, customerName, matchedCustomerName, and customerPhone only when visible. When only a buyer name is written in a row's Description and the actual product is unclear, preserve the buyer name, leave productName null, and add a warning instead of inventing a product.
7. totalAmount: Grand total price of the sale as a raw ETB number.
8. paidAmount: Amount paid/deposited according to the receipt as a raw ETB number. If no payment is shown, use 0 only when the receipt clearly says credit/dayn/unpaid; otherwise use null.
9. paymentMethod: One of "CASH", "CARD", "PARTIAL", "CREDIT". A printed heading such as "CASH SALES INVOICE" means CASH unless handwriting clearly says otherwise. If paidAmount >= totalAmount, use "CASH". If 0 < paidAmount < totalAmount, use "PARTIAL". If paidAmount == 0 and it is dayn/unpaid, use "CREDIT".
10. accountName: Bank, Wallet, or Merchant account name mentioned where money was sent/deposited (e.g. "E-Birr Merchant", "CBE", "Zaad", "Cash", etc.).
11. receiptNumber: Invoice or receipt reference number.
12. date: Date of transaction in YYYY-MM-DD format if visible. Somali/Ethiopian receipts may use the Ethiopian calendar. Do not silently convert an ambiguous handwritten date; return null and add a warning unless the calendar and full date are clear.
13. transactionType: usually "SALE"; use "CUSTOMER_PAYMENT" only when the image is a payment toward an old debt without new products; use "DEPOSIT" only when it is a company deposit not a customer sale.
14. If customerType is WALK_IN and a sale total is visible, treat the sale as fully paid in CASH. A missing phone does not make a customer unknown or require registration when the buyer name matches the database.
15. confidence: 0-100 estimate of extraction confidence.
16. warnings: short Somali/English warnings for fields that need human review.
17. rawText: the important text you were able to read from the image.

Return ONLY a valid raw JSON object (strictly no markdown codeblocks or extra text):
{
  "customerName": "Abdi Hassan",
  "customerPhone": "0912345678",
  "customerType": "NAMED",
  "requiresCustomerRegistration": false,
  "matchedCustomerName": "Abdi Hassan",
  "items": [
    { "customerName": "Abdi Hassan", "matchedCustomerName": "Abdi Hassan", "customerPhone": null, "productName": "Block 15cm", "quantity": 500, "unitPrice": 150, "total": 75000 },
    { "customerName": "Abdi Hassan", "customerPhone": null, "productName": "Cement", "quantity": 10, "unitPrice": 900, "total": 9000 }
  ],
  "totalAmount": 75000,
  "paidAmount": 75000,
  "paymentMethod": "CASH",
  "accountName": "E-Birr Merchant",
  "receiptNumber": "INV-1092",
  "date": "2026-07-22",
  "transactionType": "SALE",
  "confidence": 91,
  "warnings": [],
  "rawText": "..."
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

        const normalized = normalizeSalesReceiptAnalysis(parsed, catalog, customers, corrections);

        return {
            isSuccess: true,
            ...normalized,
            message: normalized.warnings.length
                ? 'Rasiidka waa la akhriyay, laakiin fadlan hubi meelaha digniinta leh ka hor save.'
                : 'Rasiidka iibka waa la akhriyay oo form-ka waa la buuxiyay.'
        };
    } catch (error: any) {
        console.error('Sales Receipt AI Scanning Error:', error);
        return {
            isSuccess: false,
            customerName: null,
            customerPhone: null,
            customerType: 'WALK_IN',
            requiresCustomerRegistration: false,
            matchedCustomerId: null,
            matchedCustomerName: null,
            items: [],
            productName: null,
            quantity: null,
            unitPrice: null,
            totalAmount: null,
            paidAmount: null,
            paymentMethod: null,
            accountName: null,
            receiptNumber: null,
            date: null,
            transactionType: 'UNKNOWN',
            confidence: 0,
            warnings: [error.message || 'AI scanner failed.'],
            rawText: null,
            message: 'Cilad ayaa ku dhacday akhrinta rasiidka iibka: ' + (error.message || 'Error')
        };
    }
}
