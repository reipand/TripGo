// app/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

// --- Kumpulan Ikon (Diubah ke Path Gambar Lokal) ---

const getIconPath = (
  name: 'plane' | 'train' | 'calendar' | 'user' | 'switch' | 'search' | 'price' | 'complete' | 'support',
  isActive: boolean = false
) => {
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
  
  const [tripType, setTripType] = useState('oneWay'); // oneWay atau roundTrip
  
  // Ambil tanggal hari ini untuk batas minimal input
  const today = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1); // minimal besok
    return d.toISOString().split('T')[0];
  }, []);

  const [trainData, setTrainData] = useState({
    origin: '',
    destination: '',
    departureDate: today, // Set default ke besok
    returnDate: '',
    passengers: '1',
    class: 'economy', // Default kelas ekonomi untuk kereta
  });

  // Data kelas kereta api
  const trainClasses = [
    { value: 'economy', label: 'Ekonomi', description: 'Harga Terjangkau' },
    { value: 'business', label: 'Bisnis', description: 'Kursi Lebih Nyaman' },
    { value: 'executive', label: 'Eksekutif', description: 'Fasilitas Premium' },
    { value: 'priority', label: 'Priority', description: 'Layanan Terbaik' },
  ];

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
    
    setTrainData(prev => ({ ...prev, [name]: value }));

    if (name === 'departureDate' && tripType === 'roundTrip' && value) {
      const departure = new Date(value);
      // Tambahkan satu hari ke tanggal berangkat untuk dijadikan tanggal pulang minimal
      const nextDay = formatDate(new Date(departure.getTime() + 86400000));
      
      // Pastikan tanggal pulang tidak mendahului tanggal pergi
      if (!trainData.returnDate || new Date(trainData.returnDate) < new Date(nextDay)) {
         setTrainData(prev => ({ ...prev, returnDate: nextDay }));
      }
    }
  };
  
  useEffect(() => {
    // Reset returnDate saat tipe perjalanan diubah menjadi sekali jalan
    if (tripType === 'oneWay') {
      setTrainData(prev => ({...prev, returnDate: ''}));
    }
  }, [tripType]);


  const handleTrainChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setTrainData({ ...trainData, [e.target.name]: e.target.value });
  };

  const handleClassChange = (className: string) => {
    setTrainData(prev => ({ ...prev, class: className }));
  };

  const handleSwitchLocations = () => {
    setTrainData(prev => ({
        ...prev,
        origin: prev.destination,
        destination: prev.origin,
    }));
  };

  const handleSearchSubmit = () => {
    const showMessage = (msg: string) => {
      alert(msg); 
    };
    
    const dataToSubmit = tripType === 'oneWay' ? { ...trainData, returnDate: '' } : trainData;
    if (!dataToSubmit.origin || !dataToSubmit.destination || !dataToSubmit.departureDate) {
      showMessage('Harap lengkapi stasiun asal, tujuan, dan tanggal berangkat.');
      return;
    }
    const query = new URLSearchParams(dataToSubmit as any).toString();
    router.push(`/search/trains?${query}`);
  };

  // Komponen untuk pilihan kelas
  const ClassSelector = () => {
    const classes = trainClasses;
    const currentClass = trainData.class;

    return (
      <div className="lg:col-span-1">
        <label className="text-gray-800 text-sm font-medium">Kelas</label>
        <div className="mt-1 relative">
          <select 
            name="class"
            value={currentClass}
            onChange={handleTrainChange}
            className="w-full bg-white p-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 appearance-none pr-8"
          >
            {classes.map((classOption) => (
              <option key={classOption.value} value={classOption.value}>
                {classOption.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        
        {/* Quick Class Selection */}
        <div className="mt-2 flex flex-wrap gap-1">
          {classes.map((classOption) => (
            <button
              key={classOption.value}
              type="button"
              onClick={() => handleClassChange(classOption.value)}
              className={`px-2 py-1 text-xs rounded-full border transition-colors duration-200 ${
                currentClass === classOption.value
                  ? 'bg-blue-100 text-blue-700 border-blue-300 font-medium'
                  : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
              }`}
            >
              {classOption.label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderForm = () => {
    const data = trainData;
    const genericHandler = handleTrainChange;
    
    const gridCols = tripType === 'roundTrip' ? 'lg:grid-cols-5' : 'lg:grid-cols-4';

    // Menghitung minDate untuk Tanggal Pulang
    const minReturnDate = data.departureDate ? formatDate(new Date(new Date(data.departureDate).getTime() + 86400000)) : today;

    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 ${gridCols} gap-4 items-end`}>
        <>
            <div className="lg:col-span-1">
                <label className="text-gray-800 text-sm font-medium">Asal</label>
                <div className="flex items-center bg-white p-2 rounded-md border border-gray-200 mt-1">
                    <input 
                      type="text" 
                      name="origin" 
                      value={data.origin} 
                      onChange={genericHandler} 
                      placeholder="Stasiun Asal" 
                      className="bg-transparent w-full focus:outline-none placeholder-gray-400 text-gray-900" 
                    />
                </div>
            </div>
            <div className="lg:col-span-1 relative">
                <label className="text-gray-800 text-sm font-medium">Tujuan</label>
                <div className="flex items-center bg-white p-2 rounded-md border border-gray-200 mt-1">
                    <input 
                      type="text" 
                      name="destination" 
                      value={data.destination} 
                      onChange={genericHandler} 
                      placeholder="Stasiun Tujuan" 
                      className="bg-transparent w-full focus:outline-none placeholder-gray-400 text-gray-900" 
                    />
                </div>
                {/* Switch icon untuk kereta api diletakkan di tengah antara Asal dan Tujuan */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-1 z-10" onClick={handleSwitchLocations}>
                     <SwitchIcon onClick={() => {}} />
                </div>
            </div>
        </>
        
        <div>
          <label className="text-gray-800 text-sm font-medium">Tanggal Pergi</label>
          <div className="flex items-center bg-white p-2 rounded-md border border-gray-200 mt-1">
            <CalendarIcon />
            <input 
              type="date" 
              name="departureDate" 
              value={data.departureDate} 
              onChange={handleDateChange} 
              min={today} 
              className="bg-transparent w-full focus:outline-none ml-2 text-gray-900"
            />
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

        <div className={tripType === 'roundTrip' && !false ? 'lg:col-start-5' : ''}>
          <label className="text-gray-800 text-sm font-medium">Penumpang</label>
          <div className="flex items-center bg-white p-2 rounded-md border border-gray-200 mt-1">
              <UserIcon />
              <input 
                type="number" 
                name="passengers" 
                value={data.passengers} 
                onChange={genericHandler} 
                placeholder="Jumlah Penumpang" 
                min="1"
                max="9"
                className="bg-transparent w-full focus:outline-none ml-2 placeholder-gray-400 text-gray-900" 
              />
          </div>
        </div>

        {/* Kelas Selection - Always visible */}
        <ClassSelector />
      </div>
    );
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-5xl">
      <div className="flex border-b border-gray-200 mb-4">
            {/* TAB KERETA API */}
            <button
              className={`flex items-center pb-3 pt-1 px-4 text-base font-semibold transition-colors duration-300 border-b-2 border-[#0A58CA] text-[#0A58CA]`}
            >
              <TrainIcon isActive={true} />
              <span>Kereta Api KAI</span>
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
          <button 
            onClick={handleSearchSubmit} 
            className="w-full md:w-auto px-10 py-3 bg-[#FD7E14] text-white font-bold text-lg rounded-full hover:bg-[#E06700] transition-colors duration-300 flex items-center justify-center shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40"
          >
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
const PromoCard = ({ imageUrl, title, description, discount, validUntil, tag }: { 
  imageUrl: string; 
  title: string; 
  description: string;
  discount: string;
  validUntil: string;
  tag: string;
}) => (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-100 group cursor-pointer" data-aos="fade-right">
        <div className="relative h-40 overflow-hidden">
            <img 
                src={imageUrl} 
                alt={title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                loading="lazy"
            />
            {/* Discount Badge */}
            <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                {discount}
            </div>
            {/* Tag */}
            <div className="absolute top-3 right-3 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                {tag}
            </div>
            {/* Gradient Overlay */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/50 to-transparent"></div>
        </div>
        
        <div className="p-5">
            <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-lg text-gray-900 group-hover:text-[#0A58CA] transition-colors duration-300 flex-1 pr-2">{title}</h3>
                <div className="bg-green-50 text-green-600 text-xs px-2 py-1 rounded-full font-medium">
                    Tersedia
                </div>
            </div>
            <p className="text-gray-600 text-sm mb-3 leading-relaxed">{description}</p>
            
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center text-gray-500 text-xs">
                    <CalendarIcon />
                    <span className="ml-1">Berlaku hingga {validUntil}</span>
                </div>
                <button className="bg-[#FD7E14] hover:bg-[#E06700] text-white text-sm px-4 py-2 rounded-full font-medium transition-colors duration-300 flex items-center">
                    Klaim Sekarang
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>
    </div>
);


// --- Komponen Kartu Destinasi Populer ---
const DestinationCard = ({ imageUrl, name, price, rating, reviews, delay }: { 
  imageUrl: string; 
  name: string; 
  price: string; 
  rating: number;
  reviews: string;
  delay: number;
}) => (
    <div className="group cursor-pointer" data-aos="fade-up" data-aos-delay={delay}>
        <div className="relative overflow-hidden rounded-2xl h-64 shadow-sm hover:shadow-xl transition-all duration-500">
            <img 
                src={imageUrl} 
                alt={name} 
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-5 flex flex-col justify-end">
                {/* Rating Badge */}
                <div className="flex items-center mb-2">
                    <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-1">
                        <StarIcon className="w-4 h-4 text-yellow-400" />
                        <span className="text-white text-sm font-semibold">{rating}</span>
                        <span className="text-white/80 text-xs">({reviews})</span>
                    </div>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-1">{name}</h3>
                <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-amber-400">{price}</p>
                    <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full transition-colors duration-300">
                        Lihat Detail
                    </button>
                </div>
            </div>
            
            {/* Hover Effect Overlay */}
            <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
    </div>
);

// --- Komponen Kartu Keunggulan (Why Choose Us) ---
const FeatureCard = ({ title, description, iconPath, delay }: { 
  title: string; 
  description: string; 
  iconPath: string;
  delay?: number;
}) => (
    <div className="p-6 text-center bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group" 
         data-aos="fade-up" 
         data-aos-delay={delay}>
        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl text-[#0A58CA] mb-4 inline-flex group-hover:scale-110 transition-transform duration-300">
            <img src={iconPath} alt={`Ikon ${title}`} className="h-8 w-8"/>
        </div>
        <h3 className="font-bold text-lg mb-3 text-gray-900 group-hover:text-[#0A58CA] transition-colors duration-300">{title}</h3>
        <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
    </div>
);
// Komponen Langkah Pemesanan
const StepCard = ({ number, title, description, icon }: { 
  number: number; 
  title: string; 
  description: string;
  icon: React.ReactNode;
}) => (
  <div className="text-center group" data-aos="fade-up">
    <div className="relative mb-6">
      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg">
        <div className="text-white font-bold text-xl">{number}</div>
      </div>
      <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
        {icon}
      </div>
    </div>
    <h3 className="font-bold text-lg text-gray-900 mb-3">{title}</h3>
    <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
  </div>
);

// Komponen Testimonial
const TestimonialCard = ({ name, location, rating, comment, avatar }: { 
  name: string; 
  location: string; 
  rating: number;
  comment: string;
  avatar: string;
}) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300" data-aos="fade-up">
    <div className="flex items-center mb-4">
      <img src={avatar} alt={name} className="w-12 h-12 rounded-full object-cover" />
      <div className="ml-4">
        <h4 className="font-semibold text-gray-900">{name}</h4>
        <p className="text-gray-500 text-sm">{location}</p>
      </div>
    </div>
    <div className="flex items-center mb-3">
      {[...Array(5)].map((_, i) => (
        <StarIcon 
          key={i} 
          className={`w-4 h-4 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`} 
        />
      ))}
      <span className="text-gray-600 text-sm ml-2">{rating}.0</span>
    </div>
    <p className="text-gray-700 text-sm leading-relaxed">"{comment}"</p>
  </div>
);

// Komponen Blog Card
const BlogCard = ({ imageUrl, title, excerpt, date, readTime, category }: { 
  imageUrl: string; 
  title: string; 
  excerpt: string;
  date: string;
  readTime: string;
  category: string;
}) => (
  <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group cursor-pointer" data-aos="fade-up">
    <div className="relative h-48 overflow-hidden">
      <img 
        src={imageUrl} 
        alt={title} 
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      <div className="absolute top-3 left-3 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
        {category}
      </div>
    </div>
    <div className="p-6">
      <div className="flex items-center text-gray-500 text-sm mb-3">
        <span>{date}</span>
        <span className="mx-2">•</span>
        <span>{readTime} dibaca</span>
      </div>
      <h3 className="font-bold text-lg text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300 line-clamp-2">
        {title}
      </h3>
      <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
        {excerpt}
      </p>
      <button className="mt-4 text-blue-600 text-sm font-semibold hover:text-blue-800 transition-colors duration-300 flex items-center">
        Baca Selengkapnya
        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  </div>
);

// Komponen Partner Logo
const PartnerLogo = ({ name, logoUrl }: { name: string; logoUrl: string }) => (
  <div className="bg-white rounded-xl p-6 flex items-center justify-center border border-gray-200 hover:shadow-md transition-all duration-300 group" data-aos="fade-up">
    <img 
      src={logoUrl} 
      alt={name} 
      className="h-8 object-contain opacity-70 group-hover:opacity-100 transition-opacity duration-300 grayscale group-hover:grayscale-0"
    />
  </div>
);

// Komponen FAQ Item
const FAQItem = ({ question, answer, isOpen, onClick }: { 
  question: string; 
  answer: string; 
  isOpen: boolean; 
  onClick: () => void;
}) => (
  <div className="border border-gray-200 rounded-2xl hover:shadow-md transition-all duration-300" data-aos="fade-up">
    <button 
      className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-50 rounded-2xl transition-colors duration-300"
      onClick={onClick}
    >
      <span className="font-semibold text-gray-900 text-lg pr-4">{question}</span>
      <svg 
        className={`w-6 h-6 text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
    {isOpen && (
      <div className="px-6 pb-5">
        <p className="text-gray-600 leading-relaxed">{answer}</p>
      </div>
    )}
  </div>
);

// --- Komponen Halaman Utama ---

declare global {
    interface Window {
        AOS: any;
    }
}

// Ikon Bintang untuk Rating
const StarIcon = ({ className = "" }: { className?: string }) => (
    <svg className={`w-5 h-5 ${className}`} fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
    </svg>
);

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

    // State untuk FAQ
    const [openFAQ, setOpenFAQ] = useState<number | null>(0);

    // Data untuk Langkah Pemesanan
    const steps = [
        {
            number: 1,
            title: "Cari & Pilih",
            description: "Temukan tiket kereta KAI dengan harga terbaik sesuai kebutuhan perjalananmu",
            icon: "🔍"
        },
        {
            number: 2,
            title: "Pesan & Bayar",
            description: "Lakukan pemesanan dan pembayaran dengan metode yang aman dan terpercaya",
            icon: "💳"
        },
        {
            number: 3,
            title: "Konfirmasi",
            description: "Dapatkan konfirmasi instan dan e-ticket langsung ke email dan WhatsApp kamu",
            icon: "✅"
        },
        {
            number: 4,
            title: "Naik Kereta!",
            description: "Tunjukkan e-ticket dan nikmati perjalanan nyaman dengan kereta api KAI",
            icon: "🚂"
        }
    ];

    // Data untuk Testimonial
    const testimonials = [
        {
            name: "Sarah Wijaya",
            location: "Jakarta",
            rating: 5,
            comment: "Proses pemesanan tiket kereta KAI sangat mudah dan cepat. Harga yang ditawarkan juga kompetitif. Sudah beberapa kali naik kereta dari Jakarta ke Bandung, selalu lancar!",
            avatar: "/images/avatars/avatar1.jpg"
        },
        {
            name: "Budi Santoso",
            location: "Surabaya",
            rating: 5,
            comment: "Customer service TripGO sangat responsif. Waktu ada perubahan jadwal kereta, langsung dibantu dengan cepat dan ramah. Pengalaman yang memuaskan!",
            avatar: "/images/avatars/avatar2.jpg"
        },
        {
            name: "Maya Sari",
            location: "Bandung",
            rating: 4,
            comment: "Aplikasinya user friendly dan sering ada promo menarik untuk kereta api. Sudah beberapa kali pesan tiket KAI dan Whoosh, selalu lancar dan tepat waktu.",
            avatar: "/images/avatars/avatar3.jpg"
        },
        {
            name: "Rizki Pratama",
            location: "Yogyakarta",
            rating: 5,
            comment: "Harga garansi terbaiknya beneran work! Dapat refund selisih harga setelah booking tiket kereta. TripGO memang the best untuk travel Indonesia!",
            avatar: "/images/avatars/avatar4.jpg"
        }
    ];

    // Data untuk Blog & Tips
    const blogPosts = [
        {
            imageUrl: "/images/blog/train-schedule.jpg",
            title: "Panduan Lengkap Jadwal Kereta Api KAI 2025",
            excerpt: "Jadwal terbaru kereta api KAI untuk seluruh rute di Indonesia. Update informasi terbaru untuk perjalanan Anda.",
            date: "15 Nov 2024",
            readTime: "5 min",
            category: "Jadwal Kereta"
        },
        {
            imageUrl: "/images/blog/whoosh-guide.jpg",
            title: "Panduan Lengkap Naik Kereta Cepat Whoosh Jakarta-Bandung",
            excerpt: "Semua yang perlu kamu tahu tentang pengalaman naik kereta cepat Whoosh, dari booking sampai fasilitas di dalam kereta.",
            date: "10 Nov 2024",
            readTime: "7 min",
            category: "Transportasi"
        },
        {
            imageUrl: "/images/blog/train-packing.jpg",
            title: "Cara Packing Efisien untuk Perjalanan Kereta Api",
            excerpt: "Optimalkan koper kamu untuk perjalanan kereta api. Tips packing smart untuk perjalanan nyaman tanpa kelebihan bagasi.",
            date: "5 Nov 2024",
            readTime: "4 min",
            category: "Tips Travel"
        }
    ];

    // Data untuk Partner
    const partners = [
        { name: "Kereta Api Indonesia", logoUrl: "/images/partners/kai.png" },
        { name: "Whoosh", logoUrl: "/images/partners/whoosh.png" },
        { name: "Argo Parahyangan", logoUrl: "/images/partners/argo.png" },
        { name: "Taksaka", logoUrl: "/images/partners/taksaka.png" },
        { name: "Mutiara Selatan", logoUrl: "/images/partners/mutiara.png" },
        { name: "Lodaya", logoUrl: "/images/partners/lodaya.png" },
        { name: "Jayabaya", logoUrl: "/images/partners/jayabaya.png" },
        { name: "Gajayana", logoUrl: "/images/partners/gajayana.png" }
    ];

    // Data untuk FAQ
    const faqs = [
        {
            question: "Bagaimana cara memesan tiket kereta api di TripGO?",
            answer: "Pemesanan tiket kereta api di TripGO sangat mudah. Pilih stasiun asal dan tujuan, tentukan tanggal keberangkatan, pilih jadwal yang tersedia, lalu lakukan pembayaran. Anda akan menerima e-ticket via email dan WhatsApp."
        },
        {
            question: "Apakah harga di TripGO sudah termasuk semua biaya?",
            answer: "Ya, semua harga yang ditampilkan di TripGO untuk tiket kereta api sudah termasuk pajak dan biaya tambahan lainnya. Tidak ada biaya tersembunyi, yang Anda lihat adalah yang Anda bayar."
        },
        {
            question: "Bagaimana jika ingin mengubah atau membatalkan tiket kereta?",
            answer: "Anda dapat mengubah atau membatalkan tiket kereta melalui dashboard akun Anda. Syarat dan ketentuan mengikuti kebijakan KAI. Biaya pembatalan mungkin berlaku tergantung waktu pembatalan."
        },
        {
            question: "Apakah ada garansi harga terbaik untuk tiket kereta?",
            answer: "Ya, TripGO memberikan garansi harga terbaik untuk tiket kereta api. Jika Anda menemukan harga yang lebih murah untuk rute dan tanggal yang sama, kami akan refund selisihnya sesuai dengan syarat dan ketentuan yang berlaku."
        },
        {
            question: "Kereta api mana saja yang bisa dipesan di TripGO?",
            answer: "TripGO menyediakan tiket untuk semua jenis kereta api KAI, termasuk kereta cepat Whoosh, Argo Parahyangan, Taksaka, dan berbagai kereta ekonomi lainnya yang melayani seluruh Indonesia."
        }
    ];

  // Data untuk Promo
    const promos = [
        {
            imageUrl: "/images/promo-jakarta-bandung.png", 
            title: "Flash Sale Jakarta-Bandung - Diskon Hingga 50%",
            description: "Raih tiket kereta Jakarta-Bandung dengan harga spesial. Terbatas hanya untuk 100 pembeli pertama!",
            discount: "50% OFF",
            validUntil: "30 Des 2024",
            tag: "Flash Sale"
        },
        {
            imageUrl: "/images/promo-kai-cashback.png",
            title: "Cashback Kereta Api KAI 100%",
            description: "Dapatkan cashback hingga Rp 100.000 untuk perjalanan kereta api KAI di seluruh Indonesia",
            discount: "100% CB",
            validUntil: "25 Des 2024",
            tag: "Cashback"
        },
        {
            imageUrl: "/images/promo-whoosh.jpg",
            title: "Whoosh Exclusive - Harga Spesial",
            description: "Nikmati perjalanan super cepat Jakarta-Bandung dengan harga promo khusus member",
            discount: "30% OFF",
            validUntil: "31 Des 2024",
            tag: "Exclusive"
        },
        {
            imageUrl: "/images/promo-kai-family.png",
            title: "Paket Keluarga KAI - Hemat hingga 40%",
            description: "Diskon spesial untuk perjalanan keluarga dengan kereta api KAI. Minimum 3 orang",
            discount: "40% OFF",
            validUntil: "15 Jan 2025",
            tag: "Family"
        }
    ];


  // Data untuk Destinasi Populer
    const destinations = [
        {
            imageUrl: "/images/bandung-dest.png",
            name: "Bandung",
            price: "Rp 150rb",
            rating: 4.8,
            reviews: "12.5rb",
            delay: 0
        },
        {
            imageUrl: "/images/jogja-dest.png",
            name: "Yogyakarta",
            price: "Rp 250rb",
            rating: 4.7,
            reviews: "8.2rb",
            delay: 100
        },
        {
            imageUrl: "/images/surabaya-dest.png",
            name: "Surabaya",
            price: "Rp 300rb",
            rating: 4.9,
            reviews: "15.1rb",
            delay: 200
        },
        {
            imageUrl: "/images/semarang-dest.png",
            name: "Semarang",
            price: "Rp 200rb",
            rating: 4.6,
            reviews: "6.8rb",
            delay: 300
        },
        {
            imageUrl: "/images/malang-dest.png",
            name: "Malang",
            price: "Rp 350rb",
            rating: 4.8,
            reviews: "9.3rb",
            delay: 400
        },
        {
            imageUrl: "/images/solo-dest.png",
            name: "Solo",
            price: "Rp 180rb",
            rating: 4.7,
            reviews: "7.2rb",
            delay: 500
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
            title: "Harga Terjamin Terbaik",
            description: "Garansi harga terbaik dengan fitur price alert dan notifikasi penurunan harga",
            iconPath: getIconPath('price'),
            delay: 0
        },
        {
            title: "Seluruh Jaringan KAI",
            description: "Akses ke seluruh jaringan kereta api KAI di Indonesia dalam satu platform",
            iconPath: getIconPath('complete'),
            delay: 100
        },
        {
            title: "Pembayaran Aman",
            description: "Transaksi dienkripsi dengan sistem keamanan berlapis dan garansi uang kembali",
            iconPath: getIconPath('support'),
            delay: 200
        },
        {
            title: "Dukungan 24/7",
            description: "Customer service siap membantu kapan saja melalui chat, telepon, dan email",
            iconPath: getIconPath('support'),
            delay: 300
        }
    ];

    

    return (
        <div className="font-sans bg-gray-50">
            {/* Hero Section */}
            <section 
                className="relative flex items-center justify-center h-[70vh] min-h-[600px] bg-cover bg-center text-white" 
                style={{ backgroundImage: "url('/images/hero-background.jpg')" }} 
            >
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/40"></div>
                <div className="relative z-10 container mx-auto px-4 flex flex-col items-center text-center">
                    <h1 className="text-4xl md:text-6xl font-extrabold mb-4 drop-shadow-lg" data-aos="zoom-in">Mau ke mana?</h1>
                    <p className="text-lg md:text-xl mb-8 drop-shadow-md max-w-2xl" data-aos="zoom-in" data-aos-delay="300">
                        Pesan tiket kereta api KAI dengan harga terbaik. Perjalananmu, prioritas kami.
                    </p>
                    <div data-aos="fade-up" data-aos-delay="500" className="w-full max-w-5xl">
                        <SearchWidget />
                    </div>
                </div>
            </section>

            {/* Keunggulan Aplikasi (Why Choose Us) */}
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-3" data-aos="fade-down">
                            Kenapa Memilih TripGO?
                        </h2>
                        <p className="text-gray-600 text-lg max-w-2xl mx-auto" data-aos="fade-down" data-aos-delay="200">
                            Platform travel terpercaya dengan jutaan pelanggan puas di seluruh Indonesia
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                        {features.map((feature, index) => (
                            <FeatureCard key={index} {...feature} />
                        ))}
                    </div>
                    
                    {/* Stats Section */}
                    <div className="mt-16 bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                            <div data-aos="fade-up">
                                <div className="text-3xl font-bold mb-2">5Jt+</div>
                                <div className="text-blue-100">Pengguna Aktif</div>
                            </div>
                            <div data-aos="fade-up" data-aos-delay="100">
                                <div className="text-3xl font-bold mb-2">50+</div>
                                <div className="text-blue-100">Stasiun Kereta</div>
                            </div>
                            <div data-aos="fade-up" data-aos-delay="200">
                                <div className="text-3xl font-bold mb-2">100+</div>
                                <div className="text-blue-100">Rute Harian</div>
                            </div>
                            <div data-aos="fade-up" data-aos-delay="300">
                                <div className="text-3xl font-bold mb-2">24/7</div>
                                <div className="text-blue-100">Layanan Support</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            
            {/* Destinasi Populer */}
            <section className="py-16 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-2" data-aos="fade-down">
                                Destinasi Populer
                            </h2>
                            <p className="text-gray-600" data-aos="fade-down" data-aos-delay="200">
                                Temukan inspirasi perjalanan ke tempat-tempat favorit
                            </p>
                        </div>
                        <button className="hidden md:flex items-center text-blue-600 font-semibold hover:text-blue-800 transition-colors duration-300" data-aos="fade-left">
                            Lihat Semua
                            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                        {destinations.map((destination, index) => (
                            <DestinationCard key={index} {...destination} />
                        ))}
                    </div>
                    
                    <div className="text-center mt-8 md:hidden">
                        <button className="bg-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-700 transition-colors duration-300">
                            Lihat Semua Destinasi
                        </button>
                    </div>
                </div>
            </section>

            {/* Promo Section */}
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-2" data-aos="fade-down">
                                Penawaran Spesial
                            </h2>
                            <p className="text-gray-600" data-aos="fade-down" data-aos-delay="200">
                                Jangan lewatkan promo dan diskon menarik untuk perjalananmu
                            </p>
                        </div>
                        <button className="hidden md:flex items-center text-blue-600 font-semibold hover:text-blue-800 transition-colors duration-300" data-aos="fade-left">
                            Lihat Semua Promo
                            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {promos.map((promo, index) => (
                            <PromoCard key={index} {...promo} />
                        ))}
                    </div>
                    
                    
                    {/* Banner Promo Besar */}
                    <div className="mt-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-8 text-white relative overflow-hidden" data-aos="zoom-in">
                        <div className="relative z-10 max-w-2xl">
                            <h3 className="text-2xl font-bold mb-3">Super Sale Akhir Tahun! 🚂</h3>
                            <p className="text-orange-100 mb-4 text-lg">
                                Dapatkan diskon hingga 70% untuk semua rute kereta api KAI domestik
                            </p>
                            <div className="flex items-center space-x-4">
                                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                                    <div className="text-sm">Berlaku hingga</div>
                                    <div className="font-bold">31 Desember 2025</div>
                                </div>
                                <button className="bg-white text-orange-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors duration-300">
                                    Lihat Promo
                                </button>
                            </div>
                        </div>
                        {/* Background Pattern */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
                        <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 translate-x-24"></div>
                    </div>
                      {/* === SECTION 5: Langkah Pemesanan === */}
            <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-3" data-aos="fade-down">
                            Mudah & Cepat dalam 4 Langkah
                        </h2>
                        <p className="text-gray-600 text-lg max-w-2xl mx-auto" data-aos="fade-down" data-aos-delay="200">
                            Proses pemesanan tiket yang simpel dan tanpa ribet
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
                        {steps.map((step, index) => (
                            <StepCard key={index} {...step} />
                        ))}
                    </div>
                    
                    <div className="text-center mt-12" data-aos="fade-up">
                        <button className="bg-blue-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-blue-700 transition-colors duration-300 shadow-lg">
                            Mulai Pesan Tiket Sekarang
                        </button>
                    </div>
                </div>
            </section>

            {/* === SECTION 6: Testimonial & Review === */}
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-3" data-aos="fade-down">
                            Kata Mereka yang Sudah Percaya
                        </h2>
                        <p className="text-gray-600 text-lg max-w-2xl mx-auto" data-aos="fade-down" data-aos-delay="200">
                            Ribuan traveler telah merasakan kemudahan booking dengan TripGO
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                        {testimonials.map((testimonial, index) => (
                            <TestimonialCard key={index} {...testimonial} />
                        ))}
                    </div>
                    
                    {/* Rating Summary */}
                    <div className="mt-12 bg-gray-50 rounded-2xl p-8 max-w-2xl mx-auto" data-aos="fade-up">
                        <div className="flex flex-col md:flex-row items-center justify-between text-center md:text-left">
                            <div className="mb-6 md:mb-0">
                                <div className="text-4xl font-bold text-gray-900 mb-2">4.9/5</div>
                                <div className="flex items-center justify-center md:justify-start">
                                    {[...Array(5)].map((_, i) => (
                                        <StarIcon key={i} className="w-6 h-6 text-yellow-400" />
                                    ))}
                                </div>
                                <div className="text-gray-600 mt-2">Berdasarkan 12.458 review</div>
                            </div>
                            <div className="text-center md:text-right">
                                <div className="text-2xl font-bold text-gray-900 mb-2">98%</div>
                                <div className="text-gray-600">Traveler Merekomendasikan</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* === SECTION 7: Blog & Tips Perjalanan === */}
            <section className="py-16 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-2" data-aos="fade-down">
                                Tips & Panduan Perjalanan
                            </h2>
                            <p className="text-gray-600" data-aos="fade-down" data-aos-delay="200">
                                Artikel terbaru untuk membuat perjalananmu lebih menyenangkan
                            </p>
                        </div>
                        <button className="hidden md:flex items-center text-blue-600 font-semibold hover:text-blue-800 transition-colors duration-300" data-aos="fade-left">
                            Lihat Semua Artikel
                            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {blogPosts.map((post, index) => (
                            <BlogCard key={index} {...post} />
                        ))}
                    </div>
                    
                    <div className="text-center mt-8 md:hidden">
                        <button className="bg-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-700 transition-colors duration-300">
                            Lihat Semua Artikel
                        </button>
                    </div>
                </div>
            </section>

            {/* === SECTION 8: Partner & Maskapai === */}
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-3" data-aos="fade-down">
                            Partner Terpercaya Kami
                        </h2>
                        <p className="text-gray-600 text-lg max-w-2xl mx-auto" data-aos="fade-down" data-aos-delay="200">
                            Bekerjasama dengan maskapai dan penyedia transportasi terbaik
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                        {partners.map((partner, index) => (
                            <PartnerLogo key={index} {...partner} />
                        ))}
                    </div>
                </div>
            </section>

            {/* === SECTION 9: FAQ (Pertanyaan Umum) === */}
            <section className="py-16 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-3" data-aos="fade-down">
                            Pertanyaan yang Sering Ditanyakan
                        </h2>
                        <p className="text-gray-600 text-lg max-w-2xl mx-auto" data-aos="fade-down" data-aos-delay="200">
                            Temukan jawaban untuk pertanyaan umum seputar TripGO
                        </p>
                    </div>
                    
                    <div className="max-w-3xl mx-auto space-y-4">
                        {faqs.map((faq, index) => (
                            <FAQItem 
                                key={index}
                                question={faq.question}
                                answer={faq.answer}
                                isOpen={openFAQ === index}
                                onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                            />
                        ))}
                    </div>
                    
                    <div className="text-center mt-12" data-aos="fade-up">
                        <div className="bg-white rounded-2xl p-8 max-w-2xl mx-auto shadow-sm">
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Masih ada pertanyaan?</h3>
                            <p className="text-gray-600 mb-6">Tim customer service kami siap membantu Anda 24/7</p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button className="bg-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-700 transition-colors duration-300">
                                    💬 Chat Sekarang
                                </button>
                                <button className="border border-blue-600 text-blue-600 px-6 py-3 rounded-full font-semibold hover:bg-blue-50 transition-colors duration-300">
                                    📞 Hubungi Kami
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* === SECTION 10: Download App === */}
            {/* <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col lg:flex-row items-center justify-between max-w-6xl mx-auto">
                        <div className="lg:w-1/2 mb-8 lg:mb-0 text-center lg:text-left" data-aos="fade-right">
                            <h2 className="text-3xl font-bold mb-4">Download Aplikasi TripGO</h2>
                            <p className="text-blue-100 text-lg mb-6 leading-relaxed">
                                Dapatkan pengalaman booking yang lebih baik dengan fitur eksklusif hanya di aplikasi mobile. Pesan tiket lebih cepat, akses promo spesial, dan nikmati kemudahan dalam genggaman.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors duration-300 flex items-center justify-center">
                                    <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                                        <path fill="currentColor" d="M17.924 17.315c-.518.987-1.151 1.893-1.895 2.717-.876.99-1.592 1.67-2.145 2.037-.747.49-1.549.74-2.405.74-.825 0-1.517-.2-2.073-.598-.556-.399-.976-.927-1.26-1.585-.283-.658-.425-1.435-.425-2.33 0-.958.182-1.858.546-2.701.364-.843.86-1.586 1.488-2.23.628-.644 1.34-1.157 2.136-1.539.796-.382 1.62-.573 2.473-.573.825 0 1.488.155 1.988.465.5.31.868.688 1.105 1.135-.99.49-1.767 1.155-2.33 2-.563.845-.844 1.818-.844 2.92 0 .99.251 1.858.752 2.604.287.41.64.758 1.06 1.044.42.287.882.5 1.388.64.405.124.81.186 1.215.186.658 0 1.287-.108 1.888-.326.6-.218 1.13-.517 1.59-.897-.66-.99-1.18-1.94-1.56-2.85-.38-.91-.57-1.82-.57-2.73 0-1.303.38-2.42 1.14-3.35.76-.93 1.71-1.58 2.85-1.95-.99-1.47-2.38-2.24-4.17-2.33-.66-.02-1.45.12-2.37.42-.92.3-1.71.62-2.37.96-.66.34-1.21.66-1.65.96-.44.3-.78.54-1.02.72-.24.18-.44.33-.6.45-.16.12-.28.21-.36.27l-.36-1.08c.12-.08.28-.19.48-.33.2-.14.44-.3.72-.48.28-.18.6-.38.96-.6.36-.22.78-.45 1.26-.69.48-.24 1.02-.47 1.62-.69.6-.22 1.28-.41 2.04-.57.76-.16 1.62-.24 2.58-.24 1.64 0 3.02.31 4.14.93 1.12.62 1.98 1.46 2.58 2.52.6 1.06.9 2.25.9 3.57 0 .94-.16 1.86-.48 2.76-.32.9-.78 1.76-1.38 2.58z"/>
                                    </svg>
                                    Download di App Store
                                </button>
                                <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors duration-300 flex items-center justify-center">
                                    <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                                        <path fill="currentColor" d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 10.937a.995.995 0 01-.61-.92V2.734a1 1 0 01.609-.92l10.938 10.937zm-.92-.92L4.734 1.814H19.266l-5.587 5.587z"/>
                                    </svg>
                                    Download di Play Store
                                </button>
                            </div>
                        </div>
                        <div className="lg:w-2/5 relative" data-aos="fade-left">
                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                                <h3 className="font-bold text-xl mb-4">Keuntungan di Aplikasi:</h3>
                                <ul className="space-y-3 text-blue-100">
                                    <li className="flex items-center space-x-3">
                                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                        <span>Promo dan voucher eksklusif</span>
                                    </li>
                                    <li className="flex items-center space-x-3">
                                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                        <span>Notifikasi harga terbaik</span>
                                    </li>
                                    <li className="flex items-center space-x-3">
                                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                        <span>Pemesanan lebih cepat</span>
                                    </li>
                                    <li className="flex items-center space-x-3">
                                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                        <span>Riwayat pemesanan mudah</span>
                                    </li>
                                    <li className="flex items-center space-x-3">
                                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                        <span>Fitur wishlist destinasi</span>
                                    </li>
                                    <li className="flex items-center space-x-3">
                                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                        <span>Offline access untuk tiket</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section> */}
                    
                    <div className="text-center mt-8 md:hidden">
                        <button className="bg-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-700 transition-colors duration-300">
                            Lihat Semua Promo
                        </button>
                    </div>
                </div>
            </section>
            
            
            {/* Footer */}
            {/* <footer className="bg-[#0A58CA] text-white p-8 mt-12">
                <div className="container mx-auto text-center text-sm">
                    &copy; {new Date().getFullYear()} TripGO. Semua Hak Dilindungi.
                </div>
            </footer> */}
        </div>  
    );
}