'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Camera, CheckCircle2, Loader2, Plus, Receipt, Trash2, UserPlus, Search, Upload } from 'lucide-react';
import MiniAppBottomNav from '../MiniAppBottomNav';

type Product = { id: string; name: string; sku?: string; inStock: number; sellingPrice: number; unit?: string };
type Customer = { id: string; name: string; phone?: string | null; phoneNumber?: string | null };
type Account = { id: string; name: string; balance: number; currency?: string };
type Item = { productId: string; productName: string; quantity: number; unitPrice: number; customerId?: string; customerName?: string | null; customerPhone?: string | null; ocrCustomerName?: string | null; customerCorrectionConfirmed?: boolean };
type IncomingPayment = { id: string; accountId: string; accountName: string; provider: string; providerReference: string; senderName?: string | null; senderPhone?: string | null; amount: number; allocatedAmount: number; availableAmount: number; receivedAt: string };
const blankSaleItem = (): Item => ({ productId: '', productName: '', quantity: 1, unitPrice: 0 });

async function readJson(response: Response) {
  const text = await response.text();
  try { return text ? JSON.parse(text) : { error: `Server error (${response.status})` }; }
  catch { return { error: `Server error (${response.status})` }; }
}

function normalizeLookup(value: unknown) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9\u00c0-\u024f\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function findCustomer(customers: Customer[], name: string, phone?: string | null) {
  const normalizedPhone = String(phone || '').replace(/\D/g, '');
  if (normalizedPhone) {
    const byPhone = customers.find(customer => [customer.phone, customer.phoneNumber]
      .some(value => String(value || '').replace(/\D/g, '') === normalizedPhone));
    if (byPhone) return byPhone;
  }
  const wanted = normalizeLookup(name);
  return customers.find(customer => normalizeLookup(customer.name) === wanted);
}

function getTelegramInitData() {
  return typeof window !== 'undefined' ? String((window as any).Telegram?.WebApp?.initData || '') : '';
}

export default function TelegramSalesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [incomingPayments, setIncomingPayments] = useState<IncomingPayment[]>([]);
  const [paymentAllocations, setPaymentAllocations] = useState<Array<{ incomingPaymentId: string; amount: number }>>([]);
  const [showAllIncoming, setShowAllIncoming] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paidAmount, setPaidAmount] = useState('');
  const [items, setItems] = useState<Item[]>([blankSaleItem()]);
  const [receiptUrl, setReceiptUrl] = useState('');
  const [receiptHash, setReceiptHash] = useState('');
  const [recognizedCustomerName, setRecognizedCustomerName] = useState('');
  const [customerCorrectionConfirmed, setCustomerCorrectionConfirmed] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerCompany, setNewCustomerCompany] = useState('');
  const [customerRegistrationSourceName, setCustomerRegistrationSourceName] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const total = useMemo(() => items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0), [items]);
  const selectedPaymentTotal = useMemo(() => paymentAllocations.reduce((sum, allocation) => sum + allocation.amount, 0), [paymentAllocations]);
  const visibleIncomingPayments = useMemo(() => incomingPayments.filter(payment => showAllIncoming || !accountId || payment.accountId === accountId), [incomingPayments, showAllIncoming, accountId]);
  const phoneRequiredForCredit = paymentMethod === 'CREDIT'
    || (paidAmount.trim() !== '' && Number(paidAmount) + 0.001 < total)
    || (paymentAllocations.length > 0 && selectedPaymentTotal + 0.001 < total);

  const loadSalesData = async () => {
    try { const response = await fetch('/api/telegram/sales', { cache: 'no-store' }); const data = await readJson(response); if (!response.ok) throw new Error(data.error || 'Sales data lama soo qaadin.'); setProducts(data.products || []); setCustomers(data.customers || []); setAccounts(data.accounts || []); setIncomingPayments(data.incomingPayments || []); if (!accountId && data.accounts?.[0]) setAccountId(data.accounts[0].id); } catch (error: any) { setMessage(error.message); } finally { setLoading(false); }
  };
  useEffect(() => { void loadSalesData(); }, []);

  const toggleIncomingPayment = (payment: IncomingPayment) => {
    setPaymentAllocations(current => current.some(item => item.incomingPaymentId === payment.id)
      ? current.filter(item => item.incomingPaymentId !== payment.id)
      : [...current, { incomingPaymentId: payment.id, amount: Math.min(payment.availableAmount, Math.max(0, total - current.reduce((sum, item) => sum + item.amount, 0))) || payment.availableAmount }]);
  };
  const setAllocationAmount = (payment: IncomingPayment, value: number) => setPaymentAllocations(current => current.map(item => item.incomingPaymentId === payment.id ? { ...item, amount: Math.max(0, Math.min(payment.availableAmount, value || 0)) } : item));

  const addProduct = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    setItems(current => {
      const emptyIndex = current.findIndex(item => !item.productId && !item.productName);
      const next = { productId: product.id, productName: product.name, quantity: 1, unitPrice: product.sellingPrice || 0, customerId };
      return emptyIndex >= 0 ? current.map((item, index) => index === emptyIndex ? next : item) : [...current, next];
    });
  };

  const lookupEbirrName = async () => {
    if (!newCustomerPhone.trim()) return setMessage('Marka hore geli lambarka customer-ka.');
    setLookupLoading(true);
    try { const response = await fetch('/api/telegram/customers/lookup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: newCustomerPhone }) }); const data = await readJson(response); if (!response.ok) throw new Error(data.error); if (!data.name) throw new Error('Magac E-Birr ah lama helin.'); setNewCustomerName(data.name); setMessage('Magaca E-Birr waa la helay. Hubi ka hor save.'); } catch (error: any) { setMessage(error.message || 'E-Birr lookup wuu fashilmay.'); } finally { setLookupLoading(false); }
  };

  const createCustomer = async () => {
    if (!newCustomerName.trim()) return setMessage('Magaca customer-ka waa qasab.');
    if (phoneRequiredForCredit && !newCustomerPhone.trim()) return setMessage('Iibka daynta/credit-ka lambarka customer-ku waa khasab.');
    try { const response = await fetch('/api/telegram/customers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ initData: getTelegramInitData(), name: newCustomerName, phone: newCustomerPhone, companyName: newCustomerCompany }) }); const data = await readJson(response); if (!response.ok) throw new Error(data.error); const customer = data.customer; setCustomers(current => [...current.filter(c => c.id !== customer.id), customer].sort((a, b) => a.name.localeCompare(b.name))); setCustomerId(customer.id); setItems(current => current.map(item => item.ocrCustomerName && [customer.name, recognizedCustomerName, customerRegistrationSourceName].some(source => source && normalizeLookup(item.ocrCustomerName) === normalizeLookup(source)) ? { ...item, customerId: customer.id, customerName: null, customerCorrectionConfirmed: normalizeLookup(item.ocrCustomerName) !== normalizeLookup(customer.name) } : item)); if (recognizedCustomerName && normalizeLookup(recognizedCustomerName) !== normalizeLookup(customer.name)) setCustomerCorrectionConfirmed(true); setShowCustomerForm(false); setNewCustomerName(''); setNewCustomerPhone(''); setNewCustomerCompany(''); setCustomerRegistrationSourceName(''); setMessage(data.created ? 'Customer cusub waa la kaydiyey.' : 'Customer-kii hore ayaa la doortay.'); } catch (error: any) { setMessage(error.message || 'Customer lama kaydin.'); }
  };

  const scanReceipt = async (file: File) => {
    setScanning(true); setMessage('Rasiidka AI ayaa akhrinaya...');
    const form = new FormData(); form.append('receiptFile', file);
    try {
      const response = await fetch('/api/telegram/sales/scan-receipt', { method: 'POST', body: form });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data.error);
      const scan = data.data || {};
      setReceiptUrl(data.receiptUrl || '');
      setReceiptHash(data.receiptHash || '');
      let receiptCustomerId = customerId;
      let receiptCustomerName = '';
      let receiptCustomerPhone = '';
      const globalRawCustomerName = String(scan.customerName || '').trim();
      setRecognizedCustomerName(globalRawCustomerName);
      setCustomerCorrectionConfirmed(false);

      if (scan.customerType === 'WALK_IN' || !scan.customerName) {
        setCustomerId('');
        receiptCustomerId = '';
        if (scan.totalAmount !== null && scan.totalAmount !== undefined) {
          setPaidAmount(String(scan.totalAmount));
          setPaymentMethod('CASH');
        }
      } else {
        const existingCustomer = customers.find(customer => customer.id === scan.matchedCustomerId)
          || findCustomer(customers, scan.customerName, scan.customerPhone);
        if (existingCustomer) { setCustomerId(existingCustomer.id); receiptCustomerId = existingCustomer.id; }
        else if (scan.requiresCustomerRegistration) {
          setCustomerId('');
          receiptCustomerId = '';
          receiptCustomerName = String(scan.customerName || '');
          receiptCustomerPhone = String(scan.customerPhone || '');
          setNewCustomerName(scan.customerName);
          setNewCustomerPhone(scan.customerPhone || '');
          setCustomerRegistrationSourceName(globalRawCustomerName);
          setShowCustomerForm(true);
          setMessage('Magac macmiil ayaa rasiidka laga helay, database-kana lagama waafajin. Xaqiiji/diiwaangeli magaca; lambarku cash iibka waa ikhtiyaari.');
        }
      }

      if (scan.items?.length) {
        setItems(scan.items.map((item: any) => {
          const matched = products.find(product => product.id === item.matchedProductId)
            || products.find(product => normalizeLookup(product.name) === normalizeLookup(item.matchedProductName || item.productName));
          const lineCustomerName = String(item.customerName || receiptCustomerName || globalRawCustomerName).trim();
          const lineCustomer = customers.find(customer => customer.id === item.matchedCustomerId)
            || (lineCustomerName ? findCustomer(customers, lineCustomerName, item.customerPhone) : null);
          return { productId: matched?.id || '', productName: matched?.name || item.productName || '', quantity: Number(item.quantity) || 1, unitPrice: Number(item.unitPrice) || 0, customerId: lineCustomer?.id || (lineCustomerName ? '' : receiptCustomerId), customerName: lineCustomer ? null : lineCustomerName || null, customerPhone: item.customerPhone || receiptCustomerPhone || null, ocrCustomerName: lineCustomerName || null, customerCorrectionConfirmed: false };
        }));
      }
      if (scan.accountName) {
        const matchedAccount = accounts.find(account => normalizeLookup(account.name).includes(normalizeLookup(scan.accountName)) || normalizeLookup(scan.accountName).includes(normalizeLookup(account.name)));
        if (matchedAccount) setAccountId(matchedAccount.id);
      }
      if (scan.paidAmount !== null && scan.paidAmount !== undefined) setPaidAmount(String(scan.paidAmount));
      else if (scan.paymentMethod === 'CREDIT') setPaidAmount('0');
      else setPaidAmount('');
      if (scan.paymentMethod) setPaymentMethod(scan.paymentMethod);
      else setPaymentMethod('CASH');
      const warnings = [...(scan.warnings || [])];
      if (data.receiptWarning) warnings.push(`${data.receiptWarning} AI scan-ku wuu shaqeeyey; si rasiidka loo kaydiyo si joogto ah, BLOB_READ_WRITE_TOKEN waa in Vercel lagu dejiyo.`);
      setMessage(warnings.length ? `Scan waa la dhammeeyay, hubi xogta: ${warnings.join(' ')}` : 'Rasiidka waa la akhriyey oo form-ka waa la buuxiyay. Hubi ka hor Save Sale.');
    } catch (error: any) { setMessage(error.message || 'Scan-ku wuu fashilmay.'); } finally { setScanning(false); }
  };

  const saveSale = async () => {
    if (items.some(item => item.customerName && !item.customerId)) return setMessage('Rasiidka waxaa ku jira customer cusub. Ka samee customer-ka (+), ku qor lambarkiisa saxda ah, kadib mar kale kaydi.');
    const saleItems = items.filter(item => item.productId || item.productName.trim());
    if (!saleItems.length || saleItems.some(item => !item.productId || item.quantity <= 0 || item.unitPrice <= 0)) return setMessage('Saf kasta ku dooro product-ka system-ka, geli qty iyo qiime sax ah. Product cusub marka hore Products-ka ka diiwaangeli si stock-gu u xisaabtamo.');
    if (paymentAllocations.length && selectedPaymentTotal > total + 0.001) return setMessage('Lacagta la dooratay kama badnaan karto total-ka sale-ka.');
    setSaving(true); setMessage('Sale-ka waa la kaydinayaa...');
    try { const defaultPaid = paymentMethod === 'CREDIT' ? 0 : total; const customerCorrections = [
      ...(customerCorrectionConfirmed && recognizedCustomerName && customerId ? [{ observedName: recognizedCustomerName, customerId }] : []),
      ...saleItems.filter(item => item.customerCorrectionConfirmed && item.ocrCustomerName && item.customerId).map(item => ({ observedName: item.ocrCustomerName, customerId: item.customerId }))
    ]; const response = await fetch('/api/telegram/sales', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ initData: getTelegramInitData(), customerId: customerId || null, accountId: accountId || null, paymentMethod, paidAmount: paymentAllocations.length ? selectedPaymentTotal : (paidAmount.trim() === '' ? defaultPaid : Number(paidAmount)), paymentAllocations, items: saleItems, customerCorrections, receiptUrl, receiptHash }) }); const data = await readJson(response); if (!response.ok) throw new Error(data.error); const savedSales = data.sales || [data.sale]; setMessage(savedSales.length > 1 ? `Iibka waa la kaydiyey ${savedSales.length} customer: ${savedSales.map((sale: any) => sale.invoiceNumber).join(', ')}` : 'Sale waa la kaydiyey: ' + data.sale.invoiceNumber); setItems([blankSaleItem()]); setPaidAmount(''); setPaymentAllocations([]); setReceiptUrl(''); setReceiptHash(''); setRecognizedCustomerName(''); setCustomerCorrectionConfirmed(false); await loadSalesData(); } catch (error: any) { setMessage(error.message || 'Sale lama kaydin.'); } finally { setSaving(false); }
  };

  return <main className="min-h-screen bg-[#020617] text-slate-100 px-4 py-4 pb-28 font-sans"><div className="mx-auto max-w-md space-y-4">
    <header className="flex items-center justify-between rounded-3xl border border-white/15 bg-slate-900/70 p-4 shadow-[0_0_25px_rgba(0,0,0,.35)]"><button onClick={() => window.location.href = '/telegram-mini-app'} className="rounded-full border border-white/20 bg-white/10 p-2"><ArrowLeft size={19} /></button><div className="text-center"><p className="text-xs font-black tracking-wider">AN-INDUSTRY TERMINAL</p><p className="text-[11px] font-bold text-slate-400">Sales & Receipt Scan</p></div><Receipt className="text-cyan-300" size={22} /></header>
    {message && <div className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-3 text-xs font-bold text-cyan-100">{message}</div>}
    <section className="rounded-3xl border border-cyan-400/30 bg-slate-900/70 p-4 space-y-3"><div className="flex items-center justify-between"><h1 className="text-lg font-black">New Sale</h1><span className="text-xs font-black text-cyan-300">{total.toLocaleString()} ETB</span></div>
      <div className="block text-[10px] font-black uppercase text-slate-400"><div className="flex items-center justify-between"><span>Customer</span><button type="button" title="New customer" onClick={() => setShowCustomerForm(true)} className="flex h-6 w-6 items-center justify-center rounded-full border border-cyan-300/50 bg-cyan-500/10 text-cyan-200"><UserPlus size={13} /></button></div><select value={customerId} onChange={e => { setCustomerId(e.target.value); if (recognizedCustomerName) setCustomerCorrectionConfirmed(true); }} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-sm"><option value="">Walk-in customer</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` · ${c.phone}` : ''}</option>)}</select></div>
      {recognizedCustomerName && customerId && normalizeLookup(recognizedCustomerName) !== normalizeLookup(customers.find(customer => customer.id === customerId)?.name) && <div className="rounded-xl border border-amber-300/30 bg-amber-500/10 p-3 text-[10px] font-bold text-amber-100"><p>Qoraalka rasiidka: <strong>{recognizedCustomerName}</strong> · system-ku wuxuu u waafajiyey <strong>{customers.find(customer => customer.id === customerId)?.name}</strong>. Hubi magaca.</p><button type="button" onClick={() => setCustomerCorrectionConfirmed(true)} className={`mt-2 rounded-lg px-3 py-2 font-black ${customerCorrectionConfirmed ? 'bg-emerald-500/20 text-emerald-200' : 'bg-slate-950 text-amber-100'}`}>{customerCorrectionConfirmed ? 'Sixitaanka waa la xafidayaa' : 'Xaqiiji si scan-ku u barto'}</button></div>}
      <div className="space-y-2">
        <div className="flex items-center justify-between"><p className="text-[10px] font-black uppercase text-slate-400">Products · Qty · Price · Total</p><button type="button" onClick={() => setItems(current => [...current, blankSaleItem()])} className="inline-flex items-center gap-1 rounded-lg border border-cyan-300/30 px-2 py-1 text-[10px] font-black text-cyan-200"><Plus size={13} /> Add row</button></div>
        {items.map((item, index) => <div key={`${item.productId}-${index}`} className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-2">
          <div className="flex items-center justify-between"><span className="text-[9px] font-black uppercase text-slate-500">Item {index + 1}</span><button type="button" aria-label="Remove product" onClick={() => setItems(current => current.length > 1 ? current.filter((_, i) => i !== index) : [blankSaleItem()])} className="rounded-md p-1 text-rose-300"><Trash2 size={14} /></button></div>
          <label className="block text-[9px] font-black uppercase text-slate-400">Product<select value={item.productId} onChange={e => { const product = products.find(p => p.id === e.target.value); setItems(current => current.map((x, i) => i === index ? { ...x, productId: product?.id || '', productName: product?.name || '', unitPrice: product?.sellingPrice || 0 } : x)); }} disabled={loading} className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 p-2.5 text-xs normal-case text-white"><option value="">{loading ? 'Loading products…' : item.productName ? `Not matched: ${item.productName} — choose product` : 'Choose product'}</option>{products.map(p => <option key={p.id} value={p.id}>{p.name} · {p.inStock} in stock</option>)}</select></label>
          <div className="grid grid-cols-3 gap-2"><label className="text-[9px] font-black uppercase text-slate-400">Qty<input aria-label="Quantity" type="number" min="1" step="1" value={item.quantity || ''} onChange={e => setItems(current => current.map((x, i) => i === index ? { ...x, quantity: Number(e.target.value) } : x))} className="mt-1 w-full rounded-lg bg-slate-950 p-2 text-xs text-white" /></label><label className="text-[9px] font-black uppercase text-slate-400">Price<input aria-label="Unit price" type="number" min="0" step="0.01" value={item.unitPrice || ''} onChange={e => setItems(current => current.map((x, i) => i === index ? { ...x, unitPrice: Number(e.target.value) } : x))} className="mt-1 w-full rounded-lg bg-slate-950 p-2 text-xs text-white" /></label><div className="text-[9px] font-black uppercase text-slate-400">Total<div className="mt-1 rounded-lg border border-emerald-300/20 bg-emerald-500/10 p-2 text-xs font-black text-emerald-200">{(item.quantity * item.unitPrice).toLocaleString()} ETB</div></div></div>
          {item.customerName && !item.customerId && <button type="button" onClick={() => { setNewCustomerName(item.customerName || ''); setNewCustomerPhone(item.customerPhone || ''); setCustomerRegistrationSourceName(item.ocrCustomerName || item.customerName || ''); setShowCustomerForm(true); }} className="w-full rounded-lg border border-amber-300/30 bg-amber-500/10 p-2 text-left text-[10px] font-black text-amber-200">Customer cusub: {item.customerName} · xaqiiji magaca (+)</button>}
          {item.ocrCustomerName && item.customerId && normalizeLookup(item.ocrCustomerName) !== normalizeLookup(customers.find(customer => customer.id === item.customerId)?.name) && <button type="button" onClick={() => setItems(current => current.map((x, i) => i === index ? { ...x, customerCorrectionConfirmed: true } : x))} className="w-full rounded-lg border border-amber-300/30 bg-amber-500/10 p-2 text-left text-[9px] font-bold text-amber-100">Rasiidka: “{item.ocrCustomerName}” → {customers.find(customer => customer.id === item.customerId)?.name}. {item.customerCorrectionConfirmed ? 'Sixitaanka waa la xafidayaa.' : 'Xaqiiji si AI-gu u barto.'}</button>}
          <label className="block text-[9px] font-black uppercase text-slate-500">Customer for this item<select value={item.customerId || ''} onChange={e => setItems(current => current.map((x, i) => i === index ? { ...x, customerId: e.target.value, customerName: null, customerCorrectionConfirmed: Boolean(x.ocrCustomerName) } : x))} className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 p-2 text-[11px] normal-case text-white"><option value="">Use selected customer / Walk-in</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` · ${c.phone}` : ''}</option>)}</select></label>
        </div>)}
      </div>
      <label className="block text-[10px] font-black uppercase text-slate-400">Account<select value={accountId} onChange={e => setAccountId(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-sm"><option value="">No account / credit</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.name} · {a.balance.toLocaleString()} ETB</option>)}</select></label>
      <section className="rounded-2xl border border-amber-300/20 bg-amber-400/5 p-3 space-y-2"><div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase text-amber-200">Incoming payments</p><p className="text-[10px] text-slate-400">Lacag account-ka hore u soo gashay</p></div><button type="button" onClick={() => setShowAllIncoming(value => !value)} className="rounded-lg border border-amber-300/30 px-2 py-1 text-[10px] font-black text-amber-100">{showAllIncoming ? 'Account-kan keliya' : 'All accounts / Split'}</button></div>
        {visibleIncomingPayments.length === 0 ? <p className="rounded-xl bg-slate-950/60 p-2 text-[10px] font-bold text-slate-500">Lacag aan weli loo meeleyn account-kan kama jirto.</p> : visibleIncomingPayments.map(payment => { const selected = paymentAllocations.find(item => item.incomingPaymentId === payment.id); return <div key={payment.id} className="rounded-xl border border-white/10 bg-slate-950/70 p-2"><label className="flex cursor-pointer items-start gap-2"><input type="checkbox" checked={Boolean(selected)} onChange={() => toggleIncomingPayment(payment)} className="mt-1 accent-emerald-400" /><span className="min-w-0 flex-1"><span className="flex justify-between gap-2 text-[11px] font-black text-white"><span className="truncate">{payment.senderName || payment.senderPhone || 'Unknown sender'}</span><span className="shrink-0 text-emerald-300">{payment.availableAmount.toLocaleString()} ETB</span></span><span className="block truncate text-[9px] font-bold text-slate-400">{payment.provider} · {payment.accountName} · {payment.providerReference}</span></span></label>{selected && <input type="number" min="0" max={payment.availableAmount} value={selected.amount} onChange={e => setAllocationAmount(payment, Number(e.target.value))} className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900 p-2 text-xs font-bold text-white" />}</div>; })}
        {paymentAllocations.length > 0 && <p className="text-[10px] font-black text-emerald-300">Selected / la meeleynayo: {selectedPaymentTotal.toLocaleString()} ETB · Balance mar labaad laguma darayo.</p>}
      </section>
      <div className="grid grid-cols-2 gap-2"><label className="block text-[10px] font-black uppercase text-slate-400">Payment<select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-sm"><option value="CASH">Cash</option><option value="CREDIT">Credit</option><option value="PARTIAL">Partial</option></select></label><label className="block text-[10px] font-black uppercase text-slate-400">Paid amount<input type="number" min="0" value={paymentAllocations.length ? selectedPaymentTotal : paidAmount} onChange={e => setPaidAmount(e.target.value)} disabled={paymentAllocations.length > 0} placeholder={String(total)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-sm disabled:opacity-60" /></label></div>
      <div className="grid grid-cols-2 gap-2"><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => cameraInputRef.current?.click()} disabled={scanning} className="flex min-h-[52px] items-center justify-center gap-1.5 rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-2 text-[10px] font-black text-cyan-200 disabled:opacity-50"><Camera size={15} />{scanning ? 'Scanning...' : 'Take Photo'}</button><button type="button" onClick={() => uploadInputRef.current?.click()} disabled={scanning} className="flex min-h-[52px] items-center justify-center gap-1.5 rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-2 text-[10px] font-black text-cyan-200 disabled:opacity-50"><Upload size={15} />Upload File</button><input ref={cameraInputRef} type="file" accept="image/png,image/jpeg,image/webp" capture="environment" className="hidden" disabled={scanning} onChange={e => e.target.files?.[0] && scanReceipt(e.target.files[0])} /><input ref={uploadInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" disabled={scanning} onChange={e => e.target.files?.[0] && scanReceipt(e.target.files[0])} /></div><button onClick={saveSale} disabled={saving || scanning} className="flex items-center justify-center gap-2 rounded-xl bg-emerald-400 p-3 text-xs font-black text-slate-950 disabled:opacity-50">{saving ? <Loader2 className="animate-spin" size={15} /> : <CheckCircle2 size={15} />} Save Sale</button></div>
    </section>
    <p className="text-center text-[10px] font-bold text-slate-500">AI scan wuxuu buuxiyaa xogta, laakiin hubi product-ka iyo amount-ka ka hor kaydinta.</p>
    {showCustomerForm && <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/80 p-3 backdrop-blur-sm"><div className="w-full max-w-md space-y-3 rounded-3xl border border-cyan-400/30 bg-slate-900 p-5 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-base font-black text-white">New Customer</h2><button type="button" onClick={() => setShowCustomerForm(false)} className="text-xs font-black text-slate-400">CLOSE</button></div><input value={newCustomerPhone} onChange={e => setNewCustomerPhone(e.target.value)} required={phoneRequiredForCredit} placeholder={phoneRequiredForCredit ? 'Phone / E-Birr number (required for credit)' : 'Phone / E-Birr number (optional)'} className="w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-sm text-white" /><button type="button" onClick={lookupEbirrName} disabled={lookupLoading || !newCustomerPhone.trim()} className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-3 text-xs font-black text-cyan-200 disabled:opacity-50">{lookupLoading ? <Loader2 className="animate-spin" size={14} /> : <Search size={14} />} Lookup E-Birr name</button><input value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} placeholder="Customer name" className="w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-sm text-white" /><input value={newCustomerCompany} onChange={e => setNewCustomerCompany(e.target.value)} placeholder="Company (optional)" className="w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-sm text-white" /><button type="button" onClick={createCustomer} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 p-3 text-xs font-black text-slate-950"><Plus size={15} /> Save Customer</button><p className="text-[10px] font-bold text-slate-500">Telefoonku waa optional cash iibka, laakiin dayn/credit marka la sameeyo waa khasab. E-Birr lookup wuxuu shaqaynayaa marka API-ga la habeeyo.</p></div></div>}
  </div><MiniAppBottomNav active="SALES" /></main>;
}
