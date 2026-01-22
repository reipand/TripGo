// app/components/TrainCard.tsx - Versi disesuaikan
'use client';

import React, { useState, useCallback } from 'react';
import { formatCurrency } from '@/app/utils/format';

// Interface yang sudah disesuaikan dengan database
interface TrainClass {
  class_type: string;
  class_name?: string;
  price: number;
  available_seats: number;
  is_sold_out?: boolean;
  facilities?: string[];
  coach_code?: string;
  coach_id?: string;
}

interface TrainSchedule {
  id: string;
  kode_kereta: string;
  nama_kereta: string;
  operator: string;
  tipe_kereta?: string;
  fasilitas?: Record<string, boolean>;
  
  // Schedule information dari jadwal_kereta dan rute_kereta
  departure_time: string;
  arrival_time: string;
  duration_minutes: number;
  travel_date?: string;
  
  // Station information dari stasiun
  origin_code: string;
  origin_station: string;
  origin_city?: string;
  destination_code: string;
  destination_station: string;
  destination_city?: string;
  
  // Availability dari train_seats
  available_seats: number;
  is_refundable?: boolean;
  is_checkin_available?: boolean;
  
  // Classes available dari gerbong
  classes: TrainClass[];
  
  // Additional info
  is_high_demand?: boolean;
  demand_status?: 'high' | 'low' | 'normal';
}

interface TrainCardProps {
  train: TrainSchedule;
  passengers: number;
  onSelect: (train: TrainSchedule, trainClass: TrainClass) => void;
}

const formatTime = (time: string) => {
  try {
    // Handle time string (format HH:mm:ss atau HH:mm)
    if (typeof time === 'string') {
      if (time.includes(':')) {
        const [hours, minutes] = time.split(':');
        return `${hours.padStart(2, '0')}:${minutes}`;
      }
    }
    return time;
  } catch (e) {
    console.error('Error formatting time:', e, time);
    return time;
  }
};

const TrainCard: React.FC<TrainCardProps> = React.memo(({ train, passengers, onSelect }) => {
  const [selectedClass, setSelectedClass] = useState<TrainClass | null>(null);

  const handleSelectClass = useCallback((trainClass: TrainClass) => {
    if (trainClass.available_seats > 0 && !trainClass.is_sold_out) {
      setSelectedClass(trainClass);
      onSelect(train, trainClass);
    }
  }, [train, onSelect]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getClassColor = (classType: string) => {
    if (!classType) return { bg: 'bg-gray-100', text: 'text-gray-800' };
    
    const type = classType.toLowerCase();
    if (type.includes('executive')) {
      return { bg: 'bg-blue-100', text: 'text-blue-800' };
    }
    if (type.includes('business') || type.includes('bisnis')) {
      return { bg: 'bg-green-100', text: 'text-green-800' };
    }
    if (type.includes('premium') || type.includes('utama')) {
      return { bg: 'bg-purple-100', text: 'text-purple-800' };
    }
    if (type.includes('economy') || type.includes('ekonomi')) {
      return { bg: 'bg-yellow-100', text: 'text-yellow-800' };
    }
    return { bg: 'bg-gray-100', text: 'text-gray-800' };
  };

  const getClassName = (classType: string) => {
    const type = classType.toLowerCase();
    if (type.includes('executive')) return 'Eksekutif';
    if (type.includes('business') || type.includes('bisnis')) return 'Bisnis';
    if (type.includes('premium') || type.includes('utama')) return 'Premium';
    if (type.includes('economy') || type.includes('ekonomi')) return 'Ekonomi';
    return classType;
  };

  return (
    <div className="space-y-4 mb-6">
      {train.classes && train.classes.length > 0 ? (
        train.classes.map((trainClass, index) => {
          const classType = trainClass.class_type || '';
          const className = getClassName(classType);
          const classColor = getClassColor(classType);
          const isSelected = selectedClass?.class_type === classType && 
                            selectedClass?.price === trainClass.price;

          return (
            <div 
              key={`${train.id}-${classType}-${index}`}
              className={`bg-white rounded-xl shadow-lg border overflow-hidden hover:shadow-xl transition-all duration-300 ${
                isSelected
                  ? 'border-[#FD7E14] border-2' 
                  : 'border-gray-200'
              } ${trainClass.is_sold_out || trainClass.available_seats === 0 
                ? 'opacity-75 cursor-not-allowed' 
                : 'cursor-pointer'}`}
              onClick={() => !trainClass.is_sold_out && handleSelectClass(trainClass)}
            >
              {/* Card content */}
              <div className="p-5 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected
                        ? 'border-[#FD7E14] bg-[#FD7E14]'
                        : 'border-gray-300'
                    }`}>
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {train.nama_kereta} {train.kode_kereta && `(${train.kode_kereta})`}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${classColor.bg} ${classColor.text}`}>
                          {className}
                          {trainClass.coach_code && ` (${trainClass.coach_code})`}
                        </span>
                        
                        {trainClass.available_seats < 10 && trainClass.available_seats > 0 && (
                          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                            ⚠️ Hampir Habis
                          </span>
                        )}
                        
                        {train.is_high_demand && (
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                            🔥 Permintaan Tinggi
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[#FD7E14]">
                      {formatCurrency(trainClass.price)}
                    </div>
                    <div className="text-sm text-gray-500">per orang</div>
                    {passengers > 1 && (
                      <div className="text-xs text-gray-400 mt-1">
                        Total: {formatCurrency(trainClass.price * passengers)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Schedule details */}
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">
                      {formatTime(train.departure_time)}
                    </div>
                    <div className="text-sm font-medium text-gray-700 mt-1">
                      {train.origin_code}
                    </div>
                    <div className="text-xs text-gray-500">
                      {train.origin_station}
                      {train.origin_city && `, ${train.origin_city}`}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="text-sm text-gray-600 mb-2">
                      {formatDuration(train.duration_minutes)}
                    </div>
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
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">
                      {formatTime(train.arrival_time)}
                    </div>
                    <div className="text-sm font-medium text-gray-700 mt-1">
                      {train.destination_code}
                    </div>
                    <div className="text-xs text-gray-500">
                      {train.destination_station}
                      {train.destination_city && `, ${train.destination_city}`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {trainClass.is_sold_out || trainClass.available_seats === 0 ? (
                      <span className="text-red-600 font-medium flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        Habis
                      </span>
                    ) : (
                      <>
                        <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                        <span className={`font-medium ${
                          trainClass.available_seats < 5 ? 'text-red-600' : 
                          trainClass.available_seats < 10 ? 'text-yellow-600' : 
                          'text-gray-700'
                        }`}>
                          {trainClass.available_seats} kursi tersedia
                        </span>
                      </>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {train.is_refundable !== false && (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        100% Refund
                      </span>
                    )}
                    {train.is_checkin_available !== false && (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                        </svg>
                        E-Boarding
                      </span>
                    )}
                  </div>
                </div>

                {/* Facilities */}
                {trainClass.facilities && trainClass.facilities.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-gray-500">Fasilitas:</span>
                      {trainClass.facilities.map((facility, idx) => (
                        <span key={idx} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                          {facility}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Train facilities */}
                {train.fasilitas && Object.keys(train.fasilitas).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-gray-500">Fasilitas kereta:</span>
                      {Object.entries(train.fasilitas).slice(0, 3).map(([key, value]) => 
                        value === true && (
                          <span key={key} className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded">
                            {key.replace(/_/g, ' ')}
                          </span>
                        )
                      )}
                      {Object.keys(train.fasilitas).filter(k => train.fasilitas?.[k] === true).length > 3 && (
                        <span className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded">
                          +{Object.keys(train.fasilitas).filter(k => train.fasilitas?.[k] === true).length - 3} lebih
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })
      ) : (
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <p className="text-gray-500">Tidak ada kelas tersedia untuk kereta ini</p>
        </div>
      )}
    </div>
  );
});

TrainCard.displayName = 'TrainCard';

export default TrainCard;