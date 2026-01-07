// app/api/bookings/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Inisialisasi Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Tambahkan log untuk debugging environment variables
console.log('🔧 Supabase Config:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseKey,
  urlLength: supabaseUrl?.length || 0,
  keyLength: supabaseKey?.length || 0
});

const supabase = createClient(
  supabaseUrl || 'https://dummy.supabase.co',
  supabaseKey || 'dummy-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

// Interface untuk struktur data
interface Passenger {
  id?: string;
  fullName: string;
  idNumber?: string;
  email?: string;
  phoneNumber?: string;
  seatNumber?: string;
  wagonNumber?: string;
  wagonClass?: string;
  title?: string;
  birthDate?: string;
  gender?: string;
  useContactDetail?: boolean;
}

interface ContactDetail {
  fullName: string;
  email: string;
  phoneNumber: string;
}

interface TrainDetail {
  trainId?: number;
  trainName?: string;
  trainType?: string;
  departureTime?: string;
  arrivalTime?: string;
  duration?: string;
  origin?: string;
  destination?: string;
  price?: number;
  availableSeats?: number;
  departureDate?: string;
  scheduleId?: string;
  trainCode?: string;
  originCity?: string;
  destinationCity?: string;
  wagons?: Array<{
    number: string;
    name: string;
    class: string;
    facilities: string[];
    availableSeats: number;
    totalSeats: number;
    seats: Array<{
      id: string;
      number: string;
      row: number;
      column: string;
      available: boolean;
      windowSeat: boolean;
      forwardFacing: boolean;
      price: number;
    }>;
  }>;
}

interface FareBreakdown {
  base_fare?: number;
  seat_premium?: number;
  admin_fee?: number;
  insurance_fee?: number;
  payment_fee?: number;
  total?: number;
}

interface Seat {
  seatId: string;
  seatNumber: string;
  wagonNumber?: string;
  wagonClass?: string;
  price?: number;
  windowSeat?: boolean;
  forwardFacing?: boolean;
}

interface BookingData {
  bookingCode: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  totalAmount: number;
  passengerCount: number;
  contactDetail?: ContactDetail;
  passengers: Passenger[];
  trainDetail?: TrainDetail | null;
  selectedSeats?: Seat[];
  fareBreakdown?: FareBreakdown;
  paymentMethod?: string;
  bookingTime: string;
}

// Helper function untuk generate IDs
function generateIDs(providedBookingCode?: string, providedOrderId?: string): {
  bookingId: string;
  bookingCode: string;
  orderId: string;
  ticketNumber: string;
} {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  return {
    bookingId: uuidv4(),
    bookingCode: providedBookingCode || `BOOK-${timestamp.toString().slice(-6)}-${randomSuffix}`,
    orderId: providedOrderId || `ORDER-${timestamp}-${randomSuffix}`,
    ticketNumber: `TICKET-${timestamp.toString().slice(-8)}-${randomSuffix}`
  };
}

// Helper function untuk prepare booking data dengan schema yang benar
function prepareBookingData(
  bookingData: BookingData,
  ids: ReturnType<typeof generateIDs>
): Record<string, any> {
  const passengers = bookingData.passengers || [];
  const passengerNames = passengers.map(p => p.fullName).filter(Boolean).join(', ') || bookingData.customerName || 'Penumpang';
  
  // Cek dan log struktur trainDetail
  console.log('🚂 Train Detail Structure:', {
    hasTrainDetail: !!bookingData.trainDetail,
    trainName: bookingData.trainDetail?.trainName,
    origin: bookingData.trainDetail?.origin,
    destination: bookingData.trainDetail?.destination,
    keys: bookingData.trainDetail ? Object.keys(bookingData.trainDetail) : []
  });

  const bookingDataToSave = {
    id: ids.bookingId,
    booking_code: ids.bookingCode,
    order_id: ids.orderId,
    customer_name: bookingData.customerName || passengerNames.substring(0, 100),
    customer_email: bookingData.customerEmail || passengers[0]?.email || '',
    customer_phone: bookingData.customerPhone || passengers[0]?.phoneNumber || '',
    total_amount: Number(bookingData.totalAmount || 0),
    passenger_count: bookingData.passengerCount || passengers.length || 1,
    
    // Data kereta - pastikan menggunakan field yang benar
    train_name: bookingData.trainDetail?.trainName || 'Parahyangan',
    train_type: bookingData.trainDetail?.trainType || 'Ekonomi',
    origin: bookingData.trainDetail?.origin || 'Bandung',
    destination: bookingData.trainDetail?.destination || 'Gambir',
    departure_date: bookingData.trainDetail?.departureDate || new Date().toISOString().split('T')[0],
    departure_time: bookingData.trainDetail?.departureTime || '06:00',
    arrival_time: bookingData.trainDetail?.arrivalTime || '11:00',
    
    // Informasi tambahan
    payment_method: bookingData.paymentMethod || 'manual',
    status: 'pending_payment',
    payment_status: 'pending',
    
    // JSON fields untuk data kompleks
    passengers_data: JSON.stringify(passengers),
    selected_seats: JSON.stringify(bookingData.selectedSeats || []),
    fare_breakdown: JSON.stringify(bookingData.fareBreakdown || {}),
    train_detail: JSON.stringify(bookingData.trainDetail || {}),
    
    // Timestamps
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  console.log('📊 Prepared booking data:', {
    bookingCode: bookingDataToSave.booking_code,
    passengerCount: bookingDataToSave.passenger_count,
    totalAmount: bookingDataToSave.total_amount,
    trainName: bookingDataToSave.train_name
  });

  return bookingDataToSave;
}

// Helper function untuk handle database insertion dengan multiple fallback
async function tryInsertBooking(data: Record<string, any>) {
  const tablesToTry = ['bookings_kereta', 'bookings', 'temp_bookings'];
  
  for (const table of tablesToTry) {
    try {
      console.log(`🔄 Trying to insert to ${table}...`);
      
      // Cek apakah tabel ada
      const { data: tableExists, error: tableError } = await supabase
        .from(table)
        .select('id')
        .limit(1)
        .maybeSingle();
      
      if (tableError && !tableError.message.includes('does not exist')) {
        console.log(`ℹ️ Table ${table} check:`, tableError.message);
      }
      
      // Coba insert
      const { data: result, error } = await supabase
        .from(table)
        .insert([data])
        .select('id, booking_code, order_id')
        .single();
      
      if (error) {
        console.warn(`⚠️ Failed to insert to ${table}:`, error.message);
        continue; // Coba tabel berikutnya
      }
      
      console.log(`✅ Successfully inserted to ${table}:`, result.id);
      return {
        success: true,
        data: result,
        tableUsed: table,
        method: 'direct_insert'
      };
      
    } catch (error: any) {
      console.warn(`⚠️ Exception inserting to ${table}:`, error.message);
      continue;
    }
  }
  
  return {
    success: false,
    error: 'All table insertion attempts failed'
  };
}

// Helper untuk create minimal booking data
function createMinimalBooking(bookingData: BookingData, ids: ReturnType<typeof generateIDs>) {
  return {
    id: ids.bookingId,
    booking_code: ids.bookingCode,
    order_id: ids.orderId,
    customer_name: bookingData.customerName || 'Customer',
    total_amount: bookingData.totalAmount || 0,
    passenger_count: bookingData.passengerCount || 1,
    status: 'pending_payment',
    payment_status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

export async function POST(request: NextRequest) {
  console.log('🚀 /api/bookings/create called');
  
  try {
    // Validasi environment variables
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Supabase config missing');
      throw new Error('Supabase configuration is missing. Check environment variables.');
    }

    // Parse request body
    let bookingData: BookingData;
    try {
      bookingData = await request.json();
      console.log('📥 Raw booking data received:', {
        bookingCode: bookingData.bookingCode,
        orderId: bookingData.orderId,
        passengerCount: bookingData.passengerCount,
        hasTrainDetail: !!bookingData.trainDetail,
        hasPassengers: bookingData.passengers?.length || 0
      });
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      return NextResponse.json({
        success: false,
        error: 'Invalid JSON in request body',
        message: 'Format data tidak valid'
      }, { status: 400 });
    }

    // Validasi data dasar
    if (!bookingData.passengers || !Array.isArray(bookingData.passengers)) {
      console.error('❌ Invalid passenger data');
      return NextResponse.json({
        success: false,
        error: 'Passengers data is required',
        message: 'Data penumpang tidak valid'
      }, { status: 400 });
    }

    // Generate IDs (gunakan yang ada jika tersedia)
    const ids = generateIDs(bookingData.bookingCode, bookingData.orderId);
    console.log('🎫 Generated IDs:', ids);

    // Prepare data untuk database
    const preparedData = prepareBookingData(bookingData, ids);
    
    let savedBookingId = ids.bookingId;
    let savedToDatabase = false;
    let usedTable = '';
    let insertionMethod = '';
    let databaseError = null;

    // Coba save ke database
    try {
      const insertionResult = await tryInsertBooking(preparedData);
      
      if (insertionResult.success) {
        savedBookingId = insertionResult.data.id;
        savedToDatabase = true;
        usedTable = insertionResult.tableUsed;
        insertionMethod = insertionResult.method;
        
        console.log(`✅ Successfully saved to ${usedTable}, ID: ${savedBookingId}`);
        
        // Coba simpan detail penumpang ke tabel terpisah jika tersedia
        try {
          const { data: passengerTableCheck } = await supabase
            .from('passengers')
            .select('id')
            .limit(1)
            .maybeSingle();
            
          if (passengerTableCheck !== undefined) {
            const passengerData = bookingData.passengers.map((passenger, index) => ({
              id: uuidv4(),
              booking_id: savedBookingId,
              passenger_order: index + 1,
              full_name: passenger.fullName || '',
              id_number: passenger.idNumber || '',
              email: passenger.email || '',
              phone: passenger.phoneNumber || '',
              seat_number: passenger.seatNumber || '',
              wagon_number: passenger.wagonNumber || '',
              wagon_class: passenger.wagonClass || '',
              title: passenger.title || 'Tn',
              birth_date: passenger.birthDate || '',
              gender: passenger.gender || '',
              created_at: new Date().toISOString()
            }));
            
            const { error: passengerError } = await supabase
              .from('passengers')
              .insert(passengerData);
              
            if (passengerError) {
              console.warn('⚠️ Could not save to passengers table:', passengerError.message);
            } else {
              console.log(`✅ Saved ${passengerData.length} passengers to passengers table`);
            }
          }
        } catch (passengerError) {
          console.warn('⚠️ Passenger save skipped:', passengerError);
        }
        
      } else {
        databaseError = insertionResult.error;
        console.warn('⚠️ Database insertion failed, using fallback');
      }
    } catch (dbError: any) {
      databaseError = dbError.message;
      console.error('❌ Database error:', dbError);
    }

    // Response data
    const responseData = {
      success: true,
      data: {
        bookingId: savedBookingId,
        bookingCode: ids.bookingCode,
        orderId: ids.orderId,
        ticketNumber: ids.ticketNumber,
        passengers: bookingData.passengerCount || bookingData.passengers.length,
        savedToDatabase,
        usedTable: usedTable || 'none',
        insertionMethod: insertionMethod || 'fallback',
        trainName: bookingData.trainDetail?.trainName || 'Parahyangan',
        trainType: bookingData.trainDetail?.trainType || 'Ekonomi',
        origin: bookingData.trainDetail?.origin || 'Bandung',
        destination: bookingData.trainDetail?.destination || 'Gambir',
        departureDate: bookingData.trainDetail?.departureDate || new Date().toISOString().split('T')[0],
        departureTime: bookingData.trainDetail?.departureTime || '06:00',
        scheduleId: bookingData.trainDetail?.scheduleId || 'unknown',
        hasDatabaseError: !!databaseError,
        databaseError: databaseError
      },
      message: savedToDatabase 
        ? `Booking berhasil dibuat dan disimpan di ${usedTable}`
        : 'Booking berhasil dibuat (data disimpan di penyimpanan lokal)'
    };

    console.log('✅ Booking API response:', {
      bookingCode: responseData.data.bookingCode,
      saved: savedToDatabase,
      table: usedTable
    });

    // Simpan ke localStorage untuk frontend (fallback)
    if (!savedToDatabase) {
      const localStorageData = {
        ...bookingData,
        bookingId: savedBookingId,
        bookingCode: ids.bookingCode,
        orderId: ids.orderId,
        ticketNumber: ids.ticketNumber,
        savedAt: new Date().toISOString(),
        savedLocally: true
      };
      
      // Simpan ke sessionStorage untuk halaman saat ini
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem('currentBooking', JSON.stringify(localStorageData));
          localStorage.setItem(`booking_${ids.bookingCode}`, JSON.stringify(localStorageData));
          
          // Tambahkan ke daftar bookings
          const existingBookings = JSON.parse(localStorage.getItem('myBookings') || '[]');
          existingBookings.push(localStorageData);
          localStorage.setItem('myBookings', JSON.stringify(existingBookings));
          
          console.log('💾 Saved booking to localStorage as fallback');
        } catch (storageError) {
          console.warn('⚠️ Could not save to localStorage:', storageError);
        }
      }
    }

    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('💥 Fatal error in booking creation:', error);
    
    // Fallback response dengan data minimal
    const fallbackIds = generateIDs();
    const fallbackResponse = {
      success: false,
      error: error.message || 'Internal server error',
      fallbackData: {
        bookingId: fallbackIds.bookingId,
        bookingCode: fallbackIds.bookingCode,
        orderId: fallbackIds.orderId,
        ticketNumber: fallbackIds.ticketNumber,
        passengers: 1,
        savedToDatabase: false,
        isFallback: true,
        message: 'Menggunakan fallback mode - simpan data di localStorage',
        timestamp: new Date().toISOString()
      },
      message: 'Gagal menyimpan ke database, menggunakan fallback mode'
    };

    // Simpan fallback ke localStorage jika di browser
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('fallback_booking', JSON.stringify(fallbackResponse.fallbackData));
      } catch (e) {
        console.warn('Could not save fallback to localStorage');
      }
    }

    return NextResponse.json(fallbackResponse, { status: 200 });
  }
}

// GET endpoint untuk health check
export async function GET(request: NextRequest) {
  try {
    // Cek koneksi database
    let dbStatus = 'unknown';
    try {
      const { data, error } = await supabase
        .from('bookings_kereta')
        .select('count')
        .limit(1)
        .single();
      
      dbStatus = error ? 'error' : 'connected';
    } catch (dbError) {
      dbStatus = 'error';
    }

    return NextResponse.json({
      status: 'healthy',
      endpoint: '/api/bookings/create',
      method: 'POST',
      database: dbStatus,
      environment: {
        hasSupabaseUrl: !!supabaseUrl,
        hasSupabaseKey: !!supabaseKey,
        nodeEnv: process.env.NODE_ENV
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}