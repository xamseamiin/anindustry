'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  X, Send, Sparkles, Maximize2, Minimize2, Loader2,
  Trash2, Bot, CheckCircle2, AlertTriangle, XCircle,
  UserPlus, Package, Users, TrendingUp, RefreshCw, Mic, MicOff, Image as ImageIcon, Paperclip, XCircle as CloseIcon, MousePointerClick
} from 'lucide-react';
import UpgradeCreditsModal from './UpgradeCreditsModal';

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  image?: string;
  timestamp: Date;
  isStreaming?: boolean;
  actionType?: 'created' | 'duplicate' | 'adjusted' | 'error' | 'data' | null;
  actionData?: any;
  executedTools?: any[];
}

export default function ShopAiChat() {
  const { data: session } = useSession();
  const router = useRouter();
  const userName = session?.user?.name?.split(' ')[0] || '';

  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [activeTable, setActiveTable] = useState<any[] | null>(null);

  // Credit System State
  const [scanCredits, setScanCredits] = useState<number | null>(null);
  const [scanPlan, setScanPlan] = useState<string>('FREE_TRIAL');
  const [creditPackages, setCreditPackages] = useState<any[]>([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSelectingElement, setIsSelectingElement] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchCredits = async () => {
    try {
      const res = await fetch('/api/shop/scan-credits');
      if (res.ok) {
        const data = await res.json();
        setScanCredits(data.credits);
        setScanPlan(data.plan || 'FREE_TRIAL');
        setCreditPackages(data.packages || []);
      }
    } catch (error) {
      console.error('Failed to fetch credits:', error);
    }
  };

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);
  useEffect(() => { 
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
      fetchCredits();
    } else {
      setIsSelectingElement(false); // disable selector when closing
    }
  }, [isOpen]);

  // Screen Element Selector Logic
  useEffect(() => {
    if (!isSelectingElement) {
      document.body.style.cursor = 'default';
      return;
    }

    document.body.style.cursor = 'crosshair';

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.shop-ai-chat-window')) return;
      target.style.outline = '2px dashed #3498DB';
      target.style.outlineOffset = '2px';
      target.style.backgroundColor = 'rgba(52, 152, 219, 0.1)';
      target.style.borderRadius = '4px';
      target.style.transition = 'all 0.15s ease';
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      target.style.outline = '';
      target.style.outlineOffset = '';
      target.style.backgroundColor = '';
      target.style.borderRadius = '';
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.shop-ai-chat-window')) return;
      
      e.preventDefault();
      e.stopPropagation();

      let contextText = target.innerText || target.getAttribute('aria-label') || target.getAttribute('placeholder') || target.getAttribute('title') || '';
      
      if (contextText.length < 5 && target.parentElement) {
         contextText = target.parentElement.innerText || contextText;
      }

      if (contextText.length > 300) {
          contextText = contextText.substring(0, 300) + '...';
      }

      if (contextText.trim()) {
        setInput(`Fadlan iibaro qaybtan maxaa loo isticmaalaa? "${contextText.trim().replace(/\n/g, ' ')}"`);
      }

      // Cleanup visually
      target.style.outline = '';
      target.style.outlineOffset = '';
      target.style.backgroundColor = '';
      target.style.borderRadius = '';
      setIsSelectingElement(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);
    document.addEventListener('click', handleClick, { capture: true });

    return () => {
      document.body.style.cursor = 'default';
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      document.removeEventListener('click', handleClick, { capture: true });
      
      const elements = document.querySelectorAll('*');
      elements.forEach((el) => {
        const hEl = el as HTMLElement;
        if (hEl.style.outline === '2px dashed rgb(52, 152, 219)' || hEl.style.outline === '2px dashed #3498DB') {
            hEl.style.outline = '';
            hEl.style.outlineOffset = '';
            hEl.style.backgroundColor = '';
            hEl.style.borderRadius = '';
        }
      });
    };
  }, [isSelectingElement]);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome', role: 'ai', timestamp: new Date(),
        text: ''
      }]);
    }
  }, [messages.length]);

  // Action detection is now primarily handled via backend
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert("Fadlan sawir kaliya soo gali.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const sendMessage = async (directText?: string) => {
    const text = (directText || input).trim();
    if ((!text && !selectedImage) || isTyping) return;

    const userMsg: ChatMessage = { 
      id: `u_${Date.now()}`, 
      role: 'user', 
      text: text || (selectedImage ? "[Sawir]" : ""), 
      image: selectedImage || undefined,
      timestamp: new Date() 
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    const currentImage = selectedImage;
    setSelectedImage(null);
    setIsTyping(true);

    const aiMsgId = `ai_${Date.now()}`;
    setMessages(prev => [...prev, { id: aiMsgId, role: 'ai', text: '', timestamp: new Date(), isStreaming: true }]);

    try {
      const res = await fetch('/api/shop/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: text, 
          image: currentImage,
          sessionId 
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'AI server error' }));
        if (err.error === 'NO_CREDITS') {
            setShowUpgradeModal(true);
            setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: '⚠️ Credits dhammaadeen. Fadlan upgrade samee si aad u sii isticmaasho Revlo AI.', isStreaming: false, actionType: 'error' } : m));
            setScanCredits(0);
        } else {
            setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: `⚠️ ${err.error || 'Khalad ayaa dhacay.'}`, isStreaming: false, actionType: 'error' } : m));
        }
        setIsTyping(false);
        return;
      }

      // Deduct credit locally for instant feedback
      setScanCredits(prev => (prev !== null && prev > 0 ? prev - 1 : prev));

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.error) fullText = `⚠️ ${data.error}`;
                else if (data.text) fullText += data.text;
                
                if (data.sessionId && !sessionId) {
                  setSessionId(data.sessionId);
                }

                if (data.done) {
                  const tools = data.executedTools || [];
                  let finalActionType = null;
                  let finalActionData = null;

                  // Generative UI evaluation based on true backend tool execution
                  if (tools.some((t: any) => ['create_customer', 'add_product', 'record_expense', 'create_sale', 'bulk_add_products'].includes(t.name))) {
                     const tool = tools.find((t: any) => ['create_customer', 'add_product', 'record_expense', 'create_sale', 'bulk_add_products'].includes(t.name));
                     if (tool.result?.success) {
                         finalActionType = 'created';
                         finalActionData = { message: tool.result.message || 'Waa la xareeyay' };
                     } else {
                         finalActionType = 'error';
                         finalActionData = { message: tool.result?.error || 'Khalad ayaa dhacay' };
                     }
                  } else if (tools.some((t: any) => ['advanced_search', 'get_low_stock_products', 'get_debtors'].includes(t.name))) {
                     finalActionType = 'data';
                     const tool = tools.find((t: any) => ['advanced_search', 'get_low_stock_products', 'get_debtors'].includes(t.name));
                     finalActionData = { name: tool.name, result: tool.result };
                  }

                  // Check for Interactive Table Tag
                  if (fullText.includes('[ACTION_TABLE:')) {
                    const match = fullText.match(/\[ACTION_TABLE:(.*?)\]/);
                    if (match && match[1]) {
                      try {
                        const tableData = JSON.parse(match[1]);
                        setActiveTable(tableData);
                        // Clean up text
                        fullText = fullText.replace(/\[ACTION_TABLE:.*?\]/, '');
                      } catch (e) { console.error("Table parse error", e); }
                    }
                  }

                  setMessages(prev => prev.map(m => m.id === aiMsgId ? {
                    ...m, text: fullText, isStreaming: false,
                    actionType: finalActionType as any || null,
                    actionData: finalActionData || null,
                    executedTools: tools
                  } : m));

                  // Auto-refresh page if action was a mutation
                  if (finalActionType === 'created') {
                    setTimeout(() => router.refresh(), 500);
                  }
                } else {
                  setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: fullText } : m));
                }
              } catch {}
            }
          }
        }
      }
      setMessages(prev => prev.map(m => m.id === aiMsgId && m.isStreaming ? { ...m, isStreaming: false } : m));
    } catch (err: any) {
      setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: '⚠️ AI server-ka lama xiriiri karo.', isStreaming: false, actionType: 'error' } : m));
    }
    setIsTyping(false);
  };

  const clearChat = async () => {
    setMessages([]);
    try { await fetch(`http://localhost:8000/history/${sessionId}`, { method: 'DELETE' }); } catch {}
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser-kaaga ma taageero Voice Recognition.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'so-SO'; 
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      
      if (event.error === 'not-allowed') {
        alert("Microphone-ka waa la diiday. Fadlan hubi inuu 'Allow' yahay settings-ka browser-ka, ka dibna bogga refresh garee.");
      } else if (event.error === 'network') {
        alert("Internet-kaaga ayaa aad u daciif ah, Voice-ku ma shaqayn karo.");
      } else if (event.error === 'no-speech') {
        // Just stop
      } else {
        alert(`Cillad: ${event.error}. Fadlan mar kale isku day.`);
      }
    };
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    try {
      recognition.start();
    } catch (err) {
      console.error("Recognition start failed:", err);
      setIsListening(false);
    }
  };

  // ── Action Card & Generative UI ──
  const ActionCard = ({ type, text, data }: { type: string; text: string; data?: any }) => {
    // Render Generative Data Tables
    if (type === 'data' && data?.result) {
       if (data.name === 'get_debtors' && data.result.debtors?.length > 0) {
          return (
             <div className="mt-3 bg-white dark:bg-[#0f172a] rounded-xl overflow-hidden border border-gray-200/80 dark:border-gray-800 shadow-sm">
                 <div className="bg-gray-50/50 dark:bg-gray-900/50 px-3 py-2 border-b border-gray-100 dark:border-gray-800 font-bold text-[11px] text-gray-700 dark:text-gray-300">📊 Dadka Deynta Qaba</div>
                 <div className="max-h-40 overflow-y-auto scrollbar-thin">
                    <table className="w-full text-left text-[11px]">
                       <tbody>
                          {data.result.debtors.map((d: any, i: number) => (
                              <tr key={i} className="border-b border-gray-100 dark:border-gray-800/60 last:border-0">
                                 <td className="px-3 py-2 font-medium text-gray-800 dark:text-gray-200">{d.name}</td>
                                 <td className="px-3 py-2 text-right text-red-500 font-bold">ETB {d.owed.toLocaleString()}</td>
                              </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
             </div>
          );
       }
       if (data.name === 'advanced_search' && data.result?.results?.length > 0) {
          const items = data.result.results.slice(0, 5);
          return (
             <div className="mt-3 bg-white dark:bg-[#0f172a] rounded-xl overflow-hidden border border-gray-200/80 dark:border-gray-800 shadow-sm">
                 <div className="bg-gray-50/50 dark:bg-gray-900/50 px-3 py-2 border-b border-gray-100 dark:border-gray-800 font-bold text-[11px] text-gray-700 dark:text-gray-300 flex items-center justify-between">
                    <span>🔍 Natiijada Raadinta</span>
                    <span className="text-[9px] font-normal bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded">{data.result.results.length} La helay</span>
                 </div>
                 <div className="max-h-40 overflow-y-auto scrollbar-thin">
                    <table className="w-full text-left text-[11px]">
                       <tbody>
                          {items.map((item: any, i: number) => (
                              <tr key={i} className="border-b border-gray-100 dark:border-gray-800/60 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                 <td className="px-3 py-2 font-medium text-gray-800 dark:text-gray-200 truncate max-w-[120px]">{item.invoiceNumber || item.name}</td>
                                 <td className="px-3 py-2 text-right text-gray-500 dark:text-gray-400">{item.total ? `ETB ${item.total}` : (item.stock !== undefined ? `${item.stock} haray` : '')}</td>
                              </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
             </div>
          );
       }
       return null;
    }

    const configs: Record<string, { icon: any; bg: string; border: string; label: string; textColor: string }> = {
      created: { icon: CheckCircle2, bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', label: data?.message || '✅ Guul — Waa la xareeyay!', textColor: 'text-emerald-500 dark:text-emerald-400' },
      adjusted: { icon: RefreshCw, bg: 'bg-blue-500/10', border: 'border-blue-500/30', label: '🔄 Stock waa la beddelay!', textColor: 'text-blue-500 dark:text-blue-400' },
      duplicate: { icon: AlertTriangle, bg: 'bg-amber-500/10', border: 'border-amber-500/30', label: '⚠️ Horey ayuu u jiray', textColor: 'text-amber-500 dark:text-amber-400' },
      error: { icon: XCircle, bg: 'bg-red-500/10', border: 'border-red-500/30', label: data?.message || '❌ Khalad', textColor: 'text-red-500 dark:text-red-400' },
    };
    const config = configs[type] || configs.error;
    const Icon = config.icon;

    return (
      <div className={`mt-3 px-3 py-2.5 rounded-xl ${config.bg} border ${config.border} flex items-start gap-2.5 shadow-sm`}>
        <Icon size={16} className={`${config.textColor} mt-0.5 flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <p className={`text-[11px] font-bold ${config.textColor}`}>{config.label}</p>
          {type === 'created' && (
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 font-medium">Auto-refresh lagu sameeyay ✓</p>
          )}
        </div>
      </div>
    );
   };

   // ── Interactive Table Component ──
   const InteractiveTable = ({ data, onSave }: { data: any[]; onSave: (updatedData: any[]) => void }) => {
     const [tableItems, setTableItems] = useState(data);

     const updateItem = (index: number, field: string, value: any) => {
       const newItems = [...tableItems];
       newItems[index] = { ...newItems[index], [field]: value };
       setTableItems(newItems);
     };

     const applyMargin = (percentage: number) => {
       const newItems = tableItems.map(item => ({
         ...item,
         sellingPrice: Math.ceil((item.costPrice || 0) * (1 + percentage / 100))
       }));
       setTableItems(newItems);
     };

     return (
       <div className="mt-4 bg-white dark:bg-[#1e293b] rounded-2xl border border-blue-200 dark:border-blue-900 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
         <div className="bg-gradient-to-r from-[#3498DB] to-[#2980B9] px-4 py-3 flex items-center justify-between">
           <div className="flex items-center gap-2">
             <Package size={18} className="text-white" />
             <h4 className="text-white font-bold text-[13px]">Dhammaystir Xogta Alaabta</h4>
           </div>
           <div className="flex gap-2">
             <button onClick={() => applyMargin(30)} className="bg-white/20 hover:bg-white/30 text-white px-2 py-1 rounded-lg text-[10px] font-bold border border-white/20 transition-all">
               +30% Profit
             </button>
           </div>
         </div>
         <div className="max-h-[300px] overflow-y-auto scrollbar-thin">
           <table className="w-full text-left text-[12px]">
             <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 sticky top-0 z-10">
               <tr>
                 <th className="px-4 py-2.5 font-bold">Alaabta</th>
                 <th className="px-4 py-2.5 font-bold">Qiimaha Iibka (Selling)</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
               {tableItems.map((item, i) => (
                 <tr key={i} className="hover:bg-blue-50/30 dark:hover:bg-blue-500/5 transition-colors">
                   <td className="px-4 py-3">
                     <p className="font-bold text-gray-800 dark:text-gray-200">{item.name}</p>
                     <p className="text-[10px] text-gray-400">Cost: ETB {item.costPrice?.toLocaleString()}</p>
                   </td>
                   <td className="px-4 py-3">
                     <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">ETB</span>
                        <input 
                          type="number" 
                          value={item.sellingPrice || ''} 
                          onChange={(e) => updateItem(i, 'sellingPrice', parseFloat(e.target.value))}
                          placeholder="0.00"
                          className="w-full pl-10 pr-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold text-blue-600 dark:text-blue-400"
                        />
                     </div>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
         <div className="p-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
           <button 
             onClick={() => setActiveTable(null)}
             className="px-4 py-2 text-gray-500 hover:text-gray-700 font-bold text-[12px]"
           >
             Cancel
           </button>
           <button 
             onClick={() => onSave(tableItems)}
             className="px-6 py-2 bg-[#3498DB] hover:bg-[#2980B9] text-white rounded-xl font-bold text-[12px] shadow-lg shadow-blue-500/20 flex items-center gap-2"
           >
             <CheckCircle2 size={14} />
             Diiwaangeli
           </button>
         </div>
       </div>
     );
   };

  // ── Render markdown-like formatting ──
  const formatText = (text: string) => {
    return text.split('\n').map((line, i) => {
      let formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
      formatted = formatted.replace(/`(.*?)`/g, '<code class="bg-gray-700/50 px-1.5 py-0.5 rounded text-[11px] font-mono text-emerald-400">$1</code>');
      
      // Beautiful Links (Generative Buttons)
      formatted = formatted.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="mt-2 mb-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#3498DB]/10 to-[#2980B9]/10 border border-[#3498DB]/30 text-[#3498DB] dark:text-[#3498DB] font-bold rounded-lg text-[11px] hover:bg-[#3498DB] hover:text-white transition-all shadow-sm no-underline group">$1 <svg class="group-hover:translate-x-0.5 transition-transform" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg></a>');

      if (formatted.startsWith('• ') || formatted.startsWith('- ')) {
        formatted = `<span class="text-blue-400 mr-1">●</span>${formatted.slice(2)}`;
      }
      // Numbered list
      const numMatch = formatted.match(/^(\d+)\.\s/);
      if (numMatch) {
        formatted = `<span class="text-blue-400 font-bold mr-1">${numMatch[1]}.</span>${formatted.slice(numMatch[0].length)}`;
      }
      return <p key={i} className={`${line === '' ? 'h-2' : ''}`} dangerouslySetInnerHTML={{ __html: formatted }} />;
    });
  };

  // ── BUBBLE BUTTON ──
  if (!isOpen) {
    return (
      <button onClick={handleOpen}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-[#3498DB] to-[#2980B9] rounded-2xl shadow-2xl shadow-[#3498DB]/30 flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all group">
        <Sparkles size={24} className="group-hover:rotate-12 transition-transform" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#2ECC71] rounded-full animate-pulse" />
      </button>
    );
  }

  const chatWidth = isFullscreen ? 'fixed inset-4 z-50' : 'fixed bottom-6 right-6 z-50 w-[420px] h-[620px]';

  return (
    <div className={`shop-ai-chat-window ${chatWidth} flex flex-col bg-white dark:bg-[#0f172a] rounded-[24px] border border-gray-200/60 dark:border-gray-800/60 shadow-2xl shadow-black/20 dark:shadow-black/50 overflow-hidden ${isSelectingElement ? 'ring-4 ring-[#3498DB] shadow-[0_0_40px_rgba(52,152,219,0.3)] scale-[0.98] transition-all' : 'transition-all'}`}>

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-white dark:bg-[#0f172a] border-b border-gray-100 dark:border-gray-800/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#3498DB] to-[#2ECC71] flex items-center justify-center shadow-lg shadow-[#3498DB]/20">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-1.5">
              REVL<span className="text-[#2ECC71]">O</span> <span className="font-medium text-gray-400 dark:text-gray-500 text-xs">AI</span>
              <Sparkles size={11} className="text-amber-400" />
            </h3>
            <p className="text-[10px] text-[#2ECC71] font-bold">
              {isTyping ? 'Qorayaa...' : 'Online • Revlo AI'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowUpgradeModal(true)} className="px-2.5 py-1 bg-blue-50 dark:bg-blue-500/10 text-[#3498DB] rounded-lg text-[10px] font-bold border border-[#3498DB]/20 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all flex items-center gap-1 mr-2" title="AI Credits">
            <Sparkles size={10} />
            {scanCredits !== null ? scanCredits : <Loader2 size={10} className="animate-spin" />}
          </button>
          <button onClick={clearChat} className="p-2 text-gray-400 hover:text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-all" title="Nadiifi">
            <Trash2 size={14} />
          </button>
          <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2 text-gray-400 hover:text-[#3498DB] rounded-xl hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all">
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <button onClick={() => setIsOpen(false)} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* ── MESSAGES ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800 bg-gray-50/50 dark:bg-[#0b1120]">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            {msg.role === 'ai' && msg.id !== 'welcome' && (
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#3498DB]/15 to-[#2ECC71]/15 dark:from-[#3498DB]/20 dark:to-[#2ECC71]/20 flex items-center justify-center mr-2 mt-1 flex-shrink-0 border border-[#3498DB]/10">
                <Bot size={13} className="text-[#3498DB]" />
              </div>
            )}
            <div className={`max-w-[85%] rounded-2xl text-[13px] leading-relaxed ${
              msg.id === 'welcome'
                ? 'max-w-full w-full'
                : msg.role === 'user'
                ? 'bg-[#3498DB] text-white rounded-br-md px-4 py-3'
                : 'bg-white dark:bg-[#1a2236] text-gray-800 dark:text-gray-200 border border-gray-200/80 dark:border-gray-800/50 rounded-bl-md px-4 py-3 shadow-sm'
            }`}>
              {msg.id === 'welcome' ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white dark:bg-[#1a2236] rounded-2xl border border-gray-200/80 dark:border-gray-800/50 p-5 shadow-sm relative overflow-hidden">
                  {/* Background decoration */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#3498DB]/5 to-[#2ECC71]/5 rounded-full blur-2xl -mr-10 -mt-10" />
                  
                  <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-700/50 pb-4 relative">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#3498DB] to-[#2ECC71] flex items-center justify-center shadow-lg shadow-[#3498DB]/20 flex-shrink-0">
                      <Bot size={24} className="text-white" />
                    </div>
                    <div>
                      <h4 className="font-black text-gray-900 dark:text-white text-[15px]">Salaama, {userName}! 👋</h4>
                      <p className="text-[11px] text-[#3498DB] font-bold">Revlo AI — Caawiyahaaga Ganacsiga</p>
                    </div>
                  </div>
                  
                  <div className="text-[12px] text-gray-600 dark:text-gray-300 leading-relaxed relative">
                    Waxaan halkan u joogaa inaan kaa caawiyo falanqaynta xogta, maamulka alaabta, iyo dedejinta shaqooyinka. Hoos ka dooro waxaad u baahan tahay ama toos fariin iigu soo qor.
                  </div>

                  <div className="flex flex-col gap-1 mt-4 relative">
                    <button onClick={() => sendMessage("Imisa ayaan maanta iibiyay?")} className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all text-left group">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-[#3498DB] group-hover:bg-[#3498DB] group-hover:text-white transition-all shadow-sm">
                        <TrendingUp size={14} />
                      </div>
                      <div>
                        <p className="text-[12px] font-bold text-gray-900 dark:text-white group-hover:text-[#3498DB] transition-colors">Warbixinta Iibka</p>
                      </div>
                    </button>

                    <button onClick={() => sendMessage("Alaabta stock-keeda hooseeyay ii soo saar")} className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-all text-left group">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all shadow-sm">
                        <Package size={14} />
                      </div>
                      <div>
                        <p className="text-[12px] font-bold text-gray-900 dark:text-white group-hover:text-orange-500 transition-colors">Stock-ga Hooseeya</p>
                      </div>
                    </button>

                    <button onClick={() => setInput("Macaamiil cusub diwan geli: ")} className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all text-left group">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-[#2ECC71] group-hover:bg-[#2ECC71] group-hover:text-white transition-all shadow-sm">
                        <UserPlus size={14} />
                      </div>
                      <div>
                        <p className="text-[12px] font-bold text-gray-900 dark:text-white group-hover:text-[#2ECC71] transition-colors">Diiwaangeli Macaamiil</p>
                      </div>
                    </button>
                  </div>
                </div>
              ) : msg.role === 'ai' ? formatText(msg.text) : <p className="whitespace-pre-wrap">{msg.text}</p>}
              {msg.isStreaming && <span className="inline-block w-1.5 h-4 bg-[#3498DB] rounded-full animate-pulse ml-1 align-middle" />}
              {msg.image && <img src={msg.image} alt="AI Generated" className="mt-3 rounded-xl max-w-full border border-gray-200 dark:border-gray-700" />}
              {/* Action Card & Generative Data UI */}
              {msg.actionType && !msg.isStreaming && (
                <ActionCard type={msg.actionType} text={msg.text} data={msg.actionData} />
              )}
            </div>
          </div>
        ))}

        {isTyping && messages[messages.length - 1]?.text === '' && (
          <div className="flex items-center gap-2 px-2">
            <div className="w-7 h-7 rounded-xl bg-[#3498DB]/10 flex items-center justify-center">
              <Bot size={13} className="text-[#3498DB]" />
            </div>
            <div className="flex items-center gap-1.5 bg-white dark:bg-[#1a2236] px-4 py-3 rounded-2xl border border-gray-200/80 dark:border-gray-800/50 shadow-sm">
              <div className="w-2 h-2 bg-[#3498DB] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-[#3498DB] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-[#3498DB] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
        
        {/* ACTIVE INTERACTIVE TABLE */}
        {activeTable && (
          <InteractiveTable 
            data={activeTable} 
            onSave={(updatedData) => {
              const text = `Halkan waa qiimihii iibka ee alaabta: ${JSON.stringify(updatedData)}. Fadlan hadda dhamaystir Purchase Order-ka iyo diiwaangelinta alaabta.`;
              setActiveTable(null);
              sendMessage(text);
            }} 
          />
        )}
      </div>

      {/* ── QUICK ACTIONS ── */}
      {messages.length <= 1 && !isTyping && (
        <div className="px-4 py-3 bg-white/90 dark:bg-[#0f172a]/90 border-t border-gray-100 dark:border-gray-800/40 backdrop-blur-md">
          <p className="text-[9px] text-gray-400 font-bold mb-2.5 uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles size={10} className="text-amber-400" />
            Su'aalo Degdeg ah
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { icon: TrendingUp, label: 'Sidee iibka maanta?', query: 'warbixinta iibka ee maanta iisoo saar' },
              { icon: Package, label: 'Alaabtee dhamaan rabta?', query: 'i tus alaabta stock-keeda aad u hooseeyo' },
              { icon: Users, label: 'Macaamiisha aan daynta ku lenahay?', query: 'isoo saar liiska macaamiisha aan daynta ku lenahay' },
              { icon: RefreshCw, label: 'Dib u eeg kharashka', query: 'kharashyadii baxay i tus' },
              { icon: Package, label: 'Alaab cusub diwaangeli', query: 'alaab cusub baan rabaa inaan systemka geliyo' },
              { icon: UserPlus, label: 'Waa kuma macaamiilka ugu fiican?', query: 'isoo saar macaamiilka ugu iibsiga badan' },
            ].map(action => {
              const ActionIcon = action.icon;
              return (
                <button
                  key={action.query}
                  onClick={() => sendMessage(action.query)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium bg-gray-50 dark:bg-gray-800/40 text-gray-600 dark:text-gray-300 rounded-full border border-gray-200/60 dark:border-gray-700/50 hover:bg-[#3498DB]/10 hover:text-[#3498DB] hover:border-[#3498DB]/30 transition-all active:scale-95 group shadow-sm hover:shadow"
                >
                  <ActionIcon size={11} className="text-gray-400 group-hover:text-[#3498DB] transition-colors" />
                  {action.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── INPUT ── */}
      <div className="px-4 pb-4 pt-3 bg-white dark:bg-[#0f172a] border-t border-gray-100 dark:border-gray-800/40">
        {selectedImage && (
          <div className="mb-2 relative inline-block">
            <img src={selectedImage} alt="Preview" className="w-16 h-16 object-cover rounded-xl border-2 border-[#3498DB]/30" />
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-lg"
            >
              <X size={12} />
            </button>
          </div>
        )}
        <div className="flex items-end gap-2 bg-gray-50 dark:bg-[#1a2236] rounded-2xl border border-gray-200/80 dark:border-gray-800/50 px-4 py-2 focus-within:border-[#3498DB]/50 transition-colors">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            accept="image/*" 
            className="hidden" 
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-400 hover:text-[#3498DB] hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-all"
            title="Sawir soo gali"
          >
            <ImageIcon size={18} />
          </button>
          <button
            onClick={toggleListening}
            className={`p-2 rounded-xl transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:text-[#3498DB] hover:bg-blue-50 dark:hover:bg-blue-500/10'}`}
            title={isListening ? "Jooji dhageysiga" : "Cod ku hadal"}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <button
            onClick={() => setIsSelectingElement(!isSelectingElement)}
            className={`p-2 rounded-xl transition-all ${isSelectingElement ? 'bg-[#3498DB] text-white animate-pulse shadow-lg shadow-[#3498DB]/20' : 'text-gray-400 hover:text-[#3498DB] hover:bg-blue-50 dark:hover:bg-blue-500/10'}`}
            title={isSelectingElement ? "Jooji doorashada" : "Dooro qayb ka mid ah shaashada"}
          >
            <MousePointerClick size={18} />
          </button>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? "Waan ku dhageysanayaa..." : "Wax ii qor..."}
            rows={1}
            className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none resize-none max-h-32 py-1.5"
            style={{ minHeight: '24px' }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={(!input.trim() && !selectedImage) || isTyping}
            className="p-2 bg-[#3498DB] hover:bg-[#2980B9] disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-400 text-white rounded-xl transition-all flex-shrink-0 disabled:cursor-not-allowed shadow-lg shadow-[#3498DB]/20"
          >
            {isTyping ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
        <p className="text-center text-[9px] text-gray-400 mt-2 font-medium">
          Powered by Cerebras + Gemini • Revlo AI
        </p>
      </div>
      {/* UPGRADE MODAL */}
      <UpgradeCreditsModal 
          isOpen={showUpgradeModal} 
          onClose={() => setShowUpgradeModal(false)} 
          scanCredits={scanCredits} 
          scanPlan={scanPlan} 
          creditPackages={creditPackages} 
      />
    </div>
  );
}
