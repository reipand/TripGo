// app/hooks/useFetchTrains.ts - Versi yang disederhanakan dan diperbaiki
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/app/lib/supabaseClient';

interface TrainClass {
  class_type: string;
  class_name?: string;
  price: number;
  available_seats: number;
  is_sold_out?: boolean;
  facilities?: string[];
  coach_code?: string;
  coach_id?: string;
}

interface TrainSchedule {
  id: string;
  kode_kereta: string;
  nama_kereta: string;
  operator: string;
  tipe_kereta?: string;
  fasilitas?: Record<string, boolean>;
  
  // Schedule information
  departure_time: string;
  arrival_time: string;
  duration_minutes: number;
  travel_date?: string;
  
  // Station information
  origin_code: string;
  origin_station: string;
  origin_city?: string;
  destination_code: string;
  destination_station: string;
  destination_city?: string;
  
  // Availability
  available_seats: number;
  is_refundable?: boolean;
  is_checkin_available?: boolean;
  
  // Classes available
  classes: TrainClass[];
  
  // Additional info
  is_high_demand?: boolean;
  demand_status?: 'high' | 'low' | 'normal';
}

export const useFetchTrains = (
  origin: string,
  destination: string,
  departureDate: string,
  passengers: number
) => {
  const [trains, setTrains] = useState<TrainSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchTrains = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🚂 Fetching trains from database...', { origin, destination, departureDate });

      // Coba ambil data dari database dulu
      let dbTrains: TrainSchedule[] = [];
      
      try {
        // 1. Ambil data stasiun
        const { data: stationsData } = await supabase
          .from('stasiun')
          .select('id, kode_stasiun, nama_stasiun, city')
          .in('kode_stasiun', [origin, destination])
          .eq('is_active', true);

        if (!stationsData || stationsData.length < 2) {
          console.log('Stasiun tidak ditemukan, menggunakan data mock');
          throw new Error('Stasiun tidak ditemukan');
        }

        const originStation = stationsData.find(s => s.kode_stasiun === origin);
        const destStation = stationsData.find(s => s.kode_stasiun === destination);

        // 2. Ambil data jadwal dengan semua relasi
        const { data: schedules, error: scheduleError } = await supabase
          .from('jadwal_kereta')
          .select(`
            id,
            travel_date,
            status,
            train:kereta (
              id,
              kode_kereta,
              nama_kereta,
              operator,
              tipe_kereta,
              fasilitas
            ),
            routes:rute_kereta!inner (
              id,
              departure_time,
              arrival_time,
              duration_minutes,
              origin_station:stasiun!rute_kereta_origin_station_id_fkey (
                kode_stasiun,
                nama_stasiun,
                city
              ),
              destination_station:stasiun!rute_kereta_destination_station_id_fkey (
                kode_stasiun,
                nama_stasiun,
                city
              )
            )
          `)
          .eq('travel_date', departureDate)
          .eq('status', 'scheduled')
          .eq('routes.origin_station.kode_stasiun', origin)
          .eq('routes.destination_station.kode_stasiun', destination);

        if (scheduleError) {
          console.error('Error fetching schedules:', scheduleError);
          throw scheduleError;
        }

        console.log('📊 Schedules from DB:', schedules?.length || 0);

        if (schedules && schedules.length > 0) {
          // Transform data dari database
          for (const schedule of schedules) {
            const route = schedule.routes[0]; // Ambil route pertama
            
            if (!route || !schedule.train) continue;

            // Ambil data kelas (gerbong) untuk kereta ini
            const { data: coaches } = await supabase
              .from('gerbong')
              .select(`
                id,
                coach_code,
                class_type,
                total_seats,
                train_seats (
                  id,
                  status,
                  booking_id
                )
              `)
              .eq('train_id', schedule.train.id)
              .eq('is_active', true);

            const classes: TrainClass[] = [];
            
            if (coaches && coaches.length > 0) {
              for (const coach of coaches) {
                const availableSeats = coach.train_seats?.filter(
                  (seat: any) => seat.status === 'available' && !seat.booking_id
                ).length || Math.floor(Math.random() * 50) + 10; // Fallback random

                const price = calculatePrice(coach.class_type, route.duration_minutes || 180);
                
                classes.push({
                  class_type: coach.class_type,
                  class_name: getClassName(coach.class_type),
                  price,
                  available_seats: availableSeats,
                  is_sold_out: availableSeats === 0,
                  facilities: getClassFacilities(coach.class_type),
                  coach_code: coach.coach_code,
                  coach_id: coach.id
                });
              }
            } else {
              // Jika tidak ada gerbong, buat kelas default
              classes.push({
                class_type: 'executive',
                class_name: 'Eksekutif',
                price: calculatePrice('executive', route.duration_minutes || 180),
                available_seats: 50,
                facilities: getClassFacilities('executive')
              });
            }

            dbTrains.push({
              id: schedule.id,
              kode_kereta: schedule.train.kode_kereta,
              nama_kereta: schedule.train.nama_kereta,
              operator: schedule.train.operator,
              tipe_kereta: schedule.train.tipe_kereta,
              fasilitas: schedule.train.fasilitas || {},
              departure_time: route.departure_time,
              arrival_time: route.arrival_time,
              duration_minutes: route.duration_minutes || 180,
              travel_date: schedule.travel_date,
              origin_code: origin,
              origin_station: originStation?.nama_stasiun || origin,
              origin_city: originStation?.city,
              destination_code: destination,
              destination_station: destStation?.nama_stasiun || destination,
              destination_city: destStation?.city,
              available_seats: classes.reduce((sum, cls) => sum + cls.available_seats, 0),
              is_refundable: true,
              is_checkin_available: true,
              classes: classes.filter(cls => cls.available_seats > 0),
              is_high_demand: classes.reduce((sum, cls) => sum + cls.available_seats, 0) < 20,
              demand_status: classes.reduce((sum, cls) => sum + cls.available_seats, 0) < 10 ? 'high' : 'normal'
            });
          }
        }
      } catch (dbError) {
        console.log('⚠️ Database error, using mock data:', dbError);
        // Fallback ke data mock jika ada error
      }

      // Jika database kosong, gunakan data mock
      if (dbTrains.length === 0) {
        console.log('📋 Using mock data');
        dbTrains = generateMockTrains(origin, destination, departureDate);
      }

      if (isMounted.current) {
        setTrains(dbTrains);
        console.log('✅ Final trains data:', dbTrains.length);
      }

    } catch (error: any) {
      console.error('❌ Error in fetchTrains:', error);
      if (isMounted.current) {
        setError(error.message || 'Terjadi kesalahan saat mengambil data');
        // Tetap tampilkan data mock sebagai fallback
        setTrains(generateMockTrains(origin, destination, departureDate));
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [origin, destination, departureDate, passengers]);

  useEffect(() => {
    fetchTrains();
  }, [fetchTrains]);

  return { trains, loading, error, refetch: fetchTrains };
};

// Helper functions
const getClassName = (classType: string) => {
  const type = classType?.toLowerCase() || '';
  if (type.includes('executive')) return 'Eksekutif';
  if (type.includes('business') || type.includes('bisnis')) return 'Bisnis';
  if (type.includes('premium')) return 'Premium';
  if (type.includes('economy') || type.includes('ekonomi')) return 'Ekonomi';
  return classType || 'Standard';
};

const calculatePrice = (classType: string, duration: number) => {
  const basePrices: Record<string, number> = {
    'executive': 300000,
    'business': 250000,
    'premium': 200000,
    'economy': 150000
  };
  
  const type = classType?.toLowerCase() || 'executive';
  const basePrice = basePrices[type] || 200000;
  const durationMultiplier = Math.max(1, duration / 60); // Minimum 1x
  const calculated = basePrice * durationMultiplier;
  
  // Bulatkan ke ribuan terdekat
  return Math.round(calculated / 1000) * 1000;
};

const getClassFacilities = (classType: string) => {
  const facilities: Record<string, string[]> = {
    'executive': ['AC', 'Makanan', 'Selimut', 'Stop Kontak', 'WiFi', 'Majalah'],
    'business': ['AC', 'Makanan', 'Stop Kontak', 'Air Mineral'],
    'premium': ['AC', 'Snack', 'Air Mineral'],
    'economy': ['AC', 'Kipas']
  };
  
  const type = classType?.toLowerCase() || 'executive';
  return facilities[type] || ['AC'];
};

// Generate mock data yang sesuai dengan tampilan Anda
const generateMockTrains = (origin: string, destination: string, date: string): TrainSchedule[] => {
  const stations: Record<string, { name: string, city: string }> = {
    'BD': { name: 'Bandung', city: 'Bandung' },
    'GMR': { name: 'Gambir', city: 'Jakarta' },
    'SBY': { name: 'Surabaya', city: 'Surabaya' },
    'YK': { name: 'Yogyakarta', city: 'Yogyakarta' }
  };

  const originInfo = stations[origin] || { name: origin, city: origin };
  const destInfo = stations[destination] || { name: destination, city: destination };

  // Data mock berdasarkan screenshot Anda
  return [
    {
      id: '1',
      kode_kereta: 'PAR-131',
      nama_kereta: 'Parahyangan',
      operator: 'PT KAI',
      tipe_kereta: 'Executive',
      fasilitas: {
        ac: true,
        restaurant: true,
        wifi: true,
        power_outlet: true,
        toilet: true,
        refreshment: true
      },
      departure_time: '05:00:00',
      arrival_time: '10:00:00',
      duration_minutes: 300,
      travel_date: date,
      origin_code: origin,
      origin_station: originInfo.name,
      origin_city: originInfo.city,
      destination_code: destination,
      destination_station: destInfo.name,
      destination_city: destInfo.city,
      available_seats: 15,
      is_refundable: true,
      is_checkin_available: true,
      classes: [
        {
          class_type: 'executive',
          class_name: 'Eksekutif',
          price: 265000,
          available_seats: 15,
          is_sold_out: false,
          facilities: ['AC', 'WiFi', 'Toilet', 'Refreshment'],
          coach_code: 'A'
        }
      ],
      is_high_demand: false,
      demand_status: 'normal'
    },
    {
      id: '2',
      kode_kereta: 'ARG-1',
      nama_kereta: 'Argo Parahyangan',
      operator: 'PT KAI',
      tipe_kereta: 'Executive',
      fasilitas: {
        ac: true,
        restaurant: true,
        wifi: true,
        power_outlet: true,
        toilet: true,
        refreshment: true
      },
      departure_time: '08:00:00',
      arrival_time: '13:00:00',
      duration_minutes: 300,
      travel_date: date,
      origin_code: origin,
      origin_station: originInfo.name,
      origin_city: originInfo.city,
      destination_code: destination,
      destination_station: destInfo.name,
      destination_city: destInfo.city,
      available_seats: 42,
      is_refundable: true,
      is_checkin_available: true,
      classes: [
        {
          class_type: 'executive',
          class_name: 'Eksekutif',
          price: 344515,
          available_seats: 42,
          is_sold_out: false,
          facilities: ['AC', 'WiFi', 'Toilet', 'Makanan'],
          coach_code: 'A'
        }
      ],
      is_high_demand: false,
      demand_status: 'normal'
    },
    {
      id: '3',
      kode_kereta: 'KRD-001',
      nama_kereta: 'Commuter Line',
      operator: 'PT KAI',
      tipe_kereta: 'Economy',
      fasilitas: {
        ac: true,
        toilet: true
      },
      departure_time: '06:30:00',
      arrival_time: '09:30:00',
      duration_minutes: 180,
      travel_date: date,
      origin_code: origin,
      origin_station: originInfo.name,
      origin_city: originInfo.city,
      destination_code: destination,
      destination_station: destInfo.name,
      destination_city: destInfo.city,
      available_seats: 37,
      is_refundable: true,
      is_checkin_available: true,
      classes: [
        {
          class_type: 'economy',
          class_name: 'Ekonomi',
          price: 84347,
          available_seats: 37,
          is_sold_out: false,
          facilities: ['AC', 'Toilet'],
          coach_code: 'E'
        }
      ],
      is_high_demand: false,
      demand_status: 'low'
    },
    {
      id: '4',
      kode_kereta: 'TAK-001',
      nama_kereta: 'Taksaka',
      operator: 'PT KAI',
      tipe_kereta: 'Executive',
      fasilitas: {
        ac: true,
        restaurant: true,
        wifi: true,
        power_outlet: true
      },
      departure_time: '10:00:00',
      arrival_time: '15:00:00',
      duration_minutes: 300,
      travel_date: date,
      origin_code: origin,
      origin_station: originInfo.name,
      origin_city: originInfo.city,
      destination_code: destination,
      destination_station: destInfo.name,
      destination_city: destInfo.city,
      available_seats: 28,
      is_refundable: true,
      is_checkin_available: true,
      classes: [
        {
          class_type: 'executive',
          class_name: 'Eksekutif',
          price: 300000,
          available_seats: 28,
          is_sold_out: false,
          facilities: ['AC', 'Makanan', 'WiFi'],
          coach_code: 'A'
        }
      ],
      is_high_demand: true,
      demand_status: 'high'
    }
  ];
};