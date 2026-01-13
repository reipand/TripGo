// app/hooks/useFetchTrains.ts
'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// Interfaces
interface TrainClass {
  class: string;
  subclass: string;
  price: number;
  seatsLeft: number;
  isSoldOut?: boolean;
  isBestDeal?: boolean;
  demandStatus?: 'high' | 'low' | 'normal';
  trainType?: string;
}

interface TrainSchedule {
  id: string;
  trainNumber: string;
  trainName: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  origin: string;
  destination: string;
  originCode: string;
  destinationCode: string;
  departureDate: string;
  classes: TrainClass[];
  availableSeats: number;
  isRefundable: boolean;
  isCheckinAvailable: boolean;
  isHighDemand?: boolean;
  warning?: string;
  scheduleId?: string;
  trainId?: string;
  trainType?: string;
  originCity?: string;
  destinationCity?: string;
  travelDate?: string;
}

// Helper function untuk mock data
const generateMockTrains = (origin: string, destination: string, date: string): TrainSchedule[] => {
  const stations: Record<string, string> = {
    'BD': 'Bandung',
    'GMR': 'Gambir',
    'SBY': 'Surabaya',
    'YK': 'Yogyakarta',
    'SMG': 'Semarang',
    'ML': 'Malang',
    'SOL': 'Solo',
    'JKT': 'Jakarta',
    'BDO': 'Bandung',
    'TNG': 'Tangerang',
    'BKS': 'Bekasi'
  };

  const originName = stations[origin] || origin;
  const destName = stations[destination] || destination;

  const mockTrains = [
    {
      id: 'schedule-001',
      scheduleId: 'schedule-001',
      trainId: 'train-001',
      trainNumber: 'PARAHYANGAN-131',
      trainName: 'Parahyangan',
      trainType: 'Executive',
      departureTime: '05:00',
      arrivalTime: '10:00',
      duration: '5h 0m',
      origin: originName,
      destination: destName,
      originCode: origin,
      destinationCode: destination,
      originCity: originName,
      destinationCity: destName,
      departureDate: date,
      travelDate: date,
      classes: [{
        class: 'Executive',
        subclass: 'AD',
        trainType: 'Executive',
        price: 265000,
        seatsLeft: 59,
        isBestDeal: true,
        demandStatus: 'normal' as const,
        isSoldOut: false
      }],
      availableSeats: 59,
      isRefundable: true,
      isCheckinAvailable: true,
      isHighDemand: false
    },
    {
      id: 'schedule-002',
      scheduleId: 'schedule-002',
      trainId: 'train-002',
      trainNumber: 'KRD-001',
      trainName: 'Commuter Line',
      trainType: 'Economy',
      departureTime: '06:30',
      arrivalTime: '09:30',
      duration: '3h 0m',
      origin: originName,
      destination: destName,
      originCode: origin,
      destinationCode: destination,
      originCity: originName,
      destinationCity: destName,
      departureDate: date,
      travelDate: date,
      classes: [{
        class: 'Economy',
        subclass: 'AD',
        trainType: 'Economy',
        price: 84347,
        seatsLeft: 37,
        isBestDeal: false,
        demandStatus: 'low' as const,
        isSoldOut: false
      }],
      availableSeats: 37,
      isRefundable: true,
      isCheckinAvailable: true,
      isHighDemand: false
    },
    {
      id: 'schedule-003',
      scheduleId: 'schedule-003',
      trainId: 'train-003',
      trainNumber: 'ARGO-001',
      trainName: 'Argo Parahyangan',
      trainType: 'Executive',
      departureTime: '08:01',
      arrivalTime: '13:01',
      duration: '5h 0m',
      origin: originName,
      destination: destName,
      originCode: origin,
      destinationCode: destination,
      originCity: originName,
      destinationCity: destName,
      departureDate: date,
      travelDate: date,
      classes: [{
        class: 'Executive',
        subclass: 'AD',
        trainType: 'Executive',
        price: 344515,
        seatsLeft: 42,
        isBestDeal: false,
        demandStatus: 'normal' as const,
        isSoldOut: false
      }],
      availableSeats: 42,
      isRefundable: true,
      isCheckinAvailable: true,
      isHighDemand: false
    },
    {
      id: 'schedule-004',
      scheduleId: 'schedule-004',
      trainId: 'train-004',
      trainNumber: 'TAK-001',
      trainName: 'Taksaka',
      trainType: 'Executive',
      departureTime: '10:00',
      arrivalTime: '15:00',
      duration: '5h 0m',
      origin: originName,
      destination: destName,
      originCode: origin,
      destinationCode: destination,
      originCity: originName,
      destinationCity: destName,
      departureDate: date,
      travelDate: date,
      classes: [{
        class: 'Executive',
        subclass: 'AD',
        trainType: 'Executive',
        price: 300000,
        seatsLeft: 28,
        isBestDeal: false,
        demandStatus: 'normal' as const,
        isSoldOut: false
      }],
      availableSeats: 28,
      isRefundable: true,
      isCheckinAvailable: true,
      isHighDemand: false
    }
  ];

  return mockTrains;
};

// Custom Hook
export const useFetchTrains = (
  origin: string,
  destination: string,
  departureDate: string,
  passengers: number
) => {
  const [trains, setTrains] = useState<TrainSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isFetching = useRef(false);

  const fetchTrains = useCallback(async () => {
    // Prevent duplicate calls
    if (isFetching.current) return;
    isFetching.current = true;

    try {
      setLoading(true);
      setError(null);
      
      console.log('🚂 Fetching trains...', { origin, destination, departureDate });

      const apiUrl = `/api/search/train?origin=${origin}&destination=${destination}&departureDate=${departureDate}&passengers=${passengers}`;
      
      // Timeout setelah 3 detik
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      try {
        const response = await fetch(apiUrl, {
          signal: controller.signal,
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          cache: 'no-store'
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          
          let apiData = null;
          
          // Handle response format
          if (Array.isArray(data)) {
            apiData = data;
          } else if (data.data && Array.isArray(data.data)) {
            apiData = data.data;
          } else if (data.success && data.data && Array.isArray(data.data)) {
            apiData = data.data;
          } else if (data.trains && Array.isArray(data.trains)) {
            apiData = data.trains;
          }
          
          if (apiData && apiData.length > 0) {
            // Transform API data
            const formattedTrains = apiData.map((train: any, index: number): TrainSchedule => {
              const departureTime = train.departure_time ? 
                train.departure_time.substring(0, 5) : '08:00';
              
              const arrivalTime = train.arrival_time ? 
                train.arrival_time.substring(0, 5) : '12:00';
              
              // Calculate duration
              let duration = '3h 0m';
              if (train.departure_time && train.arrival_time) {
                const dep = new Date(`2000-01-01T${train.departure_time}`);
                const arr = new Date(`2000-01-01T${train.arrival_time}`);
                if (arr < dep) arr.setDate(arr.getDate() + 1);
                const diffMs = arr.getTime() - dep.getTime();
                const hours = Math.floor(diffMs / (1000 * 60 * 60));
                const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                duration = `${hours}h ${minutes}m`;
              }
              
              const seatsLeft = train.stok_kursi || train.available_seats || train.availableSeats || 0;
              const price = train.harga || train.price || 250000;
              
              let demandStatus: 'high' | 'low' | 'normal' = 'normal';
              if (seatsLeft < 5) {
                demandStatus = 'high';
              } else if (seatsLeft > 20) {
                demandStatus = 'low';
              }

              return {
                id: train.id || `train-${index}`,
                scheduleId: train.schedule_id || train.id,
                trainId: train.train_id || train.id,
                trainNumber: train.train_number || train.kode_kereta || `${index + 1}00`,
                trainName: train.nama_kereta || train.train_name || 'Kereta',
                trainType: train.jenis_kereta || train.train_type || 'Executive',
                departureTime,
                arrivalTime,
                duration,
                origin: train.asal_stasiun?.nama || train.origin_station?.name || train.origin || 'Bandung',
                destination: train.tujuan_stasiun?.nama || train.destination_station?.name || train.destination || 'Jakarta',
                originCode: train.asal_stasiun?.kode || train.origin_station?.code || origin,
                destinationCode: train.tujuan_stasiun?.kode || train.destination_station?.code || destination,
                originCity: train.asal_stasiun?.kota || train.origin_station?.city || 'Bandung',
                destinationCity: train.tujuan_stasiun?.kota || train.destination_station?.city || 'Jakarta',
                departureDate: train.tanggal_berangkat || train.departure_date || departureDate,
                travelDate: train.tanggal_berangkat || train.departure_date || departureDate,
                classes: [{
                  class: train.kelas || train.class_type || 'Executive',
                  subclass: train.subkelas || 'AD',
                  trainType: train.jenis_kereta || train.train_type || 'Executive',
                  price: price,
                  seatsLeft: seatsLeft,
                  isBestDeal: false, // Will be calculated later
                  demandStatus,
                  isSoldOut: seatsLeft === 0
                }],
                availableSeats: seatsLeft,
                isRefundable: train.refundable !== false,
                isCheckinAvailable: train.checkin_available !== false,
                isHighDemand: demandStatus === 'high',
                warning: seatsLeft < 5 ? 'High demand, sold out quickly!' : undefined
              };
            });

            // Find best deal
            const availableTrains = formattedTrains.filter(t => 
              t.classes.some(c => !c.isSoldOut && c.seatsLeft > 0)
            );
            
            if (availableTrains.length > 0) {
              const minPrice = Math.min(...availableTrains.map(t => 
                Math.min(...t.classes.filter(c => !c.isSoldOut).map(c => c.price))
              ));
              
              // Mark best deal
              formattedTrains.forEach(train => {
                train.classes.forEach(cls => {
                  if (!cls.isSoldOut && cls.price === minPrice) {
                    cls.isBestDeal = true;
                  }
                });
              });
            }

            setTrains(formattedTrains);
            console.log('✅ API data loaded:', formattedTrains.length, 'trains');
          } else {
            // Use mock data
            console.log('⚠️ No valid API data, using mock data');
            const mockData = generateMockTrains(origin, destination, departureDate);
            setTrains(mockData);
          }
        } else {
          console.log('❌ API response not OK, using mock data');
          const mockData = generateMockTrains(origin, destination, departureDate);
          setTrains(mockData);
        }
      } catch (fetchError: any) {
        if (fetchError.name === 'AbortError') {
          console.log('⏰ API request timeout, using mock data');
          setError('Request timeout. Showing sample data.');
        } else {
          console.error('❌ Error fetching from API:', fetchError);
          setError('Failed to load data. Showing sample data.');
        }
        const mockData = generateMockTrains(origin, destination, departureDate);
        setTrains(mockData);
      }
      
    } catch (error: any) {
      console.error('❌ Error in fetch process:', error);
      setError('Terjadi kesalahan. Menampilkan data contoh.');
      const mockData = generateMockTrains(origin, destination, departureDate);
      setTrains(mockData);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [origin, destination, departureDate, passengers]);

  useEffect(() => {
    fetchTrains();
  }, [fetchTrains]);

  return { trains, loading, error, refetch: fetchTrains };
};