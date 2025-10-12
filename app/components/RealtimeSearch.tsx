'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { realtimeManager } from '@/app/lib/realtimeClient';

// Types
interface SearchFilters {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  class: 'economy' | 'business' | 'first';
  transportType: 'flight' | 'train';
}

interface SearchResult {
  id: string;
  transportType: 'flight' | 'train';
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  availableSeats: number;
  airline?: string;
  trainName?: string;
  class: string;
  stops?: number;
  lastUpdated: string;
}

// Icons
const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const PlaneIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const TrainIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>
);

const RealtimeSearch: React.FC = () => {
  const router = useRouter();
  const [filters, setFilters] = useState<SearchFilters>({
    origin: '',
    destination: '',
    departureDate: '',
    returnDate: '',
    passengers: 1,
    class: 'economy',
    transportType: 'flight'
  });

  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [searchPerformed, setSearchPerformed] = useState(false);

  // Mock data generator for demonstration
  const generateMockResults = useCallback((searchFilters: SearchFilters): SearchResult[] => {
    const mockResults: SearchResult[] = [];
    const now = new Date();
    
    for (let i = 0; i < 10; i++) {
      const departureTime = new Date(now.getTime() + (i * 2 + 1) * 60 * 60 * 1000);
      const arrivalTime = new Date(departureTime.getTime() + (2 + Math.random() * 4) * 60 * 60 * 1000);
      
      mockResults.push({
        id: `${searchFilters.transportType}-${i + 1}`,
        transportType: searchFilters.transportType,
        origin: searchFilters.origin,
        destination: searchFilters.destination,
        departureTime: departureTime.toLocaleTimeString('id-ID', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        arrivalTime: arrivalTime.toLocaleTimeString('id-ID', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        duration: `${Math.floor((arrivalTime.getTime() - departureTime.getTime()) / (1000 * 60 * 60))}j ${Math.floor(((arrivalTime.getTime() - departureTime.getTime()) % (1000 * 60 * 60)) / (1000 * 60))}m`,
        price: Math.floor(500000 + Math.random() * 2000000),
        availableSeats: Math.floor(Math.random() * 50) + 1,
        airline: searchFilters.transportType === 'flight' ? ['Garuda', 'Lion Air', 'AirAsia', 'Citilink'][Math.floor(Math.random() * 4)] : undefined,
        trainName: searchFilters.transportType === 'train' ? ['Argo Bromo', 'Taksaka', 'Gajayana', 'Bima'][Math.floor(Math.random() * 4)] : undefined,
        class: searchFilters.class,
        stops: searchFilters.transportType === 'flight' ? Math.floor(Math.random() * 2) : 0,
        lastUpdated: new Date().toISOString()
      });
    }
    
    return mockResults.sort((a, b) => a.price - b.price);
  }, []);

  // Real-time search function
  const performSearch = useCallback(async (searchFilters: SearchFilters) => {
    setLoading(true);
    setSearchPerformed(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate mock results
      const mockResults = generateMockResults(searchFilters);
      setResults(mockResults);
      setLastUpdate(new Date());
      
      // Subscribe to real-time updates
      if (searchFilters.transportType === 'flight') {
        realtimeManager.subscribeToFlights((payload) => {
          console.log('Flight data updated:', payload);
          // Update results based on real-time changes
          setResults(prevResults => 
            prevResults.map(result => {
              if (result.id === payload.new.id) {
                return { ...result, ...payload.new, lastUpdated: new Date().toISOString() };
              }
              return result;
            })
          );
          setLastUpdate(new Date());
        });
      } else {
        realtimeManager.subscribeToTrains((payload) => {
          console.log('Train data updated:', payload);
          // Update results based on real-time changes
          setResults(prevResults => 
            prevResults.map(result => {
              if (result.id === payload.new.id) {
                return { ...result, ...payload.new, lastUpdated: new Date().toISOString() };
              }
              return result;
            })
          );
          setLastUpdate(new Date());
        });
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, [generateMockResults]);

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (filters.origin && filters.destination && filters.departureDate) {
      performSearch(filters);
    }
  };

  // Handle result selection
  const handleSelectResult = (result: SearchResult) => {
    const searchParams = new URLSearchParams({
      origin: filters.origin,
      destination: filters.destination,
      departureDate: filters.departureDate,
      returnDate: filters.returnDate || '',
      passengers: filters.passengers.toString(),
      class: filters.class,
      transportType: filters.transportType
    });
    
    router.push(`/search/${filters.transportType}?${searchParams.toString()}`);
  };

  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      realtimeManager.unsubscribeAll();
    };
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Origin */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dari
            </label>
            <input
              type="text"
              value={filters.origin}
              onChange={(e) => setFilters(prev => ({ ...prev, origin: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Kota asal"
              required
            />
          </div>

          {/* Destination */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ke
            </label>
            <input
              type="text"
              value={filters.destination}
              onChange={(e) => setFilters(prev => ({ ...prev, destination: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Kota tujuan"
              required
            />
          </div>

          {/* Departure Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal Berangkat
            </label>
            <input
              type="date"
              value={filters.departureDate}
              onChange={(e) => setFilters(prev => ({ ...prev, departureDate: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          {/* Passengers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Penumpang
            </label>
            <select
              value={filters.passengers}
              onChange={(e) => setFilters(prev => ({ ...prev, passengers: parseInt(e.target.value) }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <option key={num} value={num}>{num} Penumpang</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Transport Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jenis Transportasi
            </label>
            <select
              value={filters.transportType}
              onChange={(e) => setFilters(prev => ({ ...prev, transportType: e.target.value as 'flight' | 'train' }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="flight">Pesawat</option>
              <option value="train">Kereta</option>
            </select>
          </div>

          {/* Class */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kelas
            </label>
            <select
              value={filters.class}
              onChange={(e) => setFilters(prev => ({ ...prev, class: e.target.value as 'economy' | 'business' | 'first' }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="economy">Ekonomi</option>
              <option value="business">Bisnis</option>
              <option value="first">First Class</option>
            </select>
          </div>

          {/* Search Button */}
          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Mencari...
                </>
              ) : (
                <>
                  <SearchIcon />
                  <span className="ml-2">Cari Tiket</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Real-time Status */}
      {searchPerformed && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              <span className="text-sm text-blue-700">Data real-time aktif</span>
            </div>
            {lastUpdate && (
              <span className="text-xs text-blue-600">
                Terakhir update: {lastUpdate.toLocaleTimeString('id-ID')}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Search Results */}
      {results.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Hasil Pencarian ({results.length} ditemukan)
          </h3>
          <div className="space-y-4">
            {results.map((result) => (
              <div
                key={result.id}
                onClick={() => handleSelectResult(result)}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      {result.transportType === 'flight' ? <PlaneIcon /> : <TrainIcon />}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold text-gray-800">
                          {result.transportType === 'flight' ? result.airline : result.trainName}
                        </h4>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {result.class}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>{result.origin} → {result.destination}</span>
                        <span className="flex items-center">
                          <ClockIcon />
                          <span className="ml-1">{result.duration}</span>
                        </span>
                        <span className="flex items-center">
                          <UsersIcon />
                          <span className="ml-1">{result.availableSeats} kursi tersedia</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">
                      Rp {result.price.toLocaleString('id-ID')}
                    </div>
                    <div className="text-sm text-gray-500">
                      {result.departureTime} - {result.arrivalTime}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RealtimeSearch;
