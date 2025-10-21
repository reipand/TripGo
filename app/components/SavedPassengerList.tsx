'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { supabase } from '@/app/lib/supabaseClient';

// Types
interface SavedPassenger {
  id: string;
  user_id: string;
  title: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  passport_number: string;
  nationality: string;
  phone_number: string;
  email: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface SavedPassengerListProps {
  onPassengerSelect: (passenger: SavedPassenger) => void;
  onPassengerSave: (passenger: Omit<SavedPassenger, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  selectedPassengers: SavedPassenger[];
  maxSelections: number;
}

// Icons
const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const SavedPassengerList: React.FC<SavedPassengerListProps> = ({
  onPassengerSelect,
  onPassengerSave,
  selectedPassengers,
  maxSelections
}) => {
  const { user } = useAuth();
  const [savedPassengers, setSavedPassengers] = useState<SavedPassenger[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPassenger, setEditingPassenger] = useState<SavedPassenger | null>(null);
  const [formData, setFormData] = useState({
    title: 'Mr',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    passport_number: '',
    nationality: 'Indonesia',
    phone_number: '',
    email: '',
    is_default: false
  });

  // Fetch saved passengers
  const fetchSavedPassengers = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('saved_passengers')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching saved passengers:', error);
        return;
      }

      setSavedPassengers(data || []);
    } catch (error) {
      console.error('Error fetching saved passengers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedPassengers();
  }, [user]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const passengerData = {
        ...formData,
        user_id: user.id
      };

      if (editingPassenger) {
        // Update existing passenger
        const { error } = await supabase
          .from('saved_passengers')
          .update(passengerData)
          .eq('id', editingPassenger.id);

        if (error) {
          console.error('Error updating passenger:', error);
          return;
        }
      } else {
        // Create new passenger
        const { error } = await supabase
          .from('saved_passengers')
          .insert([passengerData]);

        if (error) {
          console.error('Error creating passenger:', error);
          return;
        }
      }

      // Refresh the list
      await fetchSavedPassengers();
      
      // Reset form
      setFormData({
        title: 'Mr',
        first_name: '',
        last_name: '',
        date_of_birth: '',
        passport_number: '',
        nationality: 'Indonesia',
        phone_number: '',
        email: '',
        is_default: false
      });
      setShowAddForm(false);
      setEditingPassenger(null);
    } catch (error) {
      console.error('Error saving passenger:', error);
    }
  };

  // Handle passenger selection
  const handlePassengerSelect = (passenger: SavedPassenger) => {
    const isSelected = selectedPassengers.some(p => p.id === passenger.id);
    
    if (isSelected) {
      // Remove from selection
      const updatedSelection = selectedPassengers.filter(p => p.id !== passenger.id);
      onPassengerSelect(updatedSelection[0] || null);
    } else if (selectedPassengers.length < maxSelections) {
      // Add to selection
      onPassengerSelect(passenger);
    }
  };

  // Handle passenger edit
  const handleEditPassenger = (passenger: SavedPassenger) => {
    setFormData({
      title: passenger.title,
      first_name: passenger.first_name,
      last_name: passenger.last_name,
      date_of_birth: passenger.date_of_birth,
      passport_number: passenger.passport_number,
      nationality: passenger.nationality,
      phone_number: passenger.phone_number,
      email: passenger.email,
      is_default: passenger.is_default
    });
    setEditingPassenger(passenger);
    setShowAddForm(true);
  };

  // Handle passenger delete
  const handleDeletePassenger = async (passengerId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus penumpang ini?')) return;

    try {
      const { error } = await supabase
        .from('saved_passengers')
        .delete()
        .eq('id', passengerId);

      if (error) {
        console.error('Error deleting passenger:', error);
        return;
      }

      await fetchSavedPassengers();
    } catch (error) {
      console.error('Error deleting passenger:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800 flex items-center">
          <UserIcon />
          <span className="ml-2">Penumpang Tersimpan</span>
        </h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center"
        >
          <PlusIcon />
          <span className="ml-2">Tambah Penumpang</span>
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-4">
            {editingPassenger ? 'Edit Penumpang' : 'Tambah Penumpang Baru'}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gelar</label>
                <select
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Mr">Mr</option>
                  <option value="Mrs">Mrs</option>
                  <option value="Ms">Ms</option>
                  <option value="Dr">Dr</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nama Depan</label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nama Belakang</label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Lahir</label>
                <input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nomor Paspor</label>
                <input
                  type="text"
                  value={formData.passport_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, passport_number: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kewarganegaraan</label>
                <select
                  value={formData.nationality}
                  onChange={(e) => setFormData(prev => ({ ...prev, nationality: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Indonesia">Indonesia</option>
                  <option value="Malaysia">Malaysia</option>
                  <option value="Singapore">Singapore</option>
                  <option value="Thailand">Thailand</option>
                  <option value="Philippines">Philippines</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nomor Telepon</label>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={formData.is_default}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_default: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_default" className="ml-2 text-sm text-gray-700">
                  Jadikan sebagai default
                </label>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                {editingPassenger ? 'Update' : 'Simpan'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingPassenger(null);
                  setFormData({
                    title: 'Mr',
                    first_name: '',
                    last_name: '',
                    date_of_birth: '',
                    passport_number: '',
                    nationality: 'Indonesia',
                    phone_number: '',
                    email: '',
                    is_default: false
                  });
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Saved Passengers List */}
      {savedPassengers.length === 0 ? (
        <div className="text-center py-8">
          <UserIcon />
          <p className="text-gray-500 mt-2">Belum ada penumpang tersimpan</p>
          <p className="text-sm text-gray-400">Klik "Tambah Penumpang" untuk menambahkan</p>
        </div>
      ) : (
        <div className="space-y-3">
          {savedPassengers.map((passenger) => {
            const isSelected = selectedPassengers.some(p => p.id === passenger.id);
            const canSelect = !isSelected && selectedPassengers.length < maxSelections;
            
            return (
              <div
                key={passenger.id}
                className={`border rounded-lg p-4 transition-all ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50' 
                    : canSelect 
                      ? 'border-gray-200 hover:border-blue-300 cursor-pointer' 
                      : 'border-gray-200 opacity-50'
                }`}
                onClick={() => canSelect && handlePassengerSelect(passenger)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isSelected ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {isSelected ? <CheckIcon /> : <UserIcon />}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold text-gray-800">
                          {passenger.title} {passenger.first_name} {passenger.last_name}
                        </h4>
                        {passenger.is_default && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {passenger.passport_number} • {passenger.nationality}
                      </div>
                      <div className="text-sm text-gray-500">
                        {passenger.phone_number} • {passenger.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditPassenger(passenger);
                      }}
                      className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                    >
                      <EditIcon />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePassenger(passenger.id);
                      }}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selection Info */}
      {selectedPassengers.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            {selectedPassengers.length} dari {maxSelections} penumpang dipilih
          </p>
        </div>
      )}
    </div>
  );
};

export default SavedPassengerList;
