// Advanced Troubleshooting + Business Scenarios — extends the AI brain

export const troubleshooting: { keywords: string[]; problem: string; solution: string }[] = [
  { keywords: ['print', 'daabac', 'rasiid', 'ma daabicayo', 'printer'], problem: 'Rasiidka ma daabicayo', solution: 'Sida loo saxo:\n1. Printer-ka hub inuu shaqaynayo\n2. Browser-ka print settings-ka eeg\n3. Pop-up blocker-ka disable garee\n4. Receipt template-ka Settings-ka ka hub\n5. Paper-ka ku jiraa printer-ka?' },
  { keywords: ['slow', 'gaabis', 'dhaqso', 'loading', 'sugi', 'cuslayn', 'wasakhaynayo'], problem: 'System-ku waa gaabis yahay', solution: 'Waxyaabaha eeg:\n1. Internet-ka speed-kiisa hub\n2. Browser-ka cache-kiisa nadiifi\n3. Tab-yo badan ha furin\n4. Alaab badan filter-garee page-ka\n5. Browser cusub isticmaal (Chrome)' },
  { keywords: ['login', 'password', 'geli', 'ma gelayo', 'khalad', 'furaha', 'account'], problem: 'Ma geli karo account-kayga', solution: 'Isku day:\n1. Password-ka si sax ah ku qor\n2. Caps Lock ka dami\n3. "Forgot Password" isticmaal\n4. Browser-ka cache nadiifi\n5. Admin-ka la xiriir' },
  { keywords: ['stock', 'khalad', 'tiro', 'sax maaha', 'habboonayn', 'qalad'], problem: 'Stock-a tiradu sax maaha', solution: 'Sidaas waxay ku dhici kartaa:\n1. Iib la sameeyay oo stock laga dhimay\n2. Adjust Stock — tiraha cusub geli\n3. Stock Movement history-ga eeg\n4. Physical count samee oo system-ka la mid garee' },
  { keywords: ['delete', 'tirtir', 'ka saar', 'ka tirtir', 'lama tirtiri karo'], problem: 'Wax lama tirtiri karo', solution: 'Qaar system-ku ma tirtiro (tusaale: iib la dhamaystay). Sababtuna waa xisaabaadka ammaanka. Laakiin:\n1. Products — active/inactive ka dhig\n2. Customers — archive garee\n3. Invoices — void/cancel ka dhig' },
  { keywords: ['whatsapp', 'message', 'fariin', 'ma dirayo'], problem: 'WhatsApp-ka rasiidka ma dirayo', solution: 'Hub:\n1. Customer-ka phone number-kiisa ku jiraa?\n2. WhatsApp integration Settings-ka ka enable garee\n3. Phone format-ka sax (tusaale: +252...)\n4. Internet connection hub' },
  { keywords: ['permission', 'oggolaansho', 'admin', 'access', 'mamnuuc'], problem: 'Oggolaansho/access ma hayo', solution: 'Tani waxay ka dhigan tahay role-kaagu awood uma laha. La xiriir Admin-ka si uu:\n1. Role-kaaga kor u qaado\n2. Permission gaar ah ku siiyo\n3. Ama admin account cusub ku sameeyo' },
  { keywords: ['barcode', 'scan', 'scanner', 'akhri', 'ma akhrinayo'], problem: 'Barcode scanner-ka ma shaqaynayo', solution: 'Isku day:\n1. Scanner-ka USB hub inuu ku xiran yahay\n2. POS page-ka focus ku yaal input-ka\n3. Scanner-ka settings: USB Keyboard mode\n4. Barcode format-ka product-ka ku jiraa?' },
  { keywords: ['report', 'warbixin', 'sax maaha', 'khaldan', 'tiro khalad'], problem: 'Report-ka tiradu khalad buu yahay', solution: 'Hub:\n1. Filter dates-ka sax ma yihiin?\n2. Currency-ga eeg (ETB vs USD)\n3. Voided sales ma ku jiraan?\n4. Cache refresh samee (Ctrl+Shift+R)' },
  { keywords: ['exchange', 'currency', 'sarriif', 'dollar', 'usd', 'etb', 'beddelka'], problem: 'Currency/Exchange khalad', solution: 'Saxo:\n1. Settings → Currency section\n2. Exchange rate-ka cusub geli\n3. Sale cusub samayso rate-ka cusub\n4. Iibyadii hore rate-kooda ma isbeddeli karaan' },
];

// Industry-specific advice (supermarket, restaurant, electronics, clothing, etc.)
export const industryAdvice: Record<string, { description: string; tips: string[]; recommendedFeatures: string[] }> = {
  supermarket: {
    description: 'Supermarket-ka — dukaan weyn oo alaab badan',
    tips: [
      'POS barcode scanner-la isticmaal — degdeg badan',
      'Category-yada si fiican u qaybi (Food, Drinks, Cleaning, etc)',
      'MinStock alert — alaabta muhiimka ah ha ka dhamaato',
      'Employee shifts — shaqaalaha si habaysan u qorshe',
      'Multiple payment — Cash + EVC isla mar',
      'Daily till reconciliation — maalin kasta kaashka xisaabi',
      'Supplier management — vendor-yada liiska hayso',
      'Expiry date tracking — alaab wakhtigedu dhacay ka saar',
    ],
    recommendedFeatures: ['POS', 'Inventory', 'Employees', 'Reports', 'Payroll', 'Vendors'],
  },
  restaurant: {
    description: 'Restaurant/Makhaayad — cuntada iyo cabitaanka',
    tips: [
      'Manual Entry isticmaal — cuntada waa lagu custom-gareeyaa',
      'Category: Drinks, Breakfast, Lunch, Dinner',
      'Customer tabs — macmiilka maalinta oo dhan ku dar',
      'End of day report — maalin kasta faa\'iidada eeg',
    ],
    recommendedFeatures: ['Manual Entry', 'Customers', 'Reports'],
  },
  electronics: {
    description: 'Electronics — qalab telefoon, laptop, iwm',
    tips: [
      'Serial number geli alaab kasta — warranty track',
      'Qiimaha baddalaa — market-ka raac',
      'Credit/dayn — alaab qiimo badan macaamiisha u dayn',
      'Vendor warranty tracking — la xisaabi',
    ],
    recommendedFeatures: ['POS', 'Inventory', 'Customers', 'Vendors'],
  },
  clothing: {
    description: 'Dhar/Clothing — dharka iyo kabaha',
    tips: [
      'Size iyo Color — variant-yada si fiican u diiwaangeli',
      'Season tracking — xilliga cimilada raac',
      'Discount/Sale price — alaab duug ah qiimo dhimid',
      'Customer loyalty — macaamiisha joogtada ah abaal-mari',
    ],
    recommendedFeatures: ['POS', 'Inventory', 'Customers', 'Reports'],
  },
  pharmacy: {
    description: 'Pharmacy/Farmashiye — daawada iyo caafimadka',
    tips: [
      'Expiry date geli — MUHIIM! Daawo wakhtigedu dhacay ha iibinin',
      'Batch number tracking — daawo kasta batch-keeda geli',
      'MinStock alerts — daawo muhiim ah ha ka dhamaato',
      'Prescription tracking — warbixinta dhakhtar',
    ],
    recommendedFeatures: ['POS', 'Inventory', 'Reports', 'Vendors'],
  },
};

// Comprehensive accounting guide responses
export const accountingGuides: { keywords: string[]; title: string; content: string }[] = [
  { keywords: ['profit loss', 'p&l', 'faaido khasaare', 'income statement'], title: 'Profit & Loss (P&L)', content: 'Warbixinta Faa\'iido & Khasaare:\n\n📊 **Qaabka:**\nDakhli (Revenue) — Kharashka (Expenses) = Faa\'iido/Khasaare\n\n**Dakhliga:**\n• Iibka alaabta\n• Adeegyada\n• Lacag kale soo gashay\n\n**Kharashka:**\n• Alaabta cost-keeda\n• Mushaharka\n• Kirada\n• Biilasha (korontada, biyaha)\n• Kharash kale\n\nReports-ka ka eeg warbixintaan!' },
  { keywords: ['balance sheet', 'miisaaniyad', 'xisaab guud'], title: 'Balance Sheet', content: 'Balance Sheet — Miisaaniyada:\n\n📊 **Qaabka:**\nHantida (Assets) = Daynta (Liabilities) + Milkiilaha (Equity)\n\n**Hantida:**\n• Kaashka (lacagta cash-ka ah)\n• Bangiga (lacagta bangiga)\n• Kaydka alaabta (inventory value)\n• Qalabka (equipment)\n\n**Daynta:**\n• Vendor-yada lacag la leeyahay\n• Loan-nada\n\n**Milkiilaha:**\n• Capital-ka\n• Faa\'iidada la keydiyay' },
  { keywords: ['cash flow', 'lacag socodka', 'cashflow'], title: 'Cash Flow', content: 'Cash Flow — Socodka Lacagta:\n\nWaxay muujinaysaa lacagta:\n• **Soo gashay** — iibka, collections\n• **Ka baxday** — purchases, mushaar, kharash\n\n💡 Faa\'iido jirta laakiin cash flow xun = dhib!\nSababtuna: dayn badan oo aan la ururinin.\n\nDashboard-ka Cash Flow chart-ka ka eeg.' },
  { keywords: ['tax', 'canshuur', 'vat', 'cashuur', 'canshuur sidee'], title: 'Canshuurta (Tax)', content: 'Canshuurta — Tax/VAT:\n\n📊 **Qaabka:**\nIib kasta → canshuur % ayaa lagu daraa\nTusaale: $100 iib + 15% tax = $115\n\n**Settings-ka:**\n1. Tax rate-ka geli (tusaale: 15%)\n2. Tax type dooro (VAT, Sales Tax)\n3. Auto-calculate enable garee\n\nRasiidka canshuurta wuu ku muuqdaa.' },
];

// Seasonal/temporal business advice
export const seasonalAdvice: Record<string, string> = {
  ramadan: '🌙 **Talo Ramadan:**\n• Alaab badan soo dalbo (timir, caano, bariis)\n• Qiimaha ha kor u qaadin — macaamiisha ha waayinin\n• Cashier-yada ku dar POS-ka — dadku waa tiro badan yihiin\n• Promotion samee alaabta badan\n• Working hours beddel (subax iyo fidkii)',
  ciid: '🎉 **Talo Ciidda:**\n• Dharka iyo kabaha soo dalbo (alaab cusub)\n• Hadiyad/Gift cards samayso\n• Promo/discount samee\n• Shaqaalaha bonus sii',
  dugsi: '📚 **Talo Xilliga Dugsiga:**\n• School supplies soo dalbo\n• Buugaag, qalin, daftar\n• Bundle/package deals samee\n• Parent-yada discount sii haddii caruur badan iibsadaan',
};
