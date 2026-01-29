// app/api/trains/direct/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Type definitions
interface Train {
  id: string;
  name: string;
  scheduleId: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  availableSeats: number;
  pricePerPassenger: number;
  class: 'ekonomi' | 'bisnis' | 'eksekutif';
  facilities: string[];
}

interface ApiResponse {
  success: boolean;
  message?: string;
  trains?: Train[];
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
    
    // Validate passengers
    if (passengers < 1 || passengers > 10) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Jumlah penumpang harus antara 1-10' 
        },
        { status: 400 }
      );
    }
    
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Format tanggal tidak valid. Gunakan YYYY-MM-DD' 
        },
        { status: 400 }
      );
    }
    
    // In production, you would query your database here
    // This is mock data for demonstration
    const mockTrains: Train[] = [
      {
        id: 'TR001',
        name: 'Argo Bromo',
        scheduleId: 'SCH001',
        origin: origin,
        destination: destination,
        departureTime: '08:00',
        arrivalTime: '14:30',
        duration: '6h 30m',
        availableSeats: Math.floor(Math.random() * 50) + 10,
        pricePerPassenger: 250000,
        class: 'eksekutif',
        facilities: ['AC', 'Makan', 'Power Outlet', 'WiFi']
      },
      {
        id: 'TR002',
        name: 'Taksaka',
        scheduleId: 'SCH002',
        origin: origin,
        destination: destination,
        departureTime: '10:30',
        arrivalTime: '17:45',
        duration: '7h 15m',
        availableSeats: Math.floor(Math.random() * 50) + 10,
        pricePerPassenger: 180000,
        class: 'bisnis',
        facilities: ['AC', 'Snack', 'Power Outlet']
      },
      {
        id: 'TR003',
        name: 'Gajayana',
        scheduleId: 'SCH003',
        origin: origin,
        destination: destination,
        departureTime: '14:00',
        arrivalTime: '20:15',
        duration: '6h 15m',
        availableSeats: Math.floor(Math.random() * 50) + 10,
        pricePerPassenger: 120000,
        class: 'ekonomi',
        facilities: ['AC', 'Toilet']
      }
    ];
    
    // Filter trains with sufficient seats
    const availableTrains = mockTrains.filter(train => 
      train.availableSeats >= passengers
    );
    
    const response: ApiResponse = {
      success: true,
      trains: availableTrains,
      total: availableTrains.length
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error fetching direct trains:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Terjadi kesalahan saat mengambil data kereta' 
      },
      { status: 500 }
    );
  }
}