// app/components/TrainCard.tsx
'use client';

import React, { useState, useCallback } from 'react';

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

interface TrainCardProps {
  train: TrainSchedule;
  passengers: number;
  onSelect: (train: TrainSchedule, trainClass: TrainClass) => void;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
};

const TrainCard: React.FC<TrainCardProps> = React.memo(({ train, passengers, onSelect }) => {
  const [selectedClass, setSelectedClass] = useState<TrainClass | null>(null);

  const handleSelectClass = useCallback((trainClass: TrainClass) => {
    if (!trainClass.isSoldOut && trainClass.seatsLeft > 0) {
      setSelectedClass(trainClass);
      onSelect(train, trainClass);
    }
  }, [train, onSelect]);

  return (
    <div className="space-y-4 mb-6">
      {/* Card untuk setiap kelas dalam satu kereta */}
      {train.classes.map((trainClass, index) => (
        <div 
          key={`${train.id}-${trainClass.class}-${index}`}
          className={`bg-white rounded-xl shadow-lg border overflow-hidden hover:shadow-xl transition-all duration-300 ${
            selectedClass?.class === trainClass.class && selectedClass?.subclass === trainClass.subclass 
              ? 'border-[#FD7E14] border-2' 
              : 'border-gray-200'
          } ${trainClass.isSoldOut ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'}`}
          onClick={() => !trainClass.isSoldOut && handleSelectClass(trainClass)}
        >
          {/* Header dengan nama kereta dan kelas */}
          <div className="p-5 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedClass?.class === trainClass.class && selectedClass?.subclass === trainClass.subclass
                    ? 'border-[#FD7E14] bg-[#FD7E14]'
                    : 'border-gray-300'
                }`}>
                  {selectedClass?.class === trainClass.class && selectedClass?.subclass === trainClass.subclass && (
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  )}
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {train.trainName} {train.trainNumber}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${
                      trainClass.class.toLowerCase().includes('executive') ? 'bg-blue-100 text-blue-800' :
                      trainClass.class.toLowerCase().includes('business') ? 'bg-green-100 text-green-800' :
                      trainClass.class.toLowerCase().includes('premium') ? 'bg-purple-100 text-purple-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {trainClass.class} ({trainClass.subclass})
                    </span>
                    {trainClass.isBestDeal && (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        💰 Best Deal
                      </span>
                    )}
                    {trainClass.demandStatus === 'high' && (
                      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                        🔥 High Demand
                      </span>
                    )}
                    {trainClass.seatsLeft < 5 && trainClass.seatsLeft > 0 && (
                      <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                        ⚠️ Almost Sold Out
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-2xl font-bold text-[#FD7E14]">
                  {formatPrice(trainClass.price)}
                </div>
                <div className="text-sm text-gray-500">per person</div>
              </div>
            </div>
          </div>

          {/* Rute dan waktu */}
          <div className="p-5">
            <div className="flex items-center justify-between">
              {/* Departure */}
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{train.departureTime}</div>
                <div className="text-sm font-medium text-gray-700 mt-1">{train.originCode}</div>
                <div className="text-xs text-gray-500">{train.origin}</div>
              </div>
              
              {/* Duration */}
              <div className="flex flex-col items-center">
                <div className="text-sm text-gray-600 mb-2">{train.duration}</div>
                <div className="flex items-center w-64">
                  <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                  <div className="flex-1 h-0.5 bg-gray-300 mx-3"></div>
                  <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H3a1 1 0 110-2h9.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1 h-0.5 bg-gray-300 mx-3"></div>
                  <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                </div>
              </div>
              
              {/* Arrival */}
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{train.arrivalTime}</div>
                <div className="text-sm font-medium text-gray-700 mt-1">{train.destinationCode}</div>
                <div className="text-xs text-gray-500">{train.destination}</div>
              </div>
            </div>
          </div>

          {/* Footer dengan seat info */}
          <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                {trainClass.isSoldOut ? (
                  <span className="text-red-600 font-medium flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    Sold Out
                  </span>
                ) : (
                  <>
                    <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    <span className={`font-medium ${
                      trainClass.seatsLeft < 5 ? 'text-red-600' : 
                      trainClass.seatsLeft < 10 ? 'text-yellow-600' : 
                      'text-gray-700'
                    }`}>
                      {trainClass.seatsLeft} seats left
                    </span>
                  </>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {train.isRefundable && (
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    100% Refund
                  </span>
                )}
                {train.isCheckinAvailable && (
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                    </svg>
                    E-Boarding
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

TrainCard.displayName = 'TrainCard';

export default TrainCard;