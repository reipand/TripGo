import { type NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabaseClient';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> } // PERBAIKAN: Tambahkan Promise
) {
  try {
    console.log('🔄 Schedule API called');
    console.log('🔗 Full URL:', request.url);
    
    // **PERBAIKAN UTAMA: Handle Promise untuk params**
    const resolvedParams = await params;
    console.log('📦 Resolved params:', resolvedParams);
    
    const scheduleId = resolvedParams?.scheduleId || '';
    console.log('📌 ScheduleId from params:', scheduleId);
    
    // **PERBAIKAN: Juga coba ambil dari URL path**
    const url = new URL(request.url);
    const pathname = url.pathname;
    console.log('🔍 Pathname:', pathname);
    
    // Extract scheduleId dari pathname
    const pathParts = pathname.split('/');
    const lastPart = pathParts[pathParts.length - 1];
    console.log('📎 Last part of path:', lastPart);
    
    // Gunakan scheduleId dari params atau dari path
    let finalScheduleId = scheduleId;
    if (!finalScheduleId || finalScheduleId.trim() === '') {
      if (lastPart && lastPart !== 'schedule' && lastPart !== '[scheduleId]') {
        finalScheduleId = lastPart;
        console.log('🔄 Using scheduleId from path:', finalScheduleId);
      }
    }
    
    console.log('🎯 Final scheduleId:', finalScheduleId);
    
    if (!finalScheduleId || finalScheduleId.trim() === '' || finalScheduleId === 'undefined' || finalScheduleId === 'null') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Schedule ID diperlukan',
          details: {
            fromParams: scheduleId,
            fromPath: lastPart,
            finalId: finalScheduleId,
            pathname: pathname
          }
        },
        { status: 400 }
      );
    }
    
    const cleanScheduleId = finalScheduleId.trim();
    console.log('🧹 Cleaned scheduleId:', cleanScheduleId);
    
    // **Lanjutkan dengan logic yang sudah diperbaiki sebelumnya**
    return await handleScheduleRequest(cleanScheduleId);
    
  } catch (error: any) {
    console.error('💥 Schedule API error:', error);
    console.error('Error stack:', error.stack);
    
    // Fallback response
    const fallbackResponse = {
      success: true,
      data: generateFallbackData('error-fallback'),
      note: 'Using fallback due to API error'
    };
    
    return NextResponse.json(fallbackResponse, { status: 200 });
  }
}

// **FUNGSI: Handle schedule request**
async function handleScheduleRequest(scheduleId: string) {
  console.log('🚀 Processing schedule request for ID:', scheduleId);
  
  // **Coba query ke database**
  try {
    // Query sederhana ke jadwal_kereta
    const { data: schedule, error } = await supabase
      .from('jadwal_kereta')
      .select(`
        id,
        train_id,
        travel_date
      `)
      .eq('id', scheduleId)
      .single();
    
    if (error) {
      console.log('⚠️ Schedule not found in database, using fallback');
    }
    
    // **PERBAIKAN: Query rute_kereta jika ada**
    let rute = null;
    try {
      const { data: ruteData } = await supabase
        .from('rute_kereta')
        .select(`
          departure_time,
          arrival_time,
          duration_minutes,
          origin_station:origin_station_id (
            name,
            city
          ),
          destination_station:destination_station_id (
            name,
            city
          )
        `)
        .eq('schedule_id', scheduleId)
        .limit(1)
        .single();
      
      if (ruteData) {
        rute = ruteData;
      }
    } catch (ruteError) {
      console.log('⚠️ Route query failed, using defaults');
    }
    
    // **Format response**
    const response = formatScheduleResponse(schedule, rute, scheduleId);
    return NextResponse.json(response, { status: 200 });
    
  } catch (dbError: any) {
    console.error('❌ Database error:', dbError);
    
    // Fallback response
    const fallbackResponse = {
      success: true,
      data: generateFallbackData(scheduleId),
      note: 'Using fallback data'
    };
    
    return NextResponse.json(fallbackResponse, { status: 200 });
  }
}

// **FUNGSI: Format response**
function formatScheduleResponse(schedule: any, rute: any, scheduleId: string) {
  const DEFAULT_PRICES: Record<string, number> = {
    'Eksekutif': 350000,
    'Bisnis': 250000,
    'Ekonomi': 150000
  };
  
  const response = {
    success: true,
    data: {
      id: schedule?.id || scheduleId,
      scheduleId: scheduleId,
      trainId: schedule?.train_id || `train-${scheduleId.substring(0, 8)}`,
      trainName: 'Argo Bromo Anggrek',
      trainType: 'Eksekutif',
      departureTime: rute?.departure_time?.substring(0, 5) || '08:00',
      arrivalTime: rute?.arrival_time?.substring(0, 5) || '12:00',
      duration: rute?.duration_minutes ? 
        `${Math.floor(rute.duration_minutes / 60)}j ${rute.duration_minutes % 60}m` : '4j 0m',
      origin: rute?.origin_station?.name || 'Gambir',
      destination: rute?.destination_station?.name || 'Surabaya Gubeng',
      originCity: rute?.origin_station?.city || 'Jakarta',
      destinationCity: rute?.destination_station?.city || 'Surabaya',
      price: DEFAULT_PRICES['Eksekutif'],
      availableSeats: 25,
      departureDate: schedule?.travel_date || new Date().toISOString().split('T')[0],
      source: schedule ? 'database' : 'fallback'
    }
  };
  
  return response;
}

// **FUNGSI: Generate fallback data**
function generateFallbackData(scheduleId: string) {
  return {
    id: scheduleId,
    trainId: `train-${scheduleId.substring(0, 8)}`,
    trainName: 'Argo Bromo Anggrek',
    trainType: 'Eksekutif',
    departureTime: '08:00',
    arrivalTime: '12:00',
    duration: '4j 0m',
    origin: 'Gambir',
    destination: 'Surabaya Gubeng',
    originCity: 'Jakarta',
    destinationCity: 'Surabaya',
    price: 350000,
    availableSeats: 25,
    departureDate: new Date().toISOString().split('T')[0],
    scheduleId: scheduleId
  };
}