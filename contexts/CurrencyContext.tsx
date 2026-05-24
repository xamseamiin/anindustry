'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface CurrencyContextType {
  currency: string;
  setCurrency: (currency: string) => void;
  formatCurrency: (amount: number) => string;
  getCurrencySymbol: () => string;
  getCurrencyName: () => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

interface CurrencyProviderProps {
  children: ReactNode;
}

export function CurrencyProvider({ children }: CurrencyProviderProps) {
  const [currency, setCurrencyState] = useState<string>('ETB');

  // Fetch currency from personalization settings on mount
  useEffect(() => {
    const fetchCurrency = async () => {
      try {
        const response = await fetch('/api/settings/personalization');
        if (response.ok) {
          const data = await response.json();
          if (data.settings?.currency) {
            setCurrencyState(data.settings.currency);
          }
        }
      } catch (error) {
        console.error('Error fetching currency settings:', error);
      }
    };

    fetchCurrency();
  }, []);

  const setCurrency = async (newCurrency: string) => {
    setCurrencyState(newCurrency);
    
    // Update currency in personalization settings
    try {
      const response = await fetch('/api/settings/personalization', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency: newCurrency }),
      });
      
      if (!response.ok) {
        console.error('Failed to update currency settings');
      }
    } catch (error) {
      console.error('Error updating currency settings:', error);
    }
  };

  const getCurrencySymbol = () => {
    switch (currency) {
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'ETB': return 'Br';
      default: return 'Br';
    }
  };

  const getCurrencyName = () => {
    switch (currency) {
      case 'USD': return 'US Dollar';
      case 'EUR': return 'Euro';
      case 'ETB': return 'Ethiopian Birr';
      default: return 'Ethiopian Birr';
    }
  };

  const formatCurrency = (amount: number) => {
    const symbol = getCurrencySymbol();
    const formattedAmount = amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    
    return `${symbol}${formattedAmount}`;
  };

  const value: CurrencyContextType = {
    currency,
    setCurrency,
    formatCurrency,
    getCurrencySymbol,
    getCurrencyName,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}

