'use client'; // Diperlukan karena kita akan menggunakan state dan hooks

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation'; // Impor useRouter untuk navigasi

// --- Kumpulan Ikon SVG ---

const PlaneIcon = ({ isActive }: { isActive: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 transition-colors duration-300 ${isActive ? 'text-[#0A58CA]' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const TrainIcon = ({ isActive }: { isActive: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 transition-colors duration-300 ${isActive ? 'text-[#0A58CA]' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21c-4 0-8-1-8-2.5S8 16 12 16s8 1 8 2.5S16 21 12 21zm-4-3h8m-8-2h8m-8-2h8M5 12l1-6h12l1 6H5zm-1 0h16M4 9h16" />
  </svg>
);

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const SwitchIcon = ({ onClick }: { onClick: () => void }) => (
  <svg onClick={onClick} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mx-2 cursor-pointer hover:text-gray-600 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
);


// --- Komponen Form Pencarian Interaktif ---

const SearchWidget = () => {
  const [activeTab, setActiveTab] = useState('pesawat');
  const [tripType, setTripType] = useState('oneWay'); // oneWay atau roundTrip
  const router = useRouter();

  const [flightData, setFlightData] = useState({
    origin: '',
    destination: '',
    departureDate: '',
    returnDate: '',
    passengers: '',
  });

  const [trainData, setTrainData] = useState({
    origin: '',
    destination: '',
    departureDate: '',
    returnDate: '',
    passengers: '',
  });

  const formatDate = (date: Date) => {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const isFlight = activeTab === 'pesawat';
    const setData = isFlight ? setFlightData : setTrainData;
    
    setData(prev => ({ ...prev, [name]: value }));

    if (name === 'departureDate' && tripType === 'roundTrip' && value) {
      const departure = new Date(value);
      departure.setDate(departure.getDate() + 1);
      const nextDay = formatDate(departure);
      setData(prev => ({ ...prev, returnDate: nextDay }));
    }
  };
  
  useEffect(() => {
    if (tripType === 'oneWay') {
      setFlightData(prev => ({...prev, returnDate: ''}));
      setTrainData(prev => ({...prev, returnDate: ''}));
    }
  }, [tripType]);


  const handleFlightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFlightData({ ...flightData, [e.target.name]: e.target.value });
  };
  const handleTrainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTrainData({ ...trainData, [e.target.name]: e.target.value });
  };

  const handleSwitchLocations = () => {
    if (activeTab === 'pesawat') {
        setFlightData(prev => ({
            ...prev,
            origin: prev.destination,
            destination: prev.origin,
        }));
    } else {
        setTrainData(prev => ({
            ...prev,
            origin: prev.destination,
            destination: prev.origin,
        }));
    }
  };

  const handleSearchSubmit = () => {
    if (activeTab === 'pesawat') {
      const dataToSubmit = tripType === 'oneWay' ? { ...flightData, returnDate: '' } : flightData;
      if (!dataToSubmit.origin || !dataToSubmit.destination || !dataToSubmit.departureDate) {
        alert('Harap lengkapi asal, tujuan, dan tanggal pergi.');
        return;
      }
      const query = new URLSearchParams(dataToSubmit).toString();
      router.push(`/search/flights?${query}`);
    } else {
        const dataToSubmit = tripType === 'oneWay' ? { ...trainData, returnDate: '' } : trainData;
        if (!dataToSubmit.origin || !dataToSubmit.destination || !dataToSubmit.departureDate) {
            alert('Harap lengkapi stasiun asal, tujuan, dan tanggal berangkat.');
            return;
        }
        const query = new URLSearchParams(dataToSubmit).toString();
        router.push(`/search/trains?${query}`);
    }
  };

  const renderForm = () => {
    const isFlight = activeTab === 'pesawat';
    const data = isFlight ? flightData : trainData;
    const genericHandler = isFlight ? handleFlightChange : handleTrainChange;
    
    const gridCols = tripType === 'roundTrip' ? 'lg:grid-cols-5' : 'lg:grid-cols-4';

    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 ${gridCols} gap-4 items-end`}>
        {isFlight ? (
             <div className="md:col-span-2 lg:col-span-2">
                <label className="text-gray-800 text-sm font-medium">Asal & Tujuan</label>
                <div className="flex items-center bg-white p-2 rounded-md border border-gray-200 mt-1">
                    <input type="text" name="origin" value={data.origin} onChange={genericHandler} placeholder="Kota atau Bandara Asal" className="bg-transparent w-full focus:outline-none placeholder-gray-400 text-gray-900" />
                    <SwitchIcon onClick={handleSwitchLocations} />
                    <input type="text" name="destination" value={data.destination} onChange={genericHandler} placeholder="Kota atau Bandara Tujuan" className="bg-transparent w-full focus:outline-none text-right placeholder-gray-400 text-gray-900" />
                </div>
            </div>
        ) : (
            <>
                <div className="lg:col-span-1">
                    <label className="text-gray-800 text-sm font-medium">Asal</label>
                    <div className="flex items-center bg-white p-2 rounded-md border border-gray-200 mt-1">
                        <input type="text" name="origin" value={data.origin} onChange={genericHandler} placeholder="Stasiun Asal" className="bg-transparent w-full focus:outline-none placeholder-gray-400 text-gray-900" />
                    </div>
                </div>
                <div className="lg:col-span-1 relative">
                    <label className="text-gray-800 text-sm font-medium">Tujuan</label>
                    <div className="flex items-center bg-white p-2 rounded-md border border-gray-200 mt-1">
                        <input type="text" name="destination" value={data.destination} onChange={genericHandler} placeholder="Stasiun Tujuan" className="bg-transparent w-full focus:outline-none placeholder-gray-400 text-gray-900" />
                    </div>
                    <div className="absolute -left-5 top-1/2 mt-2 transform cursor-pointer" onClick={handleSwitchLocations}>
                         <SwitchIcon onClick={() => {}} />
                    </div>
                </div>
            </>
        )}
        
        <div>
          <label className="text-gray-800 text-sm font-medium">Tanggal Pergi</label>
          <div className="flex items-center bg-white p-2 rounded-md border border-gray-200 mt-1">
            <CalendarIcon />
            <input type="date" name="departureDate" value={data.departureDate} onChange={handleDateChange} className="bg-transparent w-full focus:outline-none ml-2 text-gray-900"/>
          </div>
        </div>
        
        {tripType === 'roundTrip' && (
            <div>
              <label className="text-gray-800 text-sm font-medium">Tanggal Pulang</label>
              <div className="flex items-center bg-white p-2 rounded-md border border-gray-200 mt-1">
                <CalendarIcon />
                <input type="date" name="returnDate" value={data.returnDate} onChange={handleDateChange} className="bg-transparent w-full focus:outline-none ml-2 text-gray-900"/>
              </div>
            </div>
        )}

        <div className={tripType === 'roundTrip' && !isFlight ? 'lg:col-start-5' : ''}>
          <label className="text-gray-800 text-sm font-medium">Penumpang</label>
          <div className="flex items-center bg-white p-2 rounded-md border border-gray-200 mt-1">
              <UserIcon />
              <input type="text" name="passengers" value={data.passengers} onChange={genericHandler} placeholder="Jumlah Penumpang" className="bg-transparent w-full focus:outline-none ml-2 placeholder-gray-400 text-gray-900" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-5xl">
      <div className="flex border-b border-gray-200 mb-4">
            <button
              onClick={() => setActiveTab('pesawat')}
              className={`flex items-center pb-3 pt-1 px-1 text-base font-semibold transition-colors duration-300 ${activeTab === 'pesawat' ? 'border-b-2 border-[#0A58CA] text-[#0A58CA]' : 'text-gray-500 hover:text-gray-800'}`}
            >
              <PlaneIcon isActive={activeTab === 'pesawat'} /> Pesawat
            </button>
            <button
              onClick={() => setActiveTab('kereta')}
              className={`flex items-center pb-3 pt-1 px-4 text-base font-semibold transition-colors duration-300 ${activeTab === 'kereta' ? 'border-b-2 border-[#0A58CA] text-[#0A58CA]' : 'text-gray-500 hover:text-gray-800'}`}
            >
              <TrainIcon isActive={activeTab === 'kereta'} /> Kereta Api
            </button>
      </div>

       {/* Pilihan Tipe Perjalanan (Posisi Baru) */}
       <div className="flex items-center space-x-6 mb-4">
        <label className="flex items-center cursor-pointer">
            <input type="radio" name="tripType" value="oneWay" checked={tripType === 'oneWay'} onChange={() => setTripType('oneWay')} className="hidden" />
            <span className={`w-5 h-5 rounded-full border-2 ${tripType === 'oneWay' ? 'border-[#0A58CA] bg-white' : 'border-gray-300' } flex items-center justify-center`}>
                {tripType === 'oneWay' && <span className="w-2.5 h-2.5 bg-[#0A58CA] rounded-full"></span>}
            </span>
            <span className="ml-2 font-medium text-gray-800">Sekali Jalan</span>
        </label>
        <label className="flex items-center cursor-pointer">
            <input type="radio" name="tripType" value="roundTrip" checked={tripType === 'roundTrip'} onChange={() => setTripType('roundTrip')} className="hidden" />
            <span className={`w-5 h-5 rounded-full border-2 ${tripType === 'roundTrip' ? 'border-[#0A58CA] bg-white' : 'border-gray-300'} flex items-center justify-center`}>
                {tripType === 'roundTrip' && <span className="w-2.5 h-2.5 bg-[#0A58CA] rounded-full"></span>}
            </span>
            <span className="ml-2 font-medium text-gray-800">Pulang-Pergi</span>
        </label>
      </div>
      
      {/* Form Content */}
      <div className="space-y-4">
        {renderForm()}
        <div className="flex justify-end pt-6">
          <button onClick={handleSearchSubmit} className="w-full md:w-auto px-10 py-3 bg-[#FD7E14] text-white font-bold text-lg rounded-full hover:bg-[#E06700] transition-colors duration-300 flex items-center justify-center shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Cari Tiket
          </button>
        </div>
      </div>
    </div>
  );
};


// --- Komponen Kartu Promo ---
const PromoCard = ({ imageUrl, title, description }: { imageUrl: string, title: string, description: string }) => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transform hover:-translate-y-2 transition-transform duration-300">
        <Image src={imageUrl} alt={title} width={400} height={200} className="w-full h-40 object-cover" />
        <div className="p-4">
            <h3 className="font-bold text-lg mb-1 text-gray-800">{title}</h3>
            <p className="text-gray-600 text-sm">{description}</p>
        </div>
    </div>
);


// --- Komponen Halaman Utama ---

export default function Home() {
  const promos = [
    {
      imageUrl: "/images/promo-bali.png", // Menggunakan gambar lokal
      title: "Diskon Penerbangan ke Bali",
      description: "Nikmati potongan hingga 30% untuk liburan impianmu."
    },
    {
      imageUrl: "/images/promo-jogja.png", // Menggunakan gambar lokal
      title: "Promo Kereta ke Yogyakarta",
      description: "Perjalanan lebih hemat dengan cashback spesial."
    },
    {
      imageUrl: "/images/promo-whoosh.jpg", // Menggunakan gambar lokal
      title: "Penawaran Whoosh di Bandung",
      description: "Perjalanan Jakarta - bandung hanya 30 menit."
    }
  ];

  return (
    <>
      {/* Hero Section */}
      <section 
        className="relative flex items-center justify-center h-[70vh] min-h-[600px] bg-cover bg-center text-white" 
        style={{ backgroundImage: "url('/images/hero-background.jpg')" }} // Menggunakan gambar lokal
      >
        <div className="absolute inset-0 bg-black opacity-40"></div>
        <div className="relative z-10 container mx-auto px-4 flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 drop-shadow-lg">Mau ke mana?</h1>
          <p className="text-lg md:text-xl mb-8 drop-shadow-md">Pesan tiket pesawat dan kereta api dengan harga terbaik!</p>
          <SearchWidget />
        </div>
      </section>

      {/* Promo Section */}
      <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-2 text-[#0A58CA]">Promo & Penawaran Spesial</h2>
              <p className="text-center text-gray-600 mb-10">Jangan lewatkan kesempatan untuk liburan lebih hemat!</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {promos.map((promo, index) => (
                      <PromoCard key={index} {...promo} />
                  ))}
              </div>
          </div>
      </section>
    </>
  );
}

