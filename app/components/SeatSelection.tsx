'use client';

import React, { useState, useEffect } from 'react';

// --- Tipe Data untuk Seat Map ---
interface Seat {
  id: string;
  number: string;
  type: 'available' | 'occupied' | 'selected' | 'premium' | 'blocked';
  price?: number;
  amenities?: string[];
  row: number;
  column: string;
}

interface SeatMap {
  id: string;
  flightId: string;
  cabin: string;
  seats: Seat[];
  layout: {
    rows: number;
    columns: string[];
  };
}

// --- Komponen Ikon ---
const SeatIcon = ({ type, isSelected }: { type: string, isSelected: boolean }) => {
  const getSeatColor = () => {
    if (isSelected) return 'bg-blue-500 text-white';
    switch (type) {
      case 'available': return 'bg-gray-200 text-gray-700 hover:bg-gray-300';
      case 'occupied': return 'bg-red-300 text-red-700 cursor-not-allowed';
      case 'premium': return 'bg-yellow-200 text-yellow-800 hover:bg-yellow-300';
      case 'blocked': return 'bg-gray-400 text-gray-600 cursor-not-allowed';
      default: return 'bg-gray-200 text-gray-700';
    }
  };

  return (
    <div className={`w-8 h-8 rounded border-2 border-gray-400 flex items-center justify-center text-xs font-semibold cursor-pointer transition-all duration-200 ${getSeatColor()}`}>
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M4 6h16v2H4zm0 5h16v6H4z"/>
      </svg>
    </div>
  );
};

const PlaneIcon = () => (
  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

// --- Komponen Seat Selection ---
interface SeatSelectionProps {
  flightId: string;
  onSeatSelect: (seats: Seat[]) => void;
  selectedSeats: Seat[];
  passengerCount: number;
}

export default function SeatSelection({ flightId, onSeatSelect, selectedSeats, passengerCount }: SeatSelectionProps) {
  const [seatMap, setSeatMap] = useState<SeatMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Simulasi data seat map berdasarkan flightId
  useEffect(() => {
    const generateSeatMap = () => {
      const seats: Seat[] = [];
      const rows = 30;
      const columns = ['A', 'B', 'C', 'D', 'E', 'F'];
      
      for (let row = 1; row <= rows; row++) {
        columns.forEach((col, colIndex) => {
          const seatNumber = `${row}${col}`;
          const isAisle = col === 'C' || col === 'D';
          const isWindow = col === 'A' || col === 'F';
          const isPremium = row <= 5;
          const isOccupied = Math.random() < 0.3; // 30% chance of being occupied
          
          let type: Seat['type'] = 'available';
          if (isOccupied) type = 'occupied';
          else if (isPremium) type = 'premium';
          
          seats.push({
            id: `${flightId}-${seatNumber}`,
            number: seatNumber,
            type,
            price: isPremium ? 150000 : 0,
            amenities: isPremium ? ['extra-legroom', 'priority-boarding'] : [],
            row,
            column: col
          });
        });
      }
      
      return {
        id: `seatmap-${flightId}`,
        flightId,
        cabin: 'Economy',
        seats,
        layout: {
          rows,
          columns
        }
      };
    };

    // Simulasi API call
    setTimeout(() => {
      setSeatMap(generateSeatMap());
      setLoading(false);
    }, 1000);
  }, [flightId]);

  const handleSeatClick = (seat: Seat) => {
    if (seat.type === 'occupied' || seat.type === 'blocked') return;
    
    const isSelected = selectedSeats.some(s => s.id === seat.id);
    
    if (isSelected) {
      // Remove seat from selection
      const newSelection = selectedSeats.filter(s => s.id !== seat.id);
      onSeatSelect(newSelection);
    } else {
      // Add seat to selection (if under limit)
      if (selectedSeats.length < passengerCount) {
        const newSelection = [...selectedSeats, { ...seat, type: 'selected' as const }];
        onSeatSelect(newSelection);
      }
    }
  };

  const getSeatTypeLabel = (type: string) => {
    switch (type) {
      case 'available': return 'Tersedia';
      case 'occupied': return 'Terisi';
      case 'premium': return 'Premium';
      case 'selected': return 'Dipilih';
      default: return 'Tidak Tersedia';
    }
  };

  const getSeatTypeColor = (type: string) => {
    switch (type) {
      case 'available': return 'bg-gray-200';
      case 'occupied': return 'bg-red-300';
      case 'premium': return 'bg-yellow-200';
      case 'selected': return 'bg-blue-500';
      default: return 'bg-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat peta kursi...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center text-red-600">
          <p>Gagal memuat peta kursi: {error}</p>
        </div>
      </div>
    );
  }

  if (!seatMap) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800 flex items-center">
          <PlaneIcon />
          <span className="ml-2">Pilih Kursi</span>
        </h3>
        <div className="text-sm text-gray-600">
          Dipilih: {selectedSeats.length}/{passengerCount}
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {['available', 'occupied', 'premium', 'selected'].map(type => (
          <div key={type} className="flex items-center space-x-2">
            <div className={`w-4 h-4 rounded ${getSeatTypeColor(type)}`}></div>
            <span className="text-sm text-gray-600">{getSeatTypeLabel(type)}</span>
          </div>
        ))}
      </div>

      {/* Seat Map */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Header */}
          <div className="flex justify-center mb-4">
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-2">Kokpit</div>
              <div className="w-16 h-8 bg-gray-300 rounded flex items-center justify-center">
                <PlaneIcon />
              </div>
            </div>
          </div>

          {/* Column Headers */}
          <div className="flex justify-center mb-2">
            <div className="flex space-x-1">
              {seatMap.layout.columns.map(col => (
                <div key={col} className="w-8 text-center text-sm font-semibold text-gray-600">
                  {col}
                </div>
              ))}
            </div>
          </div>

          {/* Seat Grid */}
          <div className="space-y-1">
            {Array.from({ length: seatMap.layout.rows }, (_, rowIndex) => {
              const rowNumber = rowIndex + 1;
              const rowSeats = seatMap.seats.filter(seat => seat.row === rowNumber);
              
              return (
                <div key={rowNumber} className="flex items-center justify-center space-x-1">
                  {/* Row Number */}
                  <div className="w-6 text-right text-sm font-semibold text-gray-600 mr-2">
                    {rowNumber}
                  </div>
                  
                  {/* Seats */}
                  <div className="flex space-x-1">
                    {rowSeats.map(seat => {
                      const isSelected = selectedSeats.some(s => s.id === seat.id);
                      return (
                        <div
                          key={seat.id}
                          onClick={() => handleSeatClick(seat)}
                          className="cursor-pointer"
                        >
                          <SeatIcon type={seat.type} isSelected={isSelected} />
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Row Number */}
                  <div className="w-6 text-left text-sm font-semibold text-gray-600 ml-2">
                    {rowNumber}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Aisle Indicators */}
          <div className="flex justify-center mt-4">
            <div className="flex space-x-1">
              {seatMap.layout.columns.map((col, index) => (
                <div key={col} className="w-8 text-center">
                  {col === 'C' || col === 'D' ? (
                    <div className="text-xs text-gray-400">Gang</div>
                  ) : (
                    <div className="text-xs text-gray-400">
                      {col === 'A' || col === 'F' ? 'Jendela' : ''}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Selected Seats Summary */}
      {selectedSeats.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">Kursi yang Dipilih:</h4>
          <div className="flex flex-wrap gap-2">
            {selectedSeats.map(seat => (
              <div key={seat.id} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                {seat.number}
                {seat.price && seat.price > 0 && (
                  <span className="ml-1 text-xs">(+Rp {seat.price.toLocaleString('id-ID')})</span>
                )}
              </div>
            ))}
          </div>
          <div className="mt-2 text-sm text-blue-700">
            Total biaya kursi: Rp {selectedSeats.reduce((sum, seat) => sum + (seat.price || 0), 0).toLocaleString('id-ID')}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-4 text-sm text-gray-600">
        <p>• Klik kursi untuk memilih</p>
        <p>• Kursi premium memiliki biaya tambahan</p>
        <p>• Pilih {passengerCount} kursi sesuai jumlah penumpang</p>
      </div>
    </div>
  );
}
