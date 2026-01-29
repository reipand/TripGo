// app/api/trains/transit-stations/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Type definitions
interface TransitStation {
  stationId: string;
  stationName: string;
  arrivalTime: string;
  departureTime: string;
  platform: string;
  stopDuration: string;
  sequence: number;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  transitStations?: TransitStation[];
  totalStations?: number;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Extract query parameters
    const scheduleId = searchParams.get('scheduleId');
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');
    
    // Validate required parameters
    if (!scheduleId) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Parameter scheduleId diperlukan' 
        },
        { status: 400 }
      );
    }
    
    // In production, you would query your database for the train schedule
    // This is mock data for demonstration
    const mockTransitStations: TransitStation[] = [
      {
        stationId: 'ST001',
        stationName: 'Stasiun Gambir',
        arrivalTime: origin === 'ST001' ? '--:--' : '09:45',
        departureTime: '09:50',
        platform: '3',
        stopDuration: '5m',
        sequence: 1
      },
      {
        stationId: 'ST002',
        stationName: 'Stasiun Bandung',
        arrivalTime: '12:15',
        departureTime: '12:20',
        platform: '1',
        stopDuration: '5m',
        sequence: 2
      },
      {
        stationId: 'ST003',
        stationName: 'Stasiun Cirebon',
        arrivalTime: '14:30',
        departureTime: '14:40',
        platform: '2',
        stopDuration: '10m',
        sequence: 3
      },
      {
        stationId: 'ST004',
        stationName: 'Stasiun Tegal',
        arrivalTime: '16:10',
        departureTime: destination === 'ST004' ? '--:--' : '16:15',
        platform: '4',
        stopDuration: '5m',
        sequence: 4
      }
    ];
    
    // Filter stations based on origin and destination if provided
    let filteredStations = [...mockTransitStations];
    
    if (origin) {
      filteredStations = filteredStations.filter(station => 
        station.stationId !== origin
      );
    }
    
    if (destination) {
      filteredStations = filteredStations.filter(station => 
        station.stationId !== destination
      );
    }
    
    // Adjust sequence after filtering
    filteredStations = filteredStations.map((station, index) => ({
      ...station,
      sequence: index + 1
    }));
    
    const response: ApiResponse = {
      success: true,
      transitStations: filteredStations,
      totalStations: filteredStations.length
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error fetching transit stations:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Terjadi kesalahan saat mengambil data stasiun transit' 
      },
      { status: 500 }
    );
  }
}                                                                                                                                                                                                                                                                                                                                   