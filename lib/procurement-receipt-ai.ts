import { GoogleGenerativeAI } from '@google/generative-ai';

export type ProcurementReceiptDraft = {
  vendorName: string | null;
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

export async function parseProcurementReceipt(buffer: Buffer, mimeType: string): Promise<ProcurementReceiptDraft> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error('Gemini API key-ga maqan yahay; rasiidka waa la kaydin karaa balse AI ma akhrin karto.');
  const ai = new GoogleGenerativeAI(apiKey);
  const image = { inlineData: { data: buffer.toString('base64'), mimeType } };
  const prompt = `Akhriso rasiid iibsi warshadeed oo daabacan ama gacan-ku-qoran, Soomaali/English. Soo saar vendor/supplier, item ama spare part, quantity, qiimaha halkii, wadarta, iyo taariikhda. Ha qiyaasin. Haddii xog maqan tahay null. Soo celi JSON keliya: {"vendorName":null,"itemName":null,"quantity":null,"unitPrice":null,"totalAmount":null,"date":null,"confidence":0,"warnings":[]}.`;
  let response;
  try {
    response = await ai.getGenerativeModel({ model: 'gemini-2.5-flash' }).generateContent([prompt, image]);
  } catch {
    response = await ai.getGenerativeModel({ model: 'gemini-2.0-flash' }).generateContent([prompt, image]);
  }
  const text = response.response.text().trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const parsed = JSON.parse(text);
  const warnings: string[] = Array.isArray(parsed.warnings) ? parsed.warnings.map((warning: unknown) => String(warning)) : [];
  const itemName = String(parsed.itemName || '').trim() || null;
  const vendorName = String(parsed.vendorName || '').trim() || null;
  const quantity = amount(parsed.quantity);
  const totalAmount = amount(parsed.totalAmount);
  let unitPrice = amount(parsed.unitPrice);
  if (!unitPrice && totalAmount && quantity) unitPrice = totalAmount / quantity;
  if (!vendorName) warnings.push('Magaca supplier-ka lama akhrin; adigu geli.');
  if (!itemName) warnings.push('Magaca spare part-ka lama akhrin; adigu geli.');
  if (!totalAmount) warnings.push('Wadarta lacagtan lama akhrin; adigu geli.');
  return {
    vendorName,
    itemName,
    quantity,
    unitPrice,
    totalAmount,
    date: parsed.date ? String(parsed.date) : null,
    confidence: Math.max(0, Math.min(100, Number(parsed.confidence) || 0)),
    warnings: [...new Set(warnings)]
  };
}
