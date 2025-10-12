'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ETicket from '@/app/components/ETicket';
import { useAuth } from '@/app/contexts/AuthContext';

// Loading component
function TicketLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Memuat e-ticket...</p>
      </div>
    </div>
  );
}

// Main content component
function TicketContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [bookingId, setBookingId] = useState<string>('');

  useEffect(() => {
    if (params?.bookingId) {
      setBookingId(params.bookingId as string);
    }
  }, [params]);

  const handleDownload = () => {
    // Implement download functionality
    console.log('Downloading e-ticket...');
    // You can use libraries like html2canvas or jsPDF to generate PDF
    alert('Fitur download akan segera tersedia!');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'E-Ticket TripGO',
        text: 'Lihat e-ticket saya di TripGO',
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link e-ticket telah disalin ke clipboard!');
    }
  };

  if (!bookingId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Booking ID Tidak Valid</h1>
          <p className="text-gray-600 mb-6">Booking ID yang Anda masukkan tidak valid.</p>
          <Link 
            href="/dashboard" 
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">E-Ticket</h1>
              <p className="text-gray-600 mt-1">Tiket perjalanan Anda dengan update real-time</p>
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <Link 
                  href="/dashboard" 
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Dashboard
                </Link>
              )}
              <Link 
                href="/" 
                className="text-gray-600 hover:text-gray-700 font-medium"
              >
                Beranda
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <ETicket
          bookingId={bookingId}
          onDownload={handleDownload}
          onShare={handleShare}
          showRealtimeUpdates={true}
        />

        {/* Additional Information */}
        <div className="max-w-4xl mx-auto mt-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Informasi E-Ticket</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Cara Menggunakan E-Ticket</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Tunjukkan QR code di bandara untuk check-in</li>
                  <li>• Simpan e-ticket di ponsel Anda</li>
                  <li>• Bawa dokumen identitas yang valid</li>
                  <li>• Datang minimal 2 jam sebelum keberangkatan</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Update Real-time</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Status penerbangan akan diperbarui otomatis</li>
                  <li>• Notifikasi delay atau perubahan jadwal</li>
                  <li>• Update gate dan terminal secara real-time</li>
                  <li>• Informasi cuaca dan kondisi penerbangan</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Support Information */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">Butuh Bantuan?</h3>
            <p className="text-blue-700 mb-4">
              Tim customer service kami siap membantu Anda 24/7 untuk pertanyaan tentang e-ticket.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a 
                href="mailto:support@tripgo.com" 
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-center"
              >
                📧 Email Support
              </a>
              <a 
                href="tel:+6281234567890" 
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-center"
              >
                📞 Telepon Support
              </a>
              <a 
                href="https://wa.me/6281234567890" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-center"
              >
                💬 WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main component with Suspense
export default function TicketPage() {
  return (
    <Suspense fallback={<TicketLoading />}>
      <TicketContent />
    </Suspense>
  );
}
