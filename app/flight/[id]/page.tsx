'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import SeatSelection from '../../components/SeatSelection';

// --- Komponen Ikon ---
const PlaneIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const CreditCardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

// --- Komponen Informasi Penerbangan ---
const FlightInfoCard = ({ flight }: { flight: any }) => (
  <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-3">
        <img 
          src={`/images/airline-logo-${flight.airline.toLowerCase()}.png`} 
          alt={`${flight.airline} logo`} 
          className="w-12 h-12 object-contain"
        />
        <div>
          <h3 className="font-bold text-lg text-gray-800">{flight.airline}</h3>
          <p className="text-sm text-gray-500">{flight.flightNumber}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-2xl font-bold text-orange-500">Rp {flight.price.toLocaleString('id-ID')}</p>
        <p className="text-sm text-gray-500">per orang</p>
      </div>
    </div>

    {/* Route Information */}
    <div className="flex items-center justify-between py-4 border-t border-b border-gray-200">
      <div className="text-center">
        <p className="text-2xl font-bold text-gray-800">{flight.departureTime}</p>
        <p className="text-sm text-gray-500">{flight.originCode}</p>
        <p className="text-xs text-gray-400">{flight.origin}</p>
      </div>
      
      <div className="flex-1 mx-6">
        <div className="flex items-center justify-center">
          <div className="flex-1 h-px bg-gray-300"></div>
          <div className="mx-3 flex flex-col items-center">
            <PlaneIcon />
            <p className="text-xs text-gray-500 mt-1">{flight.duration}</p>
          </div>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">Langsung</p>
      </div>
      
      <div className="text-center">
        <p className="text-2xl font-bold text-gray-800">{flight.arrivalTime}</p>
        <p className="text-sm text-gray-500">{flight.destinationCode}</p>
        <p className="text-xs text-gray-400">{flight.destination}</p>
      </div>
    </div>

    {/* Flight Details */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
      <div className="flex items-center space-x-2">
        <ClockIcon />
        <div>
          <p className="text-sm font-medium text-gray-800">Durasi</p>
          <p className="text-xs text-gray-500">{flight.duration}</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <PlaneIcon />
        <div>
          <p className="text-sm font-medium text-gray-800">Tipe Pesawat</p>
          <p className="text-xs text-gray-500">{flight.aircraft}</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <CheckIcon />
        <div>
          <p className="text-sm font-medium text-gray-800">Kelas</p>
          <p className="text-xs text-gray-500">{flight.class}</p>
        </div>
      </div>
    </div>
  </div>
);

// --- Komponen Form Data Penumpang ---
const PassengerForm = ({ passengerCount, onPassengerDataChange }: { passengerCount: number, onPassengerDataChange: (data: any[]) => void }) => {
  const [passengers, setPassengers] = useState<any[]>([]);

  useEffect(() => {
    const initialPassengers = Array.from({ length: passengerCount }, (_, index) => ({
      id: index + 1,
      title: '',
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      passportNumber: '',
      nationality: 'Indonesia'
    }));
    setPassengers(initialPassengers);
  }, [passengerCount]);

  const handlePassengerChange = (index: number, field: string, value: string) => {
    const updatedPassengers = passengers.map((passenger, i) => 
      i === index ? { ...passenger, [field]: value } : passenger
    );
    setPassengers(updatedPassengers);
    onPassengerDataChange(updatedPassengers);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
        <UserIcon />
        <span className="ml-2">Data Penumpang</span>
      </h3>
      
      {passengers.map((passenger, index) => (
        <div key={passenger.id} className="border border-gray-200 rounded-lg p-4 mb-4">
          <h4 className="font-semibold text-gray-800 mb-3">Penumpang {index + 1}</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gelar</label>
              <select
                value={passenger.title}
                onChange={(e) => handlePassengerChange(index, 'title', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Pilih Gelar</option>
                <option value="Mr">Mr</option>
                <option value="Mrs">Mrs</option>
                <option value="Ms">Ms</option>
                <option value="Dr">Dr</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Depan</label>
              <input
                type="text"
                value={passenger.firstName}
                onChange={(e) => handlePassengerChange(index, 'firstName', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nama depan"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Belakang</label>
              <input
                type="text"
                value={passenger.lastName}
                onChange={(e) => handlePassengerChange(index, 'lastName', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nama belakang"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Lahir</label>
              <input
                type="date"
                value={passenger.dateOfBirth}
                onChange={(e) => handlePassengerChange(index, 'dateOfBirth', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Paspor</label>
              <input
                type="text"
                value={passenger.passportNumber}
                onChange={(e) => handlePassengerChange(index, 'passportNumber', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nomor paspor"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kewarganegaraan</label>
              <select
                value={passenger.nationality}
                onChange={(e) => handlePassengerChange(index, 'nationality', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Indonesia">Indonesia</option>
                <option value="Malaysia">Malaysia</option>
                <option value="Singapore">Singapore</option>
                <option value="Thailand">Thailand</option>
                <option value="Philippines">Philippines</option>
              </select>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// --- Komponen Pilihan Pembayaran ---
const PaymentSection = ({ onPaymentMethodChange }: { onPaymentMethodChange: (method: string) => void }) => {
  const [selectedMethod, setSelectedMethod] = useState('');

  const paymentMethods = [
    {
      id: 'credit-card',
      name: 'Kartu Kredit/Debit',
      icon: <CreditCardIcon />,
      description: 'Visa, Mastercard, JCB'
    },
    {
      id: 'bank-transfer',
      name: 'Transfer Bank',
      icon: <CreditCardIcon />,
      description: 'BCA, Mandiri, BNI, BRI'
    },
    {
      id: 'e-wallet',
      name: 'E-Wallet',
      icon: <CreditCardIcon />,
      description: 'GoPay, OVO, DANA, LinkAja'
    }
  ];

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
    onPaymentMethodChange(methodId);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
        <CreditCardIcon />
        <span className="ml-2">Metode Pembayaran</span>
      </h3>
      
      <div className="space-y-3">
        {paymentMethods.map((method) => (
          <div
            key={method.id}
            onClick={() => handleMethodSelect(method.id)}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
              selectedMethod === method.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${
                selectedMethod === method.id ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
              }`}>
                {method.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800">{method.name}</h4>
                <p className="text-sm text-gray-500">{method.description}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 ${
                selectedMethod === method.id ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
              }`}>
                {selectedMethod === method.id && (
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Komponen Ringkasan Harga ---
const PriceSummary = ({ flight, passengerCount, selectedSeats }: { flight: any, passengerCount: number, selectedSeats: any[] }) => {
  const router = useRouter();
  const basePrice = flight.price;
  const totalBasePrice = basePrice * passengerCount;
  const seatFees = selectedSeats.reduce((sum, seat) => sum + (seat.price || 0), 0);
  const tax = (totalBasePrice + seatFees) * 0.1; // 10% tax
  const serviceFee = 50000; // Service fee
  const totalPrice = totalBasePrice + seatFees + tax + serviceFee;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Ringkasan Harga</h3>
      
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-600">Harga Tiket ({passengerCount} orang)</span>
          <span className="font-medium">Rp {totalBasePrice.toLocaleString('id-ID')}</span>
        </div>
        {seatFees > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-600">Biaya Kursi ({selectedSeats.length} kursi)</span>
            <span className="font-medium">Rp {seatFees.toLocaleString('id-ID')}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-gray-600">Pajak & Fee</span>
          <span className="font-medium">Rp {tax.toLocaleString('id-ID')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Biaya Layanan</span>
          <span className="font-medium">Rp {serviceFee.toLocaleString('id-ID')}</span>
        </div>
        <hr className="border-gray-200" />
        <div className="flex justify-between text-lg font-bold">
          <span>Total</span>
          <span className="text-orange-500">Rp {totalPrice.toLocaleString('id-ID')}</span>
        </div>
      </div>
      
      <button 
        onClick={() => {
          // Simulasi proses pembayaran dan redirect ke konfirmasi
          const bookingId = 'TRP' + Math.random().toString(36).substr(2, 9).toUpperCase();
          router.push(`/booking/confirmation?id=${bookingId}`);
        }}
        className="w-full mt-6 bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-6 rounded-lg transition-colors duration-300"
      >
        Lanjutkan Pembayaran
      </button>
    </div>
  );
};

// --- Halaman Utama Detail Penerbangan ---
export default function FlightDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [flight, setFlight] = useState<any>(null);
  const [passengerCount, setPassengerCount] = useState(1);
  const [passengerData, setPassengerData] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [selectedSeats, setSelectedSeats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulasi data penerbangan berdasarkan ID
    const flightData = {
      id: params.id,
      airline: 'Garuda',
      flightNumber: 'GA-123',
      departureTime: '07:30',
      arrivalTime: '09:00',
      duration: '1j 30m',
      originCode: 'CGK',
      destinationCode: 'DPS',
      origin: 'Jakarta',
      destination: 'Bali',
      aircraft: 'Boeing 737-800',
      class: 'Ekonomi',
      price: 1250000
    };
    
    setFlight(flightData);
    setLoading(false);
  }, [params.id]);

  const handlePassengerDataChange = (data: any[]) => {
    setPassengerData(data);
  };

  const handlePaymentMethodChange = (method: string) => {
    setPaymentMethod(method);
  };

  const handleSeatSelect = (seats: any[]) => {
    setSelectedSeats(seats);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat detail penerbangan...</p>
        </div>
      </div>
    );
  }

  if (!flight) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Penerbangan tidak ditemukan</p>
          <button 
            onClick={() => router.back()}
            className="mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Kembali
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
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Kembali
            </button>
            <h1 className="text-xl font-bold text-gray-800">Detail Penerbangan</h1>
            <div className="w-20"></div> {/* Spacer untuk centering */}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <FlightInfoCard flight={flight} />
            
            <PassengerForm 
              passengerCount={passengerCount}
              onPassengerDataChange={handlePassengerDataChange}
            />
            
            <PaymentSection onPaymentMethodChange={handlePaymentMethodChange} />
            
            {/* Seat Selection */}
            <SeatSelection 
              flightId={flight.id}
              onSeatSelect={handleSeatSelect}
              selectedSeats={selectedSeats}
              passengerCount={passengerCount}
            />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <PriceSummary flight={flight} passengerCount={passengerCount} selectedSeats={selectedSeats} />
          </div>
        </div>
      </div>
    </div>
  );
}
