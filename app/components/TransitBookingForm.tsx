'use client';

import React, { useState, useEffect } from 'react';
import { TransitService, RouteSegment } from '@/app/services/transitServices';

interface TransitBookingFormProps {
  scheduleId: string;
  onBookingComplete?: (bookingData: any) => void;
}

export default function TransitBookingForm({ scheduleId, onBookingComplete }: TransitBookingFormProps) {
  const [loading, setLoading] = useState(false);
  const [routeSegments, setRouteSegments] = useState<RouteSegment[]>([]);
  const [availableSeats, setAvailableSeats] = useState<any[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  
  // Form state
  const [departureStation, setDepartureStation] = useState('');
  const [arrivalStation, setArrivalStation] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [seatClass, setSeatClass] = useState('Eksekutif');
  const [passengerCount, setPassengerCount] = useState(1);
  
  // Load route segments
  useEffect(() => {
    loadRouteSegments();
  }, [scheduleId]);

  const loadRouteSegments = async () => {
    try {
      setLoading(true);
      const segments = await TransitService.getRouteSegments(scheduleId);
      setRouteSegments(segments);
      
      // Set default departure and arrival
      if (segments.length > 0) {
        setDepartureStation(segments[0].station_code);
        setArrivalStation(segments[segments.length - 1].station_code);
      }
    } catch (error) {
      console.error('Error loading route segments:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchAvailableSeats = async () => {
    if (!departureStation || !arrivalStation || !travelDate) {
      alert('Silakan pilih stasiun keberangkatan, tujuan, dan tanggal');
      return;
    }

    try {
      setLoading(true);
      const seats = await TransitService.getAvailableSeats({
        scheduleId,
        departureStationCode: departureStation,
        arrivalStationCode: arrivalStation,
        travelDate,
        seatClass
      });
      
      setAvailableSeats(seats);
      setSelectedSeat(null);
    } catch (error: any) {
      console.error('Error searching seats:', error);
      alert(error.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!selectedSeat) {
      alert('Silakan pilih kursi terlebih dahulu');
      return;
    }

    if (!departureStation || !arrivalStation) {
      alert('Silakan pilih stasiun keberangkatan dan tujuan');
      return;
    }

    try {
      setLoading(true);
      
      // 1. Create booking first
      const bookingResponse = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduleId,
          departureStation,
          arrivalStation,
          travelDate,
          seatClass,
          passengerCount,
          selectedSeat
        })
      });

      const bookingData = await bookingResponse.json();
      
      if (!bookingData.success) {
        throw new Error(bookingData.error || 'Gagal membuat booking');
      }

      // 2. Book the seat segment
      const transitResponse = await fetch('/api/transit/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: bookingData.data.booking_id,
          scheduleId,
          seatId: selectedSeat,
          departureStationCode: departureStation,
          arrivalStationCode: arrivalStation,
          passengerDetails: {
            count: passengerCount,
            // Add passenger details here
          }
        })
      });

      const transitData = await transitResponse.json();
      
      if (!transitData.success) {
        throw new Error(transitData.error || 'Gagal membooking kursi');
      }

      // 3. Trigger payment
      const paymentResponse = await fetch('/api/payment/create-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_code: bookingData.data.booking_code,
          order_id: bookingData.data.order_id,
          amount: bookingData.data.total_amount,
          customer_name: 'Passenger Name', // Get from form
          customer_email: 'email@example.com' // Get from form
        })
      });

      const paymentData = await paymentResponse.json();
      
      if (paymentData.success && paymentData.data.redirect_url) {
        // Redirect to payment page
        window.location.href = paymentData.data.redirect_url;
      } else {
        // Show success page directly
        if (onBookingComplete) {
          onBookingComplete({
            ...bookingData.data,
            ...transitData.data
          });
        }
      }

    } catch (error: any) {
      console.error('Error during booking:', error);
      alert(error.message || 'Terjadi kesalahan saat pemesanan');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get station options
  const getStationOptions = () => {
    if (!routeSegments.length) return [];
    
    const departureIndex = routeSegments.findIndex(s => s.station_code === departureStation);
    
    return routeSegments
      .filter((segment, index) => index > departureIndex)
      .map(segment => ({
        value: segment.station_code,
        label: `${segment.station_name} (${segment.station_code})`
      }));
  };

  if (loading && !routeSegments.length) {
    return <div className="text-center py-4">Memuat data rute...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Pemesanan Tiket Transit</h2>
      
      {/* Route Information */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Rute Kereta:</h3>
        <div className="flex items-center overflow-x-auto py-2">
          {routeSegments.map((segment, index) => (
            <div key={segment.id} className="flex items-center">
              <div className={`px-3 py-1 rounded-full text-sm ${
                segment.station_code === departureStation 
                  ? 'bg-green-100 text-green-800' 
                  : segment.station_code === arrivalStation
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {segment.station_code}
                <div className="text-xs">{segment.station_name}</div>
              </div>
              {index < routeSegments.length - 1 && (
                <div className="mx-2 text-gray-400">→</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Booking Form */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stasiun Keberangkatan
            </label>
            <select
              value={departureStation}
              onChange={(e) => setDepartureStation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="">Pilih Stasiun</option>
              {routeSegments.slice(0, -1).map(segment => (
                <option key={segment.station_code} value={segment.station_code}>
                  {segment.station_name} ({segment.station_code}) - {segment.departure_time}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stasiun Tujuan
            </label>
            <select
              value={arrivalStation}
              onChange={(e) => setArrivalStation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading || !departureStation}
            >
              <option value="">Pilih Stasiun</option>
              {getStationOptions().map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal Berangkat
            </label>
            <input
              type="date"
              value={travelDate}
              onChange={(e) => setTravelDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kelas
            </label>
            <select
              value={seatClass}
              onChange={(e) => setSeatClass(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Eksekutif">Eksekutif</option>
              <option value="Bisnis">Bisnis</option>
              <option value="Ekonomi">Ekonomi</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jumlah Penumpang
            </label>
            <select
              value={passengerCount}
              onChange={(e) => setPassengerCount(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[1, 2, 3, 4, 5].map(num => (
                <option key={num} value={num}>{num} Penumpang</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={searchAvailableSeats}
              disabled={loading || !departureStation || !arrivalStation || !travelDate}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Mencari...' : 'Cari Kursi'}
            </button>
          </div>
        </div>
      </div>

      {/* Available Seats */}
      {availableSeats.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Kursi Tersedia</h3>
          
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-4 h-4 bg-green-100 border border-green-400 rounded"></div>
              <span className="text-sm">Tersedia</span>
              <div className="w-4 h-4 bg-red-100 border border-red-400 rounded ml-4"></div>
              <span className="text-sm">Terbooking</span>
              <div className="w-4 h-4 bg-yellow-100 border border-yellow-400 rounded ml-4"></div>
              <span className="text-sm">Dipilih</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableSeats.map(seat => (
              <div
                key={seat.seat_id}
                onClick={() => {
                  if (seat.segment_availability) {
                    setSelectedSeat(seat.seat_id === selectedSeat ? null : seat.seat_id);
                  }
                }}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  seat.seat_id === selectedSeat
                    ? 'border-yellow-400 bg-yellow-50'
                    : seat.segment_availability
                    ? 'border-green-200 hover:border-green-400 bg-green-50'
                    : 'border-red-200 bg-red-50 cursor-not-allowed'
                } ${!seat.segment_availability ? 'opacity-50' : ''}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">
                    {seat.coach_number}-{seat.seat_number}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    seat.seat_class === 'Eksekutif' ? 'bg-purple-100 text-purple-800' :
                    seat.seat_class === 'Bisnis' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {seat.seat_class}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <div>Harga: Rp {seat.price.toLocaleString()}</div>
                  <div className={`mt-1 ${seat.segment_availability ? 'text-green-600' : 'text-red-600'}`}>
                    {seat.segment_availability ? '✓ Tersedia' : '✗ Terbooking'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedSeat && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Kursi Dipilih</h4>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">
                    {availableSeats.find(s => s.seat_id === selectedSeat)?.coach_number}-{availableSeats.find(s => s.seat_id === selectedSeat)?.seat_number}
                  </p>
                  <p className="text-sm text-blue-600">
                    {departureStation} → {arrivalStation}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-800">
                    Rp {availableSeats.find(s => s.seat_id === selectedSeat)?.price.toLocaleString()}
                  </p>
                  <button
                    onClick={handleBooking}
                    disabled={loading}
                    className="mt-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-400"
                  >
                    {loading ? 'Memproses...' : 'Lanjutkan Pemesanan'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {availableSeats.length === 0 && departureStation && arrivalStation && !loading && (
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
          <p className="text-yellow-800">Tidak ada kursi tersedia untuk rute ini.</p>
          <p className="text-sm text-yellow-600 mt-1">
            Silakan coba rute, tanggal, atau kelas yang berbeda.
          </p>
        </div>
      )}

      {/* Seat Availability Matrix (Advanced View) */}
      <div className="mt-8">
        <details>
          <summary className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium">
            Lihat Diagram Ketersediaan Kursi
          </summary>
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">
              Diagram ini menunjukkan ketersediaan kursi untuk berbagai kombinasi segmen:
            </p>
            {/* You can implement a visual matrix here */}
            <div className="text-center text-gray-500 italic">
              [Visual seat availability matrix would go here]
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}