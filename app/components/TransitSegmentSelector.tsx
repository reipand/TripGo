'use client';

import React, { useState, useEffect } from 'react';
import { TransitStation, TrainSegment } from '@/app/types';

interface TransitSegment {
  [x: string]: string;
  id: string;
  segment_order: number;
  origin_station: {
    nama_stasiun: string;
    city: string;
    kode_stasiun: string;
  };
  destination_station: {
    nama_stasiun: string;
    city: string;
    kode_stasiun: string;
  };
  departure_time: string;
  arrival_time: string;
  duration_minutes: number;
  waiting_minutes: number;
  price_adjustment: number;
  available_seats: number;
  real_time?: {
    available_seats: number;
    last_updated: string;
  };
}

interface TransitRoute {
  id: string;
  route_code: string;
  route_name: string;
  description: string;
  base_price: number;
  segments: TransitSegment[];
  total_duration: number;
  total_adjustment: number;
  min_available_seats: number;
}

interface TransitSegmentSelectorProps {
  origin: string;
  destination: string;
  departureDate: string;
  passengerCount: number;
  onSelect: (route: TransitRoute | null) => void;
  selectedRoute: TransitRoute | null;
  scheduleId?: string;
}

const TransitSegmentSelector: React.FC<TransitSegmentSelectorProps> = ({
  origin,
  destination,
  departureDate,
  passengerCount,
  onSelect,
  selectedRoute,
  scheduleId
}) => {
  const [transitRoutes, setTransitRoutes] = useState<TransitRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null);

  useEffect(() => {
    fetchTransitRoutes();
  }, [origin, destination, departureDate]);

  const fetchTransitRoutes = async () => {
    try {
      setLoading(true);
      setError(null);

      let url = `/api/transit/routes?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`;
      if (scheduleId) {
        url += `&scheduleId=${scheduleId}`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch transit routes');
      }

      const data = await response.json();
      
      if (data.success && data.routes) {
        setTransitRoutes(data.routes);
      } else {
        setTransitRoutes([]);
      }
    } catch (err: any) {
      console.error('Error fetching transit routes:', err);
      setError('Gagal memuat rute transit. Silakan coba lagi.');
      setTransitRoutes([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}j ${mins}m`;
  };

  const formatTime = (timeString: string): string => {
    try {
      return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return timeString;
    }
  };

  const calculateTotalPrice = (route: TransitRoute): number => {
    const basePrice = route.base_price || 0;
    const adjustments = route.total_adjustment || 0;
    const segmentAdjustments = route.segments?.reduce((sum, seg) => 
      sum + (seg.price_adjustment || 0), 0) || 0;
    
    return basePrice + adjustments + segmentAdjustments;
  };

  const getSegmentStatus = (segment: TransitSegment): {
    color: string;
    text: string;
    available: boolean;
  } => {
    const availableSeats = segment.real_time?.available_seats || segment.available_seats;
    
    if (availableSeats === 0) {
      return {
        color: 'bg-red-100 text-red-800',
        text: 'Habis',
        available: false
      };
    } else if (availableSeats < passengerCount) {
      return {
        color: 'bg-yellow-100 text-yellow-800',
        text: `Tersisa ${availableSeats}`,
        available: false
      };
    } else {
      return {
        color: 'bg-green-100 text-green-800',
        text: 'Tersedia',
        available: true
      };
    }
  };

  const isRouteAvailable = (route: TransitRoute): boolean => {
    return route.segments.every(segment => {
      const availableSeats = segment.real_time?.available_seats || segment.available_seats;
      return availableSeats >= passengerCount;
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <span className="ml-3 text-gray-600">Mencari rute transit...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-700">{error}</p>
          <button
            onClick={fetchTransitRoutes}
            className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  if (transitRoutes.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Pilihan Transit</h3>
            <p className="text-gray-600">Tidak ada rute transit yang tersedia untuk rute ini</p>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-gray-700">
            Saat ini tidak tersedia pilihan transit dari {origin} ke {destination}.
            Anda dapat melanjutkan dengan tiket langsung.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Pilihan Transit Multi-Segmen</h3>
          <p className="text-gray-600">
            {transitRoutes.length} rute transit tersedia
          </p>
        </div>
        {selectedRoute && (
          <button
            onClick={() => onSelect(null)}
            className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg font-medium"
          >
            Batalkan Transit
          </button>
        )}
      </div>

      {/* Selected Route Summary */}
      {selectedRoute && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h4 className="font-bold text-blue-800">Rute Transit Dipilih</h4>
                <p className="text-blue-600">{selectedRoute.route_name}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-blue-700">
                Rp {calculateTotalPrice(selectedRoute).toLocaleString('id-ID')}
              </div>
              <div className="text-sm text-blue-600">
                {selectedRoute.segments.length} segmen • {formatDuration(selectedRoute.total_duration)}
              </div>
            </div>
          </div>
          
          {/* Segment Timeline */}
          <div className="mt-4">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-300 ml-6"></div>
              
              {selectedRoute.segments.map((segment, index) => (
                <div key={segment.id} className="relative mb-6 last:mb-0">
                  <div className="flex items-start">
                    {/* Timeline dot */}
                    <div className={`w-4 h-4 rounded-full border-4 border-white ${
                      index === 0 ? 'bg-green-500' : 
                      index === selectedRoute.segments.length - 1 ? 'bg-red-500' : 
                      'bg-blue-500'
                    } z-10 ml-5`}></div>
                    
                    <div className="ml-6 flex-1 bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-bold text-gray-800">
                            Segmen {segment.segment_order}
                          </div>
                          <div className="text-sm text-gray-600">
                            {segment.origin_station.nama_stasiun} → {segment.destination_station.nama_stasiun}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-800">
                            {formatTime(segment.departure_time)} - {formatTime(segment.arrival_time)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatDuration(segment.duration_minutes)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Kelas:</span> {segment.train_class || 'Eksekutif'}
                        </div>
                        <div>
                          <span className="font-medium">Kursi:</span> {segment.available_seats} tersedia
                        </div>
                        {segment.waiting_minutes > 0 && (
                          <div className="col-span-2">
                            <span className="font-medium">Menunggu:</span> {segment.waiting_minutes} menit
                          </div>
                        )}
                        {segment.price_adjustment > 0 && (
                          <div className="col-span-2 text-green-600 font-medium">
                            +Rp {segment.price_adjustment.toLocaleString('id-ID')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Waiting time indicator */}
                  {segment.waiting_minutes > 0 && index < selectedRoute.segments.length - 1 && (
                    <div className="ml-14 mt-2 mb-2">
                      <div className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.414L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        Tunggu {segment.waiting_minutes} menit
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Available Routes */}
      <div className="space-y-4">
        {transitRoutes.map((route) => {
          const isAvailable = isRouteAvailable(route);
          const isSelected = selectedRoute?.id === route.id;
          const totalPrice = calculateTotalPrice(route);

          return (
            <div
              key={route.id}
              className={`border rounded-xl overflow-hidden transition-all ${
                isSelected
                  ? 'border-blue-500 ring-2 ring-blue-100'
                  : isAvailable
                  ? 'border-gray-300 hover:border-blue-300 hover:shadow-md'
                  : 'border-gray-200 opacity-60'
              }`}
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h4 className="font-bold text-lg text-gray-800 mr-3">
                        {route.route_name}
                      </h4>
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        {route.segments.length} Segmen
                      </span>
                      {!isAvailable && (
                        <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                          Terbatas
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 mb-3">{route.description}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.414L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        {formatDuration(route.total_duration)}
                      </div>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.707.293l4 4a1 1 0 01-1.414 1.414L12 4.414 8.707 7.707a1 1 0 01-1.414-1.414l4-4A1 1 0 0112 2z" clipRule="evenodd" />
                        </svg>
                        {route.min_available_seats} kursi tersedia
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right ml-4">
                    <div className="text-2xl font-bold text-orange-600">
                      Rp {totalPrice.toLocaleString('id-ID')}
                    </div>
                    <div className="text-sm text-gray-500">
                      {route.segments.length} kereta
                    </div>
                    <div className="mt-2">
                      {isSelected ? (
                        <span className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full">
                          Dipilih
                        </span>
                      ) : isAvailable ? (
                        <button
                          onClick={() => onSelect(route)}
                          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium"
                        >
                          Pilih Rute
                        </button>
                      ) : (
                        <span className="px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded-full">
                          Kursi Terbatas
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Expandable segment details */}
                <div className="mt-4">
                  <button
                    onClick={() => setExpandedRoute(expandedRoute === route.id ? null : route.id)}
                    className="flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <svg 
                      className={`w-5 h-5 mr-2 transition-transform ${
                        expandedRoute === route.id ? 'transform rotate-180' : ''
                      }`}
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Lihat Detail Segmen
                  </button>
                  
                  {expandedRoute === route.id && (
                    <div className="mt-4 pl-7 border-l-2 border-blue-200">
                      {route.segments.map((segment) => {
                        const status = getSegmentStatus(segment);
                        return (
                          <div key={segment.id} className="mb-4 last:mb-0">
                            <div className="flex items-start">
                              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                                <span className="font-bold text-gray-700">
                                  {segment.segment_order}
                                </span>
                              </div>
                              <div className="flex-1 bg-gray-50 p-3 rounded-lg">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <div className="font-medium text-gray-800">
                                      {segment.origin_station.nama_stasiun} → {segment.destination_station.nama_stasiun}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      {formatTime(segment.departure_time)} - {formatTime(segment.arrival_time)}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <span className={`px-2 py-1 text-xs rounded-full ${status.color}`}>
                                      {status.text}
                                    </span>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                                  <div>Durasi: {formatDuration(segment.duration_minutes)}</div>
                                  {segment.waiting_minutes > 0 && (
                                    <div>Menunggu: {segment.waiting_minutes}m</div>
                                  )}
                                  {segment.price_adjustment > 0 && (
                                    <div className="col-span-2 text-green-600 font-medium">
                                      +Rp {segment.price_adjustment.toLocaleString('id-ID')}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Information Footer */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">Informasi Transit Multi-Segmen</p>
            <ul className="space-y-1">
              <li>• Setiap segmen menggunakan kereta yang berbeda</li>
              <li>• Anda akan berpindah kereta di stasiun transit</li>
              <li>• Durasi termasuk waktu tunggu antar kereta</li>
              <li>• Kursi dijamin untuk setiap segmen perjalanan</li>
              <li>• Tiket dapat dicetak untuk setiap segmen</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransitSegmentSelector;