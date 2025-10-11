'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';

// Types
interface Seat {
  id: string;
  row: number;
  column: string;
  type: 'economy' | 'business' | 'first' | 'premium';
  status: 'available' | 'occupied' | 'selected' | 'blocked';
  price: number;
  features: string[];
}

interface SeatMapProps {
  flightId: string;
  onSeatSelection: (seats: Seat[]) => void;
  selectedSeats: Seat[];
  maxSeats: number;
}

// Mock WebSocket simulation for real-time updates
class SeatMapWebSocket {
  private callbacks: ((seats: Seat[]) => void)[] = [];
  private interval: NodeJS.Timeout | null = null;

  connect(flightId: string) {
    // Simulate real-time updates every 3 seconds
    this.interval = setInterval(() => {
      this.simulateSeatUpdate(flightId);
    }, 3000);
  }

  disconnect() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  onSeatUpdate(callback: (seats: Seat[]) => void) {
    this.callbacks.push(callback);
  }

  private simulateSeatUpdate(flightId: string) {
    // Simulate random seat status changes
    const updatedSeats = this.generateMockSeats(flightId);
    this.callbacks.forEach(callback => callback(updatedSeats));
  }

  private generateMockSeats(flightId: string): Seat[] {
    const seats: Seat[] = [];
    const rows = 30;
    const columns = ['A', 'B', 'C', 'D', 'E', 'F'];
    
    for (let row = 1; row <= rows; row++) {
      for (const col of columns) {
        const seatId = `${row}${col}`;
        const isBusiness = row <= 5;
        const isFirst = row <= 2;
        const isPremium = row >= 6 && row <= 10;
        
        let type: Seat['type'] = 'economy';
        if (isFirst) type = 'first';
        else if (isBusiness) type = 'business';
        else if (isPremium) type = 'premium';
        
        const basePrice = isFirst ? 500000 : isBusiness ? 300000 : isPremium ? 200000 : 150000;
        const randomPrice = basePrice + Math.floor(Math.random() * 100000);
        
        // Simulate random occupancy (80% available, 20% occupied)
        const isOccupied = Math.random() < 0.2;
        const status: Seat['status'] = isOccupied ? 'occupied' : 'available';
        
        seats.push({
          id: seatId,
          row,
          column: col,
          type,
          status,
          price: randomPrice,
          features: this.getSeatFeatures(type)
        });
      }
    }
    
    return seats;
  }

  private getSeatFeatures(type: Seat['type']): string[] {
    switch (type) {
      case 'first':
        return ['Extra Legroom', 'Priority Boarding', 'Meal Included', 'Entertainment'];
      case 'business':
        return ['Extra Legroom', 'Priority Boarding', 'Meal Included'];
      case 'premium':
        return ['Extra Legroom', 'Priority Boarding'];
      default:
        return ['Standard'];
    }
  }
}

// Seat Map Component
const SeatMap: React.FC<SeatMapProps> = ({ 
  flightId, 
  onSeatSelection, 
  selectedSeats, 
  maxSeats 
}) => {
  const { user } = useAuth();
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [ws] = useState(() => new SeatMapWebSocket());
  const [hoveredSeat, setHoveredSeat] = useState<Seat | null>(null);

  // Initialize seats and WebSocket connection
  useEffect(() => {
    setLoading(true);
    
    // Simulate initial seat loading
    setTimeout(() => {
      const initialSeats = ws['generateMockSeats'](flightId);
      setSeats(initialSeats);
      setLoading(false);
    }, 1000);

    // Connect to real-time updates
    ws.connect(flightId);
    ws.onSeatUpdate((updatedSeats) => {
      setSeats(prevSeats => {
        // Merge updates while preserving user selections
        return updatedSeats.map(updatedSeat => {
          const userSelected = prevSeats.find(seat => 
            seat.id === updatedSeat.id && seat.status === 'selected'
          );
          return userSelected || updatedSeat;
        });
      });
    });

    return () => {
      ws.disconnect();
    };
  }, [flightId, ws]);

  const handleSeatClick = useCallback((seat: Seat) => {
    if (seat.status === 'occupied' || seat.status === 'blocked') return;
    if (!user) {
      alert('Silakan login terlebih dahulu untuk memilih kursi');
      return;
    }

    setSeats(prevSeats => {
      return prevSeats.map(s => {
        if (s.id === seat.id) {
          if (s.status === 'selected') {
            return { ...s, status: 'available' as const };
          } else if (s.status === 'available' && selectedSeats.length < maxSeats) {
            return { ...s, status: 'selected' as const };
          }
        }
        return s;
      });
    });
  }, [selectedSeats.length, maxSeats, user]);

  // Update selected seats when seats state changes
  useEffect(() => {
    const newSelectedSeats = seats.filter(s => s.status === 'selected');
    onSeatSelection(newSelectedSeats);
  }, [seats, onSeatSelection]);

  const getSeatColor = (seat: Seat) => {
    if (seat.status === 'selected') return 'bg-blue-500 text-white';
    if (seat.status === 'occupied') return 'bg-gray-400 text-white cursor-not-allowed';
    if (seat.status === 'blocked') return 'bg-red-400 text-white cursor-not-allowed';
    
    switch (seat.type) {
      case 'first': return 'bg-purple-200 hover:bg-purple-300 text-purple-800';
      case 'business': return 'bg-yellow-200 hover:bg-yellow-300 text-yellow-800';
      case 'premium': return 'bg-green-200 hover:bg-green-300 text-green-800';
      default: return 'bg-gray-200 hover:bg-gray-300 text-gray-800';
    }
  };

  const getSeatPrice = (seat: Seat) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(seat.price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Memuat peta kursi...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800">Pilih Kursi Anda</h3>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            Dipilih: <span className="font-semibold text-blue-600">{selectedSeats.length}</span> / {maxSeats}
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <div className="w-3 h-3 bg-green-200 rounded"></div>
            <span>Available</span>
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Selected</span>
            <div className="w-3 h-3 bg-gray-400 rounded"></div>
            <span>Occupied</span>
          </div>
        </div>
      </div>

      {/* Seat Legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-purple-200 rounded"></div>
          <span className="text-sm">First Class</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-yellow-200 rounded"></div>
          <span className="text-sm">Business Class</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-200 rounded"></div>
          <span className="text-sm">Premium Economy</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-200 rounded"></div>
          <span className="text-sm">Economy Class</span>
        </div>
      </div>

      {/* Seat Map */}
      <div className="relative">
        {/* Cockpit */}
        <div className="text-center mb-4">
          <div className="inline-block bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-semibold">
            🛩️ COCKPIT
          </div>
        </div>

        {/* Seats Grid */}
        <div className="grid grid-cols-7 gap-2 max-w-2xl mx-auto">
          {/* Column Headers */}
          <div></div>
          {['A', 'B', 'C', 'D', 'E', 'F'].map(col => (
            <div key={col} className="text-center text-sm font-semibold text-gray-600 py-2">
              {col}
            </div>
          ))}

          {/* Seat Rows */}
          {Array.from({ length: 30 }, (_, rowIndex) => {
            const rowNumber = rowIndex + 1;
            const rowSeats = seats.filter(seat => seat.row === rowNumber);
            
            return (
              <React.Fragment key={rowNumber}>
                {/* Row Number */}
                <div className="flex items-center justify-center text-sm font-semibold text-gray-600">
                  {rowNumber}
                </div>
                
                {/* Seats in Row */}
                {['A', 'B', 'C', 'D', 'E', 'F'].map(col => {
                  const seat = rowSeats.find(s => s.column === col);
                  if (!seat) return <div key={col}></div>;
                  
                  return (
                    <button
                      key={seat.id}
                      onClick={() => handleSeatClick(seat)}
                      onMouseEnter={() => setHoveredSeat(seat)}
                      onMouseLeave={() => setHoveredSeat(null)}
                      className={`
                        w-8 h-8 rounded text-xs font-semibold transition-all duration-200
                        ${getSeatColor(seat)}
                        ${seat.status === 'available' ? 'cursor-pointer hover:scale-110' : 'cursor-not-allowed'}
                        ${hoveredSeat?.id === seat.id ? 'ring-2 ring-blue-400' : ''}
                      `}
                      disabled={seat.status === 'occupied' || seat.status === 'blocked'}
                    >
                      {seat.column}
                    </button>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>

        {/* Exit Signs */}
        <div className="flex justify-between mt-4 max-w-2xl mx-auto">
          <div className="text-center">
            <div className="bg-red-500 text-white px-3 py-1 rounded text-xs font-bold">
              EXIT
            </div>
            <div className="text-xs text-gray-500 mt-1">Row 10</div>
          </div>
          <div className="text-center">
            <div className="bg-red-500 text-white px-3 py-1 rounded text-xs font-bold">
              EXIT
            </div>
            <div className="text-xs text-gray-500 mt-1">Row 20</div>
          </div>
        </div>
      </div>

      {/* Seat Details Tooltip */}
      {hoveredSeat && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-800">
                Kursi {hoveredSeat.id} - {hoveredSeat.type.charAt(0).toUpperCase() + hoveredSeat.type.slice(1)} Class
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                {getSeatPrice(hoveredSeat)}
              </p>
              <div className="flex flex-wrap gap-1 mt-2">
                {hoveredSeat.features.map((feature, index) => (
                  <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {feature}
                  </span>
                ))}
              </div>
            </div>
            {hoveredSeat.status === 'available' && (
              <button
                onClick={() => handleSeatClick(hoveredSeat)}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Pilih Kursi
              </button>
            )}
          </div>
        </div>
      )}

      {/* Selected Seats Summary */}
      {selectedSeats.length > 0 && (
        <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <h4 className="font-semibold text-green-800 mb-2">Kursi Terpilih:</h4>
          <div className="flex flex-wrap gap-2">
            {selectedSeats.map(seat => (
              <div key={seat.id} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                {seat.id} - {getSeatPrice(seat)}
              </div>
            ))}
          </div>
          <div className="mt-2 text-sm text-green-700">
            Total: {new Intl.NumberFormat('id-ID', {
              style: 'currency',
              currency: 'IDR',
              minimumFractionDigits: 0
            }).format(selectedSeats.reduce((sum, seat) => sum + seat.price, 0))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SeatMap;
