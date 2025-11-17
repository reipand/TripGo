// components/PassportForm.tsx
'use client';

import { useState } from 'react';

interface PassportData {
  passportNumber: string;
  country: string;
  fullName: string;
  nationality: string;
  dateOfBirth: string;
  issueDate: string;
  expiryDate: string;
}

const COUNTRIES = [
  { code: 'ID', name: 'Indonesia' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'SG', name: 'Singapore' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
];

const PASSPORT_FORMATS: { [key: string]: { pattern: RegExp; example: string } } = {
  'ID': { pattern: /^[A-Z][0-9]{7}$/, example: 'A1234567' },
  'US': { pattern: /^[0-9]{9}$/, example: '123456789' },
  'SG': { pattern: /^[K|S][0-9]{7}[A-Z]$/, example: 'K1234567A' },
  'MY': { pattern: /^[A-H|K|N|T|U|W|X][0-9]{8}$/, example: 'A12345678' },
  'GB': { pattern: /^[0-9]{9}$/, example: '123456789' },
};

export default function PassportForm() {
  const [formData, setFormData] = useState<PassportData>({
    passportNumber: '',
    country: 'ID',
    fullName: '',
    nationality: 'ID',
    dateOfBirth: '',
    issueDate: '',
    expiryDate: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validatePassport = (number: string, country: string): boolean => {
    const format = PASSPORT_FORMATS[country];
    return format ? format.pattern.test(number) : true;
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Validasi format paspor
    if (!validatePassport(formData.passportNumber, formData.country)) {
      const format = PASSPORT_FORMATS[formData.country];
      newErrors.passportNumber = `Format tidak valid. Contoh: ${format.example}`;
    }

    // Validasi tanggal
    const today = new Date();
    const expiryDate = new Date(formData.expiryDate);
    const issueDate = new Date(formData.issueDate);
    const birthDate = new Date(formData.dateOfBirth);

    if (expiryDate <= today) {
      newErrors.expiryDate = 'Paspor harus masih berlaku';
    }

    if (issueDate >= expiryDate) {
      newErrors.issueDate = 'Tanggal penerbitan harus sebelum tanggal kedaluwarsa';
    }

    // Validasi usia minimal
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age < 1) {
      newErrors.dateOfBirth = 'Format tanggal lahir tidak valid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Simulasi API call
      const response = await fetch('/api/passport/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      
      if (result.isSimulatedValid) {
        alert('Data paspor valid (simulasi)');
        // Lanjutkan ke step berikutnya
      } else {
        alert('Data paspor tidak valid. Silakan periksa kembali.');
      }
    } catch (error) {
      console.error('Error validating passport:', error);
      alert('Terjadi kesalahan saat memvalidasi paspor');
    }
  };

  const handleInputChange = (field: keyof PassportData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error ketika user mulai mengetik
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Data Paspor</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Negara Penerbit */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Negara Penerbit Paspor
          </label>
          <select
            value={formData.country}
            onChange={(e) => handleInputChange('country', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {COUNTRIES.map(country => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </div>

        {/* Nomor Paspor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nomor Paspor
          </label>
          <input
            type="text"
            value={formData.passportNumber}
            onChange={(e) => handleInputChange('passportNumber', e.target.value.toUpperCase())}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.passportNumber ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder={PASSPORT_FORMATS[formData.country]?.example}
          />
          {errors.passportNumber && (
            <p className="text-red-500 text-sm mt-1">{errors.passportNumber}</p>
          )}
          <p className="text-gray-500 text-sm mt-1">
            Format: {PASSPORT_FORMATS[formData.country]?.example}
          </p>
        </div>

        {/* Nama Lengkap */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nama Lengkap (sesuai paspor)
          </label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => handleInputChange('fullName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Kewarganegaraan */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kewarganegaraan
          </label>
          <select
            value={formData.nationality}
            onChange={(e) => handleInputChange('nationality', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {COUNTRIES.map(country => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tanggal Lahir */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tanggal Lahir
          </label>
          <input
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.dateOfBirth && (
            <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>
          )}
        </div>

        {/* Tanggal Diterbitkan */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tanggal Diterbitkan
          </label>
          <input
            type="date"
            value={formData.issueDate}
            onChange={(e) => handleInputChange('issueDate', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.issueDate ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.issueDate && (
            <p className="text-red-500 text-sm mt-1">{errors.issueDate}</p>
          )}
        </div>

        {/* Tanggal Kedaluwarsa */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tanggal Kedaluwarsa
          </label>
          <input
            type="date"
            value={formData.expiryDate}
            onChange={(e) => handleInputChange('expiryDate', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.expiryDate ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.expiryDate && (
            <p className="text-red-500 text-sm mt-1">{errors.expiryDate}</p>
          )}
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
        >
          Validasi Data Paspor
        </button>
      </form>
    </div>
  );
}