'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import BookNowButton from '../../components/BookNowButton';
import { LocationMap } from '../../components/Maps/LocationMap';
import { realtimeService } from '../../services/realtimeService';

// --- Fungsi Utilitas untuk Perhitungan Rute ---
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius bumi dalam km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return Math.round(distance);
}

function calculateFlightTime(distanceKm: number): {
  hours: number;
  minutes: number;
  totalHours: number;
} {
  const averageSpeed = 850; // km/jam
  const totalHours = distanceKm / averageSpeed;
  
  const hours = Math.floor(totalHours);
  const minutes = Math.round((totalHours - hours) * 60);
  
  return {
    hours,
    minutes,
    totalHours
  };
}

function getTimeZone(longitude: number): string {
  if (longitude >= 105 && longitude < 120) {
    return 'WIB';
  } else if (longitude >= 120 && longitude < 135) {
    return 'WITA';
  } else if (longitude >= 135) {
    return 'WIT';
  } else {
    return 'WIB';
  }
}

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
    timezone: 'WIB'
  },
  {
    code: 'DPS',
    name: 'Bandara Ngurah Rai',
    city: 'Denpasar',
    latitude: -8.7467,
    longitude: 115.1667,
    timezone: 'WITA'
  },
  {
    code: 'SUB',
    name: 'Bandara Juanda',
    city: 'Surabaya',
    latitude: -7.3797,
    longitude: 112.7869,
    timezone: 'WIB'
  },
  {
    code: 'JOG',
    name: 'Bandara Adisutjipto',
    city: 'Yogyakarta',
    latitude: -7.7882,
    longitude: 110.4318,
    timezone: 'WIB'
  },
  {
    code: 'UPG',
    name: 'Bandara Sultan Hasanuddin',
    city: 'Makassar',
    latitude: -5.0614,
    longitude: 119.5542,
    timezone: 'WITA'
  },
  {
    code: 'MDC',
    name: 'Bandara Sam Ratulangi',
    city: 'Manado',
    latitude: 1.5494,
    longitude: 124.9258,
    timezone: 'WITA'
  }
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
  const [tempPriceRange, setTempPriceRange] = useState(priceRange);

  useEffect(() => {
    setTempPriceRange(priceRange);
  }, [priceRange]);

  const handlePriceChange = (min: number, max: number) => {
    setTempPriceRange({ min, max });
    onPriceRangeFilter(min, max);
  };

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
            {activeSort && (
              <button 
                onClick={() => onSort('')} 
                className="px-4 py-2 text-sm rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors duration-200"
              >
                Reset Urutan
              </button>
            )}
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
            {activeFilter && (
              <button 
                onClick={() => onFilter('')} 
                className="px-4 py-2 text-sm rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors duration-200"
              >
                Reset Waktu
              </button>
            )}
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
                {activeAirlineFilter && (
                  <button 
                    onClick={() => onAirlineFilter('')} 
                    className="px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors duration-200"
                  >
                    Reset Maskapai
                  </button>
                )}
              </div>
            </div>

            {/* Price Range Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Rentang Harga: Rp {tempPriceRange.min.toLocaleString('id-ID')} - Rp {tempPriceRange.max.toLocaleString('id-ID')}
              </label>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <input 
                    type="range" 
                    min={priceRange.min} 
                    max={priceRange.max} 
                    value={tempPriceRange.max}
                    onChange={(e) => handlePriceChange(tempPriceRange.min, parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    disabled={priceRange.min === 0 && priceRange.max === 0}
                  />
                </div>
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 mb-1 block">Min: Rp {tempPriceRange.min.toLocaleString('id-ID')}</label>
                    <input
                      type="number"
                      min={priceRange.min}
                      max={tempPriceRange.max}
                      value={tempPriceRange.min}
                      onChange={(e) => handlePriceChange(parseInt(e.target.value) || priceRange.min, tempPriceRange.max)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      disabled={priceRange.min === 0 && priceRange.max === 0}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 mb-1 block">Max: Rp {tempPriceRange.max.toLocaleString('id-ID')}</label>
                    <input
                      type="number"
                      min={tempPriceRange.min}
                      max={priceRange.max}
                      value={tempPriceRange.max}
                      onChange={(e) => handlePriceChange(tempPriceRange.min, parseInt(e.target.value) || priceRange.max)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      disabled={priceRange.min === 0 && priceRange.max === 0}
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => handlePriceChange(priceRange.min, priceRange.max)}
                      className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors duration-200"
                      disabled={priceRange.min === 0 && priceRange.max === 0}
                    >
                      Reset
                    </button>
                  </div>
                </div>
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
  initialData,
  currentSearchData
}: {
  onSearch: (data: any) => void;
  initialData?: any;
  currentSearchData?: any;
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

  // Gantikan fungsi handleSubmit dalam SearchForm dengan ini:
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Validasi form
  if (!formData.origin || !formData.destination || !formData.departureDate) {
    alert('Harap isi semua field yang wajib diisi');
    return;
  }
  
  // Cek jika asal dan tujuan sama
  if (formData.origin === formData.destination) {
    alert('Bandara asal dan tujuan tidak boleh sama');
    return;
  }
  
  // Cek tanggal tidak boleh dari masa lalu
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDate = new Date(formData.departureDate);
  
  if (selectedDate < today) {
    alert('Tanggal keberangkatan tidak boleh dari hari kemarin');
    return;
  // Prevent search with same parameters
  if (
    currentSearchData &&
    formData.origin === currentSearchData.origin &&
    formData.destination === currentSearchData.destination &&
    formData.departureDate === currentSearchData.departureDate &&
    loading === false
  ) {
    return;
  }
    return;
  }
  
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Penumpang</label>
            <select
              value={formData.passengers}
              onChange={(e) => handleInputChange('passengers', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
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
  const [priceRange, setPriceRange] = useState<{ min: number, max: number }>({ min: 0, max: 5000000 });
  const [availableAirlines, setAvailableAirlines] = useState<string[]>([]);
  const [selectedFlights, setSelectedFlights] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-2.5489, 118.0149]);
  const [routeInfo, setRouteInfo] = useState<{
    distance: number;
    flightTime: { hours: number; minutes: number; totalHours: number };
    originTimezone: string;
    destTimezone: string;
    timezoneChange: boolean;
    timezoneInfo: string;
    co2Emissions: number;
    fuelConsumption: number;
    availableFlights: number;
  } | null>(null);
  const [resetFiltersKey, setResetFiltersKey] = useState(0);
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

  // Reset semua filter
  const resetAllFilters = () => {
    setSortType('');
    setFilterType('');
    setAirlineFilter('');
    setPriceRange(prev => {
      if (allFlights.length > 0) {
        const prices = allFlights.map(f => f.harga);
        return {
          min: Math.min(...prices),
          max: Math.max(...prices)
        };
      }
      return { min: 0, max: 5000000 };
    });
    setSelectedFlights([]);
    setShowComparison(false);
    setResetFiltersKey(prev => prev + 1);
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

    // Handle 400 response (no flights available) gracefully
    if (response.status === 400) {
      // Set empty flights and show user-friendly message
      setAllFlights([]);
      setFilteredAndSortedFlights([]);
      setError(null); // Clear any previous errors
      
      // Update route info if airports exist
      const originAirport = airports.find(a => a.code === formData.origin);
      const destinationAirport = airports.find(a => a.code === formData.destination);
      
      if (originAirport && destinationAirport) {
        const distance = calculateDistance(
          originAirport.latitude,
          originAirport.longitude,
          destinationAirport.latitude,
          destinationAirport.longitude
        );
        
        const flightTime = calculateFlightTime(distance);
        const originTimezone = getTimeZone(originAirport.longitude);
        const destTimezone = getTimeZone(destinationAirport.longitude);
        const timezoneChange = originTimezone !== destTimezone;
        
        setRouteInfo({
          distance,
          flightTime,
          originTimezone,
          destTimezone,
          timezoneChange,
          timezoneInfo: timezoneChange ? `${originTimezone} → ${destTimezone}` : originTimezone,
          co2Emissions: Math.round(distance * 0.115),
          fuelConsumption: Math.round(distance * 3.5),
          availableFlights: 0 // Set to 0 since no flights
        });
      }
      
      // Still update map even if no flights
      updateMap(formData.origin, formData.destination);
      
      // Reset filters
      resetAllFilters();
      setLoading(false);
      return;
    }

    // Handle other errors
    if (!response.ok) {
      throw new Error(`Gagal memuat data: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      // Handle API errors gracefully
      if (result.error?.includes('tidak ditemukan') || result.error?.includes('no flights') || result.error?.includes('tidak ada')) {
        // No flights available
        setAllFlights([]);
        setFilteredAndSortedFlights([]);
        setError(null);
        setRouteInfo(prev => prev ? { ...prev, availableFlights: 0 } : null);
        setLoading(false);
        return;
      }
      throw new Error(result.error || 'Terjadi kesalahan saat memuat data');
    }

    const data = result.data || [];
    
    setAllFlights(data);
    setFilteredAndSortedFlights(data);
    setError(null); // Clear any previous errors
    
    // Hitung informasi rute real-time
    const originAirport = airports.find(a => a.code === formData.origin);
    const destinationAirport = airports.find(a => a.code === formData.destination);
    
    if (originAirport && destinationAirport) {
      const distance = calculateDistance(
        originAirport.latitude,
        originAirport.longitude,
        destinationAirport.latitude,
        destinationAirport.longitude
      );
      
      const flightTime = calculateFlightTime(distance);
      const originTimezone = getTimeZone(originAirport.longitude);
      const destTimezone = getTimeZone(destinationAirport.longitude);
      const timezoneChange = originTimezone !== destTimezone;
      
      setRouteInfo({
        distance,
        flightTime,
        originTimezone,
        destTimezone,
        timezoneChange,
        timezoneInfo: timezoneChange ? `${originTimezone} → ${destTimezone}` : originTimezone,
        co2Emissions: Math.round(distance * 0.115),
        fuelConsumption: Math.round(distance * 3.5),
        availableFlights: data.length
      });
    } else {
      setRouteInfo(null);
    }
    
    // Extract available airlines and price range
    if (data && data.length > 0) {
      try {
        const validFlights = data.filter((flight: any) => 
          flight && 
          flight.transportasi && 
          typeof flight.transportasi.nama === 'string'
        );
        
        const airlinesSet = new Set(
          validFlights.map((flight: any) => flight.transportasi.nama.trim())
        );
        
        const airlinesArray = Array.from(airlinesSet) as string[];
        setAvailableAirlines(airlinesArray);
        
        const validPrices = validFlights
          .map((flight: any) => flight.harga)
          .filter((price: any) => typeof price === 'number' && !isNaN(price));
        
        if (validPrices.length > 0) {
          const minPrice = Math.min(...validPrices);
          const maxPrice = Math.max(...validPrices);
          
          // Periksa apakah priceRange saat ini masih valid untuk data baru
          const currentMin = priceRange.min;
          const currentMax = priceRange.max;
          
          if (currentMin === 0 && currentMax === 5000000) {
            setPriceRange({
              min: minPrice,
              max: maxPrice
            });
          } else if (currentMin > maxPrice || currentMax < minPrice) {
            setPriceRange({
              min: minPrice,
              max: maxPrice
            });
          }
        } else {
          setPriceRange({ min: 0, max: 5000000 });
        }
      } catch (extractError) {
        console.error('Error extracting airlines or prices:', extractError);
        // Pertahankan airlines yang ada
      }
    } else {
      setAvailableAirlines([]);
      setPriceRange({ min: 0, max: 5000000 });
    }
  } catch (error) {
    console.error('Error fetching flights:', error);
    
    // User-friendly error messages
    if (error instanceof TypeError && error.message.includes('fetch')) {
      setError('Gagal terhubung ke server. Periksa koneksi internet Anda.');
    } else {
      setError(error instanceof Error ? error.message : 'Terjadi kesalahan saat memuat data');
    }
    
    setAllFlights([]);
    setFilteredAndSortedFlights([]);
    setRouteInfo(null);
  } finally {
    setLoading(false);
  }
};

  // Filter & sort di client (tanpa re-fetch API)
  useEffect(() => {
    let result = [...allFlights];

    // Validasi data
    result = result.filter(flight => 
      flight && 
      flight.waktu_berangkat && 
      flight.harga !== undefined &&
      flight.harga >= 0
    );

    // Filter by time
    if (filterType) {
      result = result.filter(flight => {
        try {
          const departureHour = new Date(flight.waktu_berangkat).getHours();
          if (filterType === 'morning') return departureHour >= 0 && departureHour < 12;
          if (filterType === 'afternoon') return departureHour >= 12 && departureHour < 18;
          if (filterType === 'night') return departureHour >= 18 && departureHour <= 23;
          return true;
        } catch {
          return false;
        }
      });
    }

    // Filter by airline
    if (airlineFilter) {
      result = result.filter(flight => 
        flight.transportasi?.nama === airlineFilter
      );
    }

    // Filter by price range
    const currentPriceRange = priceRange;
    if (currentPriceRange.min !== undefined && currentPriceRange.max !== undefined) {
      result = result.filter(flight => 
        flight.harga >= currentPriceRange.min && 
        flight.harga <= currentPriceRange.max
      );
    }

    // Sort
    if (sortType) {
      result.sort((a, b) => {
        if (sortType === 'price-asc') return a.harga - b.harga;
        if (sortType === 'departure-asc') {
          return new Date(a.waktu_berangkat).getTime() - new Date(b.waktu_berangkat).getTime();
        }
        if (sortType === 'duration-asc') {
          try {
            let durationA = new Date(a.waktu_tiba).getTime() - new Date(a.waktu_berangkat).getTime();
            if (durationA < 0) durationA += 24 * 60 * 60 * 1000;
            let durationB = new Date(b.waktu_tiba).getTime() - new Date(b.waktu_berangkat).getTime();
            if (durationB < 0) durationB += 24 * 60 * 60 * 1000;
            return durationA - durationB;
          } catch {
            return 0;
          }
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
      <SearchForm onSearch={handleSearch} initialData={searchData} currentSearchData={searchData} />
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
                
                <div className="flex items-center space-x-3">
                  {/* Tombol reset semua filter */}
                  {(sortType || filterType || airlineFilter || priceRange.min !== priceRange.max) && (
                    <button
                      onClick={resetAllFilters}
                      className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Reset Semua Filter
                    </button>
                  )}
                  
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
            </div>
            
            <FilterAndSort 
              key={resetFiltersKey}
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
                    {error.includes('koneksi') && (
                      <button 
                        onClick={() => window.location.reload()}
                        className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                      >
                        Coba lagi
                      </button>
                    )}
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
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Tidak Ada Penerbangan Tersedia</h3>
          <p className="text-gray-500 mb-4">
            Maaf, tidak ditemukan penerbangan untuk rute dan tanggal yang dipilih.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => {
                // Suggest alternative dates
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const tomorrowStr = tomorrow.toISOString().split('T')[0];
                
                const nextWeek = new Date();
                nextWeek.setDate(nextWeek.getDate() + 7);
                const nextWeekStr = nextWeek.toISOString().split('T')[0];
                
                router.push(`/search/flights?origin=${searchData.origin}&destination=${searchData.destination}&departureDate=${tomorrowStr}`);
              }}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              Coba tanggal besok
            </button>
            <button
              onClick={() => {
                // Go back to search form with current values
                const form = document.querySelector('form');
                if (form) {
                  form.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Ubah pencarian
            </button>
            <button
              onClick={() => {
                // Coba penerbangan dengan rute sebaliknya
                router.push(`/search/flights?origin=${searchData.destination}&destination=${searchData.origin}&departureDate=${searchData.departureDate}`);
              }}
              className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
            >
              Coba rute sebaliknya
            </button>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Saran lain:</p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>• Coba tanggal lain di sekitar tanggal yang Anda pilih</li>
              <li>• Periksa apakah ada bandara alternatif di kota yang sama</li>
              <li>• Coba kelas penerbangan yang berbeda (Ekonomi/Bisnis)</li>
              <li>• Penerbangan mungkin sudah penuh atau tidak tersedia untuk tanggal tersebut</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="text-center bg-white rounded-xl shadow-sm border border-gray-200 p-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">✈️</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Cari Penerbangan</h3>
          <p className="text-gray-500">Isi form pencarian di atas untuk menemukan penerbangan terbaik.</p>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">📍</span>
              </div>
              <p className="font-medium text-gray-700">Pilih Rute</p>
              <p className="text-sm text-gray-500">Tentukan asal dan tujuan</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">📅</span>
              </div>
              <p className="font-medium text-gray-700">Pilih Tanggal</p>
              <p className="text-sm text-gray-500">Tentukan tanggal keberangkatan</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">👥</span>
              </div>
              <p className="font-medium text-gray-700">Pilih Penumpang</p>
              <p className="text-sm text-gray-500">Tentukan jumlah penumpang</p>
            </div>
          </div>
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
              
              {searchData.origin && searchData.destination && routeInfo && (
                <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Informasi Rute Real-time</h4>
                  <div className="space-y-3">
                    {/* Informasi Dasar */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-blue-50 p-3 rounded">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-sm font-medium text-gray-700">Jarak</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900 mt-1">{routeInfo.distance.toLocaleString('id-ID')} km</p>
                      </div>
                      
                      <div className="bg-green-50 p-3 rounded">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm font-medium text-gray-700">Waktu Tempuh</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900 mt-1">
                          {routeInfo.flightTime.hours > 0 && `${routeInfo.flightTime.hours}j `}
                          {routeInfo.flightTime.minutes > 0 && `${routeInfo.flightTime.minutes}m`}
                        </p>
                      </div>
                    </div>
                    
                    {/* Informasi Detail */}
                    <div className="space-y-2 text-sm border-t pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Zona Waktu
                        </span>
                        <span className={`font-medium ${routeInfo.timezoneChange ? 'text-orange-500' : 'text-gray-800'}`}>
                          {routeInfo.timezoneInfo}
                          {routeInfo.timezoneChange && (
                            <span className="ml-1 text-xs bg-orange-100 text-orange-800 px-1 rounded">Perubahan</span>
                          )}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                          </svg>
                          Estimasi CO₂
                        </span>
                        <span className="font-medium text-gray-800">{routeInfo.co2Emissions} kg</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4 4 0 003 15z" />
                          </svg>
                          Bahan Bakar
                        </span>
                        <span className="font-medium text-gray-800">{routeInfo.fuelConsumption.toLocaleString('id-ID')} L</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          Penerbangan Tersedia
                        </span>
                        <span className="font-medium text-gray-800">{routeInfo.availableFlights}</span>
                      </div>
                    </div>
                    
                    {/* Informasi Tambahan */}
                    {routeInfo.availableFlights > 0 && filteredAndSortedFlights.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-gray-500">
                          <span className="font-medium">Rata-rata harga:</span> Rp {
                            Math.round(filteredAndSortedFlights.reduce((sum, flight) => sum + flight.harga, 0) / filteredAndSortedFlights.length).toLocaleString('id-ID')
                          }
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          <span className="font-medium">Kursi tersedia:</span> {
                            filteredAndSortedFlights.reduce((sum, flight) => sum + flight.kursi_tersedia, 0)
                          } kursi
                        </p>
                      </div>
                    )}
                    
                    {/* Tips */}
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-gray-500 italic">
                        💡 Tips: Penerbangan pagi biasanya lebih murah dan memiliki delay lebih sedikit.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Tampilkan jika belum ada informasi rute */}
              {searchData.origin && searchData.destination && !routeInfo && !loading && (
                <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="h-16 bg-gray-200 rounded"></div>
                      <div className="h-16 bg-gray-200 rounded"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
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
// --- Error Boundary ---
class ErrorBoundary extends React.Component<{ children: React.ReactNode, fallback?: React.ReactNode, onGoHome?: () => void }, { hasError: boolean, error?: Error }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error di komponen:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Terjadi Kesalahan</h2>
          <p className="text-gray-600 mb-6">
            Maaf, terjadi masalah saat memuat halaman ini.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Muat Ulang Halaman
            </button>
            <button
              onClick={this.props.onGoHome}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Kembali ke Beranda
            </button>
          </div>
          <p className="mt-6 text-sm text-gray-500">
            Jika masalah berlanjut, silakan hubungi tim support kami.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Export Utama ---
export default function SearchFlightsPage() {
  const router = useRouter();
  return (
    <ErrorBoundary
      fallback={<div className="p-6 text-center text-red-600">Terjadi kesalahan. Silakan refresh halaman.</div>}
      onGoHome={() => router.push('/')}
    >
      <Suspense fallback={
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Memuat Hasil Pencarian</h3>
            <p className="text-gray-500">Mohon tunggu sebentar...</p>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      }>
        <FlightResults />
      </Suspense>
    </ErrorBoundary>
  );
}