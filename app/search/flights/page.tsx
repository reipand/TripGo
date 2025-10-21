'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import BookNowButton from '../../components/BookNowButton';

// --- Tipe Data ---
interface Flight {
  id: string;
  waktu_berangkat: string;
  waktu_tiba: string;
  harga: number;
  kursi_tersedia: number;
  transportasi: {
    nama: string;
    tipe: string;
    logo: string;
  };
  routes: {
    kota_asal: string;
    kota_tujuan: string;
  };
  origin: {
    name: string;
    code: string;
  };
  destination: {
    name: string;
    code: string;
  };
}

// --- Komponen Ikon ---
const PlaneTakeoffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block -mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L6 12z" />
  </svg>
);

const FilterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
  </svg>
);

const SortIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
    <path d="M3 3h14a1 1 0 010 2H3a1 1 0 010-2zm0 6h14a1 1 0 010 2H3a1 1 0 010-2zm0 6h10a1 1 0 010 2H3a1 1 0 010-2z" />
  </svg>
);

// --- Komponen Kartu Tiket ---
const TicketCard = ({ flight, isSelected, onToggleCompare }: { 
  flight: Flight, 
  isSelected?: boolean, 
  onToggleCompare?: (flightId: string) => void 
}) => {
  const router = useRouter();
  const departure = new Date(flight.waktu_berangkat);
  const arrival = new Date(flight.waktu_tiba);

  const departureTime = departure.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const arrivalTime = arrival.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  let durationMs = arrival.getTime() - departure.getTime();
  if (durationMs < 0) {
    durationMs += 24 * 60 * 60 * 1000;
  }

  const durationMinutes = durationMs / (1000 * 60);
  const durationHours = Math.floor(durationMinutes / 60);
  const remainingMinutes = Math.round(durationMinutes % 60);
  const duration = `${durationHours}j ${remainingMinutes}m`;

  const isSoldOut = flight.kursi_tersedia <= 0;
  const isLimited = flight.kursi_tersedia > 0 && flight.kursi_tersedia <= 5;

  const handleSelectFlight = () => {
    router.push(`/flight/${flight.id}`);
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 transition-all duration-300 hover:shadow-xl ${isSelected ? 'ring-2 ring-[#FD7E14]' : ''}`}>
      {/* Compare checkbox */}
      {onToggleCompare && (
        <div className="flex items-center mb-2 md:mb-0">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleCompare(flight.id)}
            className="h-4 w-4 text-[#FD7E14] focus:ring-[#FD7E14] border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-600">Bandingkan</span>
        </div>
      )}
      
      <Image 
        src={`/images/airline-logo-${flight.transportasi.nama.toLowerCase().replace(/\s+/g, '-')}.png`} 
        alt={`${flight.transportasi.nama} logo`} 
        width={96} 
        height={96} 
        className="w-24 h-auto object-contain"
        onError={(e) => { e.currentTarget.src = '/images/airline-logo-default.png'; }}
        placeholder="blur"
        blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8+vR5PQAI/AL9pJ3lUAAAAABJRU5ErkJggg=="
      />
      
      <div className="flex-grow flex flex-col md:flex-row items-center text-center md:text-left">
        <div className="w-full md:w-1/3">
          <p className="text-xl font-bold text-gray-800">{departureTime}</p>
          <p className="text-sm text-gray-500">{flight.origin.name}</p>
          <p className="text-xs text-gray-400">{flight.origin.code}</p>
        </div>
        
        <div className="w-full md:w-1/3 text-center my-2 md:my-0">
          <p className="text-sm text-gray-500">{duration}</p>
          <div className="w-full h-px bg-gray-200 relative my-1">
            <span className="absolute left-0 top-1/2 -mt-1.5 w-3 h-3 bg-gray-300 rounded-full"></span>
            <span className="absolute right-0 top-1/2 -mt-1.5 w-3 h-3 bg-gray-300 rounded-full"></span>
          </div>
          <p className="text-sm text-gray-500">Langsung</p>
        </div>

        <div className="w-full md:w-1/3">
          <p className="text-xl font-bold text-gray-800">{arrivalTime}</p>
          <p className="text-sm text-gray-500">{flight.destination.name}</p>
          <p className="text-xs text-gray-400">{flight.destination.code}</p>
        </div>
      </div>

      <div className="md:border-l md:pl-4 text-center md:text-right">
        <p className="text-xl font-bold text-orange-500">Rp {flight.harga.toLocaleString('id-ID')}</p>
        <p className="text-xs text-gray-500">/pax</p>
        {isLimited && (
          <p className="text-red-500 text-sm font-semibold mt-1">Tersisa sedikit!</p>
        )}
        <div className="mt-2 flex flex-col space-y-2">
          {isSoldOut ? (
            <button className="w-full md:w-auto px-6 py-2 bg-gray-400 text-white font-semibold rounded-lg cursor-not-allowed">
              Habis
            </button>
          ) : (
            <BookNowButton
              flightId={flight.id}
              variant="primary"
              size="md"
              className="w-full md:w-auto bg-[#FD7E14] hover:bg-[#E06700]"
            >
              Pilih
            </BookNowButton>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Komponen Filter dan Sortir ---
const FilterAndSort = ({ 
  onSort, 
  onFilter, 
  onAirlineFilter,
  onPriceRangeFilter,
  activeSort, 
  activeFilter,
  activeAirlineFilter,
  priceRange,
  availableAirlines 
}: { 
  onSort: (sortType: string) => void, 
  onFilter: (filterType: string) => void,
  onAirlineFilter: (airline: string) => void,
  onPriceRangeFilter: (min: number, max: number) => void,
  activeSort: string,
  activeFilter: string,
  activeAirlineFilter: string,
  priceRange: { min: number, max: number },
  availableAirlines: string[]
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      {/* Basic Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4">
        {/* Bagian Sortir */}
        <div className="flex items-center flex-wrap mb-4 lg:mb-0">
          <div className="flex items-center text-sm font-semibold text-gray-700 mr-4 my-1">
            <SortIcon /> Urutkan:
          </div>
          <div className="flex flex-wrap space-x-2">
            <button 
              onClick={() => onSort('price-asc')} 
              className={`px-4 py-2 text-sm rounded-full transition-colors duration-200 ${activeSort === 'price-asc' ? 'bg-[#FD7E14] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Harga Termurah
            </button>
            <button 
              onClick={() => onSort('departure-asc')} 
              className={`px-4 py-2 text-sm rounded-full transition-colors duration-200 ${activeSort === 'departure-asc' ? 'bg-[#FD7E14] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Waktu Berangkat
            </button>
            <button 
              onClick={() => onSort('duration-asc')} 
              className={`px-4 py-2 text-sm rounded-full transition-colors duration-200 ${activeSort === 'duration-asc' ? 'bg-[#FD7E14] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Durasi Tercepat
            </button>
          </div>
        </div>

        {/* Bagian Filter Waktu */}
        <div className="flex items-center flex-wrap">
          <div className="flex items-center text-sm font-semibold text-gray-700 mr-4 my-1">
            <FilterIcon /> Filter Waktu:
          </div>
          <div className="flex flex-wrap space-x-2">
            <button 
              onClick={() => onFilter('morning')} 
              className={`px-4 py-2 text-sm rounded-full transition-colors duration-200 ${activeFilter === 'morning' ? 'bg-[#FD7E14] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Pagi (00:00 - 11:59)
            </button>
            <button 
              onClick={() => onFilter('afternoon')} 
              className={`px-4 py-2 text-sm rounded-full transition-colors duration-200 ${activeFilter === 'afternoon' ? 'bg-[#FD7E14] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Siang (12:00 - 17:59)
            </button>
            <button 
              onClick={() => onFilter('night')} 
              className={`px-4 py-2 text-sm rounded-full transition-colors duration-200 ${activeFilter === 'night' ? 'bg-[#FD7E14] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Malam (18:00 - 23:59)
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Filters Toggle */}
      <div className="border-t pt-4">
        <button 
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="flex items-center text-sm font-semibold text-[#0A58CA] hover:text-[#0548AD] transition-colors duration-200"
        >
          <FilterIcon />
          Filter Lanjutan
          <svg 
            className={`ml-2 h-4 w-4 transition-transform duration-200 ${showAdvancedFilters ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showAdvancedFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Airline Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Maskapai:</label>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => onAirlineFilter('')} 
                  className={`px-3 py-1 text-xs rounded-full transition-colors duration-200 ${activeAirlineFilter === '' ? 'bg-[#FD7E14] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Semua
                </button>
                {availableAirlines.map(airline => (
                  <button 
                    key={airline}
                    onClick={() => onAirlineFilter(airline)} 
                    className={`px-3 py-1 text-xs rounded-full transition-colors duration-200 ${activeAirlineFilter === airline ? 'bg-[#FD7E14] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    {airline}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Rentang Harga: Rp {priceRange.min.toLocaleString('id-ID')} - Rp {priceRange.max.toLocaleString('id-ID')}
              </label>
              <div className="flex items-center space-x-2">
                <input 
                  type="range" 
                  min={priceRange.min} 
                  max={priceRange.max} 
                  value={priceRange.max}
                  onChange={(e) => onPriceRangeFilter(priceRange.min, parseInt(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Komponen Hasil Pencarian ---
const FlightResults = () => {
  const searchParams = useSearchParams();
  const [allFlights, setAllFlights] = useState<Flight[]>([]);
  const [filteredAndSortedFlights, setFilteredAndSortedFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortType, setSortType] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [airlineFilter, setAirlineFilter] = useState<string>('');
  const [priceRange, setPriceRange] = useState<{ min: number, max: number }>({ min: 0, max: 10000000 });
  const [availableAirlines, setAvailableAirlines] = useState<string[]>([]);
  const [selectedFlights, setSelectedFlights] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  const origin = searchParams.get('origin') || 'Tidak Diketahui';
  const destination = searchParams.get('destination') || 'Tidak Diketahui';
  const departureDate = searchParams.get('departureDate');

  // Fetch data hanya saat parameter pencarian berubah
  useEffect(() => {
    const fetchFlights = async () => {
      if (!origin || !destination || !departureDate || origin === 'Tidak Diketahui') {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const query = new URLSearchParams({ 
          origin, 
          destination, 
          departureDate 
        }).toString();
        
        const response = await fetch(`/api/search/flights?${query}`, { 
          cache: 'no-store',
          headers: { 'Content-Type': 'application/json' }
        });

        const result = await response.json();
        
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to fetch flights');
        }

        const data = result.data || [];
        setAllFlights(data);
        setFilteredAndSortedFlights(data);
        
        // Extract available airlines and price range
        const airlines = [...new Set(data.map(flight => flight.transportasi.nama))];
        setAvailableAirlines(airlines);
        
        if (data.length > 0) {
          const prices = data.map(flight => flight.harga);
          setPriceRange({
            min: Math.min(...prices),
            max: Math.max(...prices)
          });
        }
      } catch (error) {
        console.error('Error fetching flights:', error);
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
        setAllFlights([]);
        setFilteredAndSortedFlights([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFlights();
  }, [origin, destination, departureDate]);

  // Filter & sort di client (tanpa re-fetch API)
  useEffect(() => {
    let result = [...allFlights];

    // Filter by time
    if (filterType) {
      result = result.filter(flight => {
        const departureHour = new Date(flight.waktu_berangkat).getHours();
        if (filterType === 'morning') return departureHour >= 0 && departureHour < 12;
        if (filterType === 'afternoon') return departureHour >= 12 && departureHour < 18;
        if (filterType === 'night') return departureHour >= 18 && departureHour <= 23;
        return true;
      });
    }

    // Filter by airline
    if (airlineFilter) {
      result = result.filter(flight => flight.transportasi.nama === airlineFilter);
    }

    // Filter by price range
    result = result.filter(flight => flight.harga >= priceRange.min && flight.harga <= priceRange.max);

    // Sort
    if (sortType) {
      result.sort((a, b) => {
        if (sortType === 'price-asc') return a.harga - b.harga;
        if (sortType === 'departure-asc') {
          return new Date(a.waktu_berangkat).getTime() - new Date(b.waktu_berangkat).getTime();
        }
        if (sortType === 'duration-asc') {
          let durationA = new Date(a.waktu_tiba).getTime() - new Date(a.waktu_berangkat).getTime();
          if (durationA < 0) durationA += 24 * 60 * 60 * 1000;
          let durationB = new Date(b.waktu_tiba).getTime() - new Date(b.waktu_berangkat).getTime();
          if (durationB < 0) durationB += 24 * 60 * 60 * 1000;
          return durationA - durationB;
        }
        return 0;
      });
    }

    setFilteredAndSortedFlights(result);
  }, [sortType, filterType, airlineFilter, priceRange, allFlights]);

  // Handle flight comparison
  const handleToggleCompare = (flightId: string) => {
    setSelectedFlights(prev => {
      if (prev.includes(flightId)) {
        return prev.filter(id => id !== flightId);
      } else if (prev.length < 3) {
        return [...prev, flightId];
      }
      return prev;
    });
  };

  // Scroll ke atas saat filter/sort berubah
  useEffect(() => {
    if (!loading) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [sortType, filterType, loading]);

  // Format tanggal dengan fallback
  let formattedDate = 'Tanggal tidak valid';
  if (departureDate) {
    const dateObj = new Date(departureDate + 'T00:00:00');
    if (!isNaN(dateObj.getTime())) {
      formattedDate = dateObj.toLocaleDateString('id-ID', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  }

  // Jika tidak ada parameter pencarian
  if (!searchParams.toString()) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-700">Mulai Pencarian Anda</h1>
        <p className="text-gray-500 mt-2">Silakan isi form di halaman utama untuk mencari penerbangan.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Hasil Pencarian <PlaneTakeoffIcon /></h1>
            <p className="text-gray-600">
              {origin} → {destination}
              <span className="mx-2 text-gray-400">|</span>
              {formattedDate}
            </p>
          </div>
          {selectedFlights.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {selectedFlights.length} penerbangan dipilih
              </span>
              <button
                onClick={() => setShowComparison(!showComparison)}
                className="px-4 py-2 bg-[#0A58CA] text-white rounded-lg hover:bg-[#0548AD] transition-colors duration-200"
              >
                {showComparison ? 'Sembunyikan' : 'Bandingkan'}
              </button>
            </div>
          )}
        </div>
      </div>
      
      <FilterAndSort 
        onSort={setSortType} 
        onFilter={setFilterType}
        onAirlineFilter={setAirlineFilter}
        onPriceRangeFilter={(min, max) => setPriceRange({ min, max })}
        activeSort={sortType}
        activeFilter={filterType}
        activeAirlineFilter={airlineFilter}
        priceRange={priceRange}
        availableAirlines={availableAirlines}
      />

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
              <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
                <div className="w-24 h-24 bg-gray-200 rounded"></div>
                <div className="flex-grow grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </div>
                  <div className="space-y-2 text-center">
                    <div className="h-4 bg-gray-200 rounded w-12 mx-auto"></div>
                    <div className="h-px bg-gray-200 w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-6 bg-gray-200 rounded w-16 ml-auto"></div>
                    <div className="h-4 bg-gray-200 rounded w-12 ml-auto"></div>
                  </div>
                </div>
                <div className="md:border-l md:pl-4 text-center md:text-right">
                  <div className="h-6 bg-gray-200 rounded w-24 mx-auto md:ml-auto"></div>
                  <div className="h-8 bg-gray-200 rounded w-20 mt-4 mx-auto md:ml-auto"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
              <p className="mt-2 text-sm text-red-600">
                Silakan coba lagi nanti atau periksa koneksi internet Anda.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {filteredAndSortedFlights.length > 0 && (
            <p className="text-sm text-gray-500 mb-4">
              Menampilkan {filteredAndSortedFlights.length} penerbangan
            </p>
          )}
          {/* Comparison View */}
          {showComparison && selectedFlights.length > 0 && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-800 mb-4">Perbandingan Penerbangan</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedFlights.map(flightId => {
                  const flight = filteredAndSortedFlights.find(f => f.id === flightId);
                  if (!flight) return null;
                  return (
                    <div key={flightId} className="bg-white p-4 rounded-lg border border-blue-200">
                      <div className="text-center">
                        <p className="font-semibold text-gray-800">{flight.transportasi.nama}</p>
                        <p className="text-2xl font-bold text-orange-500">Rp {flight.harga.toLocaleString('id-ID')}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(flight.waktu_berangkat).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - 
                          {new Date(flight.waktu_tiba).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-xs text-gray-400">{flight.kursi_tersedia} kursi tersedia</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {filteredAndSortedFlights.length > 0 ? (
              filteredAndSortedFlights.map(flight => (
                <TicketCard 
                  key={flight.id} 
                  flight={flight} 
                  isSelected={selectedFlights.includes(flight.id)}
                  onToggleCompare={handleToggleCompare}
                />
              ))
            ) : (
              <p className="text-center text-gray-500 mt-10">Tidak ada penerbangan yang ditemukan untuk rute dan tanggal ini.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// --- Error Boundary ---
class ErrorBoundary extends React.Component<{ children: React.ReactNode, fallback: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error di komponen:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// --- Export Utama ---
export default function SearchFlightsPage() {
  return (
    <ErrorBoundary fallback={<div className="p-6 text-center text-red-600">Terjadi kesalahan. Silakan refresh halaman.</div>}>
      <Suspense fallback={
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-gray-500">Memuat hasil pencarian...</p>
        </div>
      }>
        <FlightResults />
      </Suspense>
    </ErrorBoundary>
  );
}