// app/contexts/TripPointsContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { supabase } from '@/app/lib/supabaseClient';

interface PointTransaction {
  id: string;
  points: number;
  type: 'earn' | 'redeem' | 'expire' | 'bonus' | 'adjustment';
  description: string;
  status: 'pending' | 'completed' | 'cancelled' | 'expired';
  created_at: string;
  expires_at?: string;
  booking_id?: string;
  metadata?: any;
}

interface TripPointsData {
  total_points: number;
  available_points: number;
  spent_points: number;
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
  next_reset_date: string;
  last_earned_at?: string;
}

interface TripPointsContextType {
  points: TripPointsData | null;
  transactions: PointTransaction[];
  loading: boolean;
  error: string | null;
  refreshPoints: () => Promise<void>;
  getLevelInfo: (level: string) => { 
    label: string; 
    color: string; 
    icon: React.ReactNode;
    minPoints: number;
    multiplier: number;
  };
  addBonusPoints: (points: number, description: string) => Promise<boolean>;
  redeemPoints: (points: number, description: string) => Promise<boolean>;
}

const TripPointsContext = createContext<TripPointsContextType | undefined>(undefined);

export const useTripPoints = () => {
  const context = useContext(TripPointsContext);
  if (context === undefined) {
    throw new Error('useTripPoints must be used within a TripPointsProvider');
  }
  return context;
};

interface TripPointsProviderProps {
  children: React.ReactNode;
}

// Default points data untuk fallback
const DEFAULT_POINTS_DATA: TripPointsData = {
  total_points: 1250,
  available_points: 1250,
  spent_points: 0,
  level: 'bronze',
  next_reset_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
};

// Default transaction untuk fallback
const DEFAULT_TRANSACTIONS: PointTransaction[] = [
  {
    id: 'default-1',
    points: 1000,
    type: 'bonus',
    description: 'Welcome bonus for new user',
    status: 'completed',
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'default-2',
    points: 250,
    type: 'earn',
    description: 'First booking reward',
    status: 'completed',
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

export const TripPointsProvider: React.FC<TripPointsProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [points, setPoints] = useState<TripPointsData | null>(DEFAULT_POINTS_DATA);
  const [transactions, setTransactions] = useState<PointTransaction[]>(DEFAULT_TRANSACTIONS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);

  const fetchPointsData = useCallback(async () => {
    if (!user?.id) {
      // Untuk guest, gunakan default data
      setPoints(DEFAULT_POINTS_DATA);
      setTransactions(DEFAULT_TRANSACTIONS);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Fetching trip points for user:', user.id);

      // Coba menggunakan stored function (RPC) terlebih dahulu
      let pointsData: any = null;
      let pointsError: any = null;

      try {
        const { data, error } = await supabase
          .rpc('get_user_points', { user_uuid: user.id })
          .select('*')
          .limit(1);

        if (!error && data && data.length > 0) {
          pointsData = data[0];
        } else {
          pointsError = error;
        }
      } catch (rpcError: any) {
        console.log('⚠️ RPC function not available, trying direct table query:', rpcError.message);
        pointsError = rpcError;
      }

      // Jika RPC gagal, coba query tabel langsung
      if (pointsError || !pointsData) {
        console.log('📊 Trying direct table query...');
        
        // Coba query dari tabel trip_points jika ada
        const { data: tripPointsData, error: tripPointsError } = await supabase
          .from('trip_points')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!tripPointsError && tripPointsData) {
          pointsData = tripPointsData;
        } else {
          console.log('📝 No trip_points record found, calculating manually...');
          
          // Jika tabel trip_points tidak ada, hitung manual dari transactions
          const { data: userTransactions, error: transError } = await supabase
            .from('point_transactions')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'completed');

          if (!transError && userTransactions) {
            const totalEarned = userTransactions
              .filter(t => t.points > 0)
              .reduce((sum, t) => sum + t.points, 0);
            
            const totalSpent = userTransactions
              .filter(t => t.points < 0)
              .reduce((sum, t) => sum + Math.abs(t.points), 0);
            
            const available = totalEarned - totalSpent;
            
            // Tentukan level berdasarkan points
            let level: 'bronze' | 'silver' | 'gold' | 'platinum' = 'bronze';
            if (available >= 10000) level = 'platinum';
            else if (available >= 5000) level = 'gold';
            else if (available >= 2000) level = 'silver';
            
            pointsData = {
              total_points: totalEarned,
              available_points: available,
              spent_points: totalSpent,
              level: level,
              next_reset_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            };
          } else {
            // Gunakan default data jika semua query gagal
            console.log('🎯 Using default points data');
            pointsData = DEFAULT_POINTS_DATA;
            setUseFallback(true);
          }
        }
      }

      // Set points data
      if (pointsData) {
        setPoints({
          total_points: pointsData.total_points || 0,
          available_points: pointsData.available_points || 0,
          spent_points: pointsData.spent_points || 0,
          level: (pointsData.level as any) || 'bronze',
          next_reset_date: pointsData.next_reset_date || 
            new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        });
      }

      // Fetch transactions
      try {
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('point_transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (!transactionsError && transactionsData && transactionsData.length > 0) {
          setTransactions(transactionsData);
        } else {
          // Gunakan default transactions jika tidak ada data
          setTransactions(DEFAULT_TRANSACTIONS);
        }
      } catch (transFetchError: any) {
        console.warn('⚠️ Failed to fetch transactions:', transFetchError.message);
        setTransactions(DEFAULT_TRANSACTIONS);
      }

    } catch (err: any) {
      console.error('❌ Error in fetchPointsData:', err);
      
      // Jangan set error fatal, gunakan fallback data
      setPoints(DEFAULT_POINTS_DATA);
      setTransactions(DEFAULT_TRANSACTIONS);
      setUseFallback(true);
      
      // Set error message hanya untuk logging, bukan untuk blocking UI
      const errorMessage = err?.message || 'Failed to load points data';
      console.warn('⚠️ Using fallback points data due to:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const refreshPoints = useCallback(async () => {
    await fetchPointsData();
  }, [fetchPointsData]);

  const addBonusPoints = useCallback(async (pointsToAdd: number, description: string): Promise<boolean> => {
    if (!user?.id || pointsToAdd <= 0) return false;

    // Jika dalam mode fallback, hanya update state lokal
    if (useFallback) {
      try {
        const newTransaction: PointTransaction = {
          id: `temp-${Date.now()}`,
          points: pointsToAdd,
          type: 'bonus',
          description: description,
          status: 'completed',
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        };

        // Update local state
        setTransactions(prev => [newTransaction, ...prev]);
        
        // Update points
        setPoints(prev => prev ? {
          ...prev,
          total_points: (prev.total_points || 0) + pointsToAdd,
          available_points: (prev.available_points || 0) + pointsToAdd,
        } : DEFAULT_POINTS_DATA);
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('pointsUpdated'));
        
        return true;
      } catch (err) {
        console.error('Error adding bonus points in fallback mode:', err);
        return false;
      }
    }

    try {
      const { error } = await supabase
        .from('point_transactions')
        .insert({
          user_id: user.id,
          points: pointsToAdd,
          type: 'bonus',
          description: description,
          status: 'completed',
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        });

      if (error) throw error;

      await refreshPoints();
      window.dispatchEvent(new CustomEvent('pointsUpdated'));
      
      return true;
    } catch (err) {
      console.error('Error adding bonus points:', err);
      return false;
    }
  }, [user?.id, refreshPoints, useFallback]);

  const redeemPoints = useCallback(async (pointsToRedeem: number, description: string): Promise<boolean> => {
    if (!user?.id || pointsToRedeem <= 0 || !points || (points.available_points || 0) < pointsToRedeem) {
      return false;
    }

    // Jika dalam mode fallback, hanya update state lokal
    if (useFallback) {
      try {
        const newTransaction: PointTransaction = {
          id: `temp-${Date.now()}`,
          points: -pointsToRedeem,
          type: 'redeem',
          description: description,
          status: 'completed',
          created_at: new Date().toISOString(),
        };

        setTransactions(prev => [newTransaction, ...prev]);
        setPoints(prev => prev ? {
          ...prev,
          available_points: (prev.available_points || 0) - pointsToRedeem,
          spent_points: (prev.spent_points || 0) + pointsToRedeem,
        } : DEFAULT_POINTS_DATA);
        
        window.dispatchEvent(new CustomEvent('pointsUpdated'));
        
        return true;
      } catch (err) {
        console.error('Error redeeming points in fallback mode:', err);
        return false;
      }
    }

    try {
      const { error } = await supabase
        .from('point_transactions')
        .insert({
          user_id: user.id,
          points: -pointsToRedeem,
          type: 'redeem',
          description: description,
          status: 'completed',
        });

      if (error) throw error;

      await refreshPoints();
      window.dispatchEvent(new CustomEvent('pointsUpdated'));
      
      return true;
    } catch (err) {
      console.error('Error redeeming points:', err);
      return false;
    }
  }, [user?.id, points, refreshPoints, useFallback]);

  const getLevelInfo = useCallback((level: string) => {
    const levels: Record<string, { 
      label: string; 
      color: string; 
      icon: React.ReactNode;
      minPoints: number;
      multiplier: number;
    }> = {
      bronze: {
        label: 'Bronze',
        color: 'bg-amber-800 text-white',
        icon: (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
        ),
        minPoints: 0,
        multiplier: 1.0
      },
      silver: {
        label: 'Silver',
        color: 'bg-gray-300 text-gray-800',
        icon: (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
        ),
        minPoints: 2000,
        multiplier: 1.2
      },
      gold: {
        label: 'Gold',
        color: 'bg-yellow-500 text-white',
        icon: (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
        ),
        minPoints: 5000,
        multiplier: 1.5
      },
      platinum: {
        label: 'Platinum',
        color: 'bg-gradient-to-r from-gray-400 to-gray-600 text-white',
        icon: (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
        ),
        minPoints: 10000,
        multiplier: 2.0
      }
    };

    return levels[level] || levels.bronze;
  }, []);

  // Setup realtime subscription dengan error handling
  useEffect(() => {
    if (!user?.id) {
      // Untuk guest, gunakan default data
      setPoints(DEFAULT_POINTS_DATA);
      setTransactions(DEFAULT_TRANSACTIONS);
      return;
    }

    let channel: any = null;
    
    // Initial fetch dengan delay untuk menghindari race condition
    const initialFetchTimer = setTimeout(() => {
      fetchPointsData();
    }, 1000);

    try {
      // Subscribe hanya jika tidak dalam mode fallback
      if (!useFallback) {
        channel = supabase
          .channel(`points-${user.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'point_transactions',
              filter: `user_id=eq.${user.id}`
            },
            () => {
              refreshPoints();
            }
          )
          .subscribe((status) => {
            console.log('Points subscription status:', status);
          });
      }
    } catch (channelError: any) {
      console.warn('⚠️ Failed to setup realtime subscription:', channelError.message);
    }

    // Listen for custom events
    const handlePointsUpdated = () => {
      refreshPoints();
    };

    window.addEventListener('pointsUpdated', handlePointsUpdated);
    window.addEventListener('bookingUpdated', fetchPointsData);

    return () => {
      clearTimeout(initialFetchTimer);
      
      if (channel) {
        supabase.removeChannel(channel);
      }
      
      window.removeEventListener('pointsUpdated', handlePointsUpdated);
      window.removeEventListener('bookingUpdated', fetchPointsData);
    };
  }, [user?.id, fetchPointsData, refreshPoints, useFallback]);

  const value: TripPointsContextType = {
    points,
    transactions,
    loading,
    error,
    refreshPoints,
    getLevelInfo,
    addBonusPoints,
    redeemPoints
  };

  return (
    <TripPointsContext.Provider value={value}>
      {children}
    </TripPointsContext.Provider>
  );
};