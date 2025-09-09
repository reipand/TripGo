'use client'; // Diperlukan karena kita akan menggunakan state dan hooks

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

// --- Kumpulan Ikon SVG ---

const SearchIcon = () => (
  <svg className="h-5 w-5 text-white absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const ChevronDownIcon = () => (
    <svg className="h-4 w-4 ml-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);

const HamburgerIcon = () => (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
    </svg>
);

const CloseIcon = () => (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);


// --- Komponen Navbar Utama ---

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  // State dan data untuk search suggestions
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  
  const allDestinations = [
    'Bali, Indonesia',
    'Yogyakarta, Indonesia',
    'Jakarta, Indonesia',
    'Surabaya, Indonesia',
    'Bandung, Indonesia',
    'Raja Ampat, Indonesia',
    'Labuan Bajo, Indonesia',
  ];

  // Fungsi untuk menangani perubahan input dan memfilter saran
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length > 1) {
        const filteredSuggestions = allDestinations.filter(dest =>
            dest.toLowerCase().includes(query.toLowerCase())
        );
        setSuggestions(filteredSuggestions);
        setIsSuggestionsOpen(true);
    } else {
        setSuggestions([]);
        setIsSuggestionsOpen(false);
    }
  };
  
  // Fungsi untuk menangani klik pada saran
  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setIsSuggestionsOpen(false);
    router.push(`/search?q=${encodeURIComponent(suggestion.trim())}`);
  };

  // Fungsi untuk menangani pencarian via "Enter"
  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim() !== '') {
      setIsSuggestionsOpen(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };
  
  // Fungsi untuk menutup dropdown saat input kehilangan fokus
  const handleBlur = () => {
    setTimeout(() => {
        setIsSuggestionsOpen(false);
    }, 150); // Delay untuk memungkinkan event klik pada saran
  };

  return (
    <nav className="bg-gradient-to-r from-[#0A58CA] to-[#0548AD] p-4 text-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        
        <Link href="/" className="flex items-center">
          <Image
            src="/images/logo_tg2.svg"
            alt="TripGo Logo"
            width={120}
            height={32}
            priority
          />
        </Link>

        {/* Search Bar dengan Suggestions */}
        <div className="hidden lg:flex relative flex-grow mx-8 max-w-lg">
          <input
            type="text"
            placeholder="Cari destinasi..."
            value={searchQuery}
            onChange={handleInputChange}
            onKeyDown={handleSearch}
            onBlur={handleBlur}
            onFocus={handleInputChange} // Tampilkan lagi saran saat fokus
            className="w-full py-2 pl-10 pr-4 rounded-full bg-white bg-opacity-20 border border-white border-opacity-30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 text-white placeholder-white placeholder-opacity-70 transition-all duration-300"
          />
          <SearchIcon />
          {isSuggestionsOpen && suggestions.length > 0 && (
            <div className="absolute top-full mt-2 w-full bg-white rounded-md shadow-lg py-1 z-30">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Navigasi Tengah (Desktop) */}
        <div className="hidden md:flex items-center space-x-6">
          <Link href="/pesawat" className="hover:text-gray-200 transition-colors duration-200">Pesawat</Link>
          <Link href="/kereta" className="hover:text-gray-200 transition-colors duration-200">Kereta</Link>
          <Link href="/todo" className="hover:text-gray-200 transition-colors duration-200">To Do</Link>
          
          <div className="relative">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
              className="flex items-center text-[#E9ECEF] hover:text-white transition-colors duration-200 focus:outline-none"
            >
              Lainnya <ChevronDownIcon />
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20">
                <Link href="/promo" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Promo</Link>
                <Link href="/pusat-bantuan" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Pusat Bantuan</Link>
                <Link href="/blog" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Blog</Link>
              </div>
            )}
          </div>
        </div>

        {/* Tombol Masuk & Daftar (Desktop) */}
        <div className="hidden md:flex items-center space-x-4 ml-8">
          <button className="px-5 py-2 rounded-full bg-white text-[#0A58CA] font-semibold hover:bg-gray-100 transition-colors duration-200">
            Masuk
          </button>
          <button className="px-5 py-2 rounded-full bg-[#FD7E14] text-white font-semibold hover:bg-[#E06700] transition-colors duration-200">
            Daftar
          </button>
        </div>
        
        {/* Tombol Hamburger (Mobile) */}
        <div className="md:hidden">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="focus:outline-none">
            {isMobileMenuOpen ? <CloseIcon /> : <HamburgerIcon />}
          </button>
        </div>

      </div>

      {/* Menu Mobile */}
      {isMobileMenuOpen && (
        <div className="md:hidden mt-4 bg-white text-black rounded-lg p-4 space-y-2">
            <Link href="/pesawat" className="block hover:bg-gray-100 p-2 rounded">Pesawat</Link>
            <Link href="/kereta" className="block hover:bg-gray-100 p-2 rounded">Kereta</Link>
            <Link href="/todo" className="block hover:bg-gray-100 p-2 rounded">To Do</Link>
            <hr/>
            <div className="flex flex-col space-y-2 pt-2">
                <button className="w-full px-5 py-2 rounded-full border border-[#0A58CA] text-[#0A58CA] font-semibold hover:bg-gray-100 transition-colors duration-200">
                    Masuk
                </button>
                <button className="w-full px-5 py-2 rounded-full bg-[#FD7E14] text-white font-semibold hover:bg-[#E06700] transition-colors duration-200">
                    Daftar
                </button>
            </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

