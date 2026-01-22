// contexts/WalletContext.tsx - Versi minimal
'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface WalletContextType {
  wallet: null;
  balance: number;
  transactions: never[];
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  refreshWallet: () => Promise<void>;
  getTransactions: (limit?: number) => Promise<void>;
  topupWallet: (amount: number, paymentMethod: string, paymentProof?: File) => Promise<boolean>;
  processPayment: (amount: number, description: string, referenceId?: string) => Promise<boolean>;
  formatBalance: (amount?: number) => string;
  canMakePayment: (amount: number) => boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const value: WalletContextType = {
    wallet: null,
    balance: 0,
    transactions: [],
    isLoading: false,
    isInitialized: true, // Langsung initialized
    error: null,
    refreshWallet: async () => {},
    getTransactions: async () => {},
    topupWallet: async () => {
      console.warn('Wallet feature is disabled');
      return false;
    },
    processPayment: async () => {
      console.warn('Wallet feature is disabled');
      return false;
    },
    formatBalance: (amount?: number) => {
      const value = amount || 0;
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(value);
    },
    canMakePayment: () => false,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}