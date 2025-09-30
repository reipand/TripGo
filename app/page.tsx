'use client'; 

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

// --- Kumpulan Ikon (Diubah ke Path Gambar Lokal) ---

const getIconPath = (
  name: 'plane' | 'train' | 'calendar' | 'user' | 'switch' | 'search' | 'price' | 'complete' | 'support',
  isActive: boolean = false
) => {
 
  // const basePath = '/images';


  const basePath = '/images/icons';

  if (name === 'plane' || name === 'train') {
    return `${basePath}/${name}${isActive ? '-active' : ''}.png`;
  }
  
  // Special handling for utility icons with hover states
  if (name === 'switch') {
    return `${basePath}/utils/${name}.png`; // Dark version for better visibility
  }
  
  // Regular utility icons
  if (name === 'calendar' || name === 'user') {
    return `${basePath}/utils/${name}.png`;
  }

  if (name === 'price' || name === 'complete' || name === 'support') {
    return `${basePath}/features/${name}.png`;
  }
  
  // All other utility icons
  return `${basePath}/utils/${name}.png`;
};

const IconComponent = ({ path, className = '', alt }: { path: string, className?: string, alt: string }) => (
    <img src={path} alt={alt} className={`h-5 w-5 ${className}`} />
);

const PlaneIcon = ({ isActive }: { isActive: boolean }) => (
  <IconComponent 
    path={getIconPath('plane', isActive)} 
    className={`mr-2 transition-colors duration-300`}
    alt="Ikon Pesawat"
  />
);

const TrainIcon = ({ isActive }: { isActive: boolean }) => (
  <IconComponent 
    path={getIconPath('train', isActive)} 
    className={`mr-2 transition-colors duration-300`}
    alt="Ikon Kereta"
  />
);

const CalendarIcon = () => (
  <IconComponent 
    path={getIconPath('calendar')} 
    className="text-gray-400" 
    alt="Ikon Kalender"
  />
);

const UserIcon = () => (
    <IconComponent 
      path={getIconPath('user')} 
      className="text-gray-400"
      alt="Ikon Pengguna" 
    />
);

const SwitchIcon = ({ onClick }: { onClick: () => void }) => (
  <img 
    onClick={onClick} 
    src={getIconPath('switch')} 
    alt="Ikon Tukar Lokasi" 
    className="h-5 w-5 text-gray-400 mx-2 cursor-pointer hover:text-gray-600 transition-colors duration-200"
  />
);

const FeatureIconContainer = ({ children }: { children: React.ReactNode }) => (
    <div className="p-4 bg-blue-100 rounded-full text-[#0A58CA] mb-3">
        {children}
    </div>
);

// --- Komponen Form Pencarian Interaktif ---

const SearchWidget = () => {
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('pesawat');
  const [tripType, setTripType] = useState('oneWay'); // oneWay atau roundTrip
  
  // Ambil tanggal hari ini untuk batas minimal input
  const today = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1); // minimal besok
    return d.toISOString().split('T')[0];
  }, []);

  const [flightData, setFlightData] = useState({
    origin: 'Jakarta',
    destination: 'Bali (Denpasar)',
    departureDate: today, // Set default ke besok
    returnDate: '',
    passengers: '1 Dewasa',
  });

  const [trainData, setTrainData] = useState({
    origin: 'Jakarta',
    destination: 'Yogyakarta',
    departureDate: today, // Set default ke besok
    returnDate: '',
    passengers: '1 Dewasa',
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
    const currentData = isFlight ? flightData : trainData;
    
    setData(prev => ({ ...prev, [name]: value }));

    if (name === 'departureDate' && tripType === 'roundTrip' && value) {
      const departure = new Date(value);
      // Tambahkan satu hari ke tanggal berangkat untuk dijadikan tanggal pulang minimal
      const nextDay = formatDate(new Date(departure.getTime() + 86400000));
      
      // Pastikan tanggal pulang tidak mendahului tanggal pergi
      if (!currentData.returnDate || new Date(currentData.returnDate) < new Date(nextDay)) {
         setData(prev => ({ ...prev, returnDate: nextDay }));
      }
    }
  };
  
  useEffect(() => {
    // Reset returnDate saat tipe perjalanan diubah menjadi sekali jalan
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
    const showMessage = (msg: string) => {
      alert(msg); // Replace console.log with actual alert for better UX
    };
    
    if (activeTab === 'pesawat') {
      const dataToSubmit = tripType === 'oneWay' ? { ...flightData, returnDate: '' } : flightData;
      if (!dataToSubmit.origin || !dataToSubmit.destination || !dataToSubmit.departureDate) {
        showMessage('Harap lengkapi kota/bandara asal, tujuan, dan tanggal pergi.');
        return;
      }
      const query = new URLSearchParams(dataToSubmit as any).toString();
      router.push(`/search/flights?${query}`);
    } else {
      const dataToSubmit = tripType === 'oneWay' ? { ...trainData, returnDate: '' } : trainData;
      if (!dataToSubmit.origin || !dataToSubmit.destination || !dataToSubmit.departureDate) {
        showMessage('Harap lengkapi stasiun asal, tujuan, dan tanggal berangkat.');
        return;
      }
      const query = new URLSearchParams(dataToSubmit as any).toString();
      router.push(`/search/trains?${query}`);
    }
  };

  const renderForm = () => {
    const isFlight = activeTab === 'pesawat';
    const data = isFlight ? flightData : trainData;
    const genericHandler = isFlight ? handleFlightChange : handleTrainChange;
    
    const gridCols = tripType === 'roundTrip' ? 'lg:grid-cols-5' : 'lg:grid-cols-4';
    // Menghitung minDate untuk Tanggal Pulang
    const minReturnDate = data.departureDate ? formatDate(new Date(new Date(data.departureDate).getTime() + 86400000)) : today;

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
                    {/* Switch icon untuk kereta api diletakkan di tengah antara Asal dan Tujuan */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-1 z-10" onClick={handleSwitchLocations}>
                         <SwitchIcon onClick={() => {}} />
                    </div>
                </div>
            </>
        )}
        
        <div>
          <label className="text-gray-800 text-sm font-medium">Tanggal Pergi</label>
          <div className="flex items-center bg-white p-2 rounded-md border border-gray-200 mt-1">
            <CalendarIcon />
            <input type="date" name="departureDate" value={data.departureDate} onChange={handleDateChange} min={today} className="bg-transparent w-full focus:outline-none ml-2 text-gray-900"/>
          </div>
        </div>
        
        {tripType === 'roundTrip' && (
            <div>
              <label className="text-gray-800 text-sm font-medium">Tanggal Pulang</label>
              <div className="flex items-center bg-white p-2 rounded-md border border-gray-200 mt-1">
                <CalendarIcon />
                <input 
                    type="date" 
                    name="returnDate" 
                    value={data.returnDate} 
                    onChange={handleDateChange} 
                    min={minReturnDate} 
                    className="bg-transparent w-full focus:outline-none ml-2 text-gray-900"
                />
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
            {/* TAB PESAWAT */}
            <button
              onClick={() => setActiveTab('pesawat')}
              className={`flex items-center pb-3 pt-1 px-4 text-base font-semibold transition-colors duration-300 ${activeTab === 'pesawat' ? 'border-b-2 border-[#0A58CA] text-[#0A58CA]' : 'text-gray-500 hover:text-gray-800'}`}
            >
              <PlaneIcon isActive={activeTab === 'pesawat'} /> 
              <span>Pesawat</span>
            </button>
            
            {/* TAB KERETA API */}
            <button
              onClick={() => setActiveTab('kereta')}
              className={`flex items-center pb-3 pt-1 px-4 text-base font-semibold transition-colors duration-300 ${activeTab === 'kereta' ? 'border-b-2 border-[#0A58CA] text-[#0A58CA]' : 'text-gray-500 hover:text-gray-800'}`}
            >
              <TrainIcon isActive={activeTab === 'kereta'} />
              <span>Kereta Api</span>
            </button>
      </div>

       {/* Pilihan Tipe Perjalanan */}
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
            {/* Ikon Kaca Pembesar diganti dengan path */}
            <img 
                src={getIconPath('search')} 
                alt="Ikon Cari" 
                className="h-6 w-6 mr-2" 
            />
            Cari Tiket
          </button>
        </div>
      </div>
    </div>
  );
};


// --- Komponen Kartu Promo ---
const PromoCard = ({ imageUrl, title, description }: { imageUrl: string, title: string, description: string }) => (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 cursor-pointer border border-gray-100" data-aos="fade-right">
        <div className="h-40 w-full relative">
            <img 
                src={imageUrl} 
                alt={title} 
                className="w-full h-40 object-cover" 
                loading="lazy"
            />
        </div>
        <div className="p-4">
            <h3 className="font-bold text-lg mb-1 text-[#0A58CA]">{title}</h3>
            <p className="text-gray-600 text-sm">{description}</p>
        </div>
    </div>
);


// --- Komponen Kartu Destinasi Populer ---
const DestinationCard = ({ imageUrl, name, price, link, delay }: { imageUrl: string, name: string, price: string, link: string, delay: number }) => (
    <a href={link} className="block group" data-aos="fade-up" data-aos-delay={delay}>
        <div className="relative overflow-hidden rounded-xl h-64 shadow-md hover:shadow-xl transition-shadow duration-300">
            <img 
                src={imageUrl} 
                alt={name} 
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4 flex flex-col justify-end">
                <h3 className="text-xl font-bold text-white mb-1">{name}</h3>
                <p className="text-sm font-medium text-amber-400">Mulai dari {price}</p>
            </div>
        </div>
    </a>
);


// --- Komponen Kartu Keunggulan (Why Choose Us) ---
const FeatureCard = ({ title, description, iconPath }: { title: string, description: string, iconPath: string }) => (
    <div className="p-6 text-center bg-white rounded-xl shadow-lg border border-blue-50 hover:shadow-xl transition-shadow duration-300" data-aos="fade-up">
        <FeatureIconContainer>
          <img src={iconPath} alt={`Ikon ${title}`} className="h-6 w-6"/>
        </FeatureIconContainer>
        <h3 className="font-bold text-lg mb-2 text-gray-800">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
    </div>
);


// --- Komponen Halaman Utama ---

declare global {
    interface Window {
        AOS: any;
    }
}

export default function Home() {
    useEffect(() => {
        let aosLink: HTMLLinkElement | null = null;
        let aosScript: HTMLScriptElement | null = null;

        // Load AOS CSS
        const link = document.createElement('link');
        link.href = "https://unpkg.com/aos@2.3.4/dist/aos.css";
        link.rel = "stylesheet";
        document.head.appendChild(link);
        aosLink = link;

        // Load AOS JS
        const script = document.createElement('script');
        script.src = "https://unpkg.com/aos@2.3.4/dist/aos.js";
        script.onload = () => {
            if (typeof window !== 'undefined' && window.AOS) {
                window.AOS.init({
                    duration: 1000,
                    once: true,
                });
            }
        };
        document.body.appendChild(script);
        aosScript = script;

        // Cleanup
        return () => {
            if (aosLink && document.head.contains(aosLink)) {
                document.head.removeChild(aosLink);
            }
            if (aosScript && document.body.contains(aosScript)) {
                document.body.removeChild(aosScript);
            }
        };
    }, []);

  const promos = [
    {
      imageUrl: "/images/promo-bali.png", 
      title: "Diskon Penerbangan ke Bali",
      description: "Nikmati potongan hingga 30% untuk liburan impianmu."
    },
    {
      imageUrl: "/images/promo-jogja.png",
      title: "Promo Kereta ke Yogyakarta",
      description: "Perjalanan lebih hemat dengan cashback spesial."
    },
    {
      imageUrl: "/images/promo-whoosh.jpg",
      title: "Tiket Cepat Jakarta - Bandung",
      description: "Perjalanan super kilat dengan Whoosh hanya 30 menit."
    }
  ];

  const destinations = [
    {
      imageUrl: "/images/bali-dest.png",
      name: "Bali, Indonesia",
      price: "Rp 650.000",
      link: "/destination/bali"
    },
    {
      imageUrl: "/images/jogja-dest.png",
      name: "Yogyakarta, Indonesia",
      price: "Rp 150.000",
      link: "/destination/yogyakarta"
    },
    {
      imageUrl: "/images/tokyo-dest.png",
      name: "Tokyo, Jepang",
      price: "Rp 3.500.000",
      link: "/destination/tokyo"
    },
    {
      imageUrl: "/images/surabaya-dest.png",
      name: "Surabaya, Indonesia",
      price: "Rp 400.000",
      link: "/destination/surabaya"
    }
  ];

  // Definisikan path gambar placeholder untuk fitur (keunggulan)
  const featureIconPaths = {
    price: getIconPath('price'),
    complete: getIconPath('complete'),
    support: getIconPath('support')
  };

  const features = [
    {
        title: "Harga Terbaik",
        description: "Kami menjamin Anda mendapatkan harga paling kompetitif untuk semua rute.",
        iconPath: featureIconPaths.price
    },
    {
        title: "Pilihan Terlengkap",
        description: "Ratusan maskapai dan jaringan kereta api terintegrasi di seluruh Indonesia.",
        iconPath: featureIconPaths.complete
    },
    {
        title: "Dukungan 24/7",
        description: "Tim layanan pelanggan siap membantu Anda kapan saja, di mana saja.",
        iconPath: featureIconPaths.support
    },
  ];

  return (
    <div className="font-sans">
      {/* Hero Section */}
      <section 
        className="relative flex items-center justify-center h-[70vh] min-h-[600px] bg-cover bg-center text-white" 
        style={{ backgroundImage: "url('/images/hero-background.jpg')" }} 
      >
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative z-10 container mx-auto px-4 flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 drop-shadow-lg" data-aos="zoom-in">Mau ke mana?</h1>
          <p className="text-lg md:text-xl mb-8 drop-shadow-md" data-aos="zoom-in" data-aos-delay="300">Pesan tiket pesawat dan kereta api dengan harga terbaik!</p>
          <div data-aos="fade-up" data-aos-delay="500">
            <SearchWidget />
          </div>
        </div>
      </section>

      {/* Keunggulan Aplikasi (Why Choose Us) */}
      <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-2 text-gray-800" data-aos="fade-down">Kenapa Memilih TripGO?</h2>
              <p className="text-center text-gray-600 mb-10" data-aos="fade-down" data-aos-delay="200">Kami membuat perjalanan Anda mudah, cepat, dan terjangkau.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                  {features.map((feature, index) => (
                      <FeatureCard key={index} {...feature} />
                  ))}
              </div>
          </div>
      </section>
      
      {/* Destinasi Populer */}
      <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-2 text-[#0A58CA]" data-aos="fade-down">Destinasi Populer</h2>
              <p className="text-center text-gray-600 mb-10" data-aos="fade-down" data-aos-delay="200">Jelajahi tempat-tempat favorit dengan penawaran penerbangan dan kereta termurah.</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {destinations.map((dest, index) => (
                      <DestinationCard key={index} {...dest} delay={index * 100} />
                  ))}
              </div>
          </div>
      </section>

      {/* Promo Section */}
      <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-2 text-[#FD7E14]" data-aos="fade-down">Jangan Lewatkan Promo!</h2>
              <p className="text-center text-gray-600 mb-10" data-aos="fade-down" data-aos-delay="200">Dapatkan diskon dan penawaran terbaik hari ini.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {promos.map((promo, index) => (
                      <PromoCard key={index} {...promo} />
                  ))}
              </div>
          </div>
      </section>
      
      {/* Footer Placeholder (Opsional: untuk memberikan kesan lengkap) */}
      <footer className="bg-[#0A58CA] text-white p-8 mt-12">
        <div className="container mx-auto text-center text-sm">
            &copy; {new Date().getFullYear()} TripGO. Semua Hak Dilindungi.
        </div>
      </footer>
    </div>  
  );
}
