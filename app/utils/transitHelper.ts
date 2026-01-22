// app/utils/transitHelpers.ts (Perbaikan)
import { createClient } from '@/app/lib/supabaseClient';

export interface TransitStation {
  id: string;
  schedule_id: string;
  station_id: string;
  station_name: string;
  station_code: string;
  city: string;
  station_order: number;
  arrival_time: string;
  departure_time: string;
  waiting_minutes: number;
  station_type: string;
  previous_station: string;
  next_station: string;
  has_available_seats: boolean;
  available_seats: number;
  duration_minutes: number;
  train_id?: string;
  train_name?: string;
  train_type?: string;
}

export async function fetchTransitStations(
  scheduleId: string,
  origin: string,
  destination: string
): Promise<TransitStation[]> {
  try {
    const response = await fetch(
      `/api/schedules/${scheduleId}/transit?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`,
      {
        cache: 'no-store'
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch transit stations: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.transitRoutes) {
      return data.transitRoutes;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching transit stations:', error);
    
    // Fallback data untuk development
    if (process.env.NODE_ENV === 'development') {
      return getFallbackTransitStations(scheduleId, origin, destination);
    }
    
    return [];
  }
}

function getFallbackTransitStations(scheduleId: string, origin: string, destination: string): TransitStation[] {
  // Contoh data fallback untuk Bandung → Gambir
  if (origin === 'Bandung' && destination === 'Gambir') {
    return [
      {
        id: 'transit-tanah-abang',
        schedule_id: scheduleId,
        station_id: 'stasiun-tanah-abang',
        station_name: 'Tanah Abang',
        station_code: 'TAB',
        city: 'Jakarta Pusat',
        station_order: 2,
        arrival_time: '08:30',
        departure_time: '08:40',
        waiting_minutes: 10,
        station_type: 'transit',
        previous_station: 'Bandung',
        next_station: 'Senen',
        has_available_seats: true,
        available_seats: 15,
        duration_minutes: 30
      },
      {
        id: 'transit-senen',
        schedule_id: scheduleId,
        station_id: 'stasiun-senen',
        station_name: 'Senen',
        station_code: 'SNN',
        city: 'Jakarta Pusat',
        station_order: 3,
        arrival_time: '09:00',
        departure_time: '09:10',
        waiting_minutes: 10,
        station_type: 'transit',
        previous_station: 'Tanah Abang',
        next_station: 'Gambir',
        has_available_seats: true,
        available_seats: 8,
        duration_minutes: 20
      }
    ];
  }
  
  return [];
}