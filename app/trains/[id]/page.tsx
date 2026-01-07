'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';

// --- Tipe Data Standar ---
interface Passenger {
  id: number;
  title: string;
  fullName: string;
  idNumber: string;
  phoneNumber: string;
  email: string;
  seatNumber?: string;
  passengerType?: 'Dewasa' | 'Anak' | 'Bayi';
}

interface Train {
  id: string;
  trainId: string;
  trainNumber: string;
  trainName: string;
  trainClass: 'Eksekutif' | 'Bisnis' | 'Ekonomi';
  trainType: string;
  departureTime: string;
  arrivalTime: string;
  departureDate: string;
  arrivalDate: string;
  duration: string;
  originStation: string;
  origin: string;
  originCity: string;
  destinationStation: string;
  destination: string;
  destinationCity: string;
  price: number;
  insurance: number;
  availableSeats: number;
  seatType: string;
  routeType: string;
  facilities?: string[];
}

// --- Schema Validasi dengan Zod ---
const passengerSchema = z.object({
  title: z.enum(['Tn', 'Ny', 'Nn', 'An']),
  fullName: z.string().min(3, 'Nama minimal 3 karakter'),
  idNumber: z.string().regex(/^\d{16}$/, 'NIK harus 16 digit angka'),
  phoneNumber: z.string().regex(/^08\d{9,11}$/, 'Format nomor telepon tidak valid'),
  email: z.string().email('Format email tidak valid'),
  seatNumber: z.string().optional(),
  passengerType: z.enum(['Dewasa', 'Anak', 'Bayi']).default('Dewasa')
});

// --- Komponen Ikon ---
const TrainIcon = () => (
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

const StationIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

// --- Komponen TrainInfoCard ---
const TrainInfoCard = ({ train }: { train: Train }) => (
  <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-3">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
          train.trainClass === 'Eksekutif' ? 'bg-blue-100' :
          train.trainClass === 'Bisnis' ? 'bg-green-100' :
          'bg-yellow-100'
        }`}>
          <svg className={`w-6 h-6 ${
            train.trainClass === 'Eksekutif' ? 'text-blue-600' :
            train.trainClass === 'Bisnis' ? 'text-green-600' :
            'text-yellow-600'
          }`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 100-4V6z" />
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-lg text-gray-800">{train.trainName}</h3>
          <p className="text-sm text-gray-500">{train.trainNumber} • Kelas {train.trainClass}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-2xl font-bold text-[#FD7E14]">Rp {train.price.toLocaleString('id-ID')}</p>
        <p className="text-sm text-gray-500">per penumpang</p>
      </div>
    </div>

    {/* Route Information */}
    <div className="flex items-center justify-between py-4 border-t border-b border-gray-200">
      <div className="text-center">
        <p className="text-2xl font-bold text-gray-800">{train.departureTime}</p>
        <p className="text-sm text-gray-500">{new Date(train.departureDate).toLocaleDateString('id-ID')}</p>
        <div className="flex items-center justify-center mt-1">
          <StationIcon />
          <div className="ml-2 text-left">
            <p className="text-sm text-gray-800 font-medium">{train.originStation}</p>
            <p className="text-xs text-gray-500">{train.originCity}</p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 mx-6">
        <div className="flex items-center justify-center">
          <div className="flex-1 h-px bg-gray-300"></div>
          <div className="mx-3 flex flex-col items-center">
            <TrainIcon />
            <p className="text-xs text-gray-500 mt-1">{train.duration}</p>
          </div>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">Langsung</p>
      </div>
      
      <div className="text-center">
        <p className="text-2xl font-bold text-gray-800">{train.arrivalTime}</p>
        <p className="text-sm text-gray-500">{new Date(train.arrivalDate).toLocaleDateString('id-ID')}</p>
        <div className="flex items-center justify-center mt-1">
          <StationIcon />
          <div className="ml-2 text-left">
            <p className="text-sm text-gray-800 font-medium">{train.destinationStation}</p>
            <p className="text-xs text-gray-500">{train.destinationCity}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// --- Komponen PassengerForm ---
const PassengerForm = ({ 
  passengerCount, 
  onPassengerDataChange 
}: { 
  passengerCount: number; 
  onPassengerDataChange: (data: Passenger[]) => void;
}) => {
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Initialize passengers
  useEffect(() => {
    const initialPassengers: Passenger[] = Array.from({ length: passengerCount }, (_, index) => ({
      id: index + 1,
      title: 'Tn',
      fullName: '',
      idNumber: '',
      phoneNumber: '',
      email: '',
      seatNumber: '',
      passengerType: 'Dewasa'
    }));
    setPassengers(initialPassengers);
    onPassengerDataChange(initialPassengers);
  }, [passengerCount, onPassengerDataChange]);

  // Load data penumpang dari sessionStorage saat mount
  useEffect(() => {
    const savedPassengers = sessionStorage.getItem('tempPassengers');
    if (savedPassengers && passengerCount > 0) {
      try {
        const parsed = JSON.parse(savedPassengers);
        if (parsed.length === passengerCount) {
          setPassengers(parsed);
          onPassengerDataChange(parsed);
        }
      } catch (error) {
        console.error('Error loading saved passengers:', error);
      }
    }
  }, [passengerCount, onPassengerDataChange]);

  // Simpan data penumpang sementara di sessionStorage
  useEffect(() => {
    if (passengers.length > 0 && passengers.some(p => p.fullName)) {
      sessionStorage.setItem('tempPassengers', JSON.stringify(passengers));
    }
  }, [passengers]);

  const handlePassengerChange = (index: number, field: keyof Passenger, value: string) => {
    const updatedPassengers = [...passengers];
    updatedPassengers[index] = { ...updatedPassengers[index], [field]: value };
    setPassengers(updatedPassengers);
    onPassengerDataChange(updatedPassengers);
    
    // Validasi real-time
    const passenger = updatedPassengers[index];
    try {
      passengerSchema.parse(passenger);
      const errorKey = `${index}-${field}`;
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldError = error.issues.find((e) => e.path.includes(field));
        if (fieldError) {
          setErrors(prev => ({
            ...prev,
            [`${index}-${field}`]: fieldError.message
          }));
        }
      }
    }
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center mr-3">
                <span className="text-sm font-bold">{index + 1}</span>
              </div>
              <h4 className="font-semibold text-gray-800">Penumpang {index + 1}</h4>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gelar *</label>
              <select
                value={passenger.title}
                onChange={(e) => handlePassengerChange(index, 'title', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Tn">Tn (Bapak)</option>
                <option value="Ny">Ny (Ibu)</option>
                <option value="Nn">Nn (Nona)</option>
                <option value="An">An (Anak)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipe Penumpang</label>
              <select
                value={passenger.passengerType}
                onChange={(e) => handlePassengerChange(index, 'passengerType', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Dewasa">Dewasa (≥12 tahun)</option>
                <option value="Anak">Anak (3-11 tahun)</option>
                <option value="Bayi">Bayi (0-2 tahun)</option>
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap *</label>
              <input
                type="text"
                value={passenger.fullName}
                onChange={(e) => handlePassengerChange(index, 'fullName', e.target.value)}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors[`${index}-fullName`] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Masukkan nama lengkap sesuai KTP"
              />
              {errors[`${index}-fullName`] && (
                <p className="text-red-500 text-xs mt-1">{errors[`${index}-fullName`]}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">NIK *</label>
              <input
                type="text"
                value={passenger.idNumber}
                onChange={(e) => handlePassengerChange(index, 'idNumber', e.target.value)}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors[`${index}-idNumber`] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="16 digit NIK"
                maxLength={16}
              />
              {errors[`${index}-idNumber`] && (
                <p className="text-red-500 text-xs mt-1">{errors[`${index}-idNumber`]}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">No. Telepon *</label>
              <input
                type="tel"
                value={passenger.phoneNumber}
                onChange={(e) => handlePassengerChange(index, 'phoneNumber', e.target.value)}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors[`${index}-email`] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="email@contoh.com"
              />
              {errors[`${index}-email`] && (
                <p className="text-red-500 text-xs mt-1">{errors[`${index}-email`]}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nomor Kursi (Opsional)</label>
              <input
                type="text"
                value={passenger.seatNumber || ''}
                onChange={(e) => handlePassengerChange(index, 'seatNumber', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Contoh: A1, B5"
              />
            </div>
          </div>
        </div>
      ))}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-start space-x-3">
          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-xs">!</span>
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-800 mb-1">Informasi Penting</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Nama penumpang harus sama persis dengan KTP</li>
              <li>• Penumpang wajib membawa KTP asli saat check-in</li>
              <li>• Check-in di stasiun minimal 60 menit sebelum keberangkatan</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Komponen PaymentSection ---
const PaymentSection = ({ 
  onPaymentMethodChange 
}: { 
  onPaymentMethodChange: (method: string) => void;
}) => {
  const [selectedMethod, setSelectedMethod] = useState('');

  const paymentMethods = [
    { id: 'bank-transfer', name: 'Transfer Bank', description: 'BCA, Mandiri, BNI, BRI' },
    { id: 'credit-card', name: 'Kartu Kredit/Debit', description: 'Visa, Mastercard, JCB' },
    { id: 'e-wallet', name: 'E-Wallet', description: 'OVO, GoPay, DANA' }
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
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              selectedMethod === method.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedMethod === method.id ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
              }`}>
                {selectedMethod === method.id && (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800">{method.name}</h4>
                <p className="text-sm text-gray-500">{method.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Komponen BookingProtection ---
const BookingProtection = ({ 
  insuranceIncluded, 
  onInsuranceChange,
  insuranceFee 
}: { 
  insuranceIncluded: boolean; 
  onInsuranceChange: (selected: boolean) => void;
  insuranceFee: number;
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Asuransi Perjalanan</h3>
          <p className="text-sm text-gray-600">Perlindungan pembatalan, kecelakaan, dan bagasi</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-lg font-bold text-[#FD7E14]">Rp {insuranceFee.toLocaleString('id-ID')}</p>
            <p className="text-sm text-gray-500">per penumpang</p>
          </div>
          <input
            type="checkbox"
            checked={insuranceIncluded}
            onChange={(e) => onInsuranceChange(e.target.checked)}
            className="w-6 h-6 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
          />
        </div>
      </div>
    </div>
  );
};

// --- Komponen PriceSummary ---
const PriceSummary = ({ 
  train, 
  passengerCount, 
  insuranceSelected,
  currentStep,
  paymentMethod,
  passengerData,
  onContinue,
  onPayment,
  validatePassengers
}: { 
  train: Train;
  passengerCount: number;
  insuranceSelected: boolean;
  currentStep: number;
  paymentMethod: string;
  passengerData: Passenger[];
  onContinue: () => void;
  onPayment: () => Promise<void>;
  validatePassengers: () => boolean;
}) => {
  const basePrice = train.price;
  const totalBasePrice = basePrice * passengerCount;
  const insurance = insuranceSelected ? train.insurance * passengerCount : 0;
  const tax = Math.round((totalBasePrice + insurance) * 0.11);
  const serviceFee = 5000;
  const totalPrice = totalBasePrice + insurance + tax + serviceFee;

  const handleContinue = async () => {
    if (currentStep === 2) {
      if (!validatePassengers()) {
        alert('Harap isi data penumpang dengan lengkap');
        return;
      }
    }
    
    if (currentStep === 3 && !paymentMethod) {
      alert('Harap pilih metode pembayaran');
      return;
    }

    if (currentStep < 3) {
      onContinue();
      return;
    }

    // Lanjutkan ke pembayaran
    await onPayment();
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4">
      <h3 className="text-xl font-bold text-gray-800 mb-6 pb-4 border-b border-gray-200">Ringkasan Pemesanan</h3>
      
      <div className="space-y-4">
        <div className="flex justify-between">
          <span className="text-gray-600">Tiket ({passengerCount} orang)</span>
          <span className="font-medium">Rp {totalBasePrice.toLocaleString('id-ID')}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Asuransi Perjalanan</span>
          <span className={`font-medium ${insuranceSelected ? 'text-green-600' : 'text-gray-600'}`}>
            {insuranceSelected ? `Rp ${insurance.toLocaleString('id-ID')}` : '-'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">PPN 11%</span>
          <span className="font-medium">Rp {tax.toLocaleString('id-ID')}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Biaya Layanan</span>
          <span className="font-medium">Rp {serviceFee.toLocaleString('id-ID')}</span>
        </div>
        
        <hr className="border-gray-200" />
        
        <div className="flex justify-between text-lg font-bold pt-2">
          <span>Total Pembayaran</span>
          <span className="text-[#FD7E14]">Rp {totalPrice.toLocaleString('id-ID')}</span>
        </div>
      </div>
      
      <button 
        onClick={handleContinue}
        disabled={currentStep === 3 && !paymentMethod}
        className={`w-full mt-6 font-bold py-4 px-6 rounded-lg transition-all ${
          currentStep === 3 && !paymentMethod
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-[#FD7E14] hover:bg-[#E06700] text-white'
        }`}
      >
        {currentStep === 3 ? 'LANJUTKAN PEMBAYARAN' : 'LANJUTKAN'}
      </button>
    </div>
  );
};

// --- Halaman Utama ---
export default function TrainDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [train, setTrain] = useState<Train | null>(null);
  const [loading, setLoading] = useState(true);
  const [passengerCount, setPassengerCount] = useState(1);
  const [passengerData, setPassengerData] = useState<Passenger[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [insuranceSelected, setInsuranceSelected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch data kereta
  useEffect(() => {
    const fetchTrainData = async () => {
      try {
        if (!params?.id) {
          throw new Error('ID kereta tidak ditemukan');
        }

        // Coba fetch dari API atau gunakan data dummy jika API tidak tersedia
        try {
          const response = await fetch(`/api/trains/${params.id}`);
          if (response.ok) {
            const data = await response.json();
            setTrain({
              ...data,
              trainId: data.id,
              trainType: data.trainClass || data.trainType,
              origin: data.originStation || data.origin,
              destination: data.destinationStation || data.destination
            });
          } else {
            // Fallback ke data dummy jika API error
            createDummyData();
          }
        } catch (fetchError) {
          console.log('API error, using dummy data:', fetchError);
          createDummyData();
        }
        
      } catch (error: any) {
        console.error('Error fetching train data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    // Function untuk membuat data dummy
    const createDummyData = () => {
      const dummyTrain: Train = {
        id: params?.id as string || '1',
        trainId: params?.id as string || '1',
        trainNumber: 'KA-123',
        trainName: 'Argo Bromo Anggrek',
        trainClass: 'Eksekutif',
        trainType: 'Eksekutif',
        departureTime: '08:00',
        arrivalTime: '12:00',
        departureDate: new Date().toISOString(),
        arrivalDate: new Date(new Date().getTime() + 4 * 60 * 60 * 1000).toISOString(),
        duration: '4 jam',
        originStation: 'Gambir',
        origin: 'Gambir',
        originCity: 'Jakarta',
        destinationStation: 'Surabaya Gubeng',
        destination: 'Surabaya Gubeng',
        destinationCity: 'Surabaya',
        price: 350000,
        insurance: 10000,
        availableSeats: 25,
        seatType: 'Reclining Seat',
        routeType: 'Langsung',
        facilities: ['AC', 'Makanan', 'Minuman']
      };
      setTrain(dummyTrain);
      // Simpan ke sessionStorage untuk backup
      sessionStorage.setItem('selectedTrain', JSON.stringify(dummyTrain));
    };

    // Coba ambil data dari sessionStorage terlebih dahulu
    const savedTrain = sessionStorage.getItem('selectedTrain');
    if (savedTrain) {
      try {
        const parsedTrain = JSON.parse(savedTrain);
        setTrain(parsedTrain);
        setLoading(false);
        return;
      } catch (e) {
        console.error('Error parsing saved train:', e);
      }
    }

    fetchTrainData();
  }, [params?.id]);

  const validatePassengers = (): boolean => {
    if (passengerData.length === 0) return false;
    
    for (const passenger of passengerData) {
      try {
        passengerSchema.parse(passenger);
      } catch (error) {
        if (error instanceof z.ZodError) {
          const fieldErrors = error.issues.map(err => err.message).join(', ');
          alert(`Data penumpang tidak valid: ${fieldErrors}`);
          return false;
        }
        return false;
      }
    }
    return true;
  };

  const calculateTotalPrice = () => {
    if (!train) return 0;
    const basePrice = train.price;
    const totalBasePrice = basePrice * passengerCount;
    const insurance = insuranceSelected ? train.insurance * passengerCount : 0;
    const tax = Math.round((totalBasePrice + insurance) * 0.11);
    const serviceFee = 5000;
    return totalBasePrice + insurance + tax + serviceFee;
  };

  const handlePayment = async () => {
    try {
      // Validasi data
      if (!validatePassengers()) {
        return;
      }

      if (!paymentMethod) {
        alert('Harap pilih metode pembayaran');
        return;
      }

      // Generate booking data
      const bookingCode = `BOOK-${Date.now().toString().slice(-8)}`;
      const orderId = `ORDER-${Date.now()}`;
      
      // Prepare booking data
      const bookingData = {
        trainDetail: train ? {
          trainId: train.trainId,
          trainName: train.trainName,
          trainType: train.trainType,
          departureTime: train.departureTime,
          arrivalTime: train.arrivalTime,
          origin: train.origin,
          destination: train.destination,
          departureDate: train.departureDate,
          price: train.price
        } : null,
        passengers: passengerData,
        passengerCount: passengerCount,
        totalAmount: calculateTotalPrice(),
        insuranceIncluded: insuranceSelected,
        insuranceAmount: insuranceSelected ? train!.insurance * passengerCount : 0,
        paymentMethod: paymentMethod,
        bookingCode: bookingCode,
        orderId: orderId,
        bookingTime: new Date().toISOString()
      };

      // Save to sessionStorage
      sessionStorage.setItem('currentBooking', JSON.stringify(bookingData));

      // Call booking API
      const apiResponse = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData)
      });

      const result = await apiResponse.json();
      
      if (!apiResponse.ok || !result.success) {
        throw new Error(result.message || 'Gagal membuat booking');
      }

      // Clear temporary data
      sessionStorage.removeItem('tempPassengers');

      // Redirect ke halaman pembayaran dengan parameters
      const queryParams = new URLSearchParams({
        bookingCode: bookingCode,
        orderId: orderId,
        amount: calculateTotalPrice().toString(),
        name: passengerData[0]?.fullName || '',
        email: passengerData[0]?.email || '',
        phone: passengerData[0]?.phoneNumber || '',
        passengerCount: passengerCount.toString(),
        savedToDatabase: result.data?.savedToDatabase ? 'true' : 'false',
        paymentMethod: paymentMethod,
        trainName: train?.trainName || '',
        trainType: train?.trainType || '',
        origin: train?.origin || '',
        destination: train?.destination || '',
        departureDate: train?.departureDate || '',
        departureTime: train?.departureTime || ''
      });

      if (result.data?.bookingId) {
        queryParams.append('databaseId', result.data.bookingId);
      }

      if (result.data?.ticketNumber) {
        queryParams.append('ticketNumber', result.data.ticketNumber);
      }

      router.push(`/payment?${queryParams.toString()}`);

    } catch (error: any) {
      console.error('Payment error:', error);
      alert(error.message || 'Terjadi kesalahan saat memproses pembayaran');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FD7E14] mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat detail perjalanan kereta...</p>
        </div>
      </div>
    );
  }

  if (error || !train) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Terjadi Kesalahan</h2>
          <p className="text-gray-600 mb-6">{error || 'Perjalanan kereta tidak ditemukan'}</p>
          <div className="space-y-3">
            <button 
              onClick={() => router.push('/search')}
              className="w-full px-6 py-3 bg-[#FD7E14] text-white font-semibold rounded-lg hover:bg-[#E06700] transition-colors"
            >
              Cari Kereta Lain
            </button>
            <button 
              onClick={() => router.back()}
              className="w-full px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Kembali
            </button>
          </div>
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
              className="flex items-center text-gray-600 hover:text-gray-800"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Kembali
            </button>
            <h1 className="text-xl font-bold text-gray-800">Detail Perjalanan Kereta</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Passenger Selector */}
        <div className="mb-6">
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-800">Jumlah Penumpang</h3>
                <p className="text-sm text-gray-500">Tentukan jumlah penumpang</p>
              </div>
              <select
                value={passengerCount}
                onChange={(e) => setPassengerCount(Number(e.target.value))}
                className="border rounded-lg px-4 py-2"
              >
                {[1, 2, 3, 4, 5, 6].map(num => (
                  <option key={num} value={num}>{num} orang</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-8">
            {[
              { step: 1, label: 'Detail', icon: '🚂' },
              { step: 2, label: 'Penumpang', icon: '👥' },
              { step: 3, label: 'Pembayaran', icon: '💳' }
            ].map((stepInfo) => (
              <div key={stepInfo.step} className="flex items-center">
                <button
                  onClick={() => setCurrentStep(stepInfo.step)}
                  className={`flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all ${
                    currentStep === stepInfo.step
                      ? 'bg-[#FD7E14] text-white transform scale-110'
                      : currentStep > stepInfo.step
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  <span className="text-lg">{stepInfo.icon}</span>
                </button>
                {stepInfo.step < 3 && (
                  <div className={`w-16 h-1 ${
                    currentStep > stepInfo.step ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Booking Protection */}
        <BookingProtection 
          insuranceIncluded={insuranceSelected}
          onInsuranceChange={setInsuranceSelected}
          insuranceFee={train.insurance}
        />

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <TrainInfoCard train={train} />
            
            {currentStep >= 2 && (
              <PassengerForm 
                passengerCount={passengerCount}
                onPassengerDataChange={setPassengerData}
              />
            )}
            
            {currentStep >= 3 && (
              <PaymentSection onPaymentMethodChange={setPaymentMethod} />
            )}
          </div>
          
          <div className="lg:col-span-1">
            <PriceSummary 
              train={train}
              passengerCount={passengerCount}
              insuranceSelected={insuranceSelected}
              currentStep={currentStep}
              paymentMethod={paymentMethod}
              passengerData={passengerData}
              onContinue={() => setCurrentStep(prev => Math.min(3, prev + 1))}
              onPayment={handlePayment}
              validatePassengers={validatePassengers}
            />
          </div>
        </div>
      </div>
    </div>
  );
}