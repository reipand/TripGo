// app/components/TrainSelectionSummary.tsx
'use client';

import React, { useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface TrainClass {
  class: string;
  subclass: string;
  price: number;
  seatsLeft: number;
  isSoldOut?: boolean;
  isBestDeal?: boolean;
  demandStatus?: 'high' | 'low' | 'normal';
  trainType?: string;
}

interface TrainSchedule {
  id: string;
  trainNumber: string;
  trainName: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  origin: string;
  destination: string;
  originCode: string;
  destinationCode: string;
  departureDate: string;
  classes: TrainClass[];
  availableSeats: number;
  isRefundable: boolean;
  isCheckinAvailable: boolean;
  isHighDemand?: boolean;
  warning?: string;
  scheduleId?: string;
  trainId?: string;
  trainType?: string;
  originCity?: string;
  destinationCity?: string;
  travelDate?: string;
}

interface TrainSelectionSummaryProps {
  train: TrainSchedule;
  selectedClass: TrainClass;
  passengers: number;
  onDeselect: () => void;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
};

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
};

const TrainSelectionSummary: React.FC<TrainSelectionSummaryProps> = React.memo(({ 
  train, 
  selectedClass, 
  passengers, 
  onDeselect 
}) => {
  const router = useRouter();
  
  const handleBookNow = useCallback(() => {
    // Generate booking code and order ID
    const timestamp = Date.now();
    const randomCode = Math.random().toString(36).substr(2, 4).toUpperCase();
    const bookingCode = `BOOK-${timestamp}-${randomCode}`;
    const orderId = `ORDER-${timestamp}-${randomCode}`;

    // Calculate total amount with fees
    const baseAmount = selectedClass.price * passengers;
    const seatPremium = 132500;
    const adminFee = 5000;
    const insuranceFee = 10000;
    const totalAmount = baseAmount + seatPremium + adminFee + insuranceFee;

    // Save to sessionStorage
    const bookingData = {
      // Train data
      id: train.id,
      scheduleId: train.scheduleId || train.id,
      trainId: train.trainId || train.id,
      trainNumber: train.trainNumber,
      trainName: train.trainName,
      trainType: selectedClass.trainType || train.trainType || selectedClass.class,
      
      // Schedule
      departureTime: train.departureTime,
      arrivalTime: train.arrivalTime,
      duration: train.duration,
      origin: train.origin,
      destination: train.destination,
      originCode: train.originCode,
      destinationCode: train.destinationCode,
      departureDate: train.departureDate || train.travelDate,
      originCity: train.originCity || train.origin,
      destinationCity: train.destinationCity || train.destination,
      
      // Class and price
      selectedClass: selectedClass.class,
      selectedSubclass: selectedClass.subclass,
      price: selectedClass.price,
      basePrice: selectedClass.price,
      
      // Passengers
      passengers: passengers,
      passengerCount: passengers,
      
      // Fees
      seatPremium: seatPremium,
      discountAmount: 0,
      paymentFee: 0,
      adminFee: adminFee,
      insuranceFee: insuranceFee,
      totalAmount: totalAmount,
      amount: totalAmount,
      
      // Seats
      selectedSeats: [`B2`],
      seatCount: 1,
      
      // Availability
      availableSeats: selectedClass.seatsLeft,
      
      // Booking info
      bookingCode: bookingCode,
      orderId: orderId,
      status: 'Data Penumpang',
      
      // Metadata
      savedAt: new Date().toISOString(),
      
      // Payment info (default)
      paymentMethod: '',
      promoCode: '',
      promoName: '',
      name: '',
      email: '',
      phone: ''
    };

    // Save to sessionStorage
    sessionStorage.setItem('selectedTrain', JSON.stringify(bookingData));
    sessionStorage.setItem('bookingData', JSON.stringify(bookingData));
    console.log('💾 Saved booking data:', bookingData);
    
    // Redirect to booking page
    router.push('/booking');
  }, [train, selectedClass, passengers, router]);

  return (
    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <div className="text-sm text-gray-600">Total for {passengers} passenger{passengers > 1 ? 's' : ''}</div>
          <div className="text-2xl font-bold text-gray-900">
            {formatPrice(
              selectedClass.price * passengers + 
              132500 + // seat premium
              5000 +   // admin fee
              10000    // insurance fee
            )}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Selected: <span className="font-medium">{selectedClass.class} ({selectedClass.subclass})</span> • 
            <span className="ml-2">Departure: {formatDate(train.departureDate || train.travelDate || '')}</span>
          </div>
          <div className="text-xs text-gray-400 mt-2">
            Includes: Base fare + Seat premium + Admin fee + Insurance
          </div>
        </div>
        
        <div className="flex space-x-3 mt-4 md:mt-0">
          <button 
            onClick={onDeselect}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Change Class
          </button>
          
          <button 
            onClick={handleBookNow}
            className="px-6 py-2.5 text-sm font-semibold bg-[#FD7E14] text-white rounded-lg hover:bg-[#E06700] transition-colors flex items-center gap-2"
          >
            <span>Continue to Booking</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
});

TrainSelectionSummary.displayName = 'TrainSelectionSummary';

export default TrainSelectionSummary;