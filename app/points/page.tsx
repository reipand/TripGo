// app/points/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useTripPoints } from '@/app/contexts/TripPointsContext';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const StarIcon = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>;
const HistoryIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const GiftIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>;
const ArrowRightIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>;

export default function PointsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { 
    points, 
    transactions, 
    loading, 
    error, 
    getLevelInfo,
    refreshPoints 
  } = useTripPoints();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
    }
  }, [user, router]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Mengarahkan ke login...</p>
        </div>
      </div>
    );
  }

  const levelInfo = getLevelInfo(points?.level || 'bronze');
  
  const benefits = {
    bronze: [
      '1x point multiplier',
      'Basic customer support',
      'Early access to promotions'
    ],
    silver: [
      '1.2x point multiplier',
      'Priority customer support',
      'Free seat selection',
      'Exclusive promotions'
    ],
    gold: [
      '1.5x point multiplier',
      'VIP customer support',
      'Free cancellation (up to 24h)',
      'Lounge access (select stations)',
      'Birthday bonus points'
    ],
    platinum: [
      '2x point multiplier',
      '24/7 VIP support',
      'Free cancellation (anytime)',
      'Complimentary lounge access',
      'Birthday voucher (Rp 100.000)',
      'Priority boarding'
    ]
  };

  const levelBenefits = benefits[points?.level || 'bronze'] || benefits.bronze;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-bold text-gray-800">Trip Points</h1>
            </div>
            <button
              onClick={refreshPoints}
              className="p-2 text-gray-600 hover:text-blue-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-3 text-gray-600">Memuat poin...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <h3 className="font-semibold text-red-800 mb-2">Gagal Memuat</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={refreshPoints}
              className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700"
            >
              Coba Lagi
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Points Summary Card */}
            <div className="bg-gradient-to-r from-amber-500 to-yellow-500 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-amber-100">Total Poin Tersedia</p>
                  <h2 className="text-4xl font-bold mt-2">
                    {points?.available_points.toLocaleString('id-ID') || 0}
                  </h2>
                  <p className="text-amber-100 mt-1">
                    {points?.total_points.toLocaleString('id-ID') || 0} poin terkumpul
                  </p>
                </div>
                <div className={`px-4 py-2 rounded-full ${levelInfo.color} flex items-center gap-2`}>
                  {levelInfo.icon}
                  <span className="font-semibold">{levelInfo.label}</span>
                </div>
              </div>
              
              {/* Progress to next level */}
              <div className="mt-6">
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress ke {getLevelInfo('silver').label}</span>
                  <span>
                    {points?.available_points || 0} / {getLevelInfo('silver').minPoints}
                  </span>
                </div>
                <div className="w-full bg-amber-300 bg-opacity-30 rounded-full h-3">
                  <div 
                    className="bg-white h-3 rounded-full" 
                    style={{ 
                      width: `${Math.min((points?.available_points || 0) / getLevelInfo('silver').minPoints * 100, 100)}%` 
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl border text-center">
                <div className="text-2xl font-bold text-amber-600">{points?.total_points || 0}</div>
                <div className="text-sm text-gray-500">Total Poin</div>
              </div>
              <div className="bg-white p-4 rounded-xl border text-center">
                <div className="text-2xl font-bold text-green-600">{points?.spent_points || 0}</div>
                <div className="text-sm text-gray-500">Poin Terpakai</div>
              </div>
              <div className="bg-white p-4 rounded-xl border text-center">
                <div className="text-2xl font-bold text-blue-600">{levelInfo.multiplier}x</div>
                <div className="text-sm text-gray-500">Multiplier</div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-3 font-medium ${activeTab === 'overview' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
              >
                <div className="flex items-center gap-2">
                  <GiftIcon />
                  <span>Manfaat</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-3 font-medium ${activeTab === 'history' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
              >
                <div className="flex items-center gap-2">
                  <HistoryIcon />
                  <span>Riwayat</span>
                </div>
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' ? (
              <div className="space-y-6">
                {/* Benefits */}
                <div className="bg-white rounded-xl border p-6">
                  <h3 className="font-bold text-gray-800 mb-4">Manfaat {levelInfo.label}</h3>
                  <ul className="space-y-3">
                    {levelBenefits.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                          <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-gray-700">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* How to Earn */}
                <div className="bg-white rounded-xl border p-6">
                  <h3 className="font-bold text-gray-800 mb-4">Cara Mendapatkan Poin</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <StarIcon />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800">Booking Kereta</h4>
                          <p className="text-sm text-gray-600">1 poin per Rp 10.000</p>
                        </div>
                      </div>
                      <span className="font-bold text-blue-600">+{levelInfo.multiplier}x</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800">Early Booking</h4>
                          <p className="text-sm text-gray-600">Pesan 7 hari sebelumnya</p>
                        </div>
                      </div>
                      <span className="font-bold text-green-600">+100 poin</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800">Referral Teman</h4>
                          <p className="text-sm text-gray-600">Undang teman daftar</p>
                        </div>
                      </div>
                      <span className="font-bold text-purple-600">+500 poin</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link 
                    href="/search/trains"
                    className="bg-blue-600 text-white p-4 rounded-xl font-medium hover:bg-blue-700 transition-colors text-center flex items-center justify-center gap-2"
                  >
                    <TrainIcon />
                    <span>Pesan Kereta & Dapatkan Poin</span>
                    <ArrowRightIcon />
                  </Link>
                  <button
                    onClick={() => setActiveTab('history')}
                    className="bg-white border border-gray-300 text-gray-700 p-4 rounded-xl font-medium hover:bg-gray-50 transition-colors text-center flex items-center justify-center gap-2"
                  >
                    <HistoryIcon />
                    <span>Lihat Riwayat Poin</span>
                    <ArrowRightIcon />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.length > 0 ? (
                  transactions.map((transaction) => (
                    <div 
                      key={transaction.id}
                      className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-800">{transaction.description}</h4>
                          <p className="text-sm text-gray-500">
                            {new Date(transaction.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          {transaction.expires_at && (
                            <p className="text-xs text-gray-400 mt-1">
                              Berakhir: {new Date(transaction.expires_at).toLocaleDateString('id-ID')}
                            </p>
                          )}
                        </div>
                        <div className={`font-bold ${transaction.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.points > 0 ? '+' : ''}{transaction.points}
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          transaction.type === 'earn' ? 'bg-green-100 text-green-800' :
                          transaction.type === 'redeem' ? 'bg-red-100 text-red-800' :
                          transaction.type === 'bonus' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {transaction.type === 'earn' ? 'Penambahan' :
                           transaction.type === 'redeem' ? 'Penukaran' :
                           transaction.type === 'bonus' ? 'Bonus' : 'Penyesuaian'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white rounded-xl border p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <HistoryIcon />
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-2">Belum Ada Riwayat</h3>
                    <p className="text-gray-500 mb-4">
                      Mulai kumpulkan poin dengan memesan tiket kereta!
                    </p>
                    <Link 
                      href="/search/trains"
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 inline-flex items-center gap-2"
                    >
                      <TrainIcon />
                      <span>Pesan Sekarang</span>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}