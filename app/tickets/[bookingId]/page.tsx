// app/tickets/[bookingCode]/page.tsx
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/app/lib/supabaseClient';

function TicketContent() {
  const params = useParams();
  const router = useRouter();
  const bookingCode = params?.bookingCode as string;
  
  const [ticket, setTicket] = useState<any>(null);
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTicket = async () => {
      if (!bookingCode) {
        setError('Booking code tidak valid');
        setLoading(false);
        return;
      }

      try {
        // 1. Fetch ticket dari database
        const { data: ticketData, error: ticketError } = await supabase
          .from('tickets')
          .select('*')
          .eq('booking_id', bookingCode)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (ticketError && ticketError.code !== 'PGRST116') {
          throw ticketError;
        }

        // 2. Fetch booking data
        const { data: bookingData, error: bookingError } = await supabase
          .from('bookings_kereta')
          .select(`
            *,
            schedule:jadwal_kereta(
              travel_date,
              kereta:train_id(id, name, code),
              rute_kereta!rute_kereta_schedule_id_fkey(
                departure_time,
                arrival_time,
                origin_station:stasiun!rute_kereta_origin_station_id_fkey(name, city),
                destination_station:stasiun!rute_kereta_destination_station_id_fkey(name, city)
              )
            ),
            penumpang:penumpang!penumpang_booking_id_fkey(
              id,
              nama,
              email,
              nik
            )
          `)
          .eq('booking_code', bookingCode)
          .single();

        if (bookingError) throw bookingError;

        setTicket(ticketData);
        setBooking(bookingData);

      } catch (err: any) {
        console.error('Error loading ticket:', err);
        setError(err.message || 'Gagal memuat data tiket');
      } finally {
        setLoading(false);
      }
    };

    loadTicket();
  }, [bookingCode]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/tickets/generate-train-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: booking?.id
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ticket-${bookingCode}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        alert('Gagal mengunduh tiket. Silakan coba lagi.');
      }
    } catch (error) {
      console.error('Error downloading ticket:', error);
      alert('Gagal mengunduh tiket.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FD7E14] mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat e-ticket...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-700 mb-2">Tiket Tidak Ditemukan</h2>
          <p className="text-gray-500 mb-6">{error || 'Data tiket tidak tersedia'}</p>
          <Link
            href="/my-bookings"
            className="inline-block px-6 py-3 bg-[#FD7E14] text-white font-semibold rounded-lg hover:bg-[#E06700] transition-colors"
          >
            Kembali ke My Bookings
          </Link>
        </div>
      </div>
    );
  }

  const rute = booking.schedule?.rute_kereta?.[0];
  const formatTime = (time: string) => time ? time.split(':').slice(0, 2).join(':') : '--:--';

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">E-Ticket</h1>
            <p className="text-gray-600 mt-1">Tiket perjalanan kereta api Anda</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cetak
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-[#FD7E14] text-white rounded-lg hover:bg-[#E06700]"
            >
              Download PDF
            </button>
          </div>
        </div>

        {/* Ticket Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header Ticket */}
          <div className="bg-gradient-to-r from-[#FD7E14] to-[#E06700] text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">PT KERETA API INDONESIA</h2>
                <p className="text-orange-100">E-Ticket Valid untuk Perjalanan</p>
              </div>
              {ticket && (
                <div className="text-right">
                  <p className="text-sm text-orange-100 mb-1">Ticket Number</p>
                  <p className="text-xl font-bold">{ticket.ticket_number}</p>
                </div>
              )}
            </div>
          </div>

          {/* Ticket Content */}
          <div className="p-6">
            {/* Booking Info */}
            <div className="mb-6 pb-6 border-b">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Kode Booking</p>
                  <p className="font-bold text-lg">{booking.booking_code}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                    {booking.status === 'confirmed' || booking.status === 'paid' ? 'AKTIF' : booking.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Train Info */}
            {booking.schedule && (
              <div className="mb-6 pb-6 border-b">
                <h3 className="font-bold text-gray-800 mb-4">Informasi Perjalanan</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-bold text-lg">{booking.schedule.kereta?.name || 'Kereta Api'}</p>
                      <p className="text-sm text-gray-600">{booking.schedule.kereta?.code || ''}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Tanggal</p>
                      <p className="font-semibold">
                        {new Date(booking.schedule.travel_date).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  {rute && (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-xl">{formatTime(rute.departure_time)}</p>
                        <p className="text-gray-700">{rute.origin_station?.name}</p>
                        <p className="text-sm text-gray-600">{rute.origin_station?.city}</p>
                      </div>
                      
                      <div className="text-center mx-4">
                        <div className="flex items-center">
                          <div className="h-px w-12 bg-gray-300"></div>
                          <svg className="w-8 h-8 text-gray-400 mx-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            <path fillRule="evenodd" d="M4.293 15.707a1 1 0 010-1.414L8.586 10 4.293 5.707a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                          <div className="h-px w-12 bg-gray-300"></div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-bold text-xl">{formatTime(rute.arrival_time)}</p>
                        <p className="text-gray-700">{rute.destination_station?.name}</p>
                        <p className="text-sm text-gray-600">{rute.destination_station?.city}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Passengers */}
            {booking.penumpang && booking.penumpang.length > 0 && (
              <div className="mb-6 pb-6 border-b">
                <h3 className="font-bold text-gray-800 mb-4">Data Penumpang</h3>
                <div className="space-y-3">
                  {booking.penumpang.map((passenger: any, index: number) => (
                    <div key={passenger.id} className="bg-gray-50 rounded-lg p-4">
                      <p className="font-semibold text-gray-700 mb-2">Penumpang {index + 1}</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Nama</p>
                          <p className="font-medium">{passenger.nama}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">NIK</p>
                          <p className="font-medium">{passenger.nik || '-'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* QR Code */}
            {ticket && ticket.qr_code && (
              <div className="text-center">
                <h3 className="font-bold text-gray-800 mb-4">Kode Boarding</h3>
                <div className="bg-gray-50 rounded-lg p-6 inline-block">
                  <img 
                    src={ticket.qr_code} 
                    alt="QR Code" 
                    className="w-48 h-48 mx-auto mb-4 border-2 border-gray-300 rounded-lg"
                  />
                  <p className="text-sm text-gray-600 mb-1">Pindai QR code saat check-in di stasiun</p>
                  <p className="text-xs text-gray-500">Ticket: {ticket.ticket_number}</p>
                </div>
              </div>
            )}

            {/* Payment Info */}
            <div className="mt-6 pt-6 border-t">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Total Pembayaran</p>
                  <p className="text-2xl font-bold text-[#FD7E14]">
                    Rp {booking.total_amount.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Penumpang</p>
                  <p className="font-semibold">{booking.passenger_count || booking.penumpang?.length || 1} orang</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h4 className="font-bold text-blue-800 mb-3">Informasi Penting</h4>
          <ul className="text-sm text-blue-700 space-y-2">
            <li>• Datang minimal 1 jam sebelum keberangkatan untuk check-in</li>
            <li>• Bawa KTP asli dan e-ticket ini (cetak atau tampilkan di smartphone)</li>
            <li>• Check-in online tersedia 2 jam sebelum keberangkatan</li>
            <li>• QR code harus dapat dipindai dengan jelas</li>
            <li>• Untuk bantuan hubungi customer service di 1500-123</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <Link
            href="/my-bookings"
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 text-center"
          >
            Kembali ke My Bookings
          </Link>
          <Link
            href="/"
            className="flex-1 px-6 py-3 bg-[#FD7E14] text-white font-semibold rounded-lg hover:bg-[#E06700] text-center"
          >
            Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function TicketPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FD7E14] mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    }>
      <TicketContent />
    </Suspense>
  );
}

