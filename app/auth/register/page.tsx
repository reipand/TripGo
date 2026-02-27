'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';

// --- Komponen Ikon ---
const EyeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOffIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const MailIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const PhoneIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const MapPinIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const GenderIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
  </svg>
);

const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

// --- Komponen Register Content ---
function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, signInWithGoogle, loading: authLoading } = useAuth();
  
  const [formData, setFormData] = useState({
    // Informasi dasar
    email: '',
    password: '',
    confirmPassword: '',
    
    // Informasi pribadi (sesuai dengan schema users)
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    
    // Persetujuan
    agreeToTerms: false,
    agreeToMarketing: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  // Get redirect URL from query params
  useEffect(() => {
    const redirect = searchParams.get('redirect');
    if (redirect) {
      setRedirectUrl(redirect);
    }
  }, [searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (e.target instanceof HTMLInputElement) {
      const checked = e.target.checked;
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    setError(''); // Clear error when user types
    setSuccess(''); // Clear success message
  };

  const validateForm = () => {
    // Validasi email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Format email tidak valid');
      return false;
    }

    // Validasi password
    if (formData.password.length < 8) {
      setError('Password minimal 8 karakter');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Password dan konfirmasi password tidak sama');
      return false;
    }
    
    // Validasi kekuatan password
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(formData.password)) {
      setError('Password harus mengandung minimal 1 huruf kecil, 1 huruf besar, dan 1 angka');
      return false;
    }

    // Validasi nomor telepon (Indonesia)
    const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{6,9}$/;
    if (formData.phone && !phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      setError('Format nomor telepon tidak valid. Gunakan format Indonesia (contoh: 081234567890)');
      return false;
    }

    // Validasi tanggal lahir
    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        if (age - 1 < 13) {
          setError('Anda harus berusia minimal 13 tahun untuk mendaftar');
          return false;
        }
      } else if (age < 13) {
        setError('Anda harus berusia minimal 13 tahun untuk mendaftar');
        return false;
      }
      
      if (birthDate > today) {
        setError('Tanggal lahir tidak valid');
        return false;
      }
    }

    // Validasi persetujuan syarat dan ketentuan
    if (!formData.agreeToTerms) {
      setError('Anda harus menyetujui syarat dan ketentuan');
      return false;
    }

    return true;
  };

const createUserViaAPI = async (email: string, password: string, userData: any) => {
  try {
    console.log('Creating user via API:', { email, userData });

    const response = await fetch('/api/auth/create-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.trim(),
        password: password,
        user_metadata: {
          name: userData.name,
          phone: userData.phone,
          date_of_birth: userData.date_of_birth,
          gender: userData.gender,
          address: userData.address,
          agreed_to_marketing: userData.metadata?.agreed_to_marketing || false
        }
      }),
    });

    const result = await response.json();
    console.log('API Response:', { status: response.status, result });

    if (!response.ok) {
      // Parse error message
      let errorMessage = result.error || 'Failed to create user';
      
      if (errorMessage.includes('already registered') || errorMessage.includes('already exists')) {
        errorMessage = 'Email sudah terdaftar. Silakan gunakan email lain atau login.';
      } else if (errorMessage.includes('password')) {
        errorMessage = 'Password tidak memenuhi persyaratan keamanan.';
      } else if (errorMessage.includes('Database error')) {
        errorMessage = 'Terjadi kesalahan sistem. Silakan coba lagi.';
      }
      
      throw new Error(errorMessage);
    }

    // Coba login otomatis
    try {
      const loginResult = await signIn(email, password);
      
      if (loginResult.error) {
        console.warn('Auto-login failed, user can login manually:', loginResult.error);
        // Return success anyway, user can login manually
        return { success: true, data: result, needsManualLogin: true };
      }
      
      return { success: true, data: result, needsManualLogin: false };
    } catch (loginError) {
      console.warn('Login exception:', loginError);
      return { success: true, data: result, needsManualLogin: true };
    }
    
  } catch (error: any) {
    console.error('API create user error:', error);
    return { 
      success: false, 
      error: error.message || 'Terjadi kesalahan sistem' 
    };
  }
};

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!validateForm()) {
    return;
  }

  setLoading(true);
  setError('');
  setSuccess('');

  try {
    // Format data sederhana
    const userData = {
      name: `${formData.firstName} ${formData.lastName}`.trim(),
      phone: formData.phone || '',
      date_of_birth: formData.dateOfBirth || null,
      gender: formData.gender || null,
      address: formData.address || null,
      metadata: {
        agreed_to_marketing: formData.agreeToMarketing
      }
    };

    console.log('Submitting registration:', { email: formData.email, userData });

    // Gunakan API endpoint untuk create user
    const result = await createUserViaAPI(
      formData.email, 
      formData.password, 
      userData
    );
    
    if (!result.success) {
      setError(result.error || 'Terjadi kesalahan saat mendaftar');
    } else {
      if (result.needsManualLogin) {
        setSuccess('Registrasi berhasil! Silakan login dengan email dan password Anda.');
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      } else {
        setSuccess('Registrasi berhasil! Mengarahkan ke dashboard...');
        setTimeout(() => {
          if (redirectUrl) {
            router.push(decodeURIComponent(redirectUrl));
          } else {
            router.push('/dashboard');
          }
        }, 2000);
      }
    }
  } catch (err: any) {
    console.error('Registration error:', err);
    setError('Terjadi kesalahan sistem: ' + err.message);
  } finally {
    setLoading(false);
  }
};


  const handleGoogleSignUp = async () => {
  setGoogleLoading(true);
  setError('');
  setSuccess('');

  try {
    const result = await signInWithGoogle(redirectUrl || '/dashboard');
    
    if (result?.error) {
      const errorMsg = result.error.message?.toLowerCase() || '';
      
      if (errorMsg.includes('popup_closed_by_user')) {
        setError('Pop-up login ditutup. Silakan coba lagi.');
      } else if (errorMsg.includes('oauth_callback')) {
        // This might be expected - OAuth flow has started
        setSuccess('Mengarahkan ke Google untuk autentikasi...');
        return;
      } else {
        setError(result.error.message || 'Terjadi kesalahan saat login dengan Google');
      }
    } else {
      // OAuth flow initiated successfully
      setSuccess('Mengarahkan ke Google untuk autentikasi...');
    }
    
  } catch (err: any) {
    console.error('Google sign up error:', err);
    
    const errorMsg = err.message?.toLowerCase() || '';
    if (errorMsg.includes('popup')) {
      setError('Login dengan Google dibatalkan. Silakan coba lagi.');
    } else {
      setError('Terjadi kesalahan saat mendaftar dengan Google. Silakan coba lagi.');
    }
  } finally {
    setTimeout(() => {
      setGoogleLoading(false);
    }, 2000);
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A58CA] to-[#0548AD] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Buat Akun Baru</h1>
          <p className="text-blue-100 mt-2">Bergabunglah dengan TripGO dan nikmati kemudahan pemesanan tiket kereta</p>
          {redirectUrl && (
            <div className="mt-3 p-3 bg-blue-500 bg-opacity-20 rounded-lg inline-block">
              <p className="text-blue-100 text-sm">
                Anda akan diarahkan kembali setelah registrasi berhasil
              </p>
            </div>
          )}
        </div>

        {/* Form Register */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Google Sign Up Button */}
          <div className="mb-6">
            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={googleLoading || authLoading}
              className="w-full bg-white border border-gray-300 text-gray-700 font-medium py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors duration-300 flex items-center justify-center shadow-sm hover:shadow disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {googleLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-700 mr-3"></div>
                  Memproses...
                </>
              ) : (
                <>
                  <GoogleIcon />
                  Daftar dengan Google
                </>
              )}
            </button>
            <p className="text-xs text-gray-500 text-center mt-2">
              Data pribadi Anda akan dilindungi
            </p>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Atau daftar dengan email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Grid untuk form dua kolom */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Kolom Kiri - Informasi Dasar */}
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">
                  Informasi Dasar
                </h2>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MailIcon />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 text-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="nama@email.com"
                      required
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Email ini akan digunakan untuk login dan verifikasi
                  </p>
                </div>

                {/* Nama Depan dan Belakang */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nama Depan <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <UserIcon />
                      </div>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-3 py-3 border border-gray-300 text-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Nama depan"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nama Belakang <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-3 border border-gray-300 text-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nama belakang"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LockIcon />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-10 py-3 border border-gray-300 text-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Minimal 8 karakter"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Harus mengandung huruf besar, kecil, dan angka
                  </p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Konfirmasi Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LockIcon />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-10 py-3 border border-gray-300 text-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ulangi password"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Kolom Kanan - Informasi Tambahan */}
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">
                  Informasi Tambahan
                </h2>

                {/* Nomor Telepon */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nomor Telepon <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <PhoneIcon />
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 text-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="081234567890"
                      required
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Format: 08xxxxxxxxxx
                  </p>
                </div>

                {/* Tanggal Lahir */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tanggal Lahir
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CalendarIcon />
                    </div>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 text-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jenis Kelamin
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <GenderIcon />
                    </div>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 text-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                    >
                      <option value="">Pilih Jenis Kelamin</option>
                      <option value="male">Laki-laki</option>
                      <option value="female">Perempuan</option>
                      <option value="other">Lainnya</option>
                      <option value="prefer_not_to_say">Lebih baik tidak disebutkan</option>
                    </select>
                  </div>
                </div>

                {/* Alamat */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alamat
                  </label>
                  <div className="relative">
                    <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                      <MapPinIcon />
                    </div>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 text-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Alamat lengkap"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Persetujuan */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                  required
                />
                <label className="ml-2 text-sm text-gray-600">
                  Saya menyetujui{' '}
                  <Link href="/terms" className="text-blue-600 hover:text-blue-500 font-medium">
                    Syarat dan Ketentuan
                  </Link>{' '}
                  serta{' '}
                  <Link href="/privacy" className="text-blue-600 hover:text-blue-500 font-medium">
                    Kebijakan Privasi
                  </Link>{' '}
                  TripGO <span className="text-red-500">*</span>
                </label>
              </div>

              <div className="flex items-start">
                <input
                  type="checkbox"
                  name="agreeToMarketing"
                  checked={formData.agreeToMarketing}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                />
                <label className="ml-2 text-sm text-gray-600">
                  Saya ingin menerima informasi promosi, penawaran khusus, dan update terbaru dari TripGO via email
                </label>
              </div>
            </div>

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-600">{success}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || authLoading}
              className="w-full bg-[#FD7E14] hover:bg-[#E06700] disabled:bg-gray-400 text-white font-bold py-4 px-4 rounded-xl transition-all duration-300 flex items-center justify-center text-lg shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
            >
              {loading || authLoading ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                  Membuat Akun...
                </>
              ) : (
                'Daftar Sekarang'
              )}
            </button>

            {/* Login Link */}
            <div className="text-center pt-4">
              <p className="text-gray-600">
                Sudah punya akun?{' '}
                <Link 
                  href={redirectUrl ? `/auth/login?redirect=${encodeURIComponent(redirectUrl)}` : '/auth/login'} 
                  className="text-blue-600 hover:text-blue-500 font-semibold hover:underline"
                >
                  Masuk di sini
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Loading component
function RegisterLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A58CA] to-[#0548AD] flex items-center justify-center p-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white">Memuat halaman registrasi...</p>
      </div>
    </div>
  );
}

// Main component dengan Suspense
export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterLoading />}>
      <RegisterContent />
    </Suspense>
  );
}
