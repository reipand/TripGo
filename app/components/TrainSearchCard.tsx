// app/components/TrainSearchCard.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

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
}

interface TrainClass {
  class: string;
  subclass: string;
  price: number;
  seatsLeft: number;
  isSoldOut?: boolean;
  isBestDeal?: boolean;
  demandStatus?: 'high' | 'low' | 'normal';
}

interface TrainSearchCardProps {
  schedule: TrainSchedule;
  passengers: number;
  onSelectClass?: (classType: TrainClass) => void;
  compact?: boolean;
}

const TrainSearchCard: React.FC<TrainSearchCardProps> = ({
  schedule,
  passengers = 1,
  onSelectClass,
  compact = false
}) => {
  const router = useRouter();
  const [selectedClass, setSelectedClass] = useState<TrainClass | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatDuration = (duration: string) => {
    const [hours, minutes] = duration.split('h').map(part => 
      part.replace('m', '').trim()
    );
    return `${hours}h ${minutes ? `${minutes}m` : ''}`.trim();
  };

  const handleBookNow = () => {
    if (!selectedClass) {
      alert('Please select a class first');
      return;
    }

    // Simpan data ke session storage
    const bookingData = {
      scheduleId: schedule.id,
      trainNumber: schedule.trainNumber,
      trainName: schedule.trainName,
      departureTime: schedule.departureTime,
      arrivalTime: schedule.arrivalTime,
      duration: schedule.duration,
      origin: schedule.origin,
      destination: schedule.destination,
      originCode: schedule.originCode,
      destinationCode: schedule.destinationCode,
      departureDate: schedule.departureDate,
      selectedClass: selectedClass.class,
      selectedSubclass: selectedClass.subclass,
      price: selectedClass.price,
      passengers: passengers,
      totalAmount: selectedClass.price * passengers
    };

    sessionStorage.setItem('trainBooking', JSON.stringify(bookingData));
    
    // Redirect ke halaman booking
    router.push(`/booking?scheduleId=${schedule.id}&class=${selectedClass.class}&passengers=${passengers}`);
  };

  const handleSelectClass = (trainClass: TrainClass) => {
    if (trainClass.isSoldOut || trainClass.seatsLeft <= 0) return;
    
    setSelectedClass(trainClass);
    if (onSelectClass) {
      onSelectClass(trainClass);
    }
  };

  // Cek apakah ada kelas yang tersedia
  const hasAvailableClasses = schedule.classes.some(cls => 
    !cls.isSoldOut && cls.seatsLeft > 0
  );

  return (
    <div className={`bg-white rounded-xl shadow-md overflow-hidden border ${schedule.isHighDemand ? 'border-orange-300' : 'border-gray-200'} hover:shadow-lg transition-shadow duration-300`}>
      {/* Header dengan info kereta */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-1">
              {schedule.trainName} {schedule.trainNumber}
            </h3>
            {schedule.isHighDemand && (
              <span className="inline-block px-3 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">
                High Demand
              </span>
            )}
          </div>
          
          {/* Info tambahan */}
          <div className="flex flex-col items-end gap-2">
            {schedule.isRefundable && (
              <div className="flex items-center gap-1 text-green-600 text-xs">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>100% Refund</span>
              </div>
            )}
            
            {schedule.isCheckinAvailable && (
              <div className="flex items-center gap-1 text-blue-600 text-xs">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
                </svg>
                <span>E-Boarding</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Waktu perjalanan */}
        <div className="flex items-center justify-between">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{schedule.departureTime}</div>
            <div className="text-sm font-medium text-gray-700">{schedule.originCode}</div>
            <div className="text-xs text-gray-500">{schedule.origin}</div>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="text-sm text-gray-600 mb-2">{formatDuration(schedule.duration)}</div>
            <div className="flex items-center w-48">
              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
              <div className="flex-1 h-0.5 bg-gray-300 mx-2"></div>
              <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H3a1 1 0 110-2h9.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <div className="flex-1 h-0.5 bg-gray-300 mx-2"></div>
              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{schedule.arrivalTime}</div>
            <div className="text-sm font-medium text-gray-700">{schedule.destinationCode}</div>
            <div className="text-xs text-gray-500">{schedule.destination}</div>
          </div>
        </div>
        
        {schedule.warning && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">{schedule.warning}</p>
          </div>
        )}
      </div>

      {/* Daftar kelas yang tersedia - TANPA TOMBOL SELECT */}
      <div className="divide-y divide-gray-100">
        {schedule.classes.map((trainClass, index) => (
          <div 
            key={`${trainClass.class}-${trainClass.subclass}-${index}`}
            className={`p-6 hover:bg-gray-50 transition-colors cursor-pointer ${
              selectedClass?.class === trainClass.class && selectedClass?.subclass === trainClass.subclass 
                ? 'bg-blue-50 border-l-4 border-blue-500' 
                : ''
            } ${trainClass.isSoldOut ? 'opacity-60 cursor-not-allowed' : ''}`}
            onClick={() => handleSelectClass(trainClass)}
          >
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedClass?.class === trainClass.class && selectedClass?.subclass === trainClass.subclass
                        ? 'border-blue-600 bg-blue-600'
                        : 'border-gray-300'
                    }`}
                  >
                    {selectedClass?.class === trainClass.class && selectedClass?.subclass === trainClass.subclass && (
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    )}
                  </div>
                  
                  <span className="font-semibold text-gray-800">
                    {trainClass.class} ({trainClass.subclass})
                  </span>
                  
                  {trainClass.isBestDeal && (
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      Best Deal
                    </span>
                  )}
                  
                  {trainClass.demandStatus === 'high' && (
                    <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                      High Demand
                    </span>
                  )}
                </div>
                
                <div className="ml-7">
                  {trainClass.isSoldOut ? (
                    <span className="text-red-600 font-medium text-sm">Sold Out</span>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                      <span>{trainClass.seatsLeft} seats left</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-xl font-bold text-gray-900">
                  {formatPrice(trainClass.price)}
                </div>
                <div className="text-sm text-gray-500">
                  per person
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer dengan tombol Book Now */}
      {!compact && hasAvailableClasses && selectedClass && (
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-gray-600">Total for {passengers} passenger{passengers > 1 ? 's' : ''}</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatPrice(selectedClass.price * passengers)}
              </div>
            </div>
            
            <button
              onClick={handleBookNow}
              className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-md hover:shadow-lg"
            >
              <span>Book Now</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {/* Jika tidak ada kelas yang dipilih */}
      {!compact && hasAvailableClasses && !selectedClass && (
        <div className="p-6 bg-gray-50 border-t border-gray-200 text-center">
          <p className="text-gray-600 text-sm">Please select a class to continue</p>
        </div>
      )}
    </div>
  );
};

export default TrainSearchCard;