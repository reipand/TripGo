// components/Booking/FilterSidebar.tsx
"use client";

import { FC } from 'react';
import { FaCalendarAlt, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

interface FilterSidebarProps {
  filters: {
    status: string[];
    dateRange: {
      start: string;
      end: string;
    };
    searchQuery: string;
    sortBy: 'newest' | 'oldest' | 'travel_date' | 'total_amount';
  };
  onFilterChange: (newFilters: any) => void;
}

const FilterSidebar: FC<FilterSidebarProps> = ({ filters, onFilterChange }) => {
  const statusOptions = [
    { value: 'pending', label: 'Menunggu', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'confirmed', label: 'Dikonfirmasi', color: 'bg-green-100 text-green-800' },
    { value: 'cancelled', label: 'Dibatalkan', color: 'bg-red-100 text-red-800' },
    { value: 'completed', label: 'Selesai', color: 'bg-blue-100 text-blue-800' },
    { value: 'refunded', label: 'Dikembalikan', color: 'bg-purple-100 text-purple-800' },
    { value: 'expired', label: 'Kadaluarsa', color: 'bg-gray-100 text-gray-800' },
  ];

  const handleStatusChange = (status: string) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];
    
    onFilterChange({ status: newStatus });
  };

  const handleDateChange = (type: 'start' | 'end', value: string) => {
    onFilterChange({
      dateRange: {
        ...filters.dateRange,
        [type]: value
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Filter Status</h4>
        <div className="space-y-2">
          {statusOptions.map((status) => (
            <label
              key={status.value}
              className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded-lg"
            >
              <input
                type="checkbox"
                checked={filters.status.includes(status.value)}
                onChange={() => handleStatusChange(status.value)}
                className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="ml-3 text-gray-700">{status.label}</span>
              <span className={`ml-auto px-2 py-1 rounded-full text-xs ${status.color}`}>
                {status.value}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Rentang Tanggal</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dari Tanggal
            </label>
            <div className="relative">
              <input
                type="date"
                value={filters.dateRange.start}
                onChange={(e) => handleDateChange('start', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sampai Tanggal
            </label>
            <div className="relative">
              <input
                type="date"
                value={filters.dateRange.end}
                onChange={(e) => handleDateChange('end', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={() => onFilterChange({
            status: [],
            dateRange: { start: '', end: '' },
            searchQuery: '',
            sortBy: 'newest'
          })}
          className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
        >
          Reset Semua Filter
        </button>
      </div>
    </div>
  );
};

export default FilterSidebar;