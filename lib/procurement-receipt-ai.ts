import { GoogleGenerativeAI } from '@google/generative-ai';

export type ProcurementReceiptItemDraft = {
  itemName: string | null;
  quantity: number | null;
  unitPrice: number | null;
  total: number | null;
};

export type ProcurementReceiptDraft = {
  vendorName: string | null;
  items: ProcurementReceiptItemDraft[];
  // Retained for compatibility with any existing single-item callers.
  itemName: string | null;
  quantity: number | null;
  unitPrice: number | null;
  totalAmount: number | null;
  date: string | null;
  confidence: number;
  warnings: string[];
};

function amount(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const parsed = Number.parseFloat(value.replace(/,/g, '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function cleanJson(text: string): string {
  return text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
}

export async function parseProcurementReceipt(buffer: Buffer, mimeType: string): Promise<ProcurementReceiptDraft> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error('Gemini API key-ga maqan yahay; rasiidka waa la kaydin karaa balse AI ma akhrin karto.');

  const ai = new GoogleGenerativeAI(apiKey);
  const image = { inlineData: { data: buffer.toString('base64'), mimeType } };
  const prompt = `You are an expert OCR reader for factory purchase receipts and invoices. Read every line item from this printed or handwritten receipt. It may contain Somali, English, or Amharic text.

The table may have columns such as Description, Qty/Quantity, Unit Price/Price, and Total/Amount. Return one item for every purchased product/part. Do not merge different items. Read corrected handwritten numbers when a number was crossed out. Verify quantity × unit price against the line total, but do not invent missing values. Identify the supplier/vendor, receipt grand total, and date when visible. The grand total is the receipt's final Total, not a sum you guessed.

Return JSON only, with exactly this shape:
{"vendorName":null,"items":[{"name":null,"qty":null,"unitPrice":null,"total":null}],"totalAmount":null,"date":null,"confidence":0,"warnings":[]}
Use numeric values without commas; use null for unreadable values. If the receipt has no visible product rows, return an empty items array and explain in warnings.`;

  const models = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash'];
  let parsed: any = null;
  let lastError: unknown;
  for (const modelName of models) {
    try {
      const response = await ai.getGenerativeModel({ model: modelName }).generateContent({
        contents: [{ role: 'user', parts: [
          { text: prompt },
          { inlineData: image.inlineData }
        ] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 4096, responseMimeType: 'application/json' }
      });
      parsed = JSON.parse(cleanJson(response.response.text()));
      break;
    } catch (error) {
      lastError = error;
    }
  }
  if (!parsed) throw new Error(`Gemini rasiid-akhrisku wuu fashilmay. ${lastError instanceof Error ? lastError.message : ''}`.trim());

  const warnings: string[] = Array.isArray(parsed.warnings) ? parsed.warnings.map((warning: unknown) => String(warning)) : [];
  const rawItems = Array.isArray(parsed.items) ? parsed.items : (parsed.itemName ? [parsed] : []);
  const items: ProcurementReceiptItemDraft[] = rawItems.map((item: any) => {
    const quantity = amount(item.qty ?? item.quantity);
    const total = amount(item.total ?? item.lineTotal ?? item.amount);
    const parsedUnitPrice = amount(item.unitPrice ?? item.price);
    const unitPrice = parsedUnitPrice ?? (quantity && total !== null ? total / quantity : null);
    return {
      itemName: String(item.name ?? item.itemName ?? '').trim() || null,
      quantity,
      unitPrice,
      total: total ?? (quantity !== null && unitPrice !== null ? quantity * unitPrice : null)
    } satisfies ProcurementReceiptItemDraft;
  });

  const vendorName = String(parsed.vendorName || '').trim() || null;
  const totalAmount = amount(parsed.totalAmount ?? parsed.grandTotal);
  if (!vendorName) warnings.push('Magaca supplier-ka lama akhrin; adigu geli.');
  if (items.length === 0) warnings.push('Alaab safaf ah lama aqoonsan; rasiidka si cad mar kale sawir ama safafka gacanta ku dar.');
  if (items.some(item => !item.itemName || item.quantity === null || item.unitPrice === null || item.total === null)) {
    warnings.push('Qaar ka mid ah magaca, tirada ama qiimaha lama hubin; dib u eeg saf kasta.');
  }
  if (totalAmount === null) warnings.push('Wadarta rasiidka lama akhrin; hubi wadarta safafka.');

  return {
    vendorName,
    items,
    itemName: items.length === 1 ? items[0].itemName : null,
    quantity: items.length === 1 ? items[0].quantity : null,
    unitPrice: items.length === 1 ? items[0].unitPrice : null,
    totalAmount,
    date: parsed.date ? String(parsed.date) : null,
    confidence: Math.max(0, Math.min(100, Number(parsed.confidence) || 0)),
    warnings: [...new Set(warnings)]
  };
}
