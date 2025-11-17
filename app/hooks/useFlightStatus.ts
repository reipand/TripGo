// hooks/useFlightStatus.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabaseClient';

interface FlightStatus {
  id: string;
  flight_number: string;
  status: string;
  actual_departure_time: string | null;
  actual_arrival_time: string | null;
  gate: string | null;
  terminal: string | null;
}

export const useFlightStatus = () => {
  const [flightStatus, setFlightStatus] = useState<FlightStatus[]>([]);

  useEffect(() => {
    // Subscribe to flight_schedules changes
    const subscription = supabase
      .channel('flight-status')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'flight_schedules'
        },
        (payload) => {
          console.log('Flight status update:', payload);
          // Update local state or refetch data
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return flightStatus;
};