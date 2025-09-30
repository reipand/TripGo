'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';

// Tipe data untuk hasil kereta dari API
interface Train {
  id: number;
  waktu_berangkat: string;
  waktu_tiba: string;
  harga: number;
  stok_kursi: number;
  routes: {
    kota_asal: string;
    kota_tujuan: string;
  };
  transportations: {
    nama_transportasi: string;
    tipe: string;
  };
}

// --- Komponen Ikon ---
const TrainIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block -mt-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
);

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

// --- Komponen Kartu Tiket Kereta ---
const TrainTicketCard = ({ train }: { train: Train }) => {
    // Fungsi untuk memformat waktu dan menghitung durasi
    const departure = new Date(train.waktu_berangkat);
    const arrival = new Date(train.waktu_tiba);

    const departureTime = departure.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const arrivalTime = arrival.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    
    const durationMinutes = (arrival.getTime() - departure.getTime()) / (1000 * 60);
    const durationHours = Math.floor(durationMinutes / 60);
    const remainingMinutes = durationMinutes % 60;
    const duration = `${durationHours}j ${remainingMinutes}m`;
    
    // Logika untuk menampilkan status tiket
    const isSoldOut = train.stok_kursi <= 0;
    const isLimited = train.stok_kursi > 0 && train.stok_kursi <= 5;

    return (
        <div className="bg-white rounded-lg shadow-md p-4 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 transition-all duration-300 hover:shadow-xl">
            <Image 
              src={`/images/train-logo-${train.transportations.nama_transportasi.toLowerCase().replace(' ', '-')}.png`} 
              alt={`${train.transportations.nama_transportasi} logo`} 
              width={96} 
              height={96} 
              className="w-24 h-auto object-contain"
              onError={(e) => { e.currentTarget.src = '/images/train-logo-default.png'; }} // Fallback
            />
            
            <div className="flex-grow flex flex-col md:flex-row items-center text-center md:text-left">
                <div className="w-full md:w-1/3">
                    <p className="text-xl font-bold text-gray-800">{departureTime}</p>
                    <p className="text-sm text-gray-500">{train.routes.kota_asal}</p>
                </div>
                
                <div className="w-full md:w-1/3 text-center my-2 md:my-0">
                    <p className="text-sm text-gray-500">{duration}</p>
                    <div className="w-full h-px bg-gray-200 relative my-1">
                        <span className="absolute left-0 top-1/2 -mt-1.5 w-3 h-3 bg-gray-300 rounded-full"></span>
                        <span className="absolute right-0 top-1/2 -mt-1.5 w-3 h-3 bg-gray-300 rounded-full"></span>
                    </div>
                    <p className="text-sm text-gray-500">Langsung</p>
                </div>

                <div className="w-full md:w-1/3">
                    <p className="text-xl font-bold text-gray-800">{arrivalTime}</p>
                    <p className="text-sm text-gray-500">{train.routes.kota_tujuan}</p>
                </div>
            </div>

            <div className="md:border-l md:pl-4 text-center md:text-right">
                <p className="text-xl font-bold text-orange-500">Rp {train.harga.toLocaleString('id-ID')}</p>
                <p className="text-xs text-gray-500">/pax</p>
                {isLimited && (
                    <p className="text-red-500 text-sm font-semibold mt-1">Tersisa sedikit!</p>
                )}
                {isSoldOut ? (
                    <button className="mt-2 w-full md:w-auto px-6 py-2 bg-gray-400 text-white font-semibold rounded-lg cursor-not-allowed">
                        Habis
                    </button>
                ) : (
                    <button className="mt-2 w-full md:w-auto px-6 py-2 bg-[#FD7E14] text-white font-semibold rounded-lg hover:bg-[#E06700] transition-colors duration-300">
                        Pilih
                    </button>
                )}
            </div>
        </div>
    );
};

// --- Komponen Filter dan Sortir ---
const FilterAndSort = ({ onSort, onFilter }: { onSort: (sortType: string) => void, onFilter: (filterType: string) => void }) => {
    const [activeSort, setActiveSort] = useState('');
    const [activeFilter, setActiveFilter] = useState('');

    const handleSortClick = (sortType: string) => {
        setActiveSort(sortType);
        onSort(sortType);
    };

    const handleFilterClick = (filterType: string) => {
        setActiveFilter(filterType);
        onFilter(filterType);
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex flex-col lg:flex-row lg:items-center justify-between">
            {/* Bagian Sortir */}
            <div className="flex items-center flex-wrap mb-4 lg:mb-0">
                <div className="flex items-center text-sm font-semibold text-gray-700 mr-4 my-1">
                    <SortIcon /> Urutkan:
                </div>
                <div className="flex flex-wrap space-x-2">
                    <button 
                        onClick={() => handleSortClick('price-asc')} 
                        className={`px-4 py-2 text-sm rounded-full transition-colors duration-200 ${activeSort === 'price-asc' ? 'bg-[#FD7E14] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                        Harga Termurah
                    </button>
                    <button 
                        onClick={() => handleSortClick('departure-asc')} 
                        className={`px-4 py-2 text-sm rounded-full transition-colors duration-200 ${activeSort === 'departure-asc' ? 'bg-[#FD7E14] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                        Waktu Berangkat
                    </button>
                    <button 
                        onClick={() => handleSortClick('duration-asc')} 
                        className={`px-4 py-2 text-sm rounded-full transition-colors duration-200 ${activeSort === 'duration-asc' ? 'bg-[#FD7E14] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                        Durasi Tercepat
                    </button>
                </div>
            </div>

            {/* Bagian Filter */}
            <div className="flex items-center flex-wrap mt-4 lg:mt-0">
                <div className="flex items-center text-sm font-semibold text-gray-700 mr-4 my-1">
                    <FilterIcon /> Filter Waktu:
                </div>
                <div className="flex flex-wrap space-x-2">
                    <button 
                        onClick={() => handleFilterClick('morning')} 
                        className={`px-4 py-2 text-sm rounded-full transition-colors duration-200 ${activeFilter === 'morning' ? 'bg-[#FD7E14] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                        Pagi (00:00 - 11:59)
                    </button>
                    <button 
                        onClick={() => handleFilterClick('afternoon')} 
                        className={`px-4 py-2 text-sm rounded-full transition-colors duration-200 ${activeFilter === 'afternoon' ? 'bg-[#FD7E14] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                        Siang (12:00 - 17:59)
                    </button>
                    <button 
                        onClick={() => handleFilterClick('night')} 
                        className={`px-4 py-2 text-sm rounded-full transition-colors duration-200 ${activeFilter === 'night' ? 'bg-[#FD7E14] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                        Malam (18:00 - 23:59)
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Komponen untuk menampilkan hasil pencarian ---
const TrainResults = () => {
    const searchParams = useSearchParams();
    const [trains, setTrains] = useState<Train[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortType, setSortType] = useState<string>('');
    const [filterType, setFilterType] = useState<string>('');

    const origin = searchParams.get('origin') || 'Tidak Diketahui';
    const destination = searchParams.get('destination') || 'Tidak Diketahui';
    const departureDate = searchParams.get('departureDate');

    useEffect(() => {
        const fetchTrains = async () => {
            if (!origin || !destination || !departureDate || origin === 'Tidak Diketahui') {
                setLoading(false);
                return;
            }
            
            setLoading(true);
            setError(null);
            
            try {
                const query = new URLSearchParams({ 
                    origin, 
                    destination, 
                    departureDate 
                }).toString();
                
                console.log('Fetching with query:', query); // Debug: lihat parameter yang dikirim
                
                // Mengambil data dari API dengan cache yang dinonaktifkan
                const response = await fetch(`/api/search/train?${query}`, { 
                    cache: 'no-store',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                // Debug: lihat status response
                console.log('Response status:', response.status);
                
                if (!response.ok) {
                    // Coba dapatkan pesan error dari response body
                    let errorMessage = 'Gagal mengambil data kereta';
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.message || errorMessage;
                    } catch (e) {
                        // Jika response tidak bisa di-parse sebagai JSON
                        const errorText = await response.text();
                        errorMessage = `${errorMessage}: ${errorText}`;
                    }
                    
                    throw new Error(`${errorMessage} (Status: ${response.status})`);
                }
                
                const data: Train[] = await response.json();
                console.log('Data received:', data); // Debug: lihat data yang diterima
                
                // Terapkan filter dan sort
                let filteredData = [...data];
                if (filterType) {
                    filteredData = filteredData.filter(train => {
                        const departureHour = new Date(train.waktu_berangkat).getHours();
                        if (filterType === 'morning') return departureHour >= 0 && departureHour < 12;
                        if (filterType === 'afternoon') return departureHour >= 12 && departureHour < 18;
                        if (filterType === 'night') return departureHour >= 18 && departureHour <= 23;
                        return true;
                    });
                }
                
                if (sortType) {
                    filteredData.sort((a, b) => {
                        if (sortType === 'price-asc') return a.harga - b.harga;
                        if (sortType === 'departure-asc') return new Date(a.waktu_berangkat).getTime() - new Date(b.waktu_berangkat).getTime();
                        if (sortType === 'duration-asc') {
                            const durationA = (new Date(a.waktu_tiba).getTime() - new Date(a.waktu_berangkat).getTime());
                            const durationB = (new Date(b.waktu_tiba).getTime() - new Date(b.waktu_berangkat).getTime());
                            return durationA - durationB;
                        }
                        return 0;
                    });
                }

                setTrains(filteredData);
            } catch (error) {
                console.error('Error fetching trains:', error);
                setError(error instanceof Error ? error.message : 'Terjadi kesalahan yang tidak diketahui');
                setTrains([]);
            } finally {
                setLoading(false);
            }
        };

        fetchTrains();
    }, [origin, destination, departureDate, sortType, filterType]);

    // Menangani kasus di mana halaman dimuat tanpa parameter
    if (!searchParams.toString()) {
        return (
            <div className="container mx-auto px-4 py-8 text-center">
                <h1 className="text-2xl font-bold text-gray-700">Mulai Pencarian Anda</h1>
                <p className="text-gray-500 mt-2">Silakan isi form di halaman utama untuk mencari tiket kereta.</p>
            </div>
        );
    }
    
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Hasil Pencarian <TrainIcon /></h1>
                <p className="text-gray-600">
                    {origin} → {destination}
                    <span className="mx-2 text-gray-400">|</span>
                    {departureDate && new Date(departureDate + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </div>
            
            <FilterAndSort 
                onSort={setSortType} 
                onFilter={setFilterType} 
            />

            {loading ? (
                <p className="text-center text-gray-500 mt-10">Mencari kereta terbaik...</p>
            ) : error ? (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">
                                {error}
                            </p>
                            <p className="mt-2 text-sm text-red-600">
                                Silakan coba lagi nanti atau periksa koneksi internet Anda.
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {trains.length > 0 ? (
                        trains.map(train => (
                            <TrainTicketCard key={train.id} train={train} />
                        ))
                    ) : (
                        <p className="text-center text-gray-500 mt-10">Tidak ada kereta yang ditemukan untuk rute dan tanggal ini.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default function SearchTrainPage() {
    return (
        <Suspense fallback={<p className="text-center text-gray-500 mt-10">Memuat hasil pencarian...</p>}>
            <TrainResults />
        </Suspense>
    );
}