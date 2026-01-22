'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

function getIconPath(name: 'plane' | 'train' | 'calendar' | 'user' | 'switch' | 'search' | 'price' | 'complete' | 'support',
  isActive: boolean = false) {
  const basePath = '/images/icons';

  if (name === 'plane' || name === 'train') {
    return `${basePath}/${name}${isActive ? '-active' : ''}.png`;
  }

  // Special handling for utility icons with hover states
  if (name === 'switch') {
    return `${basePath}/utils/${name}.png`;
  }

  // Regular utility icons
  if (name === 'calendar' || name === 'user') {
    return `${basePath}/utils/${name}.png`;
  }

  if (name === 'price' || name === 'complete' || name === 'support') {
    return `${basePath}/features/${name}.png`;
  }

  // All other utility icons
  return `${basePath}/utils/${name}.png`;
}

const IconComponent = ({ path, className = '', alt }: { path: string, className?: string, alt: string }) => (
    <img src={path} alt={alt} className={`h-5 w-5 ${className}`} />
);

const PlaneIcon = ({ isActive }: { isActive: boolean }) => (
  <IconComponent 
    path={getIconPath('plane', isActive)} 
    className={`mr-2 transition-colors duration-300`}
    alt="Ikon Pesawat"
  />
);

const TrainIcon = ({ isActive }: { isActive: boolean }) => (
  <IconComponent 
    path={getIconPath('train', isActive)} 
    className={`mr-2 transition-colors duration-300`}
    alt="Ikon Kereta"
  />
);

const CalendarIcon = () => (
  <IconComponent 
    path={getIconPath('calendar')} 
    className="text-gray-400" 
    alt="Ikon Kalender"
  />
);

const UserIcon = () => (
    <IconComponent 
      path={getIconPath('user')} 
      className="text-gray-400"
      alt="Ikon Pengguna" 
    />
);

const SwitchIcon = ({ onClick }: { onClick: () => void }) => (
  <img 
    onClick={onClick} 
    src={getIconPath('switch')} 
    alt="Ikon Tukar Lokasi" 
    className="h-5 w-5 text-gray-400 mx-2 cursor-pointer hover:text-gray-600 transition-colors duration-200"
  />
);

const FeatureIconContainer = ({ children }: { children: React.ReactNode }) => (
    <div className="p-4 bg-blue-100 rounded-full text-[#0A58CA] mb-3">
        {children}
    </div>
);

const SearchWidget = () => {
  const router = useRouter();
  const [tripType, setTripType] = useState('oneWay');
  const [stationSearchQuery, setStationSearchQuery] = useState('');
  const [filteredStations, setFilteredStations] = useState<any[]>([]);
  const [isLoadingStations, setIsLoadingStations] = useState(false);
  const [stations, setStations] = useState<any[]>([]);
  const [activeInputType, setActiveInputType] = useState<'origin' | 'destination' | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Ref untuk dropdown
  const originDropdownRef = useRef<HTMLDivElement>(null);
  const destinationDropdownRef = useRef<HTMLDivElement>(null);

  const today = useMemo(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }, []);

  const tomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  const [trainData, setTrainData] = useState({
    origin: '',
    destination: '',
    departureDate: today,
    returnDate: tomorrow,
    passengers: '1',
  });

  const [selectedOrigin, setSelectedOrigin] = useState<any>(null);
  const [selectedDestination, setSelectedDestination] = useState<any>(null);

  // Fetch popular stations
  useEffect(() => {
    const defaultStations = [
      { id: '1', code: 'GMR', name: 'Gambir', city: 'Jakarta', type: 'utama' },
      { id: '2', code: 'BD', name: 'Bandung', city: 'Bandung', type: 'utama' },
      { id: '3', code: 'SBY', name: 'Surabaya Gubeng', city: 'Surabaya', type: 'utama' },
      { id: '4', code: 'SMG', name: 'Semarang Tawang', city: 'Semarang', type: 'besar' },
      { id: '5', code: 'YK', name: 'Yogyakarta', city: 'Yogyakarta', type: 'utama' },
      { id: '6', code: 'BKS', name: 'Bekasi', city: 'Bekasi', type: 'besar' },
      { id: '7', code: 'SLO', name: 'Solo Balapan', city: 'Solo', type: 'besar' },
      { id: '8', code: 'MLG', name: 'Malang', city: 'Malang', type: 'besar' },
    ];
    
    setStations(defaultStations);
    setSelectedOrigin(defaultStations[1]);
    setSelectedDestination(defaultStations[0]);
    setTrainData(prev => ({
      ...prev,
      origin: `${defaultStations[1].name} (${defaultStations[1].code})`,
      destination: `${defaultStations[0].name} (${defaultStations[0].code})`
    }));

    const fetchData = async () => {
      try {
        const response = await fetch('/api/stations/popular');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (Array.isArray(data) && data.length > 0) {
          const stationsWithId = data.map((station: any, index: number) => ({
            ...station,
            id: station.id || `station-${index}`,
            type: station.type || (station.code === 'GMR' || station.code === 'BD' ? 'utama' : 'besar')
          }));
          
          setStations(stationsWithId);
          
          if (data.length >= 2) {
            const originStation = stationsWithId.find((s: any) => 
              s.code === 'BD' || s.name.toLowerCase().includes('bandung')
            ) || stationsWithId[1];
            
            const destinationStation = stationsWithId.find((s: any) => 
              s.code === 'GMR' || s.name.toLowerCase().includes('gambir')
            ) || stationsWithId[0];
            
            setSelectedOrigin(originStation);
            setSelectedDestination(destinationStation);
            
            setTrainData(prev => ({
              ...prev,
              origin: `${originStation.name} (${originStation.code})`,
              destination: `${destinationStation.name} (${destinationStation.code})`
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching popular stations:', error);
      }
    };
    
    fetchData();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      if (originDropdownRef.current && 
          !originDropdownRef.current.contains(target) &&
          !target.closest('.origin-input-container')) {
        setActiveInputType(prev => prev === 'origin' ? null : prev);
      }
      
      if (destinationDropdownRef.current && 
          !destinationDropdownRef.current.contains(target) &&
          !target.closest('.destination-input-container')) {
        setActiveInputType(prev => prev === 'destination' ? null : prev);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle trip type change
  const handleTripTypeChange = (type: string) => {
    setTripType(type);
    
    if (type === 'roundTrip') {
      const departure = new Date(trainData.departureDate);
      const nextDay = new Date(departure);
      nextDay.setDate(departure.getDate() + 1);
      
      setTrainData(prev => ({
        ...prev,
        returnDate: nextDay.toISOString().split('T')[0]
      }));
    } else {
      setTrainData(prev => ({
        ...prev,
        returnDate: ''
      }));
    }
  };

  // Search stations dengan debounce
  const searchStations = async (query: string) => {
    if (!query.trim()) {
      setFilteredStations([]);
      return;
    }

    setIsLoadingStations(true);
    
    try {
      const response = await fetch(`/api/stations/search?q=${encodeURIComponent(query)}&limit=15`);
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        // Fallback ke local search
        const filtered = stations.filter(station => 
          station.name.toLowerCase().includes(query.toLowerCase()) ||
          station.code.toLowerCase().includes(query.toLowerCase()) ||
          (station.city && station.city.toLowerCase().includes(query.toLowerCase()))
        );
        setFilteredStations(filtered);
      } else {
        const formattedData = data.map((station: any) => ({
          id: station.id || station.code,
          code: station.code,
          name: station.name,
          city: station.city || station.name.split(' ')[0],
          type: station.type || 'besar'
        }));
        setFilteredStations(formattedData);
      }
    } catch (error) {
      console.error('Error searching stations:', error);
      // Fallback ke local search
      const filtered = stations.filter(station => 
        station.name.toLowerCase().includes(query.toLowerCase()) ||
        station.code.toLowerCase().includes(query.toLowerCase()) ||
        (station.city && station.city.toLowerCase().includes(query.toLowerCase()))
      );
      setFilteredStations(filtered);
    } finally {
      setIsLoadingStations(false);
    }
  };

  // Debounce effect
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (stationSearchQuery.trim() && activeInputType) {
      searchTimeoutRef.current = setTimeout(() => {
        searchStations(stationSearchQuery);
      }, 300);
    } else {
      setFilteredStations([]);
    }
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [stationSearchQuery, activeInputType]);

  // Handle select station
  const handleSelectStation = (station: any, type: 'origin' | 'destination') => {
    if (!station) return;
    
    const displayValue = `${station.name} (${station.code})`;
    
    if (type === 'origin') {
      setSelectedOrigin(station);
      setTrainData(prev => ({ ...prev, origin: displayValue }));
    } else {
      setSelectedDestination(station);
      setTrainData(prev => ({ ...prev, destination: displayValue }));
    }
    
    setStationSearchQuery('');
    setFilteredStations([]);
    setActiveInputType(null);
  };

  // Handle switch locations
  const handleSwitchLocations = () => {
    if (!selectedOrigin || !selectedDestination) return;
    
    const tempOrigin = selectedOrigin;
    const tempDestination = selectedDestination;
    
    setSelectedOrigin(tempDestination);
    setSelectedDestination(tempOrigin);
    
    setTrainData(prev => ({
      ...prev,
      origin: prev.destination,
      destination: prev.origin,
    }));
  };

  // Handle date change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setTrainData(prev => {
      const newData = { ...prev, [name]: value };
      
      if (name === 'departureDate' && tripType === 'roundTrip' && value) {
        const departure = new Date(value);
        const nextDay = new Date(departure);
        nextDay.setDate(departure.getDate() + 1);
        
        const formattedNextDay = nextDay.toISOString().split('T')[0];
        
        if (!newData.returnDate || new Date(newData.returnDate) < nextDay) {
          newData.returnDate = formattedNextDay;
        }
      }
      
      return newData;
    });
  };

  // Handle search submit
  const handleSearchSubmit = async () => {
    if (!selectedOrigin || !selectedDestination) {
      alert('Harap pilih stasiun asal dan tujuan.');
      return;
    }
    
    if (!trainData.departureDate) {
      alert('Harap pilih tanggal pergi.');
      return;
    }
    
    if (tripType === 'roundTrip' && !trainData.returnDate) {
      alert('Harap pilih tanggal pulang.');
      return;
    }

    const departureDate = new Date(trainData.departureDate);
    const todayDate = new Date(today);
    
    todayDate.setHours(0, 0, 0, 0);
    departureDate.setHours(0, 0, 0, 0);
    
    if (departureDate < todayDate) {
      alert('Tanggal pergi tidak boleh kurang dari hari ini.');
      return;
    }

    if (tripType === 'roundTrip' && trainData.returnDate) {
      const returnDate = new Date(trainData.returnDate);
      if (returnDate < departureDate) {
        alert('Tanggal pulang tidak boleh kurang dari tanggal pergi.');
        return;
      }
    }

    const queryParams = new URLSearchParams({
      origin: selectedOrigin.code,
      destination: selectedDestination.code,
      departureDate: trainData.departureDate,
      passengers: trainData.passengers,
      tripType: tripType,
    });
    
    if (tripType === 'roundTrip' && trainData.returnDate) {
      queryParams.append('returnDate', trainData.returnDate);
    }
    
    router.push(`/search/trains?${queryParams.toString()}`);
  };

  // Station Input Component - PERBAIKAN: Type safety untuk trainData[type]
  const StationInput = ({ type, label, subLabel }: {
    type: 'origin' | 'destination';
    label: string;
    subLabel: string;
  }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    
    const selectedStation = type === 'origin' ? selectedOrigin : selectedDestination;
    const isOpen = activeInputType === type;
    
    // Display value - FIX: Type safety issue
    const displayValue = React.useMemo(() => {
      if (selectedStation) {
        return `${selectedStation.name} (${selectedStation.code})`;
      }
      // Akses yang lebih aman
      return type === 'origin' ? trainData.origin : trainData.destination;
    }, [selectedStation, trainData, type]);

    // Handle container click
    const handleContainerClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      
      if (isOpen) {
        setActiveInputType(null);
        setStationSearchQuery('');
      } else {
        setActiveInputType(type);
        setStationSearchQuery('');
        setTimeout(() => {
          inputRef.current?.focus();
        }, 50);
      }
    };

    // Handle search input change
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      e.stopPropagation();
      const value = e.target.value;
      setStationSearchQuery(value);
    };

    // Handle station selection
    const handleStationClick = (station: any, e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      handleSelectStation(station, type);
    };

    // Clear station
    const handleClearStation = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      
      if (type === 'origin') {
        setSelectedOrigin(null);
        setTrainData(prev => ({ ...prev, origin: '' }));
      } else {
        setSelectedDestination(null);
        setTrainData(prev => ({ ...prev, destination: '' }));
      }
      
      setActiveInputType(null);
      setStationSearchQuery('');
    };

    // Get stations to display
    const getDisplayStations = () => {
      if (stationSearchQuery.trim()) {
        return filteredStations;
      } else {
        const otherSelectedStation = type === 'origin' ? selectedDestination : selectedOrigin;
        return stations
          .filter(station => {
            if (otherSelectedStation && station.code === otherSelectedStation.code) {
              return false;
            }
            return true;
          })
          .slice(0, 8);
      }
    };

    const displayStations = getDisplayStations();
    const showSearchResults = stationSearchQuery.trim() && !isLoadingStations;
    const showPopularStations = !stationSearchQuery.trim() && !isLoadingStations;
    const showEmptyState = stationSearchQuery.trim() && !isLoadingStations && filteredStations.length === 0;

    // Render station badge
    const renderStationBadge = (stationType: string) => {
      const typeConfig = {
        'utama': { bg: 'bg-red-100', text: 'text-red-800', label: 'Utama' },
        'besar': { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Besar' },
        'medium': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Medium' },
      }[stationType] || { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Reguler' };
      
      return (
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${typeConfig.bg} ${typeConfig.text} ml-2`}>
          {typeConfig.label}
        </span>
      );
    };

    return (
      <div className="relative" ref={containerRef}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {selectedStation && (
            <span className="ml-2 text-xs text-gray-500">
              • {selectedStation.city}
            </span>
          )}
        </label>
        
        {/* Input Container */}
        <div 
          className={`bg-white border rounded-lg transition-all cursor-pointer min-h-[72px] flex items-center group ${
            isOpen 
              ? 'border-blue-500 ring-2 ring-blue-100 shadow-sm' 
              : 'border-gray-300 hover:border-blue-400 hover:shadow-sm'
          } ${!selectedStation ? 'hover:bg-gray-50' : ''}`}
          onClick={handleContainerClick}
          data-input-type={type}
        >
          <div className="p-3 w-full">
            <div className="text-xs text-gray-500 mb-1">{subLabel}</div>
            <div className="flex items-center justify-between">
              <div className="flex items-center min-w-0 flex-1">
                {selectedStation ? (
                  <>
                    <div className="flex items-center bg-blue-50 px-2 py-1 rounded-md mr-2">
                      <span className="text-xs font-bold text-blue-700">
                        {selectedStation.code}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate flex items-center">
                        {selectedStation.name}
                        {selectedStation.type && renderStationBadge(selectedStation.type)}
                      </div>
                      <div className="text-xs text-gray-500 truncate flex items-center mt-0.5">
                        <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        {selectedStation.city}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {displayValue}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      Klik untuk memilih stasiun
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
                {selectedStation && (
                  <button
                    onClick={handleClearStation}
                    className="p-1.5 hover:bg-gray-100 rounded-full transition-colors group/clear"
                    title="Hapus stasiun"
                  >
                    <svg className="w-3.5 h-3.5 text-gray-400 group-hover/clear:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                <div className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                  <svg 
                    className="w-4 h-4 text-gray-400 group-hover:text-gray-600" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dropdown */}
        {isOpen && (
          <div 
            ref={type === 'origin' ? originDropdownRef : destinationDropdownRef}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-[420px] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Header */}
            <div className="p-3 border-b bg-gray-50">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={stationSearchQuery}
                  onChange={handleSearchChange}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Cari stasiun (nama, kode, atau kota)..."
                  className="w-full px-4 py-3 pl-11 text-sm border border-gray-300 text-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  autoFocus
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <svg 
                    className="w-4 h-4 text-gray-400" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                {isLoadingStations && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                  </div>
                )}
              </div>
              <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
                <span>Contoh: Gambir, BD (Bandung), Surabaya</span>
                <span className="text-gray-400">{displayStations.length} stasiun</span>
              </div>
            </div>
            
            {/* Content Area */}
            <div className="flex-1 overflow-y-auto">
              {isLoadingStations ? (
                <div className="px-4 py-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-3"></div>
                  <p className="text-sm text-gray-500">Mencari stasiun...</p>
                </div>
              ) : showEmptyState ? (
                <div className="px-4 py-8 text-center">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-gray-500 font-medium">Stasiun tidak ditemukan</p>
                  <p className="text-xs text-gray-400 mt-1">Coba dengan kata kunci yang berbeda</p>
                  <div className="mt-4 flex flex-wrap gap-2 justify-center">
                    {['GMR', 'BD', 'SBY', 'SMG', 'YK'].map(code => (
                      <button
                        key={code}
                        onClick={(e) => {
                          e.stopPropagation();
                          setStationSearchQuery(code);
                        }}
                        className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                      >
                        {code}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {/* Header untuk hasil pencarian */}
                  {showSearchResults && (
                    <div className="px-3 py-2.5 bg-blue-50">
                      <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Hasil Pencarian ({filteredStations.length})
                      </div>
                    </div>
                  )}
                  
                  {/* Header untuk stasiun populer */}
                  {showPopularStations && (
                    <div className="px-3 py-2.5 bg-gray-50">
                      <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Stasiun Populer
                      </div>
                    </div>
                  )}

                  {/* List Stasiun */}
                  {displayStations.map((station) => (
                    <button
                      key={station.id || station.code}
                      onClick={(e) => handleStationClick(station, e)}
                      className={`w-full px-4 py-3 text-left hover:bg-blue-50 flex items-center justify-between ${
                        selectedStation?.code === station.code 
                          ? 'bg-blue-50 border-l-4 border-blue-500' 
                          : 'border-l-4 border-transparent'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center mb-1.5">
                          <div className={`px-2 py-1 rounded-md mr-3 ${
                            station.type === 'utama' 
                              ? 'bg-red-100' 
                              : station.type === 'besar'
                              ? 'bg-orange-100'
                              : 'bg-blue-100'
                          }`}>
                            <span className={`text-xs font-bold ${
                              station.type === 'utama' 
                                ? 'text-red-700' 
                                : station.type === 'besar'
                                ? 'text-orange-700'
                                : 'text-blue-700'
                            }`}>
                              {station.code}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center">
                              <span className="font-semibold text-gray-900 truncate text-sm">
                                {station.name}
                              </span>
                              {station.type && (
                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ml-2 ${
                                  station.type === 'utama' 
                                    ? 'bg-red-100 text-red-800' 
                                    : station.type === 'besar'
                                    ? 'bg-orange-100 text-orange-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {station.type === 'utama' ? 'Utama' : 
                                   station.type === 'besar' ? 'Besar' : 'Reguler'}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center text-xs text-gray-500 mt-1">
                              <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              </svg>
                              <span className="truncate">{station.city || station.name.split(' ')[0]}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center ml-2">
                        {selectedStation?.code === station.code ? (
                          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Footer dengan stasiun terpilih */}
            {selectedStation && (
              <div className="px-4 py-2.5 border-t bg-gray-50">
                <div className="text-xs text-gray-600 flex items-center">
                  <svg className="w-3 h-3 text-green-500 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Stasiun terpilih: </span>
                  <span className="font-semibold text-gray-900 ml-1">
                    {selectedStation.name} ({selectedStation.code})
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Date Picker Component
  const DatePickerInput = ({ name, value, label }: {
    name: 'departureDate' | 'returnDate';
    value: string;
    label: string;
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const datePickerRef = useRef<HTMLDivElement>(null);

    const isDeparture = name === 'departureDate';
    const minDate = isDeparture ? today : trainData.departureDate;

    const formatDisplayDate = (dateString: string) => {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        
        return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
      } catch {
        return '';
      }
    };

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDateSelect = (dateValue: string) => {
      const fakeEvent = {
        target: { name, value: dateValue }
      } as React.ChangeEvent<HTMLInputElement>;
      
      handleDateChange(fakeEvent);
      setIsOpen(false);
    };

    return (
      <div className="relative" ref={datePickerRef}>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <div 
          className={`bg-white border rounded-lg transition-colors cursor-pointer min-h-[72px] flex items-center ${
            isOpen ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-300 hover:border-gray-400'
          }`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="p-3 w-full">
            <div className="text-xs text-gray-500 mb-1">
              Tanggal {isDeparture ? 'Pergi' : 'Pulang'}
            </div>
            <div className="text-sm font-medium text-gray-900 flex justify-between items-center">
              <span className="truncate">{formatDisplayDate(value) || 'Pilih tanggal'}</span>
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <input
              type="date"
              name={name}
              value={value}
              onChange={handleDateChange}
              min={minDate}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>

        {isOpen && (
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pilih Tanggal {isDeparture ? 'Pergi' : 'Pulang'}
              </label>
              <input
                type="date"
                name={name}
                value={value}
                onChange={(e) => handleDateSelect(e.target.value)}
                min={minDate}
                className="w-full p-3 border border-gray-300 text-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  // Passenger Select
  const PassengerSelect = () => (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">Penumpang</label>
      <div className="relative bg-white border border-gray-300 rounded-lg hover:border-blue-400 transition-colors min-h-[72px] flex items-center">
        <div className="p-3 w-full">
          <div className="text-xs text-gray-500 mb-1">Jumlah Penumpang</div>
          <select 
            value={trainData.passengers}
            onChange={(e) => setTrainData(prev => ({ ...prev, passengers: e.target.value }))}
            className="w-full bg-transparent appearance-none focus:outline-none text-sm font-medium text-gray-900 cursor-pointer"
          >
            {[1,2,3,4,5,6,7,8,9].map(num => (
              <option key={num} value={num}>{num} Penumpang</option>
            ))}
          </select>
        </div>
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-5xl">
      {/* Header */}
      <div className="flex border-b border-gray-200 mb-6">
        <button className="flex items-center pb-4 pt-1 px-5 text-base font-semibold border-b-2 border-[#0A58CA] text-[#0A58CA]">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 100-4V6z" />
          </svg>
          <span>Kereta Api KAI</span>
        </button>
      </div>

      {/* Trip Type */}
      <div className="flex items-center flex-wrap gap-4 mb-6">
        <div className="flex items-center space-x-4">
          <label className="flex items-center cursor-pointer">
            <input 
              type="radio" 
              name="tripType" 
              value="oneWay" 
              checked={tripType === 'oneWay'} 
              onChange={() => handleTripTypeChange('oneWay')} 
              className="hidden" 
            />
            <div className={`flex items-center ${tripType === 'oneWay' ? 'text-blue-600' : 'text-gray-500'}`}>
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                tripType === 'oneWay' ? 'border-blue-600 bg-blue-600' : 'border-gray-400'
              }`}>
                {tripType === 'oneWay' && <span className="w-2 h-2 bg-white rounded-full"></span>}
              </div>
              <span className="ml-2 font-medium">Sekali Jalan</span>
            </div>
          </label>
          
          <label className="flex items-center cursor-pointer">
            <input 
              type="radio" 
              name="tripType" 
              value="roundTrip" 
              checked={tripType === 'roundTrip'} 
              onChange={() => handleTripTypeChange('roundTrip')} 
              className="hidden" 
            />
            <div className={`flex items-center ${tripType === 'roundTrip' ? 'text-blue-600' : 'text-gray-500'}`}>
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                tripType === 'roundTrip' ? 'border-blue-600 bg-blue-600' : 'border-gray-400'
              }`}>
                {tripType === 'roundTrip' && <span className="w-2 h-2 bg-white rounded-full"></span>}
              </div>
              <span className="ml-2 font-medium">Pulang-Pergi</span>
              {tripType === 'roundTrip' && (
                <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-0.5 rounded-full">
                  Hemat 15%
                </span>
              )}
            </div>
          </label>
        </div>
      </div>

      {/* Form Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <StationInput type="origin" label="Dari" subLabel="Asal" />
        
        <div className="flex items-center justify-center">
          <button 
            onClick={handleSwitchLocations}
            className="w-10 h-10 rounded-full border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-50 hover:border-blue-400 transition-colors shadow-sm mt-6"
            title="Tukar asal dan tujuan"
            disabled={!selectedOrigin || !selectedDestination}
          >
            <svg className={`w-5 h-5 ${!selectedOrigin || !selectedDestination ? 'text-gray-300' : 'text-gray-600 hover:text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
        </div>

        <StationInput type="destination" label="Ke" subLabel="Tujuan" />

        <div className={tripType === 'roundTrip' ? 'col-span-1' : 'col-span-1 md:col-span-2 lg:col-span-1'}>
          <DatePickerInput 
            name="departureDate"
            value={trainData.departureDate}
            label="Tanggal Pergi"
          />
        </div>

        {tripType === 'roundTrip' && (
          <div className="col-span-1">
            <DatePickerInput 
              name="returnDate"
              value={trainData.returnDate}
              label="Tanggal Pulang"
            />
          </div>
        )}

        <div className={tripType === 'roundTrip' ? 'col-span-1 md:col-span-3 lg:col-span-1' : 'col-span-1 md:col-span-2 lg:col-span-1'}>
          <PassengerSelect />
        </div>
      </div>

      {/* Search Button */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pt-6 border-t border-gray-200 mt-6">
        <div className="mb-4 md:mb-0">
          <p className="text-gray-600 text-sm italic">"A comfy and reliable transportation"</p>
          <p className="text-xs text-gray-500 mt-1">
            *Termasuk pajak dan biaya layanan. Pembatalan sesuai ketentuan KAI.
          </p>
        </div>
        
        <button 
          onClick={handleSearchSubmit}
          disabled={!selectedOrigin || !selectedDestination}
          className={`px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold text-sm rounded-lg transition-all duration-300 flex items-center justify-center shadow-lg ${
            !selectedOrigin || !selectedDestination
              ? 'opacity-50 cursor-not-allowed from-gray-400 to-gray-500 shadow-gray-400/30'
              : 'hover:from-red-700 hover:to-red-800 shadow-red-500/30 hover:shadow-red-500/50'
          }`}
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span>CARI TIKET KERETA</span>
        </button>
      </div>
    </div>
  );
};

// --- Komponen Kartu Promo ---
const PromoCard = ({ imageUrl, title, description, discount, validUntil, tag }: { 
  imageUrl: string; 
  title: string; 
  description: string;
  discount: string;
  validUntil: string;
  tag: string;
}) => (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-100 group cursor-pointer" data-aos="fade-right">
        <div className="relative h-40 overflow-hidden">
            <img 
                src={imageUrl} 
                alt={title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                loading="lazy"
            />
            {/* Discount Badge */}
            <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                {discount}
            </div>
            {/* Tag */}
            <div className="absolute top-3 right-3 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                {tag}
            </div>
            {/* Gradient Overlay */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/50 to-transparent"></div>
        </div>
        
        <div className="p-5">
            <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-lg text-gray-900 group-hover:text-[#0A58CA] transition-colors duration-300 flex-1 pr-2">{title}</h3>
                <div className="bg-green-50 text-green-600 text-xs px-2 py-1 rounded-full font-medium">
                    Tersedia
                </div>
            </div>
            <p className="text-gray-600 text-sm mb-3 leading-relaxed">{description}</p>
            
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center text-gray-500 text-xs">
                    <CalendarIcon />
                    <span className="ml-1">Berlaku hingga {validUntil}</span>
                </div>
                <button className="bg-[#FD7E14] hover:bg-[#E06700] text-white text-sm px-4 py-2 rounded-full font-medium transition-colors duration-300 flex items-center">
                    Klaim Sekarang
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>
    </div>
);

// --- Komponen Kartu Destinasi Populer ---
const DestinationCard = ({ imageUrl, name, price, rating, reviews, delay }: { 
  imageUrl: string; 
  name: string; 
  price: string; 
  rating: number;
  reviews: string;
  delay: number;
}) => (
    <div className="group cursor-pointer" data-aos="fade-up" data-aos-delay={delay}>
        <div className="relative overflow-hidden rounded-2xl h-64 shadow-sm hover:shadow-xl transition-all duration-500">
            <img 
                src={imageUrl} 
                alt={name} 
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-5 flex flex-col justify-end">
                {/* Rating Badge */}
                <div className="flex items-center mb-2">
                    <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-1">
                        <StarIcon className="w-4 h-4 text-yellow-400" />
                        <span className="text-white text-sm font-semibold">{rating}</span>
                        <span className="text-white/80 text-xs">({reviews})</span>
                    </div>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-1">{name}</h3>
                <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-amber-400">{price}</p>
                    <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full transition-colors duration-300">
                        Lihat Detail
                    </button>
                </div>
            </div>
            
            {/* Hover Effect Overlay */}
            <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
    </div>
);

// --- Komponen Kartu Keunggulan (Why Choose Us) ---
const FeatureCard = ({ title, description, iconPath, delay }: { 
  title: string; 
  description: string; 
  iconPath: string;
  delay?: number;
}) => (
    <div className="p-6 text-center bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group" 
         data-aos="fade-up" 
         data-aos-delay={delay}>
        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl text-[#0A58CA] mb-4 inline-flex group-hover:scale-110 transition-transform duration-300">
            <img src={iconPath} alt={`Ikon ${title}`} className="h-8 w-8"/>
        </div>
        <h3 className="font-bold text-lg mb-3 text-gray-900 group-hover:text-[#0A58CA] transition-colors duration-300">{title}</h3>
        <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
    </div>
);

// Komponen Langkah Pemesanan
const StepCard = ({ number, title, description, icon }: { 
  number: number; 
  title: string; 
  description: string;
  icon: React.ReactNode;
}) => (
  <div className="text-center group" data-aos="fade-up">
    <div className="relative mb-6">
      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg">
        <div className="text-white font-bold text-xl">{number}</div>
      </div>
      <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
        {icon}
      </div>
    </div>
    <h3 className="font-bold text-lg text-gray-900 mb-3">{title}</h3>
    <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
  </div>
);

// Komponen Testimonial
const TestimonialCard = ({ name, location, rating, comment, avatar }: { 
  name: string; 
  location: string; 
  rating: number;
  comment: string;
  avatar: string;
}) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300" data-aos="fade-up">
    <div className="flex items-center mb-4">
      <img src={avatar} alt={name} className="w-12 h-12 rounded-full object-cover" />
      <div className="ml-4">
        <h4 className="font-semibold text-gray-900">{name}</h4>
        <p className="text-gray-500 text-sm">{location}</p>
      </div>
    </div>
    <div className="flex items-center mb-3">
      {[...Array(5)].map((_, i) => (
        <StarIcon 
          key={i} 
          className={`w-4 h-4 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`} 
        />
      ))}
      <span className="text-gray-600 text-sm ml-2">{rating}.0</span>
    </div>
    <p className="text-gray-700 text-sm leading-relaxed">"{comment}"</p>
  </div>
);

// Komponen Blog Card
const BlogCard = ({ imageUrl, title, excerpt, date, readTime, category }: { 
  imageUrl: string; 
  title: string; 
  excerpt: string;
  date: string;
  readTime: string;
  category: string;
}) => (
  <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group cursor-pointer" data-aos="fade-up">
    <div className="relative h-48 overflow-hidden">
      <img 
        src={imageUrl} 
        alt={title} 
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      <div className="absolute top-3 left-3 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
        {category}
      </div>
    </div>
    <div className="p-6">
      <div className="flex items-center text-gray-500 text-sm mb-3">
        <span>{date}</span>
        <span className="mx-2">•</span>
        <span>{readTime} dibaca</span>
      </div>
      <h3 className="font-bold text-lg text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300 line-clamp-2">
        {title}
      </h3>
      <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
        {excerpt}
      </p>
      <button className="mt-4 text-blue-600 text-sm font-semibold hover:text-blue-800 transition-colors duration-300 flex items-center">
        Baca Selengkapnya
        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  </div>
);

// Komponen Partner Logo
const PartnerLogo = ({ name, logoUrl }: { name: string; logoUrl: string }) => (
  <div className="bg-white rounded-xl p-6 flex items-center justify-center border border-gray-200 hover:shadow-md transition-all duration-300 group" data-aos="fade-up">
    <img 
      src={logoUrl} 
      alt={name} 
      className="h-8 object-contain opacity-70 group-hover:opacity-100 transition-opacity duration-300 grayscale group-hover:grayscale-0"
    />
  </div>
);

// Komponen FAQ Item
const FAQItem = ({ question, answer, isOpen, onClick }: { 
  question: string; 
  answer: string; 
  isOpen: boolean; 
  onClick: () => void;
}) => (
  <div className="border border-gray-200 rounded-2xl hover:shadow-md transition-all duration-300" data-aos="fade-up">
    <button 
      className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-50 rounded-2xl transition-colors duration-300"
      onClick={onClick}
    >
      <span className="font-semibold text-gray-900 text-lg pr-4">{question}</span>
      <svg 
        className={`w-6 h-6 text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
    {isOpen && (
      <div className="px-6 pb-5">
        <p className="text-gray-600 leading-relaxed">{answer}</p>
      </div>
    )}
  </div>
);

// Ikon Bintang untuk Rating
const StarIcon = ({ className = "" }: { className?: string }) => (
    <svg className={`w-5 h-5 ${className}`} fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
    </svg>
);

export default function Home() {
    useEffect(() => {
        let aosLink: HTMLLinkElement | null = null;
        let aosScript: HTMLScriptElement | null = null;

        // Load AOS CSS
        const link = document.createElement('link');
        link.href = "https://unpkg.com/aos@2.3.4/dist/aos.css";
        link.rel = "stylesheet";
        document.head.appendChild(link);
        aosLink = link;

        // Load AOS JS
        const script = document.createElement('script');
        script.src = "https://unpkg.com/aos@2.3.4/dist/aos.js";
        script.onload = () => {
            if (typeof window !== 'undefined' && window.AOS) {
                window.AOS.init({
                    duration: 1000,
                    once: true,
                });
            }
        };
        document.body.appendChild(script);
        aosScript = script;

        // Cleanup
        return () => {
            if (aosLink && document.head.contains(aosLink)) {
                document.head.removeChild(aosLink);
            }
            if (aosScript && document.body.contains(aosScript)) {
                document.body.removeChild(aosScript);
            }
        };
    }, []);

    // State untuk FAQ
    const [openFAQ, setOpenFAQ] = useState<number | null>(0);

    // Data untuk Langkah Pemesanan
    const steps = [
        {
            number: 1,
            title: "Cari & Pilih",
            description: "Temukan tiket kereta KAI dengan harga terbaik sesuai kebutuhan perjalananmu",
            icon: "🔍"
        },
        {
            number: 2,
            title: "Pesan & Bayar",
            description: "Lakukan pemesanan dan pembayaran dengan metode yang aman dan terpercaya",
            icon: "💳"
        },
        {
            number: 3,
            title: "Konfirmasi",
            description: "Dapatkan konfirmasi instan dan e-ticket langsung ke email dan WhatsApp kamu",
            icon: "✅"
        },
        {
            number: 4,
            title: "Naik Kereta!",
            description: "Tunjukkan e-ticket dan nikmati perjalanan nyaman dengan kereta api KAI",
            icon: "🚂"
        }
    ];

    // Data untuk Testimonial
    const testimonials = [
        {
            name: "Sarah Wijaya",
            location: "Jakarta",
            rating: 5,
            comment: "Proses pemesanan tiket kereta KAI sangat mudah dan cepat. Harga yang ditawarkan juga kompetitif. Sudah beberapa kali naik kereta dari Jakarta ke Bandung, selalu lancar!",
            avatar: "/images/avatars/avatar1.jpg"
        },
        {
            name: "Budi Santoso",
            location: "Surabaya",
            rating: 5,
            comment: "Customer service TripGO sangat responsif. Waktu ada perubahan jadwal kereta, langsung dibantu dengan cepat dan ramah. Pengalaman yang memuaskan!",
            avatar: "/images/avatars/avatar2.jpg"
        },
        {
            name: "Maya Sari",
            location: "Bandung",
            rating: 4,
            comment: "Aplikasinya user friendly dan sering ada promo menarik untuk kereta api. Sudah beberapa kali pesan tiket KAI dan Whoosh, selalu lancar dan tepat waktu.",
            avatar: "/images/avatars/avatar3.jpg"
        },
        {
            name: "Rizki Pratama",
            location: "Yogyakarta",
            rating: 5,
            comment: "Harga garansi terbaiknya beneran work! Dapat refund selisih harga setelah booking tiket kereta. TripGO memang the best untuk travel Indonesia!",
            avatar: "/images/avatars/avatar4.jpg"
        }
    ];

    // Data untuk Blog & Tips
    const blogPosts = [
        {
            imageUrl: "/images/blog/train-schedule.jpg",
            title: "Panduan Lengkap Jadwal Kereta Api KAI 2025",
            excerpt: "Jadwal terbaru kereta api KAI untuk seluruh rute di Indonesia. Update informasi terbaru untuk perjalanan Anda.",
            date: "15 Nov 2024",
            readTime: "5 min",
            category: "Jadwal Kereta"
        },
        {
            imageUrl: "/images/blog/whoosh-guide.jpg",
            title: "Panduan Lengkap Naik Kereta Cepat Whoosh Jakarta-Bandung",
            excerpt: "Semua yang perlu kamu tahu tentang pengalaman naik kereta cepat Whoosh, dari booking sampai fasilitas di dalam kereta.",
            date: "10 Nov 2024",
            readTime: "7 min",
            category: "Transportasi"
        },
        {
            imageUrl: "/images/blog/train-packing.jpg",
            title: "Cara Packing Efisien untuk Perjalanan Kereta Api",
            excerpt: "Optimalkan koper kamu untuk perjalanan kereta api. Tips packing smart untuk perjalanan nyaman tanpa kelebihan bagasi.",
            date: "5 Nov 2024",
            readTime: "4 min",
            category: "Tips Travel"
        }
    ];

    // Data untuk Partner
    const partners = [
        { name: "Kereta Api Indonesia", logoUrl: "/images/partners/kai.png" },
        { name: "Whoosh", logoUrl: "/images/partners/whoosh.png" },
        { name: "Argo Parahyangan", logoUrl: "/images/partners/argo.png" },
        { name: "Taksaka", logoUrl: "/images/partners/taksaka.png" },
        { name: "Mutiara Selatan", logoUrl: "/images/partners/mutiara.png" },
        { name: "Lodaya", logoUrl: "/images/partners/lodaya.png" },
        { name: "Jayabaya", logoUrl: "/images/partners/jayabaya.png" },
        { name: "Gajayana", logoUrl: "/images/partners/gajayana.png" }
    ];

    // Data untuk FAQ
    const faqs = [
        {
            question: "Bagaimana cara memesan tiket kereta api di TripGO?",
            answer: "Pemesanan tiket kereta api di TripGO sangat mudah. Pilih stasiun asal dan tujuan, tentukan tanggal keberangkatan, pilih jadwal yang tersedia, lalu lakukan pembayaran. Anda akan menerima e-ticket via email dan WhatsApp."
        },
        {
            question: "Apakah harga di TripGO sudah termasuk semua biaya?",
            answer: "Ya, semua harga yang ditampilkan di TripGO untuk tiket kereta api sudah termasuk pajak dan biaya tambahan lainnya. Tidak ada biaya tersembunyi, yang Anda lihat adalah yang Anda bayar."
        },
        {
            question: "Bagaimana jika ingin mengubah atau membatalkan tiket kereta?",
            answer: "Anda dapat mengubah atau membatalkan tiket kereta melalui dashboard akun Anda. Syarat dan ketentuan mengikuti kebijakan KAI. Biaya pembatalan mungkin berlaku tergantung waktu pembatalan."
        },
        {
            question: "Apakah ada garansi harga terbaik untuk tiket kereta?",
            answer: "Ya, TripGO memberikan garansi harga terbaik untuk tiket kereta api. Jika Anda menemukan harga yang lebih murah untuk rute dan tanggal yang sama, kami akan refund selisihnya sesuai dengan syarat dan ketentuan yang berlaku."
        },
        {
            question: "Kereta api mana saja yang bisa dipesan di TripGO?",
            answer: "TripGO menyediakan tiket untuk semua jenis kereta api KAI, termasuk kereta cepat Whoosh, Argo Parahyangan, Taksaka, dan berbagai kereta ekonomi lainnya yang melayani seluruh Indonesia."
        }
    ];

  // Data untuk Promo - Gunakan placeholder jika gambar tidak ada
    const promos = [
        {
            imageUrl: "https://images.unsplash.com/photo-1590077428593-a55bb07c4665?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80", 
            title: "Flash Sale Jakarta-Bandung - Diskon Hingga 50%",
            description: "Raih tiket kereta Jakarta-Bandung dengan harga spesial. Terbatas hanya untuk 100 pembeli pertama!",
            discount: "50% OFF",
            validUntil: "30 Des 2024",
            tag: "Flash Sale"
        },
        {
            imageUrl: "https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
            title: "Cashback Kereta Api KAI 100%",
            description: "Dapatkan cashback hingga Rp 100.000 untuk perjalanan kereta api KAI di seluruh Indonesia",
            discount: "100% CB",
            validUntil: "25 Des 2024",
            tag: "Cashback"
        },
        {
            imageUrl: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
            title: "Whoosh Exclusive - Harga Spesial",
            description: "Nikmati perjalanan super cepat Jakarta-Bandung dengan harga promo khusus member",
            discount: "30% OFF",
            validUntil: "31 Des 2024",
            tag: "Exclusive"
        },
        {
            imageUrl: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
            title: "Paket Keluarga KAI - Hemat hingga 40%",
            description: "Diskon spesial untuk perjalanan keluarga dengan kereta api KAI. Minimum 3 orang",
            discount: "40% OFF",
            validUntil: "15 Jan 2025",
            tag: "Family"
        }
    ];

  // Data untuk Destinasi Populer - Gunakan placeholder
    const destinations = [
        {
            imageUrl: "https://images.unsplash.com/photo-1535478044878-5c6d3e7d7e7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
            name: "Bandung",
            price: "Rp 150rb",
            rating: 4.8,
            reviews: "12.5rb",
            delay: 0
        },
        {
            imageUrl: "https://images.unsplash.com/photo-1575408264798-b50b252663e6?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
            name: "Yogyakarta",
            price: "Rp 250rb",
            rating: 4.7,
            reviews: "8.2rb",
            delay: 100
        },
        {
            imageUrl: "https://images.unsplash.com/photo-1534237710431-e2fc698436d0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
            name: "Surabaya",
            price: "Rp 300rb",
            rating: 4.9,
            reviews: "15.1rb",
            delay: 200
        },
        {
            imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
            name: "Semarang",
            price: "Rp 200rb",
            rating: 4.6,
            reviews: "6.8rb",
            delay: 300
        },
        {
            imageUrl: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
            name: "Malang",
            price: "Rp 350rb",
            rating: 4.8,
            reviews: "9.3rb",
            delay: 400
        },
        {
            imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
            name: "Solo",
            price: "Rp 180rb",
            rating: 4.7,
            reviews: "7.2rb",
            delay: 500
        }
    ];

   const features = [
        {
            title: "Harga Terjamin Terbaik",
            description: "Garansi harga terbaik dengan fitur price alert dan notifikasi penurunan harga",
            iconPath: getIconPath('price'),
            delay: 0
        },
        {
            title: "Seluruh Jaringan KAI",
            description: "Akses ke seluruh jaringan kereta api KAI di Indonesia dalam satu platform",
            iconPath: getIconPath('complete'),
            delay: 100
        },
        {
            title: "Pembayaran Aman",
            description: "Transaksi dienkripsi dengan sistem keamanan berlapis dan garansi uang kembali",
            iconPath: getIconPath('support'),
            delay: 200
        },
        {
            title: "Dukungan 24/7",
            description: "Customer service siap membantu kapan saja melalui chat, telepon, dan email",
            iconPath: getIconPath('support'),
            delay: 300
        }
    ];

    return (
        <div className="font-sans bg-gray-50">
            {/* Hero Section */}
            <section 
                className="relative flex items-center justify-center h-[70vh] min-h-[600px] bg-cover bg-center text-white" 
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?ixlib=rb-4.0.3&auto=format&fit=crop&w=1770&q=80')" }} 
            >
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/40"></div>
                <div className="relative z-10 container mx-auto px-4 flex flex-col items-center text-center">
                      <h1 className="text-4xl md:text-6xl font-extrabold mb-4 drop-shadow-lg" data-aos="zoom-in">Hi Apakabar! Mau ke mana?</h1>
                    <p className="text-lg md:text-xl mb-8 drop-shadow-md max-w-2xl" data-aos="zoom-in" data-aos-delay="300">
                        Pesan tiket kereta api KAI dengan harga terbaik. Perjalananmu, prioritas kami.
                    </p>
                    <div data-aos="fade-up" data-aos-delay="500" className="w-full max-w-5xl">
                        <SearchWidget />
                    </div>
                </div>
            </section>

            {/* Keunggulan Aplikasi (Why Choose Us) */}
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-3" data-aos="fade-down">
                            Kenapa Memilih TripGO?
                        </h2>
                        <p className="text-gray-600 text-lg max-w-2xl mx-auto" data-aos="fade-down" data-aos-delay="200">
                            Platform travel terpercaya dengan jutaan pelanggan puas di seluruh Indonesia
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                        {features.map((feature, index) => (
                            <FeatureCard key={index} {...feature} />
                        ))}
                    </div>
                    
                    {/* Stats Section */}
                    <div className="mt-16 bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                            <div data-aos="fade-up">
                                <div className="text-3xl font-bold mb-2">5Jt+</div>
                                <div className="text-blue-100">Pengguna Aktif</div>
                            </div>
                            <div data-aos="fade-up" data-aos-delay="100">
                                <div className="text-3xl font-bold mb-2">50+</div>
                                <div className="text-blue-100">Stasiun Kereta</div>
                            </div>
                            <div data-aos="fade-up" data-aos-delay="200">
                                <div className="text-3xl font-bold mb-2">100+</div>
                                <div className="text-blue-100">Rute Harian</div>
                            </div>
                            <div data-aos="fade-up" data-aos-delay="300">
                                <div className="text-3xl font-bold mb-2">24/7</div>
                                <div className="text-blue-100">Layanan Support</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            
            {/* Destinasi Populer */}
            <section className="py-16 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-2" data-aos="fade-down">
                                Destinasi Populer
                            </h2>
                            <p className="text-gray-600" data-aos="fade-down" data-aos-delay="200">
                                Temukan inspirasi perjalanan ke tempat-tempat favorit
                            </p>
                        </div>
                        <button className="hidden md:flex items-center text-blue-600 font-semibold hover:text-blue-800 transition-colors duration-300" data-aos="fade-left">
                            Lihat Semua
                            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                        {destinations.map((destination, index) => (
                            <DestinationCard key={index} {...destination} />
                        ))}
                    </div>
                    
                    <div className="text-center mt-8 md:hidden">
                        <button className="bg-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-700 transition-colors duration-300">
                            Lihat Semua Destinasi
                        </button>
                    </div>
                </div>
            </section>

            {/* Promo Section */}
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-2" data-aos="fade-down">
                                Penawaran Spesial
                            </h2>
                            <p className="text-gray-600" data-aos="fade-down" data-aos-delay="200">
                                Jangan lewatkan promo dan diskon menarik untuk perjalananmu
                            </p>
                        </div>
                        <button className="hidden md:flex items-center text-blue-600 font-semibold hover:text-blue-800 transition-colors duration-300" data-aos="fade-left">
                            Lihat Semua Promo
                            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {promos.map((promo, index) => (
                            <PromoCard key={index} {...promo} />
                        ))}
                    </div>
                    
                    {/* Banner Promo Besar */}
                    <div className="mt-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-8 text-white relative overflow-hidden" data-aos="zoom-in">
                        <div className="relative z-10 max-w-2xl">
                            <h3 className="text-2xl font-bold mb-3">Super Sale Akhir Tahun! 🚂</h3>
                            <p className="text-orange-100 mb-4 text-lg">
                                Dapatkan diskon hingga 70% untuk semua rute kereta api KAI domestik
                            </p>
                            <div className="flex items-center space-x-4">
                                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                                    <div className="text-sm">Berlaku hingga</div>
                                    <div className="font-bold">31 Desember 2025</div>
                                </div>
                                <button className="bg-white text-orange-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors duration-300">
                                    Lihat Promo
                                </button>
                            </div>
                        </div>
                        {/* Background Pattern */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
                        <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 translate-x-24"></div>
                    </div>
                </div>
            </section>

            {/* Langkah Pemesanan */}
            <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-3" data-aos="fade-down">
                            Mudah & Cepat dalam 4 Langkah
                        </h2>
                        <p className="text-gray-600 text-lg max-w-2xl mx-auto" data-aos="fade-down" data-aos-delay="200">
                            Proses pemesanan tiket yang simpel dan tanpa ribet
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
                        {steps.map((step, index) => (
                            <StepCard key={index} {...step} />
                        ))}
                    </div>
                    
                    <div className="text-center mt-12" data-aos="fade-up">
                        <button className="bg-blue-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-blue-700 transition-colors duration-300 shadow-lg">
                            Mulai Pesan Tiket Sekarang
                        </button>
                    </div>
                </div>
            </section>

            {/* Testimonial & Review */}
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-3" data-aos="fade-down">
                            Kata Mereka yang Sudah Percaya
                        </h2>
                        <p className="text-gray-600 text-lg max-w-2xl mx-auto" data-aos="fade-down" data-aos-delay="200">
                            Ribuan traveler telah merasakan kemudahan booking dengan TripGO
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                        {testimonials.map((testimonial, index) => (
                            <TestimonialCard key={index} {...testimonial} />
                        ))}
                    </div>
                    
                    {/* Rating Summary */}
                    <div className="mt-12 bg-gray-50 rounded-2xl p-8 max-w-2xl mx-auto" data-aos="fade-up">
                        <div className="flex flex-col md:flex-row items-center justify-between text-center md:text-left">
                            <div className="mb-6 md:mb-0">
                                <div className="text-4xl font-bold text-gray-900 mb-2">4.9/5</div>
                                <div className="flex items-center justify-center md:justify-start">
                                    {[...Array(5)].map((_, i) => (
                                        <StarIcon key={i} className="w-6 h-6 text-yellow-400" />
                                    ))}
                                </div>
                                <div className="text-gray-600 mt-2">Berdasarkan 12.458 review</div>
                            </div>
                            <div className="text-center md:text-right">
                                <div className="text-2xl font-bold text-gray-900 mb-2">98%</div>
                                <div className="text-gray-600">Traveler Merekomendasikan</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Blog & Tips Perjalanan */}
            <section className="py-16 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-2" data-aos="fade-down">
                                Tips & Panduan Perjalanan
                            </h2>
                            <p className="text-gray-600" data-aos="fade-down" data-aos-delay="200">
                                Artikel terbaru untuk membuat perjalananmu lebih menyenangkan
                            </p>
                        </div>
                        <button className="hidden md:flex items-center text-blue-600 font-semibold hover:text-blue-800 transition-colors duration-300" data-aos="fade-left">
                            Lihat Semua Artikel
                            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {blogPosts.map((post, index) => (
                            <BlogCard key={index} {...post} />
                        ))}
                    </div>
                    
                    <div className="text-center mt-8 md:hidden">
                        <button className="bg-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-700 transition-colors duration-300">
                            Lihat Semua Artikel
                        </button>
                    </div>
                </div>
            </section>

            {/* Partner & Maskapai */}
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-3" data-aos="fade-down">
                            Partner Terpercaya Kami
                        </h2>
                        <p className="text-gray-600 text-lg max-w-2xl mx-auto" data-aos="fade-down" data-aos-delay="200">
                            Bekerjasama dengan maskapai dan penyedia transportasi terbaik
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                        {partners.map((partner, index) => (
                            <PartnerLogo key={index} {...partner} />
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ (Pertanyaan Umum) */}
            <section className="py-16 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-3" data-aos="fade-down">
                            Pertanyaan yang Sering Ditanyakan
                        </h2>
                        <p className="text-gray-600 text-lg max-w-2xl mx-auto" data-aos="fade-down" data-aos-delay="200">
                            Temukan jawaban untuk pertanyaan umum seputar TripGO
                        </p>
                    </div>
                    
                    <div className="max-w-3xl mx-auto space-y-4">
                        {faqs.map((faq, index) => (
                            <FAQItem 
                                key={index}
                                question={faq.question}
                                answer={faq.answer}
                                isOpen={openFAQ === index}
                                onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                            />
                        ))}
                    </div>
                    
                    <div className="text-center mt-12" data-aos="fade-up">
                        <div className="bg-white rounded-2xl p-8 max-w-2xl mx-auto shadow-sm">
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Masih ada pertanyaan?</h3>
                            <p className="text-gray-600 mb-6">Tim customer service kami siap membantu Anda 24/7</p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button className="bg-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-700 transition-colors duration-300">
                                    💬 Chat Sekarang
                                </button>
                                <button className="border border-blue-600 text-blue-600 px-6 py-3 rounded-full font-semibold hover:bg-blue-50 transition-colors duration-300">
                                    📞 Hubungi Kami
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>  
    );
}