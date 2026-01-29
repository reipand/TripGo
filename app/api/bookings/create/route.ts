// app/api/bookings/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Inisialisasi Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validasi environment variables
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase environment variables are missing!');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

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
  transitStation?: string;
  transitArrival?: string;
  transitDeparture?: string;
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
  user_id?: string;
  bookingTime: string;
  // Transit data
  transitStation?: string;
  transitArrival?: string;
  transitDeparture?: string;
  transitDiscount?: number;
  transitAdditionalPrice?: number;
  // Fare breakdown details
  seatPremium?: number;
  adminFee?: number;
  insuranceFee?: number;
  basePrice?: number;
  // Multi-segment
  isMultiSegment?: boolean;
  segments?: any[];
}

// FUNGSI BARU: Decode email
function decodeEmail(email: string): string {
  if (!email) return '';
  
  try {
    console.log('📧 Email decoding process:', { original: email });
    
    // Case 1: Sudah benar (@gmail.com)
    if (email.includes('@')) {
      console.log('✅ Email already has @ symbol');
      return email;
    }
    
    // Case 2: %40 encoding (single encoded)
    if (email.includes('%40')) {
      let decoded = decodeURIComponent(email);
      console.log('🔧 Decoded %40:', { before: email, after: decoded });
      
      // Jika masih ada encoding setelah decode pertama
      if (decoded.includes('%40')) {
        decoded = decodeURIComponent(decoded);
        console.log('🔧 Double decoded:', { before: email, after: decoded });
      }
      return decoded;
    }
    
    // Case 3: %2540 encoding (double encoded)
    if (email.includes('%2540')) {
      const decoded = decodeURIComponent(decodeURIComponent(email));
      console.log('🔧 Decoded %2540:', { before: email, after: decoded });
      return decoded;
    }
    
    console.log('⚠️ Email format unknown, returning as-is:', email);
    return email;
  } catch (error) {
    console.error('❌ Error decoding email:', error);
    return email || '';
  }
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

// PERBAIKAN: Helper function untuk prepare booking data dengan email decoding
function prepareBookingData(
  bookingData: BookingData,
  ids: ReturnType<typeof generateIDs>
): Record<string, any> {
  const passengers = bookingData.passengers || [];
  const passengerNames = passengers.map(p => p.fullName).filter(Boolean).join(', ') || bookingData.customerName || 'Penumpang';

  // Ambil data transit dari passenger pertama atau dari booking data langsung
  const firstPassenger = passengers[0];
  const transitStation = firstPassenger?.transitStation || bookingData.transitStation;
  const transitArrival = firstPassenger?.transitArrival || bookingData.transitArrival;
  const transitDeparture = firstPassenger?.transitDeparture || bookingData.transitDeparture;

  // PERBAIKAN: Decode email sebelum disimpan
  const customerEmail = decodeEmail(bookingData.customerEmail || passengers[0]?.email || '');
  const passengerEmail = decodeEmail(passengers[0]?.email || bookingData.customerEmail || '');

  console.log('🚂 Train Detail Structure:', {
    hasTrainDetail: !!bookingData.trainDetail,
    trainName: bookingData.trainDetail?.trainName,
    origin: bookingData.trainDetail?.origin,
    destination: bookingData.trainDetail?.destination,
    transitStation,
    transitArrival,
    transitDeparture,
    transitDiscount: bookingData.transitDiscount,
    transitAdditionalPrice: bookingData.transitAdditionalPrice,
    email_original: bookingData.customerEmail,
    email_decoded: customerEmail
  });

  const bookingDataToSave = {
    id: ids.bookingId,
    booking_code: ids.bookingCode,
    order_id: ids.orderId,
    passenger_name: bookingData.customerName || passengerNames.substring(0, 100),
    passenger_email: passengerEmail, // Email yang sudah di-decode
    customer_email: customerEmail,   // Email yang sudah di-decode
    passenger_phone: bookingData.customerPhone || passengers[0]?.phoneNumber || '',
    user_id: bookingData.user_id || null,
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
    train_code: bookingData.trainDetail?.trainCode || '',

    // Transit data
    transit_station: transitStation || null,
    transit_arrival: transitArrival || null,
    transit_departure: transitDeparture || null,
    transit_discount: bookingData.transitDiscount || 0,
    transit_total_adjustment: bookingData.transitAdditionalPrice || 0,
    
    // Fare breakdown
    seat_premium: bookingData.seatPremium || 0,
    admin_fee: bookingData.adminFee || 5000,
    insurance_fee: bookingData.insuranceFee || 10000,
    base_price: bookingData.basePrice || 265000,
    promo_discount: 0, // Default value

    // Informasi tambahan
    payment_method: bookingData.paymentMethod || 'manual',
    status: 'pending_payment',
    payment_status: 'pending',
    is_multi_segment: bookingData.isMultiSegment || false,
    segments: bookingData.segments ? JSON.stringify(bookingData.segments) : '[]',

    // Passenger details as text (for the passenger_details column)
    passenger_details: JSON.stringify(passengers),

    // Timestamps
    booking_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  console.log('📊 Prepared booking data:', {
    bookingCode: bookingDataToSave.booking_code,
    passengerCount: bookingDataToSave.passenger_count,
    totalAmount: bookingDataToSave.total_amount,
    trainName: bookingDataToSave.train_name,
    customerEmail: bookingDataToSave.customer_email,
    passengerEmail: bookingDataToSave.passenger_email,
    transitStation: bookingDataToSave.transit_station,
    transitDiscount: bookingDataToSave.transit_discount,
    transitAdditionalPrice: bookingDataToSave.transit_total_adjustment,
    seatPremium: bookingDataToSave.seat_premium,
    basePrice: bookingDataToSave.base_price
  });

  return bookingDataToSave;
}

// PERBAIKAN: Helper function untuk handle database insertion dengan schema validation
async function tryInsertBooking(data: Record<string, any>) {
  const tablesToTry = ['bookings_kereta', 'bookings', 'temp_bookings'];

  for (const table of tablesToTry) {
    try {
      console.log(`🔄 Trying to insert to ${table}...`);

      // Cek schema tabel terlebih dahulu
      const { data: columns, error: schemaError } = await supabase
        .from(table)
        .select('*')
        .limit(0);

      if (schemaError) {
        console.warn(`⚠️ Table ${table} may not exist or schema error:`, schemaError.message);
        continue; // Coba tabel berikutnya
      }

      // Filter hanya kolom yang ada di tabel
      const tableColumns = Object.keys(columns || {});
      const filteredData: Record<string, any> = {};

      // Filter data berdasarkan kolom yang ada di tabel
      for (const [key, value] of Object.entries(data)) {
        // Map nama field jika berbeda
        let mappedKey = key;
        
        // Mapping untuk kolom umum
        if (key === 'booking_code' && !tableColumns.includes('booking_code')) {
          mappedKey = 'bookingCode';
        }
        if (key === 'order_id' && !tableColumns.includes('order_id')) {
          mappedKey = 'orderId';
        }
        if (key === 'passenger_email' && !tableColumns.includes('passenger_email')) {
          mappedKey = 'customerEmail';
        }
        
        if (tableColumns.includes(mappedKey) || tableColumns.includes(key)) {
          filteredData[mappedKey] = value;
        }
      }

      // Pastikan required fields ada
      if (!filteredData.id) filteredData.id = data.id || uuidv4();
      if (!filteredData.booking_code && !filteredData.bookingCode) {
        filteredData.booking_code = data.booking_code;
      }
      if (!filteredData.order_id && !filteredData.orderId) {
        filteredData.order_id = data.order_id;
      }

      // Tambahkan timestamp jika tidak ada
      if (!filteredData.created_at && !filteredData.createdAt) {
        filteredData.created_at = new Date().toISOString();
      }

      // Coba insert
      const { data: result, error } = await supabase
        .from(table)
        .insert([filteredData])
        .select('id, booking_code, order_id')
        .single();

      if (error) {
        console.warn(`⚠️ Failed to insert to ${table}:`, error.message);
        
        // Coba dengan data minimal
        if (error.message.includes('column') || error.message.includes('does not exist')) {
          console.log(`🔄 Trying minimal insert to ${table}`);
          
          const minimalData = {
            id: filteredData.id,
            booking_code: filteredData.booking_code || filteredData.bookingCode,
            order_id: filteredData.order_id || filteredData.orderId,
            passenger_name: filteredData.passenger_name || 'Penumpang',
            total_amount: filteredData.total_amount || 0,
            status: 'pending_payment',
            created_at: filteredData.created_at
          };
          
          const { data: simpleResult, error: simpleError } = await supabase
            .from(table)
            .insert([minimalData])
            .select('id, booking_code, order_id')
            .single();
            
          if (!simpleError) {
            console.log(`✅ Successfully inserted simplified data to ${table}:`, simpleResult.id);
            return {
              success: true,
              data: simpleResult,
              tableUsed: table,
              method: 'simplified_insert'
            };
          }
        }
        
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

// FUNGSI BARU: Cek dan buat tabel jika tidak ada
async function ensureTableExists(tableName: string, createSQL: string): Promise<boolean> {
  try {
    // Cek apakah tabel ada
    const { data, error } = await supabase
      .from(tableName)
      .select('id')
      .limit(1)
      .maybeSingle();

    if (error && error.message.includes('does not exist')) {
      console.log(`⚠️ Table ${tableName} does not exist`);
      console.log(`📋 SQL to create table ${tableName}:`);
      console.log(createSQL);
      return false;
    }
    
    return true;
  } catch (error) {
    console.warn(`⚠️ Error checking table ${tableName}:`, error);
    return false;
  }
}

// Perbaikan fungsi untuk menyimpan data penumpang
async function savePassengers(bookingId: string, passengers: Passenger[]) {
  try {
    // Decode email penumpang sebelum disimpan
    const passengerData = passengers.map((passenger, index) => ({
      id: uuidv4(),
      booking_id: bookingId,
      passenger_id: `PASS-${Date.now()}-${index}`,
      full_name: passenger.fullName || '',
      email: decodeEmail(passenger.email || ''), // Decode email penumpang
      phone: passenger.phoneNumber || '',
      seat_number: passenger.seatNumber || '',
      seat_id: passenger.seatNumber ? `seat-${passenger.seatNumber}` : '',
      segment_id: passenger.seatNumber ? `segment-${passenger.seatNumber}` : '',
      transit_station: passenger.transitStation || null,
      transit_arrival: passenger.transitArrival || null,
      transit_departure: passenger.transitDeparture || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('passengers')
      .insert(passengerData)
      .select('id, full_name, email');

    if (error) {
      // Jika tabel tidak ada, coba buat dulu
      if (error.message.includes('does not exist')) {
        console.log('⚠️ passengers table does not exist, creating...');
        
        // SQL untuk membuat tabel passengers
        const createSQL = `
          CREATE TABLE IF NOT EXISTS public.passengers (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            booking_id uuid REFERENCES public.bookings_kereta(id),
            passenger_id character varying,
            full_name character varying NOT NULL,
            email character varying,
            phone character varying,
            seat_number character varying,
            seat_id character varying,
            segment_id character varying,
            transit_station character varying,
            transit_arrival time without time zone,
            transit_departure time without time zone,
            created_at timestamp without time zone DEFAULT now(),
            updated_at timestamp without time zone DEFAULT now()
          );
        `;
        
        await ensureTableExists('passengers', createSQL);
        
        // Coba insert lagi setelah create (akan gagal di sini karena kita tidak bisa eksekusi DDL dari client)
        console.log('⚠️ Table creation SQL logged above. Please run migration manually.');
        
        return {
          success: false,
          error: 'Passengers table does not exist. Run migration first.',
          savedCount: 0
        };
      }
      
      console.warn('⚠️ Error saving passengers:', error.message);
      return {
        success: false,
        error: error.message,
        savedCount: 0
      };
    }

    console.log(`✅ Saved ${data?.length || 0} passengers to passengers table`);
    return {
      success: true,
      savedCount: data?.length || 0,
      data
    };

  } catch (error: any) {
    console.warn('⚠️ Exception saving passengers:', error.message);
    return {
      success: false,
      error: error.message,
      savedCount: 0
    };
  }
}

// Perbaikan fungsi untuk membuat record tiket
async function createTicketRecord(bookingCode: string, ticketNumber: string, bookingData: BookingData) {
  try {
    const ticketData = {
      booking_id: bookingCode,
      ticket_number: ticketNumber,
      passenger_name: bookingData.customerName,
      passenger_email: decodeEmail(bookingData.customerEmail), // Decode email
      train_name: bookingData.trainDetail?.trainName || 'Parahyangan',
      departure_date: bookingData.trainDetail?.departureDate || new Date().toISOString().split('T')[0],
      departure_time: bookingData.trainDetail?.departureTime || '06:00',
      arrival_time: bookingData.trainDetail?.arrivalTime || '11:00',
      origin: bookingData.trainDetail?.origin || 'Bandung',
      destination: bookingData.trainDetail?.destination || 'Gambir',
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('tickets')
      .insert([ticketData])
      .select('ticket_number')
      .single();

    if (error) {
      console.warn('⚠️ Error creating ticket record:', error.message);
      return {
        success: false,
        error: error.message
      };
    }

    console.log('✅ Ticket record created:', data.ticket_number);
    return {
      success: true,
      ticketNumber: data.ticket_number
    };

  } catch (error: any) {
    console.warn('⚠️ Exception creating ticket record:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// PERBAIKAN: Fungsi utama dengan email decoding
export async function POST(request: NextRequest) {
  console.log('🚀 /api/bookings/create called');

  try {
    // Validasi environment variables
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Supabase config missing');
      return NextResponse.json({
        success: false,
        error: 'Supabase configuration is missing',
        message: 'Konfigurasi database tidak lengkap'
      }, { status: 500 });
    }

    // Parse request body
    let bookingData: BookingData;
    try {
      bookingData = await request.json();
      
      // PERBAIKAN: Decode email di sini sebelum diproses
      bookingData.customerEmail = decodeEmail(bookingData.customerEmail);
      
      // Decode email penumpang juga
      if (bookingData.passengers) {
        bookingData.passengers = bookingData.passengers.map(passenger => ({
          ...passenger,
          email: decodeEmail(passenger.email || '')
        }));
      }
      
      console.log('📥 Raw booking data received (with decoded emails):', {
        bookingCode: bookingData.bookingCode,
        orderId: bookingData.orderId,
        passengerCount: bookingData.passengerCount,
        customerEmail: bookingData.customerEmail,
        hasTrainDetail: !!bookingData.trainDetail,
        hasPassengers: bookingData.passengers?.length || 0,
        transitStation: bookingData.transitStation,
        transitDiscount: bookingData.transitDiscount,
        transitAdditionalPrice: bookingData.transitAdditionalPrice
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
    let passengersSaved = false;
    let ticketCreated = false;

    // Coba save ke database
    try {
      const insertionResult = await tryInsertBooking(preparedData);

      if (insertionResult.success) {
        savedBookingId = insertionResult.data.id;
        savedToDatabase = true;
        usedTable = insertionResult.tableUsed;
        insertionMethod = insertionResult.method;

        console.log(`✅ Successfully saved to ${usedTable}, ID: ${savedBookingId}`);

        // Simpan penumpang ke tabel terpisah
        const passengerSaveResult = await savePassengers(savedBookingId, bookingData.passengers);
        passengersSaved = passengerSaveResult.success;

        // Buat record tiket
        const ticketResult = await createTicketRecord(ids.bookingCode, ids.ticketNumber, bookingData);
        ticketCreated = ticketResult.success;

      } else {
        databaseError = insertionResult.error;
        console.warn('⚠️ Database insertion failed:', databaseError);
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
        passengersSaved,
        ticketCreated,
        usedTable: usedTable || 'none',
        insertionMethod: insertionMethod || 'fallback',
        trainName: bookingData.trainDetail?.trainName || 'Parahyangan',
        trainType: bookingData.trainDetail?.trainType || 'Ekonomi',
        origin: bookingData.trainDetail?.origin || 'Bandung',
        destination: bookingData.trainDetail?.destination || 'Gambir',
        departureDate: bookingData.trainDetail?.departureDate || new Date().toISOString().split('T')[0],
        departureTime: bookingData.trainDetail?.departureTime || '06:00',
        scheduleId: bookingData.trainDetail?.scheduleId || 'unknown',
        transitStation: bookingData.transitStation,
        transitDiscount: bookingData.transitDiscount || 0,
        transitAdditionalPrice: bookingData.transitAdditionalPrice || 0,
        seatPremium: bookingData.seatPremium || 0,
        adminFee: bookingData.adminFee || 5000,
        insuranceFee: bookingData.insuranceFee || 10000,
        basePrice: bookingData.basePrice || 265000,
        customerEmail: bookingData.customerEmail, // Email yang sudah di-decode
        hasDatabaseError: !!databaseError,
        databaseError: databaseError,
        emailStatus: 'decoded' // Tambahkan status email
      },
      message: savedToDatabase
        ? `Booking berhasil dibuat dan disimpan di ${usedTable}`
        : 'Booking berhasil dibuat (data disimpan di penyimpanan lokal)'
    };

    console.log('✅ Booking API response:', {
      bookingCode: responseData.data.bookingCode,
      saved: savedToDatabase,
      table: usedTable,
      passengersSaved,
      ticketCreated,
      email: responseData.data.customerEmail
    });

    // Simpan data untuk frontend
    const localStorageData = {
      ...bookingData,
      bookingId: savedBookingId,
      bookingCode: ids.bookingCode,
      orderId: ids.orderId,
      ticketNumber: ids.ticketNumber,
      savedToDatabase,
      passengersSaved,
      savedAt: new Date().toISOString(),
      responseData: responseData.data
    };

    console.log('💾 Booking data ready for client storage');

    // Tambahkan localStorage data ke response untuk client
    const enhancedResponse = {
      ...responseData,
      localStorageData,
      clientInstructions: 'Save this data to localStorage/sessionStorage on client side',
      emailProcessing: {
        note: 'Email addresses have been decoded for database storage'
      }
    };

    return NextResponse.json(enhancedResponse);

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

    return NextResponse.json(fallbackResponse, { status: 200 });
  }
}

// GET endpoint untuk health check dengan info email
export async function GET(request: NextRequest) {
  try {
    // Cek koneksi database
    let dbStatus = 'unknown';
    let tableCheck = {
      bookings_kereta: false,
      passengers: false,
      tickets: false
    };

    try {
      // Cek tabel bookings_kereta
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings_kereta')
        .select('count')
        .limit(1)
        .single();

      tableCheck.bookings_kereta = !bookingsError;

      // Cek tabel passengers
      const { error: passengersError } = await supabase
        .from('passengers')
        .select('id')
        .limit(1)
        .maybeSingle();

      tableCheck.passengers = passengersError?.message?.includes('does not exist') ? false : true;

      // Cek tabel tickets
      const { error: ticketsError } = await supabase
        .from('tickets')
        .select('id')
        .limit(1)
        .maybeSingle();

      tableCheck.tickets = ticketsError?.message?.includes('does not exist') ? false : true;

      dbStatus = 'connected';
    } catch (dbError) {
      dbStatus = 'error';
      console.error('Database check error:', dbError);
    }

    // Test email decoding
    const testEmail = 'reisanadrefa1%2540gmail.com';
    const decodedEmail = decodeEmail(testEmail);

    return NextResponse.json({
      status: 'healthy',
      endpoint: '/api/bookings/create',
      method: 'POST',
      database: {
        status: dbStatus,
        tables: tableCheck
      },
      email_decoding: {
        test: true,
        original_email: testEmail,
        decoded_email: decodedEmail,
        valid: decodedEmail.includes('@')
      },
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