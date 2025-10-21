<<<<<<< HEAD
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

// Icon Components
const SearchIcon = ({ className = "" }: { className?: string }) => (
  <svg className={`w-5 h-5 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const BellIcon = ({ className = "" }: { className?: string }) => (
  <svg className={`w-5 h-5 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.93 4.93l9.07 9.07-9.07 9.07L4.93 4.93z" />
  </svg>
);

const UserIcon = ({ className = "" }: { className?: string }) => (
  <svg className={`w-5 h-5 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const ChevronDownIcon = ({ className = "" }: { className?: string }) => (
  <svg className={`w-4 h-4 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const MenuIcon = ({ className = "" }: { className?: string }) => (
  <svg className={`w-6 h-6 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const CloseIcon = ({ className = "" }: { className?: string }) => (
  <svg className={`w-6 h-6 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const router = useRouter();
  const pathname = usePathname();

  // Refs for click outside detection
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Navigation items - mirip dengan tiket.com
  const navItems = [
    { href: '/flights', label: 'Pesawat' },
    { href: '/trains', label: 'Kereta Api' },
    { href: '/hotels', label: 'Hotel' },
    { href: '/to-do', label: 'To Do' },
    { href: '/promo', label: 'Promo' },
  ];

  // Check if current path is active
  const isActivePath = (path: string) => {
    return pathname?.startsWith(path);
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo dan Menu Items */}
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">TG</span>
              </div>
              <span className="text-blue-600 font-bold text-xl hidden sm:block">TripGO</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    isActivePath(item.href) 
                      ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600' 
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right Section - User Actions */}
          <div className="flex items-center space-x-4">
            {/* Search Icon - Mobile */}
            <button className="lg:hidden p-2 text-gray-600 hover:text-blue-600 rounded-lg transition-colors">
              <SearchIcon />
            </button>

            {/* Notification Bell */}
            <button className="relative p-2 text-gray-600 hover:text-blue-600 rounded-lg transition-colors">
              <BellIcon />
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-white">
                <span className="text-xs text-white font-bold">3</span>
              </span>
            </button>

            {/* User Menu */}
            <div ref={userMenuRef} className="relative">
              {isLoggedIn ? (
                // User is logged in
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 bg-blue-50 rounded-lg px-3 py-2 hover:bg-blue-100 transition-all duration-200"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">U</span>
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-gray-800 text-sm font-medium">Halo, User!</p>
                  </div>
                  <ChevronDownIcon className="text-gray-600" />
                </button>
              ) : (
                // User is not logged in - Auth Buttons
                <div className="flex items-center space-x-3">
                  <Link
                    href="/auth/login"
                    className="px-4 py-2 text-gray-700 hover:text-blue-600 text-sm font-medium transition-colors"
                  >
                    Masuk
                  </Link>
                  <Link
                    href="/auth/register"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                  >
                    Daftar
                  </Link>
                </div>
              )}

              {/* User Dropdown Menu */}
              {isUserMenuOpen && isLoggedIn && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Profil Saya
                  </Link>
                  <Link
                    href="/bookings"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Pesanan Saya
                  </Link>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button
                    onClick={() => setIsLoggedIn(false)}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Keluar
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-gray-600 hover:text-blue-600 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-200 bg-white">
            {/* Mobile Navigation Links */}
            <div className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block py-3 px-4 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Mobile Auth Buttons - Only show if not logged in */}
            {!isLoggedIn && (
              <div className="flex flex-col space-y-3 mt-6 pt-4 border-t border-gray-200">
                <Link
                  href="/auth/login"
                  className="px-4 py-3 text-center text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Masuk
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-3 text-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Daftar
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
=======
'use client'; // Diperlukan karena kita akan menggunakan state dan hooks

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';

// --- Kumpulan Ikon SVG ---

const SearchIcon = () => (
  <Image
    src="/images/icons/search.png"
    alt="Search Icon"
    width={20}
    height={20}
    className="absolute left-3 top-1/2 transform -translate-y-1/2"
  />
);

const ChevronDownIcon = () => (
    <Image
        src="/images/chevron-down-icon.png"
        alt="Chevron Down Icon"
        width={16}
        height={16}
        className="ml-1 transition-transform duration-200"
    />
);

const HamburgerIcon = () => (
    <Image
        src="/images/hamburger-icon.svg"
        alt="Hamburger Icon"
        width={24}
        height={24}
        className=""
    />
);

const CloseIcon = () => (
    <Image
        src="/images/close-icon.svg"
        alt="Close Icon"
        width={24}
        height={24}
        className=""
    />
);


// --- Komponen Navbar Utama ---

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const { user, userProfile, signOut } = useAuth();

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

  // Fungsi untuk logout
  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Get user data
  const userData = userProfile || {
    firstName: user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'User',
    lastName: user?.user_metadata?.last_name || '',
    email: user?.email || '',
    phone: user?.user_metadata?.phone || ''
  };

  // Jika user sudah login, tampilkan header dashboard style
  if (user) {
    return (
      <nav className="bg-gradient-to-r from-[#0A58CA] to-[#0548AD] shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <Image
                src="/images/logo_tg2.svg"
                alt="TripGo Logo"
                width={100}
                height={28}
                style={{ width: '150px', height: '150px' }}
                className="brightness-0 invert"
                priority
              />
            </Link>
            
            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md mx-6">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon />
                </div>
                <input
                  type="text"
                  placeholder="Cari penerbangan, hotel, atau destinasi..."
                  value={searchQuery}
                  onChange={handleInputChange}
                  onKeyDown={handleSearch}
                  onBlur={handleBlur}
                  onFocus={handleInputChange}
                  className="w-full pl-10 pr-4 py-2 bg-white/90 backdrop-blur-sm border-0 rounded-lg focus:ring-2 focus:ring-white/50 focus:bg-white transition-all duration-200 text-gray-800 placeholder-gray-500 text-sm"
                />
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
            </div>

            {/* User Actions */}
            <div className="flex items-center space-x-2">
              {/* Notifications */}
              <button className="relative p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-6H4v6zM4 5h6V1H4v4zM15 7h5l-5-5v5z" />
                </svg>
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold text-[10px]">3</span>
                </span>
              </button>
              
              {/* User Profile */}
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5">
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-semibold">
                    {userData.firstName?.[0] || userData.email?.[0] || 'U'}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-white text-xs font-medium">Halo, {userData.firstName}!</p>
                </div>
              </div>
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 text-white/80 hover:text-white hover:bg-white/10 px-2 py-1.5 rounded-lg transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:block text-xs">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden px-4 pb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Cari penerbangan, hotel, atau destinasi..."
              value={searchQuery}
              onChange={handleInputChange}
              onKeyDown={handleSearch}
              onBlur={handleBlur}
              onFocus={handleInputChange}
              className="w-full py-2 pl-10 pr-4 rounded-full bg-white text-gray-800 bg-opacity-20 border border-white border-opacity-30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 placeholder-white placeholder-opacity-70 transition-all duration-300"
            />
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
        </div>
      </nav>
    );
  }

  // Jika user belum login, tampilkan header normal
  return (
    <nav className="bg-gradient-to-r from-[#0A58CA] to-[#0548AD] p-4 text-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        
        <Link href="/" className="flex items-center">
          <Image
            src="/images/logo_tg2.svg"
            alt="TripGo Logo"
            width={150}
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
            className="w-full py-2 pl-10 pr-4 rounded-full bg-white text-gray-800 bg-opacity-20 border border-white border-opacity-30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 placeholder-white placeholder-opacity-70 transition-all duration-300"
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
          <Link href="/search/flights" className="hover:text-gray-200 transition-colors duration-200">Pesawat</Link>
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
          <Link href="/auth/login" className="px-5 py-2 rounded-full bg-white text-[#0A58CA] font-semibold hover:bg-gray-100 transition-colors duration-200">
            Masuk
          </Link>
          <Link href="/auth/register" className="px-5 py-2 rounded-full bg-[#FD7E14] text-white font-semibold hover:bg-[#E06700] transition-colors duration-200">
            Daftar
          </Link>
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
            <Link href="/search/flights" className="block hover:bg-gray-100 p-2 rounded">Pesawat</Link>
            <Link href="/todo" className="block hover:bg-gray-100 p-2 rounded">To Do</Link>
            <hr/>
            <div className="flex flex-col space-y-2 pt-2">
                <Link href="/auth/login" className="w-full px-5 py-2 rounded-full border border-[#0A58CA] text-[#0A58CA] font-semibold hover:bg-gray-100 transition-colors duration-200 text-center">
                    Masuk
                </Link>
                <Link href="/auth/register" className="w-full px-5 py-2 rounded-full bg-[#FD7E14] text-white font-semibold hover:bg-[#E06700] transition-colors duration-200 text-center">
                    Daftar
                </Link>
            </div>
        </div>
      )}
>>>>>>> 93a879e (fix fitur)
    </nav>
  );
};

<<<<<<< HEAD
export default Navbar;
=======
export default Navbar;
>>>>>>> 93a879e (fix fitur)
