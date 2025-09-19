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
                <button className="mt-2 w-full md:w-auto px-6 py-2 bg-[#FD7E14] text-white font-semibold rounded-lg hover:bg-[#E06700] transition-colors duration-300">
                    Pilih
                </button>
            </div>
        </div>
    );
};


// --- Component for displaying search results ---
const TrainResults = () => {
    const searchParams = useSearchParams();
    const [trains, setTrains] = useState<Train[]>([]);
    const [loading, setLoading] = useState(true);

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
            try {
                const query = new URLSearchParams({ origin, destination, departureDate }).toString();
                // Mengambil data dari API dengan cache yang dinonaktifkan
                const response = await fetch(`/api/search/train?${query}`, { cache: 'no-store' });

                if (!response.ok) {
                    throw new Error('Gagal mengambil data kereta');
                }
                const data = await response.json();
                setTrains(data);
            } catch (error) {
                console.error(error);
                setTrains([]);
            } finally {
                setLoading(false);
            }
        };

        fetchTrains();
    }, [origin, destination, departureDate]);

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

            {loading ? (
                <p className="text-center text-gray-500 mt-10">Mencari kereta terbaik...</p>
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


// --- Halaman Utama Hasil Pencarian ---
export default function SearchTrainPage() {
    return (
        <Suspense fallback={<p className="text-center text-gray-500 mt-10">Memuat hasil pencarian...</p>}>
            <TrainResults />
        </Suspense>
    );
}
