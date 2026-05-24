// Synonym Expansion System — turns 100 rules into 10,000+ effective matches
// Each key maps to all its synonyms/variations in Somali + English

export const synonyms: Record<string, string[]> = {
  // === ACTIONS ===
  iib: ['iib', 'iibi', 'iibso', 'iibiye', 'iibiyay', 'iibkii', 'iibinta', 'gadid', 'gadday', 'gad', 'gadashada', 'sell', 'sale', 'sold', 'selling', 'checkout', 'lacag qaadashada'],
  samee: ['samee', 'samayn', 'samayso', 'ii samee', 'noo samee', 'abuur', 'fur', 'bilow', 'create', 'make', 'add', 'new', 'open', 'start'],
  tir: ['tir', 'tiri', 'tiriso', 'tirinta', 'xisaabi', 'count', 'calculate', 'compute'],
  eeg: ['eeg', 'arag', 'fiiri', 'daawo', 'tus', 'i tus', 'ii tus', 'muuji', 'view', 'show', 'see', 'look', 'check', 'display'],
  beddel: ['beddel', 'beddelid', 'wax ka beddel', 'update', 'edit', 'change', 'modify', 'adjust', 'saxo'],
  tirtir: ['tirtir', 'ka tirtir', 'iska tir', 'delete', 'remove', 'ka saar'],
  raadi: ['raadi', 'ka raadi', 'hel', 'ka hel', 'search', 'find', 'look up', 'baadh', 'dooro'],
  geli: ['geli', 'ku geli', 'gali', 'ku dar', 'ku qor', 'enter', 'input', 'register', 'diwan gali', 'diiwan gali', 'diiwaangeli', 'diwaangeli'],
  bixi: ['bixi', 'bixin', 'la bixi', 'lacag bixi', 'mushahar bixi', 'pay', 'payment', 'spend'],
  keydso: ['keydso', 'keydi', 'save', 'store', 'xifdi', 'kaydi'],
  'soo daji': ['soo daji', 'download', 'export', 'soo deji', 'soo rar'],
  daabac: ['daabac', 'daabici', 'print', 'soo daabac', 'rasiid daabac'],
  dir: ['dir', 'u dir', 'soo dir', 'send', 'forward', 'share'],

  // === ENTITIES ===
  macmiil: ['macmiil', 'macaamiil', 'macaamiisha', 'customer', 'customers', 'client', 'clients', 'qof', 'dadka', 'iibsade', 'qofka'],
  alaab: ['alaab', 'alaabta', 'product', 'products', 'shay', 'shayga', 'badeeco', 'badeecada', 'item', 'items', 'merchandise', 'waxyaalo', 'wax'],
  shaqaale: ['shaqaale', 'shaqaalaha', 'employee', 'employees', 'staff', 'workers', 'qofka shaqeeya', 'hawl wadeenka'],
  vendor: ['vendor', 'vendors', 'jumla', 'jumladda', 'bixiye', 'bixiyaha', 'dukaan jumla', 'supplier', 'suppliers', 'wholesaler'],
  mushaar: ['mushaar', 'mushaharka', 'salary', 'payroll', 'lacag bil', 'lacag bisha', 'wage', 'wages', 'compensation'],
  xisaab: ['xisaab', 'xisaabaad', 'xisaabaadka', 'account', 'accounts', 'accounting', 'bangiga', 'bank', 'lacag', 'maaliyad'],
  rasiid: ['rasiid', 'rasiidka', 'receipt', 'invoice', 'bill', 'waraaqda', 'invoice number'],
  kayd: ['kayd', 'kaydka', 'inventory', 'stock', 'warehouse', 'bakhaarka', 'makhaasin'],
  dayn: ['dayn', 'daynta', 'deyn', 'deynta', 'debt', 'credit', 'amaano', 'lacag la leeyahay', 'wax la leeyahay'],
  canshuur: ['canshuur', 'canshuurta', 'tax', 'taxes', 'vat', 'cashuur', 'cashuura'],
  lacag: ['lacag', 'lacagta', 'money', 'cash', 'funds', 'maalgelin', 'dhaqaale'],

  // === TIME ===
  maanta: ['maanta', 'maalintaan', 'today', 'hadda', 'imminka', 'xiligan', 'saacadahan'],
  shalay: ['shalay', 'xalay', 'yesterday', 'berri hore', 'maalintii hore'],
  usbuuc: ['usbuuc', 'usbuucan', 'isbuuc', 'isbuucan', 'week', 'this week', 'toddobaad', 'toddobaadkan', '7 maalmood'],
  bisha: ['bisha', 'bishan', 'bishaan', 'month', 'this month', '30 maalmood', 'bilahan'],
  sannad: ['sannad', 'sannadkan', 'year', 'this year', 'sanadka'],
  subax: ['subax', 'subaxdii', 'morning', 'aroor'],
  galabta: ['galabta', 'galab', 'afternoon', 'duhur'],
  habeenka: ['habeenka', 'habeen', 'evening', 'night', 'fiid', 'fiidkii'],

  // === QUESTIONS ===
  meeqa: ['meeqa', 'intee', 'imisa', 'how much', 'how many', 'total', 'tirada', 'qaddarka', 'cadadka'],
  sidee: ['sidee', 'sideed', 'sida', 'qaabkee', 'habka', 'how', 'how to', 'in what way'],
  maxay: ['maxay', 'maxaa', 'maxuu', 'waa maxay', 'what', 'what is', 'which'],
  goorma: ['goorma', 'goormee', 'when', 'waqtiga', 'taariikhda', 'xiliga'],
  halkee: ['halkee', 'xaggee', 'meesha', 'where', 'which place'],
  yaa: ['yaa', 'kumaa', 'qofkee', 'who', 'which person'],

  // === DESCRIPTORS ===
  cusub: ['cusub', 'new', 'fresh', 'hadda', 'dhawaan'],
  hore: ['hore', 'old', 'previous', 'former', 'markii hore'],
  badan: ['badan', 'many', 'much', 'lots', 'tiro badan', 'aad u badan', 'xad dhaaf'],
  yar: ['yar', 'few', 'small', 'little', 'wax yar', 'tiro yar', 'iska yar'],
  dhameystiran: ['dhameystiran', 'dhamays', 'complete', 'full', 'total', 'buuxda'],
  fiican: ['fiican', 'wanaagsan', 'good', 'great', 'excellent', 'ugu fiican'],
  xun: ['xun', 'bad', 'poor', 'liita', 'xumayd'],

  // === PROFIT/LOSS ===
  faaido: ["faa'iido", 'faaido', 'faaiido', 'profit', 'margin', 'kasb', 'kasbanay', 'kasbatay', 'faa iiday', 'faaiiday', 'dakhli nadiif', 'net income', 'earnings'],
  khasaare: ['khasaare', 'khasaaraha', 'loss', 'losses', 'deficit', 'lacag dhimay', 'dhicitaan'],
  dakhli: ['dakhli', 'dakhliga', 'revenue', 'income', 'soo gal', 'soo galka', 'total revenue', 'gross income'],
  kharash: ['kharash', 'kharashka', 'expense', 'expenses', 'cost', 'costs', 'lacag baxday', 'wax bixin'],

  // === STATUS ===
  shaqeynaya: ['shaqeynaya', 'firfircoon', 'active', 'online', 'working', 'running', 'socda'],
  joojin: ['joojin', 'jooji', 'stop', 'pause', 'inactive', 'disabled', 'hakad', 'xidh'],
  dhammaatay: ['dhammaatay', 'dhamaaday', 'finished', 'completed', 'done', 'ended', 'la dhammeeyay'],
  socda: ['socda', 'soconaya', 'ongoing', 'in progress', 'pending', 'dhexda', 'sugitaanka'],
};

// Expanded conversation patterns — common Somali phrases the AI should understand
export const conversationalPatterns: { pattern: string[]; intent: string; response: string }[] = [
  // GRATITUDE RESPONSES
  { pattern: ['aad ayaad u fiican tahay', 'adigaa fiican', 'waa ku mahadsantahay', 'aad baad ii caawinaysay'], intent: 'thanks', response: 'Adigaa mudan! Waxaan halkan u joogaa inaan ku caawiyo. Su\'aal kasta i weydii!' },

  // CONFUSION
  { pattern: ['ma fahmin', 'ma garanayo', 'maxaa la yidhi', 'i sharax', 'dib iigu sharax', 'mar kale ii sheeg'], intent: 'help', response: 'Waan kaa caawin karaa! Maxaad rabto inaad ogaato? Tusaale:\n• "Sidee baan iib u sameeyaa?"\n• "Maanta iibkii?"\n• "Alaabta dhamaanaysa?"' },

  // COMPLIMENTS
  { pattern: ['waa fiicantahay', 'aad baad u caqli badan tahay', 'waad mahadsantahay caawintaada'], intent: 'thanks', response: 'Waad ku mahadsan tahay! Waxaan ku faraxsanahay inaan kugu caawiyo. Wax kale?' },

  // SHOP STATUS
  { pattern: ['dukaanka siduu socdo', 'ganacsigu siduu yahay', 'business sidee buu yahay', 'dukaan siduu soconayo'], intent: 'query_summary', response: '' },

  // COMPARISONS
  { pattern: ['midkee ka fiican', 'tee ka wanaagsan', 'kee isticmaalaa'], intent: 'compare_pos_manual', response: '' },

  // IDENTITY
  { pattern: ['adigaa tahay', 'yaa tahay', 'magacaa', 'waa kuma', 'maxaad tahay'], intent: 'identity', response: 'Anigu waxaan ahay **Revlo AI** — khabiirka dukaankaaga!\n\nWaxaan ku caawin karaa:\n• Xogta dukaanka (iibka, kaydka, macaamiisha)\n• Barashada nidaamka\n• Talo ganacsiyeed\n• Wax badan oo kale!\n\nSu\'aal kasta i weydii.' },

  // CAPABILITIES
  { pattern: ['maxaad samayn kartaa', 'maxaad taqaan', 'maxaad awood u leedahay', 'liiska awoodahaaga'], intent: 'help', response: '' },

  // BOREDOM/CHAT
  { pattern: ['waan caajisnahay', 'wax cusub ii sheeg', 'talo ii sii', 'wax ii sheeg'], intent: 'tip', response: '' },

  // NEGATIVE/FRUSTRATION
  { pattern: ['ma shaqaynaysid', 'kuma shaqaynaysid', 'waad khaldan tahay', 'jawaab qalad', 'waxba kama fahmin'], intent: 'apology', response: 'Waan ka xumahay haddii aanan si sax ah kuugu jawaabi waayay. Fadlan si kale u dhig su\'aashaada, ama dhig "caawin" si aad u aragto waxa aan samayn karo.\n\nAniga waxaan si fiican u garanayaa:\n• Su\'aalaha xogta dukaanka\n• Barashada features-ka\n• Talo ganacsiyeed' },
];

// Business tips — random tips the AI can share
export const businessTips: string[] = [
  '💡 Oggoow: Alaabta dhamaanaysa marka hore dib u dalbo — macaamiisha ha ka dhumin!',
  '💡 Macaamiishaada ugu fiican diiwaangeli si aad dayn iyo credit-ka u track-gareeyso.',
  '💡 Maalin kasta kaashka fur subaxdii, xidh fiidkii — farqiga eeg si aad lacag dhimay u ogaato.',
  '💡 Reports-ka usbuuc kasta eeg — faa\'iidadaada dhabta ah ogow!',
  '💡 Alaabta aan iibsanayn — qiimaha hoos u dhig ama ka saar kaydka.',
  '💡 Barcode scanner ku dar POS-ka — waa ka degdeg badan!',
  '💡 Shaqaalaha ugu fiican — mushaar bonus ah sii si ay u dadaalaan.',
  '💡 Category-yada si fiican u habee — alaabta waa ka sahlan tahay in la helo.',
  '💡 Vendor-yada ugu qiimaha yar ka iibso — faa\'iidadaadu way kor u kici doontaa.',
  '💡 Credit limit saar macaamiisha — si aadan dayn badan u siin.',
  '💡 Manual Entry — haddii dukaan yar tahay, waa ka sahlan POS-ka.',
  '💡 WhatsApp rasiidka macmiilka ugu dir — waa professional!',
  '💡 Alaab cusub soo gelisay? Qiimaha iibsashada iyo gadashada labadaba geli.',
  '💡 Tax rate-ka settings-ka ka habeyn kartaa — si rasiidyada canshuurta loogu daro.',
  '💡 Dashboard-ka maalin kasta ka bilow — xaaladda oo dhan ayaad ka arki kartaa.',
  '💡 Profit & Loss report — bisha dhamaadkeeda eeg faa\'iidada nadiifka.',
  '💡 Alaab qiimo badan — minStock-ka kor u qaad si alert-ka degdeg ah kuu yimaado.',
  '💡 Vendor aging report — ogow lacagta aad dukaamada jumladda u deyneyso.',
  '💡 Multiple payment methods — macmiilka qaar cash, qaar EVC ha ku bixiyo.',
  '💡 Employee performance — eeg shaqaalihee alaab badan iibiyay.',
];

// Extended FAQ — common questions with full answers
export const faq: { q: string[]; a: string; links?: { label: string; href: string }[] }[] = [
  { q: ['sidee lacag loo bixiyaa', 'lacag bixin', 'payment method', 'qaabka lacag bixinta'], a: 'Saddex qaab ayaad lacagta ku bixi kartaa:\n\n1. **Cash (Kaash)** — lacag caddaan ah\n2. **Card/Bank** — bangiga ama kaardka\n3. **Mobile Money** — EVC Plus, eDahab\n\nPOS-ka iyo Manual Entry-da labadaba waxaad ka dooran kartaa qaabka lacag bixinta.', links: [{ label: 'POS — Iib Cusub', href: '/shop/pos' }] },
  { q: ['sidee rasiid loo daabacaa', 'print receipt', 'rasiid print', 'invoice print'], a: 'Rasiidka daabiciddiisa:\n\n1. Iibka ka dib, rasiidka wuu isdaabici karaa (auto-print)\n2. Ama Sales History-ga tag\n3. Invoice-ka fur\n4. Print button-ka guji\n\nSettings-ka waxaad ka habayn kartaa rasiidka header/footer.', links: [{ label: 'Sales History', href: '/shop/sales' }] },
  { q: ['sidee alaab loo soo celiyaa', 'refund', 'return', 'alaab soo celi', 'lacag soo celi'], a: 'Alaab soo celinta:\n\n1. Tag Sales History\n2. Invoice-ka ka raadi\n3. "Refund" button-ka guji\n4. Alaabta la soo celiyay dooro\n5. Confirm\n\nKaydka wuu dib ugu soo noqon doonaa, lacagtana waa la soo celin doonaa.', links: [{ label: 'Sales History — Refund', href: '/shop/sales' }] },
  { q: ['sidee exchange rate loo beddelaa', 'sarrifka', 'dollar etb', 'lacag beddel'], a: 'Exchange rate-ka beddelkiisa:\n\n1. Tag Settings\n2. Currency section-ka\n3. Rate-ka cusub geli (tusaale: 1 USD = 56 ETB)\n4. Save\n\nAlaabta USD ku iibsan kartaa, ETB ku iibin kartaa — system-ku wuu kuu beddeli doonaa.', links: [{ label: 'Settings', href: '/shop/settings' }] },
  { q: ['sidee shaqaale mushaar loo bixiyaa', 'pay employee', 'mushaar bixi', 'salary pay'], a: 'Mushaharka bixinta:\n\n1. Tag Payroll\n2. Shaqaalaha ka dooro\n3. Lacagta geli\n4. Xisaabta ka baxayso dooro (Cash, Bank, etc)\n5. Confirm Payment\n\nQaar-bixin (partial) ayaad samayn kartaa — mushaharka qayb ka bixi.', links: [{ label: 'Payroll', href: '/shop/payroll' }] },
  { q: ['sidee till loo furaa', 'kaash fur', 'till open', 'till session'], a: 'Till-ka (Kaashka) furista:\n\n1. Tag Accounting → Till\n2. "Open Till" guji\n3. Opening Float geli (lacagta aad ku bilowday)\n4. Start\n\nMaalinta dhamaadkeeda: "Close Till" guji → lacagta xisaabi → farqiga eeg.', links: [{ label: 'Accounting', href: '/shop/accounting' }] },
  { q: ['sidee bulk import loo sameeyaa', 'alaab badan geli', 'excel import', 'csv import'], a: 'Bulk Import — alaab badan hal mar geli:\n\n1. Tag Inventory\n2. "Import" button-ka guji\n3. Excel/CSV file-kaaga dooro\n4. Columns-ka ku match-garee (Name, Price, Stock, etc)\n5. Import guji\n\nTani waa mid aad u wakhti badbaadisa!', links: [{ label: 'Inventory — Import', href: '/shop/inventory' }] },
  { q: ['sidee warbixin loo soo saaraa', 'report export', 'warbixin print', 'report download'], a: 'Warbixin soo saarista:\n\n1. Tag Reports\n2. Report-ka aad rabto dooro\n3. Filter-ka isticmaal (taariikhda, category)\n4. "Export" guji → PDF ama Excel dooro\n5. Print button-ka isticmaal daabicidda', links: [{ label: 'Reports', href: '/shop/reports' }] },
  { q: ['maxaa la sameeyaa haddii alaab dhunto', 'alaab la waayay', 'stock adjust', 'alaab dhimatay'], a: 'Alaab dhuntay/dhimatay:\n\n1. Tag Inventory\n2. Alaabta ka raadi\n3. "Adjust Stock" guji\n4. Tirada cusub geli\n5. Sababta qor (dhuntay, jabsatay, iwm)\n6. Save\n\nTani waxay stock-ka hoos u dhigtaa iyada oo la diiwaangeliyay.', links: [{ label: 'Inventory', href: '/shop/inventory' }] },
  { q: ['sidee logo loo beddelaa', 'logo update', 'company logo', 'astaanta beddel'], a: 'Logo-da beddelkeedu:\n\n1. Tag Settings\n2. Company Info section\n3. Logo upload area-da guji\n4. Sawirka cusub dooro\n5. Save\n\nLogo-du rasiidyada oo dhan waxay ku muuqan doontaa.', links: [{ label: 'Settings', href: '/shop/settings' }] },
];

// Somali-English glossary for business terms
export const glossary: Record<string, string> = {
  'dakhli': 'Revenue — lacagta soo gasho iibka',
  "faa'iido": 'Profit — dakhliga ka dib kharashka la jaro',
  'khasaare': 'Loss — marka kharashku ka badan yahay dakhliga',
  'kayd': 'Inventory/Stock — alaabta dukaanka ku jirta',
  'dayn': 'Debt/Credit — lacag la leeyahay oo aan la bixin',
  'canshuur': 'Tax — lacag dowladda la siiyo',
  'mushaar': 'Salary — lacag bil ah oo shaqaalaha la siiyo',
  'rasiid': 'Receipt/Invoice — waraaqda iibka',
  'jumla': 'Wholesale — alaab tiro badan oo qiimo yar',
  'tafaariiq': 'Retail — alaab mid mid ah oo qiimo sare',
  'haraag': 'Balance — lacagta xisaabta ku jirta',
  'wareejin': 'Transfer — lacag xisaab ka xisaab u qaadista',
  'sarriif': 'Exchange Rate — qiimaha lacagaha isdhaafsiinta',
  'till': 'Till/Cash Register — kaashka dukaanka',
  'POS': 'Point of Sale — meesha iibka laga sameeyo',
  'SKU': 'Stock Keeping Unit — lambarka gaarka ah ee alaabta',
  'barcode': 'Barcode — khadadka alaabta lagu akhriyo',
};
