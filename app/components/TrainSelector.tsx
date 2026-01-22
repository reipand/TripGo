// app/components/TransitSelector.tsx
import React from 'react';
import { TransitStation } from '@/app/utils/transitHelper';

interface TransitSelectorProps {
  transitOptions: TransitStation[];
  selectedTransit: TransitStation | null;
  onSelect: (transit: TransitStation | null) => void;
  loading?: boolean;
  passengerCount: number;
  scheduleId?: string;
}

const TransitSelector: React.FC<TransitSelectorProps> = ({
  transitOptions,
  selectedTransit,
  onSelect,
  loading = false,
  passengerCount,
  scheduleId
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (transitOptions.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
          <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-4">
          <h3 className="text-xl font-bold text-gray-800">Pilih Transit (Opsional)</h3>
          <p className="text-gray-600">Berhenti di stasiun sebelum tujuan akhir</p>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="text-sm text-gray-600 mb-2">
          <span className="font-medium">Informasi:</span> Pilih stasiun transit jika ingin turun sebelum tujuan akhir.
          Tiket hanya berlaku sampai stasiun transit yang dipilih.
        </div>
      </div>
      
      <div className="space-y-4">
        {transitOptions.map((transit) => {
          const isSelected = selectedTransit?.id === transit.id;
          const isAvailable = transit.has_available_seats && transit.available_seats >= passengerCount;
          
          return (
            <div
              key={`transit-${transit.id}`}
              className={`border rounded-lg p-4 transition-all ${
                isSelected
                  ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-100'
                  : isAvailable
                    ? 'border-gray-300 hover:border-purple-300 cursor-pointer'
                    : 'border-gray-300 opacity-50 cursor-not-allowed'
              }`}
              onClick={() => isAvailable && onSelect(isSelected ? null : transit)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${
                      isSelected
                        ? 'border-purple-500 bg-purple-500'
                        : isAvailable
                          ? 'border-gray-400'
                          : 'border-gray-300'
                    }`}>
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800">{transit.station_name}</h4>
                      <div className="flex items-center mt-1">
                        <span className="text-sm text-gray-600">{transit.city}</span>
                        <span className="mx-2 text-gray-400">•</span>
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                          {transit.station_code}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-8 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <span className="w-24 text-gray-600">Tiba:</span>
                        <span className="font-medium">{transit.arrival_time}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <span className="w-24 text-gray-600">Berangkat:</span>
                        <span className="font-medium">{transit.departure_time}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <span className="w-24 text-gray-600">Menunggu:</span>
                        <span className="font-medium">{transit.waiting_minutes} menit</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="text-sm text-gray-600">
                        Antara: <span className="font-medium">{transit.previous_station}</span> →{' '}
                        <span className="font-medium">{transit.next_station}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Durasi: <span className="font-medium">{transit.duration_minutes} menit</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-600">Kursi tersedia:</span>{' '}
                        <span className={`font-medium ${
                          isAvailable ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {isAvailable ? 'Ya' : 'Terbatas'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  {!isAvailable && (
                    <div className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium mb-2">
                      Kursi habis
                    </div>
                  )}
                  {isAvailable && (
                    <div className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium mb-2">
                      {transit.available_seats} kursi
                    </div>
                  )}
                </div>
              </div>
              
              {isSelected && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-green-700 font-medium">
                      Transit dipilih. Tiket akan berlaku sampai stasiun {transit.station_name}.
                    </span>
                  </div>
                  <p className="text-xs text-green-600 mt-1 ml-6">
                    Anda dapat melanjutkan perjalanan dengan membeli tiket baru dari {transit.station_name}.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {selectedTransit && (
        <div className="mt-6 pt-6 border-t">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-bold text-gray-800">Transit yang Dipilih</h4>
              <p className="text-sm text-gray-600">
                {selectedTransit.station_name} ({selectedTransit.city})
              </p>
            </div>
            <button
              onClick={() => onSelect(null)}
              className="px-4 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg"
            >
              Batalkan Transit
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransitSelector;