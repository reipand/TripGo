// app/api/trains/multi-segment/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Type definitions
interface Segment {
  trainId: string;
  scheduleId: string;
  trainName: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  class: 'ekonomi' | 'bisnis' | 'eksekutif';
  layover?: string; // Time between segments
}

interface MultiSegmentBooking {
  id: string;
  segments: Segment[];
  totalDuration: string;
  totalPrice: number;
  totalTransfers: number;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  options?: MultiSegmentBooking[];
  total?: number;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Extract query parameters
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');
    const date = searchParams.get('date');
    const passengers = parseInt(searchParams.get('passengers') || '1');
    
    // Validate required parameters
    if (!origin || !destination || !date) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Parameter origin, destination, dan date diperlukan' 
        },
        { status: 400 }
      );
    }
    
    // In production, you would query your database and calculate possible routes
    // This is mock data for demonstration
    const mockOptions: MultiSegmentBooking[] = [
      {
        id: 'MS001',
        segments: [
          {
            trainId: 'TR001',
            scheduleId: 'SCH001',
            trainName: 'Argo Wilis',
            origin: origin,
            destination: 'STATION_X', // Transit station
            departureTime: '08:00',
            arrivalTime: '11:30',
            duration: '3h 30m',
            class: 'eksekutif'
          },
          {
            trainId: 'TR002',
            scheduleId: 'SCH002',
            trainName: 'Gajayana',
            origin: 'STATION_X',
            destination: destination,
            departureTime: '13:00', // 1.5 hour layover
            arrivalTime: '17:00',
            duration: '4h',
            class: 'eksekutif',
            layover: '1h 30m'
          }
        ],
        totalDuration: '9h',
        totalPrice: 450000,
        totalTransfers: 1
      },
      {
        id: 'MS002',
        segments: [
          {
            trainId: 'TR003',
            scheduleId: 'SCH003',
            trainName: 'Taksaka',
            origin: origin,
            destination: 'STATION_Y',
            departureTime: '09:30',
            arrivalTime: '12:45',
            duration: '3h 15m',
            class: 'bisnis'
          },
          {
            trainId: 'TR004',
            scheduleId: 'SCH004',
            trainName: 'Sembrani',
            origin: 'STATION_Y',
            destination: 'STATION_Z',
            departureTime: '14:30',
            arrivalTime: '16:45',
            duration: '2h 15m',
            class: 'bisnis',
            layover: '1h 45m'
          },
          {
            trainId: 'TR005',
            scheduleId: 'SCH005',
            trainName: 'Bima',
            origin: 'STATION_Z',
            destination: destination,
            departureTime: '18:30',
            arrivalTime: '21:00',
            duration: '2h 30m',
            class: 'bisnis',
            layover: '1h 45m'
          }
        ],
        totalDuration: '11h 30m',
        totalPrice: 380000,
        totalTransfers: 2
      }
    ];
    
    // Filter options based on availability (mock logic)
    const availableOptions = mockOptions.filter(option => {
      // In real implementation, check seat availability for each segment
      return true;
    });
    
    const response: ApiResponse = {
      success: true,
      options: availableOptions,
      total: availableOptions.length
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error fetching multi-segment options:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Terjadi kesalahan saat mengambil opsi multi-segmen' 
      },
      { status: 500 }
    );
  }
}