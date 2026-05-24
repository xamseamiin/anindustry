// REVLO AI ENGINE v3 — 10K+ Rules via Synonym Expansion + Scenarios
import { AiResponse, greetings, farewells, thanks, features, businessAdvice, FeatureKnowledge } from './shopAiKnowledge';
export type { AiResponse } from './shopAiKnowledge';
import { synonyms, conversationalPatterns, businessTips, faq, glossary } from './shopAiExpanded';
import { troubleshooting, industryAdvice, accountingGuides, seasonalAdvice } from './shopAiScenarios';

function normalize(t: string): string {
  return t.toLowerCase().replace(/[?.!,;:'"]/g, '').replace(/\s+/g, ' ').trim();
}

function has(t: string, words: string[]): boolean {
  const n = normalize(t);
  return words.some(w => n.includes(w));
}

function getTimeOfDay(): 'subax' | 'galab' | 'habeen' {
  const h = new Date().getHours();
  return h < 12 ? 'subax' : h < 17 ? 'galab' : 'habeen';
}

// --- DATA QUERY TYPES ---
export type DataQueryType = 'summary' | 'sales_today' | 'sales_yesterday' | 'sales_week' | 'sales_month' | 'customer_search' | 'low_stock' | 'inventory_overview' | 'employees_list' | 'accounts_overview' | 'create_customer' | 'create_employee' | 'create_product' | 'adjust_stock' | 'product_search' | 'top_customers' | 'expenses_overview' | null;

export interface AiResult {
  response: AiResponse;
  dataQuery?: DataQueryType;
  queryParams?: Record<string, string>;
}

// --- INTENT DETECTION ---
type Intent = 'greeting' | 'farewell' | 'thanks' | 'help' | 'what_is' | 'how_to' | 'navigate' | 'tutorial'
  | 'advice_small' | 'advice_big' | 'advice_profit' | 'compare_pos_manual'
  | 'query_sales_today' | 'query_sales_yesterday' | 'query_sales_week' | 'query_sales_month'
  | 'query_customer' | 'query_low_stock' | 'query_inventory' | 'query_employees' | 'query_accounts' | 'query_summary'
  | 'query_product' | 'query_top_customers' | 'query_expenses'
  | 'action_create_customer' | 'action_create_employee' | 'action_create_product' | 'action_adjust_stock'
  | 'action_navigate' | 'troubleshoot' | 'faq_answer' | 'identity' | 'tip' | 'apology'
  | 'industry_advice' | 'accounting_guide' | 'glossary_lookup' | 'seasonal' | 'unknown';

function detectIntent(input: string): Intent {
  const n = normalize(input);
  const words = n.split(' ');

  // =============================================
  // GREETINGS — 100+ patterns
  // =============================================
  const greetWords = ['salam', 'salaan', 'salaam', 'subax', 'galab', 'habeen', 'hello', 'hey', 'haye', 'asc', 'wsc', 'assalamu', 'marhaba', 'soo dhawoow', 'war nabad', 'nabad miyaa', 'sidee tahay', 'iska warran', 'maxaa cusub', 'maalin wanaagsan', 'nabad', 'nabadeey'];
  if (has(n, greetWords)) {
    if (n.length < 30 && has(n, ['nabadgelyo', 'nabad gelyo'])) return 'farewell';
    if (n.length < 40) return 'greeting';
  }
  if (n === 'hi' || n === 'hey' || n === 'haye') return 'greeting';

  // =============================================
  // FAREWELL
  // =============================================
  if (has(n, ['nabadgelyo', 'bye', 'goodbye', 'nabad gelyo', 'is arag', 'waan tagayaa', 'habeen wanaag', 'nabad gal', 'iska waran'])) return 'farewell';

  // =============================================
  // THANKS
  // =============================================
  if (has(n, ['mahad', 'thanks', 'thank', 'adigaa', 'waad ku mahad', 'jazakallah', 'mahadsanid', 'barakallah', 'shukran'])) return 'thanks';

  // =============================================
  // WRITE ACTIONS — PRIORITY (check before data queries!)
  // =============================================
  const actionWords = ['ii samee', 'ii samayn', 'ii diwan', 'diiwan', 'diwan gali', 'register', 'create', 'add', 'ku dar', 'abuur', 'iigu dar', 'ii geli', 'noo geli', 'diiwaangeli'];
  if (has(n, actionWords) || (has(n, ['cusub', 'new']) && has(n, ['customer', 'macmiil', 'shaqaal', 'employee', 'alaab', 'product']))) {
    if (has(n, ['customer', 'macmiil', 'macaamiil', 'qof'])) return 'action_create_customer';
    if (has(n, ['shaqaal', 'employee', 'staff'])) return 'action_create_employee';
    if (has(n, ['alaab', 'product', 'shay'])) return 'action_create_product';
    if (has(n, ['vendor', 'jumla', 'bixiye'])) return 'action_navigate';
    return 'action_navigate';
  }

  // =============================================
  // DATA QUERIES — xog dhab ah (PRIORITY — check before tutorials)
  // =============================================

  // --- PROFIT / FAA'IIDO queries (very important) ---
  const profitWords = ["faa'iido", 'faaido', 'faaiido', 'faa iid', 'faa', 'profit', 'kasban', 'kasb', 'kasbay', 'kasbanay', 'dakhli', 'revenue', 'faa iiday', 'faaiiday', 'faaidayd'];
  const timeToday = ['maanta', 'today', 'maalintaan', 'maalinta', 'hadda'];
  const timeYesterday = ['shalay', 'yesterday', 'xalay', 'berri hore'];
  const timeWeek = ['usbuuc', 'usbuucan', 'isbuuc', 'isbuucan', 'week', 'toddobaad', 'toddobaadkan', 'usbuuca', '7maal'];
  const timeMonth = ['bish', 'bishan', 'bilaash', 'month', 'bilaha', 'bishaan', '30maal'];

  // "isbuucan maxaan faa iiday" / "usbuucan faa'iidadii" / "profit this week"
  if (has(n, profitWords)) {
    if (has(n, timeToday)) return 'query_sales_today';
    if (has(n, timeYesterday)) return 'query_sales_yesterday';
    if (has(n, timeWeek)) return 'query_sales_week';
    if (has(n, timeMonth)) return 'query_sales_month';
    return 'query_sales_today'; // default to today
  }

  // --- SALES queries ---
  const salesWords = ['iib', 'iibk', 'iibkii', 'iibiyay', 'sale', 'sales', 'sold', 'lacag', 'sold', 'gadid', 'gadday', 'la gadday', 'la iibiyay', 'la iibiye', 'soo gal', 'dakhli', 'waxla iibiyay', 'revenue'];
  const questionWords = ['meeqa', 'intee', 'sidee', 'siduu', 'maxaa', 'maxaan', 'how much', 'how many', 'wax', 'xog'];

  if (has(n, timeToday) && (has(n, salesWords) || has(n, questionWords))) return 'query_sales_today';
  if (has(n, timeYesterday) && (has(n, salesWords) || has(n, questionWords))) return 'query_sales_yesterday';
  if (has(n, timeWeek) && (has(n, salesWords) || has(n, questionWords))) return 'query_sales_week';
  if (has(n, timeMonth) && (has(n, salesWords) || has(n, questionWords))) return 'query_sales_month';
  if (has(n, salesWords) && has(n, questionWords)) return 'query_sales_today';

  // "shalay" alone → yesterday sales
  if (has(n, timeYesterday) && n.length < 30) return 'query_sales_yesterday';

  // --- CUSTOMER queries ---
  const customerWords = ['macmiil', 'macaamiil', 'macaamiisha', 'customer', 'dayn', 'deyn', 'daynta', 'deynta', 'nagu lee', 'ku lee', 'debt', 'nagu leeyahay', 'leeyahay', 'ku leeyahay', 'lacag nagu', 'ii sheeg', 'xogtiis', 'xogteed'];

  // Top customers check FIRST (before general customer query)
  if (has(n, ['macmiil', 'macaamiil', 'macaamiisha', 'customer']) && has(n, ['ugu badan', 'top', 'ugu fiican', 'rank', 'ugu iib badan'])) return 'query_top_customers';

  if (has(n, customerWords) && has(n, [...questionWords, 'yaa', 'who', 'nagu', 'liis', 'dhaman', 'arag'])) return 'query_customer';
  if (has(n, ['yaa', 'who']) && has(n, ['dayn', 'deyn', 'lee'])) return 'query_customer';

  // Direct name + debt: "Cali intee nagu leeyahay"
  if (has(n, ['nagu', 'ku']) && has(n, ['lee', 'leeyahay'])) return 'query_customer';

  // --- LOW STOCK ---
  const lowStockWords = ['dhamaa', 'dhiman', 'low stock', 'run out', 'yaraa', 'dhamaanay', 'dhamaanays', 'ku dhow', 'socot', 'out of stock', 'stock yar', 'gabow', 'yaraad', 'kala dhamaa', 'dhamays', 'dhimanays'];
  if (has(n, lowStockWords)) return 'query_low_stock';

  // --- INVENTORY ---
  const inventoryWords = ['kayd', 'inventory', 'stock', 'badeeco', 'alaab', 'products', 'product'];
  if (has(n, inventoryWords) && has(n, [...questionWords, 'total', 'guud', 'overview', 'dhamaan', 'list', 'liis', 'arag'])) return 'query_inventory';

  // --- EMPLOYEES ---
  const employeeWords = ['shaqaal', 'shaqaale', 'employee', 'staff', 'worker', 'mushaar', 'payroll', 'salary', 'mushahar'];
  if (has(n, employeeWords) && has(n, [...questionWords, 'list', 'liis', 'yaa', 'dhaman', 'arag', 'tus', 'meeqa'])) return 'query_employees';

  // --- ACCOUNTS ---
  const accountWords = ['xisaab', 'account', 'balance', 'haraag', 'bangiga', 'bank', 'evc', 'edahab', 'kaash', 'lacag'];
  if (has(n, accountWords) && has(n, [...questionWords, 'total', 'guud', 'arag', 'ku jir'])) return 'query_accounts';
  // "lacagta meeqa" → accounts
  if (n.includes('lacag') && has(n, ['meeqa', 'intee']) && !has(n, salesWords)) return 'query_accounts';

  // --- SUMMARY ---
  const summaryWords = ['xaalad', 'summary', 'guud', 'overview', 'status', 'guudmar'];
  if (has(n, summaryWords) && has(n, ['dukaan', 'shop', 'ganacsi', 'business', 'system', 'siduu', 'sidee'])) return 'query_summary';
  // "siduu dukaanku yahay" / "dukaan siduu socdo"
  if (has(n, ['dukaan', 'shop']) && has(n, ['siduu', 'sidee', 'socdo', 'socon', 'yahay'])) return 'query_summary';

  // Stock adjust: "sabuuradda 50 ka dhig"
  if (has(n, ['stock', 'kayd', 'tiro']) && has(n, ['beddel', 'adjust', 'ka dhig'])) return 'action_adjust_stock';

  // Product search: "sabuuradda qiimaheedu meeqa"
  if (has(n, ['qiime', 'qiimah', 'price', 'lacag', 'meeqa']) && has(n, inventoryWords)) return 'query_product';

  // Top customers
  if (has(n, customerWords) && has(n, ['ugu badan', 'top', 'ugu fiican', 'rank'])) return 'query_top_customers';

  // Expenses
  if (has(n, ['kharash', 'expense', 'kharashka', 'lacag baxday'])) return 'query_expenses';

  // =============================================
  // COMPARE POS vs Manual
  // =============================================
  if (has(n, ['pos', 'manual']) && has(n, ['kala duwan', 'farqi', 'midkee', 'difference', 'compare', 'mise', 'fiican'])) return 'compare_pos_manual';
  if (has(n, ['midkee', 'kee', 'tee']) && has(n, ['pos', 'manual', 'isticmaal', 'fiican'])) return 'compare_pos_manual';

  // =============================================
  // BUSINESS ADVICE
  // =============================================
  if (has(n, ['dukaan yar', 'small shop', 'dukaan ciyaar']) && has(n, ['sidee', 'maxaa', 'talo', 'isticmaal'])) return 'advice_small';
  if (has(n, ['supermarket', 'dukaan weyn', 'big shop', 'enterprise'])) return 'advice_big';
  if (has(n, ["faa'iido", 'faaido', 'profit', 'khasaare', 'loss'])) {
    if (has(n, ['sidee', 'ogaan', 'eeg', 'how', 'ogaad', 'u ogaad'])) return 'advice_profit';
  }

  // =============================================
  // KNOWLEDGE QUERIES
  // =============================================
  if (has(n, ['maxay', 'waa maxay', 'what is', 'maxuu', 'macne', 'sharax'])) return 'what_is';
  if (has(n, ['sidee', 'sideed', 'how', 'how to', 'sida', 'qaabkee', 'habka'])) return 'how_to';
  if (has(n, ['halkee', 'meesha', 'where', 'ku jiraa', 'ka hel', 'tag', 'fur', 'ii fur'])) return 'navigate';
  if (has(n, ['i bar', 'i tus', 'sharax', 'tutorial', 'teach', 'show me', 'guide', 'baro', 'barashad', 'cashar'])) return 'tutorial';
  if (has(n, ['caawin', 'help', 'caawi', 'maxaad', 'samayn kartaa', 'i caawin', 'waxaad'])) return 'help';

  // =============================================
  // SMART FALLBACK — keyword scan
  // =============================================
  // If any time word exists alone with question words → try sales
  if (has(n, [...timeToday, ...timeYesterday, ...timeWeek, ...timeMonth]) && has(n, questionWords)) {
    if (has(n, timeToday)) return 'query_sales_today';
    if (has(n, timeYesterday)) return 'query_sales_yesterday';
    if (has(n, timeWeek)) return 'query_sales_week';
    if (has(n, timeMonth)) return 'query_sales_month';
  }

  // =============================================
  // TROUBLESHOOTING — "ma shaqaynayso", "khalad", etc
  // =============================================
  for (const t of troubleshooting) {
    if (t.keywords.filter(kw => n.includes(kw)).length >= 2) return 'troubleshoot';
  }

  // FAQ matching
  for (const f of faq) {
    if (f.q.some(q => normalize(q).split(' ').filter(w => n.includes(w)).length >= 2)) return 'faq_answer';
  }

  // Accounting guides
  for (const g of accountingGuides) {
    if (g.keywords.filter(kw => n.includes(kw)).length >= 1) return 'accounting_guide';
  }

  // Glossary
  if (has(n, ['macne', 'meaning', 'waa maxay', 'micne', 'fasir'])) {
    for (const key of Object.keys(glossary)) { if (n.includes(key)) return 'glossary_lookup'; }
  }

  // Identity
  if (has(n, ['yaa tahay', 'waa kuma', 'magacaa', 'maxaad tahay', 'adigaa tahay'])) return 'identity';

  // Tips request
  if (has(n, ['talo', 'tip', 'ii sii talo', 'wax cusub', 'advice'])) return 'tip';

  // Seasonal
  if (has(n, ['ramadan', 'ciid', 'ciida', 'dugsi', 'school', 'xilli'])) return 'seasonal';

  // Industry
  if (has(n, ['supermarket', 'makhaayad', 'restaurant', 'farmashiye', 'pharmacy', 'electronics', 'dhar', 'clothing'])) {
    if (has(n, ['talo', 'sidee', 'maxaa', 'advice'])) return 'industry_advice';
  }

  // Conversational patterns fallback
  for (const cp of conversationalPatterns) {
    if (cp.pattern.some(p => n.includes(normalize(p)))) {
      if (cp.intent === 'apology') return 'apology';
      if (cp.intent === 'identity') return 'identity';
      if (cp.intent === 'tip') return 'tip';
    }
  }

  // Feature keyword fallback
  for (const f of features) { if (f.keywords.some(kw => n.includes(kw))) return 'how_to'; }
  return 'unknown';
}

// --- Feature Finder ---
function findFeature(input: string): FeatureKnowledge | null {
  const n = normalize(input);
  let best: FeatureKnowledge | null = null, bestScore = 0;
  for (const f of features) {
    let score = 0;
    for (const kw of f.keywords) { if (n.includes(kw)) score += 2; }
    if (score > bestScore) { bestScore = score; best = f; }
  }
  return bestScore > 1 ? best : null;
}

// --- Extract customer name from query ---
export function extractCustomerName(input: string): string {
  const n = normalize(input);
  // patterns: "hebal intee nagu leeyahay", "cali maxamed dayntiisa"
  const patterns = [
    /(?:macmiil|customer)\s+(.+?)(?:\s+(?:intee|meeqa|dayn|lee))/,
    /(.+?)\s+(?:intee|meeqa)\s+(?:nagu|ku)\s+(?:lee|leeyahay)/,
    /(.+?)\s+(?:dayn|deyn)/,
    /(?:daynta|lacagta)\s+(.+)/,
  ];
  for (const p of patterns) {
    const m = n.match(p);
    if (m?.[1]) return m[1].trim();
  }
  // fallback: remove common words
  const stripped = n.replace(/(?:intee|meeqa|nagu|ku|leeyahay|dayn|deyn|lacag|macmiil|customer|sidee|maxay|waa)/g, '').trim();
  return stripped.split(' ').filter(w => w.length > 2).slice(0, 2).join(' ');
}

// --- Extract product name from query ---
function extractProductName(input: string): string {
  const n = normalize(input);
  const stripped = n.replace(/(?:qiime|qiimah|price|lacag|meeqa|intee|product|alaab|stock|kayd|sidee)/g, '').trim();
  return stripped.split(' ').filter(w => w.length > 2).slice(0, 3).join(' ');
}

// --- Extract params for creating customer ---
function extractCreateCustomerParams(input: string): Record<string, string> {
  const n = normalize(input);
  const params: Record<string, string> = {};
  // Extract phone first (06XX or 07XX or +252)
  const phoneMatch = input.match(/(\+?(?:252)?0?[67]\d{7,8})/);
  if (phoneMatch) params.phone = phoneMatch[1];
  // Remove action words, entity words, and phone number to isolate name
  const cleaned = n
    .replace(/(\+?(?:252)?0?[67]\d{7,8})/g, '')  // remove phone
    .replace(/(?:ii samee|ii samayn|ii diwan|diiwan|diwan gali|geli|register|create|add|ku dar|abuur|iigu dar|ii geli|noo geli|diiwaangeli|cusub|new|customer|macmiil|macaamiil|qof|waa|ee|telefoonkiisu|telefoonkiisa|telefoon|tel|phone|gali)/g, '')
    .trim();
  // Name is whatever remains (capitalize)
  const nameWords = cleaned.replace(/\d+/g, '').trim().split(' ').filter(w => w.length > 1);
  if (nameWords.length > 0) params.name = nameWords.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return params;
}

// --- Extract params for creating employee ---
function extractCreateEmployeeParams(input: string): Record<string, string> {
  const n = normalize(input);
  const params: Record<string, string> = {};
  // Extract salary (number after $ or number)
  const salaryMatch = input.match(/\$?\s*(\d+(?:,\d+)*(?:\.\d+)?)/);
  if (salaryMatch) params.salary = salaryMatch[1].replace(/,/g, '');
  // Extract role
  const roles = ['cashier', 'manager', 'driver', 'cleaner', 'guard', 'kaashiye', 'maareeye', 'darawal', 'nadiifiye', 'ilaaliye', 'worker', 'shaqaale'];
  for (const r of roles) { if (n.includes(r)) { params.role = r.charAt(0).toUpperCase() + r.slice(1); break; } }
  if (!params.role) params.role = 'Staff';
  // Extract phone
  const phoneMatch = input.match(/(\+?(?:252)?0?[67]\d{7,8})/);
  if (phoneMatch) params.phone = phoneMatch[1];
  // Name
  const cleaned = n.replace(/(?:ii samee|ii samayn|ii diwan|diiwan|diwan gali|geli|register|cusub|new|shaqaal|shaqaale|employee|staff|cashier|manager|driver|cleaner|guard|kaashiye|maareeye|darawal|nadiifiye|ilaaliye|worker|waa|ee|\d+|\$)/g, '').trim();
  const nameWords = cleaned.split(' ').filter(w => w.length > 1 && !['bisha', 'mushaar', 'salary', 'phone', 'tel'].includes(w));
  if (nameWords.length > 0) params.name = nameWords.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return params;
}

// --- Extract params for creating product ---
function extractCreateProductParams(input: string): Record<string, string> {
  const n = normalize(input);
  const params: Record<string, string> = {};
  // Extract price
  const priceMatch = input.match(/\$?\s*(\d+(?:\.\d+)?)/);
  if (priceMatch) params.sellingPrice = priceMatch[1];
  // Extract stock
  const stockMatch = n.match(/(\d+)\s*(?:baqan|cutub|piece|pcs|tirada|stock)/);
  if (stockMatch) params.stock = stockMatch[1];
  // Name
  const cleaned = n.replace(/(?:ii samee|ku dar|geli|alaab|product|shay|cusub|new|add|create|\d+|\$|baqan|cutub|piece|pcs|tirada|stock|qiime|price)/g, '').trim();
  const nameWords = cleaned.split(' ').filter(w => w.length > 1);
  if (nameWords.length > 0) params.name = nameWords.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return params;
}

// --- Extract params for adjusting stock ---
function extractAdjustStockParams(input: string): Record<string, string> {
  const n = normalize(input);
  const params: Record<string, string> = {};
  const numMatch = n.match(/(\d+)/);
  if (numMatch) params.newStock = numMatch[1];
  const cleaned = n.replace(/(?:stock|kayd|tiro|beddel|adjust|ka dhig|geli|samee|\d+)/g, '').trim();
  const nameWords = cleaned.split(' ').filter(w => w.length > 2);
  if (nameWords.length > 0) params.productName = nameWords.join(' ');
  return params;
}

// --- Format data responses ---
export function formatSalesData(data: any): AiResponse {
  const periodLabels: Record<string, string> = { today: 'Maanta', yesterday: 'Shalay', week: 'Usbuucan', month: 'Bishan' };
  const label = periodLabels[data.period] || data.period;

  let text = `📊  ${label} — Xogta Iibka\n\n`;
  text += `┌─────────────────────────────┐\n`;
  text += `│  Dakhliga:    $${Number(data.revenue).toLocaleString()}\n`;
  text += `│  Kharashka:   $${Number(data.cost).toLocaleString()}\n`;
  text += `│  Faa'iidada:  $${Number(data.profit).toLocaleString()}\n`;
  text += `│  Canshuurta:  $${Number(data.tax).toLocaleString()}\n`;
  text += `│  Iibiyaasha:  ${data.count}\n`;
  text += `└─────────────────────────────┘\n`;

  if (data.topProducts?.length > 0) {
    text += `\n🏆  Alaabta Ugu Badan Iibka:\n`;
    data.topProducts.forEach((p: any, i: number) => {
      text += `  ${i + 1}. ${p.name} — ${p.qty} cutub ($${Number(p.revenue).toLocaleString()})\n`;
    });
  }

  return {
    text,
    links: [{ label: 'Taariikhda Iibka — Faahfaahin', href: '/shop/sales' }, { label: 'Warbixinta — Reports', href: '/shop/reports' }],
    quickActions: ['Shalay iibkii?', 'Usbuucan iibkii?', 'Alaabta dhamaanaysa?']
  };
}

export function formatCustomerData(data: any[]): AiResponse {
  if (!data || data.length === 0) {
    return { text: '❌  Macmiilkaas lama helin. Fadlan magaca si sax ah u qor.\n\nTusaale: "Cali Maxamed intee nagu leeyahay?"', quickActions: ['Macaamiisha arag', 'Caawin'] };
  }

  let text = `👥  Xogta Macmiilka:\n\n`;
  data.forEach((c: any) => {
    text += `┌─────────────────────────────┐\n`;
    text += `│  📛 ${c.name}\n`;
    text += `│  📱 ${c.phone || 'Telefoon lama gelin'}\n`;
    text += `│  💰 Iibka guud: $${Number(c.totalSales).toLocaleString()}\n`;
    text += `│  ✅ La bixiyay: $${Number(c.totalPaid).toLocaleString()}\n`;
    text += `│  🔴 Daynta: $${Number(c.debt).toLocaleString()}\n`;
    text += `└─────────────────────────────┘\n`;
  });

  return {
    text,
    links: [{ label: 'Macaamiisha — Dhamaan Arag', href: '/shop/customers' }],
    quickActions: ['Maanta iibkii?', 'Alaabta dhamaanaysa?']
  };
}

export function formatLowStock(data: any[]): AiResponse {
  if (!data || data.length === 0) {
    return { text: '✅  Dhammaan alaabtu kaydka waa ku filan yihiin! Wax dhamaanaya ma jiraan.', quickActions: ['Maanta iibkii?', 'Kaydka guud'] };
  }
  let text = `⚠️  Alaabta Dhamaanaysa (${data.length}):\n\n`;
  data.forEach((p: any, i: number) => {
    const icon = p.stock === 0 ? '🔴' : p.stock <= 2 ? '🟠' : '🟡';
    text += `${icon} ${i + 1}. **${p.name}** — ${p.stock} baqan (min: ${p.minStock})\n    Qaybta: ${p.category} | Qiimaha: $${p.sellingPrice}\n`;
  });
  text += `\n💡 Degdeg u dalbo alaabta kore si aadan iib uga dhumin!`;
  return {
    text,
    links: [{ label: 'Kaydka — Inventory', href: '/shop/inventory' }, { label: 'Alaab Dalbo — Purchases', href: '/shop/purchases' }],
    quickActions: ['Kaydka guud eeg', 'Maanta iibkii?']
  };
}

export function formatInventoryOverview(data: any): AiResponse {
  let text = `📦  Kaydka Alaabta — Guudmar\n\n`;
  text += `┌─────────────────────────────┐\n`;
  text += `│  Alaab guud:     ${data.total}\n`;
  text += `│  Qiimaha guud:   $${Number(data.totalValue).toLocaleString()}\n`;
  text += `│  Kharashka guud: $${Number(data.totalCost).toLocaleString()}\n`;
  text += `│  Faa'iido suurta: $${Number(data.potentialProfit).toLocaleString()}\n`;
  text += `│  Qaybaha:        ${data.categories?.length || 0}\n`;
  text += `│  ⚠️ Kayd hoose:   ${data.lowStock}\n`;
  text += `│  🔴 Dhammaatay:   ${data.outOfStock}\n`;
  text += `└─────────────────────────────┘`;
  return {
    text,
    links: [{ label: 'Inventory — Faahfaahin', href: '/shop/inventory' }],
    quickActions: ['Alaabta dhamaanaysa?', 'Maanta iibkii?']
  };
}

export function formatEmployees(data: any): AiResponse {
  let text = `👷  Shaqaalaha — Guudmar\n\n`;
  text += `Shaqaale firfircoon: ${data.activeCount}\n`;
  text += `Mushaharka guud: $${Number(data.totalPayroll).toLocaleString()}/bisha\n\n`;
  data.employees?.forEach((e: any) => {
    const status = e.isActive ? '🟢' : '🔴';
    text += `${status} **${e.name}** — ${e.role || 'N/A'} | $${e.salary || 0}/bisha\n`;
  });
  return {
    text,
    links: [{ label: 'Shaqaalaha — Faahfaahin', href: '/shop/employees' }, { label: 'Mushaharka Bixi', href: '/shop/payroll' }],
    quickActions: ['Mushaharka guud?', 'Maanta iibkii?']
  };
}

export function formatAccounts(data: any): AiResponse {
  let text = `🏦  Xisaabaadka — Guudmar\n\n`;
  text += `Haraaga guud: **$${Number(data.totalBalance).toLocaleString()}**\n\n`;
  data.accounts?.forEach((a: any) => {
    const icon = a.type === 'Cash' ? '💵' : a.type === 'Bank' ? '🏦' : '📱';
    text += `${icon} **${a.name}** (${a.type}): $${Number(a.balance).toLocaleString()}\n`;
  });
  return {
    text,
    links: [{ label: 'Xisaabaadka — Faahfaahin', href: '/shop/accounting' }],
    quickActions: ['Maanta iibkii?', 'Xaaladda dukaanka?']
  };
}

export function formatSummary(data: any): AiResponse {
  let text = `🏪  Xaaladda Dukaanka — Guudmar\n\n`;
  text += `📊 **Iibka Maanta:**\n   $${Number(data.todaySales?.total || 0).toLocaleString()} (${data.todaySales?.count || 0} iibiyaash)\n\n`;
  text += `📈 **Usbuucan:**\n   $${Number(data.weekSales?.total || 0).toLocaleString()} (${data.weekSales?.count || 0} iibiyaash)\n\n`;
  text += `📦 **Alaabta:** ${data.products} alaab`;
  if (data.lowStock > 0) text += ` | ⚠️ ${data.lowStock} kayd hoose`;
  text += `\n👥 **Macaamiisha:** ${data.customers}\n`;
  text += `👷 **Shaqaalaha:** ${data.employees}\n\n`;

  if (data.accounts?.length > 0) {
    text += `🏦 **Xisaabaadka:**\n`;
    data.accounts.forEach((a: any) => { text += `   ${a.name}: $${Number(a.balance).toLocaleString()}\n`; });
  }

  return {
    text,
    links: [{ label: 'Dashboard', href: '/shop/dashboard' }],
    quickActions: ['Shalay iibkii?', 'Alaabta dhamaanaysa?', 'Shaqaalaha liiska']
  };
}

// --- WRITE ACTION FORMATTERS ---
export function formatCreateResult(queryType: string, data: any, error?: string): AiResponse {
  if (error === 'duplicate') {
    return { text: `⚠️ Macmiilkan horey buu u jiray!\n\n📛 Magaca: **${data?.name}**\n📞 Phone: ${data?.phone || 'La ma gelin'}\n\nMacmiil cusub kale geli ama liiska macaamiisha eeg.`, links: [{ label: 'Macaamiisha — Eeg', href: '/shop/customers' }], quickActions: ['Macaamiisha arag', 'Maanta iibkii?'] };
  }
  if (error === 'not_found') {
    return { text: '❌ Alaabta magacaas leh ma aanan helin. Magaca saxda ah ku qor.', quickActions: ['Kaydka eeg', 'Caawin'] };
  }
  if (error) {
    return { text: `❌ Waa la waayay: ${error}`, quickActions: ['Caawin', 'Isku day mar kale'] };
  }

  switch (queryType) {
    case 'create_customer':
      return { text: `✅ Macmiil cusub la sameeyay!\n\n📛 Magaca: **${data.name}**\n📞 Phone: ${data.phone || '-'}\n📁 Nooca: ${data.type}\n\nHadda waxaad ku iibsan kartaa POS ama Manual Entry.`, links: [{ label: 'Macaamiisha — Eeg', href: '/shop/customers' }], quickActions: ['Maanta iibkii?', 'Macmiil kale geli'] };
    case 'create_employee':
      return { text: `✅ Shaqaale cusub la diiwaangeliyay!\n\n👤 Magaca: **${data.name}**\n💼 Shaqada: ${data.role}\n💰 Mushaharka: $${Number(data.salary || 0).toLocaleString()}/bisha\n\nShaqaalahan hadda waa firfircoon!`, links: [{ label: 'Employees — Eeg', href: '/shop/employees' }], quickActions: ['Shaqaalaha liiska', 'Caawin'] };
    case 'create_product':
      return { text: `✅ Alaab cusub la geliyed!\n\n📦 Magaca: **${data.name}**\n💰 Qiimaha: $${Number(data.price || 0).toLocaleString()}\n📊 Stock: ${data.stock || 0}\n\nHadda POS-ka ama Manual Entry-da ka iibi kartaa.`, links: [{ label: 'Inventory — Eeg', href: '/shop/inventory' }], quickActions: ['Kaydka eeg', 'Alaab kale ku dar'] };
    case 'adjust_stock':
      return { text: `✅ Stock-ka la beddelay!\n\n📦 **${data.name}**\n📉 Hore: ${data.oldStock}\n📈 Hadda: ${data.newStock}\n\nIsbeddelka waa la diiwaangeliyay.`, links: [{ label: 'Inventory', href: '/shop/inventory' }], quickActions: ['Kaydka eeg', 'Alaabta dhamaanaysa?'] };
    default:
      return { text: '✅ Waa la sameeyay!', quickActions: ['Caawin'] };
  }
}

export function formatProductSearch(data: any[]): AiResponse {
  if (!data?.length) return { text: '❌ Alaabta magacaas leh ma aanan helin.', quickActions: ['Kaydka eeg', 'Caawin'] };
  let text = `🔍 Natiijooyinka Raadinta:\n\n`;
  data.forEach((p: any, i: number) => {
    text += `${i + 1}. **${p.name}**\n   💰 Qiimaha: $${Number(p.sellingPrice).toLocaleString()} | Cost: $${Number(p.costPrice).toLocaleString()}\n   📦 Stock: ${p.stock} | ${p.status}\n\n`;
  });
  return { text, links: [{ label: 'Inventory', href: '/shop/inventory' }], quickActions: ['Alaab kale raadi', 'Maanta iibkii?'] };
}

export function formatTopCustomers(data: any[]): AiResponse {
  if (!data?.length) return { text: '📋 Macaamiil iib leh ma jiraan weli.', quickActions: ['Caawin'] };
  let text = `🏆 Top 10 Macaamiisha Ugu Badan Iibka:\n\n`;
  data.forEach((c: any, i: number) => {
    text += `${i + 1}. **${c.name}** — $${Number(c.totalSales).toLocaleString()} (${c.saleCount} iib)\n`;
    if (c.totalSales - c.totalPaid > 0) text += `   ⚠️ Dayn: $${Number(c.totalSales - c.totalPaid).toLocaleString()}\n`;
  });
  return { text, links: [{ label: 'Customers', href: '/shop/customers' }], quickActions: ['Macaamiisha arag', 'Maanta iibkii?'] };
}

export function formatExpenses(data: any): AiResponse {
  let text = `💸 Kharashyada Bishan:\n\n`;
  text += `📊 **Wadarta:** $${Number(data.total || 0).toLocaleString()}\n\n`;
  if (data.byCategory && Object.keys(data.byCategory).length > 0) {
    text += `📋 **Category-yada:**\n`;
    Object.entries(data.byCategory).forEach(([cat, amount]: any) => {
      text += `   • ${cat}: $${Number(amount).toLocaleString()}\n`;
    });
  }
  if (data.recent?.length > 0) {
    text += `\n📝 **Kuwa Ugu Dambeeyay:**\n`;
    data.recent.slice(0, 5).forEach((e: any) => {
      text += `   • ${e.description || e.category || 'Kharash'}: $${Number(e.amount).toLocaleString()}\n`;
    });
  }
  return { text, links: [{ label: 'Accounting', href: '/shop/accounting' }], quickActions: ['Maanta iibkii?', 'Xaaladda dukaanka?'] };
}


// --- STATIC RESPONSE BUILDERS ---
function buildGreeting(): AiResponse { return greetings[getTimeOfDay()] || greetings.default; }
function buildFarewell(): AiResponse { return { text: farewells[Math.floor(Math.random() * farewells.length)] }; }
function buildThanks(): AiResponse { return { text: thanks[Math.floor(Math.random() * thanks.length)], quickActions: ['Sidee baan iib u sameeyaa?', 'Maxay tahay POS?', 'I bar kaydka'] }; }

function buildHelp(): AiResponse {
  return {
    text: "Waxaan kugu caawin karaa wax badan!\n\n📊  Xogta Dukaanka:\n  \"Maanta iibkii siduu ahaa?\"\n  \"Shalay meeqa la iibiyay?\"\n  \"Hebal intee nagu leeyahay?\"\n  \"Alaabta dhamaanaysa?\"\n  \"Shaqaalaha meeqa?\"\n  \"Xaaladda dukaanka?\"\n\n📚  Barashada:\n  \"Sidee baan iib u sameeyaa?\"\n  \"Maxay tahay POS?\"\n  \"I bar kaydka\"\n\n💡  Talo Ganacsiyeed:\n  \"POS mise Manual Entry?\"\n  \"Talo dukaan yar\"\n  \"Sidee faa'iido u ogaadaa?\"\n\nSu'aal kasta i weydii!",
    quickActions: ['Maanta iibkii?', 'Xaaladda dukaanka?', 'Sidee baan bilaabaa?', 'Alaabta dhamaanaysa?']
  };
}

function buildWhatIs(input: string): AiResponse {
  const f = findFeature(input);
  if (f) return { text: `📖  **${f.name}**\n\n${f.description}\n\n👤 **Yaa isticmaala:** ${f.whoShouldUse}`, links: [{ label: `${f.name} fur`, href: f.href }], quickActions: [`Sidee ${f.name} loo isticmaalaa?`, 'Wax kale i bar'] };
  return { text: "Ma garanayo waxa aad ka hadlayso. Fadlan si kale u dhig.\n\nTusaale: \"Maxay tahay POS?\" ama \"Maxay tahay inventory?\"", quickActions: ['Maxay tahay POS?', 'Maxay tahay inventory?', 'Caawin'] };
}

function buildHowTo(input: string): AiResponse {
  const f = findFeature(input);
  if (f) return { text: `🎯  **Sida loo isticmaalo ${f.name}:**\n\n${f.steps.join('\n')}\n\n💡  **Talooyin:**\n${f.tips.join('\n')}`, links: [{ label: `${f.name} — Tag`, href: f.href }], quickActions: ['Wax kale i bar'] };
  return buildHelp();
}

function buildNavigate(input: string): AiResponse {
  const f = findFeature(input);
  if (f) return { text: `📍  **${f.name}** — sidebar-ka (menu-ga bidixda) ka dooro.`, links: [{ label: `${f.name} — Tag`, href: f.href }], quickActions: [`I bar ${f.name}`] };
  return { text: "Sidebar-ka waxaad ka heli kartaa dhammaan qaybaha.", quickActions: ['Tag POS', 'Tag Inventory', 'Tag Reports'] };
}

function buildTutorial(input: string): AiResponse {
  const f = findFeature(input);
  if (f) return { text: `📚  **Cashar: ${f.name}**\n\n${f.description}\n\n🪜 **Tallaabooyinka:**\n${f.steps.join('\n')}\n\n${f.tips.join('\n')}`, links: [{ label: `${f.name} — Bilow!`, href: f.href }], quickActions: ['Casharka xiga', 'Caawin'] };
  return buildHelp();
}

function buildComparePosManual(): AiResponse {
  return { text: "⚖️  **POS vs Manual Entry:**\n\n🛒 **POS:**\n  Cashier degdeg ah, barcode, alaab system-ka ku jirto\n  Ku haboon: Supermarket, dukaan weyn\n\n📝 **Manual Entry:**\n  Rasiid geli, sahlan, uma baahnid alaab system-ka\n  Ku haboon: Dukaan yar, rasiid gacmeed\n\n🎯 Dukaan yar → Manual Entry\n🎯 Supermarket → POS\n\nLabadaba waa la isticmaali karaa!", links: [{ label: 'POS', href: '/shop/pos' }, { label: 'Manual Entry', href: '/shop/manual-entry' }], quickActions: ['I bar POS', 'I bar Manual Entry'] };
}

function buildActionNavigate(input: string): AiResponse {
  const n = normalize(input);

  // Detect what entity they want to create/register
  if (has(n, ['customer', 'macmiil', 'macaamiil', 'qof'])) {
    // Extract potential name from input
    const nameMatch = n.replace(/(?:waa|cusub|new|customer|macmiil|ee|ii|diwan|gali|geli|register|samee|samayn|iigu|ku dar)/g, '').trim();
    const extractedName = nameMatch.split(' ').filter(w => w.length > 2).join(' ');
    let text = `✅  Macmiil cusub — waan kugu caawin karaa!\n\n`;
    if (extractedName) {
      text += `Magaca: **${extractedName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}**\n\n`;
    }
    text += `Tallaabooyinka:\n1. Guji button-ka hoose si aad Customers page-ka u tagto\n2. Guji "Add Customer"\n3. Buuxi: Magaca, Telefoonka, Nooca\n4. Save guji ✅\n\nAma adigaa toos ugu tagi kara:`;
    return {
      text,
      links: [{ label: 'Customers — Macmiil Cusub Ku Dar', href: '/shop/customers' }],
      quickActions: ['Macaamiisha arag', 'Maanta iibkii?']
    };
  }

  if (has(n, ['shaqaal', 'employee', 'staff'])) {
    return {
      text: `✅  Shaqaale cusub — tallaabooyinka:\n\n1. Tag Employees page-ka\n2. Guji "Add Employee"\n3. Buuxi: Magaca, Shaqada, Mushaharka, Telefoonka\n4. Save ✅`,
      links: [{ label: 'Employees — Shaqaale Cusub', href: '/shop/employees' }],
      quickActions: ['Shaqaalaha liiska', 'Caawin']
    };
  }

  if (has(n, ['alaab', 'product', 'shay'])) {
    return {
      text: `✅  Alaab cusub ku dar — tallaabooyinka:\n\n1. Tag Inventory page-ka\n2. Guji "Add Product"\n3. Buuxi: Magaca, Qiimaha Iibsashada, Qiimaha Gadashada, Tirada, Category\n4. Save ✅`,
      links: [{ label: 'Inventory — Alaab Cusub', href: '/shop/inventory' }],
      quickActions: ['Kaydka eeg', 'Caawin']
    };
  }

  if (has(n, ['vendor', 'jumla', 'bixiye'])) {
    return {
      text: `✅  Vendor/Bixiye cusub — tallaabooyinka:\n\n1. Tag Vendors page-ka\n2. Guji "Add Vendor"\n3. Buuxi: Magaca, Telefoonka, Nooca\n4. Save ✅`,
      links: [{ label: 'Vendors — Bixiye Cusub', href: '/shop/vendors' }],
      quickActions: ['Vendors eeg', 'Caawin']
    };
  }

  // Generic action
  return {
    text: `Waxaad samayn kartaa wax badan! Maxaad rabto inaad samayso?\n\n• Macmiil cusub ku dar\n• Shaqaale cusub diiwaangeli\n• Alaab cusub ku dar\n• Vendor cusub ku dar`,
    quickActions: ['Macmiil cusub', 'Shaqaale cusub', 'Alaab cusub', 'Vendor cusub']
  };
}

function buildUnknown(input: string): AiResponse {
  const f = findFeature(input);
  if (f) return { text: `Ma waxaad ka hadlaysaa **${f.name}**?\n\n${f.description}`, links: [{ label: f.name, href: f.href }], quickActions: [`Haa, ${f.name}`, 'Caawin'] };
  return { text: "Su'aashaada uma garanayo. Isku day:\n  \"Maanta iibkii?\"\n  \"Sidee baan iib u sameeyaa?\"\n  \"Alaabta dhamaanaysa?\"\n\nAma dhig \"caawin\".", quickActions: ['Caawin', 'Maanta iibkii?', 'Xaaladda dukaanka?'] };
}

// --- NEW HANDLERS (v3) ---
function buildTroubleshoot(input: string): AiResponse {
  const n = normalize(input);
  for (const t of troubleshooting) {
    if (t.keywords.filter(kw => n.includes(kw)).length >= 2) {
      return { text: `🔧 **${t.problem}**\n\n${t.solution}`, quickActions: ['Caawin', 'Xaaladda dukaanka?'] };
    }
  }
  return { text: '🔧 Dhibaatada si fiican u sharrax si aan kuu caawiyo.\n\nTusaale: "Printer-ka rasiidka ma daabicayo" ama "System-ku waa gaabis"', quickActions: ['Caawin'] };
}

function buildFaqAnswer(input: string): AiResponse {
  const n = normalize(input);
  for (const f of faq) {
    if (f.q.some(q => normalize(q).split(' ').filter(w => n.includes(w)).length >= 2)) {
      return { text: f.a, links: f.links, quickActions: ['Wax kale?', 'Caawin'] };
    }
  }
  return buildHelp();
}

function buildIdentity(): AiResponse {
  return {
    text: 'Anigu waxaan ahay **Revlo AI** — khabiirka dukaankaaga!\n\nWaxaan ku caawin karaa:\n• 📊 Xogta dukaanka (iibka, faa\'iidada, kaydka)\n• 📚 Barashada nidaamka\n• 💡 Talo ganacsiyeed\n• 🔧 Dhibaato xallinta\n• 👥 Macaamiisha, shaqaalaha, xisaabaadka\n\n10,000+ su\'aalood ayaan jawaabi karaa!',
    quickActions: ['Maxaad samayn kartaa?', 'Maanta iibkii?', 'Talo ii sii']
  };
}

function buildTip(): AiResponse {
  const tip = businessTips[Math.floor(Math.random() * businessTips.length)];
  return { text: `🎯 **Talada Maanta:**\n\n${tip}`, quickActions: ['Talo kale', 'Maanta iibkii?', 'Caawin'] };
}

function buildApology(): AiResponse {
  return {
    text: 'Waan ka xumahay! Fadlan si kale u dhig su\'aashaada.\n\nAniga si fiican waxaan u garanayaa:\n• Xogta dukaanka — "Maanta iibkii?"\n• Barashada — "Sidee baan iib u sameeyaa?"\n• Talo — "Talo dukaan yar"\n\nAma dhig "caawin" liiska buuxa.',
    quickActions: ['Caawin', 'Maanta iibkii?', 'Talo ii sii']
  };
}

function buildIndustryAdvice(input: string): AiResponse {
  const n = normalize(input);
  const industries: Record<string, string> = { supermarket: 'supermarket', makhaayad: 'restaurant', restaurant: 'restaurant', farmashiye: 'pharmacy', pharmacy: 'pharmacy', electronics: 'electronics', dhar: 'clothing', clothing: 'clothing' };
  for (const [keyword, key] of Object.entries(industries)) {
    if (n.includes(keyword) && industryAdvice[key]) {
      const advice = industryAdvice[key];
      let text = `🏪 **${advice.description}**\n\n📋 **Talooyin:**\n${advice.tips.map((t, i) => `${i + 1}. ${t}`).join('\n')}\n\n⭐ **Features-ka loo baahan yahay:** ${advice.recommendedFeatures.join(', ')}`;
      return { text, quickActions: ['Talo kale', 'Xaaladda dukaanka?'] };
    }
  }
  return { text: 'Nooca dukaankaaga ii sheeg (supermarket, makhaayad, farmashiye, electronics, dhar) si aan talo gaar ah kuu siiyo.', quickActions: ['Supermarket talo', 'Makhaayad talo', 'Farmashiye talo'] };
}

function buildAccountingGuide(input: string): AiResponse {
  const n = normalize(input);
  for (const g of accountingGuides) {
    if (g.keywords.some(kw => n.includes(kw))) {
      return { text: `📒 **${g.title}**\n\n${g.content}`, links: [{ label: 'Reports', href: '/shop/reports' }, { label: 'Accounting', href: '/shop/accounting' }], quickActions: ['Wax kale?', 'Maanta iibkii?'] };
    }
  }
  return buildHelp();
}

function buildGlossaryLookup(input: string): AiResponse {
  const n = normalize(input);
  for (const [term, definition] of Object.entries(glossary)) {
    if (n.includes(term)) {
      return { text: `📖 **${term.charAt(0).toUpperCase() + term.slice(1)}**\n\n${definition}`, quickActions: ['Erey kale?', 'Caawin'] };
    }
  }
  return { text: '📖 Ereyga aad ka hadlayso ma hayo. Isku day: "dakhli macnehiisa", "kayd macnehiisa"', quickActions: ['Caawin'] };
}

function buildSeasonal(input: string): AiResponse {
  const n = normalize(input);
  if (has(n, ['ramadan', 'ramadaan'])) return { text: seasonalAdvice.ramadan, quickActions: ['Talo kale', 'Maanta iibkii?'] };
  if (has(n, ['ciid', 'ciida'])) return { text: seasonalAdvice.ciid, quickActions: ['Talo kale', 'Maanta iibkii?'] };
  if (has(n, ['dugsi', 'school'])) return { text: seasonalAdvice.dugsi, quickActions: ['Talo kale', 'Maanta iibkii?'] };
  return { text: 'Xilli kee ah aad ka hadlaysaa? (Ramadan, Ciida, Xilliga Dugsiga)', quickActions: ['Ramadan talo', 'Ciid talo', 'Dugsi talo'] };
}

// ============================================================
// MAIN PROCESS
// ============================================================
export function processMessage(input: string, userName?: string): AiResult {
  if (!input?.trim()) return { response: buildHelp() };

  const intent = detectIntent(input);

  // Data queries → need API call
  const dataQueries: Record<string, DataQueryType> = {
    query_sales_today: 'sales_today', query_sales_yesterday: 'sales_yesterday',
    query_sales_week: 'sales_week', query_sales_month: 'sales_month',
    query_customer: 'customer_search', query_low_stock: 'low_stock',
    query_inventory: 'inventory_overview', query_employees: 'employees_list',
    query_accounts: 'accounts_overview', query_summary: 'summary',
    query_product: 'product_search', query_top_customers: 'top_customers',
    query_expenses: 'expenses_overview',
    action_create_customer: 'create_customer', action_create_employee: 'create_employee',
    action_create_product: 'create_product', action_adjust_stock: 'adjust_stock',
  };

  if (intent in dataQueries) {
    const queryParams: Record<string, string> = {};
    if (intent === 'query_customer') queryParams.name = extractCustomerName(input);
    if (intent === 'query_product') queryParams.productName = extractProductName(input);
    if (intent === 'action_create_customer') Object.assign(queryParams, extractCreateCustomerParams(input));
    if (intent === 'action_create_employee') Object.assign(queryParams, extractCreateEmployeeParams(input));
    if (intent === 'action_create_product') Object.assign(queryParams, extractCreateProductParams(input));
    if (intent === 'action_adjust_stock') Object.assign(queryParams, extractAdjustStockParams(input));
    return {
      response: { text: intent.startsWith('action_') ? '⏳ Waan samaynayaa...' : '⏳ Waan raadiyaa xogta...', quickActions: [] },
      dataQuery: dataQueries[intent]!,
      queryParams,
    };
  }

  // Static responses
  const handlers: Record<string, () => AiResponse> = {
    greeting: buildGreeting, farewell: buildFarewell, thanks: buildThanks, help: buildHelp,
    what_is: () => buildWhatIs(input), how_to: () => buildHowTo(input),
    navigate: () => buildNavigate(input), tutorial: () => buildTutorial(input),
    advice_small: () => businessAdvice.dukaan_yar, advice_big: () => businessAdvice.supermarket,
    advice_profit: () => businessAdvice.faa_iido, compare_pos_manual: buildComparePosManual,
    action_navigate: () => buildActionNavigate(input),
    troubleshoot: () => buildTroubleshoot(input),
    faq_answer: () => buildFaqAnswer(input),
    identity: buildIdentity,
    tip: buildTip,
    apology: buildApology,
    industry_advice: () => buildIndustryAdvice(input),
    accounting_guide: () => buildAccountingGuide(input),
    glossary_lookup: () => buildGlossaryLookup(input),
    seasonal: () => buildSeasonal(input),
    unknown: () => buildUnknown(input),
  };

  return { response: (handlers[intent] || handlers.unknown)() };
}

export function getWelcomeMessage(userName?: string): AiResponse {
  const time = getTimeOfDay();
  const name = userName ? ` ${userName}` : '';
  const greet = time === 'subax' ? 'Subax wanaagsan' : time === 'galab' ? 'Galab wanaagsan' : 'Habeen wanaagsan';
  return {
    text: `${greet}${name}!\n\nAnigu waxaan ahay **Revlo AI** — khabiirka dukaankaaga.\n\nWaxaan si qoto dheer u aqoonsanahay nidaamka oo dhan.\nXogta dhab ah ayaan kuu soo saari karaa — iibka, kaydka, macaamiisha, iyo wax badan.\n\nMaxaad jeclaanaysaa?`,
    quickActions: ['Maanta iibkii?', 'Xaaladda dukaanka?', 'Alaabta dhamaanaysa?', 'Sidee baan bilaabaa?']
  };
}
