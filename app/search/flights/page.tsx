'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import BookNowButton from '../../components/BookNowButton';
import { LocationMap } from '../../components/Maps/LocationMap';
import { realtimeService } from '../../services/realtimeService';

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
    latitude: number;
    longitude: number;
  };
  destination: {
    name: string;
    code: string;
    latitude: number;
    longitude: number;
  };
}

// --- Data Bandara ---
const airports = [
  {
    code: 'CGK',
    name: 'Bandara Soekarno-Hatta',
    city: 'Jakarta',
    latitude: -6.1256,
    longitude: 106.6558,
  },
  {
    code: 'DPS',
    name: 'Bandara Ngurah Rai',
    city: 'Denpasar',
    latitude: -8.7467,
    longitude: 115.1667,
  },
  {
    code: 'SUB',
    name: 'Bandara Juanda',
    city: 'Surabaya',
    latitude: -7.3797,
    longitude: 112.7869,
  },
  {
    code: 'JOG',
    name: 'Bandara Adisutjipto',
    city: 'Yogyakarta',
    latitude: -7.7882,
    longitude: 110.4318,
  },
];

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

// --- Komponen Form Pencarian ---
const SearchForm = ({ 
  onSearch,
  initialData 
}: {
  onSearch: (data: any) => void;
  initialData?: any;
}) => {
  const [formData, setFormData] = useState({
    origin: initialData?.origin || '',
    destination: initialData?.destination || '',
    departureDate: initialData?.departureDate || '',
    returnDate: initialData?.returnDate || '',
    passengers: initialData?.passengers || 1,
    class: initialData?.class || 'economy',
  });

  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSearch(formData);
    setLoading(false);
  };

  return (
    <div className="bg-white shadow-lg mb-8">
      <div className="container mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Asal</label>
            <select
              value={formData.origin}
              onChange={(e) => handleInputChange('origin', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Pilih Bandara</option>
              {airports.map(airport => (
                <option key={airport.code} value={airport.code}>
                  {airport.code} - {airport.city}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tujuan</label>
            <select
              value={formData.destination}
              onChange={(e) => handleInputChange('destination', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Pilih Bandara</option>
              {airports.map(airport => (
                <option key={airport.code} value={airport.code}>
                  {airport.code} - {airport.city}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Berangkat</label>
            <input
              type="date"
              value={formData.departureDate}
              onChange={(e) => handleInputChange('departureDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Penumpang</label>
            <select
              value={formData.passengers}
              onChange={(e) => handleInputChange('passengers', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {[1,2,3,4,5,6].map(num => (
                <option key={num} value={num}>{num} Penumpang</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
            <select
              value={formData.class}
              onChange={(e) => handleInputChange('class', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="economy">Ekonomi</option>
              <option value="business">Bisnis</option>
              <option value="first">First Class</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-blue-400"
            >
              {loading ? 'Mencari...' : 'Cari Penerbangan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Komponen Hasil Pencarian ---
const FlightResults = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [allFlights, setAllFlights] = useState<Flight[]>([]);
  const [filteredAndSortedFlights, setFilteredAndSortedFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortType, setSortType] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [airlineFilter, setAirlineFilter] = useState<string>('');
  const [priceRange, setPriceRange] = useState<{ min: number, max: number }>({ min: 0, max: 10000000 });
  const [availableAirlines, setAvailableAirlines] = useState<string[]>([]);
  const [selectedFlights, setSelectedFlights] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-2.5489, 118.0149]);
  const [mapMarkers, setMapMarkers] = useState<any[]>([]);
  const [searchData, setSearchData] = useState({
    origin: searchParams.get('origin') || '',
    destination: searchParams.get('destination') || '',
    departureDate: searchParams.get('departureDate') || '',
  });

  // Initialize realtime service
  useEffect(() => {
    realtimeService.connect();
    return () => {
      realtimeService.disconnect();
    };
  }, []);

  // Update map based on search
  const updateMap = (originCode: string, destinationCode: string) => {
    const originAirport = airports.find(a => a.code === originCode);
    const destinationAirport = airports.find(a => a.code === destinationCode);

    if (originAirport && destinationAirport) {
      const centerLat = (originAirport.latitude + destinationAirport.latitude) / 2;
      const centerLng = (originAirport.longitude + destinationAirport.longitude) / 2;
      setMapCenter([centerLat, centerLng]);

      setMapMarkers([
        {
          position: [originAirport.latitude, originAirport.longitude],
          title: originAirport.name,
          description: `Bandara ${originAirport.city}`,
          type: 'airport',
        },
        {
          position: [destinationAirport.latitude, destinationAirport.longitude],
          title: destinationAirport.name,
          description: `Bandara ${destinationAirport.city}`,
          type: 'airport',
        },
      ]);
    }
  };

  // Handle search form submission
  // Handle search form submission
const handleSearch = async (formData: any) => {
  setSearchData(formData);
  setLoading(true);
  setError(null);

  // Update URL with search parameters
  const params = new URLSearchParams();
  params.set('origin', formData.origin);
  params.set('destination', formData.destination);
  params.set('departureDate', formData.departureDate);
  router.replace(`?${params.toString()}`, { scroll: false });

  // Update map
  updateMap(formData.origin, formData.destination);

  try {
    const query = new URLSearchParams({ 
      origin: formData.origin, 
      destination: formData.destination, 
      departureDate: formData.departureDate 
    }).toString();
    
    const response = await fetch(`/api/search/flights?${query}`, { 
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch flights: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch flights');
    }

    const data = result.data || [];
    
    // DEBUG: Log data untuk melihat struktur
    console.log('Flight data received:', data);
    
    setAllFlights(data);
    setFilteredAndSortedFlights(data);
    
    // Extract available airlines and price range dengan pengecekan yang lebih aman
    if (data && data.length > 0) {
      try {
        // Pastikan semua properti ada sebelum diakses
        const validFlights = data.filter((flight: any) => 
          flight && 
          flight.transportasi && 
          typeof flight.transportasi.nama === 'string'
        );
        
        // Ekstrak nama maskapai hanya dari flight yang valid
        const airlinesSet = new Set(
          validFlights.map((flight: any) => flight.transportasi.nama.trim())
        );
        
        const airlinesArray = Array.from(airlinesSet) as string[];
        console.log('Extracted airlines:', airlinesArray);
        
        setAvailableAirlines(airlinesArray);
        
        // Ekstrak harga
        const validPrices = validFlights
          .map((flight: any) => flight.harga)
          .filter((price: any) => typeof price === 'number' && !isNaN(price));
        
        if (validPrices.length > 0) {
          setPriceRange({
            min: Math.min(...validPrices),
            max: Math.max(...validPrices)
          });
        } else {
          setPriceRange({ min: 0, max: 10000000 });
        }
      } catch (extractError) {
        console.error('Error extracting airlines or prices:', extractError);
        setAvailableAirlines([]);
        setPriceRange({ min: 0, max: 10000000 });
      }
    } else {
      // Reset jika tidak ada data
      setAvailableAirlines([]);
      setPriceRange({ min: 0, max: 10000000 });
    }
  } catch (error) {
    console.error('Error fetching flights:', error);
    setError(error instanceof Error ? error.message : 'An unknown error occurred');
    setAllFlights([]);
    setFilteredAndSortedFlights([]);
    setAvailableAirlines([]);
    setPriceRange({ min: 0, max: 10000000 });
  } finally {
    setLoading(false);
  }
};

const isValidFlight = (flight: any): flight is Flight => {
  return (
    flight &&
    typeof flight.id === 'string' &&
    typeof flight.waktu_berangkat === 'string' &&
    typeof flight.waktu_tiba === 'string' &&
    typeof flight.harga === 'number' &&
    typeof flight.kursi_tersedia === 'number' &&
    flight.transportasi &&
    typeof flight.transportasi.nama === 'string'
  );
};

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
  if (searchData.departureDate) {
    const dateObj = new Date(searchData.departureDate + 'T00:00:00');
    if (!isNaN(dateObj.getTime())) {
      formattedDate = dateObj.toLocaleDateString('id-ID', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  }

  const originAirport = airports.find(a => a.code === searchData.origin);
  const destinationAirport = airports.find(a => a.code === searchData.destination);

  return (
    <div className="min-h-screen bg-gray-50">
      <SearchForm onSearch={handleSearch} initialData={searchData} />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Search Results */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">Hasil Pencarian <PlaneTakeoffIcon /></h1>
                  <p className="text-gray-600">
                    {originAirport?.city || searchData.origin} → {destinationAirport?.city || searchData.destination}
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
                  ) : searchData.origin && searchData.destination ? (
                    <div className="text-center bg-white rounded-xl shadow-sm border border-gray-200 p-12">
                      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-3xl">✈️</span>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-4">Tidak Ada Penerbangan</h3>
                      <p className="text-gray-500">Tidak ditemukan penerbangan untuk rute dan tanggal yang dipilih.</p>
                    </div>
                  ) : (
                    <div className="text-center bg-white rounded-xl shadow-sm border border-gray-200 p-12">
                      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-3xl">✈️</span>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-4">Cari Penerbangan</h3>
                      <p className="text-gray-500">Isi form pencarian di atas untuk menemukan penerbangan terbaik.</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Map */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Peta Rute</h3>
              <LocationMap
                center={mapCenter}
                zoom={searchData.origin && searchData.destination ? 5 : 4}
                markers={mapMarkers}
                height="500px"
              />
              
              {searchData.origin && searchData.destination && (
                <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Informasi Rute</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Jarak:</span>
                      <span className="font-medium">~1,200 km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Waktu Tempuh:</span>
                      <span className="font-medium">2.5 jam</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Zona Waktu:</span>
                      <span className="font-medium">WIB → WITA</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
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