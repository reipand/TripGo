'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import SeatMap from '../../components/SeatMap';
import PaymentGateway from '../../components/PaymentGateway';
import ETicket from '../../components/ETicket';
import BookingProtection from '../../components/BookingProtection';

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
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    const initialPassengers = Array.from({ length: passengerCount }, (_, index) => ({
      id: index + 1,
      title: 'Mr',
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      passportNumber: '',
      nationality: 'Indonesia',
      phoneNumber: '',
      email: ''
    }));
    setPassengers(initialPassengers);
  }, [passengerCount]);

  const handlePassengerChange = (index: number, field: string, value: string) => {
    const updatedPassengers = passengers.map((passenger, i) => 
      i === index ? { ...passenger, [field]: value } : passenger
    );
    setPassengers(updatedPassengers);
    onPassengerDataChange(updatedPassengers);
    
    // Clear error when user starts typing
    const errorKey = `${index}-${field}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    passengers.forEach((passenger, index) => {
      if (!passenger.firstName.trim()) {
        newErrors[`${index}-firstName`] = 'Nama depan wajib diisi';
      }
      if (!passenger.lastName.trim()) {
        newErrors[`${index}-lastName`] = 'Nama belakang wajib diisi';
      }
      if (!passenger.dateOfBirth) {
        newErrors[`${index}-dateOfBirth`] = 'Tanggal lahir wajib diisi';
      }
      if (!passenger.passportNumber.trim()) {
        newErrors[`${index}-passportNumber`] = 'Nomor paspor wajib diisi';
      }
      if (!passenger.phoneNumber.trim()) {
        newErrors[`${index}-phoneNumber`] = 'Nomor telepon wajib diisi';
      }
      if (!passenger.email.trim()) {
        newErrors[`${index}-email`] = 'Email wajib diisi';
      } else if (!/\S+@\S+\.\S+/.test(passenger.email)) {
        newErrors[`${index}-email`] = 'Format email tidak valid';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800 flex items-center">
          <UserIcon />
          <span className="ml-2">Data Penumpang</span>
        </h3>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {passengerCount} Penumpang
        </span>
      </div>
      
      {passengers.map((passenger, index) => (
        <div key={passenger.id} className="border border-gray-200 rounded-xl p-6 mb-6 bg-gray-50/50">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center mr-3">
              <span className="text-sm font-bold">{index + 1}</span>
            </div>
            <h4 className="font-semibold text-gray-800">Penumpang {index + 1}</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gelar *</label>
              <select
                value={passenger.title}
                onChange={(e) => handlePassengerChange(index, 'title', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="Mr">Mr</option>
                <option value="Mrs">Mrs</option>
                <option value="Ms">Ms</option>
                <option value="Dr">Dr</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nama Depan *</label>
              <input
                type="text"
                value={passenger.firstName}
                onChange={(e) => handlePassengerChange(index, 'firstName', e.target.value)}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors[`${index}-firstName`] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Masukkan nama depan"
              />
              {errors[`${index}-firstName`] && (
                <p className="text-red-500 text-xs mt-1">{errors[`${index}-firstName`]}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nama Belakang *</label>
              <input
                type="text"
                value={passenger.lastName}
                onChange={(e) => handlePassengerChange(index, 'lastName', e.target.value)}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors[`${index}-lastName`] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Masukkan nama belakang"
              />
              {errors[`${index}-lastName`] && (
                <p className="text-red-500 text-xs mt-1">{errors[`${index}-lastName`]}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Lahir *</label>
              <input
                type="date"
                value={passenger.dateOfBirth}
                onChange={(e) => handlePassengerChange(index, 'dateOfBirth', e.target.value)}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors[`${index}-dateOfBirth`] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                max={new Date().toISOString().split('T')[0]}
              />
              {errors[`${index}-dateOfBirth`] && (
                <p className="text-red-500 text-xs mt-1">{errors[`${index}-dateOfBirth`]}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nomor Paspor *</label>
              <input
                type="text"
                value={passenger.passportNumber}
                onChange={(e) => handlePassengerChange(index, 'passportNumber', e.target.value)}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors[`${index}-passportNumber`] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Masukkan nomor paspor"
                style={{ textTransform: 'uppercase' }}
              />
              {errors[`${index}-passportNumber`] && (
                <p className="text-red-500 text-xs mt-1">{errors[`${index}-passportNumber`]}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Kewarganegaraan *</label>
              <select
                value={passenger.nationality}
                onChange={(e) => handlePassengerChange(index, 'nationality', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="Indonesia">Indonesia</option>
                <option value="Malaysia">Malaysia</option>
                <option value="Singapore">Singapore</option>
                <option value="Thailand">Thailand</option>
                <option value="Philippines">Philippines</option>
                <option value="Vietnam">Vietnam</option>
                <option value="Brunei">Brunei</option>
                <option value="Myanmar">Myanmar</option>
                <option value="Cambodia">Cambodia</option>
                <option value="Laos">Laos</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nomor Telepon *</label>
              <input
                type="tel"
                value={passenger.phoneNumber}
                onChange={(e) => handlePassengerChange(index, 'phoneNumber', e.target.value)}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors[`${index}-phoneNumber`] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="08xxxxxxxxxx"
              />
              {errors[`${index}-phoneNumber`] && (
                <p className="text-red-500 text-xs mt-1">{errors[`${index}-phoneNumber`]}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
              <input
                type="email"
                value={passenger.email}
                onChange={(e) => handlePassengerChange(index, 'email', e.target.value)}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors[`${index}-email`] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="email@example.com"
              />
              {errors[`${index}-email`] && (
                <p className="text-red-500 text-xs mt-1">{errors[`${index}-email`]}</p>
              )}
            </div>
          </div>
        </div>
      ))}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-start space-x-3">
          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-xs">i</span>
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-800 mb-1">Informasi Penting</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Pastikan data penumpang sesuai dengan dokumen perjalanan</li>
              <li>• Nomor paspor harus valid dan tidak akan berubah</li>
              <li>• Email akan digunakan untuk konfirmasi dan e-ticket</li>
              <li>• Nomor telepon untuk notifikasi penting</li>
            </ul>
          </div>
        </div>
      </div>
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
  const [currentStep, setCurrentStep] = useState<'details' | 'seats' | 'payment' | 'ticket'>('details');
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<any>(null);

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

  const handleSeatSelect = useCallback((seats: any[]) => {
    setSelectedSeats(seats);
  }, []);

  const handlePaymentSuccess = (result: any) => {
    console.log('Payment successful:', result);
    const newBookingId = `TRP${Date.now()}`;
    setBookingId(newBookingId);
    setCurrentStep('ticket');
    
    // Prepare payment data for e-ticket
    setPaymentData({
      orderId: result.order_id || newBookingId,
      amount: flight.price * passengerCount + selectedSeats.reduce((sum, seat) => sum + seat.price, 0),
      currency: 'IDR',
      items: [
        {
          id: flight.id,
          price: flight.price,
          quantity: passengerCount,
          name: `${flight.airline} ${flight.flightNumber} - ${flight.origin} ke ${flight.destination}`
        },
        ...selectedSeats.map(seat => ({
          id: seat.id,
          price: seat.price,
          quantity: 1,
          name: `Kursi ${seat.id} - ${seat.type}`
        }))
      ],
      customerDetails: {
        first_name: passengerData[0]?.firstName || '',
        last_name: passengerData[0]?.lastName || '',
        email: passengerData[0]?.email || '',
        phone: passengerData[0]?.phoneNumber || ''
      },
      billingAddress: {
        first_name: passengerData[0]?.firstName || '',
        last_name: passengerData[0]?.lastName || '',
        address: 'Jakarta, Indonesia',
        city: 'Jakarta',
        postal_code: '12345',
        phone: passengerData[0]?.phoneNumber || ''
      }
    });
  };

  const handlePaymentError = (error: any) => {
    console.error('Payment error:', error);
    alert('Pembayaran gagal. Silakan coba lagi.');
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
        {/* Step Navigation */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-8">
            {[
              { key: 'details', label: 'Detail Penerbangan', icon: '✈️' },
              { key: 'seats', label: 'Pilih Kursi', icon: '🪑' },
              { key: 'payment', label: 'Pembayaran', icon: '💳' },
              { key: 'ticket', label: 'E-Ticket', icon: '🎫' }
            ].map((step, index) => (
              <div key={step.key} className="flex items-center">
                <button
                  onClick={() => setCurrentStep(step.key as any)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    currentStep === step.key
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  <span>{step.icon}</span>
                  <span className="hidden sm:block">{step.label}</span>
                </button>
                {index < 3 && (
                  <div className="w-8 h-0.5 bg-gray-300 mx-2"></div>
                )}
              </div>
            ))}
          </div>
        </div>

            {/* Content based on current step */}
            {currentStep === 'details' && (
              <BookingProtection>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                    <FlightInfoCard flight={flight} />
                    <PassengerForm 
                      passengerCount={passengerCount}
                      onPassengerDataChange={handlePassengerDataChange}
                    />
                  </div>
                  <div className="lg:col-span-1">
                    <PriceSummary flight={flight} passengerCount={passengerCount} selectedSeats={selectedSeats} />
                  </div>
                </div>
              </BookingProtection>
            )}

        {currentStep === 'seats' && (
          <BookingProtection>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <SeatMap 
                  flightId={flight.id}
                  onSeatSelection={handleSeatSelect}
                  selectedSeats={selectedSeats}
                  maxSeats={passengerCount}
                />
              </div>
              <div className="lg:col-span-1">
                <PriceSummary flight={flight} passengerCount={passengerCount} selectedSeats={selectedSeats} />
              </div>
            </div>
          </BookingProtection>
        )}

        {currentStep === 'payment' && paymentData && (
          <BookingProtection>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <PaymentGateway 
                  paymentData={paymentData}
                  onPaymentSuccess={handlePaymentSuccess}
                  onPaymentError={handlePaymentError}
                />
              </div>
              <div className="lg:col-span-1">
                <PriceSummary flight={flight} passengerCount={passengerCount} selectedSeats={selectedSeats} />
              </div>
            </div>
          </BookingProtection>
        )}

        {currentStep === 'ticket' && bookingId && (
          <ETicket 
            bookingId={bookingId}
            onDownload={() => console.log('Download e-ticket')}
            onShare={() => console.log('Share e-ticket')}
          />
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            onClick={() => {
              if (currentStep === 'seats') setCurrentStep('details');
              if (currentStep === 'payment') setCurrentStep('seats');
            }}
            className={`px-6 py-2 rounded-lg transition-colors ${
              currentStep === 'details' 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gray-500 text-white hover:bg-gray-600'
            }`}
            disabled={currentStep === 'details'}
          >
            Sebelumnya
          </button>
          
          <button
            onClick={() => {
              if (currentStep === 'details') setCurrentStep('seats');
              if (currentStep === 'seats') {
                // Prepare payment data
                setPaymentData({
                  orderId: `TRP${Date.now()}`,
                  amount: flight.price * passengerCount + selectedSeats.reduce((sum, seat) => sum + seat.price, 0),
                  currency: 'IDR',
                  items: [
                    {
                      id: flight.id,
                      price: flight.price,
                      quantity: passengerCount,
                      name: `${flight.airline} ${flight.flightNumber} - ${flight.origin} ke ${flight.destination}`
                    },
                    ...selectedSeats.map(seat => ({
                      id: seat.id,
                      price: seat.price,
                      quantity: 1,
                      name: `Kursi ${seat.id} - ${seat.type}`
                    }))
                  ],
                  customerDetails: {
                    first_name: passengerData[0]?.firstName || '',
                    last_name: passengerData[0]?.lastName || '',
                    email: passengerData[0]?.email || '',
                    phone: passengerData[0]?.phoneNumber || ''
                  },
                  billingAddress: {
                    first_name: passengerData[0]?.firstName || '',
                    last_name: passengerData[0]?.lastName || '',
                    address: 'Jakarta, Indonesia',
                    city: 'Jakarta',
                    postal_code: '12345',
                    phone: passengerData[0]?.phoneNumber || ''
                  }
                });
                setCurrentStep('payment');
              }
            }}
            className={`px-6 py-2 rounded-lg transition-colors ${
              currentStep === 'ticket'
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
            disabled={currentStep === 'ticket'}
          >
            {currentStep === 'details' ? 'Pilih Kursi' : 
             currentStep === 'seats' ? 'Lanjut Pembayaran' : 'Selesai'}
          </button>
        </div>
      </div>
    </div>
  );
}
