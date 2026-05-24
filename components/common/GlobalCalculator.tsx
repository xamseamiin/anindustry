'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Calculator, X, Delete, RotateCcw, Minus, Plus, Divide, X as Multiply, Hash } from 'lucide-react';

export default function GlobalCalculator() {
  const [isOpen, setIsOpen] = useState(false);
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [shouldReset, setShouldReset] = useState(false);

  const handleNumber = useCallback((num: string) => {
    if (display === '0' || shouldReset) {
      setDisplay(num);
      setShouldReset(false);
    } else {
      setDisplay(display + num);
    }
  }, [display, shouldReset]);

  const handleOperator = useCallback((op: string) => {
    if (equation && !shouldReset) {
      try {
        const result = eval(equation + display);
        const formattedResult = String(Number(result.toFixed(8)));
        setDisplay(formattedResult);
        setEquation(formattedResult + ' ' + op + ' ');
      } catch (e) {
        setDisplay('Error');
        setEquation('');
      }
    } else {
      setEquation(display + ' ' + op + ' ');
    }
    setShouldReset(true);
  }, [display, equation, shouldReset]);

  const calculate = useCallback(() => {
    if (!equation) return;
    try {
      const result = eval(equation + display);
      setDisplay(String(Number(result.toFixed(8))));
      setEquation('');
      setShouldReset(true);
    } catch (error) {
      setDisplay('Error');
      setEquation('');
      setShouldReset(true);
    }
  }, [equation, display]);

  const clear = () => {
    setDisplay('0');
    setEquation('');
    setShouldReset(false);
  };

  const deleteLast = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (/[0-9]/.test(e.key)) handleNumber(e.key);
      if (['+', '-', '*', '/'].includes(e.key)) handleOperator(e.key);
      if (e.key === 'Enter' || e.key === '=') calculate();
      if (e.key === 'Escape') setIsOpen(false);
      if (e.key === 'Backspace') deleteLast();
      if (e.key === 'c' || e.key === 'C') clear();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNumber, handleOperator, calculate]);

  return (
    <>
      {/* Floating Toggle Button - Compact & Subtle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-24 w-12 h-12 rounded-full shadow-lg transition-all duration-500 z-[60] flex items-center justify-center group ${
          isOpen 
            ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 rotate-90' 
            : 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-md text-gray-400 dark:text-gray-500 hover:text-primary dark:hover:text-blue-400 hover:scale-105 active:scale-95 border border-gray-100 dark:border-gray-800'
        }`}
        title="Calculator"
      >
        {isOpen ? <X size={20} /> : <Calculator size={20} strokeWidth={2} className="group-hover:rotate-12 transition-transform" />}
      </button>

      {/* Calculator Window - Compact Design */}
      <div 
        className={`fixed bottom-20 right-6 w-64 bg-white/90 dark:bg-gray-950/90 backdrop-blur-2xl rounded-[1.5rem] shadow-[0_10px_40px_rgba(0,0,0,0.15)] border border-gray-100/50 dark:border-gray-800/50 transition-all duration-500 z-[60] overflow-hidden ${
          isOpen ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="px-5 py-4 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Calculator size={14} className="text-primary dark:text-blue-500" />
            <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 tracking-[0.2em] uppercase">Calculator</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-gray-300 hover:text-red-500 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Display - Compact */}
        <div className="p-4">
          <div className="bg-gray-50 dark:bg-gray-900/80 rounded-2xl p-4 text-right mb-4 border border-gray-100 dark:border-gray-800">
            <p className="text-[10px] font-bold text-gray-300 dark:text-gray-600 h-3 mb-0.5 overflow-hidden tracking-wider">{equation}</p>
            <p className="text-3xl font-black text-gray-900 dark:text-white truncate tracking-tighter">
              {display}
            </p>
          </div>

          {/* Buttons Grid - Compact Height */}
          <div className="grid grid-cols-4 gap-2">
            {/* Row 1 */}
            <CalcButton label="C" onClick={clear} className="bg-red-50/50 dark:bg-red-900/10 text-red-500 text-xs" />
            <CalcButton label={<RotateCcw size={14} />} onClick={clear} className="bg-orange-50/50 dark:bg-orange-900/10 text-orange-500" />
            <CalcButton label={<Delete size={14} />} onClick={deleteLast} className="bg-gray-50 dark:bg-gray-800 text-gray-400" />
            <CalcButton label={<Divide size={14} />} onClick={() => handleOperator('/')} className="bg-primary text-white" />

            {/* Row 2 */}
            <CalcButton label="7" onClick={() => handleNumber('7')} />
            <CalcButton label="8" onClick={() => handleNumber('8')} />
            <CalcButton label="9" onClick={() => handleNumber('9')} />
            <CalcButton label={<Multiply size={14} />} onClick={() => handleOperator('*')} className="bg-primary text-white" />

            {/* Row 3 */}
            <CalcButton label="4" onClick={() => handleNumber('4')} />
            <CalcButton label="5" onClick={() => handleNumber('5')} />
            <CalcButton label="6" onClick={() => handleNumber('6')} />
            <CalcButton label={<Minus size={14} />} onClick={() => handleOperator('-')} className="bg-primary text-white" />

            {/* Row 4 */}
            <CalcButton label="1" onClick={() => handleNumber('1')} />
            <CalcButton label="2" onClick={() => handleNumber('2')} />
            <CalcButton label="3" onClick={() => handleNumber('3')} />
            <CalcButton label={<Plus size={14} />} onClick={() => handleOperator('+')} className="bg-primary text-white" />

            {/* Row 5 */}
            <CalcButton label="0" onClick={() => handleNumber('0')} className="col-span-2" />
            <CalcButton label="." onClick={() => handleNumber('.')} />
            <CalcButton label="=" onClick={calculate} className="bg-green-500 text-white shadow-md shadow-green-500/20" />
          </div>
        </div>
      </div>
    </>
  );
}

function CalcButton({ label, onClick, className = '', colSpan = 1 }: { label: React.ReactNode, onClick: () => void, className?: string, colSpan?: number }) {
  return (
    <button
      onClick={onClick}
      style={{ gridColumn: colSpan > 1 ? `span ${colSpan}` : undefined }}
      className={`h-10 rounded-xl font-bold text-sm transition-all duration-200 active:scale-90 flex items-center justify-center ${
        className || 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-800'
      }`}
    >
      {label}
    </button>
  );
}
