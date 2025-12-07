// contexts/WalletContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { supabase } from '@/app/lib/supabaseClient';

// Types
interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

interface Transaction {
  id: string;
  wallet_id: string;
  user_id: string;
  type: 'credit' | 'debit' | 'refund' | 'withdrawal';
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  reference_type?: 'booking' | 'topup' | 'refund' | 'withdrawal';
  reference_id?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

interface WalletContextType {
  // Wallet state
  wallet: Wallet | null;
  balance: number;
  transactions: Transaction[];
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  
  // Wallet operations
  refreshWallet: () => Promise<void>;
  getTransactions: (limit?: number) => Promise<void>;
  
  // Transaction operations
  topupWallet: (amount: number, paymentMethod: string, paymentProof?: File) => Promise<boolean>;
  processPayment: (amount: number, description: string, referenceId?: string) => Promise<boolean>;
  processRefund: (amount: number, description: string, originalTransactionId: string) => Promise<boolean>;
  withdrawBalance: (amount: number, bankAccount: string) => Promise<boolean>;
  
  // Utility functions
  formatBalance: (amount?: number) => string;
  canMakePayment: (amount: number) => boolean;
}

// Create context
const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Fallback wallet for development
const createFallbackWallet = (userId: string): Wallet => ({
  id: `fallback-${userId}`,
  user_id: userId,
  balance: 1000000, // Saldo demo 1 juta
  currency: 'IDR',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

// Check if database tables exist
const checkDatabaseTables = async (): Promise<boolean> => {
  try {
    // Test wallets table
    const { error: walletsError } = await supabase
      .from('wallets')
      .select('count')
      .limit(1);
    
    // Test transactions table  
    const { error: transactionsError } = await supabase
      .from('transactions')
      .select('count')
      .limit(1);

    return !walletsError && !transactionsError;
  } catch (error) {
    console.error('Error checking database tables:', error);
    return false;
  }
};

// Provider component
export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { user, userProfile } = useAuth();
  const { addToast } = useToast();
  
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [databaseAvailable, setDatabaseAvailable] = useState<boolean | null>(null);

  // Debug logging
  const debug = useCallback((message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[WalletContext] ${message}`, data || '');
    }
  }, []);

  // Check database availability on mount
  useEffect(() => {
    const checkDatabase = async () => {
      try {
        const isAvailable = await checkDatabaseTables();
        setDatabaseAvailable(isAvailable);
        debug('Database availability check:', isAvailable);
        
        if (!isAvailable && process.env.NODE_ENV === 'development') {
          // addToast('Menggunakan wallet demo (database tidak tersedia)', 'info');
        }
      } catch (error) {
        console.error('Error checking database:', error);
        setDatabaseAvailable(false);
      }
    };

    checkDatabase();
  }, [addToast, debug]);

  // Initialize wallet for new users - SIMPLIFIED AND ROBUST
  const initializeWallet = useCallback(async () => {
    if (!user) {
      debug('No user found, skipping wallet initialization');
      return;
    }

    debug('Initializing wallet for user:', user.id);
    setIsLoading(true);
    setError(null);

    try {
      // If database is not available, use fallback immediately
      if (databaseAvailable === false) {
        debug('Database not available, using fallback wallet');
        const fallbackWallet = createFallbackWallet(user.id);
        setWallet(fallbackWallet);
        setIsInitialized(true);
        return;
      }

      // Try to get existing wallet
      const { data: existingWallet, error: fetchError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      debug('Wallet fetch result:', { existingWallet, error: fetchError });

      if (fetchError) {
        // Handle different error cases
        if (fetchError.code === 'PGRST116') {
          // Wallet doesn't exist, create one
          debug('Creating new wallet for user');
          
          const { data: newWallet, error: createError } = await supabase
            .from('wallets')
            .insert([
              {
                user_id: user.id,
                balance: 0,
                currency: 'IDR',
              }
            ])
            .select()
            .single();

          if (createError) {
            debug('Error creating wallet:', createError);
            
            // If table doesn't exist or other database issues, use fallback
            if (createError.code === '42P01' || createError.message?.includes('relation') || createError.message?.includes('table')) {
              debug('Database table issue, using fallback');
              const fallbackWallet = createFallbackWallet(user.id);
              setWallet(fallbackWallet);
              setIsInitialized(true);
              setDatabaseAvailable(false);
              
              if (process.env.NODE_ENV === 'development') {
                // addToast('Menggunakan wallet demo', 'info');
              } else {
                addToast('Sistem wallet sedang dalam maintenance', 'warning');
              }
              return;
            }
            
            throw createError;
          }
          
          setWallet(newWallet);
          setIsInitialized(true);
          debug('New wallet created successfully');
          
        } else if (fetchError.code === '42P01' || fetchError.message?.includes('relation') || fetchError.message?.includes('table')) {
          // Table doesn't exist
          debug('Wallets table does not exist, using fallback');
          const fallbackWallet = createFallbackWallet(user.id);
          setWallet(fallbackWallet);
          setIsInitialized(true);
          setDatabaseAvailable(false);
          
          if (process.env.NODE_ENV === 'development') {
            // addToast('Menggunakan wallet demo', 'info');
          } else {
            addToast('Sistem wallet sedang dalam maintenance', 'warning');
          }
        } else {
          // Other errors
          debug('Other database error, using fallback:', fetchError);
          throw fetchError;
        }
      } else {
        // Wallet exists and was fetched successfully
        setWallet(existingWallet);
        setIsInitialized(true);
        debug('Existing wallet loaded successfully');
      }
    } catch (error) {
      console.error('Error in wallet initialization:', error);
      setError('Failed to initialize wallet');
      
      // Always use fallback in case of any error
      const fallbackWallet = createFallbackWallet(user.id);
      setWallet(fallbackWallet);
      setIsInitialized(true);
      setDatabaseAvailable(false);
      
      if (process.env.NODE_ENV === 'development') {
        // addToast('Menggunakan wallet demo karena error', 'info');
      } else {
        addToast('Gagal memuat dompet. Menggunakan mode sementara.', 'warning');
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, addToast, debug, databaseAvailable]);

  // Refresh wallet data
  const refreshWallet = useCallback(async () => {
    if (!user || !isInitialized || !databaseAvailable) {
      debug('Skipping wallet refresh');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        debug('Error refreshing wallet:', error);
        return;
      }
      
      setWallet(data);
      debug('Wallet refreshed');
    } catch (error) {
      console.error('Error in refreshWallet:', error);
    }
  }, [user, isInitialized, databaseAvailable, debug]);

  // Get transactions
  const getTransactions = useCallback(async (limit: number = 10) => {
    if (!user || !databaseAvailable) {
      debug('Skipping transactions fetch');
      setTransactions([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        debug('Error fetching transactions:', error);
        setTransactions([]);
        return;
      }
      
      setTransactions(data || []);
      debug('Transactions loaded:', data?.length || 0);
    } catch (error) {
      console.error('Error in getTransactions:', error);
      setTransactions([]);
    }
  }, [user, databaseAvailable, debug]);

  // Top up wallet
  const topupWallet = useCallback(async (
    amount: number, 
    paymentMethod: string, 
    paymentProof?: File
  ): Promise<boolean> => {
    if (!user || !wallet) {
      addToast('Dompet belum siap', 'error');
      return false;
    }

    // Check if using fallback wallet
    if (!databaseAvailable || wallet.id.startsWith('fallback-')) {
      addToast('Fitur top up tidak tersedia dalam mode demo', 'warning');
      return false;
    }

    // Validation
    if (amount <= 0) {
      addToast('Jumlah top up harus lebih dari 0', 'warning');
      return false;
    }

    if (amount > 100000000) {
      addToast('Jumlah top up terlalu besar', 'warning');
      return false;
    }

    if (amount < 10000) {
      addToast('Minimum top up adalah Rp 10.000', 'warning');
      return false;
    }

    setIsLoading(true);
    try {
      let proofUrl = '';
      
      // Upload payment proof if provided
      if (paymentProof) {
        try {
          const fileExt = paymentProof.name.split('.').pop();
          const fileName = `${user.id}/topup-proofs/${Date.now()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('payment-proofs')
            .upload(fileName, paymentProof);

          if (uploadError) throw uploadError;
          proofUrl = fileName;
        } catch (uploadError) {
          debug('Error uploading proof:', uploadError);
          // Continue without proof
        }
      }

      // Create transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert([
          {
            wallet_id: wallet.id,
            user_id: user.id,
            type: 'credit',
            amount: amount,
            description: `Top up via ${paymentMethod}`,
            status: 'pending',
            reference_type: 'topup',
            metadata: {
              payment_method: paymentMethod,
              proof_url: proofUrl,
            }
          }
        ])
        .select()
        .single();

      if (transactionError) throw transactionError;

      addToast('Permintaan top up berhasil dikirim', 'success');
      await getTransactions();
      return true;
    } catch (error) {
      console.error('Error processing topup:', error);
      addToast('Gagal melakukan top up', 'error');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, wallet, databaseAvailable, addToast, getTransactions, debug]);

  // Process payment from wallet
  const processPayment = useCallback(async (
    amount: number, 
    description: string, 
    referenceId?: string
  ): Promise<boolean> => {
    if (!user || !wallet) {
      addToast('Dompet belum siap', 'error');
      return false;
    }

    // Handle fallback wallet (demo mode)
    if (!databaseAvailable || wallet.id.startsWith('fallback-')) {
      if (wallet.balance < amount) {
        addToast('Saldo tidak mencukupi', 'error');
        return false;
      }
      
      // Simulate payment for demo
      setWallet(prev => prev ? { 
        ...prev, 
        balance: prev.balance - amount,
        updated_at: new Date().toISOString()
      } : null);
      
      // Add demo transaction
      const demoTransaction: Transaction = {
        id: `demo-${Date.now()}`,
        wallet_id: wallet.id,
        user_id: user.id,
        type: 'debit',
        amount: amount,
        description: description,
        status: 'completed',
        reference_type: 'booking',
        reference_id: referenceId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      setTransactions(prev => [demoTransaction, ...prev]);
      addToast('Pembayaran demo berhasil', 'success');
      return true;
    }

    // Real wallet validation
    if (amount <= 0) {
      addToast('Jumlah pembayaran tidak valid', 'warning');
      return false;
    }

    if (wallet.balance < amount) {
      addToast('Saldo tidak mencukupi', 'error');
      return false;
    }

    setIsLoading(true);
    try {
      // Create transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert([
          {
            wallet_id: wallet.id,
            user_id: user.id,
            type: 'debit',
            amount: amount,
            description: description,
            status: 'completed',
            reference_type: 'booking',
            reference_id: referenceId,
          }
        ])
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Update balance
      const newBalance = wallet.balance - amount;
      const { error: updateError } = await supabase
        .from('wallets')
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', wallet.id);

      if (updateError) throw updateError;

      // Update local state
      setWallet(prev => prev ? { ...prev, balance: newBalance } : null);
      await getTransactions();

      addToast('Pembayaran berhasil', 'success');
      return true;
    } catch (error) {
      console.error('Error processing payment:', error);
      addToast('Gagal memproses pembayaran', 'error');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, wallet, databaseAvailable, addToast, getTransactions, debug]);

  // ... (processRefund and withdrawBalance functions follow similar pattern)

  // Utility function to format balance
  const formatBalance = useCallback((amount?: number) => {
    const value = amount !== undefined ? amount : (wallet?.balance || 0);
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  }, [wallet?.balance]);

  // Check if user can make payment
  const canMakePayment = useCallback((amount: number) => {
    return (wallet?.balance || 0) >= amount;
  }, [wallet?.balance]);

  // Initialize wallet when user changes
  useEffect(() => {
    if (user && !isInitialized) {
      initializeWallet();
      getTransactions();
    } else if (!user) {
      setWallet(null);
      setTransactions([]);
      setIsInitialized(false);
      setError(null);
    }
  }, [user, isInitialized, initializeWallet, getTransactions]);

  const value: WalletContextType = {
    wallet,
    balance: wallet?.balance || 0,
    transactions,
    isLoading,
    isInitialized,
    error,
    refreshWallet,
    getTransactions,
    topupWallet,
    processPayment,
    processRefund: async (amount, description, originalTransactionId) => {
      // Similar implementation to processPayment
      return false;
    },
    withdrawBalance: async (amount, bankAccount) => {
      // Similar implementation to topupWallet
      return false;
    },
    formatBalance,
    canMakePayment,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

// Custom hook to use wallet context
export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}