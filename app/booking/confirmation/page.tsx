'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';

// --- Komponen Ikon ---
const CheckCircleIcon = () => (
  <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PlaneIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const ShareIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
  </svg>
);

// --- Komponen Detail Penerbangan ---
const FlightDetails = ({ booking }: { booking: any }) => (
  <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
      <PlaneIcon />
      <span className="ml-2">Detail Penerbangan</span>
    </h3>
    
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-3">
        <img 
          src={`/images/airline-logo-${booking.flight.airline.toLowerCase()}.png`} 
          alt={`${booking.flight.airline} logo`} 
          className="w-12 h-12 object-contain"
        />
        <div>
          <h4 className="font-bold text-lg text-gray-800">{booking.flight.airline}</h4>
          <p className="text-sm text-gray-500">{booking.flight.flightNumber}</p>
        </div>
      </div>
    </div>

    {/* Route Information */}
    <div className="flex items-center justify-between py-4 border-t border-b border-gray-200">
      <div className="text-center">
        <p className="text-2xl font-bold text-gray-800">{booking.flight.departureTime}</p>
        <p className="text-sm text-gray-500">{booking.flight.originCode}</p>
        <p className="text-xs text-gray-400">{booking.flight.origin}</p>
      </div>
      
      <div className="flex-1 mx-6">
        <div className="flex items-center justify-center">
          <div className="flex-1 h-px bg-gray-300"></div>
          <div className="mx-3 flex flex-col items-center">
            <PlaneIcon />
            <p className="text-xs text-gray-500 mt-1">{booking.flight.duration}</p>
          </div>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">Langsung</p>
      </div>
      
      <div className="text-center">
        <p className="text-2xl font-bold text-gray-800">{booking.flight.arrivalTime}</p>
        <p className="text-sm text-gray-500">{booking.flight.destinationCode}</p>
        <p className="text-xs text-gray-400">{booking.flight.destination}</p>
      </div>
    </div>

    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <p className="text-sm font-medium text-gray-700">Tanggal Keberangkatan</p>
        <p className="text-lg font-semibold text-gray-800">{booking.flight.departureDate}</p>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-700">Kelas</p>
        <p className="text-lg font-semibold text-gray-800">{booking.flight.class}</p>
      </div>
    </div>
  </div>
);

// --- Komponen Detail Penumpang ---
const PassengerDetails = ({ passengers }: { passengers: any[] }) => (
  <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
    <h3 className="text-xl font-bold text-gray-800 mb-4">Detail Penumpang</h3>
    
    <div className="space-y-4">
      {passengers.map((passenger, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-2">Penumpang {index + 1}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Nama Lengkap</p>
              <p className="font-medium text-gray-800">{passenger.title} {passenger.firstName} {passenger.lastName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tanggal Lahir</p>
              <p className="font-medium text-gray-800">{passenger.dateOfBirth}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Nomor Paspor</p>
              <p className="font-medium text-gray-800">{passenger.passportNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Kewarganegaraan</p>
              <p className="font-medium text-gray-800">{passenger.nationality}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// --- Komponen Ringkasan Pembayaran ---
const PaymentSummary = ({ booking }: { booking: any }) => (
  <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
    <h3 className="text-xl font-bold text-gray-800 mb-4">Ringkasan Pembayaran</h3>
    
    <div className="space-y-3">
      <div className="flex justify-between">
        <span className="text-gray-600">Harga Tiket ({booking.passengerCount} orang)</span>
        <span className="font-medium">Rp {booking.totalBasePrice.toLocaleString('id-ID')}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-600">Pajak & Fee</span>
        <span className="font-medium">Rp {booking.tax.toLocaleString('id-ID')}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-600">Biaya Layanan</span>
        <span className="font-medium">Rp {booking.serviceFee.toLocaleString('id-ID')}</span>
      </div>
      <hr className="border-gray-200" />
      <div className="flex justify-between text-lg font-bold">
        <span>Total Dibayar</span>
        <span className="text-green-600">Rp {booking.totalPrice.toLocaleString('id-ID')}</span>
      </div>
    </div>
    
    <div className="mt-4 p-3 bg-green-50 rounded-lg">
      <p className="text-sm text-green-700">
        <strong>Metode Pembayaran:</strong> {booking.paymentMethod}
      </p>
      <p className="text-sm text-green-700">
        <strong>Status:</strong> Lunas
      </p>
    </div>
  </div>
);

// --- Komponen Aksi ---
const ActionButtons = ({ bookingId }: { bookingId: string }) => {
  const handleDownloadTicket = () => {
    // Simulasi download tiket
    alert('Fitur download tiket akan segera tersedia!');
  };

  const handleShareBooking = () => {
    // Simulasi share booking
    if (navigator.share) {
      navigator.share({
        title: 'Konfirmasi Booking TripGO',
        text: `Booking ID: ${bookingId}`,
        url: window.location.href
      });
    } else {
      // Fallback untuk browser yang tidak support Web Share API
      navigator.clipboard.writeText(window.location.href);
      alert('Link booking telah disalin ke clipboard!');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Aksi</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={handleDownloadTicket}
          className="flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-300"
        >
          <DownloadIcon />
          <span>Download Tiket</span>
        </button>
        
        <button
          onClick={handleShareBooking}
          className="flex items-center justify-center space-x-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-300"
        >
          <ShareIcon />
          <span>Bagikan Booking</span>
        </button>
      </div>
    </div>
  );
};

// --- Komponen Utama Konfirmasi Booking ---
const BookingConfirmationContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulasi data booking berdasarkan parameter URL
    const bookingId = searchParams.get('id') || 'TRP' + Math.random().toString(36).substr(2, 9).toUpperCase();
    
    const bookingData = {
      id: bookingId,
      flight: {
        airline: 'Garuda',
        flightNumber: 'GA-123',
        departureTime: '07:30',
        arrivalTime: '09:00',
        duration: '1j 30m',
        originCode: 'CGK',
        destinationCode: 'DPS',
        origin: 'Jakarta',
        destination: 'Bali',
        departureDate: '2024-01-15',
        class: 'Ekonomi'
      },
      passengers: [
        {
          title: 'Mr',
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: '1990-01-01',
          passportNumber: 'A1234567',
          nationality: 'Indonesia'
        }
      ],
      passengerCount: 1,
      totalBasePrice: 1250000,
      tax: 125000,
      serviceFee: 50000,
      totalPrice: 1425000,
      paymentMethod: 'Kartu Kredit'
    };
    
    setBooking(bookingData);
    setLoading(false);
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat konfirmasi booking...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Booking tidak ditemukan</p>
          <button 
            onClick={() => router.push('/')}
            className="mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => router.push('/')}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Kembali ke Beranda
            </button>
            <h1 className="text-xl font-bold text-gray-800">Konfirmasi Booking</h1>
            <div className="w-32"></div> {/* Spacer untuk centering */}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <CheckCircleIcon />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Booking Berhasil!</h2>
          <p className="text-gray-600 mb-4">
            Terima kasih telah memesan tiket melalui TripGO. Detail booking Anda telah dikirim ke email.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 inline-block">
            <p className="text-blue-800 font-semibold">
              Booking ID: <span className="font-mono">{booking.id}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <FlightDetails booking={booking} />
            <PassengerDetails passengers={booking.passengers} />
            <PaymentSummary booking={booking} />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <ActionButtons bookingId={booking.id} />
          </div>
        </div>

        {/* Important Notes */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-yellow-800 mb-3">Penting untuk Diingat:</h3>
          <ul className="space-y-2 text-yellow-700">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Pastikan Anda tiba di bandara minimal 2 jam sebelum keberangkatan</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Bawa dokumen identitas yang valid (KTP/Paspor)</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Check-in online tersedia 24 jam sebelum keberangkatan</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Untuk pertanyaan atau bantuan, hubungi customer service kami</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// --- Halaman Utama Konfirmasi Booking ---
export default function BookingConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat konfirmasi booking...</p>
        </div>
      </div>
    }>
      <BookingConfirmationContent />
    </Suspense>
  );
}
