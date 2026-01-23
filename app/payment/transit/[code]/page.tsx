'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TransitBookingResponse } from '@/app/types';

const TransitPaymentPage = () => {
  const params = useParams();
  const router = useRouter();
  const bookingCode = params.code as string;
  
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bookingCode) {
      fetchBookingDetails();
    }
  }, [bookingCode]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/bookings/transit/${bookingCode}`);
      
      if (!response.ok) {
        throw new Error('Booking not found');
      }
      
      const data = await response.json();
      setBooking(data.booking);
    } catch (err: any) {
      setError(err.message || 'Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    try {
      setProcessing(true);
      
      const response = await fetch('/api/payments/transit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingCode,
          paymentMethod: 'bank_transfer'
        })
      });
      
      const data = await response.json();
      
      if (data.success && data.payment_url) {
        window.location.href = data.payment_url;
      } else {
        throw new Error(data.error || 'Payment failed');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Booking Summary */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Pembayaran Transit Multi-Segmen
          </h2>
          
          {booking && (
            <>
              {/* Segment Timeline */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">
                  Detail Perjalanan
                </h3>
                <div className="space-y-4">
                  {booking.segments?.map((segment: any, index: number) => (
                    <div key={segment.id} className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-800">
                            Segmen {index + 1}: {segment.origin} → {segment.destination}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {segment.departure_time} - {segment.arrival_time}
                          </p>
                          <p className="text-sm text-gray-500">
                            Kereta: {segment.train_name} • Kelas: {segment.train_class}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-800">
                            Rp {segment.price?.toLocaleString('id-ID')}
                          </div>
                          <div className="text-sm text-gray-500">
                            {segment.seat_count} kursi
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Payment Summary */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">
                  Ringkasan Pembayaran
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Tiket:</span>
                    <span>Rp {booking.base_amount?.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Biaya Transit:</span>
                    <span>+Rp {booking.transit_fees?.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Diskon Multi-Segmen:</span>
                    <span className="text-green-600">
                      -Rp {booking.transit_discount?.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Total Pembayaran:</span>
                    <span className="text-orange-600">
                      Rp {booking.total_amount?.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* Payment Button */}
        <div className="text-center">
          <button
            onClick={handlePayment}
            disabled={processing}
            className="px-8 py-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? 'Memproses...' : 'Bayar Sekarang'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransitPaymentPage;