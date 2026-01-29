// app/components/TrainSeatMap.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';

// Tipe data (sama seperti sebelumnya)
interface SeatOccupancy {
  seatId: string;
  occupiedSegments: string[];
  passengerIds?: string[];
}

interface SeatReuseConfig {
  enableReuse: boolean;
  reuseSegments?: string[];
  occupancyData?: SeatOccupancy[];
}

interface Seat {
  id: string;
  number: string;
  row: number;
  column: string;
  available: boolean;
  windowSeat: boolean;
  forwardFacing: boolean;
  price: number;
  wagonNumber?: string;
  wagonClass?: string;
  kode_kursi?: string;
  class?: string;
  segmentId?: string;
  occupancy?: SeatOccupancy;
}

interface Wagon {
  id: string;
  number: string;
  name: string;
  class: 'executive' | 'business' | 'economy' | string;
  facilities: string[];
  availableSeats: number;
  totalSeats: number;
  seats: Seat[];
  layout?: {
    rows: number;
    columns: number;
    aisleAfterColumn?: number;
    windowSeats?: string[];
  };
}

interface Train {
  id?: string;
  trainId: number;
  trainName: string;
  trainType: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  origin: string;
  destination: string;
  price: number;
  availableSeats: number;
  departureDate: string;
  scheduleId?: string;
  wagons: Wagon[];
  operator?: string;
  trainNumber?: string;
  originStation?: string;
  destinationStation?: string;
  kode_kereta?: string;
  nama_kereta?: string;
}

interface TrainSeatMapProps {
  train: Train;
  selectedSeats: Seat[];
  onSeatSelect: (seat: Seat) => void;
  onSeatDeselect: (seatId: string) => void;
  maxSeats: number;
  currentSegmentId?: string;
  seatReuseConfig?: SeatReuseConfig;
  showReuseInfo?: boolean;
  autoSelectEmptySeats?: boolean;
}

// Helper functions untuk generate fallback data (DIUBAH: fungsi biasa, bukan menggunakan useCallback)
const generateFallbackSeatData = (train: Train): Wagon[] => {
  if (!train) return [];

  const basePrice = train.price || 265000;
  const trainType = train.trainType || 'Executive';
  
  // Konfigurasi berdasarkan kelas kereta
  const configs = {
    'Executive': {
      wagonCount: 4,
      seatsPerWagon: 40,
      columns: ['A', 'B', 'C', 'D'],
      facilities: ['AC', 'Toilet', 'Power Outlet', 'WiFi', 'Food Service'],
      priceMultiplier: 1.5,
      layout: { rows: 20, columns: 4, aisleAfterColumn: 2, windowSeats: ['A', 'D'] }
    },
    'Business': {
      wagonCount: 5,
      seatsPerWagon: 50,
      columns: ['A', 'B', 'C', 'D', 'E'],
      facilities: ['AC', 'Toilet', 'Power Outlet', 'WiFi'],
      priceMultiplier: 1.2,
      layout: { rows: 20, columns: 5, aisleAfterColumn: 3, windowSeats: ['A', 'E'] }
    },
    'Economy': {
      wagonCount: 6,
      seatsPerWagon: 60,
      columns: ['A', 'B', 'C', 'D', 'E', 'F'],
      facilities: ['AC', 'Toilet'],
      priceMultiplier: 1.0,
      layout: { rows: 20, columns: 6, aisleAfterColumn: 3, windowSeats: ['A', 'F'] }
    },
    'Premium': {
      wagonCount: 3,
      seatsPerWagon: 30,
      columns: ['A', 'B', 'C', 'D', 'E'],
      facilities: ['AC', 'Toilet', 'Power Outlet', 'WiFi', 'Food Service', 'Entertainment'],
      priceMultiplier: 2.0,
      layout: { rows: 15, columns: 5, aisleAfterColumn: 3, windowSeats: ['A', 'E'] }
    }
  };

  const config = configs[trainType as keyof typeof configs] || configs.Executive;
  const wagons: Wagon[] = [];

  for (let wagonNum = 1; wagonNum <= config.wagonCount; wagonNum++) {
    const seats: Seat[] = [];
    const rows = Math.ceil(config.seatsPerWagon / config.columns.length);
    
    let availableCount = 0;
    
    for (let row = 1; row <= rows; row++) {
      config.columns.forEach((column, colIndex) => {
        const seatNumber = `${column}${row}`;
        const id = `${train.trainId}-wagon-${wagonNum}-${seatNumber}`;
        
        // Random availability (80% tersedia)
        const available = Math.random() > 0.2;
        const windowSeat = column === 'A' || column === config.columns[config.columns.length - 1];
        const forwardFacing = row % 2 === 1;
        
        // Hitung harga kursi
        let price = Math.round(basePrice * config.priceMultiplier);
        
        // Premium untuk kursi jendela
        if (windowSeat) price = Math.round(price * 1.15);
        // Premium untuk baris depan (1-3)
        if (row <= 3) price = Math.round(price * 1.1);
        // Premium untuk menghadap depan
        if (forwardFacing) price = Math.round(price * 1.05);
        // Random discount (20% chance)
        if (Math.random() > 0.8) price = Math.round(price * 0.95);

        seats.push({
          id,
          number: seatNumber,
          row,
          column,
          available,
          windowSeat,
          forwardFacing,
          price,
          wagonNumber: wagonNum.toString().padStart(2, '0'),
          wagonClass: configs.Executive.wagonCount === config.wagonCount ? 'executive' : 
                     configs.Business.wagonCount === config.wagonCount ? 'business' : 
                     'economy',
          kode_kursi: `${trainType.substring(0, 3).toUpperCase()}${wagonNum.toString().padStart(2, '0')}${seatNumber}`
        });

        if (available) availableCount++;
      });
    }

    wagons.push({
      id: `${train.trainId}-wagon-${wagonNum}`,
      number: wagonNum.toString().padStart(2, '0'),
      name: `Gerbong ${wagonNum.toString().padStart(2, '0')}`,
      class: configs.Executive.wagonCount === config.wagonCount ? 'executive' : 
             configs.Business.wagonCount === config.wagonCount ? 'business' : 
             'economy',
      facilities: config.facilities,
      availableSeats: availableCount,
      totalSeats: seats.length,
      seats,
      layout: config.layout
    });
  }

  return wagons;
};

// Helper function untuk fasilitas default berdasarkan kelas
const getDefaultFacilities = (wagonClass: string): string[] => {
  const facilities: string[] = ['AC'];
  
  switch (wagonClass) {
    case 'executive':
      facilities.push('Toilet', 'Power Outlet', 'WiFi', 'Food Service', 'Luggage Rack', 'Extra Legroom');
      break;
    case 'business':
      facilities.push('Toilet', 'Power Outlet', 'WiFi', 'Food Service', 'Luggage Rack');
      break;
    case 'premium':
      facilities.push('Toilet', 'Power Outlet', 'WiFi', 'Food Service', 'Luggage Rack', 'Entertainment', 'Priority Boarding');
      break;
    case 'economy':
      facilities.push('Toilet', 'Luggage Rack');
      break;
  }
  
  return facilities;
};

// Helper function untuk menghitung harga kursi
const calculateSeatPrice = (wagonClass: string, basePrice: number, seat: any) => {
  let price = basePrice;
  
  // Multiplier berdasarkan kelas
  if (wagonClass === 'executive') price *= 1.5;
  else if (wagonClass === 'business') price *= 1.2;
  else if (wagonClass === 'premium') price *= 2.0;
  
  // Tambahan untuk kursi jendela
  if (seat.window_seat) price *= 1.1;
  
  // Tambahan untuk kursi menghadap depan
  if (seat.forward_facing) price *= 1.05;
  
  // Random premium untuk kursi tertentu
  if (Math.random() > 0.7) price *= 1.05;
  
  return Math.round(price);
};

// Komponen untuk tombol kursi
interface SeatButtonProps {
  seat: Seat;
  wagon: Wagon;
  isSelected: boolean;
  onSelect: (seat: Seat) => void;
  onDeselect: (seatId: string) => void;
  hoveredSeat: string | null;
  setHoveredSeat: (seatId: string | null) => void;
  selectedSeatsCount: number;
  maxSeats: number;
  currentSegmentId?: string;
  seatReuseConfig?: SeatReuseConfig;
}

const SeatButton: React.FC<SeatButtonProps> = ({
  seat,
  wagon,
  isSelected,
  onSelect,
  onDeselect,
  hoveredSeat,
  setHoveredSeat,
  selectedSeatsCount,
  maxSeats,
  currentSegmentId,
  seatReuseConfig
}) => {
  // Fungsi untuk menentukan status seat berdasarkan reuse
  const getSeatStatus = useCallback(() => {
    // Jika ada konfigurasi reuse
    if (seatReuseConfig?.enableReuse && seat.occupancy) {
      const { occupiedSegments = [], passengerIds = [] } = seat.occupancy;
      
      // Cek jika seat ini sedang digunakan di segment lain
      const isOccupiedInOtherSegment = occupiedSegments.some(segmentId => 
        segmentId !== currentSegmentId
      );
      
      // Jika seat digunakan di segment lain
      if (isOccupiedInOtherSegment) {
        return {
          status: 'occupied-other-segment' as const,
          tooltip: `Kursi digunakan di ${occupiedSegments.length - 1} segment lain`,
          passengers: passengerIds.length
        };
      }
      
      // Jika seat digunakan di segment saat ini
      if (occupiedSegments.includes(currentSegmentId || '')) {
        return {
          status: 'occupied-current-segment' as const,
          tooltip: `Kursi digunakan di segment ini`,
          passengers: passengerIds.length
        };
      }
    }

    // Status standar
    if (isSelected) {
      return { status: 'selected' as const, tooltip: 'Terpilih', passengers: 1 };
    }
    
    if (!seat.available) {
      return { status: 'unavailable' as const, tooltip: 'Tidak tersedia', passengers: 0 };
    }
    
    return { status: 'available' as const, tooltip: 'Tersedia', passengers: 0 };
  }, [seat, seatReuseConfig, currentSegmentId, isSelected]);

  const seatStatus = getSeatStatus();
  
  const statusColors = {
    'available': 'bg-white border-gray-300 hover:border-green-400 hover:bg-green-50',
    'selected': 'bg-[#FD7E14] border-[#FD7E14] text-white',
    'unavailable': 'bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed',
    'occupied-other-segment': 'bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200',
    'occupied-current-segment': 'bg-purple-100 border-purple-300 text-purple-800 hover:bg-purple-200'
  };

  const statusIcons = {
    'available': '○',
    'selected': '✓',
    'unavailable': '✗',
    'occupied-other-segment': '🔄',
    'occupied-current-segment': '👤'
  };

  // Tentukan warna berdasarkan kelas wagon
  const getSeatColor = useCallback((status: string) => {
    const baseColors = statusColors[status as keyof typeof statusColors];
    
    // Tambahkan warna kelas untuk kursi yang available
    if (status === 'available' || status === 'selected') {
      if (wagon.class === 'executive') {
        return status === 'available' 
          ? 'bg-blue-50 border-blue-200 hover:border-blue-400 hover:bg-blue-100 text-blue-700'
          : 'bg-[#FD7E14] border-[#FD7E14] text-white';
      } else if (wagon.class === 'business') {
        return status === 'available'
          ? 'bg-green-50 border-green-200 hover:border-green-400 hover:bg-green-100 text-green-700'
          : 'bg-[#FD7E14] border-[#FD7E14] text-white';
      } else if (wagon.class === 'economy') {
        return status === 'available'
          ? 'bg-gray-50 border-gray-200 hover:border-gray-400 hover:bg-gray-100 text-gray-700'
          : 'bg-[#FD7E14] border-[#FD7E14] text-white';
      }
    }
    
    return baseColors;
  }, [wagon.class]);

  const handleClick = useCallback(() => {
    if (seatStatus.status === 'unavailable' || seatStatus.status === 'occupied-current-segment') {
      return;
    }
    
    if (seatStatus.status === 'selected') {
      onDeselect(seat.id);
    } else {
      if (selectedSeatsCount >= maxSeats) {
        alert(`Maksimal ${maxSeats} kursi yang dapat dipilih`);
        return;
      }
      onSelect({ 
        ...seat, 
        wagonNumber: wagon.number,
        wagonClass: wagon.class
      });
    }
  }, [seatStatus.status, onDeselect, seat.id, selectedSeatsCount, maxSeats, onSelect, seat, wagon]);

  return (
    <div className="relative group">
      <button
        className={`w-12 h-12 border-2 rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-all ${
          getSeatColor(seatStatus.status)
        } ${hoveredSeat === seat.id ? 'ring-2 ring-yellow-400' : ''} ${
          seatStatus.status === 'available' || seatStatus.status === 'selected' || seatStatus.status === 'occupied-other-segment'
            ? 'cursor-pointer hover:scale-105'
            : 'cursor-not-allowed'
        }`}
        onClick={handleClick}
        onMouseEnter={() => setHoveredSeat(seat.id)}
        onMouseLeave={() => setHoveredSeat(null)}
        disabled={seatStatus.status === 'unavailable' || seatStatus.status === 'occupied-current-segment'}
        title={`${seat.number} - ${seatStatus.tooltip} - Rp ${seat.price.toLocaleString('id-ID')} ${
          seat.windowSeat ? '(Jendela)' : '(Lorong)'
        } ${seat.forwardFacing ? '↗ Menghadap depan' : ''}`}
      >
        <div className="font-bold">{seat.number}</div>
        <div className="text-lg">{statusIcons[seatStatus.status]}</div>
        {seat.forwardFacing && <div className="text-xs">↗</div>}
        {seat.windowSeat && <div className="text-xs">🪟</div>}
        
        {/* Badge untuk kursi yang digunakan di segment lain */}
        {seatStatus.status === 'occupied-other-segment' && seatStatus.passengers > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
            {seatStatus.passengers}
          </div>
        )}
      </button>
      
      {/* Tooltip info reuse */}
      {(seatStatus.status === 'occupied-other-segment' || seatStatus.status === 'occupied-current-segment') && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
          <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
            {seatStatus.tooltip}
            {seat.occupancy?.passengerIds && seat.occupancy.passengerIds.length > 0 && (
              <div className="mt-1 text-gray-300">
                {seat.occupancy.passengerIds.length} penumpang
              </div>
            )}
          </div>
          <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900 mx-auto"></div>
        </div>
      )}
    </div>
  );
};

// Komponen wagon individual
const WagonSeatMap = React.memo(({ 
  wagon, 
  selectedSeats, 
  onSeatSelect, 
  onSeatDeselect,
  hoveredSeat,
  setHoveredSeat,
  selectedSeatsCount,
  maxSeats,
  currentSegmentId,
  seatReuseConfig 
}: { 
  wagon: Wagon;
  selectedSeats: Seat[];
  onSeatSelect: (seat: Seat) => void;
  onSeatDeselect: (seatId: string) => void;
  hoveredSeat: string | null;
  setHoveredSeat: (seatId: string | null) => void;
  selectedSeatsCount: number;
  maxSeats: number;
  currentSegmentId?: string;
  seatReuseConfig?: SeatReuseConfig;
}) => {
  if (!wagon || !wagon.seats || wagon.seats.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 text-center">
        <p className="text-gray-500">Tidak ada kursi tersedia di gerbong ini</p>
      </div>
    );
  }

  // Buat layout grid berdasarkan konfigurasi wagon
  const createSeatLayout = useCallback(() => {
    // Default layout berdasarkan kelas wagon
    const defaultLayouts = {
      'executive': { rows: 20, columns: 4, aisleAfterColumn: 2, windowSeats: ['A', 'D'] },
      'business': { rows: 20, columns: 5, aisleAfterColumn: 3, windowSeats: ['A', 'E'] },
      'economy': { rows: 20, columns: 6, aisleAfterColumn: 3, windowSeats: ['A', 'F'] }
    };

    const layout = wagon.layout || defaultLayouts[wagon.class as keyof typeof defaultLayouts] || defaultLayouts.economy;
    
    // Buat grid kosong
    const grid: Array<Array<Seat | null>> = Array(layout.rows)
      .fill(null)
      .map(() => Array(layout.columns).fill(null));

    // Map seats ke grid
    wagon.seats.forEach(seat => {
      const columnIndex = seat.column.charCodeAt(0) - 'A'.charCodeAt(0);
      const rowIndex = seat.row - 1; // Row biasanya dimulai dari 1
      
      if (rowIndex >= 0 && rowIndex < layout.rows && columnIndex >= 0 && columnIndex < layout.columns) {
        grid[rowIndex][columnIndex] = seat;
      }
    });

    return { grid, layout };
  }, [wagon]);

  const { grid, layout } = createSeatLayout();
  const aisleColumn = layout.aisleAfterColumn || Math.floor(layout.columns / 2);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
      {/* Wagon Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <span className="text-xl font-bold text-blue-600">{wagon.number}</span>
          </div>
          <div className="ml-4">
            <h3 className="font-bold text-lg text-gray-800">{wagon.name}</h3>
            <div className="flex items-center mt-1">
              <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                wagon.class === 'executive' ? 'bg-blue-100 text-blue-800' :
                wagon.class === 'business' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {wagon.class}
              </span>
              <span className="mx-2 text-gray-400">•</span>
              <span className="text-sm text-gray-600">
                {wagon.availableSeats} kursi tersedia
              </span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm text-gray-600">Layout</div>
          <div className="text-lg font-bold text-gray-800 capitalize">
            {aisleColumn}-{layout.columns - aisleColumn} ({layout.rows} baris)
          </div>
        </div>
      </div>

      {/* Facilities */}
      {wagon.facilities && wagon.facilities.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-700 mb-2">Fasilitas:</h4>
          <div className="flex flex-wrap gap-2">
            {wagon.facilities.map((facility: string, index: number) => (
              <span
                key={`facility-${wagon.number}-${index}`}
                className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full"
              >
                {facility === 'AC' && '❄️ '}
                {facility === 'Toilet' && '🚽 '}
                {facility === 'Power Outlet' && '🔌 '}
                {facility === 'WiFi' && '📶 '}
                {facility === 'Food Service' && '🍱 '}
                {facility}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Seat Map */}
      <div className="border-t pt-6">
        <h4 className="font-medium text-gray-700 mb-4">Pilih Kursi:</h4>
        
        <div className="relative mb-8">
          <div className="wagon-body border-2 border-gray-300 rounded-lg p-4">
            {/* Walkway */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gray-200"></div>
            
            {/* Seats Grid */}
            <div className="grid grid-cols-2 gap-4 relative">
              {/* Left side seats */}
              <div className="space-y-2">
                {grid.map((row, rowIndex) => {
                  const leftSeats = row.slice(0, aisleColumn);
                  
                  return (
                    <div key={`left-row-${rowIndex}`} className="flex space-x-2">
                      {leftSeats.map((seat, colIndex) => (
                        <div key={`left-${rowIndex}-${colIndex}`} className="w-12">
                          {seat ? (
                            <SeatButton
                              seat={seat}
                              wagon={wagon}
                              isSelected={selectedSeats.some(s => s.id === seat.id)}
                              onSelect={onSeatSelect}
                              onDeselect={onSeatDeselect}
                              hoveredSeat={hoveredSeat}
                              setHoveredSeat={setHoveredSeat}
                              selectedSeatsCount={selectedSeatsCount}
                              maxSeats={maxSeats}
                              currentSegmentId={currentSegmentId}
                              seatReuseConfig={seatReuseConfig}
                            />
                          ) : (
                            <div className="w-12 h-12"></div> // Empty space
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
              
              {/* Right side seats */}
              <div className="space-y-2">
                {grid.map((row, rowIndex) => {
                  const rightSeats = row.slice(aisleColumn);
                  
                  return (
                    <div key={`right-row-${rowIndex}`} className="flex space-x-2 justify-end">
                      {rightSeats.map((seat, colIndex) => (
                        <div key={`right-${rowIndex}-${colIndex}`} className="w-12">
                          {seat ? (
                            <SeatButton
                              seat={seat}
                              wagon={wagon}
                              isSelected={selectedSeats.some(s => s.id === seat.id)}
                              onSelect={onSeatSelect}
                              onDeselect={onSeatDeselect}
                              hoveredSeat={hoveredSeat}
                              setHoveredSeat={setHoveredSeat}
                              selectedSeatsCount={selectedSeatsCount}
                              maxSeats={maxSeats}
                              currentSegmentId={currentSegmentId}
                              seatReuseConfig={seatReuseConfig}
                            />
                          ) : (
                            <div className="w-12 h-12"></div> // Empty space
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Row Numbers */}
            <div className="flex justify-between mt-4 px-4">
              {Array.from({ length: grid.length }).map((_, index) => (
                <div key={`row-number-${index}`} className="text-xs text-gray-500 w-8 text-center">
                  {index + 1}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Seat Legend */}
        <div className="mt-6 pt-6 border-t">
          <h4 className="font-medium text-gray-700 mb-3">Keterangan:</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-white border-2 border-gray-300 rounded flex items-center justify-center mr-2">
                <span className="text-xs">○</span>
              </div>
              <span className="text-sm text-gray-600">Tersedia</span>
            </div>
            
            <div className="flex items-center">
              <div className="w-6 h-6 bg-[#FD7E14] border-2 border-[#FD7E14] rounded flex items-center justify-center mr-2">
                <span className="text-xs text-white">✓</span>
              </div>
              <span className="text-sm text-gray-600">Terpilih</span>
            </div>
            
            <div className="flex items-center">
              <div className="w-6 h-6 bg-gray-200 border-2 border-gray-300 rounded flex items-center justify-center mr-2">
                <span className="text-xs text-gray-400">✗</span>
              </div>
              <span className="text-sm text-gray-600">Tidak tersedia</span>
            </div>
            
            {seatReuseConfig?.enableReuse && (
              <>
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-blue-100 border-2 border-blue-300 rounded flex items-center justify-center mr-2">
                    <span className="text-xs">🔄</span>
                  </div>
                  <span className="text-sm text-gray-600">Digunakan di segment lain</span>
                </div>
                
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-purple-100 border-2 border-purple-300 rounded flex items-center justify-center mr-2">
                    <span className="text-xs">👤</span>
                  </div>
                  <span className="text-sm text-gray-600">Digunakan di segment ini</span>
                </div>
              </>
            )}
          </div>
          
          {/* Class Legend */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-blue-50 border-2 border-blue-200 rounded flex items-center justify-center mr-2">
                <span className="text-xs">○</span>
              </div>
              <span className="text-sm text-gray-600">Kelas Executive</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-green-50 border-2 border-green-200 rounded flex items-center justify-center mr-2">
                <span className="text-xs">○</span>
              </div>
              <span className="text-sm text-gray-600">Kelas Business</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-gray-50 border-2 border-gray-200 rounded flex items-center justify-center mr-2">
                <span className="text-xs">○</span>
              </div>
              <span className="text-sm text-gray-600">Kelas Economy</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

WagonSeatMap.displayName = 'WagonSeatMap';

// Komponen utama TrainSeatMap
export const TrainSeatMap: React.FC<TrainSeatMapProps> = ({
  train: originalTrain,
  selectedSeats,
  onSeatSelect,
  onSeatDeselect,
  maxSeats = 4,
  currentSegmentId,
  seatReuseConfig = { enableReuse: false },
  showReuseInfo = true,
  autoSelectEmptySeats = false
}) => {
  const [hoveredSeat, setHoveredSeat] = useState<string | null>(null);
  const [selectedWagon, setSelectedWagon] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [availableSeatsCount, setAvailableSeatsCount] = useState(0);
  const [reuseSeatsCount, setReuseSeatsCount] = useState(0);

  // Fungsi untuk memperbaiki data train dengan fallback
  const train = useMemo(() => {
    if (!originalTrain) return null;

    // Jika train tidak memiliki wagons, generate fallback data
    if (!originalTrain.wagons || originalTrain.wagons.length === 0) {
      const fallbackWagons = generateFallbackSeatData(originalTrain);
      
      return {
        ...originalTrain,
        wagons: fallbackWagons,
        availableSeats: fallbackWagons.reduce((sum, wagon) => sum + wagon.availableSeats, 0)
      };
    }

    return originalTrain;
  }, [originalTrain]);

  // Inisialisasi selectedWagon
  useEffect(() => {
    if (train?.wagons?.length > 0 && !selectedWagon) {
      setSelectedWagon(train.wagons[0].number);
    }
  }, [train, selectedWagon]);

  // Hitung statistik seat
  useEffect(() => {
    if (!train?.wagons) {
      setAvailableSeatsCount(0);
      setReuseSeatsCount(0);
      return;
    }

    let available = 0;
    let reuseSeats = 0;

    train.wagons.forEach(wagon => {
      wagon.seats?.forEach(seat => {
        if (seat.available) {
          available++;
        }
        
        // Hitung kursi yang digunakan di segment lain (untuk reuse)
        if (seatReuseConfig.enableReuse && seat.occupancy) {
          const { occupiedSegments = [] } = seat.occupancy;
          const isOccupiedInOtherSegment = occupiedSegments.some(segmentId => 
            segmentId !== currentSegmentId
          );
          
          if (isOccupiedInOtherSegment) {
            reuseSeats++;
          }
        }
      });
    });

    // Only update if values changed
    setAvailableSeatsCount(prev => prev !== available ? available : prev);
    setReuseSeatsCount(prev => prev !== reuseSeats ? reuseSeats : prev);
  }, [train, seatReuseConfig, currentSegmentId]);

  // Filter wagon berdasarkan kelas yang dipilih
  const filteredWagons = useMemo(() => {
    if (!train?.wagons) return [];
    return train.wagons.filter(wagon => 
      selectedClass === 'all' || wagon.class === selectedClass
    );
  }, [train, selectedClass]);

  // Cari wagon yang dipilih
  const selectedWagonData = useMemo(() => {
    return filteredWagons.find(w => w.number === selectedWagon) || filteredWagons[0];
  }, [filteredWagons, selectedWagon]);

  // Jika tidak ada data train
  if (!train) {
    return (
      <div className="w-full max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Pilih Kursi</h2>
          <p className="text-gray-600">Kereta Tidak Tersedia</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-yellow-800 mb-2">Data kereta atau gerbong tidak ditemukan.</h3>
          <p className="text-yellow-700">
            Silakan pilih kereta lain atau hubungi customer service.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Pilih Kursi</h2>
        <p className="text-gray-600">
          {train.nama_kereta || train.trainName} • {train.origin} → {train.destination}
        </p>
        {autoSelectEmptySeats && (
          <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg mt-2">
            <span className="mr-2">☑</span>
            Auto-select kursi kosong
          </div>
        )}
        
      </div>

      {/* Train Diagram */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-2 mb-4 overflow-x-auto pb-2">
          {/* Lokomotif Depan */}
          <div className="w-16 h-10 bg-red-500 rounded-l-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            LOKO
          </div>
          
          {/* Gerbong */}
          {train.wagons.map((wagon) => (
            <button
              key={wagon.number}
              onClick={() => setSelectedWagon(wagon.number)}
              className={`w-20 h-12 rounded flex flex-col items-center justify-center border-2 transition-all flex-shrink-0 ${
                selectedWagon === wagon.number
                  ? 'border-[#FD7E14] bg-orange-50 scale-105'
                  : 'border-gray-300 bg-white hover:border-gray-400'
              }`}
            >
              <span className="text-xs font-medium">{wagon.name}</span>
              <span className="text-xs text-gray-500">
                {wagon.availableSeats}/{wagon.totalSeats}
              </span>
              <div className={`w-3 h-3 rounded-full mt-1 ${
                wagon.class === 'executive' ? 'bg-blue-500' :
                wagon.class === 'business' ? 'bg-green-500' :
                'bg-gray-500'
              }`}></div>
            </button>
          ))}
          
          {/* Lokomotif Belakang */}
          <div className="w-16 h-10 bg-red-500 rounded-r-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            LOKO
          </div>
        </div>
        
        <div className="text-center text-sm text-gray-600">
          Klik pada gerbong untuk melihat kursi yang tersedia
        </div>
      </div>

      {/* Progress indicator */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Status Pemesanan</h3>
            <p className="text-gray-600 mt-1">
              Pilih maksimal {maxSeats} kursi untuk {maxSeats} penumpang
            </p>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="text-right">
              <div className="text-sm text-gray-600">Kursi tersedia</div>
              <div className="text-xl font-bold text-green-600">{availableSeatsCount}</div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-600">Kursi terpilih</div>
              <div className="text-xl font-bold text-[#FD7E14]">{selectedSeats.length}/{maxSeats}</div>
            </div>
            
            {seatReuseConfig.enableReuse && showReuseInfo && (
              <div className="text-right">
                <div className="text-sm text-gray-600">Kursi reusable</div>
                <div className="text-xl font-bold text-blue-600">{reuseSeatsCount}</div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Progress: {selectedSeats.length} dari {maxSeats} kursi
            </span>
            <span className="text-sm text-gray-600">
              {Math.round((selectedSeats.length / maxSeats) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#FD7E14] transition-all duration-300"
              style={{ width: `${(selectedSeats.length / maxSeats) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Info reuse jika aktif */}
        {seatReuseConfig.enableReuse && showReuseInfo && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center mr-3 flex-shrink-0">
                <span className="text-blue-600">🔄</span>
              </div>
              <div>
                <h4 className="font-bold text-blue-800">Sistem Seat Reuse Aktif</h4>
                <p className="text-blue-700 text-sm mt-1">
                  Kursi yang sama dapat digunakan oleh penumpang yang berbeda di segment perjalanan lain. 
                  Kursi dengan simbol 🔄 sedang digunakan di segment lain tetapi masih tersedia untuk segment ini.
                </p>
              </div>
            </div>
          </div>
        )}
        
      
      </div>

      {/* Wagon Selector */}
      <div className="mb-6 bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-lg font-bold text-gray-800">Pilih Gerbong</h4>
            <p className="text-sm text-gray-600">
              Filter berdasarkan kelas atau pilih langsung gerbong
            </p>
          </div>
          
          <div className="flex space-x-2">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Kelas</option>
              <option value="executive">Eksekutif</option>
              <option value="business">Bisnis</option>
              <option value="economy">Ekonomi</option>
            </select>
            
            <select
              value={selectedWagon}
              onChange={(e) => setSelectedWagon(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {filteredWagons.map((wagon) => (
                <option key={wagon.number} value={wagon.number}>
                  {wagon.name} - {wagon.class}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Wagon Tabs */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {filteredWagons.map((wagon) => (
            <button
              key={wagon.number}
              onClick={() => setSelectedWagon(wagon.number)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg border transition-colors ${
                selectedWagon === wagon.number
                  ? 'bg-[#FD7E14] text-white border-[#FD7E14]'
                  : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
              }`}
            >
              <div className="text-center">
                <div className="font-medium">{wagon.name}</div>
                <div className="text-xs capitalize">{wagon.class}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Wagon */}
      {selectedWagonData && (
        <WagonSeatMap
          wagon={selectedWagonData}
          selectedSeats={selectedSeats}
          onSeatSelect={onSeatSelect}
          onSeatDeselect={onSeatDeselect}
          hoveredSeat={hoveredSeat}
          setHoveredSeat={setHoveredSeat}
          selectedSeatsCount={selectedSeats.length}
          maxSeats={maxSeats}
          currentSegmentId={currentSegmentId}
          seatReuseConfig={seatReuseConfig}
        />
      )}

      {/* Selected Seats Summary */}
      <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-bold text-lg text-gray-800 mb-4">
          Kursi Terpilih ({selectedSeats.length} dari {maxSeats})
        </h3>
        
        {selectedSeats.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-2">Belum ada kursi yang dipilih</p>
            <p className="text-gray-400 text-sm">
              {autoSelectEmptySeats 
                ? "Kursi akan dialokasikan otomatis saat check-in"
                : "Pilih kursi dari peta di atas"}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedSeats.map((seat, index) => {
                const seatPremium = seat.price - train.price;
                
                return (
                  <div key={`selected-seat-summary-${seat.id}`} className="border border-gray-300 rounded-lg p-4 hover:border-orange-300 transition-colors">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <span className="text-xl font-bold text-gray-800">{seat.number}</span>
                        <span className="ml-2 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          Gerbong {seat.wagonNumber}
                        </span>
                      </div>
                      <button
                        onClick={() => onSeatDeselect(seat.id)}
                        className="text-red-500 hover:text-red-700 text-sm font-medium"
                      >
                        ✕ Hapus
                      </button>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>Kelas: <span className="font-medium text-gray-800 capitalize">{seat.wagonClass}</span></div>
                      <div>Penumpang: <span className="font-medium text-gray-800">Penumpang {index + 1}</span></div>
                      <div>Posisi: <span className="font-medium text-gray-800">
                        {seat.windowSeat ? 'Jendela' : 'Lorong'} {seat.forwardFacing ? '↗' : ''}
                      </span></div>
                      
                      <div className="flex justify-between items-center mt-2">
                        <span>Harga dasar:</span>
                        <span>Rp {train.price.toLocaleString('id-ID')}</span>
                      </div>
                      
                      {seatPremium > 0 && (
                        <div className="flex justify-between items-center">
                          <span>Tambahan kursi:</span>
                          <span className="font-medium text-green-600">+Rp {seatPremium.toLocaleString('id-ID')}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center font-bold border-t pt-2 mt-2">
                        <span>Total:</span>
                        <span className="text-lg text-[#FD7E14]">Rp {seat.price.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Total Summary */}
            <div className="mt-6 pt-6 border-t">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-gray-800">Total Harga Kursi</h4>
                  <p className="text-sm text-gray-600">
                    {selectedSeats.length} kursi × Rp {train.price.toLocaleString('id-ID')} + premium
                  </p>
                </div>
                
                <div className="text-right">
                  <div className="text-2xl font-bold text-[#FD7E14]">
                    Rp {selectedSeats.reduce((sum, seat) => sum + seat.price, 0).toLocaleString('id-ID')}
                  </div>
                  <div className="text-xs text-gray-500">
                    Termasuk premium pilihan kursi
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Helper untuk seat reuse */}
      {seatReuseConfig.enableReuse && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
              <span className="text-blue-600 text-lg">ℹ️</span>
            </div>
            <div>
              <h4 className="font-bold text-blue-800">Tips Pilih Kursi dengan Seat Reuse</h4>
              <ul className="text-blue-700 text-sm space-y-2 mt-2">
                <li className="flex items-start">
                  <span className="inline-block w-4 h-4 bg-blue-200 rounded-full flex items-center justify-center text-blue-800 text-xs mr-2 mt-0.5">1</span>
                  <span>Kursi dengan simbol <span className="font-bold">🔄</span> sedang digunakan di segment lain</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-4 h-4 bg-blue-200 rounded-full flex items-center justify-center text-blue-800 text-xs mr-2 mt-0.5">2</span>
                  <span>Kursi <span className="font-bold">🔄</span> masih bisa dipilih untuk segment ini</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-4 h-4 bg-blue-200 rounded-full flex items-center justify-center text-blue-800 text-xs mr-2 mt-0.5">3</span>
                  <span>Kursi dengan simbol <span className="font-bold">👤</span> sudah digunakan di segment ini</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-4 h-4 bg-blue-200 rounded-full flex items-center justify-center text-blue-800 text-xs mr-2 mt-0.5">4</span>
                  <span>Pilih kursi <span className="font-bold">○</span> putih untuk kursi yang belum digunakan</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Hook untuk mengambil data kursi dari database dengan fallback
export const useTrainSeats = (trainId: string, scheduleId?: string) => {
  const [train, setTrain] = useState<Train | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrainSeats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch data kereta
        let trainData: Train | null = null;
        
        try {
          const trainResponse = await fetch(`/api/trains/${trainId}`);
          if (trainResponse.ok) {
            const result = await trainResponse.json();
            if (result.success) {
              trainData = result.data;
            }
          }
        } catch (trainError) {
          console.warn('Failed to fetch train data, using fallback:', trainError);
        }
        
        // Jika tidak ada data train, gunakan fallback
        if (!trainData) {
          trainData = {
            trainId: parseInt(trainId),
            trainName: 'Kereta Simulasi',
            trainType: 'Executive',
            departureTime: '08:00',
            arrivalTime: '12:00',
            duration: '4j 0m',
            origin: 'Bandung',
            destination: 'Gambir',
            price: 265000,
            availableSeats: 0,
            departureDate: new Date().toISOString().split('T')[0],
            wagons: []
          };
        }
        
        // Coba fetch data gerbong
        try {
          const wagonsResponse = await fetch(`/api/trains/${trainId}/wagons`);
          if (wagonsResponse.ok) {
            const wagonsResult = await wagonsResponse.json();
            
            if (wagonsResult.success && wagonsResult.data) {
              // Untuk setiap gerbong, fetch data kursi
              const wagonsWithSeats = await Promise.all(
                wagonsResult.data.map(async (wagon: any) => {
                  let seats: Seat[] = [];
                  
                  if (scheduleId) {
                    try {
                      const seatsResponse = await fetch(`/api/schedules/${scheduleId}/wagons/${wagon.id}/seats`);
                      if (seatsResponse.ok) {
                        const seatsData = await seatsResponse.json();
                        if (seatsData.success) {
                          seats = seatsData.data.map((seat: any) => ({
                            id: seat.id,
                            number: seat.kode_kursi || seat.seat_number,
                            row: seat.row || parseInt(seat.kode_kursi?.match(/\d+/)?.[0] || '0'),
                            column: seat.column || (seat.kode_kursi?.match(/[A-Z]/)?.[0] || 'A'),
                            available: seat.status === 'available',
                            windowSeat: seat.window_seat || false,
                            forwardFacing: seat.forward_facing || false,
                            price: calculateSeatPrice(wagon.class_type, trainData!.price, seat),
                            wagonNumber: wagon.coach_code,
                            wagonClass: wagon.class_type,
                            kode_kursi: seat.kode_kursi,
                            segmentId: seat.segment_id
                          }));
                        }
                      }
                    } catch (seatsError) {
                      console.warn(`Failed to fetch seats for wagon ${wagon.id}:`, seatsError);
                    }
                  }

                  return {
                    id: wagon.id,
                    number: wagon.coach_code,
                    name: `Gerbong ${wagon.coach_code}`,
                    class: wagon.class_type,
                    facilities: wagon.facilities || getDefaultFacilities(wagon.class_type),
                    availableSeats: seats.filter(s => s.available).length,
                    totalSeats: wagon.total_seats,
                    seats,
                    layout: wagon.layout
                  };
                })
              );

              const trainWithSeats: Train = {
                ...trainData,
                wagons: wagonsWithSeats,
                availableSeats: wagonsWithSeats.reduce((sum, wagon) => sum + wagon.availableSeats, 0)
              };

              setTrain(trainWithSeats);
              return;
            }
          }
        } catch (wagonsError) {
          console.warn('Failed to fetch wagons data:', wagonsError);
        }
        
        // Jika gagal fetch wagons, gunakan fallback
        const fallbackWagons = generateFallbackSeatData(trainData);
        const trainWithFallback: Train = {
          ...trainData,
          wagons: fallbackWagons,
          availableSeats: fallbackWagons.reduce((sum, wagon) => sum + wagon.availableSeats, 0)
        };
        
        setTrain(trainWithFallback);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
        console.error('Error fetching train seats:', err);
        
        // Fallback ke data simulasi jika terjadi error
        const fallbackTrain: Train = {
          trainId: parseInt(trainId) || 1,
          trainName: 'Kereta Simulasi',
          trainType: 'Executive',
          departureTime: '08:00',
          arrivalTime: '12:00',
          duration: '4j 0m',
          origin: 'Bandung',
          destination: 'Gambir',
          price: 265000,
          availableSeats: 0,
          departureDate: new Date().toISOString().split('T')[0],
          wagons: generateFallbackSeatData({
            trainId: parseInt(trainId) || 1,
            trainName: 'Kereta Simulasi',
            trainType: 'Executive',
            departureTime: '08:00',
            arrivalTime: '12:00',
            duration: '4j 0m',
            origin: 'Bandung',
            destination: 'Gambir',
            price: 265000,
            availableSeats: 0,
            departureDate: new Date().toISOString().split('T')[0],
            wagons: []
          })
        };
        
        setTrain(fallbackTrain);
      } finally {
        setLoading(false);
      }
    };

    if (trainId) {
      fetchTrainSeats();
    }
  }, [trainId, scheduleId]);

  return { train, loading, error };
};

export default TrainSeatMap;