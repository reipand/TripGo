'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  routeType?: 'Direct' | 'Transit';
  transitDetails?: any[];
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
    departureDate: new Date().toISOString().split('T')[0],
    returnDate: '',
    passengers: 1,
    class: 'economy',
    transportType: 'train' // Default to train as per user request focus
  });

  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [searchPerformed, setSearchPerformed] = useState(false);

  const searchAbortControllerRef = React.useRef<AbortController | null>(null);

  // Real-time search function
  const performSearch = useCallback(async (searchFilters: SearchFilters) => {
    // Abort previous search if it exists
    if (searchAbortControllerRef.current) {
      searchAbortControllerRef.current.abort();
    }

    const controller = new AbortController();
    searchAbortControllerRef.current = controller;
    const signal = controller.signal;

    setLoading(true);
    setError(null);
    setSearchPerformed(true);
    setResults([]);

    try {
      const queryParams = new URLSearchParams({
        origin: searchFilters.origin,
        destination: searchFilters.destination,
        date: searchFilters.departureDate,
        transportType: searchFilters.transportType
      });

      const response = await fetch(`/api/search?${queryParams.toString()}`, { signal });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();

      if (data.results) {
        const mappedResults: SearchResult[] = data.results.map((item: any) => ({
          id: item.id,
          transportType: 'train', // API currently assumes train generally
          origin: item.origin_station.name,
          destination: item.destination_station.name,
          departureTime: item.departure_time,
          arrivalTime: item.arrival_time,
          duration: item.duration || 'N/A',
          price: item.price,
          availableSeats: item.availableSeats,
          trainName: item.train_name,
          class: item.class_type,
          stops: item.route_type === 'Transit' ? item.transit_details?.length : 0,
          routeType: item.route_type,
          transitDetails: item.transit_details,
          lastUpdated: new Date().toISOString()
        }));

        setResults(mappedResults);
        setLastUpdate(new Date());
      } else {
        setResults([]);
      }

    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('Search error:', err);
      setError(err.message || 'An error occurred while searching');
    } finally {
      if (searchAbortControllerRef.current === controller) {
        setLoading(false);
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchAbortControllerRef.current) {
        searchAbortControllerRef.current.abort();
      }
    };
  }, []);

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (filters.origin && filters.destination && filters.departureDate) {
      performSearch(filters);
    }
  };

  // Handle result selection
  const handleSelectResult = (result: SearchResult) => {
    // Navigate to booking or details page
    // For now, we can just log or show alert as the booking flow might be separate
    console.log('Selected:', result);
    // router.push(`/booking/${result.id}`); 
  };

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
              placeholder="Kota asal (e.g. Bandung)"
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
              placeholder="Kota tujuan (e.g. Gambir)"
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
              <option value="train">Kereta Api</option>
              {/* <option value="flight">Pesawat (Coming Soon)</option> */}
            </select>
          </div>

          {/* Search Button */}
          <div className="flex items-end col-span-2 md:col-span-1 md:col-start-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 flex items-center justify-center shadow-md"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Mencari...
                </>
              ) : (
                <>
                  <SearchIcon />
                  <span className="ml-2">Cari Tiket Real-time</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* Real-time Status */}
      {searchPerformed && !loading && !error && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full mr-2 animate-pulse shadow-sm shadow-green-400"></div>
              <span className="text-sm font-medium text-blue-800">Live Database Results</span>
            </div>
            {lastUpdate && (
              <span className="text-xs text-blue-600 font-mono">
                Updated: {lastUpdate.toLocaleTimeString('id-ID')}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Search Results */}
      {results.length > 0 ? (
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-bold text-gray-800 border-b pb-2">
            Hasil Pencarian ({results.length})
          </h3>
          <div className="grid gap-4">
            {results.map((result) => (
              <div
                key={result.id}
                onClick={() => handleSelectResult(result)}
                className="group border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-lg transition-all duration-200 cursor-pointer bg-white relative overflow-hidden"
              >
                {/* Transit Badge */}
                {result.routeType === 'Transit' && (
                  <div className="absolute top-0 right-0 bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-bl-lg border-l border-b border-orange-200">
                    TRANSIT ROUTE
                  </div>
                )}

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-start space-x-4 w-full md:w-auto">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-sm ${result.transportType === 'flight' ? 'bg-sky-100 text-sky-600' : 'bg-orange-100 text-orange-600'}`}>
                      {result.transportType === 'flight' ? <PlaneIcon /> : <TrainIcon />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-gray-900 text-lg">
                          {result.trainName}
                        </h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${result.class === 'Eksekutif' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                          {result.class}
                        </span>
                      </div>

                      <div className="flex items-center text-sm text-gray-500 gap-4 flex-wrap">
                        <div className="flex items-center">
                          <span className="font-medium text-gray-900 mr-1">{result.origin}</span>
                          <span className="text-gray-400 mx-1">→</span>
                          <span className="font-medium text-gray-900">{result.destination}</span>
                        </div>
                        <div className="flex items-center bg-gray-50 px-2 py-1 rounded">
                          <ClockIcon />
                          <span className="ml-1.5">{result.duration}</span>
                        </div>
                        <div className="flex items-center text-green-600">
                          <UsersIcon />
                          <span className="ml-1.5 font-medium">{result.availableSeats} seats</span>
                        </div>
                      </div>

                      {/* Transit Details */}
                      {result.routeType === 'Transit' && result.transitDetails && (
                        <div className="mt-3 text-xs bg-orange-50 p-2 rounded border border-orange-100 text-orange-800">
                          <span className="font-semibold block mb-1">Rute Transit:</span>
                          <ul className="list-disc pl-4 space-y-0.5">
                            {result.transitDetails.map((seg, idx) => (
                              <li key={idx}>
                                {seg.train_name}: {seg.dep} → {seg.arr}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right w-full md:w-auto flex flex-row md:flex-col justify-between items-center md:items-end border-t md:border-0 pt-3 md:pt-0 mt-2 md:mt-0">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        Rp {result.price.toLocaleString('id-ID')}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {result.departureTime?.slice(0, 5)} - {result.arrivalTime?.slice(0, 5)}
                      </div>
                    </div>
                    <button className="hidden md:block mt-3 bg-blue-600 text-white text-sm font-semibold px-6 py-2 rounded-full hover:bg-blue-700 transition">
                      Pilih
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        searchPerformed && !loading && (
          <div className="mt-10 text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <div className="text-gray-400 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="text-gray-500 font-medium">Tidak ada jadwal ditemukan untuk rute ini.</p>
            <p className="text-sm text-gray-400 mt-1">Coba ganti tanggal atau stasiun lain.</p>
          </div>
        )
      )}
    </div>
  );
};

export default RealtimeSearch;
