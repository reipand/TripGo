'use client';

import React, { useState, useEffect } from 'react';
import { realtimeManager } from '@/app/lib/realtimeClient';

// Types
interface FlightStatus {
  id: string;
  flight_number: string;
  airline: string;
  origin: string;
  destination: string;
  scheduled_departure: string;
  scheduled_arrival: string;
  actual_departure?: string;
  actual_arrival?: string;
  status: 'scheduled' | 'boarding' | 'departed' | 'in_flight' | 'landed' | 'delayed' | 'cancelled';
  gate?: string;
  terminal?: string;
  baggage_claim?: string;
  delay_reason?: string;
  last_updated: string;
}

interface FlightTrackerProps {
  flightNumber?: string;
  bookingId?: string;
  showDetails?: boolean;
}

// Icons
const PlaneIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const MapPinIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ExclamationIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

const FlightTracker: React.FC<FlightTrackerProps> = ({
  flightNumber,
  bookingId,
  showDetails = true
}) => {
  const [flightStatus, setFlightStatus] = useState<FlightStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Mock flight status data
  const mockFlightStatus: FlightStatus = {
    id: '1',
    flight_number: flightNumber || 'GA-123',
    airline: 'Garuda Indonesia',
    origin: 'Jakarta (CGK)',
    destination: 'Denpasar (DPS)',
    scheduled_departure: '2024-01-25T07:30:00Z',
    scheduled_arrival: '2024-01-25T09:00:00Z',
    actual_departure: '2024-01-25T07:45:00Z',
    actual_arrival: undefined,
    status: 'in_flight',
    gate: 'B12',
    terminal: 'Terminal 3',
    baggage_claim: 'B3',
    delay_reason: 'Weather conditions',
    last_updated: new Date().toISOString()
  };

  // Fetch flight status
  const fetchFlightStatus = async () => {
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Use mock data for demonstration
      setFlightStatus(mockFlightStatus);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching flight status:', error);
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to real-time flight updates
  useEffect(() => {
    fetchFlightStatus();

    // Subscribe to real-time flight updates
    const subscription = realtimeManager.subscribeToFlights((payload) => {
      console.log('Flight status updated:', payload);
      
      if (payload.new.flight_number === flightNumber) {
        setFlightStatus(payload.new);
        setLastUpdate(new Date());
      }
    });

    return () => {
      realtimeManager.unsubscribe('flights');
    };
  }, [flightNumber]);

  // Get status color and icon
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'scheduled':
        return {
          color: 'text-blue-600 bg-blue-100',
          icon: <ClockIcon />,
          text: 'Terjadwal'
        };
      case 'boarding':
        return {
          color: 'text-yellow-600 bg-yellow-100',
          icon: <PlaneIcon />,
          text: 'Sedang Boarding'
        };
      case 'departed':
        return {
          color: 'text-green-600 bg-green-100',
          icon: <PlaneIcon />,
          text: 'Sudah Berangkat'
        };
      case 'in_flight':
        return {
          color: 'text-purple-600 bg-purple-100',
          icon: <PlaneIcon />,
          text: 'Dalam Penerbangan'
        };
      case 'landed':
        return {
          color: 'text-green-600 bg-green-100',
          icon: <CheckCircleIcon />,
          text: 'Sudah Mendarat'
        };
      case 'delayed':
        return {
          color: 'text-orange-600 bg-orange-100',
          icon: <ExclamationIcon />,
          text: 'Terlambat'
        };
      case 'cancelled':
        return {
          color: 'text-red-600 bg-red-100',
          icon: <ExclamationIcon />,
          text: 'Dibatalkan'
        };
      default:
        return {
          color: 'text-gray-600 bg-gray-100',
          icon: <ClockIcon />,
          text: 'Tidak Diketahui'
        };
    }
  };

  // Format time
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate delay
  const calculateDelay = (scheduled: string, actual?: string) => {
    if (!actual) return null;
    
    const scheduledTime = new Date(scheduled);
    const actualTime = new Date(actual);
    const delayMinutes = Math.floor((actualTime.getTime() - scheduledTime.getTime()) / (1000 * 60));
    
    return delayMinutes > 0 ? `+${delayMinutes} menit` : null;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!flightStatus) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 text-center">
        <PlaneIcon />
        <p className="text-gray-500 mt-2">Tidak dapat menemukan status penerbangan</p>
      </div>
    );
  }

  const statusInfo = getStatusInfo(flightStatus.status);
  const departureDelay = calculateDelay(flightStatus.scheduled_departure, flightStatus.actual_departure);
  const arrivalDelay = calculateDelay(flightStatus.scheduled_arrival, flightStatus.actual_arrival);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-800 flex items-center">
            <PlaneIcon />
            <span className="ml-2">Pelacakan Penerbangan</span>
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {flightStatus.flight_number} - {flightStatus.airline}
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full flex items-center ${statusInfo.color}`}>
          {statusInfo.icon}
          <span className="ml-2 text-sm font-medium">{statusInfo.text}</span>
        </div>
      </div>

      {/* Flight Route */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">
              {formatTime(flightStatus.scheduled_departure)}
            </div>
            <div className="text-sm text-gray-600">{flightStatus.origin}</div>
            {departureDelay && (
              <div className="text-xs text-orange-600 mt-1">
                Terlambat {departureDelay}
              </div>
            )}
          </div>
          
          <div className="flex-1 mx-4">
            <div className="flex items-center">
              <div className="flex-1 h-0.5 bg-gray-300"></div>
              <div className="mx-2">
                <PlaneIcon />
              </div>
              <div className="flex-1 h-0.5 bg-gray-300"></div>
            </div>
            <div className="text-center text-xs text-gray-500 mt-1">
              {flightStatus.origin.split(' ')[0]} → {flightStatus.destination.split(' ')[0]}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">
              {flightStatus.actual_arrival 
                ? formatTime(flightStatus.actual_arrival)
                : formatTime(flightStatus.scheduled_arrival)
              }
            </div>
            <div className="text-sm text-gray-600">{flightStatus.destination}</div>
            {arrivalDelay && (
              <div className="text-xs text-orange-600 mt-1">
                Terlambat {arrivalDelay}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Flight Details */}
      {showDetails && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800">Informasi Keberangkatan</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Gate:</span>
                <span className="font-medium">{flightStatus.gate || 'TBA'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Terminal:</span>
                <span className="font-medium">{flightStatus.terminal || 'TBA'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium">{statusInfo.text}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800">Informasi Kedatangan</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Baggage Claim:</span>
                <span className="font-medium">{flightStatus.baggage_claim || 'TBA'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Terminal:</span>
                <span className="font-medium">{flightStatus.terminal || 'TBA'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium">
                  {flightStatus.status === 'landed' ? 'Sudah Mendarat' : 'Dalam Penerbangan'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delay Information */}
      {flightStatus.delay_reason && (
        <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <ExclamationIcon />
            <div>
              <h5 className="font-medium text-orange-800">Informasi Keterlambatan</h5>
              <p className="text-sm text-orange-700 mt-1">{flightStatus.delay_reason}</p>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Status */}
      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            <span className="text-sm text-green-700">Update real-time aktif</span>
          </div>
          {lastUpdate && (
            <span className="text-xs text-green-600">
              Terakhir update: {lastUpdate.toLocaleTimeString('id-ID')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlightTracker;
