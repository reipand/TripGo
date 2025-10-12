// app/lib/realtimeClient.ts
import { createClient } from '@supabase/supabase-js';

// Real-time client configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://huwcvhngslkmfljfnxrv.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1d2N2aG5nc2xrbWZsamZueHJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4ODA0NjQsImV4cCI6MjA3MjQ1NjQ2NH0.EFKYTaaftNNV0W_4buhjPA5hFS35CHYCqr5nWw54TWg';

export const realtimeClient = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Real-time subscription manager
export class RealtimeManager {
  private subscriptions: Map<string, any> = new Map();

  // Subscribe to flight data changes
  subscribeToFlights(callback: (payload: any) => void) {
    const subscription = realtimeClient
      .channel('flights')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'flights' 
        }, 
        callback
      )
      .subscribe();

    this.subscriptions.set('flights', subscription);
    return subscription;
  }

  // Subscribe to train data changes
  subscribeToTrains(callback: (payload: any) => void) {
    const subscription = realtimeClient
      .channel('trains')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'trains' 
        }, 
        callback
      )
      .subscribe();

    this.subscriptions.set('trains', subscription);
    return subscription;
  }

  // Subscribe to booking status changes
  subscribeToBookings(userId: string, callback: (payload: any) => void) {
    const subscription = realtimeClient
      .channel(`bookings-${userId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'bookings',
          filter: `user_id=eq.${userId}`
        }, 
        callback
      )
      .subscribe();

    this.subscriptions.set(`bookings-${userId}`, subscription);
    return subscription;
  }

  // Subscribe to seat availability changes
  subscribeToSeats(flightId: string, callback: (payload: any) => void) {
    const subscription = realtimeClient
      .channel(`seats-${flightId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'seat_availability',
          filter: `flight_id=eq.${flightId}`
        }, 
        callback
      )
      .subscribe();

    this.subscriptions.set(`seats-${flightId}`, subscription);
    return subscription;
  }

  // Subscribe to notifications
  subscribeToNotifications(userId: string, callback: (payload: any) => void) {
    const subscription = realtimeClient
      .channel(`notifications-${userId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        }, 
        callback
      )
      .subscribe();

    this.subscriptions.set(`notifications-${userId}`, subscription);
    return subscription;
  }

  // Unsubscribe from specific channel
  unsubscribe(channelName: string) {
    const subscription = this.subscriptions.get(channelName);
    if (subscription) {
      realtimeClient.removeChannel(subscription);
      this.subscriptions.delete(channelName);
    }
  }

  // Unsubscribe from all channels
  unsubscribeAll() {
    this.subscriptions.forEach((subscription, channelName) => {
      realtimeClient.removeChannel(subscription);
    });
    this.subscriptions.clear();
  }
}

// Global realtime manager instance
export const realtimeManager = new RealtimeManager();
