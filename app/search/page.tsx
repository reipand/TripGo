'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
// TIDAK PERLU impor Navbar dan Footer di sini karena sudah ada di layout.tsx

// --- Komponen Ikon ---
const PlaneTakeoffIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block -mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L6 12z" />
    </svg>
);

// --- Komponen Kartu Tiket ---
const TicketCard = ({ flight }: { flight: any }) => (
    <div className="bg-white rounded-lg shadow-md p-4 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 transition-all duration-300 hover:shadow-xl">
        <img src={`/images/airline-logo-${flight.airline.toLowerCase()}.png`} alt={`${flight.airline} logo`} className="w-24 h-auto object-contain" />
        
        <div className="flex-grow flex flex-col md:flex-row items-center text-center md:text-left">
            {/* Waktu Berangkat */}
            <div className="w-full md:w-1/3">
                <p className="text-xl font-bold text-gray-800">{flight.departureTime}</p>
                <p className="text-sm text-gray-500">{flight.originCode}</p>
            </div>
            
            {/* Durasi */}
            <div className="w-full md:w-1/3 text-center my-2 md:my-0">
                <p className="text-sm text-gray-500">{flight.duration}</p>
                <div className="w-full h-px bg-gray-200 relative my-1">
                    <span className="absolute left-0 top-1/2 -mt-1.5 w-3 h-3 bg-gray-300 rounded-full"></span>
                    <span className="absolute right-0 top-1/2 -mt-1.5 w-3 h-3 bg-gray-300 rounded-full"></span>
                </div>
                <p className="text-sm text-gray-500">Langsung</p>
            </div>

            {/* Waktu Tiba */}
            <div className="w-full md:w-1/3">
                <p className="text-xl font-bold text-gray-800">{flight.arrivalTime}</p>
                <p className="text-sm text-gray-500">{flight.destinationCode}</p>
            </div>
        </div>

        {/* Harga */}
        <div className="md:border-l md:pl-4 text-center md:text-right">
            <p className="text-xl font-bold text-orange-500">Rp {flight.price.toLocaleString('id-ID')}</p>
            <p className="text-xs text-gray-500">/pax</p>
            <button className="mt-2 w-full md:w-auto px-6 py-2 bg-[#FD7E14] text-white font-semibold rounded-lg hover:bg-[#E06700] transition-colors duration-300">
                Pilih
            </button>
        </div>
    </div>
);

// --- Komponen untuk menampilkan hasil pencarian ---
const SearchResults = () => {
    const searchParams = useSearchParams();

    // Mengambil data dari URL
    const origin = searchParams.get('origin') || 'Tidak Diketahui';
    const destination = searchParams.get('destination') || 'Tidak Diketahui';
    const departureDate = searchParams.get('departureDate');
    
    // Data dummy untuk ditampilkan
    const dummyFlights = [
        { id: 1, airline: 'Garuda', departureTime: '07:30', arrivalTime: '09:00', duration: '1j 30m', originCode: 'CGK', destinationCode: 'DPS', price: 1250000 },
        { id: 2, airline: 'Citilink', departureTime: '08:15', arrivalTime: '09:45', duration: '1j 30m', originCode: 'CGK', destinationCode: 'DPS', price: 980000 },
        { id: 3, airline: 'Lion', departureTime: '09:00', arrivalTime: '10:30', duration: '1j 30m', originCode: 'CGK', destinationCode: 'DPS', price: 850000 },
    ];

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Hasil Pencarian <PlaneTakeoffIcon /></h1>
                <p className="text-gray-600">
                    {origin} → {destination}
                    <span className="mx-2 text-gray-400">|</span>
                    {departureDate}
                </p>
            </div>

            <div className="space-y-4">
                {dummyFlights.length > 0 ? (
                    dummyFlights.map(flight => (
                        <TicketCard key={flight.id} flight={flight} />
                    ))
                ) : (
                    <p className="text-center text-gray-500">Tidak ada penerbangan yang ditemukan.</p>
                )}
            </div>
        </div>
    );
};

// --- Halaman Utama Hasil Pencarian ---
export default function SearchFlightsPage() {
    return (
        <Suspense fallback={<p className="text-center text-gray-500 mt-10">Memuat hasil pencarian...</p>}>
            <SearchResults />
        </Suspense>
    );
}

