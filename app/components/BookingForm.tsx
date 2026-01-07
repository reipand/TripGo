// components/BookingForm.tsx
'use client';


import { useState } from 'react';

interface BookingFormProps {
  scheduleId: string;
  price: number;
  availableSeats: number;
  classType: string;
  onBookingSuccess: (bookingData: any) => void;
}

export default function BookingForm({
  scheduleId,
  price,
  availableSeats,
  classType,
  onBookingSuccess
}: BookingFormProps) {
  const [formData, setFormData] = useState({
    passenger_name: '',
    passenger_email: '',
    passenger_phone: '',
    passenger_ktp: '',
    seat_count: 1
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schedule_id: scheduleId,
          ...formData,
          class_type: classType,
          total_price: price * formData.seat_count
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Booking gagal');
      }

      onBookingSuccess(data.data);
      
      // Redirect ke halaman pembayaran
      window.location.href = `/payment/${data.booking_reference}`;

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label className="block mb-1">Nama Lengkap</label>
        <input
          type="text"
          name="passenger_name"
          value={formData.passenger_name}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
      </div>

      <div>
        <label className="block mb-1">Email</label>
        <input
          type="email"
          name="passenger_email"
          value={formData.passenger_email}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
      </div>

      <div>
        <label className="block mb-1">Nomor HP</label>
        <input
          type="tel"
          name="passenger_phone"
          value={formData.passenger_phone}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
      </div>

      <div>
        <label className="block mb-1">Nomor KTP</label>
        <input
          type="text"
          name="passenger_ktp"
          value={formData.passenger_ktp}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
      </div>

      <div>
        <label className="block mb-1">Jumlah Kursi</label>
        <input
          type="number"
          name="seat_count"
          min="1"
          max={availableSeats}
          value={formData.seat_count}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
        <p className="text-sm text-gray-600 mt-1">
          Tersedia: {availableSeats} kursi
        </p>
      </div>

      <div className="border-t pt-4">
        <div className="flex justify-between mb-2">
          <span>Harga per kursi:</span>
          <span>Rp {price.toLocaleString()}</span>
        </div>
        <div className="flex justify-between font-bold text-lg">
          <span>Total:</span>
          <span>Rp {(price * formData.seat_count).toLocaleString()}</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`w-full py-3 rounded font-medium ${
          loading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {loading ? 'Memproses...' : 'Lanjutkan ke Pembayaran'}
      </button>
    </form>
  );
}