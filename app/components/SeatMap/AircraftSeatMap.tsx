'use client';

import React, { useState, useEffect } from 'react';
import { Flight, Seat } from '@/types';

interface AircraftSeatMapProps {
  flight: Flight;
  selectedSeats: Seat[];
  onSeatSelect: (seat: Seat) => void;
  onSeatDeselect: (seatId: string) => void;
}

export const AircraftSeatMap: React.FC<AircraftSeatMapProps> = ({
  flight,
  selectedSeats,
  onSeatSelect,
  onSeatDeselect,
}) => {
  const [hoveredSeat, setHoveredSeat] = useState<string | null>(null);

  const getSeatColor = (seat: Seat) => {
    if (selectedSeats.some(s => s.id === seat.id)) return 'bg-green-500 border-green-600';
    if (!seat.available) return 'bg-gray-300 border-gray-400 cursor-not-allowed';
    if (seat.class === 'first') return 'bg-purple-400 border-purple-500';
    if (seat.class === 'business') return 'bg-blue-400 border-blue-500';
    return 'bg-gray-100 border-gray-300 hover:bg-blue-200';
  };

  const getSeatPrice = (seat: Seat) => {
    const basePrice = flight.price;
    let multiplier = 1;
    
    if (seat.class === 'business') multiplier = 2;
    if (seat.class === 'first') multiplier = 3;
    if (seat.extraLegroom) multiplier += 0.5;
    if (seat.emergencyExit) multiplier += 0.3;
    
    return Math.round(basePrice * multiplier);
  };

  const renderCabinSection = (startRow: number, endRow: number, title: string) => {
    const rows = [];
    for (let row = startRow; row <= endRow; row++) {
      const rowSeats = flight.seats.filter(seat => seat.row === row);
      
      rows.push(
        <div key={row} className="flex items-center justify-center space-x-2 mb-2">
          <span className="text-sm font-medium w-6 text-center">{row}</span>
          <div className="flex space-x-1">
            {rowSeats.map(seat => (
              <button
                key={seat.id}
                className={`w-8 h-8 border-2 rounded-lg flex items-center justify-center text-xs font-medium transition-all transform hover:scale-110 ${getSeatColor(seat)} ${
                  hoveredSeat === seat.id ? 'ring-2 ring-yellow-400' : ''
                }`}
                onClick={() => {
                  if (!seat.available) return;
                  if (selectedSeats.some(s => s.id === seat.id)) {
                    onSeatDeselect(seat.id);
                  } else {
                    onSeatSelect({ ...seat, price: getSeatPrice(seat) });
                  }
                }}
                onMouseEnter={() => setHoveredSeat(seat.id)}
                onMouseLeave={() => setHoveredSeat(null)}
                disabled={!seat.available}
                title={`${seat.column}${seat.row} - ${seat.class} - Rp ${getSeatPrice(seat).toLocaleString()}`}
              >
                {seat.column}
                {seat.emergencyExit && '🚪'}
                {seat.extraLegroom && '🦵'}
              </button>
            ))}
          </div>
          <span className="text-sm font-medium w-6 text-center">{row}</span>
        </div>
      );
    }

    return (
      <div className="mb-6">
        <div className="text-center font-semibold text-lg mb-4 bg-gray-100 py-2 rounded">
          {title}
        </div>
        {rows}
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-800">Pilih Tempat Duduk</h3>
        <p className="text-gray-600">
          {flight.airline} - {flight.flightNumber} • {flight.aircraft.model}
        </p>
      </div>

      {/* Aircraft Visualization */}
      <div className="relative mb-8">
        <div className="bg-blue-200 h-4 rounded-t-lg mx-auto w-3/4"></div>
        <div className="bg-gray-800 h-12 rounded-lg mx-auto w-5/6 flex items-center justify-center text-white text-sm">
          KOKPIT
        </div>
      </div>

      {/* First Class */}
      {renderCabinSection(1, 4, 'Kelas Utama (First Class)')}
      
      {/* Business Class */}
      {renderCabinSection(5, 8, 'Kelas Bisnis')}
      
      {/* Economy Class */}
      {renderCabinSection(9, 30, 'Kelas Ekonomi')}

      {/* Legend */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold mb-3">Keterangan:</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 border border-green-600 rounded"></div>
            <span>Terpilih</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-300 border border-gray-400 rounded"></div>
            <span>Tidak Tersedia</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-purple-400 border border-purple-500 rounded"></div>
            <span>First Class</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-400 border border-blue-500 rounded"></div>
            <span>Business Class</span>
          </div>
        </div>
      </div>
    </div>
  );
};