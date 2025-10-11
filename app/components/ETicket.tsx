'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';

// Types
interface ETicketData {
  bookingId: string;
  orderId: string;
  passengerName: string;
  passengerEmail: string;
  flightDetails: {
    airline: string;
    flightNumber: string;
    aircraft: string;
    origin: string;
    destination: string;
    departure: {
      airport: string;
      terminal: string;
      date: string;
      time: string;
    };
    arrival: {
      airport: string;
      terminal: string;
      date: string;
      time: string;
    };
    duration: string;
    class: string;
  };
  seatDetails: {
    seatNumber: string;
    seatType: string;
    price: number;
  };
  bookingDetails: {
    bookingDate: string;
    totalAmount: number;
    paymentMethod: string;
    status: string;
  };
  qrCode: string;
  barcode: string;
}

interface ETicketProps {
  bookingId: string;
  onDownload?: () => void;
  onShare?: () => void;
}

const ETicket: React.FC<ETicketProps> = ({ bookingId, onDownload, onShare }) => {
  const { user } = useAuth();
  const [ticketData, setTicketData] = useState<ETicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch ticket data
  useEffect(() => {
    const fetchTicketData = async () => {
      try {
        setLoading(true);
        
        // Simulate API call - replace with actual API
        const response = await fetch(`/api/tickets/${bookingId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch ticket data');
        }
        
        const data = await response.json();
        setTicketData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchTicketData();
  }, [bookingId]);

  // Generate QR Code (mock implementation)
  const generateQRCode = (data: string) => {
    // In real implementation, use a QR code library like qrcode.js
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="white"/>
        <text x="100" y="100" text-anchor="middle" font-family="monospace" font-size="12">
          QR: ${data}
        </text>
      </svg>
    `)}`;
  };

  // Generate Barcode (mock implementation)
  const generateBarcode = (data: string) => {
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="300" height="100" xmlns="http://www.w3.org/2000/svg">
        <rect width="300" height="100" fill="white"/>
        <text x="150" y="50" text-anchor="middle" font-family="monospace" font-size="10">
          ||| ${data} |||
        </text>
      </svg>
    `)}`;
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format time
  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Memuat e-ticket...</span>
      </div>
    );
  }

  if (error || !ticketData) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-500 text-4xl mb-4">❌</div>
        <h3 className="text-lg font-semibold text-red-800 mb-2">Gagal Memuat E-Ticket</h3>
        <p className="text-red-600">{error || 'Data tiket tidak ditemukan'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">E-Ticket</h1>
            <p className="text-blue-100">TripGO Travel Agent</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-100">Booking ID</p>
            <p className="text-lg font-semibold">{ticketData.bookingId}</p>
          </div>
        </div>
      </div>

      {/* Ticket Content */}
      <div className="p-6">
        {/* Flight Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Departure */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">Keberangkatan</h3>
              <span className="text-sm text-gray-500">DEPARTURE</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Bandara</span>
                <span className="font-semibold">{ticketData.flightDetails.departure.airport}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Terminal</span>
                <span className="font-semibold">{ticketData.flightDetails.departure.terminal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tanggal</span>
                <span className="font-semibold">{formatDate(ticketData.flightDetails.departure.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Waktu</span>
                <span className="font-semibold text-blue-600">{formatTime(ticketData.flightDetails.departure.time)}</span>
              </div>
            </div>
          </div>

          {/* Arrival */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">Kedatangan</h3>
              <span className="text-sm text-gray-500">ARRIVAL</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Bandara</span>
                <span className="font-semibold">{ticketData.flightDetails.arrival.airport}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Terminal</span>
                <span className="font-semibold">{ticketData.flightDetails.arrival.terminal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tanggal</span>
                <span className="font-semibold">{formatDate(ticketData.flightDetails.arrival.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Waktu</span>
                <span className="font-semibold text-green-600">{formatTime(ticketData.flightDetails.arrival.time)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Flight Details */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">Detail Penerbangan</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Maskapai</p>
              <p className="font-semibold">{ticketData.flightDetails.airline}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Nomor Penerbangan</p>
              <p className="font-semibold">{ticketData.flightDetails.flightNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Pesawat</p>
              <p className="font-semibold">{ticketData.flightDetails.aircraft}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Durasi</p>
              <p className="font-semibold">{ticketData.flightDetails.duration}</p>
            </div>
          </div>
        </div>

        {/* Passenger & Seat Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Passenger Info */}
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Informasi Penumpang</h3>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-600">Nama</p>
                <p className="font-semibold">{ticketData.passengerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-semibold">{ticketData.passengerEmail}</p>
              </div>
            </div>
          </div>

          {/* Seat Info */}
          <div className="bg-purple-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Informasi Kursi</h3>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-600">Nomor Kursi</p>
                <p className="font-semibold text-lg">{ticketData.seatDetails.seatNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Kelas</p>
                <p className="font-semibold">{ticketData.seatDetails.seatType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Harga Kursi</p>
                <p className="font-semibold">{formatCurrency(ticketData.seatDetails.price)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* QR Code & Barcode */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="text-center">
            <h3 className="font-semibold text-gray-800 mb-3">QR Code</h3>
            <div className="bg-white border-2 border-gray-200 rounded-lg p-4 inline-block">
              <img 
                src={generateQRCode(ticketData.bookingId)} 
                alt="QR Code" 
                className="w-32 h-32 mx-auto"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">Scan untuk verifikasi</p>
          </div>
          
          <div className="text-center">
            <h3 className="font-semibold text-gray-800 mb-3">Barcode</h3>
            <div className="bg-white border-2 border-gray-200 rounded-lg p-4 inline-block">
              <img 
                src={generateBarcode(ticketData.bookingId)} 
                alt="Barcode" 
                className="w-48 h-16 mx-auto"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">Scan di bandara</p>
          </div>
        </div>

        {/* Booking Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">Ringkasan Pemesanan</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Tanggal Pemesanan</p>
              <p className="font-semibold">{formatDate(ticketData.bookingDetails.bookingDate)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Pembayaran</p>
              <p className="font-semibold text-green-600">{formatCurrency(ticketData.bookingDetails.totalAmount)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Metode Pembayaran</p>
              <p className="font-semibold">{ticketData.bookingDetails.paymentMethod}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                ticketData.bookingDetails.status === 'confirmed' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {ticketData.bookingDetails.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Catatan Penting</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Datang ke bandara minimal 2 jam sebelum keberangkatan</li>
            <li>• Bawa dokumen identitas yang valid</li>
            <li>• E-ticket ini dapat digunakan untuk check-in online</li>
            <li>• Simpan e-ticket ini dengan baik</li>
            <li>• Hubungi customer service jika ada pertanyaan</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={onDownload}
            className="flex-1 bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors font-semibold"
          >
            📥 Download E-Ticket
          </button>
          <button
            onClick={onShare}
            className="flex-1 bg-green-500 text-white py-3 px-6 rounded-lg hover:bg-green-600 transition-colors font-semibold"
          >
            📤 Bagikan E-Ticket
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-100 p-4 text-center">
        <p className="text-sm text-gray-600">
          Terima kasih telah memilih TripGO Travel Agent
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Customer Service: +62 21 1234 5678 | Email: support@tripgo.com
        </p>
      </div>
    </div>
  );
};

export default ETicket;
