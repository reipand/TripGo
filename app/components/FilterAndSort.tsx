// app/components/FilterAndSort.tsx
'use client';

import React from 'react';

// Icons
const FilterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
  </svg>
);

const SortIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
    <path d="M3 3h14a1 1 0 010 2H3a1 1 0 010-2zm0 6h14a1 1 0 010 2H3a1 1 0 010-2zm0 6h10a1 1 0 010 2H3a1 1 0 010-2z" />
  </svg>
);

interface FilterAndSortProps {
  onSort: (sortType: string) => void;
  onFilter: (filterType: string) => void;
  activeSort: string;
  activeFilter: string;
}

const FilterAndSort: React.FC<FilterAndSortProps> = React.memo(({
  onSort,
  onFilter,
  activeSort,
  activeFilter
}) => {
  const sortOptions = [
    { id: 'earliest', label: 'Earliest Departure' },
    { id: 'lowest', label: 'Lowest Price' },
    { id: 'duration', label: 'Shortest Duration' },
    { id: 'latest', label: 'Latest Departure' }
  ];

  const filterOptions = [
    { id: 'all', label: 'All Classes' },
    { id: 'executive', label: 'Executive' },
    { id: 'business', label: 'Business' },
    { id: 'economy', label: 'Economy' }
  ];

  return (
    <div className="bg-white rounded-xl shadow p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center text-sm font-semibold text-gray-700 mb-3">
            <SortIcon /> Sort By:
          </div>
          <div className="flex flex-wrap gap-2">
            {sortOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => onSort(option.id)}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  activeSort === option.id
                    ? 'bg-[#FD7E14] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <div className="flex items-center text-sm font-semibold text-gray-700 mb-3">
            <FilterIcon /> Filter By Class:
          </div>
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => onFilter(option.id)}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  activeFilter === option.id
                    ? 'bg-[#FD7E14] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

FilterAndSort.displayName = 'FilterAndSort';

export default FilterAndSort;