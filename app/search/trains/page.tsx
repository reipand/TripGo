// app/search/trains/page.tsx
'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFetchTrains } from '@/app/hooks/useFetchTrains';
// Perbarui import di page.tsx
import FilterAndSort from '@/app/components/FilterAndSort';
import TrainCard from '@/app/components/TrainCard';
import TrainSelectionSummary from '@/app//components/TrainSelectionSummary';
// Helper functions
const formatDateDisplay = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch (error) {
    return dateString;
  }
};

const originCodeToName = (code: string): string => {
  const stations: Record<string, string> = {
    'BD': 'Bandung',
    'GMR': 'Gambir',
    'SMC': 'Semarang',
    'ML': 'Malang',
    'SOL': 'Solo',
    'SBY': 'Surabaya',
    'YK': 'Yogyakarta',
    'BDO': 'Bandung',
    'JKT': 'Jakarta',
    'TNG': 'Tangerang',
    'BKS': 'Bekasi'
  };
  return stations[code] || code;
};

// Komponen Utama
const TrainResultsContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [sortType, setSortType] = useState('earliest');
  const [filterType, setFilterType] = useState('all');
  const [selectedTrain, setSelectedTrain] = useState<{
    train: any;
    trainClass: any;
  } | null>(null);
  
  const origin = searchParams.get('origin') || 'BD';
  const destination = searchParams.get('destination') || 'GMR';
  const departureDate = searchParams.get('departureDate') || new Date().toISOString().split('T')[0];
  const passengers = parseInt(searchParams.get('passengers') || '1');
  
  // Gunakan custom hook
  const { trains, loading, error } = useFetchTrains(
    origin,
    destination,
    departureDate,
    passengers
  );

  // Apply filters and sort
  const filteredTrains = useMemo(() => {
    if (!trains.length) return [];

    let result = [...trains];
    
    // Filter by class
    if (filterType !== 'all') {
      result = result.map(train => {
        const filteredClasses = train.classes.filter((cls: any) => 
          cls.class.toLowerCase().includes(filterType.toLowerCase())
        );
        
        if (filteredClasses.length > 0) {
          return {
            ...train,
            classes: filteredClasses
          };
        }
        return null;
      }).filter(Boolean) as any[];
    }
    
    // Sort
    result.sort((a, b) => {
      switch (sortType) {
        case 'earliest':
          return a.departureTime.localeCompare(b.departureTime);
        case 'latest':
          return b.departureTime.localeCompare(a.departureTime);
        case 'lowest':
          const aMinPrice = Math.min(...a.classes.map((c: any) => c.price));
          const bMinPrice = Math.min(...b.classes.map((c: any) => c.price));
          return aMinPrice - bMinPrice;
        case 'duration':
          const aDuration = parseInt(a.duration.replace(/\D/g, ''));
          const bDuration = parseInt(b.duration.replace(/\D/g, ''));
          return aDuration - bDuration;
        default:
          return 0;
      }
    });
    
    return result;
  }, [trains, sortType, filterType]);

  const handleSelectTrain = (train: any, trainClass: any) => {
    setSelectedTrain({ train, trainClass });
  };

  const handleDeselectTrain = () => {
    setSelectedTrain(null);
  };

  const handleRetrySearch = () => {
    router.push('/');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Skeleton loading sama seperti sebelumnya */}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center group">
              <div className="w-10 h-10 bg-[#FD7E14] rounded-lg flex items-center justify-center group-hover:bg-[#E06700] transition-colors">
                <span className="text-white font-bold text-lg">TG</span>
              </div>
              <span className="ml-3 text-xl font-bold text-gray-800">TripGo</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="text-sm text-yellow-700">
                  <span className="font-semibold">Perhatian:</span> {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search Summary */}
        <div className="mb-8 bg-white rounded-xl shadow p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Hasil Pencarian Kereta</h1>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-gray-600">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold">{originCodeToName(origin)} ({origin})</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                  <span className="font-semibold">{originCodeToName(destination)} ({destination})</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  <span>{formatDateDisplay(departureDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  <span>{passengers} Penumpang{passengers > 1 ? '' : ''}</span>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleRetrySearch}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Ubah Pencarian
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow p-6 sticky top-6">
              <h2 className="text-lg font-bold text-gray-800 mb-6">Filter & Sort</h2>
              
              <FilterAndSort 
                onSort={setSortType}
                onFilter={setFilterType}
                activeSort={sortType}
                activeFilter={filterType}
              />
              
              {/* Features */}
              <div className="space-y-4 mt-8">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h4 className="font-semibold text-blue-800">Print e-boarding pass</h4>
                      <p className="text-xs text-blue-600 mt-1">
                        Check in online. Skip the queue and enjoy a smoother journey.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h4 className="font-semibold text-green-800">100% Refund</h4>
                      <p className="text-xs text-green-600 mt-1">
                        Uncertain about travel date? Claim 100% refund for any reason.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {filteredTrains.length === 0 ? (
              <div className="bg-white rounded-xl shadow p-8 text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Tidak ada kereta yang ditemukan</h3>
                <p className="text-gray-500 mb-6">Silakan ubah kriteria pencarian Anda atau coba tanggal lain</p>
                <button
                  onClick={handleRetrySearch}
                  className="px-4 py-2 bg-[#FD7E14] text-white font-semibold rounded-lg hover:bg-[#E06700] transition-colors"
                >
                  Cari Lagi
                </button>
              </div>
            ) : (
              <>
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-600">
                      Menampilkan <span className="font-semibold text-gray-800">{filteredTrains.length}</span> kereta
                    </p>
                    <p className="text-xs text-gray-500">
                      Klik pada kelas kereta untuk memilih, kemudian lanjutkan ke pemesanan
                    </p>
                  </div>
                  
                  {/* Sort Status */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Diurutkan berdasarkan:</span>
                    <span className="text-sm font-medium text-[#FD7E14]">
                      {sortType === 'earliest' ? 'Keberangkatan Tercepat' :
                       sortType === 'latest' ? 'Keberangkatan Terlambat' :
                       sortType === 'lowest' ? 'Harga Terendah' :
                       'Durasi Terpendek'}
                    </span>
                  </div>
                </div>
                
                {/* Selected Train Summary */}
                {selectedTrain && (
                  <TrainSelectionSummary
                    train={selectedTrain.train}
                    selectedClass={selectedTrain.trainClass}
                    passengers={passengers}
                    onDeselect={handleDeselectTrain}
                  />
                )}
                
                <div className="space-y-6">
                  {filteredTrains.map((train) => (
                    <TrainCard
                      key={train.id}
                      train={train}
                      passengers={passengers}
                      onSelect={handleSelectTrain}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center text-gray-400 text-sm">
            © {new Date().getFullYear()} TripGo. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

// Export utama
export default function SearchTrainsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FD7E14] mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat hasil pencarian...</p>
        </div>
      </div>
    }>
      <TrainResultsContent />
    </Suspense>
  );
}