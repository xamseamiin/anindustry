// ============================================================
// REVLO AI — Xogta Aqoonta (Knowledge Base)
// Luuqada: Soomaali (dhaqan ah)
// ============================================================

export interface AiResponse {
  text: string;
  links?: { label: string; href: string }[];
  quickActions?: string[];
}

// --- SALAANTA & JAWAABAHA GUUD ---
export const greetings: Record<string, AiResponse> = {
  subax: {
    text: "Subax wanaagsan! ☀️ Ku soo dhawoow dukaankaaga Revlo.\nMaxaad maanta jeclaanaysaa inaad samayso?",
    quickActions: ["Sidee baan iib u sameeyaa?", "Alaab ku dar", "Warbixin arag"]
  },
  galab: {
    text: "Galab wanaagsan! 🌤️ Maxaan kuu caawin karaa maanta?",
    quickActions: ["POS fur", "Kaydka eeg", "Macaamiisha arag"]
  },
  habeen: {
    text: "Habeen wanaagsan! 🌙 Weli shaqo ayaad ku jirtaa — runtii aad baad u dadaashaa!\nMaxaan kugu caawiyo?",
    quickActions: ["Warbixinta maanta", "Iibka maanta", "Kaashka xidh"]
  },
  default: {
    text: "Salaamo! 👋 Anigu waxaan ahay Revlo AI — caawiyahaaga dukaanka.\nSu'aal kasta i weydii, waan kugu caawin!",
    quickActions: ["Maxaad samayn kartaa?", "Sidee baan bilaabaa?", "I bar POS-ka"]
  }
};

export const farewells = [
  "Nabadgelyo! 👋 Haddii aad wax u baahato, halkan ayaan joogaa.",
  "Nabad! Guul iyo gobanimo ganacsi 💪",
  "Nabadgelyo — maalin wanaagsan! ☀️"
];

export const thanks = [
  "Adiga ayaa mudan! 😊 Wax kale oo aan kuu caawiyo?",
  "Adigaa mahad leh! Haddii su'aal kale aad qabto, i weydii ✨",
  "Waad ku mahadsan tahay! Waan halkan joogaa haddii aad i baahato 💪"
];

// --- AQOONTA QOTO DHEER EE FEATURE KASTA ---
export interface FeatureKnowledge {
  name: string;
  description: string;
  href: string;
  whoShouldUse: string;
  steps: string[];
  tips: string[];
  keywords: string[];
}

export const features: FeatureKnowledge[] = [
  {
    name: "Point of Sale (POS)",
    description: "POS waa cashier-ka dijital-ka ah — meesha aad si degdeg ah alaab uga iibiso macaamiisha.\n\n⚠️ **POS badanaa waxaa isticmaala dukaamo waaweyn sida supermarket-yada, mini-market-yada, iyo dukaamo badan oo alaab leh.**\n\nHaddii aad tahay dukaan yar oo rasiid isticmaalaya, **Manual Entry ayaa kuugu fiican** — halkaas oo aad si sahlan ugu geliso rasiidyada gacanta.",
    href: "/shop/pos",
    whoShouldUse: "Supermarket-yada, mini-market, dukaan alaab badan leh. Haddii alaab system-ka ku jirto oo barcode leedahay, POS isticmaal. Haddii kale, Manual Entry raac.",
    steps: [
      "1️⃣ Sidebar-ka ka dooro 'Point of Sale'",
      "2️⃣ Raadi alaabta aad iibinayso — search bar-ka isticmaal ama category-ga ka dooro",
      "3️⃣ Guji alaabta — waxay ku dari doontaa Dambiilka (Cart)",
      "4️⃣ Tirada wax ka beddel haddii loo baahdo (+ ama -)",
      "5️⃣ Macmiilka ka dooro dropdown-ka (ikhtiyaari)",
      "6️⃣ Habka lacag bixinta dooro: Cash, Card, ama Credit",
      "7️⃣ Guji 'Complete Sale' ✅",
      "8️⃣ Rasiidka wuu isdaabici doonaa! 🧾"
    ],
    tips: [
      "💡 'Hold Cart' — haddii macmiil kale yimaado, cart-ka taagto oo mid kale bilowdo",
      "💡 Barcode scanner haddii aad leedahay, si toos ah ayuu alaabta u ku daraa cart-ka",
      "💡 Credit — macmiilka wax ku iibso, kadib lacagta wakhti kale bixiyo",
      "💡 Haddii dukaan yar tahay, Manual Entry isticmaal — waa ka sahlan!"
    ],
    keywords: ["pos", "iib", "iibi", "iibso", "cashier", "sale", "sell", "cart", "dambiil", "lacag", "bixi", "checkout"]
  },
  {
    name: "Manual Entry (Gelinta Rasiidka)",
    description: "Manual Entry waa qaabka ugu sahlan ee aad rasiid ugu geliso nidaamka.\n\n✅ **Dukaamo yaryar oo rasiid isticmaala ayaa tani ugu fiican.** Uma baahnid alaab system-ka ku jirto — magaca iyo qiimaha qorto, bas!\n\nWaa mid enterprise-level ah oo suuq-geeda Soomaalida u qurxoon.",
    href: "/shop/manual-entry",
    whoShouldUse: "Dukaamo yaryar, dukaamo rasiid gacmeed isticmaala, ganacsato aan alaab system-ka ku lahayn",
    steps: [
      "1️⃣ Tag 'Manual Entry' sidebar-ka",
      "2️⃣ Lambarka rasiidka geli (ama system-ku wuu kuu samayn)",
      "3️⃣ Taariikhda dooro",
      "4️⃣ Alaabaha ku dar: magaca, qiimaha, tirada",
      "5️⃣ 'Add Item' guji si aad u kordhiso",
      "6️⃣ Marka aad dhamaystid, 'Save Receipt' guji ✅"
    ],
    tips: [
      "💡 Rasiid gacmeed haddii aad ku qorto, halkan ku geli si digital ah loo keydiyo",
      "💡 POS-ka uma baahnid — tani waa mid ka fudud",
      "💡 Warbixinada waxay ku dari doontaa si toos ah"
    ],
    keywords: ["manual", "entry", "rasiid", "gelin", "gacanta", "qor", "receipt", "geli"]
  },
  {
    name: "Inventory (Kaydka Alaabta)",
    description: "Halkan waxaad ka maareysaa dhammaan alaabta dukaankaaga — ku darista, tirista, qiimaha, iyo kaydka.\n\nNidaamkan waa mid enterprise ah oo kuu sheegaya:\n• Alaabta socota iyo tan dhamaanaysa\n• Low stock alerts\n• Bulk import (alaab badan hal mar ku dar)",
    href: "/shop/inventory",
    whoShouldUse: "Dukaan kasta oo alaab haysta",
    steps: [
      "1️⃣ Tag 'Inventory' sidebar-ka",
      "2️⃣ 'Add Product' guji si aad alaab cusub u darto",
      "3️⃣ Buuxi: Magaca, Qiimaha Iibsashada, Qiimaha Gadashada, Tirada",
      "4️⃣ Category-ga dooro (ama mid cusub samayn)",
      "5️⃣ SKU/Barcode geli (haddii jiro)",
      "6️⃣ Save guji ✅"
    ],
    tips: [
      "💡 Bulk Import — Excel file-ka alaabta ka soo import-garee hal mar",
      "💡 Stock Adjust — haddii alaab dhunto ama dhamaato, 'Adjust Stock' isticmaal",
      "💡 Low Stock Alert — nidaamku wuu kuu sheegi haddii alaab dhamaanayso",
      "💡 Qiimaha iibsashada vs gadashada — faa'iidada waxay ka timaadaa farqa labadaas"
    ],
    keywords: ["inventory", "kayd", "alaab", "product", "stock", "badeeco", "shay", "add product", "ku dar"]
  },
  {
    name: "Sales History (Taariikhda Iibka)",
    description: "Dhammaan iibiyaashii hore halkan ayaad ka arki kartaa — invoice-yada, lacag bixinta, macaamiisha.\n\nWaxaad filter-garayn kartaa: Maanta, Usbuucan, Bishan, ama weligeed.",
    href: "/shop/sales",
    whoShouldUse: "Qof kasta oo raba inuu arko iibkii hore",
    steps: [
      "1️⃣ Tag 'Sales History'",
      "2️⃣ Filter-ka isticmaal: Today, This Week, This Month",
      "3️⃣ Invoice kasta guji si aad faahfaahin u aragto",
      "4️⃣ Print ama Export samayn kartaa"
    ],
    tips: [
      "💡 Invoice number — lambarka rasiidka ayaad ku raadi kartaa",
      "💡 Refund — haddii alaab la soo celiyo, iibka ka refund garee"
    ],
    keywords: ["sales", "iib", "iibka", "taariikh", "history", "invoice", "rasiid", "soo cel"]
  },
  {
    name: "Customers (Macaamiisha)",
    description: "Maaraynta macaamiishaada — magacyada, telefoonada, daymaha, iyo credit-ka.\n\nTani waa enterprise feature — waxaad ku haysaa record-ka macmiil kasta oo kula macaamilay.",
    href: "/shop/customers",
    whoShouldUse: "Dukaan kasta oo macaamiil joogto ah leh",
    steps: [
      "1️⃣ Tag 'Customers'",
      "2️⃣ 'Add Customer' guji",
      "3️⃣ Magaca, telefoonka, iyo nooca geli",
      "4️⃣ Credit limit dajin kartaa (lacagta ugu badan ee aad dayn siinayso)",
      "5️⃣ Save ✅"
    ],
    tips: [
      "💡 Daynta — macmiilka dayntiisa halkan ayaad ka arki kartaa",
      "💡 POS-ka — macmiilka ka dooro marka aad iibinayso si daynta loo track-gareeyo",
      "💡 Credit limit — saar xad si aadan dayn badan u siin"
    ],
    keywords: ["customer", "macmiil", "macaamiil", "dayn", "credit", "qof", "dad"]
  },
  {
    name: "Purchases (Iibsashada)",
    description: "Alaabta aad dukaanka u soo iibsato — vendor-yada ama dukaamada jumladda.\n\nTani waa meesha aad ka track-gareeyso wixii aad soo iibsatay iyo lacagtii aad bixisay.",
    href: "/shop/purchases",
    whoShouldUse: "Dukaan kasta oo alaab soo iibsada",
    steps: [
      "1️⃣ Tag 'Purchases'",
      "2️⃣ 'Add Purchase' guji",
      "3️⃣ Vendor-ka ka dooro (ama cusub samayn)",
      "4️⃣ Alaabta ku dar — magaca, qiimaha, tirada",
      "5️⃣ Save ✅ — kaydka wuu kor u kici doonaa"
    ],
    tips: [
      "💡 Purchase waxay kor u qaadaysaa kaydka (stock) si toos ah",
      "💡 Vendor-ka lacagtiisa halkan ayaad ka bixin kartaa"
    ],
    keywords: ["purchase", "iibso", "soo iibso", "jumla", "vendor", "dukaan"]
  },
  {
    name: "Accounting (Xisaabaadka)",
    description: "Xisaabaadka dhameystiran — accounts, transactions, journal, ledger.\n\n🏢 **Tani waa enterprise-level feature:**\n• Bank accounts track-garee\n• Mobile money (EVC, eDahab)\n• Journal entries\n• Bank reconciliation\n• Till management",
    href: "/shop/accounting",
    whoShouldUse: "Dukaan kasta oo lacag badan dhaqaajiya — gaar ahaan kuwa xisaabaad rasmiya raba",
    steps: [
      "1️⃣ Tag 'Accounting'",
      "2️⃣ Accounts — xisaabaadkaaga arag (Cash, Bank, Mobile Money)",
      "3️⃣ Deposit/Withdraw/Transfer — lacag geli, saar, ama wareejiso",
      "4️⃣ Journal — diiwaanka xisaabaadka oo dhan",
      "5️⃣ Reconciliation — xisaabaadka bangiga la barbardhig"
    ],
    tips: [
      "💡 Till — kaashka dukaanka fur subaxda, xidh fiidkii. Farqiga eeg",
      "💡 Xisaab badan samayn kartaa: Cash, Bangiga, EVC, eDahab",
      "💡 Transfer — lacag xisaab ka xisaab u wareejin kartaa"
    ],
    keywords: ["accounting", "xisaab", "account", "lacag", "bank", "journal", "ledger", "till", "kaash", "bangiga", "evc"]
  },
  {
    name: "Employees (Shaqaalaha)",
    description: "Maaraynta shaqaalaha dukaanka — magacyada, shaqooyinka, iyo mushaharka.",
    href: "/shop/employees",
    whoShouldUse: "Dukaan shaqaale leh",
    steps: [
      "1️⃣ Tag 'Employees'",
      "2️⃣ 'Add Employee' guji",
      "3️⃣ Magaca, shaqada, mushaharka geli",
      "4️⃣ Save ✅"
    ],
    tips: [
      "💡 Payroll section-ka ayaad mushaharka ka bixin kartaa",
      "💡 Active/Inactive — shaqaalaha joojiyay inactive ka dhig"
    ],
    keywords: ["employee", "shaqaale", "staff", "worker", "mushaar"]
  },
  {
    name: "Payroll (Mushaharka)",
    description: "Bixinta mushaharka shaqaalaha — bil kasta track-garee lacagta la bixiyay iyo tan hadhay.",
    href: "/shop/payroll",
    whoShouldUse: "Dukaan shaqaale mushaar leh",
    steps: [
      "1️⃣ Tag 'Payroll'",
      "2️⃣ Shaqaalaha ka dooro kan aad bixinayso",
      "3️⃣ Lacagta geli",
      "4️⃣ Xisaabta lacagta ka baxayso dooro",
      "5️⃣ Confirm Payment ✅"
    ],
    tips: [
      "💡 Qaar-bixin (partial) — mushaharka qayb ka bixi kartaa",
      "💡 Extra/Bonus — lacag dheeri bixin kartaa",
      "💡 History — taariikhda bixinta oo dhan halkan"
    ],
    keywords: ["payroll", "mushaar", "salary", "bixi", "shaqaale", "lacag"]
  },
  {
    name: "Reports (Warbixinada)",
    description: "Warbixinada ganacsiyadaada oo dhan halkan — faa'iido, khasaare, iibka, kaydka.\n\n📊 **Enterprise analytics:**\n• Profit & Loss\n• Balance Sheet\n• Sales Report\n• Inventory Report\n• Aging Report (daymaha)\n• Top Products\n• Category Analysis",
    href: "/shop/reports",
    whoShouldUse: "Qof kasta oo raba inuu ogaado xaaladda ganacsigiisa",
    steps: [
      "1️⃣ Tag 'Reports'",
      "2️⃣ Report-ka aad rabto ka dooro",
      "3️⃣ Filter-ka isticmaal (taariikhda, qaybta, iwm)",
      "4️⃣ Export ama Print haddii loo baahdo"
    ],
    tips: [
      "💡 Profit & Loss — ogaw faa'iidadaada dhabta ah",
      "💡 Balance Sheet — hantida, daymaha, maalka — meel wada arag",
      "💡 Aging Report — ogaw daymaha waqtigoodu dhaafay"
    ],
    keywords: ["report", "warbixin", "faa'iido", "profit", "khasaare", "loss", "analytics", "chart"]
  },
  {
    name: "Settings (Goobadka)",
    description: "Habaynta nidaamka — magaca shirkadda, canshuurta, rasiidka, luuqadda, iyo WhatsApp.",
    href: "/shop/settings",
    whoShouldUse: "Admin-ka/maamulaha dukaanka",
    steps: [
      "1️⃣ Tag 'Settings'",
      "2️⃣ Company Info — magaca, cinwaanka, telefoonka geli",
      "3️⃣ Tax Rate — canshuurta boqolleyda geli",
      "4️⃣ Receipt Header/Footer — rasiidka madaxa iyo hoosta",
      "5️⃣ Save Settings ✅"
    ],
    tips: [
      "💡 Logo — astaanta shirkaddaada soo geli si rasiidyada ay u muuqdaan",
      "💡 WhatsApp — ku xidh si macaamiisha loola xiriiro",
      "💡 Luuqadda — Soomaali ama English dooro"
    ],
    keywords: ["settings", "goobad", "habee", "setting", "config", "tax", "canshuur", "logo", "whatsapp"]
  },
  {
    name: "Dashboard (Guudmarka)",
    description: "Bogga hore ee dukaanka — wax kasta oo dhacaya halkan ayaad ka arki kartaa:\n• Dakhliga maanta\n• Iibka usbuucan\n• Alaabta dhamaanaysa\n• Daymaha\n• AI insights",
    href: "/shop/dashboard",
    whoShouldUse: "Qof kasta — halkan ayaad maalin kasta ka bilowdaa",
    steps: [
      "1️⃣ Tag 'Dashboard'",
      "2️⃣ Kaararka guud ee kore eeg (Revenue, Profit, Orders)",
      "3️⃣ Charts-ka iibka eeg",
      "4️⃣ Low stock alerts eeg",
      "5️⃣ AI insights akhri"
    ],
    tips: [
      "💡 Dashboard-ka waa bogga ugu muhiimsan — maalin kasta ka bilow",
      "💡 AI guard — nidaamku wuu kuu sheegi haddii wax khatar ah jiraan"
    ],
    keywords: ["dashboard", "guudmar", "home", "bogga hore", "summary", "overview", "muraayad"]
  },
  {
    name: "Vendors (Dukaamada Jumladda)",
    description: "Dukaamada aad alaabta ka soo iibsato — track-garee magacyada, xiriirka, iyo lacagaha.",
    href: "/shop/vendors",
    whoShouldUse: "Dukaan alaab ka soo iibsada dukaan kale",
    steps: [
      "1️⃣ Tag 'Vendors'",
      "2️⃣ 'Add Vendor' guji",
      "3️⃣ Magaca, telefoonka, alaabta ay bixiyaan geli",
      "4️⃣ Save ✅"
    ],
    tips: [
      "💡 Vendor-ka purchases-ka lagu xidh si lacagta loo track-gareeyo",
      "💡 Vendor aging — ogaw lacagta aad u deyneysid"
    ],
    keywords: ["vendor", "jumla", "supplier", "dukaan", "bixiye"]
  }
];

// --- TALO GANACSI (Business Advice) ---
export const businessAdvice: Record<string, AiResponse> = {
  dukaan_yar: {
    text: "🏪 **Dukaanka yar — Talooyin:**\n\nHaddii dukaan yar leedahay:\n\n1. **Manual Entry** isticmaal — waa ka sahlan POS-ka\n2. **Customers** — macaamiishaada diiwaangeli si daymaha aad u track-gareeyso\n3. **Reports** — usbuuc kasta eeg faa'iidadaada\n4. **Inventory** — alaabta dhamaanaysa si degdeg ah u buuxi\n\n❌ Uma baahnid POS haddii alaab badan aadan ku lahayn system-ka\n✅ Manual Entry + Customers + Reports = combination ugu fiican!",
    links: [
      { label: "Manual Entry", href: "/shop/manual-entry" },
      { label: "Customers", href: "/shop/customers" },
      { label: "Reports", href: "/shop/reports" }
    ]
  },
  supermarket: {
    text: "🛒 **Supermarket / Dukaan Weyn — Talooyin:**\n\n1. **POS isticmaal** — cashier degdeg ah\n2. **Barcode scanner** ku xidh — waa ka degdeg badan\n3. **Inventory** — alaabta oo dhan system-ka geli\n4. **Categories** — alaabta u kala qaybī (Cunto, Cabitaan, Nadaafad, iwm)\n5. **Employees** — shaqaalaha diiwaangeli + Payroll\n6. **Accounting** — xisaabaad dhameystiran samee\n7. **Till** — kaashka maalin kasta fur & xidh\n\n✅ POS + Inventory + Accounting + Till = Enterprise setup!",
    links: [
      { label: "POS", href: "/shop/pos" },
      { label: "Inventory", href: "/shop/inventory" },
      { label: "Accounting", href: "/shop/accounting" }
    ]
  },
  faa_iido: {
    text: "📈 **Sidee faa'iido u ogaadaa:**\n\n1. Tag **Reports** → **Profit & Loss**\n2. Waxaad arki:\n   • Dakhliga guud (Total Revenue)\n   • Qiimaha alaabta (Cost of Goods)\n   • Kharashka kale (Expenses)\n   • **Faa'iidada nadiifka** (Net Profit) ✅\n\n💡 Faa'iidada = Dakhliga - Qiimaha Alaabta - Kharashka\n\nHaddii faa'iido la'aan tahay, eeg:\n• Qiimaha gadashada — ma yar yahay?\n• Kharashka — ma badan yahay?\n• Alaabta aan iibsanayn — maxay tahay?",
    links: [{ label: "Profit & Loss Report", href: "/shop/reports" }]
  }
};
